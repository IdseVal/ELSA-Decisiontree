/**
 * **[#204]** The two links between the public pages and the admin area, in a browser
 * (docs/specs/application.md 24.3, amended; core document 3.4 `[#202]`): "Editor" at the right
 * end of the bar of the overview `/` and of every Node page, leading to `/admin` in the chrome
 * language -- the login page without a session, the creators' overview with one -- and
 * "Website" at the right end of the bar at `/admin`, in both its states, leading back to the
 * public overview in the chrome language. And what the bars give up to make their room: a Node
 * page's current language below 768 pixels wide, the creators' overview's title and current
 * language below 600; the controls of the bar at `/admin` at its right end at every width.
 *
 * Against a data directory of its own (35.1): the example Tree, a Tree in Dutch alone
 * (`single-language`), a Tree in German, which the chrome does not speak (`german-only`, 3.1),
 * and the full Node's Tree hidden, for the editor. The screenshots the issue asks for go to
 * `docs/screenshots/issue-204/` under `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const fixtures = path.join(repo, 'tests', 'fixtures')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-204') : path.join(repo, 'tests', 'browser', '.results', 'shots')
const PORT = BASE_PORT + 200

/** Per chrome language: the query of its addresses and the login page's heading (25.1). */
const LANGUAGES = [
  { lang: 'en', query: '', signIn: 'Sign in' },
  { lang: 'nl', query: '?lang=nl', signIn: 'Inloggen' },
] as const

/** The pages that carry "Editor": the overview and a Node page, in the chrome language `query` names. */
const PUBLIC_PAGES = (query: string) => [`/${query}`, `/ai-act-example/start${query}`] as const

let origin: string

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const dir = await buildDataDir({
    trees: [
      { folder: path.join(repo, 'trees', 'ai-act-example') },
      { folder: path.join(fixtures, 'single-language') },
      { folder: path.join(fixtures, 'german-only') },
      { folder: path.join(fixtures, 'full-node'), id: 'hidden-draft', hidden: true },
    ],
    accounts: [],
  })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

/** A page at `width` x `height` in a context of its own: with the administrator's session when `session`. */
async function opened(browser: Browser, session: boolean, width = 1280, height = 640): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage()
  if (session) expect((await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)).status).toBe(204)
  return page
}

/** `link` is the last control of its bar and stands at its right end, every other control before it. */
async function expectLastAtTheRight(link: Locator, where: string): Promise<void> {
  const [at, others, end] = await link.evaluate((element) => {
    const bar = element.closest('header.page-chrome')!
    const controls = [...bar.querySelectorAll('a, button, .language--current, .tree-title')].filter((control) => control !== element && control.getClientRects().length > 0)
    const box = element.getBoundingClientRect()
    return [
      { left: box.left, right: box.right },
      controls.map((control) => control.getBoundingClientRect().right),
      bar.getBoundingClientRect().right - parseFloat(getComputedStyle(bar).paddingRight),
    ] as const
  })
  expect(Math.abs(at.right - end), `${where}: the link's right edge ${at.right} at the bar's right end ${end}`).toBeLessThanOrEqual(1)
  for (const right of others) expect(right, `${where}: a control after the link`).toBeLessThanOrEqual(at.left)
}

