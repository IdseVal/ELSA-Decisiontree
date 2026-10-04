# Issue #202: the room in the chrome bars for the "Editor" and "Website" buttons

> Measured on 2026-10-03 (UTC, as GitHub dates the merges) by the run that filed the issues of
> #202, and the same day by its fix run, after the review of pull request #207 found that the
> first run had measured nothing between 479 and 768 pixels wide. The first run measured the
> production build (`npm run build`) of `dev` at `6d0ea4b`; the fix run measured that build
> again and then `dev` at `748ebcc`, after #196 and #200 had merged, and the two printed the
> same rows (section 1, "The runs"). Each was served by `node .next/standalone/server.js` from a
> scratch data directory seeded from the repository's `trees/` (`ELSA_SEED_DIR`), with
> `ELSA_ADMIN_PASSWORD` -- and on `748ebcc` `ELSA_ADMIN_EMAIL` -- set for the administrator, on
> Windows 11 with Node 22.18.0 and Playwright 1.62.1 (its Chromium). The fix run also ran the
> same script in Linux, in the `mcr.microsoft.com/playwright:v1.62.1-noble` image (its Chromium
> 151.0.7922.34, with `fonts-dejavu-core` 2.37-8 installed), against the same servers, as
> `docs/research/issue-171-measurements.md` 3 measured the CI runner's faces: there the default
> stack is drawn in Liberation Sans, as on the CI runner, where Windows draws it in Segoe UI,
> and both draw the first Tree's own Open Sans (the closing lists of sections 3 and 4 name the
> face each drew). Every number that `docs/adrs/ADR-202-navigation-round.md`, core document 3.4
> `[#202]` and 10.22, and issue #204 cite is here, with the script that produced it, copied
> whole in section 5, and its output as it ran on `748ebcc` on each system, in sections 3 and 4.
> This is a record, not a contract: #204 builds the buttons, amends `docs/specs/application.md`,
> and measures again on its own build where a number decides a test.

## 1. What was measured

