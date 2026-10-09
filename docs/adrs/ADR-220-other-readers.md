# ADR-220-other-readers: the JSON-LD suggests one answer per next step in its words, `llms.txt` and the dataset endpoint change only the schema they name, and the chrome keep `yes` and `no` for the editor alone

- Status: ACCEPTED (frozen) -- 2026-10-09
- Issue: #220 -- Architecture: freeze how many next steps a step may have
- Spec: `docs/specs/application.md` 3.2, 15, 16.4, 16.5, 41.6 (new), amended `[#220]`
- Core document: section 1's findability contracts, 3.4 (what the round does not change), 10.43
- Built by: #221

## Context

A question Node's page carries a JSON-LD `Question` with two `suggestedAnswer` entries, yes then
no, each with `text` "the chrome word for that Answer, a colon and the target Node's title ... the
exact label the button carries" and the target's `url` (`application.md` 16.4). `llms.txt` (16.5)
names the Tree, its dataset, the URL grammar, its languages and its licence, and no step or
Answer. The dataset endpoint (15) serves the Tree file byte for byte. The chrome keys `yes` and
`no` (3.2) label the two Answer buttons. Fourteen files under `src/` name `yes`; seven read
`answers.yes` / `answers.no` or the `'yes' | 'no'` key (`grep`, `ADR-219-number-of-next-steps-round.md`).

## Decision

1. **JSON-LD**: one `Answer` per next step, in their order, `text` the next step's label in the
   page's language, a colon and its target's title -- the button's accessible name, which is
   what "the exact label" now means -- and `url` the target's canonical URL in that language. A
   migrated yes-and-no step's answers say what dev's say: "Yes: <title>", "No: <title>".
2. **`llms.txt`** names no step and no Answer, so nothing in it changes for the next steps; its
   `## The dataset` entry names the schema through `SCHEMA_HREF`, which becomes
   `/schemas/elsa-tree-6.json` with the format (16.5).
3. **The dataset endpoint** serves the `/6` file as it is; its `Link: rel="describedby"` header
   names `elsa-tree-6.json` (15.2), and the schema route serves it beside `/5` and `/4` (15.1).
4. **The chrome keys `yes` and `no` stay**, for the editor's `+ Yes` and `+ No` and the words they
   write (`ADR-220-editing-next-steps.md`); the public page reads neither. Two keys are added for
   #222: `addNextStep` and `nextStepWords`.
5. **The code**: every reader of `answers.yes` / `answers.no` and of `'yes' | 'no'` -- the types,
   the validator, the byte form, the loader, the store's writes, the editor's row and writes, the
   neighbourhood, the tree view, the JSON-LD -- reads the array. #221 changes all of them but the
   editor's row, which #222 extends; `grep -rn "\byes\b" src` is the list to start from, not the
   list.

## Alternatives rejected

- **JSON-LD with the label alone.** It drops the step the answer leads to, which the `text` has
  carried, and makes a migrated Tree's JSON-LD change for no reader's gain.
- **Removing the chrome keys `yes` and `no`.** The editor's one-click yes and no need words in
  the chrome language; the migration's table has its own copy (`tree-format.md` 12.8).
