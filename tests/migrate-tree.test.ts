/**
 * The migration of docs/specs/tree-format.md section 12 (`scripts/migrate-tree.ts`,
 * `npm run migrate`): an `elsa-tree/1` folder (12.1) or an `elsa-tree/2` file (12.5) becomes
 * an `elsa-tree/3` file textually.
 *
 * The inputs are written here rather than kept as fixtures: neither older format is left in
 * this repository, and a leftover Tree in one would be the one thing in `tests/fixtures/`
 * that no loader can read. What the conversion produces is always checked through
 * `openTree`, as section 7 requires.
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
  test('converts into one file that the loader reads as elsa-tree/3', async () => {
    const source = await writeOldTree('old')
    const target = path.join(dir, 'converted')

    const migration = await migrateTree(source, target)

    expect(migration.violations).toEqual([])
    expect(migration.notes).toEqual([])
    // The manifest plus one document per Node file (tree-format.md 12.2).
    expect(migration.documents).toBe(migration.ids.length + 1)

    const tree = await openTree(target)
    expect(migration.from).toBe('elsa-tree/1')
    expect(tree.manifest.format).toBe('elsa-tree/3')
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
    expect(text).toContain('format: elsa-tree/3 # and a trailing comment on the format line')
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
    expect((await openTree(source)).manifest.format).toBe('elsa-tree/3')
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
    const long = 'A title of more than eighty characters, which elsa-tree/1 allowed and 3 does not.'
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

const V2_MANIFEST = `# A comment the author wrote, which the conversion must not lose.
format: elsa-tree/2   # and a trailing comment on the format line
languages: [en]
root: start
title:
  en: A minimal Tree
metadata:
  version: "1.0"
`

const v2Node = (id: string, body: string): string => `
--- # ${id}
id: ${id}
title:
  en: The Node ${id}
description:
  en: |
    Text of ${id}.
metadata:
  version: "1.0"
${body}`

/** An `elsa-tree/2` Tree without Option Images: 12.5 converts it by its format line alone. */
const V2_PLAIN =
  V2_MANIFEST +
  v2Node('start', `options:
  - title:
      en: 'What does it mean?'
    target: detail
answers:
  yes: yes-end
  no: no-end
`) +
  v2Node('detail', '') +
  v2Node('no-end', 'terminal:\n  outcome: not-applicable\n') +
  v2Node('yes-end', 'terminal:\n  outcome: applicable\n')

/**
 * An `elsa-tree/2` Tree whose Options carry Images, one case of 12.5 step 2 each: `detail`
 * has no `images` and no Source, `other` has both, `same` already shows the Option's picture.
 */
const V2_PICTURES =
  V2_MANIFEST +
  v2Node('start', `sources:
  - id: art-1
    kind: legal
    label:
      en: Article 1
    url: https://example.org/article-1
options:
  - title:
      en: 'What does it mean?'
    target: detail
    images:
      - file: one.png
        description:
          en: A picture
        # A comment inside the Image, which moves with it.
        credit: "Picture: Example, CC0"
        source: art-1
      - file: two.png
        description:
          en: A second picture
        credit: "Picture: Example, CC0"
  - title:
      en: Another
    target: other
    images:
      - file: three.png
        description:
          en: A third picture
        credit: "Picture: Example, CC0"
        source: art-1
  - title:
      en: The same
    target: same
    images:
    - file: five.png
      description:
        en: A fifth picture
      credit: "Picture: Example, CC0"
answers:
  yes: yes-end
  no: no-end
`) +
  v2Node('detail', '') +
  v2Node('other', `sources:
  - id: art-1
    kind: legal
    label:
      en: Article 1
    url: https://example.org/article-1
images:
  - file: four.png
    description:
      en: A fourth picture
    credit: "Picture: Example, CC0"
`) +
  v2Node('same', `images:
  - file: five.png
    description:
      en: A fifth picture
    credit: "Picture: Example, CC0"
`) +
  v2Node('no-end', 'terminal:\n  outcome: not-applicable\n') +
  v2Node('yes-end', 'terminal:\n  outcome: applicable\n')

/** An `elsa-tree/2` Tree folder holding `text` and the five pictures V2_PICTURES names. */
async function writeV2Tree(name: string, text: string): Promise<string> {
  const root = path.join(dir, name)
  await mkdir(path.join(root, 'images'), { recursive: true })
  await writeFile(path.join(root, 'tree.yaml'), text, 'utf8')
  for (const file of ['one', 'two', 'three', 'four', 'five']) {
    await writeFile(path.join(root, 'images', `${file}.png`), 'not really a PNG', 'utf8')
  }
  return root
}

