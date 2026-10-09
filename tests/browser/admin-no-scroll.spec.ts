/**
 * The no-scroll rule over the admin area's pages (docs/specs/application.md 10.6, 35.4;
 * ADR-133-editor-testing): 10.6's exact test at its ten viewports, in both chrome languages,
 * on the pages #135 builds -- the login page, the 403 page, the account page, and the
 * accounts page with more accounts than its box shows, plain and with each of its Sheets
 * open. The accounts list is a `[data-scroll-box]`, the exemption 10.6 names for it; the
 * document never scrolls. **[#137]** And the creators' overview with sixteen tiles and the
 * + tile, and the new-Tree form with three languages, whose boxes are two more carriers.
 * **[#138]** And the editor on `hidden-draft`'s full Node in `en` and `nl` (28.6, 35.4):
 * plain, with the Overlay of the first Options open -- **[#177]** and with its `deleteSideBubble`
 * asking -- with the description in its source state, with a Source's Sheet open, and with
 * the session Sheet. **[#140]** And the enlarged
 * view as the Image's editor, and the attach Sheet. **[#174]** And each of their information
 * hints open, and the strip's `+` with its label shown, beside no strip and beside a full one.
 * **[#176]** And the settings panel and the to-do bubble, opened from the two controls that
 * float at the top right, at every viewport the floor's included; and the to-do bubble with a
 * list longer than the window. **[#177]** And a side bubble at every maximum opened by its
 * address at every viewport: plain, with its delete asking, and below the guarantee with its
 * Sources' Sheet open. **[#178]** And the step's buttons beside the up arrow, in place of the
 * step menu and the link menus, plain and with the red cross's question asked. **[#203]** And the
 * editor's bar with the arrow at its left, beside the example Tree's logo, a wide logo in a Tree of
 * three languages and an 80-character title; and the bar alone at four widths 10.6 does not list;
 * and beside no logo in a Tree of four languages, before and after a first save. **[#204]** And
 * the bar at `/admin` alone, with "Website" at its right end (`bar.ts`), on the login page and on
 * the administrator's creators' overview, at every viewport of 10.6 and at five sizes either side of
 * 480, 600 and 768 wide. **[#206]** And the preview of a hidden Tree on `hidden-draft`'s full
 * Node, plain and with each of its first two Overlays open, and on 40.7's unfinished draft; and the
 * editor of a hidden Tree with the preview button, on its step that ends (40.9). **[#212]** And at
 * and below the floor, on the editor of a hidden Tree and its preview, the notice's text lines clear
 * of every control under the bar (10.4).
 *
 * The measurement is 10.6's, written out here rather than imported: `no-scroll.spec.ts` is
 * a public spec this round does not edit (35.6), and a spec file cannot be imported without
 * running its tests. Every row goes to `tests/browser/.results/admin-no-scroll.md`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { BAR_SIZES, barRow, expectBarFits, measureBar } from './bar.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const PORT = BASE_PORT + 85

/** The viewports of 10.6, in its order. */
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

const LANGUAGES = ['en', 'nl'] as const

/**
 * The Trees of 35.3: **[#137]** the example and `tree-01` to `tree-14`, published, for the
 * overview's box; **[#138]** and `hidden-draft`, the full Node's Tree the editor's rows open,
 * a sixteenth tile with the `hidden` mark on the creators' overview.
 */
const TREES = [
  { folder: path.join(repo, 'trees', 'ai-act-example') },
  ...Array.from({ length: 14 }, (_ignored, index) => ({
    folder: path.join(repo, 'tests', 'fixtures', 'single-language'),
    id: `tree-${String(index + 1).padStart(2, '0')}`,
  })),
  { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true },
]

/**
 * **[#196]** Cees signs in with the longest address 38.1 allows, 254 characters, so the account
 * page's address line and the accounts page's column and `setEmail` Sheet hold it (38.10).
 */
const CEES = { email: `${'c'.repeat(242)}@example.org`, name: 'Cees', password: 'cees first password' }

/** Twenty accounts with the longest name 20.1 allows among them: more rows than the box holds. */
const ACCOUNTS = [
  CEES,
  ...Array.from({ length: 19 }, (_ignored, index) => ({
    email: `creator-${index + 1}@example.org`,
    name: index === 0 ? 'W'.repeat(80) : `Creator number ${index + 1}`,
    password: 'a creators password',
  })),
]

interface Measured {
  doc: { sh: number; sw: number }
  inner: { h: number; w: number }
  overflowing: string[]
}

const rows: string[] = []
let origin: string
/**
 * **[#177]** A store of its own for the side bubble at every maximum, so the overview's tiles above
 * stay what they are; **[#203]** and for the Trees with a wide logo, with an 80-character title and
 * in four languages with no logo, for the same reason.
 */
let overlayOrigin: string

