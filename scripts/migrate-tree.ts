/**
 * `npm run migrate <tree-folder>`: writes a Tree's `tree.json` in the canonical byte form
 * of docs/specs/tree-format.md 3.7 and validates the result.
 *
 * This is what is left of the migration of section 12 after issue #119 ran it. Its steps 5
 * to 9 -- the key order, the byte form, the read-back and the validation -- are these; its
 * steps 1 to 4, which parsed a `tree.yaml`, went with the parser, and a Tree still written
 * in `elsa-tree/1`, `/2` or `/3` is converted with the last release that read YAML and
 * then by 12.6. No Tree in this repository is in that state.
 *
 * What it is for now is the contract of 3.7 made runnable: **writing a Tree that was just
 * read changes no byte**, so a Tree the editor of the next round rewrites has a diff that
 * shows the fields that changed and nothing else. Run on a Tree already in the byte form,
 * it writes the same bytes and reports that it did.
 *
 * Exit code 0 when the written Tree validates, 1 otherwise.
 *
 * Runs with plain Node 22 (built-in type stripping), so no extra tool is needed.
 */
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { formatViolation, openTree, TreeInvalid } from '../src/tree/loader.ts'
import type { Violation } from '../src/tree/types.ts'

/**
 * The key order of every object this format defines (tree-format.md 3.7): the order of its
 * table in sections 4 and 5, not alphabetical.
 */
const ORDER = {
  tree: ['$schema', 'format', 'languages', 'root', 'title', 'description', 'metadata', 'theme', 'nodes'],
  node: ['id', 'title', 'description', 'metadata', 'sources', 'images', 'answers', 'options', 'explainers', 'terminal'],
  theme: ['logo', 'fonts', 'colours'],
  logo: ['light', 'dark', 'icon', 'alt', 'url'],
  fontFamily: ['family', 'role', 'files', 'licence'],
  fontFile: ['file', 'weight', 'style'],
  colours: ['background', 'surface', 'text', 'text-muted', 'accent', 'accent-secondary', 'danger'],
  source: ['id', 'kind', 'label', 'url'],
  image: ['file', 'description', 'credit', 'source'],
  answers: ['yes', 'no'],
  option: ['title', 'target'],
  explainer: ['id', 'term', 'text'],
  terminal: ['outcome'],
} as const satisfies Record<string, readonly string[]>

type ObjectName = keyof typeof ORDER

/**
 * What the value of each key is, so the walk knows where to go on. One table serves the
 * whole format because no key name means two things in it: `description` is a localised
 * text wherever it occurs, `source` is always the id of a Source, `sources` always a list
 * of them. A key absent here holds a string, or a list of strings, and is written as it is.
 */
const VALUE: Record<string, 'text' | 'metadata' | ObjectName | { each: ObjectName }> = {
  title: 'text',
  description: 'text',
  label: 'text',
  alt: 'text',
  term: 'text',
  text: 'text',
  metadata: 'metadata',
  theme: 'theme',
  logo: 'logo',
  colours: 'colours',
  answers: 'answers',
  terminal: 'terminal',
  nodes: { each: 'node' },
  sources: { each: 'source' },
  images: { each: 'image' },
  options: { each: 'option' },
  explainers: { each: 'explainer' },
  fonts: { each: 'fontFamily' },
  files: { each: 'fontFile' },
}

/** Numbers and booleans appear nowhere in the contract, but `metadata` is the author's bag (3.7). */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export interface Migration {
  /** False when the file was already in the canonical byte form: nothing was written. */
  rewritten: boolean
  /** The Node ids written, in the order they stand in `nodes`. */
  ids: string[]
  /** What stopped the job before anything was written: a file that is not a Tree file. */
  notes: string[]
  /** Every rule the written Tree breaks; empty when it is valid. */
  violations: Violation[]
}

/**
 * Rewrites `<dir>/tree.json` in the canonical byte form and validates the result: the
 * schema of 3.9, then the rules of section 7, every violation reported. The file is read
 * back through `openTree`, as 12.6.1 step 8 asks, so what is reported is what the server
 * would report at start.
 */
export async function migrateTree(dir: string): Promise<Migration> {
  const file = path.join(path.resolve(dir), 'tree.json')
  const before = await readFile(file, 'utf8').catch(() => null)
  if (before === null) return { rewritten: false, ids: [], notes: [`${path.basename(file)} is missing`], violations: [] }

  let parsed: unknown
  try {
    parsed = JSON.parse(before)
  } catch (error) {
    return { rewritten: false, ids: [], notes: [(error as SyntaxError).message], violations: [] }
  }

  const tree = parsed as Record<string, unknown>
  const languages = Array.isArray(tree.languages) ? (tree.languages as string[]) : []
  const after = bytes(canonical(tree, 'tree', languages))
  if (after !== before) await writeFile(file, after, 'utf8')

  const nodes = Array.isArray(tree.nodes) ? (tree.nodes as Array<Record<string, unknown>>) : []
  return {
    rewritten: after !== before,
    ids: nodes.map((node) => String(node.id)),
    notes: [],
    violations: await validated(path.dirname(file)),
  }
}

