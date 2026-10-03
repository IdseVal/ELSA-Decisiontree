# Application contracts

> Status: FROZEN -- 2026-09-10 (issue #38), version 0.2. These are the contracts the
> build issues (#39 loader, #40 theme, #41 tree view, #42 transitions, #43 carousel) are
> built against. Changing one requires a new `architecture` issue. The Tree file format
> they consume is frozen separately in `docs/specs/tree-format.md` (`elsa-tree/3`, issue
> #78; `elsa-tree/2` was issue #37).
>
> **Amended 2026-10-03 by issue #195** (`docs/adrs/ADR-195-*.md`), for the owner's words on
> #194 (core document 3.4 `[#194]`): "To login should be based on an email and a password, and
> graphs should have a small mention by who it was authored, if multiple collaborators in the
> order in which they joined a decision-tree." An account logs in with an e-mail address in
> place of a user name, the administrator's included, and a Tree's pages name the accounts that
> authored it. **Sections 38 and 39 are new** and hold the contracts; the sections below change
> where they named the login, the administrator's `admin`, the keys of `meta.json` or what may
> reach a public page, each change marked **[#195]** and dated. Built by #196 (the login) and
> #197 (the Authors, after #196); the owner's own account, #198, changes no contract.
>
> | Section | #195 |
> |---|---|
> | 3.2 | #196's keys for the address and for one name per account; #197's `byAuthors` and `nameShownPublicly`. |
> | 6 | `src/components/Authors.tsx` and `src/store/authors.ts`; `config.ts` reads `ELSA_ADMIN_EMAIL`. |
> | 7 | The editor round's row names 38.10 and 39.9. |
> | 8, 9 | Rows for the login by address and for the mention; eight `ADR-195-*` rows. |
> | 10.1, 10.6 | The chrome bar of a Node page holds the mention; the walk skips its cut line. |
> | 15.3, 16.4, 16.5, 23.5 | Unchanged, stated: no name enters `tree.json`, the JSON-LD or `llms.txt` (39.7). |
> | 17.1, 17.2, 17.4, 17.5 | `ELSA_ADMIN_EMAIL`; `accounts.json`'s `email` and `meta.json`'s `joined`, each converted at the start; the store's `authors(id)`. |
> | 20.1, 20.3 to 20.5, 20.7, 20.8 | The address in place of the login; the administrator's from `ELSA_ADMIN_EMAIL`; the interface; what about an account may reach a public route, and its test; the rate limit and the log for an address. |
> | 21.1, 21.2, 21.4 | A Tree's roles are what its mention names; an address changed by the administrator alone; the list answers names; an invitation and a hand-over append to `joined`. |
> | 22.1 | The bodies of the login and account routes (38.2). |
> | 23.1 | The store's public interface gains `authors(id)`, which answers names only. |
> | 24.3, 26.1 | The mention in the public Node page's bar and on a tile's bottom row. |
> | 25.1 to 25.3 | The login page's field; the address on the account and accounts pages, `setEmail`; one name per account; the notice that a name is public. |
> | 33.4 | The invitation and hand-over selects show names only. |
> | 34.5 | Edit mode renders no mention. |
> | 35.1 to 35.5 | The test accounts log in by address; the rows of #196 and #197; the account sweep. |
> | 38, 39 | New. |
>
> **Amended 2026-10-02 by issue #171** (`docs/adrs/ADR-171-*.md`), for two points the owner
> listed on #169 after walking the editor: "When tree ends here is chosen, just let the user
> enter a text to display on the button (with a wordcap obviously). This graph creation tool
> is not just for Legal trees, also for ethical or social trees, so we want to keep the graph
> creator useable for all." and "Make the font family selection a dropdown, but do give the
> option to add a font by uploading a file. Make the license section a dropdown." The Tree
> format becomes `elsa-tree/5` (`tree-format.md`): a Terminal carries its own words,
> `terminal.label`, in place of one of four outcomes. **Sections 36 and 37 are new** and hold
> the contracts; the sections below change where they named the outcome, the format number or
> the font fields, each change marked **[#171]**. Built by #179 (the ending) and #180 (the
> Theme panel); #178 (the step's controls) and #172 (the fields) are the neighbours they meet.
>
> | Section | #171 |
> |---|---|
> | 3.2 | Chrome loses the four outcome words and `outcome`; gains `endingText`, and #180's dropdown words; `colourDanger` says "Errors". |
> | 5.1 | `Outcome` goes; a Terminal Node carries `label: LocalisedText`; `Manifest['format']` is `elsa-tree/5`. |
> | 6 | `fonts/`, `src/fonts.ts`, `src/store/woff2.ts`, `schemas/elsa-tree-5.json`. |
> | 7 | `chrome.test.ts` loses its outcome row. |
> | 9 | Five rows, one per ADR of #171. |
> | 10.1, 10.3, 10.5 | The badge holds the Terminal's `label`, in one colour; below 792 pixels wide its tracking tightens. |
> | 15.1 | The schema route serves `elsa-tree-5.json` and still `elsa-tree-4.json`. |
> | 16.4, 16.5 | Unchanged, stated: neither read the outcome, and neither reads the label. |
> | 17.4, 18.3 | The store converts an `elsa-tree/4` file when it opens it (36.4). |
> | 19.1, 19.7, 22.1, 22.2 | The draft is `elsa-tree/5`; `link: 'end'` carries `label`; the field is `terminal.label.<lang>`; the manifest gains `use-library-font`; the theme upload answers the font's family name. |
> | 28.1, 28.6, 30, 30.1, 30.3, 34.2 | The ending's words are a field on the rim; `treeEndsHere` asks for them; section 30's opening no longer says nothing enters the format. |
> | 4.1, 6, 8, 15.2, 17.2, 19.2 | Where they name `elsa-tree/4` or its schema as the current one, a short mark: `/5` from #179. |
> | 33.8 | The family name and the licence line become dropdowns (37). |
> | 35.4 | The test rows of #179 and #180 (36.5, 37.6). |
> | 36, 37 | New. |
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
> **Amended 2026-09-23 by issue #132 (the editor round's store).** The owner opened the
> editor round (#131; `docs/CORE_DOCUMENT.md` 3.4): Trees are created and edited in the
> app behind a login, saved automatically, hidden until published, with an overview page
> in front. Sections **17 to 23 are new** and freeze the store, many Trees per deployment,
> drafts and publishing, accounts and sessions, permissions, the editor's server
> interface, and how a hidden Tree stays off every public route. Section 2 is
> **superseded** by 18; 4.1, 4.3, 5.1 to 5.5, 6, 7, 8 and 9 are amended in place, each
> change marked **[#132]**; 10 to 16 are unchanged in what the end user sees, by the
> owner's instruction. The one public address that moves is a Tree's image and theme
> files, which gain the Tree id (18.1). The decisions are `docs/adrs/ADR-132-*.md`; the
> screens are #133's to freeze; #134 to #144 build.
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
> **Amended 2026-09-21 by issue #118** (`docs/adrs/ADR-118-dataset-endpoint.md`,
> `ADR-118-crawler-access.md`, `ADR-118-sitemap-and-alternates.md`, `ADR-118-json-ld.md`,
> `ADR-118-llms-txt.md`), for the owner's direction of that day: the Trees must be
> **optimally findable** -- by search engines, by dataset indexes such as Google Dataset
> Search, and by the crawlers that feed AI assistants -- and the Tree data moves to
> **JSON only** (`docs/specs/tree-format.md`, `elsa-tree/4`; core document 3.1 and 1,
> revised 2026-09-21). **Sections 15 and 16 are new** and are the whole of it; what
> changes in the sections already here is small and listed below. No contract of sections
> 10 to 14 moves.
>
> | Section | #118 |
> |---|---|
> | 1 | One optional configuration variable, `ELSA_TREE_LASTMOD`. |
> | 4.1 | Five routes join the grammar: the dataset endpoint, the schema, `robots.txt`, `sitemap.xml`, `llms.txt`. The canonical link is rendered from 16.3's address set, so it is absolute whether or not `ELSA_BASE_URL` is set -- the one bullet that moves, and `ADR-11-public-base-url.md` carries the amendment. **The Node page, the Trail in the path, the share link and `?lang` are unchanged**, and no URL that resolves today resolves differently. |
> | 4.3 | `schemas` joins the reserved Tree ids; two rows for the new routes' 404s. |
> | 5.1 | The loader's `Manifest['format']` becomes `elsa-tree/4` and the file it reads is `tree.json`; the seam gains the path of the Tree's own file. Issue #119 makes that edit with the code. |
> | 5.2 | The "Never, in any response" list is restated as a list about **page** responses, because the dataset endpoint of section 15 serves the whole file on purpose. The bound on what a page may carry is untouched. |
> | 6 | Five route files, one module folder `src/findability/`, and two existing modules gain a member each. |
> | 7 | **A row per new unit test and per new browser test**, one fixture, and the issue that owns each: nothing section 6 adds arrives without a named test. The no-cookie sweep is named by its file (`deployment.spec.ts`) and grows to cover 15 and 16. Two lines that still named `tree.yaml` are corrected. |
> | 8, 9 | Rows for the new guarantees and the eight `ADR-118-*` decisions. |
> | 15, 16 | New. |
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
| Client-side JavaScript | React plus **four** client components: `Slider` (the slide transition and the pre-rendered neighbours, section 11), `Sheet` (the one overlay: the Overlay of an Option, 10.9; the enlarged Image, 12.3; and the collapsed Options and Sources of 10.5), `Explainer` (the explainer panel's placement, Escape and tap, 10.8) and `ShareButton`. **[#75]** `CarouselButtons` is gone with #78 (the strip has no buttons, 12.2; the Carousel is a server component), and the interim `Thumbnails` of #41 was removed by #43 (section 6). Everything else -- navigation, the up arrow, the Answer buttons, the Option buttons as disclosures, the marked terms, the language switch, the Carousel's strip -- is links, CSS and ordinary form-free markup. **Section 14 states exactly what a reader without JavaScript gets**, and it is a working application, not a degraded one. The 404 page's body is the single exception (4.3). **[#133]** On the **public** pages that is still the whole list. The admin pages add the editor's client components of 34.4 (`Editor`, `Field`, `LoginForm`, ...), which no public page renders; the admin area needs JavaScript and says so (24.2). |
| Runtime | Node.js 22 (LTS), in `.nvmrc` and `package.json` `engines`. |
| Package manager | npm; `package-lock.json` committed; `npm ci` in CI and deployment. |
| Build output | `output: 'standalone'`: `next build` yields a folder that runs with `node server.js`. |
| Configuration | Environment variables only: `PORT`, `HOSTNAME` (Next.js), `ELSA_TREE`, `ELSA_TREES_DIR` (section 2), `ELSA_BASE_URL` (the public origin; a bare `http`/`https` origin or the server refuses to start), **[#118]** `ELSA_TREE_LASTMOD` (optional; a `YYYY-MM-DD` date that overrides the Tree file's modification time in the sitemap, 16.2 -- refused at startup when it is not a date), `NEXT_TELEMETRY_DISABLED=1`. |
| Vendor neutrality | No edge runtime, no Incremental Static Regeneration, no hosted image optimisation, no fonts or scripts fetched from third parties at run time. Anything fetched at build time is vendored into the repository. |
| Headers | `poweredByHeader: false`. The app sets no cookie, ever. |
| Repository root | `agentRules: false`: `next dev` does not scaffold `AGENTS.md` and `CLAUDE.md`. The root `CLAUDE.md` is the project instructions the agents in `.orca/` read, not build output. |
| Deployment | A systemd unit running `node server.js` behind a reverse proxy for TLS, or the repository's `Dockerfile`. The app does not know the proxy exists. `docs/deployment.md` (issue #11). |

Recorded in `docs/adrs/ADR-5-framework-and-rendering.md`.

## 2. Tree selection (decides core document 10.19)

**[#132] SUPERSEDED by section 18 (2026-09-23).** A deployment serves every published Tree
of its store; `ELSA_TREE` is gone and refuses to start when set; `ELSA_TREES_DIR` is
`ELSA_SEED_DIR` (17.1). The text below is kept as the record of 0.1 to 1.0.

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
| `sources`, `sourceCaseLaw`, `sourceLiterature` | The heading over the Sources -- **[#75]** "Legal sources" / "Juridische bronnen" -- and the two kind labels still shown beside an entry (10.3). `sourceLegal` is gone: under that heading it repeated it. **[#169] Amended 2026-10-02 (#173, by the owner):** the heading says **"Sources" / "Bronnen"**; the two kind labels are unchanged (`ADR-173-sources-heading.md`). |
| `images`, `enlarge`, `close` | The Carousel strip's accessible name, the name of every picture's link, and the close cross of every Sheet, the Overlay included (sections 10.9, 12). |
| ~~`trail`, `start`~~ | **[#75]** Gone with the drawn Trail (10.2). |
| `share`, `copied` | The share button and its confirmation. |
| `language` | Label of the language switch. |
| ~~`outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited`, `outcomeRefer`~~ | ~~Badge text for the four Terminal outcomes.~~ **[#171]** Gone (#179): the badge holds the Terminal's own `label`, Tree content in the content language (36.1). Their eight words live on only in `tree-format.md` 12.7's conversion table. |
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

**[#133] The keys of the editor round**, each existing in both languages from the issue that
adds it (the build fails otherwise, as above); the strings are the build issues', within the
sentences the sections quote. A key that takes a value is a function, as `up` is.

| Issue | Keys |
|---|---|
| #134 | `siteTitle` (the overview's and `llms.txt`'s H1, 23.5, 24.3), `noTrees`, `newTree` |
| #135 | `needsJavaScript`, `forbiddenTitle`, `forbiddenText`, `logout`, `account`, `accounts`, `signIn`, `login`, `password`, `loginFailed`, `loginLocked`, `loginHelp`, `requestFailed`, `yourName`, `changePassword`, `currentPassword`, `newPassword`, `repeatPassword`, `passwordsDiffer`, `wrongPassword`, `sessionsEnded`, `newAccount`, `create`, `deactivate`, `reactivate`, `deactivated`, `administrator`, `setPassword`, `save`; **[#135] added in the build**: `active` (the row's state beside `deactivated`, 25.3), `displayName` (the new-account Sheet's first field, since `login` says "Name"), and the four refusals of a field, `nameLength`, `loginInvalid`, `loginTaken`, `passwordLength` (the accounts routes answer a code, `AccountError`, which the screen says in the chrome language); **[#162]** `sessionNotKept` (a login the browser kept no cookie of, 25.1); **[#176]** `account` says "Account" now, the link's own word (24.3) |
| #137 | `published`, `hidden`, `notServable`, `treeId`, ~~`treeIdHint`, `treeIdFixed`, `treeIdTaken`, `treeIdReserved`~~ (**[#168]** removed with the address field, 27.1; `treeId` stays, the top panel names the address with it), `languages`, `addLanguage`, `makeDefault`, `default`, ~~`languagesFixed`~~ (**[#147]** replaced by `languagesLater`: the languages change in the top panel, 33.5; **[#168]** `languagesLater` removed: the form says no sentence), `title`; **[#137] added in the build**: `removeLanguage` (the accessible name of a tag's `remove` cross, 27.1) and `languageHint` (the tag grammar, which a refused tag turns to `danger` as `treeIdHint` does for the id, 27.2) |
| #138 | `addSource`, `removeSource`, `sourceKind`, `sourceUrl`, `outcome`, `characters`, `lines`, `saving`, `saved`, `notSaved`, `retrying`, `retry`, `notEditable`, `changedElsewhere`, `sessionExpired`, `publicBehind` |
| #139 | `treeEndsHere`, `newSideBubble`, ~~`createNew`~~, ~~`linkExisting`~~ (**[#177]** gone with the Sheet behind the side-bubble `+`, 30.4, and with it `sideBubbleTitle`, which the build had added for the Sheet's field), ~~`changeTarget`, `removeLink`, `linkMenu`, `stepMenu`~~ (**[#178]** gone with the link menus, the picker -- whose `createNew` it was -- and the step menu, 30.6, 30.8), `deleteStep` (**[#178]** the red cross's name and hover text), `removeEnd` (**[#178]** "Tree does not end here after all" / "Boom eindigt hier toch niet", the button's words), `confirmDelete`, `confirm`, `cancel`; **[#178]** `confirmDeleteUntitled` (the cross's question on a step without a title yet, 30.8) |
| #140 | `addPicture`, `attach`, `makeMain`, `moveEarlier`, `moveLater`, `removeImage`, `fileTooLarge`, `fileTypeRefused`; **[#140] added in the build**: `cancel` (the attach Sheet's second button, 31.2 -- the same word #139's row names, so whichever branch merges second keeps one) and `imageDescription` (the label of its description field; `credit` labels the other) |
| #141 | `mark`, `unmark`, `cannotMarkHere`, `explainerLimit`, `term`, `explanation`, `markedIn`, `notMarkedIn` |
| #142 | ~~`treeState`~~ (**[#176]** gone: the panel's title is `settings`, 33.2), `publish`, `todoCount`, `todoBefore`, `publishedAt`, `publicLink`, `publicBehindBecause`, `notServableBecause`, `confirmUnpublish`, `collaborators`, `creator`, `invite`, `removeCollaborator`, `chooseAccount`, `thisTree`, ~~`fixed`~~ (**[#147]** gone: the languages are the tag control of 33.5), `handOver`, `deleteTree`, `unpublishFirst`, `confirmDeleteTree` |
| #174 | `addExtraPicture` (the strip's `+`, its name and the label beside it, 31.1), `hint`, `creditHint`, `imageDescriptionHint` (the information hint behind an Image's two fields: its name and its two explanations, 31.2, 31.3) |
| #176 | `settings` (the floating button and the panel's title, 33.1, 33.2), `todoCountOne` (the to-do control's words for one thing; `todoCount` says them for more, 33.3), `todoNone` (the control at zero, and its bubble's empty list), `publishRefused` and `showTodo` (a refused publish's sentence in the panel and the button to the to-do bubble, 33.3) |
| #177 | `deleteSideBubble` (the button at the foot of an opened side bubble, 30.7), `confirmDeleteSideBubble` (its confirmation, a function of the side bubble's title), `confirmDeleteUntitledSideBubble` (the same without a title), `sideBubbleStays` (what the confirmation adds where another step leads to the side bubble too) |
| **[#171]** #179 | `endingText` ("Text of the ending" / "Tekst van het einde": the `treeEndsHere` Sheet's field and the empty badge field's placeholder, 36.3); **gone**: `outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited`, `outcomeRefer`, and #138's `outcome`; **reworded**: #144's `colourDanger`, "Errors" / "Fouten" (36.1) |
| **[#171]** #180 | `fontDefault`, `fontSameAsBody`, `fontLibraryGroup`, `fontOwnGroup`, `fontUpload`, `fontNameTaken`, `licenceOther`, with the strings of 37.2, 37.4 and 37.5; **[#180] added in the build**: the Theme panel's hints (33.8), `colourBackgroundHint`, `colourSurfaceHint`, `colourTextHint`, `colourTextMutedHint`, `colourAccentHint`, `colourAccentSecondaryHint`, `colourDangerHint`, `contrastHint`, `logoAltHint`, `fontBodyHint`, `fontHeadingHint`, `fontLicenceHint`, `fontFileHint`, named by #174's `hint`; **[#180] added in review**: `licenceOtherHint` (the hint behind the free licence line, 4.3.2's own sentence, 37.5; `ADR-171-licence-dropdown.md` decision 2) and `placeholderFontFamily` (the family-name field's placeholder while it is empty, 28.2, 37.4) |
| **[#195]** (2026-10-03) #196 | `email` ("E-mail address" / "E-mailadres": the login page's field, the field of the new-account and `setEmail` Sheets, the accounts page's column), `emailInvalid` ("Enter an e-mail address, such as name@example.org." / "Vul een e-mailadres in, zoals naam@example.org."), `emailTaken` ("Another account has this e-mail address." / "Een ander account heeft dit e-mailadres."), `nameTaken` ("Another account has this name." / "Een ander account heeft deze naam."), `setEmail` ("Set e-mail address" / "E-mailadres instellen", in the words of `setPassword`), `noEmail` ("No e-mail address yet" / "Nog geen e-mailadres"), `signedInWith(email)` ("You sign in with <address>." / "U logt in met <adres>."), `emailHelp` ("Ask your administrator to change it." / "Vraag uw beheerder om het te wijzigen."), 38.5 and 38.6; **gone**: `login`, `loginInvalid`, `loginTaken`; **reworded**: `loginFailed`, "Wrong e-mail address or password." / "Verkeerd e-mailadres of wachtwoord.", and `sessionNotKept`, which opens "Your e-mail address and password are right" / "Uw e-mailadres en wachtwoord kloppen" (25.1) |
| **[#195]** (2026-10-03) #197 | `byAuthors(names)` ("By A, B and C" / "Door A, B en C": the mention, 39.4), `nameShownPublicly` (the account page's notice, 39.8) |

The editor's client components take these as **strings** (`EditorWords`, 34.1), as the Sheet
takes `SheetWords`; `chrome(lang)` is read on the server and never imported by a client
component (section 6). Each issue appends its block at the end of both language records, so
two branches conflict in two appended blocks that resolve by keeping both
(`ADR-133-build-order.md`).

Recorded in `docs/adrs/ADR-5-chrome-languages.md`.

## 4. URL scheme

### 4.1 Grammar

```
Node page   /<tree-id>/<id-1>/<id-2>/.../<id-n>[?lang=<tag>]      1 <= n <= 50
Image       /<tree-id>/images/<file>                             [#132] (was /images/<file>)
Theme file  /<tree-id>/theme/<file>                              [#132] (was /theme/<file>, [v0.2])
Overview    /                                                    [#132] every served Tree (23.2)
Admin area  /admin/...                                           [#132] the screens (#133) and /admin/api/... (22)
            /admin                                               [#133] the login page, or the creators' overview (24.1, 26.4)
            /admin/new  /admin/account  /admin/accounts          [#133] the new-Tree form, the account page, the accounts page (27, 25)
            /admin/trees/<tree-id>   ->  the root Node's editor  [#133] 307, like /<tree-id>
            /admin/trees/<tree-id>/<id-1>/.../<id-n>[?lang=<tag>]   [#133] the editor: the Node page's grammar behind the prefix (24.1)
Dataset     /<tree-id>/tree.json                                 [#118]
Schema      /schemas/elsa-tree-4.json                            [#118]
            /schemas/elsa-tree-5.json                            [#171] the schema of elsa-tree/5; both are served (15.1)
Crawlers    /robots.txt                                          [#118]
Sitemap     /sitemap.xml                                         [#118]
Agents      /llms.txt                                            [#118]
Redirects   /<tree-id>   ->  /<tree-id>/<root-id>[?lang=...]      307
            /            ->  (no longer redirects: the overview)  [#132]
```

- **[#132]** `/<tree-id>/images/<file>` and `/<tree-id>/theme/<file>` replace the two
  Tree-less addresses, which answer 404 from #134 on: with many Trees a bare `/images/<file>`
  names nothing (18.1). Neither new address can be a Node page -- `<file>` carries a dot,
  which the id grammar does not admit -- so, as with `/<tree-id>/tree.json`, **no URL that
  resolves now resolves differently**. `/admin` is one reserved word for the whole admin
  area (4.3, 22.1); `/` is the overview (23.2). The Node page, the Trail in the path, the
  share link and `?lang` are unchanged, by the owner's instruction.

- **[#118]** The five new routes are sections 15 and 16. None of them collides with
  anything: `tree.json`, `robots.txt`, `sitemap.xml` and `llms.txt` contain a dot and so
  can be neither a Tree id nor a Node id (`tree-format.md` 3.1), and `schemas` joins
  `images` and `theme` as a reserved Tree id (4.3). Every one of the five answers 404
  today, so **no URL that resolves now resolves differently**. They ignore `?lang`, as
  the image and theme routes do.

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
  link the absolute URL of the same page; **[#118]** a deployment that sets none gets the
  absolute URL on the request's own origin, because 16.3 renders this link from the same
  address set as the sitemap and the JSON-LD and the three must be one string. Which page
  it points at is unchanged either way: the Trail is dropped and the language kept.
  Recorded in `docs/adrs/ADR-11-public-base-url.md`, amended **[#118]** by the four
  `ADR-118-*` decisions that read the base (16).

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
| Tree id in the path is not the served Tree | 404. **[#132]** "Not the served Tree" reads "not a served Tree of the store" (23.1): a hidden, an unservable, an unknown and a reserved id are one 404. |
| An id is malformed (not the id grammar) | 404. Nothing is looked up on disk for it. |
| An id is well-formed but not a Node of the Tree | 404. |
| Trail adjacency | Not checked: any sequence of existing Node ids is accepted. |
| `lang` not declared by the Tree | Ignored; default language used; 200. This holds for every value, including one that is not a language tag at all: 4.4 keeps such a value out of the route rather than answering an error for it. |
| Image name malformed or not in the Tree's `images/` | 404. **[#132]** Or not named by any Node of the published copy: `imagePath` now serves the referenced set, as `themePath` always has (5.1), because `images/` also holds a draft's uploads (22.6). |
| **[v0.2]** Theme file name malformed or not in the Tree's `theme/` | 404, by the same rule and the same code path as an image (5.5). |
| **[v0.2]** A theme file that exists but the Theme does not name | 404. The route serves what the Theme references, not the folder: a licence text or a stray file next to the fonts is not public. |
| **[#118]** `/<tree-id>/tree.json` where the Tree id is not the served Tree | 404, by the row above; nothing is looked up on disk for it. |
| **[#118]** `/schemas/<file>` other than a schema this repository publishes | 404. The route serves the published set, not a folder -- the same rule, and the same code path, as the theme route's (5.5). |
| Reserved Tree ids | `images`, `theme` (**[v0.2]**), `schemas` (**[#118]**) and `admin` (**[#132]**). A Tree of that id cannot be created (422), seeded or imported (skipped, reason printed); `ELSA_TREE` is gone (18.1). |
| **[#132]** `/admin/...` | Never a Tree page. Without a session: the login page (200, `noindex`); `/admin/api/...` without a session: 401 (22.1). **[#133]** The login page is rendered **at the address asked for** and reloads it on success; no redirect, no `?next=` (24.2). |
| **[#133]** An admin page the caller may not see: an editor address of a Tree they have no role on, `/admin/accounts` for a non-administrator, a reserved or unknown Tree id under `/admin/trees/` for a non-administrator | The **403 page** (`forbiddenTitle`, `forbiddenText`, a link to `/admin`), status 403, in the chrome language; never the login page and never a 404 (21.3, 24.2). |
| **[#133]** An editor address whose path is not a Node of the draft, for a caller with a role | The 404 page above, status 404. |
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
export function openTree(dir: string): Promise<Tree>          // [#132] and openTree(dir, { draft: true }): Promise<Draft>, section 19.2
// Reads and validates tree.json once: the JSON Schema of tree-format.md 3.9 for the
// shape, then the rules of section 7 for the content (**[#119]**).
// Rejects with TreeInvalid { treeId, violations: Violation[] } listing every failure
// with { file, keyPath, rule, message }. Builds the Node index and the title index.

export interface Tree {
  readonly id: string                          // the folder name
  readonly manifest: Manifest                  // languages, defaultLanguage, root, title, description, metadata, theme
  getNode(id: string): Promise<Node | null>    // ONE Node; null for a malformed or unknown id; never throws for bad input
  getTitle(id: string): LocalisedText | null   // from the in-memory index; for a Branch label
  imagePath(file: string): string | null       // absolute path inside this Tree's images/; null for a malformed or missing name; [#132] and for a file no Node names (23.1)
  themePath(file: string): string | null       // [v0.2] absolute path inside this Tree's theme/, and only for a file the Theme names
  nodeIds(): string[]                          // [#120] every Node id, in file order: which pages exist (16.2)
  readonly lastModified: Date | null           // [#120] when the Tree's file was last written; null when it cannot be read (16.2)
  readonly filePath: string                    // [#121] the Tree's own file: what the dataset endpoint streams (15.3)
}
```

- **[#132] `imagePath` resolves only what a Node references**, from #134 on, by the rule
  the next bullet gives for `themePath`: the store's `images/` folder holds a draft's
  uploads beside the published copy's pictures (17.2), and a picture that is only in the
  draft must not be public (22.6). The one way `themePath` was stricter goes away.
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
- **[#120]** `nodeIds` does not break that rule, which is why it could be added by a build
  issue: it hands out **ids**, not Nodes, and the bound of 5.2 is on how many Nodes a
  *page* response may carry. 16.2 says the sitemap is generated "from the loaded Tree's
  Node index", and the set of pages that exist is exactly what it needs; a caller that
  wants a Node still asks for it by id, one at a time. `lastModified` is the second half
  of that sentence -- 16.2 dates every `<url>` from the Tree file, read once here (5.4)
  rather than stat'd per request. #119 replaces the file name behind both, as it does for
  the read itself, and neither signature changes with it.
- **[#121]** `filePath` does not break it either, and for a plainer reason: it is a path,
  and a caller that wants a Node still asks for it by id. 15.3 needs the file the loader
  read -- so that what the dataset endpoint serves is what passed validation, and so that
  the route cannot assemble a path of its own -- and a path is the smallest thing that
  says so.

The types, in `src/tree/types.ts`, mirror `tree-format.md` with two normalisations:
`id` and `kind` are added, and absent lists become empty arrays.

```ts
type LocalisedText = Record<string, string>              // language tag -> text
interface Manifest { format: 'elsa-tree/5';           // [#171] elsa-tree/5 (issue #171); [#119] elsa-tree/4 (issue #118) languages: string[]; defaultLanguage: string;
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
// [#171] `type Outcome` is gone: a Terminal carries its own words (tree-format.md 5.5).
type Node = {
  id: string; title: LocalisedText; description: LocalisedText;
  metadata: { version: string; [key: string]: unknown };
  sources: Source[]; images: Image[]; options: Option[]; explainers: Explainer[]   // [#75]
} & (
  | { kind: 'question'; answers: { yes: string; no: string } }
  | { kind: 'terminal'; label: LocalisedText }      // [#171] was `outcome: Outcome`
  | { kind: 'explanation' }
)
```

Behind the interface, invisible to callers: the JSON parse and the duplicate-key scan of
`tree-format.md` 3.7, the compiled JSON Schema of 3.9, every validity rule, the length and
line rules, path-safety checks, the Node and title indexes, and the parsed Tree held in
memory.

**Amended 2026-09-21 (#119).** Two report forms reach `violations`, and section 7 of
`tree-format.md` says which rule takes which. A **shape** failure comes from the schema:
`file` is `tree.json`, `keyPath` is a JSON Pointer such as `/nodes/3/options/2`, `rule` is
the word `schema`, and `message` is the schema's own. A **content** failure comes from the
rules, as before: `file` is `manifest` or the Node's id, `keyPath` a key path such as
`description.nl`, and `rule` a rule id. The schema runs first and the rules run only when
it passed, so one defect is answered once, by one of the two; neither translates the
other's message (`tree-format.md` 3.9, `ADR-118-json-schema.md`).

### 5.2 When what is read and sent

| Moment | Server reads | Browser receives |
|---|---|---|
| Server start | `tree.json` once, to validate and to build the Node and title indexes. Failure: every violation printed, exit code 1, nothing served. **[#132]** Every published Tree's `tree.json` (17.2); a failure prints that Tree's violations and leaves **that Tree** unserved, the rest serve, and the process exits only when the data directory is unusable (18.3). | -- |
| A request for a Node page | Nothing from disk. The current Node and its neighbourhood -- **at most 17 Nodes** (section 11) -- from the index, and Branch labels from the title index. | Complete HTML: the tree view of section 10 with the current Node as the centre Bubble, its Branches, its Carousel with an `<img loading="lazy">` per Image of this Node, the neighbour Bubbles of section 11 (**without any image URL**), chrome, the Theme's `<style>` block, the disclaimer, the stylesheet and the client bundle. No image bytes, no font bytes. **Amended 2026-09-14 (#42, PR #57, by the owner):** the server renders the neighbours into the page as the tree layer's payload; they enter the DOM only during a slide. At rest, and without JavaScript, the DOM holds the centre Bubble only (11.3). |
| After the HTML | -- | The image files this Node's Interior and strip name, one per Option (its target's main image, on the button), and, once an Overlay is opened, the files of the Node in it (11.5; **[#75]**), through `GET /images/<file>`; the Theme's font and logo files, through `GET /theme/<file>`. Nothing else, and nothing from another origin. |
| The user follows a Branch | Nothing from disk; the target Node and **its** neighbourhood from the index. | **Exactly one** page payload, carrying at most 17 Nodes, then that Node's image files. Section 11 has the accounting. |
| Opening an Image in the Carousel | -- | Nothing new: the enlarged view shows the file the strip already loaded (section 12). |

**Never**, in any **page** response, under any setting:

- more than 17 Nodes' content;
- any Node's text in a language other than the one the page is rendered in;
- a file path, or any route a page follows that returns more than one Node;
- an image file of a Node that is not the centre Bubble (section 11 defines the one
  moment a transition target's images may begin to load);
- a request to any origin but this one (section 13).

**Amended 2026-09-21 (#118):** the list above says **page** where it used to say
*response*, and its third row no longer names the Tree file. The owner's direction of
that day is that the Tree is a public dataset with a URL of its own, and section 15
serves the whole file at `/<tree-id>/tree.json`, byte for byte. That is not a hole in
this bound: no page fetches it, no client component knows it exists, and every number
above is what it was. The rule always protected the *page* -- a reader on a slow
connection opening a Tree of a thousand Nodes -- and never claimed the data was secret;
the content is CC BY 4.0 and the repository is public (core document 8).
`docs/adrs/ADR-118-dataset-endpoint.md` records the restatement.

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

`GET /images/<file>` asks `imagePath(file)`. `null` answers 404. **[#132]** From #134 the
address is `/<tree-id>/images/<file>` (4.1): the route asks `store.published(treeId)` first
and a `null` there is the same 404 (23.1); then `imagePath(file)` on that Tree. Otherwise the file is
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
  `openTree` on the configured Tree at server start. **[#132]** From #134 it calls
  `openStore` (17.5), which opens every published Tree and every draft (18.3).
- `npm run validate <dir>` (`scripts/validate.ts`) runs the same `openTree` and prints
  every violation as `tree-id  file  key.path  RULE  message`; exit code 1 if any.
  **[#132]** `--draft` opens `draft.json` in draft mode and prints the advisory list the
  editor shows (19.2); exit code 1 only for a blocking violation.
  Authors run it before pushing; CI runs it on every PR that touches `trees/`.

Unchanged from 0.1, including this section's number, which those files cite.

### 5.5 The theme route

**[v0.2]** `GET /theme/<file>` asks `themePath(file)`. **[#132]** From #134 the address is
`/<tree-id>/theme/<file>` and the route asks `store.published(treeId)` first, as 5.3. `null` answers 404 -- for a
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
├── trees/                   Tree data: one folder per Tree (elsa-tree/4; [#171] elsa-tree/5 from #179)
│   └── ai-act-example/      tree.json, images/, theme/ -- the development default
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
│   │       ├── [tree]/images/[file]/route.ts   one image file (5.3); [#132] moved under the Tree id (18.1)
│   │       ├── [tree]/theme/[file]/route.ts    [v0.2] one theme file (5.5); [#132] moved likewise
│   │       ├── admin/                    [#132] the admin area: the screens (#133) and
│   │       │   ├── api/...               the route handlers of 22.1, one file per row
│   │       │   ├── page.tsx              [#133] /admin: the login page or the creators' overview (24, 26.4)
│   │       │   ├── new/page.tsx          [#133] the new-Tree form (27)
│   │       │   ├── account/page.tsx      [#133] the caller's name and password (25.2)
│   │       │   ├── accounts/page.tsx     [#133] the administrator's accounts page (25.3)
│   │       │   ├── trees/[tree]/page.tsx [#133] 307 to the root Node's editor
│   │       │   └── trees/[tree]/[...path]/page.tsx   [#133] the editor: authenticated -> permit -> draft -> TreeView with edit (34.7)
│   │       ├── [tree]/tree.json/route.ts [#118] the dataset endpoint (15)
│   │       ├── schemas/[file]/route.ts   [#118] the published JSON Schema (15.1)
│   │       ├── robots.txt/route.ts       [#118] 16.1 (the Sitemap line and the agents)
│   │       ├── sitemap.xml/route.ts      [#118] 16.2 (every Node in every language)
│   │       └── llms.txt/route.ts         [#118] 16.5
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
│   │   ├── ThemeStyle.tsx   [#133] server: the one <style> element of 13.1, emitted by every page
│   │   │                    for the Tree it shows or the default (24.3); the root layout emits none
│   │   ├── Tile.tsx         [#133] server: one Tree on the overview (26.1)
│   │   ├── Authors.tsx      [#195] server: the mention of a Tree's Authors, in the chrome bar and on a tile (39.4, 39.5)
│   │   ├── Overview.tsx     [#133] server: the tile grid in its scroll box, public or creators' (26.2, 26.4)
│   │   ├── ShareButton.tsx  client, unchanged
│   │   ├── LanguageSwitch.tsx  unchanged
│   │   └── Disclaimer.tsx   unchanged
│   ├── findability/         [#118] four documents built from the Tree and one base URL (16)
│   │   ├── robots.ts        robots.txt: the wildcard, the named agents, the Sitemap line (16.1)
│   │   ├── sitemap.ts       sitemap.xml: one <url> per Node per language, with the alternates (16.2)
│   │   ├── jsonld.ts        the @graph: the Dataset, the WebPage, the Question (16.4)
│   │   └── llms.ts          llms.txt (16.5)
│   ├── neighbourhood.ts     [v0.2] which Nodes surround this one: placed up and down, and the asides (11)
│   ├── theme.ts             [v0.2] a Theme -> CSS custom properties and @font-face; the default (13)
│   ├── assets.ts            [v0.2] one file of the Tree as a response: the headers and the
│   │                        streaming the image and theme routes share (5.3, 5.5)
│   ├── url.ts               the URL scheme (4); [#118] the absolute form and a Node's alternates (16.3)
│   ├── chrome.ts            chrome strings and fallback (3)
│   ├── fonts.ts             [#171] FONT_LIBRARY and FONT_LICENCES: the font library's list and the licence list (37.1, 37.5); pure
│   ├── config.ts            ELSA_TREE / ELSA_TREES_DIR; the one opened Tree; [#132] ELSA_DATA_DIR,
│   │                        ELSA_SEED_DIR, ELSA_ADMIN_PASSWORD, the three retired variables refused (17.1);
│   │                        [#195] ELSA_ADMIN_EMAIL (38.3)
│   ├── store/               [#132] the store (17.5): the one module that opens ELSA_DATA_DIR
│   │   ├── index.ts         openStore, the atomic writer and its queues, the lock, the seed (17.3, 17.4)
│   │   ├── accounts.ts      accounts, scrypt, the login rate limit (20.1 to 20.3, 20.7); [#195] by
│   │   │                    e-mail address, and the conversion of a store of user names (38)
│   │   ├── authors.ts       [#195] authorsOf: a Tree's Authors' names, in the order of joining (39.3); pure
│   │   ├── sessions.ts      the token, the record, the cookie string, expiry (20.4)
│   │   ├── permissions.ts   permit: the table of 21.2 as code (21.3)
│   │   ├── drafts.ts        the writes of 22.2 to 22.5, publish and unpublish (19.3, 19.4), importTree
│   │   ├── images.ts        sniffing, naming, the file write, the unreferenced-file sweep (22.6)
│   │   └── woff2.ts         [#171] woff2FamilyName: an uploaded font's own family name (37.4); pure
│   ├── markdown.ts          rich-text subset -> safe HTML, with the explainer marks (10.8);
│   │                        [#118] and -> plain text, and the 155-character description (16.3)
│   ├── tree/                the Tree loader module
│   │   ├── loader.ts        openTree and the Tree interface (5.1); [#132] the draft mode and the derived draft schema (19.2)
│   │   ├── validate.ts      the rules of tree-format.md section 7; [#132] and the draft mode's blocking/advisory tag
│   │   └── types.ts         the types of elsa-tree/4 (5.1); [#171] of elsa-tree/5 from #179
│   ├── admin/               [#135] the admin pages' server-side helpers: authenticated.ts, headers.ts, requests.ts, words.ts
│   │   └── slots.tsx        [#138] the editor page's EditMode: the words and the slot functions of 34.2; later issues add theirs here
│   ├── editor/              [#133] the editor's client components, leaves (34.4); import measure.ts, grammar.ts and markdown.ts only
│   │   ├── mode.ts          the EditMode type and the slots (34.1, 34.2); server side
│   │   ├── links.ts         the admin Links: the /admin/trees prefix, adminImageHref (34.3); server side
│   │   ├── Editor.tsx       client: the provider -- the write queue, the indicator, the session Sheet (29)
│   │   ├── Field.tsx        client: one editable region, plain or source, with its counter (28); the add-Source form and the Operation button
│   │   ├── queue.ts         [#138] the write queue: the debounce, one request in flight, the retry ladder, the pause (29.1, 29.5, 29.6); pure
│   │   ├── fields.ts        [#138] a Node's fields by key path, the queue's key, the plain-line and V-HTML rules (22.2, 29.7); pure
│   │   ├── writes.ts        the one caller of fetch against /admin/api/, one function per route used
│   │   ├── slug.ts          the id proposed from a title or a selection (27.1, 32.1); [#168] a new Tree's address
│   │   ├── LoginForm.tsx    client: the login card, on the login page and in the session Sheet (25.1, 29.6)
│   │   ├── NewTreeForm.tsx  client: the new-Tree form (27)
│   │   ├── ImageSlot.tsx, AttachSheet.tsx     client: the pickers and the attach dialog (31)
│   │   ├── Structure.tsx, StepButtons.tsx    client: the three buttons, the side +, the side bubble's delete; [#178] the step's red cross and "Tree does not end here after all", in place of StepMenu.tsx, the link menu and the picker (30)
│   │   ├── Marker.tsx, ExplainerSheet.tsx    client: marking and the explainer Sheet (32)
│   │   └── Panel.tsx        client: the top panel (33)
│   ├── tree/measure.ts      [#133] countedText, countedLength, estimatedLines, moved from validate.ts (28.4); pure
│   ├── tree/grammar.ts      [#137] isId, isLanguageTag, countedText, countedLength: the grammars a form checks before it sends (27.1, 28.4); pure, imports nothing
│   ├── tree/convert.ts      [#179] convertTree: tree-format.md 12.7.1, elsa-tree/4 to elsa-tree/5, which the migration and the store both run (36.4); pure
│   ├── session.ts           [#135] authenticated(): the session resolved for a route handler or a page (20.4, 20.6)
│   └── instrumentation.ts   startup validation (5.4)
├── schemas/elsa-tree-4.json [#118] the format's JSON Schema, served at /schemas/ (15.1)
├── schemas/elsa-tree-5.json [#171] elsa-tree/5's JSON Schema, frozen by #171; the /4 file stays beside it, still served (15.1)
├── fonts/                   [#171] the font library (37.1): one folder per family -- two WOFF2 files and its OFL.txt -- and README.md
├── scripts/validate.ts      `npm run validate`; [#132] --draft
├── scripts/store.ts         [#132] `npm run store -- import <folder>` (17.4)
├── scripts/migrate-tree.ts  [#119] the canonical byte form of tree-format.md 3.7: what is
│                        left of the migration after #119 ran 3 -> 4 (12.6)
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
| `src/assets.ts` **[v0.2]** | One file of the served Tree as an HTTP response: the `Content-Type` its extension names, the four headers that make third-party bytes inert, and the one 404 that covers every refusal (5.3, 5.5). **[#118]** The dataset endpoint and the schema route are two more files served through it, with the extra headers of 15.2. | Resolve a path -- `imagePath` and `themePath` do, inside the Tree's folder. Know which Tree is served. |
| `src/findability/` **[#118]** | The four documents of section 16, each a pure function of the loaded Tree and one base URL: `robots.txt`, `sitemap.xml`, the JSON-LD graph, `llms.txt`. One of them, the address set of a Node (16.3), is `url.ts`'s and is called by two of these and by the page head, which is what keeps the sitemap and the head from disagreeing. | Read files, render React, or decide what the base URL is -- the route hands it in. |
| `src/url.ts` | Parsing a request into `{ treeId, trail, nodeId, lang }` and building every link. **[#118]** Also the absolute form of a link against a base, and a Node's **address set**: its canonical URL per declared language and which is the default (16.3). | Read files or render. |
| `src/chrome.ts` | The chrome strings and the language fallback rule. | Contain Tree content. |
| `src/config.ts` | Environment variables, reserved-id check, the process-wide opened Tree. **[#132]** The data, seed and admin-password variables, the refusal of the three retired ones; the process-wide opened **store**. | Parse Trees or URLs. Open a file under `ELSA_DATA_DIR` -- `src/store/` does. |
| `src/store/` **[#132]** | Everything under `ELSA_DATA_DIR` (17): the set of published Trees and their swap in place, accounts, sessions, the permission table, the draft writes, publishing, uploads, the seed and the import. Every writing member takes the acting `Account` and calls `permit` itself. | Know URLs, React, or what a screen shows. Read a Tree file except through `src/tree/`'s `openTree`. Send a response -- the route handlers of `src/app/[lang]/admin/api/` do. |
| `src/markdown.ts` | The rich-text subset to HTML, HTML disabled, links in a new tab; **[#75]** a `[text](#id)` mark to a marked term and its explainer panel (10.8), given the Node's explainers. **[#118]** Also the rich-text subset to **plain text**, and the 155-character cut built from it (16.3). Two outputs from one reduction: the meta description and the `WebPage`'s `description` take the cut string, the `Question`'s `text` and `llms.txt`'s blockquote take the uncut one, and the table in 16.3 says which is which. | Accept raw HTML. Know what the panel looks like. |
| `src/components/` | Views. Server components take data and return markup -- `Logo.tsx` **[v0.2]** is one: it asks `theme.ts` which logo variant this palette calls for and renders it, or the Tree's title when there is none (13.2). The four client components own exactly one interaction each (section 1); the interim fifth of #41, `Thumbnails.tsx`, was removed by #43 (above). | Touch the file system, environment or request. Decide *which* Nodes are on screen -- that is `neighbourhood`. |
| `src/app/` | Routes: parse, load, hand to a view; redirects; the image and theme routes; 404. The `[lang]` layout sets `<html lang>` and emits the Theme. **[#132]** Every public route asks `store.published(treeId)` first (23.1); every handler under `admin/api/` is `authenticated → permit → store → JSON` and nothing more (22.1). | Hold logic. Take the language from `searchParams` (4.4). **[#132]** Read `Cookie` outside `/admin`. |
| `next.config.ts` | The two rewrites of 4.4, plus the build settings of section 1. | Know which languages a Tree declares, or anything else about the application. |

Dependencies point inward, and the client components are leaves:

```
app  ->  components  ->  chrome, url, markdown, theme, tree/types
app  ->  findability  ->  tree (getNode, getTitle), url, markdown, chrome     [#118]
app  ->  neighbourhood  ->  tree (getNode, getTitle), url
app  ->  theme  ->  url (themeHref)
app  ->  assets  ->  nothing in src/
findability  ->  assets (the two licence URLs of 15.2)                       [#121]
app  ->  url, chrome, config, markdown
app  ->  store                                                             [#132]
config  ->  tree
config  ->  store                                                          [#132]
store  ->  tree (openTree, validateTree, the byte-form writer), nothing else in src/   [#132]
tree/  ->  nothing in src/
next.config.ts  ->  nothing in src/
app  ->  editor (the pages mount Editor, LoginForm, NewTreeForm, Panel and build the EditMode)   [#133]
components  ->  editor (the EditMode type only; a slot's element is handed in, never imported)  [#133]
editor  ->  tree/measure, markdown (both pure), and nothing else in src/                          [#133]
app  ->  session  ->  store (sessions.resolve)                                                    [#135]
store  ->  fonts (FONT_LIBRARY, libraryEntry, copyName), at run time                             [#180]
theme  ->  tree/grammar (refusedInFamily)                                                         [#180]
app  ->  fonts (the editor page: the library and the licence list, for the Theme panel)          [#180]
fonts  ->  tree/types                                                                             [#180]
```

- **[#180] Amended 2026-10-03: three edges #180 adds.** `src/store/drafts.ts` imports
  `src/fonts.ts` at run time: `use-library-font` reads the library's list, the entry it writes
  and the server names of its files there (37.3). So the line `store -> tree ..., nothing else
  in src/` now reads: `tree`, and the pure `fonts.ts`. `src/theme.ts` imports `refusedInFamily`
  from `src/tree/grammar.ts` (13.3, amended), and the editor's page imports `fonts.ts` to hand
  the library and the licence list to the Theme panel as props. `fonts.ts` is pure and imports
  only types of `tree/`.

- **[#133] `src/editor/` is a leaf, like the four client components.** Its modules take
  strings and ids, reach the write queue through React context, and import of `src/` the
  two pure modules named -- `tests/editor/imports.test.ts` reads the files and fails on any
  other import from `src/`, on a `node:` module, on `ajv` or on the schema. `markdown.ts`
  must therefore stay pure, which it is once `countedText` lives in `tree/measure.ts`
  (28.4). `src/components/` never imports a client component of the editor: a slot's
  function (34.2) returns the element, built by the page.

- **[#121] `findability -> assets` is the one edge into `assets.ts` that is not a
  route's.** `llms.txt` names the content and code licences (16.5), and they are the
  strings 15.2 puts on the bytes themselves, so they are declared where they are sent and
  read from there rather than written twice. The constants do not move to `url.ts`
  instead: that would make `assets -> url` and cost the stricter line above it, which says
  `assets` imports nothing in `src/` at all -- and it still does not. #122's `jsonld.ts`
  takes `CONTENT_LICENCE_URL` over this same edge for the `Dataset`'s `license`.
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
`docs/adrs/ADR-5-repository-layout.md`. **[#118]** What this freeze adds above is
recorded in the six `ADR-118-*` decisions that add the files -- `dataset-endpoint`,
`json-schema`, `crawler-access`, `sitemap-and-alternates`, `json-ld` and
`llms-txt` -- each of which carries an `Amends:` line to `ADR-5-repository-layout.md`,
which carries one back.

## 7. Testing approach

**Amended 2026-09-21 (#118).** Sections 15 and 16 add five routes, the module folder
`src/findability/`, a member on `url.ts` and a member on `markdown.ts`. Every one of them
has a row below, in the Unit table or the Browser table, and every row names **the build
issue that writes it** (`ADR-118-build-order.md`). The rule of this freeze is that a
contract of 15 or 16 arrives with the test that would fail if it regressed, in the same
branch as the code: no build issue of this round is done while its row here is empty. The
three test sentences in the prose of 16 (16.1 on the tokens and the absent `Disallow`,
16.2 on the single-language sitemap, 15.2 / 16.4 on the holder line) are those rows'
detail, not a second place to look.

| Item | Contract |
|---|---|
| Runner | Vitest, `npm test` = `vitest run`, Node environment; files `tests/**/*.test.ts(x)`. **[#132]** `tests/store/*.test.ts` open a store on a temporary directory (`fs.mkdtemp`) seeded from a fixture; never the developer's `.elsa-data`. |
| Browser runner **[v0.2]** | Playwright, `npm run test:browser`, `tests/browser/*.spec.ts`, against `next build` + `node .next/standalone/server.js`. **In the contract now**, because the no-scroll rule (10.6) is a statement about a laid-out document and cannot be asserted any other way. A spec that needs a Tree other than the example starts its own server with `tests/browser/serve.ts`, a helper and not a spec file (amended 2026-09-14, #43). `tests/browser/credits.ts` is a helper too: it lists every picture a Tree shows, Node by Node in strip order, and reads each one's credit off the caption line by the keyboard alone, for `carousel.spec.ts` and `tests/first-tree/walk.spec.ts` (amended 2026-09-14, #55). |
| Also in CI | `tsc --noEmit`, `next build`, `npm run validate trees/<each Tree>`, `npm run test:browser`. Command: `npm ci && npm test && npm run build && npm run test:browser`. |
| Loading a fixture | `const tree = await openTree(path.join(__dirname, 'fixtures', '<name>'))`. **[#132]** A browser spec that needs its own server starts it with `ELSA_DATA_DIR` a fresh temporary directory and `ELSA_SEED_DIR` the fixture's parent folder (17.1), not with `ELSA_TREE`; `tests/browser/serve.ts` does it. The rows the round adds are in 23.7. Never hand-built `Node` objects; **[#118]** and never a Tree file parsed by the test itself -- a test that wants a Tree opens it through the loader, whatever the serialisation is. (This row read "never YAML read by a test" until #118; the fixtures become `tree.json` with #119, and the rule was never about YAML.) |
| Fixtures | `trees/ai-act-example/` (complete, `en` + `nl`, **with a Theme**, one explainer on `start`); `tests/fixtures/single-language/` (`nl`, **no Theme**); `tests/fixtures/other-languages/` (`de`, `fr`, **with a Theme**); `tests/fixtures/invalid/<rule>/` (one Tree per validity rule, **[#75]** V-EXPLAINER and V-MARK included); **[v0.2]** `tests/fixtures/full-node/` (one Node at every maximum the format allows: an 80-character title, a 600-character 8-line description (**[#102]** 150 characters and 2 lines since the limit was cut), 3 Sources, 8 Options whose targets each lead with an Image, 10 Images, **[#75]** 8 explainers of 40 and 200 characters each marked once, and a 49-entry Trail to reach it); **[v0.2]** `tests/fixtures/carousel/` (the Carousel's, #43: a Node with nine Images after its main one, more than the strip's seven, a Node with two, a Node whose first credit is the format's maximum of 120 characters, and a Terminal with one that no other page may request); **[#75]** `tests/fixtures/overlay/` (an explanation Node at every maximum with eight Options of its own, reached by an Option, for the Overlay at its largest, 10.9); **[#75]** `tests/fixtures/explainers/` (amended 2026-09-18, #83: eight explainers of 40 and 200 characters, `en` and `nl`, marked in one paragraph of a question Node, for the explainer panel at its largest, 10.8). **[#118]** `tests/fixtures/findability/` (**#120** creates it, **#122** extends it): a two-language Tree whose manifest has **no `description`**, so the `Dataset` and `llms.txt` fall back to the root Node's; whose `title` and one Node `title` carry `&`, `<`, `>`, `"` and a literal `</script>`, so the XML escaping of 16.2 and the JSON escaping of 16.4 are exercised rather than assumed; with one Node holding two `kind: legal` Sources at one URL and one at another, so `isBasedOn`'s most-frequent rule has something to choose; one Node with **no** Source at all; a Terminal and an explanation Node, so the "no `Question`" half of 16.4 has a subject; and a description over 155 counted characters whose 155th character falls inside a word, for the cut. The single-language half of 16.2 and 16.5 uses `tests/fixtures/single-language/`, which already exists. **[#122]** Two corrections to this row, made in building it. The Node title also carries `<!--`, the second sequence 16.4's sink refuses, which this row named for the test but not for the fixture. And **the over-155 description is not in this fixture, because the format forbids it**: a Node `description` is at most 150 counted characters and a Tree `description` is rich text whose reduction is shorter still (`tree-format.md` 5.7), so no valid Tree can exercise steps 3 and 4 of 16.3 -- which is 16.3's own point, that the cut does not fire for a conforming Tree. The cut is asserted on strings in `markdown.test.ts`, where it can be. **[#122]** `tests/fixtures/tied-sources/` is new: one language, two `kind: legal` Sources at two URLs with one citation each, and a `literature` and a `case-law` Source that no count of legal Sources may see -- the tie 16.4 breaks by first occurrence in Node order, which no other fixture can produce. |
| Rendering views | `renderToStaticMarkup` from `react-dom/server` on the synchronous components, with data from the loader. |
| **[#133]** The editor round's tests | Section 35: a data directory built by `tests/browser/admin.ts` from fixtures and a table of accounts, never committed; one server per spec through `serveStore`; one login helper; the admin pages under the no-scroll test with `[data-scroll-box]` exempted (26.3); one spec per build issue (35.4); the sweep's admin half (35.5); the public suites run unchanged (35.6). **[#195]** And, from 2026-10-03, 38.10 and 39.9: the login by e-mail address and the Authors. |

**Which tests are unit and which need a browser.** The rule is: a claim about *markup*
is a unit test; a claim about *layout, motion or network* needs a browser.

| Unit (Vitest) | Asserts |
|---|---|
| `loader.test.ts` | Every validity rule via `invalid/<rule>/`; `getNode` returns one Node; malformed ids give `null`; **[v0.2]** `themePath` gives `null` for a file the Theme does not name, even when it exists. **[#118] #119 adds** the duplicate-key scan of `tree-format.md` 3.7, which is the one rule the JSON parser cannot check: a `tree.json` with a repeated key at the top level, inside a Node, inside a localised text and inside `metadata` is refused with the position of the first repeat, and -- the assertion that makes the test worth having -- a test asserts directly that `JSON.parse` accepts the same bytes, so the scan cannot be quietly replaced by a parse that reports nothing. `tests/fixtures/broken/duplicate-key/` is that fixture (12.6.3). |
| `url.test.ts` | Parse and build are inverses; every 404 case of 4.3; the 50-id limit. **[#118] #120 adds**: `absolute()` against a base with and without a trailing slash, and against a base that is unset (the request origin); the **address set** of 16.3 -- one canonical URL per declared language, the default language's carrying no `?lang`, the set identical for every Node kind, and `schemas` refused as a Tree id (4.3). |
| `findability/robots.test.ts` **[#118]** (**#120**) | The generated `robots.txt` against a fixture: the `User-agent: *` block with `Allow: /`; **every one of the twenty tokens of 16.1 appears exactly once**, so a token lost in an edit fails here; **the file contains no `Disallow` line at all**; one absolute `Sitemap:` line, built from `ELSA_BASE_URL` when set and from the request origin when not; the media type is `text/plain`; no cookie. |
| `findability/sitemap.test.ts` **[#118]** (**#120**) | The generated `sitemap.xml` against `ai-act-example/` (`en` + `nl`) and `tests/fixtures/single-language/`: one `<url>` per Node per declared language; every `<loc>` absolute and equal to that Node's address set entry, so the sitemap and the page head cannot disagree; the `xhtml:link` alternates including the self-reference and `x-default`; **a single-language Tree emits no alternates at all** (16.2); `<lastmod>` from `ELSA_TREE_LASTMOD` when set and the Tree file's mtime otherwise; the document is well-formed XML and every value XML-escaped, checked with a Tree whose title carries `&` and `<`. |
| `findability/jsonld.test.ts` **[#118]** (**#122**) | The `@graph` of 16.4 against the fixtures: the `Dataset` on the root page only and every other page referring to it by the same language-independent `@id`; the `Dataset`'s required `name` and `description`, and the fall back to the root Node's description when the manifest has none; `isBasedOn` as the most frequent `kind: legal` Source URL with ties by Node order, and **absent** on a Tree with no legal Source; a `WebPage` on every page; a `Question` with two `suggestedAnswer` entries on a question Node and **no `Question`** on a Terminal or an explanation Node; no `QAPage` and no `acceptedAnswer` anywhere. **And the escaping**, which is the rule of 13.3 at a second sink: a Tree whose Node title contains `</script>`, `<!--` and a lone `<` is rendered, and the emitted script's text is asserted to contain no `<` character at all, to parse as JSON, and to parse back to the original title. A test that only checks the parsed object would pass the tautology this freeze removed. |
| `findability/llms.test.ts` **[#118]** (**#121**) | The generated `llms.txt` of 16.5 against the fixtures: the sections and their order; the H1 and the blockquote from the manifest in the **default** language, falling back to the root Node's description when the manifest has none; **no Node's title, description or Source appears anywhere in it** -- it is a signpost, and a test that fails when Tree content leaks into it is what keeps it one; every URL absolute; the dataset and schema entries, the root URL, the sitemap, the URL grammar line, the declared languages with the default marked, and both licences with the holder line; `text/plain` as the media type; **no `llms-full.txt` route exists** (16.5). |
| `routing.test.ts` | The two rewrites of 4.4, read out of `next.config.ts` itself. |
| `chrome.test.ts` | The table in 3.1; every key of 3.2 exists in both languages; **[#75]** every outcome badge is at most 40 characters (10.1) -- **[#171]** gone with the outcome words: the badge's words are the Tree's, held to 19 by V-LENGTH (36.1); `up(title)` contains the title it is given. |
| `not-found.test.tsx` | The 404 page of 4.3. |
| `neighbourhood.test.ts` **[v0.2]** | The set for each Node kind; **never more than 7 placements and 8 asides**; no id placed twice; a Link to an unknown id is dropped, not thrown; the Trail supplies `up` (the parent only), the Answers `down`, the Options the asides in Option order; an empty Trail has no `up`; there is no `side` direction (**[#75]**, 11.2). |
| `theme.test.ts` **[v0.2]** | The emitted properties equal the manifest's values; a Tree with no Theme, and one with only `colours`, get the documented defaults for the rest; the three derived `--elsa-on-*` colours; a `family` containing `'`, `\` or `</style>` is escaped or refused; a colour that is not `#rrggbb` is refused rather than emitted. |
| `stylesheet.test.ts` **[v0.2]** | `globals.css` contains no colour literal (`#rgb`, `#rrggbb`, `rgb(`, `hsl(`, a CSS colour keyword) and no `font-family` value that is not `var(--elsa-font-*)`. This is core document section 9's "the frontend must never carry a lab's branding in its code", as a test that cannot be argued with. |
| `views.test.tsx` | Each situation's structure (10.3): what the Interior holds -- the main image as a link named by `enlarge` and its description and described by its credit, or the empty slot; the title; the description with its marked terms and their panels (10.8); the Sources heading and the two kind prefixes that remain -- which controls exist and where they link: the up arrow's `href` on a Node with a Trail, at the root and on a Node opened without one; both Answer buttons the same shape with the chrome word, a colon and the title in one label; `startAgain` on a Terminal and on an explanation Node shown as the centre; the Option buttons in the fan's order with their targets' first Images, and the fan's numbers for one, two, five and eight Options; each Option's Overlay as a closed disclosure holding the target's Interior and its Options as links, with the heading link, and `open` on the one the URL names (10.9); the strip's markup (12): the Images after the first, `loading="lazy"` with `width` and `height`, no button and no caption element, no strip on a Node with fewer than two Images; nothing in the markup keyed to a credit's length. **[#75]**, rewritten by #80, #81 and #82. |
| `markdown.test.ts` | The subset of `tree-format.md` 3.4; **[#75]** a `[text](#id)` mark renders the term and its panel of 10.8 and a mark to an unknown id is refused. **[#118] #120 adds** the plain-text reduction of 16.3: a link becomes its text and an explainer mark its term, emphasis and code markers go, a `\n` becomes one space and runs of whitespace collapse, and the result contains no Markdown syntax character left over -- and the **155-character cut** separately: a description under the limit is returned whole and uncut, one over it is cut on a word boundary with a single-character ellipsis, the cut counts Unicode code points and never splits a surrogate pair or a combining sequence, and the same input gives the same output every time. **Both outputs are asserted**: the reduced string and the cut string are returned by one function, and the test checks that the cut string, with any trailing ellipsis removed, is a prefix of the reduced one (or equal to it), so the `Question`'s `text` and the meta description can never come from two different reductions (16.3). |
| `interop.test.tsx` | Below. |

| Browser (Playwright) | Asserts |
|---|---|
| `no-scroll.spec.ts` **[v0.2]** | The exact test of 10.6, at every named viewport, on every page of its list, with every Sheet open in turn -- **[#75]** each Option's Overlay and each picture's enlarged view included -- and with each explainer panel open by focus, and again with JavaScript disabled; the mid-transition rows with every Sheet closed. |
| `transition.spec.ts` **[v0.2]** | The request accounting of 11.5: one page payload per navigation, at most 17 Nodes in it, on load only the centre Node's files and one per Option, after opening an Overlay that Node's files, no image of a placed neighbour, no request for the Tree; the URL after a slide equals the plain-link URL; back reverses it; `prefers-reduced-motion` removes the motion and keeps the navigation; the neighbour frame of a running slide is `inert`, and a slide started with a Sheet open closes it first; **[#75]** an Option opens its Overlay and nothing slides; the up arrow slides up. |
| `theme.spec.ts` **[v0.2]** | Every request while loading a themed Node page is same-origin; the logo is visible; changing a colour in `tree.json` and restarting changes the page with no code change (**[#118]**, the file renamed by **[#119]**). |
| `tree-view.spec.ts` **[v0.2]** | The tree view in a browser: what a click on the up arrow and on each Answer button does to the URL (10.2, 10.3), on `/<tree>/start/<a>/<b>` the arrow lands on `/<tree>/start/<a>`; Tab reaches every control in document order and Enter follows each; an Option button opens its Overlay, the cross, Escape and a click outside close it, focus returns to the button, the address is unchanged throughout, and a direct request for an explanation Node's URL renders its parent with the Overlay open (10.9); the collapsed Sheets open, list their links, close on Escape; the minimum-size notice names the dimension that is short (10.4); the contrast of the Answer label on its fill is at least 3 : 1 (10.3); the screenshots of #80, #81 and #82. **With JavaScript disabled**, section 14: the arrow and the Answer buttons navigate, the Option button is a disclosure that opens the Interior, the collapsed groups are plain lists. There is no `no-js.spec.ts`. **[#75]** |
| `carousel.spec.ts` **[v0.2]** | The Carousel in a browser, against `tests/fixtures/carousel/`: the image files requested on load and on enlarging, and never another Node's (12.4, 11.5); one tab stop, Left/Right/Home/End, Enter or Space enlarges, `previous` and `next` page the enlarged view, Escape closes and returns the focus (12.3); the credit visible in the enlarged view for every picture and read as each picture's description; the names in `en` and `nl`; below step 1 the one control says `imageCount` and opens the enlarged view (10.5); **with JavaScript disabled**, a thumbnail opens its file, the strip is a tab stop the arrow keys scroll, a Node with one Image has no stop there, and the `<noscript>` control pages the Images as disclosures with their credits (14); **[#75]** no button and no caption is rendered (12.2). |
| `node-view.spec.ts`, `trail.spec.ts`, `language.spec.ts` | The 0.1 browser specs, kept: the URL scheme, the Trail in the path and the language mechanism are unchanged contracts and keep their tests. **[#75]** `trail.spec.ts` and `tests/trail.test.tsx` are rewritten by #82 for what is drawn -- the up arrow and its `trailHref` -- since the Trail Branches and the Trail Sheet are gone (10.2); the path and `trailHref` they assert do not change. **[#118]** `deployment.spec.ts` moves to its own row below: the deployment shape is no longer unchanged. |
| `deployment.spec.ts` **[#118]** (**#121**, extended by **#120** and **#122**) | **The no-cookie sweep, and the one place that sweep is named.** 15.2's last row and the row of section 8 that carries core document 8 both point here, so this spec is a contract of #118 and not a 0.1 spec kept as it was. It sweeps every Node page **and every route of 15 and 16** -- `/<tree-id>/tree.json`, `/schemas/elsa-tree-4.json`, `/robots.txt`, `/sitemap.xml`, `/llms.txt` -- and asserts that not one response carries a `Set-Cookie`, that not one request leaves this origin, and that the browser's cookie jar is empty after the walk. Each route is added by the issue that adds the route; the sweep's list is one array, so a route added without a line here is visibly absent. It also asserts, on the two routes of 15: the header table of 15.2 in full, both `Link` values, `ETag` with a `304` on `If-None-Match`, `Access-Control-Allow-Origin: *` **with no `Access-Control-Allow-Credentials`**, `HEAD` answering with the same headers and no body; and **byte-identity** (15.3) -- the bytes fetched from `/<tree-id>/tree.json` equal `trees/<tree-id>/tree.json` on disk, byte for byte, which is the one claim of section 15 that cannot be made in a unit test. The 0.1 deployment assertions it already held -- the standalone server starting, the routes it answers -- stay. |
| `findability.spec.ts` **[#118]** (**#120**, extended by **#121** and **#122**) | What only a served page or a served document shows. In the page head (16.3): one `<link rel="canonical">` per page equal to that page's address-set entry, one `<link rel="alternate" hreflang>` per declared language plus `x-default`, the `<meta name="description">` equal to the reduced and cut description, and **the head's canonical, the sitemap's `<loc>` and the JSON-LD's `@id` are the same string for the same page** -- the three are generated from one address set (16.3) and this is where that is checked end to end. **[#121]** One `<link rel="alternate" type="application/json">` per page, and the test **fetches the `href` it finds there** and asserts `200` with `application/json` -- the head link of 16.3 and the route of 15.1 are one issue's deliverable (`ADR-118-dataset-endpoint.md` decision 6), and this is the assertion that fails if either ships without the other. On the served documents: `/robots.txt`, `/sitemap.xml` and `/llms.txt` answer `200` with their media types on the example Tree, `/sitemap.xml` parses in the browser's XML parser, and each is regenerated per request rather than served from `public/`. **[#122]** The JSON-LD script of every page parses as JSON, validates as one `@graph`, and on a Tree whose Node title carries `</script>` the element still closes where the server put it -- the escaping of 16.4 asserted against a real HTML parser, which is the only place the tautology this freeze removed would have shown. |
| `explainer.spec.ts` **[#75]** | The explainer panel in a browser, against `tests/fixtures/explainers/` (amended 2026-09-18, #83: its own file rather than a part of `tree-view.spec.ts`): a marked term opens its panel on hover, focus and tap and closes it on leaving, blur and Escape, Escape also on a page reached by a slide; one panel is open at a time; Tab reaches every term in text order; the term's accessible description is its explainer and the panel is a `tooltip`; resizing the window closes it; at each viewport of 10.6 above the floor in `en` and `nl` every panel lies inside the text area, at most 320 pixels wide and, where the area is at least 320 wide, 148 tall, placed by the rule of 10.8 -- below its term's line if it fits, else above, else against the area's edge on the side with more room -- and in an area cut too short for either side that last branch is reached (10.8); **with JavaScript disabled**, hover and focus open it at the foot of the text area, full width, and it stays open while the pointer rests on it over its own term (14); the screenshots of #83, in `docs/screenshots/issue-83/` under `ELSA_SHOTS=1`. That every page still fits with each panel open is `no-scroll.spec.ts`'s. |
| `tests/first-tree/explainers.spec.ts` **[#75]** | The 148 pixels of 10.8 on real text (#103): it walks the first Tree from the root through every Answer and Option, hovers every marked term of every Node that lists explainers, and fails if an open panel is wider than 320 or taller than 148 pixels, in `en` and `nl` at 1280 x 640 and 1920 x 1080; a Node that lists explainers and shows no marked term fails too. The `explainers` fixture of `explainer.spec.ts` has short words in the machine's font; the first Tree's Dutch has long ones in Open Sans. Under `npm run test:first-tree`, beside the first Tree's other specs, and **not** in `npm run test:browser`, which serves the example Tree and the fixtures: a change to the panel's CSS or to the first Tree's explainers is checked by running it by hand, on Linux as well as on Windows (amended 2026-09-19, #103). |
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
`docs/adrs/ADR-5-testing-approach.md`. **[#118]** The rows this freeze adds are
recorded in the six `ADR-118-*` decisions that add the files they test, each of
which carries an `Amends:` line to `ADR-5-testing-approach.md`, which carries one
back.

## 8. What the contracts guarantee to the core document

| Core document | Where it is met |
|---|---|
| 1 **[#118]** findable by search engines, dataset indexes and AI crawlers | section 16 in full: 16.1 robots, 16.2 sitemap, 16.3 hreflang and description, 16.4 JSON-LD, 16.5 `llms.txt` |
| 3.1 **[#118]** JSON only, one format from one schema, written by tools | `tree-format.md` (`elsa-tree/4`; **[#171]** `elsa-tree/5`), 3.7 and 3.9; 5.1, 5.2 |
| 8 **[#118]** the Tree data is public under CC BY 4.0, served with no cookie and no account | 15.2: the licence in a `Link` header on the bytes themselves, and the no-cookie sweep -- `tests/browser/deployment.spec.ts` (section 7) -- extended to every route of 15 and 16 |
| 10.21 **[#118]** superseded: hand-editability is no longer the criterion | `tree-format.md` 3.7, 3.9; `docs/adrs/ADR-118-json-serialisation.md` |
| 3.1 one file per Tree | `tree-format.md` (`elsa-tree/4`; **[#171]** `elsa-tree/5`); 5.1, 5.2 |
| 3.1 / 9 never the whole Tree, a bounded set of neighbours | 11.2 (at most 15 neighbours, 17 Nodes in a page; **[#75]** was 16), 11.5 (the accounting), 5.2 (**[#118]** never, in any **page** response; of the two routes of 15.1, the dataset route is the one that serves a whole Tree file, and it is a dataset, not a page) |
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
| 4 / 8 no accounts, cookies, tracking, analytics, database | 1 (no cookie, no telemetry), 2 (files only), 5. **[#132]** For end users unchanged: 20.5 (no public route sets or reads a cookie; the sweep). For creators: 20 (accounts, one cookie on `/admin`), 17 (JSON files, no database server). |
| 3.4 **[#132]** many Trees, an overview in front, every share link kept | 18, 23.2 |
| 3.4 **[#132]** saved automatically; hidden until Publish; a published Tree follows every valid save | 19 |
| 3.4 / 8 **[#132]** creators with a name, a login, an administrator over every Tree; nothing about a creator on a public page or in a Tree file | 20, 17.2; **[#195]** (2026-10-03) the login an e-mail address (38), and an Author's name on its Tree's pages and nowhere else (39.8) |
| 3.4 / 9 **[#132]** every write checked on the server for that account and that Tree | 21, 22.1 |
| 9 **[#132]** a hidden Tree on no public route, in no document | 23.1 |
| 10.30 to 10.34 **[#132]** | 17, 20.1, 20.3, 19.4, 18 |
| 7 plain Linux server, no vendor features | 1: standalone `node server.js`; `docs/deployment.md` |
| 7 / 9 nothing fetched from a third party at run time | 13.5; `theme.spec.ts` records every request |
| 9 third-party Tree never breaks the frontend | 3 (chrome fallback); 5.1 (strict loader); 13.4 (a Theme with any part absent); 7 (the interoperability test) |
| 9 nothing about the user stored or transmitted | 1, 5.3, 5.5 (no third-party request, no cookie) |
| 10.19 | 2 |
| 10.20 | 3 |
| 10.22 | 10.4 to 10.6 |
| 10.23 (PROPOSED) | 10.3: Answers are the children, drawn below; Options are the side children, drawn beside |
| 3.4 **[#133]** `/admin` shows a login page, then the same overview with a + tile; the editor looks exactly like the final Tree with the fields editable in place | 24, 25.1, 26.4, 28, 34 |
| 3.4 **[#133]** images uploaded; terms labelled for the explainer; a side-bubble with a +; yes, no and "tree ends here" buttons that create the next Node and move the editor there | 31, 32, 30.4, 30.1 to 30.3 |
| 3.4 **[#133]** saved automatically; hidden until the Publish toggle in the top-right panel; collaborators invited there | 29, 33.3, 33.4 |
| 3.4 **[#133]** similar styling for every new page | 24.3 (the chrome bar, the disclaimer, the default Theme), 25, 26.1 |
| 3.2 / 9 **[#133]** the page never scrolls, on the new pages too | 26.3 (the scroll box, the second exemption), 28.6, 35.4 |
| 3.4 **[#133]** the end-user pages unchanged in behaviour | 34.1, 34.5, 34.8, 35.6 |
| 3.4 **[#194]** an e-mail address and a password log in, the administrator's included; still no mail | **[#195]** (2026-10-03) 38: the address 38.1, the administrator's 38.3, a store of user names 38.4, who sees and who changes one 38.5 |
| 3.4 / 8 / 9 **[#194]** every Tree names who authored it, the collaborators in the order they joined it; nothing else about an account on a public page | **[#195]** (2026-10-03) 39: who 39.1, the order 39.2, where 39.4 and 39.5; what may reach a public route 20.5 and 39.8, with `deployment.spec.ts`'s account sweep |
| 10.39, 10.40 **[#194]** | **[#195]** (2026-10-03) 38, 39 |

## 9. Where each decision is recorded

| Decision | ADR |
|---|---|
| Next.js App Router, server components, standalone Node 22, npm | `docs/adrs/ADR-5-framework-and-rendering.md` |
| One Tree per deployment via `ELSA_TREE`; Tree id kept in URLs | `docs/adrs/ADR-5-tree-selection.md` -- **superseded [#132] by `ADR-132-many-trees-per-deployment.md`**; the Tree id in every URL carries over |
| **[#132]** Every published Tree served; `ELSA_TREE` gone; the loader per folder, the store the set; an invalid Tree unserved, not fatal; image and theme files under the Tree id | `docs/adrs/ADR-132-many-trees-per-deployment.md` |
| **[#132]** `ELSA_DATA_DIR`: JSON files, an atomic writer with a queue per file, one process; the seed at first start; import, move, back up | `docs/adrs/ADR-132-data-directory.md` |
| **[#132]** The draft is the same file under a named advisory set; Publish copies it when valid in full; every valid save of a published Tree is public at once | `docs/adrs/ADR-132-draft-and-publish.md` |
| **[#132]** Accounts by the administrator, user name and scrypt; `ELSA_ADMIN_PASSWORD`; one `HttpOnly; Secure; SameSite=Strict; Path=/admin` cookie; three-layer CSRF; a login rate limit; the public routes set no cookie | `docs/adrs/ADR-132-accounts-and-sessions.md` -- **superseded in part [#195]** (2026-10-03): an e-mail address in place of the user name, the administrator's from `ELSA_ADMIN_EMAIL` (`ADR-195-login-by-email-address.md`, `ADR-195-administrator-address.md`) |
| **[#132]** Creator, collaborator, administrator; one table; `permit` on every request; invitations from a list | `docs/adrs/ADR-132-roles-and-permissions.md` |
| **[#132]** Route handlers under `/admin/api`; a field or one Node operation per write; the Node as stored in every answer; last write wins per field; sniffed, renamed, capped uploads | `docs/adrs/ADR-132-editor-api.md` |
| **[#132]** One 404 for hidden, unservable, unknown and reserved; one sitemap, `robots.txt` and `llms.txt` over every served Tree; `lastmod` per Tree | `docs/adrs/ADR-132-hidden-trees-and-findability.md` |
| **[#132]** The order of #134 to #144; #135 and #136 gain #134 | `docs/adrs/ADR-132-build-order.md` |
| Chrome in `en` and `nl` in code; follows content language, falls back to English | `docs/adrs/ADR-5-chrome-languages.md` |
| Path is the Trail; `lang` query; 50-id limit; 404 rules | `docs/adrs/ADR-5-url-scheme.md`, amended **[#118]** by the five `ADR-118-*` decisions that each add an address to 4.1 (`dataset-endpoint`, `json-schema`, `crawler-access`, `sitemap-and-alternates`, `llms-txt`); `schemas` reserved and two 404 rows in 4.3 |
| `?lang` restated as a `[lang]` route segment so `<html lang>` is the content language | `docs/adrs/ADR-19-content-language-in-the-route.md` |
| `ELSA_BASE_URL` optional, read by the canonical link only, refused when malformed | `docs/adrs/ADR-11-public-base-url.md`, amended **[#118]** by the four `ADR-118-*` decisions that build absolute URLs from it (`crawler-access`, `sitemap-and-alternates`, `json-ld`, `llms-txt`): five consumers rather than one, `src/url.ts` reading the base, and an unset variable answering with the request origin rather than a bare path (16) |
| The loader seam; one Node per call; images by route; startup validation | `docs/adrs/ADR-5-lazy-loading.md` -- **superseded by `ADR-38-neighbourhood.md`** |
| `src/` modules, `trees/`, `tests/`; dependency direction | `docs/adrs/ADR-5-repository-layout.md`, amended by `ADR-38-modules-and-tests.md` and, **[#118]**, by the six `ADR-118-*` decisions that add files: `src/findability/`, five route files, a member each on `url.ts` and `markdown.ts` |
| Vitest; fixtures through the loader; the interoperability test | `docs/adrs/ADR-5-testing-approach.md`, amended by `ADR-38-modules-and-tests.md` and, **[#118]**, by the same six: four `tests/findability/` unit files, `findability.spec.ts`, one fixture, and `deployment.spec.ts` as a contract of #118 |
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
| **[#118]** JSON replaces YAML as the Tree file: one `tree.json`, `nodes` an array, a canonical byte form | `docs/adrs/ADR-118-json-serialisation.md` |
| **[#118]** The JSON Schema at `schemas/elsa-tree-4.json`: the structure, not the limits | `docs/adrs/ADR-118-json-schema.md` |
| **[#118]** The dataset endpoint: byte-identical, CC BY 4.0 in a `Link` header, cross-origin, no cookie; 5.2's "never" restated as a rule about pages | `docs/adrs/ADR-118-dataset-endpoint.md` |
| **[#118]** `robots.txt`: allow everything, name the sitemap, name twenty agents, disallow nothing | `docs/adrs/ADR-118-crawler-access.md` |
| **[#118]** One address set per Node, emitted twice -- as the head's `hreflang` links and as the sitemap's `<url>` entries -- so the two cannot disagree; the description meta tag | `docs/adrs/ADR-118-sitemap-and-alternates.md` |
| **[#118]** The JSON-LD: one `@graph`, a `Dataset` by `@id`, a `Question` as the page's `mainEntity`, no `QAPage` | `docs/adrs/ADR-118-json-ld.md` |
| **[#118]** `llms.txt` generated from the manifest; no `llms-full.txt`, because `tree.json` is it | `docs/adrs/ADR-118-llms-txt.md` |
| **[#118]** The order of the four build issues #119 to #122 | `docs/adrs/ADR-118-build-order.md` |
| **[#133]** Five admin pages under `[lang]`; the editor's address is the public grammar behind `/admin/trees`; the login page rendered in place; JavaScript required; every page emits its own Theme | `docs/adrs/ADR-133-admin-routes.md` |
| **[#133]** The login card with one error; the account page; the administrator's accounts page | `docs/adrs/ADR-133-login-and-account-pages.md` -- **superseded in part [#195]** (2026-10-03): the field an e-mail address; the address on the account and accounts pages (`ADR-195-login-by-email-address.md`, `ADR-195-who-sees-and-changes-an-address.md`) |
| **[#133]** The tile and the grid in a scroll box (the second exemption); the + tile; the state mark; two groups; every published Tree plus one's own hidden ones | `docs/adrs/ADR-133-overview-tiles.md` |
| **[#133]** The new-Tree form: an id that never changes, the languages with the first as default, a title per language; the editor on the root Node next | `docs/adrs/ADR-133-new-tree-form.md` |
| **[#133]** Every field a region in place; the language switch as the editing switch; counters by the validator's functions, typing never stopped; the description as source; the no-scroll rule kept | `docs/adrs/ADR-133-bubble-edited-in-place.md` |
| **[#133]** 600 ms and blur through one queue; the indicator; a refused write kept; retries; the login Sheet on 401; the response repaints; no polling | `docs/adrs/ADR-133-autosave.md` |
| **[#133]** Three outlined buttons; plain navigation on creation; the side + opening its aside in the Overlay; re-pointing through a picker; the step menu on the rim; orphans kept | `docs/adrs/ADR-133-structure-editing.md` |
| **[#133]** The slot and the strip's + as pickers; the credit required before attaching; the enlarged view as the Image's editor; the admin image route | `docs/adrs/ADR-133-images-in-the-editor.md` |
| **[#133]** Marking a selection in the source; the id from the selection; the explainer Sheet per language; unmarking; the title plain | `docs/adrs/ADR-133-explainers-in-the-editor.md` |
| **[#133]** The panel as a Sheet down the right edge: Publish with the to-do list, collaborators, this Tree, the administrator; unpublishing asks once | `docs/adrs/ADR-133-top-panel.md` |
| **[#133]** The `edit` prop with `links` and named slots; `src/editor/` as leaves importing two pure modules; the editor page's bound of twelve | `docs/adrs/ADR-133-reuse-rule.md` |
| **[#133]** A built data directory, one server per spec, one login helper, the admin pages under no-scroll, the sweep's admin half, the public suites unchanged | `docs/adrs/ADR-133-editor-testing.md` |
| **[#133]** The lines of #137 to #144 confirmed; #138 gains #135; #138 lands every slot | `docs/adrs/ADR-133-build-order.md` |
| **[#171]** A Terminal carries its own words, `terminal.label`, at most 19 characters; the four outcomes go; one colour for every ending; the badge's tracking tightens below 792; the editor asks for the words only | `docs/adrs/ADR-171-ending-text.md` |
| **[#171]** `elsa-tree/5` with its own schema beside the `/4` one; one conversion, run over the repository and by the store when it opens | `docs/adrs/ADR-171-elsa-tree-5.md` |
| **[#171]** Four OFL families shipped in `fonts/`, no wider than Open Sans, copied into a Tree with their licence text | `docs/adrs/ADR-171-font-library.md` |
| **[#171]** A select per role: the default, the library, the Tree's own, "Upload a font file…"; `use-library-font`; an upload named after the font's own family name | `docs/adrs/ADR-171-font-dropdown.md` |
| **[#171]** Six SPDX licences stored as name and text address; "Another licence…"; a library family's licence fixed | `docs/adrs/ADR-171-licence-dropdown.md` |
| **[#169]** The heading over the Sources says "Sources" / "Bronnen"; the kind labels unchanged | `docs/adrs/ADR-173-sources-heading.md` |
| **[#180]** In the editor the draft's Theme paints the Tree; the bar, the floating controls and every editor Sheet keep the default; the bar's logo in its light variant | `docs/adrs/ADR-180-editor-interface-not-themed.md` |
| **[#180]** Under their heading the Sources are `text`, label, kind and dot; a link told by an underline in it | `docs/adrs/ADR-180-sources-text-colour.md` |
| **[#195]** (2026-10-03) An e-mail address in place of the user name: the browser's own check, at most 254 characters, lower-cased, one account per address; the rate limit per address typed; no address in the log | `docs/adrs/ADR-195-login-by-email-address.md` |
| **[#195]** (2026-10-03) The administrator's address from `ELSA_ADMIN_EMAIL`, read at every start; none invented; the demo server's the owner's to choose | `docs/adrs/ADR-195-administrator-address.md` |
| **[#195]** (2026-10-03) A store of user names converted at the first start; an account without an address waits for the administrator | `docs/adrs/ADR-195-accounts-without-an-address.md` |
| **[#195]** (2026-10-03) An address seen by its holder and the administrator and changed by the administrator; the invitation list by name; one account per name | `docs/adrs/ADR-195-who-sees-and-changes-an-address.md` |
| **[#195]** (2026-10-03) The Authors: the creator and the collaborators who hold a role now, never the administrator, in the order each first joined, by name alone | `docs/adrs/ADR-195-authors.md` |
| **[#195]** (2026-10-03) `meta.json`'s `joined`, appended to and never reordered, filled in from the roles at the start | `docs/adrs/ADR-195-order-of-joining.md` |
| **[#195]** (2026-10-03) "By A, B and C": one line in the chrome bar of a Node page and on the tile, cut where its room ends, not drawn under 80 pixels | `docs/adrs/ADR-195-the-mention.md` |
| **[#195]** (2026-10-03) The names in the mention and nowhere else; nothing else about an account on a public route; `authors(id)`; the account sweep | `docs/adrs/ADR-195-names-on-public-routes.md` |

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
| chrome bar | 44 | The Theme's logo (or the Tree's title as text), the language switch, the share button. Unchanged. **[#195]** (2026-10-03) And, between the mark and the controls, the mention of the Tree's Authors: one line in the bar's free room that takes no pixel from the rest and is not drawn where under 80 pixels are left (39.4). |
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

  **Amended 2026-10-02 (#171, the owner's #169):** the badge holds the Terminal's own words,
  its `label` in the page's language (`tree-format.md` 5.5), at most 19 characters, in place
  of a chrome word for one of four outcomes, and it is drawn in one colour for every ending.
  Its place, size and look stay; below 792 pixels wide its tracking is 0.04 em instead of
  0.12, so that 19 characters hold one line in its narrowest room, 198 pixels at 480 wide, in
  every face measured, DejaVu Sans Bold included (36.1).
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

**Amended 2026-09-19 (#102, by the owner):** the up arrow stands **above** the Bubble, not
on it, its foot 6 pixels clear of the outline (10.2). Its band grows from 26 to **56** --
2 clear of the chrome bar, 48 of arrow, 6 of clearance -- and the Bubble gives the 30
pixels: at the guaranteed viewport the rows are **44 + 56 + 416 + 28 + 68 + 28 = 640**,
the Bubble is 760 x 416 (radius 208) and its text area **640 x 364**. The rim keeps its
60 by 26; its band above now holds only a Terminal's badge. The chord 26 pixels in is
now 545, and at the lowest Sources line of a full text area (46 from the bottom) 605.
Below 640 pixels tall the arrow goes back onto the outline and its band back to 26, as
before this amendment (10.5, amended the same day), so every height trigger of 10.5
stands as it was measured.

**Amended 2026-10-02 (#174, by the owner in #169: "Make the images that are listed there
bigger(1.4x what they are now) (also in the main app)"):** the strip's thumbnails are **67**
pixels (48 x 1.4 = 67.2), and the strip band grows from 28 to **43** to hold them. A
thumbnail keeps its upper 24 pixels in the Bubble's lower rim, 2 clear of the text area as
before, and hangs 43 into the band, down to the Answer row, whose buttons stand 4 below its
top. Centred on the outline, as the 48-pixel ones were, it would take 9.5 pixels of the
text area, which 10.7 has not to give. The Bubble gives the 15 pixels: at the guaranteed
viewport the rows are **44 + 56 + 401 + 43 + 68 + 28 = 640**, the Bubble is 760 x 401
(radius 200.5) and its text area **640 x 349**. The rim keeps its 60 by 26; the Bubble's
straight middle is 359, and the chord at the lowest Sources line of a full text area (46
from the bottom) 615. A taller window grows the Bubble as before, up to 520. Below 640
pixels tall the strip is its 20-pixel pill in a band of 20, as before (10.5, step 1, which
now frees 23 pixels), so nothing below the guarantee moves. `carousel.spec.ts` measures
these rows on the full Node and on a Node of five pictures at 1280 x 640.

**Amended 2026-10-02 (#175, the owner in #169):** the 20 of gap and 240 of column beside the
Bubble are now exactly what an Option button at the Bubble's middle height takes: its 20-pixel
connector, the button's **236** and the 4 its focus ring needs (2 pixels wide, 2 off the
outline), so its inner edge is 400 from the centre line and the ring ends at 640, the window's
edge at 1280 (10.3, amended the same day). The rows and the columns do not move.

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

**Amended 2026-09-19 (#102, by the owner):** the up arrow is centred **above** the Bubble's
top outline, its foot 6 pixels clear of it, at and above the guaranteed height (10.1, 10.5).
Following it **retraces the step it undoes** (11.1, 11.3): back up and to the right from a
`yes` target, which was reached down and to the left; up and to the left from a `no`
target; straight up after any other step.

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

**Amended 2026-09-19 (#102, by the owner; answer (b) on PR #110):** the main image is
bigger. It is a **3 : 2 box two fifths of the Bubble's height on every Node**, cropped and
cornered as before; the empty slot is a circle of the same height. At 1280 x 640 that is
166.4 of the Bubble's 416; where the Bubble is taller, up to 520, it is 208. The
description's limit is cut to what is left beside it (10.7, `tree-format.md` 5.7), so no
valid Node makes the picture smaller. In the Bubble a **clear foot** of 24 pixels, plus a
quarter of every pixel the text area has over 364, stays empty under the Sources where
the text leaves room, because the curve narrows the Bubble there and a Sources line drawn
in it crosses the outline; the foot is what yields first, and a Node at every maximum
keeps 9.6 of it. Only text wider than 5.7 assumes -- a face wider than those 13.4 names
-- would then make the picture give way, never below 30 pixels. The Overlay's Interior is
the same component, and its picture is two fifths of the Overlay's panel in the same way:
243.2 of 608, where it was 60, at every maximum too, because the Overlay's own Options
now flow as one inline list (10.9). The title sits at one height on every Node again; a
neighbour frame's withheld slot is the same box as the picture it stands for, so a slide
has nothing to reflow.

**Amended 2026-10-02 (#174):** at 1280 x 640 the picture is 160.4 of the Bubble's 401
(10.1), the clear foot is 24 plus a quarter of every pixel the text area has over 349, and
a Node at every maximum keeps 0.6 of it (10.7). The rule, two fifths of the Bubble, is the
same; the Overlay's picture is unchanged.

**[#169] Amended 2026-10-02 (#173, by the owner):** the chrome heading `sources` says
**"Sources" / "Bronnen"** (3.2, `ADR-173-sources-heading.md`). That is the heading in the
Bubble and in the Overlay, and the title of the collapsed control and of its Sheet, on the
public page and in the editor. The kind prefixes are unchanged: `case-law` and
`literature` only.

`tree-format.md` 5.6 has three kinds and the frontend distinguishes five situations. In
every one: the up arrow above where there is a Trail (10.2), the strip on the lower
outline (section 12), the chrome bar and disclaimer unchanged.

| | In the Bubble | Below the Bubble (children) | Beside the Bubble (side children) |
|---|---|---|---|
| **question Node, with Options** | The Interior | **Two Answer buttons**, `yes` and `no`, 620 x 60, side by side, the same shape and fill; each labelled with the chrome word, a colon and the target's title in one run of **19-pixel bold** text on 24-pixel lines, at most two lines | **The Option buttons**, fanned out, at most 4 per side (below) |
| **question Node, no Options** | The same | The same two Answer buttons | Empty fans; the Bubble keeps its size and place |
| **explanation Node, in an Overlay** (the ordinary case: an Option opened it, or its URL did, 10.9) | The parent's page is underneath, unchanged | -- | The Overlay holds the explanation Node's Interior and, under it, its own Options as a list of plain links (10.9) |
| **explanation Node, as the centre** (a path with no question Node or Terminal before it, or **[#100]** one where 10.9's bounded centre rule stops on an explanation Node) | The Interior; the up arrow (10.2) when the path has an entry before it, none when it has not | **One button**, `startAgain`, in the Answer buttons' style, to the root Node with an empty Trail | Its Options, fanned out like a question Node's |
| **Terminal** | The Interior, and on the rim the **outcome badge**: `outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited` or `outcomeRefer`, coloured `danger` for `prohibited` and `accent` otherwise. **[#171]** The **ending badge**: the Terminal's `label` in the page's language, in the accent's reading shade for every ending, with the Bubble's outline in the same shade (36.1) | **One button**, `startAgain`, in the Answer buttons' style. The way back is the up arrow (10.2); a Terminal that is the root shows `startAgain` alone | Nothing: a Terminal may not carry Options (`tree-format.md` 5.6) |

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

  **Amended 2026-09-19 (#105, PR #109):** the 152 pixels are 232 less 11 of padding and
  the 1-pixel outline each side, 48 and 8; 12 of padding inside the outline had left 150.
  The 96 is a minimum, not a height, as #80 built it: a title that takes a fifth line
  (10.7, amended) makes its button 102 tall, still 9 clear of its neighbour at the pitch
  of a side of four, growing downward from the row's top instead of overflowing.

  **Amended 2026-09-19 (#102):** the Bubble is 760 x 416 now (10.1), so the formula reads
  (*i* + 0.5) x 416 / *m* - 208 and 172 + sqrt(208² - *y*²) + 20, and the pitch on a side
  of four is **104**: 8 clear of a 96-pixel button, 2 of a 102-pixel one. The figures
  above (446, 223, 157, 111.5, 15 and 9) are #78's and #105's, at a Bubble of 446.

  **Amended 2026-10-02 (#174):** at the guaranteed viewport the Bubble is 401 (10.1), so
  the pitch on a side of four is **100.25**: 4.25 clear of a 96-pixel button. A 102-pixel
  one -- a title on five lines where the browser has no hyphenation dictionary for the
  page's `lang` (10.7, amended by #105) -- overlaps its neighbour by 1.75 pixels at that
  height, where it stood 2 clear; from 655 pixels tall, a Bubble of 416, it is as it was.

  **Amended 2026-10-02 (#175, the owner in #169):** the button is **236 x 100**, a pill, and
  its picture **fills its inner end**: a circle as tall as the button, 100 across, centred on
  the end's curve, touching the outline at the top, at the bottom and at the end towards the
  Bubble (on the left of the Bubble that end is the right, as before; the picture does not
  move to the outer end, where the editor's link menu stands, 30.6; **[#178]** none stands there since 2026-10-02). The empty slot of a
  target without Images fills the same end, and so does the editor's `+` (30.4, amended the
  same day). The outline is drawn under the picture, which covers it there. Then a 6-pixel gap
  and the title at **15 pixels on 18-pixel lines, at most five lines**, in the **120 pixels**
  left (236 less 100, 6 and 10 of padding at the outer end). 236 x 100 is the largest that
  fits at 1280 x 640 with room for a focused button's ring, 2 pixels wide and 2 off the
  outline: a button at the Bubble's middle height -- the one of a side of one, the middle one
  of a side of three -- has its inner edge at 400 and 240 to the window's edge (10.1, amended),
  and on a side of four the pitch of 104 leaves 4 between two buttons of 100. The type is a
  step down from 16 because the picture takes 100 of the width: in the 120 left a title near
  60 characters takes five lines of 20 at 16 pixels, the whole button, and at 15 on 18,
  hyphenated in the page's language, at most five, 90 pixels (10.7, amended). The 100 is a
  minimum as the 96 was. The figures above (232, 96, 48, 8, 152, 16 on 20 and four lines) are
  #78's, #105's and #102's. Below 1280 the straight columns of 10.5's step 2 keep their
  200 x 96 without pictures, 176 pixels of label and 16 on 20.

  **Amended 2026-10-02 (#175), the known cost:** where the reader's browser has no
  hyphenation dictionary for the page's language (#105's case), a title of long Dutch words
  can take **six** lines (10.7, amended), and its button grows to **108**, downward from the
  row's top. On a side of four at 1280 x 640 that costs three things. Measured with
  `hyphens: manual` and the first Tree's six-line Dutch title set in a row of the right side:
  on `annex-i-legislation` in Open Sans, and on the full Node of 10.6 in Verdana, which breaks
  these titles' lines as DejaVu Sans does (10.7, amended):

  - **In the top row** the button lies **4 pixels over the next one**, where #105's 102
    stayed 2 clear.
  - **In the bottom row** it ends **6 pixels below the fan**. The row's top is at 314 in any
    face, so the button ends at 422, and the Options' list, as tall as the Bubble's 416, holds
    content taller than itself: 422 in its 416, 423 in Open Sans, whose last line's text box
    reaches a pixel lower. That breaks 10.6's rule, beyond its one-pixel tolerance. Before #175
    the same row held #105's 102 to 418, 2 below the fan and 1 past the tolerance, and that
    was not recorded either.
  - **In both rows the picture stays 100 across**, 4 pixels from the top and the bottom of
    the 108, so it no longer fills the inner end.

  At 1920 x 1080 the same title is 22 clear of the next button in the top row and ends inside
  the fan in the bottom row. On the first Tree as it stands no button reaches another or
  leaves the fan: its one six-line title in Open Sans, on `prohibited-practices-2`, is the
  last of a side of three and ends at 405 of the 416. Its picture, though, also stays 100, 4
  from the top and the bottom. The whole cost is recorded here as the known cost of 120
  pixels at 15 on 18, for the owner to decide whether it stands.

  **Amended 2026-10-02 (#175, after #174):** at #174's guaranteed Bubble of 401 the pitch
  on a side of four is 100.25, so two of the buttons above, 100 tall, stand **0.25** apart,
  not 4, and a focused button's ring, 2 pixels wide and 2 off its outline, reaches 3.75 into
  its neighbour there. From 655 pixels tall, a Bubble of 416, the 4 are back; the middle
  button of a side of one or three stands where it did, its ring ending at the window's
  edge. The known cost above grows with the 15 pixels the Bubble gave. Measured as above on
  `annex-i-legislation` in Open Sans at 1280 x 640: the rows of a side of four stand 0.25
  apart; in the top row the six-line button lies **7.75** over the next, and in the bottom
  row, whose top is at 300.86, it ends at 408.86, **7.86** below the fan, the Options' list
  holding 410 in its 401. The picture's cost is unchanged. At 1280 x 655 the figures are the
  416's above again.
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
  area. **[#171]** From the same width, 792 pixels, the badge's tracking is 0.04 em
  instead of 0.12, with steps 5 to 7 and by width alone: the type of the badge steps down
  as the rest does, and its 19 characters hold one line in the half band's 198 pixels at
  480 wide, in every face measured (36.1).

**Amended 2026-09-19 (#102, by the owner):** one more thing gives way outside the numbered
order, by height alone: **below 640 pixels tall the up arrow goes back onto the Bubble's
top outline**, its middle on it, and its band back to 26 (10.1, 10.2). The 30 pixels it
stands clear by above 640 are what every step of this table was measured without, and at
the floor of 480 there is no step left to pay for them: with the arrow above the Bubble
the full Node of 10.6 overflowed its text area at 1280 x 564. So at 1280 x 639 the text
area is 401 tall and at 1280 x 640 it is 364; the triggers above are unchanged. Down to
632 the main image of 10.3 is still two fifths of the Bubble; step 5 hides it below that.
The pixels each step frees in the list above are #78's, when the main image was 60 tall
and step 5 freed it and its gap, 68; they are historical. Measured at this layout, at
1280 x 632 the Bubble is 446 and the picture 178.4, so step 5 frees 186.4 of the text
area (the picture and its gap of 8), and at 1280 x 631 the Bubble of 445 has no picture.
Step 5 frees more than it did, so the triggers, which `no-scroll.spec.ts` proves at every
one, still hold.

### 10.6 The no-scroll rule, and the exact test

**The rule.** `html` and `body` are exactly the size of the viewport and have
`overflow: hidden`. No element in the document has content taller or wider than itself,
with **one exception**: the Carousel strip, which scrolls horizontally inside its own
400-pixel box on the Bubble's lower outline and is how the Carousel works without
JavaScript (12.2). **[#133] And a second, of the same kind**: a `[data-scroll-box]`, which
scrolls vertically inside its own bounds, carried by exactly the ~~four~~ **[#176]** five things the format does
not bound -- the overview's tile grid, the accounts list, the new-Tree form and the top
panel's body (26.3), **[#176]** and the to-do bubble's body, which holds the list that left the
panel's (33.3) -- and by nothing on a Node page or in the editor's Bubble. The element
walk below skips both attributes; the document still never scrolls on any page. The document itself never scrolls at any size, including below the
floor, including while a Sheet or an Overlay is open, including while an explainer
panel is open, and including during a transition (core document 9, `[#75]`).

**Amended 2026-10-03 (#195, the owner's #194):** one more element is skipped, for the reason a
tile's cut title is: the line that names a Tree's Authors in the chrome bar of a Node page,
`.page-chrome [data-clamp]`, whose ellipsis is the design (39.4, 39.6). The walk still checks the
bar and everything else in it.

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
| `tests/fixtures/full-node/` at a 49-entry Trail | Every maximum the format allows at once: 80-character title, 150-character 2-line description (600 and 8 until #102), 3 Sources, 8 Options each with a target that has a first Image, 10 Images, 8 explainers at 40 and 200 characters, the longest Trail. If this fits, every valid Tree fits. |
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

**Amended 2026-09-19 (#102, by the owner; answer (b) on PR #110): the description's limit
is cut to 150 characters and 2 estimated lines.** The text area is **640 x 364** (10.1)
and the main image is two fifths of the Bubble on every Node (10.3): 2/5 x 416 = 166.4.
The owner chose the picture over the text, so the description gets what is left:

| Inside the text area | Height | Derivation |
|---|---|---|
| Main image | 166.4 | Two fifths of the Bubble's 416. |
| gap | 8 | |
| Title | 56 | As above: 80 characters, 2 lines. |
| gap | 8 | |
| Description | 48 | What is left: 364 - 166.4 - 8 - 56 - 8 - 8 - 60 = **57.6**. Two 24-px lines are 48; a third would need 72. At 75 characters a line: **2 lines = 150 characters**. |
| gap | 8 | |
| Sources | 60 | As above. |
| | **354.4 of 364** | The 9.6 left is the clear foot of 10.3. |

The Answers are not in the text area: their row of 68 is one of the six rows of 10.1 and
did not change. Where the Bubble is taller than 416 (up to 520), the text area grows by
the same pixels; the picture takes two fifths of them and the text keeps the rest, so the
limit holds at every guaranteed viewport. The limit is on the Node's `description` only:
the Tree's `description` is not drawn in the Bubble and keeps 600 characters and 8 lines.
Both Trees' descriptions over the new limit were cut mechanically, in both languages
(the first Tree's `NOTES.md` section 12 gives the rule). `elsa-tree/3` keeps its number:
the owner's answer scoped the change to the limit and the validator, and a Tree written
to the old limit is told by V-LENGTH and V-LINES which field to cut, by how much.

**Amended 2026-10-02 (#174): the limits hold at a strip band of 43, by 0.6 pixels.** The
text area is **640 x 349** (10.1) and the main image two fifths of the Bubble's 401:

| Inside the text area | Height | Derivation |
|---|---|---|
| Main image | 160.4 | Two fifths of the Bubble's 401. |
| gap | 8 | |
| Title | 56 | As above. |
| gap | 8 | |
| Description | 48 | What is left: 349 - 160.4 - 8 - 56 - 8 - 8 - 60 = **48.6**. Two 24-px lines are 48: **150 characters**, as before. |
| gap | 8 | |
| Sources | 60 | As above. |
| | **348.4 of 349** | The 0.6 left is the clear foot of 10.3. |

`carousel.spec.ts` measures the full Node at 1280 x 640: title 56, description 48, Sources
60, the main image 160.36 tall and 0.64 of the text area left under the Sources. No limit
moves and no Tree is re-cut. The 0.6 is all the band can still take: the description's two
lines hold in every Bubble of 400 or more, so a band of 44 is the most the guarantee allows
before the picture would give way there, which 10.3 does not allow.

Five assumptions behind those numbers are re-derived by this layout. None moves a limit:

**Amended 2026-09-19 (#102):** this table is #78's re-derivation, at the 446 Bubble and the
394 text area, and is kept as history. **Now** the first row's limit has moved -- the
description is 150 characters and 2 lines, as amended above -- and the second row's
numbers are 10.3's amended ones: four buttons on a side at a pitch of **104**, their 384 in
the Bubble's 416; its Effect, none, still holds. The other three rows stand as written.

| `tree-format.md` 5.7 assumed | This layout | Effect on the limits |
|---|---|---|
| A vertical budget of chrome 44, Trail 64, Bubble 360, Branches 64, Carousel 80, disclaimer 28, and a 640 x 304 text area divided exactly. | Chrome 44, up-arrow band 26, Bubble 446, strip band 28, Answers 68, disclaimer 28; a text area of 640 x 394 holding 392 (above). The Trail row and the caption line paid for the main image, the Sources heading and the larger Answer buttons. | None: the description keeps its 192 pixels and 8 lines. **Now (2026-09-19, #102):** cut to 48 pixels, 2 lines and 150 characters (above). |
| An Option Branch label of 150 px, 3 lines for 60 characters. | An Option button is 232 x 96 with **152 px of label at 16 px on 20-px lines**, up to four lines: 60 characters take 3 in a humanist face and 4 in DejaVu Sans; four buttons on a side, at a pitch of 111.5, are 384 of the 446. **Now (2026-09-19, #102):** a pitch of 104, and the four buttons' 384 of the Bubble's 416 (10.3). | None. |
| An Answer Branch of 640 px with an 80-character title on 1 line. | A 620 x 60 button with 580 px of label at 19 px bold on 24-px lines: the chrome word, a colon and 80 characters are at most 86, at least 43 a line in DejaVu Sans Bold: **2 lines**, 48 px in 60. | None. |
| A Trail of up to 6 Nodes at 213 px each. | No Trail is drawn; the up arrow carries the parent's title as its accessible name only. | None. |
| The Carousel as an 80-px row with a caption line of one or two lines for a 120-character description and credit. | A strip of 48-px thumbnails on the outline, no caption: the description is alternative text and the credit is read as the picture's description and shown whole in the enlarged view, where 5.7's "one line at 13 px" is what it assumed. | None. |

**The face the numbers hold in.** As in 0.2: the limits were measured in a humanist
sans, the widths above are re-derived in DejaVu Sans, the widest fallback a reader is
likely to meet, and the default type stack names Arial-metric faces before `sans-serif`
(`src/theme.ts`, 13.4), because the Bubble's text area holds the format's maximum in
those and not in DejaVu Sans, as 5.7 warns.

**Amended 2026-09-19 (#105, PR #109):** the Option row's "60 characters take 3 in a
humanist face" does not hold for every title. In Open Sans, the first Tree's face, the
Dutch "Seksueel beeldmateriaal zonder toestemming (2-12-2026)" (54 characters) takes
**five** lines in 152 pixels (and in 150) when words break only at spaces, because no two
of its words fit on one line. It takes four because the title is hyphenated in the page's
language (`hyphens: auto`, #104). The four lines of 10.3 therefore hold for a 60-character
title only where the reader's browser has a hyphenation dictionary for the page's `lang`.
Where it has none, the button grows to 102 (10.3, amended: the 96 is a minimum) instead
of overflowing. The limit stays 60: the owner decides whether it should come down.

**Amended 2026-10-02 (#175):** the Option row above moves with 10.3's amended button: 236 x
100 with **120 px of label at 15 px on 18-px lines, up to five lines**, 90 of the 100. Measured
in Chromium on Windows on the 146 Option titles of both Trees and the two fixtures that fan
out Options, in both languages, hyphenated in the page's language: at most **five** lines in
Open Sans (4 titles) and in Verdana (31), wider than Arial and the stand-in here for DejaVu
Sans, which this machine lacks, and
**four** in Arial and Segoe UI; Open Sans still takes at most five in 110 pixels, a margin for
the few per cent wider it renders on Linux. At 16 px on 20 every one of those faces took five,
100 pixels, the whole button. Four buttons on a side at the pitch of 104 are 400 of the
Bubble's 416. Effect on the limits: none; an Option title keeps its 60 characters.

**Amended 2026-10-02 (#175), without a hyphenation dictionary:** the five lines above hold
only hyphenated. The same 146 titles, laid out alone in 120 pixels at 15 on 18 with
`hyphens: manual` -- #105's case, a browser with no dictionary for the page's language --
in Chromium on Windows and on Linux (the Playwright container, `v1.62.1-noble`, with DejaVu
Sans and Liberation Sans installed), take these lines:

| Face | Hyphenated | No dictionary |
|---|---|---|
| Open Sans, Windows | at most 5 (4 titles) | **6 for 1** title, 5 for 13 |
| Open Sans, Linux | at most 5 (2) | **6 for 1**, 5 for 7 |
| DejaVu Sans, Linux; Verdana, Windows | at most 5 (31) | **6 for 3**, 5 for 35 |
| Liberation Sans, Linux; Arial, Windows | at most 4 | at most 5 (6) |
| Segoe UI, Windows | at most 4 | at most 5 (5) |

The six-line titles are the first Tree's Dutch: "Live biometrische ID in het openbaar voor
rechtshandhaving" (`prohibited-practices-2`) in every face of those rows, and in DejaVu
Sans and Verdana also "Goedkeuring van motorvoertuigen en aanhangwagens"
(`annex-i-legislation-3`) and "2. Systemen die synthetische content genereren (aanbieder)"
(`transparency-obligations`). Six lines are 108 pixels, and the button grows to hold them
(10.3, amended, which records what that costs on a side of four). On the first Tree's own
pages, measured the same way at 1280 x 640 and 1920 x 1080, the one button that grows in
its face, Open Sans, is 108 tall and the last of its side; in Verdana's metrics the other
two are the top of a side of two, 100 clear of the next at 1280 x 640. Effect on the
limits: none; whether the 60 characters should come down stays the owner's, as #105 left it.

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

  **Amended 2026-09-19 (#102, by the owner):** the term is marked **bold, in the Theme's own
  `accent-secondary`** -- the Answer buttons' green -- **and nothing else**: no underline,
  dotted or solid. Hovering, focusing or opening it adds the `accent-secondary` wash behind
  it, as before. On the first Tree that green is `#159a2f` on the Bubble's `#f0f3f7`,
  **3.31 : 1**, which WCAG 2.2 SC 1.4.3 accepts for large text only (at least 18.66 pixels
  bold); the term is 16-pixel bold body text, for which it asks 4.5 : 1. The owner chose the
  colour; the shortfall is recorded here, and a Theme whose `accent-secondary` reads at
  4.5 : 1 on its `surface` removes it.
- **What a screen reader hears:** the marked words, then their description, which is
  the explainer -- `aria-describedby` on the term, `role="tooltip"` on the panel. Nothing
  else is announced on open or close.
- **The panel** is at most 320 pixels wide, 14-pixel text on 20-pixel lines, at most five
  lines for the 200-character maximum: at most 148 pixels tall with its heading and
  padding, filled `surface`, outlined in `rule`, over everything but a Sheet. The five
  lines rest on a 298-pixel line -- 10-pixel sides inside a 1-pixel outline -- and on
  words hyphenated in the page's language (`hyphens: auto`): the first Tree's long Dutch
  words took a sixth line at 290 pixels, and on Linux's Chromium, which sets Open Sans
  about 3% wider than Windows', two still did at 298 without hyphens (amended 2026-09-19,
  #103). In a text area narrower than 320 pixels -- a phone's, 10.5 -- the panel is as
  wide as the area and as tall or a line taller: 146 to 166 pixels at 360 x 640 (amended
  2026-09-18, #83; re-measured 2026-09-19, #103). It opens
  **on hover, on keyboard focus and on tap**; it closes **on leaving, on blur and on
  Escape**; one is open at a time. It never scrolls and never makes the page scroll
  (10.6 measures every page with each panel open).
- **Placement.** With JavaScript (`Explainer.tsx`, a client component) the panel is
  placed below the term's line when that fits inside the Bubble's text area and above it
  otherwise, and shifted sideways so that it stays inside the text area: at and above the
  guaranteed viewport, since the panel is at most 148 pixels and the area 394, one of the
  two always fits (**amended 2026-09-19, #102:** the area is 364 now (10.1); either side
  of any line of it still has 170 or more, so one still fits; **amended 2026-10-02, #174:**
  349, and 162 or more either side). Where neither fits -- an area 10.5 has shortened -- the panel takes the
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
  Bubble's, and under it the target's own Options, if it has any, as a list of plain
  links (below). **[#102]** The list is one inline run of links on 20-pixel lines,
  separated by a middle dot, where it was one link to a line: eight Option titles of 60
  characters, 5.7's most, with their separators are about 505 characters: 5 lines as
  measured, 100 pixels, where one to a line took 160 and left the picture 202 (10.3).
  The panel is 760 x 608, centred, with 24-pixel bands above and below and 60 each side (640 x 558 of content inside its
  outline: at every maximum, measured on the fixture at 1280 x 640, the picture 243.2, the
  title 56, the description 48, the Sources 60, the list 100 and four gaps of 8, 539.2 in
  all, 18.8 to spare, in Arial and Segoe UI alike. A face as wide as 5.7's 90 characters
  a line puts the list on a sixth line, 1.2 pixels more than the spare, and the picture
  gives up those 1.2: 242 of 243.2; amended 2026-09-19, #102, was: 640 x 560 of content:
  the Interior's 392, a gap of 8 and 160 of list), `surface` over the `scrim` veil, a 32-pixel round
  close cross at its top right corner. It never scrolls; the fixture `tests/fixtures/overlay/`
  is an explanation Node at every maximum with eight Options, 10.6 measures it, and
  `overlay.spec.ts` measures its picture at two fifths of the panel, which no-scroll alone
  cannot see.
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
  the direction agree. (**Amended 2026-09-19, #102:** at 640 px of viewport height and
  above, the control stands above the outline, its foot 6 pixels clear (10.2); below 640
  it is back on the outline. Either way it is at the Bubble's top, so the argument holds.)

  **Amended 2026-09-19 (#102, by the owner):** "The app is one large map the reader
  traverses." The parent is placed **where the step down from it started**, so the up
  arrow's slide is the step down reversed: a `yes` target is placed down and to the left,
  so from it the parent lies **up and to the right**; from a `no` target **up and to the
  left**; after any other step -- an address whose last step was no Answer of its parent --
  **straight up**. A diagonal step is half the layer's width across and its whole height
  down -- 640 by 568 at the guaranteed viewport, where the layer is the 568 pixels between
  the chrome bar and the disclaimer: 42 degrees below the horizontal, the "45 degrees" of
  the owner's words -- and at every size the way back is exactly the way down reversed.
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

  **Amended 2026-09-19 (#102):** the `up` placement's `slot` records the step it undoes --
  **0** when the centre is the parent's `yes` target, **1** its `no` target, **2** any
  other step -- which is what 11.1's amended placement reads. The parent was read for its
  own frame already, so the count of 17 does not change.
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

**Amended 2026-09-19 (#102, by the owner):** the translation of step 2 is toward the
target's position as 11.1 places it, and the up arrow's target is placed where the step
down to the centre started (11.1, amended the same day): the layer moves so that the
reader goes back up along the diagonal they came down -- up and to the right after a
`yes`, up and to the left after a `no` -- and straight up after any other step. The back
button has always reversed the slide that brought the reader (below); the arrow now does
too. `transition.spec.ts` asserts it for a `yes` target, a `no` target and a straight step.

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

**Amended 2026-10-02 (#174):** that band is 43 pixels, where it was 28 (10.1), on every Node
alike, with pictures or without.

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

**Amended 2026-10-02 (#174, by the owner in #169):** the thumbnails are **67-pixel** round
pictures (48 x 1.4) at a **75-pixel pitch**, in a box of at most **383 pixels** centred on the
Bubble -- five of them and 8 pixels of padding at each end -- so **five are visible**; more
scroll. At the guaranteed viewport the Bubble's lower outline is straight across its middle
359 (10.1) and has risen 0.4 of a pixel at the box's ends, 12 into the curve. The box no longer has its
vertical centre on the outline: its upper 24 pixels lie in the Bubble's lower rim, 2 clear of
the text area as before, and its lower 43 fill the strip band (10.1). The exemption of 10.6
is the same, for the same box.

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

**[#133] Amended 2026-09-26: every page emits the element, once; the root layout emits
none.** With many Trees the root layout, given only the `[lang]` segment, cannot know which
Tree a page shows. One server component, `src/components/ThemeStyle.tsx`, is the only caller
of `themeStyle` and renders the `<style precedence="high" href="elsa-theme">` element (and
the `<link rel="icon">`) from wherever a page puts it -- React hoists it into `<head>` by
the `precedence` attribute. The public Node page emits its published Tree's Theme; the editor
its **draft's** (24.3); the overview, the four Tree-less admin pages, the 403 and the 404
pages the default of 13.4. Everything below about the string is unchanged; #134 moves the
emission (`ADR-133-admin-routes.md`, decision 6). **[#144]** The element's `href` is
`elsa-theme-<12 hex of the CSS's SHA-256>`, and in the editor `elsa-theme-<hash>-<draft
revision>` (22.3), not the constant `elsa-theme`: React keeps a hoisted style by its `href`
where it stands and never rewrites, moves or removes one it has placed, so an editor whose
draft's Theme changed would keep the old colours until a reload -- and with the hash alone, a
Theme going A, B, A would find A's element still before B's and keep showing B. Every write
raises the revision, so every write is a new element after all the old ones, which it
overrides declaration for declaration; the editor gets one more element per write, and a page
whose Theme does not change still has exactly one. The editor addresses the draft's fonts, icon and logo through
`GET /admin/api/trees/<t>/theme/<file>` (33.8), because the public route serves only what the
published copy names.

**[#180] Amended 2026-10-02: in the editor the draft's Theme reaches the Tree, not the
editor's own interface.** The owner, on #169: "Changing the color features are great, but
don't make it change the sidebar or header colors, that makes it very difficult to follow the
UI." In the editor `themeStyle` writes, after the draft's `:root` block, the default palette and
type stack of 13.4 again on `[data-editor-ui]`: the attribute of the chrome bar, the floating
controls (33.1, 33.3), the panel of every Sheet only the editor opens and **[#178]** the panel the
step's red cross asks in (24.3, amended). The
stylesheet derives its shades there again and gives those elements their own text colour and
face, since what they would inherit from the page is the draft's. Everything else on the page
-- behind the Bubble, the Bubble and its buttons, the Overlay, the strip, the disclaimer -- is
the draft's. No colour or family literal enters the stylesheet: the second block is built from
13.4's constants, so 13.3 and 13.5 are unchanged. The public page and the Tree-less pages write
no second block. Recorded in `docs/adrs/ADR-180-editor-interface-not-themed.md`. **[#180]**
Also: under their heading the Sources are drawn in `text`, label, kind and dot alike, and a link
is told by an underline in that colour, not by a second colour (`ADR-180-sources-text-colour.md`).
**[#180] Amended 2026-10-03, in review.** In the editor `themeStyle` also writes each of the
draft's family names under one constant prefix, `elsa-draft `, in its `@font-face` rules and its
`:root` block alike. An `@font-face` family hides an installed face of the same name, and the
default stack of 13.4 names faces a draft may name too -- the library ships Roboto (37.1) -- so
without the prefix the editor's own interface was drawn in the draft's file wherever the stack
reached that name. One prefix for every name, not one per role, so two roles that share a name
still share one family. The public page writes the names as the Tree gives them.

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

**[#180] Amended 2026-10-03.** `theme.ts` is still the only module that builds the string, but it
no longer holds every rule itself. The characters a family name may not hold are declared once,
as `refusedInFamily` in `src/tree/grammar.ts`, because three places refuse the same ones: `theme.ts`
where it builds the string, the Theme panel's name field before anything is sent, and the
upload's name reader (`src/store/woff2.ts`), which proposes no name holding one (37.4).
`theme.ts` imports it and applies it at the sink as before. The other three rules are unchanged
and stay in `theme.ts`.

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
| **[#133]** The admin area | Its every action is a JSON request the browser's script makes (22.1, 20.6), so **the admin area needs JavaScript**: every admin page renders on the server as complete markup and shows, in place of its first control, one `<noscript>` sentence (`needsJavaScript`, 24.2). The guarantee above is the public pages' and is unchanged by the editor round. |

**The rule this leaves for every build issue:** a client component may only enhance
markup that is already correct without it. If a feature cannot be expressed that way, it
does not go in the client component -- it goes in the server render or it does not go
in.

## 15. The dataset endpoint

**[#118], new -- 2026-09-21.** The owner's direction of that day is that a Tree is a
public dataset as well as a walk: findable by Google Dataset Search, fetchable by another
ELSA lab, citable by a paper. Until now the Tree file was served nowhere --
`/<tree>/tree.yaml` was a 404 -- so the only copy was the git repository. This section is
the one URL that changes that. Recorded in `docs/adrs/ADR-118-dataset-endpoint.md`.

### 15.1 The two routes

| Route | Serves | 404 when |
|---|---|---|
| `GET /<tree-id>/tree.json` | The served Tree's own file, byte for byte (15.3). **[#132]** The store's published copy, `$ELSA_DATA_DIR/trees/<id>/tree.json` (23.6). | `<tree-id>` is not the Tree this deployment serves, by the rule 4.3 already gives for a Node page. **[#132]** Not a served Tree of the store: hidden, unservable, unknown or reserved alike (23.1). |
| `GET /schemas/elsa-tree-4.json` | `schemas/elsa-tree-4.json`, the format's JSON Schema (`tree-format.md` 3.9). **[#171]** And `GET /schemas/elsa-tree-5.json`, `schemas/elsa-tree-5.json`, the schema of `elsa-tree/5`: the published set is the two names. The `/4` file stays served so that a `/4` Tree a third party keeps has its contract to point at; every Tree this application serves names `/5`, and the dataset endpoint's `describedby` link (15.2) and `llms.txt` (16.5) name `/5` through `SCHEMA_HREF`. | The file name is not one this repository publishes. The route serves the published set, not the folder, exactly as the theme route serves what the Theme names and not what sits beside it (5.5). |

The Tree id is in the dataset's path, and not a bare `/tree.json`, for the reason every
other public URL of this application carries it (`ADR-5-tree-selection.md`): the day a
landing page or a second Tree arrives, a root-level dataset URL would either break or
lie. `schemas` is a reserved Tree id from this section onwards (4.3), and the schema's
path carries the format number, so `elsa-tree/5` will be served beside `/4` and neither
URL will move.

Both routes live under `[lang]` like every other route and **ignore the segment**
(4.4): there is one dataset and one schema, in no language.

**The schema file must reach the running server.** `next build` writes
`.next/standalone/`, and `scripts/collect-standalone.ts` copies in what the documented run
command needs but the framework leaves behind (section 1). `schemas/` joins that list, so
that `node .next/standalone/server.js` serves the schema from the standalone folder alone
and a deployment does not have to remember a second path. The Tree folders are a different
case and stay as they are: they are chosen at run time by `ELSA_TREES_DIR` (section 2),
where the schema is a constant of the build.

### 15.2 The headers

| Header | `tree.json` | `elsa-tree-4.json` (**[#171]** and `elsa-tree-5.json`, 15.1) | Why |
|---|---|---|---|
| `Content-Type` | `application/json; charset=utf-8` | the same | What it is. |
| `Link` (licence) | `<https://creativecommons.org/licenses/by/4.0/>; rel="license"` | `<https://opensource.org/license/mit>; rel="license"` | The licence travels with the bytes, not only with the page that links to them -- a crawler that fetches only the JSON never sees a page. The Tree is content (CC BY 4.0, `CONTENT-LICENSE`); the schema is a file of the repository and is code (MIT, `LICENSE`). Core document 8. |
| `Link` (contract) | `</schemas/elsa-tree-4.json>; rel="describedby"`; **[#171]** `</schemas/elsa-tree-5.json>` from #179, the route writing `SCHEMA_HREF` (36.2) | -- | The contract is one hop from the data for a tool that reads headers and not bodies. |
| `Cache-Control` | `public, max-age=3600` | the same | The same hour as an image or a font (5.3, 5.5). A Tree that changes is a deploy. |
| `ETag` | a strong tag over the bytes; `If-None-Match` answers `304` | the same | A crawler that re-fetches daily should download again only when something changed. |
| `Access-Control-Allow-Origin` | `*` | the same | A dataset is meant to be fetched by other sites, notebooks and tools. Safe here in a way it is not on most origins: there is no cookie, no session, no account and no header that carries authority, so a cross-origin read reaches nothing a plain `curl` does not (core document 4, 8). **`Access-Control-Allow-Credentials` is never sent**, and this is not a precedent for any future route that gains a credential. |
| `Access-Control-Allow-Methods` | `GET, HEAD` | the same | The only two that exist here. |
| `X-Content-Type-Options` | `nosniff` | the same | The route decides the type; the bytes never do. |
| `Content-Security-Policy` | `default-src 'none'; sandbox` | the same | The set 5.3 already applies to third-party bytes, kept identical so there is one header set in `src/assets.ts` and not two. |
| `Content-Disposition` | `inline` | the same | Data to look at, not a file to save: a crawler that follows the link should get a document it can read. |
| `Set-Cookie` | never | never | Core document 8. The no-cookie browser sweep -- `tests/browser/deployment.spec.ts`, which section 7 gives a row of its own for this -- covers both routes of 15 and every route of 16, so this row is asserted and not merely stated. |

### 15.3 Byte-identity: the download IS the dataset

The bytes this route returns are **the file's bytes**, streamed from disk through
`src/assets.ts` like an Image or a Theme file -- not a re-serialisation of the in-memory
Tree, not a pretty-print, not a projection. Two consequences, and they are the contract:

- `curl -s <base>/<tree-id>/tree.json | diff - trees/<tree-id>/tree.json` is **empty**,
  and a checksum of the download equals one taken from the repository. A reader can
  verify that what they fetched is what the project holds, which is what makes it a
  dataset rather than an export.
- What is served has **already passed validation**: the file was read, checked against
  the schema and checked against every rule of `tree-format.md` section 7 at server start
  (5.4). A deployment that serves the dataset is a deployment whose dataset validates.

The loader's seam gains one member for this: the path of the Tree's own file, the third
file of a Tree beside `imagePath` and `themePath` (5.1; issue #121 adds it). It hands out
a path, not Nodes, so nothing on that interface enumerates the Tree still.

**Every Node page points at it once**: `<link rel="alternate" type="application/json"
href="<dataset URL>">` in the head, so a crawler that landed anywhere in the walk finds
the data. **Issue #121 adds that line, with this route**, and 16.3 lists it among the
head's links saying the same: the link and the route it resolves to are one deliverable
of one issue, so neither can ship without the other.

What 5.2's restated "never" means here is said there and is worth repeating in one line:
no page fetches this route, no client component knows it exists, and the bound on what a
page may carry is exactly what it was.

**[#195] Unchanged by the Authors (2026-10-03).** The file carries no name: the names of a
Tree's Authors are on its pages and in none of its files (17.2, 39.7), so a rename or an
invitation changes neither its bytes nor its `version`.

## 16. Findability

**[#118], new -- 2026-09-21.** Every Node is already a server-rendered page with real
links, a canonical URL and a content language in `<html lang>`, so a crawler that finds
the root can walk the whole Tree. What it cannot work out is where the pages are without
walking, that the Dutch page and the English page are one page in two languages, and that
behind the walk there is a validated, licensed dataset. This section is those three
statements, made in the five places that read them. Recorded in
`docs/adrs/ADR-118-crawler-access.md`, `ADR-118-sitemap-and-alternates.md`,
`ADR-118-json-ld.md` and `ADR-118-llms-txt.md`.

**The base URL, once, for the whole section.** `robots.txt`, the sitemap, the address
set of 16.3 that the page head renders, `llms.txt` and the JSON-LD all emit **absolute**
URLs, because each is read away from the page that served it -- the canonical and
alternate links of the head included, which is the consumer `ADR-11-public-base-url.md`
was written for and which 16.3 widens to the whole set. The base is `ELSA_BASE_URL`
(section 1, `ADR-11-public-base-url.md`) when it is set, and otherwise the request's own origin. A public deployment sets it, and
`docs/deployment.md` says so beside the variable. The value is used **only** to build the
URLs these five contracts emit: it is never fetched, never redirected to, and never used
to read a file. Where it enters a document it is escaped as that document requires --
XML-escaped in the sitemap, and JSON-encoded with every `<` emitted as the escape
`\u003c` -- not as the character -- in the JSON-LD (16.4), by the rule 13.3 already
states for a Tree's text.

**Every route of this section is generated from the loaded Tree at request time**, never
a static file in the repository, and none of them sets a cookie. **[#132]** From #134,
from the loaded **Trees**: how each document reads over many Trees, and says nothing of a
hidden one, is section 23 (23.3 to 23.6); the text below is what it says of each Tree.

### 16.1 `robots.txt`

`GET /robots.txt`, `text/plain; charset=utf-8`, `Cache-Control: public, max-age=3600`.

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

...one block per agent in the table below...

Sitemap: <base>/sitemap.xml
```

- **Nothing is disallowed.** Not `/images/`: the "enlarged view" of a picture is the Sheet
  a click opens over the page, and the only address behind it is the picture's own file
  (12.3), so disallowing it would hide the Tree's pictures from image search in exchange
  for nothing. Not the Trail-carrying addresses either: `<link rel="canonical">` already
  folds every one of them onto the Node's own page (4.1), and a `Disallow` would stop a
  crawler reading the page and so stop it reading the canonical link.
- **`User-agent: *` with `Allow: /` is what does the work.** The named blocks below are
  declaratory: several of these agents read only their own block, and the owner asked for
  the intent to be written down. An agent whose token is misspelt here, or renamed by its
  operator tomorrow, matches the wildcard and is allowed -- so **this list can go stale
  without ever becoming a refusal**, which is the property that makes naming agents safe.

| Operator | Tokens | What each is |
|---|---|---|
| OpenAI | `GPTBot`, `OAI-SearchBot`, `ChatGPT-User` | training; ChatGPT Search's index; a fetch a user asked for |
| Anthropic | `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `Claude-Web` | training; Claude's search index; a fetch a user asked for; the older token the owner named |
| Perplexity | `PerplexityBot`, `Perplexity-User` | the answer index; a fetch a user asked for |
| Google | `Googlebot`, `Google-Extended` | Search; the AI-training control token, which has no crawler behind it |
| Microsoft | `Bingbot` | Search |
| Apple | `Applebot`, `Applebot-Extended` | Siri, Spotlight and Safari; the AI-training control token |
| Meta | `meta-externalagent`, `meta-externalfetcher` | training; a fetch for a product feature |
| Common Crawl | `CCBot` | the open crawl many models and researchers read |
| Amazon | `Amazonbot` | Amazon's assistants |
| ByteDance | `Bytespider` | training |
| DuckDuckGo | `DuckDuckBot` | Search |

The tokens are as their operators published them on 2026-09-21. **The list is data, not
architecture**: adding or removing one changes this table and one array, and needs no
`architecture` issue, because nothing depends on which tokens are in it. A test asserts
that every token in this table appears in the generated file and that the file contains
no `Disallow` line.

### 16.2 `sitemap.xml`

`GET /sitemap.xml`, `application/xml; charset=utf-8`, `Cache-Control: public, max-age=3600`.
Generated from the loaded Tree's Node index; never a file in the repository.

- **One `<url>` per Node per declared language.** A Tree of `n` Nodes in 2 languages is
  `2n` entries. `<loc>` is the Node's **canonical** address in that language (16.3), made
  absolute against the base.
- **Each `<url>` repeats the whole alternate set**, as the protocol requires: one
  `<xhtml:link rel="alternate" hreflang="<tag>">` per declared language, **including its
  own**, plus one `hreflang="x-default"` pointing at the default-language address. The
  `urlset` element carries `xmlns:xhtml="http://www.w3.org/1999/xhtml"`.
- **A Tree that declares one language gets no `xhtml:link` at all.** `hreflang` relates
  translations; a group of one relates nothing. This is the case core document 9 cares
  about, and here "not breaking" means emitting nothing rather than a degenerate group.
  `tests/fixtures/single-language` is the test.
- **`lastmod`** is the Tree file's last-modified time as a `YYYY-MM-DD` UTC date, read
  once when the Tree is loaded (5.4). Every `<url>` carries the same value, which is the
  truth: there is one file, so no Node's text can change without it changing.
  `ELSA_TREE_LASTMOD`, when set, wins (section 1), for a build pipeline that does not
  preserve timestamps; `docs/deployment.md` says to copy a Tree folder with its
  timestamps (`cp -p`, `rsync -t`, a bind mount) and why. When neither is available, the
  `<url>` carries **no `lastmod`**: the element is optional, and a search engine that
  catches a site lying about it stops reading it for that site altogether.
- **Not listed**: `/images/<file>` and `/theme/<file>`, `/robots.txt`, `/sitemap.xml`,
  `/llms.txt`, `/<tree-id>/tree.json`, the schema, the 404 page, and every address that
  carries a Trail. The sitemap holds exactly the set of canonical Node addresses -- the
  same set the head's alternates name (16.3).
- **No sitemap index.** The protocol's limit is 50,000 URLs or 50 MB uncompressed; a Tree
  would need 25,000 Nodes in two languages to reach it, against the thousand the owner
  called a plausible size. An index is reserved and not built; a generator that would
  exceed the limit must fail loudly rather than truncate.

### 16.3 `hreflang`, the address set, and the description meta tag

**The address set is one function, and both the head and the sitemap render it.** That is
the decision, and the rest of this section is what it returns. Two generators that each
build URLs out of a base and an id drift apart -- over a trailing slash, over the `?lang`
of the default language, over what a page reached with a Trail should say -- and when
they do, the annotation is simply ignored: nothing breaks, nothing logs, and the Dutch
pages quietly do not rank. `src/url.ts` owns it (section 6).

**An address** is the Node's canonical address (4.1): the empty-Trail path
`/<tree-id>/<node-id>`, with `?lang=<tag>` for every language but the Tree's default,
made absolute against the base. A page reached with a Trail lists the same alternates as
the same page reached without one, because both are the same Node -- which is what the
canonical link already says.

**In the head of every Node page**, beside the canonical link that is already there:

- one `<link rel="alternate" hreflang="<tag>" href="...">` per declared language,
  **including the page's own** -- the self-reference is required for the annotation to be
  read at all;
- one `<link rel="alternate" hreflang="x-default" href="...">` at the default-language
  address;
- `<link rel="alternate" type="application/json" href="<dataset URL>">` (15.3) --
  **added by issue #121**, with the route it points at, and by no other issue. It is
  the one line of this section that is not #120's: a head link to a route that does
  not exist yet is a link to a 404, which is the failure 16.4 refuses a `Dataset`
  over, and the two cannot be split across issues without a window in which the page
  advertises data the deployment does not serve
  (`ADR-118-dataset-endpoint.md` decision 6, `ADR-118-build-order.md`);
- `<meta name="description" content="...">`, below.

A Tree with one declared language emits none of the `hreflang` links (16.2).

**The description** is reduced from the Node's own `description` in the page's language,
deterministically:

1. take its **counted text** (`tree-format.md` 3.8 steps 1 and 2): trim, and replace every
   `[text](url)` and every explainer mark `[text](#id)` by its `text`;
2. drop the Markdown markers that are punctuation rather than words -- the `*` and `**`
   of emphasis, a leading `- `, a leading `1. ` -- and join the blocks with one space,
   collapsing every run of whitespace to one space;
3. if the result is at most **155 characters**, it is the description;
4. otherwise cut at the last sentence end (`.`, `!` or `?` followed by a space) at or
   below 155 characters; if there is none, cut at the last space at or below 154 and
   append a horizontal ellipsis.

Step 2 is where this reduction and 3.8's differ, on purpose: 3.8 counts the markers
because they take a reader's space on screen, and a meta description shows nobody an
asterisk. Steps 3 and 4 do not fire for a conforming Tree, whose Node description is at
most 150 counted characters since #102 (`tree-format.md` 5.7); they are stated anyway,
because a reduction that is not total is a reduction with a crash in it, and because that
limit is the layout's and has already moved twice.

**The reduction has two outputs, and 16.4 and 16.5 take different ones.** Steps 1 and 2
give the **reduced** string; steps 3 and 4 give the **cut** string, at most 155
characters and possibly ending in an ellipsis.

| Taken by | Which |
|---|---|
| the page's `<meta name="description">` | the **cut** string. 155 characters is what a result listing shows; a description written for that box is the whole point of cutting. |
| the `WebPage`'s `description` (16.4) | the **cut** string, the same one, byte for byte -- the `WebPage` is the record of this page and its `description` must be what the page says about itself. |
| the `Question`'s `text` (16.4) | the **reduced** string, **not cut**. A `Question`'s `text` is the question, and a question cut mid-clause and closed with an ellipsis is a different question -- in a legal aid, a misstatement of exactly the kind 16.4 refuses `QAPage` over. `name` already carries the short form (the Node's title). |
| the `Dataset`'s `description` (16.4) | the **reduced** string, not cut. It is a dataset record's abstract, read by an index rather than shown in a listing, and it is built from the manifest's description, which has its own limit. |
| `llms.txt`'s blockquote (16.5) | the **reduced** string, not cut: it is a document, not a result listing. |

Both come from one function in `markdown.ts` (section 6), the cut string built from the
reduced one, so they cannot drift apart even where they differ. **For a conforming Tree
they are the same string**: a Node description is at most 150 counted characters since
#102, so steps 3 and 4 do not fire. The distinction is what happens the day that limit
moves again, and it decides in advance which consumer takes the loss.

### 16.4 JSON-LD

**One `<script type="application/ld+json">` per page**, emitted by the server, holding one
object with `@context: "https://schema.org"` and an `@graph`. No client code, nothing
fetched, no third-party host (core document 7, 8, 9).

**The `Dataset`, on the root Node's page only**, with a **language-independent `@id`** so
that the English pages and the Dutch pages belong to one dataset and not two:

| Field | Value |
|---|---|
| `@type` | `Dataset` |
| `@id` | `<base>/<tree-id>#dataset` -- the same on every page of every language |
| `name` | the manifest `title` in the page's language |
| `description` | the manifest `description` in the page's language, reduced by 16.3 steps 1 and 2 without the cut; **when the manifest has none** -- it is optional in the format -- the root Node's `description`, which is required. `name` and `description` are Google's two requirements, so the mapping leaves neither to chance |
| `url` | the root Node's canonical URL in the page's language |
| `license` | `https://creativecommons.org/licenses/by/4.0/` |
| `creator` | `{ "@type": "Organization", "name": "<the holder line of CONTENT-LICENSE>" }` -- today `Wageningen University & Research` |
| `version` | the manifest's `metadata.version` |
| `inLanguage` | the Tree's declared languages, in order |
| `isAccessibleForFree` | `true` |
| `distribution` | one `DataDownload`: `contentUrl` the dataset endpoint (15.1), `encodingFormat` `application/json` |
| `isBasedOn` | the most frequent `url` among every `kind: legal` Source in the Tree, compared after dropping fragment and query, ties broken by first occurrence in Node order; omitted when the Tree has no legal Source |

Two of those are worth their own sentence. **The holder line is a constant of the
deployment, checked against `CONTENT-LICENSE` by a test** that greps
`^Copyright \(c\) \d{4} (.+)$` out of the file and compares -- not parsed at run time,
because reading a licence text at startup to find a name fails silently on the one day it
matters. And **`isBasedOn` is derived from the Tree, not written into the code**: for both
Trees here it is `https://eur-lex.europa.eu/eli/reg/2024/1689/oj`, EUR-Lex's
language-negotiating ELI address for the AI Act (CELEX 32024R1689), which is the address
the Trees actually cite; a third-party Tree about another instrument gets its own, with no
code change.

**Every Node page carries a `WebPage`**: `@id` and `url` the page's canonical URL (which
includes `?lang` when not the default, so each language is its own `WebPage`), `name` the
Node's title, `description` the page's meta description -- the **cut** string of 16.3, the same bytes the `<meta name="description">` carries -- `inLanguage` the page's
language, and `isPartOf` `{ "@id": "<base>/<tree-id>#dataset" }`. Every other page refers
to the `Dataset` by that `@id` and never restates it.

**A question Node adds a `Question` as the `WebPage`'s `mainEntity`** -- not as the page's
type:

- `@type` `Question`, `@id` `<page canonical>#question`, `name` the Node's title, `text`
  the Node's description **reduced to plain text and not cut** -- steps 1 and 2 of 16.3,
  never steps 3 and 4, so a `Question`'s `text` never ends in an ellipsis; `inLanguage`
  the page's language;
- `suggestedAnswer`: two `Answer` entries, yes then no, each with `text` the chrome word
  for that Answer, a colon and the target Node's title in the page's language -- the exact
  label the button carries (10.3) -- and `url` the target's canonical URL in that
  language.

`suggestedAnswer` and not `acceptedAnswer`: which answer is right depends on the reader's
system, which is the whole point of the Tree.

**A Terminal and an explanation Node carry the `WebPage` and nothing more.** A Terminal
is an outcome, not a question; an explanation Node has no answers of its own
(`tree-format.md` 5.6), and its address renders its parent's page with an Overlay open
(10.9), so its `WebPage` is that address's. **The Options are not mapped**: an Option
opens an aside the reader comes back from, not an answer to the Node's question, and
`schema.org` has no term for that. They are ordinary links in the page and are crawled as
such.

**[#171] Unchanged by the ending's words (2026-10-02).** The graph never read a Terminal's
`outcome`, and it does not read its `label`: a Terminal's `WebPage` keeps its `name` (the
Node's title) and its `description` (the cut description), and the ending's few words, which
the title states at length, are not mapped -- `schema.org` has no term for them that is not a
misstatement (`Answer`, `Conclusion`). They are in the page's text, and the whole file is in
the dataset.

**[#195] Unchanged by the Authors (2026-10-03).** The `Dataset`'s `creator` stays the
Organization of `CONTENT-LICENSE`'s holder line, and no `author` and no `Person` is added for the
accounts a Tree's pages name: a machine-readable claim about who wrote a dataset is what search
engines and dataset indexes harvest and keep, and the owner asked for a mention on the Tree, not
for that (39.7).

**The page is a `WebPage` and never a `QAPage` or an `FAQPage`.** Those types say the
page is community question-and-answer or a frequently-asked-questions list; this is a
step of a legal decision aid, and claiming a type to win a rich result would be a
misstatement about structure in a document whose value is that it is trustworthy.

**Escaping.** Every value the server puts in the script is JSON-encoded, and in the
encoded payload every `<` (U+003C) is emitted as the JSON escape `\u003c` -- the six
characters `\`, `u`, `0`, `0`, `3`, `c`, written out here because an editor that folds that
escape into the character it escapes is exactly how this rule was a tautology once. JSON
reads `\u003c` back as `<`, so the object a consumer parses is unchanged; the bytes in
the element are not, and the sequence `</script>` therefore cannot occur in the payload
-- no title, description, credit or origin can close the `<script>` element. The escape
is applied to the whole serialised string and not to selected fields, because any value
in it may have come from the Tree. An HTML entity is **not** the mechanism: the content
of a `<script>` element is not entity-decoded, so `&lt;` would land in the JSON as four
literal characters and break it.

**And checked at the sink.** Before the string is put in the element, `src/findability/`
checks that it contains no `</script>` sequence (case-insensitively) and no `<!--`; if it
does, the script is not emitted and the page is served without its JSON-LD. Two checks,
because one of them is at the sink. That is 13.3's rule and 13.3's discipline applied to
the second place a Tree's text -- third-party data -- reaches the document.

Reserved and deliberately empty for now: `identifier` (a DOI, when the project has one)
and `sameAs` (the repository, when what the public sees there is settled -- #112);
`keywords`, because nothing in the Tree supplies them honestly.

**Built 2026-09-21 (#122).** `src/findability/jsonld.ts` emits the graph above; three things
this section left open were settled in building it.

- **Where the script sits: the first element of `<body>`, not the head.** Next.js's App
  Router hoists a page's `<title>`, `<meta>` and `<link>` into the head through
  `generateMetadata` and offers a page no supported way to put an inline `<script>` there;
  the root layout, which could, is given the `[lang]` segment alone and does not know which
  Node the page shows (section 6). This section asks for one script per page emitted by the
  server, and does not place it: JSON-LD is read wherever it stands in the document, and
  the `schema.org` validator read the whole graph -- `WebPage`, `Dataset`, `Organization`,
  `DataDownload`, `Question` and both `Answer` entries -- out of the served page with no
  error and no warning.
- **`distribution` is a one-entry array**, not a bare object. One served format today
  (15.1), and a second one would be a second entry rather than a change of shape.
- **`isBasedOn` emits a Source's URL as the Tree wrote it, never the stripped comparison
  key.** The table says "the most frequent `url` ... compared after dropping fragment and
  query", which admits two readings, and only this one is true of the first Tree. Its legal
  Sources are `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02024R1689-20260727`
  at twenty-odd fragments; stripped of fragment **and query** they become
  `https://eur-lex.europa.eu/legal-content/EN/TXT/`, which identifies no instrument at all,
  because on that address it is the query that names the Act. So the stripping decides
  **which** Sources are one instrument, and the value emitted is the first of them in Node
  order -- `.../?uri=CELEX:02024R1689-20260727#art_2` for the first Tree,
  `https://eur-lex.europa.eu/eli/reg/2024/1689/oj` for the example Tree. Note that
  `ADR-118-json-ld.md` decision 4 says the rule yields the ELI address "for both Trees
  here"; that is true of `trees/ai-act-example/` and false of
  `trees/ai-act-applicability-agrifood/`, which cites the consolidated CELEX text and no
  ELI address at all. The decision's *reason* -- name the thing a reader following the
  page's own links arrives at -- is what this implementation follows, and it is what makes
  the stripped key the wrong value to emit.

### 16.5 `llms.txt`

`GET /llms.txt`, `text/plain; charset=utf-8`, `Cache-Control: public, max-age=3600`.
Markdown content under a plain-text media type: that is what the convention's readers
expect, and `text/markdown` is not reliably handled by the middle of the internet.

Generated from the served Tree's manifest, in the order the convention gives:

- an **H1**: the Tree's `title` in the default language (the one element the convention
  requires);
- a **blockquote**: the Tree's `description` in the default language reduced to plain text
  (16.3 steps 1 and 2, no cut), or the root Node's description when the manifest has none;
- a **short free-form paragraph**, chrome and not Tree content: that this is an
  interactive decision tree, that every step is a page of its own with a real URL, that
  the whole thing is one JSON file, and that nothing here is legal advice -- the same
  disclaimer the pages carry permanently (core document 8);
- `## The dataset`: the Tree file and the schema, as `- [name](url): note` entries;
- `## Walking the Tree`: the root Node's URL, the sitemap, and one line stating the URL
  grammar of 4.1 -- the path is the Trail, `?lang` chooses the language -- so an agent can
  address any step without guessing;
- `## Languages`: the declared languages and which is the default;
- `## Licence`: the content licence with its URL and the holder line, and the code
  licence, naming that Tree content and code differ (core document 8).

Every URL in it is absolute.

**There is no `llms-full.txt`.** The convention describes one -- all of a site's material
in a single document -- and this site already has it: `/<tree-id>/tree.json`, validated
against a published schema, named in the file's first section. A second complete
rendering would be a second serialisation of the same content, by a second renderer, with
no schema and no validator, and it is the copy that would drift.

**`llms.txt` carries no Tree content beyond the manifest's title and description.** It is
a signpost. Node titles, descriptions and Sources are in the pages, in the sitemap and in
the dataset.

**[#171]** So a Terminal's `label` is not in it either, as its `outcome` never was; the
`## The dataset` entry names the schema through `SCHEMA_HREF`, which is
`/schemas/elsa-tree-5.json` from #179 on. Its chrome paragraph -- a walk that "arrives at an
outcome" -- uses the word in its ordinary sense and stays.

**[#195]** Nor an Author's name (2026-10-03): the pages it points to hold the mention (39.7).

## 17. The store

**[#132], new -- 2026-09-23.** The owner opened the editor round (core document 3.4, #131):
Trees are created and edited in the app, saved automatically, hidden until published. The
application is therefore a writer, and this section says where it writes. Recorded in
`docs/adrs/ADR-132-data-directory.md`; decides core document 10.30.

### 17.1 The data directory

| Variable | Required | Meaning |
|---|---|---|
| `ELSA_DATA_DIR` | **yes** | The one writable folder that is the whole state of a deployment. No default. The server refuses to start when it is unset, is not a folder, or cannot be written. Outside `app/`, so a release never touches it. |
| `ELSA_SEED_DIR` | no | Read at the **first start only** -- when `$ELSA_DATA_DIR/trees/` does not exist -- and every Tree folder in it is imported, published, with the administrator as creator. Default `trees` under the working directory, which the standalone build already carries. Never read again. |
| `ELSA_ADMIN_PASSWORD` | at first start | Section 20.3. |
| `ELSA_ADMIN_EMAIL` | at first start, and at the first start of the release that carries #196 | **[#195]** (2026-10-03) The administrator's e-mail address, read at every start: section 38.3. |
| `ELSA_TREE`, `ELSA_TREES_DIR`, `ELSA_TREE_LASTMOD` | **must be unset** | Retired (section 18). Set, the server refuses to start and names the replacement, so a 1.0 environment file is corrected rather than silently half-read. |

`ELSA_BASE_URL`, `PORT`, `HOSTNAME`, `NODE_ENV` and `NEXT_TELEMETRY_DISABLED` are as in
section 1 and `docs/deployment.md`.

### 17.2 The layout

```
$ELSA_DATA_DIR/
├── lock                         the pid of the one process that has this directory open
├── accounts.json                every account (20.1); [#195] each with its e-mail address (38)
├── sessions.json                every live session record (20.4)
└── trees/<tree-id>/
    ├── meta.json                { creator, collaborators, createdAt, updatedAt, updatedBy,
    │                              publishedAt, publishCount, revision }
    │                              [#195] and joined, the order of joining (39.2)
    ├── draft.json               the draft (19): elsa-tree/4 JSON in the byte form of tree-format.md 3.7
    │                              [#171] elsa-tree/5 from #179 (19.1)
    ├── tree.json                the published copy: present if and only if the Tree is published;
    │                              always a Tree that validated in full (19.3)
    ├── images/                  every uploaded picture: the draft's and the published copy's (22.6)
    └── theme/                   the Theme's files (#144)
```

- **A Tree is a folder and the folder name is its id**, as in `trees/` of the repository.
- **A Tree is published if and only if `tree.json` exists** in its folder. There is no
  flag to agree with the file. `meta.json`'s `publishedAt` is when it was last published,
  or absent.
- **Nothing about an account is in `tree.json` or `draft.json`.** Creator, collaborators
  and who last wrote are `meta.json`'s; `tree.json` is the public dataset of section 15
  and carries no name (core document 8). **[#195]** Still none (2026-10-03): the names of a
  Tree's Authors are on its pages, read from `meta.json` and `accounts.json`, and in none of its
  files (39.7).
- The store's files are **JSON**. No database library (`node:sqlite` is experimental on
  Node 22 by its own warning; every native alternative wants a compiler on the server,
  core document 7), no database server (core document 10.16). The numbers are a lab's: a
  handful of accounts, tens of Trees, a few sessions.

### 17.3 One writer, atomic files, a queue per file

All state is read into memory when the store opens; **reads never touch disk**. A write
mutates memory, serialises the whole file and replaces it **atomically**: written to
`<file>.tmp` in the same folder, then `rename`d over the original. Writes to one file go
through **one promise queue per file**, so they land whole, in the order accepted, and
never interleave; writes to two Trees run in parallel. A crash loses at most the write in
flight, whose `.tmp` the next start deletes. **One process per data directory**: the `lock`
file holds its pid and a second process refuses to start while that pid lives. There is no
transaction across two files and nothing needs one.

### 17.4 Seed, import, move, back up

- **Seed** (17.1): `importTree(folder, creator)` copies `tree.json`, `images/` and `theme/`
  into `trees/<id>/`, writes `draft.json` as a byte copy of `tree.json`, and writes
  `meta.json`. A seeded Tree is published from its first start. A folder whose id is
  reserved (4.3), already in the store, or that fails validation in full is skipped and
  the reason printed.
- **Import later**: `node scripts/store.ts import <folder>` (`npm run store -- import
  <folder>`), run with `ELSA_DATA_DIR` set and **the service stopped**, calls the same
  function. Issue #136 builds it.
- **Move a Tree between deployments**: copy `trees/<id>/tree.json`, `images/` and `theme/`
  out -- not `draft.json`, not `meta.json`, which names accounts of the source -- and
  import them on the other side, where that deployment's administrator becomes the
  creator. Plain `cp`; nothing is encoded.
- **Back up**: `rsync -a` or `tar` of `$ELSA_DATA_DIR`, running or stopped. Every file is
  replaced atomically, so each file in a copy is whole; a copy taken while running may hold
  a `draft.json` one write newer than its `meta.json`, which is tolerated (`revision` is
  advisory). Stop the service for a copy exact to the write. Restore is copying the folder
  back. Nothing outside it, and nothing in `app/`, holds state.
- **Development**: `.env.development` sets `ELSA_DATA_DIR=.elsa-data` (gitignored); the
  seed default fills it from `trees/` at the first `next dev`; deleting the folder resets.
- **[#171] An `elsa-tree/4` file is converted, not refused** (2026-10-02): `openStore`
  converts every `/4` `tree.json` and `draft.json` before it opens any Tree, and `importTree`
  converts a `/4` folder's file in its staging copy, by `tree-format.md` 12.7 (36.4). Back the
  directory up before the first start of the release that carries `elsa-tree/5`; nothing
  keeps the `/4` bytes.
- **[#195] A store of user names, and a `meta.json` without `joined`, are converted, not
  refused** (2026-10-03): `openAccounts` converts `accounts.json` before anything reads an
  account (38.4), and the start fills in `joined` from the roles before any Tree is opened
  (39.2). Back the directory up before the first start of the release that carries #196: the
  user names are not kept.

### 17.5 The seam: `src/store/`

The one module that opens a file under `ELSA_DATA_DIR`. Routes call it; components never
do; `src/tree/` knows nothing of it.

```ts
export function openStore(dataDir: string, env: Environment): Promise<Store>
// Locks, reads accounts.json and sessions.json, opens every published Tree through
// openTree, opens every draft in draft mode, seeds on first start, sets the
// administrator's password (20.3). Never throws for one bad Tree (18.3).
// [#195] (2026-10-03) Also gives the administrator its address (38.3), converts a store of user names
// (38.4) and fills in meta.json's joined (39.2).

export interface Store {
  // the read side, every public route's (#134)
  published(id: string): Tree | null          // a servable published Tree; null for hidden, unservable, unknown, reserved
  publishedIds(): string[]                    // in id order
  authors(id: string): string[]               // [#195] (2026-10-03) a servable published Tree's Authors' names; [] otherwise (39.8)
  // accounts and sessions (#135, section 20)
  readonly accounts: Accounts
  readonly sessions: Sessions
  // drafts and writes (#136, sections 19, 21, 22)
  readonly drafts: Drafts
}
```

`Accounts`, `Sessions` and `Drafts` are given in 20, 21 and 22. Every writing member takes
the acting `Account` as its first argument and calls `permit` (21) itself, so a route that
forgot the check is caught at the seam.

## 18. Many Trees per deployment

**[#132], new -- 2026-09-23.** Supersedes section 2 and `ADR-5-tree-selection.md`; decides
core document 10.34 and closes 10.19. Recorded in
`docs/adrs/ADR-132-many-trees-per-deployment.md`.

### 18.1 The rule

- **A deployment serves every published, servable Tree of its store** (17.2, 18.3) and
  nothing else. "Available" in the owner's words is **published**.
- **`/` is the overview page** of every served Tree (23.2), built by #134, drawn by #133.
  It no longer redirects. `/<tree-id>` still redirects (307) to that Tree's root Node.
- **`ELSA_TREE` is gone**, not kept as a pin: a lab with one Tree gets an overview of one
  tile. `ELSA_TREES_DIR` is `ELSA_SEED_DIR` with a new meaning; `ELSA_TREE_LASTMOD` is
  gone because the store writes the published file and its modification time is right by
  construction (16.2). All three refuse to start when set (17.1).
- **Every Node URL, share link, dataset URL and redirect of 1.0 resolves as it did** for
  every published Tree. The row "Tree id in the path is not the served Tree" of 4.3 reads
  "is not a served Tree of the store".
- **A Tree's image and theme files are under its id**: `/<tree-id>/images/<file>`,
  `/<tree-id>/theme/<file>` (4.1). `/images/<file>` and `/theme/<file>` answer 404 from
  #134 on. Neither new address can be a Node page (`<file>` carries a dot, which an id
  cannot), so no URL that resolves now resolves differently -- the same argument that
  admitted `/<tree-id>/tree.json`.
- **Reserved Tree ids**: `images`, `theme`, `schemas`, `admin` (4.3).

### 18.2 The loader and the set

`openTree(dir)` (5.1) is unchanged in what it does: one folder, one `Tree`. The **store**
holds the set (17.5). `servedTree()` and `openConfiguredTree()` in `src/config.ts` are
replaced by `store.published(id)`.

**The set follows the store without a restart because the process is its only writer.** A
publish, an unpublish, a delete and an autosave that leaves a published draft valid (19.4)
swap the in-memory `Tree` for that id in the same call, before the write answers. No file
watcher, no polling: a folder placed by hand is read at the next start.

### 18.3 Startup

At start the store opens every Tree folder that has a `tree.json`. One that fails
validation in full -- a release tightened a rule, a hand edit, a disk fault -- is
**published but not servable**: 404 on every public route, absent from the overview and
every document of 16, exactly as a hidden Tree (23.1); its violations are printed in the
format of 5.4 and shown in the admin area to its creator, collaborators and the
administrator (on its tile and its Publish toggle, #133). The published state is not
touched -- it is the creator's -- and the creator's next valid autosave republishes (19.4).

The process **exits with code 1 only when the data directory itself is unusable**: unset,
missing, not writable, locked by a live process, `accounts.json` unreadable, or
`ELSA_ADMIN_PASSWORD` needed and absent (20.3). **Zero servable Trees is a valid
deployment**: the overview says there are none.

The start log prints one line per Tree served -- `Serving Tree "<id>" (<languages>)` -- one
block per Tree refused, one line for the administrator's password when set from the
variable (20.3), and never a password, a token or a name typed into a form.

**[#171]** Before it opens a Tree, the store converts the `elsa-tree/4` files it finds and
logs one line per file converted (36.4). A `/4` file the conversion cannot carry is refused
like any other that fails, with its violations.

### 18.4 What #134 changes in the earlier sections

| Section | Change |
|---|---|
| 2 | Superseded by this section; kept for the record. |
| 4.1, 4.3 | The two moved addresses; `/admin`; `admin` reserved; the 404 row's wording. |
| 5.1 | `imagePath` answers only files the Tree's Nodes name -- the rule `themePath` always had -- because `images/` now also holds a draft's uploads (22.6). `openTree` gains the draft mode of 19.2. |
| 5.2 | "Server start" reads every published Tree; "nothing served" becomes "that Tree not served". |
| 5.3, 5.5 | The routes take the Tree id from the path and ask `store.published(id)` first. |
| 5.4 | `instrumentation.ts` opens the store. |
| 6 | `src/store/`, `src/app/[lang]/admin/`, the moved route files, `config.ts`'s new variables. |
| 7 | A server per fixture is started with a temporary data directory seeded from that fixture (`ELSA_SEED_DIR`), not with `ELSA_TREE`; the rows named in 18 to 23. |
| 15, 16 | Section 23. |

## 19. Drafts and publishing

**[#132], new -- 2026-09-23.** Decides core document 10.33. Recorded in
`docs/adrs/ADR-132-draft-and-publish.md`; the rule table is `tree-format.md` section 7.

### 19.1 The draft is the same file

`draft.json` is an **`elsa-tree/4` file**, written in the byte form of `tree-format.md` 3.7
by the one writer the migration uses. Same `$schema`, same `format`, no new key. What is not
content -- who, when, the revision -- is `meta.json`'s (17.2). The format number stays
`elsa-tree/4`; no case for a new one was found.

**[#171]** It is an **`elsa-tree/5`** file from #179 on, like the published copy: the
format's number moved for the ending's words (`tree-format.md` 5.5), not for anything the
draft needs. The draft schema is derived from `schemas/elsa-tree-5.json` by the same two
dropped keywords and two relaxed `required` lists, so a Terminal's `label` may hold an empty
language in a draft (a to-do) and `terminal` still requires it.

### 19.2 The draft rules

Every rule of `tree-format.md` section 7 is checked on a draft; **a named set is
advisory**. In one sentence: **shape and safety rules are blocking; completeness and size
rules are advisory.** The table with every rule id is `tree-format.md` 7's Draft column and
is the contract; the reasoning is the ADR's. The mechanism, so that one validator does
both:

- **Schema half**: at start the loader derives a **draft schema** from
  `schemas/elsa-tree-4.json` (**[#171]** `schemas/elsa-tree-5.json` from #179, 19.1) in code
  and compiles both. The derivation drops **two
  keywords** -- the `minLength` on `$defs/localisedText`'s `additionalProperties` and the
  `minLength` on `$defs/image/properties/credit` -- and removes `title` and `description`
  from a Node's `required` and `yes` and `no` from `answers`'. **Every other `minLength`,
  `minItems` and `minProperties` stays**: each is the only enforcement of a rule the table
  keeps blocking (a non-empty `languages`, `nodes` and `metadata.version`; no empty
  `sources`, `images`, `options` or `explainers`; a `theme` with a key and a complete font
  family; a localised text that is never `{}`). Never a second file in `schemas/`. A test
  asserts the derivation.
- **Rules half**: `validateTree(raw, mode)` runs every content rule and, in draft mode,
  tags each violation blocking or advisory by the table, and additionally reports under
  V-L10N and V-IMAGE the empty strings the two dropped keywords let through.

```ts
export function openTree(dir: string, options?: { draft: true }): Promise<Tree | Draft>

export interface Draft extends Omit<Tree, 'getNode' | 'filePath' | 'lastModified'> {
  getNode(id: string): Promise<DraftNode | null>
  readonly advisory: Violation[]        // the whole draft's to-do list, after opening
  readonly blocking: Violation[]        // non-empty only for an uneditable Tree (19.5)
  readonly filePath: string             // draft.json
  referrers(id: string): string[]       // [#177] the ids of the Nodes whose Answers or Options name id, in file order (30.7): ids, never Nodes, as nodeIds (5.1)
}
type DraftNode = Omit<Node, 'answers'> & { answers?: { yes?: string; no?: string } }
// and any LocalisedText may lack a language or hold "" for one; nothing else differs from Node
```

**Referential integrity is the store's**, so a Link to a Node that does not exist stays
blocking: deleting a Node removes every Answer and Option that names it in the same write
(22.4). A Node's `kind` in a draft is derived as always, so a fresh Node is an
"explanation Node" until it gets Answers or an end, and V-ANSWERS' target-kind half is
advisory. V-MARK is advisory because a mark is text the author wrote. The store never
writes an empty array or object (22.4), so V-EMPTY stays blocking with no exception.

**`draft.json` always passes the draft schema and every blocking rule**: what the store
refuses (22.3) it never writes, so a draft can always be opened, indexed and shown.

**Amended 2026-10-02 (#175):** one size rule is refused at the write: a write that would give
a Node a **ninth Option** answers 422 with `V-COUNT` and stores nothing (22.3 and 30.4,
amended the same day). `tree-format.md` 7's V-COUNT row records the exception in its Draft
cell.

### 19.3 Publish

`PUT /admin/api/trees/<t>/published { published: true }` runs the **full** validation --
the published schema, every rule blocking -- on the draft.

- **Passes**: the store sets the manifest's `metadata.version` in the draft to the publish
  count as a string (`"1"`, `"2"`, ...), writes the draft, copies its bytes to `tree.json`,
  sets `publishedAt`, and swaps the in-memory `Tree` (18.2). Public in the same call: the
  Node pages, the dataset, the images the copy names, the next sitemap, `llms.txt` and
  overview request.
- **Fails**: 409 with every violation in the form of 5.1; nothing written, nothing flagged.
  The editor shows them at the fields they name.

`{ published: false }` deletes `tree.json` and drops the in-memory `Tree` in the same call:
404 at once on every public route (23.1).

**The published copy is byte-identical to the draft at the moment of the copy**, so 15.3
holds against `$ELSA_DATA_DIR/trees/<id>/tree.json`.

### 19.4 Autosave on a published Tree (10.33)

After every write to a published Tree the store runs the full validation on the new draft.
**Passes**: `tree.json` is replaced by the draft's bytes and the `Tree` swapped -- **every
valid save reaches the public at once.** **Fails**: `tree.json` is left as it was -- **the
last valid public copy stays until the draft is valid again** -- and the write's response
says so (`tree.publicCopyCurrent: false`, 22.3) with the violations. The public never sees
a Tree that fails section 7.

### 19.5 An uneditable Tree

A `draft.json` that breaks the invariant of 19.2 -- a hand edit -- makes that Tree
**uneditable**, not the deployment down: `Draft.blocking` is non-empty, every write to it
is 409, the admin area shows the violations, and the administrator's way out is the import
command with a repaired file (17.4).

### 19.6 `metadata.version`

The store's, on the manifest (the publish count, 19.3) and on a Node (`"1"` at creation).
The editor of this round exposes no metadata field; an imported Tree keeps its author's
`metadata` keys and only `version` is touched. #133 may add editing of `metadata` within
that.

### 19.7 The seam: `Drafts`

```ts
export interface Drafts {
  create(by: Account, id: string, languages: string[], title: LocalisedText): Promise<TreeEntry>
  entry(by: Account, id: string): TreeEntry | null          // meta, published, servable, advisory count, violations
  list(by: Account): TreeEntry[]                             // the caller's; every Tree for the administrator
  draft(by: Account, id: string): Draft | null
  write(by: Account, id: string, target: Manifest | NodeId, change: Field | Operation): Promise<WriteResponse>   // 22.3
  createNode(by: Account, id: string, from: { node: string; link: 'yes' | 'no' | 'option' | 'end'; label?: LocalisedText }, title?: LocalisedText): Promise<WriteResponse>   // [#171] `label` for 'end', was `outcome?: Outcome` (36.3)
  deleteNode(by: Account, id: string, nodeId: string): Promise<WriteResponse>
  publish(by: Account, id: string, published: boolean): Promise<TreeEntry>   // throws Invalid { violations } for 409
  delete(by: Account, id: string): Promise<void>                              // hidden Trees only
  handOver(by: Account, id: string, to: string): Promise<TreeEntry>
  addCollaborator(by: Account, id: string, accountId: string): Promise<TreeEntry>
  removeCollaborator(by: Account, id: string, accountId: string): Promise<TreeEntry>
  uploadImage(by: Account, id: string, bytes: Uint8Array, clientName: string): Promise<{ file: string; width: number; height: number }>
  removeImage(by: Account, id: string, file: string): Promise<void>
  draftImagePath(by: Account, id: string, file: string): string | null        // 22.6
  importTree(folder: string, creator: Account): Promise<TreeEntry>            // 17.4; the seed and the CLI
}
```

## 20. Accounts, sessions and the administrator

**[#132], new -- 2026-09-23.** Decides core document 10.31 and 10.32; restates core document
8 and 9 for creators. Recorded in `docs/adrs/ADR-132-accounts-and-sessions.md`.

### 20.1 Accounts

```ts
interface Account {
  id: string            // 16 random bytes as hex; never reused; what meta.json names
  name: string          // display name, plain text, 1 to 80 characters; shown in the admin area only
  login: string         // a user name in the id grammar of tree-format.md 3.1, 2 to 64 characters, unique, lower-cased on entry
  passwordHash: string  // 20.2
  active: boolean       // false = deactivated: cannot log in, sessions ended, Trees kept
  administrator: boolean   // true on exactly one account, set by the server alone (20.3)
  createdAt: string     // ISO 8601
}
```

- **The login is a user name, not an e-mail address**: the application sends no mail
  (core document 7), so an address would be personal data held for nothing (8).
- **The administrator creates every account** (10.31): name, login, first password, handed
  over out of band; the holder changes it with their current password. **No
  self-registration**, no invitation link, no reset by mail.
- **An account is deactivated, never deleted**: `meta.json` files name it. Its Trees stay;
  the administrator hands them over (21).

**Amended 2026-10-03 (#195, the owner's #194: "To login should be based on an email and a
password").** `login` is replaced by **`email`**, an e-mail address (38.1, 38.2), and the first
bullet no longer holds: the owner decided that the address is held, and still no mail is sent.
The administrator creates every account with a name, an address and a first password, and is the
one who changes an address (38.5); no two accounts carry one name (38.6). `name` is shown in the
admin area and, for an Author, on the public pages of its Trees (39.8). An account a converted
store left without an address cannot log in until the administrator gives it one (38.4).

### 20.2 The password hash

**`scrypt` from `node:crypto`**: N = 2^16, r = 8, p = 2, `maxmem` 128 MiB, 16 random bytes
of salt, a 32-byte key -- about 64 MiB and 100 ms per hash. Stored as
`scrypt$16$8$2$<salt base64url>$<key base64url>`, so a later raise re-hashes at the next
successful login. Compared with `timingSafeEqual`. A login naming no account still runs
`scrypt` against a fixed dummy hash. A password is **12 to 256 characters** and nothing
else is required of it. Not Argon2 (not in `node:crypto` on Node 22; a package is a
native module), not PBKDF2 or bcrypt (cheaper for an attacker per unit of the defender's
cost).

### 20.3 The administrator

One account, login `admin`, `administrator: true`, created by the server. Every permission
on every Tree, present and future, whoever created it, is the line `account.administrator
|| role(tree, account)` in `permit` (21); nothing is written into any Tree for it. The flag
cannot be set, cleared or deactivated by any request.

**Its password is `ELSA_ADMIN_PASSWORD`**, read **at every start** (10.32): no
administrator yet → created with it; one exists and the variable is set → the password is
**replaced**. That is the recovery for a lost password -- set, restart, remove -- and why
the variable must be removed after the first start: while set, it wins over a change made
in the admin area. Under 12 characters, or absent when no administrator exists, refuses to
start. **Never a default, never generated and printed**; the log says `administrator
password set from ELSA_ADMIN_PASSWORD; remove the variable` and no more. The environment
file that holds it is `0600`.

**Amended 2026-10-03 (#195):** the administrator logs in with an e-mail address like every
account, not with `admin`. The address is **`ELSA_ADMIN_EMAIL`**'s, read at every start as the
password is, by the table of 38.3: it creates the administrator with the password, gives a
converted administrator its address and replaces a forgotten one; while the administrator has no
address, a start without it refuses. The repository invents none, and the live demo server's is
the owner's to choose (38.3).

### 20.4 Sessions

On login the server draws **32 random bytes** (base64url) as the token, stores
`{ tokenHash: sha256(token), accountId, createdAt, lastSeen, expiresAt }` in
`sessions.json`, and sets **the one cookie of this application**:

```
Set-Cookie: elsa-admin-session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=<seconds to expiresAt>
```

| Attribute | Why |
|---|---|
| `HttpOnly` | No script reads it. |
| `Secure` | HTTPS only. `localhost` is a secure context in every browser, so development keeps the flag. **[#162]** Only on a deployment reached over HTTPS: the request arrived over TLS, carries `x-forwarded-proto: https`, or `ELSA_BASE_URL` starts with `https://`. On a plain-HTTP deployment the flag is left off, because a browser keeps a `Secure` cookie from no address there but `localhost`, so nobody could log in, and the flag would protect nothing: every request of that deployment travels in clear. The logout cookie follows the same rule; the session check never reads the flag. HTTPS remains strongly advised (`docs/deployment.md`). |
| `SameSite=Strict` | `Lax` would send it on a cross-site top-level navigation, the one hole a same-site cookie leaves. The admin area has no cross-site entry that needs the session: a creator arriving from a link sees the login page and is sent on to the page asked for. |
| `Path=/admin` | The browser never sends it to a public route, so no public route can read, log or echo it. This is why the API is `/admin/api/...` (22.1). |
| no `Domain` | Host-only. |
| `Max-Age` | The absolute expiry; the idle expiry is the server's. |

- **Expiry**: **12 hours idle, 14 days absolute.** `lastSeen` is refreshed when more than 5
  minutes old; expired records are swept at the next write of the file.
- **Regeneration**: a login always issues a new token and never accepts one from the
  request; a login while a session is live replaces record and cookie.
- **Logout** deletes the record and answers the same cookie with `Max-Age=0`. Deactivating
  an account or changing its password ends every session of that account.
- **The record holds the token's hash**, so a read of `sessions.json` logs nobody in.

```ts
export interface Accounts {
  authenticate(login: string, password: string): Promise<Account | null>   // runs scrypt either way (20.2)
  get(id: string): Account | null
  listActive(): Pick<Account, 'id' | 'name' | 'login'>[]                   // 21.4
  create(by: Account, name: string, login: string, password: string): Promise<Account>
  update(by: Account, id: string, change: { name?: string; active?: boolean; password?: string; currentPassword?: string }): Promise<Account>
}
export interface Sessions {
  start(account: Account): Promise<{ cookie: string }>                    // the Set-Cookie value above
  resolve(cookieHeader: string | null): Promise<Session | null>          // null: absent, unknown, expired, deactivated account
  end(session: Session): Promise<{ cookie: string }>                      // the clearing Set-Cookie value
}
```

**[#195] (2026-10-03)** From #196: `authenticate(email, password)`, `byEmail` in place of the
built `byLogin`, `listActive()` answering `id` and `name`, `create(by, name, email, password)`,
and `email` among `update`'s change (38.2).

### 20.5 The public routes set no cookie

**A rule of section 8, with its test named.** No route outside `/admin` sends
`Set-Cookie` under any condition, and none reads `Cookie`. `tests/browser/deployment.spec.ts`
keeps its sweep and gains the **logged-in half**: after a login in the same browser
context, a walk of every public route of 4.1, 15 and 16 sends **no** `Cookie` header and
receives no `Set-Cookie`, and `/admin/api/login` is asserted to be the **only** URL of the
run that ever set one, with every attribute of 20.4 present. The CORS permission of 15.2
stays safe for the reason 15.2 gives; this rule is what keeps that reason true.

**[#135] As built.** `POST /admin/api/logout` also answers a `Set-Cookie`: the clearing
value (`Max-Age=0`, the same attributes) that 20.4 requires of a logout, and that 35.5
already names beside the login. The sweep asserts the login and that clearing value as the
only two setters of the run, not the login alone; neither is a public route.

**Amended 2026-10-03 (#195, the owner's #194).** The rule of core document 8 and 9 that this
section carries has the owner's one exception: who authored a Tree is mentioned on it. Restated:
**a public route may hold, about an account, exactly the `name` of each Author of a published,
servable Tree, in that Tree's mention on its Node pages and on its tile on the public overview,
and nothing else** -- no address, no id, no role, no time of joining, no other account's name,
the administrator's included; a hidden Tree's names reach no public route (39.8). The test is
this file's: `tests/browser/deployment.spec.ts` gains the **account sweep**, every public route
of 4.1, 15, 16 and 23 walked over a data directory whose accounts have known addresses and ids,
asserting that no response holds an address or an id, that the name of an Author of a hidden Tree
only is in none, and that the published Tree's Authors' names stand inside the mention's element
and nowhere else (39.9). The cookie sweep stands as it is.

### 20.6 CSRF

Every `POST`, `PUT`, `PATCH` and `DELETE` under `/admin` -- the login route included -- is
**403** unless all three hold:

1. `Sec-Fetch-Site: same-origin`; or, when the header is absent, `Origin` equal to the
   deployment's own origin (`ELSA_BASE_URL` when set, else the request's `Host` as
   `baseUrl` in `config.ts` resolves it);
2. **on a request that carries a body** -- a `Content-Type` header, or any body bytes,
   present -- the type is `application/json`, or `multipart/form-data` on
   `POST /admin/api/trees/<t>/images` only. `application/json` is a type no HTML form can
   send and no cross-site script can send without a preflight this server does not answer,
   so on every JSON route this layer refuses a form by itself. `multipart/form-data` is one
   of the three types a form *can* send with no preflight, so on the upload route this
   layer refuses only the other two form types, and layers 1 and 3 carry the route. A
   request with no `Content-Type` and no body -- `POST /admin/api/logout` and the three
   `DELETE` routes of 22.1, whose handlers read no body -- passes this layer and is
   carried by layers 1 and 3; a form cannot produce such a request, because a form `POST`
   always carries one of its three types and a form cannot send `DELETE` at all;
3. the cookie's `SameSite=Strict` (20.4).

`GET` and `HEAD` change nothing, ever. **No synchroniser token.** No route under `/admin`
sends any `Access-Control-*` header. One function, `authenticated(request, { writing })`,
does 20.4's resolve and this check for every handler (22.1).

### 20.7 Rate limit on login

In memory, two counters. **Per login name**: 5 consecutive failures lock the name for 15
minutes; a success resets. **Per deployment**: more than 60 failed logins in one minute
across all names locks the route for one minute (429, `Retry-After`) -- each attempt costs
64 MiB of scrypt, so this is also what keeps the box up. A lock is **429**, a wrong password
**401**, both with the same body. **Not per client address**: the documented proxy passes
no `X-Forwarded-For`, and an address is the one datum about a person this project has never
held.

**Amended 2026-10-03 (#195):** per **address typed**, not per login name: the string the request
carries in `email`, trimmed and lower-cased, whether or not an account holds it (38.7). The
per-deployment counter, the 401 and 429 with one body, and "not per client address" stand.

### 20.8 Logging

To standard output: a login success (`account <id> logged in`); a failure (`login failed
for account <id>`, or `login failed for an unknown name` -- **never the name typed**, which
is the commonest place a password lands in a log); a lock; a logout; every account,
permission and publish change with the acting account's id, the Tree id and the time.
**Never**: a password, a token or its hash, a request body, a client address, a field's
text.

**Amended 2026-10-03 (#195):** `login failed for an unknown address`, and a lock likewise; never
an e-mail address -- the address typed, or any account's, the administrator's included -- in any
line (38.8).

### 20.9 Headers on `/admin`

Every response under `/admin`: `X-Robots-Tag: noindex, nofollow`, `Cache-Control:
no-store`; the pages a `<meta name="robots" content="noindex, nofollow">` to match.
`robots.txt` is unchanged (16.1, 23.3).

## 21. Permissions

**[#132], new -- 2026-09-23.** Core document 9's last bullet as a contract. Recorded in
`docs/adrs/ADR-132-roles-and-permissions.md`.

### 21.1 Roles

Per Tree, three: the **creator** (`meta.json`'s `creator`: the account that created it or
was handed it), a **collaborator** (in `meta.json`'s `collaborators`), the
**administrator** (20.3; named in no `meta.json`). An account may hold different roles on
different Trees. Every active account may create a Tree; a deactivated account may do
nothing.

**[#195] (2026-10-03)** A Tree's roles are also what its public mention names: its creator and
its collaborators, never the administrator, in the order in which each first joined it (39.1,
39.2).

### 21.2 The table

| Action | Creator | Collaborator | Administrator |
|---|---|---|---|
| Create a Tree (becomes its creator) | every active account | | yes |
| Read the draft and its images in the admin area | yes | yes | yes |
| Edit content: fields, structure, explainers, Sources, image order | yes | yes | yes |
| Upload an image; remove an unreferenced one | yes | yes | yes |
| Invite a collaborator; remove one | yes | no | yes |
| Publish; unpublish | yes | no | yes |
| Hand the Tree over | yes | no | yes |
| Delete the Tree -- **hidden Trees only** | yes | no | yes |
| Manage accounts | no | no | yes |
| Change own name and password | yes | yes | yes |
| See the active accounts list (name, ~~login~~ **[#195]** (2026-10-03) no address, 38.5), for an invitation | yes | yes | yes |
| **[#195]** (2026-10-03) Change an account's e-mail address (38.5) | no | no | yes: every account's, its own included |

A published Tree has share links, a dataset URL and sitemap entries out; **delete is two
steps** -- unpublish, then delete -- and 409 while published. A collaborator edits but does
not publish; a collaborator's edits to a published Tree reach the public through 19.4,
which is the trust an invitation extends.

### 21.3 The check

```ts
export type Action = 'read' | 'edit' | 'upload' | 'invite' | 'publish' | 'hand-over' | 'delete'
export function permit(account: Account, meta: TreeMeta, action: Action): boolean
```

Pure, in `src/store/permissions.ts`, the table as a `switch` with no default branch. Every
handler under `/admin/api` calls it after `authenticated` and before touching the store;
every writing member of the store calls it again. **No** is **403** with no detail -- also
for a read of a Tree the caller has no role on, not 404: the admin area is not a public
route, and a 404 there would tell a collaborator of one Tree which other ids are hidden
rather than absent. The UI hides what a role may not do; the server never consults the UI.

### 21.4 Invitations

`GET /admin/api/accounts` answers every **active** account's `id`, `name` and `login` to
any logged-in account; the creator picks one; `PUT
/admin/api/trees/<t>/collaborators/<accountId>` adds it. No search, no exact-match typing:
at a lab's size the list is the search. Adding the creator, the administrator or a
deactivated account is 422; adding an existing collaborator is 200.

**Handing over** sets `creator` to the named account and adds the old creator as a
collaborator, so nothing they could see disappears under them.

**Amended 2026-10-03 (#195):** the list answers each active account's `id` and `name` and
nothing else -- no address, which only its holder and the administrator see (38.5) -- and names
are one per account, so a name tells two accounts apart (38.6). An invitation appends the
invited account to `meta.json`'s `joined`, and a hand-over the new creator, each when it is new
to the Tree; the old creator keeps its place there (39.2).

## 22. The editor's server interface

**[#132], new -- 2026-09-23.** Recorded in `docs/adrs/ADR-132-editor-api.md`.

### 22.1 Route handlers under `/admin/api/`

Every request and response is JSON over plain HTTP with a documented path, method and
status, checkable with `curl`; **not Server Actions**, whose wire format is the
framework's. The prefix is `/admin/api/` and not `/api/admin/` so that the cookie's
`Path=/admin` (20.4) covers screens and API with one attribute. Every handler is shaped
`authenticated → permit → store → JSON` and is thin. Every response carries 20.9's headers.

| Method and path | Does | Answers |
|---|---|---|
| `POST /admin/api/login` | `{ login, password }`; **[#195]** (2026-10-03) `{ email, password }` from #196 (38.2) | 204 + cookie; 401; 429 |
| `POST /admin/api/logout` | ends the session | 204 + clearing cookie |
| `GET /admin/api/me` | the caller | `{ id, name, login, administrator }`; **[#195]** (2026-10-03) `email` in place of `login` (38.2) |
| `GET /admin/api/accounts` | active accounts, for an invitation (21.4) | `[{ id, name, login }]`; **[#195]** (2026-10-03) `[{ id, name }]` (38.5) |
| `POST /admin/api/accounts` | administrator: `{ name, login, password }`; **[#195]** (2026-10-03) `{ name, email, password }` (38.2) | 201; 422 |
| `PATCH /admin/api/accounts/<id>` | administrator: `name`, `active`, `password`; self: `name`, `password` + `currentPassword`; **[#195]** (2026-10-03) and `email` from the administrator alone, 403 from anyone else (38.5) | 200; 403; 422 |
| `GET /admin/api/trees` | the caller's `TreeEntry` list (administrator: all) | `[...]` |
| `POST /admin/api/trees` | `{ id, languages, title }`: folder, `meta.json`, a draft with one root Node `start` | 201; 409 taken; 422 reserved or malformed |
| `GET /admin/api/trees/<t>` | the `TreeEntry`: meta, manifest, `published`, `servable`, violations; **[#147]** and `written`, the number of localised texts holding a non-empty string per declared language (33.5) | 200 |
| `PATCH /admin/api/trees/<t>` | one manifest field `{ path, value }`: `title.<lang>`, `description.<lang>`, `root`; **[#144]** or one part of the Theme, `theme.logo`, `theme.fonts`, `theme.colours`, whole or `null` (33.8); **[#147]** or one language operation `{ op, tag }` (22.2); **[#171]** or `{ op: 'use-library-font', role, family }`, a family of the font library copied into the Tree and written as that role's (37.3) | `WriteResponse`, with every Node whose texts changed in `also` |
| `DELETE /admin/api/trees/<t>` | hidden Trees only | 204; 409 |
| `PUT /admin/api/trees/<t>/published` | `{ published: boolean }` (19.3) | 200 `{ published, publishedAt }`; 409 `{ violations }` |
| `PUT /admin/api/trees/<t>/creator` | `{ accountId }` | 200 `meta` |
| `PUT` / `DELETE /admin/api/trees/<t>/collaborators/<accountId>` | add; remove | 200 `meta`; 422 |
| `GET /admin/api/trees/<t>/nodes/<n>` | one `DraftNode`, its advisory violations, the titles its Links need | 200; 404 |
| `POST /admin/api/trees/<t>/nodes` | `{ from: { node, link: 'yes' \| 'no' \| 'option' }, title? }` creates the Node **and** the Link in one write; `link: 'end'` with `outcome` makes the parent a Terminal instead -- **[#171]** with `label`, a localised text holding the page's language, in place of `outcome` (36.3) | 201 `WriteResponse` (+ the parent's as `also`) |
| `PATCH /admin/api/trees/<t>/nodes/<n>` | one field `{ path, value }` or one operation `{ op, ... }` (22.2) | `WriteResponse` |
| `DELETE /admin/api/trees/<t>/nodes/<n>` | the Node and every Link to it; never the root | 204 + `also`; 409 on the root |
| `POST /admin/api/trees/<t>/images` | `multipart/form-data`, one file (22.6) | 201 `{ file, width, height }`; 413; 415; 422 |
| `DELETE /admin/api/trees/<t>/images/<file>` | an unreferenced file | 204; 409 while referenced |
| `GET /admin/api/trees/<t>/images/<file>` | a draft's picture, to a reader with a role (22.6) | the file with 5.3's headers + `no-store`; 403; 404 |
| `POST /admin/api/trees/<t>/theme` | **[#144]** `multipart/form-data`, one logo or font file (33.8) | 201 `{ file }`; 413; 415; 422. **[#171]** For a font, 201 `{ file, family? }`: `family` the font's own family name when its file states a usable one (37.4) |
| `GET /admin/api/trees/<t>/theme/<file>` | **[#144]** a file the draft's Theme names, to a reader with a role (33.8) | the file with 5.5's headers + `no-store`; 403; 404 |

Status codes for every route: **401** no or invalid session; **403** `permit` said no, or
20.6 failed; **404** unknown Tree or Node (for a caller with a role); **409** a state
conflict (published, root, uneditable, id taken); **413** too large; **415** wrong type;
**422** a blocking violation or a malformed body; **429** rate limited.

The screens -- `/admin`, `/admin/trees/<t>/...` -- are #133's and render inside the
`[lang]` layout like every page. **[#133]** They are sections 24 to 33: the addresses in
24.1, the login page in 25.1, the editor's route in 34.7.

### 22.2 The unit of a write

**One field or one operation on one Node**; the manifest takes fields only. **[#147]** The owner promoted #147
(2026-09-27): the manifest takes three operations too, each on its `languages` and applied across the
whole draft in one write through the Tree's queue -- `add-language { tag }` appends the tag and
writes `""` for it into every localised text of the manifest and every Node (V-L10N then lists
each as a to-do, 19.2); `remove-language { tag }` drops the tag and every text under it, a text
left with no language getting `""` for each remaining one (never the `{}` V-EMPTY blocks), and
is **409** while the tag is the default language, which is also the only one when one is left;
`set-default-language { tag }` moves the tag to the front (3.3) and changes no text. A tag that is
malformed, or already declared (`add`), or not declared (`remove`, `set-default`) is 422 with
V-LANG; any other operation on the manifest is 422 with V-KEYS. `also` names every Node whose
texts changed. Any role that edits may send them (21.2), as for any other manifest field.
**[#171]** A fourth: `use-library-font { role, family }` copies a family of the font library
into the Tree's `theme/` and writes it as that role's entry of `theme.fonts` (37.3); an unknown
family or role is 422 with V-THEME. The three language operations also reach a Terminal's
`label`, which is a localised text like every other (`add-language` writes `""` into it).

- A **field** is a key path the format defines: `title.<lang>`, `description.<lang>`,
  `sources[i].label.<lang>`, `sources[i].url`, `sources[i].kind`, `images[i].description.<lang>`,
  `images[i].credit`, `images[i].source`, `explainers[i].term.<lang>`, `explainers[i].text.<lang>`,
  `options[i].title.<lang>`, `terminal.outcome`. Checked against the key set of
  `tree-format.md` 4 and 5 **before** anything is applied; any other path is 422 (V-KEYS).
  **[#171]** `terminal.label.<lang>` in place of `terminal.outcome`, which is 422 (V-KEYS)
  from #179 on.
- An **operation** is one of a closed set: `add-source`, `remove-source`, `add-image` (an
  uploaded file), `remove-image`, `move-image`, `add-explainer`, `remove-explainer`,
  `add-option` (an existing explanation Node, or a new one), `remove-option`, `set-answer`
  (`yes` or `no` → an existing Node), `remove-answer`, `set-terminal`, `remove-terminal`.
  **[#171]** `set-terminal` takes `label`, a localised text, in place of `outcome`.
- **Limits on the request**: a body of at most **64 kB**; any string of at most **2,000
  code points** (the largest limit of 5.7 is 600). Above either, 413 or 422, nothing stored.

### 22.3 The write response

```ts
interface WriteResponse {
  revision: number             // the Tree's after this write; monotonic per Tree
  node: DraftNode | null       // as stored; null after a delete
  manifest?: Manifest          // when the write was to the manifest
  violations: Violation[]      // this Node's (or the manifest's) advisory list, after the write
  tree: {
    advisory: number           // the whole draft's advisory count: what the Publish toggle shows
    published: boolean
    publicCopyCurrent: boolean // false while an invalid draft leaves the last valid copy (19.4)
  }
  also?: WriteResponse[]       // other Nodes this write changed
}
```

- **A write that violates 5.7, or any advisory rule, is stored and answers 200**, with the
  violation in `violations` -- `keyPath` (`description.nl`), `rule` (`V-LENGTH`), the
  message with the actual and the maximum -- which is what the editor shows **at the
  field**.
- **A write that would break a blocking rule answers 422** with the same `Violation`
  shape and stores nothing.
- 403 no role; 404 unknown Tree or Node; 409 uneditable Tree (19.5).

**Amended 2026-10-02 (#175):** one count of 5.7 is refused, not stored: a write that would give
a Node a **ninth Option** answers 422 with `V-COUNT` and stores nothing (30.4, amended the same
day).

### 22.4 Structural writes

One operation, applied whole: creating a Node from a parent writes the Node **and** the
parent's Link in one store write; deleting a Node removes every Answer and Option that
names it in the same write; the root Node cannot be deleted, and `root` may be pointed at
another question Node or Terminal instead. A new Node's id is `n-<6 lowercase base32
characters>` unless the request names a free, valid one; ids are stable for the Tree's
life because they are in every URL. **No empty array or object is ever written**: removing
the last Source, Image, Option or explainer removes the key, and `remove-answer` on the
last Answer removes `answers` (the Node is an explanation Node again), so V-EMPTY holds on
every draft the store writes.

### 22.5 Concurrency between collaborators

**Last write wins, per field.** The store's queue serialises writes to one Tree; a field
write replaces that field and no other, so two people in two fields of one Node never
touch each other's text; two people in **one** field get the later value, and every
response carries the Node as stored, so the editor **repaints every field it is not
focused on**. `revision` tells "changed under me" from "my own write"; what the editor
shows is #133's. **No `If-Match`, no 409 on a stale write**: an autosave has no user to ask.

### 22.6 Images

- **Upload**: one file per request, `multipart/form-data`, refused above **5 MiB** (413).
  The type is taken from the **first bytes**, never from the name or the declared type:
  **PNG, JPEG, GIF, WebP** accepted; anything else, **SVG included**, is 415. Width and
  height are read from the bytes and returned.
- **The file name is the server's**: the client's name lower-cased, every run outside
  `[a-z0-9]` → one `-`, leading and trailing separators dropped, the stem cut to 100
  characters; result `<stem>-<first 8 hex of the bytes' SHA-256>.<extension of the sniffed
  type>` -- which matches `tree-format.md` 3.5 by construction, is **checked against 3.5
  anyway**, and whose resolved path must lie inside the Tree's `images/` after
  `path.resolve` (5.5's two-checks rule). The same bytes twice give one file. Written to
  `$ELSA_DATA_DIR/trees/<t>/images/` through the atomic writer.
- Attaching is the separate `add-image` operation (22.2); the upload knows no Node.
  Removal is refused while the draft or the published copy names the file; after a
  publish, files neither names are deleted.
- **A draft's images are served to a logged-in reader with a role only**, at
  `GET /admin/api/trees/<t>/images/<file>`, with 5.3's headers plus `no-store`. The public
  `/<tree-id>/images/<file>` serves what the **published copy references** and nothing else
  (18.1, 5.1). The Bubble takes its image URL builder as a parameter -- the public page
  passes `imageHref`, the editor passes the admin one; the mechanism is #133's inside the
  reuse rule.

## 23. The public routes with many Trees, and a hidden Tree

**[#132], new -- 2026-09-23.** Core document 9's hidden-Tree bullet as a contract; how 15
and 16 read with many Trees. Recorded in `docs/adrs/ADR-132-hidden-trees-and-findability.md`.

### 23.1 One 404

Every public route works from `store.publishedIds()` and `store.published(id)` (17.5). A
**hidden** Tree, a **published but not servable** Tree (18.3), an id that **never was** a
Tree and a **reserved** word are **one case**: `published(id)` is `null` and the answer is
the 404 of 4.3 -- same page, same status, same headers, no difference a caller can measure.
That covers the Node page and both redirects, `/<tree-id>/tree.json`,
`/<tree-id>/images/<file>`, `/<tree-id>/theme/<file>`, and absence from the overview,
`sitemap.xml`, `llms.txt` and every JSON-LD graph. No public route reads a draft, a
`meta.json` or `accounts.json`; the store's public interface has no member that could
return one. Unpublishing makes all of it true in one call (19.3); the hour of
`Cache-Control` on files and documents is the one delay, the same hour a Tree update always
had.

**Amended 2026-10-03 (#195):** one member of the public interface reads `meta.json` and
`accounts.json`, and answers names only: `authors(id)`, the names of a servable published Tree's
Authors, and `[]` for every id `published(id)` answers `null` for, one case as above (39.8). No
member answers a draft, a `meta.json` or an account.

### 23.2 The overview, `/`

Every served Tree: its title in the page's language when declared, else in its default
language with a `lang` attribute on the tile; its logo when its Theme names one; a link to
its root Node in the page's language or the Tree's default. **Order: by `id`**, so two
requests agree and no Tree buys the top by renaming (#133 may order the display within
that). **[#133]** The tile, the grid and its scroll box are 26.1 to 26.3; the creators'
overview, with its two groups each in `id` order, is 26.4. The page's languages are the
chrome's, `en` and `nl`: canonical, `hreflang` for both
and `x-default`, a `<meta name="description">` from a chrome string; no Tree content beyond
the titles. No cookie. **No JSON-LD in this round** (an `ItemList` is reserved, not built).
Zero served Trees: the page says so, in the chrome language.

### 23.3 `robots.txt`

One file, **unchanged**. Nothing disallowed, `/admin` included (20.9 uses the header). 16.1
and its test stand.

### 23.4 `sitemap.xml`

One document: the overview's two addresses first (`/`, `/?lang=nl`, with their alternates),
then every served Tree in `id` order, each Tree's Nodes in file order, each `<url>` as 16.2
gives it. **`lastmod` per Tree**: that Tree's `tree.json` modification time, written by the
store at its last publish -- right by construction, so 16.2's copy-pipeline caveat and
`ELSA_TREE_LASTMOD` are gone; unreadable → no `lastmod`. The 50,000 limit is now a sum over
Trees; the generator fails loudly rather than truncating, and the index stays reserved.

### 23.5 `llms.txt`

One document, the deployment's: H1 a chrome string (`ELSA decision trees`), blockquote one
chrome sentence; then `## The Trees` -- one entry per served Tree in `id` order, `- [<title
in its default language>](<root URL>): <description reduced by 16.3 steps 1 and 2, or the
root Node's>`; then 16.5's sections with one line per Tree where they named one (`## The
datasets`: every `tree.json` and the one schema; `## Walking a Tree`: the overview, the
sitemap, the grammar line; `## Languages`: per Tree, default marked; `## Licence`
unchanged). Still a signpost: no Node's text, no `llms-full.txt`; **[#195]** and no Author's
name (2026-10-03, 39.7).

### 23.6 JSON-LD and the dataset

Per Tree, unchanged in shape: the `Dataset` on each Tree's own root page with `@id`
`<base>/<tree-id>#dataset`; no page names another Tree's `Dataset`. `version` is
`metadata.version`, now the publish count (19.6), so it changes exactly when the dataset
does. `/<tree-id>/tree.json` streams `$ELSA_DATA_DIR/trees/<id>/tree.json`; 15.2 and 15.3
are unchanged, with byte-identity asserted against that file. 15.2's CORS reason -- no
credential on these routes -- is kept true by 20.5.

### 23.7 The test rows

| Test | Asserts (built by) |
|---|---|
| `tests/store/store.test.ts` (#134) | `openStore` on an empty directory seeds from `ELSA_SEED_DIR` and publishes; on a second open reads no seed; a hidden Tree (no `tree.json`) is not in `publishedIds`; a published Tree that fails validation is `servable: false`, not thrown, and the rest are served; two writes to one file land in order and the file is never torn (a reader mid-write sees the old or the new bytes, never a mix); the lock refuses a second open; the three retired variables refuse to start with the replacement named. |
| `tests/store/drafts.test.ts` (#136) | 19.2's table, one fixture per row under `tests/fixtures/drafts/`; every field path of 22.2 accepted and every other refused; every operation; the cascade on delete; the root undeletable; an advisory write stored and reported; a blocking write refused and not stored; removing the last entry of an array removes the key; publish refused with violations and accepted with the copy byte-identical; 19.4 on a published Tree; the derived draft schema equals the published one minus the two named keywords and the two `required` entries, and a `draft.json` with `"languages": []`, `"version": ""` or `"sources": []` is refused by it. |
| `tests/store/accounts.test.ts`, `sessions.test.ts` (#135) | the hash format and re-hash on parameter change; `authenticate` runs the KDF on an unknown name; the two lock counters; 12-hour idle and 14-day absolute expiry; the 5-minute refresh; the cookie constant, attribute by attribute; a deactivation ends sessions. |
| `tests/store/permissions.test.ts` (#136) | every cell of 21.2. |
| `tests/store/images.test.ts` (#136) | sniffing (a PNG named `.jpg`, text named `.png`, an SVG → 415); hostile names (`../x.png`, spaces, upper case, 300 characters, `%2F`) → a name matching 3.5 inside `images/`; the size cap; identical bytes → one file; removal refused while referenced. |
| `tests/browser/admin-api.spec.ts` (#136) | 401 without a session; 403 on a foreign Tree; 403 on a write without `Origin`/`Sec-Fetch-Site` or with a foreign `Origin`; 403 on a form-encoded body, on a JSON route and on the upload route; 204 on a bodyless `POST /admin/api/logout` with no `Content-Type`; 415 on an SVG; every `/admin` response `no-store` and `noindex`. |
| `deployment.spec.ts` (#135) | 20.5: the logged-in half of the sweep; `/admin/api/login` the only setter, every attribute present. |
| `findability.spec.ts`, `tests/findability/*.test.ts` (#134) | a data directory with two Trees, one hidden: the hidden id appears nowhere in the sitemap, `llms.txt` or the overview; every route of 23.1 answers 404 for it, identically to an unknown id; `lastmod` differs per Tree; the overview's head (23.2). |
| `jsonld.test.ts` (#136) | `version` equals the publish count after two publishes. |
| `tests/browser/admin.spec.ts` (#143) | the walk: administrator, creator, collaborator and visitor, screenshots and measurements. |

## 24. The admin area: routes, chrome and language

**[#133], new -- 2026-09-26.** The owner opened the editor round (core document 3.4,
#131): `/admin` shows a login page, then "the same front page with the overview", then an
editor that "looks exactly like the final datastructure". #132 froze what is behind the
screens (17 to 23); sections 24 to 35 freeze the screens. Recorded in
`docs/adrs/ADR-133-admin-routes.md`.

### 24.1 The addresses

```
/admin                                     the login page (no session) or the creators' overview (26)
/admin/new                                 the new-Tree form behind the + tile (27)
/admin/account                             the caller's own name and password (25.2)
/admin/accounts                            the administrator's accounts page; the 403 page for anyone else (25.3)
/admin/trees/<tree-id>                     307 to the editor of the root Node, like /<tree-id>
/admin/trees/<tree-id>/<id-1>/.../<id-n>[?lang=<tag>]   the editor: the grammar of 4.1 behind the prefix, 1 <= n <= 50
/admin/api/...                             the route handlers of 22.1
```

- **The editor's address is the public address behind `/admin/trees`.** The same
  `parseUrl`, the same Trail, the same 50-id limit, the same `?lang`; so `trailHref` (the
  up arrow), `followHref` (the Answer buttons), `withLang` (the language switch) and
  `centreOf` (10.9: an explanation Node's address renders its parent with the Overlay
  open) work in the editor unchanged, prefixed by the reuse rule (34.3). The prefix is
  `/admin/trees/` so that `new`, `account` and `accounts` -- valid Tree ids -- never
  collide with a Tree.
- **Logout is a button**, `POST /admin/api/logout`, after which the script goes to `/admin`.
  No `/admin/logout` address: a `GET` changes nothing (20.6).
- **Every admin address sits under `[lang]`** by the rewrite of 4.4, which already covers
  every path. On the four Tree-less pages the segment resolves against the chrome
  languages as 23.2 resolves the public overview's (`nl` gives Dutch, anything else
  English); in the editor it resolves against the draft's declared languages as the Node
  page's does (4.3, 4.4). The content language of the editor is **the language being
  edited** (28.2); `<html lang>` is it; the chrome follows it by 3.1.

### 24.2 Without a session, without a role, without JavaScript

| Case | Answer |
|---|---|
| Any admin page, no session | The **login page (25.1) rendered at that address**, 200, `noindex` (20.9). The login script reloads the same address on 204. No `?next=`, no redirect: nothing to validate. |
| `/admin/api/...`, no session | 401 (22.1). |
| An editor address of a Tree the caller has no role on; `/admin/accounts` for a non-administrator | The **403 page**: `forbiddenTitle`, `forbiddenText`, a link to `/admin`, status 403, in the chrome language. Never the login page, never a 404 (21.3). |
| An editor address whose Tree exists but whose path is not a Node of the draft | The 404 page of 4.3, status 404, for a caller with a role. |
| A reserved or unknown Tree id under `/admin/trees/` | 403 for a caller without the administrator flag (21.3: the admin area does not say which ids exist); 404 for the administrator. |
| Any admin page, JavaScript disabled | The page's markup, and in place of its first control one sentence in a `<noscript>`: `needsJavaScript`. **The admin area needs JavaScript**: its every action is a JSON request (22.1, 20.6). Section 14's guarantee is the public pages' and is unchanged. |

**[#135] As built.** The 403 page answers through Next.js's `forbidden()` (the framework's
`experimental.authInterrupts` flag), which renders `src/app/[lang]/forbidden.tsx` with status
403; it is the login page's card holding `forbiddenTitle`, `forbiddenText` and a link to
`/admin`, not the 404 page's Bubble, which overflowed the window at 390 pixels.
`/admin/trees/<tree-id>/...` renders the login page without a session and, with one, the 404
page until the editor (#138) replaces its file; the 403 and 404 rows above that need a role
are #136's `permit`. `/admin/new` does not exist until #137.

### 24.3 The chrome bar and the Theme, per page

| Page | Left | Right | Theme |
|---|---|---|---|
| Public Node page | The Tree's logo or title; **[#195]** (2026-10-03) then the mention of its Authors, between the mark and the controls (39.4) | language switch, share button | The published Tree's |
| Public overview `/` | `siteTitle` as text | language switch | The default (13.4) |
| Login page | `siteTitle` | language switch | The default |
| Creators' overview, `/admin/new`, `/admin/account`, `/admin/accounts` | `siteTitle` | language switch, ~~the caller's name (a link to `/admin/account`)~~ **[#176]** `account` ("Account"), a link to `/admin/account` whose description and tooltip is the caller's name, `accounts` (administrator only, a link), `logout` | The default |
| The editor | The draft's logo or title, as the public page | language switch (28.2), the autosave indicator (29.3), ~~the panel button (33.1), the caller's name~~ **[#176]** `account` as above, `logout`. **No share button.** **[#176]** The to-do control and the panel's button float under the bar, not in it (33.1, 33.3). | **The draft's**; **[#180]** on the Tree only: the bar, the floating controls and every editor Sheet the default (13.4) |
| The 404 and 403 pages | `siteTitle` | language switch | The default |

**[#135]** Below 480 pixels wide the Tree-less admin pages' bar gives up `siteTitle` and the
current language's pill (not a link, and the language on screen) so that the switch, the
name, `accounts` and `logout` fit 320 pixels; the name is cut with an ellipsis where it does
not fit and carries `data-clamp`, which `admin-no-scroll.spec.ts` reads as the overview's
walk reads a tile's title (26.1).

**[#176], changed by the owner -- 2026-10-02** (#169: "next to it it says adminstrator, make it
say 'Account' or at least make it say what it is"). On every admin page with a session -- the
creators' overview, `/admin/new`, `/admin/account`, `/admin/accounts` and the editor -- the link
to the account page says `account`, "Account" in English and in Dutch, and carries the caller's
name as its `title`: its tooltip, and its accessible description. `accounts` and `logout` stay.
The name is not in the bar any more, so nothing there is cut: the link carries no `data-clamp`.
Recorded in `docs/adrs/ADR-176-floating-settings-and-to-do.md`.

**[#180], changed by the owner -- 2026-10-02** (#169: "Changing the color features are great,
but don't make it change the sidebar or header colors, that makes it very difficult to follow
the UI."). In the editor the draft's Theme paints the Tree -- what a visitor will see: the page
behind the Bubble, the Bubble, the Option and Answer buttons, the Overlay, the pictures' strip
-- and not the editor's own interface: the chrome bar, the floating controls with the panel and
the to-do bubble they open, and the panel of every editor Sheet keep the default of 13.4
whatever the creator picks (13.1, amended). The bar's logo stays the Tree's, in the variant for
the default's light bar: `logo.light`. The public page is unchanged: there the whole page is the
Tree's Theme. Recorded in `docs/adrs/ADR-180-editor-interface-not-themed.md`.

**[#180], amended 2026-10-03, after #177 and #178 merged first.** What the editor puts in the Tree
itself is drawn as the Tree is: the fields; the Sheets' own buttons in the Bubble and its rows;
#177's side-bubble `+` in the fan, which opens no Sheet; `deleteSideBubble` at the foot of an
Overlay, with the confirmation it asks there in place (30.7); and #178's red cross and "Tree does
not end here after all" beside the up arrow (30.8). The question the cross asks is a panel hung
over the Sheets' veil, as the step menu's Sheet was, and keeps the default look: the editor's
own, like the panel of every editor Sheet. Recorded in decision 1 of the same ADR.

The disclaimer footer stands on every page. **Every page emits its own Theme, once**, through
one server component `ThemeStyle`; the root layout emits none (13.1, amended). `<html lang>`
is the content language on a Node page and in the editor, the chrome language on every other
page; the mechanism by which the root layout learns it with many Trees is #134's inside this
contract (`ADR-133-admin-routes.md`, decision 6), recorded as an amendment there.

## 25. The login page, the account page and the accounts page

**[#133], new -- 2026-09-26.** Recorded in `docs/adrs/ADR-133-login-and-account-pages.md`.
All three pages are in the default Theme; the document never scrolls (10.6).

### 25.1 The login page

One centred card, 360 pixels wide, `surface` on the page's `background`, outlined in the
`rule` shade: the heading `signIn`; a text field `login` (`autocomplete="username"`); a
password field `password` (`autocomplete="current-password"`); one button `signIn` in the
Answer buttons' style; one error line with `role="alert"`; under the card the sentence
`loginHelp` ("Ask your administrator for an account or a new password").

```
+------------------------------------------------------------------+ 44   chrome bar
| ELSA decision trees                                  [language]  |
+------------------------------------------------------------------+
|                  +----------------------------+                  |
|                  |  Sign in                   |                  |
|                  |  Name      [____________]  |                  |
|                  |  Password  [____________]  |                  |
|                  |  [        Sign in        ] |                  |
|                  |  Wrong name or password.   |  <- 401          |
|                  +----------------------------+                  |
|            Ask your administrator for an account ...             |
+------------------------------------------------------------------+ 28   disclaimer
```

| Response of `POST /admin/api/login` | Shown |
|---|---|
| 204 | The current address is reloaded (24.2). **[#162]** First `GET /admin/api/me` asks whether the browser kept the cookie; a 401 there shows `sessionNotKept` instead of the reload, because a browser that blocks cookies, or is sent a `Secure` one at a plain-`http://` address (20.4), drops it, and the reload would show the form again with nothing said. Not in the session Sheet (29.6): the editor it opens in was reached with a kept cookie. |
| 401 | `loginFailed` -- one string for a wrong name **and** a wrong password (20.7). The password field is cleared; the name is kept. |
| 429 | `loginLocked` ("Too many attempts. Try again in a few minutes."). |
| network failure, 5xx | `requestFailed`. |

The form is one client component, `LoginForm` (`src/editor/LoginForm.tsx`), which the
editor also mounts in a Sheet when a session expires (29.6). It sends
`application/json`; a `<noscript>` shows `needsJavaScript` in its place (24.2).

**Amended 2026-10-03 (#195, the owner's #194):** the text field is `email` -- "E-mail address" /
"E-mailadres" -- `type="email"` with `autocomplete="username"`, in a form marked `noValidate`,
sent as `{ email, password }`; the drawing's "Name" reads "E-mail address". `loginFailed` says
"Wrong e-mail address or password." -- one string for a wrong address and a wrong password --
the address is kept and the password cleared, and `sessionNotKept` opens "Your e-mail address and
password are right" (38.1, 38.5; 3.2's #196 row).

### 25.2 The account page, `/admin/account`

Any logged-in account. Two cards of 25.1's shape: **`yourName`** -- one field, 1 to 80
characters with a live counter (20.1), `save` → `PATCH /admin/api/accounts/<own id> { name }`;
**`changePassword`** -- `currentPassword`, `newPassword`, `repeatPassword` (12 to 256; equal,
checked before sending: `passwordsDiffer`), `save` → `{ password, currentPassword }`. A 422 at
its field; a 403 → `wrongPassword` at the current password. Under the button the sentence
`sessionsEnded` (20.4: every other session of the account ends).

**Amended 2026-10-03 (#195):** the password card shows `signedInWith(email)` -- or `noEmail` --
above its fields and `emailHelp` under it, and its hidden `username` field holds the address; an
address is changed by the administrator only (38.5). A name another account has is refused,
`name-taken` (38.6). Under the name field, on every account's page but the administrator's,
`nameShownPublicly` (39.8).

### 25.3 The accounts page, `/admin/accounts`

The administrator only (the 403 page for anyone else). A button `newAccount` above a list in
a **scroll box** (26.3) with one row per account: name, login, `active` / `deactivated`,
`administrator` on the one; per row, for every account but the administrator's: `deactivate`
/ `reactivate` (`PATCH { active }`) and `setPassword` (a Sheet with one field, `PATCH {
password }`). `newAccount` opens a Sheet with `name`, `login`, `password` and `create` (`POST
/admin/api/accounts`); a 422 at its field. Nothing is deleted (20.1); no hash, token or
session is shown, because no route answers one.

**Amended 2026-10-03 (#195):** each row shows the address where it showed the login -- one line
cut with an ellipsis, the whole address its `title` -- or `noEmail`; every row gains `setEmail`,
the administrator's own row's only action; the new-account Sheet asks for `displayName`, `email`
and `password`; `setPassword`'s Sheet names the account by its name (38.5).

## 26. The overview: tiles, the + tile, which Trees

**[#133], new -- 2026-09-26.** 23.2 gave the public overview its list, its order and its
head; this section gives it its look, and the creators' overview its additions. Recorded in
`docs/adrs/ADR-133-overview-tiles.md`; confirms core document 3.4's PROPOSED reading of
which Trees a creator sees.

### 26.1 The tile

280 x 160 pixels, one link to the Tree's root Node in the page's language or the Tree's
default (23.2), `surface` outlined in the `rule` shade with 8-pixel corners and a wash of
`accent` on hover (the Option button's look, 10.3, at a larger size). Top to bottom: the
Tree's **logo** when its Theme names one, at most 40 pixels tall; the **title** in the
page's language when declared, else in the default language with `lang` on the tile
(23.2), 18 pixels bold on 24-pixel lines, at most two lines; the **description** -- the
manifest's, through `plainDescription(...).cut` (16.3), at most 155 characters -- 14 pixels
on 20-pixel lines, at most three lines, or nothing; the **languages** as upper-case tags.
Every tile is drawn in **the page's Theme** (the default): the logo is the identity, not the
palette.

**Amended 2026-10-03 (#195, the owner's #194):** the bottom row of language tags also holds the
mention of the Tree's Authors, after the tags and before the creators' state mark (26.4), at the
tags' type: one line, cut where its room ends and not drawn under 80 pixels, taking no pixel
from the tags or the mark. The tile's size and its other rows stand (39.5).

### 26.2 The grid

One box between the chrome bar and the disclaimer, padded 24, columns 280 wide with 20-pixel
gaps, as many as fit (`auto-fill`), never fewer than one; tiles left-aligned. At 1280 x 640:
four columns (1180 of 1232) and three rows (520 of 520): twelve tiles in view; the
thirteenth is below the fold **of the box**.

```
+------------------------------------------------------------------------------+ 44
| ELSA decision trees                          [language] Anna  Accounts  Log out|
+------------------------------------------------------------------------------+
|  +-----------+  +-----------+  +-----------+  +-----------+                  |
|  |    +      |  | [logo]    |  | Title     |  | [logo]    |                  |
|  |           |  | Title     |  | Descr...  |  | Title     |    the box       |
|  | New tree  |  | Descr...  |  | EN        |  | Descr...  |    scrolls;      |
|  |           |  | EN NL  o  |  |  hidden   |  | EN NL  o  |    the page      |
|  +-----------+  +-----------+  +-----------+  +-----------+    never does    |
|  +-----------+  +-----------+                                                |
|  | ...       |  | ...       |                                                |
+------------------------------------------------------------------------------+ 28
|                        This tool is not legal advice.                        |
+------------------------------------------------------------------------------+
```

### 26.3 The scroll box: the second exemption of 10.6

The grid's box is marked `data-scroll-box` and **scrolls vertically inside its own bounds**;
the document never scrolls. It is a native scroll container (no script, keyboard-reachable).
`no-scroll.spec.ts`'s element walk skips `[data-scroll-box]` as it skips
`[data-carousel-strip]`. The attribute is carried by exactly ~~four~~ **[#176]** five things, the ones the
format does not bound: this grid, the accounts list (25.3), the new-Tree form (27.1) and the
body of the top panel (33.2); **[#176] amended 2026-10-02**, and the body of the to-do bubble
(33.3), which holds the to-do list that left the panel's body. Nothing else may carry it: the Bubble, an Overlay, every other
Sheet holds what the format bounds and fits or is a defect.

### 26.4 The creators' overview, `/admin`

The same page with three additions:

- **The + tile**, first, top left: the tile's box outlined dashed in `rule`, a 48-pixel `+`
  in `accent-secondary`, the words `newTree`; a link to `/admin/new`.
- **A state mark** in every other tile's bottom right corner: a dot and `published` (in
  `accent-secondary`) or `hidden` (`text-muted`); on a published Tree that is not servable
  (18.3), `notServable` in `danger` and the tile links to the editor, where the panel lists
  the violations.
- **The link**: a tile the caller has a role on (21.1) goes to `/admin/trees/<id>/<root>` in
  the page's language; a tile with no role goes to the public page as on `/`.

**Which Trees, and in what order** (core document 3.4, confirmed): every published Tree,
plus every hidden Tree the caller is creator of or collaborator on; the administrator sees
every Tree. Two groups, each in `id` order (23.2's rule inside each): first the Trees the
caller has a role on (`store.drafts.list(by)`), then every other published Tree
(`store.publishedIds()` less the first group). The public overview has one group. Zero
Trees: `noTrees` on `/`; the + tile alone on `/admin`.

## 27. Creating a Tree

**[#133], new -- 2026-09-26.** Recorded in `docs/adrs/ADR-133-new-tree-form.md`.

### 27.1 The form, `/admin/new`

**[#168], changed by the owner -- 2026-10-02**: the form was too hard to read for the core
audience. It now holds **the title, the languages and `create`**, in that order, each a
label over its control, with no sentence of explanation: one field labelled `title` while
the Tree has one language, and one more per language added, labelled by its tag -- because
**as built, nothing edits a Tree's title after creation** (33.5's title field is not in the
panel) and a declared language without a title keeps the Tree from being published (19.3).
The default language's title is required: an empty form sends nothing. The creator is
**never asked for the address**: it is the default language's title's (`treeIdOf` in
`src/editor/slug.ts`: the proposal below, with accents folded to their letters, `tree` when
nothing is left), and an address the route refuses -- taken, or a reserved word -- is
followed by `-2`, `-3`, ... until one is created (at most 20 tries). The id still never
changes after creation (ADR-133-new-tree-form decision 2); the form no longer says so.
Struck below is what this replaces.

One card of 520 pixels in a scroll box (26.3), holding in this order:

| Field | Contract |
|---|---|
| ~~`treeId`~~ **[#168]** removed | ~~The id grammar of `tree-format.md` 3.1, with `treeIdHint` under it and the address the Tree will have (`/<id>/start`) shown live. **Proposed by the script from the first title typed** (lower-cased, every run outside `[a-z0-9]` → one hyphen, trimmed, cut to 64) until the creator edits the field. Under it, `treeIdFixed`: **the id never changes after creation** -- it is the folder name (17.2) and is in every URL and share link (4.1). No rename exists on any route.~~ |
| `languages` | A row of tags with a field to add one (the tag grammar of 3.3, checked in the script); `en` and `nl` as one-click buttons; a `remove` cross on every tag but the last; `makeDefault` on every tag but the first. **The first tag is the default language** (3.3), marked `default`. Opens with the page's chrome language as its one tag. ~~`languagesFixed`: the languages cannot be changed after creation in this round (#147, `proposed`).~~ **[#147]** `languagesLater`: languages can be added or removed later, in the top panel (33.5). The control is `src/editor/LanguageTags.tsx`, shared with the panel. **[#168]** No `languagesLater` under it. |
| `title`, per language | One field per tag in tag order, labelled by the tag (**[#168]** labelled `title` alone while there is one tag, and placed first), with the 80-character counter of 28.4 (**[#168]** beside the label). May be left empty in a language other than the default: then V-L10N's to-do (19.2). **[#168]** The default's is required. |
| `create` | One button in the Answer buttons' style. |

The Tree's **description** is not here: it is a manifest field edited in the top panel
(33.5). Nothing else is asked.

### 27.2 What happens

`POST /admin/api/trees { id, languages, title }` (22.1). 201 → the script goes to
`/admin/trees/<id>/start` in the page's language when declared, else the Tree's default:
the editor on the empty root Node (28), which is hidden until published (19). Errors at the
field: ~~409 → `treeIdTaken`; 422 for a reserved word (`images`, `theme`, `schemas`, `admin`)
→ `treeIdReserved`;~~ **[#168]** 409 and 422 for a reserved word → the next address is tried
(27.1); 422 for a malformed tag → `languageHint` in `danger` at the languages (the script checks
the grammar before sending); anything else → `requestFailed` under the button. Nothing is
created on an error; the fields keep their values.

## 28. The editor: the Bubble edited in place

**[#133], new -- 2026-09-26.** The editor is the tree view of section 10, rendered by the
same components through the reuse rule (34), on the draft (19), with every field an
editable region where the end user sees it. Recorded in
`docs/adrs/ADR-133-bubble-edited-in-place.md`.

### 28.1 The fields

Each is rendered by the client component `Field` through the `field` slot (34.2), with the
path of 22.2 and the limit of 5.7:

| Where | Field | Path | Limit |
|---|---|---|---|
| The heading | title | `title.<lang>` | 80, plain |
| The text | description | `description.<lang>` | 150 and 2 lines, rich (28.5) |
| Each Source's line | label | `sources[i].label.<lang>` | 60, plain |
| A Source's `...` Sheet | kind (a select), URL, `removeSource` | `sources[i].kind`, `sources[i].url` | -- |
| After the last Source | `+ addSource` (absent at 3): a Sheet holding the kind and the URL, the URL focused | `add-source` with an empty label, the kind chosen and the URL typed; **[#138] as built**, nothing is sent before a URL of the schema's grammar is typed, because the schema requires one and a made-up address would be silent content | -- |
| The rim of a Terminal | outcome, a select drawn as the badge | `terminal.outcome` | -- |
| **[#171]** The rim of a Terminal, in place of the row above | the ending's words, a plain field drawn as the badge (36.3) | `terminal.label.<lang>` | 19, plain |
| An Option button | the Option's title | `options[i].title.<lang>` | 60, plain |
| The enlarged view | an Image's description, credit | `images[i].description.<lang>`, `images[i].credit` | 120, 120 (31.3) |
| The explainer Sheet | term, text | `explainers[i].term.<lang>`, `explainers[i].text.<lang>` | 40, 200 (32.2) |
| The top panel | the Tree's title, description | `title.<lang>`, `description.<lang>` on the manifest | 80; 600 and 8 lines (33.5) |

A plain field is one line: Enter blurs it, a pasted line break becomes a space (V-PLAIN is
blocking). A region is the box the public text takes, outlined 1 pixel in `rule` inside the
box on hover and focus only. **[#138] As built**: a Source's `...` and `+ addSource` are
Sheets of their own `<details name>` group, because the group is exclusive across nesting:
opened inside an Overlay's Interior, they leave the Overlay open.

```
+--------------------------------------------------------------------------------+ 44
| [logo] AI Act (draft)   [language] Saved · Title: 93 of 80   Tree: Hidden (3)  Anna  Log out |
+--------------------------------------------------------------------------------+
|                          (o)  [ ^ ]  (...)                          56         |  badge left, step menu right of the arrow
|                       .----'         '----.                                    |
|   +--------+     .-'     [ + picture ]      '-.     +--------+                 |
|   |( ) Opt |----'      ___________________     '----|  +     |    <- side +    |
|   +--------+          |Title being typed_ |   93/80 |  New   |    <- counter   |
|                       (   Description ...  )         side    |       pill on   |
|                       ( [providers](#provi )  nl -   bubble  |       the rim   |
|                       (   LEGAL SOURCES     )        +--------+    <- missing- |
|                        '.  Art 2  [+ add]  .'                        language  |
|                          '----(o)(o)(+)---'          <- strip with its +       |
+--------------------------------------------------------------------------------+
|   [ + Yes            ]  [ Tree ends here ]  [ + No             ]               |  68  three outlined buttons (30.2)
+--------------------------------------------------------------------------------+
|                    This tool is not legal advice.                              |  28
+--------------------------------------------------------------------------------+
```

**Amended 2026-10-02 (#178, the owner in #169):** the band above the Bubble holds no step menu
`(...)`. On a step that ends the tree, under a Trail, at 1280 x 640, it holds beside the up arrow
"Tree does not end here after all" and the red cross, and at its right #176's floating controls
(33.1, 33.3); the badge stays in the rim below (10.1). Below 1000 pixels wide the cross stands
right of the arrow (30.8, amended):

```
+--------------------------------------------------------------------------------+ 44
| [Tree does not end here after all] (x) ( ^ )           (3) to do  (*) Settings |  56  the step's two buttons beside the arrow; the floating controls (33.1), abbreviated
|                     .----'  ( DOES NOT APPLY )   '----.                        |      the badge in the rim (10.1)
```

### 28.2 One language at a time

The chrome bar's `LanguageSwitch` (unchanged) lists the draft's declared languages; the
page's language (4.1) is the one every field edits and saves under. A field with no text in
that language is an empty region showing `missingText` as a placeholder in `text-muted`,
never saved as such.

**Amended 2026-10-02 (#172, by the owner, #169):** "The placeholder texts say 'Text missing
in this language', I want it to say what belongs in the respective field like (title,
content)." An empty field's placeholder names what belongs in it, in the chrome language:
the Node's title `placeholderTitle` ("Title"), its description `placeholderText` ("Text"), a
Source's label and link, an Option's title, an Image's description and credit, an
explainer's term and explanation, the logo's alternative text (the `placeholder*` keys of
`src/chrome.ts`). No field shows `missingText` any more; whether a language still lacks a
text stays where it was, on the rim's tags (28.3) and in the to-do list (33.3).

### 28.3 The rim: the counter and the missing languages

While a field has the focus the **right rim** (60 pixels, 10.1) shows at the field's height a
**counter pill** (`n / max`; for the description also `lines / 2`) and under it one **tag per
other declared language that has no text for this field**, each a `withLang` link to the
same page in that language. Nothing on the rim takes a pixel from the text area (10.1). The
Overlay's Interior has the same rim (its 60-pixel sides, 10.9).

### 28.4 The limits, live

`n` is `countedLength` and `lines` is `estimatedLines` of `tree-format.md` 3.8, computed in
the browser by **the validator's own functions**, which move to `src/tree/measure.ts`
(pure; `validate.ts` re-exports them). **Typing never stops at a limit.** Over it: the pill
and the region's outline turn `danger`, the write goes and is stored (22.3: 200 with
V-LENGTH or V-LINES), the validator's message ("Title: 93 of 80 characters") is shown in the
autosave indicator (29.3) while the field is focused or was last edited, and in the panel's
to-do list (33.3). Publish is the wall (19.3). A description past two estimated lines is
therefore **stored and marked, never refused**: a field is refused (422, 29.4) only by a
blocking rule -- V-HTML, V-PLAIN, the schema -- and V-LENGTH and V-LINES are the advisories
the write carries back.

**Amended 2026-10-02 (#172, by the owner, #169):** "make sure the input boxes are nicely
sized for what will come inside of them, so they fit nicely inside the bubble the way they
should and the don't grow on inputs, they should just stop at the cap." **Typing stops at a
limit.** A field accepts no character beyond its maximum, measured as above (`countedLength`;
for the description also `estimatedLines`) with one difference: the cap also counts the
whitespace at the start and the end of the text, which 3.8 trims and the pill does not
count, so that a space typed at the limit does nothing instead of going in and being stored
(`cappedLength`). A further key does nothing, and a paste is cut after the last whole
character that fits -- a character of several code points (3.8) is kept whole or not at all
(`capped` in `src/editor/fields.ts`). The counter pill stays and shows where the creator is.
A text that is **already** over its limit by either measure -- stored before this
amendment, or by another route (a hand-made file, the API) -- is shown whole and marked as
above; an edit of it is taken only if it is within the limit by both measures or no longer
than before by either, so it can be shortened and cannot be lengthened. The store is
unchanged: a write over a limit is still stored with its advisory (22.3), so the paragraph
above still describes what the server does; only the field no longer sends one. The attach
Sheet's credit and description (31.2) and the logo's alternative text (33.8) stop at their
120, 120 and 80 alike. Recorded in `docs/adrs/ADR-172-typing-stops-at-the-limit.md`, which
supersedes ADR-133 decision 5.
And each field's box has, empty and filled, the size its text takes at the limit where it is
drawn, in lines of its own line height: the title and the description two (5.7), and three
below 480 pixels wide, where a text at its limit takes three; an Option's title three, the
lines 5.7 gives its 60 characters in a humanist face (the button holds four, but a box of
four would start under the `...` in its corner); an Image's description and credit in the
enlarged view, 120 each (31.3), two, and three below 480 pixels; an explainer's explanation,
a plain field of 200 (32.2), five, and seven below 480 pixels, and its term one, two below
480 pixels; every other field one, a Source's label as wide as its 60 characters. So the box
neither grows nor shrinks while the creator types, and it stays inside its parent: the
Bubble's text area, the Overlay, the Option button or the Sheet. A text stored over its limit
is shown whole: its box grows past these lines to hold it.

**Amended 2026-10-02 (#175):** beside the Bubble, where the Option button's label is now 120
pixels at 15 on 18-pixel lines (10.3 and 10.7, amended the same day), an Option title's box
is **five** lines, 90 pixels of the button's 100: the lines 10.7 measures 60 characters take
there, hyphenated in the page's language. Set into the field itself at 1280 x 640, in Open
Sans, Verdana and Arial, the 146 Option titles 10.7 measures take the same lines as there, so
the box stays 90, and the text area holds every one. In the straight columns and the row below 1280 (10.5, steps 2 and 3),
where the label is still 176 pixels at 16 on 20, the box stays **three**. A box of five does
start under the `...` of the Option's link menu (30.6): the menu's 24 x 24 in the button's
outer top corner lies over the box's outer top corner, 14 pixels wide and 19 high, where a
first line that runs the label's full width ends. Issue #178 takes the `...` off the
side-bubble buttons (**[#178]** taken off, 2026-10-02: no Answer or Option button carries one,
30.6; the boxes keep their lines). Where the browser has no hyphenation dictionary for the page's language,
a title of long words can take six lines (10.7, amended), and its box grows to 108 with the
button: 10.3's known cost, in the editor too.

### 28.5 The description: source text

Blurred, the region shows the **rendered** text (`richTextToHtml` with the Node's explainers,
on the client after an edit, so marked terms look and hover as on the public page).
Focused, it shows the **source**: the subset of 3.4 as written -- `*emphasis*`, `**strong**`,
`- ` and `1. ` lists, `[text](https://...)`, `[term](#id)` -- Enter a line break, a blank line
a paragraph. **No toolbar, no WYSIWYG.** A pasted text is plain; `<` followed by a letter,
`/` or `!` is refused at the field with V-HTML's message before sending (blocking). The one
control is `mark` (32.1).

### 28.6 The no-scroll rule in the editor

Unchanged. Every control the editor adds is outside the text area: the counter and tags on
the rim; the violation and the save state in the chrome bar; **[#176]** the panel's button and the
to-do control under the bar at the top right, in the band beside the up arrow (33.1, 33.3); the structure buttons in the
Answer row (30.2); the side `+` in the fan's next free slot (30.5); the strip's `+` in the
strip band (31.1); the outcome select where the badge is (**[#171]** the ending's field,
36.3); the step menu on the rim above
(30.8) (**[#178]** the step's two buttons in the band above the Bubble, beside the up arrow, out
of the Bubble's box, and the cross's question in a panel over the Bubble while it is asked, 30.8,
amended); everything else in a Sheet. `tests/fixtures/full-node/` as a draft fits in the editor
as on the public page; `admin-no-scroll.spec.ts` measures it with every Sheet open (35.4).
Below the guarantee the editor gives things up in 10.5's order; a collapsed Sources block is
edited in its Sheet.

### 28.7 Not offered

A Node's `metadata` (19.6); a Source's `id` and an Image's `source`; the manifest's `root`;
~~the languages after creation (#147)~~ (**[#147]** in the top panel, 33.5); a step counter (5.8: text in the title); cropping or
resizing (31.8); a Theme (#144).

## 29. Autosave

**[#133], new -- 2026-09-26.** Recorded in `docs/adrs/ADR-133-autosave.md`.

### 29.1 When

A field is written **600 ms after the last keystroke** in it and **on blur**, when its value
differs from the last written or received; an operation at once. A write in flight is not
cancelled by a newer value; the newer value queues behind it.

### 29.2 One queue per page

Every write of the page -- field or operation, the Node's, an Overlay's, the manifest's --
goes through one client queue, one request in flight, in order; `revision` (22.3) rises
monotonically as seen from the page. The queue is the `Editor` provider's (34.4).

### 29.3 The indicator

In the chrome bar between the language switch and ~~the panel button~~ **[#176]** the link to the account page (the panel's button left the bar, 33.1), a `role="status"` region
of at most 320 pixels:

| State | Shown |
|---|---|
| queue non-empty | `saving` |
| queue drained | `saved`, with the time for 5 seconds |
| a write refused or failed | `notSaved` in `danger`, with the reason (29.4, 29.5) |
| a field over its limit (28.4) | after the state word: the violation's message |
| a published Tree whose public copy is behind (19.4) | after the state word: `publicBehind` |
| a collaborator's value arrived (29.7) | `changedElsewhere` for 5 seconds |

Never a token, an account id or a request body.

### 29.4 Refused

| Answer | The editor |
|---|---|
| 422 (a blocking rule) | The region outlined `danger`, `notSaved` with the violation's message; **the value stays on screen**; not written again until it changes. Nothing is reverted. |
| 403, 404, 409 (role removed; Tree deleted; uneditable, 19.5) | `notEditable` with the reason; every region read-only; the panel links to `/admin`. |
| 401 | 29.6. |

### 29.5 Failed

A network failure or 5xx is retried after 5, 10, 20, 40, 60 seconds and every 60 after, the
indicator at `notSaved` and `retrying` with a `retry` button. While the queue holds a write
not yet accepted, leaving the page asks the browser's one `beforeunload` confirmation. The
queue is memory only; the indicator is what says so.

### 29.6 A session that expires

A 401 pauses the queue, keeps every value, and opens `LoginForm` (25.1) in a Sheet titled
`sessionExpired`, without a close cross (nothing else can be done; `/admin` is a link in it).
On 204 the Sheet closes and the queue resumes.

### 29.7 The response repaints; concurrency on screen

Every response's Node (and each in `also`) replaces the value of every region of those Nodes
**that does not have the focus and has no write queued**, and updates the rim's tags, the
counters, the Option and Answer titles. A region whose value changed from what the screen
showed -- another collaborator's write, 22.5 -- is outlined in `accent` for 5 seconds and
the indicator says `changedElsewhere`; the newer text wins and nothing asks. **No polling, no
push**: a collaborator's write is seen on this page's next write or a reload.

## 30. The structure

**[#133], new -- 2026-09-26.** Confirms core document 3.4's PROPOSED reading: "yes" and
"no" are the Answers, "tree ends here" the Terminal with its outcome, the side-bubble an
Option; nothing new enters `elsa-tree/4`. Recorded in `docs/adrs/ADR-133-structure-editing.md`.
**[#171]** No longer, since 2026-10-02 (the owner, #169): "tree ends here" makes the Terminal
with the ending's own words in place of an outcome, and the words enter the format, which
becomes `elsa-tree/5` (`tree-format.md` 5.5, 12.7; 30.3, 36), as core document 3.4 now says.

### 30.1 The three situations of a Node's Links, in the Answer row

| The draft Node has | The Answer row shows |
|---|---|
| no `answers`, no `terminal` (an explanation Node by 19.2, whatever its Options; the editor does not look for Options that point at it -- V-OPTIONS reports that case, advisory) | **Three outlined buttons** in the Answer buttons' style, `accent-secondary` outline on `surface`, 400 x 60 with 20-pixel gaps: `+ Yes`, `treeEndsHere`, `+ No`. The words alone below 480 pixels (10.3). |
| one Answer | The filled button for it (`Yes: <title>`, 620 x 60) and the outlined `+` for the other. |
| both Answers | The public row. |
| `terminal` | `startAgain`, as public; the badge on the rim is a select of the four outcomes (`terminal.outcome`). **[#171]** The badge on the rim is the ending's words as a field (`terminal.label.<lang>`, 36.3); no outcome is offered anywhere. |

**Amended 2026-10-02 (#178, the owner in #169):** no button of the row carries a `...`: the
filled button of one Answer and the two of the public row have no link menu (30.6). On a
`terminal`, "Tree does not end here after all" (`removeEnd`) stands in the band above the Bubble,
left of the up arrow (30.8), and gives the row the three outlined buttons back at once.

### 30.2 Creating an Answer target

`+ Yes` / `+ No` → `POST .../nodes { from: { node, link: 'yes' | 'no' } }` (22.1: the Node and
the Link in one write) → the editor **navigates** to `followHref` of the new Node: a plain
navigation, no slide (34.5). The new Node is empty (no title, no description, the three
buttons); its id is the server's (22.4), never proposed by the editor.

### 30.3 Ending

`treeEndsHere` opens a Sheet: the four outcomes as radio choices labelled with their badge
texts, `confirm` → `POST .../nodes { from: { node, link: 'end', outcome } }`. The page
repaints: the badge, `startAgain`. A Node with Options cannot end (V-TERMINAL, 422 shown in
the Sheet): remove the Options first. `removeEnd` is in the step menu (30.8).

**[#171] The Sheet asks for the ending's words instead** (2026-10-02; the owner, #169: "just
let the user enter a text to display on the button (with a wordcap obviously)"): one plain
field, `endingText`, in the page's language, its limit of 19 shown live; `confirm` →
`POST .../nodes { from: { node, link: 'end', label: { <lang>: <text> } } }`. 36.3 is the
contract; the rest of this section stands, and #178 replaces the step menu's `removeEnd`.

### 30.4 The side-bubble +

On a question Node and on an explanation Node shown as the centre, the fan (10.3) gets in
its **next free slot of the alternating order** a button of the Option button's size, dashed
`rule` outline, `+` where the picture is, `newSideBubble` where the title is; absent at
eight Options. It opens a Sheet: `createNew` (one field, the title in the page's language →
`POST .../nodes { from: { node, link: 'option' }, title }`: the Node and the Option with that
title in one write) or `linkExisting` (the picker, 30.6 → `add-option { target }`). After a
creation the editor navigates to **the aside's address under this page**,
`<path>/<new id>`, which by 10.9 renders this page with the new Overlay open.

**Amended 2026-10-02 (#175, the owner in #169):** in the fan the `+` button is the Option
button's **236 x 100** (10.3, amended the same day), its `+` in a slot that fills the inner end
as an Option's picture does, the dashed outline drawn under it. **Eight is a cap no write
passes**, not only the number the fan draws: `add-option` and `POST .../nodes { from: { node,
link: 'option' } }` on a Node that has eight Options answer 22.3's 422 with `V-COUNT`
(`options`, "9 entries; at most 8") and store nothing -- before #175 they stored the ninth with
the advisory V-COUNT of 19.2. Re-pointing an Option at eight (30.6) removes before it adds and
still lands. A Tree file with nine, written by hand, stays V-COUNT's, as before.

**Amended 2026-10-02 (#177, by the owner, #169):** "The side bubble should just open the side
bubble, where the title and the text inputs, and the image can be entered, following the same
rules for input boxes as the main bubble." **One click on the `+` opens the side bubble.** The
button is the control, with no Sheet behind it, and keeps #175's shape (above): it sends `POST
.../nodes { from: { node, link: 'option' } }` with no title -- the Node and the Option in one
write, each titled `""` in every declared language (22.4) -- and navigates to `<path>/<new id>`
as before, where the new side bubble's Overlay is open with every field empty and named by its
placeholder (28.2); the title, the text, the picture and the Sources are entered there (30.5).
At eight Options there is no `+`, and that write, with no title as with one, is refused as
#175's amendment says. `createNew` and `linkExisting`
are no longer offered from the `+`: the `+` stops hanging an existing step under a Node as its
side bubble (core document 3.4, `[#169]`; `ADR-169-tree-creation-ui-round.md` decision 5). An
Option's link menu still does, when `changeTarget` re-points the Option with `add-option {
target }` (30.6); that menu goes with #178 (ADR-169 decision 5). `add-option { target }` stays
in the API (22.2). Recorded in `docs/adrs/ADR-177-side-bubble-editing.md`, which supersedes
ADR-133-structure-editing decision 5 and the `+ newSideBubble` of its decision 6.

### 30.5 An aside is edited in the Overlay

The Overlay's Interior (10.9) is rendered by the same component with the `edit` seam: its
title, description, Sources and main image are fields and slots as the centre's, with the rim
inside the panel. The **Option's own title** (`options[i].title.<lang>`) is edited on the
Option button. The Overlay's list of second-level Options stays plain links and gains a last
entry, `+ newSideBubble`, which creates a second-level Option and navigates to the deeper
address. The Overlay's heading link (10.9) leads to the aside's own page, where it gets a fan,
its own asides and its step menu. Nothing is edited in two places.

**Amended 2026-10-02 (#177, by the owner, #169):** "There is a 'new side bubble' button in the
side bubble pane, this does not belong there", and "Sources are for some reason not entereable
in the side bubble?"
- **No `+ newSideBubble` in an Overlay.** The second-level Options a Tree has are still listed
  and still open (10.9); the editor only stops offering to create one there. An aside opened as
  its own page (`/admin/trees/<t>/<aside id>`) is the centre, and its fan has the `+` (30.4).
- **The aside's own page is out of the Overlay's reach (an open point).** In the editor the
  Overlay's heading link leads to the same page, `/admin/trees/<t>/<the centre's path>/<aside
  id>`, which renders the centre with this Overlay open (10.9) -- not to the aside's own page
  the paragraph above names, as built before #177 too; a click in it is now the title field's
  (below); and the Overlay's `+` is gone. What leads to the aside's own page is then a line of
  the to-do list (33.3), while the aside still has something to do, or its address typed in the
  address bar. So, until the owner decides otherwise, two things cannot be done from the
  editor's UI for a side bubble with nothing left to do: giving it a side bubble of its own (a
  second-level side bubble), which the Overlay's `+` did before #177; and replacing or removing
  its picture once attached, which the Overlay has never offered (there the picture is a link
  to its file) and the aside's own page does as the centre's (31.3). #177's task 4 counted on
  reaching that page "through its heading link". #177 reports this and builds no way there.
- **The button's title follows the aside's.** The Option's title (60, on the button) and the
  aside's (80, in the Overlay) stay two fields of the format. While the creator types the
  aside's title, the Option button's title on the centre takes each new text cut to 60 whole
  characters (`cutTo`, measured as 28.4 measures), for as long as, when the editing began, it
  was empty or the aside's title so cut, and no write of the button's title was waiting in the
  queue (typed or followed, and not yet answered, 29.2). That last condition is there because
  the page holds the button's title as the last response left it (29.7): a write still waiting
  may be the creator's own words on the button, which the aside's title must not overwrite. So
  a title focused again while the button's write is still unanswered -- offline, or retrying
  (29.5) -- does not move the button. Words a creator has edited on the button stay as written.
  Once the two differ, either way, the button does not follow again unless its words are
  emptied, or made the title so cut, by hand. The two are two field writes of the one queue
  (29.2), flushed together on blur.
- **The fields are the Bubble's**: the same `Field`, so the placeholders, the box sizes and the
  stop at the limit of 28.2 and 28.4 (#172) hold in the Overlay as on the Bubble. A click in the
  title no longer follows the heading's link around it (10.9): that link reloaded the page, and
  the title could not be entered with the mouse.
- **The Sources are entered as the centre's (28.1)**: in the panel at and above the guarantee,
  and below it -- under 564 pixels of height or 792 of width, where step 6 of 10.5 hides every
  inline Sources block -- in their collapsed Sheet, as 28.6 has the Bubble's, of a `<details
  name>` group of its own (`sources-sheet`), so that it opens inside the Overlay without closing
  it and the Source Sheets it holds do not close it. Before, an editor's Overlay had no collapsed
  copy, and below those sizes its Sources -- their lines and `+ addSource` -- were on no part of
  the page: the owner's finding, reproduced on `dev` as of 2026-09-27 and as of 2026-10-02. The
  public Overlay is as it was: it has no collapsed copy, and below those sizes it shows no
  Sources (10.5's step 6 as built since #80).

### 30.6 Re-pointing: the link menu and the picker

Every Answer and Option button carries, in edit mode, a `...` control at its outer end
(`linkMenu`) opening a Sheet: `changeTarget` and `removeLink` (`remove-answer` /
`remove-option`). `changeTarget` opens **the picker**: every Node of the draft by its title in
the page's language in file order with its id in `text-muted`, the current Node excluded --
from `nodeIds()` and `getTitle` (5.1: ids and titles, never Nodes) -- and, for an Answer,
`createNew` above. Choosing → `set-answer { yes|no, target }`, or `add-option { target }`
after `remove-option`. **A target of the wrong kind is stored and reported** (V-ANSWERS,
V-OPTIONS advisory) at the button and in the to-do: the picker cannot know a kind from a
title and the editor reads no Node to find out. Two Answers may reach one Node; one aside
may hang under several Nodes; nothing is copied.

**Amended 2026-10-02 (#178, by the owner, #169):** "There are also some dots ... far out of the
next steps of the decisiontree, don't have that there, if a user wants to delete a tree step he
has to do it inside that tree step." **No Answer or Option button carries a `...`**, in the
centre or in an Overlay: the link menu, `changeTarget`, the picker with its `createNew`, and
`removeLink` (30.7) are gone, with their words (3.2) and their styles. So **the editor no longer
offers to point a button at an existing step**, which `changeTarget` did -- PROPOSED, as the
consequence of removing the control that carried it, which the owner did not name (core document
3.4, `[#169]`; `ADR-169-tree-creation-ui-round.md` decision 5). A Tree that already has two
buttons leading to one step keeps working: the editor draws it, follows it and publishes it as
before; it only stops offering to make one. `set-answer`, `add-option`, `remove-answer` and
`remove-option` stay in the editor's server interface (22.1, 22.2): the side bubble's delete
still sends `remove-option` (30.7); the editor sends the other three no more. The editor page no
longer builds the picker's index of every Node of the draft (`nodeIds()`, `getTitle`): the side
bubble's delete names its aside from the Node the page reads for its Overlay (34.7). Recorded in
`docs/adrs/ADR-178-step-buttons.md`, which supersedes ADR-133-structure-editing decision 7.

### 30.7 Removing a Link

`removeLink` removes the Answer or the Option; **the target stays** in the draft.

**Amended 2026-10-02 (#177, by the owner, #169):** "there should be below in the middle a
'Delete side-bubble' button, which deletes the one that is opened." The Overlay of each of the
centre's Options ends, at the foot of its panel and in its middle, with `deleteSideBubble`,
outlined in `danger` (the `sideDelete` slot, 34.2). It asks once, in place, naming the side
bubble's title as it stands then (`confirmDeleteSideBubble`, or `confirmDeleteUntitledSideBubble`
before it has one), the focus on `cancel`; `confirm` then
- deletes the aside's Node -- `DELETE .../nodes/<aside id>` (22.4), which removes this step's
  Option, and every other Link to it, in the same write -- when no other Node leads to it;
- removes only this step's Option -- `remove-option { target }` -- when another Node leads to the
  aside as well, which the confirmation says (`sideBubbleStays`); the aside stays there. The page
  knows it from the draft's index, `Draft.referrers` (19.2): ids, never a Node read (34.7).

Then the editor goes to the step's own address: the Overlay closes, and the fan closes the gap.
What the aside led to stays in the draft, as for every deleted step (30.8, 30.9). The Overlay a
URL opens one level deeper (10.9) has no delete, its Option not being this step's; on the
first aside's own page it is that page's side bubble and has one. `removeLink` above is
unchanged by #177.

**Amended 2026-10-02 (#178, by the owner, #169):** "if a user wants to delete a tree step he has
to do it inside that tree step." `removeLink` is gone with the link menu (30.6). **A yes or a no**
goes with the step it leads to: the creator opens that step and uses its red cross (30.8), and
the delete removes the Answer from the step before in the same write (22.4), which shows its `+`
again (30.1). **A side bubble** goes with `deleteSideBubble` (above). What either led to stays in
the draft (30.9). Where `removeLink` took the Link alone and left its target, these take the
target too -- but for an aside another step leads to, which only loses this step's Option
(above) -- so where two Answers lead to one step, its cross takes both with it; the editor
removes neither alone any more.

### 30.8 The step menu: deleting a Node

In edit mode the rim above holds, in the half of the band **right** of the up arrow (the
badge has the left half, 10.1), a 24-pixel round `stepMenu` (`...`) opening a Sheet with the
step's id in `text-muted` and: `removeEnd` on a Terminal; `deleteStep` on every Node but the
root, then `confirmDelete` in place naming the step's title → `DELETE .../nodes/<n>` (22.4:
every Link to it goes in the same write; `also` says which Nodes lost one) → the editor goes
to the parent (`trailHref`) or, with no Trail, to the root. A delete removes **one step,
never a sub-tree**: what it led to stays.

**Amended 2026-10-02 (#178, by the owner, #169):** "Instead of the ... dots on the top right with
options, just make two buttons a red cross to delete the step, or if it applys, 'tree does not
end here after all'." **No step menu.** Two buttons stand in its place, in the band above the
Bubble, beside the up arrow, out of the Bubble's box (10.1):

- **The red cross**, `deleteStep`, on every step but the root: a round button outlined in
  `danger` with a cross in `danger`, filled `danger` under the pointer and while it asks, named
  "Delete this step" ("Deze stap verwijderen") for a screen reader and on hover, its `title`.
  One click asks, in place: a panel hung under the band, in the middle of the Bubble, over the
  Sheets' veil, says `confirmDelete` with the step's title as it stands then -- the last
  response's, so a title typed a moment before is the one named -- or, for a step without a
  title in the page's language, `confirmDeleteUntitled` ("Delete this step? It has no title yet.
  What it led to stays."), and offers `confirm` and `cancel`, the focus on `cancel`. Escape,
  `cancel` or a click on the veil keep the step and give the focus back to the cross; `confirm`
  deletes as above, and a refusal is said in the panel. The root has no cross (409 anyway).
- **"Tree does not end here after all"** (`removeEnd`, "Boom eindigt hier toch niet"), on a step
  that ends the tree only: outlined in `accent-secondary`, as `treeEndsHere` is, in the band's
  small type. It sends `remove-terminal` at once, as the menu's `removeEnd` did; the page repaints
  (29.7), the row offers the three buttons (30.1), and the button goes with the ending. A refusal
  -- a collaborator removed the ending first -- is said under it. A root that ends the tree has
  this button alone.
- **Where they stand.** The words left of the arrow, against it; the cross right of it, where the
  `...` stood, below 1000 pixels wide; from 1000, where #176's floating controls show their words
  in the band right of the arrow (33.1), left of it, between the arrow and the words. There the
  controls leave 46.5 pixels right of the arrow at 1000 x 700 in Dutch with three things to do
  (measured in Segoe UI), and a longer state word or count leaves fewer. On the
  arrow's middle, 32 tall, where the arrow stands above the outline; below 640 pixels of height,
  in the middle of the band, 24 tall in its 26 with the words on one line of 11 pixels, and 32
  tall in a phone's 40; below 480 pixels wide the words take two lines of 11 pixels. So at every
  viewport of 10.6 where the tree view shows, and on both sides of 1000 wide, 640 tall and 480
  wide, they cover no part of the up arrow, the Bubble, an Option button or the floating controls
  (`tests/browser/step-buttons.spec.ts`); at the floor the notice stands in for the tree view, and
  for them (10.4).
- **The step's id**, which the menu showed in `text-muted`, is dropped: it is in the page's
  address (4.1) and nowhere else on the screen.

Recorded in `docs/adrs/ADR-178-step-buttons.md`, which supersedes ADR-133-structure-editing
decision 8's step menu.

### 30.9 Orphans

A Node nothing reaches any more is V-REACH's advisory (19.2): listed in the panel's to-do
with a link to its editor page, where `deleteStep` is (**[#178]** its red cross, 30.8); **never
deleted by the editor on its own**. Publish refuses while one exists.

## 31. Images in the editor

**[#133], new -- 2026-09-26.** Recorded in `docs/adrs/ADR-133-images-in-the-editor.md`.

### 31.1 Two pickers

| Where | What |
|---|---|
| The **empty slot** of 10.3 | A button: `+`, `addPicture`, a file input accepting `image/png, image/jpeg, image/gif, image/webp`, a drop target for one file. The first upload is the main image (5.2). |
| The **strip's end** (or alone, on a Node with one Image) | A `+` thumbnail of 48 pixels, dashed outline, the same input and drop target; absent at ten Images. |

Dropping anywhere else does nothing.

**Amended 2026-10-02 (#174, by the owner in #169: "On the add a picture button, when
however [hovered], show 'Add an extra image'"):** the strip's `+` is a thumbnail of **67** pixels, as the
strip's are (12.2), its glyph 34 where it was 24. It is named `addExtraPicture`, "Add an
extra image" / "Extra afbeelding toevoegen", and on hover and on keyboard focus shows those
words as a small label beside it, out of the flow, in the band's third column: right of the
`+`, wrapping between words and never inside one; where that column leaves it less than 110
pixels right of the `+` -- beside a long strip on a narrower window (below 790 pixels wide
beside the widest strip), or beside the 20-pixel pill on a phone -- left of the `+` instead,
on one line, over the strip's end or the enlarged view's control. So from 480 pixels wide and
640 tall it never leaves the band (10.6). Below that the band is the pill's 20 pixels, and the
label, standing on its foot, rises above it over the Bubble: 2 pixels on one line, 18 on two.
Two lines reach 16 pixels into the text area below 480 wide, and 2 from 480. Out of the flow,
it moves nothing. Hidden, it takes no room. The label is not read twice (the name
says it) and takes no pointer. The empty slot keeps `addPicture`, "Add a picture", and its
tooltip.

### 31.2 Upload, then attach

`POST .../images` (multipart, 22.6) → 201 → the **attach Sheet**: the picture (through the
admin image route, 31.5), the server's file name, `credit` (120, plain, **required**: `attach`
is disabled while empty), `description` for the page's language (120, plain, optional now),
`attach` / `cancel`. `attach` → `add-image { file, credit, description }` through the queue;
the page repaints. `cancel` → `DELETE .../images/<file>` (a 409 is ignored). **Nothing is
attached without a credit** (core document 10.12, 10.26); the store's advisory for an empty
one (19.2) is never exercised by the editor.

**[#174]** Behind each field's label an **information hint** (`src/editor/Hint.tsx`): an "i"
in a 16-pixel circle, a button named `hint` ("Why this is asked") and described by its
explanation -- `creditHint` behind `credit`: the maker and the licence of a picture must be
named, for copyright reasons, and the credit is shown with the enlarged picture;
`imageDescriptionHint` behind `description`: a screen reader says it in place of the
picture, for people who cannot see it. Hovering it, focusing it or tapping it opens the
explanation in a small panel; leaving it, blur and Escape close it; one panel is open at a
time. It is the explainer's panel of 10.8 on another trigger (`usePanelTriggers` in
`src/components/Explainer.tsx`): placed inside the Sheet's panel, below the "i" where it fits
and above it otherwise, and its Escape closes the hint before the Sheet hears the key, so a
second Escape cancels the Sheet. Each row is a `<div>` holding the field's `<label for>` and
the hint, so the field is named by its label alone. Other editor screens take the same
component (the Theme panel, #180).

### 31.3 The enlarged view is the Image's editor

The Sheet of 12.3, with the two lines under the picture as fields (`images[i].description.<lang>`,
`images[i].credit`, counters and tags beside them) and four controls: `makeMain`
(`move-image` to 0; absent on the main image), `moveEarlier`, `moveLater` (absent at the
ends), `removeImage`. The slot and the strip repaint from the response.

**[#174]** The description's line is labelled as the credit's is, `imageDescription` before
the field, and the hint of 31.2 follows each label: the `field` slot answers
`images[i].credit` and `images[i].description` with the hint and the `Field` together. The
public enlarged view is unchanged.

### 31.4 Removing

`remove-image`, then best-effort `DELETE .../images/<file>` (409 while still referenced is
ignored; the store sweeps after a publish, 22.6). No confirmation.

### 31.5 A draft's pictures

In edit mode every `<img>` and enlarge link -- Bubble, strip, Overlay, Option buttons -- is
`links.image(treeId, file)` = `adminImageHref(treeId, file)` (34.3, 22.6). The public page is
untouched. When an Image is attached to, moved on or removed from the Node in an open
Overlay, the **Option button's picture** on the same page repaints from the response (10.29).

### 31.6 Errors, at the picker

413 → `fileTooLarge`; 415 → `fileTypeRefused`; 422 → its message; in the indicator, the
picker staying put. The tenth Image's `+` is absent, so V-COUNT is not asked for.

### 31.7 Width and height

The upload's `{ width, height }` feed the enlarged view's `<img width height>`; the strip's
48 x 48 and the main image's 3 : 2 box are the stylesheet's.

**[#140] As built**: the upload's `{ width, height }` are the attach Sheet's `<img width
height>`. The enlarged view's pictures are drawn from the Node, and an Image entry of the
format carries no size (`tree-format.md` 5.2), so after the attach its `<img>` has none, as
on the public page.

**Amended 2026-10-02 (#174):** the strip's are 67 x 67.

### 31.8 Not offered

Cropping, resizing, rotating; an Image's `source` pointer; a picture on an Option (5.4); the
Theme's logo (#144).

## 32. Explainers in the editor

**[#133], new -- 2026-09-26.** Recorded in `docs/adrs/ADR-133-explainers-in-the-editor.md`.
The format is 5.9: at most eight per Node, `term` 40, `text` 200, per language; every
explainer marked in every language (V-EXPLAINER) and every mark naming one (V-MARK), both
advisory in a draft. **The title carries no mark** (3.4; confirmed).

### 32.1 Marking

While the description is focused (source state, 28.5) and a selection lies inside it, the
right rim shows under the counter pill one button, `mark`. Pressing it: derives the id from
the selection (the slug of 27.1, cut to 64, `-2`, `-3` while taken on this Node); queues
`add-explainer { id, term: { <lang>: <selection> }, text: { <lang>: '' } }`; replaces the
selection by `[<selection>](#<id>)` and queues the description write; opens the explainer
Sheet with `text` focused. Disabled with `cannotMarkHere` for a selection over a line break,
inside `*emphasis*` or `**strong**`, or inside a mark; with `explainerLimit` at eight.

### 32.2 The explainer Sheet

Titled by the explainer's `term` in the page's language (or its id while empty). Per declared
language, in manifest order, the page's first: `term` (40, plain), `text` (200, plain), each
with its counter inside the Sheet -- every language of one explainer in one place. Per
language, `markedIn` / `notMarkedIn` from V-EXPLAINER's advisory. Under the fields: `unmark`.

### 32.3 A marked term in the editor

Rendered state: bold in `accent-secondary`, the panel on hover and focus as 10.8 (the same
`Explainer` component); a **click** or Enter opens the explainer Sheet (the one change of
edit mode on that element, a prop only the editor sets). Source state: the syntax, editable
by hand; a mark to no explainer is V-MARK's advisory, kept as written (19.2).

### 32.4 Unmarking

`unmark` replaces every `[text](#<id>)` of that id in **the page's language's** description
by its text and writes it; when no declared language's description marks the id any more,
`remove-explainer { id }`; otherwise the explainer stays and V-EXPLAINER reports it until
marked again or unmarked everywhere. Deleting the syntax by hand does the same to the
description and nothing to the explainer (then the to-do, with `remove` beside it). The id
is stable and shown only in the source and the Sheet's title while the term is empty.

## 33. The top panel

**[#133], new -- 2026-09-26.** Recorded in `docs/adrs/ADR-133-top-panel.md`.

### 33.1 The button

~~Top right of the editor's chrome bar, before the caller's name: a dot and the Tree's state --
`hidden` (`text-muted`), `published` (`accent-secondary`), `published` + `notServable`
(`danger`, 18.3), `published` + `publicBehind` (`accent`, 19.4) -- and the to-do count in
brackets when not zero: "Hidden (3)".~~ From `GET /admin/api/trees/<t>` at load and every write
response's `tree` afterwards (22.3).

**[#176], changed by the owner -- 2026-10-02** (#169: "The UI names of the top right buttons
don't make sense at all: Why does it say hidden? Say what opens when that button is clicked,
'Decision-tree settings'", and "I also want the 'Decision-tree settings' button to be a hover
top right, but not in the header bar"). Recorded in
`docs/adrs/ADR-176-floating-settings-and-to-do.md`; struck above is what this replaces.

- **Out of the bar, over the page.** The button floats under the chrome bar at the top right of
  the editor's page, with the to-do control of 33.3 to its left: 32 pixels tall, 10 under the
  bar and 16 from the right edge, which at the guarantee is the band beside the up arrow, the
  arrow's middle its own (where a taller window gives the Bubble more room above it, the arrow
  stands lower and the controls stay under the bar). It is in
  no row of 10.1 and not in the bar's `header`: a fixed box, so no row moves and it is no
  element's overflow (10.6). At 1280 x 640 it covers no part of the Bubble, the up arrow, an
  Option button or its link menu (**[#178]** gone, 30.6; the step's two buttons beside the
  arrow stay clear of it, 30.8), nor at any other viewport of 10.6 where the tree view shows
  (`tests/browser/floating-controls.spec.ts` measures the boxes on the full Node at a 49-entry
  Trail). Below 640 pixels of height, where that band is 26 (10.5), it is 24 tall and one under
  the bar; on a phone's band of 40, 32 and four under it; 8 from the edge below 480 wide.
- **It says what it opens**: a gear and `settings`, "Decision-tree settings"
  ("Beslisboominstellingen"), **then the Tree's state as a tag**, set off by a hairline: a dot
  and a word, a tile's mark (26.4) -- `hidden` (`text-muted`), `published`
  (`accent-secondary`), `notServable` (`danger`, 18.3). A published Tree whose public copy is
  behind (19.4) shows `published` with its dot in `accent`, and the indicator says
  `publicBehind` (29.3). The count is the to-do control's (33.3).
- **Its name** is `settings`, a colon and the state's word, then `, publicBehind` when that
  applies -- "Decision-tree settings: Hidden" -- the same at every width.
- **Below 1000 pixels** the words do not fit beside the arrow: the button is a 32-pixel round
  button holding the gear, with the state's dot on its shoulder -- a ring for `hidden`, so the
  state does not rest on its colour alone -- and keeps its whole name.
- **Order and layers.** After the bar's last control in the tab order, behind the to-do
  control. While its Sheet is closed it lies under any other Sheet's scrim -- an Overlay's, the
  enlarged view's, a menu's -- and while it is open its box lifts over the page, so the scrim
  covers the bar too, as the bar's own lift did while it held the button.

### 33.2 The panel

A Sheet down the right edge, 400 pixels wide, from under the chrome bar to above the
disclaimer, over the scrim (10.5's rules: Escape, cross, click outside; focus to the cross;
one Sheet at a time). Its body is a scroll box (26.3). Four sections:

```
+--------------------------------------+
|  Tree: Hidden (3)                 x  |
|--------------------------------------|
|  PUBLISH                             |
|  [ o  ] Hidden                       |
|  3 things to do before publishing:   |
|   - Start: Title missing in Dutch    |  <- each a link to its Node's editor
|   - n-4k2p1q: No answer for "no"     |
|   - n-9x1abc: Nothing leads here  [remove] |
|--------------------------------------|
|  COLLABORATORS                       |
|  Anna (creator)                      |
|  Bram                          [x]   |
|  [ choose an account  v ] [Invite]   |
|  Hand over to [ account v ] [Go]     |  <- the creator's hand-over
|--------------------------------------|
|  THIS TREE                           |
|  Title      [AI Act applicability ]  |
|  Description[                     ]  |
|  Languages  EN NL (fixed)  ai-act-example |
|  Public link  /ai-act-example        |  <- when published
|--------------------------------------|
|  ADMINISTRATOR                       |  <- the administrator only
|  Hand over to [ account v ] [Go]     |
|  [Delete this tree]  (hidden only)   |
+--------------------------------------+
```

**[#176] Amended 2026-10-02:** the panel is titled `settings`, the words of the button that
opens it, and its Publish section holds the switch and no to-do list, which is a bubble of its
own (33.3). The top of the sketch, as it is now; the other sections are as above:

```
+--------------------------------------+
|  Decision-tree settings           x  |
|--------------------------------------|
|  PUBLISH                             |
|  [ o  ] Hidden                       |
|  Not published: some things must be  |  <- after a refused publish (33.3)
|  done first. See what to do          |  <- opens the to-do bubble
|--------------------------------------|
|  COLLABORATORS                       |
```

### 33.3 Publish

A `role="switch"` labelled `publish`. **On** → `PUT .../published { published: true }`: 200 →
`published`, `publishedAt`, the **public link** (the root URL, new tab); 409 → the switch stays
off and the response's violations are the to-do list. **The to-do list**: the draft's
advisory violations (re-read from `GET .../trees/<t>` when the panel opens; the count from
every response), one line each -- the Node's title (or id, or `tree`) as a link to its editor
page, then the message; a V-REACH line offers `remove`. Headed `publicBehindBecause` while
`publicCopyCurrent` is false and `notServableBecause` with the start-up violations while not
servable. **Off** asks once: the switch becomes `confirmUnpublish` ("Hide this tree? Links to
it will stop working until it is published again.") with `confirm` / `cancel` → `{ published:
false }`. A collaborator sees the switch disabled, the list, no confirmation (21.2).

**[#176], changed by the owner -- 2026-10-02** (#169: "The to-do before publishing is ok to have
somewhere, but not in the sidepane and not on top, make it a bubble on the top right (not in the
header bar)"). Recorded in `docs/adrs/ADR-176-floating-settings-and-to-do.md`.

- **The to-do list leaves the panel for a bubble of its own.** Its control floats beside the
  button of 33.1, to its left, of the same height: the count in a small round bubble filled with
  `accent`, then `todoCount` -- "3 things to do", `todoCountOne` for one -- and at zero a quiet
  tick, named `todoNone` ("Nothing to do"). Below 1000 pixels the round count alone. Its name is
  the count and the words, the same at every width; the count follows every write response, as
  the button's did (22.3).
- **The bubble** is a Sheet under the two controls at the top right, 400 pixels wide at most and
  as tall as its list, never past the disclaimer (below 480 wide, the bottom edge); its body is a
  scroll box (26.3), as the panel's was. 10.5's rules hold: Escape, the cross, a click outside,
  focus to the cross and back to the control, one Sheet at a time. Its heading is `todoBefore`,
  or `publicBehindBecause` / `notServableBecause` as above, and its list is the to-do list
  above, line for line -- the Node's title (or its id, or `thisTree` for the manifest and the
  file) as a link to that Node's editor page, the message, `remove` on a V-REACH line for the
  creator and the administrator -- or `todoNone` when it is empty. The list is re-read from `GET
  .../trees/<t>` when the bubble opens, not when the panel does.
- **The Publish switch stays in the panel.** A 409 keeps it off and the Publish section says
  `publishRefused` ("Not published: some things must be done first.") with a button `showTodo`
  ("See what to do") that opens the bubble -- closing the panel, one Sheet at a time -- on the
  list the refusal answered, without re-reading it: as built (#142) that list is the draft's own
  while it has any lines, because the full validation's lines name `tree.json` and a JSON Pointer
  rather than a Node, and the response's otherwise.

### 33.4 Collaborators

The creator first (`creator`), then each collaborator by name (ids resolved through `GET
/admin/api/accounts`, 21.4), a remove cross for the creator and the administrator (`DELETE
.../collaborators/<id>`). For those two: a `<select>` of every active account not on the Tree
and not the administrator (name, then login in `text-muted`), `invite` (`PUT
.../collaborators/<id>`; a 422 under the select); and, for the creator, `handOver` with a
`<select>` and a button (`PUT .../creator`), after which the list shows the new creator and
the old one as a collaborator (21.4). A collaborator sees the list and no controls.

**Amended 2026-10-03 (#195):** the `<select>` -- here and in 33.6 -- shows each account's name and
no login: the login is an e-mail address, which only its holder and the administrator see, and
two accounts no longer share a name (38.5, 38.6). The list's order and its controls stand; the
public mention reads `meta.json`'s `joined`, not this list (39.2).

### 33.5 This Tree

Two fields for the page's language -- the manifest's `title` (80) and `description` (600 and
8 lines, rich, as source) -- with the rim's counter and tags beside them; the declared
languages as tags ~~with `fixed` (#147)~~ -- **[#147]** the new-Tree form's control (27.1): a field and
`en`/`nl` buttons to add one, `makeDefault` on every tag but the first, and a remove cross on every tag
but the default (so never on the last); removing asks once in place, naming the number of texts
written in that language (`confirmRemoveLanguage`, from the entry's `written`), and each is one
write of 22.2 after which the page is drawn again, at the address of the language it shows
when that is now the default, or at the default's when it was removed; the rim's tags (28.3)
follow the declared languages; the id; the public link when published. **[#144]** The Theme panel of 33.8 closes the
section.

### 33.6 Administrator

The administrator only: `handOver` (every active account) and `deleteTree`, enabled while
hidden and disabled with `unpublishFirst` while published (21.2), asking once
(`confirmDeleteTree`) → `DELETE .../trees/<t>` → `/admin`.

### 33.7 Not here

The step's controls (30.8, on the rim). The overview has no panel: its chrome bar holds the
~~name~~ **[#176]** link `account`, the name its description (24.3), and `logout`, and neither
control of 33.1 and 33.3 floats there (amended 2026-10-02); each tile's state is on the tile (26.4).

### 33.8 The Theme panel

**[#144], new -- 2026-09-27.** The owner promoted #144 (core document 10.35). A Tree made in
the editor had no Theme, and the only way to give it one was files placed on the server by
hand. The panel is where `ADR-133-top-panel.md` decision 5 put it: the end of "This Tree".
It edits the three parts of `tree-format.md` 4.3 and nothing a Theme does not carry (no `dark`
logo variant, no tab `icon`, no logo `url`; a hand-made Theme's are kept as they are).

- **Each part is written whole.** `PATCH /admin/api/trees/<t> { path: 'theme.logo' |
  'theme.fonts' | 'theme.colours', value }` replaces that part, and `value: null` removes it;
  the last part removed takes `theme` with it (V-EMPTY). A part is not written a key at a time
  because it is complete or absent (4.3): the schema and V-THEME judge the part as sent, and
  a half palette or a family without its licence is the 422 of 22.3 with nothing stored. The
  key order of the stored part is the byte form's (3.7). A part is one field for 22.5: two
  people changing the colours at once get the later palette.
- **Files go up first.** `POST /admin/api/trees/<t>/theme` takes one file by 22.6's rules --
  5 MiB, the type from the first bytes, the server's name (`<stem>-<8 hex>.<extension>`,
  checked against 3.6 and resolved inside `theme/`) -- and answers `{ file }`. A logo is PNG
  or WebP; a font is WOFF2 (the signature `wOF2`); anything else is 415, **SVG included**,
  as for pictures: a hand-made Tree may still ship an SVG logo, but the editor offers no way
  to tell a creator that an uploaded one is only a picture. The part that names the file is
  written after. A file no Theme names is served neither by the public route (5.5) nor by
  the admin one, which resolves through the draft's `themePath`.
- **The logo**: upload, and a new logo's `alt` is `""` in every declared language -- a to-do
  line per language (19.2, V-L10N advisory), written in the panel in the page's language as
  every field is (28.2), saved when the field is left. Replace and remove.
- **The colours**: `chooseColours` writes the frontend's default palette (13.4) as the
  Tree's, so nothing on screen changes until a colour does; then a picker per role, each
  change saved 400 ms after the last so a dragged picker is one write. `defaultColours`
  removes the part.
- **The fonts**: per role, `body` then `heading` (4.3.2), a family name, a licence line and a
  first WOFF2 file with its weight (a number or a range, verbatim) and style; then more
  files, a file removed (the last one removes the family), the name and licence edited.
  **[#171] The name and the licence become dropdowns** (2026-10-02; the owner, #169: "Make the
  font family selection a dropdown, but do give the option to add a font by uploading a
  file. Make the license section a dropdown."): per role a select of the default, the four
  families the application ships, the Tree's own family and, last, "Upload a font file…"
  (37.2); a family from the library is written by one store operation (37.3); an upload is
  named after the font's own family name (37.4); its licence is chosen from six (37.5). The
  files, weights, styles and removals of the Tree's own family stay as written here.
- **Seen at once.** Every answer refreshes the page, so the draft's `<style>` (13.1, amended)
  and the chrome bar's logo follow; after publishing (19.3) the public page shows the same.
- **The contrast warning.** As the colours change, the panel checks the pairings the public
  page is held to by `tests/first-tree/contrast.spec.ts` (issue #64): `text` and
  `text-muted` on `background` and on `surface` at 4.5 : 1, and the Answer label -- whichever
  of `text` and `background` 13.1 letters it with -- on `accent-secondary` at 3 : 1 (10.3). A
  shortfall is listed beside the pickers with the ratio and the minimum, and the palette is
  stored all the same: 4.3.3 leaves contrast to the Theme's author and the validator does not
  measure it, so the panel warns and never refuses. `src/contrast.ts` holds the rule.
- **Who.** Anyone who may edit the Tree (21.2): the creator, a collaborator, the
  administrator. The upload is 21.2's `upload` and the part write its `edit`.
- **Not done.** A replaced or removed logo's or font's file stays in `theme/`: the public
  route never serves it (5.5), and no publish sweeps theme files as it sweeps pictures (22.6).

**[#180], built -- 2026-10-02.** The owner, on #169, after the three points of 24.3, 13.1 and
37: "Give all items in this menu that deserver it an explanatory hoverable i with a circle
around it."

- **The panel keeps the default look.** It is the editor's own interface (24.3, amended): a
  colour changed repaints the Tree behind the panel, never the panel or the bar.
- **Information hints**, #174's "i" (31.2): behind each of the seven colour roles, what it
  paints; behind the contrast warning, what it measures and that the palette is stored all the
  same; behind the logo's alternative text, what it is for; behind each font role, what it
  sets; behind the licence, why a font needs one and that a font whose licence cannot be named
  does not belong in the Tree (4.3.2); behind a font file's weight, what the weight and the
  style say. One or two sentences each, in English and Dutch: the hint keys of 3.2.
- **The contrast warning and the Sources.** The Sources' lines are `text` on the Bubble now
  (13.1, amended), a pairing the warning already checks at 4.5 : 1; no pairing is added.
- **As built, where 37 left room.** Choosing "Upload a font file…" shows the file field under
  the dropdown and asks the browser for its picker at once: where the choice carries the user's
  activation the picker opens, and the field stays to be clicked where it does not. `fontNameTaken`
  compares names as a browser matches a family name, without regard to case. A character 13.3
  refuses is not taken into a name field at all, and typing stops at 64, as every field stops at
  its limit (28.4). An upload's licence starts unchosen. A library family's licence is said as a
  line, "Licence: SIL Open Font License 1.1". The store checks a library file's SHA-256 before
  it copies it: a release whose `fonts/` was altered answers 500 rather than writing other bytes
  under the listed name. A WOFF2 collection (`ttcf`) proposes no name.

## 34. The reuse rule

**[#133], new -- 2026-09-26.** `ADR-131` decision 5: the editor looks like the final Tree
without forking the components, and the public pages of `version-1.0` are unchanged in
behaviour. Recorded in `docs/adrs/ADR-133-reuse-rule.md`; decides the mechanism 22.6 left
to this issue.

### 34.1 One optional prop

`TreeView`, `Bubble`, `Interior`, `Carousel`, `EnlargedView`, `LanguageSwitch` and
`Explainer` take `edit?: EditMode`. **Absent -- as on every public page -- a component
renders exactly what it renders today, not one attribute more.** Present, it is passed down
unchanged. No wrapper, no parallel components.

```ts
// src/editor/mode.ts (server side)
export interface EditMode {
  treeId: string
  links: Links               // 34.3
  languages: string[]        // the draft's declared languages, for the rim's tags (28.3)
  words: EditorWords         // the chrome strings the editor's client components say, as strings
  slots: EditorSlots         // 34.2
}
export interface Links {
  node(a: PageAddress): string
  follow(a: PageAddress, targetId: string): string
  trail(a: PageAddress, index: number): string
  withLang(a: PageAddress, lang: string): string
  image(treeId: string, file: string): string   // [#138] as built: a picture's URL names its Tree (18.1)
}
```

### 34.2 The slots

Named places where the editor adds something; each a server-side function returning an
element (a client component with string props); an absent slot renders nothing. **#138 lands
every call site**; #139 to #142 supply the functions and never edit a server component again.

**[#138] As built**: every slot takes the Node it is drawn on as its first argument, because a
write names the Node and the rim's tags read its other languages (the Interior and the
Carousel know it as `NodeContent`, the tree view as a Node); `field` also takes the public
element to show while the region is not being edited, where that element carries a script
of its own; and an `operation` slot joins the table for the two Source operations of 28.1
that are not fields. The types are `src/editor/mode.ts`.

| Slot | Called by | Fills it |
|---|---|---|
| `field(node, path, value, limit, rendered?)` | `Interior`, `Carousel`, `EnlargedView`, `TreeView` (Option titles), `Bubble` (outcome; **[#171]** the ending's `terminal.label`, limit 19, 36.3) | `Field` (#138) |
| `operation(node, op, index?)` | `Bubble` (`+ addSource` after the last Source; `removeSource` in a Source's Sheet) | the add-Source Sheet and `Operation` (#138) |
| `imageSlot(node)` | `Interior` | `ImageSlot` (#140) |
| `stripAdd(node)` | `Carousel` | `ImageSlot` (#140) |
| `enlargedControls(node, index)` | `EnlargedView` | #140 |
| `structure(node)` | `TreeView` (the Answer row) | `Structure` (#139) |
| ~~`linkMenu(node, link)`~~ | ~~`TreeView` (each Answer and Option button)~~ **[#178]** gone, 30.6 | ~~`Structure` (#139)~~ |
| `sideAdd(node)` | `TreeView` (the fan; ~~the Overlay's list~~, **[#177]** on the centre only, 30.5) | `Structure` (#139) |
| `sideDelete(node, index)` | **[#177]** `TreeView` (the foot of the Overlay of the Node's Option `index`) | `Structure` (#177, 30.7) |
| ~~`stepMenu(node)`~~ **[#178]** `stepButtons(node)` | `Bubble` (~~the rim above~~ **[#178]** the band above, beside the up arrow, 30.8) | ~~`StepMenu` (#139)~~ **[#178]** `DeleteStep`, `RemoveEnd` of `StepButtons` |
| ~~`mark()`~~ | not built (**[#141] As built** below) | `Marker`, drawn by the description's `Field` (#141) |
| `onTermClick` | `Explainer` | #141 |

**[#141] As built**: there is no `mark()` slot. The `mark` button acts on the source's
selection, and only the description's `Field` holds its textarea, so that `Field` draws
`Marker` on its own rim (`src/editor/Field.tsx`) and `EditorSlots` has no `mark` member
(`src/editor/mode.ts`). `Bubble.tsx` (`Interior`) lost its `{edit?.slots.mark?.()}` call:
one line removed from a server component, the one edit #141 makes to one, against the
rule above that #139 to #142 never make it. `onTermClick` is built as the table says: the
name of a DOM event (`src/admin/slots.tsx`), which `Explainer` dispatches on a click, and
on Enter, on a term.

### 34.3 The addresses and the pictures

Every component builds an address or a picture URL through `links` = `edit?.links ??
PUBLIC_LINKS`, where `PUBLIC_LINKS` is the five functions of `src/url.ts` as they are. The
editor's `links` (`src/editor/links.ts`, server side) prefixes the four addresses with
`/admin/trees` (24.1) and makes `image` `adminImageHref(treeId, file)` (22.6). `src/url.ts`
is unchanged but for `adminImageHref`.

### 34.4 The editor's client components

Under `src/editor/`, leaves: `Editor` (the provider: the queue, the indicator, the session
Sheet, 29), `Field`, `ImageSlot`, `AttachSheet`, `Structure`, `StepMenu` (**[#178]** `StepButtons`), `Marker`,
`ExplainerSheet`, `Panel`, `LoginForm`, `NewTreeForm`; they take strings and ids and reach
the queue through context. Of `src/` they import **exactly three modules**: `src/tree/measure.ts`,
`src/tree/grammar.ts` (**[#137]** the id and tag grammars with the counted length, which
`measure.ts` builds on) and `src/markdown.ts`, all pure (no `node:` module, no `ajv`, no
schema; a test asserts it). `src/editor/writes.ts` is the one caller of `fetch` against `/admin/api/`, one
function per row of 22.1 used; `src/editor/slug.ts` derives ids. Nothing in `src/editor/`
reads the file system, the environment or a request. `src/components/` imports of
`src/editor/` only the `EditMode` type.

**[#141] As built**: exactly **four** modules. `Field.tsx` also imports
`src/components/Explainer.tsx`, a client component that imports only React: 32.3 and
`ADR-133` decision 3 require a marked description to render through the same `Explainer`
after an edit as on the public page, so the description's `Field` shows its text through
it rather than a copy. `tests/editor/imports.test.ts` asserts the four and that
`Explainer.tsx` imports nothing but `react`.

**[#144]** A fifth, after #141's four, so **five** modules in all: `src/contrast.ts`, the WCAG maths and the contrast rule of 33.8, pure
and dependency-free, which `theme.ts` derives its readable-on colours from and the Theme panel
warns with, so the rule has one definition. `imports.test.ts` asserts it with the others.

### 34.5 What edit mode does not render

No neighbour frames, no `data-slide` (every control a plain link; no slide); no JSON-LD, no
`hreflang`, canonical or dataset link (`noindex`, 20.9); no share button. The strip, the
enlarged view, the Overlays and the explainer panels render as on the public page, plus
the slots. **[#195] (2026-10-03)** No mention of the Tree's Authors: the editor's bar is its
own interface, and the panel lists the same accounts (39.7).

### 34.6 The types

`src/tree/types.ts` gains `NodeContent` (`id`, `title`, `description`, `sources`, `images`,
`explainers`), satisfied by `Node` and `DraftNode`; `Interior`, `Carousel` and `EnlargedView`
take it. `TreeView` and `Bubble` take `Node | DraftNode` and read Links through
`linksOf(node): { yes?, no?, terminal? }`. `parseUrl`, `centreOf` and `contentLanguage` take
`Readable = Pick<Tree, 'manifest' | 'getNode'>`, so a `Draft` passes; nothing else changes
and their tests run unchanged.

### 34.7 The editor page's bound

`src/app/[lang]/admin/trees/[tree]/[...path]/page.tsx` is `authenticated → permit('read') →
store.drafts.draft(by, id) → parseUrl → centreOf → the asides by id → TreeView`: the centre
and its chain (at most 3), its Option targets (at most 8), the titles of its Answer targets
from the index -- **at most twelve Nodes**, under 11.2's seventeen; `neighbourhood()` is not
called. The picker (30.6) carries ids and titles, never Nodes.

### 34.8 The rule's tests

`views.test.tsx`: a public render of every fixture contains no `[data-field]`, no
`contenteditable`, no element whose class starts with `editor-`; the same fixtures with an
`edit` whose slots are all absent give the same markup save the addresses `links` rewrote.
Every existing browser spec runs unchanged by #138 to #142, and each PR pastes the counts.

## 35. Testing the editor round

**[#133], new -- 2026-09-26.** Amends section 7 for the screens. Recorded in
`docs/adrs/ADR-133-editor-testing.md`.

### 35.1 The data directory is built, not committed

`tests/browser/admin.ts` exports `buildDataDir(spec)`: a temporary directory in the store's
layout (17.2) from a spec naming, per Tree, the fixture folder, the id, published or hidden,
the creator and the collaborators by login; per account, login, name and password. It
writes `accounts.json` (hashes by the format of 20.2; `tests/store/accounts.test.ts`
authenticates against a directory it built, tying the two), `meta.json` per Tree, an empty
`sessions.json`. Draft-only states come from `tests/fixtures/drafts/<state>/` (23.7).
**[#195] (2026-10-03)** From #196 an account is named by its e-mail address: per account,
`email`, name and password, and each Tree's roles by address (38.10).

### 35.2 One server per spec, one login helper

`serveStore(dataDir, port, env?)` in `tests/browser/serve.ts` (the second export; the first
now serves a fixture folder through a seeded store, 18.4): `ELSA_DATA_DIR` the directory,
`ELSA_SEED_DIR` an empty folder, `ELSA_ADMIN_PASSWORD` from the table, a port at an offset
from `BASE_PORT`. `login(page, login)` posts the password through `page.request` so the
cookie lands in the context; `logout(page)`. Two accounts at once: two contexts.
**[#195] (2026-10-03)** `login(page, origin, email, password)` posts `{ email, password }`,
and every server a test starts sets `ELSA_ADMIN_EMAIL=admin@example.org` beside its password
(38.10).

### 35.3 The named accounts and Trees

`admin`; `anna` (creator); `bram` (collaborator); `cees` (no role). `ai-act-example`
published, creator `anna`; `hidden-draft` hidden from `tests/fixtures/full-node`, creator
`anna`, collaborator `bram`; `tree-01` to `tree-14` published from
`tests/fixtures/single-language`, for the overview's box.
**[#195] (2026-10-03)** From #196 the four log in as `admin@example.org`, `anna@example.org`,
`bram@example.org` and `cees@example.org`, in a domain RFC 2606 reserves for examples, so no
real person's address is in the repository (38.10).

### 35.4 The files, per build issue

| File | Asserts | Issue |
|---|---|---|
| `tests/browser/overview.spec.ts` | 26.1 to 26.3 on `/`: one tile per published Tree, the link, a hidden Tree absent, the box scrolls and the document does not, `noTrees` | #134 |
| `tests/browser/login.spec.ts` | 24.2, 25: the fields, the one error, the lock, the reload to the address asked for, `<noscript>`, the 403 page, the account and accounts pages, logout | #135 |
| `tests/browser/admin-no-scroll.spec.ts` | 10.6's exact test at its ten viewports over the admin pages with `[data-scroll-box]` exempted: login, 403, account, accounts (#135); the creators' overview with sixteen tiles, the form with three languages (#137); the editor on `hidden-draft`'s full Node in `en` and `nl`: plain, the description in its source state, a Source's Sheet, the first two Overlays, and the session Sheet at the guarantee and on a phone (#138; each later issue adds its Sheets) | #135, #137 to #142 |
| `tests/browser/creators-overview.spec.ts` | 26.4, 27: who sees what, the two groups, the + tile absent for a visitor, the form's proposal, errors and landing | #137 |
| `tests/editor/field.test.tsx`, `queue.test.ts`, `imports.test.ts` | 28.4, 28.5; 29.1, 29.2, 29.5, 29.6 against a fake `fetch`; 34.4's import rule | #138 |
| `tests/browser/editor.spec.ts` | 28, 29: the regions; a title saved and public after publishing through #136's route; past 80, the same rule id as `npm run validate --draft`; `nl` edited without touching `en`; the tags; the indicator's states; a refused write kept; two contexts and `changedElsewhere`; the session Sheet | #138 |
| `tests/browser/structure.spec.ts` | 30, and the Node count reconciled against the published `tree.json` | #139 |
| `tests/browser/upload.spec.ts` | 31, and the public page's requests against 11.5 after publishing | #140 |
| `tests/editor/slug.test.ts`, `tests/browser/marking.spec.ts` | 32; `explainer.spec.ts` untouched and green | #141 |
| `tests/browser/panel.spec.ts` | 33, with the public overview's tiles before and after publishing | #142 |
| `tests/browser/theme-panel.spec.ts`, `tests/contrast.test.ts` | 33.8: a logo, colours and a font through the panel, seen at once in the editor and after publishing on the public page; the contrast warning; the refusals. `theme.spec.ts` untouched and green | #144 |
| `tests/browser/admin.spec.ts` | The walk of #143, screenshots under `docs/screenshots/editor/` | #143 |
| `views.test.tsx` | 34.8 | #138 |
| **[#171]** the rows of 36.5 | The ending's words: the rules, the conversion, the store's conversion at open, the Sheet, the public badge | #179 |
| **[#171]** the rows of 37.6 | The font library, `use-library-font`, the upload's name, the dropdowns, the library in `no-scroll.spec.ts` | #180 |
| **[#195]** (2026-10-03) the rows of 38.10 | The login by e-mail address: the check, the start's table, the conversion, the routes, the pages, every test that logs in | #196 |
| **[#195]** (2026-10-03) the rows of 39.9 | The Authors: `joined`, `authorsOf`, `authors(id)`, the mention, the no-scroll rule with it, the account sweep | #197 |

### 35.5 The no-cookie sweep, extended

`deployment.spec.ts` (#135; 20.5, 23.7) also asserts: a `GET` of every admin page of 24.1,
with and without a session, answers no `Set-Cookie` -- only `POST /admin/api/login` and
`POST /admin/api/logout` ever do -- and carries 20.9's two headers; and after the editor has
saved a field, the walk of every public route of 4.1, 15 and 16 still sends no `Cookie` and
receives no `Set-Cookie`. The admin pages are a second array in the same file.
**[#195] (2026-10-03)** And the account sweep of 20.5, amended, and 39.9: no public response
holds an account's address or id, and an Author's name stands only inside the mention's
element.

### 35.6 The public suites run unchanged

#134 to #142 edit no public spec except to add a row a section of this freeze names (the
overview in `no-scroll.spec.ts`; the moved addresses of 18.1 in #134); every PR runs all of
`npm test` and `npm run test:browser` and pastes the counts, which must not fall. A changed
public spec in a #138 to #142 branch is a send-back.

### 35.7 Screenshots

At 1280 x 640, by the spec under `ELSA_SHOTS=1`, into `docs/screenshots/issue-<n>/`, embedded
in the PR pinned to a commit.

## 36. The ending of a walk: the creator's words

**[#171], new -- 2026-10-02.** The owner, walking the editor (#169): "When tree ends here is
chosen, just let the user enter a text to display on the button (with a wordcap obviously).
This graph creation tool is not just for Legal trees, also for ethical or social trees, so we
want to keep the graph creator useable for all." The format is `elsa-tree/5`
(`tree-format.md` 5.5, 5.7, 12.7): a Terminal carries `terminal.label`, its own words, plain,
in every declared language, at most 19 characters, in place of one of four outcomes. Recorded
in `docs/adrs/ADR-171-ending-text.md` and `ADR-171-elsa-tree-5.md`. Built by #179.

### 36.1 The badge

- **What it shows**: the Terminal's `label` in the page's content language, on the rim where
  the outcome was (10.1): a 24-pixel pill in the band above the text area, in the half of the
  band left of the up arrow, and across the band under the arrow's foot below 480 pixels wide
  (#82). Its look is the outcome badge's: 11-pixel bold capitals (`text-transform: uppercase`,
  in `--elsa-font-heading`), 14 pixels of padding and a 1-pixel border each side, tracking
  0.12 em -- **0.04 em below 792 pixels wide**, where the Bubble narrows and 10.5's steps 5 to 7
  fire. It is Tree content, so it carries no `lang` of its own; the page's is right.
- **One colour for every ending**: the text and the border in `--accent-read` (the accent mixed
  towards the text, `globals.css`), and the Terminal Bubble's outline in the same shade. No
  class per ending, and no `:has()` rule on the Bubble. The Theme's `danger` paints no public
  Node page any more (`tree-format.md` 4.3.3).
- **Its room, and why 19**: the badge is at most `(Bubble width - 4) / 2 - 24` pixels wide in
  the half band -- 354 at and above 792 pixels wide, down to **198 at 480**, the narrowest --
  and `width - 60` across the band below 480 (261 at 321, 300 at 360). Measured in Chromium on
  2026-10-02 with the badge in place at a 480-pixel window, on Windows and in Linux, for
  fifteen endings of 18 to 20 characters in English, Dutch and German: at 0.04 em every one of
  up to 19 characters holds one line in every face measured. The widest, "Mandatory
  safeguard", is 195.5 pixels in DejaVu Sans Bold, the widest fallback (10.7), 181.0 in Arial
  Bold and Liberation Sans, 178.2 in Open Sans, 175.4 in Segoe UI Bold and at most 172.8 in the
  library's other three families (37.1); Linux draws a web font up to 1.9 pixels wider, and
  DejaVu Sans Bold as a web font there at 197.4, the widest of all. At 0.12 em five of the
  seven 19-character endings take a second line in DejaVu Sans Bold, which is why the tracking
  tightens. At the guarantee, 1280 x 640, the room is 354 and the widest 19-character ending
  212.3: far inside.
- **Why not 20**: three of the seven 20-character endings take a second line in DejaVu Sans
  Bold at 480 to 491 pixels wide. Nothing scrolls -- the badge is placed on the rim and grows
  with its text -- but a badge of two lines is 46 pixels tall and covers the top of the title,
  which 10.1 does not allow. The limit counts characters, as every limit of `tree-format.md`
  5.7 does: an ending of capitals wider than any measured can still take a second line at the
  narrowest widths. San Francisco and Helvetica Neue, the default stack's faces on Apple's
  systems, were not measured.
- **Without JavaScript**: plain text in the server's markup, as the outcome word was (14).
- **No other change to the page**: the Interior, `startAgain`, the up arrow and every
  measurement of 10 are as they were; `no-scroll.spec.ts` keeps its Terminal rows.

### 36.2 Every reader of `terminal.outcome`, and what it does from #179 on

Found on 2026-10-02 by searching `outcome` and the format number in `src/`, `scripts/`,
`schemas/` and `docs/specs/`. #179 changes each row in one pull request; nothing reads the
outcome afterwards, and nothing but `tree-format.md` 12.7's conversion knows its four values.

| Where | Today | From #179 on |
|---|---|---|
| `src/tree/types.ts` | `type Outcome`; a Terminal `Node` has `outcome: Outcome`, a `DraftNode` `outcome?`; `linksOf(node).terminal` is the outcome | `Outcome` goes; a Terminal has `label: LocalisedText` (5.1), a `DraftNode` `label?`; `linksOf(node).terminal` is the label |
| `src/tree/loader.ts` | reads `raw.terminal.outcome` into the Node and the `DraftNode`; `Manifest['format']` `elsa-tree/4` | reads `raw.terminal.label`; `elsa-tree/5` |
| `src/tree/validate.ts` | compiles `schemas/elsa-tree-4.json`, derives the draft schema from it; no rule reads the outcome | compiles `schemas/elsa-tree-5.json` and derives the draft schema from it (19.2); `checkNode` checks a Terminal's `label` as the plain localised text it is -- V-L10N, V-PLAIN, V-LENGTH at `terminal.label.<lang>`, 19 in `MAX` |
| `src/tree/serialise.ts` | key order `terminal: ['outcome']` | `terminal: ['label']` |
| `src/tree/grammar.ts` | names `schemas/elsa-tree-4.json` in a comment, on the schema's `url` pattern | names `schemas/elsa-tree-5.json` |
| `src/store/edits.ts` | the field `terminal.outcome`; `set-terminal { outcome }`; `link: 'end'` writes `{ outcome }`; `newDraft` writes `/schemas/elsa-tree-4.json` and `elsa-tree/4`; the language operations' `eachText` walks no Terminal | the field `terminal.label.<lang>`; `set-terminal { label }` and `link: 'end'` write `{ label }`, `""` for every language not given; `newDraft` writes `/5`; `eachText` includes a Terminal's `label` |
| `src/store/drafts.ts` | `createNode(..., from: { ...; outcome? })` | `from: { ...; label? }` (19.7) |
| `src/store/index.ts` | opens what it finds | converts an `elsa-tree/4` file before it opens it, and in `importTree`'s staging copy (36.4) |
| `src/app/[lang]/admin/api/trees/[tree]/nodes/route.ts` | passes `from.outcome` | passes `from.label` |
| `src/editor/fields.ts` | reads `terminal.outcome` as `node.outcome` | reads `terminal.label.<lang>` |
| `src/editor/Field.tsx` | a select drawn as the badge, for the outcome (and as itself for a Source's kind) | the outcome's use goes; the Source kind's select stays; the ending is a plain field (36.3) |
| `src/editor/Structure.tsx` | `EndForm`: four radios and `confirm` | `EndForm`: one field and `confirm` (36.3) |
| `src/editor/writes.ts` | `from.outcome` | `from.label` |
| `src/editor/mode.ts` | names `terminal.outcome` in a comment | names `terminal.label` |
| `src/admin/slots.tsx` | `EDITED` matches `terminal\.outcome`; `OUTCOMES` and their badge words; the field slot draws the outcome as a select; `EndForm` gets the four choices | matches `terminal\.label`; `OUTCOMES` goes; the field slot draws the ending as a plain field of limit 19; `EndForm` gets `endingText` |
| `src/components/Bubble.tsx` | `OUTCOME_LABEL`; `<p class="outcome outcome--<value>" lang={uiLang}>` with the chrome word | `OUTCOME_LABEL` goes; the badge holds `label[lang]` in one class, `outcome`, kept so that the specs which find the badge by it hold (36.5); no `lang` |
| `src/chrome.ts` | `outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited`, `outcomeRefer`, `outcome`; `colourDanger` "Prohibited and errors" | gone; `endingText`; `colourDanger` "Errors" / "Fouten" (3.2) |
| `src/app/[lang]/globals.css` | `.outcome--not-applicable` in `text-muted`, `--applicable` in `accent-secondary`, `--prohibited` in `danger`, `.bubble--terminal:has(.outcome--prohibited)` outlined in `danger`; `.editor-select.outcome`; `.structure-outcomes`, `.structure-outcome` | the per-ending rules go (36.1); the badge's 0.04 em below 792; the field's look in place of the select's; the radio list's rules go |
| `src/url.ts` | `SCHEMA_HREF` `/schemas/elsa-tree-4.json` | `/schemas/elsa-tree-5.json` |
| `src/app/[lang]/schemas/[file]/route.ts` | `PUBLISHED` `elsa-tree-4.json` | both names (15.1) |
| `src/app/[lang]/[tree]/tree.json/route.ts` | serves the file; `describedby` through `SCHEMA_HREF` | unchanged code: serves the `/5` file byte for byte, `label` and all |
| `src/findability/jsonld.ts` | a comment, "A Terminal is an outcome, not a question"; reads no outcome | unchanged (16.4) |
| `src/findability/llms.ts` | chrome prose, "arrives at an outcome"; names the schema through `SCHEMA_HREF` | unchanged code (16.5) |
| `scripts/migrate-tree.ts` | 12.6's byte form | also 12.7 |
| `schemas/elsa-tree-4.json` | the enum of four | unchanged, kept, served |
| `schemas/elsa-tree-5.json` | -- | frozen by #171 |
| `docs/specs/tree-format.md`, this document | 4, 5.5, 5.7, 7, 8 and 9; 3.2, 4.1, 5.1, 6, 7, 8, 10.1, 10.3, 15.1, 15.2, 17.2, 19.1, 19.2, 19.7, 22.1, 22.2, 28.1, 28.6, 30, 30.1, 30.3, 34.2 | amended by #171, each passage marked **[#171]** |

### 36.3 The editor asks for the words

- **`treeEndsHere`** (the Answer row's middle button on a Node without Links, 30.1) opens a
  Sheet titled `treeEndsHere` holding **one plain field**, labelled `endingText`, in the page's
  language, focused, with the counter `n / 19` on it as every field shows its limit (28.3,
  28.4, as #172 amends them), and `confirm` and `cancel`. `confirm` is enabled once the field
  holds a character that is not white space; Enter confirms. It sends `POST
  /admin/api/trees/<t>/nodes { from: { node, link: 'end', label: { <lang>: <text> } } }`; the
  store writes `terminal: { label }` with `""` for every other declared language, each a
  to-do (V-L10N advisory, 19.2). A Node with Options cannot end: the 422 (V-TERMINAL) is shown
  in the Sheet, as before (30.3).
- **Afterwards the badge is the field**, through the `field` slot (34.2), path
  `terminal.label.<lang>`, limit 19, plain: blurred it is the badge as the public page draws
  it; focused it shows the text as typed, without the capitals transform, so a creator sees
  what they write; the counter and the missing-language tags stand on the right rim at the
  band's height (28.3); a language with no words shows `endingText` as its placeholder. The
  region is the badge's own box, so nothing on the rim moves (28.6).
- **No outcome is offered anywhere.** "Tree does not end here after all" -- #178's
  replacement for the step menu's `removeEnd` -- sends `remove-terminal`; the words go with
  the marker, and ending the Node again asks for them again.
- **Words**: `endingText` is "Text of the ending" / "Tekst van het einde" (3.2), 18 and 19
  characters, so the placeholder also fits the badge.

### 36.4 A deployment's data directory

`openStore` (17.5) converts, before it opens any Tree, every `tree.json` and `draft.json`
under `$ELSA_DATA_DIR/trees/` whose `format` is `elsa-tree/4`, by `tree-format.md` 12.7.1, and
writes the result atomically (17.3): a `draft.json` when it passes the draft schema and every
blocking rule (19.2), a `tree.json` when it passes in full (19.3). It logs one line per file it
converted -- `Converted Tree "<id>" <file> from elsa-tree/4 to elsa-tree/5: <n> endings` --
and touches no `meta.json`, because no creator wrote. A file that would not pass is left as it
was; its Tree is refused (18.3) or uneditable (19.5) with the violations, and the
administrator's way out is the import command with a repaired file (17.4). `importTree` (the
seed and `npm run store -- import`) converts a `/4` folder's `tree.json` in its staging copy
and never writes into the source folder. Nothing keeps the `/4` bytes: `docs/deployment.md`
gains one paragraph asking for a backup of the data directory before the first start of the
release that carries `elsa-tree/5`.

**[#179] As built (2026-10-03).** The violations that stop a conversion are those of its
result (`tree-format.md` 12.7.1 step 8). The start prints them in the format of 5.4 under
`Not converted: Tree "<id>" <file>: the converted file would be invalid:`, and `importTree`
refuses a `/4` folder with its converted copy's. The file itself stays `/4`, so the Tree's
refusal and the draft's blocking list -- what the admin area shows -- are what opening that
file answers: its schema's errors alone, because the schema answers first (`tree-format.md`
3.9) and the content rules only for a file it accepts.

### 36.5 Tests (#179)

| File | Asserts |
|---|---|
| `tests/loader.test.ts` and its fixtures | a Terminal's `label` of 20 characters is V-LENGTH at `terminal.label.en` with "20 characters; at most 19"; a missing language is V-L10N; a line break is V-PLAIN; an `outcome` is refused by the schema at `/nodes/<i>/terminal`; every `invalid/<rule>` fixture still fails its own rule, `v-terminal`'s `maybe` included |
| `tests/migrate-tree.test.ts` | 12.7 on a Tree whose four Terminals carry the four outcomes, in `en` and `nl`, gives the table's eight words; `nl-be` gets the Dutch words and `de` the English; an unknown outcome is left and reported; an absolute `$schema` URL is rewritten in place; a second run changes no byte; the byte form of 3.7 |
| `tests/store/store.test.ts` | a data directory of `/4` files opens converted, served and editable, with one log line per file; a `/4` `tree.json` the conversion cannot carry is refused and left as it was; `importTree` of a `/4` folder converts its staging copy and leaves the source untouched |
| `tests/store/drafts.test.ts` | `link: 'end'` with `label` writes `{ label }` with `""` for the other languages; the field `terminal.label.nl`; `set-terminal { label }`; `terminal.outcome` is 422; `add-language` writes `""` into a Terminal's `label` and `remove-language` removes its text |
| `tests/browser/structure.spec.ts` | `treeEndsHere` asks for the words, its counter shows the 19; `confirm` puts the badge on the rim; after publishing (#136's route) the public page's badge holds the same words, in `en` and in `nl` |
| `tests/browser/no-scroll.spec.ts` | its Terminal rows unchanged, and one row more: a fixture Terminal whose `label` is 19 characters of wide capitals ("Mandatory safeguard" / "Maatregelen vereist") at its ten viewports and at 480 x 640, asserting 10.6's rule and that the badge is one line (its box 24 pixels tall). The runner draws the default stack in Liberation Sans, Arial's metrics (`src/theme.ts`), where 36.1 measured the English one at 181.0 pixels of the 198 and the research record the Dutch one at 172.6 |
| `tests/chrome.test.ts` | the outcome row goes (7) |
| the tests that name the old number | found on 2026-10-02 by searching `elsa-tree-4` and `elsa-tree/4` under `tests/`: `carousel.spec.ts`, `deployment.spec.ts` (its `SCHEMA` constant and the `describedby` header it expects), `draft-rules.test.ts`, `llms.test.ts`, `loader.test.ts`, `migrate-tree.test.ts`, `neighbourhood.test.ts`, `store/drafts.test.ts`, `store/store.test.ts`, `url.test.ts`, `views.test.tsx` -- each now names `/5`; and `draft-rules.test.ts`'s "a wrong format" case, which writes `elsa-tree/5`, writes a format that is wrong after #179 (`elsa-tree/6`) |
| the tests that assert an outcome | found on 2026-10-02 by searching `outcome` under `tests/`; #179 changes each to the `label`. Today `admin/trees.test.ts`, `browser/admin-api.spec.ts` and `browser/languages.spec.ts` end a Tree with `link: 'end'` and an `outcome`; `editor/structure.test.ts` builds its Terminals with one; `ai-act-tree.test.ts` holds the first Tree's four Terminals to their outcomes (from #179 on, to the words 12.7 gave them); `browser/admin.spec.ts` ends its Tree through `treeEndsHere`'s four radios and reads the outcome's select (from #179 on, the one field, 36.3); `browser/editor.spec.ts` has "a Terminal shows its outcome as a select drawn as the badge (28.1)" (from #179 on, the field drawn as the badge); and `views.test.tsx`, in the row above for the number, reads the badge as `outcome outcome--<value>` with the chrome word (from #179 on, one class holding the Terminal's own words). The specs that find the badge by its class -- `node-view.spec.ts`, `tree-view.spec.ts`, `trail.spec.ts` and `first-tree/walk.spec.ts` -- keep their assertions: the class stays `outcome` (36.2), and 12.7 gives each converted Terminal the words its badge showed |

#179's pull request also pastes, from a command, the Terminals counted before the conversion
against the endings carrying a `label` after it: 108 and 107, as `tree-format.md` 12.7.3
reconciles them.

**[#179] As built (2026-10-03).** The no-scroll row is `tests/fixtures/full-node`'s `applies`
Terminal, which says "Mandatory safeguard" / "Maatregelen vereist": that fixture holds every
maximum of the format at once, and has no Theme, so the runner draws it in the default stack.
At 480 x 640, which is no viewport of 10.6, the disclaimer takes a second line in its 28-pixel
row on every page -- the example Tree's root, which has no badge, has the same 659 pixels of
body in a window of 640, and so does `dev` before #179 (measured on e196d0d) -- a defect #179
reports and does not fix. So
at that size the row asserts that the document fits, that nothing but the disclaimer and the
body it overflows holds more than itself, and that the badge is one line; 10.6's rule is
asserted in full at the ten viewports.

## 37. The font and licence dropdowns

**[#171], new -- 2026-10-02.** The owner, on #169: "Make the font family selection a dropdown,
but do give the option to add a font by uploading a file. Make the license section a
dropdown." The Theme block of `tree-format.md` 4.3 does not change: what the panel writes is
4.3.2's table. Recorded in `docs/adrs/ADR-171-font-library.md`, `ADR-171-font-dropdown.md` and
`ADR-171-licence-dropdown.md`. Built by #180, with the rest of #169's point about the Theme
panel -- the editor's own bars kept in the default look, the text colour on the Sources, the
information hints -- which #180 decides itself.

### 37.1 The library

- **Four families**, each under the SIL Open Font License 1.1 with no Reserved Font Name,
  each no wider than Open Sans on the two Trees' own text at 400 and 700 (so every limit of
  `tree-format.md` 5.7 holds in them, as in the face it was measured in): **Open Sans**,
  **Roboto**, **Atkinson Hyperlegible Next**, **Faustina**, in that order.
- **In the repository**: `fonts/<id>/` -- `open-sans`, `roboto`, `atkinson-hyperlegible-next`,
  `faustina` -- each holding `<id>-normal.woff2`, `<id>-italic.woff2` (variable, weight `400
  700`, Latin and Latin Extended) and the family's upstream `OFL.txt`; `fonts/README.md` with
  the provenance, the recipe and the hashes of `ADR-171-font-library.md` decision 3. 345,116
  bytes in all: 324 KiB as a git pack, a gzip'd layer of about 339 KB in the container image.
- **In a release**: `fonts/` beside `server.js` in `.next/standalone/` and in the image's
  `/app`, as `schemas/` is (6, 15.1): `scripts/collect-standalone.ts` copies it into the
  standalone folder, which the `Dockerfile` copies whole, so the `Dockerfile` does not
  change. The store reads it from the working directory. Not under `public/`: no library
  file is ever served from the library, only as a file of a Tree.
- **In code**: `src/fonts.ts`, pure: `FONT_LIBRARY` (id, CSS family name, licence id, files
  with weight, style and SHA-256) and `FONT_LICENCES` (37.5).

### 37.2 The dropdown per role

The fonts part of the Theme panel (33.8) shows one native `<select>` per role, `fontBody`
("Running text") then `fontHeading` ("Headings"), in place of the family-name field and the
add-a-font form:

| Entry | What choosing it writes |
|---|---|
| `fontDefault`, "Default: the reader's own font" / "Standaard: het lettertype van de lezer" (running text); `fontSameAsBody`, "Same as running text" / "Zelfde als lopende tekst" (headings) | the `theme.fonts` part without that role's entry, or `null` when none is left (33.8) |
| `<optgroup>` `fontLibraryGroup`, "Fonts that come with the app" / "Lettertypen van de app": the four families by name | `use-library-font` (37.3) |
| `<optgroup>` `fontOwnGroup`, "This tree's own" / "Eigen aan deze boom": the role's family when it is not a library family -- uploaded, or hand-made like the first Tree's Open Sans | nothing: it is the current choice |
| `fontUpload`, "Upload a font file…" / "Een lettertypebestand uploaden…", last | the file picker; then 37.4 |

A role's entry **is** library family X when its `family`, its `files` (name, weight, style)
and its `licence` equal what `use-library-font` writes for X; anything else is the Tree's own.
A library family shows its licence, fixed, and no other control. The Tree's own family keeps
33.8's controls: its name (a new name held to 37.4's `fontNameTaken`) and licence edited,
files added and removed. Choosing a library family is refused with `fontNameTaken` (37.4),
before anything is sent, when the other role's family has that family's name and is not that
library family -- the first Tree's headings, say, while its running text keeps its own Open
Sans: the library's `400 700` would overlap the other set's faces under one name.

### 37.3 `use-library-font`

`PATCH /admin/api/trees/<t> { op: 'use-library-font', role: 'body' | 'heading', family: '<library id>' }`
(22.1, 22.2), permitted by 21.2's `edit`:

1. The family's two WOFF2 files are copied into `$ELSA_DATA_DIR/trees/<t>/theme/` under
   22.6's name -- `<stem>-<first 8 hex of the SHA-256>.woff2`, so `open-sans-normal-a01904f4.woff2`
   -- each checked against `tree-format.md` 3.6 and resolved inside `theme/`, by the atomic
   writer; a file already there with that name is the same bytes and is not written again.
2. Its `OFL.txt` is copied beside them as `<library id>-licence.txt`, which the Theme does not
   name and the theme route never serves (5.5).
3. The role's entry of `theme.fonts` becomes `{ family, role, files: [{ file: <normal copy>,
   weight: "400 700", style: "normal" }, { file: <italic copy>, weight: "400 700", style:
   "italic" }], licence: "SIL Open Font License 1.1 (https://spdx.org/licenses/OFL-1.1.html)" }`,
   replacing that role's previous entry; `body` stays before `heading`; `theme` and `fonts`
   are created when absent.
4. The draft is validated and answered as any write (22.3). An unknown family or role is 422
   with V-THEME, before anything is copied.

The files then belong to the Tree like an upload's: served under its id once published (5.5,
18.1), taken along when it moves (17.4), and left in `theme/` when another family replaces
them, as 33.8's "Not done" already says of a replaced font.

### 37.4 An uploaded family's name

`fontUpload` sends the chosen file through `POST /admin/api/trees/<t>/theme` (22.6's rules,
unchanged), which answers `201 { file, family? }`. `family` is the font's own family name, read
by `woff2FamilyName` (`src/store/woff2.ts`, pure): the WOFF2 table directory walked, the table
stream decompressed with Node's Brotli -- never past the header's `totalSfntSize` and never past
64 MiB -- and the `name` table's typographic family (name ID 16), else its family (name ID 1),
from the Windows Unicode records only, English (`0x0409`) first; trimmed; and given only when
it is 1 to 64 characters with none of 13.3's refused characters. Any malformation answers
`null`, and so does a font whose family name is in Macintosh records only; the route then
answers no `family`, and the name field stays empty for the creator to fill. The four library
files answer "Open Sans", "Roboto", "Atkinson Hyperlegible Next" and "Faustina" (Faustina by
name ID 16; its ID 1 is "Faustina Light", the name of its upstream default instance).

Under the dropdown the panel then shows what the new family needs: the name field holding that
name (or empty, with its placeholder), the licence dropdown (37.5), the file's weight and its
style (33.8), and `addFont`. The name is at most 64 characters, refused at the field when it
holds one of 13.3's characters, and refused with `fontNameTaken` ("The other role uses this
name for other files." / "De andere rol gebruikt deze naam voor andere bestanden.") when the
other role's family has that name and other files, because one name with two sets of files is
one family to the browser. The family is written, as 33.8's part, when the name and the
licence are given; the dropdown then shows it under `fontOwnGroup`.

**The Tree's own family, renamed** in 33.8's name field, is held to the same rule: a name the
other role's family has, with other files, is refused with `fontNameTaken` at the field,
before anything is sent. A write that keeps a role's name is never refused for it. The first
Tree's two roles share "Open Sans" over disjoint files (400 and 600 for running text, 700 for
headings), and they stay editable as they are (`ADR-171-font-dropdown.md` decision 6).

### 37.5 The licence dropdown

For the Tree's own family, a native `<select>` in place of the licence line:

| Shown | Stored in `licence` |
|---|---|
| SIL Open Font License 1.1 | `SIL Open Font License 1.1 (https://spdx.org/licenses/OFL-1.1.html)` |
| Apache License 2.0 | `Apache License 2.0 (https://spdx.org/licenses/Apache-2.0.html)` |
| Ubuntu Font Licence v1.0 | `Ubuntu Font Licence v1.0 (https://spdx.org/licenses/Ubuntu-font-1.0.html)` |
| Bitstream Vera Font License | `Bitstream Vera Font License (https://spdx.org/licenses/Bitstream-Vera.html)` |
| MIT License | `MIT License (https://spdx.org/licenses/MIT.html)` |
| Creative Commons Zero v1.0 Universal | `Creative Commons Zero v1.0 Universal (https://spdx.org/licenses/CC0-1.0.html)` |
| `licenceOther`, "Another licence…" / "Een andere licentie…" | the free line under the dropdown, as 33.8 had it: required, at most 200 characters |

The names are SPDX's (licence list 3.29.0), the same in every language; each stored string is
the name and the address of the licence's text, as 4.3.2 asks. The select shows the entry whose
stored string equals the family's `licence` exactly, and "Another licence…" with the string in
its field for anything else, so a hand-made line such as the first Tree's `SIL Open Font License
1.1 (theme/ofl-open-sans.txt)` is shown and kept as written. A creator who cannot state a
licence has nothing to choose: 4.3.2's rule stands, and #180's hint says so. A library family's
licence is the `OFL-1.1` string, fixed.

### 37.6 Tests (#180)

| File | Asserts |
|---|---|
| `tests/fonts.test.ts` | every file of `FONT_LIBRARY` is in `fonts/<id>/` with its SHA-256; every file in `fonts/` is listed, an `OFL.txt` or the README; every name passes 3.6's font grammar; every licence id is in `FONT_LICENCES`; every stored licence string is at most 200 characters and ends with its SPDX address |
| `tests/store/woff2.test.ts` | the four library files answer their names; a truncated file, a file of zeros and a WOFF2 without a `name` table answer `null` |
| `tests/store/drafts.test.ts` | `use-library-font` copies the two files and the licence text and writes the entry of 37.3; choosing it twice writes the same bytes; it replaces the role's entry and keeps `body` before `heading`; an unknown family is 422 and copies nothing; a collaborator may, a reader without a role may not (21.2) |
| `tests/browser/theme-panel.spec.ts` | the two selects and their entries; choosing a library family is seen at once in the editor and, after publishing, the public page fetches it from the Tree's own address (`theme.spec.ts`'s same-origin rule holds); an upload proposes the font's name, takes a licence from the list and from "Another licence…", and refuses a name the other role uses for other files; choosing the library's Open Sans for the first Tree's headings is refused the same way, with nothing sent; renaming a Tree's own family to the other role's name is refused the same way, and an edit that keeps the first Tree's shared name is not; the first Tree's hand-made line shows as "Another licence…" |
| `tests/browser/no-scroll.spec.ts` | one row more: the full-node fixture with each library family set in both roles, at 1280 x 640 and 360 x 640, in `en` and `nl` -- the browser's proof of 37.1's width rule |
| the release | #180's pull request lists `.next/standalone/fonts/` after `npm run build`, and pastes the hashes it committed against `ADR-171-font-library.md` decision 3 |

## 38. Logging in by e-mail address

**[#195], new -- 2026-10-03.** The owner, in #194: "To login should be based on an email and a
password". An account logs in with an e-mail address and its password, in place of the user
name of 20.1, and so does the administrator: the owner's words make no exception (core
document 3.4 `[#194]`, 10.32). The application still sends no mail (core document 7, 10.31):
the address is what a person types to log in, and nothing is ever sent to it. Decides core
document 10.39. Recorded in `docs/adrs/ADR-195-login-by-email-address.md`,
`ADR-195-administrator-address.md`, `ADR-195-accounts-without-an-address.md` and
`ADR-195-who-sees-and-changes-an-address.md`. Built by #196. Where an earlier section says
`login`, this section holds; each such section carries a **[#195]** mark that points here.

### 38.1 The address

- **`email` replaces `login`** in `Account` (38.2), in the change `update` applies, in every
  body and answer of 22.1 that named it, and on the screens of 25. The field is named for what
  it holds.
- **What counts as an address: the browser's own check.** A string that, after the value
  sanitisation of the HTML Standard's `<input type="email">` -- every line feed and carriage
  return removed, leading and trailing ASCII white space stripped -- matches that standard's
  *valid e-mail address* (WHATWG HTML, "E-mail state"):

  ```
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  ```

  and is **at most 254 characters**, the longest address a 256-octet SMTP path carries (RFC
  5321 4.5.3.1.3, as RFC 3696 erratum 1690 states the limit). Nothing else is required of it:
  no dot in the domain, no known top-level domain, no lookup, no limit of its own on the part
  before the `@`. The pattern is ASCII, so every address is.
- **Lower-cased on entry, then compared byte for byte.** Every upper-case ASCII letter is
  lowered wherever an address is given -- a creation, a change, `ELSA_ADMIN_EMAIL` (38.3), a
  login -- so `Idse.Val@WUR.nl` and `idse.val@wur.nl` are one address, stored once, in the
  second form.
- **One account per address**, deactivated accounts included: an address names one account,
  and a deactivated account may be reactivated with it (20.1). An address another account
  holds is refused, 422 `email-taken` at the field.
- **One function holds the rule**: `normaliseEmail(input: unknown): string | null` in
  `src/store/accounts.ts`, pure, answering the sanitised, lower-cased address or `null`.
  `create`, `update`, the start's reading of `ELSA_ADMIN_EMAIL` and `authenticate` call it;
  nothing else checks an address, and a string it answers `null` for names no account.
  `normaliseLogin`, the id grammar it held a login to, and `ADMIN_LOGIN` go.

| Given | `normaliseEmail` answers |
|---|---|
| `idse.val@wur.nl` | `idse.val@wur.nl` |
| ` Idse.Val@WUR.nl ` (white space around it), or with a line break inside it | `idse.val@wur.nl` |
| `anna+trees@example.org`, `o'brien@example.org` | the same |
| `bram@localhost` (no dot in the domain) | the same |
| an address of 254 characters | the same, lower-cased |
| an address of 255 characters | `null` |
| `admin`, an empty string, a number, `null` | `null` |
| `anna@`, `@example.org`, `anna@@example.org` | `null` |
| `anna b@example.org`, `"anna b"@example.org` | `null` |
| `anna@-example.org`, `anna@exa_mple.org`, `anna@example..org` | `null` |
| `jürgen@example.de`, `anna@exämple.org` | `null`: not ASCII |

### 38.2 The interface and the routes

20.1's record and 20.4's interface, as #196 leaves them (`src/store/accounts.ts`):

```ts
interface Account {
  id: string               // unchanged
  name: string             // display name, 1 to 80 characters, one per account (38.6); shown in the
                           // admin area and, for an Author, on its Trees' public pages (39.8)
  email: string | null     // 38.1; null only on an account a converted store left without one,
                           // until the administrator gives it one (38.4)
  passwordHash: string     // unchanged (20.2)
  active: boolean          // unchanged
  administrator: boolean   // unchanged (20.3)
  createdAt: string        // unchanged
}

export interface Accounts {
  authenticate(email: string, password: string): Promise<Account | null>  // scrypt runs either way (20.2);
                                                                          // never answers an account whose email is null
  get(id: string): Account | null
  byEmail(email: string): Account | null    // in place of byLogin: the account a typed address names,
                                            // active or not, for a lock's log line (38.8)
  all(): Account[]                          // as built by #135: every account, for the accounts page (25.3)
  listActive(): Pick<Account, 'id' | 'name'>[]   // 21.4: no address (38.5)
  create(by: Account, name: string, email: string, password: string): Promise<Account>
  update(by: Account, id: string, change: { name?: string; email?: string; active?: boolean;
                                            password?: string; currentPassword?: string }): Promise<Account>
  readonly adminPasswordReplaced: boolean   // as built by #135, unchanged
}
```

`AccountError`'s codes `email-invalid` and `email-taken`, at the field `email`, replace
`login-invalid` and `login-taken` at `login`; `name-taken` (38.6) joins them, at `name`.

| Method and path | Takes | Answers |
|---|---|---|
| `POST /admin/api/login` | `{ email, password }` | As before: 204 and the cookie; 401; 429; the two refusals with one body (20.7) |
| `GET /admin/api/me` | -- | `{ id, name, email, administrator }`: the caller's own address |
| `GET /admin/api/accounts` | -- | `[{ id, name }]`, every active account, to any logged-in account (38.5) |
| `POST /admin/api/accounts` | the administrator: `{ name, email, password }` | 201, the account without its hash; 422 at `name` (`name-length`, `name-taken`), at `email` (`email-invalid`, `email-taken`) or at `password` (`password-length`) |
| `PATCH /admin/api/accounts/<id>` | the administrator: `name`, `email`, `active`, `password`; the holder: `name`, and `password` with `currentPassword` | 200, the account without its hash; 403 at `email` when anyone but the administrator sends it, the holder included; 422 as above |

Every answer that carried `login` carries `email` in its place, but `GET /admin/api/accounts`,
which carries neither. A body that still sends `login` sends no address: the login answers 401
and a creation 422 `email-invalid`.

### 38.3 The administrator's address

**`ELSA_ADMIN_EMAIL`**, an environment variable read **at every start**, as
`ELSA_ADMIN_PASSWORD` is (20.3), checked and lower-cased by `normaliseEmail`:

| The store holds | `ELSA_ADMIN_EMAIL` | The start |
|---|---|---|
| no administrator | set, with `ELSA_ADMIN_PASSWORD` | creates the administrator with that address and that password |
| no administrator | absent, or the password absent | **refuses to start**, naming each variable that is missing |
| an administrator without an address: a store of user names (38.4) | set | gives it that address |
| an administrator without an address | absent | **refuses to start**: `ELSA_ADMIN_EMAIL is not set and the administrator has no e-mail address: set it to the address the administrator will log in with (docs/deployment.md)` |
| an administrator with an address | set to another | **replaces** it: the recovery of a forgotten address, as the password's -- set, restart, log in, remove |
| an administrator with an address | set to the same, or absent | changes nothing |
| any | set to a value that is not an address (38.1), or to another account's address | **refuses to start**, saying which of the two, without the value |

- **The log names the variable, never its value**: `administrator e-mail address set from
  ELSA_ADMIN_EMAIL; remove the variable` when the start gave or replaced the address, beside
  the password's line of 20.3.
- **Removed after the first start, like the password.** It is not a secret, but while it is
  set it wins at every start over a change made on the accounts page (38.5), which is what
  makes it the way back. `docs/deployment.md` says to remove both and to set the address again
  only to recover it (38.9).
- **The account itself is unchanged**: one account, `administrator: true`, display name
  `Administrator` at creation, the flag set by the server alone and never by a request.
- **No address in the repository is a real one.** `deploy/elsa-decisiontree.env.example` names
  the variable and leaves it empty, as it leaves the password; every server a test starts sets
  `ELSA_ADMIN_EMAIL=admin@example.org`, a domain RFC 2606 reserves for examples (38.10).
- **The live demo server's address is the owner's to choose.** That server, the production
  build of `dev` at http://petercelie:3000, holds one account, the administrator, with the
  user name `admin` (measured on #194). The first start of a release that carries #196 refuses
  there until the variable is set. #198 asks the owner for the address on #198, with
  `needs-human`, before it brings the server to that release, and never chooses one itself.

### 38.4 A store of user names

Every store written before #196 holds a `login` per account and no address. At every start,
before anything reads an account, `openAccounts` converts each record that holds `login` and
no `email`:

- the administrator's `email` becomes `ELSA_ADMIN_EMAIL`'s, which the start requires for it
  (38.3, the fourth row);
- every other account's becomes `null`: no setting can give it its address, and none is
  invented;
- `login` is removed from every record; `id`, `name`, `passwordHash`, `active`,
  `administrator` and `createdAt` stay as they were.

The file is written once, atomically (17.3), and a later start finds nothing to convert. The
start logs, ids and counts only (38.8): `accounts.json converted from user names to e-mail
addresses: <n> accounts, <m> without an address`.

**An account without an address cannot log in, and is otherwise whole.** `authenticate` never
answers it, so an attempt for it is a 401 like any other. It stays active, keeps its roles on
every Tree, is in `listActive` and so can be invited, and a session it held before the upgrade
stays valid until it expires (20.4): a session names an account, not a login. Every start
logs, while it has none, `account <id> has no e-mail address: give it one at /admin/accounts`.

**The way back**, every one written in `docs/deployment.md` (38.9): for an account without an
address, the administrator gives it one on the accounts page, where it is marked `noEmail`,
through `setEmail` (38.5), and tells its holder, who logs in with that address and the password
they had. For the administrator, `ELSA_ADMIN_EMAIL`, without which the start refuses and names
it. The user names are not kept, so a deployer backs the data directory up before that first
start.

On the live demo server the conversion meets one account, the administrator, so it gives that
account `ELSA_ADMIN_EMAIL`'s address and leaves no account without one.

### 38.5 Who sees an address, and who changes it

- **Who sees one.** Its **holder**: on the account page, and in `GET /admin/api/me`. The
  **administrator**: every account's, on the accounts page, and in the answers of `POST
  /admin/api/accounts` and `PATCH /admin/api/accounts/<id>`. **Nobody else**: `GET
  /admin/api/accounts` answers `{ id, name }`; the invitation and hand-over selects of 33.4 and
  33.6 show names; no public route and no log line holds one (38.8, 39.8).
- **Who changes one: the administrator alone**, for every account, its own included. A row
  action `setEmail` on the accounts page opens a Sheet titled `setEmail` with one field,
  `email`, holding the current address (empty for `noEmail`), and `save` sends `PATCH
  /admin/api/accounts/<id> { email }`; a 422 `email-invalid` or `email-taken` is shown at the
  field. No current password is asked: the administrator sets an address as it sets a password
  (25.3). The server refuses `email` from any other account, the holder included: 403 at
  `email`. `ELSA_ADMIN_EMAIL` also sets the administrator's at a start (38.3).
- **A change of address ends no session** and changes nothing else: a session belongs to an
  account, and the password is unchanged (20.4). It is logged as every account change is,
  `account <id> changed (email) by account <id> at <time>`: the word, never the value.
- **The account page (25.2)**: in the password card, above its fields, the line
  `signedInWith(email)` -- "You sign in with <address>." / "U logt in met <adres>." -- one
  line, cut with an ellipsis where it does not fit and marked `data-clamp`, which
  `admin-no-scroll.spec.ts`'s walk skips (10.6), with the whole address as its `title`; for
  a converted account without an address, `noEmail` there instead; under it `emailHelp`, "Ask
  your administrator to change it." / "Vraag uw beheerder om het te wijzigen.". The hidden
  `username` field of the password form holds the address, so a password manager files the new
  password under it; it is empty for an account without one.
- **The accounts page (25.3)**, per row: the name; the address, one line cut with an ellipsis
  and marked `data-clamp`, with the whole address as its `title`, or `noEmail` in `text-muted`;
  the state; and the
  actions -- `deactivate` / `reactivate`, `setPassword` and `setEmail` on every row but the
  administrator's, `setEmail` alone on the administrator's. `setPassword`'s Sheet names the
  account by its name where it named it by its login. The new-account Sheet asks for
  `displayName`, `email` and `password`.
- **The address field**, wherever one is typed -- the login page, the new-account Sheet, the
  `setEmail` Sheet -- is `type="email"`, with `autocapitalize="none"` and `spellcheck="false"`,
  in a form marked `noValidate`: the browser's own message about a value that is not an
  address, in the browser's language, never stands in for the line the screen shows. On the
  login page the field's `autocomplete` is `username`; in the two Sheets it is `off`.

### 38.6 One account per name

- **No two accounts, active or not, carry one name.** With no address in the invitation list, a
  name is what tells two accounts apart, and the public mention names Authors by these names
  (39), so it never names two people alike either.
- **Names are compared by a key**: `name.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()`,
  so "Anna de Vries" and "anna  de vries" are one name. A name is still stored as given,
  trimmed (20.1).
- **A creation or a rename** -- the holder's on the account page, the administrator's through
  `PATCH` -- that gives an account a name whose key another account's name has is refused,
  422 `name-taken` at the field. A change that keeps an account's own name is never refused.
- **A converted store** (38.4) whose accounts share a name is left as it is: nothing is
  renamed; every start logs `accounts <id> and <id> share a name: give one of them another`
  while they do; every name given from then on is held to the rule.

### 38.7 The rate limit

20.7, restated for an address. **Per address typed**: the first counter is keyed by the string
the request carries in `email`, trimmed and lower-cased -- whether or not it is an address, and
whether or not an account holds it -- so five consecutive failures on one address lock it for
15 minutes, a success resets, and an attempt on an address no account holds counts exactly as
one on an address an account holds. **Per deployment**: unchanged, more than 60 failed logins
in one minute lock the route for one minute. A lock is 429, a wrong address or password 401,
both with the same body. Still **not per client address**. Counting per account was rejected:
an attempt on an unknown address would count nothing, and a lock that falls on a known address
but never on an unknown one says which exists, which the one body was built never to say.

### 38.8 The log

20.8, restated for an address. A failure is `login failed for account <id>` or `login failed
for an unknown address`; a lock `login locked for 15 minutes for account <id>` or `login locked
for 15 minutes for an unknown address`; a success `account <id> logged in`, as before. **Never
an address**: not the address typed, not an account's -- the administrator's included -- in any
line, at any level. An account change names the fields it changed, `email` among them, never
their values (38.5); the start names `ELSA_ADMIN_EMAIL`, never its value (38.3), and counts and
ids, never an address (38.4, 38.6). 20.8's list of what is never logged gains "an e-mail
address".

### 38.9 What a deployer reads

#196 changes, with the code it changes:

- **`docs/deployment.md`**: the configuration table gains `ELSA_ADMIN_EMAIL` beside
  `ELSA_ADMIN_PASSWORD` -- required at a first start and at the first start of the release
  that carries #196, read at every start, removed afterwards, the log line of 38.3 -- and the
  table at the top, step 4 (the environment file) and "A container" (the first run's
  `--env-file`) name it with the password. "The administrator and the login" says that the
  administrator logs in with the address `ELSA_ADMIN_EMAIL` gave it; that every other account is
  made with a display name, an e-mail address and a first password, and that the administrator
  changes an address at `/admin/accounts` and the holder does not; how a forgotten
  administrator address is recovered (set, restart, log in, remove); that five wrong passwords
  for one address lock that address; and that the journal says "an unknown address" and never
  holds an address. "Putting a new version of the application on the server" says what the
  first start of the release does to an existing store (38.4) before it happens: back up the
  data directory, since the user names are not kept; set `ELSA_ADMIN_EMAIL`, without which the
  start refuses and the public pages stay down until it is set; read the lines the start logs;
  give every account they name an address at `/admin/accounts`, and tell each holder; remove
  the variable. "When it does not start" quotes the refusals of 38.3.
- **`deploy/elsa-decisiontree.env.example`**: `ELSA_ADMIN_EMAIL=` beside `ELSA_ADMIN_PASSWORD=`,
  empty, with a comment in the style of the password's.
- **The `Dockerfile`**'s comment on the first run's `--env-file`, and **`README.md`**'s commands
  for a first start, name both variables; "log in as `admin`" becomes "log in with that
  address".
- **`src/config.ts`**'s `Environment` names the variable.

### 38.10 Tests (#196)

| File | Asserts |
|---|---|
| `tests/store/accounts.test.ts` | `normaliseEmail` on every row of 38.1's table; `create` lower-cases and refuses `email-invalid`, `email-taken` (also for an address a deactivated account holds) and `name-taken` (38.6's key: case, NFC and white space); `update`'s `email` from the administrator, and 403 from the holder; a change of address ends no session; `authenticate` by address in any case, and `null` -- scrypt run each time -- for a user name, for `admin` and for an account whose `email` is `null`; `listActive` answers `id` and `name` and nothing else; 38.3's table row by row, each refusal naming its variable and never its value; 38.4 on a directory written as `dev` writes it before #196 -- the administrator `admin` and two accounts with user names that share a name -- with its log lines, 38.6's included; a second start converts nothing and leaves the file's bytes as they were |
| `tests/store/login-limit.test.ts` | its counters, keyed by the address typed: five failures on `Anna@Example.org ` lock `anna@example.org` |
| `tests/browser/login.spec.ts` | the login page logs in by address through the page, in `en` and `nl`; a wrong password and an unknown address show the same `loginFailed`, the address kept and the password cleared; the old user name, `admin` included, is refused with the same line; five failures on one address lock it, also on an address no account holds; the account page's address line and `emailHelp`; the accounts page's address column, `noEmail` and `setEmail`; the server's output holds no address (20.8, 38.8) |
| `tests/browser/admin-api.spec.ts` | `GET /admin/api/me` answers `email`; `GET /admin/api/accounts` answers `{ id, name }` and no `email`; `POST` and `PATCH` on the accounts as 38.2, the holder's `email` 403 |
| `tests/browser/panel.spec.ts` | the invitation and hand-over selects show names only |
| `tests/browser/admin-no-scroll.spec.ts` | the account page holding an address of 254 characters; the accounts page with the `setEmail` Sheet open; at its ten viewports |
| `tests/browser/deployment.spec.ts` | logs in by address; 20.5 and 35.5 hold unchanged |
| every test that logs in | `tests/browser/admin.ts`: `buildDataDir`'s accounts carry `email`, and `login(page, origin, email, password)` posts `{ email, password }`; 35.3's accounts log in as `admin@example.org`, `anna@example.org`, `bram@example.org` and `cees@example.org`; every server a test starts -- `playwright.config.ts`, `playwright.first-tree.config.ts`, `tests/browser/serve.ts`, `tests/store/admin.ts`'s `ADMIN` and `tests/browser/admin.ts`'s `ADMIN_ENV` -- sets `ELSA_ADMIN_EMAIL=admin@example.org` beside its password. `git grep -n "login" -- tests` and `git grep -n "'admin'" -- tests` find them |

#196's pull request pastes, each from a command, the accounts of a copy of a store written by
`dev` before #196 -- its administrator among them -- before the first start of the new
release, after it, and those of them that log in with an address.

## 39. Who authored a Tree: the Authors and the mention

**[#195], new -- 2026-10-03.** The owner, in #194: "graphs should have a small mention by who
it was authored, if multiple collaborators in the order in which they joined a
decision-tree." "Graph" is one of the owner's words for a Tree (core document 5). This reverses,
for that mention and nothing else, the rule of core document 8 and 9 that nothing about a
creator reaches a public page (39.8). Decides core document 10.40 and the row **Author** of its
section 5. Recorded in `docs/adrs/ADR-195-authors.md`, `ADR-195-order-of-joining.md`,
`ADR-195-the-mention.md` and `ADR-195-names-on-public-routes.md`; the room the mention has was
measured on `dev` and is recorded in `docs/research/issue-195-measurements.md`. Built by #197,
after #196.

### 39.1 Who is named

- **The Authors of a Tree are the accounts that hold a role on it now** -- its creator and each
  of its collaborators (21.1) -- **except the administrator**, **in the order in which each
  first joined the Tree** (39.2). This is core document 3.4 `[#194]`'s PROPOSED reading,
  confirmed, with one precision: the account that made the Tree comes first while it is on the
  Tree, and keeps that place after it hands the Tree over.
- **A collaborator removed is no longer named.** The mention names the team the Tree has; the
  creator and the administrator decide who is on it (21.2). Invited again, the account is
  named in the place it first joined, not at the end.
- **A deactivated account is named while it holds its role.** Deactivating decides who may log
  in, not who wrote the Tree (20.1: "its Trees stay"). A name comes off a Tree the way a role
  does: the panel's remove cross for a collaborator (33.4); for a creator, a hand-over, after
  which it is a collaborator that can be removed (21.4).
- **The administrator is never named**, whatever role a `meta.json` gives it: the creator the
  seed and the import command name (17.1, 17.4), the creator of a Tree created while logged in
  as the administrator, or a collaborator after it hands such a Tree over (21.4). A Tree whose
  only role holder is the administrator names nobody, and shows no mention, until it is handed
  to the account of a person who authored it (21.4, 33.6) -- on the live demo server, each of
  its three Trees.
- **Each Author is shown by its account's `name` alone**: never its address, its id, its role
  or when it joined. Names are one per account (38.6), so no two Authors look alike.
- **The row Author of core document 5 is this one**: an account. Every account but the
  administrator's that writes a Tree's content in the editor holds a role on it, so for a Tree
  made in the editor the Authors are its authors in the sense of core document 1, 2 and 3.1. A
  Tree whose content came as files -- the seed, an import, another lab's Tree moved in (17.1,
  17.4) -- has authors with no account here, and names none until it is handed to the account
  of one.

### 39.2 The order of joining: `joined`

`meta.json` gains **`joined: string[]`** (17.2): the id of every account that has been the
Tree's creator or one of its collaborators, in the order in which each first became one.

| When | `joined` |
|---|---|
| A Tree is created in the editor (`create`, 27.2) | `[creator]` |
| The seed or the import command copies a Tree in (`importTree`, 17.4) | `[creator]`, the account it names; `[]` when it names none (a test's import), until the start names the administrator and fills it in (below) |
| A collaborator is invited (`addCollaborator`) | its id appended, unless already there |
| A collaborator is removed (`removeCollaborator`) | unchanged |
| A Tree is handed over (`handOver`) | the new creator's id appended, unless already there; the old creator's stays where it is |
| Anything else | unchanged |

- **An id is never removed and never moved.** `joined` holds every id of `creator` and
  `collaborators`, and may hold more: those that held a role once. It is written by the same
  write as the role change it records, through the Tree's queue (17.3).
- **`collaborators` keeps its meaning**: who is a collaborator now, in the order of
  invitation, with 21.4's hand-over rule. The panel reads it as before (33.4).
- **At every start**, after `nameCreator` names the administrator where a `meta.json` names no
  creator (17.4) and before any Tree is opened: a `meta.json` without `joined` -- every Tree of
  a store written before #197 -- or with a `joined` that is not an array of strings gets one,
  the creator, then the collaborators in their list's order, each once; and any id of `creator`
  or `collaborators` that a `joined` lacks is appended to it in that order, so a store seeded
  before accounts existed (#134) and a hand-edited file come out whole. The file is rewritten
  atomically (17.3) only when this changed it, and nothing else in it moves -- `updatedAt`,
  `updatedBy` and `revision` stay, since no creator wrote. One log line per Tree it changed:
  `Recorded the order of joining of Tree "<id>" from its roles: <n> accounts`. A Tree folder
  without a `meta.json` is read with today's defaults (the administrator as creator) and
  `joined` `[creator]`, which names nobody.
- **What that gives an existing Tree.** A Tree never handed over: the creator first and the
  collaborators in the order they were invited, which is the order of joining, since an
  invitation is the joining. A Tree handed over before #197: the current creator first and the
  old one where 21.4 put it, at the end -- the store never recorded more, and nothing reorders
  `joined` afterwards. On the live demo server each of the three Trees gets `[<the
  administrator's id>]`, and names nobody (39.1).
- `TreeMeta` (`src/store/permissions.ts`) gains `joined`, so `TreeEntry.meta` carries it to the
  admin area, ids only; no screen shows it.

### 39.3 `authorsOf`

```ts
// src/store/authors.ts, pure
export function authorsOf(
  meta: Pick<TreeMeta, 'creator' | 'collaborators' | 'joined'>,
  accounts: Pick<Accounts, 'get'>,
): string[]
```

The names, in `joined`'s order, of its ids that are the creator or a collaborator now, whose
account exists and is not the administrator. It is the whole rule of 39.1; nothing else decides
who is named. The store's `authors(id)` calls it for the public routes (39.8); the creators'
overview calls it for the Trees the caller has a role on, with each one's `TreeEntry.meta`, a
hidden Tree's included, and `store.authors(id)` for the other published Trees, as `/` does.

### 39.4 The mention in the chrome bar

- **The words**: `byAuthors(names)` (3.2) -- "By Anna de Vries", "By Anna de Vries and Bram
  Jansen", "By Anna de Vries, Bram Jansen and Cees Bakker"; in Dutch "Door Anna de Vries",
  "Door Anna de Vries en Bram Jansen", "Door Anna de Vries, Bram Jansen en Cees Bakker": the
  names in the order of 39.1, a comma between all but the last two, which "and" / "en" joins.
  Chrome, in the chrome language (3.1), so the element carries that language's `lang` where the
  page's content language is another (`chromeLang`, as the disclaimer); the names as their
  accounts hold them, plain text.
- **Where**: every public Node page of a published Tree that has an Author, in the chrome bar,
  between `.page-brand` -- the way back to the overview and the Tree's mark, its logo or its
  title as text -- and `.page-controls` -- the language switch and the share button (24.3).
- **How**: `<div class="authors-room"><p class="authors" data-clamp title="<the whole
  text>">…</p></div>`, drawn by `src/components/Authors.tsx`, a server component. The room is
  a flex item that takes the bar's free space (`flex: 1 1 0; min-width: 0`) and is a size
  container (`container-type: inline-size`); its own negative left margin cancels the bar's
  gap and the line's left margin gives it back, so the room takes no pixel when it holds
  nothing, and the mark and the controls stand where they stand on the same page without it.
  The line: one line in `text-muted`, `--small` (13 pixels on 20, the size of a Tree's title
  written in the bar as text), and below 480 pixels wide 11 on 14, where the bar's pills are 11
  and its gap 8; `white-space: nowrap`, cut with an ellipsis where the room ends.
- **When the names do not fit**: the line is cut, and the cut takes the last to join; no count
  is shown and nothing is reordered. Its whole text is the `title`, and a screen reader reads
  the whole text. **Where the line's room is under 80 pixels it is not drawn at all**, so that
  no "By…" stands alone: `@container (width < 96px)` hides it at 480 pixels wide and above,
  where the bar's gap is 16, and `(width < 88px)` below, where it is 8. "Door Idse Val" is 76
  to 80 pixels at 13 in the faces measured. Container queries are already in the stylesheet,
  for the label beside the strip's `+` in the editor (31.1).

```
+--------------------------------------------------------------------------------+  44
| (<) [logo]  By Anna de Vries, Bram Jansen and Cees Bakker   [language] [share] |
+--------------------------------------------------------------------------------+
 16  30 10 120 16 |<---- the mention's room: 809 ---->| 16 |<---- 247 ---->| 16  = 1280
```

(The first Tree in English at 1280 x 640: the three names take 289 of the 809.)

- **What that gives at the viewports of 10.6**, measured on `dev` (the research record, section
  2): beside a 120-pixel logo the mention is drawn at every viewport from 768 x 1024 up --
  three names whole at 1280 x 640 in both languages and at 768 x 1024 in English, cut there in
  Dutch -- and not drawn at 390 x 844 and 360 x 640, where 30 to 75 pixels are left. Beside an
  80-character title it is drawn at 1024 x 768 and above and not below. At and below the floor
  the notice stands in for the page (10.4). On a phone a reader meets the Authors on the Tree's
  tile (39.5).
- **Without JavaScript** the mention is the server's markup and its rules are the
  stylesheet's: there is nothing to run (14).
- **A Tree without an Author** -- one whose only role holder is the administrator -- has no
  element at all: its bar is what it is today.

### 39.5 The mention on a tile

- **Where**: the Tree's tile on the public overview and on the creators' overview (26.1, 26.4),
  in its bottom row, after the language tags and before the creators' state mark.
- **How**: `<span class="tile-authors-room"><span class="tile-authors" data-clamp title="<the
  whole text>">…</span></span>`, the words of 39.4, at the tags' type -- 11 pixels on 16 -- in
  `text-muted`; a size container taking the row's free space, its negative margin cancelling the
  row's gap of 4, so the tags and the state mark stand where they stand without it; one line,
  cut with an ellipsis, and not drawn where its room is under 80 pixels (`@container (width <
  84px)`, the gap included). Where the tile carries
  the Tree's language in `lang` (23.2), the mention carries the chrome language's, as the state
  mark does.

```
+--------------------------------+   +--------------------------------+
| [logo]                         |   | [logo]                         |
| Does the EU AI Act apply to    |   | Does the EU AI Act apply to    |
| my agrifood AI system?         |   | my agrifood AI system?         |
| A decision tree for the ...    |   | A decision tree for the ...    |
| EN NL  By Idse Val             |   | EN NL  By Idse Val  o Published|
+--------------------------------+   +--------------------------------+
               on /                              on /admin
```

- **Measured** (the research record, section 3): the row is 248 pixels at every viewport; after
  two tags 187 are free on `/`, and 107 to 125 beside the creators' state mark. One name is
  whole on both overviews at every width; three are cut.
- **A Tree without an Author** has no element: its tile is what it is today.

### 39.6 The no-scroll rule

The cut line is the design, not an overflow. `no-scroll.spec.ts`'s element walk skips
`.page-chrome [data-clamp]` as it skips `[data-scroll-box] [data-clamp]`, which already covers
the tiles' mention inside the grid's scroll box (26.3); `admin-no-scroll.spec.ts` skips every
`[data-clamp]` already. The walk still checks the bar and everything else in it, and #197's
`authors.spec.ts` checks the mention itself (39.9). Nothing changes in the rows of 10.1 or in
the Bubble, and 10.7's limits stand.

### 39.7 Nowhere else

- **Not in the editor**: its bar is the editor's own interface (24.3, #180), its right side the
  editor's controls, and the panel's Collaborators section lists the same accounts (33.4).
  34.5 lists it among what edit mode does not render.
- **Not on the 404 and 403 pages.**
- **Not in `tree.json`**: 17.2 stands, the file carries no name, and its format stays
  `elsa-tree/5`; 15.3's byte-identity is unchanged. A list of authors in the file was rejected:
  a format change for a mention the owner asked to see on the Tree; a Tree moved to another
  deployment (17.4) would carry the source's account names into a store whose accounts they are
  not; and every rename would change the dataset's bytes and its `version` (19.6).
- **Not in the JSON-LD**: 16.4's `creator` stays the Organization, and no `author` and no
  `Person` is added. A machine-readable claim about who wrote a dataset is what search engines
  and dataset indexes harvest and keep, and the owner did not ask for one.
- **Not in `llms.txt`** (16.5, 23.5), the sitemap (16.2, 23.4), a `<meta name="author">`, a
  header or an image's text.

### 39.8 What about an account reaches a public route

- **Exactly the `name` of each Author of a published, servable Tree**, in that Tree's mention
  on its Node pages and on its tile on the public overview. **Nothing else about any account**:
  no address, no id, no role, no time of joining, and no name of an account that is no Author of
  a published Tree -- the administrator's included. **A hidden Tree's names reach no public
  route**: the public overview lists published Trees only, and a hidden Tree's Node pages are
  the 404 of 23.1.
- **The store's public interface gains exactly one member that reads `meta.json` and
  `accounts.json`**: `authors(id: string): string[]` (17.5), `authorsOf` of the servable
  published Tree `id`, and `[]` for every id `published(id)` answers `null` for -- hidden,
  unservable, unknown or reserved, one case as 23.1 has it. It answers names and nothing else;
  no member answers a draft, a `meta.json` or an account.
- **The holder is told.** The account page's name card (25.2) says, under the field, on every
  account's page but the administrator's, `nameShownPublicly`: "Shown on the public pages of the
  trees you create or collaborate on." / "Wordt getoond op de openbare pagina's van de bomen die
  u maakt of waaraan u meewerkt." An account's name was the admin area's alone until this
  round (20.1).

### 39.9 Tests (#197)

| File | Asserts |
|---|---|
| `tests/store/authors.test.ts` (new) | `authorsOf`: `joined`'s order; a removed collaborator absent and, invited again, in its first place; a deactivated account present; the administrator absent as creator and as collaborator; an id of `joined` with no role now absent; an unknown account skipped; `[]` for a Tree whose only role holder is the administrator |
| `tests/store/drafts.test.ts` | 39.2's table: `create`; `addCollaborator`, twice for one account (one entry); `removeCollaborator`; `handOver` to a new account (appended once, the old creator in place) and to a collaborator (no new entry) |
| `tests/store/store.test.ts` | the start of 39.2: a `meta.json` without `joined` gets the creator and then the collaborators, with its log line; a `joined` that lacks a role holder gets it appended; a `joined` that is not an array is replaced; a complete one is not rewritten, its bytes unchanged; `updatedAt`, `updatedBy` and `revision` unchanged; `importTree` writes `[creator]`; `store.authors(id)` answers the names for a published Tree and `[]` for a hidden, an unservable, an unknown and a reserved id |
| `tests/chrome.test.ts` | `byAuthors` for one, two, three and five names, in both languages |
| `tests/browser/authors.spec.ts` (new) | the mention on a Node page and on the tiles of both overviews, in `en` and `nl`, at 10.6's ten viewports: one name and three, beside a logo and beside an 80-character title, and a Tree of eight Authors whose names do not fit; the order after a hand-over, and after a removal and a second invitation; one line, inside the bar, and the mark and the controls where they stand on the same page of a Tree without Authors; drawn, cut -- its `title` whole -- and not drawn as 39.4 and 39.5 say; no element for a Tree whose only role holder is the administrator, and none in the editor; the same markup without JavaScript; the screenshots of 35.7 |
| `tests/browser/no-scroll.spec.ts` | the walk skips `.page-chrome [data-clamp]` (39.6); one row more: the example Tree's root Node with three Authors whose names are 80 characters each, the longest 20.1 allows, at its ten viewports, in `en` and `nl` |
| `tests/browser/overview.spec.ts`, `creators-overview.spec.ts` | the tile's mention, and a tile with no Authors as before |
| `tests/browser/deployment.spec.ts` | the account sweep: a data directory whose accounts have known addresses and ids -- an Author of a published Tree, an Author of a hidden Tree only, an account with no role, the administrator -- and a walk of every public route of 4.1, 15, 16 and 23: the overview in both languages, every Node page of the published Tree in both languages, its `tree.json`, the schema, `robots.txt`, `sitemap.xml`, `llms.txt`, an image and a theme file, and the hidden Tree's root address, which is the 404. No response, headers or body, holds any account's address or id; the hidden-only Author's name is in none; the published Tree's Authors' names are in its Node pages and the overview, in each only inside the mention's element, and in no other response |
| `tests/browser/login.spec.ts` | the account page's `nameShownPublicly`, and its absence on the administrator's |
