/**
 * **[#139]** The structure editing, in a browser (docs/specs/application.md 30, 35.4;
 * ADR-133-structure-editing): from an empty root, `+ Yes` lands on a new empty Node whose up
 * arrow returns; `treeEndsHere` with an outcome shows the badge; the side `+` opens the new
 * Overlay editable and the Option's title edits on the button, and the Overlay's own `+`
 * makes a second-level aside; `changeTarget` to an existing Node makes two Answers reach one
 * Node and the published walk (through #136's route) follows both; `createNew` from the
 * picker; `removeLink` leaves an orphan the draft reports; `linkExisting` hangs it back;
 * `deleteStep` goes to the parent and the parent's button is gone, or to the root with no
 * Trail; a Node with Options is refused an end and the Sheet says so; the ninth Option's `+`
 * is absent; and the count of Nodes created equals the count in the published `tree.json`.
 *
 * One story, in order, on a Tree of this file's own; the fixture Tree `hidden-draft` stands
 * for the full Node with its eight Options. The screenshots the issue asks for go to
 * `docs/screenshots/issue-139/` under `ELSA_SHOTS=1`, the results folder otherwise (35.7).
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
const PORT = BASE_PORT + 130

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }
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
  const dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, creator: ANNA.login }],
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
  const { status, cookie } = await login(page, origin, ANNA.login, ANNA.password)
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

/** Opens `treeEndsHere` on the centre, chooses `outcome` and confirms (30.3). */
async function endHere(page: Page, outcome: string): Promise<void> {
  await page.locator('.structure-end > .sheet-open').click()
  const form = page.locator('.structure-form--end')
  await expect(form).toBeVisible()
  await form.locator(`input[value="${outcome}"]`).check()
  await form.getByRole('button', { name: 'Confirm' }).click()
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

/** The three outlined buttons of a Node without Links (30.1). */
async function expectChoice(page: Page): Promise<void> {
  await expect(page.locator('.structure--yes')).toHaveText('+ Yes')
  await expect(page.locator('.structure-end > .sheet-open')).toHaveText('Tree ends here')
  await expect(page.locator('.structure--no')).toHaveText('+ No')
  await expect(page.locator('.answer--start-again')).toBeHidden()
  await expect(page.locator('.answer--yes, .answer--no')).toHaveCount(0)
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
  await expect(field(page, q1, 'description.en')).toContainText('Text missing in this language')
  await expectChoice(page)
  await expect(page.locator('.up-arrow')).toHaveAttribute('href', `/admin/trees/${TREE}/start`)
  await shoot(page, 'new-question-node')
  expect((await nodeOf(page, cookie, 'start')).answers).toEqual({ yes: q1 })

  await page.locator('.up-arrow').click()
  await expect(page).toHaveURL(editor(['start']))
  // One Answer: the real button for it, the placeholder for its empty title, and the `+` for the other at 620 (30.1).
  await expect(page.locator('.answer--yes')).toHaveAttribute('href', `/admin/trees/${TREE}/start/${q1}`)
  await expect(page.locator('.answer--yes .branch-title')).toHaveText('[Text missing in this language]')
  await expect(page.locator('.structure--no')).toHaveClass(/structure--lone/)
  await expect(page.locator('.structure--yes')).toHaveCount(0)
  await expect(page.locator('.structure-end')).toHaveCount(0)
  // The link menu stands at the Answer that exists, and not where the `+` is (30.6).
  await expect(page.locator('.link-menu--yes')).toHaveCount(1)
  await expect(page.locator('.link-menu--no')).toHaveCount(0)
})

