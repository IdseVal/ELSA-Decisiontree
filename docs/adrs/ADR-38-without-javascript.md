# ADR-38-without-javascript: a client component may only enhance markup that is already correct without it, so the tool still works with JavaScript off and every guarantee of core document section 9 still holds

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #38 -- Architecture: freeze the version 0.2 application contracts
- Spec: `docs/specs/application.md`, sections 1 and 14
- Core document: 3.2 (server-side rendering, lightweight, lazy), section 9

## Context

Version 0.1 promised that everything except the thumbnail enlarge and the share button
worked without JavaScript (`application.md` section 1, frozen 2026-09-03). Two of the
owner's five 0.2 instructions need client code by their nature: a slide transition, and
neighbour Nodes rendered ahead of a click. The issue that opened this work says so
plainly and asks the Architect to decide what remains true and write it down, "because
the interoperability and lazy-loading guarantees of core document section 9 depend on
it".

The temptation at this point is a weaker promise -- "the server still renders the current
Node as HTML" -- which is true, unfalsifiable and worth very little to a reader.

## Decision

**The promise is restated as a stronger one: without JavaScript this is a working
decision-tree tool, not a readable page.** `application.md` section 14 lists it line by
line. In summary:

1. **Every Branch is an ordinary `<a href>`** -- the Trail Branches, the Answers, the
   Options, `back` and `startAgain`. Following one loads the target page. The tree is
   redrawn around the new Node instead of sliding to it.
2. **Going back up the Trail works** because the URL *is* the Trail (`application.md`
   4.1); a Trail Branch is a link that discards the later Trail, with no client state
   involved.
3. **The Carousel works**, because the strip is a native scroll-snap container rather
   than a client state machine (`ADR-38-carousel.md`); enlarging falls back to the
   image's own URL, as in 0.1.
4. **The Theme works**: colours, fonts and logo are server-rendered CSS and a plain
   `<img>`. A lab's identity does not depend on a script.
5. **The no-scroll rule holds**, because it is CSS and the format's length limits.
   `no-js.spec.ts` runs the measurement of `application.md` 10.6 with JavaScript
   disabled.
6. **The language switch and the share link work**: links, and the address bar.
7. **The neighbour Bubbles stay hidden** without `Slider`, which is what reveals them.
   They are in the HTML, `aria-hidden` and out of the tab order; nothing the reader
   needed is hidden with them, and no image of another Node is requested either way,
   because a neighbour Bubble never carries an image URL
   (`ADR-38-neighbourhood.md`).
8. **What is lost is motion and convenience**: the slide becomes a page load, the
   enlarged view becomes the file, the Carousel's buttons become a strip the reader
   scrolls, the share button is not shown when it cannot work.
9. **The rule that keeps this true as the application grows:** a client component may
   only enhance markup that is already correct without it. A feature that cannot be
   expressed that way goes in the server render or does not go in.
10. The 404 page's body remains the single framework exception (`application.md` 4.3,
    amended by the owner on PR #17), unchanged.

## Alternatives rejected

- **Drop the promise: 0.2 needs client code, so require JavaScript.** The honest-looking
  option, and the one the two new features seem to force. Rejected because nothing that
  is actually lost is load-bearing: the whole tool is links over server-rendered HTML,
  and the client code moves things and copies a string. Giving up the guarantee would buy
  no simplification at all -- the server render has to exist regardless, for first paint
  and for the framework's own navigation.
- **Weaken it to "the server renders the current Node and its links as HTML".** The
  minimum the issue itself suggested. Rejected because it is untestable in any useful
  sense: a page can satisfy it while the Trail, the Carousel and the language switch are
  all dead. `no-js.spec.ts` exists because a promise nobody measures decays.
- **Render the neighbour Bubbles without JavaScript too.** They are in the HTML already,
  so it costs nothing to show them. Rejected: off-centre Bubbles that never move are
  clutter to a reader who cannot slide, they would be read out by a screen reader as
  content of this page, and they would make the no-scroll rule much harder at the
  degraded viewports of `application.md` 10.5.
- **A `<noscript>` variant of the view.** A second view to build, test at ten
  viewports and keep in step with the first, to replace one that already works.

## Consequences

- `application.md` section 1's client-side row goes from two client components to four,
  and section 14 is what the row points at.
- `no-js.spec.ts` joins the browser tests, so this is a checked promise rather than a
  stated one.
- Issues #41, #42 and #43 each inherit decision 9 as a constraint on how they may build,
  which is why the Carousel is a scroll container and the Branches are links.
- If the client bundle ever fails to load -- an old browser, a blocked script, a bad
  deploy -- a reader still reaches every Node of the Tree by clicking.
