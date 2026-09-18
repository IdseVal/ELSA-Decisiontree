/**
 * A standalone server of the build under test, serving a Tree other than the example one
 * playwright.config.ts serves: the fixtures and the first Tree. The same command
 * docs/deployment.md gives, so what a spec sees is what a deployment serves.
 *
 * Not a spec file: `no-scroll.spec.ts`, `carousel.spec.ts` and `chrome-clearance.spec.ts`
 * import it, and each stops the servers it started when its suite ends.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('../..', import.meta.url))

/** The first port of playwright.config.ts; each spec starts its servers at an offset from it. */
export const BASE_PORT = Number(process.env.ELSA_TEST_PORT ?? 3117)

const started: ChildProcess[] = []

/**
 * `treeId` out of `treesDir`, answering on `port`. Null when the server exits before it
 * answers, which is what it does for a Tree that does not validate (application.md 5.4).
 *
 * Throws when something already answers on `port`: the new server would die of EADDRINUSE,
 * and the wait below would take the stranger's answer for its own -- a spec would then
 * measure a page it never asked for, and pass.
 */
export async function serve(treesDir: string, treeId: string, port: number): Promise<string | null> {
  const origin = `http://127.0.0.1:${port}`
  if (await answers(origin)) throw new Error(`${port} is already serving; ${treeId} needs a port of its own`)
  const server = spawn(process.execPath, [path.join('.next', 'standalone', 'server.js')], {
    cwd: repo,
    stdio: 'ignore',
    env: {
      ...process.env,
      ELSA_TREE: treeId,
      ELSA_TREES_DIR: treesDir,
      ELSA_BASE_URL: '',
      NEXT_TELEMETRY_DISABLED: '1',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
    },
  })
  started.push(server)
  let exited = false
  server.on('exit', () => {
    exited = true
  })

  const deadline = Date.now() + 30_000
  for (;;) {
    if (exited) return null
    try {
      if ((await fetch(origin, { redirect: 'manual' })).status > 0) return origin
    } catch {
      if (Date.now() > deadline) throw new Error(`${treeId} did not start on ${port}`)
      await new Promise((wake) => setTimeout(wake, 250))
    }
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

/**
 * Stops every server `serve` started in this worker, and resolves once each has exited: a
 * worker that starts after this one may ask for the same ports.
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
}
