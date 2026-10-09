/**
 * **[#136]** The draft rules (docs/specs/application.md 19.2, tree-format.md 7's Draft
 * column, ADR-132-draft-and-publish decision 2): the draft schema is the published one minus
 * exactly two keywords and two `required` entries, **[#221]** with `answers`' `minItems` 1, and every state an unfinished Tree passes
 * through is advisory in a draft and refused in full, while every shape and safety rule
 * stays blocking in both.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import schemaDocument from '../schemas/elsa-tree-6.json' with { type: 'json' }
import { openTree, TreeInvalid } from '../src/tree/loader.ts'
import { treeBytes } from '../src/tree/serialise.ts'
import { draftSchema, validateTree, type Mapping } from '../src/tree/validate.ts'

/** A small valid Tree: a question whose Answers end, and an aside under the question. */
function validTree(): Mapping {
  const text = (en: string): Record<string, string> => ({ en, nl: `${en} (nl)` })
  return {
    $schema: '/schemas/elsa-tree-6.json',
    format: 'elsa-tree/6',
    languages: ['en', 'nl'],
    root: 'start',
    title: text('A Tree'),
    metadata: { version: '1' },
    nodes: [
      {
        id: 'start',
        title: text('Start'),
        description: text('The first question.'),
        metadata: { version: '1' },
        images: [{ file: 'photo.png', description: text('A photo'), credit: 'Someone' }],
        answers: [
          { label: text('Yes'), target: 'yes-end' },
          { label: text('No'), target: 'no-end' },
        ],
        options: [{ title: text('More'), target: 'aside' }],
      },
      { id: 'yes-end', title: text('Yes'), description: text('Yes.'), metadata: { version: '1' }, terminal: { label: text('Applies') } },
      { id: 'no-end', title: text('No'), description: text('No.'), metadata: { version: '1' }, terminal: { label: text('Does not apply') } },
      { id: 'aside', title: text('Aside'), description: text('An aside.'), metadata: { version: '1' } },
    ],
  }
}

type Nodes = Array<Record<string, unknown>>
const node = (tree: Mapping, id: string): Record<string, unknown> => (tree.nodes as Nodes).find((n) => n.id === id)!
/** **[#221]** The next steps of the question Node `id` (tree-format.md 5.3). */
const steps = (tree: Mapping, id: string): Array<{ label: Record<string, string>; target: string }> => node(tree, id).answers as Array<{ label: Record<string, string>; target: string }>
/** **[#179]** The words of the Terminal `id` (tree-format.md 5.5). */
const label = (tree: Mapping, id: string): Record<string, string> => (node(tree, id).terminal as { label: Record<string, string> }).label

function check(tree: Mapping, mode: 'draft' | 'published') {
  return validateTree({ id: 't', tree, images: new Set(['photo.png']), themeFiles: new Set() }, mode)
}

