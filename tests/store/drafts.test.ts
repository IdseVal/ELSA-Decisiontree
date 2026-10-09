/**
 * **[#136]** The store's write path on a temporary data directory (docs/specs/application.md
 * 19, 21, 22; ADR-132-draft-and-publish, ADR-132-editor-api): creating a Tree, every field
 * path and every operation, the cascade on delete, advisory writes held and blocking writes
 * refused, the byte form of every write, the concurrency rule, publishing and the public
 * copy that follows, the roles, and the pictures.
 */
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Account } from '../../src/store/accounts.ts'
import type { Drafts } from '../../src/store/drafts.ts'
import { isStoreError, type StoreError } from '../../src/store/errors.ts'
import { openStore, type Store } from '../../src/store/index.ts'
import { treeBytes } from '../../src/tree/serialise.ts'
import { ADMIN } from './admin.ts'
import { GIF, PNG, SVG, TEXT, WEBP } from './pictures.ts'

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
  await opened.accounts.create(administrator, 'Cees', 'cees@example.org', 'cees first password')
  await opened.accounts.create(administrator, 'Dirk', 'dirk@example.org', 'dirks first password')
  await opened.accounts.create(administrator, 'Erik', 'erik@example.org', 'eriks first password')
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
  const byEmail = (email: string): Account => store.accounts.byEmail(email)!
  admin = byEmail(ADMIN.ELSA_ADMIN_EMAIL)
  cees = byEmail('cees@example.org')
  dirk = byEmail('dirk@example.org')
  erik = byEmail('erik@example.org')
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
  const yes = (await drafts.createNode(cees, id, { node: 'start', link: 'answer', label: { en: 'Yes', nl: 'Ja' } })).node!.id
  const no = (await drafts.createNode(cees, id, { node: 'start', link: 'answer', label: { en: 'No', nl: 'Nee' } })).node!.id
  await fill(yes, 'Yes')
  await fill(no, 'No')
  await drafts.createNode(cees, id, { node: yes, link: 'end', label: { en: 'Applies', nl: 'Van toepassing' } })
  await drafts.createNode(cees, id, { node: no, link: 'end', label: { en: 'Does not apply', nl: 'Niet van toepassing' } })
  return { yes, no }
}

