/**
 * **[#172]** The editor's fields after the owner's decisions of #169 (docs/specs/application.md
 * 28.2 and 28.4, amended 2026-10-02): typing stops at a field's limit, and a field's box has
 * the size of its text at the limit where it is drawn, so it neither grows while the creator
 * types nor crosses its parent. Against `tests/fixtures/full-node/` as a hidden draft on a
 * server of this file's own; every count and box goes to `tests/browser/.results/fields.md`.
 * The screenshots the issue asks for go to `docs/screenshots/issue-172/` under
 * `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 *
 * **[#265]** And the description's field on `tests/fixtures/long-full-node/` at 1280 x 640 (43.9,
 * 43.11): empty, at its limit and over it, its box the public box at that size, its counter
 * `600` and `8`, typing that stops at 600 characters and at 8 lines, both its states scrolling
 * inside the box; the whole text autosaved and shown by the public page; and the side bubble's
 * on `tests/fixtures/long-overlay/`. Their screenshots go to `docs/screenshots/issue-265/` under
 * `ELSA_SHOTS=1`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { estimatedLines } from '../../src/tree/measure.ts'
import type { DraftNode } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-172') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 160
/** **[#265]** Its own folder, so that a run for it rewrites no other issue's pictures. */
const SHOTS_265 = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-265') : path.join(RESULTS, 'shots')

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }

/** Ordinary words, so the text wraps as a creator's would; long enough to pass every limit typed here. */
const WORDS = 'The quick brown fox jumps over the lazy dog, then rests a while. '.repeat(10)

let origin: string
const rows: string[] = []

test.beforeAll(async () => {
  const dir = await buildDataDir({
    trees: [
      { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, creator: ANNA.email },
      // **[#265]** The full Node at the new maximum, as a draft and as a published Tree, and the side bubble at it.
      { folder: path.join(repo, 'tests', 'fixtures', 'long-full-node'), id: 'long-draft', hidden: true, creator: ANNA.email },
      { folder: path.join(repo, 'tests', 'fixtures', 'long-full-node'), id: 'long-public' },
      { folder: path.join(repo, 'tests', 'fixtures', 'long-overlay'), id: 'long-overlay', hidden: true, creator: ANNA.email },
    ],
    accounts: [ANNA],
  })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
  await mkdir(SHOTS, { recursive: true })
  await mkdir(SHOTS_265, { recursive: true })
})

test.afterAll(async () => {
  await stopServers()
  await mkdir(RESULTS, { recursive: true })
  await writeFile(path.join(RESULTS, 'fields.md'), [...rows, ''].join('\n'))
})

/** The visible region of one field: the Bubble and its neighbour frames, and the Sources' collapsed copy, hold others (10.5, 11). */
const field = (page: Page, keyPath: string, nodeId = 'full') => page.locator(`[data-field="${nodeId} ${keyPath}"]`).filter({ visible: true })

async function shoot(page: Page, name: string, folder = SHOTS): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(folder, `${name}.png`) })
}

/** Types `text` into a field from empty, key by key, opening a rich field's source first. */
async function typeInto(page: Page, keyPath: string, nodeId: string, text: string): Promise<void> {
  const region = field(page, keyPath, nodeId)
  const rendered = region.locator('.editor-rendered')
  if ((await rendered.count()) > 0) await rendered.click({ position: { x: 2, y: 2 } })
  const area = region.locator('textarea')
  await area.click()
  await area.fill('')
  await page.keyboard.type(text, { delay: 2 })
}

async function editor(page: Page, width: number, height: number): Promise<string> {
  await page.setViewportSize({ width, height })
  const { status, cookie } = await login(page, origin, ANNA.email, ANNA.password)
  expect(status).toBe(204)
  return cookie
}

async function stored(page: Page, cookie: string): Promise<DraftNode> {
  const answer = await page.request.fetch(`${origin}/admin/api/trees/hidden-draft/nodes/full`, { headers: { Origin: origin, Cookie: cookie } })
  return ((await answer.json()) as { node: DraftNode }).node
}

