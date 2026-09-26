/**
 * **[#140]** Images in the editor, in a browser (docs/specs/application.md 31, 35.4;
 * ADR-133-images-in-the-editor): a picture uploaded through the empty slot opens the attach
 * Sheet with `attach` disabled until a credit is typed; attached, it is the main image above
 * the title, stored under the Tree's `images/` and served by the admin image route; after
 * publishing through #136's route it is on the public page, whose image requests are exactly
 * 11.5's set. A second picture lands in the strip through its `+`; `makeMain` swaps the two;
 * `removeImage` empties the strip and deletes the file. A credit left empty attaches nothing,
 * and `cancel` deletes the upload; an SVG and a 6 MiB file are refused at the picker in the
 * indicator; the Option button's picture appears the moment an aside's main image is
 * attached in its Overlay; every `<img>` of the editor is under the admin image route.
 *
 * Against a data directory of its own on a server of this file's own. The screenshots the
 * issue asks for go to `docs/screenshots/issue-140/` under `ELSA_SHOTS=1`, the results folder
 * otherwise (35.7).
 */
import { access, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Locator, type Page } from '@playwright/test'
import type { DraftNode } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-140') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 105

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }

/** Two real pictures of different bytes, 960 x 640, from the example Tree. */
const COVERED = { name: 'Covered Photo.PNG', mimeType: 'image/png', buffer: Buffer.alloc(0) }
const PROHIBITED = { name: 'prohibited.png', mimeType: 'image/png', buffer: Buffer.alloc(0) }

let origin: string
let dir: string

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  COVERED.buffer = await readFile(path.join(repo, 'trees', 'ai-act-example', 'images', 'covered.png'))
  PROHIBITED.buffer = await readFile(path.join(repo, 'trees', 'ai-act-example', 'images', 'prohibited.png'))
  dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'pictures', hidden: true, creator: ANNA.login }],
    accounts: [ANNA],
  })
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
  })
}

