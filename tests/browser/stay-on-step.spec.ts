/**
 * **[#243]** Creating a next step keeps the editor on the step, in a real browser
 * (docs/specs/application.md 42.7 item 3, 42.8; ADR-243-stay-on-the-step): the `+` Sheet's
 * `confirm`, the switch off, closes the Sheet, and the new next step's button stands in the row,
 * its words a field in place, while the address stays the step's own. The focus goes where Escape
 * puts it, on the `+`, or at five, where no `+` stands, on the new button's words. A title typed
 * just before is in the store; the store holds the new Answer last. Following the new button then
 * slides to the new step, as its siblings' buttons do.
 *
 * At 1280 x 640 and at 999 x 640, on a step without Links (a new Tree's first step), a step of
 * three next steps and a step of four, each on a Tree of its own. The counts of next steps before
 * and after each creation, read back from the store, go to `tests/browser/.results/stay-on-step.md`;
 * the screenshot of the row right after `confirm` goes to `docs/screenshots/issue-243/` under
 * `ELSA_SHOTS=1`, and to the results folder otherwise (35.7).
 */
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import type { DraftNode } from '../../src/tree/types.ts'
import { ADMIN_EMAIL, ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { arrived } from './arrived.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-243') : path.join(RESULTS, 'shots-243')
const PORT = BASE_PORT + 243
const fixture = (name: string) => path.join(repo, 'tests', 'fixtures', name)

/** The guarantee, and a width below 1000, where three to five buttons stand in two rows (42.3). */
const WINDOWS = [
  [1280, 640],
  [999, 640],
] as const
/** The steps a next step is made on: a new Tree's first step, without Links; a step of three; a step of four. */
const STEPS = [
  { kind: 'empty', step: 'start', before: 0 },
  { kind: 'three', step: 'full', before: 3 },
  { kind: 'four', step: 'full', before: 4 },
] as const
const treeOf = (kind: string, width: number) => `${kind}-${width}`

let origin: string
let cookie: string

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const trees = WINDOWS.flatMap(([width]) => [
    { folder: fixture('three-next-steps'), id: treeOf('three', width) },
    { folder: fixture('full-node'), id: treeOf('four', width) },
  ])
  origin = await serveStore(await buildDataDir({ trees, accounts: [] }), PORT, ADMIN_ENV)
  await writeFile(path.join(RESULTS, 'stay-on-step.md'), '| Window | Step | Next steps before | After | Last Answer |\n|---|---|---|---|---|\n')
})

test.afterAll(stopServers)

test.beforeEach(async ({ page }) => {
  const session = await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
  expect(session.status).toBe(204)
  cookie = session.cookie
})

