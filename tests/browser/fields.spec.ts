/**
 * **[#172]** The editor's fields after the owner's decisions of #169 (docs/specs/application.md
 * 28.2 and 28.4, amended 2026-10-02): typing stops at a field's limit, and a field's box has
 * the size of its text at the limit where it is drawn, so it neither grows while the creator
 * types nor crosses its parent. Against `tests/fixtures/full-node/` as a hidden draft on a
 * server of this file's own; every count and box goes to `tests/browser/.results/fields.md`.
 * The screenshots the issue asks for go to `docs/screenshots/issue-172/` under
 * `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import type { DraftNode } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-172') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 160

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }

/** Ordinary words, so the text wraps as a creator's would; long enough to pass every limit typed here. */
const WORDS = 'The quick brown fox jumps over the lazy dog, then rests a while. '.repeat(3)

let origin: string
const rows: string[] = []

test.beforeAll(async () => {
  const dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, creator: ANNA.email }],
    accounts: [ANNA],
  })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
  await mkdir(SHOTS, { recursive: true })
})

test.afterAll(async () => {
  await stopServers()
  await mkdir(RESULTS, { recursive: true })
  await writeFile(path.join(RESULTS, 'fields.md'), [...rows, ''].join('\n'))
})

/** The visible region of one field: the Bubble and its neighbour frames, and the Sources' collapsed copy, hold others (10.5, 11). */
const field = (page: Page, keyPath: string, nodeId = 'full') => page.locator(`[data-field="${nodeId} ${keyPath}"]`).filter({ visible: true })

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
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
 * button, the Overlay's Interior or a Sheet's panel -- the nearest of them around it -- and, in
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
      const parent = element.closest('.sheet-panel, .overlay-interior, .sheet-open, .bubble-text')
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
    { keyPath: 'description.en', limit: 150, read: (node: DraftNode) => node.description.en! },
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
    await expect(page.locator('.editor-pill').first()).toContainText(`${[...WORDS.slice(0, limit).trim()].length} / ${limit}`)
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
    await typeInto(page, 'description.en', 'full', WORDS.slice(0, 165))
    await expect(field(page, 'description.en').locator('textarea')).toHaveValue(WORDS.slice(0, 150))
    await shoot(page, `bubble-at-limits-${size}`)
    // The Overlay is opened by its address (10.9), at 390 too, where the fan has collapsed; the
    // page is left once the description is stored, so that no write is pending.
    await expect.poll(async () => (await stored(page, cookie)).description.en).toBe(WORDS.slice(0, 150))
    await page.goto(`${origin}/admin/trees/hidden-draft/full/opt-one`)
    await typeInto(page, 'title.en', 'opt-one', WORDS.slice(0, 95))
    await typeInto(page, 'description.en', 'opt-one', WORDS.slice(0, 165))
    await expect(field(page, 'description.en', 'opt-one').locator('textarea')).toHaveValue(WORDS.slice(0, 150))
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
