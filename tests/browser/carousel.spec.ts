/**
 * The Carousel in a real browser (docs/specs/application.md section 12, issue #43): which
 * image files the browser asks for, what previous and next do, whether a keyboard alone
 * moves, enlarges and closes, what the row collapses to below the guaranteed height and in
 * what order by width, what
 * a reader without JavaScript gets, and the screenshots the issue owes. What the markup
 * says is `tests/views.test.tsx`; whether it fits is `no-scroll.spec.ts`.
 *
 * The Tree is `tests/fixtures/carousel/`: `five` carries five Images, more than the strip's
 * page of four; `two` carries two; `long` carries a credit of the format's maximum 120
 * characters; `done` carries one that no other page may ask for.
 *
 * The requests each test records are written to `tests/browser/.results/carousel-requests.md`,
 * so the pull request pastes the lists rather than describes them. Screenshots go to the
 * gitignored results folder unless `ELSA_SHOTS=1` asks for the tracked set in
 * `docs/screenshots/issue-43/`, the convention of `tree-view.spec.ts`.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { openTree } from '../../src/tree/loader.ts'
import { picturesByNode, readEveryCredit } from './credits.ts'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-43')
    : path.join(RESULTS, 'shots')

/** Clear of playwright.config.ts's, theme.spec.ts's and no-scroll.spec.ts's ports. */
const PORT = BASE_PORT + 30

const FIVE = '/carousel/five'
const TWO = `${FIVE}/two`
const FIVE_FILES = ['orchard.svg', 'greenhouse.svg', 'drone.svg', 'tractor.svg', 'harbour.svg']

let origin: string
const recorded: string[] = []

test.beforeAll(async () => {
  const started = await serve(path.join(repo, 'tests', 'fixtures'), 'carousel', PORT)
  expect(started, 'the carousel fixture is a valid Tree').not.toBeNull()
  origin = started!
})

test.afterAll(async () => {
  stopServers()
  await mkdir(RESULTS, { recursive: true })
  await writeFile(path.join(RESULTS, 'carousel-requests.md'), `${recorded.join('\n')}\n`)
})

/** Every image file the browser asked the server for while `act` ran, in the order asked. */
async function imageRequests(page: Page, act: () => Promise<unknown>): Promise<string[]> {
  const asked: string[] = []
  const listen = (request: { url: () => string }): void => {
    const match = /\/images\/([^?]+)/.exec(request.url())
    if (match?.[1]) asked.push(match[1])
  }
  page.on('request', listen)
  try {
    await act()
    // Give a lazy image that came into view its chance to be requested.
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)
  } finally {
    page.off('request', listen)
  }
  return asked
}

/** One line of the table the pull request pastes. */
function record(where: string, step: string, asked: string[]): void {
  if (recorded.length === 0) recorded.push('| where | step | image files requested |', '|---|---|---|')
  recorded.push(`| ${where} | ${step} | ${asked.length === 0 ? '(none)' : asked.join(', ')} |`)
}

/** The caption on the line under the strip: the one of the selected Image (12.2). */
function caption(page: Page) {
  return page.locator('.carousel-caption:visible')
}

