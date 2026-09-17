# Notes on the example Tree

`tree.yaml` is section 8 of `docs/specs/tree-format.md` verbatim: the complete example
Tree of the `elsa-tree/2` contract, in English and Dutch. It is the development default
and the Tree the loader tests load, so it is kept identical to the spec -- change the
spec first, then this file. Its legal content is simplified and not to be relied on.

It was written rather than converted from its `elsa-tree/1` folder, as
`docs/specs/tree-format.md` 12.3 asks (#39): its old Nodes exceeded the new length
limits, and section 8 is the rewritten content.

## The Theme, and why it looks nothing like the first Tree's

Issue #40 gave this Tree a look of its own. It used to carry the ELSA lab's mark and the
colours issue #36 measured on ai4sfs.org, which meant the two Trees in this repository
looked almost the same and the interoperability requirement was a claim rather than
something anyone could see. The first Tree now carries that identity and this one carries
none: a mark drawn for this repository, a dark palette, and no `body` font family, so its
running text is whatever type stack the reader's machine offers.

Three things follow, and each of them is a path nothing else in the repository exercises:

- **`logo.dark`.** `background` is dark, so the frontend derives that the white variant is
  the one to show (`docs/specs/application.md` 13.1). No other servable Tree does.
- **A `fonts` part with one role.** `tree-format.md` 4.3.2 says a Tree that gives only
  `heading` has its running text in the frontend's default family; this is that sentence,
  loaded and served.
- **A palette that is not a light one**, so the three derived `--elsa-on-*` colours resolve
  the other way round from the first Tree's.

| File | What it is |
|---|---|
| `example-lab-logo.svg`, `example-lab-logo-white.svg` | This repository's own drawing: a walk that branches, dark for a light background and white for a dark one. No real laboratory's identity, which is the point -- see `theme/LICENCE.md`. |
| `nova-square-400.woff2` | Nova Square, latin subset, redistributed unmodified. It is the `heading` family. |
| `ofl-nova-square.txt` | The SIL Open Font License 1.1 text the family is redistributed under. The Theme names it in its `licence` line but does not reference it as a file, so the loader ignores it and `themePath` never serves it (`docs/specs/application.md` 5.1). |
| `LICENCE.md` | The terms of every file above. Likewise unreferenced, likewise never served. |

## The images

Every Node carries at least one Image (issue #84). None is a photograph: this Tree is
kept small, and the picture only has to show where a Node's Images go.

| File | On | What it is | Author | Licence |
|---|---|---|---|---|
| `eu-map.png` | `start` | A flat blue field, credited as a map | Example Cartography (fictitious) | CC BY 4.0 |
| `scoreboard.png` | `social-scoring` | A flat red field, credited as a scoreboard | Example Studio (fictitious) | CC0 1.0 |
| `outside-scope.png` | `outside-scope` | Labelled placeholder, "outside the scope" | drawn for this repository by issue #84 | CC0 1.0 |
| `prohibited-practices.png` | `prohibited-practices` | Labelled placeholder, "prohibited practices" | drawn for this repository by issue #84 | CC0 1.0 |
| `emotion-recognition.png` | `emotion-recognition-at-work` | Labelled placeholder, "emotion recognition" | drawn for this repository by issue #84 | CC0 1.0 |
| `prohibited.png` | `prohibited` | Labelled placeholder, "prohibited" | drawn for this repository by issue #84 | CC0 1.0 |
| `covered.png` | `covered` | Labelled placeholder, "the AI Act applies" | drawn for this repository by issue #84 | CC0 1.0 |

The five placeholders were drawn with Pillow's bundled default font, 960 by 640 pixels, 16
colours, under 6 KB each; none was fetched from anywhere, and there is no source URL.

### To replace

All five placeholders above: `outside-scope.png`, `prohibited-practices.png`,
`emotion-recognition.png`, `prohibited.png` and `covered.png`. A replacement keeps the
Tree identical to `docs/specs/tree-format.md` section 8 only if the spec's copy changes
with it.
