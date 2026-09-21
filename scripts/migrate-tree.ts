/**
 * `npm run migrate <tree-folder>`: the conversion of an `elsa-tree/3` Tree folder into an
 * `elsa-tree/4` one, as docs/specs/tree-format.md 12.6 specifies it.
 *
 * Unlike the two conversions before it, this one is NOT textual: the shapes differ, so the
 * file is parsed and re-serialised (12.6.1). Every scalar is carried over unchanged but for
 * a block scalar's single trailing line break; the keys are written in the order of 3.7;
 * an absent key stays absent; and the result is written in the canonical byte form before
 * it is read back, validated against `schemas/elsa-tree-4.json` and the rules of section 7,
 * and only then is `tree.yaml` deleted. EVERY violation is printed; nothing is silenced.
 *
 * It is a one-time job. The YAML parser and the `yaml` dependency leave the repository with
 * the last Tree they read (12.6, issue #119); what survives here afterwards is the writer,
 * which re-serialises a `tree.json` in the canonical byte form and changes no byte of a
 * Tree that is already in it.
 *
 * Exit code 0 when the result validates, 1 otherwise.
 *
 * Runs with plain Node 22 (built-in type stripping), so no extra tool is needed.
 */
import { readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseAllDocuments } from 'yaml'
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
 * of them. A key absent here holds a string, or a list of strings, and is carried across.
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

const SCHEMA = '/schemas/elsa-tree-4.json'
const FORMAT = 'elsa-tree/4'

/** Numbers and booleans appear nowhere in the contract, but `metadata` is the author's bag (3.7). */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export interface Migration {
  /** False when the folder already held a `tree.json` and no `tree.yaml` (12.6.1). */
  converted: boolean
  /** The Node ids written, in the order they stood in the stream. */
  ids: string[]
  /** What stopped the job before anything was written: a parse failure, an all-digit key. */
  notes: string[]
  /** Every rule the written Tree breaks; empty when it is valid. */
  violations: Violation[]
}

/**
 * Converts the `elsa-tree/3` Tree in `dir` into `<dir>/tree.json` and validates the result
 * (12.6.1). `tree.yaml` is deleted only after the written file has been read back and
 * found valid. A folder that holds no `tree.yaml` is left alone: the conversion has
 * already run, and running it again does nothing and reports nothing.
 */
export async function migrateTree(dir: string): Promise<Migration> {
  const root = path.resolve(dir)
  const yaml = await readText(path.join(root, 'tree.yaml'))
  if (yaml === null) return { converted: false, ids: [], notes: [], violations: [] }

  const notes: string[] = []
  const tree = readStream(yaml, notes)
  if (!tree) return { converted: false, ids: [], notes, violations: [] }

  const languages = Array.isArray(tree.languages) ? (tree.languages as string[]) : []
  const written = canonical(tree, 'tree', languages, notes)
  if (notes.length > 0) return { converted: false, ids: [], notes, violations: [] }

  await writeFile(path.join(root, 'tree.json'), bytes(written), 'utf8')
  const violations = await validated(root)
  if (violations.length === 0) await rm(path.join(root, 'tree.yaml'))
  const nodes = written.nodes as Array<Record<string, Json>>
  return { converted: true, ids: nodes.map((node) => node.id as string), notes, violations }
}

/**
 * The canonical byte form of tree-format.md 3.7: `JSON.stringify(value, null, 2)` and one
 * line feed. Exported because it is what survives this script -- the writer the migration,
 * the validator and the editor of the next round have to agree on.
 */
export function bytes(tree: Record<string, Json>): string {
  return `${JSON.stringify(tree, null, 2)}\n`
}

/**
 * 12.6.1 steps 1 to 3: the YAML stream as one object. The first document becomes the
 * top-level fields, the rest become `nodes` in stream order; `format` becomes
 * `elsa-tree/4` and `$schema` is added. A document that fails to parse stops the job:
 * a re-serialisation cannot carry a syntax error across the way a concatenation could.
 */
function readStream(text: string, notes: string[]): Record<string, unknown> | null {
  const documents = parseAllDocuments(text)
  for (const [index, document] of documents.entries()) {
    const where = index === 0 ? 'manifest' : `document ${index}`
    if (document.errors.length > 0) notes.push(`${where}: ${document.errors[0]!.message}`)
  }
  if (notes.length > 0) return null
  if (documents.length < 2) {
    notes.push('the stream holds no manifest and at least one Node')
    return null
  }

  const manifest = documents[0]!.toJS() as Record<string, unknown>
  return {
    $schema: SCHEMA,
    ...manifest,
    format: FORMAT,
    nodes: documents.slice(1).map((document) => document.toJS() as Record<string, unknown>),
  }
}