test.describe('the image files', () => {
  test('a Node with five Images: its own files on load, nothing more after next or on enlarging, and no other Node\'s', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    const where = 'five Images, 1280 x 640'

    const onLoad = await imageRequests(page, () => page.goto(`${origin}${FIVE}`))
    record(where, 'load', onLoad)
    // Only this Node's files, each once. Chromium's lazy loading fetches the whole strip: its
    // distance threshold is wider than ten thumbnails, and 12.4 allows the thumbnails "at and
    // near the visible page". No file of `two` or `done`, which the Answers lead to (11.4).
    expect([...onLoad].sort()).toEqual([...FIVE_FILES].sort())
    await expect(page.locator('.carousel-position')).toHaveText('Image 1 of 5')

    const onNext = await imageRequests(page, async () => {
      await page.locator('.carousel-next').click()
      await expect(page.locator('.carousel-position')).toHaveText('Image 5 of 5')
    })
    record(where, 'next', onNext)
    expect(onNext).toEqual([])

    const onEnlarge = await imageRequests(page, async () => {
      await page.locator('.thumbnail').nth(4).click()
      await expect(page.locator('.carousel-sheet .sheet-figure img')).toHaveAttribute('src', '/images/harbour.svg')
    })
    record(where, 'enlarge Image 5', onEnlarge)
    expect(onEnlarge).toEqual([])
  })

  test('below the guaranteed height the strip is not on the page, and an Image is fetched when the Sheet shows it', async ({ page }) => {
    // 10.5, step 2: the row is one control; the thumbnails have no box and are never fetched.
    await page.setViewportSize({ width: 1280, height: 600 })
    const where = 'five Images, 1280 x 600 (collapsed)'

    const onLoad = await imageRequests(page, () => page.goto(`${origin}${FIVE}`))
    record(where, 'load', onLoad)
    expect(onLoad).toEqual([])

    const control = page.locator('.carousel-sheet .sheet-open')
    const onOpen = await imageRequests(page, async () => {
      await control.click()
      await expect(page.locator('.carousel-sheet .sheet-figure img')).toHaveAttribute('src', '/images/orchard.svg')
    })
    record(where, 'open the control', onOpen)
    expect(onOpen).toEqual(['orchard.svg'])

    const onNext = await imageRequests(page, async () => {
      await page.locator('.carousel-sheet .sheet-controls button', { hasText: 'Next' }).click()
      await expect(page.locator('.carousel-sheet .sheet-figure img')).toHaveAttribute('src', '/images/greenhouse.svg')
    })
    record(where, 'next in the Sheet', onNext)
    expect(onNext).toEqual(['greenhouse.svg'])
  })
})

test.describe('previous and next', () => {
  test('scroll the strip a page, move the selection to the first Image the page brings, and are disabled at the ends', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${FIVE}`)
    const previous = page.getByRole('button', { name: 'Previous' })
    const next = page.getByRole('button', { name: 'Next' })
    const strip = page.locator('[data-carousel-strip]')

    await expect(previous).toBeDisabled()
    await expect(next).toBeEnabled()
    await expect(caption(page)).toHaveText('An orchard of three apple trees under a yellow sun — Drawing: Example Studio, CC0 1.0', { useInnerText: true })
    await expect(page.locator('.thumbnail').nth(4)).not.toBeInViewport({ ratio: 1 })

    await next.click()
    await expect(page.locator('.carousel-position')).toHaveText('Image 5 of 5')
    await expect(page.locator('.thumbnail').nth(4)).toBeInViewport({ ratio: 1 })
    await expect(caption(page)).toContainText('Drawing: Example Cartography, public domain')
    await expect(next).toBeDisabled()
    await expect(previous).toBeEnabled()
    expect(await strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)

    await previous.click()
    await expect(page.locator('.carousel-position')).toHaveText('Image 1 of 5')
    await expect(previous).toBeDisabled()
    expect(await strip.evaluate((el) => el.scrollLeft)).toBe(0)
  })

  test('on a Node whose Images fit the strip, both are disabled and a click selects and enlarges', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${TWO}`)
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
    await expect(page.locator('.carousel-position')).toHaveText('Image 1 of 2')

    await page.locator('.thumbnail').nth(1).click()
    const panel = page.locator('.carousel-sheet .sheet-panel')
    await expect(panel).toBeVisible()
    await expect(panel.locator('figcaption')).toContainText('A grain silo beside a field')
    await expect(panel.locator('.credit')).toHaveText('Credit Drawing: Example Studio, CC0 1.0')

    // A click outside closes it, and the selection stays where the click put it.
    await page.locator('.carousel-sheet .sheet-backdrop').click({ position: { x: 4, y: 4 } })
    await expect(panel).toBeHidden()
    await expect(page.locator('.carousel-position')).toHaveText('Image 2 of 2')
    await expect(caption(page)).toHaveText('A grain silo beside a field — Drawing: Example Studio, CC0 1.0', { useInnerText: true })
  })
})

