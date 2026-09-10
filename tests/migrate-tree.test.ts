/**
 * The migration of docs/specs/tree-format.md section 12 (`scripts/migrate-tree.ts`,
 * `npm run migrate`): an `elsa-tree/1` folder becomes an `elsa-tree/2` file textually.
 *
 * The inputs are written here rather than kept as fixtures: `elsa-tree/1` is gone from
 * this repository, and a leftover folder of Node files would be the one thing in
 * `tests/fixtures/` that no loader can read. What the conversion produces is always
 * checked through `openTree`, as section 7 requires.
 */
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { migrateTree } from '../scripts/migrate-tree.ts'
import { openTree } from '../src/tree/loader.ts'

const MANIFEST = `# A comment the author wrote, which the conversion must not lose.
format: elsa-tree/1   # and a trailing comment on the format line
languages: [en]
root: start
title:
  en: A minimal Tree
metadata:
  version: "1.0"
`

/** Written with a comment, a blank line and a quoting choice, to see them survive. */
const START = `title:
  en: Does it apply?

# Why this question comes first.
description:
  en: |
    The first question.
metadata:
  version: "1.0"
options:
  - title:
      en: 'What does it mean?'
    target: detail
answers:
  yes: yes-end
  no: no-end
`

const DETAIL = `title:
  en: What it means
description:
  en: |
    An explanation.
metadata:
  version: "1.0"
`

const terminal = (title: string, outcome: string): string => `title:
  en: ${title}
description:
  en: |
    The walk ends here.
metadata:
  version: "1.0"
terminal:
  outcome: ${outcome}
`

let dir: string

/** An `elsa-tree/1` Tree folder: a manifest, four Node files and an image. */
async function writeOldTree(name: string, manifest = MANIFEST): Promise<string> {
  const root = path.join(dir, name)
  await mkdir(path.join(root, 'nodes'), { recursive: true })
  await mkdir(path.join(root, 'images'), { recursive: true })
  await writeFile(path.join(root, 'tree.yaml'), manifest, 'utf8')
  await writeFile(path.join(root, 'nodes', 'start.yaml'), START, 'utf8')
  await writeFile(path.join(root, 'nodes', 'detail.yaml'), DETAIL, 'utf8')
  await writeFile(path.join(root, 'nodes', 'yes-end.yaml'), terminal('It applies', 'applicable'), 'utf8')
  await writeFile(path.join(root, 'nodes', 'no-end.yaml'), terminal('It does not apply', 'not-applicable'), 'utf8')
  await writeFile(path.join(root, 'images', 'pic.png'), 'not really a PNG', 'utf8')
  await writeFile(path.join(root, 'NOTES.md'), 'Notes the author keeps beside the Tree.\n', 'utf8')
  return root
}

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'elsa-migrate-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('a valid elsa-tree/1 Tree', () => {
  test('converts into one file that the loader reads as elsa-tree/2', async () => {
    const source = await writeOldTree('old')
    const target = path.join(dir, 'converted')

    const migration = await migrateTree(source, target)

    expect(migration.violations).toEqual([])
    expect(migration.notes).toEqual([])
    // The manifest plus one document per Node file (tree-format.md 12.2).
    expect(migration.documents).toBe(migration.ids.length + 1)

    const tree = await openTree(target)
    expect(tree.manifest.format).toBe('elsa-tree/2')
    expect(tree.manifest.root).toBe('start')
    expect((await tree.getNode('start'))!.options[0]!.target).toBe('detail')
    expect((await tree.getNode('detail'))!.kind).toBe('explanation')
  })

  test('writes the root Node first and the rest in byte order of their file names', async () => {
    const source = await writeOldTree('old')

    const migration = await migrateTree(source, path.join(dir, 'converted'))

    expect(migration.ids).toEqual(['start', 'detail', 'no-end', 'yes-end'])
  })

  test('carries every Node over verbatim, behind its separator and its id', async () => {
    const source = await writeOldTree('old')
    const target = path.join(dir, 'converted')

    await migrateTree(source, target)

    const text = await readFile(path.join(target, 'tree.yaml'), 'utf8')
    // Nothing inside a Node is touched: not a comment, not a blank line, not the single
    // quotes the author chose (12.1 step 4).
    expect(text).toContain(`\n--- # start\nid: start\n${START}`)
    expect(text).toContain(`\n--- # detail\nid: detail\n${DETAIL}`)
    expect(text).toContain("      en: 'What does it mean?'")
  })

  test('keeps the manifest as it was apart from its format line', async () => {
    const source = await writeOldTree('old')
    const target = path.join(dir, 'converted')

    await migrateTree(source, target)

    const text = await readFile(path.join(target, 'tree.yaml'), 'utf8')
    expect(text).toContain('# A comment the author wrote, which the conversion must not lose.')
    // The comment on the format line stays with it, one space away (12.1 step 1).
    expect(text).toContain('format: elsa-tree/2 # and a trailing comment on the format line')
    expect(text).not.toContain('elsa-tree/1')
  })

  test('takes the images and the files the author keeps along, and leaves nodes/ behind', async () => {
    const source = await writeOldTree('old')
    const target = path.join(dir, 'converted')

    await migrateTree(source, target)

    expect(await readFile(path.join(target, 'images', 'pic.png'), 'utf8')).toBe('not really a PNG')
    expect(await readFile(path.join(target, 'NOTES.md'), 'utf8')).toBe('Notes the author keeps beside the Tree.\n')
    // No theme/ is invented: a Theme is authored, not migrated (12.1 step 5).
    await expect(stat(path.join(target, 'theme'))).rejects.toThrow()
    await expect(stat(path.join(target, 'nodes'))).rejects.toThrow()
    // The input is left alone when the output is somewhere else.
    expect((await stat(path.join(source, 'nodes'))).isDirectory()).toBe(true)
  })

  test('converted in place, it replaces nodes/ with the file', async () => {
    const source = await writeOldTree('old')

    await migrateTree(source, source)

    await expect(stat(path.join(source, 'nodes'))).rejects.toThrow()
    expect((await openTree(source)).manifest.format).toBe('elsa-tree/2')
  })

  test('the second argument may name the file to write', async () => {
    const source = await writeOldTree('old')
    const file = path.join(dir, 'converted', 'tree.yaml')

    await migrateTree(source, file)

    expect((await openTree(path.dirname(file))).id).toBe('converted')
  })
})

