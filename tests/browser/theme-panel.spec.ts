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
 *
 * **[#180]** And, on four more Trees of the same data directory, issue #180's: the editor's own
 * bar and panel in the default look whatever the palette; the Sources in the Theme's text; the
 * font and licence dropdowns of application.md 37, with a library family served from the Tree's
 * own address once published; the refusals of `fontNameTaken`, on the first Tree's shared
 * Open Sans among them; and every information hint. Its screenshots go to
 * `docs/screenshots/issue-180/` under `ELSA_SHOTS=1`; run them alone with `--grep "\[#180\]"`,
 * so issue #144's are not taken again.
 */
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'
import { chrome } from '../../src/chrome.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-144') : path.join(RESULTS, 'shots')
const SHOTS_180 = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-180') : path.join(RESULTS, 'shots', 'issue-180')
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
  await mkdir(SHOTS_180, { recursive: true })
  const dir = await buildDataDir({
    trees: [
      { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: TREE, hidden: true, creator: ANNA.login },
      // [#180] A Tree with no Theme, the example Tree's dark palette, the first Tree's shared Open Sans, and one for the library.
      { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'plain', hidden: true, creator: ANNA.login },
      { folder: path.join(repo, 'trees', 'ai-act-example'), id: 'dark', creator: ANNA.login },
      { folder: path.join(repo, 'trees', 'ai-act-applicability-agrifood'), id: 'first', hidden: true, creator: ANNA.login },
      { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'library', hidden: true, creator: ANNA.login },
    ],
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
/** **[#176]** The to-do control, which counts what the logo's alternative texts leave to do (33.3). */
const todo = (page: Page) => page.locator('.todo-sheet > .sheet-open')
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
function themeWrite(page: Page, tree = TREE) {
  return page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().endsWith(`/admin/api/trees/${tree}`))
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
  await expect(todo(page)).toHaveAccessibleName('2 things to do')
  const alt = themePanel(page).getByLabel(/Alternative text/)
  await alt.fill('ELSA Lab for food')
  const saved = themeWrite(page)
  await alt.blur()
  expect((await saved).status()).toBe(200)
  await expect(barLogo(page)).toHaveAttribute('alt', 'ELSA Lab for food')
  await expect(todo(page)).toHaveAccessibleName('1 thing to do')

  // The other language, in the editor in that language (28.2).
  await page.goto(`${origin}${EDITOR}?lang=nl`)
  await openPanel(page)
  const altNl = themePanel(page).getByLabel(/Alternatieve tekst/)
  await altNl.fill('ELSA Lab voor voedsel')
  const savedNl = themeWrite(page)
  await altNl.blur()
  expect((await savedNl).status()).toBe(200)
  await expect(barLogo(page)).toHaveAttribute('alt', 'ELSA Lab voor voedsel')
  await expect(todo(page)).toHaveAccessibleName('Niets te doen')
  await expect(button(page)).toHaveAccessibleName('Beslisboominstellingen: Verborgen')
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
  // **[#180]** Through the dropdown's last entry: the font's own name is proposed (37.4), the licence chosen from the list (37.5).
  await heading.getByRole('combobox', { name: 'Headings' }).selectOption({ label: 'Upload a font file…' })
  const uploaded = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith(`/admin/api/trees/${TREE}/theme`))
  await heading.getByLabel('WOFF2 file').setInputFiles(FONT)
  expect((await uploaded).status()).toBe(201)
  await expect(heading.getByLabel('Family name')).toHaveValue('Nova Square')
  await heading.getByLabel('Licence', { exact: true }).selectOption({ label: 'SIL Open Font License 1.1' })
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

// --- [#180] the editor's own interface, the Sources, the dropdowns, the hints ---------------

/** Every chrome string of both languages, for the hints' and the dropdowns' words. */
const EN = chrome('en')
const NL = chrome('nl')

/** The hint keys of the Theme part (#169), in the order the panel shows them on a Tree with a logo, colours and a heading font of its own. */
const HINTS = [
  'logoAltHint',
  'colourBackgroundHint',
  'colourSurfaceHint',
  'colourTextHint',
  'colourTextMutedHint',
  'colourAccentHint',
  'colourAccentSecondaryHint',
  'colourDangerHint',
  'contrastHint',
  'fontBodyHint',
  'fontHeadingHint',
  'fontLicenceHint',
  'fontFileHint',
] as const

async function shoot180(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS_180, `${name}.png`) })
}

/** One role's part of the fonts, and its dropdown, named by the role's heading (37.2). */
const fontRole = (page: Page, role: 'body' | 'heading') => themePanel(page).locator(`[data-font-role="${role}"]`)
const fontSelect = (page: Page, role: 'body' | 'heading') => fontRole(page, role).getByRole('combobox', { name: role === 'body' ? 'Running text' : 'Headings' })

