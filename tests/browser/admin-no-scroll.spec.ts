/**
 * The no-scroll rule over the admin area's pages (docs/specs/application.md 10.6, 35.4;
 * ADR-133-editor-testing): 10.6's exact test at its ten viewports, in both chrome languages,
 * on the pages #135 builds -- the login page, the 403 page, the account page, and the
 * accounts page with more accounts than its box shows, plain and with each of its Sheets
 * open. The accounts list is a `[data-scroll-box]`, the exemption 10.6 names for it; the
 * document never scrolls.
 *
 * The measurement is 10.6's, written out here rather than imported: `no-scroll.spec.ts` is
 * a public spec this round does not edit (35.6), and a spec file cannot be imported without
 * running its tests. Every row goes to `tests/browser/.results/admin-no-scroll.md`.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
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
  origin = await serveStore(await buildDataDir({ trees: [], accounts: ACCOUNTS }), PORT, ADMIN_ENV)
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
      if (el.matches('[data-scroll-box], [data-clamp]')) continue
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
}
