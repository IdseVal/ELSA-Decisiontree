# Issue #46: version 0.2 of the first Tree, walked in the running app

Taken 2026-09-15 on Windows 11 with the headless Chromium of Playwright 1.62.1, from `dev` at
b2508ff (#42 merged), built with `npm run build` and served by the standalone server a
deployment runs (`docs/deployment.md`) with `ELSA_TREE=ai-act-applicability-agrifood`.
The page loads the Theme's Open Sans from this server (`/theme/open-sans-400.woff2`,
`-700.woff2` in `requests.md`); the screenshots are still one machine's rendering.

## How the walk was made

`node docs/screenshots/issue-46/walk.ts` (after `npm run build`) wrote everything in this
folder. For each of `en` and `nl`, at **1280 x 640** (the guaranteed viewport,
`docs/specs/application.md` 10.4) and **1280 x 800** (a "common laptop shape" of 10.6), it
opened a fresh browser context at the root -- Dutch by clicking the app's own language switch
-- and walked by clicking only:

- `yes` and `no` on every question Node, and every Option on every Node that has them;
- after each, the parent's Trail Branch back;
- a Node already walked is still clicked into, measured and left from every Link that leads to
  it, but its own Links are followed the first time only. So every Link of the Tree (36
  Answers on 18 question Nodes, 49 Options) is followed exactly once per language and
  viewport, and every one of the 71 Nodes is shown;
- on `end-of-walk`, reached by a ten-step Trail (`en`, 1280 x 640), the share button was
  clicked, the clipboard read, and the link opened in a fresh browser context.

At every page it measured, after the page's requests settled and its fonts loaded: the
document's and the centre Bubble's `scrollHeight` against the viewport and the Bubble's own
height, and every element whose content is larger than itself (the exact test of 10.6, the
Carousel strip excepted). It recorded every request from the click that opened the page to
the click that left it, and counted the Nodes (`data-node`) each page response carried.

"Walk every path from the root to each Terminal" was read as "follow every Link": the Tree has
281 distinct root-to-Terminal paths, 708 distinct Trail URLs, which at two languages and two
viewports is 2,832 page loads whose Nodes and Links are the same ones this walk already
shows. The count the issue asks to reconcile -- Nodes times languages times viewports -- is
the one below.

## The reconciliation

- Nodes: the loader (`openTree`, following every Answer and Option from `start`) reaches
  **71**; `grep -c '^id: ' tree.yaml` counts **71**; by the loader's `kind`, 18 question Nodes,
  49 explanation Nodes and 4 Terminals.
- Each of the four walks showed **71 distinct Nodes**, so **71 x 2 languages x 2 viewports =
  284** Node views, all present.
- Page visits: **699** = 4 x (1 opened + 85 Links + 85 Trail backs + 3 tab replacements) = 696,
  + 2 English roots the Dutch walks switched language on, + 1 share link opened in a fresh
  context.
- Every one of the 699 visits made exactly **one** page request (19 HTML documents, 680
  client payloads); no payload carried more than **15** Nodes (the bound of 11.5 is 17).

## What was measured

- **No-scroll**: on all 697 measured pages the document's `scrollHeight` equals the viewport
  height (640 of 640, or 800 of 800), the Bubble's `scrollHeight` equals its `clientHeight`
  (356 at 640, 516 at 800), and **0** elements overflow.
- **Requests** (`requests.md`, 1,289 rows): every URL is a path on this server -- **0**
  third-party hosts; **0** requests for `tree.yaml` or an `/api/` route; **0** images of a Node
  that was not the centre Bubble (each of the 400 `/images/` requests is an Image of the page's
  Node or the first Image of one of its Options). The kinds: 699 pages, 400 images, 133
  scripts, 38 fonts, 19 stylesheets.
- **Share link**: the copied link equals the page's URL, and the fresh context showed the same
  Node with the same 9 Trail Branches (page 17 below).

## What looked wrong, and the issues filed

1. **#63** -- the tab's renderer crashed during the walk ("Page crashed") after 119 page visits,
   and in reproductions after about 300 slides in one tab; with `prefers-reduced-motion:
   reduce` 400 navigations did not crash. The walk therefore moves to a new tab every 50
   pages (the rows "the same page in a new tab"). Reproduced in headless Chromium only.
2. **#64** -- the Trail labels, the Tree's name, the image credit, the disclaimer and `start
   again` are `#a3a4a8` on white: **2.49 : 1**, below WCAG's 4.5 : 1.