test.beforeAll(async () => {
  origin = await serveStore(await buildDataDir({ trees: TREES, accounts: ACCOUNTS }), PORT, ADMIN_ENV)
  const overlay = [
    { folder: path.join(repo, 'tests', 'fixtures', 'overlay'), hidden: true },
    { folder: path.join(repo, 'tests', 'fixtures', 'wide-logo'), hidden: true },
    { folder: path.join(repo, 'tests', 'fixtures', 'long-title'), hidden: true },
    { folder: path.join(repo, 'tests', 'fixtures', 'four-languages'), hidden: true },
    // **[#206]** 40.7's unfinished draft, made in its own test from the full Node.
    { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'unfinished', hidden: true },
  ]
  overlayOrigin = await serveStore(await buildDataDir({ trees: overlay, accounts: [] }), PORT + 1, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
  await mkdir(RESULTS, { recursive: true })
  await writeFile(
    path.join(RESULTS, 'admin-no-scroll.md'),
    ['| page | lang | viewport | Sheet open | document h/inner h | document w/inner w | overflowing elements |', '|---|---|---|---|---|---|---|', ...rows, ''].join('\n'),
  )
})

/** 10.6's numbers on the laid-out page, once its fonts have settled; **[#203]** the walk over the elements `scope` selects. */
async function measure(page: Page, scope = '*'): Promise<Measured> {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate((scope) => {
    const name = (el: Element): string => `${el.tagName.toLowerCase()}${[...el.classList].map((c) => `.${c}`).join('')}`
    const overflowing: string[] = []
    for (const el of document.querySelectorAll(scope)) {
      // The exemption of 10.6, and a clamp: the caller's name cut with an ellipsis in the
      // chrome bar, which `data-clamp` marks as the overview's tile titles are marked (26.1).
      // **[#138]** And the Carousel strip, 10.6's first exemption, which the editor's Bubble carries.
      if (el.matches('[data-scroll-box], [data-clamp], [data-carousel-strip]')) continue
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
        overflowing.push(`${name(el)} holds ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`)
      }
    }
    const d = document.documentElement
    const b = document.body
    return {
      doc: { sh: Math.max(d.scrollHeight, b.scrollHeight), sw: Math.max(d.scrollWidth, b.scrollWidth) },
      inner: { h: window.innerHeight, w: window.innerWidth },
      overflowing,
    }
  }, scope)
}

function record(m: Measured, what: string, lang: string, viewport: string, sheet: string): void {
  rows.push(`| ${what} | ${lang} | ${viewport} | ${sheet || '-'} | ${m.doc.sh}/${m.inner.h} | ${m.doc.sw}/${m.inner.w} | ${m.overflowing.join('; ') || 'none'} |`)
  const where = `${what} (${lang}) at ${viewport}${sheet ? ` with ${sheet} open` : ''}`
  expect(m.doc.sh, `${where}: taller than the window`).toBeLessThanOrEqual(m.inner.h + 1)
  expect(m.doc.sw, `${where}: wider than the window`).toBeLessThanOrEqual(m.inner.w + 1)
  expect(m.overflowing, `${where}: elements whose content is larger than themselves`).toEqual([])
}

/** Measures `address` at every viewport, plain and with each Sheet it offers open in turn. */
async function everywhere(page: Page, address: string, what: string, lang: string, status: number): Promise<void> {
  for (const [width, height] of VIEWPORTS) {
    const viewport = `${width}x${height}`
    await page.setViewportSize({ width, height })
    expect((await page.goto(`${origin}${address}${lang === 'en' ? '' : `${address.includes('?') ? '&' : '?'}lang=${lang}`}`))?.status()).toBe(status)
    await expect(page.locator('main')).toBeVisible()
    record(await measure(page), what, lang, viewport, '')

    const sheets = page.locator('details.sheet')
    for (let i = 0; i < (await sheets.count()); i += 1) {
      const sheet = sheets.nth(i)
      const control = sheet.locator('.sheet-open')
      // A row's Sheet below the box's fold is not on screen, and a creator scrolls the box to it.
      if (!(await control.isVisible()) || i > 2) continue
      await control.click()
      await expect(sheet.locator('.sheet-panel')).toBeVisible()
      record(await measure(page), what, lang, viewport, (await control.textContent())!)
      await page.keyboard.press('Escape')
      await expect(sheet.locator('.sheet-panel')).toBeHidden()
    }
  }
}

async function loggedIn(browser: Browser, name: string, password: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage()
  expect((await login(page, origin, name, password)).status).toBe(204)
  return page
}