test.describe('the keyboard', () => {
  test('one tab stop for the strip; the arrows, Home and End move the selection; Enter enlarges; Escape closes and returns the focus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${FIVE}`)
    const thumbnails = page.locator('.thumbnail')
    const position = page.locator('.carousel-position')

    // Once the script has run, Tab from the last Answer lands on the selected thumbnail, not
    // on the strip, and the next Tab leaves the strip.
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
    await expect(page.locator('[data-carousel-strip]')).toHaveAttribute('tabindex', '-1')
    await page.locator('.answer--no').focus()
    await page.keyboard.press('Tab')
    await expect(thumbnails.nth(0)).toBeFocused()
    await page.keyboard.press('Tab')
    // Previous is disabled at the start of the strip, so it is no stop.
    await expect(page.getByRole('button', { name: 'Next' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(thumbnails.nth(0)).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(thumbnails.nth(1)).toBeFocused()
    await expect(position).toHaveText('Image 2 of 5')
    await expect(caption(page)).toContainText('Two greenhouses')

    await page.keyboard.press('End')
    await expect(thumbnails.nth(4)).toBeFocused()
    await expect(thumbnails.nth(4)).toBeInViewport({ ratio: 1 })
    await expect(position).toHaveText('Image 5 of 5')
    await page.keyboard.press('ArrowRight')
    await expect(position).toHaveText('Image 5 of 5')

    await page.keyboard.press('Home')
    await expect(thumbnails.nth(0)).toBeFocused()
    await expect(position).toHaveText('Image 1 of 5')
    await page.keyboard.press('ArrowLeft')
    await expect(position).toHaveText('Image 1 of 5')

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    const panel = page.locator('.carousel-sheet .sheet-panel')
    await expect(panel).toBeVisible()
    await expect(panel.locator('.sheet-figure img')).toHaveAttribute('alt', 'A drone scanning a field from above')
    await expect(panel.locator('.credit')).toContainText('Drawing: Example Illustrator, via Example Commons, CC BY-SA 4.0')
    await expect(page.locator('.sheet-close')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(thumbnails.nth(2)).toBeFocused()

    // Space enlarges too, and the Sheet's own next turns to the following Image.
    await page.keyboard.press(' ')
    await expect(panel).toBeVisible()
    await page.keyboard.press('Shift+Tab')
    await expect(panel.getByRole('button', { name: 'Next' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(panel.locator('.sheet-figure img')).toHaveAttribute('alt', 'A red tractor on a dirt track')
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
  })

  test('the previous and next buttons work from the keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${FIVE}`)
    await page.getByRole('button', { name: 'Next' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.carousel-position')).toHaveText('Image 5 of 5')
    await page.getByRole('button', { name: 'Previous' }).focus()
    await page.keyboard.press(' ')
    await expect(page.locator('.carousel-position')).toHaveText('Image 1 of 5')
  })
})

test.describe('names for assistive technology', () => {
  for (const [lang, names] of [
    ['en', { region: 'Images', previous: 'Previous', next: 'Next', enlarge: 'Enlarge', count: 'Image 1 of 5' }],
    ['nl', { region: 'Afbeeldingen', previous: 'Vorige', next: 'Volgende', enlarge: 'Vergroten', count: 'Afbeelding 1 van 5' }],
  ] as const) {
    test(`the region, the buttons, the thumbnails and the position, in ${lang}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 640 })
      await page.goto(`${origin}${FIVE}${lang === 'en' ? '' : `?lang=${lang}`}`)

      // The strip is the named region of 12.3; the row around it is not named too, or the name is read twice.
      await expect(page.locator('[data-carousel-strip]')).toHaveAccessibleName(names.region)
      await expect(page.getByRole('region', { name: names.region })).toHaveCount(0)
      await expect(page.getByRole('button', { name: names.previous, exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: names.next, exact: true })).toBeVisible()
      const first = page.locator('.thumbnail').first()
      await expect(first).toHaveAccessibleName(new RegExp(`^${names.enlarge} `))
      // The credit is the thumbnail's description, so it is read with the picture it credits.
      await expect(first).toHaveAccessibleDescription('Drawing: Example Studio, CC0 1.0')
      await expect(page.locator('.carousel-position')).toHaveText(names.count)
      await expect(page.locator('.carousel-position')).toHaveAttribute('aria-live', 'polite')
    })
  }

  for (const [lang, name] of [
    ['en', 'Enlarge A scoreboard ranking people'],
    ['nl', 'Vergroten Een scorebord dat mensen rangschikt'],
  ] as const) {
    test(`an Option's former picture is named on its target like any Image of the Node, in ${lang} (12.1)`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 640 })
      // The example Tree's `social-scoring`: scoreboard.png, which elsa-tree/3 moved there from
      // the Option of `prohibited-practices` that leads to it (#79). Playwright's own server serves it.
      await page.goto(`/ai-act-example/start/prohibited-practices/social-scoring${lang === 'en' ? '' : `?lang=${lang}`}`)
      await expect(page.locator('.thumbnail')).toHaveAccessibleName(name)
      await expect(page.locator('.thumbnail')).toHaveAccessibleDescription('Illustration: Example Studio, CC0 1.0')
    })
  }
})

test.describe('below the guaranteed height', () => {
  test('the row is one control that says the position and opens the enlarged view there, and remembers it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 })
    await page.goto(`${origin}${FIVE}`)
    const control = page.locator('.carousel-sheet .sheet-open')
    const panel = page.locator('.carousel-sheet .sheet-panel')
    await expect(page.locator('[data-carousel-strip]')).toBeHidden()
    await expect(control).toHaveText('Image 1 of 5')

    await control.focus()
    await page.keyboard.press('Enter')
    await expect(panel.locator('.sheet-figure img')).toHaveAttribute('src', '/images/orchard.svg')
    await panel.getByRole('button', { name: 'Next' }).click()
    await panel.getByRole('button', { name: 'Next' }).click()
    await expect(panel.locator('.sheet-figure img')).toHaveAttribute('src', '/images/drone.svg')
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(control).toBeFocused()
    await expect(control).toHaveText('Image 3 of 5')

    await control.click()
    await expect(panel.locator('.sheet-figure img')).toHaveAttribute('src', '/images/drone.svg')
  })
})

test.describe('below the guaranteed width', () => {
  /** The credit of `long`'s first Image: 120 characters, the format's maximum (tree-format.md 5.2). */
  const LONG_CREDIT = 'Photograph: Example Agricultural Research Station, Department of Soil and Water, via Example Commons, licence CC BY 4.0.'

  test('by width the Trail collapses first (1200), then the Carousel (960), and until then the longest credit is whole on the caption line', async ({ page }) => {
    // 800 pixels high, so no height-keyed step fires and only the width orders them (10.5).
    const widths = [
      { width: 1240, trail: 'open', strip: true },
      { width: 1199, trail: 'collapsed', strip: true },
      { width: 960, trail: 'collapsed', strip: true },
      { width: 959, trail: 'collapsed', strip: false },
    ] as const
    await page.goto(`${origin}${TWO}/long`)
    const control = page.locator('.carousel-sheet .sheet-open')
    for (const { width, trail, strip } of widths) {
      await page.setViewportSize({ width, height: 800 })
      const where = `at ${width} x 800`

      // `five`, the first of the Trail's two entries, is what step 1 gives up.
      if (trail === 'open') await expect(page.locator('.trail-step').first(), where).toBeVisible()
      else await expect(page.locator('.trail-step').first(), where).toBeHidden()

      if (strip) {
        await expect(page.locator('[data-carousel-strip]'), where).toBeVisible()
        await expect(control, where).toBeHidden()
        // No room is left for the description beside a credit of 120: the credit alone, uncut.
        await expect(caption(page), where).toHaveText(LONG_CREDIT, { useInnerText: true })
        const line = await caption(page).evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }))
        expect(line.scroll, `${where}: the caption line holds the credit`).toBeLessThanOrEqual(line.client + 1)
      } else {
        await expect(page.locator('[data-carousel-strip]'), where).toBeHidden()
        await expect(control, where).toHaveText('Image 1 of 2')
      }
    }
  })
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('a thumbnail is a link to its file, and the caption follows the keyboard along the strip', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${FIVE}`)
    // No script, no buttons that would do nothing (14).
    await expect(page.locator('.carousel-button')).toHaveCount(0)
    await expect(caption(page)).toHaveText('An orchard of three apple trees under a yellow sun — Drawing: Example Studio, CC0 1.0', { useInnerText: true })

    const thumbnails = page.locator('.thumbnail')
    await thumbnails.nth(3).focus()
    await expect(caption(page)).toHaveText('A red tractor on a dirt track — Drawing: Example Studio, CC0 1.0', { useInnerText: true })
    await expect(caption(page)).toHaveCount(1)

    await thumbnails.nth(4).click()
    await expect(page).toHaveURL(`${origin}/images/harbour.svg`)
  })

  test('the strip is a tab stop of its own, and the keys scroll it (12.2)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${FIVE}`)
    const strip = page.locator('[data-carousel-strip]')

    await page.locator('.answer--no').focus()
    await page.keyboard.press('Tab')
    await expect(strip).toBeFocused()
    await expect(strip).toHaveAccessibleName('Images')
    await expect(strip).toHaveJSProperty('scrollLeft', 0)

    // The fifth thumbnail is past the strip's page of four: the arrow keys scroll it into view and back.
    await expect(page.locator('.thumbnail').nth(4)).not.toBeInViewport()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.thumbnail').nth(4)).toBeInViewport({ ratio: 1 })
    await page.keyboard.press('ArrowLeft')
    await expect(strip).toHaveJSProperty('scrollLeft', 0)
    // The next stop is the first thumbnail: every one of them is a link.
    await page.keyboard.press('Tab')
    await expect(page.locator('.thumbnail').first()).toBeFocused()
  })

  test('a Node without pictures has no strip, so no empty tab stop in the Carousel row (12.1)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    // The `cycle` fixture carries no Image anywhere; since #84 every Node of the example Tree does.
    const cycle = await serve(path.join(repo, 'tests', 'fixtures'), 'cycle', PORT + 1)
    expect(cycle, 'the cycle fixture is a valid Tree').not.toBeNull()
    await page.goto(`${cycle!}/cycle/first`)
    await expect(page.locator('[data-carousel-strip]')).toHaveCount(0)

    // Every tab stop of the page, in order, and none of them in the row.
    const stops: string[] = []
    await page.locator('body').focus()
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab')
      const stop = await page.evaluate(() => {
        const active = document.activeElement
        if (!active || active === document.body) return null
        return active.closest('.carousel') ? `in the Carousel row: ${active.outerHTML.slice(0, 80)}` : active.tagName
      })
      if (stop === null) break
      stops.push(stop)
    }
    expect(stops.length).toBeGreaterThan(0)
    expect(stops.filter((stop) => stop.startsWith('in the Carousel row'))).toEqual([])
  })

  test('below the guaranteed height the control opens the Images as pages of disclosures, each with its credit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 })
    await page.goto(`${origin}${FIVE}`)
    const sheet = page.locator('.carousel-sheet')
    await sheet.locator('.sheet-open').click()
    const figures = sheet.locator('.sheet-figure')
    await expect(figures.locator('visible=true')).toHaveCount(1)
    await expect(figures.first().locator('.credit')).toContainText('Drawing: Example Studio, CC0 1.0')

    for (let turned = 1; turned < 5; turned += 1) await sheet.locator('.sheet-more:not([open]) > summary:visible').click()
    await expect(figures.locator('visible=true')).toHaveCount(1)
    await expect(figures.last()).toBeVisible()
    await expect(figures.last().locator('.credit')).toContainText('Drawing: Example Cartography, public domain')
  })
})

