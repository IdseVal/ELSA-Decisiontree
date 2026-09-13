/**
 * The slide and the neighbourhood in a real browser (docs/specs/application.md 11.3-11.5,
 * ADR-38-transitions, ADR-38-neighbourhood): what a transition costs on the network, where
 * it leaves the address bar, and whether it moves at all.
 *
 * - The request accounting of 11.5, by recording every request of "open the root Node,
 *   follow yes, follow one Option": exactly one page payload per navigation, each carrying
 *   the Node it opens and that Node's neighbourhood and nothing more -- at most seventeen
 *   Nodes -- no request for the Tree, and no image of a Node that is not the centre Bubble.
 * - The URL after a slide is the URL of the plain link, for each kind of Branch that slides;
 *   back returns to the page before, and slides too.
 * - The tree layer's transform changes during a slide, and with `prefers-reduced-motion:
 *   reduce` it never does while the navigation still happens.
 * - Without JavaScript a Branch is a link that loads the target's page, and no neighbour is
 *   in the document.
 *
 * The recorded requests are written to `tests/browser/.results/transition-requests.md`, so a
 * pull request can paste the list rather than describe it. The three screenshots of one
 * slide go to the gitignored results folder unless `ELSA_SHOTS=1` asks for the tracked set
 * in `docs/screenshots/issue-42/` (the convention of tree-view.spec.ts).
 *
 * The server serves `trees/ai-act-example` (see playwright.config.ts).
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page, type Request } from '@playwright/test'
import { neighbourhood } from '../../src/neighbourhood.ts'
import { openTree, type Tree } from '../../src/tree/loader.ts'
import { parseUrl } from '../../src/url.ts'
import { arrived } from './arrived.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-42') : path.join(RESULTS, 'shots')

const ROOT = '/ai-act-example/start'
const QUESTION = `${ROOT}/prohibited-practices`
const OPTION = `${QUESTION}/social-scoring`
const EXPLANATION = `${QUESTION}/emotion-recognition-at-work/social-scoring`

/** The bound of 11.5: the Node a page shows and at most sixteen neighbours. */
const MAX_NODES = 17

let tree: Tree

test.beforeAll(async () => {
  tree = await openTree(path.join(repo, 'trees', 'ai-act-example'))
})

/** A page's path and query, the form a Branch's `href` is written in; another origin's URL whole. */
function local(url: string, origin?: string): string {
  const { pathname, search, origin: its } = new URL(url)
  return origin === undefined || its === origin ? pathname + search : url
}

/** A request for a Node page: the document itself, or the payload a client navigation fetches. */
function isPagePayload(request: Request): boolean {
  return request.resourceType() === 'document' || request.headers()['rsc'] === '1'
}

/**
 * Every Node a response carries, by the `data-node` each Bubble writes -- found as an HTML
 * attribute, as a property of the framework's payload, and as that property escaped inside
 * the HTML document's inline scripts.
 */
