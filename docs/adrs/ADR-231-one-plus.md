# ADR-231-one-plus: the editor's row offers one `+` wherever a step can take another next step; its Sheet holds a switch, `Tree ends here`, and one field

- Status: ACCEPTED (frozen) -- 2026-10-10; the owner may overrule (core document 10.44)
- Issue: #231 -- Architecture: the round of #230
- Spec: `docs/specs/application.md` 3.2, 28.6, 30.1, 30.2, 30.3, 36.3, 41.7, 42.7 (new), amended
  `[#231]`
- Core document: 3.4 (`[#133]` the Answer row, `[#169]` the ending's words, `[#230]`: the readings of
  "just one + button", "the overlay" and "toggle (tree ends here) or put the title of the button",
  confirmed), 10.44
- Supersedes in part: `ADR-220-editing-next-steps.md` (decisions 1 and 2: `+ Yes`, `Tree ends here`
  and `+ No` in the row of a step without Links, `+ Yes` and `+ No` beside one next step, a `+`
  while fewer than four; and decision 8's notice, which holds for a row of three or four buttons); `ADR-133-structure-editing.md` as superseded in part by #220 (the row's
  buttons)
- Amends: `ADR-171-ending-text.md` decision 7 (the `treeEndsHere` Sheet: its field stands in the
  `+`'s Sheet behind a switch); `ADR-220-words-on-a-next-step.md` decision 3 and
  `ADR-220-other-readers.md` decision 4 (the chrome keys `yes` and `no` stay for `+ Yes` and `+ No`:
  they go); `ADR-230-tree-creation-round.md` decision 5 (the readings of the `+`)
- Built by: #233

## Context

The owner, on #230: "In the tree creation view, currently there are three buttons (yes, tree ends
here, no, +). I want there to just be one + button that the user can click, which opens the overlay in
which the user can toggle (tree ends here) or put the title of the button. Then the user can decide
how many he wants, there can be up to 5." In the editor (`/admin/trees/...`, 41.7) a step without
Links offers four outlined buttons, `+ Yes`, `Tree ends here`, `+ No` and `+`; `+ Yes` and `+ No`
create a next step in one click, worded with the chrome word; `+` opens a Sheet with one field,
`nextStepWords`, at most 19; `Tree ends here` opens a Sheet of its own with one field, `endingText`
(36.3), and ends the step with those words. A step with next steps shows a `+` after the last while it
has fewer than four, and while it has one, `+ Yes` and `+ No` before it. A step with Options cannot
end (V-TERMINAL, 422, shown in the Sheet, 30.3). The chrome keys `yes` and `no` are read by the
editor alone (41.6).

## Decision

1. **"The tree creation view" is the editor**, and its "three buttons (yes, tree ends here, no, +)"
   are 41.7's four: confirmed as read.
2. **One `+` wherever a step can take another next step**: on a step without Links, alone in its row;
   on a step of one to four next steps, after the last; none on a step of five. `+ Yes`, `+ No` and the
   row's `Tree ends here` go -- also from beside a step's one next step. The `+` is the outlined button
   it is today, named `addNextStep`, counted in the row (`ADR-231-answer-row.md` decision 4).
3. **"The overlay" is the `+`'s Sheet**, the editor's dialog, not the side child's **Overlay**:
   confirmed as read. Titled `addNextStep`, it holds:
   - **a switch, `treeEndsHere`** (`role="switch"`, off when it opens), on a step without Links only,
     where `Tree ends here` stood: a step with next steps cannot end;
   - **one plain field** in the language edited, focused, its limit of 19 shown live and typing
     stopping at it: off, labelled `nextStepWords` -- "the title of the button" is the button's own
     words, not the next step's title, which is edited on that step's page -- on, labelled
     `endingText`, the ending's words, since a Terminal carries its creator's words (#169). Turning
     the switch keeps what the field holds;
   - `confirm` and `cancel`, `confirm` enabled once the field holds a character that is not white
     space, Enter confirming.
4. **Confirm sends today's structural writes**: off, `link: 'answer'` with the words, appended last,
   the editor going to the new step; on, `link: 'end'` with the words, the page repainting with the
   badge. No write changes but the count (a sixth is 422, V-ANSWERS); the server checks every write
   for the account and the Tree as before (core document section 9).
5. **A step with Options keeps the switch.** Confirmed on, the store's 422 (V-TERMINAL) is shown in
   the Sheet as today, and the switch and the words stay, so that the creator can turn it off and add
   a next step instead, or close the Sheet and remove the Options.
6. **The chrome keys `yes` and `no` go**, in both languages: their last readers were `+ Yes` and `+
   No`. `treeEndsHere`, `addNextStep`, `nextStepWords` and `endingText` stay; no key is added.
7. **What stays**: a next step's words as a field in place, the move arrows, removing a next step
   through its step's red cross, and "Tree does not end here after all" (`removeEnd`, 30.8), which
   gives the row its `+` back.
8. **The editor's notices**: a row of three or four buttons keeps 41.7 item 8's; a row of five --
   five next steps, or four and the `+` -- shows `ADR-231-five-next-steps.md`'s.

## Alternatives rejected

- **Keeping `+ Yes` and `+ No` as one-click shortcuts beside the `+`.** The owner asked for "just one +
  button"; a yes and a no now cost the Sheet and two words each, which the owner's words accept.
- **The switch on every step, ending a step that has next steps.** A Terminal has no next steps
  (`tree-format.md` 5.5); the switch would have to remove them, a delete hidden in a toggle.
- **Hiding the switch, or disabling it, on a step with Options.** The editor shows what a role may
  not do but never decides it; the store's refusal already says why (V-TERMINAL), in the Sheet, where
  the creator can turn the switch off. A disabled switch would need words of its own to say why.
- **Two fields, one per state, both kept.** One field in either state is what the owner described:
  "toggle (tree ends here) or put the title of the button".
- **Hiding the `+` of a step of four where a row of five shows the notice**, so that four keep #222's
  row on a phone. The only way to a fifth next step would depend on the window's size, and the row --
  and so where each button's slide goes -- on its height too.
- **A heading that follows the switch** (`addNextStep` off, `treeEndsHere` on). The Sheet's name
  would change under a screen reader while it is open; the switch says what it does.

## Consequences

- #233 removes `AnswerAdd` and the `+ Yes` / `+ No` and `treeEndsHere` slots from
  `src/admin/slots.tsx` and `src/editor/Structure.tsx`, gives `WordsForm` the switch and the two
  labels, offers the `+` while a step has fewer than five, removes `yes` and `no` from `src/chrome.ts`,
  and tests the row, the Sheet in both states, a refusal in it, and the editor's no-scroll rule with
  a row of five (42.10).
- A creator who wants a yes and a no types them: two Sheets where two clicks were.
- A step of four next steps in the editor is a row of five buttons and shows the editor's notice for
  five, at 360 x 640 too.
- What becomes untrue: 41.7 items 1 to 3, 30.1's row, 30.2's `+ Yes` and `+ No`, 36.3's `treeEndsHere`
  as a button of the row, 3.2's `yes` and `no`, and core document 3.4's `[#133]` row and its `[#220]`
  confirmation; each carries a dated line naming this ADR, and `ADR-220-editing-next-steps.md`,
  `ADR-133-structure-editing.md`, `ADR-171-ending-text.md`, `ADR-220-words-on-a-next-step.md` and
  `ADR-220-other-readers.md` a dated line.
