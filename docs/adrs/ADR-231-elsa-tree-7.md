# ADR-231-elsa-tree-7: five next steps make the format `elsa-tree/7`, and a `/6` file is converted by its format and `$schema` alone

- Status: ACCEPTED (frozen) -- 2026-10-10
- Issue: #231 -- Architecture: the round of #230
- Spec: `docs/specs/tree-format.md` (title, header, the manifest's `format`, the Node table, 5.3, 5.7,
  7, 10, 11, 12, 12.9 new), amended `[#231]`; `docs/specs/application.md` 5.1, 15.1, 15.2, 17.4,
  18.3, 19.1, 19.2, 42.2 (new)
- Depends on: `ADR-231-five-next-steps.md`
- Amends: `ADR-220-elsa-tree-6.md` (the next format number is taken: `/7`)
- Schema: `schemas/elsa-tree-7.json` is **not** written here; #232 writes it from `tree-format.md`
  3.9 and 5.3 as amended, beside `elsa-tree-6.json`, which stays served
- Built by: #232

## Context

`elsa-tree/6` holds `answers` as an array of two to four `{ label, target }` (`tree-format.md` 5.3);
its schema says `maxItems` 4. Section 10's rule: "Any change to the keys, the kinds, the outcome set,
the Theme roles, the limits or the validity rules is published as" a new format number, and "The next
change will be `elsa-tree/7`". One exception is on record: #102 cut the Node description's limit under
`elsa-tree/3` without a new number, because "the owner's answer scoped the change to the limit and the
validator, the shape of a Tree file is unchanged" (5.7). `schemas/elsa-tree-6.json` is served at
`/schemas/elsa-tree-6.json`, named by every Tree's `$schema` and by the dataset endpoint's `Link`
header, and a third party may validate a Tree against it.

## Decision

1. **`elsa-tree/7`**: `answers` holds two to five entries, one to five in a draft; nothing else
   changes. The schema says `maxItems` 5; the draft schema derived from it keeps `minItems` 1.
2. **By the rule, not as an exception.** A limit changes, and #102's exception was the owner's own
   answer on its PR; the owner's words on #230 name the number of next steps, not the format, and a
   format number is the Architect's (10.21).
3. **`schemas/elsa-tree-7.json`** beside the `/6`, `/5` and `/4` files, each still served; the loader
   accepts `/7` alone.
4. **12.9 converts a `/6` file** by its `format` and its `$schema` and nothing else: every `/6` file
   is a valid `/7` file in shape. `npm run migrate` runs it over the repository after 12.7 and 12.8,
   and the store over a deployment's data directory when it opens a file, as 12.8.4 does.
5. **No Tree on `dev` is given a fifth next step.** The content is the owner's.

## Alternatives rejected

- **Keeping `elsa-tree/6` and raising its `maxItems` to 5 in place.** A Tree of five next steps would
  name `elsa-tree-6.json`, and a third party holding that schema as it was published would refuse a
  file that says it follows it -- which is what the rule of section 10 exists to prevent ("a loader
  states which format numbers it accepts"). The cost of a number is one conversion that renames two
  strings.
- **An exception the owner takes, as #102's cut.** The owner has not taken one, and #102's was the
  owner's answer to a question put on its PR; a change that only widens a limit gains nothing from
  skipping the number but the conversion, and loses the guarantee above.
- **Converting a `/6` file only when it is written again.** Every reader would then accept two
  numbers; the loader accepts one, and the store converts on open, as for `/4` and `/5`.

## Consequences

- #232 writes the schema file, the validator's limit, the loader's accepted number, `Manifest['format']`,
  12.9 in `src/tree/` beside 12.7 and 12.8, the store's conversion on open, and runs `npm run
  migrate` over `trees/` and `tests/fixtures/`, recording the count in `tree-format.md` 12.9.3; the
  example Tree's description and section 8's block change with it in one commit
  (`tests/migrate-tree.test.ts`).
- The schema route serves `elsa-tree-7.json`, and the dataset's `Link` header and `llms.txt` name it
  (`ADR-231-other-readers.md`).
- What becomes untrue: `tree-format.md` 10's "The next change will be `elsa-tree/7`", and
  `ADR-220-elsa-tree-6.md`'s `/6` as the current number; that ADR carries a dated line naming this one.
