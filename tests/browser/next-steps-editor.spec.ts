/**
 * **[#222]** The creator chooses how many next steps a step has, in a browser (docs/specs/
 * application.md 41.7, 41.9; ADR-220-editing-next-steps): on a new step the row offers four
 * outlined buttons, `+ Yes`, `treeEndsHere`, `+ No` and `+`, each an equal share of it; `+` asks
 * for the words on the button in a Sheet, typing stopping at 19, and goes to the step it made;
 * beside one next step the one-click word it lacks stands before `+`; the step is given its
 * second, third and fourth next step, and the `+` is gone at four; each button's words are a field
 * in place, in the language edited, held to 19 live; the move arrows reorder them; a fifth is
 * refused; a next step goes with the step it leads to, through that step's red cross, the others
 * keeping their order, and a step left with one lists "fewer than two next steps" among its
 * to-dos; and the preview draws that one button, centred, an empty label as the bracketed
 * placeholder (40.7).
 *
 * One story, in order, on a Tree of this file's own in English and Dutch. The screenshots the
 * issue asks for -- a new step, a step of four at 1280 x 640, 360 x 640 and at 321 x 640, the
 * narrowest width above the floor, in both languages -- go to `docs/screenshots/issue-222/`
 * under `ELSA_SHOTS=1`, and to the results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Page } from '@playwright/test'
import type { DraftNode, Violation } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-222') : path.join(repo, 'tests', 'browser', '.results', 'shots-222')
const PORT = BASE_PORT + 222

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const TREE = 'chosen'
/** A new Node's id is the server's: `n-` and six base32 characters (22.4). */
const NEW_ID = /n-[a-z2-7]{6}/

let origin: string

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  origin = await serveStore(await buildDataDir({ trees: [], accounts: [ANNA] }), PORT, ADMIN_ENV)
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

/** A page logged in as Anna, at `width` x `height`, and the cookie for API calls of its own. */
async function loggedIn(browser: Browser, width = 1280, height = 640): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage()
  const { status, cookie } = await login(page, origin, ANNA.email, ANNA.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function nodeOf(page: Page, cookie: string, id: string): Promise<DraftNode> {
  const response = await api(page, cookie, 'GET', `/trees/${TREE}/nodes/${id}`)
  expect(response.status(), `GET ${id}`).toBe(200)
  return ((await response.json()) as { node: DraftNode }).node
}

const editor = (ids: string[], lang = 'en') => `${origin}/admin/trees/${TREE}/${ids.join('/')}${lang === 'en' ? '' : `?lang=${lang}`}`
const row = (page: Page) => page.locator('.tree-frame:not([aria-hidden]) .answers')
const steps = (page: Page) => row(page).locator(':scope > .answer--next')
/** The `+` of the row and its Sheet's page (41.7 items 1 and 2). */
const plus = (page: Page) => row(page).locator(':scope > .structure-add > .sheet-open')
const form = (page: Page) => page.locator('.structure-form--next')
/** The textarea of a next step's words in `lang` (41.7 item 2). */
const words = (page: Page, index: number, lang = 'en') => page.locator(`[data-field="start answers[${index}].label.${lang}"] textarea`)

/**
 * What the row's buttons say, in order: a next step's words as its field holds them, and the
 * words of each button the editor offers beside them -- a Sheet's, its control's; `startAgain`,
 * hidden behind them, is not one.
 */
const said = (page: Page): Promise<string[]> =>
  row(page)
    .locator(':scope > :not(.answer--start-again)')
    .evaluateAll((buttons) => buttons.map((button) => button.querySelector('textarea')?.value ?? (button.querySelector(':scope > .sheet-open') ?? button).textContent!.trim()))

/** Waits for the plain navigation a creation makes: to an address one id longer than `from` (30.2). */
async function landed(page: Page, from: string): Promise<string> {
  await page.waitForURL((url) => url.pathname.startsWith(`${from}/`) && url.pathname.split('/').length === from.split('/').length + 1)
  const id = new URL(page.url()).pathname.split('/').pop() ?? ''
  expect(id).toMatch(NEW_ID)
  return id
}

/** Opens `+`, types `text` key by key into the Sheet's one field and confirms with Enter (41.7 items 1 to 3). */
async function addNextStep(page: Page, text: string): Promise<string> {
  await plus(page).click()
  await expect(form(page).getByRole('textbox')).toBeFocused()
  await page.keyboard.type(text, { delay: 5 })
  await page.keyboard.press('Enter')
  return landed(page, `/admin/trees/${TREE}/start`)
}

/**
 * Every button of the row is the same width, an equal share of it (41.3, 41.7 item 8); answers
 * their middles, one per row: the row centres buttons whose words take more lines than another's.
 */
async function equalShares(page: Page, buttons: number): Promise<number[]> {
  const boxes = await row(page)
    .locator(':scope > .answer--next, :scope > .structure, :scope > .structure-end, :scope > .structure-add')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect()).map((box) => ({ width: box.width, middle: box.top + box.height / 2 })))
  expect(boxes).toHaveLength(buttons)
  for (const box of boxes) expect(Math.abs(box.width - boxes[0]!.width), `widths ${boxes.map((b) => b.width).join(', ')}`).toBeLessThanOrEqual(1)
  return [...new Set(boxes.map((box) => Math.round(box.middle)))]
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

