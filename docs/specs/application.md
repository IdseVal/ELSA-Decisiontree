# Application contracts

> Status: FROZEN -- 2026-09-03 (issue #5). These are the contracts the build issues
> (loader, Node view, Trail and sharing, language switch, deployment) are built against.
> Changing one requires a new `architecture` issue. The Tree file format they consume is
> frozen separately in `docs/specs/tree-format.md` (issue #4).
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
the current Node, the query carries the language. A request reads one Node file
through the Tree loader and returns complete HTML; the browser then fetches only that
Node's images. Chrome comes in English and Dutch and follows the content language,
falling back to English. There is no database, no account, no cookie, no analytics,
and nothing the app does depends on a hosting vendor.

## 1. Framework and rendering

| Item | Contract |
|---|---|
| Framework | Next.js, App Router, React, TypeScript (strict). Exact versions are pinned in `package.json` by the scaffold issue; the current stable major at that time. |
| Server-side rendering | React Server Components. The Node page is an `async` server component; the first response to every URL is complete HTML. |
| Client-side JavaScript | React plus two client components: the thumbnail enlarge and the share button. Everything else (navigation, Trail, language switch) is links and works without JavaScript. |
| Runtime | Node.js 22 (LTS), in `.nvmrc` and `package.json` `engines`. |
| Package manager | npm; `package-lock.json` committed; `npm ci` in CI and deployment. |
| Build output | `output: 'standalone'`: `next build` yields a folder that runs with `node server.js`. |
| Configuration | Environment variables only: `PORT`, `HOSTNAME` (Next.js), `ELSA_TREE`, `ELSA_TREES_DIR` (section 2), `NEXT_TELEMETRY_DISABLED=1`. |
| Vendor neutrality | No edge runtime, no Incremental Static Regeneration, no hosted image optimisation, no fonts or scripts fetched from third parties at run time. Anything fetched at build time is vendored into the repository. |
| Headers | `poweredByHeader: false`. The app sets no cookie, ever. |
| Deployment (later issue) | A systemd unit running `node server.js` behind a reverse proxy for TLS. The app does not know the proxy exists. |

Recorded in `docs/adrs/ADR-5-framework-and-rendering.md`.

## 2. Tree selection (decides core document 10.19)

- One deployment serves **exactly one Tree**.
- `ELSA_TREE` = the Tree id, i.e. the folder name under `ELSA_TREES_DIR`.
  `ELSA_TREES_DIR` defaults to `trees` under the working directory.
- **No default.** The server refuses to start, with a message listing the Tree ids it
  found, when `ELSA_TREE` is unset, names a missing folder, names a reserved word
  (section 4.3), or names a Tree that fails validation.
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
  their own `lang` attribute.

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
| `yes`, `no` | The two Answer links. |
| `options` | Heading of the Options list. |
| `sources`, `sourceLegal`, `sourceCaseLaw`, `sourceLiterature` | Heading and the three Source kind labels. |
| `images`, `enlarge`, `close` | Thumbnails and the enlarged view. |
| `trail`, `start` | Heading of the Trail; the link to the root Node. |
| `share`, `copied` | The share button and its confirmation. |
| `language` | Label of the language switch. |
| `outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited`, `outcomeRefer` | Badge text for the four Terminal outcomes. |
| `explanationOnly` | Hint on an explanation Node that the answer is given on the previous step. |
| `disclaimer` | The permanent "not legal advice" footer. |
| `notFoundTitle`, `notFoundText` | The 404 page. |

Recorded in `docs/adrs/ADR-5-chrome-languages.md`.

## 4. URL scheme

### 4.1 Grammar

```
Node page   /<tree-id>/<id-1>/<id-2>/.../<id-n>[?lang=<tag>]      1 <= n <= 50
Image       /images/<file>
Redirects   /            ->  /<tree-id>/<root-id>[?lang=...]      307
            /<tree-id>   ->  /<tree-id>/<root-id>[?lang=...]      307
```

- `<id-n>` (the last id) is the Node shown. `<id-1>` .. `<id-n-1>` are the **Trail**,
  in the order visited. Every id follows the id grammar of `tree-format.md` 3.1.
- **The URL of a Node** is the page with an empty Trail: `/<tree-id>/<node-id>`.
- **The share link is the page's own URL.** The share button copies it to the
  clipboard; without JavaScript the address bar is the share link.
- `lang` is one of the Tree's declared languages. Absent means the Tree's default
  language; the app omits it for the default language. An undeclared value is ignored.
- Other query parameters are ignored. No trailing slash (the framework redirects).
- Clicking Trail entry `k` links to `/<tree-id>/<id-1>/.../<id-k>` with the same
  `lang`: the Trail after it is discarded (core document 10.17).
- Every Node page carries `<link rel="canonical">` to `/<tree-id>/<id-n>` (with `lang`
  when not the default).

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
| `lang` not declared by the Tree | Ignored; default language used; 200. |
| Image name malformed or not in the Tree's `images/` | 404. |
| Reserved Tree ids | `images`. A deployment with `ELSA_TREE=images` refuses to start. |
| The 404 page | A small page in the chrome language (`notFoundTitle`, `notFoundText`) with a link to `/<tree-id>/<root-id>`, HTTP status 404. |

The grammar is implemented once, in `src/url.ts`:

```ts
parseUrl(path: string, query: URLSearchParams, tree: Tree): PageAddress | NotFound
interface PageAddress { treeId: string; trail: string[]; nodeId: string; lang: string }
nodeHref(a: PageAddress): string                   // the page for `a`
followHref(a: PageAddress, targetId: string): string  // push nodeId onto trail, go to target; drops oldest beyond 50
trailHref(a: PageAddress, index: number): string   // jump back to trail[index]
withLang(a: PageAddress, lang: string): string     // same page, other language
imageHref(file: string): string
canonicalHref(a: PageAddress): string
```

Recorded in `docs/adrs/ADR-5-url-scheme.md`.

## 5. Lazy loading contract

### 5.1 The seam: `src/tree/loader.ts`

The one interface between Tree data on disk and what a page renders. **`getNode`
returns one Node, never the Tree.**

```ts
export function openTree(dir: string): Promise<Tree>
// Reads and validates the whole folder once (the rules of tree-format.md section 7).
// Rejects with TreeInvalid { treeId, violations: Violation[] } listing every failure
// with { file, keyPath, rule, message }. Builds the title index.

export interface Tree {
  readonly id: string                          // the folder name
  readonly manifest: Manifest                  // languages, defaultLanguage, root, title, description, metadata
  getNode(id: string): Promise<Node | null>    // reads exactly one file; null for a malformed or unknown id; never throws for bad input
  getTitle(id: string): LocalisedText | null   // from the in-memory index; no file read; for the Trail
  imagePath(file: string): string | null       // absolute path inside this Tree's images/; null for a malformed or missing name
}
```

The types, in `src/tree/types.ts`, mirror `tree-format.md` with two normalisations:
`id` and `kind` are added, and absent lists become empty arrays.

```ts
type LocalisedText = Record<string, string>              // language tag -> text
interface Manifest { format: 'elsa-tree/1'; languages: string[]; defaultLanguage: string;
                     root: string; title: LocalisedText; description?: LocalisedText;
                     metadata: { version: string; [key: string]: unknown } }
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

Behind the interface, invisible to callers: the YAML 1.2 parser, every validity rule,
path-safety checks, the title index, and any caching of parsed Nodes.

### 5.2 When what is read and sent

| Moment | Server reads | Browser receives |
|---|---|---|
| Server start | The whole Tree folder, once, to validate and build the title index. Failure: every violation printed, exit code 1, nothing served. | -- |
| First request for a Node page | The manifest (in memory) and **one Node file**; Trail titles from the index. | Complete HTML of that Node: text in the chosen language, Sources, Trail, Answers and Options as links, `<img loading="lazy">` per Image of this Node and its Options, chrome, disclaimer; the stylesheet; the small client bundle. No image bytes. |
| After the HTML | -- | Only the image files named in that HTML, via `GET /images/<file>`, as they scroll into view. |
| The user follows a Link or a Trail entry | **One Node file** for the target. | That Node (as HTML, or as the framework's page payload when JavaScript is on), then its images. |
| Enlarging a thumbnail | -- | Nothing new: the enlarged view shows the same file. |

Never: reading a second Node to render a page; sending images of a Node not on screen;
prefetching images. Prefetching the *page* of a visible Link is the Node view issue's
choice.

### 5.3 The image route

`GET /images/<file>` asks `imagePath(file)`. `null` answers 404. Otherwise the file is
streamed with `Content-Type` from its extension and `Cache-Control: public,
max-age=3600`. Each thumbnail is `<a href="/images/<file>"><img src="/images/<file>"
loading="lazy" alt="<description>"></a>`; the client component intercepts the click to
show the image in place, and without JavaScript the link opens the file.

### 5.4 Startup and the validator command

- `src/instrumentation.ts` (Next.js's `register()` hook, Node.js runtime only) calls
  `openTree` on the configured Tree at server start.
- `npm run validate <dir>` (`scripts/validate.ts`) runs the same `openTree` and prints
  every violation as `tree-id  file  key.path  RULE  message`; exit code 1 if any.
  Authors run it before pushing; CI runs it on every PR that touches `trees/`.

Recorded in `docs/adrs/ADR-5-lazy-loading.md`.

## 6. Repository layout and modules

```
.
├── docs/                    core document, specs, ADRs, research (unchanged)
├── trees/                   Tree data: one folder per Tree (elsa-tree/1)
│   └── ai-act-example/      the spec's example Tree; development default
├── src/
│   ├── app/                 Next.js routes (thin)
│   │   ├── layout.tsx       html shell, language switch, footer with disclaimer
│   │   ├── page.tsx         `/` -> redirect to the root Node
│   │   ├── not-found.tsx    the 404 page
│   │   ├── globals.css      the stylesheet
│   │   ├── [tree]/page.tsx                `/<tree-id>` -> redirect to the root Node
│   │   ├── [tree]/[...path]/page.tsx      the Node page
│   │   └── images/[file]/route.ts         streams one image file
│   ├── components/          synchronous React views
│   ├── tree/                the Tree loader module
│   │   ├── loader.ts        openTree and the Tree interface (5.1)
│   │   ├── validate.ts      the V-rules of tree-format.md section 7
│   │   └── types.ts         the types of elsa-tree/1 (5.1)
│   ├── url.ts               the URL scheme (4)
│   ├── chrome.ts            chrome strings and fallback (3)
│   ├── config.ts            ELSA_TREE / ELSA_TREES_DIR; the one opened Tree
│   ├── markdown.ts          rich-text subset -> safe HTML
│   └── instrumentation.ts   startup validation (5.4)
├── scripts/validate.ts      `npm run validate`
├── tests/                   Vitest tests and fixtures (7)
├── package.json  package-lock.json  next.config.ts  tsconfig.json  vitest.config.ts
├── .nvmrc  .env.development
└── .orca/ .claude/ .github/ .devcontainer/   agent workflow (unchanged)
```

| Module | Owns | Does not |
|---|---|---|
| `src/tree/` (loader) | Reading, validating and indexing a Tree folder; handing out one Node, one title, one image path. | Know URLs, languages of the chrome, or React. |
| `src/url.ts` | Parsing a request into `{ treeId, trail, nodeId, lang }` and building every link. | Read files or render. |
| `src/chrome.ts` | The chrome strings and the language fallback rule. | Contain Tree content. |
| `src/config.ts` | Environment variables, reserved-id check, the process-wide opened Tree. | Parse Trees or URLs. |
| `src/markdown.ts` | The rich-text subset to HTML, HTML disabled, links in a new tab. | Accept raw HTML. |
| `src/components/` | Views: Node view, Trail, thumbnails (client), share button (client), language switch, footer. Synchronous; take data, return markup. | Touch the file system, environment or request. |
| `src/app/` | Routes: parse, load, hand to a view; redirects; the image route; 404. | Hold logic. |
| `scripts/validate.ts` | The validator command line. | Duplicate rules: it calls `openTree`. |

Dependencies point inward: `app` uses `components`, `url`, `chrome`, `config`,
`markdown`; `config` uses `tree`; `components` use `chrome`, `url`, `markdown` and the
types of `tree`. `src/tree/` imports nothing from the rest of the app. Styling
mechanism and visual design are the UI issue's, within these files.

Recorded in `docs/adrs/ADR-5-repository-layout.md`.

## 7. Testing approach

| Item | Contract |
|---|---|
| Runner | Vitest, `npm test` = `vitest run`, Node environment; files `tests/**/*.test.ts(x)`. |
| Also in CI | `tsc --noEmit`, `next build`, `npm run validate trees/<each Tree>`. Command: `npm ci && npm test && npm run build`. |
| Loading a fixture | `const tree = await openTree(path.join(__dirname, 'fixtures', '<name>'))`. Never hand-built `Node` objects; never YAML read by a test. |
| Fixtures | `trees/ai-act-example/` (complete, `en` + `nl`); `tests/fixtures/single-language/` (`nl`); `tests/fixtures/other-languages/` (`de`, `fr`); `tests/fixtures/invalid/<rule>/` (one Tree per validity rule, breaking exactly that rule). |
| Rendering views | `renderToStaticMarkup` from `react-dom/server` on the synchronous components, with data from the loader. |
| Test files | `loader.test.ts` (every V-rule via `invalid/<rule>/`; `getNode` returns one Node; malformed ids give `null`), `url.test.ts` (parse and build are inverses; every 404 case of 4.3; the 50-id limit), `chrome.test.ts` (the table in 3.1), `views.test.tsx`, `interop.test.tsx`. |
| The interoperability test | For `single-language/` and `other-languages/`, for every declared language, every Node of the fixture, with an empty and a full Trail: renders without exception; the Node title in that language is present; the disclaimer is Dutch for `nl`, English for `de` and `fr`; the language switch lists exactly the manifest's languages; the markup contains neither `undefined` nor `[object Object]`. This is core document section 9, first bullet, as a test. |
| Not in the contract | Browser (Playwright) tests; may be added by a later issue. |

Recorded in `docs/adrs/ADR-5-testing-approach.md`.

## 8. What the contracts guarantee to the core document

| Core document | Where it is met |
|---|---|
| 3.2 every Node reachable by URL | 4.1: `/<tree-id>/<node-id>` |
| 3.2 share link carries Node and Trail, inside the link | 4.1: the path is the Trail |
| 3.2 language switch among the Tree's languages | 4.1 `lang`; 3 chrome fallback |
| 3.2 permanent disclaimer | 3.2 `disclaimer`, rendered in `layout.tsx` |
| 3.2 server-side rendering, lightweight, lazy | 1; 5.2 |
| 4 / 8 no accounts, cookies, tracking, analytics, database | 1 (no cookie, no telemetry), 2 (files only), 5 |
| 7 plain Linux server, no vendor features | 1: standalone `node server.js`, environment variables |
| 9 third-party Tree never breaks the frontend | 3 (chrome fallback); 5.1 (strict loader); 7 (interoperability test) |
| 9 never load the whole Tree or all images | 5.2 |
| 9 nothing about the user stored or transmitted | 1, 5.3 (no third-party requests, no cookies, no logging of visitors required) |
| 10.19 | 2 |
| 10.20 | 3 |

## 9. Where each decision is recorded

| Decision | ADR |
|---|---|
| Next.js App Router, server components, standalone Node 22, npm | `docs/adrs/ADR-5-framework-and-rendering.md` |
| One Tree per deployment via `ELSA_TREE`; Tree id kept in URLs | `docs/adrs/ADR-5-tree-selection.md` |
| Chrome in `en` and `nl` in code; follows content language, falls back to English | `docs/adrs/ADR-5-chrome-languages.md` |
| Path is the Trail; `lang` query; 50-id limit; 404 rules | `docs/adrs/ADR-5-url-scheme.md` |
| The loader seam; one Node per request; images by route; startup validation | `docs/adrs/ADR-5-lazy-loading.md` |
| `src/` modules, `trees/`, `tests/`; dependency direction | `docs/adrs/ADR-5-repository-layout.md` |
| Vitest; fixtures through the loader; the interoperability test | `docs/adrs/ADR-5-testing-approach.md` |
