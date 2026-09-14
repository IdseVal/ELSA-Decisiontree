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
 * validates -- each in both languages, and each again with every Sheet it offers open and
 * every Image it carries enlarged. Mid-transition is issue #42's, which builds the transition.
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
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const trees = path.join(repo, 'trees')
const fixtures = path.join(repo, 'tests', 'fixtures')
const RESULTS = path.join(repo, 'tests', 'browser', '.results')

/** Ports for the servers this file starts; clear of playwright.config.ts's, theme.spec.ts's and carousel.spec.ts's. */
const FULL_NODE_PORT = BASE_PORT + 20
const FIRST_TREE_PORT = FULL_NODE_PORT + 1
const CAROUSEL_PORT = FULL_NODE_PORT + 3

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

      await control.click()
      await expect(sheet.locator('.sheet-panel')).toBeVisible()
      const open = await measure(page)
      rows.push({ page: what, lang, viewport, sheet: kind, measured: open })
      assertFits(open, `${what} (${lang}) at ${viewport} with the ${kind} open`)
      await assertReachable(sheet, `${what} (${lang}) at ${viewport} with the ${kind} open`)

      // Without the script a long list is pages of native disclosures (section 14): each
      // page turned in its turn, and measured.
      const more = sheet.locator('.sheet-more:not([open]) > summary')
      for (let turned = 1; (await more.count()) > 0; turned += 1) {
        await more.first().click()
        const turned_ = await measure(page)
        rows.push({ page: what, lang, viewport, sheet: `${kind}, page ${turned + 1}`, measured: turned_ })
        assertFits(turned_, `${what} (${lang}) at ${viewport} with the ${kind} open at page ${turned + 1}`)
        await assertReachable(sheet, `${what} (${lang}) at ${viewport} with the ${kind} open at page ${turned + 1}`)
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

for (const lang of LANGUAGES) {
  test(`the full Node at a 49-entry Trail, ${lang}, never scrolls at any viewport of 10.6`, async ({ page }) => {
    test.slow()
    const origin = await serve(fixtures, 'full-node', FULL_NODE_PORT)
    expect(origin, 'the full-node fixture is a valid Tree').not.toBeNull()
    await measureEverywhere(page, `${origin}${inLang(FULL_NODE_URL, lang)}`, 'full Node, 49-entry Trail', lang)
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

test('the longest Node of the first Tree, once it validates, never scrolls at any viewport of 10.6', async ({ page }) => {
  test.slow()
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

  const origin = await serve(trees, first, FIRST_TREE_PORT)
  expect(origin, `${first} starts`).not.toBeNull()
  const url = longest.id === tree!.manifest.root ? `/${first}/${longest.id}` : `/${first}/${tree!.manifest.root}/${longest.id}`
  for (const lang of tree!.manifest.languages) {
    await measureEverywhere(page, `${origin}${inLang(url, lang)}`, `first Tree, longest Node (${longest.id})`, lang)
  }
})

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
  // takes its click, and a second click on the control still closes the panel (14).
  test('the Sources Sheet keeps every link clear of its own control without JavaScript (#59)', async ({ page }) => {
    for (const { url, viewport } of ISSUE_59) {
      const [width, height] = viewport.split('x').map(Number) as [number, number]
      await page.setViewportSize({ width, height })
      await page.goto(url)
      const sheet = page.locator('details.sources-sheet')
      await sheet.locator('.sheet-open').click()
      await expect(sheet.locator('.sheet-panel')).toBeVisible()
      await assertReachable(sheet, `${url} at ${viewport} with the Sources open`)
      await sheet.locator('.sheet-open').click()
      await expect(sheet.locator('.sheet-panel')).toBeHidden()
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
