/**
 * The main image and the Carousel in a real browser (docs/specs/application.md 10.1, 10.3,
 * section 12; issues #43 and #81): where the strip sits on the Bubble's outline and what each
 * row measures at the guaranteed viewport, which image files the browser asks for, whether a
 * keyboard alone moves, enlarges and closes, what the strip collapses to below the guaranteed
 * height, what a reader without JavaScript gets, and the screenshots #81 owes. What the
 * markup says is `tests/views.test.tsx`; whether it fits is `no-scroll.spec.ts`.
 *
 * The Trees: `tests/fixtures/carousel/`, where `five` carries five Images (a main image and
 * four in the strip), `two` carries two, `long` a credit of the format's maximum 120
 * characters, and `done` one that no other page may ask for; `tests/fixtures/full-node/` for
 * the row budget at every maximum; and the first Tree for its `start` Node, a Node without
 * Images and `annex-i-legislation`.
 *
 * The requests and the rows each test records are written to
 * `tests/browser/.results/carousel-requests.md` and `carousel-rows.md`, so the pull request
 * pastes the numbers rather than describes them. Screenshots go to the gitignored results
 * folder unless `ELSA_SHOTS=1` asks for the tracked set in `docs/screenshots/issue-81/`, the
 * convention of `tree-view.spec.ts`.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { openTree } from '../../src/tree/loader.ts'
import { picturesByNode, readEveryCredit } from './credits.ts'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const fixtures = path.join(repo, 'tests', 'fixtures')
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-81')
    : path.join(RESULTS, 'shots')

/** Clear of playwright.config.ts's, theme.spec.ts's, no-scroll.spec.ts's and chrome-clearance.spec.ts's ports. */
const PORT = BASE_PORT + 30

const FIVE = '/carousel/five'
const TWO = `${FIVE}/two`
const FIVE_FILES = ['orchard.svg', 'greenhouse.svg', 'drone.svg', 'tractor.svg', 'harbour.svg']
const FIRST_TREE = 'ai-act-applicability-agrifood'

let origin: string
let fullNode: string
let firstTree: string
const requests: string[] = []
const rowTable: string[] = []

test.beforeAll(async () => {
  const started = await serve(fixtures, 'carousel', PORT)
  expect(started, 'the carousel fixture is a valid Tree').not.toBeNull()
  origin = started!
  const full = await serve(fixtures, 'full-node', PORT + 1)
  expect(full, 'the full-node fixture is a valid Tree').not.toBeNull()
  fullNode = full!
  const first = await serve(path.join(repo, 'trees'), FIRST_TREE, PORT + 2)
  expect(first, 'the first Tree starts').not.toBeNull()
  firstTree = first!
})

test.afterAll(async () => {
  stopServers()
  await mkdir(RESULTS, { recursive: true })
  await writeFile(path.join(RESULTS, 'carousel-requests.md'), `${requests.join('\n')}\n`)
  await writeFile(path.join(RESULTS, 'carousel-rows.md'), `${rowTable.join('\n')}\n`)
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

/** One line of the requests table the pull request pastes. */
function recordRequests(where: string, step: string, asked: string[]): void {
  if (requests.length === 0) requests.push('| where | step | image files requested |', '|---|---|---|')
  requests.push(`| ${where} | ${step} | ${asked.length === 0 ? '(none)' : asked.join(', ')} |`)
}

/** The rows of 10.1 as laid out: each box's top and height, in CSS pixels. */
async function rows(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const box = (selector: string) => {
      const el = document.querySelector(selector)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height, width: r.width }
    }
    const thumbnails = [...document.querySelectorAll('.thumbnail')].map((el) => {
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height, width: r.width }
    })
    return {
      header: box('header')!,
      bubble: box('.bubble')!,
      text: box('.bubble-text')!,
      mainImage: box('.bubble .main-image'),
      title: box('.bubble h1')!,
      prose: box('.bubble .prose')!,
      sources: box('.bubble .sources'),
      strip: box('[data-carousel-strip]'),
      answers: box('.answers')!,
      disclaimer: box('.disclaimer')!,
      thumbnails,
    }
  })
}

