# ADR-133-editor-testing: one browser spec per build issue against a data directory the helper builds from fixtures and a table of accounts; one login helper; the admin pages measured by the no-scroll test with the scroll boxes exempted; the no-cookie sweep asserts the public routes still set none and the login route alone sets one; the public suites run unchanged

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 35 (new); 7 amended
- Amends: `docs/adrs/ADR-5-testing-approach.md` and `ADR-38-modules-and-tests.md` (the
  rows below), `ADR-132-accounts-and-sessions.md` (decision 8: the sweep's logged-in half,
  restated with the admin pages)
- Depends on: `docs/adrs/ADR-132-data-directory.md` (the store's layout is what the
  helper writes), `ADR-133-reuse-rule.md`

## Context

Section 7's rule: a claim about markup is a unit test, a claim about layout, motion or
network needs a browser; every contract arrives with the test that would fail if it
regressed, in the same branch as the code, and every row names the build issue that writes
it. #132 added the store's unit tests and three browser rows (23.7) and decided that a
browser spec starts its server with `ELSA_DATA_DIR` a fresh temporary directory (7). The
editor's specs need what no fixture has yet: accounts with known passwords, a hidden Tree
with a creator and a collaborator, a draft at every maximum the format allows, and enough
published Trees to make the overview's box scroll.

## Decision

