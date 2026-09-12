# ADR-38-no-scroll: the layout is guaranteed at 1280 x 640, below that it gives things up in a fixed order rather than handing out a scrollbar, and a browser test measures scrollHeight at ten viewports on every kind of Node

- Status: ACCEPTED (frozen) -- 2026-09-10; amended 2026-09-12 by issue #41 (below)
- Issue: #38 -- Architecture: freeze the version 0.2 application contracts
- Spec: `docs/specs/application.md`, sections 10.4, 10.5, 10.6, 10.7
- Core document: 3.2, section 9 ("the page must never scroll"), open item **10.22**

## Context

The owner (#35): "Everything that is on an opened node should fit on the screen, inside
the bubble. We absolutely cannot have any scrolling on the page." The core document
makes it one of the things that must never happen (section 9). It is met on the data
side by `tree-format.md` 5.7's length limits, which were derived from an assumed
1280 x 640 viewport and which asked this issue to confirm or correct them. Core document
open item 10.22 asks this issue for three things: the viewport the layout guarantees,
what happens on a smaller screen, and how "never scrolls" is tested.

"No scrolling" is a statement about a laid-out document. No unit test can make it; only
a browser can.

## Decision

1. **The guaranteed viewport is 1280 x 640 CSS pixels** -- `tree-format.md` 5.7's
   assumption, confirmed. At or above it the full arrangement of `application.md` 10.1
   is shown, no label truncated, nothing collapsed, and the document does not scroll.
2. **The floor is 320 x 480.** Below it the application shows the `minimumSize` notice,
   which itself fits and does not scroll. 320 x 480 is smaller than any display in
   current use (an iPhone SE is 375 x 667), so the notice is a backstop for a resized
   desktop window, not an answer to mobile.
3. **Between the floor and the guarantee the layout gives things up in a fixed order of
   seven steps** (`application.md` 10.5): the Trail collapses, then the Carousel, then
   the Option columns move below, then the Options collapse, then the Sources collapse,
   then the type scale steps down to a floor of 13 pixels, and only then the notice.
   Each collapsed thing stays reachable behind one control, which opens the same `Sheet`.
   **The Node's title, description and Answer Branches are never given up**: they are the
   step the reader is on.
4. **The rule is absolute and has exactly one exemption.** `html` and `body` are the size
   of the viewport with `overflow: hidden`; no element's content is taller or wider than
   the element, except the Carousel strip, which scrolls horizontally inside its own
   80-pixel row (`ADR-38-carousel.md`). The document never scrolls at any size, with a
   Sheet open, or during a transition.
5. **The test** is `tests/browser/no-scroll.spec.ts` (Playwright, now in the contract):
   `document.documentElement` and `document.body` have `scrollHeight <= innerHeight` and
   `scrollWidth <= innerWidth`, and **every element** in the document except
   `[data-carousel-strip]` has `scrollHeight <= clientHeight` and
   `scrollWidth <= clientWidth`, with a one-pixel tolerance for sub-pixel rounding. It
   runs at ten viewports (1280 x 640, 1366 x 768, 1920 x 1080, 2560 x 1440,
   1280 x 800, 1024 x 768, 768 x 1024, 390 x 844, 360 x 640, 320 x 480) over every kind
   of Node, in both languages, including a fixture Node at every maximum the format
   allows with a 49-entry Trail, and including a Sheet open and mid-transition.
6. **`tree-format.md`'s limits are confirmed unchanged**, so `elsa-tree/2` needs no new
   format number. Six of its assumptions are re-derived by this layout and none of them
   moves a number (`application.md` 10.7); that is recorded as a comment on issue #37, as
   that spec asks.

## Alternatives rejected

- **Scale the whole tree layer uniformly by `min(1, vw/1280, vh/640)`.** One line of CSS
  and the rule would hold at every size. Rejected: on a 390-pixel phone the factor is
  0.30, which turns 16-pixel body text into 4.8-pixel body text. A rule that is honoured
  by making the content unreadable has not been honoured.
- **A minimum-size notice for everything below 1280 x 640.** Simple and defensible, and
  it was the first reading of "the owner's rule is absolute". Rejected because it turns
  a tool for "a broad audience" of AI developers (core document 2) into a desktop-only
  tool, and because the degradation order costs #41 seven CSS steps rather than a second
  layout.
- **A second, independently designed layout below a breakpoint.** The usual answer, and
  the most work: two arrangements to design, to test at ten viewports and to keep in
  step as #42 and #43 build on them, and `tree-format.md`'s limits derived for only one
  of them. The degradation order is one arrangement that sheds parts, so there is one
  thing to reason about and every limit keeps holding.
- **Letting the Bubble scroll internally when its text is long.** The obvious escape
  hatch, and precisely what the owner ruled out: the sentence is that everything on an
  opened Node fits *inside the bubble*. It would also make `tree-format.md`'s length
  limits pointless, since any overflow would silently become a scrollbar instead of a
  validator error an author must fix.
- **Asserting only `documentElement.scrollHeight`.** Cheap, and it would pass while a
  nested element quietly scrolled. Walking every element is a handful of lines and is
  the difference between testing the rule and testing a symptom of it.
- **Leaving browser tests out of the contract, as 0.1 did.** 0.1 could: nothing it
  promised needed a laid-out document. This does, so `npm run test:browser` joins the CI
  command (`ADR-38-modules-and-tests.md`).

## Consequences

- Core document 10.22 is answered and recorded there.
- CI gets slower: `npm run test:browser` is now required, and `no-scroll.spec.ts` alone
  is ten viewports times six pages times two languages. It is the price of the
  owner's one absolute rule being checkable rather than asserted.
- A Tree that validates fits. If one ever does not, the failing test names the viewport,
  the Node and the language, and the answer is either a layout fix or a corrected limit
  on issue #37 with a new format number -- not a scrollbar.
- Issue #41 implements seven named degradation steps in order, not media queries of its
  own choosing.

## Amendment, 2026-09-12 (issue #41, the build)

Four things the build had to decide in a stylesheet are recorded here so that they are
the contract and not an implementation detail (`application.md` 10.4, 10.5, 10.7, 14).

- **Decision 2, the floor.** The floor itself shows the notice: a viewport **320 pixels
  wide or 480 pixels tall shows `minimumSize` whatever its other dimension** -- a
  1280 x 480 window as much as a 320 x 900 one -- because the order of decision 3 has
  nothing left to give up at that height or width. 10.4 read "down to 320 x 480" for the
  tree view and 10.6 "the floor: the notice"; 10.6's reading is the one built and
  measured, and 10.4 now says so.
- **Decision 3, step 1 at phone width.** Below 480 pixels of width the Trail row is 30
  pixels and gives up the parent's title as well: the row is `trailMore(n)` alone, `n`
  the whole Trail, the parent the first entry of the Trail Sheet and, below an
  explanation Node or a Terminal, the `back` Branch. A parent Branch holding an
  80-character title needs three lines of 20, which the row cannot hold and 10.2 does
  not let it truncate; on a question Node at that width the parent's title is one
  control away. At the same width the rim narrows to 22 by 10 pixels with the badge's
  and the hint's band kept per kind of Node. It is the one addition to the seven steps.
- **Decision 4, the Sheet without JavaScript.** A Sheet's list longer than one page of
  eight -- the 49-entry Trail -- is pages of nested native disclosures when no script
  runs: `next` opens the next page and the stylesheet hides the page before it, so no
  panel is ever asked to hold 49 links in a 360-pixel window. With the script the pages
  are the `previous` and `next` buttons of 10.2. Decision 5's test measures the
  no-script Trail Sheet page by page at every viewport, and the enlarged view of the
  interim thumbnails (`ADR-38-tree-view.md`, amendment) wherever a Node has an Image.
- **Decision 6, the face.** The widths of `application.md` 10.7 are re-derived in DejaVu
  Sans, the widest fallback body face, and hold there for every row but the Bubble's text
  area, which is 20 pixels short of the format's maximum in that face -- `tree-format.md`
  5.7's own caveat for a wide body font. So the default type stack (13.4, `src/theme.ts`)
  names Arial-metric faces before `sans-serif`, and a machine with no desktop face gets
  Liberation Sans, in which the maximum fits with 4 pixels to spare in Dutch.
