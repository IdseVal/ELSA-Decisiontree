# ADR-195-authors: a Tree's Authors are the accounts that hold a role on it now -- its creator and its collaborators, never the administrator -- in the order in which each first joined it, each named by its account's name alone

- Status: ACCEPTED (frozen) -- 2026-10-03; decides core document 10.40 (who is named) and the
  PROPOSED row **Author** of section 5, confirming 3.4 `[#194]`'s PROPOSED reading with the
  precisions below
- Issue: #195 -- Architecture: freeze the login by e-mail address and password, and the
  mention of who authored a Tree, the collaborators in the order they joined it
- Spec: `docs/specs/application.md` 39.1 (new); 20.1, 21.1 amended, marked **[#195]**
- Supersedes: no earlier decision. What the owner's #194 itself reverses -- core document 8
  and 9's "nothing about a creator may reach a public page" -- is restated for the mention by
  `ADR-195-names-on-public-routes.md`
- Depends on: `ADR-132-roles-and-permissions.md` (the roles, the hand-over),
  `ADR-195-order-of-joining.md` (the order), `ADR-195-who-sees-and-changes-an-address.md`
  decision 4 (one account per name)
- Built by: #197

## Context

The owner, in issue #194 (2026-10-03): "graphs should have a small mention by who it was
authored, if multiple collaborators in the order in which they joined a decision-tree."
"Graph" is one of the owner's words for a Tree (core document 5). Core document 3.4 `[#194]`
read it, PROPOSED, as: the authors are the Tree's creator and its collaborators, in the order
in which they joined it, so the creator who made the Tree comes first, each named by the name
of their account and by nothing else -- not the address, not the account's id. Left open
(10.40): a collaborator removed, a deactivated account, the administrator, a Tree handed over,
and the row **Author** of section 5 against *author* as sections 1, 2 and 3.1 use the word --
whoever writes a Tree's content, other labs included.

The roles today (21.1): the creator is `meta.json`'s `creator`, the account that created the
Tree or was handed it; a collaborator is in `collaborators`; the administrator has every right
on every Tree without being named in any `meta.json`, except as the creator the seed and an
import name (17.1, 17.4). A deactivated account keeps its roles: "its Trees stay" (20.1). A
hand-over makes the named account the creator and adds the old creator as a collaborator
(21.4). On the live demo server each of the three Trees has the administrator as creator and
no collaborator (measured on #194).

## Decision

1. **The Authors of a Tree are the accounts that hold a role on it now** -- its creator and
   each of its collaborators -- **except the administrator**, **in the order in which each
   first joined the Tree** (`ADR-195-order-of-joining.md`). The reading of core document 3.4
   `[#194]` is confirmed, and made precise in one place: the account that made the Tree comes
   first while it is on the Tree, and keeps that place after it hands the Tree over.

2. **A collaborator removed is no longer named.** The mention names the team the Tree has; the
   creator and the administrator decide who is on it (21.2). Invited again, the account is
   named in the place it first joined, not at the end.

3. **A deactivated account is named while it holds its role.** Deactivating decides who may
   log in, not who wrote the Tree (20.1: "its Trees stay"). A name comes off a Tree the way a
   role does: the panel's remove cross for a collaborator; for a creator, a hand-over, after
   which it is a collaborator that can be removed (21.4).

4. **The administrator is never named**, whatever role a `meta.json` gives it. It holds every
   right on every Tree without being invited (20.3); it is a Tree's creator only when the seed
   or an import made it one (17.1, 17.4), or when someone logged in as the administrator
   created the Tree; and naming it would credit the deployment's own account, not a person,
   with the content. A Tree whose only role holder is the administrator -- on the demo server,
   each of the three -- names nobody, and shows no mention, until it is handed to the account
   of a person who authored it (21.4, 33.6): the owner's, for instance, once #198 has made it.

5. **Each Author is shown by its account's `name` alone** -- never its address, its id, its
   role or when it joined. One account per name (`ADR-195-who-sees-and-changes-an-address.md`
   decision 4) makes no two Authors look alike.

6. **The row Author of core document 5** is decided: an account a Tree names as one who
   authored it -- its Creator and each of its Collaborators, never the Administrator, in the
   order in which each first joined the Tree -- shown by the account's name alone. Every
   account but the administrator's that writes a Tree's content in the editor holds a role on
   it, so for a Tree made in the editor the Authors are its authors in the sense of sections
   1, 2 and 3.1; a Tree whose content came as files -- the seed, an import, another lab's Tree
   moved in (17.1, 17.4) -- has authors with no account here, and names none until it is handed
   to the account of one.

## Alternatives rejected

- **Everyone who ever held a role** (authorship as history). A collaborator invited by mistake,
  or removed at their own request, would be named for good, and no control in the app would
  take the name off.
- **The administrator named by its account's name.** "Administrator" on every seeded Tree -- a
  role, not an author -- and, after a hand-over, on the Tree as a collaborator (21.4 adds the
  old creator); on a decision aid read for what it can be trusted with, a wrong attribution is
  worse than none.
- **The administrator named only where nobody else is**, so that every Tree has a mention. The
  same misstatement, on exactly the Trees whose authors the store does not know.
- **A deactivated account left out.** Deactivating someone who left the lab would take them off
  every Tree they wrote, and reactivating them would put them back: the mention would follow
  the login, not the writing.
- ***Author* as whoever writes a Tree's content, with an account or without** (sections 1, 2,
  3.1). The store knows no author without an account; naming one would need free-text authors
  in the Tree, a format change nobody asked for (`ADR-195-names-on-public-routes.md`).
- **The current creator first, then the collaborators.** After a hand-over the account that
  made the Tree would follow the one it was handed to, which is not the order in which they
  joined it.

## Consequences

- `authorsOf(meta, accounts)` (39.3), one pure function, is the whole rule; the public mention
  and the tiles of both overviews read it. #197's.
- After #197 merges, the demo server's three Trees show no mention until each is handed to a
  person's account; handing them over is the owner's to do or to ask for (#198 leaves it out of
  its scope).
- The panel's Collaborators section (33.4) keeps listing roles -- the creator first, then the
  collaborators -- which is not the mention's order; nothing in this round changes it.
