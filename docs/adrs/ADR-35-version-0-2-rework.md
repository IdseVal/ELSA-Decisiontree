# ADR-35-version-0-2-rework: version 0.1 is preserved on a branch; version 0.2 reworks the presentation on `dev` by re-freezing the contracts through new architecture issues

- Status: ACCEPTED -- 2026-09-09
- Issue: #35 -- Reworking the app (the owner's instruction)
- Core document: `docs/CORE_DOCUMENT.md`, revised 2026-09-09 (sections 3.1, 3.2, 3.3, 4, 5, 6, 9, 10)
- Specs affected: `docs/specs/tree-format.md` (elsa-tree/1), `docs/specs/application.md`, both marked "superseded in part" pending #37 and #38

## Context

Version 0.1 of the application and of the first Tree were merged on `dev` between
2026-09-03 and 2026-09-09 (issues #4 to #34). The owner looked at the result and, in
issue #35, wrote five instructions that contradict the contracts those issues were built
on:

1. The screen must resemble a tree: the open Node is a round **bubble**, the Nodes above
   it (the Trail) are visible, clickable branches, and the children and side children
   branch out of it. Version 0.1 draws a column of text with the Trail as a line.
2. Moving to the next Node must be a smooth **slide** of the whole tree, which means the
   neighbouring Nodes (the owner suggests the next two in each direction) are already
   rendered off-screen. Version 0.1 renders exactly one Node per page on the server and
   promised that "never a second Node is read to render a page".
3. **Nothing on the page may scroll**: a Node's content fits in its bubble, so the data
   needs length limits and long Nodes become several steps. Version 0.1 has no limits and
   authored the root Node with seven categories and six exclusions in one file.
4. The look (the ai4sfs.org styles and logo) must be **loaded from the Tree data**, so
   another ELSA lab loads its own branding. Version 0.1 fixes the look in the frontend's
   stylesheet and forbids run-time fetches from third parties (which still holds).
5. The Tree must be **loadable from a single file**, because a folder of 61 Node files
   is "not easy to work with or navigate for a human". Version 0.1 froze one file per
   Node (`ADR-4-file-layout.md`) precisely to make lazy loading trivial. The owner's
   stated alternative, an in-view editor, is a lot of work and is an explicit non-scope.

The owner also asked where the images are. The format has room for them
(`ADR-4-image-reference.md`); the first Tree was authored without any. That is a content
gap, not a contract conflict, and is filed as #45. The owner reversed the earlier
"thumbnails, no carousel chrome" decision (core document 10.6): Images are shown as a
**carousel** below the bubble.

Two things the owner explicitly kept: the language mechanism, and the way navigation
follows the URL with the copy-link (share) option.

The issue's task is: preserve the current version in a branch `version-0.1`, start the
new version on `dev`, change the architecture and the core document where they conflict,
and file the issues for the rework so the dispatcher can pick them up.

## Decision

1. **`version-0.1` is a branch, not a tag or a folder.** It was created from the tip of
   `dev` (`fcf2675`, "Walk the first Tree in the running app and re-take its screenshots
   (#23) (#33)") and pushed on 2026-09-09. It is the complete 0.1 state: code, both Trees,
   the frozen `elsa-tree/1` and application specs, screenshots and deployment notes. It is
   not deleted or rebased; nothing further is merged into it unless the owner asks.
2. **Version 0.2 is developed on `dev`, in place.** No new repository, no new folder.
   The pipeline, the deployment path, the tests and the history stay.
3. **The core document is revised now, in this PR**, because the owner's written
   instruction in #35 is the same kind of source as the interview it came from. Every
   changed passage is marked `[v0.2]` and cites #35; open items 10.21 to 10.25 record the
   decisions that still wait.
4. **The frozen specs are not rewritten by this issue.** Each contract they hold is either
   unchanged or superseded, and both documents now say which is which at the top and point
   at the successor issue. The successors are architecture issues, because the specs
   themselves say a change needs one and a new format number, and because the choices
   involved (one file versus lazy loading; theme assets versus path safety; length limits
   versus what a screen can hold; pre-rendering versus "never the whole Tree") are the
   Architect's, with the Architect's skills:
   - #37 freezes `elsa-tree/2`: one file per Tree, a `theme` block, length limits, images
     unchanged, and a mechanical migration from `elsa-tree/1`.
   - #38 freezes the 0.2 application contracts: tree view, transitions and pre-rendered
     neighbours, the no-scroll rule and its test, the carousel, and the theme mechanism.
5. **The owner's "single file OR an editor" is resolved as single file.** A graphical
   editor is an explicit non-scope of the core document (section 4) and the owner called
   it "a lot of work"; the single file is the option consistent with everything else the
   owner said. Section 4 now records the editor as the owner's fallback if a single file
   turns out not to be hand-editable, so the choice is visible, not buried.
6. **"Children" and "side children" are read as Answer targets and Option targets.** The
   owner did not define them. This is the reading that fits the vocabulary (a Node's
   outgoing Links are its Answers and its Options) and it is marked PROPOSED in the core
   document (10.23) for the owner to confirm or correct before #38 freezes the view.
7. **The rework is eleven issues, filed `proposed`** (#36 to #46), with `Depends on:`
   lines that order them research -> architecture -> build -> content -> verification.
   The project's autonomy mode is `propose`: the owner promotes them to `ready`. The
   order is: #36 research (visual identity) and #37 architecture (format) in parallel;
   #38 architecture (application) after #37; #39 loader and migration after both; then
   #40 theme, #41 tree view and #44 content re-cut in parallel; #42 transitions and #43
   carousel after the tree view; #45 images after the content re-cut; #46 the walk-through
   after everything.

## Alternatives rejected

- **Rewrite `tree-format.md` and `application.md` in this issue.** The issue says "change
  the architecture where it conflicts", and this would be the literal reading. Rejected
  because the Implementer role does not own contracts, the specs demand a new format
  number and an `architecture` issue for any change, and the new contracts need decisions
  (serialisation of one large file; the neighbour payload; the guaranteed viewport) that
  should be made with the alternatives written down, not in passing. The documents are
  instead marked superseded-in-part so that nothing contradicts the core document
  silently, which is the Planner's rule.
- **Build an in-view editor instead of a single file.** The owner's own alternative.
  Rejected for now: explicit non-scope, far more work, and it would still leave the
  question of what file the editor writes.
- **Keep one file per Node and generate a single-file view for editing.** Would satisfy
  "loadable from a single file" only by a stretch; the owner's complaint is about editing
  and navigating, which a generated view does not fix without becoming the editor above.
- **A tag `v0.1` instead of a branch.** The owner asked for a branch by name, and a branch
  can receive a fix if 0.1 is ever deployed while 0.2 is being built.
- **A `v0.2/` folder or a new repository.** Loses the pipeline, the deployment path, the
  tests and the history for no gain; the URL scheme and language mechanism are kept, so
  most of the code survives.
- **File the issues `ready`.** The dispatcher demotes `ready` labels applied by the agents'
  account in `propose` mode; the owner promotes.

## Consequences

- Until #37 and #38 merge, `dev` carries specs that describe the code on `dev` (0.1) with
  a banner saying which parts are superseded; the code keeps passing its tests. Until #39
  and #44 merge, the first Tree stays in `elsa-tree/1`.
- The core document is the only document that already states the 0.2 requirements in
  full; the Architects derive from it.
- Open items for the owner: 10.23 (children / side children), 10.24 (who sources the
  images), 10.25 (the logo and fonts may be vendored).
- `docs/pipeline-smoke.md`, `docs/deployment.md`, the ADRs of #4, #5 and #19 are
  unchanged; the ADRs that #37 and #38 supersede are named in the spec banners and get
  their own "superseded by" line when those issues merge (`ADR-4-file-layout.md` is in
  the DONE WHEN of #37, `ADR-5-lazy-loading.md` in that of #38).
