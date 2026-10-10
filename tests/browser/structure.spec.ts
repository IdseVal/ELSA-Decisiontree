/**
 * **[#139]** The structure editing, in a browser (docs/specs/application.md 30, 35.4;
 * ADR-133-structure-editing): from an empty root, `+ Yes` lands on a new empty Node whose up
 * arrow returns; `treeEndsHere` asks for the ending's words, **[#179]** one field stopping at
 * 19 characters, and the badge is then their field (36.3); the side `+` opens the new
 * Overlay editable and the Option's title edits on the button, and **[#177]** a second-level
 * aside is made from the aside's own page, the Overlay offering no `+` (30.4, 30.5, amended;
 * `side-bubble.spec.ts` has the rest of #177); two Answers reaching one Node -- **[#178]** made
 * through the API, the editor no longer offering it -- keep working and the published walk
 * (through #136's route) follows both; the API's `remove-option` leaves an orphan the draft
 * reports, and its `add-option` hangs it back (**[#177]** the editor no longer offers
 * `linkExisting`); **[#178]** the step's red cross deletes after one confirmation and goes to
 * the parent, whose `+` is back, or, from an orphan the to-do list leads to, to the root with no
 * Trail, and "Tree does not end here after all" gives the three buttons back; no button carries a
 * link menu; a Node with Options is refused an end and the Sheet says so; the ninth Option's `+`
 * is absent; and the count of Nodes created equals the count in the published `tree.json`.
 * `step-buttons.spec.ts` has the rest of #178. **[#179]** Last, on a Tree of two languages, an
 * ending typed to its limit in English and in Dutch, edited in place, and the public badge
 * holding the same words once it is published (36.5).
 *
 * One story, in order, on a Tree of this file's own; the fixture Tree `hidden-draft` stands
 * for the full Node with its eight Options. The screenshots the issue asks for go to
 * `docs/screenshots/issue-139/` under `ELSA_SHOTS=1`, **[#179]** the ending's to
 * `docs/screenshots/issue-179/`, and both to the results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Locator, type Page } from '@playwright/test'
import type { DraftNode, Violation } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-139') : path.join(RESULTS, 'shots')
const ENDING_SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-179') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 130

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const TREE = 'built'
/** A new Node's id is the server's: `n-` and six base32 characters (22.4). */
const NEW_ID = /n-[a-z2-7]{6}/

let origin: string

/** What the story made, for the count of Nodes at the end (DONE WHEN). */
const made: string[] = []
const deleted: string[] = []

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  await mkdir(ENDING_SHOTS, { recursive: true })
  const dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, creator: ANNA.email }],
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

/** A page logged in as Anna, at 1280 x 640, and the cookie for API calls of its own. */
async function loggedIn(browser: Browser): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  const { status, cookie } = await login(page, origin, ANNA.email, ANNA.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function nodeOf(page: Page, cookie: string, id: string): Promise<DraftNode> {
  const response = await api(page, cookie, 'GET', `/trees/${TREE}/nodes/${id}`)
  expect(response.status(), `GET ${id}`).toBe(200)
  return ((await response.json()) as { node: DraftNode }).node
}

/** The whole draft's advisory list (22.1, `GET /admin/api/trees/<t>`): where an orphan is reported (30.9). */
async function advisory(page: Page, cookie: string): Promise<Violation[]> {
  const body = (await (await api(page, cookie, 'GET', `/trees/${TREE}`)).json()) as { violations?: Violation[]; advisory?: Violation[] }
  return body.violations ?? body.advisory ?? []
}

const editor = (nodeIds: string[]) => `${origin}/admin/trees/${TREE}/${nodeIds.join('/')}`
const status = (page: Page) => page.getByRole('status')
/** The visible region of one field. */
const field = (page: Page, nodeId: string, keyPath: string) => page.locator(`[data-field="${nodeId} ${keyPath}"]`).filter({ visible: true })

/** The id at the end of the page's address, which a creation just navigated to (30.2, 30.4). */
function lastId(page: Page): string {
  const last = new URL(page.url()).pathname.split('/').pop() ?? ''
  expect(last).toMatch(NEW_ID)
  return last
}

/** Waits for the plain navigation a creation makes: to an address one id longer than `from` (30.2). */
async function landed(page: Page, from: string): Promise<string> {
  await page.waitForURL((url) => url.pathname.startsWith(`${from}/`) && url.pathname.split('/').length === from.split('/').length + 1)
  const id = lastId(page)
  made.push(id)
  return id
}

/**
 * Opens `treeEndsHere` on the centre, types the ending's `words` into its one field, key by
 * key, and confirms (30.3; **[#179]** 36.3).
 */
async function endHere(page: Page, words: string): Promise<void> {
  await page.locator('.structure-end > .sheet-open').click()
  const form = page.locator('.structure-form--end')
  await expect(form).toBeVisible()
  await expect(form.getByRole('textbox')).toBeFocused()
  await page.keyboard.type(words, { delay: 5 })
  await form.getByRole('button', { name: 'Confirm' }).click()
}

/** **[#179]** The ending's words on the rim, in `lang`: the field drawn as the badge (36.3). */
const badge = (page: Page, nodeId: string, lang = 'en') => page.locator(`[data-field="${nodeId} terminal.label.${lang}"]`)

async function shoot(page: Page, name: string, folder = SHOTS): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(folder, `${name}.png`) })
}

