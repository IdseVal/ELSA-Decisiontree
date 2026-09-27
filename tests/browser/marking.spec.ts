/**
 * **[#141]** Explainers in the editor, in a browser (docs/specs/application.md 32, 35.4;
 * ADR-133-explainers-in-the-editor): "provider" selected in a description and marked writes
 * `[provider](#provider)` and an explainer with that id; both languages are written in the
 * explainer Sheet, and after publishing through #136's route the public page shows the panel
 * on hover; the ninth `mark` is disabled; a 201-character text is stored and shown over the
 * limit at the field with V-LENGTH, and Publish is refused with the same rule id; `unmark` in
 * one language leaves the explainer and the Sheet says `notMarkedIn`, and in the last removes
 * it, so the published `tree.json` has no `explainers` key on the Node.
 *
 * Against a data directory of its own holding `tests/fixtures/explainers` as the hidden Tree
 * `marking`, whose root has eight explainers and whose `no-end` has none. The tests run in
 * order, each from the state the one before left. The screenshots the issue asks for go to
 * `docs/screenshots/issue-141/` under `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { cp, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Page } from '@playwright/test'
import type { DraftNode } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-141') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 105

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }

const EN_DESCRIPTION = 'Are you a provider of an AI system?'
const NL_DESCRIPTION = 'Bent u een aanbieder van een AI-systeem?'
const EN_TEXT = 'Someone who develops an AI system and places it on the market under their own name.'
const NL_TEXT = 'Wie een AI-systeem ontwikkelt en het onder eigen naam in de handel brengt.'

let origin: string
let dir: string

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'explainers'), id: 'marking', hidden: true, creator: ANNA.login }],
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

async function nodeOf(page: Page, cookie: string, id: string): Promise<DraftNode> {
  return ((await (await api(page, cookie, 'GET', `/trees/marking/nodes/${id}`)).json()) as { node: DraftNode }).node
}

/** The Node `id` of the published `tree.json`, as a reader's server reads it. */
async function publishedNode(id: string): Promise<Record<string, unknown>> {
  const tree = JSON.parse(await readFile(path.join(dir, 'trees', 'marking', 'tree.json'), 'utf8')) as { nodes: Array<Record<string, unknown>> }
  return tree.nodes.find((node) => node.id === id)!
}

const field = (page: Page, nodeId: string, keyPath: string) => page.locator(`[data-field="${nodeId} ${keyPath}"]`).filter({ visible: true })
const sheet = (page: Page) => page.getByRole('dialog')
const status = (page: Page) => page.getByRole('status')
const markButton = (page: Page) => page.locator('.editor-mark')

/** Opens the description's source and selects `words` in it by keyboard, as a creator would. */
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

