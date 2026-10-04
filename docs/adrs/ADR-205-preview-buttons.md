# ADR-205-preview-buttons: "Preview" in the editor of a hidden Tree and "Back to the editor" in the preview float under the chrome bar at the top left, in the same box -- the mirror of the editor's floating controls at the top right -- in words from 1000 pixels wide and as an icon below, first after the bar in the tab order

- Status: ACCEPTED (frozen) -- 2026-10-04; decides core document 10.41 (where the preview's button
  and the way back stand under the no-scroll rule, beside the up arrow, the step's buttons and the
  editor's floating controls) and confirms 3.4 `[#202]`'s reading of their words: "Preview"
  ("Voorbeeld") and "Back to the editor" ("Terug naar de editor")
- Issue: #205 -- Architecture: the preview of a hidden Tree as its readers will see it -- its
  address, what it shows of an unfinished draft, and its two buttons at the top left
- Spec: `docs/specs/application.md` 40.5 (new); 3.2, 24.3 and 33.1 amended, marked **[#205]**
- Amends: `ADR-176-floating-settings-and-to-do.md` decision 6 (the floating controls still come
  after the bar's last control in the tab order, the to-do control first; the preview button now
  comes between)
- Depends on: `ADR-176-floating-settings-and-to-do.md` (the floating controls: their box, look and
  layer), `ADR-178-step-buttons.md` (the step's buttons in the band),
  `ADR-205-ending-button-on-a-hidden-tree.md` (what gives way on a step that ends below 640),
  `ADR-205-way-there-and-back.md` (what a click on either does)
- Measurements: `docs/research/issue-205-top-left-room.md`
- Built by: #206

## Context

The owner: "Place the button top left (not in the header bar). And from that view, in the same
place a button that brings the user back to the editor interface where he came from". The
counterpart at the top right is #176's two floating controls, which the owner placed with the
same words ("make it a bubble on the top right (not in the header bar)", "a hover top right, but
not in the header bar", #169): a fixed box under the bar, 10 pixels under it and 16 from the
edge, 32 tall -- in the band beside the up arrow, on the arrow's middle at the guarantee -- one
under it and 24 tall below 640 pixels of height, four under it and 32 tall there below 480 wide,
8 from the edge below 480 wide (33.1); in words from 1000 pixels wide and as round icons with
their names below (`ADR-176-floating-settings-and-to-do.md` decision 5). Left of the arrow, the
band holds #178's "Tree does not end here after all" on a step that ends, and from 1000 pixels
wide the red cross between them (30.8).

Measured on `dev`'s production build with such a button drawn in at the top left, in the
editor of a hidden Tree and on the public page, at the viewports of 10.6 and both sides of the
band's breakpoints, in English and Dutch, on Windows and in the CI runner's faces (the research
record, section 2): it meets nothing on a step that does not end, in words or as an icon, in the
editor (128.5 pixels of room or more); on the public page, nothing as an icon, and in words
"Back to the editor" (151.2 to 152 pixels) and "Terug naar de editor" (166.3, 166.4) meet the up
arrow at 360 x 640 and 321 pixels wide. On a step that ends, in the editor, from 999 pixels wide up
the words stand 90.4 pixels or more from the ending's button; narrower, the button meets it where
the ending's button reaches its column -- in words from 640 x 700 down, as an icon only below 640
pixels wide.

## Decision

1. **The words.** `preview`: "Preview" / "Voorbeeld"; `backToEditor`: "Back to the editor" /
   "Terug naar de editor" -- two chrome keys (3.2), the readings of 3.4 `[#202]` confirmed.

2. **The place: under the bar at the top left, not in it.** Each is a link in a fixed box at
   `top: var(--float-top)` and `left: var(--float-right)`: 10 pixels under the bar and 16 from the
   left edge; one under the bar below 640 pixels of height, four under it below 640 tall and 480
   wide; 8 from the edge below 480 wide -- the mirror at the left of the floating controls at the
   right, on the up arrow's middle at the guarantee. Neither is in the `header` and neither is in
   a row of 10.1: fixed, it moves no row and is no element's overflow (10.6). The way back stands
   in the preview exactly where the preview button stands in the editor: "in the same place".

3. **The size and the look: the floating controls'.** `var(--float-size)` tall -- 32; 24 below
   640 pixels of height; 32 below 640 tall and 480 wide -- a pill on `surface` with a 1-pixel
   `rule` border and the floating controls' soft shadow, its text in `text`, 13 pixels on 20, in
   the default face: each carries `data-editor-ui`, the editor's own interface in the default look
   (13.1, #180), on the editor's page and in the preview alike. Under the pointer, the floating
   controls' hover: the border in `accent-secondary`'s reading shade and the deeper shadow.
   - **From 1000 pixels wide**: a 16-pixel line icon, a gap of 8, the words; padding
     `0 14px 0 10px`. Measured: "Preview" 94.2 / 96.3 pixels wide, "Voorbeeld" 109 / 108.6,
     "Back to the editor" 152 / 151.2, "Terug naar de editor" 166.3 / 166.4.
   - **Below 1000**: the icon alone, centred, with `min-width: var(--float-size)` and padding
     `0 4px`, as the floating controls have below 1000 (`.editor-float`) -- 32 by 32, and 26 by
     24 below 640 tall from 480 wide, where the icon, its padding and its border take 26, two
     more than a `--float-size` of 24.
   - **The icons**, 16-pixel line icons in the stroke of the floating controls' `.float-icon`
     (1.25 pixels, round joins, no fill): for the preview an eye -- an almond outline and a round
     pupil; for the way back a pencil, drawn from the lower left to the upper right.
   - **The name** is the words at every width (`aria-label`), and so is the `title`: the tooltip
     where the icon stands alone, as the red cross's "Delete this step" is (30.8).

4. **The layer.** `z-index: 1`, as the floating controls' box while their Sheets are closed:
   under every Sheet's scrim -- an Overlay's, the enlarged view's, the panel's, the to-do
   bubble's -- and over the page.

5. **The tab order.** In the editor the preview button comes right after the bar's last control
   (`logout`) and before the to-do control: the band's left end, then its right end, the order a
   reader reads them in. The floating controls still come after the bar's last control, the to-do
   control first (`ADR-176-floating-settings-and-to-do.md` decision 6), with the preview button
   between. In the preview the way back comes right after the bar's last control, the language
   switch's last link, and before the tree view.

6. **Where they cover nothing.** At every viewport of 10.6 where the tree view shows, in English
   and Dutch -- and on both sides of 1000 pixels wide, 640 tall, 640 wide and 480 wide, and at the
   narrowest windows above the floor -- the preview button and the way back cover no part of the
   up arrow, the step's buttons (the red cross, the ending's button), the Bubble (whose box holds
   the badge), an Option button or the control the Options collapse to, or the floating controls,
   and stand under the bar, inside the window: the research record's column "the rule", clear in
   all 440 rows above the floor on each system. On a step that ends that holds below 1000 pixels
   wide because the ending's button gives way to the preview button
   (`ADR-205-ending-button-on-a-hidden-tree.md`); the tightest row is 640 x 700, 12.6 pixels
   between them on Windows and 17 in the CI image.

7. **At and below the floor** (10.4), where the notice stands in for the tree view, both stay, as
   the floating controls do: icons with their names, inside the window, under the bar. At
   320 x 480 they stand clear of the notice's text in both languages; further below the floor
   (300 x 400) its first line begins under them (the research record, section 6, on Windows).

## Alternatives rejected

- **In the chrome bar.** The owner: "not in the header bar".
- **At the top right, in the floating group.** The owner: "top left".
- **Words at every width.** Below 1000 pixels the band left of the arrow holds the ending's words
  on a step that ends, and on the public page "Back to the editor" meets the up arrow at
  360 x 640; the floating controls give up their words below 1000 for the same band.
- **Icons at every width.** From 1000 pixels the words fit beside everything measured, 90.4
  pixels or more from the ending's button; a word says what an eye or a pencil only suggests.
- **The Tree's look for the way back** (no `data-editor-ui`). Then the two buttons that stand "in
  the same place" would look different; and the way back is the creator's control, not the
  readers' -- the editor's own interface keeps the default look (#180).
- **A Sheet behind either.** Each leads to one page; a link is what it is (11.3: "an ordinary
  `<a href>`").
- **The preview button after the floating controls in the tab order**, so that the editor's tab
  order stays as `floating-controls.spec.ts` asserts it. The band's left end would come after its
  right end: not the order the page is read in.
- **Hiding both at the floor**, with the tree view. The way back would leave a creator in a small
  window no way to the editor but the browser's; the floating controls stay at the floor for the
  same reason (`floating-controls.spec.ts`).

## Consequences

- `src/editor/PreviewButton.tsx` (new, #206): the editor's button, a client component reading the
  `Editor`'s context (`ADR-205-way-there-and-back.md`); the preview's page renders the way back
  itself; one rule set in `src/app/[lang]/globals.css` draws both (class `preview-button` in the
  editor, `preview-back` in the preview).
- `src/chrome.ts` gains `preview` and `backToEditor` (3.2's #206 row).
- `tests/browser/preview.spec.ts` (#206) measures both buttons' boxes at every viewport of the
  research record's column "the rule", in both languages; `floating-controls.spec.ts`'s tab test
  reaches the preview button between `logout` and the to-do control (40.9).
