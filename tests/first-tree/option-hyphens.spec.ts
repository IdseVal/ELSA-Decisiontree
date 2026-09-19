/**
 * Issue #104: no Option button of the first Tree cuts a word without a hyphen.
 *
 * A Dutch compound longer than an Option button's 152 pixels of label cannot fit one line at
 * 16 pixels (docs/specs/application.md 10.3), and the browser then broke it anywhere:
 * "Gasverbrandingsto / estellen". For every Node of the first Tree that fans out Options, in
 * both languages at every viewport of 10.6 that draws the Option buttons, this finds each line
 * break of each Option title and fails on one that falls between two letters with no hyphen
 * drawn at the end of its line -- and on a title of more than 10.3's four lines.
 *
 * The hyphen `hyphens: auto` draws is not in the DOM text, so it is found where Chromium puts
 * it: a second client rect of the text node on the line it ends, just after the line's text.
 * Where each line starts is where `caretRangeFromPoint` puts the caret at its left end.
 *
 * With `ELSA_SHOTS=1` it also rewrites `docs/screenshots/issue-104/`, the screenshot the issue
 * asks for; a plain run writes it to the gitignored results folder. The server serves
 * `trees/ai-act-applicability-agrifood` (see playwright.first-tree.config.ts).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { MAX_LINES, nodesWithOptions } from './options.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-104')
    : path.join(repo, 'tests', 'first-tree', '.results', 'issue-104')

const TREE = 'ai-act-applicability-agrifood'

/** The viewports of application.md 10.6 but the floor, where the notice replaces the tree view. */
const VIEWPORTS = [
  [1280, 640],
  [1366, 768],
  [1920, 1080],
  [2560, 1440],
  [1280, 800],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [360, 640],
] as const
const LANGUAGES = ['en', 'nl'] as const

/** One Option title as drawn: its lines, and each break that cuts a word without a hyphen. */
interface Measured {
  title: string
  lines: number
  cuts: string[]
}

for (const [width, height] of VIEWPORTS) {
  test(`no Option title is cut mid-word without a hyphen at ${width} x ${height}`, async ({ page }) => {
    test.setTimeout(5 * 60_000)
    await page.setViewportSize({ width, height })
    const failures: string[] = []
    let buttons = 0
    for (const lang of LANGUAGES) {
      for (const id of await nodesWithOptions()) {
        await page.goto(`/${TREE}/${id}${lang === 'en' ? '' : `?lang=${lang}`}`)
        await expect(page.locator('.tree-layer[data-sliding]')).toHaveCount(0)
        await page.evaluate(() => document.fonts.ready)
        const measured = await page.locator('.tree-frame:not([inert]) .options .option-title').evaluateAll((titles) =>
          titles
            // A collapsed fan (10.5, step 4) draws no Option buttons.
            .filter((el) => el.getClientRects().length > 0)
            .map((el): Measured => {
              const text = el.firstChild as Text
              const range = document.createRange()
              range.selectNodeContents(text)
              const rects = [...range.getClientRects()]
              // Each line's rects, left to right: its text, then the hyphen when one is drawn.
              const lines = [...new Set(rects.map((r) => Math.round(r.top)))].map((top) =>
                rects.filter((r) => Math.round(r.top) === top).sort((a, b) => a.left - b.left),
              )
              const cuts: string[] = []
              lines.forEach(([first], k) => {
                if (k === 0 || !first) return
                const at = document.caretRangeFromPoint(first.left + 0.5, first.top + first.height / 2)!.startOffset
                const letters = /\p{L}/u.test(text.data[at - 1] ?? '') && /\p{L}/u.test(text.data[at] ?? '')
                const hyphenDrawn = lines[k - 1]!.length > 1
                if (letters && !hyphenDrawn) cuts.push(`${text.data.slice(0, at)}|${text.data.slice(at)}`)
              })
              return { title: text.data, lines: lines.length, cuts }
            }),
        )
        buttons += measured.length
        for (const m of measured) {
          for (const cut of m.cuts) failures.push(`${lang} ${id}: ${cut}`)
          if (m.lines > MAX_LINES) failures.push(`${lang} ${id}: "${m.title}" takes ${m.lines} lines`)
        }
        if (id === 'annex-i-legislation-2' && lang === 'nl' && (width === 1280 || width === 1920)) {
          await page.screenshot({ path: path.join(SHOTS, `annex-i-legislation-2-nl-${width}x${height}.png`) })
        }
      }
    }
    console.log(`${width} x ${height}: ${buttons} Option buttons measured`)
    expect(failures).toEqual([])
  })
}
