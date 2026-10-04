# ADR-195-the-mention: "By A, B and C" / "Door A, B en C", one small line in the chrome bar of a Tree's pages between its mark and the controls, and on its tile's bottom row; cut where its room ends, not drawn where under 80 pixels are left, and taking no pixel from anything else

- Status: ACCEPTED (frozen) -- 2026-10-03; decides core document 10.40 (what the mention shows,
  what it does when the names do not fit, and where it stands under the no-scroll rule) and
  amends 10.22 (the one line cut at the guarantee, outside the fixed order)
- **Amended 2026-10-04 by issue #205** (`ADR-205-preview-bar.md`): the mention is drawn in the bar
  of the preview of a hidden Tree too, which is the public Node page's bar, from the Tree's
  `TreeEntry.meta`, as its readers will see it once it is published; the preview is an admin page,
  so a hidden Tree's names still reach no public route. The editor still draws none. The rest
  stands.
- Issue: #195 -- Architecture: freeze the login by e-mail address and password, and the
  mention of who authored a Tree, the collaborators in the order they joined it
- Spec: `docs/specs/application.md` 39.4, 39.5, 39.6 (new); 3.2, 10.1, 10.4, 10.5, 10.6, 24.3,
  26.1, 34.5 amended, marked **[#195]**
- Amends: `ADR-133-overview-tiles.md` decision 1 (the tile's bottom row holds the mention),
  `ADR-133-admin-routes.md` decision 7 (the public Node page's bar is no longer unchanged: it
  holds the mention), `ADR-38-no-scroll.md` as 10.4 to 10.6 restate it (one line cut at the
  guarantee and given up by its room, outside the fixed order and behind no control; a third
  kind of element the walk skips, by the same reason as the second)
- Depends on: `ADR-195-authors.md` (who), `ADR-195-order-of-joining.md` (in what order)
- Measurements: `docs/research/issue-195-measurements.md`
- Built by: #197

## Context

The owner's word is "small" (#194). A Node page has six rows (10.1); at the guaranteed
viewport, 1280 x 640, they are 44 + 56 + 401 + 43 + 68 + 28 = 640, and the Bubble's text area
holds the format's limits with 0.6 pixels to spare (10.7, #174). A row of its own would take
the description's second line. The number of Authors has no bound: an Author is any account
the creator invites. The page must not scroll at any size (core document 9), and what it gives
up below the guarantee it gives up in a fixed order (10.5). Every public page works without
JavaScript (14).

The chrome bar holds, left, the way back to the overview and the Tree's mark -- its logo, or
its title as text -- and, right, the language switch and the share button (24.3), with the
space between them free. Measured on the production build of `dev` (the record above, section
2): beside the repository Trees' 120-pixel logos that space is 794 to 816 pixels at 1280 x 640
and 282 to 304 at 768 x 1024; beside a title of the format's 80 characters, 439 to 463 at
1280 x 640 and none below about 1000 pixels wide; on a phone, 30 to 75. The overview's tile
(26.1) ends in a row of language tags, 248 pixels wide inside the tile, with 187 pixels free
after two tags on `/` and 107 to 125 when the creators' overview adds its state mark (section
3).

## Decision

1. **The words**, a chrome key that takes the names (3.2): `byAuthors(names)` --
   "By Anna de Vries", "By Anna de Vries and Bram Jansen", "By Anna de Vries, Bram Jansen and
   Cees Bakker"; in Dutch "Door Anna de Vries", "Door Anna de Vries en Bram Jansen", "Door Anna
   de Vries, Bram Jansen en Cees Bakker": the names in the order of `ADR-195-authors.md`, a
   comma between all but the last two, which "and" / "en" joins. Chrome language, by 3.1, so
   the element carries the chrome language's `lang` where the page's content language is
   another, as the disclaimer does; the names as their accounts hold them.

2. **Where: two places, and no other.**
   - **The chrome bar of every Node page of a published Tree**, between the Tree's mark and the
     controls, on one line in the bar's small type -- `--small`, 13 pixels on 20, the size of a
     Tree's title written in the bar as text; 11 on 14 below 480 pixels wide, where the bar's
     pills are 11 too -- in `text-muted`:

     ```
     +--------------------------------------------------------------------------------+  44
     | (<) [logo]  By Anna de Vries, Bram Jansen and Cees Bakker   [language] [share] |
     +--------------------------------------------------------------------------------+
      16  30 10 120 16 |<---- the mention's room: 809 ---->| 16 |<---- 247 ---->| 16  = 1280
     ```

     (the first Tree in English at 1280 x 640: the mention takes 289 of its 809).
   - **The Tree's tile** on the public overview and on the creators' overview, in its bottom
     row after the language tags and before the creators' state mark, at the tags' type -- 11
     pixels on 16 -- in `text-muted`:

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

3. **When the names do not fit: the line is cut, and below 80 pixels not drawn.** In each
   place the mention takes the room the others leave -- the bar's free space; the row's after
   the tags -- and never a pixel of the mark, the controls, the tags or the state mark, drawn
   or not: the bar and the row are laid out as they are without it. Its one line is cut with
   an ellipsis where that room ends, and its whole text is the element's `title` and is read
   whole by a screen reader. Where the room is under **80 pixels** -- a short name with its
   word: "Door Idse Val" is 76 to 80 pixels at 13 in the faces measured -- the mention is not
   drawn at all, so that no "By…" stands alone. No count is shown and nothing is reordered:
   the line is the order of joining, and the cut takes the last to join.

4. **What that gives at the viewports of 10.6** (measured, the record's section 2): beside a
   120-pixel logo the mention is drawn at every viewport from 768 x 1024 up -- three names
   whole at 1280 x 640 in both languages, and at 768 x 1024 in English; in Dutch at 768 x 1024
   cut by 15 pixels beside the first Tree's logo, and whole, with 11 to spare, beside the
   example Tree's -- and not drawn at 390 x 844 and 360 x 640, where 30 to 75 pixels are left.
   Beside an 80-character title it is drawn at 1024 x 768 and up and not below. At the floor,
   the notice stands in for the page (10.4). On a phone, then, a reader meets the Authors on
   the Tree's tile: there one name is whole at every width, on both overviews, and three are
   cut.

5. **Nowhere else.** Not in the editor: its bar is the editor's interface (#180), its right
   side the editor's controls, and the panel's Collaborators section lists the same accounts
   (33.4). Not on the 404 and 403 pages. Not on a Tree that has no Authors -- one whose only
   role holder is the administrator: no element at all, so its bar and its tile are as they
   are today. Nothing changes in the rows of 10.1 or in the Bubble.

6. **The no-scroll rule.** The cut line is the design, not an overflow: it carries
   `data-clamp`, and 10.6's walk skips a `[data-clamp]` in the chrome bar as it skips one in a
   scroll box (26.1). The walk still checks the bar and everything else in it; the spec of
   #197 checks the mention itself -- one line, inside the bar, the mark and the controls where
   they stand without it. It is the one text that 10.4 lets be cut at the guaranteed
   viewport, and the one thing that 10.5 lets give way by its room rather than by a step,
   behind no control: both say so, amended, and so does core document 10.22.

7. **Without JavaScript** the mention is the server's markup and its rules are the stylesheet's
   (a size container, 39.4): nothing to run.

## Alternatives rejected

- **A row of its own on the Node page.** The text area keeps 0.6 pixels at the guarantee (10.7);
  a 20-pixel row would take the description's second line, a change of the limits that is the
  owner's to make.
- **The disclaimer row.** Its sentence alone takes a second line below 580 to 640 pixels wide
  (#179's measurement), and the disclaimer must stay whole and visible on every page (core
  document 8).
- **The band beside the up arrow**, where the editor's floating controls stand (33.1). It is the
  tree layer's, which slides with every step (11.1), so a mention of the Tree would slide out
  and in with each Node; and in the editor it holds #178's buttons and #176's controls.
- **A control that opens a Sheet of the Authors.** The owner asked for a mention, not a control;
  a list without bound in a Sheet would be a sixth scroll box (26.3); and the bar has no room
  for a control on a phone either.
- **A fixed count**, "A, B, C and 4 more". A count cannot know the room, and the line's own cut
  does, at every width and in every face.
- **The bar's mention hidden below a fixed width** (1000, or 480). A 120-pixel logo leaves room
  down to 560 pixels wide and an 80-character title none below 1000: one width cannot serve
  both, and a width says nothing of a third-party logo's.
- **The tile's mention on a line of its own**, under the title. It costs a line of the
  description: with a logo the tile keeps one, and would keep none.
- **The mention in the editor.** As decision 5.
- **"Authored by" / "Auteurs:"**. Nine to twelve characters more on a small line -- the room of a
  name on the creators' tiles -- where "By" / "Door" is a byline's own word in both languages.

## Consequences

- `src/components/Authors.tsx`, a server component, draws the line from the names and the page's
  language; the public Node page (`src/app/[lang]/[tree]/[...path]/page.tsx`) renders it in its
  header, between `.page-brand` and `.page-controls`, and `Tile` in its bottom row.
  `src/app/[lang]/globals.css` holds the size container and the cut. `src/chrome.ts` gains
  `byAuthors`. #197's.
- `no-scroll.spec.ts` skips `.page-chrome [data-clamp]`; `admin-no-scroll.spec.ts` and #181's
  `creation-walk.spec.ts` skip every `[data-clamp]` already (39.6);
  `tests/browser/authors.spec.ts` (new) measures the mention where 10.6 measures pages (39.9).
- A reader of the repository's Trees on the demo server sees no mention until a Tree is handed
  to a person's account (`ADR-195-authors.md` decision 4).
