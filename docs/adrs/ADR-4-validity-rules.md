# ADR-4-validity-rules: strict validation, whole-Tree rejection, every violation reported

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #4 -- Architecture: freeze the Tree file format and schema
- Spec: `docs/specs/tree-format.md`, section 7 (the rules themselves)

## Context

The frontend must never break when loaded with a third-party Tree that follows the
agreed shape (core document 9). Content is hand-written, so mistakes are certain:
misspelt targets, a forgotten translation, a missing credit. The loader must reject a
broken Tree with a clear message (issue #4, task 5). Validation reads every file; the
app must not load the whole Tree for a visitor (core document 3.1).

## Decision

- The spec lists every rule with an id (`V-...`). A loader enforces all of them.
- **All or nothing.** One failing rule rejects the whole Tree; there is no partial
  load, no "skip the broken Node".
- **Report everything.** The loader collects every violation and reports each with
  Tree id, file path, key path, rule id and a plain-language message, so an author
  fixes a Tree in one round rather than one error per run.
- **Strict by default**: unknown keys, extra languages, unreachable Nodes, references
  with a colon, raw HTML and unquoted version numbers are errors, not warnings. The
  only free-form area is `metadata`.
- **When**: validation is the one whole-Tree read and happens server-side once, at
  build time or server start, whichever the implementation chooses; serving a Node
  afterwards reads one file. Which of the two moments is used is left to the loader
  issue; both satisfy the core document.
- Deliberately *not* errors: unreferenced image files, Nodes reached by several
  Links, cycles among question Nodes.

## Alternatives rejected

- **Lenient loading (warn and continue, render what parses).** The frontend would then
  have to cope with half-Nodes: a missing language, an Answer to nowhere. That is the
  "frontend breaks on a third-party Tree" failure moved to click time and spread over
  every component. Rejecting at validation concentrates it in one place.
- **Stop at the first error.** Cheaper to implement, but a Tree with forty missing
  Dutch strings would take forty runs to fix.
- **Warnings for unknown keys.** A misspelt `anwsers:` would silently turn a question
  Node into an explanation Node, which then fails a *different* rule (V-ORPHAN) with a
  message that points away from the real cause. Rejecting the key names the cause.
- **Allowing unreachable Nodes (drafts in place).** Nearly every unreachable Node in
  practice is a misspelt target. Drafts have a home outside `nodes/`, which the loader
  ignores.
- **Forbidding cycles.** The core document calls the structure graph-shaped and the
  Trail is the way back; a loop between question Nodes may be odd but is not broken.
- **Validating lazily per Node at request time.** Would let a Tree deploy with errors
  that surface only when a visitor reaches the broken Node, and cannot check
  whole-Tree properties like reachability.

## Consequences

- A loader's interface is narrow: validate a folder (returning all violations), read
  the manifest, read one Node. The rules are the test surface for the loader issue.
- Authors can run the validator locally before pushing; CI can run it on every PR
  that touches `trees/`.
- Adding a rule is a contract change and goes through a new format number, so a Tree
  that validates today keeps validating.
