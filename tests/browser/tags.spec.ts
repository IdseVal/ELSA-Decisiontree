/**
 * **[#273]** A Tree's tags (docs/specs/application.md 26.6, 33.5; ADR-273-tags): the public
 * overview's filter -- a pill in the bar listing every served Tree's tag once, in the page's
 * language, whose ticks narrow the tiles at once, kept in the address and drawn from it by the
 * server -- and the top panel's tags field, which adds, rewords and removes them one language at
 * a time.
 *
 * Served from a data directory of its own (`serve.ts`): the example Tree (`AI Act`/`AI-verordening`
 * and `Agrifood`), three copies of the Dutch-only `single-language` fixture tagged here
 * (`food-tree`: `agrifood` and `Voedsel`; `law-tree`: `Wetgeving`; `plain`: none), a hidden copy
 * tagged `Geheim` and a hidden copy of the example, both Anna's; and a second directory with no
 * tag at all. Screenshots go to `docs/screenshots/issue-273/` under `ELSA_SHOTS=1` only.
 */
import { mkdir, mkdtemp, readFile, writeFile, cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, dataDir, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const fixtures = path.join(repo, 'tests', 'fixtures')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-273') : path.join(repo, 'tests', 'browser', '.results', 'shots')
const PORT = BASE_PORT + 273
const BARE_PORT = BASE_PORT + 274

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }

let origin: string
let bare: string

/** A copy of `source` whose manifest carries `tags`, written after its description as 3.7 orders them. */
async function tagged(source: string, tags: Array<Record<string, string>>): Promise<string> {
  const folder = path.join(await mkdtemp(path.join(tmpdir(), 'elsa-tags-')), path.basename(source))
  await cp(source, folder, { recursive: true })
  const file = path.join(folder, 'tree.json')
  const tree = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>
  const { nodes, metadata, ...head } = tree
  await writeFile(file, `${JSON.stringify({ ...head, tags, metadata, nodes }, null, 2)}\n`)
  return folder
}

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const single = path.join(fixtures, 'single-language')
  origin = await serveStore(
    await buildDataDir({
      trees: [
        { folder: path.join(repo, 'trees', 'ai-act-example') },
        { folder: await tagged(single, [{ nl: 'agrifood' }, { nl: 'Voedsel' }]), id: 'food-tree' },
        { folder: await tagged(single, [{ nl: 'Wetgeving' }]), id: 'law-tree' },
        { folder: single, id: 'plain' },
        { folder: await tagged(single, [{ nl: 'Geheim' }]), id: 'secret', hidden: true, creator: ANNA.email },
        { folder: path.join(repo, 'trees', 'ai-act-example'), id: 'two-languages', hidden: true, creator: ANNA.email },
      ],
      accounts: [ANNA],
    }),
    PORT,
    ADMIN_ENV,
  )
  bare = await serveStore(await dataDir([{ folder: single, id: 'plain' }]), BARE_PORT)
})

test.afterAll(async () => {
  await stopServers()
})

const pill = (page: Page) => page.locator('.page-chrome .tag-filter > summary')
/** The texts of the chips of the panel's tags field, in order. */
const chipTexts = (page: Page): Promise<string[]> => page.locator('.panel-tags .panel-tag-text').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))
const list = (page: Page) => page.locator('.tag-filter-panel')
/** The ids of the tiles a reader sees, in order. */
const shownTiles = (page: Page): Promise<string[]> =>
  page.locator('a.tile').evaluateAll((tiles) => tiles.filter((tile) => tile.checkVisibility()).map((tile) => tile.getAttribute('data-tree') ?? ''))

