/**
 * What a deployment must be true of, checked on the server a deployment runs (the
 * standalone build started by playwright.config.ts, the same command
 * `docs/deployment.md` gives):
 *
 * - nothing about the reader is stored or sent anywhere (docs/CORE_DOCUMENT.md section 8):
 *   no cookie, and no request to any host but this one; **[#135]** and a creator's one
 *   cookie never leaves the admin area (application.md 20.5);
 * - the public base URL the deployment is configured with is the one the server writes
 *   into the absolute links it emits about a page, and a deployment that names none gets
 *   the same addresses on the request's own origin (a second server, started without the
 *   variable -- **[#118]**, application.md 16);
 * - **[#197]** about an account, a public route holds the name of each Author of a published
 *   Tree in that Tree's mention, and nothing else: no address, no id, no other name
 *   (application.md 39.8; a server of the account sweep's own).
 *
 * A browser is the only place these can be measured: a cookie a client script sets and a
 * font a stylesheet fetches are both invisible in the markup the server sends.
 */
import { expect, test, type Page, type Request, type Response } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DATA_DIR, NO_BASE_URL_ORIGIN, PUBLIC_BASE_URL } from '../../playwright.config.ts'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../store/admin.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { arrived } from './arrived.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const START = '/ai-act-example/start'
const DATASET = '/ai-act-example/tree.json'
const SCHEMA = '/schemas/elsa-tree-6.json'

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

  // A walk that touches everything the app can put on a page: **[#134]** the overview and
  // its tile, a Node with Options and an Option image, an explanation child, a Terminal,
  // the other language, and a Sheet (the client component that runs on load) -- the places
  // a third-party asset or a cookie would hide.
  await page.goto('/?lang=nl')
  await page.goto('/')
  await page.locator('a.tile').click()
  await arrived(page, START)
  await page.locator('.answer--next:nth-child(1)').click()
  // The Option opens its Overlay in place; its heading is the link to the aside's own address,
  // whose page arrives with the Overlay open, and Escape uncovers the page (10.9).
  await page.locator('.options .sheet-open', { hasText: 'Social scoring' }).click()
  await page.locator('.overlay[open] h2 a').click()
  await page.keyboard.press('Escape')
  await page.locator('.tree-frame:not([inert]) .up-arrow').click()
  // The slide up brings a second frame into the document until it lands (11.3).
  await arrived(page, START)
  await page.locator('.answer--next:nth-child(2)').click()
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
 * `/llms.txt`, **[#179]** and `/schemas/elsa-tree-5.json`, the schema every served Tree named
 * then, beside the `/4` one, which stays served (15.1); **[#221]** `/schemas/elsa-tree-6.json`,
 * the one every Tree names now, beside both.
 */
const DOCUMENT_ROUTES = ['/robots.txt', '/sitemap.xml', '/llms.txt', DATASET, SCHEMA, '/schemas/elsa-tree-5.json', '/schemas/elsa-tree-4.json']

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
      '<https://creativecommons.org/licenses/by/4.0/>; rel="license", </schemas/elsa-tree-6.json>; rel="describedby"',
    )
    expect(schema.headers()['link']).toBe('<https://opensource.org/license/mit>; rel="license"')
  })

  test("the bytes served are the store's published file, byte for byte (15.3, 23.6)", async ({ request }) => {
    // The one claim of section 15 that cannot be made in a unit test: what a reader
    // downloads is what the store holds, which is what makes this a dataset rather than an
    // export. A re-serialisation of the in-memory Tree would pass a JSON comparison and
    // fail this one. **[#134]** The file is the store's published copy, which the import
    // made a byte copy of the repository's -- so both comparisons hold.
    const inStore = await readFile(path.join(DATA_DIR, 'trees', 'ai-act-example', 'tree.json'))
    const inRepository = await readFile(path.join(here, '..', '..', 'trees', 'ai-act-example', 'tree.json'))
    const downloaded = await (await request.get(DATASET)).body()

    expect(downloaded.equals(inStore)).toBe(true)
    expect(downloaded.equals(inRepository)).toBe(true)
    expect(JSON.parse(downloaded.toString('utf8')).format).toBe('elsa-tree/6')
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
      // `*` is a match whenever a representation exists (RFC 9110 13.1.2), and one does:
      // 15.2 promises `304` for `If-None-Match` without qualifying the form.
      const wildcard = await request.get(route, { headers: { 'If-None-Match': '*' } })
      expect(wildcard.status(), route).toBe(304)
      expect((await wildcard.body()).length, route).toBe(0)
      expect(wildcard.headers()['etag'], route).toBe(etag)
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

  test('**[#179]** the published set is the schemas, each its file byte for byte: **[#221]** /6, which every Tree names, and /5 and /4, kept (15.1)', async ({ request }) => {
    for (const name of ['elsa-tree-6.json', 'elsa-tree-5.json', 'elsa-tree-4.json']) {
      const served = await request.get(`/schemas/${name}`)
      expect(served.status(), name).toBe(200)
      expect((await served.body()).equals(await readFile(path.join(here, '..', '..', 'schemas', name))), name).toBe(true)
    }
  })
})