for (const { lang, query, signIn } of LANGUAGES) {
  test(`"Editor" ends the bar of the overview and of a Node page, leading to /admin${query}`, async ({ browser }) => {
    const page = await opened(browser, false)
    for (const address of PUBLIC_PAGES(query)) {
      await page.goto(`${origin}${address}`)
      const editor = page.locator('header.page-chrome').getByRole('link', { name: 'Editor', exact: true })
      await expect(editor, address).toHaveAttribute('href', `/admin${query}`)
      // The chrome speaks the page's language here, so the word needs no `lang` of its own.
      await expect(editor, address).not.toHaveAttribute('lang')
      await expectLastAtTheRight(editor, address)
    }
  })

  test(`"Editor" without a session opens the login page at /admin, in ${lang}`, async ({ browser }) => {
    for (const address of PUBLIC_PAGES(query)) {
      const page = await opened(browser, false)
      await page.goto(`${origin}${address}`)
      await page.locator('header.page-chrome').getByRole('link', { name: 'Editor', exact: true }).click()
      await expect(page).toHaveURL(`${origin}/admin${query}`)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.getByRole('heading', { name: signIn, exact: true })).toBeVisible()
      await page.context().close()
    }
  })

  test(`"Editor" with a session opens the creators' overview with its + tile, in ${lang}`, async ({ browser }) => {
    for (const address of PUBLIC_PAGES(query)) {
      const page = await opened(browser, true)
      await page.goto(`${origin}${address}`)
      await page.locator('header.page-chrome').getByRole('link', { name: 'Editor', exact: true }).click()
      await expect(page).toHaveURL(`${origin}/admin${query}`)
      await expect(page.locator('.tile--new')).toHaveAttribute('href', `/admin/new${query}`)
      await expect(page.locator('.tile[data-tree="hidden-draft"]')).toBeVisible()
      await page.context().close()
    }
  })

  for (const session of [false, true]) {
    const state = session ? "the creators' overview" : 'the login page'
    test(`"Website" ends the bar of ${state} at /admin and leads to the public overview, in ${lang}`, async ({ browser }) => {
      const page = await opened(browser, session)
      await page.goto(`${origin}/admin${query}`)
      await expect(page.locator(session ? '.tile--new' : '#sign-in')).toBeVisible()
      const website = page.locator('header.page-chrome').getByRole('link', { name: 'Website', exact: true })
      await expect(website).toHaveAttribute('href', `/${query}`)
      await expectLastAtTheRight(website, state)
      await website.click()
      await expect(page).toHaveURL(`${origin}/${query}`)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('h1#site-title')).toBeVisible()
      await expect(page.locator('a.tile[data-tree="ai-act-example"]')).toBeVisible()
    })
  }
}

test('"Editor" on a Tree in a language the chrome does not speak says it in English, and leads to /admin', async ({ page }) => {
  await page.goto(`${origin}/german-only/start`)
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  const editor = page.locator('header.page-chrome').getByRole('link', { name: 'Editor', exact: true })
  await expect(editor).toHaveAttribute('href', '/admin')
  await expect(editor).toHaveAttribute('lang', 'en')
})

test('"Editor" on a Tree in Dutch alone leads to /admin in Dutch', async ({ page }) => {
  await page.goto(`${origin}/single-language/start`)
  const editor = page.locator('header.page-chrome').getByRole('link', { name: 'Editor', exact: true })
  await expect(editor).toHaveAttribute('href', '/admin?lang=nl')
  await expect(editor).not.toHaveAttribute('lang')
})

test('no "Website" on any other admin page, nor on the login page at another admin address', async ({ browser }) => {
  const withSession = await opened(browser, true)
  const without = await opened(browser, false)
  for (const [page, address, what] of [
    [withSession, '/admin/account', 'the account page'],
    [withSession, '/admin/accounts', 'the accounts page'],
    [withSession, '/admin/new', 'the new-Tree form'],
    [withSession, '/admin/trees/hidden-draft/full', 'the editor'],
    [without, '/admin/account', 'the login page at /admin/account'],
    [without, '/admin/trees/hidden-draft/full', 'the login page at an editor address'],
  ] as const) {
    for (const { query, signIn } of LANGUAGES) {
      expect((await page.goto(`${origin}${address}${query}`))?.status(), what).toBe(200)
      if (page === without) await expect(page.getByRole('heading', { name: signIn, exact: true }), what).toBeVisible()
      else await expect(page.locator('header.page-chrome'), what).toBeVisible()
      await expect(page.getByRole('link', { name: 'Website', exact: true }), what).toHaveCount(0)
    }
  }
})

