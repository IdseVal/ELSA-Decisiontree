# ADR-272-overview-search: a search bar above the public overview's tiles narrows them in the page, on every title and description the Tree declares, folded for case and accents; without the script it is a form the server answers; `/admin` has none

- Status: ACCEPTED -- 2026-11-22; every point but the owner's "a search-bar" "on the main page" is
  PROPOSED (the issue's PROPOSED points, read by the run that built it)
- Issue: #272 -- A search bar on the main page narrows the overview's tiles as the visitor types
- Spec: `docs/specs/application.md` 26.5 (new); 23.2 and 26.2 amended `[#272]`
- Amends: `ADR-133-overview-tiles.md` decision 2 (the rows in view on the public overview), by a
  dated note in 26.2; its other decisions stand
- Sister issue: #273 (tags, and a filter dropdown beside this bar)

## Context

The owner wrote on 2026-11-22: "on the main page I want a search-bar". The main page is the
public overview, `/` (23.2, 26): every served Tree as a tile in `id` order, in a box that scrolls
inside its own bounds between the chrome bar and the disclaimer (26.3). At 1280 x 640 that box
holds three rows of tiles exactly, 520 of 520 pixels (26.2). The page already holds every tile.

## Decision

1. **A row of its own above the box, out of its scroll** (PROPOSED). The field stays in view
   while the tiles scroll, and the box, a scroll container in the page's column, shrinks by the
   row: 16 + a 36-pixel field, and the box's top inset 16 instead of 24. At 1280 x 640 the box
   shows two rows whole and 140 of the third's 160 pixels. The field is one column of the grid
   wide (280) at the grid's inset, in a flex row with a gap of 20, so #273's dropdown takes the
   next column.
2. **It matches every title and description the Tree declares, folded** (PROPOSED, as the issue
   proposed). `src/search.ts`: `searchText` joins the titles and the descriptions -- reduced by
   16.3's `plainDescription`, whole -- of every declared language; `foldForSearch` takes NFKD,
   drops combining marks, lower-cases and collapses white space, on the Tree's text and on the
   query alike; `matchesSearch` asks every word of the query to occur, in any order. A blank
   query matches every tile; the tiles keep their `id` order.
3. **In the page, with no request.** `Overview` draws each tile on the server and hands it, with
   its Tree's folded text, to `OverviewSearch`, a client component holding the field and the box.
   The box holds the tiles that match, or `noMatch` with `role="status"`. Enter sends nothing.
4. **Without the script, a form the server answers.** The field's form asks for `/?q=<text>`
   (and `lang` on the Dutch page); the page reads `q` and draws the same narrowing, the field
   holding the text. The head stays the overview's, canonical link included.
5. **The chrome bar's pill at the body's type** (PROPOSED). The look of the bar's controls
   (24.3) with a magnifier, at 16 pixels: below 16 a phone's browser zooms the page into the
   field it focuses. `searchTrees` names the field and is its placeholder.
6. **No bar on `/admin`** (PROPOSED). The owner asked for the main page; the creators' overview
   stays 26.4's "same page with three additions", and keeps its three rows in view.
7. **No bar with nothing to search.** Zero served Trees: `noTrees` alone (23.2).

## Alternatives rejected

- **The field in the chrome bar.** It keeps the three rows in view, but the bar has no room
  for a field and #273's dropdown below 600 wide, where it already gives things up (24.3), and
  the issue places the bar above the tiles.
- **The field inside the box, at the top of its scroll.** It costs the same pixels at the top
  and scrolls away with the tiles it narrows.
- **A request per keystroke.** The page already holds every tile; a round trip would only add
  latency and a server route.
- **Only the page language's text.** A Dutch title would not be found from the English page,
  which the issue names; and a Tree shown in its default language would be found only by that
  language's words.
- **The description cut to 155 characters, as the tile draws it.** A word past the cut is still
  the Tree's description; the issue says "the description".
- **The whole query as one string.** "act ai" would not find "AI Act"; every word, any order,
  narrows as a visitor expects.
- **The bar on `/admin` too.** Not asked; it would change 26.4's page and its no-scroll rows for
  a request about the main page. A later issue can add it with the same component.
- **Hiding the field without the script.** The form costs one read of `q` on the server and
  keeps the bar doing what it says.

## Consequences

- `src/search.ts` (new), `src/components/OverviewSearch.tsx` (new), `src/components/TileBox.tsx`
  (the box, out of `Overview.tsx`, shared by both overviews), `src/components/Overview.tsx`,
  `src/app/[lang]/page.tsx` (`q`), `src/chrome.ts` (`searchTrees`, `noMatch`), `globals.css`
  (`.overview-search`).
- The page's script payload carries each served Tree's folded titles and descriptions in every
  language it declares; a hidden Tree's never (23.1).
- `tests/search.test.ts`: folding, the text a Tree is found by, matching.
  `tests/browser/overview.spec.ts`: narrowing as the visitor types with no request, both chrome
  languages, the form without the script, the bar's place above the box, no bar with nothing
  published, and screenshots in `docs/screenshots/issue-272/`. Its rows-in-view test now counts
  eight whole tiles and four cut at 1280 x 640.
- #273 adds its dropdown beside the field; both narrow the same tile list.
