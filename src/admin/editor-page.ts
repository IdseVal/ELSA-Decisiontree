/**
 * **[#234]** What the editor's page reads of a draft (docs/specs/application.md 34.7, 42.8;
 * ADR-231-slide-in-the-editor): `centreOf → draftCentre → the asides by id → editorNeighbours`,
 * at most eighteen Nodes -- the centre and its chain (at most 3), its Option targets (at most 8)
 * and the six placed, the parent and the centre's next steps, for the slide. `neighbourhood()`
 * is not called. Every address the page carries is the editor's, so that a next step's button
 * and the up arrow find the placement they slide to (11.3), and the tree view tells the Overlay a
 * URL opened by its href (10.9).
 *
 * Server side, beside `previewPage`: the page renders what this returns.
 */
import { editorLinks } from '../editor/links.ts'
import { centreOf, draftCentre, editorNeighbours, MAX_ASIDES, type Aside, type NodePage } from '../neighbourhood.ts'
import type { Readable } from '../tree/loader.ts'
import type { DraftNode } from '../tree/types.ts'
import type { PageAddress } from '../url.ts'
import { previewNode } from './preview.ts'

/**
 * The editor's page at `address` (34.7, 42.8): the centre, its chain and its asides as they are in
 * the draft, the fields' values; the placed neighbours as the preview draws a draft's frames, the
 * bracketed placeholder where the draft has no text yet (40.7). Null where `parseUrl` accepted a
 * path the draft has since lost a Node of.
 */
export async function editorPage(draft: Readable<DraftNode>, address: PageAddress): Promise<NodePage<DraftNode> | null> {
  const read = await centreOf(draft, address)
  if (!read) return null
  const links = editorLinks()
  const here = <T extends { address: PageAddress }>(entry: T): T => ({ ...entry, href: links.node(entry.address) })
  // **[#139]** A fresh step a yes or a no made is the centre, with its up arrow (30.2); **[#205]** the rule is `draftCentre`'s, which the preview applies too (40.2).
  const found = draftCentre(read)
  const centre = { ...found, chain: found.chain.map(here) }

  // The centre's Option targets, for their Overlays (10.9): at most eight, read by id.
  const asides: Aside<DraftNode>[] = []
  for (const option of centre.node.options.slice(0, MAX_ASIDES)) {
    const target = await draft.getNode(option.target)
    if (!target) continue
    const ids = [...centre.address.trail, centre.address.nodeId, option.target]
    asides.push(here({ node: target, href: '', address: { ...centre.address, trail: ids.slice(0, -1), nodeId: option.target } }))
  }

  // An aside that is also a next step's target is not read twice (11.2, last bullet).
  const placed = await editorNeighbours(draft, centre.address, centre.node, [...centre.known, ...asides.map((aside) => aside.node)])
  return {
    address,
    centre,
    neighbours: { placed: placed.map((p) => ({ ...here(p), node: previewNode(p.node, address.lang) })), asides },
  }
}
