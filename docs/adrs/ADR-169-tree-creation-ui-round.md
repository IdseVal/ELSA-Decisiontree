# ADR-169-tree-creation-ui-round: the owner's fifteen points on the tree creation interface are one architecture freeze, nine build issues and a closing walk, filed `ready`

- Status: ACCEPTED -- 2026-10-02
- Issue: #169 -- Issues for the tree creation UI (the owner's instruction)
- Issues filed: #171 to #181
- Specs affected: none rewritten here; each filed issue amends, dated and additive, the sections it changes
- Core document: 3.4 amended here, marked `[#169]`, for the four decisions of #133 that #172, #176, #177, #178 and #180 reverse (decision 6); #171 amends 3.1, the 3.4 sentence "asks for one of the four outcomes", 5 and 10.10, and #173 amends 3.2

## Context

The editor round (#131 to #147) is merged on `dev`. The owner walked the tree creation
interface -- the editor under `/admin/trees/...` -- and wrote fifteen points in issue #169,
with the instruction: "dispatcher must create issues based on what I describe here, issues
can be set to ready immediately". The issue's task is the issues, not the changes: "Make
coherent github issues for all of the above and set them to ready."

Several points reverse a decision that an earlier round froze at the owner's own request or
by the Architect: the heading "Legal sources" (#75, `ADR-78-sources-heading.md`); the four
fixed outcomes of a Terminal (`tree-format.md` 5.5, `ADR-4-terminal-marker.md`); "typing
never stops at a limit" (`application.md` 28.4); the `...` step menu and link menus and the
Sheet behind the side-bubble `+` (`ADR-133-structure-editing.md`); the state button in the
chrome bar and the to-do list in the panel (`ADR-133-top-panel.md`); the editor painted in
the draft's Theme (`application.md` 24.3, `ADR-133-admin-routes.md` decision 6). The
owner's words in #169 are the authority for each reversal. Each issue quotes them and
names, in its TASK, the spec sections it amends and the ADR decisions it supersedes:
#172 `ADR-133-bubble-edited-in-place.md` decision 5 and its rejected alternative
(`maxlength`); #176 `ADR-133-top-panel.md`; #177 and #178 `ADR-133-structure-editing.md`;
#180 `ADR-133-admin-routes.md` decision 6; #171 the closed set of outcomes of
`ADR-4-terminal-marker.md`; #173 `ADR-78-sources-heading.md` decision 1. The core
document is the one place a build issue does not amend: section 3.4 is amended in this
pull request (decision 6), and the items the architecture issue and the heading issue
change are amended by #171 and #173.

## Decision

1. **The points are grouped by the part of the screen they change**, so that one run reads
   one set of spec sections and two runs seldom edit the same component:

   | Owner's point (in the order of #169) | Issue |
   |---|---|
   | 1. An "i" in a circle behind an image's credit and description | #174 |
   | 2. Placeholders that say what belongs in the field; boxes sized to their content that stop at the cap | #172 |
   | 3. "Sources" instead of "Legal sources" | #173 |
   | 4. The side bubble just opens, with title, text and image, the same input rules | #177 |
   | 5. Sources cannot be entered in the side bubble | #177 |
   | 6. No "new side bubble" in the side bubble pane; a "Delete side-bubble" button below in the middle | #177 |
   | 7. "Add an extra image" on hovering the add-a-picture button | #174 |
   | 8. The listed images 1.4 times as big, also in the main app | #174 |
   | 9. A bigger side bubble on the main view, eight as the cap, the image circle following the contour | #175 |
   | 10. "Tree ends here" asks for a text, with a cap; not only legal trees | #171 (contract), #179 (build) |
   | 11. A red cross and "tree does not end here after all" instead of the `...`; no `...` on the next steps | #178 |
   | 12. Every input box and font elegant, nothing exceeding its parent | #172 (every input, once), #181 (the walk at the end) |
   | 13. The top-right buttons named for what they open: "Decision-tree settings", "Account" | #176 |
   | 14. The to-do list a bubble at the top right, the settings button floating, neither in the header bar | #176 |
   | 15. Theme: colours leave the sidebar and header alone; text colour on the Sources; font and licence dropdowns; "i" hints | #171 (contract), #180 (build) |

2. **One architecture issue, #171, for the two points that touch a contract.** A typed
   ending text changes `elsa-tree/4` (5.5 calls the set of outcomes closed and a change a
   new format number), and a dropdown of font families needs a list of families, a source
   for their files that makes no third-party request (`application.md` 13.5) and a list of
   licences. Neither can be chosen by a build run without guessing; #179 and #180 wait for
   #171. Everything else is a build issue that amends the spec text it changes, the way
   #102 did for the owner's display changes.

3. **Order, by `Depends on:` lines only.** #171 to #176 are free. #177 (the side bubble in
   the editor) waits for #172, whose field rules it applies. #178 (the step's buttons)
   waits for #177, because removing the `...` on a side-bubble button needs the "Delete
   side bubble" button to exist, and for #176, because its two buttons and #176's two
   floating controls share the band right of the up arrow and #178 must prove they do not
   overlap. #179 waits for #171, #172 and #178; #180 for #171, #174
   (the hint component) and #176 (the panel it sits in). #181, the walk, waits for all nine.

4. **All eleven are labelled `ready`**, not `proposed`, although the project's autonomy mode
   is `propose`: the owner wrote in #169 that the issues "can be set to ready immediately",
   and the account that filed them is a trusted promoter in `.orca/dispatch.yml`. None is
   labelled `complex`.

5. **Where the owner's words leave a consequence unsaid, the issue says it and does not
   widen the request.** These are the readings a later reader should know were taken here,
   each stated in its issue so the owner can overrule it there:
   - #171: "let the user enter a text to display on the button" -- "the button" is read
     as the outcome badge on the Bubble's rim, where the four fixed words are shown today.
     That reading sizes the format change: the length limit of the typed text is "chosen
     so that the text fits the badge on the rim".
   - #173: only the heading changes. The kind label `Legal`, dropped in #78 "because the
     heading says it", is not brought back; the disclaimer and the site's description keep
     their legal words. The run lists them for the owner.
   - #174: "the images that are listed there" are the round thumbnails of the strip on the
     Bubble's lower edge (48 pixels, so 67), on the public page and in the editor.
   - #177: with one click creating the side bubble, "Link an existing one" is no longer
     offered; the button's title follows the aside's title until edited; "Delete side
     bubble" deletes the aside's Node too, unless another step leads to it.
   - #178: with the `...` gone from the yes, no and side-bubble buttons, re-pointing a
     button at an existing step ("Lead somewhere else") is no longer offered by the editor.
     A Source's own `...` stays: it is not one of the dots the owner named.
   - #176: the Publish switch stays in the settings panel; the Tree's state (hidden,
     published) stays visible at a glance, as a state and not as a button's name.
   - #180: the Theme still paints the whole public page; in the editor it paints the Tree
     and not the editor's own bars, panel and Sheets.
   - #175: "the image circle ... fills the outer edge of the side bubble (so it follows
     the contours of the side-bubble ...)" -- "the outer edge" is read as the button's
     outline. The picture stays at the button's inner end, where it is today
     (`ADR-78-fan-out-and-option-picture.md` decision 4), and grows to the button's full
     height so that it lies against the outline of that end; it does not move to the
     outer end.
   - #181 was not asked for as an issue. It is how point 12 -- a standard for the whole
     interface -- gets checked once the parts are together.