/**
 * **[#135]** The logged-in half of the sweep (application.md 20.5, 35.5): the one cookie of
 * this application stays in the admin area. After a login in the same browser, every public
 * route of 4.1, 15 and 16 is asked for without a `Cookie` header and answers no
 * `Set-Cookie`; every admin page answers none either, with and without the session, and
 * carries 20.9's two headers; and the login is the only response of the whole run that set
 * a cookie -- the logout's clearing value aside -- with every attribute of 20.4 present.
 */
const PUBLIC_ROUTES = [
  '/',
  '/?lang=nl',
  '/ai-act-example',
  START,
  `${START}/prohibited-practices?lang=nl`,
  '/ai-act-example/images/eu-map.png',
  '/ai-act-example/theme/example-lab-logo.svg',
  ...DOCUMENT_ROUTES,
]
const ADMIN_PAGES = ['/admin', '/admin/new', '/admin/account', '/admin/accounts', '/admin/trees/ai-act-example/start', '/admin?lang=nl']

test.describe('the logged-in half of the sweep (20.5)', () => {
  test('after a login, no public route is sent the cookie or answers one; only login and logout ever set one', async ({ page, context, baseURL }) => {
    const seen = watch(page)
    const cookieSentTo: string[] = []
    const reads: Promise<void>[] = []
    page.on('request', (request: Request) => {
      reads.push(
        request.allHeaders().then((headers) => {
          if (headers['cookie'] !== undefined) cookieSentTo.push(new URL(request.url()).pathname)
        }),
      )
    })

    await page.goto('/admin')
    await page.getByLabel('E-mail address').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
    expect(await context.cookies()).toHaveLength(1)

    for (const route of PUBLIC_ROUTES) {
      const answer = await page.goto(route)
      expect(answer?.status(), route).toBe(200)
    }
    for (const route of ADMIN_PAGES) {
      const answer = await page.goto(route)
      const headers = await answer!.allHeaders()
      expect(headers['x-robots-tag'], route).toBe('noindex, nofollow')
      expect(headers['cache-control'], route).toBe('no-store')
    }
    await page.goto('/admin')
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    await seen.settled()
    while (reads.length > 0) await Promise.all(reads.splice(0))
    // Only admin paths were ever sent the cookie: `Path=/admin` keeps it home.
    expect(cookieSentTo.filter((pathname) => pathname !== '/admin' && !pathname.startsWith('/admin/'))).toEqual([])
    expect(cookieSentTo.length).toBeGreaterThan(0)
    const origin = new URL(baseURL!).origin
    expect(seen.setCookie).toEqual([
      expect.stringMatching(
        new RegExp(`^${origin}/admin/api/login: elsa-admin-session=[A-Za-z0-9_-]{43}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=1209600$`),
      ),
      `${origin}/admin/api/logout: elsa-admin-session=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0`,
    ])
    expect(await context.cookies()).toEqual([])
  })

  test('without a session every admin page answers no cookie and 20.9 headers', async ({ page, context }) => {
    const seen = watch(page)

    for (const route of ADMIN_PAGES) {
      const answer = await page.goto(route)
      const headers = await answer!.allHeaders()
      expect(answer?.status(), route).toBe(200)
      expect(headers['x-robots-tag'], route).toBe('noindex, nofollow')
      expect(headers['cache-control'], route).toBe('no-store')
    }

    await seen.settled()
    expect(seen.setCookie).toEqual([])
    expect(await context.cookies()).toEqual([])
  })
})

