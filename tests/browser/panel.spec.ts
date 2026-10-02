/**
 * **[#142]** The top panel, in a browser (docs/specs/application.md 33, 35.4;
 * ADR-133-top-panel): the button's label and count on a fresh Tree; publishing a Tree with a
 * missing text refused, its to-do line a link to the Node; publishing a complete one, its
 * public link, the public overview listing it and its root Node served; unpublishing asked
 * once, then the root URL 404; inviting from the select and, as that account in a second
 * context, editing the Tree with the switch disabled; a third account's 403 on the editor
 * address; removing the collaborator and their next write refused; the administrator's
 * hand-over and `deleteTree` disabled while published. **[#176]** The button floats at the top
 * right and says `settings` and the state; the count and the to-do lines are the to-do
 * bubble's, which a refused publish points at (33.1, 33.3, amended).
 *
 * Against a data directory of the named Trees and accounts of 35.3 on a server of this
 * file's own. The tests run in order: each leaves the Tree as the next expects it. The
 * screenshots the issue asks for go to `docs/screenshots/issue-142/` under `ELSA_SHOTS=1`,
 * the results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Page } from '@playwright/test'
import { ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-142') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 105

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }
const BRAM = { login: 'bram', name: 'Bram', password: 'brams first password' }
const CEES = { login: 'cees', name: 'Cees', password: 'cees first password' }
const DORA = { login: 'dora', name: 'Dora', password: 'doras first password' }
const ADMIN = { login: 'admin', password: ADMIN_PASSWORD }

let origin: string

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, creator: ANNA.login, collaborators: [BRAM.login] }],
    accounts: [ANNA, BRAM, CEES, DORA],
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

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

/** The panel's button, and the panel it opens; **[#176]** both float at the top right, and the to-do list is a bubble of its own (33.3). */
const button = (page: Page) => page.locator('.panel-sheet > .sheet-open')
const panel = (page: Page) => page.locator('.panel-sheet > .sheet-panel')
const publishSwitch = (page: Page) => panel(page).getByRole('switch', { name: 'Publish' })
const todo = (page: Page) => page.locator('.todo-sheet > .sheet-open')
const todoBubble = (page: Page) => page.locator('.todo-sheet > .sheet-panel')
const things = (count: number): string => `${count} ${count === 1 ? 'thing' : 'things'} to do`

/** Opens the panel and waits for the re-read of the entry and the accounts it does on opening (33.3). */
async function openPanel(page: Page): Promise<void> {
  const reread = page.waitForResponse((response) => response.url().endsWith('/admin/api/accounts'))
  await button(page).click()
  await expect(panel(page)).toBeVisible()
  await reread
}

/** The public overview's tile list, as `curl` reads it: the `data-tree` of every tile, in order. */
async function overviewTiles(page: Page): Promise<string[]> {
  const html = await (await page.request.get(`${origin}/`)).text()
  return [...html.matchAll(/data-tree="([^"]+)"/g)].map((match) => match[1]!)
}

test('a fresh Tree: the button says Hidden and the count; publishing it is refused and the to-do line links to the Node', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser, ANNA)
  expect((await api(page, cookie, 'POST', '/trees', { id: 'fresh', languages: ['en'], title: { en: 'Fresh' } })).status()).toBe(201)
  const entry = (await (await api(page, cookie, 'GET', '/trees/fresh')).json()) as { advisory: { file: string }[] }
  expect(entry.advisory.length).toBeGreaterThan(0)

  await page.goto(`${origin}/admin/trees/fresh/start`)
  await expect(button(page)).toHaveAccessibleName('Decision-tree settings: Hidden')
  await expect(todo(page)).toHaveAccessibleName(things(entry.advisory.length))
  await expect(button(page).locator('.panel-state')).toHaveAttribute('data-state', 'hidden')

  await openPanel(page)
  await expect(panel(page).locator('.sheet-close--cross')).toBeFocused()
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await publishSwitch(page).click()
  // Refused (19.3): the switch stays off, and the full validation's list is the to-do list,
  // **[#176]** in the bubble the Publish section points at (33.3).
  await expect(panel(page).getByRole('alert')).toBeVisible()
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await panel(page).getByRole('alert').getByRole('button', { name: 'See what to do' }).click()
  await expect(todoBubble(page).locator('.todo-list li').first()).toBeVisible()
  const line = todoBubble(page).locator('.todo-list li a[href="/admin/trees/fresh/start"]').first()
  await expect(line).toBeVisible()
  await shoot(page, 'refused-publish')
  expect((await page.request.get(`${origin}/fresh/start`)).status()).toBe(404)

  await line.click()
  await expect(page).toHaveURL(`${origin}/admin/trees/fresh/start`)
})