- **A control drawn into each bar** by the script, at the end of its controls
  (`.page-controls`), where #204 is to put it: an `<a>` saying "Editor" on the public pages or
  "Website" at `/admin`, with the class of the share button (`share`: a pill with a border, the
  look of the public bars' own controls) or of the account link (`admin-link`: underlined text,
  the look of the admin bars' own). Nothing else on the page was changed, except in the columns
  and tables that say so. There the current language's pill is hidden at every viewport -- the
  list item that holds `.language--current`, and with it one of the switch's 4-pixel gaps -- and
  at `/admin` the site's title too, where #204 is to hide them below 768 pixels wide on a Node
  page, and below 600 on the creators' overview at `/admin` only (section 2); or the Tree's logo
  is drawn as wide as its cap (below). `dev`'s own rule for the Tree-less admin bars below 480
  hides the pill alone (#135) and keeps its item and gap, which the columns of `/admin` that
  hide nothing show as they are.
- ***room***: the width between the bar's first child -- the arrow and the Tree's mark on a Node
  page, the site's title elsewhere -- and its controls, the bar's gap taken off. Where the first
  child is hidden -- the site's title on the Tree-less admin bars below 480 pixels wide
  (`application.md` 24.3, #135), or in a column that hides it -- the width after the controls,
  which then stand alone at the left.
- ***DOES NOT FIT***: the bar is wider than the window, the body is wider than the window, or an
  element of the bar has content wider or taller than itself (10.6). Once nothing in the bar can
  shrink any more, the bar grows past the window: "bar 346 in 320" is that width. ***WRAPS***:
  nothing overflows, but a text of the bar is drawn on more than one line -- in these rows only
  ever the site's title -- where #204's bars are one row. The first run checked neither the
  heights nor the lines; its rows came out the same with both checks (below).
- **Pages**: the root Node pages of the two seeded Trees, both with a logo; the overview `/`;
  the login page at `/admin`, without a session; and the creators' overview at `/admin` as the
  administrator, whose bar holds the most controls -- the language switch, Account, Accounts and
  Log out. Then, in two tables of their own, the two root Node pages with the Tree's logo drawn
  as wide as its cap. The format gives a logo's file no shape (`docs/specs/tree-format.md`
  4.3.1), and the bar draws it 30 pixels tall and at most `min(18rem, 45vw)` wide, and
  `calc(22vw - 12px)` below 480 (`.logo` in `src/app/[lang]/globals.css`: "a Theme's logo may be
  any shape"), so a logo that wide is the widest a Theme can bring. The script draws it so by
  asking for the window's width, which the cap cuts down; the closing lists give the cap.
- **Viewports**: the ten of 10.6; 479 x 800, the widest window below 480; and, added by the fix
  run, twelve widths from 480 to 767, 800 tall: 480, 500, 520, 540, 560, 580, 599, 600, 620,
  640, 700 and 767 -- 599 and 600 either side of the creators' overview's width of section 2,
  767 and 10.6's 768 x 1024 either side of a Node page's. From 480 up, nothing in a Node page's
  bar beside a seeded logo changes with the width but its room, which grows by every pixel the
  window does (the rows from 480 to 2560): its pills keep 12 pixels on 18 with 12 of padding
  (`.language, .share` in `globals.css`), the only width query that touches the bar below 768 is
  `max-width: 479px`, and both seeded logos are 120 pixels wide at their 30 pixels tall (their
  files are 479 x 120 and 240 x 60), under the cap, which is 216 at 480 wide and 288 from 640
  up. A logo at its cap widens with the window up to 640.
- **Languages**: English and Dutch, the chrome's two and the seeded Trees' two. The current
  language's pill names its language in that language -- "English", "Nederlands" -- so how wide
  it is depends on the language. No Tree in another language, with a third language, or in one
  language only was measured.
- **The closing list**, at 320 x 480 and at 480 x 800, as on `dev`: what each pill of the
  language switch says and its width, the share button's width, the logo's width, its file's
  size and its cap, and the face of the pills -- the first family their stack names ("Open Sans"
  for the first Tree; for the second, the default stack's first, `-apple-system`, which neither
  system has) and the face Chromium drew them in, as `CSS.getPlatformFontsForNode` names it.
  Then, at 320 x 480, where the controls of the bar at `/admin` stand.
- **The runs.** In the filing run the script ran three times, on Windows only, and printed the
  same tables each time. The fix run widened it step by step and ran it seven times on each
  system, six on `6d0ea4b` and the seventh on `748ebcc`, logging in by address as `dev` does
  since #196. The first printed the 110 rows of the filing run unchanged on Windows, in the
  columns they had. Every later run printed each row of the run before it unchanged, and added only what
  the script had gained in between: the columns without the site's title and the lines on where
  the controls at `/admin` stand (the second run), the rows at 599 x 800 (the third), the face
  drawn (the fourth printed it empty, the fifth named it), and the tables with the logo at its
  cap and the cap in the closing lists (the sixth). The seventh printed all 322 rows and both
  closing lists of the sixth unchanged, on both systems: #196 and #200 changed nothing these
  bars draw for the seeded Trees. Sections 3 and 4 are the seventh run.

## 2. What it shows

Each pair of numbers is Windows' first, then the CI image's.

**A Node page's bar, beside the seeded Trees' logos.**

- From 480 pixels wide up, "Editor" in the share button's look fits beside the current
  language's pill only from 520 pixels wide (the second Tree in English) or 540 (the others), on
  both systems, and in the account link's look from 500 or 520. Narrower, the bar grows past the
  window, to 540 pixels in a 480-pixel window in Dutch beside the first Tree's logo (539 in the
  CI image). At 540 the share button's look leaves 0.1 pixels in Dutch beside the first Tree's
  logo on Windows and 1.3 in the CI image; at 600, 60.1 to 85.1 on Windows and 61.3 to 82.5 in
  the CI image.
- Below 480, as the filing run found: with the pill, "Editor" does not fit at 320 x 480 in either look,
  beside either Tree's logo, in either language, nor at 360 x 640 in Dutch beside the first
  Tree's logo.
- Without the current language's pill, "Editor" in the share button's look fits at every width
  measured below 768: at 767 x 800 with 311.9 to 329.8 pixels to spare on Windows and 313.3 to
  327.6 in the CI image, at 480 x 800 with 24.9 to 42.8 and 26.3 to 40.6, and at 320 x 480 with
  26.8 to 43.3 and 22.6 to 41.3. The pill it gives up is, at 480 x 800, 63.6 to 90.9 pixels wide
  on Windows and 65.4 to 91 in the CI image, and at 320 x 480, 46.5 to 71.5 and 48.1 to 72 (the
  closing lists).

**A Node page's bar, beside a logo as wide as its cap.**

- On `dev`, the bar does not hold such a logo from 480 pixels wide until 599 to 640, by Tree,
  language and system; in Dutch beside the first Tree's controls it is wider than the window at
  every width measured from 480 to 620, and fits at 640 with 1.3 pixels to spare on Windows and
  2 in the CI image. Below 480 and from 640 up it holds it.
- With "Editor" in the share button's look beside the pill, the bar holds such a logo only from
  700 pixels wide, and in Dutch beside the first Tree's controls only from 767: at 700 that bar
  is 708 pixels wide, 707 in the CI image. At 768 x 1024 it keeps 59.8 to 85.1 pixels on Windows
  and 61 to 82.5 in the CI image.

**"Editor" against the pill it replaces.** In every cell measured below 768 pixels wide that
shows "Editor" without the current language's pill -- 192 on each system: 128 in the two tables
beside the seeded logos, both looks, and 64 in the two beside a logo at its cap, the share
button's look; both languages -- the bar holds the logo wherever `dev`'s bar holds it, with as
much room or more, and where `dev`'s bar does not, it is no wider. That rests on the hidden
pill's list item and gap. In the share button's look, from 480 up, the item "English" with its
gap leaves 0.2 to 0.3 pixels more than "Editor" with its gap takes on Windows and 1 to 2 in the CI image, and
"Nederlands" 23.4 to 25.4 and 24 to 26; below 480, 5.7 to 5.8 and 5 to 7.4, and 26.9 to 28.8 and
27.5 to 28. The account link's look leaves more: 23.5 or more from 480 up, 12.2 or more below.
Hiding the pill alone, as `dev` does below 480 at `/admin`, would keep 4 pixels of gap, and from
480 up "English" would then leave less than "Editor" takes. From 768 up, "Editor" fits beside
the pill in every row, beside either logo: the least is 59.8 pixels on Windows and 61 in the CI
image, in Dutch beside the first Tree's logo at its cap, at 768 x 1024.

**What these rows do not cover.** They hold for Trees in English and Dutch, two languages each.
A current language whose own name is drawn narrower than "Editor" gives up less room than
"Editor" takes. A third language adds a pill: from 768 up, beside a logo at its cap, "Editor"
leaves 59.8 pixels in Dutch beside the first Tree's controls, and a third pill wider than that,
with its gap, takes the bar past the window there, where `dev`'s bar holds it. Neither was
measured; nor does `dev`'s bar hold a third pill on a phone, where it keeps 3.6 to 28.3 pixels
at 320 x 480 beside the seeded logos (both systems) and the narrowest pill there is 46.5 wide.
A Tree in one language has one pill, the current language's, so giving it up empties the
language switch.

**The overview `/`.** "Editor" fits at every width in either look; at 320 x 480, the
narrowest, the share button's look leaves 37.1 to 41.3 pixels on Windows and 24.9 to 30.7 in the
CI image.

**The bar at `/admin`.**

- The login page holds "Website" in the account link's look at every width: from 480 up beside
  its title, with 108.2 pixels or more on Windows and 93.3 in the CI image; below 480, where the
  bar hides the title (#135), with 182.4 or more and 181.
- The administrator's creators' overview, on `dev` as it is, already draws its title -- "ELSA
  decision trees", "ELSA-beslisbomen" -- on two lines at 480 x 800 on Windows, and at 480 and
  500 x 800 in the CI image, in both languages. With "Website" in the account link's look beside
  the title, the bar grows past the window or the title takes two or three lines up to 540
  pixels wide on Windows and 560 in the CI image; "Website" fits from 560 on Windows (6.7 pixels
  to spare in Dutch) and from 580 in the CI image (14.7), and keeps 46.7 to 54.1 at 600 on
  Windows and 34.7 to 39.5 in the CI image. In the share button's look it fits from 580 on
  Windows and from 599 in the CI image.
- Without the site's title and the current language's pill, "Website" in the account link's look
  fits the creators' overview at every width measured: at 480 x 800 with 131.2 pixels or more on
  Windows and 130 in the CI image; below 480, where `dev` already hides both, with 18.2 to 27 at
  320 x 480 on Windows and 17.2 to 25.8 in the CI image.
- Below 480 the controls of the bar at `/admin` stand alone at its left end: at 320 x 480 the
  login page's from 8 to 79.7 pixels of 320 in English, and the administrator's from 8 to 243.8
  (Windows). `.page-chrome` spreads its children to its two ends (`justify-content:
  space-between`), and the site's title, the first, is hidden.
- Of the widths measured, 580 is the narrowest at which "Website" fits beside the title on both
  systems, with 14.7 pixels to spare in Dutch in the CI image; at 600 the least is 34.7. The two
  systems differ by up to 14.6 pixels in that bar at 600 (54.1 against 39.5, in English).

**What the first run left out.** The filing run measured nothing between 479 and 768 pixels
wide, and read its rows as "the current language's pill need give way below 480 only" and
"neither the overview's bar nor the bar at `/admin` has to give anything up". The rows from 480
to 767 show both untrue: with "Editor" beside the pill, a Node page's bar is wider than the
window below 520 or 540 pixels wide beside the seeded logos, and up to 700 beside a logo at its
cap; and with "Website" beside the title, the creators' overview's bar is wider than the window
or wraps its title below 560 or 580. The overview's bar and the login page's hold their buttons
at every width, as the first run said.

## 3. The output on Windows, as it ran on `748ebcc`

### The root Node page of ai-act-applicability-agrifood

| lang | viewport | room on dev | + "Editor", share look | + "Editor", account-link look | + "Editor", share look, no current-language pill | + "Editor", account-link look, no current-language pill |
|---|---|---|---|---|---|---|
| en | 1280 x 640 | 824.7 | 755.3 | 778.5 | 824.9 | 848.2 |
| en | 1366 x 768 | 910.7 | 841.3 | 864.5 | 910.9 | 934.2 |
| en | 1920 x 1080 | 1464.7 | 1395.3 | 1418.5 | 1464.9 | 1488.2 |
| en | 2560 x 1440 | 2104.7 | 2035.3 | 2058.5 | 2104.9 | 2128.2 |
| en | 1280 x 800 | 824.7 | 755.3 | 778.5 | 824.9 | 848.2 |
| en | 1024 x 768 | 568.7 | 499.3 | 522.5 | 568.9 | 592.2 |
| en | 768 x 1024 | 312.7 | 243.3 | 266.5 | 312.9 | 336.2 |
| en | 390 x 844 | 75.6 | 29 | 35.4 | 81.3 | 87.8 |
| en | 360 x 640 | 52.2 | 5.6 | 12 | 58 | 64.4 |
| en | 320 x 480 | 21 | 0 -- DOES NOT FIT: bar 346 in 320 | 0 -- DOES NOT FIT: bar 339 in 320 | 26.8 | 33.2 |
| en | 479 x 800 | 145 | 98.4 | 104.8 | 150.8 | 157.2 |
| en | 480 x 800 | 24.7 | 0 -- DOES NOT FIT: bar 525 in 480 | 0 -- DOES NOT FIT: bar 502 in 480 | 24.9 | 48.2 |
| en | 500 x 800 | 44.7 | 0 -- DOES NOT FIT: bar 525 in 500 | 0 -- DOES NOT FIT: bar 502 in 500 | 44.9 | 68.2 |
| en | 520 x 800 | 64.7 | 0 -- DOES NOT FIT: bar 525 in 520 | 18.5 | 64.9 | 88.2 |
| en | 540 x 800 | 84.7 | 15.3 | 38.5 | 84.9 | 108.2 |
| en | 560 x 800 | 104.7 | 35.3 | 58.5 | 104.9 | 128.2 |
| en | 580 x 800 | 124.7 | 55.3 | 78.5 | 124.9 | 148.2 |
| en | 599 x 800 | 143.7 | 74.3 | 97.5 | 143.9 | 167.2 |
| en | 600 x 800 | 144.7 | 75.3 | 98.5 | 144.9 | 168.2 |
| en | 620 x 800 | 164.7 | 95.3 | 118.5 | 164.9 | 188.2 |
| en | 640 x 800 | 184.7 | 115.3 | 138.5 | 184.9 | 208.2 |
| en | 700 x 800 | 244.7 | 175.3 | 198.5 | 244.9 | 268.2 |
| en | 767 x 800 | 311.7 | 242.3 | 265.5 | 311.9 | 335.2 |
| nl | 1280 x 640 | 809.5 | 740.1 | 763.3 | 834.9 | 858.2 |
| nl | 1366 x 768 | 895.5 | 826.1 | 849.3 | 920.9 | 944.2 |
| nl | 1920 x 1080 | 1449.5 | 1380.1 | 1403.3 | 1474.9 | 1498.2 |
| nl | 2560 x 1440 | 2089.5 | 2020.1 | 2043.3 | 2114.9 | 2138.2 |
| nl | 1280 x 800 | 809.5 | 740.1 | 763.3 | 834.9 | 858.2 |
| nl | 1024 x 768 | 553.5 | 484.1 | 507.3 | 578.9 | 602.2 |
| nl | 768 x 1024 | 297.5 | 228.1 | 251.3 | 322.9 | 346.2 |
| nl | 390 x 844 | 61.7 | 15 | 21.5 | 90.5 | 96.9 |
| nl | 360 x 640 | 38.3 | 0 -- DOES NOT FIT: bar 368 in 360 | 0 -- DOES NOT FIT: bar 362 in 360 | 67.1 | 73.5 |
| nl | 320 x 480 | 7.1 | 0 -- DOES NOT FIT: bar 360 in 320 | 0 -- DOES NOT FIT: bar 353 in 320 | 35.9 | 42.3 |
| nl | 479 x 800 | 131.1 | 84.5 | 90.9 | 159.9 | 166.4 |
| nl | 480 x 800 | 9.5 | 0 -- DOES NOT FIT: bar 540 in 480 | 0 -- DOES NOT FIT: bar 517 in 480 | 34.9 | 58.2 |
| nl | 500 x 800 | 29.5 | 0 -- DOES NOT FIT: bar 540 in 500 | 0 -- DOES NOT FIT: bar 517 in 500 | 54.9 | 78.2 |
| nl | 520 x 800 | 49.5 | 0 -- DOES NOT FIT: bar 540 in 520 | 3.3 | 74.9 | 98.2 |
| nl | 540 x 800 | 69.5 | 0.1 | 23.3 | 94.9 | 118.2 |
| nl | 560 x 800 | 89.5 | 20.1 | 43.3 | 114.9 | 138.2 |
| nl | 580 x 800 | 109.5 | 40.1 | 63.3 | 134.9 | 158.2 |
| nl | 599 x 800 | 128.5 | 59.1 | 82.3 | 153.9 | 177.2 |
| nl | 600 x 800 | 129.5 | 60.1 | 83.3 | 154.9 | 178.2 |
| nl | 620 x 800 | 149.5 | 80.1 | 103.3 | 174.9 | 198.2 |
| nl | 640 x 800 | 169.5 | 100.1 | 123.3 | 194.9 | 218.2 |
| nl | 700 x 800 | 229.5 | 160.1 | 183.3 | 254.9 | 278.2 |
| nl | 767 x 800 | 296.5 | 227.1 | 250.3 | 321.9 | 345.2 |

### The root Node page of ai-act-example

| lang | viewport | room on dev | + "Editor", share look | + "Editor", account-link look | + "Editor", share look, no current-language pill | + "Editor", account-link look, no current-language pill |
|---|---|---|---|---|---|---|
| en | 1280 x 640 | 832.5 | 765.1 | 788.5 | 832.8 | 856.2 |
| en | 1366 x 768 | 918.5 | 851.1 | 874.5 | 918.8 | 942.2 |
| en | 1920 x 1080 | 1472.5 | 1405.1 | 1428.5 | 1472.8 | 1496.2 |
| en | 2560 x 1440 | 2112.5 | 2045.1 | 2068.5 | 2112.8 | 2136.2 |
| en | 1280 x 800 | 832.5 | 765.1 | 788.5 | 832.8 | 856.2 |
| en | 1024 x 768 | 576.5 | 509.1 | 532.5 | 576.8 | 600.2 |
| en | 768 x 1024 | 320.5 | 253.1 | 276.5 | 320.8 | 344.2 |
| en | 390 x 844 | 82.9 | 38.2 | 45 | 88.7 | 95.5 |
| en | 360 x 640 | 59.5 | 14.8 | 21.6 | 65.3 | 72.1 |
| en | 320 x 480 | 28.3 | 0 -- DOES NOT FIT: bar 336 in 320 | 0 -- DOES NOT FIT: bar 330 in 320 | 34.1 | 40.9 |
| en | 479 x 800 | 152.4 | 107.7 | 114.4 | 158.2 | 164.9 |
| en | 480 x 800 | 32.5 | 0 -- DOES NOT FIT: bar 515 in 480 | 0 -- DOES NOT FIT: bar 491 in 480 | 32.8 | 56.2 |
| en | 500 x 800 | 52.5 | 0 -- DOES NOT FIT: bar 515 in 500 | 8.5 | 52.8 | 76.2 |
| en | 520 x 800 | 72.5 | 5.1 | 28.5 | 72.8 | 96.2 |
| en | 540 x 800 | 92.5 | 25.1 | 48.5 | 92.8 | 116.2 |
| en | 560 x 800 | 112.5 | 45.1 | 68.5 | 112.8 | 136.2 |
| en | 580 x 800 | 132.5 | 65.1 | 88.5 | 132.8 | 156.2 |
| en | 599 x 800 | 151.5 | 84.1 | 107.5 | 151.8 | 175.2 |
| en | 600 x 800 | 152.5 | 85.1 | 108.5 | 152.8 | 176.2 |
| en | 620 x 800 | 172.5 | 105.1 | 128.5 | 172.8 | 196.2 |
| en | 640 x 800 | 192.5 | 125.1 | 148.5 | 192.8 | 216.2 |
| en | 700 x 800 | 252.5 | 185.1 | 208.5 | 252.8 | 276.2 |
| en | 767 x 800 | 319.5 | 252.1 | 275.5 | 319.8 | 343.2 |
| nl | 1280 x 640 | 819.4 | 752.1 | 775.5 | 842.8 | 866.2 |
| nl | 1366 x 768 | 905.4 | 838.1 | 861.5 | 928.8 | 952.2 |
| nl | 1920 x 1080 | 1459.4 | 1392.1 | 1415.5 | 1482.8 | 1506.2 |
| nl | 2560 x 1440 | 2099.4 | 2032.1 | 2055.5 | 2122.8 | 2146.2 |
| nl | 1280 x 800 | 819.4 | 752.1 | 775.5 | 842.8 | 866.2 |
| nl | 1024 x 768 | 563.4 | 496.1 | 519.5 | 586.8 | 610.2 |
| nl | 768 x 1024 | 307.4 | 240.1 | 263.5 | 330.8 | 354.2 |
| nl | 390 x 844 | 71 | 26.3 | 33 | 97.9 | 104.7 |
| nl | 360 x 640 | 47.6 | 2.9 | 9.7 | 74.5 | 81.3 |
| nl | 320 x 480 | 16.4 | 0 -- DOES NOT FIT: bar 348 in 320 | 0 -- DOES NOT FIT: bar 342 in 320 | 43.3 | 50.1 |
| nl | 479 x 800 | 140.4 | 95.7 | 102.5 | 167.4 | 174.1 |
| nl | 480 x 800 | 19.4 | 0 -- DOES NOT FIT: bar 528 in 480 | 0 -- DOES NOT FIT: bar 505 in 480 | 42.8 | 66.2 |
| nl | 500 x 800 | 39.4 | 0 -- DOES NOT FIT: bar 528 in 500 | 0 -- DOES NOT FIT: bar 505 in 500 | 62.8 | 86.2 |
| nl | 520 x 800 | 59.4 | 0 -- DOES NOT FIT: bar 528 in 520 | 15.5 | 82.8 | 106.2 |
| nl | 540 x 800 | 79.4 | 12.1 | 35.5 | 102.8 | 126.2 |
| nl | 560 x 800 | 99.4 | 32.1 | 55.5 | 122.8 | 146.2 |
| nl | 580 x 800 | 119.4 | 52.1 | 75.5 | 142.8 | 166.2 |
| nl | 599 x 800 | 138.4 | 71.1 | 94.5 | 161.8 | 185.2 |
| nl | 600 x 800 | 139.4 | 72.1 | 95.5 | 162.8 | 186.2 |
| nl | 620 x 800 | 159.4 | 92.1 | 115.5 | 182.8 | 206.2 |
| nl | 640 x 800 | 179.4 | 112.1 | 135.5 | 202.8 | 226.2 |
| nl | 700 x 800 | 239.4 | 172.1 | 195.5 | 262.8 | 286.2 |
| nl | 767 x 800 | 306.4 | 239.1 | 262.5 | 329.8 | 353.2 |

### The root Node page of ai-act-applicability-agrifood, its logo drawn as wide as its cap

| lang | viewport | room on dev | + "Editor", share look | + "Editor", share look, no current-language pill |
|---|---|---|---|---|
| en | 1280 x 640 | 656.5 | 587 | 656.7 |
| en | 1366 x 768 | 742.5 | 673 | 742.7 |
| en | 1920 x 1080 | 1296.5 | 1227 | 1296.7 |
| en | 2560 x 1440 | 1936.5 | 1867 | 1936.7 |
| en | 1280 x 800 | 656.5 | 587 | 656.7 |
| en | 1024 x 768 | 400.5 | 331 | 400.7 |
| en | 768 x 1024 | 144.5 | 75 | 144.7 |
| en | 390 x 844 | 75.6 | 29 | 81.3 |
| en | 360 x 640 | 52.2 | 5.6 | 58 |
| en | 320 x 480 | 21 | 0 -- DOES NOT FIT: bar 346 in 320 | 26.8 |
| en | 479 x 800 | 145 | 98.4 | 150.8 |
| en | 480 x 800 | 0 -- DOES NOT FIT: bar 552 in 480 | 0 -- DOES NOT FIT: bar 621 in 480 | 0 -- DOES NOT FIT: bar 551 in 480 |
| en | 500 x 800 | 0 -- DOES NOT FIT: bar 561 in 500 | 0 -- DOES NOT FIT: bar 630 in 500 | 0 -- DOES NOT FIT: bar 560 in 500 |
| en | 520 x 800 | 0 -- DOES NOT FIT: bar 570 in 520 | 0 -- DOES NOT FIT: bar 639 in 520 | 0 -- DOES NOT FIT: bar 569 in 520 |
| en | 540 x 800 | 0 -- DOES NOT FIT: bar 579 in 540 | 0 -- DOES NOT FIT: bar 648 in 540 | 0 -- DOES NOT FIT: bar 578 in 540 |
| en | 560 x 800 | 0 -- DOES NOT FIT: bar 588 in 560 | 0 -- DOES NOT FIT: bar 657 in 560 | 0 -- DOES NOT FIT: bar 587 in 560 |
| en | 580 x 800 | 0 -- DOES NOT FIT: bar 597 in 580 | 0 -- DOES NOT FIT: bar 666 in 580 | 0 -- DOES NOT FIT: bar 596 in 580 |
| en | 599 x 800 | 0 -- DOES NOT FIT: bar 605 in 599 | 0 -- DOES NOT FIT: bar 675 in 599 | 0 -- DOES NOT FIT: bar 605 in 599 |
| en | 600 x 800 | 0 -- DOES NOT FIT: bar 606 in 600 | 0 -- DOES NOT FIT: bar 675 in 600 | 0 -- DOES NOT FIT: bar 605 in 600 |
| en | 620 x 800 | 5.5 | 0 -- DOES NOT FIT: bar 684 in 620 | 5.7 |
| en | 640 x 800 | 16.5 | 0 -- DOES NOT FIT: bar 693 in 640 | 16.7 |
| en | 700 x 800 | 76.5 | 7 | 76.7 |
| en | 767 x 800 | 143.5 | 74 | 143.7 |
| nl | 1280 x 640 | 641.3 | 571.8 | 666.7 |
| nl | 1366 x 768 | 727.3 | 657.8 | 752.7 |
| nl | 1920 x 1080 | 1281.3 | 1211.8 | 1306.7 |
| nl | 2560 x 1440 | 1921.3 | 1851.8 | 1946.7 |
| nl | 1280 x 800 | 641.3 | 571.8 | 666.7 |
| nl | 1024 x 768 | 385.3 | 315.8 | 410.7 |
| nl | 768 x 1024 | 129.3 | 59.8 | 154.7 |
| nl | 390 x 844 | 61.7 | 15 | 90.5 |
| nl | 360 x 640 | 38.3 | 0 -- DOES NOT FIT: bar 368 in 360 | 67.1 |
| nl | 320 x 480 | 7.1 | 0 -- DOES NOT FIT: bar 360 in 320 | 35.9 |
| nl | 479 x 800 | 131.1 | 84.5 | 159.9 |
| nl | 480 x 800 | 0 -- DOES NOT FIT: bar 567 in 480 | 0 -- DOES NOT FIT: bar 636 in 480 | 0 -- DOES NOT FIT: bar 541 in 480 |
| nl | 500 x 800 | 0 -- DOES NOT FIT: bar 576 in 500 | 0 -- DOES NOT FIT: bar 645 in 500 | 0 -- DOES NOT FIT: bar 550 in 500 |
| nl | 520 x 800 | 0 -- DOES NOT FIT: bar 585 in 520 | 0 -- DOES NOT FIT: bar 654 in 520 | 0 -- DOES NOT FIT: bar 559 in 520 |
| nl | 540 x 800 | 0 -- DOES NOT FIT: bar 594 in 540 | 0 -- DOES NOT FIT: bar 663 in 540 | 0 -- DOES NOT FIT: bar 568 in 540 |
| nl | 560 x 800 | 0 -- DOES NOT FIT: bar 603 in 560 | 0 -- DOES NOT FIT: bar 672 in 560 | 0 -- DOES NOT FIT: bar 577 in 560 |
| nl | 580 x 800 | 0 -- DOES NOT FIT: bar 612 in 580 | 0 -- DOES NOT FIT: bar 681 in 580 | 0 -- DOES NOT FIT: bar 586 in 580 |
| nl | 599 x 800 | 0 -- DOES NOT FIT: bar 620 in 599 | 0 -- DOES NOT FIT: bar 690 in 599 | 4.1 |
| nl | 600 x 800 | 0 -- DOES NOT FIT: bar 621 in 600 | 0 -- DOES NOT FIT: bar 690 in 600 | 4.7 |
| nl | 620 x 800 | 0 -- DOES NOT FIT: bar 630 in 620 | 0 -- DOES NOT FIT: bar 699 in 620 | 15.7 |
| nl | 640 x 800 | 1.3 | 0 -- DOES NOT FIT: bar 708 in 640 | 26.7 |
| nl | 700 x 800 | 61.3 | 0 -- DOES NOT FIT: bar 708 in 700 | 86.7 |
| nl | 767 x 800 | 128.3 | 58.8 | 153.7 |

### The root Node page of ai-act-example, its logo drawn as wide as its cap

| lang | viewport | room on dev | + "Editor", share look | + "Editor", share look, no current-language pill |
|---|---|---|---|---|
| en | 1280 x 640 | 664.5 | 597.1 | 664.8 |
| en | 1366 x 768 | 750.5 | 683.1 | 750.8 |
| en | 1920 x 1080 | 1304.5 | 1237.1 | 1304.8 |
| en | 2560 x 1440 | 1944.5 | 1877.1 | 1944.8 |
| en | 1280 x 800 | 664.5 | 597.1 | 664.8 |
| en | 1024 x 768 | 408.5 | 341.1 | 408.8 |
| en | 768 x 1024 | 152.5 | 85.1 | 152.8 |
| en | 390 x 844 | 82.9 | 38.2 | 88.7 |
| en | 360 x 640 | 59.5 | 14.8 | 65.3 |
| en | 320 x 480 | 28.3 | 0 -- DOES NOT FIT: bar 336 in 320 | 34.1 |
| en | 479 x 800 | 152.4 | 107.7 | 158.2 |
| en | 480 x 800 | 0 -- DOES NOT FIT: bar 544 in 480 | 0 -- DOES NOT FIT: bar 611 in 480 | 0 -- DOES NOT FIT: bar 543 in 480 |
| en | 500 x 800 | 0 -- DOES NOT FIT: bar 553 in 500 | 0 -- DOES NOT FIT: bar 620 in 500 | 0 -- DOES NOT FIT: bar 552 in 500 |
| en | 520 x 800 | 0 -- DOES NOT FIT: bar 562 in 520 | 0 -- DOES NOT FIT: bar 629 in 520 | 0 -- DOES NOT FIT: bar 561 in 520 |
| en | 540 x 800 | 0 -- DOES NOT FIT: bar 571 in 540 | 0 -- DOES NOT FIT: bar 638 in 540 | 0 -- DOES NOT FIT: bar 570 in 540 |
| en | 560 x 800 | 0 -- DOES NOT FIT: bar 580 in 560 | 0 -- DOES NOT FIT: bar 647 in 560 | 0 -- DOES NOT FIT: bar 579 in 560 |
| en | 580 x 800 | 0 -- DOES NOT FIT: bar 589 in 580 | 0 -- DOES NOT FIT: bar 656 in 580 | 0 -- DOES NOT FIT: bar 588 in 580 |
| en | 599 x 800 | 1.9 | 0 -- DOES NOT FIT: bar 664 in 599 | 2.2 |
| en | 600 x 800 | 2.5 | 0 -- DOES NOT FIT: bar 665 in 600 | 2.8 |
| en | 620 x 800 | 13.5 | 0 -- DOES NOT FIT: bar 674 in 620 | 13.8 |
| en | 640 x 800 | 24.5 | 0 -- DOES NOT FIT: bar 683 in 640 | 24.8 |
| en | 700 x 800 | 84.5 | 17.1 | 84.8 |
| en | 767 x 800 | 151.5 | 84.1 | 151.8 |
| nl | 1280 x 640 | 651.4 | 584.1 | 674.8 |
| nl | 1366 x 768 | 737.4 | 670.1 | 760.8 |
| nl | 1920 x 1080 | 1291.4 | 1224.1 | 1314.8 |
| nl | 2560 x 1440 | 1931.4 | 1864.1 | 1954.8 |
| nl | 1280 x 800 | 651.4 | 584.1 | 674.8 |
| nl | 1024 x 768 | 395.4 | 328.1 | 418.8 |
| nl | 768 x 1024 | 139.4 | 72.1 | 162.8 |
| nl | 390 x 844 | 71 | 26.3 | 97.9 |
| nl | 360 x 640 | 47.6 | 2.9 | 74.5 |
| nl | 320 x 480 | 16.4 | 0 -- DOES NOT FIT: bar 348 in 320 | 43.3 |
| nl | 479 x 800 | 140.4 | 95.7 | 167.4 |
| nl | 480 x 800 | 0 -- DOES NOT FIT: bar 557 in 480 | 0 -- DOES NOT FIT: bar 624 in 480 | 0 -- DOES NOT FIT: bar 533 in 480 |
| nl | 500 x 800 | 0 -- DOES NOT FIT: bar 566 in 500 | 0 -- DOES NOT FIT: bar 633 in 500 | 0 -- DOES NOT FIT: bar 542 in 500 |
| nl | 520 x 800 | 0 -- DOES NOT FIT: bar 575 in 520 | 0 -- DOES NOT FIT: bar 642 in 520 | 0 -- DOES NOT FIT: bar 551 in 520 |
| nl | 540 x 800 | 0 -- DOES NOT FIT: bar 584 in 540 | 0 -- DOES NOT FIT: bar 651 in 540 | 0 -- DOES NOT FIT: bar 560 in 540 |
| nl | 560 x 800 | 0 -- DOES NOT FIT: bar 593 in 560 | 0 -- DOES NOT FIT: bar 660 in 560 | 0 -- DOES NOT FIT: bar 569 in 560 |
| nl | 580 x 800 | 0 -- DOES NOT FIT: bar 602 in 580 | 0 -- DOES NOT FIT: bar 669 in 580 | 1.8 |
| nl | 599 x 800 | 0 -- DOES NOT FIT: bar 610 in 599 | 0 -- DOES NOT FIT: bar 677 in 599 | 12.3 |
| nl | 600 x 800 | 0 -- DOES NOT FIT: bar 611 in 600 | 0 -- DOES NOT FIT: bar 678 in 600 | 12.8 |
| nl | 620 x 800 | 0.4 | 0 -- DOES NOT FIT: bar 687 in 620 | 23.8 |
| nl | 640 x 800 | 11.4 | 0 -- DOES NOT FIT: bar 696 in 640 | 34.8 |
| nl | 700 x 800 | 71.4 | 4.1 | 94.8 |
| nl | 767 x 800 | 138.4 | 71.1 | 161.8 |

### The overview, /

| lang | viewport | room on dev | + "Editor", share look | + "Editor", account-link look |
|---|---|---|---|---|
| en | 1280 x 640 | 964.2 | 896.9 | 920.3 |
| en | 1366 x 768 | 1050.2 | 982.9 | 1006.3 |
| en | 1920 x 1080 | 1604.2 | 1536.9 | 1560.3 |
| en | 2560 x 1440 | 2244.2 | 2176.9 | 2200.3 |
| en | 1280 x 800 | 964.2 | 896.9 | 920.3 |
| en | 1024 x 768 | 708.2 | 640.9 | 664.3 |
| en | 768 x 1024 | 452.2 | 384.9 | 408.3 |
| en | 390 x 844 | 151.8 | 107.1 | 113.9 |
| en | 360 x 640 | 121.8 | 77.1 | 83.9 |
| en | 320 x 480 | 81.8 | 37.1 | 43.9 |
| en | 479 x 800 | 240.8 | 196.1 | 202.9 |
| en | 480 x 800 | 164.2 | 96.9 | 120.3 |
| en | 500 x 800 | 184.2 | 116.9 | 140.3 |
| en | 520 x 800 | 204.2 | 136.9 | 160.3 |
| en | 540 x 800 | 224.2 | 156.9 | 180.3 |
| en | 560 x 800 | 244.2 | 176.9 | 200.3 |
| en | 580 x 800 | 264.2 | 196.9 | 220.3 |
| en | 599 x 800 | 283.2 | 215.9 | 239.3 |
| en | 600 x 800 | 284.2 | 216.9 | 240.3 |
| en | 620 x 800 | 304.2 | 236.9 | 260.3 |
| en | 640 x 800 | 324.2 | 256.9 | 280.3 |
| en | 700 x 800 | 384.2 | 316.9 | 340.3 |
| en | 767 x 800 | 451.2 | 383.9 | 407.3 |
| nl | 1280 x 640 | 969.2 | 901.9 | 925.3 |
| nl | 1366 x 768 | 1055.2 | 987.9 | 1011.3 |
| nl | 1920 x 1080 | 1609.2 | 1541.9 | 1565.3 |
| nl | 2560 x 1440 | 2249.2 | 2181.9 | 2205.3 |
| nl | 1280 x 800 | 969.2 | 901.9 | 925.3 |
| nl | 1024 x 768 | 713.2 | 645.9 | 669.3 |
| nl | 768 x 1024 | 457.2 | 389.9 | 413.3 |
| nl | 390 x 844 | 156 | 111.3 | 118.1 |
| nl | 360 x 640 | 126 | 81.3 | 88.1 |
| nl | 320 x 480 | 86 | 41.3 | 48.1 |
| nl | 479 x 800 | 245 | 200.3 | 207.1 |
| nl | 480 x 800 | 169.2 | 101.9 | 125.3 |
| nl | 500 x 800 | 189.2 | 121.9 | 145.3 |
| nl | 520 x 800 | 209.2 | 141.9 | 165.3 |
| nl | 540 x 800 | 229.2 | 161.9 | 185.3 |
| nl | 560 x 800 | 249.2 | 181.9 | 205.3 |
| nl | 580 x 800 | 269.2 | 201.9 | 225.3 |
| nl | 599 x 800 | 288.2 | 220.9 | 244.3 |
| nl | 600 x 800 | 289.2 | 221.9 | 245.3 |
| nl | 620 x 800 | 309.2 | 241.9 | 265.3 |
| nl | 640 x 800 | 329.2 | 261.9 | 285.3 |
| nl | 700 x 800 | 389.2 | 321.9 | 345.3 |
| nl | 767 x 800 | 456.2 | 388.9 | 412.3 |

### The login page at /admin

| lang | viewport | room on dev | + "Website", account-link look | + "Website", share look | + "Website", account-link look, no site title, no current-language pill | + "Website", share look, no site title, no current-language pill |
|---|---|---|---|---|---|---|
| en | 1280 x 640 | 964.2 | 908.2 | 885.8 | 1105.3 | 1082.8 |
| en | 1366 x 768 | 1050.2 | 994.2 | 971.8 | 1191.3 | 1168.8 |
| en | 1920 x 1080 | 1604.2 | 1548.2 | 1525.8 | 1745.3 | 1722.8 |
| en | 2560 x 1440 | 2244.2 | 2188.2 | 2165.8 | 2385.3 | 2362.8 |
| en | 1280 x 800 | 964.2 | 908.2 | 885.8 | 1105.3 | 1082.8 |
| en | 1024 x 768 | 708.2 | 652.2 | 629.8 | 849.3 | 826.8 |
| en | 768 x 1024 | 452.2 | 396.2 | 373.8 | 593.3 | 570.8 |
| en | 390 x 844 | 302.3 | 252.4 | 247.4 | 256.4 | 251.4 |
| en | 360 x 640 | 272.3 | 222.4 | 217.4 | 226.4 | 221.4 |
| en | 320 x 480 | 232.3 | 182.4 | 177.4 | 186.4 | 181.4 |
| en | 479 x 800 | 391.3 | 341.4 | 336.4 | 345.4 | 340.4 |
| en | 480 x 800 | 164.2 | 108.2 | 85.8 | 305.3 | 282.8 |
| en | 500 x 800 | 184.2 | 128.2 | 105.8 | 325.3 | 302.8 |
| en | 520 x 800 | 204.2 | 148.2 | 125.8 | 345.3 | 322.8 |
| en | 540 x 800 | 224.2 | 168.2 | 145.8 | 365.3 | 342.8 |
| en | 560 x 800 | 244.2 | 188.2 | 165.8 | 385.3 | 362.8 |
| en | 580 x 800 | 264.2 | 208.2 | 185.8 | 405.3 | 382.8 |
| en | 599 x 800 | 283.2 | 227.2 | 204.8 | 424.3 | 401.8 |
| en | 600 x 800 | 284.2 | 228.2 | 205.8 | 425.3 | 402.8 |
| en | 620 x 800 | 304.2 | 248.2 | 225.8 | 445.3 | 422.8 |
| en | 640 x 800 | 324.2 | 268.2 | 245.8 | 465.3 | 442.8 |
| en | 700 x 800 | 384.2 | 328.2 | 305.8 | 525.3 | 502.8 |
| en | 767 x 800 | 451.2 | 395.2 | 372.8 | 592.3 | 569.8 |
| nl | 1280 x 640 | 969.2 | 913.2 | 890.8 | 1128.4 | 1106 |
| nl | 1366 x 768 | 1055.2 | 999.2 | 976.8 | 1214.4 | 1192 |
| nl | 1920 x 1080 | 1609.2 | 1553.2 | 1530.8 | 1768.4 | 1746 |
| nl | 2560 x 1440 | 2249.2 | 2193.2 | 2170.8 | 2408.4 | 2386 |
| nl | 1280 x 800 | 969.2 | 913.2 | 890.8 | 1128.4 | 1106 |
| nl | 1024 x 768 | 713.2 | 657.2 | 634.8 | 872.4 | 850 |
| nl | 768 x 1024 | 457.2 | 401.2 | 378.8 | 616.4 | 594 |
| nl | 390 x 844 | 323.5 | 273.5 | 268.6 | 277.5 | 272.6 |
| nl | 360 x 640 | 293.5 | 243.5 | 238.6 | 247.5 | 242.6 |
| nl | 320 x 480 | 253.5 | 203.5 | 198.6 | 207.5 | 202.6 |
| nl | 479 x 800 | 412.5 | 362.5 | 357.6 | 366.5 | 361.6 |
| nl | 480 x 800 | 169.2 | 113.2 | 90.8 | 328.4 | 306 |
| nl | 500 x 800 | 189.2 | 133.2 | 110.8 | 348.4 | 326 |
| nl | 520 x 800 | 209.2 | 153.2 | 130.8 | 368.4 | 346 |
| nl | 540 x 800 | 229.2 | 173.2 | 150.8 | 388.4 | 366 |
| nl | 560 x 800 | 249.2 | 193.2 | 170.8 | 408.4 | 386 |
| nl | 580 x 800 | 269.2 | 213.2 | 190.8 | 428.4 | 406 |
| nl | 599 x 800 | 288.2 | 232.2 | 209.8 | 447.4 | 425 |
| nl | 600 x 800 | 289.2 | 233.2 | 210.8 | 448.4 | 426 |
| nl | 620 x 800 | 309.2 | 253.2 | 230.8 | 468.4 | 446 |
| nl | 640 x 800 | 329.2 | 273.2 | 250.8 | 488.4 | 466 |
| nl | 700 x 800 | 389.2 | 333.2 | 310.8 | 548.4 | 526 |
| nl | 767 x 800 | 456.2 | 400.2 | 377.8 | 615.4 | 593 |

### The creators' overview at /admin, as the administrator (four controls: the switch, Account, Accounts, Log out)

| lang | viewport | room on dev | + "Website", account-link look | + "Website", share look | + "Website", account-link look, no site title, no current-language pill | + "Website", share look, no site title, no current-language pill |
|---|---|---|---|---|---|---|
| en | 1280 x 640 | 790 | 734.1 | 711.6 | 931.2 | 908.7 |
| en | 1366 x 768 | 876 | 820.1 | 797.6 | 1017.2 | 994.7 |
| en | 1920 x 1080 | 1430 | 1374.1 | 1351.6 | 1571.2 | 1548.7 |
| en | 2560 x 1440 | 2070 | 2014.1 | 1991.6 | 2211.2 | 2188.7 |
| en | 1280 x 800 | 790 | 734.1 | 711.6 | 931.2 | 908.7 |
| en | 1024 x 768 | 534 | 478.1 | 455.6 | 675.2 | 652.7 |
| en | 768 x 1024 | 278 | 222.1 | 199.6 | 419.2 | 396.7 |
| en | 390 x 844 | 138.2 | 88.2 | 83.3 | 92.2 | 87.3 |
| en | 360 x 640 | 108.2 | 58.2 | 53.3 | 62.2 | 57.3 |
| en | 320 x 480 | 68.2 | 18.2 | 13.3 | 22.2 | 17.3 |
| en | 479 x 800 | 227.2 | 177.2 | 172.3 | 181.2 | 176.3 |
| en | 480 x 800 | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 0 -- DOES NOT FIT: bar 481 in 480 | 0 -- DOES NOT FIT: bar 504 in 480 | 131.2 | 108.7 |
| en | 500 x 800 | 10 | 0 -- WRAPS: "ELSA decision trees" on 3 lines | 0 -- DOES NOT FIT: bar 504 in 500 | 151.2 | 128.7 |
| en | 520 x 800 | 30 | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 0 -- WRAPS: "ELSA decision trees" on 3 lines | 171.2 | 148.7 |
| en | 540 x 800 | 50 | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 191.2 | 168.7 |
| en | 560 x 800 | 70 | 14.1 | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 211.2 | 188.7 |
| en | 580 x 800 | 90 | 34.1 | 11.6 | 231.2 | 208.7 |
| en | 599 x 800 | 109 | 53.1 | 30.6 | 250.2 | 227.7 |
| en | 600 x 800 | 110 | 54.1 | 31.6 | 251.2 | 228.7 |
| en | 620 x 800 | 130 | 74.1 | 51.6 | 271.2 | 248.7 |
| en | 640 x 800 | 150 | 94.1 | 71.6 | 291.2 | 268.7 |
| en | 700 x 800 | 210 | 154.1 | 131.6 | 351.2 | 328.7 |
| en | 767 x 800 | 277 | 221.1 | 198.6 | 418.2 | 395.7 |
| nl | 1280 x 640 | 782.7 | 726.7 | 704.2 | 941.9 | 919.4 |
| nl | 1366 x 768 | 868.7 | 812.7 | 790.2 | 1027.9 | 1005.4 |
| nl | 1920 x 1080 | 1422.7 | 1366.7 | 1344.2 | 1581.9 | 1559.4 |
| nl | 2560 x 1440 | 2062.7 | 2006.7 | 1984.2 | 2221.9 | 2199.4 |
| nl | 1280 x 800 | 782.7 | 726.7 | 704.2 | 941.9 | 919.4 |
| nl | 1024 x 768 | 526.7 | 470.7 | 448.2 | 685.9 | 663.4 |
| nl | 768 x 1024 | 270.7 | 214.7 | 192.2 | 429.9 | 407.4 |
| nl | 390 x 844 | 147 | 97 | 92.1 | 101 | 96.1 |
| nl | 360 x 640 | 117 | 67 | 62.1 | 71 | 66.1 |
| nl | 320 x 480 | 77 | 27 | 22.1 | 31 | 26.1 |
| nl | 479 x 800 | 236 | 186 | 181.1 | 190 | 185.1 |
| nl | 480 x 800 | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 0 -- DOES NOT FIT: bar 519 in 480 | 0 -- DOES NOT FIT: bar 542 in 480 | 141.9 | 119.4 |
| nl | 500 x 800 | 2.7 | 0 -- DOES NOT FIT: bar 519 in 500 | 0 -- DOES NOT FIT: bar 542 in 500 | 161.9 | 139.4 |
| nl | 520 x 800 | 22.7 | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 0 -- DOES NOT FIT: bar 542 in 520 | 181.9 | 159.4 |
| nl | 540 x 800 | 42.7 | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 0 -- DOES NOT FIT: bar 542 in 540 | 201.9 | 179.4 |
| nl | 560 x 800 | 62.7 | 6.7 | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 221.9 | 199.4 |
| nl | 580 x 800 | 82.7 | 26.7 | 4.2 | 241.9 | 219.4 |
| nl | 599 x 800 | 101.7 | 45.7 | 23.2 | 260.9 | 238.4 |
| nl | 600 x 800 | 102.7 | 46.7 | 24.2 | 261.9 | 239.4 |
| nl | 620 x 800 | 122.7 | 66.7 | 44.2 | 281.9 | 259.4 |
| nl | 640 x 800 | 142.7 | 86.7 | 64.2 | 301.9 | 279.4 |
| nl | 700 x 800 | 202.7 | 146.7 | 124.2 | 361.9 | 339.4 |
| nl | 767 x 800 | 269.7 | 213.7 | 191.2 | 428.9 | 406.4 |

### The language switch and the logo on the root Node pages, and the controls at /admin below 480, as on dev

- 320 x 480, ai-act-applicability-agrifood, en: "English" (the current language) 48.4, "Nederlands" 71.5; the share button 58.7; the logo 58.4 (its file 479 x 120; its cap 58.4); the pills' face: "Open Sans", drawn in Open Sans
- 320 x 480, ai-act-applicability-agrifood, nl: "English" 48.4, "Nederlands" (the current language) 71.5; the share button 72.7; the logo 58.4 (its file 479 x 120; its cap 58.4); the pills' face: "Open Sans", drawn in Open Sans
- 320 x 480, ai-act-example, en: "English" (the current language) 46.5, "Nederlands" 67.7; the share button 57.1; the logo 58.4 (its file 240 x 60; its cap 58.4); the pills' face: -apple-system, drawn in Segoe UI
- 320 x 480, ai-act-example, nl: "English" 46.5, "Nederlands" (the current language) 67.7; the share button 69.1; the logo 58.4 (its file 240 x 60; its cap 58.4); the pills' face: -apple-system, drawn in Segoe UI
- 480 x 800, ai-act-applicability-agrifood, en: "English" (the current language) 65.7, "Nederlands" 90.9; the share button 77; the logo 119.8 (its file 479 x 120; its cap 216); the pills' face: "Open Sans", drawn in Open Sans
- 480 x 800, ai-act-applicability-agrifood, nl: "English" 65.7, "Nederlands" (the current language) 90.9; the share button 92.2; the logo 119.8 (its file 479 x 120; its cap 216); the pills' face: "Open Sans", drawn in Open Sans
- 480 x 800, ai-act-example, en: "English" (the current language) 63.6, "Nederlands" 86.7; the share button 75.2; the logo 120 (its file 240 x 60; its cap 216); the pills' face: -apple-system, drawn in Segoe UI
- 480 x 800, ai-act-example, nl: "English" 63.6, "Nederlands" (the current language) 86.7; the share button 88.3; the logo 120 (its file 240 x 60; its cap 216); the pills' face: -apple-system, drawn in Segoe UI
- 320 x 480, /admin, the login page, en: the bar from 0 to 320, its controls from 8 to 79.7
- 320 x 480, /admin, the login page, nl: the bar from 0 to 320, its controls from 8 to 58.5
- 320 x 480, /admin, the administrator's creators' overview, en: the bar from 0 to 320, its controls from 8 to 243.8
- 320 x 480, /admin, the administrator's creators' overview, nl: the bar from 0 to 320, its controls from 8 to 235

## 4. The output in the CI runner's faces, as it ran on `748ebcc`

The same script in the `mcr.microsoft.com/playwright:v1.62.1-noble` image, against the server of
section 3, which listened on every interface (`HOSTNAME=0.0.0.0`) so that the image reached it at
`http://host.docker.internal:<port>`.

### The root Node page of ai-act-applicability-agrifood

| lang | viewport | room on dev | + "Editor", share look | + "Editor", account-link look | + "Editor", share look, no current-language pill | + "Editor", account-link look, no current-language pill |
|---|---|---|---|---|---|---|
| en | 1280 x 640 | 825.3 | 756.3 | 779.3 | 826.3 | 849.3 |
| en | 1366 x 768 | 911.3 | 842.3 | 865.3 | 912.3 | 935.3 |
| en | 1920 x 1080 | 1465.3 | 1396.3 | 1419.3 | 1466.3 | 1489.3 |
| en | 2560 x 1440 | 2105.3 | 2036.3 | 2059.3 | 2106.3 | 2129.3 |
| en | 1280 x 800 | 825.3 | 756.3 | 779.3 | 826.3 | 849.3 |
| en | 1024 x 768 | 569.3 | 500.3 | 523.3 | 570.3 | 593.3 |
| en | 768 x 1024 | 313.3 | 244.3 | 267.3 | 314.3 | 337.3 |
| en | 390 x 844 | 72.2 | 24.2 | 32.2 | 77.2 | 85.2 |
| en | 360 x 640 | 48.8 | 0.8 | 8.8 | 53.8 | 61.8 |
| en | 320 x 480 | 17.6 | 0 -- DOES NOT FIT: bar 350 in 320 | 0 -- DOES NOT FIT: bar 342 in 320 | 22.6 | 30.6 |
| en | 479 x 800 | 141.6 | 93.6 | 101.6 | 146.6 | 154.6 |
| en | 480 x 800 | 25.3 | 0 -- DOES NOT FIT: bar 524 in 480 | 0 -- DOES NOT FIT: bar 501 in 480 | 26.3 | 49.3 |
| en | 500 x 800 | 45.3 | 0 -- DOES NOT FIT: bar 524 in 500 | 0 -- DOES NOT FIT: bar 501 in 500 | 46.3 | 69.3 |
| en | 520 x 800 | 65.3 | 0 -- DOES NOT FIT: bar 524 in 520 | 19.3 | 66.3 | 89.3 |
| en | 540 x 800 | 85.3 | 16.3 | 39.3 | 86.3 | 109.3 |
| en | 560 x 800 | 105.3 | 36.3 | 59.3 | 106.3 | 129.3 |
| en | 580 x 800 | 125.3 | 56.3 | 79.3 | 126.3 | 149.3 |
| en | 599 x 800 | 144.3 | 75.3 | 98.3 | 145.3 | 168.3 |
| en | 600 x 800 | 145.3 | 76.3 | 99.3 | 146.3 | 169.3 |
| en | 620 x 800 | 165.3 | 96.3 | 119.3 | 166.3 | 189.3 |
| en | 640 x 800 | 185.3 | 116.3 | 139.3 | 186.3 | 209.3 |
| en | 700 x 800 | 245.3 | 176.3 | 199.3 | 246.3 | 269.3 |
| en | 767 x 800 | 312.3 | 243.3 | 266.3 | 313.3 | 336.3 |
| nl | 1280 x 640 | 810.3 | 741.3 | 764.3 | 836.3 | 859.3 |
| nl | 1366 x 768 | 896.3 | 827.3 | 850.3 | 922.3 | 945.3 |
| nl | 1920 x 1080 | 1450.3 | 1381.3 | 1404.3 | 1476.3 | 1499.3 |
| nl | 2560 x 1440 | 2090.3 | 2021.3 | 2044.3 | 2116.3 | 2139.3 |
| nl | 1280 x 800 | 810.3 | 741.3 | 764.3 | 836.3 | 859.3 |
| nl | 1024 x 768 | 554.3 | 485.3 | 508.3 | 580.3 | 603.3 |
| nl | 768 x 1024 | 298.3 | 229.3 | 252.3 | 324.3 | 347.3 |
| nl | 390 x 844 | 58.2 | 10.2 | 18.2 | 86.2 | 94.2 |
| nl | 360 x 640 | 34.8 | 0 -- DOES NOT FIT: bar 373 in 360 | 0 -- DOES NOT FIT: bar 365 in 360 | 62.8 | 70.8 |
| nl | 320 x 480 | 3.6 | 0 -- DOES NOT FIT: bar 364 in 320 | 0 -- DOES NOT FIT: bar 356 in 320 | 31.6 | 39.6 |
| nl | 479 x 800 | 127.6 | 79.6 | 87.6 | 155.6 | 163.6 |
| nl | 480 x 800 | 10.3 | 0 -- DOES NOT FIT: bar 539 in 480 | 0 -- DOES NOT FIT: bar 516 in 480 | 36.3 | 59.3 |
| nl | 500 x 800 | 30.3 | 0 -- DOES NOT FIT: bar 539 in 500 | 0 -- DOES NOT FIT: bar 516 in 500 | 56.3 | 79.3 |
| nl | 520 x 800 | 50.3 | 0 -- DOES NOT FIT: bar 539 in 520 | 4.3 | 76.3 | 99.3 |
| nl | 540 x 800 | 70.3 | 1.3 | 24.3 | 96.3 | 119.3 |
| nl | 560 x 800 | 90.3 | 21.3 | 44.3 | 116.3 | 139.3 |
| nl | 580 x 800 | 110.3 | 41.3 | 64.3 | 136.3 | 159.3 |
| nl | 599 x 800 | 129.3 | 60.3 | 83.3 | 155.3 | 178.3 |
| nl | 600 x 800 | 130.3 | 61.3 | 84.3 | 156.3 | 179.3 |
| nl | 620 x 800 | 150.3 | 81.3 | 104.3 | 176.3 | 199.3 |
| nl | 640 x 800 | 170.3 | 101.3 | 124.3 | 196.3 | 219.3 |
| nl | 700 x 800 | 230.3 | 161.3 | 184.3 | 256.3 | 279.3 |
| nl | 767 x 800 | 297.3 | 228.3 | 251.3 | 323.3 | 346.3 |

### The root Node page of ai-act-example

| lang | viewport | room on dev | + "Editor", share look | + "Editor", account-link look | + "Editor", share look, no current-language pill | + "Editor", account-link look, no current-language pill |
|---|---|---|---|---|---|---|
| en | 1280 x 640 | 829.9 | 762.5 | 785.9 | 831.9 | 855.3 |
| en | 1366 x 768 | 915.9 | 848.5 | 871.9 | 917.9 | 941.3 |
| en | 1920 x 1080 | 1469.9 | 1402.5 | 1425.9 | 1471.9 | 1495.3 |
| en | 2560 x 1440 | 2109.9 | 2042.5 | 2065.9 | 2111.9 | 2135.3 |
| en | 1280 x 800 | 829.9 | 762.5 | 785.9 | 831.9 | 855.3 |
| en | 1024 x 768 | 573.9 | 506.5 | 529.9 | 575.9 | 599.3 |
| en | 768 x 1024 | 317.9 | 250.5 | 273.9 | 319.9 | 343.3 |
| en | 390 x 844 | 80.6 | 35.9 | 42.6 | 87.9 | 94.7 |
| en | 360 x 640 | 57.2 | 12.5 | 19.3 | 64.5 | 71.3 |
| en | 320 x 480 | 26 | 0 -- DOES NOT FIT: bar 339 in 320 | 0 -- DOES NOT FIT: bar 332 in 320 | 33.3 | 40.1 |
| en | 479 x 800 | 150 | 105.3 | 112.1 | 157.4 | 164.1 |
| en | 480 x 800 | 29.9 | 0 -- DOES NOT FIT: bar 517 in 480 | 0 -- DOES NOT FIT: bar 494 in 480 | 31.9 | 55.3 |
| en | 500 x 800 | 49.9 | 0 -- DOES NOT FIT: bar 517 in 500 | 5.9 | 51.9 | 75.3 |
| en | 520 x 800 | 69.9 | 2.5 | 25.9 | 71.9 | 95.3 |
| en | 540 x 800 | 89.9 | 22.5 | 45.9 | 91.9 | 115.3 |
| en | 560 x 800 | 109.9 | 42.5 | 65.9 | 111.9 | 135.3 |
| en | 580 x 800 | 129.9 | 62.5 | 85.9 | 131.9 | 155.3 |
| en | 599 x 800 | 148.9 | 81.5 | 104.9 | 150.9 | 174.3 |
| en | 600 x 800 | 149.9 | 82.5 | 105.9 | 151.9 | 175.3 |
| en | 620 x 800 | 169.9 | 102.5 | 125.9 | 171.9 | 195.3 |
| en | 640 x 800 | 189.9 | 122.5 | 145.9 | 191.9 | 215.3 |
| en | 700 x 800 | 249.9 | 182.5 | 205.9 | 251.9 | 275.3 |
| en | 767 x 800 | 316.9 | 249.5 | 272.9 | 318.9 | 342.3 |
| nl | 1280 x 640 | 816.6 | 749.2 | 772.6 | 840.6 | 864 |
| nl | 1366 x 768 | 902.6 | 835.2 | 858.6 | 926.6 | 950 |
| nl | 1920 x 1080 | 1456.6 | 1389.2 | 1412.6 | 1480.6 | 1504 |
| nl | 2560 x 1440 | 2096.6 | 2029.2 | 2052.6 | 2120.6 | 2144 |
| nl | 1280 x 800 | 816.6 | 749.2 | 772.6 | 840.6 | 864 |
| nl | 1024 x 768 | 560.6 | 493.2 | 516.6 | 584.6 | 608 |
| nl | 768 x 1024 | 304.6 | 237.2 | 260.6 | 328.6 | 352 |
| nl | 390 x 844 | 68.4 | 23.6 | 30.4 | 95.9 | 102.7 |
| nl | 360 x 640 | 45 | 0.2 | 7 | 72.5 | 79.3 |
| nl | 320 x 480 | 13.8 | 0 -- DOES NOT FIT: bar 351 in 320 | 0 -- DOES NOT FIT: bar 344 in 320 | 41.3 | 48.1 |
| nl | 479 x 800 | 137.8 | 93 | 99.8 | 165.3 | 172.1 |
| nl | 480 x 800 | 16.6 | 0 -- DOES NOT FIT: bar 531 in 480 | 0 -- DOES NOT FIT: bar 507 in 480 | 40.6 | 64 |
| nl | 500 x 800 | 36.6 | 0 -- DOES NOT FIT: bar 531 in 500 | 0 -- DOES NOT FIT: bar 507 in 500 | 60.6 | 84 |
| nl | 520 x 800 | 56.6 | 0 -- DOES NOT FIT: bar 531 in 520 | 12.6 | 80.6 | 104 |
| nl | 540 x 800 | 76.6 | 9.2 | 32.6 | 100.6 | 124 |
| nl | 560 x 800 | 96.6 | 29.2 | 52.6 | 120.6 | 144 |
| nl | 580 x 800 | 116.6 | 49.2 | 72.6 | 140.6 | 164 |
| nl | 599 x 800 | 135.6 | 68.2 | 91.6 | 159.6 | 183 |
| nl | 600 x 800 | 136.6 | 69.2 | 92.6 | 160.6 | 184 |
| nl | 620 x 800 | 156.6 | 89.2 | 112.6 | 180.6 | 204 |
| nl | 640 x 800 | 176.6 | 109.2 | 132.6 | 200.6 | 224 |
| nl | 700 x 800 | 236.6 | 169.2 | 192.6 | 260.6 | 284 |
| nl | 767 x 800 | 303.6 | 236.2 | 259.6 | 327.6 | 351 |

### The root Node page of ai-act-applicability-agrifood, its logo drawn as wide as its cap

| lang | viewport | room on dev | + "Editor", share look | + "Editor", share look, no current-language pill |
|---|---|---|---|---|
| en | 1280 x 640 | 657 | 588 | 658 |
| en | 1366 x 768 | 743 | 674 | 744 |
| en | 1920 x 1080 | 1297 | 1228 | 1298 |
| en | 2560 x 1440 | 1937 | 1868 | 1938 |
| en | 1280 x 800 | 657 | 588 | 658 |
| en | 1024 x 768 | 401 | 332 | 402 |
| en | 768 x 1024 | 145 | 76 | 146 |
| en | 390 x 844 | 72.2 | 24.2 | 77.2 |
| en | 360 x 640 | 48.8 | 0.8 | 53.8 |
| en | 320 x 480 | 17.6 | 0 -- DOES NOT FIT: bar 350 in 320 | 22.6 |
| en | 479 x 800 | 141.6 | 93.6 | 146.6 |
| en | 480 x 800 | 0 -- DOES NOT FIT: bar 551 in 480 | 0 -- DOES NOT FIT: bar 620 in 480 | 0 -- DOES NOT FIT: bar 550 in 480 |
| en | 500 x 800 | 0 -- DOES NOT FIT: bar 560 in 500 | 0 -- DOES NOT FIT: bar 629 in 500 | 0 -- DOES NOT FIT: bar 559 in 500 |
| en | 520 x 800 | 0 -- DOES NOT FIT: bar 569 in 520 | 0 -- DOES NOT FIT: bar 638 in 520 | 0 -- DOES NOT FIT: bar 568 in 520 |
| en | 540 x 800 | 0 -- DOES NOT FIT: bar 578 in 540 | 0 -- DOES NOT FIT: bar 647 in 540 | 0 -- DOES NOT FIT: bar 577 in 540 |
| en | 560 x 800 | 0 -- DOES NOT FIT: bar 587 in 560 | 0 -- DOES NOT FIT: bar 656 in 560 | 0 -- DOES NOT FIT: bar 586 in 560 |
| en | 580 x 800 | 0 -- DOES NOT FIT: bar 596 in 580 | 0 -- DOES NOT FIT: bar 665 in 580 | 0 -- DOES NOT FIT: bar 595 in 580 |
| en | 599 x 800 | 0 -- DOES NOT FIT: bar 605 in 599 | 0 -- DOES NOT FIT: bar 674 in 599 | 0 -- DOES NOT FIT: bar 604 in 599 |
| en | 600 x 800 | 0 -- DOES NOT FIT: bar 605 in 600 | 0 -- DOES NOT FIT: bar 674 in 600 | 0 -- DOES NOT FIT: bar 604 in 600 |
| en | 620 x 800 | 6 | 0 -- DOES NOT FIT: bar 683 in 620 | 7 |
| en | 640 x 800 | 17 | 0 -- DOES NOT FIT: bar 692 in 640 | 18 |
| en | 700 x 800 | 77 | 8 | 78 |
| en | 767 x 800 | 144 | 75 | 145 |
| nl | 1280 x 640 | 642 | 573 | 668 |
| nl | 1366 x 768 | 728 | 659 | 754 |
| nl | 1920 x 1080 | 1282 | 1213 | 1308 |
| nl | 2560 x 1440 | 1922 | 1853 | 1948 |
| nl | 1280 x 800 | 642 | 573 | 668 |
| nl | 1024 x 768 | 386 | 317 | 412 |
| nl | 768 x 1024 | 130 | 61 | 156 |
| nl | 390 x 844 | 58.2 | 10.2 | 86.2 |
| nl | 360 x 640 | 34.8 | 0 -- DOES NOT FIT: bar 373 in 360 | 62.8 |
| nl | 320 x 480 | 3.6 | 0 -- DOES NOT FIT: bar 364 in 320 | 31.6 |
| nl | 479 x 800 | 127.6 | 79.6 | 155.6 |
| nl | 480 x 800 | 0 -- DOES NOT FIT: bar 566 in 480 | 0 -- DOES NOT FIT: bar 635 in 480 | 0 -- DOES NOT FIT: bar 540 in 480 |
| nl | 500 x 800 | 0 -- DOES NOT FIT: bar 575 in 500 | 0 -- DOES NOT FIT: bar 644 in 500 | 0 -- DOES NOT FIT: bar 549 in 500 |
| nl | 520 x 800 | 0 -- DOES NOT FIT: bar 584 in 520 | 0 -- DOES NOT FIT: bar 653 in 520 | 0 -- DOES NOT FIT: bar 558 in 520 |
| nl | 540 x 800 | 0 -- DOES NOT FIT: bar 593 in 540 | 0 -- DOES NOT FIT: bar 662 in 540 | 0 -- DOES NOT FIT: bar 567 in 540 |
| nl | 560 x 800 | 0 -- DOES NOT FIT: bar 602 in 560 | 0 -- DOES NOT FIT: bar 671 in 560 | 0 -- DOES NOT FIT: bar 576 in 560 |
| nl | 580 x 800 | 0 -- DOES NOT FIT: bar 611 in 580 | 0 -- DOES NOT FIT: bar 680 in 580 | 0 -- DOES NOT FIT: bar 585 in 580 |
| nl | 599 x 800 | 0 -- DOES NOT FIT: bar 620 in 599 | 0 -- DOES NOT FIT: bar 689 in 599 | 5.5 |
| nl | 600 x 800 | 0 -- DOES NOT FIT: bar 620 in 600 | 0 -- DOES NOT FIT: bar 689 in 600 | 6 |
| nl | 620 x 800 | 0 -- DOES NOT FIT: bar 629 in 620 | 0 -- DOES NOT FIT: bar 698 in 620 | 17 |
| nl | 640 x 800 | 2 | 0 -- DOES NOT FIT: bar 707 in 640 | 28 |
| nl | 700 x 800 | 62 | 0 -- DOES NOT FIT: bar 707 in 700 | 88 |
| nl | 767 x 800 | 129 | 60 | 155 |

### The root Node page of ai-act-example, its logo drawn as wide as its cap

| lang | viewport | room on dev | + "Editor", share look | + "Editor", share look, no current-language pill |
|---|---|---|---|---|
| en | 1280 x 640 | 661.9 | 594.5 | 663.9 |
| en | 1366 x 768 | 747.9 | 680.5 | 749.9 |
| en | 1920 x 1080 | 1301.9 | 1234.5 | 1303.9 |
| en | 2560 x 1440 | 1941.9 | 1874.5 | 1943.9 |
| en | 1280 x 800 | 661.9 | 594.5 | 663.9 |
| en | 1024 x 768 | 405.9 | 338.5 | 407.9 |
| en | 768 x 1024 | 149.9 | 82.5 | 151.9 |
| en | 390 x 844 | 80.6 | 35.9 | 87.9 |
| en | 360 x 640 | 57.2 | 12.5 | 64.5 |
| en | 320 x 480 | 26 | 0 -- DOES NOT FIT: bar 339 in 320 | 33.3 |
| en | 479 x 800 | 150 | 105.3 | 157.4 |
| en | 480 x 800 | 0 -- DOES NOT FIT: bar 546 in 480 | 0 -- DOES NOT FIT: bar 613 in 480 | 0 -- DOES NOT FIT: bar 544 in 480 |
| en | 500 x 800 | 0 -- DOES NOT FIT: bar 555 in 500 | 0 -- DOES NOT FIT: bar 622 in 500 | 0 -- DOES NOT FIT: bar 553 in 500 |
| en | 520 x 800 | 0 -- DOES NOT FIT: bar 564 in 520 | 0 -- DOES NOT FIT: bar 631 in 520 | 0 -- DOES NOT FIT: bar 562 in 520 |
| en | 540 x 800 | 0 -- DOES NOT FIT: bar 573 in 540 | 0 -- DOES NOT FIT: bar 640 in 540 | 0 -- DOES NOT FIT: bar 571 in 540 |
| en | 560 x 800 | 0 -- DOES NOT FIT: bar 582 in 560 | 0 -- DOES NOT FIT: bar 649 in 560 | 0 -- DOES NOT FIT: bar 580 in 560 |
| en | 580 x 800 | 0 -- DOES NOT FIT: bar 591 in 580 | 0 -- DOES NOT FIT: bar 658 in 580 | 0 -- DOES NOT FIT: bar 589 in 580 |
| en | 599 x 800 | 0 -- DOES NOT FIT: bar 600 in 599 | 0 -- DOES NOT FIT: bar 667 in 599 | 1.4 |
| en | 600 x 800 | 0 | 0 -- DOES NOT FIT: bar 667 in 600 | 1.9 |
| en | 620 x 800 | 10.9 | 0 -- DOES NOT FIT: bar 676 in 620 | 12.9 |
| en | 640 x 800 | 21.9 | 0 -- DOES NOT FIT: bar 685 in 640 | 23.9 |
| en | 700 x 800 | 81.9 | 14.5 | 83.9 |
| en | 767 x 800 | 148.9 | 81.5 | 150.9 |
| nl | 1280 x 640 | 648.6 | 581.2 | 672.6 |
| nl | 1366 x 768 | 734.6 | 667.2 | 758.6 |
| nl | 1920 x 1080 | 1288.6 | 1221.2 | 1312.6 |
| nl | 2560 x 1440 | 1928.6 | 1861.2 | 1952.6 |
| nl | 1280 x 800 | 648.6 | 581.2 | 672.6 |
| nl | 1024 x 768 | 392.6 | 325.2 | 416.6 |
| nl | 768 x 1024 | 136.6 | 69.2 | 160.6 |
| nl | 390 x 844 | 68.4 | 23.6 | 95.9 |
| nl | 360 x 640 | 45 | 0.2 | 72.5 |
| nl | 320 x 480 | 13.8 | 0 -- DOES NOT FIT: bar 351 in 320 | 41.3 |
| nl | 479 x 800 | 137.8 | 93 | 165.3 |
| nl | 480 x 800 | 0 -- DOES NOT FIT: bar 559 in 480 | 0 -- DOES NOT FIT: bar 627 in 480 | 0 -- DOES NOT FIT: bar 535 in 480 |
| nl | 500 x 800 | 0 -- DOES NOT FIT: bar 568 in 500 | 0 -- DOES NOT FIT: bar 636 in 500 | 0 -- DOES NOT FIT: bar 544 in 500 |
| nl | 520 x 800 | 0 -- DOES NOT FIT: bar 577 in 520 | 0 -- DOES NOT FIT: bar 645 in 520 | 0 -- DOES NOT FIT: bar 553 in 520 |
| nl | 540 x 800 | 0 -- DOES NOT FIT: bar 586 in 540 | 0 -- DOES NOT FIT: bar 654 in 540 | 0 -- DOES NOT FIT: bar 562 in 540 |
| nl | 560 x 800 | 0 -- DOES NOT FIT: bar 595 in 560 | 0 -- DOES NOT FIT: bar 663 in 560 | 0 -- DOES NOT FIT: bar 571 in 560 |
| nl | 580 x 800 | 0 -- DOES NOT FIT: bar 604 in 580 | 0 -- DOES NOT FIT: bar 672 in 580 | 0 |
| nl | 599 x 800 | 0 -- DOES NOT FIT: bar 613 in 599 | 0 -- DOES NOT FIT: bar 680 in 599 | 10 |
| nl | 600 x 800 | 0 -- DOES NOT FIT: bar 613 in 600 | 0 -- DOES NOT FIT: bar 681 in 600 | 10.6 |
| nl | 620 x 800 | 0 -- DOES NOT FIT: bar 622 in 620 | 0 -- DOES NOT FIT: bar 690 in 620 | 21.6 |
| nl | 640 x 800 | 8.6 | 0 -- DOES NOT FIT: bar 699 in 640 | 32.6 |
| nl | 700 x 800 | 68.6 | 1.2 | 92.6 |
| nl | 767 x 800 | 135.6 | 68.2 | 159.6 |

### The overview, /

| lang | viewport | room on dev | + "Editor", share look | + "Editor", account-link look |
|---|---|---|---|---|
| en | 1280 x 640 | 950 | 882.7 | 906.1 |
| en | 1366 x 768 | 1036 | 968.7 | 992.1 |
| en | 1920 x 1080 | 1590 | 1522.7 | 1546.1 |
| en | 2560 x 1440 | 2230 | 2162.7 | 2186.1 |
| en | 1280 x 800 | 950 | 882.7 | 906.1 |
| en | 1024 x 768 | 694 | 626.7 | 650.1 |
| en | 768 x 1024 | 438 | 370.7 | 394.1 |
| en | 390 x 844 | 139.7 | 94.9 | 101.7 |
| en | 360 x 640 | 109.7 | 64.9 | 71.7 |
| en | 320 x 480 | 69.7 | 24.9 | 31.7 |
| en | 479 x 800 | 228.7 | 183.9 | 190.7 |
| en | 480 x 800 | 150 | 82.7 | 106.1 |
| en | 500 x 800 | 170 | 102.7 | 126.1 |
| en | 520 x 800 | 190 | 122.7 | 146.1 |
| en | 540 x 800 | 210 | 142.7 | 166.1 |
| en | 560 x 800 | 230 | 162.7 | 186.1 |
| en | 580 x 800 | 250 | 182.7 | 206.1 |
| en | 599 x 800 | 269 | 201.7 | 225.1 |
| en | 600 x 800 | 270 | 202.7 | 226.1 |
| en | 620 x 800 | 290 | 222.7 | 246.1 |
| en | 640 x 800 | 310 | 242.7 | 266.1 |
| en | 700 x 800 | 370 | 302.7 | 326.1 |
| en | 767 x 800 | 437 | 369.7 | 393.1 |
| nl | 1280 x 640 | 956.8 | 889.4 | 912.8 |
| nl | 1366 x 768 | 1042.8 | 975.4 | 998.8 |
| nl | 1920 x 1080 | 1596.8 | 1529.4 | 1552.8 |
| nl | 2560 x 1440 | 2236.8 | 2169.4 | 2192.8 |
| nl | 1280 x 800 | 956.8 | 889.4 | 912.8 |
| nl | 1024 x 768 | 700.8 | 633.4 | 656.8 |
| nl | 768 x 1024 | 444.8 | 377.4 | 400.8 |
| nl | 390 x 844 | 145.4 | 100.7 | 107.4 |
| nl | 360 x 640 | 115.4 | 70.7 | 77.4 |
| nl | 320 x 480 | 75.4 | 30.7 | 37.4 |
| nl | 479 x 800 | 234.4 | 189.7 | 196.4 |
| nl | 480 x 800 | 156.8 | 89.4 | 112.8 |
| nl | 500 x 800 | 176.8 | 109.4 | 132.8 |
| nl | 520 x 800 | 196.8 | 129.4 | 152.8 |
| nl | 540 x 800 | 216.8 | 149.4 | 172.8 |
| nl | 560 x 800 | 236.8 | 169.4 | 192.8 |
| nl | 580 x 800 | 256.8 | 189.4 | 212.8 |
| nl | 599 x 800 | 275.8 | 208.4 | 231.8 |
| nl | 600 x 800 | 276.8 | 209.4 | 232.8 |
| nl | 620 x 800 | 296.8 | 229.4 | 252.8 |
| nl | 640 x 800 | 316.8 | 249.4 | 272.8 |
| nl | 700 x 800 | 376.8 | 309.4 | 332.8 |
| nl | 767 x 800 | 443.8 | 376.4 | 399.8 |

### The login page at /admin

| lang | viewport | room on dev | + "Website", account-link look | + "Website", share look | + "Website", account-link look, no site title, no current-language pill | + "Website", share look, no site title, no current-language pill |
|---|---|---|---|---|---|---|
| en | 1280 x 640 | 950 | 893.3 | 870.9 | 1103.9 | 1081.5 |
| en | 1366 x 768 | 1036 | 979.3 | 956.9 | 1189.9 | 1167.5 |
| en | 1920 x 1080 | 1590 | 1533.3 | 1510.9 | 1743.9 | 1721.5 |
| en | 2560 x 1440 | 2230 | 2173.3 | 2150.9 | 2383.9 | 2361.5 |
| en | 1280 x 800 | 950 | 893.3 | 870.9 | 1103.9 | 1081.5 |
| en | 1024 x 768 | 694 | 637.3 | 614.9 | 847.9 | 825.5 |
| en | 768 x 1024 | 438 | 381.3 | 358.9 | 591.9 | 569.5 |
| en | 390 x 844 | 301.7 | 251 | 246.2 | 255 | 250.2 |
| en | 360 x 640 | 271.7 | 221 | 216.2 | 225 | 220.2 |
| en | 320 x 480 | 231.7 | 181 | 176.2 | 185 | 180.2 |
| en | 479 x 800 | 390.7 | 340 | 335.2 | 344 | 339.2 |
| en | 480 x 800 | 150 | 93.3 | 70.9 | 303.9 | 281.5 |
| en | 500 x 800 | 170 | 113.3 | 90.9 | 323.9 | 301.5 |
| en | 520 x 800 | 190 | 133.3 | 110.9 | 343.9 | 321.5 |
| en | 540 x 800 | 210 | 153.3 | 130.9 | 363.9 | 341.5 |
| en | 560 x 800 | 230 | 173.3 | 150.9 | 383.9 | 361.5 |
| en | 580 x 800 | 250 | 193.3 | 170.9 | 403.9 | 381.5 |
| en | 599 x 800 | 269 | 212.3 | 189.9 | 422.9 | 400.5 |
| en | 600 x 800 | 270 | 213.3 | 190.9 | 423.9 | 401.5 |
| en | 620 x 800 | 290 | 233.3 | 210.9 | 443.9 | 421.5 |
| en | 640 x 800 | 310 | 253.3 | 230.9 | 463.9 | 441.5 |
| en | 700 x 800 | 370 | 313.3 | 290.9 | 523.9 | 501.5 |
| en | 767 x 800 | 437 | 380.3 | 357.9 | 590.9 | 568.5 |
| nl | 1280 x 640 | 956.8 | 900.1 | 877.7 | 1125.9 | 1103.5 |
| nl | 1366 x 768 | 1042.8 | 986.1 | 963.7 | 1211.9 | 1189.5 |
| nl | 1920 x 1080 | 1596.8 | 1540.1 | 1517.7 | 1765.9 | 1743.5 |
| nl | 2560 x 1440 | 2236.8 | 2180.1 | 2157.7 | 2405.9 | 2383.5 |
| nl | 1280 x 800 | 956.8 | 900.1 | 877.7 | 1125.9 | 1103.5 |
| nl | 1024 x 768 | 700.8 | 644.1 | 621.7 | 869.9 | 847.5 |
| nl | 768 x 1024 | 444.8 | 388.1 | 365.7 | 613.9 | 591.5 |
| nl | 390 x 844 | 321.9 | 271.2 | 266.4 | 275.2 | 270.4 |
| nl | 360 x 640 | 291.9 | 241.2 | 236.4 | 245.2 | 240.4 |
| nl | 320 x 480 | 251.9 | 201.2 | 196.4 | 205.2 | 200.4 |
| nl | 479 x 800 | 410.9 | 360.2 | 355.4 | 364.2 | 359.4 |
| nl | 480 x 800 | 156.8 | 100.1 | 77.7 | 325.9 | 303.5 |
| nl | 500 x 800 | 176.8 | 120.1 | 97.7 | 345.9 | 323.5 |
| nl | 520 x 800 | 196.8 | 140.1 | 117.7 | 365.9 | 343.5 |
| nl | 540 x 800 | 216.8 | 160.1 | 137.7 | 385.9 | 363.5 |
| nl | 560 x 800 | 236.8 | 180.1 | 157.7 | 405.9 | 383.5 |
| nl | 580 x 800 | 256.8 | 200.1 | 177.7 | 425.9 | 403.5 |
| nl | 599 x 800 | 275.8 | 219.1 | 196.7 | 444.9 | 422.5 |
| nl | 600 x 800 | 276.8 | 220.1 | 197.7 | 445.9 | 423.5 |
| nl | 620 x 800 | 296.8 | 240.1 | 217.7 | 465.9 | 443.5 |
| nl | 640 x 800 | 316.8 | 260.1 | 237.7 | 485.9 | 463.5 |
| nl | 700 x 800 | 376.8 | 320.1 | 297.7 | 545.9 | 523.5 |
| nl | 767 x 800 | 443.8 | 387.1 | 364.7 | 612.9 | 590.5 |

### The creators' overview at /admin, as the administrator (four controls: the switch, Account, Accounts, Log out)

| lang | viewport | room on dev | + "Website", account-link look | + "Website", share look | + "Website", account-link look, no site title, no current-language pill | + "Website", share look, no site title, no current-language pill |
|---|---|---|---|---|---|---|
| en | 1280 x 640 | 776.2 | 719.5 | 697 | 930 | 907.6 |
| en | 1366 x 768 | 862.2 | 805.5 | 783 | 1016 | 993.6 |
| en | 1920 x 1080 | 1416.2 | 1359.5 | 1337 | 1570 | 1547.6 |
| en | 2560 x 1440 | 2056.2 | 1999.5 | 1977 | 2210 | 2187.6 |
| en | 1280 x 800 | 776.2 | 719.5 | 697 | 930 | 907.6 |
| en | 1024 x 768 | 520.2 | 463.5 | 441 | 674 | 651.6 |
| en | 768 x 1024 | 264.2 | 207.5 | 185 | 418 | 395.6 |
| en | 390 x 844 | 137.9 | 87.2 | 82.3 | 91.2 | 86.3 |
| en | 360 x 640 | 107.9 | 57.2 | 52.3 | 61.2 | 56.3 |
| en | 320 x 480 | 67.9 | 17.2 | 12.3 | 21.2 | 16.3 |
| en | 479 x 800 | 226.9 | 176.2 | 171.3 | 180.2 | 175.3 |
| en | 480 x 800 | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 0 -- DOES NOT FIT: bar 488 in 480 | 0 -- DOES NOT FIT: bar 510 in 480 | 130 | 107.6 |
| en | 500 x 800 | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 0 -- WRAPS: "ELSA decision trees" on 3 lines | 0 -- DOES NOT FIT: bar 510 in 500 | 150 | 127.6 |
| en | 520 x 800 | 16.2 | 0 -- WRAPS: "ELSA decision trees" on 3 lines | 0 -- WRAPS: "ELSA decision trees" on 3 lines | 170 | 147.6 |
| en | 540 x 800 | 36.2 | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 0 -- WRAPS: "ELSA decision trees" on 3 lines | 190 | 167.6 |
| en | 560 x 800 | 56.2 | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 210 | 187.6 |
| en | 580 x 800 | 76.2 | 19.5 | 0 -- WRAPS: "ELSA decision trees" on 2 lines | 230 | 207.6 |
| en | 599 x 800 | 95.2 | 38.5 | 16 | 249 | 226.6 |
| en | 600 x 800 | 96.2 | 39.5 | 17 | 250 | 227.6 |
| en | 620 x 800 | 116.2 | 59.5 | 37 | 270 | 247.6 |
| en | 640 x 800 | 136.2 | 79.5 | 57 | 290 | 267.6 |
| en | 700 x 800 | 196.2 | 139.5 | 117 | 350 | 327.6 |
| en | 767 x 800 | 263.2 | 206.5 | 184 | 417 | 394.6 |
| nl | 1280 x 640 | 771.4 | 714.7 | 692.3 | 940.5 | 918.1 |
| nl | 1366 x 768 | 857.4 | 800.7 | 778.3 | 1026.5 | 1004.1 |
| nl | 1920 x 1080 | 1411.4 | 1354.7 | 1332.3 | 1580.5 | 1558.1 |
| nl | 2560 x 1440 | 2051.4 | 1994.7 | 1972.3 | 2220.5 | 2198.1 |
| nl | 1280 x 800 | 771.4 | 714.7 | 692.3 | 940.5 | 918.1 |
| nl | 1024 x 768 | 515.4 | 458.7 | 436.3 | 684.5 | 662.1 |
| nl | 768 x 1024 | 259.4 | 202.7 | 180.3 | 428.5 | 406.1 |
| nl | 390 x 844 | 146.5 | 95.8 | 91 | 99.8 | 95 |
| nl | 360 x 640 | 116.5 | 65.8 | 61 | 69.8 | 65 |
| nl | 320 x 480 | 76.5 | 25.8 | 21 | 29.8 | 25 |
| nl | 479 x 800 | 235.5 | 184.8 | 180 | 188.8 | 184 |
| nl | 480 x 800 | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 0 -- DOES NOT FIT: bar 526 in 480 | 0 -- DOES NOT FIT: bar 549 in 480 | 140.5 | 118.1 |
| nl | 500 x 800 | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 0 -- DOES NOT FIT: bar 526 in 500 | 0 -- DOES NOT FIT: bar 549 in 500 | 160.5 | 138.1 |
| nl | 520 x 800 | 11.4 | 0 -- DOES NOT FIT: bar 526 in 520 | 0 -- DOES NOT FIT: bar 549 in 520 | 180.5 | 158.1 |
| nl | 540 x 800 | 31.4 | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 0 -- DOES NOT FIT: bar 549 in 540 | 200.5 | 178.1 |
| nl | 560 x 800 | 51.4 | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 220.5 | 198.1 |
| nl | 580 x 800 | 71.4 | 14.7 | 0 -- WRAPS: "ELSA-beslisbomen" on 2 lines | 240.5 | 218.1 |
| nl | 599 x 800 | 90.4 | 33.7 | 11.3 | 259.5 | 237.1 |
| nl | 600 x 800 | 91.4 | 34.7 | 12.3 | 260.5 | 238.1 |
| nl | 620 x 800 | 111.4 | 54.7 | 32.3 | 280.5 | 258.1 |
| nl | 640 x 800 | 131.4 | 74.7 | 52.3 | 300.5 | 278.1 |
| nl | 700 x 800 | 191.4 | 134.7 | 112.3 | 360.5 | 338.1 |
| nl | 767 x 800 | 258.4 | 201.7 | 179.3 | 427.5 | 405.1 |

### The language switch and the logo on the root Node pages, and the controls at /admin below 480, as on dev

- 320 x 480, ai-act-applicability-agrifood, en: "English" (the current language) 49, "Nederlands" 72; the share button 61; the logo 58.4 (its file 479 x 120; its cap 58.4); the pills' face: "Open Sans", drawn in Open Sans
- 320 x 480, ai-act-applicability-agrifood, nl: "English" 49, "Nederlands" (the current language) 72; the share button 75; the logo 58.4 (its file 479 x 120; its cap 58.4); the pills' face: "Open Sans", drawn in Open Sans
- 320 x 480, ai-act-example, en: "English" (the current language) 48.1, "Nederlands" 68.3; the share button 57.3; the logo 58.4 (its file 240 x 60; its cap 58.4); the pills' face: -apple-system, drawn in Liberation Sans
- 320 x 480, ai-act-example, nl: "English" 48.1, "Nederlands" (the current language) 68.3; the share button 69.5; the logo 58.4 (its file 240 x 60; its cap 58.4); the pills' face: -apple-system, drawn in Liberation Sans
- 480 x 800, ai-act-applicability-agrifood, en: "English" (the current language) 66, "Nederlands" 91; the share button 76; the logo 119.8 (its file 479 x 120; its cap 216); the pills' face: "Open Sans", drawn in Open Sans
- 480 x 800, ai-act-applicability-agrifood, nl: "English" 66, "Nederlands" (the current language) 91; the share button 91; the logo 119.8 (its file 479 x 120; its cap 216); the pills' face: "Open Sans", drawn in Open Sans
- 480 x 800, ai-act-example, en: "English" (the current language) 65.4, "Nederlands" 87.4; the share button 75.4; the logo 120 (its file 240 x 60; its cap 216); the pills' face: -apple-system, drawn in Liberation Sans
- 480 x 800, ai-act-example, nl: "English" 65.4, "Nederlands" (the current language) 87.4; the share button 88.7; the logo 120 (its file 240 x 60; its cap 216); the pills' face: -apple-system, drawn in Liberation Sans
- 320 x 480, /admin, the login page, en: the bar from 0 to 320, its controls from 8 to 80.3
- 320 x 480, /admin, the login page, nl: the bar from 0 to 320, its controls from 8 to 60.1
- 320 x 480, /admin, the administrator's creators' overview, en: the bar from 0 to 320, its controls from 8 to 244.1
- 320 x 480, /admin, the administrator's creators' overview, nl: the bar from 0 to 320, its controls from 8 to 235.5

## 5. The script

Run as `node measure.mjs http://127.0.0.1:<port> <the administrator's password> <the
administrator's address>` from the repository's root against the server above, and in the image
as `node /work/measure.mjs http://host.docker.internal:<port> <the administrator's password> <the
administrator's address>` from `/work`, which held a copy of the repository's
`node_modules/playwright-core` and a `package.json` of `{"type":"module"}`. The address is the
one the server read from `ELSA_ADMIN_EMAIL`, and the script posts it as `{ email, password }`, as
`login()` in `tests/browser/admin.ts` does since #196. On `6d0ea4b`, before #196, the runs gave no
address, and the script logged in by the name `admin`.

```js
// Issue #202: the room in the chrome bars for #204's "Editor" and "Website", on the production
// build of dev. A scratch script of the filing run, widened by its fix run (PR #207, cycle 2) to
// the widths between 480 and 767 and to a logo as wide as its cap, copied whole into
// docs/research/issue-202-bar-room.md and deleted. Usage, from a folder whose node_modules holds
// playwright-core -- the repository, or the CI image's /work:
//   node measure.mjs <origin> <the administrator's password> [<the administrator's address>]
// With an address it logs in by address, as dev does since #196; without one, by the name
// `admin`, as dev did before #196.
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('playwright-core')

const [origin, password, email] = process.argv.slice(2)
/**
 * The ten viewports of 10.6, then 479 x 800, the widest window below 480, then the widths from
 * 480 to 767, where nothing in a Node page's bar changes with the width but the room, with 599
 * and 600 either side of the width the fix run chose.
 */
const VIEWPORTS = [
  [1280, 640], [1366, 768], [1920, 1080], [2560, 1440], [1280, 800],
  [1024, 768], [768, 1024], [390, 844], [360, 640], [320, 480], [479, 800],
  [480, 800], [500, 800], [520, 800], [540, 800], [560, 800], [580, 800], [599, 800],
  [600, 800], [620, 800], [640, 800], [700, 800], [767, 800],
]

/**
 * The room in the page's chrome bar, after drawing `add` -- an `<a>` with a class of the bar's
 * own controls -- at the end of its controls, after hiding the current language's pill when
 * `hideCurrent`, after hiding the bar's first child -- the site's title at `/admin` -- when
 * `hideTitle`, and after drawing the Tree's logo as wide as its cap allows when `logoAtCap`. Room: between the bar's first child and its controls, the bar's gap taken off;
 * where the first child is hidden (the Tree-less admin bars below 480, or `hideTitle`), after
 * the controls, which then stand alone at the left. Fits: the bar no wider than the window,
 * nothing in the bar wider or taller than itself, and no text in it on more than one line.
 */
async function measure(page, add, hideCurrent, hideTitle, logoAtCap) {
  return page.evaluate(({ add, hideCurrent, hideTitle, logoAtCap }) => {
    const bar = document.querySelector('header.page-chrome')
    const controls = bar.querySelector(':scope > .page-controls')
    // A logo of any shape is drawn no wider than `.logo`'s max-width: asked for the window's
    // width, it is drawn exactly that wide, as the widest logo a Theme can bring.
    if (logoAtCap) bar.querySelector('img.logo').style.width = '100vw'
    if (hideTitle) bar.firstElementChild.style.display = 'none'
    if (hideCurrent) for (const pill of controls.querySelectorAll('.language--current')) pill.closest('li').style.display = 'none'
    if (add) {
      const a = document.createElement('a')
      a.className = add.className
      a.href = add.href
      a.textContent = add.text
      controls.append(a)
    }
    const cs = getComputedStyle(bar)
    const first = bar.firstElementChild
    const f = first.getBoundingClientRect()
    const c = controls.getBoundingClientRect()
    const box = bar.getBoundingClientRect()
    const shown = getComputedStyle(first).display !== 'none' && f.width > 0
    const room = shown ? c.left - f.right - parseFloat(cs.columnGap) : box.right - parseFloat(cs.paddingRight) - c.right
    const overflowing = [...bar.querySelectorAll('*')].some(
      (el) => (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) || (el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1),
    )
    // A text drawn on more than one line: its line boxes stand at more than one height.
    const wrapped = []
    const texts = document.createTreeWalker(bar, NodeFilter.SHOW_TEXT)
    for (let text = texts.nextNode(); text; text = texts.nextNode()) {
      if (!text.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(text)
      const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)))
      if (lines.size > 1) wrapped.push(`"${text.textContent.trim()}" on ${lines.size} lines`)
    }
    const wide = box.width > window.innerWidth + 0.5 || document.body.scrollWidth > window.innerWidth || overflowing
    const cell = `${Math.round(room * 10) / 10}`
    if (wide) return `${cell} -- DOES NOT FIT: bar ${Math.round(box.width)} in ${window.innerWidth}`
    if (wrapped.length) return `${cell} -- WRAPS: ${wrapped.join(', ')}`
    return cell
  }, { add, hideCurrent, hideTitle, logoAtCap })
}

const browser = await chromium.launch()
const tables = []
async function table(context, title, address, variants, logoAtCap = false) {
  const rows = [`### ${title}`, '', `| lang | viewport | room on dev | ${variants.map((v) => v.label).join(' | ')} |`, `|---|---|---|${variants.map(() => '---|').join('')}`]
  const page = await context.newPage()
  for (const lang of ['en', 'nl']) {
    for (const [w, h] of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h })
      const url = new URL(address, origin)
      if (lang === 'nl') url.searchParams.set('lang', 'nl')
      await page.goto(url.href, { waitUntil: 'load' })
      const cells = [await measure(page, null, false, false, logoAtCap)]
      for (const v of variants) {
        await page.reload({ waitUntil: 'load' })
        cells.push(await measure(page, v.add, v.hideCurrent, v.hideTitle, logoAtCap))
      }
      rows.push(`| ${lang} | ${w} x ${h} | ${cells.join(' | ')} |`)
    }
  }
  await page.close()
  tables.push(rows.join('\n'))
}