/**
 * **[#206]** The preview's half of the sweep (application.md 35.5, 40.8): on a server of its own
 * holding a hidden Tree beside the published example, the preview's two addresses answer no
 * `Set-Cookie` and carry 20.9's headers, with and without the session; and after a preview of the
 * hidden Tree is drawn in the browser, every public route -- the hidden Tree's own addresses, the
 * 404 of 4.3, among them -- is sent no `Cookie` and answers no `Set-Cookie`, the login's aside.
 */
test.describe("the preview's half of the sweep (35.5, 40.8)", () => {
  const PORT = BASE_PORT + 206
  const HIDDEN = 'hidden-tree'
  const PREVIEWS = [`/admin/preview/${HIDDEN}`, `/admin/preview/${HIDDEN}/full`, `/admin/preview/${HIDDEN}/full?lang=nl`]
  const repo = fileURLToPath(new URL('../..', import.meta.url))
  let origin: string

  test.beforeAll(async () => {
    const dir = await buildDataDir({
      trees: [{ folder: path.join(repo, 'trees', 'ai-act-example') }, { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: HIDDEN, hidden: true }],
      accounts: [],
    })
    origin = await serveStore(dir, PORT, ADMIN_ENV)
  })

  test.afterAll(async () => {
    await stopServers()
  })

  test("without a session the preview's addresses answer the login page, no cookie and 20.9's headers", async ({ page, context }) => {
    const seen = watch(page)
    for (const route of PREVIEWS) {
      const answer = await page.goto(`${origin}${route}`)
      const headers = await answer!.allHeaders()
      expect(answer?.status(), route).toBe(200)
      expect(headers['x-robots-tag'], route).toBe('noindex, nofollow')
      expect(headers['cache-control'], route).toBe('no-store')
      await expect(page.getByRole('heading', { name: /^(Sign in|Inloggen)$/ }), route).toBeVisible()
    }
    await seen.settled()
    expect(seen.setCookie).toEqual([])
    expect(await context.cookies()).toEqual([])
  })

  test('after a preview of the hidden Tree is drawn, no public route is sent the cookie or answers one', async ({ page, context }) => {
    const seen = watch(page)
    const cookieSentTo: string[] = []
    const reads: Promise<void>[] = []
    page.on('request', (request: Request) => {
      reads.push(
        request.allHeaders().then((headers) => {
          if (headers['cookie'] !== undefined) cookieSentTo.push(new URL(request.url()).pathname)
        }),
      )
    })
    await page.goto(`${origin}/admin`)
    await page.getByLabel('E-mail address').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()

    for (const route of PREVIEWS) {
      const answer = await page.goto(`${origin}${route}`)
      const headers = await answer!.allHeaders()
      expect(answer?.status(), route).toBe(200)
      expect(headers['x-robots-tag'], route).toBe('noindex, nofollow')
      expect(headers['cache-control'], route).toBe('no-store')
      // The preview drawn: the hidden Tree's full Node, its pictures from the admin route.
      await expect(page.locator('.tree-frame .bubble[data-node="full"]'), route).toBeVisible()
      await expect(page.locator('.preview-back'), route).toBeVisible()
    }

    const hidden = [`/${HIDDEN}`, `/${HIDDEN}/full`, `/${HIDDEN}/full?lang=nl`, `/${HIDDEN}/tree.json`, `/${HIDDEN}/images/one.png`]
    for (const route of [...PUBLIC_ROUTES, ...hidden]) {
      const answer = await page.goto(`${origin}${route}`)
      expect(answer?.status(), route).toBe(hidden.includes(route) ? 404 : 200)
    }

    await seen.settled()
    while (reads.length > 0) await Promise.all(reads.splice(0))
    expect(cookieSentTo.filter((pathname) => pathname !== '/admin' && !pathname.startsWith('/admin/'))).toEqual([])
    expect(cookieSentTo).toEqual(expect.arrayContaining(['/admin/preview/hidden-tree/full']))
    expect(seen.setCookie).toEqual([expect.stringMatching(new RegExp(`^${origin}/admin/api/login: elsa-admin-session=`))])
    expect(await context.cookies()).toHaveLength(1)
  })
})

