/**
 * The no-scroll rule, measured: the exact test of docs/specs/application.md 10.6
 * (ADR-38-no-scroll, decision 5). "No scrolling" is a statement about a laid-out
 * document, so it is asserted here, in a browser, and nowhere else.
 *
 * For every viewport of 10.6 and every page of 10.6, after the fonts have settled:
 * `document.documentElement` and `document.body` are no taller or wider than the window,
 * and no element in the document -- the Carousel strip excepted -- has content taller or
 * wider than itself, with one pixel for sub-pixel rounding. That last clause is what
 * catches a nested element quietly overflowing behind `overflow: hidden`, which the first
 * two would let through.
 *
 * The pages: the four situations of 10.3 on the example Tree, `tests/fixtures/full-node/`
 * at a 49-entry Trail (every maximum the format allows at once), the two Nodes with Images
 * of `tests/fixtures/carousel/` (issue #43), and the longest Node of the first Tree once it
 * validates and its heaviest, `annex-i-legislation` (issue #55) -- each in both languages, and
 * each again with every Sheet it offers open and every Image it carries enlarged -- and each
 * in the middle of a slide (section 11): halfway out of the page, and halfway back into it on
 * the history step. A slide follows an Answer or the up arrow; on the full Node and the question
 * Node with Options it also follows an Option, the side slide whose layer is a fraction of a
 * frame taller.
 *
 * Every measurement is written to `tests/browser/.results/no-scroll.md` as a table, so a
 * pull request can paste the numbers rather than describe them (10.6, last paragraph).
 *
 * The fixtures and the first Tree are served by servers this file starts (`serve.ts`):
 * Playwright's own server serves the example Tree.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { openTree } from '../../src/tree/loader.ts'
import { arrived } from './arrived.ts'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const trees = path.join(repo, 'trees')
const fixtures = path.join(repo, 'tests', 'fixtures')
const RESULTS = path.join(repo, 'tests', 'browser', '.results')

/** Ports for the servers this file starts; clear of playwright.config.ts's, theme.spec.ts's and carousel.spec.ts's. */
const FULL_NODE_PORT = BASE_PORT + 20
const FIRST_TREE_PORT = FULL_NODE_PORT + 1
const CAROUSEL_PORT = FULL_NODE_PORT + 3
const FULL_NODE_SLIDING_PORT = FULL_NODE_PORT + 4

/** The viewports of 10.6, in its order: the guarantee, above it, laptops, tablet and phone, the floor. */
const VIEWPORTS = [
  [1280, 640],
  [1366, 768],
  [1920, 1080],
  [2560, 1440],
  [1280, 800],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [360, 640],
  [320, 480],
] as const

/**
 * Where the width alone orders steps 1 and 2 (10.5), none of them a viewport of 10.6: between
 * step 1 (1200) and the guaranteed width, at step 2's trigger (960) and just below it, and in
 * the band between step 2 and the Bubble narrowing (792), each at the guaranteed height and
 * at one tall enough that no height-keyed step fires.
 */
const STEP_2_VIEWPORTS = [
  [1240, 640],
  [1240, 800],
  [960, 640],
  [960, 800],
  [959, 800],
  [800, 800],
] as const

/** The four situations of 10.3, as pages of the example Tree (playwright.config.ts serves it). */
const EXAMPLE_PAGES = [
  { what: 'question Node with Options', url: '/ai-act-example/start/prohibited-practices' },
  { what: 'question Node without Options (the root)', url: '/ai-act-example/start' },
  {
    what: 'explanation Node, three-entry Trail',
    url: '/ai-act-example/start/prohibited-practices/emotion-recognition-at-work/social-scoring',
  },
  { what: 'Terminal', url: '/ai-act-example/start/prohibited-practices/prohibited' },
] as const

/**
 * The rows issue #59 recorded, English and without the script: the page and viewport where the
 * open Sources panel lay under its own control, so that one Source link took no click.
 */
const ISSUE_59 = [
  { url: EXAMPLE_PAGES[0].url, viewport: '768x1024' },
  { url: EXAMPLE_PAGES[2].url, viewport: '768x1024' },
  { url: EXAMPLE_PAGES[2].url, viewport: '390x844' },
  { url: EXAMPLE_PAGES[2].url, viewport: '360x640' },
] as const