/**
 * Every field on screen whose box is not inside its parent's: the Bubble's text area, an Option
 * button, **[#222]** an Answer button (a next step's words, 41.7 item 2), the Overlay's Interior or
 * a Sheet's panel -- the nearest of them around it -- and, in
 * the Bubble, inside the outline's curve as well (10.1: the Bubble's own border radius, less
 * its 2-pixel outline). A field in a closed page or language section is not on screen. 10.6's
 * tolerance of a pixel.
 */
async function outside(page: Page, where: string): Promise<string[]> {
  await page.evaluate(() => document.fonts.ready)
  const found = await page.evaluate(() => {
    const out: string[] = []
    for (const element of document.querySelectorAll<HTMLElement>('[data-field]')) {
      const box = element.getBoundingClientRect()
      if (box.width === 0 || box.height === 0 || !element.checkVisibility()) continue
      const parent = element.closest('.sheet-panel, .overlay-interior, .sheet-open, .bubble-text, .answer')
      if (!parent) {
        out.push(`${element.dataset.field}: no parent`)
        continue
      }
      const p = parent.getBoundingClientRect()
      const name = `${element.dataset.field} ${Math.round(box.width)}x${Math.round(box.height)} at ${Math.round(box.left)},${Math.round(box.top)}`
      if (box.left < p.left - 1 || box.right > p.right + 1 || box.top < p.top - 1 || box.bottom > p.bottom + 1) {
        out.push(`${name} crosses ${parent.className} ${Math.round(p.width)}x${Math.round(p.height)} at ${Math.round(p.left)},${Math.round(p.top)}`)
      }
      const outline = parent.classList.contains('bubble-text') ? parent.closest('.bubble')! : null
      if (!outline) continue
      const bubble = outline.getBoundingClientRect()
      const radius = Math.min(parseFloat(getComputedStyle(outline).borderTopLeftRadius), bubble.width / 2, bubble.height / 2)
      for (const [x, y] of [[box.left, box.top], [box.right, box.top], [box.left, box.bottom], [box.right, box.bottom]] as const) {
        // The nearest point of the rectangle the corners' circles are centred on.
        const cx = Math.min(Math.max(x, bubble.left + radius), bubble.right - radius)
        const cy = Math.min(Math.max(y, bubble.top + radius), bubble.bottom - radius)
        if (Math.hypot(x - cx, y - cy) > radius - 2 + 1) out.push(`${name} crosses the Bubble's curve at ${Math.round(x)},${Math.round(y)}`)
      }
    }
    return out
  })
  rows.push(`- inside its parent, ${where}: ${found.length === 0 ? 'every field' : found.join('; ')}`)
  return found
}

for (const [width, height] of [
  [1280, 640],
  [390, 844],
] as const) {
  test(`every field of the full Node as a draft lies inside its parent's box, at ${width} x ${height}`, async ({ page }) => {
    await editor(page, width, height)
    const at = `${width}x${height}`
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    expect(await field(page, 'title.en').count()).toBe(1)
    expect(await outside(page, `${at}, the page`)).toEqual([])

    // The description in its source state.
    await field(page, 'description.en').locator('.editor-rendered').click({ position: { x: 2, y: 2 } })
    await expect(field(page, 'description.en').locator('textarea')).toBeFocused()
    expect(await outside(page, `${at}, the description's source`)).toEqual([])

    // Each Source's Sheet: its kind and its link.
    const sourceSheets = page.locator('.source-sheet:not(.source-sheet--add) > .sheet-open').filter({ visible: true })
    for (let index = 0; index < (await sourceSheets.count()); index += 1) {
      await page.goto(`${origin}/admin/trees/hidden-draft/full`)
      await sourceSheets.nth(index).click()
      await expect(field(page, `sources[${index}].url`)).toBeVisible()
      expect(await outside(page, `${at}, Source ${index + 1}'s Sheet`)).toEqual([])
    }

    // Below the guarantee the Sources are one Sheet, where their lines are edited (28.6).
    const collapsed = page.locator('.sources-sheet > .sheet-open').filter({ visible: true })
    if ((await collapsed.count()) > 0) {
      await page.goto(`${origin}/admin/trees/hidden-draft/full`)
      await collapsed.click()
      await expect(field(page, 'sources[0].label.en')).toBeVisible()
      expect(await outside(page, `${at}, the Sources Sheet`)).toEqual([])
    }

    // The explainer Sheet, from the marked term.
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await field(page, 'description.en').locator('.term').first().click()
    await expect(field(page, 'explainers[0].text.en')).toBeVisible()
    expect(await outside(page, `${at}, the explainer Sheet`)).toEqual([])

    // The enlarged view: an Image's description and credit, opened from the main image or, where
    // the main image has gone, from the collapsed strip's `Image 1 of 10` (10.5).
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    const main = page.locator('.bubble .main-image').filter({ visible: true })
    await ((await main.count()) > 0 ? main : page.locator('.carousel-sheet > .sheet-open').filter({ visible: true })).click()
    await expect(field(page, 'images[0].credit')).toBeVisible()
    expect(await outside(page, `${at}, the enlarged view`)).toEqual([])

    // The first Option's Overlay, opened by its address (10.9): where the fan has collapsed, the
    // `What this covers` Sheet lists the Option as a link to it (10.5).
    await page.goto(`${origin}/admin/trees/hidden-draft/full/opt-one`)
    await expect(field(page, 'title.en', 'opt-one')).toBeVisible()
    await expect(field(page, 'description.en', 'opt-one')).toBeVisible()
    expect(await outside(page, `${at}, the first Option's Overlay`)).toEqual([])
  })
}