describe('creating a Tree (22.1, 27.2)', () => {
  test('a folder with meta.json and a draft of one empty root Node, hidden, the caller its creator', async () => {
    const entry = await drafts.create(cees, 'my-tree', ['nl', 'en'], { nl: 'Mijn boom' })
    expect(entry).toMatchObject({ id: 'my-tree', published: false, servable: false, blocking: [] })
    expect(entry.meta).toMatchObject({ creator: cees.id, collaborators: [], publishCount: 0, revision: 0 })
    expect(JSON.parse(await text('my-tree', 'draft.json'))).toEqual({
      $schema: '/schemas/elsa-tree-6.json',
      format: 'elsa-tree/6',
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
    const end = (await drafts.createNode(cees, 't', { node: aside, link: 'end', label: { en: 'Look elsewhere' } })).node!.id
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

    // **[#179]** terminal.label.<lang>, on a Terminal: the ending's words in one language (36.3)
    await drafts.createNode(cees, 't', { node: aside, link: 'end', label: { en: 'Look elsewhere' } })
    await drafts.write(cees, 't', aside, { path: 'terminal.label.nl', value: 'Elders geregeld' })
    expect(JSON.parse(await text('t', 'draft.json')).nodes[1].terminal).toEqual({ label: { en: 'Look elsewhere', nl: 'Elders geregeld' } })
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
      // **[#221]** A next step's words are the one field of `answers` (41.7 item 6).
      ['start', 'answers[0].target'],
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
      // **[#221]** A next step is named by its place: the first of a fresh step is appended.
      ['start', { op: 'set-answer', index: 0, target: 'nowhere' }, 'V-ANSWERS'],
      ['start', { op: 'set-answer', index: 1, target: 'start' }, 'V-KEYS'],
      ['start', { op: 'add-option', target: 'nowhere', title: { en: 'o' } }, 'V-OPTIONS'],
      ['start', { op: 'add-image', file: 'not-uploaded.png', credit: 'c' }, 'V-IMAGE'],
      ['start', { op: 'add-source', kind: 'rumour', label: { en: 'l' }, url: 'https://example.org' }, 'schema'],
      ['start', { op: 'add-source', kind: 'legal', label: { en: 'l' }, url: 'javascript:alert(1)' }, 'schema'],
      // **[#179]** An outcome is no ending: without words there is nothing to write (22.2).
      ['start', { op: 'set-terminal', outcome: 'refer' }, 'schema'],
      ['start', { op: 'set-terminal', label: 'Refer' }, 'schema'],
      ['start', { op: 'set-terminal', label: { en: 'two\nlines' } }, 'V-PLAIN'],
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

    // **[#221]** The next steps by their place (41.7 item 6): set, move, their words, remove.
    const end = (await drafts.createNode(cees, 't', { node: 'start', link: 'answer', label: { en: 'Yes' } })).node!.id
    await drafts.createNode(cees, 't', { node: end, link: 'end', label: { en: 'Applies' } })
    await drafts.createNode(cees, 't', { node: 'start', link: 'answer', label: { en: 'No' } })
    await op({ op: 'set-answer', index: 1, target: end })
    expect((await start()).answers).toEqual([
      { label: { en: 'Yes' }, target: end },
      { label: { en: 'No' }, target: end },
    ])
    expect((await refusal(op({ op: 'set-answer', index: 0, target: 'nowhere' }))).rules).toEqual(['V-ANSWERS'])
    await op({ op: 'move-answer', index: 1, to: 0 })
    await drafts.write(cees, 't', 'start', { path: 'answers[1].label.en', value: 'Yes, indeed' })
    expect((await start()).answers.map((answer: { label: { en: string } }) => answer.label.en)).toEqual(['No', 'Yes, indeed'])
    expect((await refusal(op({ op: 'move-answer', index: 0, to: 2 }))).status).toBe(422)
    await op({ op: 'remove-answer', index: 0 })
    await op({ op: 'remove-answer', index: 0 })
    expect(await start()).not.toHaveProperty('answers')

    await op({ op: 'set-terminal', label: { en: 'Look elsewhere' } })
    expect((await start()).terminal).toEqual({ label: { en: 'Look elsewhere' } })
    await op({ op: 'remove-terminal' })
    expect(await start()).not.toHaveProperty('terminal')

    expect((await refusal(op({ op: 'rename-node' }))).status).toBe(422)
    expect((await refusal(op({ op: 'remove-image', index: 0 }))).status).toBe(422)
  })

  test('creating a Node writes the Node and its Link in one write; the id is the server’s', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const response = await drafts.createNode(cees, 't', { node: 'start', link: 'answer', label: { en: 'Yes' } }, { en: 'Next' })
    expect(response.revision).toBe(1)
    expect(response.node!.id).toMatch(/^n-[a-z2-7]{6}$/)
    expect(response.node!.title).toEqual({ en: 'Next' })
    expect(response.also!.map((also) => also.node!.answers)).toEqual([[{ label: { en: 'Yes' }, target: response.node!.id }]])
    // A free, valid id may be named; a taken one is 409.
    expect((await drafts.createNode(cees, 't', { node: 'start', link: 'answer', label: {} }, undefined, 'my-step')).node!.id).toBe('my-step')
    expect((await refusal(drafts.createNode(cees, 't', { node: 'start', link: 'option' }, undefined, 'my-step'))).status).toBe(409)
    // An end on a Node with Answers is refused: a question Node is not a Terminal (V-KIND).
    expect((await refusal(drafts.createNode(cees, 't', { node: 'start', link: 'end', label: { en: 'Ends' } }))).status).toBe(422)
  })

  test('**[#221]** a next step is appended last with its words, "" for every other language; a fifth is 422 with V-ANSWERS and nothing is stored', async () => {
    await drafts.create(cees, 't', ['en', 'nl'], { en: 'T', nl: 'T' })
    const words = ['Yes', 'No', 'Not sure', 'Partly']
    const made: string[] = []
    for (const en of words) made.push((await drafts.createNode(cees, 't', { node: 'start', link: 'answer', label: { en } })).node!.id)
    const start = async () => JSON.parse(await text('t', 'draft.json')).nodes[0]
    expect((await start()).answers).toEqual(words.map((en, i) => ({ label: { en, nl: '' }, target: made[i] })))
    expect(drafts.entry(cees, 't').advisory.map((violation) => `${violation.file} ${violation.keyPath} ${violation.rule}`)).toContain('start answers[3].label.nl V-L10N')

    const before = await text('t', 'draft.json')
    const refused = await refusal(drafts.createNode(cees, 't', { node: 'start', link: 'answer', label: { en: 'Fifth' } }))
    expect(refused).toMatchObject({ status: 422, rules: ['V-ANSWERS'] })
    expect((await refusal(drafts.write(cees, 't', 'start', { op: 'set-answer', index: 4, target: made[0]! }))).rules).toEqual(['V-ANSWERS'])
    expect(await text('t', 'draft.json')).toBe(before)
    // The place after the last appends a next step to an existing Node, its words "" unless given.
    await drafts.write(cees, 't', made[0]!, { op: 'set-answer', index: 0, target: made[1]! })
    await drafts.write(cees, 't', made[0]!, { op: 'set-answer', index: 1, target: made[2]!, label: { nl: 'Nee' } })
    expect(JSON.parse(await text('t', 'draft.json')).nodes[1].answers).toEqual([
      { label: { en: '', nl: '' }, target: made[1] },
      { label: { nl: 'Nee', en: '' }, target: made[2] },
    ])
    // An answer without words is no next step: there is nothing to write on its button.
    expect((await refusal(drafts.createNode(cees, 't', { node: made[0]!, link: 'answer' }))).status).toBe(422)
    expect((await refusal(drafts.createNode(cees, 't', { node: made[0]!, link: 'yes' }))).rules).toEqual(['V-KEYS'])
  })

  test('**[#179]** an end holds the words it was given and "" for every other language, each a to-do; the outcome is gone from the interface', async () => {
    await drafts.create(cees, 't', ['en', 'nl'], { en: 'T', nl: 'T' })
    // An end without words is no end: an outcome alone is refused, and nothing is written.
    const outcomeOnly = { node: 'start', link: 'end', outcome: 'refer' }
    expect((await refusal(drafts.createNode(cees, 't', outcomeOnly))).status).toBe(422)
    expect(JSON.parse(await text('t', 'draft.json')).nodes[0]).not.toHaveProperty('terminal')

    const response = await drafts.createNode(cees, 't', { node: 'start', link: 'end', label: { nl: 'Maatregelen vereist' } })

    expect(response.node).toMatchObject({ id: 'start', kind: 'terminal', label: { en: '', nl: 'Maatregelen vereist' } })
    expect(JSON.parse(await text('t', 'draft.json')).nodes[0].terminal).toEqual({ label: { en: '', nl: 'Maatregelen vereist' } })
    expect(response.violations).toContainEqual({ file: 'start', keyPath: 'terminal.label.en', rule: 'V-L10N', message: 'missing or empty text for the declared language "en"', advisory: true })
    // The limit is the validator's advisory, as for every text (22.3): stored, and named.
    const long = await drafts.write(cees, 't', 'start', { path: 'terminal.label.en', value: 'Mandatory safeguards' })
    expect(long.violations).toContainEqual({ file: 'start', keyPath: 'terminal.label.en', rule: 'V-LENGTH', message: '20 characters; at most 19', advisory: true })
    expect(JSON.parse(await text('t', 'draft.json')).nodes[0].terminal.label.en).toBe('Mandatory safeguards')

    // `terminal.outcome` is no field of 22.2 any more.
    expect(await refusal(drafts.write(cees, 't', 'start', { path: 'terminal.outcome', value: 'refer' }))).toMatchObject({ status: 422, rules: ['V-KEYS'] })
    expect(await refusal(drafts.write(cees, 't', 'start', { path: 'terminal.label', value: 'Refer' }))).toMatchObject({ status: 422, rules: ['V-KEYS'] })
    expect(await refusal(drafts.write(cees, 't', 'start', { path: 'terminal.label.de', value: 'Anders' }))).toMatchObject({ status: 422, rules: ['V-L10N'] })
  })

  test('**[#175]** a ninth Option is refused with V-COUNT and nothing is written, by add-option and by the structural write alike; re-pointing at eight still lands', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const asides: string[] = []
    for (let i = 1; i <= 8; i += 1) {
      asides.push((await drafts.createNode(cees, 't', { node: 'start', link: 'option' }, { en: `Aside ${i}` })).node!.id)
    }
    const spare = (await drafts.createNode(cees, 't', { node: asides[0]!, link: 'option' }, { en: 'Spare' })).node!.id
    const draft = await text('t', 'draft.json')
    const meta = await text('t', 'meta.json')
    expect(JSON.parse(draft).nodes[0].options).toHaveLength(8)

    const ninth = [
      () => drafts.write(cees, 't', 'start', { op: 'add-option', target: spare, title: { en: 'Ninth' } }),
      () => drafts.write(cees, 't', 'start', { op: 'add-option', title: { en: 'Ninth, and a new aside' } }),
      () => drafts.createNode(cees, 't', { node: 'start', link: 'option' }, { en: 'Ninth, created' }),
    ]
    for (const write of ninth) {
      await expect(write()).rejects.toMatchObject({
        status: 422,
        message: 'blocking',
        violations: [{ file: 'start', keyPath: 'options', rule: 'V-COUNT', message: '9 entries; at most 8', advisory: false }],
      })
    }
    // Nothing written: no ninth Option, no new aside, no revision.
    expect(await text('t', 'draft.json')).toBe(draft)
    expect(await text('t', 'meta.json')).toBe(meta)

    // The link menu re-points an Option by a removal and then an addition (30.6): the count never passes eight.
    await drafts.write(cees, 't', 'start', { op: 'remove-option', target: asides[7]! })
    await drafts.write(cees, 't', 'start', { op: 'add-option', target: spare, title: { en: 'Re-pointed' } })
    expect(JSON.parse(await text('t', 'draft.json')).nodes[0].options.map((option: { target: string }) => option.target)).toEqual([...asides.slice(0, 7), spare])
  })

  test('deleting a Node removes every Link to it in the same write; the root cannot be deleted', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const target = (await drafts.createNode(cees, 't', { node: 'start', link: 'answer', label: {} })).node!.id
    // **[#221]** A second next step, re-pointed at the first one's target: two Links to one Node.
    await drafts.createNode(cees, 't', { node: 'start', link: 'answer', label: {} })
    await drafts.write(cees, 't', 'start', { op: 'set-answer', index: 1, target })
    const aside = (await drafts.createNode(cees, 't', { node: target, link: 'option' }, { en: 'Aside' })).node!.id
    const second = (await drafts.createNode(cees, 't', { node: 'start', link: 'option' }, { en: 'Second' })).node!.id
    await drafts.write(cees, 't', second, { op: 'add-option', target: aside, title: { en: 'Aside too' } })

    const response = await drafts.deleteNode(cees, 't', target)
    expect(response.node).toBeNull()
    expect(response.also!.map((also) => also.node!.id)).toEqual(['start'])
    const draft = JSON.parse(await text('t', 'draft.json'))
    expect(draft.nodes.map((node: { id: string }) => node.id)).toEqual(['start', expect.any(String), aside, second])
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

describe('**[#197]** the order of joining, `joined` (39.2)', () => {
  test('create records the creator; an invitation appends once; a removal and a second invitation leave it as it was', async () => {
    expect((await drafts.create(cees, 't', ['en'], { en: 'T' })).meta.joined).toEqual([cees.id])
    await drafts.addCollaborator(cees, 't', dirk.id)
    await drafts.addCollaborator(cees, 't', erik.id)
    expect((await drafts.addCollaborator(cees, 't', dirk.id)).meta.joined).toEqual([cees.id, dirk.id, erik.id])
    expect((await drafts.removeCollaborator(cees, 't', dirk.id)).meta).toMatchObject({ collaborators: [erik.id], joined: [cees.id, dirk.id, erik.id] })
    expect((await drafts.addCollaborator(cees, 't', dirk.id)).meta).toMatchObject({ collaborators: [erik.id, dirk.id], joined: [cees.id, dirk.id, erik.id] })
    // Anything else leaves it as it is: a write of the draft.
    expect((await drafts.write(cees, 't', 'start', { path: 'title.en', value: 'Start' })).revision).toBe(1)
    // Written by the write that changed the roles, into the Tree's meta.json (17.3).
    expect(JSON.parse(await text('t', 'meta.json'))).toMatchObject({ collaborators: [erik.id, dirk.id], joined: [cees.id, dirk.id, erik.id], revision: 1 })
  })

  test('a hand-over to a new account appends it once and leaves the old creator in place; to a collaborator it adds nothing', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    await drafts.addCollaborator(cees, 't', dirk.id)
    expect((await drafts.handOver(cees, 't', dirk.id)).meta).toMatchObject({ creator: dirk.id, collaborators: [cees.id], joined: [cees.id, dirk.id] })
    expect((await drafts.handOver(dirk, 't', erik.id)).meta).toMatchObject({ creator: erik.id, collaborators: [cees.id, dirk.id], joined: [cees.id, dirk.id, erik.id] })
    // Back to the account that made it: no new entry, and nothing moves.
    expect((await drafts.handOver(erik, 't', cees.id)).meta).toMatchObject({ creator: cees.id, collaborators: [dirk.id, erik.id], joined: [cees.id, dirk.id, erik.id] })
    expect(JSON.parse(await text('t', 'meta.json')).joined).toEqual([cees.id, dirk.id, erik.id])
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
    await writeFile(file('t', 'draft.json'), '{ "format": "elsa-tree/6", "format": "twice" }\n')
    store = await openStore(data, ADMIN)
    drafts = store.drafts
    const entry = drafts.entry(cees, 't')
    expect(entry.manifest).toBeNull()
    expect(entry.blocking.map((v) => v.rule)).toEqual(['V-JSON'])
    expect((await refusal(drafts.write(cees, 't', 'start', { path: 'title.en', value: 'x' }))).status).toBe(409)
    expect((await refusal(drafts.publish(cees, 't', true))).status).toBe(409)
  })
})

describe('**[#144]** the Theme (33.8)', () => {
  /** A real WOFF2 font, from the example Tree. */
  const woff2 = (): Promise<Buffer> => readFile(path.join('trees', 'ai-act-example', 'theme', 'nova-square-400.woff2'))
  const colours = {
    background: '#ffffff',
    surface: '#f0f3f7',
    text: '#2d2e33',
    'text-muted': '#696a6e',
    accent: '#ffc600',
    'accent-secondary': '#159a2f',
    danger: '#e44e56',
  }

  test('a logo or a font is uploaded into theme/, typed by its bytes and named by the server; anything else is refused', async () => {
    await drafts.create(cees, 't', ['en', 'nl'], { en: 'T', nl: 'T' })
    const logo = await drafts.uploadThemeFile(cees, 't', PNG, '../Lab Logo.PNG')
    expect(logo.file).toMatch(/^lab-logo-[0-9a-f]{8}\.png$/)
    expect(await readFile(file('t', path.join('theme', logo.file)))).toEqual(PNG)
    const font = await drafts.uploadThemeFile(cees, 't', await woff2(), 'Nova Square.ttf')
    expect(font.file).toMatch(/^nova-square-[0-9a-f]{8}\.woff2$/)
    for (const bytes of [SVG, TEXT, GIF]) expect((await refusal(drafts.uploadThemeFile(cees, 't', bytes, 'logo.png'))).status).toBe(415)
    expect((await refusal(drafts.uploadThemeFile(cees, 't', Buffer.alloc(5 * 1024 * 1024 + 1), 'big.woff2'))).status).toBe(413)
    expect((await refusal(drafts.uploadThemeFile(dirk, 't', PNG, 'logo.png'))).status).toBe(403)
  })

  test('each part is written whole: seven colours or a 422, a logo with its alt text, a font family with its files and licence', async () => {
    await drafts.create(cees, 't', ['en', 'nl'], { en: 'T', nl: 'T' })
    const written = await drafts.write(cees, 't', null, { path: 'theme.colours', value: colours })
    expect(written.manifest!.theme!.colours).toEqual(colours)

    const { danger: _danger, ...six } = colours
    for (const value of [six, { ...colours, text: '#FFFFFF' }, { ...colours, primary: '#000000' }, 'red']) {
      expect(await refusal(drafts.write(cees, 't', null, { path: 'theme.colours', value }))).toMatchObject({ status: 422 })
    }
    expect(drafts.draft(cees, 't').manifest.theme!.colours).toEqual(colours)

    const light = (await drafts.uploadThemeFile(cees, 't', PNG, 'logo.png')).file
    const logo = await drafts.write(cees, 't', null, { path: 'theme.logo', value: { light, alt: { en: 'The lab', nl: '' } } })
    expect(logo.manifest!.theme!.logo).toEqual({ light, alt: { en: 'The lab', nl: '' } })
    // An alt text still to write is a to-do, as any missing text is (19.2).
    expect(logo.violations).toContainEqual(expect.objectContaining({ keyPath: 'theme.logo.alt.nl', rule: 'V-L10N', advisory: true }))
    expect((await refusal(drafts.write(cees, 't', null, { path: 'theme.logo', value: { light: 'missing.png', alt: { en: 'x' } } }))).rules).toContain('V-THEME')
    expect((await refusal(drafts.write(cees, 't', null, { path: 'theme.logo', value: { light } }))).status).toBe(422)

    const face = (await drafts.uploadThemeFile(cees, 't', await woff2(), 'nova.woff2')).file
    const family = { family: 'Nova Square', role: 'heading', files: [{ file: face, weight: '400', style: 'normal' }], licence: 'SIL Open Font License 1.1' }
    expect((await drafts.write(cees, 't', null, { path: 'theme.fonts', value: [family] })).manifest!.theme!.fonts).toEqual([family])
    expect((await refusal(drafts.write(cees, 't', null, { path: 'theme.fonts', value: [{ ...family, licence: '' }] }))).status).toBe(422)
    // A logo is never a font file (tree-format.md 3.6).
    expect((await refusal(drafts.write(cees, 't', null, { path: 'theme.logo', value: { light: face, alt: { en: 'x' } } }))).status).toBe(422)
    expect(Object.keys(JSON.parse(await text('t', 'draft.json')).theme)).toEqual(['logo', 'fonts', 'colours'])
  })

  test('null removes a part; the last one removed takes the theme key with it; any other theme path is V-KEYS', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    await drafts.write(cees, 't', null, { path: 'theme.colours', value: colours })
    expect((await refusal(drafts.write(cees, 't', null, { path: 'theme.colours.text', value: '#000000' }))).rules).toEqual(['V-KEYS'])
    expect((await refusal(drafts.write(cees, 't', 'start', { path: 'theme.colours', value: '#000000' }))).rules).toEqual(['V-KEYS'])
    await drafts.write(cees, 't', null, { path: 'theme.colours', value: null })
    expect(JSON.parse(await text('t', 'draft.json'))).not.toHaveProperty('theme')
  })

  test('published, the Theme and its files reach the public copy; a file it does not name stays private', async () => {
    await smallTree('t')
    const light = (await drafts.uploadThemeFile(cees, 't', PNG, 'logo.png')).file
    const loose = (await drafts.uploadThemeFile(cees, 't', WEBP, 'draft.webp')).file
    await drafts.write(cees, 't', null, { path: 'theme.logo', value: { light, alt: { en: 'Lab', nl: 'Lab' } } })
    await drafts.write(cees, 't', null, { path: 'theme.colours', value: colours })
    expect(drafts.draft(cees, 't').themePath(light)).toBe(file('t', path.join('theme', light)))
    await drafts.publish(cees, 't', true)
    const published = store.published('t')!
    expect(published.manifest.theme).toEqual({ logo: { light, alt: { en: 'Lab', nl: 'Lab' } }, colours })
    expect(published.themePath(light)).not.toBeNull()
    expect(published.themePath(loose)).toBeNull()
  })
})

describe('**[#180]** a family of the font library (37.3), and an upload’s own family name (37.4)', () => {
  const library = (name: string): Promise<Buffer> => readFile(path.join('fonts', name))
  const use = (by: Account, role: unknown, family: unknown) => drafts.write(by, 't', null, { op: 'use-library-font', role, family })
  /** Every file of the Tree's theme/ by name, with its bytes. */
  async function themeFolder(): Promise<Record<string, Buffer>> {
    const names = (await readdir(file('t', 'theme'))).sort()
    return Object.fromEntries(await Promise.all(names.map(async (name) => [name, await readFile(file('t', path.join('theme', name)))] as const)))
  }

  test('use-library-font copies the two files and the licence text and writes the entry of 37.3', async () => {
    await drafts.create(cees, 't', ['en', 'nl'], { en: 'T', nl: 'T' })
    const written = await use(cees, 'heading', 'faustina')
    expect(written.manifest!.theme!.fonts).toEqual([
      {
        family: 'Faustina',
        role: 'heading',
        files: [
          { file: 'faustina-normal-a84c008b.woff2', weight: '400 700', style: 'normal' },
          { file: 'faustina-italic-5ab1ba64.woff2', weight: '400 700', style: 'italic' },
        ],
        licence: 'SIL Open Font License 1.1 (https://spdx.org/licenses/OFL-1.1.html)',
      },
    ])
    expect(await themeFolder()).toEqual({
      'faustina-italic-5ab1ba64.woff2': await library('faustina/faustina-italic.woff2'),
      'faustina-licence.txt': await library('faustina/OFL.txt'),
      'faustina-normal-a84c008b.woff2': await library('faustina/faustina-normal.woff2'),
    })
    // The files are the Tree's now: its draft names them, and the licence text it does not (5.5).
    const draft = drafts.draft(cees, 't')
    expect(draft.themePath('faustina-normal-a84c008b.woff2')).toBe(file('t', path.join('theme', 'faustina-normal-a84c008b.woff2')))
    expect(draft.themePath('faustina-licence.txt')).toBeNull()
  })

  test('a release whose library file is not the one src/fonts.ts lists answers 500: nothing is copied, no entry written (33.8)', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const draft = await text('t', 'draft.json')
    // The working directory, where a release carries the library, with Roboto's first file one byte off.
    const release = await mkdtemp(path.join(tmpdir(), 'elsa-release-'))
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(release)
    try {
      const roboto = path.join(release, 'fonts', 'roboto')
      await mkdir(roboto, { recursive: true })
      for (const name of ['roboto-normal.woff2', 'roboto-italic.woff2', 'OFL.txt']) await copyFile(path.join('fonts', 'roboto', name), path.join(roboto, name))
      const altered = await readFile(path.join(roboto, 'roboto-normal.woff2'))
      altered[1000] = altered[1000]! ^ 1
      await writeFile(path.join(roboto, 'roboto-normal.woff2'), altered)

      const thrown = await use(cees, 'body', 'roboto').catch((error: unknown) => error)
      // Not a refusal, which the route answers with its status: a bug, thrown on to the framework's 500 (requests.ts).
      expect(isStoreError(thrown)).toBe(false)
      expect((thrown as Error).message).toBe('fonts/roboto/roboto-normal.woff2 is not the file src/fonts.ts lists')
    } finally {
      cwd.mockRestore()
      await rm(release, { recursive: true, force: true })
    }
    expect(await text('t', 'draft.json')).toBe(draft)
    expect(await readdir(file('t', 'theme')).catch(() => [])).toEqual([])
  })

  test('choosing it twice writes the same bytes', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    await use(cees, 'body', 'open-sans')
    const folder = await themeFolder()
    const draft = await text('t', 'draft.json')
    await use(cees, 'body', 'open-sans')
    expect(await themeFolder()).toEqual(folder)
    expect(await text('t', 'draft.json')).toBe(draft)
  })

  test('it replaces the role’s entry, keeps body before heading, and creates theme and fonts when absent', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    await drafts.write(cees, 't', null, { path: 'theme.colours', value: { background: '#ffffff', surface: '#f0f3f7', text: '#2d2e33', 'text-muted': '#696a6e', accent: '#ffc600', 'accent-secondary': '#159a2f', danger: '#e44e56' } })
    const fonts = async (): Promise<string[]> => (JSON.parse(await text('t', 'draft.json')).theme.fonts as { role: string; family: string }[]).map(({ role, family }) => `${role} ${family}`)
    await use(cees, 'heading', 'roboto')
    expect(await fonts()).toEqual(['heading Roboto'])
    await use(cees, 'body', 'open-sans')
    expect(await fonts()).toEqual(['body Open Sans', 'heading Roboto'])
    await use(cees, 'heading', 'atkinson-hyperlegible-next')
    expect(await fonts()).toEqual(['body Open Sans', 'heading Atkinson Hyperlegible Next'])
    expect(Object.keys(JSON.parse(await text('t', 'draft.json')).theme)).toEqual(['fonts', 'colours'])
    // A replaced family's files stay in theme/, as 33.8's "Not done" says of any replaced font.
    expect(Object.keys(await themeFolder())).toContain('roboto-normal-56802c51.woff2')
  })

  test('an unknown family or role is 422 with V-THEME, and nothing is copied or written', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    const before = await text('t', 'draft.json')
    for (const [role, family] of [['body', 'comic-sans'], ['body', '../open-sans'], ['body', undefined], ['title', 'roboto'], [undefined, 'roboto']]) {
      expect(await refusal(use(cees, role, family)), `${String(role)} ${String(family)}`).toMatchObject({ status: 422, rules: ['V-THEME'] })
    }
    expect(await readdir(file('t', '.'))).not.toContain('theme')
    expect(await text('t', 'draft.json')).toBe(before)
  })

  test('a collaborator may; an account without a role may not, and copies nothing', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    expect((await refusal(use(erik, 'body', 'roboto'))).status).toBe(403)
    expect(await readdir(file('t', '.'))).not.toContain('theme')
    await drafts.addCollaborator(cees, 't', dirk.id)
    expect((await use(dirk, 'body', 'roboto')).manifest!.theme!.fonts![0]!.family).toBe('Roboto')
  })

  test('a font’s upload answers its own family name; a logo’s and a font that states none answer the file alone', async () => {
    await drafts.create(cees, 't', ['en'], { en: 'T' })
    expect(await drafts.uploadThemeFile(cees, 't', await library('faustina/faustina-italic.woff2'), 'My Font.woff2')).toEqual({ file: 'my-font-5ab1ba64.woff2', family: 'Faustina' })
    expect(await drafts.uploadThemeFile(cees, 't', PNG, 'logo.png')).toEqual({ file: expect.stringMatching(/^logo-[0-9a-f]{8}\.png$/) })
    // A WOFF2 cut short is still a WOFF2 to the upload (its signature), but states no name.
    const cut = (await library('roboto/roboto-normal.woff2')).subarray(0, 4096)
    expect(await drafts.uploadThemeFile(cees, 't', cut, 'cut.woff2')).toEqual({ file: expect.stringMatching(/^cut-[0-9a-f]{8}\.woff2$/) })
  })
})

