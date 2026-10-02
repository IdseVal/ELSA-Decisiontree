/**
 * **[#174]** The pictures in a browser (docs/specs/application.md 12.2, 31.1, 31.2, 31.3; issue
 * #174): the strip's thumbnails and the editor's `+` at its end are 67 pixels, 1.4 times the 48
 * they were, on the public page and in the editor; the `+` says "Add an extra image" beside it
 * on hover and on keyboard focus and is named by those words, while the empty slot keeps "Add a
 * picture"; and the information hint behind an Image's credit and description, in the attach
 * Sheet and in the enlarged view, opens on hover, on focus and on tap and closes on leaving and
 * on Escape -- which closes the hint and not the Sheet around it.
 *
 * The carousel fixture, whose `five` carries five pictures, is served twice: as a public Tree,
 * and as a hidden one in a data directory of this file's own, for the editor. The measured
 * sizes go to `tests/browser/.results/pictures.md`, so the pull request pastes them; the
 * screenshots go to `docs/screenshots/issue-174/` under `ELSA_SHOTS=1` (35.7), and to the
 * gitignored results folder otherwise.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serve, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const fixtures = path.join(repo, 'tests', 'fixtures')
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-174') : path.join(RESULTS, 'shots')

/** Clear of every other spec's offsets, which end at +150. */
const PORT = BASE_PORT + 160

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }

/** The words of src/chrome.ts the tests look for, per chrome language. */
const WORDS = {
  en: {
    addExtraPicture: 'Add an extra image',
    addPicture: 'Add a picture',
    hint: 'Why this is asked',
    creditHint: 'The maker and the licence of a picture must be named, for copyright reasons. The credit is shown with the enlarged picture.',
    descriptionHint: 'A screen reader says this in place of the picture, for people who cannot see it.',
  },
  nl: {
    addExtraPicture: 'Extra afbeelding toevoegen',
    addPicture: 'Afbeelding toevoegen',
    hint: 'Waarom dit gevraagd wordt',
    creditHint: 'De maker en de licentie van een afbeelding moeten genoemd worden, vanwege het auteursrecht. De bronvermelding staat bij de vergrote afbeelding.',
    descriptionHint: 'Een schermlezer leest dit voor in plaats van de afbeelding, voor wie die niet kan zien.',
  },
} as const

const PICTURE = { name: 'covered.png', mimeType: 'image/png', buffer: Buffer.alloc(0) }

let publicOrigin: string
let editorOrigin: string
const sizes: string[] = []

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  PICTURE.buffer = await readFile(path.join(repo, 'trees', 'ai-act-example', 'images', 'covered.png'))
  const started = await serve(fixtures, 'carousel', PORT)
  expect(started, 'the carousel fixture is a valid Tree').not.toBeNull()
  publicOrigin = started!
  const dir = await buildDataDir({
    trees: [{ folder: path.join(fixtures, 'carousel'), id: 'pictures', hidden: true, creator: ANNA.login }],
    accounts: [ANNA],
  })
  editorOrigin = await serveStore(dir, PORT + 1, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
  await mkdir(RESULTS, { recursive: true })
  await writeFile(path.join(RESULTS, 'pictures.md'), ['| where | what | measured (width x height) |', '|---|---|---|', ...sizes, ''].join('\n'))
})

async function loggedIn(browser: Browser, options: { hasTouch?: boolean } = {}): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 }, ...options })).newPage()
  const { status, cookie } = await login(page, editorOrigin, ANNA.login, ANNA.password)
  expect(status).toBe(204)
  return { page, cookie }
}

/** The laid-out size of every element `locator` matches, as `width x height`. */
async function measured(locator: Locator): Promise<string[]> {
  await locator.first().page().evaluate(() => document.fonts.ready)
  return locator.evaluateAll((elements) => elements.map((el) => {
    const box = el.getBoundingClientRect()
    return `${box.width} x ${box.height}`
  }))
}