async function saved(page: Page): Promise<void> {
  await expect(status(page)).toContainText(/^(Saved|Opgeslagen) /)
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

test('marking "provider" writes the mark and an explainer; both languages are written in the Sheet; published, the public page shows the panel on hover', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  for (const [lang, value] of [['en', EN_DESCRIPTION], ['nl', NL_DESCRIPTION]]) {
    expect((await api(page, cookie, 'PATCH', '/trees/marking/nodes/no-end', { path: `description.${lang}`, value })).status()).toBe(200)
  }
  await page.goto(`${origin}/admin/trees/marking/start/no-end`)

  await selectInDescription(page, 'no-end', 'en', 'provider')
  await expect(markButton(page)).toHaveText('Mark')
  await expect(markButton(page)).not.toHaveAttribute('aria-disabled')
  await shoot(page, 'selection-with-mark-control')

  await markButton(page).click()
  await expect(sheet(page).getByRole('heading')).toHaveText('provider')
  const textEn = sheet(page).locator('[data-field="no-end explainers[0].text.en"] textarea')
  await expect(textEn).toBeFocused()
  await page.keyboard.type(EN_TEXT)
  await expect(page.locator('.editor-pill')).toHaveText(`${EN_TEXT.length} / 200`)
  await shoot(page, 'explainer-text-being-written')

  // Dutch: its own section, not marked in the Dutch description yet (V-EXPLAINER).
  const dutch = sheet(page).locator('details[data-lang="nl"]')
  await expect(dutch.locator('summary')).toContainText('Not marked in the text')
  await dutch.locator('summary').click()
  await dutch.locator('[data-field="no-end explainers[0].term.nl"] textarea').fill('aanbieder')
  await dutch.locator('[data-field="no-end explainers[0].text.nl"] textarea').fill(NL_TEXT)
  await sheet(page).getByRole('button', { name: 'Close' }).click()
  await saved(page)

  let node = await nodeOf(page, cookie, 'no-end')
  expect(node.description.en).toBe('Are you a [provider](#provider) of an AI system?')
  expect(node.explainers).toEqual([{ id: 'provider', term: { en: 'provider', nl: 'aanbieder' }, text: { en: EN_TEXT, nl: NL_TEXT } }])

  // The marked term in the editor: bold, its panel on hover, as on the public page (32.3).
  const term = field(page, 'no-end', 'description.en').locator('.term')
  await expect(term).toHaveText('provider')
  await term.hover()
  await expect(field(page, 'no-end', 'description.en').locator('.explainer[data-open]')).toContainText(EN_TEXT)
  await shoot(page, 'marked-term-in-editor')

  // The Dutch occurrence is marked by hand in the source (32.3), with the explainer's id.
  await page.goto(`${origin}/admin/trees/marking/start/no-end?lang=nl`)
  await field(page, 'no-end', 'description.nl').locator('.editor-rendered').click({ position: { x: 2, y: 2 } })
  await field(page, 'no-end', 'description.nl').locator('textarea').fill('Bent u een [aanbieder](#provider) van een AI-systeem?')
  await page.keyboard.press('Tab')
  await saved(page)
  // A click on the rendered term opens its Sheet, which says both languages mark it.
  await field(page, 'no-end', 'description.nl').locator('.term').click()
  await expect(sheet(page).getByRole('heading')).toHaveText('aanbieder')
  await expect(sheet(page).locator('.explainer-marked')).toHaveText(['Gemarkeerd in de tekst', 'Gemarkeerd in de tekst'])
  await page.keyboard.press('Escape')
  await expect(sheet(page)).toHaveCount(0)

  expect((await api(page, cookie, 'PUT', '/trees/marking/published', { published: true })).status()).toBe(200)
  await page.goto(`${origin}/marking/start/no-end`)
  await expect(page.locator('[data-field]')).toHaveCount(0)
  const publicTerm = page.locator('.bubble .term')
  await publicTerm.hover()
  const panel = page.locator('.bubble .explainer[data-open]')
  await expect(panel).toBeVisible()
  await expect(panel).toHaveText(`provider ${EN_TEXT}`)
  await shoot(page, 'panel-on-public-page')

  const published = await publishedNode('no-end')
  expect(published.description).toEqual({ en: 'Are you a [provider](#provider) of an AI system?', nl: 'Bent u een [aanbieder](#provider) van een AI-systeem?' })
  expect(published.explainers).toEqual(node.explainers)
  // Kept for the pull request's evidence and for `npm run validate` on the published Tree.
  await cp(path.join(dir, 'trees', 'marking'), path.join(RESULTS, 'issue-141-published'), { recursive: true })
  console.log(JSON.stringify({ explainers: published.explainers, description: published.description }, null, 2))
})

test('the ninth mark is disabled with explainerLimit', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  await page.goto(`${origin}/admin/trees/marking/start`)
  await selectInDescription(page, 'start', 'en', 'Every')
  await expect(markButton(page)).toHaveAttribute('aria-disabled', 'true')
  await expect(markButton(page)).toHaveAttribute('title', 'This step has eight explainers, the most it can hold.')
  await expect(markButton(page)).toBeDisabled()
  await markButton(page).click({ force: true })
  await expect(sheet(page)).toHaveCount(0)
})

