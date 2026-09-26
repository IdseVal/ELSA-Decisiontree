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
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const PORT = BASE_PORT + 90
const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }
const CEES = { login: 'cees', name: 'Cees', password: 'cees first password' }
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
  const anna = (await login(page, origin, ANNA.login, ANNA.password)).cookie
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
  for (const [link, outcome] of [['yes', 'applicable'], ['no', 'refer']] as const) {
    const node = await api(page, anna, 'POST', '/trees/api-tree/nodes', { from: { node: 'start', link } })
    expect(node.status()).toBe(201)
    const id = ((await node.json()) as { node: { id: string } }).node.id
    ends.push(id)
    await fill(id, `Ends ${link}`)
    expect((await api(page, anna, 'POST', '/trees/api-tree/nodes', { from: { node: id, link: 'end', outcome } })).status()).toBe(201)
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

  const anna = (await login(page, origin, ANNA.login, ANNA.password)).cookie
  const cees = (await login(page, origin, CEES.login, CEES.password)).cookie
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