test('typing past the limit of a title, a description, an Option title and an Image description stores exactly the limit, and the box keeps its height', async ({ page }) => {
  const cookie = await editor(page, 1280, 640)
  await page.goto(`${origin}/admin/trees/hidden-draft/full`)
  const cases = [
    { keyPath: 'title.en', limit: 80, read: (node: DraftNode) => node.title.en! },
    // **[#265]** 600 since elsa-tree/8 (43.9).
    { keyPath: 'description.en', limit: 600, read: (node: DraftNode) => node.description.en! },
    { keyPath: 'options[0].title.en', limit: 60, read: (node: DraftNode) => node.options[0]!.title.en! },
    // An Image's description in the enlarged view (31.3), opened from the main image: its box was one line until its text took two.
    {
      keyPath: 'images[0].description.en',
      limit: 120,
      read: (node: DraftNode) => node.images[0]!.description.en!,
      open: () => page.locator('.bubble .main-image').filter({ visible: true }).click(),
    },
  ]
  for (const { keyPath, limit, read, open } of cases) {
    await open?.()
    const region = field(page, keyPath)
    const rendered = region.locator('.editor-rendered')
    if ((await rendered.count()) > 0) await rendered.click({ position: { x: 2, y: 2 } })
    const area = region.locator('textarea')
    await area.click()
    await area.fill('')
    await expect(area).toHaveValue('')
    await expect(page.getByRole('status')).toContainText(/^Saved \d/)
    const before = (await region.boundingBox())!.height

    // Key by key, as a creator types: a space typed inside the Option's summary once opened its Overlay.
    await page.keyboard.type(WORDS.slice(0, limit + 15), { delay: 5 })
    await expect(area).toHaveValue(WORDS.slice(0, limit))
    // The pill counts as the validator counts (3.8): a space the cut ends on is not counted.
    await expect(page.locator('.editor-pill').filter({ visible: true }).first()).toContainText(`${[...WORDS.slice(0, limit).trim()].length} / ${limit}`)
    const after = (await region.boundingBox())!.height
    await page.keyboard.press('Tab')
    await expect(page.getByRole('status')).toContainText(/^Saved \d/)

    const text = read(await stored(page, cookie))
    rows.push(`- ${keyPath}: typed ${limit + 15} characters, stored ${[...text].length} (limit ${limit}); box ${before} px high before, ${after} after`)
    expect([...text].length).toBe(limit)
    expect(text).toBe(WORDS.slice(0, limit))
    expect(after).toBe(before)
  }
})

