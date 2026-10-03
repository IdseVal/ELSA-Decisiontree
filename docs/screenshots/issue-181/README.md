# Issue #181: the owner's fifteen points of #169, walked as one interface

Taken 2026-10-03 on Windows 11 with the headless Chromium of Playwright 1.62.1, from `dev` at
ff21fdd (#172 to #180 merged) plus this branch's fixes, built at 182b222 with `npm run build`
and served by the standalone server. 138 screenshots: 23 steps in each walk, step 23 (the public
side bubble) included on a phone since the second review round.

`ELSA_SHOTS=1 npx playwright test tests/browser/creation-walk.spec.ts` takes them (without
`ELSA_SHOTS=1` they go to the gitignored `tests/browser/.results/shots/issue-181/`). Six walks,
each on a Tree of its own in its chrome language: 1280 x 640, 1920 x 1080 and 390 x 844, in
English and in Dutch. A creator signs in, makes a Tree, fills its first step (title, text, three
pictures with credit and description, a Source), adds yes and no, ends a step with typed words,
adds eight side bubbles and fills one, deletes a side bubble and a step, opens the to-do bubble
and the settings panel, changes the colours and the fonts, publishes and opens the public page
(on a phone it opens the side bubble from the Options list, the public page's way there).

Each file is `<step>-<lang>-<width>x<height>.png`. At every step the page is audited, and
`measurements-<lang>-<size>.md` holds the rows: 10.6's no-scroll test, controls drawn over each
other, controls and text crossing the box they are drawn in, and chrome words of the other
language. The walk asserts all four. It also audits its two scroll boxes, the to-do bubble and
the settings panel, at every scroll position 12 pixels apart, and asserts that no control is
drawn over another at any of them. Every row reads `none` in every column, here and in the
Linux container that reproduces the CI runner's fonts.

| # | The owner's point (#169) | Screenshot | Built by | Verdict |
|---|---|---|---|---|
| 1 | An "i" behind credit and description explaining why each is asked | `03-attach-sheet-credit-hint-*` | #174 | As asked. Each field now holds its 120 characters in three lines (fixed here, see below). |
| 2 | Placeholders that say what belongs in the field; boxes sized for their text that stop at the cap | `01-empty-step-*`, `11-new-side-bubble-*`, `09-ending-typed-*` | #172 | As asked for every field. **Differs** in one place: an Answer button to a step with no title yet still says "Yes: [Text missing in this language]" (`08-yes-and-no-*`), finding C. |
| 3 | "Sources" instead of "Legal sources" | `07-source-added-*`, `22-public-page-*` | #173 | As asked, in the editor and on the public page ("Bronnen" in Dutch). |
| 4 | The side bubble opens at once; title, text and picture entered there by the same rules | `11-new-side-bubble-*`, `12-side-bubble-filled-*` | #177 | As asked: one click on the + opens it empty, with the Bubble's placeholders and boxes. |
| 5 | Sources enterable in the side bubble | `12-side-bubble-filled-*` | #177 | As asked: inline at 1280 and 1920, in the collapsed "Sources (1)" Sheet at 390. |
| 6 | No "new side bubble" inside it; "Delete side bubble" below in the middle | `11-new-side-bubble-*`, `14-delete-side-bubble-asked-*` | #177 | As asked: the button at the panel's foot asks once, naming the side bubble. |
| 7 | "Add an extra image" on hovering the picture's + | `05-add-an-extra-image-*` | #174 | As asked. |
| 8 | Listed images 1.4 times as big, in the editor and on the public page | `06-three-pictures-*`, `22-public-page-*` | #174 | As asked: 67-pixel thumbnails where they were 48. |
| 9 | Bigger side bubbles, a cap of 8, the picture circle on the button's contour | `13-eight-side-bubbles-*`, `22-public-page-*` | #175 | As asked at 1280 and 1920: eight buttons and no + at eight. **Not reachable on a phone**: at 390 wide the + is gone from two side bubbles on (finding A). |
| 10 | "Tree ends here" asks for a text with a cap | `09-ending-typed-*`, `10-step-ends-here-*` | #171, #179 | As asked: one field with a live "14 / 19", the words on the badge. |
| 11 | A red cross and "Tree does not end here after all" in place of the dots; no dots on the next steps | `10-step-ends-here-*`, `15-delete-step-asked-*`, `13-eight-side-bubbles-*` | #178 | As asked: no `...` on any step, Answer or side-bubble button. A Source keeps its own `...` (its kind and link). |
| 12 | Every input and font elegant, nothing exceeding its parent box | the whole walk, `measurements-*.md` | #172, and this issue | Five defects fixed here (below); the rest are findings for the owner. |
| 13 | Top-right names that say what opens: "Decision-tree settings", "Account" | `01-empty-step-*`, `17-settings-panel-*` | #176 | As asked. |
| 14 | The to-do a bubble at the top right, the settings button floating, neither in the header bar | `01-empty-step-*`, `16-to-do-bubble-*` | #176 | As asked. **Differs in Dutch**: the to-do lines are the validator's English messages (finding B). |
| 15 | Colours that leave the bars alone; the text colour on the Sources; font and licence dropdowns with upload; hints | `18-colours-changed-*`, `19-font-from-the-dropdown-*`, `20-licence-dropdown-*`, `22-public-page-*` | #171, #180 | As asked: the bar and the panel keep the default look, the Sources take the text colour, Faustina from the dropdown, an uploaded WOFF2 with its licence from the dropdown, an "i" behind each part. The panel's cross lay over its controls when the panel was scrolled (on CI's fonts at step 18, 1280 x 640); fixed here, fix 5. |

## Fixed here, each with the check that guards it

1. **The attach Sheet's credit and description crossed their box.** One-line inputs scrolled a
   credit longer than their 229 pixels out of view: 10.6's test failed at step 03 in every Dutch
   walk ("ELSA-project, voorlopige afbeelding", 238 in 229) and in English at 390 wide. They are
   three-line boxes now, their labels above them, as the enlarged view's credit and description
   are two-line fields. Guard: the walk's 10.6 check at step 03 and a 120-character credit and
   description held whole in each box at every walk; `tests/editor/pictures.test.tsx` for Enter.
2. **On a phone the side bubble's close cross lay over its title** (the editor's field, 24 x 28
   at 390 wide; on the public page a long title's link, the overlay fixture's 80 characters at
   390 x 844). Below 792 wide the title keeps clear of the cross on both sides, in the editor and
   on the public page alike, so the field's region stays the public title's box (28.1). Guards:
   the walk asserts no two controls overlap; `overlay.spec.ts` checks that no line of that long
   title lies under the cross at 390 x 844 (it fails with the editor-only rule: the first line
   ran to x 353 under the cross).
3. **A lone dot began the line of "+ Add a source"**: the Sources' separator stood before the
   add button too. Guard: the walk reads the button's separator, which must be none.
4. **The settings panel's text fields were 16 pixels among 13-pixel dropdowns** (the language to
   add, the font's family name and weight). Guard: the walk compares the panel's controls' sizes.
5. **The settings panel's cross lay over its controls once the panel was scrolled.** The cross
   stood over the panel's scroll box, so Invite and Hand over slid under it: CI's walk failed at
   step 18 at 1280 x 640 (`button.sheet-close.sheet-close--cross and button.admin-submit by
   24x12`, reproduced in the Linux container), and on the full-Node fixture here they lay under
   it at 122 of the panel's 345 scroll positions. The heading is now a band across the top that
   stays while the body scrolls under it, with the cross in it (33.2, amended); the to-do bubble's
   heading is the same band. Guards: the walk's sweep of both scroll boxes, and step 18 itself.

## Found and not fixed (for the owner to turn into issues)

- **A.** On a phone the fan's + is gone once a step has two side bubbles (10.5 collapses the
  Options into a list, and the + goes with them): side bubbles 3 to 8 could not be made at 390
  wide, and the walk made them through the API. `13-eight-side-bubbles-*-390x844`.
