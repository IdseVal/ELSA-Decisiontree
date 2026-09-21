/**
 * What a deployment configures (docs/specs/application.md section 2, ADR-5-tree-selection,
 * docs/deployment.md): the one Tree it serves, named by ELSA_TREE inside ELSA_TREES_DIR,
 * the public base URL its readers reach it at, and -- **[#118]** -- the date the sitemap
 * reports the Tree at (16.2).
 */
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { openTree, type Tree } from './tree/loader.ts'

/** Tree ids that would collide with a route (application.md 4.3). */
const RESERVED_TREE_IDS = ['images', 'theme']

/** Only the three variables below are read, so any string map will do. */
export type Environment = Readonly<Record<string, string | undefined>>

let served: Promise<Tree> | undefined

/** The one Tree this process serves, opened and validated on first use. */
export function servedTree(): Promise<Tree> {
  served ??= openConfiguredTree()
  return served
}

/**
 * Opens the served Tree at server start (application.md section 5.4). A broken Tree never
 * serves a page: the reason is printed and the process exits with code 1.
 *
 * It lives here rather than in instrumentation.ts because Next.js compiles that file for
 * the Edge runtime as well, where `process.exit` does not exist.
 */
export async function startServedTree(): Promise<void> {
  try {
    // Before the Tree, because a typo here is the cheapest failure to report and the
    // server would otherwise carry it until the first page asked for a canonical link.
    const base = publicBaseUrl()
    treeLastmod()
    const tree = await servedTree()
    const at = base ? ` at ${base.origin}` : ''
    console.log(`Serving Tree "${tree.id}" (${tree.manifest.languages.join(', ')})${at}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

/**
 * Opens the Tree the environment names. Rejects, with a message that says why and lists
 * the Tree ids found, when ELSA_TREE is unset, reserved, not a folder, or invalid.
 */
export async function openConfiguredTree(env: Environment = process.env): Promise<Tree> {
  // The folder is a run-time setting, so the bundler cannot know it. Without the opt-out
  // it traces the whole repository into the standalone build (docs/, mail/, .orca/).
  const treesDir = path.resolve(/* turbopackIgnore: true */ env.ELSA_TREES_DIR ?? 'trees')
  const id = env.ELSA_TREE
  const found = async (): Promise<string> => {
    const ids = await listFolders(treesDir)
    return `Tree ids found in ${treesDir}: ${ids.length > 0 ? ids.join(', ') : '(none)'}`
  }
  if (!id) throw new Error(`ELSA_TREE is not set. ${await found()}`)
  if (RESERVED_TREE_IDS.includes(id)) throw new Error(`ELSA_TREE=${id} is a reserved word. ${await found()}`)
  const dir = path.join(treesDir, id)
  if (!(await isFolder(dir))) throw new Error(`ELSA_TREE=${id}: ${dir} is not a folder. ${await found()}`)
  try {
    return await openTree(dir)
  } catch (error) {
    throw new Error(`${(error as Error).message}\n${await found()}`)
  }
}

/**
 * The public base URL this deployment is reached at (ELSA_BASE_URL), or undefined when the
 * deployment names none. It is the origin the server writes into the one absolute link it
 * emits about itself, the canonical link of a Node page; naming none leaves that link a
 * path, which is a valid deployment and what every reader follows anyway.
 *
 * A share link never needs it: the share button copies the browser's own address, so it is
 * the public URL whatever the reverse proxy in front of the server is called.
 *
 * Refused, so that a mistake is a server that does not start rather than a wrong address on
 * every page: anything that is not an absolute http(s) URL, and any URL carrying a path,
 * query or fragment -- the application has no basePath and is served at the root of its
 * host, so a base URL with a path would name pages that answer 404.
 */
export function publicBaseUrl(env: Environment = process.env): URL | undefined {
  const raw = env.ELSA_BASE_URL?.trim()
  if (!raw) return undefined
  const example = 'e.g. https://elsa.example.org'
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`ELSA_BASE_URL=${raw} is not an absolute URL (${example})`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`ELSA_BASE_URL=${raw}: only http and https are served (${example})`)
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new Error(`ELSA_BASE_URL=${raw} must be a bare origin, with no path, query or fragment (${example})`)
  }
  return url
}

/** `YYYY-MM-DD`, and a real date: `2026-02-30` is a typo, not a day. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * **[#118]** The date the sitemap reports every Node at (ELSA_TREE_LASTMOD,
 * application.md 16.2), or undefined when the deployment names none -- in which case the
 * Tree file's own modification time answers.
 *
 * It exists for a build pipeline that does not preserve file timestamps, where the file's
 * time would say the day of the deploy rather than the day the content changed. Refused
 * like a malformed base URL, and for the same reason: a search engine that catches a site
 * lying about `lastmod` stops reading it for that site altogether, so a typo must be a
 * server that does not start rather than a wrong date on every URL.
 */
export function treeLastmod(env: Environment = process.env): string | undefined {
  const raw = env.ELSA_TREE_LASTMOD?.trim()
  if (!raw) return undefined
  const example = 'e.g. 2026-09-21'
  if (!ISO_DATE.test(raw)) throw new Error(`ELSA_TREE_LASTMOD=${raw} is not a YYYY-MM-DD date (${example})`)
  const date = new Date(`${raw}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw new Error(`ELSA_TREE_LASTMOD=${raw} is not a day of the calendar (${example})`)
  }
  return raw
}

/**
 * **[#118]** The base every absolute URL of sections 15 and 16 is built against
 * (application.md 16): ELSA_BASE_URL when the deployment names one, and otherwise the
 * origin this request arrived on -- a sitemap, a `robots.txt` or a canonical link is read
 * away from the page it came from and cannot resolve a path.
 *
 * The request's host is caller-supplied, which is why ADR-11 refused it for the canonical
 * link while that link was allowed to stay relative; #118 amends that decision, because
 * the documents of section 16 have no relative form to fall back on. It is therefore used
 * for nothing but building these URLs -- never fetched, never redirected to, never used to
 * read a file -- and a host that is not a host is dropped rather than parsed. **A public
 * deployment sets ELSA_BASE_URL**, and then nothing below is read at all (docs/deployment.md).
 */
export function baseUrl(requestHeaders: Headers, env: Environment = process.env): URL {
  const configured = publicBaseUrl(env)
  if (configured) return configured
  // A proxy's list value is the client's first; the framework fills both headers itself.
  const host = first(requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'))
  const scheme = first(requestHeaders.get('x-forwarded-proto'))
  const origin = `${scheme === 'https' ? 'https' : 'http'}://${HOST.test(host ?? '') ? host : 'localhost'}`
  return new URL(origin)
}

/** A host or a scheme as one value: what stands before the first comma of a proxy's list. */
function first(header: string | null): string | null {
  return header?.split(',')[0]?.trim() || null
}

/** A host name or address with an optional port, and nothing that could carry a path. */
const HOST = /^[a-z0-9.-]{1,253}(:\d{1,5})?$|^\[[0-9a-f:]{2,45}\](:\d{1,5})?$/i

async function listFolders(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  } catch {
    return []
  }
}

async function isFolder(dir: string): Promise<boolean> {
  try {
    return (await stat(dir)).isDirectory()
  } catch {
    return false
  }
}
