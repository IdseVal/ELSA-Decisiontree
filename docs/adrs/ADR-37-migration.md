# ADR-37-migration: an `elsa-tree/1` folder is converted to an `elsa-tree/2` file textually -- the manifest's format line rewritten, every Node file appended verbatim behind an `id` line -- and every limit violation is reported, none silenced

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #37 -- Architecture: freeze elsa-tree/2
- Spec: `docs/specs/tree-format.md`, section 12

## Context

Two Trees on `dev` (`trees/ai-act-example`, 7 Nodes; `trees/ai-act-applicability-agrifood`,
61 Nodes) and twenty-nine fixture Trees under `tests/fixtures/` are written in
`elsa-tree/1`. Issue #37 asks for a mechanical conversion precise enough that #39 can
script it and that everything converts without hand-editing, except where a Node
breaks a new length limit; those are #44's, and the migration must report them, not
silence them. The invalid fixtures are deliberately broken Trees that must stay broken
in the same way, so that the loader's tests keep meaning what they mean.

The single-file layout (`ADR-37-single-file-layout.md`) and the stream serialisation
(`ADR-37-serialisation.md`) were chosen so that a Node document in the new file has
exactly the shape a Node file had in the old folder.

## Decision

The conversion is **textual**. It never parses a Node file:

1. the manifest's `format: elsa-tree/1` line becomes `format: elsa-tree/2`, and
   nothing else in it changes;
2. every `nodes/<id>.yaml`, the root's file first and the rest in byte order of file
   name, is appended behind a blank line, a `--- # <id>` line and an `id: <id>` line,
   with its text unchanged;
3. `images/` and other top-level files are copied as they are; no `theme/` is created;
4. the result is validated with the `elsa-tree/2` rules and **every** violation is
   reported with Node id, key path, language, rule, actual and maximum; the converter
   shortens nothing and drops nothing. It succeeds if the only violations are the
   content rules (V-LENGTH, V-LINES, V-COUNT) and fails otherwise;
5. the old `nodes/` folder is deleted only when converting in place, and only after the
   new file has been written and parsed back.

The spec's section 12 states every step, including byte-order mark and `---` handling,
so that it can be done by hand for a small Tree and checked against the script.

## Alternatives rejected

- **Parse each Node file and re-serialise it into the stream.** The natural way to
  write a converter, and the wrong one here: a YAML round trip drops or moves comments
  (the first Tree's manifest starts with a five-line comment; the fixtures carry
  explanatory comments), rewrites quoting and line wrapping the author chose, and
  cannot carry over a file that does not parse -- the `v-yaml` fixture would have to
  be hand-made. Textual concatenation preserves all of it and is simpler to specify
  and to verify: the output is the input with three lines added per Node.
- **Order the Nodes by a walk from the root (depth first, Options before Answers)** so
  the file reads like the Tree. Needs every file parsed and every reference resolved,
  fails on the invalid fixtures, and is a one-off nicety the author can redo by hand
  since document order is free. Root first, then byte order, needs one line of the
  manifest and nothing else, and gives the same result on Windows and Linux.
- **Shorten text to the limits automatically (truncate, or drop trailing paragraphs).**
  Would silently change legal content the owner has not reviewed and hide the size of
  the content work. The issue is explicit: report, do not silence.
- **Convert only the valid Trees and hand-write the invalid fixtures.** Twenty-six fixtures
  by hand is twenty-six chances to change what a fixture tests; a verbatim conversion keeps
  each one failing the rule it was written for. The two that cannot (`v-dir`, which has
  no `nodes/` folder, and `v-format`, whose "unknown" value was `elsa-tree/2`) are named
  in the spec for #39 to re-fit.
- **A converter that also authors a Theme.** A Theme is a lab's identity and its
  licences; nothing mechanical can supply it. #40 authors the first Tree's.

## Consequences

- Run against the two Trees and the fixtures on 2026-09-10 with a throwaway
  implementation of section 12: `ai-act-example` converts to 226 lines with 6 content
  violations (its section 8 rewrite replaces it); `ai-act-applicability-agrifood` to
  4,565 lines with 327 V-LENGTH, 124 V-LINES and 3 V-COUNT violations and nothing else;
  the three interoperability fixtures convert with no violation; every `invalid/` and
  `broken/` fixture fails its own rule, except the two named above.
- Every id, reference, Source, Image and `metadata` bag survives byte for byte; no URL
  and no shared link changes.
- #39 scripts it as `npm run migrate`, commits the converted Trees and fixtures, and
  leaves the first Tree's violation report in its `NOTES.md` for #44.
