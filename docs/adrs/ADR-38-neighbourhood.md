# ADR-38-neighbourhood: a page carries the current Node and at most sixteen neighbours, rendered into its own payload, so that a slide needs no network and no response ever approaches the whole Tree

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #38 -- Architecture: freeze the version 0.2 application contracts
- Spec: `docs/specs/application.md`, sections 5 and 11
- **Supersedes `docs/adrs/ADR-5-lazy-loading.md`** (2026-09-03), whose "never reading a
  second Node to render a page" this replaces. The rest of that ADR's record stands as
  the 0.1 account.
- Core document: 3.1, section 9

## Context

Two things changed under the 0.1 lazy-loading contract at once.

`elsa-tree/2` (issue #37) puts a whole Tree in one file, parsed and held in memory at
server start (`tree-format.md` section 6). "A request reads one Node file" is no longer a
meaningful bound: there are no Node files, and reading the current Node costs an index
lookup.

The owner (#35) asked for smooth transitions and suggested the mechanism: "this might
mean we want to already render the next two nodes in each direction of the screen (still
lazy loading), but then if someone clicks through, the navigation feels smooth." The core
document (3.1, 9, revised) allows a **bounded set of neighbouring Nodes**, never the
whole Tree, and keeps images to the Node on screen.

So the property that protects the reader has to be restated. It was "one file per page";
it must become a number.

## Decision

1. **The bound is sixteen neighbours, seventeen Nodes in a response.**
   `src/neighbourhood.ts` computes the set: `up` the last two Trail entries; `down` the
   Answer targets and their Answer targets (2 + 4); `side` the Option targets (up to 8).
   Deduplicated by id; a Link to an id the Tree does not contain is dropped rather than
   thrown, because the loader has already rejected such a Tree at start-up.
2. **Sixteen is a contract, not a configuration.** No environment variable and no prop
   raises it. It is the number that stands between this application and "the browser
   received the whole Tree", so widening it is an `architecture` issue.
3. **"The next two in each direction" is read as directions of the screen**, which is
   what `ADR-38-tree-view.md` made the Link kinds mean: two up the Trail, two deep down
   the answer path, one out along each Option. Options stop at one hop because they fan
   -- eight by eight is sixty-four -- and because an Option leads to an explanation Node
   whose only way on is back to the Node the reader just left, which is still in hand.
4. **The neighbours travel in the page's own payload.** The server renders them as
   Bubbles in their positions in the tree layer, `aria-hidden` and out of the tab order.
   No second route, no JSON API, no fetch on load. It costs no I/O, because the Tree is
   already parsed in memory.
5. **The loader's interface does not widen to serve this.** `neighbourhood` calls
   `getNode` once per id. The rule becomes: a page may call `getNode` at most seventeen
   times. `getTree`, `listNodes` and `getChildren` still do not exist.
   `themePath` is the only member added in 0.2, and it is the theme route's, not this
   one's (`ADR-38-theme-delivery.md`).
6. **Framework prefetching of Branch links is off** (`prefetch={false}`). The neighbours
   are already in the page; letting the framework prefetch ten Branch pages, each with
   its own sixteen neighbours, is the one way this design could quietly become a Tree
   download.
7. **No neighbour Bubble contains an image URL** -- no `src`, no `srcset`, no `data-`
   attribute. A browser cannot request what is not written down, whatever a lazy-loading
   heuristic decides. A target's images arrive with its page payload, a frame after the
   slide.
8. **The accounting is a table in `application.md` 11.5** and a browser test,
   `transition.spec.ts`, that records every request: one payload per navigation, at most
   seventeen Nodes in it, no image of an off-centre Node, no request for the Tree, no
   request to another origin.

## Alternatives rejected

- **A JSON API, `GET /api/node/<id>` or `/neighbours`, fetched by the client.**
  `ADR-5-lazy-loading.md` rejected the shape for 0.1 and the reasons survive: a route to
  version, a second serialisation of a Node, and a first paint that depends on a second
  request. It gains nothing here, because the server can put the neighbours in the page
  it is already rendering.
- **Prefetching the neighbours' *pages* with the framework's `<Link prefetch>`.** The
  cheapest thing to write -- delete `prefetch={false}` -- and the most dangerous. Each
  prefetched page carries its own neighbourhood, so ten visible Branches pull about 170
  Node renderings for one screen. It is also the wrong unit: a prefetched page cannot be
  *drawn* in position before the click, which is what makes the slide smooth.
- **No pre-rendering at all: slide to a placeholder and fill it when the payload lands.**
  Honest and much simpler, and on a local server it would usually look fine. Rejected
  because the owner asked for the neighbours by name, and because "usually fine" is a
  property of the reviewer's network rather than the reader's.
- **Two hops in every direction, including through Options (up to 72 Nodes).** The most
  literal reading of "the next two nodes in each direction". Rejected: it is four times
  the payload to make instant a second click that is rare (from an explanation Node the
  overwhelmingly likely next move is back), and 72 Nodes of a 61-Node Tree is no longer
  a bound in any useful sense.
- **A depth or count read from configuration.** Makes the guarantee a deployment
  question, so the core document's "never the whole Tree" would depend on an environment
  variable nobody reviews. A number in a spec can be tested; a variable can only be
  audited.
- **Sending the neighbours as data and rendering them on the client.** Smaller payload,
  and it would move Bubble rendering into the client bundle -- which is exactly what
  `ADR-38-without-javascript.md` forbids, and it would duplicate the Bubble in two
  renderers.

## Consequences

- `ADR-5-lazy-loading.md`'s central sentence is gone and this is where the reader is
  sent; the rest of that file is left as the exact 0.1 record.
- A response is bigger: about 40 kB of HTML at the format's maxima, against about 3 kB in
  0.1. The core document accepts this trade in as many words -- "prefer slightly more
  network traffic over a clunky app" (3.2).
- A navigation costs one request and no image request for any Node but the one arriving.
  A reader who walks a thousand-Node Tree end to end still never receives it.
- Issue #42 builds against a number it can assert, and issue #39 changes the loader by
  one member.
- The one visible cost of decision 7: a Node's pictures appear a frame after its Bubble
  arrives. That is the price of the core document's absolute rule about images, and it
  is the right way round.