function record(where: string, what: string, found: string[]): void {
  sizes.push(`| ${where} | ${what} | ${[...new Set(found)].join(', ')} (${found.length}) |`)
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

/** Whether `inner` lies inside `outer`, to the pixel of 10.6's tolerance. */
async function inside(inner: Locator, outer: Locator): Promise<boolean> {
  const a = (await inner.boundingBox())!
  const b = (await outer.boundingBox())!
  return a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.width <= b.x + b.width + 1 && a.y + a.height <= b.y + b.height + 1
}

test.describe('67 pixels, 1.4 times 48 (12.2, 31.1)', () => {
  test('on the public page, the five pictures of `five` at 1280 x 640: four thumbnails of 67', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(`${publicOrigin}/carousel/five`)
    const found = await measured(page.locator('.carousel-strip .thumbnail img'))
    record('public page, carousel `five`, 1280 x 640', 'strip thumbnail', found)
    // Named by what was measured, so the run on the build before #174 left its own picture.
    await shoot(page, `public-five-pictures-${found[0]?.split(' ')[0] ?? 'none'}px`)
    expect(found).toEqual(Array(4).fill('67 x 67'))
  })

  test('in the editor, the same Node: four thumbnails and the + at the strip’s end, each 67', async ({ browser }) => {
    const { page } = await loggedIn(browser)
    await page.goto(`${editorOrigin}/admin/trees/pictures/five`)
    const thumbnails = await measured(page.locator('.carousel-strip .thumbnail img'))
    const plus = await measured(page.locator('.carousel > .editor-picker--strip'))
    record('editor, carousel `five`, 1280 x 640', 'strip thumbnail', thumbnails)
    record('editor, carousel `five`, 1280 x 640', 'the strip’s +', plus)
    expect(thumbnails).toEqual(Array(4).fill('67 x 67'))
    expect(plus).toEqual(['67 x 67'])
  })
})

