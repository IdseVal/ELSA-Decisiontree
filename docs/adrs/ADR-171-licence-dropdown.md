# ADR-171-licence-dropdown: a font's licence is chosen from six SPDX licences, each stored as its full name and the address of its text; a licence not on the list is written by the creator under "Another licence…"; a library family's licence is fixed

- Status: ACCEPTED (frozen) -- 2026-10-02
- Issue: #171 -- Architecture: freeze the free-text ending of a tree (in place of the four
  fixed outcomes) and the font and licence dropdowns of the Theme panel
- Owner's request: #169 (2026-10-02)
- Spec: `docs/specs/application.md` 33.8, 37.5 (new); `docs/specs/tree-format.md` 4.3.2
  (unchanged: `licence` stays a string of at most 200 characters)
- Depends on: nothing; used by `ADR-171-font-library.md` and `ADR-171-font-dropdown.md`
- Measurements: `docs/research/issue-171-measurements.md` section 6 (the SPDX pages and the
  stored strings' lengths)

## Context

The owner (#169): "Make the license section a dropdown." The format's `licence` is "The
licence under which the family is redistributed with this Tree, and where its text is.
Reproduced as written, like an Image's `credit`; the loader does not interpret it. A font file
whose licence the author cannot state does not belong in the Tree" (`tree-format.md` 4.3.2).
The Trees of this repository write it as a name and a place: `SIL Open Font License 1.1
(theme/ofl-open-sans.txt)`. Today the Theme panel asks for it typed by hand (33.8).

A dropdown needs a list, a string for each entry, and an answer for a font whose licence is
not on it. The list has to cover the library's families -- all four under the SIL Open Font
License 1.1 (`ADR-171-font-library.md`) -- and the licences a creator who uploads an open font
actually meets. The SPDX License List names every licence by a stable identifier and
publishes each one's text at a stable address (version 3.29.0, 2026-09-16; each address
below answered 200 on 2026-10-02). Among its font licences, the ones open fonts are released
under in practice are the SIL Open Font License (by far the most common; every family of
Google Fonts but a few), the Apache License 2.0 (older Google families, Droid), the Ubuntu
Font Licence (the Ubuntu family) and the Bitstream Vera Font License (Bitstream Vera and
DejaVu, and their derivatives); MIT and CC0 cover a tail of fonts and icon faces released as
plain open source or into the public domain.

## Decision

1. **The licence dropdown offers six licences**, in this order, each shown by its SPDX full
   name (a proper name, the same in every language), each stored as **that name and the
   address of its text**:

   | SPDX id | Shown | Stored in `licence` |
   |---|---|---|
   | `OFL-1.1` | SIL Open Font License 1.1 | `SIL Open Font License 1.1 (https://spdx.org/licenses/OFL-1.1.html)` |
   | `Apache-2.0` | Apache License 2.0 | `Apache License 2.0 (https://spdx.org/licenses/Apache-2.0.html)` |
   | `Ubuntu-font-1.0` | Ubuntu Font Licence v1.0 | `Ubuntu Font Licence v1.0 (https://spdx.org/licenses/Ubuntu-font-1.0.html)` |
   | `Bitstream-Vera` | Bitstream Vera Font License | `Bitstream Vera Font License (https://spdx.org/licenses/Bitstream-Vera.html)` |
   | `MIT` | MIT License | `MIT License (https://spdx.org/licenses/MIT.html)` |
   | `CC0-1.0` | Creative Commons Zero v1.0 Universal | `Creative Commons Zero v1.0 Universal (https://spdx.org/licenses/CC0-1.0.html)` |

   The longest is 77 characters, inside 4.3.2's 200. The list is `src/fonts.ts`'s
   `FONT_LICENCES` (`ADR-171-font-library.md` decision 5).
2. **Last comes `licenceOther`, "Another licence…"**, which shows the free licence line of
   today's panel under the dropdown: required, at most 200 characters, its hint 4.3.2's own
   sentence -- the licence under which the family is redistributed with this Tree, and where
   its text is. That is the answer for a font whose licence is not on the list: the creator
   states it in words, as before. A creator who cannot state one has no entry to choose, and
   4.3.2's rule stands -- such a font does not belong in the Tree, which #180's hint says.
3. **The dropdown shows the entry whose stored string equals the family's `licence`
   exactly**, and "Another licence…" with the string in its field for any other -- so a
   hand-made Theme's line, such as the first Tree's `SIL Open Font License 1.1
   (theme/ofl-open-sans.txt)`, is shown and kept as written, never rewritten by opening the
   panel.
4. **A library family's licence is fixed**: shown as its entry, not editable, because it is a
   property of the files (`ADR-171-font-dropdown.md` decision 6); `use-library-font` stores the
   `OFL-1.1` string. Its licence **text** travels with its files, copied into the Tree's
   `theme/` as `<family id>-licence.txt` (`ADR-171-font-library.md` decision 6); for an
   uploaded family the string names where the text is, and the font file carries its own
   copyright, which the OFL accepts "in the appropriate machine-readable metadata fields".
5. **The format does not change**: `licence` stays a string, uninterpreted by the loader.

## Alternatives rejected

- **Store the SPDX identifier alone** (`OFL-1.1`), or make `licence` an object
  (`{ spdx, text }`). The first does not say where the text is, which 4.3.2 asks; the second
  is a change to the format's shape, for which no reader asked, and the Trees on `dev` would
  need converting for nothing.
- **Point at the licences' own sites** (openfontlicense.org, apache.org, ubuntu.com). Six
  owners and six shapes of address, and they move: `scripts.sil.org/OFL`, the address the
  Open Sans files still name, redirected to `https://openfontlicense.org/` on 2026-10-02 (301,
  then 307). The SPDX pages are one stable scheme that holds every licence's text.
- **Copy a licence text file into `theme/` for an uploaded font too.** A generic licence
  text lacks the font's own copyright line, which only its file or its maker's package holds;
  the copy would look complete and not be.
- **No "Another licence…"; refuse every other font.** A lab whose own typeface is under its
  own licence could no longer give its Tree its identity, which is the Theme's purpose (core
  document 3.1).
- **A longer list** (the GPL with its font exception, the IPA and Arphic licences, the OFL
  1.0, the LaTeX Project Public License under which the GUST fonts are released). Each is
  real but rare among web fonts, and "Another licence…" holds any of them in the creator's
  words.
- **Matching a hand-made line to an entry by its first words**, so the first Tree's line
  would show as "SIL Open Font License 1.1". Choosing anything in the panel would then
  rewrite a line its author wrote with care -- the path to its text included -- into a
  different one.

## Consequences

- `src/chrome.ts` gains `licenceOther` ("Another licence…" / "Een andere licentie…") in both
  languages (#180); the six names are not chrome.
- The licence dropdown is per family, under the font dropdown, for the Tree's own family
  only (`ADR-171-font-dropdown.md` decision 6).
- `tests/fonts.test.ts` asserts every stored string is at most 200 characters, ends with the
  SPDX address of its id, and that every library family's licence id is on the list.
