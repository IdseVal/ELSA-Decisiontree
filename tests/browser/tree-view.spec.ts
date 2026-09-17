/**
 * The tree view in a real browser (docs/specs/application.md section 10): what a click on
 * each kind of Branch does to the URL, whether the keyboard alone reaches and operates
 * every control on the page, what the Sheets do when opened, and the screenshots issue #41
 * owes at the smallest and the largest guaranteed viewport. What the markup says is
 * `tests/views.test.tsx`; what the layout measures is `no-scroll.spec.ts`.
 *
 * Screenshots go to the gitignored results folder unless `ELSA_SHOTS=1` asks for the
 * tracked set in `docs/screenshots/issue-41/` -- the convention of
 * tests/first-tree/walk.spec.ts: the app renders in the fonts and at the device pixel
 * ratio the machine has, so a committed PNG records one machine's rendering.
 *
 * The server serves `trees/ai-act-example` (see playwright.config.ts).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { arrived } from './arrived.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const SHOTS =
  process.env.ELSA_SHOTS === '1'
    ? path.join(repo, 'docs', 'screenshots', 'issue-41')
    : path.join(repo, 'tests', 'browser', '.results', 'shots')

const TREE = '/ai-act-example'
const ROOT = `${TREE}/start`
const QUESTION = `${ROOT}/prohibited-practices`
const EXPLANATION = `${QUESTION}/emotion-recognition-at-work/social-scoring`
const TERMINAL = `${QUESTION}/prohibited`

/** The up arrow of the Node on screen (10.2). */
const UP = '.up-arrow'

test.describe('following a Branch', () => {
  test('an Answer opens its target with the current Node appended to the Trail', async ({ page }) => {
    await page.goto(ROOT)
    await page.locator('.answer--yes').click()
    await arrived(page, QUESTION)

    await page.locator('.answer--no').click()
    await arrived(page, `${QUESTION}/covered`)
  })

  test('an Option opens its target with the current Node appended to the Trail', async ({ page }) => {
    await page.goto(QUESTION)
    await page.locator('.option').first().click()
    await arrived(page, `${QUESTION}/social-scoring`)
    await expect(page.locator('.hint')).toHaveText('This step only explains. Go back to answer the question.')
  })

  test('the up arrow goes one step up at a time, discarding the Trail after it, to the root', async ({ page }) => {
    await page.goto(EXPLANATION)
    await page.locator(UP).click()
    await arrived(page, `${QUESTION}/emotion-recognition-at-work`)
    await page.locator(UP).click()
    await arrived(page, QUESTION)
    await page.locator(UP).click()
    await arrived(page, ROOT)
    await expect(page.locator(UP)).toHaveCount(0)
  })

  test("an explanation Node's one button is startAgain, to the root with an empty Trail", async ({ page }) => {
    await page.goto(EXPLANATION)
    await expect(page.locator('.answers .branch')).toHaveCount(1)
    await page.locator('.answer--start-again').click()
    await arrived(page, ROOT)
  })

  test("a Terminal's up arrow goes up and startAgain goes to the root with an empty Trail", async ({ page }) => {
    await page.goto(TERMINAL)
    await expect(page.locator('.outcome')).toHaveText('Prohibited')
    await page.locator(UP).click()
    await arrived(page, QUESTION)

    await page.goto(TERMINAL)
    await page.locator('.answer--start-again').click()
    await arrived(page, ROOT)
    await expect(page.locator(UP)).toHaveCount(0)
  })

  test('every Branch shows the title of the Node it leads to', async ({ page }) => {
    await page.goto(QUESTION)
    await expect(page.locator('.answer--yes .branch-title')).toHaveText('This is a prohibited practice')
    await expect(page.locator('.answer--no .branch-title')).toHaveText('The AI Act applies to your system')
    await expect(page.locator('.option .branch-title')).toHaveText([
      'Social scoring',
      'Emotion recognition at work or in education',
    ])
    await expect(page.locator(UP)).toHaveAccessibleName('Back to: Is your AI system within the reach of the AI Act?')
  })
})

