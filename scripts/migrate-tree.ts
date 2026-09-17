/**
 * `npm run migrate <old-folder> <new-folder-or-tree.yaml>`: the mechanical conversion of an
 * older Tree folder into an `elsa-tree/3` Tree, as docs/specs/tree-format.md section 12
 * specifies it -- an `elsa-tree/1` folder of Node files (12.1, ADR-37-migration) or an
 * `elsa-tree/2` file (12.5, ADR-78-explainers, ADR-78-fan-out-and-option-picture).
 *
 * The conversion is TEXTUAL: nothing is parsed and re-serialised, so every comment, every
 * line break and every quoting choice survives, and a file that does not parse is carried
 * over to fail the same rule it failed before. The YAML parser is used only to find where
 * an Option's Images are written. The converted Tree is then validated and EVERY violation
 * is printed; nothing is shortened and nothing is silenced.
 *
 * Exit code 0 when the result validates -- for an `elsa-tree/1` input, when the only
 * violations are the content rules its length limits added (V-LENGTH, V-LINES, V-COUNT)
 * -- and 1 otherwise.
 *
 * Runs with plain Node 22 (built-in type stripping), so no extra tool is needed.
 */
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { isMap, isScalar, isSeq, parseAllDocuments, type Pair, type YAMLMap, type YAMLSeq } from 'yaml'
import { formatViolation, openTree, TreeInvalid } from '../src/tree/loader.ts'
import type { Violation } from '../src/tree/types.ts'

