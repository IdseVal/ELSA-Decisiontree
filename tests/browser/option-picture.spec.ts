/**
 * **[#175]** The Option button's size and the picture that fills its inner end
 * (docs/specs/application.md 10.3, 30.4, amended 2026-10-02): every Option button beside the
 * Bubble is 236 x 100, and its picture -- the target's main image, the empty slot of a target
 * without one, and in the editor the side-bubble `+`'s slot -- is a circle of the button's
 * height whose box is the button's inner end, the end towards the Bubble: it touches the
 * button's top, bottom and inner edge, within one pixel, on both sides of the Bubble. At the
 * guaranteed viewport and at 1920 x 1080, on the public page and in the editor: the full
 * Node's eight Options (`tests/fixtures/full-node/`), the first Tree's eight on
 * `annex-i-legislation`, the overlay fixture's empty slots, and the `+` on either side.
 * Below 1280 the buttons of 10.5's steps 2 and 3 stay what they were before #175: 200 x 96
 * without a picture, the label 12 pixels from each end, at 16 on 20 -- the `+` too. In the
 * editor an Option title's box is the lines its 60 characters take in the label (28.4,
 * amended): five of 18 in the fan, 90 pixels, and three of 20 below 1280, 60.
 *
 * Each page's measurements are printed, which is what the pull request quotes. The
 * screenshots the issue asks for go to `docs/screenshots/issue-175/` under `ELSA_SHOTS=1`,
 * the results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-175') : path.join(repo, 'tests', 'browser', '.results', 'shots')
const PORT = BASE_PORT + 160

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }
const FIRST_TREE = 'ai-act-applicability-agrifood'

/** 10.3, amended by #175: the button, and the picture as tall as it; in the editor, the title's box of five lines of 18 (28.4). */
const BUTTON = { width: 236, height: 100, titleBox: 90 }

/** 10.5's steps 2 and 3, which #175 left as they were: no picture, 176 of label between 12 of padding each side; the title's box three lines of 20. */
const STRAIGHT = { width: 200, height: 96, padding: 12, type: '16px on 20px', titleBox: 60 }

let origin: string

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const dir = await buildDataDir({
    trees: [
      { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), creator: ANNA.login },
      { folder: path.join(repo, 'tests', 'fixtures', 'overlay') },
      { folder: path.join(repo, 'trees', FIRST_TREE), creator: ANNA.login },
    ],
    accounts: [ANNA],
  })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

/**
 * One button as measured: its box, its picture's box, the picture's distance from the button's
 * top, bottom and inner edge, the label's from the inner and the outer edge, with its type, and
 * the height of the title's box in the editor (null on the public page and for the `+`).
 */
interface Measured {
  side: string
  title: string
  width: number
  height: number
  picture: { width: number; height: number }
  top: number
  bottom: number
  inner: number
  label: { inner: number; outer: number; type: string }
  titleBox: number | null
}

/**
 * Every drawn Option button of the centre and the fan's `+`, measured. **[#177]** The `+` is a
 * button of its own, not the summary of a Sheet, so it is named whole, as the stylesheet does.
 */
async function measure(page: Page): Promise<Measured[]> {
  await page.evaluate(() => document.fonts.ready)
  return page
    .locator('.tree-frame:not([inert]) :is(.options > li > .overlay > .sheet-open, .options > li > .side-add)')
    .filter({ visible: true })
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect()
        const picture = button.querySelector('.option-image')!.getBoundingClientRect()
        const title = button.querySelector('.option-title')!
        const label = title.getBoundingClientRect()
        const field = title.querySelector('.editor-field')
        const { fontSize, lineHeight } = getComputedStyle(title)
        const side = button.closest('li')!.dataset.side ?? ''
        const round = (n: number) => Math.round(n * 100) / 100
        // The inner end is the one towards the Bubble: the left on the right of it, the right on the left.
        const fromInner = (rect: DOMRect) => round(side === 'right' ? rect.left - box.left : box.right - rect.right)
        const fromOuter = (rect: DOMRect) => round(side === 'right' ? box.right - rect.right : rect.left - box.left)
        return {
          side,
          title: title.textContent ?? '',
          width: round(box.width),
          height: round(box.height),
          picture: { width: round(picture.width), height: round(picture.height) },
          top: round(picture.top - box.top),
          bottom: round(box.bottom - picture.bottom),
          inner: fromInner(picture),
          label: { inner: fromInner(label), outer: fromOuter(label), type: `${fontSize} on ${lineHeight}` },
          titleBox: field ? round(field.getBoundingClientRect().height) : null,
        }
      }),
    )
}

