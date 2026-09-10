# ADR-38-transitions: following a Branch translates one element, the tree layer, and ends at exactly the URL a plain link would have reached

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #38 -- Architecture: freeze the version 0.2 application contracts
- Spec: `docs/specs/application.md`, sections 11.1, 11.3, 11.4
- Core document: 3.2 ("I want the transitions to slide over the tree to the next node")

## Context

The owner asked for the movement between Nodes to be a slide of the tree rather than a
page swap. Two things the owner explicitly did not change constrain how (#35, "out of
scope"): the way navigation follows the URL, and the copy-link option. So a transition
must leave the browser at the address a plain link would have produced -- reload, back
and share are the same feature as the URL scheme of `application.md` 4.1, and 0.1's
guarantee that every Node is reachable by its URL survives only if that stays exactly
true.

`ADR-38-neighbourhood.md` puts the target Bubble in the page before the click.
`ADR-38-tree-view.md` gives every Branch a direction. What remains is what actually
moves, and what the address bar does while it moves.

## Decision

1. **One element moves.** Everything between the chrome bar and the disclaimer -- Trail
   Branches, Bubble, out-Branches, Carousel, neighbour Bubbles -- is the **tree layer**.
   A transition is a `transform: translate` on that one element. This is the structural
   requirement issue #41 leaves for #42: one element, one transform.
2. **A Branch has a direction and a slot, and the neighbour is rendered one viewport
   away in that direction.** Following the Branch translates the layer by exactly that
   offset, so the target arrives in the centre. The reader sees a complete Bubble
   arriving, with its own Branch labels, not a placeholder.
3. **The click is intercepted on an ordinary `<a href>`.** `Slider` starts the
   translation and, in parallel, the client navigation to the same `href`. When the
   payload arrives the tree layer is replaced by the target's own layout and the
   transform resets; nothing jumps, because the Bubble that was arriving and the Bubble
   that is now the centre hold the same Node.
4. **The URL is the plain link's URL**: `followHref` for a Branch out, `trailHref` for a
   Trail Branch (`application.md` 4.1), pushed exactly as the link would have left it.
   The transition tells no story about the address bar.
5. **Back and forward are the browser's** and reverse the slide when the payload is in
   the framework's cache.
6. **`prefers-reduced-motion: reduce` removes the motion, not the navigation**: the
   target replaces the current view without a transform. Which Nodes are fetched does
   not change with the setting.
7. **Without JavaScript the Branch is what it looks like**: a link that loads the target
   page. The tree is redrawn around the new Node instead of sliding to it
   (`ADR-38-without-javascript.md`).

## Alternatives rejected

- **The View Transitions API.** The modern answer and genuinely less code: name the
  Bubble, let the browser cross-fade and morph between documents. Rejected for now
  because the effect the owner asked for is a *translation of a tree the reader can see*,
  not a morph between two states of one element -- the neighbour Bubbles that make it
  read as a tree are already on screen and must move with it -- and because support is
  uneven enough that the fallback would have to be built anyway. It is the obvious thing
  to revisit if this becomes universally available: the ADR to write then would replace
  decisions 1 to 3 and leave 4 to 7 untouched.
- **Animating each Bubble separately.** More expressive, and it would let a Bubble fade
  as it leaves. Rejected: it is many elements' worth of state to keep in step with one
  navigation, and the no-scroll test has to hold mid-transition, which is far easier to
  guarantee about one transform than about eleven.
- **Replacing history with the framework's shallow routing, or updating the URL only
  after the slide.** Both make the address bar lag the view. A reader who copies a link
  mid-slide would share the previous Node, and the share link is the owner's, not ours to
  make approximate.
- **Animating with JavaScript on every frame.** A CSS transform transition is composited
  off the main thread; a script that writes `style.left` sixty times a second is not, and
  it would compete with React swapping the tree layer in step 3.
- **Suppressing the transition when the payload is slow, to avoid showing a Bubble whose
  own neighbours have not arrived.** Adds a timing branch to hide something the reader
  cannot notice: the arriving Bubble is complete and carries its own Branch labels; only
  the Bubbles one hop beyond it are missing, and they are off screen.

## Consequences

- Reload, back, forward and copy-link keep working exactly as in 0.1, which is what the
  owner asked to be left alone.
- `transition.spec.ts` can assert the contract directly: the URL after a slide equals the
  plain-link URL, the transform changes, and with reduced motion it does not while the
  navigation still happens.
- The no-scroll test runs mid-transition, so a slide that momentarily overflows the
  viewport is a failing test rather than a flicker somebody notices later.
- Issue #42 owns one client component with one job. If the transition is ever removed,
  the application is still complete: the Branches were always links.
