/**
 * The way back -- the up arrow that replaced the drawn Trail (#82) -- and the shareable link
 * in a real browser: what markup alone cannot show -- where a click lands, what the
 * clipboard actually holds, whether a stranger opening the link sees the same path, and
 * that none of it leaves a trace on the reader's machine.
 *
 * The server serves `trees/ai-act-example` (see playwright.config.ts).
 */
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { arrived } from './arrived.ts'

const START = '/ai-act-example/start'
const CHILD = '/ai-act-example/start/prohibited-practices/social-scoring'

/** Walks root -> yes -> an Option -> its child, the way a reader reaches an explanation. */
async function walkToChild(page: Page): Promise<void> {
  await page.goto(START)
  await page.locator('.answer--yes').click()
  await page.locator('.options').getByRole('link', { name: 'Social scoring' }).click()
  await arrived(page, CHILD)
}

/** The up arrow of the Node on screen, outside the inert neighbour frames of the slide. */
function upArrow(page: Page) {
  return page.locator('.up-arrow:not([inert] *)')
}

test('the up arrow sits on the Bubble\'s top outline, and no Trail is drawn', async ({ page }) => {
  await walkToChild(page)

  const arrow = await upArrow(page).boundingBox()
  const bubble = await page.locator('.bubble:not([inert] *)').boundingBox()
  const title = await page.getByRole('heading', { level: 1 }).boundingBox()
  // Centred across, its middle on the outline (1 pixel for sub-pixel rounding), above the title.
  expect(Math.abs(arrow!.x + arrow!.width / 2 - (bubble!.x + bubble!.width / 2))).toBeLessThanOrEqual(1)
  expect(Math.abs(arrow!.y + arrow!.height / 2 - bubble!.y)).toBeLessThanOrEqual(1)
  expect(arrow!.y + arrow!.height).toBeLessThanOrEqual(title!.y)
  expect(arrow!.width).toBe(48)
  expect(arrow!.height).toBe(48)
  await expect(page.locator('[class*="trail"]')).toHaveCount(0)
})

test("at a phone width the up arrow keeps its 48 pixels, clear of the chrome bar, the text area and a Terminal's badge", async ({ page }) => {
  // 10.1 and 10.2 fix the arrow at 48, and 10.5 never gives it up: the phone's 10-pixel rim
  // widens the band above the Bubble instead.
  await page.setViewportSize({ width: 360, height: 640 })
  for (const url of [CHILD, '/ai-act-example/start/prohibited-practices/prohibited']) {
    await page.goto(url)
    const arrow = (await upArrow(page).boundingBox())!
    const header = (await page.locator('header').boundingBox())!
    const text = (await page.locator('.bubble:not([inert] *) .bubble-text').boundingBox())!
    expect(arrow.width, url).toBe(48)
    expect(arrow.height, url).toBe(48)
    expect(arrow.y, `${url}: below the chrome bar`).toBeGreaterThanOrEqual(header.y + header.height)
    expect(arrow.y + arrow.height, `${url}: above the text area`).toBeLessThanOrEqual(text.y)

    const outcome = page.locator('.bubble:not([inert] *) .outcome')
    if ((await outcome.count()) > 0) {
      const badge = (await outcome.boundingBox())!
      expect(badge.y, `${url}: the badge under the arrow's foot`).toBeGreaterThanOrEqual(arrow.y + arrow.height)
    }
  }
})

test('clicking the arrow on /<tree>/start/<a>/<b> lands on /<tree>/start/<a>, and again on /<tree>/start', async ({ page }) => {
  await walkToChild(page)
  await expect(upArrow(page)).toHaveAccessibleName('Back to: Does your system do any of the prohibited practices?')

  await upArrow(page).click()
  await arrived(page, '/ai-act-example/start/prohibited-practices')
  expect(new URL(page.url()).pathname).toBe('/ai-act-example/start/prohibited-practices')

  // One step at a time, the Trail after each step discarded, to the root, which has no arrow.
  await expect(upArrow(page)).toHaveAccessibleName('Back to: Is your AI system within the reach of the AI Act?')
  await upArrow(page).click()
  await arrived(page, START)
  await expect(upArrow(page)).toHaveCount(0)
})

