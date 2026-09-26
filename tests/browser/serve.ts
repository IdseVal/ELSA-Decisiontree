/**
 * A standalone server of the build under test, serving Trees other than the ones
 * playwright.config.ts serves: the fixtures, the first Tree, and **[#134]** data directories
 * of several Trees, some hidden. The same command docs/deployment.md gives, so what a spec
 * sees is what a deployment serves.
 *
 * Each server gets a data directory of its own, built before it starts from the store's own
 * `importTree` (docs/specs/application.md 7, 18.4, 35.1): one process per data directory
 * (17.3), and nothing a spec does reaches the repository's folders.
 *
 * Not a spec file: the specs that start servers of their own import it, and each stops the
 * servers it started when its suite ends.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { importTree } from '../../src/store/index.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))

/** The first port of playwright.config.ts; each spec starts its servers at an offset from it. */
export const BASE_PORT = Number(process.env.ELSA_TEST_PORT ?? 3117)

const started: ChildProcess[] = []
const temporary: string[] = []

/** One Tree of a data directory `dataDir` builds. */
export interface StoreTree {
  /** The Tree folder it is imported from: a fixture, or a Tree of `trees/`. */
  folder: string
  /** Its id in the store; the folder's name when absent. */
  id?: string
  /** Imported and then unpublished: its `tree.json` removed, as unpublishing does (17.2). */
  hidden?: boolean
}

/**
 * A fresh data directory holding `trees`, removed when `stopServers` runs. Rejects, with
 * the loader's message, for a folder that does not validate: the store would refuse it.
 */
export async function dataDir(trees: StoreTree[]): Promise<string> {
  const dir = await scratch()
  const treesDir = path.join(dir, 'trees')
  await mkdir(treesDir)
  for (const { folder, id, hidden } of trees) {
    let source = folder
    if (id && id !== path.basename(folder)) {
      // The id is the folder's name (17.2), so a Tree imported under another is copied first.
      source = path.join(await scratch(), id)
      await cp(folder, source, { recursive: true })
    }
    await importTree(source, treesDir, null)
    if (hidden) await rm(path.join(treesDir, id ?? path.basename(folder), 'tree.json'))
  }
  return dir
}

/**
 * `treeId` out of `treesDir`, alone in a store of its own, answering on `port`. Null for a
 * Tree that does not validate, which the store would not serve (application.md 18.3).
 */
export async function serve(treesDir: string, treeId: string, port: number): Promise<string | null> {
  let dir: string
  try {
    dir = await dataDir([{ folder: path.join(treesDir, treeId) }])
  } catch {
    return null
  }
  return serveStore(dir, port)
}

/**
 * The standalone server on the data directory `dir`, answering on `port`, with no public
 * base URL and an empty seed folder, so that it serves exactly what `dir` holds (35.2).
 *
 * Throws when something already answers on `port`: the new server would die of EADDRINUSE,
 * and the wait below would take the stranger's answer for its own -- a spec would then
 * measure a page it never asked for, and pass.
 */
export async function serveStore(dir: string, port: number, env: Record<string, string> = {}): Promise<string> {
  const origin = `http://127.0.0.1:${port}`
  if (await answers(origin)) throw new Error(`${port} is already serving; ${dir} needs a port of its own`)
  const server = spawn(process.execPath, [path.join('.next', 'standalone', 'server.js')], {
    cwd: repo,
    stdio: 'ignore',
    env: {
      ...process.env,
      ELSA_DATA_DIR: dir,
      ELSA_SEED_DIR: await scratch(),
      ELSA_BASE_URL: '',
      NEXT_TELEMETRY_DISABLED: '1',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      ...env,
    },
  })
  started.push(server)
  let exited = false
  server.on('exit', () => {
    exited = true
  })

  const deadline = Date.now() + 30_000
  for (;;) {
    if (exited) throw new Error(`the server on ${dir} exited before it answered`)
    if (await answers(origin)) return origin
    if (Date.now() > deadline) throw new Error(`${dir} did not start on ${port}`)
    await new Promise((wake) => setTimeout(wake, 250))
  }
}

/** Whether anything answers HTTP at `origin`. */
async function answers(origin: string): Promise<boolean> {
  try {
    return (await fetch(origin, { redirect: 'manual' })).status > 0
  } catch {
    return false
  }
}

/** A fresh empty folder, removed by `stopServers`. */
async function scratch(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'elsa-served-'))
  temporary.push(dir)
  return dir
}

/**
 * Stops every server `serve` and `serveStore` started in this worker, resolves once each
 * has exited -- a worker that starts after this one may ask for the same ports -- and
 * removes their data directories.
 */
export async function stopServers(): Promise<void> {
  await Promise.all(
    started.splice(0).map(
      (server) =>
        new Promise<void>((done) => {
          if (server.exitCode !== null || server.signalCode !== null) return done()
          server.once('exit', () => done())
          server.kill()
        }),
    ),
  )
  // Retried: Windows holds a file of a server that has only just exited for a moment.
  for (const dir of temporary.splice(0)) await rm(dir, { recursive: true, force: true, maxRetries: 5 })
}
