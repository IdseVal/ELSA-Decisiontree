/**
 * `node tests/browser/data-dir.ts <data-dir> <tree-folder>...`: empties `<data-dir>` and
 * imports each Tree folder into it, published, through the store's own `importTree`
 * (docs/specs/application.md 7, 17.4, 18.4).
 *
 * The playwright configs run it before they start a server, because a `webServer` is a
 * command and its data directory must be fresh at every run: a store is state, and a run
 * that inherited the last one's would test what the last one left.
 */
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { importTree } from '../../src/store/index.ts'

const [dataDir, ...folders] = process.argv.slice(2)
if (!dataDir || folders.length === 0) {
  console.error('usage: node tests/browser/data-dir.ts <data-dir> <tree-folder>...')
  process.exit(2)
}
await rm(dataDir, { recursive: true, force: true, maxRetries: 5 })
await mkdir(path.join(dataDir, 'trees'), { recursive: true })
for (const folder of folders) await importTree(folder, path.join(dataDir, 'trees'), null)
