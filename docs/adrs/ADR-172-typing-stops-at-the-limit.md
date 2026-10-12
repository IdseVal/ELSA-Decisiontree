# ADR-172-typing-stops-at-the-limit: a field accepts no character beyond its limit, counted as the validator counts; a paste is cut after the last whole character that fits; a text already over its limit can shrink and cannot grow

- Status: ACCEPTED -- 2026-10-02
- Issue: #172 -- Editor fields: a placeholder that names the field, a box sized to its text,
  typing that stops at the limit, and one pass over every input of the admin area
- Spec: `docs/specs/application.md` 28.4 (amended 2026-10-02)
- Supersedes: `docs/adrs/ADR-133-bubble-edited-in-place.md` decision 5 ("At the limit typing
  does not stop; the field is marked and the write is stored") and its rejected alternative
  "Stopping the keystroke at the maximum (`maxlength`)". The rest of that ADR stands.
- Depends on: `ADR-133-bubble-edited-in-place.md` decision 4 (the counters count with the
  validator's own functions, `src/tree/measure.ts`), `ADR-132-draft-and-publish.md` (a
  write over a limit is stored and reported), `ADR-169-tree-creation-ui-round.md` (core
  document 3.4 records the owner's change, marked `[#169]`)

## Context

The owner walked the editor and wrote, in #169 (2026-10-02): "Also make sure the input
boxes are nicely sized for what will come inside of them, so they fit nicely inside the
bubble the way they should and the don't grow on inputs, they should just stop at the cap."

ADR-133 decision 5 had decided the opposite: typing never stops at a limit; over it the
pill and the outline turn `danger`, the write is stored with V-LENGTH or V-LINES (22.3), and
Publish is the one wall (19.3). It rejected stopping the keystroke at the maximum
(`maxlength`) for three reasons: the counter would become pointless, a pasted paragraph
would be lost at its 151st character, and `maxlength` counts UTF-16 units where
`tree-format.md` 3.8 counts code points.

## Decision

**A field accepts no character beyond its limit, counted as the validator counts.** An
input event that would take the text past its limit keeps what fits and drops the rest:
a key past the limit does nothing and leaves the caret where it was, and a paste is cut.
`capped` and `fitsLimit` in `src/editor/fields.ts` decide it, and `heldToLimit` in
`src/editor/Field.tsx` applies it to the element. The limit is that of `tree-format.md` 5.7,
measured with the functions the validator uses (`countedLength`, and `estimatedLines` for the
description's 2 lines), with the whitespace at the start and the end counted as well: 3.8
trims it, and without it a space typed at the limit would go in and be stored. A text already
over its limit by either measure (stored before this decision, or by another route: a
hand-made file, the API) is shown whole and marked as before. An edit of it is taken only if
the result is within the limit by both measures or no longer than before by either, so it
can be shortened and cannot be lengthened. The store is unchanged: a write over a limit
from another route is still stored and answered with its advisory (22.3), and Publish is
still the wall (19.3).

What becomes of the three reasons ADR-133 gave against stopping the keystroke:

1. **The counter** stays and shows where the creator is: `n / max`, and `lines / 2` for
   the description, on the rim while the field has the focus (28.3). It shows the room
   left before the limit, and it still turns `danger` on a text stored over it.
2. **The pasted paragraph** is cut after the last whole character that fits: a grapheme
   (`Intl.Segmenter`), so a decomposed `é` or a flag is never split. What followed the
   caret stays, and the caret stands after the part that was kept.
3. **UTF-16 units against code points:** the cut is made by `countedLength`, not by
   `maxlength`. None of the capped fields has a `maxlength`, so `é` is one character, a
   link counts its words and not its address, and a character outside the Basic
   Multilingual Plane (two UTF-16 units) is one.

## Alternatives rejected

- **`maxlength` on the field.** It counts UTF-16 units of the raw text, so a link's
  address and the second unit of an emoji would count. It has no measure for the
  description's estimated lines. This is ADR-133's third reason, and it still holds.
- **Refusing a paste whole when it does not fit.** A paste ten characters too long would
  leave nothing, and the creator would see nothing happen. Cutting it keeps what fits, and
  the counter shows why it stopped.
- **Cutting a stored text down to its limit when the field shows it.** That deletes text
  that a creator or another route stored. Shortening it is the creator's act, so the field
  shows it whole and only stops it from growing.
- **Holding each measure on its own to the larger of the limit and the text before.** This
  was the first build of this decision (PR #184). A description over its 2 lines but under
  its 150 characters then took every key typed at its end. A text over its limit by one
  measure must not grow by the other.
- **Refusing an over-limit write at the store as well (422).** The draft is where a text is
  safe (ADR-133's third rejected alternative), and a hand-made file or the API may hold a
  text over its limit. Only typing stops.

## Consequences

- `application.md` 28.4 carries the dated amendment. ADR-133 decision 5 and its rejected
  alternative carry a "Superseded by ADR-172 (2026-10-02)" note. Core document 3.4 already
  records the change (`[#169]`, `ADR-169-tree-creation-ui-round.md` decision 6).
- The attach Sheet's credit and description (120 each) and the logo's alternative text (80)
  stop at their limits in the same way. They are inputs of their own, not `Field`s.
- Tests: `tests/editor/cap.test.ts` (the cut, the boundary cases of 3.8, a text over its
  limit by one measure or both), `tests/editor/field.test.tsx` (through the component),
  `tests/browser/fields.spec.ts` (keys typed one by one, the stored length read back from
  the API), and `tests/browser/editor.spec.ts` (a description over its lines takes no key).
- A link typed key by key near the description's limit counts its address until its `)`
  closes it (3.8), so the creator cannot type a long link that would fit once closed. A
  paste of the whole link fits.
- The new-Tree form's title (27.1) is not an editor field and still counts without
  stopping. Whether the owner's words reach it is an open question in PR #184.