/** One unfinished state per advisory row of the Draft column, and the rule it is reported under. */
const ADVISORY: Array<[string, string, (tree: Mapping) => void]> = [
  ['a language not written yet', 'V-L10N', (t) => ((node(t, 'start').title as Record<string, string>).nl = '')],
  ['a language missing', 'V-L10N', (t) => delete (node(t, 'start').title as Record<string, string>).nl],
  ['a text over its length', 'V-LENGTH', (t) => ((node(t, 'start').title as Record<string, string>).en = 'x'.repeat(81))],
  ['a description over its lines', 'V-LINES', (t) => ((node(t, 'start').description as Record<string, string>).en = 'a\n\nb\n\nc')],
  ['eleven images', 'V-COUNT', (t) => (node(t, 'start').images = Array.from({ length: 11 }, () => ({ file: 'photo.png', description: { en: 'a', nl: 'b' }, credit: 'c' })))],
  ['a Node without a title', 'V-NODE', (t) => delete node(t, 'aside').title],
  ['a Node without a description', 'V-NODE', (t) => delete node(t, 'aside').description],
  ['a root with neither Answers nor an end', 'V-ROOT', (t) => {
    const start = node(t, 'start')
    delete start.answers
    delete start.options
    ;(t.nodes as Nodes).splice(3, 1)
  }],
  // **[#221]** V-ANSWERS' Draft column: one next step is the to-do "fewer than two next steps".
  ['one next step', 'V-ANSWERS', (t) => steps(t, 'start').splice(1, 1)],
  ['an Answer to an explanation Node', 'V-ANSWERS', (t) => (steps(t, 'start')[1]!.target = 'aside')],
  ['a next step\'s words not written yet in one language', 'V-L10N', (t) => (steps(t, 'start')[0]!.label.nl = '')],
  ['a next step\'s words over their 19 characters', 'V-LENGTH', (t) => (steps(t, 'start')[0]!.label.en = 'Not for this purpose')],
  ['an Option to a Terminal', 'V-OPTIONS', (t) => (((node(t, 'start').options as Nodes)[0]!).target = 'yes-end')],
  ['an empty credit', 'V-IMAGE', (t) => (((node(t, 'start').images as Nodes)[0]!).credit = '')],
  ['an empty image description', 'V-L10N', (t) => ((((node(t, 'start').images as Nodes)[0]!).description as Record<string, string>).en = '')],
  ['an explainer not marked', 'V-EXPLAINER', (t) => (node(t, 'start').explainers = [{ id: 'term', term: { en: 'a', nl: 'b' }, text: { en: 'c', nl: 'd' } }])],
  ['a mark to a removed explainer', 'V-MARK', (t) => ((node(t, 'start').description as Record<string, string>).en = 'See [this](#gone).')],
  ['an unreachable Node', 'V-REACH', (t) => (t.nodes as Nodes).push({ id: 'lost', title: { en: 'a', nl: 'b' }, description: { en: 'a', nl: 'b' }, metadata: { version: '1' }, terminal: { label: { en: 'a', nl: 'b' } } })],
  ['an aside no Option targets', 'V-ORPHAN', (t) => delete node(t, 'start').options],
  // **[#179]** V-TERMINAL's Draft column: the words' empty languages and length advise.
  ['an ending not written yet in one language', 'V-L10N', (t) => (label(t, 'yes-end').nl = '')],
  ['an ending over its 19 characters', 'V-LENGTH', (t) => (label(t, 'yes-end').en = 'Mandatory safeguards')],
]

