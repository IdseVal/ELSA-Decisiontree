# ADR-118-json-serialisation: the one Tree file is JSON -- one `tree.json`, `nodes` an array in the author's order, written by tools

- Status: ACCEPTED (frozen) -- 2026-09-21
- Issue: #118 -- Architecture: freeze the JSON-only Tree format (`elsa-tree/4`)
- Spec: `docs/specs/tree-format.md` (`elsa-tree/4`), sections 1, 2, 3.7, 4, 5, 8, 12.6
- Supersedes: `docs/adrs/ADR-37-serialisation.md` (the YAML stream) and, with it, the
  YAML half of `docs/adrs/ADR-4-serialisation-format.md`. Everything those two decided
  that is not about YAML -- the single file per Tree, the `id` key as the one source of
  the Node's id, the free order of Nodes, the Markdown subset for rich text -- carries
  over unchanged.

## Context

`elsa-tree/1` to `/3` chose YAML for one stated reason, written into open item 10.21 of
the core document: **hand-editability of one large multilingual file**. The owner authors
Tree content by hand in a text editor, so comments, unquoted strings and block scalars
were worth their traps.

On 2026-09-21 the owner removed that criterion. The round after this one edits Trees
**through the frontend**, so no person works inside the file again. The core document's
item 10.21 is superseded and 3.1 is amended: one format, written by tools and read by
tools, serves the editor, the validator, the loader, the app and the public download.
Two consequences fall out at once and are why the change is worth a format number rather
than a conversion script alone:

- The dataset endpoint (`ADR-118-dataset-endpoint.md`) serves the file itself. A dataset
  a third party fetches wants the format every language's standard library parses, and a
  published JSON Schema, which YAML has no equivalent of in common tooling.
- An editor writes the file back on every save. What matters then is not that a human can
  read the syntax but that two saves of the same Tree produce the same bytes, so a diff
  shows what the editor changed and nothing else.

The content model does not change. Every field, every kind of Node, every limit of 5.7,
the localised-text rule, the Theme and the Markdown subset are `elsa-tree/3`'s. Only the
serialisation moves, which is why `elsa-tree/4` is a conversion and not a rewrite.

## Decision

1. **One `tree.json` per Tree folder**, replacing `tree.yaml`. `images/` and `theme/`
   are untouched. The folder name is still the Tree's id.
2. **One JSON object.** `format`, the manifest fields (`languages`, `root`, `title`,
   `description`, `metadata`, `theme`) and `nodes` sit at the top level; there is no
   `manifest` wrapper. The manifest was "the first document" only because a stream needs
   a first document; in one object the manifest fields simply are the object's fields,
   and `nodes` is the one that holds Nodes.
3. **`nodes` is an ARRAY, in the author's order, each element carrying its own `id`.**
   Not an object keyed by id. The array keeps the four properties the stream had and the
   mapping loses:
   - **Order survives.** The stream's order was the Tree's reading order (root first,
     then the walk) and the file's table of contents. It is also what the sitemap, the
     editor's outline and `llms.txt` walk. An object's key order is preserved by most
     parsers but is not a promise any of them makes.
   - **A duplicate id is a rule, not a silent merge.** Two `id: start` elements fail
     V-NODE with both places named. Two `"start"` keys in one object are "last wins" in
     every mainstream parser, silently, and the author loses a Node without a message.
   - **The id stays one thing in one place.** `id` is the Node's id, as in
     `elsa-tree/3`; it is not also a key that a rename must be kept in step with.
   - **A Node is searchable by the same string it is referenced by.** `"id": "start"`
     next to `"target": "start"`.
4. **`$schema` is required and is written first.** Its value is the origin-relative path
   `/schemas/elsa-tree-4.json` for the Trees in this repository, or an absolute `http(s)`
   URL whose path ends the same way for a Tree a third party publishes elsewhere
   (`ADR-118-json-schema.md`). The loader never fetches it; it is what makes the file
   self-describing to a tool that has never heard of this project.
5. **Rich text is a JSON string with `\n` for its line breaks.** No block scalars, no
   array-of-lines, no `<br>`. The Markdown subset of 3.4, the explainer marks and the
   counted-text rule of 3.8 are unchanged, and a line break still counts as one
   character. The conversion drops the single trailing line break a YAML block scalar
   carried, which 3.8 step 1 already stripped before measuring, so no text changes
   length.
6. **An absent optional field is omitted.** `null` appears nowhere in the file (V-NULL)
   and an empty list or an empty object is never written (V-EMPTY): "no Sources" is the
   absence of `sources`, one way and not three. The loader's normalisation -- absent
   lists become empty arrays in memory (`application.md` 5.1) -- is unchanged, and is
   exactly where the three ways would otherwise have to be made one.