/**
 * What the editor paints its own interface and the Tree in: text on fill and the first family
 * of each, as the browser computed them.
 */
async function painted(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const look = (selector: string): string => {
      const element = document.querySelector(selector)
      if (!element) return 'absent'
      const style = getComputedStyle(element)
      return `${style.color} on ${style.backgroundColor}, ${style.fontFamily.split(',')[0]}`
    }
    return {
      bar: look('header.editor-chrome'),
      'bar link': look('header.editor-chrome .admin-link'),
      'settings button': look('.editor-float .panel-sheet > .sheet-open'),
      'to-do button': look('.editor-float .todo-sheet > .sheet-open'),
      panel: look('.panel-sheet > .sheet-panel'),
      "panel's heading": look('.panel-sheet .panel-heading'),
      Bubble: look('.bubble'),
      "Bubble's title": look('.bubble h1'),
    }
  })
}

/** The entries of a dropdown as a reader meets them: each group's label, then its options. */
function entries(select: Locator): Promise<string[]> {
  return select.evaluate((element: HTMLSelectElement) =>
    [...element.querySelectorAll('optgroup, option')].map((entry) => (entry instanceof HTMLOptGroupElement ? `[${entry.label}]` : entry.textContent ?? '')).filter((text) => text !== ''),
  )
}

/**
 * A dropdown laid open in the page for a screenshot: the browser draws a native select's list
 * outside the page, where no screenshot reaches, so the list is shown in place instead.
 */
async function laidOpen(select: Locator): Promise<void> {
  await select.evaluate((element: HTMLSelectElement) => {
    element.size = element.querySelectorAll('optgroup, option').length
  })
}