test('treeEndsHere asks for the outcome and makes the Node a Terminal: the badge is the select, startAgain is the row, the buttons are gone (30.3)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start', q1]))
  await endHere(page, 'applicable')
  const select = page.locator(`[data-field="${q1} terminal.outcome"] select`)
  await expect(select).toHaveValue('applicable')
  await expect(select).toHaveClass(/outcome--applicable/)
  await expect(page.locator('.answer--start-again')).toBeVisible()
  await expect(page.locator('.structure, .structure-end')).toHaveCount(0)
  // A Terminal carries no `+` in the fan (5.6).
  await expect(page.locator('.side-add')).toHaveCount(0)
  await shoot(page, 'terminal-with-outcome')
  expect((await nodeOf(page, cookie, q1)).outcome).toBe('applicable')

  // The step menu of a Terminal offers `removeEnd`; the root has no `deleteStep` (30.8).
  await page.locator('.step-menu > .sheet-open').click()
  const menu = page.locator('.structure-form--step')
  await expect(menu.locator('.structure-id')).toHaveText(q1)
  await expect(menu.getByRole('button', { name: 'Does not end here after all' })).toBeVisible()
  await expect(menu.getByRole('button', { name: 'Delete this step' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto(editor(['start']))
  await page.locator('.step-menu > .sheet-open').click()
  await expect(page.locator('.structure-form--step .structure-id')).toHaveText('start')
  await expect(page.locator('.structure-form--step').getByRole('button', { name: 'Delete this step' })).toHaveCount(0)
})

test('+ No makes the second Answer; the new Node gets its own two Answers, each ended; the parent row is then the public one (30.1, 30.2)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start']))
  await page.locator('.structure--no').click()
  n2 = await landed(page, `/admin/trees/${TREE}/start`)
  await expectChoice(page)

  await page.locator('.structure--yes').click()
  n2a = await landed(page, `/admin/trees/${TREE}/start/${n2}`)
  await endHere(page, 'prohibited')
  await expect(page.locator(`[data-field="${n2a} terminal.outcome"] select`)).toHaveValue('prohibited')
  await page.locator('.up-arrow').click()
  await expect(page).toHaveURL(editor(['start', n2]))

  await page.locator('.structure--no').click()
  n2b = await landed(page, `/admin/trees/${TREE}/start/${n2}`)
  await endHere(page, 'refer')
  await expect(page.locator(`[data-field="${n2b} terminal.outcome"] select`)).toHaveValue('refer')
  await page.locator('.up-arrow').click()
  await expect(page).toHaveURL(editor(['start', n2]))
  // Both Answers: the public row, with a link menu on each (30.1, 30.6).
  await expect(page.locator('.answer--yes')).toHaveAttribute('href', `/admin/trees/${TREE}/start/${n2}/${n2a}`)
  await expect(page.locator('.answer--no')).toHaveAttribute('href', `/admin/trees/${TREE}/start/${n2}/${n2b}`)
  await expect(page.locator('.structure, .structure-end')).toHaveCount(0)
  await expect(page.locator('.link-menu--yes, .link-menu--no')).toHaveCount(2)
  expect((await nodeOf(page, cookie, n2)).answers).toEqual({ yes: n2a, no: n2b })
})

test('the side-bubble + creates an Option and its aside and lands on the Overlay, open and editable; the Option’s title edits on the button; the Overlay’s own + makes a second-level aside (30.4, 30.5)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start']))
  const add = page.locator('.options > li.options-add > .side-add')
  await expect(add).toHaveCount(1)
  await expect(add.locator(':scope > .sheet-open .option-title')).toHaveText('New side bubble')
  await add.locator(':scope > .sheet-open').click()
  const form = page.locator('.structure-form--side').filter({ visible: true })
  await form.getByRole('button', { name: 'Create a new one' }).click()
  const title = form.locator('.structure-title')
  await expect(title).toBeFocused()
  await title.fill('An aside')
  await form.getByRole('button', { name: 'Confirm' }).click()
  a1 = await landed(page, `/admin/trees/${TREE}/start`)

  // The aside's address under this page renders the page with the new Overlay open (10.9, 30.4).
  const overlay = page.locator(`.options > li:has(.overlay-interior[data-node="${a1}"]) > details.overlay`)
  await expect(overlay).toHaveAttribute('open', '')
  await expect(page.locator(`[data-field="${a1} title.en"] textarea`)).toHaveValue('An aside')
  await expect(page.locator(`[data-field="start options[0].title.en"] textarea`)).toHaveValue('An aside')
  await shoot(page, 'side-bubble-overlay')
  expect((await nodeOf(page, cookie, 'start')).options).toEqual([{ title: { en: 'An aside' }, target: a1 }])
  expect((await nodeOf(page, cookie, a1)).title).toEqual({ en: 'An aside' })

  // The Overlay's list gains `+ newSideBubble`, in a Sheet of its own group, which navigates to the deeper address.
  const deeper = overlay.locator(':scope > .sheet-panel .side-add--list')
  await deeper.locator(':scope > .sheet-open').click()
  await expect(overlay.locator(':scope > .sheet-panel')).toBeVisible()
  const deeperForm = page.locator('.structure-form--side').filter({ visible: true })
  await deeperForm.getByRole('button', { name: 'Create a new one' }).click()
  await deeperForm.locator('.structure-title').fill('A deeper aside')
  await deeperForm.getByRole('button', { name: 'Confirm' }).click()
  a2 = await landed(page, `/admin/trees/${TREE}/start/${a1}`)
  await expect(page.locator(`.overlay-interior[data-node="${a2}"]`)).toBeVisible()
  await expect(page.locator(`[data-field="${a2} title.en"] textarea`)).toHaveValue('A deeper aside')
  expect((await nodeOf(page, cookie, a1)).options).toEqual([{ title: { en: 'A deeper aside' }, target: a2 }])

  // Closed with the cross; then the Option's title, edited on the button, is the Option's, not the aside's (30.5).
  await page.locator('details.overlay[open] > .sheet-panel > .sheet-close').first().click()
  await expect(page.locator('details.overlay[open]')).toHaveCount(0)
  await page.goto(editor(['start']))
  const button = page.locator('[data-field="start options[0].title.en"] textarea')
  await button.click()
  await button.fill('The aside, renamed on its button')
  await expect(status(page)).toContainText(/^Saved \d/)
  expect((await nodeOf(page, cookie, 'start')).options[0]!.title.en).toBe('The aside, renamed on its button')
  expect((await nodeOf(page, cookie, a1)).title.en).toBe('An aside')
})

