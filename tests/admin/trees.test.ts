/**
 * **[#136]** The editor's server interface through its route handlers, with real sessions on
 * a temporary data directory (docs/specs/application.md 21, 22): the permission matrix --
 * creator, collaborator, another account, the administrator and no session, times every
 * action the routes offer -- as one table; the refused uploads; and the headers and the CSRF
 * check on every Tree route.
 */
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { store } from '../../src/config.ts'
import type { Account } from '../../src/store/accounts.ts'
import type { Store } from '../../src/store/index.ts'
import { ADMIN_PASSWORD } from '../store/admin.ts'
import { GIF, PNG, SVG } from '../store/pictures.ts'

const HOST = 'http://127.0.0.1:3000'
type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>
type Routes = Record<string, Record<string, Handler>>

let data: string
let opened: Store
let routes: Routes
const accounts: Record<string, Account> = {}
const cookies: Record<string, string> = {}

beforeAll(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  data = await mkdtemp(path.join(tmpdir(), 'elsa-trees-api-'))
  // The routes read the store the environment names, as a deployment's do; one per process.
  process.env.ELSA_DATA_DIR = data
  process.env.ELSA_ADMIN_PASSWORD = ADMIN_PASSWORD
  process.env.ELSA_SEED_DIR = data
  delete process.env.ELSA_BASE_URL
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('elsa.store')]
  opened = await store()
  const admin = opened.accounts.all().find((account) => account.administrator)!
  accounts.administrator = admin
  accounts.creator = await opened.accounts.create(admin, 'Cees', 'cees', 'cees first password')
  accounts.collaborator = await opened.accounts.create(admin, 'Dirk', 'dirk', 'dirks first password')
  accounts['another account'] = await opened.accounts.create(admin, 'Erik', 'erik', 'eriks first password')
  for (const [role, account] of Object.entries(accounts)) {
    cookies[role] = (await opened.sessions.start(account)).cookie.split(';')[0]!
  }
  const base = '../../src/app/[lang]/admin/api/trees'
  routes = {
    trees: await import(`${base}/route.ts`),
    tree: await import(`${base}/[tree]/route.ts`),
    published: await import(`${base}/[tree]/published/route.ts`),
    creator: await import(`${base}/[tree]/creator/route.ts`),
    collaborator: await import(`${base}/[tree]/collaborators/[account]/route.ts`),
    nodes: await import(`${base}/[tree]/nodes/route.ts`),
    node: await import(`${base}/[tree]/nodes/[node]/route.ts`),
    images: await import(`${base}/[tree]/images/route.ts`),
    image: await import(`${base}/[tree]/images/[file]/route.ts`),
  }
})

afterAll(async () => {
  vi.restoreAllMocks()
  await rm(data, { recursive: true, force: true })
})