/**
 * **[#197]** The account sweep (application.md 20.5, 35.5, 39.8, 39.9;
 * ADR-195-names-on-public-routes decision 6). A data directory of its own, whose accounts have
 * known addresses, ids and names, each name one that no Tree, chrome string or page holds: the
 * two Authors of the published example Tree, the Author of a hidden Tree only, an account with
 * no role, and the administrator -- which the server creates as `Administrator`, a word the
 * chrome holds, so it is renamed through `PATCH` on its own account before the walk. Then every
 * public route of 4.1, 15, 16 and 23 is read whole, headers and body, scripts included: no
 * response holds an address or an id; none holds the name of the hidden Tree's Author, of the
 * account with no role or of the administrator; and the published Tree's Authors' names are in
 * its Node pages and the overview and in no other response. In those, read as markup with every
 * `<script>` element removed but the JSON-LD's -- the inline React payload repeats a server
 * component's text for hydration -- they stand only inside a mention's element.
 */
test.describe('the account sweep (39.8)', () => {
  const PORT = BASE_PORT + 190
  const TREE = 'ai-act-example'
  const HIDDEN = 'hidden-tree'
  const FIRST = { email: 'first.author@example.org', name: 'Quillon Zarvath', password: 'first author password' }
  const SECOND = { email: 'second.author@example.org', name: 'Yselmira Thorncastle', password: 'second author password' }
  const HIDDEN_ONLY = { email: 'hidden.author@example.org', name: 'Rufina Xelbrook', password: 'hidden author password' }
  const NO_ROLE = { email: 'no.role@example.org', name: 'Sorvin Plaxter', password: 'no role password' }
  const ADMIN_NAME = 'Tolvane Quarrick'
  const repo = fileURLToPath(new URL('../..', import.meta.url))
  let origin: string
  let dir: string

  test.beforeAll(async () => {
    dir = await buildDataDir({
      trees: [
        { folder: path.join(repo, 'trees', TREE), creator: FIRST.email, collaborators: [SECOND.email] },
        { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: HIDDEN, hidden: true, creator: HIDDEN_ONLY.email },
      ],
      accounts: [FIRST, SECOND, HIDDEN_ONLY, NO_ROLE],
    })
    origin = await serveStore(dir, PORT, ADMIN_ENV)
  })

  test.afterAll(async () => {
    await stopServers()
  })

  /** `html` with every `<script>` element taken out but the JSON-LD's, which must hold no name (39.7). */
  function withoutScripts(html: string): string {
    return html.replace(/<script\b(?![^>]*type="application\/ld\+json")[^>]*>[\s\S]*?<\/script>/g, '')
  }

  /** `markup` with the mention's elements taken out: the bar's room and the tile's (39.4, 39.5). */
  function withoutMentions(markup: string): string {
    return markup.replace(/<div class="authors-room">[\s\S]*?<\/div>/g, '').replace(/<span class="tile-authors-room">[\s\S]*?<\/span><\/span>/g, '')
  }

  test("no public response holds an address or an id, nor a name but an Author's, and that only in its mention", async ({ page, request }) => {
    test.slow()
    // The administrator's id, and the new name it gives itself, as any holder does (22.1, 38.5).
    const { cookie } = await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
    const me = (await (await page.request.get(`${origin}/admin/api/me`, { headers: { Cookie: cookie } })).json()) as { id: string }
    const renamed = await page.request.patch(`${origin}/admin/api/accounts/${me.id}`, { headers: { Origin: origin, Cookie: cookie }, data: { name: ADMIN_NAME } })
    expect(renamed.status()).toBe(200)
    const accounts = JSON.parse(await readFile(path.join(dir, 'accounts.json'), 'utf8')) as { id: string; email: string; name: string }[]
    expect(accounts.map(({ name }) => name).sort()).toEqual([ADMIN_NAME, FIRST.name, SECOND.name, HIDDEN_ONLY.name, NO_ROLE.name].sort())
    const secrets = [...accounts.map(({ email }) => email), ...accounts.map(({ id }) => id)]
    expect(secrets).toEqual(expect.arrayContaining([ADMIN_EMAIL, me.id]))
    const unnamed = [HIDDEN_ONLY.name, NO_ROLE.name, ADMIN_NAME]
    const authors = [FIRST.name, SECOND.name]

    // Every public route of 4.1, 15, 16 and 23: the overview in both languages, every Node page
    // of the published Tree in both, the redirect to its root, its file, the two schemas, the
    // three documents, an image and a theme file, and the hidden Tree's addresses: the 404.
    const file = JSON.parse(await readFile(path.join(repo, 'trees', TREE, 'tree.json'), 'utf8')) as { root: string; nodes: { id: string }[] }
    const nodes = file.nodes.map(({ id }) => id)
    const pages = ['/', '/?lang=nl', ...nodes.flatMap((node) => [`/${TREE}/${node}`, `/${TREE}/${node}?lang=nl`])]
    const others = [
      `/${TREE}`,
      DATASET,
      SCHEMA,
      '/schemas/elsa-tree-4.json',
      '/robots.txt',
      '/sitemap.xml',
      '/llms.txt',
      `/${TREE}/images/eu-map.png`,
      `/${TREE}/theme/example-lab-logo.svg`,
      `/${HIDDEN}`,
      `/${HIDDEN}/full`,
    ]
    expect(nodes).toHaveLength(7)

    for (const route of [...pages, ...others]) {
      const answer = await request.get(`${origin}${route}`, { maxRedirects: 0 })
      expect(answer.status(), route).toBe(route.startsWith(`/${HIDDEN}`) ? 404 : route === `/${TREE}` ? 307 : 200)
      const body = await answer.body()
      const headers = answer.headersArray().map(({ name, value }) => `${name}: ${value}`).join('\n')
      // Every byte, as bytes: an address, an id and a name are ASCII here.
      const bytes = `${headers}\n\n${body.toString('latin1')}`
      for (const secret of secrets) expect(bytes.includes(secret), `${route} holds ${secret}`).toBe(false)
      for (const name of unnamed) expect(bytes.includes(name), `${route} holds the name ${name}`).toBe(false)
      if (!pages.includes(route)) {
        for (const name of authors) expect(bytes.includes(name), `${route} holds the Author's name ${name}`).toBe(false)
        continue
      }
      // A Node page or the overview: the names, and in its markup only inside the mention.
      const markup = withoutScripts(body.toString('utf8'))
      expect((markup.match(/class="(tile-)?authors-room"/g) ?? []).length, `${route}: one mention, the bar's or the tile's`).toBe(1)
      for (const name of authors) {
        expect(markup.includes(name), `${route} names ${name}`).toBe(true)
        expect(withoutMentions(markup).includes(name), `${route} holds ${name} outside the mention`).toBe(false)
      }
    }
  })
})