test('the up arrow is reached and followed by the keyboard alone', async ({ page }) => {
  await walkToChild(page)

  // Issue #9 put the language switch above the content as the page chrome, issue #40 put
  // the Tree's logo beside it and issue #41 the share button, so the tab key reaches the
  // whole bar first; the up arrow is the first thing in the content itself. The bar is
  // counted rather than written down, so a Tree with no logo and a Tree with one both walk
  // the same way here.
  const chrome = await page.locator('.page-chrome a, .page-chrome button').count()
  for (let i = 0; i < chrome + 1; i++) await page.keyboard.press('Tab')
  await expect(upArrow(page)).toBeFocused()

  await page.keyboard.press('Enter')
  await arrived(page, '/ai-act-example/start/prohibited-practices')
})

test('the share button copies the page it is on, and says so', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await walkToChild(page)

  await expect(page.locator('.share-said')).toHaveText('')
  await page.getByRole('button', { name: 'Copy link' }).click()

  await expect(page.locator('.share-said')).toHaveText('Link copied')
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toBe(new URL(CHILD, page.url()).toString())
})

/**
 * Replaces the page's clipboard before any of its script runs: `refused` is a clipboard that
 * denies the write (a withheld permission), `absent` is a browser that has no clipboard API
 * at all. Neither can be produced by a permission grant. With `selection` false the older
 * copy of a selection is refused too, so no way of copying is left.
 */
async function breakClipboard(page: Page, how: 'refused' | 'absent', selection = true): Promise<void> {
  await page.addInitScript(
    ([how, selection]) => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: how === 'refused' ? { writeText: () => Promise.reject(new Error('denied')) } : undefined,
      })
      if (!selection) document.execCommand = () => false
    },
    [how, selection] as const,
  )
}

for (const how of ['refused', 'absent'] as const) {
  test(`the link is offered by hand, not claimed copied, when the clipboard is ${how} and a selection cannot be copied`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))
    await breakClipboard(page, how, false)
    await walkToChild(page)

    await page.getByRole('button', { name: 'Copy link' }).click()

    // The offer is announced, not just drawn: it is inside the live region the button owns,
    // which is where a reader who cannot see it will be told about it.
    const said = page.locator('.share-said')
    await expect(said).toHaveAttribute('role', 'status')
    await expect(said).toContainText('Copy this link yourself:')
    await expect(said.locator('.share-by-hand code')).toHaveText(page.url())
    // And the button never claims a copy that did not happen.
    await expect(said).not.toContainText('Link copied')
    expect(errors).toEqual([])
  })
}

/**
 * What the clipboard holds, read from a page of the test origin that nothing was done to: the
 * page under test may have no clipboard API left to read it with. Chromium's clipboard is
 * one for the whole browser, so any page of it reads what another page copied.
 */
async function clipboardOf(context: BrowserContext, origin: string): Promise<string> {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin })
  const reader = await context.newPage()
  await reader.goto(`${origin}${START}`)
  const text = await reader.evaluate(() => navigator.clipboard.readText())
  await reader.close()
  return text
}

// Issue #86: the owner clicked `Copy link` and got a link to copy by hand instead of a copy.
for (const how of ['refused', 'absent'] as const) {
  test(`one click copies the page's URL when the clipboard is ${how}`, async ({ page, context, baseURL }) => {
    await breakClipboard(page, how)
    await walkToChild(page)

    const button = page.getByRole('button', { name: 'Copy link' })
    await button.focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('.share-said')).toHaveText('Link copied')
    // The selection copied from moved the focus; a keyboard reader is given their place back.
    await expect(button).toBeFocused()
    expect(await clipboardOf(context, baseURL!)).toBe(page.url())
  })
}

