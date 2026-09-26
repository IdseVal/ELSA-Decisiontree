/**
 * Findability, on a served page and on a served document (docs/specs/application.md 16).
 *
 * What only a browser can show here: that the head a crawler parses carries the address
 * set (16.3), that the sitemap parses in a real XML parser, and -- the assertion this file
 * exists for -- that the head's canonical link and the sitemap's `<loc>` are the **same
 * string** for the same page. They are rendered from one function (16.3), and a search
 * engine that finds the two disagreeing drops the `hreflang` annotation altogether, with
 * nothing broken on screen and nothing logged.
 *
 * **[#121]** adds the dataset link of the head and `llms.txt`; **[#122]** the JSON-LD;
 * **[#134]** the overview's head, and a store of several Trees with one hidden: its id
 * nowhere in the documents, every route of 23.1 answering it as an unknown id, `lastmod`
 * per Tree (23.7).
 */
import { expect, test, type Page } from '@playwright/test'
import { utimes } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NO_BASE_URL_ORIGIN, PUBLIC_BASE_URL } from '../../playwright.config.ts'
import type { Graph, Dataset, WebPage } from '../../src/findability/jsonld.ts'
import { plainDescription } from '../../src/markdown.ts'
import { openTree, type Tree } from '../../src/tree/loader.ts'
import { addressSet, overviewAddressSet } from '../../src/url.ts'
import { BASE_PORT, dataDir, serve, serveStore, stopServers } from './serve.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const base = new URL(PUBLIC_BASE_URL)
let tree: Tree

/** **[#122]** The awkward Tree, served on its own: clear of every other spec's ports. */
const AWKWARD_PORT = BASE_PORT + 60
let awkward: string

test.beforeAll(async () => {
  tree = await openTree(path.join(here, '..', '..', 'trees', 'ai-act-example'))
  const started = await serve(path.join(here, '..', 'fixtures'), 'findability', AWKWARD_PORT)
  expect(started, 'the findability fixture is a valid Tree').not.toBeNull()
  awkward = started!
})

test.afterAll(async () => {
  await stopServers()
})

/**
 * **[#122]** The page's JSON-LD, read the way a crawler reads it: the one
 * `application/ld+json` script of the document, its text parsed as JSON. Asserts on the way
 * through that the text holds no `<` at all, which is what keeps the element from being
 * closed by a Tree's own words (16.4).
 */
async function graphOf(page: Page): Promise<Graph> {
  const scripts = page.locator('script[type="application/ld+json"]')
  await expect(scripts, page.url()).toHaveCount(1)
  const payload = (await scripts.textContent()) ?? ''

  expect(payload, page.url()).not.toContain('<')
  return JSON.parse(payload) as Graph
}

/** The one `WebPage` of a graph, and the `Dataset` beside it where the page carries one. */
function entries(graph: Graph): { page: WebPage; dataset: Dataset | null } {
  const pages = graph['@graph'].filter((entry): entry is WebPage => entry['@type'] === 'WebPage')
  const datasets = graph['@graph'].filter((entry): entry is Dataset => entry['@type'] === 'Dataset')

  expect(pages).toHaveLength(1)
  expect(datasets.length).toBeLessThanOrEqual(1)
  return { page: pages[0]!, dataset: datasets[0] ?? null }
}

/** The `href` of every `<link rel="alternate" hreflang>` of the page, with its tag. */
async function alternates(page: Page): Promise<Array<{ hreflang: string; url: string }>> {
  return page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
    links.map((link) => ({
      hreflang: link.getAttribute('hreflang') ?? '',
      url: (link as HTMLLinkElement).href,
    })),
  )
}

test('every Node page carries its whole address set in its head', async ({ page }) => {
  for (const id of tree.nodeIds()) {
    const { addresses, alternates: expected } = addressSet(tree, id, base)

    for (const { lang, url } of addresses) {
      await page.goto(`/ai-act-example/${id}${lang === tree.manifest.defaultLanguage ? '' : `?lang=${lang}`}`)

      // The self-reference is required for the annotation to be read at all, so the Dutch
      // page names the Dutch address too, and x-default names the default language's.
      await expect(page.locator('link[rel="canonical"]'), url).toHaveAttribute('href', url)
      expect(await alternates(page), url).toEqual(expected)
    }
  }
})

