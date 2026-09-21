/**
 * The Tree loader (docs/specs/application.md section 5.1): what `openTree` accepts, what
 * it rejects, and the promise that a page is served from the index without touching a file.
 *
 * Fixtures are always loaded through `openTree`; no test builds a `Node` by hand or parses
 * a `tree.json` itself (docs/specs/application.md section 7).
 */
import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
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

/** The violations `openTree` refused this Tree folder with; fails the test if it loaded. */
async function violationsOf(dir: string): Promise<Violation[]> {
  const error = await openTree(dir).then(
    () => null,
    (reason: unknown) => reason,
  )
  expect(error, `${path.basename(dir)} loaded without error`).toBeInstanceOf(TreeInvalid)
  return (error as InstanceType<typeof TreeInvalid>).violations
}

describe('a Tree in two languages', () => {
  test('the manifest carries the declared languages, the first one as the default', async () => {
    const tree = await openTree(exampleTree)

    expect(tree.id).toBe('ai-act-example')
    expect(tree.manifest.format).toBe('elsa-tree/4')
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

  test('a Node with Options carries them in order, each a title and a target only', async () => {
    const tree = await openTree(exampleTree)
    const node = await tree.getNode('prohibited-practices')

    expect(node!.options.map((option) => option.target)).toEqual([
      'social-scoring',
      'emotion-recognition-at-work',
    ])
    expect(node!.options[0]).toEqual({
      title: { en: 'Social scoring', nl: 'Sociale scoring' },
      target: 'social-scoring',
    })
    // The picture the Option's button shows is its target's first Image (tree-format.md 5.4).
    expect((await tree.getNode('social-scoring'))!.images[0]).toEqual({
      file: 'scoreboard.png',
      description: { en: 'A scoreboard ranking people', nl: 'Een scorebord dat mensen rangschikt' },
      credit: 'Illustration: Example Studio, CC0 1.0',
    })
  })

  test('a Node carries its explainers; a Node without any has an empty list', async () => {
    const tree = await openTree(exampleTree)

    expect((await tree.getNode('start'))!.explainers).toEqual([
      {
        id: 'provider',
        term: { en: 'provider', nl: 'aanbieder' },
        text: {
          en: 'Someone who develops an AI system, or has one developed, and places it on the market or puts it into service under their own name or trademark.',
          nl: 'Wie een AI-systeem ontwikkelt of laat ontwikkelen en het onder eigen naam of merk in de handel brengt of in gebruik stelt.',
        },
      },
    ])
    // An absent list becomes an empty array, so a caller never checks for undefined.
    expect((await tree.getNode('covered'))!.explainers).toEqual([])
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

  test('every Node carries at least one Image, and its first credit names a licence', async () => {
    // Issue #84: the example Tree, like the first, gives every Node a main image. Its Nodes are
    // found by following Answers and Options from the root, as a reader would reach them.
    const tree = await openTree(exampleTree)
    const seen = new Set<string>()
    for (let queue = [tree.manifest.root], id = queue.shift(); id !== undefined; id = queue.shift()) {
      if (seen.has(id)) continue
      seen.add(id)
      const node = (await tree.getNode(id))!
      expect(node.images.length, `${id} carries no Image`).toBeGreaterThan(0)
      expect(node.images[0]!.credit, `${id}: first credit names no licence`).toMatch(/CC0 1\.0|CC BY(-SA)? [0-9.]+|public domain/)
      if (node.kind === 'question') queue.push(node.answers.yes, node.answers.no)
      queue.push(...node.options.map((option) => option.target))
    }
    expect(seen.size, 'Nodes walked from the root').toBe(7)
  })

  test('imagePath resolves inside this Tree and refuses anything else', async () => {
    const tree = await openTree(exampleTree)

    expect(tree.imagePath('eu-map.png')).toBe(path.join(exampleTree, 'images', 'eu-map.png'))
    expect(tree.imagePath('no-such-image.png')).toBeNull()
    expect(tree.imagePath('../../../etc/passwd')).toBeNull()
    expect(tree.imagePath('EU-Map.PNG')).toBeNull()
  })
})

describe('explainers at every maximum (tree-format.md 5.7, 5.9)', () => {
  test('eight explainers, each a 40-character term and a 200-character text in both languages, load', async () => {
    const tree = await openTree(fixture('explainers'))
    const node = (await tree.getNode('start'))!

    expect(node.explainers).toHaveLength(8)
    for (const explainer of node.explainers) {
      for (const lang of ['en', 'nl']) {
        expect(countedLength(explainer.term[lang]!), `${explainer.id}.term.${lang}`).toBe(40)
        expect(countedLength(explainer.text[lang]!), `${explainer.id}.text.${lang}`).toBe(200)
        expect(node.description[lang], `${explainer.id} marked in ${lang}`).toContain(`](#${explainer.id})`)
      }
    }
  })

  test('the full Node carries one explainer at its maximum lengths', async () => {
    const tree = await openTree(fixture('full-node'))
    const [explainer, ...rest] = (await tree.getNode('full'))!.explainers

    expect(rest).toEqual([])
    expect([countedLength(explainer!.term.en!), countedLength(explainer!.text.nl!)]).toEqual([40, 200])
  })
})

describe('the Theme the Tree carries', () => {
  test('the manifest hands out the logo, the fonts and the seven colours', async () => {
    const tree = await openTree(exampleTree)
    const theme = tree.manifest.theme!

    expect(theme.logo).toEqual({
      light: 'example-lab-logo.svg',
      dark: 'example-lab-logo-white.svg',
      alt: { en: 'Example Lab', nl: 'Voorbeeldlab' },
      url: 'https://example.org',
    })
    // One family, in the `heading` role: the example Tree gives no `body` family, so its
    // running text falls back to the frontend's own stack (tree-format.md 4.3.2).
    expect(theme.fonts!.map((family) => [family.family, family.role])).toEqual([['Nova Square', 'heading']])
    expect(theme.fonts![0]!.files[0]).toEqual({ file: 'nova-square-400.woff2', weight: '400', style: 'normal' })
    expect(Object.keys(theme.colours!)).toEqual([
      'background',
      'surface',
      'text',
      'text-muted',
      'accent',
      'accent-secondary',
      'danger',
    ])
    expect(theme.colours!.accent).toBe('#e2604a')
  })

  test('themePath resolves a file the Theme names, and nothing else', async () => {
    const tree = await openTree(exampleTree)

    expect(tree.themePath('example-lab-logo.svg')).toBe(path.join(exampleTree, 'theme', 'example-lab-logo.svg'))
    expect(tree.themePath('nova-square-400.woff2')).toBe(path.join(exampleTree, 'theme', 'nova-square-400.woff2'))
    // The licence text sits in theme/ and the Theme does not reference it (4.3.2).
    expect(tree.themePath('ofl-nova-square.txt')).toBeNull()
    expect(tree.themePath('no-such-logo.svg')).toBeNull()
    expect(tree.themePath('../../../etc/passwd')).toBeNull()
    expect(tree.themePath('Example-Lab-Logo.SVG')).toBeNull()
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

    expect(reads).toEqual([path.join(exampleTree, 'tree.json')])
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
    // The bound of application.md 11.2: one Node, at most fifteen neighbours and one Overlay.
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
  // rule, and each answered by the tool the rule's Where column names: `schema` for a
  // shape failure, `rules` for a content one (3.9, docs/specs/application.md section 7).
  const rules: Array<[rule: string, answers: 'schema' | 'rules']> = [
    ['V-DIR', 'rules'], ['V-JSON', 'rules'], ['V-SCHEMA', 'schema'], ['V-FORMAT', 'schema'],
    ['V-NULL', 'schema'], ['V-EMPTY', 'schema'], ['V-LANG', 'schema'], ['V-ROOT', 'rules'],
    ['V-TITLE', 'schema'], ['V-META', 'schema'], ['V-KEYS', 'schema'], ['V-REACH', 'rules'],
    ['V-THEME', 'schema'], ['V-L10N', 'rules'], ['V-PLAIN', 'rules'], ['V-HTML', 'rules'],
    ['V-LENGTH', 'rules'], ['V-LINES', 'rules'], ['V-COUNT', 'rules'], ['V-NODE', 'schema'],
    ['V-KIND', 'schema'], ['V-ANSWERS', 'schema'], ['V-OPTIONS', 'rules'], ['V-ORPHAN', 'rules'],
    ['V-TERMINAL', 'schema'], ['V-SOURCE', 'schema'], ['V-IMAGE', 'rules'],
    ['V-EXPLAINER', 'rules'], ['V-MARK', 'rules'], ['V-CROSS', 'schema'],
  ]

  test('every rule of section 7 has a fixture, and every fixture a rule', async () => {
    const folders = await readdir(fixture('invalid'))

    expect(folders.sort()).toEqual(rules.map(([rule]) => rule.toLowerCase()).sort())
  })

  test.each(rules)('%s is answered by the %s', async (rule, answers) => {
    const dir = fixture('invalid', rule.toLowerCase())

    const error = await openTree(dir).then(
      () => null,
      (reason: unknown) => reason,
    )

    expect(error, `${rule} fixture loaded without error`).toBeInstanceOf(TreeInvalid)
    const invalid = error as InstanceType<typeof TreeInvalid>
    expect(invalid.treeId).toBe(rule.toLowerCase())
    if (answers === 'rules') {
      // Exactly this rule: a fixture that also trips another rule proves the wrong thing.
      expect([...new Set(invalid.violations.map((v) => v.rule))]).toEqual([rule])
      for (const violation of invalid.violations) {
        expect(invalid.message).toContain(violation.file || rule.toLowerCase())
        expect(invalid.message).toContain(rule)
      }
    } else {
      // The schema answers in its own form: the file, a JSON Pointer and its own words.
      // The rule id is in section 7's table, not in the message; nothing translates it.
      expect([...new Set(invalid.violations.map((v) => v.rule))]).toEqual(['schema'])
      for (const violation of invalid.violations) {
        expect(violation.file).toBe('tree.json')
        expect(violation.keyPath.startsWith('/'), `${rule}: "${violation.keyPath}" is not a JSON Pointer`).toBe(true)
      }
    }
    for (const violation of invalid.violations) expect(violation.message).not.toBe('')
  })

  test('the two report forms stand side by side, and neither is the other', async () => {
    const shape = await violationsOf(fixture('invalid', 'v-keys'))
    const content = await violationsOf(fixture('invalid', 'v-length'))

    expect(shape).toEqual([
      { file: 'tree.json', keyPath: '/nodes/0', rule: 'schema', message: 'must NOT have additional properties: "notes"' },
    ])
    expect(content).toEqual([
      { file: 'start', keyPath: 'title.en', rule: 'V-LENGTH', message: '81 characters; at most 80' },
    ])
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

  test('an explainer marked nowhere in one language names the explainer and the language', async () => {
    const error = await openTree(fixture('invalid', 'v-explainer')).then(
      () => null,
      (reason: unknown) => reason as InstanceType<typeof TreeInvalid>,
    )

    expect(error!.violations).toEqual([
      {
        file: 'start',
        keyPath: 'explainers[0]',
        rule: 'V-EXPLAINER',
        message: '"provider" is not marked in description.nl; write [words](#provider) where the term occurs',
      },
    ])
  })

  test('a mark naming no explainer of its Node names the mark', async () => {
    const error = await openTree(fixture('invalid', 'v-mark')).then(
      () => null,
      (reason: unknown) => reason as InstanceType<typeof TreeInvalid>,
    )

    expect(error!.violations).toEqual([
      { file: 'start', keyPath: 'description.en', rule: 'V-MARK', message: '"[deployer](#deployer)" names no explainer of this Node' },
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
      // The schema states it as `options: false` under `dependentSchemas.terminal`, so the
      // pointer names the key and the words are the schema's (tree-format.md 3.9).
      'terminal-with-options',
      [
        { file: 'tree.json', keyPath: '/nodes/3/options', rule: 'schema', message: 'boolean schema is false' },
      ],
    ],
    [
      'explainer-malformed',
      [
        { file: 'start', keyPath: 'explainers[1].id', rule: 'V-EXPLAINER', message: 'explainer id "provider" is used twice on this Node' },
      ],
    ],
    [
      // `"explainers": []` is V-EMPTY, which the schema owns: one way to say a thing.
      'explainers-empty',
      [
        { file: 'tree.json', keyPath: '/nodes/0/explainers', rule: 'schema', message: 'must NOT have fewer than 1 items' },
      ],
    ],
    [
      // The one rule of elsa-tree/4 a valid elsa-tree/3 Tree could trip (12.6.2). Ajv says
      // it twice, once for the `not` and once for the key it fired on; both are the schema's.
      'metadata-all-digits',
      [
        { file: 'tree.json', keyPath: '/metadata', rule: 'schema', message: 'must NOT be valid' },
        { file: 'tree.json', keyPath: '/metadata', rule: 'schema', message: 'property name must be valid: "2024"' },
      ],
    ],
    [
      'mark-inside-strong',
      [
        { file: 'start', keyPath: 'description.en', rule: 'V-MARK', message: '"[provider](#provider)" is inside emphasis or strong text, or holds some; the frontend styles a mark itself' },
        { file: 'start', keyPath: 'description.nl', rule: 'V-MARK', message: '"[](#provider)" has no text for the reader to see' },
      ],
    ],
    [
      'mark-in-manifest',
      [
        { file: 'manifest', keyPath: 'description.en', rule: 'V-MARK', message: '"[provider](#provider)" names no explainer; the manifest has none' },
      ],
    ],
    [
      // The limits of explainers are the length and count rules of 5.7, not a rule of their own.
      'too-many-explainers',
      [
        { file: 'start', keyPath: 'explainers', rule: 'V-COUNT', message: '9 entries; at most 8' },
      ],
    ],
    [
      'explainer-too-long',
      [
        { file: 'start', keyPath: 'explainers[0].term.en', rule: 'V-LENGTH', message: '41 characters; at most 40' },
        { file: 'start', keyPath: 'explainers[0].text.nl', rule: 'V-LENGTH', message: '201 characters; at most 200' },
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

  test('a file that does not parse is one V-JSON with the parser position, and nothing else', async () => {
    // One JSON file is one document, so a syntax error anywhere is a syntax error
    // everywhere: no other rule is checked (tree-format.md 7, 12.6.3).
    const violations = await violationsOf(fixture('invalid', 'v-json'))

    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({ file: 'tree.json', keyPath: '', rule: 'V-JSON' })
    expect(violations[0]!.message).toMatch(/line 47 column 1/)
  })

  test('a duplicate key is caught although the parser keeps the last value silently', async () => {
    // The one rule of the format that reads the bytes rather than the value (3.7): the
    // fixture's manifest names `root` twice, and JSON.parse would answer "no-end".
    const file = path.join(fixture('broken', 'duplicate-key'), 'tree.json')
    const violations = await violationsOf(fixture('broken', 'duplicate-key'))

    expect(violations).toEqual([
      { file: 'tree.json', keyPath: '', rule: 'V-JSON', message: 'the key "root" appears twice in one object, at line 8 column 3' },
    ])
    // The assertion that makes the test worth having: the same bytes parse without a
    // complaint, so the scan cannot be quietly replaced by a parse that reports nothing.
    const parsed = JSON.parse(await readFile(file, 'utf8')) as { root: string }
    expect(parsed.root).toBe('no-end')
  })

  test.each([
    ['at the top level', '  "root": "start",\n', '  "root": "start",\n  "root": "no-end",\n', 'root'],
    ['inside a Node', '      "id": "start",\n', '      "id": "start",\n      "id": "elsewhere",\n', 'id'],
    ['inside a localised text', '        "en": "Does it apply?"\n', '        "en": "Does it apply?",\n        "en": "Something else"\n', 'en'],
    ['inside metadata', '  "version": "1.0"\n', '  "version": "1.0",\n  "version": "2.0"\n', 'version'],
  ])('the scan finds a repeat %s, at any depth', async (_where, anchor, repeated, key) => {
    // Four places, because the scan has to know which container it is in: an object keeps
    // its keys, an array has none, and a string is neither (tree-format.md 3.7).
    const source = await readFile(path.join(fixture('broken', 'duplicate-key'), 'tree.json'), 'utf8')
    // The fixture's own duplicate first, so each case is the only one in its file.
    const clean = source.replace('  "root": "no-end",\n', '')
    expect(clean, `the anchor ${JSON.stringify(anchor)} is in the fixture`).toContain(anchor)
    const work = await mkdtemp(path.join(tmpdir(), 'elsa-duplicate-'))
    // Inside the temporary directory, under the fixture's own name: the folder name is the
    // Tree's id, and a random one would fail V-DIR before the scan ever ran.
    const dir = path.join(work, 'duplicate-key')
    try {
      await cp(fixture('broken', 'duplicate-key'), dir, { recursive: true })
      await writeFile(path.join(dir, 'tree.json'), clean.replace(anchor, repeated), 'utf8')

      const violations = await violationsOf(dir)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({ file: 'tree.json', keyPath: '', rule: 'V-JSON' })
      expect(violations[0]!.message).toContain(`the key "${key}" appears twice`)
    } finally {
      await rm(work, { recursive: true, force: true })
    }
  })

  test('an escaped quote does not move the scan: the Tree loads, and a later repeat is still found', async () => {
    // The four cases above are what the scan must find; this is the other half, and it is
    // the half that costs an author a working Tree rather than a broken one. A scan that
    // loses the `\\` skip of loader.ts mistakes an escaped quote for the end of the string,
    // and from there it is out of step for the rest of the file: it rejects a Tree nothing
    // is wrong with, or -- worse -- it stops seeing the repeats it exists to find. The
    // description below carries a brace, a colon, a repeated key and an ODD number of
    // escaped quotes, which is what puts the rest of the file out of step; the second half
    // of the test is a real repeat standing after it.
    const text = 'Een scherm van 27" is geen AI-systeem: {"soort": "scherm", "soort": "beeld"} noemt het zo.'
    const source = await readFile(path.join(fixture('single-language'), 'tree.json'), 'utf8')
    const tree = JSON.parse(source) as { nodes: Array<{ description: Record<string, string>; metadata: unknown }> }
    tree.nodes[0]!.description.nl = text
    tree.nodes[0]!.metadata = { version: '1.0', note: 'een notitie' }
    const valid = `${JSON.stringify(tree, null, 2)}\n`
    // A repeat after the escaped quotes, written as text: JSON.stringify cannot produce one.
    const anchor = '"note": "een notitie"'
    expect(valid).toContain(anchor)
    const repeat = valid.replace(anchor, `${anchor},\n        "note": "nog een notitie"`)
    const work = await mkdtemp(path.join(tmpdir(), 'elsa-scan-'))
    try {
      const dir = path.join(work, 'escaped-quote')
      const repeated = path.join(work, 'escaped-quote-repeat')
      await cp(fixture('single-language'), dir, { recursive: true })
      await cp(fixture('single-language'), repeated, { recursive: true })
      await writeFile(path.join(dir, 'tree.json'), valid, 'utf8')
      await writeFile(path.join(repeated, 'tree.json'), repeat, 'utf8')
      // The bytes, not the value: the point is what the scan reads, and it reads the file.
      expect(valid).toContain('27\\" is geen')

      const loaded = await openTree(dir)
      const violations = await violationsOf(repeated)

      expect((await loaded.getNode('start'))!.description.nl).toBe(text)
      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({ file: 'tree.json', keyPath: '', rule: 'V-JSON' })
      expect(violations[0]!.message).toContain('the key "note" appears twice')
    } finally {
      await rm(work, { recursive: true, force: true })
    }
  })

  test('a byte-order mark is refused by name, not as a parser error', async () => {
    const violations = await violationsOf(fixture('broken', 'byte-order-mark'))

    expect(violations).toEqual([
      { file: 'tree.json', keyPath: '', rule: 'V-JSON', message: 'tree.json begins with a byte-order mark; write it as UTF-8 without one' },
    ])
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

  test("the spec's worked example lays out over exactly two lines", async () => {
    // Section 3.8: one block of 117 characters and no break, which is ceil(117 / 75) = 2 --
    // exactly the maximum. The text is the root Node of section 8.
    const tree = await openTree(exampleTree)
    const start = (await tree.getNode('start'))!

    expect(estimatedLines(start.description.en!)).toBe(2)
    expect(countedLength(start.description.en!)).toBe(117)
  })

  test('a list of short entries takes a line each, however short the text is', () => {
    const text = 'One paragraph.\n\n- one\n- two\n- three'

    expect(countedLength(text)).toBe(35)
    expect(estimatedLines(text)).toBe(5)
  })
})

/**
 * What the sitemap reads (docs/specs/application.md 16.2): which pages exist, and when the
 * Tree they come from last changed. Ids, not Nodes -- the bound of 5.2 is on how many
 * Nodes a page may carry, and nothing below hands out one.
 */
describe('the Node index the sitemap reads (#118)', () => {
  test('every Node id, in the order the file lists them', async () => {
    const tree = await openTree(exampleTree)

    expect(tree.nodeIds()).toEqual([
      'start',
      'outside-scope',
      'prohibited-practices',
      'social-scoring',
      'emotion-recognition-at-work',
      'prohibited',
      'covered',
    ])
  })

  test('the ids are exactly the Nodes `getNode` answers for, and no other id is one', async () => {
    const tree = await openTree(exampleTree)

    for (const id of tree.nodeIds()) expect(await tree.getNode(id), id).not.toBeNull()
    expect(await tree.getNode('no-such-node')).toBeNull()
    expect(tree.nodeIds()).not.toContain('no-such-node')
  })

  test("the Tree file's modification time is read once, at openTree", async () => {
    const tree = await openTree(exampleTree)
    const onDisk = await stat(path.join(exampleTree, 'tree.json'))

    expect(tree.lastModified?.getTime()).toBe(onDisk.mtime.getTime())
  })
})
