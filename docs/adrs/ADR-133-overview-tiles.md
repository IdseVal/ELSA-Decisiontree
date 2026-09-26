# ADR-133-overview-tiles: one tile per Tree in a grid that scrolls inside its own box; the creators' overview is the same page with the + tile first, a state mark on every tile, the creator's own Trees before the rest; a creator sees every published Tree and the hidden ones they have a role on

- Status: ACCEPTED (frozen) -- 2026-09-26; confirms the PROPOSED reading of core document 3.4
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 26 (new); 10.6 and 23.2 amended
- Amends: `docs/adrs/ADR-38-no-scroll.md` (decision 4: a second exempted scroll container),
  `ADR-132-hidden-trees-and-findability.md` (decision 3: the overview's look and its order
  within the `id` rule)
- Depends on: `docs/adrs/ADR-133-admin-routes.md`, `ADR-132-roles-and-permissions.md`

## Context

The owner: "a page with an overview of all available datastructures", and for creators
"the same front page with the overview of datastructures, but now there will be on the
top left a blank entry with a + in it". #132 decided what the public overview lists
(every served Tree, by `id`, 23.2) and what it carries in its head; it left the look and
"which Trees a creator sees" to this issue, with a PROPOSED reading in core document 3.4:
every published Tree, plus the hidden ones they created or collaborate on; the
administrator sees all.

Two rules of the app meet here for the first time. The number of Trees is not bounded by
the format -- a lab may have three or thirty -- and the page must never scroll (core
document 9). The Carousel met the same pair with one exemption: a strip that scrolls
inside its own box while the document never does (12.2).

## Decision

1. **A tile is 280 x 160 pixels** and shows, top to bottom: the Tree's logo when its Theme
   names one, at most 40 pixels tall, else nothing (the title carries the name); the
   **title** in the page's language when the Tree declares it, else in the Tree's default
   language with a `lang` attribute on the tile (23.2), at 18 pixels bold on 24-pixel
   lines, at most two lines; the **description** -- the manifest's, reduced and cut by
   16.3's one function (`plainDescription(...).cut`, at most 155 characters), or nothing
   when the manifest has none -- at 14 pixels on 20-pixel lines, at most three lines; and
   a row of the Tree's **languages** as upper-case tags (`EN NL`). The whole tile is one
   link to the Tree's root Node in the page's language or the Tree's default (23.2),
   filled `surface`, outlined `rule`, with 8-pixel corners and a wash of `accent` on hover,
   the Option button's look (10.3) at a larger size. A tile carries the **Tree's own
   colours** for nothing: it is drawn in the page's Theme, which on the overview is the
   default (13.4), because thirty Trees' palettes on one page is a fairground, and the
   logo already says whose Tree it is.

2. **The grid.** Between the chrome bar and the disclaimer, one box padded 24 pixels holds
   the tiles in a grid of columns 280 wide with 20-pixel gaps, as many columns as fit
   (`auto-fill`), never fewer than one, tiles left-aligned in `id` order. At the guaranteed
   viewport that is four columns and three rows in view -- 4 x 280 + 3 x 20 = 1180 of 1232,
   3 x 160 + 2 x 20 = 520 of 520 -- twelve tiles; a thirteenth is below the fold **of the
   box**. Below 1232 pixels of width the columns fall to three, two, one; below 640 of
   height the rows in view fall likewise. Nothing about a tile changes with the viewport
   above the floor.

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