6. **Core document 3.4 is amended here, once, for the four decisions the build issues
   reverse.** Section 3.4 records, as decided by the Architect on #133: limits "never
   stopping a keystroke" (reversed by #172); "an Answer or an Option may also be pointed
   at an existing Node" (no longer offered, #177 and #178); "the editor carries the
   Tree's own Theme" (narrowed to the Tree, #180); and the panel that "opens from a
   button at the top right of the editor's bar showing the Tree's state" (#176). Each
   passage now carries a `[#169]` mark and a new bullet of 3.4 states the change with the
   owner's words, the way `ADR-75-presentation-changes.md` decision 1 and
   `ADR-131-version-1-0-and-the-editor-round.md` decision 3 revised the core document
   before the build. The two consequences the owner did not name -- no pointing at an
   existing Node, the Tree's state still visible -- are marked PROPOSED there.

## Alternatives rejected

- **One issue per point (fifteen).** Points 4, 5 and 6 edit the same component, as do 1, 7
  and 8, and 13 and 14; fifteen parallel runs on five components is fifteen merge conflicts.
- **One issue for everything.** A run has a wall-clock ceiling of 90 minutes
  (`.orca/dispatch.yml`); the editor round's builds each needed most of one for a fifth of
  this.
- **No architecture issue: let #179 and #180 decide the format and the font list.** A build
  run is told to stop and ask rather than guess (`.orca/roles/implementer.md`); both would
  have stopped, or worse, not.
- **Filing the issues `proposed`.** The owner said `ready`, in the issue.
- **Leaving the four amendments of core document 3.4 to the issues that reverse them**
  (a task line in #172, #176, #177 or #178, and #180). #172 was already dispatched when
  the gap was found, so its run might never read the added line; and five runs would each
  edit the same two paragraphs of 3.4, beside #171's edit of the same paragraph, which is
  five merge conflicts for four sentences. The first version of this ADR left the four
  passages to nobody; the Reviewer of #182 found it.

## Consequences

- The dispatcher can start #171 to #176 at once (three at a time, `max_active_issues`).
- The specs are not amended by this pull request; until #171 to #180 merge, the sections
  named above describe what is on `dev`, which is correct. Core document 3.4 states the
  owner's four changes from the moment this merges, ahead of the build, as the core
  document did in the rounds of #75 and #131.
- #171's amendment of "asks for one of the four outcomes" lands in the paragraph of 3.4
  that carries two of this pull request's marks; whichever merges second resolves the
  overlap keeping both.
- The editor loses two abilities it has today (linking an existing step as a side bubble,
  re-pointing a button), by the owner's request to remove the controls that carried them.
  The server routes for both stay (`application.md` 22.1).
