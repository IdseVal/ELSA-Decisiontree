# ADR-205-way-there-and-back: the preview opens in the same tab once the editor's autosave holds nothing unaccepted, the way back leads to the editor of the step and the language the preview shows, and the preview button is offered while the Tree on the page is hidden

- Status: ACCEPTED (frozen) -- 2026-10-04; decides core document 10.41 (what pressing the preview
  button does while the editor holds an edit the store does not have yet, and what "where he came
  from" returns to); of 3.4 `[#202]`'s readings it confirms "it opens in the same tab" and "the
  button is offered on a hidden Tree only", and replaces "'where he came from' is the step and the
  language the preview was opened from" with the step and the language the preview shows
- Issue: #205 -- Architecture: the preview of a hidden Tree as its readers will see it -- its
  address, what it shows of an unfinished draft, and its two buttons at the top left
- Spec: `docs/specs/application.md` 40.6 (new); 29.2 and 29.5 amended, marked **[#205]**
- Amends: `ADR-133-autosave.md` decisions 2 and 5 (the queue gains one way to be waited for; the
  `beforeunload` confirmation is unchanged and never comes from the preview button)
- Depends on: `ADR-205-preview-address.md`, `ADR-205-preview-buttons.md`, `ADR-133-autosave.md`
- Built by: #206

## Context

The owner: "a button that routes to a window with a preview of the tree ... And from that view, in
the same place a button that brings the user back to the editor interface where he came from".

The editor writes a field 600 ms after its last keystroke and on blur, through one queue per page,
one request in flight; a failed write is retried after 5, 10, 20, 40 and 60 seconds; a 401 pauses
the queue and opens the session Sheet; a 422 leaves the refused value on screen, not written again
until it changes (29.1 to 29.6). "While the queue holds a write not yet accepted, leaving the page
asks the browser's one `beforeunload` confirmation. The queue is memory only" (29.5): a value
waiting out its 600 ms counts (`busy()`, `src/editor/queue.ts`). So a creator who types a title and
presses a plain link to the preview at once -- the usual way -- would be asked the browser's
question, or, answering it, would see the preview without the title. The editor's page holds the
Tree's state from its load and from every response after (`tree.published`, 33.1, 22.3), and its
settings button follows it. The preview's address is the editor's with `/admin/preview` in place
of `/admin/trees` (`ADR-205-preview-address.md`).

## Decision

1. **The same tab.** The preview button is a link to the preview of the editor's own address --
   the same Trail, Node and `?lang`, and an Overlay the address names (one opened by a click is not
   in the address, 10.9) -- followed in the same tab. A
   click with a modifier that opens a new tab or window is the browser's, as for any link. The
   owner's "routes to a window" names where the button leads, and "brings the user back" a return
   to the editor, not a second window to close.

2. **The click waits for the autosave.** A plain click writes at once every field value still
   waiting out its 600 ms (29.1's flush, for every field), then follows the link as soon as the
   queue holds nothing not yet accepted -- at once when it holds nothing. So the preview shows
   every value the store accepted, and the page's `beforeunload` confirmation (29.5) never comes
   from the button: it leaves only when nothing is waiting. While it waits -- a write in flight,
   one that failed and waits for its retry (29.5), a session that expired (29.6) -- the button
   carries `aria-busy="true"` and is drawn at the 60 % opacity the band's disabled buttons have
   (`.step-delete:disabled`, 30.8), a second click adds nothing, and the indicator in the bar says
   why (29.3). A creator who will not wait leaves by the browser's means, and its confirmation
   asks as before. The `Editor` provider gains one member for it, `settle(): Promise<void>`, which
   flushes every waiting field (`WriteQueue.flushAll()`) and resolves when `busy()` is next false.

3. **A refused value is not waited for.** A value a blocking rule refused stays on screen and is in
   no queue (29.4): the button leaves, the preview shows what the store holds, and back in the
   editor the field holds it too. The refused value goes with the page, as it goes on a reload or
   any leaving today; a blocking rule's value can never be stored as typed, so the preview could
   not show it.

4. **The way back leads to the editor of what the preview shows.** It is a link to the editor at
   the preview's own address: the step and the language on screen, with their Trail and an Overlay
   the address names -- `/admin/trees` and the same path and `?lang` (`editorLinks().node`). Where the
   reader has not walked on, that is the step and the language the preview was opened from: where
   they came from. Where they walked on, or switched the language, it is the editor of the step
   they look at, in that language -- where a creator who saw something to change in the preview
   changes it. It needs no script and no state, and it leads to a step that exists: the page that
   drew it just read it.

5. **The preview button is offered while the Tree on the page is hidden.** It is drawn while the
   page's Tree state says hidden -- the `Editor`'s `tree.published`, which its settings button
   reads (33.1) -- so it goes when the creator publishes from the panel and comes back when they
   unpublish, without a reload; on a published Tree's editor it is never drawn. The preview of a
   Tree published elsewhere meanwhile leads to its editor (`ADR-205-preview-address.md` decision
   3).

## Alternatives rejected

- **A second tab or window.** "brings the user back" names a return; a tab left behind would hold
  an editor whose queue still writes while the creator reads a preview of the state before it, and
  going back would mean finding and closing a tab.
- **A plain link that leaves at once.** The usual click comes within 600 ms of the last keystroke:
  the browser would ask its `beforeunload` question every time, or the preview would miss the
  value.
- **Disabling the button while the queue is busy.** A second click would be needed after the
  first did nothing; waiting does it in one.
- **Holding the button while a refused value is on screen.** A value a blocking rule refused can
  never be stored as typed; leaving the page loses it today without asking (29.4, 29.5), and the
  preview, which shows what the store holds, could not show it.
- **The step and the language the preview was opened from** (3.4 `[#202]`'s reading). It needs the
  origin carried through every link of the walk -- a second query parameter beside `?lang` in
  `trail`, `follow` and `withLang` -- or kept in the browser's storage, which the application has
  never used; a step deleted meanwhile in another tab would make the way back a 404, where the step
  on screen exists by construction; and it differs from the step on screen only after a walk,
  when the editor of what the creator just looked at is where a change goes. The owner can
  overrule this on #206.
- **The browser's history (`history.back()`) as the way back.** After a walk it goes one step back
  in the preview, and a preview opened from a typed address or a bookmark has no editor behind it.
- **The button on a published Tree too.** The owner's words are "In an unpublished tree"; a
  published Tree's readers' view is its public page, which the panel links (33.3).

## Consequences

- `src/editor/queue.ts` gains `flushAll()` and a way to wait for `busy()` to be false;
  `src/editor/Editor.tsx`'s `EditorApi` gains `settle()`; `src/editor/PreviewButton.tsx` (new)
  draws the button while `tree.published` is false and waits on `settle()` (#206).
- `application.md` 29.2 and 29.5 carry dated notes; 40.6 is the contract.
- `tests/editor/queue.test.ts` and `tests/browser/preview.spec.ts` (#206) assert the wait, the
  absence of the browser's dialog, the refused value, the way back after a walk and a switch of
  language, and the button following a publish and an unpublish (40.9).