/** The full Node reached by visiting itself 49 times: adjacency is not checked (4.3). */
const FULL_NODE_URL = `/full-node/${Array.from({ length: 50 }, () => 'full').join('/')}`

const LANGUAGES = ['en', 'nl'] as const

/** One element's two sizes: what it holds against what it is. */
interface Box {
  sh: number
  ch: number
  sw: number
  cw: number
}

/** Everything 10.6 measures on one laid-out page. */
interface Measured {
  inner: { w: number; h: number }
  doc: Box
  body: Box
  /** Absent below the floor, where the notice replaces the tree view (10.4). */
  bubble: Box | null
  /** Every element whose content is wider or taller than itself, with its numbers. */
  overflowing: string[]
}

/** One row of the table the pull request pastes. */
interface Row {
  page: string
  lang: string
  viewport: string
  sheet: string
  measured: Measured
}

const rows: Row[] = []

test.afterAll(async () => {
  stopServers()
  await mkdir(RESULTS, { recursive: true })
  await writeFile(path.join(RESULTS, 'no-scroll.md'), table(rows))
})

/** The page as laid out, once its fonts have settled: the numbers of 10.6. */
async function measure(page: Page): Promise<Measured> {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const box = (el: Element): Box => ({
      sh: el.scrollHeight,
      ch: el.clientHeight,
      sw: el.scrollWidth,
      cw: el.clientWidth,
    })
    const name = (el: Element): string =>
      `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${[...el.classList].map((c) => `.${c}`).join('')}`

    const overflowing: string[] = []
    for (const el of document.querySelectorAll('*')) {
      // The one exemption: the Carousel strip scrolls sideways inside its own row (12.2).
      if (el.matches('[data-carousel-strip]')) continue
      const b = box(el)
      if (b.sh > b.ch + 1 || b.sw > b.cw + 1) {
        overflowing.push(`${name(el)} holds ${b.sw}x${b.sh} in ${b.cw}x${b.ch}`)
      }
    }
    const bubble = document.querySelector('.bubble')
    return {
      inner: { w: window.innerWidth, h: window.innerHeight },
      doc: box(document.documentElement),
      body: box(document.body),
      bubble: bubble && box(bubble),
      overflowing,
    }
  })
}

/** The assertions of 10.6, each named for the page and viewport that would fail it. */
function assertFits(m: Measured, where: string): void {
  expect(m.doc.sh, `${where}: the document is taller than the window`).toBeLessThanOrEqual(m.inner.h + 1)
  expect(m.doc.sw, `${where}: the document is wider than the window`).toBeLessThanOrEqual(m.inner.w + 1)
  expect(m.body.sh, `${where}: the body is taller than the window`).toBeLessThanOrEqual(m.inner.h + 1)
  expect(m.body.sw, `${where}: the body is wider than the window`).toBeLessThanOrEqual(m.inner.w + 1)
  expect(m.overflowing, `${where}: elements whose content is wider or taller than themselves`).toEqual([])
}

/**
 * Measures `url` at every viewport, plain and then with each Sheet the page offers there
 * open -- and, where the Node has Images and the script runs, with the enlarged view open --
 * and records every measurement. `what` and `lang` name the rows. `script` is false in the
 * no-JavaScript runs, where a thumbnail is a link to the file and opens nothing in place.
 * `viewports` are 10.6's unless a test measures a band of its own.
 */
