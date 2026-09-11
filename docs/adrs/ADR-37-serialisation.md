# ADR-37-serialisation: the one Tree file is a YAML 1.2 stream, one document per Node with `id` first, separated by `--- # <id>` lines

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #37 -- Architecture: freeze elsa-tree/2
- Spec: `docs/specs/tree-format.md`, sections 3.7, 4, 5, 8
- Amends: `docs/adrs/ADR-4-serialisation-format.md` (YAML kept; the file-per-Node
  consequence ends) and `docs/adrs/ADR-4-identifiers-and-cross-links.md` (the id is
  now an `id` key, not a file name)

## Context

The core document (3.1, revised 2026-09-09; open item 10.21) leaves the serialisation
of the single Tree file to the Architect, with **hand-editability of one large
multilingual file** as the deciding criterion. The first Tree is 61 Nodes; converted
as it stands it is about 4,600 lines in two languages, and after the content re-cut of
#44 it will be more Nodes of less text each, in the same order of size. The owner
edits it in a text editor. Third-party labs will write their own with whatever tools
they have. The same three needs as in `ADR-4-serialisation-format.md` still hold:
multi-paragraph prose in several languages inside one Node, comments, and structural
mistakes that fail loudly.

What makes a several-thousand-line file editable by hand is not the syntax family; it
is (a) that a mistake in one place is reported for that place and does not poison the
rest, (b) that one can jump to a Node and see it whole, and (c) that the text of a Node
is not buried under indentation.

## Decision

1. **YAML 1.2 is kept.** The reasons of `ADR-4-serialisation-format.md` -- comments,
   unquoted strings, readable multi-paragraph block scalars with a Markdown subset,
   known traps fenced off by rules -- hold for one file as they did for sixty; and the
   owner's complaint was about the number of files, not about YAML.
2. **The file is a YAML stream, not one YAML document.** The manifest is the first
   document; every Node is its own document, separated by a `---` line. This is what
   answers the three needs above:
   - a YAML error is reported per document, with its line number, and the other
     documents are still parsed and checked (V-YAML);
   - each Node is a top-level mapping at column 0, exactly the shape a Node file had in
     `elsa-tree/1`, so a description line sits at four spaces, not at twelve;
   - each Node starts at a visible separator.
3. **The Node's id is the `id` key of its document**, written first by convention and
   repeated as a comment on the separator: `--- # social-scoring`. A search for the id
   finds the Node; a search for `^--- #` lists every Node in order, a table of contents
   the file carries itself. The order of Node documents is free (the loader indexes by
   `id`); the recommendation is the root first, then the walk.
4. The YAML rules of `elsa-tree/1` (1.2 parser, quoted versions, unknown keys are
   errors, UTF-8) carry over, with two additions: quote colours (`#` starts a comment)
   and quote font weights.

## Alternatives rejected

- **One YAML document with a `nodes:` mapping keyed by id.** The obvious shape, and
  the one `ADR-4-file-layout.md` had in mind when it called a single file "a
  several-thousand-line file in which a mis-indented line breaks everything". That
  objection is real for a single document and is exactly what the stream removes: a
  mapping nests every Node two levels deeper (a description line at twelve spaces), a
  mis-indented line anywhere makes the *whole* file fail with one message, and ids as
  mapping keys cannot be searched for as `id: x`. Duplicate ids are also silently
  merged by some parsers, where a stream's duplicate `id` values are a plain rule.
- **Markdown with a front-matter block per Node (`# social-scoring` sections).** The
  most pleasant way to write *one* body of prose; but a Node holds one body per
  language, plus Sources, Options and Answers, so each section needs a YAML block for
  the structure and a custom delimiter between languages that no editor or parser
  knows. It ends up as YAML in Markdown clothing, with a bespoke parser. Rejected in
  `ADR-4-serialisation-format.md` for the same reason.
- **JSON.** No comments, every string quoted, every description one line with `\n`
  escapes; a several-thousand-line JSON file is the least hand-editable of the
  candidates. Unchanged from the 0.1 rejection.
- **TOML with `[nodes.social-scoring]` tables.** Tables are navigable and flat, which
  is attractive at this size, but every Option, Source and Image becomes an
  `[[nodes.x.options]]` array-of-tables block with its own `[nodes.x.options.title]`
  sub-table for the localised text; a Node with eight Options and three Sources is
  thirty headed blocks. Multi-line strings exist but Markdown lists inside them fight
  the indentation. Less familiar to the audience than YAML, and a second parser in the
  project.
- **A YAML document per Node in one file, but the id taken from the comment on the
  separator instead of an `id` key.** Comments are not data; a loader that reads them
  is a loader with a private syntax. The key is the id; the comment is a convenience the
  loader ignores.
- **Requiring `id` to be the first key (a validity rule).** Would need the parser's
  source order, which YAML mappings do not carry, for a benefit that a convention and
  the migration already give.

## Consequences

- The migration from the file-per-Node layout is textual concatenation plus an `id`
  line per Node (`ADR-37-migration.md`); authors' comments and formatting survive.
- `ADR-4-identifiers-and-cross-links.md`'s argument against an `id` field -- "two
  sources of truth" -- no longer applies: there is no file name to disagree with, so
  the `id` key is the only source. Everything else in that ADR (grammar, colon
  reserved, V-CROSS) stands.
- The loader uses the parser's multi-document mode (`parseAllDocuments` in the `yaml`
  package the project already uses) and reports errors per document.
- An editor that folds YAML documents, or a search for `^--- #`, is the navigation
  aid; no tooling is required.
