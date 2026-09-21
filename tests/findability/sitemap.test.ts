/**
 * `sitemap.xml` (docs/specs/application.md 16.2, ADR-118-sitemap-and-alternates): one
 * `<url>` per Node per declared language, every `<loc>` the same string the page head
 * carries, and the alternates that relate the two languages -- or none at all for a Tree
 * that declares one.
 *
 * That the document parses is asserted here structurally and in a real XML parser by
 * `tests/browser/findability.spec.ts`, which fetches it from the served application.
 */
import { utimes } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { lastmodDate, sitemapXml } from '../../src/findability/sitemap.ts'
import { openTree, type Tree } from '../../src/tree/loader.ts'
import { addressSet } from '../../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const base = new URL('https://elsa.example.org')
let tree: Tree
let dutchTree: Tree
let awkwardTree: Tree

beforeAll(async () => {
  tree = await openTree(path.join(here, '..', '..', 'trees', 'ai-act-example'))
  dutchTree = await openTree(path.join(here, '..', 'fixtures', 'single-language'))
  awkwardTree = await openTree(path.join(here, '..', 'fixtures', 'findability'))
})

/** The text of every `<loc>`, in document order. */
function locations(document: string): string[] {
  return [...document.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]!)
}

/** The `hreflang` and `href` of every alternate of the `<url>` whose `<loc>` is `url`. */
function alternatesOf(document: string, url: string): Array<{ hreflang: string; url: string }> {
  const entry = document.split('<url>').find((block) => block.includes(`<loc>${url}</loc>`)) ?? ''
  return [...entry.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]*)" href="([^"]*)"\/>/g)].map((match) => ({
    hreflang: match[1]!,
    url: match[2]!,
  }))
}

describe('which pages the sitemap lists', () => {
  test('one <url> per Node per declared language, and nothing else', () => {
    const document = sitemapXml(tree, base, '2026-09-21')
    const nodes = tree.nodeIds().length
    const languages = tree.manifest.languages.length

    expect(nodes).toBe(7)
    expect(languages).toBe(2)
    expect(document.match(/<url>/g)).toHaveLength(nodes * languages)
    expect(locations(document)).toHaveLength(nodes * languages)
  })

  test("every <loc> is that Node's address set entry, absolute, and the two agree", () => {
    const document = sitemapXml(tree, base, null)
    const expected = tree.nodeIds().flatMap((id) => addressSet(tree, id, base).addresses.map((entry) => entry.url))

    expect(locations(document)).toEqual(expected)
    for (const url of locations(document)) expect(url.startsWith('https://elsa.example.org/')).toBe(true)
  })

  test('the Trail, the assets and the documents of 15 and 16 are not listed', () => {
    const document = sitemapXml(tree, base, null)

    // A Node's own page and nothing that leads to it: /<tree>/<node>, never /<tree>/a/b.
    for (const url of locations(document)) {
      expect(new URL(url).pathname.split('/').filter(Boolean), url).toHaveLength(2)
    }
    const listed = locations(document).join(' ')
    for (const absent of ['/images/', '/theme/', '/robots.txt', '/sitemap.xml', '/llms.txt', 'tree.json', '/schemas/']) {
      expect(listed, absent).not.toContain(absent)
    }
  })
})

describe('the alternates', () => {
  test('each <url> repeats the whole set: both languages and x-default', () => {
    const document = sitemapXml(tree, base, null)
    const english = 'https://elsa.example.org/ai-act-example/start'

    expect(alternatesOf(document, english)).toEqual([
      { hreflang: 'en', url: english },
      { hreflang: 'nl', url: `${english}?lang=nl` },
      { hreflang: 'x-default', url: english },
    ])
    // The Dutch member of the group names the same set, including itself: a page named as
    // an alternate that does not name the first page back has its annotation dropped.
    expect(alternatesOf(document, `${english}?lang=nl`)).toEqual(alternatesOf(document, english))
  })

  test('the sets are the address set of that Node, for every Node', () => {
    const document = sitemapXml(tree, base, null)

    for (const id of tree.nodeIds()) {
      const { addresses, alternates } = addressSet(tree, id, base)
      for (const { url } of addresses) expect(alternatesOf(document, url), url).toEqual(alternates)
    }
  })

  test('a Tree that declares one language emits no alternates at all', () => {
    const document = sitemapXml(dutchTree, base, null)

    expect(document).not.toContain('xhtml:link')
    expect(document).not.toContain('x-default')
    expect(locations(document)).toEqual(
      dutchTree.nodeIds().map((id) => `https://elsa.example.org/single-language/${id}`),
    )
  })
})

