/**
 * `npm run store -- import <folder>` (docs/specs/application.md 17.4; ADR-132-data-directory
 * decision 7): imports a Tree folder -- `tree.json`, `images/`, `theme/` -- into the store of
 * `ELSA_DATA_DIR`, published, with the administrator as its creator. How a Tree arrives from
 * another deployment or from the repository after the first start.
 *
 * Run it with **the service stopped**: the server is the store's only writer and holds the
 * lock (17.3), and would not see the new folder before its next start anyway. The folder's
 * name is the Tree's id; an id the store has, a reserved one and a Tree that fails validation
 * in full are refused before anything is written, and every violation is printed.
 *
 * Exit code 0 when imported, 1 when refused, 2 for a wrong command line.
 *
 * Runs with plain Node 22 (built-in type stripping), so no extra tool is needed.
 */
import path from 'node:path'
import { importTree, openStore } from '../src/store/index.ts'
import { formatViolation, TreeInvalid } from '../src/tree/loader.ts'

const [command, folder] = process.argv.slice(2)
const dataDir = process.env.ELSA_DATA_DIR?.trim()
if (command !== 'import' || !folder) {
  console.error('usage: npm run store -- import <tree-folder>')
  process.exit(2)
}
if (!dataDir) {
  console.error('ELSA_DATA_DIR is not set: name the data directory of the deployment to import into')
  process.exit(2)
}

try {
  const store = await openStore(dataDir, process.env)
  const administrator = store.accounts.all().find((account) => account.administrator)!
  const id = path.basename(path.resolve(folder))
  await importTree(folder, path.join(path.resolve(dataDir), 'trees'), administrator.id)
  await store.drafts.adopt(id)
  console.log(`Imported Tree "${id}" into ${path.resolve(dataDir)}: published, created by the administrator`)
} catch (error) {
  if (error instanceof TreeInvalid) {
    for (const violation of error.violations) console.error(formatViolation(error.treeId, violation))
  } else {
    console.error(error instanceof Error ? error.message : String(error))
  }
  process.exit(1)
}
