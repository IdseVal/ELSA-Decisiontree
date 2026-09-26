/**
 * `npm run validate <tree-folder>` (docs/specs/application.md section 5.4): runs the same
 * `openTree` the server runs at start and prints every violation, one per line, as
 * `tree-id  file  key.path  RULE  message`. Exit code 1 if there is any.
 *
 * Runs with plain Node 22 (built-in type stripping), so no extra tool is needed.
 *
 * **[#138]** `npm run validate -- --draft <tree-folder>` reads the folder's `draft.json` under
 * the draft rules instead (application.md 19.2) and prints its advisory violations in the
 * same form: the line the editor's indicator must agree with, rule id for rule id.
 */
import { formatViolation, openTree, TreeInvalid } from '../src/tree/loader.ts'

const args = process.argv.slice(2)
const draft = args.includes('--draft')
const dir = args.find((arg) => arg !== '--draft')
if (!dir) {
  console.error('usage: npm run validate [--draft] <tree-folder>')
  process.exit(2)
}

try {
  if (draft) {
    const opened = await openTree(dir, { draft: true })
    for (const violation of opened.advisory) console.log(formatViolation(opened.id, violation))
    console.log(`${opened.id}: draft editable (${opened.advisory.length} advisory)`)
  } else {
    const tree = await openTree(dir)
    console.log(`${tree.id}: valid (${tree.manifest.languages.join(', ')}; root "${tree.manifest.root}")`)
  }
} catch (error) {
  if (!(error instanceof TreeInvalid)) throw error
  for (const violation of error.violations) console.error(formatViolation(error.treeId, violation))
  process.exit(1)
}
