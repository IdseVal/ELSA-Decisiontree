/**
 * **[#144]** The Theme panel, in a browser (docs/specs/application.md 33.8): a logo uploaded
 * with its alternative text in each language, shown at once in the editor's chrome bar
 * through the admin route; the colours chosen from the default palette and changed, the
 * draft's `<style>` following; the contrast warning of issue #64 appearing and going; a
 * heading font with its file and licence; then, published, the same logo, colours and font
 * on the public page. And what is refused: an SVG, a file of no theme type, a reader without
 * a role, a public request for a file the published Theme does not name.
 *
 * Against a data directory holding the full-Node fixture, hidden, on a server of this file's
 * own. The tests run in order: each leaves the Tree as the next expects it. The screenshots
 * the issue asks for go to `docs/screenshots/issue-144/` under `ELSA_SHOTS=1`, the results
 * folder otherwise (35.7).
 */
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-144') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 140
const TREE = 'hidden-draft'
const EDITOR = `/admin/trees/${TREE}/full`

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }
const DORA = { login: 'dora', name: 'Dora', password: 'doras first password' }

/** The first Tree's logo and the example Tree's heading font: real files of the types the panel takes. */
const LOGO = path.join(repo, 'trees', 'ai-act-applicability-agrifood', 'theme', 'elsa-lab-logo.png')
const FONT = path.join(repo, 'trees', 'ai-act-example', 'theme', 'nova-square-400.woff2')

let origin: string

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: TREE, hidden: true, creator: ANNA.login }],
    accounts: [ANNA, DORA],
  })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

async function loggedIn(browser: Browser, who: { login: string; password: string }): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  const { status, cookie } = await login(page, origin, who.login, who.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

const button = (page: Page) => page.locator('.panel-sheet > .sheet-open')
const panel = (page: Page) => page.locator('.panel-sheet > .sheet-panel')
const themePanel = (page: Page) => panel(page).locator('[data-theme-panel]')
/** The chrome bar's own logo, not a copy in a neighbour frame (the bar is the page's first header). */
const barLogo = (page: Page) => page.locator('.editor-chrome > img.logo, .editor-chrome > a > img.logo')

async function openPanel(page: Page): Promise<void> {
  const reread = page.waitForResponse((response) => response.url().endsWith('/admin/api/accounts'))
  await button(page).click()
  await expect(panel(page)).toBeVisible()
  await reread
}

/** Waits for the Theme's next part write to be answered, and for the page to repaint after it. */
function themeWrite(page: Page) {
  return page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().endsWith(`/admin/api/trees/${TREE}`))
}

/** A custom property of the page's `:root`, as the draft's or the published Theme set it. */
function property(page: Page, name: string): Promise<string> {
  return page.evaluate((property) => getComputedStyle(document.documentElement).getPropertyValue(property).trim(), name)
}

