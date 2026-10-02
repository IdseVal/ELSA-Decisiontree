# ADR-171-font-dropdown: one dropdown per role lists the default, the library's four families, the Tree's own family and, last, "Upload a font file…"; a library family is written by one store operation; an uploaded family is named after the font file's own family name

- Status: ACCEPTED (frozen) -- 2026-10-02
- Issue: #171 -- Architecture: freeze the free-text ending of a tree (in place of the four
  fixed outcomes) and the font and licence dropdowns of the Theme panel
- Owner's request: #169 (2026-10-02)
- Spec: `docs/specs/application.md` 22.1, 22.2, 33.8, 37.2 to 37.4 (new)
- Depends on: `docs/adrs/ADR-171-font-library.md` (the families and their copy),
  `ADR-171-licence-dropdown.md` (the licence an uploaded family states)
- Amends: `ADR-132-editor-api.md` decision 3 (the manifest takes a fourth operation,
  `use-library-font`; the theme upload's answer gains `family`),
  `ADR-5-repository-layout.md` (`src/store/woff2.ts`, decision 8)

## Context

The owner (#169): "Make the font family selection a dropdown, but do give the option to add a
font by uploading a file." Today the Theme panel's fonts part shows, per role -- `body`, the
running text, then `heading` (`tree-format.md` 4.3.2) -- either the role's family with its
name, its licence line and its files, or a form that adds one: a family name typed by hand, a
licence line typed by hand, a WOFF2 file with its weight and style (`application.md` 33.8,
#144). The part is written whole (`PATCH /admin/api/trees/<t> { path: 'theme.fonts', value }`),
after its files went up through `POST /admin/api/trees/<t>/theme`.

The format already has a meaning for a role with no family: no `body` family is the reader's
own type stack (13.4), and no `heading` family is headings in the running text's family
(4.3.2). And the format's `family` is "the family name as it will be used in CSS ...
reproduced as written": it is what a reader of the dataset sees, so it should be the font's
real name.

## Decision

1. **One native `<select>` per role**, `fontBody` then `fontHeading`, in place of the
   family-name field and the add-a-font form. Its entries, in order:
   - first, the role's empty choice -- for running text `fontDefault` (no `body` family: the
     reader's own type stack, 13.4), for headings `fontSameAsBody` (no `heading` family:
     headings in the running text's family, 4.3.2), which is the format's own fallback, named;
   - an `<optgroup>` `fontLibraryGroup` with the four families of `ADR-171-font-library.md`,
     by their names, in its order;
   - an `<optgroup>` `fontOwnGroup` holding the role's family when the Tree has one that is
     not a library family -- an uploaded one, or a hand-made Theme's such as the first Tree's
     Open Sans -- by its `family`;
   - last, `fontUpload`: "Upload a font file…".
2. **Choosing a library family is one write**: the manifest operation
   `{ op: 'use-library-font', role, family: '<library id>' }` on `PATCH
   /admin/api/trees/<t>`. The store copies the family's files and licence text into the Tree's
   `theme/` (`ADR-171-font-library.md` decision 6) and writes the role's entry into
   `theme.fonts`, replacing the role's previous one, keeping `body` before `heading`, and
   creating `theme` and `fonts` when absent; then the draft is validated and answered as any
   write (22.3). An unknown family id or role is 422 (V-THEME); permission is 21.2's `edit`,
   and the copy happens only after it. Choosing the same family again writes the same bytes.
   A part is one field for 22.5, so two people choosing at once get the later choice.
3. **Choosing the role's empty choice** writes the `theme.fonts` part without that role's
   entry, or `null` when none is left, exactly as 33.8's removal does today.
4. **Choosing `fontUpload`** opens the file picker; the file goes up through `POST
   /admin/api/trees/<t>/theme` under 22.6's rules, unchanged, and **the answer gains
   `family`**: the uploaded font's own family name, read by the server from the WOFF2's
   `name` table -- the typographic family (name ID 16), else the family (name ID 1); the
   Windows Unicode records first, English (`0x0409`) before any other language, then the
   Macintosh Roman ones -- trimmed, and only when it is 1 to 64 characters with none of the
   characters 13.3 refuses in a family name (a control character, `;`, `{`, `}`, `<`).
   Otherwise `family` is absent. Under the dropdown the panel then shows what an uploaded
   family needs before it is written: the name field holding that name (empty, with its
   placeholder, when absent), the licence dropdown (`ADR-171-licence-dropdown.md`), the file's
   weight and its style as today (33.8), and `addFont`. When the family is written, the
   dropdown shows it under `fontOwnGroup`.
5. **An uploaded family's name is the font's own family name, proposed and changeable**: at
   most 64 characters (5.7), none of 13.3's refused characters (refused at the field, before
   anything is sent), and not a name the other role's family already uses for other files
   (`fontNameTaken`), because two `@font-face` sets under one name would be one family to the
   browser, which would mix their faces.
6. **What each kind shows.** A library family shows its licence, fixed, and nothing else:
   no name field and no file controls, because it is complete as shipped and changing either
   would make it something the library is not. The Tree's own family keeps today's controls:
   its name and licence editable, files added and removed, the last one removing the family.
7. **How the panel tells them apart**: a role's entry **is** library family X when its
   `family`, its `files` (each name, weight and style) and its `licence` equal what
   `use-library-font` writes for X -- the names are content hashes, so this is exact. Anything
   else is the Tree's own, and is kept as it is.
8. **The reader of the name is a pure function**, `woff2FamilyName(bytes): string | null` in
   `src/store/woff2.ts`, beside the store's other byte sniffing (22.6): it walks the WOFF2
   table directory, decompresses the table stream with Node's Brotli -- never beyond the
   header's `totalSfntSize`, and never beyond 64 MiB -- and reads the `name` table's records.
   Every malformation, in any part, answers `null`; it never throws and is never trusted
   further than a proposal for a field the creator sees.

## Alternatives rejected

- **The upload as a separate control under the dropdown.** The owner asked for the option
  inside the selection ("a dropdown, but do give the option to add a font by uploading a
  file"); the last entry is where a list keeps its "other", and one control is less to learn.
- **The creator types the uploaded family's name, as #144 built.** The file knows its own
  name; asking for it again invites a typo that the dataset then reproduces as written.
- **A generated name** (`Uploaded font 1`). `family` is reproduced in the dataset and in the
  CSS; a name that says nothing about the font is a worse answer to the same question.
- **The panel copying a library family in two requests** (the files, then the part).
  The panel would assemble a Theme entry from file names it must predict, and a failure
  between the two leaves files no entry names; one operation keeps the files and the entry
  in step where the files are written.
- **A key in the Theme saying a family came from the library.** A change to the format
  (out of this issue's scope) to record what the files already show.
- **Folding "the same family in both roles" into one entry.** The panel writes what the
  creator chose; a `heading` entry equal to the `body` one is valid and costs one
  `@font-face` set more.
- **Reading weight and style from the file too.** Not asked; the panel's weight and style
  fields stay as #144 built them, and #180 explains them with a hint.

## Consequences

- `src/chrome.ts` gains, in both languages (#180): `fontDefault` ("Default: the reader's own
  font" / "Standaard: het lettertype van de lezer"), `fontSameAsBody` ("Same as running text"
  / "Zelfde als lopende tekst"), `fontLibraryGroup` ("Fonts that come with the app" /
  "Lettertypen van de app"), `fontOwnGroup` ("This tree's own" / "Eigen aan deze boom"),
  `fontUpload` ("Upload a font file…" / "Een lettertypebestand uploaden…") and `fontNameTaken`
  ("The other role uses this name for other files." / "De andere rol gebruikt deze naam voor
  andere bestanden.").
- 22.1's theme-upload row answers `{ file, family? }` (201) and 22.2's manifest operations are
  four: the three on languages (#147) and `use-library-font`.
- `tests/store/woff2.test.ts`: the four library files answer their names ("Open Sans",
  "Roboto", "Atkinson Hyperlegible Next", "Faustina" -- Faustina by name ID 16, whose ID 1 is
  "Faustina Light"); a truncated file, a file of zeros and a
  WOFF2 whose name table is missing answer `null`.