test.describe('the strip’s + says what it adds (31.1)', () => {
  for (const lang of ['en', 'nl'] as const) {
    test(`"${WORDS[lang].addExtraPicture}" beside it on hover and on keyboard focus, and as its name; the empty slot keeps "${WORDS[lang].addPicture}", ${lang}`, async ({ browser }) => {
      const { page, cookie } = await loggedIn(browser)
      const query = lang === 'en' ? '' : '?lang=nl'
      await page.goto(`${editorOrigin}/admin/trees/pictures/five${query}`)
      const plus = page.locator('.carousel > .editor-picker--strip')
      const input = plus.locator('input[type="file"]')
      const label = page.locator('.carousel > .editor-picker-room > .editor-picker-label')
      await expect(input).toHaveAccessibleName(WORDS[lang].addExtraPicture)
      await expect(label).toHaveText(WORDS[lang].addExtraPicture)
      await expect(label).toBeHidden()

      await plus.hover()
      await expect(label).toBeVisible()
      // Beside it: right of the `+`, level with it, and inside the band, which nothing may leave (10.6).
      const p = (await plus.boundingBox())!
      const l = (await label.boundingBox())!
      expect(l.x).toBeGreaterThanOrEqual(p.x + p.width)
      expect(l.y).toBeLessThan(p.y + p.height)
      expect(l.y + l.height).toBeGreaterThan(p.y)
      expect(await inside(label, page.locator('.carousel'))).toBe(true)
      if (lang === 'en') await shoot(page, 'strip-plus-hovered')
      await page.mouse.move(5, 5)
      await expect(label).toBeHidden()

      // The keyboard: from the strip's thumbnail, Tab reaches the `+`.
      await page.locator('.carousel-strip .thumbnail').first().focus()
      await page.keyboard.press('Tab')
      await expect(input).toBeFocused()
      await expect(label).toBeVisible()
      await page.keyboard.press('Shift+Tab')
      await expect(label).toBeHidden()

      // A Node without a picture: the slot is the picker, and keeps its own words.
      const id = `slot-${lang}`
      const created = await page.request.post(`${editorOrigin}/admin/api/trees`, {
        headers: { Origin: editorOrigin, Cookie: cookie, 'Content-Type': 'application/json' },
        data: JSON.stringify({ id, languages: [lang], title: { [lang]: id } }),
      })
      expect(created.status()).toBe(201)
      await page.goto(`${editorOrigin}/admin/trees/${id}/start`)
      await expect(page.locator('.bubble .editor-picker--slot input[type="file"]')).toHaveAccessibleName(WORDS[lang].addPicture)
      await expect(page.locator('.editor-picker-label')).toHaveCount(0)
    })

    test(`beside nine pictures its label holds its words and stays in the band at every width from 360: right of the + where its column leaves 110 pixels, left of it on one line where it does not, ${lang}`, async ({ browser }) => {
      const { page, cookie } = await loggedIn(browser)
      // `done` has one picture: eight more make nine, the most with a `+`, and the strip its widest, 383 (12.2).
      // Described in both languages, so that they add nothing to the to-do list the later screenshots show.
      const node = `${editorOrigin}/admin/api/trees/pictures/nodes/done`
      const headers = { Origin: editorOrigin, Cookie: cookie, 'Content-Type': 'application/json' }
      const pictures = ((await (await page.request.get(node, { headers })).json()) as { node: { images: unknown[] } }).node.images.length
      for (const file of ['barn.svg', 'channel.svg', 'drone.svg', 'greenhouse.svg', 'harbour.svg', 'orchard.svg', 'pump.svg', 'silo.svg'].slice(pictures - 1)) {
        const added = await page.request.patch(node, { headers, data: JSON.stringify({ op: 'add-image', file, credit: 'Drawing: ELSA lab', description: { en: file, nl: file } }) })
        expect(added.status(), file).toBe(200)
      }
      await page.goto(`${editorOrigin}/admin/trees/pictures/done${lang === 'en' ? '' : '?lang=nl'}`)
      const plus = page.locator('.carousel > .editor-picker--strip')
      const label = page.locator('.carousel > .editor-picker-room > .editor-picker-label')
      await expect(page.locator('.carousel-strip .thumbnail')).toHaveCount(8)
      // Below 480 the strip is its pill and the `+` a pill of 20 beside it (10.5, step 1).
      for (let width = 360; width <= 1280; width += 10) {
        const pill = width < 480
        await page.setViewportSize({ width, height: 640 })
        await expect(label).toBeHidden()
        await plus.hover()
        await expect(label).toBeVisible()
        const m = await label.evaluate((el) => {
          const box = (e: Element) => {
            const { x, y, width, height, right, bottom } = e.getBoundingClientRect()
            return { x, y, width, height, right, bottom }
          }
          const carousel = el.closest('.carousel')!
          return { label: box(el), plus: box(el.parentElement!.previousElementSibling!), room: box(el.parentElement!), carousel: box(carousel), strip: box(carousel.querySelector('.carousel-strip')!), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight }
        })
        const where = `${width} x 640: the label ${m.label.width} x ${m.label.height} at ${m.label.x}, the + at ${m.plus.x}, its column ${m.room.width}`
        const right = m.label.x >= m.plus.right - 0.5
        record(`editor, \`done\` with nine pictures, ${lang}, ${width} x 640`, 'the + label', [`${right ? 'right' : 'left'} of the +, ${m.label.width} x ${m.label.height}, its column ${m.room.width}`])
        // Inside `.carousel`, which nothing may leave (10.6) -- beside the pill it may grow up over
        // the Bubble, never down -- and holding its words: none is broken.
        expect(m.label.x, where).toBeGreaterThanOrEqual(m.carousel.x - 1)
        expect(m.label.right, where).toBeLessThanOrEqual(m.carousel.right + 1)
        if (!pill) expect(m.label.y, where).toBeGreaterThanOrEqual(m.carousel.y - 1)
        expect(m.label.bottom, where).toBeLessThanOrEqual(m.carousel.bottom + 1)
        expect(m.sw, where).toBeLessThanOrEqual(m.cw + 1)
        expect(m.sh, where).toBeLessThanOrEqual(m.ch + 1)
        // Beside the `+`, level with it.
        expect(m.label.y, where).toBeLessThan(m.plus.bottom)
        expect(m.label.bottom, where).toBeGreaterThan(m.plus.y)
        // 110 right of the `+`: 75 past the column's start beside the strip, 36 beside the pill.
        if (m.room.width >= (pill ? 146 : 185)) {
          expect(right, `${where}: right of the +`).toBe(true)
        } else {
          // Left of it, on one line of 16; beside the strip, over the strip's end.
          expect(m.label.right, `${where}: left of the +`).toBeLessThanOrEqual(m.plus.x - 7.5)
          if (!pill) expect(m.label.x, `${where}: over the strip`).toBeGreaterThanOrEqual(m.strip.x)
          expect(m.label.height, `${where}: one line`).toBeLessThanOrEqual(16 + 4 + 2 + 1)
        }
        await page.mouse.move(5, 5)
      }
      // Beside the strip at 640 wide, in en; beside the pill on a phone, in nl, the longer words.
      const [width, height] = lang === 'en' ? [640, 800] : [390, 844]
      await page.setViewportSize({ width, height })
      await plus.hover()
      await shoot(page, `strip-plus-hovered-${width}-${lang}`)
    })
  }
})