/** The three outlined buttons of a Node without Links (30.1). */
async function expectChoice(page: Page): Promise<void> {
  await expect(page.locator('.structure--yes')).toHaveText('+ Yes')
  await expect(page.locator('.structure-end > .sheet-open')).toHaveText('Tree ends here')
  await expect(page.locator('.structure--no')).toHaveText('+ No')
  await expect(page.locator('.answer--start-again')).toBeHidden()
  await expect(page.locator('.answer--next:nth-child(1), .answer--next:nth-child(2)')).toHaveCount(0)
}

/** Gives a Node the texts Publish wants (19.3: every rule blocking), through the API; the structure is the browser's. */
async function fill(page: Page, cookie: string, id: string, title: string): Promise<void> {
  for (const [path, value] of [
    ['title.en', title],
    ['description.en', `About ${title.toLowerCase()}.`],
  ]) {
    expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${id}`, { path, value })).status()).toBe(200)
  }
}

let q1 = ''
let n2 = ''
let n2a = ''
let n2b = ''
let n2c = ''
let a1 = ''
let a2 = ''

test('the empty root offers + Yes, treeEndsHere and + No; + Yes lands on a new empty Node; the up arrow returns; the row then shows Yes: and a lone + No (30.1, 30.2)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  expect((await api(page, cookie, 'POST', '/trees', { id: TREE, languages: ['en'], title: { en: 'Built in the browser' } })).status()).toBe(201)
  await page.goto(editor(['start']))
  await expectChoice(page)
  // No neighbour frames and nothing slides in the editor (34.5).
  await expect(page.locator('[data-slide]')).toHaveCount(0)
  await shoot(page, 'empty-node-choice')

  await page.locator('.structure--yes').click()
  q1 = await landed(page, `/admin/trees/${TREE}/start`)
  // The new Node arrives empty: no title, no description, the three buttons, the up arrow back (30.2).
  await expect(page.locator('h1 textarea')).toHaveValue('')
  // **[#172]** The empty description names what belongs in it (28.2, amended).
  await expect(field(page, q1, 'description.en')).toContainText('Text')
  await expectChoice(page)
  await expect(page.locator('.up-arrow')).toHaveAttribute('href', `/admin/trees/${TREE}/start`)
  await shoot(page, 'new-question-node')
  // **[#221]** A next step labelled with the chrome word (41.7 item 1).
  expect((await nodeOf(page, cookie, 'start')).answers).toEqual([{ label: { en: 'Yes' }, target: q1 }])

  await page.locator('.up-arrow').click()
  await expect(page).toHaveURL(editor(['start']))
  // One Answer: the real button for it, the placeholder for its empty title, and the `+` for the other at 620 (30.1).
  await expect(page.locator('.answer--next:nth-child(1)')).toHaveAttribute('href', `/admin/trees/${TREE}/start/${q1}`)
  await expect(page.locator('.answer--next:nth-child(1) .branch-title')).toHaveText('Yes')
  await expect(page.locator('.answer--next:nth-child(1)')).toHaveAccessibleName('Yes: [Text missing in this language]')
  await expect(page.locator('.structure--no')).toHaveClass(/structure--lone/)
  await expect(page.locator('.structure--yes')).toHaveCount(0)
  await expect(page.locator('.structure-end')).toHaveCount(0)
  // **[#178]** No `...` at the Answer that exists, nor where the `+` is (30.6, amended).
  await expect(page.locator('.link-menu')).toHaveCount(0)
})

test('**[#179]** treeEndsHere asks for the ending\'s words and makes the Node a Terminal: the badge is their field, startAgain is the row, the buttons are gone; "Tree does not end here after all" gives them back (30.3, 30.8, 36.3)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start', q1]))
  await page.locator('.structure-end > .sheet-open').click()
  const form = page.locator('.structure-form--end')
  // One field, named and focused, its placeholder saying what belongs in it, its counter at
  // the limit's 19; no outcome is offered (36.3).
  const input = form.getByRole('textbox', { name: 'Text of the ending' })
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('placeholder', 'Text of the ending')
  await expect(form.locator('input')).toHaveCount(1)
  await expect(form.locator('.structure-ending-count')).toHaveText('0 / 19')
  // `confirm` waits for a character that is not white space, and so does Enter.
  const confirm = form.getByRole('button', { name: 'Confirm' })
  await expect(confirm).toBeDisabled()
  await page.keyboard.type('   ')
  await expect(confirm).toBeDisabled()
  await page.keyboard.press('Enter')
  await expect(form).toBeVisible()
  // Typing stops at the limit (28.4): the twentieth character does nothing.
  await input.fill('')
  await page.keyboard.type('Mandatory safeguards', { delay: 5 })
  await expect(input).toHaveValue('Mandatory safeguard')
  await expect(form.locator('.structure-ending-count')).toHaveText('19 / 19')
  // `cancel` closes the Sheet, writes nothing, and the Sheet opens empty again.
  await form.getByRole('button', { name: 'Cancel' }).click()
  await expect(form).toBeHidden()
  expect((await nodeOf(page, cookie, q1)).label).toBeUndefined()
  await page.locator('.structure-end > .sheet-open').click()
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('')
  await page.keyboard.type('Applies', { delay: 5 })
  await page.keyboard.press('Enter')

  const words = badge(page, q1)
  await expect(words.locator('textarea')).toHaveValue('Applies')
  await expect(words).toHaveClass(/outcome/)
  await expect(page.locator('.answer--start-again')).toBeVisible()
  await expect(page.locator('.structure, .structure-end')).toHaveCount(0)
  // A Terminal carries no `+` in the fan (5.6).
  await expect(page.locator('.side-add')).toHaveCount(0)
  await shoot(page, 'terminal-with-words')
  expect((await nodeOf(page, cookie, q1)).label).toEqual({ en: 'Applies' })

  // **[#178]** Beside the up arrow, in place of the step menu: the red cross, and on a Terminal
  // `removeEnd`, which gives the three buttons back at once; ended again, the story goes on (30.8, amended).
  await expect(page.locator('.step-menu')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Delete this step' })).toBeVisible()
  await page.getByRole('button', { name: 'Tree does not end here after all' }).click()
  await expectChoice(page)
  await expect(badge(page, q1)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Tree does not end here after all' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Delete this step' })).toBeVisible()
  expect((await nodeOf(page, cookie, q1)).label).toBeUndefined()
  // The words went with the marker: ended again, the Sheet asks for them again (36.3).
  await endHere(page, 'Applies')
  await expect(words.locator('textarea')).toHaveValue('Applies')
  // The root has no cross (30.8).
  await page.goto(editor(['start']))
  await expect(page.locator('.bubble[data-node="start"]')).toBeVisible()
  await expect(page.locator('.step-delete')).toHaveCount(0)
})

test('+ No makes the second Answer; the new Node gets its own two Answers, each ended; the parent row is then the public one (30.1, 30.2)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start']))
  await page.locator('.structure--no').click()
  n2 = await landed(page, `/admin/trees/${TREE}/start`)
  await expectChoice(page)

  await page.locator('.structure--yes').click()
  n2a = await landed(page, `/admin/trees/${TREE}/start/${n2}`)
  await endHere(page, 'Prohibited')
  await expect(badge(page, n2a).locator('textarea')).toHaveValue('Prohibited')
  await page.locator('.up-arrow').click()
  await expect(page).toHaveURL(editor(['start', n2]))

  await page.locator('.structure--no').click()
  n2b = await landed(page, `/admin/trees/${TREE}/start/${n2}`)
  await endHere(page, 'Look elsewhere')
  await expect(badge(page, n2b).locator('textarea')).toHaveValue('Look elsewhere')
  await page.locator('.up-arrow').click()
  await expect(page).toHaveURL(editor(['start', n2]))
  // Both Answers: the public row (30.1), **[#178]** with no link menu on either (30.6, amended).
  await expect(page.locator('.answer--next:nth-child(1)')).toHaveAttribute('href', `/admin/trees/${TREE}/start/${n2}/${n2a}`)
  await expect(page.locator('.answer--next:nth-child(2)')).toHaveAttribute('href', `/admin/trees/${TREE}/start/${n2}/${n2b}`)
  await expect(page.locator('.structure, .structure-end')).toHaveCount(0)
  await expect(page.locator('.link-menu')).toHaveCount(0)
  expect((await nodeOf(page, cookie, n2)).answers).toEqual([
    { label: { en: 'Yes' }, target: n2a },
    { label: { en: 'No' }, target: n2b },
  ])
})

/**
 * **[#177]** Types the title of the aside in the Overlay its creation opened, key by key, and
 * leaves it: its Option button's title follows it (30.5, amended).
 */
async function titleAside(page: Page, id: string, title: string): Promise<void> {
  // Drawn after hydration: the field listens from here on.
  await expect(page.locator('details.overlay[open] > .sheet-backdrop')).toBeAttached()
  const area = page.locator(`[data-field="${id} title.en"] textarea`)
  await expect(area).toHaveValue('')
  await area.click()
  await page.keyboard.type(title, { delay: 5 })
  await area.blur()
}

test('the side-bubble + creates an Option and its aside at one click and lands on the Overlay, open and editable; the Option’s title follows the aside’s and edits on the button; a second-level aside is made from the aside’s own page (30.4, 30.5)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start']))
  const add = page.locator('.options > li.options-add > .side-add')
  await expect(add).toHaveCount(1)
  await expect(add.locator('.option-title')).toHaveText('New side bubble')
  await add.click()
  a1 = await landed(page, `/admin/trees/${TREE}/start`)

  // The aside's address under this page renders the page with the new Overlay open (10.9, 30.4).
  const overlay = page.locator(`.options > li:has(.overlay-interior[data-node="${a1}"]) > details.overlay`)
  await expect(overlay).toHaveAttribute('open', '')
  await titleAside(page, a1, 'An aside')
  await expect(page.locator(`[data-field="start options[0].title.en"] textarea`)).toHaveValue('An aside')
  await shoot(page, 'side-bubble-overlay')
  await expect.poll(async () => (await nodeOf(page, cookie, 'start')).options).toEqual([{ title: { en: 'An aside' }, target: a1 }])
  await expect.poll(async () => (await nodeOf(page, cookie, a1)).title).toEqual({ en: 'An aside' })

  // **[#177]** The Overlay offers no `+` (30.5, amended): the aside's own page is the centre, and its fan's makes the deeper aside.
  await expect(overlay.locator('.side-add')).toHaveCount(0)
  await page.goto(editor([a1]))
  await page.locator('.options > li.options-add > .side-add').click()
  a2 = await landed(page, `/admin/trees/${TREE}/${a1}`)
  await expect(page.locator(`.overlay-interior[data-node="${a2}"]`)).toBeVisible()
  await titleAside(page, a2, 'A deeper aside')
  await expect.poll(async () => (await nodeOf(page, cookie, a1)).options).toEqual([{ title: { en: 'A deeper aside' }, target: a2 }])

  // Then the Option's title, edited on the button, is the Option's, not the aside's (30.5).
  await page.goto(editor(['start']))
  const button = page.locator('[data-field="start options[0].title.en"] textarea')
  await button.click()
  await button.fill('The aside, renamed on its button')
  await expect(status(page)).toContainText(/^Saved \d/)
  expect((await nodeOf(page, cookie, 'start')).options[0]!.title.en).toBe('The aside, renamed on its button')
  expect((await nodeOf(page, cookie, a1)).title.en).toBe('An aside')
})

test('**[#178]** two Answers reaching one Node, made through the API now that the editor offers no re-pointing, keep working in the editor; the Node it left is an orphan the draft reports (30.6, 30.9)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  // `set-answer` stays in the editor's server interface (22.1); the editor no longer sends it.
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${n2}`, { op: 'set-answer', index: 1, target: q1 })).status()).toBe(200)
  await page.goto(editor(['start', n2]))
  await expect(page.locator('.answer--next:nth-child(2)')).toHaveAttribute('href', `/admin/trees/${TREE}/start/${n2}/${q1}`)
  await expect(page.locator('.link-menu')).toHaveCount(0)
  expect((await nodeOf(page, cookie, n2)).answers!.map((answer) => answer.target)).toEqual([n2a, q1])
  expect((await nodeOf(page, cookie, 'start')).answers![0]!.target).toBe(q1)

  // n2b is reached by nothing now: V-REACH, advisory, at the Node (30.9); it is not deleted.
  const orphan = (await advisory(page, cookie)).filter((v) => v.rule === 'V-REACH').map((v) => v.file)
  expect(orphan).toEqual([n2b])
  expect((await nodeOf(page, cookie, n2b)).label).toEqual({ en: 'Look elsewhere' })
})

