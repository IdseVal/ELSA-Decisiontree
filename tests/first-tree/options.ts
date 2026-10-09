/**
 * The first Tree's Option buttons, as the specs that measure them find them: the Tree the
 * first-Tree server serves (see playwright.first-tree.config.ts), and 10.3's bound on a title.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openTree } from '../../src/tree/loader.ts'

const TREE = 'ai-act-applicability-agrifood'

/**
 * docs/specs/application.md 10.3: an Option title, hyphenated in the page's language, takes at
 * most five lines of the fan's button, whose picture leaves it 120 pixels (#175; four in the
 * 152 before it). This browser has the dictionaries; without them a title can take six (10.7).
 */
export const MAX_LINES = 5

/** 10.5, step 2: at most four lines in the straight columns below 1280 pixels, whose 176 pixels #175 left alone. */
export const MAX_LINES_COLUMN = 4

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
    if (node.kind === 'question') queue.push(...node.answers.map((answer) => answer.target))
    queue.push(...node.options.map((o) => o.target))
  }
  return ids
}