for (const lang of LANGUAGES) {
  test(`the login page, ${lang}, never scrolls at any viewport of 10.6`, async ({ page }) => {
    await everywhere(page, '/admin', 'login page', lang, 200)
  })

  test(`the 403 page, ${lang}, never scrolls at any viewport of 10.6`, async ({ browser }) => {
    await everywhere(await loggedIn(browser, CEES.email, CEES.password), '/admin/accounts', '403 page', lang, 403)
  })

  test(`the account page, ${lang}, never scrolls at any viewport of 10.6`, async ({ browser }) => {
    await everywhere(await loggedIn(browser, CEES.email, CEES.password), '/admin/account', 'account page', lang, 200)
  })

  test(`the accounts page with twenty-one accounts, ${lang}, never scrolls at any viewport of 10.6`, async ({ browser }) => {
    test.slow()
    await everywhere(await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD), '/admin/accounts', 'accounts page', lang, 200)
  })

  test(`the creators' overview with sixteen tiles and the + tile, ${lang}, never scrolls at any viewport of 10.6`, async ({ browser }) => {
    test.slow()
    const page = await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD)
    await everywhere(page, '/admin', "creators' overview", lang, 200)
    await expect(page.locator('.tile')).toHaveCount(TREES.length + 1)
  })

  // **[#204]** The administrator's overview carries the most controls: `account`, `accounts`, `logout`, `website`.
  for (const session of [false, true]) {
    const what = session ? "creators' overview, the administrator" : 'login page'
    test(`the bar at /admin with "Website", the ${what}, ${lang}, fits at every viewport of 10.6 and at five more`, async ({ browser, page: anonymous }) => {
      const page = session ? await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD) : anonymous
      for (const [width, height] of [...VIEWPORTS, ...BAR_SIZES]) {
        const viewport = `${width}x${height}`
        await page.setViewportSize({ width, height })
        expect((await page.goto(`${origin}/admin${lang === 'en' ? '' : `?lang=${lang}`}`))?.status()).toBe(200)
        await expect(page.locator('header.page-chrome').getByRole('link', { name: 'Website', exact: true })).toBeVisible()
        const m = await measureBar(page)
        rows.push(barRow(`bar at /admin, ${what}`, lang, viewport, m))
        expectBarFits(m, `the bar of the ${what} (${lang}) at ${viewport}`)
      }
    })
  }

  test(`the new-Tree form with three languages, ${lang}, never scrolls at any viewport of 10.6`, async ({ browser }) => {
    test.slow()
    const page = await loggedIn(browser, CEES.email, CEES.password)
    for (const [width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}/admin/new${lang === 'en' ? '' : `?lang=${lang}`}`)
      // The page's language is the one tag; the other chrome language and a third make three.
      await page.locator('.new-tree-add button', { hasText: /^(en|nl)$/ }).click()
      await page.locator('.new-tree-add input').fill('pt-br')
      await page.locator('.new-tree-add input').press('Enter')
      await expect(page.locator('.new-tree-tag')).toHaveCount(3)
      record(await measure(page), 'new-Tree form, three languages', lang, `${width}x${height}`, '')
    }
  })
}

/** The editor's page at every viewport, in every state 28.6 names for this issue (35.4). */
async function editorEverywhere(page: Page, lang: string): Promise<void> {
  const address = `/admin/trees/hidden-draft/full${lang === 'en' ? '' : '?lang=nl'}`
  for (const [width, height] of VIEWPORTS) {
    const viewport = `${width}x${height}`
    await page.setViewportSize({ width, height })
    expect((await page.goto(`${origin}${address}`))?.status()).toBe(200)
    await expect(page.locator('main')).toBeVisible()
    record(await measure(page), 'editor', lang, viewport, '')

    // **[#142]** The top panel (33.2), and **[#176]** the to-do bubble (33.3), from the controls
    // that float at the top right at every size, the floor's included: each body a scroll box.
    await floatingSheets(page, 'editor', lang, viewport)

    // The description in its source state, with the pill on the rim (28.3, 28.5).
    const description = page.locator('[data-field="full description.en"], [data-field="full description.nl"]').filter({ visible: true })
    // At the floor the notice stands in for the view (10.4): no field and no Sheet to open.
    if ((await description.count()) === 0) continue
    await description.click()
    await expect(description.locator('textarea')).toBeFocused()
    record(await measure(page), 'editor', lang, viewport, 'description source')
    await page.keyboard.press('Escape')
    await description.locator('textarea').blur()

    // A Source's Sheet, where its line is on screen; below the guarantee the block is a Sheet itself.
    const source = page.locator('.source-sheet').filter({ visible: true }).first().locator('.sheet-open')
    if (await source.isVisible()) {
      await source.click()
      await expect(page.locator('.source-editor').filter({ visible: true })).toBeVisible()
      record(await measure(page), 'editor', lang, viewport, 'source Sheet')
      await page.keyboard.press('Escape')
    }

    // The Overlays of the first Options, as the public no-scroll test opens them.
    const sheets = page.locator('details.overlay')
    for (let i = 0; i < Math.min(await sheets.count(), 2); i += 1) {
      // The Overlay's own control, not the `+ addSource` or `...` Sheets' inside its Interior.
      const control = sheets.nth(i).locator(':scope > .sheet-open')
      if (!(await control.isVisible())) continue
      // On the picture: the title beside it is a field now, and a click on it edits.
      await control.locator('.option-image').click()
      await expect(sheets.nth(i).locator(':scope > .sheet-panel')).toBeVisible()
      record(await measure(page), 'editor', lang, viewport, `Overlay ${i + 1}`)
      // **[#177]** Its delete asks in place, at the panel's foot (30.7); the answer is never given here.
      const remove = sheets.nth(i).locator('.side-delete')
      await remove.locator('.side-delete-button').click()
      await expect(remove.locator('.structure-confirm')).toBeVisible()
      record(await measure(page), 'editor', lang, viewport, `Overlay ${i + 1}, delete asked`)
      await page.keyboard.press('Escape')
      await expect(sheets.nth(i).locator(':scope > .sheet-panel')).toBeHidden()
    }
  }
}

/**
 * **[#176]** The two floating controls' Sheets on the editor page shown (33.2, 33.3), each opened
 * from its control, measured once the re-read its opening makes has been answered, and closed.
 */
async function floatingSheets(page: Page, what: string, lang: string, viewport: string): Promise<void> {
  for (const [name, rereads, sheetName] of [
    ['panel-sheet', ['/admin/api/trees/', '/admin/api/accounts'], 'top panel'],
    ['todo-sheet', ['/admin/api/trees/'], 'to-do bubble'],
  ] as const) {
    const sheet = page.locator(`.${name}`)
    const answered = rereads.map((reread) => page.waitForResponse((response) => new URL(response.url()).pathname.startsWith(reread)))
    await sheet.locator(':scope > .sheet-open').click()
    await expect(sheet.locator(':scope > .sheet-panel')).toBeVisible()
    await Promise.all(answered)
    record(await measure(page), what, lang, viewport, sheetName)
    await page.keyboard.press('Escape')
    await expect(sheet.locator(':scope > .sheet-panel')).toBeHidden()
  }
}

for (const lang of LANGUAGES) {
  test(`the editor on the full Node, ${lang}, never scrolls at any viewport of 10.6, in every state (28.6)`, async ({ browser }) => {
    test.slow()
    await editorEverywhere(await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD), lang)
  })
}

/**
 * **[#203]** The editor's bar with the arrow at its left (24.3), beside the marks `hidden-draft`'s
 * short title does not try: the example Tree's logo; a logo at its cap in a Tree of three
 * languages, whose third pill leaves it the least room (`tests/fixtures/wide-logo/`); and an
 * 80-character title as text, cut to the bar's two lines (#200). Plain, at every viewport of 10.6.
 * Then at four widths 10.6 does not list, from 480 up, the bar alone: below 578 (en) and 641 (nl)
 * the disclaimer's second line fails the whole page on the CI runner, as it did before #203
 * (`NARROW` below). Each page is measured with the arrow in the bar, which before #203 it was not.
 */
const BAR_WIDTHS = [480, 560, 640, 767] as const
for (const lang of LANGUAGES) {
  test(`the editor's bar with the arrow, beside a logo, a wide logo in three languages and an 80-character title, ${lang}, never scrolls at any viewport of 10.6 (24.3, 28.6)`, async ({ browser }) => {
    const query = lang === 'en' ? '' : '?lang=nl'
    const other = await (await browser.newContext()).newPage()
    expect((await login(other, overlayOrigin, ADMIN_EMAIL, ADMIN_PASSWORD)).status).toBe(204)
    const editors = [
      [await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD), `${origin}/admin/trees/ai-act-example/start${query}`, 'editor, a logo'],
      [other, `${overlayOrigin}/admin/trees/wide-logo/start${query}`, 'editor, a wide logo, three languages'],
      [other, `${overlayOrigin}/admin/trees/long-title/start${query}`, 'editor, an 80-character title'],
    ] as const
    for (const [page, address, what] of editors) {
      const arrow = page.locator('header.editor-chrome > .page-brand > a.back-to-overview')
      for (const [width, height] of VIEWPORTS) {
        await page.setViewportSize({ width, height })
        expect((await page.goto(address))?.status()).toBe(200)
        await expect(arrow).toBeVisible()
        record(await measure(page), what, lang, `${width}x${height}`, '')
      }
      for (const width of BAR_WIDTHS) {
        const viewport = `${width}x800`
        await page.setViewportSize({ width, height: 800 })
        expect((await page.goto(address))?.status()).toBe(200)
        await expect(arrow).toBeVisible()
        const bar = await measure(page, 'header.editor-chrome, header.editor-chrome *')
        rows.push(`| ${what} | ${lang} | ${viewport} | the bar alone | - | ${bar.doc.sw}/${bar.inner.w} | ${bar.overflowing.join('; ') || 'none'} |`)
        expect(bar.doc.sw, `${what} (${lang}) at ${viewport}: wider than the window`).toBeLessThanOrEqual(bar.inner.w + 1)
        expect(bar.overflowing, `${what} (${lang}) at ${viewport}: elements of the bar whose content is larger than themselves`).toEqual([])
      }
    }
  })
}

