/**
 * Issue #105: every Option button of the first Tree is 232 x 96 with at most four lines of
 * title (docs/specs/application.md 10.3), in both languages, at the guaranteed viewport and at
 * 1920 x 1080 (10.6). The no-scroll test does not catch a fifth line: a button that grows to
 * hold it has content no taller than itself. `option-hyphens.spec.ts` counts the lines too;
 * this spec adds the button's size, which a fifth line changes, and the label's 152 pixels,
 * which 12 pixels of padding inside the 1-pixel outline had cut to 150 without moving a line
 * break of this Tree -- so only the width itself guards it.
 *
 * The Dutch `prohibited-practices` at 1280 x 640, whose "Seksueel beeldmateriaal zonder
 * toestemming (2-12-2026)" took five lines before #104 and #105, is saved as a screenshot:
 * into `docs/screenshots/issue-105/` only when `ELSA_SHOTS=1` asks for it, as the other suites
 * here do, because a PNG is one machine's rendering.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { arrived } from '../browser/arrived.ts'
import { MAX_LINES, nodesWithOptions } from './options.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const TREE = 'ai-act-applicability-agrifood'
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-105')
    : path.join(repo, 'tests', 'first-tree', '.results', 'issue-105')

/** 10.3: an Option button is 232 x 96, with 152 pixels of label. */
const BUTTON_WIDTH = 232
const BUTTON_HEIGHT = 96
const LABEL_WIDTH = 152

for (const lang of ['en', 'nl'] as const) {
  for (const [width, height] of [
    [1280, 640],
    [1920, 1080],
  ] as const) {
    test(`every Option button is 232 x 96 with at most four lines, ${lang} at ${width} x ${height}`, async ({ page }) => {
      const ids = await nodesWithOptions()
      expect(ids.length).toBeGreaterThan(0)
      await page.setViewportSize({ width, height })
      const failures: string[] = []
      let buttons = 0
      for (const id of ids) {
        const url = `/${TREE}/${id}${lang === 'en' ? '' : `?lang=${lang}`}`
        await page.goto(url)
        await arrived(page, url)
        await page.evaluate(() => document.fonts.ready)
        const measured = await page.evaluate(() =>
          [...document.querySelectorAll('.tree-frame:not([inert]) .options > li > .overlay > .sheet-open')]
            // A collapsed fan (10.5, step 4) leaves its buttons in the DOM, undrawn.
            .filter((button) => button.getClientRects().length > 0)
            .map((button) => {
              const title = button.querySelector('.option-title')!
              const box = button.getBoundingClientRect()
              const style = getComputedStyle(button)
              // The room the label is given, not its box: a one-line title shrinks to its text.
              const room =
                button.clientWidth -
                parseFloat(style.paddingLeft) -
                parseFloat(style.paddingRight) -
                button.querySelector('.option-image')!.getBoundingClientRect().width -
                parseFloat(style.columnGap)
              return {
                title: title.textContent,
                h: box.height,
                w: box.width,
                label: room,
                lines: Math.round(title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight)),
              }
            }),
        )
        expect(measured.length, url).toBeGreaterThan(0)
        buttons += measured.length
        for (const b of measured) {
          if (b.w !== BUTTON_WIDTH || b.h !== BUTTON_HEIGHT || b.label !== LABEL_WIDTH || b.lines > MAX_LINES) {
            failures.push(`${url} "${b.title}" ${b.w}x${b.h}, label ${b.label}, ${b.lines} lines`)
          }
        }
        if (lang === 'nl' && width === 1280 && id === 'prohibited-practices') {
          await page.screenshot({ path: path.join(SHOTS, `prohibited-practices-nl-${width}x${height}.png`) })
        }
      }
      console.log(`${lang} ${width}x${height}: ${ids.length} Nodes, ${buttons} Option buttons`)
      expect(failures).toEqual([])
    })
  }
}