test('[#180] after the palette changes, the editor’s bar, floating controls and panel are painted as for a Tree without a Theme, the Bubble and its Sources in the palette', async ({ browser }, testInfo) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/plain/full`)
  await openPanel(page)
  const before = await painted(page)

  const chosen = themeWrite(page, 'plain')
  await themePanel(page).getByRole('button', { name: 'Choose colours' }).click()
  expect((await chosen).status()).toBe(200)
  for (const [role, value] of [['background', '#161a1d'], ['surface', '#212729'], ['text', '#eef1f2']] as const) {
    const written = themeWrite(page, 'plain')
    await themePanel(page).locator(`input[type="color"][data-role="${role}"]`).fill(value)
    expect((await written).status()).toBe(200)
  }
  // Every write repaints after its answer: wait for the last one's colours before reading the page.
  await expect.poll(async () => [await property(page, '--elsa-background'), await property(page, '--elsa-surface'), await property(page, '--elsa-text')]).toEqual(['#161a1d', '#212729', '#eef1f2'])
  const after = await painted(page)

  testInfo.annotations.push({ type: 'measured', description: Object.keys(before).map((key) => `${key}: ${before[key]} -> ${after[key]}`).join('\n') })
  console.log(`no Theme -> a dark palette, as painted:\n${testInfo.annotations.at(-1)!.description}`)
  for (const key of ['bar', 'bar link', 'settings button', 'to-do button', 'panel', "panel's heading"]) expect(after[key], key).toBe(before[key])
  expect(after.Bubble).toBe('rgb(238, 241, 242) on rgb(33, 39, 41), -apple-system')
  expect(before.Bubble).not.toBe(after.Bubble)

  // The Sources' lines under their heading -- each line, its kind and the dot between two -- in the palette's text, as the Bubble's own text is.
  await page.keyboard.press('Escape')
  await expect(panel(page)).toBeHidden()
  const lines = await page.locator('.bubble .sources li').evaluateAll((items) =>
    items.flatMap((item) => [getComputedStyle(item).color, ...(item.previousElementSibling ? [getComputedStyle(item, '::before').color] : [])]),
  )
  const kinds = await page.locator('.bubble .sources .kind').evaluateAll((items) => items.map((item) => getComputedStyle(item).color))
  expect(lines.length).toBeGreaterThan(3)
  expect(kinds).toHaveLength(2)
  expect(new Set([...lines, ...kinds])).toEqual(new Set(['rgb(238, 241, 242)']))
})

test('[#180] a Tree with a dark palette: in the editor the bar and the open panel in the default look, the Bubble in the Tree’s; its public page whole in the Tree’s, the Sources in its text', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/dark/start`)
  // The Tree's logo, in the variant for the default's light bar, not the dark palette's white one (13.1).
  await expect(page.locator('header.editor-chrome img.logo')).toHaveAttribute('src', '/admin/api/trees/dark/theme/example-lab-logo.svg')
  await openPanel(page)
  const look = await painted(page)
  expect(look.bar).toBe('rgb(20, 24, 28) on rgb(251, 250, 246), -apple-system')
  expect(look.panel).toBe('rgb(20, 24, 28) on rgb(255, 255, 255), -apple-system')
  // The draft's heading font is the Tree's, and the panel's heading is not in it.
  expect(look["panel's heading"]).toBe('rgb(20, 24, 28) on rgba(0, 0, 0, 0), -apple-system')
  expect(look.Bubble).toBe('rgb(238, 241, 242) on rgb(33, 39, 41), -apple-system')
  expect(look["Bubble's title"]).toBe("rgb(238, 241, 242) on rgba(0, 0, 0, 0), \"Nova Square\"")
  await shoot180(page, 'editor-dark-panel-open')

  // #177's side-bubble `+` and an Overlay's `deleteSideBubble`, with the confirmation it asks in
  // place, open no panel: they stand in the Tree, on its surface and in its colours (ADR-180 decision 1).
  await page.goto(`${origin}/admin/trees/dark/start/prohibited-practices/social-scoring`)
  const colours = (locator: Locator) => locator.evaluate((element) => `${getComputedStyle(element).color} on ${getComputedStyle(element).backgroundColor}`)
  expect(await colours(page.locator('.options > li.options-add > .side-add'))).toBe('rgb(154, 165, 170) on rgb(33, 39, 41)')
  const remove = page.locator('details.overlay[open] > .sheet-panel .side-delete')
  expect(await colours(remove.locator('.side-delete-button'))).toMatch(/ on rgb\(33, 39, 41\)$/)
  await remove.locator('.side-delete-button').click()
  expect(await colours(remove.locator('.structure-confirm'))).toBe('rgb(238, 241, 242) on rgba(0, 0, 0, 0)')
  expect(await colours(remove.getByRole('button', { name: 'Confirm' }))).toBe('rgb(22, 26, 29) on rgb(255, 138, 122)')
  expect(await page.locator('[data-editor-ui] :is(.side-add, .side-delete)').count()).toBe(0)
  await remove.getByRole('button', { name: 'Cancel' }).click()

  // The public page is the whole Tree's, as it was (24.3).
  const reader = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  await reader.goto(`${origin}/dark/start`)
  await expect(reader.locator('.page-chrome img.logo')).toHaveAttribute('src', '/dark/theme/example-lab-logo-white.svg')
  expect(await reader.locator('.page-chrome').evaluate((bar) => `${getComputedStyle(bar).color} on ${getComputedStyle(bar).backgroundColor}`)).toBe('rgb(238, 241, 242) on rgb(22, 26, 29)')
  await shoot180(reader, 'public-dark')

  // A Node with three Sources: the lines in the Theme's text, each link underlined in it.
  await reader.goto(`${origin}/dark/social-scoring`)
  const links = await reader.locator('.bubble .sources a').evaluateAll((items) => items.map((item) => `${getComputedStyle(item).color} ${getComputedStyle(item).textDecorationLine} ${getComputedStyle(item).textDecorationColor}`))
  expect(links).toEqual(Array(3).fill('rgb(238, 241, 242) underline rgb(238, 241, 242)'))
  expect(await reader.locator('.bubble .sources h2').evaluate((heading) => getComputedStyle(heading).color)).toBe('rgb(154, 165, 170)')
  await reader.evaluate(() => document.fonts.ready)
  await reader.locator('.bubble').screenshot({ path: path.join(SHOTS_180, 'sources-dark.png') })
})

