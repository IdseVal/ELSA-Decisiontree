/**
 * The store (docs/specs/application.md 17, 18; ADR-132-data-directory,
 * ADR-132-many-trees-per-deployment): the one module that opens a file under
 * `ELSA_DATA_DIR`. Routes ask it which Trees are published; components never call it, and
 * `src/tree/` knows nothing of it.
 *
 * This is the read side (#134): the data directory, its lock, the seed at first start, and
 * the set of published Trees every public route works from. **[#135]** Accounts, sessions and
 * the login rate limit are members of `Store`; drafts and writes (#136) join them.
 */
import { cp, mkdir, readdir, readFile, rename, rm, stat, access, constants } from 'node:fs/promises'
import path from 'node:path'
import type { Environment } from '../config.ts'
import { openTree, type Tree } from '../tree/loader.ts'
import { openAccounts, type Accounts } from './accounts.ts'
import { loginLimit, type LoginLimit } from './login-limit.ts'
import { openSessions, type Sessions } from './sessions.ts'
import { writeAtomic } from './write.ts'

/**
 * Tree ids that would collide with a route (application.md 4.3): the two moved-from file
 * addresses, the schema, and the admin area's whole prefix.
 */
export const RESERVED_TREE_IDS: readonly string[] = ['images', 'theme', 'schemas', 'admin']

/** The 1.0 variables and what replaced each; set, the server refuses to start (17.1). */
const RETIRED: Readonly<Record<string, string>> = {
  ELSA_TREE:
    'a deployment now serves every published Tree of ELSA_DATA_DIR, with an overview at / (docs/deployment.md)',
  ELSA_TREES_DIR:
    'it is now ELSA_SEED_DIR, read at the first start only to fill ELSA_DATA_DIR (docs/deployment.md)',
  ELSA_TREE_LASTMOD:
    "the sitemap's lastmod is each Tree's published file's own time, which the store writes (docs/deployment.md)",
}

/** A published Tree the store could not serve, and why: printed at start (18.3). */
export interface Refused {
  id: string
  reason: string
}

/** What the routes ask of the store. Nothing here can return a draft, a `meta.json` or an account (23.1). */
export interface Store {
  /** A servable published Tree; null for a hidden, unservable, unknown or reserved id. */
  published(id: string): Tree | null
  /** Every servable published Tree's id, in id order. */
  publishedIds(): string[]
  /** The published Trees that failed validation at start, in id order (18.3). */
  refused(): Refused[]
  /**
   * Puts `tree` in the published set under `id`, or takes the id out of it (null). The
   * write side calls it in the same call as a publish, an unpublish, a delete or a valid
   * autosave, so the set follows the store without a restart (18.2).
   */
  swap(id: string, tree: Tree | null): void
  /** **[#135]** The accounts of `accounts.json` (20.1 to 20.3). */
  accounts: Accounts
  /** **[#135]** The sessions of `sessions.json` (20.4). */
  sessions: Sessions
  /** **[#135]** The two counters of the login route (20.7). */
  loginLimit: LoginLimit
}

/**
 * Opens the data directory `dataDir` (17.5): refuses the retired variables, checks the
 * folder, takes the lock, deletes what a crash left, **[#135]** opens the accounts and sets
 * the administrator's password from `ELSA_ADMIN_PASSWORD` (20.3), seeds on the first start,
 * and opens every published Tree. Rejects when the directory itself is unusable or the
 * administrator has no password; one Tree that fails validation is refused, reported, and
 * not served (18.3).
 */
export async function openStore(dataDir: string, env: Environment): Promise<Store> {
  refuseRetired(env)
  const root = path.resolve(/* turbopackIgnore: true */ dataDir)
  await checkUsable(root)
  await takeLock(root)
  const treesDir = path.join(/* turbopackIgnore: true */ root, 'trees')
  await removeTemporaries(root, treesDir)
  const accounts = await openAccounts(root, env)
  const admin = accounts.all().find((account) => account.administrator)!
  const sessions = await openSessions(root, accounts)
  // A reset from the environment is the recovery of a leaked password: every session of the
  // administrator ends with it, as any password change ends them (20.4).
  if (accounts.adminPasswordReplaced) await sessions.endAll(admin.id)
  if (!(await isFolder(treesDir))) await seed(seedDirectory(env), treesDir, admin.id)
  const refused: Refused[] = await nameCreator(treesDir, admin.id)

  const served = new Map<string, Tree>()
  for (const id of await listFolders(treesDir)) {
    const dir = path.join(/* turbopackIgnore: true */ treesDir, id)
    // A Tree is published if and only if its published copy exists (17.2).
    if (!(await isFile(path.join(/* turbopackIgnore: true */ dir, 'tree.json')))) continue
    if (refused.some((tree) => tree.id === id)) continue
    if (RESERVED_TREE_IDS.includes(id)) {
      refused.push({ id, reason: `Tree "${id}": "${id}" is a reserved word (application.md 4.3)` })
      continue
    }
    try {
      served.set(id, await openTree(dir))
    } catch (error) {
      refused.push({ id, reason: messageOf(error) })
    }
  }

  return {
    published: (id) => served.get(id) ?? null,
    publishedIds: () => [...served.keys()].sort(),
    refused: () => [...refused],
    swap: (id, tree) => {
      if (tree) served.set(id, tree)
      else served.delete(id)
    },
    accounts,
    sessions,
    loginLimit: loginLimit(),
  }
}