async function measureEverywhere(
  page: Page,
  url: string,
  what: string,
  lang: string,
  script = true,
  viewports: readonly (readonly [number, number])[] = VIEWPORTS,
): Promise<void> {
  for (const [width, height] of viewports) {
    const viewport = `${width}x${height}`
    await page.setViewportSize({ width, height })
    await page.goto(url)
    await expect(page.locator('main')).toBeVisible()

    const plain = await measure(page)
    rows.push({ page: what, lang, viewport, sheet: '', measured: plain })
    assertFits(plain, `${what} (${lang}) at ${viewport}`)

    // Each Sheet the layout offers at this size, opened in turn: 10.5 gets no exemption.
    const sheets = page.locator('details.sheet')
    for (let i = 0; i < (await sheets.count()); i += 1) {
      const sheet = sheets.nth(i)
      const control = sheet.locator('.sheet-open')
      if (!(await control.isVisible())) continue
      const kind = (await sheet.getAttribute('class'))!.replace('sheet ', '')
      const outside = script ? [] : await pointsOutside(sheet)

      await control.click()
      await expect(sheet.locator('.sheet-panel')).toBeVisible()
      const open = await measure(page)
      rows.push({ page: what, lang, viewport, sheet: kind, measured: open })
      assertFits(open, `${what} (${lang}) at ${viewport} with the ${kind} open`)
      await assertReachable(sheet, `${what} (${lang}) at ${viewport} with the ${kind} open`)
      await assertClear(sheet, outside, `${what} (${lang}) at ${viewport} with the ${kind} open`)

      // Without the script a long list is pages of native disclosures (section 14): each
      // page turned in its turn, and measured.
      const more = sheet.locator('.sheet-more:not([open]) > summary')
      for (let turned = 1; (await more.count()) > 0; turned += 1) {
        await more.first().click()
        const turned_ = await measure(page)
        rows.push({ page: what, lang, viewport, sheet: `${kind}, page ${turned + 1}`, measured: turned_ })
        assertFits(turned_, `${what} (${lang}) at ${viewport} with the ${kind} open at page ${turned + 1}`)
        await assertReachable(sheet, `${what} (${lang}) at ${viewport} with the ${kind} open at page ${turned + 1}`)
        await assertClear(sheet, outside, `${what} (${lang}) at ${viewport} with the ${kind} open at page ${turned + 1}`)
      }
      await closeSheet(sheet)
    }

    // The enlarged view of each of the Node's Images, opened from its thumbnail (12.3), where
    // the strip is on the page. Below step 2 the loop above opened it from its own control.
    const thumbnails = page.locator('.thumbnail')
    const enlarged = page.locator('.carousel-sheet .sheet-panel')
    for (let i = 0; script && i < (await thumbnails.count()); i += 1) {
      if (!(await thumbnails.nth(i).isVisible())) continue
      await thumbnails.nth(i).click()
      await expect(enlarged).toBeVisible()
      const open = await measure(page)
      rows.push({ page: what, lang, viewport, sheet: `enlarged Image ${i + 1}`, measured: open })
      assertFits(open, `${what} (${lang}) at ${viewport} with Image ${i + 1} enlarged`)
      await assertReachable(page.locator('details.carousel-sheet'), `${what} (${lang}) at ${viewport} with Image ${i + 1} enlarged`)
      await page.keyboard.press('Escape')
      await expect(enlarged).toBeHidden()
    }
  }
}

/** A control that slides on every kind of Node: an Answer, or the up arrow where there are none. */
const DOWN = { selector: '.answer--yes, .bubble--explanation .up-arrow, .bubble--terminal .up-arrow', label: '' }

/**
 * Measures `url` at every viewport above the floor in the middle of a slide, both halves of
 * it (application.md 10.6, section 11): following a Branch, with the target's payload held
 * back so the page that leaves is caught halfway; at rest on the target; and halfway back on
 * the history step, where the page that arrives slides in from the target.
 *
 * `follow` names the Branch followed, and the label its rows carry. A viewport where it is
 * not on screen -- an Option collapsed into its Sheet (10.5) -- is left out, and returned, so
 * a test can say where the slide it asked for could not be taken.
 */
async function measureSliding(page: Page, url: string, what: string, lang: string, follow = DOWN): Promise<string[]> {
  const skipped: string[] = []
  for (const [width, height] of VIEWPORTS.filter(([w, h]) => w > 320 && h > 480)) {
    const viewport = `${width}x${height}`
    await page.setViewportSize({ width, height })
    await page.goto(url)
    await expect(page.locator('main')).toBeVisible()

    const branch = page.locator(follow.selector).first()
    if (!(await branch.isVisible())) {
      skipped.push(viewport)
      continue
    }
    // Resolved against the page, not the config's base URL: the fixture has its own origin.
    const href = new URL((await branch.getAttribute('href'))!, page.url()).href

    let release = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    await page.route('**/*', async (route) => {
      if (route.request().headers()['rsc'] === '1') await held
      await route.continue()
    })
    await branch.click()
    await halfway(page)
    const leaving = await measure(page)
    rows.push({ page: what, lang, viewport, sheet: `mid-slide, leaving${follow.label}, ${await layerBox(page)}`, measured: leaving })
    assertFits(leaving, `${what} (${lang}) at ${viewport} halfway through a slide out${follow.label}`)

    release()
    await page.evaluate(() => document.querySelector('.tree-layer')?.getAnimations()[0]?.play())
    await arrived(page, href)
    await page.unroute('**/*')
    const after = await measure(page)
    rows.push({ page: what, lang, viewport, sheet: `after a slide${follow.label}`, measured: after })
    assertFits(after, `${what} (${lang}) at ${viewport} after a slide${follow.label}`)

    await page.goBack()
    await halfway(page)
    const arriving = await measure(page)
    rows.push({ page: what, lang, viewport, sheet: `mid-slide, arriving (back)${follow.label}, ${await layerBox(page)}`, measured: arriving })
    assertFits(arriving, `${what} (${lang}) at ${viewport} halfway through a slide back${follow.label}`)
    await page.evaluate(() => document.querySelector('.tree-layer')?.getAnimations()[0]?.play())
    await arrived(page, url)
  }
  return skipped
}

