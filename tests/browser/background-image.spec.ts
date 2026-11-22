/**
 * **[#274]** The Theme's background picture, in a browser (docs/specs/application.md 13.1, 33.8;
 * tree-format.md 4.3.4): uploaded in the Theme panel and drawn at once behind the whole page in
 * the editor, at its first opacity of 30 %, with the line that says text over it is not measured;
 * the slider written once, 400 ms after its last change; published, drawn on the public page from
 * the Tree's own address, which serves it while the published Theme names it; replaced with its
 * opacity kept, and removed. And what is refused: a GIF, and a JPEG at the logo's picker.
 *
 * Against a data directory holding the full-Node fixture, hidden, on a server of this file's own.
 * The tests run in order: each leaves the Tree as the next expects it. Screenshots go to
 * `docs/screenshots/issue-274/` under `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-274') : path.join(RESULTS, 'shots', 'issue-274')
const PORT = BASE_PORT + 274
const TREE = 'pictured'
const EDITOR = `/admin/trees/${TREE}/full`

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }

/** A photograph of the first Tree's, as a creator would upload one: a JPEG. */
const FIELD = path.join(repo, 'tests', 'fixtures', 'background-image', 'theme', 'field.jpg')
/** A PNG of the fixtures, for the replacement. */
const PNG = path.join(repo, 'tests', 'fixtures', 'full-node', 'images', 'one.png')

let origin: string

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: TREE, hidden: true, creator: ANNA.email }],
    accounts: [ANNA],
  })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

async function loggedIn(browser: Browser): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  const { status, cookie } = await login(page, origin, ANNA.email, ANNA.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

const panel = (page: Page) => page.locator('.panel-sheet > .sheet-panel')
const part = (page: Page) => panel(page).locator('[data-theme-panel] [data-part="background-image"]')
const slider = (page: Page) => part(page).getByRole('slider', { name: 'Opacity' })

async function openPanel(page: Page): Promise<void> {
  const reread = page.waitForResponse((response) => response.url().endsWith('/admin/api/accounts'))
  await page.locator('.panel-sheet > .sheet-open').click()
  await expect(panel(page)).toBeVisible()
  await reread
}

/** Waits for the Theme's next part write to be answered. */
function themeWrite(page: Page) {
  return page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().endsWith(`/admin/api/trees/${TREE}`))
}

/** What the layer behind the page draws: the body's `::before`, as 13.1 has it. */
function layer(page: Page): Promise<{ image: string; opacity: string; position: string; size: string; zIndex: string }> {
  return page.evaluate(() => {
    const style = getComputedStyle(document.body, '::before')
    return { image: style.backgroundImage, opacity: style.opacity, position: style.position, size: style.backgroundSize, zIndex: style.zIndex }
  })
}

test('a picture uploaded in the panel lies behind the whole page at once, at 30 %, and the panel says text over it is not measured', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(`${origin}${EDITOR}`)
  // No picture: the layer draws nothing (13.1).
  expect(await layer(page)).toMatchObject({ image: 'none', opacity: '0' })
  await openPanel(page)
  await expect(part(page).locator('[data-background-contrast]')).toHaveCount(0)

  const written = themeWrite(page)
  await part(page).getByLabel('Upload a background picture').setInputFiles(FIELD)
  expect((await written).status()).toBe(200)

  const thumbnail = part(page).locator('img.theme-background-image')
  await expect(thumbnail).toHaveAttribute('src', /^\/admin\/api\/trees\/pictured\/theme\/field-[0-9a-f]{8}\.jpg$/)
  expect(await thumbnail.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  const file = (await thumbnail.getAttribute('src'))!.split('/').pop()!

  // Seen at once: the draft's style names it through the admin route, at the first opacity.
  await expect.poll(async () => (await layer(page)).image).toContain(`/admin/api/trees/${TREE}/theme/${file}`)
  expect(await layer(page)).toMatchObject({ opacity: '0.3', position: 'fixed', size: 'cover', zIndex: '-1' })
  await expect(slider(page)).toHaveValue('30')
  await expect(part(page).locator('output')).toHaveText('30 %')
  await expect(part(page).locator('[data-background-contrast]')).toHaveText('Text on the page over the picture is not measured for contrast: a low opacity keeps it readable.')

  // The admin route serves the draft's picture to a reader with a role (22.6, 33.8).
  const served = await page.request.get(`${origin}/admin/api/trees/${TREE}/theme/${file}`, { headers: { Cookie: cookie } })
  expect(served.status()).toBe(200)
  expect(served.headers()['content-type']).toBe('image/jpeg')
  expect((await served.body()).equals(await readFile(FIELD))).toBe(true)
  await part(page).scrollIntoViewIfNeeded()
  await shoot(page, 'panel-30')
})

