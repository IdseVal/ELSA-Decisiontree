/**
 * The slide and the neighbourhood in a real browser (docs/specs/application.md 11.3-11.5,
 * ADR-38-transitions, ADR-38-neighbourhood): what a transition costs on the network, where
 * it leaves the address bar, and whether it moves at all.
 *
 * - The request accounting of 11.5, by recording every request of "open the root Node,
 *   follow yes, open one Option": exactly one page payload per navigation and none for the
 *   Overlay, each payload carrying the Node it opens, that Node's neighbourhood and its
 *   asides and nothing more -- at most seventeen Nodes -- no request for the Tree, and no
 *   image of a Node that is not the centre Bubble or an Option target's first (11.5).
 * - The URL after a slide is the URL of the plain link, for each kind of Branch that slides;
 *   back returns to the page before, and slides too.
 * - The tree layer's transform changes during a slide, and with `prefers-reduced-motion:
 *   reduce` it never does while the navigation still happens.
 * - The up arrow retraces the step it undoes (#102): back up-right from a `yes` target,
 *   up-left from a `no` target, straight up after any other step.
 * - **[#232]** Each button of two, three, four and five next steps slides toward where it stands,
 *   in one row and in two (42.5), and the up arrow retraces it: the table of
 *   `docs/research/issue-230-slide-direction.md`, measured on this build, is written to
 *   `tests/browser/.results/transition-slides.md`.
 * - While the page left behind and the target are both mounted, no id is in the document twice,
 *   and the frame of the page left behind is `inert`.
 * - A slide that starts with a Sheet open closes the Sheet before the layer moves.
 * - Without JavaScript a Branch is a link that loads the target's page, and no neighbour is
 *   in the document.
 *
 * The recorded requests are written to `tests/browser/.results/transition-requests.md`, so a
 * pull request can paste the list rather than describe it. The screenshots of one slide --
 * before, midway, just after the target's payload lands, arrived -- go to the gitignored
 * results folder unless `ELSA_SHOTS=1` asks for the tracked set in
 * `docs/screenshots/issue-42/` (the convention of tree-view.spec.ts).
 *
 * The server serves `trees/ai-act-example` (see playwright.config.ts).
 */
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page, type Request } from '@playwright/test'
import { loadPage } from '../../src/neighbourhood.ts'
import { openTree, type Tree } from '../../src/tree/loader.ts'
import { parseUrl } from '../../src/url.ts'
import { arrived } from './arrived.ts'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-42') : path.join(RESULTS, 'shots')

const ROOT = '/ai-act-example/start'
const QUESTION = `${ROOT}/prohibited-practices`
const OPTION = `${QUESTION}/social-scoring`

/** **[#221]** The bound of 41.5, **[#232]** of 42.5: the Node a page shows, at most 39 neighbours and the one Overlay its URL may name (17 until #221, 31 until #232). */
const MAX_NODES = 41

/** **[#232]** The servers of the fixtures this file slides on, one each, started once. */
const fixtureOrigins = new Map<string, Promise<string | null>>()

/** `fixture` out of `tests/fixtures/`, served on `BASE_PORT + offset` for every test of this file that asks. */
async function fixtureOrigin(fixture: string, offset: number): Promise<string> {
  if (!fixtureOrigins.has(fixture)) fixtureOrigins.set(fixture, serve(path.join(repo, 'tests', 'fixtures'), fixture, BASE_PORT + offset))
  const origin = await fixtureOrigins.get(fixture)!
  expect(origin, `${fixture} is a valid Tree`).not.toBeNull()
  return origin!
}

let tree: Tree

test.beforeAll(async () => {
  tree = await openTree(path.join(repo, 'trees', 'ai-act-example'))
})

test.afterAll(stopServers)

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

