/**
 * The tree view keeps clear of the chrome (issue #65): at the guaranteed viewport of
 * docs/specs/application.md 10.4 the Carousel's caption line fills its row to the pixel, and
 * so did a three-line Trail Branch until the up arrow replaced the drawn Trail (#82). Without
 * a clearance of their own they touch the disclaimer's rule below and the chrome bar's rule
 * above. 10.6 cannot see that -- nothing overflows -- so it is measured here, as edges: the
 * caption line against the disclaimer, and the up arrow, which stands above the Bubble's
 * outline, against the chrome bar.
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

/** The up arrow's, above: its band is 26 pixels, 24 of arrow and 2 clear (application.md 10.1). */
const ARROW_CLEARANCE = 2

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
async function edges(page: Page): Promise<{ header: Edges; arrow: Edges | null; caption: Edges | null; disclaimer: Edges }> {
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
      arrow: [...document.querySelectorAll('.up-arrow')].filter(visible).map(of)[0] ?? null,
      caption: caption ? of(caption) : null,
      disclaimer: of(document.querySelector('.disclaimer')!),
    }
  })
}

for (const lang of ['en', 'nl'] as const) {
  test(`at 1280 x 640 the up arrow keeps ${ARROW_CLEARANCE} px and the caption line ${CLEARANCE} px clear of the chrome, in ${lang}`, async ({ page }) => {
    let arrows = 0
    let captions = 0
    for (const url of PAGES) {
      const where = `${url} (${lang})`
      await page.goto(`${origin}${url}${lang === 'nl' ? '?lang=nl' : ''}`)
      const m = await edges(page)

      if (m.arrow) {
        arrows += 1
        expect.soft(m.arrow.top - m.header.bottom, `${where}: the up arrow below the chrome bar`).toBeGreaterThanOrEqual(ARROW_CLEARANCE)
      }
      if (m.caption) {
        captions += 1
        expect.soft(m.disclaimer.top - m.caption.bottom, `${where}: the caption line above the disclaimer`).toBeGreaterThanOrEqual(CLEARANCE)
      }
    }
    // Without these the test could pass on pages that no longer show what it is about.
    expect(arrows, 'an up arrow was measured').toBeGreaterThan(0)
    expect(captions, 'a caption line was measured').toBeGreaterThan(0)
  })
}