/** One state per blocking row: refused in a draft as in full. */
const BLOCKING: Array<[string, string, (tree: Mapping) => void]> = [
  // **[#221]** `/6` is the right one now.
  ['a wrong format', 'schema', (t) => (t.format = 'elsa-tree/5')],
  ['a null', 'schema', (t) => (node(t, 'aside').metadata = null)],
  ['an empty array', 'schema', (t) => (node(t, 'aside').sources = [])],
  ['an empty languages list', 'schema', (t) => (t.languages = [])],
  ['an empty version', 'schema', (t) => (t.metadata = { version: '' })],
  ['an unknown key', 'schema', (t) => (node(t, 'aside').anwsers = {})],
  ['a malformed id', 'schema', (t) => (node(t, 'aside').id = 'Not An Id')],
  // **[#221]** The draft schema's `minItems` 1 refuses an empty list, as V-EMPTY refused `{}` in /5.
  ['an empty answers list', 'schema', (t) => (node(t, 'start').answers = [])],
  ['answers in the /5 shape', 'schema', (t) => (node(t, 'start').answers = { yes: 'yes-end', no: 'no-end' })],
  ['a fifth next step', 'schema', (t) => steps(t, 'start').push(...[1, 2, 3].map(() => ({ label: { en: 'a', nl: 'b' }, target: 'yes-end' })))],
  ['a next step without words', 'schema', (t) => delete (steps(t, 'start')[0] as Partial<{ label: unknown }>).label],
  ['a next step\'s words on two lines', 'V-PLAIN', (t) => (steps(t, 'start')[0]!.label.en = 'Yes\nindeed')],
  ['an id used twice', 'V-NODE', (t) => (node(t, 'no-end').id = 'yes-end')],
  ['a Terminal with Options', 'schema', (t) => (node(t, 'yes-end').options = [{ title: { en: 'a', nl: 'b' }, target: 'aside' }])],
  // **[#179]** V-TERMINAL's shape blocks: the words are required, and an outcome is no key of /5.
  ['an outcome in place of the words', 'schema', (t) => (node(t, 'yes-end').terminal = { outcome: 'applicable' })],
  ['an outcome beside the words', 'schema', (t) => ((node(t, 'yes-end').terminal as Mapping).outcome = 'applicable')],
  ['an ending without words', 'schema', (t) => (node(t, 'yes-end').terminal = {})],
  ['an ending on two lines', 'V-PLAIN', (t) => (label(t, 'yes-end').en = 'Does not\napply')],
  ['an Answer to nothing', 'V-ANSWERS', (t) => (steps(t, 'start')[1]!.target = 'nowhere')],
  ['an Option to nothing', 'V-OPTIONS', (t) => (((node(t, 'start').options as Nodes)[0]!).target = 'nowhere')],
  ['an Option listed twice', 'V-OPTIONS', (t) => (node(t, 'start').options = [{ title: { en: 'a', nl: 'b' }, target: 'aside' }, { title: { en: 'c', nl: 'd' }, target: 'aside' }])],
  ['a root that is no Node', 'V-ROOT', (t) => (t.root = 'nowhere')],
  ['a picture not in images/', 'V-IMAGE', (t) => (((node(t, 'start').images as Nodes)[0]!).file = 'other.png')],
  ['a Source id used twice', 'V-SOURCE', (t) => (node(t, 'aside').sources = [1, 2].map(() => ({ id: 's', kind: 'legal', label: { en: 'a', nl: 'b' }, url: 'https://example.org' })))],
  ['a language the manifest does not declare', 'V-L10N', (t) => ((node(t, 'aside').title as Record<string, string>).de = 'x')],
  ['a title on two lines', 'V-PLAIN', (t) => ((node(t, 'aside').title as Record<string, string>).en = 'a\nb')],
  ['raw HTML', 'V-HTML', (t) => ((node(t, 'aside').description as Record<string, string>).en = '<b>x</b>')],
  ['nine explainers', 'V-COUNT', (t) => {
    const ids = Array.from({ length: 9 }, (_, i) => `e${i}`)
    node(t, 'aside').explainers = ids.map((id) => ({ id, term: { en: 'a', nl: 'b' }, text: { en: 'c', nl: 'd' } }))
    node(t, 'aside').description = { en: ids.map((id) => `[x](#${id})`).join(' '), nl: ids.map((id) => `[x](#${id})`).join(' ') }
  }],
]

describe('the draft schema (19.2)', () => {
  test('is the published schema minus two minLength keywords and two required entries, and **[#221]** answers\' minItems 1', () => {
    const published = schemaDocument as Mapping
    const draft = draftSchema(published) as typeof schemaDocument
    const defs = structuredClone(schemaDocument.$defs) as Record<string, Record<string, unknown>>
    delete (defs.localisedText!.additionalProperties as Mapping).minLength
    delete ((defs.image!.properties as Mapping).credit as Mapping).minLength
    defs.node!.required = ['id', 'metadata']
    defs.answers!.minItems = 1
    expect(draft.$defs).toEqual(defs)
    expect({ ...draft, $defs: null }).toEqual({ ...schemaDocument, $defs: null })
    // The published schema is not touched by the derivation.
    expect(schemaDocument.$defs.node.required).toContain('title')
  })

  test('the valid Tree is valid in both modes', () => {
    expect(check(validTree(), 'published')).toEqual([])
    expect(check(validTree(), 'draft')).toEqual([])
  })

  test('**[#221]** two, three and four next steps are valid in both modes, labels of 19 characters included, and two may share a target (41.1)', () => {
    for (const count of [2, 3, 4]) {
      const tree = validTree()
      const words = { en: 'Not in this purpose'.slice(0, 19), nl: 'Niet van toepassing' }
      steps(tree, 'start').splice(0, 2, ...Array.from({ length: count }, (_, i) => ({ label: words, target: i % 2 === 0 ? 'yes-end' : 'no-end' })))
      expect(check(tree, 'published'), String(count)).toEqual([])
      expect(check(tree, 'draft'), String(count)).toEqual([])
    }
  })
})

