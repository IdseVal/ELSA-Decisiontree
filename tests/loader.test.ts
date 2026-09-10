/**
 * The Tree loader (docs/specs/application.md section 5.1): what `openTree` accepts, what
 * it rejects, and the promise that a page is served from the index without touching a file.
 *
 * Fixtures are always loaded through `openTree`; no test builds a `Node` by hand or reads
 * YAML itself (docs/specs/application.md section 7).
 */
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { Violation } from '../src/tree/types.ts'

// Counting the reads is how "the Tree is read once" is measured, so the real module is
// wrapped rather than replaced. `vi.hoisted` gives the factory, which runs first, its array.
const { reads } = vi.hoisted(() => ({ reads: [] as string[] }))
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...actual,
    readFile: (file: Parameters<typeof actual.readFile>[0], ...rest: unknown[]) => {
      reads.push(String(file))
      return (actual.readFile as (...args: unknown[]) => unknown)(file, ...rest)
    },
  }
})

const { openTree, TreeInvalid } = await import('../src/tree/loader.ts')
const { countedLength, estimatedLines } = await import('../src/tree/validate.ts')

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture = (...parts: string[]): string => path.join(here, 'fixtures', ...parts)
const exampleTree = path.join(here, '..', 'trees', 'ai-act-example')

afterEach(() => {
  reads.length = 0
})

describe('a Tree in two languages', () => {
  test('the manifest carries the declared languages, the first one as the default', async () => {
    const tree = await openTree(exampleTree)

    expect(tree.id).toBe('ai-act-example')
    expect(tree.manifest.format).toBe('elsa-tree/2')
    expect(tree.manifest.languages).toEqual(['en', 'nl'])
    expect(tree.manifest.defaultLanguage).toBe('en')
    expect(tree.manifest.root).toBe('start')
    expect(tree.manifest.metadata.version).toBe('2.0')
  })

  test('every Node of the Tree is returned by its own id', async () => {
    const tree = await openTree(exampleTree)
    const ids = [
      'start',
      'outside-scope',
      'prohibited-practices',
      'social-scoring',
      'emotion-recognition-at-work',
      'prohibited',
      'covered',
    ]

    for (const id of ids) {
      const node = await tree.getNode(id)
      expect(node, id).not.toBeNull()
      expect(node!.id).toBe(id)
      for (const lang of tree.manifest.languages) {
        expect(node!.title[lang], `${id}.title.${lang}`).toBeTruthy()
        expect(node!.description[lang], `${id}.description.${lang}`).toBeTruthy()
      }
    }
  })

  test('a question Node carries its two Answers, its Sources and its Images', async () => {
    const tree = await openTree(exampleTree)
    const node = await tree.getNode('start')

    expect(node!.kind).toBe('question')
    // The narrowing the discriminated union of section 5.1 exists for.
    if (node!.kind !== 'question') throw new Error('unreachable')
    expect(node!.answers).toEqual({ yes: 'prohibited-practices', no: 'outside-scope' })
    expect(node!.sources).toEqual([
      {
        id: 'art-2',
        kind: 'legal',
        label: {
          en: 'Article 2 AI Act (scope)',
          nl: 'Artikel 2 AI-verordening (toepassingsgebied)',
        },
        url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
      },
    ])
    expect(node!.images).toEqual([
      {
        file: 'eu-map.png',
        description: {
          en: 'Map of the European Union member states',
          nl: 'Kaart van de lidstaten van de Europese Unie',
        },
        credit: 'Map: Example Cartography, CC BY 4.0',
        source: 'art-2',
      },
    ])
    expect(node!.options).toEqual([])
  })

  test('a Node with Options carries them in order, each with its own Images', async () => {
    const tree = await openTree(exampleTree)
    const node = await tree.getNode('prohibited-practices')

    expect(node!.options.map((option) => option.target)).toEqual([
      'social-scoring',
      'emotion-recognition-at-work',
    ])
    expect(node!.options[0]!.title.nl).toBe('Sociale scoring')
    expect(node!.options[0]!.images).toEqual([
      {
        file: 'scoreboard.png',
        description: { en: 'A scoreboard ranking people', nl: 'Een scorebord dat mensen rangschikt' },
        credit: 'Illustration: Example Studio, CC0 1.0',
      },
    ])
    // An absent list becomes an empty array, so a caller never checks for undefined.
    expect(node!.options[1]!.images).toEqual([])
  })

  test('an explanation Node has no Answers and no Terminal marker', async () => {
    const tree = await openTree(exampleTree)
    const node = await tree.getNode('social-scoring')

    expect(node!.kind).toBe('explanation')
    expect(node!.sources.map((source) => source.kind)).toEqual(['legal', 'case-law', 'literature'])
    expect(node!).not.toHaveProperty('answers')
    expect(node!).not.toHaveProperty('outcome')
  })

  test('a Terminal carries its outcome', async () => {
    const tree = await openTree(exampleTree)
    const node = await tree.getNode('prohibited')

    expect(node!.kind).toBe('terminal')
    if (node!.kind !== 'terminal') throw new Error('unreachable')
    expect(node!.outcome).toBe('prohibited')
    expect(node!.options).toEqual([])
  })

  test('getTitle answers from the index, for a Trail, without reading a file', async () => {
    const tree = await openTree(exampleTree)
    reads.length = 0

    expect(tree.getTitle('outside-scope')!.nl).toBe('De AI-verordening is niet van toepassing')
    expect(tree.getTitle('no-such-node')).toBeNull()
    expect(reads).toEqual([])
  })

  test('imagePath resolves inside this Tree and refuses anything else', async () => {
    const tree = await openTree(exampleTree)

    expect(tree.imagePath('eu-map.png')).toBe(path.join(exampleTree, 'images', 'eu-map.png'))
    expect(tree.imagePath('no-such-image.png')).toBeNull()
    expect(tree.imagePath('../../../etc/passwd')).toBeNull()
    expect(tree.imagePath('EU-Map.PNG')).toBeNull()
  })
})

