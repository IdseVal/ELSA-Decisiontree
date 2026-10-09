/**
 * **[#176]** The editor's two floating controls and the account link, in a browser
 * (docs/specs/application.md 24.3, 33.1 to 33.3 and 33.7, amended 2026-10-02;
 * ADR-176-floating-settings-and-to-do): the settings button and the to-do control float under
 * the chrome bar, outside the header element, and cover no part of the Bubble, the up arrow or
 * an Option button on the full Node as a draft; the to-do count follows a write that adds a
 * violation and one that removes it; a to-do line leads to its step; a refused publish points
 * at the to-do bubble; both follow the Sheet's rules and the keyboard reaches them after the
 * bar; at the floor they are icons with names, inside the window; and the link to the account
 * page reads "Account" on every admin page, the account's name its description.
 *
 * Against a data directory of the named accounts of 35.3 on a server of this file's own:
 * `hidden-draft` is the full Node with three Dutch titles emptied -- three things to do -- and
 * `tidy` the full Node as it is, with none. The screenshots the issue asks for go to
 * `docs/screenshots/issue-176/` under `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 *
 * **[#181]** And the focus never stops under the heading of the to-do bubble or the panel (33.2,
 * amended): walked up each with Shift+Tab, under each heading the bubble shows -- `todo-before`,
 * `behind` and `unservable` are the full Node with all thirteen Dutch titles (**[#221]** eleven until its step had four next steps) emptied, hidden, behind
 * its public copy (19.4), and refused at start (18.3) -- in both languages, at the sizes of #181's
 * walk and at 360 x 640.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Locator, type Page } from '@playwright/test'
import { chrome } from '../../src/chrome.ts'
import { ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-176') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 115

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const BRAM = { email: 'bram@example.org', name: 'Bram', password: 'brams first password' }
const ADMIN = { email: 'admin@example.org', name: 'Administrator', password: ADMIN_PASSWORD }

/** The Option targets whose Dutch title is emptied: one advisory V-L10N line each (19.2). */
const EMPTIED = ['opt-one', 'opt-two', 'opt-three']

/** The full Node at a 49-entry Trail, so the up arrow stands above the Bubble (10.2, 10.6). */
const FULL_AT_TRAIL = `/admin/trees/hidden-draft/${Array.from({ length: 50 }, () => 'full').join('/')}`

/** The viewports of 10.6 where the tree view shows; the floor's notice has its own test below. */
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
] as const

/** **[#181]** A Tree per heading of the to-do bubble (33.3), each with thirteen things to do (**[#221]** eleven before the full Node's two new Terminals). */
const HEADED = [
  ['todo-before', 'todoBefore'],
  ['behind', 'publicBehindBecause'],
  ['unservable', 'notServableBecause'],
] as const

/** **[#181]** The sizes of #181's walk, and the smallest of 10.6 the editor shows at. */
const WALKED = [
  [1280, 640],
  [1920, 1080],
  [390, 844],
  [360, 640],
] as const

let origin: string

test.describe.configure({ mode: 'serial' })

/** **[#181]** Every Dutch title of the Tree file `file` emptied, as the editor's write of an empty field leaves it (22.3). */
async function emptyDutchTitles(file: string): Promise<void> {
  const tree = JSON.parse(await readFile(file, 'utf8')) as { nodes: { title: Record<string, string> }[] }
  for (const node of tree.nodes) node.title.nl = ''
  await writeFile(file, JSON.stringify(tree))
}

