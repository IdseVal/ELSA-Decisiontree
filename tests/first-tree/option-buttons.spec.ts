/**
 * Issue #105: every Option button of the first Tree is 232 x 96 with at most four lines of
 * title (docs/specs/application.md 10.3), in both languages, at the guaranteed viewport and at
 * 1920 x 1080 (10.6). The no-scroll test does not catch a fifth line: a button that grows to
 * hold it has content no taller than itself.
 *
 * Every question Node with Options is opened at the shortest Trail of Answers from the root,
 * which is the page a reader sees it on; its buttons are the fan beside the Bubble.
 *
 * The Dutch `prohibited-practices` at 1280 x 640, whose "Seksueel beeldmateriaal zonder
 * toestemming (2-12-2026)" took five lines before #105, is saved as a screenshot: into
 * `docs/screenshots/issue-105/` only when `ELSA_SHOTS=1` asks for it, as the other suites here
 * do, because a PNG is one machine's rendering.
 *
 * The server serves `trees/ai-act-applicability-agrifood` (see playwright.first-tree.config.ts).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { arrived } from '../browser/arrived.ts'
import { openTree } from '../../src/tree/loader.ts'

const TREE = 'ai-act-applicability-agrifood'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-105')
    : path.join(repo, 'tests', 'first-tree', '.results', 'issue-105')

/** The Trail of every question Node with Options, the shortest through Answers from the root. */
async function questionsWithOptions(): Promise<string[][]> {
  const tree = await openTree(path.join(repo, 'trees', TREE))
  const trails: string[][] = []
  const seen = new Set<string>()
  const queue = [[tree.manifest.root]]
  while (queue.length > 0) {
    const trail = queue.shift()!
    const id = trail[trail.length - 1]!
    if (seen.has(id)) continue
    seen.add(id)
    const node = await tree.getNode(id)
    if (node?.kind !== 'question') continue
    if (node.options.length > 0) trails.push(trail)
    queue.push([...trail, node.answers.yes], [...trail, node.answers.no])
  }
  return trails
}

for (const lang of ['en', 'nl'] as const) {
  for (const [width, height] of [
    [1280, 640],
    [1920, 1080],
  ] as const) {
    test(`every Option button is 96 tall with at most four lines, ${lang} at ${width} x ${height}`, async ({ page }) => {
      const trails = await questionsWithOptions()
      expect(trails.length).toBeGreaterThan(0)
      await page.setViewportSize({ width, height })
      const over: string[] = []
      let buttons = 0
      for (const trail of trails) {
        const url = `/${TREE}/${trail.join('/')}${lang === 'en' ? '' : `?lang=${lang}`}`
        await page.goto(url)
        await arrived(page, url)
        await page.evaluate(() => document.fonts.ready)
        const measured = await page.evaluate(() =>
          [...document.querySelectorAll('.tree-frame:not([inert]) .options > li > .overlay > .sheet-open')].map((button) => {
            const title = button.querySelector('.option-title')!
            return {
              title: title.textContent,
              h: button.getBoundingClientRect().height,
              w: button.getBoundingClientRect().width,
              lines: Math.round(title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight)),
            }
          }),
        )
        expect(measured.length, url).toBeGreaterThan(0)
        buttons += measured.length
        for (const b of measured) {
          if (b.h !== 96 || b.w !== 232 || b.lines > 4) over.push(`${url} "${b.title}" ${b.w}x${b.h}, ${b.lines} lines`)
        }
        if (lang === 'nl' && width === 1280 && trail.at(-1) === 'prohibited-practices') {
          await page.screenshot({ path: path.join(SHOTS, `prohibited-practices-nl-${width}x${height}.png`) })
        }
      }
      console.log(`${lang} ${width}x${height}: ${trails.length} Nodes, ${buttons} Option buttons`)
      expect(over).toEqual([])
    })
  }
}
