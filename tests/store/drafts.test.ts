/**
 * **[#136]** The store's write path on a temporary data directory (docs/specs/application.md
 * 19, 21, 22; ADR-132-draft-and-publish, ADR-132-editor-api): creating a Tree, every field
 * path and every operation, the cascade on delete, advisory writes held and blocking writes
 * refused, the byte form of every write, the concurrency rule, publishing and the public
 * copy that follows, the roles, and the pictures.
 */
import { copyFile, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Account } from '../../src/store/accounts.ts'
import type { Drafts } from '../../src/store/drafts.ts'
import type { StoreError } from '../../src/store/errors.ts'
import { openStore, type Store } from '../../src/store/index.ts'
import { treeBytes } from '../../src/tree/serialise.ts'
import { ADMIN } from './admin.ts'
import { GIF, PNG, SVG, TEXT } from './pictures.ts'

let accountsFile: string
let data: string
let store: Store
let drafts: Drafts
let admin: Account
let cees: Account
let dirk: Account
let erik: Account

// The accounts are hashed once (scrypt costs 100 ms a password) and copied into each test's store.
beforeAll(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const template = await mkdtemp(path.join(tmpdir(), 'elsa-drafts-accounts-'))
  const opened = await openStore(template, { ...ADMIN, ELSA_SEED_DIR: template })
  const administrator = opened.accounts.all().find((account) => account.administrator)!
  await opened.accounts.create(administrator, 'Cees', 'cees', 'cees first password')
  await opened.accounts.create(administrator, 'Dirk', 'dirk', 'dirks first password')
  await opened.accounts.create(administrator, 'Erik', 'erik', 'eriks first password')
  accountsFile = path.join(template, 'accounts.json')
})

afterAll(async () => {
  await rm(path.dirname(accountsFile), { recursive: true, force: true })
})

beforeEach(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  data = await mkdtemp(path.join(tmpdir(), 'elsa-drafts-'))
  await copyFile(accountsFile, path.join(data, 'accounts.json'))
  store = await openStore(data, { ...ADMIN, ELSA_SEED_DIR: data })
  drafts = store.drafts
  const byLogin = (login: string): Account => store.accounts.byLogin(login)!
  admin = byLogin('admin')
  cees = byLogin('cees')
  dirk = byLogin('dirk')
  erik = byLogin('erik')
})

afterEach(async () => {
  vi.restoreAllMocks()
  await rm(data, { recursive: true, force: true })
})

const file = (id: string, name: string): string => path.join(data, 'trees', id, name)
const text = (id: string, name: string): Promise<string> => readFile(file(id, name), 'utf8')

/** The refusal `promise` ends in: its status, code and rules. */
async function refusal(promise: Promise<unknown> | (() => unknown)): Promise<{ status: number; code: string; rules: string[] }> {
  try {
    await (typeof promise === 'function' ? promise() : promise)
  } catch (error) {
    const refused = error as StoreError
    return { status: refused.status, code: refused.message, rules: refused.violations.map((violation) => violation.rule) }
  }
  throw new Error('not refused')
}

/**
 * Builds through the write path a small Tree that validates in full: a question `start`
 * whose two Answers end. `cees` creates it; answers the two Terminals' ids.
 */
async function smallTree(id: string): Promise<{ yes: string; no: string }> {
  await drafts.create(cees, id, ['en', 'nl'], { en: 'Small', nl: 'Klein' })
  const fill = async (node: string, title: string): Promise<void> => {
    for (const lang of ['en', 'nl']) {
      await drafts.write(cees, id, node, { path: `title.${lang}`, value: `${title} ${lang}` })
      await drafts.write(cees, id, node, { path: `description.${lang}`, value: `About ${title} in ${lang}.` })
    }
  }
  await fill('start', 'Start')
  const yes = (await drafts.createNode(cees, id, { node: 'start', link: 'yes' })).node!.id
  const no = (await drafts.createNode(cees, id, { node: 'start', link: 'no' })).node!.id
  await fill(yes, 'Yes')
  await fill(no, 'No')
  await drafts.createNode(cees, id, { node: yes, link: 'end', outcome: 'applicable' })
  await drafts.createNode(cees, id, { node: no, link: 'end', outcome: 'not-applicable' })
  return { yes, no }
}

