/**
 * **[#136]** The draft rules (docs/specs/application.md 19.2, tree-format.md 7's Draft
 * column, ADR-132-draft-and-publish decision 2): the draft schema is the published one minus
 * exactly two keywords and two `required` entries, and every state an unfinished Tree passes
 * through is advisory in a draft and refused in full, while every shape and safety rule
 * stays blocking in both.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import schemaDocument from '../schemas/elsa-tree-4.json' with { type: 'json' }
import { openTree, TreeInvalid } from '../src/tree/loader.ts'
import { treeBytes } from '../src/tree/serialise.ts'
import { draftSchema, validateTree, type Mapping } from '../src/tree/validate.ts'

/** A small valid Tree: a question whose Answers end, and an aside under the question. */
function validTree(): Mapping {
  const text = (en: string): Record<string, string> => ({ en, nl: `${en} (nl)` })
  return {
    $schema: '/schemas/elsa-tree-4.json',
    format: 'elsa-tree/4',
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
        answers: { yes: 'yes-end', no: 'no-end' },
        options: [{ title: text('More'), target: 'aside' }],
      },
      { id: 'yes-end', title: text('Yes'), description: text('Yes.'), metadata: { version: '1' }, terminal: { outcome: 'applicable' } },
      { id: 'no-end', title: text('No'), description: text('No.'), metadata: { version: '1' }, terminal: { outcome: 'not-applicable' } },
      { id: 'aside', title: text('Aside'), description: text('An aside.'), metadata: { version: '1' } },
    ],
  }
}

type Nodes = Array<Record<string, unknown>>
const node = (tree: Mapping, id: string): Record<string, unknown> => (tree.nodes as Nodes).find((n) => n.id === id)!

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
  ['one Answer missing', 'V-ANSWERS', (t) => delete (node(t, 'start').answers as Record<string, string>).no],
  ['an Answer to an explanation Node', 'V-ANSWERS', (t) => ((node(t, 'start').answers as Record<string, string>).no = 'aside')],
  ['an Option to a Terminal', 'V-OPTIONS', (t) => (((node(t, 'start').options as Nodes)[0]!).target = 'yes-end')],
  ['an empty credit', 'V-IMAGE', (t) => (((node(t, 'start').images as Nodes)[0]!).credit = '')],
  ['an empty image description', 'V-L10N', (t) => ((((node(t, 'start').images as Nodes)[0]!).description as Record<string, string>).en = '')],
  ['an explainer not marked', 'V-EXPLAINER', (t) => (node(t, 'start').explainers = [{ id: 'term', term: { en: 'a', nl: 'b' }, text: { en: 'c', nl: 'd' } }])],
  ['a mark to a removed explainer', 'V-MARK', (t) => ((node(t, 'start').description as Record<string, string>).en = 'See [this](#gone).')],
  ['an unreachable Node', 'V-REACH', (t) => (t.nodes as Nodes).push({ id: 'lost', title: { en: 'a', nl: 'b' }, description: { en: 'a', nl: 'b' }, metadata: { version: '1' }, terminal: { outcome: 'refer' } })],
  ['an aside no Option targets', 'V-ORPHAN', (t) => delete node(t, 'start').options],
]

/** One state per blocking row: refused in a draft as in full. */
const BLOCKING: Array<[string, string, (tree: Mapping) => void]> = [
  ['a wrong format', 'schema', (t) => (t.format = 'elsa-tree/5')],
  ['a null', 'schema', (t) => (node(t, 'aside').metadata = null)],
  ['an empty array', 'schema', (t) => (node(t, 'aside').sources = [])],
  ['an empty languages list', 'schema', (t) => (t.languages = [])],
  ['an empty version', 'schema', (t) => (t.metadata = { version: '' })],
  ['an unknown key', 'schema', (t) => (node(t, 'aside').anwsers = {})],
  ['a malformed id', 'schema', (t) => (node(t, 'aside').id = 'Not An Id')],
  ['an empty answers object', 'V-EMPTY', (t) => (node(t, 'start').answers = {})],
  ['an id used twice', 'V-NODE', (t) => (node(t, 'no-end').id = 'yes-end')],
  ['a Terminal with Options', 'schema', (t) => (node(t, 'yes-end').options = [{ title: { en: 'a', nl: 'b' }, target: 'aside' }])],
  ['an Answer to nothing', 'V-ANSWERS', (t) => ((node(t, 'start').answers as Record<string, string>).no = 'nowhere')],
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
  test('is the published schema minus two minLength keywords and four required entries', () => {
    const published = schemaDocument as Mapping
    const draft = draftSchema(published) as typeof schemaDocument
    const defs = structuredClone(schemaDocument.$defs) as Record<string, Record<string, unknown>>
    delete (defs.localisedText!.additionalProperties as Mapping).minLength
    delete ((defs.image!.properties as Mapping).credit as Mapping).minLength
    defs.node!.required = ['id', 'metadata']
    defs.answers!.required = []
    expect(draft.$defs).toEqual(defs)
    expect({ ...draft, $defs: null }).toEqual({ ...schemaDocument, $defs: null })
    // The published schema is not touched by the derivation.
    expect(schemaDocument.$defs.node.required).toContain('title')
  })

  test('the valid Tree is valid in both modes', () => {
    expect(check(validTree(), 'published')).toEqual([])
    expect(check(validTree(), 'draft')).toEqual([])
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
      delete (node(tree, 'start').answers as Record<string, string>).no
      delete node(tree, 'start').images
      await mkdir(dir)
      await writeFile(path.join(dir, 'draft.json'), treeBytes(tree))
      const draft = await openTree(dir, { draft: true })
      expect(draft.advisory.map((v) => `${v.file} ${v.keyPath} ${v.rule}`)).toEqual([
        'start answers.no V-ANSWERS',
        'aside title V-NODE',
        // no-end is now reached by nothing
        'no-end  V-REACH',
      ])
      expect((await draft.getNode('aside'))!.title).toEqual({})
      expect((await draft.getNode('start'))!.answers).toEqual({ yes: 'yes-end' })
      // tree.json is not there: the published reading of the same folder refuses it.
      await expect(openTree(dir)).rejects.toBeInstanceOf(TreeInvalid)

      node(tree, 'start').answers = {}
      await writeFile(path.join(dir, 'draft.json'), treeBytes(tree))
      const refused = await openTree(dir, { draft: true }).catch((error: unknown) => error as TreeInvalid)
      expect(refused).toBeInstanceOf(TreeInvalid)
      expect((refused as TreeInvalid).violations.map((v) => v.rule)).toEqual(['V-EMPTY'])
    } finally {
      await rm(path.dirname(dir), { recursive: true, force: true })
    }
  })
})