describe('the Theme the Tree carries', () => {
  test('the manifest hands out the logo, the fonts and the seven colours', async () => {
    const tree = await openTree(exampleTree)
    const theme = tree.manifest.theme!

    expect(theme.logo).toEqual({
      light: 'elsa-lab-logo.svg',
      dark: 'elsa-lab-logo-white.svg',
      alt: { en: 'ELSA-Lab for sustainable food systems', nl: 'ELSA-Lab voor duurzame voedselsystemen' },
      url: 'https://ai4sfs.org',
    })
    expect(theme.fonts!.map((family) => [family.family, family.role])).toEqual([
      ['Open Sans', 'body'],
      ['Nova Square', 'heading'],
    ])
    expect(theme.fonts![0]!.files[0]).toEqual({ file: 'open-sans-400.woff2', weight: '400', style: 'normal' })
    expect(Object.keys(theme.colours!)).toEqual([
      'background',
      'surface',
      'text',
      'text-muted',
      'accent',
      'accent-secondary',
      'danger',
    ])
    expect(theme.colours!.accent).toBe('#ffc600')
  })

  test('themePath resolves a file the Theme names, and nothing else', async () => {
    const tree = await openTree(exampleTree)

    expect(tree.themePath('elsa-lab-logo.svg')).toBe(path.join(exampleTree, 'theme', 'elsa-lab-logo.svg'))
    expect(tree.themePath('open-sans-400.woff2')).toBe(path.join(exampleTree, 'theme', 'open-sans-400.woff2'))
    // The licence text sits in theme/ and the Theme does not reference it (4.3.2).
    expect(tree.themePath('ofl-open-sans.txt')).toBeNull()
    expect(tree.themePath('no-such-logo.svg')).toBeNull()
    expect(tree.themePath('../../../etc/passwd')).toBeNull()
    expect(tree.themePath('ELSA-Lab-Logo.SVG')).toBeNull()
  })

  test('a file the Theme does not name is refused although it exists', async () => {
    const tree = await openTree(fixture('other-languages'))

    expect(tree.themePath('logo.svg')).toBe(path.join(fixture('other-languages'), 'theme', 'logo.svg'))
    expect(tree.themePath('unused.svg')).toBeNull()
  })

  test('a Tree without a Theme has none, and resolves no theme file', async () => {
    const tree = await openTree(fixture('single-language'))

    expect(tree.manifest.theme).toBeUndefined()
    expect(tree.themePath('logo.svg')).toBeNull()
  })
})

