/**
 * What a deployment must be true of, checked on the server a deployment runs (the
 * standalone build started by playwright.config.ts, the same command
 * `docs/deployment.md` gives):
 *
 * - nothing about the reader is stored or sent anywhere (docs/CORE_DOCUMENT.md section 8):
 *   no cookie, and no request to any host but this one;
 * - the public base URL the deployment is configured with is the one the server writes
 *   into the absolute links it emits about a page, and a deployment that names none gets
 *   the same addresses on the request's own origin (a second server, started without the
 *   variable -- **[#118]**, application.md 16).
 *
 * A browser is the only place these can be measured: a cookie a client script sets and a
 * font a stylesheet fetches are both invisible in the markup the server sends.
 */
import { expect, test, type Page, type Request, type Response } from '@playwright/test'
import { NO_BASE_URL_ORIGIN, PUBLIC_BASE_URL } from '../../playwright.config.ts'
import { arrived } from './arrived.ts'

const START = '/ai-act-example/start'

/**
 * Every host the page asked for something from, and every Set-Cookie it was answered.
 *
 * The cookie half has to be read with `allHeaders()`: `response.headers()` leaves the
 * cookie-related headers out by design, so reading it would make this test pass whatever
 * the server answers. `allHeaders()` is a round trip, so the reads are collected and
 * `settled()` awaits them -- an `async` response handler would race the assertions.
 */
function watch(page: Page): { hosts: Set<string>; setCookie: string[]; settled: () => Promise<void> } {
  const hosts = new Set<string>()
  const setCookie: string[] = []
  const reads: Promise<void>[] = []
  page.on('request', (request: Request) => hosts.add(new URL(request.url()).host))
  page.on('response', (response: Response) => {
    reads.push(
      response.allHeaders().then((headers) => {
        const header = headers['set-cookie']
        if (header !== undefined) setCookie.push(`${response.url()}: ${header}`)
      }),
    )
  })
  // Draining rather than awaiting once: a response that arrives while the first batch is
  // being read would otherwise never be looked at.
  const settled = async (): Promise<void> => {
    while (reads.length > 0) await Promise.all(reads.splice(0))
  }
  return { hosts, setCookie, settled }
}

test('a walk sets no cookie and asks no host but the one serving the app', async ({ page, context, baseURL }) => {
  const seen = watch(page)
  const ownHost = new URL(baseURL!).host

  // A walk that touches everything the app can put on a page: a Node with Options and
  // an Option image, an explanation child, a Terminal, the other language, and a Sheet
  // (the client component that runs on load) -- the places a third-party asset or a
  // cookie would hide.
  await page.goto(START)
  await page.locator('.answer--yes').click()
  // The Option opens its Overlay in place; its heading is the link to the aside's own address,
  // whose page arrives with the Overlay open, and Escape uncovers the page (10.9).
  await page.locator('.options .sheet-open', { hasText: 'Social scoring' }).click()
  await page.locator('.overlay[open] h2 a').click()
  await page.keyboard.press('Escape')
  await page.locator('.tree-frame:not([inert]) .up-arrow').click()
  // The slide up brings a second frame into the document until it lands (11.3).
  await arrived(page, START)
  await page.locator('.answer--no').click()
  await page.goto(`${START}?lang=nl`)
  await page.setViewportSize({ width: 1280, height: 540 })
  await page.locator('.sources-sheet summary').click()
  await page.waitForLoadState('networkidle')

  // Not one Set-Cookie was answered, and the browser holds no cookie -- both, because a
  // cookie the browser declines to store (a Domain it does not match, SameSite=None
  // without Secure) leaves the second assertion green while every reader is answered one.
  // What a client script put in local or session storage is asserted by the walks in
  // node-view.spec.ts and trail.spec.ts; what is new here is the host list.
  await seen.settled()
  expect(seen.setCookie).toEqual([])
  expect(await context.cookies()).toEqual([])
  expect([...seen.hosts]).toEqual([ownHost])
})

test('the canonical link is the deployment its public base URL names', async ({ page }) => {
  // ELSA_BASE_URL is what a deployment behind a reverse proxy sets: the server answers on
  // 127.0.0.1, and this is the address the readers of the page actually use.
  await page.goto(START)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${PUBLIC_BASE_URL}${START}`)

  // The canonical link drops the Trail and keeps the language (docs/specs/application.md 4.1).
  await page.goto(`/ai-act-example/start/prohibited-practices?lang=nl`)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${PUBLIC_BASE_URL}/ai-act-example/prohibited-practices?lang=nl`,
  )
})

test("without a public base URL the canonical link is the request's own origin", async ({ page }) => {
  // The default deployment of docs/deployment.md: ELSA_BASE_URL unset. **[#118]** This
  // test read "the canonical link is the path" until 16.3 made the head, the sitemap and
  // the JSON-LD render one address set, which has no relative form: a sitemap is read away
  // from the page that served it. application.md 4.1's canonical bullet and
  // ADR-11-public-base-url.md carry the amendment; what the link points *at* -- the Node,
  // the Trail dropped, the language kept -- is unchanged, as the second half below shows.
  await page.goto(`${NO_BASE_URL_ORIGIN}${START}`)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${NO_BASE_URL_ORIGIN}${START}`)

  await page.goto(`${NO_BASE_URL_ORIGIN}/ai-act-example/start/prohibited-practices?lang=nl`)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${NO_BASE_URL_ORIGIN}/ai-act-example/prohibited-practices?lang=nl`,
  )
})

/**
 * **[#118]** Every route of sections 15 and 16, swept for a cookie. The list is one array
 * so that a route added without a line here is visibly absent: **#120** adds `/robots.txt`
 * and `/sitemap.xml`, **#121** `/<tree-id>/tree.json`, `/schemas/elsa-tree-4.json` and
 * `/llms.txt`.
 */
const DOCUMENT_ROUTES = ['/robots.txt', '/sitemap.xml']

test('the documents of section 16 set no cookie and leave the jar empty', async ({ page, context }) => {
  const seen = watch(page)

  for (const route of DOCUMENT_ROUTES) {
    const answer = await page.goto(route)

    expect(answer?.status(), route).toBe(200)
  }

  await seen.settled()
  expect(seen.setCookie).toEqual([])
  expect(await context.cookies()).toEqual([])
})
