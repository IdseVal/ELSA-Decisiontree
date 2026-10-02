# ADR-177-side-bubble-editing: one click on the + opens a new side bubble, its button's title follows the aside's, its Sources are entered as the centre's, it offers no new side bubble, and 'Delete side bubble' at its foot deletes it

- Status: ACCEPTED -- 2026-10-02
- Issue: #177 -- Editor side bubble: the + opens it at once, its Sources can be entered, no 'New side bubble' inside it, and a 'Delete side bubble' button at the bottom
- Spec: `docs/specs/application.md` 30.4, 30.5 and 30.7, each amended 2026-10-02; 19.2 (`Draft.referrers`), 34.2 (the `sideDelete` slot) and 3.2 (the keys) with them
- Supersedes: `docs/adrs/ADR-133-structure-editing.md` decision 5 (the Sheet behind the side-bubble `+`, with `createNew` and `linkExisting`) and the part of decision 6 that gives the Overlay's list a last entry `+ newSideBubble`
- Depends on: `docs/adrs/ADR-172-typing-stops-at-the-limit.md` (the field rules the side bubble shares), `ADR-169-tree-creation-ui-round.md` decision 5 (the readings #177 was filed with)

## Context

The owner walked the editor and wrote, in #169:

> "The side bubble should just open the side bubble, where the title and the text inputs, and
> the image can be entered, following the same rules for input boxes as the main bubble."

> "Sources are for some reason not entereable in the side bubble?"

> "There is a 'new side bubble' button in the side bubble pane, this does not belong there,
> there should be below in the middle a 'Delete side-bubble' button, which deletes the one that
> is opened."

ADR-133-structure-editing decision 5 made the fan's `+` open a Sheet with two choices,
`createNew` (one field, the title) and `linkExisting` (the picker), and decision 6 gave the
Overlay's list of second-level Options a last entry, `+ newSideBubble`. A side bubble was
removed through its button's `...` menu (`removeLink`), which leaves its Node in the draft.

Reproduced on `dev` before this change, and on the `dev` of 2026-09-27 the owner walked:

- Below 564 pixels of height or 792 of width, step 6 of 10.5 hides every inline `.sources` block
  and shows the collapsed copy the Bubble renders. An Overlay rendered none, so a side bubble's
  Sources -- their lines and `+ addSource` -- were on no part of the page there.
- In the editor the Overlay's title field stands inside its heading's link to the aside's
  address (10.9). A click in it followed the link: the page reloaded, two frame navigations per
  click, and the field lost the focus before a key was typed.
- Opening a Sheet inside an Overlay's panel ran the Overlay's own `onToggle` too, which put the
  focus on the Overlay's cross, so one Escape closed the side bubble instead of that Sheet.

## Decision

1. **One click on the `+` opens a new side bubble.** The `+` is a button: `POST .../nodes { from:
   { node, link: 'option' } }` with no title creates the Node and the Option in one write, each
   titled `""` in every declared language (22.4), and the editor goes to the aside's address
   under the page, where its Overlay is open with every field empty and named by its placeholder.
   No Sheet and no choice: `linkExisting` is no longer offered from the `+` (ADR-169 decision 5),
   and `add-option { target }` stays in the API.
2. **The Option button's title follows the aside's.** They stay two fields of the format (60 and
   80 characters). While the aside's title is typed, the button's takes each new text cut to 60
   whole characters, as long as it was empty, or the aside's title so cut, when the editing began.
   A title edited on the button itself stays as written.
3. **No `+` in an Overlay.** Second-level Options a Tree has are still listed and still open
   (10.9). An aside opened as its own page is the centre, and its fan has the `+`.
4. **The side bubble's fields are the Bubble's**: the same `Field`, with #172's placeholders,
   box sizes and stop at the limit. A click in a field does not follow a link around it. Below the
   guarantee the side bubble's Sources are edited in their collapsed Sheet, as 28.6 has the
   Bubble's, of a `<details name>` group of its own, so it opens inside the Overlay without
   closing it. A Sheet acts on its own toggle only, so a Sheet opened in an Overlay keeps the
   focus and its Escape.
5. **'Delete side bubble' at the foot of an opened side bubble, in its middle**, outlined in
   `danger`. It asks once, in place, naming the side bubble's title as it stands, the focus on
   `cancel`. Confirmed, it deletes the aside's Node with every Link to it in one write
   (`DELETE .../nodes/<id>`, 22.4), or, when another Node leads to the aside too, removes only this
   step's Option and says so. The page knows which from the draft's index (`Draft.referrers`:
   ids, never a Node read). Then the editor goes to the step's own address: the Overlay closes and
   the fan closes the gap. What the aside led to stays, as for every deleted step (30.8, 30.9).

## Alternatives rejected

- **The Sheet with one field left in place of the two choices.** The owner asked for the side
  bubble itself on the click; the title is typed in it, and the button's follows.
- **The side bubble's Sources inline at every size.** Measured on the Overlay fixture's side
  bubble at every maximum, it overflowed its panel on a phone: 595 of 590 pixels at 360 x 640 in
  English, 635 in Dutch, 647 and 687 with the delete asking. The collapsed Sheet fits at every
  viewport of 10.6 and is what the Bubble already does.
- **Deciding at the write whether the aside is shared**, as one new operation of the store. It
  is an addition to the closed set of 22.2 for what the page can know from the index it reads.
- **Reading every Node of the draft on the page to find the asides' referrers.** It breaks 34.7's
  bound of twelve Nodes; the index answers ids.
- **Deleting the aside's Node always.** It would take the side bubble away from another step that
  leads to it.
- **A filled red button at every side bubble's foot.** The one filled red block is the one that
  deletes: the confirmation's.
- **Collapsing the public Overlay's Sources as well.** The public page's Overlay is out of
  #177's scope; it is left as it was.

## Consequences

- `src/chrome.ts` loses `linkExisting` and `sideBubbleTitle` and gains `deleteSideBubble`,
  `confirmDeleteSideBubble`, `confirmDeleteUntitledSideBubble` and `sideBubbleStays`.
- `EditorSlots` gains `sideDelete(node, index)`; `sideAdd` draws on the centre only; `Draft` gains
  `referrers(id)`; `Field` takes a `follower`.
- `tests/browser/side-bubble.spec.ts` walks the change; `structure.spec.ts`, `admin.spec.ts` and
  `admin-no-scroll.spec.ts` no longer go through the Sheet behind the `+`, and
  `admin-no-scroll.spec.ts` measures the side bubble at every maximum by its address.
- The public Overlay still shows no Sources below 564 pixels of height or 792 of width.
- #178 removes the `...` menus on the Answer and Option buttons next; the side bubble's delete
  is the way to remove one once they are gone.