describe('a valid elsa-tree/2 Tree (tree-format.md 12.5)', () => {
  test('without Option Images, only its format line changes', async () => {
    const source = await writeV2Tree('old', V2_PLAIN)
    const target = path.join(dir, 'converted')

    const migration = await migrateTree(source, target)

    expect(migration).toMatchObject({ from: 'elsa-tree/2', notes: [], reports: [], violations: [] })
    expect(migration.ids).toEqual(['start', 'detail', 'no-end', 'yes-end'])
    const before = V2_PLAIN.split('\n')
    const after = (await readFile(path.join(target, 'tree.yaml'), 'utf8')).split('\n')
    expect(after).toHaveLength(before.length)
    const changed = after.flatMap((line, index) => (line === before[index] ? [] : [[before[index], line]]))
    expect(changed).toEqual([
      ['format: elsa-tree/2   # and a trailing comment on the format line', 'format: elsa-tree/3 # and a trailing comment on the format line'],
    ])
    expect((await openTree(target)).manifest.format).toBe('elsa-tree/3')
  })

  test('converted in place, the file is rewritten and the images stay', async () => {
    const source = await writeV2Tree('old', V2_PLAIN)

    await migrateTree(source, source)

    expect((await openTree(source)).manifest.format).toBe('elsa-tree/3')
    expect(await readFile(path.join(source, 'images', 'one.png'), 'utf8')).toBe('not really a PNG')
  })

  test("an Option's first Image moves to its target, and what cannot move is reported", async () => {
    const source = await writeV2Tree('old', V2_PICTURES)
    const target = path.join(dir, 'converted')

    const migration = await migrateTree(source, target)

    expect(migration.violations).toEqual([])
    expect(migration.notes).toEqual([])
    expect(migration.reports).toEqual([
      'start  options[0].images[1]: two.png is shown nowhere in elsa-tree/3; add it to the images of detail if its Carousel should carry it',
      'start  options[0].images[0].source: "art-1" dropped: detail has no Source of that id',
      'start  options[0].images[0]: one.png moved to detail as its first Image',
      'start  options[1].images[0]: three.png moved to other as its first Image',
      'start  options[2].images[0]: five.png is already the first Image of same; nothing moved',
    ])
    const text = await readFile(path.join(target, 'tree.yaml'), 'utf8')
    // Created after `metadata`, re-indented to the Node's level, the comment kept, the
    // unresolvable `source` gone.
    expect(text).toContain(`metadata:
  version: "1.0"
images:
  - file: one.png
    description:
      en: A picture
    # A comment inside the Image, which moves with it.
    credit: "Picture: Example, CC0"

--- # other`)
    // In front of the target's own first Image, its `source` kept: `other` cites art-1.
    expect(text).toContain(`images:
  - file: three.png
    description:
      en: A third picture
    credit: "Picture: Example, CC0"
    source: art-1
  - file: four.png`)
    // Every Option is left with its title and target only.
    expect(text).toContain(`options:
  - title:
      en: 'What does it mean?'
    target: detail
  - title:
      en: Another
    target: other
  - title:
      en: The same
    target: same
answers:`)
    expect(text).not.toContain('two.png')

    const tree = await openTree(target)
    expect((await tree.getNode('same'))!.images.map((image) => image.file)).toEqual(['five.png'])
    expect((await tree.getNode('other'))!.images.map((image) => image.file)).toEqual(['three.png', 'four.png'])
  })

  test('a description that already holds a fragment link is reported by V-MARK, not rewritten', async () => {
    const source = await writeV2Tree('old', V2_PLAIN.replace('Text of detail.', 'Text of [detail](#detail).'))

    const migration = await migrateTree(source, path.join(dir, 'converted'))

    expect(migration.violations).toEqual([
      { file: 'detail', keyPath: 'description.en', rule: 'V-MARK', message: '"[detail](#detail)" names no explainer of this Node' },
    ])
  })

  test('a file without an elsa-tree/2 format line is reported, not guessed at', async () => {
    const source = await writeV2Tree('old', V2_PLAIN.replace('format: elsa-tree/2', 'format: elsa-tree/9'))

    const migration = await migrateTree(source, path.join(dir, 'converted'))

    expect(migration.notes).toEqual(['manifest: no "format: elsa-tree/2" line found'])
    expect(migration.violations.map((violation) => violation.rule)).toEqual(['V-FORMAT'])
  })
})
