# ADR-4-image-reference: images live in the Tree's own `images/` folder and are referenced by bare file name

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #4 -- Architecture: freeze the Tree file format and schema
- Spec: `docs/specs/tree-format.md`, sections 3.5, 5.2; rule V-IMAGE

## Context

The owner downloads images and places them in a dedicated images folder in the
repository by hand; each carries a credit; images are served from the server and loaded
only for the Node on screen (core document 6, 9). An Image has a per-language
description, a required credit and an optional pointer to a Source. A thousand images
is a plausible size. The app runs on a plain Linux server while authoring happens on
Windows.

## Decision

- Each Tree has its own flat folder `trees/<tree-id>/images/`. This is the "dedicated
  images folder": one per Tree, so a Tree remains a self-contained folder.
- A Node or Option refers to an image with `file: <name>` where `<name>` matches
  `^[a-z0-9]+([._-][a-z0-9]+)*\.(png|jpg|jpeg|gif|webp|svg)$`: lowercase, no path
  separators, no `..`. The loader resolves it only inside that Tree's `images/`.
- Every Image has `description` (localised, plain), `credit` (required, non-empty,
  not localised) and optionally `source`, the id of a Source declared on the same Node.
- The validator checks that the file exists; an unreferenced file is not an error.

## Alternatives rejected

- **One global `images/` folder for all Trees.** Names collide between Trees authored
  by different labs (`map.png`), and a Tree is no longer a folder you can copy in.
  The owner's wording ("a dedicated images folder") is satisfied by one folder per
  Tree.
- **Images next to their Node (`nodes/start/eu-map.png`).** Ties an image to one Node
  although the same picture (a product category, a flag) is reused across Options and
  Nodes; and it turns `nodes/` into a folder tree that is harder to scan.
- **Arbitrary relative paths (`file: ../shared/map.png`).** Path traversal risk in a
  public web app and a portability problem; a bare name that is validated against a
  regular expression cannot escape the folder.
- **External image URLs.** Nothing external is fetched or embedded (core document 7);
  a credit attached to a URL that later changes is worthless; and lazy loading from a
  third-party host would leak the visitor's address, contradicting "nothing about the
  user is transmitted".
- **Case-insensitive matching of file names.** Would hide, on Windows, a mismatch that
  fails on the Linux server. Lowercase-only makes the two behave the same.
- **Source pointer by list index (`source: 0`).** Breaks silently when a Source is
  inserted above it. A named id on the Source is stable and readable.

## Consequences

- Rendering Node `x` requests only the files named in `x.yaml`; there is no way to
  reference another Node's images, so "only the current Node's images" holds by
  construction.
- Authors keep credits with the Image, in the same file as the text that shows it.
- A validator needs directory access to `images/`, which it has during the one-off
  whole-Tree validation.