/** What the server may put in the page at `url`: its centre, its chain, the placed neighbours and the asides (10.9, 11.2). */
async function allowedNodes(url: string): Promise<string[]> {
  const page = (await loadPage(tree, parseUrl(new URL(url, 'http://x').pathname, 'en', tree)!))!
  return [
    ...new Set([
      page.centre.node.id,
      ...page.centre.chain.map((a) => a.node.id),
      ...page.neighbours.placed.map((p) => p.node.id),
      ...page.neighbours.asides.map((a) => a.node.id),
    ]),
  ].sort()
}

/**
 * The image files the page at `url` may name (11.5): the centre's own Images, each Option
 * target's first Image (on the button), and -- until #81 moves them to their targets -- each
 * Option's own first Image, which the Carousel row still shows (12.1 as amended by #55).
 */
async function allowedImages(url: string): Promise<string[]> {
  const page = (await loadPage(tree, parseUrl(new URL(url, 'http://x').pathname, 'en', tree)!))!
  return [...page.centre.node.images, ...page.neighbours.asides.flatMap((a) => a.node.images.slice(0, 1))].map((i) =>
    encodeURIComponent(i.file),
  )
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

test('open the root Node, follow yes, open one Option: one payload per navigation and none for the Overlay, at most 17 Nodes, no image of an off-screen Node', async ({
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
    /** A page response's body as the browser decoded it, against ADR-38-neighbourhood's estimate. */
    bytes?: number
  }
  const recorded: Recorded[] = []
  /** Each page response's body, by its request. */
  const bodies = new Map<Request, Buffer>()

  page.on('request', (request) => {
    recorded.push({
      url: local(request.url(), origin),
      kind: isPagePayload(request) ? (request.resourceType() === 'document' ? 'page (HTML)' : 'page (payload)') : request.resourceType(),
      on: page.url() === 'about:blank' ? '-' : local(page.url()),
    })
  })
  // The bodies are taken on their way to the page rather than asked of the browser afterwards:
  // Chromium does not keep a client navigation's payload for `response.body()` -- it answered
  // "No data found for resource" for one payload in three, the last one included.
  await page.route(
    (url) => url.pathname.startsWith('/ai-act-example'),
    async (route) => {
      // **[#134]** The Tree's pictures are under its id too (18.1); only its pages are bodies here.
      if (!isPagePayload(route.request())) return route.continue()
      const response = await route.fetch()
      const body = await response.body()
      bodies.set(route.request(), body)
      await route.fulfill({ response, body })
    },
  )

  await page.goto(ROOT)
  await expect(page.locator('.bubble')).toBeVisible()
  const yes = await page.locator('.answer--next:nth-child(1)').getAttribute('href')
  await page.locator('.answer--next:nth-child(1)').click()
  await arrived(page, yes!)
  expect(yes).toBe(QUESTION)
  // An Option opens its Overlay in place: no navigation, no payload, the address unchanged (10.9).
  await page.locator('.overlay').first().locator('.sheet-open').click()
  await expect(page.locator('.overlay').first().locator('.sheet-panel')).toBeVisible()
  await expect(page.locator('.overlay').first().locator('h2 a')).toHaveAttribute('href', OPTION)
  await expect(page).toHaveURL(QUESTION)
  // Let the page ask for everything it is going to ask for.
  await page.waitForLoadState('networkidle')

  const pages = recorded.filter((r) => r.kind.startsWith('page'))
  // Exactly one payload per navigation, none for the Overlay, and no prefetch of any Branch's page.
  // (The framework's cache-busting `_rsc` parameter is not part of the page's address.)
  expect(pages.map((r) => r.url.replace(/[?&]_rsc=[^&]*$/, ''))).toEqual([ROOT, QUESTION])
  for (const [request, body] of bodies) {
    const entry = pages.find((r) => r.url === local(request.url(), origin))!
    const text = body.toString('utf8')
    entry.nodes = nodesIn(text)
    entry.bytes = body.length
    expect(entry.nodes.length, entry.url).toBeLessThanOrEqual(MAX_NODES)
    expect(entry.nodes, `the Nodes in ${entry.url}`).toEqual(await allowedNodes(entry.url))
    // 11.4, 11.5: no image URL of any Node but the one the page opens and its Option targets' first, anywhere in the payload.
    const named = [...text.matchAll(/\/images\/([^"\\?\s)]+)/g)].map((m) => m[1]!)
    const allowed = await allowedImages(entry.url)
    expect(named.filter((file) => !allowed.includes(file)), `images named by ${entry.url}`).toEqual([])
  }
  expect(bodies.size, 'a body for every page').toBe(pages.length)

  for (const entry of recorded) {
    // Same origin, and nothing but pages, the framework's own files, and single files of the Tree.
    expect(entry.url, 'a request to another origin').toMatch(/^\//)
    expect(entry.url, 'a request for the Tree').not.toMatch(/tree\.ya?ml|\/api\//)
    expect(
      pages.includes(entry) || /^\/_next\/static\/|^\/ai-act-example\/(images|theme)\/[^/]+$|^\/favicon\.ico$/.test(entry.url),
      `an unexpected request: ${entry.url}`,
    ).toBe(true)
  }

  // Every image requested belongs to the centre Bubble of the page last asked for. Not of the
  // address bar at that moment: the main image is not lazy (10.3), so the arriving page asks
  // for it as soon as it is drawn, before the router has written its address.
  for (const [index, entry] of recorded.entries()) {
    if (!entry.url.startsWith('/ai-act-example/images/')) continue
    const page = recorded.slice(0, index).findLast((r) => pages.includes(r))!
    const node = page.url.replace(/[?&]_rsc=[^&]*$/, '')
    expect(await allowedImages(node), `${entry.url} requested after ${node} (on ${entry.on})`).toContain(entry.url.slice('/ai-act-example/images/'.length))
  }

  await mkdir(RESULTS, { recursive: true })
  await writeFile(
    path.join(RESULTS, 'transition-requests.md'),
    [
      '| # | request | kind | on screen | Nodes carried | bytes |',
      '|---|---|---|---|---|---|',
      ...recorded.map(
        (r, i) =>
          `| ${i + 1} | \`${r.url}\` | ${r.kind} | \`${r.on}\` | ${r.nodes ? `${r.nodes.length}: ${r.nodes.join(', ')}` : ''} | ${r.bytes ?? ''} |`,
      ),
      '',
    ].join('\n'),
  )
})

test.describe('the address bar', () => {
  test('after each kind of slide it is the URL of the plain link, and back returns to the page before', async ({ page }) => {
    // The Option slide is gone (10.9, 11.1): an Option opens an Overlay and nothing moves.
    const steps: Array<[from: string, branch: string]> = [
      [ROOT, '.answer--next:nth-child(1)'],
      [QUESTION, '.up-arrow'],
      // A Terminal's way up is the up arrow too: the `back` Branch is gone (10.9).
      [`${QUESTION}/prohibited`, '.up-arrow'],
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

/**
 * Where the slide `control` starts is heading: the translation, in pixels, the tree layer
 * ends the first half of the slide at. The target's payload is held back, so the page's own
 * animation is the one read, then let through.
 */
async function slideOf(page: Page, control: string): Promise<{ x: number; y: number }> {
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/*', async (route) => {
    if (route.request().headers()['rsc'] === '1') await held
    await route.continue()
  })
  // Against the page's own origin: **[#221]** a fixture's server is not the configured one.
  const href = new URL((await page.locator(control).getAttribute('href'))!, page.url()).href
  await page.locator(control).click()
  const away = await page.waitForFunction(() => {
    const frames = document.querySelector('.tree-layer')?.getAnimations()[0]?.effect
    return frames instanceof KeyframeEffect ? String(frames.getKeyframes().at(-1)?.transform) : null
  })
  const [, x, y] = (await away.jsonValue())!.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/)!.map(Number)
  release()
  await arrived(page, href)
  await page.unroute('**/*')
  return { x: x!, y: y! }
}

test.describe('the way back retraces the way down (#102)', () => {
  test('from a yes target up and to the right, from a no target up and to the left: the step down reversed', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    for (const answer of ['.answer--next:nth-child(1)', '.answer--next:nth-child(2)']) {
      await page.goto(QUESTION)
      const down = await slideOf(page, answer)
      const up = await slideOf(page, '.up-arrow')
      // The layer moves opposite the reader: down-left for `yes` moves it right and up.
      expect(Math.sign(down.x), `${answer} goes down to its side`).toBe(answer === '.answer--next:nth-child(1)' ? 1 : -1)
      expect(down.y, `${answer} goes down`).toBeLessThan(0)
      expect(up, `the up arrow undoes ${answer}`).toEqual({ x: -down.x, y: -down.y })
    }
  })

  test('**[#221]** to the third and the fourth of four next steps and back up: each to its own frame, the way back the step down reversed (41.5)', async ({ page }) => {
    const origin = await fixtureOrigin('full-node', 45)
    await page.setViewportSize({ width: 1280, height: 640 })
    const slides: Array<{ x: number; y: number }> = []
    for (const index of [3, 4]) {
      await page.goto(`${origin}/full-node/full`)
      const down = await slideOf(page, `.answer--next:nth-child(${index})`)
      const up = await slideOf(page, '.up-arrow')
      expect(down.y, `the ${index}th goes down`).toBeLessThan(0)
      // Right of the centre, so the layer moves left: the third at 0.5 layer widths, the fourth at 1.5.
      expect(down.x, `the ${index}th goes down to its right`).toBeLessThan(0)
      expect(up, `the up arrow undoes the ${index}th`).toEqual({ x: -down.x, y: -down.y })
      slides.push(down)
    }
    expect(slides[1]!.x / slides[0]!.x, 'the fourth stands three times as far across as the third').toBeCloseTo(3, 5)
    expect(slides[1]!.y).toBe(slides[0]!.y)
  })

  test('after a step that was no Answer, the up arrow goes straight up', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    // Adjacency is not checked (4.3): `covered` is neither Answer of `start`.
    await page.goto(`${ROOT}/covered`)
    const up = await slideOf(page, '.up-arrow')
    // `-0` when the Slider negates a zero offset, which is still no sideways movement.
    expect(Math.abs(up.x)).toBe(0)
    expect(up.y).toBeGreaterThan(0)
  })
})

/**
 * **[#232]** The pages whose every button is slid from (application.md 42.10): a step of two (the
 * example Tree's, on the configured server), three, four and five, and the windows: the guarantee,
 * the first width at which three to five stand in two rows, and a phone's width below 600.
 */
const SLIDE_STEPS = [
  { count: 2, fixture: null, url: QUESTION },
  { count: 3, fixture: { id: 'three-next-steps', offset: 46 }, url: '/three-next-steps/full' },
  { count: 4, fixture: { id: 'full-node', offset: 45 }, url: '/full-node/full' },
  { count: 5, fixture: { id: 'five-next-steps', offset: 47 }, url: '/five-next-steps/full' },
] as const
const SLIDE_WINDOWS = [
  [1280, 640],
  [999, 640],
  [360, 640],
] as const

test.describe('**[#232]** each button slides toward where it stands, and the up arrow retraces it (42.5)', () => {
  test.beforeAll(async () => {
    await mkdir(RESULTS, { recursive: true })
    await writeFile(
      path.join(RESULTS, 'transition-slides.md'),
      '| Next steps | Viewport | Button | Across (px) | Down (px) | In buttons | The reader goes (across, down) | Layer widths | Side | Up arrow (across, down) |\n|---|---|---|---|---|---|---|---|---|---|\n',
    )
  })

  for (const { count, fixture, url } of SLIDE_STEPS) {
    test(`a step of ${count}: at ${SLIDE_WINDOWS.map(([w, h]) => `${w} x ${h}`).join(', ')}`, async ({ page }) => {
      test.slow()
      const origin = fixture ? await fixtureOrigin(fixture.id, fixture.offset) : ''
      const lines: string[] = []
      for (const [width, height] of SLIDE_WINDOWS) {
        await page.setViewportSize({ width, height })
        await page.goto(`${origin}${url}`)
        const buttons = page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--next')
        await expect(buttons).toHaveCount(count)
        for (let i = 1; i <= count; i += 1) {
          const where = `button ${i} of ${count} at ${width} x ${height}`
          await page.goto(`${origin}${url}`)
          const control = `.tree-frame:not([aria-hidden]) .answers > .answer--next:nth-child(${i})`
          // Where it stands: its middle against its own row's, counted in buttons -- a button's
          // width and the gap across -- from the boxes the page drew.
          const boxes = await buttons.evaluateAll((all) => all.map((button) => button.getBoundingClientRect().toJSON() as DOMRect))
          const row = (await page.locator('.tree-frame:not([aria-hidden]) .answers').boundingBox())!
          const box = boxes[i - 1]!
          const mates = boxes.filter((other) => Math.abs(other.top - box.top) < 1)
          const pitch = boxes[1]!.left - boxes[0]!.left
          const middleOfRow = (mates[0]!.left + mates.at(-1)!.right) / 2
          const across = box.left + box.width / 2 - middleOfRow
          const inButtons = Math.round((across / pitch) * 2) / 2
          const layer = (await page.locator('.tree-layer').boundingBox())!.width

          const down = await slideOf(page, control)
          const up = await slideOf(page, '.up-arrow')
          // The layer moves opposite the reader, so the reader goes to the slide negated.
          const goes = { x: -down.x, y: -down.y }
          expect(Math.abs(across - inButtons * pitch), `${where}: stands a whole or half button from its row's middle`).toBeLessThan(1)
          // `+ 0`: a button in the middle and its straight slide are signs of 0, never -0.
          expect(Math.sign(Math.round(goes.x)) + 0, `${where}: slides to the side it stands on`).toBe(Math.sign(inButtons) + 0)
          expect(goes.x, `${where}: as far across as it stands, in layer widths`).toBeCloseTo(inButtons * layer, 0)
          expect(goes.y, `${where}: down`).toBeGreaterThan(0)
          expect(up.x, `${where}: the up arrow retraces it across`).toBeCloseTo(-down.x, 0)
          expect(up.y, `${where}: and up`).toBeCloseTo(-down.y, 0)
          const side = inButtons === 0 ? 'middle, straight down' : inButtons < 0 ? 'left, to the left' : 'right, to the right'
          lines.push(
            `| ${count} | ${width} x ${height} | ${i} of ${count} | ${Math.round(across)} | ${Math.round(box.top - row.y)} | ${inButtons} | ${Math.round(goes.x)}, ${Math.round(goes.y)} | ${+(goes.x / layer).toFixed(2)} | ${side} | ${Math.round(-up.x)}, ${Math.round(-up.y)} |`,
          )
        }
      }
      await appendFile(path.join(RESULTS, 'transition-slides.md'), `${lines.join('\n')}\n`)
    })
  }
})

test.describe('the motion', () => {
  test('the tree layer moves while a slide runs, and is at rest when it ends', async ({ page }) => {
    await page.goto(ROOT)
    await recordTransforms(page)
    await page.locator('.answer--next:nth-child(1)').click()
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
    await page.locator('.answer--next:nth-child(1)').click()
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
  await page.locator('.answer--next:nth-child(1)').click()
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

test('the moment just after the payload lands, screenshot: the page left behind is drawn without its pictures (11.4)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  await page.goto(ROOT)
  await page.evaluate(() => document.fonts.ready)
  // The root's own Image is on screen before the click.
  await expect(page.locator('.tree-frame img')).not.toHaveCount(0)

  // A tenth of a second of network, so the payload lands near the midway shot's moment rather
  // than a local server's few milliseconds; well inside the slide, so the target's page takes
  // it over. Its animation is caught and stopped in the first frame it runs.
  await page.route('**/*', async (route) => {
    if (route.request().headers()['rsc'] === '1') await new Promise((wake) => setTimeout(wake, 100))
    await route.continue()
  })
  await page.locator('.answer--next:nth-child(1)').click()
  const caught = await page.waitForFunction((target) => {
    if (location.pathname !== target) return false
    const animation = document.querySelector('.tree-layer[data-sliding]')?.getAnimations()[0]
    if (!animation) return false
    animation.pause()
    return { at: Math.round(Number(animation.currentTime)) }
  }, QUESTION)
  // `waitForFunction` resolves only on a truthy value, so it is never `false` here.
  const { at } = (await caught.jsonValue()) as { at: number }
  await page.screenshot({ path: path.join(SHOTS, `slide-2b-after-payload-1280x640.png`) })
  test.info().annotations.push({ type: 'handover', description: `the payload landed ${at} ms into the slide` })

  // The page left behind is now drawn from the target's neighbour props, which name no image.
  await expect(page.locator('.tree-frame[aria-hidden]')).toHaveCount(1)
  await expect(page.locator('.tree-frame[aria-hidden] img')).toHaveCount(0)

  // Two frames, two Bubbles, the centre's asides each with a heading in its closed Overlay
  // (10.9), and still no id written twice: every `aria-labelledby` and `aria-describedby`
  // names the one element it means (10.3), in either frame.
  await expect(page.locator('[id$="node-title"]')).toHaveCount(2 + (await page.locator('.overlay-interior').count()))
  const ids = await page.evaluate(() => [...document.querySelectorAll('[id]')].map((element) => element.id))
  expect(ids.filter((id, index) => ids.indexOf(id) !== index), 'ids written twice').toEqual([])

  // And out of the tab order (11.3): `inert` is the whole of that guarantee.
  expect(await page.locator('.tree-frame[aria-hidden]').evaluate((frame) => (frame as HTMLElement).inert)).toBe(true)

  await page.evaluate(() => document.querySelector('.tree-layer')?.getAnimations()[0]?.play())
  await arrived(page, QUESTION)
})

test('a slide started with a Sheet open closes it first, so no panel travels with the layer (10.6, 11.3)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  await page.goto(ROOT)
  await page.locator('.main-image').click()
  await expect(page.locator('.carousel-sheet .sheet-panel')).toBeVisible()

  // Hold the target's payload back, so the page that started the slide is still the one sliding.
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/*', async (route) => {
    if (route.request().headers()['rsc'] === '1') await held
    await route.continue()
  })
  // The backdrop stops the pointer, not the keyboard: a Branch behind the veil is still reached.
  await page.locator('.answer--next:nth-child(1)').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.tree-layer[data-sliding]')).toHaveCount(1)
  // A fixed panel inside the transformed layer would be laid out in the layer's box, not the viewport's.
  await expect(page.locator('.tree-layer details.sheet[open]')).toHaveCount(0)

  release()
  await arrived(page, QUESTION)
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('a Branch is a link that loads the target page, an Option a disclosure, and no neighbour is in the document', async ({ page }) => {
    await page.goto(ROOT)
    const payloads: string[] = []
    page.on('request', (request) => isPagePayload(request) && payloads.push(request.resourceType()))

    const href = await page.locator('.answer--next:nth-child(1)').getAttribute('href')
    await page.locator('.answer--next:nth-child(1)').click()
    await expect(page).toHaveURL(href!)
    // The Option opens its Overlay in place (14); its heading is the plain link to the aside's address.
    await page.locator('.overlay').first().locator('.sheet-open').click()
    await expect(page).toHaveURL(QUESTION)
    await page.locator('.overlay').first().locator('h2 a').click()
    await expect(page).toHaveURL(OPTION)

    expect(payloads).toEqual(['document', 'document'])
    await expect(page.locator('.bubble')).toHaveCount(1)
    await expect(page.locator('.tree-frame')).toHaveCount(1)
  })
})