/**
 * The sliding layer's box against one frame's, in pixels: two frames side by side for an
 * Option, and a fraction of a frame taller for the row it sits in (11.1). Written into the
 * row so the table shows which geometry each measurement caught.
 */
async function layerBox(page: Page): Promise<string> {
  return page.evaluate(() => {
    const size = (selector: string) => {
      const { width, height } = document.querySelector(selector)!.getBoundingClientRect()
      return `${Math.round(width)}x${Math.round(height)}`
    }
    return `layer ${size('.tree-layer[data-sliding]')} over ${size('.tree-frame')}`
  })
}

/** Stops the slide that is running at about half its distance, and holds it there. */
async function halfway(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const animation = document.querySelector('.tree-layer[data-sliding]')?.getAnimations()[0]
    if (!animation) return false
    animation.pause()
    animation.currentTime = 90
    return true
  })
}

/**
 * Closes an open Sheet the way a reader would: a click beside the panel. With the script
 * the backdrop covers the page, the control included, and that click is what closes it;
 * without the script there is no backdrop and the control is a plain disclosure again.
 */
async function closeSheet(sheet: Locator): Promise<void> {
  const backdrop = sheet.locator('.sheet-backdrop')
  if (await backdrop.isVisible()) await backdrop.click({ position: { x: 4, y: 4 } })
  else await sheet.locator('.sheet-open').click()
  await expect(sheet.locator('.sheet-panel')).toBeHidden()
}

/**
 * Every control on an open Sheet's panel is the element a click at its centre lands on. The
 * control that opened the Sheet stays above the panel (14), so a panel laid over it --
 * the collapsed Carousel's, at the bottom of the page -- would swallow the click meant for
 * `next` or `close` and shut the Sheet instead.
 */
async function assertReachable(sheet: Locator, where: string): Promise<void> {
  const covered = await sheet.locator('.sheet-panel').evaluate((panel) =>
    [...panel.querySelectorAll('summary, button, a')].flatMap((control) => {
      // The first line box: the middle of a link wrapped over lines may be beside its text.
      const box = control.getClientRects()[0]
      if (!box || box.width === 0 || box.height === 0) return []
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return hit && control.contains(hit)
        ? []
        : [`${control.textContent?.trim()} at ${Math.round(box.left)},${Math.round(box.top)} under ${hit?.closest('[class]')?.className ?? 'nothing'}`]
    }),
  )
  expect(covered, `${where}: a control on the panel is covered`).toEqual([])
}

/** What a click outside a Sheet lands on: the `at`-th element of `OUTSIDE`, at (x, y). */
interface Point {
  what: string
  at: number
  x: number
  y: number
}

/** Every control a reader can click, and the disclaimer's line, which is always on the page (core document 8). */
const OUTSIDE = 'summary, button, a, .disclaimer p'

/**
 * Without the script nothing veils the page while a Sheet is open, so what is outside its
 * panel is still the reader's: every control of `OUTSIDE` beyond the Sheet that a click
 * reaches while the Sheet is closed, and three points along each line of the disclaimer.
 * Taken before the Sheet opens, for `assertClear` to take again once it is.
 */
