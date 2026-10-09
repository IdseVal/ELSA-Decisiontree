# ADR-220-editing-next-steps: the editor's Answer row keeps `+ Yes`, `Tree ends here` and `+ No`, adds one `+` that asks for the words, and edits each next step's words in place

- Status: ACCEPTED (frozen) -- 2026-10-09; the owner may overrule (core document 10.43)
- Issue: #220 -- Architecture: freeze how many next steps a step may have
- Spec: `docs/specs/application.md` 3.2, 19.2, 19.7, 22.1, 22.2, 22.4, 28.6, 30.1 to 30.3,
  30.7, 30.8, 33.3, 40.7, 41.7 (new), amended `[#220]`
- Core document: 3.4 (`[#133]` the Answer row, `[#219]`), 10.43
- Supersedes in part: `ADR-133-structure-editing.md` (the Answer row's `+ Yes` / `+ No` as the
  only way to a next step, and `link: 'yes' | 'no'`); `ADR-178-step-buttons.md` is unchanged
- Amends: `ADR-132-editor-api.md` decisions 2 and 3 (`from.link: 'yes' | 'no' | 'option'` and
  `set-answer` naming `yes` or `no`: `link: 'answer'` with a `label`, and `set-answer`,
  `remove-answer` and `move-answer` by index); `ADR-205-unfinished-draft.md` decision 3 (the lone
  button in the editor, decisions 2 and 7 here)
- Built by: #222

## Context

A step without Links offers `+ Yes`, `Tree ends here` and `+ No` (`application.md` 30.1); a fresh
yes or no creates its target with `POST .../nodes { from: { node, link: 'yes' | 'no' } }` and
the editor goes to it (30.2); a step with one Answer shows it and the outlined `+` for the other;
a yes or a no goes with the step it leads to, through that step's red cross (30.7, 30.8). The
fields are edited where the reader sees them, one language at a time (28.1, 28.2). Since #171 a
Terminal's words are asked for in a Sheet before the step ends (36.3).

## Decision

1. **A step without Links** offers four outlined buttons in the row: `+ Yes`, `Tree ends here`,
   `+ No` and `+` (`addNextStep`). `+ Yes` and `+ No` make the owner's first case one click each,
   as today: each creates a next step labelled with the chrome word `yes` or `no` in every
   language of the Tree by 3.1's rule. `+` opens a Sheet with one field, the words on the button
   (`nextStepWords`, at most 19, in the language being edited), and `confirm` creates the next
   step with those words, every other language empty, as a to-do.
2. **A step with next steps** shows them as the public row does (`ADR-220-answer-row.md`), each
   button's label a **field** in place, in the language being edited, counted against 19 as
   every field is (28.4); and, while it has fewer than four, one outlined `+` after the last,
   which opens the same Sheet. **While the step has one next step**, the one-click `+ Yes` and
   `+ No` stand before that `+`, but for the one whose word its label already says in the language
   edited: a yes and a no still cost one click each. It never shows `Tree ends here`: a step that
   leads on does not end, as today.
3. **Creating navigates**: the new step is created with its Link in one write, `POST .../nodes
   { from: { node, link: 'answer', label } }`, appended last, and the editor goes to it, as 30.2
   does. A fifth is refused (422, V-ANSWERS) and stores nothing.
4. **The order** is the order made; each button but the first carries `moveEarlier` and each but
   the last `moveLater`, 24-pixel round controls on its outline, which send `move-answer {
   index, to }`. The page repaints, the buttons in their new order.
5. **Removing a next step** is deleting the step it leads to, from that step's own page, with
   its red cross (30.7, 30.8, #178): the delete removes every Answer that names it in the same
   write. The step it was taken from keeps the rest in their order, shows `+` again, and, left
   with one next step, lists "fewer than two next steps" among its to-dos (19.2, 33.3).
6. **Writes**: the field `answers[i].label.<lang>` (22.2); the operations `set-answer { index,
   target }`, `remove-answer { index }` and `move-answer { index, to }` (22.2), `link: 'answer'`
   with its `label` in the structural write (22.4), in place of `'yes' | 'no'`. `remove-answer`
   on the last entry removes `answers`, as today.
7. **A draft step with one next step** is drawn as it stands, its one button centred, as 40.7's
   preview draws a lone Answer today; an empty label in the language shown is the preview's
   bracketed placeholder (40.7).
8. **The editor's no-scroll rule (28.6)** holds for four buttons, and for `+` beside three: the
   row stands as the public row does for its number of buttons, the `+` and the empty step's four
   counted as buttons; with three or more, the editor shows the notice below 390 pixels wide by
   `ADR-220-answer-row.md` decision 6, at the height #222 measures on the editor's page (the
   highest need, rounded up to ten, never below the public page's). #222 measures it in
   `admin-no-scroll.spec.ts` at the editor's viewports.

## Alternatives rejected

- **Only `+` on an empty step**, the yes and the no typed by hand. The owner's first case, "Some
  trees might consist of yes or no", would cost a Sheet and two fields per step, where it costs
  one click today.
- **`+` creating the step at once and the words typed afterwards on the parent's button.** The
  editor goes to the new step, so the creator would have to come back up to word the button they
  just made; the ending's words are asked for first for the same reason (36.3).
- **Dragging the buttons to reorder them.** No other control of the editor drags, and dragging
  needs a pointer; the arrows are the images' own (31, `moveEarlier` / `moveLater`).
- **A "remove next step" control that keeps the step it led to.** #178 took the link menu out on
  the owner's words, "if a user wants to delete a tree step he has to do it inside that tree step";
  a next step goes with its step, as a yes or a no does today.
