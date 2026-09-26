/**
 * The URL scheme (docs/specs/application.md section 4, ADR-5-url-scheme): the path is the
 * Trail, `/<tree-id>/<id-1>/.../<id-n>`, and the content language arrives as one value, the
 * `[lang]` route segment a rewrite fills from `?lang` (4.4). Nothing else in the
 * application concatenates path segments or decides what a language segment means.
 *
 * An id is accepted only when the Tree's title index knows it, which is also how a
 * malformed id is rejected: the index holds none, and consulting it reads no file.
 *
 * **[#118]** It also builds the absolute form of a link and a Node's **address set** (16.3)
 * -- its canonical URL per declared language and the `hreflang` annotations that relate
 * them -- so that the page head, the sitemap and the JSON-LD say one string for one page.
 */
import { CHROME_LANGUAGES, type ChromeLanguage } from './chrome.ts'
import type { Tree } from './tree/loader.ts'

/** Ids in one path: 49 Trail entries plus the Node shown (application.md 4.3). */
export const MAX_PATH_IDS = 50

/** Where the reader is: which Node, by which Trail, in which language. */
export interface PageAddress {
  treeId: string
  /** The Nodes visited before this one, in the order visited; may be empty. */
  trail: string[]
  /** The Node shown: the last id of the path. */
  nodeId: string
  /** The content language: the `[lang]` segment when the Tree declares it, else `defaultLang`. */
  lang: string
  /**
   * The Tree's default language. Carried in the address because every link must leave
   * `lang` out when it is the default one (4.1), and a link is built from an address alone.
   */
  defaultLang: string
}

/** What `parseUrl` gives back for an address that is not a page of the Tree it was given. */
export type NotFound = null

/**
 * Reads a request path and its language segment into a `PageAddress`, or `NotFound` for
 * every 404 case of application.md 4.3: another Tree's id, no id at all, more than fifty
 * ids, or an id that is malformed or is not a Node of this Tree. The Trail is not checked
 * for adjacency. `lang` is a segment, never a query: 4.4 guarantees one always exists.
 */
export function parseUrl(path: string, lang: string, tree: Tree): PageAddress | NotFound {
  const segments = path.split('/').filter((segment) => segment !== '')
  const [treeId, ...ids] = segments
  if (treeId !== tree.id) return null
  if (ids.length < 1 || ids.length > MAX_PATH_IDS) return null
  if (ids.some((id) => tree.getTitle(id) === null)) return null

  return {
    treeId,
    trail: ids.slice(0, -1),
    nodeId: ids[ids.length - 1]!,
    lang: contentLanguage(tree, lang),
    defaultLang: tree.manifest.defaultLanguage,
  }
}

/**
 * The language a page shows: the one the segment names when the Tree declares it, else the
 * Tree's default (4.3). The segment the router writes when no language was asked for needs
 * no branch of its own -- no Tree declares it, so this rule already answers for it.
 */
export function contentLanguage(tree: Tree, lang: string): string {
  return tree.manifest.languages.includes(lang) ? lang : tree.manifest.defaultLanguage
}

/** The URL of the Tree's root Node: where `/<tree-id>` and the Tree's overview tile lead (4.1, 23.2). */
export function rootHref(tree: Tree, lang: string): string {
  return nodeHref({
    treeId: tree.id,
    trail: [],
    nodeId: tree.manifest.root,
    lang: contentLanguage(tree, lang),
    defaultLang: tree.manifest.defaultLanguage,
  })
}

/** The page `a` itself: its Trail, its Node and its language. This is the share link. */
export function nodeHref(a: PageAddress): string {
  return href(a, [...a.trail, a.nodeId])
}

/**
 * The page reached by following a Link from `a` to `targetId`: the current Node joins the
 * Trail. The oldest entries are dropped when the path would pass fifty ids (4.3).
 */
export function followHref(a: PageAddress, targetId: string): string {
  const ids = [...a.trail, a.nodeId, targetId]
  return href(a, ids.slice(Math.max(0, ids.length - MAX_PATH_IDS)))
}

/** The page of Trail entry `index`, with everything visited after it discarded (10.17). */
export function trailHref(a: PageAddress, index: number): string {
  return href(a, a.trail.slice(0, index + 1))
}

/**
 * The page `a` in another language: the same Trail and the same Node, said in `lang`. This
 * is what the language switch links to (application.md 4.1), and it is why choosing a
 * language never costs the reader their place in the walk.
 */
export function withLang(a: PageAddress, lang: string): string {
  return nodeHref({ ...a, lang })
}

/** The Trail-less URL of the Node shown: what `<link rel="canonical">` points at. */
export function canonicalHref(a: PageAddress): string {
  return href(a, [a.nodeId])
}

/**
 * Where the browser fetches one Image of a Tree (5.3). **[#134]** Under the Tree's id, as
 * every public file of a Tree is: with many Trees `/images/<file>` would name one file of
 * two (application.md 18.1).
 */
export function imageHref(treeId: string, file: string): string {
  return `/${treeId}/images/${encodeURIComponent(file)}`
}

/** Where the browser fetches one file of a Tree's Theme -- a logo or a font (5.5, 18.1). */
export function themeHref(treeId: string, file: string): string {
  return `/${treeId}/theme/${encodeURIComponent(file)}`
}

