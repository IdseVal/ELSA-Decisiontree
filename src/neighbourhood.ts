/**
 * The neighbourhood (docs/specs/application.md 10.9, 11.2; ADR-38-neighbourhood,
 * ADR-78-overlay): which Node a path shows as the centre, which Nodes surround it, in which
 * direction of the screen each placed one is drawn, and which are the page's asides -- the
 * Option targets, carried closed for their Overlays. The page renders them into its own
 * payload so that following a Branch can slide to a Bubble that is already there (11.3) and
 * opening an Option costs no request (10.9).
 *
 * This is the one place a page takes more than one Node from the loader, and so it is where
 * the bound lives: the centre, at most seven placed neighbours, at most eight asides, and
 * the one Overlay a URL may name that is not an aside of the centre -- the seventeen a
 * response may carry (11.5). Seventeen is a contract, not a setting: widening it is an
 * architecture decision, because it is what stands between a page and the whole Tree.
 */
import type { Tree } from './tree/loader.ts'
import type { Node } from './tree/types.ts'
import { MAX_PATH_IDS, nodeHref, type PageAddress } from './url.ts'

/** Where a placed neighbour is drawn: above (the parent), below (the Answers). An Option's target is not placed: it is an aside. */
export type Direction = 'up' | 'down'

/** One neighbour, placed in the tree layer. */
export interface Placed {
  node: Node
  /** The neighbour's own page: the URL a plain link to it reaches (4.1). */
  href: string
  /** The address `href` names, from which the neighbour's own Branches are built. */
  address: PageAddress
  direction: Direction
  /**
   * Its place in its direction. `up`: 0, the parent. `down`: 0 and 1 the `yes` and `no`
   * targets, 2 to 5 their `yes` and `no` targets in that order.
   */
  slot: number
}

/** An Option's target as the page carries it for its Overlay (10.9). */
export interface Aside {
  node: Node
  /** The explanation Node's own address under this centre: the Overlay's heading link (10.9). */
  href: string
  /** The address `href` names, from which the Overlay's own Option links are built. */
  address: PageAddress
}

export interface Neighbourhood {
  /** At most 7: the parent `up`, the Answer targets and theirs `down`. */
  placed: Placed[]
  /** At most 8: the centre's Option targets, in Option order. */
  asides: Aside[]
}

/**
 * What a path names, read the way 10.9 reads it: the centre Node, its address (the path up to
 * it, from which its Branches are built), and the aside chain after it -- the explanation
 * Nodes the path goes on to name, the last of which is rendered as the open Overlay.
 */
export interface Centre {
  address: PageAddress
  node: Node
  /** The explanation Nodes after the centre, in path order; empty when the path ends at the centre. At most `MAX_CHAIN`. */
  chain: Aside[]
  /** Every Node read to find the centre, so that the page reads none of them again (11.2). */
  known: Node[]
}

/** The bound of 11.2 on placed neighbours: the parent, two Answer targets and their four. */
export const MAX_PLACED = 7
/** The bound of 11.2 on asides: the format's eight Options. */
export const MAX_ASIDES = 8
/** The bound of 11.2 on the aside chain: an aside of the centre, and the one Overlay a URL may name that is not. */
export const MAX_CHAIN = 2

/**
 * The centre of the page `at` names and the aside chain after it (10.9): the entries at the
 * end of the path that are explanation Nodes are the chain, each an aside of the one before,
 * and the entry before them is the centre. A path that names only explanation Nodes has no
 * parent to show, so its first entry is the centre and the rest its chain: every Node stays
 * reachable by its own URL. Null when an entry read is not a Node of the Tree, which
 * `parseUrl` has already ruled out for every id it accepts.
 *
 * Reads the last `MAX_CHAIN + 1` entries at most, because a path may be 50 entries of
 * anything (4.3 checks no adjacency) and the seventeen of 11.2 are a contract: the walk back
 * stops after `MAX_CHAIN` explanation Nodes, and the entry before them is the centre
 * whatever its kind. And the first of a chain of two is an aside of that centre or it is
 * the centre itself, under the entry before it: either way the open Overlay is the only
 * Node of the page that may be neither the centre nor its neighbour. In those two shapes,
 * which only a URL that ignores adjacency has, the centre is an explanation Node where
 * 10.9 says "the last entry that is a question Node or a Terminal": #100 asks the
 * Architect to amend that sentence.
 */