/** What the browser is focused on, as `tag.class`, or '' when nothing is. */
async function focused(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement
    if (!active || active === document.body) return ''
    return `${active.tagName.toLowerCase()}${[...active.classList].map((c) => `.${c}`).join('')}`
  })
}

/** Every control on the page that is shown and enabled, as `tag.class`, in document order. */
async function controls(page: Page): Promise<string[]> {
  // A disabled button is no tab stop: the Carousel's previous and next are, on a strip that fits its row.
  return page.locator('a[href], button:not(:disabled), summary').evaluateAll((elements) =>
    elements
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => `${el.tagName.toLowerCase()}${[...el.classList].map((c) => `.${c}`).join('')}`),
  )
}

/** Tabs through the whole page from the top and returns every stop, until the focus leaves the page. */
async function tabStops(page: Page): Promise<string[]> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  const stops: string[] = []
  for (let step = 0; step < 60; step += 1) {
    await page.keyboard.press('Tab')
    const at = await focused(page)
    // Focus left the page, or came round to the first stop again.
    if (at === '' || at === stops[0]) break
    stops.push(at)
  }
  return stops
}

test.describe('the keyboard', () => {
  for (const [what, url] of [
    ['a question Node with Options', QUESTION],
    ['an explanation Node', EXPLANATION],
    ['a Terminal', TERMINAL],
  ] as const) {
    test(`reaches every control on ${what} with Tab, in document order`, async ({ page }) => {
      await page.goto(url)
      const shown = await controls(page)
      const stops = await tabStops(page)

      // The share button, the language link, the up arrow, every Option, every Source,
      // every Answer: the page's controls, exactly, and nothing skipped.
      expect(stops).toEqual(shown)
      expect(stops.filter((s) => s.startsWith('a.branch'))).toHaveLength(
        await page.locator('a.branch:visible').count(),
      )
      expect(stops.filter((s) => s === 'a.up-arrow')).toHaveLength(1)
    })
  }

  test('Enter follows the up arrow, an Option, an Answer and startAgain', async ({ page }) => {
    await page.goto(`${QUESTION}/emotion-recognition-at-work`)
    await page.locator(UP).focus()
    await page.keyboard.press('Enter')
    await arrived(page, QUESTION)

    await page.locator('.option').first().focus()
    await page.keyboard.press('Enter')
    await arrived(page, `${QUESTION}/social-scoring`)

    await page.locator(UP).focus()
    await page.keyboard.press('Enter')
    await arrived(page, QUESTION)

    await page.locator('.answer--yes').focus()
    await page.keyboard.press('Enter')
    await arrived(page, TERMINAL)

    await page.locator('.answer--start-again').focus()
    await page.keyboard.press('Enter')
    await arrived(page, ROOT)
  })

  test('a Sheet opens with Enter, lists its links, closes with Escape and gives the focus back', async ({ page }) => {
    // Below the guaranteed height the Sources collapse to one control (10.5, step 5).
    await page.setViewportSize({ width: 1280, height: 540 })
    await page.goto(EXPLANATION)
    const sheet = page.locator('.sources-sheet')
    const control = sheet.locator('.sheet-open')
    await expect(control).toBeVisible()
    await expect(control).toHaveText('Sources (3)')

    await control.focus()
    await page.keyboard.press('Enter')
    await expect(sheet.locator('.sheet-panel')).toBeVisible()
    await expect(sheet.locator('.sheet-list a')).toHaveCount(3)
    await expect(sheet.locator('.sheet-list a').first()).toHaveAttribute('target', '_blank')
    await expect(sheet.locator('.sheet-close')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(sheet.locator('.sheet-panel')).toBeHidden()
    await expect(control).toBeFocused()
  })

  test('the collapsed Options open as a Sheet of links to the same targets', async ({ page }) => {
    // Below 1280 px the columns move under the Answers, and with no height to take there
    // they collapse to one control (10.5, steps 3 and 4).
    await page.setViewportSize({ width: 1024, height: 640 })
    await page.goto(QUESTION)
    const sheet = page.locator('.options-sheet')
    await expect(page.locator('.options-columns')).toBeHidden()
    await expect(sheet.locator('.sheet-open')).toHaveText('What this covers (2)')

    await sheet.locator('.sheet-open').click()
    const links = sheet.locator('.sheet-list a')
    await expect(links).toHaveText(['Social scoring', 'Emotion recognition at work or in education'])
    await links.first().click()
    await arrived(page, `${QUESTION}/social-scoring`)
  })
})

/**
 * A Trail of 49 entries on the example Tree: `start` visited 48 times, then the question
 * Node. A URL's Trail is not checked for adjacency (4.3), which is what makes the longest
 * Trail a URL carries reachable without a Tree of 49 Nodes.
 */
const LONG_TRAIL = `${TREE}/${Array.from({ length: 49 }, () => 'start').join('/')}/prohibited-practices`

test('on the longest Trail a URL carries, the up arrow is the one way back drawn, and goes one entry up', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  await page.goto(LONG_TRAIL)
  await expect(page.locator(UP)).toHaveCount(1)
  await expect(page.locator('[class*="trail"]')).toHaveCount(0)

  await page.locator(UP).click()
  // `start` reached by a Trail of 48: the entry directly above, the Trail after it discarded.
  await arrived(page, `${TREE}/${Array.from({ length: 49 }, () => 'start').join('/')}`)
})

