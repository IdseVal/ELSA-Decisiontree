# ADR-205-ending-button-on-a-hidden-tree: in the editor of a hidden Tree, "Tree does not end here after all" keeps out of the preview button's column below 1000 pixels wide, and is a round icon of the cross's size, keeping its name, below 640

- Status: ACCEPTED (frozen) -- 2026-10-04; part of core document 10.41 (where the preview's
  button stands under the no-scroll rule, beside the step's buttons)
- Issue: #205 -- Architecture: the preview of a hidden Tree as its readers will see it -- its
  address, what it shows of an unfinished draft, and its two buttons at the top left
- Spec: `docs/specs/application.md` 40.5 (new, its last part); 30.8 amended, marked **[#205]**
- Amends: `ADR-178-step-buttons.md` decision 2 (where the ending's button stands, and its words
  below 640 pixels wide on a hidden Tree)
- Depends on: `ADR-205-preview-buttons.md` (the preview button's box), `ADR-178-step-buttons.md`
- Measurements: `docs/research/issue-205-top-left-room.md` (section 2, "A step that ends")
- Built by: #206

## Context

On a step that ends, #178's "Tree does not end here after all" (`removeEnd`) stands in the band
above the Bubble, left of the up arrow and against it, from 1000 pixels wide with the red cross
between them (30.8). Its `max-width` is the band left of the arrow less 8 pixels at each end
(`--step-room`); where its words take two lines it is that wide, reaching to 8 pixels from the
window's left edge: 140 pixels at 360 x 640, 200 at 480 x 640 in English, 120.5 at 321 wide. On
one line it is 192.2 to 227.4 pixels wide at 13 pixels on Windows and 198 to 223 in the CI
runner's faces; 159.2 to 189 and 164.4 to 187 at 11 pixels, below 640 pixels tall (the research
record, section 2). It is drawn in the Tree's body face (#180: what the editor puts in the Tree is
drawn as the Tree is), so a Theme decides how wide its words are.

The owner placed the preview button at the top left of the editor of a hidden Tree
(`ADR-205-preview-buttons.md`); #178's place left of the arrow was not the owner's (#169: "just
make two buttons a red cross to delete the step, or if it applys, 'tree does not end here after
all'"). Measured with the preview button drawn in: from 1000 pixels wide its words stand 90.4
pixels or more from the ending's button; below 1000, as an icon, it meets the ending's button at
360 x 640, 480 x 640, 480 x 639, 479 x 639 and 321 pixels wide -- every width measured below 640
where both stand on the band's line -- and nowhere from 640 up. At 390 x 844 and 768 x 1024 the
arrow stands lower and the step's buttons with it, and the two do not meet.

## Decision

On the editor's page of a hidden Tree -- while the preview button is on the page, and only then
(the stylesheet keys it on that button, `:root:has(.preview-button)`) -- the ending's button gives
way to the preview button in the band:

1. **Below 1000 pixels wide its room is the band left of the arrow less the preview button's
   column**: `max-width: calc(50vw - var(--up-size) / 2 - 2 * var(--step-gap) - var(--float-right)
   - var(--float-size))` -- the arrow's half, a gap of 8 to it, the preview button's place from the
   edge and its width, and a gap of 8 to it. So the two boxes cannot overlap, whatever face a
   Theme draws the words in: a wider face takes a second line of 13 pixels, which the band holds
   from 640 pixels of height up (48 pixels in its 56, as at 480 x 640 on `dev`). On every Tree
   measured the words keep their one line from 640 to 999 pixels wide: the room is 232 pixels at
   640 x 700 and 240 at 640 x 639, and the widest one line measured is 227.4.
2. **Below 640 pixels wide it is a round button of the cross's size**, `--step-size` -- 32 pixels;
   24 below 640 pixels of height from 480 wide -- outlined in `accent-secondary` as its words are,
   holding a 16-pixel glyph of the Tree going on (one stroke down from the top that splits at the
   middle into two strokes to the lower corners) in `accent-secondary`'s reading shade, in the
   cross's stroke (2 pixels, round caps). Its name and its `title` are its words, `removeEnd`, at
   every width, as the cross's are `deleteStep` (30.8); it stands where the words stood, left of
   the arrow and against it. Below 640 the band left of the arrow cannot hold the preview button,
   the words on their lines and the gaps between them -- the words alone take it all on two lines
   -- and a third line does not fit a phone's band of 40 below 640 pixels of height.
3. **From 1000 pixels wide it is as #178 left it**, its words left of the cross, which stands left
   of the arrow: the preview button's words stand 90.4 / 92.7 pixels or more from it.

Everything else of 30.8 stands: what each button does, the cross's question, their places on a
published Tree, where the preview button is not, and their heights. Measured as drawn (the
research record's column "the rule"): clear of the preview button, the arrow, the Bubble, the
Option buttons and the floating controls in all 440 rows above the floor on each system; the
tightest at 640 x 700, 12.6 pixels from the preview button on Windows, 17 in the CI image.

## Alternatives rejected

- **The words at every width, in a narrower room.** Below 640 pixels wide they would take three
  lines and more: at 321 pixels the room left for them would be 80.5 pixels, and a third line of 11
  pixels (48 tall with its padding) does not fit a phone's band of 40 below 640 pixels of height,
  where it would stand over the bar and the Bubble -- as `step-buttons.spec.ts` would then find on
  `hidden-draft`, a hidden Tree, at 479 x 639 and 321 x 481.
- **The ending's button an icon below 1000, as the floating controls are.** From 640 to 999 pixels
  its words fit beside the preview button on every Tree measured, with 12.6 pixels or more to
  spare; the owner's words for it are kept wherever they fit.
- **The preview button giving way instead** -- hidden, or moved, on a step that ends. The owner
  placed it at the top left, on every step of a hidden Tree; #178's place was a reading.
- **The ending's button moved right of the arrow, or into the Answer row.** Right of the arrow the
  cross and the two floating controls leave 34 pixels between them at 360 x 640 and 14.5 at 321
  pixels wide, where a 32-pixel button and its two gaps of 8 need 48 (the research record, section
  6); the Answer row holds `startAgain`, and after "Tree does not end here after all" the three
  structure buttons -- the button would move away from the step it takes the ending from.
- **Every Tree's ending's button an icon below 640, published ones too.** On a published Tree the
  preview button is not on the page and the words fit as #178 measured them.
- **A width rule of 640 without the room of decision 1.** From 640 the one line fits on every Tree
  measured, by 12.6 pixels at the least; a Theme whose face is wider would push the words under the
  preview button. Decision 1 makes the boxes apart by construction.

## Consequences

- `src/editor/StepButtons.tsx`'s `RemoveEnd` draws the glyph beside its words and names the button
  by its words (`aria-label`, `title`), and the stylesheet shows the glyph or the words by decision 2
  (#206).
- `application.md` 30.8 carries a dated amendment; `ADR-178-step-buttons.md` gains a header line.
- `tests/browser/step-buttons.spec.ts` runs unchanged and green: it walks `hidden-draft`, a hidden
  Tree, where the preview button is now on the page, finds the ending's button by its name and
  measures its box at 18 viewports; `tests/browser/preview.spec.ts` asserts decision 2's icon and
  its name at 360 x 640 and 639 x 700, the words at 640 x 700, and decision 1's room on a hidden Tree
  only (40.9).
