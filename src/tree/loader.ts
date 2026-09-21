/**
 * The Tree loader: the one seam between Tree data on disk and what a page renders
 * (docs/specs/application.md section 5.1, ADR-38-neighbourhood). `openTree` reads and
 * validates the Tree's one file once and indexes it; afterwards `getNode` is a lookup and
 * reads nothing. A page still receives one Node, never the Tree.
 *
 * Imports carry `.ts` extensions because scripts/validate.ts runs this module with plain
 * Node, which does not resolve extensionless TypeScript imports.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type { Explainer, Image, LocalisedText, Manifest, Node, Option, Outcome, Source, Theme, Violation } from './types.ts'
import { isId, isImageFile, isMapping, isThemeFile, nodeKind, validateTree, type Mapping, type RawTree } from './validate.ts'

/**
 * Thrown by `openTree` for a Tree that breaks any validity rule; carries every violation.
 *
 * The fields are assigned in the body rather than declared as constructor parameter
 * properties: Node's built-in type stripping, which runs scripts/validate.ts, rejects those.
 */
export class TreeInvalid extends Error {
  readonly treeId: string
  readonly violations: Violation[]

  constructor(treeId: string, violations: Violation[]) {
    super(`Tree "${treeId}" is invalid:\n` + violations.map((v) => formatViolation(treeId, v)).join('\n'))
    this.name = 'TreeInvalid'
    this.treeId = treeId
    this.violations = violations
  }
}

/**
 * One violation as one line: `tree-id  where  key.path  RULE  message`, where `where` is
 * `manifest`, the Node's id or `tree.json`, and `key.path` is a JSON Pointer when the
 * schema is the one answering (tree-format.md section 7). The message is folded onto that
 * line because a parser error arrives with its own line breaks.
 */
export function formatViolation(treeId: string, v: Violation): string {
  const message = v.message.replace(/\s+/g, ' ').trim()
  return `${treeId}  ${v.file}  ${v.keyPath || '-'}  ${v.rule}  ${message}`
}

export interface Tree {
  /** The folder name. */
  readonly id: string
  readonly manifest: Manifest
  /**
   * One Node from the index built at `openTree`; no file read. Null for a malformed or
   * unknown id. A page may ask for at most seventeen (ADR-38-neighbourhood).
   */
  getNode(id: string): Promise<Node | null>
  /** From the in-memory title index; no file read. */
  getTitle(id: string): LocalisedText | null
  /**
   * **[#118]** Every Node id of the Tree, in the order the file lists them. Ids, not
   * Nodes: the bound of application.md 5.2 is on how many Nodes a *page* may carry, and
   * the sitemap of 16.2 needs the set of pages that exist, which is this list. A caller
   * that wants a Node still asks for it by id, one at a time.
   */
  nodeIds(): string[]
  /**
   * **[#118]** When the Tree's own file was last written, read once here at `openTree`
   * (5.4). `null` when it cannot be read; the sitemap's `<lastmod>` is left out rather
   * than guessed (16.2).
   */
  readonly lastModified: Date | null
  /**
   * **[#121]** Absolute path of the Tree's own file, the third file of a Tree beside
   * `imagePath` and `themePath`: what the dataset endpoint streams byte for byte (15.3).
   * A path, not Nodes, so nothing on this interface enumerates the Tree still (5.1).
   */
  readonly filePath: string
  /** Absolute path inside this Tree's `images/`; null for a malformed or missing name. */
  imagePath(file: string): string | null
  /**
   * Absolute path inside this Tree's `theme/`, and only for a file the Theme names: a
   * licence text sitting beside the fonts is not served (application.md 5.1).
   */
  themePath(file: string): string | null
}

/**
 * Reads and validates the Tree folder `dir` once (tree-format.md section 7) and builds the
 * Node and title indexes. Rejects with `TreeInvalid` listing every violation.
 */
