// Temporary: starts the standalone server on a fresh data dir, fetches a list of paths, stops it.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const port = Number(process.env.PROBE_PORT ?? 3197)
const data = process.env.PROBE_DATA ?? mkdtempSync(path.join(tmpdir(), 'elsa-probe-'))
const server = spawn(process.execPath, [path.join('.next', 'standalone', 'server.js')], {
  env: { ...process.env, ELSA_DATA_DIR: data, PORT: String(port), HOSTNAME: '127.0.0.1', NEXT_TELEMETRY_DISABLED: '1', ...(process.env.PROBE_SEED ? { ELSA_SEED_DIR: process.env.PROBE_SEED } : {}) },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let log = ''
server.stdout.on('data', (d) => (log += d))
server.stderr.on('data', (d) => (log += d))
const origin = `http://127.0.0.1:${port}`
for (let i = 0; i < 120; i++) {
  try { await fetch(origin, { redirect: 'manual' }); break } catch { await new Promise((r) => setTimeout(r, 250)) }
}
for (const p of process.argv.slice(2)) {
  const [method, url] = p.startsWith('BODY:') ? ['BODY', p.slice(5)] : ['HEAD', p]
  const r = await fetch(origin + url, { redirect: 'manual' })
  const body = await r.text()
  console.log(`${r.status} ${url}${r.headers.get('location') ? ' -> ' + r.headers.get('location') : ''}${r.headers.get('set-cookie') ? ' SET-COOKIE' : ''}`)
  if (method === 'BODY') console.log(body)
}
server.kill()
await new Promise((r) => server.once('exit', r))
console.log('--- server log ---\n' + log)
if (!process.env.PROBE_DATA) rmSync(data, { recursive: true, force: true })
