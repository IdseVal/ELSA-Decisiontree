/**
 * Issue #64: the secondary text of the first Tree is readable.
 *
 * The Carousel's caption (the credit a CC BY licence asks to be shown) and the disclaimer
 * are drawn in the Theme's `text-muted` (the Trail's labels, the Tree's name and the `back`
 * Branch were too, until #82 retired them). The first Tree once set it to the ai4sfs.org site's own muted
 * grey, 2.49 : 1 on its white page, where WCAG 2.2 SC 1.4.3 asks 4.5 : 1 of text this small.
 * The palette is where that is fixed (tree-format.md 4.3.3); this suite measures what the
 * browser actually paints, so a Theme value and a stylesheet rule have to agree to pass.
 *
 * Issue #82: the Answer buttons, `startAgain` and the up arrow are filled with the Theme's
 * `accent-secondary`, the logo green #159a2f, under `--elsa-on-accent-secondary`. The label
 * is 19-pixel bold, large text, for which SC 1.4.3 asks 3 : 1
 * (ADR-78-answer-buttons-and-up-arrow decision 3).
 *
 * Issue #102: a marked explainer term is 16-pixel bold in that same green, the owner's
 * choice, at 3.31 : 1 on the Bubble -- short of the 4.5 : 1 of normal text. application.md
 * 10.8 (amended 2026-09-19) records the shortfall, so the sweep leaves the term out and a
 * test of its own pins the colour and the ratio: a Theme change that moves either shows here.
 *
 * The server serves `trees/ai-act-applicability-agrifood` (see playwright.first-tree.config.ts).
 */
import { expect, test, type Page } from '@playwright/test'
import { arrived } from '../browser/arrived.ts'

const TREE = 'ai-act-applicability-agrifood'

/** The root, whose Carousel shows a credit. */
const ROOT = `/${TREE}/start`

/** The walk of the issue's screenshot: a Trail as long as the first Tree gets, ending on a Terminal. */
const END_OF_WALK = `/${TREE}/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation/high-risk/general-purpose-ai/transparency-obligations/end-of-walk`

/** WCAG 2.2 SC 1.4.3's minimum for text below the large-text sizes. */
const MINIMUM = 4.5

/** WCAG 2.2 SC 1.4.3's minimum for large text: at least 18.66 CSS pixels bold, or 24 regular. */
const LARGE_MINIMUM = 3

/** One element's measured text colour, the background it is drawn on, and their contrast. */
interface Measured {
  text: string
  colour: string
  background: string
  ratio: number
  /** The computed font size in CSS pixels and weight, which decide whether the text is large. */
  size: number
  weight: number
}

/**
 * Measures every visible element matching `selector` in the page at rest, outside the inert
 * neighbour frames the Slider pre-renders.
 *
 * The background is what shows through behind the element: the computed background colours
 * of the element and its ancestors, composited from the page down, since a Branch or a row
 * may paint a translucent wash or nothing at all. The element's own `opacity` and those of
 * its ancestors fade its text towards that background, so they are applied too.
 */
