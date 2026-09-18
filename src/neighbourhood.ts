/**
 * The neighbourhood (docs/specs/application.md 11.2, ADR-38-neighbourhood): which Nodes
 * surround the Node on screen, in which direction of the screen each is drawn, and in which
 * slot. The page renders them into its own payload so that following a Branch can slide to
 * a Bubble that is already there (11.3).
 *
 * This is the one place a page takes more than one Node from the loader, and so it is where
 * the bound lives: at most fifteen neighbours, which with the Node on screen and the one
 * Overlay a URL may name makes the seventeen a response may carry (11.5). Fifteen is a
 * contract, not a setting -- widening it is an architecture decision, because it is what
 * stands between a page and the whole Tree.
 */
import type { Tree } from './tree/loader.ts'
import type { Node } from './tree/types.ts'
import { MAX_PATH_IDS, nodeHref, type PageAddress } from './url.ts'

/** Where a neighbour is drawn: above (the parent), below (the Answers), beside (the Options). */
export type Direction = 'up' | 'down' | 'side'

/** One neighbour, placed. */
export interface Placed {
  node: Node
  /** The neighbour's own page: the URL a plain link to it reaches (4.1). */
  href: string
  /** The address `href` names, from which the neighbour's own Branches are built. */
  address: PageAddress
  direction: Direction
  /**
   * Its place in its direction. `up`: 0 the parent, the only one. `down`: 0 and 1 the
   * `yes` and `no` targets, 2 to 5 their `yes` and `no` targets in that order. `side`: the
   * Option's index.
   */
  slot: number
}

/** The bound of 11.2: never more neighbours than this, whatever the Tree. */
export const MAX_NEIGHBOURS = 15

/**
 * The Nodes around `node`, which is the Node `at` names: the last Trail entry up, the
 * Answer targets and theirs down, the Option targets beside. Deduplicated by Node id -- the
 * first placement wins, in that order, and the Node on screen is never its own neighbour --
 * and a Link to an id the Tree does not hold is dropped rather than thrown: the loader has
 * rejected such a Tree at start-up, and a view is not the place to discover it.
 *
 * `node` is passed in rather than read again so that a page reads each Node once: one
 * `getNode` for the Node it shows, and here one per neighbour (11.2, last bullet).
 */
export async function neighbourhood(tree: Tree, at: PageAddress, node: Node): Promise<Placed[]> {
  const read = new Map<string, Promise<Node | null>>()
  const get = (id: string) => {
    if (!read.has(id)) read.set(id, tree.getNode(id))
    return read.get(id)!
  }

  const wanted: { address: PageAddress; direction: Direction; slot: number }[] = []

  // The parent only: the up arrow goes one step back, so the grandparent is never one click away (10.2).
  const parent = at.trail.length - 1
  if (parent >= 0) {
    wanted.push({ address: { ...at, trail: at.trail.slice(0, parent), nodeId: at.trail[parent]! }, direction: 'up', slot: 0 })
  }

  if (node.kind === 'question') {
    const children = [node.answers.yes, node.answers.no].map((id) => followed(at, id))
    children.forEach((address, slot) => wanted.push({ address, direction: 'down', slot }))
    for (const [index, child] of children.entries()) {
      const answers = await get(child.nodeId)
      if (answers?.kind !== 'question') continue
      ;[answers.answers.yes, answers.answers.no].forEach((id, which) =>
        wanted.push({ address: followed(child, id), direction: 'down', slot: 2 + index * 2 + which }),
      )
    }
  }

  node.options.forEach((option, slot) => wanted.push({ address: followed(at, option.target), direction: 'side', slot }))

  const placed: Placed[] = []
  const seen = new Set([node.id])
  for (const { address, direction, slot } of wanted) {
    if (seen.has(address.nodeId)) continue
    const neighbour = await get(address.nodeId)
    if (!neighbour) continue
    seen.add(neighbour.id)
    placed.push({ node: neighbour, href: nodeHref(address), address, direction, slot })
  }
  // The three directions already add up to at most 1 + 6 + 8; the slice states the contract
  // where a later change to them would otherwise break it silently.
  return placed.slice(0, MAX_NEIGHBOURS)
}

/** The address a Link from `at` to `id` reaches: `at` joins the Trail, as `followHref` builds it. */
function followed(at: PageAddress, id: string): PageAddress {
  const ids = [...at.trail, at.nodeId, id].slice(-MAX_PATH_IDS)
  return { ...at, trail: ids.slice(0, -1), nodeId: id }
}
