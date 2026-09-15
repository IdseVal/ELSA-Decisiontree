/**
 * Four hundred slides in one tab (issue #63): the probe the issue filed, as a test. The
 * reader follows `yes` from the first Tree's root and the parent's Trail Branch back, over
 * and over, with the slide on (docs/specs/application.md 11.3), and the tab has to survive
 * it without piling up what each slide showed.
 *
 * Issue #63 reported the renderer crashing after about 300 slides. That crash was the
 * harness, not the slide: the probe ran under Git Bash's `timeout 300`, whose expiry on Windows
 * takes the renderer down before the script, which Playwright reports as "Page crashed" --
 * measured at 299.7 seconds. Without it the same probe runs all 400 slides, in 330 seconds.
 * The timeout does not account for the issue's fourth row, though: the probe with every
 * response passed through `page.route` crashed after 119 page visits, and without the
 * wrapper that probe slides at the same 0.82 seconds as the others, so a 300-second wall
 * would have stopped it near 350, not at 119. That row is unexplained (PR #70).
 *
 * So the test asserts more than survival, which a plain run always had:
 *
 * - the clicks ran slides: the page counts at least as many changes of `data-sliding` as
 *   there were clicks -- the motion off makes none, and without the count the loop would
 *   pass just as well with it off. It is one count for the whole walk, not one per click;
 * - after a forced garbage collection the renderer holds fewer than twice the DOM nodes and
 *   event listeners at the four-hundredth slide than at the second, on the same page. Counted
 *   by `Memory.getDOMCounters`, which includes detached nodes: a slide that kept its
 *   neighbour frame alive would add a frame's worth per slide, several times the page by the
 *   end, while the JS heap and the document's element count would not move -- the two numbers
 *   the issue measured. Growth below double passes.
 *
 * It lives with the first Tree's long walks, under `npm run test:first-tree`, and not in
 * `npm run test:browser`: it takes six minutes, and that command is the one CI runs in its
 * 30-minute verify job (application.md section 7).
 *
 * The server serves `trees/ai-act-applicability-agrifood` (see playwright.first-tree.config.ts).
 */
import { expect, test, type CDPSession } from '@playwright/test'

const ROOT = '/ai-act-applicability-agrifood/start'
const YES = `${ROOT}/article-2-exclusions`
const SLIDES = 400

/** The centre frame: a neighbour frame drawn mid-slide is `inert` and never clicked (11.3). */
const CENTRE = '.tree-frame:not([inert])'

// A trace keeps a snapshot per action: over the 1,600 actions of this test it slowed the
// run past fifteen minutes, where without it the test takes six. The price is that a leak
// this test catches fails with the counts in its message and no trace to open.
test.use({ trace: 'off', contextOptions: { reducedMotion: 'no-preference' } })

/** DOM nodes (attached or not) and event listeners the renderer still holds after a full collection. */
async function retained(cdp: CDPSession): Promise<{ nodes: number; listeners: number }> {
  await cdp.send('HeapProfiler.collectGarbage')
  const { nodes, jsEventListeners } = await cdp.send('Memory.getDOMCounters')
  return { nodes, listeners: jsEventListeners }
}

test('400 slides in one tab run, and the DOM they leave behind does not grow with them', async ({ context, page }) => {
  // About 0.8 s a slide: the click, the payload and the 520 ms of motion.
  test.setTimeout(15 * 60_000)
  // One document for the whole walk, since every slide is a client navigation.
  await page.addInitScript(() => {
    const counted = window as unknown as { slides: number }
    counted.slides = 0
    new MutationObserver((changes) => {
      for (const change of changes) if ((change.target as Element).hasAttribute('data-sliding')) counted.slides++
    }).observe(document, { subtree: true, attributeFilter: ['data-sliding'] })
  })
  const cdp = await context.newCDPSession(page)
  await page.goto(ROOT)

  let baseline = { nodes: 0, listeners: 0 }
  for (let slide = 1; slide <= SLIDES; slide++) {
    const target = slide % 2 === 1 ? YES : ROOT
    if (target === YES) await page.locator(`${CENTRE} .answer--yes`).click()
    else await page.locator(`${CENTRE} .trail-step[data-parent] .trail-entry`).click()
    // The probe's waits rather than `arrived`'s assertions, whose polling adds a quarter of a
    // second to each of four hundred slides.
    await page.waitForURL(target)
    await page.locator('.tree-layer[data-sliding]').waitFor({ state: 'detached' })
    if (slide === 2) baseline = await retained(cdp)
  }

  // A slide is two halves, on two pages, and a payload that lands late leaves only the first.
  expect(await page.evaluate(() => (window as unknown as { slides: number }).slides)).toBeGreaterThanOrEqual(SLIDES)
  const after = await retained(cdp)
  // Back on the root, as at the second slide: one neighbour frame kept per slide would
  // multiply the count, and double the page absorbs what the collector leaves.
  expect(after.nodes, `DOM nodes at slide 2: ${baseline.nodes}`).toBeLessThan(2 * baseline.nodes)
  expect(after.listeners, `event listeners at slide 2: ${baseline.listeners}`).toBeLessThan(2 * baseline.listeners)
})