/** The story's next steps, in the order they were made. */
const made: string[] = []

test('a new step offers + Yes, Tree ends here, + No and +, four alike in one row at 1280 and two a row below 1000 (41.7 items 1 and 8)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  expect((await api(page, cookie, 'POST', '/trees', { id: TREE, languages: ['en', 'nl'], title: { en: 'Chosen by its creator', nl: 'Gekozen door de maker' } })).status()).toBe(201)
  await page.goto(editor(['start']))
  await expect(row(page).locator(':scope > .structure--yes')).toHaveText('+ Yes')
  await expect(row(page).locator(':scope > .structure-end > .sheet-open')).toHaveText('Tree ends here')
  await expect(row(page).locator(':scope > .structure--no')).toHaveText('+ No')
  await expect(plus(page)).toHaveText('+')
  await expect(plus(page)).toHaveAccessibleName('Add a next step')
  await expect(row(page).locator(':scope > .answer--start-again')).toBeHidden()
  await expect(row(page)).toHaveClass(/\banswers--4\b/)
  expect(await equalShares(page, 4)).toHaveLength(1)
  for (const lang of ['en', 'nl']) {
    for (const [width, height] of [
      [1280, 640],
      [360, 640],
    ] as const) {
      await page.setViewportSize({ width, height })
      await page.goto(editor(['start'], lang))
      await expect(plus(page)).toBeVisible()
      // Two a row below 1000 pixels: the four in two rows of two (41.3).
      expect(await equalShares(page, 4)).toHaveLength(width < 1000 ? 2 : 1)
      await shoot(page, `new-step-${lang}-${width}x${height}`)
    }
  }
  await expect(row(page).locator(':scope > .structure--yes')).toHaveText('+ Ja')
  await expect(plus(page)).toHaveAccessibleName('Volgende stap toevoegen')
})

test('+ asks for the words on the button, typing stopping at 19, and makes the next step with them, every other language empty, going to it (41.7 items 1 and 3)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start']))
  await plus(page).click()
  const field = form(page).getByRole('textbox', { name: 'Words on the button' })
  await expect(form(page).getByRole('heading')).toHaveText('Add a next step')
  await expect(field).toBeFocused()
  await expect(field).toHaveAttribute('placeholder', 'Words on the button')
  await expect(form(page).locator('.structure-ending-count')).toHaveText('0 / 19')
  const confirm = form(page).getByRole('button', { name: 'Confirm' })
  await expect(confirm).toBeDisabled()
  // Typing stops at the limit (28.4): the twentieth character does nothing.
  await page.keyboard.type('Only for deployers, really', { delay: 5 })
  await expect(field).toHaveValue('Only for deployers,')
  await expect(form(page).locator('.structure-ending-count')).toHaveText('19 / 19')
  // `cancel` writes nothing, and the Sheet opens empty again.
  await form(page).getByRole('button', { name: 'Cancel' }).click()
  await expect(form(page)).toBeHidden()
  expect((await nodeOf(page, cookie, 'start')).answers).toBeUndefined()
  await plus(page).click()
  await expect(field).toBeFocused()
  await expect(field).toHaveValue('')

  await page.keyboard.type('Not sure', { delay: 5 })
  await page.keyboard.press('Enter')
  made.push(await landed(page, `/admin/trees/${TREE}/start`))
  // The new step is empty and offers the four again (30.2).
  await expect(page.locator('h1 textarea')).toHaveValue('')
  await expect(plus(page)).toBeVisible()
  expect((await nodeOf(page, cookie, 'start')).answers).toEqual([{ label: { en: 'Not sure', nl: '' }, target: made[0] }])
})

