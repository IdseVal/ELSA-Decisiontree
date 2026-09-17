/**
 * Issue #64: the secondary text of the first Tree is readable.
 *
 * The Trail's Branch labels, the Tree's name, the Carousel's caption (the credit a CC BY
 * licence asks to be shown), the disclaimer and the `back` / `startAgain` Branches are drawn
 * in the Theme's `text-muted`. The first Tree once set it to the ai4sfs.org site's own muted
 * grey, 2.49 : 1 on its white page, where WCAG 2.2 SC 1.4.3 asks 4.5 : 1 of text this small.
 * The palette is where that is fixed (tree-format.md 4.3.3); this suite measures what the
 * browser actually paints, so a Theme value and a stylesheet rule have to agree to pass.
 *
 * The server serves `trees/ai-act-applicability-agrifood` (see playwright.first-tree.config.ts).
 */
import { expect, test, type Page } from '@playwright/test'
import { arrived } from '../browser/arrived.ts'

const TREE = 'ai-act-applicability-agrifood'

/** The root, whose Carousel shows a credit and whose Trail row holds the Tree's name. */
const ROOT = `/${TREE}/start`

/** The walk of the issue's screenshot: a Trail as long as the first Tree gets, ending on a Terminal. */
const END_OF_WALK = `/${TREE}/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation/high-risk/general-purpose-ai/transparency-obligations/end-of-walk`

/** WCAG 2.2 SC 1.4.3's minimum for text below the large-text sizes, which all of these are. */
const MINIMUM = 4.5

/** One element's measured text colour, the background it is drawn on, and their contrast. */
interface Measured {
  text: string
  colour: string
  background: string
  ratio: number
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
    expect.soft(m.ratio, `${selector} "${m.text}": ${m.colour} on ${m.background}`).toBeGreaterThanOrEqual(MINIMUM)
  }
}

test('the root: the Tree name, the image credit and the disclaimer reach 4.5 : 1', async ({ page }) => {
  await page.goto(ROOT)
  await arrived(page, new RegExp(`${ROOT}$`))
  await expect(page.locator('.carousel-caption:visible')).toBeVisible()

  await expectReadable(page, '.tree-name')
  await expectReadable(page, '.carousel-caption')
  await expectReadable(page, '.disclaimer p')
})

test('a Terminal at the end of a long walk: the Trail labels and back / startAgain reach 4.5 : 1', async ({ page }) => {
  await page.goto(END_OF_WALK)
  await arrived(page, /\/end-of-walk$/)

  await expectReadable(page, '.trail-entry .branch-title')
  await expectReadable(page, '.answer--start-again .branch-word')
  await expectReadable(page, '.answer--start-again .branch-title')
  await expectReadable(page, '.answer--back .branch-word')
  await expectReadable(page, '.answer--back .branch-title')
  await expectReadable(page, '.disclaimer p')
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
        if ([...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) {
          el.setAttribute('data-own-text', '')
        }
      }
    })
    await expectReadable(page, '[data-own-text]')
  })
}
