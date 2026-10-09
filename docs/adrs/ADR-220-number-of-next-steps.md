# ADR-220-number-of-next-steps: a step that leads on has two, three or four next steps, chosen per step by its creator; one is a draft's to-do, five or more is refused

- Status: ACCEPTED (frozen) -- 2026-10-09; the owner may overrule (core document 10.43)
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

The measurement (`docs/research/issue-220-answer-row-room.md` section 2): at 1280 x 640 one row
holds four buttons of 300 pixels, a label of up to 19 characters on one line, in every face
measured. Below 1000 pixels wide four do not fit one row and stand two a row. Five or six then
need a third row, which on the Node at every maximum overflows the page in every window measured
481 pixels tall -- at 360, 479, 768 and 1024 wide -- and at 1000 x 640 and 800 x 640, whatever
the label's length. Four keep two rows, which fit every window above the floor from 390 pixels
wide.

## Decision

1. **The number is the creator's, per step**: each question Node has its own number of next
   steps. A Tree may be all yes and no, or mix a yes-and-no step with a step of three or four.
   PROPOSED reading confirmed.
2. **The highest is four.** It is the owner's "three or four", and it is what the Answer row
   holds in two rows below 1000 pixels wide. Five and six were measured and refused: a third
   row of buttons does not fit the full Node in a window 481 tall at any width measured, or
   640 tall at 800 and 1000 wide, and the neighbourhood that is placed ahead of a click grows as
   *n* + *n*², 30 and 42 Nodes for five and six (`ADR-220-slide-and-neighbourhood.md`).
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
- **Five or six.** Measured not to fit (Context, decision 2). The owner can ask for more; the
  room would then have to come from somewhere the degradation order does not take today.
- **A number chosen once per Tree.** Forbids a Tree that mixes a yes-and-no step with a
  three-way one and allows nothing a per-step choice does not (`ADR-219-number-of-next-steps-round.md`).
- **No upper bound in the format**, the page coping. The no-scroll rule is a property of the
  data first (core document 3.1, "we have to have max length on content"); every list the page
  draws has its maximum in 5.7.