test('beside one next step whose words are neither yes nor no, + Yes and + No stand before +; at two and three only +; at four nothing more (41.7 item 2)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start']))
  await expect(steps(page)).toHaveCount(1)
  await expect.poll(() => said(page)).toEqual(['Not sure', '+ Yes', '+ No', '+'])
  await expect(row(page)).toHaveClass(/\banswers--4\b/)
  await expect(row(page).locator(':scope > .structure-end')).toHaveCount(0)

  await row(page).locator(':scope > .structure--yes').click()
  made.push(await landed(page, `/admin/trees/${TREE}/start`))
  await page.goto(editor(['start']))
  await expect.poll(() => said(page)).toEqual(['Not sure', 'Yes', '+'])
  await expect(row(page)).toHaveClass(/\banswers--3\b/)
  expect(await equalShares(page, 3)).toHaveLength(1)

  made.push(await addNextStep(page, 'Maybe'))
  await page.goto(editor(['start']))
  await expect.poll(() => said(page)).toEqual(['Not sure', 'Yes', 'Maybe', '+'])

  made.push(await addNextStep(page, 'Notwithstandingness'))
  await page.goto(editor(['start']))
  await expect.poll(() => said(page)).toEqual(['Not sure', 'Yes', 'Maybe', 'Notwithstandingness'])
  await expect(row(page).locator(':scope > .structure, :scope > .structure-end, :scope > .structure-add')).toHaveCount(0)
  await expect(row(page)).toHaveClass(/\banswers--4\b/)
  expect(await equalShares(page, 4)).toHaveLength(1)
  expect((await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.target)).toEqual(made)
  expect((await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.label)).toEqual([
    { en: 'Not sure', nl: '' },
    { en: 'Yes', nl: 'Ja' },
    { en: 'Maybe', nl: '' },
    { en: 'Notwithstandingness', nl: '' },
  ])
})

test('**[#232]** a fifth next step is stored and stands in the row as 42.3 stands five, with no +; a sixth is refused with V-ANSWERS and stores nothing (42.1, 42.6)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  const fifth = await api(page, cookie, 'POST', `/trees/${TREE}/nodes`, { from: { node: 'start', link: 'answer', label: { en: 'A fifth' } } })
  expect(fifth.status()).toBe(201)
  const id = ((await fifth.json()) as { node: { id: string } }).node.id
  expect((await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.target)).toEqual([...made, id])
  // Until #233 the editor offers no + at four, and a step of five stands as 42.3 stands it.
  await page.goto(editor(['start']))
  await expect.poll(() => said(page)).toEqual(['Not sure', 'Yes', 'Maybe', 'Notwithstandingness', 'A fifth'])
  await expect(row(page)).toHaveClass(/\banswers--5\b/)
  expect(await equalShares(page, 5)).toHaveLength(1)
  await page.setViewportSize({ width: 999, height: 640 })
  await page.reload()
  await expect(row(page)).toHaveClass(/\banswers--5\b/)
  expect(await equalShares(page, 5)).toHaveLength(2)

  const sixth = await api(page, cookie, 'POST', `/trees/${TREE}/nodes`, { from: { node: 'start', link: 'answer', label: { en: 'A sixth' } } })
  expect(sixth.status()).toBe(422)
  expect(((await sixth.json()) as { violations: Violation[] }).violations.map((violation) => violation.rule)).toEqual(['V-ANSWERS'])
  expect((await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.target)).toEqual([...made, id])

  // The fifth goes with its step, so the tests after this one find the four they made.
  expect((await api(page, cookie, 'DELETE', `/trees/${TREE}/nodes/${id}`)).status()).toBe(200)
  expect((await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.target)).toEqual(made)
})

