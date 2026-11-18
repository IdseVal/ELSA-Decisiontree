# ADR-263-description-field: the editor's description field stops at 600 characters and 8 lines, and is the public box at its tallest, empty and filled, its source and its rendered text each scrolling inside it

- Status: ACCEPTED (frozen) -- 2026-11-18; decides core document 10.46's editor question with
  `ADR-263-description-limit.md`, `ADR-263-description-box.md` and `ADR-263-description-scroll.md`
- Issue: #263 -- Decide the longer description that scrolls in the Bubble and the Overlay (#262)
- Spec: `docs/specs/application.md` 28.1, 28.3, 28.4, 28.6 (amended `[#263]`) and 43.9 (new)
- Core document: 3.2 `[#262]` (the reading "the editor's description field takes the same limit
  and the same box", confirmed), 10.46
- Amends: `ADR-172-typing-stops-at-the-limit.md` (decision 1's `lines / 2` is `lines / 8`; the
  description's box of two lines, three below 480, is the box of decision 2 below),
  `ADR-133-bubble-edited-in-place.md` (its context's "at most 150 characters and 2 lines")
- Depends on: `ADR-263-description-box.md`, `ADR-263-description-scroll.md`
- Built by: #265

## Context

The editor is "the Bubble edited in place" (`docs/specs/application.md` 28): every text is drawn by
the `field` slot where the public text stands. The description's field (`src/editor/Field.tsx`)
shows the rendered text while it is blurred and its Markdown source in a `textarea` while it is
focused (28.5). Since #172 typing stops at the limit, counted as the validator counts
(`ADR-172-typing-stops-at-the-limit.md`), and each field's box has, empty and filled, "the size its
text takes at the limit where it is drawn": for the description two lines, three below 480 pixels
wide (28.4), set as `--field-lines` in `src/app/[lang]/globals.css`; a hidden mirror of the text
grows the box past those lines for a text stored over its limit. The field's limit comes from
`LIMIT.description` in `src/components/Bubble.tsx`, `{ characters: 150, lines: 2 }`.

The round's record read the owner's words as: "the editor's description field, which is the Bubble
edited in place (28), takes the same limit and box" (core document 3.2 `[#262]`, PROPOSED). The
public box is as tall as its text and at most what the text area leaves it
(`ADR-263-description-box.md` decision 2); a text at the new limit is taller than that at 1280 x 640
in every face measured (168 to 192 pixels against 104.9).

## Decision

1. **The limit is 600 counted characters and 8 estimated lines** (`ADR-263-description-limit.md`),
   live: `LIMIT.description` is `{ characters: 600, lines: 8 }`. Typing stops at it and a paste is
   cut, as `ADR-172-typing-stops-at-the-limit.md` decided; the counter pill shows `n / 600` and
   `lines / 8` (28.3).
2. **The field's box is the public box at its tallest, empty and filled**: as tall as the text area
   leaves the description (`ADR-263-description-box.md` decision 2), whatever the field holds, so
   it neither grows nor shrinks while the creator types -- #172's rule, the size a text at its limit
   takes where it is drawn, met by the room, since a text at the limit is taller than the room at
   the guarantee. It takes the yield order of `ADR-263-description-box.md` decision 3, and below
   the guarantee what 10.5's order leaves.
3. **Both of its states scroll inside that box.** Blurred, the rendered text is the public box of
   `ADR-263-description-scroll.md` (decisions 1, 4 to 6); focused, the `textarea` scrolls inside
   the same box (`overflow-y: auto`), and the browser keeps its caret in view. Focusing it shows
   the source from its top. The hidden mirror no longer grows the description's box: a text stored
   over its limit scrolls inside it, where #172's box grew to hold it, because a box taller than
   the room would leave the text area (10.6).
4. **The box carries `data-description-box`** in both states, and the walk treats it as on the
   public page: its height skipped, its width and its place inside the text area checked
   (`ADR-263-description-scroll.md` decision 2). Its keyboard is the field's own: the rendered text
   is already a tab stop that opens the source (28.5), and the `textarea` scrolls as it is typed in.
5. **The rim is unchanged**: the counter pill, the missing-language tags (28.3) and the `mark`
   button (32.1) stand at the field's top, on the rim, and take no pixel from the text area.
6. **28.6 stands with one exemption more**: everything the editor adds is still outside the text
   area; the description's field is the one box in the Bubble or an Overlay that scrolls, as on the
   public page. `tests/fixtures/full-node/` as a draft, at its new maximum, fits in the editor with
   every Sheet open (`admin-no-scroll.spec.ts`), with the field blurred and focused, and scrolled
   to its end.

## Alternatives rejected

- **A box of a fixed number of lines** (two, as today, or eight). Two lines would make the editor's
  box shorter than the public one and hide most of a text the creator is writing; eight lines, 192,
  do not fit the text area at 1280 x 640, where the room is 104.9.
- **A box that grows with its text up to the room.** It would grow while the creator types, which
  the owner asked on #169 that the boxes not do ("the don't grow on inputs, they should just stop
  at the cap", 28.4).
- **Growing past the room for a text stored over its limit**, as the mirror does today. The text
  area cannot hold it, and the box scrolls already.

## Consequences

- #265 changes `LIMIT.description`, the description's `--field-lines` rule in
  `src/app/[lang]/globals.css` (for `.editor-field--rich`), the `textarea`'s `overflow`, and the
  mirror's role for the description, and adds `data-description-box` in `Field.tsx`; the title's
  and every other field's box stay as 28.4 has them.
- `fields.spec.ts` (#172's rows) asserts the description's box at 1280 x 640 empty, full and over
  its limit, equal to the public box at the same size, and the counter's `600` and `8`.
