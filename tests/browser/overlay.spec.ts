/**
 * The Overlay in a real browser (docs/specs/application.md 10.9, 14; ADR-78-overlay): an
 * Option button opens its target's Interior over the page and closes by the cross, by
 * Escape and by a click outside; the focus goes to the cross and comes back to the button;
 * the address never changes for it; an explanation Node's URL renders its parent's page
 * with that Overlay open; one Overlay at a time; and without JavaScript the button is a
 * disclosure whose second click closes it, and the heading a plain link to the aside's
 * address.
 *
 * The screenshots issue #80 owes go to the gitignored results folder unless `ELSA_SHOTS=1`
 * asks for the tracked set in `docs/screenshots/issue-80/` (the convention of
 * tree-view.spec.ts). The server serves `trees/ai-act-example` (playwright.config.ts); the
 * first Tree and the fixtures are served by `serve.ts`.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { arrived } from './arrived.ts'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-80')
    : path.join(repo, 'tests', 'browser', '.results', 'shots')

const QUESTION = '/ai-act-example/start/prohibited-practices'
const FIRST_OPTION = `${QUESTION}/social-scoring`
const SECOND_OPTION = `${QUESTION}/emotion-recognition-at-work`

/** Ports for the servers this file starts; clear of the other specs'. */
const FIRST_TREE_PORT = BASE_PORT + 40
const FULL_NODE_PORT = BASE_PORT + 41

test.afterAll(() => stopServers())

/** What the browser is focused on, as `tag.class`, or '' when nothing is. */
async function focused(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement
    if (!active || active === document.body) return ''
    return `${active.tagName.toLowerCase()}${[...active.classList].map((c) => `.${c}`).join('')}`
  })
}

/** The path and query of the address bar: what a Branch's `href` is written as. */
function local(page: Page): string {
  const { pathname, search } = new URL(page.url())
  return pathname + search
}

test.describe('opening and closing', () => {
  test('a click on an Option button opens its Overlay over the page, and the address does not change', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(QUESTION)
    const overlay = page.locator('.overlay').first()
    const panel = overlay.locator('.sheet-panel')
    await expect(panel).toBeHidden()

    await overlay.locator('.sheet-open').click()
    await expect(panel).toBeVisible()
    await expect(panel.locator('h2 a')).toHaveText('Social scoring')
    await expect(panel.locator('h2 a')).toHaveAttribute('href', FIRST_OPTION)
    // The parent's page is underneath, unchanged: its title is still the page heading.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Does your system do any of the prohibited practices?')
    expect(local(page)).toBe(QUESTION)
    // The focus moved to the cross (10.9): on the toggle event, a task after the click.
    await expect(overlay.locator('.sheet-close--cross')).toBeFocused()
  })

  test('the cross closes it and the focus returns to the Option button', async ({ page }) => {
    await page.goto(QUESTION)
    const overlay = page.locator('.overlay').first()
    await overlay.locator('.sheet-open').click()
    await expect(overlay.locator('.sheet-panel')).toBeVisible()

    await overlay.locator('.sheet-close').click()
    await expect(overlay.locator('.sheet-panel')).toBeHidden()
    await expect(overlay.locator('.sheet-open')).toBeFocused()
    expect(local(page)).toBe(QUESTION)
  })

  test('Escape closes it and the focus returns to the Option button', async ({ page }) => {
    await page.goto(QUESTION)
    const overlay = page.locator('.overlay').first()
    await overlay.locator('.sheet-open').click()
    await expect(overlay.locator('.sheet-panel')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(overlay.locator('.sheet-panel')).toBeHidden()
    await expect(overlay.locator('.sheet-open')).toBeFocused()
    expect(local(page)).toBe(QUESTION)
  })

  test('a click outside the panel closes it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(QUESTION)
    const overlay = page.locator('.overlay').first()
    await overlay.locator('.sheet-open').click()
    await expect(overlay.locator('.sheet-panel')).toBeVisible()

    // The top left corner of the page: outside the 760 x 608 panel at every guaranteed size.
    await page.mouse.click(8, 100)
    await expect(overlay.locator('.sheet-panel')).toBeHidden()
    expect(local(page)).toBe(QUESTION)
  })

  test('one Overlay at a time: opening the second closes the first', async ({ page }) => {
    await page.goto(QUESTION)
    const overlays = page.locator('.overlay')
    await overlays.nth(0).locator('.sheet-open').click()
    await expect(overlays.nth(0).locator('.sheet-panel')).toBeVisible()
    // The backdrop veils the page; the keyboard still reaches the second button (14).
    await overlays.nth(1).locator('.sheet-open').focus()
    await page.keyboard.press('Enter')
    await expect(overlays.nth(1).locator('.sheet-panel')).toBeVisible()
    await expect(overlays.nth(0).locator('.sheet-panel')).toBeHidden()
    await expect(overlays.nth(1).locator('h2 a')).toHaveText('Emotion recognition at work or in education')
  })
})