test('**[#178]** the red cross on the step a yes leads to: one confirmation names its title, the editor goes to the parent, whose yes is free again and makes a fresh step (30.8, amended; 30.2)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await fill(page, cookie, n2a, 'Prohibited')
  await page.goto(editor(['start', n2, n2a]))
  await page.getByRole('button', { name: 'Delete this step' }).click()
  const question = page.getByRole('alertdialog')
  await expect(question.locator('.structure-confirm')).toHaveText('Delete "Prohibited"? What it led to stays.')
  await question.getByRole('button', { name: 'Confirm' }).click()
  await page.waitForURL(editor(['start', n2]))
  deleted.push(n2a)
  // **[#221]** The No that stays is the one next step; the + for the word it lacks is Yes (41.7 item 2).
  await expect(page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--next')).toHaveCount(1)
  await expect(page.locator('.structure--yes')).toHaveClass(/structure--lone/)
  expect((await api(page, cookie, 'GET', `/trees/${TREE}/nodes/${n2a}`)).status()).toBe(404)
  expect((await nodeOf(page, cookie, n2)).answers).toEqual([{ label: { en: 'No' }, target: q1 }])

  await page.locator('.structure--yes').click()
  n2c = await landed(page, `/admin/trees/${TREE}/start/${n2}`)
  await expectChoice(page)
  await endHere(page, 'Does not apply')
  await expect(badge(page, n2c).locator('textarea')).toHaveValue('Does not apply')
  // Appended last, where its + stood (41.7 item 3).
  expect((await nodeOf(page, cookie, n2)).answers).toEqual([
    { label: { en: 'No' }, target: q1 },
    { label: { en: 'Yes' }, target: n2c },
  ])
  // n2a is gone, so it is no orphan; n2b still is.
  expect((await advisory(page, cookie)).filter((v) => v.rule === 'V-REACH').map((v) => v.file)).toEqual([n2b])
})