const editor = (className) => ({ className, href: '/admin', text: 'Editor' })
const website = (className) => ({ className, href: '/', text: 'Website' })
const node = [
  { label: '+ "Editor", share look', add: editor('share'), hideCurrent: false },
  { label: '+ "Editor", account-link look', add: editor('admin-link'), hideCurrent: false },
  { label: '+ "Editor", share look, no current-language pill', add: editor('share'), hideCurrent: true },
  { label: '+ "Editor", account-link look, no current-language pill', add: editor('admin-link'), hideCurrent: true },
]

const visitor = await browser.newContext()
await table(visitor, 'The root Node page of ai-act-applicability-agrifood', '/ai-act-applicability-agrifood', node)
await table(visitor, 'The root Node page of ai-act-example', '/ai-act-example', node)
const capped = [node[0], node[2]]
await table(visitor, 'The root Node page of ai-act-applicability-agrifood, its logo drawn as wide as its cap', '/ai-act-applicability-agrifood', capped, true)
await table(visitor, 'The root Node page of ai-act-example, its logo drawn as wide as its cap', '/ai-act-example', capped, true)
await table(visitor, 'The overview, /', '/', node.slice(0, 2))
const atAdmin = [
  { label: '+ "Website", account-link look', add: website('admin-link'), hideCurrent: false },
  { label: '+ "Website", share look', add: website('share'), hideCurrent: false },
  { label: '+ "Website", account-link look, no site title, no current-language pill', add: website('admin-link'), hideCurrent: true, hideTitle: true },
  { label: '+ "Website", share look, no site title, no current-language pill', add: website('share'), hideCurrent: true, hideTitle: true },
]
await table(visitor, 'The login page at /admin', '/admin', atAdmin)

