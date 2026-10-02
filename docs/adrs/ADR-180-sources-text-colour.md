# ADR-180-sources-text-colour: under their heading the Sources are drawn in the Theme's `text` colour -- label, kind and separator -- and a link is told by an underline in that colour

- Status: ACCEPTED -- 2026-10-02
- Issue: #180 -- Theme panel: colours that leave the editor's own bars alone, the text colour
  on the Sources, font and licence dropdowns, information hints
- Owner's request: #169 (2026-10-02)
- Spec: `docs/specs/application.md` 13.1 and 33.8, amended 2026-10-02; `docs/specs/tree-format.md`
  4.3.3, a note on `text-muted`
- Supersedes in part: `ADR-78-sources-heading.md` decision 2, in one word: `Case law` and
  `Literature` stay as prefixes, no longer "muted". Its decisions 1, 3 and 4 stand, and so does
  `ADR-173-sources-heading.md`: the heading is chrome in `text-muted`.

## Context

The owner (#169):

> "Make sure the textcolor also applies to the sources text (otherwise we risk poor
> visibility)."

On a Node the Sources were a muted heading over lines whose kind prefix and separator were in
`text-muted` and whose link carried an underline mixed at 18 % of the text colour, so faint it
hardly marked a link (`.sources` in `src/app/[lang]/globals.css`). A creator who chose a text
colour for a dark or a coloured Bubble and left the secondary text as it was got Sources that
did not read on the Bubble.

## Decision

1. **Under the heading every part of the Sources is drawn in `text`**: each label, the `Case
   law` and `Literature` prefixes, and the dot between two lines -- inline in the Bubble and
   in the collapsed Sources Sheet (10.5 step 6) alike, on the public page and in the editor.
   The heading stays chrome in `text-muted` (ADR-78 decision 1, ADR-173).
2. **A link is told by its underline, in the same colour** (`currentColor`), not by a second
   colour the creator did not choose; the collapsed Sheet's Source links are underlined too.
   Pointed at, the underline takes the reading shade of `accent-secondary`, as before.
3. **The contrast warning needs no new pairing**: the lines are `text` on `surface`, the
   Bubble's and the Sheet's panel's fill, which the panel already checks at 4.5 : 1 (33.8,
   `src/contrast.ts`). `tests/first-tree/contrast.spec.ts` measures the lines, inline and
   collapsed.

## Alternatives rejected

- **Only the labels in `text`, the prefixes and the dot still muted.** A creator who changes
  `text` for a coloured Bubble and leaves the secondary text would still get prefixes that
  do not read, which is the risk the owner named.
- **Links in `accent-secondary`.** A second colour the creator chose for buttons, which may
  not read as text on the Bubble; the underline marks a link in any palette.

## Consequences

- `tree-format.md` 4.3.3's `text-muted` row named "Source labels" among its uses; it now reads
  as the Sources' heading only (a dated note there).
- `tests/browser/theme-panel.spec.ts` holds the editor's Sources to the palette's `text` after
  a palette change, labels, prefixes and dots alike; a dark Tree's public Sources are its
  `text`, underlined in it.
