# ADR-231-other-readers: the JSON-LD suggests up to five answers, `llms.txt` and the dataset endpoint name `elsa-tree-7.json`, and the preview draws the public row, notice and slide

- Status: ACCEPTED (frozen) -- 2026-10-10
- Issue: #231 -- Architecture: the round of #230
- Spec: `docs/specs/application.md` 15.1, 15.2, 16.4, 16.5, 40.2, 42.6 (new), amended `[#231]`
- Core document: section 1's findability contracts, 3.4 (what the round does not change), 10.44
- Depends on: `ADR-231-elsa-tree-7.md`, `ADR-231-slide-toward-the-button.md`
- Amends: `ADR-220-other-readers.md` (decision 1's "two to four" suggested answers, decisions 2 and 3's
  `elsa-tree-6.json`); `ADR-118-json-ld.md` as amended by #220 (two to four); `ADR-118-dataset-endpoint.md`
  as amended by #220 (the `Link` header names `elsa-tree-6.json`)
- Built by: #232

## Context

A question Node's page carries a JSON-LD `Question` with one `suggestedAnswer` per next step, `text`
the label, a colon and the target's title, `url` the target's canonical URL (16.4, 41.6). `llms.txt`
names no step and no Answer; its dataset entry names the schema (`SCHEMA_HREF`, 16.5). The dataset
endpoint serves the Tree file byte for byte with a `Link: rel="describedby"` header naming the schema
(15.2). The preview of a hidden Tree draws a draft through the public components with no slot,
neighbour frames and slide included, within the public page's bound (40.2).

## Decision

1. **The JSON-LD**: one `suggestedAnswer` per next step, in their order, up to five, each as 41.6
   has it. No other key changes.
2. **`llms.txt`** changes its schema path alone: `/schemas/elsa-tree-7.json`.
3. **The dataset endpoint** serves the file as it is; its `Link` header names `elsa-tree-7.json`, and
   the schema route serves it beside `/6`, `/5` and `/4`.
4. **The preview** draws the public row of `ADR-231-answer-row.md`, the public notice of
   `ADR-231-five-next-steps.md` and the slide of `ADR-231-slide-toward-the-button.md`, within 41
   Nodes; a draft's lone next step is a row of one, centred, as 40.7 draws it.
5. **The tests**: `transition.spec.ts` asserts each button's slide against where it stands;
   `no-scroll.spec.ts` the fixture of five and the boxes' edges; `neighbourhood.test.ts` `across` and
   the bound (42.10).

## Alternatives rejected

- **A `suggestedAnswer` capped at two, or the yes and no only.** A step of five would offer a crawler
  two of its five ways on; the answers are the step's content, and #220 already made them one per
  next step.
- **`llms.txt` naming the steps of five.** It names no step at all; nothing about a step's count is in
  it to change.

## Consequences

- #232 changes `SCHEMA_HREF` and the dataset route's header through the format's number, and adds a
  JSON-LD test with five.
- What becomes untrue: `ADR-220-other-readers.md`'s "two to four" and `elsa-tree-6.json`,
  `ADR-118-json-ld.md`'s and `ADR-118-dataset-endpoint.md`'s as #220 amended them; each carries a dated
  line naming this ADR.
