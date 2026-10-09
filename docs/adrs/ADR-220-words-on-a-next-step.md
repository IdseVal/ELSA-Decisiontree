# ADR-220-words-on-a-next-step: every next step carries its creator's words, at most 19 characters per language, and its button shows those words alone; a yes and a no say "Yes" and "No" as Tree content

- Status: ACCEPTED (frozen) -- 2026-10-09; the owner may overrule (core document 10.43)
- Issue: #220 -- Architecture: freeze how many next steps a step may have
- Spec: `docs/specs/application.md` 3.2, 10.3, 41.2 (new); `docs/specs/tree-format.md` 5.3, 5.7,
  amended `[#220]`
- Core document: 3.2 (the Branch "showing its target's title", the chrome yes/no labels), 3.4
  `[#219]` ("a step that is a yes and a no stays one", confirmed), 10.43
- Measurements: `docs/research/issue-220-answer-row-room.md` sections 2 and 5
- Supersedes in part: `ADR-78-answer-buttons-and-up-arrow.md` decision 1 (the label "is the
  chrome word, a colon and the target's title"); the amendment of 2026-09-18 by #82 (below 480
  pixels the chrome word alone) in `application.md` 10.3 and 10.5
- Built by: #221; #222 for the field in the editor

## Context

A button said the chrome word "Yes" or "No", a colon and the next step's title -- "Yes: Annex III
areas" -- in one run of 19-pixel bold, at most two lines in 580 pixels of label, and below 480
pixels wide the word alone (`application.md` 10.3). No chrome word names a third or fourth next
step. The measurement (`docs/research/issue-220-answer-row-room.md` section 2):

- the next step's title of 80 characters takes three or four lines in a button of 406 or 300
  pixels, more than the 60 the row has at 1280 x 640;
- a label of up to 19 characters takes one line in a button of 300 at 1280 x 640, two lines in
  every arrangement of `ADR-220-answer-row.md` from 390 pixels wide, and up to three in the
  widest face below 390; 25 characters already take three lines at 390 to 480 wide in Verdana
  and need windows up to 584 tall below 390.

The format already holds one text of this kind: the ending's words on a Terminal's badge, a plain
localised text of at most 19 characters, since #171 (`tree-format.md` 5.5).

## Decision

1. **Each next step carries a `label`**: a plain localised text, the creator's words for that
   choice, **at most 19 characters** in every language (`tree-format.md` 5.3, 5.7; V-LENGTH,
   V-L10N, V-PLAIN), the same cap as the ending's words.
2. **The button shows the label alone**, at every width and for every number of next steps. The
   next step's title is not drawn on it. The button's **accessible name** is the label, a colon
   and the next step's title -- "Yes: Annex III areas" -- as dev's name has been at every width
   since #82, so a screen reader still hears where it leads (WCAG 2.2 SC 2.4.4); the page it
   leads to shows the title.
3. **A step that is a yes and a no stays one, in its words.** The migration (`tree-format.md`
   12.8) writes `Yes` / `No` -- `Ja` / `Nee` for a language whose primary subtag is `nl` -- into
   the labels of every existing step, the words its buttons showed. From then on "Yes" and "No"
   are Tree content, translated by the Tree's author, not by the frontend. The chrome keys `yes`
   and `no` stay, for the editor's `+ Yes` and `+ No` (`ADR-220-editing-next-steps.md`); the
   public page no longer reads them.
4. **The rule of 480 pixels goes**: below 480 wide a button shows its label as at every other
   width, since a label is short enough to fit there (at most three lines below 390, two above,
   measured).

## Alternatives rejected

- **The next step's title alone.** Measured not to fit three or four buttons at 1280 x 640.
- **"Label: title" on a step of two, the label alone on three or four.** Two buttons of one
  row would then look different from three, which the owner's rule of #75 -- one layout for every
  button -- is read against (`ADR-220-answer-row.md`); and the label and an 80-character title do
  not fit two lines of 580 pixels unless the label is four characters long.
- **Chrome words "Yes" and "No" for a step of two, the creator's words for more.** Two kinds
  of step in one format, a step of two whose choices are not yes and no ("Provider" /
  "Deployer") impossible, and a third rule for which words a button shows. One kind, with the
  owner's yes and no written by the migration, holds every case.
- **A longer cap, 25 or 30.** "Gebruiksverantwoordelijke" (25) would fit, but 25 takes three
  lines at 390 to 480 pixels wide and four below 390 in the widest face, where the page then needs
  windows up to 584 tall (measured). 19 is the ending's cap already, and the room's.
- **Numbers or letters on the buttons** (A, B, C). They say nothing of the choice; the reader
  would have to read it elsewhere, and the Bubble has no room for a legend.