for (const lang of ['en', 'nl'] as const) {
  test(`every picture of the example Tree shows its author, source and licence without a click, in ${lang}`, async ({ page }) => {
    // Issue #55: every Node's own Images, walked along the strip by
    // the keyboard at the guaranteed viewport. Playwright's own server serves this Tree.
    await page.setViewportSize({ width: 1280, height: 640 })
    const dir = path.join(repo, 'trees', 'ai-act-example')
    const tree = await openTree(dir)
    let read = 0
    for (const [nodeId, pictures] of await picturesByNode(tree, dir)) {
      read += await readEveryCredit(page, `/ai-act-example/${nodeId}${lang === 'en' ? '' : `?lang=${lang}`}`, pictures)
    }
    // An Image on each of the seven Nodes (#84); scoreboard.png is `social-scoring`'s, where elsa-tree/3 moved it from its Option.
    expect(read, 'pictures read').toBe(7)
  })
}

test('the screenshots of issue #43: five Images, two Images, and the enlarged view, at 1280 x 640', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  const shot = async (name: string): Promise<void> => {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
  }

  await page.goto(`${origin}${FIVE}`)
  await shot('five-images-1280x640')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.locator('.carousel-position')).toHaveText('Image 5 of 5')
  await shot('five-images-after-next-1280x640')

  await page.goto(`${origin}${TWO}`)
  await shot('two-images-1280x640')

  await page.goto(`${origin}${FIVE}`)
  await page.locator('.thumbnail').nth(1).click()
  await expect(page.locator('.carousel-sheet .sheet-panel')).toBeVisible()
  await shot('enlarged-1280x640')
})