async function pointsOutside(sheet: Locator): Promise<Point[]> {
  return sheet.evaluate((details, selector) => {
    const lands = (el: Element, x: number, y: number): boolean => {
      const hit = document.elementFromPoint(x, y)
      return hit !== null && el.contains(hit)
    }
    return [...document.querySelectorAll(selector)].flatMap((el, at) => {
      if (details.contains(el)) return []
      const what = el.textContent?.trim().slice(0, 40) ?? ''
      let points: { x: number; y: number }[]
      if (el.matches('.disclaimer p')) {
        const range = document.createRange()
        range.selectNodeContents(el)
        points = [...range.getClientRects()].flatMap((line) =>
          [line.left + 2, line.left + line.width / 2, line.right - 2].map((x) => ({ x, y: line.top + line.height / 2 })),
        )
      } else {
        const box = el.getClientRects()[0]
        points = box && box.width > 0 && box.height > 0 ? [{ x: box.left + box.width / 2, y: box.top + box.height / 2 }] : []
      }
      return points.filter(({ x, y }) => lands(el, x, y)).map(({ x, y }) => ({ what, at, x, y }))
    })
  }, OUTSIDE)
}

/**
 * Every point of `pointsOutside` that the open panel does not lie over still lands where it
 * did. The panel covers what is under it, as any overlay does; what it must not do is leave
 * the control that opened it, or anything else of its own, over the rest of the page (#59).
 */
async function assertClear(sheet: Locator, points: Point[], where: string): Promise<void> {
  if (points.length === 0) return
  const covered = await sheet.evaluate(
    (details, [selector, points]) => {
      const panel = details.querySelector('.sheet-panel')!.getBoundingClientRect()
      const all = document.querySelectorAll(selector)
      return points.flatMap(({ what, at, x, y }) => {
        if (x >= panel.left && x <= panel.right && y >= panel.top && y <= panel.bottom) return []
        const hit = document.elementFromPoint(x, y)
        return hit && all[at]!.contains(hit)
          ? []
          : [`${what} at ${Math.round(x)},${Math.round(y)} under ${hit?.closest('[class]')?.className ?? 'nothing'}`]
      })
    },
    [OUTSIDE, points] as const,
  )
  expect(covered, `${where}: something outside the panel is covered`).toEqual([])
}


/** `url` said in `lang`: the query of 4.1, left out for the Tree's default. */
function inLang(url: string, lang: string): string {
  return lang === 'en' ? url : `${url}?lang=${lang}`
}

for (const { what, url } of EXAMPLE_PAGES) {
  for (const lang of LANGUAGES) {
    test(`${what}, ${lang}, never scrolls at any viewport of 10.6`, async ({ page }) => {
      test.slow()
      await measureEverywhere(page, inLang(url, lang), what, lang)
    })
  }
}

for (const { what, url } of EXAMPLE_PAGES) {
  for (const lang of LANGUAGES) {
    test(`${what}, ${lang}, never scrolls in the middle of a slide, at any viewport above the floor`, async ({ page }) => {
      test.slow()
      await measureSliding(page, inLang(url, lang), what, lang)
    })
  }
}

/**
 * What the share button says after a click lands under the chrome bar (issue #86): the short
 * confirmation, or -- when no way of copying worked -- the whole link to copy by hand, the
 * longest thing it can say. Neither may make the page scroll. The deepest example page has
 * the longest link.
 */
for (const lang of LANGUAGES) {
  for (const said of ['copied', 'by hand'] as const) {
    test(`the share button's ${said} message, ${lang}, never scrolls at any viewport of 10.6`, async ({ page }) => {
      test.slow()
      if (said === 'by hand') {
        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
          document.execCommand = () => false
        })
      }
      const { what, url } = EXAMPLE_PAGES[2]
      for (const [width, height] of VIEWPORTS) {
        const viewport = `${width}x${height}`
        await page.setViewportSize({ width, height })
        await page.goto(inLang(url, lang))
        const share = page.locator('button.share')
        if (!(await share.isVisible())) continue
        await share.click()
        await expect(page.locator(said === 'copied' ? '.share-said' : '.share-by-hand')).not.toBeEmpty()
        const m = await measure(page)
        rows.push({ page: what, lang, viewport, sheet: `share button, ${said}`, measured: m })
        assertFits(m, `${what} (${lang}) at ${viewport} after the share button said ${said}`)
      }
    })
  }
}

for (const lang of LANGUAGES) {
  test(`the full Node at a 49-entry Trail, ${lang}, never scrolls at any viewport of 10.6`, async ({ page }) => {
    test.slow()
    const origin = await serve(fixtures, 'full-node', FULL_NODE_PORT)
    expect(origin, 'the full-node fixture is a valid Tree').not.toBeNull()
    await measureEverywhere(page, `${origin}${inLang(FULL_NODE_URL, lang)}`, 'full Node, 49-entry Trail', lang)
  })
}