/**
 * **[#203]** The arrow's room below 480 pixels wide in a Tree with no logo, as the owner chose on
 * #214 (A, 2026-10-09): the editor gives up a title written as text there, so in a Tree of four
 * languages (`tests/fixtures/four-languages/`) the controls make the room. At every viewport of
 * 10.6, on a page opened before any save and again after a first save, when the indicator says
 * `saved`: below 480 the current language, not drawn there, gives up its place in the switch, and
 * the word is not drawn and takes no room, yet stays in the status region that screen readers
 * announce (29.3); from 480 up it is drawn.
 */
for (const lang of LANGUAGES) {
  test(`the editor's bar with the arrow in a Tree of four languages with no logo, ${lang}, before and after a save, never scrolls at any viewport of 10.6 (24.3, 28.6, 29.3)`, async ({ browser }) => {
    const page = await (await browser.newContext()).newPage()
    expect((await login(page, overlayOrigin, ADMIN_EMAIL, ADMIN_PASSWORD)).status).toBe(204)
    const address = `${overlayOrigin}/admin/trees/four-languages/start${lang === 'en' ? '' : '?lang=nl'}`
    const status = page.locator('header.editor-chrome').getByRole('status')
    const saved = lang === 'en' ? 'Saved' : 'Opgeslagen'
    for (const [width, height] of VIEWPORTS) {
      const viewport = `${width}x${height}`
      await page.setViewportSize({ width, height })
      expect((await page.goto(address))?.status()).toBe(200)
      await expect(page.locator('header.editor-chrome > .page-brand > a.back-to-overview')).toBeVisible()
      record(await measure(page), 'editor, no logo, four languages', lang, viewport, '')
      const current = await page.locator('header.editor-chrome .language-switch li:has(> .language--current)').boundingBox()
      if (width < 480) expect(current, `${viewport}: the current language keeps its place below 480`).toBeNull()

      // Typed at 1280 x 800 and measured back at the viewport: at the floor the notice stands where
      // the fields would (10.4), and a window narrowed after a save keeps its indicator. A title of
      // its own at each viewport, so that each one is a change the queue saves.
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.locator(`[data-field="start title.${lang}"] textarea`).filter({ visible: true }).fill(`${saved} at ${viewport}?`)
      await expect(status).toContainText(saved)
      await page.setViewportSize({ width, height })
      record(await measure(page), 'editor, no logo, four languages, after a save', lang, viewport, '')
      const drawn = (await status.boundingBox())!.width
      if (width < 480) expect(drawn, `${viewport}: "${saved}" drawn below 480`).toBeLessThanOrEqual(1)
      else expect(drawn, `${viewport}: "${saved}" not drawn from 480 up`).toBeGreaterThan(1)
    }
  })
}

/**
 * **[#139]** The structure's Sheets (30) at every viewport (28.6): on an explanation Node that
 * is the centre, the end Sheet. Each is opened, measured and closed with Escape. **[#177]** The
 * fan's `+` opens no Sheet any more: one click creates (30.4, amended), and the side bubble it
 * opens is measured with the Overlays. **[#178]** The step menu and the link menus are gone
 * (30.6, 30.8, amended): in their place the step's buttons beside the up arrow are measured --
 * the red cross on that explanation Node, and the cross with "Tree does not end here after all"
 * on a Terminal under a Trail -- each page also with the cross's question asked.
 */
