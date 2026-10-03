# ADR-180-editor-interface-not-themed: in the editor the draft's Theme paints the Tree, and the editor's own interface -- its chrome bar, its floating controls, the panels of its Sheets -- keeps the application's default look

- Status: ACCEPTED -- 2026-10-02
- Issue: #180 -- Theme panel: colours that leave the editor's own bars alone, the text colour
  on the Sources, font and licence dropdowns, information hints
- Owner's request: #169 (2026-10-02)
- Spec: `docs/specs/application.md` 13.1, 24.3 and 33.8, amended 2026-10-02; 13.1 and 24.3
  again on 2026-10-03, after #177 and #178 merged first
- Supersedes in part: `ADR-133-admin-routes.md` decision 6 -- "the editor emits its **draft's**
  Theme" -- for the editor's own interface. What stands and what changes is below.
- Depends on: `ADR-38-theme-delivery.md` (the one `<style>` string of `src/theme.ts`, the
  stylesheet that names no colour), `ADR-176-floating-settings-and-to-do.md` (the floating
  controls), `ADR-133-top-panel.md` (the panel), `ADR-177-side-bubble-editing.md` and
  `ADR-178-step-buttons.md` (the editor's controls that merged before this decision)

## Context

The owner walked the editor and listed what must change (#169):

> "Changing the color features are great, but don't make it change the sidebar or header
> colors, that makes it very difficult to follow the UI."

Since #133 the editor page emits its draft's Theme, the whole of it, as the page's
(`ADR-133-admin-routes.md` decision 6; `application.md` 24.3, the editor's row: "The draft's"),
so that a creator sees a colour before publishing it (#144). The header bar, the settings panel
the creator is working in, the to-do bubble, the floating controls and every Sheet the editor
opens took the palette and the fonts as they changed: a creator who chose a dark page saw the
bar and the panel turn dark under the pointer.

## Decision

1. **The draft's Theme paints the Tree; the editor's own interface keeps the default look**
   (13.4). The Tree is what a visitor will see: the page behind the Bubble, the Bubble, the
   Option and Answer buttons, the Overlay, the pictures' strip and the enlarged view, the
   disclaimer. The editor's own interface is what no visitor sees: the chrome bar, the
   floating controls with the panel and the to-do bubble they open, and the panel of every
   Sheet only the editor opens -- a Source's `...`, `+ addSource`, the end of a tree, ~~a link's
   and a step's menu~~ (**[#178]** gone, below), the explainer Sheet, the picture's attach
   Sheet, the session Sheet -- and **[#178]** the panel the step's red cross asks in. These
   keep the application's default colours and type stack whatever the creator picks.
   The controls that stand in the Tree itself -- the fields, the Sheets' own buttons in the
   Bubble and its rows -- are drawn as the Tree is, because they are where the creator shapes
   what the visitor sees. Since #177 two more controls are drawn this way, because neither
   opens a panel and both stand on the Tree's colours (`ADR-177-side-bubble-editing.md`):
   - the side-bubble `+` in the fan, which creates at one click with no Sheet behind it;
   - `deleteSideBubble` at the foot of an Overlay, with the confirmation it asks in place.

   **[#178], 2026-10-03.** #178 took away every link menu and the step menu
   (`ADR-178-step-buttons.md`), two of the Sheets listed above. What replaced the step menu
   divides as the menu did, its button in the Tree and its panel the editor's own:
   - the step's red cross and "Tree does not end here after all" stand beside the up arrow, in
     the band above the Bubble, as the arrow does and as the menu's `...` did. Neither is a
     Sheet: they are drawn as the Tree is;
   - the question the cross asks is a panel hung over the Sheets' veil, as the menu's Sheet
     panel was, and only the editor opens it. It carries `data-editor-ui` and keeps the default
     look, its `confirm` filled with the default's `danger`. #177's question is drawn as the Tree
     is because it stands in the Overlay itself, in place; this one has a panel of its own.
2. **One string still, built by `src/theme.ts`.** In the editor `themeStyle` writes the draft's
   `:root` block as before and, after it, the default palette and type stack again on
   `[data-editor-ui]`, which the bar, the floating controls and those Sheets' panels carry; the
   stylesheet derives its shades again there (`--rule`, `--wash`, the reading shades) and gives
   those elements their own text colour and face, since what they would inherit from the page
   is the draft's. No colour and no family name enters the stylesheet (13.5); the default block
   is built from the same constants as a Tree without a Theme, so 13.3's escaping is unchanged.
3. **The logo in the bar stays the Tree's**, and its variant is the one for the bar it now
   stands on: the default's light background, so `logo.light` -- by 13.1's own rule, that the
   variant follows the background behind it. A dark Theme's white logo on the default's bar
   would vanish.
4. **The public page is unchanged**: there the whole page is the Tree's Theme, bar included.
   The block and the attribute are the editor's alone.

What of `ADR-133-admin-routes.md` decision 6 stands: every page emits its own Theme, once,
through `ThemeStyle`; the public page emits its published Tree's and the Tree-less pages the
default; the editor's element is keyed by the CSS's hash and the draft revision (#144). What
changes: in the editor the draft's Theme reaches the Tree and not the editor's own interface.

## Alternatives rejected

- **The draft's Theme on the Tree's container instead, the default on `:root`.** The page
  behind the Bubble is the body's background and the disclaimer is outside the tree view, so
  both would leave the Tree's look; and the editor's own Sheets open inside the tree view's
  markup, so they would need the default declared again on them anyway. The two directions
  cost the same markup, and this one leaves the public page's `:root` as it is.
- **A second stylesheet for the editor with the default's values written in it.** It puts
  colour and font literals in a stylesheet, which `stylesheet.test.ts` forbids (13.5,
  `ADR-38-theme-delivery.md` decision 10), and it would drift from `DEFAULT_COLOURS`.
- **The editor's controls in the Bubble in the default look too** (the fields, `+ Yes`, the
  `...` buttons). The owner asked about the sidebar and the header; the controls in the Bubble
  are drawn on the Bubble's colours and would read as stickers on the Tree the creator is
  building, which "looks exactly like the final datastructure" (core document 3.4).
- **The dark variant of the logo in the default's bar.** It is drawn for a dark background;
  on the default's light bar a white mark disappears.

## Consequences

- `tests/browser/theme-panel.spec.ts` measures it: after the palette of a Tree with no Theme
  changes to a dark one, the bar, its account link, the two floating controls, the panel and
  the panel's heading are painted exactly as before, while the Bubble and its Sources take the
  palette; a dark Tree's editor shows `logo.light`, its public page `logo.dark`. On the dark
  Tree, #177's `+` and delete and #178's cross and words take the draft's colours under no
  `[data-editor-ui]`, and the cross's question is painted in the default.
- The to-do bubble's count is filled with the default's accent, not the draft's (33.3): it is
  part of the floating controls.
- #177's `deleteSideBubble` is outlined in the draft's `danger`, and its confirmation's button
  is filled with it; #178's red cross is outlined in it too, and filled with it under the
  pointer. So `colourDangerHint` names "the buttons that delete a step or a side bubble" among
  what the role paints. The cross's question is filled with the default's `danger`.
- A Sheet the editor adds later carries the attribute too: `Sheet`'s `editorUi`, or
  `data-editor-ui` on a panel it draws itself.
