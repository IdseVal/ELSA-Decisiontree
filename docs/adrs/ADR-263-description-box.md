# ADR-263-description-box: the main image gives way from two fifths to one fifth of the Bubble and of the Overlay's panel, and the description's box takes what the text area leaves, keeping the clear foot; nothing in 10.5 moves

- Status: ACCEPTED (frozen) -- 2026-11-18; decides core document 10.46 with
  `ADR-263-description-limit.md`, `ADR-263-description-scroll.md`, `ADR-263-elsa-tree-8.md` and
  `ADR-263-description-field.md`
- Issue: #263 -- Decide the longer description that scrolls in the Bubble and the Overlay (#262)
- Spec: `docs/specs/application.md` 10.3, 10.5, 10.7, 10.9 (amended `[#263]`) and 43.2, 43.4
  (new); `docs/specs/tree-format.md` 5.7 (the assumptions' main image and description rows)
- Core document: 3.2 `[#75]` (whether the picture's two fifths give way: they do), 3.2 `[#262]`
  (the reading "longer is a taller box", confirmed), section 5 row **Bubble**, 10.46
- Amends: `ADR-78-main-image-and-row-budget.md` (decision 4 as #102 amended it: two fifths of the
  Bubble becomes one fifth; decision 3's description of 48 becomes a box; decision 7 as #102
  amended it: the Overlay's picture, two fifths of its panel, becomes one fifth)
- Depends on: `ADR-263-description-scroll.md` (the box scrolls, so a text taller than it is not a
  defect)
- Measured in: `docs/research/issue-263-description-box.md`
- Built by: #264

## Context

The owner wrote in issue #262 that "the main text box of bubbles and sidebubbles" is to be
"longer". On `dev` (`8e7ad6c`) the text area of the Bubble at 1280 x 640 is 640 x 349 and holds
the main image 160.4 (two fifths of the Bubble's 401), the title 56, the description 48 (two
lines), the Sources 60 and three gaps of 8, with 0.6 of the clear foot left (`application.md`
10.7, measured again: 0.64). The picture's two fifths are the owner's choice on #102 (PR #110,
answer (b)): "The owner chose the picture over the text" (10.7). The round's record leaves the
choice to this issue: "the picture's two fifths stand unless #263 decides that they give way, and
if it does it records why" (`ADR-262-longer-description-round.md` decision 7). Everything else in
the Interior keeps its limits and places (core document 3.2 `[#262]`).

The record measured, on `dev`'s production build with the box of `ADR-263-description-scroll.md`
drawn in and a description of 600 counted characters, the box at four shares of the picture: 2/5,
3/10, 1/4 and 1/5, in the full Node, the first Tree's heaviest Node, the Overlay at its largest
and an Overlay without Options, in both languages, at the twenty viewports of 10.6 and 10.5's
triggers, in Segoe UI, Liberation Sans and Open Sans. Every share fit at every row, with no
element but the box taller than itself (the record's first table). The share decides only how
tall the box is (its third table):

| The picture | Box at 1280 x 640 | At 1280 x 632 | At 1024 x 768 | At the largest Bubble (520) | Overlay at its largest, 1280 x 640 |
|---|---|---|---|---|---|
| 2/5 (`dev`) | **48**, 2 lines | 48 | 59.9 | 66.6 | 66.8 |
| 3/10 | 64.8 | 85.1 | 109.9 | 118.4 | 127.6 |
| 1/4 | 84.9 | 107.4 | 134.8 | 144.3 | 158 |
| **1/5** | **104.9**, 4.4 lines | 129.6 | 159.8 | 168, the whole text in Segoe UI and Liberation Sans; 170.3 of 192 in Open Sans | 168, the whole text in English; 188.4 of 192 in Dutch |

At two fifths the box at the guarantee is the same 48 it is today: the text area has nothing left
to give but the 0.6 of foot.

## Decision

1. **The main image is one fifth of the Bubble's height, on every Node**, where it was two
   fifths: 80.2 of 401 at 1280 x 640, 104 of the largest Bubble's 520, in the same 3 : 2 box,
   cropped and cornered as before; the empty slot of a Node without Images and the withheld slot
   of a neighbour frame are the same box, so the title still sits at one height on every Node and
   a slide has nothing to reflow. **In the Overlay, one fifth of the panel**: 121.6 of 608. One
   rule for both, because the Interior is one component (10.3).
   *Why*: the owner's words ask for a longer box in the Bubble, and at the guarantee the only room
   left to give is the picture's (the table above). Of the shares measured, one fifth is the
   only one that does two things: it gives the box at the guarantee more than twice its two lines
   (104.9 against 48; 1/4 gives 84.9), and at the largest Bubble it shows a description at its
   maximum whole in the default type stack (168 of 168; 1/4 shows 144.3 of it). The owner may
   overrule with another share: the record's third table gives the box for each one measured, and
   the share is one number in the stylesheet.
2. **The description's box is as tall as its text and at most what the text area leaves it**:
   the text area less the picture, the title, the Sources (in an Overlay, its Options' list too),
   their gaps and, in the Bubble, the clear foot of 10.3 (24 pixels plus a quarter of every pixel
   the text area has over 349); the Overlay's panel has no foot (10.9). A short description draws as it does today, its box no taller than its lines,
   and the foot below the Sources opens by the difference.
3. **What yields, in order, when the text area is short**: first the box, down to two lines of its
   type (or its whole text, if that is shorter); then the clear foot, as today; then the picture,
   down to its floor of 30 pixels, as today. The box absorbs what a wider face takes: the
   picture no longer gives way to a face wider than 5.7 assumes (10.3's "never below 30" stands as
   the last step). Measured: the box was never shorter than **104.9**, at 1280 x 640, in any row,
   and the foot never yielded to it (the record's section 2).
4. **The heights, at 10.6's viewports**, with a description at its maximum (the record's fourth
   table, both languages, both platforms). In the full Node's Bubble: **104.9 at 1280 x 640**,
   where the text is 168 and scrolls; at 1366 x 768, 1920 x 1080, 2560 x 1440 and 1280 x 800 the
   whole text, 168 (7 lines in Segoe UI and Liberation Sans), and in the first Tree's Open Sans
   170.3 of its 192; 159.8 at 1024 x 768, scrolling; the whole text at 768 x 1024 (157.5) and at
   390 x 844 (234); 197 at 360 x 640, scrolling (273 of text, 254 in English on Linux); the notice
   at 320 x 480. In the Overlay at its largest: from 1280 x 640 up the whole text in English (168)
   and 188.4 of 192 in Dutch; at 1024 x 768 and the smaller windows the whole text, 135 to 234. A box shorter than its text
   scrolls (`ADR-263-description-scroll.md`).
5. **Nothing in 10.5 moves.** Its order, its eight steps and every trigger stand: the picture is
   still hidden below 632 pixels tall and below 792 wide (step 5), so the share changes nothing
   there; the Sources still collapse below 564 (step 6); the type still steps down (step 7) and
   applies inside the box. The description stays among what is never given up. At every trigger
   the page fit with the box drawn in (the record's first and fourth tables).

## Alternatives rejected

- **Nothing gives way: the picture keeps its two fifths and the box scrolls in what is left.** At
  1280 x 640, 1280 x 639 and 1280 x 632 the box is then 48, the two lines of today, and longer only
  in a taller window (66.6 at the largest Bubble). The owner asked for a longer box, and 1280 x 640
  is the size every limit of the format is written for (10.4).
- **The limit alone, raised, with no box.** Measured: `dev` draws a 600-character text whole and
  the picture gives way to it, down to 41 pixels in Segoe UI and to its floor of 30 in Open Sans,
  where the text area overflows by 13; 11 rows on Windows and 10 on Linux overflow (the record's
  second table). And the picture's size would then follow the Node's text, which #102 ruled out:
  "The title sits at one height on every Node again" (10.3).
- **3/10 or 1/4 of the Bubble.** Measured: 64.8 and 84.9 at the guarantee, 2.7 and 3.5 lines, so
  neither gives the box there twice its present height; and at the largest Bubble 118.4 and 144.3,
  so neither shows a description at its maximum whole there (decision 1).
- **The clear foot gives way before the box.** The foot is kept because "a Sources line drawn in it
  crosses the outline" (10.3); a box that scrolls can give the pixels instead.
- **The title, the Sources or the Answer row give way.** The round keeps their limits and places
  (core document 3.2 `[#262]`: "Nothing else changes").
- **The picture shrinks only on a Node whose description needs it.** A picture whose size follows
  its Node's text puts the title at a different height on each Node, which #102 ruled out, and
  makes a neighbour frame's withheld slot a different box from the picture that replaces it.
- **A box of whole lines** (four lines, 96, at the guarantee). The 8.9 pixels left would open the
  foot further on a Node whose text is longer than its box, where they can show the next line's
  top instead, which is one more sign that the text goes on (`ADR-263-description-scroll.md`
  decision 4).

## Consequences

- `--main-image` in `src/app/[lang]/globals.css` is one fifth where it is two fifths, in the
  Bubble's text area and in `.overlay-interior`; the description's `.prose` takes decision 2 and
  3's flex rules (#264). The comments that say "two fifths" say one fifth.
- `carousel.spec.ts` measures the full Node at 1280 x 640 as picture 80.2, title 56, box 104.9,
  Sources 60 and a foot of 24 (±1); `overlay.spec.ts` the Overlay's picture at one fifth of its
  panel (121.6 at 1280 x 640) (`application.md` 43.11).
- The owner's choice on #102 is given way in part: the picture is half the height it has had since
  2026-09-19. The core document records it in 3.2 `[#75]` and 10.46, where the owner may overrule.
