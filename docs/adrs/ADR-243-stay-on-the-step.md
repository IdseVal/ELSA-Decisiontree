# ADR-243-stay-on-the-step: creating a next step keeps the editor on the step

- Status: ACCEPTED -- 2026-10-12; the owner's instruction of #241, its readings PROPOSED (core
  document 3.4 `[#241]`)
- Issue: #243 -- Creating a next step keeps the editor on the step
- Spec: `docs/specs/application.md` 30.2, 41.7 item 3, 42.7 item 3, 42.8 (the bullet "Creating a
  next step does not slide") and 42.10, amended `[#243]`
- Core document: 3.4 `[#241]`, 10.44 `[#241]`; unchanged here
- Gives way: `ADR-133-structure-editing.md` decision 3 (a fresh next step is created and the editor
  navigates to it) and `ADR-231-slide-in-the-editor.md` decision 9 (a step just created is reached by
  a plain navigation, without a slide), for a next step
- Round record: `ADR-241-small-final-tasks-round.md`

## Context

The owner wrote in issue #241, on 2026-10-12 (core document 3.4 `[#241]` holds the words whole):

> "The "Add a next step" overlay, when clicked moves the user to that new node, let's just make it
> so on pressing the button to create a next step, the view stays on the panel where the user was
> editing."

Until this issue, `confirm` in the `+` Sheet with the switch `Tree ends here` off sent
`POST .../nodes { from: { node, link: 'answer', label } }` and, once the write was accepted, left the
page by `window.location.assign` to the new step (`WordsForm` in `src/editor/Structure.tsx`). With
the switch on, the Sheet closed and the page repainted from the response.

## Decision

1. **PROPOSED readings** (`ADR-241-small-final-tasks-round.md` decision 2): "the button to create a
   next step" is the Sheet's `confirm` with the switch off; "the panel where the user was editing"
   is the step whose `+` was pressed. The side bubble's `+` makes an Option, not a next step, and
   still opens the new side bubble (30.4).
2. **Confirm, the switch off, stays on the step.** The write is the same. Once it is accepted, the
   Sheet closes and the address stays the same: no navigation, no slide. The repaint is the one the
   switch-on case already had: an accepted operation has `router.refresh()` draw the page again
   (`src/editor/Editor.tsx`, "The shape changed"), and the row shows the new next step's button, its
   words a field in place, after the others, with the `+` after it while the step has fewer than five
   next steps (42.7 item 1).
3. **The new button slides, as its siblings' buttons do** (PROPOSED: the owner did not say how the
   new step is reached afterwards). The page drawn again reads the draft with the new Answer, so
   `editorNeighbours` places the new step's frame and the button carries `data-slide` (42.8).
   Measured by `tests/browser/stay-on-step.spec.ts` at 1280 x 640 and 999 x 640, on a step without
   Links, a step of three and a step of four: following the new button right after the creation
   started a slide each time and arrived at the new step. No other way was needed.
4. **Focus** (PROPOSED). When the Sheet closes, the focus goes to the `+`, the Sheet's own control,
   where Escape puts it (`Sheet`'s `close`). At five next steps, where no `+` stands, it goes to the
   new next step's words on its button, through the editor's `focusKey` (28.1).
5. **A refused write** -- a sixth next step (422, V-ANSWERS) or any other refusal -- is shown in the
   Sheet as before, and the Sheet stays open with the words.

## Alternatives rejected

- **Navigate, then come back.** Two page loads for one write, and the history would gain a step the
  creator never chose.
- **Draw the new button on the client before the refresh.** The row and its frames are drawn by the
  server components (34.4); the refresh the operation already makes draws both, and a second drawing
  of the row on the client would have to agree with it.
- **Focus on the new button's words under five too.** The owner asked that the view stay where the
  creator was; the `+` is where a closed Sheet puts the focus by hand, and the creator who adds
  several next steps in a row needs nothing else.

## Consequences

- The editor stays on the step after a next step is made, at every width; the switch-on path and the
  side bubble's `+` are unchanged.
- The browser tests that learned a new step's id from the address they landed on read it from the
  write's response (`confirmNextStep` in `tests/browser/admin.ts`), and a walk that edits the new
  step follows its button (`followNextStep`).
