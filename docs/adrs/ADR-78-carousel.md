# ADR-78-carousel: the Carousel is a strip of 48-pixel round thumbnails straddling the Bubble's lower outline, pictures only, no buttons and no caption; the description is accessible text and the credit is shown in the enlarged view and read as the picture's description

- Status: ACCEPTED (frozen) -- 2026-09-17
- Issue: #78 -- Architecture: freeze the contracts for the display changes of #75
- Spec: `docs/specs/application.md` 10.1, 10.5, 10.6, 12; `docs/specs/tree-format.md` 5.2
- Core document: 3.2 ("The Carousel: pictures only ..."), section 8 (every Image carries a credit), open item **10.26** (decided here, PROPOSED for the owner)
- Supersedes in part: `ADR-38-carousel.md` (decisions 1, 2, 4, 5 and 8, and its #55 amendment), `ADR-37-images-carousel.md` (its "the caption under a picture is its description" and the Option pictures), `ADR-38-tree-view.md` (decision 6)
- Built by: #81

## Context

The owner (#75): "There can be more images than the main image, these should be shown in
the carroussell, however, the rule was that the carrousel will not have any buttons, so
there will just be the images, and, I want the carroussel of images to be displayed at
the lower edge of the opened node bubble. The maps text should also not be visible, it
can be as part of the accessiblity data on the image for blind people, but we do not want
to display it."

In 0.2 the Carousel is an 80-pixel row under the Answer row: a strip of 60-pixel
thumbnails, previous/next buttons (`CarouselButtons`), a position text, and a 20-pixel
caption line that shows the selected picture's description and its credit, the credit
never cut. Since #55 the strip also holds each Option's first picture, because the Option
Branch had no room for a credit. Core document section 8 requires a credit on every
Image, `tree-format.md` 5.2 requires it shown with the picture, and visible credits were
made a release blocker on PR #54 by the oversight session under the owner's standing
instruction. The owner now asks for nothing under the pictures.

## Decision

1. **The strip holds the Node's Images after the main one**, in the author's order, at
   most nine (10 less the first). Nothing else: an Option's picture is its target's main
   image and is credited in the target's Overlay (`ADR-78-fan-out-and-option-picture.md`),
   so the #55 merge is undone and the strip is one list again.
2. **It sits at the Bubble's lower edge, straddling the outline**: 48-pixel round
   thumbnails at a 56-pixel pitch, their vertical centre on the Bubble's bottom outline,
   in a 400-pixel strip centred on the Bubble. The outline is straight to within 5
   pixels across that width (the Bubble's straight middle is 314 pixels and the curve
   rises 5 pixels at 200 from the centre), so the pictures read as beads on the rim.
   Seven are visible; more scroll. The upper half of a thumbnail sits in the Bubble's
   lower rim, 2 pixels clear of the text area, so the text area loses nothing.
3. **Pictures only.** No previous/next buttons, no position text, no caption line. The
   strip is the native scroll-snap container it already was, the one element in the
   document allowed to scroll (10.6), which is why the buttons were only ever an
   enhancement: a keyboard user moves through it with the arrow keys and Home/End, Enter
   or Space enlarges, exactly as 12.3 said. `CarouselButtons.tsx` goes.
4. **The description is accessible text and is not displayed:** it is the thumbnail's
   alternative text and, with the `enlarge` word, the link's accessible name, as before.
5. **The credit (10.26)** is not displayed under the pictures and is not dropped. It is
   shown **whole in the enlarged view** that a click, Enter or Space on any picture opens
   -- the main image included, which is a link to its file like every thumbnail -- and
   it is the picture's accessible description (`aria-describedby`), so a reader who hears
   the strip hears the credit without opening anything. A picture is not a button and
   the enlarged view is one keystroke away, which is where core document section 8's
   requirement is now met; this is PROPOSED to the owner on #78, and silence means
   accepted.
6. **The enlarged view is unchanged**: the same `Sheet`, one picture per page with the
   description and the credit beneath it, `previous` and `next` to page through the
   Node's pictures, Escape and the cross to close, focus back to the thumbnail. It is the
   only place the position text `imageCount` is still spoken.
7. **The strip band is reserved on every Node** (28 pixels below the Bubble, 10.1)
   whether or not the Node has a second Image, so nothing moves between Nodes; a Node
   with fewer than two Images has no strip and no tab stop there.
8. **Below the guarantee** the strip is the first thing given up (10.5 step 1): it
   collapses to one control showing `imageCount`, a 20-pixel pill centred on the same
   outline, which opens the enlarged view.

## Alternatives rejected

- **Dropping the credit from the page.** The literal reading of "we do not want to
  display it", applied to the caption line as a whole. Rejected: core document section
  8 is a hard requirement, the owner's sentence is about "the maps text" -- the
  description -- and a credit reached by one click on the picture keeps the promise
  `tree-format.md` 5.2 makes to the people whose pictures these are. ADR-75 decision 8
  said so already.
- **A credit line kept under the strip, description dropped.** Rejected: it is text
  under the pictures, which the owner asked not to have, and it costs the 20 pixels the
  row budget has just spent on the Sources heading.
- **The strip inside the Bubble's rim, wholly above the outline.** Rejected: the lower
  rim is 26 pixels and a 48-pixel picture does not fit it; a 24-pixel picture is a dot.
  Straddling the outline gives a picture a reader can see while keeping the text area
  whole.
- **The strip as a row directly under the Bubble, not touching it.** The 0.2 shape moved
  up. Rejected: "at the lower edge of the opened node bubble" is a position on the
  Bubble, and a row that only nearly touches it looks like a mistake.
- **Keeping the Options' pictures in the strip.** Rejected: their reason (#55) was the
  missing credit on the Branch, and the picture on the button is now the target's own
  main image, credited where that Node is shown (`ADR-78-fan-out-and-option-picture.md`).
- **A credit shown on hover over the thumbnail (a `title` tooltip).** Rejected: a hover
  is not available to a keyboard or a touch reader, and the enlarged view already
  exists for exactly this.

## Consequences

- The client components lose `CarouselButtons` and the chrome keys `previous` and `next`
  keep their callers in the Sheet's paging; `imageCount` keeps two: the collapsed
  control and the enlarged view.
- `credits.ts` and `walk.spec.ts` read each credit off the enlarged view and off the
  thumbnail's accessible description instead of the caption line, deliberately, in their
  own commit (#81).
- The strip's cap is nine; `full-node` keeps its ten Images (one main, nine in the
  strip). The image requests on a Node are its own files plus one per Option (the
  targets' main images), at most 18 as before, for a different reason.
- Core document 10.26 records the decision, still PROPOSED for the owner.