test('changeTarget points an Answer at an existing Node from the picker, so two Answers reach one Node; the Node it left is an orphan the draft reports (30.6, 30.9)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start', n2]))
  await page.locator('.link-menu--no > .sheet-open').click()
  const menu = page.locator('.structure-form--link').filter({ visible: true })
  await expect(menu.locator('h2')).toHaveText('No')
  await menu.getByRole('button', { name: 'Lead somewhere else' }).click()
  // Every Node of the draft but this one, by title and id, in file order (30.6): the index, never a Node read.
  const ids = await menu.locator('.structure-pick-id').allTextContents()
  expect(ids).toEqual(['start', q1, n2a, n2b, a1, a2].filter((id) => id !== n2))
  await expect(menu.locator('.structure-pick').filter({ hasText: a1 })).toContainText('An aside')
  await menu.locator('.structure-pick').filter({ hasText: q1 }).click()
  await expect(status(page)).toContainText(/^Saved \d/)
  await expect(page.locator('.answer--no')).toHaveAttribute('href', `/admin/trees/${TREE}/start/${n2}/${q1}`)
  expect((await nodeOf(page, cookie, n2)).answers).toEqual({ yes: n2a, no: q1 })
  expect((await nodeOf(page, cookie, 'start')).answers!.yes).toBe(q1)

  // n2b is reached by nothing now: V-REACH, advisory, at the Node (30.9); it is not deleted.
  const orphan = (await advisory(page, cookie)).filter((v) => v.rule === 'V-REACH').map((v) => v.file)
  expect(orphan).toEqual([n2b])
  expect((await nodeOf(page, cookie, n2b)).outcome).toBe('refer')
})

test('createNew from the picker re-points an Answer at a fresh Node and lands there (30.6, 30.2)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start', n2]))
  await page.locator('.link-menu--yes > .sheet-open').click()
  const menu = page.locator('.structure-form--link').filter({ visible: true })
  await menu.getByRole('button', { name: 'Lead somewhere else' }).click()
  await menu.getByRole('button', { name: 'Create a new one' }).click()
  n2c = await landed(page, `/admin/trees/${TREE}/start/${n2}`)
  await expectChoice(page)
  await endHere(page, 'not-applicable')
  await expect(page.locator(`[data-field="${n2c} terminal.outcome"] select`)).toHaveValue('not-applicable')
  expect((await nodeOf(page, cookie, n2)).answers).toEqual({ yes: n2c, no: q1 })
  // n2a joins n2b among the orphans.
  expect((await advisory(page, cookie)).filter((v) => v.rule === 'V-REACH').map((v) => v.file).sort()).toEqual([n2a, n2b].sort())
})

test('deleteStep from the step menu: confirmed with the title, the editor goes to the parent, whose Link to it is gone; with no Trail, to the root (30.8)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  // Re-point n2's yes at n2a again, so n2a is deleted from under its parent and the parent loses a button.
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${n2}`, { op: 'set-answer', answer: 'yes', target: n2a })).status()).toBe(200)
  await fill(page, cookie, n2a, 'Prohibited')
  await page.goto(editor(['start', n2, n2a]))
  await page.locator('.step-menu > .sheet-open').click()
  const menu = page.locator('.structure-form--step')
  await menu.getByRole('button', { name: 'Delete this step' }).click()
  await expect(menu.locator('.structure-confirm')).toHaveText('Delete "Prohibited"? What it led to stays.')
  await menu.getByRole('button', { name: 'Confirm' }).click()
  await page.waitForURL(editor(['start', n2]))
  deleted.push(n2a)
  await expect(page.locator('.answer--yes')).toHaveCount(0)
  await expect(page.locator('.structure--yes')).toHaveClass(/structure--lone/)
  expect((await api(page, cookie, 'GET', `/trees/${TREE}/nodes/${n2a}`)).status()).toBe(404)
  expect((await nodeOf(page, cookie, n2)).answers).toEqual({ no: q1 })

  // Back to n2c, which nothing reaches meanwhile: `set-answer` from the picker, as before.
  await page.locator('.structure--yes').click()
  const filler = await landed(page, `/admin/trees/${TREE}/start/${n2}`)
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${n2}`, { op: 'set-answer', answer: 'yes', target: n2c })).status()).toBe(200)
  // The filler is an orphan now, as is n2b: each deleted from its own page, with no Trail, lands on the root.
  for (const id of [filler, n2b]) {
    await page.goto(editor([id]))
    await expect(page.locator('.up-arrow')).toHaveCount(0)
    await page.locator('.step-menu > .sheet-open').click()
    await page.locator('.structure-form--step').getByRole('button', { name: 'Delete this step' }).click()
    await page.locator('.structure-form--step').getByRole('button', { name: 'Confirm' }).click()
    await page.waitForURL(editor(['start']))
    deleted.push(id)
    expect((await api(page, cookie, 'GET', `/trees/${TREE}/nodes/${id}`)).status()).toBe(404)
  }
  expect((await advisory(page, cookie)).filter((v) => v.rule === 'V-REACH')).toEqual([])
})

