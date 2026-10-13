# ADR-247-small-additions-round: the owner's four additions are four build issues, #251 to #254, filed `ready`

- Status: ACCEPTED -- 2026-10-13
- Issue: #247 -- Small additions (the owner's instruction)
- Issues filed: #251 (`ui`), #252, #253 (`ui`), #254
- Specs affected: none here. #251 amends `docs/specs/application.md` 33.2, 33.5 and 33.6; #252
  amends 17.4, `docs/deployment.md` and `docs/hosting-shared-box.md`; #253 amends 24.3; #254
  amends 6 and 38, and trims `docs/hosting-shared-box.md`
- Core document: amended here, marked `[#247]`: the preamble, the status and owner lines, a
  new bullet in 3.4 holding the owner's words whole and the readings taken of them, the row
  **Creator** of section 5, a new line of section 9, and a new **OPEN** row 10.45 for the
  owner

## Context

The owner wrote in issue #247, on 2026-10-13 at 06:44:31Z:

> "- I want the creator of a tree who is not the admin to also have the ability to delete a
> tree, not just the admin, but the admin account should still have the ability to have
> "master rights" so to speak. - At this point, the app is live and will be used, so whatever
> we push should not push or overwrite data items, deletions in existing trees and accounts,
> at this point the hetzner box contains the truth and our code should only push code, not
> data items and json. - We need a back to app button from the account or accounts pages. -
> Let's also delete from the repo all old files that we don't use anymore, all the
> agent-workflow-setup files, except for v0.2.13, and all other files that are not relevant
> and should not be in a public repo."

In the issue the four points are four list items, each starting with "- ". They are quoted
here as one paragraph, wrapped so that no line starts with "- ", because a quoted line that
does is drawn as a list item of the quote.

Under "Task", the owner wrote: "Create issues on the board for these points to be picked up
and set them to ready."

This run read the code, specs and tests on `dev` (`4a8d7b8`) for each point, and measured two
of them.

**Deleting a Tree.** The server already lets a Tree's creator delete it. `permit` in
`src/store/permissions.ts` returns `true` for the administrator on every action and, for
`delete`, `return creator`. `docs/specs/application.md` 21.2's table has "Delete the Tree --
**hidden Trees only**" with creator yes, collaborator no, administrator yes, as
`ADR-132-roles-and-permissions.md` decision 2 has. `tests/admin/trees.test.ts` runs the
`DELETE` route as each role, and `tests/store/permissions.test.ts` checks `permit`; both
pass on `dev`:

```
 Test Files  2 passed (2)
      Tests  34 passed (34)
```

Only the editor hides the button: `deleteTree` stands inside the settings panel's
Administrator section, which `src/editor/Panel.tsx` draws for the role `administrator` alone.
That follows 33.2's sketch, 33.6 ("The administrator only: `handOver` (every active account)
and `deleteTree`") and `ADR-133-top-panel.md` decision 7.

