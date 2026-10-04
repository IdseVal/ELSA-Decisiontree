# Issue #205: the room at the top left, under the chrome bar, for the preview's two buttons

> Measured on 2026-10-04 (UTC, as GitHub dates the merges) by the architect's run of #205, on
> the production build (`npm run build`) of `dev` at `0db7ca5`, served by `node
> .next/standalone/server.js` from a scratch data directory that `tests/browser/admin.ts`'s own
> `buildDataDir` made: `tests/fixtures/full-node` and the two seeded Trees of `trees/`, each once
> hidden and once published, the account Anna their creator. On Windows 11 with Node 22.18.0 and
> Playwright 1.62.1 (Chromium 151.0.7922.34), and in Linux in the
> `mcr.microsoft.com/playwright:v1.62.1-noble` image (the same Chromium, with `fonts-dejavu-core`
> 2.37-8 installed) against the same server, as `docs/research/issue-202-bar-room.md` measured the
> CI runner's faces: there the default stack is drawn in Liberation Sans, as on the CI runner,
> where Windows draws it in Segoe UI, and both draw the first Tree's own Open Sans (section 2's
> last list names the face each drew). Every number that `docs/adrs/ADR-205-*.md` and
> `docs/specs/application.md` 40 cite is here, with the scripts that produced it, copied whole in
> section 7, and their output as it ran on each system, in sections 3 and 4. Section 5 is the
> check of `<html lang>` that 40.3 cites, and section 6 the floor's notice and the band right of
> the arrow, on Windows.
> This is a record, not a contract: #206 builds the preview and its two buttons and measures them
> again on its own build, in `tests/browser/preview.spec.ts` (40.9).

## 1. What was measured

- **A button drawn into each page** by the script, at the top left under the chrome bar, where
  the owner put the preview's button and the way back ("Place the button top left (not in the
  header bar). And from that view, in the same place a button that brings the user back"): a
  fixed box at `top: var(--float-top)` and `left: var(--float-right)`, `var(--float-size)` tall,
  in the look of the editor's two floating controls at the top right (33.1, #176) -- the
  stylesheet's own variables, so the box stands where a mirror of those controls at the left edge
  stands: 10 pixels under the bar and 32 tall from 640 pixels of height up, one under it and 24
  tall below, four under it and 32 tall below 640 tall and 480 wide; 16 pixels from the left edge,
  8 below 480 wide. Its type was read off the editor's settings button on the same page: the
  default stack, 13 pixels on 20, weight 400, padding `0 14px 0 10px`. It was drawn two ways: **in
  words** -- a 16-pixel icon, a gap of 8, and "Preview" / "Voorbeeld" in the editor, "Back to the
  editor" / "Terug naar de editor" on the public page -- and **as an icon**, a 16-pixel icon in a
  box at least `--float-size` wide with 4 pixels of padding, as the floating controls are below
  1000 pixels wide. Nothing else on the page was changed, but in the column **the rule**, below.
- **What it must stay clear of**, every box on the page level with it or beside it: the up arrow,
  the step's red cross and its "Tree does not end here after all" (`.step-end > button`, "the
  ending's button" below, #178), the Bubble, the ending's badge (`.outcome`, inside the Bubble's
  box), every Option button and the control the Options collapse to, and in the editor the two
  floating controls at the top right. ***room***: from the button's left edge to the first of
  those boxes level with it, or to the window's right edge where none is. ***MEETS***: the
  button's box and one of those boxes overlap. ***clear***: it meets none and stands under the
  bar. The column ***the band*** gives the arrow's, the cross's and the ending's button's boxes,
  the ending's button's lines, the top of the highest Option button shown, and the bar's box, as
  on `dev`.
- **The rule**: the column `the rule` draws the button as `docs/specs/application.md` 40.5 has
  it -- in words from 1000 pixels wide, as an icon below -- and, in the editor of a hidden Tree on
  a step that ends, the ending's button as 40.5 has it: below 1000 pixels wide its `max-width` is
  `calc(50vw - var(--up-size) / 2 - 2 * var(--step-gap) - var(--float-right) - var(--float-size))`,
  the room left of the arrow less the button's column and a gap; below 640 pixels wide it is a
  round button of the cross's size, `--step-size`, holding a 16-pixel glyph. The column ends with
  the ending's button's box as that rule drew it.
- **Pages**, in the editor of the hidden copy and on the public page of the published copy of
  the same Tree, the two the preview's two buttons stand on (the preview draws the public page,
  40.2): the full Node of `tests/fixtures/full-node` -- both Answers, eight Options, at every
  maximum of the format -- under a first step that the script put above it through the API, as
  `tests/browser/step-buttons.spec.ts` does, so that it carries the cross in the editor; on the
  public page under a Trail of itself, so that it carries the up arrow; its No, `does-not-apply`,
  a step that ends; the first Tree's `ai-act-does-not-apply`, a step that ends, whose words are
  drawn in the Tree's Open Sans (#180: "Tree does not end here after all" is drawn as the Tree is);
  the first Tree's `annex-i-legislation`, eight Options; and the example Tree's `outside-scope`, a
  step that ends.
- **Viewports**: the nine of 10.6 where the tree view shows, the floor (320 x 480, where the
  notice stands in for the tree view), and both sides of every breakpoint the band above the
  Bubble has, as `tests/browser/step-buttons.spec.ts` walks them: 1000 wide (the floating
  controls' words, the cross's side), 640 tall (the arrow onto the outline), 480 wide (a phone's
  band), and the narrowest windows above the floor; and both sides of 640 wide, the width of the
  rule's second half: 1000 x 700, 999 x 700, 1000 x 639, 999 x 639, 640 x 700, 639 x 700,
  640 x 639, 639 x 639, 480 x 640, 480 x 639, 479 x 639, 321 x 481 and 321 x 700.