test('the slider: three changes inside 400 ms are one write, of the last; the page follows it', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  await page.goto(`${origin}${EDITOR}`)
  await openPanel(page)
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && request.url().endsWith(`/admin/api/trees/${TREE}`)) writes.push(request.postData() ?? '')
  })

  const written = themeWrite(page)
  await slider(page).fill('80')
  await slider(page).fill('40')
  await slider(page).fill('55')
  await expect(part(page).locator('output')).toHaveText('55 %')
  expect((await written).status()).toBe(200)
  await expect.poll(async () => (await layer(page)).opacity).toBe('0.55')
  // Nothing more is on its way: the three changes were one write, and it carried the last value.
  await page.waitForTimeout(1000)
  expect(writes).toHaveLength(1)
  expect(JSON.parse(writes[0]!)).toMatchObject({ path: 'theme.background-image', value: { opacity: '0.55' } })

  // The keyboard moves it too, a percent a key, as a range does.
  const stepped = themeWrite(page)
  await slider(page).focus()
  await page.keyboard.press('ArrowRight')
  expect((await stepped).status()).toBe(200)
  await expect.poll(async () => (await layer(page)).opacity).toBe('0.56')
  await expect(part(page).locator('output')).toHaveText('56 %')
  await page.keyboard.press('Escape')
  await expect(panel(page)).toBeHidden()
  await shoot(page, 'editor-56')
})

test('published, the public page draws it from the Tree’s own address, which serves it while the published Theme names it', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  await page.goto(`${origin}${EDITOR}`)
  await openPanel(page)
  const file = (await part(page).locator('img.theme-background-image').getAttribute('src'))!.split('/').pop()!
  await panel(page).getByRole('switch', { name: 'Publish' }).click()
  await expect(panel(page).getByRole('switch', { name: 'Publish' })).toHaveAttribute('aria-checked', 'true')

  const reader = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  const hosts = new Set<string>()
  reader.on('request', (request) => hosts.add(new URL(request.url()).host))
  await reader.goto(`${origin}/${TREE}/full`)
  await expect.poll(async () => (await layer(reader)).image).toContain(`/${TREE}/theme/${file}`)
  expect((await layer(reader)).opacity).toBe('0.56')
  const served = await reader.request.get(`${origin}/${TREE}/theme/${file}`)
  expect(served.status()).toBe(200)
  expect(served.headers()['content-type']).toBe('image/jpeg')
  // Nothing from another host (13.5): the picture is the Tree's own file.
  expect([...hosts]).toEqual([new URL(origin).host])
  await shoot(reader, 'public-56')
})

test('replaced, the opacity is kept; removed, the layer draws nothing and the upload is offered again', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  await page.goto(`${origin}${EDITOR}`)
  await openPanel(page)

  const replaced = themeWrite(page)
  await part(page).getByLabel('Replace the picture').setInputFiles(PNG)
  expect((await replaced).status()).toBe(200)
  await expect(part(page).locator('img.theme-background-image')).toHaveAttribute('src', /\/one-[0-9a-f]{8}\.png$/)
  await expect.poll(async () => (await layer(page)).image).toMatch(/\/one-[0-9a-f]{8}\.png/)
  expect((await layer(page)).opacity).toBe('0.56')
  await expect(slider(page)).toHaveValue('56')

  const removed = themeWrite(page)
  await part(page).getByRole('button', { name: 'Remove the picture' }).click()
  expect((await removed).status()).toBe(200)
  await expect.poll(async () => (await layer(page)).image).toBe('none')
  expect((await layer(page)).opacity).toBe('0')
  await expect(part(page).getByLabel('Upload a background picture')).toBeAttached()
  await expect(slider(page)).toHaveCount(0)
})

test('what is refused: a GIF at the picture’s picker, and a JPEG at the logo’s', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  await page.goto(`${origin}${EDITOR}`)
  await openPanel(page)
  const refusal = 'This file type is refused: PNG or WebP for a logo, PNG, JPEG or WebP for a background picture, WOFF2 for a font.'

  const gif = { name: 'moving.gif', mimeType: 'image/gif', buffer: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') }
  const refused = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith(`/admin/api/trees/${TREE}/theme`))
  await part(page).getByLabel('Upload a background picture').setInputFiles(gif)
  expect((await refused).status()).toBe(415)
  await expect(panel(page).locator('[data-theme-panel] [role="alert"]')).toHaveText(refusal)

  // The upload takes a JPEG, but a logo is PNG or WebP (tree-format.md 3.6): the panel names none.
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'PATCH') writes.push(request.url())
  })
  const uploaded = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith(`/admin/api/trees/${TREE}/theme`))
  await panel(page).locator('[data-theme-panel] [data-part="logo"]').getByLabel('Upload a logo').setInputFiles(FIELD)
  expect((await uploaded).status()).toBe(201)
  await expect(panel(page).locator('[data-theme-panel] [role="alert"]')).toHaveText(refusal)
  await page.waitForTimeout(500)
  expect(writes).toEqual([])
  await expect(panel(page).locator('[data-theme-panel] img.theme-logo')).toHaveCount(0)
})