test.describe('the keyboard', () => {
  test('Enter on a focused Option button opens its Overlay; Tab reaches the cross, the heading link and the Sources; Escape returns', async ({ page }) => {
    await page.goto(QUESTION)
    const overlay = page.locator('.overlay').first()
    await overlay.locator('.sheet-open').focus()
    await page.keyboard.press('Enter')
    await expect(overlay.locator('.sheet-panel')).toBeVisible()
    await expect(overlay.locator('.sheet-close--cross')).toBeFocused()

    await page.keyboard.press('Tab')
    expect(await focused(page)).toBe('a')
    await expect(page.locator(':focus')).toHaveAttribute('href', FIRST_OPTION)
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('target', '_blank')

    await page.keyboard.press('Escape')
    await expect(overlay.locator('.sheet-panel')).toBeHidden()
    await expect(overlay.locator('.sheet-open')).toBeFocused()
    expect(local(page)).toBe(QUESTION)
  })

  test('Space on a focused Option button opens it too, and Enter on the cross closes it', async ({ page }) => {
    await page.goto(QUESTION)
    const overlay = page.locator('.overlay').first()
    await overlay.locator('.sheet-open').focus()
    await page.keyboard.press('Space')
    await expect(overlay.locator('.sheet-panel')).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(overlay.locator('.sheet-panel')).toBeHidden()
    await expect(overlay.locator('.sheet-open')).toBeFocused()
  })
})

