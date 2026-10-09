# ADR-220-elsa-tree-6: `answers` becomes an ordered array of two to four `{ label, target }`, the format becomes `elsa-tree/6`, and every `/5` file is converted by one procedure

- Status: ACCEPTED (frozen) -- 2026-10-09
- Issue: #220 -- Architecture: freeze how many next steps a step may have
- Spec: `docs/specs/tree-format.md` (title, 3.7, 3.9, 5 table, 5.3, 5.6, 5.7, 7, 10, 12.8 new),
  amended `[#220]`; `docs/specs/application.md` 5.1, 15.1, 17.4, 19.1, 19.2, 41.6 (new)
- Depends on: `ADR-220-number-of-next-steps.md`, `ADR-220-words-on-a-next-step.md`
- Amends: `ADR-171-elsa-tree-5.md` (the next format number is now taken: `/6`);
  `ADR-132-draft-and-publish.md` (the draft schema's relaxation of `answers`)
- Schema: `schemas/elsa-tree-6.json` is **not** written here; #221 writes it from
  `tree-format.md` 3.9 and 5.3 as amended, beside `elsa-tree-5.json`, which stays served
- Built by: #221

## Context

`elsa-tree/5` holds `"answers": { "yes": <id>, "no": <id> }`, "Exactly the two keys"
(`tree-format.md` 5.3), and says that the next change of keys or rules is `elsa-tree/6`
(section 10). The two Trees and 13 valid fixtures hold 38 question Nodes, every one with a yes
and a no; the 44 deliberately broken fixtures 44 Nodes with `answers`, one with a `yes` alone
(`ADR-219-number-of-next-steps-round.md`, counted at `e190507`). Six question Nodes of the Trees
and fixtures have a yes and a no that lead to the same Node -- three in
`ai-act-applicability-agrifood` (`general-purpose-ai`, `high-risk`,
`transparency-obligations`), and `carousel`'s `long`, `cycle`'s `second`, `overlay`'s `five`
(counted on `46ee621` by this run).

## Decision

1. **`answers` is an array**, in the order the buttons stand, of **two to four** entries, each
   an object of exactly two keys, written in this order: `label` (a plain localised text of at
   most 19 characters, `ADR-220-words-on-a-next-step.md`) and `target` (a Node reference to a
   question Node or a Terminal, as before). It mirrors an Option's `{ title, target }`.

   ```json
   "answers": [
     { "label": { "en": "Yes", "nl": "Ja" }, "target": "prohibited-practices" },
     { "label": { "en": "No", "nl": "Nee" }, "target": "outside-scope" }
   ]
   ```
2. **Two entries may lead to the same Node**, as a yes and a no may today: six Nodes on `dev` do
   it, and a choice such as "No" and "Not sure" leading on to one step is a reasonable Tree.
3. **The count is shape**: the schema says `minItems` 2 and `maxItems` 4 (V-ANSWERS, blocking).
   The draft schema derived in code (`application.md` 19.2) relaxes `minItems` to 1, so a draft
   step with one next step is the advisory to-do it is today; an empty array is V-EMPTY's,
   blocking, as for every array.
4. **The format number is `elsa-tree/6`**, with `schemas/elsa-tree-6.json` beside
   `elsa-tree-5.json` and `elsa-tree-4.json`, each still served (`application.md` 15.1). The
   loader reads `/6` alone; a `/5` file is converted, never read.
5. **The conversion (`tree-format.md` 12.8)** is 12.7's procedure for the next number: read
   with the loader's own reader; only a `/5` file is converted; `format` and `$schema` move;
   every `answers` object becomes the array -- its `yes` first, labelled `Yes` / `Ja`, then its
   `no`, labelled `No` / `Nee`, a key it lacks (a draft's lone Answer) left out -- in the chrome
   language of each tag, by `application.md` 3.1's rule; nothing else changes; written in the
   byte form of 3.7; validated, every violation reported. The four words are frozen in 12.8's
   table, as 12.7 froze the outcome words. `npm run migrate` runs it, and the store runs it on
   every `tree.json` and `draft.json` it opens (12.8.4), as it ran 12.7.

## Alternatives rejected

- **Keep the object and add keys** (`yes`, `no`, `third`, `fourth`, or `a` to `d`). Keys have no
  order a reader may rely on in every tool, and words have no place in a key.
- **Keep `yes` and `no` as they are and add an `others` array for steps of three or four.** Two
  shapes for one concept, and a step of two whose choices are not yes and no would have no form.
- **An array of bare ids, the labels in a parallel array.** Two arrays that must stay the same
  length are a rule the schema cannot state; one array of pairs is what `options` already is.
- **No new format number** (as #102's limit cut took none). The shape of the file changes, which
  section 10 says is a new number; a `/5` loader would reject every `/6` file anyway.
- **Freezing `schemas/elsa-tree-6.json` here.** The schema is derived from 3.9 and 5.3 by the
  run that also writes the loader against it and runs the migration; the issue allows it here,
  but a schema committed without the loader that reads it would be untested on `dev`.

## Consequences

- #221 writes `schemas/elsa-tree-6.json` from `tree-format.md` 3.9 and 5.3, the loader that reads
  `/6` alone, and 12.8's conversion, run by `npm run migrate` and by the store on every file it
  opens; it converts `trees/` and `tests/fixtures/` with it and records the result in section 8's
  block and `tests/migrate-tree.test.ts`.
- The readers of the format number move with it: `Manifest['format']`, `newDraft`'s `$schema` and
  `format`, `SCHEMA_HREF`, the schema route's set, and the tests that assert `elsa-tree/5` or
  `/schemas/elsa-tree-5.json`.
- A deployment upgraded to #221's release converts its own data directory at its first start,
  as it converted `/4` by 12.7.
- What becomes untrue: `tree-format.md` 5.3's "Exactly the two keys", `ADR-171-elsa-tree-5.md`'s
  next number, which is now taken, and `ADR-132-draft-and-publish.md`'s relaxation of `answers`;
  each carries a dated line naming this ADR.