test('a 201-character text is stored and shown over the limit at the field with V-LENGTH, and Publish is refused with V-LENGTH', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(`${origin}/admin/trees/marking/start/no-end`)
  await field(page, 'no-end', 'description.en').locator('.term').click()
  const text = sheet(page).locator('[data-field="no-end explainers[0].text.en"]')
  const long = 'x'.repeat(201)
  await text.locator('textarea').fill(long)
  await expect(page.locator('.editor-pill--over')).toHaveText('201 / 200')
  await expect(text).toHaveAttribute('data-over', 'true')
  await expect(status(page).locator('.editor-violation')).toHaveAttribute('data-rule', 'V-LENGTH')
  await expect.poll(async () => (await nodeOf(page, cookie, 'no-end')).explainers[0]?.text.en).toBe(long)

  const refused = await api(page, cookie, 'PUT', '/trees/marking/published', { published: true })
  expect(refused.status()).toBe(409)
  const rules = ((await refused.json()) as { violations: Array<{ rule: string; keyPath: string }> }).violations
  expect(rules).toContainEqual(expect.objectContaining({ rule: 'V-LENGTH', keyPath: 'explainers[0].text.en' }))

  await text.locator('textarea').fill(EN_TEXT)
  await page.keyboard.press('Tab')
  await saved(page)
})

test('unmark in one language leaves the explainer and the Sheet says notMarkedIn; in the last it removes it, and the published tree.json has no explainers key', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(`${origin}/admin/trees/marking/start/no-end`)
  await field(page, 'no-end', 'description.en').locator('.term').click()
  await sheet(page).getByRole('button', { name: 'Unmark' }).click()
  await expect(sheet(page).locator('details[data-lang="en"] .explainer-marked')).toHaveText('Not marked in the text')
  await expect(sheet(page).locator('details[data-lang="nl"] .explainer-marked')).toHaveText('Marked in the text')
  await saved(page)
  let node = await nodeOf(page, cookie, 'no-end')
  expect(node.description.en).toBe(EN_DESCRIPTION)
  expect(node.explainers.map((explainer) => explainer.id)).toEqual(['provider'])
  await page.keyboard.press('Escape')
  await expect(field(page, 'no-end', 'description.en').locator('.term')).toHaveCount(0)

  await page.goto(`${origin}/admin/trees/marking/start/no-end?lang=nl`)
  await field(page, 'no-end', 'description.nl').locator('.term').click()
  await sheet(page).getByRole('button', { name: 'Markering weghalen' }).click()
  await expect(sheet(page)).toHaveCount(0)
  await saved(page)
  await expect.poll(async () => (await nodeOf(page, cookie, 'no-end')).explainers).toEqual([])
  node = await nodeOf(page, cookie, 'no-end')
  expect(node.description.nl).toBe(NL_DESCRIPTION)

  expect((await api(page, cookie, 'PUT', '/trees/marking/published', { published: true })).status()).toBe(200)
  const published = await publishedNode('no-end')
  expect('explainers' in published).toBe(false)
  expect(published.description).toEqual({ en: EN_DESCRIPTION, nl: NL_DESCRIPTION })
})

test('**[#159]** keys typed right after mark, before the store has answered add-explainer, do not close the Sheet', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  expect((await api(page, cookie, 'PATCH', '/trees/marking/nodes/no-end', { path: 'description.en', value: 'The walk ends here.' })).status()).toBe(200)
  await page.goto(`${origin}/admin/trees/marking/start/no-end`)
  // A slow server or network: the answer to add-explainer comes 1.5 s after the request.
  await page.route('**/admin/api/trees/marking/nodes/no-end', async (route) => {
    if (route.request().postData()?.includes('add-explainer')) await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })

  await selectInDescription(page, 'no-end', 'en', 'walk')
  await markButton(page).click()
  await expect(sheet(page)).toBeVisible()
  await page.keyboard.type('The one')

  const textEn = sheet(page).locator('[data-field="no-end explainers[0].text.en"] textarea')
  await expect(textEn).toBeFocused()
  await expect(sheet(page)).toHaveCount(1)
  await page.keyboard.type(EN_TEXT)
  await expect(textEn).toHaveValue(EN_TEXT)
  await page.keyboard.press('Escape')
  await saved(page)
  expect((await nodeOf(page, cookie, 'no-end')).explainers).toEqual([{ id: 'walk', term: { en: 'walk' }, text: { en: EN_TEXT } }])
})
