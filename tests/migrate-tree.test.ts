/**
 * The writer of docs/specs/tree-format.md 3.7 (`scripts/migrate-tree.ts`, `npm run
 * migrate`): what is left of the migration of section 12 after issue #119 ran it, and the
 * one contract that is worth stating only if it is tested -- **writing a Tree that was
 * just read changes no byte** (12.6.1, Idempotence).
 *
 * Every Tree it writes is read back through `openTree`, as section 7 requires; no test
 * builds a `Node` by hand.
 */
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { bytes, migrateTree } from '../scripts/migrate-tree.ts'
import { openTree, TreeInvalid } from '../src/tree/loader.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture = (...parts: string[]): string => path.join(here, 'fixtures', ...parts)
const exampleTree = path.join(here, '..', 'trees', 'ai-act-example')
/** The Tree title of `tests/fixtures/single-language`, the line a repeat is written above. */
const TITLE = '    "nl": "Is de AI-verordening van toepassing?"\n'

let work: string

beforeEach(async () => {
  work = await mkdtemp(path.join(tmpdir(), 'elsa-migrate-'))
})

afterEach(async () => {
  await rm(work, { recursive: true, force: true })
})

/** A copy of a Tree folder under the temporary directory, so the repository is untouched. */
async function copyTree(source: string): Promise<string> {
  const target = path.join(work, path.basename(source))
  await cp(source, target, { recursive: true })
  return target
}

describe('the canonical byte form is stable (tree-format.md 3.7, 12.6.1)', () => {
  test.each([
    ['trees/ai-act-example', exampleTree],
    ['tests/fixtures/full-node', fixture('full-node')],
    ['tests/fixtures/other-languages', fixture('other-languages')],
  ])('%s is written back byte for byte, twice', async (_name, source) => {
    const target = await copyTree(source)
    const original = await readFile(path.join(target, 'tree.json'), 'utf8')

    const first = await migrateTree(target)
    const afterFirst = await readFile(path.join(target, 'tree.json'), 'utf8')
    const second = await migrateTree(target)
    const afterSecond = await readFile(path.join(target, 'tree.json'), 'utf8')

    expect(first.violations).toEqual([])
    expect(first.rewritten, 'the committed file is not in the canonical byte form').toBe(false)
    expect(afterFirst).toBe(original)
    expect(second.rewritten).toBe(false)
    expect(afterSecond).toBe(original)
  })

  test('a Tree written any other way is brought into the byte form, and then stays', async () => {
    // The three ways a writer may differ: the indentation, the key order of 3.7, and the
    // order a localised text lists its languages in (the manifest's).
    const target = await copyTree(fixture('other-languages'))
    const file = path.join(target, 'tree.json')
    const canonical = await readFile(file, 'utf8')
    const tree = JSON.parse(canonical) as Record<string, unknown>
    const shuffled = Object.fromEntries(Object.entries(tree).reverse())
    const first = (shuffled.nodes as Array<Record<string, unknown>>)[0]!
    first.title = Object.fromEntries(Object.entries(first.title as Record<string, string>).reverse())
    await writeFile(file, JSON.stringify(shuffled, null, 4), 'utf8')

    const migration = await migrateTree(target)

    expect(migration.rewritten).toBe(true)
    expect(migration.violations).toEqual([])
    expect(await readFile(file, 'utf8')).toBe(canonical)
    // And a second run finds nothing left to do: that is what idempotence means here.
    expect((await migrateTree(target)).rewritten).toBe(false)
  })

  test('the written Tree is the same Tree: every Node, in order, with its text', async () => {
    const target = await copyTree(exampleTree)
    const before = await openTree(target)
    const ids = ['start', 'outside-scope', 'prohibited-practices', 'social-scoring', 'emotion-recognition-at-work', 'prohibited', 'covered']

    const migration = await migrateTree(target)

    expect(migration.ids).toEqual(ids)
    const after = await openTree(target)
    for (const id of ids) expect(await after.getNode(id), id).toEqual(await before.getNode(id))
    expect(after.manifest).toEqual(before.manifest)
  })

  test('bytes is two-space indentation and one trailing line feed, and nothing else', () => {
    const written = bytes({ format: 'elsa-tree/4', languages: ['en', 'nl'] })

    expect(written).toBe('{\n  "format": "elsa-tree/4",\n  "languages": [\n    "en",\n    "nl"\n  ]\n}\n')
  })

  test('a non-ASCII character is written as itself, not as an escape', async () => {
    const target = await copyTree(fixture('other-languages'))
    const file = path.join(target, 'tree.json')
    expect(await readFile(file, 'utf8')).toContain('é')

    await migrateTree(target)

    const written = await readFile(file, 'utf8')
    expect(written).toContain('é')
    // The six characters of an escape, not the character: the byte form writes it as itself.
    expect(written).not.toContain('\\u00e9')
  })
})