describe('lastmod', () => {
  const treeDir = (): string => path.join(here, '..', 'fixtures', 'findability')
  let mtime: Date

  beforeAll(() => {
    mtime = awkwardTree.lastModified!
  })

  afterAll(async () => {
    // The fixture's own timestamp is restored: the test below moves it into the future.
    await utimes(path.join(treeDir(), 'tree.json'), mtime, mtime)
  })

  test('ELSA_TREE_LASTMOD wins, for a pipeline that does not preserve timestamps', () => {
    expect(lastmodDate(awkwardTree, '2026-09-21')).toBe('2026-09-21')
  })

  test("otherwise the Tree file's modification time, as a UTC date", () => {
    expect(lastmodDate(awkwardTree, undefined)).toBe(mtime.toISOString().slice(0, 10))
  })

  test('every <url> carries the same date: there is one file', () => {
    const document = sitemapXml(tree, base, '2026-09-21')

    expect(document.match(/<lastmod>2026-09-21<\/lastmod>/g)).toHaveLength(locations(document).length)
  })

  test('a date that cannot be trusted is left out rather than guessed', async () => {
    // A file whose time is in the future is a wrong clock or a touch on the deploy. A
    // search engine that catches a site lying about lastmod stops reading it for that site.
    const future = new Date(Date.now() + 86_400_000)
    await utimes(path.join(treeDir(), 'tree.json'), future, future)
    const reopened = await openTree(treeDir())

    expect(lastmodDate(reopened, undefined)).toBeNull()
    expect(sitemapXml(reopened, base, null)).not.toContain('<lastmod>')
  })
})

describe('the document itself', () => {
  test('the declaration, the namespaces and the root element', () => {
    const document = sitemapXml(tree, base, null)

    expect(document.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true)
    expect(document).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    )
    expect(document.trimEnd().endsWith('</urlset>')).toBe(true)
  })

  test('every element opened is closed, in order', () => {
    const document = sitemapXml(tree, base, '2026-09-21')
    const open: string[] = []

    for (const [, closing, name, selfClosing] of document.matchAll(/<(\/?)([a-z:]+)[^>]*?(\/?)>/g)) {
      if (name === 'xml' || selfClosing === '/') continue
      if (closing === '/') expect(open.pop()).toBe(name)
      else open.push(name!)
    }

    expect(open).toEqual([])
  })

  test('a Tree whose titles carry & and < writes a document with neither in it', () => {
    // Nothing of a Tree's text reaches a sitemap -- it holds ids and dates -- and this is
    // the test that fails the day something does: every `&` is an entity and every `<`
    // opens a tag of this document.
    const document = sitemapXml(awkwardTree, base, '2026-09-21')
    const tags = document.match(/<[^>]*>/g) ?? []

    expect(awkwardTree.manifest.title.en).toContain('&')
    expect(document.match(/&/g)).toBeNull()
    expect(document.match(/</g)).toHaveLength(tags.length)
    expect(document).not.toContain('</script>')
  })

  test('a Tree too large for one sitemap fails loudly rather than truncating', () => {
    // 16.2: the protocol allows 50,000 URLs. A generator that quietly dropped the rest
    // would hide pages from a crawler with nothing to see in the output.
    const huge = {
      ...tree,
      nodeIds: () => Array.from({ length: 25_001 }, (_ignored, index) => `node-${index}`),
    }

    expect(() => sitemapXml(huge, base, null)).toThrow(/50000|50,000/)
  })
})