export async function openTree(dir: string): Promise<Tree> {
  const root = path.resolve(dir)
  const id = path.basename(root)
  const violations: Violation[] = []
  const raw = await readTree(root, id, violations)
  if (raw) violations.push(...validateTree(raw))
  if (!raw || violations.length > 0) throw new TreeInvalid(id, violations)

  // Every cast below is backed by the validation that just passed.
  const manifest = toManifest(raw.tree)
  const nodes = new Map<string, Node>()
  for (const node of raw.tree.nodes as Mapping[]) nodes.set(node.id as string, toNode(node))
  const themeReferences = referencedThemeFiles(manifest.theme)

  return {
    id,
    manifest,
    lastModified: await lastModified(path.join(root, 'tree.json')),
    filePath: path.join(root, 'tree.json'),
    getNode: async (nodeId) => (isId(nodeId) ? (nodes.get(nodeId) ?? null) : null),
    getTitle: (nodeId) => nodes.get(nodeId)?.title ?? null,
    nodeIds: () => [...nodes.keys()],
    imagePath: (file) => (isImageFile(file) && raw.images.has(file) ? path.join(root, 'images', file) : null),
    themePath: (file) =>
      isThemeFile(file) && themeReferences.has(file) && raw.themeFiles.has(file)
        ? path.join(root, 'theme', file)
        : null,
  }
}

/** Reads and parses the Tree folder, reporting V-DIR and V-JSON. */
async function readTree(root: string, id: string, violations: Violation[]): Promise<RawTree | null> {
  const fail = (where: string, rule: string, message: string): void => {
    violations.push({ file: where, keyPath: '', rule, message })
  }
  const text = await readText(path.join(root, 'tree.json'))
  if (!isId(id)) fail('', 'V-DIR', `folder name "${id}" is not an id: lowercase letters, digits and single hyphens`)
  if (text === null) fail('tree.json', 'V-DIR', 'tree.json is missing')
  // The two names are spelled out rather than looped over: a `path.join` whose last segment
  // is a variable makes Turbopack trace the whole project into the standalone build.
  if (await isFile(path.join(root, 'images'))) fail('images', 'V-DIR', 'images must be a folder, not a file')
  if (await isFile(path.join(root, 'theme'))) fail('theme', 'V-DIR', 'theme must be a folder, not a file')
  if (violations.length > 0) return null

  const tree = parseTree(text!, violations)
  if (!tree) return null
  return {
    id,
    tree,
    images: new Set(await listFiles(path.join(root, 'images'))),
    themeFiles: new Set(await listFiles(path.join(root, 'theme'))),
  }
}

/** What `readTreeText` answers: the value the text holds, or why it may not be read at all. */
export type TreeText = { value: unknown; problem: null } | { value: null; problem: string }

/**
 * May this text be read as a Tree's `tree.json`, and what does it hold? The three things
 * that forbid it are a byte-order mark, a syntax error and a duplicate key; `problem` is
 * the V-JSON message for the one found first, and `value` is what `JSON.parse` returned
 * when there is none.
 *
 * It is exported because the loader is not the only reader of these bytes: the writer of
 * 12.6.1 asks the same question of the same text before it rewrites the only copy of the
 * file, and a duplicate key is exactly the malformation a parsed value no longer shows
 * (3.7). One answer to "may this text be read", not two that can drift apart.
 *
 * The duplicate scan reads the bytes, so it runs only after `JSON.parse` has said they are
 * well formed: on an unterminated string it would read past the end of the text.
 */
export function readTreeText(text: string): TreeText {
  if (text.startsWith('\uFEFF')) {
    return { value: null, problem: 'tree.json begins with a byte-order mark; write it as UTF-8 without one' }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return { value: null, problem: (error as SyntaxError).message }
  }
  const duplicate = duplicateKey(text)
  if (duplicate) {
    const { key, line, column } = duplicate
    return { value: null, problem: `the key "${key}" appears twice in one object, at line ${line} column ${column}` }
  }
  return { value: parsed, problem: null }
}

/**
 * V-JSON: `tree.json` as one JSON object (RFC 8259) in UTF-8 without a byte-order mark and
 * with no duplicate key. One JSON file is one document, so a syntax error anywhere is a
 * syntax error everywhere: nothing else is checked and the Tree is not loaded
 * (tree-format.md 7, and 12.6.3 on what that changes against the document stream of /3).
 */
function parseTree(text: string, violations: Violation[]): Mapping | null {
  const fail = (message: string): null => {
    violations.push({ file: 'tree.json', keyPath: '', rule: 'V-JSON', message })
    return null
  }
  const { value, problem } = readTreeText(text)
  if (problem !== null) return fail(problem)
  if (!isMapping(value)) return fail('the whole file must be one JSON object, not an array or a bare value')
  return value
}

