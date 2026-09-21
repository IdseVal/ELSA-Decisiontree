# ADR-118-json-schema: the schema lives at `schemas/elsa-tree-4.json`, carries the structure and not the limits, and is served at `/schemas/elsa-tree-4.json`

- Status: ACCEPTED (frozen) -- 2026-09-21
- Issue: #118 -- Architecture: freeze the JSON-only Tree format (`elsa-tree/4`)
- Spec: `docs/specs/tree-format.md` 2, 3.9, 7; `docs/specs/application.md` 15.1
- Depends on: `docs/adrs/ADR-118-json-serialisation.md`

## Context

The core document (3.1) says "the published schema *is* the interoperability contract".
Until now that contract was prose: `docs/specs/tree-format.md` sections 4, 5 and 7, which
a person reads and this project's loader implements. A third-party lab writing its own
Tree had no machine-readable form of it, and an editor -- the round after this one -- has
nothing to generate a form from.

JSON has one. The question this ADR settles is not whether to publish a JSON Schema but
**how much of the contract it may claim to hold**, because a schema that claims the whole
contract and checks half of it is worse than no schema: an author whose Tree "passes the
schema" and then fails the loader learns that the published contract is not the contract.

Section 7 has twenty-odd rules. They fall into three kinds:

- **Shape**: types, which keys exist, which are required, the closed sets (`legal` /
  `case-law` / `literature`, the four outcomes, the seven colour roles, the two font
  roles), and the grammars of ids, language tags, file names, colours and URLs. A JSON
  Schema expresses all of these exactly.
- **Measured text**: V-LENGTH, V-LINES and V-COUNT. These are measured on the **counted
  text** of 3.8 -- Markdown links replaced by their text, explainer marks likewise,
  Unicode code points counted, and for rich text an estimated line count at 75 characters
  a line. A JSON Schema's `maxLength` counts UTF-16 code units of the raw string. For a
  description with two links the two numbers differ, so a `maxLength: 600` would reject
  text the format allows and would be a different rule wearing the same number.
- **Cross-reading**: V-L10N (every localised text holds exactly the declared languages),
  V-ROOT, V-ANSWERS, V-OPTIONS, V-ORPHAN, V-REACH, V-IMAGE (the file exists on disk),
  V-EXPLAINER and V-MARK. Each needs another part of the file, or the file system.

## Decision

1. **The schema is `schemas/elsa-tree-4.json` at the repository root**, a JSON Schema
   draft 2020-12 document. The format number is in the file name, so `elsa-tree/5` will
   be `schemas/elsa-tree-5.json` beside it and the `/4` file stays where it is forever:
   a Tree written today keeps a schema to point at after the next format lands.
2. **The app serves it at `GET /schemas/elsa-tree-4.json`** (`application.md` 15.1), so
   `schemas` joins `images` and `theme` as a reserved Tree id.
3. **The schema carries the shape and nothing else.** Types, required keys, closed sets,
   grammars, `additionalProperties: false` at every level (which is V-KEYS), "no `null`"
   and "no empty list" (V-NULL, V-EMPTY), and the two kind rules a single Node object can
   state: a question Node is not also a Terminal, and a Terminal has no Answers and no
   Options (V-KIND, V-TERMINAL, expressed with `dependentSchemas`).
4. **The limits and the cross-reading rules stay in section 7**, applied by the loader
   after the schema passes. `tree-format.md` 7 says which rule each kind belongs to, in
   its own column, so an author reading the rules knows which tool answers for which.
5. **The schema names no host.** It has no `$id`. Where this application is deployed is
   still open (core document 7), and a `$id` naming a host that may never exist is a
   false statement in the one file whose job is to be authoritative. Every `$ref` inside
   it is document-local (`#/$defs/...`), which needs no `$id`. When a permanent public
   address exists, adding `$id` is one line and breaks nothing.
6. **A Tree points at the schema with `$schema`, and that value is checked.** It must be
   the origin-relative path `/schemas/elsa-tree-4.json`, or an absolute `http(s)` URL
   whose path ends with `/schemas/elsa-tree-4.json` (V-SCHEMA). The format number is
   therefore in the file twice, in `$schema` and in `format`, and a file that disagrees
   with itself is rejected rather than half-read.
7. **The loader never fetches `$schema`.** It validates against the copy in the
   repository. Nothing this application does reaches another origin at run time (core
   document 7, 9; `application.md` 13.5), and that includes validation.

## Alternatives rejected

- **Put the length limits in the schema as `maxLength` and `maxItems`.** Tempting because
  a generic validator would then catch more. Rejected: `maxLength` measures the raw
  string, the format measures counted text (3.8), and the two disagree on exactly the
  descriptions authors write -- the ones with links. An author would be told "600 is the
  maximum" by one tool and "your 612 characters are 587 counted" by the other. The counts
  (`maxItems`) could be expressed faithfully, but splitting the limits across two
  documents by whether each happens to be expressible is the worst of both: keep every
  limit in 5.7 and every limit's message in the loader.
- **Generate the schema from the TypeScript types in `src/tree/types.ts`.** The types are
  the loader's normalised in-memory shape -- `kind` added, absent lists turned into empty
  arrays -- not the file's shape, so the generated schema would describe something no
  `tree.json` looks like. Generating them the other way round, types from the schema, is
  worth doing later and changes nothing here.
- **A `$id` of `urn:elsa-tree:4`.** Absolute, host-free and legal. Rejected because a URN
  no tool resolves is furniture: it buys nothing that omitting `$id` does not, and it
  invites a reader to think there is a registry.
- **Letting `$schema` be any string, or omitting it.** Then a generated Tree usually has
  no pointer, and the self-describing property the dataset endpoint depends on holds for
  the Trees in this repository and nowhere else.
- **Validating against the schema fetched from `$schema` at run time.** A Tree is
  third-party data (`application.md` 5.3); fetching a URL it names, at server start, is
  the one thing sections 7 and 9 of the core document forbid.

## Consequences

- Two error messages, two sources, one order: shape errors come from the schema with a
  JSON Pointer, content errors from section 7 with the Tree id, the Node id, the key
  path, the rule id and the actual against the maximum. Issue #119 runs the schema first
  and the rules second, and does not translate one into the other.
- A third party can check its own Tree with any JSON Schema validator before it ever runs
  this application, and will be told the truth about the shape. It will not be told about
  the limits, which is why 5.7 and `npm run validate` are named next to the schema
  wherever it is offered (`tree-format.md` 2; `README.md`, issue #119).
- The schema is a file in the repository, so it is under the code's licence (MIT), not the
  content licence; the route that serves it says so (`ADR-118-dataset-endpoint.md`).
- Verified on 2026-09-21 against the example Tree of `tree-format.md` section 8 in its
  JSON form: valid, and 23 mutations of it -- a Node both question and Terminal, an Option
  with `images`, a misspelt `anwsers`, a colour without `#`, a missing colour role, a
  capitalised id, a reference with a colon, a `null`, an empty list, no Nodes, a numeric
  `version`, a fifth outcome, an unknown Source kind, an image file with a path
  separator, a `.ttf` font, a `javascript:` URL, the wrong `format`, a `$schema` naming
  another version, no `$schema`, `nodes` as an object, a localised text as a bare string,
  and an empty string -- each rejected, each with the place named. The run is in the pull
  request of this issue.