describe('creating a Tree (22.1, 27.2)', () => {
  test('a folder with meta.json and a draft of one empty root Node, hidden, the caller its creator', async () => {
    const entry = await drafts.create(cees, 'my-tree', ['nl', 'en'], { nl: 'Mijn boom' })
    expect(entry).toMatchObject({ id: 'my-tree', published: false, servable: false, blocking: [] })
    expect(entry.meta).toMatchObject({ creator: cees.id, collaborators: [], publishCount: 0, revision: 0 })
    expect(JSON.parse(await text('my-tree', 'draft.json'))).toEqual({
      $schema: '/schemas/elsa-tree-4.json',
      format: 'elsa-tree/4',
      languages: ['nl', 'en'],
      root: 'start',
      title: { nl: 'Mijn boom', en: '' },
      metadata: { version: '0' },
      nodes: [{ id: 'start', metadata: { version: '1' } }],
    })
    await expect(stat(file('my-tree', 'tree.json'))).rejects.toThrow()
    expect(store.published('my-tree')).toBeNull()
    // The to-do list says what is missing, and nothing is blocking.
    expect(entry.advisory.map((v) => `${v.file} ${v.keyPath} ${v.rule}`)).toEqual([
      'manifest title.en V-L10N',
      'start title V-NODE',
      'start description V-NODE',
      'manifest root V-ROOT',
      'start  V-ORPHAN',
    ])
  })

  test.for([
    ['Not-An-Id', 422],
    ['a--b', 422],
    ['x'.repeat(65), 422],
    ['admin', 422],
    ['images', 422],
    ['schemas', 422],
    ['theme', 422],
  ] as const)('the id %s is refused with %i', async ([id, status]) => {
    expect((await refusal(drafts.create(cees, id, ['en'], { en: 'x' }))).status).toBe(status)
  })

  test('a taken id is 409; a bad language list is 422; nothing is left behind', async () => {
    await drafts.create(cees, 'taken', ['en'], { en: 'x' })
    expect((await refusal(drafts.create(dirk, 'taken', ['en'], { en: 'y' }))).status).toBe(409)
    expect((await refusal(drafts.create(cees, 'no-languages', [], { en: 'x' }))).status).toBe(422)
    expect((await refusal(drafts.create(cees, 'bad-tag', ['EN GB'], { en: 'x' }))).status).toBe(422)
    await expect(stat(path.join(data, 'trees', 'bad-tag'))).rejects.toThrow()
  })
})

