# ADR-220-number-of-next-steps: a step that leads on has two, three or four next steps, chosen per step by its creator; one is a draft's to-do, five or more is refused

- Status: ACCEPTED (frozen) -- 2026-10-09; the owner may overrule (core document 10.43)
- **[#231] Superseded in part (2026-10-10)** by `ADR-231-five-next-steps.md`: a step has two to five
  next steps, where it had two to four, and a sixth is refused; five are no longer refused, and a
  row of five shows a notice of its own (`docs/specs/application.md` 42.1, 42.4). The rest stands.
- Issue: #220 -- Architecture: freeze how many next steps a step may have
- Spec: `docs/specs/application.md` 41.1 (new); `docs/specs/tree-format.md` 5.3, 5.7, 7
  (V-ANSWERS), amended `[#220]`
- Core document: 3.4 `[#219]` (the readings "per step" and "two, three and four", confirmed),
  section 5 row **Answer**, 10.43
- Measurements: `docs/research/issue-220-answer-row-room.md` sections 2 and 5
- Amends: `ADR-171-elsa-tree-5.md` (the format's Answers, through `ADR-220-elsa-tree-6.md`)
- Built by: #221 (the format, the page), #222 (the editor)

## Context

The owner, on #219 (2026-10-09): "Some trees might consist of yes or no, some trees might end
there, but some trees might also have three or four options. Let's change the design to let the
creator of a decision-tree choose themselves to how many next steps there are in the tree." Until
now a question Node had exactly two Answers, `yes` and `no` (`tree-format.md` 5.3). The round
record (`ADR-219-number-of-next-steps-round.md` decision 5) proposed reading the number as chosen
per step, with two, three and four allowed, and left the lowest and the highest to a measurement
of the room under the no-scroll rule (core document section 9, 10.22).

The measurement (`docs/research/issue-220-answer-row-room.md` sections 2 and 5): at 1280 x 640
one row holds four buttons of 300 pixels, a label of up to 19 characters on one line, in every
face measured. One row of four keeps a 19-character label on two lines down to 900 x 640 in
Verdana (197 pixels a button) and takes three at 800; `ADR-220-answer-row.md` stands four two a
row below 1000, a margin of 100 pixels for the faces not measured. Two a row keeps the label on
two lines at every width from 390 up, and four in two rows fit every window above the floor from
390 pixels wide.

Five and six were measured in both arrangements. **In one row**, five keep a 19-character label
on two lines at 1280 and 1100 x 640, and in Verdana take three lines at 1000 x 640, four at 900
and 800 x 640 and five at 479 x 481 -- the page still fitting there -- and the page overflows at
360 x 481 and 321 x 640. **Two a row**, five or six need a third row, which on the Node at every
maximum overflows the page in every window measured 481 pixels tall -- at 360, 479, 768 and 1024
wide -- and at 1000 x 640 and 800 x 640, at every label length, 12 characters included. Rows of
three, two rows for five or six, were not measured.

## Decision

1. **The number is the creator's, per step**: each question Node has its own number of next
   steps. A Tree may be all yes and no, or mix a yes-and-no step with a step of three or four.
   PROPOSED reading confirmed.
2. **The highest is four.** It is the owner's "three or four", and it is the most the room holds
   the way it holds two: a 19-character label on at most two lines from 390 pixels wide up, and
   the full Node in every window above the floor from 390 wide. Five and six were measured and
   refused, and the narrow widths decide it: from 1000 pixels wide down, one row of five breaks a
   19-character label into three lines and more in Verdana and overflows the page at 360 x 481
   and 321 x 640, and
   two a row needs a third row, which does not fit the full Node in a window 481 tall at any
   width measured, or 640 tall at 800 and 1000 wide. The neighbourhood that is
   placed ahead of a click also grows as *n* + *n*², 30 and 42 Nodes for five and six
   (`ADR-220-slide-and-neighbourhood.md`).
3. **The lowest is two.** A published question Node has at least two next steps. A step with
   one is a **draft's to-do**, as a question step with one Answer has been since #132
   (`application.md` 19.2): V-ANSWERS, advisory in a draft, blocking at Publish.
4. **The count is in the file's shape**: `answers` is an array of two to four entries
   (`ADR-220-elsa-tree-6.md`). A write that would add a fifth is refused and stores nothing.

## Alternatives rejected

- **A single next step** ("Continue"). Not asked for: the owner's words name yes and no, an
  ending, and three or four. Allowing it would make a half-built step -- a yes whose no was never
  made -- a valid published step, and the to-do that catches it today (19.2, 33) would go. A
  step that only leads on is written today as the next step's own content or as an Option's
  explanation.
- **Five or six, in one row or two a row.** Measured: one row breaks a 19-character label into
  three lines and more from 1000 pixels wide down and overflows at 360 x 481 and 321 x 640; two a
  row needs a third row
  that overflows windows 481 tall (Context, decision 2). The owner can ask for more; the room would
  then have to come from somewhere the degradation order does not take today.
- **Five or six in rows of three**, two rows below 1000 pixels wide. Not measured. At 390 wide a
  third of the row is about 114 pixels, by arithmetic from the 175 a button two a row has there,
  where a 19-character label already takes two lines; it would need its own measurement before it
  could hold the owner's words, and four stand without it.
- **A number chosen once per Tree.** Forbids a Tree that mixes a yes-and-no step with a
  three-way one and allows nothing a per-step choice does not (`ADR-219-number-of-next-steps-round.md`).
- **No upper bound in the format**, the page coping. The no-scroll rule is a property of the
  data first (core document 3.1, "we have to have max length on content"); every list the page
  draws has its maximum in 5.7.

## Consequences

- #221 builds the count into the file's shape: the schema's `minItems` 2 and `maxItems` 4 on
  `answers` (V-ANSWERS), the draft schema's `minItems` 1, and a store that answers a fifth with
  422 and stores nothing; it adds fixtures of a step of three and of four next steps
  (`application.md` 41.9).
- #222 offers no `+` beside a fourth next step and lists "fewer than two next steps" among a
  draft step's to-dos (`application.md` 41.7, 19.2, 33.3).
- What becomes untrue: "exactly two Answers, a yes and a no" wherever the specs said it; each
  such passage of `application.md`, `tree-format.md` and the core document carries a dated
  `[#220]` mark, and each older ADR that decided it a dated line naming this round's ADR.
- A fifth next step later takes a new `architecture` issue and a measurement of what this one
  left out: a third row, or rows of three.
