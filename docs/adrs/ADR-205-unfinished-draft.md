# ADR-205-unfinished-draft: the preview shows what a reader would see of the draft as it stands, a bracketed placeholder where it has no text yet, and nothing more -- no to-do count, no mark on a step

- Status: ACCEPTED (frozen) -- 2026-10-04; decides core document 10.41 (what a reader sees of a
  draft that is not valid yet: a missing title or text in a language, a step without Answers or an
  end, an ending without words, a picture without a credit)
- Issue: #205 -- Architecture: the preview of a hidden Tree as its readers will see it -- its
  address, what it shows of an unfinished draft, and its two buttons at the top left
- Spec: `docs/specs/application.md` 40.7 (new); 3.2 amended, marked **[#205]**
- Amends: nothing frozen. `text()` (3.2's `missingText`, issue #9) and the public components are
  unchanged; the preview writes its placeholders before they draw
- Depends on: `ADR-132-draft-and-publish.md` (a draft's advisory rules), `ADR-205-preview-drawing.md`
  (the draft through the public components, the centre rule), `ADR-176-floating-settings-and-to-do.md`
  (the to-do list's place)
- Built by: #206

## Context

What the editor saves is a draft: a file in the Tree format whose completeness and size rules are
advisory (19.1, 19.2; `tree-format.md` 7). A step may lack its title or its text in a language, an
Answer or an end; an ending may lack its words in a language; a picture its credit or its
description. Every public component draws a published Tree, which passes every rule (19.3), so
none of these states ever reaches a reader. For the one that could -- a Tree changed under a
running server -- the public page already shows a placeholder: `text()` answers
`[Text missing in this language]` / `[Tekst ontbreekt in deze taal]` (`missingText` in brackets)
for a localised text without the language on screen, and warns on the server, because there it is
an authoring error. A draft also holds an emptied field as `""`, which `text()` draws as nothing.
The ending's badge holds at most 19 characters (36.1); the editor's placeholder for an ending
without words, `endingText` ("Text of the ending" / "Tekst van het einde"), is held to 19 for that
reason (3.2). A picture's credit is one text for every language (`tree-format.md` 5.2). The to-do
list -- the draft's advisory violations -- is the editor's, in a bubble at its top right (33.3,
#176).

## Decision

1. **What a reader would see, and nothing more.** The preview draws the draft as it stands
   through the public components. It shows no to-do count, no banner and no mark on a step, and
   it does not say whether the Tree may be published: that is the editor's to-do bubble (33.3),
   one click away through the way back, and a creator who walks the preview sees what is missing
   where it is missing (decision 2).

2. **A placeholder where the draft has no text yet, in brackets, in the text's own place.** For
   every localised text the draft lacks in the language on screen -- its key absent, the language
   absent, or `""` -- the preview draws the public page's placeholder, `[` `missingText` `]` in the
   chrome language (3.1): a step's title and text, a Source's label, an Option's title, an
   explainer's term and its text, a picture's description (its alternative text), the logo's
   alternative text, and the Tree's title (in the bar where it has no logo, and in the tab's
   title); and so wherever another element shows that text: an Answer button's label (its
   target's title), the up arrow's name, an Overlay's heading. Two places hold less, and show the
   editor's own placeholder for them:
   - **the ending's badge** -- at most 19 characters, which the bracketed placeholder's 31 are
     not -- shows `endingText` for an ending without words in the language on screen: "Text of the
     ending" / "Tekst van het einde", the words the editor's empty badge field shows (36.3);
   - **a picture's credit**, one text for every language, which "Text missing in this language"
     would misdescribe, shows `[` `placeholderCredit` `]`: "[Maker and licence]" / "[Maker en
     licentie]", in the enlarged view after `credit` and as the picture's description for a
     screen reader (12.3).

   Each placeholder is within the limit of the text it stands for (`tree-format.md` 5.7: 31
   characters where the least is a term's 40; 19 in the badge, whose limit is 19; 19 for a credit
   of 120), so a draft within the format's limits fits as a valid
   Tree does (10.6, 10.7). The preview's page writes them into the copies of the Nodes, the title
   index's answers and the manifest it hands the components, for the language on screen only
   (`src/admin/preview.ts`), so no public component changes and `text()` meets no missing text:
   the server logs nothing for them, since a draft's missing text is a to-do (19.2), not the
   authoring error `text()` reports.

3. **A step without Answers or an end is drawn as it stands.** A question step with one Answer
   shows that Answer's button alone, in its place -- yes at the left, no at the right -- and the
   other place empty. A step with neither -- a fresh step a yes or a no made, or a root not yet
   given any -- is the centre where its path ends (the editor's centre rule,
   `ADR-205-preview-drawing.md` decision 2) and shows `startAgain` below it, as the public tree
   view draws an explanation Node shown as the centre (10.3). Nothing more says it is unfinished.

4. **Every other advisory rule is drawn as the public components draw it.** A text over its
   length or its lines (V-LENGTH, V-LINES) is shown whole, as the editor shows it (28.4, amended
   by #172: "A text stored over its limit is shown whole"); a list over its count (V-COUNT, a
   hand-written file), an unreachable step (V-REACH, V-ORPHAN, reached by its address), a term not
   yet marked or a mark to a removed explainer (V-EXPLAINER, V-MARK), an Answer or an Option whose
   target is not yet of its kind (V-ANSWERS, V-OPTIONS): as the components draw them, nothing
   added. The no-scroll guarantee of 10.6 covers the drafts within the format's limits, as it
   covers the valid Trees on the public page and the drafts in the editor (28.6); a draft over a
   limit may overflow its box in the preview as in the editor, and the to-do list names it.

## Alternatives rejected

- **The to-do count, a banner, or "not ready to publish" in the preview.** Not what the readers
  will see, which is what the owner asked for; the editor has the list, in the bubble the owner
  placed at its top right (#169: "make it a bubble on the top right"), and the way back leads
  there.
- **Refusing to preview a draft with violations** (the to-do list in its place). The owner wants
  to see the Tree as it grows; most of its life a draft has a to-do.
- **The Tree's default language in place of a missing one**, as a tile of the overview shows a
  title not declared in the page's language (23.2). It hides the gap: the creator would read the
  English and not see that the Dutch is missing.
- **Nothing where a text is missing** -- what `text()` draws for `""`. An empty title or Answer
  label reads as a broken page, and a creator cannot tell a missing text from a layout fault.
- **The editor's placeholders everywhere** ("Title", "Text", "Side bubble title"). They are field
  labels: in the Bubble, a step titled "Title" reads as content. The bracketed `missingText` is
  what the public page already says for a missing text; the two exceptions above are where it does
  not fit or would say something untrue.
- **`[Text of the ending]` in the badge, bracketed like the others.** 20 and 21 characters, past
  the 19 the badge's room was measured for (36.1).
- **Teaching `text()` that `""` is missing too.** A change to every public page for a state no
  published Tree holds, and the server would log every missing text of a draft as an error at
  every preview.

## Consequences

- `src/admin/preview.ts` (new, #206): the draft as the preview reads it -- `getNode`, `getTitle` and
  `manifest` answering copies with decision 2's placeholders for the language on screen -- beside
  `previewMode`.
- `application.md` 3.2's table gains #206's row; 40.7 is the contract.
- `tests/admin/preview.test.ts` and `tests/browser/preview.spec.ts` (#206) assert each placeholder,
  the one Answer, `startAgain` below a fresh step, no to-do count on the page, and nothing logged
  (40.9).