test('a page reached through a Trail names the same addresses as the Node itself', async ({ page }) => {
  // Both are the same Node, which is what the canonical link already says (4.1).
  const { addresses, alternates: expected } = addressSet(tree, 'prohibited-practices', base)
  await page.goto('/ai-act-example/start/prohibited-practices?lang=nl')

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    addresses.find((entry) => entry.lang === 'nl')!.url,
  )
  expect(await alternates(page)).toEqual(expected)
})

test("the description meta tag is the Node's description, reduced and cut", async ({ page }) => {
  for (const id of ['start', 'prohibited-practices', 'covered']) {
    const node = (await tree.getNode(id))!
    for (const lang of tree.manifest.languages) {
      await page.goto(`/ai-act-example/${id}${lang === 'en' ? '' : `?lang=${lang}`}`)
      const { cut } = plainDescription(node.description[lang]!)

      await expect(page.locator('meta[name="description"]'), `${id}.${lang}`).toHaveAttribute('content', cut)
      // Plain text: no Markdown of the description survives into the tag.
      expect(cut, `${id}.${lang}`).not.toMatch(/[*]|\]\(/)
      expect([...cut].length, `${id}.${lang}`).toBeLessThanOrEqual(155)
    }
  }
})

test("the head's canonical, the sitemap's <loc> and the JSON-LD's @id are one string", async ({
  page,
  request,
}) => {
  const document = await (await request.get('/sitemap.xml')).text()
  const locations = [...document.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]!)
  // **[#134]** The overview's two addresses first; they carry no JSON-LD this round (23.2).
  const overview = locations.splice(0, 2)

  expect(overview).toEqual(overviewAddressSet(base).addresses.map((address) => address.url))
  for (const url of overview) {
    await page.goto(url.replace(PUBLIC_BASE_URL, '') || '/')
    await expect(page.locator('link[rel="canonical"]'), url).toHaveAttribute('href', url)
    await expect(page.locator('script[type="application/ld+json"]'), url).toHaveCount(0)
  }
  expect(locations).toHaveLength(tree.nodeIds().length * tree.manifest.languages.length)
  for (const url of locations) {
    await page.goto(url.replace(PUBLIC_BASE_URL, ''))
    await expect(page.locator('link[rel="canonical"]'), url).toHaveAttribute('href', url)
    // **[#122]** All three are rendered from the one address set of 16.3; a crawler reads
    // them as one graph and drops the lot when any two of them disagree.
    const { page: record } = entries(await graphOf(page))
    expect(record['@id'], url).toBe(url)
    expect(record.url, url).toBe(url)
  }
})

test("the sitemap parses in the browser's XML parser and holds the alternates", async ({ page, request }) => {
  const document = await (await request.get('/sitemap.xml')).text()
  const parsed = await page.evaluate((xml) => {
    const dom = new DOMParser().parseFromString(xml, 'application/xml')
    const SITEMAP = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    const XHTML = 'http://www.w3.org/1999/xhtml'
    return {
      error: dom.querySelector('parsererror')?.textContent ?? null,
      root: dom.documentElement.localName,
      urls: dom.getElementsByTagNameNS(SITEMAP, 'url').length,
      firstLoc: dom.getElementsByTagNameNS(SITEMAP, 'loc')[0]?.textContent ?? null,
      alternates: [...dom.getElementsByTagNameNS(SITEMAP, 'url')[0]!.getElementsByTagNameNS(XHTML, 'link')].map(
        (link) => link.getAttribute('hreflang'),
      ),
    }
  }, document)

  expect(parsed.error).toBeNull()
  expect(parsed.root).toBe('urlset')
  expect(parsed.urls).toBe(2 + tree.nodeIds().length * tree.manifest.languages.length)
  expect(parsed.firstLoc).toBe(overviewAddressSet(base).addresses[0]!.url)
  expect(parsed.alternates).toEqual(['en', 'nl', 'x-default'])
})

/**
 * **[#121]** The head link of 16.3 and the route of 15.1 are one deliverable, because a
 * page that advertises a dataset the deployment does not serve is worse than one that
 * says nothing (ADR-118-dataset-endpoint decision 6). This test is the assertion that
 * fails if either ships without the other: it does not compare the href to a string it
 * built, it **fetches what it finds in the head**.
 */