test('**[#178]** an orphan is reached through the to-do list, where its line leads to its page; its cross deletes it there and, with no Trail, the editor goes to the root (30.8, 30.9)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start']))
  const todo = page.locator('.todo-sheet')
  await todo.locator(':scope > .sheet-open').click()
  const line = todo.locator('.todo-list li[data-rule="V-REACH"]')
  await expect(line).toHaveCount(1)
  await line.locator('a').click()
  await page.waitForURL(editor([n2b]))
  await expect(page.locator('.up-arrow')).toHaveCount(0)
  await page.getByRole('button', { name: 'Delete this step' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm' }).click()
  await page.waitForURL(editor(['start']))
  deleted.push(n2b)
  expect((await api(page, cookie, 'GET', `/trees/${TREE}/nodes/${n2b}`)).status()).toBe(404)
  expect((await advisory(page, cookie)).filter((v) => v.rule === 'V-REACH')).toEqual([])
})

test('**[#178]** the server interface keeps remove-option and add-option (22.1): an Option removed through the API leaves its target in the draft as an orphan, which add-option hangs back (30.7, 30.9)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/start`, { op: 'remove-option', target: a1 })).status()).toBe(200)
  await page.goto(editor(['start']))
  await expect(page.locator(`.overlay-interior[data-node="${a1}"]`)).toHaveCount(0)
  expect((await nodeOf(page, cookie, 'start')).options).toEqual([])
  expect((await nodeOf(page, cookie, a1)).title.en).toBe('An aside')
  // a1 and, behind it, a2 are reached by nothing (30.9): an explanation Node no Option names is
  // V-ORPHAN, and what only it led to V-REACH, as the validator words the one cause.
  const todo = await advisory(page, cookie)
  expect(todo.filter((v) => v.rule === 'V-ORPHAN').map((v) => v.file)).toEqual([a1])
  expect(todo.filter((v) => v.rule === 'V-REACH').map((v) => v.file)).toEqual([a2])

  // **[#177]** The editor no longer offers `linkExisting` (30.4, amended; ADR-169-tree-creation-ui-round
  // decision 5); the API's `add-option` still links an existing Node, and hangs a1 back for the walk below.
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/start`, { op: 'add-option', target: a1, title: { en: 'An aside' } })).status()).toBe(200)
  await page.goto(editor(['start']))
  await expect(page.locator(`.overlay-interior[data-node="${a1}"]`)).toHaveCount(1)
  expect((await nodeOf(page, cookie, 'start')).options).toEqual([{ title: { en: 'An aside' }, target: a1 }])
  expect((await advisory(page, cookie)).filter((v) => v.rule === 'V-REACH' || v.rule === 'V-ORPHAN')).toEqual([])
})

test('a Node with Options cannot end: the Sheet shows the refusal and the Node is unchanged (30.3)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor([a1]))
  await expectChoice(page)
  await endHere(page, 'Look elsewhere')
  const error = page.locator('.structure-form--end .structure-error')
  await expect(error).toBeVisible()
  await expect(error).not.toHaveText('')
  console.log(`refused end on a Node with Options: ${await error.textContent()}`)
  await expect(page.locator('.structure-form--end')).toBeVisible()
  expect((await nodeOf(page, cookie, a1)).label).toBeUndefined()
})

test('the ninth Option’s + is absent: the full Node with eight Options has no side-bubble + and, **[#178]**, no button a link menu; no Overlay has one (30.4, 30.5, 30.6)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await expect(page.locator('.options > li')).toHaveCount(8)
  await expect(page.locator('.options > li.options-add')).toHaveCount(0)
  await expect(page.locator('.link-menu')).toHaveCount(0)
  // **[#177]** None of the eight Overlays offers a `+` any more (30.5, amended): before, each list ended in one.
  await expect(page.locator('.side-add')).toHaveCount(0)
  // **[#175]** Nor does a ninth get past the editor: the store refuses both writes that would
  // add one, with 22.3's 422 and V-COUNT, and the Node keeps its eight.
  const ninth = [
    await api(page, cookie, 'PATCH', '/trees/hidden-draft/nodes/full', { op: 'add-option', title: { en: 'A ninth' } }),
    await api(page, cookie, 'POST', '/trees/hidden-draft/nodes', { from: { node: 'full', link: 'option' }, title: { en: 'A ninth' } }),
    // **[#177]** The `+`'s own write, which sends no title (30.4, amended).
    await api(page, cookie, 'POST', '/trees/hidden-draft/nodes', { from: { node: 'full', link: 'option' } }),
  ]
  for (const refused of ninth) {
    expect(refused.status()).toBe(422)
    expect(((await refused.json()) as { violations: Violation[] }).violations).toEqual([
      { file: 'full', keyPath: 'options', rule: 'V-COUNT', message: '9 entries; at most 8', advisory: false },
    ])
  }
  const full = await api(page, cookie, 'GET', '/trees/hidden-draft/nodes/full')
  expect(((await full.json()) as { node: DraftNode }).node.options).toHaveLength(8)
  await page.goto(`${origin}/admin/trees/hidden-draft/full/opt-one`)
  await expect(page.locator('details.overlay[open] .side-add')).toHaveCount(0)
  // An explanation Node that is the centre gets the fan's `+` and the three buttons (30.1, 30.4).
  await page.goto(`${origin}/admin/trees/hidden-draft/opt-three`)
  await expect(page.locator('.options > li.options-add > .side-add')).toHaveCount(1)
  await expectChoice(page)
})

test('published through #136’s route, the walk on the public page follows both Answers to the one Node, and the count of Nodes made equals the count in tree.json (DONE WHEN)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  for (const [id, title] of [
    ['start', 'The root question'],
    [q1, 'It applies'],
    [n2, 'The second question'],
    [n2c, 'It does not apply'],
    [a1, 'An aside'],
    [a2, 'A deeper aside'],
  ] as const) {
    await fill(page, cookie, id, title)
  }
  const published = await api(page, cookie, 'PUT', `/trees/${TREE}/published`, { published: true })
  expect(published.status(), await published.text()).toBe(200)

  const dataset = (await (await page.request.get(`${origin}/${TREE}/tree.json`)).json()) as { nodes: { id: string }[] }
  const inFile = dataset.nodes.map((node) => node.id)
  const expected = ['start', ...made.filter((id) => !deleted.includes(id))]
  console.log(`Nodes created in the browser: ${made.length} (${made.join(', ')}); deleted: ${deleted.length} (${deleted.join(', ')}); with the root: ${expected.length}`)
  console.log(`Nodes in the published tree.json: ${inFile.length} (${inFile.join(', ')})`)
  expect(inFile.sort()).toEqual([...expected].sort())
  expect(inFile.length).toBe(made.length - deleted.length + 1)

  // The walk (tests/first-tree/walk.spec.ts is the model): yes from the root, and no then no
  // from the second question, both end on q1. By name: the public page pre-renders neighbour
  // frames with buttons of their own (11.2), and a name says which Node's button is clicked.
  await page.goto(`${origin}/${TREE}/start`)
  await expect(page.locator('[data-field]')).toHaveCount(0)
  await page.getByRole('link', { name: 'Yes: It applies' }).click()
  await expect(page).toHaveURL(`${origin}/${TREE}/start/${q1}`)
  await expect(page.locator('.bubble--terminal .outcome').first()).toHaveText('Applies')
  await page.goto(`${origin}/${TREE}/start`)
  await page.getByRole('link', { name: 'No: The second question' }).click()
  await expect(page).toHaveURL(`${origin}/${TREE}/start/${n2}`)
  await page.getByRole('link', { name: 'No: It applies' }).click()
  await expect(page).toHaveURL(`${origin}/${TREE}/start/${n2}/${q1}`)
  await expect(page.locator('.bubble--terminal .outcome').first()).toHaveText('Applies')
  // The aside and its own aside, through the Overlay's links.
  await page.goto(`${origin}/${TREE}/start`)
  const overlay = page.locator('details.overlay').first()
  await overlay.locator(':scope > .sheet-open').click()
  await expect(overlay.locator(':scope > .sheet-panel h2')).toHaveText('An aside')
  await overlay.locator('.overlay-options a').click()
  await expect(page).toHaveURL(`${origin}/${TREE}/start/${a1}/${a2}`)
  await expect(page.locator('.overlay-interior[data-node]').last()).toHaveAttribute('data-node', a2)
  await shoot(page, 'public-walk-after-publish')
})

/** **[#179]** The ending's own Tree, in two languages (36.5). */
const ENDING = 'ending'

test('**[#179]** an ending typed to its limit in English and in Dutch is the badge in the editor, with a to-do while a language lacks it, and, published through #136\'s route, the public badge in both (36.3, 36.5)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  const call = (method: string, route: string, data?: unknown) => api(page, cookie, method, `/trees/${ENDING}${route}`, data)
  expect((await api(page, cookie, 'POST', '/trees', { id: ENDING, languages: ['en', 'nl'], title: { en: 'An ending', nl: 'Een einde' } })).status()).toBe(201)
  const create = async (label: Record<string, string>): Promise<string> => ((await (await call('POST', '/nodes', { from: { node: 'start', link: 'answer', label } })).json()) as { node: { id: string } }).node.id
  const step = await create({ en: 'Yes', nl: 'Ja' })
  const other = await create({ en: 'No', nl: 'Nee' })
  for (const [id, en, nl] of [
    ['start', 'Is a safeguard needed?', 'Is een maatregel nodig?'],
    [step, 'A safeguard is needed', 'Een maatregel is nodig'],
    [other, 'No safeguard is needed', 'Geen maatregel nodig'],
  ] as const) {
    for (const [path, value] of [['title.en', en], ['title.nl', nl], ['description.en', `${en}.`], ['description.nl', `${nl}.`]]) {
      expect((await call('PATCH', `/nodes/${id}`, { path, value })).status()).toBe(200)
    }
  }
  expect((await call('POST', '/nodes', { from: { node: other, link: 'end', label: { en: 'Does not apply', nl: 'Niet van toepassing' } } })).status()).toBe(201)
  const words = async (): Promise<DraftNode['label']> => ((await (await call('GET', `/nodes/${step}`)).json()) as { node: DraftNode }).node.label

  // English: the Sheet, typed past the limit, which the twentieth character does not pass.
  await page.goto(`${origin}/admin/trees/${ENDING}/start/${step}`)
  await page.locator('.structure-end > .sheet-open').click()
  const form = page.locator('.structure-form--end')
  const input = form.getByRole('textbox', { name: 'Text of the ending' })
  await expect(input).toBeFocused()
  await page.keyboard.type('Mandatory safeguards', { delay: 5 })
  await expect(input).toHaveValue('Mandatory safeguard')
  await expect(form.locator('.structure-ending-count')).toHaveText('19 / 19')
  await shoot(page, 'tree-ends-here-asks-for-the-words', ENDING_SHOTS)
  await form.getByRole('button', { name: 'Confirm' }).click()

  // The badge is the field: blurred, the public badge's capitals on one line of the pill's 24 pixels.
  const en = badge(page, step)
  await expect(en.locator('textarea')).toHaveValue('Mandatory safeguard')
  expect(await en.evaluate((element) => getComputedStyle(element).textTransform)).toBe('uppercase')
  const blurred = (await en.boundingBox())!
  expect(blurred.height).toBe(24)
  expect(await words()).toEqual({ en: 'Mandatory safeguard', nl: '' })
  // A language without the words is a to-do (19.2): one line, for this step.
  await page.locator('.todo-sheet > .sheet-open').click()
  const todo = page.locator('.todo-list li')
  await expect(todo).toHaveCount(1)
  await expect(todo).toHaveAttribute('data-rule', 'V-L10N')
  await expect(todo).toContainText('A safeguard is needed: missing or empty text for the declared language "nl"')
  await page.keyboard.press('Escape')
  // Focused, the words as typed, the counter and the missing language's tag on the right rim (28.3).
  await en.locator('textarea').click()
  expect(await en.evaluate((element) => getComputedStyle(element).textTransform)).toBe('none')
  await expect(page.locator('.editor-rim .editor-pill')).toHaveText('19 / 19')
  await expect(page.locator('.editor-rim .editor-tag')).toHaveText('nl')
  await page.keyboard.press('End')
  await page.keyboard.type('s')
  await expect(en.locator('textarea')).toHaveValue('Mandatory safeguard')
  await shoot(page, 'ending-at-its-limit-editor-en', ENDING_SHOTS)
  await en.locator('textarea').blur()

  // Dutch: the same step in the other language, its words not written yet, written in place.
  await page.goto(`${origin}/admin/trees/${ENDING}/start/${step}?lang=nl`)
  const nl = badge(page, step, 'nl')
  await expect(nl.locator('textarea')).toHaveValue('')
  await expect(nl.locator('textarea')).toHaveAttribute('placeholder', 'Tekst van het einde')
  await nl.locator('textarea').click()
  await page.keyboard.type('Maatregelen vereisten', { delay: 5 })
  await expect(nl.locator('textarea')).toHaveValue('Maatregelen vereist')
  await expect(page.locator('.editor-rim .editor-pill')).toHaveText('19 / 19')
  await expect(page.locator('.editor-rim .editor-tag')).toHaveCount(0)
  await expect.poll(words).toEqual({ en: 'Mandatory safeguard', nl: 'Maatregelen vereist' })
  await expect(status(page)).toContainText(/^Opgeslagen \d/)
  await shoot(page, 'ending-at-its-limit-editor-nl', ENDING_SHOTS)
  await nl.locator('textarea').blur()

  // Published (19.3), the public page's badge holds the same words, in both languages.
  const published = await call('PUT', '/published', { published: true })
  expect(published.status(), await published.text()).toBe(200)
  for (const [lang, expected] of [['en', 'Mandatory safeguard'], ['nl', 'Maatregelen vereist']] as const) {
    await page.goto(`${origin}/${ENDING}/start/${step}${lang === 'en' ? '' : '?lang=nl'}`)
    await expect(page.locator('[data-field]')).toHaveCount(0)
    const shown = page.locator('.bubble--terminal .outcome').filter({ visible: true })
    await expect(shown).toHaveText(expected)
    const box = (await shown.boundingBox())!
    expect(box.height, lang).toBe(24)
    // The field in the editor, blurred, was this badge: the same box, so nothing on the rim moves (36.3).
    if (lang === 'en') for (const side of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box[side] - blurred[side]), side).toBeLessThan(0.5)
    await shoot(page, `ending-at-its-limit-public-${lang}`, ENDING_SHOTS)
  }
})