test('the screenshots of #172: an empty root, texts at their limits in the Bubble and in an Overlay, the attach Sheet and the top panel', async ({ page }) => {
  test.slow()
  for (const [width, height] of [
    [1280, 640],
    [390, 844],
  ] as const) {
    const cookie = await editor(page, width, height)
    const size = `${width}x${height}`
    // An empty root Node: each field names what belongs in it (28.2, amended).
    const fresh = `fresh-${width}`
    const created = await page.request.fetch(`${origin}/admin/api/trees`, {
      method: 'POST',
      headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
      data: JSON.stringify({ id: fresh, languages: ['en', 'nl'], title: { en: 'Fresh' } }),
    })
    expect(created.status()).toBe(201)
    await page.goto(`${origin}/admin/trees/${fresh}/start`)
    await expect(field(page, 'title.en', 'start').locator('textarea')).toHaveAttribute('placeholder', 'Title')
    await shoot(page, `empty-root-${size}`)

    // A title and a description typed to their limits, in the Bubble and in the first Option's Overlay.
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await typeInto(page, 'title.en', 'full', WORDS.slice(0, 95))
    await typeInto(page, 'description.en', 'full', WORDS.slice(0, 615))
    await expect(field(page, 'description.en').locator('textarea')).toHaveValue(WORDS.slice(0, 600))
    await shoot(page, `bubble-at-limits-${size}`)
    // The Overlay is opened by its address (10.9), at 390 too, where the fan has collapsed; the
    // page is left once the description is stored, so that no write is pending.
    await expect.poll(async () => (await stored(page, cookie)).description.en).toBe(WORDS.slice(0, 600))
    await page.goto(`${origin}/admin/trees/hidden-draft/full/opt-one`)
    await typeInto(page, 'title.en', 'opt-one', WORDS.slice(0, 95))
    await typeInto(page, 'description.en', 'opt-one', WORDS.slice(0, 615))
    await expect(field(page, 'description.en', 'opt-one').locator('textarea')).toHaveValue(WORDS.slice(0, 600))
    await shoot(page, `overlay-at-limits-${size}`)

    // The attach Sheet, after a picture is uploaded into a Terminal's empty slot, with its placeholders.
    await page.goto(`${origin}/admin/trees/hidden-draft/full/applies`)
    const picture = { name: 'covered.png', mimeType: 'image/png', buffer: await readFile(path.join(repo, 'trees', 'ai-act-example', 'images', 'covered.png')) }
    await page.locator('.bubble .editor-picker--slot input[type="file"]').setInputFiles(picture)
    const attach = page.locator('.editor-attach-panel')
    await expect(attach).toBeVisible()
    await shoot(page, `attach-sheet-${size}`)
    // `cancel`, among the Sheet's controls: **[#174]** each field's hint is a button too.
    await attach.locator('.sheet-controls button[type="button"]').click()
    await expect(attach).toHaveCount(0)

    // The top panel.
    await page.goto(`${origin}/admin/trees/hidden-draft/full`)
    await page.locator('.panel-sheet > .sheet-open').click()
    // Its own body: since #176 the to-do bubble's Sheet has a `.panel-body` as well.
    await expect(page.locator('.panel-sheet .panel-body')).toBeVisible()
    await shoot(page, `top-panel-${size}`)
  }
})

/**
 * **[#265]** The visible element that scrolls inside the description's box of the text area
 * `area` selects -- the Bubble's, or an open Overlay's Interior -- and what the text area holds
 * besides: what it is, its height, whether it scrolls and stands at its top or its end, how many
 * pixels of it lie below, and the height of the Sources' block.
 */
async function descriptionBox(
  page: Page,
  area = '.bubble-text',
): Promise<{ tag: string; height: number; scrolls: boolean; top: boolean; end: boolean; below: number; sources: number }> {
  return page.evaluate((area) => {
    const text = [...document.querySelectorAll<HTMLElement>(area)].find((element) => element.checkVisibility() && !element.closest('[inert]'))!
    const box = [...text.querySelectorAll<HTMLElement>('[data-description-box]')].find((element) => element.checkVisibility())!
    return {
      tag: `${box.tagName.toLowerCase()}.${box.className}`,
      height: box.getBoundingClientRect().height,
      scrolls: box.scrollHeight > box.clientHeight + 1,
      top: box.scrollTop === 0,
      end: Math.abs(box.scrollTop + box.clientHeight - box.scrollHeight) <= 1,
      below: box.scrollHeight - box.scrollTop - box.clientHeight,
      sources: text.querySelector(':scope > .sources')?.getBoundingClientRect().height ?? 0,
    }
  }, area)
}

