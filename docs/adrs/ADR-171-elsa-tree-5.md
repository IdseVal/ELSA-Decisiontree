# ADR-171-elsa-tree-5: the ending text is a new format number, `elsa-tree/5`, with its own schema beside the old one; every `elsa-tree/4` file is converted by one procedure -- the repository's by #179, a deployment's by the store when it opens

- Status: ACCEPTED (frozen) -- 2026-10-02
- Issue: #171 -- Architecture: freeze the free-text ending of a tree (in place of the four
  fixed outcomes) and the font and licence dropdowns of the Theme panel
- Spec: `docs/specs/tree-format.md` (title, 2, 3.7, 3.9, 4, 7, 8, 9, 10, 11, 12.7 new);
  `docs/specs/application.md` 15.1, 17.4, 18.3, 19.1, 36.4 (new);
  `schemas/elsa-tree-5.json` (new, frozen here)
- Depends on: `docs/adrs/ADR-171-ending-text.md` (what changes in the file)
- Amends: `ADR-118-json-schema.md` decision 2 (the route serves both schema files),
  `ADR-132-data-directory.md` (the store converts what it opens, 17.4),
  `ADR-132-draft-and-publish.md` (the draft is `/5`, its schema derived from `/5`'s),
  `ADR-118-json-serialisation.md` (12.6's tool also runs 12.7)

## Context

`tree-format.md` 5.5 said of the outcome set: "The set is closed. A Tree that needs a fifth
value needs a new format number." Its section 10 says the general rule: "Any change to the
keys, the kinds, the outcome set, the Theme roles, the limits or the validity rules is
published as `elsa-tree/5`, with its own document and its own `schemas/elsa-tree-5.json`
beside this one". `ADR-171-ending-text.md` removes `outcome` and adds `label`: a change to the
keys and to the outcome set at once.

Once before, a change kept its number: #102 cut the Node description to 150 characters under
`elsa-tree/3`, because the owner's answer scoped it to the limit and the validator, the
**shape** of the file did not change, and V-LENGTH tells a Tree written to the old limit what
to cut (`tree-format.md` 5.7). This change is the other kind. A file with `label` fails the
`/4` schema (an unknown key) and a file with `outcome` fails the `/5` one; the file names its
version twice, in `$schema` and in `format`; and third parties validate against the schema the
file names (`ADR-118-json-schema.md`). A shape that changed under an unchanged number would be
a contract that lies.

Where `elsa-tree/4` files exist on 2026-10-02, measured:

- **The repository**: 56 `tree.json` files in `trees/` and `tests/fixtures/`, 108 Terminals in
  55 of them (54 `not-applicable`, 49 `applicable`, 2 `refer`, 2 `prohibited`, and the 1
  `maybe` that `tests/fixtures/invalid/v-terminal` carries on purpose); `tests/fixtures/invalid/v-json`
  holds none. Counted twice -- by parsing, and by the text `"outcome"` -- with the same 108.
- **Every deployment's data directory** (`application.md` 17): a `draft.json` for every Tree
  and a `tree.json` for every published one, all `elsa-tree/4` by construction, since the store
  writes nothing else (19.1).
- **Third parties' files**, which this project cannot reach.

## Decision

1. **The format is `elsa-tree/5`: `elsa-tree/4` with `terminal.label` in place of
   `terminal.outcome`, and nothing else.** Every other key, kind, limit, rule, the byte form of
   3.7 and the draft's rule table are what they were. `format` is `elsa-tree/5`; `$schema` is
   `/schemas/elsa-tree-5.json` or an absolute http(s) URL whose path ends the same way.
2. **`schemas/elsa-tree-5.json` is frozen in this pull request**: `schemas/elsa-tree-4.json`
   with nine lines changed -- the title, the `$schema` pattern, the `format` constant and the
   `terminal` definition (`required: ["label"]`, `label` a `localisedText`, no other key).
   **`schemas/elsa-tree-4.json` stays where it is and stays served** at
   `/schemas/elsa-tree-4.json`, as `ADR-118-json-schema.md` decision 1 promised, so a `/4` file
   kept by a third party still has its contract to point at; the schema route's published set
   becomes the two names (`application.md` 15.1). The loader accepts `elsa-tree/5` only: a
   `/4` file is converted, never read as `/4`.
3. **One conversion, `tree-format.md` 12.7**, a pure function of the parsed file:
   `format` `elsa-tree/4` becomes `elsa-tree/5`; a `$schema` that names `elsa-tree-4.json` names
   `elsa-tree-5.json` in the same place; every `terminal` whose only key is `outcome`, with
   one of the four values, becomes `{ "label": ... }` holding, for each declared language,
   **the badge word that language shows today** -- the chrome word of `application.md` 3.1's
   rule: Dutch for a tag whose primary subtag is `nl`, English for every other -- from a table
   of the eight words frozen in 12.7, so the conversion does not depend on `src/chrome.ts`,
   from which #179 removes them. Anything else is left exactly as it is and reported, to fail
   the rules it fails. The result is written in the byte form of 3.7, validated against the
   `/5` schema and the rules, and every violation reported. On an `elsa-tree/5` file it does
   nothing.
4. **Where it runs.**
   - **The repository**: #179 runs it over `trees/` and `tests/fixtures/` with `npm run
     migrate` (`scripts/migrate-tree.ts`, which already writes the byte form and validates,
     12.6) and commits the result. The three fixtures the loader's reader refuses -- a
     byte-order mark, a duplicate key, a file that does not parse -- are re-fitted by hand to
     `/5` text with their defect kept; `invalid/v-format` keeps its `elsa-tree/3` and gains the
     `/5` `$schema` and labels by hand, so its one defect is still the format; and
     `invalid/v-terminal`'s `maybe` stays as the procedure leaves it, which is the `/5` form of
     its defect.
   - **A deployment's data directory**: `openStore` converts, **before it opens any Tree**,
     every `tree.json` and `draft.json` under `trees/` whose `format` is `elsa-tree/4`, each
     replaced atomically (17.3) and logged in one line -- `Converted Tree "<id>" <file> from
     elsa-tree/4 to elsa-tree/5: <n> endings`. `meta.json` is not touched: no creator wrote.
     A file the procedure cannot convert is left as it was, and its Tree is refused (18.3) or
     uneditable (19.5) with the violations, as any file that fails is. `importTree` -- the seed
     and `npm run store -- import` -- converts a `/4` folder's file in its staging copy, never
     in the source folder.
   - **A third party's file**: `npm run migrate <folder>`, documented in 12.7.
5. **The conversion is not undone and keeps no copy.** A deployment's backup is its data
   directory (17.4); `docs/deployment.md` gains one paragraph asking for one before the first
   start of the release that carries `elsa-tree/5`.

## Alternatives rejected

- **Keep `elsa-tree/4`, as #102 did.** #102 changed a limit inside an unchanged shape; this
  changes the key set and the schema with it. A `/4`-named file with a `label` would fail the
  schema it names in its own first line.
- **A loader that reads both `/4` and `/5`**, mapping `outcome` to its words on the way in.
  Two shapes behind one interface for good: the dataset endpoint would serve `/4` bytes while
  the pages show `/5` words, the editor would write `/5` into a `/4` file or convert at its
  first write, and every reader of the file would carry the old words table. The conversion
  happens anyway; this only postpones and scatters it.
- **A command the operator runs** (`npm run store -- convert`). A release whose first start
  serves no Tree -- every published copy fails V-FORMAT -- until someone runs it. The store is
  the data directory's only writer and opens every file at start anyway (17.3, 18.3).
- **Converting at the next write.** The published copy would stay `/4`, so the Tree would be
  unservable from the first start until a creator happened to edit it.
- **Keeping the `/4` bytes beside the new ones** (`draft.v4.json`). A second copy that nothing
  reads and every backup carries; the deployer's backup before the upgrade is the copy.
- **A fifth outcome, or an open set with `label` as its words.** It answers the owner's
  request with a category the owner did not ask for (`ADR-171-ending-text.md`).

## Consequences

- The readers of the format number move with it (#179): the loader's schema import and its
  `Manifest['format']`, `newDraft`'s `$schema` and `format`, `SCHEMA_HREF`, the schema route's
  set, the example Tree's own description (which names the format, as 12.6.2 records), and the
  tests that assert `elsa-tree/4` or `/schemas/elsa-tree-4.json`.
- #179's count is reconciled in advance: of the 108 Terminals, the procedure labels **101**;
  the 2 + 2 behind a byte-order mark and a duplicate key and the 2 of `invalid/v-format` are
  labelled by hand (107); the 1 `maybe` stays the fixture's defect. After #179 no file in
  `trees/` or `tests/fixtures/` says `outcome` except `invalid/v-terminal`.
- A deployment upgraded to the release converts itself at its first start, and its sitemap's
  `lastmod` for each Tree moves to that moment, which is true: the file changed.
