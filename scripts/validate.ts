/**
 * `npm run validate <tree-folder>` (docs/specs/application.md section 5.4): runs the same
 * `openTree` the server runs at start and prints every violation, one per line, as
 * `tree-id  file  key.path  RULE  message`. Exit code 1 if there is any.
 *
 * Runs with plain Node 22 (built-in type stripping), so no extra tool is needed.
 */
import { formatViolation, openTree, TreeInvalid } from '../src/tree/loader.ts'

const dir = process.argv[2]
if (!dir) {
  console.error('usage: npm run validate <tree-folder>')
  process.exit(2)
}

try {
  const tree = await openTree(dir)
  console.log(`${tree.id}: valid (${tree.manifest.languages.join(', ')}; root "${tree.manifest.root}")`)
} catch (error) {
  if (!(error instanceof TreeInvalid)) throw error
  for (const violation of error.violations) console.error(formatViolation(error.treeId, violation))
  process.exit(1)
}
