# ADR-78-fan-out-and-option-picture: the Option buttons hug the Bubble's curve like a mind map, 232 x 96 with a 16-pixel label and the target's main image at 48 pixels; an Option carries no Images of its own, and a page may fetch, per Option, exactly its target's main image

- Status: ACCEPTED (frozen) -- 2026-09-17
- Issue: #78 -- Architecture: freeze the contracts for the display changes of #75
- Spec: `docs/specs/application.md` 10.1, 10.3, 10.5, 10.7, 11.4, 11.5, 12.4; `docs/specs/tree-format.md` 5.4, 5.7, 7, 12.5
- Core document: 3.1 (Options "with its own title and optional Images"), 3.2 ("The side children fan out like a mind map, in larger text"), section 9 (images only for the Node on screen), open item **10.29** (decided here)
- Supersedes in part: `ADR-38-tree-view.md` (decisions 4 and 6 and the #41 amendment: the two straight columns, the 248 x 82 Branch, the Option's own picture), `ADR-38-neighbourhood.md` (decision 7 and 8 as far as they concern the Option button's picture), `ADR-37-images-carousel.md` (its "Dropping Images from Options" rejection), `ADR-37-length-limits.md` (decision 1's "3 Images per Option")
- Built by: #80 (the fan-out), #79 (the format), #84 (the pictures move to their targets)
- Amended in part by: `ADR-100-overlay-without-strip.md` (decision 2: an Overlay has no strip, so it has no strip pictures), 2026-09-19, issue #100

## Context

The owner (#75): "The text on the side-nodes as they are displayed must be bigger and
better readable, also I want how the side-nodes are displayed to fan out a little more
like a mindmap." And each button shows its side child's main image: "example we already
do this: 'Is your system a safety component, or a product, under Annex I? (2/3)' the
sidenodes have this, we want that on all side-nodes in the structure."

In 0.2 the Option Branches are two straight columns of 248 x 82 pills beside the Bubble,
four a side, with a 13-pixel label and, when the Option has Images of its own
(`tree-format.md` 5.4, at most three), the first as a 64-pixel thumbnail. The owner's
example works today only because the first Tree writes those 28 pictures on the Options,
not on their targets. A side child's main image belongs to the side child, and
`application.md` 11.5 -- the testable form of core document section 9, asserted by
`transition.spec.ts` -- says `GET /images/<file>` may not carry "an image of any other
Node, at any time, for any reason", with the 2026-09-14 amendment making an Option's own
Images legal precisely because they belong to the centre Node; 11.4 forbids any image URL
in the markup of a Node that is not on screen. Core document 10.29 records the collision
with the Planner's proposed resolution.

## Decision

1. **The picture on an Option button is its target's main image, and an Option has no
   `images` of its own.** `elsa-tree/3` drops the key from an Option (5.4; V-KEYS
   rejects it) and the "3 Images per Option" row of 5.7. One picture, stored once, on the
   Node it belongs to; the button and the Overlay show the same file.
2. **10.29 is decided as the Planner proposed: 11.5 gains one row.** A page may fetch,
   for each Option of the centre Node, **exactly one file: the target's first Image**
   -- never the target's other Images, bounded by the format's eight Options -- and,
   once an Overlay is open, the Images of the Node in it (`ADR-78-overlay.md`). 11.4 is
   restated for what is off screen: a neighbour frame placed `up` or `down` carries no
   image URL; a closed Overlay's strip pictures [none: an Overlay has no strip,
   `ADR-100-overlay-without-strip.md`] are `loading="lazy"` and its main image
   is the URL the button already loads, so no request is made for an aside until it is
   opened. `transition.spec.ts` asserts that set: on load, the centre Node's files and
   one per Option; on opening an Overlay, that Node's files; nothing else, ever. Core
   document 3.1 and 9's "images are loaded only for the Node on screen" is kept as a
   rule about pages: a page shows the Options' pictures, so they are on screen.
3. **The fan-out.** The Option buttons are placed on the Bubble's curve, in the 446
   pixels of the middle row, at most four a side, the first Option on the right, the
   second on the left, and so on alternating, each side top to bottom in order. A side
   with *m* buttons puts their centres at heights *y* = (*i* + 0.5) x 446 / *m* - 223
   from the Bubble's centre (*i* = 0 .. *m* - 1), and each button's inner edge 20
   pixels outside the outline at that height: at 157 + sqrt(223² - *y*²) + 20 from the
   centre line, where 157 is half the Bubble's straight middle and 223 its radius. The
   buttons nearest the Bubble's middle sit furthest out (inner edge 400, outer edge 632
   of the 640 to the page's edge); the top and bottom ones on a side of four sit 75
   pixels nearer the centre line (inner edge 324), which is the fan. A **connector** of
   20 pixels, 2 pixels wide in the `rule` shade, runs horizontally from the button's
   inner edge to the outline at the button's centre height. With one Option the button
   sits at the Bubble's middle; with two, one each side; the pitch on a side of four is
   111.5 pixels, 15 clear of the button.
4. **A button is 232 x 96**: the target's main image as a 48-pixel round picture at the
   inner end, an 8-pixel gap, and the label -- the target's title -- at **16 pixels on
   20-pixel lines, at most four lines** in the 152 pixels left (232 less 12 of padding
   each side, 48 and 8): a 60-character title is three lines in a humanist face and four
   in DejaVu Sans, the widest fallback, both inside the 80 the four lines take with 8 pixels of padding
   above and below. Outlined in the `rule` shade, filled `surface`, hover wash of
   `accent` (`ADR-78-answer-buttons-and-up-arrow.md` moved `accent-secondary` to the
   walk's controls). A target without Images shows the same empty slot the Bubble shows
   (`ADR-78-main-image-and-row-budget.md`).
5. **Below the guarantee** (10.5): below 1280 pixels of width the fan straightens into
   two columns of 200 x 96 buttons without pictures (176 pixels of label, four lines at
   most) with 20-pixel gaps beside the Bubble (step 2, holds to 1200); below 1200 the
   buttons move below the Answer row as one row where the height allows it (at least
   744) and otherwise collapse at once (step 3); and the collapse to one `options`
   control and its Sheet is step 4, by count at 1000, 770 and 520 pixels for four,
   three and two Options as #41 measured. A Sheet item is a plain link to the
   explanation Node's address, which opens its Overlay (`ADR-78-overlay.md`).

## Alternatives rejected

- **Keeping `images` on an Option and requiring the author to write the target's main
  image on the Option as well** (the alternative core document 10.29 names). Leaves
  11.5 untouched. Rejected: every side child's picture stored twice, two credits to keep
  equal, a validator that cannot tell a deliberate difference from a slip, and an
  Overlay that shows a picture the button did not. The rule the owner cares about --
  never all images, never another Node's images for nothing -- is kept by one bounded
  row in 11.5 that names the file a page shows.
- **Fetching the Option pictures only when the reader hovers or opens.** Rejected: the
  owner wants the picture *on* the button.
- **Buttons on a true arc, rotated or spaced by angle.** Rejected: rotated text does
  not read, and equal angles put four buttons on a side into 446 pixels only by
  overlapping; equal vertical spacing with the inner edge following the curve is what a
  mind map drawn by hand does.
- **Bigger buttons with the picture above the label.** Rejected: 232 pixels of label
  would take a 60-character title in two lines but the button would be 48 + 8 + 40 + 16
  = 112 tall, and four of them are 448 in 446.
- **Extending the fan into the up-arrow band and the strip band.** Rejected: the arrow
  and the strip sit on the outline there, and a button at the Bubble's pole would
  collide with them.
- **A `side` placement kept for the neighbourhood, so the old slide could return.**
  Rejected in `ADR-78-overlay.md`: nothing slides to an aside.

## Consequences

- The migration to `elsa-tree/3` (12.5) moves each Option's first Image to the front of
  its target's `images` unless the target already leads with that file, drops the Option's
  `images` key, and reports every second and third Image it left unreferenced. #84
  moves the first Tree's 28 pictures to their targets before #79 converts, so the
  migration finds them there.
- `Branch.tsx` takes the target's first Image, which the page has in hand: the
  neighbourhood reads the target for the Overlay anyway.
- The image ceiling on a page stays 18 (10 of the centre's, 8 of the Options'), for a
  different reason than before; `walk.spec.ts`'s count on `annex-i-legislation` stays
  nine.
- `tests/fixtures/full-node/` keeps eight Options; each target gains a first Image so the
  buttons and the Overlays have a picture; `views.test.tsx` asserts the fan for one, two,
  five and eight Options by the numbers of decision 3.
- Core document 10.29 is answered; 3.1's Option row of section 5 loses "with its own ...
  optional Images".
