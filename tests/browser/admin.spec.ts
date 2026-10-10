/**
 * **[#143]** The editor round walked end to end in the running app (docs/specs/application.md
 * 35.4, core document 3.4): the owner's flow of #131, by clicking, as the four people it
 * names -- the administrator, a creator, a collaborator and a visitor -- on one deployment
 * that starts from an empty data directory with only the administrator's credential set.
 *
 * Every other admin spec builds its data directory with the accounts and Trees already in
 * it (35.1) and tests one build issue's part; this one builds nothing but the server, so
 * every account, Tree, Node, picture, explainer and permission on it was made through the
 * pages. One story, in order: each `test` is one step of the issue's list, and a step that
 * fails leaves the ones after it unrun rather than walking on a deployment it did not make.
 *
 * At every step it takes a screenshot at 1280 x 640 and holds the page to the no-scroll rule
 * as `admin-no-scroll.spec.ts` measures it (10.6 with #133's `[data-scroll-box]`); the rows
 * go into `measurements.md` beside the screenshots. The cookie the login sets is read off the
 * response and its attributes recorded against 20.4; the sitemap's `<url>` count is
 * reconciled against the published `tree.json`'s Nodes (16.2: one per Node per language,
 * after the overview's two, 23.4). Under `ELSA_SHOTS=1` all of it goes to
 * `docs/screenshots/editor/`, the results folder otherwise (35.7).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page, type Response } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD, addNextStep, typeInPlus } from './admin.ts'
import { arrived } from './arrived.ts'
import { BASE_PORT, dataDir, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'editor') : path.join(RESULTS, 'shots', 'editor')
const PORT = BASE_PORT + 110

const CREATOR = { email: 'carla@example.org', name: 'Carla', password: 'carlas first password' }
const COLLABORATOR = { email: 'dirk@example.org', name: 'Dirk', password: 'dirks first password' }

const COVERED = path.join(repo, 'trees', 'ai-act-example', 'images', 'covered.png')

let origin: string
/** The Tree's id, as the new-Tree form proposed it from the English title (27.1). */
let tree: string
/** The Nodes the creator made: the Answers' targets and the aside. */
let yesId: string
let noId: string
let asideId: string
/** The measurement rows of every step, written out after the last. */
const rows: string[] = []
/** The `Set-Cookie` of every login, as the browser received it. */
const cookies: string[] = []

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  // `dataDir([])` is an empty `trees/` and nothing else: no accounts, no sessions, no Tree.
  origin = await serveStore(await dataDir([]), PORT)
})

test.afterAll(async () => {
  await stopServers()
  const table = [
    '| Step | Page | document height / window | document width / window | elements larger than themselves |',
    '|---|---|---|---|---|',
    ...rows,
  ]
  await writeFile(path.join(SHOTS, 'measurements.md'), `${table.join('\n')}\n\nSet-Cookie of each login:\n\n${cookies.map((c) => `- \`${c}\``).join('\n')}\n`)
})

/** A fresh browser context at the guarantee, 1280 x 640 (10.4), and a page in it. */
async function person(browser: Browser): Promise<Page> {
  return (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
}

interface Measured {
  doc: { sh: number; sw: number }
  inner: { h: number; w: number }
  overflowing: string[]
}

/**
 * The no-scroll rule's exact test (10.6) as `admin-no-scroll.spec.ts` runs it, copied rather
 * than imported because importing a spec file runs its tests there.
 */
async function measure(page: Page): Promise<Measured> {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const name = (el: Element): string => `${el.tagName.toLowerCase()}${[...el.classList].map((c) => `.${c}`).join('')}`
    const overflowing: string[] = []
    for (const el of document.querySelectorAll('*')) {
      if (el.matches('[data-scroll-box], [data-clamp], [data-carousel-strip]')) continue
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
        overflowing.push(`${name(el)} holds ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`)
      }
    }
    const d = document.documentElement
    const b = document.body
    return {
      doc: { sh: Math.max(d.scrollHeight, b.scrollHeight), sw: Math.max(d.scrollWidth, b.scrollWidth) },
      inner: { h: window.innerHeight, w: window.innerWidth },
      overflowing,
    }
  })
}

/**
 * One step's record: the screenshot `name` and the page measured against 10.6, the row kept
 * for `measurements.md` whether it passes or not, so a failing step still leaves its numbers.
 */
async function step(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
  const m = await measure(page)
  const where = new URL(page.url())
  rows.push(`| ${name} | \`${where.pathname}${where.search}\` | ${m.doc.sh}/${m.inner.h} | ${m.doc.sw}/${m.inner.w} | ${m.overflowing.join('; ') || 'none'} |`)
  expect.soft(m.doc.sh, `${name}: taller than the window`).toBeLessThanOrEqual(m.inner.h + 1)
  expect.soft(m.doc.sw, `${name}: wider than the window`).toBeLessThanOrEqual(m.inner.w + 1)
  expect.soft(m.overflowing, `${name}: elements whose content is larger than themselves`).toEqual([])
}