async function structureEverywhere(page: Page, lang: string): Promise<void> {
  const query = lang === 'en' ? '' : '?lang=nl'
  const open = async (control: Locator, what: string, viewport: string, inside?: () => Promise<void>): Promise<void> => {
    if (!(await control.isVisible())) return
    await control.click()
    if (inside) await inside()
    record(await measure(page), 'editor, structure', lang, viewport, what)
    await page.keyboard.press('Escape')
  }
  const asked = () => expect(page.getByRole('alertdialog')).toBeVisible()
  for (const [width, height] of VIEWPORTS) {
    const viewport = `${width}x${height}`
    await page.setViewportSize({ width, height })
    expect((await page.goto(`${origin}/admin/trees/hidden-draft/opt-three${query}`))?.status()).toBe(200)
    await expect(page.locator('main')).toBeVisible()
    record(await measure(page), 'editor, structure', lang, viewport, '')
    await open(page.locator('.structure-end > .sheet-open'), 'end Sheet', viewport)
    await open(page.locator('.step-delete'), 'the cross, asking', viewport, asked)

    expect((await page.goto(`${origin}/admin/trees/hidden-draft/full/does-not-apply${query}`))?.status()).toBe(200)
    await expect(page.locator('main')).toBeVisible()
    record(await measure(page), 'editor, structure', lang, viewport, 'a Terminal, its two buttons')
    await open(page.locator('.step-delete'), 'a Terminal, the cross asking', viewport, asked)
  }
}

for (const lang of LANGUAGES) {
  test(`the structure's Sheets and the step's buttons, ${lang}, never scroll at any viewport of 10.6 (30, 28.6)`, async ({ browser }) => {
    test.slow()
    await structureEverywhere(await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD), lang)
  })
}

/**
 * **[#140]** The picture Sheets (31.2, 31.3): the enlarged view as the Image's editor, on the
 * full Node's main image, and the attach Sheet after an upload into the empty slot of a
 * Terminal, cancelled again so the draft is as it was. **[#174]** Each with every information
 * hint open in turn, and the strip's `+` with its label shown: beside no strip, and beside the
 * widest strip, on an explanation Node given nine pictures, where the label has the least room
 * -- that one plain too, and at the widths of `NARROW` as well.
 */

/** Opens each information hint in `scope` in turn by focus and measures the page with it open. */
async function eachHint(page: Page, scope: Locator, lang: string, viewport: string, what: string): Promise<void> {
  const marks = scope.locator('.hint-mark').filter({ visible: true })
  for (let i = 0; i < (await marks.count()); i += 1) {
    await marks.nth(i).focus()
    await expect(scope.locator('.hint-panel[data-open]')).toBeVisible()
    record(await measure(page), 'editor', lang, viewport, `${what}, hint ${i + 1}`)
    await page.keyboard.press('Escape')
    await expect(scope.locator('.hint-panel[data-open]')).toHaveCount(0)
  }
}

/** Shows the strip's `+` label by hovering the `+`, where there is one, and measures the page. */
async function plusLabel(page: Page, lang: string, viewport: string, what: string): Promise<void> {
  const plus = page.locator('.carousel > .editor-picker--strip')
  if (!(await plus.isVisible())) return
  await plus.hover()
  await expect(page.locator('.carousel > .editor-picker-room > .editor-picker-label')).toBeVisible()
  record(await measure(page), 'editor', lang, viewport, what)
  await page.mouse.move(0, 0)
}

/**
 * **[#174]** Widths 10.6 does not list, beside the widest strip: there the band's third column
 * leaves the `+` label less than 110 pixels, and it stands left of the `+` (31.1). On PR #187
 * the Reviewer measured it leaving the band from 550 to 680 wide in en and to 720 in nl. Each
 * language's rows start where the disclaimer holds its one line: narrower, it takes a second,
 * which its 28-pixel row does not hold whatever the carousel does, as the pull request records.
 * In Liberation Sans, the CI runner's face, that line is 608.5 pixels in nl and needs a window
 * of 641, so 640 is too narrow; in en it is 545.6 and needs 578. (Segoe UI needs 639 and 570.)
 */