describe('the Tree is read once and a page reads nothing', () => {
  test('openTree reads one file: the Tree', async () => {
    await openTree(exampleTree)

    expect(reads).toEqual([path.join(exampleTree, 'tree.yaml')])
  })

  test('a Node page costs no file read at all', async () => {
    const tree = await openTree(exampleTree)
    reads.length = 0

    const node = await tree.getNode('prohibited-practices')

    expect(reads).toEqual([])
    // The Node names its Links by id only; no neighbouring Node came along with it.
    expect(node!.options.map((option) => option.target)).toEqual([
      'social-scoring',
      'emotion-recognition-at-work',
    ])
    expect(JSON.stringify(node)).not.toContain('Evaluating or classifying people')
  })

  test('the seventeen Nodes a page may ask for cost no read either', async () => {
    // The bound of ADR-38-neighbourhood: one Node plus at most sixteen neighbours.
    const tree = await openTree(exampleTree)
    reads.length = 0

    for (let i = 0; i < 17; i += 1) await tree.getNode('start')

    expect(reads).toEqual([])
  })

  test('an unknown or malformed id is null, and touches no file', async () => {
    const tree = await openTree(exampleTree)
    reads.length = 0

    for (const id of ['no-such-node', '../tree', 'Start', 'a--b', '-start', 'tree:start', '', 'a'.repeat(65)]) {
      await expect(tree.getNode(id), id).resolves.toBeNull()
    }
    expect(reads).toEqual([])
  })
})

describe('a Tree in languages the frontend does not know', () => {
  test.each([
    ['single-language', ['nl']],
    ['other-languages', ['de', 'fr']],
    ['german-only', ['de']],
  ])('%s loads and every Node carries text in %s', async (name, languages) => {
    const tree = await openTree(fixture(name))

    expect(tree.manifest.languages).toEqual(languages)
    expect(tree.manifest.defaultLanguage).toBe(languages[0])
    const root = await tree.getNode(tree.manifest.root)
    expect(root).not.toBeNull()
    for (const lang of languages) expect(root!.title[lang]).toBeTruthy()
  })
})

describe('an invalid Tree is rejected, naming the Node and the rule', () => {
  // One fixture per validity rule of tree-format.md section 7, each breaking exactly that
  // rule (docs/specs/application.md section 7).
  const rules = [
    'V-DIR', 'V-YAML', 'V-FORMAT', 'V-LANG', 'V-ROOT', 'V-TITLE', 'V-META', 'V-KEYS',
    'V-REACH', 'V-THEME', 'V-L10N', 'V-PLAIN', 'V-HTML', 'V-LENGTH', 'V-LINES', 'V-COUNT',
    'V-NODE', 'V-KIND', 'V-ANSWERS', 'V-OPTIONS', 'V-ORPHAN', 'V-TERMINAL', 'V-SOURCE',
    'V-IMAGE', 'V-CROSS',
  ]

  test('every rule of section 7 has a fixture, and every fixture a rule', async () => {
    const folders = await readdir(fixture('invalid'))

    expect(folders.sort()).toEqual(rules.map((rule) => rule.toLowerCase()).sort())
  })

  test.each(rules)('%s', async (rule) => {
    const dir = fixture('invalid', rule.toLowerCase())

    const error = await openTree(dir).then(
      () => null,
      (reason: unknown) => reason,
    )

    expect(error, `${rule} fixture loaded without error`).toBeInstanceOf(TreeInvalid)
    const invalid = error as InstanceType<typeof TreeInvalid>
    expect(invalid.treeId).toBe(rule.toLowerCase())
    // Exactly this rule: a fixture that also trips another rule proves the wrong thing.
    expect([...new Set(invalid.violations.map((v) => v.rule))]).toEqual([rule])
    for (const violation of invalid.violations) {
      expect(violation.message).not.toBe('')
      // The message a person reads names where it is and the rule (tree-format.md section 7).
      expect(invalid.message).toContain(violation.file || rule.toLowerCase())
      expect(invalid.message).toContain(rule)
    }
  })

  test('a length violation names the field, the language, the actual length and the maximum', async () => {
    const error = await openTree(fixture('invalid', 'v-length')).then(
      () => null,
      (reason: unknown) => reason as InstanceType<typeof TreeInvalid>,
    )

    expect(error!.violations).toEqual([
      { file: 'start', keyPath: 'title.en', rule: 'V-LENGTH', message: '81 characters; at most 80' },
    ])
  })

  test('every violation is reported, not just the first', async () => {
    const error = await openTree(fixture('invalid', 'v-options')).then(
      () => null,
      (reason: unknown) => reason as InstanceType<typeof TreeInvalid>,
    )

    expect(error!.violations).toHaveLength(1)
    expect(error!.violations[0]).toMatchObject({
      file: 'start',
      keyPath: 'options[1].target',
      rule: 'V-OPTIONS',
    })
  })

  test('a folder that is not a Tree at all is rejected, not crashed on', async () => {
    await expect(openTree(fixture('no-such-folder'))).rejects.toBeInstanceOf(TreeInvalid)
  })
})

