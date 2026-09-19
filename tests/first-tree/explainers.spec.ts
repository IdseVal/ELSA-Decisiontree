/**
 * Issue #103: every explainer panel of the first Tree, in both languages at 1280 x 640 and
 * 1920 x 1080, is at most 320 pixels wide and 148 tall (docs/specs/application.md 10.8).
 *
 * `tests/browser/explainer.spec.ts` asserts the same bound on its fixture, whose words are
 * short. The first Tree's Dutch text has long ones (`overheidsorgaan`, `AI-systeem`) that
 * leave most lines short, and it is set in the Tree's own font, Open Sans, rather than the
 * machine's: the walk of #87 found seven Dutch panels taking a sixth line, 166 pixels tall.
 * So this hovers every marked term of every Node, as a reader would, and measures the panel.
 *
 * The server serves `trees/ai-act-applicability-agrifood` (see playwright.first-tree.config.ts).
 */
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { openTree } from '../../src/tree/loader.ts'

const TREE = 'ai-act-applicability-agrifood'

/** The guaranteed viewport of 10.4 and the one above it the walk of #87 measured. */
const VIEWPORTS = [
  [1280, 640],
  [1920, 1080],
] as const
const LANGUAGES = ['en', 'nl'] as const

/** The Nodes that list explainers, found by following every answer and Option from the root. */
async function explainedNodes(): Promise<string[]> {
  const tree = await openTree(fileURLToPath(new URL(`../../trees/${TREE}`, import.meta.url)))
  const seen = new Set([tree.manifest.root])
  const ids: string[] = []
  for (const id of seen) {
    const node = (await tree.getNode(id))!
    if (node.explainers.length > 0) ids.push(id)
    const next = node.options.map((option) => option.target)
    if (node.kind === 'question') next.push(node.answers.yes, node.answers.no)
    for (const target of next) seen.add(target)
  }
  return ids
}

for (const [width, height] of VIEWPORTS) {
  for (const lang of LANGUAGES) {
    test(`every explainer panel at ${width} x ${height} in ${lang} is at most 320 x 148`, async ({ page }) => {
      test.setTimeout(180_000)
      await page.setViewportSize({ width, height })
      const nodes = await explainedNodes()
      expect(nodes.length, 'the first Tree has Nodes with explainers').toBeGreaterThan(0)

      const measured: string[] = []
      const over: string[] = []
      for (const id of nodes) {
        await page.goto(`/${TREE}/${id}${lang === 'en' ? '' : `?lang=${lang}`}`)
        // The centre shows the Node in its Bubble, or an explanation Node in its open Overlay.
        const shown = page.locator(`.tree-frame:not([inert]) :is(.bubble, .overlay[open] .overlay-interior)[data-node="${id}"]`)
        await expect(shown.locator('.prose[data-enhanced]').first()).toBeAttached()
        const terms = shown.locator('.prose .term')
        const count = await terms.count()
        for (let i = 0; i < count; i++) {
          const term = terms.nth(i)
          await term.hover()
          const panel = shown.locator('.explainer[data-open]')
          await expect(panel).toBeVisible()
          const box = (await panel.boundingBox())!
          const line = `${id} "${await term.innerText()}" ${Math.round(box.width)}x${Math.round(box.height)}`
          measured.push(line)
          if (box.width > 320.5 || box.height > 148.5) over.push(line)
          await page.mouse.move(1, 1)
          await expect(panel).toBeHidden()
        }
      }
      console.log(`${lang} ${width}x${height}: ${measured.length} panels\n${measured.join('\n')}`)
      expect(measured.length, 'every Node with explainers marks at least one term').toBeGreaterThanOrEqual(nodes.length)
      expect(over, 'panels over 320 x 148').toEqual([])
    })
  }
}
