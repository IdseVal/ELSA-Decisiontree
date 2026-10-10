# ADR-220-answer-row: the Answer row holds two to four alike buttons, in one row from 1000 pixels wide and two a row below; a step of three or four shows the notice below 390 x 560 at least

- Status: ACCEPTED (frozen) -- 2026-10-09; the owner may overrule (core document 10.43)
- **[#231] Amended (2026-10-10)** by `ADR-231-answer-row.md`: decisions 2 and 3 hold for two to
  four; five stand in one row from 1000 pixels wide and three then two below, and the editor's row
  counts its `+` (`docs/specs/application.md` 42.3); and by `ADR-231-five-next-steps.md`: decision
  6's notice holds for three and four, and a row of five has its own (42.4).
- Issue: #220 -- Architecture: freeze how many next steps a step may have
- Spec: `docs/specs/application.md` 10.1, 10.3, 10.4, 10.5, 10.6, 10.7, 41.3, 41.4 (new), amended
  `[#220]`
- Core document: 3.2 (`[#75]` "both should have the same layout, both the same green", read for
  every button; PROPOSED reading of `[#219]` confirmed), 10.22
- Measurements: `docs/research/issue-220-answer-row-room.md`
- Supersedes in part: `ADR-78-answer-buttons-and-up-arrow.md` decision 1 (two buttons of 620 x 60)
- Amends: `ADR-38-no-scroll.md` as amended by 10.22 (one floor for every Node: a step of three or
  four has a higher one at phone widths, an exception beside the floor, which stands)
- Built by: #221

## Context

The row is 68 pixels tall at 1280 x 640 and above -- two buttons of 620 x 60, 4 clear above
and below -- and grows below 1280 to hold a label of more lines (`application.md` 10.1, 10.3).
The owner, #75: "we don't want to steer the user with the button colors, so both should have the
same layout, both the same green". The measurement is `docs/research/issue-220-answer-row-room.md`.

## Decision

1. **Every button of a step's row is the same**: the same fill (`accent-secondary`), the same
   letter colour, the same 19-pixel bold label on 24-pixel lines, the same height, 60, and the
   same width as every other button of its row. A button is an equal share of its row, at most
   620 wide. PROPOSED reading of 3.2 `[#219]` confirmed.
2. **Two buttons stand in one row at every width**, as today.
3. **Three or four stand in one row from 1000 pixels wide, and two a row below 1000**: two rows
   of 60 with a gap of 8, a third button alone on the second row, centred and as wide as the two
   above it, each. At 1000 wide one row of four is 222 pixels a button and keeps a 19-character label
   on two lines in Verdana; at 900 it is still two, at 800 three (measured). 1000 keeps a margin of
   100 pixels over the last width measured to hold two lines in the widest face, for the Linux faces
   not measured here, and it is the width 10.5's step 4 already collapses four Options at. Like that
   step, this is a width trigger keyed to a count.
4. **The order is the file's**: left to right, then row by row; it is the DOM order and so the
   keyboard order (Tab). No button is set apart by place or colour.
5. **At and above 1280 x 640 the row stays 68** and a label takes at most two lines (one, at 19
   characters in a button of 300, measured); below 1280 the row grows as today, by its rows and
   lines.
6. **A step of three or four next steps shows the `minimumSize` notice below 390 pixels wide
   and below 560 pixels tall**, naming the height (`minimumHeight`). Two rows of buttons on the
   full Node need 488 pixels of height in Segoe UI and 536 in Verdana below 390 wide (measured);
   the 24 above 536 are the margin for the Linux faces this run did not measure. 390 and 560 are
   the least: #221 measures the Linux faces, and `application.md` 41.4 fixes how each number
   follows from what it finds -- the height is the larger of 560 and the highest need below the
   notice's width, rounded up to the next ten; the width is the larger of 390 and the lowest
   width from which three and four fit a window 481 tall at every width measured above it, up to
   999, rounded up to the next ten, since Verdana fits at 481 from 390 up with no margin; and
   decision 3's 1000 rises by the same rule if one row of four does not fit at 481 from 1000 up.
   Every other step keeps the floor of 320 x 480. A phone held upright is taller than 560; this
   takes from resized desktop windows only.
7. **The rows of an explanation Node and a Terminal do not change**: `startAgain` alone.

## Alternatives rejected

- **Four in one row at every width.** Below 1000 pixels a 19-character label takes three lines
  and more, down to 5 to 8 at phone widths (measured).
- **Two a row at every width below 1280**, one trigger fewer. It costs a row of 68 at 1024 x 768
  and 1100 x 640, where one row of four fits on two lines (measured).
- **A column of buttons on a phone.** Four buttons of 60 and their gaps are 264 pixels, more than
  two rows' 128.
- **The Answer row scrolling sideways, like the Carousel strip.** A button behind a scroll is a
  button given up, and 10.5 never gives up the Answer buttons.
- **No raised floor; a known cost recorded instead**, as #175 recorded its six-line Option
  title. The page would scroll on a valid Tree, which section 9 forbids; the notice is the one
  thing 10.5 offers when the step's title, description, arrow and buttons do not fit.
- **The bottom row's last button stretched to the full row.** One button would look different
  from the others, which decision 1 forbids.

## Consequences

- #221 builds the row: every button an equal share, at most 620 wide, in one row from 1000 pixels
  wide and two a row below, a lone third centred and as wide as each of the two above, in the
  file's order; and the notice of decision 6 for a step of three or four. It measures the Linux
  faces and records the notice's width and height, and 41.3's 1000 if it moves, in
  `application.md` 41.4 by the rules there, and runs `no-scroll.spec.ts` at the viewports of
  41.9.
- #222's Answer row stands as this one does for its number of buttons, with the editor's own
  notice height (`ADR-220-editing-next-steps.md` decision 8).
- A desktop window resized below 390 pixels wide and 560 tall shows the notice on a step of three
  or four, where it showed the page for a step of two.
- What becomes untrue: `ADR-78-answer-buttons-and-up-arrow.md` decision 1's two buttons of 620 x
  60 as the only row, and `ADR-38-no-scroll.md`'s one floor for every Node; each carries a dated
  line naming this ADR, and core document 10.22 records the exception.