describe('advisory in a draft, refused in full (tree-format.md 7)', () => {
  test.for(ADVISORY)('%s: %s', ([, rule, change]) => {
    const tree = validTree()
    change(tree)
    const draft = check(tree, 'draft')
    expect(draft.length).toBeGreaterThan(0)
    expect(draft.filter((v) => !v.advisory)).toEqual([])
    expect(draft.map((v) => v.rule)).toContain(rule)
    const full = check(tree, 'published')
    expect(full.length).toBeGreaterThan(0)
    expect(full.every((v) => !('advisory' in v))).toBe(true)
  })
})

describe('blocking in a draft as in full', () => {
  test.for(BLOCKING)('%s: %s', ([, rule, change]) => {
    const tree = validTree()
    change(tree)
    const blocking = check(tree, 'draft').filter((v) => !v.advisory)
    expect(blocking.map((v) => v.rule)).toContain(rule)
    expect(check(tree, 'published').length).toBeGreaterThan(0)
  })
})

describe('openTree in draft mode (19.2)', () => {
  test('reads draft.json, holds the advisory list, and indexes a Node without a title', async () => {
    const dir = path.join(await mkdtemp(path.join(tmpdir(), 'elsa-draft-')), 'a-tree')
    try {
      const tree = validTree()
      delete node(tree, 'aside').title
      steps(tree, 'start').splice(1, 1)
      delete node(tree, 'start').images
      await mkdir(dir)
      await writeFile(path.join(dir, 'draft.json'), treeBytes(tree))
      const draft = await openTree(dir, { draft: true })
      expect(draft.advisory.map((v) => `${v.file} ${v.keyPath} ${v.rule}`)).toEqual([
        'start answers V-ANSWERS',
        'aside title V-NODE',
        // no-end is now reached by nothing
        'no-end  V-REACH',
      ])
      expect((await draft.getNode('aside'))!.title).toEqual({})
      expect((await draft.getNode('start'))!.answers).toEqual([{ label: { en: 'Yes', nl: 'Yes (nl)' }, target: 'yes-end' }])
      // tree.json is not there: the published reading of the same folder refuses it.
      await expect(openTree(dir)).rejects.toBeInstanceOf(TreeInvalid)

      node(tree, 'start').answers = []
      await writeFile(path.join(dir, 'draft.json'), treeBytes(tree))
      const refused = await openTree(dir, { draft: true }).catch((error: unknown) => error as TreeInvalid)
      expect(refused).toBeInstanceOf(TreeInvalid)
      expect((refused as TreeInvalid).violations.map((v) => `${v.rule} ${v.keyPath}`)).toEqual(['schema /nodes/0/answers'])
    } finally {
      await rm(path.dirname(dir), { recursive: true, force: true })
    }
  })

  test('**[#177]** referrers() answers the ids of the Nodes whose Answers or Options name a Node, in file order, and no Node', async () => {
    const dir = path.join(await mkdtemp(path.join(tmpdir(), 'elsa-draft-')), 'a-tree')
    try {
      const tree = validTree()
      delete node(tree, 'start').images
      // A second step that also leads to the aside and to one of the ends: one aside under two Nodes (tree-format.md 5.4).
      ;(tree.nodes as Mapping[]).push({ id: 'second', metadata: { version: '1' }, answers: [{ label: { en: 'Yes', nl: 'Ja' }, target: 'yes-end' }], options: [{ title: { en: 'More', nl: 'Meer' }, target: 'aside' }] })
      await mkdir(dir)
      await writeFile(path.join(dir, 'draft.json'), treeBytes(tree))
      const draft = await openTree(dir, { draft: true })
      expect(draft.referrers('aside')).toEqual(['start', 'second'])
      expect(draft.referrers('yes-end')).toEqual(['start', 'second'])
      expect(draft.referrers('no-end')).toEqual(['start'])
      expect(draft.referrers('start')).toEqual([])
      expect(draft.referrers('no-such-node')).toEqual([])
    } finally {
      await rm(path.dirname(dir), { recursive: true, force: true })
    }
  })
})
