/**
 * **[#147]** A Tree's languages changed after creation, in a browser (docs/specs/application.md
 * 22.2, 33.5): English added to a complete Dutch Tree in the top panel, the to-do count
 * rising by the number of localised texts -- reconciled against `draft.json` read from disk --
 * the rim's tag for the new language on a Dutch field, one English title written, Publish
 * refused until every text is written and accepted after; then English made the default and
 * Dutch removed after the panel asked once and named the texts that go.
 *
 * Against a data directory of its own on a server of this file's own. The tests run in
 * order: each leaves the Tree as the next expects it. The screenshots the issue asks for go
 * to `docs/screenshots/issue-147/` under `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Page } from '@playwright/test'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-147') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 150

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const TREE = 'nl-boom'

let origin: string
let dataDir: string
/** The ids of the Tree's two Terminals, made in the first test. */
const ends: string[] = []

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  dataDir = await buildDataDir({ trees: [], accounts: [ANNA] })
  origin = await serveStore(dataDir, PORT, ADMIN_ENV)
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
  const { status, cookie } = await login(page, origin, ANNA.email, ANNA.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

const button = (page: Page) => page.locator('.panel-sheet > .sheet-open')
const panel = (page: Page) => page.locator('.panel-sheet > .sheet-panel')
const tags = (page: Page) => panel(page).locator('.new-tree-tag-name')
const field = (page: Page, nodeId: string, keyPath: string) => page.locator(`[data-field="${nodeId} ${keyPath}"]`).filter({ visible: true })
const publishSwitch = (page: Page) => panel(page).getByRole('switch')
/** **[#176]** The to-do control and its bubble, at the top right beside the panel's button (33.3). */
const todo = (page: Page) => page.locator('.todo-sheet > .sheet-open')
const todoBubble = (page: Page) => page.locator('.todo-sheet > .sheet-panel')
const things = (count: number): string => `${count} ${count === 1 ? 'thing' : 'things'} to do`

async function openPanel(page: Page): Promise<void> {
  const reread = page.waitForResponse((response) => response.url().endsWith('/admin/api/accounts'))
  await button(page).click()
  await expect(panel(page)).toBeVisible()
  await reread
}

/** Opens the to-do bubble once it has re-read the list (33.3). */
async function openTodo(page: Page): Promise<void> {
  const reread = page.waitForResponse((response) => new URL(response.url()).pathname === `/admin/api/trees/${TREE}`)
  await todo(page).click()
  await expect(todoBubble(page)).toBeVisible()
  await reread
}

/** The advisory count the Tree's entry answers: what the to-do control shows (33.3). */
async function advisory(page: Page, cookie: string): Promise<number> {
  return ((await (await api(page, cookie, 'GET', `/trees/${TREE}`)).json()) as { advisory: unknown[] }).advisory.length
}

/**
 * The localised texts of `draft.json` as the file holds them, counted without the store: every
 * object whose keys are all declared languages, and how many of them hold an empty string for `lang`.
 */
async function textsOnDisk(lang: string): Promise<{ texts: number; empty: number }> {
  const draft = JSON.parse(await readFile(path.join(dataDir, 'trees', TREE, 'draft.json'), 'utf8')) as { languages: string[] }
  const declared = new Set(draft.languages)
  let texts = 0
  let empty = 0
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk)
    if (typeof value !== 'object' || value === null) return
    const keys = Object.keys(value)
    if (keys.length > 0 && keys.every((key) => declared.has(key))) {
      texts += 1
      if ((value as Record<string, string>)[lang] === '') empty += 1
      return
    }
    Object.values(value).forEach(walk)
  }
  walk(draft)
  return { texts, empty }
}

test('a complete Dutch Tree: English added in the panel, one to-do per localised text, and the rim tags each field', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  // A question with two Answers, each a Terminal: complete in Dutch, publishable as it is.
  expect((await api(page, cookie, 'POST', '/trees', { id: TREE, languages: ['nl'], title: { nl: 'Een boom' } })).status()).toBe(201)
  const fill = async (node: string, words: string): Promise<void> => {
    expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${node}`, { path: 'title.nl', value: words })).status()).toBe(200)
    expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${node}`, { path: 'description.nl', value: `Over ${words}.` })).status()).toBe(200)
  }
  await fill('start', 'Is het zo')
  for (const [link, words] of [['yes', 'Van toepassing'], ['no', 'Niet van toepassing']] as const) {
    const created = (await (await api(page, cookie, 'POST', `/trees/${TREE}/nodes`, { from: { node: 'start', link: 'answer', label: { nl: link === 'yes' ? 'Ja' : 'Nee' } } })).json()) as { node: { id: string } }
    ends.push(created.node.id)
    await fill(created.node.id, link === 'yes' ? 'Ja dus' : 'Nee dus')
    expect((await api(page, cookie, 'POST', `/trees/${TREE}/nodes`, { from: { node: created.node.id, link: 'end', label: { nl: words } } })).status()).toBe(201)
  }
  expect(await advisory(page, cookie)).toBe(0)

  await page.goto(`${origin}/admin/trees/${TREE}/start`)
  await openPanel(page)
  await expect(tags(page)).toHaveText(['nl'])
  // The default and last language has no cross (33.5).
  await expect(panel(page).locator('.new-tree-remove')).toHaveCount(0)
  await shoot(page, 'languages-add-control')

  const before = await advisory(page, cookie)
  await panel(page).locator('.new-tree-add').getByRole('button', { name: 'en', exact: true }).click()
  await expect(tags(page)).toHaveText(['nl', 'en'])
  const disk = await textsOnDisk('en')
  const after = await advisory(page, cookie)
  console.log(`to-do count before adding en: ${before}; after: ${after}; localised texts in draft.json: ${disk.texts}, of which empty in en: ${disk.empty}`)
  expect(disk.empty).toBe(disk.texts)
  expect(after - before).toBe(disk.texts)
  // The page speaks Dutch, the Tree's default: the count leads the control's name in either language.
  await expect(todo(page)).toHaveAccessibleName(new RegExp(`^${after} `))
  await page.keyboard.press('Escape')
  await expect(panel(page)).toBeHidden()
  await openTodo(page)
  await expect(todoBubble(page).locator('.todo-list li')).toHaveCount(after)
  await expect(todoBubble(page).locator('.todo-list li[data-rule="V-L10N"]')).toHaveCount(disk.texts)
  await shoot(page, 'languages-todo-after-adding')

  // The rim of a Dutch field now carries the English tag (28.3), which leads to the English page.
  await page.keyboard.press('Escape')
  await expect(todoBubble(page)).toBeHidden()
  await field(page, 'start', 'title.nl').locator('textarea').click()
  const tag = page.locator('.editor-tag')
  await expect(tag).toHaveText('en')
  await expect(tag).toHaveAttribute('href', `/admin/trees/${TREE}/start?lang=en`)
})

