/**
 * What a deployment configures (docs/specs/application.md section 2, ADR-5-tree-selection,
 * docs/deployment.md): the one Tree it serves, named by ELSA_TREE inside ELSA_TREES_DIR,
 * and the public base URL its readers reach it at.
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