test.beforeAll(async ({ browser }) => {
  await mkdir(SHOTS, { recursive: true })
  const full = path.join(repo, 'tests', 'fixtures', 'full-node')
  const dir = await buildDataDir({
    trees: [
      { folder: full, id: 'hidden-draft', hidden: true, creator: ANNA.email, collaborators: [BRAM.email] },
      { folder: full, id: 'tidy', hidden: true, creator: ANNA.email },
      { folder: full, id: 'todo-before', hidden: true, creator: ANNA.email },
      { folder: full, id: 'behind', creator: ANNA.email },
      { folder: full, id: 'unservable', creator: ANNA.email },
    ],
    accounts: [ANNA, BRAM],
  })
  // **[#181]** The drafts without their Dutch titles; `unservable`'s public copy too, which the store refuses at start (18.3).
  for (const [id] of HEADED) await emptyDutchTitles(path.join(dir, 'trees', id, 'draft.json'))
  await emptyDutchTitles(path.join(dir, 'trees', 'unservable', 'tree.json'))
  origin = await serveStore(dir, PORT, ADMIN_ENV)
  const { page, cookie } = await loggedIn(browser, ANNA)
  for (const id of EMPTIED) expect((await api(page, cookie, 'PATCH', `/trees/hidden-draft/nodes/${id}`, { path: 'title.nl', value: '' })).status()).toBe(200)
  const entry = (await (await api(page, cookie, 'GET', '/trees/hidden-draft')).json()) as { advisory: { file: string; rule: string; message: string }[] }
  console.log(`hidden-draft's to-do list: ${JSON.stringify(entry.advisory.map((v) => `${v.file} ${v.rule}: ${v.message}`))}`)
  expect(entry.advisory.map((violation) => violation.file)).toEqual(EMPTIED)
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

/** A page logged in as `who`, at 1280 x 640, and the cookie for API calls of its own. */
async function loggedIn(browser: Browser, who: { email: string; password: string }): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  const { status, cookie } = await login(page, origin, who.email, who.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

/** The two controls -- each the summary of a Sheet -- and the panels they open. */
const todoControl = (page: Page) => page.locator('.todo-sheet > .sheet-open')
const todoBubble = (page: Page) => page.locator('.todo-sheet > .sheet-panel')
const settingsControl = (page: Page) => page.locator('.panel-sheet > .sheet-open')
const settingsPanel = (page: Page) => page.locator('.panel-sheet > .sheet-panel')
const publishSwitch = (page: Page) => settingsPanel(page).getByRole('switch', { name: 'Publish' })

/** Opens the to-do bubble and waits for the re-read of the entry it does on opening (33.3). */
async function openTodo(page: Page): Promise<void> {
  const reread = page.waitForResponse((response) => /\/admin\/api\/trees\/[^/]+$/.test(new URL(response.url()).pathname))
  await todoControl(page).click()
  await expect(todoBubble(page)).toBeVisible()
  await reread
}

/** Opens the settings panel and waits for the re-read of the accounts it does on opening (33.4). */
async function openSettings(page: Page): Promise<void> {
  const reread = page.waitForResponse((response) => response.url().endsWith('/admin/api/accounts'))
  await settingsControl(page).click()
  await expect(settingsPanel(page)).toBeVisible()
  await reread
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Where the two controls are, and every box they must stay clear of, as laid out. */
function layout(page: Page) {
  return page.evaluate(() => {
    const boxOf = (element: Element): Box => {
      const rect = element.getBoundingClientRect()
      return { x: Math.round(rect.x * 10) / 10, y: Math.round(rect.y * 10) / 10, w: Math.round(rect.width * 10) / 10, h: Math.round(rect.height * 10) / 10 }
    }
    const shown = (selector: string): Box[] =>
      [...document.querySelectorAll(selector)].map(boxOf).filter((box) => box.w > 0 && box.h > 0)
    const control = (selector: string) => {
      const element = document.querySelector(selector)!
      return { ...boxOf(element), inHeader: element.closest('header') !== null }
    }
    return {
      todo: control('.todo-sheet > .sheet-open'),
      settings: control('.panel-sheet > .sheet-open'),
      header: boxOf(document.querySelector('header')!),
      bubble: shown('.tree-frame .bubble'),
      up: shown('.tree-frame .up-arrow'),
      options: shown('.tree-frame .options > li'),
      window: { w: window.innerWidth, h: window.innerHeight },
    }
  })
}

const overlap = (a: Box, b: Box): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const show = (box: Box): string => `${box.x},${box.y} ${box.w}x${box.h}`

test('the two controls float under the bar, outside the header, inside the window, and cover no part of the Bubble, the up arrow or an Option button', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  for (const lang of ['en', 'nl']) {
    for (const [width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}${FULL_AT_TRAIL}${lang === 'en' ? '' : '?lang=nl'}`)
      await page.evaluate(() => document.fonts.ready)
      const at = await layout(page)
      const where = `${width}x${height} ${lang}`
      console.log(
        `${where}: to-do ${show(at.todo)}, settings ${show(at.settings)} | header ${show(at.header)}, up ${at.up.map(show).join(' ')}, Bubble ${at.bubble.map(show).join(' ')}, ` +
          `Options ${at.options.length ? at.options.map(show).join(' ') : 'collapsed'}`,
      )
      expect(at.up, `${where}: the up arrow is on the page`).toHaveLength(1)
      expect(at.bubble, `${where}: the Bubble is on the page`).toHaveLength(1)
      for (const [name, control] of [['to-do', at.todo], ['settings', at.settings]] as const) {
        expect(control.inHeader, `${where}: the ${name} control is not in the header`).toBe(false)
        expect(control.y, `${where}: the ${name} control is under the bar`).toBeGreaterThanOrEqual(at.header.y + at.header.h)
        expect(control.x, `${where}: the ${name} control is inside the window`).toBeGreaterThanOrEqual(0)
        expect(control.x + control.w, `${where}: the ${name} control is inside the window`).toBeLessThanOrEqual(at.window.w)
        for (const box of [...at.bubble, ...at.up, ...at.options]) {
          expect(overlap(control, box), `${where}: the ${name} control ${show(control)} overlaps ${show(box)}`).toBe(false)
        }
      }
    }
  }
})

test('the to-do control says the count, and follows a write that adds a violation and one that removes it', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await expect(todoControl(page)).toHaveAccessibleName('3 things to do')
  await expect(todoControl(page)).toContainText('3')

  const title = page.locator('[data-field="full title.en"]').filter({ visible: true }).locator('textarea')
  const was = await title.inputValue()
  await title.fill('')
  await title.blur()
  await expect(todoControl(page)).toHaveAccessibleName('4 things to do')
  await title.fill(was)
  await title.blur()
  await expect(todoControl(page)).toHaveAccessibleName('3 things to do')
  await expect(page.getByRole('status')).toContainText(/^Saved/)
})

test('with nothing to do the control is a quiet tick, and its bubble says so', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/tidy/full`)
  await expect(todoControl(page)).toHaveAccessibleName('Nothing to do')
  await expect(todoControl(page).locator('svg')).toBeVisible()
  await expect(todoControl(page)).not.toContainText(/\d/)
  await openTodo(page)
  await expect(todoBubble(page)).toContainText('Nothing to do')
  await expect(todoBubble(page).locator('.todo-list')).toHaveCount(0)
})

test('the to-do bubble lists one line per thing, each a link to its step’s editor page', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await openTodo(page)
  await expect(todoBubble(page).locator('.sheet-close--cross')).toBeFocused()
  await expect(todoBubble(page).getByRole('heading', { level: 2 })).toHaveText('To do before publishing:')
  const lines = todoBubble(page).locator('.todo-list li')
  await expect(lines).toHaveCount(3)
  console.log(`the to-do bubble's lines: ${JSON.stringify(await lines.allTextContents())}`)
  for (const [index, id] of EMPTIED.entries()) await expect(lines.nth(index).locator('a')).toHaveAttribute('href', `/admin/trees/hidden-draft/${id}`)
  await lines.first().locator('a').click()
  await expect(page).toHaveURL(`${origin}/admin/trees/hidden-draft/opt-one`)
})

test('the settings panel holds the Publish switch and no to-do list; a refused publish points at the to-do bubble', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  await expect(settingsControl(page)).toHaveAccessibleName('Decision-tree settings: Hidden')
  await openSettings(page)
  await expect(settingsPanel(page).getByRole('heading', { level: 2 })).toHaveText('Decision-tree settings')
  await expect(settingsPanel(page).locator('.todo-list')).toHaveCount(0)

  await publishSwitch(page).click()
  const pointer = settingsPanel(page).getByRole('alert')
  await expect(pointer).toContainText('Not published')
  await expect(publishSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await shoot(page, 'publish-refused-1280x640')
  expect((await page.request.get(`${origin}/hidden-draft/full`)).status()).toBe(404)

  await pointer.getByRole('button', { name: 'See what to do' }).click()
  await expect(settingsPanel(page)).toBeHidden()
  await expect(todoBubble(page)).toBeVisible()
  await expect(todoBubble(page).locator('.sheet-close--cross')).toBeFocused()
  await expect(todoBubble(page).locator('.todo-list li')).toHaveCount(3)
  await page.keyboard.press('Escape')
  await expect(todoBubble(page)).toBeHidden()
  await expect(todoControl(page)).toBeFocused()
})

test('both follow the Sheet rules -- Escape, the cross, a click outside, focus in and back, one open at a time -- and the keyboard reaches them after the bar', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.goto(`${origin}${FULL_AT_TRAIL}`)
  await page.locator('header').getByRole('button', { name: 'Log out' }).focus()
  // **[#206]** On a hidden Tree the preview button comes first after the bar, the band's left end (40.5).
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Preview', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(todoControl(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(settingsControl(page)).toBeFocused()

  for (const [control, panel] of [
    [todoControl, todoBubble],
    [settingsControl, settingsPanel],
  ] as const) {
    await control(page).focus()
    await page.keyboard.press('Enter')
    await expect(panel(page)).toBeVisible()
    await expect(panel(page).locator('.sheet-close--cross')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel(page)).toBeHidden()
    await expect(control(page)).toBeFocused()

    await control(page).click()
    await panel(page).locator('.sheet-close--cross').click()
    await expect(panel(page)).toBeHidden()
    await expect(control(page)).toBeFocused()

    await control(page).click()
    await expect(panel(page)).toBeVisible()
    await page.mouse.click(320, 320)
    await expect(panel(page)).toBeHidden()
  }

  // One open at a time: each closes the other, and an Overlay, as every Sheet does (10.5).
  await todoControl(page).click()
  await settingsControl(page).focus()
  await page.keyboard.press('Enter')
  await expect(settingsPanel(page)).toBeVisible()
  await expect(todoBubble(page)).toBeHidden()
  await page.keyboard.press('Escape')
  const overlay = page.locator('details.overlay').first()
  await overlay.locator(':scope > .sheet-open .option-image').click()
  await expect(overlay.locator(':scope > .sheet-panel')).toBeVisible()
  await todoControl(page).focus()
  await page.keyboard.press('Enter')
  await expect(todoBubble(page)).toBeVisible()
  await expect(overlay.locator(':scope > .sheet-panel')).toBeHidden()
})

test('at the floor, 320 x 480, both are icons with their names, inside the window, and each opens inside it', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  await page.setViewportSize({ width: 320, height: 480 })
  await page.goto(`${origin}${FULL_AT_TRAIL}`)
  await expect(page.locator('.minimum-size')).toBeVisible()
  await expect(todoControl(page)).toHaveAccessibleName('3 things to do')
  await expect(settingsControl(page)).toHaveAccessibleName('Decision-tree settings: Hidden')
  await expect(settingsControl(page).getByText('Decision-tree settings')).toBeHidden()
  const at = await layout(page)
  console.log(`320x480: to-do ${show(at.todo)}, settings ${show(at.settings)}, header ${show(at.header)}`)
  for (const control of [at.todo, at.settings]) {
    expect(control.x).toBeGreaterThanOrEqual(0)
    expect(control.x + control.w).toBeLessThanOrEqual(320)
    expect(control.y).toBeGreaterThanOrEqual(at.header.y + at.header.h)
  }
  for (const [open, panel] of [
    [openTodo, todoBubble],
    [openSettings, settingsPanel],
  ] as const) {
    await open(page)
    const box = (await panel(page).boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(320)
    expect(box.y + box.height).toBeLessThanOrEqual(480)
    await page.keyboard.press('Escape')
  }
})

test('the link to the account page reads "Account" on every admin page, the account’s name its description; "Accounts" and "Log out" stay', async ({ browser }) => {
  const anna = await loggedIn(browser, ANNA)
  const admin = await loggedIn(browser, ADMIN)
  const pages: [Page, string, string, string][] = [
    [anna.page, '/admin', 'Account', ANNA.name],
    [anna.page, '/admin/new', 'Account', ANNA.name],
    [anna.page, '/admin/account', 'Account', ANNA.name],
    [anna.page, '/admin/trees/hidden-draft/full', 'Account', ANNA.name],
    [anna.page, '/admin?lang=nl', 'Account', ANNA.name],
    [anna.page, '/admin/trees/hidden-draft/full?lang=nl', 'Account', ANNA.name],
    [admin.page, '/admin/accounts', 'Account', ADMIN.name],
    [admin.page, '/admin/trees/hidden-draft/full', 'Account', ADMIN.name],
  ]
  for (const [page, address, word, name] of pages) {
    await page.goto(`${origin}${address}`)
    const bar = page.locator('header')
    const link = bar.getByRole('link', { name: word, exact: true })
    await expect(link, address).toHaveAttribute('href', address.endsWith('?lang=nl') ? '/admin/account?lang=nl' : '/admin/account')
    await expect(link, address).toHaveAccessibleDescription(name)
    await expect(bar.getByRole('link', { name, exact: true }), address).toHaveCount(0)
    await expect(bar.getByRole('button', { name: address.endsWith('?lang=nl') ? 'Uitloggen' : 'Log out' }), address).toBeVisible()
  }
  await admin.page.goto(`${origin}/admin`)
  await expect(admin.page.locator('header').getByRole('link', { name: 'Accounts', exact: true })).toHaveAttribute('href', '/admin/accounts')
})

test('screenshots: the editor at rest, the to-do bubble open, the settings panel open, and the creators’ overview’s bar, at 1280 x 640 and 390 x 844', async ({ browser }) => {
  const { page } = await loggedIn(browser, ANNA)
  for (const [width, height] of [
    [1280, 640],
    [390, 844],
  ] as const) {
    const size = `${width}x${height}`
    await page.setViewportSize({ width, height })
    await page.goto(`${origin}${FULL_AT_TRAIL}`)
    await expect(todoControl(page)).toHaveAccessibleName('3 things to do')
    await shoot(page, `editor-at-rest-${size}`)
    await openTodo(page)
    await shoot(page, `todo-bubble-${size}`)
    await page.keyboard.press('Escape')
    await openSettings(page)
    await shoot(page, `settings-panel-${size}`)
    await page.keyboard.press('Escape')
    await page.goto(`${origin}/admin`)
    await expect(page.locator('.tile--new')).toBeVisible()
    await shoot(page, `creators-overview-${size}`)
  }
})

/** **[#181]** Where the control with the focus lies, against the heading of its Sheet and the view of its scroll box; null outside the box. */
function focused(page: Page) {
  return page.evaluate(() => {
    const control = document.activeElement
    const body = control?.closest('.panel-body')
    if (!control || !body || control === body) return null
    const round = (n: number): number => Math.round(n * 10) / 10
    const rect = control.getBoundingClientRect()
    const heading = body.closest('.sheet-panel')!.querySelector('.panel-heading')!.getBoundingClientRect()
    const view = body.getBoundingClientRect()
    return {
      name: `${control.tagName.toLowerCase()} "${(control.getAttribute('aria-label') ?? control.textContent ?? '').trim().slice(0, 24)}"`,
      top: round(rect.top),
      bottom: round(rect.bottom),
      headingBottom: round(heading.bottom),
      headingLines: Math.round((heading.height - 40) / 24),
      viewTop: round(view.top),
      viewBottom: round(view.bottom),
      scrolled: body.scrollTop,
    }
  })
}

/**
 * **[#181]** Puts the focus on the last control of `sheet`'s scroll box and walks it up with
 * Shift+Tab to the first: each control the focus reaches lies below the heading and inside the
 * box's view, as far as the box scrolled it. Answers the walk, for the log.
 */
async function walkFocusUp(page: Page, sheet: Locator, where: string): Promise<string> {
  await sheet.locator('.panel-body').evaluate((body) => {
    const controls = [...body.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled)')]
    controls.filter((control) => control.getClientRects().length > 0).at(-1)!.focus()
  })
  let steps = 0
  let deepest = 0
  let lines = 0
  for (let at = await focused(page); at; at = await focused(page)) {
    const said = `${where}: ${at.name} at ${at.top} to ${at.bottom}, scrolled ${at.scrolled}`
    expect.soft(at.top, `${said}, under the heading, which ends at ${at.headingBottom}`).toBeGreaterThanOrEqual(at.headingBottom - 0.5)
    expect.soft(at.top, `${said}, above the box's view from ${at.viewTop}`).toBeGreaterThanOrEqual(at.viewTop - 0.5)
    expect.soft(at.bottom, `${said}, below the box's view to ${at.viewBottom}`).toBeLessThanOrEqual(at.viewBottom + 0.5)
    steps += 1
    deepest = Math.max(deepest, at.scrolled)
    lines = at.headingLines
    expect(steps, `${where}: the focus walked up without leaving the box`).toBeLessThan(200)
    await page.keyboard.press('Shift+Tab')
  }
  expect(steps, `${where}: the focus reached no control`).toBeGreaterThan(0)
  return `${where}: heading of ${lines} line${lines === 1 ? '' : 's'}, ${steps} controls, scrolled to ${deepest}`
}

test('[#181] the focus never stops under the heading of the to-do bubble or the settings panel: walked up with Shift+Tab under every heading, in both languages, at the walk’s sizes and at 360 x 640', async ({
  browser,
}) => {
  test.setTimeout(240_000)
  const { page } = await loggedIn(browser, ANNA)
  const walked: string[] = []
  for (const lang of ['en', 'nl'] as const) {
    const ui = chrome(lang)
    for (const [width, height] of WALKED) {
      await page.setViewportSize({ width, height })
      for (const [id, heading] of HEADED) {
        await page.goto(`${origin}/admin/trees/${id}/full${lang === 'en' ? '' : '?lang=nl'}`)
        await openTodo(page)
        await expect(todoBubble(page).getByRole('heading', { level: 2 })).toHaveText(ui[heading])
        await expect(todoBubble(page).locator('.todo-list li')).toHaveCount(13)
        walked.push(await walkFocusUp(page, todoBubble(page), `${lang} ${width}x${height}, the to-do bubble under ${heading}`))
        await page.keyboard.press('Escape')
      }
      await openSettings(page)
      walked.push(await walkFocusUp(page, settingsPanel(page), `${lang} ${width}x${height}, the settings panel`))
      await page.keyboard.press('Escape')
    }
  }
  console.log(walked.join('\n'))
})
