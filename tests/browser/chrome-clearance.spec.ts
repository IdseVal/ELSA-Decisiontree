/**
 * The tree view keeps clear of the chrome (issue #65): at the guaranteed viewport of
 * docs/specs/application.md 10.4 a row filled to the pixel touches the chrome bar's rule
 * above it or the disclaimer's rule below. 10.6 cannot see that -- nothing overflows -- so
 * it is measured here, as edges.
 *
 * Since #81 the rows are those #78 re-froze (10.1): the Trail's parent Branch stands on one
 * line in the 26-pixel band above the Bubble until #82 replaces it with the up arrow, and the
 * Carousel is a strip on the Bubble's lower outline, with the Answers between it and the
 * disclaimer.
 *
 * The pages are the first Tree's, where issue #46's walk found the collisions: its bundled
 * Open Sans sets these titles on every machine, so the case is not left to whatever fonts
 * the runner has. `no-scroll.spec.ts` measures that the same pages fit.
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

/** Issue #65's pages: the root with its picture, a long parent in Dutch, `annex-i-legislation` as a parent. */
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
async function edges(page: Page): Promise<{ header: Edges; bubble: Edges; entries: Edges[]; answers: Edges; disclaimer: Edges }> {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const of = (el: Element): Edges => {
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom }
    }
    const visible = (el: Element) => el.getClientRects().length > 0
    return {
      header: of(document.querySelector('header')!),
      bubble: of(document.querySelector('.bubble')!),
      entries: [...document.querySelectorAll('.trail-entry, .trail .sheet-open')].filter(visible).map(of),
      answers: of(document.querySelector('.answers')!),
      disclaimer: of(document.querySelector('.disclaimer')!),
    }
  })
}

for (const lang of ['en', 'nl'] as const) {
  test(`at 1280 x 640 the Trail keeps ${CLEARANCE} px clear of the chrome bar and the Bubble, and the Answers of the disclaimer, in ${lang}`, async ({ page }) => {
    let measured = 0
    for (const url of PAGES) {
      const where = `${url} (${lang})`
      await page.goto(`${origin}${url}${lang === 'nl' ? '?lang=nl' : ''}`)
      const m = await edges(page)

      for (const entry of m.entries) {
        measured += 1
        expect.soft(entry.top - m.header.bottom, `${where}: a Trail control below the chrome bar`).toBeGreaterThanOrEqual(CLEARANCE)
        expect.soft(m.bubble.top - entry.bottom, `${where}: a Trail control above the Bubble`).toBeGreaterThanOrEqual(CLEARANCE)
      }
      expect.soft(m.disclaimer.top - m.answers.bottom, `${where}: the Answers above the disclaimer`).toBeGreaterThanOrEqual(0)
    }
    // Without this the test could pass on pages that no longer show what it is about.
    expect(measured, 'Trail controls measured').toBeGreaterThan(0)
  })
}
