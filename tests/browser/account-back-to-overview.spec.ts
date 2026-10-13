/**
 * **[#253]** The way back from the account pages to the creators' overview, in a browser
 * (docs/specs/application.md 24.3, amended; core document 3.4 `[#247]`): #163's round arrow
 * first in the bar of `/admin/account` and `/admin/accounts`, beside the site's title, named
 * `toOverview` in the chrome language and leading to `/admin` in it -- as the editor's bar
 * begins (#203). Not on `/admin/new`, nor on the login page any admin address shows.
 *
 * Against a data directory of the example Tree, Anna's, on a server of this file's own. The
 * screenshots the issue asks for go to `docs/screenshots/issue-253/` under `ELSA_SHOTS=1`, the
 * results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-253') : path.join(repo, 'tests', 'browser', '.results', 'shots')
const PORT = BASE_PORT + 253

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }

/** Per chrome language: the query of its addresses, the arrow's name, and the + tile's words (26.4). */
const LANGUAGES = [
  { lang: 'en', query: '', name: 'All decision trees', newTree: 'New tree' },
  { lang: 'nl', query: '?lang=nl', name: 'Alle beslisbomen', newTree: 'Nieuwe boom' },
] as const

/** The account pages and who opens them: `/admin/accounts` is the 403 page for anyone but the administrator. */
const PAGES = [
  { page: '/admin/account', who: 'a creator', email: ANNA.email, password: ANNA.password },
  { page: '/admin/account', who: 'the administrator', email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  { page: '/admin/accounts', who: 'the administrator', email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
] as const

let origin: string

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'trees', 'ai-act-example'), creator: ANNA.email }],
    accounts: [ANNA],
  })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

/** A page logged in as `email`, in a context of its own, at `width` x `height`. */
async function loggedIn(browser: Browser, email: string, password: string, width = 1280, height = 640): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage()
  expect((await login(page, origin, email, password)).status).toBe(204)
  return page
}

for (const { lang, query, name, newTree } of LANGUAGES) {
  for (const { page: address, who, email, password } of PAGES) {
    test(`${address} as ${who} begins its bar with the arrow, named "${name}", leading to /admin${query}`, async ({ browser }) => {
      const page = await loggedIn(browser, email, password)
      expect((await page.goto(`${origin}${address}${query}`))?.status()).toBe(200)
      const bar = page.locator('header.page-chrome')
      const first = bar.getByRole('link').first()
      await expect(first).toHaveAccessibleName(name)
      await expect(first).toHaveClass('back-to-overview')
      await expect(first).toHaveAttribute('href', `/admin${query}`)
      // Before the site's title, held with it at the left, as the arrow and the Tree's mark are in the editor's bar.
      await expect(bar.locator(':scope > .page-brand > .back-to-overview + .tree-title')).toHaveCount(1)
    })

    test(`the arrow leads from ${address} as ${who} to the creators' overview with its + tile, in ${lang}`, async ({ browser }) => {
      const page = await loggedIn(browser, email, password)
      await page.goto(`${origin}${address}${query}`)
      await page.locator('header.page-chrome').getByRole('link', { name, exact: true }).click()

      await expect(page).toHaveURL(`${origin}/admin${query}`)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      const plus = page.locator('.tile--new')
      await expect(plus).toHaveText(`+${newTree}`)
      await expect(plus).toHaveAttribute('href', `/admin/new${query}`)
    })
  }

  test(`no arrow on /admin/new, nor on the login page /admin/account shows, in ${lang}`, async ({ browser, page: anonymous }) => {
    await anonymous.goto(`${origin}/admin/account${query}`)
    await expect(anonymous.locator('form')).toBeVisible()
    await expect(anonymous.locator('.back-to-overview')).toHaveCount(0)

    const page = await loggedIn(browser, ANNA.email, ANNA.password)
    await page.goto(`${origin}/admin/new${query}`)
    await expect(page.locator('header.page-chrome .admin-nav')).toBeVisible()
    await expect(page.locator('.back-to-overview')).toHaveCount(0)
  })
}

test("below 620 pixels wide the account pages' bars give up the site's title and the current language; /admin/new's keeps both from 600", async ({ browser }) => {
  const page = await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD)
  const title = page.locator('header.page-chrome .tree-title')
  const current = page.locator('header.page-chrome .language--current')
  for (const [address, width, shown] of [
    ['/admin/account', 619, false],
    ['/admin/account', 620, true],
    ['/admin/accounts', 619, false],
    ['/admin/accounts', 620, true],
    ['/admin/new', 600, true],
    ['/admin/new', 619, true],
  ] as const) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto(`${origin}${address}`)
    await expect(page.locator('header.page-chrome .admin-nav')).toBeVisible()
    for (const element of [title, current]) {
      if (shown) await expect(element, `${address} at ${width}x800`).toBeVisible()
      else await expect(element, `${address} at ${width}x800`).toBeHidden()
    }
  }
})

test('the accounts page with the arrow in its bar, for the pull request (#253)', async ({ browser }) => {
  for (const [width, height] of [
    [1280, 640],
    [360, 640],
  ] as const) {
    const page = await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD, width, height)
    await page.goto(`${origin}/admin/accounts`)
    await expect(page.locator('header.page-chrome').getByRole('link', { name: 'All decision trees', exact: true })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(SHOTS, `accounts-en-${width}x${height}.png`) })
    await page.context().close()
  }
})
