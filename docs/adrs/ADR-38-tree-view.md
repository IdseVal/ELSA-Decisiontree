# ADR-38-tree-view: the open Node is a round Bubble in the centre of the screen, the Trail is the Branches above it, the Answer targets are Branches below and the Option targets Branches beside, so that direction on screen carries the meaning of a Link

- Status: ACCEPTED (frozen) -- 2026-09-10; amended 2026-09-12 by issue #41 (the numbers as built, below)
- Issue: #38 -- Architecture: freeze the version 0.2 application contracts
- Spec: `docs/specs/application.md`, section 10 (10.1 to 10.3)
- Core document: 3.2, section 5 (Bubble, Branch, Trail), open item 10.23

## Context

Version 0.1 rendered a Node as a column of text with the Trail drawn as a line above it.
The owner looked at it and wrote (#35): "the view of the frontend in no way resembles a
tree. The opened node should be displayed as a bubble, with the branches above visible
and clickable, and branches going out below or beside it for the children and side
children." And: "a bubble is round btw."

The Tree format gives a Node at most two Answers and at most eight Options
(`tree-format.md` 5.4, 5.6), and the Trail is unbounded in the format and capped at 49
entries in the URL (`application.md` 4.3). `tree-format.md` 5.7 derived every length
limit from an assumed 1280 x 640 viewport with a 760 x 360 Bubble, and left two
questions to this issue: what happens when a Node's ten Branches need 1500 pixels
across a 1280-pixel screen, and what a Trail longer than six entries does.

The owner has not yet said what "children" and "side children" mean (core document
10.23, PROPOSED: Answer targets and Option targets).

## Decision

1. **Six rows, fixed, in one screen** (`application.md` 10.1): chrome bar 44, Trail 64,
   middle 360, Answers 64, Carousel 80, disclaimer 28 -- the vertical budget
   `tree-format.md` 5.7 assumed, unchanged. Horizontally the middle row is
   240 + 20 + 760 + 20 + 240 = 1280: an Option column, a gap, the Bubble, a gap, an
   Option column.
2. **The Bubble is round and never shrinks.** Its text area is at least 640 x 304 CSS
   pixels at every viewport at or above the guarantee; extra width goes to the Option
   columns and the margins, extra height to the Bubble. This is what makes the format's
   length limits a promise at every size and not only at exactly 1280 x 640.
3. **Direction carries meaning.** Above is where you came from (the Trail); below is
   where an answer takes you (the Answer targets, the owner's *children*); beside is an
   aside you read and return from (the Option targets, the *side children*). This is the
   PROPOSED reading of 10.23, made visible: if the owner corrects it, what changes is
   the direction a Link is drawn in, in one module (`src/neighbourhood.ts`), and no
   other contract moves.
4. **Answers below, Options beside, resolves `tree-format.md` 5.7's 1500-pixel
   problem.** The Answers row holds two Branches of 480 pixels; each Option column holds
   at most four Branches of 240 x 90. No row ever holds ten Branches, so no label
   narrows, nothing wraps, and the length limits stand unchanged (`application.md` 10.7).
5. **Every Branch is labelled with its target's title**, from the title index
   (`getTitle`), never from a second Node read. An Answer Branch carries the chrome word
   `yes` or `no` above that title.
6. **An Option Branch may carry the first of that Option's Images** as a 64-pixel
   thumbnail. Option Images are not merged into the Node's Carousel
   (`ADR-38-carousel.md`).
7. **A long Trail collapses in its middle** (`application.md` 10.2): `start`, a
   `trailMore(n)` Branch that opens the Trail Sheet, then the last four entries. At most
   five Branches carry a title, at 200 pixels each, where an 80-character title fits
   three lines without truncation; `trailMore(n)` carries chrome and is 120 pixels. The
   collapsed row is the widest the Trail ever is: 5 x 200 + 120 + 5 x 8 = 1160 of the
   1280 pixels.
8. **Four situations, spelled out** (`application.md` 10.3): a question Node with
   Options, a question Node without, an explanation Node (a `back` Branch below, because
   the format gives it no Answers), and a Terminal (`back` and `startAgain` below).
9. **The two chrome elements a Node kind adds to the Bubble sit on its rim**, not in its
   text area: a Terminal's outcome badge in the 28-pixel band above, an explanation
   Node's `explanationOnly` hint in the band below. `tree-format.md` 5.7 divides the
   304-pixel text area exactly, so anything placed inside it would have to come out of
   the 600-character description; on the rim, the format's limits hold on all four
   situations unchanged.
10. **A `back` Branch is drawn below the Bubble but its target is the Bubble above**, so
    it slides up; `startAgain` has no direction and is an ordinary link
    (`ADR-38-transitions.md`, `application.md` 11.1).

## Alternatives rejected

- **All out-Branches in one fan below the Bubble.** The most literally tree-shaped
  option and the first one tried on paper. Ten Branches across 1280 pixels give 128
  pixels each; a 60-character Option title then needs four 20-pixel lines, which does
  not fit the 64-pixel row, and widening the row takes height from the Bubble and
  forces `tree-format.md`'s 600-character description down. It cannot be done without
  breaking a frozen format, and it would have to be broken again the first time a Node
  used all eight Options.
- **A single Option column on one side, with the Bubble off-centre.** Fits horizontally
  (760 + 20 + 240 = 1020 of 1280) but needs 8 x 90 = 720 pixels of height against the
  middle row's 360, so half the Options would fall outside the screen. Two columns of
  four is the same list in the space that exists.
- **Truncating Trail labels with an ellipsis instead of collapsing the middle.** The
  Trail exists so a reader can see which step they are going back to; a row of "Prohibited
  practices under Artic..." is a row of guesses. Collapsing hides *how many* steps rather
  than *which* step, and the hidden ones stay one click away in the Sheet.
- **Wrapping the Trail onto a second row when it is long.** Costs 64 pixels of height
  that the no-scroll budget does not have, and costs them on exactly the pages that are
  deepest in the Tree and most likely to be long.
- **Letting the Bubble grow or shrink with its content.** Tempting -- a short Node would
  look better in a smaller Bubble -- but it makes the Bubble move between Nodes, which
  makes the slide of `ADR-38-transitions.md` visibly wrong, and it makes the format's
  length limits depend on which Node you are looking at.
- **Merging an Option's Images into the Node's Carousel.** `tree-format.md` 5.4 left
  this to this issue. Rejected: the Carousel's contract is that its order is the Node's
  `images` list and its caption is that Image's description; a merged list has neither,
  and a reader cannot tell which of nine pictures belongs to which of eight Options. On
  the Branch, the picture is next to the words it illustrates.

## Consequences

- The layout is a fixed grid, not a flow, which is what makes `ADR-38-no-scroll.md`'s
  test possible at all: every row's height is known before any content is measured.
- `tree-format.md`'s length limits are confirmed unchanged and `elsa-tree/2` needs no new
  format number (`application.md` 10.7); the reasoning is a comment on issue #37.
- Issue #41 builds one grid and four situations, not a responsive column.
- If the owner corrects 10.23, the change is a direction table in
  `src/neighbourhood.ts`; the Bubble, the rows and the tests do not move.

## Amendment, 2026-09-12 (issue #41, the build)

The build measured the layout in a real browser on a machine whose fallback body face is
DejaVu Sans, the widest a reader is likely to meet, and three of the widths above were
short there. The decisions stand; the numbers are corrected to what is built, so that the
spec (`application.md` 10.2, 10.7) and this record say what the layout is.

- **Decision 4.** An Option Branch is **248 x 82** in its 90-pixel slot: the 240-pixel
  column plus the 12-pixel tick into the gap. With 12 pixels of padding each side its
  label is 224 pixels, or **152 with the 64-pixel thumbnail and its 8-pixel gap**. At the
  136 a 240-pixel Branch left, a 60-character Dutch title took four lines and the column
  364 pixels of its 360. An Answer Branch is 480 pixels with 20 of padding each side:
  440 of label.
- **Decision 7.** A title Branch of the Trail is **212 pixels, 196 of them label**, not
  200: at 176 an 80-character title wrapped into four lines in DejaVu Sans, 84 pixels in
  the 64-pixel row. The collapsed row is 5 x 212 + 120 + 5 x 8 = **1220 of 1280**, and
  the collapsed middle may grow to 180 before the row is full.
- **Decision 9.** The Bubble's 2-pixel outline is part of the rim, so the padding inside
  it is 58 and 26 and the text area measures exactly 640 x 304.
- **Decision 6, and `ADR-38-carousel.md`.** Until #43 draws the Carousel, the row holds
  the Node's own Images as plain thumbnails opening the enlarged view with the credit --
  version 0.1's display, kept alive by the owner's decision on PR #56 after PR #54 made
  visible credits a release blocker. Option Images are still not merged into it.

The face the limits hold in is `application.md` 10.7's last paragraph: the default type
stack names Arial-metric faces before `sans-serif`, because the Bubble's text area holds
the format's maximum in those and not in DejaVu Sans, as `tree-format.md` 5.7 warns.
