/**
 * The tree view keeps clear of the chrome (issue #65): at the guaranteed viewport of
 * docs/specs/application.md 10.4 a Trail Branch of three lines and the Carousel's caption
 * line each fill the row they are in to the pixel, so without a clearance of their own they
 * touch the chrome bar's rule above and the disclaimer's rule below. 10.6 cannot see that --
 * nothing overflows -- so it is measured here, as edges.
 *
 * The pages are the first Tree's, where issue #46's walk found the collisions: its bundled
 * Open Sans wraps these titles into three lines on every machine, so the case is not left
 * to whatever fonts the runner has. `no-scroll.spec.ts` measures that the same pages fit.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const trees = path.join(fileURLToPath(new URL('../..', import.meta.url)), 'trees')

/** Clear of playwright.config.ts's, theme.spec.ts's, no-scroll.spec.ts's and carousel.spec.ts's ports. */
const PORT = BASE_PORT + 40

/** The clearance, in CSS pixels, between the tree view and the chrome bar or the disclaimer. */
const CLEARANCE = 4

/** A Trail label's line (10.2): three of them is the tallest Branch the row holds. */
const TRAIL_LINE = 18

/** Issue #65's pages: the credit line on the root, a three-line parent in Dutch, `annex-i-legislation` as a parent. */
const PAGES = [
  '/ai-act-applicability-agrifood/start',
  '/ai-act-applicability-agrifood/start/article-2-exclusions/ai-act-does-not-apply',
  '/ai-act-applicability-agrifood/annex-i-legislation/annex-i-legislation-2',
] as const

let origin: string

test.beforeAll(async () => {
  const started = await serve(trees, 'ai-act-applicability-agrifood', PORT)
  if (!started) throw new Error('the first Tree did not start')
  origin = started
})

test.afterAll(() => stopServers())

test.use({ viewport: { width: 1280, height: 640 } })

/** One element's top and bottom edge, as `getBoundingClientRect` reports them. */
interface Edges {
  top: number
  bottom: number
}

/** The edges issue #65 measured on one laid-out page, once its fonts have settled. */
async function edges(page: Page): Promise<{ header: Edges; trailRow: Edges; entries: Edges[]; caption: Edges | null; disclaimer: Edges }> {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const of = (el: Element): Edges => {
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom }
    }
    const visible = (el: Element) => el.getClientRects().length > 0
    const caption = [...document.querySelectorAll('.carousel-caption')].find(visible)
    return {
      header: of(document.querySelector('header')!),
      trailRow: of(document.querySelector('.trail')!),
      entries: [...document.querySelectorAll('.trail-entry')].filter(visible).map(of),
      caption: caption ? of(caption) : null,
      disclaimer: of(document.querySelector('.disclaimer')!),
    }
  })
}

for (const lang of ['en', 'nl'] as const) {
  test(`at 1280 x 640 the Trail Branches and the caption line keep ${CLEARANCE} px clear of the chrome, in ${lang}`, async ({ page }) => {
    let tallest = 0
    let captions = 0
    for (const url of PAGES) {
      const where = `${url} (${lang})`
      await page.goto(`${origin}${url}${lang === 'nl' ? '?lang=nl' : ''}`)
      const m = await edges(page)

      for (const entry of m.entries) {
        tallest = Math.max(tallest, entry.bottom - entry.top)
        expect.soft(entry.top - m.header.bottom, `${where}: a Trail Branch below the chrome bar`).toBeGreaterThanOrEqual(CLEARANCE)
        expect.soft(m.trailRow.bottom - entry.bottom, `${where}: a Trail Branch above the Bubble's row`).toBeGreaterThanOrEqual(CLEARANCE)
      }
      if (m.caption) {
        captions += 1
        expect.soft(m.disclaimer.top - m.caption.bottom, `${where}: the caption line above the disclaimer`).toBeGreaterThanOrEqual(CLEARANCE)
      }
    }
    // Without these the test could pass on pages that no longer show what it is about.
    expect(tallest, 'a three-line Trail Branch was measured').toBeGreaterThanOrEqual(3 * TRAIL_LINE)
    expect(captions, 'a caption line was measured').toBeGreaterThan(0)
  })
}