/** One request to one handler, as the browser of `role` sends it: same-origin, with its cookie. */
function call(
  route: keyof Routes,
  method: string,
  params: Record<string, string>,
  { role, body, headers = {} }: { role: string | null; body?: unknown; headers?: Record<string, string> },
): Promise<Response> {
  const form = body instanceof FormData
  const request = new Request(`${HOST}/admin/api/trees`, {
    method,
    headers: {
      Host: '127.0.0.1:3000',
      'Sec-Fetch-Site': 'same-origin',
      ...(role ? { Cookie: cookies[role]! } : {}),
      ...(body === undefined || form ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  })
  const handler = routes[route]![method]
  if (!handler) throw new Error(`${String(route)} has no ${method}`)
  return handler(request, { params: Promise.resolve(params) })
}

function upload(bytes: Uint8Array, name: string): FormData {
  const form = new FormData()
  form.set('file', new Blob([bytes as Uint8Array<ArrayBuffer>]), name)
  return form
}

let counter = 0

/**
 * A fresh Tree for one cell, valid in full, hidden: created by the creator through the store,
 * the collaborator invited, and one uploaded picture nothing names yet.
 */
async function freshTree(): Promise<{ id: string; yes: string; picture: string }> {
  const { drafts } = opened
  const creator = accounts.creator!
  const id = `matrix-${(counter += 1)}`
  await drafts.create(creator, id, ['en'], { en: 'Matrix' })
  const fill = async (node: string): Promise<void> => {
    await drafts.write(creator, id, node, { path: 'title.en', value: `Title of ${node}` })
    await drafts.write(creator, id, node, { path: 'description.en', value: `About ${node}.` })
  }
  await fill('start')
  const yes = (await drafts.createNode(creator, id, { node: 'start', link: 'yes' })).node!.id
  const no = (await drafts.createNode(creator, id, { node: 'start', link: 'no' })).node!.id
  for (const [node, outcome] of [[yes, 'applicable'], [no, 'refer']] as const) {
    await fill(node)
    await drafts.createNode(creator, id, { node, link: 'end', outcome })
  }
  await drafts.addCollaborator(creator, id, accounts.collaborator!.id)
  const picture = (await drafts.uploadImage(creator, id, GIF, 'picture.gif')).file
  return { id, yes, picture }
}

interface Action {
  name: string
  /** The table of 21.2: who may. The fifth column, no session, is 401 for every action. */
  allowed: Array<'creator' | 'collaborator' | 'another account' | 'administrator'>
  /** The status of an allowed request. */
  status: number
  run(role: string | null, tree: { id: string; yes: string; picture: string }): Promise<Response>
  /** A step before the request, with the administrator's rights: a Tree in the state the action needs. */
  prepare?(tree: { id: string }): Promise<unknown>
}

const EVERYONE: Action['allowed'] = ['creator', 'collaborator', 'another account', 'administrator']
const WITH_A_ROLE: Action['allowed'] = ['creator', 'collaborator', 'administrator']
const CREATOR: Action['allowed'] = ['creator', 'administrator']

const ACTIONS: Action[] = [
  { name: 'create a Tree', allowed: EVERYONE, status: 201, run: (role) => call('trees', 'POST', {}, { role, body: { id: `new-${(counter += 1)}`, languages: ['en'], title: { en: 'New' } } }) },
  { name: 'read the draft', allowed: WITH_A_ROLE, status: 200, run: (role, t) => call('tree', 'GET', { tree: t.id }, { role }) },
  { name: 'read a Node', allowed: WITH_A_ROLE, status: 200, run: (role, t) => call('node', 'GET', { tree: t.id, node: 'start' }, { role }) },
  { name: 'edit a manifest field', allowed: WITH_A_ROLE, status: 200, run: (role, t) => call('tree', 'PATCH', { tree: t.id }, { role, body: { path: 'title.en', value: 'Edited' } }) },
  { name: 'edit a Node field', allowed: WITH_A_ROLE, status: 200, run: (role, t) => call('node', 'PATCH', { tree: t.id, node: 'start' }, { role, body: { path: 'title.en', value: 'Edited' } }) },
  {
    name: 'an operation (add a Source)',
    allowed: WITH_A_ROLE,
    status: 200,
    run: (role, t) => call('node', 'PATCH', { tree: t.id, node: 'start' }, { role, body: { op: 'add-source', kind: 'legal', label: { en: 'Law' }, url: 'https://example.org' } }),
  },
  { name: 'create a Node', allowed: WITH_A_ROLE, status: 201, run: (role, t) => call('nodes', 'POST', { tree: t.id }, { role, body: { from: { node: 'start', link: 'option' }, title: { en: 'Aside' } } }) },
  { name: 'delete a Node', allowed: WITH_A_ROLE, status: 200, run: (role, t) => call('node', 'DELETE', { tree: t.id, node: t.yes }, { role }) },
  { name: 'upload a picture', allowed: WITH_A_ROLE, status: 201, run: (role, t) => call('images', 'POST', { tree: t.id }, { role, body: upload(PNG, 'photo.png') }) },
  { name: 'read a draft picture', allowed: WITH_A_ROLE, status: 200, run: (role, t) => call('image', 'GET', { tree: t.id, file: t.picture }, { role }) },
  { name: 'remove an unreferenced picture', allowed: WITH_A_ROLE, status: 204, run: (role, t) => call('image', 'DELETE', { tree: t.id, file: t.picture }, { role }) },
  { name: 'invite a collaborator', allowed: CREATOR, status: 200, run: (role, t) => call('collaborator', 'PUT', { tree: t.id, account: accounts['another account']!.id }, { role }) },
  { name: 'remove a collaborator', allowed: CREATOR, status: 200, run: (role, t) => call('collaborator', 'DELETE', { tree: t.id, account: accounts.collaborator!.id }, { role }) },
  { name: 'publish', allowed: CREATOR, status: 200, run: (role, t) => call('published', 'PUT', { tree: t.id }, { role, body: { published: true } }) },
  {
    name: 'unpublish',
    allowed: CREATOR,
    status: 200,
    prepare: (t) => opened.drafts.publish(accounts.administrator!, t.id, true),
    run: (role, t) => call('published', 'PUT', { tree: t.id }, { role, body: { published: false } }),
  },
  { name: 'hand the Tree over', allowed: CREATOR, status: 200, run: (role, t) => call('creator', 'PUT', { tree: t.id }, { role, body: { accountId: accounts['another account']!.id } }) },
  { name: 'delete the Tree (hidden)', allowed: CREATOR, status: 204, run: (role, t) => call('tree', 'DELETE', { tree: t.id }, { role }) },
]

const ROLES = ['creator', 'collaborator', 'another account', 'administrator', null] as const

describe('the permission matrix (21.2), through the routes', () => {
  const rows: string[] = []
  let cells = 0

  afterAll(() => {
    const header = `| Action | ${ROLES.map((role) => role ?? 'no session').join(' | ')} |`
    const rule = `|---|${ROLES.map(() => '---').join('|')}|`
    process.stdout.write(`\n${[header, rule, ...rows].join('\n')}\n\n${cells} cells: ${ACTIONS.length} actions x ${ROLES.length} callers\n`)
  })

  test.for(ACTIONS.map((action) => [action.name, action] as const))('%s', async ([name, action]) => {
    const row: string[] = []
    for (const role of ROLES) {
      const tree = await freshTree()
      await action.prepare?.(tree)
      const response = await action.run(role, tree)
      const allowed = role !== null && action.allowed.includes(role)
      const expected = role === null ? 401 : allowed ? action.status : 403
      expect(response.status, `${name} as ${role ?? 'no session'}: ${await response.clone().text()}`).toBe(expected)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      row.push(`${allowed ? 'allowed' : 'refused'} ${response.status}`)
      cells += 1
    }
    rows.push(`| ${name} | ${row.join(' | ')} |`)
  })

  test('every cell is covered', () => {
    expect(cells).toBe(ACTIONS.length * ROLES.length)
    expect(cells).toBe(85)
  })
})

describe('what the routes refuse whatever the role', () => {
  test('the three refused uploads, and the traversal the name cannot make', async () => {
    const { id } = await freshTree()
    const lines: string[] = []

    const svg = await call('images', 'POST', { tree: id }, { role: 'creator', body: upload(SVG, 'logo.png') })
    lines.push(`an SVG named logo.png: ${svg.status} ${await svg.text()}`)
    expect(svg.status).toBe(415)

    const big = await call('images', 'POST', { tree: id }, { role: 'creator', body: upload(Buffer.alloc(5 * 1024 * 1024 + 1, 0x89), 'big.png') })
    lines.push(`a body over 5 MiB: ${big.status} ${await big.text()}`)
    expect(big.status).toBe(413)

    const declared = await call('images', 'POST', { tree: id }, { role: 'creator', body: upload(PNG, 'small.png'), headers: { 'Content-Length': String(6 * 1024 * 1024) } })
    lines.push(`a declared Content-Length over 5 MiB: ${declared.status} ${await declared.text()}`)
    expect(declared.status).toBe(413)

    // A traversal name never reaches the disk: the name is the server's (22.6).
    const named = await call('images', 'POST', { tree: id }, { role: 'creator', body: upload(PNG, '../../../meta.json') })
    const stored = (await named.clone().json()) as { file: string }
    lines.push(`a PNG named ../../../meta.json: ${named.status} ${await named.text()}`)
    expect(named.status).toBe(201)
    expect(stored.file).toMatch(/^meta-[0-9a-f]{8}\.png$/)
    await stat(path.join(data, 'trees', id, 'images', stored.file))

    // And a traversal in the address reads nothing outside images/.
    for (const file of ['../meta.json', '..%2Fmeta.json', '..\\draft.json', 'draft.json']) {
      const answer = await call('image', 'GET', { tree: id, file }, { role: 'creator' })
      lines.push(`GET images/${file}: ${answer.status}`)
      expect(answer.status).toBe(404)
      const removal = await call('image', 'DELETE', { tree: id, file }, { role: 'creator' })
      expect(removal.status).toBe(404)
    }
    process.stdout.write(`\n${lines.join('\n')}\n`)
  })

  test('a write with no Origin and no Sec-Fetch-Site is 403; a cross-site one too', async () => {
    const { id } = await freshTree()
    const before = opened.drafts.entry(accounts.creator!, id).meta.revision
    const none = await routes.tree!.PATCH!(
      new Request(`${HOST}/admin/api/trees/${id}`, {
        method: 'PATCH',
        headers: { Host: '127.0.0.1:3000', Cookie: cookies.creator!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'title.en', value: 'x' }),
      }),
      { params: Promise.resolve({ tree: id }) },
    )
    expect(none.status).toBe(403)
    const cross = await call('tree', 'PATCH', { tree: id }, { role: 'creator', body: { path: 'title.en', value: 'x' }, headers: { 'Sec-Fetch-Site': 'cross-site' } })
    expect(cross.status).toBe(403)
    expect(opened.drafts.entry(accounts.creator!, id).meta.revision).toBe(before)
  })

  test('a body over 64 kB is 413, a string over 2,000 code points 422, nothing stored', async () => {
    const { id } = await freshTree()
    const before = opened.drafts.entry(accounts.creator!, id).meta.revision
    const large = await call('node', 'PATCH', { tree: id, node: 'start' }, { role: 'creator', body: { path: 'title.en', value: 'x'.repeat(1000), pad: 'y'.repeat(70 * 1024) } })
    expect(large.status).toBe(413)
    const long = await call('node', 'PATCH', { tree: id, node: 'start' }, { role: 'creator', body: { path: 'description.en', value: 'x'.repeat(2001) } })
    expect(long.status).toBe(422)
    expect(opened.drafts.entry(accounts.creator!, id).meta.revision).toBe(before)
  })

  test('an unknown Tree is 404 to the administrator and 403 to anyone else; a published one cannot be deleted', async () => {
    expect((await call('tree', 'GET', { tree: 'no-such-tree' }, { role: 'administrator' })).status).toBe(404)
    expect((await call('tree', 'GET', { tree: 'no-such-tree' }, { role: 'creator' })).status).toBe(403)
    const { id } = await freshTree()
    await call('published', 'PUT', { tree: id }, { role: 'creator', body: { published: true } })
    expect((await call('tree', 'DELETE', { tree: id }, { role: 'creator' })).status).toBe(409)
    expect((await call('node', 'DELETE', { tree: id, node: 'start' }, { role: 'creator' })).status).toBe(409)
  })

  test('publish of an invalid draft is 409 with the violations', async () => {
    const created = await call('trees', 'POST', {}, { role: 'creator', body: { id: 'not-yet', languages: ['en'], title: { en: 'Not yet' } } })
    expect(created.status).toBe(201)
    const refused = await call('published', 'PUT', { tree: 'not-yet' }, { role: 'creator', body: { published: true } })
    expect(refused.status).toBe(409)
    const body = (await refused.json()) as { violations: Array<{ rule: string }> }
    expect(body.violations.length).toBeGreaterThan(0)
    expect(opened.published('not-yet')).toBeNull()
  })
})
