/**
 * The first Tree's Option buttons, as the specs that measure them find them: the Tree the
 * first-Tree server serves (see playwright.first-tree.config.ts), and 10.3's bound on a title.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openTree } from '../../src/tree/loader.ts'

const TREE = 'ai-act-applicability-agrifood'

/** docs/specs/application.md 10.3: an Option title takes at most four lines. */
export const MAX_LINES = 4

const repo = fileURLToPath(new URL('../..', import.meta.url))

/** Every Node that fans out Options: a question Node, or an explanation Node opened as the centre. */
export async function nodesWithOptions(): Promise<string[]> {
  const tree = await openTree(path.join(repo, 'trees', TREE))
  const ids: string[] = []
  const seen = new Set<string>()
  const queue = [tree.manifest.root]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (seen.has(id)) continue
    seen.add(id)
    const node = await tree.getNode(id)
    if (!node) throw new Error(`the loader cannot read ${id}`)
    if (node.options.length > 0) ids.push(id)
    if (node.kind === 'question') queue.push(node.answers.yes, node.answers.no)
    queue.push(...node.options.map((o) => o.target))
  }
  return ids
}