let fullNodeSliding: Promise<string | null> | undefined

/** The full-node fixture's server for the slides, started once for every test that needs it. */
async function fullNodeSlidingOrigin(): Promise<string> {
  fullNodeSliding ??= serve(fixtures, 'full-node', FULL_NODE_SLIDING_PORT)
  const origin = await fullNodeSliding
  expect(origin, 'the full-node fixture is a valid Tree').not.toBeNull()
  return origin!
}

// The page the rule exists for, mid-slide: the layer is fixed at a pixel box and holds two
// frames, one of them the collapsed 49-entry Trail with eight Options (10.6).
for (const lang of LANGUAGES) {
  test(`the full Node at a 49-entry Trail, ${lang}, never scrolls in the middle of a slide, at any viewport above the floor`, async ({ page }) => {
    test.slow()
    await measureSliding(page, `${await fullNodeSlidingOrigin()}${inLang(FULL_NODE_URL, lang)}`, 'full Node, 49-entry Trail', lang)
  })
}

/**
 * The side slides (11.1): the one direction whose layer is a frame wider and a fraction of a
 * frame taller or higher, because an Option's frame sits a quarter-row off the middle. The
 * first Option of eight is up and to the left, the last down and to the right: both signs of
 * the fraction, both edges the fixed layer can grow past.
 */
const SIDE = [
  { selector: '.option >> nth=0', label: ', first Option' },
  { selector: '.option >> nth=-1', label: ', last Option' },
] as const

/** Where the eight Options have collapsed into their Sheet (10.5, steps 3 and 4), so no side slide starts. */
const FULL_NODE_OPTIONS_COLLAPSED = ['1024x768', '768x1024', '390x844', '360x640']

for (const lang of LANGUAGES) {
  test(`the full Node at a 49-entry Trail, ${lang}, never scrolls in the middle of a slide to an Option`, async ({ page }) => {
    test.slow()
    const url = `${await fullNodeSlidingOrigin()}${inLang(FULL_NODE_URL, lang)}`
    for (const side of SIDE) {
      expect(await measureSliding(page, url, 'full Node, 49-entry Trail', lang, side), `${side.label}: viewports with no Option on screen`).toEqual(
        FULL_NODE_OPTIONS_COLLAPSED,
      )
    }
  })
}

// Two Options, one a column: a side slide straight across, down to the tablet, where eight
// Options have collapsed into their Sheet and two still stand beside the Bubble.
for (const lang of LANGUAGES) {
  test(`the question Node with Options, ${lang}, never scrolls in the middle of a slide to an Option`, async ({ page }) => {
    test.slow()
    const skipped = await measureSliding(page, inLang(EXAMPLE_PAGES[0].url, lang), EXAMPLE_PAGES[0].what, lang, SIDE[0])
    expect(skipped, 'viewports with no Option on screen').toEqual(['390x844', '360x640'])
  })
}

/**
 * The Carousel's fixture (section 12): a Node whose Images are more than a page of the strip,
 * the common two, and a credit of the format's maximum 120 characters.
 */
const CAROUSEL_PAGES = [
  { what: 'Node with five Images', url: '/carousel/five' },
  { what: 'Node with two Images', url: '/carousel/five/two' },
  { what: 'Node with a 120-character credit', url: '/carousel/five/two/long' },
] as const

let carousel: Promise<string | null> | undefined

/** The Carousel fixture's server, started once for every test of this file that needs it. */
async function carouselOrigin(): Promise<string> {
  carousel ??= serve(fixtures, 'carousel', CAROUSEL_PORT)
  const origin = await carousel
  expect(origin, 'the carousel fixture is a valid Tree').not.toBeNull()
  return origin!
}

let firstTree: Promise<string | null> | undefined

/** The first Tree's server, started once for every test of this file that needs it. */
async function firstTreeOrigin(): Promise<string> {
  firstTree ??= serve(trees, 'ai-act-applicability-agrifood', FIRST_TREE_PORT)
  const origin = await firstTree
  expect(origin, 'the first Tree starts').not.toBeNull()
  return origin!
}

