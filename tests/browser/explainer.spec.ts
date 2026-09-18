/**
 * The explainer panel (docs/specs/application.md 10.8, ADR-78-explainers decision 6): a
 * marked term opens its panel on hover, on keyboard focus and on tap, and the panel closes
 * on leaving, on blur and on Escape; one is open at a time; with the script it is placed
 * beside the term's line inside the Bubble's text area, and without it CSS alone opens it at
 * the foot of the text area. What the reader hears is the term's accessible description.
 *
 * The page is `tests/fixtures/explainers/`: eight explainers at every maximum the format
 * allows, marked in one paragraph in both languages. `no-scroll.spec.ts` measures that every
 * page still fits with each panel open. The screenshots #83 owes go to the gitignored results
 * folder unless `ELSA_SHOTS=1` asks for the tracked set in `docs/screenshots/issue-83/`, the
 * convention of `carousel.spec.ts`.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const fixtures = path.join(repo, 'tests', 'fixtures')
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-83')
    : path.join(repo, 'tests', 'browser', '.results', 'shots')

/** Clear of every other spec's ports (no-scroll 20-27, carousel 30, chrome-clearance 40). */
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

  test('Escape still closes a panel on a page reached by a slide', async ({ page }) => {
    await open(page)
    // A slide mounts a neighbour frame, with its own text, and unmounts it when it ends.
    await page.locator('.answer--yes').click()
    await expect(page).toHaveURL(/\/explainers\/start\/yes-end$/)
    await expect(page.locator('.bubble')).toHaveCount(1)
    await page.goBack()
    await expect(page).toHaveURL(/\/explainers\/start$/)
    await expect(page.locator('.bubble')).toHaveCount(1)

    const { term, panel } = marked(page, 'term-two')
    await term.focus()
    await expect(panel).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
  })

  test('resizing the window closes the open panel, whose place was measured in the old one', async ({ page }) => {
    await open(page)
    const { term, panel } = marked(page, 'term-six')
    await term.focus()
    await expect(panel).toBeVisible()
    await page.setViewportSize({ width: 1024, height: 768 })
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
              height: box.height,
            }
          })
          expect(where.inside, `${id}: the panel leaves the text area`).toBe(true)
          expect(where.below || where.above, `${id}: the panel is not against its term's line`).toBe(true)
          expect(where.width, `${id}: the panel is wider than 320 pixels`).toBeLessThanOrEqual(320)
          expect(where.height, `${id}: the panel is taller than 148 pixels`).toBeLessThanOrEqual(148)
        }
      })
    }
  }

  // Below the guaranteed viewport the text area can be shorter than the 394 pixels that let
  // one side always fit (10.8); here it is made shorter still, so that the terms high in the
  // paragraph fit neither below nor above their line.
  for (const lang of ['en', 'nl']) {
    test(`in a text area too short for either side, a panel takes the side with more room and stays inside, ${lang}`, async ({ page }) => {
      await open(page, lang)
      await page.addStyleTag({ content: '.bubble .bubble-text { height: 240px; flex: none; }' })
      let neither = 0
      for (const id of IDS) {
        const { term, panel } = marked(page, id)
        await term.focus()
        await expect(panel).toBeVisible()
        const where = await panel.evaluate((element) => {
          const area = element.closest('.bubble-text')!.getBoundingClientRect()
          const box = element.getBoundingClientRect()
          const lines = [...element.previousElementSibling!.getClientRects()]
          return {
            area: { top: area.top, bottom: area.bottom },
            box: { top: box.top, bottom: box.bottom },
            first: lines[0]!.top,
            last: lines.at(-1)!.bottom,
          }
        })
        const roomBelow = where.area.bottom - where.last
        const roomAbove = where.first - where.area.top
        const height = where.box.bottom - where.box.top
        expect(where.box.top, `${id}: the panel leaves the text area`).toBeGreaterThanOrEqual(where.area.top - 0.5)
        expect(where.box.bottom, `${id}: the panel leaves the text area`).toBeLessThanOrEqual(where.area.bottom + 0.5)
        if (height <= roomBelow) expect(where.box.top, `${id}: fits below`).toBeCloseTo(where.last, 0)
        else if (height <= roomAbove) expect(where.box.bottom, `${id}: fits above`).toBeCloseTo(where.first, 0)
        else {
          neither += 1
          if (roomBelow >= roomAbove) expect(where.box.bottom, `${id}: more room below`).toBeCloseTo(where.area.bottom, 0)
          else expect(where.box.top, `${id}: more room above`).toBeCloseTo(where.area.top, 0)
        }
      }
      expect(neither, 'some term fits neither below nor above its line').toBeGreaterThan(0)
    })
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

  test('a panel opened over its own term stays open while the pointer rests on it', async ({ page }) => {
    await page.goto(`${origin}/explainers/start`)
    // The text area is cut to end just under term eight, on the last line, so the panel
    // opened at its foot lies over the term, as it does over a term on a full area's last lines.
    const { term, panel } = marked(page, 'term-eight')
    // addStyleTag waits for a load event a page without script never sends; a style set by
    // Playwright's own evaluation does the same.
    await term.evaluate((element) => {
      const area = element.closest<HTMLElement>('.bubble-text')!
      area.style.flex = 'none'
      area.style.height = `${element.getBoundingClientRect().bottom - area.getBoundingClientRect().top + 20}px`
    })
    const line = (await term.boundingBox())!
    // Not term.hover(): its check that the term takes the pointer fails once the panel is over it.
    await page.mouse.move(line.x + line.width / 2, line.y + line.height / 2)
    await expect(panel).toBeVisible()
    const box = (await panel.boundingBox())!
    expect(line.y + line.height / 2, 'the panel covers its term').toBeGreaterThan(box.y)
    await page.mouse.move(line.x + line.width / 2 + 1, line.y + line.height / 2)
    await expect(panel).toBeVisible()
    await page.mouse.move(2, 2)
    await expect(panel).toBeHidden()
  })
})

test('the screenshots of issue #83, at the smallest and the largest guaranteed viewport', async ({ page }) => {
  const shot = async (name: string): Promise<void> => {
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
  }

  for (const [width, height] of [[1280, 640], [2560, 1440]] as const) {
    const size = `${width}x${height}`
    await page.setViewportSize({ width, height })
    await open(page)
    await shot(`terms-at-rest-${size}`)
    // Term eight is the last marked term, in both languages; term four ends the first line,
    // at the area's right edge, so its panel is pushed back inside.
    for (const [id, lang] of [['term-eight', 'en'], ['term-four', 'en'], ['term-eight', 'nl']] as const) {
      await open(page, lang)
      const { term, panel } = marked(page, id)
      await term.hover()
      await expect(panel).toBeVisible()
      await shot(`panel-open-e-${id}-${lang}-${size}`)
    }
  }
})