function nodesIn(body: string): string[] {
  return [...new Set([...body.matchAll(/data-node\\?"?[=:]\\?"([^"\\]+)/g)].map((m) => m[1]!))].sort()
}

/** What the server may put in the page at `url`: its Node and that Node's neighbourhood (11.2). */
async function allowedNodes(url: string): Promise<string[]> {
  const address = parseUrl(new URL(url, 'http://x').pathname, 'en', tree)!
  const node = (await tree.getNode(address.nodeId))!
  return [node.id, ...(await neighbourhood(tree, address, node)).map((p) => p.node.id)].sort()
}

/** The image files the Node at `url` may name: its own Images and each Option's first (5.2). */
async function allowedImages(url: string): Promise<string[]> {
  const address = parseUrl(new URL(url, 'http://x').pathname, 'en', tree)!
  const node = (await tree.getNode(address.nodeId))!
  return [...node.images, ...node.options.flatMap((o) => o.images.slice(0, 1))].map((i) => encodeURIComponent(i.file))
}

/** Records, from now on, every computed transform of the tree layer, one per frame. */
async function recordTransforms(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen: string[] = ((window as unknown as { transforms: string[] }).transforms = [])
    const tick = () => {
      const layer = document.querySelector('.tree-layer')
      if (layer) seen.push(getComputedStyle(layer).transform)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

/** The transforms recorded since `recordTransforms`, each value once. */
async function transforms(page: Page): Promise<string[]> {
  return [...new Set(await page.evaluate(() => (window as unknown as { transforms: string[] }).transforms))]
}

test('open the root Node, follow yes, follow one Option: one payload each, at most 17 Nodes, no image of an off-screen Node', async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin
  interface Recorded {
    url: string
    kind: string
    /** The page on screen when the request was made. */
    on: string
    nodes?: string[]
  }
  const recorded: Recorded[] = []
  const bodies: Promise<void>[] = []

  page.on('request', (request) => {
    const entry: Recorded = {
      url: local(request.url(), origin),
      kind: isPagePayload(request) ? (request.resourceType() === 'document' ? 'page (HTML)' : 'page (payload)') : request.resourceType(),
      on: page.url() === 'about:blank' ? '-' : local(page.url()),
    }
    recorded.push(entry)
    if (isPagePayload(request)) {
      bodies.push(
        request.response().then(async (response) => {
          const body = await response!.text()
          entry.nodes = nodesIn(body)
          // 11.4: no image URL of any Node but the one the page opens, anywhere in the payload.
          const named = [...body.matchAll(/\/images\/([^"\\?\s)]+)/g)].map((m) => m[1]!)
          const allowed = await allowedImages(entry.url)
          expect(named.filter((file) => !allowed.includes(file)), `images named by ${entry.url}`).toEqual([])
        }),
      )
    }
  })

  await page.goto(ROOT)
  await expect(page.locator('.bubble')).toBeVisible()
  const yes = await page.locator('.answer--yes').getAttribute('href')
  await page.locator('.answer--yes').click()
  await arrived(page, yes!)
  const option = await page.locator('.option').first().getAttribute('href')
  await page.locator('.option').first().click()
  await arrived(page, option!)
  expect([yes, option]).toEqual([QUESTION, OPTION])
  // Let the arriving page ask for everything it is going to ask for.
  await page.waitForLoadState('networkidle')
  await Promise.all(bodies)

  const pages = recorded.filter((r) => r.kind.startsWith('page'))
  // Exactly one payload per navigation, and no prefetch of any Branch's page.
  // (The framework's cache-busting `_rsc` parameter is not part of the page's address.)
  expect(pages.map((r) => r.url.replace(/[?&]_rsc=[^&]*$/, ''))).toEqual([ROOT, QUESTION, OPTION])
  for (const entry of pages) {
    expect(entry.nodes!.length, entry.url).toBeLessThanOrEqual(MAX_NODES)
    expect(entry.nodes, `the Nodes in ${entry.url}`).toEqual(await allowedNodes(entry.url))
  }

  for (const entry of recorded) {
    // Same origin, and nothing but pages, the framework's own files, and single files of the Tree.
    expect(entry.url, 'a request to another origin').toMatch(/^\//)
    expect(entry.url, 'a request for the Tree').not.toMatch(/tree\.ya?ml|\/api\//)
    expect(
      pages.includes(entry) || /^\/_next\/static\/|^\/images\/[^/]+$|^\/theme\/[^/]+$|^\/favicon\.ico$/.test(entry.url),
      `an unexpected request: ${entry.url}`,
    ).toBe(true)
  }

  // Every image requested belongs to the centre Bubble of the page on screen at that moment.
  for (const entry of recorded.filter((r) => r.url.startsWith('/images/'))) {
    expect(await allowedImages(entry.on), `${entry.url} requested on ${entry.on}`).toContain(entry.url.slice('/images/'.length))
  }

  await mkdir(RESULTS, { recursive: true })
  await writeFile(
    path.join(RESULTS, 'transition-requests.md'),
    [
      '| # | request | kind | on screen | Nodes carried |',
      '|---|---|---|---|---|',
      ...recorded.map(
        (r, i) => `| ${i + 1} | \`${r.url}\` | ${r.kind} | \`${r.on}\` | ${r.nodes ? `${r.nodes.length}: ${r.nodes.join(', ')}` : ''} |`,
      ),
      '',
    ].join('\n'),
  )
})

test.describe('the address bar', () => {
  test('after each kind of slide it is the URL of the plain link, and back returns to the page before', async ({ page }) => {
    const steps: Array<[from: string, branch: string]> = [
      [ROOT, '.answer--yes'],
      [QUESTION, '.option >> nth=0'],
      [OPTION, '.answer--back'],
      [EXPLANATION, '.trail-entry >> nth=-1'],
      [`${QUESTION}/prohibited`, '.answer--back'],
    ]
    for (const [from, branch] of steps) {
      await page.goto(from)
      const link = page.locator(branch)
      const href = (await link.getAttribute('href'))!
      await recordTransforms(page)
      await link.click()
      await arrived(page, href)
      expect(local(page.url()), `${branch} on ${from}`).toBe(href)
      expect((await transforms(page)).length, `${branch} on ${from} slid`).toBeGreaterThan(2)

      await recordTransforms(page)
      await page.goBack()
      await arrived(page, from)
      expect((await transforms(page)).length, `back from ${href} slid`).toBeGreaterThan(2)
      await page.goForward()
      await arrived(page, href)
    }
  })

  test('a Branch whose target is not drawn -- startAgain -- loads its page as an ordinary link', async ({ page }) => {
    await page.goto(`${QUESTION}/prohibited`)
    await recordTransforms(page)
    const payloads: string[] = []
    page.on('request', (request) => isPagePayload(request) && payloads.push(request.resourceType()))
    await page.locator('.answer--start-again').click()
    await arrived(page, ROOT)
    expect(payloads).toEqual(['document'])
  })
})

test.describe('the motion', () => {
  test('the tree layer moves while a slide runs, and is at rest when it ends', async ({ page }) => {
    await page.goto(ROOT)
    await recordTransforms(page)
    await page.locator('.answer--yes').click()
    await arrived(page, QUESTION)

    const seen = await transforms(page)
    expect(seen.filter((t) => t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)').length).toBeGreaterThan(2)
    await expect(page.locator('.tree-layer')).toHaveCSS('transform', 'none')
    // At rest the layer holds the page and nothing else: one Bubble.
    await expect(page.locator('.bubble')).toHaveCount(1)
  })

  test('with prefers-reduced-motion the transform never changes, and the navigation still happens', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROOT)
    await recordTransforms(page)
    await page.locator('.answer--yes').click()
    await arrived(page, QUESTION)
    await page.goBack()
    await arrived(page, ROOT)
    await page.waitForTimeout(700)

    expect(await transforms(page)).toEqual(['none'])
    await expect(page.locator('.tree-layer[data-sliding]')).toHaveCount(0)
  })
})

test('three moments of one slide, screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  await page.goto(ROOT)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, 'slide-1-before-1280x640.png') })

  // Hold the target's payload back so the first half of the slide can be stopped in the middle.
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/*', async (route) => {
    if (route.request().headers()['rsc'] === '1') await held
    await route.continue()
  })
  await page.locator('.answer--yes').click()
  await page.waitForFunction(() => {
    const animation = document.querySelector('.tree-layer')?.getAnimations()[0]
    if (!animation) return false
    animation.pause()
    // About half the distance: the easing covers the first half of the way in a sixth of the time.
    animation.currentTime = 90
    return true
  })
  await page.screenshot({ path: path.join(SHOTS, 'slide-2-midway-1280x640.png') })

  release()
  await page.evaluate(() => document.querySelector('.tree-layer')?.getAnimations()[0]?.play())
  await arrived(page, QUESTION)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(SHOTS, 'slide-3-arrived-1280x640.png') })
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('a Branch is a link that loads the target page, and no neighbour is in the document', async ({ page }) => {
    await page.goto(ROOT)
    const payloads: string[] = []
    page.on('request', (request) => isPagePayload(request) && payloads.push(request.resourceType()))

    const href = await page.locator('.answer--yes').getAttribute('href')
    await page.locator('.answer--yes').click()
    await expect(page).toHaveURL(href!)
    await page.locator('.option').first().click()
    await expect(page).toHaveURL(OPTION)

    expect(payloads).toEqual(['document', 'document'])
    await expect(page.locator('.bubble')).toHaveCount(1)
    await expect(page.locator('.tree-frame')).toHaveCount(1)
  })
})
