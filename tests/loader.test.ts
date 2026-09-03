/**
 * The Tree loader (docs/specs/application.md section 5.1): what `openTree` accepts, what
 * it rejects, and the promise that rendering a Node reads exactly one Node file.
 *
 * Fixtures are always loaded through `openTree`; no test builds a `Node` by hand or reads
 * YAML itself (docs/specs/application.md section 7).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { Violation } from '../src/tree/types.ts'

// Counting the reads is how the lazy-loading contract is measured, so the real module is
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
    expect(tree.manifest.format).toBe('elsa-tree/1')
    expect(tree.manifest.languages).toEqual(['en', 'nl'])
    expect(tree.manifest.defaultLanguage).toBe('en')
    expect(tree.manifest.root).toBe('start')
    expect(tree.manifest.metadata.version).toBe('1.0')
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

describe('getNode reads one file and never throws for bad input', () => {
  test('one Node page costs exactly one file read', async () => {
    const tree = await openTree(exampleTree)
    reads.length = 0

    const node = await tree.getNode('prohibited-practices')

    expect(reads).toEqual([path.join(exampleTree, 'nodes', 'prohibited-practices.yaml')])
    // The Node names its Links by id only; no neighbouring Node came along with it.
    expect(node!.options.map((option) => option.target)).toEqual([
      'social-scoring',
      'emotion-recognition-at-work',
    ])
    expect(JSON.stringify(node)).not.toContain('Evaluating or classifying people')
  })

  test('following a Link costs one more file read, and only that one', async () => {
    const tree = await openTree(exampleTree)
    await tree.getNode('start')
    reads.length = 0

    await tree.getNode('prohibited-practices')

    expect(reads).toHaveLength(1)
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

describe('an invalid Tree is rejected, naming the file and the rule', () => {
  // One fixture per validity rule of tree-format.md section 7, each breaking exactly that
  // rule (docs/specs/application.md section 7).
  const rules = [
    'V-DIR', 'V-YAML', 'V-FORMAT', 'V-LANG', 'V-ROOT', 'V-TITLE', 'V-META', 'V-KEYS',
    'V-REACH', 'V-L10N', 'V-PLAIN', 'V-HTML', 'V-NODE', 'V-KIND', 'V-ANSWERS',
    'V-OPTIONS', 'V-ORPHAN', 'V-TERMINAL', 'V-SOURCE', 'V-IMAGE', 'V-CROSS',
  ]

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
      // The message a person reads names the file and the rule (tree-format.md section 7).
      expect(invalid.message).toContain(violation.file || rule.toLowerCase())
      expect(invalid.message).toContain(rule)
    }
  })

  test('every violation is reported, not just the first', async () => {
    const error = await openTree(fixture('invalid', 'v-options')).then(
      () => null,
      (reason: unknown) => reason as InstanceType<typeof TreeInvalid>,
    )

    expect(error!.violations).toHaveLength(1)
    expect(error!.violations[0]).toMatchObject({
      file: 'nodes/start.yaml',
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
        { file: 'nodes/start.yaml', keyPath: 'answers.yes', rule: 'V-ANSWERS', message: '"no-such-node" is not a Node of this Tree' },
        { file: 'nodes/yes-end.yaml', keyPath: '', rule: 'V-REACH', message: 'not reachable from root "start" by following Answers and Options' },
      ],
    ],
    [
      'answer-to-explanation',
      [
        { file: 'nodes/start.yaml', keyPath: 'answers.yes', rule: 'V-ANSWERS', message: '"detail" is an explanation Node; an Answer must lead to a question Node or a Terminal' },
      ],
    ],
    [
      'option-to-missing-node',
      [
        { file: 'nodes/start.yaml', keyPath: 'options[0].target', rule: 'V-OPTIONS', message: '"no-such-node" is not a Node of this Tree' },
      ],
    ],
    [
      // Three independent rules on one Node, so their reports do not hide each other.
      'option-to-terminal',
      [
        { file: 'nodes/start.yaml', keyPath: 'sources[1].id', rule: 'V-SOURCE', message: 'Source id "art-2" is used twice on this Node' },
        { file: 'nodes/start.yaml', keyPath: 'images[0].source', rule: 'V-IMAGE', message: 'source must name the id of a Source on this Node' },
        { file: 'nodes/start.yaml', keyPath: 'options[0].target', rule: 'V-OPTIONS', message: '"yes-end" is a terminal Node; an Option must lead to an explanation Node' },
      ],
    ],
    [
      // The half of V-TERMINAL that `invalid/v-terminal/` (a bad outcome) does not reach.
      'terminal-with-options',
      [
        { file: 'nodes/yes-end.yaml', keyPath: 'options', rule: 'V-TERMINAL', message: 'a Terminal cannot have options' },
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
})
