/**
 * What a deployment must be true of, checked on the server a deployment runs (the
 * standalone build started by playwright.config.ts, the same command
 * `docs/deployment.md` gives):
 *
 * - nothing about the reader is stored or sent anywhere (docs/CORE_DOCUMENT.md section 8):
 *   no cookie, and no request to any host but this one;
 * - the public base URL the deployment is configured with is the one the server writes
 *   into the absolute link it emits about a page.
 *
 * A browser is the only place these can be measured: a cookie a client script sets and a
 * font a stylesheet fetches are both invisible in the markup the server sends.
 */
import { expect, test, type Page, type Request, type Response } from '@playwright/test'

const START = '/ai-act-example/start'

/** What playwright.config.ts starts the server with, so the test knows what to expect. */
const BASE_URL = 'https://elsa.example.org'

/** Every host the page asked for something from, and every Set-Cookie it was answered. */
function watch(page: Page): { hosts: Set<string>; setCookie: string[] } {
  const hosts = new Set<string>()
  const setCookie: string[] = []
  page.on('request', (request: Request) => hosts.add(new URL(request.url()).host))
  page.on('response', (response: Response) => {
    const header = response.headers()['set-cookie']
    if (header !== undefined) setCookie.push(`${response.url()}: ${header}`)
  })
  return { hosts, setCookie }
}

test('a walk sets no cookie and asks no host but the one serving the app', async ({ page, context, baseURL }) => {
  const seen = watch(page)
  const ownHost = new URL(baseURL!).host

  // A walk that touches everything the app can put on a page: a Node with Options and
  // images, an explanation child, a Terminal, the other language, and the enlarged image
  // (the one client component that runs on load) -- the places a third-party asset or a
  // cookie would hide.
  await page.goto(START)
  await page.getByRole('link', { name: 'Yes', exact: true }).click()
  await page.getByRole('link', { name: 'Social scoring' }).click()
  await page.locator('.trail-entry').last().click()
  await page.getByRole('link', { name: 'No', exact: true }).click()
  await page.goto(`${START}?lang=nl`)
  await page.locator('.thumbnail').first().click()
  await page.waitForLoadState('networkidle')

  // Not one Set-Cookie was answered, and the browser holds no cookie. What a client script
  // put in local or session storage is asserted by the walks in node-view.spec.ts and
  // trail.spec.ts; what is new here is the host list.
  expect(seen.setCookie).toEqual([])
  expect(await context.cookies()).toEqual([])
  expect([...seen.hosts]).toEqual([ownHost])
})

test('the canonical link is the deployment its public base URL names', async ({ page }) => {
  // ELSA_BASE_URL is what a deployment behind a reverse proxy sets: the server answers on
  // 127.0.0.1, and this is the address the readers of the page actually use.
  await page.goto(START)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${BASE_URL}${START}`)

  // The canonical link drops the Trail and keeps the language (docs/specs/application.md 4.1).
  await page.goto(`/ai-act-example/start/prohibited-practices?lang=nl`)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${BASE_URL}/ai-act-example/prohibited-practices?lang=nl`,
  )
})
