# ADR-274-background-image: a Theme carries a background picture at an opacity, `elsa-tree/9`, drawn fixed and covering behind the whole page, edited in the Theme panel with a slider

- Status: ACCEPTED (built) -- 2026-11-22. The issue left these readings to the run ("the run
  decides within them or asks on the issue"); each below is the run's reading within the issue's
  PROPOSED points, not the owner's words, and the owner may overrule any of them on the PR.
- Issue: #274 -- A background image for a Tree, with an opacity slider in the editor's Theme panel
- Spec: `docs/specs/tree-format.md` (title, header, 3.6, 4.3.4 new, 7 V-THEME, 8, 10, 11, 12, 12.11
  new), amended `[#274]`; `docs/specs/application.md` 5.5, 13.1, 13.4, 33.8, amended `[#274]`
- Schema: `schemas/elsa-tree-9.json`, beside `elsa-tree-8.json`, which stays served
- Amends: `ADR-263-elsa-tree-8.md` (the next format number is taken: `/9`)
- Related: issue #273 (tags in the manifest, filed beside this one under the same new number)

## Context

The owner, on #274: "provide the option to have the background be an image, with an opacity slider
so the creator of a decision-tree can set it to the desired opacity (in the editor mode)."

A Tree's look is its Theme (`tree-format.md` 4.3): three independent parts, each complete or
absent, every file in the Tree's own `theme/`, and a closed schema, so a new key is a new format
number (section 10). The format holds no numbers and no booleans (3.7). The page never scrolls
(`application.md` 10.6). In the editor every Theme write adds a `<style>` element that overrides the
earlier ones declaration for declaration (13.1). The public page's text is held to 4.5 : 1 on
`background` and `surface` (`tests/first-tree/contrast.spec.ts`); the panel warns and never refuses
(33.8).

## Decision

1. **A fourth Theme part, `background-image: { file, opacity }`** (4.3.4). Its own key, not a key
   of `colours` (whose seven roles are a closed set of colours) and not `background`, which is
   already a colour role: the byte form's writer, `src/tree/serialise.ts`, rests on no key name
   meaning two things in the format. Both keys required: complete or absent, as the other parts.
2. **The file**: a third grammar of 3.6, `png`, `jpg`, `jpeg` or `webp`. JPEG because a background is
   a photograph as often as not; no SVG, for the editor's reason it is no logo (33.8). The theme
   upload sniffs JPEG now; the logo's grammar still refuses `.jpg`, and the panel refuses a JPEG at
   the logo's picker before writing.
3. **The opacity is a string**, `"0"` to `"1"` with at most two decimals and no trailing zero
   (`^(?:0|1|0\.[0-9]?[1-9])$`): 3.7 has no numbers, and one way to write each value keeps two
   writers' bytes equal. Two decimals are the slider's whole percents.
4. **Drawn as one fixed layer the size of the window, covering it from its centre, under
   everything, over the `background` colour** (13.1): the body's `::before`, `z-index: -1`, the
   picture `center / cover` at the opacity, so the colour shows through at the rest. Fixed, because
   the document never scrolls; covering, because a window of any shape must be filled without a seam
   or a repeat. The bars, the Bubble and the side bubbles keep their fills over it.
5. **`theme.ts` writes both properties always**, `none` and `0` without a picture, both values
   re-checked at the sink. Leaving them out failed in the editor: a removed picture went on being
   drawn from the older element of 13.1 (the browser spec's removal test caught it).
6. **The panel** (33.8): upload, replace (the opacity kept), remove; a first opacity of 30 %; a
   slider of whole percents labelled and with its value shown, written 400 ms after the last change
   on a wait of its own; seen when the write is answered, as every Theme write is.
7. **The contrast warning does not pretend to a ratio**: while there is a picture, a line in the
   warning's look says text over it is not measured and a low opacity keeps it readable. The
   palette's own pairings are measured as before.
8. **Served and swept as every theme file**: `themePath` resolves the picture while the Theme names
   it; a replaced or removed one stays in `theme/`, unserved; no publish sweeps it (5.5, 33.8).
9. **`elsa-tree/9`, converted by 12.11**, the format and `$schema` renamed and nothing else, run
   over the repository here and by the store at start. #273 proposes tags under the same number:
   whichever lands second folds into this `/9` -- one conversion, not two -- since both only add an
   optional key and 12.11 is a renaming either way.
10. **The example Tree carries no picture**: its page and the contrast it is measured at stay as
    they were; `tests/fixtures/background-image` carries one.

## Alternatives rejected

- **An opacity as a number** (`0.3`): 3.7 bars numbers from the contract, and `"0.30"` against
  `"0.3"` would be two byte forms of one value without the no-trailing-zero rule.
- **A picture that scrolls with the page, or repeats**: nothing scrolls (10.6), and a tile would set
  a seam behind the Bubble that the creator cannot place.
- **The colour laid over the picture as a gradient** (`var(--elsa-background)` mixed to
  transparent at 1 minus the opacity): the same look in more CSS, the opacity turned into a
  percentage by `calc`; a layer at an opacity over the colour the canvas already has is one
  declaration and reads as what the creator set.
- **A live preview while the slider is dragged** (an inline property on `:root`): it would override
  every later element of 13.1 until removed, and a refused write would leave the page showing a
  value the draft does not hold. The write after 400 ms is what the colours do.
- **A measured ratio over the picture**: it needs the picture's pixels under every text, at every
  window size the picture covers differently; the panel would be guessing.

## Consequences

- Every Tree and fixture on `dev` is `elsa-tree/9` (12.11.3); `schemas/elsa-tree-9.json` is served
  beside the five before it, and `SCHEMA_HREF`, `llms.txt` and the dataset's header name it.
- A deployment's `/8` files are converted at the first start of the release that carries this, one
  line each (12.11.4) -- the same write core document 10.45 asks the owner about for every format
  change, made reversible by the copy taken before a release starts (`[#247]`).
- Text standing straight on the page -- not in a bar, the Bubble or a side bubble -- stands on the
  picture, and no test measures it there; the creator is told so, and chooses the opacity.
- A picture of 5 MiB is fetched by every reader of the page, once an hour (5.5's cache). The upload's
  cap is the only bound; the panel does not resize.
