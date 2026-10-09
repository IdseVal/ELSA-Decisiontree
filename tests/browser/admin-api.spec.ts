/**
 * **[#136]** The editor's server interface against the standalone server a deployment runs
 * (docs/specs/application.md 22; ADR-132-editor-api, Consequences): logged in through the
 * login route with the helper of #135, a creator builds a Tree through `/admin/api/trees`,
 * publishes it, and the public routes serve it at once and drop it at once when it is
 * unpublished. And the refusals only a real server shows: 401 without a session, 403 on
 * another's Tree and on a write with no `Origin`, 415 on an SVG, a draft's picture served to
 * its authors and to nobody on the public route, and no response under `/admin` cacheable.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, test, type APIResponse, type Page } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const PORT = BASE_PORT + 90
const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const CEES = { email: 'cees@example.org', name: 'Cees', password: 'cees first password' }
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>')

let origin: string
let dir: string

test.beforeAll(async () => {
  dir = await buildDataDir({ trees: [], accounts: [ANNA, CEES] })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

/** A request as the editor's script sends it: this origin, the session cookie, JSON. */
function api(page: Page, cookie: string, method: string, route: string, data?: unknown): Promise<APIResponse> {
  return page.request.fetch(`${origin}/admin/api${route}`, {
    method,
    headers: { Origin: origin, Cookie: cookie, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    data: data === undefined ? undefined : JSON.stringify(data),
    maxRedirects: 0,
  })
}

function expectNotCacheable(response: APIResponse): void {
  expect(response.headers()['cache-control']).toBe('no-store')
  expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow')
}

test('a creator builds, publishes and unpublishes a Tree through the API; the public routes follow at once', async ({ page }) => {
  const anna = (await login(page, origin, ANNA.email, ANNA.password)).cookie
  const created = await api(page, anna, 'POST', '/trees', { id: 'api-tree', languages: ['en'], title: { en: 'Built by API' } })
  expect(created.status()).toBe(201)
  expectNotCacheable(created)

  const fill = async (node: string, title: string): Promise<void> => {
    for (const [field, value] of [['title.en', title], ['description.en', `About ${title}.`]] as const) {
      const answer = await api(page, anna, 'PATCH', `/trees/api-tree/nodes/${node}`, { path: field, value })
      expect(answer.status()).toBe(200)
    }
  }
  await fill('start', 'Start')
  const refused = await api(page, anna, 'PUT', '/trees/api-tree/published', { published: true })
  expect(refused.status()).toBe(409)
  expect(((await refused.json()) as { violations: unknown[] }).violations.length).toBeGreaterThan(0)

  const ends: string[] = []
  for (const [link, words] of [['yes', 'Applies'], ['no', 'Look elsewhere']] as const) {
    const node = await api(page, anna, 'POST', '/trees/api-tree/nodes', { from: { node: 'start', link: 'answer', label: {} } })
    expect(node.status()).toBe(201)
    const id = ((await node.json()) as { node: { id: string } }).node.id
    ends.push(id)
    await fill(id, `Ends ${link}`)
    expect((await api(page, anna, 'POST', '/trees/api-tree/nodes', { from: { node: id, link: 'end', label: { en: words } } })).status()).toBe(201)
  }
  expect((await page.request.get(`${origin}/api-tree/start`)).status()).toBe(404)

  const published = await api(page, anna, 'PUT', '/trees/api-tree/published', { published: true })
  expect(published.status()).toBe(200)
  expect(await published.json()).toMatchObject({ published: true })
  const page200 = await page.goto(`${origin}/api-tree/start`)
  expect(page200?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Start' })).toBeVisible()
  const dataset = await page.request.get(`${origin}/api-tree/tree.json`)
  expect(await dataset.text()).toBe(await readFile(path.join(dir, 'trees', 'api-tree', 'tree.json'), 'utf8'))
  expect(await dataset.text()).toBe(await readFile(path.join(dir, 'trees', 'api-tree', 'draft.json'), 'utf8'))

  // A save while published is public at once.
  await api(page, anna, 'PATCH', '/trees/api-tree/nodes/start', { path: 'title.en', value: 'Start, edited' })
  await page.goto(`${origin}/api-tree/start`)
  await expect(page.getByRole('heading', { name: 'Start, edited' })).toBeVisible()

  expect((await api(page, anna, 'PUT', '/trees/api-tree/published', { published: false })).status()).toBe(200)
  expect((await page.request.get(`${origin}/api-tree/start`)).status()).toBe(404)
  expect((await page.request.get(`${origin}/api-tree/tree.json`)).status()).toBe(404)
  expect(ends).toHaveLength(2)
})

test('the refusals: no session, another account, no Origin, an SVG; a draft picture is not public', async ({ page }) => {
  const noSession = await page.request.get(`${origin}/admin/api/trees`)
  expect(noSession.status()).toBe(401)
  expectNotCacheable(noSession)

  const anna = (await login(page, origin, ANNA.email, ANNA.password)).cookie
  const cees = (await login(page, origin, CEES.email, CEES.password)).cookie
  expect((await api(page, anna, 'POST', '/trees', { id: 'annas-tree', languages: ['en'], title: { en: 'Anna' } })).status()).toBe(201)

  const foreign = await api(page, cees, 'GET', '/trees/annas-tree')
  expect(foreign.status()).toBe(403)
  expect((await api(page, cees, 'PATCH', '/trees/annas-tree/nodes/start', { path: 'title.en', value: 'x' })).status()).toBe(403)

  const noOrigin = await page.request.fetch(`${origin}/admin/api/trees/annas-tree/nodes/start`, {
    method: 'PATCH',
    headers: { Cookie: anna, 'Content-Type': 'application/json' },
    data: JSON.stringify({ path: 'title.en', value: 'x' }),
  })
  expect(noOrigin.status()).toBe(403)

  const upload = (buffer: Buffer, name: string) =>
    page.request.post(`${origin}/admin/api/trees/annas-tree/images`, {
      headers: { Origin: origin, Cookie: anna },
      multipart: { file: { name, mimeType: 'image/png', buffer } },
    })
  const svg = await upload(SVG, 'logo.png')
  expect(svg.status()).toBe(415)
  const png = await upload(PNG, 'Photo.PNG')
  expect(png.status()).toBe(201)
  const { file } = (await png.json()) as { file: string }
  expect(file).toMatch(/^photo-[0-9a-f]{8}\.png$/)

  const draftPicture = await page.request.get(`${origin}/admin/api/trees/annas-tree/images/${file}`, { headers: { Cookie: anna } })
  expect(draftPicture.status()).toBe(200)
  expect(draftPicture.headers()['content-type']).toBe('image/png')
  expectNotCacheable(draftPicture)
  expect((await page.request.get(`${origin}/admin/api/trees/annas-tree/images/${file}`, { headers: { Cookie: cees } })).status()).toBe(403)
  expect((await page.request.get(`${origin}/annas-tree/images/${file}`)).status()).toBe(404)
})

test("**[#196]** the accounts by address (38.2, 38.5): me answers the caller's own, the list names alone, POST and PATCH take email, and the holder's is 403", async ({ page }) => {
  const admin = (await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)).cookie
  const cees = (await login(page, origin, CEES.email, CEES.password)).cookie

  expect(await (await api(page, cees, 'GET', '/me')).json()).toEqual({ id: expect.stringMatching(/^[0-9a-f]{32}$/), name: 'Cees', email: CEES.email, administrator: false })
  // To any logged-in account, every active account's id and name, and no address (21.4).
  const list = await api(page, cees, 'GET', '/accounts')
  const listed = (await list.json()) as Record<string, unknown>[]
  expect(listed.map((entry) => Object.keys(entry))).toEqual(listed.map(() => ['id', 'name']))
  expect(listed.map(({ name }) => name).sort()).toEqual(['Administrator', 'Anna', 'Cees'])
  expect(await list.text()).not.toContain('@')

  const created = await api(page, admin, 'POST', '/accounts', { name: 'Dora', email: ' Dora@Example.org ', password: 'doras first password' })
  expect(created.status()).toBe(201)
  const dora = (await created.json()) as { id: string }
  expect(dora).toEqual({ id: expect.stringMatching(/^[0-9a-f]{32}$/), name: 'Dora', email: 'dora@example.org', active: true, administrator: false, createdAt: expect.any(String) })
  for (const [body, field, error] of [
    [{ name: 'Erik', email: 'erik', password: 'eriks first password' }, 'email', 'email-invalid'],
    // A body that still sends `login` sends no address.
    [{ name: 'Erik', login: 'erik', password: 'eriks first password' }, 'email', 'email-invalid'],
    [{ name: 'Erik', email: 'DORA@example.org', password: 'eriks first password' }, 'email', 'email-taken'],
    [{ name: ' dora ', email: 'erik@example.org', password: 'eriks first password' }, 'name', 'name-taken'],
  ] as const) {
    const refused = await api(page, admin, 'POST', '/accounts', body)
    expect(refused.status(), JSON.stringify(body)).toBe(422)
    expect(await refused.json()).toEqual({ error, field })
  }

  // The holder may not change its own address; the administrator may, and that ends no session.
  const doraSession = (await login(page, origin, 'dora@example.org', 'doras first password')).cookie
  const own = await api(page, doraSession, 'PATCH', `/accounts/${dora.id}`, { email: 'dora.v@example.org' })
  expect(own.status()).toBe(403)
  expect(await own.json()).toEqual({ error: 'forbidden', field: 'email' })
  const changed = await api(page, admin, 'PATCH', `/accounts/${dora.id}`, { email: 'Dora.V@Example.org' })
  expect(changed.status()).toBe(200)
  expect(await changed.json()).toMatchObject({ id: dora.id, email: 'dora.v@example.org' })
  expect((await api(page, doraSession, 'GET', '/me')).status()).toBe(200)
  expect((await login(page, origin, 'dora@example.org', 'doras first password')).status).toBe(401)
  expect((await login(page, origin, 'dora.v@example.org', 'doras first password')).status).toBe(204)
  const taken = await api(page, admin, 'PATCH', `/accounts/${dora.id}`, { email: CEES.email })
  expect(taken.status()).toBe(422)
  expect(await taken.json()).toEqual({ error: 'email-taken', field: 'email' })
})
