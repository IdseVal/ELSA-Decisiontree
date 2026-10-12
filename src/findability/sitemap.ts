/**
 * `sitemap.xml` (docs/specs/application.md 16.2, ADR-118-sitemap-and-alternates): one
 * `<url>` per Node per declared language, each repeating the whole `hreflang` set as the
 * protocol requires, generated from the served Trees at request time -- **[#134]** one
 * document over all of them, the overview first (23.4).
 *
 * Every address comes from `url.ts`'s address set -- the same call the page head renders
 * -- because Google reads a page's `hreflang` links and the sitemap's `xhtml:link` entries
 * as one graph and drops the annotation entirely when the two disagree.
 */
import type { Tree } from '../tree/loader.ts'
import { addressSet, overviewAddressSet, type AddressSet } from '../url.ts'

/** The sitemap protocol's namespace, and the one the `xhtml:link` alternates live in. */
const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const XHTML_NS = 'http://www.w3.org/1999/xhtml'

/** The protocol's ceiling for one sitemap: 50,000 URLs (16.2). */
const MAX_URLS = 50_000

/**
 * The `YYYY-MM-DD` UTC date every `<url>` of `tree` carries, or `null` for a Tree whose
 * `<url>`s carry none (16.2, 23.4).
 *
 * **[#134]** It is the Tree's published file's modification time, read once when the store
 * opened it: the store writes that file at every publish, so the time is right by
 * construction and `ELSA_TREE_LASTMOD` is gone. Per Tree, because a Tree that did not change
 * must not claim to have when another one published. A time in the future is a machine
 * with a wrong clock, so it is dropped: `lastmod` is optional, and a search engine that
 * catches a site lying about it stops reading it for that site altogether.
 */
export function lastmodDate(tree: Tree, now: Date = new Date()): string | null {
  const modified = tree.lastModified
  if (!modified || Number.isNaN(modified.getTime()) || modified.getTime() > now.getTime()) return null
  return modified.toISOString().slice(0, 10)
}

/**
 * The document, built against the base the route was given (application.md 16):
 * **[#134]** the overview's addresses first, then every served Tree in the order given --
 * the store's id order -- each Tree's Nodes in file order (23.4). Throws when the sum would
 * exceed the protocol's ceiling: a truncated sitemap is a sitemap that silently hides
 * pages, and 16.2 asks a generator that cannot hold them to fail loudly.
 */
export function sitemapXml(trees: Tree[], base: URL, now: Date = new Date()): string {
  const overview = overviewAddressSet(base)
  const count =
    overview.addresses.length + trees.reduce((sum, tree) => sum + tree.nodeIds().length * tree.manifest.languages.length, 0)
  if (count > MAX_URLS) {
    throw new Error(`sitemap.xml would hold ${count} URLs; the protocol allows ${MAX_URLS} (application.md 16.2)`)
  }

  const urls = [
    ...entries(overview, null),
    ...trees.flatMap((tree) => {
      const lastmod = lastmodDate(tree, now)
      return tree.nodeIds().flatMap((id) => entries(addressSet(tree, id, base), lastmod))
    }),
  ]

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${SITEMAP_NS}" xmlns:xhtml="${XHTML_NS}">`,
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

/** One `<url>` per address of one page, each repeating the page's whole `hreflang` set (16.2). */
function entries({ addresses, alternates }: AddressSet, lastmod: string | null): string[] {
  const links = alternates.map(
    ({ hreflang, url }) => `    <xhtml:link rel="alternate" hreflang="${escape(hreflang)}" href="${escape(url)}"/>`,
  )
  return addresses.map(({ url }) =>
    [`  <url>`, `    <loc>${escape(url)}</loc>`, ...(lastmod ? [`    <lastmod>${escape(lastmod)}</lastmod>`] : []), ...links, `  </url>`].join('\n'),
  )
}

/**
 * XML-escapes a value for element content and for an attribute alike. A Tree is
 * third-party data and an id may hold a character this document gives meaning to, so
 * nothing is written into the document unescaped (13.3's rule, at this sink).
 */
function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
