/**
 * The no-scroll rule over the admin area's pages (docs/specs/application.md 10.6, 35.4;
 * ADR-133-editor-testing): 10.6's exact test at its ten viewports, in both chrome languages,
 * on the pages #135 builds -- the login page, the 403 page, the account page, and the
 * accounts page with more accounts than its box shows, plain and with each of its Sheets
 * open. The accounts list is a `[data-scroll-box]`, the exemption 10.6 names for it; the
 * document never scrolls. **[#137]** And the creators' overview with sixteen tiles and the
 * + tile, and the new-Tree form with three languages, whose boxes are two more carriers.
 * **[#138]** And the editor on `hidden-draft`'s full Node in `en` and `nl` (28.6, 35.4):
 * plain, with the Overlay of the first Options open, with the description in its source
 * state, with a Source's Sheet open, and with the session Sheet. **[#140]** And the enlarged
 * view as the Image's editor, and the attach Sheet. **[#174]** And each of their information
 * hints open, and the strip's `+` with its label shown, beside no strip and beside a full one.
 *
 * The measurement is 10.6's, written out here rather than imported: `no-scroll.spec.ts` is
 * a public spec this round does not edit (35.6), and a spec file cannot be imported without
 * running its tests. Every row goes to `tests/browser/.results/admin-no-scroll.md`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'
import { ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
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

/** Twenty accounts with the longest name 20.1 allows among them: more rows than the box holds. */
const ACCOUNTS = [
  { login: 'cees', name: 'Cees', password: 'cees first password' },
  ...Array.from({ length: 19 }, (_ignored, index) => ({
    login: `creator-${index + 1}`,
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

test.beforeAll(async () => {
  origin = await serveStore(await buildDataDir({ trees: TREES, accounts: ACCOUNTS }), PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
  await mkdir(RESULTS, { recursive: true })
  await writeFile(
    path.join(RESULTS, 'admin-no-scroll.md'),
    ['| page | lang | viewport | Sheet open | document h/inner h | document w/inner w | overflowing elements |', '|---|---|---|---|---|---|---|', ...rows, ''].join('\n'),
  )
})

/** 10.6's numbers on the laid-out page, once its fonts have settled. */
async function measure(page: Page): Promise<Measured> {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const name = (el: Element): string => `${el.tagName.toLowerCase()}${[...el.classList].map((c) => `.${c}`).join('')}`
    const overflowing: string[] = []
    for (const el of document.querySelectorAll('*')) {
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
  })
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
    await everywhere(await loggedIn(browser, 'cees', 'cees first password'), '/admin/accounts', '403 page', lang, 403)
  })

  test(`the account page, ${lang}, never scrolls at any viewport of 10.6`, async ({ browser }) => {
    await everywhere(await loggedIn(browser, 'cees', 'cees first password'), '/admin/account', 'account page', lang, 200)
  })

  test(`the accounts page with twenty-one accounts, ${lang}, never scrolls at any viewport of 10.6`, async ({ browser }) => {
    test.slow()
    await everywhere(await loggedIn(browser, 'admin', ADMIN_PASSWORD), '/admin/accounts', 'accounts page', lang, 200)
  })

  test(`the creators' overview with sixteen tiles and the + tile, ${lang}, never scrolls at any viewport of 10.6`, async ({ browser }) => {
    test.slow()
    const page = await loggedIn(browser, 'admin', ADMIN_PASSWORD)
    await everywhere(page, '/admin', "creators' overview", lang, 200)
    await expect(page.locator('.tile')).toHaveCount(TREES.length + 1)
  })

  test(`the new-Tree form with three languages, ${lang}, never scrolls at any viewport of 10.6`, async ({ browser }) => {
    test.slow()
    const page = await loggedIn(browser, 'cees', 'cees first password')
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
      await page.keyboard.press('Escape')
      await expect(sheets.nth(i).locator(':scope > .sheet-panel')).toBeHidden()
    }

    // **[#142]** The top panel (33.2): its body is a scroll box, the document does not scroll.
    const panel = page.locator('.panel-sheet')
    await panel.locator(':scope > .sheet-open').click()
    await expect(panel.locator(':scope > .sheet-panel')).toBeVisible()
    record(await measure(page), 'editor', lang, viewport, 'top panel')
    await page.keyboard.press('Escape')
    await expect(panel.locator(':scope > .sheet-panel')).toBeHidden()
  }
}

for (const lang of LANGUAGES) {
  test(`the editor on the full Node, ${lang}, never scrolls at any viewport of 10.6, in every state (28.6)`, async ({ browser }) => {
    test.slow()
    await editorEverywhere(await loggedIn(browser, 'admin', ADMIN_PASSWORD), lang)
  })
}

/**
 * **[#139]** The structure's Sheets (30) at every viewport (28.6): on an explanation Node that
 * is the centre, the end Sheet, the fan's `+` on each of its pages, and the step menu; on the
 * full Node, an Answer's and an Option's link menu, the picker included. Each is opened, measured
 * and closed with Escape, which also puts its form back on its first page.
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
  for (const [width, height] of VIEWPORTS) {
    const viewport = `${width}x${height}`
    await page.setViewportSize({ width, height })
    expect((await page.goto(`${origin}/admin/trees/hidden-draft/opt-three${query}`))?.status()).toBe(200)
    await expect(page.locator('main')).toBeVisible()
    record(await measure(page), 'editor, structure', lang, viewport, '')
    await open(page.locator('.structure-end > .sheet-open'), 'end Sheet', viewport)
    const side = page.locator('.options > li.options-add > .side-add > .sheet-open')
    const sideForm = page.locator('.structure-form--side').filter({ visible: true })
    await open(side, 'side-bubble Sheet', viewport)
    await open(side, 'side-bubble Sheet, new title', viewport, () => sideForm.locator('.admin-submit').first().click())
    await open(side, 'side-bubble Sheet, picker', viewport, () => sideForm.locator('.admin-submit').nth(1).click())
    await open(page.locator('.step-menu > .sheet-open'), 'step menu', viewport, () => page.locator('.structure-form--step .admin-submit').first().click())

    expect((await page.goto(`${origin}/admin/trees/hidden-draft/full${query}`))?.status()).toBe(200)
    await expect(page.locator('main')).toBeVisible()
    const linkForm = page.locator('.structure-form--link').filter({ visible: true })
    await open(page.locator('.link-menu--yes > .sheet-open'), 'link menu, Answer', viewport)
    await open(page.locator('.link-menu--yes > .sheet-open'), 'link menu, Answer, picker', viewport, () => linkForm.locator('.admin-submit').first().click())
    await open(page.locator('.link-menu--option > .sheet-open').first(), 'link menu, Option', viewport)
    await open(page.locator('.link-menu--option > .sheet-open').first(), 'link menu, Option, picker', viewport, () => linkForm.locator('.admin-submit').first().click())
  }
}

for (const lang of LANGUAGES) {
  test(`the structure's Sheets, ${lang}, never scroll at any viewport of 10.6 (30, 28.6)`, async ({ browser }) => {
    test.slow()
    await structureEverywhere(await loggedIn(browser, 'admin', ADMIN_PASSWORD), lang)
  })
}

/**
 * **[#140]** The picture Sheets (31.2, 31.3): the enlarged view as the Image's editor, on the
 * full Node's main image, and the attach Sheet after an upload into the empty slot of a
 * Terminal, cancelled again so the draft is as it was. **[#174]** Each with every information
 * hint open in turn, and the strip's `+` with its label shown: beside no strip, and beside the
 * widest strip, on an explanation Node given nine pictures, where the label has the least room.
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
  await expect(page.locator('.carousel > .editor-picker-label')).toBeVisible()
  record(await measure(page), 'editor', lang, viewport, what)
  await page.mouse.move(0, 0)
}
for (const lang of LANGUAGES) {
  test(`the editor's picture Sheets, ${lang}, never scroll at any viewport of 10.6 (31.2, 31.3)`, async ({ browser }) => {
    test.slow()
    const page = await loggedIn(browser, 'admin', ADMIN_PASSWORD)
    const query = lang === 'en' ? '' : '?lang=nl'
    const picture = { name: 'covered.png', mimeType: 'image/png', buffer: await readFile(path.join(repo, 'trees', 'ai-act-example', 'images', 'covered.png')) }
    // One picture on the other Terminal, for the strip's `+` beside no strip; the nl run finds it there.
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}/admin/trees/hidden-draft/full/does-not-apply`)
    const slot = page.locator('.bubble .editor-picker--slot')
    if ((await slot.count()) > 0) {
      await slot.locator('input[type="file"]').setInputFiles(picture)
      await page.locator('.editor-attach-panel input').first().fill('Drawing: ELSA lab')
      await page.locator('.editor-attach-panel button[type="submit"]').click()
      await expect(page.locator('.carousel > .editor-picker--strip')).toBeVisible()
    }
    // [#174] Nine pictures on an explanation Node: a strip at its widest, and the `+` after it.
    const widest = `${origin}/admin/api/trees/hidden-draft/nodes/opt-one`
    // The request context keeps no `Secure` cookie on plain http: the session travels in the header (admin.ts).
    const { cookie } = await login(page, origin, 'admin', ADMIN_PASSWORD)
    const headers = { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }
    const pictures = ((await (await page.request.get(widest, { headers })).json()) as { node: { images: unknown[] } }).node.images.length
    for (const file of ['two.png', 'three.png', 'four.png', 'five.png', 'six.png', 'seven.png', 'eight.png', 'nine.png'].slice(pictures - 1)) {
      const added = await page.request.patch(widest, { headers, data: JSON.stringify({ op: 'add-image', file, credit: 'Drawing: ELSA lab', description: { en: file } }) })
      expect(added.status(), file).toBe(200)
    }
    for (const [width, height] of VIEWPORTS) {
      const viewport = `${width}x${height}`
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}/admin/trees/hidden-draft/full/does-not-apply${query}`)
      if (await page.locator('.carousel > .editor-picker--strip').isVisible()) record(await measure(page), 'editor', lang, viewport, 'strip +')
      await plusLabel(page, lang, viewport, 'strip +, its label')
      await page.goto(`${origin}/admin/trees/hidden-draft/opt-one${query}`)
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
    const page = await loggedIn(browser, 'admin', ADMIN_PASSWORD)
    await page.setViewportSize({ width, height })
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await page.context().clearCookies()
    const title = page.locator('[data-field="full title.en"] textarea')
    await title.click()
    await title.press('End')
    await title.type('!')
    await expect(page.getByRole('dialog')).toBeVisible()
    record(await measure(page), 'editor', 'en', `${width}x${height}`, 'session Sheet')
  }
})