test('a logo uploaded with its alternative text shows at once in the editor’s chrome bar', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}${EDITOR}`)
  // A Tree without a Theme shows its title where the logo would be (13.2).
  await expect(barLogo(page)).toHaveCount(0)
  await openPanel(page)
  await expect(themePanel(page)).toBeVisible()

  const written = themeWrite(page)
  await themePanel(page).getByLabel('Upload a logo').setInputFiles(LOGO)
  expect((await written).status()).toBe(200)
  const preview = themePanel(page).locator('img.theme-logo')
  await expect(preview).toHaveAttribute('src', /^\/admin\/api\/trees\/hidden-draft\/theme\/elsa-lab-logo-[0-9a-f]{8}\.png$/)
  await expect(barLogo(page)).toHaveAttribute('src', /^\/admin\/api\/trees\/hidden-draft\/theme\//)
  expect(await barLogo(page).evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)

  // Its alternative text is still to write: the to-do count went up by the two languages.
  await expect(button(page)).toHaveText('Hidden (2)')
  const alt = themePanel(page).getByLabel(/Alternative text/)
  await alt.fill('ELSA Lab for food')
  const saved = themeWrite(page)
  await alt.blur()
  expect((await saved).status()).toBe(200)
  await expect(barLogo(page)).toHaveAttribute('alt', 'ELSA Lab for food')
  await expect(button(page)).toHaveText('Hidden (1)')

  // The other language, in the editor in that language (28.2).
  await page.goto(`${origin}${EDITOR}?lang=nl`)
  await openPanel(page)
  const altNl = themePanel(page).getByLabel(/Alternatieve tekst/)
  await altNl.fill('ELSA Lab voor voedsel')
  const savedNl = themeWrite(page)
  await altNl.blur()
  expect((await savedNl).status()).toBe(200)
  await expect(barLogo(page)).toHaveAttribute('alt', 'ELSA Lab voor voedsel')
  await expect(button(page)).toHaveText('Verborgen')
})

test('the colours: chosen from the default palette, changed by role, the draft’s style following; the contrast warning comes and goes', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}${EDITOR}`)
  const defaultBackground = await property(page, '--elsa-background')
  await openPanel(page)
  const chosen = themeWrite(page)
  await themePanel(page).getByRole('button', { name: 'Choose colours' }).click()
  expect((await chosen).status()).toBe(200)
  // Nothing changes until a colour does: the pickers start at the default look.
  const background = themePanel(page).locator('input[type="color"][data-role="background"]')
  await expect(background).toHaveValue(defaultBackground)

  const changed = themeWrite(page)
  await background.fill('#fdf1d8')
  expect((await changed).status()).toBe(200)
  await expect.poll(() => property(page, '--elsa-background')).toBe('#fdf1d8')

  const accent = themeWrite(page)
  await themePanel(page).locator('input[type="color"][data-role="accent-secondary"]').fill('#1d6b8a')
  expect((await accent).status()).toBe(200)
  await expect.poll(() => property(page, '--elsa-accent-secondary')).toBe('#1d6b8a')

  // A muted grey too pale for small text on the page and on the Bubble: warned, and stored.
  const warning = themePanel(page).locator('[data-contrast-warning]')
  await expect(warning).toHaveCount(0)
  const pale = themeWrite(page)
  await themePanel(page).locator('input[type="color"][data-role="text-muted"]').fill('#c8c8c8')
  await expect(warning).toContainText('Secondary text on Page')
  await expect(warning).toContainText('needs 4.5 : 1')
  expect((await pale).status()).toBe(200)
  await shoot(page, 'contrast-warning')

  const fixed = themeWrite(page)
  await themePanel(page).locator('input[type="color"][data-role="text-muted"]').fill('#5c5446')
  await expect(warning).toHaveCount(0)
  expect((await fixed).status()).toBe(200)
  await expect.poll(() => property(page, '--elsa-text-muted')).toBe('#5c5446')
})

test('a heading font with its file and licence; the draft’s @font-face is served through the admin route', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}${EDITOR}`)
  await openPanel(page)
  const heading = themePanel(page).locator('[data-font-role="heading"]')
  await heading.getByLabel('Family name').fill('Nova Square')
  await heading.getByLabel('Licence').fill('SIL Open Font License 1.1')
  await heading.getByLabel('WOFF2 file').setInputFiles(FONT)
  const written = themeWrite(page)
  await heading.getByRole('button', { name: 'Add the font' }).click()
  expect((await written).status()).toBe(200)
  await expect(heading.locator('.theme-font-files li')).toHaveCount(1)
  await expect.poll(() => property(page, '--elsa-font-heading')).toContain("'Nova Square'")
  await expect
    .poll(() => page.evaluate(async () => (await document.fonts.load("20px 'Nova Square'")).length))
    .toBeGreaterThan(0)

  await heading.scrollIntoViewIfNeeded()
  await shoot(page, 'panel-fonts')
  await themePanel(page).locator('[data-part="logo"]').scrollIntoViewIfNeeded()
  await shoot(page, 'panel')
  await page.keyboard.press('Escape')
  await expect(panel(page)).toBeHidden()
  await shoot(page, 'editor-themed')
})

test('published, the public page shows the same logo, colours and font', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}${EDITOR}`)
  await openPanel(page)
  await panel(page).getByRole('switch', { name: 'Publish' }).click()
  await expect(panel(page).getByRole('switch', { name: 'Publish' })).toHaveAttribute('aria-checked', 'true')

  const reader = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  await reader.goto(`${origin}/${TREE}/full`)
  const logo = reader.locator('.page-chrome img.logo').first()
  await expect(logo).toHaveAttribute('src', /^\/hidden-draft\/theme\/elsa-lab-logo-[0-9a-f]{8}\.png$/)
  await expect(logo).toHaveAttribute('alt', 'ELSA Lab for food')
  expect(await logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  expect(await property(reader, '--elsa-background')).toBe('#fdf1d8')
  expect(await property(reader, '--elsa-accent-secondary')).toBe('#1d6b8a')
  expect(await property(reader, '--elsa-font-heading')).toContain("'Nova Square'")
  expect((await reader.evaluate(async () => (await document.fonts.load("20px 'Nova Square'")).length))).toBeGreaterThan(0)
  await shoot(reader, 'public-themed')
})

