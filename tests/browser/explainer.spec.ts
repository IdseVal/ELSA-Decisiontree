/**
 * The explainer panel (docs/specs/application.md 10.8, ADR-78-explainers decision 6): a
 * marked term opens its panel on hover, on keyboard focus and on tap, and the panel closes
 * on leaving, on blur and on Escape; one is open at a time; with the script it is placed
 * beside the term's line inside the Bubble's text area, and without it CSS alone opens it at
 * the foot of the text area. What the reader hears is the term's accessible description.
 *
 * The page is `tests/fixtures/explainers/`: eight explainers at every maximum the format
 * allows, marked in one paragraph in both languages. `no-scroll.spec.ts` measures that every
 * page still fits with each panel open.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const fixtures = path.join(fileURLToPath(new URL('../..', import.meta.url)), 'tests', 'fixtures')

/** Clear of every other spec's ports (no-scroll 20-24, carousel 30, chrome-clearance 40). */
const PORT = BASE_PORT + 50

/** The fixture's eight explainer ids, in the order the description marks them. */
const IDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'].map((n) => `term-${n}`)

/** The guaranteed viewport and the largest of 10.6, where every panel must sit beside its term. */
const VIEWPORTS = [
  [1280, 640],
  [1366, 768],
  [1920, 1080],
  [2560, 1440],
  [1280, 800],
] as const

let origin: string

test.beforeAll(async () => {
  const started = await serve(fixtures, 'explainers', PORT)
  if (!started) throw new Error('the explainers fixture did not start')
  origin = started
})

test.afterAll(() => stopServers())

test.use({ viewport: { width: 1280, height: 640 } })

/** The term that names explainer `id` in the centre Bubble, and its panel. */
function marked(page: Page, id: string): { term: Locator; panel: Locator } {
  return {
    term: page.locator(`.bubble .term[aria-describedby="e-${id}"]`),
    panel: page.locator(`.bubble #e-${id}`),
  }
}

/** Opens the fixture's page and waits until the script has taken the terms over. */
async function open(page: Page, lang = 'en'): Promise<void> {
  await page.goto(`${origin}/explainers/start${lang === 'en' ? '' : `?lang=${lang}`}`)
  await expect(page.locator('.bubble .prose[data-enhanced]')).toBeAttached()
}

