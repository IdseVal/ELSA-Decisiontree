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
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NO_BASE_URL_ORIGIN, PUBLIC_BASE_URL } from '../../playwright.config.ts'
import { arrived } from './arrived.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const START = '/ai-act-example/start'
const DATASET = '/ai-act-example/tree.json'
const SCHEMA = '/schemas/elsa-tree-4.json'

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
const DOCUMENT_ROUTES = ['/robots.txt', '/sitemap.xml', '/llms.txt', DATASET, SCHEMA]

test('the documents of sections 15 and 16 set no cookie and leave the jar empty', async ({ page, context }) => {
  const seen = watch(page)

  for (const route of DOCUMENT_ROUTES) {
    const answer = await page.goto(route)

    expect(answer?.status(), route).toBe(200)
  }

  await seen.settled()
  expect(seen.setCookie).toEqual([])
  expect(await context.cookies()).toEqual([])
})

/**
 * **[#121]** The two routes of section 15, against the server a deployment runs. The
 * header table of 15.2 is asserted in full here rather than in a unit test because what a
 * route hands back and what a server sends are not the same thing: the framework adds
 * headers of its own, and a `304` is assembled by the server and not by the handler.
 */
test.describe('the dataset endpoint (15)', () => {
  test('the Tree file answers with every header of 15.2, and the schema with its own licence', async ({
    request,
  }) => {
    const dataset = await request.get(DATASET)
    const schema = await request.get(SCHEMA)

    for (const [route, answer] of [
      [DATASET, dataset],
      [SCHEMA, schema],
    ] as const) {
      const headers = answer.headers()

      expect(answer.status(), route).toBe(200)
      expect(headers['content-type'], route).toBe('application/json; charset=utf-8')
      expect(headers['cache-control'], route).toBe('public, max-age=3600')
      expect(headers['access-control-allow-origin'], route).toBe('*')
      expect(headers['access-control-allow-methods'], route).toBe('GET, HEAD')
      expect(headers['x-content-type-options'], route).toBe('nosniff')
      expect(headers['content-security-policy'], route).toBe("default-src 'none'; sandbox")
      expect(headers['content-disposition'], route).toBe('inline')
      // A strong tag: a weak one (`W/"..."`) promises only that the bytes are equivalent,
      // and this route's whole claim is that they are identical (15.3).
      expect(headers['etag'], route).toMatch(/^"[^"]+"$/)
      // Never sent, and not a precedent for any future route that gains a credential: a
      // cross-origin read here reaches nothing a plain `curl` does not (15.2).
      expect(headers['access-control-allow-credentials'], route).toBeUndefined()
      expect(headers['set-cookie'], route).toBeUndefined()
    }

    // The licence travels with the bytes. The Tree is content and the schema is a file of
    // the repository, so they carry different ones (core document 8).
    expect(dataset.headers()['link']).toBe(
      '<https://creativecommons.org/licenses/by/4.0/>; rel="license", </schemas/elsa-tree-4.json>; rel="describedby"',
    )
    expect(schema.headers()['link']).toBe('<https://opensource.org/license/mit>; rel="license"')
  })

  test('the bytes served are the file in the repository, byte for byte (15.3)', async ({ request }) => {
    // The one claim of section 15 that cannot be made in a unit test: what a reader
    // downloads is what the project holds, which is what makes this a dataset rather than
    // an export. A re-serialisation of the in-memory Tree would pass a JSON comparison and
    // fail this one.
    const onDisk = await readFile(path.join(here, '..', '..', 'trees', 'ai-act-example', 'tree.json'))
    const downloaded = await (await request.get(DATASET)).body()

    expect(downloaded.equals(onDisk)).toBe(true)
    expect(JSON.parse(downloaded.toString('utf8')).format).toBe('elsa-tree/4')
  })

  test('the ETag answers 304, so a crawler that re-fetches downloads nothing', async ({ request }) => {
    for (const route of [DATASET, SCHEMA]) {
      const first = await request.get(route)
      const etag = first.headers()['etag']!
      const again = await request.get(route, { headers: { 'If-None-Match': etag } })

      expect(again.status(), route).toBe(304)
      expect((await again.body()).length, route).toBe(0)
      // The tag survives the round trip, so the next fetch can offer it again.
      expect(again.headers()['etag'], route).toBe(etag)
      // A tag the server did not issue is not a match, and the bytes come back.
      const stale = await request.get(route, { headers: { 'If-None-Match': '"not-this-one"' } })
      expect(stale.status(), route).toBe(200)
    }
  })

  test('HEAD answers the same headers and no body', async ({ request }) => {
    for (const route of [DATASET, SCHEMA]) {
      const body = await request.get(route)
      const head = await request.head(route)

      expect(head.status(), route).toBe(200)
      expect((await head.body()).length, route).toBe(0)
      for (const header of ['content-type', 'link', 'cache-control', 'etag', 'access-control-allow-origin']) {
        expect(head.headers()[header], `${route} ${header}`).toBe(body.headers()[header])
      }
    }
  })

  test('a Tree id this deployment does not serve, and an unpublished schema, are 404', async ({ request }) => {
    // By the row 4.3 already gives for a Node page; nothing is looked up on disk for it.
    expect((await request.get('/some-other-tree/tree.json')).status()).toBe(404)
    // The route serves the published set, not the folder (15.1, the theme route's rule).
    expect((await request.get('/schemas/elsa-tree-3.json')).status()).toBe(404)
    expect((await request.get('/schemas/../package.json')).status()).not.toBe(200)
  })
})