test.describe('the overview filter (26.6)', () => {
  test('the pill lists every served Tree\'s tag once, in the page\'s language, in its alphabet; a hidden Tree\'s in no list', async ({ page }) => {
    await page.goto(`${origin}/?lang=nl`)
    await expect(list(page)).toBeHidden()
    await pill(page).click()
    // `agrifood` and the example's `Agrifood` are one tag, written as the first Tree in id order writes it.
    await expect(list(page).locator('label')).toHaveText(['Agrifood', 'AI-verordening', 'Voedsel', 'Wetgeving'])
    await expect(list(page).getByRole('group', { name: 'Toon de bomen met het label' })).toBeVisible()

    // The Dutch-only Trees speak Dutch on the English page, as their titles do (23.2).
    await page.goto(`${origin}/`)
    await pill(page).click()
    await expect(list(page).locator('label')).toHaveText(['Agrifood', 'AI Act', 'Voedsel', 'Wetgeving'])
    expect(await page.content()).not.toContain('Geheim')
    await page.screenshot({ path: path.join(SHOTS, 'overview-tags-open-1280x640.png') })
  })

  test('a tick narrows the tiles to the Trees carrying any ticked tag, at once, in the address, with no request', async ({ page }) => {
    await page.goto(`${origin}/?lang=nl`)
    expect(await shownTiles(page)).toEqual(['ai-act-example', 'food-tree', 'law-tree', 'plain'])
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await pill(page).click()

    await list(page).getByLabel('Agrifood').check()
    expect(await shownTiles(page)).toEqual(['ai-act-example', 'food-tree'])
    expect(page.url()).toBe(`${origin}/?lang=nl&tag=Agrifood`)
    await expect(pill(page)).toHaveText('Labels1')

    await list(page).getByLabel('Wetgeving').check()
    expect(await shownTiles(page)).toEqual(['ai-act-example', 'food-tree', 'law-tree'])
    expect(page.url()).toBe(`${origin}/?lang=nl&tag=Agrifood&tag=Wetgeving`)
    await page.screenshot({ path: path.join(SHOTS, 'overview-tags-chosen-nl-1280x640.png') })

    await list(page).getByRole('link', { name: 'Toon alle bomen' }).click()
    expect(await shownTiles(page)).toEqual(['ai-act-example', 'food-tree', 'law-tree', 'plain'])
    expect(page.url()).toBe(`${origin}/?lang=nl`)
    await expect(pill(page)).toHaveText('Labels')
    expect(requests).toEqual([])
    expect(await page.context().cookies()).toEqual([])
  })

  test('a shared address is drawn filtered by the server, a tag no Tree carries ignored; without script the list is a form', async ({ browser }) => {
    const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage()
    await page.goto(`${origin}/?tag=AGRIFOOD&tag=Privacy`)
    expect(await shownTiles(page)).toEqual(['ai-act-example', 'food-tree'])
    await expect(pill(page)).toHaveText('Tags1')

    await page.goto(`${origin}/?lang=nl`)
    await pill(page).click()
    await list(page).getByLabel('Wetgeving').check()
    await list(page).getByRole('button', { name: 'Toon' }).click()
    await page.waitForURL(/tag=Wetgeving/)
    expect(new URL(page.url()).searchParams.getAll('lang')).toEqual(['nl'])
    expect(await shownTiles(page)).toEqual(['law-tree'])
    await expect(list(page).getByLabel('Wetgeving')).toBeChecked()
    await page.context().close()
  })

  test('Escape closes the list and gives the focus back to the pill; so does a click outside, without the focus', async ({ page }) => {
    await page.goto(`${origin}/`)
    await pill(page).click()
    await list(page).getByLabel('Voedsel').focus()
    await page.keyboard.press('Escape')
    await expect(list(page)).toBeHidden()
    await expect(pill(page)).toBeFocused()

    await pill(page).click()
    await expect(list(page)).toBeVisible()
    await page.locator('.overview').click({ position: { x: 5, y: 5 } })
    await expect(list(page)).toBeHidden()
  })

  test('no tag on any served Tree, no pill', async ({ page }) => {
    await page.goto(`${bare}/`)
    await expect(page.locator('a.tile')).toHaveCount(1)
    await expect(page.locator('.tag-filter')).toHaveCount(0)
  })

  test('the bar holds the pill without overflowing from 320 pixels up, closed and open', async ({ page }) => {
    for (const width of [320, 360, 480, 768, 1280]) {
      for (const query of ['', '?lang=nl&tag=Agrifood']) {
        await page.setViewportSize({ width, height: 640 })
        await page.goto(`${origin}/${query}`)
        await pill(page).click()
        const overflow = await page.evaluate(() => {
          const bar = document.querySelector('.page-chrome')!
          const panel = document.querySelector('.tag-filter-panel')!.getBoundingClientRect()
          return { bar: bar.scrollWidth - bar.clientWidth, page: document.documentElement.scrollWidth - window.innerWidth, left: panel.left, right: window.innerWidth - panel.right }
        })
        expect(overflow.bar, `${width} ${query}`).toBe(0)
        expect(overflow.page, `${width} ${query}`).toBe(0)
        expect(overflow.left, `${width} ${query}`).toBeGreaterThanOrEqual(0)
        expect(overflow.right, `${width} ${query}`).toBeGreaterThanOrEqual(0)
      }
    }
    // Below 480 a funnel stands for the word, which stays the pill's name; the current language's pill stays (24.3).
    await page.setViewportSize({ width: 320, height: 480 })
    await page.goto(`${origin}/?lang=nl&tag=Voedsel`)
    await expect(pill(page).locator('.tag-filter-icon')).toBeVisible()
    await expect(pill(page).locator('.tag-filter-word')).toBeHidden()
    await expect(pill(page)).toHaveAccessibleName('Labels 1')
    await expect(page.locator('header.page-chrome .language--current')).toBeVisible()
    await page.setViewportSize({ width: 480, height: 640 })
    await expect(pill(page).locator('.tag-filter-icon')).toBeHidden()
    await expect(pill(page).locator('.tag-filter-word')).toBeVisible()
    await page.setViewportSize({ width: 320, height: 480 })
    await page.goto(`${origin}/?lang=nl`)
    await expect(pill(page)).toHaveAccessibleName('Labels')
    await pill(page).click()
    await page.screenshot({ path: path.join(SHOTS, 'overview-tags-open-nl-320x480.png') })
  })
})