test('what is refused: an SVG and a text file at the picker, a reader without a role, a file the published Theme does not name', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}${EDITOR}`)
  await openPanel(page)
  const svg = { name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>') }
  const refused = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith(`/admin/api/trees/${TREE}/theme`))
  await themePanel(page).getByLabel('Replace the logo').setInputFiles(svg)
  expect((await refused).status()).toBe(415)
  await expect(themePanel(page).getByRole('alert')).toHaveText('This file type is refused: PNG or WebP for a logo, WOFF2 for a font.')

  // A second PNG uploaded but never named: the admin route serves only what the draft names.
  const loose = await page.request.post(`${origin}/admin/api/trees/${TREE}/theme`, {
    headers: { Origin: origin, Cookie: cookie },
    multipart: { file: { name: 'loose.png', mimeType: 'image/png', buffer: await readFile(path.join(repo, 'tests', 'fixtures', 'full-node', 'images', 'one.png')) } },
  })
  expect(loose.status()).toBe(201)
  const { file } = (await loose.json()) as { file: string }
  expect((await page.request.get(`${origin}/admin/api/trees/${TREE}/theme/${file}`, { headers: { Cookie: cookie } })).status()).toBe(404)
  expect((await page.request.get(`${origin}/${TREE}/theme/${file}`)).status()).toBe(404)

  const named = (await barLogo(page).getAttribute('src'))!
  const draftFile = await page.request.get(`${origin}${named}`, { headers: { Cookie: cookie } })
  expect(draftFile.status()).toBe(200)
  expect(draftFile.headers()['cache-control']).toContain('no-store')
  expect(draftFile.headers()['content-security-policy']).toBe("default-src 'none'; sandbox")

  // An account with no role on the Tree reads none of its draft's files.
  const dora = await loggedIn(browser, DORA)
  expect((await dora.page.request.get(`${origin}${named}`, { headers: { Cookie: dora.cookie } })).status()).toBe(403)
  expect((await dora.page.request.post(`${origin}/admin/api/trees/${TREE}/theme`, { headers: { Origin: origin, Cookie: dora.cookie }, multipart: { file: { name: 'x.png', mimeType: 'image/png', buffer: await readFile(LOGO) } } })).status()).toBe(403)
})

test('back to the default colours: the part is removed and the default palette returns', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}${EDITOR}`)
  await openPanel(page)
  const removed = themeWrite(page)
  await themePanel(page).getByRole('button', { name: 'Back to the default colours' }).click()
  expect((await removed).status()).toBe(200)
  await expect(themePanel(page).getByRole('button', { name: 'Choose colours' })).toBeVisible()
  await expect.poll(() => property(page, '--elsa-background')).not.toBe('#fdf1d8')
})

test('back to the default colours without a reload: the default returns on screen, not the colour before it', async ({ browser }) => {
  // The default's element is placed first; a changed colour's comes after it. Going back must
  // paint the default again although an element with its CSS is already in <head>.
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}${EDITOR}`)
  const defaultBackground = await property(page, '--elsa-background')
  await openPanel(page)
  const chosen = themeWrite(page)
  await themePanel(page).getByRole('button', { name: 'Choose colours' }).click()
  expect((await chosen).status()).toBe(200)

  const changed = themeWrite(page)
  await themePanel(page).locator('input[type="color"][data-role="background"]').fill('#fdf1d8')
  expect((await changed).status()).toBe(200)
  await expect.poll(() => property(page, '--elsa-background')).toBe('#fdf1d8')

  const removed = themeWrite(page)
  await themePanel(page).getByRole('button', { name: 'Back to the default colours' }).click()
  expect((await removed).status()).toBe(200)
  await expect(themePanel(page).getByRole('button', { name: 'Choose colours' })).toBeVisible()
  await expect.poll(() => property(page, '--elsa-background')).toBe(defaultBackground)
})
