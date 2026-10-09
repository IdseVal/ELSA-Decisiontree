/**
 * **[#178]** The step's two buttons, in a browser (docs/specs/application.md 30.6 and 30.8,
 * amended 2026-10-02; ADR-178-step-buttons): in place of the step menu, a red cross on every
 * step but the first -- named "Delete this step" for a screen reader and on hover -- which asks
 * once, naming the step's title as it stands, and deletes after one confirmation, landing on the
 * parent, whose slot is free again; and on a step that ends the tree "Tree does not end here after
 * all", which gives the three structure buttons back. No element of a link menu or of the step
 * menu's `...` exists on a step with both Answers and Options. The two buttons cover no part of
 * the up arrow, the Bubble, an Option button or the floating controls at the top right, at every
 * viewport of 10.6 where the tree view shows and on both sides of the band's breakpoints, in both
 * chrome languages.
 *
 * Against the full Node's Tree, with a first step put above the full Node through the API, so that
 * the full Node -- both Answers and eight Options -- is a step under a Trail, with its cross. The
 * screenshots the issue asks for go to `docs/screenshots/issue-178/` under `ELSA_SHOTS=1`, the
 * results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Page } from '@playwright/test'
import type { DraftNode } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-178') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 175

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const TREE = 'hidden-draft'

/**
 * The viewports of 10.6 where the tree view shows, and both sides of each breakpoint the band
 * has: 1000 wide, where the floating controls take their words and the cross goes left of the
 * arrow; 640 tall, where the arrow goes onto the outline and the band is 26; 480 wide, where a
 * phone's band is 40 and the ending's words take two lines; and the narrowest window above the
 * floor's notice. The floor itself is its own test below.
 */
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
  [1000, 700],
  [999, 700],
  [1000, 639],
  [999, 639],
  [480, 640],
  [480, 639],
  [479, 639],
  [321, 481],
  [321, 700],
] as const

let origin: string
/** The first step, put above the full Node in `beforeAll`. */
let top = ''

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  await mkdir(SHOTS, { recursive: true })
  const full = path.join(repo, 'tests', 'fixtures', 'full-node')
  const dir = await buildDataDir({ trees: [{ folder: full, id: TREE, hidden: true, creator: ANNA.email }], accounts: [ANNA] })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
  const { page, cookie } = await loggedIn(browser)
  // A Node is made from a parent's Link (22.4): made under an aside, pointed at the full Node,
  // unhung from the aside, and made the root, it stands above the full Node.
  const made = await api(page, cookie, 'POST', `/trees/${TREE}/nodes`, { from: { node: 'opt-two', link: 'answer', label: {} } })
  expect(made.status()).toBe(201)
  top = ((await made.json()) as { node: DraftNode }).node.id
  for (const [route, change] of [
    [`/nodes/${top}`, { op: 'set-answer', answer: 'yes', target: 'full' }],
    ['/nodes/opt-two', { op: 'remove-answer', answer: 'yes' }],
    [`/nodes/${top}`, { path: 'title.en', value: 'The first step' }],
    [`/nodes/${top}`, { path: 'title.nl', value: 'De eerste stap' }],
    ['', { path: 'root', value: top }],
  ] as const) {
    expect((await api(page, cookie, 'PATCH', `/trees/${TREE}${route}`, change)).status(), `${route} ${JSON.stringify(change)}`).toBe(200)
  }
  await page.context().close()
})

test.afterAll(async () => {
  await stopServers()
})