test('one click copies the URL in the address bar on a plain http:// address that is not this machine', async ({
  playwright,
  baseURL,
}) => {
  // What the owner did: a browser treats such an origin as insecure and gives it no
  // `navigator.clipboard` at all. The name is resolved to the test server, so the page is the
  // same one, served to an insecure context -- which needs a browser launched to resolve it.
  const browser = await playwright.chromium.launch({
    args: ['--host-resolver-rules=MAP elsa-insecure.test 127.0.0.1'],
  })
  try {
    const context = await browser.newContext()
    const page = await context.newPage()
    const insecure = baseURL!.replace('127.0.0.1', 'elsa-insecure.test')
    await page.goto(`${insecure}${CHILD}?lang=nl`)
    expect(await page.evaluate(() => [window.isSecureContext, typeof navigator.clipboard])).toEqual([
      false,
      'undefined',
    ])
    // Something else on the clipboard first, so a click that copies nothing is caught.
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL! })
    const reader = await context.newPage()
    await reader.goto(`${baseURL}${START}`)
    await reader.evaluate(() => navigator.clipboard.writeText('not the link'))
    await reader.close()

    await page.getByRole('button', { name: 'Kopieer link' }).click()

    await expect(page.locator('.share-said')).toHaveText('Link gekopieerd')
    expect(await clipboardOf(context, baseURL!)).toBe(page.url())
    expect(page.url()).toBe(`${insecure}${CHILD}?lang=nl`)
  } finally {
    await browser.close()
  }
})

test('a shared link shows the recipient the same Node and the same way back', async ({
  page,
  context,
  browser,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await walkToChild(page)
  await page.getByRole('button', { name: 'Copy link' }).click()
  const link = await page.evaluate(() => navigator.clipboard.readText())

  // A fresh context: another browser, another person, nothing carried over.
  const recipient = await browser.newContext()
  const theirPage = await recipient.newPage()
  await theirPage.goto(link)

  await expect(theirPage.getByRole('heading', { level: 1 })).toHaveText('Social scoring')
  await expect(upArrow(theirPage)).toHaveAttribute('href', (await upArrow(page).getAttribute('href'))!)
  expect(theirPage.url()).toBe(page.url())
  await recipient.close()
})

test('a shared link in another language shows that language on both ends', async ({ page }) => {
  await page.goto(`${CHILD}?lang=nl`)

  await expect(upArrow(page)).toHaveAccessibleName('Terug naar: Verricht uw systeem een van de verboden praktijken?')
  // Going back keeps the language: it is in the link, not in a cookie.
  await upArrow(page).click()
  await arrived(page, '/ai-act-example/start/prohibited-practices?lang=nl')
})

test('a Node opened by its own URL has no up arrow, and startAgain is its way into the walk', async ({ page }) => {
  await page.goto('/ai-act-example/social-scoring')

  await expect(upArrow(page)).toHaveCount(0)
  await page.locator('.answer--start-again:not([inert] *)').click()
  await arrived(page, START)
})

test('an unknown Node and a malformed Trail answer 404, never a server error', async ({ page }) => {
  const fiftyOne = Array.from({ length: 51 }, () => 'start').join('/')
  for (const url of [
    '/ai-act-example/no-such-node', // well formed, not a Node of this Tree
    '/ai-act-example/Start', // malformed: ids are lower case
    '/ai-act-example/ghost/start', // the Trail names a Node that does not exist
    '/ai-act-example/start/..%2F..%2Fetc%2Fpasswd/social-scoring', // a path escape in the Trail
    `/ai-act-example/${fiftyOne}`, // more than the fifty ids of application.md 4.3
    '/other-tree/start', // another Tree than the one served
  ]) {
    const response = await page.request.get(url)

    expect(response.status(), url).toBe(404)
  }

  // The answer is the 404 page of application.md 4.3, with its link to the start.
  await page.goto('/ai-act-example/ghost/start')
  await page.getByRole('link', { name: 'Start again' }).click()
  await arrived(page, START)
})

test('nothing about the reader is stored while walking, going back or sharing', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await walkToChild(page)
  await page.getByRole('button', { name: 'Copy link' }).click()
  await expect(page.locator('.share-said')).toHaveText('Link copied')
  await upArrow(page).click()

  // The whole walk is in the URL: no cookie, no local storage, no session storage (8).
  expect(await context.cookies()).toEqual([])
  expect(
    await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 })
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('the up arrow is still the way back; the address bar is still the share link', async ({
    page,
  }) => {
    await page.goto(CHILD)

    await upArrow(page).click()
    await arrived(page, '/ai-act-example/start/prohibited-practices')
    await upArrow(page).click()
    await arrived(page, START)
  })
})
