# ADR-171-ending-text: a Terminal carries the creator's own text, `terminal.label`, at most 19 characters in every language, shown on the badge in one colour; the four fixed outcomes go

- Status: ACCEPTED (frozen) -- 2026-10-02
- **[#231] Amended (2026-10-10)** by `ADR-231-one-plus.md`: decision 7's `treeEndsHere` Sheet is the
  `+`'s Sheet with its switch `treeEndsHere` on, its field `endingText` as before; the Answer row
  has no `treeEndsHere` button (`docs/specs/application.md` 42.7).
- Issue: #171 -- Architecture: freeze the free-text ending of a tree (in place of the four
  fixed outcomes) and the font and licence dropdowns of the Theme panel
- Owner's request: #169 (2026-10-02)
- Spec: `docs/specs/tree-format.md` 3.4, 3.7, 4.3.3, 5, 5.5, 5.7, 7 (V-TERMINAL, V-LENGTH);
  `docs/specs/application.md` 3.2, 5.1, 10.1, 10.3, 10.5, 22.1, 22.2, 28.1, 30.1, 30.3
- Supersedes in part: `docs/adrs/ADR-4-terminal-marker.md` -- the closed set of four outcomes
  and its consequence "the frontend ships a styling table with four rows"; and its rejected
  alternative "Free-text outcome" for the words, not for styling: the marker carries free
  text, which nothing styles by its value (decision 4), and a value the frontend would have
  to style stays rejected (Alternatives rejected, the neutral tone). Its rejection of
  "`terminal: true` without an outcome" stands -- the marker carries the words (decision 1)
  -- but not its reason, "every end of the walk would look the same": every ending is drawn
  alike (decision 4), and its words tell the endings apart. Its two other decisions stand: a
  Terminal is marked explicitly, and a Node's kind is derived.