test('every page links to the dataset, and the link resolves to the dataset', async ({ page, request }) => {
  const seen = new Set<string>()

  for (const id of tree.nodeIds()) {
    for (const lang of tree.manifest.languages) {
      await page.goto(`/ai-act-example/${id}${lang === tree.manifest.defaultLanguage ? '' : `?lang=${lang}`}`)
      const links = page.locator('link[rel="alternate"][type="application/json"]')

      // Once per page, and the same URL on every page and in both languages: there is one
      // dataset, in no language (15.1).
      await expect(links, `${id}.${lang}`).toHaveCount(1)
      seen.add(await links.evaluate((link) => (link as HTMLLinkElement).href))
    }
  }

  expect([...seen]).toEqual([`${PUBLIC_BASE_URL}/ai-act-example/tree.json`])
  const answer = await request.get([...seen][0]!.replace(PUBLIC_BASE_URL, ''))
  expect(answer.status()).toBe(200)
  expect(answer.headers()['content-type']).toBe('application/json; charset=utf-8')
})

test('a page reached through a Trail links to the same dataset', async ({ page }) => {
  await page.goto('/ai-act-example/start/prohibited-practices?lang=nl')

  await expect(page.locator('link[rel="alternate"][type="application/json"]')).toHaveAttribute(
    'href',
    `${PUBLIC_BASE_URL}/ai-act-example/tree.json`,
  )
})

test('robots.txt answers with its media type, the twenty agents and the sitemap', async ({ request }) => {
  const answer = await request.get('/robots.txt')
  const file = await answer.text()

  expect(answer.status()).toBe(200)
  expect(answer.headers()['content-type']).toBe('text/plain; charset=utf-8')
  expect(file).toContain('User-agent: *\nAllow: /')
  expect(file.match(/^User-agent: /gm)).toHaveLength(21)
  expect(file).not.toMatch(/Disallow/i)
  expect(file).toContain(`Sitemap: ${PUBLIC_BASE_URL}/sitemap.xml`)
})

test('the sitemap answers with its media type', async ({ request }) => {
  const answer = await request.get('/sitemap.xml')

  expect(answer.status()).toBe(200)
  expect(answer.headers()['content-type']).toBe('application/xml; charset=utf-8')
})

/**
 * **[#121]** `llms.txt` (16.5): what a served document shows that a unit test cannot --
 * the media type a client actually receives, and that the file an agent fetches names a
 * dataset URL that answers.
 */
test('llms.txt answers as plain text and its dataset link resolves', async ({ request }) => {
  const answer = await request.get('/llms.txt')
  const file = await answer.text()

  expect(answer.status()).toBe(200)
  // Markdown content under a plain-text media type, which is what the convention's readers
  // expect: `text/markdown` is not reliably handled by the middle of the internet.
  expect(answer.headers()['content-type']).toBe('text/plain; charset=utf-8')
  // **[#134]** The deployment's H1, a chrome string, where 1.0 wrote the one Tree's title (23.5).
  expect(file.split('\n')[0]).toBe('# ELSA decision trees')
  expect(file).toContain(`- [${tree.manifest.title.en}](${PUBLIC_BASE_URL}/ai-act-example/start):`)
  expect(file).toContain(`(${PUBLIC_BASE_URL}/ai-act-example/tree.json)`)
  expect(file).toContain(`(${PUBLIC_BASE_URL}/sitemap.xml)`)
  expect(file).toContain('https://creativecommons.org/licenses/by/4.0/')

  // The URL an agent that read only this file would fetch, on the server that served it.
  expect((await request.get('/ai-act-example/tree.json')).status()).toBe(200)
})

test('there is no llms-full.txt to fetch', async ({ request }) => {
  // The complete content of this site in one document is `/<tree-id>/tree.json`, which
  // llms.txt names in its first section; a second rendering would be the copy that drifts.
  expect((await request.get('/llms-full.txt')).status()).toBe(404)
})

