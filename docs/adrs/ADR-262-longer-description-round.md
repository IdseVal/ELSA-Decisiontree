# ADR-262-longer-description-round: the owner's longer description that scrolls is one architecture issue and two build issues after it, filed `ready`

- Status: ACCEPTED -- 2026-11-18
- **[#263] Amended (2026-11-18)** by #263: decision 5's readings are settled, each confirmed (core
  document 3.2 `[#262]`); decision 7's "the picture's two fifths stand unless #263 decides that they
  give way": they give way, to one fifth (`ADR-263-description-box.md` decision 1, which records
  why); and the third Consequence's `elsa-tree/8` case is the one taken (`ADR-263-elsa-tree-8.md`).
- Issue: #262 -- Main text body in app must be longer and allow for scroll (the owner's
  instruction)
- Issues filed: #263 (`architecture`), #264 (`ui`), #265 (`ui`)
- Specs affected: none amended here; #263 amends the sections it decides
  (`docs/specs/application.md` 10, 26.3, 28 and `docs/specs/tree-format.md` 5.7 at least),
  #264 and #265 what they build
- Core document: amended here, marked `[#262]`: the preamble, its status line and the owner
  line; 3.1's `[v0.2]` bullet on maximum lengths; in 3.2 the `[#75]` bullet on the main image,
  the `[v0.2]` bullet "Everything fits inside the Bubble", and a new bullet holding the owner's
  words whole with the readings taken of them; the row **Bubble** of section 5; section 9's
  line "The page must never scroll"; the decision of 10.28; a new open item 10.46, OPEN for
  #263

## Context

The owner wrote in issue #262, on 2026-11-18 at 19:19:42Z:

> "I want you to put an issue on the board that makes the main text box of bubbles and
> sidebubbles longer, and it should allow for scroll. The 150 character limit that we picked
> is waaaaay too short sadly."
>
> "You can put issue(s)) on the board and set them to ready."

The task is the issues, not the change, as it was in #230 and #247.

This run read the specs, the code and the ADRs on `dev` (`e8a2439`) for the description's
limit, its box and the no-scroll rule:

- **The limit.** `docs/specs/tree-format.md` 5.7: "Node `description` (any language) | 150
  characters and 2 estimated lines (600 and 8 until #102) | V-LENGTH, V-LINES". The validator
  holds it at `src/tree/validate.ts:104` (`nodeDescription: 150`) and the editor's live limit
  at `src/components/Bubble.tsx:47` (`description: { characters: 150, lines: 2 }`). The Tree's
  own `description` keeps 600 characters and 8 lines and is not drawn in the Bubble
  (`docs/specs/application.md` 10.7).
- **The box.** `application.md` 10.7, as #174 amended it: at 1280 x 640 the text area is
  640 x 349 and holds the main image (160.4, two fifths of the Bubble's 401), the title (56),
  the description (**48**, two 24-pixel lines), the Sources (60) and three gaps of 8: 348.4 of
  349. "The 0.6 is all the band can still take." The picture's two fifths are the owner's choice
  on #102 (PR #110, answer (b)): "The owner chose the picture over the text" (10.7). The
  Overlay's Interior is the same component (10.3).
- **The no-scroll rule.** Core document section 9 and 3.2: the page never scrolls, and
  "Everything a Node shows fits inside its Bubble on the screen". `application.md` 10.6
  exempts two things from its element walk, the Carousel strip and a `[data-scroll-box]`, and
  26.3 says of the second: "Nothing else may carry it: the Bubble, an Overlay, every other
  Sheet holds what the format bounds and fits or is a defect."
- **The format.** `elsa-tree/7`. `tree-format.md` 10: "The next change will be
  `elsa-tree/8`." #102 cut this same limit from 600 to 150 without a new number (core
  document 10.28).
- **Findability.** `application.md` 16.3 cuts the meta description at 155 characters and was
  written for this day: "The distinction is what happens the day that limit moves again,
  and it decides in advance which consumer takes the loss." `cutToLimit` in `src/markdown.ts`
  already implements the cut.
- **The editor.** 28 (the Bubble edited in place), 28.4 (the limits, live),
  `docs/adrs/ADR-172-typing-stops-at-the-limit.md`, 28.6 (the no-scroll rule in the editor:
  "Unchanged").

The owner's word "sidebubbles" is the word the owner has used for an Option since #131 ("a
side-bubble with a + where one of those side-bubbles can be created", core document 3.4) and
again in #241 ("the main bubble and on side bubbles"). An Option opens in an Overlay (core
document 5, row **Overlay**), which draws the same Interior as the Bubble.

## Decision