1. **A data directory is built by a helper, not committed.** `tests/browser/admin.ts`
   exports `buildDataDir(spec): Promise<string>`: it makes a temporary directory
   (`fs.mkdtemp`) in the store's layout (17.2) from a spec that names, per Tree, the
   fixture folder to copy (`trees/ai-act-example`, `tests/fixtures/full-node`, ...), the
   id to copy it under, whether it is published (then `tree.json` is a byte copy of the
   fixture's and `draft.json` too) or hidden (`draft.json` only), the creator and the
   collaborators by login; and, per account, the login, the name and the password. It
   writes `accounts.json` with hashes it computes by the format of 20.2 (`scrypt`, the
   same parameters, the same string), `meta.json` per Tree, and an empty `sessions.json`.
   `tests/store/accounts.test.ts` (#135) opens a directory this helper built and
   authenticates against it, which ties the helper's hash to the store's. A **draft**
   fixture that a published Tree could not hold -- a Node with one Answer, an empty root,
   an unmarked explainer -- is a folder under `tests/fixtures/drafts/<state>/` (#136
   creates the first ones, 23.7) copied the same way.

2. **One server per spec, one login helper.** `serveStore(dataDir, port, env?)` starts the
   standalone build with `ELSA_DATA_DIR` set to the directory, `ELSA_SEED_DIR` an empty
   folder (so nothing is seeded), `ELSA_ADMIN_PASSWORD` from the accounts table, on a port
   at an offset from `BASE_PORT` as `serve.ts` does; it is `serve.ts`'s second export,
   beside the one that serves a fixture folder, and it replaces that one's `ELSA_TREE`
   environment with the store's (18.4). `login(page, login)` posts the account's password
   from the table to `/admin/api/login` through `page.request`, so the cookie lands in the
   context and every page the test opens carries it; `logout(page)` posts to the logout
   route. A spec that needs two accounts at once opens two browser contexts and logs each
   in.

3. **The named accounts and Trees of the editor specs.** Every editor spec builds from one
   table so that the walk (#143) and the parts agree: accounts `admin`, `anna` (a
   creator), `bram` (a collaborator), `cees` (no role); Trees `ai-act-example` published
   with `anna` as creator, `hidden-draft` hidden with `anna` as creator and `bram` as
   collaborator (from `tests/fixtures/full-node`, so the editor is measured at every
   maximum), and, for the overview's box, `tree-01` to `tree-14` published from
   `tests/fixtures/single-language`.

4. **The test files, per build issue.** Unit files under `tests/editor/`, browser specs
   under `tests/browser/`; each row is written by the issue in brackets, and no build issue
   of this round is done while its row is empty:

   | File | Asserts | Issue |
   |---|---|---|
   | `tests/browser/overview.spec.ts` | The public overview: one tile per published Tree with logo, title, cut description and language tags; the link to the root in the page's language; a hidden Tree absent; the box scrolls and the document does not; `noTrees` on an empty store | #134 |
   | `tests/browser/login.spec.ts` | `ADR-133-login-and-account-pages.md`: the fields, the one error, the lock, the reload to the address asked for, the `<noscript>` sentence, the 403 page, the account and accounts pages, logout | #135 |
   | `tests/browser/admin-no-scroll.spec.ts` | The exact test of 10.6 at its ten viewports over the admin pages, with `[data-scroll-box]` exempted beside `[data-carousel-strip]`: the login page, the 403 page, the account and accounts pages (#135); the creators' overview with fifteen tiles, the new-Tree form with three languages (#137); the editor on `hidden-draft`'s full Node in `en` and `nl`, with each Sheet open in turn -- the Overlay of each Option edited, the enlarged view in edit mode, a Source's Sheet, the outcome Sheet, the picker, the explainer Sheet, the top panel with its to-do list of twenty lines, the session Sheet -- and with the description in its source state (#138, each later issue adding its Sheets) | #135, #137 to #142 |
   | `tests/browser/creators-overview.spec.ts` | `ADR-133-overview-tiles.md` decisions 3 and 4 and `ADR-133-new-tree-form.md`: `anna` sees `hidden-draft` and `cees` does not; `admin` sees every Tree; the + tile absent for a visitor; the two groups; the form's proposal, errors and landing | #137 |
   | `tests/editor/field.test.tsx`, `queue.test.ts`, `imports.test.ts` | The counter, the plain field's rule, the two states; the debounce, blur, order, retry ladder, the pause on 401; the import rule of `ADR-133-reuse-rule.md` decision 4 | #138 |
   | `tests/browser/editor.spec.ts` | `ADR-133-bubble-edited-in-place.md` and `ADR-133-autosave.md`: the regions in place; typing a title saves it and the public page shows it after publishing through #136's route; past 80 the pill and the indicator, the same rule id as `npm run validate --draft`; the switch edits `nl` without touching `en`; the tags on the rim; the three indicator states; a refused write kept on screen; two contexts and `changedElsewhere`; the session Sheet after the cookie is cleared | #138 |
   | `tests/browser/structure.spec.ts` | `ADR-133-structure-editing.md`'s consequences, and the Node count reconciled against the published `tree.json` | #139 |
   | `tests/browser/upload.spec.ts` | `ADR-133-images-in-the-editor.md`'s consequences, and the public page's request list against 11.5 after publishing | #140 |
   | `tests/editor/slug.test.ts`, `tests/browser/marking.spec.ts` | `ADR-133-explainers-in-the-editor.md`'s consequences; `explainer.spec.ts` untouched and green | #141 |
   | `tests/browser/panel.spec.ts` | `ADR-133-top-panel.md`'s consequences, with the public overview's tile list before and after publishing | #142 |
   | `tests/browser/admin.spec.ts` | The walk of #143 as administrator, creator, collaborator and visitor, with screenshots under `docs/screenshots/editor/` | #143 |
   | `views.test.tsx` | Gains `ADR-133-reuse-rule.md` decision 8: no editor element in a public render; the same markup with an empty `edit` | #138 |

5. **The no-cookie sweep, extended.** `deployment.spec.ts` (#135, per 20.5 and 23.7) gains,
   beside its logged-in half: a `GET` of every admin **page** of `ADR-133-admin-routes.md`
   decision 1, with and without a session, answers no `Set-Cookie` -- only `POST
   /admin/api/login` and `POST /admin/api/logout` ever do -- and every one carries
   `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store` (20.9); and after the
   editor has saved a field, the walk of every public route of 4.1, 15 and 16 still sends
   no `Cookie` and receives no `Set-Cookie`. The list of public routes is the one array
   the spec already has; the list of admin pages is a second array in the same file, so a
   page added without a line is visibly absent.

6. **The public suites run unchanged.** #134 to #142 do not edit a public spec except to
   add a row a section of this freeze names (the overview in `no-scroll.spec.ts`, the
   moved image addresses of 18.1 in #134); every pull request runs the whole of `npm test`
   and `npm run test:browser` and pastes the counts, which must not fall. The Verifier
   reads a changed public spec in a #138 to #142 branch as a send-back.

7. **Screenshots.** Every build issue's DONE WHEN names its screenshots; they are taken at
   1280 x 640 by the spec under `ELSA_SHOTS=1` into `docs/screenshots/issue-<n>/`, as
   `explainer.spec.ts` does, and embedded in the pull request pinned to a commit.

## Alternatives rejected

- **A committed data-directory fixture** (`tests/fixtures/data-dir/`). Password hashes in
  the repository, `meta.json` files naming account ids that must agree with
  `accounts.json` by hand, and fourteen copies of a Tree; a helper builds it in a second
  from fixtures that exist.
- **Creating the accounts and Trees through the API in a `beforeAll`.** Honest and slow:
  a draft at every maximum is a hundred writes, and a spec that fails in its setup blames
  the wrong thing. The helper writes the store's own file layout, which 17.2 documents as
  the contract.
- **A login by filling the form in every spec.** Twenty specs typing a password; the
  request helper is one call and `login.spec.ts` is where the form is tested.
- **A single `admin.spec.ts` for everything, grown by each issue.** Six issues in parallel
  editing one file; the walk of #143 is the one spec that crosses them all, and it comes
  last.
- **Exempting the admin pages from the no-scroll test.** The rule is the owner's absolute
  one and the panel, the Sheets and the editor at every maximum are exactly where it can
  break.

## Consequences

- `application.md` 7 gains a pointer to 35 and the two helper rows; 35 holds the table.
- #135 creates `tests/browser/admin.ts` and `admin-no-scroll.spec.ts`; every later issue
  adds its rows and files as the table says.
- `playwright.config.ts` is unchanged in shape: the example server it starts serves a
  seeded store (#134), and the editor specs start their own.
