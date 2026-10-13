# ADR-251-creator-deletes: the creator's `deleteTree` stands in the settings panel's "This Tree", before the Theme panel; the administrator's stays in its section

- Status: ACCEPTED -- 2026-10-13; the place is PROPOSED (core document 3.4 `[#247]`: the owner
  asked for the ability, not for a place)
- Issue: #251 -- The creator deletes their own hidden Tree from the settings panel, as the
  administrator does
- Spec: `docs/specs/application.md` 33.2, 33.5 and 33.6, amended `[#251]`
- Core document: 3.4 `[#247]` and section 5's **Creator**, unchanged here
- Amends: `ADR-133-top-panel.md` decision 7 (a dated note)
- Round record: `ADR-247-small-additions-round.md`

## Context

The owner wrote in issue #247, on 2026-10-13 (core document 3.4 `[#247]` holds the words whole):

> "I want the creator of a tree who is not the admin to also have the ability to delete a tree,
> not just the admin, but the admin account should still have the ability to have "master
> rights" so to speak."

The server already let the creator delete a hidden Tree: `permit` in
`src/store/permissions.ts` answers `delete` for the creator and the administrator, 21.2's
table says so, and `drafts.delete` answers 409 while the Tree is published. Only the settings
panel (`src/editor/Panel.tsx`) kept `deleteTree` inside the Administrator section, which it draws
for the role `administrator` alone (33.6, `ADR-133-top-panel.md` decision 7).

The panel's role is one of three (`PanelRole`), set by the editor's page: `administrator`
whenever the account is the administrator, then `creator` when `meta.json` names the account,
then `collaborator`.

## Decision

1. **The creator's `deleteTree` stands in "This Tree"** (PROPOSED), after the facts list (the
   id and, while published, the public link) and before the Theme panel, which closes the
   section (33.5). The Theme panel's `<h4>` and `<h5>` headings would take a button after them
   into the Theme's outline. "This Tree" is the section about the Tree as a whole, and deleting
   acts on the Tree as a whole.
2. **One control, two places.** The button and its question are one component, `DeleteTree`,
   at the end of `Panel.tsx`: disabled with `unpublishFirst` as its description while the Tree
   is published, asking once in place (`confirmDeleteTree`, `confirm`, `cancel`), then
   `DELETE .../trees/<t>`, and a 204 goes to `/admin`. The panel draws it in "This Tree" for the
   role `creator` and in the Administrator section for the role `administrator`. A page has one
   role, so the administrator sees one `deleteTree`, also on a Tree it created; a collaborator
   sees none. No new chrome key.
3. **A failure is shown under the button that sent it.** The panel's error had one place for
   the whole Administrator section (`admin`), which only that section drew. A failed `DELETE`
   now has a place of its own (`delete`), drawn by `DeleteTree` under its button, in either
   section. The Administrator section's `admin` place stays for its hand-over and now stands
   directly under the hand-over form, above the administrator's `deleteTree`, where it stood
   below it before.
4. **After a hand-over the button follows the role.** The panel already turned the old creator
   into a collaborator after their own hand-over (33.4); the button is drawn by role, so it goes
   at once. The new creator sees it on their next visit. No code was added for this.
5. **The server does not change.** No permission, route or store function: 21.2 already gives
   the creator `delete`, hidden Trees only.

## Alternatives rejected

- **Show the Administrator section to the creator too.** Its heading says whose controls they
  are, and the administrator's hand-over to every account (33.6) is not the creator's.
- **Beside the creator's hand-over, at the end of Collaborators.** That section is about the
  Tree's people (`ADR-133-top-panel.md` decision 7 put the creator's hand-over there "because
  that is where the names are"); deleting is about the Tree.
- **At the very end of "This Tree", after the Theme panel.** The Theme panel's headings would
  take the button into its outline, under "Theme".
- **A section of its own for the creator.** A fifth section for one button, and the panel's
  four sections (33.2) stay four.
- **The button in both places for the administrator.** Two buttons for one action, on every
  Tree the administrator opens.
- **A copy of the administrator's markup in "This Tree".** Two copies of one control drift
  apart; the issue asked for one.

## Consequences

- `src/editor/Panel.tsx`: `DeleteTree`, drawn by role in two places, and the error place
  `delete`.
- `tests/browser/creator-deletes.spec.ts`, in English and in Dutch, on 35.3's accounts and Trees:
  the creator's button disabled with `unpublishFirst` on the published `ai-act-example`; none for
  the collaborator `bram`; the administrator's one button on a Tree of its own and its deletion
  of a Tree `anna` made, from its section; none in the old creator's panel after a hand-over,
  and the new creator's on their visit; the creator asked once, `cancel`, a failed `DELETE`
  shown under the button, then `confirm` to `/admin`, the Tree gone from the creators' overview,
  and `GET /admin/api/trees/<t>` answering 403 to the creator and 404 to the administrator.
- `tests/browser/admin-no-scroll.spec.ts`: the settings panel opened as `anna`, the creator of
  `hidden-draft`, plain and with `deleteTree` asking, at every viewport of 10.6, in both
  languages.
