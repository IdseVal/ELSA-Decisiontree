/**
 * The creators' overview and the new-Tree form, in a browser (docs/specs/application.md
 * 26.4, 27; ADR-133-overview-tiles, ADR-133-new-tree-form): who sees which Tree, the two
 * groups and where each tile leads, the + tile absent for a visitor, and the form's
 * **[#168]** one title, the address it derives without asking, and its landing -- against a fresh data directory on
 * a server of this file's own. Each creator's hidden Tree is made through the route of #136,
 * as the form makes one, so its `meta.json` names the creator the store itself wrote.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const PORT = BASE_PORT + 95
/** The screenshots 35.7 asks for: the tracked set under `ELSA_SHOTS=1`, the results folder otherwise. */
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-137')
    : path.join(repo, 'tests', 'browser', '.results', 'shots')
/** **[#168]** The simplified form's screenshots, tracked beside the issue that asked for it. */
const SHOTS_168 = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-168') : SHOTS

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const CEES = { email: 'cees@example.org', name: 'Cees', password: 'cees first password' }

let origin: string

/** A new page in a context of its own, logged in as `name`. */
async function loggedIn(browser: Browser, name: string, password: string): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  expect((await login(page, origin, name, password)).status).toBe(204)
  return page
}

/**
 * Creates a hidden Tree as `name` through the route the form posts to (22.1). The session
 * travels in a header: the request context keeps no `Secure` cookie on plain http (`login`).
 */
async function createHidden(browser: Browser, name: string, password: string, id: string, title: string): Promise<void> {
  const page = await (await browser.newContext()).newPage()
  const { cookie } = await login(page, origin, name, password)
  const answer = await page.request.post(`${origin}/admin/api/trees`, {
    headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
    data: { id, languages: ['en'], title: { en: title } },
  })
  expect(answer.status()).toBe(201)
}

/** The ids of the tiles on the page, in order; the + tile is not one. */
function tileIds(page: Page): Promise<string[]> {
  return page.locator('.tile[data-tree]').evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('data-tree')!))
}

test.beforeAll(async ({ browser }) => {
  const dir = await buildDataDir({ trees: [{ folder: path.join(repo, 'trees', 'ai-act-example') }], accounts: [ANNA, CEES] })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
  await createHidden(browser, ANNA.email, ANNA.password, 'anna-draft', "Anna's draft")
  await createHidden(browser, CEES.email, CEES.password, 'cees-draft', "Cees's draft")
})

test.afterAll(async () => {
  await stopServers()
})

test.describe('which Trees, in what order, leading where (26.4)', () => {
  test("a creator sees their hidden Tree first, then every other published one, and not another creator's hidden Tree", async ({ browser }) => {
    const page = await loggedIn(browser, ANNA.email, ANNA.password)
    await page.goto(`${origin}/admin`)

    // Own before the rest, although `ai-act-example` sorts before `anna-draft`.
    expect(await tileIds(page)).toEqual(['anna-draft', 'ai-act-example'])
    const own = page.locator('.tile[data-tree="anna-draft"]')
    await expect(own).toHaveAttribute('href', '/admin/trees/anna-draft/start')
    await expect(own.locator('.tile-state')).toHaveText('Hidden')
    await expect(own.locator('.tile-state')).toHaveClass(/tile-state--hidden/)
    // No role on it: the public page, where the editor would answer 403 (21.3).
    const theirs = page.locator('.tile[data-tree="ai-act-example"]')
    await expect(theirs).toHaveAttribute('href', '/ai-act-example/start')
    await expect(theirs.locator('.tile-state')).toHaveText('Published')
  })

  test('the administrator sees every Tree, hidden ones of both creators, each leading to its editor', async ({ browser }) => {
    const page = await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto(`${origin}/admin`)

    expect(await tileIds(page)).toEqual(['ai-act-example', 'anna-draft', 'cees-draft'])
    await expect(page.locator('.tile[data-tree="ai-act-example"]')).toHaveAttribute('href', '/admin/trees/ai-act-example/start')
    await expect(page.locator('.tile[data-tree="cees-draft"] .tile-state')).toHaveText('Hidden')
  })

  test('the + tile is first, top left, and leads to the form in the page language', async ({ browser }) => {
    const page = await loggedIn(browser, CEES.email, CEES.password)
    await page.goto(`${origin}/admin?lang=nl`)

    const first = page.locator('.tiles > li').first().locator('a')
    await expect(first).toHaveClass(/tile--new/)
    await expect(first).toHaveText('+Nieuwe boom')
    await expect(first).toHaveAttribute('href', '/admin/new?lang=nl')
    await expect(page.locator('.tile[data-tree="cees-draft"] .tile-state')).toHaveText('Verborgen')
    const box = (await first.boundingBox())!
    const grid = (await page.locator('.tiles').boundingBox())!
    expect([box.x, box.y]).toEqual([grid.x, grid.y])
  })

  test('a visitor without a session sees no + tile: the login page at /admin, the public overview at /', async ({ page }) => {
    await page.goto(`${origin}/admin`)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.locator('.tile--new')).toHaveCount(0)

    await page.goto(`${origin}/`)
    expect(await tileIds(page)).toEqual(['ai-act-example'])
    await expect(page.locator('.tile--new')).toHaveCount(0)
    await expect(page.locator('.tile-state')).toHaveCount(0)
  })
})

