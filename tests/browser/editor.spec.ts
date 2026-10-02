/**
 * **[#138]** The Bubble edited in place and the autosave, in a browser (docs/specs/
 * application.md 28, 29, 35.4; ADR-133-bubble-edited-in-place, ADR-133-autosave): the
 * regions where the public text stands and the up arrow; a title typed, saved, and public
 * after publishing through #136's route; a title past 80 with the pill and the indicator
 * saying the validator's own line -- the same rule id as `npm run validate -- --draft`
 * prints for the same draft; a description past two lines stored and marked; the switch
 * editing `nl` without touching `en`; the tags on the rim; the indicator's three states; a
 * refused write kept on screen; two contexts and `changedElsewhere`; the session Sheet after
 * the cookie is cleared; and an empty root Node with its `+ addSource`.
 *
 * Against a data directory of the named Trees and accounts of 35.3 on a server of this
 * file's own. The screenshots the issue asks for go to `docs/screenshots/issue-138/` under
 * `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Page } from '@playwright/test'
import { openTree } from '../../src/tree/loader.ts'
import type { DraftNode } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-138') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 100

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }
const BRAM = { login: 'bram', name: 'Bram', password: 'brams first password' }
const CEES = { login: 'cees', name: 'Cees', password: 'cees first password' }

/** The full Node's title, exactly eighty characters (tests/fixtures/full-node). */
const FULL_TITLE = 'The full Node: a title of exactly eighty characters, the most it may be The ful.'

let origin: string
let dir: string

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, creator: ANNA.login, collaborators: [BRAM.login] }],
    accounts: [ANNA, BRAM, CEES],
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