test.describe('the rows of 10.1 at 1280 x 640', () => {
  for (const [what, at] of [
    ['five Images', () => `${origin}${FIVE}`],
    ['the full Node', () => `${fullNode}/full-node/full`],
  ] as const) {
    test(`measure the heights the spec gives, on ${what}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 640 })
      await page.goto(at())
      const m = await rows(page)
      const measured: Array<[row: string, spec: number, height: number]> = [
        ['chrome bar', 44, m.header.height],
        ['band above the Bubble', 26, m.bubble.top - m.header.bottom],
        ['Bubble', 446, m.bubble.height],
        ['strip band', 28, m.answers.top - m.bubble.bottom],
        ['Answers', 68, m.answers.height],
        ['disclaimer', 28, m.disclaimer.height],
      ]
      if (rowTable.length === 0) rowTable.push('| page | row | spec (10.1, 10.7) | measured |', '|---|---|---|---|')
      for (const [row, spec, height] of measured) {
        rowTable.push(`| ${what} | ${row} | ${spec} | ${height} |`)
        expect.soft(height, `${what}: ${row}`).toBe(spec)
      }
      // The Bubble 760 wide, its text area 640 x 394 (10.1).
      expect(m.bubble.width).toBe(760)
      expect([m.text.width, m.text.height]).toEqual([640, 394])
      rowTable.push(`| ${what} | text area | 640 x 394 | ${m.text.width} x ${m.text.height} |`)

      // The Interior from the top of the text area: main image 60, gap 8, title, and the
      // Sources ending inside it (10.7).
      expect(m.mainImage!.top).toBe(m.text.top)
      expect([m.mainImage!.width, m.mainImage!.height]).toEqual([90, 60])
      expect(m.title.top - m.mainImage!.bottom).toBe(8)
      rowTable.push(`| ${what} | main image | 90 x 60 | ${m.mainImage!.width} x ${m.mainImage!.height} |`)
      rowTable.push(`| ${what} | title | at most 56 | ${m.title.height} |`)
      rowTable.push(`| ${what} | description | at most 192 | ${m.prose.height} |`)
      if (m.sources) {
        rowTable.push(`| ${what} | Sources | at most 60 | ${m.sources.height} |`)
        rowTable.push(`| ${what} | text area left under the Sources | at least 2 | ${m.text.bottom - m.sources.bottom} |`)
        expect(m.sources.height).toBeLessThanOrEqual(60)
        expect(m.sources.bottom).toBeLessThanOrEqual(m.text.bottom)
      }

      // The thumbnails: 48 pixels, centred on the Bubble's bottom outline, 2 clear of the text
      // area and 4 clear of the Answers; the strip at most 400 wide, centred on the Bubble (12.2).
      expect(m.thumbnails.length).toBeGreaterThan(0)
      for (const thumbnail of m.thumbnails.filter((t) => t.right > m.strip!.left && t.left < m.strip!.right)) {
        expect([thumbnail.width, thumbnail.height]).toEqual([48, 48])
        expect(thumbnail.top + 24).toBe(m.bubble.bottom)
        expect(thumbnail.top - m.text.bottom).toBe(2)
        expect(m.answers.top - thumbnail.bottom).toBe(4)
      }
      expect(m.strip!.width).toBeLessThanOrEqual(400)
      expect(Math.abs((m.strip!.left + m.strip!.right) / 2 - (m.bubble.left + m.bubble.right) / 2)).toBeLessThanOrEqual(1)
      rowTable.push(`| ${what} | thumbnails | 48, centred on the outline | ${m.thumbnails[0]!.height}, centre ${m.thumbnails[0]!.top + 24 - m.bubble.bottom} from the outline |`)
      rowTable.push(`| ${what} | strip | at most 400 wide | ${m.strip!.width} |`)
    })
  }

  test('seven thumbnails show and the full Node\'s other two scroll into view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${fullNode}/full-node/full`)
    const thumbnails = page.locator('.thumbnail')
    await expect(thumbnails).toHaveCount(9)
    for (let i = 0; i < 7; i += 1) await expect(thumbnails.nth(i)).toBeInViewport({ ratio: 1 })
    await expect(page.locator('[data-carousel-strip]')).toHaveJSProperty('clientWidth', 400)
    const strip = page.locator('[data-carousel-strip]')
    expect(await strip.evaluate((el) => el.scrollWidth)).toBeGreaterThan(400)
  })
})

