/**
 * **[#134]** The overview, `/` (docs/specs/application.md 23.2, 26.1 to 26.3, 35.3, 35.4):
 * one tile per published Tree in id order and no tile for a hidden one, each tile a link
 * to its Tree's root Node in the page's language or the Tree's default, the grid's box that
 * scrolls while the document never does, and `noTrees` when nothing is published.
 *
 * Served from data directories of its own (`serve.ts`): the named Trees of 35.3 -- the
 * example Tree, `tree-01` to `tree-14` from `tests/fixtures/single-language`, and
 * `hidden-draft` hidden -- and an empty one. The screenshots of the issue are taken of a
 * third, of the repository's two Trees and ten fixtures, so that the tiles differ; they are
 * written to `docs/screenshots/issue-134/` under `ELSA_SHOTS=1` only, the convention of
 * `tree-view.spec.ts`.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { openTree } from '../../src/tree/loader.ts'
import { BASE_PORT, dataDir, serveStore, stopServers } from './serve.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.join(here, '..', '..')
const fixtures = path.join(here, '..', 'fixtures')
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-134')
    : path.join(here, '.results', 'shots')

/** Clear of every other spec's ports. */
const NAMED_PORT = BASE_PORT + 70
const EMPTY_PORT = BASE_PORT + 71
const SHOWCASE_PORT = BASE_PORT + 72

/** `tree-01` to `tree-14` (35.3): enough tiles that the box has something to scroll. */
const NUMBERED = Array.from({ length: 14 }, (_ignored, index) => `tree-${String(index + 1).padStart(2, '0')}`)

let named: string
let empty: string
let showcase: string

test.beforeAll(async () => {
  named = await serveStore(
    await dataDir([
      { folder: path.join(repo, 'trees', 'ai-act-example') },
      ...NUMBERED.map((id) => ({ folder: path.join(fixtures, 'single-language'), id })),
      { folder: path.join(fixtures, 'full-node'), id: 'hidden-draft', hidden: true },
    ]),
    NAMED_PORT,
  )
  empty = await serveStore(await dataDir([]), EMPTY_PORT)
  showcase = await serveStore(
    await dataDir([
      { folder: path.join(repo, 'trees', 'ai-act-applicability-agrifood') },
      { folder: path.join(repo, 'trees', 'ai-act-example') },
      ...['carousel', 'cycle', 'explainers', 'findability', 'full-node', 'german-only', 'other-languages', 'overlay', 'single-language', 'tied-sources'].map(
        (id) => ({ folder: path.join(fixtures, id) }),
      ),
    ]),
    SHOWCASE_PORT,
  )
})

test.afterAll(async () => {
  await stopServers()
})

test('one tile per published Tree, in id order, and none for the hidden one', async ({ page }) => {
  await page.goto(`${named}/`)
  const trees = await page.locator('a.tile').evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('data-tree')))

  expect(trees).toEqual(['ai-act-example', ...NUMBERED])
  expect(await page.content()).not.toContain('hidden-draft')
})

test("a tile links to its root Node in the page's language, or the Tree's default and says so", async ({ page }) => {
  const dutchOnly = await openTree(path.join(fixtures, 'single-language'))
  const root = dutchOnly.manifest.root
  const example = page.locator('a.tile[data-tree="ai-act-example"]')
  const numbered = page.locator('a.tile[data-tree="tree-01"]')

  await page.goto(`${named}/`)
  await expect(example).toHaveAttribute('href', '/ai-act-example/start')
  await expect(example).not.toHaveAttribute('lang', /./)
  await expect(example.locator('.tile-title')).toHaveText('Does the EU AI Act apply to my AI system? (example)')
  await expect(example.locator('.tile-languages')).toHaveText('ENNL')
  // A Tree that does not speak the page's language is shown in its own, marked on the tile.
  await expect(numbered).toHaveAttribute('href', `/tree-01/${root}`)
  await expect(numbered).toHaveAttribute('lang', 'nl')
  await expect(numbered.locator('.tile-title')).toHaveText(dutchOnly.manifest.title.nl!)

  await page.goto(`${named}/?lang=nl`)
  await expect(example).toHaveAttribute('href', '/ai-act-example/start?lang=nl')
  await expect(example.locator('.tile-title')).toHaveText('Is de EU AI-verordening van toepassing op mijn AI-systeem? (voorbeeld)')
  await expect(numbered).not.toHaveAttribute('lang', /./)

  await numbered.click()
  await expect(page).toHaveURL(`${named}/tree-01/${root}`)
})

test('the box scrolls and the document does not: twelve tiles in view at 1280 x 640, the thirteenth below', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  await page.goto(`${named}/`)
  const box = page.locator('[data-scroll-box]')
  const tiles = page.locator('a.tile')

  // 26.1, 26.2: 280 x 160, four columns of 280 with gaps of 20, three rows in the box.
  for (const tile of await tiles.all()) {
    const size = await tile.boundingBox()
    expect([size!.width, size!.height]).toEqual([280, 160])
  }
  const lefts = new Set(await tiles.evaluateAll((all) => all.map((tile) => tile.getBoundingClientRect().left)))
  expect(lefts.size).toBe(4)
  for (let index = 0; index < 15; index += 1) {
    const tile = tiles.nth(index)
    if (index < 12) await expect(tile, `tile ${index + 1}`).toBeInViewport({ ratio: 1 })
    else await expect(tile, `tile ${index + 1}`).not.toBeInViewport({ ratio: 1 })
  }
  const measured = await page.evaluate(() => {
    const scroller = document.querySelector('[data-scroll-box]')!
    return {
      document: [document.documentElement.scrollHeight, window.innerHeight],
      box: [scroller.scrollHeight, scroller.clientHeight],
    }
  })
  expect(measured.document[0]).toBeLessThanOrEqual(measured.document[1]!)
  expect(measured.box[0]).toBeGreaterThan(measured.box[1]!)

  // A native scroll container: the keyboard scrolls it once it has the focus, no script needed.
  await box.focus()
  await page.keyboard.press('End')
  await expect(tiles.last()).toBeInViewport({ ratio: 1 })
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0)
})

test('with nothing published, the overview says so in the chrome language', async ({ page }) => {
  await page.goto(`${empty}/`)
  await expect(page.locator('a.tile')).toHaveCount(0)
  await expect(page.locator('.overview-empty')).toHaveText('No decision tree is published here yet.')

  await page.goto(`${empty}/?lang=nl`)
  await expect(page.locator('.overview-empty')).toHaveText('Hier is nog geen beslisboom gepubliceerd.')
})

test('a Tree title is text on its tile, never markup', async ({ page }) => {
  // The findability fixture's title carries `<b>`, quotes and `</script>` (16.3).
  await page.goto(`${showcase}/`)
  const tile = page.locator('a.tile[data-tree="findability"] .tile-title')

  await expect(tile).toContainText('<b>')
  await expect(tile.locator('b')).toHaveCount(0)
})

test('the overview in English and Dutch at 1280 x 640', async ({ page }) => {
  await mkdir(SHOTS, { recursive: true })
  await page.setViewportSize({ width: 1280, height: 640 })
  for (const lang of ['en', 'nl']) {
    await page.goto(`${showcase}/${lang === 'en' ? '' : `?lang=${lang}`}`)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('a.tile')).toHaveCount(12)
    await page.screenshot({ path: path.join(SHOTS, `overview-${lang}-1280x640.png`) })
  }
})
