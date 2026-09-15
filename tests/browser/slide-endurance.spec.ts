/**
 * Four hundred slides in one tab (issue #63): the probe the issue filed, as a test. The
 * reader follows `yes` from the first Tree's root and the parent's Trail Branch back, over
 * and over, with the slide on (docs/specs/application.md 11.3), and the tab has to survive
 * it without keeping what each slide showed.
 *
 * Issue #63 reported the renderer crashing after about 300 slides. That crash was the
 * harness, not the slide: every probe ran under Git Bash's `timeout`, which on Windows ends
 * the browser's child processes when it expires, and each "crash" came at the second its
 * `timeout` did. So the test asserts more than survival, which a plain run always had:
 *
 * - the clicks ran slides, at least one each, counted where the layer takes `data-sliding`
 *   -- without that the loop would pass just as well with the motion off;
 * - after a forced garbage collection the renderer holds no more DOM nodes and event
 *   listeners at the four-hundredth slide than at the second, on the same page. Counted by
 *   `Memory.getDOMCounters`, which includes detached nodes: a slide that kept its
 *   neighbour frame alive would add a frame's worth per slide, while the JS heap and the
 *   document's element count would not move -- the two numbers the issue measured.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type CDPSession } from '@playwright/test'
import { arrived } from './arrived.ts'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))

/** Clear of the ports playwright.config.ts and the other specs start servers on. */
const PORT = BASE_PORT + 40

const ROOT = '/ai-act-applicability-agrifood/start'
const YES = `${ROOT}/article-2-exclusions`
const SLIDES = 400

/** The centre frame: a neighbour frame drawn mid-slide is `inert` and never clicked (11.3). */
const CENTRE = '.tree-frame:not([inert])'

let origin: string

test.beforeAll(async () => {
  const started = await serve(path.join(repo, 'trees'), 'ai-act-applicability-agrifood', PORT)
  expect(started, 'the first Tree is a valid Tree').not.toBeNull()
  origin = started!
})

test.afterAll(() => {
  stopServers()
})

/** DOM nodes (attached or not) and event listeners the renderer still holds after a full collection. */
async function retained(cdp: CDPSession): Promise<{ nodes: number; listeners: number }> {
  await cdp.send('HeapProfiler.collectGarbage')
  const { nodes, jsEventListeners } = await cdp.send('Memory.getDOMCounters')
  return { nodes, listeners: jsEventListeners }
}

test('400 slides in one tab run, and leave nothing of themselves behind', async ({ browser }) => {
  // About 0.8 s a slide: the click, the payload and the 520 ms of motion.
  test.setTimeout(15 * 60_000)
  const context = await browser.newContext({ viewport: { width: 1280, height: 640 }, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  // One document for the whole walk, since every slide is a client navigation.
  await page.addInitScript(() => {
    const counted = window as unknown as { slides: number }
    counted.slides = 0
    new MutationObserver((changes) => {
      for (const change of changes) if ((change.target as Element).hasAttribute('data-sliding')) counted.slides++
    }).observe(document, { subtree: true, attributeFilter: ['data-sliding'] })
  })
  const cdp = await context.newCDPSession(page)
  await page.goto(origin + ROOT)

  let baseline = { nodes: 0, listeners: 0 }
  for (let slide = 1; slide <= SLIDES; slide++) {
    if (slide % 2 === 1) {
      await page.locator(`${CENTRE} .answer--yes`).click()
      await arrived(page, origin + YES)
    } else {
      await page.locator(`${CENTRE} .trail-step[data-parent] .trail-entry`).click()
      await arrived(page, origin + ROOT)
    }
    if (slide === 2) baseline = await retained(cdp)
  }

  // A slide is two halves, on two pages, and a payload that lands late leaves only the first.
  expect(await page.evaluate(() => (window as unknown as { slides: number }).slides)).toBeGreaterThanOrEqual(SLIDES)
  const after = await retained(cdp)
  // Back on the root, as at the second slide: one neighbour frame kept per slide would
  // multiply the count, and a page's worth of slack absorbs what the collector leaves.
  expect(after.nodes, `DOM nodes at slide 2: ${baseline.nodes}`).toBeLessThan(2 * baseline.nodes)
  expect(after.listeners, `event listeners at slide 2: ${baseline.listeners}`).toBeLessThan(2 * baseline.listeners)
  await context.close()
})
