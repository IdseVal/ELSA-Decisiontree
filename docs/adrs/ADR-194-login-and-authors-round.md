# ADR-194-login-and-authors-round: the owner's login by e-mail address, the authors on every Tree and the owner's own account are one architecture freeze, two build issues and one step on the demo server, which the owner promoted to `ready`

- Status: ACCEPTED -- 2026-10-03
- Issue: #194 -- login credential should be email and password (the owner's instruction)
- Issues filed: #195 to #198
- Specs affected: none amended here; #195 amends the sections it decides, #196 and #197 what they build
- Core document: amended here, marked `[#194]`: the preamble; a new bullet of 3.4 holding
  the owner's words whole; the login page's sentence in 3.4, and 3.4's passage on what the
  round does not change; a PROPOSED row **Author** in 5; sections 8 and 9; 10.31 and
  10.32. New open items 10.39 (the login) and 10.40 (the authors), OPEN for #195

## Context

The editor round (#131 to #147) and the tree creation round (#169 to #180) are merged on
`dev`; the latter's closing walk, #181, is in review as pull request #193. The owner wrote
in issue #194, under "Context":

> "To login should be based on an email and a password, and graphs should have a small
> mention by who it was authored, if multiple collaborators in the order in which they
> joined a decision-tree. You can make a placeholder account next to the admin account for
> me: idse.val@wur.nl is email, you can create a temporary password for me, I will change
> it when we get there."

and under "Task": "Put issue(s) on the board for this so that the they can be picked up".
The task is the issues, not the changes, as it was in #169.

Two of the three points reverse decisions the editor round froze:

- **The login.** `ADR-132-accounts-and-sessions.md` decision 1 made the login a user name
  -- "**Not an e-mail address**: the application sends no mail, so an address would be
  personal data held for nothing" -- and rejected "E-mail address as login".
  `docs/specs/application.md` 20.1 and 22.1 and core document 10.31 ("a user-name login")
  follow it, and so do the login page (25.1, `ADR-133-login-and-account-pages.md`), the
  accounts page (25.3), the invitation list (21.4, 33.4), the rate limit (20.7), the log
  (20.8), the administrator's fixed login `admin` (20.3) and the tests that log in.
- **The authors.** Core document 8 and 9 hold that nothing about a creator reaches a
  public page or a Tree file; `application.md` 17.2 says `tree.json` "carries no name",
  and 20.1 that an account's name is "shown in the admin area only". The store keeps no
  order of joining: `meta.json`'s `collaborators` is in the order of invitation, and a
  hand-over (21.4) appends the old creator at its end (`handOver` in
  `src/store/drafts.ts`).

The third point is an action on a deployment, not a change of the application: an
account made by the administrator, with a first password handed over out of band, which
10.31 already provides for.

Measured on 2026-10-03, for the decisions on existing stores: the demo server -- the
production build of `dev` that serves http://petercelie:3000 from a clone outside the
dispatcher's worktrees, with its data directory beside the clone -- holds **one account**,
the administrator (login `admin`, display name `Administrator`), and **three Trees**, two
published and one hidden, each created by the administrator and with no collaborators.

## Decision

1. **Three points, four issues.**

   | Owner's point (in the order of #194) | Issue |
   |---|---|
   | 1. "To login should be based on an email and a password" | #195 (contract), #196 (build) |
   | 2. "graphs should have a small mention by who it was authored, if multiple collaborators in the order in which they joined a decision-tree" | #195 (contract), #197 (build) |
   | 3. "You can make a placeholder account next to the admin account for me: idse.val@wur.nl is email, you can create a temporary password for me, I will change it when we get there." | #198 |

2. **One architecture issue, #195, for the two points that touch a contract.** Point 1
   changes the `Account` record, the `Accounts` interface, the login and account routes
   and the administrator of `ADR-132-accounts-and-sessions.md`, a frozen decision that a
   build run reports and does not route around (`.orca/roles/implementer.md`). Point 2
   changes the rule of core document 8 and 9 and of `application.md` 17.2 and 20.1, the
   shape of `meta.json`, and a public page whose every row is counted under the no-scroll
   rule (`application.md` 10.1). Both edit the one interface of 20.1 -- an account's
   `login` becomes an e-mail address, and its `name` stops being "shown in the admin area
   only" -- so one run decides both. What the owner's words leave open is listed in
   #195's TASK and in core document 10.39 (the login) and 10.40 (the authors), as 10.30
   to 10.34 were listed for #132. What they do not leave open is not listed: they make no
   exception for the administrator, so #195 decides which address the administrator logs
   in with and how a deployment supplies it, not whether it logs in with one (core
   document 3.4, 10.32, 10.39).

3. **Order, by `Depends on:` lines only.** #195 waits for #194, so that this record --
   the `[#194]` passages, 10.39 and 10.40 -- is on `dev` before the Architect amends it:
   in the round of #169, #171 and #172 were dispatched while that round's record (#182)
   was still in review, and what its review corrected reached those two runs after they
   had started, as edited issue bodies and comments. #196 waits for
   #195. #197 waits for #195 and #196: #196 moves logging in from a user name to an
   address in every test that logs in and changes the list a creator invites from, and
   #197's browser tests log in and invite; built side by side, one of the two would merge
   into a `dev` on which its tests no longer log in. #198 waits for #196, whose login the
   owner's account needs.

4. **All four are labelled `ready`, by the owner.** The issues' timelines show the owner's
   account, `IdseVal`, applying `ready` to #195 to #198 between 16:12:41Z and 16:12:43Z on
   2026-10-03, while their bodies were still placeholders; the account that filed them,
   `DeKnecht`, applied no `ready`, only `architecture` to #195 and `ui` to #196 and #197.
   The project's autonomy mode is `propose`, in which an issue an agent files is labelled
   `proposed`, never `ready` (`.orca/roles/planner.md`). This record does not read #194's
   "so that the they can be picked up" as leave for an agent to label them `ready`, and is
   no precedent for an agent doing so on a reading of the owner's words: the rounds filed
   `ready` before it rested on the owner's explicit words (`ADR-75-presentation-changes.md`
   decision 7, `ADR-169-tree-creation-ui-round.md` decision 4), and this one rests on the
   owner's own promotion. None is labelled `complex`.