for (const { what, url } of CAROUSEL_PAGES) {
  for (const lang of LANGUAGES) {
    test(`${what}, ${lang}, never scrolls at any viewport of 10.6, each Image enlarged in turn`, async ({ page }) => {
      test.slow()
      await measureEverywhere(page, `${await carouselOrigin()}${inLang(url, lang)}`, what, lang)
    })
  }
}

// The order of 10.5 by width, laid out: the longest credit whole on the caption line from
// the guaranteed width down to step 2's trigger, and the collapsed row below it.
for (const lang of LANGUAGES) {
  test(`the Node with a 120-character credit, ${lang}, never scrolls where steps 1 and 2 fire by width`, async ({ page }) => {
    test.slow()
    const { what, url } = CAROUSEL_PAGES[2]
    await measureEverywhere(page, `${await carouselOrigin()}${inLang(url, lang)}`, what, lang, true, STEP_2_VIEWPORTS)
  })
}

// A page with a Carousel mid-slide: the strip rides in the layer, and the neighbour it slides
// towards has an empty row where its Carousel will be (11.4).
for (const { what, url } of CAROUSEL_PAGES) {
  for (const lang of LANGUAGES) {
    test(`${what}, ${lang}, never scrolls in the middle of a slide, at any viewport above the floor`, async ({ page }) => {
      test.slow()
      await measureSliding(page, `${await carouselOrigin()}${inLang(url, lang)}`, what, lang)
    })
  }
}

test('the longest Node of the first Tree, once it validates, never scrolls at any viewport of 10.6', async ({ page }) => {
  // Every language at rest, each picture enlarged -- its Options' pictures too since #55 --
  // and mid-slide: four passes over every viewport, more than `test.slow()`'s 90 seconds
  // (4.3 minutes on a laptop).
  test.setTimeout(10 * 60_000)
  const first = 'ai-act-applicability-agrifood'
  const tree = await openTree(path.join(trees, first)).catch(() => null)
  test.skip(
    tree === null,
    `${first} is over the format's length limits until issue #44 cuts it (tests/ai-act-tree.test.ts); nothing can be served`,
  )

  // The longest Node: the longest description in any language. The ids are read off the
  // file only to enumerate; every Node itself comes through the loader (section 7).
  const ids = [...(await readFile(path.join(trees, first, 'tree.yaml'), 'utf8')).matchAll(/^id: (\S+)$/gm)].map(
    (match) => match[1]!,
  )
  let longest = { id: tree!.manifest.root, length: -1 }
  for (const id of ids) {
    const node = await tree!.getNode(id)
    if (!node) continue
    const length = Math.max(...Object.values(node.description).map((d) => d.length))
    if (length > longest.length) longest = { id, length }
  }

  const origin = await firstTreeOrigin()
  const url = longest.id === tree!.manifest.root ? `/${first}/${longest.id}` : `/${first}/${tree!.manifest.root}/${longest.id}`
  for (const lang of tree!.manifest.languages) {
    await measureEverywhere(page, `${origin}${inLang(url, lang)}`, `first Tree, longest Node (${longest.id})`, lang)
    await measureSliding(page, `${origin}${inLang(url, lang)}`, `first Tree, longest Node (${longest.id})`, lang)
  }
})

