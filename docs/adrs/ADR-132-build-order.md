# ADR-132-build-order: #134 first, alone; #135 on #134; #136 on #134 and #135; the editor's screens on #136; the walk last

- Status: ACCEPTED (frozen) -- 2026-09-23
- Issue: #132 -- Architecture: freeze the store for the editor round
- Spec: none; this ADR orders the build issues #134 to #144 and corrects two `Depends on:`
  lines
- Amends: `docs/adrs/ADR-131-version-1-0-and-the-editor-round.md`, decision 8 (its table,
  which said #132 "confirms or corrects the lines")

## Context

`ADR-131` filed eleven build issues with `Depends on:` lines and left them for this freeze
to confirm by the criterion of `ADR-118-build-order.md`: a dependency is not "mentions the
same subject" but **"cannot be written, or cannot be true, until the other has merged"**.
The decisions of the seven `ADR-132-*` files above assign work to issues; this ADR checks
the lines against those assignments.

The assignments that matter for order:

| Deliverable | ADR | Issue |
|---|---|---|
| `ELSA_DATA_DIR`, `ELSA_SEED_DIR`, the refusal of the three retired variables, `src/store/` with `openStore`, the atomic writer, `importTree` and the seed at first start | data-directory 1, 2, 4, 5, 6, 9 | **#134** |
| The store's read side: `published`, `publishedIds`, the swap-in-place API the write side will call; the overview; the moved image and theme routes; the hidden-Tree 404; findability over many Trees | many-trees 1 to 9; hidden-trees 1 to 9 | **#134** |
| `accounts.json`, `sessions.json`, scrypt, the cookie, `authenticated`, CSRF, the rate limit, `ELSA_ADMIN_PASSWORD`, the login and accounts routes and screens | accounts-and-sessions 1 to 12 | **#135** |
| Draft mode of the loader and the derived schema; `draft.json` writes; publish, unpublish, delete, hand over, collaborators; `permit`; the field and operation writes; uploads; the admin image route; `scripts/store.ts import` | draft-and-publish 1 to 9; roles 1 to 5; editor-api 1 to 8; data-directory 7 | **#136** |

## Decision

```
                    #132  this freeze
                      |
                    #133  the screens (architecture)
                      |
                    #134  data directory, store read side, many Trees, overview, hidden 404
                      |
                    #135  accounts, sessions, login, the accounts page
                      |
                    #136  the write path: drafts, publish, permissions, uploads, import
                      |
          +-----------+-----------+
          |                       |
        #137  creators'         #138  the Bubble editor
              overview, + tile    |
                                  +--------+--------+--------+--------+
                                  |        |        |        |        |
                                #139     #140     #141     #142     #144
                                          ^                 ^
                                          |                 +-- also #136 (already)
                                          +-- uploads are #136's routes
                      |
                    #143  the walk: after #134, #137, #139, #140, #141, #142
```

| Issue | `Depends on:` before | `Depends on:` now | Why exactly |
|---|---|---|---|
| #133 | #132 | #132 | Unchanged. The screens are frozen against the store's interface, which is this freeze. |
| #134 | #132, #133 | #132, #133 | Unchanged. The overview's look is #133's; the rest is this freeze. #134 is **the one build issue that starts alone**, because it creates the data directory and `src/store/` that every other build writes into. |
| #135 | #132, #133 | **#132, #133, #134** | **Corrected.** `accounts.json` and `sessions.json` live in `ELSA_DATA_DIR`, written through the atomic writer of `src/store/` -- both #134's. A #135 that started beside #134 would define the variable and the writer a second time, and `ADR-132-data-directory.md` decision 4 says there is one writer and one queue: by the criterion, "cannot be true until the other has merged". |
| #136 | #132, #135 | **#132, #134, #135** | **Corrected.** It publishes into the folders and the in-memory set #134 reads, and calls the swap that #134 exposes; and it takes the `Account` from #135's session. Both were already true by the chain through #135; the line names #134 for the reason `ADR-118-build-order.md` named #120 on #121: a dependency that holds only through the dispatch order is not one anyone can rely on, and #136 writes into #134's module directly. |
| #137 | #133, #134, #135, #136 | unchanged | The creators' overview is the public overview (#134) behind the login (#135) with the + tile that calls `POST /admin/api/trees` (#136). |
| #138 | #133, #136 | unchanged | The Bubble editor calls the field writes; nothing it needs is outside #136 and #133. |
| #139, #140, #141, #144 | #138 | unchanged | Each extends the Bubble editor. #140's upload route is #136's, reached through #138. |
| #142 | #136, #138 | unchanged | The Publish toggle and the collaborator panel call #136's routes inside #138's screen. |
| #143 | #134, #137, #139, #140, #141, #142 | unchanged | It walks what the others built. #144 is the owner's call and is not on its line; if the owner promotes #144, #143's line gains it. |

**The critical path is serial through #136**: #134, then #135, then #136, then #138, then
the longest of #139 to #142, then #143. Nothing can be pulled beside #134 without a second
writer to the data directory, and nothing beside #135 without a second session mechanism;
both are single-implementation decisions by name, which is the test the criterion sets.
The two that can run in parallel are **#137 and #138** from the hour #136 merges, and
**#139 to #142 and #144** from the hour #138 merges.

**The files two branches share.** `docs/specs/application.md`: #134 amends 15, 16 and 23's
overview rows, #135 fills 20, #136 fills 19, 21 and 22 -- disjoint sections, all created by
this freeze so that no build creates a section another is creating. `docs/deployment.md`:
#134 rewrites the folders and the variables, #135 adds the password and the file mode, #136
retires the rsync procedure and adds the import command; #134 lands first and the others
edit its text. `src/config.ts`: #134 alone. `src/store/index.ts`: #134 creates it; #135 and
#136 add members in turn. `deploy/elsa-decisiontree.env.example` and the `Dockerfile`: #134
and #135, in turn.

## Alternatives rejected

- **#134 and #135 in parallel, with #135 creating the data directory when it starts
  first.** Two definitions of `ELSA_DATA_DIR` and two writers to reconcile at merge, or a
  coin toss over which branch owns `config.ts`. The saving is one issue's duration; the
  cost is the one thing `ADR-132-data-directory.md` decided.
- **Splitting the store's skeleton out of #134 into its own issue**, so that #134 and #135
  both depend on something smaller. It would be an issue whose deliverable is a folder, an
  atomic writer and no observable behaviour -- the same objection `ADR-118-build-order.md`
  raised to splitting the reduction out of #120 -- and #134 is its first consumer and
  would ship it anyway.
- **Leaving #135's line as filed**, on the ground that the dispatcher happens to run #134
  first. A line that is true only by dispatch order is the case the criterion exists to
  name.

## Consequences

- The `Depends on:` lines of #135 and #136 are corrected on the issues in this run, and
  the table above is those lines.
- `ADR-131`'s table is superseded for those two rows by this ADR; the rest of it stands.
- #134 is the one to dispatch first and is on every other build's path; its review is the
  round's most consequential.
