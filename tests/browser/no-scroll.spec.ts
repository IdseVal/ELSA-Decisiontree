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
 * at a 49-entry Trail (every maximum the format allows at once), and the longest Node of
 * the first Tree once it validates -- each in both languages, and each again with every
 * Sheet it offers open. Mid-transition is issue #42's, which builds the transition.
 *
 * Every measurement is written to `tests/browser/.results/no-scroll.md` as a table, so a
 * pull request can paste the numbers rather than describe them (10.6, last paragraph).
 *
 * The fixture and the first Tree are served by servers this file starts, the way
 * tests/browser/theme.spec.ts does: Playwright's own server serves the example Tree.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { openTree } from '../../src/tree/loader.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const trees = path.join(repo, 'trees')
const fixtures = path.join(repo, 'tests', 'fixtures')
const RESULTS = path.join(repo, 'tests', 'browser', '.results')

/** Ports for the servers this file starts; clear of playwright.config.ts's and theme.spec.ts's. */
const FULL_NODE_PORT = Number(process.env.ELSA_TEST_PORT ?? 3117) + 20
const FIRST_TREE_PORT = FULL_NODE_PORT + 1

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
const started: ChildProcess[] = []

test.afterAll(async () => {
  for (const server of started) server.kill()
  await mkdir(RESULTS, { recursive: true })
  await writeFile(path.join(RESULTS, 'no-scroll.md'), table(rows))
})

/**
 * The standalone server, serving `treeId` out of `treesDir` on its own origin -- the same
 * command docs/deployment.md gives. Null when the server exits before it answers, which
 * is what it does for a Tree that does not validate (application.md 5.4).
 */
async function serve(treesDir: string, treeId: string, port: number): Promise<string | null> {
  const origin = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, [path.join('.next', 'standalone', 'server.js')], {
    cwd: repo,
    stdio: 'ignore',
    env: {
      ...process.env,
      ELSA_TREE: treeId,
      ELSA_TREES_DIR: treesDir,
      ELSA_BASE_URL: '',
      NEXT_TELEMETRY_DISABLED: '1',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
    },
  })
  started.push(server)
  let exited = false
  server.on('exit', () => {
    exited = true
  })

  const deadline = Date.now() + 30_000
  for (;;) {
    if (exited) return null
    try {
      if ((await fetch(origin, { redirect: 'manual' })).status > 0) return origin
    } catch {
      if (Date.now() > deadline) throw new Error(`${treeId} did not start on ${port}`)
      await new Promise((wake) => setTimeout(wake, 250))
    }
  }
}

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
 */
async function measureEverywhere(page: Page, url: string, what: string, lang: string, script = true): Promise<void> {
  for (const [width, height] of VIEWPORTS) {
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

      // Without the script a long list is pages of native disclosures (section 14): each
      // page turned in its turn, and measured.
      const more = sheet.locator('.sheet-more:not([open]) > summary')
      for (let turned = 1; (await more.count()) > 0; turned += 1) {
        await more.first().click()
        const turned_ = await measure(page)
        rows.push({ page: what, lang, viewport, sheet: `${kind}, page ${turned + 1}`, measured: turned_ })
        assertFits(turned_, `${what} (${lang}) at ${viewport} with the ${kind} open at page ${turned + 1}`)
      }
      await closeSheet(sheet)
    }

    // The enlarged view of the Node's first Image (12.3), where there is one to open.
    const thumbnail = page.locator('.thumbnail').first()
    if (script && (await thumbnail.isVisible())) {
      await thumbnail.click()
      const enlarged = page.locator('dialog.enlarged')
      await expect(enlarged).toBeVisible()
      const open = await measure(page)
      rows.push({ page: what, lang, viewport, sheet: 'enlarged', measured: open })
      assertFits(open, `${what} (${lang}) at ${viewport} with the enlarged view open`)
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
