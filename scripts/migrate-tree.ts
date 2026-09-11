/**
 * `npm run migrate <old-folder> <new-folder-or-tree.yaml>`: the mechanical conversion of
 * an `elsa-tree/1` Tree folder into an `elsa-tree/2` Tree, exactly as
 * docs/specs/tree-format.md section 12 specifies it (ADR-37-migration).
 *
 * The conversion is TEXTUAL: no Node file is parsed and re-serialised, so every comment,
 * every line break and every quoting choice survives, and a file that does not parse is
 * carried over to fail the same rule it failed before. The converted Tree is then
 * validated and EVERY violation is printed; nothing is shortened and nothing is silenced.
 * Exit code 0 when the only violations are the content rules the length limits added
 * (V-LENGTH, V-LINES, V-COUNT), 1 otherwise.
 *
 * Runs with plain Node 22 (built-in type stripping), so no extra tool is needed.
 */
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseAllDocuments } from 'yaml'
import { formatViolation, openTree, TreeInvalid } from '../src/tree/loader.ts'
import type { Violation } from '../src/tree/types.ts'

const FORMAT_LINE = /^format:[ \t]*elsa-tree\/1[ \t]*(#.*)?$/
const ROOT_LINE = /^root:[ \t]*(\S+)/
const DOCUMENT_START = /^---[ \t]*(#.*)?$/

/** The rules a Tree may still break after a faithful conversion (tree-format.md 12.2). */
const CONTENT_RULES: readonly string[] = ['V-LENGTH', 'V-LINES', 'V-COUNT']

export interface Migration {
  /** The Node ids written, in the order they were written: the root first (12.1 step 3). */
  ids: string[]
  /** How many documents the written file parses back into: the manifest plus the Nodes. */
  documents: number
  /** What could not be converted mechanically, in the words section 12.1 gives them. */
  notes: string[]
  /** Every rule the converted Tree breaks; empty when it is valid. */
  violations: Violation[]
}

/**
 * Converts the `elsa-tree/1` Tree in `inDir` into `out` (a Tree folder, or the path of the
 * `tree.yaml` to write) and validates the result. Deletes `<in>/nodes/` only when the Tree
 * is converted in place and the file it was replaced by parses back into one document per
 * Node file (12.1 step 7).
 */
export async function migrateTree(inDir: string, out: string): Promise<Migration> {
  const source = path.resolve(inDir)
  const outFile = out.endsWith('.yaml') ? path.resolve(out) : path.join(path.resolve(out), 'tree.yaml')
  const target = path.dirname(outFile)
  const notes: string[] = []

  const manifest = rewriteFormat(await readTreeText(path.join(source, 'tree.yaml')), notes)
  const nodeFiles = await listNodeFiles(source, rootId(manifest))
  const ids = nodeFiles.map((file) => file.slice(0, -'.yaml'.length))

  let text = manifest === '' ? '' : `${manifest}\n`
  for (const file of nodeFiles) {
    const id = file.slice(0, -'.yaml'.length)
    const body = stripDocumentStart(await readTreeText(path.join(source, 'nodes', file)))
    text += `\n--- # ${id}\nid: ${id}\n${body}\n`
  }

  await mkdir(target, { recursive: true })
  await writeFile(outFile, text, 'utf8')
  if (target !== source) await copyAssets(source, target)

  // Step 6: parse the result back and report what the loader would report.
  const documents = parseAllDocuments(await readFile(outFile, 'utf8')).length
  const violations = await validated(target)
  if (target === source && documents === nodeFiles.length + 1) {
    await rm(path.join(source, 'nodes'), { recursive: true, force: true })
  } else if (target === source) {
    notes.push(`nodes/ kept: the written file holds ${documents} documents, not ${nodeFiles.length + 1}`)
  }
  return { ids, documents, notes, violations }
}

/** A Tree file as text: without its byte-order mark and with `\n` line endings (12.1 step 5). */
async function readTreeText(file: string): Promise<string> {
  const text = await readFile(file, 'utf8').catch(() => '')
  return trimTrailingBlankLines(text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'))
}

function trimTrailingBlankLines(text: string): string {
  const lines = text.split('\n')
  while (lines.length > 0 && lines[lines.length - 1]!.trim() === '') lines.pop()
  return lines.join('\n')
}

/** Step 1: `format: elsa-tree/1` becomes `format: elsa-tree/2`, keeping any comment. */
function rewriteFormat(text: string, notes: string[]): string {
  const lines = stripDocumentStart(text).split('\n')
  const index = lines.findIndex((line) => FORMAT_LINE.test(line))
  if (index === -1) {
    if (text !== '') notes.push('manifest: no "format: elsa-tree/1" line found')
  } else {
    const comment = FORMAT_LINE.exec(lines[index]!)![1]
    lines[index] = comment ? `format: elsa-tree/2 ${comment}` : 'format: elsa-tree/2'
  }
  return lines.join('\n')
}

/** Steps 1 and 4: a leading `---` line belongs to the stream, not to the document's text. */
function stripDocumentStart(text: string): string {
  const lines = text.split('\n')
  if (DOCUMENT_START.test(lines[0] ?? '')) lines.shift()
  return lines.join('\n')
}

/** Step 2: the root id, so that its Node is written first. */
function rootId(manifest: string): string | null {
  const line = manifest.split('\n').find((candidate) => ROOT_LINE.test(candidate))
  return line ? ROOT_LINE.exec(line)![1]! : null
}

/**
 * Step 3: the Node files, the root's first and the rest in byte order of file name --
 * `LC_ALL=C sort`, which is the same on Windows and on Linux, unlike what `ls` shows.
 */
async function listNodeFiles(source: string, root: string | null): Promise<string[]> {
  const entries = await readdir(path.join(source, 'nodes'), { withFileTypes: true }).catch(() => [])
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.yaml')).map((entry) => entry.name)
  const rootFile = `${root}.yaml`
  const rest = files
    .filter((file) => file !== rootFile)
    .sort((a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8')))
  return files.includes(rootFile) ? [rootFile, ...rest] : rest
}

/**
 * Step 5: `images/` and the top-level files an author keeps beside the Tree travel with
 * it, byte for byte. `nodes/` does not, and no `theme/` is created: a Theme is authored.
 */
async function copyAssets(source: string, target: string): Promise<void> {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const copy = entry.isDirectory() ? entry.name === 'images' : entry.name !== 'tree.yaml'
    if (copy) await cp(path.join(source, entry.name), path.join(target, entry.name), { recursive: true })
  }
}

/** Step 6: every violation the loader finds in the converted Tree. */
async function validated(target: string): Promise<Violation[]> {
  try {
    await openTree(target)
    return []
  } catch (error) {
    if (error instanceof TreeInvalid) return error.violations
    throw error
  }
}

/** The report: one line per violation, then one line per rule with its count. */
function report(treeId: string, migration: Migration): void {
  for (const note of migration.notes) console.error(`${treeId}  ${note}`)
  for (const violation of migration.violations) console.error(formatViolation(treeId, violation))
  const counts = new Map<string, number>()
  for (const violation of migration.violations) counts.set(violation.rule, (counts.get(violation.rule) ?? 0) + 1)
  const summary = [...counts].map(([rule, count]) => `${count} ${rule}`).join(', ')
  console.log(`${treeId}: ${migration.ids.length} Nodes, ${migration.documents} documents; ${summary || 'valid'}`)
}

async function main(): Promise<void> {
  const [from, to] = process.argv.slice(2)
  if (!from || !to) {
    console.error('usage: npm run migrate <old-folder> <new-folder-or-tree.yaml>')
    process.exit(2)
  }
  const migration = await migrateTree(from, to)
  const treeId = path.basename(to.endsWith('.yaml') ? path.dirname(path.resolve(to)) : path.resolve(to))
  report(treeId, migration)
  const unexpected = migration.violations.filter((violation) => !CONTENT_RULES.includes(violation.rule))
  process.exit(migration.notes.length === 0 && unexpected.length === 0 ? 0 : 1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