/**
 * Every button on `url`, measured, its `count` buttons on both sides of the Bubble (on the
 * right alone for one), and what `show` makes of each printed per side under `name`; the page
 * is shot as `shot` first, so a failing run still leaves the picture of what failed.
 */
async function measurePage(page: Page, url: string, name: string, count: number, show: (button: Measured) => string, shot?: string): Promise<Measured[]> {
  await page.goto(`${origin}${url}`)
  await expect(page.locator('.tree-frame:not([inert]) .options > li').filter({ visible: true })).toHaveCount(count)
  if (shot) await shoot(page, shot)
  const measured = await measure(page)
  const viewport = page.viewportSize()!
  for (const side of ['right', 'left']) {
    const on = measured.filter((button) => button.side === side)
    if (on.length === 0) continue
    console.log(`${viewport.width} x ${viewport.height} ${name}, ${on.length} on the ${side}: ${[...new Set(on.map(show))].join(' | ')}`)
  }
  expect(measured).toHaveLength(count)
  expect(new Set(measured.map((button) => button.side))).toEqual(new Set(count > 1 ? ['right', 'left'] : ['right']))
  return measured
}

/** The size and the contour of every button on `url`, as `measurePage` says. */
async function expectContour(page: Page, url: string, name: string, count: number, shot?: string): Promise<void> {
  const show = (b: Measured) =>
    `${b.width} x ${b.height}, picture ${b.picture.width} x ${b.picture.height}, from top ${b.top}, bottom ${b.bottom}, inner end ${b.inner}${b.titleBox === null ? '' : `, title box ${b.titleBox}`}`
  const measured = await measurePage(page, url, name, count, show, shot)
  // Soft, so one run measures and shoots every page however many buttons fail.
  for (const button of measured) {
    const what = `${name}: ${button.side} "${button.title}"`
    expect.soft(button.width, what).toBe(BUTTON.width)
    expect.soft(button.height, what).toBe(BUTTON.height)
    expect.soft(Math.abs(button.picture.width - button.height), what).toBeLessThanOrEqual(1)
    expect.soft(Math.abs(button.picture.height - button.height), what).toBeLessThanOrEqual(1)
    expect.soft(Math.abs(button.top), what).toBeLessThanOrEqual(1)
    expect.soft(Math.abs(button.bottom), what).toBeLessThanOrEqual(1)
    expect.soft(Math.abs(button.inner), what).toBeLessThanOrEqual(1)
    if (button.titleBox !== null) expect.soft(button.titleBox, what).toBe(BUTTON.titleBox)
  }
}

/**
 * Below 1280, every button on `url` as `measurePage` says: 200 x 96, its label 12 from the
 * inner end and at least 12 from the outer one (a short label ends before it), at 16 on 20,
 * and in the editor its title's box three lines.
 */