describe('the unit of a write (22.2)', () => {
  test('every field path of 22.2 is written, and each replaces that field only', async () => {
    await drafts.create(cees, 't', ['en', 'nl'], { en: 'T', nl: 'T' })
    await drafts.write(cees, 't', 'start', { op: 'add-source', kind: 'legal', label: { en: 'L' }, url: 'https://example.org/a', id: 's1' })
    const picture = (await drafts.uploadImage(cees, 't', PNG, 'photo.png')).file
    await drafts.write(cees, 't', 'start', { op: 'add-image', file: picture, credit: 'C' })
    await drafts.write(cees, 't', 'start', { op: 'add-explainer', id: 'term', term: { en: 'a' }, text: { en: 'b' } })
    const aside = (await drafts.createNode(cees, 't', { node: 'start', link: 'option' }, { en: 'O' })).node!.id
    const end = (await drafts.createNode(cees, 't', { node: aside, link: 'end', outcome: 'refer' })).node!.id
    expect(end).toBe(aside)
    await drafts.write(cees, 't', aside, { op: 'remove-terminal' })

    const fields: Array<[string | null, string, string]> = [
      [null, 'title.nl', 'Boom'],
      [null, 'description.en', 'A Tree.'],
      [null, 'root', 'start'],
      ['start', 'title.en', 'Start'],
      ['start', 'description.nl', 'Begin.'],
      ['start', 'sources[0].label.nl', 'Wet'],
      ['start', 'sources[0].url', 'https://example.org/b'],
      ['start', 'sources[0].kind', 'case-law'],
      ['start', 'images[0].description.en', 'A photo'],
      ['start', 'images[0].credit', 'Someone'],
      ['start', 'images[0].source', 's1'],
      ['start', 'explainers[0].term.nl', 'term'],
      ['start', 'explainers[0].text.en', 'explained'],
      ['start', 'options[0].title.nl', 'Optie'],
    ]
    for (const [node, fieldPath, value] of fields) {
      const response = await drafts.write(cees, 't', node, { path: fieldPath, value })
      expect(response.revision).toBeGreaterThan(0)
    }
    const draft = JSON.parse(await text('t', 'draft.json'))
    const start = draft.nodes[0]
    expect(draft.title).toEqual({ en: 'T', nl: 'Boom' })
    expect(draft.description).toEqual({ en: 'A Tree.' })
    expect(start.title).toEqual({ en: 'Start' })
    expect(start.sources).toEqual([{ id: 's1', kind: 'case-law', label: { en: 'L', nl: 'Wet' }, url: 'https://example.org/b' }])
    expect(start.images).toEqual([{ file: picture, description: { en: 'A photo', nl: '' }, credit: 'Someone', source: 's1' }])
    expect(start.explainers).toEqual([{ id: 'term', term: { en: 'a', nl: 'term' }, text: { en: 'explained', nl: '' } }])
    expect(start.options).toEqual([{ title: { en: 'O', nl: 'Optie' }, target: aside }])

    // terminal.outcome, on a Terminal
    await drafts.createNode(cees, 't', { node: aside, link: 'end', outcome: 'refer' })
    await drafts.write(cees, 't', aside, { path: 'terminal.outcome', value: 'prohibited' })
    expect(JSON.parse(await text('t', 'draft.json')).nodes[1].terminal).toEqual({ outcome: 'prohibited' })
    // An Image's source, emptied, is removed rather than written empty.
    await drafts.write(cees, 't', 'start', { path: 'images[0].source', value: '' })
    expect(JSON.parse(await text('t', 'draft.json')).nodes[0].images[0]).not.toHaveProperty('source')
  })

  test('any other path is refused with V-KEYS and nothing is stored', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const before = await text('t', 'draft.json')
    for (const [node, fieldPath] of [
      ['start', 'id'],
      ['start', 'metadata.version'],
      ['start', 'answers.yes'],
      ['start', 'sources[0].label.en'],
      ['start', 'title'],
      ['start', 'constructor.prototype'],
      ['start', '__proto__.en'],
      [null, 'languages'],
      [null, 'nodes[0].title.en'],
      [null, 'metadata.version'],
      [null, 'format'],
    ] as const) {
      const refused = await refusal(drafts.write(cees, 't', node, { path: fieldPath, value: 'x' }))
      expect(refused.status, fieldPath).toBe(422)
      expect(refused.rules, fieldPath).toEqual(['V-KEYS'])
    }
    expect((await refusal(drafts.write(cees, 't', 'start', { path: 'title.de', value: 'x' }))).rules).toEqual(['V-L10N'])
    expect((await refusal(drafts.write(cees, 't', 'start', { path: 'title.en', value: 42 }))).status).toBe(422)
    expect((await refusal(drafts.write(cees, 't', 'nowhere', { path: 'title.en', value: 'x' }))).status).toBe(404)
    expect((await refusal(drafts.write(cees, 't', null, { op: 'add-source' }))).status).toBe(422)
    expect(await text('t', 'draft.json')).toBe(before)
    expect(drafts.entry(cees, 't').meta.revision).toBe(0)
  })

  test('an advisory write is stored and answers its violation at the field (22.3)', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const long = 'x'.repeat(151)
    const response = await drafts.write(cees, 't', 'start', { path: 'description.en', value: long })
    expect(response.revision).toBe(1)
    expect(response.node!.description).toEqual({ en: long })
    expect(response.violations).toContainEqual({
      file: 'start',
      keyPath: 'description.en',
      rule: 'V-LENGTH',
      message: '151 characters; at most 150',
      advisory: true,
    })
    expect(response.tree).toEqual({ advisory: response.tree.advisory, published: false, publicCopyCurrent: true })
    expect(JSON.parse(await text('t', 'draft.json')).nodes[0].description.en).toBe(long)
  })

  test('a blocking write is refused with 422 and its violation, and nothing is stored', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const before = await text('t', 'draft.json')
    const cases: Array<[string | null, Record<string, unknown>, string]> = [
      ['start', { path: 'title.en', value: 'two\nlines' }, 'V-PLAIN'],
      ['start', { path: 'description.en', value: '<script>x</script>' }, 'V-HTML'],
      [null, { path: 'root', value: 'nowhere' }, 'V-ROOT'],
      ['start', { op: 'set-answer', answer: 'yes', target: 'nowhere' }, 'V-ANSWERS'],
      ['start', { op: 'add-option', target: 'nowhere', title: { en: 'o' } }, 'V-OPTIONS'],
      ['start', { op: 'add-image', file: 'not-uploaded.png', credit: 'c' }, 'V-IMAGE'],
      ['start', { op: 'add-source', kind: 'rumour', label: { en: 'l' }, url: 'https://example.org' }, 'schema'],
      ['start', { op: 'add-source', kind: 'legal', label: { en: 'l' }, url: 'javascript:alert(1)' }, 'schema'],
      ['start', { op: 'set-terminal', outcome: 'maybe' }, 'schema'],
    ]
    for (const [node, change, rule] of cases) {
      const refused = await refusal(drafts.write(cees, 't', node, change as never))
      expect(refused.status, JSON.stringify(change)).toBe(422)
      expect(refused.rules, JSON.stringify(change)).toContain(rule)
    }
    expect(await text('t', 'draft.json')).toBe(before)
  })
})