/** The two hints of `scope` -- the credit's and the description's -- with what each must say. */
function hints(scope: Locator, lang: 'en' | 'nl'): Array<{ field: string; mark: Locator; panel: Locator; text: string }> {
  return [
    { field: 'credit', text: WORDS[lang].creditHint },
    { field: 'description', text: WORDS[lang].descriptionHint },
  ].map(({ field, text }) => {
    const hint = scope.locator('.hint').filter({ visible: true }).filter({ has: scope.page().locator(`.hint-panel[id$="${field}-hint"]`) })
    return { field, mark: hint.locator('.hint-mark'), panel: hint.locator('.hint-panel'), text }
  })
}

test.describe('the information hint (31.2, 31.3)', () => {
  for (const lang of ['en', 'nl'] as const) {
    test(`in the attach Sheet: behind each label, named and described; it opens on hover and on focus and closes on leaving, on blur and on Escape, which leaves the Sheet open, ${lang}`, async ({ browser }) => {
      const { page } = await loggedIn(browser)
      await page.goto(`${editorOrigin}/admin/trees/pictures/two${lang === 'en' ? '' : '?lang=nl'}`)
      await page.locator('.carousel > .editor-picker--strip input[type="file"]').setInputFiles(PICTURE)
      const sheet = page.locator('.editor-attach-panel')
      await expect(sheet).toBeVisible()

      for (const { field, mark, panel, text } of hints(sheet, lang)) {
        await expect(mark).toHaveAccessibleName(WORDS[lang].hint)
        await expect(mark).toHaveAccessibleDescription(text)
        await expect(panel).toBeHidden()

        await mark.hover()
        await expect(panel).toBeVisible()
        await expect(panel).toHaveText(text)
        expect(await inside(panel, sheet), `${field}: the panel stays inside the Sheet`).toBe(true)
        if (lang === 'en') await shoot(page, `attach-sheet-${field}-hint`)
        await page.mouse.move(5, 5)
        await expect(panel).toBeHidden()

        await mark.focus()
        await expect(panel).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(panel).toBeHidden()
        await expect(sheet).toBeVisible()
        await expect(mark).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(panel).toBeHidden()
      }
      // With no hint open, Escape is the Sheet's again: it cancels the upload (31.2).
      await page.keyboard.press('Escape')
      await expect(sheet).toHaveCount(0)
    })

    test(`in the enlarged view: behind each label, opening on hover and on focus; Escape closes the hint and then the view, ${lang}`, async ({ browser }) => {
      const { page } = await loggedIn(browser)
      await page.goto(`${editorOrigin}/admin/trees/pictures/five${lang === 'en' ? '' : '?lang=nl'}`)
      await page.locator('.carousel-strip .thumbnail').first().click()
      const view = page.locator('.carousel-sheet > .sheet-panel')
      await expect(view).toBeVisible()
      // The description is labelled as the credit is, so its hint has a label to follow.
      await expect(view.locator('figcaption .kind').filter({ visible: true })).toHaveText(lang === 'en' ? ['Description', 'Credit'] : ['Beschrijving', 'Bronvermelding'])

      for (const { field, mark, panel, text } of hints(view, lang)) {
        await expect(mark).toHaveAccessibleName(WORDS[lang].hint)
        await expect(mark).toHaveAccessibleDescription(text)
        await mark.hover()
        await expect(panel).toBeVisible()
        expect(await inside(panel, view), `${field}: the panel stays inside the enlarged view`).toBe(true)
        if (lang === 'en') await shoot(page, `enlarged-view-${field}-hint`)
        await page.mouse.move(5, 5)
        await expect(panel).toBeHidden()

        await mark.focus()
        await expect(panel).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(panel).toBeHidden()
        await expect(view).toBeVisible()
      }
      await page.keyboard.press('Escape')
      await expect(view).toBeHidden()
    })
  }

  test('on a touch screen a tap on the "i" opens its panel, a second tap closes it, and a tap elsewhere closes it', async ({ browser }) => {
    const { page } = await loggedIn(browser, { hasTouch: true })
    await page.goto(`${editorOrigin}/admin/trees/pictures/long`)
    await page.locator('.carousel > .editor-picker--strip input[type="file"]').setInputFiles(PICTURE)
    const sheet = page.locator('.editor-attach-panel')
    await expect(sheet).toBeVisible()
    for (const { mark, panel } of hints(sheet, 'en')) {
      await mark.tap()
      await expect(panel).toBeVisible()
      await mark.tap()
      await expect(panel).toBeHidden()
      await mark.tap()
      await expect(panel).toBeVisible()
      await sheet.locator('figcaption').tap()
      await expect(panel).toBeHidden()
      await expect(sheet).toBeVisible()
    }
  })
})
