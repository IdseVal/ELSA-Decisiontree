# ADR-263-description-scroll: the description's box is a native vertical scroll container with an attribute of its own, a focusable region named by the Node's title; shadows show there is more, a scroll at its end goes nowhere, an explainer's panel stays outside its clip and closes when it scrolls, and every box starts at its top

- Status: ACCEPTED (frozen) -- 2026-11-18; decides core document 10.46 with
  `ADR-263-description-limit.md`, `ADR-263-description-box.md`, `ADR-263-elsa-tree-8.md` and
  `ADR-263-description-field.md`
- Issue: #263 -- Decide the longer description that scrolls in the Bubble and the Overlay (#262)
- Spec: `docs/specs/application.md` 10.6, 10.8, 11.3, 26.3 (amended `[#263]`) and 43.3, 43.5,
  43.6, 43.11 (new)
- Core document: section 9 `[#262]` and 3.2 `[v0.2]` (the PROPOSED "the page still never scrolls,
  and nothing else in the Bubble or the Overlay scrolls but the Carousel strip", confirmed), 3.2
  `[#262]` (the reading "allow for scroll", confirmed), 10.46
- Amends: `ADR-38-no-scroll.md` (decision 4: a third element the walk exempts, for its height
  only), `ADR-133-overview-tiles.md` (decision 5: "the second and last element the no-scroll
  rule exempts" is no longer the last), `ADR-78-explainers.md` (decision 6: the panel also closes
  when the box it is in scrolls)
- Measured in: `docs/research/issue-263-description-box.md` (sections 2 and 4)
- Built by: #264 (the public pages and the preview), #265 (the editor's field, through
  `ADR-263-description-field.md`)

## Context

The owner wrote in issue #262 that the description's box "should allow for scroll". The page must
still never scroll (core document section 9: "We absolutely cannot have any scrolling on the
page"). `docs/specs/application.md` 10.6 exempts two things from its element walk: the Carousel
strip, which scrolls horizontally, and a `[data-scroll-box]`, which scrolls vertically and is
carried by "the things the format does not bound" on the admin pages; 26.3 says of the second:
"Nothing else may carry it: the Bubble, an Overlay, every other Sheet holds what the format bounds
and fits or is a defect."

The record drew the box of `ADR-263-description-box.md` into `dev`'s production build as
`overflow-y: auto` with `overscroll-behavior: contain` and probed it at 1280 x 640 (its section
4): focused, the keyboard scrolls it (ArrowDown 40 pixels, PageDown and End to its end, Home back);
a wheel at its end moves neither it nor the document; focus on an explainer term in a box scrolled
to its end scrolls the term back into view and opens its panel, which lies inside the text area and
is drawn over the box, because its containing block is the text area and not the box; and a panel
left open while the box scrolls stays where it was placed while its term leaves the box. The
element walk of 10.6, with the box's height skipped and its width walked, found nothing at any of
the 1,280 rows of the box states, on either platform.

## Decision

1. **A native scroll container.** The description's element (`.prose`, which `Explainer.tsx`
   renders) has `overflow-y: auto` and never scrolls sideways: its text wraps
   (`overflow-wrap: anywhere`), so it is never wider than itself. It works without JavaScript,
   by wheel, touch, scroll bar and keyboard. Its scroll bar is the browser's own,
   `scrollbar-width: thin`.
2. **An attribute of its own: `data-description-box`**, not `data-scroll-box`. 10.6's walk skips
   the box's **height** check and keeps its **width** check, where it skips both for a
   `[data-scroll-box]`; and it checks that the box's bottom lies inside its text area. So the
   exemption is the owner's -- the description scrolls, vertically, inside its box -- and no wider.
   26.3's rule stands for `[data-scroll-box]`, which a Node page and an Overlay still never carry;
   10.6 has three exemptions, the strip, a `[data-scroll-box]` and the description's box. The
   document never scrolls, at any size, including while a box is scrolled to its end.
3. **The keyboard reaches it: a focusable region named by the Node's title.** The box has
   `tabindex="0"`, `role="region"` and `aria-labelledby` the id of the title of its Interior
   (`node-title`, prefixed in an Overlay as every id there is), on every Node, as the Carousel
   strip is a focusable region named for assistive technology (12.3). Focused, the arrow keys,
   Page Up and Page Down, Home, End and the space bar scroll it, natively. Tab reaches it after
   the title and before the first link or explainer term inside it. In a neighbour frame, which is
   inert and `aria-hidden` (11.3), it is reached by nothing.
