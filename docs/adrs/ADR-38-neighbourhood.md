# ADR-38-neighbourhood: a page carries the current Node and at most sixteen neighbours, rendered into its own payload, so that a slide needs no network and no response ever approaches the whole Tree

- Status: ACCEPTED (frozen) -- 2026-09-10
- Superseded in part by `ADR-78-overlay.md` (the `side` direction, decisions 1 and 3), `ADR-78-answer-buttons-and-up-arrow.md` (two `up` becomes one), `ADR-78-fan-out-and-option-picture.md` (decisions 7 and 8: the Option picture) -- 2026-09-17 (issue #78). The rest stands as the 0.2 record.
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
   **Amended 2026-09-14 (#42, PR #57, by the owner):** the server renders the neighbours
   into the page as the tree layer's payload; they enter the DOM only during a slide. At
   rest, and without JavaScript, the DOM holds the centre Bubble only. The rejected
   alternative below still stands: the neighbours are rendered by the server, not by a
   second renderer in the client.
   **Amended 2026-09-15 (#60, by the owner's decision of 2026-09-14,
   <https://github.com/IdseVal/ELSA-Decisiontree/issues/60#issuecomment-5670372885>):** a
   neighbour frame is the tree view's layout, trimmed. Its Trail keeps exactly the Trail
   Branches `application.md` 10.2 draws at the guaranteed viewport -- `start` and the last
   four -- and the collapsed control, and it drops the Trail Sheet's list. Every narrower
   step of 10.5 shows a subset of those entries, so the frame looks the same as the page
   that replaces it at every size, and nothing jumps at the handover. The frame is inert
   and `aria-hidden`, so nobody could open the list, and the arriving page carries the whole
   Trail once its payload lands. The centre frame is unchanged.
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
- **Accepting a neighbour frame that repeats the whole Trail** (#60, 2026-09-14). It is
  the simplest reading of "a frame of the same layout", and it costs 720 kB of HTML at the
  format's maxima for list entries no one can open mid-slide. The owner chose the trim of
  decision 4 instead.

## Consequences

- `ADR-5-lazy-loading.md`'s central sentence is gone and this is where the reader is
  sent; the rest of that file is left as the exact 0.1 record.
- A response is bigger: about 40 kB of HTML at the format's maxima, against about 3 kB in
  0.1. The core document accepts this trade in as many words -- "prefer slightly more
  network traffic over a clunky app" (3.2).
  **Amended 2026-09-14 (#42, PR #57), measured** with `curl` against the standalone
  server as built. "HTML" is the page without `Accept-Encoding`, then with gzip; "payload"
  is a client navigation's response (`RSC: 1`), which is what a slide costs.

  | page | Nodes | HTML | HTML gzip | payload | payload gzip |
  |---|---|---|---|---|---|
  | full Node, 49-entry Trail | 11 | 719,703 | 22,344 | 606,054 | 53,554 |
  | `applies` (Terminal), 49-entry Trail | 2 | 169,395 | 8,567 | 122,744 | 13,117 |
  | example: `start` | 5 | 41,268 | 7,256 | 29,674 | 8,756 |
  | example: `prohibited-practices` | 6 | 48,342 | 7,593 | 35,323 | 10,095 |
  | example: `social-scoring` | 3 | 34,563 | 6,918 | 23,539 | 7,496 |

  On the example Tree the estimate holds. At the format's maxima it is about eighteen
  times too low. The cause is not the Node count, which holds at 11 of 17. It is that
  every neighbour frame is a full frame of the tree view: at a 49-entry Trail, each one
  draws 49 Trail Branches and a 49-link Trail Sheet, and every `href` in them carries up
  to 50 path segments. With a single neighbour, `applies` is already 169 kB. The lever is
  a neighbour frame that does not repeat the Trail Sheet's list, since the frame is inert
  mid-slide. That changes what 11.3 says a neighbour is, so it is issue #60, not a quiet
  fix. The lever is sharpest where the Options have collapsed into their Sheet (10.5 step
  4, 11.1). The side slide does not exist there, but the page still carries every Option's
  frame, which is eight at the full Node.
  **Amended 2026-09-15 (#60), re-measured** the same way, on the build that trims each
  neighbour frame's Trail (decision 4, amended). "Before" is `dev` at `b2508ff`, which
  had grown since the table above; "after" is the trim.

  | page | Nodes | HTML before | HTML after | HTML gzip after | payload before | payload after | payload gzip after |
  |---|---|---|---|---|---|---|---|
  | full Node, 49-entry Trail | 11 | 751,718 | 269,300 | 14,049 | 621,885 | 176,473 | 23,821 |
  | `applies` (Terminal), 49-entry Trail | 2 | 169,701 | 122,956 | 7,529 | 122,992 | 79,859 | 10,052 |
  | example: `start` | 5 | 41,333 | 40,696 | 7,245 | 29,709 | 29,117 | 8,725 |
  | example: `prohibited-practices` | 6 | 51,844 | 50,944 | 8,192 | 37,105 | 36,269 | 10,711 |
  | example: `social-scoring` | 3 | 34,589 | 34,489 | 6,925 | 23,539 | 23,447 | 7,498 |

  The full Node's page is about a third of what it was, and a slide to it costs 24 kB
  gzipped instead of 56. What is left at a 49-entry Trail is mostly the centre frame's own
  Trail: 49 Branches and a 49-link Trail Sheet, which a reader uses, written once into the
  document and once more into the framework's inline payload. The example Tree's short
  Trails lose little, because a Trail of five or fewer is already all kept. The Option
  frames the collapsed Options cannot slide to (11.1) are still placed, each now trimmed.
- A navigation costs one request and no image request for any Node but the one arriving.
  A reader who walks a thousand-Node Tree end to end still never receives it.
- Issue #42 builds against a number it can assert, and issue #39 changes the loader by
  one member.
- The one visible cost of decision 7: a Node's pictures appear a frame after its Bubble
  arrives. That is the price of the core document's absolute rule about images, and it
  is the right way round.