describe('**[#147]** the languages of an existing Tree (22.2, 33.5)', () => {
  /**
   * A Dutch Tree with a localised text of every kind, 10 in all: the manifest's title,
   * description and logo text; on `start` a title, a description, a Source label, an
   * explainer's term and text and an Option title; and the Option's Node's title. Answers
   * the Option's Node's id.
   */
  async function dutchTree(): Promise<string> {
    await drafts.create(cees, 'nl-tree', ['nl'], { nl: 'Boom' })
    await drafts.write(cees, 'nl-tree', null, { path: 'description.nl', value: 'Over de boom.' })
    const light = (await drafts.uploadThemeFile(cees, 'nl-tree', PNG, 'logo.png')).file
    await drafts.write(cees, 'nl-tree', null, { path: 'theme.logo', value: { light, alt: { nl: 'Lab' } } })
    await drafts.write(cees, 'nl-tree', 'start', { path: 'title.nl', value: 'Begin' })
    await drafts.write(cees, 'nl-tree', 'start', { path: 'description.nl', value: 'Een [term](#term).' })
    await drafts.write(cees, 'nl-tree', 'start', { op: 'add-source', kind: 'legal', label: { nl: 'Wet' }, url: 'https://example.org/wet' })
    await drafts.write(cees, 'nl-tree', 'start', { op: 'add-explainer', id: 'term', term: { nl: 'term' }, text: { nl: 'Uitleg.' } })
    return (await drafts.createNode(cees, 'nl-tree', { node: 'start', link: 'option' }, { nl: 'Zijpad' })).node!.id
  }

  const l10n = (id: string): string[] =>
    drafts
      .entry(cees, id)
      .advisory.filter((violation) => violation.rule === 'V-L10N')
      .map((violation) => `${violation.file} ${violation.keyPath}`)
      .sort()

  test('add-language writes "" for the tag into every localised text, each a to-do, and also names every Node changed', async () => {
    const aside = await dutchTree()
    expect(l10n('nl-tree')).toEqual([])
    const before = drafts.entry(cees, 'nl-tree').advisory.length
    const response = await drafts.write(cees, 'nl-tree', null, { op: 'add-language', tag: 'en' })

    expect(response.node).toBeNull()
    expect(response.manifest!.languages).toEqual(['nl', 'en'])
    expect(response.manifest!.title).toEqual({ nl: 'Boom', en: '' })
    expect(response.manifest!.theme!.logo!.alt).toEqual({ nl: 'Lab', en: '' })
    expect(response.also!.map((also) => also.node!.id).sort()).toEqual([aside, 'start'].sort())
    const start = response.also!.find((also) => also.node!.id === 'start')!.node!
    expect(start.title).toEqual({ nl: 'Begin', en: '' })
    expect(start.sources![0]!.label).toEqual({ nl: 'Wet', en: '' })
    expect(start.explainers![0]).toMatchObject({ term: { nl: 'term', en: '' }, text: { nl: 'Uitleg.', en: '' } })
    expect(start.options![0]!.title).toEqual({ nl: 'Zijpad', en: '' })
    expect(l10n('nl-tree')).toEqual(
      [
        'manifest title.en',
        'manifest description.en',
        'manifest theme.logo.alt.en',
        'start title.en',
        'start description.en',
        'start sources[0].label.en',
        'start explainers[0].term.en',
        'start explainers[0].text.en',
        'start options[0].title.en',
        `${aside} title.en`,
      ].sort(),
    )
    // Ten texts, and the explainer's mark, which the new, empty description does not carry yet (V-EXPLAINER).
    expect(response.violations.length + response.also!.reduce((sum, also) => sum + also.violations.length, 0)).toBe(response.tree.advisory)
    expect(response.tree.advisory).toBe(before + 11)
    const stored = JSON.parse(await text('nl-tree', 'draft.json'))
    expect(stored.languages).toEqual(['nl', 'en'])
    expect(stored.nodes[0].title).toEqual({ nl: 'Begin', en: '' })

    // Each English text written is one to-do fewer.
    const written = await drafts.write(cees, 'nl-tree', 'start', { path: 'title.en', value: 'Start' })
    expect(written.tree.advisory).toBe(before + 10)
    // What removing each language would take away (33.5): the texts written in it.
    expect(drafts.entry(cees, 'nl-tree').written).toEqual({ nl: 10, en: 1 })
  })

  test('remove-language drops the tag and every text under it; a text only in that language keeps the rest as to-dos', async () => {
    const aside = await dutchTree()
    await drafts.write(cees, 'nl-tree', null, { op: 'add-language', tag: 'en' })
    await drafts.write(cees, 'nl-tree', 'start', { path: 'title.en', value: 'Start' })
    await drafts.write(cees, 'nl-tree', null, { op: 'set-default-language', tag: 'en' })
    const response = await drafts.write(cees, 'nl-tree', null, { op: 'remove-language', tag: 'nl' })

    expect(response.manifest!.languages).toEqual(['en'])
    expect(response.manifest!.title).toEqual({ en: '' })
    expect(response.also!.map((also) => also.node!.id).sort()).toEqual([aside, 'start'].sort())
    const start = response.also!.find((also) => also.node!.id === 'start')!.node!
    expect(start.title).toEqual({ en: 'Start' })
    expect(start.explainers![0]).toMatchObject({ term: { en: '' }, text: { en: '' } })
    expect(await text('nl-tree', 'draft.json')).not.toContain('"nl"')
    expect(drafts.entry(cees, 'nl-tree').blocking).toEqual([])

    // A text the draft holds in the removed language only is left with the others as "", never {}.
    await drafts.write(cees, 'nl-tree', null, { op: 'add-language', tag: 'de' })
    await drafts.write(cees, 'nl-tree', null, { op: 'set-default-language', tag: 'de' })
    const draftFile = file('nl-tree', 'draft.json')
    const held = JSON.parse(await text('nl-tree', 'draft.json'))
    held.nodes[0].title = { en: 'Start' }
    await writeFile(draftFile, treeBytes(held))
    const reopened = (await openStore(data, { ...ADMIN, ELSA_SEED_DIR: data })).drafts
    const again = await reopened.write(cees, 'nl-tree', null, { op: 'remove-language', tag: 'en' })
    expect(again.also!.find((also) => also.node!.id === 'start')!.node!.title).toEqual({ de: '' })
  })

  test('**[#179]** a Terminal\'s words are one localised text more: add-language writes "" into them, remove-language takes its text out (22.2)', async () => {
    await drafts.create(cees, 'end-tree', ['nl'], { nl: 'Boom' })
    const end = (await drafts.createNode(cees, 'end-tree', { node: 'start', link: 'answer', label: { nl: 'Ja' } })).node!.id
    await drafts.createNode(cees, 'end-tree', { node: end, link: 'end', label: { nl: 'Verboden' } })

    const added = await drafts.write(cees, 'end-tree', null, { op: 'add-language', tag: 'en' })

    expect(added.also!.find((also) => also.node!.id === end)!.node!.label).toEqual({ nl: 'Verboden', en: '' })
    expect(l10n('end-tree')).toContain(`${end} terminal.label.en`)
    // **[#221]** And a next step's words are one more (22.2).
    expect(added.also!.find((also) => also.node!.id === 'start')!.node!.answers).toEqual([{ label: { nl: 'Ja', en: '' }, target: end }])
    expect(l10n('end-tree')).toContain('start answers[0].label.en')

    await drafts.write(cees, 'end-tree', end, { path: 'terminal.label.en', value: 'Prohibited' })
    await drafts.write(cees, 'end-tree', null, { op: 'set-default-language', tag: 'en' })
    const removed = await drafts.write(cees, 'end-tree', null, { op: 'remove-language', tag: 'nl' })

    expect(removed.also!.find((also) => also.node!.id === end)!.node!.label).toEqual({ en: 'Prohibited' })
    const stored = JSON.parse(await text('end-tree', 'draft.json')) as { nodes: Array<{ id: string; terminal?: unknown }> }
    expect(stored.nodes.find((node) => node.id === end)!.terminal).toEqual({ label: { en: 'Prohibited' } })
  })

  test('set-default-language moves the tag to the front and changes no text', async () => {
    await dutchTree()
    await drafts.write(cees, 'nl-tree', null, { op: 'add-language', tag: 'en' })
    await drafts.write(cees, 'nl-tree', null, { op: 'add-language', tag: 'de' })
    const before = JSON.parse(await text('nl-tree', 'draft.json'))
    const response = await drafts.write(cees, 'nl-tree', null, { op: 'set-default-language', tag: 'de' })
    expect(response.manifest!.languages).toEqual(['de', 'nl', 'en'])
    expect(response.also).toBeUndefined()
    const after = JSON.parse(await text('nl-tree', 'draft.json'))
    expect(after.languages).toEqual(['de', 'nl', 'en'])
    expect(after.nodes).toEqual(before.nodes)
  })

  test('the default language, and so the only one, is 409; an undeclared, declared or malformed tag is 422; nothing is stored', async () => {
    await dutchTree()
    const alone = await text('nl-tree', 'draft.json')
    expect(await refusal(drafts.write(cees, 'nl-tree', null, { op: 'remove-language', tag: 'nl' }))).toEqual({ status: 409, code: 'default-language', rules: [] })
    expect(await text('nl-tree', 'draft.json')).toBe(alone)
    await drafts.write(cees, 'nl-tree', null, { op: 'add-language', tag: 'en' })
    const added = await text('nl-tree', 'draft.json')
    expect((await refusal(drafts.write(cees, 'nl-tree', null, { op: 'remove-language', tag: 'nl' }))).status).toBe(409)
    for (const change of [
      { op: 'add-language', tag: 'en' },
      { op: 'add-language', tag: 'EN GB' },
      { op: 'add-language' },
      { op: 'remove-language', tag: 'de' },
      { op: 'set-default-language', tag: 'de' },
    ]) {
      expect(await refusal(drafts.write(cees, 'nl-tree', null, change)), JSON.stringify(change)).toMatchObject({ status: 422, rules: ['V-LANG'] })
    }
    expect((await refusal(drafts.write(cees, 'nl-tree', null, { op: 'rename-language', tag: 'en' }))).rules).toEqual(['V-KEYS'])
    expect(await text('nl-tree', 'draft.json')).toBe(added)
  })

  test('a collaborator may change the languages; an account without a role may not', async () => {
    await dutchTree()
    await drafts.addCollaborator(cees, 'nl-tree', dirk.id)
    expect((await drafts.write(dirk, 'nl-tree', null, { op: 'add-language', tag: 'en' })).manifest!.languages).toEqual(['nl', 'en'])
    expect((await refusal(drafts.write(erik, 'nl-tree', null, { op: 'add-language', tag: 'de' }))).status).toBe(403)
  })
})