const NARROW = {
  en: [
    [600, 800],
    [620, 640],
    [640, 640],
    [640, 800],
    [660, 640],
    [660, 800],
    [700, 640],
    [720, 800],
    [760, 640],
  ],
  nl: [
    [660, 640],
    [660, 800],
    [700, 640],
    [720, 800],
    [760, 640],
  ],
} as const
for (const lang of LANGUAGES) {
  test(`the editor's picture Sheets, ${lang}, never scroll at any viewport of 10.6 (31.2, 31.3)`, async ({ browser }) => {
    test.slow()
    const page = await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD)
    const query = lang === 'en' ? '' : '?lang=nl'
    const picture = { name: 'covered.png', mimeType: 'image/png', buffer: await readFile(path.join(repo, 'trees', 'ai-act-example', 'images', 'covered.png')) }
    // One picture on the other Terminal, for the strip's `+` beside no strip; the nl run finds it there.
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}/admin/trees/hidden-draft/full/does-not-apply`)
    const slot = page.locator('.bubble .editor-picker--slot')
    if ((await slot.count()) > 0) {
      await slot.locator('input[type="file"]').setInputFiles(picture)
      await page.locator('.editor-attach-panel textarea').first().fill('Drawing: ELSA lab')
      await page.locator('.editor-attach-panel button[type="submit"]').click()
      await expect(page.locator('.carousel > .editor-picker--strip')).toBeVisible()
    }
    // [#174] Nine pictures on an explanation Node: a strip at its widest, and the `+` after it.
    const widest = `${origin}/admin/api/trees/hidden-draft/nodes/opt-one`
    // The request context keeps no `Secure` cookie on plain http: the session travels in the header (admin.ts).
    const { cookie } = await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
    const headers = { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }
    const pictures = ((await (await page.request.get(widest, { headers })).json()) as { node: { images: unknown[] } }).node.images.length
    for (const file of ['two.png', 'three.png', 'four.png', 'five.png', 'six.png', 'seven.png', 'eight.png', 'nine.png'].slice(pictures - 1)) {
      const added = await page.request.patch(widest, { headers, data: JSON.stringify({ op: 'add-image', file, credit: 'Drawing: ELSA lab', description: { en: file } }) })
      expect(added.status(), file).toBe(200)
    }
    for (const [width, height] of NARROW[lang]) {
      const viewport = `${width}x${height}`
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}/admin/trees/hidden-draft/opt-one${query}`)
      await expect(page.locator('.carousel > .editor-picker--strip')).toBeVisible()
      record(await measure(page), 'editor', lang, viewport, 'widest strip +')
      await plusLabel(page, lang, viewport, 'widest strip +, its label')
    }
    for (const [width, height] of VIEWPORTS) {
      const viewport = `${width}x${height}`
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}/admin/trees/hidden-draft/full/does-not-apply${query}`)
      if (await page.locator('.carousel > .editor-picker--strip').isVisible()) record(await measure(page), 'editor', lang, viewport, 'strip +')
      await plusLabel(page, lang, viewport, 'strip +, its label')
      await page.goto(`${origin}/admin/trees/hidden-draft/opt-one${query}`)
      if (await page.locator('.carousel > .editor-picker--strip').isVisible()) record(await measure(page), 'editor', lang, viewport, 'widest strip +')
      await plusLabel(page, lang, viewport, 'widest strip +, its label')
      await page.goto(`${origin}/admin/trees/hidden-draft/full${query}`)
      const main = page.locator('.bubble .main-image')
      // At the floor the notice stands in for the view (10.4): no picture to open.
      if (!(await main.isVisible())) {
        // [#174] Where the main image is given up (10.5, step 5) the strip's `+` still uploads:
        // the attach Sheet and its hints at a phone's width, from the Terminal's pill.
        await page.goto(`${origin}/admin/trees/hidden-draft/full/does-not-apply${query}`)
        const plus = page.locator('.carousel > .editor-picker--strip')
        if (!(await plus.isVisible())) continue
        await plus.locator('input[type="file"]').setInputFiles(picture)
        const attach = page.locator('.editor-attach-panel')
        await expect(attach).toBeVisible()
        record(await measure(page), 'editor', lang, viewport, 'attach Sheet, from the +')
        await eachHint(page, attach, lang, viewport, 'attach Sheet, from the +')
        await attach.locator('.sheet-controls button[type="button"]').click()
        await expect(attach).toHaveCount(0)
        continue
      }
      await main.click()
      const enlarged = page.locator('.carousel-sheet > .sheet-panel')
      await expect(enlarged.locator('.editor-image-controls')).toBeVisible()
      record(await measure(page), 'editor', lang, viewport, 'enlarged view')
      await eachHint(page, enlarged, lang, viewport, 'enlarged view')
      await page.keyboard.press('Escape')

      await page.goto(`${origin}/admin/trees/hidden-draft/full/applies${query}`)
      // The empty slot as a picker, plain (31.1).
      record(await measure(page), 'editor', lang, viewport, 'empty slot')
      await page.locator('.bubble .editor-picker--slot input[type="file"]').setInputFiles(picture)
      const attach = page.locator('.editor-attach-panel')
      await expect(attach).toBeVisible()
      record(await measure(page), 'editor', lang, viewport, 'attach Sheet')
      await eachHint(page, attach, lang, viewport, 'attach Sheet')
      await attach.locator('.sheet-controls button[type="button"]').click()
      await expect(attach).toHaveCount(0)
    }
  })
}

test('the editor with the session Sheet open never scrolls at the guarantee and on a phone (29.6)', async ({ browser }) => {
  // Not the floor: there the notice stands in for the view and no field can be typed in (10.4).
  for (const [width, height] of [VIEWPORTS[0], VIEWPORTS[8]] as const) {
    const page = await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.setViewportSize({ width, height })
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await page.context().clearCookies()
    const title = page.locator('[data-field="full title.en"] textarea')
    await title.click()
    await title.press('End')
    // **[#172]** A key past the title's 80 does nothing now (28.4, amended): a deletion is the edit that writes.
    await title.press('Backspace')
    await expect(page.getByRole('dialog')).toBeVisible()
    record(await measure(page), 'editor', 'en', `${width}x${height}`, 'session Sheet')
  }
})

/**
 * **[#176]** The to-do bubble with a list longer than the window (33.3): a fresh Tree in two
 * languages whose root was given eight side bubbles, and the first of them eight more, with an
 * English title alone, so each is missing the rest of its texts (19.2). The bubble's body is a
 * scroll box (26.3, amended) and holds the list; the document never scrolls, at the floor too.
 */
test('the to-do bubble with a list longer than the window never scrolls the document at any viewport of 10.6 (33.3)', async ({ browser }) => {
  test.slow()
  const page = await (await browser.newContext()).newPage()
  const { status, cookie } = await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
  expect(status).toBe(204)
  const post = (route: string, data: unknown) =>
    page.request.post(`${origin}/admin/api${route}`, { headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, data: JSON.stringify(data) })
  expect((await post('/trees', { id: 'many-to-dos', languages: ['en', 'nl'], title: { en: 'Many to-dos', nl: 'Veel te doen' } })).status()).toBe(201)
  const sides: string[] = []
  for (const from of ['start', 'first side bubble']) {
    for (let i = 1; i <= 8; i += 1) {
      const created = await post('/trees/many-to-dos/nodes', { from: { node: from === 'start' ? from : sides[0], link: 'option' }, title: { en: `Side bubble ${i}` } })
      expect(created.status()).toBe(201)
      sides.push(((await created.json()) as { node: { id: string } }).node.id)
    }
  }
  const entry = (await (await page.request.get(`${origin}/admin/api/trees/many-to-dos`, { headers: { Cookie: cookie } })).json()) as { advisory: unknown[] }
  console.log(`many-to-dos has ${entry.advisory.length} things to do`)

  for (const [width, height] of VIEWPORTS) {
    const viewport = `${width}x${height}`
    await page.setViewportSize({ width, height })
    expect((await page.goto(`${origin}/admin/trees/many-to-dos/start`))?.status()).toBe(200)
    const sheet = page.locator('.todo-sheet')
    const answered = page.waitForResponse((response) => new URL(response.url()).pathname === '/admin/api/trees/many-to-dos')
    await sheet.locator(':scope > .sheet-open').click()
    await answered
    await expect(sheet.locator('.todo-list li')).toHaveCount(entry.advisory.length)
    const body = await sheet.locator('.panel-body').evaluate((element) => ({ holds: element.scrollHeight, shows: element.clientHeight }))
    console.log(`${viewport}: the bubble's body holds ${body.holds} pixels of list in ${body.shows}`)
    expect(body.holds, `${viewport}: the list is longer than the bubble, so the scroll box holds it`).toBeGreaterThan(body.shows + 1)
    record(await measure(page), 'editor, many to-dos', 'en', viewport, 'to-do bubble')
    await page.keyboard.press('Escape')
    await expect(sheet.locator(':scope > .sheet-panel')).toBeHidden()
  }
})

