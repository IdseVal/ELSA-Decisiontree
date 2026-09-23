# ADR-132-roles-and-permissions: three roles per Tree -- creator, collaborator, administrator -- one permission table, one server-side check on every write, and an invitation that picks an existing account from a list

- Status: ACCEPTED (frozen) -- 2026-09-23; restates core document 9's last bullet as a contract
- Issue: #132 -- Architecture: freeze the store for the editor round
- Spec: `docs/specs/application.md` section 21 (new)
- Depends on: `docs/adrs/ADR-132-accounts-and-sessions.md`

## Context

The owner: "everyone can create their own datastructure", "a creator can invite
collaborators with an account", and an administrator "with all permissions to all current
and future datastructures, created by anyone" (core document 3.4). Core document 9 adds
the rule the round is built on: **no write reaches the store without the server checking,
for that account and that Tree, that it is allowed** -- the editor hides what a role may
not do, but never decides.

## Decision

1. **Roles are per Tree, and there are three.** The **creator** is the account `meta.json`
   names as `creator`: the one that created the Tree, or the one it was handed to. A
   **collaborator** is an account listed in `meta.json`'s `collaborators`. The
   **administrator** is the one account with `administrator: true`, and has every right on
   every Tree without being named in any `meta.json` -- which is what "present and future,
   whoever created it" means in code: the check is `account.administrator || role(tree,
   account)`, and nothing is written into a Tree when the administrator is created or
   acts. An account may be the creator of one Tree and a collaborator on another. Every
   active account may create a Tree; a deactivated account may do nothing.

2. **The table.** Every write the editor's server interface offers
   (`ADR-132-editor-api.md`) is one row, and there is no write that is not in it:

   | Action | Creator | Collaborator | Administrator |
   |---|---|---|---|
   | Create a Tree (becomes its creator) | every active account | | yes |
   | Read the draft and its images in the admin area | yes | yes | yes |
   | Edit content: fields, structure, explainers, Sources, image order | yes | yes | yes |
   | Upload an image; remove an unreferenced one | yes | yes | yes |
   | Invite a collaborator; remove one | yes | no | yes |
   | Publish; unpublish | yes | no | yes |
   | Hand the Tree over (name a new creator) | yes | no | yes |
   | Delete the Tree (only while hidden) | yes | no | yes |
   | Manage accounts: create, rename, deactivate, set a password | no | no | yes |
   | Change own name and own password | yes | yes | yes |
   | See the accounts list (name and login of every active account), for an invitation | yes | yes | yes |

   Two rows carry a rule of their own. **Delete is available on a hidden Tree only**: a
   published Tree has share links out, a dataset URL and sitemap entries, and deleting it
   in one click is the accident the two steps -- unpublish, then delete -- exist to catch.
   **A collaborator edits but does not publish**: the owner put the Publish toggle and the
   invitations in the creator's panel, and a collaborator's edits to a published Tree
   already reach the public through the autosave rule (`ADR-132-draft-and-publish.md`,
   decision 6), which is the trust the creator extends by inviting.

3. **The check is on the server, on every request, before any read of the store.** One
   function, `permit(account, tree, action): boolean`, pure, in `src/store/permissions.ts`,
   is the table above in code; every route handler under `/admin/api` calls it after
   resolving the session and before touching the store, and answers **403** with no body
   detail when it says no. Reads of a Tree's draft, its Node, its images and its metadata
   are writes' equals here: a collaborator of Tree A gets 403 -- not 404 -- on Tree B's
   draft, because the admin area is not a public route and the existence of a Tree is
   already public information wherever it is published. The UI hides what a role may not
   do; the server never consults the UI.

4. **An invitation adds an existing account by name, picked from a list.** `GET
   /admin/api/accounts` answers every **active** account's `id`, `name` and `login` to
   any logged-in account; the creator picks one and `PUT
   /admin/api/trees/<t>/collaborators/<accountId>` adds it. No search endpoint and no
   exact-match typing: at a lab's size the list is the search, and typing a login to be
   told "no such account" is friction that also leaks existence one name at a time. The
   list is the one place a creator sees another account's login, and it shows no more than
   the two strings above. Adding the creator, the administrator or a deactivated account
   is 422; adding an existing collaborator is idempotent (200).

5. **Handing over** sets `creator` to the named account and, if the old creator is not the
   new one, adds the old creator as a collaborator so nothing they could see disappears
   under them. The administrator hands over the Trees of a deactivated account the same way.

## Alternatives rejected

- **A collaborator may publish.** The owner placed the toggle in the creator's panel beside
  the invitations; a collaborator with the toggle is a second creator in all but name, and
  a role that is a creator in all but name is a fourth role nobody asked for.
- **Two roles only (creator, administrator) with collaborators as co-creators.** It removes
  one column and the owner's word; a co-creator who can hand the Tree over or delete it is
  more trust than "invite" implies.
- **Per-Tree permission flags instead of roles** (`canPublish`, `canInvite` per account per
  Tree). Expressive and unasked; the table above is what the owner described, and a flag
  matrix is what a screen cannot show in one panel.
- **404 rather than 403 for a Tree an account has no role on.** Right for a public route,
  where existence is the secret; wrong here, where every Tree's existence is already on the
  overview once published and a 404 on a hidden Tree would tell a collaborator of one Tree
  which other ids are hidden rather than absent -- the opposite of the intent.
- **Delete a published Tree in one step.** See decision 2.
- **Invitation by exact login.** See decision 4.
- **A search endpoint** for accounts. A list of tens is a search; an endpoint is a surface.

## Consequences

- `src/store/permissions.ts` (#136): the table as a `switch` with no default branch, so a
  new action fails the type check until it has a row. `tests/store/permissions.test.ts`
  asserts every cell of the table.
- Every handler under `/admin/api` is shaped `authenticated -> permit -> store`; the store's
  writing members take the `Account` and call `permit` again themselves, so a handler that
  forgets is caught at the second gate (defence in depth at the seam, not at the route).
- The accounts list, the collaborator panel and the hand-over control are #142's screens
  (#133 decides their look); the routes and the checks are #136's.