test.describe('the address rule (10.9, core document 10.27)', () => {
  test("an explanation Node's URL renders its parent's page with that Overlay open, and its own address in the heading", async ({ page }) => {
    await page.goto(FIRST_OPTION)
    expect(local(page)).toBe(FIRST_OPTION)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Does your system do any of the prohibited practices?')
    const overlays = page.locator('.overlay')
    await expect(overlays.nth(0).locator('.sheet-panel')).toBeVisible()
    await expect(overlays.nth(1).locator('.sheet-panel')).toBeHidden()
    await expect(overlays.nth(0).locator('h2 a')).toHaveAttribute('href', FIRST_OPTION)
    await expect(overlays.nth(0).locator('h2 a')).toHaveText('Social scoring')
    // The parent's Answers are built from the path up to the parent: the aside never joins the Trail.
    await expect(page.locator('.answer--yes')).toHaveAttribute('href', `${QUESTION}/prohibited`)
    await expect(page.locator('.trail-entry')).toHaveCount(1)
  })

  test('closing a URL-opened Overlay leaves the address as it was; the browser back is the way to the page before', async ({ page }) => {
    await page.goto(QUESTION)
    await page.goto(FIRST_OPTION)
    await page.keyboard.press('Escape')
    await expect(page.locator('.overlay .sheet-panel:visible')).toHaveCount(0)
    expect(local(page)).toBe(FIRST_OPTION)
    await page.goBack()
    await arrived(page, QUESTION)
  })

  test('a path with no question Node or Terminal in it shows the explanation Node as the centre, with startAgain', async ({ page }) => {
    await page.goto('/ai-act-example/social-scoring')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Social scoring')
    await expect(page.locator('.overlay')).toHaveCount(0)
    await expect(page.locator('.answer--start-again')).toHaveCount(1)
    await expect(page.locator('.answer--back')).toHaveCount(0)
  })

  test("a second-level Option is a plain link to the deeper address, which renders the same page with the deeper Overlay open", async ({ page }) => {
    const origin = await serve(path.join(repo, 'tests', 'fixtures'), 'full-node', FULL_NODE_PORT)
    expect(origin, 'the full-node fixture is a valid Tree').not.toBeNull()
    await page.goto(`${origin}/full-node/full`)
    const first = page.locator('.overlay').first()
    await first.locator('.sheet-open').click()
    await expect(first.locator('.sheet-panel')).toBeVisible()
    const deeper = first.locator('.overlay-options a')
    await expect(deeper).toHaveAttribute('href', '/full-node/full/opt-one/opt-two')
    await deeper.click()
    await expect(page).toHaveURL(`${origin}/full-node/full/opt-one/opt-two`)

    // The same parent's page; the deeper Overlay open and the first closed; no button for the deeper one.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The full Node')
    await expect(first.locator('.sheet-panel')).toBeHidden()
    const extra = page.locator('.overlay--unbuttoned')
    await expect(extra.locator('.sheet-panel')).toBeVisible()
    await expect(extra.locator('h2 a')).toHaveText('Option two: a title of sixty characters, the most it may be.')
    await expect(extra.locator('.sheet-open')).toBeHidden()
    // Eight buttons on the page, none of them the extra's.
    await expect(page.locator('.options .overlay')).toHaveCount(8)
    await page.goBack()
    await expect(page).toHaveURL(`${origin}/full-node/full`)
  })
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('the Option button is a disclosure: a click opens the Interior over the page, a second click closes it, and the heading is a plain link', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(QUESTION)
    const overlay = page.locator('.overlay').first()
    const control = overlay.locator('.sheet-open')
    await control.click()
    await expect(overlay.locator('.sheet-panel')).toBeVisible()
    await expect(overlay.locator('.sheet-close')).toHaveCount(0)
    await expect(overlay.locator('.sheet-backdrop')).toHaveCount(0)
    expect(local(page)).toBe(QUESTION)

    // The button stays uncovered beside the Bubble and takes the click that closes it (14).
    await control.click()
    await expect(overlay.locator('.sheet-panel')).toBeHidden()

    await control.click()
    await overlay.locator('h2 a').click()
    await expect(page).toHaveURL(FIRST_OPTION)
    await expect(page.locator('.overlay').first().locator('.sheet-panel')).toBeVisible()
  })

  test("a URL-opened Overlay is rendered open by the server, so a shared link shows the aside", async ({ page }) => {
    await page.goto(SECOND_OPTION)
    const overlays = page.locator('.overlay')
    await expect(overlays.nth(1).locator('.sheet-panel')).toBeVisible()
    await expect(overlays.nth(0).locator('.sheet-panel')).toBeHidden()
    await expect(overlays.nth(1).locator('h2 a')).toHaveText('Emotion recognition at work or in education')
  })
})

/** The three pages the issue asks screenshots of, on the first Tree. */
const FIRST_TREE_SHOTS = [
  ['article-2-exclusions-fan', '/ai-act-applicability-agrifood/start/article-2-exclusions', null],
  [
    'article-2-exclusions-overlay-research',
    '/ai-act-applicability-agrifood/start/article-2-exclusions/exclusion-research-and-development',
    'exclusion-research-and-development',
  ],
  ['annex-i-legislation-fan', '/ai-act-applicability-agrifood/start/annex-i-legislation', null],
] as const

for (const [width, height] of [
  [1280, 640],
  [2560, 1440],
] as const) {
  test(`the first Tree's fan and Overlay at ${width} x ${height}, screenshot`, async ({ page }) => {
    const origin = await serve(path.join(repo, 'trees'), 'ai-act-applicability-agrifood', FIRST_TREE_PORT)
    expect(origin, 'the first Tree starts').not.toBeNull()
    await page.setViewportSize({ width, height })
    for (const [name, url, open] of FIRST_TREE_SHOTS) {
      await page.goto(`${origin}${url}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (open) await expect(page.locator(`.overlay-interior[data-node="${open}"]`)).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: path.join(SHOTS, `${name}-${width}x${height}.png`) })
    }
  })
}