describe('a Tree the new limits reject', () => {
  test('is converted whole, and every violation is reported rather than silenced', async () => {
    const long = 'A title of more than eighty characters, which elsa-tree/1 allowed and 2 does not.'
    const source = await writeOldTree('old')
    await writeFile(
      path.join(source, 'nodes', 'detail.yaml'),
      DETAIL.replace('What it means', long),
      'utf8',
    )
    const target = path.join(dir, 'converted')

    const migration = await migrateTree(source, target)

    expect(migration.violations).toEqual([
      { file: 'detail', keyPath: 'title.en', rule: 'V-LENGTH', message: '81 characters; at most 80' },
    ])
    // Shortened nothing: the text is in the file, whole, for the content issue to cut.
    expect(await readFile(path.join(target, 'tree.yaml'), 'utf8')).toContain(long)
  })
})

describe('a folder that is not an elsa-tree/1 Tree', () => {
  test('is reported, not guessed at', async () => {
    const source = await writeOldTree('old', MANIFEST.replace('format: elsa-tree/1', 'format: elsa-tree/9'))

    const migration = await migrateTree(source, path.join(dir, 'converted'))

    expect(migration.notes).toEqual(['manifest: no "format: elsa-tree/1" line found'])
    expect(migration.violations.map((violation) => violation.rule)).toEqual(['V-FORMAT'])
  })

  test('an empty folder converts to nothing and says why', async () => {
    const source = path.join(dir, 'empty')
    await mkdir(source, { recursive: true })

    const migration = await migrateTree(source, path.join(dir, 'converted'))

    expect(migration.ids).toEqual([])
    // An empty file is no document at all, and a Tree without Nodes is no Tree (12.1).
    expect(migration.violations.map((violation) => violation.rule)).toEqual(['V-YAML', 'V-NODE'])
  })
})