const FORMAT_LINE_1 = /^format:[ \t]*elsa-tree\/1[ \t]*(#.*)?$/
const FORMAT_LINE_2 = /^format:[ \t]*elsa-tree\/2[ \t]*(#.*)?$/
const ROOT_LINE = /^root:[ \t]*(\S+)/
const DOCUMENT_START = /^---[ \t]*(#.*)?$/

/** The rules an `elsa-tree/1` Tree may still break after a faithful conversion (12.2). */
const CONTENT_RULES: readonly string[] = ['V-LENGTH', 'V-LINES', 'V-COUNT']

export interface Migration {
  /** The format the input was written in, told apart by its layout: `nodes/` is `elsa-tree/1`. */
  from: 'elsa-tree/1' | 'elsa-tree/2'
  /** The Node ids written, in the order they stand in the file. */
  ids: string[]
  /** How many documents the written file parses back into: the manifest plus the Nodes. */
  documents: number
  /** What could not be converted mechanically, in the words section 12 gives them. */
  notes: string[]
  /** What step 2 of 12.5 did with each Option's Images, for the author to act on. */
  reports: string[]
  /** Every rule the converted Tree breaks; empty when it is valid. */
  violations: Violation[]
}

/**
 * Converts the Tree in `inDir` into `out` (a Tree folder, or the path of the `tree.yaml` to
 * write) and validates the result. For an `elsa-tree/1` Tree converted in place, deletes
 * `<in>/nodes/` only when the file it was replaced by parses back into one document per
 * Node file (12.1 step 7).
 */
export async function migrateTree(inDir: string, out: string): Promise<Migration> {
  const source = path.resolve(inDir)
  const outFile = out.endsWith('.yaml') ? path.resolve(out) : path.join(path.resolve(out), 'tree.yaml')
  const target = path.dirname(outFile)
  const notes: string[] = []
  const reports: string[] = []

  const nodeFiles = await listNodeFiles(source)
  const from = nodeFiles === null ? 'elsa-tree/2' : 'elsa-tree/1'
  const written =
    nodeFiles === null
      ? rewriteFormat(await readFile(path.join(source, 'tree.yaml'), 'utf8').catch(() => ''), FORMAT_LINE_2, notes)
      : await joinNodeFiles(source, nodeFiles, notes)
  const text = moveOptionPictures(written, reports)

  await mkdir(target, { recursive: true })
  await writeFile(outFile, text, 'utf8')
  if (target !== source) await copyAssets(source, target)

  // Parse the result back and report what the loader would report (12.1 step 6, 12.5 step 4).
  const documents = parseAllDocuments(text)
  const ids = documents.slice(1).flatMap((document) => {
    const id: unknown = isMap(document.contents) ? document.contents.get('id') : undefined
    return typeof id === 'string' ? [id] : []
  })
  const violations = await validated(target)
  if (nodeFiles !== null && target === source) {
    if (documents.length === nodeFiles.length + 1) await rm(path.join(source, 'nodes'), { recursive: true, force: true })
    else notes.push(`nodes/ kept: the written file holds ${documents.length} documents, not ${nodeFiles.length + 1}`)
  }
  return { from, ids, documents: documents.length, notes, reports, violations }
}

/**
 * 12.1 steps 1 to 5: the manifest and the Node files of an `elsa-tree/1` folder as one
 * stream, the root's Node first, its format line naming `elsa-tree/3` directly.
 */
async function joinNodeFiles(source: string, nodeFiles: string[], notes: string[]): Promise<string> {
  const manifest = rewriteFormat(stripDocumentStart(await readTreeText(path.join(source, 'tree.yaml'))), FORMAT_LINE_1, notes)
  const rootFile = `${rootId(manifest)}.yaml`
  const ordered = nodeFiles.includes(rootFile) ? [rootFile, ...nodeFiles.filter((file) => file !== rootFile)] : nodeFiles

  let text = manifest === '' ? '' : `${manifest}\n`
  for (const file of ordered) {
    const id = file.slice(0, -'.yaml'.length)
    const body = stripDocumentStart(await readTreeText(path.join(source, 'nodes', file)))
    text += `\n--- # ${id}\nid: ${id}\n${body}\n`
  }
  return text
}

/** An `elsa-tree/1` file as text: without its byte-order mark and with `\n` line endings (12.1 step 5). */
async function readTreeText(file: string): Promise<string> {
  const text = await readFile(file, 'utf8').catch(() => '')
  return trimTrailingBlankLines(text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'))
}

function trimTrailingBlankLines(text: string): string {
  const lines = text.split('\n')
  while (lines.length > 0 && lines[lines.length - 1]!.trim() === '') lines.pop()
  return lines.join('\n')
}

/**
 * 12.1 step 1 and 12.5 step 1: the first line matching `formatLine` becomes
 * `format: elsa-tree/3`, keeping any comment. Every other line is left as it was.
 */
function rewriteFormat(text: string, formatLine: RegExp, notes: string[]): string {
  const lines = text.split('\n')
  const index = lines.findIndex((line) => formatLine.test(line.replace(/\r$/, '')))
  if (index === -1) {
    const old = formatLine === FORMAT_LINE_1 ? 'elsa-tree/1' : 'elsa-tree/2'
    if (text !== '') notes.push(`manifest: no "format: ${old}" line found`)
    return text
  }
  const line = lines[index]!
  const comment = formatLine.exec(line.replace(/\r$/, ''))![1]
  lines[index] = (comment ? `format: elsa-tree/3 ${comment}` : 'format: elsa-tree/3') + (line.endsWith('\r') ? '\r' : '')
  return lines.join('\n')
}

/** 12.1 steps 1 and 4: a leading `---` line belongs to the stream, not to the document's text. */
function stripDocumentStart(text: string): string {
  const lines = text.split('\n')
  if (DOCUMENT_START.test(lines[0] ?? '')) lines.shift()
  return lines.join('\n')
}

/** 12.1 step 2: the root id, so that its Node is written first. */
function rootId(manifest: string): string | null {
  const line = manifest.split('\n').find((candidate) => ROOT_LINE.test(candidate))
  return line ? ROOT_LINE.exec(line)![1]! : null
}

/**
 * 12.1 step 3: the Node files of an `elsa-tree/1` folder in byte order of file name --
 * `LC_ALL=C sort`, which is the same on Windows and on Linux, unlike what `ls` shows. Null
 * when the folder has no `nodes/`, which is what makes it an `elsa-tree/2` folder.
 */
async function listNodeFiles(source: string): Promise<string[] | null> {
  const entries = await readdir(path.join(source, 'nodes'), { withFileTypes: true }).catch(() => null)
  if (entries === null) return null
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
    .map((entry) => entry.name)
    .sort((a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')))
}

/** A Node document's parsed mapping and id, when it parsed. */
interface NodeDocument {
  id: string
  map: YAMLMap
}

/**
 * 12.5 step 2, one Option at a time until none carries Images: the Option's first Image
 * moves, as text, to the front of its target's `images`, and the Option's `images` block
 * goes. The text is parsed again after every move, so every offset used is current. An
 * Option whose target is not a Node keeps its Images, and V-KEYS reports them.
 */
function moveOptionPictures(text: string, reports: string[]): string {
  const kept = new Set<string>()
  for (;;) {
    const nodes = parseAllDocuments(text)
      .slice(1)
      .flatMap((document): NodeDocument[] => {
        const id: unknown = isMap(document.contents) && document.errors.length === 0 ? document.contents.get('id') : null
        return typeof id === 'string' ? [{ id, map: document.contents as YAMLMap }] : []
      })
    const found = nextOptionWithImages(nodes, kept)
    if (!found) return text
    const { node, index, option, images } = found
    const where = `${node.id}  options[${index}].images`
    const targetId: unknown = option.get('target')
    const targetNode = nodes.find((candidate) => candidate.id === targetId)
    if (!targetNode) {
      kept.add(`${node.id}:${index}`)
      reports.push(`${where}: "${String(targetId)}" is not a Node of this Tree; the Images are left where they are`)
      continue
    }
    images.value.items.slice(1).forEach((extra, i) => {
      const file = isMap(extra) ? String(extra.get('file')) : '?'
      reports.push(`${where}[${i + 1}]: ${file} is shown nowhere in elsa-tree/3; add it to the images of ${targetNode.id} if its Carousel should carry it`)
    })
    text = moveFirstImage(text, where, images, targetNode, reports)
  }
}

/** The first Option of any Node that still has an `images` key, and that key's pair. */
function nextOptionWithImages(
  nodes: NodeDocument[],
  kept: Set<string>,
): { node: NodeDocument; index: number; option: YAMLMap; images: Pair<unknown, YAMLSeq> } | null {
  for (const node of nodes) {
    const options = node.map.get('options')
    if (!isSeq(options)) continue
    for (const [index, option] of options.items.entries()) {
      if (!isMap(option) || kept.has(`${node.id}:${index}`)) continue
      const images = option.items.find((pair) => isScalar(pair.key) && pair.key.value === 'images')
      if (images && isSeq(images.value)) return { node, index, option, images: images as Pair<unknown, YAMLSeq> }
    }
  }
  return null
}

/**
 * One move of 12.5 step 2 on the text: the Option's `images` block is cut, and its first
 * Image, re-indented to the target's level and without a `source` the target cannot
 * resolve, is inserted as the target's first Image unless that is already the same file.
 */
function moveFirstImage(text: string, where: string, images: Pair<unknown, YAMLSeq>, target: NodeDocument, reports: string[]): string {
  const blockStart = lineStart(text, (images.key as { range: [number, number, number] }).range[0])
  const blockEnd = lineEnd(text, images.value!.range![2])
  const first = images.value!.items[0]
  const edits: Array<{ start: number; end: number; insert: string }> = [{ start: blockStart, end: blockEnd, insert: '' }]

  if (isMap(first)) {
    const file = String(first.get('file'))
    const targetImages = target.map.get('images')
    const targetFirst = isSeq(targetImages) ? targetImages.items[0] : undefined
    if (isMap(targetFirst) && targetFirst.get('file') === file) {
      reports.push(`${where}[0]: ${file} is already the first Image of ${target.id}; nothing moved`)
    } else {
      let item = text.slice(lineStart(text, first.range![0]), lineEnd(text, first.range![2]))
      item = dropUnresolvedSource(item, first, text, target, `${where}[0]`, reports)
      if (!item.endsWith('\n')) item += '\n'
      const from = dashColumn(item)
      if (isMap(targetFirst)) {
        const at = lineStart(text, targetFirst.range![0])
        edits.push({ start: at, end: at, insert: indent(item, dashColumn(text.slice(at)) - from) })
      } else {
        // No `images` on the target: the key is created after its `metadata` (12.5 step 2).
        const metadata = target.map.items.find((pair) => isScalar(pair.key) && pair.key.value === 'metadata')
        const at = metadata?.value ? lineEnd(text, (metadata.value as { range: [number, number, number] }).range[2]) : lineEnd(text, target.map.range![2])
        edits.push({ start: at, end: at, insert: `images:\n${indent(item, 2 - from)}` })
      }
      reports.push(`${where}[0]: ${file} moved to ${target.id} as its first Image`)
    }
  }
  // From the end of the text backwards, so no edit moves the offsets of another.
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    text = text.slice(0, edit.start) + edit.insert + text.slice(edit.end)
  }
  return text
}

/** The Image's text without its `source` line when the target has no Source of that id. */
function dropUnresolvedSource(item: string, image: YAMLMap, text: string, target: NodeDocument, where: string, reports: string[]): string {
  const source = image.items.find((pair) => isScalar(pair.key) && pair.key.value === 'source')
  if (!source) return item
  const id: unknown = image.get('source')
  const sources = target.map.get('sources')
  if (isSeq(sources) && sources.items.some((entry) => isMap(entry) && entry.get('id') === id)) return item
  const offset = lineStart(text, image.range![0])
  const start = lineStart(text, (source.key as { range: [number, number, number] }).range[0]) - offset
  const end = lineEnd(text, (source.value as { range: [number, number, number] }).range[2]) - offset
  reports.push(`${where}.source: "${String(id)}" dropped: ${target.id} has no Source of that id`)
  return item.slice(0, start) + item.slice(end)
}

/** The offset of the first character of the line holding `offset`. */
function lineStart(text: string, offset: number): number {
  return text.lastIndexOf('\n', offset - 1) + 1
}

/** The offset just past the line break that ends the line before `offset`, or `offset` at a line start. */
function lineEnd(text: string, offset: number): number {
  if (offset === 0 || text[offset - 1] === '\n') return offset
  const next = text.indexOf('\n', offset)
  return next === -1 ? text.length : next + 1
}

/** The column of the `-` that opens the first list entry of `text`. */
function dashColumn(text: string): number {
  return /^( *)-/.exec(text)?.[1]?.length ?? 0
}

/** Every non-empty line of `text` moved `by` columns: right when positive, left when negative. */
function indent(text: string, by: number): string {
  return text
    .split('\n')
    .map((line) => (line.trim() === '' ? line : by >= 0 ? ' '.repeat(by) + line : line.replace(new RegExp(`^ {0,${-by}}`), '')))
    .join('\n')
}

/**
 * 12.1 step 5: `images/`, `theme/` and the top-level files an author keeps beside the Tree
 * travel with it, byte for byte. `nodes/` does not, and neither does the old `tree.yaml`.
 */
async function copyAssets(source: string, target: string): Promise<void> {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const copy = entry.isDirectory() ? entry.name === 'images' || entry.name === 'theme' : entry.name !== 'tree.yaml'
    if (copy) await cp(path.join(source, entry.name), path.join(target, entry.name), { recursive: true })
  }
}

/** 12.1 step 6 and 12.5 step 4: every violation the loader finds in the converted Tree. */
async function validated(target: string): Promise<Violation[]> {
  try {
    await openTree(target)
    return []
  } catch (error) {
    if (error instanceof TreeInvalid) return error.violations
    throw error
  }
}

/** The report: what moved, one line per violation, then one line per rule with its count. */
function report(treeId: string, migration: Migration): void {
  for (const line of migration.reports) console.log(`${treeId}  ${line}`)
  for (const note of migration.notes) console.error(`${treeId}  ${note}`)
  for (const violation of migration.violations) console.error(formatViolation(treeId, violation))
  const counts = new Map<string, number>()
  for (const violation of migration.violations) counts.set(violation.rule, (counts.get(violation.rule) ?? 0) + 1)
  const summary = [...counts].map(([rule, count]) => `${count} ${rule}`).join(', ')
  console.log(`${treeId}: ${migration.from} to elsa-tree/3, ${migration.ids.length} Nodes, ${migration.documents} documents; ${summary || 'valid'}`)
}

async function main(): Promise<void> {
  const [from, to] = process.argv.slice(2)
  if (!from || !to) {
    console.error('usage: npm run migrate <old-folder> <new-folder-or-tree.yaml>')
    process.exit(2)
  }
  if (!(await stat(from).catch(() => null))?.isDirectory()) {
    console.error(`${from} is not a folder`)
    process.exit(2)
  }
  const migration = await migrateTree(from, to)
  const treeId = path.basename(to.endsWith('.yaml') ? path.dirname(path.resolve(to)) : path.resolve(to))
  report(treeId, migration)
  const allowed = migration.from === 'elsa-tree/1' ? CONTENT_RULES : []
  const unexpected = migration.violations.filter((violation) => !allowed.includes(violation.rule))
  process.exit(migration.notes.length === 0 && unexpected.length === 0 ? 0 : 1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
