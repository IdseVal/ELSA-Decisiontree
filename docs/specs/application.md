# Application contracts

> Status: FROZEN -- 2026-09-10 (issue #38), version 0.2. These are the contracts the
> build issues (#39 loader, #40 theme, #41 tree view, #42 transitions, #43 carousel) are
> built against. Changing one requires a new `architecture` issue. The Tree file format
> they consume is frozen separately in `docs/specs/tree-format.md` (`elsa-tree/3`, issue
> #78; `elsa-tree/2` was issue #37).
>
> **Re-frozen for the display changes of #75 -- 2026-09-17 (issue #78).** The owner saw
> version 0.2 running and changed the presentation again (`docs/CORE_DOCUMENT.md`, revised
> 2026-09-17, sections 3.1, 3.2, 5, 9, 10; `docs/adrs/ADR-75-presentation-changes.md`).
> Sections 10 to 14 are rewritten in place for it; the decisions are one per file in
> `docs/adrs/ADR-78-*.md` (section 9), and the 0.2 record stays in `ADR-38-*.md` and
> `ADR-37-*.md`, each marked superseded in part. What changed, section by section:
>
> | Section | #78 |
> |---|---|
> | 3 | Chrome gains `up` and loses `trail`, `start`, `trailMore`, `back`, `explanationOnly`; `sources` says "Legal sources" (3.2). |
> | 4 | **Unchanged**, by the owner's instruction: the URL scheme, the Trail in the path, the share link, `?lang`. 10.9 says what the URL of an explanation Node renders. |
> | 5 | The types follow `elsa-tree/3` (5.1): a Node carries `explainers`, an Option has no `images`. What a page sends gains the Option targets' main images and an opened Overlay's pictures (5.2, 11.5). |
> | 6 | `CarouselButtons.tsx` goes and `Explainer.tsx` comes; `Bubble.tsx` exports the Interior the Overlay shares; `neighbourhood.ts` returns placements and asides. |
> | 7 | The no-scroll test runs with every Overlay and every explainer panel open; the transition test asserts the new accounting; the Trail tests are rewritten for the up arrow. |
> | 8, 9 | Rebuilt for the #75 rows and the `ADR-78-*` decisions. |
> | 10 | The rows at 1280 x 640 (the Trail row gone, the Bubble 760 x 446, the strip on its lower outline, the Answer row 68); the up arrow; the Interior with the main image and the Sources heading; five situations; a new degradation order; the limits confirmed with two pixels to spare; the explainer panel (10.8) and the Overlay (10.9). |
> | 11 | No `side` direction and no side slide; `up` is the parent only; the Option targets are asides; a page reads at most 17 Nodes still; 11.5 allows one file per Option and an open Overlay's pictures. |
> | 12 | Pictures only: no buttons, no caption; the credit in the enlarged view and as the picture's accessible description; the strip straddles the Bubble's lower outline. |
> | 13 | 13.1: `accent-secondary` paints the walk's controls and `--elsa-on-accent-secondary` their labels; nothing else. |
> | 14 | Rows for the up arrow, the Overlay, the explainer panel and the credit without JavaScript; the Trail Sheet and the Carousel's buttons are gone. |
>
> **Amended 2026-09-19 by issue #100** (`docs/adrs/ADR-100-bounded-centre.md`,
> `docs/adrs/ADR-100-overlay-without-strip.md`), where the build of #80 (PR #99) departed
> from 10.9 for reasons the Reviewer found forced or measured. Two sentences move: 10.9's
> centre of a path is found by reading at most the path's last three entries, so that
> the seventeen Nodes of 11.2 hold for every path (10.9, and the row of 10.3 it names);
> and an Overlay has no strip, because its panel has no room for one (10.9's
> pre-rendering bullet, 11.4's last paragraph). Every other contract, 11.5's rows
> included, is unchanged.
>
> **How to read this document.** Sections 1 to 4 are the 0.1 contracts the owner kept
> (framework, Tree selection, chrome languages, the URL scheme); they carry small
> amendments, marked. Sections 5 to 9 keep their numbers and are rewritten in place --
> the numbers are load-bearing, because source files and tests cite them (`5.1` the
> loader seam, `5.3` the image route, `5.4` startup, `6` modules, `7` testing). The new
> 0.2 contracts are **sections 10 to 14**: the tree view, transitions and neighbours, the
> Carousel, the Theme, and what holds without JavaScript. Section 9 indexes every
> decision, old and new.
>
> Version 0.1, and the contracts it was built against, are preserved on branch
> `version-0.1`; nothing here rewrites that record.
>
> Originally frozen 2026-09-03 (issue #5). The amendments below were made to that
> version and still hold except where a section says otherwise.
>
> Amended 2026-09-08 by issue #11 (deployment,
> `docs/adrs/ADR-11-public-base-url.md`): section 1 gains one configuration variable,
> `ELSA_BASE_URL`, the public origin a deployment is reached at, and **4.1's canonical
> bullet changes with it**. `<link rel="canonical">` is no longer always the path
> `/<tree-id>/<id-n>`: a deployment that sets the variable makes it the absolute URL of
> that same page on that origin, and one that does not gets the path as before. It is the
> only contract of section 4 that moves -- the public URL scheme, the Trail, the share
> link, every other link the app emits and every answer of 4.3 are what they were.
> `docs/deployment.md` is the procedure.
>
> Amended 2026-09-04 by issue #19 (`docs/adrs/ADR-19-content-language-in-the-route.md`):
> sections 4.1, 4.3, 4.4, 6 and 7, plus a pointer in 3.1 whose rule is unchanged. The
> content language reaches `<html lang>` through a `[lang]` route segment that a rewrite
> fills from `?lang`. The public URL scheme of 4.1 and the answers of 4.3 are unchanged;
> what changed is how the application meets them.
>
> Amended 2026-09-05 by the owner, on PR #17: the 404 page's *body* may require
> JavaScript. Section 4.3's 404 row says what holds and why; the two rows of section 1
> it touches point at it. Nothing else in this document changed.
>
> Amended 2026-09-06 by the owner, on PR #29: 4.4's rewrite `source` excludes Next.js's
> own `/_next/` paths, because the framework does not exclude them itself and the rules as
> first written 404 every stylesheet and client chunk (measured twice, on 16.3.4). This is
> a correction to a measurement the mechanism rested on, not a new decision: every answer
> of 4.1, 4.3 and 4.4's table is unchanged. Section 7's list of test files gains
> `not-found.test.tsx`, which pins the 404 page's own language rule (4.3). Nothing else in
> this document changed.
>
> Amended 2026-09-06 by issue #27: section 1 gains one row, `agentRules: false`. It adds a
> setting; no contract already in this document changes.
>
> **Re-frozen for version 0.2 -- 2026-09-10 (issue #38).** The owner, in issue #35,
> changed the presentation: the screen must be a tree of Bubbles and Branches, moving
> between Nodes must slide, the page must never scroll, Images belong in a Carousel below
> the Bubble, and the look must travel with the Tree. `docs/CORE_DOCUMENT.md` sections
> 3.1, 3.2 and 9 were revised on 2026-09-09 to record it; `docs/adrs/ADR-35-version-0-2-rework.md`
> is the decision to rework. What that changed here, section by section:
>
> | Section | 0.2 |
> |---|---|
> | 1 | The row "Client-side JavaScript" is rewritten: four client components instead of two, and section 14 states exactly what holds without them. Every other row stands. |
> | 2 | `theme` joins `images` as a reserved Tree id (the new route of 5.5). |
> | 3 | Chrome gains the keys the Carousel, the Trail Sheet and the tree view need (3.2). |
> | 4 | `GET /theme/<file>` joins the URL grammar (4.1) and the reserved words (4.3). **The public URL scheme, the Trail in the path, the share link, `?lang` and the `[lang]` route of 4.4 are unchanged**, by the owner's instruction. |
> | 5 | Rewritten. `getNode` still returns one Node, but a page may now take up to seventeen of them from the loader's index (5.2, section 11). The seam gains one member, `themePath` (5.1). The image route gains security headers and the theme route is 5.5. `ADR-5-lazy-loading.md` is superseded by `ADR-38-neighbourhood.md`. |
> | 6 | Rewritten: the components of the tree view, the two new modules `src/theme.ts` and `src/neighbourhood.ts`, and the dependency direction for the client code. |
> | 7 | Rewritten: browser tests are **in** the contract now, because the no-scroll rule cannot be asserted without one. |
> | 8 | Rebuilt: rows for the page never scrolling, the Theme from the Tree, the Carousel, the bounded neighbourhood, one file per Tree. |
> | 9 | Extended with the eight `ADR-38-*` decisions. |
> | 10 to 14 | New. |
>
> Vocabulary: the canonical names from `docs/CORE_DOCUMENT.md` section 5 -- **Tree**,
> **Node**, **Link**, **Answer**, **Option**, **Terminal**, **Image**, **Source**,
> **Trail** -- are used with exactly that meaning. **Chrome** is the interface text the
> frontend owns (labels, buttons, disclaimer), as opposed to Tree content. The decisions
> behind this document are recorded one per file in `docs/adrs/ADR-5-*.md` (section 9).

## 0. In one paragraph

A Next.js application, rendered on the server, runs as one Node.js process on a plain
Linux server and serves exactly one Tree, named by the environment variable
`ELSA_TREE`. The whole application state is the URL: the path is the Trail ending in
the current Node, the query carries the language. A request takes the current Node and
a bounded neighbourhood around it -- at most seventeen Nodes, never the Tree -- from
the loader's in-memory index and returns complete HTML: the current Node as a round
**Bubble** in the centre of a screen-sized tree -- its main image above its title, its
description with its explainers, its Sources under a heading -- one **up arrow** on its
top outline that goes a step back, its Answer targets as two alike buttons below, its
Option targets as buttons fanned out beside it that open their side child in an
**Overlay**, and its further Images as a strip of pictures on its lower outline
(**[#75]**). Following the arrow or an Answer slides the tree until the target Bubble
is in the centre, and ends at exactly the URL a plain link would have reached. The page never scrolls. Colours, fonts and the logo come from the loaded
Tree's Theme and are served from that Tree's folder, so no request ever leaves this
origin. Chrome comes in English and Dutch and follows the content language, falling
back to English. There is no database, no account, no cookie, no analytics, and nothing
the app does depends on a hosting vendor.

## 1. Framework and rendering

| Item | Contract |
|---|---|
| Framework | Next.js, App Router, React, TypeScript (strict). Exact versions are pinned in `package.json` by the scaffold issue; the current stable major at that time. |
| Server-side rendering | React Server Components. The Node page is an `async` server component; the first response to every URL is complete HTML, with the single exception named in 4.3 (the 404 page). |
| Client-side JavaScript | React plus **four** client components: `Slider` (the slide transition and the pre-rendered neighbours, section 11), `Sheet` (the one overlay: the Overlay of an Option, 10.9; the enlarged Image, 12.3; and the collapsed Options and Sources of 10.5), `Explainer` (the explainer panel's placement, Escape and tap, 10.8) and `ShareButton`. **[#75]** `CarouselButtons` is gone with #78 (the strip has no buttons, 12.2; the Carousel is a server component), and the interim `Thumbnails` of #41 was removed by #43 (section 6). Everything else -- navigation, the up arrow, the Answer buttons, the Option buttons as disclosures, the marked terms, the language switch, the Carousel's strip -- is links, CSS and ordinary form-free markup. **Section 14 states exactly what a reader without JavaScript gets**, and it is a working application, not a degraded one. The 404 page's body is the single exception (4.3). |
| Runtime | Node.js 22 (LTS), in `.nvmrc` and `package.json` `engines`. |
| Package manager | npm; `package-lock.json` committed; `npm ci` in CI and deployment. |
| Build output | `output: 'standalone'`: `next build` yields a folder that runs with `node server.js`. |
| Configuration | Environment variables only: `PORT`, `HOSTNAME` (Next.js), `ELSA_TREE`, `ELSA_TREES_DIR` (section 2), `ELSA_BASE_URL` (the public origin; a bare `http`/`https` origin or the server refuses to start), `NEXT_TELEMETRY_DISABLED=1`. |
| Vendor neutrality | No edge runtime, no Incremental Static Regeneration, no hosted image optimisation, no fonts or scripts fetched from third parties at run time. Anything fetched at build time is vendored into the repository. |
| Headers | `poweredByHeader: false`. The app sets no cookie, ever. |
| Repository root | `agentRules: false`: `next dev` does not scaffold `AGENTS.md` and `CLAUDE.md`. The root `CLAUDE.md` is the project instructions the agents in `.orca/` read, not build output. |
| Deployment | A systemd unit running `node server.js` behind a reverse proxy for TLS, or the repository's `Dockerfile`. The app does not know the proxy exists. `docs/deployment.md` (issue #11). |

Recorded in `docs/adrs/ADR-5-framework-and-rendering.md`.

## 2. Tree selection (decides core document 10.19)

- One deployment serves **exactly one Tree**.
- `ELSA_TREE` = the Tree id, i.e. the folder name under `ELSA_TREES_DIR`.
  `ELSA_TREES_DIR` defaults to `trees` under the working directory.
- **No default.** The server refuses to start, with a message listing the Tree ids it
  found, when `ELSA_TREE` is unset, names a missing folder, names a reserved word
  (section 4.3: `images` and, new in 0.2, `theme`), or names a Tree that fails
  validation.
- `.env.development` in the repository sets `ELSA_TREE=ai-act-example`; Next.js reads
  it only in `next dev`. Production sets the variable in the process environment.
- The Tree id is part of every Node URL (section 4). A URL naming any other Tree id
  answers 404.

Recorded in `docs/adrs/ADR-5-tree-selection.md`.

## 3. Chrome languages and fallback (decides core document 10.20)

### 3.1 Rule

- Chrome ships in **English** (`en`) and **Dutch** (`nl`).
- Strings live in `src/chrome.ts` as a record keyed by language, typed so that a key
  missing from either language is a compile error. No translation library.
- **Chrome follows the content language** when the content language's primary subtag
  (`nl-be` gives `nl`) is a chrome language; **otherwise chrome is English.** The
  content language is never changed by this rule.
- `<html lang>` is the content language; chrome elements in another language carry
  their own `lang` attribute. How the root layout learns the content language is 4.4;
  the one page that cannot follow it, the 404 page, is 4.3.

| Tree languages | User picks | Content | Chrome |
|---|---|---|---|
| `[en, nl]` | `nl` | Dutch | Dutch |
| `[nl]` | (only) | Dutch | Dutch |
| `[de, fr]` | `de` | German | English |
| `[de, nl]` | `de` | German | English |
| `[pt-br]` | (only) | Portuguese | English |

### 3.2 Chrome keys

The keys below exist in both languages from the first build issue on. The UI issue may
add keys; every key exists in both languages or the build fails.

| Key | Used for |
|---|---|
| `yes`, `no` | The two Answer Branches below the Bubble (10.3). |
| `options` | The accessible name of the group of Option Branches beside the Bubble. |
| `sources`, `sourceCaseLaw`, `sourceLiterature` | The heading over the Sources -- **[#75]** "Legal sources" / "Juridische bronnen" -- and the two kind labels still shown beside an entry (10.3). `sourceLegal` is gone: under that heading it repeated it. |
| `images`, `enlarge`, `close` | The Carousel strip's accessible name, the name of every picture's link, and the close cross of every Sheet, the Overlay included (sections 10.9, 12). |
| ~~`trail`, `start`~~ | **[#75]** Gone with the drawn Trail (10.2). |
| `share`, `copied` | The share button and its confirmation. |
| `language` | Label of the language switch. |
| `outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited`, `outcomeRefer` | Badge text for the four Terminal outcomes. |
| ~~`explanationOnly`~~ | **[#75]** Gone with the `back` Branch: an explanation Node opens in an Overlay (10.9). |
| `disclaimer` | The permanent "not legal advice" footer. |
| `notFoundTitle`, `notFoundText` | The 404 page. |
| ~~**`back`**~~ | **[#75]** Gone: the way back is the up arrow, `up` below (10.2). |
| **`startAgain`** | The one button below a Terminal, and below an explanation Node shown as the centre, which returns to the root Node with an empty Trail (10.3). |
| ~~**`trailMore`**~~ | **[#75]** Gone with the Trail Sheet (10.2). |
| **`previous`**, **`next`** | The two buttons of a paged Sheet: the enlarged view's pages (12.3). **[#75]** The Carousel strip has no buttons. |
| **`imageCount`** | The enlarged view's position, "Image 3 of 7", and the label of the collapsed strip's control (10.5, 12.3). |
| **`minimumSize`** | The notice shown at and below the floor (10.4, 10.5 step 8): the sentence that says the window is too small. |
| **`minimumWidth`**, **`minimumHeight`** | The notice's second sentence, one per dimension: the stylesheet shows the one for the dimension that is short, both at the floor's corner, so a 1280 x 480 window is told to grow taller (#41, PR #56). |
| **`up`** | **[#75]** The up arrow's accessible name: takes the parent's title -- "Back to: <title>" (10.2). |

New in 0.2: `back`, `startAgain`, `trailMore`, `previous`, `next`, `imageCount`,
`minimumSize`, `minimumWidth`, `minimumHeight`. **[#75]** New in #78: `up`; gone: `trail`,
`start`, `trailMore`, `back`, `explanationOnly`, `sourceLegal`. Keys that take a value (`up`, `imageCount`) are functions of that
value in `src/chrome.ts`, not strings with a placeholder, so that a language which
orders the sentence differently is not forced into English word order.

Recorded in `docs/adrs/ADR-5-chrome-languages.md`.

## 4. URL scheme

### 4.1 Grammar

```
Node page   /<tree-id>/<id-1>/<id-2>/.../<id-n>[?lang=<tag>]      1 <= n <= 50
Image       /images/<file>
Theme file  /theme/<file>                                        [v0.2]
Redirects   /            ->  /<tree-id>/<root-id>[?lang=...]      307
            /<tree-id>   ->  /<tree-id>/<root-id>[?lang=...]      307
```

- **[v0.2]** `/theme/<file>` serves one file of the served Tree's Theme -- a logo, an
  icon or a font (5.5). It is the exact analogue of `/images/<file>`, including its
  path-safety rule, and it is why `theme` is a reserved Tree id (4.3). Nothing else
  about this grammar changed in 0.2: the Node page, the Trail in the path, the share
  link and `?lang` are what they were.

- `<id-n>` (the last id) is the Node shown. `<id-1>` .. `<id-n-1>` are the **Trail**,
  in the order visited. Every id follows the id grammar of `tree-format.md` 3.1.
- **The URL of a Node** is the page with an empty Trail: `/<tree-id>/<node-id>`.
- **The share link is the page's own URL.** The share button copies it to the
  clipboard; without JavaScript the address bar is the share link.
- `lang` is one of the Tree's declared languages. Absent means the Tree's default
  language; the app omits it for the default language. **Any value the Tree does not
  declare is ignored and the default language is used** -- whether it is a language tag
  (`de`, `pt-BR`) or not a language tag at all (`../../etc/passwd`, `<script>`, an empty
  `?lang=`). No value of `lang` changes which page is served or what its status is.
- A **well-formed** language tag is `[a-zA-Z]{2,8}(-[a-zA-Z0-9]{1,8})*`. The distinction
  is not visible in this section's answers; it exists because only a well-formed tag is
  allowed to become a route segment inside the server (4.4).
- When `lang` appears more than once in one URL the **last** occurrence is the one that
  counts, and the rest of this bullet list applies to it. Measured, not assumed: the rows
  are in `ADR-19-content-language-in-the-route.md`. No link the application emits ever
  repeats `lang`.
- Other query parameters are ignored. No trailing slash (the framework redirects).
- Clicking Trail entry `k` links to `/<tree-id>/<id-1>/.../<id-k>` with the same
  `lang`: the Trail after it is discarded (core document 10.17).
- Every Node page carries `<link rel="canonical">` to `/<tree-id>/<id-n>` (with `lang`
  when not the default). A deployment that sets `ELSA_BASE_URL` (section 1) makes that
  link the absolute URL of the same page; without it the link is the path. Recorded in
  `docs/adrs/ADR-11-public-base-url.md`.

### 4.2 Worked examples

Host `example.org` is a placeholder; `ai-act-agrifood` stands for the first Tree's id,
which is fixed when that Tree is authored.

```
The URL of the Node `prohibited-practices`, default language:
  https://example.org/ai-act-agrifood/prohibited-practices

A share link: the user started at `start`, answered yes to reach `prohibited-practices`,
opened the Option `social-scoring`, in Dutch:
  https://example.org/ai-act-agrifood/start/prohibited-practices/social-scoring?lang=nl

Trail entries on that page link to:
  start                  https://example.org/ai-act-agrifood/start?lang=nl
  prohibited-practices   https://example.org/ai-act-agrifood/start/prohibited-practices?lang=nl

Answering yes on `prohibited-practices` (Answer target `prohibited`) links to:
  https://example.org/ai-act-agrifood/start/prohibited-practices/prohibited?lang=nl

The first Image of `start`:
  https://example.org/images/eu-map.png
```

### 4.3 Limits, reserved words, errors

| Case | Behaviour |
|---|---|
| Maximum Trail length | 50 ids in the path (49 Trail entries plus the current Node). When the app would build a longer link, it drops the oldest Trail entries. Worst case about 3.3 kB of path, within default proxy limits. |
| More than 50 ids in a request | 404. |
| Tree id in the path is not the served Tree | 404. |
| An id is malformed (not the id grammar) | 404. Nothing is looked up on disk for it. |
| An id is well-formed but not a Node of the Tree | 404. |
| Trail adjacency | Not checked: any sequence of existing Node ids is accepted. |
| `lang` not declared by the Tree | Ignored; default language used; 200. This holds for every value, including one that is not a language tag at all: 4.4 keeps such a value out of the route rather than answering an error for it. |
| Image name malformed or not in the Tree's `images/` | 404. |
| **[v0.2]** Theme file name malformed or not in the Tree's `theme/` | 404, by the same rule and the same code path as an image (5.5). |
| **[v0.2]** A theme file that exists but the Theme does not name | 404. The route serves what the Theme references, not the folder: a licence text or a stray file next to the fonts is not public. |
| Reserved Tree ids | `images` and, **[v0.2]**, `theme`. A deployment with `ELSA_TREE` set to either refuses to start. |
| The 404 page | A small page in the chrome language (`notFoundTitle`, `notFoundText`) with a link to `/<tree-id>/<root-id>`, HTTP status 404. The status is always in the response; the **body** may require JavaScript -- see below. Next.js renders `not-found.tsx` without params, so it cannot know the content language; it therefore takes the chrome language 3.1 resolves from the **Tree's default** language, which is `en` or `nl` and never an arbitrary tag. Because the page renders inside the `[lang]` layout, `<html lang>` around it is the resolved content language of the request -- what `src/url.ts` makes of the segment (4.4): a language the Tree declares, or the Tree's default -- exactly as on every other page, in the document the reader ends up with (for this one page that is the painted document, see below). Every element this page renders carries the chrome language above as its own `lang`: that is 3.1's second half, and the reason each element's own `lang` is never a false statement about the text under it. |

**The 404 body may require JavaScript** (amended 2026-09-05, PR #17). Next.js answers a
`notFound()` raised inside a dynamically rendered route with its own error shell
(`<html id="__next_error__">`) plus the page as an RSC payload, so the 404 markup this
application renders on the server -- the row above, `<html lang>` included -- travels as
data and is painted by the client bundle. Given the choice between the honest status code
and a server-rendered body, the owner kept the status code: it is what crawlers, proxies
and link checkers read, and a reader without JavaScript who reaches a 404 has followed a
link that was already broken. Every other page keeps the section 1 guarantee in full. If a
later Next.js renders the boundary into the document, this exception goes away and the row
above stands alone; the browser test in `tests/browser/node-view.spec.ts` asserts the
current shape, so it fails on that day rather than passing quietly.

Two rules divide this work, and neither file needs to know the other's:

- **The router decides what may be a language at all.** A `lang` value that is not a
  well-formed tag never becomes a route segment; the request is routed exactly as if no
  language had been asked for (4.4). No such value reaches `src/`.
- **`src/url.ts` decides which language a segment means.** It receives a segment, never a
  query, and resolves it to a language the Tree declares or to the Tree's default. It has
  no branch for any particular segment value, so nothing about the router's spelling of
  "none asked for" is repeated here.

The path grammar is implemented once, in `src/url.ts`:

```ts
parseUrl(path: string, lang: string, tree: Tree): PageAddress | NotFound
interface PageAddress { treeId: string; trail: string[]; nodeId: string; lang: string }
nodeHref(a: PageAddress): string                   // the page for `a`
followHref(a: PageAddress, targetId: string): string  // push nodeId onto trail, go to target; drops oldest beyond 50
trailHref(a: PageAddress, index: number): string   // jump back to trail[index]
withLang(a: PageAddress, lang: string): string     // same page, other language
imageHref(file: string): string
canonicalHref(a: PageAddress): string
```

Recorded in `docs/adrs/ADR-5-url-scheme.md`, amended by
`docs/adrs/ADR-19-content-language-in-the-route.md`.

### 4.4 How the content language reaches `<html lang>`

Only the owner of the `<html>` element -- the root layout -- can set `lang`, and Next.js
does not give a layout `searchParams`. The query is therefore restated as a leading path
segment **inside** the server, before the file system is consulted. Nothing about the
public URL changes: a rewrite is invisible to the browser, so the address bar, the share
link and the canonical link all keep `?lang=`.

`next.config.ts` holds exactly two rules, and nothing else about routing:

```ts
const LANGUAGE_TAG = '[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*'   // 4.1, well-formed
const EVERY_PATH_BUT_NEXTS_OWN = '/:path((?!_next/).*)'      // see the bullet below

async rewrites() {
  return {
    beforeFiles: [
      // a well-formed ?lang  ->  /<tag>/...
      {
        source: EVERY_PATH_BUT_NEXTS_OWN,
        has: [{ type: 'query', key: 'lang', value: `(?<lang>${LANGUAGE_TAG})` }],
        destination: '/:lang/:path',
      },
      // anything else -- no `lang`, an empty one, or a value that is not a tag  ->  /_/...
      {
        source: EVERY_PATH_BUT_NEXTS_OWN,
        missing: [{ type: 'query', key: 'lang', value: LANGUAGE_TAG }],
        destination: '/_/:path',
      },
    ],
  }
}
```

- **The source excludes Next.js's own paths.** Next.js does **not** exclude them from
  `beforeFiles` rewrites (measured on 16.3.4): with a bare `'/:path*'` source,
  `/_next/static/<chunk>` takes the second rule, is rewritten to `/_/_next/static/<chunk>`
  and answers 404, so every stylesheet and client chunk is lost. The rule therefore takes
  every path except that one prefix; if the framework ever serves its own paths outside
  `/_next/`, the exclusion must be widened. A `/_next/` path is the one request neither rule
  rewrites, and the exhaustiveness of the pair below is over the paths they take. Nothing of
  this application is excluded with them -- a Tree id cannot begin with `_`
  (`tree-format.md` 3.1) -- and no row of the table below changes. The source is one named
  path parameter rather than a repeated one, which is why the destinations interpolate
  `:path` and not `:path*`.
- **The two rules are exhaustive and mutually exclusive.** They test the same grammar, and
  `missing` holds exactly when `has` does not, so every request is rewritten once and only
  once -- whether or not `beforeFiles` stops at the first rule it matches, which the
  documentation does not promise either way. There is no third case and no request that
  reaches the file system with its public path.
- **The whitelist is the safety property.** Only a well-formed language tag is ever copied
  into a path, so no value of `?lang` can introduce a path separator, a `..` traversal or
  markup into the route. The grammar is applied to the *decoded* value, so `%2e%2e%2f` is
  rejected for the same reason `../` is.
- **A value that is not a well-formed tag is ignored, not rejected.** It takes the second
  rule, which is the same route an absent `lang` takes, so the answer is the one 4.3
  already gives for a language the Tree does not declare: the default language, and the
  status the URL would have had anyway. This is why 4.3's table needed no new row, and it
  is what makes the rule statable at all: the language never decides the status.
- **`_` means "no language was asked for".** It is safe as a literal because an id is
  `[a-z0-9-]` (`tree-format.md` 3.1), so no Tree and no Node can be called `_`, and `_` is
  not a well-formed language tag, so no `?lang` value can produce it. It needs no special
  case: the ordinary rule of 4.3 -- a language the Tree does not declare means the Tree's
  default -- already resolves it. The literal is written in `next.config.ts` and nowhere
  else; `src/url.ts` has no branch for it (4.3). A reader who types the sentinel into the
  path anyway gets 404: `/_/<tree-id>/...` is rewritten to `/_/_/<tree-id>/...`, whose
  second segment is not the served Tree's id.
- **The language is resolved once,** by `src/url.ts`. The root layout, the Node page and
  its `generateMetadata` all take it from the `[lang]` segment; after the rewrite no server
  component reads the *language* from `searchParams` -- the one thing `searchParams` may
  never be used for (section 6). Two readers of the same URL cannot disagree about its
  language, which is what made a repeated `?lang=nl&lang=en` render an English document
  around Dutch content before this section existed.

| Public URL | Route the server matches | Answer |
|---|---|---|
| `/ai-act-example/start` | `/_/ai-act-example/start` | 200, the Tree's default |
| `/ai-act-example/start?lang=nl` | `/nl/ai-act-example/start` | 200, `<html lang="nl">` |
| `/ai-act-example/start?lang=de` (undeclared) | `/de/ai-act-example/start` | 200, the Tree's default |
| `/ai-act-example/start?lang=<script>` | `/_/ai-act-example/start` | 200, the Tree's default |
| `/ai-act-example/start?lang=nl&lang=en` | `/en/ai-act-example/start` | 200, `<html lang="en">` |
| `/images/eu-map.png` | `/_/images/eu-map.png` | 200, the image; no layout runs |
| `/images/eu-map.png?lang=nl` | `/nl/images/eu-map.png` | 200, the same image; the route ignores the segment |
| `/theme/open-sans-400.woff2` **[v0.2]** | `/_/theme/open-sans-400.woff2` | 200, the font; no layout runs. A theme file behaves exactly as an image does, in this table and in 4.3 |
| `/other-tree/start` | `/_/other-tree/start` | 404, as 4.3 says |
| `/other-tree/start?lang=<script>` | `/_/other-tree/start` | 404: the same answer, which is the rule |

Every row of that table, and the rest of 4.1 and 4.3, is measured on a restructured build
in `next dev` and in `node .next/standalone/server.js`; the two agree. The measurements are
in `docs/adrs/ADR-19-content-language-in-the-route.md`.

Recorded in `docs/adrs/ADR-19-content-language-in-the-route.md`.

## 5. The loader seam: what is read, what is sent

Rewritten for 0.2. `elsa-tree/2` puts a whole Tree in one file, read and validated once
at server start (`tree-format.md` section 6), so "read one file per page" is no longer
the thing that keeps a page small. What keeps it small is now a stated **bound on how
many Nodes a response may carry**, which is section 11. This section is the seam and
the routes; section 11 is the neighbourhood that uses them.

Recorded in `docs/adrs/ADR-38-neighbourhood.md`, which supersedes
`docs/adrs/ADR-5-lazy-loading.md`.

### 5.1 The seam: `src/tree/loader.ts`

The one interface between Tree data on disk and what a page renders. **`getNode`
returns one Node, never the Tree.** The interface gains exactly one member in 0.2,
`themePath`, the analogue of `imagePath` for the Theme's files; nothing else about it
changes, and nothing is added to let a caller enumerate the Tree.

```ts
export function openTree(dir: string): Promise<Tree>
// Reads and validates tree.yaml once (the rules of tree-format.md section 7).
// Rejects with TreeInvalid { treeId, violations: Violation[] } listing every failure
// with { file, keyPath, rule, message }. Builds the Node index and the title index.

export interface Tree {
  readonly id: string                          // the folder name
  readonly manifest: Manifest                  // languages, defaultLanguage, root, title, description, metadata, theme
  getNode(id: string): Promise<Node | null>    // ONE Node; null for a malformed or unknown id; never throws for bad input
  getTitle(id: string): LocalisedText | null   // from the in-memory index; for a Branch label
  imagePath(file: string): string | null       // absolute path inside this Tree's images/; null for a malformed or missing name
  themePath(file: string): string | null       // [v0.2] absolute path inside this Tree's theme/, and only for a file the Theme names
}
```

- **`themePath` resolves only what the Theme references.** A name that is not a theme
  file name (`tree-format.md` 3.6), or that the Tree's `theme` block does not name in
  `logo.light`, `logo.dark`, `logo.icon` or some `fonts[].files[].file`, is `null` --
  even when a file of that name sits in the folder. The format puts a font's licence
  text in `theme/` and says the loader ignores it (`tree-format.md` 4.3.2); serving
  the referenced set rather than the folder is that sentence made into a rule, and it
  means an author's stray file is never public. This is the one way `themePath` is
  stricter than `imagePath`.
- **Still not on the interface:** `listNodes`, `getChildren`, `getTree`, or anything
  that hands out more than one Node per call. Section 11 needs many Nodes; it asks for
  them one at a time, by id, and the bound on how many is a contract, not a parameter.

The types, in `src/tree/types.ts`, mirror `tree-format.md` with two normalisations:
`id` and `kind` are added, and absent lists become empty arrays.

```ts
type LocalisedText = Record<string, string>              // language tag -> text
interface Manifest { format: 'elsa-tree/3';           // [#75] elsa-tree/3 (issue #78) languages: string[]; defaultLanguage: string;
                     root: string; title: LocalisedText; description?: LocalisedText;
                     metadata: { version: string; [key: string]: unknown };
                     theme?: Theme }                     // [v0.2]
interface Theme { logo?: Logo; fonts?: FontFamily[]; colours?: Colours }   // [v0.2], tree-format.md 4.3
interface Logo   { light: string; dark?: string; icon?: string; alt: LocalisedText; url?: string }
interface FontFamily { family: string; role: 'body' | 'heading'; licence: string;
                       files: { file: string; weight: string; style: 'normal' | 'italic' }[] }
type ColourRole = 'background' | 'surface' | 'text' | 'text-muted' | 'accent' | 'accent-secondary' | 'danger'
type Colours = Record<ColourRole, string>                // each '#rrggbb', validated by the loader
interface Source { id?: string; kind: 'legal' | 'case-law' | 'literature'; label: LocalisedText; url: string }
interface Image  { file: string; description: LocalisedText; credit: string; source?: string }
interface Option { title: LocalisedText; target: string }   // [#75] no images of its own (tree-format.md 5.4)
interface Explainer { id: string; term: LocalisedText; text: LocalisedText }   // [#75] tree-format.md 5.9
type Outcome = 'not-applicable' | 'applicable' | 'prohibited' | 'refer'
type Node = {
  id: string; title: LocalisedText; description: LocalisedText;
  metadata: { version: string; [key: string]: unknown };
  sources: Source[]; images: Image[]; options: Option[]; explainers: Explainer[]   // [#75]
} & (
  | { kind: 'question'; answers: { yes: string; no: string } }
  | { kind: 'terminal'; outcome: Outcome }
  | { kind: 'explanation' }
)
```

Behind the interface, invisible to callers: the YAML 1.2 stream parser, every validity
rule, the length and line rules, path-safety checks, the Node and title indexes, and
the parsed Tree held in memory.

### 5.2 When what is read and sent

| Moment | Server reads | Browser receives |
|---|---|---|
| Server start | `tree.yaml` once, to validate and to build the Node and title indexes. Failure: every violation printed, exit code 1, nothing served. | -- |
| A request for a Node page | Nothing from disk. The current Node and its neighbourhood -- **at most 17 Nodes** (section 11) -- from the index, and Branch labels from the title index. | Complete HTML: the tree view of section 10 with the current Node as the centre Bubble, its Branches, its Carousel with an `<img loading="lazy">` per Image of this Node, the neighbour Bubbles of section 11 (**without any image URL**), chrome, the Theme's `<style>` block, the disclaimer, the stylesheet and the client bundle. No image bytes, no font bytes. **Amended 2026-09-14 (#42, PR #57, by the owner):** the server renders the neighbours into the page as the tree layer's payload; they enter the DOM only during a slide. At rest, and without JavaScript, the DOM holds the centre Bubble only (11.3). |
| After the HTML | -- | The image files this Node's Interior and strip name, one per Option (its target's main image, on the button), and, once an Overlay is opened, the files of the Node in it (11.5; **[#75]**), through `GET /images/<file>`; the Theme's font and logo files, through `GET /theme/<file>`. Nothing else, and nothing from another origin. |
| The user follows a Branch | Nothing from disk; the target Node and **its** neighbourhood from the index. | **Exactly one** page payload, carrying at most 17 Nodes, then that Node's image files. Section 11 has the accounting. |
| Opening an Image in the Carousel | -- | Nothing new: the enlarged view shows the file the strip already loaded (section 12). |

**Never**, in any response, under any setting:

- more than 17 Nodes' content;
- any Node's text in a language other than the one the page is rendered in;
- the Tree file, a file path, or any route that returns more than one Node;
- an image file of a Node that is not the centre Bubble (section 11 defines the one
  moment a transition target's images may begin to load);
- a request to any origin but this one (section 13).

The size this bounds: a Node at the format's maxima is about 900 characters of text in
one language, so a 17-Node response is roughly 40 kB of HTML before compression. The
Tree it comes from may have a thousand Nodes and a thousand images; neither number
appears anywhere in a response.

**Amended 2026-09-14 (#42, PR #57), measured:** the example Tree's pages are 35 to 48 kB
of HTML, as estimated. At the format's maxima they are not: the full Node at a 49-entry
Trail is 720 kB of HTML (22 kB gzipped), with 11 Nodes. The Node count bounds what a
response may carry, and holds; the bytes follow the Trail, which every neighbour frame
draws in full. `ADR-38-neighbourhood.md` (Consequences) has the figures, and issue #60
the lever.

**Amended 2026-09-15 (#60):** a neighbour frame now draws only the part of its Trail the
guaranteed viewport shows (11.3). The full Node at a 49-entry Trail is 269 kB of HTML
(14 kB gzipped), and its payload 176 kB (24 kB gzipped); most of what is left is the
centre frame's own Trail. `ADR-38-neighbourhood.md` (Consequences) has the table.

### 5.3 The image route

`GET /images/<file>` asks `imagePath(file)`. `null` answers 404. Otherwise the file is
streamed with `Content-Type` from its extension and these headers:

| Header | Value | Why |
|---|---|---|
| `Cache-Control` | `public, max-age=3600` | Unchanged from 0.1. |
| `X-Content-Type-Options` | `nosniff` | The extension decides the type; the bytes never do. |
| `Content-Security-Policy` | `default-src 'none'; sandbox` | **[v0.2]** An SVG is a document: opened directly, script inside it would run **on this origin**. The Tree format allows `.svg` for a logo (`tree-format.md` 3.6) and a Tree is third-party data. This header makes a file served by this route inert whatever it contains, so the rule holds for any Tree an ELSA lab loads, not only for a well-behaved one. |
| `Content-Disposition` | `inline` | It is a picture, not a download. |

**[v0.2]** In the tree view an Image is not a thumbnail in a list but an entry in the
Carousel (section 12); the markup and the no-JavaScript behaviour are stated there. The
route itself is unchanged apart from the headers above.

### 5.4 Startup and the validator command

- `src/instrumentation.ts` (Next.js's `register()` hook, Node.js runtime only) calls
  `openTree` on the configured Tree at server start.
- `npm run validate <dir>` (`scripts/validate.ts`) runs the same `openTree` and prints
  every violation as `tree-id  file  key.path  RULE  message`; exit code 1 if any.
  Authors run it before pushing; CI runs it on every PR that touches `trees/`.

Unchanged from 0.1, including this section's number, which those files cite.

### 5.5 The theme route

**[v0.2]** `GET /theme/<file>` asks `themePath(file)`. `null` answers 404 -- for a
malformed name, for a name the Theme does not reference, and for a missing file alike,
with no difference a caller can measure. Otherwise the file is streamed with the same
four headers as 5.3 and a `Content-Type` from its extension:

| Extension | `Content-Type` |
|---|---|
| `.svg` | `image/svg+xml` |
| `.png` | `image/png` |
| `.webp` | `image/webp` |
| `.ico` | `image/x-icon` |
| `.woff2` | `font/woff2` |

**Path safety, the same rule as the image route and stated once here for both.** The
name is a single path segment that must match the file-name grammar of
`tree-format.md` 3.5 / 3.6 **before anything touches the file system**; the grammar
admits no `/`, no `\`, no `.`, no `..` and no percent-encoding, since the decoded value
is what is tested. The resolved path is then joined onto the served Tree's own
`images/` or `theme/` folder and the result is required to still be inside that folder
after resolution (`path.resolve` compared against the folder, symbolic links followed).
Both checks, not either: the grammar is the rule, and the resolution check is what
still holds if the grammar is ever loosened. Nothing outside the served Tree's two
asset folders is reachable through either route, and no other route reads a file whose
name came from a request.

Fonts are cached for an hour like everything else. A Tree whose Theme changes is a
deploy; an hour of a stale font is the same trade the images make.

## 6. Repository layout and modules

```
.
├── docs/                    core document, specs, ADRs, research (unchanged)
├── trees/                   Tree data: one folder per Tree (elsa-tree/3)
│   └── ai-act-example/      tree.yaml, images/, theme/ -- the development default
├── src/
│   ├── app/                 Next.js routes (thin); all of them under [lang] (4.4)
│   │   └── [lang]/          no src/app/layout.tsx exists: this level is the root
│   │       ├── layout.tsx   the ROOT layout: html shell with `lang` from the segment,
│   │       │                the Theme's <style> block (13), chrome bar, disclaimer
│   │       ├── page.tsx     `/` -> redirect to the root Node
│   │       ├── not-found.tsx  the 404 page
│   │       ├── globals.css  the stylesheet: no colour literal, no font-family literal (13)
│   │       ├── [tree]/page.tsx           `/<tree-id>` -> redirect to root Node
│   │       ├── [tree]/[...path]/page.tsx the Node page
│   │       ├── images/[file]/route.ts    one image file (5.3)
│   │       └── theme/[file]/route.ts     [v0.2] one theme file (5.5)
│   ├── components/
│   │   ├── TreeView.tsx     [v0.2] server: the whole tree layer -- the up arrow, the centre
│   │   │                    Bubble, the fanned Option buttons and their Overlays, the
│   │   │                    Answer buttons, the neighbour frames (10, 11)
│   │   ├── Bubble.tsx       [v0.2] server: one Node as a Bubble; exports the Interior (main
│   │   │                    image, title, description, Sources) the Overlay shares (10.3)
│   │   ├── Branch.tsx       [v0.2] server: one control -- an Answer button, an Option button
│   │   │                    with its target's picture, the up arrow (10.2, 10.3)
│   │   ├── Carousel.tsx     [v0.2] server: the strip on the Bubble's lower outline (12)
│   │   ├── Explainer.tsx    [#75] client: the explainer panel's placement, Escape and tap (10.8)
│   │   ├── Sheet.tsx        [v0.2] client: the one overlay -- the Overlay of an Option (10.9),
│   │   │                    the enlarged Image, collapsed Options, collapsed Sources (10.5, 12)
│   │   ├── Slider.tsx       [v0.2] client: the slide transition (11)
│   │   ├── Logo.tsx         [v0.2] server: the Tree's logo in the chrome bar, or its
│   │   │                    title as text when the Theme names none (13.2)
│   │   ├── ShareButton.tsx  client, unchanged
│   │   ├── LanguageSwitch.tsx  unchanged
│   │   └── Disclaimer.tsx   unchanged
│   ├── neighbourhood.ts     [v0.2] which Nodes surround this one: placed up and down, and the asides (11)
│   ├── theme.ts             [v0.2] a Theme -> CSS custom properties and @font-face; the default (13)
│   ├── assets.ts            [v0.2] one file of the Tree as a response: the headers and the
│   │                        streaming the image and theme routes share (5.3, 5.5)
│   ├── url.ts               the URL scheme (4)
│   ├── chrome.ts            chrome strings and fallback (3)
│   ├── config.ts            ELSA_TREE / ELSA_TREES_DIR; the one opened Tree
│   ├── markdown.ts          rich-text subset -> safe HTML, with the explainer marks (10.8)
│   ├── tree/                the Tree loader module
│   │   ├── loader.ts        openTree and the Tree interface (5.1)
│   │   ├── validate.ts      the rules of tree-format.md section 7
│   │   └── types.ts         the types of elsa-tree/3 (5.1)
│   └── instrumentation.ts   startup validation (5.4)
├── scripts/validate.ts      `npm run validate`
├── scripts/migrate-tree.ts  [v0.2] elsa-tree/1 -> 2 (issue #39); [#75] 2 -> 3 (issue #79)
├── tests/                   Vitest tests, Playwright specs and fixtures (7)
├── package.json  package-lock.json  next.config.ts  tsconfig.json  vitest.config.ts
├── playwright.config.ts     [v0.2] in the contract now (7)
├── .nvmrc  .env.development
└── .orca/ .claude/ .github/ .devcontainer/   agent workflow (unchanged)
```

**[#75] Gone with #78:** `CarouselButtons.tsx` (the strip has no buttons, 12.2) and the
`Trail` function of `TreeView.tsx` (the up arrow replaces it, 10.2). **New:** `Explainer.tsx`,
the fourth client component, which owns the one interaction of the explainer panel that
CSS cannot (10.8). The Overlay is not a new component: it is the `Sheet` with the Option
button as its control and the target's Interior as its page (10.9), and the Interior is
exported by `Bubble.tsx` so that the Bubble and every Overlay render one component.

Gone with 0.1's view: `src/components/NodeView.tsx` and `Trail.tsx`. Their work is
`TreeView` + `Bubble`, `Branch`, and `Carousel` + `Sheet`. `Thumbnails.tsx` **stays until
#43** (amended 2026-09-13, #41, PR #56): the Node's Images as plain thumbnails in the
Carousel's row, each opening the enlarged view with the credit (12.1), so that no credit
is out of a reader's reach between #41 and #43. It is a client component in the interim
-- a fifth, owning the one interaction of the enlarged view -- and #43 removes it when
`Carousel.tsx` and `CarouselButtons.tsx` take the row. **Removed by #43** (2026-09-13):
the client components are four again.

| Module | Owns | Does not |
|---|---|---|
| `src/tree/` (loader) | Reading, validating and indexing a Tree; handing out one Node, one title, one image path, one theme path. | Know URLs, chrome, React, or that a Bubble exists. |
| `src/neighbourhood.ts` **[v0.2]** | Which Nodes surround the Node on screen: the placements `up` and `down` with their slots, the asides in Option order, and the bound on how many (11). **[#100]** It also finds the centre of a path (`centreOf`, 10.9). | Read files, render, or know what a button or an Overlay looks like. |
| `src/theme.ts` **[v0.2]** | A `Theme` (or its absence) turned into the exact CSS custom properties and `@font-face` rules the page emits, including the derived values and every escape (13), and which logo variant the palette calls for. | Know React, or which element uses which property. Write a URL: the `src` of an `@font-face` is `url.ts`'s `themeHref`. |
| `src/assets.ts` **[v0.2]** | One file of the served Tree as an HTTP response: the `Content-Type` its extension names, the four headers that make third-party bytes inert, and the one 404 that covers every refusal (5.3, 5.5). | Resolve a path -- `imagePath` and `themePath` do, inside the Tree's folder. Know which Tree is served. |
| `src/url.ts` | Parsing a request into `{ treeId, trail, nodeId, lang }` and building every link. | Read files or render. |
| `src/chrome.ts` | The chrome strings and the language fallback rule. | Contain Tree content. |
| `src/config.ts` | Environment variables, reserved-id check, the process-wide opened Tree. | Parse Trees or URLs. |
| `src/markdown.ts` | The rich-text subset to HTML, HTML disabled, links in a new tab; **[#75]** a `[text](#id)` mark to a marked term and its explainer panel (10.8), given the Node's explainers. | Accept raw HTML. Know what the panel looks like. |
| `src/components/` | Views. Server components take data and return markup -- `Logo.tsx` **[v0.2]** is one: it asks `theme.ts` which logo variant this palette calls for and renders it, or the Tree's title when there is none (13.2). The four client components own exactly one interaction each (section 1); the interim fifth of #41, `Thumbnails.tsx`, was removed by #43 (above). | Touch the file system, environment or request. Decide *which* Nodes are on screen -- that is `neighbourhood`. |
| `src/app/` | Routes: parse, load, hand to a view; redirects; the image and theme routes; 404. The `[lang]` layout sets `<html lang>` and emits the Theme. | Hold logic. Take the language from `searchParams` (4.4). |
| `next.config.ts` | The two rewrites of 4.4, plus the build settings of section 1. | Know which languages a Tree declares, or anything else about the application. |

Dependencies point inward, and the client components are leaves:

```
app  ->  components  ->  chrome, url, markdown, theme, tree/types
app  ->  neighbourhood  ->  tree (getNode, getTitle), url
app  ->  theme  ->  url (themeHref)
app  ->  assets  ->  nothing in src/
app  ->  url, chrome, config, markdown
config  ->  tree
tree/  ->  nothing in src/
next.config.ts  ->  nothing in src/
```

- **`src/tree/` still imports nothing from the rest of the application**, and nothing
  imports it to get more than one Node at a time except `neighbourhood`, which is where
  the bound lives.
- **The four client components import no server module.** `Slider` receives the
  positions it needs as props from `TreeView`; it never computes a neighbourhood, never
  fetches a Node, and never reads the Tree. `Sheet`, `Explainer` and `ShareButton`
take strings (**[#75]** `Explainer` replaced `CarouselButtons`, #78). This is what keeps the client bundle small and what makes section 14
  statable: everything a client component does is an enhancement of markup that is
  already correct without it.
- Styling mechanism and visual design are the build issues' (#40, #41, #43), within
  these files and within section 13's rule that the stylesheet holds no colour and no
  font-family literal.

Recorded in `docs/adrs/ADR-38-modules-and-tests.md`, which amends
`docs/adrs/ADR-5-repository-layout.md`.

## 7. Testing approach

| Item | Contract |
|---|---|
| Runner | Vitest, `npm test` = `vitest run`, Node environment; files `tests/**/*.test.ts(x)`. |
| Browser runner **[v0.2]** | Playwright, `npm run test:browser`, `tests/browser/*.spec.ts`, against `next build` + `node .next/standalone/server.js`. **In the contract now**, because the no-scroll rule (10.6) is a statement about a laid-out document and cannot be asserted any other way. A spec that needs a Tree other than the example starts its own server with `tests/browser/serve.ts`, a helper and not a spec file (amended 2026-09-14, #43). `tests/browser/credits.ts` is a helper too: it lists every picture a Tree shows, Node by Node in strip order, and reads each one's credit off the caption line by the keyboard alone, for `carousel.spec.ts` and `tests/first-tree/walk.spec.ts` (amended 2026-09-14, #55). |
| Also in CI | `tsc --noEmit`, `next build`, `npm run validate trees/<each Tree>`, `npm run test:browser`. Command: `npm ci && npm test && npm run build && npm run test:browser`. |
| Loading a fixture | `const tree = await openTree(path.join(__dirname, 'fixtures', '<name>'))`. Never hand-built `Node` objects; never YAML read by a test. |
| Fixtures | `trees/ai-act-example/` (complete, `en` + `nl`, **with a Theme**, one explainer on `start`); `tests/fixtures/single-language/` (`nl`, **no Theme**); `tests/fixtures/other-languages/` (`de`, `fr`, **with a Theme**); `tests/fixtures/invalid/<rule>/` (one Tree per validity rule, **[#75]** V-EXPLAINER and V-MARK included); **[v0.2]** `tests/fixtures/full-node/` (one Node at every maximum the format allows: an 80-character title, a 600-character 8-line description, 3 Sources, 8 Options whose targets each lead with an Image, 10 Images, **[#75]** 8 explainers of 40 and 200 characters each marked once, and a 49-entry Trail to reach it); **[v0.2]** `tests/fixtures/carousel/` (the Carousel's, #43: a Node with nine Images after its main one, more than the strip's seven, a Node with two, a Node whose first credit is the format's maximum of 120 characters, and a Terminal with one that no other page may request); **[#75]** `tests/fixtures/overlay/` (an explanation Node at every maximum with eight Options of its own, reached by an Option, for the Overlay at its largest, 10.9); **[#75]** `tests/fixtures/explainers/` (amended 2026-09-18, #83: eight explainers of 40 and 200 characters, `en` and `nl`, marked in one paragraph of a question Node, for the explainer panel at its largest, 10.8). |
| Rendering views | `renderToStaticMarkup` from `react-dom/server` on the synchronous components, with data from the loader. |

**Which tests are unit and which need a browser.** The rule is: a claim about *markup*
is a unit test; a claim about *layout, motion or network* needs a browser.

| Unit (Vitest) | Asserts |
|---|---|
| `loader.test.ts` | Every validity rule via `invalid/<rule>/`; `getNode` returns one Node; malformed ids give `null`; **[v0.2]** `themePath` gives `null` for a file the Theme does not name, even when it exists. |
| `url.test.ts` | Parse and build are inverses; every 404 case of 4.3; the 50-id limit. |
| `routing.test.ts` | The two rewrites of 4.4, read out of `next.config.ts` itself. |
| `chrome.test.ts` | The table in 3.1; every key of 3.2 exists in both languages; **[#75]** every outcome badge is at most 40 characters (10.1); `up(title)` contains the title it is given. |
| `not-found.test.tsx` | The 404 page of 4.3. |
| `neighbourhood.test.ts` **[v0.2]** | The set for each Node kind; **never more than 7 placements and 8 asides**; no id placed twice; a Link to an unknown id is dropped, not thrown; the Trail supplies `up` (the parent only), the Answers `down`, the Options the asides in Option order; an empty Trail has no `up`; there is no `side` direction (**[#75]**, 11.2). |
| `theme.test.ts` **[v0.2]** | The emitted properties equal the manifest's values; a Tree with no Theme, and one with only `colours`, get the documented defaults for the rest; the three derived `--elsa-on-*` colours; a `family` containing `'`, `\` or `</style>` is escaped or refused; a colour that is not `#rrggbb` is refused rather than emitted. |
| `stylesheet.test.ts` **[v0.2]** | `globals.css` contains no colour literal (`#rgb`, `#rrggbb`, `rgb(`, `hsl(`, a CSS colour keyword) and no `font-family` value that is not `var(--elsa-font-*)`. This is core document section 9's "the frontend must never carry a lab's branding in its code", as a test that cannot be argued with. |
| `views.test.tsx` | Each situation's structure (10.3): what the Interior holds -- the main image as a link named by `enlarge` and its description and described by its credit, or the empty slot; the title; the description with its marked terms and their panels (10.8); the Sources heading and the two kind prefixes that remain -- which controls exist and where they link: the up arrow's `href` on a Node with a Trail, at the root and on a Node opened without one; both Answer buttons the same shape with the chrome word, a colon and the title in one label; `startAgain` on a Terminal and on an explanation Node shown as the centre; the Option buttons in the fan's order with their targets' first Images, and the fan's numbers for one, two, five and eight Options; each Option's Overlay as a closed disclosure holding the target's Interior and its Options as links, with the heading link, and `open` on the one the URL names (10.9); the strip's markup (12): the Images after the first, `loading="lazy"` with `width` and `height`, no button and no caption element, no strip on a Node with fewer than two Images; nothing in the markup keyed to a credit's length. **[#75]**, rewritten by #80, #81 and #82. |
| `markdown.test.ts` | The subset of `tree-format.md` 3.4; **[#75]** a `[text](#id)` mark renders the term and its panel of 10.8 and a mark to an unknown id is refused. |
| `interop.test.tsx` | Below. |

| Browser (Playwright) | Asserts |
|---|---|
| `no-scroll.spec.ts` **[v0.2]** | The exact test of 10.6, at every named viewport, on every page of its list, with every Sheet open in turn -- **[#75]** each Option's Overlay and each picture's enlarged view included -- and with each explainer panel open by focus, and again with JavaScript disabled; the mid-transition rows with every Sheet closed. |
| `transition.spec.ts` **[v0.2]** | The request accounting of 11.5: one page payload per navigation, at most 17 Nodes in it, on load only the centre Node's files and one per Option, after opening an Overlay that Node's files, no image of a placed neighbour, no request for the Tree; the URL after a slide equals the plain-link URL; back reverses it; `prefers-reduced-motion` removes the motion and keeps the navigation; the neighbour frame of a running slide is `inert`, and a slide started with a Sheet open closes it first; **[#75]** an Option opens its Overlay and nothing slides; the up arrow slides up. |
| `theme.spec.ts` **[v0.2]** | Every request while loading a themed Node page is same-origin; the logo is visible; changing a colour in `tree.yaml` and restarting changes the page with no code change. |
| `tree-view.spec.ts` **[v0.2]** | The tree view in a browser: what a click on the up arrow and on each Answer button does to the URL (10.2, 10.3), on `/<tree>/start/<a>/<b>` the arrow lands on `/<tree>/start/<a>`; Tab reaches every control in document order and Enter follows each; an Option button opens its Overlay, the cross, Escape and a click outside close it, focus returns to the button, the address is unchanged throughout, and a direct request for an explanation Node's URL renders its parent with the Overlay open (10.9); the collapsed Sheets open, list their links, close on Escape; the minimum-size notice names the dimension that is short (10.4); the contrast of the Answer label on its fill is at least 3 : 1 (10.3); the screenshots of #80, #81 and #82. **With JavaScript disabled**, section 14: the arrow and the Answer buttons navigate, the Option button is a disclosure that opens the Interior, the collapsed groups are plain lists. There is no `no-js.spec.ts`. **[#75]** |
| `carousel.spec.ts` **[v0.2]** | The Carousel in a browser, against `tests/fixtures/carousel/`: the image files requested on load and on enlarging, and never another Node's (12.4, 11.5); one tab stop, Left/Right/Home/End, Enter or Space enlarges, `previous` and `next` page the enlarged view, Escape closes and returns the focus (12.3); the credit visible in the enlarged view for every picture and read as each picture's description; the names in `en` and `nl`; below step 1 the one control says `imageCount` and opens the enlarged view (10.5); **with JavaScript disabled**, a thumbnail opens its file, the strip is a tab stop the arrow keys scroll, a Node with one Image has no stop there, and the `<noscript>` control pages the Images as disclosures with their credits (14); **[#75]** no button and no caption is rendered (12.2). |
| `node-view.spec.ts`, `trail.spec.ts`, `language.spec.ts`, `deployment.spec.ts` | The 0.1 browser specs, kept: the URL scheme, the Trail in the path, the language mechanism and the deployment shape are unchanged contracts and keep their tests. **[#75]** `trail.spec.ts` and `tests/trail.test.tsx` are rewritten by #82 for what is drawn -- the up arrow and its `trailHref` -- since the Trail Branches and the Trail Sheet are gone (10.2); the path and `trailHref` they assert do not change. |
| `explainer.spec.ts` **[#75]** | The explainer panel in a browser, against `tests/fixtures/explainers/` (amended 2026-09-18, #83: its own file rather than a part of `tree-view.spec.ts`): a marked term opens its panel on hover, focus and tap and closes it on leaving, blur and Escape, Escape also on a page reached by a slide; one panel is open at a time; Tab reaches every term in text order; the term's accessible description is its explainer and the panel is a `tooltip`; resizing the window closes it; at each viewport of 10.6 above the floor in `en` and `nl` every panel lies inside the text area, at most 320 pixels wide and, where the area is at least 320 wide, 148 tall, placed by the rule of 10.8 -- below its term's line if it fits, else above, else against the area's edge on the side with more room -- and in an area cut too short for either side that last branch is reached (10.8); **with JavaScript disabled**, hover and focus open it at the foot of the text area, full width, and it stays open while the pointer rests on it over its own term (14); the screenshots of #83, in `docs/screenshots/issue-83/` under `ELSA_SHOTS=1`. That every page still fits with each panel open is `no-scroll.spec.ts`'s. |
| `tests/first-tree/slide-endurance.spec.ts` **[v0.2]** | Four hundred slides in one tab with the slide on (11.3, #63), on the first Tree: `yes` from `start` and the parent's Trail Branch back, alternately. The tab survives; the page counts at least 400 changes of `data-sliding` over the walk, so a run with the motion off fails; and after a forced garbage collection the renderer's DOM nodes, detached ones included, and event listeners at the four-hundredth slide are fewer than twice those at the second (`Memory.getDOMCounters`). Under `npm run test:first-tree`, beside the first Tree's long walks, and **not** in `npm run test:browser`: it takes six minutes, and the CI command above runs in a 30-minute job that also installs, builds and runs the rest of the suite (amended 2026-09-15, #63). |

**The interoperability test** (`interop.test.tsx`) is core document section 9, first
bullet, as a test. For `single-language/` and `other-languages/`, for every declared
language, every Node of the fixture, with an empty and a full Trail: renders without
exception; the Node title in that language is present; the disclaimer is Dutch for `nl`,
English for `de` and `fr`; the language switch lists exactly the manifest's languages;
the markup contains neither `undefined` nor `[object Object]`. **[v0.2]** It now also
checks:

- **a Tree with a Theme and a Tree without one** both render, and the unthemed one emits
  the default properties rather than an empty `<style>` or a missing one;
- a Theme with only `colours`, only `fonts` and only `logo` each render (the parts are
  independent, `tree-format.md` 4.3);
- **every Node kind fits at the guaranteed viewport** -- delegated to
  `no-scroll.spec.ts`, which runs over the same fixtures, because fitting is a layout
  fact. The unit test asserts the markup; the browser test asserts the fit; between
  them there is no gap where a third-party Tree could break the frontend.

Recorded in `docs/adrs/ADR-38-modules-and-tests.md`, which amends
`docs/adrs/ADR-5-testing-approach.md`.

## 8. What the contracts guarantee to the core document

| Core document | Where it is met |
|---|---|
| 3.1 one file per Tree, hand-editable | `tree-format.md` (`elsa-tree/2`); 5.1, 5.2 |
| 3.1 / 9 never the whole Tree, a bounded set of neighbours | 11.2 (at most 15 neighbours, 17 Nodes in a page; **[#75]** was 16), 11.5 (the accounting), 5.2 (never, in any response) |
| 3.1 / 9 images only for the Node on screen | 11.4, 12.4; **[#75]** 11.5 names the one exception per Option (core document 10.29) |
| 3.1 text has a maximum length | `tree-format.md` 5.7, confirmed against this layout in 10.7 (**[#75]** again, with two pixels to spare: core document 10.28) |
| 3.2 the screen is a tree: a Bubble, the way back above, Answers below, side children beside | 10.1 to 10.3; **[#75]** the up arrow (10.2), the fan-out (10.3) |
| 3.1 / 3.2 **[#75]** a main image on every Node, above the title, and on the side child's button | 10.3, 10.7 |
| 3.2 **[#75]** side children open in an Overlay; every Node still reachable by URL | 10.9 (core document 10.27) |
| 3.1 / 3.2 **[#75]** explainers: the data says which words, the frontend shows the panel | `tree-format.md` 5.9; 10.8 |
| 3.2 **[#75]** both Answer buttons the same, larger, in the logo's green from the Theme | 10.3, 13.1 |
| 3.2 **[#75]** the Trail not drawn; the up arrow one step back; the Trail still in the URL | 10.2, 4.1 |
| 3.2 **[#75]** the "Legal sources" heading | 10.3 |
| 8 **[#75]** every Image's credit shown, though nothing is written under the pictures | 12.2, 12.3 (core document 10.26) |
| 3.2 / 9 the page never scrolls | 10.4 to 10.6; `no-scroll.spec.ts` |
| 3.2 smooth transitions, the tree slides | 11.1, 11.3 |
| 3.2 Images as a Carousel below the Bubble | section 12; **[#75]** pictures only, at the Bubble's lower edge |
| 3.2 / 9 branding from the Tree, never in the frontend's code | section 13; `stylesheet.test.ts`, `theme.spec.ts` |
| 3.2 every Node reachable by URL | 4.1: `/<tree-id>/<node-id>` |
| 3.2 share link carries Node and Trail, inside the link | 4.1: the path is the Trail |
| 3.2 clicking a Trail entry discards the later Trail | 4.1; 10.2 |
| 3.2 language switch among the Tree's languages | 4.1 `lang`; 3 chrome fallback |
| 3.2 permanent disclaimer | 3.2 `disclaimer`, rendered in `layout.tsx` |
| 3.2 server-side rendering, lightweight, lazy | 1; 5.2; section 14 |
| 4 / 8 no accounts, cookies, tracking, analytics, database | 1 (no cookie, no telemetry), 2 (files only), 5 |
| 7 plain Linux server, no vendor features | 1: standalone `node server.js`; `docs/deployment.md` |
| 7 / 9 nothing fetched from a third party at run time | 13.5; `theme.spec.ts` records every request |
| 9 third-party Tree never breaks the frontend | 3 (chrome fallback); 5.1 (strict loader); 13.4 (a Theme with any part absent); 7 (the interoperability test) |
| 9 nothing about the user stored or transmitted | 1, 5.3, 5.5 (no third-party request, no cookie) |
| 10.19 | 2 |
| 10.20 | 3 |
| 10.22 | 10.4 to 10.6 |
| 10.23 (PROPOSED) | 10.3: Answers are the children, drawn below; Options are the side children, drawn beside |

## 9. Where each decision is recorded

| Decision | ADR |
|---|---|
| Next.js App Router, server components, standalone Node 22, npm | `docs/adrs/ADR-5-framework-and-rendering.md` |
| One Tree per deployment via `ELSA_TREE`; Tree id kept in URLs | `docs/adrs/ADR-5-tree-selection.md` |
| Chrome in `en` and `nl` in code; follows content language, falls back to English | `docs/adrs/ADR-5-chrome-languages.md` |
| Path is the Trail; `lang` query; 50-id limit; 404 rules | `docs/adrs/ADR-5-url-scheme.md` |
| `?lang` restated as a `[lang]` route segment so `<html lang>` is the content language | `docs/adrs/ADR-19-content-language-in-the-route.md` |
| `ELSA_BASE_URL` optional, read by the canonical link only, refused when malformed | `docs/adrs/ADR-11-public-base-url.md` |
| The loader seam; one Node per call; images by route; startup validation | `docs/adrs/ADR-5-lazy-loading.md` -- **superseded by `ADR-38-neighbourhood.md`** |
| `src/` modules, `trees/`, `tests/`; dependency direction | `docs/adrs/ADR-5-repository-layout.md`, amended by `ADR-38-modules-and-tests.md` |
| Vitest; fixtures through the loader; the interoperability test | `docs/adrs/ADR-5-testing-approach.md`, amended by `ADR-38-modules-and-tests.md` |
| **[v0.2]** The tree view: a Bubble in the centre, the Trail above, Answers below, Options beside | `docs/adrs/ADR-38-tree-view.md` |
| **[v0.2]** The neighbourhood: at most 16 neighbours, in the page payload, never the Tree | `docs/adrs/ADR-38-neighbourhood.md` |
| **[v0.2]** The slide transition: the tree layer moves, the URL is the plain link's | `docs/adrs/ADR-38-transitions.md` |
| **[v0.2]** The guaranteed viewport, the no-scroll rule, the degradation order, the test | `docs/adrs/ADR-38-no-scroll.md` |
| **[v0.2]** The Carousel: a scroll-snap strip of this Node's Images, enlarged in a Sheet (amended 2026-09-14, #55: and its Options' first pictures) | `docs/adrs/ADR-38-carousel.md` |
| **[v0.2]** The Theme: custom properties and `@font-face` emitted at render time, files from a route | `docs/adrs/ADR-38-theme-delivery.md`, amended by issue #40 (PR #52) |
| **[v0.2]** What holds without JavaScript | `docs/adrs/ADR-38-without-javascript.md` |
| **[v0.2]** Modules, dependency direction and which tests need a browser | `docs/adrs/ADR-38-modules-and-tests.md`, amended by issue #40 (PR #52) |
| **[#75]** The owner's nine display changes reach the specs through one architecture issue | `docs/adrs/ADR-75-presentation-changes.md` |
| **[#75]** Explainers: the `explainers` list, the `[text](#id)` mark, the panel by hover and focus | `docs/adrs/ADR-78-explainers.md` |
| **[#75]** The Overlay is the Sheet; the address does not change; an explanation Node's URL renders its parent with the Overlay open | `docs/adrs/ADR-78-overlay.md` |
| **[#75]** The main image is the first Image, 60 px above the title; the rows at 1280 x 640; the limits survive by two pixels | `docs/adrs/ADR-78-main-image-and-row-budget.md` |
| **[#75]** The Carousel: pictures only on the Bubble's lower outline; the credit in the enlarged view and as accessible description | `docs/adrs/ADR-78-carousel.md` |
| **[#75]** Both Answer buttons alike in `accent-secondary`, a large-text label at 3.69 : 1; the up arrow replaces the drawn Trail | `docs/adrs/ADR-78-answer-buttons-and-up-arrow.md` |
| **[#75]** The "Legal sources" heading; the `Legal` kind label goes | `docs/adrs/ADR-78-sources-heading.md` |
| **[#75]** The fan-out geometry; an Option has no Images; a page may fetch one file per Option, its target's main image | `docs/adrs/ADR-78-fan-out-and-option-picture.md` |
| **[#100]** The centre of a path is found in at most its last three entries, so a page reads at most 17 Nodes for every path | `docs/adrs/ADR-100-bounded-centre.md` |
| **[#100]** An Overlay has no strip: its panel has no room for one | `docs/adrs/ADR-100-overlay-without-strip.md` |

## 10. The tree view

**[v0.2], new; [#75] re-frozen 2026-09-17 (issue #78).** The owner, in issue #35: "the
view of the frontend in no way resembles a tree"; the opened Node "should be displayed as
a bubble, with the branches above visible and clickable, and branches going out below or
beside it for the children and side children"; "a bubble is round btw". After seeing
version 0.2 the owner changed the presentation again (#75; core document 3.2, the
bullets marked `[#75]`): the branches above are no longer drawn and one up arrow goes a
step back, a side child opens in an **Overlay** instead of replacing the Bubble, every
Node shows a **main image** above its title, the Answer buttons are the same and larger
in the logo's green, the Sources sit under a heading, the Carousel is pictures only at
the Bubble's lower edge, the side children's buttons fan out like a mind map, and some
words carry an **explainer**. This section is the layout that makes all of that a
contract. Vocabulary is the core document's section 5: **Bubble**, **Branch**, **Trail**,
**Answer**, **Option**, **Carousel**; and from here on **Interior** (what a Node shows:
main image, title, description, Sources -- the same in the Bubble and in an Overlay),
**Overlay** (the Sheet an Option opens), **aside** (an Option's target as the page
carries it for its Overlay) and **explainer** (`tree-format.md` 5.9).

Recorded in `docs/adrs/ADR-78-main-image-and-row-budget.md`, `ADR-78-overlay.md`,
`ADR-78-answer-buttons-and-up-arrow.md`, `ADR-78-fan-out-and-option-picture.md`,
`ADR-78-carousel.md`, `ADR-78-sources-heading.md` and `ADR-78-explainers.md`; the 0.2
record is `ADR-38-tree-view.md` and `ADR-38-no-scroll.md`, superseded in part.

### 10.1 The layout

One screen, six rows, nothing outside them. The picture at the guaranteed viewport of
1280 x 640 CSS pixels, which is also the smallest the full arrangement is designed for:

```
+--------------------------------------------------------------------------------+  44
|  [logo]  Tree title                                    [language]  [share]      |      chrome bar
+--------------------------------------------------------------------------------+
|                                    ( ^ )                                        |  26  the UP ARROW, on the
|                              .----'     '----.                                  |      Bubble's top outline
|   +-----------+          .-'    [main image]    '-.          +-----------+     |
|   |( ) Biomet.|--------'     Prohibited practices?   '--------|( ) Emotion|     |
|   +-----------+        (   ---------------------------  )      +-----------+     |
| +-----------+          (   Does your AI system use one   )        +-----------+ | 446 the BUBBLE (round)
| |( ) Social |----------(   of the practices Article 5    )--------|( ) Predic.| |     760 x 446,
| +-----------+          (   prohibits? ...                )        +-----------+ |     text area 640 x 394
|   +-----------+         '.   LEGAL SOURCES               .'      +-----------+  |
|   |( ) ...    |-------.   '.  Article 5 AI Act        .'  .-----|( ) ...    |  |
|   +-----------+        '-.   '----(o)(o)(o)(o)(o)----'  .-'      +-----------+  |  28  the CAROUSEL strip,
|      OPTIONS (side children), fanned out                                        |      on the bottom outline
+--------------------------------------------------------------------------------+
|     [ Yes: Annex III areas          ]   [ No: General-purpose AI          ]     |  68  the ANSWERS
+--------------------------------------------------------------------------------+
|                    This tool is not legal advice.                               |  28  disclaimer
+--------------------------------------------------------------------------------+
  240        20              760              20         240                        = 1280
```

| Row | Height at the guarantee | Holds |
|---|---|---|
| chrome bar | 44 | The Theme's logo (or the Tree's title as text), the language switch, the share button. Unchanged. |
| up-arrow band | 26 | The **up arrow** (10.2), a 48-pixel round button centred on the Bubble's top outline: 24 pixels of it above the outline, 2 clear of the chrome bar. Empty on a Node with no Trail; the band stays. |
| Bubble | 446 | The **Bubble**, 760 x 446, radius 223, between the two fans of Option buttons (10.3): 240 of column, 20 of gap, the Bubble, 20, 240. |
| strip band | 28 | The **Carousel** strip (section 12): 48-pixel thumbnails centred on the Bubble's bottom outline, 24 of them below it, 4 clear of the Answer row. Reserved on every Node; empty where the Node has fewer than two Images. |
| Answers | 68 | The two **Answer buttons**, 620 x 60 (10.3), 4 clear above and below. |
| disclaimer | 28 | The permanent "not legal advice" footer (core document 8). Unchanged. |

44 + 26 + 446 + 28 + 68 + 28 = 640.

- **The Bubble is round.** A single element with a large border radius (223), filled
  with the Theme's `surface` colour and outlined in `accent`; its text area is inset
  from the curve, which is why 760 x 446 of Bubble gives **640 x 394** of text
  (`tree-format.md` 5.7 derives the length limits from exactly this, 10.7).
- **The rim is chrome; the text area is authored text.** The band between the text area
  and the edge -- 60 pixels each side, 26 above, 26 below, the 2-pixel outline included,
  so the padding inside the outline is 58 and 24 -- is the **rim**. It holds the up
  arrow's lower half (band above) and the strip's upper half (band below), each 2
  pixels clear of the text area, and a Terminal's **outcome badge**: a 24-pixel pill in
  the band above, centred in the half of the band left of the arrow, of at most 40
  characters (`src/chrome.ts`, `chrome.test.ts`). The explanation Node's hint is gone
  with the `back` Branch (10.9). **Nothing on the rim takes a pixel from the text
  area**, which is what lets 5.7's derivation stand (10.7).

  **Amended 2026-09-18 (#82, PR #93, by the owner):** below 480 pixels wide the outcome
  badge stands under the arrow's foot and takes the whole band, centred under the arrow,
  instead of the half of the band left of it. At 360 x 640 that half is 140 pixels, and
  the first Tree's own badges need more: "Does not apply" 142, "Niet van toepassing" 178.
  The Terminal's rim above grows to hold arrow and badge one above the other; still
  nothing on the rim takes a pixel from the text area. Like the Answer label of 10.3, this
  gives way by width alone, outside 10.5's numbered order.
- **The curve and the text area.** The chord of the Bubble 26 pixels in is 523 pixels;
  at the title's top (94 in) it is 678, wider than the text area, and at the lowest
  Sources line (46 from the bottom) 585. The main image is centred and at most 90 wide;
  the title and description have the full 640; the Sources' lines are laid out in the
  chord, which holds the two lines 5.7 allows them (`ADR-78-sources-heading.md`).
- **The Bubble never shrinks.** At or above the guaranteed viewport its text area is at
  least 640 x 394 at every size. Extra width goes to the fans and the page margins;
  extra height goes to the Bubble and the gaps. A limit that holds at 1280 x 640
  therefore holds at every larger viewport.
- **The centre of the viewport is the centre of the tree.** Everything else is placed
  relative to the Bubble: that is what section 11 slides.

### 10.2 The up arrow: the way back

The Trail is the ordered list of Nodes visited to get here, and it is the path in the
URL (4.1), unchanged. **It is no longer drawn** (the owner, #75). In its place one
control:

- **The up arrow** is a 48-pixel round button centred on the Bubble's top outline, in
  the Answer buttons' style (filled `accent-secondary`, the glyph in
  `--elsa-on-accent-secondary`, 13.1), showing an upward arrow. It is a link to the
  Trail entry directly above the centre Node, at `trailHref` of that entry -- the same
  address 0.2's parent Branch had -- so the Trail after it is discarded (core document
  10.17) and the URL stays the path. Its accessible name is the chrome key `up(title)`:
  "Back to: <the parent's title>", from the title index (`getTitle`). Following it
  slides **up** (11.1).
- **Where there is nothing above, nothing is drawn:** the root Node, and a Node opened by
  its own URL with an empty Trail, have an empty band of the same 26 pixels, so nothing
  moves when the walk starts.
- **Gone:** the Trail Branches, the collapsed middle, the Trail Sheet, and the chrome
  keys `trail`, `start`, `trailMore` and `back`. A reader who wants to go further back
  presses the arrow again or uses the browser's back; the share link still carries the
  whole Trail.

### 10.3 What each kind of Node shows

**The Interior** is what a Node shows, in this order, inside a 640-pixel-wide text area
(10.7 has the heights): its **main image** -- the first entry of its `images`
(`tree-format.md` 5.2) -- 60 pixels tall and at most 90 wide, cropped to that box when
its shape is not 3 : 2, with 8-pixel corners, centred, its `description` as alternative
text, a link to its file that opens the enlarged view (12.3) and is described by its
`credit`; or, on a Node without Images, an **empty slot** of the same 60 pixels, a faint
circle outlined in the `rule` shade; then the **title** (heading); the **description**
(rich text, with its explainer marks, 10.8); and the **Sources** under the chrome heading
`sources` -- "Legal sources" / "Juridische bronnen" -- each a link that opens in a new tab,
prefixed by its kind for `case-law` and `literature` only (`ADR-78-sources-heading.md`).
The same component renders the Bubble's interior and every Overlay's (10.9), so a change
to one reaches the other.

`tree-format.md` 5.6 has three kinds and the frontend distinguishes five situations. In
every one: the up arrow above where there is a Trail (10.2), the strip on the lower
outline (section 12), the chrome bar and disclaimer unchanged.

| | In the Bubble | Below the Bubble (children) | Beside the Bubble (side children) |
|---|---|---|---|
| **question Node, with Options** | The Interior | **Two Answer buttons**, `yes` and `no`, 620 x 60, side by side, the same shape and fill; each labelled with the chrome word, a colon and the target's title in one run of **19-pixel bold** text on 24-pixel lines, at most two lines | **The Option buttons**, fanned out, at most 4 per side (below) |
| **question Node, no Options** | The same | The same two Answer buttons | Empty fans; the Bubble keeps its size and place |
| **explanation Node, in an Overlay** (the ordinary case: an Option opened it, or its URL did, 10.9) | The parent's page is underneath, unchanged | -- | The Overlay holds the explanation Node's Interior and, under it, its own Options as a list of plain links (10.9) |
| **explanation Node, as the centre** (a path with no question Node or Terminal before it, or **[#100]** one where 10.9's bounded centre rule stops on an explanation Node) | The Interior; the up arrow (10.2) when the path has an entry before it, none when it has not | **One button**, `startAgain`, in the Answer buttons' style, to the root Node with an empty Trail | Its Options, fanned out like a question Node's |
| **Terminal** | The Interior, and on the rim the **outcome badge**: `outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited` or `outcomeRefer`, coloured `danger` for `prohibited` and `accent` otherwise | **One button**, `startAgain`, in the Answer buttons' style. The way back is the up arrow (10.2); a Terminal that is the root shows `startAgain` alone | Nothing: a Terminal may not carry Options (`tree-format.md` 5.6) |

- **Every button shows its target's title**, taken from the title index (`getTitle`),
  never from a second Node read -- except an Option button, whose target the page has in
  hand for its Overlay (11.2).

  **Amended 2026-09-18 (#82, PR #93, by the owner):** below 480 pixels wide an Answer
  button -- `yes`, `no` or `startAgain` -- shows its chrome word alone. A 170-pixel button
  holds about eleven characters a line of the 19-pixel label, so an 86-character label
  would take eight lines, more than the Bubble gives up at that width; and a smaller label
  drops out of large text and fails the 4.5 : 1 that normal text needs on the fill. The
  button's **accessible name keeps the whole label** -- the word, a colon and the target's
  title -- at every width (WCAG 2.2 SC 2.4.4), and the page it leads to shows the title.
- **The Answer buttons are the walk's controls, painted alike.** Both are filled with
  the Theme role `accent-secondary` and lettered in `--elsa-on-accent-secondary`
  (13.1); the label is large text (WCAG 2.2: at least 18.66 pixels bold), so the fill
  must give it at least 3 : 1. On the first Tree `accent-secondary` is the green of the
  ELSA-Lab logo's lettering, `#159a2f`, under white: **3.69 : 1**, measured
  (`ADR-78-answer-buttons-and-up-arrow.md`; #82 re-measures on the running page). Two
  buttons and their 20-pixel gap are 1260 of the 1280 pixels; 580 pixels of label hold
  a chrome word, a colon and an 80-character title in two lines in the widest fallback
  face. `startAgain` is one button of the same size and colour, centred.
- **An Option button opens an Overlay** (10.9); it does not navigate and nothing slides.
  It is **232 x 96**: the target's main image as a 48-pixel round picture at the inner
  end (or the empty slot), an 8-pixel gap, and the target's title at **16 pixels on
  20-pixel lines, at most four lines** in the 152 pixels left; outlined in the `rule`
  shade, filled `surface`, a wash of `accent` on hover. The buttons **fan out** around
  the Bubble (`ADR-78-fan-out-and-option-picture.md`): the first Option on the right,
  the second on the left, alternating, each side top to bottom in Option order; a side
  with *m* buttons puts their centres at *y* = (*i* + 0.5) x 446 / *m* - 223 from the
  Bubble's centre (*i* = 0 .. *m* - 1), and each button's inner edge 20 pixels outside
  the outline at that height, at 157 + sqrt(223² - *y*²) + 20 from the centre line
  (157 is half the Bubble's straight middle, 223 its radius). So the button nearest the
  Bubble's middle sits furthest out (inner edge 400, outer 632 of the 640 to the page's
  edge), the top and bottom ones on a side of four 75 pixels nearer the centre line, and
  a 20-pixel **connector**, 2 pixels wide in the `rule` shade, runs from each button's
  inner edge to the outline at its centre height. The pitch on a side of four is 111.5
  pixels, 15 clear of the button.
- **The picture on an Option button is its target's main image** -- an image of another
  Node, which 11.5 allows for exactly this: one file per Option, the target's first
  Image, never its other Images (core document 10.29). An Option has no `images` of its
  own in `elsa-tree/3` (`tree-format.md` 5.4).
- **Direction still carries meaning, and 10.23 stands as read.** Above is where you came
  from (the arrow); below is where an answer takes you; beside is an aside you read and
  come back from -- now by closing it. The owner's own words in #75 ("side-steps",
  "side nodes"; "the buttons to navigate further down ... (yes and no buttons)") are
  consistent with the reading; should the owner correct it, what changes is which
  direction a Link is drawn in, in `src/neighbourhood.ts` (11.2).

### 10.4 The viewport the layout guarantees

| | Width x height, CSS pixels | What holds |
|---|---|---|
| **The guaranteed viewport** | **1280 x 640** | The full arrangement of 10.1, every text at its designed size, no label truncated, nothing collapsed. The document does not scroll. |
| Above it | anything larger | The same, with the extra space going to margins, the fans and the Bubble. The document does not scroll. |
| Between the floor and the guarantee | down to, but not including, **320 x 480** | The tree view, degraded in the stated order of 10.5. The document does not scroll. |
| At and below the floor | **320 pixels wide or 480 pixels tall**, whatever the other dimension | The `minimumSize` notice, which names the dimension that is short (`minimumWidth`, `minimumHeight`; both at the corner), and which itself fits and does not scroll. |

The floor itself shows the notice, and so does any viewport that is at the floor in
either dimension, because the order of 10.5 has nothing left to give up there
(the owner confirmed the floor on PR #56 on 2026-09-13, core document 10.22). 1280 x 640
is `tree-format.md` 5.7's assumption, confirmed here (10.7). 320 x 480 is smaller than any
display in current use, so the notice is a backstop for a resized desktop window, not
the mobile experience.

### 10.5 Below the guarantee: the degradation order

The owner's rule is absolute: no scrolling, ever. So the layout does not shrink text
until it is unreadable and it does not hand the reader a scrollbar. It **gives things
up, in a fixed order**, and each thing it gives up stays reachable behind one control.
Whichever step first makes the arrangement fit is where it stops.

| # | When space runs short | What happens | What is still reachable |
|---|---|---|---|
| 1 | height | The strip collapses to one control showing `imageCount`, a 20-pixel pill centred on the same outline, and the strip band closes to 20. | The enlarged view (12.3). |
| 2 | width | The fan straightens: two columns of 200 x 96 buttons without pictures, 20 from the Bubble. | Unchanged: they are still the Option buttons, still opening their Overlays. |
| 3 | width | The Option buttons move below the Answer row as one row, where the height allows the row (at least 744); otherwise step 4 fires at once. | Unchanged. |
| 4 | either | The Option buttons collapse to one control labelled `options` with their count. | A Sheet listing the Options, each a plain link to its target's address, which opens its Overlay (10.9). |
| 5 | height | The main image is hidden and its slot closes, on every Node alike. | The enlarged view (12.3), from the collapsed strip's control. |
| 6 | height | The Sources block, heading included, collapses to one control showing their count. | A Sheet titled `sources` listing them, each a link that opens in a new tab. |
| 7 | height | Body text steps down 16 -> 15 -> 14 -> 13 px, line height 1.5, and **never below 13 px**; the title steps 22 -> 20 -> 18 px; the Answer label 19 -> 18.66 px (still large text). | Unchanged. |
| 8 | anything left | The `minimumSize` notice replaces the tree view. | The notice says which dimension is short and the size it must exceed. |

- The order is deliberate: the strip and the fan are context, the Options are a list,
  the picture is a picture, the Sources are a citation, and the **Node's title,
  description, up arrow and Answer buttons are never given up** -- they are the step
  the reader is on. The notice appears only when even those do not fit.

  **Amended 2026-09-18 (#82, PR #93, by the owner):** one thing is shortened outside the
  numbered order, by width alone: below 480 pixels an Answer button's label is its chrome
  word only (10.3, amended the same day). The buttons themselves stay, at their place and
  in their colour, and so does each one's accessible name, whole. The up arrow keeps its
  48 pixels at every width; on the phone's narrower rim its band above the Bubble is
  taller instead.
- Every collapse opens the same `Sheet`. One concept, five uses -- the enlarged Image,
  the Overlay (10.9), the collapsed Options, the collapsed Sources, and the explainer
  panel is *not* one (10.8) -- and one set of keyboard rules (Escape closes, focus
  returns to the control that opened it). One Sheet is open at a time: opening another
  closes it, with or without JavaScript (#59).
- **The triggers**, every one a width or a height, the same for every Node, none keyed
  to a Node's content. By height: step 1 below 640 (it frees 8 pixels, to 632), step 5
  below 632 (68 more, to 564), step 6 below 564 (68 more, to 496), step 7 below 496,
  the notice at 480. By width: step 2 below 1280 (two columns of 200 and their gaps
  beside the 760 Bubble are 1200), step 3 below 1200, step 4 by count as #41 measured
  -- at once for five Options or more, at 1000, 770 and 520 for four, three and two --
  then steps 5, 6 and 7 together below 792, where the Bubble narrows (its rim to 36 by
  24) and its text takes more lines; step 7's further sizes follow at 640 and 480, and
  the notice at 320. The build issues (#80, #81, #82) measure these and paste the
  numbers; `no-scroll.spec.ts` keeps them true. (0.2's step 1, the Trail's collapse, and
  its width step at 960 for the caption line are gone with the Trail and the caption.)
- At the phone widths where the Bubble narrows, the rim narrows to 36 by 24 and the band
  a Terminal's badge sits in is kept, so the badge still takes nothing from the text
  area.

### 10.6 The no-scroll rule, and the exact test

**The rule.** `html` and `body` are exactly the size of the viewport and have
`overflow: hidden`. No element in the document has content taller or wider than itself,
with **one exception**: the Carousel strip, which scrolls horizontally inside its own
400-pixel box on the Bubble's lower outline and is how the Carousel works without
JavaScript (12.2). The document itself never scrolls at any size, including below the
floor, including while a Sheet or an Overlay is open, including while an explainer
panel is open, and including during a transition (core document 9, `[#75]`).

**The test.** `tests/browser/no-scroll.spec.ts`, Playwright, in the contract (section
7). For each viewport in the list below, for each page in the list below, after the page
has loaded and its fonts have settled:

```ts
const d = document.documentElement
expect(d.scrollHeight).toBeLessThanOrEqual(window.innerHeight + 1)
expect(d.scrollWidth ).toBeLessThanOrEqual(window.innerWidth  + 1)
// and the same two for document.body, and then, for every element in the document
// except the Carousel strip ([data-carousel-strip]):
expect(el.scrollHeight).toBeLessThanOrEqual(el.clientHeight + 1)
expect(el.scrollWidth ).toBeLessThanOrEqual(el.clientWidth  + 1)
```

The one-pixel tolerance is for sub-pixel rounding and nothing else.

| Viewports | Why |
|---|---|
| 1280 x 640 | The guarantee, exactly. |
| 1366 x 768, 1920 x 1080, 2560 x 1440 | Above it. |
| 1280 x 800, 1024 x 768 | Common laptop shapes. |
| 768 x 1024, 390 x 844, 360 x 640 | Tablet and phone: the degradation order of 10.5. |
| 320 x 480 | The floor: the notice, which must also not scroll. |

| Pages | Why |
|---|---|
| The root Node of `trees/ai-act-example` | A question Node with Options. |
| A question Node without Options | The second situation of 10.3. |
| An explanation Node's URL, reached with a three-entry Trail | The third: its parent's page with the Overlay open (10.9). |
| An explanation Node's URL with no parent in the path | The fourth: the explanation Node as the centre. |
| A Terminal | The fifth. |
| `tests/fixtures/full-node/` at a 49-entry Trail | Every maximum the format allows at once: 80-character title, 600-character 8-line description, 3 Sources, 8 Options each with a target that has a first Image, 10 Images, 8 explainers at 40 and 200 characters, the longest Trail. If this fits, every valid Tree fits. |
| `tests/fixtures/overlay/`: the Overlay of an explanation Node at every maximum, with eight Options of its own | The Overlay at its largest (10.9). |
| The longest Node of the first Tree that validates | The real content. |
| `annex-i-legislation` of the first Tree | Its heaviest Node: its own picture and eight Options, each button with its target's picture. |
| Each of the above in **both** `en` and `nl` | Dutch runs longer than English; the limits are per language and so is the fit. |
| Each of the above with every Sheet open in turn -- the Overlay of each Option, the enlarged view of each picture, the collapsed groups -- and with each explainer panel open, by focus, with and without JavaScript | 10.5, 10.8 and 10.9 do not get an exemption. |
| Each of the above mid-transition, with every Sheet closed | A slide closes any open Sheet before it begins (11.3). |

The build issues paste the measured numbers in their pull requests; the test is what
keeps them true afterwards.

### 10.7 The format's length limits, confirmed

`tree-format.md` 5.7 fixed the limits from an assumed layout; 0.2 confirmed them
against six rows and a 640 x 304 text area, and #75 reopened them (core document
10.28). **The limits are confirmed unchanged again** -- 80-character titles, 600
characters and 8 estimated lines of description, 60-character Option titles and Source
labels, 3 Sources, 8 Options, 10 Images -- against the rows of 10.1 and a text area of
**640 x 394**, with two pixels to spare. `elsa-tree/3` changes the format for the
explainers and the Option pictures, not for a length, and no Tree is re-cut.

| Inside the text area | Height | Derivation |
|---|---|---|
| Main image | 60 | Fixed; the largest size that keeps every limit (`ADR-78-main-image-and-row-budget.md`). A Node without Images has the same 60 as an empty slot. |
| gap | 8 | |
| Title | 56 | 22 px on 28-px lines, about 55 characters a line: 80 characters is at most 2 lines. |
| gap | 8 | |
| Description | 192 | 16 px on 24-px lines, 75 characters a line at an 8.5-px advance: **8 lines = 600 characters**. |
| gap | 8 | |
| Sources | 60 | The 20-px heading line, then 13 px on 20-px lines, about 90 characters a line: 3 labels of 60 with two kind prefixes and separators is at most 2 lines. |
| | **392 of 394** | |

Five assumptions behind those numbers are re-derived by this layout. None moves a limit:

| `tree-format.md` 5.7 assumed | This layout | Effect on the limits |
|---|---|---|
| A vertical budget of chrome 44, Trail 64, Bubble 360, Branches 64, Carousel 80, disclaimer 28, and a 640 x 304 text area divided exactly. | Chrome 44, up-arrow band 26, Bubble 446, strip band 28, Answers 68, disclaimer 28; a text area of 640 x 394 holding 392 (above). The Trail row and the caption line paid for the main image, the Sources heading and the larger Answer buttons. | None: the description keeps its 192 pixels and 8 lines. |
| An Option Branch label of 150 px, 3 lines for 60 characters. | An Option button is 232 x 96 with **152 px of label at 16 px on 20-px lines**, up to four lines: 60 characters take 3 in a humanist face and 4 in DejaVu Sans; four buttons on a side, at a pitch of 111.5, are 384 of the 446. | None. |
| An Answer Branch of 640 px with an 80-character title on 1 line. | A 620 x 60 button with 580 px of label at 19 px bold on 24-px lines: the chrome word, a colon and 80 characters are at most 86, at least 43 a line in DejaVu Sans Bold: **2 lines**, 48 px in 60. | None. |
| A Trail of up to 6 Nodes at 213 px each. | No Trail is drawn; the up arrow carries the parent's title as its accessible name only. | None. |
| The Carousel as an 80-px row with a caption line of one or two lines for a 120-character description and credit. | A strip of 48-px thumbnails on the outline, no caption: the description is alternative text and the credit is read as the picture's description and shown whole in the enlarged view, where 5.7's "one line at 13 px" is what it assumed. | None. |

**The face the numbers hold in.** As in 0.2: the limits were measured in a humanist
sans, the widths above are re-derived in DejaVu Sans, the widest fallback a reader is
likely to meet, and the default type stack names Arial-metric faces before `sans-serif`
(`src/theme.ts`, 13.4), because the Bubble's text area holds the format's maximum in
those and not in DejaVu Sans, as 5.7 warns.

### 10.8 The explainer panel

**[#75], new.** A word of a Node's description may carry an explainer (`tree-format.md`
5.9): the Node lists its explainers -- an `id`, a `term` and a `text`, per language --
and marks each occurrence in the description as `[providers](#provider)`. Recorded in
`docs/adrs/ADR-78-explainers.md`.

- **The markup.** `src/markdown.ts` renders a mark as a focusable inline element whose
  next sibling is its panel, and the panel describes it:

  ```html
  <span class="term" tabindex="0" aria-describedby="e-provider">providers</span><span
    class="explainer" role="tooltip" id="e-provider"><b>provider</b> Someone who develops an AI system ... </span>
  ```

  The term is visibly marked as hoverable (a dotted underline in `accent-secondary`;
  the styling is the frontend's, and the Tree may not bold or emphasise the mark,
  `tree-format.md` 3.4). The panel holds the canonical `term` and the `text`. Ids are
  prefixed for a copy in a neighbour frame or an Overlay, as every id in the tree view
  is.
- **What a screen reader hears:** the marked words, then their description, which is
  the explainer -- `aria-describedby` on the term, `role="tooltip"` on the panel. Nothing
  else is announced on open or close.
- **The panel** is at most 320 pixels wide, 14-pixel text on 20-pixel lines, at most five
  lines for the 200-character maximum: at most 148 pixels tall with its heading and
  padding, filled `surface`, outlined in `rule`, over everything but a Sheet. In a text
  area narrower than 320 pixels -- a phone's, 10.5 -- the panel is as wide as the area
  and a line or two taller: 166 to 186 pixels at 360 x 640 (amended 2026-09-18, #83). It opens
  **on hover, on keyboard focus and on tap**; it closes **on leaving, on blur and on
  Escape**; one is open at a time. It never scrolls and never makes the page scroll
  (10.6 measures every page with each panel open).
- **Placement.** With JavaScript (`Explainer.tsx`, a client component) the panel is
  placed below the term's line when that fits inside the Bubble's text area and above it
  otherwise, and shifted sideways so that it stays inside the text area: at and above the
  guaranteed viewport, since the panel is at most 148 pixels and the area 394, one of the
  two always fits. Where neither fits -- an area 10.5 has shortened -- the panel takes the
  side with more room and lies against that edge of the text area, over the least of the
  text (amended 2026-09-18, #83). **Without
  JavaScript** the panel opens on hover and on focus by CSS alone (`:hover`, `:focus`),
  at the foot of the text area, full width, where it can never leave the Bubble; Escape
  and tap need the script. Inside an Overlay the same rules apply to the Overlay's text
  area.

### 10.9 The Overlay

**[#75], new.** An Option opens its target -- a side child -- in an Overlay over the
page (core document 3.2). Recorded in `docs/adrs/ADR-78-overlay.md`; the address rule
decides core document 10.27.

- **What it is.** The `Sheet` (12.3, 10.5), with the Option button as its control and
  one page: the target's **Interior** (10.3), rendered by the same component as the
  Bubble's, and under it the target's own Options, if it has any, as a list of at most
  eight 20-pixel lines of plain links (below). The panel is 760 x 608, centred, with
  24-pixel bands above and below and 60 each side (640 x 560 of content: the Interior's
  392, a gap of 8 and 160 of list), `surface` over the `scrim` veil, a 32-pixel round
  close cross at its top right corner. It never scrolls; the fixture `tests/fixtures/overlay/`
  is an explanation Node at every maximum with eight Options, and 10.6 measures it.
- **How it closes:** the cross, Escape, a click outside it. Focus moves to the cross on
  open and returns to the Option button on close. One Sheet is open at a time, so
  opening an Overlay closes any other Sheet and opening another Overlay closes this one.
- **The address does not change** when an Overlay opens or closes: the address is the
  page's, the page is the parent's, and a disclosure does nothing to the address bar.
- **The URL of an explanation Node renders its parent's page with that Overlay open.**
  **[#100]** For a path `/<tree>/<id-1>/.../<id-n>` the page finds its **centre** by
  reading **at most the last three entries**, from the end (`centreOf` in
  `src/neighbourhood.ts`; `docs/adrs/ADR-100-bounded-centre.md`):
  1. The explanation Nodes met walking back from `<id-n>`, **at most two**, are the
     **aside chain**; the last of them is rendered as the open Overlay. The walk stops at
     the first entry that is not an explanation Node, after two explanation Nodes, or at
     `<id-1>`, and **the entry it stops on is the centre, whatever its kind**.
  2. When the chain is two entries long and its first entry is **not an Option target of
     the centre**, that first entry is the centre instead, and the second alone is its
     chain.

  Both rules are what keep a page to the seventeen Nodes of 11.2: the centre is found in
  three reads whatever the path's length, and the one Overlay that is not an aside of
  the centre is the only Node on the page that is neither the centre nor its neighbour.
  In a path whose every entry is an Option or Answer target of the one before -- every
  path the application's own links build -- the centre is **the last question Node or
  Terminal** when at most two explanation Nodes follow it. It is an **explanation Node**
  in three cases, each shown as the explanation-Node-as-centre situation of 10.3: a path
  with no question Node or Terminal in it (`/<tree>/<explanation-id>`, the one with no
  parent to show; every Node stays reachable by its URL); a path that ends in three or
  more explanation Nodes, where the centre is the third from the end -- an aside of an
  aside of an aside, which the format allows (`tree-format.md` 5.4, 5.6) and a
  second-level Overlay's own Options link to (below), though no Tree or fixture has one
  on 2026-09-19; and, only in a path that ignores adjacency, rule 2.

  The Trail (for the up arrow and the `up` placement) is the path before the centre; the
  centre's Branch hrefs (`followHref`, `trailHref`) are built from the path **up to the
  centre**, so answering the parent's question after reading an aside does not carry the
  aside into the Trail. "Parent" is what the path says, entry by entry, as 4.3 has
  always read it (adjacency is not checked): an explanation Node reached by two different
  Options has a URL under each parent.
- **A second-level Option** -- an Option of the explanation Node in the Overlay -- is a
  plain link to **[#100]** `<the Overlay's own path>/<its target id>` (for the first
  Overlay, `<the page's path>/<this explanation id>/<its target id>`), which renders
  the same parent's page with the deeper Overlay open, in place of this one. The way back
  to the first is the browser's back or the first Option's button. **[#100]** The Options
  of that deeper Overlay link on in the same way, from its own path, to a path ending in
  three explanation Nodes, which the centre rule above renders centred on the first of them, with its
  parent above it and the third open.
- **The Overlay's heading is a link to the explanation Node's own address**, so a reader
  can copy an address for the aside (the share button copies the page's) and a reader
  without JavaScript can open it as a page.
- **The asides are pre-rendered, closed.** The page carries the Interior of every Option
  target of the centre (11.2), so opening one costs no request: its main image is the
  file the button already shows. **[#100]** An Overlay has **no strip**: the target's
  Images after its main image are not in the Overlay, because the panel's 560 pixels of
  content are the Interior's 392, the gap of 8 and the list's 160, and a 48-pixel strip
  has no room in them (`docs/adrs/ADR-100-overlay-without-strip.md`). They are drawn
  only where the explanation Node is the centre (10.3) and has its own Carousel: at
  `/<tree>/<explanation-id>`, which no link the application renders leads to, and as the
  first of three explanation Nodes ending a path (the centre rule above).
- **Without JavaScript** the Option button is a native disclosure (`<details>`): it opens
  the Interior laid over the page as every Sheet does (section 14), and a second click on
  the button, which stays uncovered beside the Bubble, closes it. The cross, Escape and
  the click outside need the script. A URL-opened Overlay is rendered `open` by the
  server, so a shared link shows the aside with or without script.
- **Gone with the side slide:** the `side` direction (11.2), the Option slide (11.1,
  11.3), the `back` Branch and the `explanationOnly` hint (10.3), and the chrome keys
  `back` and `explanationOnly`.

## 11. Transitions and the neighbourhood

**[v0.2], new; [#75] amended 2026-09-17 (issue #78).** The owner, in issue #35: "I want
the transitions to slide over the tree to the next node", and "this might mean we want to
already render the next two nodes in each direction of the screen (still lazy loading),
but then if someone clicks through, the navigation feels smooth." With #75 nothing
slides sideways: an Option opens an Overlay (10.9), and the way back is one step up.

Recorded in `docs/adrs/ADR-38-neighbourhood.md` (which supersedes
`ADR-5-lazy-loading.md`) and `docs/adrs/ADR-38-transitions.md`, both superseded in part
by `ADR-78-overlay.md`, `ADR-78-answer-buttons-and-up-arrow.md` and
`ADR-78-fan-out-and-option-picture.md`.

### 11.1 The tree layer

Everything between the chrome bar and the disclaimer -- the up arrow, the Bubble, the
Option buttons and their Overlays, the Answer buttons, the strip, and the neighbour
frames -- lives in one element, the **tree layer**. The layer is larger than the
viewport; the viewport shows the part of it around the current Bubble. A transition is a
`transform: translate` on that one element and nothing else moves: one element, one
transform.

Each **placed neighbour has a direction and a slot**, and the direction is where its
*target* is drawn: `up` for the parent, `down` for an Answer target. The neighbour is
rendered as a full frame, one viewport away from the centre in that direction, offset by
the slot. Following the control that leads to it -- the up arrow, an Answer button --
translates the layer by exactly that offset, so the target Bubble arrives in the centre.

- **The up arrow slides up.** Its target is the parent, which 11.2 places `up`; the
  control sits on the Bubble's top outline and the target above it, so the control and
  the direction agree.
- **`startAgain` has no direction and does not slide.** It leads to the root Node with an
  empty Trail, which is a restart rather than a step through the tree. It is an ordinary
  link (11.3).
- **An Option does not slide.** It opens an Overlay in place (10.9); its target is an
  aside of the page, not a placement in the layer. There is no `side` direction.
- **No item of any Sheet slides**, and a slide never begins with a Sheet open (11.3): a
  second-level Option inside an Overlay, an Option in the collapsed `options` Sheet, a
  Source in the collapsed Sources Sheet are plain links or open in a new tab.

### 11.2 The neighbourhood: which Nodes are pre-rendered

`src/neighbourhood.ts` is the one place that answers this, for the page and for nobody
else:

```ts
export type Direction = 'up' | 'down'
export interface Placed { node: Node; href: string; address: PageAddress; direction: Direction; slot: number }
export interface Aside  { node: Node; href: string; address: PageAddress }        // an Option's target, for its Overlay
export interface Neighbourhood { placed: Placed[]; asides: Aside[] }             // at most 7 placed, at most 8 asides
export function neighbourhood(tree: Tree, at: PageAddress, node: Node): Promise<Neighbourhood>
```

The page passes the centre Node it has already read, so each Node is read once, and
each placement and aside carries the address its `href` names (an aside's is the
explanation Node's own address under this centre, 10.9), from which the neighbour's own
controls are built.

Given the centre Node and the Trail that reached it:

| | Which Nodes | At most |
|---|---|---|
| `up` | The last Trail entry: the parent. | 1 |
| `down` | The centre Node's Answer targets, and **their** Answer targets. | 2 + 4 = 6 |
| asides | The centre Node's Option targets, in Option order. | 8 |
| | **Total neighbours** | **15** |

- **`up` is the parent only.** The grandparent is no longer reachable in one click (the
  Trail Branches are gone, 10.2), so it is not placed. `down` is the Answer targets and
  theirs, and nothing else; `startAgain` has no placement at all.
- **This is "the next two nodes in each direction", read as directions of the screen**:
  two deep down the answer path; one up, because that is as far as one click goes; the
  Options one out as asides, because they fan (a Node may have eight) and an aside's own
  Options are links, not Overlays within Overlays.
- **The set is deduplicated by Node id** across placements, and an aside that is also
  placed is still an aside (it is drawn in the Overlay, not in the layer). A Link to an
  id the Tree does not contain is dropped, not thrown: the loader has already rejected
  such a Tree at start-up.
- **A page reads at most 17 Nodes**: the centre, 15 neighbours, and the one Overlay a
  URL may name that is not an aside of the centre (a second-level aside, 10.9), which
  the page reads by id. **17 is a contract, not a configuration.** There is no
  environment variable and no prop that raises it; widening it is an `architecture`
  issue, because it is the number that stands between this application and "the
  browser received the whole Tree".
- `neighbourhood` obtains its Nodes by calling `getNode` once per id. The loader's
  interface does not change to serve it (5.1): a page may call `getNode` at most 17
  times, and `getTree` does not exist to call.

### 11.3 How they arrive, and the slide

**The neighbours are already in the page.** The server renders the placed neighbours
into the page as the tree layer's payload; they enter the DOM only during a slide. At
rest, and without JavaScript, the DOM holds the centre frame only, with its asides as
closed disclosures (10.9). No second route, no JSON API, no client fetch on load. This
costs nothing on the server, because `elsa-tree/3` is one file already parsed in memory
(`tree-format.md` section 6). `transition.spec.ts` pins it: with JavaScript disabled the
page holds exactly one `.tree-frame`.

**A neighbour frame is the tree view's layout, trimmed** (#60, by the owner's decision of
2026-09-14): it draws its own up arrow, Interior, Option buttons and Answer buttons, and
none of its Overlays' interiors and no strip pictures (11.4). The frame is inert and
`aria-hidden`; the page that replaces it in step 4 carries everything.

Following the up arrow or an Answer button, with JavaScript:

1. The control is an ordinary `<a href>`. `Slider` intercepts the click and closes any
   open Sheet first.
2. It translates the tree layer toward the target's position. The target frame is
   already rendered and already carries its own controls, so what the reader sees
   arriving is a complete Bubble, not a placeholder.
3. In parallel it starts the client navigation to the same `href`. That fetches **one**
   page payload: the target's page, carrying the target and **its** neighbourhood.
4. When the payload arrives the tree layer is replaced by the target's own layout, with
   the target now the centre Bubble. The transform resets; nothing visibly jumps.
5. The URL is the target's URL -- `followHref` for an Answer, `trailHref` for the up
   arrow (4.1) -- pushed exactly as a plain link would have left it. Reload, back and
   copy-link keep working.

**A control whose target is not placed navigates without a slide.** `startAgain`; an
entry of any Sheet, including a second-level Option in an Overlay and an Option in the
collapsed `options` Sheet; the Overlay's heading link; and a control whose target another
direction has already placed at a different address, so that 11.2's deduplication leaves
its own address without a placement (a question Node whose `yes` or `no` targets a Node
already on its Trail, or an address whose Trail repeats a Node). A control is marked
`data-slide` only where its `href` is a placement's; two controls with one `href` share
the placement.

**A slide never begins with a Sheet open.** A Sheet's panel and backdrop are `position:
fixed`, and the sliding layer's `transform` makes the layer the box a fixed descendant is
laid out in, so an open panel would travel with the tree; `Slider` closes every open
Sheet in the layer before the layer moves.

Back and forward are the browser's, and reverse the slide when the payload is in the
framework's cache. `prefers-reduced-motion: reduce` removes the motion and keeps the
navigation. **Framework prefetching of the controls' links is off** (`prefetch={false}`).

### 11.4 Images during a transition

A neighbour frame's markup contains **no image URL at all** -- not for its main image,
not for its strip, not for its Option buttons' pictures, not in a `data-` attribute. The
browser therefore cannot request an image of a Node that is not on screen, whatever a
lazy-loading heuristic decides. The images of a target arrive with its page payload, in
step 4 above: a frame or two after the slide, the main image, the strip and the buttons'
pictures fill.

An **aside** is on the page: its Overlay's main image is the same `/images/<file>` URL
its Option button shows, which the browser asks for once. **[#100]** An Overlay has no
strip (10.9), so an aside names no other image URL, open or closed.

### 11.5 The accounting: what a request may and may not carry

This is the testable form of core document section 9, and `transition.spec.ts` asserts
it by recording every network request.

| | May | May not |
|---|---|---|
| A Node page response | The centre Node, at most 15 neighbours and the one Overlay the URL may name (11.2) -- at most **17 Nodes** -- in the page's own language only; button labels from the title index; the Theme; chrome. | An 18th Node. Any Node's text in another language. Any image or font bytes. Any file path. The Tree file. |
| One navigation | Exactly **one** page payload. | A second payload for the same navigation; a prefetch of any control's page. |
| `GET /images/<file>` on load | One image file of the centre Node; and, **for each Option of the centre Node, exactly one file: the target's first Image** (its main image, on the button) -- core document 10.29. | Any other Image of an Option's target; an image of any placed neighbour; an image of any other Node, at any time, for any reason. |
| `GET /images/<file>` after an Overlay is opened | The image files of the Node in the Overlay. | The same list. |
| `GET /theme/<file>` | One file the Theme names (5.5). | A file in `theme/` the Theme does not name; anything outside it. |
| Any request at all | This origin. | Any other origin (13.5). |
| Any route | -- | There is **no** route that returns more than one Node, and none that returns the Tree. |

Walking the whole Tree still downloads it one Node at a time, seventeen at a time at
the very most, and the server's memory holds the Tree the browser never gets.

## 12. The Carousel

**[v0.2], new; [#75] re-frozen 2026-09-17 (issue #78).** The owner, in issue #75:
"There can be more images than the main image, these should be shown in the carroussell,
however, the rule was that the carrousel will not have any buttons, so there will just be
the images, and, I want the carroussel of images to be displayed at the lower edge of the
opened node bubble. The maps text should also not be visible, it can be as part of the
accessiblity data on the image for blind people, but we do not want to display it."
Recorded in `docs/adrs/ADR-78-carousel.md`; the 0.2 record is `ADR-38-carousel.md`,
superseded in part.

### 12.1 What it shows

The Carousel is the strip on the Bubble's lower outline (10.1). It shows **this Node's
own `images` after the first**, in the order the author wrote them (`tree-format.md`
5.2: the list is the order, the first entry is the main image). At most nine. Nothing
else: an Option's picture is its target's main image, shown on the Option button and,
with its credit, in the target's Overlay; it does not join this Node's strip.

A Node with fewer than two Images has no strip and no tab stop there; the strip band of
10.1 is reserved on every Node all the same, so the Bubble sits in the same place and the
transition of section 11 has nothing to reflow.

### 12.2 The strip, and its one exemption from the no-scroll rule

The strip is a horizontal row of the Node's second and later Images as **48-pixel round
thumbnails at a 56-pixel pitch**, in a **400-pixel box centred on the Bubble**, its
vertical centre on the Bubble's bottom outline, with `scroll-snap-type: x mandatory`.
Seven thumbnails are visible; more scroll. The box's upper half lies in the Bubble's
lower rim, 2 pixels clear of the text area (10.1). The strip is the **one element in the
document allowed to scroll**, and only horizontally, and only within its own box (10.6).
That exemption buys a great deal:

- it works **without JavaScript** -- the strip is a native scroll container, and a
  keyboard user can move through it with the arrow keys because it is focusable;
- there are **no buttons, no position text and no caption line** (the owner, #75): the
  scroll position is the only state, and nothing about it can make the *page* scroll.

**Nothing is written under the pictures.** An Image's `description` is its alternative
text and, with the `enlarge` word, the thumbnail's accessible name; its `credit` is the
thumbnail's accessible description (`aria-describedby`) and is shown whole in the
enlarged view (12.3). That is where core document section 8's credit on every Image is
met (10.26; PROPOSED for the owner on #78).

### 12.3 Keyboard and the enlarged view

| Control | Behaviour | Chrome key |
|---|---|---|
| The strip | Focusable region, named for assistive technology. Left/Right move the selection, Home/End jump to the first/last, Enter or Space enlarges the selected Image. | `images` |
| A thumbnail, and the main image in the Interior | An `<a href="/images/<file>">` around the `<img>`, named by `enlarge` and the description, described by the credit. With JavaScript the click is intercepted and opens the enlarged view; without it, the link opens the file. | `enlarge` |
| The enlarged view | A `Sheet`: the full image bounded to the viewport so that it never scrolls, with the `description` and the `credit` beneath it, one Image per page, `previous` and `next` to page through the Node's Images (the main image first), the position spoken as `imageCount`. Closed by Escape, by the close cross, or by clicking outside; focus returns to the picture that opened it. | `close`, `previous`, `next`, `imageCount` |
| The collapsed control (10.5 step 1) | A 20-pixel pill on the outline showing `imageCount`, which opens the enlarged view. | `imageCount` |

The enlarged view is the same `Sheet` as the Overlay and the collapsed Sheets of 10.5
-- one overlay concept, one set of keyboard rules, one implementation.

### 12.4 Loading the image files

- Only the images 11.5 allows are ever requested: the centre Node's, one per Option (the
  target's main image, on the button), and an open Overlay's.
- Within the strip, each `<img>` carries `loading="lazy"` and explicit `width` and
  `height`, so the browser fetches the thumbnails at and near the visible part of the
  strip and not the whole list. A Node may name ten Images; a reader who never scrolls
  the strip fetches the main image and the seven the box showed.
- The enlarged view shows the file the page already has: enlarging costs no request.
- An Option button's picture is its target's first Image, one file per Option, so a Node
  with 8 Options and 10 Images can ask for up to 18 image files on load, as before;
  `walk.spec.ts` counts the requests on `annex-i-legislation`: nine.

## 13. The Theme: how a Tree's look reaches the page

**[v0.2], new.** The owner, in issue #35: the styles and logo must be "hosted in the
datastructure and not in the frontend itself, so a different ELSA-lab can load in their
own datastructures and their logo is displayed". The Theme block is
`tree-format.md` 4.3; this section is how it becomes a page. Recorded in
`docs/adrs/ADR-38-theme-delivery.md`.

### 13.1 One `<style>` element, emitted by the root layout

`src/theme.ts` turns a `Theme` (or its absence) into one string; `layout.tsx` puts that
string in a `<style>` element in `<head>`, on every page. Nothing else in the
application writes a colour or a font name.

```css
@font-face { font-family: 'Open Sans'; font-weight: 400; font-style: normal;
             src: url('/theme/open-sans-400.woff2') format('woff2'); font-display: swap }
/* ... one rule per file of each family ... */
:root {
  --elsa-background: #ffffff;  --elsa-surface: #f0f3f7;
  --elsa-text: #2d2e33;        --elsa-text-muted: #a3a4a8;
  --elsa-accent: #ffc600;      --elsa-accent-secondary: #41ab64;
  --elsa-danger: #e44e56;
  --elsa-on-accent: #2d2e33;   --elsa-on-accent-secondary: #ffffff;  --elsa-on-danger: #ffffff;
  --elsa-scrim: #2d2e33;
  --elsa-font-body: 'Open Sans', <the default stack>;
  --elsa-font-heading: 'Nova Square', var(--elsa-font-body);
  color-scheme: light;
}
```

- **The seven colour roles become `--elsa-<role>` verbatim.** They are the seven of
  `tree-format.md` 4.3.3 and there is no eighth. **[#75]** `accent-secondary` is the
  walk's controls -- the Answer buttons, the up arrow, `startAgain` -- and links, and
  `--elsa-on-accent-secondary` letters them; the Answer label is large text, so a Theme
  must give it at least 3 : 1 there, which on the first Tree's `#159a2f` is 3.69 : 1 under
  white (10.3, `ADR-78-answer-buttons-and-up-arrow.md`). The green is a Theme value; the
  stylesheet still holds no colour.
- **Four values are derived at render time** (amended 2026-09-10, PR #52: the fourth,
  `--elsa-scrim`, replaced a backdrop keyed to `text`, which advanced instead of receding
  on a dark Theme; `ADR-38-theme-delivery.md` decision 3 and `ADR-38-modules-and-tests.md`
  decision 1 carry the amendment), and each is one CSS cannot compute.
  Everything else the stylesheet wants -- a hover shade, a disabled control, a border --
  it derives in CSS with `color-mix()` from the seven. `theme.ts` computes four values;
  it is not a colour system.
  - **Three because CSS cannot compute contrast:** `--elsa-on-accent`,
    `--elsa-on-accent-secondary` and `--elsa-on-danger` are whichever of `text` and
    `background` has the higher WCAG relative-luminance contrast against that accent.
  - **One because CSS cannot compare luminance:** `--elsa-scrim` is whichever of `text`
    and `background` is the darker. It is the colour the stylesheet lays over the page
    behind the enlarged Image, and a backdrop that is not told which way the palette
    runs recedes on a light Theme and advances on a dark one. It names no new colour --
    it is one of the seven, picked -- and `color-mix()` cannot reach past the darkest
    colour a Theme owns, so on a dark palette the backdrop meets the page rather than
    dimming it further and the dialog's `surface` is what lifts it.
- **Whether the Theme is dark is derived, not declared:** if the relative luminance of
  `background` is below 0.5 the page is dark, and `logo.dark` is used where it exists.
  The format needs no key for it and a Theme author cannot get it wrong. The same test
  writes the block's one non-custom declaration, `color-scheme`, which is the UA hint
  for form controls and scrollbars and not an eighth role: the stylesheet has no
  `prefers-color-scheme` block, because dark is the Tree's property and not the
  reader's machine's.
- **Fonts:** one `@font-face` per file, with `font-weight` and `font-style` reproduced
  verbatim from the Theme and `src` pointing at `/theme/<file>` (5.5). `font-display:
  swap` so a slow font never blanks the text. The `body` family becomes
  `--elsa-font-body`, the `heading` family `--elsa-font-heading`; a Theme that gives
  only one role gets the documented fallback of `tree-format.md` 4.3.2.

### 13.2 The logo

In the chrome bar: `<img src="/theme/<light or dark>" alt="<logo.alt in the content
language>">`. If the Theme gives `url`, the logo is wrapped in
`<a href="<url>" target="_blank" rel="noopener noreferrer">`; the URL is linked to and
never fetched. If it gives `icon`, the layout emits `<link rel="icon"
href="/theme/<icon>">`. A Tree with no `logo` shows the Tree's `title` as text in the
same place (`tree-format.md` 4.3.1).

An SVG logo is shown through `<img>`, never inlined, so script inside it cannot run;
5.3's headers make it inert even when fetched directly.

### 13.3 Escaping, and why it matters here

The Theme is third-party data and this section writes it into a stylesheet -- the one
place in this application where author text becomes code. `src/theme.ts` is the only
module allowed to build that string and it holds every rule:

- **Colours** must match `^#[0-9a-f]{6}$`. The loader validates it
  (`tree-format.md` 4.3.3) and `theme.ts` checks it again before emitting; a value that
  fails is not emitted and the default for that role is used. Two checks, because one
  of them is at the sink.
- **A font `family`** is emitted inside single quotes with `'` and `\` escaped. A family
  name containing a control character, a newline, `;`, `{`, `}` or `<` is refused and
  the default stack is used for that role.
- **The whole emitted string** is checked to contain no `</style>` sequence before it is
  put in the element. Nothing is ever emitted with `dangerouslySetInnerHTML` other than
  this one checked string.
- **File names** are already the grammar of `tree-format.md` 3.6 and are re-checked by
  `themePath` (5.5) before any file is opened.

`theme.test.ts` (section 7) is written against this list.

### 13.4 A Tree without a Theme, or with half of one

The frontend's plain default is a palette of the same seven roles and the system font
stack, written once in `src/theme.ts` and nowhere else. The three parts of a Theme are
independent (`tree-format.md` 4.3), and each is taken whole or not at all:

| The Tree gives | The page uses |
|---|---|
| no `theme` | The default palette, the default type stack, the Tree's `title` as text where the logo would be. |
| `colours` only | Those seven colours; the default type stack; the title as text. |
| `fonts` only | The default palette; those families for the roles they declare, the default stack for a role they do not. |
| `logo` only | The default palette and type stack; that logo. |
| a `colours` block missing a role | Cannot happen: the loader rejects it (`tree-format.md` 4.3.3 is a closed set). |

The frontend never merges half a palette with half a default, because a palette is
designed as a set.

### 13.5 No third-party request, ever

- The stylesheet contains **no colour literal and no `font-family` literal** -- only
  `var(--elsa-*)`. `stylesheet.test.ts` asserts it. That is core document section 9's
  "the frontend must never carry a lab's branding in its code", mechanically.
- No `@import`, no `<link>` to another origin, no `next/font`, no analytics, no icon
  CDN, no map tile, nothing. Fonts come from the Tree's folder through `/theme/<file>`.
- The only external URLs in the application are Source URLs and the logo's `url`, which
  are `<a target="_blank" rel="noopener noreferrer">` and are never fetched by the app.
- `theme.spec.ts` records every request the browser makes while loading a themed Node
  page and asserts that every one of them is on the page's own origin.

## 14. What holds without JavaScript

**[v0.2], new; [#75] amended 2026-09-17 (issue #78).** Version 0.1 promised that
everything but the thumbnail enlarge and the share button worked without JavaScript. The
slide and the pre-rendered neighbours need client code, so that promise has to be
restated rather than repeated. It is restated as a stronger one than "the page renders":
**without JavaScript this is a working decision-tree tool, and every guarantee of core
document section 9 still holds.** Recorded in `docs/adrs/ADR-38-without-javascript.md`;
the rows for the Overlay, the explainer panel and the up arrow in
`ADR-78-overlay.md`, `ADR-78-explainers.md` and `ADR-78-answer-buttons-and-up-arrow.md`.

| Works without JavaScript | How |
|---|---|
| The whole current Node | The server returns complete HTML: the tree view of section 10 with the centre Bubble and its Interior -- main image, title, description with its marked terms, Sources under their heading -- and a Terminal's badge. |
| The up arrow and the Answer buttons | Ordinary `<a href>`. Following one loads the target's page. The tree is redrawn around the new Node instead of sliding to it. |
| Going back up the Trail | The up arrow is a link that discards the later Trail, exactly as 4.1 says: the URL *is* the Trail. Every Trail entry is reachable one arrow at a time, or by the browser's back. |
| The Overlay | A native disclosure (`<details>`): the Option button opens its target's Interior laid over the page, as every Sheet does; a second click on the button, which stays uncovered beside the Bubble, closes it. A URL that names an explanation Node is rendered with its Overlay `open` by the server (10.9), so a shared link shows the aside. The Overlay's heading is a plain link to that address, and a second-level Option is a plain link to the deeper one. |
| The explainer panel | Opens on hover and on keyboard focus by CSS alone, at the foot of the text area (10.8); the explanation is in the document and is the term's accessible description whether or not the panel is open. |
| The Carousel | A native scroll-snap strip (12.2): every picture is reachable, named by its description and described by its credit. |
| The credit of every picture | A `<noscript>` stylesheet shows the collapsed control of 10.5 step 1 beside the strip at every size, and that control opens the enlarged view as pages of disclosures, one picture per page with its description and its credit (12.3). |
| The language switch | Links with `?lang=` (4.1). |
| The share link | The address bar: the page's own URL is the share link (4.1). |
| The Theme | Colours, fonts and logo are server-rendered CSS and plain `<img>`; a Tree's identity does not depend on a script. |
| The no-scroll rule | CSS, and the length limits of the format. 10.6's test runs with JavaScript disabled too, with every Overlay open and every explainer panel focused open (`no-scroll.spec.ts`; the no-script walk of the controls and the Sheets is in `tree-view.spec.ts`, section 7). |
| The disclaimer | Rendered in the layout, on every page. |

| Needs JavaScript | What a reader without it gets instead |
|---|---|
| The slide transition | A normal page load. Same URL, same Node, no motion. |
| The pre-rendered neighbour frames | The server renders them into the page as the tree layer's payload; they enter the DOM only during a slide. At rest, and without JavaScript, the DOM holds the centre frame only (11.3). No image of another Node is requested either way, because a neighbour frame carries no image URL (11.4). |
| The Overlay's cross, Escape and the click outside | The Option button's second click closes it (above). |
| The explainer panel beside its term, Escape and tap | The panel at the foot of the text area, by hover and focus (above). |
| The enlarged view in place, from a click on a picture | The image file, opened by the link; and the collapsed control's disclosure (above), which holds the credit. |
| The Sheets of 10.5 | Below the guaranteed viewport, a collapsed group falls back to the plain list it collapses -- the markup is present and CSS hides it only where a Sheet can open it. A reader without JavaScript at 360 px sees a longer page laid out to fit, never a control that does nothing. A list longer than one page of eight is pages of nested native disclosures: `next` opens the next page and the stylesheet hides the one before it, so no panel is ever asked to hold more than fits, at any viewport of 10.6 (#41). The control that opened a Sheet stays above its panel, and a second click on it closes the Sheet (#59). |
| The share button's copy | The address bar. The button is not shown when it cannot work (#86 repairs what it does with script). |
| The 404 page's body | The single framework exception, 4.3, unchanged. |

**The rule this leaves for every build issue:** a client component may only enhance
markup that is already correct without it. If a feature cannot be expressed that way, it
does not go in the client component -- it goes in the server render or it does not go
in.
