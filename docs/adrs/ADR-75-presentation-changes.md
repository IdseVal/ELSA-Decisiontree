# ADR-75-presentation-changes: the owner's nine display changes are recorded in the core document now and reach the specs through one architecture issue, with the two changes that need no contract filed as build issues at once

- Status: ACCEPTED -- 2026-09-17
- Issue: #75 -- Minor changes to the app (the owner's instruction)
- Core document: `docs/CORE_DOCUMENT.md`, revised 2026-09-17 (sections 3.1, 3.2, 3.3, 5, 9, 10)
- Specs affected: `docs/specs/application.md` (sections 10 to 14), `docs/specs/tree-format.md` (`elsa-tree/2`), both marked "superseded in part" pending #78

## Context

Version 0.2 of the application -- the tree view (#41), the slide (#42), the Carousel
(#43), the Theme (#40), the re-cut first Tree with its images (#44, #45) -- was merged on
`dev` between 2026-09-10 and 2026-09-16 and shown to the owner. The owner found it
"initially great" and wrote, in issue #75, nine changes to the display and layout. In
the owner's order:

1. A heading "Legal sources" / "Juridische bronnen" above the Sources in the Bubble.
2. **Explainers**: certain words in a Node's text ("provider" on the first jurisdiction
   step is the example) are hoverable and lift a small panel with a short explanation;
   the Tree data must say which words have one.
3. **Side children open in an Overlay**: the Option buttons stay beside the Bubble, but
   clicking one opens the target in an overlay with a close cross, closed also by a click
   outside it, holding the larger explanation the side child would have shown.
4. **A main image on every Node**, displayed above the Bubble's title; a side child's
   main image shown small on its button, and above the title in the Overlay; every Node
   of the data prepared so far gets one, so the owner can inspect the result.
5. **The Carousel** holds the Images beyond the main one, has no buttons, shows no text
   under the pictures (the description becomes accessibility data only), and sits at
   the lower edge of the open Bubble.
6. **The Answer buttons** are bigger, more readable, both the same layout, both in the
   green of the lettering of the ELSA logo -- no steering by colour.
7. **The Trail is no longer drawn**; in its place one up-arrow button in the style of
   the Answer buttons, which goes to the previously opened Node.
8. **The side children's text** is bigger and the buttons fan out like a mind map.
9. **The copy-link button** must simply copy the link; what it does now "is not good".

The issue's DONE WHEN is not the changes themselves: it is that "all the above issues
are translated to architecture and are placed as issues on the issue board ready to be
picked up by the dispatcher", authorised for dispatch without the `proposed` step.

Seven of the nine touch contracts frozen by #37 and #38: the six-row budget of the tree
view and the length limits derived from it (4, 5, 7, 8, and 1, which adds a line inside
the text area), what an Option Branch does (3), what the Tree file may contain (2, and 4
for where a side child's picture is written), which Theme colour a button paints (6),
and what holds without JavaScript. Two do not: the images for every Node (4, the content
half) fit the format as it is, and the copy-link button (9) is a defect in one client
component.

Two of the owner's instructions also collide with something the owner said before:

- Change 5 says nothing is displayed under the Carousel's pictures. Core document
  section 8 requires a credit on every Image, `tree-format.md` 5.2 requires it to be
  shown with the picture, and the owner made visible credits a release blocker on PR #54.
- Changes 3 and 7 change what is drawn, while #35 kept "the way navigation works in line
  with the URL and the copy-link (share) option" out of scope. An Overlay that shows a
  Node without changing the address, and a Trail that is carried but not drawn, must
  both keep every Node reachable by URL.

## Decision

1. **The core document is revised now, in this PR**, because the owner's written
   instruction in #75 is the same kind of source as the interview and as #35. Every
   changed passage is marked `[#75]` and quotes #75. Three new open items record what
   the instruction leaves open: 10.26 (where the credit is shown when no text is under
   the pictures -- PROPOSED: in the enlarged view a click opens, and in the accessible
   text), 10.27 (the address of an open Overlay), 10.28 (the row budget and the length
   limits after the main image). Item 10.23 records that the owner's own words in #75
   ("side-steps", "side nodes" for Option targets; "the buttons to navigate further
   down ... (yes and no buttons)" for Answers) are consistent with the PROPOSED reading.
2. **The frozen specs are not rewritten by this issue.** Both carry a "superseded in
   part" banner naming the exact sections that no longer describe the requirement and
   the architecture issue that re-freezes them, exactly as ADR-35 did. The Implementer
   role does not own contracts, and the decisions involved -- the new row budget against
   the length limits, the Overlay against the URL scheme, the credit's place, the
   explainer's shape in the file -- need alternatives written down, which is the
   Architect's job with the Architect's skills.
3. **One architecture issue, not several.** The seven contract changes interact through
   one number: the height of the Bubble's text area at 1280 x 640, from which
   `tree-format.md` 5.7 derives every length limit. The Trail row is freed (7), the main
   image takes height (4), the Carousel's caption line goes and the strip moves (5), the
   Sources gain a heading (1), and the Answer row grows (6). Splitting them would freeze
   the same budget several times. The one issue is `complex` for that reason.
4. **The explainer's shape is a format change, `elsa-tree/3`,** frozen by the same
   architecture issue rather than a second one as #37 was: it is one optional key on a
   Node and its marking in the text, and the format's other open question (whether an
   Option keeps `images` once its button shows its target's main image) depends on the
   same view decisions.
5. **Two build issues open at once**, without waiting for the architecture: the images
   for every Node of both Trees (#84; the format has room, the owner wants to
   inspect it, and the 28 Option pictures already point at their targets), and the
   copy-link defect (#86, a `bug`, reproduced before it is fixed).
6. **The rest is one build issue per owner change or pair of changes, behind the
   architecture**: the explainer format in the loader, validator and migration
   (#79); the Overlay and the mind-map fan-out (#80, `complex`: it replaces the
   `side` direction of the neighbourhood, touches the slide, the Sheet, the URL rule of
   10.27 and the no-scroll test at once); the Bubble's interior -- main image, Sources
   heading, the Carousel at the lower edge (#81); the Answer buttons and the up
   arrow (#82); the hover panel (#83); the first Tree's explainers (#85);
   and a walk through the running app with screenshots for the owner (#87), as #46
   was for version 0.2.
7. **The issues are filed `ready`, not `proposed`.** The project's autonomy mode is
   `propose`, but the owner wrote in #75 that the issues "are hereby authorised to be
   dispatched" and need not carry `proposed`; the agents' account is a trusted promoter
   (`.orca/dispatch.yml`) since 2026-09-15. Ordering is by `Depends on:` lines.
8. **The credit is not dropped.** Core document section 8 stands; 10.26 proposes where
   the credit goes and the owner may correct it on the architecture issue. A build that
   removed the credit from the page would contradict a hard requirement on the strength
   of a sentence about "the maps text".

## Alternatives rejected

- **Nine build issues straight from the owner's list, no architecture.** Fast on paper.
  Rejected because five of them would each re-decide the same row budget and the same
  length limits, in parallel worktrees, against a no-scroll test that pins the current
  numbers; the Reviewer would have to arbitrate between PRs instead of checking them
  against a contract.
- **Rewrite `application.md` and `tree-format.md` in this issue.** The literal reading
  of "translated to architecture". Rejected for the reasons ADR-35 gave: the Implementer
  does not own contracts, the specs say a change needs an `architecture` issue and a new
  format number, and the Architect's skills and ADR discipline are what make the
  decisions checkable.
- **Two architecture issues, format and application, as #37 and #38 were.** Rejected:
  the format change is one key, and its one open question (Option `images`) hangs on a
  view decision. Two issues would serialise a day for no independent decision.
- **Ask the owner before filing anything** (the issue's heading reads "TASKs (after the
  owner answers)"). Rejected: the nine tasks are stated with examples and reasons, the
  three things they leave open are recorded as open items with a proposed answer each,
  and the owner asked for the issues, not for questions. The one collision that is a
  real decision (the credit, 10.26) is put to the owner on the architecture issue with a
  default.
- **File the issues `proposed`.** Rejected: the owner's explicit authorisation in #75.
- **Bump the format because of the main image.** Rejected: `tree-format.md` 5.2 already
  says the list is the order and the first entry is the picture a Node leads with; a
  `main` key would be a second way to say it.

## Consequences

- Until #78 merges, `dev` carries specs that describe the code on `dev` with a
  banner saying which parts are superseded; the code keeps passing its tests.
- #84 and #86 can be dispatched as soon as this PR merges; everything else
  waits for #78, then runs in parallel (the dispatcher's limit is three at a time).
- Open items for the owner: 10.26 (the credit's place), and 10.28 if the Architect finds
  the description's 600 characters cannot survive the main image.
- The ADRs that #78 supersedes (`ADR-38-tree-view.md`, `ADR-38-carousel.md`,
  `ADR-38-neighbourhood.md`, `ADR-38-transitions.md`, `ADR-37-length-limits.md`,
  `ADR-37-images-carousel.md` as far as it concerns Option pictures) are untouched here
  so that the 0.2 record stays exact; their "superseded by" lines are in #78's
  DONE WHEN.