/**
 * **[#177]** The side bubble at every maximum -- `tests/fixtures/overlay/`'s `big`: eight Options of
 * its own, three Sources, the longest title and description -- opened by its address in the
 * editor at every viewport of 10.6 (30.5, 30.7): plain; below the guarantee with its Sources'
 * Sheet open, where they are edited as the Bubble's are (28.6); and with `deleteSideBubble`
 * asking, which takes more of the panel's foot than the button. The answer is never given.
 */
for (const lang of LANGUAGES) {
  test(`a side bubble at every maximum, opened by its address, ${lang}, never scrolls at any viewport of 10.6 (30.5, 30.7, 28.6)`, async ({ browser }) => {
    test.slow()
    const page = await (await browser.newContext()).newPage()
    expect((await login(page, overlayOrigin, ADMIN_EMAIL, ADMIN_PASSWORD)).status).toBe(204)
    for (const [width, height] of VIEWPORTS) {
      const viewport = `${width}x${height}`
      await page.setViewportSize({ width, height })
      expect((await page.goto(`${overlayOrigin}/admin/trees/overlay/five/big${lang === 'en' ? '' : '?lang=nl'}`))?.status()).toBe(200)
      await expect(page.locator('main')).toBeVisible()
      const panel = page.locator('details.overlay[open] > .sheet-panel')
      // At the floor the notice stands in for the view (10.4): no side bubble to measure.
      if (!(await panel.isVisible())) continue
      // Drawn after hydration: the controls below listen from here on.
      await expect(page.locator('details.overlay[open] > .sheet-backdrop')).toBeAttached()
      record(await measure(page), 'side bubble at every maximum', lang, viewport, '')
      const sources = panel.locator('.sources-sheet')
      if (await sources.locator(':scope > .sheet-open').isVisible()) {
        await sources.locator(':scope > .sheet-open').click()
        await expect(sources.locator(':scope > .sheet-panel')).toBeVisible()
        record(await measure(page), 'side bubble at every maximum', lang, viewport, 'its Sources Sheet')
        await page.keyboard.press('Escape')
        await expect(sources.locator(':scope > .sheet-panel')).toBeHidden()
        await expect(panel).toBeVisible()
      }
      await panel.locator('.side-delete-button').click()
      await expect(panel.locator('.side-delete .structure-confirm')).toBeVisible()
      record(await measure(page), 'side bubble at every maximum', lang, viewport, 'delete asked')
    }
  })
}

/**
 * **[#206]** 40.7's draft on the second store: no Dutch title or text on the full Node, its Yes
 * removed, a fresh step under `opt-two`, an ending without Dutch words, a picture without a credit
 * or a Dutch description, and no Dutch Tree title. Answers the fresh step's id.
 */
async function unfinishedDraft(page: Page, cookie: string): Promise<string> {
  const api = (method: string, route: string, data: unknown) =>
    page.request.fetch(`${overlayOrigin}/admin/api/trees/unfinished${route}`, {
      method,
      headers: { Origin: overlayOrigin, Cookie: cookie, 'Content-Type': 'application/json' },
      data: JSON.stringify(data),
    })
  const made = await api('POST', '/nodes', { from: { node: 'opt-two', link: 'answer', label: { en: 'Yes', nl: 'Ja' } } })
  expect(made.status()).toBe(201)
  for (const [route, change] of [
    // **[#221]** Its four next steps down to one, does-not-apply, the second.
    ['/nodes/full', { op: 'remove-answer', index: 0 }],
    ['/nodes/full', { op: 'remove-answer', index: 1 }],
    ['/nodes/full', { op: 'remove-answer', index: 1 }],
    ['/nodes/full', { path: 'title.nl', value: '' }],
    ['/nodes/full', { path: 'description.nl', value: '' }],
    ['/nodes/full', { path: 'images[0].credit', value: '' }],
    ['/nodes/full', { path: 'images[0].description.nl', value: '' }],
    ['/nodes/does-not-apply', { path: 'terminal.label.nl', value: '' }],
    ['', { path: 'title.nl', value: '' }],
  ] as const) {
    expect((await api('PATCH', route, change)).status(), `${route} ${JSON.stringify(change)}`).toBe(200)
  }
  return ((await made.json()) as { node: { id: string } }).node.id
}

