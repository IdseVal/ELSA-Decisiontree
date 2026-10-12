# ADR-131-version-1-0-and-the-editor-round: version 1.0 is preserved on a branch; the editor round is developed on `dev` through two architecture freezes and eleven build issues

- Status: ACCEPTED -- 2026-09-23
- Issue: #131 -- Frontend editor with login (the owner's instruction)
- Core document: `docs/CORE_DOCUMENT.md`, revised 2026-09-23 (sections 2, 3.4, 4, 5, 8, 9, 10.30 to 10.35)
- Specs affected: none rewritten here; `docs/specs/application.md` and `docs/specs/tree-format.md` still describe the code on `dev`, and the sections the round adds are #132's and #133's to write

## Context

The findability round (#118 to #122) merged on `dev` between 2026-09-21 and 2026-09-23.
The owner looked at the result ("The graph looks the way we want to and should be findable
properly for crawlers etc. Good job on that team!") and, in issue #131, opened the round
that #118 had announced as the reason the Tree data moved to JSON: **Trees are created and
edited through the frontend**, because "not all users (academics) can read or write JSON".
The owner's description (quoted in full in core document 3.4) asks for:

1. an **overview page** of all available Trees before the page of one Tree, for end users;
2. an admin area at **`/admin`** behind a **login**, showing the same overview to creators
   with a **+ tile** that creates a new Tree;
3. an **editor** that "looks exactly like the final datastructure" with the Bubble's fields
   editable in place, image upload, explainer marking, a side-bubble + for Options, and
   yes / no / "tree ends here" buttons that create the next Node and move the editor there;
4. **autosave** of every field, with the Tree **hidden** from end users until a creator
   toggles **Publish**;
5. **permissions**: named accounts, everyone creates their own Trees, a creator invites
   collaborators from a top-right panel, and one **administrator** with every permission
   on every Tree, present and future;
6. new pages in the app's present styling; and
7. the app as it currently exists preserved on a branch "called 1.0 or something that
   makes sense ... we also have a 0.1 I think, use the same convention".

Every one of items 1 to 5 contradicts a contract the app was built on: one Tree per
deployment named by `ELSA_TREE` (`ADR-5-tree-selection.md`, core document 10.19); Trees as
files in the repository and a change is a deploy (3.1, 10.16, `docs/deployment.md`); no
accounts, no cookies, no database, no graphical editor (sections 4 and 8); nothing stored
about anyone (section 9); and a Tree that is valid or is not served at all
(`tree-format.md` section 7, `application.md` 5.4) -- while a Tree that is being built is
not valid until its last Answer has a target. The issue's own scope is the branch and the
issues: "Changes to the existing app parts" are out of it.

## Decision

1. **`version-1.0` is a branch, not a tag or a folder**, created from the tip of `dev`
   (`3cb9b25`, "Emit the JSON-LD @graph of 16.4 on every Node page (#122) (#129)") and
   pushed on 2026-09-23. It is the complete state at the end of the findability round:
   code, both Trees in `elsa-tree/4`, the specs, the ADRs, the screenshots, the deployment
   notes. It is not deleted or rebased; nothing is merged into it unless the owner asks.
   The name follows `version-0.1` (#35): the owner said "1.0", and the core document's own
   count (0.1 on #35, 0.2 on #75) does not contradict a 1.0 that closes the rounds in which
   the app became what the owner asked for. `package.json` still says `0.1.0`; that string
   is not part of any contract and is left for the round to change if it wants to.
2. **The editor round is developed on `dev`, in place.** No new repository, no new folder.
   The pipeline, the deployment path, the tests and the history stay, exactly as #35
   decided for 0.2.
3. **The core document is revised now, in this PR**, because the owner's written instruction
   in #131 is the same kind of source as the interview. Every changed passage is marked
   `[#131]` and quotes or cites #131. The owner's words are held whole in a new section
   3.4; sections 2, 4, 5, 8 and 9 are amended additively; open items 10.30 to 10.35 record
   what the Architect must decide and what the owner has not said.
4. **The frozen specs are not rewritten by this issue.** They describe the code on `dev`
   and stay true until the round's issues merge. The contracts the round needs are
   decisions with alternatives -- where the bytes live, what a draft is, what a session
   is, what a screen does -- and the Implementer role does not own contracts. Two
   architecture issues make them, in this order:
   - **#132 freezes the store and the accounts**: many Trees per deployment (supersedes
     `ADR-5-tree-selection.md`), a writable data directory outside the release (10.30),
     a draft that is not yet valid against the published `tree.json` that is (10.33),
     accounts, sessions, CSRF, rate limiting, roles and permissions, the administrator's
     first credential (10.31, 10.32), the server interface the editor calls, and how a
     hidden Tree stays off every public route.
   - **#133 freezes the editor's screens**: the `/admin` routes, the login page, the
     overview with the + tile, the new-Tree form, the Bubble edited in place with the
     limits live, autosave, the structure buttons and the side-bubble +, upload, explainer
     marking, the top-right panel, and the reuse rule that leaves the public components
     unchanged.
5. **The end-user pages of `version-1.0` are not changed in behaviour by the round.** The
   overview page is a new page in front of them; the URL scheme, the Trail in the link, the
   share button, the language mechanism, the no-scroll rule, the Theme and the findability
   contracts stand. Where the round must touch existing code -- the loader opening several
   Trees, the findability documents listing several -- the change is additive, as
   `ADR-5-tree-selection.md` foresaw ("open several folders, keep the URLs"). The reuse
   rule of #133 is what makes the editor look like the final Tree without forking the
   components.
6. **The format stays `elsa-tree/4`.** The editor writes the same file the loader reads and
   the dataset endpoint serves; nothing the owner asked for needs a new key. A draft is the
   same JSON with a named subset of the validity rules relaxed (#132 decides the subset), so
   there is one validator and one loader. Store metadata -- the published flag, the owner,
   the collaborators -- lives outside `tree.json`, because that file is the public dataset
   and carries no account.
7. **End users stay anonymous.** The account, the session cookie and the permission checks
   exist for creators, on the admin routes only. The public routes keep setting no cookie,
   and the sweep in `tests/browser/deployment.spec.ts` stays a contract; section 8 says so
   for creators and end users separately.
8. **The round is thirteen issues, filed `proposed`** (#132 to #144), with `Depends on:`
   lines that order them architecture -> build -> verification:

   ```
              #131  this issue: the branch, the core document, the issues
                |
              #132  architecture: the store and the accounts
                |
              #133  architecture: the editor's screens
                |
        +-------+--------+
        |                |
      #134 many Trees  #135 accounts, login, sessions
      + public overview  |
        |              #136 the store's write path, publish, permissions
        |                |
        +-------+--------+---------------------+
                |                              |
              #137 creators' overview, + tile  #138 the Bubble editor (content, autosave)
                                                |
                          +---------+-----------+-----------+-----------+
                          |         |           |           |           |
                        #139      #140        #141        #142        #144
                        structure images      explainers  Publish +   Theme
                                                          collaborators (owner's call)
                |
              #143 the end-to-end walk (after #134, #137, #139 to #142)
   ```

   | Issue | Type | Depends on |
   |---|---|---|
   | #132 | architecture, complex | #131 |
   | #133 | architecture, complex | #132 |
   | #134 | ui | #132, #133 |
   | #135 | ui | #132, #133 |
   | #136 | data | #132, #135 |
   | #137 | ui | #133, #134, #135, #136 |
   | #138 | ui, complex | #133, #136 |
   | #139 | ui, complex | #138 |
   | #140 | ui | #138 |
   | #141 | ui | #138 |
   | #142 | ui | #136, #138 |
   | #143 | ui | #134, #137, #139, #140, #141, #142 |
   | #144 | ui | #138 |

   The project's autonomy mode is `propose`: the owner promotes them to `ready`. #132
   confirms or corrects the lines by the criterion of `ADR-118-build-order.md`.
9. **#144 is filed although the owner did not ask for it.** A Tree created in the editor has
   no Theme and gets the plain default look, and the only way to give it one is to place
   files on the server by hand, which the round exists to end. It is marked as the owner's
   call in its title; leaving it `proposed` is a decision too.

## Alternatives rejected

- **A tag `v1.0` instead of a branch.** The owner asked for a branch by name and the
  convention is `version-0.1`; a branch can receive a fix if 1.0 is deployed while the
  round is built.
- **`version-0.3`, continuing the core document's count.** The owner said "1.0 or something
  that makes sense"; 0.1 and 0.2 were the owner's names for states the owner then reworked,
  and this one the owner called good. The branch name carries no other meaning.
- **A single `complex` build issue for the whole editor.** It would touch the loader, four
  or five new route groups, a store, a session mechanism and every component in one branch,
  and its review would be the review of a round. The two architecture issues exist so that
  eleven builds can each be reviewed against a contract.
- **One architecture issue instead of two.** The store and the accounts can be decided
  without knowing what a screen looks like, and #134 to #136 can start the day #132 merges;
  the screens cannot be frozen before the store's interface is. Two freezes put the
  largest builds a week earlier.
- **Amending `application.md` and `tree-format.md` in this issue.** The Implementer role
  does not own contracts, and the decisions need their alternatives written down. #35
  rejected the same shortcut for the same reason.
- **Filing the issues `ready`.** The dispatcher demotes `ready` applied by the agents'
  account in `propose` mode unless the account is a trusted promoter; whether it is or not,
  the mode says the owner promotes.
- **Not filing #144.** A visible gap the owner can ignore costs less than an invisible one
  found at the end of the round.
- **Deciding 10.30 here** (a file per Tree committed through git versus a store). The
  owner's "saved automatically" and "hidden until Publish" rule out a deploy per edit, but
  where the bytes live and what a draft is are exactly the decisions the Architect's role
  exists for; the core document records the constraint (no database server, core document
  7) and leaves the choice to #132.

## Consequences

- Until #132 and #133 merge, `dev` carries specs that describe the code on `dev` (1.0),
  which is also what `version-1.0` holds; nothing contradicts anything.
- The core document is the only document that already states the round's requirements in
  full; the Architects derive from it.
- Open items for the owner: 10.31 (who creates accounts), 10.32 (the administrator's first
  credential), 10.33 (what an autosave does to a published Tree), 10.35 (the Theme of a Tree
  made in the editor); each carries a PROPOSED default so that #132 can proceed on it if
  the owner is silent, as 10.23 did.
- `docs/deployment.md` changes with #134 to #136 (a data directory, a credential, backups);
  `docs/pipeline-smoke.md` and the ADRs of earlier rounds are unchanged.
  `ADR-5-tree-selection.md` gets its "superseded by" line when #132 merges, which is in
  that issue's task.
