# ADR-38-carousel: the Carousel is a native scroll-snap strip of this Node's own Images, the one element allowed to scroll, enlarged in the same Sheet the rest of the view uses

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #38 -- Architecture: freeze the version 0.2 application contracts
- Spec: `docs/specs/application.md`, section 12
- Core document: 3.2, open item **10.6** (reversed by the owner on 2026-09-09)

## Context

The owner (#35): "where are the images? I told you there should be image carrousells
below the node bubble." This reverses the 0.1 decision recorded as core document open
item 10.6 -- thumbnails, no carousel chrome -- which the owner had agreed to on
2026-09-03 and rejected after seeing it.

The constraints the Carousel arrives into are tight. It has 80 pixels of the 640-pixel
vertical budget (`tree-format.md` 5.7). The page may never scroll. Every Image carries a
`credit` that must be shown (core document 8; `tree-format.md` 5.2, "required for every
Image without exception"). A Node may carry ten Images and each of its eight Options up
to three, and `tree-format.md` 5.4 left it to this issue whether the Option's Images
join the Node's Carousel. Images may only be loaded for the Node on screen (core
document 9).

## Decision

1. **The Carousel shows this Node's own `images` list, in the author's order**, at most
   ten. The list is the order, the `description` is the caption, and the `credit` is
   shown with the picture -- `tree-format.md` 5.2 says the format needs nothing more, and
   this is the frontend keeping that bargain.
2. **Option Images do not join it.** An Option's first Image is shown on its Branch
   (`ADR-38-tree-view.md`), next to the words it illustrates.
3. **The strip is a native scroll-snap container, and it is the one element in the
   document allowed to scroll** -- horizontally, inside its own 80-pixel row. That
   exemption is stated in `ADR-38-no-scroll.md` and is what makes the Carousel work
   without JavaScript, keyboard-operable for free, and incapable of making the *page*
   scroll.
4. **The buttons are an enhancement, not the mechanism.** `previous` and `next` scroll
   the strip by a page. They do not own "which Image is current"; the scroll position
   does.
5. **The credit is never cut; the description gives way.** The caption line under the
   thumbnails is 20 pixels -- 60 + 20 is the row's 80 -- and holds one 13-pixel line of
   about 170 characters, while a `description` and a `credit` may be 240 together. So the
   credit is laid out whole and the description is shortened to what is left, at least 47
   characters; the whole description is the thumbnail's alternative text and the enlarged
   view shows both fields in full. The shortening is computed on the server rather than
   done with `text-overflow`, because an ellipsis painted over content that still
   overflows its box is exactly what `ADR-38-no-scroll.md`'s test measures and forbids.
6. **The enlarged view is the same `Sheet`** as the Trail Sheet and the collapsed groups
   of `application.md` 10.5: bounded to the viewport so it never scrolls, closed by
   Escape, by its close button or by a click outside, focus returned to the thumbnail.
   One overlay concept, four uses -- the enlarged Image, the full Trail, the collapsed
   Options and the collapsed Sources -- one set of keyboard rules.
7. **Without JavaScript** each thumbnail is an `<a href="/images/<file>">`: the browser
   opens the file. This is 0.1's behaviour, kept.
8. **The row exists even when the Node has no Images**, empty and the same height, so the
   Bubble sits in the same place on every Node and the slide of
   `ADR-38-transitions.md` has nothing to reflow.
9. **Loading:** `loading="lazy"` with explicit `width` and `height` on every thumbnail,
   so a Node with ten Images fetches what the row shows rather than the list; only the
   centre Bubble's Images are ever named in the markup at all
   (`ADR-38-neighbourhood.md`); enlarging costs no request, because it shows the file the
   strip already has.

## Alternatives rejected

- **A JavaScript carousel: one large image at a time, state in the client, buttons that
  own the index.** What "carousel" usually means, and what the owner has probably seen
  elsewhere. Rejected because it does not work without JavaScript, because it needs
  keyboard handling written by hand that the platform already does correctly, and
  because one image at a time in an 80-pixel row is a letterbox -- the strip shows five
  pictures in the height where a single one would be unreadable.
- **Taking the height for a larger picture out of the Bubble.** The Carousel would look
  better and every description in every Tree would have to get shorter, because
  `tree-format.md`'s 600 characters are exactly the 192 pixels left over after the other
  rows. Reversing a frozen format limit to make a strip prettier is the wrong trade, and
  the Sheet already gives the reader the big version on demand.
- **Merging the Options' Images into the Carousel.** Left open by `tree-format.md` 5.4.
  Rejected: the Carousel's contract is that its order is the Node's `images` list and its
  caption is that Image's description. A merged list breaks both, and no reader can tell
  which of nine pictures belongs to which of eight Options.
- **A credit line under every thumbnail instead of one shared caption.** Correct in
  principle and impossible in 80 pixels: 60 of thumbnail plus a per-item credit leaves
  nothing. The shared caption plus the always-present credit in the enlarged view keeps
  every credit reachable without an interaction the reader must discover.
- **Exempting nothing and paging the strip with a `?img=n` query.** Would keep the
  no-scroll rule exemption-free and work without JavaScript. Rejected: it adds a query
  parameter to a URL scheme the owner told us not to touch (`application.md` 4.1 ignores
  every other parameter), and it makes looking at a picture a navigation.
- **`<dialog>` for the enlarged view and something else for the other overlays.** 0.1
  used a native `<dialog>` for enlarging, and it was right for one overlay. With four
  overlays, one `Sheet` -- which may well be built on `<dialog>` inside -- is one set of
  focus and Escape rules instead of four.

## Consequences

- Core document 10.6 is settled in the owner's favour and the frontend has one fewer
  bespoke widget than a carousel usually costs.
- `ADR-38-no-scroll.md`'s test carries one exemption, `[data-carousel-strip]`, and it is
  named in the spec rather than discovered in a test file.
- A Node with 8 Options and 10 Images may request up to 18 image files -- all of them its
  own. That is the ceiling the format's counts imply, and it is stated in
  `application.md` 12.4 so nobody has to derive it from a slow page.
- Issue #43 builds a strip, two buttons and a caption line, and reuses the `Sheet` #41
  already ships.
