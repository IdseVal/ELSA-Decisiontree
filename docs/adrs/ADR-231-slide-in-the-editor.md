# ADR-231-slide-in-the-editor: the editor slides as the public page does, from a next step's button and the up arrow, within eighteen Nodes, its navigation waiting for the autosave

- Status: ACCEPTED (frozen) -- 2026-10-10; the owner may overrule (core document 10.44)
- Issue: #231 -- Architecture: the round of #230
- Spec: `docs/specs/application.md` 11.3, 29.2, 29.5, 30.2, 34.5, 34.7, 42.8 (new), amended `[#231]`
- Core document: 3.2 `[#230]` and 3.4 `[#230]` (the reading "in the editor too", confirmed; the
  reading "the editor slides to" a new next step, replaced), 3.4 (`[#131]` "the editor looks exactly
  like the final Tree"), section 9, 10.44
- Depends on: `ADR-231-slide-toward-the-button.md`, `ADR-231-one-plus.md`
- Amends: `ADR-133-reuse-rule.md` (decision 7's editor page renders no neighbour frame, no `data-slide`,
  and reads at most twelve Nodes); `ADR-133-structure-editing.md` (30.2's "a plain navigation, no
  slide"); `ADR-205-preview-drawing.md` ("nothing slides there", of the editor's page);
  `ADR-230-tree-creation-round.md` decision 5 (the readings of the slide in the editor)
- Built by: #234

## Context

The owner's words on #230 open with "In the tree creation view" -- the editor -- and ask that "when
click, the view slides in the direction of the button ... and when the user presses back, it goes in
the same path backwards, but we already solved that I think". The public page and the preview slide
(11.1, 11.3, 40.2); the editor does not: its page renders no neighbour frame and no `data-slide`, and
every control is a plain link (34.5; 30.2), within twelve Nodes (34.7). The round record took the
widest reading, the editor sliding too, and named it so (`ADR-230-tree-creation-round.md` decision 5).
In the editor a next step's words are a field on its button and its move arrows are controls on it
(41.7 items 2 and 4). Every write goes through one queue, which can be waited for (`settle()`, 29.2);
while it holds a write not yet accepted, leaving the page asks the browser's `beforeunload` question
(29.5). The preview's button leaves only once the queue settles (40.6).

## Decision

1. **The editor slides**, as the public page does: following a next step's button or the up arrow
   slides the layer by `ADR-231-slide-toward-the-button.md`'s rule, and the way back retraces it. The
   reading is confirmed: the owner's request is about the view they named, and the slide "we already
   solved" is the public page's, which the editor is to look like (3.4, `[#131]`).
2. **The frames: the parent and the centre's next steps, by the editor's row.** The page calls
   `editorNeighbours` (`src/neighbourhood.ts`, beside `neighbourhood`): at most 1 + 5 placements, each
   next step at `across(i, k)` with *k* its row's buttons, the `+` counted while there are fewer than
   five, and the parent at the negated place of the centre's button in the parent's row as the editor
   draws it. Nothing is placed two levels down. A frame is drawn as the preview draws a draft's: the
   public components with no slot, a bracketed placeholder where the draft has no text yet (40.2,
   40.7).
3. **The bound: eighteen Nodes**, the twelve of 34.7 and the six placed, a contract as twelve was.
4. **What slides**: a next step's button and the up arrow, marked `data-slide` where their `href` is a
   placement's; a click that its field or a move arrow takes does not slide, as it does not navigate
   today. The `+`, `startAgain`, the Options and every Sheet's entries do not slide.
5. **The autosave decides when the navigation starts, not whether the slide does**: the layer moves at
   once and the client navigation waits for `settle()` -- every field value waiting out its 600 ms
   written at once, then nothing not yet accepted -- the layer holding at the target as for a slow
   payload. While the queue retries a failed write, the control does not slide: it is followed as the
   plain link it is, and `beforeunload` asks, as today. A refused value goes with the page, as on a
   reload.
6. **An open Sheet is closed first** (11.3); what it held unconfirmed goes with it.
7. **A history step slides back** when the payload is in the framework's cache (11.3), and the page it
   arrives at reads the draft again once the slide ends (`router.refresh()`), so that the editor never
   stands on a draft older than the store's.
8. **Creating a next step does not slide**: the new step did not exist when the page was drawn, so no
   frame of it stands ready; the editor goes to it by a plain navigation, as today. The round record's
   reading that "the editor slides to it" is replaced; the owner's words are about "buttons to navigate
   down the tree", and the `+` creates.
9. `prefers-reduced-motion: reduce` removes the motion and keeps the navigation, after `settle()`.

## Alternatives rejected

- **The slide on the public page and in the preview alone**, the narrower reading. The owner's request
  opens with the editor, and asks for the slide there; #234 would have nothing to build. The owner may
  overrule this on #230 or #231, and #234 then stops (its CONTEXT says how).
- **The editor's frames placed as the public page places them**, by its next steps alone. In the
  editor the `+` stands last in the row, so the next steps stand elsewhere: the second of three stands
  left of the middle beside the `+`, and would slide straight down.
- **Two levels down in the editor, as on the public page.** No button of the editor's page leads there,
  and the editor's page is the heavier one: its centre carries its fields and its Sheets.
- **Waiting for the autosave before the slide starts.** A write takes a round trip; the slide would
  start late after every edit. The layer already holds at the target while a payload is slow.
- **Sliding while the queue retries, the writes carried to the next page.** The queue is the page's,
  memory only (29.5); a client navigation would end it with the writes unsent and no question asked.
- **Sliding to a step just created**, with an empty frame drawn in the browser. The frames are the
  server's; a frame built by the client would be a second drawing of a step, to be kept like the first.

## Consequences

- #234 adds `editorNeighbours`, passes its placements to `TreeView` on the editor's page, lets `Slider`
  wait for `EditorApi.settle()` before `router.push` in the editor and fall back to the link while the
  queue retries, refreshes a page reached by a history step once its slide ends, and tests each
  button of two to five, the up arrow, the history step, an edit made just before a click, the bound,
  and reduced motion (42.10).
- The editor's page reads up to six Nodes more than it did, and carries their frames in its payload.
- What becomes untrue: 34.5's "no neighbour frames, no `data-slide`" for the editor's page, 34.7's
  twelve, 30.2's "no slide" for following a next step, and core document 3.4's `[#230]` "the editor
  slides to it"; each carries a dated line naming this ADR, and `ADR-133-reuse-rule.md`,
  `ADR-133-structure-editing.md` and `ADR-205-preview-drawing.md` a dated line.
