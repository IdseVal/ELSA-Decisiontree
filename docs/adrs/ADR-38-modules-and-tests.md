# ADR-38-modules-and-tests: two new modules own the two new ideas, the four client components are leaves, and browser tests enter the contract because the no-scroll rule is a fact about a laid-out document

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #38 -- Architecture: freeze the version 0.2 application contracts
- Spec: `docs/specs/application.md`, sections 6 and 7
- Amends `docs/adrs/ADR-5-repository-layout.md` and `docs/adrs/ADR-5-testing-approach.md`
- Core document: 3.2 ("Simple code: not many files, no long files -- it is a small app")
- Amended 2026-09-10 by issue #40 (PR #52): decision 1's count for `src/theme.ts`. The
  module emits **four** derived values, not three: `--elsa-scrim` joins the three
  readable-on colours, because CSS cannot compare luminance either and a backdrop that is
  not told which end of the palette is dark advances instead of receding on a dark Theme.
  The `:root` block also carries `color-scheme`, the UA hint written by the same dark
  test that picks the logo variant. See `ADR-38-theme-delivery.md`, amended likewise, and
  `application.md` 13.1. The module's interface, its depth and everything else below are
  unchanged.

## Context

Version 0.2 adds four ideas to the application: a tree of Bubbles and Branches, a
bounded neighbourhood, a Theme that arrives with the data, and a Carousel. The core
document asks for a small app with few files, so each of them must land somewhere
already justified, or bring one module with it and no more.

The 0.1 testing contract (`ADR-5-testing-approach.md`) deliberately left browser tests
out, on the stated grounds that nothing in those contracts depended on one. Three 0.2
contracts do: the page never scrolls, a navigation costs one payload, and no request
leaves this origin. None of them can be asserted against a string of markup.

## Decision

1. **Two new modules, and only two.**
   - `src/neighbourhood.ts` -- which Nodes surround the Node on screen, in which
     direction and slot, and the bound of sixteen. One exported function.
   - `src/theme.ts` -- a `Theme` (or its absence) turned into the exact CSS the page
     emits: seven properties, three derived colours, the `@font-face` rules, the
     defaults, and every escape.

   Each is a deep module: a small interface over the one question nobody else may answer.
   The alternative in both cases was to spread the logic through the components that
   need it, where it would be re-derived per caller and untestable except through
   rendered HTML.
2. **The view is four server components and four client components.** `TreeView`,
   `Bubble`, `Branch` and `Carousel` render; `Slider`, `Sheet`, `CarouselButtons` and
   `ShareButton` enhance. The Carousel is a server component and the client part is its
   two buttons, so that part has a name and the count of four is a count of files. 0.1's
   `NodeView`, `Trail` and `Thumbnails` go.
3. **The client components are leaves.** They import no server module, compute no
   neighbourhood, fetch no Node and read no Tree; `Slider` receives its positions as
   props. That is what keeps the bundle small and what makes
   `ADR-38-without-javascript.md` statable.
4. **One overlay concept.** `Sheet` serves the enlarged Image, the full Trail, the
   collapsed Options and the collapsed Sources of `application.md` 10.5 -- four uses, one
   set of focus and Escape rules instead of four.
5. **`src/tree/` still imports nothing from the rest of the application**, and
   `neighbourhood` is the only module that calls `getNode` more than once, which is where
   the bound lives.
6. **Browser tests are in the contract**: `npm run test:browser` joins the CI command,
   and `no-scroll.spec.ts`, `transition.spec.ts`, `theme.spec.ts` and `no-js.spec.ts`
   join the 0.1 specs that already existed outside it.
7. **The dividing line is stated so nobody has to guess:** a claim about *markup* is a
   unit test; a claim about *layout, motion or network* needs a browser.
   `application.md` section 7 lists every file on both sides of it.
8. **One new fixture, `tests/fixtures/full-node/`**: a Node at every maximum the format
   allows at once -- 80-character title, 600-character eight-line description, 3 Sources,
   8 Options, 10 Images -- reached by a 49-entry Trail. If it fits, every valid Tree
   fits.
9. **The interoperability test grows two cases**: a Tree with a Theme and a Tree without
   one, and each part of a Theme alone. Whether every Node kind *fits* is delegated to
   `no-scroll.spec.ts` over the same fixtures, because fitting is a layout fact.
10. **`stylesheet.test.ts`** asserts that `globals.css` holds no colour literal and no
    `font-family` literal. Core document section 9's "the frontend must never carry a
    lab's branding in its code" becomes a test rather than a habit.

## Alternatives rejected

- **Putting the neighbourhood behind the loader, as `getNeighbours(id)`.** It is where
  the Nodes come from, and it would save a module. Rejected: `ADR-5-lazy-loading.md`'s
  reason for a four-member interface was that every extra member is a way for a page to
  read more than one Node, and this one would be exactly that, with the screen's
  directions -- `up`, `down`, `side` -- pushed into a module that must not know a screen
  exists. The bound belongs above the seam, not behind it.
- **A `src/view/` sub-tree, or one module per concept (`bubble.ts`, `branch.ts`,
  `trail.ts`, `carousel.ts`).** Tidy-looking and directly against the core document's
  "not many files": those would be shallow modules whose interfaces are as large as their
  bodies. They are components already.
- **Letting each component read the Theme it needs.** Fewer props to thread. It would
  scatter the escaping of untrusted author text across the view, and there would be no
  single place for `theme.test.ts` to point at.
- **Keeping browser tests out of the contract and asserting the no-scroll rule some other
  way** -- a jsdom layout, a character-count assertion, a screenshot compared by eye.
  jsdom does not lay out; a character count is the format's job and does not know about
  the Trail or the Carousel; a screenshot review is not a test. There is no other way.
- **Running the browser tests only on a nightly job, to keep CI fast.** The three
  contracts they protect are the three easiest to break by accident in a stylesheet
  change, which is precisely the change that gets merged without a second look.

## Consequences

- Two files appear in `src/`, three disappear from `src/components/`, and four are added
  there: the file count is roughly where 0.1 left it, which is what the core document
  asked for.
- CI is slower and the pull-request command is now
  `npm ci && npm test && npm run build && npm run test:browser`.
- `ADR-5-repository-layout.md` and `ADR-5-testing-approach.md` keep their records and
  carry an "Amended by" line to here.
- Issue #39 changes the loader by one member; #40, #41, #42 and #43 each own a named set
  of files and a named set of tests, and none of them has to decide where a new idea
  lives.