test('each next step\'s words are a field on its button, in the language edited, held to 19 live; a click in it edits and does not follow the button (41.7 item 2)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start'], 'nl'))
  // The Dutch words of the three made by `+` are empty: the field says what belongs in it.
  await expect(words(page, 0, 'nl')).toHaveValue('')
  await expect(words(page, 0, 'nl')).toHaveAttribute('placeholder', 'Woorden op de knop')
  await expect(words(page, 1, 'nl')).toHaveValue('Ja')
  for (const [index, text] of [
    [0, 'Weet niet'],
    [2, 'Misschien'],
    [3, 'Desalniettemin'],
  ] as const) {
    await words(page, index, 'nl').click()
    await page.keyboard.type(text, { delay: 5 })
    await words(page, index, 'nl').blur()
  }
  await expect(page.getByRole('status')).toContainText(/^Opgeslagen \d|^Saved \d/)
  expect(page.url()).toBe(editor(['start'], 'nl'))
  await expect.poll(async () => (await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.label.nl)).toEqual(['Weet niet', 'Ja', 'Misschien', 'Desalniettemin'])

  await page.goto(editor(['start']))
  const maybe = words(page, 2)
  await maybe.click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('Only for deployers, really', { delay: 5 })
  await expect(maybe).toHaveValue('Only for deployers,')
  await expect(page.locator('.editor-pill').filter({ visible: true })).toContainText('19 / 19')
  await maybe.blur()
  await expect(page.getByRole('status')).toContainText(/^Saved \d/)
  expect(page.url()).toBe(editor(['start']))
  expect((await nodeOf(page, cookie, 'start')).answers![2]!.label).toEqual({ en: 'Only for deployers,', nl: 'Misschien' })
  // The button is still named by its words and where it leads (41.2).
  await page.reload()
  await expect(steps(page).nth(2)).toHaveAccessibleName('Only for deployers,: [Text missing in this language]')
})

test('the move arrows: none earlier on the first, none later on the last; each sends move-answer and the row repaints in the new order (41.7 item 4)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start']))
  const earlier = (index: number) => steps(page).nth(index).locator(':scope > .answer-move--earlier')
  const later = (index: number) => steps(page).nth(index).locator(':scope > .answer-move--later')
  await expect(earlier(0)).toHaveCount(0)
  await expect(later(3)).toHaveCount(0)
  for (const index of [1, 2, 3]) await expect(earlier(index)).toHaveAccessibleName('Move earlier')
  for (const index of [0, 1, 2]) await expect(later(index)).toHaveAccessibleName('Move later')
  // 24-pixel rounds inside the button's outline at its ends, clear of its words' field (41.7 item 4;
  // the owner's standard of #181: no control over another, none across its box).
  for (const index of [0, 1, 2, 3]) {
    const button = (await steps(page).nth(index).boundingBox())!
    const field = (await words(page, index).boundingBox())!
    for (const arrow of [earlier(index), later(index)]) {
      if ((await arrow.count()) === 0) continue
      const round = (await arrow.boundingBox())!
      expect([round.width, round.height]).toEqual([24, 24])
      expect(round.x >= button.x && round.x + round.width <= button.x + button.width && round.y >= button.y && round.y + round.height <= button.y + button.height, `arrow inside button ${index}`).toBe(true)
      expect(Math.abs(round.y + round.height / 2 - (button.y + button.height / 2))).toBeLessThanOrEqual(1)
      expect(round.x + round.width <= field.x || field.x + field.width <= round.x, `arrow clear of the field of button ${index}`).toBe(true)
    }
  }

  await later(0).click()
  await expect(steps(page).nth(0)).toHaveAttribute('href', `/admin/trees/${TREE}/start/${made[1]}`)
  await expect(steps(page).nth(1)).toHaveAttribute('href', `/admin/trees/${TREE}/start/${made[0]}`)
  // A click on an arrow does not follow the button it is on.
  expect(page.url()).toBe(editor(['start']))
  expect((await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.target)).toEqual([made[1], made[0], made[2], made[3]])
  await expect(words(page, 0)).toHaveValue('Yes')
  await expect(words(page, 1)).toHaveValue('Not sure')
  await expect(earlier(0)).toHaveCount(0)

  await earlier(3).click()
  await expect(steps(page).nth(2)).toHaveAttribute('href', `/admin/trees/${TREE}/start/${made[3]}`)
  expect((await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.target)).toEqual([made[1], made[0], made[3], made[2]])
  await later(1).click()
  await expect(steps(page).nth(1)).toHaveAttribute('href', `/admin/trees/${TREE}/start/${made[3]}`)
  // Now [1, 3, 0, 2] of `made`: three moves put them back, each waited for on the repainted row.
  await earlier(2).click()
  await expect(steps(page).nth(1)).toHaveAttribute('href', `/admin/trees/${TREE}/start/${made[0]}`)
  await earlier(1).click()
  await expect(steps(page).nth(0)).toHaveAttribute('href', `/admin/trees/${TREE}/start/${made[0]}`)
  await later(2).click()
  await expect(steps(page).nth(3)).toHaveAttribute('href', `/admin/trees/${TREE}/start/${made[3]}`)
  // Back as made, the words with their steps.
  await expect.poll(async () => (await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.target)).toEqual(made)
  await page.reload()
  await expect.poll(() => said(page)).toEqual(['Not sure', 'Yes', 'Only for deployers,', 'Notwithstandingness'])
})

