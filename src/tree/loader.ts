/**
 * The Tree loader: the one seam between Tree data on disk and what a page renders
 * (docs/specs/application.md section 5.1, ADR-5-lazy-loading). `openTree` reads and
 * validates a whole folder once; afterwards `getNode` reads exactly one file.
 *
 * Imports carry `.ts` extensions because scripts/validate.ts runs this module with plain
 * Node, which does not resolve extensionless TypeScript imports.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import type { Image, LocalisedText, Manifest, Node, Option, Outcome, Source, Violation } from './types.ts'
import { isId, isImageFile, isMapping, nodeKind, validateTree, type Mapping, type RawTree } from './validate.ts'

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
 * One violation as one line: `tree-id  file  key.path  RULE  message`. The message is
 * folded onto that line because a YAML parser error arrives with its own line breaks.
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
   * Reads exactly one Node file. Null for a malformed or unknown id, without touching the
   * file system. Rejects only if a validated file has disappeared since `openTree`.
   */
  getNode(id: string): Promise<Node | null>
  /** From the in-memory index built at `openTree`; no file read. */
  getTitle(id: string): LocalisedText | null
  /** Absolute path inside this Tree's `images/`; null for a malformed or missing name. */
  imagePath(file: string): string | null
}

/**
 * Reads and validates the Tree folder `dir` once (tree-format.md section 7) and builds the
 * title index. Rejects with `TreeInvalid` listing every violation.
 */
export async function openTree(dir: string): Promise<Tree> {
  const root = path.resolve(dir)
  const id = path.basename(root)
  const violations: Violation[] = []
  const raw = await readFolder(root, id, violations)
  if (raw) violations.push(...validateTree(raw))
  if (!raw || violations.length > 0) throw new TreeInvalid(id, violations)

  // Every cast below is backed by the validation that just passed.
  const titles = new Map<string, LocalisedText>()
  for (const [nodeId, node] of raw.nodes) titles.set(nodeId, node!.title as LocalisedText)
  const manifest = toManifest(raw.manifest!)

  return {
    id,
    manifest,
    async getNode(nodeId) {
      if (!isId(nodeId) || !titles.has(nodeId)) return null
      const text = await readFile(path.join(root, 'nodes', `${nodeId}.yaml`), 'utf8')
      return toNode(nodeId, parse(text) as Mapping)
    },
    getTitle: (nodeId) => titles.get(nodeId) ?? null,
    imagePath: (file) => (isImageFile(file) && raw.images.has(file) ? path.join(root, 'images', file) : null),
  }
}

/** Reads the folder into parsed mappings, reporting V-DIR, V-YAML and bad Node file names. */
async function readFolder(root: string, id: string, violations: Violation[]): Promise<RawTree | null> {
  const fail = (file: string, rule: string, message: string): void => {
    violations.push({ file, keyPath: '', rule, message })
  }
  const manifestText = await readText(path.join(root, 'tree.yaml'))
  const nodeFiles = (await listFiles(path.join(root, 'nodes'))).filter((name) => name.endsWith('.yaml'))
  if (!isId(id)) fail('', 'V-DIR', `folder name "${id}" is not an id: lowercase letters, digits and single hyphens`)
  if (manifestText === null) fail('tree.yaml', 'V-DIR', 'tree.yaml is missing')
  if (nodeFiles.length === 0) fail('nodes/', 'V-DIR', 'nodes/ must contain at least one Node file')
  if (violations.length > 0) return null

  const nodes = new Map<string, Mapping | null>()
  for (const name of nodeFiles) {
    const nodeId = name.slice(0, -'.yaml'.length)
    if (!isId(nodeId)) {
      fail(`nodes/${name}`, 'V-NODE', `file name must be <id>.yaml; "${nodeId}" is not an id`)
      continue
    }
    nodes.set(nodeId, parseMapping((await readText(path.join(root, 'nodes', name))) ?? '', `nodes/${name}`, violations))
  }
  return {
    id,
    manifest: parseMapping(manifestText!, 'tree.yaml', violations),
    nodes,
    images: new Set(await listFiles(path.join(root, 'images'))),
  }
}

/** V-YAML: parses as YAML 1.2 into a mapping at the top level. */
function parseMapping(text: string, file: string, violations: Violation[]): Mapping | null {
  try {
    const value: unknown = parse(text)
    if (isMapping(value)) return value
    violations.push({ file, keyPath: '', rule: 'V-YAML', message: 'the top level must be a mapping' })
  } catch (error) {
    violations.push({ file, keyPath: '', rule: 'V-YAML', message: (error as Error).message })
  }
  return null
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

function toManifest(raw: Mapping): Manifest {
  const languages = raw.languages as string[]
  return {
    format: 'elsa-tree/1',
    languages,
    defaultLanguage: languages[0]!,
    root: raw.root as string,
    title: raw.title as LocalisedText,
    description: raw.description as LocalisedText | undefined,
    metadata: raw.metadata as Manifest['metadata'],
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