test.describe('the new-Tree form (27)', () => {
  test('asks a title and the languages only: the page language is its one, default, tag, and no address is asked', async ({ browser }) => {
    const page = await loggedIn(browser, ANNA.email, ANNA.password)
    await page.goto(`${origin}/admin/new?lang=nl`)

    await expect(page.locator('.new-tree-tag')).toHaveCount(1)
    await expect(page.locator('.new-tree-tag')).toHaveText('nlstandaard')
    await expect(page.getByLabel('Titel', { exact: true })).toBeVisible()
    await expect(page.locator('.new-tree input')).toHaveCount(2)
    await expect(page.locator('.new-tree')).not.toContainText('/start')
    await expect(page.locator('.new-tree .admin-note, .new-tree .admin-hint')).toHaveCount(0)

    await page.goto(`${origin}/admin/new`)
    await expect(page.getByLabel('Title', { exact: true })).toBeEnabled()
    await page.screenshot({ path: path.join(SHOTS_168, 'new-tree-form.png') })
  })

  test('adds, orders and removes languages: the first is the default, the last cannot be removed; a title for each added one', async ({ browser }) => {
    const page = await loggedIn(browser, ANNA.email, ANNA.password)
    await page.goto(`${origin}/admin/new`)
    const tags = page.locator('.new-tree-tag-name')

    await expect(page.getByRole('button', { name: 'Remove en' })).toHaveCount(0)
    await page.locator('.new-tree-add').getByRole('button', { name: 'nl', exact: true }).click()
    await page.getByLabel('Language tag', { exact: true }).fill('pt-br')
    await page.getByLabel('Language tag', { exact: true }).press('Enter')
    await expect(tags).toHaveText(['en', 'nl', 'pt-br'])
    await expect(page.getByLabel(/^Title/)).toHaveCount(3)
    await page.getByLabel('Title (en)').fill('Does the AI Act apply?')
    await page.getByLabel('Title (nl)').fill('Is de AI-verordening van toepassing?')
    await expect(page.locator('.new-tree-count')).toHaveText(['22 / 80', '36 / 80', '0 / 80'])
    await page.screenshot({ path: path.join(SHOTS_168, 'new-tree-form-three-languages.png') })

    await page.locator('.new-tree-tag[data-language="pt-br"]').getByRole('button', { name: 'Make default' }).click()
    await expect(tags).toHaveText(['pt-br', 'en', 'nl'])
    await expect(page.locator('.new-tree-tag').first()).toContainText('default')

    await page.getByLabel('Language tag', { exact: true }).fill('Not a tag')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.locator('.new-tree').getByRole('alert')).toHaveText('A language tag such as en, nl or pt-br.')
    await expect(tags).toHaveText(['pt-br', 'en', 'nl'])

    await page.getByRole('button', { name: 'Remove en' }).click()
    await page.getByRole('button', { name: 'Remove nl' }).click()
    await expect(tags).toHaveText(['pt-br'])
    await expect(page.getByRole('button', { name: 'Remove pt-br' })).toHaveCount(0)
    await expect(page.getByLabel(/^Title/)).toHaveCount(1)
    await expect(page.getByLabel('Title', { exact: true })).toHaveAttribute('lang', 'pt-br')
  })

  test('sends nothing without a title', async ({ browser }) => {
    const page = await loggedIn(browser, ANNA.email, ANNA.password)
    const sent: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'POST') sent.push(request.url())
    })
    await page.goto(`${origin}/admin/new`)
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page.getByLabel('Title', { exact: true })).toBeFocused()
    await expect(page).toHaveURL(`${origin}/admin/new`)
    expect(sent).toEqual([])
  })

  test("creates the Tree at the next address when its title's is taken, without asking", async ({ browser }) => {
    const page = await loggedIn(browser, CEES.email, CEES.password)
    const answers: string[] = []
    page.on('response', (response) => {
      if (response.url() === `${origin}/admin/api/trees`) answers.push(`${response.status()} ${JSON.parse(response.request().postData()!).id}`)
    })
    await page.goto(`${origin}/admin/new`)
    await page.getByLabel('Title', { exact: true }).fill('AI Act example')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page).toHaveURL(`${origin}/admin/trees/ai-act-example-2/start`)
    expect(answers).toEqual(['409 ai-act-example', '201 ai-act-example-2'])
  })

  test('creates the Tree at the next address when its title is a reserved word', async ({ browser }) => {
    const page = await loggedIn(browser, CEES.email, CEES.password)
    await page.goto(`${origin}/admin/new`)
    await page.getByLabel('Title', { exact: true }).fill('Admin')
    await page.getByRole('button', { name: 'Create' }).click()

    await expect(page).toHaveURL(`${origin}/admin/trees/admin-2/start`)
  })

  test("creates the Tree hidden and lands in its editor; it is on the creator's overview and not on the public one", async ({ browser }) => {
    const page = await loggedIn(browser, ANNA.email, ANNA.password)
    await page.goto(`${origin}/admin`)
    await page.screenshot({ path: path.join(SHOTS, 'creators-overview.png') })
    await page.locator('.tile--new').click()
    await expect(page).toHaveURL(`${origin}/admin/new`)

    await page.locator('.new-tree-add').getByRole('button', { name: 'nl', exact: true }).click()
    await page.getByLabel('Title (en)').fill('Data Act: does it apply?')
    await page.getByLabel('Title (nl)').fill('Is de Dataverordening van toepassing?')
    await page.getByRole('button', { name: 'Create' }).click()

    // The editor of the root Node; #138 builds it, so until then its address is all there is.
    await expect(page).toHaveURL(`${origin}/admin/trees/data-act-does-it-apply/start`)

    await page.goto(`${origin}/admin`)
    expect(await tileIds(page)).toEqual(['anna-draft', 'data-act-does-it-apply', 'ai-act-example'])
    const created = page.locator('.tile[data-tree="data-act-does-it-apply"]')
    await expect(created.locator('.tile-title')).toHaveText('Data Act: does it apply?')
    await expect(created.locator('.tile-languages')).toHaveText('ENNLHidden')
    await page.screenshot({ path: path.join(SHOTS, 'creators-overview-with-new-tree.png') })

    await page.goto(`${origin}/`)
    expect(await tileIds(page)).toEqual(['ai-act-example'])
    expect((await page.request.get(`${origin}/data-act-does-it-apply/start`)).status()).toBe(404)
    await page.screenshot({ path: path.join(SHOTS, 'public-overview-without-new-tree.png') })
  })

  test('lands in the page language when the new Tree declares it', async ({ browser }) => {
    const page = await loggedIn(browser, ANNA.email, ANNA.password)
    await page.goto(`${origin}/admin/new?lang=nl`)
    await page.locator('.new-tree-add').getByRole('button', { name: 'en', exact: true }).click()
    await page.locator('.new-tree-tag[data-language="en"]').getByRole('button', { name: 'Maak standaard' }).click()
    await page.getByLabel('Titel (en)').fill('Second tree')
    await page.getByLabel('Titel (nl)').fill('Tweede boom')
    await page.getByRole('button', { name: 'Aanmaken' }).click()

    // The address is the default language's title's.
    await expect(page).toHaveURL(`${origin}/admin/trees/second-tree/start?lang=nl`)
  })
})