- **Languages**: English and Dutch, in both the chrome and the Trees.
- **The public bar's room**, at the nine viewports of 10.6 where the tree view shows, on three of
  the public pages: between the bar's first child (the arrow and the Tree's mark) and its
  controls, the bar's gap taken off, as `docs/research/issue-202-bar-room.md` measured it, with
  the share button (as on `dev`) and without it (as the preview's bar draws it, 40.4).
- **The faces drawn**, through `CSS.getPlatformFontsForNode`: the button's words, and the
  ending's button on the three pages that end, at 1280 x 640.
- **The floor**, by a second script on Windows (`floor.mjs`, section 6): at 320 x 480, 320 x 700,
  800 x 480 and 300 x 400, on the full Node's No in the editor and on the public page, in both
  languages, the boxes of the notice's text lines, of the floating controls, and of the button
  drawn as an icon at the top left as above.
- **The band right of the arrow**, by a third script on Windows (`right.mjs`, section 6): below
  1000 pixels wide, in the editor on the full Node's No, the red cross's box, the floating
  controls' and the room between them.
- **The runs.** The script ran four times on each system on 2026-10-04: the first without the
  column `the rule` and at nineteen viewports; the second with that column and the four
  viewports either side of 640 wide; the third and fourth after two corrections to its last
  section, the face of the drawn button, which the first three printed empty for most rows (the
  probe was laid out off the page's grid, then not yet laid out when it was asked). Every table
  row the four printed was the same in each run that printed it but for the first step's id, a
  fresh one per run; sections 3 and 4 are the fourth. `floor.mjs`, `right.mjs` and `check-lang.ts`
  ran after them, on the same build, on Windows.

## 2. What it shows

Each pair of numbers is Windows' first, then the CI image's.

**A step that does not end.**

- In the editor of a hidden Tree, a button at the top left meets nothing, in words or as an icon,
  at any viewport measured, in either language, on either system: on the full Node with its
  eight Options and the cross, and on the first Tree's `annex-i-legislation`. Its room is 128.5
  pixels or more (at 321 pixels wide, to the up arrow); "Voorbeeld" in words is 109 / 108.6.
- The highest Option button shown stands under it: its top at 100.1 at 1280 x 640, where the
  button ends at 86, and lower at every other viewport where the fan shows.
- On the public page, the button as an icon meets nothing anywhere; in words, "Back to the
  editor" (152 / 151.2) and "Terug naar de editor" (166.3 / 166.4) meet the up arrow at
  360 x 640, 321 x 481 and 321 x 700, where the room is 148 and 128.5.

**A step that ends, in the editor of a hidden Tree.**

- The ending's button stands left of the arrow, against it -- from 1000 pixels wide with the
  cross between them (30.8). On one line it is 192.2 to 227.4 pixels wide at 13 pixels on
  Windows and 198 to 223 in the CI image, in Dutch and in English, the widest the first Tree's
  English in Open Sans; at 11 pixels, below 640 pixels tall, 159.2 to 189 and 164.4 to 187. Where
  its words take two lines it is as wide as its `max-width`, the band left of the arrow less 8 at
  each end: 140 pixels at 360 x 640 (8 to 148), 200 at 480 x 640 in English (8 to 208), 120.5 at
  321 pixels wide (8 to 128.5).
- So from 1000 pixels wide a button in words stands clear of it, 90.4 / 92.7 pixels or more
  apart, at 1000 x 700 (the first Tree's English: on Windows the button to 110.2, the ending's
  button from 200.6). Below 1000, in words or as an icon, the button meets it on every one of the
  three pages wherever both stand on the band's line. As an icon: at 360 x 640, 480 x 640,
  321 x 481 and 321 x 700 in both languages, and at 480 x 639 and 479 x 639 in English (at
  480 x 639 in Dutch too on the first Tree on Windows). In words: at all of those, at 480 x 639
  and 479 x 639 in both languages, at 640 x 700 and 639 x 700 in both languages, and at 639 x 639
  and 640 x 639 -- in the CI image on every page in both languages; on Windows at 639 x 639 in
  English on every page, and at 640 x 639 and in Dutch on the first Tree only (on the full Node's
  No in English at 640 x 639 the two stand 0.1 pixels apart). At 390 x 844 and 768 x 1024 the
  arrow stands lower, the window giving the Bubble more room above it, and the step's buttons with
  it, under the button: 103.5 to 137.5 and 186.5 to 218.5, where the button ends at 78 and 86.
- **The rule** of 40.5 is clear in every row above the floor: 440 rows on each system, and the
  floor's notice in the other 20. Its tightest rows are at 640 pixels wide, where the ending's
  button keeps its words: at 640 x 700 in English the button as an icon ends at 48 and the
  ending's button begins at 60.6 / 65 on the first Tree (12.6 / 17 pixels apart) and at 74 / 65.8
  on the full Node's No and the example Tree; at 640 x 639, at 99 / 101 and 110.3 / 103.4. Its
  `max-width` there is 232 at 640 x 700 and 240 at 640 x 639, more than its one line on every
  Tree measured, so it kept its one line in every row of the column, from 640 to 999 pixels wide.
  Below 640, as an icon of the cross's size -- 32 pixels, 24 at 480 x 639 -- the ending's button
  stands against the arrow: 116 to 148 at 360 x 640, 176 to 208 at 480 x 640, 184 to 208 at
  480 x 639, 96.5 to 128.5 at 321 pixels wide; 56.5 pixels or more from the button.

**The public bar without the share button.** At every viewport of 10.6 where the tree view shows
it has more room than with it, on both seeded Trees and the full Node's fixture: 57.1 to 92.2
pixels more on Windows and 57.2 to 91 in the CI image (the share button and the bar's gap, the
least below 480 pixels wide, where the bar's pills are smaller), and no row of it overflows.

**At and below the floor** (section 6, on Windows), where the notice stands in for the tree view
(10.4): a button at the top left, as an icon, stands clear of the notice's text at 320 x 480,
320 x 700 and 800 x 480 in both languages, in the editor and on the public page; at 300 x 400,
below the floor both ways, the notice's first line begins at 34.5 (36.4 in Dutch) under the
button's 8 to 40. On `dev` the floating controls at the top right already stand over the end of
the notice's first line at 320 x 480 and 320 x 700 (238 to 272 over a line from 232.8 to 275.5,
61 to 78 tall, in English) and at 300 x 400.

**Right of the arrow, below 1000 pixels wide** (section 6, on Windows), the red cross and the
floating controls leave 345.5 pixels between them at 999 x 700, 86 at 480 x 640, 34 at 360 x 640
and 14.5 at 321 pixels wide, in both languages.

**The faces.** The button's words were drawn in Segoe UI on Windows and in Liberation Sans in the
CI image, the default stack's faces; the ending's button in Segoe UI Semibold and Liberation Sans
on the full Node's fixture and the example Tree, whose Themes name no body face, and in Open Sans
SemiBold on the first Tree, on both systems.

## 3. The output on Windows

The editor's floating controls: {"family":"-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Liberation Sans\", sans-serif","size":"13px","line":"20px","weight":"400","padding":"0px 14px 0px 10px","height":"32px"}

### The editor of a hidden Tree: the full Node under a first step: both Answers, eight Options, the cross

`/admin/trees/hidden-draft/n-yjvw7m/full`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..110.2 x 54..86; room 560 to the cross; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..110.2 x 54..86; room 603 to the cross; clear | 16..48 x 54..86; room 603 to the cross; clear | 16..110.2 x 54..86; room 603 to the cross; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..110.2 x 54..86; room 1515.9 to the floating control; clear | 16..48 x 54..86; room 1515.9 to the floating control; clear | 16..110.2 x 54..86; room 1515.9 to the floating control; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..110.2 x 54..86; room 2155.9 to the floating control; clear | 16..48 x 54..86; room 2155.9 to the floating control; clear | 16..110.2 x 54..86; room 2155.9 to the floating control; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..110.2 x 54..86; room 560 to the cross; clear |
| en | 1024 x 768 | arrow 488..536 x 46..94; cross 448..480 x 54..86; bar 0..1024 x 0..44 | 16..110.2 x 54..86; room 432 to the cross; clear | 16..48 x 54..86; room 432 to the cross; clear | 16..110.2 x 54..86; room 432 to the cross; clear |
| en | 768 x 1024 | arrow 360..408 x 152.5..200.5; cross 416..448 x 160.5..192.5; bar 0..768 x 0..44 | 16..110.2 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear |
| en | 390 x 844 | arrow 171..219 x 84.5..132.5; cross 227..259 x 92.5..124.5; bar 0..390 x 0..36 | 8..102.2 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; bar 0..360 x 0..36 | 8..102.2 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; bar 0..1000 x 0..44 | 16..110.2 x 54..86; room 420 to the cross; clear | 16..48 x 54..86; room 420 to the cross; clear | 16..110.2 x 54..86; room 420 to the cross; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; bar 0..999 x 0..44 | 16..110.2 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; bar 0..1000 x 0..44 | 16..110.2 x 45..69; room 428 to the cross; clear | 16..42 x 45..69; room 428 to the cross; clear | 16..110.2 x 45..69; room 428 to the cross; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; bar 0..999 x 0..44 | 16..110.2 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; bar 0..640 x 0..44 | 16..110.2 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; bar 0..639 x 0..44 | 16..110.2 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; bar 0..640 x 0..44 | 16..110.2 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; bar 0..639 x 0..44 | 16..110.2 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; bar 0..480 x 0..44 | 16..110.2 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; bar 0..480 x 0..44 | 16..110.2 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; bar 0..479 x 0..36 | 8..102.2 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; bar 0..321 x 0..36 | 8..102.2 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; bar 0..321 x 0..36 | 8..102.2 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..125 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..125 x 54..86; room 560 to the cross; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..125 x 54..86; room 603 to the cross; clear | 16..48 x 54..86; room 603 to the cross; clear | 16..125 x 54..86; room 603 to the cross; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..125 x 54..86; room 1474.5 to the floating control; clear | 16..48 x 54..86; room 1474.5 to the floating control; clear | 16..125 x 54..86; room 1474.5 to the floating control; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..125 x 54..86; room 2114.5 to the floating control; clear | 16..48 x 54..86; room 2114.5 to the floating control; clear | 16..125 x 54..86; room 2114.5 to the floating control; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..125 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..125 x 54..86; room 560 to the cross; clear |
| nl | 1024 x 768 | arrow 488..536 x 46..94; cross 448..480 x 54..86; bar 0..1024 x 0..44 | 16..125 x 54..86; room 432 to the cross; clear | 16..48 x 54..86; room 432 to the cross; clear | 16..125 x 54..86; room 432 to the cross; clear |
| nl | 768 x 1024 | arrow 360..408 x 152.5..200.5; cross 416..448 x 160.5..192.5; bar 0..768 x 0..44 | 16..125 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear |
| nl | 390 x 844 | arrow 171..219 x 84.5..132.5; cross 227..259 x 92.5..124.5; bar 0..390 x 0..36 | 8..117 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; bar 0..360 x 0..36 | 8..117 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; bar 0..1000 x 0..44 | 16..125 x 54..86; room 420 to the cross; clear | 16..48 x 54..86; room 420 to the cross; clear | 16..125 x 54..86; room 420 to the cross; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; bar 0..999 x 0..44 | 16..125 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; bar 0..1000 x 0..44 | 16..125 x 45..69; room 428 to the cross; clear | 16..42 x 45..69; room 428 to the cross; clear | 16..125 x 45..69; room 428 to the cross; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; bar 0..999 x 0..44 | 16..125 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; bar 0..640 x 0..44 | 16..125 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; bar 0..639 x 0..44 | 16..125 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; bar 0..640 x 0..44 | 16..125 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; bar 0..639 x 0..44 | 16..125 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; bar 0..480 x 0..44 | 16..125 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; bar 0..480 x 0..44 | 16..125 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; bar 0..479 x 0..36 | 8..117 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; bar 0..321 x 0..36 | 8..117 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; bar 0..321 x 0..36 | 8..117 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The editor of a hidden Tree: its No, a step that ends: the cross and "Tree does not end here after all"

`/admin/trees/hidden-draft/n-yjvw7m/full/does-not-apply`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 354..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 338 to the ending's button; clear | 16..48 x 54..86; room 338 to the ending's button; clear | 16..110.2 x 54..86; room 338 to the ending's button; clear; ending's button 354..568 x 54..86, 1 line |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 397..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..110.2 x 54..86; room 381 to the ending's button; clear | 16..48 x 54..86; room 381 to the ending's button; clear | 16..110.2 x 54..86; room 381 to the ending's button; clear; ending's button 397..611 x 58.5..90.5, 1 line |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 674..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..110.2 x 54..86; room 1515.9 to the floating control; clear | 16..48 x 54..86; room 1515.9 to the floating control; clear | 16..110.2 x 54..86; room 1515.9 to the floating control; clear; ending's button 674..888 x 214.5..246.5, 1 line |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 994..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..110.2 x 54..86; room 2155.9 to the floating control; clear | 16..48 x 54..86; room 2155.9 to the floating control; clear | 16..110.2 x 54..86; room 2155.9 to the floating control; clear; ending's button 994..1208 x 394.5..426.5, 1 line |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 354..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 338 to the ending's button; clear | 16..48 x 54..86; room 338 to the ending's button; clear | 16..110.2 x 54..86; room 338 to the ending's button; clear; ending's button 354..568 x 74.5..106.5, 1 line |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 226..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..110.2 x 54..86; room 210 to the ending's button; clear | 16..48 x 54..86; room 210 to the ending's button; clear | 16..110.2 x 54..86; room 210 to the ending's button; clear; ending's button 226..440 x 58.5..90.5, 1 line |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 138..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..110.2 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear; ending's button 138..352 x 186.5..218.5, 1 line |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..102.2 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..102.2 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 214..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..110.2 x 54..86; room 198 to the ending's button; clear | 16..48 x 54..86; room 198 to the ending's button; clear | 16..110.2 x 54..86; room 198 to the ending's button; clear; ending's button 214..428 x 54..86, 1 line |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 253.5..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..110.2 x 54..86; room 237.5 to the ending's button; clear | 16..48 x 54..86; room 237.5 to the ending's button; clear | 16..48 x 54..86; room 237.5 to the ending's button; clear; ending's button 253.5..467.5 x 54..86, 1 line |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 258.3..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..110.2 x 45..69; room 242.3 to the ending's button; clear | 16..42 x 45..69; room 242.3 to the ending's button; clear | 16..110.2 x 45..69; room 242.3 to the ending's button; clear; ending's button 258.3..436 x 45..69, 1 line |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 289.8..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..110.2 x 45..69; room 273.8 to the ending's button; clear | 16..42 x 45..69; room 273.8 to the ending's button; clear | 16..42 x 45..69; room 273.8 to the ending's button; clear; ending's button 289.8..467.5 x 45..69, 1 line |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 74..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..110.2 x 54..86; room 58 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 58 to the ending's button; clear | 16..48 x 54..86; room 58 to the ending's button; clear; ending's button 74..288 x 54..86, 1 line |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 73.5..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..110.2 x 54..86; room 57.5 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 57.5 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 110.3..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..110.2 x 45..69; room 94.3 to the ending's button; clear | 16..42 x 45..69; room 94.3 to the ending's button; clear | 16..42 x 45..69; room 94.3 to the ending's button; clear; ending's button 110.3..288 x 45..69, 1 line |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 109.8..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..110.2 x 45..69; room 93.8 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 93.8 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 8..208 x 46..94, 2 lines; bar 0..480 x 0..44 | 16..110.2 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 30.3..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..110.2 x 45..69; room 14.3 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 14.3 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 29.8..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..102.2 x 40..72; room 21.8 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 21.8 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..102.2 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..102.2 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 375.8..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..125 x 54..86; room 359.8 to the ending's button; clear | 16..48 x 54..86; room 359.8 to the ending's button; clear | 16..125 x 54..86; room 359.8 to the ending's button; clear; ending's button 375.8..568 x 54..86, 1 line |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 418.8..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..125 x 54..86; room 402.8 to the ending's button; clear | 16..48 x 54..86; room 402.8 to the ending's button; clear | 16..125 x 54..86; room 402.8 to the ending's button; clear; ending's button 418.8..611 x 58.5..90.5, 1 line |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 695.8..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..125 x 54..86; room 1474.5 to the floating control; clear | 16..48 x 54..86; room 1474.5 to the floating control; clear | 16..125 x 54..86; room 1474.5 to the floating control; clear; ending's button 695.8..888 x 214.5..246.5, 1 line |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 1015.8..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..125 x 54..86; room 2114.5 to the floating control; clear | 16..48 x 54..86; room 2114.5 to the floating control; clear | 16..125 x 54..86; room 2114.5 to the floating control; clear; ending's button 1015.8..1208 x 394.5..426.5, 1 line |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 375.8..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..125 x 54..86; room 359.8 to the ending's button; clear | 16..48 x 54..86; room 359.8 to the ending's button; clear | 16..125 x 54..86; room 359.8 to the ending's button; clear; ending's button 375.8..568 x 74.5..106.5, 1 line |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 247.8..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..125 x 54..86; room 231.8 to the ending's button; clear | 16..48 x 54..86; room 231.8 to the ending's button; clear | 16..125 x 54..86; room 231.8 to the ending's button; clear; ending's button 247.8..440 x 58.5..90.5, 1 line |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 159.8..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..125 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear; ending's button 159.8..352 x 186.5..218.5, 1 line |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..117 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..117 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 235.8..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..125 x 54..86; room 219.8 to the ending's button; clear | 16..48 x 54..86; room 219.8 to the ending's button; clear | 16..125 x 54..86; room 219.8 to the ending's button; clear; ending's button 235.8..428 x 54..86, 1 line |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 275.3..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..125 x 54..86; room 259.3 to the ending's button; clear | 16..48 x 54..86; room 259.3 to the ending's button; clear | 16..48 x 54..86; room 259.3 to the ending's button; clear; ending's button 275.3..467.5 x 54..86, 1 line |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 276.8..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..125 x 45..69; room 260.8 to the ending's button; clear | 16..42 x 45..69; room 260.8 to the ending's button; clear | 16..125 x 45..69; room 260.8 to the ending's button; clear; ending's button 276.8..436 x 45..69, 1 line |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 308.3..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..125 x 45..69; room 292.3 to the ending's button; clear | 16..42 x 45..69; room 292.3 to the ending's button; clear | 16..42 x 45..69; room 292.3 to the ending's button; clear; ending's button 308.3..467.5 x 45..69, 1 line |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 95.8..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..125 x 54..86; room 79.8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 79.8 to the ending's button; clear | 16..48 x 54..86; room 79.8 to the ending's button; clear; ending's button 95.8..288 x 54..86, 1 line |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 95.3..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..125 x 54..86; room 79.3 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 79.3 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 128.8..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..125 x 45..69; room 112.8 to the ending's button; clear | 16..42 x 45..69; room 112.8 to the ending's button; clear | 16..42 x 45..69; room 112.8 to the ending's button; clear; ending's button 128.8..288 x 45..69, 1 line |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 128.3..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..125 x 45..69; room 112.3 to the ending's button; clear | 16..42 x 45..69; room 112.3 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 15.8..208 x 54..86, 1 line; bar 0..480 x 0..44 | 16..125 x 54..86; room -0.2 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -0.2 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 48.8..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..125 x 45..69; room 32.8 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 32.8 to the ending's button; clear | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 48.3..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..117 x 40..72; room 40.3 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 40.3 to the ending's button; clear | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..117 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..117 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The editor of a hidden Tree: the first Tree (Open Sans): "Does not apply", a step that ends

`/admin/trees/agrifood-hidden/start/article-2-exclusions/ai-act-does-not-apply`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 340.6..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 324.6 to the ending's button; clear | 16..48 x 54..86; room 324.6 to the ending's button; clear | 16..110.2 x 54..86; room 324.6 to the ending's button; clear; ending's button 340.6..568 x 54..86, 1 line |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 383.6..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..110.2 x 54..86; room 367.6 to the ending's button; clear | 16..48 x 54..86; room 367.6 to the ending's button; clear | 16..110.2 x 54..86; room 367.6 to the ending's button; clear; ending's button 383.6..611 x 58.5..90.5, 1 line |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 660.6..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..110.2 x 54..86; room 1605.7 to the floating control; clear | 16..48 x 54..86; room 1605.7 to the floating control; clear | 16..110.2 x 54..86; room 1605.7 to the floating control; clear; ending's button 660.6..888 x 214.5..246.5, 1 line |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 980.6..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..110.2 x 54..86; room 2245.7 to the floating control; clear | 16..48 x 54..86; room 2245.7 to the floating control; clear | 16..110.2 x 54..86; room 2245.7 to the floating control; clear; ending's button 980.6..1208 x 394.5..426.5, 1 line |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 340.6..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 324.6 to the ending's button; clear | 16..48 x 54..86; room 324.6 to the ending's button; clear | 16..110.2 x 54..86; room 324.6 to the ending's button; clear; ending's button 340.6..568 x 74.5..106.5, 1 line |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 212.6..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..110.2 x 54..86; room 196.6 to the ending's button; clear | 16..48 x 54..86; room 196.6 to the ending's button; clear | 16..110.2 x 54..86; room 196.6 to the ending's button; clear; ending's button 212.6..440 x 58.5..90.5, 1 line |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 124.6..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..110.2 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear; ending's button 124.6..352 x 186.5..218.5, 1 line |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..102.2 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..102.2 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 200.6..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..110.2 x 54..86; room 184.6 to the ending's button; clear | 16..48 x 54..86; room 184.6 to the ending's button; clear | 16..110.2 x 54..86; room 184.6 to the ending's button; clear; ending's button 200.6..428 x 54..86, 1 line |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 240.1..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..110.2 x 54..86; room 224.1 to the ending's button; clear | 16..48 x 54..86; room 224.1 to the ending's button; clear | 16..48 x 54..86; room 224.1 to the ending's button; clear; ending's button 240.1..467.5 x 54..86, 1 line |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 247..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..110.2 x 45..69; room 231 to the ending's button; clear | 16..42 x 45..69; room 231 to the ending's button; clear | 16..110.2 x 45..69; room 231 to the ending's button; clear; ending's button 247..436 x 45..69, 1 line |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 278.5..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..110.2 x 45..69; room 262.5 to the ending's button; clear | 16..42 x 45..69; room 262.5 to the ending's button; clear | 16..42 x 45..69; room 262.5 to the ending's button; clear; ending's button 278.5..467.5 x 45..69, 1 line |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 60.6..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..110.2 x 54..86; room 44.6 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 44.6 to the ending's button; clear | 16..48 x 54..86; room 44.6 to the ending's button; clear; ending's button 60.6..288 x 54..86, 1 line |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 60.1..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..110.2 x 54..86; room 44.1 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 44.1 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 99..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..110.2 x 45..69; room 83 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 83 to the ending's button; clear | 16..42 x 45..69; room 83 to the ending's button; clear; ending's button 99..288 x 45..69, 1 line |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 98.5..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..110.2 x 45..69; room 82.5 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 82.5 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 8..208 x 46..94, 2 lines; bar 0..480 x 0..44 | 16..110.2 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 19..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..110.2 x 45..69; room 3 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 3 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 18.5..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..102.2 x 40..72; room 10.5 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 10.5 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..102.2 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..102.2 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 366.9..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..125 x 54..86; room 350.9 to the ending's button; clear | 16..48 x 54..86; room 350.9 to the ending's button; clear | 16..125 x 54..86; room 350.9 to the ending's button; clear; ending's button 366.9..568 x 54..86, 1 line |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 409.9..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..125 x 54..86; room 393.9 to the ending's button; clear | 16..48 x 54..86; room 393.9 to the ending's button; clear | 16..125 x 54..86; room 393.9 to the ending's button; clear; ending's button 409.9..611 x 58.5..90.5, 1 line |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 686.9..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..125 x 54..86; room 1583.2 to the floating control; clear | 16..48 x 54..86; room 1583.2 to the floating control; clear | 16..125 x 54..86; room 1583.2 to the floating control; clear; ending's button 686.9..888 x 214.5..246.5, 1 line |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 1006.9..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..125 x 54..86; room 2223.2 to the floating control; clear | 16..48 x 54..86; room 2223.2 to the floating control; clear | 16..125 x 54..86; room 2223.2 to the floating control; clear; ending's button 1006.9..1208 x 394.5..426.5, 1 line |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 366.9..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..125 x 54..86; room 350.9 to the ending's button; clear | 16..48 x 54..86; room 350.9 to the ending's button; clear | 16..125 x 54..86; room 350.9 to the ending's button; clear; ending's button 366.9..568 x 74.5..106.5, 1 line |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 238.9..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..125 x 54..86; room 222.9 to the ending's button; clear | 16..48 x 54..86; room 222.9 to the ending's button; clear | 16..125 x 54..86; room 222.9 to the ending's button; clear; ending's button 238.9..440 x 58.5..90.5, 1 line |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 150.9..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..125 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear; ending's button 150.9..352 x 186.5..218.5, 1 line |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..117 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..117 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 226.9..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..125 x 54..86; room 210.9 to the ending's button; clear | 16..48 x 54..86; room 210.9 to the ending's button; clear | 16..125 x 54..86; room 210.9 to the ending's button; clear; ending's button 226.9..428 x 54..86, 1 line |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 266.4..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..125 x 54..86; room 250.4 to the ending's button; clear | 16..48 x 54..86; room 250.4 to the ending's button; clear | 16..48 x 54..86; room 250.4 to the ending's button; clear; ending's button 266.4..467.5 x 54..86, 1 line |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 269.2..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..125 x 45..69; room 253.2 to the ending's button; clear | 16..42 x 45..69; room 253.2 to the ending's button; clear | 16..125 x 45..69; room 253.2 to the ending's button; clear; ending's button 269.2..436 x 45..69, 1 line |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 300.7..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..125 x 45..69; room 284.7 to the ending's button; clear | 16..42 x 45..69; room 284.7 to the ending's button; clear | 16..42 x 45..69; room 284.7 to the ending's button; clear; ending's button 300.7..467.5 x 45..69, 1 line |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 86.9..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..125 x 54..86; room 70.9 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 70.9 to the ending's button; clear | 16..48 x 54..86; room 70.9 to the ending's button; clear; ending's button 86.9..288 x 54..86, 1 line |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 86.4..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..125 x 54..86; room 70.4 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 70.4 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 121.2..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..125 x 45..69; room 105.2 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 105.2 to the ending's button; clear | 16..42 x 45..69; room 105.2 to the ending's button; clear; ending's button 121.2..288 x 45..69, 1 line |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 120.7..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..125 x 45..69; room 104.7 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 104.7 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 8..208 x 46..94, 2 lines; bar 0..480 x 0..44 | 16..125 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 41.2..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..125 x 45..69; room 25.2 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 25.2 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 40.7..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..117 x 40..72; room 32.7 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 32.7 to the ending's button; clear | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..117 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..117 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The editor of a hidden Tree: the first Tree: annex-i-legislation, eight Options

`/admin/trees/agrifood-hidden/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..110.2 x 54..86; room 560 to the cross; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..110.2 x 54..86; room 603 to the cross; clear | 16..48 x 54..86; room 603 to the cross; clear | 16..110.2 x 54..86; room 603 to the cross; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..110.2 x 54..86; room 1605.7 to the floating control; clear | 16..48 x 54..86; room 1605.7 to the floating control; clear | 16..110.2 x 54..86; room 1605.7 to the floating control; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..110.2 x 54..86; room 2245.7 to the floating control; clear | 16..48 x 54..86; room 2245.7 to the floating control; clear | 16..110.2 x 54..86; room 2245.7 to the floating control; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..110.2 x 54..86; room 560 to the cross; clear |
| en | 1024 x 768 | arrow 488..536 x 46..94; cross 448..480 x 54..86; bar 0..1024 x 0..44 | 16..110.2 x 54..86; room 432 to the cross; clear | 16..48 x 54..86; room 432 to the cross; clear | 16..110.2 x 54..86; room 432 to the cross; clear |
| en | 768 x 1024 | arrow 360..408 x 152.5..200.5; cross 416..448 x 160.5..192.5; bar 0..768 x 0..44 | 16..110.2 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear |
| en | 390 x 844 | arrow 171..219 x 84.5..132.5; cross 227..259 x 92.5..124.5; bar 0..390 x 0..36 | 8..102.2 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; bar 0..360 x 0..36 | 8..102.2 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; bar 0..1000 x 0..44 | 16..110.2 x 54..86; room 420 to the cross; clear | 16..48 x 54..86; room 420 to the cross; clear | 16..110.2 x 54..86; room 420 to the cross; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; bar 0..999 x 0..44 | 16..110.2 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; bar 0..1000 x 0..44 | 16..110.2 x 45..69; room 428 to the cross; clear | 16..42 x 45..69; room 428 to the cross; clear | 16..110.2 x 45..69; room 428 to the cross; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; bar 0..999 x 0..44 | 16..110.2 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; bar 0..640 x 0..44 | 16..110.2 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; bar 0..639 x 0..44 | 16..110.2 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; bar 0..640 x 0..44 | 16..110.2 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; bar 0..639 x 0..44 | 16..110.2 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; bar 0..480 x 0..44 | 16..110.2 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; bar 0..480 x 0..44 | 16..110.2 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; bar 0..479 x 0..36 | 8..102.2 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; bar 0..321 x 0..36 | 8..102.2 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; bar 0..321 x 0..36 | 8..102.2 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..125 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..125 x 54..86; room 560 to the cross; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..125 x 54..86; room 603 to the cross; clear | 16..48 x 54..86; room 603 to the cross; clear | 16..125 x 54..86; room 603 to the cross; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..125 x 54..86; room 1583.2 to the floating control; clear | 16..48 x 54..86; room 1583.2 to the floating control; clear | 16..125 x 54..86; room 1583.2 to the floating control; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..125 x 54..86; room 2223.2 to the floating control; clear | 16..48 x 54..86; room 2223.2 to the floating control; clear | 16..125 x 54..86; room 2223.2 to the floating control; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..125 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..125 x 54..86; room 560 to the cross; clear |
| nl | 1024 x 768 | arrow 488..536 x 46..94; cross 448..480 x 54..86; bar 0..1024 x 0..44 | 16..125 x 54..86; room 432 to the cross; clear | 16..48 x 54..86; room 432 to the cross; clear | 16..125 x 54..86; room 432 to the cross; clear |
| nl | 768 x 1024 | arrow 360..408 x 152.5..200.5; cross 416..448 x 160.5..192.5; bar 0..768 x 0..44 | 16..125 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear |
| nl | 390 x 844 | arrow 171..219 x 84.5..132.5; cross 227..259 x 92.5..124.5; bar 0..390 x 0..36 | 8..117 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; bar 0..360 x 0..36 | 8..117 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; bar 0..1000 x 0..44 | 16..125 x 54..86; room 420 to the cross; clear | 16..48 x 54..86; room 420 to the cross; clear | 16..125 x 54..86; room 420 to the cross; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; bar 0..999 x 0..44 | 16..125 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; bar 0..1000 x 0..44 | 16..125 x 45..69; room 428 to the cross; clear | 16..42 x 45..69; room 428 to the cross; clear | 16..125 x 45..69; room 428 to the cross; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; bar 0..999 x 0..44 | 16..125 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; bar 0..640 x 0..44 | 16..125 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; bar 0..639 x 0..44 | 16..125 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; bar 0..640 x 0..44 | 16..125 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; bar 0..639 x 0..44 | 16..125 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; bar 0..480 x 0..44 | 16..125 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; bar 0..480 x 0..44 | 16..125 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; bar 0..479 x 0..36 | 8..117 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; bar 0..321 x 0..36 | 8..117 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; bar 0..321 x 0..36 | 8..117 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The editor of a hidden Tree: the example Tree: outside-scope, a step that ends

`/admin/trees/example-hidden/start/outside-scope`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 354..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 338 to the ending's button; clear | 16..48 x 54..86; room 338 to the ending's button; clear | 16..110.2 x 54..86; room 338 to the ending's button; clear; ending's button 354..568 x 54..86, 1 line |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 397..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..110.2 x 54..86; room 381 to the ending's button; clear | 16..48 x 54..86; room 381 to the ending's button; clear | 16..110.2 x 54..86; room 381 to the ending's button; clear; ending's button 397..611 x 58.5..90.5, 1 line |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 674..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..110.2 x 54..86; room 1605.7 to the floating control; clear | 16..48 x 54..86; room 1605.7 to the floating control; clear | 16..110.2 x 54..86; room 1605.7 to the floating control; clear; ending's button 674..888 x 214.5..246.5, 1 line |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 994..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..110.2 x 54..86; room 2245.7 to the floating control; clear | 16..48 x 54..86; room 2245.7 to the floating control; clear | 16..110.2 x 54..86; room 2245.7 to the floating control; clear; ending's button 994..1208 x 394.5..426.5, 1 line |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 354..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..110.2 x 54..86; room 338 to the ending's button; clear | 16..48 x 54..86; room 338 to the ending's button; clear | 16..110.2 x 54..86; room 338 to the ending's button; clear; ending's button 354..568 x 74.5..106.5, 1 line |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 226..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..110.2 x 54..86; room 210 to the ending's button; clear | 16..48 x 54..86; room 210 to the ending's button; clear | 16..110.2 x 54..86; room 210 to the ending's button; clear; ending's button 226..440 x 58.5..90.5, 1 line |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 138..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..110.2 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear; ending's button 138..352 x 186.5..218.5, 1 line |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..102.2 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..102.2 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 214..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..110.2 x 54..86; room 198 to the ending's button; clear | 16..48 x 54..86; room 198 to the ending's button; clear | 16..110.2 x 54..86; room 198 to the ending's button; clear; ending's button 214..428 x 54..86, 1 line |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 253.5..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..110.2 x 54..86; room 237.5 to the ending's button; clear | 16..48 x 54..86; room 237.5 to the ending's button; clear | 16..48 x 54..86; room 237.5 to the ending's button; clear; ending's button 253.5..467.5 x 54..86, 1 line |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 258.3..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..110.2 x 45..69; room 242.3 to the ending's button; clear | 16..42 x 45..69; room 242.3 to the ending's button; clear | 16..110.2 x 45..69; room 242.3 to the ending's button; clear; ending's button 258.3..436 x 45..69, 1 line |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 289.8..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..110.2 x 45..69; room 273.8 to the ending's button; clear | 16..42 x 45..69; room 273.8 to the ending's button; clear | 16..42 x 45..69; room 273.8 to the ending's button; clear; ending's button 289.8..467.5 x 45..69, 1 line |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 74..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..110.2 x 54..86; room 58 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 58 to the ending's button; clear | 16..48 x 54..86; room 58 to the ending's button; clear; ending's button 74..288 x 54..86, 1 line |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 73.5..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..110.2 x 54..86; room 57.5 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 57.5 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 110.3..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..110.2 x 45..69; room 94.3 to the ending's button; clear | 16..42 x 45..69; room 94.3 to the ending's button; clear | 16..42 x 45..69; room 94.3 to the ending's button; clear; ending's button 110.3..288 x 45..69, 1 line |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 109.8..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..110.2 x 45..69; room 93.8 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 93.8 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 8..208 x 46..94, 2 lines; bar 0..480 x 0..44 | 16..110.2 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 30.3..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..110.2 x 45..69; room 14.3 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 14.3 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 29.8..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..102.2 x 40..72; room 21.8 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 21.8 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..102.2 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..102.2 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 375.8..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..125 x 54..86; room 359.8 to the ending's button; clear | 16..48 x 54..86; room 359.8 to the ending's button; clear | 16..125 x 54..86; room 359.8 to the ending's button; clear; ending's button 375.8..568 x 54..86, 1 line |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 418.8..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..125 x 54..86; room 402.8 to the ending's button; clear | 16..48 x 54..86; room 402.8 to the ending's button; clear | 16..125 x 54..86; room 402.8 to the ending's button; clear; ending's button 418.8..611 x 58.5..90.5, 1 line |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 695.8..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..125 x 54..86; room 1583.2 to the floating control; clear | 16..48 x 54..86; room 1583.2 to the floating control; clear | 16..125 x 54..86; room 1583.2 to the floating control; clear; ending's button 695.8..888 x 214.5..246.5, 1 line |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 1015.8..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..125 x 54..86; room 2223.2 to the floating control; clear | 16..48 x 54..86; room 2223.2 to the floating control; clear | 16..125 x 54..86; room 2223.2 to the floating control; clear; ending's button 1015.8..1208 x 394.5..426.5, 1 line |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 375.8..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..125 x 54..86; room 359.8 to the ending's button; clear | 16..48 x 54..86; room 359.8 to the ending's button; clear | 16..125 x 54..86; room 359.8 to the ending's button; clear; ending's button 375.8..568 x 74.5..106.5, 1 line |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 247.8..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..125 x 54..86; room 231.8 to the ending's button; clear | 16..48 x 54..86; room 231.8 to the ending's button; clear | 16..125 x 54..86; room 231.8 to the ending's button; clear; ending's button 247.8..440 x 58.5..90.5, 1 line |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 159.8..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..125 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear; ending's button 159.8..352 x 186.5..218.5, 1 line |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..117 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..117 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 235.8..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..125 x 54..86; room 219.8 to the ending's button; clear | 16..48 x 54..86; room 219.8 to the ending's button; clear | 16..125 x 54..86; room 219.8 to the ending's button; clear; ending's button 235.8..428 x 54..86, 1 line |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 275.3..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..125 x 54..86; room 259.3 to the ending's button; clear | 16..48 x 54..86; room 259.3 to the ending's button; clear | 16..48 x 54..86; room 259.3 to the ending's button; clear; ending's button 275.3..467.5 x 54..86, 1 line |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 276.8..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..125 x 45..69; room 260.8 to the ending's button; clear | 16..42 x 45..69; room 260.8 to the ending's button; clear | 16..125 x 45..69; room 260.8 to the ending's button; clear; ending's button 276.8..436 x 45..69, 1 line |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 308.3..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..125 x 45..69; room 292.3 to the ending's button; clear | 16..42 x 45..69; room 292.3 to the ending's button; clear | 16..42 x 45..69; room 292.3 to the ending's button; clear; ending's button 308.3..467.5 x 45..69, 1 line |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 95.8..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..125 x 54..86; room 79.8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 79.8 to the ending's button; clear | 16..48 x 54..86; room 79.8 to the ending's button; clear; ending's button 95.8..288 x 54..86, 1 line |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 95.3..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..125 x 54..86; room 79.3 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 79.3 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 128.8..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..125 x 45..69; room 112.8 to the ending's button; clear | 16..42 x 45..69; room 112.8 to the ending's button; clear | 16..42 x 45..69; room 112.8 to the ending's button; clear; ending's button 128.8..288 x 45..69, 1 line |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 128.3..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..125 x 45..69; room 112.3 to the ending's button; clear | 16..42 x 45..69; room 112.3 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 15.8..208 x 54..86, 1 line; bar 0..480 x 0..44 | 16..125 x 54..86; room -0.2 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -0.2 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 48.8..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..125 x 45..69; room 32.8 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 32.8 to the ending's button; clear | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 48.3..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..117 x 40..72; room 40.3 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 40.3 to the ending's button; clear | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..117 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..117 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: the full Node under a Trail of itself: both Answers, eight Options

`/full-public/full/full`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..168 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..168 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..168 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..168 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..168 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..168 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 46..94; bar 0..1024 x 0..44 | 16..168 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..168 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 152.5..200.5; bar 0..768 x 0..44 | 16..168 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 84.5..132.5; bar 0..390 x 0..36 | 8..160 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..160 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..168 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..168 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..160 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..182.3 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.3 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 46..94; bar 0..1024 x 0..44 | 16..182.3 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.3 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 152.5..200.5; bar 0..768 x 0..44 | 16..182.3 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 84.5..132.5; bar 0..390 x 0..36 | 8..174.3 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.3 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.3 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.3 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.3 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: its No, a step that ends

`/full-public/full/does-not-apply`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..168 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..168 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..168 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..168 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..168 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..168 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..168 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..168 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..168 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..160 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..160 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..168 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..168 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..160 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..182.3 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.3 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..182.3 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.3 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..182.3 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..174.3 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.3 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.3 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.3 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.3 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: the first Tree (Open Sans): "Does not apply", a step that ends

`/ai-act-applicability-agrifood/start/article-2-exclusions/ai-act-does-not-apply`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..168 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..168 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..168 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..168 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..168 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..168 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..168 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..168 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..168 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..160 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..160 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..168 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..168 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..160 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..182.3 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.3 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..182.3 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.3 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..182.3 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..174.3 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.3 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.3 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.3 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.3 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: the first Tree: annex-i-legislation, eight Options

`/ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..168 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..168 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..168 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..168 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..168 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..168 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 46..94; bar 0..1024 x 0..44 | 16..168 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..168 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 152.5..200.5; bar 0..768 x 0..44 | 16..168 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 84.5..132.5; bar 0..390 x 0..36 | 8..160 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..160 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..168 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..168 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..160 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..182.3 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.3 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 46..94; bar 0..1024 x 0..44 | 16..182.3 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.3 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 152.5..200.5; bar 0..768 x 0..44 | 16..182.3 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 84.5..132.5; bar 0..390 x 0..36 | 8..174.3 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.3 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.3 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.3 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.3 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: the example Tree: outside-scope, a step that ends

`/ai-act-example/start/outside-scope`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..168 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..168 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..168 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..168 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..168 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..168 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..168 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..168 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..168 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..168 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..168 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..160 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..160 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..168 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..168 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..168 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..168 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..168 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..168 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..168 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..160 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..160 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..182.3 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.3 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.3 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.3 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..182.3 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.3 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..182.3 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.3 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..182.3 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..174.3 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.3 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.3 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.3 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.3 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.3 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.3 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.3 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.3 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.3 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.3 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public bar's room, with the share button (dev) and without it

| page | lang | viewport | with | without |
|---|---|---|---|---|
| the first Tree (Open Sans) | en | 1280 x 640 | 824.7 | 901.7 |
| the first Tree (Open Sans) | en | 1366 x 768 | 910.7 | 987.7 |
| the first Tree (Open Sans) | en | 1920 x 1080 | 1464.7 | 1541.7 |
| the first Tree (Open Sans) | en | 2560 x 1440 | 2104.7 | 2181.7 |
| the first Tree (Open Sans) | en | 1280 x 800 | 824.7 | 901.7 |
| the first Tree (Open Sans) | en | 1024 x 768 | 568.7 | 645.7 |
| the first Tree (Open Sans) | en | 768 x 1024 | 312.7 | 389.7 |
| the first Tree (Open Sans) | en | 390 x 844 | 75.6 | 134.4 |
| the first Tree (Open Sans) | en | 360 x 640 | 52.2 | 111 |
| the first Tree (Open Sans) | nl | 1280 x 640 | 809.5 | 901.7 |
| the first Tree (Open Sans) | nl | 1366 x 768 | 895.5 | 987.7 |
| the first Tree (Open Sans) | nl | 1920 x 1080 | 1449.5 | 1541.7 |
| the first Tree (Open Sans) | nl | 2560 x 1440 | 2089.5 | 2181.7 |
| the first Tree (Open Sans) | nl | 1280 x 800 | 809.5 | 901.7 |
| the first Tree (Open Sans) | nl | 1024 x 768 | 553.5 | 645.7 |
| the first Tree (Open Sans) | nl | 768 x 1024 | 297.5 | 389.7 |
| the first Tree (Open Sans) | nl | 390 x 844 | 61.7 | 134.4 |
| the first Tree (Open Sans) | nl | 360 x 640 | 38.3 | 111 |
| the example Tree | en | 1280 x 640 | 832.5 | 907.6 |
| the example Tree | en | 1366 x 768 | 918.5 | 993.6 |
| the example Tree | en | 1920 x 1080 | 1472.5 | 1547.6 |
| the example Tree | en | 2560 x 1440 | 2112.5 | 2187.6 |
| the example Tree | en | 1280 x 800 | 832.5 | 907.6 |
| the example Tree | en | 1024 x 768 | 576.5 | 651.6 |
| the example Tree | en | 768 x 1024 | 320.5 | 395.6 |
| the example Tree | en | 390 x 844 | 82.9 | 140 |
| the example Tree | en | 360 x 640 | 59.5 | 116.6 |
| the example Tree | nl | 1280 x 640 | 819.4 | 907.6 |
| the example Tree | nl | 1366 x 768 | 905.4 | 993.6 |
| the example Tree | nl | 1920 x 1080 | 1459.4 | 1547.6 |
| the example Tree | nl | 2560 x 1440 | 2099.4 | 2187.6 |
| the example Tree | nl | 1280 x 800 | 819.4 | 907.6 |
| the example Tree | nl | 1024 x 768 | 563.4 | 651.6 |
| the example Tree | nl | 768 x 1024 | 307.4 | 395.6 |
| the example Tree | nl | 390 x 844 | 71 | 140 |
| the example Tree | nl | 360 x 640 | 47.6 | 116.6 |
| the full Node under a Trail of itself | en | 1280 x 640 | 830.5 | 905.7 |
| the full Node under a Trail of itself | en | 1366 x 768 | 916.5 | 991.7 |
| the full Node under a Trail of itself | en | 1920 x 1080 | 1470.5 | 1545.7 |
| the full Node under a Trail of itself | en | 2560 x 1440 | 2110.5 | 2185.7 |
| the full Node under a Trail of itself | en | 1280 x 800 | 830.5 | 905.7 |
| the full Node under a Trail of itself | en | 1024 x 768 | 574.5 | 649.7 |
| the full Node under a Trail of itself | en | 768 x 1024 | 318.5 | 393.7 |
| the full Node under a Trail of itself | en | 390 x 844 | 53.5 | 110.6 |
| the full Node under a Trail of itself | en | 360 x 640 | 23.5 | 80.6 |
| the full Node under a Trail of itself | nl | 1280 x 640 | 818 | 906.2 |
| the full Node under a Trail of itself | nl | 1366 x 768 | 904 | 992.2 |
| the full Node under a Trail of itself | nl | 1920 x 1080 | 1458 | 1546.2 |
| the full Node under a Trail of itself | nl | 2560 x 1440 | 2098 | 2186.2 |
| the full Node under a Trail of itself | nl | 1280 x 800 | 818 | 906.2 |
| the full Node under a Trail of itself | nl | 1024 x 768 | 562 | 650.2 |
| the full Node under a Trail of itself | nl | 768 x 1024 | 306 | 394.2 |
| the full Node under a Trail of itself | nl | 390 x 844 | 42 | 111.1 |
| the full Node under a Trail of itself | nl | 360 x 640 | 12 | 81.1 |

### The faces drawn

- /admin/trees/hidden-draft/n-yjvw7m/full/does-not-apply en: #measure-face: Segoe UI; .tree-frame .step-end > button: Segoe UI Semibold
- /admin/trees/hidden-draft/n-yjvw7m/full/does-not-apply nl: #measure-face: Segoe UI; .tree-frame .step-end > button: Segoe UI Semibold
- /admin/trees/agrifood-hidden/start/article-2-exclusions/ai-act-does-not-apply en: #measure-face: Segoe UI; .tree-frame .step-end > button: Open Sans SemiBold
- /admin/trees/agrifood-hidden/start/article-2-exclusions/ai-act-does-not-apply nl: #measure-face: Segoe UI; .tree-frame .step-end > button: Open Sans SemiBold
- /admin/trees/example-hidden/start/outside-scope en: #measure-face: Segoe UI; .tree-frame .step-end > button: Segoe UI Semibold
- /admin/trees/example-hidden/start/outside-scope nl: #measure-face: Segoe UI; .tree-frame .step-end > button: Segoe UI Semibold

## 4. The output in the CI runner's faces

The editor's floating controls: {"family":"-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Liberation Sans\", sans-serif","size":"13px","line":"20px","weight":"400","padding":"0px 14px 0px 10px","height":"32px"}

### The editor of a hidden Tree: the full Node under a first step: both Answers, eight Options, the cross

`/admin/trees/hidden-draft/n-yjvw7m/full`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..112.3 x 54..86; room 560 to the cross; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..112.3 x 54..86; room 603 to the cross; clear | 16..48 x 54..86; room 603 to the cross; clear | 16..112.3 x 54..86; room 603 to the cross; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..112.3 x 54..86; room 1517.5 to the floating control; clear | 16..48 x 54..86; room 1517.5 to the floating control; clear | 16..112.3 x 54..86; room 1517.5 to the floating control; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..112.3 x 54..86; room 2157.5 to the floating control; clear | 16..48 x 54..86; room 2157.5 to the floating control; clear | 16..112.3 x 54..86; room 2157.5 to the floating control; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..112.3 x 54..86; room 560 to the cross; clear |
| en | 1024 x 768 | arrow 488..536 x 46..94; cross 448..480 x 54..86; bar 0..1024 x 0..44 | 16..112.3 x 54..86; room 432 to the cross; clear | 16..48 x 54..86; room 432 to the cross; clear | 16..112.3 x 54..86; room 432 to the cross; clear |
| en | 768 x 1024 | arrow 360..408 x 152.5..200.5; cross 416..448 x 160.5..192.5; bar 0..768 x 0..44 | 16..112.3 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear |
| en | 390 x 844 | arrow 171..219 x 84.5..132.5; cross 227..259 x 92.5..124.5; bar 0..390 x 0..36 | 8..104.3 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; bar 0..360 x 0..36 | 8..104.3 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; bar 0..1000 x 0..44 | 16..112.3 x 54..86; room 420 to the cross; clear | 16..48 x 54..86; room 420 to the cross; clear | 16..112.3 x 54..86; room 420 to the cross; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; bar 0..999 x 0..44 | 16..112.3 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; bar 0..1000 x 0..44 | 16..112.3 x 45..69; room 428 to the cross; clear | 16..42 x 45..69; room 428 to the cross; clear | 16..112.3 x 45..69; room 428 to the cross; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; bar 0..999 x 0..44 | 16..112.3 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; bar 0..640 x 0..44 | 16..112.3 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; bar 0..639 x 0..44 | 16..112.3 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; bar 0..640 x 0..44 | 16..112.3 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; bar 0..639 x 0..44 | 16..112.3 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; bar 0..480 x 0..44 | 16..112.3 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; bar 0..480 x 0..44 | 16..112.3 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; bar 0..479 x 0..36 | 8..104.3 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; bar 0..321 x 0..36 | 8..104.3 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; bar 0..321 x 0..36 | 8..104.3 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..124.6 x 54..86; room 560 to the cross; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..124.6 x 54..86; room 603 to the cross; clear | 16..48 x 54..86; room 603 to the cross; clear | 16..124.6 x 54..86; room 603 to the cross; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..124.6 x 54..86; room 1473.6 to the floating control; clear | 16..48 x 54..86; room 1473.6 to the floating control; clear | 16..124.6 x 54..86; room 1473.6 to the floating control; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..124.6 x 54..86; room 2113.6 to the floating control; clear | 16..48 x 54..86; room 2113.6 to the floating control; clear | 16..124.6 x 54..86; room 2113.6 to the floating control; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..124.6 x 54..86; room 560 to the cross; clear |
| nl | 1024 x 768 | arrow 488..536 x 46..94; cross 448..480 x 54..86; bar 0..1024 x 0..44 | 16..124.6 x 54..86; room 432 to the cross; clear | 16..48 x 54..86; room 432 to the cross; clear | 16..124.6 x 54..86; room 432 to the cross; clear |
| nl | 768 x 1024 | arrow 360..408 x 152.5..200.5; cross 416..448 x 160.5..192.5; bar 0..768 x 0..44 | 16..124.6 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear |
| nl | 390 x 844 | arrow 171..219 x 84.5..132.5; cross 227..259 x 92.5..124.5; bar 0..390 x 0..36 | 8..116.6 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; bar 0..360 x 0..36 | 8..116.6 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; bar 0..1000 x 0..44 | 16..124.6 x 54..86; room 420 to the cross; clear | 16..48 x 54..86; room 420 to the cross; clear | 16..124.6 x 54..86; room 420 to the cross; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; bar 0..999 x 0..44 | 16..124.6 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; bar 0..1000 x 0..44 | 16..124.6 x 45..69; room 428 to the cross; clear | 16..42 x 45..69; room 428 to the cross; clear | 16..124.6 x 45..69; room 428 to the cross; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; bar 0..999 x 0..44 | 16..124.6 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; bar 0..640 x 0..44 | 16..124.6 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; bar 0..639 x 0..44 | 16..124.6 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; bar 0..640 x 0..44 | 16..124.6 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; bar 0..639 x 0..44 | 16..124.6 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; bar 0..480 x 0..44 | 16..124.6 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; bar 0..480 x 0..44 | 16..124.6 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; bar 0..479 x 0..36 | 8..116.6 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; bar 0..321 x 0..36 | 8..116.6 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; bar 0..321 x 0..36 | 8..116.6 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The editor of a hidden Tree: its No, a step that ends: the cross and "Tree does not end here after all"

`/admin/trees/hidden-draft/n-yjvw7m/full/does-not-apply`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 345.8..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 329.8 to the ending's button; clear | 16..48 x 54..86; room 329.8 to the ending's button; clear | 16..112.3 x 54..86; room 329.8 to the ending's button; clear; ending's button 345.8..568 x 54..86, 1 line |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 388.8..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..112.3 x 54..86; room 372.8 to the ending's button; clear | 16..48 x 54..86; room 372.8 to the ending's button; clear | 16..112.3 x 54..86; room 372.8 to the ending's button; clear; ending's button 388.8..611 x 58.5..90.5, 1 line |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 665.8..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..112.3 x 54..86; room 1517.5 to the floating control; clear | 16..48 x 54..86; room 1517.5 to the floating control; clear | 16..112.3 x 54..86; room 1517.5 to the floating control; clear; ending's button 665.8..888 x 214.5..246.5, 1 line |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 985.8..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..112.3 x 54..86; room 2157.5 to the floating control; clear | 16..48 x 54..86; room 2157.5 to the floating control; clear | 16..112.3 x 54..86; room 2157.5 to the floating control; clear; ending's button 985.8..1208 x 394.5..426.5, 1 line |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 345.8..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 329.8 to the ending's button; clear | 16..48 x 54..86; room 329.8 to the ending's button; clear | 16..112.3 x 54..86; room 329.8 to the ending's button; clear; ending's button 345.8..568 x 74.5..106.5, 1 line |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 217.8..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..112.3 x 54..86; room 201.8 to the ending's button; clear | 16..48 x 54..86; room 201.8 to the ending's button; clear | 16..112.3 x 54..86; room 201.8 to the ending's button; clear; ending's button 217.8..440 x 58.5..90.5, 1 line |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 129.8..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..112.3 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear; ending's button 129.8..352 x 186.5..218.5, 1 line |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..104.3 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..104.3 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 205.8..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..112.3 x 54..86; room 189.8 to the ending's button; clear | 16..48 x 54..86; room 189.8 to the ending's button; clear | 16..112.3 x 54..86; room 189.8 to the ending's button; clear; ending's button 205.8..428 x 54..86, 1 line |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 245.3..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..112.3 x 54..86; room 229.3 to the ending's button; clear | 16..48 x 54..86; room 229.3 to the ending's button; clear | 16..48 x 54..86; room 229.3 to the ending's button; clear; ending's button 245.3..467.5 x 54..86, 1 line |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 251.4..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..112.3 x 45..69; room 235.4 to the ending's button; clear | 16..42 x 45..69; room 235.4 to the ending's button; clear | 16..112.3 x 45..69; room 235.4 to the ending's button; clear; ending's button 251.4..436 x 45..69, 1 line |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 282.9..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..112.3 x 45..69; room 266.9 to the ending's button; clear | 16..42 x 45..69; room 266.9 to the ending's button; clear | 16..42 x 45..69; room 266.9 to the ending's button; clear; ending's button 282.9..467.5 x 45..69, 1 line |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 65.8..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..112.3 x 54..86; room 49.8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 49.8 to the ending's button; clear | 16..48 x 54..86; room 49.8 to the ending's button; clear; ending's button 65.8..288 x 54..86, 1 line |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 65.3..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..112.3 x 54..86; room 49.3 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 49.3 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 103.4..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..112.3 x 45..69; room 87.4 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 87.4 to the ending's button; clear | 16..42 x 45..69; room 87.4 to the ending's button; clear; ending's button 103.4..288 x 45..69, 1 line |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 102.9..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..112.3 x 45..69; room 86.9 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 86.9 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 8..208 x 46..94, 2 lines; bar 0..480 x 0..44 | 16..112.3 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 23.4..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..112.3 x 45..69; room 7.4 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 7.4 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 22.9..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..104.3 x 40..72; room 14.9 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 14.9 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..104.3 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..104.3 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 369.7..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 353.7 to the ending's button; clear | 16..48 x 54..86; room 353.7 to the ending's button; clear | 16..124.6 x 54..86; room 353.7 to the ending's button; clear; ending's button 369.7..568 x 54..86, 1 line |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 412.7..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..124.6 x 54..86; room 396.7 to the ending's button; clear | 16..48 x 54..86; room 396.7 to the ending's button; clear | 16..124.6 x 54..86; room 396.7 to the ending's button; clear; ending's button 412.7..611 x 58.5..90.5, 1 line |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 689.7..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..124.6 x 54..86; room 1473.6 to the floating control; clear | 16..48 x 54..86; room 1473.6 to the floating control; clear | 16..124.6 x 54..86; room 1473.6 to the floating control; clear; ending's button 689.7..888 x 214.5..246.5, 1 line |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 1009.7..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..124.6 x 54..86; room 2113.6 to the floating control; clear | 16..48 x 54..86; room 2113.6 to the floating control; clear | 16..124.6 x 54..86; room 2113.6 to the floating control; clear; ending's button 1009.7..1208 x 394.5..426.5, 1 line |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 369.7..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 353.7 to the ending's button; clear | 16..48 x 54..86; room 353.7 to the ending's button; clear | 16..124.6 x 54..86; room 353.7 to the ending's button; clear; ending's button 369.7..568 x 74.5..106.5, 1 line |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 241.7..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..124.6 x 54..86; room 225.7 to the ending's button; clear | 16..48 x 54..86; room 225.7 to the ending's button; clear | 16..124.6 x 54..86; room 225.7 to the ending's button; clear; ending's button 241.7..440 x 58.5..90.5, 1 line |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 153.7..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..124.6 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear | 16..48 x 54..86; room 662 to the floating control; clear; ending's button 153.7..352 x 186.5..218.5, 1 line |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..116.6 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear | 8..40 x 46..78; room 300 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..116.6 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 229.7..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..124.6 x 54..86; room 213.7 to the ending's button; clear | 16..48 x 54..86; room 213.7 to the ending's button; clear | 16..124.6 x 54..86; room 213.7 to the ending's button; clear; ending's button 229.7..428 x 54..86, 1 line |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 269.2..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..124.6 x 54..86; room 253.2 to the ending's button; clear | 16..48 x 54..86; room 253.2 to the ending's button; clear | 16..48 x 54..86; room 253.2 to the ending's button; clear; ending's button 269.2..467.5 x 54..86, 1 line |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 271.6..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..124.6 x 45..69; room 255.6 to the ending's button; clear | 16..42 x 45..69; room 255.6 to the ending's button; clear | 16..124.6 x 45..69; room 255.6 to the ending's button; clear; ending's button 271.6..436 x 45..69, 1 line |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 303.1..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..124.6 x 45..69; room 287.1 to the ending's button; clear | 16..42 x 45..69; room 287.1 to the ending's button; clear | 16..42 x 45..69; room 287.1 to the ending's button; clear; ending's button 303.1..467.5 x 45..69, 1 line |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 89.7..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..124.6 x 54..86; room 73.7 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 73.7 to the ending's button; clear | 16..48 x 54..86; room 73.7 to the ending's button; clear; ending's button 89.7..288 x 54..86, 1 line |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 89.2..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..124.6 x 54..86; room 73.2 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 73.2 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 123.6..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..124.6 x 45..69; room 107.6 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 107.6 to the ending's button; clear | 16..42 x 45..69; room 107.6 to the ending's button; clear; ending's button 123.6..288 x 45..69, 1 line |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 123.1..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..124.6 x 45..69; room 107.1 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 107.1 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 9.7..208 x 54..86, 1 line; bar 0..480 x 0..44 | 16..124.6 x 54..86; room -6.3 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -6.3 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 43.6..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..124.6 x 45..69; room 27.6 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 27.6 to the ending's button; clear | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 43.1..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..116.6 x 40..72; room 35.1 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 35.1 to the ending's button; clear | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..116.6 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..116.6 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The editor of a hidden Tree: the first Tree (Open Sans): "Does not apply", a step that ends

`/admin/trees/agrifood-hidden/start/article-2-exclusions/ai-act-does-not-apply`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 345..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 329 to the ending's button; clear | 16..48 x 54..86; room 329 to the ending's button; clear | 16..112.3 x 54..86; room 329 to the ending's button; clear; ending's button 345..568 x 54..86, 1 line |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 388..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..112.3 x 54..86; room 372 to the ending's button; clear | 16..48 x 54..86; room 372 to the ending's button; clear | 16..112.3 x 54..86; room 372 to the ending's button; clear; ending's button 388..611 x 58.5..90.5, 1 line |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 665..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..112.3 x 54..86; room 1604.7 to the floating control; clear | 16..48 x 54..86; room 1604.7 to the floating control; clear | 16..112.3 x 54..86; room 1604.7 to the floating control; clear; ending's button 665..888 x 214.5..246.5, 1 line |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 985..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..112.3 x 54..86; room 2244.7 to the floating control; clear | 16..48 x 54..86; room 2244.7 to the floating control; clear | 16..112.3 x 54..86; room 2244.7 to the floating control; clear; ending's button 985..1208 x 394.5..426.5, 1 line |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 345..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 329 to the ending's button; clear | 16..48 x 54..86; room 329 to the ending's button; clear | 16..112.3 x 54..86; room 329 to the ending's button; clear; ending's button 345..568 x 74.5..106.5, 1 line |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 217..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..112.3 x 54..86; room 201 to the ending's button; clear | 16..48 x 54..86; room 201 to the ending's button; clear | 16..112.3 x 54..86; room 201 to the ending's button; clear; ending's button 217..440 x 58.5..90.5, 1 line |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 129..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..112.3 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear; ending's button 129..352 x 186.5..218.5, 1 line |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..104.3 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..104.3 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 205..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..112.3 x 54..86; room 189 to the ending's button; clear | 16..48 x 54..86; room 189 to the ending's button; clear | 16..112.3 x 54..86; room 189 to the ending's button; clear; ending's button 205..428 x 54..86, 1 line |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 244.5..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..112.3 x 54..86; room 228.5 to the ending's button; clear | 16..48 x 54..86; room 228.5 to the ending's button; clear | 16..48 x 54..86; room 228.5 to the ending's button; clear; ending's button 244.5..467.5 x 54..86, 1 line |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 249..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..112.3 x 45..69; room 233 to the ending's button; clear | 16..42 x 45..69; room 233 to the ending's button; clear | 16..112.3 x 45..69; room 233 to the ending's button; clear; ending's button 249..436 x 45..69, 1 line |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 280.5..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..112.3 x 45..69; room 264.5 to the ending's button; clear | 16..42 x 45..69; room 264.5 to the ending's button; clear | 16..42 x 45..69; room 264.5 to the ending's button; clear; ending's button 280.5..467.5 x 45..69, 1 line |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 65..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..112.3 x 54..86; room 49 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 49 to the ending's button; clear | 16..48 x 54..86; room 49 to the ending's button; clear; ending's button 65..288 x 54..86, 1 line |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 64.5..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..112.3 x 54..86; room 48.5 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 48.5 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 101..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..112.3 x 45..69; room 85 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 85 to the ending's button; clear | 16..42 x 45..69; room 85 to the ending's button; clear; ending's button 101..288 x 45..69, 1 line |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 100.5..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..112.3 x 45..69; room 84.5 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 84.5 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 8..208 x 46..94, 2 lines; bar 0..480 x 0..44 | 16..112.3 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 21..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..112.3 x 45..69; room 5 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 5 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 20.5..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..104.3 x 40..72; room 12.5 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 12.5 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..104.3 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..104.3 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 370..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 354 to the ending's button; clear | 16..48 x 54..86; room 354 to the ending's button; clear | 16..124.6 x 54..86; room 354 to the ending's button; clear; ending's button 370..568 x 54..86, 1 line |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 413..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..124.6 x 54..86; room 397 to the ending's button; clear | 16..48 x 54..86; room 397 to the ending's button; clear | 16..124.6 x 54..86; room 397 to the ending's button; clear; ending's button 413..611 x 58.5..90.5, 1 line |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 690..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..124.6 x 54..86; room 1580.3 to the floating control; clear | 16..48 x 54..86; room 1580.3 to the floating control; clear | 16..124.6 x 54..86; room 1580.3 to the floating control; clear; ending's button 690..888 x 214.5..246.5, 1 line |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 1010..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..124.6 x 54..86; room 2220.3 to the floating control; clear | 16..48 x 54..86; room 2220.3 to the floating control; clear | 16..124.6 x 54..86; room 2220.3 to the floating control; clear; ending's button 1010..1208 x 394.5..426.5, 1 line |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 370..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 354 to the ending's button; clear | 16..48 x 54..86; room 354 to the ending's button; clear | 16..124.6 x 54..86; room 354 to the ending's button; clear; ending's button 370..568 x 74.5..106.5, 1 line |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 242..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..124.6 x 54..86; room 226 to the ending's button; clear | 16..48 x 54..86; room 226 to the ending's button; clear | 16..124.6 x 54..86; room 226 to the ending's button; clear; ending's button 242..440 x 58.5..90.5, 1 line |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 154..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..124.6 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear; ending's button 154..352 x 186.5..218.5, 1 line |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..116.6 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..116.6 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 230..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..124.6 x 54..86; room 214 to the ending's button; clear | 16..48 x 54..86; room 214 to the ending's button; clear | 16..124.6 x 54..86; room 214 to the ending's button; clear; ending's button 230..428 x 54..86, 1 line |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 269.5..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..124.6 x 54..86; room 253.5 to the ending's button; clear | 16..48 x 54..86; room 253.5 to the ending's button; clear | 16..48 x 54..86; room 253.5 to the ending's button; clear; ending's button 269.5..467.5 x 54..86, 1 line |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 270..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..124.6 x 45..69; room 254 to the ending's button; clear | 16..42 x 45..69; room 254 to the ending's button; clear | 16..124.6 x 45..69; room 254 to the ending's button; clear; ending's button 270..436 x 45..69, 1 line |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 301.5..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..124.6 x 45..69; room 285.5 to the ending's button; clear | 16..42 x 45..69; room 285.5 to the ending's button; clear | 16..42 x 45..69; room 285.5 to the ending's button; clear; ending's button 301.5..467.5 x 45..69, 1 line |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 90..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..124.6 x 54..86; room 74 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 74 to the ending's button; clear | 16..48 x 54..86; room 74 to the ending's button; clear; ending's button 90..288 x 54..86, 1 line |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 89.5..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..124.6 x 54..86; room 73.5 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 73.5 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 122..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..124.6 x 45..69; room 106 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 106 to the ending's button; clear | 16..42 x 45..69; room 106 to the ending's button; clear; ending's button 122..288 x 45..69, 1 line |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 121.5..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..124.6 x 45..69; room 105.5 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 105.5 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 10..208 x 54..86, 1 line; bar 0..480 x 0..44 | 16..124.6 x 54..86; room -6 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -6 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 42..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..124.6 x 45..69; room 26 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 26 to the ending's button; clear | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 41.5..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..116.6 x 40..72; room 33.5 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 33.5 to the ending's button; clear | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..116.6 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..116.6 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The editor of a hidden Tree: the first Tree: annex-i-legislation, eight Options

`/admin/trees/agrifood-hidden/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..112.3 x 54..86; room 560 to the cross; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..112.3 x 54..86; room 603 to the cross; clear | 16..48 x 54..86; room 603 to the cross; clear | 16..112.3 x 54..86; room 603 to the cross; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..112.3 x 54..86; room 1604.7 to the floating control; clear | 16..48 x 54..86; room 1604.7 to the floating control; clear | 16..112.3 x 54..86; room 1604.7 to the floating control; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..112.3 x 54..86; room 2244.7 to the floating control; clear | 16..48 x 54..86; room 2244.7 to the floating control; clear | 16..112.3 x 54..86; room 2244.7 to the floating control; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..112.3 x 54..86; room 560 to the cross; clear |
| en | 1024 x 768 | arrow 488..536 x 46..94; cross 448..480 x 54..86; bar 0..1024 x 0..44 | 16..112.3 x 54..86; room 432 to the cross; clear | 16..48 x 54..86; room 432 to the cross; clear | 16..112.3 x 54..86; room 432 to the cross; clear |
| en | 768 x 1024 | arrow 360..408 x 152.5..200.5; cross 416..448 x 160.5..192.5; bar 0..768 x 0..44 | 16..112.3 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear |
| en | 390 x 844 | arrow 171..219 x 84.5..132.5; cross 227..259 x 92.5..124.5; bar 0..390 x 0..36 | 8..104.3 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; bar 0..360 x 0..36 | 8..104.3 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; bar 0..1000 x 0..44 | 16..112.3 x 54..86; room 420 to the cross; clear | 16..48 x 54..86; room 420 to the cross; clear | 16..112.3 x 54..86; room 420 to the cross; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; bar 0..999 x 0..44 | 16..112.3 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; bar 0..1000 x 0..44 | 16..112.3 x 45..69; room 428 to the cross; clear | 16..42 x 45..69; room 428 to the cross; clear | 16..112.3 x 45..69; room 428 to the cross; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; bar 0..999 x 0..44 | 16..112.3 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; bar 0..640 x 0..44 | 16..112.3 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; bar 0..639 x 0..44 | 16..112.3 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; bar 0..640 x 0..44 | 16..112.3 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; bar 0..639 x 0..44 | 16..112.3 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; bar 0..480 x 0..44 | 16..112.3 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; bar 0..480 x 0..44 | 16..112.3 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; bar 0..479 x 0..36 | 8..104.3 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; bar 0..321 x 0..36 | 8..104.3 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; bar 0..321 x 0..36 | 8..104.3 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..124.6 x 54..86; room 560 to the cross; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..124.6 x 54..86; room 603 to the cross; clear | 16..48 x 54..86; room 603 to the cross; clear | 16..124.6 x 54..86; room 603 to the cross; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..124.6 x 54..86; room 1580.3 to the floating control; clear | 16..48 x 54..86; room 1580.3 to the floating control; clear | 16..124.6 x 54..86; room 1580.3 to the floating control; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..124.6 x 54..86; room 2220.3 to the floating control; clear | 16..48 x 54..86; room 2220.3 to the floating control; clear | 16..124.6 x 54..86; room 2220.3 to the floating control; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 560 to the cross; clear | 16..48 x 54..86; room 560 to the cross; clear | 16..124.6 x 54..86; room 560 to the cross; clear |
| nl | 1024 x 768 | arrow 488..536 x 46..94; cross 448..480 x 54..86; bar 0..1024 x 0..44 | 16..124.6 x 54..86; room 432 to the cross; clear | 16..48 x 54..86; room 432 to the cross; clear | 16..124.6 x 54..86; room 432 to the cross; clear |
| nl | 768 x 1024 | arrow 360..408 x 152.5..200.5; cross 416..448 x 160.5..192.5; bar 0..768 x 0..44 | 16..124.6 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear |
| nl | 390 x 844 | arrow 171..219 x 84.5..132.5; cross 227..259 x 92.5..124.5; bar 0..390 x 0..36 | 8..116.6 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; bar 0..360 x 0..36 | 8..116.6 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; bar 0..1000 x 0..44 | 16..124.6 x 54..86; room 420 to the cross; clear | 16..48 x 54..86; room 420 to the cross; clear | 16..124.6 x 54..86; room 420 to the cross; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; bar 0..999 x 0..44 | 16..124.6 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; bar 0..1000 x 0..44 | 16..124.6 x 45..69; room 428 to the cross; clear | 16..42 x 45..69; room 428 to the cross; clear | 16..124.6 x 45..69; room 428 to the cross; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; bar 0..999 x 0..44 | 16..124.6 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; bar 0..640 x 0..44 | 16..124.6 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; bar 0..639 x 0..44 | 16..124.6 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; bar 0..640 x 0..44 | 16..124.6 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; bar 0..639 x 0..44 | 16..124.6 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; bar 0..480 x 0..44 | 16..124.6 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; bar 0..480 x 0..44 | 16..124.6 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; bar 0..479 x 0..36 | 8..116.6 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; bar 0..321 x 0..36 | 8..116.6 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; bar 0..321 x 0..36 | 8..116.6 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The editor of a hidden Tree: the example Tree: outside-scope, a step that ends

`/admin/trees/example-hidden/start/outside-scope`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 345.8..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 329.8 to the ending's button; clear | 16..48 x 54..86; room 329.8 to the ending's button; clear | 16..112.3 x 54..86; room 329.8 to the ending's button; clear; ending's button 345.8..568 x 54..86, 1 line |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 388.8..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..112.3 x 54..86; room 372.8 to the ending's button; clear | 16..48 x 54..86; room 372.8 to the ending's button; clear | 16..112.3 x 54..86; room 372.8 to the ending's button; clear; ending's button 388.8..611 x 58.5..90.5, 1 line |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 665.8..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..112.3 x 54..86; room 1604.7 to the floating control; clear | 16..48 x 54..86; room 1604.7 to the floating control; clear | 16..112.3 x 54..86; room 1604.7 to the floating control; clear; ending's button 665.8..888 x 214.5..246.5, 1 line |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 985.8..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..112.3 x 54..86; room 2244.7 to the floating control; clear | 16..48 x 54..86; room 2244.7 to the floating control; clear | 16..112.3 x 54..86; room 2244.7 to the floating control; clear; ending's button 985.8..1208 x 394.5..426.5, 1 line |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 345.8..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..112.3 x 54..86; room 329.8 to the ending's button; clear | 16..48 x 54..86; room 329.8 to the ending's button; clear | 16..112.3 x 54..86; room 329.8 to the ending's button; clear; ending's button 345.8..568 x 74.5..106.5, 1 line |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 217.8..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..112.3 x 54..86; room 201.8 to the ending's button; clear | 16..48 x 54..86; room 201.8 to the ending's button; clear | 16..112.3 x 54..86; room 201.8 to the ending's button; clear; ending's button 217.8..440 x 58.5..90.5, 1 line |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 129.8..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..112.3 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear; ending's button 129.8..352 x 186.5..218.5, 1 line |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..104.3 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| en | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..104.3 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| en | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 205.8..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..112.3 x 54..86; room 189.8 to the ending's button; clear | 16..48 x 54..86; room 189.8 to the ending's button; clear | 16..112.3 x 54..86; room 189.8 to the ending's button; clear; ending's button 205.8..428 x 54..86, 1 line |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 245.3..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..112.3 x 54..86; room 229.3 to the ending's button; clear | 16..48 x 54..86; room 229.3 to the ending's button; clear | 16..48 x 54..86; room 229.3 to the ending's button; clear; ending's button 245.3..467.5 x 54..86, 1 line |
| en | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 251.4..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..112.3 x 45..69; room 235.4 to the ending's button; clear | 16..42 x 45..69; room 235.4 to the ending's button; clear | 16..112.3 x 45..69; room 235.4 to the ending's button; clear; ending's button 251.4..436 x 45..69, 1 line |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 282.9..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..112.3 x 45..69; room 266.9 to the ending's button; clear | 16..42 x 45..69; room 266.9 to the ending's button; clear | 16..42 x 45..69; room 266.9 to the ending's button; clear; ending's button 282.9..467.5 x 45..69, 1 line |
| en | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 65.8..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..112.3 x 54..86; room 49.8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 49.8 to the ending's button; clear | 16..48 x 54..86; room 49.8 to the ending's button; clear; ending's button 65.8..288 x 54..86, 1 line |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 65.3..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..112.3 x 54..86; room 49.3 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 49.3 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| en | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 103.4..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..112.3 x 45..69; room 87.4 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 87.4 to the ending's button; clear | 16..42 x 45..69; room 87.4 to the ending's button; clear; ending's button 103.4..288 x 45..69, 1 line |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 102.9..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..112.3 x 45..69; room 86.9 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 86.9 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| en | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 8..208 x 46..94, 2 lines; bar 0..480 x 0..44 | 16..112.3 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -8 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| en | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 23.4..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..112.3 x 45..69; room 7.4 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 7.4 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 22.9..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..104.3 x 40..72; room 14.9 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 14.9 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..104.3 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..104.3 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; cross 576..608 x 54..86; ending's button 369.7..568 x 54..86, 1 line; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 353.7 to the ending's button; clear | 16..48 x 54..86; room 353.7 to the ending's button; clear | 16..124.6 x 54..86; room 353.7 to the ending's button; clear; ending's button 369.7..568 x 54..86, 1 line |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; cross 619..651 x 58.5..90.5; ending's button 412.7..611 x 58.5..90.5, 1 line; bar 0..1366 x 0..44 | 16..124.6 x 54..86; room 396.7 to the ending's button; clear | 16..48 x 54..86; room 396.7 to the ending's button; clear | 16..124.6 x 54..86; room 396.7 to the ending's button; clear; ending's button 412.7..611 x 58.5..90.5, 1 line |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; cross 896..928 x 214.5..246.5; ending's button 689.7..888 x 214.5..246.5, 1 line; bar 0..1920 x 0..44 | 16..124.6 x 54..86; room 1580.3 to the floating control; clear | 16..48 x 54..86; room 1580.3 to the floating control; clear | 16..124.6 x 54..86; room 1580.3 to the floating control; clear; ending's button 689.7..888 x 214.5..246.5, 1 line |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; cross 1216..1248 x 394.5..426.5; ending's button 1009.7..1208 x 394.5..426.5, 1 line; bar 0..2560 x 0..44 | 16..124.6 x 54..86; room 2220.3 to the floating control; clear | 16..48 x 54..86; room 2220.3 to the floating control; clear | 16..124.6 x 54..86; room 2220.3 to the floating control; clear; ending's button 1009.7..1208 x 394.5..426.5, 1 line |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; cross 576..608 x 74.5..106.5; ending's button 369.7..568 x 74.5..106.5, 1 line; bar 0..1280 x 0..44 | 16..124.6 x 54..86; room 353.7 to the ending's button; clear | 16..48 x 54..86; room 353.7 to the ending's button; clear | 16..124.6 x 54..86; room 353.7 to the ending's button; clear; ending's button 369.7..568 x 74.5..106.5, 1 line |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; cross 448..480 x 58.5..90.5; ending's button 241.7..440 x 58.5..90.5, 1 line; bar 0..1024 x 0..44 | 16..124.6 x 54..86; room 225.7 to the ending's button; clear | 16..48 x 54..86; room 225.7 to the ending's button; clear | 16..124.6 x 54..86; room 225.7 to the ending's button; clear; ending's button 241.7..440 x 58.5..90.5, 1 line |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; cross 416..448 x 186.5..218.5; ending's button 153.7..352 x 186.5..218.5, 1 line; bar 0..768 x 0..44 | 16..124.6 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear | 16..48 x 54..86; room 664 to the floating control; clear; ending's button 153.7..352 x 186.5..218.5, 1 line |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; cross 227..259 x 104.5..136.5; ending's button 8..163 x 103.5..137.5, 2 lines; bar 0..390 x 0..36 | 8..116.6 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear | 8..40 x 46..78; room 302 to the floating control; clear; ending's button 131..163 x 104.5..136.5, 1 line |
| nl | 360 x 640 | arrow 156..204 x 38..86; cross 212..244 x 46..78; ending's button 8..148 x 45..79, 2 lines; bar 0..360 x 0..36 | 8..116.6 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 108 to the ending's button; clear; ending's button 116..148 x 46..78, 1 line |
| nl | 1000 x 700 | arrow 476..524 x 46..94; cross 436..468 x 54..86; ending's button 229.7..428 x 54..86, 1 line; bar 0..1000 x 0..44 | 16..124.6 x 54..86; room 213.7 to the ending's button; clear | 16..48 x 54..86; room 213.7 to the ending's button; clear | 16..124.6 x 54..86; room 213.7 to the ending's button; clear; ending's button 229.7..428 x 54..86, 1 line |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; cross 531.5..563.5 x 54..86; ending's button 269.2..467.5 x 54..86, 1 line; bar 0..999 x 0..44 | 16..124.6 x 54..86; room 253.2 to the ending's button; clear | 16..48 x 54..86; room 253.2 to the ending's button; clear | 16..48 x 54..86; room 253.2 to the ending's button; clear; ending's button 269.2..467.5 x 54..86, 1 line |
| nl | 1000 x 639 | arrow 476..524 x 46..94; cross 444..468 x 45..69; ending's button 271.6..436 x 45..69, 1 line; bar 0..1000 x 0..44 | 16..124.6 x 45..69; room 255.6 to the ending's button; clear | 16..42 x 45..69; room 255.6 to the ending's button; clear | 16..124.6 x 45..69; room 255.6 to the ending's button; clear; ending's button 271.6..436 x 45..69, 1 line |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; cross 531.5..555.5 x 45..69; ending's button 303.1..467.5 x 45..69, 1 line; bar 0..999 x 0..44 | 16..124.6 x 45..69; room 287.1 to the ending's button; clear | 16..42 x 45..69; room 287.1 to the ending's button; clear | 16..42 x 45..69; room 287.1 to the ending's button; clear; ending's button 303.1..467.5 x 45..69, 1 line |
| nl | 640 x 700 | arrow 296..344 x 46..94; cross 352..384 x 54..86; ending's button 89.7..288 x 54..86, 1 line; bar 0..640 x 0..44 | 16..124.6 x 54..86; room 73.7 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 73.7 to the ending's button; clear | 16..48 x 54..86; room 73.7 to the ending's button; clear; ending's button 89.7..288 x 54..86, 1 line |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; cross 351.5..383.5 x 54..86; ending's button 89.2..287.5 x 54..86, 1 line; bar 0..639 x 0..44 | 16..124.6 x 54..86; room 73.2 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 73.2 to the ending's button; clear | 16..48 x 54..86; room 239.5 to the ending's button; clear; ending's button 255.5..287.5 x 54..86, 1 line |
| nl | 640 x 639 | arrow 296..344 x 46..94; cross 352..376 x 45..69; ending's button 123.6..288 x 45..69, 1 line; bar 0..640 x 0..44 | 16..124.6 x 45..69; room 107.6 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 107.6 to the ending's button; clear | 16..42 x 45..69; room 107.6 to the ending's button; clear; ending's button 123.6..288 x 45..69, 1 line |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; cross 351.5..375.5 x 45..69; ending's button 123.1..287.5 x 45..69, 1 line; bar 0..639 x 0..44 | 16..124.6 x 45..69; room 107.1 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 107.1 to the ending's button; clear | 16..42 x 45..69; room 247.5 to the ending's button; clear; ending's button 263.5..287.5 x 45..69, 1 line |
| nl | 480 x 640 | arrow 216..264 x 46..94; cross 272..304 x 54..86; ending's button 9.7..208 x 54..86, 1 line; bar 0..480 x 0..44 | 16..124.6 x 54..86; room -6.3 to the ending's button; MEETS ending's button | 16..48 x 54..86; room -6.3 to the ending's button; MEETS ending's button | 16..48 x 54..86; room 160 to the ending's button; clear; ending's button 176..208 x 54..86, 1 line |
| nl | 480 x 639 | arrow 216..264 x 46..94; cross 272..296 x 45..69; ending's button 43.6..208 x 45..69, 1 line; bar 0..480 x 0..44 | 16..124.6 x 45..69; room 27.6 to the ending's button; MEETS ending's button | 16..42 x 45..69; room 27.6 to the ending's button; clear | 16..42 x 45..69; room 168 to the ending's button; clear; ending's button 184..208 x 45..69, 1 line |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; cross 271.5..303.5 x 40..72; ending's button 43.1..207.5 x 40..72, 1 line; bar 0..479 x 0..36 | 8..116.6 x 40..72; room 35.1 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 35.1 to the ending's button; clear | 8..40 x 40..72; room 167.5 to the ending's button; clear; ending's button 175.5..207.5 x 40..72, 1 line |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 40..72; ending's button 8..128.5 x 39..73, 2 lines; bar 0..321 x 0..36 | 8..116.6 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 0 to the ending's button; MEETS ending's button | 8..40 x 40..72; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 40..72, 1 line |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; cross 192.5..224.5 x 46..78; ending's button 8..128.5 x 45..79, 2 lines; bar 0..321 x 0..36 | 8..116.6 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 0 to the ending's button; MEETS ending's button | 8..40 x 46..78; room 88.5 to the ending's button; clear; ending's button 96.5..128.5 x 46..78, 1 line |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: the full Node under a Trail of itself: both Answers, eight Options

`/full-public/full/full`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..167.2 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..167.2 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 46..94; bar 0..1024 x 0..44 | 16..167.2 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..167.2 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 152.5..200.5; bar 0..768 x 0..44 | 16..167.2 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 84.5..132.5; bar 0..390 x 0..36 | 8..159.2 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..159.2 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..167.2 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..167.2 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..159.2 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..182.4 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.4 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 46..94; bar 0..1024 x 0..44 | 16..182.4 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.4 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 152.5..200.5; bar 0..768 x 0..44 | 16..182.4 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 84.5..132.5; bar 0..390 x 0..36 | 8..174.4 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.4 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.4 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.4 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.4 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: its No, a step that ends

`/full-public/full/does-not-apply`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..167.2 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..167.2 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..167.2 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..167.2 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..167.2 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..159.2 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..159.2 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..167.2 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..167.2 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..159.2 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..182.4 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.4 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..182.4 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.4 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..182.4 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..174.4 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.4 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.4 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.4 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.4 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: the first Tree (Open Sans): "Does not apply", a step that ends

`/ai-act-applicability-agrifood/start/article-2-exclusions/ai-act-does-not-apply`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..167.2 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..167.2 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..167.2 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..167.2 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..167.2 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..159.2 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..159.2 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..167.2 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..167.2 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..159.2 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..182.4 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.4 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..182.4 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.4 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..182.4 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..174.4 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.4 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.4 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.4 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.4 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: the first Tree: annex-i-legislation, eight Options

`/ai-act-applicability-agrifood/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..167.2 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..167.2 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 46..94; bar 0..1024 x 0..44 | 16..167.2 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..167.2 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 152.5..200.5; bar 0..768 x 0..44 | 16..167.2 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 84.5..132.5; bar 0..390 x 0..36 | 8..159.2 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..159.2 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..167.2 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..167.2 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..159.2 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; highest Option button's top 100.1; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; highest Option button's top 119.5; bar 0..1366 x 0..44 | 16..182.4 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.4 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; highest Option button's top 275.5; bar 0..1920 x 0..44 | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; highest Option button's top 455.5; bar 0..2560 x 0..44 | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; highest Option button's top 135.5; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 46..94; bar 0..1024 x 0..44 | 16..182.4 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.4 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 152.5..200.5; bar 0..768 x 0..44 | 16..182.4 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 84.5..132.5; bar 0..390 x 0..36 | 8..174.4 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.4 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.4 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.4 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.4 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public page: the example Tree: outside-scope, a step that ends

`/ai-act-example/start/outside-scope`

| lang | viewport | the band | in words | as an icon | the rule |
|---|---|---|---|---|---|
| en | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..167.2 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..167.2 x 54..86; room 643 to the up arrow; clear |
| en | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..167.2 x 54..86; room 1904 to the the window's right edge; clear |
| en | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..167.2 x 54..86; room 2544 to the the window's right edge; clear |
| en | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..167.2 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..167.2 x 54..86; room 600 to the up arrow; clear |
| en | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..167.2 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..167.2 x 54..86; room 472 to the up arrow; clear |
| en | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..167.2 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| en | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..159.2 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| en | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..159.2 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| en | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..167.2 x 54..86; room 460 to the up arrow; clear |
| en | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| en | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..167.2 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..167.2 x 45..69; room 460 to the up arrow; clear |
| en | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..167.2 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| en | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| en | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| en | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..167.2 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| en | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..167.2 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| en | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| en | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..167.2 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| en | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..159.2 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| en | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| en | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..159.2 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| en | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |
| nl | 1280 x 640 | arrow 616..664 x 46..94; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1366 x 768 | arrow 659..707 x 50.5..98.5; bar 0..1366 x 0..44 | 16..182.4 x 54..86; room 643 to the up arrow; clear | 16..48 x 54..86; room 643 to the up arrow; clear | 16..182.4 x 54..86; room 643 to the up arrow; clear |
| nl | 1920 x 1080 | arrow 936..984 x 206.5..254.5; bar 0..1920 x 0..44 | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear | 16..48 x 54..86; room 1904 to the the window's right edge; clear | 16..182.4 x 54..86; room 1904 to the the window's right edge; clear |
| nl | 2560 x 1440 | arrow 1256..1304 x 386.5..434.5; bar 0..2560 x 0..44 | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear | 16..48 x 54..86; room 2544 to the the window's right edge; clear | 16..182.4 x 54..86; room 2544 to the the window's right edge; clear |
| nl | 1280 x 800 | arrow 616..664 x 66.5..114.5; bar 0..1280 x 0..44 | 16..182.4 x 54..86; room 600 to the up arrow; clear | 16..48 x 54..86; room 600 to the up arrow; clear | 16..182.4 x 54..86; room 600 to the up arrow; clear |
| nl | 1024 x 768 | arrow 488..536 x 50.5..98.5; bar 0..1024 x 0..44 | 16..182.4 x 54..86; room 472 to the up arrow; clear | 16..48 x 54..86; room 472 to the up arrow; clear | 16..182.4 x 54..86; room 472 to the up arrow; clear |
| nl | 768 x 1024 | arrow 360..408 x 178.5..226.5; bar 0..768 x 0..44 | 16..182.4 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear | 16..48 x 54..86; room 752 to the the window's right edge; clear |
| nl | 390 x 844 | arrow 171..219 x 96.5..144.5; bar 0..390 x 0..36 | 8..174.4 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear | 8..40 x 46..78; room 382 to the the window's right edge; clear |
| nl | 360 x 640 | arrow 156..204 x 38..86; bar 0..360 x 0..36 | 8..174.4 x 46..78; room 148 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 148 to the up arrow; clear | 8..40 x 46..78; room 148 to the up arrow; clear |
| nl | 1000 x 700 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 54..86; room 460 to the up arrow; clear | 16..48 x 54..86; room 460 to the up arrow; clear | 16..182.4 x 54..86; room 460 to the up arrow; clear |
| nl | 999 x 700 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear | 16..48 x 54..86; room 459.5 to the up arrow; clear |
| nl | 1000 x 639 | arrow 476..524 x 46..94; bar 0..1000 x 0..44 | 16..182.4 x 45..69; room 460 to the up arrow; clear | 16..42 x 45..69; room 460 to the up arrow; clear | 16..182.4 x 45..69; room 460 to the up arrow; clear |
| nl | 999 x 639 | arrow 475.5..523.5 x 46..94; bar 0..999 x 0..44 | 16..182.4 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear | 16..42 x 45..69; room 459.5 to the up arrow; clear |
| nl | 640 x 700 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear | 16..48 x 54..86; room 280 to the up arrow; clear |
| nl | 639 x 700 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear | 16..48 x 54..86; room 279.5 to the up arrow; clear |
| nl | 640 x 639 | arrow 296..344 x 46..94; bar 0..640 x 0..44 | 16..182.4 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear | 16..42 x 45..69; room 280 to the up arrow; clear |
| nl | 639 x 639 | arrow 295.5..343.5 x 46..94; bar 0..639 x 0..44 | 16..182.4 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear | 16..42 x 45..69; room 279.5 to the up arrow; clear |
| nl | 480 x 640 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear | 16..48 x 54..86; room 200 to the up arrow; clear |
| nl | 480 x 639 | arrow 216..264 x 46..94; bar 0..480 x 0..44 | 16..182.4 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear | 16..42 x 45..69; room 200 to the up arrow; clear |
| nl | 479 x 639 | arrow 215.5..263.5 x 38..86; bar 0..479 x 0..36 | 8..174.4 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear | 8..40 x 40..72; room 207.5 to the up arrow; clear |
| nl | 321 x 481 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 40..72; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 40..72; room 128.5 to the up arrow; clear | 8..40 x 40..72; room 128.5 to the up arrow; clear |
| nl | 321 x 700 | arrow 136.5..184.5 x 38..86; bar 0..321 x 0..36 | 8..174.4 x 46..78; room 128.5 to the up arrow; MEETS up arrow | 8..40 x 46..78; room 128.5 to the up arrow; clear | 8..40 x 46..78; room 128.5 to the up arrow; clear |
| nl | 320 x 480 |  | the notice stands in for the tree view | the notice stands in for the tree view | the notice stands in for the tree view |

### The public bar's room, with the share button (dev) and without it

| page | lang | viewport | with | without |
|---|---|---|---|---|
| the first Tree (Open Sans) | en | 1280 x 640 | 825.3 | 901.3 |
| the first Tree (Open Sans) | en | 1366 x 768 | 911.3 | 987.3 |
| the first Tree (Open Sans) | en | 1920 x 1080 | 1465.3 | 1541.3 |
| the first Tree (Open Sans) | en | 2560 x 1440 | 2105.3 | 2181.3 |
| the first Tree (Open Sans) | en | 1280 x 800 | 825.3 | 901.3 |
| the first Tree (Open Sans) | en | 1024 x 768 | 569.3 | 645.3 |
| the first Tree (Open Sans) | en | 768 x 1024 | 313.3 | 389.3 |
| the first Tree (Open Sans) | en | 390 x 844 | 72.2 | 133.2 |
| the first Tree (Open Sans) | en | 360 x 640 | 48.8 | 109.8 |
| the first Tree (Open Sans) | nl | 1280 x 640 | 810.3 | 901.3 |
| the first Tree (Open Sans) | nl | 1366 x 768 | 896.3 | 987.3 |
| the first Tree (Open Sans) | nl | 1920 x 1080 | 1450.3 | 1541.3 |
| the first Tree (Open Sans) | nl | 2560 x 1440 | 2090.3 | 2181.3 |
| the first Tree (Open Sans) | nl | 1280 x 800 | 810.3 | 901.3 |
| the first Tree (Open Sans) | nl | 1024 x 768 | 554.3 | 645.3 |
| the first Tree (Open Sans) | nl | 768 x 1024 | 298.3 | 389.3 |
| the first Tree (Open Sans) | nl | 390 x 844 | 58.2 | 133.2 |
| the first Tree (Open Sans) | nl | 360 x 640 | 34.8 | 109.8 |
| the example Tree | en | 1280 x 640 | 829.9 | 905.3 |
| the example Tree | en | 1366 x 768 | 915.9 | 991.3 |
| the example Tree | en | 1920 x 1080 | 1469.9 | 1545.3 |
| the example Tree | en | 2560 x 1440 | 2109.9 | 2185.3 |
| the example Tree | en | 1280 x 800 | 829.9 | 905.3 |
| the example Tree | en | 1024 x 768 | 573.9 | 649.3 |
| the example Tree | en | 768 x 1024 | 317.9 | 393.3 |
| the example Tree | en | 390 x 844 | 80.6 | 137.9 |
| the example Tree | en | 360 x 640 | 57.2 | 114.5 |
| the example Tree | nl | 1280 x 640 | 816.6 | 905.3 |
| the example Tree | nl | 1366 x 768 | 902.6 | 991.3 |
| the example Tree | nl | 1920 x 1080 | 1456.6 | 1545.3 |
| the example Tree | nl | 2560 x 1440 | 2096.6 | 2185.3 |
| the example Tree | nl | 1280 x 800 | 816.6 | 905.3 |
| the example Tree | nl | 1024 x 768 | 560.6 | 649.3 |
| the example Tree | nl | 768 x 1024 | 304.6 | 393.3 |
| the example Tree | nl | 390 x 844 | 68.4 | 137.9 |
| the example Tree | nl | 360 x 640 | 45 | 114.5 |
| the full Node under a Trail of itself | en | 1280 x 640 | 824.2 | 899.6 |
| the full Node under a Trail of itself | en | 1366 x 768 | 910.2 | 985.6 |
| the full Node under a Trail of itself | en | 1920 x 1080 | 1464.2 | 1539.6 |
| the full Node under a Trail of itself | en | 2560 x 1440 | 2104.2 | 2179.6 |
| the full Node under a Trail of itself | en | 1280 x 800 | 824.2 | 899.6 |
| the full Node under a Trail of itself | en | 1024 x 768 | 568.2 | 643.6 |
| the full Node under a Trail of itself | en | 768 x 1024 | 312.2 | 387.6 |
| the full Node under a Trail of itself | en | 390 x 844 | 48.1 | 105.3 |
| the full Node under a Trail of itself | en | 360 x 640 | 18.1 | 75.3 |
| the full Node under a Trail of itself | nl | 1280 x 640 | 811.6 | 900.3 |
| the full Node under a Trail of itself | nl | 1366 x 768 | 897.6 | 986.3 |
| the full Node under a Trail of itself | nl | 1920 x 1080 | 1451.6 | 1540.3 |
| the full Node under a Trail of itself | nl | 2560 x 1440 | 2091.6 | 2180.3 |
| the full Node under a Trail of itself | nl | 1280 x 800 | 811.6 | 900.3 |
| the full Node under a Trail of itself | nl | 1024 x 768 | 555.6 | 644.3 |
| the full Node under a Trail of itself | nl | 768 x 1024 | 299.6 | 388.3 |
| the full Node under a Trail of itself | nl | 390 x 844 | 36.4 | 105.9 |
| the full Node under a Trail of itself | nl | 360 x 640 | 6.4 | 75.9 |

### The faces drawn

- /admin/trees/hidden-draft/n-yjvw7m/full/does-not-apply en: #measure-face: Liberation Sans; .tree-frame .step-end > button: Liberation Sans
- /admin/trees/hidden-draft/n-yjvw7m/full/does-not-apply nl: #measure-face: Liberation Sans; .tree-frame .step-end > button: Liberation Sans
- /admin/trees/agrifood-hidden/start/article-2-exclusions/ai-act-does-not-apply en: #measure-face: Liberation Sans; .tree-frame .step-end > button: Open Sans SemiBold
- /admin/trees/agrifood-hidden/start/article-2-exclusions/ai-act-does-not-apply nl: #measure-face: Liberation Sans; .tree-frame .step-end > button: Open Sans SemiBold
- /admin/trees/example-hidden/start/outside-scope en: #measure-face: Liberation Sans; .tree-frame .step-end > button: Liberation Sans
- /admin/trees/example-hidden/start/outside-scope nl: #measure-face: Liberation Sans; .tree-frame .step-end > button: Liberation Sans

## 5. `<html lang>` in the editor of a draft in another language

Run on 2026-10-04 as `node .elsa-data/issue-205/check-lang.ts` from the repository's root, on the same
build of `dev` at `0db7ca5`, on Windows. The public page of `tests/fixtures/german-only`, a Tree in
German alone, says `<html lang="de">`; the editor of its hidden copy says `<html lang="en">` around a
Bubble in German, where `docs/specs/application.md` 24.1 says "The content language of the editor
is **the language being edited** (28.2); `<html lang>` is it". The root layout gives an admin
address the chrome language of the `[lang]` segment (`htmlLang` in `src/app/[lang]/layout.tsx`,
which reads only published Trees), `_` without `?lang`, so English. 40.3 decides the preview's.

```
the public page: de; the Bubble's lang: de
the editor of the hidden copy: en; the Bubble's lang: de
```

```ts
// Issue #205: <html lang> in the editor of a draft in German, against the public page of the same
// Tree. A scratch script of the architect's run, copied whole into
// docs/research/issue-205-top-left-room.md. Run from the repository's root after `npm run build`:
//   node .elsa-data/issue-205/check-lang.ts
// It serves tests/fixtures/german-only (one language, `de`) once hidden and once published, Anna
// the hidden copy's creator, and prints the `lang` of `<html>` and of the Bubble on each page.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ADMIN_ENV, buildDataDir } from '../../tests/browser/admin.ts'
import { serveStore, stopServers } from '../../tests/browser/serve.ts'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const german = path.join(repo, 'tests', 'fixtures', 'german-only')
const dir = await buildDataDir({ trees: [{ folder: german, id: 'german-hidden', hidden: true, creator: ANNA.email }, { folder: german, creator: ANNA.email }], accounts: [ANNA] })
try {
  const origin = await serveStore(dir, 13951, ADMIN_ENV)
  const login = await fetch(`${origin}/admin/api/login`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ANNA.email, password: ANNA.password }) })
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]!
  for (const [what, url, headers] of [
    ['the public page', `${origin}/german-only/start`, {}],
    ['the editor of the hidden copy', `${origin}/admin/trees/german-hidden/start`, { Cookie: cookie }],
  ] as const) {
    const html = await (await fetch(url, { headers })).text()
    console.log(`${what}: ${/<html lang="([^"]*)"/.exec(html)?.[1]}; the Bubble's lang: ${/<article class="bubble[^"]*" lang="([^"]*)"/.exec(html)?.[1]}`)
  }
} finally {
  await stopServers()
}
```

## 6. The floor's notice, and the band right of the arrow

Run on 2026-10-04 as `node .elsa-data/issue-205/run-floor.ts 13950` from the repository's root, on
the same build, on Windows. ***OVER THE NOTICE***: the box overlaps one of the notice's text lines.

| page | lang | viewport | the notice's lines | the floating controls | a button at the top left, as an icon |
|---|---|---|---|---|---|
| the editor | en | 320 x 480 | 44.5..229.3 x 61..78, 229.3..232.8 x 61..78, 232.8..275.5 x 61..78, 44.1..168.1 x 80.5..97.5, 232.8..275.5 x 61..78, 44.1..168.1 x 80.5..97.5, 168.1..171.7 x 80.5..97.5, 171.7..275.9 x 80.5..97.5, 130.2..189.8 x 100..117, 171.7..275.9 x 80.5..97.5, 130.2..189.8 x 100..117 | 238..272 x 40..72, 280..312 x 40..72 -- OVER THE NOTICE | 8..40 x 40..72 -- clear of it |
| the editor | en | 320 x 700 | 44.5..229.3 x 61..78, 229.3..232.8 x 61..78, 232.8..275.5 x 61..78, 98..222 x 80.5..97.5, 232.8..275.5 x 61..78, 98..222 x 80.5..97.5 | 238..272 x 46..78, 280..312 x 46..78 -- OVER THE NOTICE | 8..40 x 46..78 -- clear of it |
| the editor | en | 800 x 480 | 222.1..407 x 69..86, 407..410.5 x 69..86, 410.5..577.9 x 69..86, 410.5..577.9 x 69..86 | 721.1..750 x 45..69, 758..784 x 45..69 | 16..42 x 45..69 -- clear of it |
| the editor | en | 300 x 400 | 34.5..219.3 x 61..78, 219.3..222.8 x 61..78, 222.8..265.5 x 61..78, 34.1..158.1 x 80.5..97.5, 222.8..265.5 x 61..78, 34.1..158.1 x 80.5..97.5, 158.1..161.7 x 80.5..97.5, 161.7..265.9 x 80.5..97.5, 120.2..179.8 x 100..117, 161.7..265.9 x 80.5..97.5, 120.2..179.8 x 100..117 | 218..252 x 40..72, 260..292 x 40..72 -- OVER THE NOTICE | 8..40 x 40..72 -- OVER THE NOTICE |
| the editor | nl | 320 x 480 | 46.4..273.5 x 61..78, 48.4..84.7 x 80.5..97.5, 84.7..88.2 x 80.5..97.5, 88.2..271.6 x 80.5..97.5, 88.2..271.6 x 80.5..97.5, 70.3..249.7 x 100..117, 70.3..249.7 x 100..117 | 238..272 x 40..72, 280..312 x 40..72 -- OVER THE NOTICE | 8..40 x 40..72 -- clear of it |
| the editor | nl | 320 x 700 | 46.4..273.5 x 61..78, 48.4..84.7 x 80.5..97.5, 84.7..88.2 x 80.5..97.5, 88.2..271.6 x 80.5..97.5, 88.2..271.6 x 80.5..97.5 | 238..272 x 46..78, 280..312 x 46..78 -- OVER THE NOTICE | 8..40 x 46..78 -- clear of it |
| the editor | nl | 800 x 480 | 175.1..442 x 69..86, 442..445.5 x 69..86, 445.5..624.9 x 69..86, 445.5..624.9 x 69..86 | 721.1..750 x 45..69, 758..784 x 45..69 | 16..42 x 45..69 -- clear of it |
| the editor | nl | 300 x 400 | 36.4..263.5 x 61..78, 38.4..74.7 x 80.5..97.5, 74.7..78.2 x 80.5..97.5, 78.2..261.6 x 80.5..97.5, 78.2..261.6 x 80.5..97.5, 60.3..239.7 x 100..117, 60.3..239.7 x 100..117 | 218..252 x 40..72, 260..292 x 40..72 -- OVER THE NOTICE | 8..40 x 40..72 -- OVER THE NOTICE |
| the public page | en | 320 x 480 | 44.5..229.3 x 61..78, 229.3..232.8 x 61..78, 232.8..275.5 x 61..78, 44.1..168.1 x 80.5..97.5, 232.8..275.5 x 61..78, 44.1..168.1 x 80.5..97.5, 168.1..171.7 x 80.5..97.5, 171.7..275.9 x 80.5..97.5, 130.2..189.8 x 100..117, 171.7..275.9 x 80.5..97.5, 130.2..189.8 x 100..117 | none | 8..40 x 40..72 -- clear of it |
| the public page | en | 320 x 700 | 44.5..229.3 x 61..78, 229.3..232.8 x 61..78, 232.8..275.5 x 61..78, 98..222 x 80.5..97.5, 232.8..275.5 x 61..78, 98..222 x 80.5..97.5 | none | 8..40 x 46..78 -- clear of it |
| the public page | en | 800 x 480 | 222.1..407 x 69..86, 407..410.5 x 69..86, 410.5..577.9 x 69..86, 410.5..577.9 x 69..86 | none | 16..42 x 45..69 -- clear of it |
| the public page | en | 300 x 400 | 34.5..219.3 x 61..78, 219.3..222.8 x 61..78, 222.8..265.5 x 61..78, 34.1..158.1 x 80.5..97.5, 222.8..265.5 x 61..78, 34.1..158.1 x 80.5..97.5, 158.1..161.7 x 80.5..97.5, 161.7..265.9 x 80.5..97.5, 120.2..179.8 x 100..117, 161.7..265.9 x 80.5..97.5, 120.2..179.8 x 100..117 | none | 8..40 x 40..72 -- OVER THE NOTICE |
| the public page | nl | 320 x 480 | 46.4..273.5 x 61..78, 48.4..84.7 x 80.5..97.5, 84.7..88.2 x 80.5..97.5, 88.2..271.6 x 80.5..97.5, 88.2..271.6 x 80.5..97.5, 70.3..249.7 x 100..117, 70.3..249.7 x 100..117 | none | 8..40 x 40..72 -- clear of it |
| the public page | nl | 320 x 700 | 46.4..273.5 x 61..78, 48.4..84.7 x 80.5..97.5, 84.7..88.2 x 80.5..97.5, 88.2..271.6 x 80.5..97.5, 88.2..271.6 x 80.5..97.5 | none | 8..40 x 46..78 -- clear of it |
| the public page | nl | 800 x 480 | 175.1..442 x 69..86, 442..445.5 x 69..86, 445.5..624.9 x 69..86, 445.5..624.9 x 69..86 | none | 16..42 x 45..69 -- clear of it |
| the public page | nl | 300 x 400 | 36.4..263.5 x 61..78, 38.4..74.7 x 80.5..97.5, 74.7..78.2 x 80.5..97.5, 78.2..261.6 x 80.5..97.5, 78.2..261.6 x 80.5..97.5, 60.3..239.7 x 100..117, 60.3..239.7 x 100..117 | none | 8..40 x 40..72 -- OVER THE NOTICE |

```ts
// Issue #205: runs floor.mjs as run.ts runs measure.mjs, on Windows only. Usage, from the repository's root:
//   node .elsa-data/issue-205/run-floor.ts <port>
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ADMIN_ENV, buildDataDir } from '../../tests/browser/admin.ts'
import { serveStore, stopServers } from '../../tests/browser/serve.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '..', '..')
const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const full = path.join(repo, 'tests', 'fixtures', 'full-node')
const dir = await buildDataDir({ trees: [{ folder: full, id: 'hidden-draft', hidden: true, creator: ANNA.email }, { folder: full, id: 'full-public', creator: ANNA.email }], accounts: [ANNA] })
try {
  const origin = await serveStore(dir, Number(process.argv[2] ?? 13950), ADMIN_ENV)
  const login = await fetch(`${origin}/admin/api/login`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ANNA.email, password: ANNA.password }) })
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]!
  const api = async (method: string, route: string, data: unknown) => {
    const response = await fetch(`${origin}/admin/api${route}`, { method, headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (response.status >= 300) throw new Error(`${method} ${route} answered ${response.status}`)
    return response.json() as Promise<{ node?: { id: string } }>
  }
  const top = (await api('POST', '/trees/hidden-draft/nodes', { from: { node: 'opt-two', link: 'yes' } })).node!.id
  await api('PATCH', `/trees/hidden-draft/nodes/${top}`, { op: 'set-answer', answer: 'yes', target: 'full' })
  await api('PATCH', '/trees/hidden-draft/nodes/opt-two', { op: 'remove-answer', answer: 'yes' })
  await api('PATCH', '/trees/hidden-draft', { path: 'root', value: top })
  const run = spawnSync(process.execPath, [path.join(here, 'floor.mjs'), origin, ANNA.email, ANNA.password, top], { cwd: repo, encoding: 'utf8' })
  writeFileSync(path.join(here, 'floor.md'), run.stdout + run.stderr)
  console.log(run.stdout + run.stderr)
} finally {
  await stopServers()
}
```

```js
// Issue #205: at and below the floor (10.4), where the notice stands in for the tree view, where
// the notice's text lines stand, against the floating controls at the top right and a button at the
// top left drawn as measure.mjs draws its icon. A scratch script of the architect's run, copied
// whole into docs/research/issue-205-top-left-room.md. Usage, as measure.mjs:
//   node floor.mjs <origin> <anna's address> <anna's password> <the first step's id>
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('playwright-core')
const [origin, email, password, top] = process.argv.slice(2)

const browser = await chromium.launch()
const context = await browser.newContext()
const answer = await context.request.post(`${origin}/admin/api/login`, { headers: { Origin: origin, 'Content-Type': 'application/json' }, data: { email, password } })
if (answer.status() !== 204) throw new Error(`login answered ${answer.status()}`)
const page = await context.newPage()
const out = ['| page | lang | viewport | the notice\'s lines | the floating controls | a button at the top left, as an icon |', '|---|---|---|---|---|---|']
for (const [what, address] of [['the editor', `/admin/trees/hidden-draft/${top}/full/does-not-apply`], ['the public page', '/full-public/full/does-not-apply']]) {
  for (const lang of ['en', 'nl']) {
    for (const [w, h] of [[320, 480], [320, 700], [800, 480], [300, 400]]) {
      await page.setViewportSize({ width: w, height: h })
      await page.goto(`${origin}${address}${lang === 'nl' ? '?lang=nl' : ''}`, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      out.push(`| ${what} | ${lang} | ${w} x ${h} | ${await page.evaluate(() => {
        const r = (x) => Math.round(x * 10) / 10
        const show = (b) => `${r(b.left)}..${r(b.right)} x ${r(b.top)}..${r(b.bottom)}`
        const notice = document.querySelector('.minimum-size')
        const range = document.createRange()
        range.selectNodeContents(notice)
        const lines = [...range.getClientRects()].filter((b) => b.width > 0)
        const floating = [...document.querySelectorAll('.editor-float > .sheet > .sheet-open')].map((e) => e.getBoundingClientRect())
        const a = document.createElement('a')
        Object.assign(a.style, { position: 'fixed', top: 'var(--float-top)', left: 'var(--float-right)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'var(--float-size)', minWidth: 'var(--float-size)', padding: '0 4px', border: '1px solid #dfe0e2' })
        a.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16"></svg>'
        document.body.append(a)
        const b = a.getBoundingClientRect()
        a.remove()
        const meets = (x) => b.left < x.right && x.left < b.right && b.top < x.bottom && x.top < b.bottom
        const fmeets = floating.flatMap((f) => lines.filter((l) => f.left < l.right && l.left < f.right && f.top < l.bottom && l.top < f.bottom)).length
        return `${lines.map(show).join(', ')} | ${floating.map(show).join(', ') || 'none'}${fmeets ? ' -- OVER THE NOTICE' : ''} | ${show(b)}${lines.some(meets) ? ' -- OVER THE NOTICE' : ' -- clear of it'}`
      })} |`)
    }
  }
}
await browser.close()
console.log(out.join('\n'))
```

Run on 2026-10-04 as `node .elsa-data/issue-205/run-right.ts 13950`: `run-floor.ts` with `right.mjs` in
place of `floor.mjs`, on the same build, on Windows.

| lang | viewport | the cross | the floating controls | room between them |
|---|---|---|---|---|
| en | 999 x 700 | 531.5..563.5 x 54..86 | 909..943 x 54..86, 951..983 x 54..86 | 345.5 |
| en | 768 x 1024 | 416..448 x 186.5..218.5 | 678..712 x 54..86, 720..752 x 54..86 | 230 |
| en | 639 x 700 | 351.5..383.5 x 54..86 | 549..583 x 54..86, 591..623 x 54..86 | 165.5 |
| en | 480 x 640 | 272..304 x 54..86 | 390..424 x 54..86, 432..464 x 54..86 | 86 |
| en | 390 x 844 | 227..259 x 104.5..136.5 | 308..342 x 46..78, 350..382 x 46..78 | 49 |
| en | 360 x 640 | 212..244 x 46..78 | 278..312 x 46..78, 320..352 x 46..78 | 34 |
| en | 321 x 700 | 192.5..224.5 x 46..78 | 239..273 x 46..78, 281..313 x 46..78 | 14.5 |
| en | 321 x 481 | 192.5..224.5 x 40..72 | 239..273 x 40..72, 281..313 x 40..72 | 14.5 |
| nl | 999 x 700 | 531.5..563.5 x 54..86 | 909..943 x 54..86, 951..983 x 54..86 | 345.5 |
| nl | 768 x 1024 | 416..448 x 186.5..218.5 | 678..712 x 54..86, 720..752 x 54..86 | 230 |
| nl | 639 x 700 | 351.5..383.5 x 54..86 | 549..583 x 54..86, 591..623 x 54..86 | 165.5 |
| nl | 480 x 640 | 272..304 x 54..86 | 390..424 x 54..86, 432..464 x 54..86 | 86 |
| nl | 390 x 844 | 227..259 x 104.5..136.5 | 308..342 x 46..78, 350..382 x 46..78 | 49 |
| nl | 360 x 640 | 212..244 x 46..78 | 278..312 x 46..78, 320..352 x 46..78 | 34 |
| nl | 321 x 700 | 192.5..224.5 x 46..78 | 239..273 x 46..78, 281..313 x 46..78 | 14.5 |
| nl | 321 x 481 | 192.5..224.5 x 40..72 | 239..273 x 40..72, 281..313 x 40..72 | 14.5 |

```ts
// Issue #205: runs right.mjs as run.ts runs measure.mjs, on Windows only. Usage, from the repository's root:
//   node .elsa-data/issue-205/run-floor.ts <port>
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ADMIN_ENV, buildDataDir } from '../../tests/browser/admin.ts'
import { serveStore, stopServers } from '../../tests/browser/serve.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '..', '..')
const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const full = path.join(repo, 'tests', 'fixtures', 'full-node')
const dir = await buildDataDir({ trees: [{ folder: full, id: 'hidden-draft', hidden: true, creator: ANNA.email }, { folder: full, id: 'full-public', creator: ANNA.email }], accounts: [ANNA] })
try {
  const origin = await serveStore(dir, Number(process.argv[2] ?? 13950), ADMIN_ENV)
  const login = await fetch(`${origin}/admin/api/login`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ANNA.email, password: ANNA.password }) })
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]!
  const api = async (method: string, route: string, data: unknown) => {
    const response = await fetch(`${origin}/admin/api${route}`, { method, headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (response.status >= 300) throw new Error(`${method} ${route} answered ${response.status}`)
    return response.json() as Promise<{ node?: { id: string } }>
  }
  const top = (await api('POST', '/trees/hidden-draft/nodes', { from: { node: 'opt-two', link: 'yes' } })).node!.id
  await api('PATCH', `/trees/hidden-draft/nodes/${top}`, { op: 'set-answer', answer: 'yes', target: 'full' })
  await api('PATCH', '/trees/hidden-draft/nodes/opt-two', { op: 'remove-answer', answer: 'yes' })
  await api('PATCH', '/trees/hidden-draft', { path: 'root', value: top })
  const run = spawnSync(process.execPath, [path.join(here, 'right.mjs'), origin, ANNA.email, ANNA.password, top], { cwd: repo, encoding: 'utf8' })
  writeFileSync(path.join(here, 'right.md'), run.stdout + run.stderr)
  console.log(run.stdout + run.stderr)
} finally {
  await stopServers()
}
```

```js
// Issue #205: the band right of the up arrow below 1000 pixels wide, in the editor of a hidden Tree
// on a step that ends: the red cross and the two floating controls, and the room between them. A
// scratch script of the architect's run, copied whole into docs/research/issue-205-top-left-room.md.
// Usage, as floor.mjs: node right.mjs <origin> <anna's address> <anna's password> <the first step's id>
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('playwright-core')
const [origin, email, password, top] = process.argv.slice(2)
const browser = await chromium.launch()
const context = await browser.newContext()
const answer = await context.request.post(`${origin}/admin/api/login`, { headers: { Origin: origin, 'Content-Type': 'application/json' }, data: { email, password } })
if (answer.status() !== 204) throw new Error(`login answered ${answer.status()}`)
const page = await context.newPage()
const out = ['| lang | viewport | the cross | the floating controls | room between them |', '|---|---|---|---|---|']
for (const lang of ['en', 'nl']) {
  for (const [w, h] of [[999, 700], [768, 1024], [639, 700], [480, 640], [390, 844], [360, 640], [321, 700], [321, 481]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto(`${origin}/admin/trees/hidden-draft/${top}/full/does-not-apply${lang === 'nl' ? '?lang=nl' : ''}`, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    out.push(`| ${lang} | ${w} x ${h} | ${await page.evaluate(() => {
      const r = (x) => Math.round(x * 10) / 10
      const show = (b) => `${r(b.left)}..${r(b.right)} x ${r(b.top)}..${r(b.bottom)}`
      const cross = document.querySelector('.tree-frame .step-delete').getBoundingClientRect()
      const floating = [...document.querySelectorAll('.editor-float > .sheet > .sheet-open')].map((e) => e.getBoundingClientRect())
      const first = Math.min(...floating.map((f) => f.left))
      return `${show(cross)} | ${floating.map(show).join(', ')} | ${r(first - cross.right)}`
    })} |`)
  }
}
await browser.close()
console.log(out.join('\n'))
```

## 7. The scripts

Run as `node .elsa-data/issue-205/run.ts 13950` from the repository's root after `npm run build`,
with the container `elsa205` running: `docker run -d --name elsa205 -w /work
mcr.microsoft.com/playwright:v1.62.1-noble sleep infinity`, `apt-get install fonts-dejavu-core` in
it, and in its `/work` a copy of the repository's `node_modules/playwright-core`, a `package.json` of
`{"type":"module"}` and `measure.mjs`. `run.ts` builds the data directory, serves it, runs
`measure.mjs` on Windows and in the container, and writes the two outputs of sections 3 and 4.
Both scripts are as they ran the fourth time.

### `run.ts`

```ts
// Issue #205: runs measure.mjs against the production build of dev, on Windows and in the CI
// runner's faces. A scratch script of the architect's run, copied whole into
// docs/research/issue-205-top-left-room.md. Run from the repository's root after `npm run build`:
//   node .elsa-data/issue-205/run.ts <port>
// It builds a data directory with tests/browser/admin.ts's own `buildDataDir` -- the full Node
// and the two seeded Trees, each once hidden and once published, Anna their creator -- serves it
// with tests/browser/serve.ts's `serveStore`, listening on every interface so that the
// container reaches it, puts a first step above the full Node as step-buttons.spec.ts does (so
// that the full Node carries the cross), runs measure.mjs on Windows and in the
// mcr.microsoft.com/playwright:v1.62.1-noble image, writes both outputs beside this file, and
// stops the server.
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ADMIN_ENV, buildDataDir } from '../../tests/browser/admin.ts'
import { serveStore, stopServers } from '../../tests/browser/serve.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '..', '..')
const port = Number(process.argv[2] ?? 13950)
const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }

const full = path.join(repo, 'tests', 'fixtures', 'full-node')
const agrifood = path.join(repo, 'trees', 'ai-act-applicability-agrifood')
const example = path.join(repo, 'trees', 'ai-act-example')
const dir = await buildDataDir({
  trees: [
    { folder: full, id: 'hidden-draft', hidden: true, creator: ANNA.email },
    { folder: full, id: 'full-public', creator: ANNA.email },
    { folder: agrifood, id: 'agrifood-hidden', hidden: true, creator: ANNA.email },
    { folder: agrifood, creator: ANNA.email },
    { folder: example, id: 'example-hidden', hidden: true, creator: ANNA.email },
    { folder: example, creator: ANNA.email },
  ],
  accounts: [ANNA],
})

try {
  const origin = await serveStore(dir, port, { ...ADMIN_ENV, HOSTNAME: '0.0.0.0' })
  const login = await fetch(`${origin}/admin/api/login`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ANNA.email, password: ANNA.password }),
  })
  if (login.status !== 204) throw new Error(`login answered ${login.status}`)
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]!
  const api = async (method: string, route: string, data?: unknown) => {
    const response = await fetch(`${origin}/admin/api${route}`, {
      method,
      headers: { Origin: origin, Cookie: cookie, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: data === undefined ? undefined : JSON.stringify(data),
    })
    if (response.status >= 300) throw new Error(`${method} ${route} answered ${response.status}: ${await response.text()}`)
    return response.json() as Promise<{ node?: { id: string } }>
  }
  // A Node is made from a parent's Link (22.4): made under an aside, pointed at the full Node,
  // unhung from the aside, and made the root, it stands above the full Node (step-buttons.spec.ts).
  const made = await api('POST', '/trees/hidden-draft/nodes', { from: { node: 'opt-two', link: 'yes' } })
  const top = made.node!.id
  await api('PATCH', `/trees/hidden-draft/nodes/${top}`, { op: 'set-answer', answer: 'yes', target: 'full' })
  await api('PATCH', '/trees/hidden-draft/nodes/opt-two', { op: 'remove-answer', answer: 'yes' })
  await api('PATCH', `/trees/hidden-draft/nodes/${top}`, { path: 'title.en', value: 'The first step' })
  await api('PATCH', `/trees/hidden-draft/nodes/${top}`, { path: 'title.nl', value: 'De eerste stap' })
  await api('PATCH', '/trees/hidden-draft', { path: 'root', value: top })

  const windows = spawnSync(process.execPath, [path.join(here, 'measure.mjs'), origin, ANNA.email, ANNA.password, top], { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  writeFileSync(path.join(here, 'windows.md'), windows.stdout + windows.stderr)
  console.log(`Windows: exit ${windows.status}, ${windows.stdout.split('\n').length} lines`)

  const linux = spawnSync('docker', ['exec', '-w', '/work', 'elsa205', 'node', '/work/measure.mjs', `http://host.docker.internal:${port}`, ANNA.email, ANNA.password, top], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  writeFileSync(path.join(here, 'linux.md'), linux.stdout + linux.stderr)
  console.log(`Linux: exit ${linux.status}, ${linux.stdout.split('\n').length} lines`)
} finally {
  await stopServers()
}
```

### `measure.mjs`

```js
// Issue #205: the room at the top left, under the chrome bar, for the preview's two buttons, on
// the production build of dev. A scratch script of the architect's run, copied whole into
// docs/research/issue-205-top-left-room.md. Usage, from a folder whose node_modules holds
// playwright-core -- the repository, or the CI image's /work:
//   node measure.mjs <origin> <anna's address> <anna's password> <the first step's id>
// It logs in as the creator of the hidden Trees, opens each page at each viewport in English and
// in Dutch, and draws into it, at the top left under the bar, a button in the look of the
// editor's floating controls (33.1): in words -- a 16-pixel icon and the button's words -- and
// as an icon alone, as the floating controls are below 1000 pixels; then as the rule of
// application.md 40.5 draws it, in words from 1000 and an icon below, with the editor's ending's
// button kept out of its column below 1000 and an icon below 640. It prints where each would
// stand and what it would meet.
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('playwright-core')

const [origin, email, password, top] = process.argv.slice(2)

/**
 * The viewports of 10.6 where the tree view shows, the floor, and both sides of each breakpoint
 * the band above the Bubble has, as tests/browser/step-buttons.spec.ts walks them: 1000 wide,
 * where the floating controls take their words and the cross goes left of the arrow; 640 tall,
 * where the arrow goes onto the outline; 480 wide, a phone's band; and the narrowest windows above
 * the floor.
 */
const VIEWPORTS = [
  [1280, 640], [1366, 768], [1920, 1080], [2560, 1440], [1280, 800], [1024, 768], [768, 1024], [390, 844], [360, 640],
  [1000, 700], [999, 700], [1000, 639], [999, 639], [640, 700], [639, 700], [640, 639], [639, 639],
  [480, 640], [480, 639], [479, 639], [321, 481], [321, 700], [320, 480],
]

const LONG = 'start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/annex-i-legislation'
/** The editor's pages, of hidden Trees, and the public pages the preview draws as they are. */
const EDITOR = [
  ['the full Node under a first step: both Answers, eight Options, the cross', `/admin/trees/hidden-draft/${top}/full`],
  ['its No, a step that ends: the cross and "Tree does not end here after all"', `/admin/trees/hidden-draft/${top}/full/does-not-apply`],
  ['the first Tree (Open Sans): "Does not apply", a step that ends', '/admin/trees/agrifood-hidden/start/article-2-exclusions/ai-act-does-not-apply'],
  ['the first Tree: annex-i-legislation, eight Options', `/admin/trees/agrifood-hidden/${LONG}`],
  ['the example Tree: outside-scope, a step that ends', '/admin/trees/example-hidden/start/outside-scope'],
]
const PUBLIC = [
  ['the full Node under a Trail of itself: both Answers, eight Options', '/full-public/full/full'],
  ['its No, a step that ends', '/full-public/full/does-not-apply'],
  ['the first Tree (Open Sans): "Does not apply", a step that ends', '/ai-act-applicability-agrifood/start/article-2-exclusions/ai-act-does-not-apply'],
  ['the first Tree: annex-i-legislation, eight Options', `/ai-act-applicability-agrifood/${LONG}`],
  ['the example Tree: outside-scope, a step that ends', '/ai-act-example/start/outside-scope'],
]
const WORDS = {
  editor: { en: 'Preview', nl: 'Voorbeeld' },
  public: { en: 'Back to the editor', nl: 'Terug naar de editor' },
}

/**
 * Everything on the page a button at the top left must stay clear of, and the button itself,
 * drawn in `form` ('words' or 'icon') with `text`, in the editor's floating controls' look and
 * face (`face`, read off the editor's settings button). Answers one table cell: where the button
 * stands, the room from its left edge to the first box level with it, what it meets.
 */
function measure({ form, text, face, rule }) {
  const round = (x) => Math.round(x * 10) / 10
  // The rule of docs/specs/application.md 40.5 (#205): the button in words from 1000 pixels wide
  // and an icon below; and in the editor, on a step that ends, the ending's button kept out of
  // the button's column below 1000 and drawn as an icon of the cross's size below 640.
  if (rule) {
    form = window.innerWidth >= 1000 ? 'words' : 'icon'
    const end = document.querySelector('.tree-frame .step-end')
    if (end && window.innerWidth < 1000) {
      end.style.maxWidth = 'calc(50vw - var(--up-size) / 2 - 2 * var(--step-gap) - var(--float-right) - var(--float-size))'
      if (window.innerWidth < 640) {
        const button = end.querySelector('button')
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v6M8 8l-4 6M8 8l4 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
        Object.assign(button.style, { display: 'grid', placeItems: 'center', width: 'var(--step-size)', height: 'var(--step-size)', minHeight: '0', padding: '0', borderRadius: '50%' })
        end.style.width = 'var(--step-size)'
      }
    }
  }
  const boxOf = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom }
  }
  const shown = (selector) =>
    [...document.querySelectorAll(selector)].filter((el) => getComputedStyle(el).visibility !== 'hidden').map((el) => ({ name: selector, ...boxOf(el) })).filter((b) => b.w > 0 && b.h > 0)
  const notice = document.querySelector('.minimum-size')
  if (notice && getComputedStyle(notice).display !== 'none' && notice.getBoundingClientRect().height > 0) return 'the notice stands in for the tree view'
  const obstacles = [
    ...shown('.tree-frame .up-arrow').map((b) => ({ ...b, name: 'up arrow' })),
    ...shown('.tree-frame .step-delete').map((b) => ({ ...b, name: 'cross' })),
    ...shown('.tree-frame .step-end > button').map((b) => ({ ...b, name: 'ending\'s button' })),
    ...shown('.tree-frame .bubble').map((b) => ({ ...b, name: 'Bubble' })),
    ...shown('.tree-frame .outcome').map((b) => ({ ...b, name: 'badge' })),
    ...shown('.tree-frame .options > li').map((b) => ({ ...b, name: 'Option button' })),
    ...shown('.tree-frame .options-collapsed > .options-sheet > .sheet-open').map((b) => ({ ...b, name: 'Options control' })),
    ...shown('.editor-float > .sheet > .sheet-open').map((b) => ({ ...b, name: 'floating control' })),
  ]
  const header = document.querySelector('header').getBoundingClientRect()

  const a = document.createElement('a')
  a.href = '#'
  a.setAttribute('data-measure', '')
  Object.assign(a.style, {
    position: 'fixed', top: 'var(--float-top)', left: 'var(--float-right)', zIndex: '1', boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    height: 'var(--float-size)', minWidth: 'var(--float-size)', padding: form === 'words' ? '0 14px 0 10px' : '0 4px',
    border: '1px solid #dfe0e2', borderRadius: '999px', background: '#fff', color: '#2d2e33',
    fontFamily: face, fontSize: '13px', lineHeight: '20px', fontWeight: '400', whiteSpace: 'nowrap', textDecoration: 'none',
  })
  a.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style="flex:none"><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor"/></svg>'
  if (form === 'words') {
    const span = document.createElement('span')
    span.textContent = text
    a.append(span)
  }
  document.body.append(a)
  const b = boxOf(a)
  a.remove()

  const level = obstacles.filter((o) => o.y < b.bottom && b.y < o.bottom && o.right > b.x)
  const first = level.reduce((m, o) => (o.x < m.x ? o : m), { x: window.innerWidth, name: 'the window\'s right edge' })
  const room = first.x - b.x
  const met = obstacles.filter((o) => b.x < o.right && o.x < b.right && b.y < o.bottom && o.y < b.bottom).map((o) => o.name)
  const under = b.y >= header.bottom - 0.5
  const verdict = met.length ? `MEETS ${[...new Set(met)].join(', ')}` : under ? 'clear' : 'IN THE BAR'
  return `${round(b.x)}..${round(b.right)} x ${round(b.y)}..${round(b.bottom)}; room ${round(room)} to the ${first.name}; ${verdict}`
}

/** The step's buttons and the arrow, for the record: their boxes, and the ending's lines. */
function band() {
  const round = (x) => Math.round(x * 10) / 10
  const show = (el) => {
    const r = el.getBoundingClientRect()
    return `${round(r.x)}..${round(r.right)} x ${round(r.y)}..${round(r.bottom)}`
  }
  const parts = []
  const up = document.querySelector('.tree-frame .up-arrow')
  if (up && up.getBoundingClientRect().width > 0) parts.push(`arrow ${show(up)}`)
  const cross = document.querySelector('.tree-frame .step-delete')
  if (cross && cross.getBoundingClientRect().width > 0) parts.push(`cross ${show(cross)}`)
  const end = document.querySelector('.tree-frame .step-end > button')
  if (end && end.getBoundingClientRect().width > 0) {
    const range = document.createRange()
    range.selectNodeContents(end)
    const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size
    parts.push(`ending's button ${show(end)}, ${lines} line${lines === 1 ? '' : 's'}`)
  }
  const options = [...document.querySelectorAll('.tree-frame .options > li')].map((li) => li.getBoundingClientRect()).filter((r) => r.width > 0)
  if (options.length) parts.push(`highest Option button's top ${round(Math.min(...options.map((r) => r.top)))}`)
  parts.push(`bar ${show(document.querySelector('header'))}`)
  return parts.join('; ')
}

/** The public bar's room without the share button, as the preview draws it (#202's method). */
function barRoom(withoutShare) {
  const bar = document.querySelector('header.page-chrome')
  const controls = bar.querySelector(':scope > .page-controls')
  if (withoutShare) for (const share of controls.querySelectorAll('.share')) share.style.display = 'none'
  const first = bar.firstElementChild.getBoundingClientRect()
  const c = controls.getBoundingClientRect()
  const room = c.left - first.right - parseFloat(getComputedStyle(bar).columnGap)
  const box = bar.getBoundingClientRect()
  const overflowing = [...bar.querySelectorAll('*')].some((el) => (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) || (el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1))
  const wide = box.width > window.innerWidth + 0.5 || overflowing
  for (const share of controls.querySelectorAll('.share')) share.style.display = ''
  return `${Math.round(room * 10) / 10}${wide ? ' -- DOES NOT FIT' : ''}`
}

const browser = await chromium.launch()
const context = await browser.newContext()
const answer = await context.request.post(`${origin}/admin/api/login`, {
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  data: { email, password },
})
if (answer.status() !== 204) throw new Error(`login answered ${answer.status()}`)
const page = await context.newPage()
const cdp = await context.newCDPSession(page)

// The face of the editor's own interface (24.3, #180): read off its settings button.
await page.setViewportSize({ width: 1280, height: 640 })
await page.goto(`${origin}${EDITOR[0][1]}`, { waitUntil: 'load' })
const face = await page.evaluate(() => {
  const control = document.querySelector('.editor-float > .panel-sheet > .sheet-open')
  if (!control) throw new Error('no settings button: not logged in, or not an editor page')
  const cs = getComputedStyle(control)
  return { family: cs.fontFamily, size: cs.fontSize, line: cs.lineHeight, weight: cs.fontWeight, padding: cs.padding, height: cs.height }
})

const out = [`The editor's floating controls: ${JSON.stringify(face)}`, '']
async function table(kind, title, address) {
  out.push(`### ${title}`, '', `\`${address}\``, '', `| lang | viewport | the band | in words | as an icon | the rule |`, '|---|---|---|---|---|---|')
  for (const lang of ['en', 'nl']) {
    for (const [w, h] of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h })
      const url = new URL(address, origin)
      if (lang === 'nl') url.searchParams.set('lang', 'nl')
      await page.goto(url.href, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      const text = WORDS[kind][lang]
      const words = await page.evaluate(measure, { form: 'words', text, face: face.family })
      const icon = await page.evaluate(measure, { form: 'icon', text, face: face.family })
      const where = words.startsWith('the notice') ? '' : await page.evaluate(band)
      // Last, as it changes the ending's button for the rest of the page's life.
      const rule = await page.evaluate(measure, { form: 'icon', text, face: face.family, rule: true })
      const after = words.startsWith('the notice') ? '' : (await page.evaluate(band)).match(/ending's button [^;]*/)?.[0] ?? ''
      out.push(`| ${lang} | ${w} x ${h} | ${where} | ${words} | ${icon} | ${rule}${after ? `; ${after}` : ''} |`)
    }
  }
  out.push('')
}
for (const [title, address] of EDITOR) await table('editor', `The editor of a hidden Tree: ${title}`, address)
for (const [title, address] of PUBLIC) await table('public', `The public page: ${title}`, address)

// The public bar with and without the share button, at 10.6's viewports.
out.push('### The public bar\'s room, with the share button (dev) and without it', '', '| page | lang | viewport | with | without |', '|---|---|---|---|---|')
for (const [title, address] of [PUBLIC[2], PUBLIC[4], PUBLIC[0]]) {
  for (const lang of ['en', 'nl']) {
    for (const [w, h] of VIEWPORTS.slice(0, 9)) {
      await page.setViewportSize({ width: w, height: h })
      const url = new URL(address, origin)
      if (lang === 'nl') url.searchParams.set('lang', 'nl')
      await page.goto(url.href, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      out.push(`| ${title.split(':')[0]} | ${lang} | ${w} x ${h} | ${await page.evaluate(barRoom, false)} | ${await page.evaluate(barRoom, true)} |`)
    }
  }
}
out.push('')

// The faces drawn: the button's words, and the ending's button, by CDP.
out.push('### The faces drawn', '')
for (const [kind, address, selector] of [
  ['editor', EDITOR[1][1], '.tree-frame .step-end > button'],
  ['editor', EDITOR[2][1], '.tree-frame .step-end > button'],
  ['editor', EDITOR[4][1], '.tree-frame .step-end > button'],
]) {
  for (const lang of ['en', 'nl']) {
    await page.setViewportSize({ width: 1280, height: 640 })
    const url = new URL(address, origin)
    if (lang === 'nl') url.searchParams.set('lang', 'nl')
    await page.goto(url.href, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(({ text, family }) => {
      const a = document.createElement('a')
      a.id = 'measure-face'
      a.textContent = text
      Object.assign(a.style, { position: 'fixed', top: '50px', left: '16px', zIndex: '1', fontFamily: family, fontSize: '13px' })
      document.body.append(a)
    }, { text: WORDS[kind][lang], family: face.family })
    // Two frames, so the new element is laid out and its face matched before CDP is asked.
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
    await cdp.send('DOM.enable')
    await cdp.send('CSS.enable')
    const { root } = await cdp.send('DOM.getDocument')
    const faces = []
    for (const sel of ['#measure-face', selector]) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel })
      if (!nodeId) {
        faces.push(`${sel}: none`)
        continue
      }
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
      faces.push(`${sel}: ${fonts.map((f) => f.familyName).join(' and ')}`)
    }
    out.push(`- ${address} ${lang}: ${faces.join('; ')}`)
  }
}
await browser.close()
console.log(out.join('\n'))
```
