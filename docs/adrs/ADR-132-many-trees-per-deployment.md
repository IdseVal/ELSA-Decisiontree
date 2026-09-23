# ADR-132-many-trees-per-deployment: a deployment serves every published Tree of its store; `ELSA_TREE` is gone; the loader opens one Tree per folder and the store holds the set; a Tree's public files move under its id

- Status: ACCEPTED (frozen) -- 2026-09-23; decides core document 10.34 and closes 10.19
- Issue: #132 -- Architecture: freeze the store for the editor round
- Spec: `docs/specs/application.md` sections 17 and 18 (new); 2 superseded; 4.1, 4.3,
  5.1, 5.2, 5.3, 5.4, 5.5 and 6 amended
- Supersedes: `docs/adrs/ADR-5-tree-selection.md`. Everything that ADR decided that is not
  "exactly one Tree" carries over: the Tree id in every URL, `/<tree-id>` redirecting to the
  root Node, a reserved id refusing to exist, the folder name as the Tree's id.
- Amends: `docs/adrs/ADR-5-url-scheme.md` (the image and theme addresses gain the Tree id;
  `admin` joins the reserved ids), `ADR-38-theme-delivery.md` (the `src` of an `@font-face`
  is the new theme address), `ADR-118-dataset-endpoint.md`, `ADR-118-crawler-access.md`,
  `ADR-118-sitemap-and-alternates.md`, `ADR-118-json-ld.md`, `ADR-118-llms-txt.md` (each
  reads "the served Tree"; how each reads with many Trees is
  `ADR-132-hidden-trees-and-findability.md`)
- Depends on: `docs/adrs/ADR-132-data-directory.md` (where the set of Trees lives)

## Context

The owner (core document 3.4, #131) asks for "a page with an overview of all available
datastructures" in front of the Tree pages, and for "everyone [to] create their own
datastructure". Both mean a deployment that serves many Trees, and `ADR-5-tree-selection.md`
foresaw it: "a later multi-Tree deployment is an additive change (open several folders,
keep the URLs), not a migration", because the Tree id has been in every Node URL since 0.1.

Three things about the current shape have to change and one must not. `ELSA_TREE` names
the one Tree; the loader holds one `Tree` in a process-wide variable opened once at start
(`src/config.ts`, `servedTree()`); and the server refuses to start on an invalid Tree,
which with many Trees would let one creator's broken Tree take every other Tree offline.
What must not change is any Node URL or share link.

One address of 1.0 cannot survive as it is. `/images/<file>` and `/theme/<file>` name a
file of *the* Tree; with two Trees that each have a `map.png` the address names nothing.

## Decision

