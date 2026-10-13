/**
 * **[#251]** The creator deletes their own hidden Tree from the settings panel, as the
 * administrator does (docs/specs/application.md 21.2, 33.5, 33.6, amended;
 * ADR-251-creator-deletes), in English and in Dutch: the creator's `deleteTree` in "This Tree",
 * disabled with `unpublishFirst` on a published Tree, asked once, a failure shown under it and a
 * 204 landing on `/admin`; none for a collaborator; the administrator's one button, in its own
 * section, on a Tree of another account's and on one of its own; none after the creator's
 * hand-over, and the new creator's on their next visit.
 *
 * Against a data directory of 35.3's named accounts and Trees per language, on servers of this
 * file's own. The tests of a language run in order: each leaves the store as the next expects
 * it. The screenshot the issue asks for goes to `docs/screenshots/issue-251/` under
 * `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Locator, type Page } from '@playwright/test'
import { chrome } from '../../src/chrome.ts'
import { ADMIN_EMAIL, ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-251') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 251

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const BRAM = { email: 'bram@example.org', name: 'Bram', password: 'brams first password' }
const CEES = { email: 'cees@example.org', name: 'Cees', password: 'cees first password' }
const ADMIN = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }

test.describe.configure({ mode: 'serial' })

test.afterAll(async () => {
  await stopServers()
})

/** The panel's Sheet, its "This Tree" and Administrator sections, and a `deleteTree` button in `scope`. */
const panel = (page: Page) => page.locator('.panel-sheet > .sheet-panel')
const thisTree = (page: Page) => panel(page).locator('.panel-section[aria-labelledby="panel-tree"]')
const administrator = (page: Page) => panel(page).locator('.panel-section[aria-labelledby="panel-administrator"]')