describe('the operations and structural writes (22.2, 22.4)', () => {
  test('every operation of the closed set, and no empty list or answers ever written', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const picture = (await drafts.uploadImage(cees, 't', PNG, 'a.png')).file
    const other = (await drafts.uploadImage(cees, 't', GIF, 'b.gif')).file
    const op = (operation: Record<string, unknown>) => drafts.write(cees, 't', 'start', operation as never)
    const start = async () => JSON.parse(await text('t', 'draft.json')).nodes[0]

    await op({ op: 'add-source', kind: 'legal', label: { en: 'L' }, url: 'https://example.org', id: 'law' })
    await op({ op: 'add-image', file: picture, credit: 'A', description: { en: 'a' }, source: 'ignored' })
    await op({ op: 'add-image', file: other, credit: 'B' })
    await op({ op: 'move-image', from: 1, to: 0 })
    expect((await start()).images.map((image: { file: string }) => image.file)).toEqual([other, picture])
    await drafts.write(cees, 't', 'start', { path: 'images[1].source', value: 'law' })
    // Removing the Source removes the pointer to it too.
    await op({ op: 'remove-source', index: 0 })
    expect(await start()).not.toHaveProperty('sources')
    expect((await start()).images[1]).not.toHaveProperty('source')
    await op({ op: 'remove-image', index: 0 })
    await op({ op: 'remove-image', index: 0 })
    expect(await start()).not.toHaveProperty('images')

    await op({ op: 'add-explainer', id: 'term', term: { en: 'a term' }, text: { en: 'what it means' } })
    await op({ op: 'remove-explainer', id: 'term' })
    expect(await start()).not.toHaveProperty('explainers')

    const created = await op({ op: 'add-option', title: { en: 'Aside' } })
    const aside = created.also![0]!.node!.id
    expect(created.also![0]!.node).toMatchObject({ id: aside, kind: 'explanation', title: {} })
    await op({ op: 'remove-option', target: aside })
    expect(await start()).not.toHaveProperty('options')
    await op({ op: 'add-option', target: aside, title: { en: 'Again' } })
    expect((await start()).options).toEqual([{ title: { en: 'Again' }, target: aside }])
    await op({ op: 'remove-option', target: aside })

    const end = (await drafts.createNode(cees, 't', { node: 'start', link: 'yes' })).node!.id
    await drafts.createNode(cees, 't', { node: end, link: 'end', outcome: 'applicable' })
    await op({ op: 'set-answer', answer: 'no', target: end })
    expect((await start()).answers).toEqual({ yes: end, no: end })
    await op({ op: 'remove-answer', answer: 'yes' })
    await op({ op: 'remove-answer', answer: 'no' })
    expect(await start()).not.toHaveProperty('answers')

    await op({ op: 'set-terminal', outcome: 'refer' })
    expect((await start()).terminal).toEqual({ outcome: 'refer' })
    await op({ op: 'remove-terminal' })
    expect(await start()).not.toHaveProperty('terminal')

    expect((await refusal(op({ op: 'rename-node' }))).status).toBe(422)
    expect((await refusal(op({ op: 'remove-image', index: 0 }))).status).toBe(422)
  })

  test('creating a Node writes the Node and its Link in one write; the id is the server’s', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const response = await drafts.createNode(cees, 't', { node: 'start', link: 'yes' }, { en: 'Next' })
    expect(response.revision).toBe(1)
    expect(response.node!.id).toMatch(/^n-[a-z2-7]{6}$/)
    expect(response.node!.title).toEqual({ en: 'Next' })
    expect(response.also!.map((also) => also.node!.answers)).toEqual([{ yes: response.node!.id }])
    // A free, valid id may be named; a taken one is 409.
    expect((await drafts.createNode(cees, 't', { node: 'start', link: 'no' }, undefined, 'my-step')).node!.id).toBe('my-step')
    expect((await refusal(drafts.createNode(cees, 't', { node: 'start', link: 'option' }, undefined, 'my-step'))).status).toBe(409)
    // An end on a Node with Answers is refused: a question Node is not a Terminal (V-KIND).
    expect((await refusal(drafts.createNode(cees, 't', { node: 'start', link: 'end', outcome: 'refer' }))).status).toBe(422)
  })

  test('deleting a Node removes every Link to it in the same write; the root cannot be deleted', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const target = (await drafts.createNode(cees, 't', { node: 'start', link: 'yes' })).node!.id
    await drafts.write(cees, 't', 'start', { op: 'set-answer', answer: 'no', target })
    const aside = (await drafts.createNode(cees, 't', { node: target, link: 'option' }, { en: 'Aside' })).node!.id
    const second = (await drafts.createNode(cees, 't', { node: 'start', link: 'option' }, { en: 'Second' })).node!.id
    await drafts.write(cees, 't', second, { op: 'add-option', target: aside, title: { en: 'Aside too' } })

    const response = await drafts.deleteNode(cees, 't', target)
    expect(response.node).toBeNull()
    expect(response.also!.map((also) => also.node!.id)).toEqual(['start'])
    const draft = JSON.parse(await text('t', 'draft.json'))
    expect(draft.nodes.map((node: { id: string }) => node.id)).toEqual(['start', aside, second])
    expect(draft.nodes[0]).not.toHaveProperty('answers')
    // What the deleted Node led to stays.
    await drafts.deleteNode(cees, 't', second)
    expect(JSON.parse(await text('t', 'draft.json')).nodes[0]).not.toHaveProperty('options')

    expect(await refusal(drafts.deleteNode(cees, 't', 'start'))).toMatchObject({ status: 409, code: 'root' })
    expect((await refusal(drafts.deleteNode(cees, 't', 'nowhere'))).status).toBe(404)
  })
})

