# ADR-132-data-directory: the store is one writable folder outside the release, `ELSA_DATA_DIR`; JSON files and a per-file write queue, no database library; the repository's `trees/` seeds it once

- Status: ACCEPTED (frozen) -- 2026-09-23; decides core document 10.30 and restates 10.16
- Issue: #132 -- Architecture: freeze the store for the editor round
- Spec: `docs/specs/application.md` section 17 (new); `docs/specs/tree-format.md` 2 and 10
  amended; `docs/deployment.md`
- Amends: `docs/adrs/ADR-37-single-file-layout.md` (the Tree folder gains `draft.json` and
  `meta.json`, both ignored by the loader of the published file),
  `ADR-5-repository-layout.md` (`src/store/` joins `src/`), `ADR-5-testing-approach.md`
  (a fixture is seeded into a temporary data directory)

## Context

Until now a Tree is files in the repository, copied to `/opt/elsa-decisiontree/trees/` by
a deployer, read once at start and never written (core document 3.1, 10.16;
`docs/deployment.md`). The owner's "saved automatically" and "hidden until Publish" (3.4)
make the application a writer: of drafts on every keystroke, of published copies, of
uploaded pictures, of accounts and sessions. Open item 10.30 asks where those bytes live.

The constraint that stands is 10.16's reason and core document 7: **a plain Linux box with
nothing to run beside Node** -- no database server, no object store, no compiler. Two
candidates fit it: plain JSON files, and SQLite through `node:sqlite`. The numbers the
store has to carry are a lab's: a handful of accounts, tens of Trees at most, a few open
sessions, and one draft file per Tree that is written on every autosave.

Measured on the Node this repository pins (22.18): `node:sqlite` loads without a flag and
prints `ExperimentalWarning: SQLite is an experimental feature and might change at any
time`; `node:crypto` has `scrypt` and no `argon2`.

## Decision

1. **One writable folder, `ELSA_DATA_DIR`, outside the application folder.** Required in
   production; no default, and the server refuses to start when it is unset, is not a
   folder, or cannot be written -- the same treatment `ELSA_TREE` had, for the same
   reason: a missing setting must be a server that does not start, not one that serves
   nothing. A release replaces `app/`; the data directory is never inside it, so a release
   never touches a draft or an account.

2. **Its layout**, and it is the whole state of a deployment:

   ```
   $ELSA_DATA_DIR/
   ├── accounts.json                every account (ADR-132-accounts-and-sessions)
   ├── sessions.json                the server-side session records
   └── trees/<tree-id>/
       ├── meta.json                creator, collaborators, timestamps, revision, publishedAt
       ├── draft.json               the draft: elsa-tree/4 JSON in the byte form of 3.7,
       │                            under the draft rules (ADR-132-draft-and-publish)
       ├── tree.json                the published copy; present if and only if the Tree is
       │                            published; always a Tree that validated in full
       ├── images/                  every uploaded picture: the draft's and the published copy's
       └── theme/                   the Theme's files (#144)
   ```

   **A Tree is a folder, and the folder's name is its id**, as in the repository. Store
   metadata lives in `meta.json` beside the Tree and not in `tree.json`, because
   `tree.json` is the public dataset and carries no account (core document 8). The
   published flag is not a field: **a Tree is published if and only if `tree.json` exists**
   in its folder. Fewer states than a flag and a file that must agree, and a backup reads
   as what it is.

3. **JSON files, not `node:sqlite`, and no other library.** Three reasons, in order of
   weight. `node:sqlite` is experimental on the Node this project runs, by its own warning;
   a store contract on an interface whose authors say it may change is not a contract, and
   the alternative, `better-sqlite3`, is a native module that wants a compiler on the
   server (core document 7). The drafts are JSON files whatever the store is -- the same
   `elsa-tree/4` file the loader reads -- so a database would be a second mechanism beside
   the first for the smaller half of the data. And the volumes are a lab's: a full read of
   `accounts.json` on every request is microseconds, and no query the application makes
   joins two files.

4. **Concurrency: one process is the only writer, and every file has a write queue.** All
   state is held in memory after `openStore`; a write mutates memory, then serialises the
   whole file and writes it **atomically** -- to `<file>.tmp` in the same folder, then
   `rename` over the original, which POSIX makes atomic -- through a **per-file promise
   queue** so that two writes to one file never interleave and land in the order they were
   accepted. Reads never touch disk. What this gives: no torn file, ever; writes to one
   Tree in order; writes to two Trees in parallel; a crash loses at most the write in
   flight, whose `.tmp` is deleted at the next start. What it does not give, and nothing
   here needs: a transaction across two files, or a second process. **Two processes on one
   data directory are not supported**; `openStore` writes a `lock` file holding its pid
   and refuses to start while another live pid holds it.