describe('the writer reports what the loader would', () => {
  test('a Tree that breaks a content rule is written and every violation named', async () => {
    const target = await copyTree(fixture('invalid', 'v-length'))

    const migration = await migrateTree(target)

    expect(migration.violations).toEqual([
      { file: 'start', keyPath: 'title.en', rule: 'V-LENGTH', message: '81 characters; at most 80' },
    ])
  })

  test('a Tree whose shape is wrong is answered by the schema, with a JSON Pointer', async () => {
    const target = await copyTree(fixture('invalid', 'v-keys'))

    const migration = await migrateTree(target)

    expect(migration.violations).toEqual([
      { file: 'tree.json', keyPath: '/nodes/0', rule: 'schema', message: 'must NOT have additional properties: "notes"' },
    ])
  })

  test('a file that does not parse is reported and nothing is written', async () => {
    const target = await copyTree(fixture('invalid', 'v-json'))
    const file = path.join(target, 'tree.json')
    const before = await readFile(file, 'utf8')

    const migration = await migrateTree(target)

    expect(migration.rewritten).toBe(false)
    expect(migration.notes).toHaveLength(1)
    expect(migration.notes[0]).toMatch(/JSON/)
    expect(await readFile(file, 'utf8')).toBe(before)
  })

  // The writer stops for two more things, and for the same reason the parse failure above
  // stops it: the file is the only copy (12.6.1 step 5 and "What survives the job"). One
  // case per branch of the walk -- a localised text, `metadata`, a named object, a list --
  // because a branch the refusal does not answer is a branch that rewrites. Each case is
  // written back with a four-space indentation first, so the file is NOT in the canonical
  // byte form and a writer that ran would rewrite it: that is what makes "unchanged" worth
  // asserting.
  test.each([
    [
      'a metadata key made only of digits is refused, with its remedy',
      fixture('broken', 'metadata-all-digits'),
      (tree: Record<string, unknown>) => tree,
      'metadata: the key "2024" is made only of digits; rename it to "note-2024" and run again',
    ],
    [
      'a file whose top level is a list is not a Tree file',
      fixture('single-language'),
      () => ['not a tree'],
      'tree.json holds a list where the format has an object, so it is not a Tree file',
    ],
    [
      'a key the format lists is refused when it holds an object',
      fixture('single-language'),
      (tree: Record<string, unknown>) => {
        ;(tree.nodes as Array<Record<string, unknown>>)[0]!.sources = {}
        return tree
      },
      'nodes[0].sources: the format has a list here, and the file has an object',
    ],
    [
      'a localised text is refused when it holds a list, at the top level',
      fixture('single-language'),
      (tree: Record<string, unknown>) => {
        tree.title = ['not', 'an', 'object']
        return tree
      },
      'title: the format has an object here, and the file has a list',
    ],
    [
      'a localised text is refused when it holds a list, on a Node',
      fixture('single-language'),
      (tree: Record<string, unknown>) => {
        ;(tree.nodes as Array<Record<string, unknown>>)[0]!.description = []
        return tree
      },
      'nodes[0].description: the format has an object here, and the file has a list',
    ],
    [
      'metadata is refused when it holds a list, at the top level',
      fixture('single-language'),
      (tree: Record<string, unknown>) => {
        tree.metadata = []
        return tree
      },
      'metadata: the format has an object here, and the file has a list',
    ],
    [
      'a list in metadata is refused as a list, not as a key made of digits',
      fixture('single-language'),
      (tree: Record<string, unknown>) => {
        ;(tree.nodes as Array<Record<string, unknown>>)[0]!.metadata = ['x']
        return tree
      },
      'nodes[0].metadata: the format has an object here, and the file has a list',
    ],
    [
      'an object the format names is refused when it holds a list',
      fixture('single-language'),
      (tree: Record<string, unknown>) => {
        ;(tree.nodes as Array<Record<string, unknown>>)[0]!.answers = []
        return tree
      },
      'nodes[0].answers: the format has an object here, and the file has a list',
    ],
  ])('%s, and nothing is written', async (_name, source, edit, note) => {
    const target = await copyTree(source)
    const file = path.join(target, 'tree.json')
    const edited = edit(JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>)
    await writeFile(file, JSON.stringify(edited, null, 4), 'utf8')
    const before = await readFile(file, 'utf8')

    const migration = await migrateTree(target)

    expect(migration).toEqual({ rewritten: false, ids: [], notes: [note], violations: [] })
    expect(await readFile(file, 'utf8')).toBe(before)
  })

  // The two checks of V-JSON that read the bytes rather than the parsed value, and the
  // reason the writer asks the loader (`readTreeText`) instead of parsing for itself:
  // `JSON.parse` keeps the last of a duplicate key and says nothing, so a writer that
  // trusted it would serialise the survivor over the only copy of the file -- and step 8,
  // reading back a file that no longer holds the defect, would report the Tree as valid.
  // The one rule written to catch a silent loss would be silenced by that loss.
  test.each([
    [
      'a duplicate key',
      (text: string) => text.replace(TITLE, `    "nl": "DE TITEL VAN DE AUTEUR",\n${TITLE}`),
      'the key "nl" appears twice in one object, at line 10 column 5',
    ],
    [
      'a byte-order mark',
      (text: string) => `﻿${text}`,
      'tree.json begins with a byte-order mark; write it as UTF-8 without one',
    ],
  ])('%s stops the writer, and the loader still finds it afterwards', async (_name, edit, note) => {
    const target = await copyTree(fixture('single-language'))
    const file = path.join(target, 'tree.json')
    // The edited file is NOT in the canonical byte form -- writing back what the parser
    // returns would drop the repeated line, or the mark -- so a writer that ran is visible.
    const before = edit(await readFile(file, 'utf8'))
    await writeFile(file, before, 'utf8')

    const migration = await migrateTree(target)

    expect(migration).toEqual({ rewritten: false, ids: [], notes: [note], violations: [] })
    expect(await readFile(file, 'utf8')).toBe(before)
    // The file is the evidence, so it must still be the file the loader refuses, with the
    // same message: the writer and the loader answer "may this be read" the same way.
    const refused = await openTree(target).catch((error: unknown) => error)
    expect(refused).toBeInstanceOf(TreeInvalid)
    expect((refused as TreeInvalid).violations).toEqual([{ file: 'tree.json', keyPath: '', rule: 'V-JSON', message: note }])
  })

  test('the author\'s first value is still in the file after a duplicate key is refused', async () => {
    // What the silent rewrite cost: `JSON.parse` keeps the last, so the text above the
    // repeat is what a writer that ran would have deleted.
    const target = await copyTree(fixture('single-language'))
    const file = path.join(target, 'tree.json')
    const written = `    "nl": "DE TITEL VAN DE AUTEUR",\n`
    await writeFile(file, (await readFile(file, 'utf8')).replace(TITLE, written + TITLE), 'utf8')

    await migrateTree(target)

    expect(await readFile(file, 'utf8')).toContain('DE TITEL VAN DE AUTEUR')
  })

  test('a folder that holds no tree.json is reported, not crashed on', async () => {
    const migration = await migrateTree(work)

    expect(migration).toEqual({ rewritten: false, ids: [], notes: ['tree.json is missing'], violations: [] })
  })
})

describe('the example Tree and section 8 of the format spec are one file', () => {
  // tree-format.md 8 is the complete example, and trees/ai-act-example is the Tree the
  // development default serves. #119 converted both; NOTES.md of the Tree says they are
  // byte-identical, and nothing held them to it until this test. A reader who trusts the
  // spec's block is reading the file the app serves, or the test says which drifted.
  test('section 8 holds the bytes of trees/ai-act-example/tree.json', async () => {
    const spec = await readFile(path.join(here, '..', 'docs', 'specs', 'tree-format.md'), 'utf8')
    const heading = spec.indexOf('\n## 8. ')
    const fence = spec.indexOf('\n```json\n', heading)
    const end = spec.indexOf('\n```\n', fence + 8)

    expect(heading, 'section 8 is in the spec').toBeGreaterThan(-1)
    expect(fence, 'section 8 opens a json block').toBeGreaterThan(heading)
    // The block's own trailing line feed is the file's, so the slice ends at the fence.
    const block = spec.slice(fence + '\n```json\n'.length, end + 1)

    expect(block).toBe(await readFile(path.join(exampleTree, 'tree.json'), 'utf8'))
  })
})
