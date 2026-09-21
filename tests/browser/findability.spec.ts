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
 * **[#121]** adds the dataset link of the head and `llms.txt`; **[#122]** the JSON-LD.
 */
import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NO_BASE_URL_ORIGIN, PUBLIC_BASE_URL } from '../../playwright.config.ts'
import { plainDescription } from '../../src/markdown.ts'
import { openTree, type Tree } from '../../src/tree/loader.ts'
import { addressSet } from '../../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const base = new URL(PUBLIC_BASE_URL)
let tree: Tree

test.beforeAll(async () => {
  tree = await openTree(path.join(here, '..', '..', 'trees', 'ai-act-example'))
})

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

test("the head's canonical and the sitemap's <loc> are the same string for the same page", async ({
  page,
  request,
}) => {
  const document = await (await request.get('/sitemap.xml')).text()
  const locations = [...document.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]!)

  expect(locations).toHaveLength(tree.nodeIds().length * tree.manifest.languages.length)
  for (const url of locations) {
    await page.goto(url.replace(PUBLIC_BASE_URL, ''))
    await expect(page.locator('link[rel="canonical"]'), url).toHaveAttribute('href', url)
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
  expect(parsed.urls).toBe(tree.nodeIds().length * tree.manifest.languages.length)
  expect(parsed.firstLoc).toBe(addressSet(tree, tree.manifest.root, base).addresses[0]!.url)
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
  expect(file.split('\n')[0]).toBe(`# ${tree.manifest.title.en}`)
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
