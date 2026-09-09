# ADR-37-step-counter: a step counter such as "(1/7)" is authored text at the end of the title, not a field

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #37 -- Architecture: freeze elsa-tree/2
- Spec: `docs/specs/tree-format.md`, section 5.8

## Context

Long Nodes become several steps. The owner's worked example (issue #35; core document
3.3, item 1): "Title: Jurisdictional scope of the AI Act? (1/7) Content: We first have
to assess whether the AI Act applies to where you are located: ...". Issue #37 asks
whether the counter is authored in the title or is a field of its own, with the reason
recorded. Core document open item 10.21 names it.

## Decision

The counter is **written in the title**, at the end, as `(n/m)`, in every language,
and counts toward the title's 80 characters. The format has no `step` field, and the
validator does not check that a series is complete or consistent. The frontend *may*
recognise a trailing `(n/m)` to style it as muted text; nothing depends on it.

## Alternatives rejected

- **A field on the Node: `step: { index: 1, of: 7 }` (or `series: jurisdiction`,
  `step: 1`, `of: 7`).** The frontend could then render the counter consistently, keep
  it out of the Branch label, and the validator could check that `1/7` to `7/7` all
  exist and agree on `7`. Rejected because every one of those benefits needs machinery
  the owner did not ask for: a series id to group the Nodes, a consistency rule across
  Nodes (adding an eighth step means editing seven `of` values or the validator
  complaining), a chrome rendering convention, and a widening of the Node interface for
  a display nicety. The title is shown in the Bubble and on the Branches above (the
  Trail) and out; a counter in it is visible in every one of those places for free, and
  it is translation-neutral (digits).
- **Nothing: no counter at all.** The owner wrote the counter in their example; a
  reader walking seven yes/no steps in a row wants to know how many are left.
- **The counter in the description's first line.** Hidden from the Branch labels and
  the Trail, where a reader looks for "where am I".

## Consequences

- Cutting a Node into steps (#44) is a content operation with no format support and no
  format constraint beyond the title length: "Jurisdictional scope of the AI Act? (1/7)"
  is 41 characters.
- Renumbering after an added step is a text edit on each title; the validator does not
  catch a missed one, and the owner's review of the walk does.
- If a later frontend wants the counter as data, adding an optional field is a format
  bump that leaves every existing title valid.
