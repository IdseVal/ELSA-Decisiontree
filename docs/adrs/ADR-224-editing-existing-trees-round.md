# ADR-224-editing-existing-trees-round: the owner's "I want the full editor mode" on the agrifood Tree is one live-server issue, a hand-over, filed `ready`

- Status: ACCEPTED -- 2026-10-09
- Issue: #224 -- Editing existing trees from the /admin view (the owner's instruction)
- Issues filed: #225
- Specs affected: none
- Core document: amended here, marked `[#224]`: the preamble and a new bullet in 3.4 holding
  the owner's words whole and the reading taken of them

## Context

The owner wrote in issue #224, on 2026-10-09 at 20:23:28Z:

> "In the editing view on /admin, if I click on Does the AI Act apply to my agrifood AI
> system? I am routed to the regular front facing user page and not an editor of the tree
> I just clicked on. This is not the functionality we want, when I open this tree, I want
> the full editor mode, I want to be able to change stuff and be able to unpublish it if I
> want."

and under "Task": "Put issue(s) on the board for this and set them to ready (not proposed,
that is not needed for this one)."

What stood where the owner clicked:

PROPOSED (a reading of the log below, which the owner did not state): the owner clicked
on the live demo server, logged in with their own account.

- **The server.** "The editing view on /admin" is the live demo server, http://petercelie:3000:
  the clone `C:\Users\idse_\orca\workspaces\ELSA-Decisiontree\live`, which ran `e190507`
  (`git -C ...\live log --oneline -1`), with its data directory `live-data` beside it.
- **The account.** The log shows that account logging in and creating a Tree at
  20:19:49Z, four minutes before #224 was filed. It is the ordinary account #198 made on
  2026-10-09: Idse Val, `idse.val@wur.nl`, id `0ae8c252375288bd8c3f35bab324b61e`, not an
  administrator. `live-data\accounts.json` holds two accounts: that one and the
  administrator, `d2c24a151ca0a46d0c6a71ff5209e16e`. #198's OUT OF SCOPE said: "Handing
  the existing Trees over to the owner's account: not asked".