/** **[#265]** The text the public page's description box shows at `address`. */
async function publicText(page: Page, address: string): Promise<string | null> {
  await page.goto(address)
  return page.locator('.bubble [data-description-box]').filter({ visible: true }).evaluate((element) => element.textContent)
}

test('**[#265]** the description’s field at 1280 x 640 is the public box empty, at its limit and over it, stops at 600 characters and 8 lines, and scrolls in both its states (43.9)', async ({ page }) => {
  test.slow()
  await page.setViewportSize({ width: 1280, height: 640 })
  await page.goto(`${origin}/long-public/full`)
  const pub = await descriptionBox(page)
  rows.push(`- [#265] the public box of long-full-node's full Node at 1280x640: ${pub.height} px, ${pub.tag}, scrolls ${pub.scrolls}; the Sources ${pub.sources} px`)
  expect(pub.scrolls).toBe(true)

  const { status, cookie } = await login(page, origin, ANNA.email, ANNA.password)
  expect(status).toBe(204)
  const api = (method: string, route: string, data?: unknown) =>
    page.request.fetch(`${origin}/admin/api/trees/long-draft${route}`, {
      method,
      headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
      data: data === undefined ? undefined : JSON.stringify(data),
    })
  const stored = async (): Promise<string> => ((await (await api('GET', '/nodes/full')).json()) as { node: DraftNode }).node.description.en!
  const original = await stored()
  await page.goto(`${origin}/admin/trees/long-draft/full`)
  const region = field(page, 'description.en')
  const area = region.locator('textarea')
  const pill = page.locator('.editor-pill').filter({ visible: true })
  const open = () => region.locator('.editor-rendered').click({ position: { x: 2, y: 2 } })
  // The public box at its tallest in the room the editor's text area leaves (43.9): the editor
  // draws each Source's label in a box as wide as its 60 characters (28.4), one to a line, where
  // the public page runs the three on in two, and the box yields that line first, as it yields
  // everything (43.2).
  const room = pub.height - ((await descriptionBox(page)).sources - pub.sources)
  const measured = async (what: string) => {
    const box = await descriptionBox(page)
    rows.push(`- [#265] the editor's description field, ${what}: ${box.height} px, ${box.tag}, scrolls ${box.scrolls}, at its top ${box.top}, at its end ${box.end}; the Sources ${box.sources} px`)
    expect(box.height, `${what}: the public box's ${pub.height} less the editor's longer Sources`).toBeCloseTo(room, 0)
    expect((await region.boundingBox())!.height, `${what}: the region`).toBeCloseTo(room, 0)
    return box
  }

  // At its limit, blurred: the rendered text is the box, from its top, and scrolls to its end.
  expect(await measured('at its limit, blurred')).toMatchObject({ tag: 'span.editor-rendered', scrolls: true, top: true })
  await shoot(page, 'bubble-blurred-top', SHOTS_265)
  await region.locator('[data-description-box]').evaluate((element) => element.scrollTo(0, element.scrollHeight))
  expect((await descriptionBox(page)).end).toBe(true)
  await shoot(page, 'bubble-blurred-end', SHOTS_265)

  // Focused: the textarea is the box, the source from its top; a key at its end does nothing,
  // and the caret at the end is in view.
  await open()
  await expect(area).toBeFocused()
  expect(await measured('at its limit, focused')).toMatchObject({ tag: 'textarea.editor-input', scrolls: true, top: true })
  await expect(pill).toHaveText('600 / 6008 / 8')
  await shoot(page, 'bubble-focused-top', SHOTS_265)
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' more', { delay: 5 })
  await expect(area).toHaveValue(original)
  // The browser scrolls just far enough to show the caret's line: less than half a line below.
  expect((await measured('at its limit, focused, its caret at the end')).below).toBeLessThan(12)
  await shoot(page, 'bubble-focused-end', SHOTS_265)

  // Empty, the same box; typed from empty key by key, it stops at 600 characters.
  await area.fill('')
  await expect(page.getByRole('status')).toContainText(/^Saved \d/)
  await measured('empty, focused')
  await page.keyboard.press('Tab')
  await measured('empty, blurred')
  await open()
  await page.keyboard.type(WORDS.slice(0, 615), { delay: 1 })
  await expect(area).toHaveValue(WORDS.slice(0, 600))
  await expect(pill).toHaveText('600 / 6008 / 8')
  expect((await measured('typed to 600 characters')).below).toBeLessThan(12)

  // List items, a line each, reach 8 estimated lines long before 600 characters: the ninth item's
  // first letter would make it a ninth line, so it and the letters after it do nothing.
  const item = '- an item of the list\n'
  await area.fill('')
  await page.keyboard.type(item.repeat(9), { delay: 1 })
  const lines = await area.inputValue()
  expect(estimatedLines(lines)).toBe(8)
  expect(lines.startsWith(item.repeat(8))).toBe(true)
  expect(lines.split('\n').filter((line) => line.startsWith('- an')).length).toBe(8)
  await expect(pill).toContainText('8 / 8')
  await measured('typed to 8 lines')

  // Over its limit by another route (28.4): shown whole and marked in the same box, which scrolls.
  const over = `${original} ${'And one more sentence. '.repeat(3)}`.trim()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('status')).toContainText(/^Saved \d/)
  expect((await api('PATCH', '/nodes/full', { path: 'description.en', value: over })).status()).toBe(200)
  await page.goto(`${origin}/admin/trees/long-draft/full`)
  await expect(region).toHaveClass(/editor-field--over/)
  expect((await measured('over its limit, blurred')).scrolls).toBe(true)
  await open()
  await expect(area).toHaveValue(over)
  expect((await measured('over its limit, focused')).scrolls).toBe(true)

  // The whole text at the limit, written in the field, is autosaved, and the public page shows it whole.
  await area.fill(original)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('status')).toContainText(/^Saved \d/)
  expect(await stored()).toBe(original)
  expect((await api('PUT', '/published', { published: true })).status()).toBe(200)
  const shown = await publicText(page, `${origin}/long-draft/full`)
  expect(shown?.length).toBeGreaterThan(500)
  expect(shown).toBe(await publicText(page, `${origin}/long-public/full`))
})