- **B.** The to-do bubble lists the validator's messages in English in the Dutch editor; one
  untitled side-bubble button gives a line that names only its step, six alike; an untitled
  step is named by its id. `16-to-do-bubble-*`.
- **C.** An Answer button to a step without a title says "Yes: [Text missing in this
  language]" in the editor, the phrase of point 2. `08-yes-and-no-*`.
- **D.** Two button styles for one kind of choice: the attach Sheet's Attach and Cancel are
  outlined pills; the ending Sheet's and the delete questions' Confirm is a filled rectangle
  with Cancel as an underlined link, and the ending Sheet adds a Close pill beside its Cancel.
  `03-*`, `09-*`, `14-*`, `15-*`. Which style is the standard is the owner's choice.
- **E.** A side bubble's title starts at the top of its five-line box in the editor and is
  centred on the public page, and Dutch titles break differently ("han-del brengen").
  `13-eight-side-bubbles-*` beside `22-public-page-*`.
- **F.** On the public page a side bubble whose step has no picture shows an empty circle.
  `22-public-page-*`.
- **G.** The settings panel's language field has no placeholder and is named "Add", its
  button's word. `17-settings-panel-*`.
- **H.** On a phone a picture just attached is hidden at once (10.5, step 5), where the empty
  slot was shown; only "Image 1 of 3" says it is there. `12-side-bubble-filled-*-390x844`.
- **I.** After publishing the settings panel shows the public link twice, under Publish and
  under This Tree (both as 33.3 and 33.5 say). `21-published-*`.
- **J.** On a phone the public side bubble shows neither its picture nor its Sources. 10.5 hides
  the main image (step 5) and the inline Sources (step 6) on every Node below 792 wide, and an
  Overlay has no strip control and no collapsed Sources to reach them by; 30.5 records the Sources
  half as the public page's state since #80. `23-public-side-bubble-*-390x844`.
