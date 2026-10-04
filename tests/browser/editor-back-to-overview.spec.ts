/**
 * **[#203]** The way back from the editor to the creators' overview, in a browser
 * (docs/specs/application.md 24.3, amended; core document 3.4 `[#202]`): #163's round arrow at
 * the left of the editor's chrome bar, before the draft's logo or title, named `toOverview` in
 * the chrome language and leading to `/admin` in it -- the creators' overview, with its + tile.
 *
 * Against a data directory of the named accounts and Trees of 35.3 on a server of this file's
 * own: `hidden-draft` names itself with its title, the example Tree with its logo. The
 * screenshots the issue asks for go to `docs/screenshots/issue-203/` under `ELSA_SHOTS=1`, the
 * results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-203') : path.join(repo, 'tests', 'browser', '.results', 'shots')
const PORT = BASE_PORT + 195

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }

/** Per chrome language: the query of its addresses, the arrow's name, and the + tile's words (26.4). */
const LANGUAGES = [
  { lang: 'en', query: '', name: 'All decision trees', newTree: 'New tree' },
  { lang: 'nl', query: '?lang=nl', name: 'Alle beslisbomen', newTree: 'Nieuwe boom' },
] as const

/** The editor of each Tree's root Node, and what stands for the Tree in the bar (13.4). */
const TREES = [
  { editor: '/admin/trees/hidden-draft/full', mark: '.tree-title' },
  { editor: '/admin/trees/ai-act-example/start', mark: 'img.logo' },
] as const

let origin: string

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const dir = await buildDataDir({
    trees: [
      { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, creator: ANNA.email },
      { folder: path.join(repo, 'trees', 'ai-act-example'), creator: ANNA.email },
    ],
    accounts: [ANNA],
  })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

/** A page logged in as the Trees' creator, in a context of its own, at `width` x `height`. */
async function loggedIn(browser: Browser, width = 1280, height = 640): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage()
  expect((await login(page, origin, ANNA.email, ANNA.password)).status).toBe(204)
  return page
}

for (const { lang, query, name, newTree } of LANGUAGES) {
  test(`the editor's bar starts with the arrow, named "${name}", leading to the creators' overview in ${lang}`, async ({ browser }) => {
    const page = await loggedIn(browser)
    for (const { editor, mark } of TREES) {
      await page.goto(`${origin}${editor}${query}`)
      const bar = page.locator('header.editor-chrome')
      const arrow = bar.getByRole('link', { name, exact: true })
      await expect(arrow).toHaveAttribute('href', `/admin${query}`)
      // The first thing in the bar, before the Tree's mark, as on the public Node page (#163).
      await expect(bar.locator('a, button, img, .tree-title').first()).toHaveClass('back-to-overview')
      const [at, tree] = [(await arrow.boundingBox())!, (await bar.locator(mark).boundingBox())!]
      expect(at.x + at.width, `${editor}: the arrow ends before the Tree's mark starts`).toBeLessThan(tree.x)
    }
  })

  test(`the arrow leads from the editor to the creators' overview with its + tile, in ${lang}`, async ({ browser }) => {
    const page = await loggedIn(browser)
    // From a Node under a Trail: the way out is the same from every Node.
    await page.goto(`${origin}/admin/trees/hidden-draft/full/does-not-apply${query}`)
    await page.locator('header.editor-chrome').getByRole('link', { name, exact: true }).click()

    await expect(page).toHaveURL(`${origin}/admin${query}`)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    const plus = page.locator('.tile--new')
    await expect(plus).toHaveText(`+${newTree}`)
    await expect(plus).toHaveAttribute('href', `/admin/new${query}`)
    await expect(page.locator('.tile[data-tree="hidden-draft"]')).toBeVisible()
  })
}

test('the editor with the arrow in its bar, for the pull request (#203)', async ({ browser }) => {
  for (const [width, height] of [
    [1280, 640],
    [360, 640],
  ] as const) {
    for (const { lang, query, name } of LANGUAGES) {
      const page = await loggedIn(browser, width, height)
      await page.goto(`${origin}/admin/trees/ai-act-example/start${query}`)
      await expect(page.locator('header.editor-chrome').getByRole('link', { name, exact: true })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: path.join(SHOTS, `editor-${lang}-${width}x${height}.png`) })
      await page.context().close()
    }
  }
})
