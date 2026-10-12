/**
 * **[#234]** The slide in the editor, in a real browser (docs/specs/application.md 42.8, 42.10;
 * ADR-231-slide-in-the-editor):
 *
 * - Each next step's button of a step of two, three, four and five -- in the editor's row, with
 *   its `+` while there are fewer than five -- slides toward where it stands, at 1280 x 640 and at
 *   999 x 640, where three to five buttons stand in two rows; the up arrow retraces it. The table
 *   of `docs/research/issue-230-slide-direction.md`, measured on this build in the editor, is
 *   written to `tests/browser/.results/editor-slides.md`.
 * - The browser's back slides the step down reversed, and the page it reaches then shows the
 *   draft's latest accepted write, not the framework's cached copy.
 * - A title typed and a next step's button clicked within 600 ms: the title is saved before the
 *   navigation, and the page after the slide shows it.
 * - A click on a next step's words or on its move arrows does not slide.
 * - While the queue retries a failed write, a next step's button does not slide: it is the plain
 *   link it is, and the browser's `beforeunload` question asks.
 * - A write failing, or the session expiring, while a slide waits undoes the slide: the layer at
 *   rest, nothing navigating.
 * - A second click while a slide waits does nothing: the first slide's navigation follows.
 * - `prefers-reduced-motion: reduce` removes the motion and keeps the navigation, after the save.
 *
 * Every test signs in as the administrator, whose Trees these are, on a store of this file's own.
 */
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { arrived } from './arrived.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const PORT = BASE_PORT + 234
const fixture = (name: string) => path.join(repo, 'tests', 'fixtures', name)

/** The steps whose every button is slid from: two (the example Tree's), three, four and five next steps. */
const STEPS = [
  { count: 2, url: '/admin/trees/ai-act-example/start/prohibited-practices' },
  { count: 3, url: '/admin/trees/three-next-steps/full' },
  { count: 4, url: '/admin/trees/full-node/full' },
  { count: 5, url: '/admin/trees/five-next-steps/full' },
] as const
/** The guarantee, and the first width at which a row of three to five buttons stands in two rows (42.3). */
const WINDOWS = [
  [1280, 640],
  [999, 640],
] as const
/** A step of three next steps, its own copy for each test that edits it, so the slides above are not moved. */
const EDITED = (tree: string) => `/admin/trees/${tree}/full`

let origin: string
/** The session, for the API reads a test makes itself (`login`). */
let cookie: string

test.beforeAll(async () => {
  const trees = [
    { folder: path.join(repo, 'trees', 'ai-act-example') },
    { folder: fixture('three-next-steps') },
    { folder: fixture('full-node') },
    { folder: fixture('five-next-steps') },
    ...['typed', 'back', 'arrows', 'retrying', 'failing', 'expiring', 'twice', 'still'].map((id) => ({ folder: fixture('three-next-steps'), id })),
  ]
  origin = await serveStore(await buildDataDir({ trees, accounts: [] }), PORT, ADMIN_ENV)
})

test.afterAll(stopServers)

test.beforeEach(async ({ page }) => {
  const session = await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
  expect(session.status).toBe(204)
  cookie = session.cookie
})

/** The centre's Answer row, outside the inert neighbour frames of a slide. */
const row = (page: Page) => page.locator('.tree-frame:not([aria-hidden]) .answers')
/** The row's buttons in order: the next steps and the editor's `+` (42.3, 42.7). */
const buttons = (page: Page) => row(page).locator(':scope > .answer--next, :scope > .structure-add')
const nextStep = (page: Page, index: number) => row(page).locator(':scope > .answer--next').nth(index)
const upArrow = (page: Page) => page.locator('.tree-frame:not([aria-hidden]) .up-arrow')
const titleField = (page: Page) => page.locator('[data-field="full title.en"] textarea')

/**
 * Clicks a next step's button on its own outline, 4 pixels inside its top edge: the middle of the
 * button is its words' field, and a click there is the field's (41.7 item 2, 42.8).
 */
async function clickButton(page: Page, index: number): Promise<void> {
  const box = (await nextStep(page, index).boundingBox())!
  await nextStep(page, index).click({ position: { x: box.width / 2, y: 4 } })
}

/** Whether a slide started on this page since `watchSlides`: the layer marked `data-sliding` at any moment. */
async function watchSlides(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen = window as unknown as { slid: boolean }
    seen.slid = false
    new MutationObserver(() => {
      if (document.querySelector('.tree-layer[data-sliding]')) seen.slid = true
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-sliding'], childList: true })
  })
}
const slid = (page: Page) => page.evaluate(() => (window as unknown as { slid: boolean }).slid)