async function loggedIn(browser: Browser): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  const { status, cookie } = await login(page, origin, ANNA.login, ANNA.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function nodeOf(page: Page, cookie: string, tree: string, id: string): Promise<DraftNode> {
  return ((await (await api(page, cookie, 'GET', `/trees/${tree}/nodes/${id}`)).json()) as { node: DraftNode }).node
}

/** Whether the store holds `file` in the Tree's `images/` (22.6). */
async function stored(tree: string, file: string): Promise<boolean> {
  return access(path.join(dir, 'trees', tree, 'images', file)).then(
    () => true,
    () => false,
  )
}

/** A fresh hidden Tree of the test's own, with one language: a failed test restarts the worker, and its server with it. */
async function freshTree(page: Page, cookie: string, id: string): Promise<void> {
  expect((await api(page, cookie, 'POST', '/trees', { id, languages: ['en'], title: { en: id } })).status()).toBe(201)
}

const status = (page: Page) => page.getByRole('status')
const attachPanel = (page: Page) => page.locator('.editor-attach-panel')
const field = (page: Page, nodeId: string, keyPath: string) => page.locator(`[data-field="${nodeId} ${keyPath}"]`).filter({ visible: true })

/** Picks `file` in a picker, as the file chooser would, and waits for the attach Sheet. */
async function upload(picker: Locator, file: typeof COVERED): Promise<void> {
  await picker.locator('input[type="file"]').setInputFiles(file)
}

/** Fills the attach Sheet and attaches: the credit, and the description in the page's language. */
async function attach(page: Page, credit: string, description: string): Promise<void> {
  const panel = attachPanel(page)
  await panel.getByLabel('Credit').fill(credit)
  await panel.getByLabel('Description').fill(description)
  await panel.getByRole('button', { name: 'Attach' }).click()
  await expect(panel).toHaveCount(0)
  await expect(status(page)).toContainText(/^Saved \d/)
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

test.describe('upload, attach, publish (31.1, 31.2, 31.5, 11.5)', () => {
  test('a picture through the empty slot: the credit required, the main image above the title, stored, and on the public page with exactly 11.5’s requests', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser)
    await page.goto(`${origin}/admin/trees/pictures/full/applies`)
    const slot = page.locator('.bubble .editor-picker--slot')
    await expect(slot).toBeVisible()
    await expect(slot.locator('input[type="file"]')).toHaveAttribute('accept', 'image/png, image/jpeg, image/gif, image/webp')
    await slot.hover()
    await shoot(page, 'picker')

    await upload(slot, COVERED)
    const panel = attachPanel(page)
    await expect(panel).toBeVisible()
    const file = (await panel.locator('figcaption').textContent())!
    expect(file).toMatch(/^covered-photo-[0-9a-f]{8}\.png$/)
    await expect(panel.locator('img')).toHaveAttribute('src', `/admin/api/trees/pictures/images/${file}`)
    await expect(panel.getByLabel('Credit')).toBeFocused()
    await panel.getByLabel('Description').fill('A covered system, drawn')
    const attachButton = panel.getByRole('button', { name: 'Attach' })
    await expect(attachButton).toBeDisabled()
    await shoot(page, 'credit-required')
    await panel.getByLabel('Credit').fill('Drawing: ELSA lab')
    await expect(attachButton).toBeEnabled()
    await attachButton.click()
    await expect(status(page)).toContainText(/^Saved \d/)

    // Above the title, from the admin image route: the draft's picture before any publish (31.5).
    const main = page.locator('.bubble .main-image img')
    await expect(main).toHaveAttribute('src', `/admin/api/trees/pictures/images/${file}`)
    await expect(main).toHaveAttribute('alt', 'A covered system, drawn')
    await expect(page.locator('.bubble .editor-picker--slot')).toHaveCount(0)
    const [picture, title] = [await main.boundingBox(), await page.locator('.bubble h1').boundingBox()]
    expect(picture!.y + picture!.height).toBeLessThanOrEqual(title!.y)
    await shoot(page, 'main-image-in-bubble')
    for (const src of await page.locator('img').evaluateAll((images) => images.map((image) => image.getAttribute('src')))) {
      expect(src).toMatch(/^\/admin\/api\/trees\/pictures\/images\//)
    }

    expect(await stored('pictures', file)).toBe(true)
    const served = await page.request.get(`${origin}/admin/api/trees/pictures/images/${file}`, { headers: { Cookie: cookie } })
    expect(served.status()).toBe(200)
    expect(served.headers()['content-type']).toBe('image/png')
    expect(Buffer.compare(await served.body(), COVERED.buffer)).toBe(0)
    expect((await nodeOf(page, cookie, 'pictures', 'applies')).images).toEqual([{ file, credit: 'Drawing: ELSA lab', description: { en: 'A covered system, drawn', nl: '' } }])
    console.log(`stored: ${path.join('$ELSA_DATA_DIR', 'trees', 'pictures', 'images', file)}; served at /admin/api/trees/pictures/images/${file} (${served.status()}, ${served.headers()['content-type']}, ${(await served.body()).length} bytes)`)

    // The Tree is in two languages and a publish runs every rule blocking (19.3): the Dutch
    // description is written where it is edited, in the enlarged view (31.3).
    await page.goto(`${origin}/admin/trees/pictures/full/applies?lang=nl`)
    await page.locator('.bubble .main-image').click()
    const description = field(page, 'applies', 'images[0].description.nl').locator('textarea')
    await description.click()
    await description.fill('Een afgedekt systeem, getekend')
    await description.blur()
    await expect(status(page)).toContainText(/^Opgeslagen \d/)
    expect((await api(page, cookie, 'PUT', '/trees/pictures/published', { published: true })).status()).toBe(200)

    // The public page, with no session: its image requests, recorded, against 11.5.
    const reader = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
    const requested: string[] = []
    reader.on('request', (request) => requested.push(request.url().replace(origin, '')))
    await reader.goto(`${origin}/pictures/full/applies`)
    const publicMain = reader.locator('.bubble .main-image img')
    await expect(publicMain).toHaveAttribute('src', `/pictures/images/${file}`)
    await expect(publicMain).toHaveAttribute('alt', 'A covered system, drawn')
    await expect.poll(() => publicMain.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth)).toBe(960)
    await reader.waitForLoadState('networkidle')
    const images = requested.filter((url) => url.includes('/images/'))
    console.log(`public page /pictures/full/applies requested:\n${requested.join('\n')}`)
    // 11.5: one image file of the centre Node; `applies` has no Option, so no button picture.
    expect(images).toEqual([`/pictures/images/${file}`])
    expect(requested.filter((url) => url.startsWith('/admin'))).toEqual([])
    expect(requested.filter((url) => url.startsWith('http'))).toEqual([])
    expect((await api(page, cookie, 'PUT', '/trees/pictures/published', { published: false })).status()).toBe(200)
  })

  test('a Node with ten Images offers no picker: no slot and no + after the strip (31.1, V-COUNT)', async ({ browser }) => {
    const { page } = await loggedIn(browser)
    await page.goto(`${origin}/admin/trees/pictures/full`)
    await expect(page.locator('.carousel-strip .thumbnail')).toHaveCount(9)
    await expect(page.locator('.bubble .editor-picker')).toHaveCount(0)
    await expect(page.locator('.carousel > .editor-picker')).toHaveCount(0)
  })
})

