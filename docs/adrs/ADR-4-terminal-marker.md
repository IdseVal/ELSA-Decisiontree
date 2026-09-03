# ADR-4-terminal-marker: an explicit `terminal.outcome` from a closed set; Node kind is derived

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #4 -- Architecture: freeze the Tree file format and schema
- Spec: `docs/specs/tree-format.md`, sections 5.5, 5.6; rules V-KIND, V-TERMINAL

## Context

A Node that ends the walk must be marked explicitly, with an outcome the frontend can
style; "no outgoing Links" is not sufficient because explanation-only child Nodes also
have no Answers and are not the end (core document 3.1, 10.10). The marker and outcome
values are the Architect's to freeze. The frontend must render any third-party Tree
without code changes, so whatever it styles must be finite and known in advance.

## Decision

- A Terminal carries `terminal: { outcome: <value> }`. `outcome` is one of exactly
  four values: `not-applicable`, `applicable`, `prohibited`, `refer`. The set is closed;
  a fifth value needs a new format number.
- The Node's `title` and `description` carry the human-readable message; `outcome` is
  a styling and semantics category only.
- A Node's **kind is derived** from its content: `answers` present means question Node;
  `terminal` present means Terminal; neither means explanation Node. Both present is an
  error. Reachability rules follow from kind: Answers lead to question Nodes or
  Terminals; Options lead to explanation Nodes; explanation Nodes are reached only by
  Options.

## Alternatives rejected

- **Absence of Links as the marker.** Rejected by the core document: indistinguishable
  from an explanation Node.
- **`terminal: true` without an outcome.** Gives the frontend nothing to style; every
  end of the walk would look the same whether it says "does not apply" or "prohibited".
- **Free-text outcome (`outcome: high-risk-annex-iii`).** The frontend cannot style a
  value it has never seen without a code change, which is exactly what interoperability
  forbids; a third-party Tree would render with a fallback style and the author would
  not know why. A closed set makes the styling table complete by construction.
- **An outcome set tied to the AI Act (`high-risk`, `gpai`, `transparency`).** Would
  not fit an ethics or healthcare Tree. The four values describe *how the walk ends*
  (not applicable / applicable / forbidden / elsewhere), which any regulatory or
  ethical Tree can map onto.
- **An explicit `kind:` field on every Node.** Redundant with the presence of
  `answers`/`terminal`; when the two disagree the validator has to pick one, and an
  author has to remember to change both. Deriving the kind leaves one source of truth.

## Consequences

- The frontend ships a styling table with four rows and never needs another.
- A Terminal cannot have Options; a Tree that wants to explain the outcome in depth
  writes it in the description or links Sources.
- Extending the set is a visible, versioned contract change, not a silent drift.
