# ADR-37-single-file-layout: a Tree is one file, `tree.yaml`, holding the manifest and every Node, beside an `images/` and a `theme/` folder; the loader reads it once and holds it in memory

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #37 -- Architecture: freeze elsa-tree/2
- Spec: `docs/specs/tree-format.md`, sections 1, 2, 4.1, 5, 6
- Supersedes: `docs/adrs/ADR-4-file-layout.md` (one file per Node)

## Context

Version 0.1 froze one YAML file per Node so that rendering a Node meant reading one
small file (`ADR-4-file-layout.md`). The owner edited the first Tree, sixty-one files,
and rejected the layout in issue #35: "the datastructure must be loadable from a single
file, this .yaml way not easy to work with or navigate for a human working with this."
The core document now says (3.1, revised 2026-09-09): all text and structure of a Tree
live in one file; image files and theme assets stay separate files in the Tree's
folder. The owner's alternative, an in-view editor, is out of scope (section 4).

Three things must survive the change: ids and URLs (the URL scheme is excluded from the
rework by the owner), the `images/` folder contract (`ADR-4-image-reference.md`, kept
by #35), and the lazy-loading guarantee of core document section 9: the browser never
receives the whole Tree or all images. The core document also, since #35, lets the
frontend pre-render a bounded set of neighbouring Nodes (3.1), which issue #38 defines.

## Decision

1. A Tree is the folder `trees/<tree-id>/` holding:
   - `tree.yaml` -- **the whole Tree**: the manifest first, then one YAML document per
     Node, in one YAML 1.2 stream (the serialisation is `ADR-37-serialisation.md`);
   - `images/` -- the Tree's image files, flat, unchanged from `elsa-tree/1`;
   - `theme/` -- the Theme's logo, icon and font files, flat (`ADR-37-theme-block.md`).
   Both folders are optional; anything else in the Tree folder is ignored.
2. **A Node is addressed by its `id` key**, which every Node document must carry and
   which is unique in the Tree. The id grammar of `elsa-tree/1` is unchanged, so the
   URL of every Node and every shared link is unchanged by conversion. The Tree id is
   still the folder name; the manifest has no `id`.
3. **The loader reads `tree.yaml` once, at server start or build time, validates it
   whole, and keeps every parsed Node in memory**, indexed by id. Rendering Node `x`
   is a lookup; no file is read per request. **A page still receives one Node, never
   the Tree**: the loader's interface stays "validate; give me the manifest; give me
   Node `x`; give me the title of `x`; resolve an image name; resolve a theme file
   name". Nothing about what the browser receives changes: the HTML of one Node and the
   files it names. Which neighbours may additionally be pre-rendered is #38's contract.

## Alternatives rejected

- **Keep one file per Node and generate a single-file view for editing.** The owner's
  complaint is about editing and navigating; a generated view that is not the source
  does not fix it, and a round-trip editor is the in-view editor by another name
  (rejected in `ADR-35-version-0-2-rework.md`).
- **One file per Tree, but split by language (`tree.en.yaml`, `tree.nl.yaml`).** Two
  files to keep in step, a structure that would have to be duplicated or factored into
  a third file, and a contradiction of the core document's rule that all languages
  live inside the Node. The owner sees both languages side by side in one file; that is
  the point of localised text as a mapping (`ADR-4-localised-text.md`).
- **A single `assets/` folder for images and theme files.** Would change the `images/`
  contract the owner kept, and mix two file-name grammars (fonts are `.woff2`; images
  never are) and two serving policies (an image is content shown per Node; a font is
  chrome loaded once) in one folder. Two flat folders with one grammar each cost
  nothing and keep `ADR-4-image-reference.md` exact.
- **The logo in `images/`.** It is an image, but it is not an Image: it has no
  description, no credit, no Node. Serving it through the image route would blur the
  property that `/images/<file>` serves only what a Node names.
- **Index the file by byte offsets and re-read the Node's document per request**, to
  keep "one request reads one small file". A YAML stream cannot be split without
  parsing it, so the offsets come from the parse the validator already did; storing
  offsets instead of parsed Nodes saves memory that does not matter (the first Tree is
  under 250 kB; a thousand-Node Tree would be a few megabytes on a server) and costs a
  parse per request. The core document's lazy-loading rule is about what the *browser*
  receives, not about the server's memory, and it is met identically.
- **Load the Tree lazily on the first request instead of at start.** Rejected in
  `ADR-4-validity-rules.md` and `ADR-5-lazy-loading.md` for the same reason today: a
  broken Tree must fail the start, not the first visitor.

## Consequences

- The migration from `elsa-tree/1` is a concatenation (`ADR-37-migration.md`); no
  reference, id or image changes.
- The loader is a deep module with the same six-member interface in words; the file
  system disappears behind it entirely after start. Its tests are section 7's rules
  through `openTree` on fixture folders, as before.
- `docs/specs/application.md` section 5's promise that "a request reads one Node file"
  becomes "a request reads no file"; #38 rewrites that section, and
  `ADR-5-lazy-loading.md` is superseded there, not here.
- A Node's YAML error is reported for that Node's document with a line number (3.7),
  so one mistake still breaks one Node's worth of text, not the whole file's meaning.
- `ADR-4-file-layout.md` is superseded; its "Alternatives rejected" paragraph on one
  file per Tree recorded the trade the owner has now made the other way, with their
  reasons.