/** A page logged in as `who`, at 1280 x 640, and the cookie for API calls of its own. */
async function loggedIn(browser: Browser, who: { login: string; password: string }): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  const { status, cookie } = await login(page, origin, who.login, who.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function nodeOf(page: Page, cookie: string, tree: string, id: string): Promise<DraftNode> {
  return ((await (await api(page, cookie, 'GET', `/trees/${tree}/nodes/${id}`)).json()) as { node: DraftNode }).node
}

/** The visible region of one field: a Source's line is in the markup twice, inline and in the Sheet the block collapses to (10.5). */
const field = (page: Page, nodeId: string, keyPath: string) => page.locator(`[data-field="${nodeId} ${keyPath}"]`).filter({ visible: true })
const status = (page: Page) => page.getByRole('status')

/** Types into a field's textarea, replacing what it holds, as a creator would. */
async function retype(page: Page, nodeId: string, keyPath: string, text: string): Promise<void> {
  const area = field(page, nodeId, keyPath).locator('textarea')
  await area.click()
  await area.fill(text)
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

test.describe('the regions in place (28.1, 34.7)', () => {
  test('every text of the full Node is a field where the public text stands; the pictures are read-only; the up arrow works', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/hidden-draft/full/full`)

    await expect(page.locator('h1').locator('textarea')).toHaveValue(FULL_TITLE)
    await expect(field(page, 'full', 'description.en').locator('.prose .term')).toHaveText('Bubble')
    await expect(field(page, 'full', 'sources[0].label.en').locator('textarea')).toHaveValue(/^Source 1/)
    await expect(field(page, 'full', 'sources[2].label.en').locator('textarea')).toHaveValue(/^Source 3/)
    await expect(field(page, 'full', 'options[0].title.en').locator('textarea')).toHaveValue(/^Option one/)
    await expect(field(page, 'full', 'options[7].title.en').locator('textarea')).toHaveValue(/^Option eight/)
    // The Overlay's Interior is edited in place too (28.1): its target's fields are on the page.
    await expect(page.locator('[data-field="opt-one title.en"]')).toHaveCount(1)
    // The main image and the strip: pictures from the admin image route, no field in the Bubble;
    // **[#140]** an Image's texts are fields of the enlarged view (31.3), tested in upload.spec.ts.
    await expect(page.locator('.main-image img').first()).toHaveAttribute('src', /^\/admin\/api\/trees\/hidden-draft\/images\//)
    expect(await page.locator('.carousel-strip .thumbnail').count()).toBe(9)
    await expect(page.locator('.bubble [data-field^="full images"]')).toHaveCount(0)
    // Nothing slides in the editor (34.5).
    await expect(page.locator('[data-slide]')).toHaveCount(0)

    await page.locator('.up-arrow').click()
    await expect(page).toHaveURL(`${origin}/admin/trees/hidden-draft/full`)
    await expect(page.locator('.up-arrow')).toHaveCount(0)
  })

  test('a Sheet inside an Overlay -- + addSource, a Source\u2019s ... -- opens without closing the Overlay around it (28.1)', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    const overlay = page.locator('details.overlay').first()
    await overlay.locator(':scope > .sheet-open .option-image').click()
    const panel = overlay.locator(':scope > .sheet-panel')
    await expect(panel).toBeVisible()
    // The Overlay's target has room for a Source: its `+ addSource` is a Sheet of its own group.
    const add = panel.locator('.source-sheet--add').filter({ visible: true }).first()
    await add.locator(':scope > .sheet-open').click()
    await expect(add.locator('.editor-url')).toBeFocused()
    await expect(panel).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(add.locator(':scope > .sheet-panel')).toBeHidden()
    await expect(panel).toBeVisible()
  })

  test('a Terminal shows its outcome as a select drawn as the badge (28.1)', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/hidden-draft/full/applies`)
    // The badge is placed absolutely on the rim; its region has no box of its own to be visible by.
    const select = page.locator('[data-field="applies terminal.outcome"] select')

    await expect(select).toHaveValue('applicable')
    await expect(select).toHaveClass(/outcome--applicable/)
    await select.selectOption('refer')
    await expect(status(page)).toContainText('Saved')
    expect((await nodeOf(page, cookie, 'hidden-draft', 'applies')).outcome).toBe('refer')
    await select.selectOption('applicable')
    await expect(status(page)).toContainText('Saved')
  })

  test('/admin/trees/<tree> is a 307 to the root Node\u2019s editor (24.1)', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    const response = await page.request.get(`${origin}/admin/trees/hidden-draft`, { maxRedirects: 0, headers: { Cookie: cookie } })

    expect(response.status()).toBe(307)
    expect(response.headers()['location']).toBe('/admin/trees/hidden-draft/full')
  })

  test('an account with no role gets the 403 page, not the login page and not a 404 (24.2)', async ({ browser }) => {
    const { page } = await loggedIn(browser, CEES)
    const response = await page.goto(`${origin}/admin/trees/hidden-draft/full`)

    expect(response?.status()).toBe(403)
    await expect(page.getByRole('heading', { name: 'Not yours to open' })).toBeVisible()
  })
})

