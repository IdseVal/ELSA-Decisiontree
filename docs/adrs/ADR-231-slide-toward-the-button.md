# ADR-231-slide-toward-the-button: each next step is placed where its button stands in the row the width gives, so its slide goes toward the button at every width; a page reads at most 41 Nodes

- Status: ACCEPTED (frozen) -- 2026-10-10; the owner may overrule (core document 10.44)
- Issue: #231 -- Architecture: the round of #230
- Spec: `docs/specs/application.md` 0, 5.2, 7, 10.9, 11.1, 11.2, 11.3, 11.5, 34.5, 34.7, 40.2, 41.5,
  42.5 (new), amended `[#231]`
- Core document: 3.1 (the neighbouring Nodes), 3.2 `[#230]` (the reading of the slide, confirmed),
  section 9 (a bounded set), 10.27, 10.41, 10.44
- Measurements: `docs/research/issue-230-slide-direction.md` (where `dev`'s slide goes);
  `docs/research/issue-231-five-next-steps.md` section 4 (the places that follow)
- Supersedes in part: `ADR-220-slide-and-neighbourhood.md` (one `x` a step's next steps stand at, the
  places of one row at every width; 29 neighbours and 31 Nodes)
- Amends: `ADR-38-neighbourhood.md` and `ADR-38-transitions.md` as amended by #220 (29 neighbours, 31
  Nodes, the places of the step down and back); `ADR-78-answer-buttons-and-up-arrow.md` decision 4
  as amended by #220 (the up arrow's place); the bound of 31 as `ADR-100-bounded-centre.md`,
  `ADR-205-preview-drawing.md`, `ADR-133-reuse-rule.md`, `ADR-78-overlay.md` and
  `ADR-118-dataset-endpoint.md` state it: 41; `ADR-230-tree-creation-round.md` decision 5 (the
  reading of the slide)
- Built by: #232

## Context

The owner, on #230: "when click, the view slides in the direction of the button, so it feels as if you
are moving in its direction (and when the user presses back, it goes in the same path backwards, but
we already solved that I think)". On `dev` (41.5) a step's *n* next steps are placed one layer height
down at `x` = *i* - (*n* - 1) / 2 layer widths -- the places of one row -- at every width; the
parent is placed where the step down started, so the up arrow retraces it (#102); `Slider` draws one
neighbour frame during a slide, the one it goes to (`src/components/Slider.tsx`). Below 1000 pixels
wide three and four stand two a row, and 4 of their 7 buttons slide the other way or straight down
(`docs/research/issue-230-slide-direction.md`). Up 1, down 4 + 16, asides 8: a page reads at most 31
Nodes, a bounded set (core document section 9).

## Decision

1. **A next step's target stands where its button stands.** It is placed one layer height below the
   centre and, across, as far from the middle as its button stands from the middle of its own row,
   counted in buttons: the *c*-th (from 0) of a row of *m* at *c* - (*m* - 1) / 2. A button left of
   its row's middle slides down and to the left, right of it down and to the right, in the middle
   straight down, at every width and for every number: the reading of core document 3.2 and 3.4
   `[#230]`, confirmed.
2. **`Placed`'s `x` is a pair**, `{ row, rows }`: the place in one row, used from 1000 pixels wide,
   and the place in the two rows of `ADR-231-answer-row.md` decision 2, used below. One function,
   `across(i, k)` in `src/neighbourhood.ts`, gives both for the *i*-th of *k* buttons; the media query
   of 1000 pixels is a constant beside it, and the stylesheet's rows use the same width.
3. **The slide reads the half the width gives when it starts** -- a click, the arrival a click hands
   over, a history step's arrival -- and translates the layer by it, as 11.3 has it.
4. **The way back retraces the step at the width it is taken.** The parent is placed at the negated
   place of the centre's button in the parent's row, both halves; straight above after any other
   step. The up arrow's slide and the browser's back, when the payload is in the framework's cache,
   are the step down reversed (11.3): the owner's "we already solved that", kept.
5. **Two places may be one.** Below 1000 pixels wide the first and third of four stand on the left and
   their targets at one place, and so do the second and fourth; a slide draws one neighbour frame, so
   two frames never meet on screen, and deduplication by Node id is unchanged.
6. **Two levels down** stays 41.5's line, *k* - (*K* - 1) / 2, both halves alike: no button of the page
   leads there.
7. **The bound**: up 1, down at most 5 + 25, asides 8: **39 neighbours, and a page reads at most 41
   Nodes**, a contract as 31 was, for the public page and the preview of a hidden Tree. It is still a
   bounded set, a fixed number, never the Tree.

## Alternatives rejected

- **One place per button at every width, the one-row place, with the rows reordered by column below
  1000** so that each button keeps its one-row side. The Tab order would no longer follow the rows
  (`ADR-231-answer-row.md`).
- **Places in two dimensions, the second row's targets two layer heights down.** The second level's
  line is there, and a second-row button would slide twice as far as the first row's for one step down.
- **Spreading the second row's targets outward** (four: -0.5, 0.5, then -1.5, 1.5) to keep every place
  apart. A button on the second row would slide three times as far across as the one above it, which
  stands as far from the middle; decision 5's shared place is never seen.
- **Measuring the button in the page at the click and sliding by its offset.** The up arrow's way back
  is placed by the server, on the child's page, where the parent's button is not in the page; one rule
  in one module serves both directions.
- **Dropping the second level for a step of five to keep 31.** "The next two nodes in each direction"
  holds for every step (`ADR-220-slide-and-neighbourhood.md`, Alternatives).

## Consequences

- #232 replaces `x` with the pair in `Placed` and in `Neighbour` (`src/components/Slider.tsx`),
  adds `across` and the constant, makes `Slider` read the half the width gives, raises `MAX_PLACED` to
  31 and the bound to 41, and tests each button of two to five at 1280 x 640, 999 x 640 and below 600
  against where it stands, and the way back (42.10).
- From 1000 pixels wide every place is what it was: a step of two to four slides as it slid.
- What becomes untrue: 41.5's one `x`, the 29 and 31 of 11.2, 41.5 and every ADR that states them, and
  core document 10.27's and 10.41's 31; each carries a dated line naming this ADR. The editor page's
  bound is `ADR-231-slide-in-the-editor.md`'s.