describe('the byte form of every write (tree-format.md 3.7, 19.1)', () => {
  test('write, read, write: identical bytes, in the canonical form', async () => {
    await smallTree('t')
    await drafts.write(cees, 't', null, { path: 'description.nl', value: 'Een boom met één vraag — “quoted” / slash' })
    const first = await text('t', 'draft.json')
    expect(first).toBe(treeBytes(JSON.parse(first)))
    expect(first.endsWith('}\n')).toBe(true)
    expect(first).toContain('één vraag — “quoted” / slash')

    // Read: a fresh store on the same directory, as a restart.
    store = await openStore(data, ADMIN)
    drafts = store.drafts
    await drafts.write(cees, 't', null, { path: 'description.nl', value: 'Een boom met één vraag — “quoted” / slash' })
    expect(await text('t', 'draft.json')).toBe(first)
  })
})

describe('concurrency: last write wins, per field (22.5)', () => {
  test('writes to one Tree land one at a time, in order; two fields never overwrite each other', async () => {
    await drafts.create(cees, 't', ['en', 'nl'], { en: 'T', nl: 'T' })
    await drafts.addCollaborator(cees, 't', dirk.id)
    const writes = await Promise.all([
      drafts.write(cees, 't', 'start', { path: 'title.en', value: 'from Cees' }),
      drafts.write(dirk, 't', 'start', { path: 'title.nl', value: 'van Dirk' }),
      drafts.write(cees, 't', 'start', { path: 'description.en', value: 'first' }),
      drafts.write(dirk, 't', 'start', { path: 'description.en', value: 'second' }),
    ])
    expect(writes.map((write) => write.revision)).toEqual([1, 2, 3, 4])
    // Each response is the Node as stored after its own write: the other's field shows.
    expect(writes[1]!.node!.title).toEqual({ en: 'from Cees', nl: 'van Dirk' })
    const start = JSON.parse(await text('t', 'draft.json')).nodes[0]
    expect(start.title).toEqual({ en: 'from Cees', nl: 'van Dirk' })
    expect(start.description.en).toBe('second')
    expect(JSON.parse(await text('t', 'meta.json'))).toMatchObject({ revision: 4, updatedBy: dirk.id })
  })

  test('a refused write in the queue does not stop the writes behind it', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const results = await Promise.allSettled([
      drafts.write(cees, 't', 'start', { path: 'title.en', value: 'a\nb' }),
      drafts.write(cees, 't', 'start', { path: 'title.en', value: 'kept' }),
    ])
    expect(results.map((result) => result.status)).toEqual(['rejected', 'fulfilled'])
    expect(JSON.parse(await text('t', 'draft.json')).nodes[0].title).toEqual({ en: 'kept' })
  })
})

