# ADR-231-five-next-steps: a step has two to five next steps, and for five the notice gives way, in boxes of its own on the public page and in the editor

- Status: ACCEPTED (frozen) -- 2026-10-10; the owner may overrule (core document 10.44)
- Issue: #231 -- Architecture: the round of #230
- Spec: `docs/specs/application.md` 10.4, 10.5, 41.1, 41.4, 42.1, 42.4 (new), amended `[#231]`;
  `docs/specs/tree-format.md` 5.3, 5.7, 7 (V-ANSWERS)
- Core document: 3.4 `[#230]` (the reading "the lowest stays two", confirmed), section 5 row
  **Answer**, 10.22, 10.43, 10.44
- Measurements: `docs/research/issue-231-five-next-steps.md`
- Supersedes in part: `ADR-220-number-of-next-steps.md` (five refused; two to four)
- Amends: `ADR-38-no-scroll.md` as amended by 10.22 (another exception beside the floor, keyed to a
  count); `ADR-220-answer-row.md` decision 6 (its notice holds for three and four; five have their
  own); `ADR-230-tree-creation-round.md` decision 5 (the reading of "up to 5")
- Built by: #232 (the format, the pages, the notice of the public page and the preview), #233 (the
  editor's `+`, which makes a step of four a row of five, and the editor's notice)

## Context

The owner, on #230 (2026-10-10): "Then the user can decide how many he wants, there can be up to 5."
On #220 five were measured and refused: "from 1000 pixels wide down, one row of five breaks a
19-character label into three lines and more in Verdana and overflows at 360 x 481, and two a row
needs a third row, which overflows the full Node in windows 481 tall" (`application.md` 41.1). The
page must never scroll (core document section 9); a step of three or four already shows the
`minimumSize` notice below 600 x 560 on the public page (41.4) and below 600 x 590 in the editor
(41.7 item 8). #231's TASK: five "is not refused again; what you choose is how it fits".

The measurement (`docs/research/issue-231-five-next-steps.md`) tried the arrangement #220 did not:
one row from 1000 pixels wide and **three then two** below, each button a third of the row. On the
full Node with five labels of 19 characters, in Segoe UI, Verdana, Liberation Sans and DejaVu Sans,
both languages:

- at 1280 x 640 every label takes two lines in buttons of 236, on the public page and in the editor:
  the row stays 68;
- one row of five fits a window 481 tall at 1000, 1100 and 1279;
- on the public page every face fits 481 tall from 700 to 999, needs up to 515 at 600 and 584 from
  360 to 599, and 648 at 321; 360 x 640 and 390 x 844 fit;
- in the editor, where the words stand between the move arrows, every face fits 481 tall from 767,
  needs up to 685 from 390 to 766, 792 at 360 and 1080 at 321; 360 x 640 does not fit, 390 x 844
  does;
- a step of four and the editor's `+` needs what five need, cell for cell.

## Decision

1. **A question Node has two, three, four or five next steps**, chosen per step; a draft step may
   hold one, as a to-do; a sixth is refused by the schema and by the store's write (422,
   V-ANSWERS). Five is the owner's number. **The lowest stays two**: the owner named the most only,
   and one next step is a button with no choice, which #220 made a draft's to-do (core document 3.4
   `[#230]`'s reading, confirmed).
2. **What gives way for five is the notice, as for three and four**: nothing in 10.5's order moves,
   the Answer buttons are never given up, no label is shortened, and the limit of 19 characters
   stands. A row of five buttons shows the `minimumSize` notice, naming the height, **in two boxes**:
   below W1 wide and H1 tall, and below W2 wide and H2 tall (`application.md` 42.4's rule):
   - W1 is 41.4's width: the lowest width measured from which the page fits a window 481 tall at it
     and at every width measured above it up to 999, rounded up to ten;
   - W2 is the width of the narrowest viewport of 10.6 narrower than W1 at which the page fits;
   - H1 the highest need from W2 up to below W1, rounded up to ten, never below the same page's
     notice for three or four; H2 the highest need below W2, rounded up to ten.
3. **The numbers, measured**:
   - **the public page and the preview**, a step of five: **below 700 x 590, and below 360 x 650**;
   - **the editor**, a row of five buttons (five next steps, or four and its `+`): **below 770 x 690,
     and below 390 x 1080**.
4. **The second box exists for the viewports of 10.6.** One box of 41.4's shape, below 700 x 650,
   would show the notice at 360 x 640 on the public page, where five fit with 56 pixels to spare,
   because 321 wide needs 648; in the editor one box below 770 x 1080 would take 390 x 844, which
   fits. The second box gives the narrowest widths what they need without taking those viewports.
   Between the widths measured a narrower window is never given more room -- the buttons and the
   Bubble's text area only narrow -- so the need at a width measured bounds the widths above it up
   to the next one measured, but at 480, where the row's padding of 4 and its gap of 20 return,
   which is itself measured.
5. **The editor at 360 x 640 shows the notice for a row of five buttons**: there a label between the
   move arrows takes eight lines in a button of 104 pixels and the page needs 744 to 792. It keeps
   the editor at 390 x 844 and from 770 pixels wide up at 690 tall.

## Alternatives rejected

- **One row of five at every width.** At 360 x 640 a button is 59 pixels and a 19-character label
  takes eight lines; at 321, ten (`docs/research/issue-220-answer-row-room.md` section 5.1, "one row,
  5"): a column of letters, not a label.
- **Two a row, the fifth on a third row.** A third row overflows the full Node in every window 481
  tall measured and at 800 x 640 (the same record, "two a row, 5"), where three then two fit at 481
  from 600 up.
- **A shorter limit for the words of a step of five.** The limit of a label would depend on how many
  labels its step has: a creator adding a fifth next step would find the four words already written
  over the limit, and the format would hold two limits for one field, where 19 is the ending's cap and
  the room's for every count (`ADR-220-words-on-a-next-step.md`). It would buy little: on the public
  page the fifth button costs height below 700 pixels wide only.
- **The move arrows given up in the editor below some width**, so that a label has the whole button.
  Reordering is only possible through them (41.7 item 4); 10.5 gives nothing up that it does not
  keep behind a control, and the arrows have none.
- **One box per page, of 41.4's shape.** Decision 4.
- **No notice; a known cost recorded instead.** The page would scroll on a valid Tree, which section
  9 forbids.
- **Refusing five again, or allowing six.** #231's TASK puts both out of scope: five is the owner's
  number.

## Consequences

- #232 builds 42.1 (the format through `ADR-231-elsa-tree-7.md`, the schema, the validator, the
  store's 422 on a sixth) and the notice of the public page and the preview, with `no-scroll.spec.ts`
  one pixel either side of each width and height (42.10); #233 builds the editor's, with
  `admin-no-scroll.spec.ts` the same way.
- A step of four next steps in the editor shows its `+` (`ADR-231-one-plus.md`), so it is a row of
  five buttons and shows the editor's notice for five; it showed 41.7 item 8's below 600 x 590.
  At 360 x 640 the editor of such a step shows the notice where #222's row was drawn.
- A desktop window below 700 x 590 shows the notice on a step of five on the public page, where it
  showed the page for a step of two; phones held upright keep it.
- What becomes untrue: 41.1's "a fifth is refused" and the refusal in
  `ADR-220-number-of-next-steps.md`; `ADR-38-no-scroll.md`'s floor gains a third exception; core
  document 3.4's `[#220]` "more than four is not", 10.22's notes and 10.43's "two to four". Each
  carries a dated line naming this ADR.
