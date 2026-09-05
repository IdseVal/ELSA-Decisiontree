/**
 * The Trail and the shareable link in a real browser: what markup alone cannot show --
 * where a click lands, what the clipboard actually holds, whether a stranger opening the
 * link sees the same path, and that none of it leaves a trace on the reader's machine.
 *
 * The server serves `trees/ai-act-example` (see playwright.config.ts).
 */
import { expect, test, type Page } from '@playwright/test'

const START = '/ai-act-example/start'
const CHILD = '/ai-act-example/start/prohibited-practices/social-scoring'

/** Walks root -> yes -> an Option -> its child, the way a reader reaches an explanation. */
async function walkToChild(page: Page): Promise<void> {
  await page.goto(START)
  await page.getByRole('link', { name: 'Yes', exact: true }).click()
  await page.getByRole('link', { name: 'Social scoring' }).click()
  await expect(page).toHaveURL(CHILD)
}

/** The text of every Trail entry on screen, top to bottom. */
async function trail(page: Page): Promise<string[]> {
  return page.locator('.trail-entry').allTextContents()
}

test('walking the tree builds the Trail, and it is above the Node', async ({ page }) => {
  await walkToChild(page)

  expect(await trail(page)).toEqual([
    'Is your AI system within the reach of the AI Act?',
    'Does your system do any of the prohibited practices?',
  ])

  // "A line upward from the current Node": the Trail sits above the title on screen.
  const trailBox = await page.locator('.trail').boundingBox()
  const titleBox = await page.getByRole('heading', { level: 1 }).boundingBox()
  expect(trailBox!.y + trailBox!.height).toBeLessThanOrEqual(titleBox!.y)
})

test('clicking a Trail entry jumps back and discards the Trail after it', async ({ page }) => {
  await walkToChild(page)

  // The second entry: back to that Node, with the one entry before it left standing.
  await page.locator('.trail-entry').nth(1).click()
  await expect(page).toHaveURL('/ai-act-example/start/prohibited-practices')
  expect(await trail(page)).toEqual(['Is your AI system within the reach of the AI Act?'])

  // The first entry: back to the root, with nothing left to go back to.
  await walkToChild(page)
  await page.locator('.trail-entry').first().click()
  await expect(page).toHaveURL(START)
  expect(await trail(page)).toEqual([])
})

test('a Trail entry is reached and followed by the keyboard alone', async ({ page }) => {
  await walkToChild(page)

  // The Trail is the first thing on the page, so it is the first thing the tab key reaches.
  await page.keyboard.press('Tab')
  await expect(page.locator('.trail-entry').first()).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('.trail-entry').nth(1)).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/ai-act-example/start/prohibited-practices')
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
 * denies the write (an insecure context, a withheld permission), `absent` is a browser that
 * has no clipboard API at all. Neither can be produced by a permission grant.
 */
async function breakClipboard(page: Page, how: 'refused' | 'absent'): Promise<void> {
  await page.addInitScript((how) => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: how === 'refused' ? { writeText: () => Promise.reject(new Error('denied')) } : undefined,
    })
  }, how)
}

for (const how of ['refused', 'absent'] as const) {
  test(`the link is offered by hand, not claimed copied, when the clipboard is ${how}`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))
    await breakClipboard(page, how)
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

test('a shared link shows the recipient the same Node and the same Trail', async ({
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
  expect(await trail(theirPage)).toEqual(await trail(page))
  await recipient.close()
})

test('a shared link in another language shows that language on both ends', async ({ page }) => {
  await page.goto(`${CHILD}?lang=nl`)

  expect(await trail(page)).toEqual([
    'Valt uw AI-systeem binnen het bereik van de AI-verordening?',
    'Verricht uw systeem een van de verboden praktijken?',
  ])
  // Going back keeps the language: it is in the link, not in a cookie.
  await page.locator('.trail-entry').first().click()
  await expect(page).toHaveURL(`${START}?lang=nl`)
})

test('a Node opened by its own URL offers the way into the walk', async ({ page }) => {
  await page.goto('/ai-act-example/social-scoring')

  expect(await trail(page)).toEqual(['Start'])
  await page.locator('.trail-entry').first().click()
  await expect(page).toHaveURL(START)
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
  await page.getByRole('link', { name: 'Start' }).click()
  await expect(page).toHaveURL(START)
})

test('nothing about the reader is stored while walking, going back or sharing', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await walkToChild(page)
  await page.getByRole('button', { name: 'Copy link' }).click()
  await expect(page.locator('.share-said')).toHaveText('Link copied')
  await page.locator('.trail-entry').first().click()

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

  test('the Trail is still the way back; the address bar is still the share link', async ({
    page,
  }) => {
    await page.goto(CHILD)

    expect(await trail(page)).toHaveLength(2)
    await page.locator('.trail-entry').nth(1).click()
    await expect(page).toHaveURL('/ai-act-example/start/prohibited-practices')
  })
})