/**
 * The canonical byte form of tree-format.md 3.7: the value as `JSON.stringify(value,
 * null, 2)` writes it, followed by one line feed. That form is chosen because every
 * mainstream language's standard library produces it from the same value, so the
 * migration, the validator and an editor agree on the bytes without agreeing on a library.
 */
export function bytes(tree: Record<string, Json>): string {
  return `${JSON.stringify(tree, null, 2)}\n`
}

/**
 * One object with its keys in the order of 3.7 and its values carried across; an absent
 * key stays absent. A key this format does not define keeps its place at the end rather
 * than being dropped, so the written Tree fails V-KEYS for it as the input did -- the
 * writer reports, it does not edit.
 */
function canonical(value: Record<string, unknown>, name: ObjectName, languages: string[]): Record<string, Json> {
  const out: Record<string, Json> = {}
  const keys = ORDER[name] as readonly string[]
  const own = Object.keys(value)
  for (const key of [...keys.filter((key) => own.includes(key)), ...own.filter((key) => !keys.includes(key))]) {
    out[key] = canonicalValue(key, value[key], languages)
  }
  return out
}

function canonicalValue(key: string, value: unknown, languages: string[]): Json {
  const kind = VALUE[key]
  if (kind === undefined || value === null || typeof value !== 'object') return value as Json
  if (kind === 'text') return localised(value as Record<string, unknown>, languages)
  if (kind === 'metadata') return metadata(value as Record<string, unknown>)
  if (typeof kind === 'object') {
    return (value as Array<Record<string, unknown>>).map((entry) => canonical(entry, kind.each, languages))
  }
  return canonical(value as Record<string, unknown>, kind, languages)
}

/** 3.7: a localised text lists its languages in the order the manifest declares them. */
function localised(value: Record<string, unknown>, languages: string[]): Record<string, Json> {
  const own = Object.keys(value)
  const order = [...languages.filter((lang) => own.includes(lang)), ...own.filter((lang) => !languages.includes(lang))]
  return Object.fromEntries(order.map((lang) => [lang, value[lang] as Json]))
}

/**
 * 3.7: inside `metadata`, `version` comes first and the author's own keys keep the order
 * they were written in. A key made only of digits is refused by V-META, and this is why:
 * a JavaScript object sorts an integer-like key in front of every other, so the order
 * above would not survive a read and a write, and the idempotence below would fail on a
 * file whose author did nothing wrong. It is left in place for the schema to report.
 */
function metadata(value: Record<string, unknown>): Record<string, Json> {
  const keys = Object.keys(value)
  const order = keys.includes('version') ? ['version', ...keys.filter((key) => key !== 'version')] : keys
  return Object.fromEntries(order.map((key) => [key, value[key] as Json]))
}

/** 12.6.1 step 8: every violation the loader finds in the written Tree. */
async function validated(dir: string): Promise<Violation[]> {
  try {
    await openTree(dir)
    return []
  } catch (error) {
    if (error instanceof TreeInvalid) return error.violations
    throw error
  }
}

/** The report: one line per note, one per violation, then one line of summary. */
function report(treeId: string, migration: Migration): void {
  for (const note of migration.notes) console.error(`${treeId}  ${note}`)
  for (const violation of migration.violations) console.error(formatViolation(treeId, violation))
  if (migration.notes.length > 0) return
  const counts = new Map<string, number>()
  for (const violation of migration.violations) counts.set(violation.rule, (counts.get(violation.rule) ?? 0) + 1)
  const summary = [...counts].map(([rule, count]) => `${count} ${rule}`).join(', ')
  const wrote = migration.rewritten ? 'rewritten' : 'already in the canonical byte form'
  console.log(`${treeId}: ${migration.ids.length} Nodes, ${wrote}; ${summary || 'valid'}`)
}

async function main(): Promise<void> {
  const dir = process.argv[2]
  if (!dir) {
    console.error('usage: npm run migrate <tree-folder>')
    process.exit(2)
  }
  if (!(await stat(dir).catch(() => null))?.isDirectory()) {
    console.error(`${dir} is not a folder`)
    process.exit(2)
  }
  const migration = await migrateTree(dir)
  report(path.basename(path.resolve(dir)), migration)
  process.exit(migration.notes.length === 0 && migration.violations.length === 0 ? 0 : 1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
