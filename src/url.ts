/**
 * The URL scheme (docs/specs/application.md section 4, ADR-5-url-scheme): the path is the
 * Trail, `/<tree-id>/<id-1>/.../<id-n>`, and the language is the query parameter `lang`.
 * Nothing else in the application concatenates path segments.
 *
 * An id is accepted only when the Tree's title index knows it, which is also how a
 * malformed id is rejected: the index holds none, and consulting it reads no file.
 */
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
  /** The content language: the `lang` of the query when the Tree declares it, else `defaultLang`. */
  lang: string
  /**
   * The Tree's default language. Carried in the address because every link must leave
   * `lang` out when it is the default one (4.1), and a link is built from an address alone.
   */
  defaultLang: string
}

/** What `parseUrl` gives back for an address that is not a page of the served Tree. */
export type NotFound = null

/**
 * Reads a request path and query into a `PageAddress`, or `NotFound` for every 404 case of
 * application.md 4.3: another Tree's id, no id at all, more than fifty ids, or an id that
 * is malformed or is not a Node of this Tree. The Trail is not checked for adjacency.
 */
export function parseUrl(path: string, query: URLSearchParams, tree: Tree): PageAddress | NotFound {
  const segments = path.split('/').filter((segment) => segment !== '')
  const [treeId, ...ids] = segments
  if (treeId !== tree.id) return null
  if (ids.length < 1 || ids.length > MAX_PATH_IDS) return null
  if (ids.some((id) => tree.getTitle(id) === null)) return null

  const defaultLang = tree.manifest.defaultLanguage
  const asked = query.get('lang')
  return {
    treeId,
    trail: ids.slice(0, -1),
    nodeId: ids[ids.length - 1]!,
    lang: asked !== null && tree.manifest.languages.includes(asked) ? asked : defaultLang,
    defaultLang,
  }
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

/** The Trail-less URL of the Node shown: what `<link rel="canonical">` points at. */
export function canonicalHref(a: PageAddress): string {
  return href(a, [a.nodeId])
}

/** Where the browser fetches one Image of the served Tree (5.3). */
export function imageHref(file: string): string {
  return `/images/${encodeURIComponent(file)}`
}

/** `/<tree-id>/<ids...>`, with `lang` only when it is not the Tree's default (4.1). */
function href(a: PageAddress, ids: string[]): string {
  const path = [a.treeId, ...ids].join('/')
  return a.lang === a.defaultLang ? `/${path}` : `/${path}?lang=${encodeURIComponent(a.lang)}`
}