/** A request as the editor's script sends it: this origin, the session cookie, JSON. */
function api(page: Page, cookie: string, method: string, route: string, data?: unknown): Promise<APIResponse> {
  return page.request.fetch(`${origin}/admin/api${route}`, {
    method,
    headers: { Origin: origin, Cookie: cookie, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    data: data === undefined ? undefined : JSON.stringify(data),
  })
}

/** A page logged in as Anna, at 1280 x 640, and the cookie for API calls of its own. */
async function loggedIn(browser: Browser): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  const { status, cookie } = await login(page, origin, ANNA.email, ANNA.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function nodeOf(page: Page, cookie: string, id: string): Promise<DraftNode> {
  const response = await api(page, cookie, 'GET', `/trees/${TREE}/nodes/${id}`)
  expect(response.status(), `GET ${id}`).toBe(200)
  return ((await response.json()) as { node: DraftNode }).node
}

/** The editor's address of the path of Node ids `ids`, in `lang`. */
const editor = (ids: string[], lang = 'en') => `${origin}/admin/trees/${TREE}/${ids.join('/')}${lang === 'en' ? '' : `?lang=${lang}`}`
/** The full Node, under the first step: both Answers and eight Options. */
const fullNode = (lang = 'en') => editor([top, 'full'], lang)
/** The full Node's No, a step that ends the tree. */
const ending = (lang = 'en') => editor([top, 'full', 'does-not-apply'], lang)

const cross = (page: Page) => page.locator('.step-delete')
const endButton = (page: Page) => page.locator('.step-end > button')

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

test('on a step with both Answers and Options no element of a link menu or of the step menu’s `...` exists; the Sources keep their own', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  for (const lang of ['en', 'nl']) {
    await page.goto(fullNode(lang))
    await expect(cross(page)).toBeVisible()
    const counts = await page.evaluate(() => ({
      linkMenus: document.querySelectorAll('[class*="link-menu"], .structure-form--link, .structure-picker').length,
      stepMenus: document.querySelectorAll('[class*="step-menu"], .structure-form--step').length,
      // Every control of the page that says `...`, the Sources' own Sheets aside (out of #178's scope).
      dots: [...document.querySelectorAll('summary, button')].filter((control) => control.textContent?.trim() === '…' && !control.closest('.source-sheet')).length,
      sourceDots: document.querySelectorAll('.source-sheet:not(.source-sheet--add) > .sheet-open').length,
      answers: document.querySelectorAll('.tree-frame .answers > .answer--yes, .tree-frame .answers > .answer--no').length,
      options: document.querySelectorAll('.tree-frame .options > li').length,
    }))
    console.log(`${lang}, the full Node under a Trail: ${JSON.stringify(counts)}`)
    const { sourceDots, ...rest } = counts
    expect(rest).toEqual({ linkMenus: 0, stepMenus: 0, dots: 0, answers: 2, options: 8 })
    expect(sourceDots).toBeGreaterThan(0)
  }
})

test('the red cross: named "Delete this step" for a screen reader and on hover, absent on the first step; it asks once, naming the title, and Escape or Cancel keep the step', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor([top]))
  await expect(page.locator(`.bubble[data-node="${top}"]`)).toBeVisible()
  await expect(cross(page)).toHaveCount(0)
  await expect(endButton(page)).toHaveCount(0)

  await page.goto(fullNode())
  const button = page.getByRole('button', { name: 'Delete this step' })
  await expect(button).toHaveCount(1)
  await expect(button).toHaveAttribute('title', 'Delete this step')
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  // No ending here, so no ending's button.
  await expect(endButton(page)).toHaveCount(0)

  await button.click()
  const question = page.getByRole('alertdialog')
  await expect(question).toHaveAccessibleName('Delete "The full Node: a title of exactly eighty characters, the most it may be The ful."? What it led to stays.')
  await expect(question.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(question).toHaveCount(0)
  await expect(button).toBeFocused()

  await button.click()
  await question.getByRole('button', { name: 'Cancel' }).click()
  await expect(question).toHaveCount(0)
  await expect(button).toBeFocused()
  // A click on the veil keeps the step too.
  await button.click()
  await page.mouse.click(5, 300)
  await expect(question).toHaveCount(0)
  expect((await nodeOf(page, cookie, 'full')).options).toHaveLength(8)

  await page.goto(fullNode('nl'))
  await page.getByRole('button', { name: 'Deze stap verwijderen' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('" verwijderen? Waar die heen leidde blijft.')
})

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** The step's buttons and every box they must stay clear of, as laid out. */
function layout(page: Page) {
  return page.evaluate(() => {
    const boxOf = (element: Element): Box => {
      const rect = element.getBoundingClientRect()
      return { x: Math.round(rect.x * 10) / 10, y: Math.round(rect.y * 10) / 10, w: Math.round(rect.width * 10) / 10, h: Math.round(rect.height * 10) / 10 }
    }
    const shown = (selector: string): Box[] => [...document.querySelectorAll(selector)].map(boxOf).filter((box) => box.w > 0 && box.h > 0)
    return {
      cross: shown('.tree-frame .step-delete'),
      words: shown('.tree-frame .step-end > button'),
      up: shown('.tree-frame .up-arrow'),
      bubble: shown('.tree-frame .bubble'),
      options: shown('.tree-frame .options > li'),
      floating: shown('.editor-float > .sheet > .sheet-open'),
      header: boxOf(document.querySelector('header')!),
      window: { w: window.innerWidth, h: window.innerHeight },
    }
  })
}

const overlap = (a: Box, b: Box): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const show = (box: Box): string => `${box.x},${box.y} ${box.w}x${box.h}`

test('the two buttons stand beside the up arrow, under the bar, inside the window, and cover no part of the up arrow, the Bubble, an Option button or the floating controls, at every size above the floor', async ({ browser }) => {
  test.slow()
  const { page } = await loggedIn(browser)
  for (const lang of ['en', 'nl']) {
    for (const [width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height })
      for (const [what, address, buttons] of [
        ['a question step', fullNode(lang), 1],
        ['a step that ends', ending(lang), 2],
      ] as const) {
        await page.goto(address)
        await page.evaluate(() => document.fonts.ready)
        const at = await layout(page)
        const where = `${width}x${height} ${lang}, ${what}`
        const step = [...at.cross, ...at.words]
        console.log(
          `${where}: cross ${at.cross.map(show).join(' ')}${at.words.length ? `, ending's button ${at.words.map(show).join(' ')}` : ''} | up ${at.up.map(show).join(' ')}, ` +
            `Bubble ${at.bubble.map(show).join(' ')}, floating ${at.floating.map(show).join(' ')}, Options ${at.options.length || 'collapsed'}`,
        )
        expect(step, `${where}: the step's buttons`).toHaveLength(buttons)
        expect(at.up, `${where}: the up arrow`).toHaveLength(1)
        expect(at.floating, `${where}: the floating controls`).toHaveLength(2)
        const [arrow] = at.up
        for (const box of step) {
          expect(box.y, `${where}: ${show(box)} under the bar`).toBeGreaterThanOrEqual(at.header.y + at.header.h)
          expect(box.x, `${where}: ${show(box)} inside the window`).toBeGreaterThanOrEqual(0)
          expect(box.x + box.w, `${where}: ${show(box)} inside the window`).toBeLessThanOrEqual(at.window.w)
          // Beside the arrow: level with some of it.
          expect(box.y < arrow!.y + arrow!.h && arrow!.y < box.y + box.h, `${where}: ${show(box)} beside the arrow ${show(arrow!)}`).toBe(true)
          for (const other of [...at.up, ...at.bubble, ...at.options, ...at.floating]) {
            expect(overlap(box, other), `${where}: ${show(box)} overlaps ${show(other)}`).toBe(false)
          }
        }
        if (step.length === 2) expect(overlap(step[0]!, step[1]!), `${where}: the two buttons overlap`).toBe(false)
      }
    }
  }
})

test('at the floor, 320 x 480, the notice stands in for the tree view, and the step’s buttons with it', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  await page.setViewportSize({ width: 320, height: 480 })
  await page.goto(ending())
  await expect(page.locator('.minimum-size')).toBeVisible()
  await expect(cross(page)).toBeHidden()
  await expect(endButton(page)).toBeHidden()
})

