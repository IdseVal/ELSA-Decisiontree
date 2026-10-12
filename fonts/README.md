# The font library

The four families the Theme panel offers in its font dropdown (`docs/specs/application.md`
37; `docs/adrs/ADR-171-font-library.md`). Choosing one copies its two files into the Tree's
own `theme/` folder, with its `OFL.txt` beside them as `<id>-licence.txt`
(`use-library-font`, 37.3); from then on the files are the Tree's, and nothing refers back
here. No file in this folder is ever served from it: it is not under `public/`, and a page
fetches a library font only as a file of a Tree, through that Tree's theme route (5.5).
`src/fonts.ts` lists every file with its SHA-256, and `tests/fonts.test.ts` holds the list
and this folder to each other.

| Folder | Family | Licence |
|---|---|---|
| `open-sans/` | Open Sans | SIL Open Font License 1.1, no Reserved Font Name |
| `roboto/` | Roboto | SIL Open Font License 1.1, no Reserved Font Name |
| `atkinson-hyperlegible-next/` | Atkinson Hyperlegible Next | SIL Open Font License 1.1, no Reserved Font Name |
| `faustina/` | Faustina | SIL Open Font License 1.1, no Reserved Font Name |

Each folder holds the family's upright and italic as variable WOFF2 (weight `400 700`,
Latin and Latin Extended) and its upstream `OFL.txt`, unchanged, which the licence asks to
accompany the files. Every `name` record of the upstream fonts is kept, so each file also
carries its own copyright and licence. Each declares `fsType` 0 (installable embedding).

## Provenance

Built on 2026-10-02 by the implementer run for issue #180 from `github.com/google/fonts` at
commit `9710da1eacb3be272583c3224dcb70f9da6eadbb`, by the recipe below, with Python 3.13.5,
fontTools 4.60.0 and the `brotli` module 1.2.0. Every input matched the SHA-256 the ADR
records, every file was built twice to identical bytes, and every output matched the ADR's
hash.

| Input in google/fonts | Bytes | SHA-256 |
|---|---|---|
| `ofl/opensans/OpenSans[wdth,wght].ttf` | 532,636 | `36643644f318a812aab2d2ed3bb98f8cf0872527f835fe9398d95fe6b9adb878` |
| `ofl/opensans/OpenSans-Italic[wdth,wght].ttf` | 583,992 | `fe269381e992f32e135801740998544d6235061e37c93ec067ad2be3edd5b17b` |
| `ofl/roboto/Roboto[wdth,wght].ttf` | 488,584 | `d7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134` |
| `ofl/roboto/Roboto-Italic[wdth,wght].ttf` | 530,944 | `9725a847af6b460ffca162ae66d20dad48b01876137947180b42d7dcd7887182` |
| `ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf` | 114,552 | `5a455d1cfa099b601ab70751bb9673e8fe1854dc4500c80e1a220d0d75e31745` |
| `ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic[wght].ttf` | 123,916 | `ce9cffed32742ad2d9238c561a93220385e5934cdc02b8eb4097a50efa957dc6` |
| `ofl/faustina/Faustina[wght].ttf` | 118,468 | `2ce2606f0ee1d493873c24818a391e02606ee76ac924b3d985cbb820c0a53ea5` |
| `ofl/faustina/Faustina-Italic[wght].ttf` | 120,744 | `215b9bf63da0c9584b5a0aa8e2270da6a2b62c1281f5c39089613c3aaeffa2be` |

Each family's `OFL.txt` is the file beside its fonts in the same folder of google/fonts, at
the same commit.

| File | Bytes | SHA-256 |
|---|---|---|
| `open-sans/open-sans-normal.woff2` | 42,904 | `a01904f4431dc90d3df322c58a7e7f466b55d8b8a0b2e2a899ac6daf0b105689` |
| `open-sans/open-sans-italic.woff2` | 44,796 | `44c77ff92035694c70d40b2ef2c0ddc92027987bb6659fcc9fcf1bbe3535ce69` |
| `open-sans/OFL.txt` | 4,389 | `fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602` |
| `roboto/roboto-normal.woff2` | 50,252 | `56802c518d2124afc44b35e512d31e7e5c4147e7f86f9a8f2788f3e141980dfc` |
| `roboto/roboto-italic.woff2` | 55,164 | `3b44bb9a4d12169b3af5b7a7ef165de37f80d68826c9c2aa59877ce133c91513` |
| `roboto/OFL.txt` | 4,394 | `061402327a96aadb0bfb694a960ed289ecd38d383e396243831ab81feb109c41` |
| `atkinson-hyperlegible-next/atkinson-hyperlegible-next-normal.woff2` | 25,688 | `9dc2c98eb9bc3522391fbaeb9dfe994dd50067ff738a568d87acce973c62b11a` |
| `atkinson-hyperlegible-next/atkinson-hyperlegible-next-italic.woff2` | 29,156 | `aa55d8399746875ef8d3ef7a82ccc5d6a68331befc0517f3a42ad4b653fa6509` |
| `atkinson-hyperlegible-next/OFL.txt` | 4,431 | `aca6a428580965d2297d1b718042dd427c2a9443ece3b0d02d758e161e0c4030` |
| `faustina/faustina-normal.woff2` | 38,648 | `a84c008b88322919d47e487af4ad88cff098481940d24b61a553327061d01efa` |
| `faustina/faustina-italic.woff2` | 40,904 | `5ab1ba6428cbbec0c11a6847869aa2a17bbc18fcd7472e7c7024a0c1af8d8d6a` |
| `faustina/OFL.txt` | 4,390 | `2d8f6a7be96a15fd2deaa8e6b5320cec6c253216b5a8f7e1becccfc51147b877` |

345,116 bytes in all.

## The recipe

`ADR-171-font-library.md` decision 3, verbatim. Each upright and italic file is
`build('<input>.ttf')` written as `<id>-normal.woff2` and `<id>-italic.woff2`. CI never runs
it: `tests/fonts.test.ts` checks the committed bytes.

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

`docs/research/issue-171-measurements.md` section 5 holds `library.py`, which runs the recipe
twice per file, lays the folders out and measures them.