test('[#180] the two font dropdowns and their entries; the first Tree’s hand-made licence line shows as “Another licence…”', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/first/start`)
  await openPanel(page)
  const library = ['[Fonts that come with the app]', 'Open Sans', 'Roboto', 'Atkinson Hyperlegible Next', 'Faustina']
  expect(await entries(fontSelect(page, 'body'))).toEqual([EN.fontDefault, ...library, `[${EN.fontOwnGroup}]`, 'Open Sans', EN.fontUpload])
  expect(await entries(fontSelect(page, 'heading'))).toEqual([EN.fontSameAsBody, ...library, `[${EN.fontOwnGroup}]`, 'Open Sans', EN.fontUpload])
  // Hand-made, so the Tree's own: neither role is the library's Open Sans.
  await expect(fontSelect(page, 'body')).toHaveValue('own')
  await expect(fontSelect(page, 'heading')).toHaveValue('own')

  const licence = fontRole(page, 'body').getByLabel('Licence', { exact: true })
  expect(await entries(licence)).toEqual([
    'SIL Open Font License 1.1',
    'Apache License 2.0',
    'Ubuntu Font Licence v1.0',
    'Bitstream Vera Font License',
    'MIT License',
    'Creative Commons Zero v1.0 Universal',
    EN.licenceOther,
  ])
  await expect(licence).toHaveValue('other')
  await expect(fontRole(page, 'body').getByLabel(EN.licenceOther)).toHaveValue('SIL Open Font License 1.1 (theme/ofl-open-sans.txt)')

  await fontRole(page, 'body').scrollIntoViewIfNeeded()
  await laidOpen(fontSelect(page, 'body'))
  await shoot180(page, 'font-dropdown-open')
  await page.goto(`${origin}/admin/trees/first/start`)
  await openPanel(page)
  await fontRole(page, 'body').getByLabel('Licence', { exact: true }).scrollIntoViewIfNeeded()
  await laidOpen(fontRole(page, 'body').getByLabel('Licence', { exact: true }))
  await shoot180(page, 'licence-dropdown-open')
})

test('[#180] the first Tree: the library’s Open Sans for its headings is refused, nothing sent; an edit that keeps the shared name is saved; a rename to the other role’s name is refused, nothing sent', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/first/start`)
  await openPanel(page)
  const sent: string[] = []
  page.on('request', (request) => {
    if (request.method() !== 'GET') sent.push(`${request.method()} ${new URL(request.url()).pathname}`)
  })
  const heading = fontRole(page, 'heading')

  // The running text keeps its own Open Sans: the library's 400 700 would overlap its faces under one name (37.2).
  await fontSelect(page, 'heading').selectOption('library:open-sans')
  await expect(heading.getByRole('alert')).toHaveText(EN.fontNameTaken)
  await expect(fontSelect(page, 'heading')).toHaveValue('own')
  expect(sent).toEqual([])

  // An edit that keeps the shared name: the headings' licence from the list.
  const kept = themeWrite(page, 'first')
  await heading.getByLabel('Licence', { exact: true }).selectOption({ label: 'SIL Open Font License 1.1' })
  expect((await kept).status()).toBe(200)
  expect(sent).toEqual(['PATCH /admin/api/trees/first'])

  // Away from the shared name, saved; back to it, refused: a new pairing of the name with other files.
  const name = heading.getByLabel('Family name')
  await name.fill('Open Sans Display')
  const renamed = themeWrite(page, 'first')
  await name.blur()
  expect((await renamed).status()).toBe(200)
  sent.length = 0
  await heading.getByLabel('Family name').fill('Open Sans')
  await heading.getByLabel('Family name').blur()
  await expect(heading.getByRole('alert')).toHaveText(EN.fontNameTaken)
  expect(sent).toEqual([])
  const stored = (await (await page.request.get(`${origin}/admin/api/trees/first`, { headers: { Cookie: (await loggedIn(browser, ANNA)).cookie } })).json()) as { manifest: { theme: { fonts: { role: string; family: string; licence: string }[] } } }
  expect(stored.manifest.theme.fonts.map(({ role, family, licence }) => `${role} ${family} ${licence}`)).toEqual([
    'body Open Sans SIL Open Font License 1.1 (theme/ofl-open-sans.txt)',
    'heading Open Sans Display SIL Open Font License 1.1 (https://spdx.org/licenses/OFL-1.1.html)',
  ])
})

