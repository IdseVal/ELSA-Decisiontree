# ADR-133-autosave: a field is written 600 ms after the last keystroke and on blur, through one queue per page; the chrome bar says saving, saved or not saved; a refused write keeps the value on screen; the response repaints every field not being edited; a session that expires opens the login form in a Sheet

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 29 (new)
- Depends on: `docs/adrs/ADR-132-editor-api.md` (the unit of a write, the write response,
  last write wins per field), `ADR-132-draft-and-publish.md` (an advisory write is stored;
  19.4 on a published Tree), `ADR-133-login-and-account-pages.md` (`LoginForm`)

## Context

The owner: "I want all fields to be saved automatically". #132 made the unit of a write one
field or one operation on one Node, answered with the Node as stored, its advisory
violations and the Tree's revision (22.3), and decided that two collaborators' writes are
last-write-wins per field with the response carrying the other's work so that "the editor
repaints every field it is not focused on" (22.5) -- "what the editor shows is #133's". A
session lasts 12 hours idle (20.4); an editor left open over lunch comes back to a 401.

## Decision

1. **When a write is sent.** A field's value is written **600 milliseconds after the last
   keystroke** in it and **on blur**, whichever comes first, and only when the value differs
   from the last value written or received for that field. An operation (`add-source`,
   `set-answer`, `add-image`, a structure button) is written at once. A write in flight for
   a field while its value changes again is not cancelled; the next value is queued behind
   it.

2. **One queue per page, in order.** Every write of the page -- field or operation, this
   Node's, the manifest's, an Overlay's -- goes through one client queue, one request in
   flight at a time, in the order accepted. So the `revision` the responses carry rises
   monotonically as seen from this page, a structure write never overtakes the field write
   before it, and the store's own queue (17.3) is never asked to order what the client
   could. The queue is the `Editor` client component's, which wraps the page
   (`ADR-133-reuse-rule.md`, decision 4).

3. **What the creator sees: one indicator in the chrome bar.** Between the language switch
   and the panel button, a `role="status"` region of at most 320 pixels shows one of:
   `saving` while the queue is non-empty; `saved` when it drains, with the time of the last
   write for the first 5 seconds; `notSaved` in `danger` with a reason (decisions 4 and 5).
   The same region shows the advisory message of the field being edited
   (`ADR-133-bubble-edited-in-place.md`, decision 5), after the state word: "Saved · Title:
   93 of 80 characters". It never shows a token, an account id or a request body.

4. **A refused write (422, a blocking rule) keeps the value on screen.** The region is
   outlined `danger`, the indicator says `notSaved` with the violation's message, and the
   field is not written again until its value changes -- a creator who typed a `<script`
   into a description sees V-HTML's sentence, fixes it and it saves. Nothing is reverted:
   the screen holds what was typed, the draft holds what was last accepted. A 403 (the role
   was removed under the creator), 404 (the Tree was deleted) or 409 (the Tree became
   uneditable, 19.5) says `notEditable` with the reason from the response, every region
   becomes read-only, and the panel's link to `/admin` is the way out.

5. **A failed request is retried; the page is not left with an unsaved field silently.** A
   network failure or a 5xx is retried after 5 seconds, then 10, 20, 40, 60, and every 60
   seconds after that, with the indicator at `notSaved` and `retrying`; a `retry` button in
   the indicator sends it now. While the queue holds a write that has not been accepted,
   leaving the page (`beforeunload`) asks the browser's one confirmation. The queue is in
   memory only: a closed tab loses what was not accepted, and the indicator is what says so
   before the tab is closed.

6. **A session that expires opens the login form in a Sheet.** A 401 on any write pauses
   the queue, keeps every value on screen, and opens `LoginForm`
   (`ADR-133-login-and-account-pages.md`, decision 3) in a Sheet titled `sessionExpired`;
   on 204 the Sheet closes and the queue resumes with the same requests. Nothing typed is
   lost to a lunch break. The Sheet's close cross is not offered: there is nothing else to
   do on the page without a session, and `/admin` is a link in the Sheet.

