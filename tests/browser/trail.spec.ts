/**
 * The Trail and the shareable link in a real browser: what markup alone cannot show --
 * where a click lands, what the clipboard actually holds, whether a stranger opening the
 * link sees the same path, and that none of it leaves a trace on the reader's machine.
 *
 * The server serves `trees/ai-act-example` (see playwright.config.ts).
 */
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { arrived } from './arrived.ts'

const START = '/ai-act-example/start'
// A path ending at an explanation Node renders its parent's page (10.9), so an Option adds
// nothing to the Trail: the child under test is the Terminal two Answers deep.
const CHILD = '/ai-act-example/start/prohibited-practices/prohibited'

/** Walks root -> yes -> yes, the way a reader reaches a Terminal two entries deep. */
async function walkToChild(page: Page): Promise<void> {
  await page.goto(START)
  await page.locator('.answer--yes').click()
  await arrived(page, '/ai-act-example/start/prohibited-practices')
  await page.locator('.answer--yes').click()
  await arrived(page, CHILD)
}

/**
 * Back to the Trail's first entry, the root. The band of 10.1 shows the parent on one line
 * and the rest behind `trailMore(n)` (#81), so the root is followed from the Trail Sheet.
 */
async function backToRoot(page: Page): Promise<void> {
  await page.locator('.trail-sheet .sheet-open').click()
  await page.locator('.trail-sheet .sheet-list a').last().click()
}

/** The text of every Trail entry in the markup, top to bottom, the ones behind `trailMore(n)` included. */
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
  await arrived(page, '/ai-act-example/start/prohibited-practices')
  expect(await trail(page)).toEqual(['Is your AI system within the reach of the AI Act?'])

  // The first entry: back to the root, with nothing left to go back to.
  await walkToChild(page)
  await backToRoot(page)
  await arrived(page, START)
  expect(await trail(page)).toEqual([])
})

test('a Trail entry is reached and followed by the keyboard alone', async ({ page }) => {
  await walkToChild(page)

  // Issue #9 put the language switch above the content as the page chrome, issue #40 put
  // the Tree's logo beside it and issue #41 the share button, so the tab key reaches the
  // whole bar first; the Trail is still the first thing in the content itself. The bar is
  // counted rather than written down, so a Tree with no logo and a Tree with one both walk
  // the same way here. The band shows `trailMore(n)` and then the parent (#81).
  const chrome = await page.locator('.page-chrome a, .page-chrome button').count()
  for (let i = 0; i < chrome + 1; i++) await page.keyboard.press('Tab')
  await expect(page.locator('.trail-sheet .sheet-open')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('.trail-entry').nth(1)).toBeFocused()

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

  await expect(theirPage.getByRole('heading', { level: 1 })).toHaveText('This is a prohibited practice')
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
  await backToRoot(page)
  await arrived(page, `${START}?lang=nl`)
})

test('a Node opened by its own URL offers the way into the walk', async ({ page }) => {
  await page.goto('/ai-act-example/social-scoring')

  expect(await trail(page)).toEqual(['Start'])
  await page.locator('.trail-entry').first().click()
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
  await page.getByRole('link', { name: 'Start' }).click()
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
  await backToRoot(page)

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
    await arrived(page, '/ai-act-example/start/prohibited-practices')
  })
})
