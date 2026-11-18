/**
 * **[#264]** The description's box (docs/specs/application.md 43.3, 43.5, 43.6;
 * ADR-263-description-scroll), on `tests/fixtures/long-full-node/`'s full Node, whose description
 * is 600 counted characters and 8 estimated lines, so at 1280 x 640 the box holds more than it
 * shows (43.2). What no-scroll.spec.ts cannot see: that the keyboard reaches the box and scrolls
 * it while the document stays put, that a wheel at its end goes nowhere, that an explainer's
 * panel opened from a term in a scrolled box lies inside the text area and on top and closes when
 * the box scrolls, and that every box starts at its top -- in a neighbour frame, after a slide and
 * after the history step. And the findability readers' two strings of 16.3 on such a description
 * (43.7). With `ELSA_SHOTS=1` the four screenshots of the pull request are written to
 * `docs/screenshots/issue-264/`.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { arrived } from './arrived.ts'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const fixtures = path.join(repo, 'tests', 'fixtures')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-264') : path.join(repo, 'tests', 'browser', '.results', 'shots')

/** Clear of every other spec's ports. */
const PORT = BASE_PORT + 275
const LONG_OVERLAY_PORT = BASE_PORT + 276

/** The full Node at a Trail of one. */
const FULL = '/long-full-node/full/full'
const BOX = '.tree-frame:not([aria-hidden]) .bubble [data-description-box]'

let origin: string

test.beforeAll(async () => {
  const started = await serve(fixtures, 'long-full-node', PORT)
  expect(started, 'the long-full-node fixture is a valid Tree').not.toBeNull()
  origin = started!
})

test.afterAll(stopServers)

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 })
})

/** The box's scroll position and how far it can go, and the document's own scroll. */
async function scrolls(page: Page, box = BOX): Promise<{ top: number; end: number; document: number }> {
  return page.locator(box).evaluate((element) => ({
    top: Math.round(element.scrollTop),
    end: element.scrollHeight - element.clientHeight,
    document: document.documentElement.scrollTop + document.body.scrollTop,
  }))
}

/** Opens `url` and waits for the script, which hands the panels to Explainer.tsx (10.8). */
async function open(page: Page, url: string): Promise<void> {
  await page.goto(`${origin}${url}`)
  await expect(page.locator(`${BOX}[data-enhanced]`)).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
}

test('the box holds more than it shows at 1280 x 640, and is a region named by the title (43.2, 43.5)', async ({ page }) => {
  await open(page, FULL)
  const box = page.locator(BOX)
  expect((await scrolls(page)).end).toBeGreaterThan(0)
  await expect(box).toHaveAttribute('role', 'region')
  await expect(box).toHaveAttribute('tabindex', '0')
  const title = await page.locator('.tree-frame:not([aria-hidden]) .bubble h1').textContent()
  await expect(box).toHaveAccessibleName(title!)
  // Not positioned, so an explainer's panel keeps the text area as its containing block (43.3).
  expect(await box.evaluate((element) => getComputedStyle(element).position)).toBe('static')
  expect(await box.evaluate((element) => [getComputedStyle(element).overflowY, getComputedStyle(element).overscrollBehaviorY])).toEqual(['auto', 'contain'])
})

test('Tab reaches the box after the main image and before the term inside it; ArrowDown, End and Home scroll it and the document stays at 0 (43.5)', async ({ page }) => {
  await open(page, FULL)
  await page.locator('.tree-frame:not([aria-hidden]) .bubble a.main-image').focus()
  await page.keyboard.press('Tab')
  await expect(page.locator(BOX)).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect.poll(async () => (await scrolls(page)).top).toBeGreaterThan(0)
  expect((await scrolls(page)).document).toBe(0)
  await page.keyboard.press('End')
  await expect.poll(async () => { const s = await scrolls(page); return s.end - s.top }).toBeLessThanOrEqual(1)
  expect((await scrolls(page)).document).toBe(0)
  await page.keyboard.press('Home')
  await expect.poll(async () => (await scrolls(page)).top).toBe(0)
  // The next stop is the term the description marks, inside the box.
  await page.keyboard.press('Tab')
  await expect(page.locator(`${BOX} .term`).first()).toBeFocused()
})

