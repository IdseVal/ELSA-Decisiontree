/**
 * What a deployment configures (docs/specs/application.md 17.1, 18; docs/deployment.md):
 * the data directory its store lives in, and the public base URL its readers reach it at.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { openStore, type Store } from './store/index.ts'

/** Only the variables below are read, so any string map will do. */
export type Environment = Readonly<Record<string, string | undefined>>

/**
 * Where the one store of this process is kept. On `globalThis` rather than in a module
 * variable because Next.js bundles `instrumentation.ts` and the routes apart, and each
 * bundle would otherwise hold its own copy of this module -- two stores on one data
 * directory, which is what 17.3 forbids.
 */
const STORE = Symbol.for('elsa.store')
const held = globalThis as typeof globalThis & { [STORE]?: Promise<Store> }

/** The store of this process, opened on first use (application.md 17.5). */
export function store(): Promise<Store> {
  held[STORE] ??= openConfiguredStore()
  return held[STORE]
}

/**
 * Opens the store at server start (application.md 5.4, 18.3) and prints one line per Tree
 * served and one block per Tree refused. An unusable data directory never serves a page:
 * the reason is printed and the process exits with code 1. One invalid Tree does not stop
 * the others.
 *
 * It lives here rather than in instrumentation.ts because Next.js compiles that file for
 * the Edge runtime as well, where `process.exit` does not exist.
 */
export async function startStore(): Promise<void> {
  try {
    // Before the store, because a typo here is the cheapest failure to report and the
    // server would otherwise carry it until the first page asked for a canonical link.
    const base = publicBaseUrl()
    const opened = await store()
    for (const id of opened.publishedIds()) {
      const tree = opened.published(id)!
      console.log(`Serving Tree "${id}" (${tree.manifest.languages.join(', ')})`)
    }
    for (const { reason } of opened.refused()) console.error(`Not serving, published but invalid: ${reason}`)
    if (opened.publishedIds().length === 0) console.log('Serving no Tree: none is published and valid')
    if (base) console.log(`Reached at ${base.origin}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

/**
 * Opens the store the environment names. Rejects, with a message that says why, when
 * ELSA_DATA_DIR is unset or unusable or a retired variable is set (17.1).
 *
 * `next dev` creates the folder when it is missing, so that deleting `.elsa-data` is the
 * reset of 17.4; a production server never does, because a mistyped path must be a server
 * that does not start rather than an empty store somewhere unexpected.
 */
export async function openConfiguredStore(env: Environment = process.env): Promise<Store> {
  const dir = env.ELSA_DATA_DIR?.trim()
  if (!dir) throw new Error('ELSA_DATA_DIR is not set: name the folder that holds the Trees of this deployment (docs/deployment.md)')
  if (env.NODE_ENV === 'development') await mkdir(path.resolve(/* turbopackIgnore: true */ dir), { recursive: true })
  return openStore(dir, env)
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
