# ADR-78-main-image-and-row-budget: a Node's first Image is its main image, shown 60 pixels tall above the title inside the Bubble; the freed Trail row and caption line pay for it, the Bubble grows to 760 x 446, and every length limit of the format survives with two pixels to spare

- Status: ACCEPTED (frozen) -- 2026-09-17
- Issue: #78 -- Architecture: freeze the contracts for the display changes of #75
- Spec: `docs/specs/application.md` 10.1, 10.3, 10.4, 10.5, 10.7; `docs/specs/tree-format.md` 5.2, 5.7
- Core document: 3.1 (main image, PROPOSED first-Image reading), 3.2 ("A main image above the title"), open item **10.28** (decided here), 10.26 (the credit's place; `ADR-78-carousel.md`)
- Supersedes in part: `ADR-38-tree-view.md` (decisions 1, 2, 7 and 9: the six rows, the rim's chrome, the Trail row), `ADR-37-length-limits.md` (decision 4: the vertical budget and the text area the limits derive from -- the limits themselves stand)
- Built by: #81 (the Interior), #82 (the Answer row), #80 (the fan-out uses the middle row's height)
- Amended in part by the owner on issue #102 (PR #110, answer (b) on the PR), 2026-09-19:
  decisions 2 to 5 and 7, the first rejected alternative (now built) and the last two
  consequences. The main image is two fifths of the Bubble, the Bubble is 416 tall, the
  description's limit is **150 characters and 2 lines**, and both Trees were re-cut; the
  header line's 60 pixels, 446 and "two pixels to spare" are #78's and historical. The
  dated notes below give the numbers; core document 10.28 points here for them.

## Context

The owner (#75): "I also want every node to come with a main-image that is displayed
above the node bubbles title." ADR-75 inferred, and the core document records as
PROPOSED, that the data says which Image is the main one by its place: the first entry of
`images`, because `tree-format.md` 5.2 already makes the list the order.

Seven of the owner's nine changes touch one number: the height of the Bubble's text area
at the guaranteed viewport of 1280 x 640, from which `tree-format.md` 5.7 derives every
length limit. 0.2 spent the 640 pixels as chrome bar 44, Trail 64, middle 360 (the Bubble,
text area 640 x 304), Answers 64, Carousel 80 (60 of strip and 20 of caption), disclaimer
28, and 5.7 divided the 304 exactly: title 56, description 192 (8 lines, 600 characters),
Sources 40, two gaps of 8. Now the Trail row goes (`ADR-78-answer-buttons-and-up-arrow.md`),
the Carousel loses its caption line and moves to the Bubble's lower edge
(`ADR-78-carousel.md`), the Answer row grows, the Sources gain a heading line
(`ADR-78-sources-heading.md`), and a main image enters the text area above the title. The
core document asks (10.28) whether the description's 600 characters and 8 lines survive,
and requires the owner to be asked before any limit shrinks, because a shorter limit
re-cuts the first Tree a second time.

## Decision

1. **The first Image of a Node is its main image.** Confirmed as ADR-75 inferred: the
   list is the order, 5.2 says so already, and a `main` key would be a second way to say
   the same thing that could contradict the first. The Carousel holds the Images after
   it. The owner may still correct this on #78; if the correction is a key, it is one
   optional key on an Image and nothing in the layout moves.
2. **The rows at 1280 x 640** (`application.md` 10.1):

   | Row | Height | Holds |
   |---|---|---|
   | chrome bar | 44 | unchanged |
   | up arrow band | 26 | the 48-pixel round up arrow, centred on the Bubble's top outline: 24 above it, 2 clear of the chrome bar |
   | Bubble | 446 | 760 x 446, radius 223; rim 26 above and below, 60 each side; text area **640 x 394** |
   | strip band | 28 | the Carousel's 48-pixel thumbnails, centred on the Bubble's bottom outline: 24 below it, 4 clear of the Answer row |
   | Answers | 68 | two buttons 620 x 60, 4 clear above and below |
   | disclaimer | 28 | unchanged |

   44 + 26 + 446 + 28 + 68 + 28 = 640. The Option buttons fan out beside the Bubble
   within the same 446 pixels (`ADR-78-fan-out-and-option-picture.md`).
   **Amended 2026-09-19 (#102, PR #110, by the owner):** the up arrow stands above the
   Bubble, its foot 6 pixels clear (`ADR-78-answer-buttons-and-up-arrow.md`, amended the
   same day), so its band is **56** and the Bubble gives the 30: **44 + 56 + 416 + 28 +
   68 + 28 = 640**, the Bubble 760 x 416 (radius 208), its text area **640 x 364**, and
   the fan within its 416 (`application.md` 10.1). Below 640 pixels tall the band is 26
   again and the arrow back on the outline (10.5).
3. **The text area is 640 x 394 and the Interior divides it as** main image 60, gap 8,
   title 56 (two lines of 28), gap 8, description 192 (eight lines of 24), gap 8,
   Sources 60 (a 20-pixel heading line and two lines of 20): **392 of 394**. Every limit
   of `tree-format.md` 5.7 therefore stands -- 80-character titles, 600 characters and 8
   lines of description, 60-character Option titles and Source labels, 3 Sources, 8
   Options, 10 Images -- and the description survives **by two pixels**. No Tree is
   re-cut and 10.28 needs no answer from the owner; the trade the owner may still make is
   stated in the consequences.
   **Amended 2026-09-19 (#102, PR #110, by the owner; answer (b) on the PR): the trade
   was made, and the picture won.** The text area is 640 x 364 and divides as main image
   **166.4** (two fifths of the Bubble's 416), gap 8, title 56, gap 8, description **48**
   (two lines of 24), gap 8, Sources 60: **354.4 of 364**, the 9.6 left a clear foot under
   the Sources, where the curve narrows the Bubble (`application.md` 10.3, 10.7). The
   description's limit is cut from 600 characters and 8 lines to **150 characters and 2
   lines**, what the 57.6 pixels left beside the picture hold (`tree-format.md` 5.7);
   every other limit stands, and so does the Tree's own `description`, which the Bubble
   does not draw (600 and 8). Both Trees were re-cut mechanically, in both languages
   (`trees/ai-act-applicability-agrifood/NOTES.md` section 12). `elsa-tree/3` keeps its
   number: the owner scoped the change to the limit and the validator, and V-LENGTH and
   V-LINES tell a Tree written to the old limit which field to cut. Where the Bubble is
   taller, up to 520, the picture takes two fifths of the extra pixels and the text keeps
   the rest, so the limit holds at every guaranteed viewport.
4. **The main image is 60 pixels tall, at most 90 wide** (a landscape of up to 3 : 2 is
   shown whole; a wider or taller picture is cropped to that box, centred, `object-fit:
   cover`), with 8-pixel corners, centred above the title. Its `description` is its
   alternative text; it is a link to its file that opens the enlarged view, where its
   credit is shown (`ADR-78-carousel.md`, 10.26). A Node without Images shows an
   **empty slot of the same 60 pixels** -- a faint circle outlined in the `rule` shade,
   no text -- so the title sits at the same height on every Node and the slide has
   nothing to reflow.
   **Amended 2026-09-19 (#102, PR #110, by the owner):** "The Node's main image in the
   Bubble occupies about two fifths of the Bubble's height." It is a **3 : 2 box two
   fifths of the Bubble's height on every Node** -- 166.4 tall at 1280 x 640, up to 208
   where the Bubble is 520 -- cropped and cornered as before, and the empty slot is a
   circle of that same height, so the title still sits at one height on every Node. Down
   to 632 pixels tall the picture stays two fifths; below that step 5 of 10.5 hides it.
5. **The rim keeps its two chrome elements and loses one.** A Terminal's outcome badge
   stays in the band above, centred in the half of the band left of the up arrow, and is
   at most 40 characters (`chrome.test.ts`); the explanation Node's hint is gone with the
   `back` Branch (`ADR-78-overlay.md`). The band above holds the arrow's lower half and
   the band below the strip's upper half, each 2 pixels clear of the text area, so
   nothing chrome takes a pixel from the text.
   **Amended 2026-09-19 (#102, PR #110):** the arrow no longer reaches into the band
   above at and above 640 pixels tall; that band holds only a Terminal's badge.
6. **The Bubble never shrinks at or above the guarantee**, as before: extra width goes
   to the fan-out and the margins, extra height to the Bubble and the gaps.
7. **The Overlay renders the same Interior at the same sizes**, in a panel of 760 x 608
   (16-pixel margins at 640 of height) with 24-pixel bands above and below and 60 each
   side: 640 x 560 of content, which holds the Interior's 392 and, under it, an
   explanation Node's own Options as a list of at most eight 20-pixel lines with an
   8-pixel gap: 560 exactly (`application.md` 10.9).
   **Amended 2026-09-19 (#102, PR #110, by the owner):** the Overlay's picture is two
   fifths of its panel, **243.2 of 608**, where it was 60, and the panel's 640 x 558 of
   content holds it at every maximum because the explanation Node's own Options now flow
   as one inline list of about 5 lines, 100 pixels, where one to a line took 160:
   243.2 + 56 + 48 + 60 + 100 and four gaps of 8 = 539.2, measured on the `overlay`
   fixture at 1280 x 640 (`application.md` 10.9; `overlay.spec.ts`).

## Alternatives rejected

- **A larger main image, paid for by the description.** A 96-pixel image needs 36
  more pixels, which is a line and a half of description: 7 lines and 525 characters,
  which would re-cut every Node of the first Tree that uses its 600. The owner asked to
  be consulted before that (10.28), and a hero picture was not asked for: "a main-image
  that is displayed above the node bubbles title". 60 pixels is the largest size that
  keeps every limit, and the trade stays open to the owner: each further 24 pixels of
  image costs one line, 75 characters, of description.
  **Amended 2026-09-19 (#102, PR #110): no longer rejected -- the owner asked for it and
  it is built** (decisions 3 and 4 above): "The pictures are too small." The picture is
  166.4 tall, the description 2 lines and 150 characters, and the first Tree was re-cut,
  as this alternative foresaw; the owner answered 10.28 on PR #110 with (b), the picture.
- **Shrinking the chrome bar or the disclaimer.** They are 0.1 contracts the owner kept
  (`application.md` sections 1 to 9 stand), and 8 pixels from each buys a third of a
  line.
- **Putting the main image on the rim, outside the text area,** as the badge is.
  Rejected: the band above is 26 pixels and holds the up arrow; and the owner placed
  the image "above the node bubbles title", inside the Bubble.
- **A `main` or `cover` key on an Image.** Rejected as in `ADR-37-images-carousel.md`:
  move it to the top of the list.
- **Letting the Bubble's height depend on whether the Node has an Image.** Rejected: the
  title would move between Nodes and the slide of `ADR-38-transitions.md` would show it.
- **A round main image (60 x 60).** Rejected: the first Tree's pictures are landscape
  photographs; a circle cuts most of each. A 3 : 2 box shows them whole; a picture of
  another shape is cropped to it rather than letterboxed, so the slot is always filled.

## Consequences

- `tree-format.md` 5.7's assumption table is re-derived here and the limits are
  confirmed unchanged; `elsa-tree/3` changes the format for the explainers and the
  Option pictures, not for a length.
- `application.md` 10.7 is rewritten with the new derivation; the two-pixel margin is
  the number the no-scroll test protects, and the build (#81) pastes the measured height
  of each row.
- The trade the owner may make later -- a taller main image against a shorter
  description -- is one row in 10.1 and one line in 5.7, and it would be a new format
  number, because a Tree that validates today must keep validating.
  **Amended 2026-09-19 (#102, PR #110, by the owner):** the trade was made, and the
  owner kept `elsa-tree/3` rather than take a new number (`tree-format.md` line 6, 5.7).
- Core document 10.28 is answered: the limits survive; 3.1's PROPOSED first-Image
  reading is confirmed as the working rule with the owner free to correct it.
  **Amended 2026-09-19 (#102, PR #110):** 10.28 was answered again by the owner, with
  the picture over the text; its amendment points here for the budget above.