- **The Tree.** "Does the AI Act apply to my agrifood AI system?" is
  `ai-act-applicability-agrifood`, whose English title is "Does the EU AI Act apply to my
  agrifood AI system?" in `trees/` and in the live draft. Of the five Trees in
  `live-data\trees`, it is the only one whose title names both the AI Act and agrifood.
  `ai-act-example` is "Does the EU AI Act apply to my AI system? (example)", and the other
  three are titled for the ethics of AI in agrifood. It is one of the two Trees the first
  start seeded from `trees/`. Both were seeded on 2026-09-26 at 12:03Z, before the
  administrator account existed (its `createdAt` is 14:51Z). A later start named the
  administrator their creator (`nameCreator` in `src/store/index.ts`: "the Trees a store
  seeded before accounts existed").
- **The rule the owner met.** On `/admin`, "a tile the caller has a role on (21.1) goes to
  `/admin/trees/<id>/<root>` in the page's language; a tile with no role goes to the public
  page as on `/`" (`docs/specs/application.md` 26.4; `src/app/[lang]/admin/page.tsx`).
  The owner's account had no role on the Tree, so the tile led to the public page, as
  built.

What changed 46 seconds after the issue was filed. The live server's log
(`live\live-server.log`, its last lines on 2026-10-09):

```
account 0ae8c252375288bd8c3f35bab324b61e logged in
2026-10-09T20:19:49.492Z account 0ae8c252375288bd8c3f35bab324b61e created Tree "ethics-of-ai-in-agrifood"
account d2c24a151ca0a46d0c6a71ff5209e16e logged in
2026-10-09T20:24:14.164Z account d2c24a151ca0a46d0c6a71ff5209e16e invited account 0ae8c252375288bd8c3f35bab324b61e to Tree "ai-act-applicability-agrifood"
2026-10-09T20:24:14.501Z account d2c24a151ca0a46d0c6a71ff5209e16e invited account 0ae8c252375288bd8c3f35bab324b61e to Tree "ai-act-example"
account d2c24a151ca0a46d0c6a71ff5209e16e logged out
```

`live-data\trees\ai-act-applicability-agrifood\meta.json` then held
`"creator": "d2c24a151ca0a46d0c6a71ff5209e16e"` and
`"collaborators": ["0ae8c252375288bd8c3f35bab324b61e"]`, written at 22:24:14 local time,
and the live public page `/ai-act-applicability-agrifood/start` said `By Idse Val`. The
server holds the role, so the tile now leads to the editor. No comment on #224 says who
made the invitations; this record names only what the log shows.

A collaborator "edits but does not publish" (21.2). In the editor the publish switch is
`disabled={!manages || busy}`, and `manages` is false for a collaborator
(`src/editor/Panel.tsx`). The server's `permit` answers `publish` for the creator alone
among the Tree's own roles (`src/store/permissions.ts`), and 403 otherwise (21.3). So
"change stuff" holds now, and "be able to unpublish it" does not. The creator role gives
it, and the creator or the administrator hands it over (21.4). The owner's account can do
neither on this Tree.

## Decision

1. **One issue, #225, labelled `ready`.** The administrator hands
   `ai-act-applicability-agrifood` on the live demo server over to the owner's account
   (`PUT /admin/api/trees/ai-act-applicability-agrifood/creator`, 21.4). It is a
   live-server task, like #198, and changes no file of the repository. Its run proves the
   result from `meta.json`, the server's log line and `permit`. It never logs in as the
   owner and never reads the owner's password file. `ready`, not `proposed`, because the
   owner said so on #224 ("set them to ready"), although `.orca/dispatch.yml` has
   `autonomy: propose`.
2. **The reading taken, PROPOSED** (core document 3.4 `[#224]`; the owner can overrule it in a
   new issue): "when I open this tree, I want the full editor mode" is about the owner's own
   access to this Tree, the one named. It is not a change to the rule that every tile on
   `/admin` opens the editor for every account. That rule would let an account edit a Tree
   it has no role on, against 21.2's table and core document 9's last bullet ("No write
   reaches the store without the server checking, for that account and that Tree, that it
   is allowed").
3. **The agrifood Tree alone.** The owner named one Tree. The owner's account is also a
   collaborator on `ai-act-example` since 20:24:14Z; #225's OUT OF SCOPE says so and that
   the owner can ask for it there.
4. **No `Depends on:`.** #225 needs nothing this pull request adds: #132 specified the
   hand-over route, #136 built it (`cb6e4a8`, PR #151), and that commit is an ancestor of
   the live server's build.

## Alternatives rejected

- **Change 26.4 so that every tile on `/admin` opens the editor.** For a Tree the caller
  has no role on, the editor's every read and write is 403 (21.3). Letting every account
  edit every Tree would go against 21.2 and section 9's last bullet (decision 2). A
  read-only editor would be a new screen. The owner asked for neither. If the owner meant
  this, a new issue says so, and it is an architecture issue.
- **Mark on `/admin` which tiles lead to the public page.** The owner asked to edit this
  Tree, not for a mark. It is not filed.
- **Leave the owner a collaborator.** It gives "change stuff" but not "unpublish it if I
  want".
- **Do the hand-over in this run.** #224's task is to put issues on the board. A run that
  changes the live server's data is its own issue, as #198 was, with its proof on the
  issue.
- **Hand over `ai-act-example` too.** Not named by the owner (decision 3).

## Consequences

- #225 was dispatched while this record was being written, and closed on 2026-10-09. Its
  run handed the Tree over at 20:29:23Z (`live\live-server.log`). The owner's account is
  now the agrifood Tree's creator. The administrator is a collaborator on it (`handOver`
  adds the old creator, 21.4), and 39.3 never names the administrator, so the public page
  still says "By Idse Val". The proof is in the run's comments on #225.
- A fresh data directory, such as the one `docs/hosting-shared-box.md` plans, seeds the
  Trees as the administrator's again (`ELSA_SEED_DIR`, README). The hand-over is then done
  again there by the same request. #225 names this and does not do it.
- Nothing in `docs/specs/` changes. Every passage of the core document stays true under
  decision 2's reading, so the only amendment is the `[#224]` bullet that holds the
  owner's words and the reading.