describe('a Tree whose Links, Sources or Images are broken is rejected', () => {
  // These fixtures are named after the defect rather than after a rule: the defects the
  // issue names cannot be isolated one rule per fixture, which is what `invalid/<rule>/`
  // above requires. A dangling Answer, for one, also strands the Node it used to reach.
  const cases: Array<[string, Violation[]]> = [
    [
      // The Link to a missing Node the issue asks for by name.
      'answer-to-missing-node',
      [
        { file: 'start', keyPath: 'answers.yes', rule: 'V-ANSWERS', message: '"no-such-node" is not a Node of this Tree' },
        { file: 'yes-end', keyPath: '', rule: 'V-REACH', message: 'not reachable from root "start" by following Answers and Options' },
      ],
    ],
    [
      'answer-to-explanation',
      [
        { file: 'start', keyPath: 'answers.yes', rule: 'V-ANSWERS', message: '"detail" is an explanation Node; an Answer must lead to a question Node or a Terminal' },
      ],
    ],
    [
      'option-to-missing-node',
      [
        { file: 'start', keyPath: 'options[0].target', rule: 'V-OPTIONS', message: '"no-such-node" is not a Node of this Tree' },
      ],
    ],
    [
      // Three independent rules on one Node, so their reports do not hide each other.
      'option-to-terminal',
      [
        { file: 'start', keyPath: 'sources[1].id', rule: 'V-SOURCE', message: 'Source id "art-2" is used twice on this Node' },
        { file: 'start', keyPath: 'images[0].source', rule: 'V-IMAGE', message: 'source must name the id of a Source on this Node' },
        { file: 'start', keyPath: 'options[0].target', rule: 'V-OPTIONS', message: '"yes-end" is a terminal Node; an Option must lead to an explanation Node' },
      ],
    ],
    [
      // The half of V-TERMINAL that `invalid/v-terminal/` (a bad outcome) does not reach.
      'terminal-with-options',
      [
        { file: 'yes-end', keyPath: 'options', rule: 'V-TERMINAL', message: 'a Terminal cannot have options' },
      ],
    ],
  ]

  test.each(cases)('%s', async (name, expected) => {
    const error = await openTree(fixture('broken', name)).then(
      () => null,
      (reason: unknown) => reason,
    )

    expect(error, `${name} loaded without error`).toBeInstanceOf(TreeInvalid)
    const invalid = error as InstanceType<typeof TreeInvalid>
    // Exactly these, and nothing else: an extra violation means the fixture proves
    // something other than what it is named for.
    expect(invalid.violations).toEqual(expected)
    for (const violation of expected) {
      expect(invalid.message).toContain(violation.file)
      expect(invalid.message).toContain(violation.rule)
    }
  })

  test('a Node document that does not parse breaks that Node and no other', async () => {
    // tree-format.md 3.7: the error is reported for its own document, with its line
    // number, and the other documents are still read and checked.
    const error = await openTree(fixture('broken', 'node-document-does-not-parse')).then(
      () => null,
      (reason: unknown) => reason as InstanceType<typeof TreeInvalid>,
    )

    expect(error!.violations).toHaveLength(1)
    expect(error!.violations[0]).toMatchObject({ file: 'detail', keyPath: '', rule: 'V-YAML' })
    expect(error!.violations[0]!.message).toContain('at line 33')
  })
})

describe('how text is measured (tree-format.md 3.8)', () => {
  test('a link counts as the words the reader sees, not as its URL', () => {
    const written = 'See [the Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj).'

    expect(countedLength(written)).toBe('See the Act.'.length)
  })

  test('length is counted in characters, not in bytes', () => {
    expect(countedLength('  café  ')).toBe(4)
  })

  test("the spec's worked example lays out over exactly eight lines", async () => {
    // Section 3.8: three blocks of 163, 135 and 61 characters and two breaks, which is
    // 3 + 2 + 1 + 2 = 8 -- exactly the maximum. The text is the root Node of section 8.
    const tree = await openTree(exampleTree)
    const start = (await tree.getNode('start'))!

    expect(estimatedLines(start.description.en!)).toBe(8)
    expect(countedLength(start.description.en!)).toBe(363)
  })

  test('a list of short entries takes a line each, however short the text is', () => {
    const text = 'One paragraph.\n\n- one\n- two\n- three'

    expect(countedLength(text)).toBe(35)
    expect(estimatedLines(text)).toBe(5)
  })
})