/** Signs in on the login page by its form (25.1), keeping the cookie the response set. */
async function signIn(page: Page, email: string, password: string): Promise<void> {
  const answered = page.waitForResponse((response) => response.url() === `${origin}/admin/api/login`)
  await page.getByLabel(/^(E-mail address|E-mailadres)$/).fill(email)
  await page.getByLabel(/^(Password|Wachtwoord)$/).fill(password)
  await page.getByRole('button', { name: /^(Sign in|Inloggen)$/ }).click()
  const response = await answered
  expect(response.status()).toBe(204)
  // The one cookie of 20.4, with every attribute it names and no `Domain` -- and **[#162]** no
  // `Secure`, since this server is plain HTTP; the token is replaced before the value is
  // recorded, since the record is committed.
  const setCookie = (await response.allHeaders())['set-cookie'] ?? ''
  expect(setCookie).toMatch(/^elsa-admin-session=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Strict; Path=\/admin; Max-Age=\d+$/)
  cookies.push(setCookie.replace(/^elsa-admin-session=[^;]+/, 'elsa-admin-session=<token>'))
}

/** Logs out with the chrome bar's button (25.2) and lands on the login page. */
async function signOut(page: Page): Promise<void> {
  const answered = page.waitForResponse((response) => response.url() === `${origin}/admin/api/logout`)
  await page.getByRole('button', { name: /^(Log out|Uitloggen)$/ }).click()
  expect((await answered).status()).toBe(204)
  await expect(page.getByRole('heading', { name: /^(Sign in|Inloggen)$/ })).toBeVisible()
}

const status = (page: Page) => page.getByRole('status')
/** The visible region of one field (28.1). */
const field = (page: Page, nodeId: string, keyPath: string) => page.locator(`[data-field="${nodeId} ${keyPath}"]`).filter({ visible: true })

/** The editor's write of a field, answered: registered before the blur that sends it (29.1). */
function written(page: Page): Promise<Response> {
  return page.waitForResponse((response) => response.url().startsWith(`${origin}/admin/api/trees/`) && response.request().method() === 'PATCH')
}

/**
 * Types `text` into the field `keyPath` of `nodeId` and leaves it, which writes it at once
 * (29.1); waits for the store's answer and the indicator's `saved`. A description is shown
 * rendered until it is clicked (28.5), so the click comes first for every field.
 */
async function write(page: Page, nodeId: string, keyPath: string, text: string): Promise<void> {
  const region = field(page, nodeId, keyPath)
  const rendered = region.locator('.editor-rendered')
  if (await rendered.count()) await rendered.click({ position: { x: 2, y: 2 } })
  const area = region.locator('textarea')
  await area.click()
  await area.fill(text)
  const answer = written(page)
  await page.keyboard.press('Tab')
  expect((await answer).status(), `${nodeId} ${keyPath}`).toBe(200)
  await expect(status(page)).toContainText(/^(Saved|Opgeslagen) /)
}

/** Selects `words` in the description's source by the keyboard, as `marking.spec.ts` does (32.1). */
async function selectInDescription(page: Page, nodeId: string, lang: string, words: string): Promise<void> {
  const description = field(page, nodeId, `description.${lang}`)
  await description.locator('.editor-rendered').click({ position: { x: 2, y: 2 } })
  const area = description.locator('textarea')
  await expect(area).toBeFocused()
  const start = (await area.inputValue()).indexOf(words)
  expect(start).toBeGreaterThanOrEqual(0)
  await page.keyboard.press('Control+Home')
  for (let i = 0; i < start; i += 1) await page.keyboard.press('ArrowRight')
  for (let i = 0; i < words.length; i += 1) await page.keyboard.press('Shift+ArrowRight')
}

