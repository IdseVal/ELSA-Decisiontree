/**
 * Runs after `npm run build` (npm's `postbuild`). `next build` writes the standalone
 * server to `.next/standalone/` but leaves the client bundle and the stylesheet behind in
 * `.next/static/`, so `node .next/standalone/server.js` -- the command README and
 * docs/specs/application.md section 1 give as THE way to run this app -- would serve pages
 * without their CSS or their JavaScript. Copying the two folders in is what Next.js asks
 * of the caller; doing it here means the documented run command works after a plain build.
 *
 * Runs with plain Node 22 (built-in type stripping), so no extra tool is needed.
 */
import { cpSync, existsSync } from 'node:fs'

const COPY: ReadonlyArray<readonly [from: string, to: string]> = [
  ['.next/static', '.next/standalone/.next/static'],
  ['public', '.next/standalone/public'],
]

if (!existsSync('.next/standalone')) {
  console.error('.next/standalone is missing: run `npm run build` first')
  process.exit(1)
}

for (const [from, to] of COPY) {
  if (!existsSync(from)) continue // `public/` is optional; this project has none yet.
  cpSync(from, to, { recursive: true })
  console.log(`${from} -> ${to}`)
}