describe('publish and unpublish (19.3, 19.4)', () => {
  test('publish is refused with every violation while the draft is not valid in full; nothing changes', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const before = await text('t', 'draft.json')
    const refused = await refusal(drafts.publish(cees, 't', true))
    expect(refused.status).toBe(409)
    expect(refused.rules).toEqual(expect.arrayContaining(['schema']))
    expect(await text('t', 'draft.json')).toBe(before)
    await expect(stat(file('t', 'tree.json'))).rejects.toThrow()
    expect(store.published('t')).toBeNull()
  })

  test('a valid draft is published: the copy is the draft’s bytes, versioned, public at once', async () => {
    await smallTree('t')
    const entry = await drafts.publish(cees, 't', true)
    expect(entry).toMatchObject({ published: true, servable: true, publicCopyCurrent: true })
    expect(entry.meta.publishCount).toBe(1)
    const published = await text('t', 'tree.json')
    expect(published).toBe(await text('t', 'draft.json'))
    expect(JSON.parse(published).metadata).toEqual({ version: '1' })
    expect(store.published('t')!.manifest.title).toEqual({ en: 'Small', nl: 'Klein' })
    expect(store.publishedIds()).toContain('t')
  })

  test('while published, a valid write reaches the public copy; an invalid one leaves the last valid copy', async () => {
    const { yes } = await smallTree('t')
    await drafts.publish(cees, 't', true)

    const valid = await drafts.write(cees, 't', yes, { path: 'title.en', value: 'Yes, changed' })
    expect(valid.tree).toEqual({ advisory: 0, published: true, publicCopyCurrent: true })
    expect(await text('t', 'tree.json')).toBe(await text('t', 'draft.json'))
    expect((await store.published('t')!.getNode(yes))!.title.en).toBe('Yes, changed')

    const lastValid = await text('t', 'tree.json')
    const invalid = await drafts.write(cees, 't', yes, { path: 'title.en', value: '' })
    expect(invalid.tree).toEqual({ advisory: 1, published: true, publicCopyCurrent: false })
    expect(await text('t', 'tree.json')).toBe(lastValid)
    expect((await store.published('t')!.getNode(yes))!.title.en).toBe('Yes, changed')
    expect(drafts.entry(cees, 't').publicCopyCurrent).toBe(false)

    await drafts.write(cees, 't', yes, { path: 'title.en', value: 'Yes again' })
    expect(await text('t', 'tree.json')).toBe(await text('t', 'draft.json'))
    expect(drafts.entry(cees, 't').publicCopyCurrent).toBe(true)
  })

  test('unpublish hides the Tree from every public route in the same call; delete wants it hidden', async () => {
    await smallTree('t')
    await drafts.publish(cees, 't', true)
    expect(await refusal(drafts.delete(cees, 't'))).toMatchObject({ status: 409, code: 'published' })
    const entry = await drafts.publish(cees, 't', false)
    expect(entry).toMatchObject({ published: false, servable: false })
    expect(entry.meta.publishedAt).toBeDefined()
    expect(store.published('t')).toBeNull()
    expect(store.publishedIds()).not.toContain('t')
    await expect(stat(file('t', 'tree.json'))).rejects.toThrow()

    // A second publish counts on.
    expect(JSON.parse((await drafts.publish(cees, 't', true), await text('t', 'tree.json'))).metadata.version).toBe('2')
    await drafts.publish(cees, 't', false)
    await drafts.delete(cees, 't')
    await expect(stat(path.join(data, 'trees', 't'))).rejects.toThrow()
    expect((await refusal(() => drafts.entry(admin, 't'))).status).toBe(404)
  })
})