/** A request as the editor's script sends it: this origin, the session cookie, JSON. */
function api(page: Page, method: string, route: string, data?: unknown) {
  return page.request.fetch(`${origin}/admin/api${route}`, {
    method,
    headers: { Origin: origin, Cookie: cookie, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    data: data === undefined ? undefined : JSON.stringify(data),
  })
}

/** `GET /admin/api/trees/<tree>/nodes/<id>`: the store's copy of a draft Node. */
async function stored(page: Page, tree: string, id: string): Promise<DraftNode> {
  const response = await api(page, 'GET', `/trees/${tree}/nodes/${id}`)
  expect(response.status(), `GET ${tree}/${id}`).toBe(200)
  return ((await response.json()) as { node: DraftNode }).node
}

/** The centre's Answer row, outside the inert neighbour frames of a slide. */
const row = (page: Page) => page.locator('.tree-frame:not([aria-hidden]) .answers')
const nextStep = (page: Page, index: number) => row(page).locator(':scope > .answer--next').nth(index)
/** The `+` Sheet (a `<details>`) and its control (42.7 items 1 and 2). */
const sheet = (page: Page) => row(page).locator(':scope > .structure-add')
const plus = (page: Page) => sheet(page).locator(':scope > .sheet-open')
/** The textarea of a next step's words in English (41.7 item 2). */
const words = (page: Page, step: string, index: number) => page.locator(`[data-field="${step} answers[${index}].label.en"] textarea`)

/** Clicks a next step's button on its own outline, 4 pixels inside its top edge: the middle is its words' field (42.8). */
async function clickButton(page: Page, index: number): Promise<void> {
  const box = (await nextStep(page, index).boundingBox())!
  await nextStep(page, index).click({ position: { x: box.width / 2, y: 4 } })
}

/** Whether a slide started on this page since the call: the layer marked `data-sliding` at any moment. */
async function watchSlides(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen = window as unknown as { slid: boolean }
    seen.slid = false
    new MutationObserver(() => {
      if (document.querySelector('.tree-layer[data-sliding]')) seen.slid = true
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-sliding'], childList: true })
  })
}
const slid = (page: Page) => page.evaluate(() => (window as unknown as { slid: boolean }).slid)

for (const [width, height] of WINDOWS) {
  for (const { kind, step, before } of STEPS) {
    const after = before + 1
    test(`${width} x ${height}, a step of ${before} next steps: confirm closes the Sheet and the new button stands in the row, on the same page; following it slides to the new step (42.7 item 3, 42.8)`, async ({ page }) => {
      const tree = treeOf(kind, width)
      if (kind === 'empty') {
        expect((await api(page, 'POST', '/trees', { id: tree, languages: ['en', 'nl'], title: { en: 'Stays on the step', nl: 'Blijft op de stap' } })).status()).toBe(201)
      }
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}/admin/trees/${tree}/${step}`)
      const address = page.url()
      expect((await stored(page, tree, step)).answers ?? []).toHaveLength(before)

      // A title typed just before the `+`: its write waits in the queue, ahead of the creation (29.2).
      const title = `Typed before the + at ${width}`
      const titleField = page.locator(`[data-field="${step} title.en"] textarea`)
      await titleField.fill('')
      await titleField.pressSequentially(title, { delay: 2 })
      await plus(page).click()
      const field = page.locator('.structure-form').filter({ visible: true }).getByRole('textbox')
      await expect(field).toBeFocused()
      const text = `Step ${after} here`
      await page.keyboard.type(text, { delay: 5 })
      const created = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith(`/trees/${tree}/nodes`))
      await page.keyboard.press('Enter')
      const response = await created
      expect(response.status()).toBe(201)

      // The row has the new button: wait for it, or for the page to have gone where it went before #243.
      await expect.poll(async () => page.url() !== address || (await words(page, step, before).count()) > 0).toBe(true)
      expect(page.url(), 'the address is the step that was being edited').toBe(address)
      const made = ((await response.json()) as { node: DraftNode }).node
      expect(made.id).toMatch(/^n-[a-z2-7]{6}$/)
      await expect(sheet(page).locator(':scope[open]')).toHaveCount(0)
      await expect(words(page, step, before)).toHaveValue(text)
      await expect(row(page).locator(':scope > .answer--next')).toHaveCount(after)
      if (after < 5) {
        // The `+` stays after the new button, and has the focus, as when Escape closes the Sheet.
        await expect(row(page).locator(':scope > :is(.answer--next, .structure-add)').last()).toHaveClass(/\bstructure-add\b/)
        await expect(plus(page)).toBeFocused()
      } else {
        await expect(sheet(page)).toHaveCount(0)
        await expect(words(page, step, before)).toBeFocused()
      }
      if (width === 1280 && kind === 'three') {
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: path.join(SHOTS, `row-after-confirm-${width}x${height}.png`) })
      }

      // The store holds the new Answer last, and the title typed before it.
      const node = await stored(page, tree, step)
      expect(node.answers).toHaveLength(after)
      expect(node.answers!.at(-1)).toEqual({ label: { en: text, nl: '' }, target: made.id })
      expect(node.title.en).toBe(title)
      await appendFile(path.join(RESULTS, 'stay-on-step.md'), `| ${width} x ${height} | ${tree}/${step} | ${before} | ${node.answers!.length} | ${JSON.stringify(node.answers!.at(-1))} |\n`)

      // The new button leads to the new step by the slide, as its siblings' do: the page drawn again placed its frame.
      const href = new URL((await nextStep(page, before).getAttribute('href'))!, page.url()).href
      expect(new URL(href).pathname).toBe(`${new URL(address).pathname}/${made.id}`)
      await expect(nextStep(page, before)).toHaveAttribute('data-slide', /.*/)
      await watchSlides(page)
      await clickButton(page, before)
      await arrived(page, href)
      expect(await slid(page), 'the new button slid').toBe(true)
      await expect(page.locator(`[data-field="${made.id} title.en"] textarea`)).toHaveValue('')
    })
  }
}

test('confirm with the switch on still ends the step on the same page (42.7 item 3, unchanged)', async ({ page }) => {
  const tree = 'ending'
  expect((await api(page, 'POST', '/trees', { id: tree, languages: ['en', 'nl'], title: { en: 'Ends', nl: 'Eindigt' } })).status()).toBe(201)
  await page.goto(`${origin}/admin/trees/${tree}/start`)
  const address = page.url()
  await plus(page).click()
  const form = page.locator('.structure-form').filter({ visible: true })
  await form.getByRole('switch').click()
  await form.getByRole('textbox').fill('It ends')
  await form.getByRole('textbox').press('Enter')
  await expect(sheet(page)).toHaveCount(0)
  expect(page.url()).toBe(address)
  expect((await stored(page, tree, 'start')).label).toEqual({ en: 'It ends', nl: '' })
})