7. **The response repaints every field not being edited, and says when it changed under
   you.** Every write response carries the Node as stored (and, in `also`, the other Nodes
   the write changed); the editor replaces the value of every region of those Nodes **that
   does not have the focus and has no write queued**, and updates the rim's tags, the
   counters, the fan's Option titles and the Answer buttons' titles from it. A region whose
   value the response changed from what the screen showed -- another collaborator's write,
   by 22.5 -- is outlined in `accent` for 5 seconds and the indicator says `changedElsewhere`
   for the same time; the newer text wins, as the store already decided, and nothing asks
   the creator anything. The `revision` of the last response is kept; a response with a
   lower `revision` than the last seen is applied all the same (the queue makes it
   impossible from this page, and the store's is the truth).

8. **No polling and no push in this round.** A collaborator's write is seen when this page
   writes (decision 7) or is reloaded; two people typing in one Node see each other at the
   pace of their own saves. The store has no change feed (17.5), and adding one is a
   surface #132 did not open; the panel's collaborator list says who else is on the Tree,
   which at a lab's size is the coordination that exists.

9. **On a published Tree the indicator adds one word.** A write whose response says
   `tree.publicCopyCurrent: false` (19.4: the draft is no longer fully valid, so the last
   valid copy stays public) shows `publicBehind` after the state word, and the top panel's
   Publish section explains it (`ADR-133-top-panel.md`, decision 2); the next response
   with `true` clears it.

## Alternatives rejected

- **Writing on every keystroke.** A write per character is a file write and a full
  validation per character (19.4); 600 milliseconds is under the pause between two words
  and above the pause between two letters, and blur catches the rest.
- **Writing only on blur.** A creator who types a title and closes the tab loses it; the
  owner said "saved automatically", not "saved when you leave".
- **A Save button, even as a belt to the braces.** The owner: "nobody presses Save". A
  button that exists is a button someone waits for.
- **Parallel writes to different fields.** Faster by milliseconds and the revisions would
  arrive out of order, so "changed under me" could not be told from "my earlier write".
- **Reverting a refused value to the stored one.** The typed text is the creator's work;
  the message is the fix. #132 chose the same on the store side for advisory rules.
- **Asking on a conflict** ("someone else changed this; keep yours or theirs?"). #132
  decided last write wins per field and gave the reason: an autosave has no user to ask.
  Showing the change and the name of the mechanism (`changedElsewhere`) is what a field
  can honestly do.
- **A change feed (server-sent events) so collaborators see each other live.** A route
  #132 did not define, a connection per open editor, and a second write path into the
  DOM; the pace of one's own saves is enough for a lab, and the alternative is filed if the
  owner asks.
- **Redirecting to the login page on a 401.** The page's unsaved values would be lost;
  the Sheet keeps them.
- **`localStorage` as a safety net for the queue.** A second store of Tree text on a
  creator's machine, outside the data directory, with its own staleness; the indicator and
  the `beforeunload` prompt say what is unsaved, and that is enough.

## Consequences

- `src/editor/Editor.tsx` (#138) holds the queue, the indicator's state, the revision and
  the session Sheet; `src/editor/writes.ts` holds one function per row of 22.1 the editor
  calls, each returning the parsed response or a typed refusal. Every later issue's
  operation goes through the same queue.
- `src/chrome.ts` gains `saving`, `saved`, `notSaved`, `retrying`, `retry`, `notEditable`,
  `changedElsewhere`, `sessionExpired`, `publicBehind` (#138).
- `tests/editor/queue.test.ts` (#138) asserts the debounce, the blur, the order, the
  retry ladder and the pause on 401 against a fake `fetch`; `tests/browser/editor.spec.ts`
  asserts the indicator's three states, a refused write kept on screen, and -- with two
  browser contexts logged in as two accounts -- the repaint and `changedElsewhere` on one
  field of one Node.
