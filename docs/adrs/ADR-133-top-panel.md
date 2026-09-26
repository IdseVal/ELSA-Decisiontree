# ADR-133-top-panel: one button at the top right of the editor's chrome bar, showing the Tree's state, opens a Sheet down the right edge with five sections -- Publish with its to-do list, collaborators, this Tree, this step, and the administrator's two actions; unpublishing asks once; a collaborator sees the panel with the creator's controls absent

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 33 (new)
- Depends on: `docs/adrs/ADR-132-draft-and-publish.md` (Publish, unpublish, 19.4),
  `ADR-132-roles-and-permissions.md` (who may do what; invitations from a list),
  `ADR-132-editor-api.md` (the routes), `ADR-133-admin-routes.md` (the chrome bar),
  `ADR-133-overview-tiles.md` (the scroll box)

## Context

The owner: "the datastructure should remain in hidden mode ... until the creator toggles a
switch, somewhere in the top of the screen, to 'Publish' ... there is a panel on the top
right, in which the 'Publish' toggle is also situated, where a creator can invite
collaborators with an account." #132 decided what the toggle does (19.3: full validation,
copy or 409 with the violations; off deletes the public copy at once), that a collaborator
edits but does not publish or invite (21.2), that an invitation picks an active account
from the list `GET /admin/api/accounts` answers (21.4), that a published Tree is deleted in
two steps (unpublish, then delete) and handed over by naming a new creator (21.2, 21.4),
and that every write response carries the whole draft's advisory count "which is what the
Publish toggle shows" (22.3). The editor's chrome bar is 44 pixels (10.1) and the page
never scrolls.

## Decision

1. **The button.** At the top right of the editor's chrome bar, before the caller's name
   and the logout button (`ADR-133-admin-routes.md`, decision 7), one button in the language
   switch's style shows a dot and the Tree's **state**: `hidden` (dot in `text-muted`),
   `published` (dot in `accent-secondary`), `published` with `notServable` (dot in
   `danger`, 18.3), and, on a published Tree whose public copy is behind (19.4),
   `published` with `publicBehind` (dot in `accent`); after the word, the to-do count in
   brackets when it is not zero: "Hidden (3)". It opens the **panel**, and its label is
   what a creator reads about the Tree without opening anything. The state and the count
   come from the page's load (`GET /admin/api/trees/<t>`, 22.1, read server-side) and
   from every write response's `tree` (22.3) afterwards.

2. **The panel is a Sheet down the right edge**, 400 pixels wide, from under the chrome bar
   to above the disclaimer, over the scrim like every Sheet (10.5: Escape, the cross, a
   click outside close it; focus to the cross on open; one Sheet at a time, so it closes an
   open Overlay and vice versa). Its body is a scroll box (`ADR-133-overview-tiles.md`,
   decision 5): the document never scrolls, the panel's list of collaborators and to-dos
   may. Five sections, in this order, each a heading and its controls:

   ```
   +--------------------------------------+
   |  Tree: Hidden (3)                 x  |
   |--------------------------------------|
   |  PUBLISH                             |
   |  [ o  ] Hidden                       |
   |  3 things to do before publishing:   |
   |   - Start: Title missing in Dutch    |  <- each a link to its Node's editor
   |   - n-4k2p1q: No answer for "no"     |
   |   - n-9x1abc: Nothing leads here     |
   |--------------------------------------|
   |  COLLABORATORS                       |
   |  Anna (creator)                      |
   |  Bram                          [x]   |
   |  [ choose an account  v ] [Invite]   |
   |--------------------------------------|
   |  THIS TREE                           |
   |  Title      [AI Act applicability ]  |
   |  Description[                     ]  |
   |  Languages  EN NL (fixed)            |
   |  Public link  /ai-act-example        |  <- when published
   |--------------------------------------|
   |  THIS STEP                           |
   |  n-4k2p1q                            |
   |  [Remove end]  [Delete this step]    |
   |--------------------------------------|
   |  ADMINISTRATOR                       |  <- the administrator only
   |  Hand over to [ account v ] [Go]     |
   |  [Delete this tree]  (hidden only)   |
   +--------------------------------------+
   ```