5. **Where the owner's words leave a choice, the record says which reading was taken and
   does not widen the request.** Each is in core document 3.4's `[#194]` bullet, marked
   PROPOSED, and in the issue concerned, so that the owner can overrule it there:
   - "graphs" is read as Trees: section 5 lists "graph" among the owner's words for a Tree.
   - "by who it was authored, if multiple collaborators in the order in which they
     joined": the authors are the Tree's creator and its collaborators, in the order in
     which they joined it, so the creator who made the Tree comes first. #195 confirms or
     replaces this and decides what the words leave open: a collaborator removed, a
     deactivated account, the administrator, a Tree handed over.
   - Each author is named by the name of their account -- the name every creator has
     (3.4, #131) -- and by nothing else: not the address, not the account's id.
   - "To login should be based on an email and a password" changes what a person types to
     log in. The application still sends no mail (core document 7, 10.31), and none of
     the four issues adds any.
   - "a placeholder account next to the admin account for me": an ordinary account, not
     a second administrator (20.3 allows one), named "Idse Val" as the core document names
     the owner, made on the demo server the owner's #162 was about, its temporary password
     handed over out of band (10.31) in a file on that machine beside the administrator's,
     and never in the repository, an issue, a pull request or a log (#198).
   - #198 changes no file of the repository and has no pull request: its run makes the
     account, comments, and closes the issue. It may refresh the demo server with that
     server's own script to bring #196's code to it, and stops to ask the owner for any
     value the new release needs that only the owner can choose.

6. **The core document is amended here for every passage the owner's words make
   untrue**, the lesson of #182's second round. Each passage carries a `[#194]` mark that
   points at the new bullet of 3.4, which holds the owner's words whole: the login page's
   "a name, a password" (3.4); in 3.4's passage on what the round does not change, the
   end-user pages and the Tree format, which the mention of who authored a Tree changes
   wherever 10.40 places it (3.4); the account record's login and "nothing about a
   creator is shown on a public page" (8); "nothing about a creator may reach a public
   page" (9); "a user-name login" (10.31); the administrator's `admin` account (10.32).
   What is not the owner's is marked PROPOSED (decision 5) or left to #195 as an open
   item; the new vocabulary row **Author** is PROPOSED.

## Alternatives rejected

- **Asking the owner first, with `needs-human`, about the details the words leave open.**
  Which address the administrator logs in with, what existing accounts get, where the
  mention stands and the order after a hand-over are contracts: the Architect's to decide
  and the owner's to overrule, as 10.31 and 10.32 were on #132. A value only the owner can
  choose -- an address for the administrator account, if #195 needs one -- is asked by
  #195 or #198 once it is known to be needed.
- **Two architecture issues, one per point.** Both rewrite the `Account` interface of 20.1
  and the rule of core document 8 and 9; two runs on one interface and one rule are two
  pull requests in conflict.
- **No architecture issue.** A build run would have had to supersede
  `ADR-132-accounts-and-sessions.md` decision 1 and choose a row of the public page under
  the no-scroll rule on its own; the implementer role tells it to report a contradiction
  with a spec and to ask rather than build its best guess.
- **One build issue for the login and the authors together.** They change different parts
  of the application -- the accounts, the login and their pages; `meta.json` and the
  public page -- with different tests, and one run would carry both under one run's time
  ceiling (`max_run_minutes`, `.orca/dispatch.yml`).
- **#197 beside #196.** See decision 3.
- **Making the owner's account in this run.** The login is still a user name on `dev`, so
  the account would be made with a login the owner did not ask for and converted later;
  and the task of #194 is the issues.
- **The owner's account in the repository** -- a seed, a test fixture, or the code that
  makes the administrator. It would publish a password's hash in a public repository, and
  make the account on every deployment, where the owner asked for one beside the admin
  account.
- **Labelling the issues `proposed`.** In `propose` mode that is the label an agent gives
  an issue it files, and promoting it to `ready` is the owner's step
  (`.orca/roles/planner.md`). The owner took that step for all four before this run
  labelled any of them (decision 4), so a `proposed` label would have contradicted the
  owner's own promotion.

## Consequences

- The dispatcher holds #195 until this pull request merges and closes #194; then #196;
  then #197 and #198, side by side.
- The specs are not amended here; until #195 merges they describe what is on `dev`, which
  is correct. Core document 3.4, 5, 8, 9, 10.31 and 10.32 state the owner's change from
  the moment this merges, ahead of the build, as the core document did in the rounds of
  #75, #131 and #169; 10.39 and 10.40 are OPEN until #195 decides them.
- If #196 builds the login on a `dev` the demo server does not yet run, #198 refreshes
  and restarts that server; the owner reads the temporary password on the machine that
  serves it.
- Every test that logs in by user name today changes with #196.