/** The id at the end of the page's address, where a creation just navigated (30.2, 30.4). */
async function landedOn(page: Page, from: string): Promise<string> {
  await page.waitForURL((url) => url.pathname.startsWith(`${from}/`) && url.pathname.split('/').length === from.split('/').length + 1)
  const id = new URL(page.url()).pathname.split('/').pop() ?? ''
  expect(id).toMatch(/^n-[a-z2-7]{6}$/)
  return id
}

/** `treeEndsHere` with the ending's `words`, typed into its one field (30.3; **[#179]** 36.3), **[#233]** the `+` Sheet's switch on (42.7). */
async function endHere(page: Page, words: string): Promise<void> {
  const form = await typeInPlus(page, words, true)
  await form.getByRole('button', { name: /^(Confirm|Bevestigen)$/ }).click()
  await expect(page.locator(`[data-field="${new URL(page.url()).pathname.split('/').pop()} terminal.label.en"] textarea`)).toHaveValue(words)
}

const panelButton = (page: Page) => page.locator('.panel-sheet > .sheet-open')
const panel = (page: Page) => page.locator('.panel-sheet > .sheet-panel')
const publishSwitch = (page: Page) => panel(page).getByRole('switch', { name: /^(Publish|Publiceren)$/ })
/** **[#176]** The to-do list is a bubble of its own at the top right, which a refused publish points at (33.3). */
const todoBubble = (page: Page) => page.locator('.todo-sheet > .sheet-panel')

/** Opens the top panel (33.1) once it has re-read the accounts it offers. */
async function openPanel(page: Page): Promise<void> {
  const reread = page.waitForResponse((response) => response.url().endsWith('/admin/api/accounts'))
  await panelButton(page).click()
  await expect(panel(page)).toBeVisible()
  await reread
}

const editor = (...nodeIds: string[]) => `${origin}/admin/trees/${tree}/${nodeIds.join('/')}`

test('1. the administrator logs in, creates a creator and a collaborator, and logs out', async ({ browser }) => {
  const page = await person(browser)
  await page.goto(`${origin}/admin`)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await step(page, '01-admin-login-page')
  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD)
  await expect(page.locator('.tile--new')).toBeVisible()
  await step(page, '02-admin-overview-empty')

  await page.locator('a.admin-link', { hasText: 'Accounts' }).click()
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  for (const account of [CREATOR, COLLABORATOR]) {
    const sheet = page.locator('details.account-sheet').first()
    await sheet.locator('summary', { hasText: 'New account' }).click()
    await sheet.getByLabel('Display name').fill(account.name)
    await sheet.getByLabel('E-mail address', { exact: true }).fill(account.email)
    await sheet.getByLabel('Password', { exact: true }).fill(account.password)
    if (account === CREATOR) await step(page, '03-admin-new-account-sheet')
    await sheet.getByRole('button', { name: 'Create' }).click()
    const row = page.locator(`.admin-row[data-email="${account.email}"]`)
    await expect(row).toContainText(account.name)
    await expect(row).toContainText('Active')
  }
  await step(page, '04-admin-accounts-two-created')
  await signOut(page)
  await step(page, '05-admin-logged-out')
  await page.context().close()
})