test('publishing a complete Tree: the switch turns on, the public link, the overview lists it and its root Node is served', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  const before = await overviewTiles(page)
  expect(before).not.toContain('hidden-draft')
  console.log(`public overview tiles before publishing: ${JSON.stringify(before)}`)

  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await expect(button(page)).toHaveAccessibleName('Decision-tree settings: Hidden')
  await expect(todo(page)).toHaveAccessibleName('Nothing to do')
  await openPanel(page)
  await shoot(page, 'panel-off')

  await publishSwitch(page).click()
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'true')
  const link = panel(page).locator('[data-public-link]')
  await expect(link).toHaveAttribute('href', '/hidden-draft/full')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(button(page)).toHaveAccessibleName('Decision-tree settings: Published')
  await expect(button(page).locator('.panel-state')).toHaveAttribute('data-state', 'published')
  await shoot(page, 'panel-on')

  const after = await overviewTiles(page)
  expect(after).toContain('hidden-draft')
  console.log(`public overview tiles after publishing: ${JSON.stringify(after)}`)
  const root = await page.request.get(`${origin}/hidden-draft/full`)
  expect(root.status()).toBe(200)
})

test('a published Tree’s autosave reaches the public page at once (10.33, 19.4)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser, ANNA)
  const title = (await (await api(page, cookie, 'GET', '/trees/hidden-draft/nodes/full')).json()) as { node: { title: { en: string } } }
  const typed = 'Saved while published'
  expect((await api(page, cookie, 'PATCH', '/trees/hidden-draft/nodes/full', { path: 'title.en', value: typed })).status()).toBe(200)
  expect(await (await page.request.get(`${origin}/hidden-draft/full`)).text()).toContain(typed)
  expect((await api(page, cookie, 'PATCH', '/trees/hidden-draft/nodes/full', { path: 'title.en', value: title.node.title.en })).status()).toBe(200)
})

test('unpublishing asks once; cancel keeps it public, confirm hides it and the root URL is 404', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await openPanel(page)
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'true')

  await publishSwitch(page).click()
  const ask = panel(page).locator('.panel-ask')
  await expect(ask).toContainText('Hide this tree? Links to it will stop working until it is published again.')
  await ask.getByRole('button', { name: 'Cancel' }).click()
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'true')
  expect((await page.request.get(`${origin}/hidden-draft/full`)).status()).toBe(200)

  await publishSwitch(page).click()
  await panel(page).locator('.panel-ask').getByRole('button', { name: 'Confirm' }).click()
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await expect(button(page)).toHaveAccessibleName('Decision-tree settings: Hidden')
  expect((await page.request.get(`${origin}/hidden-draft/full`)).status()).toBe(404)
  expect(await overviewTiles(page)).not.toContain('hidden-draft')
})

