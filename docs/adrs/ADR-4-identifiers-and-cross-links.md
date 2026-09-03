# ADR-4-identifiers-and-cross-links: kebab-case ids taken from file names; colon reserved

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #4 -- Architecture: freeze the Tree file format and schema
- Spec: `docs/specs/tree-format.md`, sections 3.1, 3.2, 10; rule V-CROSS

## Context

Every Node has an id; a Link holds the id of its target; a future Cross-link holds
`tree-id:node-id` (core document 3.1). Every Node is reachable by URL, and a shared
link carries the Trail -- the ordered list of visited Nodes -- inside the link itself
(core document 3.2). Cross-links are designed for, not built (core document 4).

## Decision

- An **id** matches `^[a-z0-9]+(-[a-z0-9]+)*$`, at most 64 characters. Tree ids and
  Node ids share the grammar. Source ids (handles for Image pointers) use it too.
- The **file name is the id**: `trees/<tree-id>/` and `nodes/<node-id>.yaml`. There
  is no `id` field inside a file.
- A **Node reference** in `elsa-tree/1` is a bare Node id in the same Tree. The colon
  is excluded from the id alphabet so that `tree-id:node-id` is unambiguous later; a
  reference containing a colon is rejected now (V-CROSS), so that adding Cross-links in
  a later format cannot change the meaning of any file that is valid today.

## Alternatives rejected

- **An `id` field inside each file, checked against the file name.** Two sources of
  truth that can disagree; the check exists only to catch the disagreement the
  duplication created. The file name alone is what the loader, the URL and the Trail
  use.
- **Free-form ids (any string, spaces allowed).** Would need escaping in URLs and in
  the Trail parameter, and case-insensitive file systems on Windows would make
  `Start` and `start` collide while Linux keeps them apart.
- **Numeric or generated ids (UUIDs, running numbers).** Meaningless in a text
  editor and in a shared URL; a running number cannot be assigned without
  coordination between authors.
- **Accepting `tree-id:node-id` references now, resolving only same-Tree ones.**
  Would let files claim a capability the frontend does not have, and the failure
  would appear at click time instead of validation time.

## Consequences

- URLs and Trail parameters are readable (`/node/prohibited-practices`).
- Renaming a Node is a file rename plus a search for its id; the validator reports
  every reference that was missed.
- Cross-links can be added as `elsa-tree/2` by relaxing V-CROSS and defining
  resolution, with no change to existing files.
