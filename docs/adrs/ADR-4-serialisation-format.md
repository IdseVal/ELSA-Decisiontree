# ADR-4-serialisation-format: YAML 1.2 files, with a Markdown subset for rich text

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #4 -- Architecture: freeze the Tree file format and schema
- Spec: `docs/specs/tree-format.md`, sections 3.4 and 3.6

## Context

The owner writes and maintains Tree content by hand in a text editor (core document
2, 3.1). Descriptions may run to several paragraphs and exist in every declared
language inside the same Node. Third parties will write their own files with whatever
tools they have. The format must be lightweight and must make structural mistakes
visible.

## Decision

Manifest and Node files are **YAML 1.2**, UTF-8, extension `.yaml`.

- Rich text (a Node's `description`) is written as a YAML literal block scalar
  (`en: |`) and may use a **small CommonMark subset**: paragraphs, emphasis, strong,
  bulleted and numbered lists, and links. Raw HTML is rejected by the validator.
- Plain text fields are single lines with no Markdown.
- Unknown keys are errors. `version` values are strings and must be quoted.
- The loader must use a YAML 1.2 parser: in 1.2, `yes` and `no` are strings, which the
  `answers` block relies on. The spec warns authors about YAML 1.1 tools.

## Alternatives rejected

- **JSON.** No comments, every string quoted, a multi-paragraph description becomes
  one line with `\n` escapes, and a trailing comma breaks the file. Fine for machines,
  hostile to the owner. Still the easiest thing to *generate* from YAML if a tool ever
  wants it.
- **Markdown with YAML front matter.** The most comfortable way to write *one* prose
  body, but a Node holds one body *per language*. Two bodies in one Markdown file need
  a custom delimiter that no editor or parser knows; one file per language breaks the
  "all languages inside the Node" rule (see `ADR-4-file-layout.md`). Its comfort is
  recovered by YAML block scalars with Markdown inside.
- **TOML.** Multi-line strings exist, but lists of tables (`[[options]]`,
  `[[options.images]]`) become verbose and easy to mis-nest; less familiar to the
  audience than YAML.
- **Full Markdown or HTML inside descriptions.** Would let authors embed images,
  headings and scripts; images must go through `images:` so credits are enforced and
  loading stays lazy, and raw HTML is a cross-site-scripting vector in a public app.
  A small subset is enough for legal explanatory prose.

## Consequences

- Authors get comments, unquoted strings and readable multi-paragraph text.
- YAML's known traps are fenced off by rules rather than trusted: quoted versions,
  YAML 1.2 only, unknown keys rejected, `yes`/`no` guarded by the parser choice.
- The frontend needs a Markdown renderer restricted to the subset, with HTML disabled.
