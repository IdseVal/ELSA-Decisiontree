/**
 * **[#204]** The chrome bar alone, measured (docs/specs/application.md 10.6, 24.3): what
 * `no-scroll.spec.ts` and `admin-no-scroll.spec.ts` check of a bar with "Editor" or "Website" in
 * it, at 10.6's viewports and at five sizes 10.6 does not list -- 479 x 800, 480 x 800,
 * 599 x 800, 600 x 800 and 767 x 800, either side of the widths at which a bar gives something
 * up. At those five the disclaimer can take a second line in its row (36.5, at 480 x 640), so the
 * check is of the bar and everything in it, not of the whole page.
 *
 * Two things: nothing in the bar overflows, or stands outside the window; and no text in it takes
 * more lines than it is given -- one for every control and for the site's title, two for a Tree's
 * title written as text, as #200 cuts it. A line more inside the bar's height overflows nothing,
 * so the walk alone would let the site's title wrap; its lines are counted from its text's boxes.
 *
 * Not a spec file: the two specs import it.
 */
import { expect, type Page } from '@playwright/test'

/** The five sizes outside 10.6's list: either side of 480, 600 and 768 wide. */
export const BAR_SIZES = [
  [479, 800],
  [480, 800],
  [599, 800],
  [600, 800],
  [767, 800],
] as const

/** What `measureBar` finds wrong in one bar, each entry naming its element and numbers. */
export interface BarMeasured {
  /** The window's width, and the right edge of whatever in the bar reaches furthest. */
  inner: number
  right: number
  /**
   * The room left between the bar's first element -- the Tree's mark, or the site's title -- and
   * its controls, the bar's gap taken off: what one more word would have to fit in. From the bar's
   * left padding where the first element is not drawn. A title as text shrinks into its two lines,
   * so beside it the room is 0.
   */
  room: number
  /** Elements whose content is wider or taller than themselves, or that stand outside the window. */
  overflowing: string[]
  /** Elements whose text takes more lines than it is given. */
  lines: string[]
}

/** Measures the page's chrome bar, `header.page-chrome`, once the fonts have settled. */
export async function measureBar(page: Page): Promise<BarMeasured> {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const name = (el: Element): string => `${el.tagName.toLowerCase()}${[...el.classList].map((c) => `.${c}`).join('')}`
    const bar = document.querySelector('header.page-chrome')!
    const overflowing: string[] = []
    const lines: string[] = []
    let right = 0
    for (const el of [bar, ...bar.querySelectorAll('*')]) {
      const box = el.getBoundingClientRect()
      // Not drawn: `display: none`, or the `hidden` label of the language switch.
      if (el.getClientRects().length === 0) continue
      right = Math.max(right, box.right)
      if (box.right > window.innerWidth + 1 || box.left < -1) overflowing.push(`${name(el)} stands at ${box.left}..${box.right} in ${window.innerWidth}`)
      // A cut with an ellipsis is the design, not an overflow: a title as text, the Authors' line (10.6, 39.6).
      if (!el.matches('[data-clamp]') && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
        overflowing.push(`${name(el)} holds ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`)
      }

      // The lines its own text is drawn on, counted from the text's boxes: a line under a clamp's
      // ellipsis is laid out but not shown, so only those that start inside the element count.
      const texts = [...el.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim() !== '')
      if (texts.length === 0) continue
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
      const tops: number[] = []
      for (const text of texts) {
        const range = document.createRange()
        range.selectNodeContents(text)
        for (const rect of range.getClientRects()) if (rect.width > 0 && rect.top < box.bottom - 1) tops.push(rect.top)
      }
      tops.sort((a, b) => a - b)
      const drawn = tops.filter((top, at) => at === 0 || top - tops[at - 1]! > lineHeight / 2).length
      const given = el.matches('.tree-title[data-clamp]') ? 2 : 1
      if (drawn > given) lines.push(`${name(el)} "${el.textContent}" takes ${drawn} lines of ${given}`)
    }
    const style = getComputedStyle(bar)
    const first = bar.firstElementChild!
    const start =
      first.getClientRects().length > 0
        ? first.getBoundingClientRect().right + parseFloat(style.columnGap)
        : bar.getBoundingClientRect().left + parseFloat(style.paddingLeft)
    const room = bar.querySelector(':scope > .page-controls')!.getBoundingClientRect().left - start
    return { inner: window.innerWidth, right, room, overflowing, lines }
  })
}

/** The assertions: the bar inside the window, nothing in it overflowing, no text on a line too many. */
export function expectBarFits(m: BarMeasured, where: string): void {
  expect(m.right, `${where}: the bar reaches past the window`).toBeLessThanOrEqual(m.inner + 1)
  expect(m.overflowing, `${where}: elements of the bar whose content is larger than themselves, or outside the window`).toEqual([])
  expect(m.lines, `${where}: text in the bar on more lines than it is given`).toEqual([])
}

/** One row of a results table: the bar alone. */
export function barRow(what: string, lang: string, viewport: string, m: BarMeasured): string {
  return `| ${what} | ${lang} | ${viewport} | the bar alone | room ${Math.round(m.room * 10) / 10} | ${Math.round(m.right * 10) / 10}/${m.inner} | ${[...m.overflowing, ...m.lines].join('; ') || 'none'} |`
}
