# ADR-220-slide-and-neighbourhood: each next step is placed one layer width from its neighbours in one line below the centre, the way back retraces it, and a page reads at most 31 Nodes

- Status: ACCEPTED (frozen) -- 2026-10-09
- Issue: #220 -- Architecture: freeze how many next steps a step may have
- Spec: `docs/specs/application.md` 11.1, 11.2, 11.3, 41.5 (new), amended `[#220]`
- Core document: 3.1 (the neighbouring Nodes, "the next two nodes in each direction"), section 9
  (a bounded set), 10.43
- Supersedes in part: `ADR-38-neighbourhood.md` (at most sixteen neighbours, seventeen Nodes),
  `ADR-78-answer-buttons-and-up-arrow.md` decision 4 and `ADR-38-transitions.md` decision 2, each
  as amended by #102 (the `up` slot 0, 1, 2 and the yes/no diagonal of the slide back), and the
  seventeen of 11.2
- Amends: the bound of seventeen as `ADR-100-bounded-centre.md`, `ADR-205-preview-drawing.md`,
  `ADR-133-reuse-rule.md`, `ADR-78-overlay.md` and `ADR-118-dataset-endpoint.md` state it: 31
- Built by: #221

## Context

`neighbourhood` (`src/neighbourhood.ts`, 11.2) places the parent `up` and the centre's Answer
targets and theirs `down`, at most 1 + 2 + 4, with the Option targets as eight asides: a page
reads at most 17 Nodes, "a contract, not a configuration". A placement's `slot` says where its
frame stands: the `yes` target down and to the left, the `no` target down and to the right, half
the layer's width across, and their four targets in one line two layers down, one width apart
(`src/components/TreeView.tsx`, `position`); the up arrow's slide retraces the step taken (#102).

## Decision

1. **A placement carries its position**, `x` across in layer widths and `y` down in layer
   heights, computed by `neighbourhood`, in place of `slot`; the layer reads it and nothing else.
2. **Down, one level**: the centre's *n* next steps at `y` 1 and `x` = *i* - (*n* - 1) / 2, in
   their order (*i* = 0 .. *n* - 1): -0.5 and 0.5 for two, as today; -1, 0, 1 for three; -1.5,
   -0.5, 0.5, 1.5 for four. The frames stand side by side, a width apart, as two did.
3. **Down, two levels**: every next step of every first-level target, in order, *K* of them
   counted before deduplication, at `y` 2 and `x` = *k* - (*K* - 1) / 2: for two next steps that
   each have two, exactly today's four places; where one has fewer, the others close up (today
   they keep fixed places).
4. **Up**: the parent at `y` -1 and `x` = -(*i* - (*m* - 1) / 2), where *i* is the first of the
   parent's *m* next steps that leads to the centre: the slide back is the step down reversed,
   up and to the right after the first of two, straight up after the middle one of three. After
   any other step, `x` = 0, straight up, as today.
5. **The bound**: up 1, down 4 + 16, asides 8: **29 neighbours**, and **a page reads at most 31
   Nodes** -- the centre, the 29 and the one Overlay a URL may name beyond the asides. 31 is a
   contract as 17 was: no variable or prop raises it. It is still a bounded set, a fixed number
   of Nodes, never the Tree (core document section 9). A step of two places the same Nodes it
   placed.
6. **The slide** (11.3) translates the layer by the target's `x` and `y`, so a button slides to
   its own frame; deduplication, `data-slide` only where a control's `href` is a placement's, and
   a slide never beginning with a Sheet open are unchanged.

## Alternatives rejected

- **Keep 17 by placing one level down only for a step of more than two.** The owner's "the next
  two nodes in each direction" holds for every step, and a rule keyed to the count would make a
  three-way step slide to a frame without its own next steps drawn.
- **Placing the next steps at a fixed angle, fanned closer than a width.** Neighbour frames
  would overlap during the slide; a width apart is what two have always been.
- **Keeping `slot` and teaching the layer every count's geometry.** The geometry would live in two
  modules; `neighbourhood` already knows the counts and the order.

## Consequences

- #221 replaces `Placed`'s `slot` with `x` and `y`, computed in `src/neighbourhood.ts`; the layer
  in `src/components/TreeView.tsx` reads them where its `position` turns a `slot` into a place;
  the slide translates by them. `neighbourhood.test.ts` asserts the positions and the bound of 31, and
  `transition.spec.ts` slides to the third and fourth of four and back up (`application.md` 41.9).
- A step of two places the same Nodes it placed, its two first-level targets where they stood;
  at the second level, where one of them has fewer than two next steps, the others close up.
- What becomes untrue: the seventeen of `application.md` 11.2 and of every ADR that states it,
  `ADR-38-neighbourhood.md`'s sixteen neighbours, and the `up` slot of
  `ADR-78-answer-buttons-and-up-arrow.md` decision 4 and `ADR-38-transitions.md` decision 2; each
  carries a dated line naming this ADR. The editor page's bound of twelve
  (`ADR-133-reuse-rule.md` decision 7) does not change.