test.describe('the image files', () => {
  test("a Node with five Images: its own files on load, nothing more on enlarging, and no other Node's", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    const where = 'carousel fixture, five, 1280 x 640'

    const onLoad = await imageRequests(page, () => page.goto(`${origin}${FIVE}`))
    recordRequests(where, 'load', onLoad)
    // Only this Node's files, each once: the main image and the four thumbnails. No file of
    // `two` or `done`, which the Answers lead to (11.4).
    expect([...onLoad].sort()).toEqual([...FIVE_FILES].sort())

    const onEnlarge = await imageRequests(page, async () => {
      await page.locator('.thumbnail').nth(3).click()
      await expect(page.locator('.carousel-sheet .sheet-figure img')).toHaveAttribute('src', '/images/harbour.svg')
    })
    recordRequests(where, 'enlarge Image 5', onEnlarge)
    expect(onEnlarge).toEqual([])
  })

  test("the first Tree's annex-i-legislation: its main image and one file per Option, its target's first Image, nothing else (11.5, 12.4)", async ({ page }) => {
    // Its eight Options' pictures are their targets' main images since elsa-tree/3 (#79), and
    // each Option's button shows its target's (10.3, #80): the one file per Option 11.5 allows.
    await page.setViewportSize({ width: 1280, height: 640 })
    const tree = await openTree(path.join(repo, 'trees', FIRST_TREE))
    const node = (await tree.getNode('annex-i-legislation'))!
    const targets = await Promise.all(node.options.map((option) => tree.getNode(option.target)))
    const expected = [...node.images, ...targets.map((target) => target!.images[0]!)].map((image) => image.file)
    expect(expected).toHaveLength(1 + 8)

    const onLoad = await imageRequests(page, () => page.goto(`${firstTree}/${FIRST_TREE}/annex-i-legislation`))
    recordRequests(`first Tree, annex-i-legislation, 1280 x 640`, 'load', onLoad)
    expect([...onLoad].sort()).toEqual([...expected].sort())
  })

  test('below the guaranteed height the strip is not fetched, and a thumbnail\'s Image is fetched when the Sheet shows it', async ({ page }) => {
    // 10.5, steps 1 and 5 at 600: the strip is one control and the main image is hidden. The
    // main image is not lazy -- it is on screen whenever the Bubble is -- so its file comes
    // with the page all the same; the strip's lazy thumbnails have no box and do not.
    await page.setViewportSize({ width: 1280, height: 600 })
    const where = 'carousel fixture, five, 1280 x 600 (collapsed)'

    const onLoad = await imageRequests(page, () => page.goto(`${origin}${FIVE}`))
    recordRequests(where, 'load', onLoad)
    expect(onLoad).toEqual(['orchard.svg'])

    const onNext = await imageRequests(page, async () => {
      await page.locator('.carousel-sheet .sheet-open').click()
      await expect(page.locator('.carousel-sheet .sheet-figure img')).toHaveAttribute('src', '/images/orchard.svg')
      await page.locator('.carousel-sheet .sheet-controls button', { hasText: 'Next' }).click()
      await expect(page.locator('.carousel-sheet .sheet-figure img')).toHaveAttribute('src', '/images/greenhouse.svg')
    })
    recordRequests(where, 'open the control, then next', onNext)
    expect(onNext).toEqual(['greenhouse.svg'])
  })
})

test.describe('pictures only', () => {
  test('no button, no position text and no caption on the page; a click on a picture opens it enlarged with its credit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${TWO}`)
    await expect(page.locator('.carousel button:visible, .carousel [aria-live]')).toHaveCount(0)
    await expect(page.locator('.carousel .sheet-open')).toBeHidden()
    // The only text the band shows is none at all.
    expect(await page.locator('.carousel').evaluate((el) => (el as HTMLElement).innerText.trim())).toBe('')

    await page.locator('.thumbnail').first().click()
    const panel = page.locator('.carousel-sheet .sheet-panel')
    await expect(panel).toBeVisible()
    await expect(panel.locator('figcaption')).toContainText('A grain silo beside a field')
    await expect(panel.locator('.credit')).toHaveText('Credit Drawing: Example Studio, CC0 1.0')
    await expect(panel.getByRole('button', { name: 'Previous' })).toBeEnabled()

    // A click outside closes it.
    await page.locator('.carousel-sheet .sheet-backdrop').click({ position: { x: 4, y: 4 } })
    await expect(panel).toBeHidden()

    // The main image opens the same view at the first page.
    await page.locator('.bubble a.main-image').click()
    await expect(panel.locator('.sheet-figure img')).toHaveAttribute('src', '/images/barn.svg')
    await expect(panel.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })
})