test('the documents of section 16 are generated per request, not served from the repository', async ({
  request,
}) => {
  // The same build, two deployments: the one configured with a public base URL and the one
  // given none, which answers on its own origin (16). A file in `public/` could not say
  // two different things, and a build-time sitemap would need the origin baked in.
  const [configured, own] = await Promise.all([
    (await request.get('/robots.txt')).text(),
    (await request.get(`${NO_BASE_URL_ORIGIN}/robots.txt`)).text(),
  ])

  expect(configured).toContain(`Sitemap: ${PUBLIC_BASE_URL}/sitemap.xml`)
  expect(own).toContain(`Sitemap: ${NO_BASE_URL_ORIGIN}/sitemap.xml`)

  const sitemap = await (await request.get(`${NO_BASE_URL_ORIGIN}/sitemap.xml`)).text()
  expect(sitemap).toContain(`<loc>${NO_BASE_URL_ORIGIN}/ai-act-example/start</loc>`)
  expect(sitemap).not.toContain(PUBLIC_BASE_URL)

  // **[#121]** `llms.txt` and the head's dataset link read the same base, so the
  // deployment that names none advertises the origin each request arrived on.
  const llms = await (await request.get(`${NO_BASE_URL_ORIGIN}/llms.txt`)).text()
  expect(llms).toContain(`(${NO_BASE_URL_ORIGIN}/ai-act-example/tree.json)`)
  expect(llms).not.toContain(PUBLIC_BASE_URL)
})

/**
 * **[#122]** The JSON-LD of 16.4, on a served page. What only a browser shows here: that
 * the document a real HTML parser builds holds exactly one `application/ld+json` script,
 * that its text is valid JSON after the server's escaping, and that the `Dataset` record a
 * dataset index would read is on the root Node's page and on no other.
 */
test('every Node page carries one JSON-LD graph, and the Dataset is on the root alone', async ({ page }) => {
  const ids = new Set<string>()

  for (const id of tree.nodeIds()) {
    for (const lang of tree.manifest.languages) {
      await page.goto(`/ai-act-example/${id}${lang === tree.manifest.defaultLanguage ? '' : `?lang=${lang}`}`)
      const graph = await graphOf(page)
      const { page: record, dataset } = entries(graph)

      expect(graph['@context'], `${id}.${lang}`).toBe('https://schema.org')
      expect(record.inLanguage, `${id}.${lang}`).toBe(lang)
      expect(record.isPartOf['@id'], `${id}.${lang}`).toBe(`${PUBLIC_BASE_URL}/ai-act-example#dataset`)
      // The record once, the reference everywhere: 14 pages of one dataset, not 14 datasets.
      expect(dataset === null, `${id}.${lang}`).toBe(id !== tree.manifest.root)
      if (dataset) ids.add(dataset['@id'])
    }
  }

  // The same `@id` in both languages, so the English pages and the Dutch pages are one.
  expect([...ids]).toEqual([`${PUBLIC_BASE_URL}/ai-act-example#dataset`])
})

test('the served Dataset names the licence and a download that answers', async ({ page, request }) => {
  await page.goto('/ai-act-example/start')
  const { dataset } = entries(await graphOf(page))

  // Google's dataset requirements, on the page a dataset index would fetch.
  expect(dataset!.name).toBe(tree.manifest.title.en)
  expect(dataset!.description.length).toBeGreaterThan(0)
  expect(dataset!.license).toBe('https://creativecommons.org/licenses/by/4.0/')
  expect(dataset!.distribution[0]!.encodingFormat).toBe('application/json')

  // The claim a `Dataset` makes is that this download exists, so the test fetches it.
  const download = await request.get(dataset!.distribution[0]!.contentUrl.replace(PUBLIC_BASE_URL, ''))
  expect(download.status()).toBe(200)
  expect(download.headers()['content-type']).toBe('application/json; charset=utf-8')
})

test('the meta description and the WebPage description are the same bytes', async ({ page }) => {
  for (const id of ['start', 'prohibited-practices', 'covered']) {
    for (const lang of tree.manifest.languages) {
      await page.goto(`/ai-act-example/${id}${lang === 'en' ? '' : `?lang=${lang}`}`)
      const { page: record } = entries(await graphOf(page))
      const meta = await page.locator('meta[name="description"]').getAttribute('content')

      // The WebPage is the record of this page; the two may not describe it differently.
      expect(record.description, `${id}.${lang}`).toBe(meta)
    }
  }
})