describe('roles: invitations and handing over (21.4)', () => {
  test('invite an active account; the creator, the administrator and a deactivated account are 422', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    expect((await drafts.addCollaborator(cees, 't', dirk.id)).meta.collaborators).toEqual([dirk.id])
    expect((await drafts.addCollaborator(cees, 't', dirk.id)).meta.collaborators).toEqual([dirk.id])
    for (const id of [cees.id, admin.id, 'no-such-account']) {
      expect((await refusal(drafts.addCollaborator(cees, 't', id))).status).toBe(422)
    }
    await store.accounts.update(admin, erik.id, { active: false })
    expect((await refusal(drafts.addCollaborator(cees, 't', erik.id))).status).toBe(422)
    // A collaborator reads and edits, and does not invite.
    expect(drafts.entry(dirk, 't').id).toBe('t')
    expect((await refusal(drafts.addCollaborator(dirk, 't', erik.id))).status).toBe(403)
    expect((await drafts.removeCollaborator(cees, 't', dirk.id)).meta.collaborators).toEqual([])
    expect((await refusal(() => drafts.entry(dirk, 't'))).status).toBe(403)
    expect(JSON.parse(await text('t', 'meta.json')).collaborators).toEqual([])
  })

  test('handing over names the new creator and keeps the old one as a collaborator', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    await drafts.addCollaborator(cees, 't', dirk.id)
    const meta = (await drafts.handOver(cees, 't', dirk.id)).meta
    expect(meta).toMatchObject({ creator: dirk.id, collaborators: [cees.id] })
    expect((await refusal(drafts.handOver(cees, 't', erik.id))).status).toBe(403)
    // The administrator hands over any Tree.
    expect((await drafts.handOver(admin, 't', erik.id)).meta).toMatchObject({ creator: erik.id, collaborators: [cees.id, dirk.id] })
    expect(drafts.list(erik).map((entry) => entry.id)).toEqual(['t'])
    expect(drafts.list(admin).map((entry) => entry.id)).toEqual(['t'])
  })
})

