# Issue #263: the description's box, measured

Issue #263 asks for the box of a Node's longer description (core document 3.2 `[#262]`, 10.46):
how tall it is in the Bubble and in the Overlay at 1280 x 640 and at every viewport of
`docs/specs/application.md` 10.6, and what gives way for it, "measured, not estimated, on the
production build of `dev`, in both languages". This is that measurement. The decisions it
grounds are `docs/adrs/ADR-263-description-box.md`, `ADR-263-description-scroll.md` and
`ADR-263-description-limit.md`.

## 1. What was measured, and how

- **The build.** `dev` at `8e7ad6c` (the merge of #262's round), built in this worktree with
  `npm ci` and `npm run build`, and served by its own standalone server
  (`node .next/standalone/server.js`), as a deployment runs it. No source file was changed:
  the proposed box was drawn into the running page by a `<style>` element, as #220 and #231
  redrew their rows.
- **The data.** A fresh data directory built by `tests/browser/data-dir.ts` from three Trees,
  imported published: `tests/fixtures/full-node` (every maximum the format allows at once,
  10.6), `tests/fixtures/overlay` (the Overlay at its largest, eight Options of its own, 10.9)
  and the first Tree, `trees/ai-act-applicability-agrifood`, which sets Open Sans in both roles.
- **The pages.** The full Node at its 49-entry Trail (the Bubble, the default type stack); the
  first Tree's `annex-i-legislation`, its heaviest Node (the Bubble, Open Sans); the overlay
  fixture's `/overlay/five/big`, its largest Overlay open by URL (the default stack); and the
  first Tree's `/start/prohibited-practices/subliminal-or-manipulative-techniques`, an Overlay
  without Options of its own (Open Sans). Each in English and in Dutch.
- **The viewports.** The ten of 10.6, and the ten of `no-scroll.spec.ts`'s `STEP_VIEWPORTS`,
  one pixel either side of each trigger of 10.5.
- **The faces.** Chromium 151.0.7922.34 (Playwright 1.62.1) on Windows 11, and the same
  Chromium in WSL 2, Ubuntu 24.04.2 LTS, the CI runner's release, with `fonts-liberation`.
  The default stack of 13.4 (`src/theme.ts`) resolved, by CDP `CSS.getPlatformFontsForNode`
  on the description's paragraph (section 4), to **Segoe UI** on Windows and **Liberation
  Sans** on Linux; the first Tree's to **Open Sans** on both.
- **The states**, measured one after the other on each page, language and viewport, without
  a reload:
  1. `dev`: the page as `dev` draws it, its own description (150 counted characters on the
     two fixtures, at most 150 on the first Tree);
  2. `dev, 600 characters`: the same page with the description filled to **600 counted
     characters** in one paragraph -- 8 estimated lines by `tree-format.md` 3.8 -- and
     nothing else changed: what the limit alone, raised, would do on `dev`;
  3. to 6. `box, picture F, 600 characters`: the same text, and the box drawn in, with the
     picture **F** of the Bubble (and of the Overlay's panel) for F = 2/5 (`dev`'s), 3/10,
     1/4 and 1/5:

     ```css
     .bubble-text { --main-image: calc((100% + 2 * var(--rim-y) + 4px) * F); }
     .overlay-interior { --main-image: calc((100% + 2 * 24px + 2px) * F); }
     .bubble-text > .prose, .overlay-interior > .prose {
       flex: 0 1000000 auto;
       min-height: calc(2 * var(--body-line));
       overflow-y: auto;
       overscroll-behavior: contain;
       scrollbar-width: thin;
     }
     ```

     The box (`.prose`, the element `Explainer.tsx` renders the description into) is as tall
     as its text and shrinks first when the text area is short: its shrink weight is a
     hundred times the foot's (`.bubble-text::after`, `flex: 0 10000 var(--foot)`), and the
     foot's ten thousand times the picture's, so the box yields first, then the foot, then
     the picture. Its minimum is two lines of its type.
- **What each row holds**, per visible Interior: the text area's width and height; the
  picture's, the title's, the box's, the Sources' (or their collapsed control's) and the
  Overlay's Options' heights; the lines the box shows (its height over its line height); the
  height of its whole text (`scrollHeight`); the foot (the text area's bottom less its last
  child's); whether the document fits the window; and **10.6's element walk** -- every
  element, the Carousel strip, a `[data-scroll-box]` and the chrome bar's cut lines skipped as
  `no-scroll.spec.ts` skips them, and the box's **height** skipped (its width still walked)
  where it is drawn as a scroll box.

The scripts are in section 5, whole; each run wrote one JSON line per row, 960 rows per
platform (4 pages x 2 languages x 20 viewports x 6 states), in 1 min 52 s on Windows and
2 min 15 s in WSL.

## 2. What the rows say

- **`dev` fits, as it stands.** 160 of 160 rows per platform: the document fits and no element
  is taller or wider than itself. At 1280 x 640 the full Node is the picture 160.36, the title
  56, the description 48 (two lines) and the Sources 60, with **0.64** of the foot left: 10.7's
  0.6, measured again.
- **The limit alone does not fit.** With 600 characters and nothing else changed, `dev` draws
  the whole text, and the picture gives way down to its floor of 30 (to 41 in the full Node at
  1280 x 640, in Segoe UI and Liberation Sans, where 600 characters take 7 lines; to 30 and 13
  pixels short in Open Sans, where they take 8). 11 rows on Windows and 10 on Linux overflow
  their text area (the second table of section 3): on `annex-i-legislation` (Open Sans) at
  1280 x 640 and 1280 x 506 in both languages, and at 360 x 640 on the three other pages in
  both languages and, on Windows, on `annex-i-legislation` in Dutch. Where it fits, the picture's size depends on the Node's text,
  which #102 ruled out: "The title sits at one height on every Node again" (10.3).
- **Every box state fits, at every row.** For each of the four fractions, 160 of 160 rows per
  platform fit and no element but the box is taller than itself; the box is never wider than
  itself. So the scroll box alone is enough to hold any text the new limit allows, whatever
  the picture's share: the share decides only how tall the box is.
- **At two fifths the box is not longer at the guarantee.** At 1280 x 640, 1280 x 639 and
  1280 x 632, with the picture at its two fifths, the box is **48**: the same two lines as
  today, the rest of the text below them. It grows only where the Bubble does: 59.9 at
  1024 x 768, 66.6 (2.8 lines) at the largest Bubble, 520, from 1280 x 759 up.
- **At one fifth the box is 104.9 at the guarantee, 4.4 lines**, the picture 80.2 and the foot
  its whole 24 (23.9): in every Bubble measured, both languages, both platforms. At the largest
  Bubble it is 168 in Segoe UI and Liberation Sans, the whole of 600 characters (7 lines), and
  170.3 of 192 in Open Sans (7.1 of 8 lines); at 1024 x 768, 159.8 (6.7 lines). In the
  Overlay at its largest (eight Options of its own, the list 100), 168 in Segoe UI and Liberation
  Sans, the whole text, and 188.4 of 192 in Dutch; in an Overlay without Options, the whole 192.
- **Below 632 pixels tall and 792 wide** the picture is hidden by 10.5's step 5, as on `dev`, so
  the fraction changes nothing there: the box takes what the text area leaves, from 135 (six
  lines, 791 x 800) to 234 (twelve, 390 x 844), and 157.5 at 1280 x 505, where step 7 has set
  the type at 15 on 22.5.
- **The box never came near its two-line minimum.** Its smallest height in any one-fifth row is
  the 104.9 at 1280 x 640 on both platforms; the foot never gave way to it (where the foot is
  less than 24 below 640 pixels tall, it is `--foot`'s own value for a shorter text area, 3.75
  at 1280 x 506). In 59 of the 228 one-fifth Interiors on each platform the text was taller than
  the box and scrolled.
- **Linux equals Windows** in every cell of the third table, to the hundredth of a pixel. In
  the fourth, seven cells differ, all below 792 pixels wide: Linux sets the filler a line
  shorter than Windows there -- the full Node in English at 360 x 640 (Liberation Sans against
  Segoe UI), the first Tree's Overlay in Dutch at 768 x 1024, 390 x 844, 360 x 640 and
  791 x 800, and its `annex-i-legislation` in Dutch at 390 x 844 and 360 x 640 (Open Sans on
  both) -- so the whole text is a line shorter; where the box scrolls,
  its own height differs by 0.02 at most.

## 3. The tables

The first table counts every row; the second lists the rows of `dev, 600 characters` that
overflow; the third gives the picture's share against the box where the picture is drawn; the
fourth, the decision as it is drawn in (one fifth), at every viewport.
### Totals

| platform | state | rows | document fits | rows with an element taller or wider than itself |
|---|---|---|---|---|
| windows | dev | 160 | 160 | 0 |
| windows | dev, 600 characters | 160 | 160 | 11 |
| windows | box, picture 2/5, 600 characters | 160 | 160 | 0 |
| windows | box, picture 3/10, 600 characters | 160 | 160 | 0 |
| windows | box, picture 1/4, 600 characters | 160 | 160 | 0 |
| windows | box, picture 1/5, 600 characters | 160 | 160 | 0 |
| linux | dev | 160 | 160 | 0 |
| linux | dev, 600 characters | 160 | 160 | 10 |
| linux | box, picture 2/5, 600 characters | 160 | 160 | 0 |
| linux | box, picture 3/10, 600 characters | 160 | 160 | 0 |
| linux | box, picture 1/4, 600 characters | 160 | 160 | 0 |
| linux | box, picture 1/5, 600 characters | 160 | 160 | 0 |

### dev with a 600-character description and nothing else changed: the rows that overflow

| platform | page | lang | viewport | picture | box (lines) | foot | first failures |
|---|---|---|---|---|---|---|---|
| windows | full-node, 49-entry Trail (Bubble) | en | 360x640 | -- | 273 (14) | -60 | article.bubble bubble--question h 387>337; div.bubble-text h 377>317 |
| windows | full-node, 49-entry Trail (Bubble) | nl | 360x640 | -- | 273 (14) | -60 | article.bubble bubble--question h 387>337; div.bubble-text h 377>317 |
| windows | first Tree, annex-i-legislation (Bubble) | en | 1280x640 | 30 | 192 (8) | -13 | div.bubble-text h 362>349 |
| windows | first Tree, annex-i-legislation (Bubble) | en | 1280x506 | -- | 192 (8) | -24 | div.bubble-text h 292>268 |
| windows | first Tree, annex-i-legislation (Bubble) | nl | 1280x640 | 30 | 192 (8) | -13 | div.bubble-text h 362>349 |
| windows | first Tree, annex-i-legislation (Bubble) | nl | 360x640 | -- | 292.5 (15.03) | -11.5 | article.bubble bubble--question h 407>405; div.bubble-text h 397>385 |
| windows | first Tree, annex-i-legislation (Bubble) | nl | 1280x506 | -- | 192 (8) | -24 | div.bubble-text h 292>268 |
| windows | overlay fixture, the largest Overlay (Overlay) | en | 360x640 | -- | 273 (14) | -44 | article.bubble bubble--question h 359>325; div.bubble-text h 349>305 |
| windows | overlay fixture, the largest Overlay (Overlay) | nl | 360x640 | -- | 273 (14) | -44 | article.bubble bubble--question h 359>325; div.bubble-text h 349>305 |
| windows | first Tree, an Overlay of prohibited-practices (Overlay) | en | 360x640 | -- | 273 (14) | -48 | article.bubble bubble--question h 363>325; div.bubble-text h 353>305 |
| windows | first Tree, an Overlay of prohibited-practices (Overlay) | nl | 360x640 | -- | 292.5 (15.03) | -67.5 | article.bubble bubble--question h 383>325; div.bubble-text h 373>305 |
| linux | full-node, 49-entry Trail (Bubble) | en | 360x640 | -- | 253.5 (13.03) | -40.5 | article.bubble bubble--question h 368>337; div.bubble-text h 358>317 |
| linux | full-node, 49-entry Trail (Bubble) | nl | 360x640 | -- | 273 (14) | -60 | article.bubble bubble--question h 387>337; div.bubble-text h 377>317 |
| linux | first Tree, annex-i-legislation (Bubble) | en | 1280x640 | 30 | 192 (8) | -13 | div.bubble-text h 362>349 |
| linux | first Tree, annex-i-legislation (Bubble) | en | 1280x506 | -- | 192 (8) | -24 | div.bubble-text h 292>268 |
| linux | first Tree, annex-i-legislation (Bubble) | nl | 1280x640 | 30 | 192 (8) | -13 | div.bubble-text h 362>349 |
| linux | first Tree, annex-i-legislation (Bubble) | nl | 1280x506 | -- | 192 (8) | -24 | div.bubble-text h 292>268 |
| linux | overlay fixture, the largest Overlay (Overlay) | en | 360x640 | -- | 253.5 (13.03) | -24.5 | article.bubble bubble--question h 340>325; div.bubble-text h 330>305 |
| linux | overlay fixture, the largest Overlay (Overlay) | nl | 360x640 | -- | 273 (14) | -44 | article.bubble bubble--question h 359>325; div.bubble-text h 349>305 |
| linux | first Tree, an Overlay of prohibited-practices (Overlay) | en | 360x640 | -- | 273 (14) | -48 | article.bubble bubble--question h 363>325; div.bubble-text h 353>305 |
| linux | first Tree, an Overlay of prohibited-practices (Overlay) | nl | 360x640 | -- | 273 (14) | -48 | article.bubble bubble--question h 363>325; div.bubble-text h 353>305 |

### The picture's share against the box, where the picture is drawn (Windows; Linux equal to the pixel unless marked)

Each cell: picture / box (lines the box shows) / foot, in CSS pixels, the description at 600 counted characters.

| page | lang | picture | 1280x640 | 1280x639 | 1280x632 | 792x800 | 1024x768 | 1366x768 |
|---|---|---|---|---|---|---|---|---|
| full-node (Bubble) | en | dev, as it stands (its own text) | 160.36 / 48 (2) / 0.64 | 181.19 / 48 (2) / 31.81 | 178.39 / 48 (2) / 27.61 | 186 / 48 (2) / 39 | 200.39 / 48 (2) / 60.61 | 208 / 48 (2) / 72 |
| full-node (Bubble) | en | 2/5 | 160.38 / 48 (2) / 0.63 | 181.19 / 48 (2) / 31.81 | 178.39 / 48 (2) / 27.61 | 186 / 48 (2) / 39 | 200.39 / 59.92 (2.5) / 48.69 | 208 / 66.58 (2.79) / 53.42 |
| full-node (Bubble) | en | 3/10 | 120.3 / 64.84 (2.71) / 23.86 | 135.89 / 88.28 (3.67) / 36.83 | 133.8 / 85.13 (3.54) / 35.08 | 139.5 / 93.67 (3.92) / 39.83 | 150.3 / 109.88 (4.58) / 48.83 | 156 / 118.41 (4.92) / 53.59 |
| full-node (Bubble) | en | 1/4 | 100.25 / 84.88 (3.54) / 23.88 | 113.25 / 110.88 (4.63) / 36.88 | 111.5 / 107.38 (4.46) / 35.13 | 116.25 / 116.88 (4.88) / 39.88 | 125.25 / 134.84 (5.63) / 48.91 | 130 / 144.33 (6) / 53.67 |
| full-node (Bubble) | en | 1/5 | 80.19 / 104.91 (4.38) / 23.91 | 90.59 / 133.48 (5.54) / 36.92 | 89.19 / 129.64 (5.42) / 35.17 | 93 / 140.06 (5.83) / 39.94 | 100.19 / 159.84 (6.67) / 48.97 | 104 / 168 (7) / 56 |
| full-node (Bubble) | nl | dev, as it stands (its own text) | 160.36 / 48 (2) / 0.64 | 181.19 / 48 (2) / 31.81 | 178.39 / 48 (2) / 27.61 | 186 / 48 (2) / 39 | 200.39 / 48 (2) / 60.61 | 208 / 48 (2) / 72 |
| full-node (Bubble) | nl | 2/5 | 160.38 / 48 (2) / 0.63 | 181.19 / 48 (2) / 31.81 | 178.39 / 48 (2) / 27.61 | 186 / 48 (2) / 39 | 200.39 / 59.92 (2.5) / 48.69 | 208 / 66.58 (2.79) / 53.42 |
| full-node (Bubble) | nl | 3/10 | 120.3 / 64.84 (2.71) / 23.86 | 135.89 / 88.28 (3.67) / 36.83 | 133.8 / 85.13 (3.54) / 35.08 | 139.5 / 93.67 (3.92) / 39.83 | 150.3 / 109.88 (4.58) / 48.83 | 156 / 118.41 (4.92) / 53.59 |
| full-node (Bubble) | nl | 1/4 | 100.25 / 84.88 (3.54) / 23.88 | 113.25 / 110.88 (4.63) / 36.88 | 111.5 / 107.38 (4.46) / 35.13 | 116.25 / 116.88 (4.88) / 39.88 | 125.25 / 134.84 (5.63) / 48.91 | 130 / 144.33 (6) / 53.67 |
| full-node (Bubble) | nl | 1/5 | 80.19 / 104.91 (4.38) / 23.91 | 90.59 / 133.48 (5.54) / 36.92 | 89.19 / 129.64 (5.42) / 35.17 | 93 / 140.06 (5.83) / 39.94 | 100.19 / 159.84 (6.67) / 48.97 | 104 / 168 (7) / 56 |
| annex-i-legislation (Bubble) | en | dev, as it stands (its own text) | 160.36 / 48 (2) / 0.64 | 181.19 / 48 (2) / 31.81 | 178.39 / 48 (2) / 27.61 | 208 / 48 (2) / 72 | 200.39 / 48 (2) / 60.61 | 208 / 48 (2) / 72 |
| annex-i-legislation (Bubble) | en | 2/5 | 160.38 / 48 (2) / 0.63 | 181.19 / 48 (2) / 31.81 | 178.39 / 48 (2) / 27.61 | 208 / 66.59 (2.79) / 53.41 | 200.39 / 59.95 (2.5) / 48.66 | 208 / 66.59 (2.79) / 53.41 |
| annex-i-legislation (Bubble) | en | 3/10 | 120.3 / 64.86 (2.71) / 23.84 | 135.89 / 88.31 (3.67) / 36.8 | 133.8 / 85.16 (3.54) / 35.05 | 156 / 118.45 (4.92) / 53.55 | 150.3 / 109.91 (4.58) / 48.8 | 156 / 118.45 (4.92) / 53.55 |
| annex-i-legislation (Bubble) | en | 1/4 | 100.25 / 84.89 (3.54) / 23.86 | 113.25 / 110.91 (4.63) / 36.84 | 111.5 / 107.41 (4.46) / 35.09 | 130 / 144.39 (6) / 53.61 | 125.25 / 134.89 (5.63) / 48.86 | 130 / 144.39 (6) / 53.61 |
| annex-i-legislation (Bubble) | en | 1/5 | 80.19 / 104.92 (4.38) / 23.89 | 90.59 / 133.52 (5.58) / 36.89 | 89.19 / 129.67 (5.42) / 35.14 | 104 / 170.31 (7.08) / 53.69 | 100.19 / 159.89 (6.67) / 48.92 | 104 / 170.31 (7.08) / 53.69 |
| annex-i-legislation (Bubble) | nl | dev, as it stands (its own text) | 160.36 / 48 (2) / 0.64 | 181.19 / 48 (2) / 31.81 | 178.39 / 48 (2) / 27.61 | 208 / 48 (2) / 72 | 200.39 / 48 (2) / 60.61 | 208 / 48 (2) / 72 |
| annex-i-legislation (Bubble) | nl | 2/5 | 160.38 / 48 (2) / 0.63 | 181.19 / 48 (2) / 31.81 | 178.39 / 48 (2) / 27.61 | 208 / 66.59 (2.79) / 53.41 | 200.39 / 59.95 (2.5) / 48.66 | 208 / 66.59 (2.79) / 53.41 |
| annex-i-legislation (Bubble) | nl | 3/10 | 120.3 / 64.86 (2.71) / 23.84 | 135.89 / 88.31 (3.67) / 36.8 | 133.8 / 85.16 (3.54) / 35.05 | 156 / 118.45 (4.92) / 53.55 | 150.3 / 109.91 (4.58) / 48.8 | 156 / 118.45 (4.92) / 53.55 |
| annex-i-legislation (Bubble) | nl | 1/4 | 100.25 / 84.89 (3.54) / 23.86 | 113.25 / 110.91 (4.63) / 36.84 | 111.5 / 107.41 (4.46) / 35.09 | 130 / 144.39 (6) / 53.61 | 125.25 / 134.89 (5.63) / 48.86 | 130 / 144.39 (6) / 53.61 |
| annex-i-legislation (Bubble) | nl | 1/5 | 80.19 / 104.92 (4.38) / 23.89 | 90.59 / 133.52 (5.58) / 36.89 | 89.19 / 129.67 (5.42) / 35.14 | 104 / 170.31 (7.08) / 53.69 | 100.19 / 159.89 (6.67) / 48.92 | 104 / 170.31 (7.08) / 53.69 |
| overlay fixture (Overlay) | en | dev, as it stands (its own text) | 243.19 / 48 (2) / 18.81 | 252.8 / 48 (2) / 53.2 | 252.8 / 48 (2) / 53.2 | 252.8 / 48 (2) / 53.2 | 252.8 / 48 (2) / 53.2 | 243.19 / 48 (2) / 18.81 |
| overlay fixture (Overlay) | en | 2/5 | 243.19 / 66.81 (2.79) / 0 | 252.8 / 101.2 (4.21) / 0 | 252.8 / 101.2 (4.21) / 0 | 252.8 / 101.2 (4.21) / 0 | 252.8 / 101.2 (4.21) / 0 | 243.19 / 66.81 (2.79) / 0 |
| overlay fixture (Overlay) | en | 3/10 | 182.39 / 127.61 (5.33) / 0 | 189.59 / 144 (6) / 20.41 | 189.59 / 144 (6) / 20.41 | 189.59 / 144 (6) / 20.41 | 189.59 / 144 (6) / 20.41 | 182.39 / 127.61 (5.33) / 0 |
| overlay fixture (Overlay) | en | 1/4 | 152 / 158 (6.58) / 0 | 158 / 144 (6) / 52 | 158 / 144 (6) / 52 | 158 / 144 (6) / 52 | 158 / 144 (6) / 52 | 152 / 158 (6.58) / 0 |
| overlay fixture (Overlay) | en | 1/5 | 121.59 / 168 (7) / 20.41 | 126.39 / 144 (6) / 83.61 | 126.39 / 144 (6) / 83.61 | 126.39 / 144 (6) / 83.61 | 126.39 / 144 (6) / 83.61 | 121.59 / 168 (7) / 20.41 |
| overlay fixture (Overlay) | nl | dev, as it stands (its own text) | 243.19 / 48 (2) / 18.81 | 252.8 / 48 (2) / 33.2 | 252.8 / 48 (2) / 33.2 | 252.8 / 48 (2) / 33.2 | 252.8 / 48 (2) / 33.2 | 243.19 / 48 (2) / 18.81 |
| overlay fixture (Overlay) | nl | 2/5 | 243.19 / 66.81 (2.79) / 0 | 252.8 / 81.2 (3.38) / 0 | 252.8 / 81.2 (3.38) / 0 | 252.8 / 81.2 (3.38) / 0 | 252.8 / 81.2 (3.38) / 0 | 243.19 / 66.81 (2.79) / 0 |
| overlay fixture (Overlay) | nl | 3/10 | 182.39 / 127.61 (5.33) / 0 | 189.59 / 144.41 (6) / 0 | 189.59 / 144.41 (6) / 0 | 189.59 / 144.41 (6) / 0 | 189.59 / 144.41 (6) / 0 | 182.39 / 127.61 (5.33) / 0 |
| overlay fixture (Overlay) | nl | 1/4 | 152 / 158 (6.58) / 0 | 158 / 168 (7) / 8 | 158 / 168 (7) / 8 | 158 / 168 (7) / 8 | 158 / 168 (7) / 8 | 152 / 158 (6.58) / 0 |
| overlay fixture (Overlay) | nl | 1/5 | 121.59 / 188.41 (7.83) / 0 | 126.39 / 168 (7) / 39.61 | 126.39 / 168 (7) / 39.61 | 126.39 / 168 (7) / 39.61 | 126.39 / 168 (7) / 39.61 | 121.59 / 188.41 (7.83) / 0 |
| first Tree Overlay | en | dev, as it stands (its own text) | 243.19 / 48 (2) / 174.81 | 252.8 / 48 (2) / 189.2 | 252.8 / 48 (2) / 189.2 | 252.8 / 48 (2) / 189.2 | 252.8 / 48 (2) / 189.2 | 243.19 / 48 (2) / 174.81 |
| first Tree Overlay | en | 2/5 | 243.19 / 192 (8) / 30.81 | 252.8 / 168 (7) / 69.2 | 252.8 / 168 (7) / 69.2 | 252.8 / 168 (7) / 69.2 | 252.8 / 168 (7) / 69.2 | 243.19 / 192 (8) / 30.81 |
| first Tree Overlay | en | 3/10 | 182.39 / 192 (8) / 91.61 | 189.59 / 168 (7) / 132.41 | 189.59 / 168 (7) / 132.41 | 189.59 / 168 (7) / 132.41 | 189.59 / 168 (7) / 132.41 | 182.39 / 192 (8) / 91.61 |
| first Tree Overlay | en | 1/4 | 152 / 192 (8) / 122 | 158 / 168 (7) / 164 | 158 / 168 (7) / 164 | 158 / 168 (7) / 164 | 158 / 168 (7) / 164 | 152 / 192 (8) / 122 |
| first Tree Overlay | en | 1/5 | 121.59 / 192 (8) / 152.41 | 126.39 / 168 (7) / 195.61 | 126.39 / 168 (7) / 195.61 | 126.39 / 168 (7) / 195.61 | 126.39 / 168 (7) / 195.61 | 121.59 / 192 (8) / 152.41 |
| first Tree Overlay | nl | dev, as it stands (its own text) | 243.19 / 48 (2) / 174.81 | 252.8 / 48 (2) / 189.2 | 252.8 / 48 (2) / 189.2 | 252.8 / 48 (2) / 189.2 | 252.8 / 48 (2) / 189.2 | 243.19 / 48 (2) / 174.81 |
| first Tree Overlay | nl | 2/5 | 243.19 / 192 (8) / 30.81 | 252.8 / 168 (7) / 69.2 | 252.8 / 168 (7) / 69.2 | 252.8 / 168 (7) / 69.2 | 252.8 / 168 (7) / 69.2 | 243.19 / 192 (8) / 30.81 |
| first Tree Overlay | nl | 3/10 | 182.39 / 192 (8) / 91.61 | 189.59 / 168 (7) / 132.41 | 189.59 / 168 (7) / 132.41 | 189.59 / 168 (7) / 132.41 | 189.59 / 168 (7) / 132.41 | 182.39 / 192 (8) / 91.61 |
| first Tree Overlay | nl | 1/4 | 152 / 192 (8) / 122 | 158 / 168 (7) / 164 | 158 / 168 (7) / 164 | 158 / 168 (7) / 164 | 158 / 168 (7) / 164 | 152 / 192 (8) / 122 |
| first Tree Overlay | nl | 1/5 | 121.59 / 192 (8) / 152.41 | 126.39 / 168 (7) / 195.61 | 126.39 / 168 (7) / 195.61 | 126.39 / 168 (7) / 195.61 | 126.39 / 168 (7) / 195.61 | 121.59 / 192 (8) / 152.41 |

### The decision drawn in: the picture one fifth, the box at 600 characters, at every viewport

Each cell: box / its whole text, in CSS pixels (lines the box shows) / foot. "notice": the minimumSize notice. Windows first, then Linux where it differs.

| viewport | full-node (Bubble) en | full-node (Bubble) nl | annex-i-legislation (Bubble) en | annex-i-legislation (Bubble) nl | overlay fixture (Overlay) en | overlay fixture (Overlay) nl | first Tree Overlay en | first Tree Overlay nl |
|---|---|---|---|---|---|---|---|---|
| 1280x640 | 104.91 / 168 (4.38) / 23.91 | 104.91 / 168 (4.38) / 23.91 | 104.92 / 192 (4.38) / 23.89 | 104.92 / 192 (4.38) / 23.89 | 168 / 168 (7) / 20.41 | 188.41 / 192 (7.83) / 0 | 192 / 192 (8) / 152.41 | 192 / 192 (8) / 152.41 |
| 1366x768 | 168 / 168 (7) / 56 | 168 / 168 (7) / 56 | 170.31 / 192 (7.08) / 53.69 | 170.31 / 192 (7.08) / 53.69 | 168 / 168 (7) / 20.41 | 188.41 / 192 (7.83) / 0 | 192 / 192 (8) / 152.41 | 192 / 192 (8) / 152.41 |
| 1920x1080 | 168 / 168 (7) / 56 | 168 / 168 (7) / 56 | 170.31 / 192 (7.08) / 53.69 | 170.31 / 192 (7.08) / 53.69 | 168 / 168 (7) / 20.41 | 188.41 / 192 (7.83) / 0 | 192 / 192 (8) / 152.41 | 192 / 192 (8) / 152.41 |
| 2560x1440 | 168 / 168 (7) / 56 | 168 / 168 (7) / 56 | 170.31 / 192 (7.08) / 53.69 | 170.31 / 192 (7.08) / 53.69 | 168 / 168 (7) / 20.41 | 188.41 / 192 (7.83) / 0 | 192 / 192 (8) / 152.41 | 192 / 192 (8) / 152.41 |
| 1280x800 | 168 / 168 (7) / 56 | 168 / 168 (7) / 56 | 170.31 / 192 (7.08) / 53.69 | 170.31 / 192 (7.08) / 53.69 | 168 / 168 (7) / 20.41 | 188.41 / 192 (7.83) / 0 | 192 / 192 (8) / 152.41 | 192 / 192 (8) / 152.41 |
| 1024x768 | 159.84 / 168 (6.67) / 48.97 | 159.84 / 168 (6.67) / 48.97 | 159.89 / 192 (6.67) / 48.92 | 159.89 / 192 (6.67) / 48.92 | 144 / 144 (6) / 83.61 | 168 / 168 (7) / 39.61 | 168 / 168 (7) / 195.61 | 168 / 168 (7) / 195.61 |
| 768x1024 | 157.5 / 158 (7.02) / 214.5 | 157.5 / 158 (7.02) / 214.5 | 157.5 / 158 (7.02) / 214.5 | 157.5 / 158 (7.02) / 214.5 | 135 / 135 (6) / 307 | 135 / 135 (6) / 287 | 135 / 135 (6) / 421 | 157.5 / 158 (7.02) / 398.5 (Linux 135 / 135 (6) / 421) |
| 390x844 | 234 / 234 (12) / 158 | 234 / 234 (12) / 158 | 253.5 / 254 (13.03) / 138.5 | 273 / 273 (14) / 119 (Linux 253.5 / 254 (13.03) / 138.5) | 195 / 195 (10) / 127 | 214.5 / 215 (11.03) / 107.5 | 234 / 234 (12) / 300 (Linux 214.5 / 215 (11.03) / 319.5) | 214.5 / 215 (11.03) / 319.5 |
| 360x640 | 197.05 / 273 (10.1) / 15.95 (Linux 197.03 / 254 (10.1) / 15.97) | 197.05 / 273 (10.1) / 15.95 | 248.03 / 273 (12.72) / 32.97 | 248.05 / 293 (12.72) / 32.95 (Linux 248.03 / 273 (12.72) / 32.97) | 234 / 234 (12) / 88 | 234 / 234 (12) / 68 | 253.5 / 254 (13.03) / 280.5 (Linux 234 / 234 (12) / 300) | 253.5 / 254 (13.03) / 280.5 (Linux 234 / 234 (12) / 300) |
| 320x480 | notice | notice | notice | notice | notice | notice | notice | notice |
| 1280x639 | 133.48 / 168 (5.54) / 36.92 | 133.48 / 168 (5.54) / 36.92 | 133.52 / 192 (5.58) / 36.89 | 133.52 / 192 (5.58) / 36.89 | 144 / 144 (6) / 83.61 | 168 / 168 (7) / 39.61 | 168 / 168 (7) / 195.61 | 168 / 168 (7) / 195.61 |
| 1280x632 | 129.64 / 168 (5.42) / 35.17 | 129.64 / 168 (5.42) / 35.17 | 129.67 / 192 (5.42) / 35.14 | 129.67 / 192 (5.42) / 35.14 | 144 / 144 (6) / 83.61 | 168 / 168 (7) / 39.61 | 168 / 168 (7) / 195.61 | 168 / 168 (7) / 195.61 |
| 1280x631 | 168 / 168 (7) / 93 | 168 / 168 (7) / 93 | 192 / 192 (8) / 69 | 192 / 192 (8) / 69 | 144 / 144 (6) / 218 | 168 / 168 (7) / 174 | 168 / 168 (7) / 330 | 168 / 168 (7) / 330 |
| 1280x564 | 168 / 168 (7) / 26 | 168 / 168 (7) / 26 | 175.77 / 192 (7.33) / 18.23 | 175.77 / 192 (7.33) / 18.23 | 144 / 144 (6) / 158 | 168 / 168 (7) / 114 | 168 / 168 (7) / 270 | 168 / 168 (7) / 270 |
| 1280x563 | 168 / 168 (7) / 57 | 168 / 168 (7) / 57 | 192 / 192 (8) / 33 | 192 / 192 (8) / 33 | 144 / 144 (6) / 225 | 168 / 168 (7) / 181 | 168 / 168 (7) / 317 | 168 / 168 (7) / 317 |
| 1280x506 | 164.25 / 168 (6.83) / 3.75 | 164.25 / 168 (6.83) / 3.75 | 164.25 / 192 (6.83) / 3.75 | 164.25 / 192 (6.83) / 3.75 | 144 / 144 (6) / 168 | 168 / 168 (7) / 124 | 168 / 168 (7) / 260 | 168 / 168 (7) / 260 |
| 1280x505 | 157.5 / 158 (7.02) / 13.5 | 157.5 / 158 (7.02) / 13.5 | 157.5 / 158 (7.02) / 13.5 | 157.5 / 158 (7.02) / 13.5 | 135 / 135 (6) / 180 | 135 / 135 (6) / 160 | 135 / 135 (6) / 294 | 157.5 / 158 (7.02) / 271.5 |
| 1279x800 | 168 / 168 (7) / 56 | 168 / 168 (7) / 56 | 170.31 / 192 (7.08) / 53.69 | 170.31 / 192 (7.08) / 53.69 | 144 / 144 (6) / 83.61 | 168 / 168 (7) / 39.61 | 168 / 168 (7) / 195.61 | 168 / 168 (7) / 195.61 |
| 792x800 | 140.06 / 168 (5.83) / 39.94 | 140.06 / 168 (5.83) / 39.94 | 170.31 / 192 (7.08) / 53.69 | 170.31 / 192 (7.08) / 53.69 | 144 / 144 (6) / 83.61 | 168 / 168 (7) / 39.61 | 168 / 168 (7) / 195.61 | 168 / 168 (7) / 195.61 |
| 791x800 | 135 / 135 (6) / 182 | 157.5 / 158 (7.02) / 159.5 | 157.5 / 158 (7.02) / 214.5 | 157.5 / 158 (7.02) / 214.5 | 135 / 135 (6) / 307 | 135 / 135 (6) / 287 | 135 / 135 (6) / 421 | 157.5 / 158 (7.02) / 398.5 (Linux 135 / 135 (6) / 421) |

## 4. What the box does: the probe

`probe.mjs` (section 5) draws the one-fifth box into the full Node (`/full-node/full`, the
default stack) and the first Tree's `annex-i-legislation` (Open Sans) at 1280 x 640, fills the
description to 600 counted characters, gives the box `tabindex="0"`, and then: names the face
the paragraph is drawn in (CDP); focuses the box and presses ArrowDown, PageDown and End; turns
the wheel 400 pixels over the box at its end; presses Home; scrolls the box to its end and
focuses the first explainer term in it; and scrolls the box to its end again with that term's
panel open. `top` is the box's `scrollTop`, `max` how far it can scroll, `doc` the document's
`scrollTop`. Each key was given 500 ms before the next read: a first run that read at once saw
`top` 0 after every key, and the wheel's 300 ms move the box, so Chromium's keyboard scroll here
is animated.

Windows:

```
{"label":"windows","url":"/full-node/full","face":"Segoe UI (588), Segoe UI (6)","start":{"top":0,"max":63,"doc":0},"arrowDown":{"top":40,"max":63,"doc":0},"pageDown":{"top":63,"max":63,"doc":0},"end":{"top":63,"max":63,"doc":0},"wheelAtEnd":{"top":63,"max":63,"doc":0},"home":{"top":0,"max":63,"doc":0},"beforeTermFocus":{"top":63,"max":63,"doc":0},"afterTermFocus":{"top":0,"max":63,"doc":0},"panel":{"containingBlock":"bubble-text","insideTextArea":true,"drawnOnTop":true,"rect":[347,324,320,146]},"panelAfterScroll":{"panelTop":324,"termTop":240,"termVisibleInBox":false}}
{"label":"windows","url":"/ai-act-applicability-agrifood/annex-i-legislation","face":"Open Sans (46), Open Sans (546)","start":{"top":0,"max":87,"doc":0},"arrowDown":{"top":40,"max":87,"doc":0},"pageDown":{"top":87,"max":87,"doc":0},"end":{"top":87,"max":87,"doc":0},"wheelAtEnd":{"top":87,"max":87,"doc":0},"home":{"top":0,"max":87,"doc":0},"beforeTermFocus":{"top":87,"max":87,"doc":0},"afterTermFocus":{"top":0,"max":87,"doc":0},"panel":{"containingBlock":"bubble-text","insideTextArea":true,"drawnOnTop":true,"rect":[551,301,320,146]},"panelAfterScroll":{"panelTop":301,"termTop":192,"termVisibleInBox":false}}
```

Linux (WSL 2, Ubuntu 24.04.2):

```
{"label":"linux","url":"/full-node/full","face":"Liberation Sans (588), Liberation Sans (6)","start":{"top":0,"max":63,"doc":0},"arrowDown":{"top":40,"max":63,"doc":0},"pageDown":{"top":63,"max":63,"doc":0},"end":{"top":63,"max":63,"doc":0},"wheelAtEnd":{"top":63,"max":63,"doc":0},"home":{"top":0,"max":63,"doc":0},"beforeTermFocus":{"top":63,"max":63,"doc":0},"afterTermFocus":{"top":0,"max":63,"doc":0},"panel":{"containingBlock":"bubble-text","insideTextArea":true,"drawnOnTop":true,"rect":[347,322,320,146]},"panelAfterScroll":{"panelTop":322,"termTop":242,"termVisibleInBox":false}}
{"label":"linux","url":"/ai-act-applicability-agrifood/annex-i-legislation","face":"Open Sans (46), Open Sans (546)","start":{"top":0,"max":87,"doc":0},"arrowDown":{"top":40,"max":87,"doc":0},"pageDown":{"top":87,"max":87,"doc":0},"end":{"top":87,"max":87,"doc":0},"wheelAtEnd":{"top":87,"max":87,"doc":0},"home":{"top":0,"max":87,"doc":0},"beforeTermFocus":{"top":87,"max":87,"doc":0},"afterTermFocus":{"top":0,"max":87,"doc":0},"panel":{"containingBlock":"bubble-text","insideTextArea":true,"drawnOnTop":true,"rect":[553,301,320,146]},"panelAfterScroll":{"panelTop":301,"termTop":192,"termVisibleInBox":false}}
```

Read off both:

- **The keyboard scrolls the box.** Focused, ArrowDown moves it 40 pixels, PageDown and End to its
  end, Home back to its top. The document's `scrollTop` stays 0 throughout.
- **A wheel at the box's end moves nothing.** 400 pixels of wheel at the end leave the box at its
  end and the document at 0 (`overscroll-behavior: contain`; the document has `overflow: hidden`
  as well, 10.6).
- **Focus on a term scrolls it into view.** From the box's end (63 and 87 pixels down) focusing
  the first term brings the box back to 0, where the term is, and its panel opens.
- **The panel is not clipped by the box.** Its containing block stays the text area
  (`.bubble-text`), because the box is not positioned; the panel lies inside the text area and is
  the element drawn at its centre (`elementFromPoint`), over the box and the Sources.
- **A panel left open while the box scrolls stays where it was placed**, and its term leaves the
  box (`termVisibleInBox: false`): a panel that points at nothing. `dev`'s `Explainer.tsx` closes
  an open panel on a resize of the window, not on a scroll, because nothing scrolled until now.
  `ADR-263-description-scroll.md` decision 6 closes it on a scroll of the box as well.

## 5. The scripts, whole

Run from the worktree's root, with the standalone server of section 1 listening:

```
node tests/browser/data-dir.ts <data-dir> trees/ai-act-applicability-agrifood tests/fixtures/full-node tests/fixtures/overlay
ELSA_DATA_DIR=<data-dir> ELSA_ADMIN_EMAIL=admin@example.org ELSA_ADMIN_PASSWORD='test administrator password' PORT=13910 HOSTNAME=127.0.0.1 node .next/standalone/server.js
node measure.mjs http://127.0.0.1:13910 windows.jsonl windows
node probe.mjs http://127.0.0.1:13910 windows
bash wsl.sh          # inside WSL: the same two scripts against a copy of the data directory
python record_tables.py > tables.md
```

### `measure.mjs`

```js
// Issue #263: the description's box, measured on the production build of `dev`.
// usage: node measure.mjs <origin> <out.jsonl> [label]
// For each page, language and viewport: the Interior as dev draws it, then the same page with the
// description filled to 600 counted characters (one paragraph, 8 estimated lines) and the
// proposed box drawn in by a style element, for each fraction of the picture.
import { writeFileSync, appendFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(process.cwd() + '/')
const { chromium } = require(process.env.PW_MODULE ?? '@playwright/test')

const [origin, out, label = 'windows'] = process.argv.slice(2)
writeFileSync(out, '')

const VIEWPORTS = [
  [1280, 640], [1366, 768], [1920, 1080], [2560, 1440], [1280, 800], [1024, 768],
  [768, 1024], [390, 844], [360, 640], [320, 480],
  // 10.5's triggers, as no-scroll.spec.ts's STEP_VIEWPORTS
  [1280, 639], [1280, 632], [1280, 631], [1280, 564], [1280, 563], [1280, 506], [1280, 505],
  [1279, 800], [792, 800], [791, 800],
]
const PAGES = [
  { what: 'full-node, 49-entry Trail (Bubble)', url: '/full-node/' + Array(50).fill('full').join('/') },
  { what: 'first Tree, annex-i-legislation (Bubble)', url: '/ai-act-applicability-agrifood/annex-i-legislation' },
  { what: 'overlay fixture, the largest Overlay (Overlay)', url: '/overlay/five/big' },
  { what: 'first Tree, an Overlay of prohibited-practices (Overlay)', url: '/ai-act-applicability-agrifood/start/prohibited-practices/subliminal-or-manipulative-techniques' },
]
const FRACTIONS = [['2/5', 0.4], ['3/10', 0.3], ['1/4', 0.25], ['1/5', 0.2]]
const FILL = {
  en: ' The provider keeps the technical documentation of the system up to date and hands it to the authority that asks for it.',
  nl: ' De aanbieder houdt de technische documentatie van het systeem actueel en geeft die aan de autoriteit die erom vraagt.',
}

/** The proposed box: the picture a fraction of the Bubble (or the panel), the description a vertical scroll box. */
function css(f) {
  return `
.bubble-text { --main-image: calc((100% + 2 * var(--rim-y) + 4px) * ${f}); }
.overlay-interior { --main-image: calc((100% + 2 * 24px + 2px) * ${f}); }
.bubble-text > .prose, .overlay-interior > .prose {
  flex: 0 1000000 auto;
  min-height: calc(2 * var(--body-line));
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}`
}

const inLang = (url, lang) => (lang === 'en' ? url : `${url}?lang=${lang}`)

/** Measured in the page: every visible Interior, the document, and the element walk. */
function measure() {
  const r = (el) => el.getBoundingClientRect()
  const shown = (el) => el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none'
  const areas = [...document.querySelectorAll('.bubble-text, .overlay-interior')].filter(shown)
  const interiors = areas.map((area) => {
    const a = r(area)
    const kids = [...area.children].filter(shown)
    const pick = (sel) => kids.find((k) => k.matches(sel))
    const h = (el) => (el ? Math.round(r(el).height * 100) / 100 : null)
    const prose = pick('.prose')
    const lh = prose ? parseFloat(getComputedStyle(prose).lineHeight) : null
    const lastBottom = Math.max(...kids.map((k) => r(k).bottom + parseFloat(getComputedStyle(k).marginBottom || '0')))
    const counted = prose
      ? (() => {
          const c = prose.cloneNode(true)
          c.querySelectorAll('.explainer').forEach((e) => e.remove())
          return c.textContent.trim().length
        })()
      : null
    return {
      kind: area.matches('.overlay-interior') ? 'overlay' : 'bubble',
      area: [Math.round(a.width * 100) / 100, Math.round(a.height * 100) / 100],
      picture: h(pick('.main-image')),
      title: h(pick('h1, h2')),
      box: h(prose),
      boxScroll: prose ? prose.scrollHeight : null,
      boxClient: prose ? prose.clientHeight : null,
      lineHeight: lh,
      lines: prose && lh ? Math.round((prose.clientHeight / lh) * 100) / 100 : null,
      counted,
      sources: h(pick('.sources')) ?? h(pick('.sources-collapsed')),
      options: h(pick('.overlay-options')),
      foot: Math.round((a.bottom - lastBottom) * 100) / 100,
      boxBottomInArea: prose ? r(prose).bottom <= a.bottom + 1 : null,
    }
  })
  const d = document.documentElement
  const failures = []
  for (const el of document.querySelectorAll('*')) {
    if (el.matches('[data-carousel-strip], [data-scroll-box], [data-scroll-box] [data-clamp], .page-chrome [data-clamp]')) continue
    const isBox = el.matches('.bubble-text > .prose, .overlay-interior > .prose') && getComputedStyle(el).overflowY === 'auto'
    if (!isBox && el.scrollHeight > el.clientHeight + 1) failures.push(`${el.tagName.toLowerCase()}.${el.className} h ${el.scrollHeight}>${el.clientHeight}`)
    if (el.scrollWidth > el.clientWidth + 1) failures.push(`${el.tagName.toLowerCase()}.${el.className} w ${el.scrollWidth}>${el.clientWidth}`)
  }
  return {
    docFits: d.scrollHeight <= innerHeight + 1 && d.scrollWidth <= innerWidth + 1 && document.body.scrollHeight <= innerHeight + 1,
    notice: shown(document.querySelector('.minimum-size, [data-minimum-size]')),
    interiors,
    failures: failures.slice(0, 6),
    failureCount: failures.length,
  }
}

/** Fills each visible description to exactly 600 counted characters in one paragraph. */
function fill(text) {
  for (const prose of document.querySelectorAll('.bubble-text > .prose, .overlay-interior > .prose')) {
    const c = prose.cloneNode(true)
    c.querySelectorAll('.explainer').forEach((e) => e.remove())
    let have = c.textContent.trim().length
    const blocks = prose.querySelectorAll(':scope > p, :scope > ul, :scope > ol')
    // One paragraph: later blocks are dropped, so the estimate is ceil(600 / 75) = 8 lines.
    ;[...blocks].slice(1).forEach((b) => b.remove())
    const c2 = prose.cloneNode(true)
    c2.querySelectorAll('.explainer').forEach((e) => e.remove())
    have = c2.textContent.trim().length
    const target = blocks[0] ?? prose
    let add = ''
    while (have + add.length < 600) add += text
    target.append(document.createTextNode(add.slice(0, 600 - have)))
  }
}

const browser = await chromium.launch()
try {
  for (const pageDef of PAGES) {
    for (const lang of ['en', 'nl']) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 640 } })
      const page = await context.newPage()
      for (const [width, height] of VIEWPORTS) {
        await page.setViewportSize({ width, height })
        await page.goto(origin + inLang(pageDef.url, lang), { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        const row = (state, m) => appendFileSync(out, JSON.stringify({ label, page: pageDef.what, lang, viewport: `${width}x${height}`, state, ...m }) + '\n')
        row('dev', await page.evaluate(measure))
        await page.evaluate(fill, FILL[lang])
        row('dev, 600 characters', await page.evaluate(measure))
        for (const [name, f] of FRACTIONS) {
          await page.evaluate((c) => {
            let s = document.getElementById('m263')
            if (!s) { s = document.createElement('style'); s.id = 'm263'; document.head.append(s) }
            s.textContent = c
          }, css(f))
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
          row(`box, picture ${name}, 600 characters`, await page.evaluate(measure))
        }
      }
      await context.close()
    }
  }
} finally {
  await browser.close()
}
```

### `probe.mjs`

```js
// Issue #263: what the proposed box does, probed at 1280 x 640 on the production build of `dev`.
// usage: node probe.mjs <origin> [label]
import { createRequire } from 'node:module'
const require = createRequire(process.cwd() + '/')
const { chromium } = require(process.env.PW_MODULE ?? '@playwright/test')

const [origin, label = 'windows'] = process.argv.slice(2)
const CSS = `
.bubble-text { --main-image: calc((100% + 2 * var(--rim-y) + 4px) * 0.2); }
.overlay-interior { --main-image: calc((100% + 2 * 24px + 2px) * 0.2); }
.bubble-text > .prose, .overlay-interior > .prose {
  flex: 0 1000000 auto; min-height: calc(2 * var(--body-line));
  overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin;
}`
const FILL = ' The provider keeps the technical documentation of the system up to date and hands it to the authority that asks for it.'

const browser = await chromium.launch()
try {
  for (const url of ['/full-node/full', '/ai-act-applicability-agrifood/annex-i-legislation']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 640 } })
    await page.goto(origin + url, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.addStyleTag({ content: CSS })
    await page.evaluate((text) => {
      const prose = document.querySelector('.bubble-text > .prose')
      const c = prose.cloneNode(true)
      c.querySelectorAll('.explainer').forEach((e) => e.remove())
      const have = c.textContent.trim().length
      let add = ''
      while (have + add.length < 600) add += text
      ;(prose.querySelector('p') ?? prose).append(document.createTextNode(add.slice(0, 600 - have)))
      prose.tabIndex = 0
    }, FILL)
    const prose = page.locator('.bubble-text > .prose')
    // The face the description is drawn in.
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('DOM.enable')
    await cdp.send('CSS.enable')
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 })
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.bubble-text > .prose p' })
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
    const state = () => prose.evaluate((el) => ({ top: Math.round(el.scrollTop), max: el.scrollHeight - el.clientHeight, doc: document.documentElement.scrollTop }))
    const out = { label, url, face: fonts.map((f) => `${f.familyName} (${f.glyphCount})`).join(', ') }
    out.start = await state()
    await prose.focus()
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(500)
    out.arrowDown = await state()
    await page.keyboard.press('PageDown'); await page.waitForTimeout(500)
    out.pageDown = await state()
    await page.keyboard.press('End'); await page.waitForTimeout(500)
    out.end = await state()
    const box = await prose.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(300)
    out.wheelAtEnd = await state()
    await page.keyboard.press('Home'); await page.waitForTimeout(500)
    out.home = await state()
    // An explainer term in a scrolled box: focus scrolls it into view and its panel opens inside the text area.
    const term = page.locator('.bubble-text > .prose .term').first()
    if (await term.count()) {
      await prose.evaluate((el) => (el.scrollTop = el.scrollHeight))
      out.beforeTermFocus = await state()
      await term.focus()
      await page.waitForTimeout(100)
      out.afterTermFocus = await state()
      out.panel = await page.evaluate(() => {
        const panel = document.querySelector('.bubble-text .explainer[data-open]')
        if (!panel) return 'no panel open'
        const p = panel.getBoundingClientRect()
        const a = panel.offsetParent.getBoundingClientRect()
        const hit = document.elementFromPoint(p.left + p.width / 2, p.top + p.height / 2)
        return {
          containingBlock: panel.offsetParent.className,
          insideTextArea: p.top >= a.top - 1 && p.bottom <= a.bottom + 1 && p.left >= a.left - 1 && p.right <= a.right + 1,
          drawnOnTop: panel.contains(hit),
          rect: [Math.round(p.left), Math.round(p.top), Math.round(p.width), Math.round(p.height)],
        }
      })
      // The term scrolled away while its panel is open: the panel stays where it was placed.
      await prose.evaluate((el) => (el.scrollTop = el.scrollHeight))
      await page.waitForTimeout(100)
      out.panelAfterScroll = await page.evaluate(() => {
        const panel = document.querySelector('.bubble-text .explainer[data-open]')
        const term = panel?.previousElementSibling
        if (!panel || !term) return 'closed'
        return { panelTop: Math.round(panel.getBoundingClientRect().top), termTop: Math.round(term.getBoundingClientRect().top), termVisibleInBox: term.getBoundingClientRect().bottom > term.closest('.prose').getBoundingClientRect().top }
      })
    }
    console.log(JSON.stringify(out))
    await page.close()
  }
} finally {
  await browser.close()
}
```

### `wsl.sh`

`wsl-probe.sh` is the same file with `probe.mjs` in place of `measure.mjs` and no row count.

```sh
#!/bin/bash
# Runs measure.mjs inside WSL (Ubuntu 24.04, the CI runner's release) against the same build.
set -e
REPO=/mnt/c/Users/idse_/orca/workspaces/ELSA-Decisiontree/issue-263
M=$REPO/tests/browser/.data/m263
rm -rf /tmp/m263 && mkdir -p /tmp/m263 && cp -r $M/data /tmp/m263/data
cd $REPO
ELSA_DATA_DIR=/tmp/m263/data ELSA_ADMIN_EMAIL=admin@example.org ELSA_ADMIN_PASSWORD='test administrator password' \
  PORT=13950 HOSTNAME=127.0.0.1 NEXT_TELEMETRY_DISABLED=1 node .next/standalone/server.js > /tmp/m263/server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
for i in $(seq 1 30); do curl -sf -o /dev/null http://127.0.0.1:13950/full-node/full && break; sleep 1; done
PW_MODULE=$HOME/x/node_modules/playwright-core/index.js node $M/measure.mjs http://127.0.0.1:13950 $M/linux.jsonl linux
echo "rows: $(wc -l < $M/linux.jsonl)"
```

### `record_tables.py`

```python
"""Writes the record's tables from windows.jsonl and linux.jsonl: python record_tables.py > tables.md"""
import collections
import json

ROWS = {p: [json.loads(l) for l in open(f'{p}.jsonl', encoding='utf-8')] for p in ('windows', 'linux')}
PAGES = [
    ('full-node, 49-entry Trail (Bubble)', 'bubble', 'full-node (Bubble)'),
    ('first Tree, annex-i-legislation (Bubble)', 'bubble', 'annex-i-legislation (Bubble)'),
    ('overlay fixture, the largest Overlay (Overlay)', 'overlay', 'overlay fixture (Overlay)'),
    ('first Tree, an Overlay of prohibited-practices (Overlay)', 'overlay', 'first Tree Overlay'),
]
VIEWPORTS = ['1280x640', '1366x768', '1920x1080', '2560x1440', '1280x800', '1024x768', '768x1024', '390x844', '360x640', '320x480',
             '1280x639', '1280x632', '1280x631', '1280x564', '1280x563', '1280x506', '1280x505', '1279x800', '792x800', '791x800']
STATES = ['dev', 'dev, 600 characters', 'box, picture 2/5, 600 characters', 'box, picture 3/10, 600 characters',
          'box, picture 1/4, 600 characters', 'box, picture 1/5, 600 characters']


def get(platform, page, lang, vp, state):
    return next(r for r in ROWS[platform] if r['page'] == page and r['lang'] == lang and r['viewport'] == vp and r['state'] == state)


def interior(r, kind):
    return next((i for i in r['interiors'] if i['kind'] == kind), None)


def g(v):
    return '--' if v is None else f'{v:g}'


print('### Totals\n')
print('| platform | state | rows | document fits | rows with an element taller or wider than itself |')
print('|---|---|---|---|---|')
for p in ROWS:
    c = collections.Counter()
    for r in ROWS[p]:
        c[(r['state'], 'n')] += 1
        c[(r['state'], 'fits')] += r['docFits']
        c[(r['state'], 'fail')] += r['failureCount'] > 0
    for s in STATES:
        print(f"| {p} | {s} | {c[(s, 'n')]} | {c[(s, 'fits')]} | {c[(s, 'fail')]} |")

print('\n### dev with a 600-character description and nothing else changed: the rows that overflow\n')
print('| platform | page | lang | viewport | picture | box (lines) | foot | first failures |')
print('|---|---|---|---|---|---|---|---|')
for p in ROWS:
    for r in ROWS[p]:
        if r['state'] == 'dev, 600 characters' and r['failureCount']:
            kind = 'overlay' if 'Overlay)' in r['page'] else 'bubble'
            i = interior(r, 'bubble') or interior(r, kind)
            print(f"| {p} | {r['page']} | {r['lang']} | {r['viewport']} | {g(i['picture'])} | {g(i['box'])} ({g(i['lines'])}) | {g(i['foot'])} | {'; '.join(r['failures'][:2])} |")

print('\n### The picture\'s share against the box, where the picture is drawn (Windows; Linux equal to the pixel unless marked)\n')
print('Each cell: picture / box (lines the box shows) / foot, in CSS pixels, the description at 600 counted characters.\n')
fvps = ['1280x640', '1280x639', '1280x632', '792x800', '1024x768', '1366x768']
print('| page | lang | picture | ' + ' | '.join(fvps) + ' |')
print('|---|---|---|' + '---|' * len(fvps))
for page, kind, short in PAGES:
    for lang in ('en', 'nl'):
        for s in STATES[0:1] + STATES[2:]:
            cells = []
            for vp in fvps:
                w = interior(get('windows', page, lang, vp, s), kind)
                l = interior(get('linux', page, lang, vp, s), kind)
                cell = f"{g(w['picture'])} / {g(w['box'])} ({g(w['lines'])}) / {g(w['foot'])}"
                if (l['picture'], l['box'], l['foot']) != (w['picture'], w['box'], w['foot']):
                    cell += f" (Linux {g(l['picture'])} / {g(l['box'])} ({g(l['lines'])}) / {g(l['foot'])})"
                cells.append(cell)
            name = 'dev, as it stands (its own text)' if s == 'dev' else s.replace('box, picture ', '').replace(', 600 characters', '')
            print(f'| {short} | {lang} | {name} | ' + ' | '.join(cells) + ' |')

print('\n### The decision drawn in: the picture one fifth, the box at 600 characters, at every viewport\n')
print('Each cell: box / its whole text, in CSS pixels (lines the box shows) / foot. "notice": the minimumSize notice. Windows first, then Linux where it differs.\n')
print('| viewport | ' + ' | '.join(f'{short} {lang}' for _, _, short in PAGES for lang in ('en', 'nl')) + ' |')
print('|---|' + '---|' * 8)
for vp in VIEWPORTS:
    cells = []
    for page, kind, short in PAGES:
        for lang in ('en', 'nl'):
            parts = []
            for p in ('windows', 'linux'):
                r = get(p, page, lang, vp, STATES[-1])
                i = interior(r, kind)
                parts.append('notice' if r['notice'] or i is None else f"{g(i['box'])} / {g(i['boxScroll'])} ({g(i['lines'])}) / {g(i['foot'])}")
            cells.append(parts[0] if parts[0] == parts[1] else f'{parts[0]} (Linux {parts[1]})')
    print(f'| {vp} | ' + ' | '.join(cells) + ' |')
```