/**
 * **[#122]** The escaping of 16.4 against a real HTML parser, which is the only place the
 * tautology this freeze removed would have shown. The fixture's manifest title and one Node
 * title each carry a literal `</script>`; if the server wrote them into the element as they
 * stand, the browser closes the element there and the rest of the JSON becomes text in the
 * page. So this asserts on the document the browser built, not on a string the test made.
 */
test('a Tree whose titles carry </script> still leaves the element closed where the server put it', async ({
  page,
  request,
}) => {
  // The Node whose title is the awkward one; the manifest's is the test below.
  for (const [id, lang] of [
    ['placing-on-the-market', 'en'],
    ['placing-on-the-market', 'nl'],
  ] as const) {
    const at = `${awkward}/findability/${id}${lang === 'en' ? '' : `?lang=${lang}`}`
    const served = await (await request.get(at)).text()
    await page.goto(at)
    const graph = await graphOf(page)
    const { page: record } = entries(graph)

    // What the server wrote: the escape, never the character. `</script>` cannot occur in
    // the payload, so nothing in the Tree's text can close the element.
    expect(served, at).toContain('\\u003c/script>')

    // What the browser parsed: one script, and a title that survived the round trip whole.
    expect(record.name, at).toContain('</script>')
    expect(record.name, at).toContain('<')

    // And the page after it is intact: had the element closed early, the Node's heading
    // would be missing and the remains of the JSON would be showing instead.
    await expect(page.locator('#node-title'), at).toHaveText(record.name)
    await expect(page.locator('main'), at).not.toContainText('@context')
  }
})

test("the awkward Tree's Dataset survives its own manifest title", async ({ page }) => {
  await page.goto(`${awkward}/findability/start`)
  const { dataset } = entries(await graphOf(page))

  expect(dataset!.name).toContain('</script>')
  // No manifest description: the record falls back to the root Node's, which is required.
  expect(dataset!.description).toContain('The first question')
  // Two legal Sources at one URL against one at another: the most frequent wins (16.4).
  expect(dataset!.isBasedOn).toBe('https://eur-lex.europa.eu/eli/reg/2024/1689/oj')
})

/**
 * **[#134]** The overview's head (23.2): its title and description are chrome, its canonical
 * link its own address in the page's chrome language, `hreflang` for both and `x-default`,
 * and no JSON-LD this round.
 */
test("the overview's head: chrome title and description, its own canonical, the two languages", async ({ page }) => {
  const { addresses, alternates: expected } = overviewAddressSet(base)

  for (const { lang, url } of addresses) {
    await page.goto(lang === 'en' ? '/' : `/?lang=${lang}`)

    await expect(page.locator('html'), url).toHaveAttribute('lang', lang)
    await expect(page.locator('link[rel="canonical"]'), url).toHaveAttribute('href', url)
    // The attribute as written, the string the sitemap must repeat: the browser's resolved
    // `href` would add the slash that `https://host` leaves out.
    const written = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((links) => links.map((link) => ({ hreflang: link.getAttribute('hreflang') ?? '', url: link.getAttribute('href') ?? '' })))
    expect(written, url).toEqual(expected)
    await expect(page, url).toHaveTitle(lang === 'en' ? 'ELSA decision trees' : 'ELSA-beslisbomen')
    await expect(page.locator('meta[name="description"]'), url).toHaveAttribute('content', /beslisbomen|decision trees/)
    await expect(page.locator('script[type="application/ld+json"]'), url).toHaveCount(0)
    // No Tree content beyond the titles on the tiles: the dataset link is a Node page's.
    await expect(page.locator('link[type="application/json"]'), url).toHaveCount(0)
  }
})