describe('pictures (22.6)', () => {
  test('an upload is named by the server, once per content, and refused by type and size', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const first = await drafts.uploadImage(cees, 't', PNG, '../../Evil Name.PNG')
    expect(first).toEqual({ file: expect.stringMatching(/^evil-name-[0-9a-f]{8}\.png$/), width: 1, height: 1 })
    expect(await readFile(file('t', path.join('images', first.file)))).toEqual(PNG)
    // The same bytes, another name: another file name; the same name: the same file.
    expect((await drafts.uploadImage(cees, 't', PNG, '../../Evil Name.PNG')).file).toBe(first.file)
    expect((await refusal(drafts.uploadImage(cees, 't', SVG, 'logo.png'))).status).toBe(415)
    expect((await refusal(drafts.uploadImage(cees, 't', TEXT, 'notes.png'))).status).toBe(415)
    expect((await refusal(drafts.uploadImage(cees, 't', Buffer.alloc(5 * 1024 * 1024 + 1), 'big.png'))).status).toBe(413)
  })

  test('a picture is removable only while nothing names it; a publish sweeps the ones nothing names', async () => {
    await smallTree('t')
    const kept = (await drafts.uploadImage(cees, 't', PNG, 'kept.png')).file
    const loose = (await drafts.uploadImage(cees, 't', GIF, 'loose.gif')).file
    const gone = (await drafts.uploadImage(cees, 't', GIF, 'gone.gif')).file
    await drafts.write(cees, 't', 'start', { op: 'add-image', file: kept, credit: 'C', description: { en: 'd', nl: 'd' } })
    expect((await refusal(drafts.removeImage(cees, 't', kept))).status).toBe(409)
    await drafts.removeImage(cees, 't', gone)
    await expect(stat(file('t', path.join('images', gone)))).rejects.toThrow()
    expect((await refusal(drafts.removeImage(cees, 't', '../meta.json'))).status).toBe(404)

    expect(drafts.draftImagePath(cees, 't', loose)).toBe(file('t', path.join('images', loose)))
    expect((await refusal(() => drafts.draftImagePath(dirk, 't', loose))).status).toBe(403)
    // Not public until a published copy names it.
    await drafts.publish(cees, 't', true)
    expect(store.published('t')!.imagePath(kept)).not.toBeNull()
    await expect(stat(file('t', path.join('images', loose)))).rejects.toThrow()
    // Taken off the Node by a valid write, which the public copy follows: then it may go.
    await drafts.write(cees, 't', 'start', { op: 'remove-image', index: 0 })
    await drafts.removeImage(cees, 't', kept)
    expect(store.published('t')!.imagePath(kept)).toBeNull()
  })
})

describe('an uneditable Tree (19.5)', () => {
  test('a hand-edited draft that breaks a blocking rule is held, reported, and refuses every write with 409', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    await writeFile(file('t', 'draft.json'), '{ "format": "elsa-tree/4", "format": "twice" }\n')
    store = await openStore(data, ADMIN)
    drafts = store.drafts
    const entry = drafts.entry(cees, 't')
    expect(entry.manifest).toBeNull()
    expect(entry.blocking.map((v) => v.rule)).toEqual(['V-JSON'])
    expect((await refusal(drafts.write(cees, 't', 'start', { path: 'title.en', value: 'x' }))).status).toBe(409)
    expect((await refusal(drafts.publish(cees, 't', true))).status).toBe(409)
  })
})