test('2. the creator makes a Tree in English and Dutch, fills it, invites the collaborator and publishes', async ({ browser }) => {
  test.setTimeout(300_000)
  const page = await person(browser)
  await page.goto(`${origin}/admin`)
  await signIn(page, CREATOR.email, CREATOR.password)
  const plus = page.locator('.tiles > li').first().locator('a.tile--new')
  await expect(plus).toBeVisible()
  await step(page, '06-creator-overview-plus-tile')

  // The + tile and the form (26.4, 27): two languages, a title in each; **[#168]** the address is the default title's, never asked.
  await plus.click()
  await expect(page).toHaveURL(`${origin}/admin/new`)
  await page.locator('.new-tree-add').getByRole('button', { name: 'nl', exact: true }).click()
  await page.getByLabel('Title (en)').fill('Does the walk reach the end?')
  await page.getByLabel('Title (nl)').fill('Bereikt de wandeling het einde?')
  tree = 'does-the-walk-reach-the-end'
  await step(page, '07-creator-new-tree-form')
  await page.getByRole('button', { name: 'Create' }).click()
  await expect(page).toHaveURL(editor('start'))
  await step(page, '08-creator-editor-empty-root')

  // The root's title and description in English (28.1, 28.5).
  await write(page, 'start', 'title.en', 'Is the system placed on the market by a provider?')
  await write(page, 'start', 'description.en', 'A provider develops an AI system and puts it on the market under its own name.')
  await step(page, '09-creator-root-english')

  // The main image, with its credit (31.1, 31.2).
  const slot = page.locator('.bubble .editor-picker--slot')
  await slot.locator('input[type="file"]').setInputFiles({ name: 'covered.png', mimeType: 'image/png', buffer: await readFile(COVERED) })
  const attach = page.locator('.editor-attach-panel')
  await expect(attach).toBeVisible()
  await attach.getByLabel('Credit').fill('ELSA project, placeholder picture')
  await attach.getByLabel('Description').fill('A crate of produce on a conveyor belt')
  await step(page, '10-creator-attach-sheet-with-credit')
  await attach.getByRole('button', { name: 'Attach' }).click()
  await expect(attach).toHaveCount(0)
  await expect(status(page)).toContainText(/^Saved \d/)
  await expect(page.locator('.bubble .main-image img')).toHaveAttribute('src', new RegExp(`^/admin/api/trees/${tree}/images/covered-[0-9a-f]{8}\\.png$`))
  await step(page, '11-creator-main-image-attached')

  // An explainer on "provider" (32.1, 32.2), its Dutch term and text in the same Sheet.
  await selectInDescription(page, 'start', 'en', 'provider')
  await page.locator('.editor-mark').click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading')).toHaveText('provider')
  // The heading shows the id before the store has answered; the focus in the text field is
  // the sign the explainer exists (32.1).
  await expect(sheet.locator('[data-field="start explainers[0].text.en"] textarea')).toBeFocused()
  await page.keyboard.type('The one who develops the system and places it on the market.')
  const dutch = sheet.locator('details[data-lang="nl"]')
  await dutch.locator('summary').click()
  await dutch.locator('[data-field="start explainers[0].term.nl"] textarea').fill('aanbieder')
  await dutch.locator('[data-field="start explainers[0].text.nl"] textarea').fill('Wie het systeem ontwikkelt en op de markt brengt.')
  await step(page, '12-creator-explainer-sheet')
  await sheet.getByRole('button', { name: 'Close' }).click()
  await expect(status(page)).toContainText(/^Saved /)
  await expect(field(page, 'start', 'description.en').locator('.term')).toHaveText('provider')
  await step(page, '13-creator-explainer-marked')

  // Yes: a new Node, landed on, that ends the Tree with its words (30.2, 30.3), **[#233]** made through the `+` (42.7).
  yesId = await addNextStep(page, 'Yes')
  expect(yesId).toMatch(/^n-[a-z2-7]{6}$/)
  await expect(page.locator('h1 textarea')).toHaveValue('')
  await step(page, '14-creator-landed-on-yes-node')
  await write(page, yesId, 'title.en', 'The AI Act applies to you')
  await write(page, yesId, 'description.en', 'As the provider you carry the obligations of the Act.')
  await endHere(page, 'Applies')
  await step(page, '15-creator-yes-node-ends-here')

  // No, from the root: the same, with other words.
  await page.locator('.up-arrow').click()
  await expect(page).toHaveURL(editor('start'))
  noId = await addNextStep(page, 'No')
  expect(noId).toMatch(/^n-[a-z2-7]{6}$/)
  await write(page, noId, 'title.en', 'The AI Act does not apply to you')
  await write(page, noId, 'description.en', 'Without placing a system on the market you are not its provider.')
  await endHere(page, 'Does not apply')
  await step(page, '16-creator-no-node-ends-here')

  // The side bubble (30.4), edited in its Overlay (30.5). **[#177]** One click on the fan's +
  // opens it, empty: its title is typed in it, and the button's follows (30.4, 30.5, amended).
  await page.locator('.up-arrow').click()
  await expect(page).toHaveURL(editor('start'))
  await page.locator('.options > li.options-add > .side-add').click()
  asideId = await landedOn(page, `/admin/trees/${tree}/start`)
  const overlay = page.locator(`.options > li:has(.overlay-interior[data-node="${asideId}"]) > details.overlay`)
  await expect(overlay).toHaveAttribute('open', '')
  // Drawn after hydration: the fields listen from here on.
  await expect(overlay.locator(':scope > .sheet-backdrop')).toBeAttached()
  await expect(field(page, asideId, 'title.en').locator('textarea')).toHaveValue('')
  await write(page, asideId, 'title.en', 'What is placing on the market?')
  await expect(field(page, 'start', 'options[0].title.en').locator('textarea')).toHaveValue('What is placing on the market?')
  await write(page, asideId, 'description.en', 'Making a system available on the EU market for the first time.')
  await step(page, '18-creator-side-bubble-edited-in-overlay')

  // Dutch: every text again, one language at a time (28.2) -- all but one, on purpose.
  await page.goto(editor('start'))
  await page.getByRole('link', { name: 'Nederlands' }).click()
  await expect(page).toHaveURL(`${editor('start')}?lang=nl`)
  await write(page, 'start', 'title.nl', 'Brengt een aanbieder het systeem op de markt?')
  await write(page, 'start', 'description.nl', 'Een [aanbieder](#provider) ontwikkelt een AI-systeem en brengt het onder eigen naam op de markt.')
  await write(page, 'start', 'options[0].title.nl', 'Wat is in de handel brengen?')
  await page.locator('.bubble .main-image').click()
  await write(page, 'start', 'images[0].description.nl', 'Een krat groente op een lopende band')
  await page.keyboard.press('Escape')
  await step(page, '19-creator-root-dutch')

  await page.goto(`${editor('start', asideId)}?lang=nl`)
  await write(page, asideId, 'title.nl', 'Wat is in de handel brengen?')
  await write(page, asideId, 'description.nl', 'Een systeem voor het eerst op de EU-markt aanbieden.')
  await page.goto(`${editor('start', yesId)}?lang=nl`)
  await write(page, yesId, 'title.nl', 'De AI-verordening is op u van toepassing')
  await write(page, yesId, 'description.nl', 'Als aanbieder draagt u de verplichtingen van de verordening.')
  // **[#179]** The ending's words are a text of their own in each language, written on the badge (36.3).
  await write(page, yesId, 'terminal.label.nl', 'Van toepassing')
  await page.goto(`${editor('start', noId)}?lang=nl`)
  // The No Node's Dutch description is left empty: the publish below must refuse it.
  await write(page, noId, 'title.nl', 'De AI-verordening is niet op u van toepassing')
  await write(page, noId, 'terminal.label.nl', 'Niet van toepassing')

  // The collaborator, invited from the top panel (33.4).
  await page.goto(editor('start'))
  await openPanel(page)
  await panel(page).locator('select[data-select="invite"]').selectOption({ label: COLLABORATOR.name })
  await panel(page).getByRole('button', { name: 'Invite' }).click()
  await expect(panel(page).locator('.panel-people li')).toHaveText([`${CREATOR.name} (creator)`, COLLABORATOR.name])
  await step(page, '20-creator-collaborator-invited')

  // Publish with a text missing: refused, the missing text named and linked (33.3, 19.3), in
  // **[#176]** the to-do bubble the Publish section points at.
  await publishSwitch(page).click()
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await panel(page).getByRole('alert').getByRole('button', { name: 'See what to do' }).click()
  const todo = todoBubble(page).locator('.todo-list li')
  await expect(todo.first()).toBeVisible()
  await expect(todo.locator(`a[href^="/admin/trees/${tree}/${noId}"], a[href*="/${noId}"]`).first()).toBeVisible()
  await step(page, '21-creator-publish-refused')
  expect((await page.request.get(`${origin}/${tree}/start`)).status()).toBe(404)

  // The text completed, and published.
  await page.goto(`${editor('start', noId)}?lang=nl`)
  await write(page, noId, 'description.nl', 'Wie geen systeem op de markt brengt, is er niet de aanbieder van.')
  await page.goto(editor('start'))
  await openPanel(page)
  await publishSwitch(page).click()
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'true')
  await expect(panelButton(page)).toHaveAccessibleName('Decision-tree settings: Published')
  await step(page, '22-creator-published')
  expect((await page.request.get(`${origin}/${tree}/start`)).status()).toBe(200)
  await page.context().close()
})