test('a wheel at the box\'s end moves neither the box nor the document (43.5)', async ({ page }) => {
  await open(page, FULL)
  const box = page.locator(BOX)
  await box.evaluate((element) => (element.scrollTop = element.scrollHeight))
  const atEnd = await scrolls(page)
  expect(atEnd.end - atEnd.top).toBeLessThanOrEqual(1)
  const { x, y, width, height } = (await box.boundingBox())!
  await page.mouse.move(x + width / 2, y + height / 2)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(300)
  expect(await scrolls(page)).toEqual(atEnd)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('a term focused from a box at its end opens its panel inside the text area and on top; a scroll of the box closes it (43.5)', async ({ page }) => {
  await open(page, FULL)
  const box = page.locator(BOX)
  await box.focus()
  await page.keyboard.press('End')
  await expect.poll(async () => { const s = await scrolls(page); return s.end - s.top }).toBeLessThanOrEqual(1)
  // The mark is in the first sentence: at the box's end it is above the box's top.
  const term = page.locator(`${BOX} .term`).first()
  const panel = page.locator(`[id="${await term.getAttribute('aria-describedby')}"]`)
  await page.keyboard.press('Tab')
  await expect(term).toBeFocused()
  await expect(panel).toBeVisible()
  // Give the scroll that brought the term into view its frame: the panel stays open after it.
  await page.waitForTimeout(300)
  await expect(panel).toBeVisible()

  const area = (await page.locator('.tree-frame:not([aria-hidden]) .bubble-text').boundingBox())!
  const shown = (await box.boundingBox())!
  const line = (await term.boundingBox())!
  const placed = (await panel.boundingBox())!
  // The term is in the box's view again, and the panel against its line, inside the text area.
  expect(line.y).toBeGreaterThanOrEqual(shown.y - 1)
  expect(line.y + line.height).toBeLessThanOrEqual(shown.y + shown.height + 1)
  expect(placed.y).toBeGreaterThanOrEqual(area.y - 1)
  expect(placed.y + placed.height).toBeLessThanOrEqual(area.y + area.height + 1)
  expect(placed.x).toBeGreaterThanOrEqual(area.x - 1)
  expect(placed.x + placed.width).toBeLessThanOrEqual(area.x + area.width + 1)
  // On top: what is drawn at the panel's centre is the panel.
  const onTop = await page.evaluate(
    ({ x, y, id }) => document.elementFromPoint(x, y)?.closest(`[id="${id}"]`) !== null,
    { x: placed.x + placed.width / 2, y: placed.y + placed.height / 2, id: (await term.getAttribute('aria-describedby'))! },
  )
  expect(onTop, 'the panel is drawn over the box').toBe(true)

  await box.evaluate((element) => (element.scrollTop += 40))
  await expect(panel).toBeHidden()
})

test('every box starts at its top: in the neighbour frame mid-slide, after the slide and after the history step (43.6)', async ({ page }) => {
  // From the full Node's first ending, whose up arrow slides back to the full Node: held halfway,
  // the full Node is the frame that arrives, drawn from the neighbour props.
  await open(page, '/long-full-node/full/applies')
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/*', async (route) => {
    if (route.request().headers()['rsc'] === '1') await held
    await route.continue()
  })
  await page.locator('.tree-frame:not([aria-hidden]) .up-arrow').click()
  await page.waitForFunction(() => {
    const animation = document.querySelector('.tree-layer[data-sliding]')?.getAnimations()[0]
    if (!animation) return false
    animation.pause()
    return true
  })
  const neighbour = await page.locator('.tree-frame [data-description-box]').evaluateAll((boxes) =>
    boxes.filter((box) => box.scrollHeight > box.clientHeight + 1).map((box) => box.scrollTop),
  )
  expect(neighbour.length, 'the arriving frame draws the long description in a box that scrolls').toBeGreaterThan(0)
  expect(neighbour.every((top) => top === 0), `the arriving frame's box at ${neighbour}`).toBe(true)
  release()
  await page.evaluate(() => document.querySelector('.tree-layer')?.getAnimations()[0]?.play())
  await arrived(page, `${origin}/long-full-node/full`)
  await page.unroute('**/*')
  expect((await scrolls(page)).top, 'after the slide').toBe(0)

  // Read to its end, then on to the ending and back: the box is at its top again.
  await page.locator(BOX).evaluate((element) => (element.scrollTop = element.scrollHeight))
  expect((await scrolls(page)).top).toBeGreaterThan(0)
  await page.locator('.tree-frame:not([aria-hidden]) .answer--next').first().click()
  await arrived(page, `${origin}/long-full-node/full/applies`)
  await page.goBack()
  await arrived(page, `${origin}/long-full-node/full`)
  expect((await scrolls(page)).top, 'after the history step').toBe(0)

  await page.locator(BOX).evaluate((element) => (element.scrollTop = element.scrollHeight))
  await page.reload()
  await expect(page.locator(`${BOX}[data-enhanced]`)).toBeAttached()
  expect((await scrolls(page)).top, 'after a reload').toBe(0)
})

test('the meta description of a description over 155 characters is cut, its Question\'s text whole (16.3, 43.7)', async ({ page }) => {
  await open(page, '/long-full-node/full')
  const meta = (await page.locator('meta[name="description"]').getAttribute('content'))!
  expect([...meta].length).toBeLessThanOrEqual(155)
  expect(meta.endsWith('…')).toBe(true)
  const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!) as { '@graph': Array<Record<string, unknown>> }
  const webPage = graph['@graph'].find((entry) => entry['@type'] === 'WebPage') as { description: string; mainEntity: { text: string } }
  expect(webPage.description).toBe(meta)
  expect([...webPage.mainEntity.text].length).toBe(600)
  expect(webPage.mainEntity.text.startsWith(meta.slice(0, -1).trimEnd())).toBe(true)
})

test('screenshots: the full Node\'s Bubble and the largest Overlay at 1280 x 640, at the top of the text and at its end', async ({ page }) => {
  await mkdir(SHOTS, { recursive: true })
  await open(page, FULL)
  const box = page.locator(BOX)
  await page.screenshot({ path: path.join(SHOTS, 'bubble-top-1280x640.png') })
  await box.evaluate((element) => (element.scrollTop = element.scrollHeight))
  await page.screenshot({ path: path.join(SHOTS, 'bubble-end-1280x640.png') })

  const overlay = await serve(fixtures, 'long-overlay', LONG_OVERLAY_PORT)
  expect(overlay, 'the long-overlay fixture is a valid Tree').not.toBeNull()
  // In Dutch, the longer of the two: the record measured the whole English text in the box at
  // 1280 x 640 (168 of 168) and 188.4 of 192 of the Dutch (43.2). The sizes go into the report.
  await page.goto(`${overlay}/long-overlay/five/big?lang=nl`)
  const inOverlay = page.locator('.overlay[open] [data-description-box]')
  await expect(inOverlay).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, 'overlay-nl-top-1280x640.png') })
  await inOverlay.evaluate((element) => (element.scrollTop = element.scrollHeight))
  await page.screenshot({ path: path.join(SHOTS, 'overlay-nl-end-1280x640.png') })
  const sizes = await inOverlay.evaluate((element) => `box ${element.clientHeight} of ${element.scrollHeight} of text`)
  test.info().annotations.push({ type: 'overlay (nl) at 1280 x 640', description: sizes })
  const bubbleSizes = await page.goto(`${origin}${FULL}`).then(() => page.locator(BOX).evaluate((element) => `box ${element.getBoundingClientRect().height} of ${element.scrollHeight} of text`))
  test.info().annotations.push({ type: 'Bubble (en) at 1280 x 640', description: bubbleSizes })
})