async function measure(page: Page, selector: string): Promise<Measured[]> {
  return page.locator(selector).evaluateAll((elements) => {
    type Rgba = [number, number, number, number]

    // Chromium serialises `rgb()` as `rgb(r, g, b)` and a `color-mix()` result as `color(srgb r g b / a)`.
    const parse = (css: string): Rgba => {
      const srgb = /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)$/.exec(css)
      if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255, Number(srgb[4] ?? 1)]
      const rgb = /^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)$/.exec(css)
      if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), Number(rgb[4] ?? 1)]
      throw new Error(`unparsed colour: ${css}`)
    }
    const over = ([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba => [
      r * a + br * (1 - a),
      g * a + bg * (1 - a),
      b * a + bb * (1 - a),
      1,
    ]
    const linear = (v: number): number => {
      const c = v / 255
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    const luminance = ([r, g, b]: Rgba): number => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
    const hex = (c: Rgba): string => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

    return elements
      .filter((el) => !el.closest('[inert]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible')
      .map((el) => {
        const chain: Element[] = []
        for (let at: Element | null = el; at; at = at.parentElement) chain.push(at)
        let background: Rgba = [255, 255, 255, 1]
        let opacity = 1
        for (const at of chain.reverse()) {
          const style = getComputedStyle(at)
          if (style.backgroundImage !== 'none') throw new Error(`a background image behind ${el.className}`)
          background = over(parse(style.backgroundColor), background)
          opacity *= Number(style.opacity)
        }
        const ink = parse(getComputedStyle(el).color)
        const painted = over([ink[0], ink[1], ink[2], ink[3] * opacity], background)
        const [a, b] = [luminance(painted), luminance(background)]
        return {
          text: (el as HTMLElement).innerText.trim().slice(0, 40),
          colour: hex(painted),
          background: hex(background),
          ratio: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100,
          size: parseFloat(getComputedStyle(el).fontSize),
          weight: Number(getComputedStyle(el).fontWeight),
        }
      })
  })
}

/**
 * Asserts that `selector` matches at least one visible element and that each reaches the
 * minimum -- softly, so one run reports every element that falls short, not the first.
 */
async function expectReadable(page: Page, selector: string): Promise<void> {
  const measured = await measure(page, selector)
  expect(measured.length, `${selector}: visible elements`).toBeGreaterThan(0)
  for (const m of measured) {
    const large = m.size >= 24 || (m.size >= 18.66 && m.weight >= 700)
    expect.soft(m.ratio, `${selector} "${m.text}": ${m.colour} on ${m.background}`).toBeGreaterThanOrEqual(large ? LARGE_MINIMUM : MINIMUM)
  }
}

test('the root: the Sources heading, the image credit in the enlarged view and the disclaimer reach 4.5 : 1', async ({ page }) => {
  await page.goto(ROOT)
  await arrived(page, new RegExp(`${ROOT}$`))

  await expectReadable(page, '.sources h2')
  await expectReadable(page, '.disclaimer p')
  // The credit is no longer under the picture (#81): it is read in the enlarged view.
  await page.locator('.bubble a.main-image').click()
  await expect(page.locator('.carousel-sheet .credit')).toBeVisible()
  await expectReadable(page, '.carousel-sheet .credit')
})

test('a Terminal at the end of a long walk: startAgain and the disclaimer are readable', async ({ page }) => {
  await page.goto(END_OF_WALK)
  await arrived(page, /\/end-of-walk$/)

  await expectReadable(page, '.answer--start-again .branch-word')
  await expectReadable(page, '.answer--start-again .branch-title')
  await expectReadable(page, '.disclaimer p')
})

test('the Answer label is large text on the logo green, at least 3 : 1, measured on the running page (#82)', async ({ page }, testInfo) => {
  const question = `${TREE}/start/article-2-exclusions/ai-system-definition`
  await page.goto(`/${question}`)
  await arrived(page, new RegExp(`/${question}$`))

  const labels = await measure(page, '.answer .branch-label')
  expect(labels).toHaveLength(2)
  for (const m of labels) {
    // The fill is the Theme value, not a stylesheet colour: the first Tree's accent-secondary.
    expect(m.background, m.text).toBe('#159a2f')
    expect(m.colour, m.text).toBe('#ffffff')
    expect(m.size, m.text).toBe(19)
    expect(m.weight, m.text).toBe(700)
    expect(m.ratio, m.text).toBeGreaterThanOrEqual(LARGE_MINIMUM)
  }
  // The arrow's glyph is a graphic, for which SC 1.4.11 asks the same 3 : 1.
  const arrow = await measure(page, '.up-arrow')
  expect(arrow).toHaveLength(1)
  expect(arrow[0]!.background).toBe('#159a2f')
  expect(arrow[0]!.ratio).toBeGreaterThanOrEqual(LARGE_MINIMUM)

  const fill = await page.locator('.answer--yes').evaluate((el) => getComputedStyle(el).backgroundColor)
  testInfo.annotations.push({
    type: 'measured',
    description: `computed fill ${fill}; ${[...labels, ...arrow].map((m) => `"${m.text}" ${m.colour} on ${m.background} = ${m.ratio} : 1 at ${m.size}px/${m.weight}`).join('; ')}`,
  })
  console.log(testInfo.annotations.at(-1)!.description)
})

test("a marked term is the Answer buttons' green on the Bubble, 3.31 : 1, the shortfall 10.8 records (#102)", async ({ page }) => {
  await page.goto(ROOT)
  await arrived(page, new RegExp(`${ROOT}$`))

  const terms = await measure(page, '.bubble .term')
  expect(terms.length).toBeGreaterThan(0)
  for (const m of terms) {
    expect(m.colour, m.text).toBe('#159a2f')
    expect(m.background, m.text).toBe('#f0f3f7')
    expect(m.weight, m.text).toBe(700)
    expect(m.ratio, m.text).toBe(3.31)
  }
})

/** A page of each kind the first Tree has: a question with Images, many Options, an explanation, both Terminal outcomes. */
const EVERY_KIND = [
  ROOT,
  `/${TREE}/annex-i-legislation`,
  `/${TREE}/start/article-2-exclusions/exclusion-open-source`,
  `/${TREE}/ai-act-does-not-apply`,
  END_OF_WALK,
]

for (const url of EVERY_KIND) {
  test(`every text a reader sees at rest reaches 4.5 : 1: ${url.split('/').pop()}`, async ({ page }) => {
    await page.goto(url)
    await arrived(page, new RegExp(`${url}$`))
    // Only an element with a text node of its own paints text; its wrappers would be measured twice.
    await page.evaluate(() => {
      for (const el of document.body.querySelectorAll('*')) {
        // A marked term is measured by its own test above (#102).
        if (el.closest('.term')) continue
        if ([...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) {
          el.setAttribute('data-own-text', '')
        }
      }
    })
    await expectReadable(page, '[data-own-text]')
  })
}