test.describe('the strip and the enlarged view (31.1, 31.3, 31.4)', () => {
  test('a second picture lands in the strip; makeMain swaps the two; removeImage empties the strip and deletes the file', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser)
    await freshTree(page, cookie, 'two-pictures')
    await page.goto(`${origin}/admin/trees/two-pictures/start`)
    // One picture: no strip yet, and no + beside it but the slot's (31.1).
    await expect(page.locator('.carousel > .editor-picker--strip')).toHaveCount(0)
    await upload(page.locator('.bubble .editor-picker--slot'), COVERED)
    await attach(page, 'Drawing: one', 'The first picture')
    const first = (await nodeOf(page, cookie, 'two-pictures', 'start')).images[0]!.file

    const add = page.locator('.carousel > .editor-picker--strip')
    await expect(add).toBeVisible()
    const box = (await add.boundingBox())!
    expect([box.width, box.height]).toEqual([48, 48])
    await upload(add, PROHIBITED)
    await attach(page, 'Drawing: two', 'The second picture')
    const second = (await nodeOf(page, cookie, 'two-pictures', 'start')).images[1]!.file
    await expect(page.locator('.bubble .main-image img')).toHaveAttribute('src', `/admin/api/trees/two-pictures/images/${first}`)
    const thumbnails = page.locator('.carousel-strip .thumbnail img')
    await expect(thumbnails).toHaveCount(1)
    await expect(thumbnails.first()).toHaveAttribute('src', `/admin/api/trees/two-pictures/images/${second}`)
    await expect(thumbnails.first()).toHaveAttribute('alt', 'The second picture')
    await expect(page.locator('.carousel-strip ~ .editor-picker--strip')).toBeVisible()
    await shoot(page, 'carousel-with-two')

    // The thumbnail opens the enlarged view at its picture, now the Image's editor (31.3).
    await page.locator('.carousel-strip .thumbnail').click()
    const sheet = page.locator('.carousel-sheet > .sheet-panel')
    await expect(sheet).toBeVisible()
    await expect(field(page, 'start', 'images[1].credit').locator('textarea')).toHaveValue('Drawing: two')
    await expect(field(page, 'start', 'images[1].description.en').locator('textarea')).toHaveValue('The second picture')
    const controls = sheet.locator('.editor-image-controls button')
    await expect(controls).toHaveText(['Make main picture', 'Move earlier', 'Remove this picture'])
    await shoot(page, 'enlarged-view-controls')
    await sheet.getByRole('button', { name: 'Make main picture' }).click()
    await expect(page.locator('.bubble .main-image img')).toHaveAttribute('src', `/admin/api/trees/two-pictures/images/${second}`)
    await expect(thumbnails.first()).toHaveAttribute('src', `/admin/api/trees/two-pictures/images/${first}`)
    expect((await nodeOf(page, cookie, 'two-pictures', 'start')).images.map((image) => image.file)).toEqual([second, first])
    // The view followed the picture to the first page, where it is the main image.
    await expect(controls).toHaveText(['Move later', 'Remove this picture'])
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()

    // The credit is edited where it is shown whole (31.3).
    await page.locator('.carousel-strip .thumbnail').click()
    const credit = field(page, 'start', 'images[1].credit').locator('textarea')
    await credit.click()
    await credit.fill('Drawing: one, credited again')
    await credit.blur()
    await expect(status(page)).toContainText(/^Saved \d/)
    expect((await nodeOf(page, cookie, 'two-pictures', 'start')).images[1]!.credit).toBe('Drawing: one, credited again')

    await sheet.getByRole('button', { name: 'Remove this picture' }).click()
    await expect(thumbnails).toHaveCount(0)
    await expect(page.locator('.carousel-strip')).toHaveCount(0)
    expect((await nodeOf(page, cookie, 'two-pictures', 'start')).images.map((image) => image.file)).toEqual([second])
    // Named by nothing now, and never published: the best-effort delete removed it (31.4).
    await expect.poll(() => stored('two-pictures', first)).toBe(false)
    expect(await stored('two-pictures', second)).toBe(true)
  })
})