test('**[#265]** the description’s field in the side bubble at every maximum stops at 600 and scrolls in its box, at 1280 x 640 (43.9)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  const { status } = await login(page, origin, ANNA.email, ANNA.password)
  expect(status).toBe(204)
  await page.goto(`${origin}/admin/trees/long-overlay/five/big`)
  const region = page.locator('details.overlay[open] [data-field="big description.en"]').filter({ visible: true })
  await expect(region).toBeVisible()
  const interior = 'details.overlay[open] .overlay-interior'
  const blurred = await descriptionBox(page, interior)
  rows.push(`- [#265] the side bubble's description field at its limit, blurred: ${blurred.height} px, ${blurred.tag}, scrolls ${blurred.scrolls}`)
  expect(blurred).toMatchObject({ tag: 'span.editor-rendered', top: true })
  await shoot(page, 'overlay-blurred-top', SHOTS_265)
  await region.locator('[data-description-box]').evaluate((element) => element.scrollTo(0, element.scrollHeight))
  await shoot(page, 'overlay-blurred-end', SHOTS_265)

  await region.locator('.editor-rendered').click({ position: { x: 2, y: 2 } })
  const area = region.locator('textarea')
  await expect(area).toBeFocused()
  const value = await area.inputValue()
  await expect(page.locator('.editor-pill').filter({ visible: true })).toHaveText('600 / 6008 / 8')
  const focused = await descriptionBox(page, interior)
  rows.push(`- [#265] the side bubble's description field at its limit, focused: ${focused.height} px, ${focused.tag}, scrolls ${focused.scrolls}`)
  expect(focused).toMatchObject({ tag: 'textarea.editor-input', top: true })
  expect(focused.height).toBeCloseTo(blurred.height, 0)
  await shoot(page, 'overlay-focused-top', SHOTS_265)
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' more', { delay: 5 })
  await expect(area).toHaveValue(value)
  expect((await descriptionBox(page, interior)).below).toBeLessThan(12)
  await shoot(page, 'overlay-focused-end', SHOTS_265)
})
