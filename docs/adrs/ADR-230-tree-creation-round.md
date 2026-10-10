# ADR-230-tree-creation-round: the owner's one `+`, five next steps, an evenly spread row and a slide toward each button are one architecture freeze and three build issues after it, filed `ready` on the owner's words

- Status: ACCEPTED -- 2026-10-10
- Issue: #230 -- Tree creation (the owner's instruction)
- Issues filed: #231 to #234
- Specs affected: none amended here; #231 amends the sections it decides, #232 to #234 what
  they build
- Measured: `docs/research/issue-230-slide-direction.md`, where each next step's button stands
  against where its slide goes, on the production build of `dev`
- Core document: amended here, marked `[#230]`: the preamble, its status line and the owner
  line; 3.1's Answers; 3.2's bullet on the slide; in 3.4 the `[#133]` sentence on the editor's
  Answer row, the `[#219]` bullet's `[#220]` confirmation of "more than four is not" and of
  where `Tree ends here` stands, a new bullet holding the owner's words whole, and the passage
  on what the round does not change; the row **Answer** in 5; the `[#220]` notes of 10.22 and
  10.41 and the decision of 10.43; a new open item 10.44, OPEN for #231

## Context

The owner wrote in issue #230, on 2026-10-10:

> "In the tree creation view, currently there are three buttons (yes, tree ends here, no, +).
> I want there to just be one + button that the user can click, which opens the overlay in
> which the user can toggle (tree ends here) or put the title of the button. Then the user can
> decide how many he wants, there can be up to 5. Also, make sure that these amount of buttons
> to navigate down the tree (up to 5 buttons) are displayed in a evenly spread out manner and
> that when click, the view slides in the direction of the button, so it feels as if you are
> moving in its direction (and when the user presses back, it goes in the same path backwards,
> but we already solved that I think)."

and under "Task": "Put tasks for this on the issue board and set it/them to ready." The task is
the issues, not the change, as it was in #202 and #219.

What stands on `dev` (`b9e7c03`), where the instruction lands:

- **The editor's Answer row** (`docs/specs/application.md` 41.7, built by #222). A step without
  Links offers four outlined buttons: `+ Yes`, `Tree ends here` (`treeEndsHere`), `+ No` and
  `+` (`addNextStep`) -- the owner's "three buttons (yes, tree ends here, no, +)". `+ Yes` and
  `+ No` create a next step labelled with the chrome word in one click; `+` opens a Sheet with
  one field, `nextStepWords` ("Words on the button", at most 19 characters), and `confirm`
  creates a next step with those words; `Tree ends here` opens a Sheet of its own with one field
  for the ending's words (36.3) and makes the step a Terminal. A step with next steps shows each
  label as a field in place and, while it has fewer than four, a `+` after the last; while it
  has one, the one-click `+ Yes` and `+ No` stand before that `+` (41.7 item 2).