async function expectStraight(page: Page, url: string, name: string, count: number): Promise<void> {
  const show = (b: Measured) =>
    `${b.width} x ${b.height}, label from the inner end ${b.label.inner}, the outer ${b.label.outer}, ${b.label.type}${b.titleBox === null ? '' : `, title box ${b.titleBox}`}`
  const measured = await measurePage(page, url, name, count, show)
  for (const button of measured) {
    const what = `${name}: ${button.side} "${button.title}"`
    expect.soft(button.width, what).toBe(STRAIGHT.width)
    expect.soft(button.height, what).toBe(STRAIGHT.height)
    expect.soft(Math.abs(button.label.inner - STRAIGHT.padding), what).toBeLessThanOrEqual(1)
    expect.soft(button.label.outer, what).toBeGreaterThanOrEqual(STRAIGHT.padding - 1)
    expect.soft(button.label.type, what).toBe(STRAIGHT.type)
    if (button.titleBox !== null) expect.soft(button.titleBox, what).toBe(STRAIGHT.titleBox)
  }
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  const { width, height } = page.viewportSize()!
  await page.screenshot({ path: path.join(SHOTS, `${name}-${width}x${height}.png`) })
}

for (const [width, height] of [
  [1280, 640],
  [1920, 1080],
] as const) {
  test.describe(`at ${width} x ${height}`, () => {
    test.use({ viewport: { width, height } })

    test('on the public page, eight Options: each button 236 x 100, its picture filling the inner end on both sides', async ({ page }) => {
      await expectContour(page, '/full-node/full', 'the full Node, public', 8, 'full-node-public')
      await expectContour(page, `/${FIRST_TREE}/annex-i-legislation`, 'annex-i-legislation, public', 8, 'annex-i-legislation-public')
    })

    test('a target without a picture: the empty slot fills the inner end the same way', async ({ page }) => {
      await expectContour(page, '/overlay/five', 'the overlay fixture’s five, four empty slots', 5)
    })

    test('in the editor, eight Options: the same buttons, the box of each title five lines; and the side-bubble + fills its end, on the left as on the right', async ({ page }) => {
      expect((await login(page, origin, ANNA.login, ANNA.password)).status).toBe(204)
      await expectContour(page, '/admin/trees/full-node/full', 'the full Node, editor', 8, 'full-node-editor')
      await expectContour(page, `/admin/trees/${FIRST_TREE}/annex-i-legislation`, 'annex-i-legislation, editor', 8, 'annex-i-legislation-editor')
      // One Option on the right and the `+` in the next free slot, the left (30.4); with none, the `+` on the right.
      await expectContour(page, '/admin/trees/full-node/opt-one', 'opt-one, editor: one Option and the +', 2)
      await expect(page.locator('.options > li.options-add[data-side="left"] .side-add-plus')).toBeVisible()
      await expectContour(page, '/admin/trees/full-node/opt-three', 'opt-three, editor: the + alone', 1)
    })
  })
}

test.describe('at 1279 x 720, step 2 of 10.5', () => {
  test.use({ viewport: { width: 1279, height: 720 } })

  test('the straight columns: every Option button and the + 200 x 96 without a picture, the label 12 from each end, the box of an editor title three lines', async ({ page }) => {
    await expectStraight(page, '/full-node/full', 'the full Node, public', 8)
    expect((await login(page, origin, ANNA.login, ANNA.password)).status).toBe(204)
    await expectStraight(page, '/admin/trees/full-node/full', 'the full Node, editor', 8)
    await expectStraight(page, '/admin/trees/full-node/opt-one', 'opt-one, editor: one Option and the +', 2)
    await expectStraight(page, '/admin/trees/full-node/opt-three', 'opt-three, editor: the + alone', 1)
  })
})

test.describe('at 1100 x 800, step 3 of 10.5', () => {
  test.use({ viewport: { width: 1100, height: 800 } })

  // Eight Options collapse below 1200 (step 4); the row under the Answers holds four or fewer.
  test('the row under the Answers: the Option button and the + the same, on either side', async ({ page }) => {
    expect((await login(page, origin, ANNA.login, ANNA.password)).status).toBe(204)
    await expectStraight(page, '/admin/trees/full-node/opt-one', 'opt-one, editor: one Option and the +', 2)
    await expectStraight(page, '/admin/trees/full-node/opt-three', 'opt-three, editor: the + alone', 1)
  })
})