test.describe('the tags field of "This Tree" (33.5)', () => {
  /** Anna's editor at `address`, 1280 x 640, with the panel open, and her cookie for reading the draft. */
  async function panelOf(browser: Browser, address: string): Promise<{ page: Page; cookie: string }> {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
    const { status, cookie } = await login(page, origin, ANNA.email, ANNA.password)
    expect(status).toBe(204)
    await page.goto(`${origin}${address}`)
    await page.locator('.panel-sheet > .sheet-open').click()
    return { page, cookie }
  }

  /** The draft's tags as the store holds them: the entry's manifest (22.1). */
  async function storedTags(page: Page, cookie: string, tree: string): Promise<unknown> {
    const answer = await page.request.get(`${origin}/admin/api/trees/${tree}`, { headers: { Cookie: cookie } })
    expect(answer.status()).toBe(200)
    return ((await answer.json()) as { manifest: { tags?: unknown } }).manifest.tags
  }

  test('a tag is added, refused when the Tree has it, reworded in place and removed, each written whole', async ({ browser }) => {
    const { page, cookie } = await panelOf(browser, '/admin/trees/secret/start')
    const field = page.locator('.panel-tags')
    const chips = field.locator('.panel-tag-text')
    await expect.poll(() => chipTexts(page)).toEqual(['Geheim'])

    await field.getByRole('textbox', { name: 'Nieuw label' }).fill('Landbouw')
    await field.getByRole('button', { name: 'Toevoegen' }).click()
    await expect.poll(() => chipTexts(page)).toEqual(['Geheim', 'Landbouw'])
    expect(await storedTags(page, cookie, 'secret')).toEqual([{ nl: 'Geheim' }, { nl: 'Landbouw' }])

    // Letter case aside, the Tree has it: refused before anything is sent.
    await field.getByRole('textbox', { name: 'Nieuw label' }).fill(' geheim ')
    await field.getByRole('button', { name: 'Toevoegen' }).click()
    await expect(field.getByRole('alert')).toHaveText('Deze boom heeft dat label al.')
    expect(await storedTags(page, cookie, 'secret')).toEqual([{ nl: 'Geheim' }, { nl: 'Landbouw' }])

    await chips.nth(1).fill('Akkerbouw')
    await chips.nth(1).press('Enter')
    await expect.poll(() => storedTags(page, cookie, 'secret')).toEqual([{ nl: 'Geheim' }, { nl: 'Akkerbouw' }])
    await page.screenshot({ path: path.join(SHOTS, 'panel-tags-1280x640.png') })

    await field.getByRole('button', { name: 'Label verwijderen Geheim' }).click()
    await expect.poll(() => chipTexts(page)).toEqual(['Akkerbouw'])
    expect(await storedTags(page, cookie, 'secret')).toEqual([{ nl: 'Akkerbouw' }])
    await page.context().close()
  })

  test('one language at a time: a tag added in English is the to-do in Dutch, its English words the placeholder', async ({ browser }) => {
    const english = await panelOf(browser, '/admin/trees/two-languages/start')
    const add = english.page.locator('.panel-tags').getByRole('textbox', { name: 'New tag' })
    await add.fill('x'.repeat(40))
    // Held to 30 characters as it is typed (5.7, 28.4).
    await expect(add).toHaveValue('x'.repeat(30))
    await add.fill('Food')
    await add.press('Enter')
    await expect.poll(() => chipTexts(english.page)).toEqual(['AI Act', 'Agrifood', 'Food'])
    await english.page.context().close()

    const { page, cookie } = await panelOf(browser, '/admin/trees/two-languages/start?lang=nl')
    const chip = page.locator('.panel-tags .panel-tag-text').nth(2)
    await expect(chip).toHaveValue('')
    await expect(chip).toHaveAttribute('placeholder', 'Food')
    await chip.fill('Voedsel')
    await chip.press('Enter')
    await expect.poll(() => storedTags(page, cookie, 'two-languages')).toEqual([
      { en: 'AI Act', nl: 'AI-verordening' },
      { en: 'Agrifood', nl: 'Agrifood' },
      { en: 'Food', nl: 'Voedsel' },
    ])
    await page.context().close()
  })
})