test.describe('a store of several Trees, one of them hidden (23.7)', () => {
  const HIDDEN = 'hidden-tree'
  const PORT = BASE_PORT + 61
  let origin: string
  /** The published Trees, as the store opens them: what the documents must list, and all they may. */
  let published: Tree[]

  test.beforeAll(async () => {
    const example = path.join(here, '..', '..', 'trees', 'ai-act-example')
    const cycle = path.join(here, '..', 'fixtures', 'cycle')
    const dir = await dataDir([
      { folder: example },
      { folder: cycle, id: 'second-tree' },
      { folder: example, id: HIDDEN, hidden: true },
    ])
    // Two publishes on two days: `lastmod` must say each Tree's own (23.4).
    await utimes(path.join(dir, 'trees', 'ai-act-example', 'tree.json'), new Date('2026-01-02T12:00:00Z'), new Date('2026-01-02T12:00:00Z'))
    await utimes(path.join(dir, 'trees', 'second-tree', 'tree.json'), new Date('2026-03-04T12:00:00Z'), new Date('2026-03-04T12:00:00Z'))
    published = [await openTree(path.join(dir, 'trees', 'ai-act-example')), await openTree(path.join(dir, 'trees', 'second-tree'))]
    origin = await serveStore(dir, PORT)
  })

  test("the sitemap lists exactly the published Trees' Nodes, each Tree with its own lastmod", async ({ request }) => {
    const document = await (await request.get(`${origin}/sitemap.xml`)).text()
    const locations = [...document.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]!)
    const own = new URL(origin)
    const expected = published.flatMap((each) =>
      each.nodeIds().flatMap((id) => addressSet(each, id, own).addresses.map((address) => address.url)),
    )

    expect(document).not.toContain(HIDDEN)
    expect(locations.slice(2)).toEqual(expected)
    // The count of 23.4: the overview's two, then Nodes times languages summed over the published Trees.
    expect(locations).toHaveLength(2 + published.reduce((sum, each) => sum + each.nodeIds().length * each.manifest.languages.length, 0))
    for (const block of document.split('<url>').slice(1)) {
      const loc = /<loc>([^<]*)<\/loc>/.exec(block)![1]!
      const lastmod = /<lastmod>([^<]*)<\/lastmod>/.exec(block)?.[1] ?? null
      const expectedDate = loc.includes('/ai-act-example/') ? '2026-01-02' : loc.includes('/second-tree/') ? '2026-03-04' : null
      expect(lastmod, loc).toBe(expectedDate)
    }
  })

  test('llms.txt and the overview name the published Trees and not the hidden one', async ({ page, request }) => {
    const llms = await (await request.get(`${origin}/llms.txt`)).text()
    expect(llms).not.toContain(HIDDEN)
    expect(llms).toContain(`(${origin}/second-tree/tree.json)`)

    await page.goto(`${origin}/`)
    await expect(page.locator('a.tile')).toHaveCount(2)
    expect(await page.locator('a.tile').evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('data-tree')))).toEqual([
      'ai-act-example',
      'second-tree',
    ])
    expect(await page.content()).not.toContain(HIDDEN)
  })

  test('every public route answers the hidden Tree exactly as an id that was never a Tree', async ({ request }) => {
    // The hidden Tree is a copy of the example Tree less its published file: its draft, its
    // pictures and its fonts are on disk under the hidden id, and only the store says no.
    const routes = (id: string): string[] => [
      `/${id}`,
      `/${id}/start`,
      `/${id}/start?lang=nl`,
      `/${id}/tree.json`,
      `/${id}/images/eu-map.png`,
      `/${id}/theme/nova-square-400.woff2`,
    ]
    const never = 'never-a-tree'
    const hiddenRoutes = routes(HIDDEN)
    const neverRoutes = routes(never)
    for (const [index, route] of hiddenRoutes.entries()) {
      const [hidden, unknown] = await Promise.all([
        request.get(`${origin}${route}`, { maxRedirects: 0 }),
        request.get(`${origin}${neverRoutes[index]}`, { maxRedirects: 0 }),
      ])
      expect(hidden.status(), route).toBe(404)
      expect(unknown.status(), neverRoutes[index]).toBe(404)
      // The same headers by name and by value, less the two that are per response.
      const comparable = (headers: Record<string, string>): Record<string, string> =>
        Object.fromEntries(Object.entries(headers).filter(([name]) => name !== 'date' && name !== 'etag'))
      expect(comparable(hidden.headers()), route).toEqual(comparable(unknown.headers()))
      // The same page, but for the path the caller typed, which the 404 page's language switch keeps.
      const body = (text: string, id: string): string => text.replaceAll(id, '<id>')
      expect(body(await hidden.text(), HIDDEN), route).toBe(body(await unknown.text(), never))
    }
  })
})
