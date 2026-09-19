# Issue #87: the owner's nine points of #75, walked on the first Tree

Taken 2026-09-19 on Windows 11 with the headless Chromium of Playwright 1.62.1, from `dev` at
3ff4eb9 (#79 to #86 and #100 merged) plus the walk, built with `npm run build` and served by
the standalone server with `ELSA_TREE=ai-act-applicability-agrifood`. The Theme's Open Sans
comes from this server; the screenshots are still one machine's rendering.

`ELSA_SHOTS=1 npm run test:first-tree -- walk --grep "issue #87"` takes them. It runs the #87
block of `tests/first-tree/walk.spec.ts` (without `ELSA_SHOTS=1` they go to the gitignored
`tests/first-tree/.results/shots/issue-87/`). For `en` and `nl`, at 1280 x 640 (the guaranteed
viewport, `docs/specs/application.md` 10.4) and at 1920 x 1080, the walk clicks from `start`
to `annex-i-legislation-2`. On every page it photographs, it asserts 10.6's no-scroll test and
the point's own promise. It also writes `measurements.md` beside the screenshots.

Each file is `<points>-<page>-<lang>-<width>x<height>.png`. Four variants of each page are
taken: `en` and `nl`, at both sizes.

| # | The owner's point (core document 3.2, `[#75]`) | Screenshot | Built by | Verdict |
|---|---|---|---|---|
| 1 | A "Legal sources" / "Juridische bronnen" heading over the Sources | `1-4-6-start-*` | #81 | As asked. The heading is drawn in 13-pixel small capitals in the muted shade, which is `ADR-78-sources-heading`'s styling. |
| 2 | Hoverable terms with a small explainer panel ("provider" on the first jurisdiction step) | `2-start-provider-hovered-*` | #83, #85 (text) | As asked in English: the dotted underline, a 320 x 146 panel beside the term. **Differs in Dutch**: five explainers of the first Tree are 320 x 166, six lines, above 10.8's 148. Filed as **#103**. |
| 3 | Side children in an Overlay with a close cross, closed by a click outside | `3-4-article-2-exclusions-overlay-*` | #80 | As asked: the Option "Research or testing before placing on the market" opens a 760 x 608 Overlay with a cross. A click on the page outside it closes it, and the address does not change. The panel is fixed at 760 x 608 (10.9), so a short side child leaves its lower half empty. |
| 4 | A main image above every Node's title, small on the side children's buttons, above the title in the Overlay, on every Node | `1-4-6-start-*`, `3-4-…-overlay-*`, `8-4-…-fan-*` | #81, #84, #80 | As asked. The image sits above the title in the Bubble and in the Overlay, and a 48-pixel round picture is on every Option button. The loader counts 71 Images on 71 Nodes. |
| 5 | The Carousel: the further Images, no buttons, no text under the pictures, at the Bubble's lower edge | `5-carousel-fixture-*` | #81 | As asked, **but not on the first Tree**. No Node of it has a second Image (71 Images on 71 Nodes), so its strip is empty everywhere. The screenshot is of `tests/fixtures/carousel/`, Node `five`: four thumbnails, no visible button, no text, the strip's centre on the Bubble's bottom outline (516 = 516 at 640 high, 773 = 773 at 1080). Not filed: the Tree's Images are the owner's content. |
| 6 | Both Answer buttons bigger, the same, in the logo's green | `1-4-6-start-*` | #82 | As asked: both 620 x 60, fully rounded, filled `#159a2f`, white 19-pixel bold label, 3.69 : 1 (WCAG's 3 : 1 for large text). |
| 7 | No Trail drawn; the up arrow goes one step back | `7-prohibited-practices-up-arrow-*` | #82 | As asked. Three steps in (`prohibited-practices`), no Trail is drawn and one 48-pixel round green arrow sits on the Bubble's top outline. A click on it lands on `ai-system-definition`. |
| 8 | The side children's buttons in larger text, fanned out like a mind map | `8-4-annex-i-legislation-2-fan-*` | #80 | As asked in shape: 232 x 96 buttons with 16-pixel titles, the middle button of a side furthest out (left edges 965, 1033, 1033, 965 on the right at 1280). **Differs in Dutch**: long words are cut mid-word without a hyphen ("Gasverbrandingsto / estellen"), eight titles in all, filed as **#104**. One title takes five lines in a 102-pixel button (`7-…-nl-*`, "Seksueel beeldmateriaal zonder toestemming (2-12-2026)"), filed as **#105**. |
| 9 | The copy-link button copying the link | `9-copy-link-*` | #86 | As asked: one click puts the page's own URL, Trail and `?lang=nl` included, on the clipboard, and the bar says "Link copied" / "Link gekopieerd". |

`measurements.md` has, for every photographed page:

- the window, document and body sizes;
- the count of overflowing elements, with the Overlay or the panel open where the point opens one;
- the requests of `annex-i-legislation`, the heaviest Node: one RSC payload and nine image files (its own and one per Option).