test('[#180] a library family: seen at once in the editor, and once published fetched from the Tree’s own address, nothing from another host', async ({ browser }, testInfo) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/library/full`)
  await openPanel(page)
  const fetched = page.waitForRequest((request) => request.url().endsWith('/admin/api/trees/library/theme/faustina-normal-a84c008b.woff2'))
  const written = themeWrite(page, 'library')
  await fontSelect(page, 'heading').selectOption('library:faustina')
  expect((await written).status()).toBe(200)
  await expect(fontSelect(page, 'heading')).toHaveValue('library:faustina')
  // A library family shows its licence, fixed, and nothing else (37.2).
  await expect(fontRole(page, 'heading').locator('.theme-font-licence')).toHaveText('Licence: SIL Open Font License 1.1')
  await expect(fontRole(page, 'heading').getByLabel('Family name')).toHaveCount(0)
  await expect.poll(() => property(page, '--elsa-font-heading')).toContain("'Faustina'")
  await fetched
  expect(await page.evaluate(async () => (await document.fonts.load("700 22px 'Faustina'")).length)).toBeGreaterThan(0)

  await panel(page).getByRole('switch', { name: 'Publish' }).click()
  await expect(panel(page).getByRole('switch', { name: 'Publish' })).toHaveAttribute('aria-checked', 'true')
  const reader = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  const asked: string[] = []
  reader.on('request', (request) => void asked.push(request.url()))
  await reader.goto(`${origin}/library/full`)
  await reader.waitForLoadState('networkidle')
  expect(await reader.evaluate(async () => (await document.fonts.load("700 22px 'Faustina'")).length)).toBeGreaterThan(0)
  testInfo.annotations.push({ type: 'requests', description: asked.join('\n') })
  console.log(`requests while loading /library/full:\n${asked.map((url) => `  ${url}`).join('\n')}`)
  expect(asked.filter((url) => new URL(url).host !== new URL(origin).host)).toEqual([])
  expect(asked).toContain(`${origin}/library/theme/faustina-normal-a84c008b.woff2`)
})

test('[#180] an upload proposes the font’s own name, takes a licence from “Another licence…”, and refuses a name the other role uses for other files', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/library/full`)
  await openPanel(page)
  const body = fontRole(page, 'body')
  await fontSelect(page, 'body').selectOption({ label: EN.fontUpload })
  const uploaded = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/admin/api/trees/library/theme'))
  await body.getByLabel('WOFF2 file').setInputFiles(FONT)
  expect((await uploaded).status()).toBe(201)
  expect(((await (await uploaded).json()) as { family?: string }).family).toBe('Nova Square')
  await expect(body.getByLabel('Family name')).toHaveValue('Nova Square')

  // The headings are the library's Faustina: the same name over this file is refused, nothing sent.
  const sent: string[] = []
  page.on('request', (request) => {
    if (request.method() !== 'GET') sent.push(`${request.method()} ${new URL(request.url()).pathname}`)
  })
  await body.getByLabel('Family name').fill('faustina')
  await body.getByLabel('Licence', { exact: true }).selectOption({ label: EN.licenceOther })
  await body.getByLabel(EN.licenceOther).fill('SIL Open Font License 1.1 (theme/ofl-nova-square.txt)')
  await body.getByRole('button', { name: 'Add the font' }).click()
  await expect(body.getByRole('alert')).toHaveText(EN.fontNameTaken)
  expect(sent).toEqual([])

  await body.getByLabel('Family name').fill('Nova Square')
  const written = themeWrite(page, 'library')
  await body.getByRole('button', { name: 'Add the font' }).click()
  expect((await written).status()).toBe(200)
  await expect(fontSelect(page, 'body')).toHaveValue('own')
  await expect(body.getByLabel('Licence', { exact: true })).toHaveValue('other')
  await expect(body.getByLabel(EN.licenceOther)).toHaveValue('SIL Open Font License 1.1 (theme/ofl-nova-square.txt)')
  // The uploaded font still works: the draft's stylesheet names it and the browser loads it.
  await expect.poll(() => property(page, '--elsa-font-body')).toContain("'Nova Square'")
  expect(await page.evaluate(async () => (await document.fonts.load("16px 'Nova Square'")).length)).toBeGreaterThan(0)
})

for (const [lang, words] of [['en', EN], ['nl', NL]] as const) {
  test(`[#180] every information hint of the Theme part opens and says its sentence, ${lang}`, async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/dark/start${lang === 'nl' ? '?lang=nl' : ''}`)
    await openPanel(page)
    // A secondary text too dark for the dark page, so the contrast warning is out with its hint.
    if (lang === 'en') {
      const written = themeWrite(page, 'dark')
      await themePanel(page).locator('input[type="color"][data-role="text-muted"]').fill('#3a4044')
      expect((await written).status()).toBe(200)
    }
    await expect(themePanel(page).locator('[data-contrast-warning]')).toBeVisible()

    const marks = themePanel(page).locator('.hint-mark')
    await expect(marks).toHaveCount(HINTS.length)
    const said: string[] = []
    for (let i = 0; i < HINTS.length; i += 1) {
      const mark = marks.nth(i)
      await mark.scrollIntoViewIfNeeded()
      await mark.hover()
      const hint = page.locator(`[id="${await mark.getAttribute('aria-describedby')}"]`)
      await expect(hint).toBeVisible()
      await expect(mark).toHaveAccessibleName(words.hint)
      said.push((await hint.textContent()) ?? '')
      if (lang === 'en' && (HINTS[i] === 'colourSurfaceHint' || HINTS[i] === 'fontLicenceHint')) await shoot180(page, `hint-${HINTS[i]}`)
      await page.mouse.move(0, 0)
      await expect(hint).toBeHidden()
    }
    expect(said).toEqual(HINTS.map((key) => words[key]))
  })
}