5. **The repository's `trees/` stays the seed and the fixtures.** Both Trees and every
   fixture under `tests/fixtures/` are folders of the same shape a store folder has minus
   `meta.json` and `draft.json`, so one function, `importTree(folder, creator)`, turns a
   repository Tree into a store Tree: it copies `tree.json`, `images/` and `theme/`, writes
   `draft.json` as a byte copy of `tree.json`, and writes `meta.json` with the given
   creator and `publishedAt` now. A seeded Tree is therefore published from its first
   start, which is what a 1.0 deployment upgrading to this round expects of its Tree.

6. **`ELSA_SEED_DIR`, default `trees` under the working directory, is read at the first
   start only**: when `$ELSA_DATA_DIR/trees/` does not exist, every Tree folder in the seed
   directory is imported with the administrator as creator. At every later start it is
   not read at all. The standalone build already traces `trees/` in beside `server.js`,
   so the default is right for the plain server and the container alike, and a fixture
   spec points it at one fixture folder.

7. **Importing later, and moving a Tree between deployments, is one command**:
   `node scripts/store.ts import <folder>` (`npm run store -- import <folder>`), run with
   `ELSA_DATA_DIR` set and **the service stopped**, because the process is the only writer
   and would not see the folder until its next start anyway. It calls the same
   `importTree`, refuses an id that exists or is reserved, and validates the folder in
   full first. To move a Tree: copy `trees/<id>/tree.json`, `images/` and `theme/` from
   one data directory -- `draft.json` and `meta.json` stay behind, because the draft is
   the creators' work in progress and the metadata names accounts of the source
   deployment -- and import them on the other, where the importing deployment's
   administrator becomes the creator. The `export` is `cp`; nothing is encoded.

8. **A deployer backs up `ELSA_DATA_DIR`**, one folder: `rsync -a` or `tar` of the running
   directory is safe because every file is replaced atomically, so each file in the copy
   is whole; a copy taken while the service runs may hold a `draft.json` one write newer
   than its `meta.json`, which the store tolerates (revision is advisory). For a copy that
   is exact to the write, stop the service first. Restoring is copying the folder back and
   starting; nothing outside it, and nothing in `app/`, holds state.

9. **Development sets `ELSA_DATA_DIR=.elsa-data` in `.env.development`**, gitignored, and
   the seed default fills it from `trees/` at the first `next dev`. Deleting the folder is
   the reset.

## Alternatives rejected

- **`node:sqlite`.** One file, real transactions, indexes, and a query language for a store
  that never queries. Rejected on the warning it prints: the project would be freezing a
  contract on an interface Node calls experimental on the version it pins. It is the right
  answer the day the warning goes and the store outgrows a lab; both files of the store are
  small enough that the migration would be a script.
- **`better-sqlite3` or another package.** A native dependency means a compiler or a
  prebuilt binary matched to the server's Node and libc; core document 7 rules the first
  out and the second is the vendor-shaped dependency the project has avoided so far.
- **A database server.** 10.16, unchanged: nothing runs beside Node.
- **Committing edited Trees back to the repository through git** (10.30's first option).
  It keeps the review and the history and it cannot autosave: a commit per keystroke,
  credentials on the server, and a deploy per publish, which "hidden until Publish" in the
  owner's own app makes redundant. The history the owner may want is a later question and
  a later issue.
- **A published flag in `meta.json` beside the file.** Two facts that must agree, and a
  restore, a hand edit or a crash between the two writes makes them disagree. The file's
  existence is one fact.
- **A central `trees.json` instead of a `meta.json` per Tree.** Rewritten on every publish
  of any Tree, and it breaks the property that a Tree is one folder a person can copy.
- **Seeding at every start** (import any seed Tree the store lacks). A Tree a creator
  deleted would return at the next restart, because the seed folder is replaced by every
  release. Once, and then the command.
- **Sessions in memory only.** Every restart -- and a deploy is a restart -- would log every
  creator out mid-edit. One small file is cheaper than that.
- **Sharing one `images/` between draft and published copy with a copy on publish
  instead.** See `ADR-132-many-trees-per-deployment.md`: one folder, and the public route
  serves what the published copy references.

## Consequences

- `src/store/` is a new module folder (`application.md` 6): `openStore`, the atomic
  writer and its queues, `importTree`, and the three parts the next ADRs define --
  accounts and sessions, drafts and publishing, permissions. Nothing outside it opens a
  file under `ELSA_DATA_DIR`; the routes call the store, and the components call nothing.
- `tree-format.md` 2 gains the sentence that `draft.json` and `meta.json` are files the
  loader of the published copy ignores, which its "anything else is ignored" rule already
  said and now says by name; section 10's open bullet is decided.
- `docs/deployment.md`'s "put a new version of a Tree on the server" procedure -- validate,
  rsync, restart -- is retired by #136: a Tree changes through the editor. What remains is
  the import command, for a Tree that arrives as a folder.
- The deployment's environment file now holds a secret at first start
  (`ADR-132-accounts-and-sessions.md`, decision 5) and its mode becomes `0600`.
- `scripts/store.ts` is #136's; the seed is #134's; both call `importTree`.