test('removeLink removes the Option and leaves its target in the draft as an orphan; linkExisting hangs it back from the picker (30.6, 30.7, 30.9)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start']))
  const item = page.locator('.options > li').filter({ has: page.locator(`.overlay-interior[data-node="${a1}"]`) })
  await item.locator(':scope > .link-menu--option > .sheet-open').click()
  const menu = page.locator('.structure-form--link').filter({ visible: true })
  await expect(menu.locator('h2')).toHaveText('The aside, renamed on its button')
  await menu.getByRole('button', { name: 'Remove this link' }).click()
  await expect(status(page)).toContainText(/^Saved \d/)
  await expect(page.locator(`.overlay-interior[data-node="${a1}"]`)).toHaveCount(0)
  expect((await nodeOf(page, cookie, 'start')).options).toEqual([])
  expect((await nodeOf(page, cookie, a1)).title.en).toBe('An aside')
  // a1 and, behind it, a2 are reached by nothing (30.9): an explanation Node no Option names is
  // V-ORPHAN, and what only it led to V-REACH, as the validator words the one cause.
  const todo = await advisory(page, cookie)
  expect(todo.filter((v) => v.rule === 'V-ORPHAN').map((v) => v.file)).toEqual([a1])
  expect(todo.filter((v) => v.rule === 'V-REACH').map((v) => v.file)).toEqual([a2])

  await page.locator('.options > li.options-add > .side-add > .sheet-open').click()
  const form = page.locator('.structure-form--side').filter({ visible: true })
  await form.getByRole('button', { name: 'Link an existing one' }).click()
  await form.locator('.structure-pick').filter({ hasText: a1 }).click()
  await expect(status(page)).toContainText(/^Saved \d/)
  await expect(page.locator(`.overlay-interior[data-node="${a1}"]`)).toHaveCount(1)
  // The Option's title is the aside's, as the picker showed it (30.6); nothing was copied but that.
  expect((await nodeOf(page, cookie, 'start')).options).toEqual([{ title: { en: 'An aside' }, target: a1 }])
  expect((await advisory(page, cookie)).filter((v) => v.rule === 'V-REACH' || v.rule === 'V-ORPHAN')).toEqual([])
})

test('a Node with Options cannot end: the Sheet shows the refusal and the Node is unchanged (30.3)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor([a1]))
  await expectChoice(page)
  await endHere(page, 'refer')
  const error = page.locator('.structure-form--end .structure-error')
  await expect(error).toBeVisible()
  await expect(error).not.toHaveText('')
  console.log(`refused end on a Node with Options: ${await error.textContent()}`)
  await expect(page.locator('.structure-form--end')).toBeVisible()
  expect((await nodeOf(page, cookie, a1)).outcome).toBeUndefined()
})

test('the ninth Option’s + is absent: the full Node with eight Options has no side-bubble + and every button its link menu (30.4, 30.6)', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await expect(page.locator('.options > li')).toHaveCount(8)
  await expect(page.locator('.options > li.options-add')).toHaveCount(0)
  await expect(page.locator('.link-menu--option')).toHaveCount(8)
  // Each of the eight Overlays' lists still has its own `+` (30.5).
  await expect(page.locator('.side-add--list')).toHaveCount(8)
  // An Overlay's list gains `+ newSideBubble` (30.5), and an explanation Node that is the centre gets the fan's `+` and the three buttons (30.1, 30.4).
  await page.goto(`${origin}/admin/trees/hidden-draft/full/opt-one`)
  await expect(page.locator('details.overlay[open] .side-add--list')).toHaveCount(1)
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
