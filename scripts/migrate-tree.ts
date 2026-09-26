/**
 * `npm run migrate <tree-folder>`: writes a Tree's `tree.json` in the canonical byte form
 * of docs/specs/tree-format.md 3.7 and validates the result.
 *
 * This is what is left of the migration of section 12 after issue #119 ran it. Its steps 5
 * to 8 -- the key order, the byte form, the read-back and the validation -- are these; its
 * steps 1 to 4 read the format this one replaced, and went with the parser that read it,
 * except for step 1's rule, which is kept here against JSON: bytes the loader will not
 * read stop the job and nothing is written. Step 9 deleted `tree.yaml` and left with it. A
 * Tree still written in `elsa-tree/1`, `/2` or `/3` is converted with the last release
 * before #119 and then by 12.6; no Tree in this repository is in that state.
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
import { formatViolation, openTree, readTreeText, TreeInvalid } from '../src/tree/loader.ts'
import type { Violation } from '../src/tree/types.ts'
import { bytes, treeBytes, VALUE } from '../src/tree/serialise.ts'
import { isMapping } from '../src/tree/validate.ts'

export { bytes }

export interface Migration {
  /** False when the file was already in the canonical byte form: nothing was written. */
  rewritten: boolean
  /** The Node ids written, in the order they stand in `nodes`. */
  ids: string[]
  /**
   * What stopped the job before anything was written (12.6.1): a text the loader will not
   * read -- a syntax error, a byte-order mark or a duplicate key (step 1) -- a `metadata`
   * key made only of digits (step 5), and a value whose shape the writer cannot carry
   * ("What survives the job"). Everything else is a violation of the written file, below.
   */
  notes: string[]
  /** Every rule the written Tree breaks; empty when it is valid. */
  violations: Violation[]
}

/**
 * Rewrites `<dir>/tree.json` in the canonical byte form and validates the result: the
 * schema of 3.9, then the rules of section 7, every violation reported. The file is read
 * back through `openTree`, as 12.6.1 step 8 asks, so what is reported is what the server
 * would report at start.
 *
 * Three things stop it before a byte is written, and are reported as `notes` with the file
 * untouched: bytes the loader will not read (step 1), and the two of `refusals` below.
 *
 * Step 1 is `readTreeText`, the loader's own answer, and not a bare `JSON.parse`: a
 * duplicate key is the one malformation a parsed value no longer carries (3.7), so a
 * writer that parsed for itself would serialise the surviving half over the only copy of
 * the file and report a Tree that now validates -- silencing V-JSON by erasing it.
 */
export async function migrateTree(dir: string): Promise<Migration> {
  const file = path.join(path.resolve(dir), 'tree.json')
  const before = await readFile(file, 'utf8').catch(() => null)
  if (before === null) return { rewritten: false, ids: [], notes: [`${path.basename(file)} is missing`], violations: [] }

  const { value: parsed, problem } = readTreeText(before)
  if (problem !== null) return { rewritten: false, ids: [], notes: [problem], violations: [] }

  const stopped = refusals(parsed)
  if (stopped.length > 0) return { rewritten: false, ids: [], notes: stopped, violations: [] }

  const tree = parsed as Record<string, unknown>
  const after = treeBytes(tree)
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
 * What stops the job before a byte is written, each reported by name, with the object it
 * sits on and the remedy. Empty when the writer may run.
 *
 * Two kinds. A `metadata` key made only of digits is the one thing an `elsa-tree/3` Tree
 * can carry that this conversion refuses (12.6.1 step 5, V-META, 3.7): a procedure that
 * renamed the key itself would be a procedure that edits content, so its author renames
 * it. A value whose shape this format does not have stops the job for the writer's own
 * reason (12.6.1, "What survives the job"): `canonical` below dispatches on the key name
 * and trusts the shape, so on `"sources": {}` it would throw, and on a `title` holding a
 * list -- or a file whose top level is a list -- it would write back an object the author
 * never wrote, over the only copy of it. Everything else the loader answers, after the
 * write, as step 8 asks.
 */
function refusals(parsed: unknown): string[] {
  if (!isMapping(parsed)) return [`tree.json holds ${shape(parsed)} where the format has an object, so it is not a Tree file`]
  const out: string[] = []
  refuse(parsed as Record<string, unknown>, '', out)
  return out
}

/**
 * One object and everything below it; `at` is the key path of 3.9, `nodes[0].sources`.
 *
 * Its branches are the branches of `canonicalValue` -- the four kinds of the `VALUE`
 * table, none of them skipped -- because the two walks encode one
 * question, *will the writer act on this value*, and a kind answered in one and not in the
 * other is a value the writer rewrites in silence. A fifth kind means a branch in both.
 */
function refuse(value: Record<string, unknown>, prefix: string, out: string[]): void {
  for (const [key, entry] of Object.entries(value)) {
    const kind = VALUE[key]
    const at = prefix + key
    // A scalar where the format has an object is carried across untouched and fails a rule
    // on the written file, exactly as an unknown key does: only a shape the walk below
    // would act on is refused here.
    if (kind === undefined || entry === null || typeof entry !== 'object') continue
    if (typeof kind === 'object') {
      if (!Array.isArray(entry)) out.push(`${at}: the format has a list here, and the file has ${shape(entry)}`)
      else {
        entry.forEach((item, index) => {
          if (isMapping(item)) refuse(item as Record<string, unknown>, `${at}[${index}].`, out)
          else out.push(`${at}[${index}]: the format has an object here, and the file has ${shape(item)}`)
        })
      }
      continue
    }
    // `localised`, `metadata` and `canonical` each read an object's own keys, so an object
    // is what all three need and a list is what all three would write back as one.
    if (!isMapping(entry)) {
      out.push(`${at}: the format has an object here, and the file has ${shape(entry)}`)
      continue
    }
    if (kind === 'text') continue // `localised` reorders the languages it finds and carries each value across
    if (kind === 'metadata') {
      for (const own of Object.keys(entry)) {
        if (/^[0-9]+$/.test(own)) out.push(`${at}: the key "${own}" is made only of digits; rename it to "note-${own}" and run again`)
      }
    } else refuse(entry as Record<string, unknown>, `${at}.`, out)
  }
}

/** What the file has, in the words of the messages above. */
function shape(value: unknown): string {
  if (Array.isArray(value)) return 'a list'
  if (isMapping(value)) return 'an object'
  return JSON.stringify(value)
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