test.describe('with a pointer and a keyboard', () => {
  test('hover opens the panel and leaving the term closes it', async ({ page }) => {
    await open(page)
    const { term, panel } = marked(page, 'term-one')
    await expect(panel).toBeHidden()
    await term.hover()
    await expect(panel).toBeVisible()
    await page.mouse.move(2, 2)
    await expect(panel).toBeHidden()
  })

  test('the pointer can move from the term onto its open panel without closing it', async ({ page }) => {
    await open(page)
    const { term, panel } = marked(page, 'term-two')
    await term.hover()
    await expect(panel).toBeVisible()
    const box = (await panel.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 })
    await expect(panel).toBeVisible()
    await page.mouse.move(2, 2)
    await expect(panel).toBeHidden()
  })

  test('focus opens the panel and blur closes it', async ({ page }) => {
    await open(page)
    const { term, panel } = marked(page, 'term-three')
    await term.focus()
    await expect(panel).toBeVisible()
    await term.blur()
    await expect(panel).toBeHidden()
  })

  test('Escape closes a panel opened by focus, and by hover, and the focus stays on the term', async ({ page }) => {
    await open(page)
    const { term, panel } = marked(page, 'term-four')
    await term.focus()
    await expect(panel).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(term).toBeFocused()

    await term.blur()
    await term.hover()
    await expect(panel).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
  })

  test('one panel is open at a time', async ({ page }) => {
    await open(page)
    await marked(page, 'term-one').term.focus()
    await marked(page, 'term-eight').term.hover()
    await expect(marked(page, 'term-eight').panel).toBeVisible()
    await expect(page.locator('.explainer:visible')).toHaveCount(1)
  })

  test('Tab reaches every term in the order of the text, each opening its own panel', async ({ page }) => {
    await open(page)
    const reached: string[] = []
    for (let press = 0; press < 40 && reached.length < IDS.length; press += 1) {
      await page.keyboard.press('Tab')
      const described = await page.evaluate(() =>
        document.activeElement?.matches('.bubble .term') ? document.activeElement.getAttribute('aria-describedby') : null,
      )
      if (described === null) continue
      reached.push(described.replace(/^e-/, ''))
      await expect(page.locator(`#${described}`)).toBeVisible()
      await expect(page.locator('.explainer:visible')).toHaveCount(1)
    }
    expect(reached).toEqual(IDS)
  })

  test("a term's accessible description is its explainer, open or not", async ({ page }) => {
    await open(page)
    const { term } = marked(page, 'term-one')
    await expect(term).toHaveAccessibleDescription(
      'Term one, a term of forty characters Te. The explanation of term one: a text of two hundred characters, the most an explainer may hold, so the panel is measured at its tallest in English as well as in Dutch, which runs longer The explanatio.',
    )
    await expect(page.locator('#e-term-one')).toHaveAttribute('role', 'tooltip')
  })

  for (const lang of ['en', 'nl']) {
    for (const [width, height] of VIEWPORTS) {
      test(`every panel lies inside the text area, below or above its term's line, ${lang} at ${width}x${height}`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        await open(page, lang)
        for (const id of IDS) {
          const { term, panel } = marked(page, id)
          await term.focus()
          await expect(panel).toBeVisible()
          const where = await panel.evaluate((element) => {
            const area = element.closest('.bubble-text')!.getBoundingClientRect()
            const box = element.getBoundingClientRect()
            const lines = [...element.previousElementSibling!.getClientRects()]
            return {
              inside:
                box.left >= area.left - 0.5 &&
                box.right <= area.right + 0.5 &&
                box.top >= area.top - 0.5 &&
                box.bottom <= area.bottom + 0.5,
              below: Math.abs(box.top - lines.at(-1)!.bottom) <= 0.5,
              above: Math.abs(box.bottom - lines[0]!.top) <= 0.5,
              width: box.width,
            }
          })
          expect(where.inside, `${id}: the panel leaves the text area`).toBe(true)
          expect(where.below || where.above, `${id}: the panel is not against its term's line`).toBe(true)
          expect(where.width, `${id}: the panel is wider than 320 pixels`).toBeLessThanOrEqual(320)
        }
      })
    }
  }
})

test.describe('with a touch screen', () => {
  test.use({ hasTouch: true })

  test('a tap opens the panel, a second tap on the term closes it, and a tap elsewhere closes it', async ({ page }) => {
    await open(page)
    const { term, panel } = marked(page, 'term-five')
    await term.tap()
    await expect(panel).toBeVisible()
    await term.tap()
    await expect(panel).toBeHidden()

    await term.tap()
    await expect(panel).toBeVisible()
    await page.locator('.bubble h1').tap()
    await expect(panel).toBeHidden()
  })
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('hover and focus open the panel by CSS alone, at the foot of the text area, full width', async ({ page }) => {
    await page.goto(`${origin}/explainers/start`)
    const { term, panel } = marked(page, 'term-one')
    await expect(panel).toBeHidden()

    await term.hover()
    await expect(panel).toBeVisible()
    await page.mouse.move(2, 2)
    await expect(panel).toBeHidden()

    await term.focus()
    await expect(panel).toBeVisible()
    const [box, area] = await panel.evaluate((element) =>
      [element.getBoundingClientRect(), element.closest('.bubble-text')!.getBoundingClientRect()].map((r) => ({
        left: r.left,
        right: r.right,
        bottom: r.bottom,
      })),
    )
    expect(box).toEqual(area)
    await term.blur()
    await expect(panel).toBeHidden()
  })
})
