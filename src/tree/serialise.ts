/**
 * The canonical byte form of docs/specs/tree-format.md 3.7, and its one writer: the key
 * order of every object the format defines, the languages in the manifest's order, and
 * `JSON.stringify(value, null, 2)` with one line feed. The migration (`npm run migrate`)
 * and the store (ADR-132-draft-and-publish, decision 1) both write through it, so a draft,
 * a published copy and a migrated file agree on the bytes.
 *
 * Imports carry `.ts` extensions because scripts/migrate-tree.ts runs this module with
 * plain Node.
 */

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

export type ObjectName = keyof typeof ORDER

/**
 * What the value of each key is, so the walk knows where to go on. One table serves the
 * whole format because no key name means two things in it: `description` is a localised
 * text wherever it occurs, `source` is always the id of a Source, `sources` always a list
 * of them. A key absent here holds a string, or a list of strings, and is written as it is.
 */
export const VALUE: Record<string, 'text' | 'metadata' | ObjectName | { each: ObjectName }> = {
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
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

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
 * A Tree file's text in the canonical byte form: `tree`, the parsed `tree.json`, with every
 * object in the key order of 3.7 and every localised text in the order its `languages`
 * declares. Writing a Tree that was just read changes no byte.
 */
export function treeBytes(tree: Record<string, unknown>): string {
  const languages = Array.isArray(tree.languages) ? (tree.languages as string[]) : []
  return bytes(canonical(tree, 'tree', languages))
}

/**
 * One object with its keys in the order of 3.7 and its values carried across; an absent
 * key stays absent. A key this format does not define keeps its place at the end rather
 * than being dropped, so the written Tree fails V-KEYS for it as the input did -- the
 * writer reports, it does not edit.
 */
export function canonical(value: Record<string, unknown>, name: ObjectName, languages: string[]): Record<string, Json> {
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