/** The page payloads the client navigation fetches, by path, from now on. */
function navigations(page: Page): string[] {
  const seen: string[] = []
  page.on('request', (request) => {
    if (request.headers()['rsc'] === '1') seen.push(new URL(request.url()).pathname)
  })
  return seen
}

/**
 * Where the slide a click starts is heading: the translation, in pixels, the tree layer ends the
 * first half of the slide at. The target's payload is held back, so the page's own animation is
 * the one read, then let through (as `transition.spec.ts` reads the public page's).
 */
async function slideOf(page: Page, click: () => Promise<void>, href: string): Promise<{ x: number; y: number }> {
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/*', async (route) => {
    if (route.request().headers()['rsc'] === '1') await held
    await route.continue()
  })
  await click()
  const away = await page.waitForFunction(() => {
    const frames = document.querySelector('.tree-layer')?.getAnimations()[0]?.effect
    return frames instanceof KeyframeEffect ? String(frames.getKeyframes().at(-1)?.transform) : null
  })
  const [, x, y] = (await away.jsonValue())!.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/)!.map(Number)
  release()
  await arrived(page, href)
  await page.unroute('**/*')
  return { x: x!, y: y! }
}

/** The arriving slide's first frame, which a history step starts from: where the layer stands when the page it left is still in view. */
async function arrivingFrom(page: Page): Promise<{ x: number; y: number }> {
  const from = await page.waitForFunction(() => {
    const frames = document.querySelector('.tree-layer[data-sliding]')?.getAnimations()[0]?.effect
    return frames instanceof KeyframeEffect ? String(frames.getKeyframes()[0]?.transform) : null
  })
  const [, x, y] = (await from.jsonValue())!.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/)!.map(Number)
  return { x: x!, y: y! }
}

/** A page's own URL from the `href` a control carries. */
const absolute = (page: Page, href: string) => new URL(href, page.url()).href

test.describe("each next step's button slides toward where it stands in the editor's row, and the up arrow retraces it (42.5, 42.8)", () => {
  test.beforeAll(async () => {
    await mkdir(RESULTS, { recursive: true })
    await writeFile(
      path.join(RESULTS, 'editor-slides.md'),
      '| Next steps | Buttons in the row | Viewport | Button | Across (px) | Down (px) | In buttons | The reader goes (across, down) | Layer widths | Side | Up arrow (across, down) |\n|---|---|---|---|---|---|---|---|---|---|---|\n',
    )
  })

  for (const { count, url } of STEPS) {
    test(`a step of ${count}: at ${WINDOWS.map(([w, h]) => `${w} x ${h}`).join(' and ')}`, async ({ page }) => {
      test.slow()
      const lines: string[] = []
      const k = count < 5 ? count + 1 : count
      for (const [width, height] of WINDOWS) {
        await page.setViewportSize({ width, height })
        await page.goto(`${origin}${url}`)
        await expect(buttons(page)).toHaveCount(k)
        // What slides: each next step's button, and the up arrow where the step has a parent; not the `+` (42.8).
        const parent = (await upArrow(page).count()) > 0
        await expect(page.locator('.tree-frame:not([aria-hidden]) [data-slide]')).toHaveCount(count + (parent ? 1 : 0))
        await expect(row(page).locator(':scope > .structure-add [data-slide]')).toHaveCount(0)
        for (let i = 0; i < count; i += 1) {
          const where = `button ${i + 1} of ${count} at ${width} x ${height}`
          await page.goto(`${origin}${url}`)
          // Where it stands: its middle against its own row's, counted in buttons -- a button's
          // width and the gap across -- from the boxes the page drew, the `+` among them.
          const boxes = await buttons(page).evaluateAll((all) => all.map((button) => button.getBoundingClientRect().toJSON() as DOMRect))
          const top = (await row(page).boundingBox())!.y
          const box = boxes[i]!
          const mates = boxes.filter((other) => Math.abs(other.top - box.top) < 1)
          const pitch = boxes[1]!.left - boxes[0]!.left
          const middleOfRow = (mates[0]!.left + mates.at(-1)!.right) / 2
          const across = box.left + box.width / 2 - middleOfRow
          const inButtons = Math.round((across / pitch) * 2) / 2
          const layer = (await page.locator('.tree-layer').boundingBox())!.width

          const href = absolute(page, (await nextStep(page, i).getAttribute('href'))!)
          const down = await slideOf(page, () => clickButton(page, i), href)
          const back = absolute(page, (await upArrow(page).getAttribute('href'))!)
          const up = await slideOf(page, () => upArrow(page).click(), back)
          // The layer moves opposite the reader, so the reader goes to the slide negated.
          const goes = { x: -down.x, y: -down.y }
          expect(Math.abs(across - inButtons * pitch), `${where}: stands a whole or half button from its row's middle`).toBeLessThan(1)
          // `+ 0`: a button in the middle and its straight slide are signs of 0, never -0.
          expect(Math.sign(Math.round(goes.x)) + 0, `${where}: slides to the side it stands on`).toBe(Math.sign(inButtons) + 0)
          expect(goes.x, `${where}: as far across as it stands, in layer widths`).toBeCloseTo(inButtons * layer, 0)
          expect(goes.y, `${where}: down`).toBeGreaterThan(0)
          expect(up.x, `${where}: the up arrow retraces it across`).toBeCloseTo(-down.x, 0)
          expect(up.y, `${where}: and up`).toBeCloseTo(-down.y, 0)
          const side = inButtons === 0 ? 'middle, straight down' : inButtons < 0 ? 'left, to the left' : 'right, to the right'
          lines.push(
            `| ${count} | ${k} | ${width} x ${height} | ${i + 1} of ${count} | ${Math.round(across)} | ${Math.round(box.top - top)} | ${inButtons} | ${Math.round(goes.x)}, ${Math.round(goes.y)} | ${+(goes.x / layer).toFixed(2)} | ${side} | ${Math.round(-up.x)}, ${Math.round(-up.y)} |`,
          )
        }
      }
      await appendFile(path.join(RESULTS, 'editor-slides.md'), `${lines.join('\n')}\n`)
    })
  }
})

