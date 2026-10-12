/**
 * Issue #82's screenshots: the uniform Answer buttons in the logo green and the up arrow that
 * replaced the drawn Trail, on the first Tree, at the smallest and the largest viewport of
 * docs/specs/application.md 10.6 above the guarantee, and at the phone's 360 x 640 where an
 * Answer button shows its word alone (10.3, amended 2026-09-18) -- a question Node three steps
 * in, the root Node, and a Terminal.
 *
 * As tests/first-tree/walk.spec.ts does, the tracked PNGs in `docs/screenshots/issue-82/` are
 * rewritten only when `ELSA_SHOTS=1` asks for them; a plain run writes to the gitignored
 * results folder. The server serves `trees/ai-act-applicability-agrifood`
 * (see playwright.first-tree.config.ts).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { arrived } from '../browser/arrived.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-82')
    : path.join(repo, 'tests', 'first-tree', '.results', 'issue-82')

const TREE = '/ai-act-applicability-agrifood'

/** The pages the issue names, by the file name each is saved under. */
const PAGES = [
  ['question-three-steps-in', `${TREE}/start/article-2-exclusions/ai-system-definition`],
  ['root', `${TREE}/start`],
  ['terminal', `${TREE}/start/article-2-exclusions/ai-act-does-not-apply`],
] as const

for (const [width, height] of [
  [1280, 640],
  [2560, 1440],
  [360, 640],
] as const) {
  test(`the arrow and the Answer buttons at ${width} x ${height}, screenshot`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    for (const [name, url] of PAGES) {
      await page.goto(url)
      await arrived(page, url)
      await page.evaluate(() => document.fonts.ready)
      // Nothing above the root; one arrow everywhere else; a Terminal's one button is startAgain.
      await expect(page.locator('.up-arrow')).toHaveCount(name === 'root' ? 0 : 1)
      await expect(page.locator('.answer')).toHaveCount(name === 'terminal' ? 1 : 2)
      await page.screenshot({ path: path.join(SHOTS, `${name}-${width}x${height}.png`) })
    }
  })
}