1. **A deployment serves every published Tree of its store** (`ADR-132-data-directory.md`),
   and nothing else. "Available" in the owner's words is read as **published**; a hidden
   Tree is not served anywhere (`ADR-132-hidden-trees-and-findability.md`). `/` is the
   **overview page** of every served Tree (issue #134 builds it; #133 decides its look),
   and no longer redirects. `/<tree-id>` still redirects to that Tree's root Node.

2. **`ELSA_TREE` is dropped, and a deployment that still sets it refuses to start**, with
   a message that says what replaced it. Not kept as a pin for a single-Tree deployment: a
   lab with one Tree gets an overview of one tile, which is what the owner asked for in
   front of every Tree, and a pin would be a second mode of every findability document,
   every redirect and every test. `ELSA_TREES_DIR` is renamed `ELSA_SEED_DIR` with a new
   meaning (decision 6 of `ADR-132-data-directory.md`), and the old name refuses to start
   the same way: a variable whose meaning changed silently would import a deployer's Trees
   without telling them. `ELSA_TREE_LASTMOD` goes the same way: the store writes the
   published file, so its modification time is right by construction and there is no copy
   pipeline left to lie about it. `.env.development` sets `ELSA_DATA_DIR` and nothing that
   names a Tree (`ADR-132-data-directory.md`, decision 7).

3. **The loader stays the loader of one Tree folder; the store holds the set.**
   `openTree(dir)` is unchanged in what it does and gains a draft mode
   (`ADR-132-draft-and-publish.md`). Above it, `src/store/` opens the data directory,
   opens every published Tree's folder through `openTree`, and answers two questions the
   routes ask: `published(id): Tree | null` and `publishedIds(): string[]`. `servedTree()`
   in `config.ts` is replaced by the store; nothing else about the loader's interface moves.

4. **The set follows the store without a restart because the process is the store's only
   writer.** A publish, an unpublish, a delete or an autosave that leaves a published draft
   valid (`ADR-132-draft-and-publish.md`) swaps the in-memory `Tree` for that id in the same
   process, in the same call, before the write answers. There is no file watcher and no
   polling: a Tree folder placed on disk by hand is read at the next start, and the seed
   and the import command of `ADR-132-data-directory.md` are the two ways a folder gets
   there.

5. **One invalid Tree does not take the deployment down.** At start the store opens every
   published Tree; one whose file no longer validates in full -- a release tightened a rule,
   a hand edit, a disk fault -- is **published but not servable**: it answers 404 on every
   public route and is absent from the overview and every findability document, exactly as
   a hidden Tree is; its violations are printed at start in the format of 5.4 and are shown
   in the admin area to its creator, its collaborators and the administrator, on its tile
   and on its Publish toggle. The published flag is not touched: it is the creator's, and
   the fix is the creator's next valid autosave, which republishes. The process exits with
   code 1 only when the data directory itself is unusable -- missing, not a folder, not
   writable, or `accounts.json` unreadable. **A deployment with zero servable Trees is a
   valid deployment**: the overview says there are none. The start log prints one line per
   Tree served and one block per Tree refused, and never a password or a session id.

6. **Reserved Tree ids: `images`, `theme`, `schemas` and `admin`.** `admin` is the admin
   area's whole prefix, screens and API alike (`ADR-132-editor-api.md`), so nothing else
   need be reserved for it. A reserved id is refused wherever a Tree id is created: the
   creation form (422), the seed and the import command (skipped with the reason printed).

7. **Every Node URL, share link, dataset URL and redirect of 1.0 resolves as it did**, for
   every Tree that is published. `/<tree-id>/...` was always the grammar; the only thing
   that changes about the Node page is that "the Tree id is not the served Tree" in 4.3
   becomes "the Tree id is not a published Tree of the store".

8. **A Tree's image and theme files move under its id**: `/<tree-id>/images/<file>` and
   `/<tree-id>/theme/<file>`. `/images/<file>` and `/theme/<file>` answer 404 from #134
   on. Neither address can collide with a Node page: `<file>` carries a dot, which the id
   grammar of `tree-format.md` 3.1 does not admit, so both paths are 404 today, exactly as
   `/<tree-id>/tree.json` was before #121 -- **no URL that resolves now resolves
   differently**; the two 1.0 addresses that do change, `/images/<file>` and
   `/theme/<file>`, stop resolving rather than resolve to something else. `imageHref` and `themeHref` in `src/url.ts` take the Tree id; the
   `@font-face` `src` of 13.1 and every `<img>` follow. Image and theme addresses are not
   share links, are not in the sitemap and are cached for an hour; the retirement costs a
   reader nothing they can keep.

9. **The public image route serves what the published copy references**, not what sits in
   the folder: `imagePath(file)` answers `null` for a file no Node of the published Tree
   names, which is the rule `themePath` has had since 0.2 (5.1, "the one way `themePath` is
   stricter"). The `images/` folder of a Tree now holds the draft's uploads beside the
   published copy's pictures (`ADR-132-data-directory.md`), and a picture that is only in
   the draft must not be public (`ADR-132-editor-api.md`, decision 8). The one difference
   between the two path rules goes away.

## Alternatives rejected

- **Keep `ELSA_TREE` as an optional pin: set, one Tree and `/` redirects to it; unset,
  the overview.** Two modes of the front page, of `llms.txt`, of the sitemap and of every
  browser spec, for a deployment that the overview of one tile already serves. The owner
  asked for the overview in front of the Tree pages, not for an option.
- **Serve every folder in the seed directory, as `ADR-5-tree-selection.md` once rejected.**
  It would make a deploy a publish again, which is what "hidden until Publish" ends; the
  store's published flag is the one switch.
- **Reload the set by watching the data directory (`fs.watch`)**, so a folder copied in by
  hand appears at once. `fs.watch` is unreliable across file systems and container mounts,
  a half-copied folder would be read mid-copy, and the one writer that exists is the
  process itself, which knows what it wrote. The import command and a restart cover the
  hand-copied case honestly.
- **Refuse to start when any published Tree is invalid**, as 1.0 does for its one Tree. One
  creator's Tree, or one release that tightens a rule, would take every lab's Tree on the
  host offline. The 1.0 behaviour was right for one Tree owned by the deployer; it is wrong
  for many owned by creators.
- **Unpublish an invalid Tree automatically at start.** It would flip a switch that is the
  creator's, and a release that tightened a rule would silently hide a Tree the creator
  believes is public. Reporting it and leaving the switch is honest; the creator's next
  valid save restores the public copy without a click.
- **Keep `/images/<file>` by looking the file up across every published Tree.** Two Trees
  with a `map.png` -- the example Tree and a copy of it, the commonest case -- and the
  address names two files. First match is a lie waiting; 404 is the truth.
- **`/images/<tree-id>/<file>` rather than `/<tree-id>/images/<file>`.** Equally sound, but
  the dataset endpoint already put everything of a Tree under its id, and one rule ("a
  Tree's public files are under its id") is easier to hold than two.
- **Keep the image route serving the folder, and give the draft its own folder.** Two
  `images/` folders per Tree, and every publish copies pictures between them; a picture the
  draft removed would be deleted from one and kept in the other. One folder and a rule
  about what is public is smaller.

## Consequences

- Issue #134 builds this: `src/store/` (read side), the seed, the overview, the two moved
  routes, `url.ts`'s two changed members, the 404 for a hidden or unknown Tree, and the
  findability documents over many Trees. Its specs to update are named in
  `application.md` 18 and 23.
- `src/config.ts` loses `servedTree`, `openConfiguredTree` and `treeLastmod`, and gains
  the data-directory and seed-directory variables and the refusal of the three retired
  ones. `src/instrumentation.ts` opens the store instead of one Tree.
- `tests/browser/serve.ts` and `playwright.config.ts` start a server per fixture with a
  fresh temporary data directory seeded from that fixture folder (`application.md` 7),
  rather than with `ELSA_TREE`. `theme.spec.ts`, `carousel.spec.ts`, `transition.spec.ts`
  and `deployment.spec.ts` follow the moved image and theme addresses.
- `docs/deployment.md` is rewritten by #134, #135 and #136 around the data directory; this
  freeze adds the stub that names what changes (`docs/deployment.md`, "The editor round").
- The `Dockerfile` and `deploy/elsa-decisiontree.env.example` lose `ELSA_TREE` and gain
  `ELSA_DATA_DIR` (a volume, in the container's case).
- `ADR-5-tree-selection.md` gets its "superseded by" line in this PR.