- **How many** (41.1, core document 10.43, decided on #220): two, three or four next steps a
  step, one a draft's to-do; "a fifth is refused. Five and six were measured and refused: from
  1000 pixels wide down, one row of five breaks a 19-character label into three lines and more
  in Verdana and overflows at 360 x 481, and two a row needs a third row, which overflows the
  full Node in windows 481 tall" (`ADR-220-number-of-next-steps.md`). The Tree format is
  `elsa-tree/6`, whose `answers` holds "two to four" (`docs/specs/tree-format.md` 5.3), and
  "any change to the keys, the kinds, the outcome set, the Theme roles, the limits or the
  validity rules" is a new format number: "The next change will be `elsa-tree/7`"
  (`tree-format.md` 10).
- **The row** (41.3): every button the same width, an equal share of the row, at most 620
  pixels; from 1000 pixels wide up two, three or four stand in one row, 20 apart; below 1000
  three stand two and then one centred, four two and two. A step of three or four shows the
  minimum-size notice below 600 pixels wide and 560 tall on the public page (41.4, measured by
  #221), 590 tall in the editor (41.7 item 8, measured by #222).
- **The slide** (11.1, 11.3, 41.5). On the public page and in the preview of a hidden Tree
  (40.2), following a next step's button slides the tree layer to the target's place: the
  *n* next steps of a step stand at `x` = *i* - (*n* - 1) / 2 layer widths across, one layer
  height down -- the places of one row, at every width. The up arrow's slide is the step down
  reversed (#102), and the browser's back reverses the slide when the payload is in the
  framework's cache (11.3): the owner's "we already solved that". **The editor does not slide**:
  it renders no neighbour frame and no `data-slide`, and every control is a plain link (34.5;
  30.2, "a plain navigation, no slide"); its page reads at most twelve Nodes (34.7).
- **Where the buttons stand against where they slide**, measured on the production build of
  `dev` (`docs/research/issue-230-slide-direction.md` section 2): from 1000 pixels wide up every
  button of three and of four stands on the side its slide goes to. Below 1000 the buttons stand
  two a row while the slide goes to the places of one row: of four, the second button stands
  right of the middle and the reader goes down and to the left, the third stands left on the
  second row and the reader goes down and to the right; of three, the second stands right and
  the reader goes straight down, the third stands in the middle of the second row and the reader
  goes down and to the right -- 4 of the 7 buttons at 999, 800 and 360 pixels wide.

## Decision

1. **One instruction, four issues.**

   | Issue | Labels | Depends on | What it does |
   |---|---|---|---|
   | #231 | `architecture`, `ready` | #230 | Decides 10.44: five next steps and what gives way for them under the no-scroll rule; the format; the row evenly spread at every width; the rule that sends each button's slide toward where it stands; the editor's one `+` and its Sheet; the slide in the editor; every other reader; confirms or replaces the PROPOSED readings of decision 5 |
   | #232 | `data`, `ui`, `ready` | #231 | Builds five next steps in the format and every reader of them, the public page's row and the slide from each button, as #231 decides |
   | #233 | `ui`, `ready` | #231, #232 | Builds the editor's one `+` and its Sheet, with `Tree ends here` in it, up to five next steps |
   | #234 | `ui`, `ready` | #231, #232, #233 | Builds the slide in the editor: a next step's button and the up arrow slide there as on the public page |

2. **Architecture first.** Each of the owner's points meets a frozen contract. Five next steps
   is the number #220 measured and refused under the no-scroll rule (41.1, core document 10.43),
   which section 9 makes a must-never ("The page must never scroll"), and the format's "two to
   four" with its rule that the next change is `elsa-tree/7` (`tree-format.md` 5.3, 10). The row
   stands two a row below 1000 pixels wide (41.3), and the slide goes to the places of one row
   (41.5), which the measurement above shows do not agree there. The editor's row is 41.7's,
   whose `+ Yes`, `+ No` and `Tree ends here` #220 confirmed (core document 3.4 `[#219]`). The
   editor's page renders no neighbour and slides nowhere by 34.5, within a bound of twelve Nodes
   (34.7), and section 9 bounds the Nodes fetched ahead. A build run that met them would have to
   supersede them on its own, and the implementer's role tells it to report a contradiction with
   a spec and to ask rather than build its best guess (`.orca/roles/implementer.md`). What the
   owner's words leave open is listed in #231's TASK and in core document 10.44, as 10.43 was for
   #220.

3. **Order, by `Depends on:` lines only.** #231 waits for #230, so that this record -- the
   `[#230]` passages and 10.44 -- is on `dev` before the Architect amends it, as #220 waited for
   #219 (`ADR-219-number-of-next-steps-round.md` decision 3). #232 waits for #231. #233 waits for
   #231 and #232: #232 changes how many next steps the format, the validator and the store's
   writes accept (`src/tree/validate.ts`, `src/store/edits.ts`) and the row both pages draw
   (`src/components/TreeView.tsx`, the stylesheet), and #233 offers the fifth in the editor's row
   on top of them. #234 waits for #231, #232 and #233: it renders the neighbour frames and the
   slide on the editor's page, through the rule #232 builds and around the row #233 builds; built
   side by side, one of them would merge into a `dev` on which the other's tests no longer hold,
   and #233 and #234 both amend 41.7. The four issues were created in that order, each with its
   final body and its `Depends on:` line from the start, and the lines were read back with the
   dispatcher's own expression (`_DEPENDS_RE` in `dispatch.py`).

4. **All four are labelled `ready`, on the owner's words, by the account that filed them.** The
   owner wrote "Put tasks for this on the issue board and set it/them to ready." The project's
   autonomy mode is `propose`, in which an issue an agent files is labelled `proposed`
   (`.orca/roles/planner.md`); this rests on the owner's explicit words, as
   `ADR-202-navigation-round.md` decision 4 did on #202's "set them to ready", and not on a
   reading of them (`ADR-219-number-of-next-steps-round.md` decision 4). The timeline of #230
   shows the owner's account, `IdseVal`, applying `ready` to #230 at 07:36:04Z on 2026-10-10;
   that label released this filing run. `DeKnecht`, which files the four and applies their
   label, is a trusted promoter in `.orca/dispatch.yml`, so the dispatcher keeps it, and the
   `Depends on:` lines hold #231 until this pull request merges and closes #230. None is
   labelled `complex`, as no architecture issue of the rounds of #169, #194, #202 and #219 was
   (#171, #195, #205, #220); the owner may add it to #231.

5. **Where the owner's words leave a choice, the record says which reading was taken and does
   not widen the request.** Each is in core document 3.4's `[#230]` bullet, marked PROPOSED, and
   in #231, so that the Architect can confirm or replace it and the owner overrule it:
   - "The tree creation view" is the editor (`/admin/trees/...`, 3.4), and its "three buttons
     (yes, tree ends here, no, +)" are 41.7's four on a step without Links.
   - "Just one + button": `+ Yes`, `Tree ends here` and `+ No` leave the editor's row, both on
     a step without Links and, for `+ Yes` and `+ No`, beside a step's one next step (41.7 item
     2); the row offers one `+` wherever a step can take another next step.
   - "The overlay" is the Sheet the `+` opens today (41.7 item 1), the editor's dialog, and not
     the **Overlay** of section 5, which shows a side child.
   - "Toggle (tree ends here) or put the title of the button": the Sheet holds a switch, `Tree
     ends here`, and one field. Off, the field is the words on the new button -- "the title of
     the button" is the button's label (41.2), at most 19 characters, not the next step's title,
     which is edited on that step's own page -- and `confirm` creates the next step. On,
     `confirm` makes the step a Terminal, and the field asks for the ending's words, as the
     `Tree ends here` Sheet does today (36.3), since a Terminal carries its creator's words
     (owner, #169). The switch stands only where `Tree ends here` stands today: on a step
     without Links.
   - "Up to 5": a step may have five next steps, the most; the lowest stays as #220 decided,
     two, one a draft's to-do, since the owner names only the highest. Five is the owner's
     number, not a reading, and overrules #220's refusal of five (10.43); what gives way so
     that five keep the no-scroll rule is #231's.
   - "Displayed in a evenly spread out manner": the buttons of a step stand equally wide and
     equally far apart, spread across the row below the Bubble, at every width and for every
     number from two to five, as one row from 1000 pixels wide up already is (41.3). Whether
     they may stand in more than one row is #231's, under the next reading.
   - "When click, the view slides in the direction of the button": following a next step's
     button slides the view toward the side of the page where that button stands -- down and
     to the left from a button left of the middle, down and to the right from one right of it,
     straight down from one in the middle -- at every width and for every number. Today that
     fails below 1000 pixels wide (Context). It holds wherever the row is drawn: in the editor,
     the owner's "tree creation view", where nothing slides today, and on the public page and
     in the preview, which draw the same row and slide by one rule (34, 40.2).
   - "When the user presses back, it goes in the same path backwards, but we already solved
     that I think": it is solved on the public page and in the preview, where the up arrow
     retraces the step down (#102) and the browser's back reverses the slide (11.3); in the
     editor, where nothing slides, the way back slides as part of the slide asked for, and it
     retraces whatever path #231's rule gives the step down.

6. **The core document is amended here for every passage the owner's words make untrue**, each
   marked `[#230]` and pointing at the new bullet of 3.4, which holds the owner's words whole
   (the passages are listed in this record's header). Passages that stay true are not marked:
   3.2's "both Answer buttons look the same" with its `[#219]` and `[#220]` notes, which the
   evenly spread row keeps; 3.2's "The Node offers its Answers ... or as many next steps as its
   creator gave it"; the row **Terminal** of 5, whose "tree ends here" is still the name of
   the Terminal's control, in the Sheet; 10.23's "children are the Answer targets"; and section
   9, whose rules hold for five as for four and which 10.44 names as what #231 decides against.

## Alternatives rejected

- **Asking the owner first, with `needs-human`, what gives way for five.** What gives way is a
  measurement of the page under the no-scroll rule, as #220's refusal of five was, and the
  layout, the slide's rule and the editor's Sheet are contracts: the Architect's to decide and
  the owner's to overrule, as 10.43 was on #220. A reading that #231 finds against a must-never
  of section 9 goes to an OPEN item for Idse, as 10.42 did on #202.
- **Deciding the layout of five, or the slide's rule, in this record.** Both are measurements
  across the viewports of `application.md` 10.6 and below them, in several faces, and #220 and
  #221 measured four that way (`docs/research/issue-220-answer-row-room.md`,
  `docs/research/issue-221-answer-row-faces.md`). This record measures only what `dev` does today,
  to say what the owner's words change.
- **Reading "up to 5" as a bound the room may lower.** The owner names the number; #220 left
  "more than four" open to a measurement because #219 named none ("three or four options").
- **The slide on the public page alone, or in the editor alone.** The owner speaks of the tree
  creation view, which does not slide; the public page and the preview draw the same row through
  the same components (34) and slide by one rule, which today fails below 1000 pixels wide
  (Context). One rule for both keeps the editor looking "exactly like the final Tree" (3.4,
  owner, #131). The owner can overrule the reading on #231.
- **Keeping `+ Yes` and `+ No` beside the one `+`.** The owner asks for "just one + button".
- **An architecture issue for the format and the layout, and the editor built without one.**
  The editor's row, its Sheet and its slide meet 41.7 and 34.5, which #220 and #205 froze.
- **One build issue for the format, the page and the slide, and one for the whole editor.** One
  editor run would carry the Sheet, the fifth, the neighbour frames of a draft and the slide
  around the autosave under one run's ceiling (`max_run_minutes`, 150), where #222 built the
  editor's row alone. The format and the public page stay one issue: a format that accepts five
  on a `dev` whose page draws four would break the frontend on a Tree that follows the agreed
  shape, which section 9 forbids (`ADR-219-number-of-next-steps-round.md`, Alternatives).
- **Labelling the issues `proposed`.** The owner said `ready`, in the issue (decision 4).

## Consequences

- #231 is dispatched once this pull request merges and closes #230; then #232; then #233; then
  #234.
- The specs are not amended here; until #231 merges they describe what is on `dev`, which is
  correct. Core document 3.1, 3.2, 3.4 and 5 state the owner's change from the moment this
  merges, ahead of the build, as in the rounds of #202 and #219; 10.44 is OPEN until #231
  decides it.
- `dev` keeps, until #232 merges, a slide that does not go toward the side where four of the seven
  buttons of three and four stand below 1000 pixels wide (Context). It is not filed as a bug of its own: #232
  builds the rule that replaces it.