3. **#65** -- at 1280 x 640 a three-line Trail Branch runs from y 44 to 108, touching the chrome
   bar's rule at 44, and the credit line's bottom (612) is the disclaimer's top (612).

Seen and not filed, because they are not defects of the app:

- The `end-of-walk` Sources line wraps its last word ("text") onto a line of its own: content.
- At 1280 x 800 the Bubble of a short Node (`jurisdiction-importer-distributor`) is mostly
  empty space: the layout gives the extra height to the Bubble by design (10.4, "above it").
- In some screenshots a Branch shows its hover colour (the `no` of the jurisdiction steps):
  the pointer was still where the walk clicked. An artefact of the walk.

## Screenshots

One per situation of 10.3 per language per viewport (the first Node of that kind the walk met),
the seven jurisdiction steps in English at both viewports, and the share link opened in a fresh
context.

| Situation | en 1280 x 640 | nl 1280 x 640 | en 1280 x 800 | nl 1280 x 800 |
|---|---|---|---|---|
| question Node with Options | [article-2-exclusions](question-with-options-article-2-exclusions-en-1280x640.png) | [article-2-exclusions](question-with-options-article-2-exclusions-nl-1280x640.png) | [article-2-exclusions](question-with-options-article-2-exclusions-en-1280x800.png) | [article-2-exclusions](question-with-options-article-2-exclusions-nl-1280x800.png) |
| question Node without Options | [ai-system-definition](question-without-options-ai-system-definition-en-1280x640.png) | [start](question-without-options-start-nl-1280x640.png) | [ai-system-definition](question-without-options-ai-system-definition-en-1280x800.png) | [start](question-without-options-start-nl-1280x800.png) |
| explanation Node | [article-50-direct-interaction](explanation-article-50-direct-interaction-en-1280x640.png) | [article-50-direct-interaction](explanation-article-50-direct-interaction-nl-1280x640.png) | [article-50-direct-interaction](explanation-article-50-direct-interaction-en-1280x800.png) | [article-50-direct-interaction](explanation-article-50-direct-interaction-nl-1280x800.png) |
| Terminal | [ai-act-does-not-apply](terminal-ai-act-does-not-apply-en-1280x640.png) | [ai-act-does-not-apply](terminal-ai-act-does-not-apply-nl-1280x640.png) | [ai-act-does-not-apply](terminal-ai-act-does-not-apply-en-1280x800.png) | [ai-act-does-not-apply](terminal-ai-act-does-not-apply-nl-1280x800.png) |

| Jurisdiction step (en) | 1280 x 640 | 1280 x 800 |
|---|---|---|
| 1/7 `start` | [png](jurisdiction-1-of-7-start-en-1280x640.png) | [png](jurisdiction-1-of-7-start-en-1280x800.png) |
| 2/7 `jurisdiction-deployer` | [png](jurisdiction-2-of-7-jurisdiction-deployer-en-1280x640.png) | [png](jurisdiction-2-of-7-jurisdiction-deployer-en-1280x800.png) |
| 3/7 `jurisdiction-third-country-output` | [png](jurisdiction-3-of-7-jurisdiction-third-country-output-en-1280x640.png) | [png](jurisdiction-3-of-7-jurisdiction-third-country-output-en-1280x800.png) |
| 4/7 `jurisdiction-importer-distributor` | [png](jurisdiction-4-of-7-jurisdiction-importer-distributor-en-1280x640.png) | [png](jurisdiction-4-of-7-jurisdiction-importer-distributor-en-1280x800.png) |
| 5/7 `jurisdiction-product-manufacturer` | [png](jurisdiction-5-of-7-jurisdiction-product-manufacturer-en-1280x640.png) | [png](jurisdiction-5-of-7-jurisdiction-product-manufacturer-en-1280x800.png) |
| 6/7 `jurisdiction-authorised-representative` | [png](jurisdiction-6-of-7-jurisdiction-authorised-representative-en-1280x640.png) | [png](jurisdiction-6-of-7-jurisdiction-authorised-representative-en-1280x800.png) |
| 7/7 `jurisdiction-affected-person` | [png](jurisdiction-7-of-7-jurisdiction-affected-person-en-1280x640.png) | [png](jurisdiction-7-of-7-jurisdiction-affected-person-en-1280x800.png) |

Share link, fresh context: [share-link-fresh-context-en-1280x640.png](share-link-fresh-context-en-1280x640.png)

<!-- generated by tests/first-tree/every-link.spec.ts: edit the spec, not what follows -->
<!-- end of the generated record -->