for (const [index, lang] of (['en', 'nl'] as const).entries()) {
  test.describe(lang, () => {
    const words = chrome(lang)
    const query = lang === 'en' ? '' : '?lang=nl'
    const deleteButton = (scope: Locator) => scope.getByRole('button', { name: words.deleteTree, exact: true })
    let origin: string

    test.beforeAll(async () => {
      await mkdir(SHOTS, { recursive: true })
      const dir = await buildDataDir({
        trees: [
          { folder: path.join(repo, 'trees', 'ai-act-example'), creator: ANNA.email },
          { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, creator: ANNA.email, collaborators: [BRAM.email] },
        ],
        accounts: [ANNA, BRAM, CEES],
      })
      origin = await serveStore(dir, PORT + index, ADMIN_ENV)
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
    async function loggedIn(browser: Browser, who: { email: string; password: string }): Promise<{ page: Page; cookie: string }> {
      const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
      const { status, cookie } = await login(page, origin, who.email, who.password)
      expect(status).toBe(204)
      return { page, cookie }
    }

    /** A hidden Tree of two languages made through the route the new-Tree form posts to (27.2). */
    async function made(page: Page, cookie: string, id: string): Promise<void> {
      expect((await api(page, cookie, 'POST', '/trees', { id, languages: ['en', 'nl'], title: { en: 'Made here', nl: 'Hier gemaakt' } })).status()).toBe(201)
    }

    /** Opens the editor of `tree` at `node` and its panel, once the re-read its opening makes is answered (33.3). */
    async function openPanel(page: Page, tree: string, node: string): Promise<void> {
      expect((await page.goto(`${origin}/admin/trees/${tree}/${node}${query}`))?.status()).toBe(200)
      const reread = page.waitForResponse((response) => response.url().endsWith('/admin/api/accounts'))
      await page.locator('.panel-sheet > .sheet-open').click()
      await expect(panel(page)).toBeVisible()
      await reread
    }

    test(`${lang}: on a published Tree the creator's deleteTree is disabled, with unpublishFirst as its description`, async ({ browser }) => {
      const { page } = await loggedIn(browser, ANNA)
      await openPanel(page, 'ai-act-example', 'start')
      await expect(deleteButton(panel(page))).toHaveCount(1)
      await expect(deleteButton(thisTree(page))).toBeDisabled()
      await expect(deleteButton(thisTree(page))).toHaveAccessibleDescription(words.unpublishFirst)
      await expect(administrator(page)).toHaveCount(0)
    })

    test(`${lang}: a collaborator sees no deleteTree anywhere in the panel`, async ({ browser }) => {
      const { page } = await loggedIn(browser, BRAM)
      await openPanel(page, 'hidden-draft', 'full')
      await expect(thisTree(page)).toBeVisible()
      await expect(deleteButton(panel(page))).toHaveCount(0)
    })

    test(`${lang}: the administrator sees one deleteTree, in its own section, and deletes a Tree another account created`, async ({ browser }) => {
      const admin = await loggedIn(browser, ADMIN)
      await made(admin.page, admin.cookie, 'admins-own')
      await openPanel(admin.page, 'admins-own', 'start')
      await expect(deleteButton(panel(admin.page))).toHaveCount(1)
      await expect(deleteButton(administrator(admin.page))).toBeEnabled()

      const anna = await loggedIn(browser, ANNA)
      await made(anna.page, anna.cookie, 'annas-second')
      await openPanel(admin.page, 'annas-second', 'start')
      await expect(deleteButton(panel(admin.page))).toHaveCount(1)
      await deleteButton(administrator(admin.page)).click()
      await expect(administrator(admin.page)).toContainText(words.confirmDeleteTree)
      await administrator(admin.page).getByRole('button', { name: words.confirm }).click()
      await expect(admin.page).toHaveURL(`${origin}/admin${query}`)
      expect((await api(admin.page, admin.cookie, 'GET', '/trees/annas-second')).status()).toBe(404)
    })

    test(`${lang}: after the creator hands the Tree over, their panel shows no deleteTree; the new creator's does`, async ({ browser }) => {
      const anna = await loggedIn(browser, ANNA)
      await made(anna.page, anna.cookie, 'handed')
      await openPanel(anna.page, 'handed', 'start')
      await expect(deleteButton(thisTree(anna.page))).toBeEnabled()
      const collaborators = panel(anna.page).locator('.panel-section[aria-labelledby="panel-collaborators"]')
      await collaborators.locator('select[data-select="hand-over"]').selectOption({ label: BRAM.name })
      await collaborators.getByRole('button', { name: words.handOver }).click()
      await expect(collaborators.locator('.panel-people li').first()).toContainText(BRAM.name)
      await expect(deleteButton(panel(anna.page))).toHaveCount(0)
      await openPanel(anna.page, 'handed', 'start')
      await expect(deleteButton(panel(anna.page))).toHaveCount(0)

      const bram = await loggedIn(browser, BRAM)
      await openPanel(bram.page, 'handed', 'start')
      await expect(deleteButton(thisTree(bram.page))).toBeEnabled()
    })

    test(`${lang}: the creator deletes their hidden Tree from "This Tree": asked once, a failure shown under the button, then /admin`, async ({ browser }) => {
      const { page, cookie } = await loggedIn(browser, ANNA)
      await openPanel(page, 'hidden-draft', 'full')
      await expect(deleteButton(panel(page))).toHaveCount(1)
      const button = deleteButton(thisTree(page))
      await expect(button).toBeEnabled()
      await expect(button).toHaveAccessibleDescription('')

      // Asked once, in place: cancel keeps the Tree.
      await button.click()
      const ask = thisTree(page).locator('.panel-ask')
      await expect(ask).toContainText(words.confirmDeleteTree)
      await ask.getByRole('button', { name: words.cancel }).click()
      await expect(button).toBeVisible()
      expect((await api(page, cookie, 'GET', '/trees/hidden-draft')).status()).toBe(200)

      await button.click()
      await expect(ask).toContainText(words.confirmDeleteTree)
      if (lang === 'en') {
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: path.join(SHOTS, 'creator-delete-asking.png') })
      }

      // A refused or lost request: `requestFailed` under the creator's own button, and the Tree stays.
      await page.route(`${origin}/admin/api/trees/hidden-draft`, (route) => (route.request().method() === 'DELETE' ? route.fulfill({ status: 500 }) : route.continue()))
      await ask.getByRole('button', { name: words.confirm }).click()
      await expect(thisTree(page).getByRole('alert')).toHaveText(words.requestFailed)
      await expect(page).toHaveURL(`${origin}/admin/trees/hidden-draft/full${query}`)
      await page.unroute(`${origin}/admin/api/trees/hidden-draft`)

      await ask.getByRole('button', { name: words.confirm }).click()
      await expect(page).toHaveURL(`${origin}/admin${query}`)
      await expect(page.locator('.tile[data-tree="ai-act-example"]')).toBeVisible()
      await expect(page.locator('.tile[data-tree="hidden-draft"]')).toHaveCount(0)
      expect((await api(page, cookie, 'GET', '/trees/hidden-draft')).status()).toBe(403)
      const admin = await loggedIn(browser, ADMIN)
      expect((await api(admin.page, admin.cookie, 'GET', '/trees/hidden-draft')).status()).toBe(404)
    })
  })
}
