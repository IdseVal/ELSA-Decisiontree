# ADR-252-a-release-keeps-the-data: the shared box's release carries no Tree, and its deploy copies the data directory before every swap

- Status: ACCEPTED -- 2026-10-13; the readings of the owner's words PROPOSED (core document 3.4
  `[#247]`), and whether a format conversion is allowed **OPEN** for the owner (core document
  10.45)
- Issue: #252 -- A release keeps the box's data
- Spec: `docs/specs/application.md` 17.4, amended `[#252]`; `docs/deployment.md` ("Putting a new
  version"); `docs/hosting-shared-box.md` ("The shape on the box", "Deploying from `main`",
  "Order of work")
- Core document: section 9 `[#247]`, 3.4 `[#247]`, 10.45; unchanged here
- Amends: `ADR-132-data-directory.md` decision 6 (on the shared box the default seed folder is
  absent) and decision 8 (on the shared box the deploy takes the copy itself)
- Round record: `ADR-247-small-additions-round.md`

## Context

The owner wrote in issue #247, on 2026-10-13 (core document 3.4 `[#247]` holds the words whole):

> "At this point, the app is live and will be used, so whatever we push should not push or
> overwrite data items, deletions in existing trees and accounts, at this point the hetzner box
> contains the truth and our code should only push code, not data items and json."

The rule this set is core document section 9's `[#247]` line. #247's run measured what a release
did to the box (the issue's CONTEXT holds the measurements): `deploy.sh` wrote nothing into
`/srv/elsa/data`, but the release it swapped in carried the repository's Trees in
`current/trees/`, the default seed folder, which a start reads when `data/trees/` is missing; and
the first start of a release that carries a new Tree format converts the data directory's files in
place, which nothing kept the old bytes of except a nightly copy up to a day old.

The question of core document 10.45 -- whether such a conversion is allowed on the live server --
was asked on #252 on 2026-10-13 and had no answer when this was built. Nothing here changes a
conversion, so the PROPOSED reading stands until the owner answers.

## Decision

1. **The release on the box carries no Tree.** `deploy/shared-box/deploy.sh` removes
   `$CURRENT.next/trees` after it copies the standalone folder and before the swap. A data
   directory whose `trees/` is gone then starts with no Tree, and its log says
   `No Tree to seed in /srv/elsa/current/trees; the store starts empty`; the copy of decision 2 is
   the way back. A plain server and a container still seed from the release (`docs/deployment.md`):
   the owner's words are about the box.
2. **The deploy copies the data directory before every swap**, through a new
   `deploy/shared-box/snapshot.sh <data dir> <backup dir> <label>`, installed as
   `/srv/elsa/snapshot.sh` beside `deploy.sh`. `deploy.sh` runs it after the build, with
   `/srv/elsa/data`, `/srv/elsa/backups` and `pre-deploy-<UTC time>-<12 hex of the commit>`,
   the commit read after the checkout so a branch name still names one. The script makes the
   folder 0700 (the archives hold password hashes), refuses a label whose archive exists, writes
   `<label>.tar.gz` under a temporary name renamed when whole, and keeps the ten newest archives
   by name, which is by time. A label that is not a plain file name is refused before anything is
   written.
3. **A copy that fails stops the deploy** before the swap and the restart, with a line saying so:
   the running release keeps serving, and the job fails. `tar`'s exit status 1 ("a file changed as
   we read it") is not a failure: the service keeps writing during the copy, and every file in the
   archive is still whole, since the store replaces each file by a rename (17.3).
4. **Every release takes a copy**, not only one that carries a conversion: `deploy.sh` cannot
   tell, and a copy is a few megabytes and seconds.
5. **The tests run the script for real**, under `bash` on CI and under Git for Windows' own
   `bash.exe` on Windows, where `bash` on the `PATH` starts WSL (`tests/shared-box.test.ts`); a
   test reads `deploy.sh` for the order. `tests/store/store.test.ts` pins that a later start of
   the current format writes no data file but `lock`, that a seed changed after the first start
   does not reach the store, and that a missing seed folder starts an empty store.

## Alternatives rejected

- **The store keeping the old bytes beside each converted file** (`tree.json.elsa-tree-6`, ...).
  It changes the conversion, which 10.45 leaves to the owner, scatters files through every Tree
  folder that the loader and the move recipe of 17.4 would then have to know about, and still
  leaves `accounts.json` and `meta.json` to a rule of their own. One archive per release covers
  every file at once, outside the data directory.
- **Stopping the service for a copy exact to the write.** The `elsa` user may only restart the
  service (`deploy/shared-box/sudoers`); widening that to `stop` and `start` gives the deploy more
  than it needs, for a gain of at most one autosave between the copy and the restart, which the
  store tolerates in any copy (17.4).
- **Refusing to start when `data/trees/` is missing.** A first start needs exactly that state, and
  so does a container or plain server that seeds; a box that starts empty and says so is visible
  at once, and the copy brings the Trees back.
- **Leaving the seed in the box's release.** Read only when `data/trees/` is missing, it would then
  put the repository's Trees on the live site, published, as the administrator's: the opposite of
  "the hetzner box contains the truth" (`ADR-247-small-additions-round.md`).
- **Relying on the nightly copy.** It can be up to a day old: a noon deploy that went wrong would
  lose the morning's edits.
- **Copying in the workflow, before it calls `deploy.sh`.** The rule must hold for a deploy run by
  hand on the box, and the box's root-owned `deploy.sh` is what both run.

## Consequences

- Once the owner has installed the new `deploy.sh` and `snapshot.sh` on the box as root
  (`docs/hosting-shared-box.md`, "Order of work" step 6), every deploy leaves an archive in
  `/srv/elsa/backups/`, up to ten, and a `current/` without `trees/`. The first deploy that carries
  them still runs the box's old `deploy.sh`.
- A restore is by hand, with the service stopped (`docs/deployment.md`, "Putting a new version");
  undoing a format conversion needs the release before it back as well.
- `tar`'s exit status 1 is not tested: no test can make a file change mid-read reliably.
- The archives stay on the box, as the nightly ones do; copying backups off the machine is still
  "Order of work" step 5.