const admin = await browser.newContext()
const answer = await admin.request.post(`${origin}/admin/api/login`, {
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  data: email ? { email, password } : { login: 'admin', password },
})
if (answer.status() !== 204) throw new Error(`login answered ${answer.status()}`)
await table(admin, "The creators' overview at /admin, as the administrator (four controls: the switch, Account, Accounts, Log out)", '/admin', atAdmin)

// What the language switch's pills say and how wide they are, how wide the logo is, and the
// face the pills are drawn in, below 480 (11 pixels) and from 480 up (12 pixels): the first
// family their stack names, and the face Chromium drew their text in.
const pills = ['### The language switch and the logo on the root Node pages, and the controls at /admin below 480, as on dev', '']
const probe = await visitor.newPage()
const cdp = await visitor.newCDPSession(probe)
for (const [w, h] of [[320, 480], [480, 800]]) {
  await probe.setViewportSize({ width: w, height: h })
  for (const tree of ['ai-act-applicability-agrifood', 'ai-act-example']) {
    for (const lang of ['en', 'nl']) {
      await probe.goto(`${origin}/${tree}${lang === 'nl' ? '?lang=nl' : ''}`, { waitUntil: 'load' })
      const said = await probe.evaluate(() => {
        const bar = document.querySelector('header.page-chrome')
        const width = (el) => Math.round(el.getBoundingClientRect().width * 10) / 10
        const switchPills = [...bar.querySelectorAll('.language-switch li')]
          .map((li) => `"${li.textContent.trim()}"${li.querySelector('.language--current') ? ' (the current language)' : ''} ${width(li)}`)
          .join(', ')
        const logo = bar.querySelector('img.logo')
        const drawn = width(logo)
        logo.style.width = '100vw'
        const cap = width(logo)
        logo.style.width = ''
        const face = getComputedStyle(bar.querySelector('.language-switch li')).fontFamily.split(',')[0]
        return `${switchPills}; the share button ${width(bar.querySelector('.share'))}; the logo ${drawn} (its file ${logo.naturalWidth} x ${logo.naturalHeight}; its cap ${cap}); the pills' face: ${face}`
      })
      await cdp.send('DOM.enable')
      await cdp.send('CSS.enable')
      const { root } = await cdp.send('DOM.getDocument')
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'header.page-chrome .language-switch .language' })
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
      pills.push(`- ${w} x ${h}, ${tree}, ${lang}: ${said}, drawn in ${fonts.map((f) => f.familyName).join(' and ')}`)
    }
  }
}
// Where the controls of the bar at /admin stand below 480, where the bar hides the site's title.
for (const [context, who] of [[visitor, 'the login page'], [admin, "the administrator's creators' overview"]]) {
  const page = await context.newPage()
  await page.setViewportSize({ width: 320, height: 480 })
  for (const lang of ['en', 'nl']) {
    await page.goto(`${origin}/admin${lang === 'nl' ? '?lang=nl' : ''}`, { waitUntil: 'load' })
    const where = await page.evaluate(() => {
      const bar = document.querySelector('header.page-chrome').getBoundingClientRect()
      const controls = document.querySelector('header.page-chrome > .page-controls').getBoundingClientRect()
      const at = (x) => Math.round(x * 10) / 10
      return `the bar from ${at(bar.left)} to ${at(bar.right)}, its controls from ${at(controls.left)} to ${at(controls.right)}`
    })
    pills.push(`- 320 x 480, /admin, ${who}, ${lang}: ${where}`)
  }
  await page.close()
}
tables.push(pills.join('\n'))
await browser.close()
console.log(tables.join('\n\n'))
```