test.describe('the keyboard', () => {
  test('one tab stop for the strip; the arrows, Home and End move along it; Enter and Space enlarge; Escape closes and returns the focus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${FIVE}`)
    const thumbnails = page.locator('.thumbnail')
    const panel = page.locator('.carousel-sheet .sheet-panel')

    // Once the script has run, Tab from the last Answer lands on the first thumbnail, not
    // on the strip, and the next Tab leaves the strip.
    await expect(page.locator('[data-carousel-strip]')).toHaveAttribute('tabindex', '-1')
    await page.locator('.answer--no').focus()
    await page.keyboard.press('Tab')
    await expect(thumbnails.nth(0)).toBeFocused()
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.closest('.carousel') ?? null)).toBeNull()
    await page.keyboard.press('Shift+Tab')
    await expect(thumbnails.nth(0)).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(thumbnails.nth(1)).toBeFocused()
    await page.keyboard.press('End')
    await expect(thumbnails.nth(3)).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(thumbnails.nth(3)).toBeFocused()
    await page.keyboard.press('Home')
    await expect(thumbnails.nth(0)).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(thumbnails.nth(0)).toBeFocused()

    // The strip's tab stop follows the focus.
    await page.keyboard.press('ArrowRight')
    await expect(thumbnails.nth(1)).toHaveAttribute('tabindex', '0')
    await expect(thumbnails.nth(0)).toHaveAttribute('tabindex', '-1')

    await page.keyboard.press('Enter')
    await expect(panel).toBeVisible()
    await expect(panel.locator('.sheet-figure img')).toHaveAttribute('alt', 'A drone scanning a field from above')
    await expect(panel.locator('.credit')).toContainText('Drawing: Example Illustrator, via Example Commons, CC BY-SA 4.0')
    await expect(page.locator('.sheet-close')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(thumbnails.nth(1)).toBeFocused()

    // Space enlarges too, and the Sheet's own next turns to the following Image.
    await page.keyboard.press(' ')
    await expect(panel).toBeVisible()
    await page.keyboard.press('Shift+Tab')
    await expect(panel.getByRole('button', { name: 'Next' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(panel.locator('.sheet-figure img')).toHaveAttribute('alt', 'A red tractor on a dirt track')
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()

    // The main image by keyboard: Enter opens the first page, Escape returns to it.
    await page.locator('.bubble a.main-image').focus()
    await page.keyboard.press('Enter')
    await expect(panel.locator('.sheet-figure img')).toHaveAttribute('src', '/images/orchard.svg')
    await page.keyboard.press('Escape')
    await expect(page.locator('.bubble a.main-image')).toBeFocused()
  })
})

test.describe('names for assistive technology', () => {
  for (const [lang, names] of [
    ['en', { region: 'Images', enlarge: 'Enlarge' }],
    ['nl', { region: 'Afbeeldingen', enlarge: 'Vergroten' }],
  ] as const) {
    test(`the strip, the thumbnails and the main image, in ${lang}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 640 })
      await page.goto(`${origin}${FIVE}${lang === 'en' ? '' : `?lang=${lang}`}`)

      // The strip is the named region of 12.3; the band around it is not named too, or the name is read twice.
      await expect(page.locator('[data-carousel-strip]')).toHaveAccessibleName(names.region)
      await expect(page.getByRole('region', { name: names.region })).toHaveCount(0)
      const first = page.locator('.thumbnail').first()
      await expect(first).toHaveAccessibleName(new RegExp(`^${names.enlarge} `))
      // The credit is the picture's description, so it is read with the picture it credits.
      await expect(first).toHaveAccessibleDescription('Drawing: Example Studio, CC BY 4.0')
      const main = page.locator('.bubble a.main-image')
      await expect(main).toHaveAccessibleName(new RegExp(`^${names.enlarge} `))
      await expect(main).toHaveAccessibleDescription('Drawing: Example Studio, CC0 1.0')
    })
  }

  test('a Node without Images says nothing where its main image would be', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    // The example Tree's `emotion-recognition-at-work` carries no Image. As the centre: under
    // its parent the page is the parent's, with this Node in an Overlay (10.9).
    await page.goto('/ai-act-example/emotion-recognition-at-work')
    await expect(page.locator('.bubble .main-image--empty')).toBeVisible()
    await expect(page.locator('.bubble .main-image--empty')).toHaveAttribute('aria-hidden', 'true')
    const box = (await page.locator('.bubble .main-image--empty').boundingBox())!
    expect([box.width, box.height]).toEqual([60, 60])
  })

  for (const [lang, name] of [
    ['en', 'Enlarge A scoreboard ranking people'],
    ['nl', 'Vergroten Een scorebord dat mensen rangschikt'],
  ] as const) {
    test(`an Option's former picture is its target's main image, named like any other, in ${lang} (10.3)`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 640 })
      // The example Tree's `social-scoring`: scoreboard.png, which elsa-tree/3 moved there from
      // the Option of `prohibited-practices` that leads to it (#79). Playwright's own server serves it.
      // As the centre, which a path with no parent makes it, and in the Overlay its URL under
      // its parent opens (10.9): the same names, from ids the Overlay prefixes.
      const query = lang === 'en' ? '' : `?lang=${lang}`
      await page.goto(`/ai-act-example/social-scoring${query}`)
      await expect(page.locator('.bubble a.main-image')).toHaveAccessibleName(name)
      await expect(page.locator('.bubble a.main-image')).toHaveAccessibleDescription('Illustration: Example Studio, CC0 1.0')
      await expect(page.locator('.thumbnail')).toHaveCount(0)

      await page.goto(`/ai-act-example/start/prohibited-practices/social-scoring${query}`)
      const inOverlay = page.locator('.overlay[open] .overlay-interior a.main-image')
      await expect(inOverlay).toHaveAccessibleName(name)
      await expect(inOverlay).toHaveAccessibleDescription('Illustration: Example Studio, CC0 1.0')
    })
  }
})

test.describe('below the guaranteed height', () => {
  test('the strip is one control that says the position and opens the enlarged view there, and remembers it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 })
    await page.goto(`${origin}${FIVE}`)
    const control = page.locator('.carousel-sheet .sheet-open')
    const panel = page.locator('.carousel-sheet .sheet-panel')
    await expect(page.locator('[data-carousel-strip]')).toBeHidden()
    await expect(page.locator('.bubble .main-image')).toBeHidden()
    await expect(control).toHaveText('Image 1 of 5')
    // A 20-pixel pill centred on the Bubble's lower outline (10.5, step 1).
    const pill = (await control.boundingBox())!
    const bubble = (await page.locator('.bubble').boundingBox())!
    expect(pill.height).toBe(20)
    expect(pill.y + pill.height / 2).toBe(bubble.y + bubble.height)

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
  })

  test('the steps of 10.5 fire at 640, 632 and 564 of height, in that order', async ({ page }) => {
    await page.goto(`${fullNode}/full-node/full`)
    for (const { height, strip, main, sources } of [
      { height: 640, strip: true, main: true, sources: true },
      { height: 639, strip: false, main: true, sources: true },
      { height: 632, strip: false, main: true, sources: true },
      { height: 631, strip: false, main: false, sources: true },
      { height: 564, strip: false, main: false, sources: true },
      { height: 563, strip: false, main: false, sources: false },
    ]) {
      await page.setViewportSize({ width: 1280, height })
      const where = `at 1280 x ${height}`
      await expect(page.locator('[data-carousel-strip]'), where).toBeVisible({ visible: strip })
      await expect(page.locator('.carousel-sheet .sheet-open'), where).toBeVisible({ visible: !strip })
      await expect(page.locator('.bubble .main-image'), where).toBeVisible({ visible: main })
      await expect(page.locator('.bubble .sources'), where).toBeVisible({ visible: sources })
      await expect(page.locator('.bubble .sources-collapsed'), where).toBeVisible({ visible: !sources })
    }
  })
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('a thumbnail and the main image are links to their files', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${FIVE}`)
    await page.locator('.thumbnail').nth(3).click()
    await expect(page).toHaveURL(`${origin}/images/harbour.svg`)
    await page.goto(`${origin}${FIVE}`)
    await page.locator('.bubble a.main-image').click()
    await expect(page).toHaveURL(`${origin}/images/orchard.svg`)
  })

  test('the strip is a tab stop of its own, named, and every thumbnail after it is one too (12.2)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${origin}${FIVE}`)
    const strip = page.locator('[data-carousel-strip]')

    await page.locator('.answer--no').focus()
    await page.keyboard.press('Tab')
    await expect(strip).toBeFocused()
    await expect(strip).toHaveAccessibleName('Images')
    await page.keyboard.press('Tab')
    await expect(page.locator('.thumbnail').first()).toBeFocused()
  })

  test('a Node without pictures has no strip, so no empty tab stop in the Carousel band (12.1)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    // The example Tree's `emotion-recognition-at-work`, as the centre: the Node carries no
    // Image. Under its parent the page would be the parent's, with this Node in an Overlay (10.9).
    await page.goto('/ai-act-example/emotion-recognition-at-work')
    await expect(page.locator('[data-carousel-strip]')).toHaveCount(0)

    const stops: string[] = []
    await page.locator('body').focus()
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab')
      const stop = await page.evaluate(() => {
        const active = document.activeElement
        if (!active || active === document.body) return null
        return active.closest('.carousel') ? `in the Carousel band: ${active.outerHTML.slice(0, 80)}` : active.tagName
      })
      if (stop === null) break
      stops.push(stop)
    }
    expect(stops.length).toBeGreaterThan(0)
    expect(stops.filter((stop) => stop.startsWith('in the Carousel band'))).toEqual([])
  })

  test('the enlarged view\'s control shows beside the strip at every size and opens the Images as pages of disclosures, each with its credit (14)', async ({ page }) => {
    for (const [width, height] of [[1280, 640], [1280, 600]] as const) {
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}${FIVE}`)
      const sheet = page.locator('.carousel-sheet')
      await expect(sheet.locator('.sheet-open'), `${width}x${height}`).toBeVisible()
      await sheet.locator('.sheet-open').click()
      const figures = sheet.locator('.sheet-figure')
      await expect(figures.locator('visible=true')).toHaveCount(1)
      await expect(figures.first().locator('.credit')).toContainText('Drawing: Example Studio, CC0 1.0')

      for (let turned = 1; turned < 5; turned += 1) await sheet.locator('.sheet-more:not([open]) > summary:visible').click()
      await expect(figures.locator('visible=true')).toHaveCount(1)
      await expect(figures.last().locator('.credit')).toContainText('Drawing: Example Cartography, public domain')
      // A second click on the control closes it (14).
      await sheet.locator('.sheet-open').click()
      await expect(sheet.locator('.sheet-panel')).toBeHidden()
    }
  })
})

test('every Node picture of the example Tree gives its author, source and licence by keyboard', async ({ page }) => {
  // Playwright's own server serves the example Tree.
  await page.setViewportSize({ width: 1280, height: 640 })
  const dir = path.join(repo, 'trees', 'ai-act-example')
  const tree = await openTree(dir)
  let read = 0
  for (const lang of ['en', 'nl'] as const) {
    for (const [nodeId, images] of await picturesByNode(tree, dir)) {
      read += await readEveryCredit(page, `/ai-act-example/${nodeId}${lang === 'en' ? '' : `?lang=${lang}`}`, images)
    }
  }
  // eu-map.png on `start` and scoreboard.png on `social-scoring`, where elsa-tree/3 moved it
  // from its Option, in each language.
  expect(read, 'pictures read').toBe(4)
})

test('the screenshots of issue #81, at the smallest and the largest guaranteed viewport', async ({ page }) => {
  test.slow()
  const shot = async (name: string): Promise<void> => {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
  }

  for (const [width, height] of [[1280, 640], [2560, 1440]] as const) {
    const size = `${width}x${height}`
    await page.setViewportSize({ width, height })

    await page.goto(`${firstTree}/${FIRST_TREE}/start`)
    await shot(`first-tree-start-${size}`)
    await page.locator('.bubble a.main-image').click()
    await expect(page.locator('.carousel-sheet .sheet-panel')).toBeVisible()
    await shot(`first-tree-start-enlarged-${size}`)

    await page.goto(`${origin}${FIVE}`)
    await shot(`five-images-${size}`)
    await page.locator('.thumbnail').nth(1).click()
    await expect(page.locator('.carousel-sheet .sheet-panel')).toBeVisible()
    await shot(`five-images-enlarged-${size}`)

    // A question Node of the first Tree without an Image of its own: the empty slot.
    await page.goto(`${firstTree}/${FIRST_TREE}/annex-i-legislation/annex-i-legislation-2`)
    await expect(page.locator('.main-image--empty')).toBeVisible()
    await shot(`no-images-${size}`)
  }
})
