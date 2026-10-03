# ADR-195-order-of-joining: `meta.json` records `joined`, every account that has held a role on the Tree in the order in which it first did -- appended, never removed, never moved -- and a `meta.json` without it gets the creator and then the collaborators at the first start

- Status: ACCEPTED (frozen) -- 2026-10-03; decides core document 10.40 (how the order of
  joining is kept, and what an existing `meta.json` gets)
- Issue: #195 -- Architecture: freeze the login by e-mail address and password, and the
  mention of who authored a Tree, the collaborators in the order they joined it
- Spec: `docs/specs/application.md` 39.2, 39.3 (new); 17.2, 17.4, 17.5, 21.4 amended, marked
  **[#195]**
- Amends: `ADR-132-data-directory.md` (`meta.json` gains a key),
  `ADR-132-roles-and-permissions.md` decision 5 (a hand-over appends the new creator to
  `joined` when it is new to the Tree)
- Depends on: `ADR-195-authors.md` (who is named)
- Built by: #197

## Context

`meta.json` names a Tree's `creator` and its `collaborators` (17.2, `TreeMeta` in
`src/store/permissions.ts`). `collaborators` is in the order of invitation:
`addCollaborator` appends (`src/store/drafts.ts`). A hand-over makes the named account the
creator, takes it out of `collaborators` and appends the old creator there, so after a hand-over
the account that made the Tree is last (21.4, `handOver`). A removal takes the id out, and an
invitation after it appends it again, at the end. So the store keeps no order of joining: the
first hand-over and the first removal both lose it.

The owner asked for the collaborators "in the order in which they joined a decision-tree"
(#194), and `ADR-195-authors.md` names the Authors in the order in which each **first** joined.

## Decision

1. **`meta.json` gains `joined: string[]`**: the id of every account that has been the Tree's
   creator or one of its collaborators, in the order in which each first became one.

   | When | `joined` |
   |---|---|
   | A Tree is created in the editor (`create`) | `[creator]` |
   | The seed or the import command copies a Tree in (`importTree`) | `[creator]`, the account it names; `[]` when it names none (a test's import), until the start names the administrator (decision 3) |
   | A collaborator is invited (`addCollaborator`) | its id appended, unless already there |
   | A collaborator is removed (`removeCollaborator`) | unchanged |
   | A Tree is handed over (`handOver`) | the new creator's id appended, unless already there; the old creator's stays where it is |
   | Anything else | unchanged |

   An id is never removed and never moved. `joined` holds every id of `creator` and
   `collaborators`, and may hold more: those that held a role once.

2. **The order the Authors are named in is `joined`'s** (`ADR-195-authors.md`): its ids that
   are the creator or a collaborator now, whose account exists and is not the administrator.
   One pure function, `authorsOf(meta, accounts): string[]`, answers their names in that order
   (39.3).

3. **A `meta.json` without `joined`** -- every Tree of a store written before #197 -- gets one
   at the first start of the release: the creator, then the collaborators in their list's
   order, each once. At every start the store also appends, in that order, any id of `creator`
   or `collaborators` that `joined` lacks, so a store seeded before accounts existed (#134),
   whose creator the start names afterwards (`nameCreator`), and a hand-edited file come out
   whole. The file is rewritten atomically (17.3) only when this changed it, and nothing else
   in it moves -- `updatedAt`, `updatedBy` and `revision` stay, since no creator wrote. One log
   line per Tree it changed: `Recorded the order of joining of Tree "<id>" from its roles: <n>
   accounts`. A `joined` that is not an array of strings is replaced the same way, as if it
   were absent; a Tree folder without a `meta.json`, which the store reads with its defaults
   (the administrator as creator), has `[creator]`, and so names nobody.

4. **What that gives an existing Tree.** For a Tree never handed over, the creator first and
   the collaborators in the order they were invited -- the order of joining, since an
   invitation is the joining. For a Tree handed over before #197, the current creator first and
   the old one where 21.4 put it, at the end: the store never recorded more, and nothing
   reorders `joined` afterwards. On the live demo server each of the three Trees gets
   `[<the administrator's id>]`, and names nobody (`ADR-195-authors.md` decision 4).

5. **`collaborators` keeps its meaning**: who is a collaborator now, in the order of
   invitation, with 21.4's hand-over rule. The panel's list (33.4, `ADR-133-top-panel.md`
   decision 4) reads it as before.

## Alternatives rejected

- **`collaborators` rewritten into the order of joining**, the old creator moved to the front at
  a hand-over. A list every reader takes as a set would carry an order, and a collaborator
  removed and invited again would still lose its place.
- **A time per account** (`joinedAt: { <id>: <ISO time> }`). A date about each person that
  nothing shows, and two joins in one millisecond -- a test's -- would need a tie rule; the
  order the list keeps is all the mention reads.
- **Forgetting a removed account**, so that an invitation after a removal is a new joining, at
  the end. A collaborator removed by mistake and invited back would fall behind everyone who
  joined since.
- **The order derived at every read, never stored.** After a hand-over it cannot be derived;
  that is what recording it is for.

## Consequences

- `TreeMeta` in `src/store/permissions.ts` gains `joined`; `src/store/drafts.ts`'s `create`,
  `addCollaborator`, `handOver` and `load`, and `src/store/index.ts`'s `importTree` and
  `nameCreator`, write it by the table above; `src/store/authors.ts` holds `authorsOf`. #197's.
- `TreeEntry.meta` carries `joined` to the admin area (ids only); the panel does not read it.
- `tests/store/drafts.test.ts` and `store.test.ts` assert the table, the first start's
  conversion and its log line (39.9).