/**
 * The first key repeated inside one object, with its position, or null when there is none.
 *
 * This is the one rule of the format that reads the bytes rather than the value, because a
 * standard parser cannot see it: `JSON.parse('{"a":1,"a":2}')` returns `{a: 2}` without
 * complaint and a reviver is called once, after the loss (tree-format.md 3.7). The scan is
 * one pass that tracks whether it is inside a string, which containers are open, and which
 * keys the innermost object has already seen. It runs on text that has already parsed, so
 * it may assume the structure is well formed.
 */
function duplicateKey(text: string): { key: string; line: number; column: number } | null {
  // One entry per open container: the keys seen so far, or null for an array, which has none.
  const open: Array<Set<string> | null> = []
  let name: string | null = null
  let at = 0
  for (let i = 0; i < text.length; i += 1) {
    const character = text[i]
    if (character === '"') {
      const start = i
      for (i += 1; text[i] !== '"'; i += 1) if (text[i] === '\\') i += 1
      name = characters(text.slice(start + 1, i))
      at = start
    } else if (character === '{' || character === '[') {
      open.push(character === '{' ? new Set() : null)
      name = null
    } else if (character === '}' || character === ']') {
      open.pop()
      name = null
    } else if (character === ':') {
      const keys = open[open.length - 1]
      // `name` holds the string just read; before a colon that string is this object's key.
      if (keys && name !== null) {
        if (keys.has(name)) return { key: name, ...position(text, at) }
        keys.add(name)
      }
      name = null
    }
  }
  return null
}

/**
 * A JSON string's characters, so that `"a"` and `"a"` count as the same key. `raw` is the
 * text between one string's quotes in a file that has already parsed, so it is a JSON
 * string body and nothing else: the parse below cannot fail.
 */
function characters(raw: string): string {
  return JSON.parse(`"${raw}"`) as string
}

/** The one-based line and column of `offset`, for a message a person can act on. */
function position(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, offset)
  const lineStart = before.lastIndexOf('\n') + 1
  return { line: before.split('\n').length, column: offset - lineStart + 1 }
}

async function readText(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8')
  } catch {
    return null
  }
}

/** Plain files directly inside `dir`; sub-folders are not read (tree-format.md section 2). */
async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  } catch {
    return []
  }
}

/** The Tree file's modification time, or null when it cannot be read (application.md 16.2). */
async function lastModified(file: string): Promise<Date | null> {
  try {
    return (await stat(file)).mtime
  } catch {
    return null
  }
}

async function isFile(file: string): Promise<boolean> {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

/** The theme files the Theme names: what `themePath` may resolve (application.md 5.1). */
function referencedThemeFiles(theme: Theme | undefined): Set<string> {
  const files = new Set<string>()
  if (!theme) return files
  for (const file of [theme.logo?.light, theme.logo?.dark, theme.logo?.icon]) {
    if (file) files.add(file)
  }
  for (const family of theme.fonts ?? []) {
    for (const face of family.files) files.add(face.file)
  }
  return files
}

function toManifest(raw: Mapping): Manifest {
  const languages = raw.languages as string[]
  return {
    format: 'elsa-tree/4',
    languages,
    defaultLanguage: languages[0]!,
    root: raw.root as string,
    title: raw.title as LocalisedText,
    description: raw.description as LocalisedText | undefined,
    metadata: raw.metadata as Manifest['metadata'],
    theme: raw.theme as Theme | undefined,
  }
}

function toNode(raw: Mapping): Node {
  const common = {
    id: raw.id as string,
    title: raw.title as LocalisedText,
    description: raw.description as LocalisedText,
    metadata: raw.metadata as Node['metadata'],
    sources: (raw.sources as Source[] | undefined) ?? [],
    images: (raw.images as Image[] | undefined) ?? [],
    options: (raw.options as Option[] | undefined) ?? [],
    explainers: (raw.explainers as Explainer[] | undefined) ?? [],
  }
  switch (nodeKind(raw)) {
    case 'question':
      return { ...common, kind: 'question', answers: raw.answers as { yes: string; no: string } }
    case 'terminal':
      return { ...common, kind: 'terminal', outcome: (raw.terminal as { outcome: Outcome }).outcome }
    case 'explanation':
      return { ...common, kind: 'explanation' }
  }
}