3. **The creators' overview, `/admin`, is the same page with three additions.** The
   **+ tile** is the first tile, top left: the same box, outlined dashed in `rule`, a
   48-pixel `+` glyph in `accent-secondary` and the words `newTree` under it, a link to
   `/admin/new`. Every other tile carries, in its bottom right corner, a **state mark**: a
   small dot and the word `published` (in `accent-secondary`) or `hidden` (in `text-muted`);
   and on a published Tree that is not servable (18.3) the word `notServable` in `danger`
   with the tile's link going to the editor, where the top panel lists the violations.
   And a tile the caller has a **role** on links to the editor of the root Node
   (`/admin/trees/<id>/<root>` in the page's language) instead of the public page; a tile
   with no role links to the public page as on `/`, so a creator can read a colleague's
   published Tree and cannot open its editor, which 21.3 would refuse with a 403 anyway.

4. **Which Trees a creator sees: as PROPOSED in core document 3.4, confirmed.** Every
   published Tree (servable or not), plus every hidden Tree the account is the creator of or
   a collaborator on; the administrator sees every Tree of the store. Within 23.2's rule
   that the order is by `id`, the creators' overview shows **two groups**: first the Trees
   the caller has a role on, in `id` order, then every other published Tree, in `id` order
   -- so a creator's own work is under the + tile and not lost among thirty published
   Trees. The public overview has one group. The list comes from `store.drafts.list(by)`
   for the first group and `store.publishedIds()` for the second (17.5, 19.7), with the
   first group's ids removed from the second; no third query.

5. **The box scrolls; the document never does.** The grid's box is the **second and last
   element the no-scroll rule exempts**, after the Carousel strip (10.6): it scrolls
   **vertically**, inside its own bounds between the chrome bar and the disclaimer, and it
   is a native scroll container, so it works without JavaScript and by the keyboard. It is
   marked `data-scroll-box`, and the element walk of `no-scroll.spec.ts` skips an element
   carrying that attribute as it skips `[data-carousel-strip]`. The same box, with the same
   attribute and the same rule, holds the accounts list (`ADR-133-login-and-account-pages.md`)
   and the new-Tree form (`ADR-133-new-tree-form.md`), the two other things the format does
   not bound. Nothing else may carry the attribute: an editor page, a Sheet, a panel is
   bounded by the format and fits or is a defect.

6. **Zero Trees.** The public overview with no served Tree shows one sentence, `noTrees`, in
   the chrome language (23.2); the creators' overview shows the + tile alone.

## Alternatives rejected

- **Paging the tiles (twelve a page, `previous` / `next`).** Honours the letter of "no
  scrolling" and needs either a server page count that does not know the viewport or a
  client pager that hides tiles; a native scroll box is the Carousel's own answer, already
  accepted by the owner, and works without script.
- **Letting the document scroll on the overview alone.** It is the one rule the owner
  called absolute and core document 9 lists; an exception on the front page is where a
  second one starts.
- **Tiles in each Tree's own Theme.** Thirty palettes on one page, thirty `<style>`
  blocks, and a Tree with a white-on-yellow Theme unreadable beside one in navy. The logo
  is the identity; the page's Theme is the page's.
- **Showing a creator only the Trees they have a role on.** The owner's "the same front
  page" says the public list is there too; and a creator who cannot see what colleagues
  published cannot avoid building it twice.
- **One group, strictly by `id`.** A creator's hidden draft named `zzz-test` would sit
  under thirty published Trees. Two groups keep 23.2's rule inside each.
- **Separate pages for "my Trees" and "all Trees".** Two pages where the owner asked for
  one, and the + tile would have to be on both or on the wrong one.
- **The + tile as a button opening the new-Tree form in a Sheet.** A page has an address a
  creator can be sent to and a test can open; the Sheet would hold a form with a variable
  number of fields (`ADR-133-new-tree-form.md`).
- **A tile's link going to the editor for the administrator on every Tree.** The
  administrator has a role on every Tree (21.1), so decision 3 already does that; no
  special case.

## Consequences

- #134 builds the public overview to decisions 1, 2, 5 and 6 (`src/components/Tile.tsx`,
  `Overview.tsx`, the box), and adds `no-scroll.spec.ts`'s second exemption with the
  overview page as a new row of 10.6 (against a fixture data directory of fourteen
  published Trees, so the box has something to scroll); #137 adds decisions 3 and 4.
- `src/chrome.ts` gains `newTree`, `published`, `hidden`, `notServable`, `noTrees` (#134
  the last, #137 the rest).
- `application.md` 10.6 names the second exemption; 23.2 gains the look by reference to 26.
- `tests/browser/overview.spec.ts` (#134) and `creators-overview.spec.ts` (#137) are named
  in `ADR-133-editor-testing.md`.