/**
 * 12.6.1 steps 4 to 6 for one object: its keys in the order of 3.7, its values carried
 * across, absent keys left absent. A key this format does not define keeps its place at
 * the end rather than being dropped, so the written Tree fails V-KEYS for it as the input
 * would have -- the conversion reports, it does not edit.
 */
function canonical(value: Record<string, unknown>, name: ObjectName, languages: string[], notes: string[]): Record<string, Json> {
  const out: Record<string, Json> = {}
  const keys = ORDER[name] as readonly string[]
  for (const key of [...keys.filter((key) => key in value), ...Object.keys(value).filter((key) => !keys.includes(key))]) {
    out[key] = canonicalValue(key, value[key], languages, notes)
  }
  return out
}

function canonicalValue(key: string, value: unknown, languages: string[], notes: string[]): Json {
  const kind = VALUE[key]
  if (typeof value === 'string') return scalar(value)
  if (kind === undefined || value === null) return value as Json
  if (kind === 'text') return localised(value as Record<string, unknown>, languages)
  if (kind === 'metadata') return metadata(value as Record<string, unknown>, notes)
  if (typeof kind === 'object') {
    return (value as Array<Record<string, unknown>>).map((entry) => canonical(entry, kind.each, languages, notes))
  }
  return canonical(value as Record<string, unknown>, kind, languages, notes)
}

/**
 * 12.6.1 step 4: every scalar unchanged, but for a block scalar's single trailing line
 * break. Nothing is re-wrapped and nothing is trimmed inside; 3.8 step 1 already stripped
 * that break before measuring, so no text changes its counted length.
 */
function scalar(value: string): string {
  return value.endsWith('\n') ? value.slice(0, -1) : value
}

/** 12.6.1 step 5: a localised text lists its languages in the manifest's order. */
function localised(value: Record<string, unknown>, languages: string[]): Record<string, Json> {
  const order = [...languages.filter((lang) => lang in value), ...Object.keys(value).filter((lang) => !languages.includes(lang))]
  return Object.fromEntries(order.map((lang) => [lang, scalar(String(value[lang]))]))
}

/**
 * 12.6.1 step 5: `metadata` keeps `version` first and the author's remaining keys in the
 * order they were written. A key made only of digits stops the job: a JavaScript object
 * sorts it in front of every other key, so the order above would not survive a read and a
 * write, and a conversion that renamed it would be a conversion that edits content.
 */
function metadata(value: Record<string, unknown>, notes: string[]): Record<string, Json> {
  const out: Record<string, Json> = {}
  for (const key of ['version', ...Object.keys(value).filter((key) => key !== 'version')]) {
    if (/^[0-9]+$/.test(key)) {
      notes.push(`metadata: the key "${key}" is made only of digits, which elsa-tree/4 refuses (V-META); write "note-${key}" instead`)
      continue
    }
    if (key in value) out[key] = typeof value[key] === 'string' ? scalar(value[key]) : (value[key] as Json)
  }
  return out
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

async function readText(file: string): Promise<string | null> {
  return readFile(file, 'utf8').catch(() => null)
}

/** The report: one line per note, one per violation, then one line of summary. */
function report(treeId: string, migration: Migration): void {
  for (const note of migration.notes) console.error(`${treeId}  ${note}`)
  for (const violation of migration.violations) console.error(formatViolation(treeId, violation))
  if (!migration.converted && migration.notes.length === 0) {
    console.log(`${treeId}: nothing to do; the Tree is already elsa-tree/4`)
    return
  }
  const counts = new Map<string, number>()
  for (const violation of migration.violations) counts.set(violation.rule, (counts.get(violation.rule) ?? 0) + 1)
  const summary = [...counts].map(([rule, count]) => `${count} ${rule}`).join(', ')
  const wrote = migration.converted ? `${migration.ids.length} Nodes written` : 'nothing written'
  console.log(`${treeId}: elsa-tree/3 to ${FORMAT}, ${wrote}; ${summary || 'valid'}`)
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