test("below 768 pixels wide a Node page's bar gives up the current language with its list item, a Tree in one language its whole switch", async ({ page }) => {
  const current = page.locator('header.page-chrome .language-switch li:has(> .language--current)')
  const other = page.locator('header.page-chrome .language-switch a.language')
  const editor = page.locator('header.page-chrome').getByRole('link', { name: 'Editor', exact: true })
  for (const [width, height, shown] of [
    [480, 800, false],
    [767, 800, false],
    [768, 1024, true],
  ] as const) {
    const where = `${width}x${height}`
    await page.setViewportSize({ width, height })
    await page.goto(`${origin}/ai-act-example/start`)
    if (shown) await expect(current, where).toBeVisible()
    else await expect(current, where).toBeHidden()
    await expect(other, where).toBeVisible()
    await expect(editor, where).toBeVisible()
  }
  for (const [width, height, shown] of [
    [767, 800, false],
    [768, 1024, true],
  ] as const) {
    const where = `one language at ${width}x${height}`
    await page.setViewportSize({ width, height })
    await page.goto(`${origin}/single-language/start`)
    const nav = page.locator('header.page-chrome nav.language-switch')
    if (shown) await expect(nav, where).toBeVisible()
    else await expect(nav, where).toBeHidden()
    await expect(editor, where).toBeVisible()
  }
})

test("the overview's bar keeps its current language beside \"Editor\" at the floor", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 })
  await page.goto(`${origin}/`)
  await expect(page.locator('header.page-chrome .language--current')).toBeVisible()
  await expectLastAtTheRight(page.locator('header.page-chrome').getByRole('link', { name: 'Editor', exact: true }), 'the overview at 320x480')
})

test("below 600 pixels wide the creators' overview's bar gives up the site's title and the current language; the login page's keeps its title", async ({ browser }) => {
  const page = await opened(browser, true)
  const title = page.locator('header.page-chrome .tree-title')
  const current = page.locator('header.page-chrome .language--current')
  for (const [width, shown] of [
    [480, false],
    [599, false],
    [600, true],
  ] as const) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto(`${origin}/admin`)
    await expect(page.locator('.tile--new')).toBeVisible()
    for (const element of [title, current]) {
      if (shown) await expect(element, `${width}x800`).toBeVisible()
      else await expect(element, `${width}x800`).toBeHidden()
    }
  }
  const login = await opened(browser, false, 480, 800)
  await login.goto(`${origin}/admin`)
  await expect(login.locator('header.page-chrome .tree-title')).toBeVisible()
})

test('"Website" is the last control at the right end of the bar at /admin at 320 x 480 and at 599 x 800', async ({ browser }) => {
  for (const session of [false, true]) {
    for (const [width, height] of [
      [320, 480],
      [599, 800],
    ] as const) {
      const page = await opened(browser, session, width, height)
      await page.goto(`${origin}/admin`)
      await expect(page.locator(session ? '.tile--new' : '#sign-in')).toBeAttached()
      const website = page.locator('header.page-chrome').getByRole('link', { name: 'Website', exact: true })
      await expect(website).toBeVisible()
      await expectLastAtTheRight(website, `${session ? "the creators' overview" : 'the login page'} at ${width}x${height}`)
      await page.context().close()
    }
  }
})

test('the bars with "Editor" and "Website", for the pull request (#204)', async ({ browser }) => {
  test.slow()
  const shots = [
    { name: 'overview', address: '/', session: false, sizes: [[1280, 640], [320, 480]] },
    { name: 'node', address: '/ai-act-example/start', session: false, sizes: [[1280, 640], [320, 480], [767, 800]] },
    { name: 'login', address: '/admin', session: false, sizes: [[1280, 640], [320, 480]] },
    { name: 'creators-overview', address: '/admin', session: true, sizes: [[1280, 640], [320, 480], [599, 800]] },
  ] as const
  for (const { name, address, session, sizes } of shots) {
    for (const [width, height] of sizes) {
      for (const { lang, query } of LANGUAGES) {
        const page = await opened(browser, session, width, height)
        await page.goto(`${origin}${address}${query}`)
        await expect(page.locator('header.page-chrome').getByRole('link', { name: address === '/admin' ? 'Website' : 'Editor', exact: true })).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: path.join(SHOTS, `${name}-${lang}-${width}x${height}.png`) })
        await page.context().close()
      }
    }
  }
})
