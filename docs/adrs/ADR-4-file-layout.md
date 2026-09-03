# ADR-4-file-layout: a Tree is a folder with one file per Node

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #4 -- Architecture: freeze the Tree file format and schema
- Spec: `docs/specs/tree-format.md`, sections 1, 2 and 6

## Context

Trees are plain files in the repository, hand-edited by the owner and by third-party
labs, with no database (core document 3.1, 10.16). Three forces pull on the layout:

1. **Hand-editability** by a non-programmer in a text editor.
2. **Size**: hundreds of Nodes and "a thousand images" are plausible.
3. **Lazy loading**: the app must never load the whole Tree or all images up front;
   a Node's children are fetched only when that Node is opened (core document 3.1, 9).

The core document leaves "one file per Tree vs one file per Node" to the Architect.

## Decision

A Tree is a folder `trees/<tree-id>/` containing:

- `tree.yaml` -- a small manifest (identity, languages, root, metadata);
- `nodes/<node-id>.yaml` -- **one file per Node**, flat, the file name being the id;
- `images/` -- the Tree's image files, flat.

The folder name is the Tree id and the file name is the Node id; neither is repeated
inside the file. The manifest does not list the Nodes: the `nodes/` folder is the
index. Files elsewhere in the folder (drafts, a README) are ignored by the loader.

## Alternatives rejected

- **One YAML/JSON file per Tree.** Editable while small; at hundreds of Nodes with
  multi-paragraph text in two or more languages it becomes a several-thousand-line
  file in which a mis-indented line breaks everything and a `git diff` is unreadable.
  Lazy loading would require the server to parse the whole file and index it on every
  start, and the client could not be given "just Node `x`" without a server-side
  extraction layer. The one benefit -- seeing the whole graph in one place -- is better
  served by a generated overview later.
- **One file per Node per language** (`start.en.md`, `start.nl.md`). Best for prose,
  but the *structure* (Answers, Options, Sources) is then either duplicated per language
  (drift) or split into a third structure file, so a Node is spread over N+1 files and
  "add a language" touches every Node folder. It also contradicts the core document's
  rule that all languages live *inside* the Node.
- **A folder per Node** (`nodes/start/node.yaml` + its images next to it). Keeps a
  Node's images with it, but the owner asked for a dedicated images folder they fill by
  hand, and hundreds of tiny folders are harder to scan in an editor than hundreds of
  files. Recorded separately in `ADR-4-image-reference.md`.
- **Nested folders mirroring the tree shape.** Graph-shaped data (shared explanation
  Nodes, future Cross-links) does not fit a hierarchy; moving a Node would change its
  path and therefore its id.

## Consequences

- Loading Node `x` is reading one small file; nothing about lazy loading needs
  indexing or extraction (spec section 6).
- Validation must walk the folder once (build time or server start); this is the one
  whole-Tree read and it is server-side.
- Renaming a Node means renaming the file *and* every reference to it; the validator
  catches the ones that were missed.
- A third-party Tree is a self-contained folder that can be copied into `trees/`.
