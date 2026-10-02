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

/** 10.3, amended by #175: the button, and the picture as tall as it. */
const BUTTON = { width: 236, height: 100 }

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

/** One button as measured: its box, its picture's box, and the picture's distance from the button's top, bottom and inner edge. */
interface Measured {
  side: string
  title: string
  width: number
  height: number
  picture: { width: number; height: number }
  top: number
  bottom: number
  inner: number
}

/** Every drawn Option button of the centre and the fan's `+`, measured. */
async function measure(page: Page): Promise<Measured[]> {
  await page.evaluate(() => document.fonts.ready)
  return page
    .locator('.tree-frame:not([inert]) .options > li > :is(.overlay, .side-add) > .sheet-open')
    .filter({ visible: true })
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect()
        const picture = button.querySelector('.option-image')!.getBoundingClientRect()
        const side = button.closest('li')!.dataset.side ?? ''
        const round = (n: number) => Math.round(n * 100) / 100
        return {
          side,
          title: button.querySelector('.option-title')?.textContent ?? '',
          width: round(box.width),
          height: round(box.height),
          picture: { width: round(picture.width), height: round(picture.height) },
          top: round(picture.top - box.top),
          bottom: round(box.bottom - picture.bottom),
          // The inner end is the one towards the Bubble: the left on the right of it, the right on the left.
          inner: round(side === 'right' ? picture.left - box.left : box.right - picture.right),
        }
      }),
    )
}

/**
 * The size and the contour of every button on `url`, with the numbers printed under `name`;
 * the page is shot as `shot` first, so a failing run still leaves the picture of what failed.
 */
async function expectContour(page: Page, url: string, name: string, count: number, shot?: string): Promise<void> {
  await page.goto(`${origin}${url}`)
  await expect(page.locator('.tree-frame:not([inert]) .options > li').filter({ visible: true })).toHaveCount(count)
  if (shot) await shoot(page, shot)
  const measured = await measure(page)
  const viewport = page.viewportSize()!
  for (const side of ['right', 'left']) {
    const on = measured.filter((button) => button.side === side)
    if (on.length === 0) continue
    const sizes = [...new Set(on.map((b) => `${b.width} x ${b.height}, picture ${b.picture.width} x ${b.picture.height}, from top ${b.top}, bottom ${b.bottom}, inner end ${b.inner}`))]
    console.log(`${viewport.width} x ${viewport.height} ${name}, ${on.length} on the ${side}: ${sizes.join(' | ')}`)
  }
  expect(measured).toHaveLength(count)
  expect(new Set(measured.map((button) => button.side))).toEqual(new Set(count > 1 ? ['right', 'left'] : ['right']))
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

    test('in the editor, eight Options: the same buttons; and the side-bubble + fills its end, on the left as on the right', async ({ page }) => {
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