**What a release does to the box's data.** `deploy/shared-box/deploy.sh` replaces
`/srv/elsa/current` and restarts the service. It never writes `/srv/elsa/data`. But the build
traces `trees/` into `.next/standalone/`, so every release carries the repository's two Trees
as JSON. On the box that folder is the default seed, read only when
`/srv/elsa/data/trees/` does not exist (`openStore` in `src/store/index.ts`). A Tree deleted on
the box does not come back (`tests/store/store.test.ts`, "a second start reads no seed: a
Tree deleted from the store does not come back"). A scratch test, deleted afterwards, seeded a
fresh data directory from the repository's Trees, hashed every file, started the store twice
more (once with the administrator's two variables, once without), and hashed again:

```
FILES 98 -> 98
CHANGED ["lock same bytes, rewritten"]
ADDED []
GONE []
SEEDED ai-act-applicability-agrifood,ai-act-example
```

A start still rewrites data files in three cases: a release that carries a new Tree format
converts every older `tree.json` and `draft.json` in place, and nothing keeps the old bytes
(17.4); a release can convert `accounts.json` or `meta.json` (17.4 `[#195]`); and
`ELSA_ADMIN_PASSWORD` or `ELSA_ADMIN_EMAIL`, left in the box's env file, replace the
administrator's password or address where they differ (20.3). 17.4 asks for a backup before
the first start of a converting release, and on the box no person stands between a push to
`main` and that start.

**The account pages.** `/admin/account` and `/admin/accounts` draw the Tree-less admin bar,
`AdminChrome`: the site's title as text, the language switch, `account`, `accounts` for the
administrator, and `logout`. Nothing on either page leads back. This run measured the bar on
`dev`'s production build, in Playwright's Chromium on Windows, at every width from 320 to 800
pixels (800 high), in English and in Dutch, with `measureBar` of `tests/browser/bar.ts`, using
a scratch spec deleted afterwards:

```
dev as it is:
  creator /admin/account   en: fails at none           nl: fails at none
  admin   /admin/accounts  en: fails at 480-489        nl: fails at 480-497
with a stand-in arrow as the bar's first child (24 px below 480, 30 px from 480):
  creator /admin/account   en: fails at none           nl: fails at 480
  admin   /admin/accounts  en: fails at 480-535        nl: fails at 480-543
with the stand-in arrow, and siteTitle and the current language's pill not drawn below 600:
  creator /admin/account   en: fails at none           nl: fails at none
  admin   /admin/accounts  en: fails at none           nl: fails at none
```

Every failure is the site's title on two lines. So `dev` wrapped the administrator's title from
480 to 489 pixels wide (497 in Dutch), a width that 10.6 does not list and no suite measures.

While this run worked, the owner's #248 was filed as #249 and its record merged into `dev`
(`1387673`). #249 gives the controls of this same bar the look of "Editor", and on
`/admin/new`, `/admin/account` and `/admin/accounts` it moves the width below which the bar gives
up the site's title from 480 to 600, measured with its wider controls. That also fixes the wrap
above. The measurements above are of `dev` before #249.

**The repository's files.** The repository is public. Of its 1351 tracked files:
- `agent-workflow-setup-v0.2.2.md` to `v0.2.12.md` are referenced only by a comment in
  `.devcontainer/devcontainer.json`;
- `docs/pipeline-smoke.md` is 14 bytes left by the pipeline's first run;
- `.devcontainer/` is the setup's generic template, which nothing uses.

Private details stand in the documents:
- the owner's personal e-mail address (10 lines, in the core document, three ADRs and
  `docs/specs/application.md` 38);
- the owner's workstation's network name (5 lines);
- a local Windows path and two account ids of the demo server, in
  `ADR-224-editing-existing-trees-round.md`;
- an address of the owner's tailnet, in `tests/config.test.ts`;
- the shared box's SSH policy, its proxy's admin ports, and the other project's services, in
  `docs/hosting-shared-box.md`.

No key, token or password is tracked. The screenshots of the login, account and accounts
pages show only fixture accounts at `example.org`.

## Decision

1. **Four issues, one per point of the owner's, all labelled `ready`.** `ready`, not
   `proposed`, because the owner said so on #247 ("set them to ready"), although
   `.orca/dispatch.yml` has `autonomy: propose`.
   - **#251** (`ui`): the creator sees `deleteTree` in the settings panel, as the
     administrator does, and the server does not change.
   - **#252** (no type label: a build issue):
     - tests pin that a start changes no data file and that an edited seed does not reach
       the store;
     - the release on the box carries no Tree;
     - the deploy takes a copy of the data directory before every release starts, through a
       new `deploy/shared-box/snapshot.sh`;
     - the rule is written into `docs/deployment.md`, `docs/hosting-shared-box.md` and 17.4.
   - **#253** (`ui`): `/admin/account` and `/admin/accounts` begin with #163's arrow back to
     `/admin`, on #249's bar. It re-runs #249's sweep with the arrow, and moves these pages'
     cut up by #249's own rule if a width fails.
   - **#254** (no type label):
     - deletes `agent-workflow-setup-v0.2.2.md` to `v0.2.12.md`, `docs/pipeline-smoke.md` and
       `.devcontainer/`;
     - redacts the private details above;
     - trims the box's security set-up from `docs/hosting-shared-box.md`;
     - says on its pull request what a commit cannot take back.
2. **The readings taken, PROPOSED** (core document 3.4 `[#247]`; the owner can overrule them in
   a new issue):
   - "the creator" is the account `meta.json` names as `creator` now: after a hand-over, the
     new creator deletes and the old one, a collaborator, does not (21.4). "Master rights"
     are 20.3's, unchanged. The creator's button stands in the panel's section "This Tree",
     before the Theme panel, and deletes only a hidden Tree, in 21.2's two steps (#251);
   - "whatever we push should not push or overwrite data items" is a rule for every release:
     no Tree, draft, picture, account or role on the live deployment is written, restored or
     deleted by a release. A format conversion keeps every one of them and changes the
     file's shape only, so it is not an overwrite, and it stays because the app cannot read
     an older format without it. A copy taken before each release starts makes it
     reversible (#252). Because this reading concerns a line of section 9, it is also an
     **OPEN** item for the owner, core document 10.45, which says what changes if the answer
     is no; nothing waits on it, since #252 changes no conversion;
   - "our code should only push code, not data items and json": the release the deploy puts
     on the box carries no Tree. A box whose `data/trees/` is gone then starts with no Tree
     instead of the repository's (#252);
   - "the app" is the creators' overview at `/admin`, the "top level interface" of `[#202]`.
     "A back to app button" is the arrow the editor's bar begins with, the same look and
     name (`toOverview`, "All decision trees");
   - "files that are not relevant and should not be in a public repo" are the unused files,
     the private details and the box's security set-up listed above. The rest is kept:
     - `.orca/`, `.claude/`, `.github/` and `mail/`, which the pipeline runs from;
     - `skills-lock.json`, which records the source of `.claude/skills/`;
     - `Dockerfile` and `.dockerignore`, which `docs/deployment.md` documents as a way to
       deploy;
     - `docs/screenshots/` and `docs/research/`, which the specs and ADRs cite by folder as
       the evidence of what was measured;
     - `trees/`, `tests/fixtures/`, `schemas/` and `fonts/`, which the build and the tests
       read;
     - the owner's name, which the repository's account carries anyway.
3. **Each issue amends its own spec sections and records its own ADR.** This record changes no
   spec. #251 and #252 touch different sections and different code, and wait only on #247.
   #253 also waits on #249, which restyles the same bar and sets the widths at which it gives
   up the site's title. #254 also waits on #252, because both edit
   `docs/hosting-shared-box.md`, and #254 should trim what #252 leaves.
4. **All four depend on #247**, so that none is dispatched before this record is on `dev`.
   Their `Read:` lines name this record and its 3.4 bullet. Each body was final, with its
   `Depends on:` line, when it was filed.

## Alternatives rejected

- **One issue for the four points.** They touch unrelated code: the panel, the deploy
  scripts, the admin bar, and a deletion across the repository. Four runs are smaller and
  review apart.
- **A server change for #251.** 21.2 and `permit` already give the creator `delete`; only the
  button is missing.
- **Forbidding format conversions on the box.** The app cannot read an older format's files,
  so a release that carries a new format would leave every Tree unreadable. A copy before the
  start keeps the owner's truth recoverable at no cost to the format's evolution.
- **Keeping the seed in the box's release.** It is read only when `data/trees/` is missing,
  and then it would put the repository's Trees on the live site, as the administrator's,
  published: the opposite of "the hetzner box contains the truth".
- **A button with words ("Back to the app") on the account pages.** The admin area already has
  one way back to `/admin`, #163's arrow with its name, on the editor, the preview, the 403
  page, the uneditable page and the session Sheet. A second look for the same link would be a
  second thing to learn.
- **The arrow on `/admin/new` too.** The owner named the account pages.
- **A width rule of #253's own.** This run's first draft of #253 moved the cut to 600 itself;
  #249 does that for wider controls, so #253 waits on it rather than set a second rule for the
  same bar.
- **Deleting `docs/screenshots/` (42 MB) and `docs/research/`.** They are old, but specs and
  ADRs cite them by folder as the evidence of what was measured. Pull requests embed their
  pictures pinned to commits, so those would survive a deletion; the citations would not.
- **Rewriting the git history to take the private details out of it.** That means
  force-pushing `dev` and `main`, which no run may do, and the same details stand in public
  issues on GitHub. #254 says so on its pull request, for the owner to decide.
- **Doing the work in this run.** #247's task is to put issues on the board.

## Consequences

- #251 and #252 are dispatched once this pull request merges and closes #247; #253 once #249
  is closed too, and #254 once #252 is.
- After #251, a creator can delete their own hidden Tree; nothing else about roles changes.
- After #252, the box keeps up to ten copies of its data directory under `/srv/elsa/backups`,
  one per deploy. It does so only once the owner has installed the new `deploy.sh` and
  `snapshot.sh` there as root: no run can reach the box without the owner's browser check.
  The release the box serves then carries no seed.
- After #253, the account pages lead back to `/admin`.
- After #254, the repository holds one setup document, v0.2.13, and the documents name no
  private address, machine or account. Older commits and GitHub's issues still do, until the
  owner decides otherwise.
