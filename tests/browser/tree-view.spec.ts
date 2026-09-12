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

test.describe('following a Branch', () => {
  test('an Answer opens its target with the current Node appended to the Trail', async ({ page }) => {
    await page.goto(ROOT)
    await page.locator('.answer--yes').click()
    await expect(page).toHaveURL(QUESTION)

    await page.locator('.answer--no').click()
    await expect(page).toHaveURL(`${QUESTION}/covered`)
  })

  test('an Option opens its target with the current Node appended to the Trail', async ({ page }) => {
    await page.goto(QUESTION)
    await page.locator('.option').first().click()
    await expect(page).toHaveURL(`${QUESTION}/social-scoring`)
    await expect(page.locator('.hint')).toHaveText('This step only explains. Go back to answer the question.')
  })

  test('a Trail Branch jumps to that entry and discards everything after it', async ({ page }) => {
    await page.goto(EXPLANATION)
    await expect(page.locator('.trail-entry')).toHaveCount(3)

    await page.locator('.trail-entry').nth(1).click()
    await expect(page).toHaveURL(QUESTION)
    await expect(page.locator('.trail-entry')).toHaveCount(1)

    await page.goto(EXPLANATION)
    await page.locator('.trail-entry').first().click()
    await expect(page).toHaveURL(ROOT)
    await expect(page.locator('.trail-entry')).toHaveCount(0)
  })

  test("an explanation Node's back Branch is the Trail entry directly above", async ({ page }) => {
    await page.goto(EXPLANATION)
    const back = page.locator('.answer--back')
    await expect(back).toContainText('Emotion recognition at work or in education')
    await back.click()
    await expect(page).toHaveURL(`${QUESTION}/emotion-recognition-at-work`)
  })

  test("a Terminal's back Branch goes up and startAgain goes to the root with an empty Trail", async ({ page }) => {
    await page.goto(TERMINAL)
    await expect(page.locator('.outcome')).toHaveText('Prohibited')
    await page.locator('.answer--back').click()
    await expect(page).toHaveURL(QUESTION)

    await page.goto(TERMINAL)
    await page.locator('.answer--start-again').click()
    await expect(page).toHaveURL(ROOT)
    await expect(page.locator('.trail-entry')).toHaveCount(0)
  })

  test('every Branch shows the title of the Node it leads to', async ({ page }) => {
    await page.goto(QUESTION)
    await expect(page.locator('.answer--yes .branch-title')).toHaveText('This is a prohibited practice')
    await expect(page.locator('.answer--no .branch-title')).toHaveText('The AI Act applies to your system')
    await expect(page.locator('.option .branch-title')).toHaveText([
      'Social scoring',
      'Emotion recognition at work or in education',
    ])
    await expect(page.locator('.trail-entry .branch-title')).toHaveText([
      'Is your AI system within the reach of the AI Act?',
    ])
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

/** Every control on the page that is shown, as `tag.class`, in document order. */
async function controls(page: Page): Promise<string[]> {
  return page.locator('a[href], button, summary').evaluateAll((elements) =>
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

      // The share button, the language link, every Trail Branch, every Option, every
      // Source, every Answer: the page's controls, exactly, and nothing skipped.
      expect(stops).toEqual(shown)
      expect(stops.filter((s) => s.startsWith('a.branch'))).toHaveLength(
        await page.locator('a.branch:visible').count(),
      )
    })
  }

  test('Enter follows a Trail Branch, an Option, an Answer and a back Branch', async ({ page }) => {
    await page.goto(EXPLANATION)
    await page.locator('.trail-entry').nth(1).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(QUESTION)

    await page.locator('.option').first().focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(`${QUESTION}/social-scoring`)

    await page.locator('.answer--back').focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(QUESTION)

    await page.locator('.answer--yes').focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(TERMINAL)
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
    await expect(page).toHaveURL(`${QUESTION}/social-scoring`)
  })
})

/**
 * A Trail of 49 entries on the example Tree: `start` visited 48 times, then the question
 * Node. A URL's Trail is not checked for adjacency (4.3), which is what makes the longest
 * Trail a URL carries reachable without a Tree of 49 Nodes.
 */
const LONG_TRAIL = `${TREE}/${Array.from({ length: 49 }, () => 'start').join('/')}/prohibited-practices`

test.describe('the Trail Sheet', () => {
  test('pages the whole Trail eight at a time, newest first, and starts over each time it opens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(LONG_TRAIL)
    const sheet = page.locator('.trail-sheet')
    const control = sheet.locator('.sheet-open')
    // Six entries or more: `start`, the collapsed middle, the last four (10.2).
    await expect(page.locator('.trail-entry:visible')).toHaveCount(5)
    await expect(control).toHaveText('44 earlier steps', { useInnerText: true })

    await control.click()
    const links = sheet.locator('.sheet-list a')
    const previous = sheet.locator('.sheet-controls button', { hasText: 'Previous' })
    const next = sheet.locator('.sheet-controls button', { hasText: 'Next' })
    await expect(links).toHaveCount(8)
    // Newest first: the parent, whose Trail is the 48 entries before it.
    await expect(links.first()).toHaveAttribute('href', `${TREE}/${Array.from({ length: 48 }, () => 'start').join('/')}/start`)
    await expect(previous).toBeDisabled()
    await expect(next).toBeEnabled()

    // 49 entries are six pages of eight and one of one.
    for (let turned = 1; turned <= 6; turned += 1) await next.click()
    await expect(links).toHaveCount(1)
    await expect(links.first()).toHaveAttribute('href', ROOT)
    await expect(next).toBeDisabled()
    await expect(previous).toBeEnabled()

    await previous.click()
    await expect(links).toHaveCount(8)
    await expect(links.first()).toHaveAttribute('href', `${TREE}/${Array.from({ length: 8 }, () => 'start').join('/')}/start`)

    // Closed and opened again, the Sheet is back at its first page.
    await page.keyboard.press('Escape')
    await expect(sheet.locator('.sheet-panel')).toBeHidden()
    await control.click()
    await expect(links).toHaveCount(8)
    await expect(previous).toBeDisabled()
  })

  test('a link out of the Trail Sheet jumps to that entry and discards everything after it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto(LONG_TRAIL)
    const sheet = page.locator('.trail-sheet')
    await sheet.locator('.sheet-open').click()
    // The fourth-newest entry: `start` reached by a Trail of 45.
    await sheet.locator('.sheet-list a').nth(3).click()
    await expect(page).toHaveURL(`${TREE}/${Array.from({ length: 46 }, () => 'start').join('/')}`)
    await expect(page.locator('.trail-sheet .sheet-open')).toHaveText('40 earlier steps', { useInnerText: true })
  })

  test('below the guaranteed height it is the parent and the control, and the control says how many it hides', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 })
    await page.goto(LONG_TRAIL)
    await expect(page.locator('.trail-entry:visible')).toHaveCount(1)
    await expect(page.locator('.trail-sheet .sheet-open')).toHaveText('48 earlier steps', { useInnerText: true })
  })
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

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('every Branch is a link that navigates, and a collapsed group is its plain list', async ({ page }) => {
    await page.goto(EXPLANATION)
    await page.locator('.answer--back').click()
    await expect(page).toHaveURL(`${QUESTION}/emotion-recognition-at-work`)
    await page.locator('.trail-entry').nth(1).click()
    await expect(page).toHaveURL(QUESTION)
    await page.locator('.option').last().click()
    await expect(page).toHaveURL(`${QUESTION}/emotion-recognition-at-work`)

    // A Sheet is a native disclosure: it opens without the script and holds every link.
    await page.setViewportSize({ width: 1024, height: 640 })
    await page.goto(QUESTION)
    const sheet = page.locator('.options-sheet')
    await sheet.locator('.sheet-open').click()
    await expect(sheet.locator('.sheet-list a')).toHaveCount(2)
    await expect(sheet.locator('.sheet-close')).toHaveCount(0)
    await sheet.locator('.sheet-list a').last().click()
    await expect(page).toHaveURL(`${QUESTION}/emotion-recognition-at-work`)
  })

  test('the Trail Sheet holds the whole Trail as pages of disclosures, one page on the panel at a time', async ({ page }) => {
    // The narrowest viewport above the floor: where 49 links on one page could never fit.
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto(LONG_TRAIL)
    const sheet = page.locator('.trail-sheet')
    await sheet.locator('.sheet-open').click()
    const links = sheet.locator('.sheet-list a')
    await expect(links).toHaveCount(49)
    await expect(sheet.locator('.sheet-controls')).toHaveCount(0)

    // Page one: the newest eight, and `next` -- a disclosure, not a button.
    await expect(links.locator('visible=true')).toHaveCount(8)
    await expect(links.first()).toBeVisible()
    const next = sheet.locator('.sheet-more:not([open]) > summary:visible')
    await expect(next).toHaveCount(1)
    await expect(next).toHaveText('Next', { useInnerText: true })

    // Turning it hides page one and shows the next eight, behind one `previous`.
    await next.click()
    await expect(links.locator('visible=true')).toHaveCount(8)
    await expect(links.first()).toBeHidden()
    await expect(links.nth(8)).toBeVisible()
    await expect(sheet.locator('.sheet-more[open] > summary:visible')).toHaveText('Previous', { useInnerText: true })

    // Six turns reach the last page: the root alone, and no `next`.
    for (let turned = 2; turned <= 6; turned += 1) await sheet.locator('.sheet-more:not([open]) > summary:visible').click()
    await expect(links.locator('visible=true')).toHaveCount(1)
    await expect(links.last()).toBeVisible()
    await expect(sheet.locator('.sheet-more:not([open])')).toHaveCount(0)

    // `previous` is the same disclosure closed again.
    await sheet.locator('.sheet-more[open] > summary:visible').click()
    await expect(links.locator('visible=true')).toHaveCount(8)
    await expect(links.last()).toBeHidden()

    await links.nth(40).click()
    await expect(page).toHaveURL(`${TREE}/${Array.from({ length: 8 }, () => 'start').join('/')}/start`)
  })
})
