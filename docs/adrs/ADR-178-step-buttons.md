# ADR-178-step-buttons: a red cross and 'Tree does not end here after all' stand beside the up arrow in place of the step menu, and no Answer or Option button carries a `...`, so the editor no longer re-points a button at an existing step

- Status: ACCEPTED -- 2026-10-02
- **Amended 2026-10-04 by issue #205** (`ADR-205-ending-button-on-a-hidden-tree.md`): in decision 2,
  in the editor of a hidden Tree, while the preview button the owner placed at the top left is on
  the page, "Tree does not end here after all" keeps out of its column below 1000 pixels wide
  and is a round button of the cross's size with a glyph, named by its words, below 640. From 1000
  pixels wide, and on a published Tree at every width, it stands as decision 2 says. The rest
  stands.
- Issue: #178 -- Editor: a red cross and 'Tree does not end here after all' in place of the step's ... menu, and no ... on the yes, no and side-bubble buttons
- Spec: `docs/specs/application.md` 28.1 (the drawing), 28.6, 30.1, 30.6, 30.7 and 30.8, each amended 2026-10-02; 3.2 (the keys), 28.4, 30.9, 33.1, 34.2 and 34.4 with them
- Supersedes: `docs/adrs/ADR-133-structure-editing.md` decision 7 (the link menu and the picker), and in decision 8 the step menu on the rim with its `removeEnd` (decision 4 names it)
- Depends on: `docs/adrs/ADR-177-side-bubble-editing.md` (the side bubble's delete, the way to remove one now), `ADR-176-floating-settings-and-to-do.md` (the floating controls in the same band), `ADR-169-tree-creation-ui-round.md` decision 5 (the reading #178 was filed with)

## Context

The owner walked the editor and wrote, in #169:

> "Instead of the ... dots on the top right with options, just make two buttons a red cross to
> delete the step, or if it applys, 'tree does not end here after all. There are also some dots
> ... far out of the next steps of the decisiontree, don't have that there, if a user wants to
> delete a tree step he has to do it inside that tree step."

ADR-133-structure-editing decision 8 put a 24-pixel round `...` on the Bubble's rim above, right
of the up arrow: a Sheet with the step's id, `removeEnd` on a Terminal and `deleteStep` with its
confirmation. Decision 7 gave every Answer button and every Option button a `...` at its outer
end: a Sheet with `changeTarget`, which opened a picker of every Node of the draft, and
`removeLink`. #176 put two floating controls -- the to-do count and "Decision-tree settings" -- in
the band above the Bubble at the top right.

Measured on this branch before the change (`.elsa-data` scratch, Segoe UI, the full Node's Tree):
right of the up arrow, the floating controls leave 46.5 pixels at 1000 x 700 in Dutch with three
things to do (the arrow's edge at 524, the to-do control at 570.5), 58.5 at 1024 x 768, and 186.5
at 1280 x 640. The words "Tree does not end here after all" are 177 to 192 pixels wide at 12 and
13 pixels semibold in Arial, the face the CI runner draws. Left of the arrow the band holds
nothing at any width.

## Decision

1. **Two buttons stand in the step menu's place**, in the band above the Bubble, beside the up
   arrow and out of the Bubble's box: the **red cross** `deleteStep` on every step but the root,
   and on a step that ends the tree **"Tree does not end here after all"** (`removeEnd`, "Boom
   eindigt hier toch niet"), which sends `remove-terminal` at once, as the menu's `removeEnd` did.
   The root has no cross; a root that ends the tree has the words alone.
2. **The words stand left of the arrow; the cross right of it below 1000 pixels wide and left of
   it from 1000**, between the arrow and the words. From 1000 pixels the floating controls show
   their words in the band right of the arrow and leave it 46.5 pixels at 1000 x 700 in Dutch,
   fewer with a longer state word or count; the words need about four times that. Below 1000 the
   controls are icons, and the cross stands where the `...` stood. The buttons sit on the arrow's
   middle, 32 tall, where the arrow stands above the outline, and in the middle of the band
   below 640 pixels of height: 24 tall in its 26, the words on one line of 11 pixels, or 32 in a
   phone's 40; below 480 pixels wide the words take two lines of 11 pixels.
3. **The cross asks once, in place.** A panel hung under the band, in the middle of the Bubble,
   over the Sheets' veil, names the step's title as it stands then -- or says the step has no
   title yet -- with `confirm` and `cancel`, the focus on `cancel`; Escape, `cancel` and a click on
   the veil keep the step and give the focus back to the cross. `confirm` deletes as decision 8
   did: every Link to the step in the same write, then the parent or, with no Trail, the root.
4. **The cross's name and hover text is "Delete this step"**, its `title`, as the account link's
   tooltip is (#176). The step's id, which the menu showed, is dropped: it is in the page's
   address and nowhere else on the screen.
5. **No Answer or Option button carries a `...`**, in the centre or in an Overlay. A yes or a no
   is removed with the cross of the step it leads to, which frees the slot on the step before
   (22.4); a side bubble with `deleteSideBubble` (#177). **"Lead somewhere else" is no longer
   offered**: the editor stops offering to point a button at an existing step. A Tree that already
   has two buttons leading to one step keeps working. `set-answer`, `add-option`, `remove-answer`
   and `remove-option` stay in the server interface.
6. **What nothing uses goes**: `LinkMenuForm`, the picker, the `linkMenu` slot and their styles;
   the chrome keys `createNew`, `linkMenu`, `changeTarget`, `removeLink`, `stepMenu`; and the
   picker's index of every Node of the draft, which the editor page built on every request -- the
   side bubble's delete names its aside from the Node the page reads for its Overlay.

## Alternatives rejected

- **Both buttons right of the arrow, where the `...` was.** From 1000 pixels the floating controls
  leave the words no room there (46.5 pixels at 1000 x 700 in Dutch), and the issue asks that the
  buttons stay clear of them at every size.
- **Both buttons left of the arrow at every width.** On a phone the words take two lines of about
  110 pixels, and the cross with its gaps 48 more; 136 are left of the arrow at 321 pixels wide.
- **The cross right of the arrow from 1100 pixels, where the default words of the controls leave
  it room.** The controls are set in the Tree's body face, which a Theme may make wider (#180
  proposes the default face for them); left of the arrow nothing else stands, whatever the face.
- **A Sheet behind the cross, as the menu was.** Its own close button would stand beside
  `cancel`, or a second cross in its corner beside the red one; and a Sheet keeps the focus on
  its summary, so a second Enter after Tab would be `confirm`. The panel puts the focus on
  `cancel`, as #177's delete does.
- **The question in the band itself, the cross turning into it.** A title of 80 characters with
  the sentence and two buttons needs a panel's width; the band beside the arrow is 26 pixels tall
  below 640.
- **The step's id in the hover text.** The hover text names what the button does; the id is a
  word of the address.
- **Naming an untitled step by the placeholder** ("Delete "Text missing in this language"?"), as
  the menu did. A step made by mistake and deleted at once has no title; #177's side bubble says
  so in words, and the cross says it the same way.
- **Keeping "Remove this link" somewhere else** -- in an Overlay, or behind a long press. The owner
  asked for no dots on the buttons that lead on, and for a step to be deleted from inside itself;
  a hidden way to unlink is the dots by another name.

## Consequences

- `src/editor/StepButtons.tsx` (in place of `StepMenu.tsx`) holds `DeleteStep` and `RemoveEnd`; the
  `EditorSlots` member `stepMenu` is `stepButtons`, and `linkMenu` and `LinkRef` are gone.
- `src/chrome.ts` loses `createNew`, `linkMenu`, `changeTarget`, `removeLink`, `stepMenu` and
  `pickTarget` (the picker's heading, which 3.2 did not list), gains `confirmDeleteUntitled`, and
  `removeEnd` says "Tree does not end here after all" / "Boom eindigt hier toch niet".
- `tests/browser/step-buttons.spec.ts` walks the decisions; `structure.spec.ts`,
  `admin-no-scroll.spec.ts` and `floating-controls.spec.ts` no longer go through the menus.
- **What the editor no longer does.** It no longer re-points a yes, a no or a side bubble at an
  existing step, and no longer removes a Link alone: where a yes or a no is to go, its step goes
  with it, and where two Answers lead to one step, that step's cross takes both. An Option that
  leads to the root -- the old picker could make one on any other step -- cannot be removed with
  `deleteSideBubble`, since the root is never deleted (409, said in the panel); the cross of the
  Option's own step removes it, with that step.
- No flow of the editor leaves a draft that cannot be published and cannot be repaired from the
  screen: every advisory of the structure (V-ANSWERS, V-OPTIONS, V-ROOT, V-REACH, V-ORPHAN) is a
  line of the to-do list that leads to its step's page, where the `+`, the ending's buttons, the
  side bubble's delete or the cross repairs it, if need be by deleting a step. The pull request
  lists what was checked.
