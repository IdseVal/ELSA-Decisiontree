# ADR-100-bounded-centre: a page finds the centre of its path in at most the last three entries, so the seventeen Nodes of 11.2 hold for every path

- Status: ACCEPTED (frozen) -- 2026-09-19
- Issue: #100 -- Architecture: amend 10.9 where the build of #80 departs from it
- Spec: `docs/specs/application.md` 10.9 (the centre of a path), 10.3 (the row "explanation Node, as the centre"); 11.2 and 4.3 unchanged
- Core document: open item **10.27** (its decision is amended here, not reopened)
- Amends: `ADR-78-overlay.md` decision 4 ("the last entry that is a question Node or a Terminal")
- Built by: #80 (`centreOf` in `src/neighbourhood.ts`, PR #99)

## Context

`ADR-78-overlay.md` decision 4 made the URL of an explanation Node render its parent's
page with that Overlay open: for a path `/<tree>/<id-1>/.../<id-n>` the **centre** is the
last entry that is a question Node or a Terminal, the explanation Nodes after it are the
**aside chain**, and the last of them is the open Overlay.

Two contracts stand against that sentence taken literally:

- **4.3 checks no adjacency.** A path may be 50 entries of anything the Tree holds. The
  kind of an entry is known only by reading it (`getNode`; the loader's seam, 5.1, has
  no cheaper way), so the last question Node or Terminal can be 49 reads back.
- **11.2: a page reads at most 17 Nodes, "a contract, not a configuration".** The count
  is 1 centre + 1 `up` + 6 `down` + 8 asides + 1 Overlay the URL names that is not an
  aside of the centre. Walking back 49 entries breaks it, and so does a chain of any
  length whose first entry is not an aside of the centre: every entry of such a chain
  must be read to be known as an explanation Node, and none of them has a place in the
  seventeen.

The build of #80 (PR #99) bounded the walk rather than break 11.2, and the Reviewer found
that forced (point 1 on head `2e2e47a`). This ADR records the bound as the rule.

## Decision

A page finds its centre by reading **at most the last three entries** of its path:

1. **The walk.** From `<id-n>` backwards, the explanation Nodes met, **at most two**, are
   the aside chain, and the last of them is the open Overlay. The walk stops at the first
   entry that is not an explanation Node, after two explanation Nodes, or at `<id-1>`,
   and **the entry it stops on is the centre, whatever its kind**.
2. **The recentring rule.** When the chain is two entries long and its first entry is
   **not an Option target of the centre**, that first entry is the centre instead, and
   the second alone is its chain.

Rule 1 bounds the reads at three. Rule 2 keeps the Overlay count at one: after it, the
first entry of a chain of two is always an aside of the centre (so already one of the
eight), and only the last entry of the chain can be a Node that is neither the centre
nor its neighbour. The worst case is 1 + 1 + 6 + 8 + 1 = **17**, for every path.

**What that means for the paths the application builds.** Every link the application
renders -- the Answer buttons, the Options and their collapsed Sheet, the second-level
Options, the up arrow, `startAgain` -- builds a path whose every entry is an Answer or
Option target of the one before, and in such a path rule 2 never applies. The centre is
then the last question Node or Terminal, as `ADR-78-overlay.md` wrote, **whenever at
most two explanation Nodes follow it**. It is an explanation Node, drawn as the
"explanation Node, as the centre" situation of 10.3, in two cases:

- **A path with no question Node or Terminal in it**, `/<tree>/<explanation-id>`: the
  case decision 4 of `ADR-78-overlay.md` already had, with no parent to show.
- **A path that ends in three or more explanation Nodes**: the centre is the third from
  the end. The format allows it -- an explanation Node may have Options
  (`tree-format.md` 5.6), and their targets may be explanation Nodes with Options of
  their own -- and the application links to it: on the page of `/<tree>/Q/E1/E2` the
  second-level Overlay of `E2` lists `E2`'s Options as links to `/<tree>/Q/E1/E2/E3`,
  and that page is centred on `E1`, with `Q` above it (its up arrow and `up`
  placement), `E2` as one of its Option buttons and `E3` open. On 2026-09-19 neither
  Tree and no fixture has an explanation Node whose Option target has an explanation
  Node as an Option target, so no page served today reaches it (counted with a script
  over every `tree.yaml` under `trees/` and `tests/fixtures/`).

Rule 2 is reached only by a path that ignores adjacency, typed or edited by hand.

The row of 10.3 for an explanation Node as the centre gains the up arrow when the path
has an entry before the centre: that is the up arrow's own rule (10.2), and in the
second case above the path has one.

## Alternatives rejected

- **Keep 10.9's literal rule, and let a page read as many Nodes as the walk needs.**
  Rejected: it makes 17 depend on the URL. 11.2 marks 17 a contract because it is the
  number between this application and "the browser received the whole Tree"; a limit a
  URL can raise is not one.
- **Keep the literal rule and learn each entry's kind without reading the Node** (a
  `kindOf(id)` on the loader, beside `getTitle`). Rejected: it widens the loader's
  interface (5.1) for one caller, and it bounds only the reads: a chain of any length
  whose first entry is not an aside of the centre still needs a place on the page for
  each entry, or a rule for which of them to drop -- which is rule 2 again.
- **Answer 404 for a path that is not adjacent, or that ends in more than two
  explanation Nodes.** Rejected: 4.3's answers are frozen and the owner kept section 4
  unchanged (#75, #78); a link the application itself renders (the second case above)
  would answer 404; and "every Node stays reachable by its URL" (core document 3.2)
  would hold only for some URLs.
- **Build a second-level Overlay's own Options from the centre's path** (`/<tree>/Q/E2/E3`
  rather than `/<tree>/Q/E1/E2/E3`), so that the application never links to a path
  ending in three explanation Nodes. Rejected: the link would not be adjacent (`E2` is
  not an Option of `Q`), so rule 2 would centre it on `E2` with `Q` as `E2`'s parent,
  which the Tree does not say; and it would change a link the build already emits for a
  case no Tree has yet. The page the adjacent link opens -- centred on the aside the
  reader came through -- is the more truthful one.
- **Raise 17 to cover a longer chain.** Rejected: widening it is an `architecture`
  issue with a reason, and the only reason here is URLs no reader is sent to.

## Consequences

- `application.md` 10.9 states rules 1 and 2 and the cases above; 10.3's row names the
  bounded case and the up arrow. 11.2 and 11.5 are unchanged: the bound is what keeps
  them true.
- `src/neighbourhood.ts`'s `centreOf` is the rule as written (`MAX_CHAIN = 2`); its
  docstring can drop its pointer to #100 and cite 10.9. Nothing in the build changes.
- `ADR-78-overlay.md` decision 4 and core document 10.27 point here.
- If an author writes an aside of an aside of an aside, the page centred on the first of
  them is expected behaviour, not a defect. `tests/neighbourhood.test.ts` on PR #99
  already pins both shapes (a path ending `opt-three/opt-one/opt-two/opt-four` is
  centred on `opt-one`; `opt-one/opt-three/opt-four`, where `opt-three` is not an Option
  of `opt-one`, is centred on `opt-three`) and the three-read bound on a 49-entry path.