7. **The canonical byte form is `JSON.stringify(value, null, 2)` followed by one line
   feed**, UTF-8 without a byte-order mark, `\n` line endings, no trailing whitespace,
   non-ASCII characters written as themselves. Every mainstream language's standard
   library produces exactly these bytes from the same value; nothing here needs a
   bespoke pretty-printer, and the editor round needs no new agreement about formatting.
8. **Key order is fixed by the spec, not alphabetical**: the order sections 4 and 5 list
   the keys in (`$schema`, `format`, `languages`, `root`, `title`, `description`,
   `metadata`, `theme`, `nodes`; and per Node `id`, `title`, `description`, `metadata`,
   `sources`, `images`, `answers`, `options`, `explainers`, `terminal`). Inside
   `metadata`, `version` comes first and the author's own keys keep the order they were
   written in. Alphabetical order would put `answers` above `title`, which no reader and
   no reviewer wants.

   **One key shape has to be excluded for this to hold.** A JavaScript object treats a
   key made only of digits as an array index and enumerates it before every string key,
   so `{"version": "1.0", "2024": "note", "author": "x"}` comes back out of
   `JSON.stringify` with `2024` first. `metadata` is exactly where the format tells an
   author to put what used to be a comment, and a year is exactly the note they would
   write. The schema therefore refuses an all-digit key inside `metadata`
   (`propertyNames`), and 3.7 and V-META say so. The alternative -- specifying the order
   as whatever `JSON.stringify` happens to produce -- would put an implementation detail
   of one language in the middle of a format contract, and would still leave `version`
   not first. This is the only rule this format puts on the name of a key in the
   free-form bag, and it is here to keep idempotence true rather than nearly true.
9. **There are no comments, and `metadata` is where a note goes.** JSON has no comment
   syntax and none is invented. The `--- # <id>` table of contents and the author's
   comments of `elsa-tree/3` do not survive the conversion; that is the price of the
   owner's decision, stated here so that nobody looks for them later.
10. **The `yes`/`no` trap is gone.** In JSON those keys are strings by construction, so
    3.7's warning about YAML 1.1 parsers has nothing left to warn about.

## Alternatives rejected

- **`nodes` as an object keyed by id.** The shape most JSON APIs would pick, and the one
  that makes `tree.nodes[id]` a lookup. Rejected for the four reasons in decision 3; the
  decisive one is the silent duplicate. `ADR-37-serialisation.md` rejected the same shape
  in YAML for the same reason, and nothing about JSON makes it safer.
- **Keeping YAML and adding a JSON projection for the dataset endpoint.** Two
  serialisations of one contract, one of them generated: the round after this one writes
  the file back from an editor, and then the generated form is the one people fetch while
  the authored form is the one that validates. Two files that must agree, and a migration
  every time they do not.
- **JSON with a line-oriented or JSON Lines layout** (one Node per line, so a diff is one
  line per Node). Diffs are worse, not better: any edit rewrites a whole Node's line, and
  nothing reads it without a custom splitter. `JSON.stringify(x, null, 2)` already gives
  a diff at the granularity of a field.
- **JSON5 or JSONC, to keep comments.** Keeps the one thing the owner no longer needs and
  loses the one thing this round is for: a file every standard library parses and a
  schema every validator checks. A dataset nobody can `json.load` is not a dataset.
- **Splitting the Tree back into a file per Node, now that no human navigates it.** The
  owner rejected the file-per-Node layout in #35 for editing reasons, but the reason it
  stays rejected here is different and stronger: the dataset endpoint serves one file,
  and one file is what a download, a checksum and a `DataDownload` entry can be.
- **Writing the limits of 5.7 into the byte form** (for instance, a maximum line length).
  The limits are on counted text (3.8), not on the file's lines; a line rule would be a
  second, different rule wearing the same numbers.

## Consequences

- The conversion from `elsa-tree/3` is **not textual**, unlike `/1` to `/2` and `/2` to
  `/3`: the shapes differ, so the file is parsed and re-serialised. It is therefore a
  one-time job, done while a YAML parser is still in the repository, and the `yaml`
  dependency leaves with it (`tree-format.md` 12.6; issue #119).
- What the conversion guarantees is stated in 12.6 and is narrower than its predecessors'
  guarantee: every text, id, reference, file name, URL, colour and metadata value is the
  same; comments and formatting are not.
- A Tree still written in `elsa-tree/1` or `/2` migrates through `/3` first, with the last
  release that read YAML. No Tree in the wild is in that state today; both Trees here and
  every fixture are `elsa-tree/3`.
- The byte form must have exactly one writer in the code -- the function the migration
  and, later, the editor both call -- or idempotence is a coincidence. Issue #119 puts it
  behind the loader module's seam; the testable statement is that running the writer on
  its own output changes no byte.
- `application.md` 5.1's `Manifest['format']` becomes `'elsa-tree/4'` and the loader reads
  `tree.json`; issue #119 makes that edit with the code, so that the spec and the code
  move in one commit.
