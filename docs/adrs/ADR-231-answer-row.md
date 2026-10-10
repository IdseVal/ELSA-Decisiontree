# ADR-231-answer-row: "evenly spread" is every button of a row equally wide and equally far apart; five stand in one row from 1000 pixels wide and three then two below

- Status: ACCEPTED (frozen) -- 2026-10-10; the owner may overrule (core document 10.44)
- Issue: #231 -- Architecture: the round of #230
- Spec: `docs/specs/application.md` 10.1, 10.3, 10.7, 41.3, 42.3 (new), amended `[#231]`
- Core document: 3.2 (`[#75]`, `[#219]`, `[#220]`: every button of a row alike), 3.4 `[#230]` (the
  reading of "evenly spread", confirmed), 10.44
- Measurements: `docs/research/issue-231-five-next-steps.md`
- Amends: `ADR-220-answer-row.md` decisions 2 and 3 (the arrangement, for five and for the editor's
  `+`); `ADR-78-answer-buttons-and-up-arrow.md` as amended by #220 (two to four alike buttons: two to
  five); `ADR-230-tree-creation-round.md` decision 5 (the reading of "evenly spread")
- Built by: #232 (the public page, the preview, and the editor's row as it stands), #233 (the
  editor's `+` in it)

## Context

The owner, on #230: "make sure that these amount of buttons to navigate down the tree (up to 5
buttons) are displayed in a evenly spread out manner". The round record read it, PROPOSED, as "every
button of a step equally wide and equally far apart, spread across the row below the Bubble, at every
width and for every number from two to five" (`ADR-230-tree-creation-round.md` decision 5). On `dev`
(41.3) every button of a row is an equal share of it, at most 620, 20 apart in one row (8 below 480
pixels wide); two stand in one row at every width; three and four in one row from 1000 pixels wide
and, below, two a row -- two then one centred, two and two -- the rows 8 apart. The editor's row
counts its `+` as a button (41.7 item 8). The owner's rule since #75: one layout, one green, no
button steering the reader (core document 3.2).

## Decision

1. **"Evenly spread" is confirmed as read**: every button of a row is the same width and the same
   height, and stands the same distance from its neighbours; a row is centred under the Bubble. That
   holds for every number from one to five and at every width, in one row and in two.
2. **The arrangement is keyed to the number of buttons *k* and the width alone**: from 1000 pixels
   wide, one row; below 1000, one row for *k* of 1 and 2, and for *k* of 3 to 5 two rows, the first
   holding half of *k* rounded up and the second the rest -- **five stand three then two**. A row holding fewer
   buttons than the first is centred, and each of its buttons is as wide as each above: a third of
   the row less its gaps for five, half the row less half its gap for three and four.
3. **Three and four stand as they do**, so 41.3, 41.4 and the measurements of #221 and #222 hold for
   them unchanged.
4. **The editor's row counts its `+`**: *k* is the next steps and the `+` (`ADR-231-one-plus.md`);
   the `+` stands last. On the public page and in the preview *k* is the next steps.
5. **At and above 1280 x 640 the row stays 68**: five buttons of 236 keep a 19-character label on
   two lines in every face measured, on the public page and in the editor.
6. **The order is the file's**, left to right and row by row: the DOM order and the Tab order. No
   button is set apart by colour, size or place.

## Alternatives rejected

- **One row at every width for every count**, the most literal "spread". Five at 360 pixels wide are
  59 pixels each, and a 19-character label takes eight lines (`docs/research/issue-220-answer-row-room.md`).
- **Two a row for five, the fifth alone on a third row.** A third row overflows where three then two
  fit (`ADR-231-five-next-steps.md`), and a lone fifth would stand under two others, not between them.
- **Three then two for four as well (three then one).** A lone fourth would be the one button set
  apart by place; two and two keep every row full.
- **The buttons in a column on a phone.** Every button would stand in the middle, so no slide could
  go toward its side (`ADR-231-slide-toward-the-button.md`), and five of at least 60 pixels and their
  gaps are 332 or more, where three then two, buttons of at most 108 measured at 360 pixels wide, take
  224.
- **Ordering the buttons by column below 1000 pixels wide** (the first down the left, then the right),
  so that each button keeps the side it has in one row. The Tab order would run down a column and up
  to the next, against the order a reader reads the rows in, and the file's order would no longer be
  "left to right and row by row".

## Consequences

- #232 adds the rule of decision 2 for five to the stylesheet beside 41.3's for three and four, for
  the public page, the preview and the editor's row as it stands (the editor's `.answers` rule counts
  `--row-buttons`); #233 makes the editor's `+` count in it.
- The editor's step of four is a row of five buttons once #233 offers its `+`, and stands three then
  two below 1000 pixels wide, its `+` last on the second row.
- What becomes untrue: 41.3's table of two to four, which 42.3 extends; `ADR-220-answer-row.md`
  decisions 2 and 3 as the whole arrangement, and `ADR-78-answer-buttons-and-up-arrow.md`'s two to
  four buttons. Each carries a dated line naming this ADR.
