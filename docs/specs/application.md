# Application contracts

> Status: FROZEN -- 2026-09-10 (issue #38), version 0.2. These are the contracts the
> build issues (#39 loader, #40 theme, #41 tree view, #42 transitions, #43 carousel) are
> built against. Changing one requires a new `architecture` issue. The Tree file format
> they consume is frozen separately in `docs/specs/tree-format.md` (`elsa-tree/2`, issue
> #37).
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
**Bubble** in the centre of a screen-sized tree, the Trail as clickable **Branches**
above it, its Answer targets as Branches below and its Option targets as Branches
beside, its Images as a **Carousel** under it. Following a Branch slides the tree until
the target Bubble is in the centre, and ends at exactly the URL a plain link would have
reached. The page never scrolls. Colours, fonts and the logo come from the loaded
Tree's Theme and are served from that Tree's folder, so no request ever leaves this
origin. Chrome comes in English and Dutch and follows the content language, falling
back to English. There is no database, no account, no cookie, no analytics, and nothing
the app does depends on a hosting vendor.

## 1. Framework and rendering

| Item | Contract |
|---|---|
| Framework | Next.js, App Router, React, TypeScript (strict). Exact versions are pinned in `package.json` by the scaffold issue; the current stable major at that time. |
| Server-side rendering | React Server Components. The Node page is an `async` server component; the first response to every URL is complete HTML, with the single exception named in 4.3 (the 404 page). |
| Client-side JavaScript | React plus **four** client components: `Slider` (the slide transition and the pre-rendered neighbours, section 11), `CarouselButtons` (the Carousel's previous and next buttons, section 12 -- the Carousel itself is a server component), `Sheet` (the one overlay: the enlarged Image, the full Trail, and the collapsed Options and Sources of 10.5) and `ShareButton`. Everything else -- navigation, the Trail, the Branches, the language switch, the Carousel's strip -- is links, CSS and ordinary form-free markup. **Section 14 states exactly what a reader without JavaScript gets**, and it is a working application, not a degraded one. The 404 page's body is the single exception (4.3). |
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
| `sources`, `sourceLegal`, `sourceCaseLaw`, `sourceLiterature` | Heading and the three Source kind labels. |
| `images`, `enlarge`, `close` | The Carousel's accessible name and the enlarged view (section 12). |
| `trail`, `start` | The accessible name of the Trail Branches; the Branch to the root Node. |
| `share`, `copied` | The share button and its confirmation. |
| `language` | Label of the language switch. |
| `outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited`, `outcomeRefer` | Badge text for the four Terminal outcomes. |
| `explanationOnly` | Hint on an explanation Node that the answer is given on the previous step. |
| `disclaimer` | The permanent "not legal advice" footer. |
| `notFoundTitle`, `notFoundText` | The 404 page. |
| **`back`** | The Branch below the Bubble of an explanation Node or a Terminal, which returns to the Trail entry above it (10.3). |
| **`startAgain`** | The second Branch below a Terminal, which returns to the root Node with an empty Trail (10.3). |
| **`trailMore`** | The collapsed middle of a long Trail; takes the number of hidden entries (10.2). |
| **`previous`**, **`next`** | The Carousel's two buttons (section 12); also the two buttons of a paged Sheet. |
| **`imageCount`** | The Carousel's position indicator: which Image of how many is selected. |
| **`minimumSize`** | The notice shown below the smallest supported viewport (10.5). |

New in 0.2: `back`, `startAgain`, `trailMore`, `previous`, `next`, `imageCount`,
`minimumSize`. Keys that take a number (`trailMore`, `imageCount`) are functions of that
number in `src/chrome.ts`, not strings with a placeholder, so that a language which
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
interface Manifest { format: 'elsa-tree/2'; languages: string[]; defaultLanguage: string;
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
interface Option { title: LocalisedText; target: string; images: Image[] }
type Outcome = 'not-applicable' | 'applicable' | 'prohibited' | 'refer'
type Node = {
  id: string; title: LocalisedText; description: LocalisedText;
  metadata: { version: string; [key: string]: unknown };
  sources: Source[]; images: Image[]; options: Option[]
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
| A request for a Node page | Nothing from disk. The current Node and its neighbourhood -- **at most 17 Nodes** (section 11) -- from the index, and Branch labels from the title index. | Complete HTML: the tree view of section 10 with the current Node as the centre Bubble, its Branches, its Carousel with an `<img loading="lazy">` per Image of this Node, the neighbour Bubbles of section 11 (**without any image URL**), chrome, the Theme's `<style>` block, the disclaimer, the stylesheet and the client bundle. No image bytes, no font bytes. |
| After the HTML | -- | The image files this Node's Carousel and Option Branches name, through `GET /images/<file>`; the Theme's font and logo files, through `GET /theme/<file>`. Nothing else, and nothing from another origin. |
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
├── trees/                   Tree data: one folder per Tree (elsa-tree/2)
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
│   │   ├── TreeView.tsx     [v0.2] server: the whole tree layer -- Trail Branches,
│   │   │                    centre Bubble, out-Branches, neighbour Bubbles (10, 11)
│   │   ├── Bubble.tsx       [v0.2] server: one Node as a Bubble, centre or neighbour
│   │   ├── Branch.tsx       [v0.2] server: one Link as a Branch (link, label, thumbnail)
│   │   ├── Carousel.tsx     [v0.2] server: the Images strip and its caption line (12)
│   │   ├── CarouselButtons.tsx  [v0.2] client: the strip's previous/next buttons (12)
│   │   ├── Sheet.tsx        [v0.2] client: the one overlay -- enlarged Image, full
│   │   │                    Trail, collapsed Options, collapsed Sources (10.5, 12)
│   │   ├── Slider.tsx       [v0.2] client: the slide transition (11)
│   │   ├── ShareButton.tsx  client, unchanged
│   │   ├── LanguageSwitch.tsx  unchanged
│   │   └── Disclaimer.tsx   unchanged
│   ├── neighbourhood.ts     [v0.2] which Nodes surround this one, and in which direction (11)
│   ├── theme.ts             [v0.2] a Theme -> CSS custom properties and @font-face; the default (13)
│   ├── url.ts               the URL scheme (4)
│   ├── chrome.ts            chrome strings and fallback (3)
│   ├── config.ts            ELSA_TREE / ELSA_TREES_DIR; the one opened Tree
│   ├── markdown.ts          rich-text subset -> safe HTML
│   ├── tree/                the Tree loader module
│   │   ├── loader.ts        openTree and the Tree interface (5.1)
│   │   ├── validate.ts      the rules of tree-format.md section 7
│   │   └── types.ts         the types of elsa-tree/2 (5.1)
│   └── instrumentation.ts   startup validation (5.4)
├── scripts/validate.ts      `npm run validate`
├── scripts/migrate-tree.ts  [v0.2] elsa-tree/1 -> elsa-tree/2 (issue #39)
├── tests/                   Vitest tests, Playwright specs and fixtures (7)
├── package.json  package-lock.json  next.config.ts  tsconfig.json  vitest.config.ts
├── playwright.config.ts     [v0.2] in the contract now (7)
├── .nvmrc  .env.development
└── .orca/ .claude/ .github/ .devcontainer/   agent workflow (unchanged)
```

Gone with 0.1's view: `src/components/NodeView.tsx`, `Trail.tsx` and `Thumbnails.tsx`.
Their work is `TreeView` + `Bubble`, `Branch`, and `Carousel` + `Sheet`.

| Module | Owns | Does not |
|---|---|---|
| `src/tree/` (loader) | Reading, validating and indexing a Tree; handing out one Node, one title, one image path, one theme path. | Know URLs, chrome, React, or that a Bubble exists. |
| `src/neighbourhood.ts` **[v0.2]** | Which Nodes surround the Node on screen, in which direction and in which slot, and the bound on how many (11). One function. | Read files, render, or know what a Branch looks like. |
| `src/theme.ts` **[v0.2]** | A `Theme` (or its absence) turned into the exact CSS custom properties and `@font-face` rules the page emits, including the derived colours and every escape (13). | Know React, routes, or which element uses which property. |
| `src/url.ts` | Parsing a request into `{ treeId, trail, nodeId, lang }` and building every link. | Read files or render. |
| `src/chrome.ts` | The chrome strings and the language fallback rule. | Contain Tree content. |
| `src/config.ts` | Environment variables, reserved-id check, the process-wide opened Tree. | Parse Trees or URLs. |
| `src/markdown.ts` | The rich-text subset to HTML, HTML disabled, links in a new tab. | Accept raw HTML. |
| `src/components/` | Views. Server components take data and return markup; the four client components own exactly one interaction each (section 1). | Touch the file system, environment or request. Decide *which* Nodes are on screen -- that is `neighbourhood`. |
| `src/app/` | Routes: parse, load, hand to a view; redirects; the image and theme routes; 404. The `[lang]` layout sets `<html lang>` and emits the Theme. | Hold logic. Take the language from `searchParams` (4.4). |
| `next.config.ts` | The two rewrites of 4.4, plus the build settings of section 1. | Know which languages a Tree declares, or anything else about the application. |

Dependencies point inward, and the client components are leaves:

```
app  ->  components  ->  chrome, url, markdown, theme, tree/types
app  ->  neighbourhood  ->  tree (getNode, getTitle), url
app  ->  theme, url, chrome, config, markdown
config  ->  tree
tree/  ->  nothing in src/
next.config.ts  ->  nothing in src/
```

- **`src/tree/` still imports nothing from the rest of the application**, and nothing
  imports it to get more than one Node at a time except `neighbourhood`, which is where
  the bound lives.
- **The four client components import no server module.** `Slider` receives the
  positions it needs as props from `TreeView`; it never computes a neighbourhood, never
  fetches a Node, and never reads the Tree. `Sheet`, `CarouselButtons` and `ShareButton`
  take strings. This is what keeps the client bundle small and what makes section 14
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
| Browser runner **[v0.2]** | Playwright, `npm run test:browser`, `tests/browser/*.spec.ts`, against `next build` + `node .next/standalone/server.js`. **In the contract now**, because the no-scroll rule (10.6) is a statement about a laid-out document and cannot be asserted any other way. |
| Also in CI | `tsc --noEmit`, `next build`, `npm run validate trees/<each Tree>`, `npm run test:browser`. Command: `npm ci && npm test && npm run build && npm run test:browser`. |
| Loading a fixture | `const tree = await openTree(path.join(__dirname, 'fixtures', '<name>'))`. Never hand-built `Node` objects; never YAML read by a test. |
| Fixtures | `trees/ai-act-example/` (complete, `en` + `nl`, **with a Theme**); `tests/fixtures/single-language/` (`nl`, **no Theme**); `tests/fixtures/other-languages/` (`de`, `fr`, **with a Theme**); `tests/fixtures/invalid/<rule>/` (one Tree per validity rule); **[v0.2]** `tests/fixtures/full-node/` (one Node at every maximum the format allows: an 80-character title, a 600-character 8-line description, 3 Sources, 8 Options, 10 Images, and a 49-entry Trail to reach it). |
| Rendering views | `renderToStaticMarkup` from `react-dom/server` on the synchronous components, with data from the loader. |

**Which tests are unit and which need a browser.** The rule is: a claim about *markup*
is a unit test; a claim about *layout, motion or network* needs a browser.

| Unit (Vitest) | Asserts |
|---|---|
| `loader.test.ts` | Every validity rule via `invalid/<rule>/`; `getNode` returns one Node; malformed ids give `null`; **[v0.2]** `themePath` gives `null` for a file the Theme does not name, even when it exists. |
| `url.test.ts` | Parse and build are inverses; every 404 case of 4.3; the 50-id limit. |
| `routing.test.ts` | The two rewrites of 4.4, read out of `next.config.ts` itself. |
| `chrome.test.ts` | The table in 3.1; every key of 3.2 exists in both languages; **[v0.2]** `explanationOnly` fits the Bubble's rim in every language -- at most 80 characters (10.1). |
| `not-found.test.tsx` | The 404 page of 4.3. |
| `neighbourhood.test.ts` **[v0.2]** | The set for each Node kind; **never more than 16**; no id twice; a Link to an unknown id is dropped, not thrown; the Trail supplies `up`, the Answers `down`, the Options `side`; an empty Trail has no `up`. |
| `theme.test.ts` **[v0.2]** | The emitted properties equal the manifest's values; a Tree with no Theme, and one with only `colours`, get the documented defaults for the rest; the three derived `--elsa-on-*` colours; a `family` containing `'`, `\` or `</style>` is escaped or refused; a colour that is not `#rrggbb` is refused rather than emitted. |
| `stylesheet.test.ts` **[v0.2]** | `globals.css` contains no colour literal (`#rgb`, `#rrggbb`, `rgb(`, `hsl(`, a CSS colour keyword) and no `font-family` value that is not `var(--elsa-font-*)`. This is core document section 9's "the frontend must never carry a lab's branding in its code", as a test that cannot be argued with. |
| `views.test.tsx` | Each Node kind's structure (10.3): what the Bubble holds, which Branches exist, where they link; **[v0.2]** the Carousel's caption is at most 170 characters with the `credit` whole and the `description` shortened to fit (12.2). |
| `interop.test.tsx` | Below. |

| Browser (Playwright) | Asserts |
|---|---|
| `no-scroll.spec.ts` **[v0.2]** | The exact test of 10.6, at every named viewport, on every Node kind. |
| `transition.spec.ts` **[v0.2]** | The request accounting of 11.5: one page payload per navigation, at most 17 Nodes in it, no image of an off-centre Node, no request for the Tree; the URL after a slide equals the plain-link URL; back reverses it; `prefers-reduced-motion` removes the motion and keeps the navigation. |
| `theme.spec.ts` **[v0.2]** | Every request while loading a themed Node page is same-origin; the logo is visible; changing a colour in `tree.yaml` and restarting changes the page with no code change. |
| `no-js.spec.ts` **[v0.2]** | With JavaScript disabled, every promise of section 14 holds: the Branches navigate, a Trail Branch discards the later Trail, the language switch works, an Image opens, and the page still does not scroll. |
| `node-view.spec.ts`, `trail.spec.ts`, `language.spec.ts`, `deployment.spec.ts` | The 0.1 browser specs, kept: the URL scheme, the Trail, the language mechanism and the deployment shape are unchanged contracts and keep their tests. |

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
| 3.1 / 9 never the whole Tree, a bounded set of neighbours | 11.2 (at most 16 neighbours), 11.5 (the accounting), 5.2 (never, in any response) |
| 3.1 / 9 images only for the Node on screen | 11.4, 12.4 |
| 3.1 text has a maximum length | `tree-format.md` 5.7, confirmed against this layout in 10.7 |
| 3.2 the screen is a tree: Bubble, Branches above, Branches out | 10.1 to 10.3 |
| 3.2 / 9 the page never scrolls | 10.4 to 10.6; `no-scroll.spec.ts` |
| 3.2 smooth transitions, the tree slides | 11.1, 11.3 |
| 3.2 Images as a Carousel below the Bubble | section 12 |
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
| **[v0.2]** The Carousel: a scroll-snap strip of this Node's Images, enlarged in a Sheet | `docs/adrs/ADR-38-carousel.md` |
| **[v0.2]** The Theme: custom properties and `@font-face` emitted at render time, files from a route | `docs/adrs/ADR-38-theme-delivery.md` |
| **[v0.2]** What holds without JavaScript | `docs/adrs/ADR-38-without-javascript.md` |
| **[v0.2]** Modules, dependency direction and which tests need a browser | `docs/adrs/ADR-38-modules-and-tests.md` |

## 10. The tree view

**[v0.2], new.** The owner, in issue #35: "the view of the frontend in no way resembles
a tree"; the opened Node "should be displayed as a bubble, with the branches above
visible and clickable, and branches going out below or beside it for the children and
side children"; "a bubble is round btw". This section is the layout that makes that a
contract. Vocabulary is the core document's section 5: **Bubble**, **Branch**, **Trail**,
**Answer**, **Option**, **Carousel**.

Recorded in `docs/adrs/ADR-38-tree-view.md` and `docs/adrs/ADR-38-no-scroll.md`.

### 10.1 The layout

One screen, six rows, nothing outside them. The picture at the guaranteed viewport of
1280 x 640 CSS pixels, which is also the smallest the full arrangement is designed for:

```
+--------------------------------------------------------------------------------+  44
|  [logo]  Tree title                                    [language]  [share]      |      chrome bar
+--------------------------------------------------------------------------------+
|      ( start )----( ... 3 )----( Material scope )----( Prohibited practices )   |  64  the TRAIL:
|            \___________|______________|_________________________/               |      Branches ABOVE
+--------------------------------------------------------------------------------+
| +------------+ |                                            | | +------------+ |
| | Social     | |         .------------------------.         | | | Emotion    | |
| | scoring    |-+-------(                            )-------+-| | recognition| | 360
| +------------+ |       (   Prohibited practices?     )       | | +------------+ |
| +------------+ |      (   -------------------------   )      | | +------------+ |
| | Biometric  |-+-----(    Does your AI system use one  )-----+-| | Predictive | |
| | categorisa.| |      (   of the practices Article 5    )     | | | policing   | |
| +------------+ |       (  prohibits? ...                )     | | +------------+ |
|   OPTIONS      |         '------------------------'           |    OPTIONS      |
|   (side        |            the BUBBLE (round)                |    (side        |
|    children)   |            760 x 360, text area 640 x 304    |     children)    |
+--------------------------------------------------------------------------------+
|              ( yes: Annex III areas )      ( no: General-purpose AI )           |  64  the ANSWERS:
|                       \                            /                            |      Branches BELOW
+--------------------------------------------------------------------------------+      (children)
|   [img] [img] [img] [img] [img]   < >                                          |  80  the CAROUSEL
|   Map of the EU member states -- European Commission, CC BY 4.0                |      (60 strip + 20 caption)
+--------------------------------------------------------------------------------+
|                    This tool is not legal advice.                               |  28  disclaimer
+--------------------------------------------------------------------------------+
  240        20              760              20         240                        = 1280
```

| Row | Height at the guarantee | Holds |
|---|---|---|
| chrome bar | 44 | The Theme's logo (or the Tree's title as text), the language switch, the share button. |
| Trail | 64 | The Trail Branches, 10.2. Empty of Branches at the root Node, where it holds the Tree's title instead, so nothing moves when the walk starts. |
| middle | 360 | Left column of Option Branches, 20 gap, the **Bubble** (760 x 360), 20 gap, right column of Option Branches. |
| Answers | 64 | The Branches out of the bottom of the Bubble, 10.3. |
| Carousel | 80 | Section 12. Present as an empty row of the same height when the Node has no Images, so the Bubble does not move between Nodes. |
| disclaimer | 28 | The permanent "not legal advice" footer (core document 8). |

- **The Bubble is round.** A single element with a large border radius, filled with the
  Theme's `surface` colour and outlined in `accent`; its text area is inset from the
  curve, which is why 760 x 360 of Bubble gives 640 x 304 of text (`tree-format.md`
  5.7 derives the length limits from exactly this).
- **The rim is chrome; the text area is authored text.** The 640 x 304 text area sits
  inside the curve, and the band between it and the edge -- 60 pixels each side, 28
  above, 28 below -- is the **rim**. The rim is where the two chrome elements a Node kind
  adds to the Bubble sit (10.3): a Terminal's **outcome badge**, a 24-pixel pill in the
  band above, and an explanation Node's **`explanationOnly` hint**, one 20-pixel line of
  13-pixel muted text in the band below. At the corner radius the Bubble is drawn with,
  the rim is about 590 pixels wide 28 pixels in, which holds a badge and a hint of at
  most 80 characters; both are chrome, so their length is `src/chrome.ts`'s and not an
  author's (3.2, section 7). **Neither takes a pixel from the text area**, which is why
  the description keeps its 192 pixels and its eight lines on every kind of Node and
  `tree-format.md` 5.7's derivation stands exactly as written (10.7).
- **The Bubble never shrinks.** At or above the guaranteed viewport its text area is at
  least 640 x 304 at every size. Extra width goes to the Option columns and the page
  margins; extra height goes to the Bubble and the gaps. A limit that holds at
  1280 x 640 therefore holds at every larger viewport, which is what makes
  `tree-format.md` 5.7 a promise rather than a hope.
- **The centre of the viewport is the centre of the tree.** Everything else is placed
  relative to the Bubble: that is what section 11 slides.

### 10.2 The Trail: the Branches above

The Trail is the ordered list of Nodes visited to get here, and it is the path in the
URL (4.1) -- the same list, drawn. Each entry is a Branch: a link to
`/<tree-id>/<id-1>/.../<id-k>`, labelled with that Node's title from the title index,
which discards the Trail after it (core document 10.17). They read left to right,
oldest first, the current Node's parent nearest the Bubble.

- **At most five Branches carrying a title are drawn**, in a 64-pixel row: **200 pixels
  each**, 8-pixel gaps, the row centred on the Bubble's centre. At 200 pixels a 13-pixel
  label holds about 28 characters per line, so a title of 80 characters is at most three
  20-pixel lines, and no label is truncated at the guaranteed viewport.
- **A longer Trail collapses in the middle.** The `start` Branch stays, the last four
  entries stay, and everything between them becomes one Branch labelled with
  `trailMore(n)` -- "n earlier steps". That Branch carries chrome, not a title, and is
  **120 pixels** wide. The collapsed Trail is the row at its widest -- five title
  Branches, the collapsed middle and five gaps, 5 x 200 + 120 + 5 x 8 = **1160 of the
  1280 pixels** -- so the row still has a margin at the guarantee and it never wraps.
  `trailMore(n)` is a button that opens the **Trail Sheet**: the whole Trail as a list of
  links, newest first, as many as fit, with `previous` and `next` if there are more. The
  Trail Sheet is the same `Sheet` component as the enlarged Image (section 12), and like
  it, it never scrolls.
- **The middle collapses; labels never truncate and the row never wraps.** Truncating
  would hide which step a reader is going back to, which is the one thing the Trail is
  for; wrapping would take height the no-scroll budget does not have.
- At the root Node the Trail is empty and the row holds the Tree's `title`, not a
  Branch. A Trail of one to five entries draws exactly those.

### 10.3 What each kind of Node shows

`tree-format.md` 5.6 has three kinds and the frontend distinguishes four situations. In
every one: the Trail is above (10.2), the Carousel is below (section 12), the chrome bar
and disclaimer are unchanged.

| | In the Bubble | Below the Bubble (children) | Beside the Bubble (side children) |
|---|---|---|---|
| **question Node, with Options** | Title (heading), description (rich text), Sources | **Two Answer Branches**: `yes` and `no` as a small chrome label above the target's title, 480 px each, side by side | **The Option Branches**, in the two columns, at most 4 per side |
| **question Node, no Options** | The same | The same two Answer Branches | Empty columns; the Bubble keeps its size and place |
| **explanation Node** | Title, description, Sources, and -- on the Bubble's rim, not in its text area (10.1) -- the `explanationOnly` hint, which says the answer is given on the step above | **One `back` Branch** to the Trail entry directly above, labelled with that Node's title. An explanation Node has no Answers by the format's rule, and the way on is up: the control is drawn below, its target is the Bubble above, and following it slides up (11.1) | Its Options, if it has any, in the same two columns |
| **Terminal** | Title, description, Sources, and -- on the Bubble's rim, not in its text area (10.1) -- the **outcome badge**: `outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited` or `outcomeRefer`, coloured `danger` for `prohibited` and `accent` otherwise | **Two Branches**: `back` to the Trail entry above, which slides up like the explanation Node's, and `startAgain` to the root Node with an empty Trail, which has no direction and does not slide (11.1). A Terminal that is itself the root Node has no Trail entry above it, so it shows `startAgain` alone | Nothing: a Terminal may not carry Options (`tree-format.md` 5.6) |

- **Every Branch shows its target's title**, taken from the title index (`getTitle`),
  never from a second Node read. An Answer Branch shows the chrome word `yes` or `no`
  above that title, so the reader sees both what they are answering and where it leads.
- **An Option Branch may carry one picture.** If the Option has Images
  (`tree-format.md` 5.4), the **first** of them is shown on its Branch as a 64-pixel
  thumbnail beside the label, with the Image's `description` as its alternative text --
  the owner's "each piece of legislation is an Option with an image showing what kind of
  product it covers" (core document 3.3). The rest of an Option's Images belong to the
  Option's own Node and are seen there. Option Images are **not** mixed into this
  Node's Carousel: the Carousel's order is the Node's `images` list and its caption is
  that Image's description, and merging two lists would break both.
- **Direction carries meaning, and that is how open item 10.23 is answered on screen.**
  Above is where you came from; below is where an answer takes you; beside is an aside
  that you read and come back from. The owner's "children" are the Answer targets, drawn
  below; the "side children" are the Option targets, drawn beside. Should the owner
  correct that reading (core document 10.23 is PROPOSED), what changes is which
  direction a Link is drawn in -- `src/neighbourhood.ts` (11.2) is the one place that
  says so -- and no other contract in this document moves.

### 10.4 The viewport the layout guarantees

| | Width x height, CSS pixels | What holds |
|---|---|---|
| **The guaranteed viewport** | **1280 x 640** | The full arrangement of 10.1, every text at its designed size, no label truncated, nothing collapsed. The document does not scroll. |
| Above it | anything larger | The same, with the extra space going to margins, the Option columns and the Bubble. The document does not scroll. |
| Between the floor and the guarantee | down to **320 x 480** | The tree view, degraded in the stated order of 10.5. The document does not scroll. |
| Below the floor | under 320 x 480 | The `minimumSize` notice, which itself fits and does not scroll. |

1280 x 640 is `tree-format.md` 5.7's assumption, confirmed here (10.7): a 1366 x 768
laptop display, or a 1920 x 1080 one at 150 % scaling, minus browser tabs, address bar
and taskbar. 320 x 480 is smaller than any display in current use -- an iPhone SE is
375 x 667 -- so the notice is a backstop for a resized desktop window, not the mobile
experience.

### 10.5 Below the guarantee: the degradation order

The owner's rule is absolute: no scrolling, ever. So the layout does not shrink text
until it is unreadable and it does not hand the reader a scrollbar. It **gives things
up, in a fixed order**, and each thing it gives up stays reachable behind one control.
Whichever step first makes the arrangement fit is where it stops.

| # | When space runs short | What happens | What is still reachable |
|---|---|---|---|
| 1 | height | The Trail collapses to one Branch: the parent, plus `trailMore(n)`. | The Trail Sheet (10.2). |
| 2 | height | The Carousel collapses to one control showing `imageCount`. | The Sheet, which is the enlarged view (section 12). |
| 3 | width | The Option columns move below the Answer Branches as one row. | Unchanged: they are still Branches, still links. |
| 4 | either | The Option Branches collapse to one Branch labelled `options` with their count. | A Sheet listing the Options, each a link to its target. |
| 5 | height | The Sources collapse to one control showing their count. | A Sheet listing them, each a link that opens in a new tab. |
| 6 | height | Body text steps down 16 -> 15 -> 14 -> 13 px, line height 1.5, and **never below 13 px**; the title steps 22 -> 20 -> 18 px. | Unchanged. |
| 7 | anything left | The `minimumSize` notice replaces the tree view. | The notice names the smallest size the tool works at. |

- The order is deliberate: the Trail and the Carousel are context, the Options are a
  list, the Sources are a citation, and the **Node's own title, description and
  Answer Branches are never given up** -- they are the step the reader is on. The notice
  appears only when even those do not fit.
- Every collapse opens the same `Sheet`. One concept, four uses -- the enlarged Image,
  the full Trail, the collapsed Options and the collapsed Sources -- and one set of
  keyboard rules (Escape closes, focus returns to the control that opened it).
- Nothing in this order is a media query the build issue may invent: #41 implements
  these seven steps, in this order, and the browser test of 10.6 runs at sizes that
  exercise them.

### 10.6 The no-scroll rule, and the exact test

**The rule.** `html` and `body` are exactly the size of the viewport and have
`overflow: hidden`. No element in the document has content taller or wider than itself,
with **one exception**: the Carousel strip, which scrolls horizontally inside its own
80-pixel row and is how the Carousel works without JavaScript (12.2). The document
itself never scrolls at any size, including below the floor, including while a Sheet is
open, and including during a transition.

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
| An explanation Node, reached with a three-entry Trail | The third. |
| A Terminal | The fourth. |
| `tests/fixtures/full-node/` at a 49-entry Trail | Every maximum the format allows at once: 80-character title, 600-character 8-line description, 3 Sources, 8 Options, 10 Images, the longest Trail. If this fits, every valid Tree fits. |
| The longest Node of the first Tree that validates | The real content, once #44 has cut it. |
| Each of the above in **both** `en` and `nl` | Dutch runs longer than English; the limits are per language and so is the fit. |
| Each of the above with a Sheet open, and mid-transition | 10.5 and section 11 do not get an exemption. |

The build issue (#41) pastes the measured numbers in its pull request; the test is what
keeps them true afterwards.

### 10.7 The format's length limits, confirmed

`tree-format.md` 5.7 fixed the limits from an assumed layout and asked issue #38 to
confirm or correct them. **The limits are confirmed unchanged** -- 80-character titles,
600 characters and 8 estimated lines of description, 60-character Option titles and
Source labels, 3 Sources, 8 Options, 10 Images, 3 Images per Option. `elsa-tree/2`
therefore needs no new format number, and no Tree written against it has to change.

Six assumptions behind those numbers are re-derived by this layout. None of them moves
a limit:

| `tree-format.md` 5.7 assumed | This layout | Effect on the limits |
|---|---|---|
| The vertical budget's "outgoing Branches 64" carries the Answer *and* Option Branches, and noted that 10 Branches would need 1500 px across a 1280 px screen, leaving #38 to decide whether they narrow or wrap. | Answers go **below** (2 Branches, 480 px each) and Options go **beside** (two columns of at most 4, 240 px each). Neither row ever holds 10 Branches, so nothing narrows and nothing wraps. | None. The 64 px row and the 360 px middle are unchanged; the budget still sums to 640. |
| An Option Branch label is 150 px wide, giving about 21 characters per line, so a 60-character title takes 3 lines. | An Option Branch label is 240 px wide, or 168 px when the Option carries a thumbnail: about 34 or 24 characters per line, so 60 characters take 2 or 3 lines, in a 90 px row. | None: more room than assumed. |
| An Answer Branch has 640 px and a Node title of 80 characters is 1 line. | 480 px, about 65 characters per line: 80 characters take 2 lines of 20 px, plus the 16 px chrome label, 56 px inside the 64 px row. | None. |
| A Trail of up to 6 Nodes fits at 213 px each; a longer Trail was left to #38. | 5 title Branches at 200 px; a longer Trail collapses to those five plus a 120 px `trailMore` in the middle, which is the row at its widest: 5 x 200 + 120 + 5 x 8 = 1160 px of 1280 (10.2). | None; a Trail label is a Node title, already bounded. |
| The Bubble's text area is 640 x 304 inside the curve and padding of a 760 x 360 Bubble -- and 5.7 divides that 304 px exactly, leaving nothing over. | Unchanged, and nothing is added to it: a Terminal's outcome badge and an explanation Node's `explanationOnly` hint are chrome and sit on the Bubble's **rim**, outside the text area (10.1). | None. The description keeps 192 px and 8 lines on every one of the four situations of 10.3. |
| The Carousel is "one picture at a time, 80 px strip; a caption of 120 characters fits one line at 13 px under the enlarged view, two in the strip". | Five pictures at a time at 60 px, and **one** 20 px caption line under them rather than two: 60 + 20 is the 80 px row. That line holds about 170 characters and a `description` plus a `credit` may be 240, so the credit is laid out whole and the description is shortened to what is left, at least 47 characters (12.2). | None. What is shortened is repeated in full in the thumbnail's alternative text and in the enlarged view, where 5.7's "one line at 13 px" is exactly what it assumed. |

This is recorded on issue #37 as a comment, as that issue's spec asks.

## 11. Transitions and the neighbourhood

**[v0.2], new.** The owner, in issue #35: "I want the transitions to slide over the tree
to the next node", and "this might mean we want to already render the next two nodes in
each direction of the screen (still lazy loading), but then if someone clicks through,
the navigation feels smooth."

Recorded in `docs/adrs/ADR-38-neighbourhood.md` (which supersedes
`ADR-5-lazy-loading.md`) and `docs/adrs/ADR-38-transitions.md`.

### 11.1 The tree layer

Everything between the chrome bar and the disclaimer -- the Trail Branches, the Bubble,
the out-Branches, the Carousel, and the neighbour Bubbles -- lives in one element, the
**tree layer**. The layer is larger than the viewport; the viewport shows the part of it
around the current Bubble. A transition is a `transform: translate` on that one element
and nothing else moves. This is the structural requirement issue #41 leaves for #42:
one element, one transform.

Each **Branch has a direction and a slot**, and the direction is where its *target* is
drawn, which is not always where the control the reader clicks is drawn: `up` for a
Trail Branch **and for a `back` Branch**, `down` for an Answer Branch, `side` for an
Option Branch. The neighbour Node a Branch leads to is rendered as a full Bubble, one
viewport away from the centre in that direction, offset by the slot. Following the
Branch translates the layer by exactly that offset, so the target Bubble arrives in the
centre.

- **A `back` Branch is a second control on a Link the Trail already draws.** On an
  explanation Node and on a Terminal, `back` leads to the parent -- the Node 11.2 has
  already placed `up`, and the Node the nearest Trail Branch links to. The control sits
  below the Bubble, with the other ways on (10.3); the target sits above, because that is
  where the reader came from and because one Node cannot be drawn in two directions at
  once. Following it slides **up**. It adds no Node to the neighbourhood and no entry to
  the count of 11.2.
- **`startAgain` has no direction and does not slide.** It leads to the root Node with an
  empty Trail, which is a restart rather than a step through the tree: the root is in the
  neighbourhood only by coincidence (a Trail of two), and a root Bubble placed one
  viewport away in some direction would draw a tree that is not there. It is an ordinary
  link (11.3).

### 11.2 The neighbourhood: which Nodes are pre-rendered

`src/neighbourhood.ts` is the one place that answers this, for the page and for nobody
else:

```ts
export type Direction = 'up' | 'down' | 'side'
export interface Placed { node: Node; href: string; direction: Direction; slot: number }
export function neighbourhood(tree: Tree, at: PageAddress): Promise<Placed[]>   // at most 16
```

Given the Node on screen and the Trail that reached it:

| Direction | Which Nodes | At most |
|---|---|---|
| `up` | The last two Trail entries: the parent and the grandparent. | 2 |
| `down` | The current Node's Answer targets, and **their** Answer targets. | 2 + 4 = 6 |
| `side` | The current Node's Option targets. | 8 |
| | **Total** | **16** |

- **`up` serves the `back` Branch too, and nothing is added for it.** The parent is
  placed once; both the nearest Trail Branch and an explanation Node's or a Terminal's
  `back` Branch lead to that one placement (11.1). `down` is the Answer targets and
  theirs, and nothing else; `startAgain` has no placement at all.
- **This is "the next two nodes in each direction", read as directions of the screen.**
  Two up the Trail; two deep down the answer path; the Options one out, because they
  fan (a Node may have eight) and because an Option leads to an explanation Node, whose
  only way on is back to the Node the reader just left -- which is the Node still in
  hand. Going two deep through Options would multiply eight by eight to buy a hop
  almost nobody takes.
- **The set is deduplicated by Node id** and a Link to an id the Tree does not contain
  is dropped, not thrown: the loader has already rejected such a Tree at start-up, and
  a view is not the place to discover it. The real count is usually far below 16.
- **16 is a contract, not a configuration.** There is no environment variable and no
  prop that raises it. Widening it is an `architecture` issue, because it is the number
  that stands between this application and "the browser received the whole Tree".
- `neighbourhood` obtains its Nodes by calling `getNode` once per id. The loader's
  interface does not change to serve it (5.1): a page may call `getNode` at most 17
  times -- once for the Node it shows, once per neighbour -- and `getTree` does not
  exist to call.

### 11.3 How they arrive, and the slide

**The neighbours are already in the page.** The server renders the current Node's page
with the neighbour Bubbles in it, in their positions in the tree layer, `aria-hidden`
and out of the tab order. No second route, no JSON API, no client fetch on load. This
costs nothing on the server, because `elsa-tree/2` is one file already parsed in memory
(`tree-format.md` section 6).

Following a Branch, with JavaScript:

1. The Branch is an ordinary `<a href>`. `Slider` intercepts the click.
2. It translates the tree layer toward the target's position. The target Bubble is
   already rendered and already carries its own Branch labels, so what the reader sees
   arriving is a complete Bubble, not a placeholder.
3. In parallel it starts the client navigation to the same `href`. That fetches **one**
   page payload: the target's page, carrying the target and **its** neighbourhood.
4. When the payload arrives the tree layer is replaced by the target's own layout, with
   the target now the centre Bubble. The transform resets; nothing visibly jumps,
   because the Bubble that was arriving and the Bubble that is now the centre hold the
   same Node.
5. The URL is the target's URL -- `followHref` for a Branch out, `trailHref` for a Trail
   Branch (4.1) -- pushed exactly as a plain link would have left it. Reload, back and
   copy-link keep working, because the address bar is not a story the transition tells;
   it is the same address the link had.

**A Branch whose target is not in the neighbourhood navigates without a slide.** There
are exactly two kinds: a Trail Branch older than the grandparent -- the `start` Branch of
a long Trail, or an entry reached from the Trail Sheet (10.2) -- and a Terminal's
`startAgain` (11.1). They are ordinary links and they behave like ordinary links: the
target's page loads and the tree is redrawn around it. `Slider` does not animate toward a Bubble that is not there, and it
does not fetch one to be able to; a jump five steps back is not a slide in the first
place.

Back and forward are the browser's, and reverse the slide when the payload is in the
framework's cache. `prefers-reduced-motion: reduce` removes the motion and keeps the
navigation: the target replaces the current view without a transform. Nothing about
which Nodes are fetched changes with that setting.

**Framework prefetching of Branch links is off** (`prefetch={false}`). The neighbours
are in the page already; letting the framework prefetch ten Branch pages, each carrying
its own sixteen neighbours, is the one way this design could quietly turn into "the
browser downloaded the Tree".

### 11.4 Images during a transition

A neighbour Bubble's Carousel is rendered as an **empty row of the right height**. The
markup of a neighbour Bubble contains **no image URL at all** -- not a `src`, not a
`data-` attribute, not a `srcset`. The browser therefore cannot request an image of a
Node that is not on screen, whatever a lazy-loading heuristic decides.

The images of a target arrive with its page payload, in step 4 above: a frame or two
after the slide, the Carousel fills. This is the honest cost of the rule and it is the
right way round -- the core document's "images are loaded only for the Node on screen"
(3.1, 9) is absolute, and a picture appearing just after a slide costs a reader
nothing.

### 11.5 The accounting: what a request may and may not carry

This is the testable form of core document section 9, and `transition.spec.ts` asserts
it by recording every network request.

| | May | May not |
|---|---|---|
| A Node page response | The current Node and at most 16 neighbours (11.2) -- at most **17 Nodes** -- in the page's own language only; Branch labels from the title index; the Theme; chrome. | An 18th Node. Any Node's text in another language. Any image or font bytes. Any file path. The Tree file. |
| One navigation | Exactly **one** page payload. | A second payload for the same navigation; a prefetch of any Branch's page. |
| `GET /images/<file>` | One image file of the Node that is the centre Bubble. | An image of any other Node, at any time, for any reason. |
| `GET /theme/<file>` | One file the Theme names (5.5). | A file in `theme/` the Theme does not name; anything outside it. |
| Any request at all | This origin. | Any other origin (13.5). |
| Any route | -- | There is **no** route that returns more than one Node, and none that returns the Tree. |

Walking the whole Tree still downloads it one Node at a time, seventeen at a time at
the very most, and the server's memory holds the Tree the browser never gets.

## 12. The Carousel

**[v0.2], new.** The owner, in issue #35: "where are the images? I told you there should
be image carrousells below the node bubble." This reverses core document open item 10.6
(0.1: thumbnails, no carousel chrome). Recorded in `docs/adrs/ADR-38-carousel.md`.

### 12.1 What it shows

The Carousel is the 80-pixel row under the Bubble (10.1). It shows **this Node's own
`images` list, in the order the author wrote it** (`tree-format.md` 5.2: the list is the
order, the description is the caption, the credit is shown with the picture). At most
ten, which is the format's maximum.

**Option Images do not join it.** An Option's picture belongs to that Option and is
shown on its Branch (10.3), where the reader is looking when they read the Option. The
Carousel keeps one list, one order and one caption rule; merging two lists would leave
a reader unable to tell which entry a caption belongs to.

A Node with no Images gets the row anyway, empty, so that the Bubble sits in the same
place on every Node and the transition of section 11 has nothing to reflow.

### 12.2 The strip, and its one exemption from the no-scroll rule

The strip is a horizontal row of the Node's Images as 60-pixel thumbnails with
`scroll-snap-type: x mandatory`, and under it a caption line of 20 pixels: 60 + 20 is the
row's 80 pixels exactly (10.1). The strip is the **one element in the document allowed to
scroll**, and only horizontally, and only within its own row (10.6). That exemption buys
a great deal:

- it works **without JavaScript** -- the strip is a native scroll container, and a
  keyboard user can move through it with the arrow keys because it is focusable;
- the previous/next buttons are then `CarouselButtons`, a small client component that
  scrolls the strip by one page, not a state machine that owns which Image is "current";
- nothing about it can make the *page* scroll, which is the rule the owner stated.

The caption line shows the `description` and the `credit` of the **selected** Image, in
`text-muted`, on **one 13-pixel line that never wraps** -- the 80-pixel row has no second
line to give it. The line is about 1230 pixels wide, which is about 170 characters at
`tree-format.md` 5.7's 13-pixel advance, and a description plus a credit may be 240. So
the two are given the line in a fixed order of priority:

- **the `credit` is never cut.** `tree-format.md` 5.2 requires it for every Image without
  exception and core document 8 is why; a credit visible only when the description
  happens to be short is not that promise. At 120 characters it takes about 850 pixels of
  the line at most.
- **the `description` takes what is left** -- at least 47 characters -- shortened to fit,
  with a trailing ellipsis when it is shortened. Nothing is lost by it: the whole
  description is the thumbnail's alternative text, and both fields are shown in full in
  the enlarged view (12.3), one Enter away.

**The shortening is computed, not painted.** `text-overflow: ellipsis` would leave the
caption's content wider than the caption, and 10.6's test measures `scrollWidth` against
`clientWidth` on every element that is not the strip: an ellipsis painted over content
that still overflows is precisely what the no-scroll rule forbids. So the Carousel
shortens the string it renders. That is a fact about markup, and `views.test.tsx` asserts
it (section 7), not a browser.

### 12.3 Controls, keyboard and the enlarged view

| Control | Behaviour | Chrome key |
|---|---|---|
| The strip | Focusable region, named for assistive technology. Left/Right move the selection, Home/End jump to the first/last, Enter or Space enlarges the selected Image. | `images` |
| Previous / next | Buttons; scroll the strip by one page. Disabled at the ends. `CarouselButtons`, one of the four client components of section 1. | `previous`, `next` |
| Position | "Image 3 of 7", updated as the selection moves, announced politely. | `imageCount` |
| A thumbnail | An `<a href="/images/<file>">` around the `<img>`. With JavaScript the click is intercepted and opens the enlarged view; without it, the link opens the file. | `enlarge` |
| The enlarged view | A `Sheet`: the full image bounded to the viewport so that it never scrolls, with the `description` and the `credit` beneath it. Closed by Escape, by the close button, or by clicking outside; focus returns to the thumbnail. | `close` |

The enlarged view is the same `Sheet` as the Trail Sheet and the collapsed Sheets of
10.5 -- one overlay concept, one set of keyboard rules, one implementation.

### 12.4 Loading the image files

- Only the images of the Node that is the centre Bubble are ever requested (11.4, 11.5).
- Within the Carousel, each `<img>` carries `loading="lazy"` and explicit `width` and
  `height`, so the browser fetches the thumbnails at and near the visible page of the
  strip and not the whole list. A Node may name ten Images; a reader who never scrolls
  the strip fetches only what the row showed.
- The enlarged view shows the file the strip already has: enlarging costs no request.
- An Option Branch's thumbnail (10.3) is an image of the Node on screen -- the Option is
  part of this Node's data -- so it loads with the page. A Node with 8 Options and 10
  Images can therefore ask for up to 18 image files, all of them its own, none of them
  another Node's.

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
  `tree-format.md` 4.3.3 and there is no eighth.
- **Four values are derived at render time**, and each is one CSS cannot compute.
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

**[v0.2], new.** Version 0.1 promised that everything but the thumbnail enlarge and the
share button worked without JavaScript. The slide and the pre-rendered neighbours need
client code, so that promise has to be restated rather than repeated. It is restated as
a stronger one than "the page renders": **without JavaScript this is a working
decision-tree tool, and every guarantee of core document section 9 still holds.**
Recorded in `docs/adrs/ADR-38-without-javascript.md`.

| Works without JavaScript | How |
|---|---|
| The whole current Node | The server returns complete HTML: the tree view of section 10 with the centre Bubble, its title, description, Sources, outcome or hint. |
| Every Branch | Ordinary `<a href>`. Following one loads the target's page. The tree is redrawn around the new Node instead of sliding to it. |
| Going back up the Trail | The Trail Branches are links that discard the later Trail, exactly as 4.1 says: the URL *is* the Trail. |
| The Carousel | A native scroll-snap strip (12.2): every Image is reachable, with its credit whole in the caption line, its description there as far as the line allows, and both in full when the thumbnail's link opens the file. |
| Enlarging an Image | Each thumbnail is a link to `/images/<file>`; the browser opens the file, with the description and credit still on the page behind it. |
| The language switch | Links with `?lang=` (4.1). |
| The share link | The address bar: the page's own URL is the share link (4.1). |
| The Theme | Colours, fonts and logo are server-rendered CSS and plain `<img>`; a Tree's identity does not depend on a script. |
| The no-scroll rule | CSS, and the length limits of the format. 10.6's test runs with JavaScript disabled too (`no-js.spec.ts`). |
| The disclaimer | Rendered in the layout, on every page. |

| Needs JavaScript | What a reader without it gets instead |
|---|---|
| The slide transition | A normal page load. Same URL, same Node, no motion. |
| The pre-rendered neighbour Bubbles | They are in the HTML -- the server rendered them -- but hidden, and `Slider` is what reveals them. Without it the tree layer shows the centre Bubble and its Branches, which is everything the reader needs; off-centre Bubbles that can never move would be clutter, and they are `aria-hidden` besides. No image of another Node is requested either way, because a neighbour Bubble carries no image URL (11.4). |
| The enlarged view in place | The image file, opened by the link. |
| The Carousel's previous/next buttons | The strip itself scrolls; the buttons are an enhancement of a control that already works. |
| The Sheets of 10.2 and 10.5 | Below the guaranteed viewport, a collapsed group falls back to the plain list it collapses -- the markup is present and CSS hides it only where a Sheet can open it. A reader without JavaScript at 360 px sees a longer page laid out to fit, never a control that does nothing. |
| The share button's copy | The address bar. The button is not shown when it cannot work. |
| The 404 page's body | The single framework exception, 4.3, unchanged. |

**The rule this leaves for every build issue:** a client component may only enhance
markup that is already correct without it. If a feature cannot be expressed that way, it
does not go in the client component -- it goes in the server render or it does not go
in.
