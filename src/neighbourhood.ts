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
 * **[#221]** #220 took that decision (application.md 41.5): a step has up to four next steps,
 * so the placed neighbours are at most 1 + 4 + 16 and a page reads at most **31** Nodes.
 * **[#232]** And #231 took it again (application.md 42.5): up to five next steps, so the placed
 * neighbours are at most 1 + 5 + 25 and a page reads at most **41** Nodes.
 */
import type { Readable, Tree } from './tree/loader.ts'
import { linksOf, type DraftNode, type Node } from './tree/types.ts'
import { MAX_PATH_IDS, nodeHref, type PageAddress } from './url.ts'

/** Where a placed neighbour is drawn: above (the parent), below (the Answers). An Option's target is not placed: it is an aside. */
export type Direction = 'up' | 'down'

/**
 * One neighbour, placed in the tree layer. **[#205]** `N` is the Node type of the Tree read, as
 * `Aside`'s: a draft's in the preview of a hidden Tree (application.md 11.2, 40.2).
 */
export interface Placed<N extends Node | DraftNode = Node> {
  node: N
  /** The neighbour's own page: the URL a plain link to it reaches (4.1). */
  href: string
  /** The address `href` names, from which the neighbour's own Branches are built. */
  address: PageAddress
  direction: Direction
  /**
   * **[#221]** Where its frame stands, in place of #102's `slot` (application.md 41.5): `x`
   * across in layer widths, `y` down in layer heights -- -1 the parent, 1 the centre's next
   * steps, 2 theirs. The layer and the slide read these and nothing else. **[#232]** `x` is a
   * pair, one place for each arrangement of the Answer row (42.5).
   */
  x: Across
  y: number
}

/**
 * **[#232]** A frame's place across, in layer widths, for each arrangement of the Answer row
 * (application.md 42.3, 42.5): `row` in the one row of 1000 pixels wide and wider, `rows` in
 * the two rows below. The slide takes the one the width gives when it starts.
 */
export interface Across {
  row: number
  rows: number
}

/**
 * **[#232]** The width at which the Answer row stands in two rows (application.md 42.3), the
 * stylesheet's own media query for them: the slide reads `rows` while it matches (42.5).
 */
export const ROWS_QUERY = '(max-width: 999px)'

/**
 * An Option's target as the page carries it for its Overlay (10.9). **[#138]** `N` is the
 * Node type of the Tree read: a `Node` on the public page, a `DraftNode` in the editor
 * (application.md 34.6); every public caller leaves it at its default.
 */
export interface Aside<N extends Node | DraftNode = Node> {
  node: N
  /** The explanation Node's own address under this centre: the Overlay's heading link (10.9). */
  href: string
  /** The address `href` names, from which the Overlay's own Option links are built. */
  address: PageAddress
}

export interface Neighbourhood<N extends Node | DraftNode = Node> {
  /** At most 31: the parent `up`, the Answer targets and theirs `down`. */
  placed: Placed<N>[]
  /** At most 8: the centre's Option targets, in Option order. */
  asides: Aside<N>[]
}

/**
 * What a path names, read the way 10.9 reads it: the centre Node, its address (the path up to
 * it, from which its Branches are built), and the aside chain after it -- the explanation
 * Nodes the path goes on to name, the last of which is rendered as the open Overlay.
 */
export interface Centre<N extends Node | DraftNode = Node> {
  address: PageAddress
  node: N
  /** The explanation Nodes after the centre, in path order; empty when the path ends at the centre. At most `MAX_CHAIN`. */
  chain: Aside<N>[]
  /** Every Node read to find the centre, so that the page reads none of them again (11.2). */
  known: N[]
}

/** **[#221]** The bound of 41.5 on placed neighbours, **[#232]** of 42.5: the parent, five next steps and their twenty-five. */
export const MAX_PLACED = 31
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
 * anything (4.3 checks no adjacency) and the forty-one of 42.5 are a contract: the walk back
 * stops after `MAX_CHAIN` explanation Nodes, and the entry before them is the centre
 * whatever its kind. And the first of a chain of two is an aside of that centre or it is
 * the centre itself, under the entry before it: either way the open Overlay is the only
 * Node of the page that may be neither the centre nor its neighbour. In those two shapes,
 * which only a URL that ignores adjacency has, the centre is an explanation Node where
 * 10.9 says "the last entry that is a question Node or a Terminal": #100 asks the
 * Architect to amend that sentence.
 */
export async function centreOf<N extends Node | DraftNode>(tree: Readable<N>, at: PageAddress): Promise<Centre<N> | null> {
  const ids = [...at.trail, at.nodeId]
  // An id repeated among the entries read is read once (11.2, last bullet).
  const read = new Map<string, N | null>()
  const entry = async (index: number): Promise<Aside<N> | null> => {
    const id = ids[index]!
    if (!read.has(id)) read.set(id, await tree.getNode(id))
    const node = read.get(id)
    if (!node) return null
    const address = { ...at, trail: ids.slice(0, index), nodeId: node.id }
    return { node, href: nodeHref(address), address }
  }

  const chain: Aside<N>[] = []
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

  const known = [...read.values()].filter((n): n is N => n !== null)
  const first = chain[0]
  if (first && chain.length === MAX_CHAIN && !before.node.options.some((option) => option.target === first.node.id)) {
    return { address: first.address, node: first.node, chain: chain.slice(1), known }
  }
  return { address: before.address, node: before.node, chain, known }
}

/**
 * **[#205]** The centre of a draft's page (application.md 34.7, 40.2), the editor's rule since
 * #139, which the editor's page and the preview's both apply to what `centreOf` read. A fresh
 * Answer target is an explanation Node by its draft kind until it gets Answers or an end (19.2),
 * and `centreOf` would show it as an Overlay over its parent: in a draft an entry is an aside only
 * where the entry before names it as an Option, and any other explanation Node at the end of the
 * path is the centre, with its up arrow (30.2).
 */
export function draftCentre<N extends Node | DraftNode>(centre: Centre<N>): Centre<N> {
  let at = centre
  for (let first = at.chain[0]; first && !at.node.options.some((option) => option.target === first!.node.id); first = at.chain[0]) {
    at = { address: first.address, node: first.node, chain: at.chain.slice(1), known: at.known }
  }
  return at
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
 *
 * **[#205]** It reads a Tree or a draft (`Readable`, 34.6), and a Node's Links through `linksOf`.
 * **[#221]** A step's *n* next steps stand a layer width apart, centred under it: the *i*-th at
 * `x` = *i* - (*n* - 1) / 2 (41.5), so a draft's lone next step stands straight below.
 * **[#232]** Each stands where its button stands in each arrangement of the row, `across(i, n)`
 * (42.5); the parent at the negated place of the centre's button in the parent's row.
 */
export async function neighbourhood<N extends Node | DraftNode>(tree: Readable<N>, at: PageAddress, node: N, known: N[] = []): Promise<Neighbourhood<N>> {
  const read = new Map<string, Promise<N | null>>(known.map((n) => [n.id, Promise.resolve(n)]))
  const get = (id: string) => {
    if (!read.has(id)) read.set(id, tree.getNode(id))
    return read.get(id)!
  }

  const wanted: { address: PageAddress; direction: Direction; x: Across; y: number }[] = []

  // The parent only: the up arrow goes one step back, so the grandparent is never one click away (10.2).
  // It stands where the step down from it came from, so that going back retraces that step (11.3):
  // above the first of its next steps that names the centre, mirrored; straight above otherwise.
  if (at.trail.length > 0) {
    const index = at.trail.length - 1
    const parent = await get(at.trail[index]!)
    const steps = parent ? linksOf(parent).answers : []
    const step = steps.findIndex((answer) => answer.target === node.id)
    const down = step === -1 ? { row: 0, rows: 0 } : across(step, steps.length)
    // `0 -`, not `-`: a button in the middle mirrors to 0, not -0.
    wanted.push({
      address: { ...at, trail: at.trail.slice(0, index), nodeId: at.trail[index]! },
      direction: 'up',
      x: { row: 0 - down.row, rows: 0 - down.rows },
      y: -1,
    })
  }

  // The second level is counted before deduplication, so a step's frames keep their places
  // whichever of them another placement already took (41.5).
  const children = linksOf(node).answers.map((answer) => followed(at, answer.target))
  children.forEach((address, i) => wanted.push({ address, direction: 'down', x: across(i, children.length), y: 1 }))
  const grandchildren: PageAddress[] = []
  for (const child of children) {
    const below = await get(child.nodeId)
    if (below) grandchildren.push(...linksOf(below).answers.map((answer) => followed(child, answer.target)))
  }
  // No button of the page leads there, so both arrangements share one line (42.5).
  grandchildren.forEach((address, k) => {
    const place = k - (grandchildren.length - 1) / 2
    wanted.push({ address, direction: 'down', x: { row: place, rows: place }, y: 2 })
  })

  const placed: Placed<N>[] = []
  const seen = new Set([node.id])
  for (const { address, direction, x, y } of wanted) {
    if (seen.has(address.nodeId)) continue
    const neighbour = await get(address.nodeId)
    if (!neighbour) continue
    seen.add(neighbour.id)
    placed.push({ node: neighbour, href: nodeHref(address), address, direction, x, y })
  }

  const asides: Aside<N>[] = []
  for (const option of node.options) {
    const target = await get(option.target)
    if (!target) continue
    const address = followed(at, option.target)
    asides.push({ node: target, href: nodeHref(address), address })
  }

  // The directions already add up to at most 1 + 30, and the format to 8 Options; the slices
  // state the contract where a later change to them would otherwise break it silently.
  return { placed: placed.slice(0, MAX_PLACED), asides: asides.slice(0, MAX_ASIDES) }
}

/** Everything a page renders from: the address it was asked for, its centre and chain, and the centre's neighbourhood. */
export interface NodePage<N extends Node | DraftNode = Node> {
  /** The address the URL names, whole: the page's own, which the share link and the language switch carry. */
  address: PageAddress
  centre: Centre<N>
  neighbours: Neighbourhood<N>
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

/**
 * **[#232]** Where the `i`-th (from 0) of `k` buttons of an Answer row stands across, counted in
 * buttons from the middle of its own row (application.md 42.3, 42.5): the *c*-th of a row of *m*
 * at *c* - (*m* - 1) / 2. `row` is its place in one row; `rows` in the two rows below 1000 pixels
 * wide, the first holding half of `k` rounded up -- the same as `row` for one or two buttons,
 * which stand in one row at every width.
 */
export function across(i: number, k: number): Across {
  const row = i - (k - 1) / 2
  if (k <= 2) return { row, rows: row }
  const first = Math.ceil(k / 2)
  const [c, m] = i < first ? [i, first] : [i - first, k - first]
  return { row, rows: c - (m - 1) / 2 }
}

/** The address a Link from `at` to `id` reaches: `at` joins the Trail, as `followHref` builds it. */
function followed(at: PageAddress, id: string): PageAddress {
  const ids = [...at.trail, at.nodeId, id].slice(-MAX_PATH_IDS)
  return { ...at, trail: ids.slice(0, -1), nodeId: id }
}