test.describe('the autosave and the slide (29.2, 29.5, 42.8)', () => {
  test("a title typed and a next step's button clicked within 600 ms: the title is written before the navigation, and the page after the slide shows it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${EDITED('typed')}`)
    // A slow write: the navigation must wait for its answer, not merely start after it.
    await page.route('**/admin/api/trees/**', async (route) => {
      if (route.request().method() === 'PATCH') await new Promise((resolve) => setTimeout(resolve, 800))
      await route.continue()
    })
    const order: string[] = []
    page.on('response', (response) => {
      if (response.request().method() === 'PATCH') order.push('write answered')
    })
    page.on('request', (request) => {
      if (request.headers()['rsc'] === '1') order.push('navigation')
    })
    const typed = 'Typed just before the click'
    await titleField(page).fill('')
    await titleField(page).pressSequentially(typed, { delay: 2 })
    const typedAt = Date.now()
    const href = absolute(page, (await nextStep(page, 0).getAttribute('href'))!)
    await clickButton(page, 0)
    // The click came well inside the field's 600 ms (29.1).
    expect(Date.now() - typedAt).toBeLessThan(600)
    await arrived(page, href)

    expect(order.slice(0, 2), 'the write is answered before the navigation fetches anything').toEqual(['write answered', 'navigation'])
    const saved = await page.request.get(`${origin}/admin/api/trees/typed/nodes/full`, { headers: { Origin: origin, Cookie: cookie } })
    expect(((await saved.json()) as { node: { title: { en: string } } }).node.title.en).toBe(typed)
    // The page after the slide was drawn from the draft with the title in it: its up arrow names it (10.2).
    await expect(upArrow(page)).toHaveAccessibleName(new RegExp(typed))
  })

  test("the browser's back slides the step down reversed, and the page it reaches shows the draft's latest accepted write", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    const parent = `${origin}${EDITED('back')}`
    await page.goto(parent)
    const typed = 'Written before the step down'
    await titleField(page).fill(typed)
    await titleField(page).blur()
    await expect(page.getByRole('status')).toContainText('Saved')
    // The framework holds the page as it was first drawn; a step down and back must not show that copy.
    const child = absolute(page, (await nextStep(page, 1).getAttribute('href'))!)
    const down = await slideOf(page, () => clickButton(page, 1), child)
    const refreshes = navigations(page)

    await page.goBack()
    const from = await arrivingFrom(page)
    await arrived(page, parent)
    // Back starts where the step down ended: the same path, backwards (11.3).
    expect(from.x, 'back starts across where the step down ended').toBeCloseTo(down.x, 0)
    expect(from.y, 'and as far down').toBeCloseTo(down.y, 0)
    await expect(titleField(page)).toHaveValue(typed)
    // Read again once the slide had ended (`router.refresh()`): the page's own payload, fetched anew.
    expect(refreshes).toContain(new URL(parent).pathname)
  })

  test("a click on a next step's words or on its move arrows does not slide", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    const here = `${origin}${EDITED('arrows')}`
    await page.goto(here)
    await watchSlides(page)
    const words = nextStep(page, 0).locator('textarea')
    const before = await words.inputValue()
    await words.click()
    await expect(words).toBeFocused()
    await page.waitForTimeout(700)
    expect(page.url()).toBe(here)
    expect(await slid(page), 'a click on the words').toBe(false)

    await nextStep(page, 0).getByRole('button', { name: 'Move later' }).click()
    await expect(nextStep(page, 1).locator('textarea')).toHaveValue(before)
    await page.waitForTimeout(700)
    expect(page.url()).toBe(here)
    expect(await slid(page), 'a click on a move arrow').toBe(false)
  })

  test("while the queue retries a failed write, a next step's button is the plain link it is: no slide, and the browser asks before the page goes", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    const here = `${origin}${EDITED('retrying')}`
    await page.goto(here)
    await page.route('**/admin/api/trees/**', (route) => (route.request().method() === 'PATCH' ? route.fulfill({ status: 503, body: '' }) : route.continue()))
    await titleField(page).fill('Not written yet')
    await titleField(page).blur()
    await expect(page.getByRole('status')).toContainText('retrying')
    await watchSlides(page)
    const asked: string[] = []
    page.once('dialog', (dialog) => {
      asked.push(dialog.type())
      void dialog.dismiss()
    })
    await clickButton(page, 0)
    await expect.poll(() => asked).toEqual(['beforeunload'])
    // Staying, as the creator chose: the page and what it holds are still there.
    expect(page.url()).toBe(here)
    expect(await slid(page)).toBe(false)
    await expect(titleField(page)).toHaveValue('Not written yet')
  })

  for (const [tree, status, shows] of [
    ['failing', 503, 'retrying'],
    ['expiring', 401, null],
  ] as const) {
    test(`a ${status} while a slide waits for the write undoes the slide: the layer at rest, nothing navigating`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 640 })
      const here = `${origin}${EDITED(tree)}`
      await page.goto(here)
      let answer = () => {}
      const held = new Promise<void>((resolve) => (answer = resolve))
      await page.route('**/admin/api/trees/**', async (route) => {
        if (route.request().method() !== 'PATCH') return route.continue()
        await held
        await route.fulfill({ status, body: '' })
      })
      const fetched = navigations(page)
      await titleField(page).fill('Typed, then the click')
      await clickButton(page, 2)
      // The slide starts at once, and holds while the write is out (42.8).
      await expect(page.locator('.tree-layer[data-sliding]')).toHaveCount(1)
      answer()
      await expect(page.locator('.tree-layer[data-sliding]')).toHaveCount(0)
      await expect(page.locator('.tree-layer')).toHaveCSS('transform', 'none')
      await page.waitForTimeout(500)
      expect(page.url()).toBe(here)
      expect(fetched, 'no page payload fetched').toEqual([])
      if (shows) await expect(page.getByRole('status')).toContainText(shows)
      else await expect(page.locator('.editor-session [role="dialog"]')).toBeVisible()
    })
  }

  test('a second click while a slide waits does nothing: the first slide is the one that navigates', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${EDITED('twice')}`)
    let answer = () => {}
    const held = new Promise<void>((resolve) => (answer = resolve))
    await page.route('**/admin/api/trees/**', async (route) => {
      if (route.request().method() === 'PATCH') await held
      await route.continue()
    })
    const first = absolute(page, (await nextStep(page, 0).getAttribute('href'))!)
    await titleField(page).fill('Typed, then two clicks')
    await clickButton(page, 0)
    await expect(page.locator('.tree-layer[data-sliding]')).toHaveCount(1)
    // The frame it slides to is the preview's drawing of the step: no field, no `+` (42.8, 40.2).
    await expect(page.locator('.tree-frame[aria-hidden] .answers')).toHaveCount(1)
    await expect(page.locator('.tree-frame[aria-hidden] [data-field], .tree-frame[aria-hidden] .structure-add, .tree-frame[aria-hidden] .answer-move')).toHaveCount(0)
    // The layer is moving, so the second button is clicked where it is in the document.
    await nextStep(page, 1).evaluate((link: HTMLElement) => link.click())
    answer()
    await arrived(page, first)
    await page.waitForTimeout(700)
    expect(page.url()).toBe(first)
  })

  test('with prefers-reduced-motion the layer never moves, and the navigation follows the save', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${EDITED('still')}`)
    await page.evaluate(() => {
      const seen: string[] = ((window as unknown as { transforms: string[] }).transforms = [])
      const tick = () => {
        const layer = document.querySelector('.tree-layer')
        if (layer) seen.push(getComputedStyle(layer).transform)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    const typed = 'Saved with no motion'
    await titleField(page).fill(typed)
    const href = absolute(page, (await nextStep(page, 1).getAttribute('href'))!)
    await clickButton(page, 1)
    await arrived(page, href)
    await expect(upArrow(page)).toHaveAccessibleName(new RegExp(typed))
    await page.goBack()
    await arrived(page, `${origin}${EDITED('still')}`)
    await page.waitForTimeout(700)
    expect([...new Set(await page.evaluate(() => (window as unknown as { transforms: string[] }).transforms))]).toEqual(['none'])
  })
})
