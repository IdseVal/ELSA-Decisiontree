# ADR-133-build-order: the lines of ADR-132 stand; #138 gains #135; #138 lands every slot of the reuse seam so that #139 to #142 edit no server component; the files two branches share are named

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: none; this ADR confirms the `Depends on:` lines of #137 to #144 and corrects one
- Amends: `docs/adrs/ADR-132-build-order.md` (its table: the row of #138)

## Context

`ADR-132-build-order.md` ordered #134 to #144 by the criterion of `ADR-118-build-order.md`
-- a dependency is "cannot be written, or cannot be true, until the other has merged", not
"mentions the same subject" -- and named the files two branches share. The thirteen
`ADR-133-*` decisions assign screens to issues; this ADR checks the lines against those
assignments, as #132 was asked to and as this issue's item 13 asks.

The assignments that matter for order:

| Deliverable | ADR | Issue |
|---|---|---|
| The public overview's tiles, grid and scroll box; the second exemption of 10.6; the Theme emitted per page; `siteTitle` | overview-tiles 1, 2, 5, 6; admin-routes 6 | **#134** |
| The login page rendered in place, the 403 page, `LoginForm`, the account and accounts pages, the admin chrome bar, `admin.ts`, `admin-no-scroll.spec.ts`, the sweep's admin half | admin-routes 4, 5, 7; login-and-account-pages 1 to 6; editor-testing 1, 2, 5 | **#135** |
| The creators' overview, the + tile, the two groups, the new-Tree form | overview-tiles 3, 4; new-tree-form 1 to 5 | **#137** |
| The `edit` seam with every slot call site, `links`, `NodeContent`, `Readable`, `measure.ts`, the editor page, `Editor`, `Field`, `writes.ts`, autosave, the session Sheet | reuse-rule 1 to 8; bubble-edited-in-place 1 to 7; autosave 1 to 9 | **#138** |
| The three buttons, creation and navigation, the side `+`, the Overlay edited, the link menu and picker, the step menu, orphans | structure-editing 1 to 9 | **#139** |
| The pickers, the attach Sheet, the enlarged view's edit mode, the admin image route in use | images-in-the-editor 1 to 8 | **#140** |
| Marking, the explainer Sheet, unmarking, the click on a term | explainers-in-the-editor 1 to 6 | **#141** |
| The panel: Publish and the to-do list, collaborators, this Tree, the administrator's actions | top-panel 1 to 8 | **#142** |

## Decision

```
                    #133  this freeze
                      |
                    #134  overview tiles, Theme per page, the store's read side (ADR-132)
                      |
                    #135  login in place, 403 page, account pages, admin.ts, the sweep
                      |
                    #136  the write path (ADR-132)
                      |
          +-----------+-----------+
          |                       |
        #137  creators'         #138  the edit seam, every slot, Field, autosave
              overview, + tile    |
                                  +--------+--------+--------+--------+
                                  |        |        |        |        |
                                #139     #140     #141     #142     #144
                      |
                    #143  the walk
```

| Issue | `Depends on:` before | `Depends on:` now | Why exactly |
|---|---|---|---|
| #134 | #132, #133 | unchanged | Builds the overview to `ADR-133-overview-tiles.md` and moves the Theme emission (`ADR-133-admin-routes.md` 6); everything else is #132's. |
| #135 | #132, #133, #134 | unchanged | The login page is rendered in place of any admin address (`ADR-133-admin-routes.md` 4), which needs the page files under `/admin` and the store's read side (#134). |
| #136 | #132, #134, #135 | unchanged | Nothing this freeze assigns to it. |
| #137 | #133, #134, #135, #136 | unchanged | The creators' overview is #134's page behind #135's login with #136's create route; the two groups read `store.drafts.list` (#136). |
| #138 | #133, #136 | **#133, #135, #136** | **Corrected.** The editor page's route calls `authenticated` and renders the login form in place without a session (`ADR-133-admin-routes.md` 4), and the session Sheet of `ADR-133-autosave.md` 6 renders `LoginForm` -- both #135's, consumed directly, not through #136. By `ADR-132-build-order.md`'s own rule for #136's line ("a dependency that holds only through the dispatch order is not one anyone can rely on"), the line names #135. |
| #139, #140, #141 | #138 | unchanged | Each fills slots #138 landed (`ADR-133-reuse-rule.md` 2) and edits no server component. |
| #142 | #136, #138 | unchanged | The panel calls #136's publish, collaborator and hand-over routes inside #138's page. |
| #143 | #134, #137, #139, #140, #141, #142 | unchanged | The walk. Gains #144 if the owner promotes it. |
| #144 | #138 | unchanged | The Theme panel would sit in the top panel's "This Tree" section (`ADR-133-top-panel.md` 5), which is #142's; if promoted, its line gains **#142**, and this ADR says so now so the promotion does not have to. |

**The critical path is unchanged**: #134, #135, #136, #138, the longest of #139 to #142,
#143. #137 runs beside #138; #139 to #142 run beside each other, and this freeze makes
that parallelism real rather than nominal: **#138 lands every call site of the `edit`
seam** (the slot table of `ADR-133-reuse-rule.md` decision 2), so the four issues after it
add files under `src/editor/`, register their slot functions in the editor page, and never
touch `TreeView.tsx`, `Bubble.tsx`, `Carousel.tsx` or `EnlargedView.tsx` again. The step's
controls were moved from the panel to the rim for the same reason (`ADR-133-top-panel.md`
decision 6): #139 and #142 share no component file.

**The files two branches share**, named so nobody is surprised:

- `src/chrome.ts`: every issue appends keys; the keys are listed per issue in
  `application.md` 3.2 and each issue appends its own block at the end of both language
  records, so a conflict is two appended blocks and resolves by keeping both.
- `src/app/[lang]/admin/trees/[tree]/[...path]/page.tsx` (the editor page): #138 creates
  it; #139 to #142 each add their slot functions and their client component to the
  `EditMode` it builds -- one line per slot in one object literal. A conflict is two added
  lines and resolves by keeping both.
- `tests/browser/admin-no-scroll.spec.ts`: #135 creates it; #137 to #142 each append rows
  to its page list, the same way.
- `docs/specs/application.md`: every section of this freeze is written in full by this
  PR, so no build issue creates a section another creates; a build issue amends only the
  test rows of 35 and the "measured" numbers a section invites it to paste.
- `docs/deployment.md`: unchanged by this freeze; #134 to #136 rewrite it as #132 said.

## Alternatives rejected

- **Leaving #138's line as filed**, on the ground that #136 depends on #135 and so the
  order holds anyway. That is the case `ADR-118-build-order.md` and `ADR-132-build-order.md`
  both named as the reason to write the line: it is true by dispatch order, not by
  contract.
- **Splitting the seam out of #138** into an issue of its own ("the `edit` prop and every
  slot, rendering nothing"), so that #139 to #142 could start beside #138. An issue whose
  deliverable is a prop nobody passes and slots nothing fills, reviewed against no
  screen; #138 is its first consumer and ships it anyway. The same objection the two
  earlier build-order ADRs raised to the same shape.
- **Making #142 depend on #139** so that the panel could hold the step's controls. The
  panel would wait for the structure editing for one section; moving the section to the
  rim costs nothing and keeps the two parallel.
- **A `Depends on: #142` on #144 now.** #144 is `proposed` and may never be promoted; the
  line is written here so that whoever promotes it copies it.

## Consequences

- The `Depends on:` line of #138 is corrected on the issue in this run; the table above
  is those lines. `ADR-132-build-order.md`'s row for #138 is superseded by this ADR's;
  the rest of it stands.
- The `proposed` issue `ADR-133-new-tree-form.md` files (adding or removing a language of
  an existing Tree) carries `Depends on: #136, #138` and is on nobody's path.