test('screenshots: a question step with its red cross and no dots on its yes, no and side-bubble buttons; a step that ends with both buttons; the confirmation; at 1280 x 640 and 390 x 844', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  for (const [width, height] of [
    [1280, 640],
    [390, 844],
  ] as const) {
    const size = `${width}x${height}`
    await page.setViewportSize({ width, height })
    await page.goto(fullNode())
    await expect(cross(page)).toBeVisible()
    await shoot(page, `question-step-${size}`)
    await cross(page).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await shoot(page, `confirmation-${size}`)
    await page.keyboard.press('Escape')
    await page.goto(ending())
    await expect(endButton(page)).toBeVisible()
    await shoot(page, `step-that-ends-${size}`)
  }
})

test('the question names the title as it stands: one typed a moment before, or none yet', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(ending())
  const title = page.locator('[data-field="does-not-apply title.en"] textarea')
  const was = await title.inputValue()
  const question = page.getByRole('alertdialog')
  await title.fill('An ending')
  await cross(page).click()
  await expect(question.locator('.structure-confirm')).toHaveText('Delete "An ending"? What it led to stays.')
  await page.keyboard.press('Escape')
  await title.fill('')
  await cross(page).click()
  await expect(question.locator('.structure-confirm')).toHaveText('Delete this step? It has no title yet. What it led to stays.')
  await page.keyboard.press('Escape')
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/does-not-apply`, { path: 'title.en', value: was })).status()).toBe(200)
})

test('"Tree does not end here after all" gives the three structure buttons back at once; the cross stays', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(ending())
  await expect(page.locator('.answer--start-again')).toBeVisible()
  await page.getByRole('button', { name: 'Tree does not end here after all' }).click()
  await expect(page.locator('.structure--yes')).toHaveText('+ Yes')
  await expect(page.locator('.structure-end > .sheet-open')).toHaveText('Tree ends here')
  await expect(page.locator('.structure--no')).toHaveText('+ No')
  await expect(page.locator('.answer--start-again')).toBeHidden()
  await expect(endButton(page)).toHaveCount(0)
  await expect(page.locator('[data-field="does-not-apply terminal.label.en"]')).toHaveCount(0)
  await expect(cross(page)).toBeVisible()
  const node = await nodeOf(page, cookie, 'does-not-apply')
  expect(node.kind).toBe('explanation')
  expect(node.label).toBeUndefined()
})

test('the cross deletes after one confirmation and lands on the parent, whose yes is free again', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor([top, 'full', 'applies']))
  await cross(page).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm' }).click()
  await page.waitForURL(fullNode())
  await expect(page.locator('.answer--yes')).toHaveCount(0)
  await expect(page.locator('.structure--yes')).toHaveClass(/structure--lone/)
  await expect(page.locator('.structure--yes')).toHaveText('+ Yes')
  expect((await api(page, cookie, 'GET', `/trees/${TREE}/nodes/applies`)).status()).toBe(404)
  expect((await nodeOf(page, cookie, 'full')).answers).toEqual({ no: 'does-not-apply' })
})