test('screenshots for the pull request: a step of four at 1280 x 640, 360 x 640 and 321 x 640, in both languages (41.9)', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  for (const lang of ['en', 'nl']) {
    for (const [width, height] of [
      [1280, 640],
      [360, 640],
      [321, 640],
    ] as const) {
      await page.setViewportSize({ width, height })
      await page.goto(editor(['start'], lang))
      await expect(steps(page)).toHaveCount(4)
      expect(await equalShares(page, 4)).toHaveLength(width < 1000 ? 2 : 1)
      await shoot(page, `four-next-steps-${lang}-${width}x${height}`)
    }
  }
})

test('a next step goes with the step it leads to, through its red cross; the others keep their order, + is back, and a step left with one lists "fewer than two next steps" (41.7 item 5)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  const remove = async (id: string): Promise<void> => {
    await page.goto(editor(['start', id]))
    await page.getByRole('button', { name: 'Delete this step' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm' }).click()
    await page.waitForURL(editor(['start']))
  }
  await remove(made[2]!)
  await expect.poll(() => said(page)).toEqual(['Not sure', 'Yes', 'Notwithstandingness', '+'])
  expect((await nodeOf(page, cookie, 'start')).answers!.map((answer) => answer.target)).toEqual([made[0], made[1], made[3]])
  await remove(made[0]!)
  await remove(made[3]!)
  // One left, Yes: the one-click + No for the word it lacks, then + (41.7 item 2).
  await expect.poll(() => said(page)).toEqual(['Yes', '+ No', '+'])
  expect((await nodeOf(page, cookie, 'start')).answers).toEqual([{ label: { en: 'Yes', nl: 'Ja' }, target: made[1] }])

  const todo = page.locator('.todo-sheet')
  await todo.locator(':scope > .sheet-open').click()
  // V-ANSWERS' other line is its target's kind: the Yes step is empty yet, no question and no end.
  const line = todo.locator('.todo-list li[data-rule="V-ANSWERS"]').filter({ hasText: 'fewer than two next steps' })
  await expect(line).toHaveCount(1)
  await expect(line.locator('a')).toHaveAttribute('href', `/admin/trees/${TREE}/start`)
})

test('the preview draws a step of one next step as its one button, centred, and an empty label in the language shown as the bracketed placeholder (41.7 item 7, 40.7)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/start`, { path: 'answers[0].label.nl', value: '' })).status()).toBe(200)
  for (const [lang, label] of [
    ['en', 'Yes'],
    ['nl', '[Tekst ontbreekt in deze taal]'],
  ] as const) {
    await page.goto(`${origin}/admin/preview/${TREE}/start${lang === 'en' ? '' : '?lang=nl'}`)
    const button = steps(page)
    await expect(button).toHaveCount(1)
    await expect(button.locator('.branch-title')).toHaveText(label)
    await expect(row(page).locator('.structure, .structure-add, .answer-move, .editor-field')).toHaveCount(0)
    const [lone, whole] = [(await button.boundingBox())!, (await row(page).boundingBox())!]
    expect(Math.abs(lone.x + lone.width / 2 - (whole.x + whole.width / 2))).toBeLessThanOrEqual(1)
  }
})