test('3. the collaborator opens the Tree, changes a title, and sees it live on the public page', async ({ browser }) => {
  const page = await person(browser)
  await page.goto(`${origin}/admin`)
  await signIn(page, COLLABORATOR.email, COLLABORATOR.password)
  const tile = page.locator(`.tile[data-tree="${tree}"]`)
  await expect(tile).toBeVisible()
  await expect(page.locator('.tile--new')).toBeVisible()
  await step(page, '23-collaborator-overview')
  await tile.click()
  await expect(page).toHaveURL(editor('start'))
  await write(page, 'start', 'title.en', 'Is the AI system placed on the market by a provider?')
  await step(page, '24-collaborator-title-changed')

  // Every valid save of a published Tree reaches the public at once (19.4).
  const visitor = await person(browser)
  await visitor.goto(`${origin}/${tree}/start`)
  await expect(visitor.locator('.bubble h1')).toHaveText('Is the AI system placed on the market by a provider?')
  await step(visitor, '25-collaborator-change-live-public')
  await visitor.context().close()
  await page.context().close()
})

test('4. a visitor without a session walks the published Tree and finds it everywhere', async ({ browser }) => {
  const page = await person(browser)
  const setCookie: string[] = []
  const reads: Promise<void>[] = []
  page.on('response', (response) => {
    reads.push(
      response.allHeaders().then((headers) => {
        if (headers['set-cookie'] !== undefined) setCookie.push(`${response.url()}: ${headers['set-cookie']}`)
      }),
    )
  })

  // The public overview lists it (23.2), and its tile leads to the root.
  await page.goto(`${origin}/`)
  const tile = page.locator(`a.tile[data-tree="${tree}"]`)
  await expect(tile).toBeVisible()
  await step(page, '26-visitor-public-overview')
  await tile.click()
  await arrived(page, `${origin}/${tree}/start`)
  await step(page, '27-visitor-root')

  // The explainer, on hover (10.8).
  await expect(page.locator('.bubble .prose[data-enhanced]')).toBeAttached()
  await page.locator('.bubble .term').hover()
  await expect(page.locator('.bubble .explainer[data-open]')).toContainText('The one who develops the system')
  await step(page, '28-visitor-explainer-hover')
  await page.mouse.move(5, 600)

  // The side bubble, in the Overlay (10.9).
  const overlay = page.locator('details.overlay').first()
  await overlay.locator(':scope > .sheet-open').click()
  await expect(overlay.locator(':scope > .sheet-panel h2')).toHaveText('What is placing on the market?')
  await step(page, '29-visitor-side-bubble-overlay')
  await page.keyboard.press('Escape')
  await expect(page.locator('details.sheet[open]')).toHaveCount(0)

  // From the root to the Terminal.
  await page.locator('.answer--next:nth-child(1)').click()
  await arrived(page, `${origin}/${tree}/start/${yesId}`)
  await expect(page.locator('.bubble--terminal .outcome')).toBeVisible()
  await step(page, '30-visitor-terminal')

  // Findable (16.2, 23.4) and in the dataset (15.1): one `<url>` per Node per language after
  // the overview's two.
  const sitemap = await (await page.request.get(`${origin}/sitemap.xml`)).text()
  const urls = sitemap.match(/<url>/g)?.length ?? 0
  const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1] ?? '')
  const dataset = (await (await page.request.get(`${origin}/${tree}/tree.json`)).json()) as { languages: string[]; nodes: { id: string }[] }
  expect(dataset.nodes.map((node) => node.id).sort()).toEqual(['start', yesId, noId, asideId].sort())
  expect(urls).toBe(2 + dataset.nodes.length * dataset.languages.length)
  expect(locs.filter((loc) => new URL(loc).pathname.startsWith(`/${tree}/`))).toHaveLength(dataset.nodes.length * dataset.languages.length)
  rows.push(`| sitemap | \`/sitemap.xml\` | ${urls} \`<url>\` | ${dataset.nodes.length} Nodes x ${dataset.languages.length} languages + 2 | - |`)

  // `/admin` is the login page, and nothing the visitor opened set a cookie (20.5).
  await page.goto(`${origin}/admin`)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await step(page, '31-visitor-admin-login-page')
  while (reads.length > 0) await Promise.all(reads.splice(0))
  expect(setCookie).toEqual([])
  expect(await page.context().cookies()).toEqual([])
  await page.context().close()
})