3. **Publish.** A switch (`role="switch"`) labelled `publish`, on when the Tree is
   published. Turning it **on** sends `PUT .../published { published: true }`: on 200 the
   state becomes `published` and the section shows `publishedAt` and the **public link**
   (the Tree's root URL, 4.1, as a link that opens in a new tab); on 409 the switch stays
   off and the section lists the violations from the response as the to-do list. The
   **to-do list** is otherwise the draft's advisory violations (from the page's load and
   each response's `tree.advisory` count; the list itself is re-read from `GET
   .../trees/<t>` when the panel opens), one line per violation: the Node's title (or its
   id while it has none, or `tree` for the manifest) as a link to that Node's editor page
   in the page's language, then the violation's message; a V-REACH line offers `remove`
   beside it (`ADR-133-structure-editing.md`, decision 9). While the Tree is published, the
   list is headed `publicBehindBecause` when `publicCopyCurrent` is false, and
   `notServableBecause` with the start-up violations when the Tree is not servable (18.3),
   so a creator learns from the panel why the public page is not what they see. Turning it
   **off** asks once: the switch is replaced by the sentence `confirmUnpublish` ("Hide this
   tree? Links to it will stop working until it is published again.") with `confirm` and
   `cancel`; `confirm` sends `{ published: false }`. A collaborator sees the switch
   disabled with the state, the to-do list, and no confirmation.

4. **Collaborators.** The list: the creator first, marked `creator`, then each collaborator
   by name (`meta.collaborators` resolved through the accounts list, which any logged-in
   account may read, 21.4), each with a remove cross for the creator and the administrator
   (`DELETE .../collaborators/<id>`). Under it, for the creator and the administrator, a
   `<select>` of every active account not already on the Tree and not the administrator
   (from `GET /admin/api/accounts`, read when the panel opens), and `invite` (`PUT
   .../collaborators/<id>`); a 422 is shown under the select. A collaborator sees the list
   and no controls, which is what the owner's "invite" in the creator's panel means (21.2).
   Nothing about an account is shown but its name; the login is shown in the select's
   option text after the name, in `text-muted`, because two people may share a name.

5. **This Tree.** Two `Field`s per the page's language -- the manifest's `title` (80) and
   `description` (600 and 8 lines, rich, edited as source like the Node's) -- with the
   rim's rule inside the panel (the counter and the missing-language tags beside each);
   the declared languages as tags with the word `fixed` (`ADR-133-new-tree-form.md`,
   decision 6); the id; the public link when published. This section is where #144's
   Theme panel would go, if the owner promotes it.

6. **This step.** The Node's id in `text-muted`; `removeEnd` on a Terminal and `deleteStep`
   on every Node but the root, both from `ADR-133-structure-editing.md` (decisions 4 and
   8); `deleteStep` asks once in place, like unpublishing. Inside an open Overlay the
   panel is closed (one Sheet at a time), so "this step" is always the centre; an aside is
   deleted from its own page.

7. **Administrator.** Shown to the administrator only: `handOver` with a `<select>` of every
   active account and a button (`PUT .../creator`), after which the section's list shows
   the new creator and the old one as a collaborator (21.4); and `deleteTree`, enabled
   while the Tree is hidden and disabled with `unpublishFirst` while published (21.2),
   asking once in place and then sending `DELETE .../trees/<t>` and going to `/admin`. The
   creator has `handOver` too (21.2) but not in this section: for the creator it is the
   last control of the Collaborators section, because that is where the names are.

8. **The overview has no panel.** On `/admin` the chrome bar holds the name and the logout
   button and nothing else of this; the state of each Tree is on its tile
   (`ADR-133-overview-tiles.md`, decision 3).

## Alternatives rejected

- **The Publish toggle in the chrome bar itself**, outside any panel. The owner put it in
  the panel ("in which the 'Publish' toggle is also situated"); the button's label carries
  the state to the bar so it is read without opening the panel, which is the part of that
  wish a bar can hold.
- **A browser `confirm()` dialog for unpublishing and deleting.** Not styled, not
  translatable by the app, blocks the tab; a sentence in place with two buttons is the
  Sheet's own idiom (the collapsed groups of 10.5).
- **No confirmation on unpublishing.** A published Tree has share links out (21.2's own
  reason for the two-step delete); a switch flicked by mistake hides a Tree from a lecture
  in progress.
- **Polling the to-do list.** It is re-read when the panel opens and its count updated by
  every response; a list that changes while nobody looks at it is not information.
- **Free-text invitation by login.** #132 rejected it (21.4): the list is the search.
- **Showing collaborators' logins in the list.** The name is what the owner asked accounts
  to have; the login is shown once, in the select, to tell two "Anna"s apart.
- **Hand-over in the administrator section for everyone.** A creator hands over to a
  colleague they have just invited; the control sits beside the names.
- **A panel that is a page (`/admin/trees/<t>/settings`).** The owner asked for a panel on
  the editing screen; a Sheet is that, and the editor's page stays one address.

## Consequences

- #142 builds `src/editor/Panel.tsx` (sections 1 to 5, the button, the confirmations) and
  the "This step" section's frame; #139 lands `removeEnd` and `deleteStep` inside it
  (`ADR-133-build-order.md` names the shared file).
- `src/chrome.ts` gains `treeState`, `publish`, `todoCount`, `todoBefore`, `publishedAt`,
  `publicLink`, `publicBehindBecause`, `notServableBecause`, `confirmUnpublish`,
  `collaborators`, `creator`, `invite`, `removeCollaborator`, `chooseAccount`, `thisTree`,
  `fixed`, `thisStep`, `handOver`, `deleteTree`, `unpublishFirst`, `confirmDelete` (#142).
- `tests/browser/panel.spec.ts` (#142) asserts: the button's label and count on a fresh
  Tree; publishing a Tree with a missing text is refused and the to-do line links to the
  Node; publishing a complete one shows the public link and the public overview lists it;
  unpublishing asks and then the root URL is 404; inviting from the select and, in a
  second context as that account, editing the Tree and seeing the switch disabled; a third
  account gets the 403 page on the editor address; removing the collaborator and, in their
  context, the next write answering `notEditable`; the administrator's hand-over and the
  disabled `deleteTree` while published.
