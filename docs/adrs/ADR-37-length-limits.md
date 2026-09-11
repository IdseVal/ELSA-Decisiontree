# ADR-37-length-limits: every user-facing text has a maximum length and every list a maximum count, the same for every language, derived from a stated viewport and Bubble; rich text is also bounded by an estimated line count

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #37 -- Architecture: freeze elsa-tree/2
- Spec: `docs/specs/tree-format.md`, sections 3.8, 5.7; rules V-LENGTH, V-LINES, V-COUNT

## Context

The owner (issue #35): "Everything that is on an opened node should fit on the screen,
inside the bubble. We absolutely cannot have any scrolling on the page." and "we have to
have max length on content, and in some cases must make the decision-tree multistep
where we now made it single step or we collapse duplicate sentences." The core document
(3.1, 3.2, 9, revised 2026-09-09) makes this a hard rule met on the data side by length
limits fixed by the format and enforced by the validator, and on the frontend side by a
layout for a stated viewport that issue #38 fixes. The issue asks for the limits with
the assumptions written down so #38 can confirm or correct them.

What the first Tree looks like today (measured 2026-09-10 over both languages of all
61 Nodes): descriptions run from 560 to 3,100 characters, median about 1,200; titles
up to 131 characters; Option titles up to 131; Source labels up to 229; up to 20
Options and 4 Sources on a Node. The owner's own example of the new size -- a title
"Jurisdictional scope of the AI Act? (1/7)" and three sentences of content -- is about
300 characters.

## Decision

1. **Limits, per field, the same for every language** (spec 5.7): Node and Tree title
   80 characters; Node and Tree description 600 characters *and* 8 estimated lines;
   Option title 60; Source label 60; Image description 120; credit 120; logo `alt` 80;
   font family 64; licence 200. **Counts**: 3 Sources, 8 Options, 10 Images per Node,
   3 Images per Option, 2 font families of 8 files.
2. **How text is counted** (spec 3.8): Unicode code points of the trimmed value, with
   Markdown links replaced by their text; everything else, including emphasis markers,
   counts. Simple to state, simple to implement in any language, and slightly
   conservative.
3. **Rich text is also bounded by an estimated line count**, computed as a renderer
   would lay the text out at 75 characters per line: each paragraph or list item takes
   `max(1, ceil(characters / 75))` lines, and each blank line between blocks takes one.
   Height, not length, is what overflows a Bubble: five short paragraphs take more
   space than one long one, and a character limit alone cannot see that.
4. **The assumptions** are in spec 5.7 as a table: a 1280 x 640 CSS-pixel viewport (a
   1366 x 768 laptop, or a 1920 x 1080 one at 150 % scaling, minus browser chrome and
   taskbar); a vertical budget of chrome 44, Trail 64, Bubble 360, outgoing Branches
   64, Carousel 80, disclaimer 28; a 640 x 304 text area inside the Bubble; 16 px body
   text at 24 px line height and 8.5 px average advance (75 characters per line); a
   22 px title (2 lines for 80 characters); 13 px Sources (2 lines for 3 labels of 60).
   The description gets what remains: 192 px, 8 lines, 600 characters. Option Branch
   labels at 13 px on 20 px lines in 150 px give 8 Option Branches side by side across
   1280 px, with a 60-character title on at most 3 lines (60 px, inside the 64 px row);
   a Node that shows its 2 Answer Branches as well needs 1500 px at that width, which
   #38 resolves. Answer and Trail Branches carry a Node title of up to 80 characters:
   the 2 Answer Branches have 640 px each, so 1 line; a Trail of up to 6 Nodes fits at
   213 px each (at most 3 lines, 60 px); a longer Trail, which the format does not
   bound, is #38's to truncate, wrap or collapse.
5. **The rules report actual against maximum** (`description.nl: 9 lines > 8`,
   `title.en: 96 > 80`), so an author knows how much to cut, and the migration's report
   is the content issue's work list.

## Alternatives rejected

- **A larger budget for languages whose words run longer (Dutch is about 18 % longer
  than English in the first Tree).** The Bubble is the same size whatever the language;
  a Dutch text that is allowed 700 characters where English is allowed 600 overflows
  the same Bubble. The same number for every language is the only rule that means what
  it says; the consequence is that the Dutch version is cut harder, which is how it is.
- **A character limit only, no line estimate.** Simpler, and wrong for the case that
  actually overflows: a 400-character description written as six one-line bullet points
  and two paragraphs renders on 12 lines. The estimate is deterministic, ten lines of
  code, and reports a number the author understands ("9 lines, at most 8").
- **A rendered-height check in a browser instead of an estimate.** Exact, but it makes
  the validator depend on a browser, a font and a layout, and it runs in seconds instead
  of milliseconds; authors would not run it before every commit. #38's browser test
  measures the real thing on every Node kind at the guaranteed viewport; the validator's
  estimate is the fast, portable approximation that makes the browser test pass.
- **Limits chosen to fit the first Tree as it is (about 3,000 characters).** Would need
  a Bubble that scrolls or a viewport no laptop has, which is the thing the owner
  forbade. The owner said the content will be cut into steps; the limits are what make
  that cut necessary and visible.
- **No count limits, only text limits.** Twenty Option Branches out of one Bubble do not
  fit 1280 px at a readable size, and the page may not scroll sideways either. A list
  longer than 8 becomes several steps, exactly as the owner's "(1/7)" pattern does for
  the seven jurisdiction categories; the count of entries is preserved across the
  steps, which is what #44's structure test checks.
- **A single total budget per Node (e.g. 800 characters over title, description and
  Sources together) instead of per-field maxima.** Flexible, but the fields sit in
  different places at different sizes, so the same total fits or does not depending on
  where the characters are; per-field maxima with a stated per-field budget are what
  #38 can verify one row at a time.
- **Warnings instead of errors past the limit.** The frontend would then have to
  handle overflow, which is a scrolling Bubble by another name. Strict, like every other
  rule (`ADR-4-validity-rules.md`).

## Consequences

- Converted as it stands, every Node of the first Tree and its manifest break at least
  one limit (measured: 327 V-LENGTH, 124 V-LINES and 3 V-COUNT violations across both
  languages). That is the expected result; the migration reports them and #44 cuts.
- Issue #38 must confirm the assumption table or correct it on #37; a corrected limit is
  a new format number, because a Tree that validates today must keep validating.
- The chrome sentence "This is an explanation only. Go back to the previous step to
  answer", which the 0.1 Trees repeated on every explanation Node, is no longer written
  in Trees; the frontend says it.
- A Theme author who chooses an unusually wide body font has chosen shorter text; the
  estimate assumes a humanist sans-serif of ordinary width.