/** The four pages the issue asks screenshots of, at the two ends of the guarantee (10.4). */
const SHOT_PAGES = [
  ['root-question-no-options', ROOT],
  ['question-with-options', QUESTION],
  ['explanation-three-entry-trail', EXPLANATION],
  ['terminal', TERMINAL],
] as const

for (const [width, height] of [
  [1280, 640],
  [2560, 1440],
] as const) {
  test(`the four pages at ${width} x ${height}, screenshot`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    for (const [name, url] of SHOT_PAGES) {
      await page.goto(url)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      // The viewport is the page: `fullPage` would be the same picture, by the rule of 10.6.
      await page.screenshot({ path: path.join(SHOTS, `${name}-${width}x${height}.png`) })
    }
  })
}

test.describe('the minimum-size notice', () => {
  // At and below the floor the notice names the dimension that is short (10.4): a
  // half-height desktop window is told to grow taller, not that it needs 320 by 480.
  const cases = [
    { viewport: [1280, 480], what: 'a wide, short window', width: false, height: true },
    { viewport: [320, 900], what: 'a narrow, tall window', width: true, height: false },
    { viewport: [320, 480], what: "the floor's corner", width: true, height: true },
  ] as const

  for (const { viewport, what, width, height } of cases) {
    const [w, h] = viewport
    test(`${what}, ${w} x ${h}, names the dimension that is short`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await page.goto(ROOT)
      await expect(page.locator('.tree-layer')).toBeHidden()
      const notice = page.locator('.minimum-size')
      await expect(notice).toBeVisible()
      await expect(notice).toContainText('This tool needs a larger window.')
      await expect(notice.locator('.minimum-width')).toBeVisible({ visible: width })
      await expect(notice.locator('.minimum-height')).toBeVisible({ visible: height })
    })
  }

  test('is not on the page one pixel above the floor in both dimensions', async ({ page }) => {
    await page.setViewportSize({ width: 321, height: 481 })
    await page.goto(ROOT)
    await expect(page.locator('.minimum-size')).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('every Branch is a link that navigates, and a collapsed group is its plain list', async ({ page }) => {
    await page.goto(EXPLANATION)
    await page.locator(UP).click()
    await arrived(page, `${QUESTION}/emotion-recognition-at-work`)
    await page.locator(UP).click()
    await arrived(page, QUESTION)
    await page.locator('.option').last().click()
    await arrived(page, `${QUESTION}/emotion-recognition-at-work`)

    // A Sheet is a native disclosure: it opens without the script and holds every link.
    await page.setViewportSize({ width: 1024, height: 640 })
    await page.goto(QUESTION)
    const sheet = page.locator('.options-sheet')
    await sheet.locator('.sheet-open').click()
    await expect(sheet.locator('.sheet-list a')).toHaveCount(2)
    await expect(sheet.locator('.sheet-close')).toHaveCount(0)
    await sheet.locator('.sheet-list a').last().click()
    await arrived(page, `${QUESTION}/emotion-recognition-at-work`)
  })
})
