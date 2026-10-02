# ADR-171-font-library: the application ships four open-licence font families in `fonts/` -- Open Sans, Roboto, Atkinson Hyperlegible Next and Faustina, each under the SIL Open Font License 1.1 with no Reserved Font Name and each no wider than Open Sans -- and a family chosen from them is copied into the Tree's own `theme/` folder with its licence text

- Status: ACCEPTED (frozen) -- 2026-10-02
- Issue: #171 -- Architecture: freeze the free-text ending of a tree (in place of the four
  fixed outcomes) and the font and licence dropdowns of the Theme panel
- Owner's request: #169 (2026-10-02)
- Spec: `docs/specs/application.md` 6, 33.8, 37 (new); `docs/specs/tree-format.md` 4.3.2
  (unchanged: a family from the library is written exactly like an uploaded one)
- Depends on: `docs/adrs/ADR-171-licence-dropdown.md` (the licence string a library family
  stores); used by `ADR-171-font-dropdown.md`
- Amends: `ADR-5-repository-layout.md` (`fonts/` at the root; `src/fonts.ts`)
- Measurements: `docs/research/issue-171-measurements.md` (every number below, with the
  scripts that produced it)

## Context

The owner (#169): "Make the font family selection a dropdown, but do give the option to add a
font by uploading a file." The Theme panel built by #144 asks for a family name typed by hand,
a licence line typed by hand and an uploaded WOFF2 file (`application.md` 33.8). A dropdown
needs a list of families and a place their files come from, and four rules bound both:

- **No request to a third party, ever** (core document 7, 9; `application.md` 13.5): a page
  fetches its fonts from its own origin, through the Tree's theme route.
- **A Tree is self-contained**: its font files are in its own `theme/` folder (`tree-format.md`
  3.6, 4.3.2), so a family chosen from a list must end up as files in the Tree, exactly as an
  uploaded one does, and a Tree moved to another deployment takes them along (17.4).
- **A font in a Tree must be redistributable with it, stated truthfully** (4.3.2): "A font file
  whose licence the author cannot state does not belong in the Tree." The SIL Open Font License
  also asks that its text accompany the fonts.
- **The length limits of `tree-format.md` 5.7 hold in a stated face.** They were measured in
  Open Sans and "similar humanist sans-serifs", and 5.7 says outright that a wider face does
  not get the promise. A family the application itself offers must not break it.

The precedent is the first Tree's own Open Sans: three static Latin subsets (400, 600, 700),
55,464 bytes, copied from ai4sfs.org with the OFL text and recorded in its `theme/LICENCE.md`
(issue #40), which also kept Nova Square out because its Reserved Font Name made a subset "a
licence question this Tree does not need to raise".

**Research, 2026-10-02.** The OFL's own page on web fonts ("Webfonts and Reserved Font Names",
openfontlicense.org, updated 12 January 2026): a WOFF version keeps the font's name "only if
the original font data remains unchanged except for WOFF compression"; anything else -- a
subset -- is a Modified Version, and a Modified Version may not use a Reserved Font Name.
Families with **no** Reserved Font Name may be subset and keep their name. Candidates were
taken from `github.com/google/fonts` at commit `9710da1eacb3be272583c3224dcb70f9da6eadbb`
(2026-09-30). For each, the copyright statement of its `OFL.txt` (the lines above the licence,
since the licence text itself defines the term) **and** the copyright record of its font
file's `name` table were read for a Reserved Font Name, and its width was measured with
fontTools 4.60.0 against Open Sans, both built by the recipe below, on the two Trees' own text:
every Node title (at 700, the heading weight) and description (at 400) in English and Dutch,
19,219 description characters and 6,532 title characters, by the advance widths of the
instance the stylesheet draws.

| Family | Reserved Font Name | Running text, x Open Sans | Headings, x Open Sans | x-height | Kept |
|---|---|---|---|---|---|
| Open Sans | none | 1.000 (7.40 px a character at 16 px) | 1.000 | 0.535 | **yes** |
| Roboto | none | 0.944 | 0.904 | 0.528 | **yes** |
| Atkinson Hyperlegible Next | none | 0.949 | 0.952 | 0.496 | **yes** |
| Faustina | none | 0.879 | 0.879 | 0.494 | **yes** |
| Public Sans | none | 0.990 | 0.959 | 0.517 | fits; a second neo-grotesque beside Roboto |
| Andada Pro, Brygada 1918 | none | 0.984, 0.994 | 0.955, 0.967 | 0.494, 0.460 | fit; 178 and 113 KB against Faustina's 80 |
| Inter | none | 1.017 | 0.985 | 0.546 | wider than Open Sans |
| Literata, Noto Serif | none | 1.018, 1.024 | 1.029, 1.020 | 0.507, 0.536 | wider |
| Gelasio, Besley | none | 0.951, 1.079 | 1.035, 1.099 | 0.481, 0.520 | wider |
| Crimson Pro, Newsreader, Alegreya, Vollkorn, Petrona | none | 0.853 to 0.934 | 0.832 to 0.950 | 0.420 to 0.458 | fit; small beside the sans at 16 px |
| EB Garamond | none | 0.816 | 0.841 | 0.400 | 373 KB as a subset; the smallest x-height |
| Bitter | **"Bitter Pro"**, in its `OFL.txt`'s copyright statement | 0.989 | 0.953 | 0.522 | a subset of a family with a reserved name |
| Source Serif 4 | **"Source"**, in its font file's copyright record, though its `OFL.txt` on google/fonts names none | 0.958 | 0.931 | 0.475 | the two statements disagree |
| Lato, Merriweather, Lora, IBM Plex Sans, Source Sans 3 | **yes**, in their `OFL.txt` | | | | a subset may not keep the name |

## Decision

1. **The application ships four families**, chosen to be four different voices that each
   keep the format's limits: **Open Sans** (a humanist sans: the first Tree's face, and the
   face 5.7 measured the limits in), **Roboto** (a neo-grotesque; Android's own face),
   **Atkinson Hyperlegible Next** (a sans drawn by the Braille Institute for readers with low
   vision) and **Faustina** (a text serif with an upright and an italic, narrow enough to
   leave the limits room). Each is under the **SIL Open Font License 1.1 with no Reserved Font
   Name** -- in its `OFL.txt`'s copyright statement and in its font file -- and declares
   `fsType` 0 (installable embedding).
2. **A family enters the library only if** it is under a licence of the licence list
   (`ADR-171-licence-dropdown.md`) with no Reserved Font Name in either place; it is **no
   wider than Open Sans** at 400 and at 700 on the two Trees' own text, measured as above; it
   has an upright and an italic covering weights 400 to 700 (the stylesheet uses 400, 600 and
   700, and `*emphasis*` is italic); and it covers Latin and Latin Extended. A family added
   later meets the same four and is measured the same way, in its pull request.
3. **Two files a family, built by one recipe** (below): each the upstream variable TTF with
   its weight axis limited to 400-700 and every other axis pinned at its default, subset to
   the `latin` and `latin-ext` Unicode ranges Google Fonts serves, **every `name` record and
   every layout feature kept** -- so the copyright and the licence travel inside each file, as
   the OFL allows -- saved as WOFF2 without touching `head.modified`. Two runs give identical
   bytes. A page asks for the upright file, and for the italic only when its text has
   emphasis.

   | File | Bytes | SHA-256 |
   |---|---|---|
   | `fonts/open-sans/open-sans-normal.woff2` | 42,904 | `a01904f4431dc90d3df322c58a7e7f466b55d8b8a0b2e2a899ac6daf0b105689` |
   | `fonts/open-sans/open-sans-italic.woff2` | 44,796 | `44c77ff92035694c70d40b2ef2c0ddc92027987bb6659fcc9fcf1bbe3535ce69` |
   | `fonts/open-sans/OFL.txt` | 4,389 | `fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602` |
   | `fonts/roboto/roboto-normal.woff2` | 50,252 | `56802c518d2124afc44b35e512d31e7e5c4147e7f86f9a8f2788f3e141980dfc` |
   | `fonts/roboto/roboto-italic.woff2` | 55,164 | `3b44bb9a4d12169b3af5b7a7ef165de37f80d68826c9c2aa59877ce133c91513` |
   | `fonts/roboto/OFL.txt` | 4,394 | `061402327a96aadb0bfb694a960ed289ecd38d383e396243831ab81feb109c41` |
   | `fonts/atkinson-hyperlegible-next/atkinson-hyperlegible-next-normal.woff2` | 25,688 | `9dc2c98eb9bc3522391fbaeb9dfe994dd50067ff738a568d87acce973c62b11a` |
   | `fonts/atkinson-hyperlegible-next/atkinson-hyperlegible-next-italic.woff2` | 29,156 | `aa55d8399746875ef8d3ef7a82ccc5d6a68331befc0517f3a42ad4b653fa6509` |
   | `fonts/atkinson-hyperlegible-next/OFL.txt` | 4,431 | `aca6a428580965d2297d1b718042dd427c2a9443ece3b0d02d758e161e0c4030` |
   | `fonts/faustina/faustina-normal.woff2` | 38,648 | `a84c008b88322919d47e487af4ad88cff098481940d24b61a553327061d01efa` |
   | `fonts/faustina/faustina-italic.woff2` | 40,904 | `5ab1ba6428cbbec0c11a6847869aa2a17bbc18fcd7472e7c7024a0c1af8d8d6a` |
   | `fonts/faustina/OFL.txt` | 4,390 | `2d8f6a7be96a15fd2deaa8e6b5320cec6c253216b5a8f7e1becccfc51147b877` |

   The inputs, from `github.com/google/fonts` at `9710da1eacb3be272583c3224dcb70f9da6eadbb`:
   `ofl/opensans/OpenSans[wdth,wght].ttf` (532,636 bytes, `36643644f318a812aab2d2ed3bb98f8cf0872527f835fe9398d95fe6b9adb878`),
   `ofl/opensans/OpenSans-Italic[wdth,wght].ttf` (583,992, `fe269381e992f32e135801740998544d6235061e37c93ec067ad2be3edd5b17b`),
   `ofl/roboto/Roboto[wdth,wght].ttf` (488,584, `d7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134`),
   `ofl/roboto/Roboto-Italic[wdth,wght].ttf` (530,944, `9725a847af6b460ffca162ae66d20dad48b01876137947180b42d7dcd7887182`),
   `ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf` (114,552, `5a455d1cfa099b601ab70751bb9673e8fe1854dc4500c80e1a220d0d75e31745`),
   `ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic[wght].ttf` (123,916, `ce9cffed32742ad2d9238c561a93220385e5934cdc02b8eb4097a50efa957dc6`),
   `ofl/faustina/Faustina[wght].ttf` (118,468, `2ce2606f0ee1d493873c24818a391e02606ee76ac924b3d985cbb820c0a53ea5`),
   `ofl/faustina/Faustina-Italic[wght].ttf` (120,744, `215b9bf63da0c9584b5a0aa8e2270da6a2b62c1281f5c39089613c3aaeffa2be`),
   and each family's `OFL.txt` beside them, copied unchanged. Open Sans's is byte-identical to
   the first Tree's `theme/ofl-open-sans.txt`.

4. **They sit in `fonts/<family id>/` at the repository root**, each folder holding its two
   WOFF2 files and its upstream `OFL.txt` -- so the licence text accompanies the files in the
   repository and in every release -- with `fonts/README.md` recording the source, the commit,
   the recipe, the tool versions and the hashes above, as `trees/*/theme/LICENCE.md` does for
   the Trees' own fonts. Not under `public/`: Next.js serves that folder at the site's root,
   and a library font must reach a page only as a file of a Tree. `next build`'s standalone
   folder and the container image carry `fonts/` beside `server.js`, as they carry `schemas/`
   (`application.md` 15.1): `scripts/collect-standalone.ts` copies it into the standalone
   folder, which the `Dockerfile` copies whole. The store reads it from the working
   directory. `trees/` is no precedent: the standalone folder leaves the Tree folders out on
   purpose, and only the `Dockerfile` copies them, as the seed.
5. **The list is code**: `src/fonts.ts`, pure, exports `FONT_LIBRARY` -- per family its id
   (the folder's name), its CSS family name, its licence id, and its files with weight,
   style and SHA-256 -- in the order above, and the licence list of
   `ADR-171-licence-dropdown.md`. `tests/fonts.test.ts` holds the list and the folder to each
   other: every file listed exists with its hash, every file in `fonts/` is listed or is an
   `OFL.txt` or the README, every file name passes 3.6's font grammar.
6. **A family chosen is copied into the Tree.** Its two WOFF2 files go into the Tree's
   `theme/` under the server's name of `application.md` 22.6 -- the stem, `-`, the first 8 hex
   of the bytes' SHA-256, `.woff2`, so `open-sans-normal-a01904f4.woff2`: the same bytes give
   the same name in every Tree, and no upload can collide with them -- and its `OFL.txt` goes
   beside them as `<family id>-licence.txt`. The Theme's entry is the one 4.3.2 defines, with
   nothing to say where it came from: `family` the CSS name, `files` the two copies at weight
   `"400 700"`, styles `normal` and `italic`, and `licence` the OFL's string of the licence
   list. From then on the files are the Tree's: the public theme route serves them under the
   Tree's id (5.5), a moved Tree takes them (17.4), and nothing refers back to `fonts/`.

**The recipe** (Python 3.13.5, fontTools 4.60.0, the `brotli` module 1.2.0), normative for
the hashes above -- this block, run as it stands, produced them; `fonts/README.md` carries it,
and CI never runs it -- the test checks the committed bytes:

```python
import io
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# Google Fonts' "latin" and "latin-ext" unicode-range values.
LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'

def codepoints(spec):
    out = set()
    for part in spec.split(','):
        lo, _, hi = part.strip()[2:].partition('-')
        out.update(range(int(lo, 16), int(hi or lo, 16) + 1))
    return sorted(out)

def build(ttf_path):
    font = TTFont(ttf_path, recalcTimestamp=False)
    location = {a.axisTag: (max(a.minValue, 400), min(a.maxValue, 700)) if a.axisTag == 'wght' else a.defaultValue
                for a in font['fvar'].axes}
    font = instancer.instantiateVariableFont(font, location)
    buffer = io.BytesIO(); font.save(buffer); buffer.seek(0)
    font = TTFont(buffer, recalcTimestamp=False)   # re-read: the subsetter trips on a lazily loaded gvar
    options = subset.Options()
    options.name_IDs = ['*']; options.name_languages = ['*']; options.name_legacy = True
    options.layout_features = ['*']; options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints(LATIN) + codepoints(LATIN_EXT))
    subsetter.subset(font)
    font.flavor = 'woff2'
    out = io.BytesIO(); font.save(out)
    return out.getvalue()
```

**What it adds, measured**: the four folders hold **345,116 bytes** (327,512 of WOFF2 and
17,604 of licence text), plus `fonts/README.md`. In the **repository** that is **324 KiB** as
a git pack (a fresh repository holding only the folder, `git gc --aggressive`, `size-pack`);
the object store this checkout shares held 29.72 MiB packed on the same day. In the
**container image** the run stage gains the same 345,116 bytes on its file system, a
**378,880-byte** layer as a tar and about **339 KB** gzip'd as a registry stores it (339,475
and 339,498 bytes in two runs: the tar carries the files' times); WOFF2 is Brotli-compressed already, so neither git nor gzip wins much back. A Tree
that takes a family gains 59 to 110 KB in its own `theme/` (the family's two files and its
licence text); a reader's browser fetches 26 to 50 KB for the upright face, once an hour at
most (5.5).

## Alternatives rejected

- **No library; upload only.** The owner asked for a dropdown, and a creator without font
  files of their own would still have to find, license and convert one.
- **Family names resolved by the browser from Google Fonts or another CDN.** A request to a
  third party on every page (13.5, core document 9), and a Tree that is no longer whole.
- **The upstream variable fonts unchanged** (the OFL's "WOFF version", no subset): Open Sans
  alone is 594 KB as WOFF2 against 88 KB, and the four families 1.28 MB against 0.33. A page
  of a Tree would carry up to seven times the font bytes, for scripts the Trees do not use; a
  Greek or Cyrillic letter still renders, in the reader's own face, because the default stack
  follows every family (13.1).
- **Static instances** (400, 700 and an italic): more files, and the stylesheet's 600 would
  be synthesised.
- **Google Fonts' own split files** (or Fontsource's), one per Unicode range: the format's
  font files carry no `unicode-range` (4.3.2), so two files of one weight and style would
  claim the same characters and conflict.
- **A served library**, named from the Theme by an application address instead of copied. The
  Tree stops being self-contained: a Tree moved to a deployment with another library, or an
  older release, would lose its fonts, and the dataset would name files it does not hold.
- **Bitter**, the slab serif first chosen: its `OFL.txt` reserves the name "Bitter Pro", and
  its file carries the trademark notice "Bitter is a trademark of Sol Matas". Whether a subset
  named "Bitter" uses the reserved "Bitter Pro" is exactly the licence question the first
  Tree's `LICENCE.md` declined to raise for Nova Square; with Faustina beside it there is no
  need to raise it. **Source Serif 4**, the strongest serif measured: its font file says "with
  Reserved Font Name 'Source'" where google/fonts' `OFL.txt` names none, and a subset of a
  family whose own file reserves its name is what the OFL forbids. **Lato, Merriweather, Lora,
  IBM Plex, Source Sans 3**: Reserved Font Names. **Inter, Literata, Noto Serif, Gelasio,
  Besley**: wider than Open Sans, so a Node at the format's limits would no longer fit the
  Bubble in them. **Crimson Pro, Newsreader, Alegreya, Vollkorn, Petrona, EB Garamond**: they
  fit, but their x-heights (0.40 to 0.46 of the em against Open Sans's 0.535) make 16-pixel
  text look a size smaller than the sans beside it, and EB Garamond is 373 KB. **Andada Pro
  and Brygada 1918** fit as Faustina does, at 2.2 and 1.4 times its bytes. **Public Sans**
  fits and is small; Roboto is the neo-grotesque that also matches Android's system face, and
  a fifth family was not needed.
- **More than four**, or one per kind of identity a lab might want. Each family is another
  60 to 110 KB in every release and another face to keep measured; a lab with its own identity
  uploads its own files, which the dropdown keeps (`ADR-171-font-dropdown.md`).

## Consequences

- #180 builds it: `fonts/` with its README, `src/fonts.ts`, the copy (`application.md` 37.3),
  the standalone and container carriage, and the tests of 37.6. Its pull request pastes the
  hashes it committed against the table above.
- `no-scroll.spec.ts` gains one row: the full-node fixture with each library family set in
  both roles, at 1280 x 640 and 360 x 640, in `en` and `nl` -- the browser's proof of
  decision 2's measurement.
- The first Tree keeps its own three Open Sans files; nothing converts a hand-made Theme to a
  library family.