test.describe('refusals at the picker (31.2, 31.6)', () => {
  test('a credit left empty attaches nothing; cancel deletes the upload', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser)
    await freshTree(page, cookie, 'no-credit')
    await page.goto(`${origin}/admin/trees/no-credit/start`)
    await upload(page.locator('.bubble .editor-picker--slot'), COVERED)
    const panel = attachPanel(page)
    const file = (await panel.locator('figcaption').textContent())!
    await panel.getByLabel('Description').fill('Described, but not credited')
    await panel.getByLabel('Credit').fill('   ')
    await expect(panel.getByRole('button', { name: 'Attach' })).toBeDisabled()
    await panel.getByLabel('Credit').press('Enter')
    await expect(panel).toBeVisible()
    expect((await nodeOf(page, cookie, 'no-credit', 'start')).images).toEqual([])
    expect(await stored('no-credit', file)).toBe(true)

    await panel.getByRole('button', { name: 'Cancel' }).click()
    await expect(panel).toHaveCount(0)
    await expect.poll(() => stored('no-credit', file)).toBe(false)
    expect((await nodeOf(page, cookie, 'no-credit', 'start')).images).toEqual([])
    await expect(page.locator('.bubble .editor-picker--slot input')).toBeFocused()
  })

  test('an SVG and a 6 MiB file are refused in the indicator with #136’s answers; no Sheet opens and nothing is stored', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser)
    await freshTree(page, cookie, 'refused-files')
    await page.goto(`${origin}/admin/trees/refused-files/start`)
    const slot = page.locator('.bubble .editor-picker--slot')
    const answers: number[] = []
    page.on('response', (response) => {
      if (response.url().endsWith('/admin/api/trees/refused-files/images')) answers.push(response.status())
    })

    await upload(slot, { name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>') })
    await expect(status(page)).toHaveText('Not saved · This file type is refused: PNG, JPEG, GIF or WebP.')
    await expect(attachPanel(page)).toHaveCount(0)
    await shoot(page, 'type-refused')

    const big = Buffer.concat([COVERED.buffer, Buffer.alloc(6 * 1024 * 1024)])
    await upload(slot, { name: 'big.png', mimeType: 'image/png', buffer: big })
    await expect(status(page)).toHaveText('Not saved · This file is too large: at most 5 MiB.')
    await expect(attachPanel(page)).toHaveCount(0)
    expect(answers).toEqual([415, 413])
    expect(await page.request.get(`${origin}/admin/api/trees/refused-files/images/logo-00000000.svg`, { headers: { Cookie: cookie } }).then((r) => r.status())).toBe(404)
    // The picker stayed where it was.
    await expect(slot).toBeVisible()
  })
})

test.describe('the Option button’s picture (31.5, 10.29)', () => {
  test('an aside’s main image attached in its Overlay shows on its Option button at once, and the Overlay stays open', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser)
    await freshTree(page, cookie, 'aside-picture')
    expect((await api(page, cookie, 'PATCH', '/trees/aside-picture/nodes/start', { op: 'add-option', title: { en: 'An aside' } })).status()).toBe(200)
    await page.goto(`${origin}/admin/trees/aside-picture/start`)
    const overlay = page.locator('details.overlay').first()
    await expect(overlay.locator(':scope > .sheet-open .option-image--empty')).toHaveCount(1)
    // The picture, not the title: the title is a field, and a click there edits it (28.1).
    await overlay.locator(':scope > .sheet-open .option-image').click()
    const interior = overlay.locator(':scope > .sheet-panel .overlay-interior')
    await expect(interior).toBeVisible()
    await upload(interior.locator('.editor-picker--slot'), COVERED)
    await attach(page, 'Drawing: the aside', 'The aside’s picture')

    const aside = (await nodeOf(page, cookie, 'aside-picture', 'start')).options[0]!.target
    const file = (await nodeOf(page, cookie, 'aside-picture', aside)).images[0]!.file
    await expect(overlay.locator(':scope > .sheet-open img.option-image')).toHaveAttribute('src', `/admin/api/trees/aside-picture/images/${file}`)
    await expect(interior.locator('.main-image img')).toHaveAttribute('src', `/admin/api/trees/aside-picture/images/${file}`)
    await expect(interior).toBeVisible()
  })
})
