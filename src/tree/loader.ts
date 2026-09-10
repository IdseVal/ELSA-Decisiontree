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
import { LineCounter, parseAllDocuments } from 'yaml'
import type { Image, LocalisedText, Manifest, Node, Option, Outcome, Source, Theme, Violation } from './types.ts'
import {
  isId,
  isImageFile,
  isMapping,
  isThemeFile,
  nodeKind,
  validateTree,
  type Mapping,
  type RawNode,
  type RawTree,
} from './validate.ts'

/** The id line the migration writes first in every Node document (tree-format.md 3.7). */
const ID_LINE = /^id:[ \t]*(\S+)/m

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
 * `manifest` or the Node's id. The message is folded onto that line because a YAML parser
 * error arrives with its own line breaks.
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
  const manifest = toManifest(raw.manifest!)
  const nodes = new Map<string, Node>()
  for (const node of raw.nodes) nodes.set(node.id!, toNode(node.id!, node.document!))
  const themeReferences = referencedThemeFiles(manifest.theme)

  return {
    id,
    manifest,
    getNode: async (nodeId) => (isId(nodeId) ? (nodes.get(nodeId) ?? null) : null),
    getTitle: (nodeId) => nodes.get(nodeId)?.title ?? null,
    imagePath: (file) => (isImageFile(file) && raw.images.has(file) ? path.join(root, 'images', file) : null),
    themePath: (file) =>
      isThemeFile(file) && themeReferences.has(file) && raw.themeFiles.has(file)
        ? path.join(root, 'theme', file)
        : null,
  }
}

/** Reads and parses the Tree folder, reporting V-DIR and V-YAML. */
async function readTree(root: string, id: string, violations: Violation[]): Promise<RawTree | null> {
  const fail = (where: string, rule: string, message: string): void => {
    violations.push({ file: where, keyPath: '', rule, message })
  }
  const text = await readText(path.join(root, 'tree.yaml'))
  if (!isId(id)) fail('', 'V-DIR', `folder name "${id}" is not an id: lowercase letters, digits and single hyphens`)
  if (text === null) fail('tree.yaml', 'V-DIR', 'tree.yaml is missing')
  for (const folder of ['images', 'theme']) {
    if (await isFile(path.join(root, folder))) fail(folder, 'V-DIR', `${folder} must be a folder, not a file`)
  }
  if (violations.length > 0) return null

  const { manifest, nodes } = readStream(text!, violations)
  return {
    id,
    manifest,
    nodes,
    images: new Set(await listFiles(path.join(root, 'images'))),
    themeFiles: new Set(await listFiles(path.join(root, 'theme'))),
  }
}

/**
 * V-YAML: `tree.yaml` as a YAML 1.2 stream whose first document is the manifest and whose
 * others are Nodes. A document that fails to parse is reported with its line number and
 * skipped; the rest are still read (tree-format.md 3.7).
 */
function readStream(text: string, violations: Violation[]): { manifest: Mapping | null; nodes: RawNode[] } {
  const lineCounter = new LineCounter()
  const documents = parseAllDocuments(text, { lineCounter })
  if (documents.length === 0) {
    violations.push({ file: 'manifest', keyPath: '', rule: 'V-YAML', message: 'tree.yaml holds no YAML document' })
    return { manifest: null, nodes: [] }
  }

  const nodes: RawNode[] = []
  let manifest: Mapping | null = null
  documents.forEach((document, index) => {
    const parsed = toMapping(document)
    // The id is what a violation is reported under, so it is recovered from the text when
    // the document did not parse -- the migration writes it on its own line (3.7).
    const source = text.slice(document.range[0], document.range[2])
    const id = index === 0 ? null : ((parsed && isId(parsed.id) ? parsed.id : recoverId(source)))
    const where = index === 0 ? 'manifest' : (id ?? `document at line ${lineCounter.linePos(document.range[0]).line}`)

    if (document.errors.length > 0) {
      violations.push({ file: where, keyPath: '', rule: 'V-YAML', message: document.errors[0]!.message })
    } else if (!parsed) {
      violations.push({ file: where, keyPath: '', rule: 'V-YAML', message: 'the top level of a document must be a mapping' })
    }
    if (index === 0) manifest = parsed
    else nodes.push({ id, where, document: parsed })
  })
  return { manifest, nodes }
}

/** The document as a mapping, or null when it did not parse or is not one. */
function toMapping(document: ReturnType<typeof parseAllDocuments>[number]): Mapping | null {
  if (document.errors.length > 0) return null
  const value: unknown = document.toJS()
  return isMapping(value) ? value : null
}

/** The `id:` line of a document that did not parse, so its violations still name the Node. */
function recoverId(source: string): string | null {
  const match = ID_LINE.exec(source)
  return match && isId(match[1]) ? match[1] : null
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
    format: 'elsa-tree/2',
    languages,
    defaultLanguage: languages[0]!,
    root: raw.root as string,
    title: raw.title as LocalisedText,
    description: raw.description as LocalisedText | undefined,
    metadata: raw.metadata as Manifest['metadata'],
    theme: raw.theme as Theme | undefined,
  }
}

function toNode(id: string, raw: Mapping): Node {
  const options = (raw.options as Array<Omit<Option, 'images'> & { images?: Image[] }> | undefined) ?? []
  const common = {
    id,
    title: raw.title as LocalisedText,
    description: raw.description as LocalisedText,
    metadata: raw.metadata as Node['metadata'],
    sources: (raw.sources as Source[] | undefined) ?? [],
    images: (raw.images as Image[] | undefined) ?? [],
    options: options.map((option) => ({ ...option, images: option.images ?? [] })),
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