// The heaviest Node a reader meets (issue #55): its own picture and eight Options, each with
// a picture that is on its Branch and in the strip, nine in the Carousel -- at rest, and
// mid-slide, where the strip rides in the layer beside a neighbour with an empty row (11.4).
for (const lang of LANGUAGES) {
  test(`the first Tree's annex-i-legislation, ${lang}, never scrolls at any viewport of 10.6, each picture enlarged in turn, or mid-slide`, async ({ page }) => {
    test.slow()
    const url = `${await firstTreeOrigin()}${inLang('/ai-act-applicability-agrifood/annex-i-legislation', lang)}`
    await measureEverywhere(page, url, 'first Tree, annex-i-legislation (9 pictures)', lang)
    await measureSliding(page, url, 'first Tree, annex-i-legislation (9 pictures)', lang)
  })
}

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  // Section 14: the rule is CSS and the format's limits, so it holds before any script runs.
  for (const { what, url } of EXAMPLE_PAGES) {
    test(`${what} never scrolls without JavaScript`, async ({ page }) => {
      test.slow()
      await measureEverywhere(page, url, `${what}, no JavaScript`, 'en', false)
    })
  }

  // Issue #59: the Sources control is in the Bubble, in the middle of the page, where the
  // panel is laid. At these rows it lay over one of the panel's own links. Each link now
  // takes its click, a second click on the control still closes the panel (14), and the
  // Bubble behind the panel does not move when the control leaves it.
  test('the Sources Sheet keeps every link clear of its own control without JavaScript (#59)', async ({ page }) => {
    for (const { url, viewport } of ISSUE_59) {
      const [width, height] = viewport.split('x').map(Number) as [number, number]
      await page.setViewportSize({ width, height })
      await page.goto(url)
      const sheet = page.locator('details.sources-sheet')
      const title = page.locator('.bubble h1').first()
      const closed = await title.boundingBox()
      await sheet.locator('.sheet-open').click()
      await expect(sheet.locator('.sheet-panel')).toBeVisible()
      await assertReachable(sheet, `${url} at ${viewport} with the Sources open`)
      expect(await title.boundingBox(), `${url} at ${viewport}: the Bubble moved as the Sources opened`).toEqual(closed)
      await sheet.locator('.sheet-open').click()
      await expect(sheet.locator('.sheet-panel')).toBeHidden()
    }
  })

  // Issue #59, PR #61's first fix: a Node with a Source and an Image, below step 2, where the
  // collapsed Carousel's control is at the foot of the page. With the Sources open, a click on
  // that control opens the enlarged view, and the Sources close: one Sheet at a time (10.2).
  test('the open Sources Sheet leaves the collapsed Carousel its control without JavaScript (#59)', async ({ page }) => {
    for (const [width, height] of [[768, 1024], [390, 844], [360, 640]] as const) {
      await page.setViewportSize({ width, height })
      await page.goto(EXAMPLE_PAGES[1].url)
      const sources = page.locator('details.sources-sheet')
      const carousel = page.locator('details.carousel-sheet')
      await sources.locator('.sheet-open').click()
      await expect(sources.locator('.sheet-panel')).toBeVisible()
      await carousel.locator('.sheet-open').click()
      await expect(carousel.locator('.sheet-panel'), `${width}x${height}: the Carousel did not open`).toBeVisible()
      await expect(sources.locator('.sheet-panel'), `${width}x${height}: the Sources stayed open`).toBeHidden()
    }
  })

  // The Carousel without the script: the strip, its caption line, and below step 2 its
  // control, whose Sheet is a page of disclosures per Image (12.2, 14).
  test('a Node with five Images never scrolls without JavaScript', async ({ page }) => {
    test.slow()
    await measureEverywhere(page, `${await carouselOrigin()}/carousel/five`, 'Node with five Images, no JavaScript', 'en', false)
  })

  // The one Sheet the script pages: without it the 49 entries are pages of disclosures,
  // and each page has to fit the narrowest viewport above the floor (10.2, 10.6, 14).
  for (const lang of LANGUAGES) {
    test(`the full Node at a 49-entry Trail, ${lang}, never scrolls without JavaScript`, async ({ page }) => {
      test.slow()
      const origin = await serve(fixtures, 'full-node', FULL_NODE_PORT + 2)
      expect(origin, 'the full-node fixture is a valid Tree').not.toBeNull()
      await measureEverywhere(
        page,
        `${origin}${inLang(FULL_NODE_URL, lang)}`,
        'full Node, 49-entry Trail, no JavaScript',
        lang,
        false,
      )
    })
  }
})

/** The measurements as a Markdown table: one row per page, language, viewport and Sheet. */
function table(all: Row[]): string {
  const fraction = (a: number, b: number): string => `${a}/${b}`
  const lines = [
    '| page | lang | viewport | Sheet open | document h/inner h | document w/inner w | body h | body w | bubble h/client h | bubble w/client w | overflowing elements |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
  ]
  for (const row of all) {
    const m = row.measured
    lines.push(
      `| ${row.page} | ${row.lang} | ${row.viewport} | ${row.sheet || '-'} | ${fraction(m.doc.sh, m.inner.h)} | ${fraction(m.doc.sw, m.inner.w)} | ${m.body.sh} | ${m.body.sw} | ${m.bubble ? fraction(m.bubble.sh, m.bubble.ch) : '- (notice)'} | ${m.bubble ? fraction(m.bubble.sw, m.bubble.cw) : '-'} | ${m.overflowing.length === 0 ? 'none' : m.overflowing.join('; ')} |`,
    )
  }
  return `${lines.join('\n')}\n`
}