- Amends: `ADR-133-structure-editing.md` decisions 1 and 4 (a Terminal carries words, and
  `treeEndsHere` asks for a text, not one of four), `ADR-133-bubble-edited-in-place.md`
  decision 1's rim row (a text field, not a select), `ADR-133-reuse-rule.md` decision 2 (the
  `field` slot in `Bubble` holds the words), `ADR-132-editor-api.md` decisions 2 and 3 (`link: 'end'` carries `label`; the field
  is `terminal.label.<lang>`), `ADR-78-main-image-and-row-budget.md` decision 5 (the badge's
  40 chrome characters become the Tree's 19)
- Depends on: `docs/adrs/ADR-171-elsa-tree-5.md` (the format number and the conversion this
  change needs)
- Measurements: `docs/research/issue-171-measurements.md` section 3 (the badge's room and
  every width below, with the scripts that measured them)

## Context

The owner, walking the editor on 2026-10-02 (#169): "When tree ends here is chosen, just let
the user enter a text to display on the button (with a wordcap obviously). This graph
creation tool is not just for Legal trees, also for ethical or social trees, so we want to
keep the graph creator useable for all."

Until now a Terminal carried one of four fixed outcomes -- `not-applicable`, `applicable`,
`prohibited`, `refer` -- and the set was closed (`tree-format.md` 5.5, `ADR-4-terminal-marker.md`).
The editor asked for one of them in a Sheet (`application.md` 30.3) and drew it as a select on
the rim; the public page showed it as a badge: a 24-pixel pill on the Bubble's top rim, in the
half of the band left of the up arrow, holding the chrome word for the outcome -- "Does not
apply", "Applies", "Prohibited", "Look elsewhere"; "Niet van toepassing", "Van toepassing",
"Verboden", "Elders geregeld" -- in 11-pixel bold capitals with 0.12 em tracking
(`application.md` 10.1, 10.3; `src/app/[lang]/globals.css`, `.outcome`). Those four words are
legal ones; an ethics or a social Tree cannot say anything true with them. `ADR-4` rejected
free text in 2026-09-03 because "the frontend cannot style a value it has never seen": that
was an argument about a **category** to be styled. The owner now asks for the **words**
themselves, which need no styling table at all.

**The badge's room, from the stylesheet.** The pill is the text, 14 pixels of padding and a
1-pixel border each side (30 pixels), at most the half of the Bubble's padding box left of the
48-pixel arrow column: `(Bubble width - 4) / 2 - 24`.

| Window width | Bubble | The badge's room |
|---|---|---|
| 792 and wider (the guarantee, 1280 x 640, included) | 760 | 354 px |
| 480 to 791 | width - 32 (the page inset, 16 each side) | 198 px at 480, rising to 354 |
| 321 to 479 | width - 32 | across the whole band, under the arrow's foot (#82): width - 60 = 261 px at 321, 300 at 360 |

The narrowest room is **198 pixels, at 480 pixels wide**: 168 of text.

**What the badge's text measures**, in Chromium (Playwright 1.62.1), in the badge's own
style, for the longest word the conversion writes and for plausible endings of 18 to 20
characters a creator might type (`Mandatory safeguard`, `Maatregelen vereist`,
`Mandatory safeguards`, `Ethisch aanvaardbaar`, `Zulässig mit Auflage`, `Women at work
only!` ...), each alone on one line:

| Face | `Niet van toepassing` (19) at 0.12 em | widest ending of 19 at 0.12 em | widest ending of 19 at 0.04 em | widest ending of 20 at 0.04 em |
|---|---|---|---|---|
| Open Sans (the first Tree; the library's) | 178.0 px | 195.0 | 178.2 | 184.7 |
| Arial Bold (the default stack's metrics, `src/theme.ts`) | 179.8 | 197.7 | 181.0 | 188.7 |
| Segoe UI Bold (Windows' face in the default stack) | 175.3 | 192.1 | 175.4 | 182.0 |
| Roboto, Atkinson Hyperlegible Next, Faustina (the library, `ADR-171-font-library.md`) | 170.2 to 177.8 | 186.0 to 189.5 | 169.3 to 172.8 | 175.6 to 179.9 |
| DejaVu Sans Bold (the widest fallback, 10.7) | 194.2 | 212.3 | 195.5 | 203.9 |

**In place on the rim** -- the badge as `globals.css` positions it, in the Bubble at a
480-pixel window -- a text wider than the 198 pixels takes a second line: the badge is then
46 pixels tall instead of 24 and reaches 24 pixels into the text area, over the title, which
is the text area's first line below 792 pixels wide (10.5's step 5 hides the main image
there). In DejaVu Sans Bold that happens to three of the seven 20-character endings at 0.04 em,
and to five of the seven 19-character endings at 0.12 em; to none of 19 at 0.04 em, in any
face measured. The same script run in Linux Chromium (the Playwright image) gives the same
lines: the library's faces, served as web fonts, measure up to 1.1 pixels wider there and
DejaVu Sans Bold as a web font 1.9 wider -- its widest ending of 19 at 0.04 em is 197.4 --
while an installed DejaVu Sans measures as on Windows. San Francisco and Helvetica Neue, the
default stack's faces on Apple's systems, were not measured (the research record says why).

The model of the same widths from the fonts' own advance widths (`hmtx`, no kerning) gives
178.0 for Open Sans's `Niet van toepassing`, which is the 178 issue #82 measured on the
running page (`application.md` 10.1, amended 2026-09-18): the numbers are the page's.

## Decision

1. **A Terminal carries `terminal: { "label": <localised text> }`**: the ending's own words,
   which the creator types. It is a **plain** localised text (one line, V-PLAIN; no
   Markdown), held in every declared language like every other text (3.3, V-L10N), and
   **required**: a Terminal without words is not an ending a reader can see, and V-EMPTY
   forbids `"terminal": {}` anyway. In a published Tree no language of it may be empty; in a
   draft an empty language is a to-do like every other (V-L10N advisory, `application.md`
   19.2). The key is `label` -- the word the format already uses for a short visible text on
   a control-like thing, a Source's link -- and it is the only key of `terminal`.
2. **At most 19 characters**, counted by `tree-format.md` 3.8, per language, the same for
   every language (V-LENGTH; `tree-format.md` 5.7 gains the row). The number is the room
   above: one line in the narrowest room, 198 pixels at 480 pixels wide, for every ending of
   up to 19 characters measured, in every face measured -- DejaVu Sans Bold included, the
   widest fallback, in which `application.md` 10.7 re-derives the buttons' widths -- with
   decision 6's narrow-width tracking, on Windows and in Linux; the widest is `Mandatory
   safeguard` in DejaVu Sans Bold, 195.5, and 197.4 where Linux draws DejaVu Sans Bold as a
   web font. And 19 is the least the conversion allows: the longest word it writes,
   `Niet van toepassing`, is 19. At the guarantee the room is 354 pixels and the widest
   19-character ending measured is 212.3: nothing near the edge. Like every limit of 5.7 it
   counts characters, not pixels: a run of capitals wider than any measured can still take
   a second line at the narrowest widths.
3. **`outcome` goes, entirely.** No optional hint survives beside `label`, and a file that
   still carries one is refused (V-KEYS by the schema's `additionalProperties`; V-TERMINAL).
4. **Every ending is drawn in one colour**: the badge's text and outline, and the Terminal
   Bubble's outline, in the accent's reading shade (`--accent-read`, `globals.css`) -- what a
   `refer` ending and every Terminal outline but the `prohibited` one show today. The Theme's
   `danger` role keeps its place in the closed set of seven (4.3.3; a change to the roles is
   out of this issue's scope) and paints error states only; no public Node page uses it any
   more.
5. **The badge is Tree content, not chrome**: the Terminal's `label` in the page's content
   language, with no `lang` of its own, where it was the chrome word in the chrome language.
   The chrome keys `outcomeNotApplicable`, `outcomeApplicable`, `outcomeProhibited`,
   `outcomeRefer` and `outcome` go; `endingText` comes ("Text of the ending" / "Tekst van het
   einde": the Sheet's field label and the empty field's placeholder, both 19 characters or
   fewer, so the placeholder fits the badge too); the Theme panel's word for the `danger`
   role, `colourDanger`, becomes "Errors" / "Fouten".
6. **The badge keeps its place, size and look** -- the pill, 11-pixel bold capitals, 0.12 em
   tracking, the half of the band left of the arrow, and #82's rule below 480 pixels -- so an
   ending converted with its old word reads as it did, at 792 pixels wide and wider. **One
   thing is added: below 792 pixels wide, where the Bubble narrows and 10.5's steps 5 to 7
   fire together, the tracking is 0.04 em**, for every ending. It is what makes decision 2's
   19 characters fit the 198 pixels at 480 in DejaVu Sans Bold, where five of the seven
   19-character endings measured take a second line at 0.12 em; every other face measured
   holds them at 0.12 em too, Arial Bold's widest with 0.3 pixels to spare.
7. **The editor asks for the words, and only the words.** `treeEndsHere` opens a Sheet titled
   `treeEndsHere` holding one plain field, labelled `endingText`, in the page's language,
   focused, with the counter `n / 19` and the field rules every field has (28.3, 28.4, as
   #172 amends them); `confirm` is enabled once the field holds a character that is not white
   space, Enter confirms, `cancel` closes. `confirm` sends `POST .../nodes { from: { node,
   link: 'end', label: { <lang>: <text> } } }`; the store writes `terminal: { label }` with
   `""` for every other declared language (each a to-do). Afterwards the badge **is** that
   field, in place on the rim (path `terminal.label.<lang>`, limit 19, the counter and the
   missing-language tags on the right rim, 28.3): blurred it shows the badge as the public
   page does; focused it shows the text as typed, without the capitals transform, so a
   creator sees what they write. The four outcomes are offered nowhere.

## Alternatives rejected

- **Keep `outcome` as an optional styling hint beside `label`.** It is hidden state: the owner
  ruled out asking for it, so the editor could neither show it nor change it, and a converted
  `prohibited` ending would keep a red that no ending made in the editor can have. It keeps
  legal vocabulary in a format the owner wants usable for every kind of Tree, and it is two
  ways to say how an ending looks.
- **A neutral tone in its place** (`tone: negative | neutral | positive`), offered in the
  editor. A choice the owner did not ask for -- "just let the user enter a text" -- and
  against the owner's own principle for the Answer buttons: "we don't want to steer the user
  with the button colors" (#75). An ending's words say how it ends.
- **The four colours kept for converted Trees** by any key. The same hidden state, for the
  two Trees of this repository.
- **A longer cap with a new place for the badge where the Bubble narrows**, e.g. under the
  arrow across the whole band below 792 pixels as #82 does below 480: about 29 characters at
  321 pixels wide. Rejected for now: between 480 and 791 the editor's step controls take the
  right half of the band (`application.md` 30.8; #178 replaces them), below 640 pixels tall
  the arrow's foot stands in the band, and the Terminal would need re-measuring at every
  width there. A later issue can take it if 19 proves short. A longer limit is a change to
  the limits, which `tree-format.md` section 10 publishes as a new format number,
  `elsa-tree/6`; the one exception on record is #102's cut, which the owner took under an
  unchanged number (`tree-format.md` 5.7).
- **20 characters** (this ADR's first version), at the same tracking. One character more, but
  three of the seven 20-character endings measured take a second line in DejaVu Sans Bold at
  480 to 491 pixels wide. Nothing scrolls -- the badge is placed on the rim and grows with its
  text -- but the badge is then 46 pixels tall and covers the top of the title, against 10.1's
  "Nothing on the rim takes a pixel from the text area", in the face 10.7 re-derives the
  buttons' widths in. 19 holds one line there for every ending measured.
- **19 characters at the unchanged 0.12 em**, with no rule for narrow widths. Every face
  measured but DejaVu Sans Bold holds it, Arial Bold's widest with 0.3 pixels to spare; in
  DejaVu Sans Bold five of the seven 19-character endings measured take a second line at 480
  pixels wide, with the same overlap. A cap below 19 would refuse the conversion's own
  `Niet van toepassing`.
- **No cap, or the title's 80.** The badge is one line on the rim; 80 capitals are some 620
  pixels. The owner asked for a cap.
- **A cap in words** (the owner's "wordcap" taken literally). Every other limit of the format
  is characters by 3.8, and a word count does not bound the width the badge needs:
  `Transparantieverplichtingen` is one word of 27 characters.
- **`terminal` itself as the localised text** (`"terminal": { "en": "..." }`). One level
  less, but the marker's key set and the language tags would share one object, and the
  schema could no longer refuse an `outcome` left behind by a hand edit.
- **The words in the Answer row, on `startAgain`, or in a row of their own.** The badge has
  been where a Terminal says how it ends since #41; a row of its own would cost the Bubble
  height and re-cut every limit of 5.7.

## Consequences

- The format changes shape, so it changes number: `elsa-tree/5`, with the conversion of
  every `elsa-tree/4` file (`ADR-171-elsa-tree-5.md`).
- Every reader of `terminal.outcome` is listed, with what it does afterwards, in
  `application.md` 36.2 (new); #179 builds all of them.
- `ADR-4-terminal-marker.md`'s "the frontend ships a styling table with four rows and never
  needs another" ends: it ships one style.
- The first Tree's four endings keep their words in both languages (`tree-format.md` 12.7.3);
  `not-an-ai-system`, a `refer` ending, keeps its colour too, and at 792 pixels wide and wider
  its whole look (below that, every ending's tracking tightens, decision 6). The other three
  change colour to the accent's reading shade, and `prohibited` loses its `danger` outline.
  Before this ADR the spec and the build already disagreed on those colours -- 10.3 said
  `danger` for `prohibited` and `accent` otherwise, while #41 painted `not-applicable` in
  `text-muted` and `applicable` in `accent-secondary` -- and both go.
- `chrome.test.ts` loses its "every outcome badge is at most 40 characters" row: the words are
  the Tree's now, and V-LENGTH holds them to 19.