test('inviting an account from the select; logged in as it, the Tree is editable and the switch disabled; a third account gets 403', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await openPanel(page)
  const people = panel(page).locator('.panel-people')
  await expect(people.locator('li')).toHaveText(['Anna (creator)', 'Bram'])
  const select = panel(page).locator('select[data-select="invite"]')
  // Every active account not on the Tree and not the administrator (33.4).
  await expect(select.locator('option:not([value=""])')).toHaveText(['Cees · cees', 'Dora · dora'])

  await select.selectOption({ label: 'Dora · dora' })
  await panel(page).getByRole('button', { name: 'Invite' }).click()
  await expect(people.locator('li')).toHaveText(['Anna (creator)', 'Bram', 'Dora'])
  await expect(select.locator('option:not([value=""])')).toHaveText(['Cees · cees'])
  await shoot(page, 'collaborators-after-invite')

  const dora = await loggedIn(browser, DORA)
  await dora.page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await openPanel(dora.page)
  await expect(publishSwitch(dora.page)).toBeDisabled()
  await expect(panel(dora.page).locator('.panel-people li')).toHaveText(['Anna (creator)', 'Bram', 'Dora'])
  await expect(panel(dora.page).locator('select')).toHaveCount(0)
  await expect(panel(dora.page).locator('.panel-remove')).toHaveCount(0)
  await dora.page.keyboard.press('Escape')
  await expect(panel(dora.page)).toBeHidden()

  const area = dora.page.locator('[data-field="full title.en"]').filter({ visible: true }).locator('textarea')
  const was = await area.inputValue()
  await area.click()
  await area.fill('Edited by Dora')
  await expect(dora.page.getByRole('status')).toContainText(/^Saved/)
  const stored = (await (await api(dora.page, dora.cookie, 'GET', '/trees/hidden-draft/nodes/full')).json()) as { node: { title: { en: string } } }
  expect(stored.node.title.en).toBe('Edited by Dora')
  await area.fill(was)
  await expect(dora.page.getByRole('status')).toContainText(/^Saved/)
  // A collaborator does not publish (21.2): the server says so too.
  expect((await api(dora.page, dora.cookie, 'PUT', '/trees/hidden-draft/published', { published: true })).status()).toBe(403)

  const cees = await loggedIn(browser, CEES)
  const response = await cees.page.goto(`${origin}/admin/trees/hidden-draft/full`)
  expect(response?.status()).toBe(403)
  await expect(cees.page.getByRole('heading', { name: 'Not yours to open' })).toBeVisible()
})

test('removing the collaborator: gone from the list, and their next write is refused', async ({ browser }) => {
  const dora = await loggedIn(browser, DORA)
  await dora.page.goto(`${origin}/admin/trees/hidden-draft/full`)

  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await openPanel(page)
  await panel(page).getByRole('button', { name: 'Remove Dora' }).click()
  await expect(panel(page).locator('.panel-people li')).toHaveText(['Anna (creator)', 'Bram'])

  // Dora's page is still open: the next write answers 403, and the indicator says not editable (29.4).
  await dora.page.locator('[data-field="full title.en"]').filter({ visible: true }).locator('textarea').fill('Too late')
  await expect(dora.page.getByRole('status')).toContainText('Not saved')
  await expect(dora.page.getByRole('status')).toContainText('This tree can no longer be edited here')
  expect((await api(dora.page, dora.cookie, 'PATCH', '/trees/hidden-draft/nodes/full', { path: 'title.en', value: 'Too late' })).status()).toBe(403)
  expect((await dora.page.goto(`${origin}/admin/trees/hidden-draft/full`))?.status()).toBe(403)
})

test('the administrator: deleteTree disabled while published, the hand-over, and the creator’s own controls gone after it', async ({ browser }) => {
  const admin = await loggedIn(browser, ADMIN)
  expect((await api(admin.page, admin.cookie, 'PUT', '/trees/hidden-draft/published', { published: true })).status()).toBe(200)
  await admin.page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await openPanel(admin.page)
  const section = admin.page.locator('.panel-section[aria-labelledby="panel-administrator"]')
  await expect(section.getByRole('button', { name: 'Delete this tree' })).toBeDisabled()
  await expect(section).toContainText('Hide it first to delete it.')
  // The administrator has every right: the invite controls, and every active account to hand over to.
  await expect(panel(admin.page).locator('select[data-select="invite"]')).toHaveCount(1)

  await section.locator('select').selectOption({ label: 'Bram · bram' })
  await section.getByRole('button', { name: 'Hand over' }).click()
  await expect(admin.page.locator('.panel-people li')).toHaveText(['Bram (creator)', 'Anna'])

  const anna = await loggedIn(browser, ANNA)
  await anna.page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await openPanel(anna.page)
  await expect(publishSwitch(anna.page)).toBeDisabled()
  await expect(panel(anna.page).locator('select')).toHaveCount(0)

  // Hidden again, the Tree may be deleted, after asking once; the editor goes to /admin.
  await publishSwitch(admin.page).click()
  await admin.page.locator('.panel-ask').getByRole('button', { name: 'Confirm' }).click()
  await expect(section.getByRole('button', { name: 'Delete this tree' })).toBeEnabled()
  await section.getByRole('button', { name: 'Delete this tree' }).click()
  await expect(section).toContainText('Delete this tree and its pictures for good?')
  await section.getByRole('button', { name: 'Confirm' }).click()
  await expect(admin.page).toHaveURL(`${origin}/admin`)
  expect((await api(admin.page, admin.cookie, 'GET', '/trees/hidden-draft')).status()).toBe(404)
})