4. **What shows there is more: two shadows and a cut line.** The box draws a shadow at its lower
   edge while text lies below it and one at its upper edge while text lies above it, in the
   Theme's `rule` shade over its `surface`, by CSS alone (backgrounds attached `local` and
   `scroll`), so it shows with and without JavaScript; and its height is not a whole number of
   lines (104.9 at 1280 x 640, `ADR-263-description-box.md` decision 4), so the top of the next
   line shows under the last whole one. The scroll bar shows where the platform draws one.
5. **A scroll at the box's end goes nowhere: `overscroll-behavior: contain`.** A wheel or a touch
   that reaches the box's top or bottom does not chain to the page, which cannot scroll anyway
   (10.6), and does not start a browser's pull-to-refresh or overscroll glow. Measured: 400 pixels
   of wheel at the end left the box and the document where they were.
6. **Explainers inside the box.** The marks and their panels stay as 10.8 has them; the box is
   **not** positioned, so the panel's containing block stays the text area and the panel is never
   clipped by the box: placed below or above its term's line inside the text area, as today,
   wherever the box has scrolled. Focus on a term scrolls it into view first (native). **A scroll
   of the box closes the open panel**, as a resize of the window does today (`Explainer.tsx`'s
   `close`), so no panel points at a term that has left the box. Without JavaScript the panel
   opens at the foot of the text area by CSS, full width, as today.
7. **The neighbour frames and the slide: every box starts at its top.** A neighbour frame draws
   its box at its top; so does the page a slide arrives at, a page reached by the browser's back
   and forward, and a reload. Nothing keeps or restores a box's scroll position, and the address
   carries none: the address is the Node's (4.1). During a slide the centre frame moves as it is,
   its box where the reader left it, until the target's page replaces it (11.3 step 4).
8. **Below the guarantee the box is the same.** Its height is what 10.5's order leaves the text
   area (`ADR-263-description-box.md` decision 5); step 7's type steps down inside it. At the
   floor the notice replaces the tree view, as before. The description is never put in a Sheet.
9. **The tests.** `no-scroll.spec.ts`, `admin-no-scroll.spec.ts`, `admin.spec.ts` and
   `creation-walk.spec.ts` skip `[data-description-box]`'s height and walk its width; each asserts
   that every box's bottom is inside its text area, and measures every page of 10.6 again with
   each visible box scrolled to its end. The fixtures of `ADR-263-description-limit.md` decision 4
   make the box scroll at 1280 x 640. A browser test proves decisions 3 to 7 on the full Node:
   Tab reaches the box, named by the title; ArrowDown and End scroll it and the document stays at
   0; a wheel at its end changes nothing; a term focused from a box scrolled to its end opens its
   panel inside the text area and on top; a scroll of the box closes it; a neighbour frame and a
   page after a slide show their boxes at the top (`application.md` 43.11).

## Alternatives rejected

- **`data-scroll-box`.** The walk skips both its axes, so a description that grew wider than its
  box would pass; and 26.3 gives that attribute to the admin pages' unbounded lists, which the
  Bubble's text is not.
- **A script-driven scroller, or "more" control that opens the rest.** The page works without
  JavaScript (section 14); a control that opens the rest is a Sheet, which 10.5 keeps for what is
  given up, and the description is never given up.
- **Focusable only while the box overflows.** Only a script knows when that is, and the box must
  be reachable without one; Chromium makes a scroll container focusable by itself only when
  nothing inside it is, and a box with an explainer term or a link inside would not be.
- **A fading mask over the box's last line** (`mask-image`). It hides the text under it while
  the reader is at the end, where there is nothing more to show; the shadows show only on the side
  that has more.
- **Keeping the scroll position across a slide or in the address.** The address names a step,
  not a reading position; a box kept scrolled on the next step would hide that step's first lines.
- **Positioning the box** (`position: relative`), so that a panel is placed in it. The panel
  would then be clipped by the box, and a panel on the box's last line would have no room below.

## Consequences

- `Explainer.tsx` listens for `scroll` on its own element while a panel is open, as it listens
  for `resize` on the window (#264).
- The editor's description field is drawn in the same box (`ADR-263-description-field.md`).
- 10.6's walk has three exemptions, and `ADR-38-no-scroll.md`'s "exactly one exemption" and
  `ADR-133-overview-tiles.md`'s "second and last" carry a dated line naming this ADR.
