# ADR-78-overlay: an Option opens its side child in an Overlay that is the existing Sheet with the Option button as its control, the address does not change, and an explanation Node's URL renders its parent's page with that Overlay open

- Status: ACCEPTED (frozen) -- 2026-09-17
- Issue: #78 -- Architecture: freeze the contracts for the display changes of #75
- Spec: `docs/specs/application.md` 10.3, 10.9, 11.1 to 11.5, 14; 4.1 unchanged
- Core document: 3.1 (traversal rule, `[#75]`), 3.2 ("Side children open in an Overlay"), open item **10.27** (decided here), 10.23 (unchanged)
- Supersedes in part: `ADR-38-tree-view.md` (decisions 3, 8, 10 as far as they concern Option Branches and the `back` Branch), `ADR-38-neighbourhood.md` (decisions 1 and 3: the `side` direction), `ADR-38-transitions.md` (decision 2 as far as it concerns the side slide)
- Built by: #80

## Context

The owner (#75): "I want all side nodes to be still displayed on the side as they are
now, but when clicked they should load in an overlay on the page, with a little cross to
close it, or when clicked outside of it it closes. This overlay should just contain the
larger explainer that would be displayed in the side-node." And, of the main image: "the
overlay itself follows the same rule of displaying the image above the title."

In 0.2 an Option Branch navigates to its target, which becomes the centre Bubble, the
tree slides sideways to it (`application.md` 10.3, 11.1 to 11.3), the explanation Node
shows a `back` Branch and an `explanationOnly` hint, and the neighbourhood places every
Option target `side`. The URL scheme (4.1) gives every Node a URL whose path is the
Trail, and the owner keeps it (#35, #75: "the way navigation works in line with the URL
and the copy-link (share) option" is out of scope). The format allows an explanation Node
to have Options of its own (`tree-format.md` 5.6) and to be the target of Options on
several Nodes. Every Node must stay reachable by URL, an open Overlay must never scroll or
make the page scroll (core document 9), and a reader without JavaScript must still reach
the explanation (`application.md` 14).

## Decision

1. **The Overlay is the `Sheet`, not a second overlay.** An Option button is the
   `<summary>` of a `<details>` whose one page is the target's **Interior** -- the same
   component the Bubble renders: main image above the title, then title, description
   (with its explainers) and the Sources under their heading (`application.md` 10.3,
   `ADR-78-main-image-and-row-budget.md`). The Sheet's rules apply unchanged: closed by
   Escape, by its close cross and by a click outside; one Sheet open at a time; the
   panel bounded to the viewport so that it never scrolls; focus moves to the cross on
   open and returns to the Option button on close. Without JavaScript the disclosure
   opens the Interior laid over the page, as every Sheet does (section 14), and the
   Option button, which stays uncovered beside the Bubble, closes it on a second click.
2. **The page pre-renders the Interior of every Option target, closed.** The targets are
   read by `neighbourhood` as before (one `getNode` per id, at most 8), but they are no
   longer *placed* in the tree layer: `Direction` loses `side`, the side slide goes, and
   the Overlays are the page's **asides**. A closed Overlay's strip pictures are
   `loading="lazy"`, so the browser requests nothing for an aside until it is opened
   (`ADR-78-fan-out-and-option-picture.md` for the accounting).
3. **Opening or closing an Overlay does not change the address.** The address is the
   page's, and the page is the parent's. This is what "the way navigation works in line
   with the URL" being out of scope means once a side child no longer replaces the
   parent: nothing happens to the address bar that a disclosure does not do.
4. **The URL of an explanation Node renders its parent's page with that Overlay open
   (10.27).** For a path `/<tree>/<id-1>/.../<id-n>` the **centre** is the last entry
   that is a question Node or a Terminal; the entries after it are explanation Nodes and
   the last of them is the Overlay rendered `open`. "Parent" is therefore what the path
   says it is, entry by entry, which is the same rule the Trail has always followed
   (4.3 checks no adjacency); an explanation Node reached by two different Options has
   two URLs, one under each parent, and each renders that parent. The centre's own
   Branch hrefs are built from the path **up to the centre**, so answering the parent's
   question after reading an aside does not carry the aside into the Trail. A path with
   no question Node or Terminal in it -- `/<tree>/<explanation-id>` typed by hand -- is
   the one case with no parent to show: the explanation Node is then the centre itself,
   as a fifth situation of 10.3 (its Interior in the Bubble, its Options as buttons,
   `startAgain` in the Answer row, no up arrow), so that "every Node is reachable by
   URL" stays literally true.
5. **A second-level Option inside an Overlay is a plain link** to
   `<page path>/<this explanation id>/<its target id>`, which by decision 4 renders the
   same parent's page with the deeper Overlay open. One Overlay at a time holds: the
   deeper one replaces the first, and the way back to the first is the browser's back or
   the first Option's button. The Overlay's heading is a link to the explanation Node's
   own address for the same reason: it is the one plain link on the page that names the
   aside, so the reader can copy an address for it (the share button copies the page's)
   and a reader without JavaScript can open it as a page.
6. **What goes:** the `side` direction and its placements (11.2), the side slide (11.1,
   11.3), the `back` Branch and the `explanationOnly` hint (10.3), and the chrome keys
   `back` and `explanationOnly`. The neighbourhood is `up` (the parent) and `down` (the
   Answer targets and theirs), at most 7 placements; with at most 8 asides and the one
   Overlay a URL may name that is not an aside of the centre, a page still reads at most
   17 Nodes.

## Alternatives rejected

- **A second overlay component for the Overlay.** Rejected: the Sheet already has the
  cross, Escape, click-outside, the one-at-a-time rule (#59), the viewport bound and the
  no-JavaScript disclosure. A second implementation would be a second set of keyboard
  rules to keep in step, which `ADR-38-carousel.md` decision 6 rejected once already.
- **Pushing the explanation Node's URL when the Overlay opens (`history.pushState`).**
  Attractive: the back button would close the Overlay and the share button would carry
  it. Rejected: it changes the way navigation works in line with the URL, which the
  owner excluded; it cannot be done without JavaScript, so the address would mean one
  thing with script and another without; and every Node already has a URL that opens the
  Overlay (decision 4), which is what a shared link needs.
- **Redirecting an explanation Node's URL to its parent's.** Rejected: a shared link to
  an exclusion would open on the question without the exclusion, which is not what was
  shared.
- **Keeping the 0.2 rendering (the explanation Node as the centre) for every URL that
  names one.** Rejected: a shared link and a click would show two different things for
  the same Node, and the `back` Branch and the hint would have to stay for that case
  alone. The fifth situation of decision 4 is kept only for a path with no parent at
  all, which no link the application produces contains.
- **Making the Option button an `<a href>` that script turns into an Overlay.** A plain
  link without JavaScript, which is the strongest reading of "reachable by a plain
  link". Rejected: a `<details>` cannot be opened by a link without script, so the two
  paths would need two mechanisms, and the reader without script would leave the page
  to read an aside that the reader with script reads in place. The disclosure gives the
  aside in place either way, and the Overlay's heading (decision 5) is the plain link.
- **Nesting Overlays for second-level Options.** Rejected: two panels over one page
  double the focus and Escape rules and cannot both fit a 640-pixel viewport at the
  format's maxima.

## Consequences

- `src/neighbourhood.ts` returns placements for `up` and `down` and the asides
  separately; `neighbourhood.test.ts` asserts at most 7 placements and at most 8 asides
  and that no `side` placement exists. `Slider` has one less direction.
- `transition.spec.ts` gains the asides' rows of 11.5 and loses the side slide.
- `no-scroll.spec.ts` measures every page with the Overlay open, at every viewport, with
  and without JavaScript; the Overlay at the format's maxima -- an explanation Node with
  eight Options of its own -- is a fixture (`tests/fixtures/overlay/`).
- The Option collapsed into the `options` Sheet (10.5) is a plain link to the explanation
  Node's address, which opens the Overlay by decision 4.
- Core document 10.27 is answered and 3.1's traversal rule holds as written: "going
  back" is closing the Overlay.