test.describe('autosave (29)', () => {
  test('typing a title saves it, the indicator says so, and the public page shows it after publishing through #136\u2019s route', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)

    await retype(page, 'full', 'title.en', 'A title typed in the editor')
    await expect(status(page)).toContainText(/^Saved \d/)
    await shoot(page, 'saved-indicator')
    expect((await nodeOf(page, cookie, 'hidden-draft', 'full')).title.en).toBe('A title typed in the editor')
    await page.reload()
    await expect(page.locator('h1').locator('textarea')).toHaveValue('A title typed in the editor')

    const published = await api(page, cookie, 'PUT', '/trees/hidden-draft/published', { published: true })
    expect(published.status()).toBe(200)
    await page.goto(`${origin}/hidden-draft/full`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A title typed in the editor')
    await expect(page.locator('[data-field]')).toHaveCount(0)
    await shoot(page, 'public-after-publish')

    // Published now: a later save that keeps the draft valid is public at once (19.4), and the
    // indicator adds nothing; put the title back for the tests after this one.
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await retype(page, 'full', 'title.en', FULL_TITLE)
    await expect(status(page)).toContainText(/^Saved \d/)
    await expect(status(page)).not.toContainText('behind')
    expect((await api(page, cookie, 'PUT', '/trees/hidden-draft/published', { published: false })).status()).toBe(200)
  })

  // **[#172]** Typing stops at the limit (28.4, amended 2026-10-02): this test typed 93
  // characters and found them stored. A title over 80 now comes from another route -- here the
  // API, as a hand-made file or a write before #172 would leave it -- and is shown whole and marked.
  test('a title stored past 80 counted characters: shown whole, the pill and the outline danger, the indicator says the validator\u2019s own line, and typing cannot lengthen it', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    const over = `${FULL_TITLE} and thirteen`
    expect([...over].length).toBe(93)
    expect((await api(page, cookie, 'PATCH', '/trees/hidden-draft/nodes/full', { path: 'title.en', value: over })).status()).toBe(200)
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)

    const area = field(page, 'full', 'title.en').locator('textarea')
    await expect(area).toHaveValue(over)
    await area.click()
    const pill = page.locator('.editor-pill')
    await expect(pill).toHaveText('93 / 80')
    await expect(pill).toHaveClass(/editor-pill--over/)
    await expect(field(page, 'full', 'title.en')).toHaveClass(/editor-field--over/)
    const line = status(page).locator('.editor-violation')
    await expect(line).toHaveText('V-LENGTH title.en: 93 characters; at most 80')
    await page.keyboard.press('End')
    await page.keyboard.type('!')
    await expect(area).toHaveValue(over)
    await shoot(page, 'field-at-limit')

    // Stored (28.4): the draft holds the text, and the validator's own line for the same
    // draft says the same rule id and the same words (DONE WHEN).
    expect((await nodeOf(page, cookie, 'hidden-draft', 'full')).title.en).toBe(over)
    const draft = await openTree(path.join(dir, 'trees', 'hidden-draft'), { draft: true })
    const validator = draft.advisory.find((v) => v.file === 'full' && v.keyPath === 'title.en')
    expect(validator).toMatchObject({ rule: 'V-LENGTH', message: '93 characters; at most 80' })
    expect(await line.getAttribute('data-rule')).toBe(validator!.rule)
    expect(await line.textContent()).toBe(`${validator!.rule} ${validator!.keyPath}: ${validator!.message}`)

    await retype(page, 'full', 'title.en', FULL_TITLE)
    await expect(status(page)).toContainText(/^Saved \d/)
    await expect(status(page)).not.toContainText('V-LENGTH')
  })

  // **[#172]** As the title's above: a description past two lines now comes from another route.
  test('a description stored past 2 estimated lines is shown whole and marked at the field with V-LINES, the same rule id as the validator\u2019s', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    const original = (await nodeOf(page, cookie, 'hidden-draft', 'full')).description.en!
    const three = 'One paragraph.\n\n- and a list item under it'
    expect((await api(page, cookie, 'PATCH', '/trees/hidden-draft/nodes/full', { path: 'description.en', value: three })).status()).toBe(200)
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)

    await field(page, 'full', 'description.en').click()
    const area = field(page, 'full', 'description.en').locator('textarea')
    await expect(area).toHaveValue(three)
    await expect(page.locator('.editor-pill')).toHaveText(`${three.length} / 1503 / 2`)
    await expect(field(page, 'full', 'description.en')).toHaveClass(/editor-field--over/)
    await expect(status(page).locator('.editor-violation')).toHaveText('V-LINES description.en: 3 estimated lines; at most 2')
    expect((await nodeOf(page, cookie, 'hidden-draft', 'full')).description.en).toBe(three)
    const draft = await openTree(path.join(dir, 'trees', 'hidden-draft'), { draft: true })
    expect(draft.advisory.find((v) => v.file === 'full' && v.keyPath === 'description.en')).toMatchObject({ rule: 'V-LINES' })

    // **[#172]** Over by its lines, it does not grow by its characters either: keys at its end do nothing (28.4, amended).
    await area.press('Control+End')
    await page.keyboard.type(' and more words', { delay: 5 })
    await expect(area).toHaveValue(three)
    await expect(page.locator('.editor-pill')).toHaveText(`${three.length} / 1503 / 2`)

    // Blurred, the rendered form: a list of one item.
    await page.keyboard.press('Tab')
    await expect(field(page, 'full', 'description.en').locator('.prose li')).toHaveText('and a list item under it')
    await field(page, 'full', 'description.en').click()
    await field(page, 'full', 'description.en').locator('textarea').fill(original)
    await expect(status(page)).toContainText(/^Saved \d/)
  })

  test('a refused write (422) keeps the value on screen: the region outlined danger, the indicator not saved with the rule, and nothing reverted', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await page.locator('.source-sheet').first().locator('.sheet-open').click()
    const url = field(page, 'full', 'sources[0].url').locator('textarea')
    await expect(url).toHaveValue('https://example.org/source-1')

    await url.fill('not a url')
    await expect(status(page)).toContainText('Not saved')
    await expect(status(page).locator('.editor-violation')).toContainText('schema')
    await expect(field(page, 'full', 'sources[0].url')).toHaveClass(/editor-field--refused/)
    await expect(url).toHaveValue('not a url')
    await shoot(page, 'refused-write')
    expect((await nodeOf(page, cookie, 'hidden-draft', 'full')).sources[0]!.url).toBe('https://example.org/source-1')

    // Fixed, it saves; the refusal goes with the change.
    await url.fill('https://example.org/source-1-fixed')
    await expect(status(page)).toContainText(/^Saved \d/)
    expect((await nodeOf(page, cookie, 'hidden-draft', 'full')).sources[0]!.url).toBe('https://example.org/source-1-fixed')
    await url.fill('https://example.org/source-1')
    await expect(status(page)).toContainText(/^Saved \d/)
  })

  test('the language switch edits nl without touching en (28.2)', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    const before = await nodeOf(page, cookie, 'hidden-draft', 'full')

    await page.getByRole('link', { name: 'Nederlands' }).click()
    await expect(page).toHaveURL(`${origin}/admin/trees/hidden-draft/full?lang=nl`)
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
    await retype(page, 'full', 'title.nl', 'Een Nederlandse titel')
    await expect(status(page)).toContainText(/^Opgeslagen \d/)

    const after = await nodeOf(page, cookie, 'hidden-draft', 'full')
    expect(after.title).toEqual({ en: before.title.en, nl: 'Een Nederlandse titel' })
    expect(after.description).toEqual(before.description)
    await retype(page, 'full', 'title.nl', before.title.nl!)
    await expect(status(page)).toContainText(/^Opgeslagen \d/)
  })

  test('the indicator: saving while a write is in flight, saved with the time, not saved with retrying and a retry button after a failure (29.3, 29.5)', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    let hold: (() => void) | null = null
    await page.route('**/admin/api/trees/hidden-draft/nodes/full', async (route) => {
      await new Promise<void>((release) => (hold = release))
      await route.continue()
    })
    const sent = page.waitForRequest('**/admin/api/trees/hidden-draft/nodes/full')
    await retype(page, 'full', 'sources[1].label.en', 'Source 2, edited')
    await sent
    await expect(status(page)).toHaveText('Saving')
    await expect(status(page)).toHaveAttribute('data-saving', 'true')
    await expect.poll(() => hold !== null).toBe(true)
    hold!()
    await expect(status(page)).toHaveText(/^Saved \d{1,2}:\d\d:\d\d/)
    await page.unroute('**/admin/api/trees/hidden-draft/nodes/full')

    await page.route('**/admin/api/trees/hidden-draft/nodes/full', (route) => route.abort())
    await retype(page, 'full', 'sources[1].label.en', 'Source 2, edited again')
    await expect(status(page)).toContainText('Not saved · retrying')
    await expect(status(page)).toHaveClass(/editor-status--danger/)
    await page.unroute('**/admin/api/trees/hidden-draft/nodes/full')
    await status(page).getByRole('button', { name: 'Retry now' }).click()
    await expect(status(page)).toHaveText(/^Saved \d/)
  })

  test('two contexts: a collaborator\u2019s write arrives with the next response, repaints the field not being edited, and the indicator says changedElsewhere (29.7)', async ({ browser }) => {
    const anna = await loggedIn(browser, ANNA)
    const bram = await loggedIn(browser, BRAM)
    await anna.page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await bram.page.goto(`${origin}/admin/trees/hidden-draft/full`)

    await retype(bram.page, 'full', 'sources[2].label.en', 'Source 3, by Bram')
    await expect(status(bram.page)).toContainText(/^Saved \d/)
    await expect(field(anna.page, 'full', 'sources[2].label.en').locator('textarea')).toHaveValue(/^Source 3 \(literature\)/)

    await retype(anna.page, 'full', 'sources[0].label.en', 'Source 1, by Anna')
    await expect(status(anna.page)).toContainText(/^Saved \d/)
    await expect(field(anna.page, 'full', 'sources[2].label.en').locator('textarea')).toHaveValue('Source 3, by Bram')
    await expect(field(anna.page, 'full', 'sources[2].label.en')).toHaveClass(/editor-field--changed/)
    await expect(status(anna.page)).toContainText('changed by a collaborator')
    // Bram's own field is not marked: the value was his.
    await expect(field(anna.page, 'full', 'sources[0].label.en')).not.toHaveClass(/editor-field--changed/)
  })

  test('a session that expires opens the login form in a Sheet; signing in resumes the queue with the same write (29.6)', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await page.context().clearCookies()

    await retype(page, 'full', 'options[0].title.en', 'Option one, after lunch')
    const sheet = page.getByRole('dialog', { name: /session has expired/ })
    await expect(sheet).toBeVisible()
    await expect(sheet.locator('.sheet-close')).toHaveCount(0)
    await expect(sheet.getByRole('link', { name: 'All decision trees' })).toHaveAttribute('href', '/admin')
    await expect(field(page, 'full', 'options[0].title.en').locator('textarea')).toHaveValue('Option one, after lunch')

    await sheet.getByLabel('Name').fill(ANNA.login)
    await sheet.getByLabel('Password').fill(ANNA.password)
    await sheet.getByRole('button', { name: 'Sign in' }).click()
    await expect(sheet).toBeHidden()
    await expect(status(page)).toContainText(/^Saved \d/)
    expect((await nodeOf(page, cookie, 'hidden-draft', 'full')).options[0]!.title.en).toBe('Option one, after lunch')
  })
})

