/**
 * `sitemap.xml` (docs/specs/application.md 16.2, ADR-118-sitemap-and-alternates): one
 * `<url>` per Node per declared language, each repeating the whole `hreflang` set as the
 * protocol requires, generated from the loaded Tree at request time.
 *
 * Every address comes from `url.ts`'s address set -- the same call the page head renders
 * -- because Google reads a page's `hreflang` links and the sitemap's `xhtml:link` entries
 * as one graph and drops the annotation entirely when the two disagree.
 */
import type { Tree } from '../tree/loader.ts'
import { addressSet } from '../url.ts'

/** The sitemap protocol's namespace, and the one the `xhtml:link` alternates live in. */
const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const XHTML_NS = 'http://www.w3.org/1999/xhtml'

/** The protocol's ceiling for one sitemap: 50,000 URLs (16.2). */
const MAX_URLS = 50_000

/**
 * The `YYYY-MM-DD` UTC date every `<url>` carries, or `null` for a sitemap that carries
 * none (16.2).
 *
 * `override` is `ELSA_TREE_LASTMOD`, for a build pipeline that does not preserve file
 * timestamps, and it wins. Otherwise it is the Tree file's modification time, read once
 * when the Tree was opened -- one file, so no Node's text can change without it changing.
 * A time in the future is a machine with a wrong clock or a `touch` that ran on the
 * deploy, so it is dropped: `lastmod` is optional, and a search engine that catches a site
 * lying about it stops reading it for that site altogether.
 */
export function lastmodDate(tree: Tree, override: string | undefined, now: Date = new Date()): string | null {
  if (override) return override
  const modified = tree.lastModified
  if (!modified || Number.isNaN(modified.getTime()) || modified.getTime() > now.getTime()) return null
  return modified.toISOString().slice(0, 10)
}

/**
 * The document, built against the base the route was given (application.md 16). Throws
 * when the Tree would exceed the protocol's ceiling: a truncated sitemap is a sitemap that
 * silently hides pages, and 16.2 asks a generator that cannot hold the Tree to fail loudly.
 */
export function sitemapXml(tree: Tree, base: URL, lastmod: string | null): string {
  const ids = tree.nodeIds()
  const count = ids.length * tree.manifest.languages.length
  if (count > MAX_URLS) {
    throw new Error(`sitemap.xml would hold ${count} URLs; the protocol allows ${MAX_URLS} (application.md 16.2)`)
  }

  const urls = ids.flatMap((id) => {
    const { addresses, alternates } = addressSet(tree, id, base)
    const links = alternates.map(
      ({ hreflang, url }) => `    <xhtml:link rel="alternate" hreflang="${escape(hreflang)}" href="${escape(url)}"/>`,
    )
    return addresses.map(({ url }) =>
      [`  <url>`, `    <loc>${escape(url)}</loc>`, ...(lastmod ? [`    <lastmod>${escape(lastmod)}</lastmod>`] : []), ...links, `  </url>`].join('\n'),
    )
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${SITEMAP_NS}" xmlns:xhtml="${XHTML_NS}">`,
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
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