test(`**[#206]** the preview of a hidden Tree and the editor with the preview button never scroll at any viewport of 10.6, in both languages (40.9)`, async ({ browser }) => {
  test.setTimeout(900_000)
  const page = await (await browser.newContext()).newPage()
  const { status, cookie } = await login(page, overlayOrigin, ADMIN_EMAIL, ADMIN_PASSWORD)
  expect(status).toBe(204)
  const fresh = await unfinishedDraft(page, cookie)
  const editorPage = await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD)
  for (const lang of LANGUAGES) {
    const query = lang === 'en' ? '' : '?lang=nl'
    for (const [width, height] of VIEWPORTS) {
      const viewport = `${width}x${height}`
      await page.setViewportSize({ width, height })
      for (const [what, address] of [
        ["the preview of hidden-draft's full Node", `${origin}/admin/preview/hidden-draft/full${query}`],
        ['the preview of the unfinished draft', `${overlayOrigin}/admin/preview/unfinished/full${query}`],
        ["the preview of the unfinished draft's fresh step", `${overlayOrigin}/admin/preview/unfinished/full/opt-two/${fresh}${query}`],
        ["the preview of the unfinished draft's ending", `${overlayOrigin}/admin/preview/unfinished/full/does-not-apply${query}`],
      ] as const) {
        const shown = address.startsWith(origin) ? editorPage : page
        await shown.setViewportSize({ width, height })
        expect((await shown.goto(address))?.status(), address).toBe(200)
        await expect(shown.locator('.preview-back')).toBeVisible()
        record(await measure(shown), what, lang, viewport, '')
        if (!what.endsWith('full Node')) continue
        const sheets = shown.locator('details.overlay')
        for (let i = 0; i < Math.min(await sheets.count(), 2); i += 1) {
          const control = sheets.nth(i).locator(':scope > .sheet-open')
          if (!(await control.isVisible())) continue
          await control.click()
          await expect(sheets.nth(i).locator(':scope > .sheet-panel')).toBeVisible()
          record(await measure(shown), what, lang, viewport, `Overlay ${i + 1}`)
          await shown.keyboard.press('Escape')
          await expect(sheets.nth(i).locator(':scope > .sheet-panel')).toBeHidden()
        }
      }
      // The editor of the hidden Tree with the preview button, on its step that ends: the ending's button as 40.5 draws it.
      await editorPage.setViewportSize({ width, height })
      expect((await editorPage.goto(`${origin}/admin/trees/hidden-draft/full/does-not-apply${query}`))?.status()).toBe(200)
      await expect(editorPage.locator('.preview-button')).toBeVisible()
      record(await measure(editorPage), 'the editor of a hidden Tree with the preview button, a step that ends', lang, viewport, '')
    }
  }
})

/** **[#212]** The sizes at and below the floor #205 measured the notice at (its record, section 6), and one above it in height only. */
const FLOOR_SIZES = [
  [320, 480],
  [320, 700],
  [300, 400],
  [800, 480],
] as const

test('**[#212]** at and below the floor the notice\'s text lines stand clear of every control under the bar, in the editor of a hidden Tree and in its preview, in both languages (10.4, 33.1, 40.5)', async ({ browser }) => {
  const page = await loggedIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD)
  for (const lang of LANGUAGES) {
    const query = lang === 'en' ? '' : '?lang=nl'
    for (const [width, height] of FLOOR_SIZES) {
      const viewport = `${width}x${height}`
      await page.setViewportSize({ width, height })
      for (const [what, address, controls] of [
        ['the editor of a hidden Tree', `/admin/trees/hidden-draft/full${query}`, 3],
        ['the preview of a hidden Tree', `/admin/preview/hidden-draft/full${query}`, 1],
      ] as const) {
        const where = `${what} (${lang}) at ${viewport}`
        expect((await page.goto(`${origin}${address}`))?.status(), where).toBe(200)
        await expect(page.locator('.minimum-size'), where).toBeVisible()
        record(await measure(page), `${what}, the floor's notice`, lang, viewport, '')
        const at = await page.evaluate(() => {
          // Every line box of the notice's text, as the record's section 6 takes them: a Range over it.
          const range = document.createRange()
          range.selectNodeContents(document.querySelector('.minimum-size')!)
          const lines = [...range.getClientRects()].filter((line) => line.width > 0).map((line) => line.toJSON() as DOMRect)
          const controls = [...document.querySelectorAll<HTMLElement>('.editor-float > .sheet > .sheet-open, .preview-button, .preview-back')].map((control) => {
            const box = control.getBoundingClientRect()
            // On top where it stands: the element at its middle is the control or inside it, so the notice does not cover it either.
            const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
            return { name: control.getAttribute('aria-label') ?? control.parentElement!.className, box: box.toJSON() as DOMRect, reachable: !!top && control.contains(top) }
          })
          return { lines, controls }
        })
        const show = (b: DOMRect) => `${b.left}..${b.right} x ${b.top}..${b.bottom}`
        console.log(`${where}: lines ${at.lines.map(show).join(', ')}; controls ${at.controls.map((c) => show(c.box)).join(', ')}`)
        expect(at.lines.length, where).toBeGreaterThan(0)
        expect(at.controls, where).toHaveLength(controls)
        for (const control of at.controls) {
          const b = control.box
          expect(b.left >= 0 && b.right <= width && b.top >= 0 && b.bottom <= height, `${where}: ${control.name} inside the window`).toBe(true)
          expect(control.reachable, `${where}: ${control.name} on top where it stands`).toBe(true)
          const over = at.lines.filter((l) => b.left < l.right && l.left < b.right && b.top < l.bottom && l.top < b.bottom)
          // Soft, so that one run names every size and control that covers the text.
          expect.soft(over.map(show), `${where}: ${control.name} at ${show(b)} over the notice's text`).toEqual([])
        }
      }
      // The public page has no control under the bar, and its notice stays where it stood (35.6).
      expect((await page.goto(`${origin}/ai-act-example/start${query}`))?.status()).toBe(200)
      await expect(page.locator('.minimum-size')).toBeVisible()
      expect(await page.locator('.minimum-size').evaluate((notice) => getComputedStyle(notice).paddingTop), `the public page (${lang}) at ${viewport}`).toBe('24px')
    }
  }
})