/**
 * **[#121]** Where a reader, a crawler or another lab fetches the Tree file itself (15.1).
 * The Tree id is in the path for the reason every other public URL of this application
 * carries it: a root-level dataset URL would break or lie the day a second Tree arrives.
 */
export function datasetHref(treeId: string): string {
  return `/${treeId}/tree.json`
}

/**
 * **[#121]** Where the format's JSON Schema is published (15.1). The path carries the
 * format number, so `elsa-tree/5` is served beside it and neither URL ever moves.
 */
export const SCHEMA_HREF = '/schemas/elsa-tree-4.json'

/** `/<tree-id>/<ids...>`, with `lang` only when it is not the Tree's default (4.1). */
function href(a: PageAddress, ids: string[]): string {
  const path = [a.treeId, ...ids].join('/')
  return a.lang === a.defaultLang ? `/${path}` : `/${path}?lang=${encodeURIComponent(a.lang)}`
}

/** The Node's canonical URL in one of the Tree's declared languages (16.3). */
export interface Address {
  lang: string
  /** Absolute, against the base the route was given. */
  url: string
}

/** One `hreflang` annotation: a declared language or `x-default`, and the URL it names. */
export interface Alternate {
  hreflang: string
  url: string
}

/**
 * Every public address of one Node (application.md 16.3): the canonical URL per declared
 * language, and the `hreflang` set that annotates them.
 *
 * This is the one function both the page head and the sitemap render, which is what keeps
 * them from disagreeing -- and `hreflang` is ignored outright by a search engine when the
 * two do disagree, silently, with nothing logged and nothing broken on screen.
 */
export interface AddressSet {
  /** One per declared language, in the order the manifest declares them. */
  addresses: Address[]
  /**
   * What to emit: one entry per declared language, including the page's own -- the
   * self-reference is required for the annotation to be read -- and `x-default` at the
   * default language's address. **Empty for a Tree that declares one language** (16.2):
   * `hreflang` relates translations, and a group of one relates nothing.
   */
  alternates: Alternate[]
}

/**
 * A link this module built, made absolute against `base` (16). The base is handed in --
 * `ELSA_BASE_URL`, or the request's own origin when a deployment names none -- because
 * this module owns the grammar and not what the deployment is called
 * (docs/adrs/ADR-11-public-base-url.md, amended by #118).
 */
export function absolute(href: string, base: URL): string {
  return new URL(href, base).href
}

/** The address set of `nodeId` (16.3). The Node is not read: an address is its id and the Tree's. */
export function addressSet(tree: Tree, nodeId: string, base: URL): AddressSet {
  const { languages, defaultLanguage } = tree.manifest
  const addresses = languages.map((lang) => ({
    lang,
    url: absolute(canonicalHref({ treeId: tree.id, trail: [], nodeId, lang, defaultLang: defaultLanguage }), base),
  }))
  const byDefault = addresses.find((address) => address.lang === defaultLanguage)
  const alternates =
    addresses.length < 2 || !byDefault
      ? []
      : [
          ...addresses.map(({ lang, url }) => ({ hreflang: lang, url })),
          { hreflang: 'x-default', url: byDefault.url },
        ]
  return { addresses, alternates }
}

/**
 * **[#134]** The overview's address in one chrome language (23.2): `/` in English, the
 * first chrome language and the `x-default`, and `/?lang=<tag>` in the others. The
 * overview's languages are the chrome's, whatever the Trees on it declare.
 */
export function overviewHref(lang: ChromeLanguage): string {
  return lang === CHROME_LANGUAGES[0] ? '/' : `/?lang=${lang}`
}

/**
 * **[#134]** The overview's address set (16.3, 23.2): one address per chrome language and
 * the `hreflang` set relating them, which the page head and the sitemap both render.
 */
export function overviewAddressSet(base: URL): AddressSet {
  const addresses = CHROME_LANGUAGES.map((lang) => ({ lang, url: absolute(overviewHref(lang), base) }))
  return {
    addresses,
    alternates: [
      ...addresses.map(({ lang, url }) => ({ hreflang: lang, url })),
      { hreflang: 'x-default', url: addresses[0]!.url },
    ],
  }
}

/**
 * **[#134]** The request header `src/proxy.ts` sets on every request: the path and query the
 * reader asked for, before the `?lang` rewrite. The root layout and the 404 page read it,
 * because Next.js gives neither the path (4.4, 24.3).
 */
export const REQUEST_PATH_HEADER = 'x-elsa-request-path'

/** What `requested` reads out of the header: the path, and the `lang` query or null. */
export interface Requested {
  /** Always one leading slash: `//host` would be another origin in a link built from it. */
  path: string
  lang: string | null
}

/** **[#134]** The header of `REQUEST_PATH_HEADER`, read; `/` when it is absent. */
export function requested(header: string | null): Requested {
  // Split by hand: `new URL('//host/x', base)` would read the path as another origin.
  const value = header ?? '/'
  const query = value.indexOf('?')
  const path = query < 0 ? value : value.slice(0, query)
  const search = query < 0 ? '' : value.slice(query)
  return { path: `/${path.replace(/^\/+/, '')}`, lang: new URLSearchParams(search).get('lang') }
}