1. **One instruction, three issues.**
   - **#263** (`architecture`): decides what the owner's words leave open, core document
     10.46: the new limit, the box's height in the Bubble and in the Overlay at every
     guaranteed viewport and what gives way for it, how the box scrolls while the page
     never does (the scroll container, the no-scroll walk, keyboard reach, a sign of more
     text, scroll chaining, explainers, the neighbour frames and the slide, below the
     guarantee), the format's number, the editor's field, findability and the tests. It
     measures on the production build. No code.
   - **#264** (`ui`): builds #263's decisions for the format (schema, validator, loader,
     types, a conversion if #263 chooses `elsa-tree/8`) and for the pages a reader sees: the
     Bubble, the Overlay and the preview of a hidden Tree, which draws the same components
     (`application.md` 40.2).
   - **#265** (`ui`): builds #263's decisions for the editor's description field.

2. **Architecture first.** The change meets frozen contracts: the no-scroll rule of section 9
   and 10.6, which 26.3 says no Bubble or Overlay may be exempt from; a row budget with 0.6
   pixels left (10.7); and a format whose limits are its validity rules. The box's height and
   what gives way for it can only be measured, and that is the Architect's, as 10.22, 10.28
   and 10.44 were.

3. **Order, by `Depends on:` lines only.** #263 waits for #262, so that this record is on
   `dev` before it runs; #264 waits for #262 and #263; #265 for #262, #263 and #264, because it
   builds on the validator and the component #264 changes. Each issue was filed with its line
   from the start. Read back from GitHub with the dispatcher's own expression (`_DEPENDS_RE`
   in `.orca/dispatcher/dispatch.py`):

   ```
   263 architecture,ready ['Depends on: #262'] placeholders: 0
   264 ready,ui ['Depends on: #262, #263'] placeholders: 0
   265 ready,ui ['Depends on: #262, #263, #264'] placeholders: 0
   ```

4. **All three are labelled `ready`**, not `proposed`, because the owner said so on #262
   ("set them to ready"), although `.orca/dispatch.yml` has `autonomy: propose`.

5. **Where the owner's words leave a choice, the record says which reading was taken, each
   PROPOSED** (core document 3.2 `[#262]`), for #263 to confirm or replace:
   - "the main text box" is a Node's description, the rich text between the title and the
     Sources (10.3);
   - "bubbles" is the Bubble, and "sidebubbles" the Overlay an Option opens in (Context);
   - "longer" is both a taller box and a higher limit than 150 counted characters. A limit
     stays: the owner's words call 150 too short, and do not ask for no limit, so 3.1's
     `[v0.2]` rule stands;
   - "allow for scroll" is: the description's box scrolls vertically inside its own bounds,
     and the page still never scrolls, as section 9 says;
   - the editor's description field, the Bubble edited in place (28), takes the same limit
     and box.

   The number is not read from the owner's words: they name none, and the record leaves it
   to #263 (10.46), with the owner free to overrule.

6. **The core document is amended here for every passage the owner's words make untrue**,
   each marked `[#262]` and naming 10.46: 3.1's bullet on maximum lengths (its reason, that
   nothing scrolls, no longer holds for the description), 3.2's `[#75]` bullet (the 150), 3.2's
   `[v0.2]` bullet and section 9's line (everything visible at once in the Bubble), the row
   **Bubble** of section 5 ("Everything in it fits on screen without scrolling") and 10.28's
   decision (the 150). The owner's words are held whole in a new 3.2 bullet, where the
   frontend's rules stand, rather than in 3.4, which is the editor's section.

7. **What this round does not change.** The page never scrolls, at any size (section 9). The
   Tree's `description`, the titles, the Sources, the Options, the Answers and the Carousel keep
   their limits and places; the picture's two fifths stand unless #263 decides that they give
   way, and if it does it records why.

## Alternatives rejected

- **One build issue.** The format, the public page and the editor, each with its browser
  suites, would share one run's ceiling (`max_run_minutes`, 150); and the editor builds on what
  the public page changes, as #233 waited for #232.
- **No architecture issue: a build issue that picks the number and the height itself.** Every
  earlier change of this box (#78, #102, #174) was measured against the row budget first, and
  10.6 and 26.3 are frozen. A build run that chose the height would also choose what gives way,
  which is the owner's picture choice of #102.
- **Raising the limit back to 600 and 8 lines here.** The owner named no number; writing one in
  this record would be the Planner's guess presented as the owner's.
- **Filing `proposed`.** The owner asked for `ready`.

## Consequences

- #263 runs as soon as this PR merges; #264 and #265 run in turn after it.
- While #263 is open, 10.46 is OPEN, and every PROPOSED reading of 3.2 `[#262]` waits for it.
- If #263 chooses `elsa-tree/8`, its conversion reaches the live server at a release's first
  start, which is the question of 10.45, still OPEN for the owner; #263 says so in its record.
- The owner's Trees on the live server were written to 150 counted characters; a higher limit
  makes none of them invalid.