/**
 * Copies the Tree folder `folder` into `treesDir` as a published store Tree (17.4): its
 * `tree.json`, `images/` and `theme/`, a `draft.json` that is a byte copy of `tree.json`,
 * and a `meta.json` naming `creator`. Rejects for a reserved id, an id already in the store
 * and a Tree that fails validation in full, before anything is written.
 *
 * The folder is assembled beside its final place and renamed into it, so a crash never
 * leaves half a Tree under a real id.
 *
 * `creator` is an account id: the administrator's at the seed (17.4). **[#135]** A Tree a
 * #134 store seeded before there were accounts has `null`, which `openStore` replaces.
 */
export async function importTree(folder: string, treesDir: string, creator: string | null): Promise<Tree> {
  const source = path.resolve(/* turbopackIgnore: true */ folder)
  const id = path.basename(source)
  if (RESERVED_TREE_IDS.includes(id)) throw new Error(`Tree "${id}": "${id}" is a reserved word (application.md 4.3)`)
  const target = path.join(/* turbopackIgnore: true */ treesDir, id)
  if (await exists(target)) throw new Error(`Tree "${id}": the store already has a Tree with this id`)
  await openTree(source)

  const staging = `${target}.tmp`
  await rm(staging, { recursive: true, force: true })
  await mkdir(staging, { recursive: true })
  const published = await readFile(path.join(/* turbopackIgnore: true */ source, 'tree.json'))
  // Copied, not rewritten, so the published copy and the draft are the file's own bytes (15.3).
  await cp(path.join(/* turbopackIgnore: true */ source, 'tree.json'), path.join(/* turbopackIgnore: true */ staging, 'tree.json'), {
    preserveTimestamps: true,
  })
  await writeAtomic(path.join(/* turbopackIgnore: true */ staging, 'draft.json'), published)
  // The two names are spelled out rather than looped over, as in the loader: a `path.join`
  // whose last segment is a variable makes Turbopack trace the whole project into the build.
  await copyFolder(path.join(/* turbopackIgnore: true */ source, 'images'), path.join(/* turbopackIgnore: true */ staging, 'images'))
  await copyFolder(path.join(/* turbopackIgnore: true */ source, 'theme'), path.join(/* turbopackIgnore: true */ staging, 'theme'))
  const now = new Date().toISOString()
  const meta = {
    creator,
    collaborators: [],
    createdAt: now,
    updatedAt: now,
    updatedBy: creator,
    publishedAt: now,
    publishCount: 1,
    revision: 0,
  }
  await writeAtomic(path.join(/* turbopackIgnore: true */ staging, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
  await rename(staging, target)
  return openTree(target)
}

/** Refuses a 1.0 environment rather than half-reading it (17.1). */
function refuseRetired(env: Environment): void {
  for (const [name, replacement] of Object.entries(RETIRED)) {
    if (env[name]?.trim()) throw new Error(`${name} is set, and is retired: ${replacement}. Remove it.`)
  }
}

/** The folder the first start fills the store from: ELSA_SEED_DIR, else `trees` here (17.1). */
function seedDirectory(env: Environment): string {
  return path.resolve(/* turbopackIgnore: true */ env.ELSA_SEED_DIR?.trim() || 'trees')
}

/** Refuses a data directory that is missing, not a folder, or not writable (17.1). */
async function checkUsable(root: string): Promise<void> {
  if (!(await isFolder(root))) throw new Error(`ELSA_DATA_DIR=${root} is not a folder`)
  try {
    await access(root, constants.W_OK)
  } catch {
    throw new Error(`ELSA_DATA_DIR=${root} cannot be written`)
  }
}

/**
 * One process per data directory (17.3): refuses while another live process holds the
 * lock, and takes it otherwise. A lock left by a process that is gone -- a crash, a
 * `kill -9` -- is taken over; so is one naming this process, which is what a container
 * restarted with the same pid finds.
 */
async function takeLock(root: string): Promise<void> {
  const file = path.join(/* turbopackIgnore: true */ root, 'lock')
  const holder = Number((await readText(file))?.trim())
  if (Number.isInteger(holder) && holder > 0 && holder !== process.pid && isAlive(holder)) {
    throw new Error(`ELSA_DATA_DIR=${root} is in use by process ${holder}; one process per data directory`)
  }
  await writeAtomic(file, `${process.pid}\n`)
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    // EPERM: the process exists and belongs to someone else.
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/** Deletes what an interrupted write or seed left behind: every `.tmp`, file or folder (17.3). */
async function removeTemporaries(root: string, treesDir: string): Promise<void> {
  const folders = [root, treesDir, ...(await listFolders(treesDir)).map((id) => path.join(/* turbopackIgnore: true */ treesDir, id))]
  for (const folder of folders) {
    for (const name of await listNames(folder)) {
      if (name.endsWith('.tmp')) await rm(path.join(/* turbopackIgnore: true */ folder, name), { recursive: true, force: true })
    }
  }
}

/**
 * The first start (17.1): every Tree folder of `seedDir` imported, published, into a new
 * `treesDir`. Assembled beside it and renamed into place, so a start interrupted mid-seed
 * seeds again rather than leaving half a store that is never seeded. A folder that cannot
 * be imported is skipped, and the reason printed.
 */
async function seed(seedDir: string, treesDir: string, creator: string): Promise<void> {
  const staging = `${treesDir}.tmp`
  await mkdir(staging, { recursive: true })
  const ids = await listFolders(seedDir)
  if (ids.length === 0) console.warn(`No Tree to seed in ${seedDir}; the store starts empty`)
  for (const id of ids) {
    try {
      await importTree(path.join(/* turbopackIgnore: true */ seedDir, id), staging, creator)
      console.log(`Seeded Tree "${id}" from ${seedDir}`)
    } catch (error) {
      console.error(`Not seeded: ${messageOf(error)}`)
    }
  }
  await rename(staging, treesDir)
}

/**
 * **[#135]** Names `creator` -- the administrator -- on every Tree whose `meta.json` names
 * none: the Trees a store seeded before accounts existed (#134), or a test imported without
 * one. Every Tree has a creator from then on (21.1). Answers the Trees whose `meta.json` is
 * not a JSON object: refused and reported, one at a time, while the rest start (18.3).
 */
async function nameCreator(treesDir: string, creator: string): Promise<Refused[]> {
  const broken: Refused[] = []
  for (const id of await listFolders(treesDir)) {
    const file = path.join(/* turbopackIgnore: true */ treesDir, id, 'meta.json')
    const text = await readText(file)
    if (text === null) continue
    let meta: { creator: string | null; updatedBy: string | null }
    try {
      meta = JSON.parse(text) as typeof meta
    } catch (error) {
      broken.push({ id, reason: `Tree "${id}": meta.json is not JSON: ${messageOf(error)}` })
      continue
    }
    if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
      broken.push({ id, reason: `Tree "${id}": meta.json is not a JSON object` })
      continue
    }
    if (meta.creator !== null) continue
    meta.creator = creator
    meta.updatedBy ??= creator
    await writeAtomic(file, `${JSON.stringify(meta, null, 2)}\n`)
  }
  return broken
}

/** Copies the folder `from` whole to `to`, timestamps kept; nothing when there is none. */
async function copyFolder(from: string, to: string): Promise<void> {
  if (await isFolder(from)) await cp(from, to, { recursive: true, preserveTimestamps: true })
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function listNames(dir: string): Promise<string[]> {
  try {
    return await readdir(dir)
  } catch {
    return []
  }
}

/** The sub-folders of `dir`, in name order; none when it cannot be read. */
async function listFolders(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  } catch {
    return []
  }
}

async function readText(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8')
  } catch {
    return null
  }
}

async function exists(file: string): Promise<boolean> {
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

async function isFolder(dir: string): Promise<boolean> {
  try {
    return (await stat(dir)).isDirectory()
  } catch {
    return false
  }
}

async function isFile(file: string): Promise<boolean> {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}
