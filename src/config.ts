/**
 * Tree selection (docs/specs/application.md section 2, ADR-5-tree-selection): one
 * deployment serves exactly one Tree, named by ELSA_TREE inside ELSA_TREES_DIR.
 */
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { openTree, type Tree } from './tree/loader.ts'

/** Tree ids that would collide with a route (application.md 4.3). */
const RESERVED_TREE_IDS = ['images']

/** Only the two variables of section 2 are read, so any string map will do. */
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
    const tree = await servedTree()
    console.log(`Serving Tree "${tree.id}" (${tree.manifest.languages.join(', ')})`)
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