test('one English title written is one to-do fewer; Publish is refused until every English text is written', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  const before = await advisory(page, cookie)
  await page.goto(`${origin}/admin/trees/${TREE}/start?lang=en`)
  const title = field(page, 'start', 'title.en').locator('textarea')
  await title.click()
  await title.fill('Is it so')
  await expect(page.getByRole('status')).toContainText(/^Saved \d/)
  await expect(button(page)).toHaveAccessibleName('Decision-tree settings: Hidden')
  await expect(todo(page)).toHaveAccessibleName(things(before - 1))

  await openPanel(page)
  await publishSwitch(page).click()
  const pointer = panel(page).getByRole('alert')
  await expect(pointer).toBeVisible()
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await pointer.getByRole('button', { name: 'See what to do' }).click()
  await expect(todoBubble(page).locator('.todo-list li').first()).toBeVisible()
  expect((await page.request.get(`${origin}/${TREE}/start`)).status()).toBe(404)

  // Every other English text written, the same switch publishes.
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}`, { path: 'title.en', value: 'A tree' })).status()).toBe(200)
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/start`, { path: 'description.en', value: 'About it.' })).status()).toBe(200)
  for (const end of ends) {
    for (const key of ['title.en', 'description.en']) {
      expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${end}`, { path: key, value: `${key} of ${end}` })).status()).toBe(200)
    }
    // **[#179]** A Terminal's words are one English text more (22.2).
    expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${end}`, { path: 'terminal.label.en', value: 'It ends here' })).status()).toBe(200)
  }
  expect(await advisory(page, cookie)).toBe(0)
  await page.reload()
  await openPanel(page)
  await publishSwitch(page).click()
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'true')
  expect((await page.request.get(`${origin}/${TREE}/start?lang=en`)).status()).toBe(200)
})

test('English made the default moves the page to its address; Dutch removed after the panel names the texts that go', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(`${origin}/admin/trees/${TREE}/start?lang=en`)
  await openPanel(page)
  await panel(page).locator('.new-tree-tag[data-language="en"]').getByRole('button', { name: 'Make default' }).click()
  // English is the default now: its address carries no `lang` (4.1).
  await expect(page).toHaveURL(`${origin}/admin/trees/${TREE}/start`)
  await openPanel(page)
  await expect(tags(page)).toHaveText(['en', 'nl'])
  await expect(panel(page).locator('.new-tree-tag[data-language="en"] .new-tree-remove')).toHaveCount(0)

  const written = ((await (await api(page, cookie, 'GET', `/trees/${TREE}`)).json()) as { written: Record<string, number> }).written
  const dutch = await textsOnDisk('nl')
  console.log(`written texts per language from the entry: ${JSON.stringify(written)}; localised texts in draft.json: ${dutch.texts}, empty in nl: ${dutch.empty}`)
  expect(written.nl).toBe(dutch.texts - dutch.empty)

  await panel(page).getByRole('button', { name: 'Remove nl' }).click()
  const ask = panel(page).locator('.panel-ask[data-removing="nl"]')
  await expect(ask).toHaveText(new RegExp(`^Remove nl\\? The ${written.nl} texts written in it will be deleted\\.`))
  await shoot(page, 'languages-confirm-remove')
  await ask.getByRole('button', { name: 'Cancel' }).click()
  await expect(tags(page)).toHaveText(['en', 'nl'])

  await panel(page).getByRole('button', { name: 'Remove nl' }).click()
  await panel(page).locator('.panel-ask').getByRole('button', { name: 'Confirm' }).click()
  await expect(tags(page)).toHaveText(['en'])
  expect((await textsOnDisk('en')).texts).toBe(dutch.texts)
  expect(await readFile(path.join(dataDir, 'trees', TREE, 'draft.json'), 'utf8')).not.toContain('"nl"')
  // Still valid in full, so the public copy followed (19.4): no Dutch page is served any more.
  await expect(button(page)).toHaveAccessibleName('Decision-tree settings: Published')
  expect(await (await page.request.get(`${origin}/${TREE}/start`)).text()).toContain('Is it so')
})