test.describe('an empty root Node, and the rim\u2019s tags (28.2, 28.3)', () => {
  test('the editor on a new Tree\u2019s root: every region empty with the placeholder, a tag for the language without a text, + addSource', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    const created = await api(page, cookie, 'POST', '/trees', { id: 'fresh', languages: ['en', 'nl'], title: { en: 'Fresh' } })
    expect(created.status()).toBe(201)
    await page.goto(`${origin}/admin/trees/fresh/start`)

    const title = field(page, 'start', 'title.en').locator('textarea')
    await expect(title).toHaveValue('')
    // **[#172]** Each names what belongs in it (28.2, amended): before, both said 'Text missing in this language'.
    await expect(title).toHaveAttribute('placeholder', 'Title')
    await expect(field(page, 'start', 'description.en')).toContainText('Text')
    // The one on this page: the neighbour frames the Slider pre-renders hold their own (11).
    await expect(page.locator('.source-sheet--add > .sheet-open').filter({ visible: true })).toHaveText('+ Add a source')
    await expect(page.locator('[data-field]')).toHaveCount(2)
    await shoot(page, 'editor-empty-root')

    await title.click()
    const tag = page.locator('.editor-tag')
    await expect(tag).toHaveText('nl')
    await expect(tag).toHaveAttribute('href', '/admin/trees/fresh/start?lang=nl')
    await title.fill('The first question')
    await expect(status(page)).toContainText(/^Saved \d/)
    // Written in `en` only: the tag stays until `nl` has a text.
    await expect(tag).toHaveText('nl')
    await page.locator('.editor-tag').click()
    await expect(page).toHaveURL(`${origin}/admin/trees/fresh/start?lang=nl`)
    await retype(page, 'start', 'title.nl', 'De eerste vraag')
    await expect(status(page)).toContainText(/^Opgeslagen \d/)
    await expect(page.locator('.editor-tag')).toHaveCount(0)
    expect((await nodeOf(page, cookie, 'fresh', 'start')).title).toEqual({ en: 'The first question', nl: 'De eerste vraag' })
  })

  test('the full Node, written in both languages, shows no tag; + addSource takes a URL first, adds the Source and focuses its label; the Sheet removes it', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await field(page, 'full', 'title.en').locator('textarea').click()
    await expect(page.locator('.editor-pill')).toBeVisible()
    await expect(page.locator('.editor-tag')).toHaveCount(0)
    // Three Sources already: no add control (5.7).
    await expect(page.locator('.source-sheet--add').filter({ visible: true })).toHaveCount(0)

    // A Tree of this test's own: a failed test restarts the worker, and its server with it.
    expect((await api(page, cookie, 'POST', '/trees', { id: 'fresh-sources', languages: ['en'], title: { en: 'Sources' } })).status()).toBe(201)
    await page.goto(`${origin}/admin/trees/fresh-sources/start`)
    // The control opens a Sheet with the URL focused; nothing is sent, and the button stays
    // disabled, until a URL of the schema's grammar is typed (28.1). No placeholder address.
    await page.locator('.source-sheet--add > .sheet-open').filter({ visible: true }).click()
    // The visible form: below the guarantee the Sources block is a Sheet holding a second copy.
    const form = page.locator('.source-editor--add').filter({ visible: true })
    const url = form.locator('.editor-url')
    await expect(url).toBeFocused()
    const add = form.locator('button[type="submit"]')
    await expect(add).toBeDisabled()
    await url.fill('not a url')
    await expect(url).toHaveAttribute('aria-invalid', 'true')
    await expect(add).toBeDisabled()
    expect((await nodeOf(page, cookie, 'fresh-sources', 'start')).sources).toHaveLength(0)
    await url.fill('https://eur-lex.europa.eu/eli/reg/2024/1689/oj')
    await expect(add).toBeEnabled()
    await shoot(page, 'add-source-sheet')
    await url.press('Enter')
    const label = field(page, 'start', 'sources[0].label.en').locator('textarea')
    await expect(label).toBeFocused()
    await expect(page.locator('.source-editor--add').filter({ visible: true })).toHaveCount(0)
    const [source] = (await nodeOf(page, cookie, 'fresh-sources', 'start')).sources
    expect(source).toMatchObject({ kind: 'legal', label: {}, url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' })
    await label.fill('Article 1')
    await expect(status(page)).toContainText(/^Saved \d/)
    await page.locator('.source-sheet').first().locator('.sheet-open').click()
    await expect(field(page, 'start', 'sources[0].kind').locator('select')).toHaveValue('legal')
    await page.getByRole('button', { name: 'Remove this source' }).click()
    await expect(field(page, 'start', 'sources[0].label.en')).toHaveCount(0)
    expect((await nodeOf(page, cookie, 'fresh-sources', 'start')).sources).toHaveLength(0)
  })
})
