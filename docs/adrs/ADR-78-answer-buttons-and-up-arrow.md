# ADR-78-answer-buttons-and-up-arrow: both Answer buttons are 620 x 60, filled with the Theme's `accent-secondary` under a 19-pixel bold label that counts as large text; the Trail is no longer drawn and one round up arrow on the Bubble's top outline goes one step back

- Status: ACCEPTED (frozen) -- 2026-09-17
- Issue: #78 -- Architecture: freeze the contracts for the display changes of #75
- Spec: `docs/specs/application.md` 3.2 (chrome keys), 10.1 to 10.3, 10.5, 11.1, 11.2, 13.1, 14; `docs/specs/tree-format.md` 4.3.3 (the role's meaning)
- Core document: 3.2 ("Both Answer buttons the same ...", "The Trail is no longer drawn ..."), 9 (no lab colour in code), 10.17 (a Trail click discards the later Trail)
- Supersedes in part: `ADR-38-tree-view.md` (decisions 1, 5, 7 and 8: the Trail row, the Trail's collapse and Sheet, the chrome word above the title), `ADR-38-neighbourhood.md` (decision 1: two `up`), `ADR-38-transitions.md` (nothing: the slide up stays)
- Built by: #82

## Context

The owner (#75), of the Answer buttons: "The buttons to navigate further down the
decision-tree should be bigger, the text better readible, we want to keep it simple and
we don't want to steer the user with the button colors, so both should have the same
layout, both the same green as the text from the ELSA logo." And of the Trail: "The
pathing we show above the node, that shows what questions have been answered do not look
that nice, we would rather want to not display that there, but we want to just show an
upwards arrow in the same style and roundness as the further buttons (yes and no
buttons), and when clicked it should navigate to the node that was previously opened in
the traversal."

In 0.2 the `yes` Branch is filled with `accent` (the first Tree's yellow) and `no` is
outlined; both are 480 x 48 with a 13-pixel title under a small chrome word. The Trail is
a 64-pixel row of up to five title Branches that collapses in the middle to `trailMore(n)`
and a Trail Sheet. The green of the logo's lettering was measured by #36 as `#159a2f`
(`docs/research/issue-36-ai4sfs-visual-identity.md` 4.2, "Logo mark, green"); it is not
the interface green `#41ab64` that the first Tree carries as `accent-secondary`. The
frontend may carry no lab colour (core document 9; `stylesheet.test.ts`), so the green
has to reach the buttons through the Tree's Theme. White on `#159a2f` is 3.69 : 1 and the
Theme's `text` on it 3.67 : 1 (computed 2026-09-17 with the WCAG relative-luminance
formula), both under the 4.5 : 1 that #64 set for normal text and over the 3 : 1 that
WCAG 2.2 SC 1.4.3 asks of large text (at least 18.66 pixels bold, or 24 regular).

The Trail stays in the URL and the share link (the owner, #35 and #75). Only what is
drawn changes.

## Decision

1. **Both Answer buttons are the same: 620 x 60, filled, one label.** Two buttons and a
   20-pixel gap are 1260 of the 1280 pixels. The label is the chrome word, a colon and
   the target's title on one run -- "Yes: Annex III areas" -- in the heading face at
   **19 pixels bold on 24-pixel lines, at most two lines** (580 pixels of label hold at
   least 43 characters a line in DejaVu Sans Bold, the widest fallback, and a label is at
   most 86), inside 6 pixels of padding above and below: 48 + 12 = 60. No small word
   above the title any more: at 13 pixels it could not meet 4.5 : 1 on the green, and one
   run reads better.
2. **The fill is the Theme role `accent-secondary`, and the label is
   `--elsa-on-accent-secondary`** (13.1: whichever of `text` and `background` contrasts
   more, which on the first Tree is white). The role's meaning in `tree-format.md` 4.3.3
   becomes "the walk's controls: the Answer buttons, the up arrow, `startAgain`, and
   links"; the Option buttons, which it painted, take an outline in the `rule` shade and
   a wash of `accent` on hover. **The first Tree sets `accent-secondary` to `#159a2f`**
   (#82), a Theme value and never a literal in the stylesheet.
3. **The label counts as large text, and the measured ratio is 3.69 : 1** (white on
   `#159a2f`), above the 3 : 1 large text needs and recorded here as the number the
   build (#82) re-measures on the running page. A Theme whose `accent-secondary` gives
   its label less than 3 : 1 has chosen an unreadable palette, as 4.3.3 already says of
   `text` on `background`.
4. **The Trail is not drawn. One up arrow replaces it:** a 48-pixel round button
   centred on the Bubble's top outline, filled and coloured like the Answer buttons,
   showing an upward arrow glyph, whose accessible name is the chrome key `up(title)`
   -- "Back to: <the parent's title>" / "Terug naar: <titel>" -- taken from the title
   index. It links to the Trail entry directly above the centre, at the address 10.2's
   parent Branch had (`trailHref`), so the Trail after it is discarded (core document
   10.17) and the URL stays the path. It slides **up**, as the parent Branch did: the
   parent is still placed `up` (11.2), the only `up` placement now, because the
   grandparent is no longer reachable in one click.
5. **Where there is nothing above, nothing is drawn:** the root Node, and a Node opened
   by its own URL with an empty Trail, show an empty band; the band keeps its 26 pixels
   so nothing moves. A Terminal's `back` Branch is the up arrow; its `startAgain` stays
   as the one button in its Answer row, in the Answer buttons' size and colour, and a
   Terminal that is the root shows `startAgain` alone with no arrow, as before. The
   explanation Node's `back` goes with the Overlay (`ADR-78-overlay.md`).
6. **What goes with the Trail row:** the Trail Branches, the collapsed middle, the Trail
   Sheet, step 1 of 10.5, the chrome keys `trail`, `start`, `trailMore` and `back`, and
   `tests/trail.test.tsx` and `trail.spec.ts` as they stand (rewritten for the arrow).
   The URL scheme, the Trail in the path, `trailHref` and the share link are untouched.

## Alternatives rejected

- **An eighth Theme role for the buttons' green.** Would leave `accent-secondary` as it
  was. Rejected: `tree-format.md` 4.3.3 is a closed set of seven that every third-party
  Theme fills whole, so an eighth role breaks every Theme on the migration, or needs a
  default that guesses a lab's colour. A role the frontend already has, re-described, is
  a change to one line of the first Tree.
- **Painting the Answer buttons with `accent` and setting the first Tree's `accent` to
  the logo green.** Rejected: `accent` outlines the Bubble and colours the badges and
  washes, so the whole identity would turn from the site's yellow to green, which the
  owner did not ask for.
- **The green as a literal in the stylesheet.** Forbidden by core document 9 and by
  `stylesheet.test.ts`.
- **A 16-pixel label at 4.5 : 1 by darkening the green.** Rejected: the owner named the
  logo's green, and a darker one is not it. Large text is the rule WCAG provides for
  exactly this, and a 19-pixel bold label is also what "bigger, the text better
  readible" asks for.
- **Keeping the small `YES` / `NO` word above the title.** Rejected: at 13 pixels it
  fails 4.5 : 1 on the green and cannot be made large without a third line the row does
  not have; folded into the label it is read in one breath.
- **An up arrow that goes to the root, or opens the whole Trail as a list.** Rejected:
  the owner asked for "the node that was previously opened", one step; the Trail list is
  the thing the owner asked not to see. A reader who wants to go further back presses
  the arrow again, or uses the browser's back.
- **A wider arrow band with the arrow wholly above the Bubble.** Rejected: 22 more pixels
  of height that the budget of `ADR-78-main-image-and-row-budget.md` does not have; on
  the outline the arrow reads as part of the Bubble, "in the same style and roundness".

## Consequences

- `theme.ts` is unchanged: `--elsa-on-accent-secondary` is already derived; the first
  Tree's manifest changes one value, and `theme.spec.ts`'s "changing a colour changes
  the page" is the test of it.
- `tests/first-tree/contrast.spec.ts` (#64) gains the Answer label on its fill at 3 : 1
  as large text; the PR of #82 pastes the measured ratio from the running page.
- The neighbourhood is `up` 1 + `down` 6 = 7 placements at most (`ADR-78-overlay.md`
  for the asides); `neighbourhood.test.ts` asserts it and that the grandparent is not
  placed.
- Section 14's "going back up the Trail" row becomes the arrow: a plain link that
  discards the later Trail, as 4.1 always said.