export async function centreOf(tree: Tree, at: PageAddress): Promise<Centre | null> {
  const ids = [...at.trail, at.nodeId]
  // An id repeated among the entries read is read once (11.2, last bullet).
  const read = new Map<string, Node | null>()
  const entry = async (index: number): Promise<Aside | null> => {
    const id = ids[index]!
    if (!read.has(id)) read.set(id, await tree.getNode(id))
    const node = read.get(id)
    if (!node) return null
    const address = { ...at, trail: ids.slice(0, index), nodeId: node.id }
    return { node, href: nodeHref(address), address }
  }

  const chain: Aside[] = []
  const stop = Math.max(0, ids.length - 1 - MAX_CHAIN)
  let index = ids.length - 1
  for (; index > stop; index -= 1) {
    const aside = await entry(index)
    if (!aside) return null
    if (aside.node.kind !== 'explanation') break
    chain.unshift(aside)
  }
  const before = await entry(index)
  if (!before) return null

  const known = [...read.values()].filter((n) => n !== null)
  const first = chain[0]
  if (first && chain.length === MAX_CHAIN && !before.node.options.some((option) => option.target === first.node.id)) {
    return { address: first.address, node: first.node, chain: chain.slice(1), known }
  }
  return { address: before.address, node: before.node, chain, known }
}

/**
 * The Nodes around `node`, which is the Node `at` names: the last Trail entry up, the Answer
 * targets and theirs down, the Option targets as asides. The placements are deduplicated by
 * Node id -- the first wins, in that order, and the Node on screen is never its own
 * neighbour -- and an aside that is also placed is still an aside: it is drawn in its
 * Overlay, not in the layer. A Link to an id the Tree does not hold is dropped rather than
 * thrown: the loader has rejected such a Tree at start-up, and a view is not the place to
 * discover it.
 *
 * `node` and `known` are passed in rather than read again so that a page reads each Node
 * once: one `getNode` for the centre, one per entry of its chain (`centreOf`), and here one
 * per neighbour it has not seen (11.2, last bullet).
 */
export async function neighbourhood(tree: Tree, at: PageAddress, node: Node, known: Node[] = []): Promise<Neighbourhood> {
  const read = new Map<string, Promise<Node | null>>(known.map((n) => [n.id, Promise.resolve(n)]))
  const get = (id: string) => {
    if (!read.has(id)) read.set(id, tree.getNode(id))
    return read.get(id)!
  }

  const wanted: { address: PageAddress; direction: Direction; slot: number }[] = []

  // The parent only: the up arrow goes one step back, so the grandparent is never one click away (10.2).
  if (at.trail.length > 0) {
    const index = at.trail.length - 1
    wanted.push({ address: { ...at, trail: at.trail.slice(0, index), nodeId: at.trail[index]! }, direction: 'up', slot: 0 })
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

  const placed: Placed[] = []
  const seen = new Set([node.id])
  for (const { address, direction, slot } of wanted) {
    if (seen.has(address.nodeId)) continue
    const neighbour = await get(address.nodeId)
    if (!neighbour) continue
    seen.add(neighbour.id)
    placed.push({ node: neighbour, href: nodeHref(address), address, direction, slot })
  }

  const asides: Aside[] = []
  for (const option of node.options) {
    const target = await get(option.target)
    if (!target) continue
    const address = followed(at, option.target)
    asides.push({ node: target, href: nodeHref(address), address })
  }

  // The directions already add up to at most 1 + 6, and the format to 8 Options; the slices
  // state the contract where a later change to them would otherwise break it silently.
  return { placed: placed.slice(0, MAX_PLACED), asides: asides.slice(0, MAX_ASIDES) }
}

/** Everything a page renders from: the address it was asked for, its centre and chain, and the centre's neighbourhood. */
export interface NodePage {
  /** The address the URL names, whole: the page's own, which the share link and the language switch carry. */
  address: PageAddress
  centre: Centre
  neighbours: Neighbourhood
}

/**
 * The page a URL names, read within the bound: the centre and its chain (`centreOf`), then
 * the centre's neighbourhood with the Nodes that took already in hand, so that an aside the
 * chain named is not read twice. Null for a path `parseUrl` accepted but the index has since
 * lost a Node of.
 */
export async function loadPage(tree: Tree, address: PageAddress): Promise<NodePage | null> {
  const centre = await centreOf(tree, address)
  if (!centre) return null
  const neighbours = await neighbourhood(tree, centre.address, centre.node, centre.known)
  return { address, centre, neighbours }
}

/** The address a Link from `at` to `id` reaches: `at` joins the Trail, as `followHref` builds it. */
function followed(at: PageAddress, id: string): PageAddress {
  const ids = [...at.trail, at.nodeId, id].slice(-MAX_PATH_IDS)
  return { ...at, trail: ids.slice(0, -1), nodeId: id }
}
