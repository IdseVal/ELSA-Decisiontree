# ADR-133-bubble-edited-in-place: every field is an editable region where the end user sees it; the language switch is the editing switch; the counters count as the validator counts and typing never stops at a limit; the description is edited as its source text; the no-scroll rule stands and every control the editor adds lives outside the text area

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 28 (new); 3.2 amended (new keys)
- Amends: `docs/adrs/ADR-38-no-scroll.md` (the rule holds in the editor; what the editor
  adds is placed on the rim and in the chrome bar), `ADR-78-main-image-and-row-budget.md`
  (nothing the editor draws takes a pixel from the text area), `ADR-37-length-limits.md`
  (the counting functions move to a module of their own, unchanged)
- Depends on: `docs/adrs/ADR-133-reuse-rule.md` (the `edit` seam the fields hang off),
  `ADR-133-autosave.md` (what a field does with its value), `ADR-132-draft-and-publish.md`
  (an over-limit write is stored and reported), `ADR-132-editor-api.md` (the field paths)

## Context

The owner: "The new datastructure creation looks exactly like the final datastructure,
but, the fields in the bubble are editable". The Bubble's Interior is frozen (10.3): the
main image, the title, the description with its marked terms, the "Legal sources" heading
with the Sources; a Terminal's outcome badge on the rim. Every text is per language
(`tree-format.md` 3.3) and every field has a maximum (5.7) measured by one rule (3.8), and
#132 decided that a write over a maximum is **stored** and answered with the violation
(22.3): "the draft holds the text and says by how much it is over; Publish is where a limit
is a wall". The page must never scroll (10.6), and the length limits are derived from a
text area of 640 x 364 that nothing on the rim may take a pixel from (10.1).

The description is rich text in a fixed Markdown subset (3.4) of at most 150 characters and
2 lines, rendered by `src/markdown.ts`, the one renderer; a marked term is a link with a
fragment target in that text (5.9).

## Decision

1. **Each field is an editable region in the place the end user sees it**, rendered by one
   client component, `Field`, where the public component renders a text (`ADR-133-reuse-rule.md`,
   decision 2). The fields of a Node's Interior, with their paths of 22.2 and limits of 5.7:

   | Where | Field | Path | Limit |
   |---|---|---|---|
   | The heading | title | `title.<lang>` | 80, plain |
   | The text | description | `description.<lang>` | 150 and 2 lines, rich |
   | Each Source's line | label | `sources[i].label.<lang>` | 60, plain |
   | A Source's `...` Sheet | kind (a select of the three), URL | `sources[i].kind`, `sources[i].url` | -- |
   | The rim of a Terminal | outcome (a select of the four, drawn as the badge) | `terminal.outcome` | -- |
   | An Option button | the Option's title | `options[i].title.<lang>` | 60, plain |
   | The enlarged view | an Image's description, credit | `images[i].description.<lang>`, `images[i].credit` | 120, 120 (`ADR-133-images-in-the-editor.md`) |
   | The explainer Sheet | term, text | `explainers[i].term.<lang>`, `explainers[i].text.<lang>` | 40, 200 (`ADR-133-explainers-in-the-editor.md`) |

   A plain field is a single-line region (Enter blurs it; a pasted line break becomes a
   space, because V-PLAIN is blocking and a `\n` would be refused). A `+ addSource` control
   after the last Source (absent at three, V-COUNT) sends `add-source` with an empty label
   and the `legal` kind and focuses the new label; a Source's `...` opens its Sheet, which
   also holds `removeSource`. The Tree's own `title` and `description` are fields too, in
   the top panel (`ADR-133-top-panel.md`, decision 5), with 80 and 600 / 8.

2. **The language switch is the editing switch.** The chrome bar's `LanguageSwitch` is
   unchanged and lists the draft's declared languages; the page's language (4.1, `?lang`)
   is the one every field edits and saves under (`<field>.<lang>`). One language at a
   time, by construction: a field holds one string. A field whose text is missing or empty
   in the page's language is an empty region showing `missingText` as a placeholder in
   `text-muted`, never saved as such; typing into it writes the language.

3. **The rim shows which languages still lack a text.** While a field has the focus, the
   right rim (60 pixels wide, 10.1) shows at the field's height a **counter pill** and,
   under it, one **tag per other declared language that has no text for this field** (from
   the draft Node the page carries, updated from every write response), each tag a link to
   the same page in that language (`withLang`), so the way to the Dutch title is one click
   from the English one. A field with every language written shows no tag. On the left rim
   nothing is drawn. The Overlay's Interior, edited in place inside the Sheet
   (`ADR-133-structure-editing.md`), has the same rim and the same rule.

4. **The counters count exactly as the validator counts.** The pill shows `n / max` for the
   page's language, `n` being `countedLength` of the field's text (3.8: links and marks
   count their text, `é` is one character), and for the description also `lines / 2` from
   `estimatedLines`. The two functions, with `countedText`, **move to a module of their
   own, `src/tree/measure.ts`**, pure and free of `ajv` and the schema, from which
   `validate.ts` and `markdown.ts` import them; `validate.ts` re-exports the three names so
   no test changes. `Field` imports that module and `markdown.ts` (decision 6) and nothing
   else of `src/` -- the one exception, by name, to section 6's rule that a client
   component imports no server module, made because the alternative is a second
   implementation of the rule that decides whether a Tree publishes.

5. **At the limit typing does not stop; the field is marked and the write is stored.**
   Above the maximum the pill turns `danger`, the region's outline turns `danger`, the
   write goes as every write does and is answered 200 with V-LENGTH or V-LINES (22.3), and
   the violation's message ("Title: 93 of 80 characters", the validator's own text) is
   shown in the **autosave indicator** of the chrome bar while the field has the focus or
   was the last edited (`ADR-133-autosave.md`, decision 3), and in the top panel's to-do
   list for as long as it holds. Nothing is truncated, nothing is lost: the owner asked
   for the limits *live* (#138), which means shown. The one place a limit is a wall is
   Publish (19.3).

6. **The description is edited as its source text.** Blurred, the region shows the rendered
   text -- `richTextToHtml` on the client, the same function the server used, with the
   Node's explainers so the marked terms look and hover as on the public page. Focused, the
   region shows the **source**: the Markdown subset of 3.4 as written -- `*emphasis*`,
   `**strong**`, `- ` lists, `1. ` lists, `[text](https://...)` links, `[term](#id)` marks --
   with Enter inserting a line break (`\n`) and a blank line starting a paragraph, as the
   file has it. That is all the rich text the editor offers: **no toolbar, no WYSIWYG**,
   and the one control of `ADR-133-explainers-in-the-editor.md` (mark a selection). A
   pasted text is inserted as plain text; `<` followed by a letter, `/` or `!` is refused
   at the field with V-HTML's message before sending (V-HTML is blocking, 19.2). At 150
   characters and two lines there is no room for formatting a toolbar would help with; a
   paragraph and a list are the two shapes the first Tree uses.

7. **The no-scroll rule holds in the editor, unchanged, and every control the editor adds
   lives outside the text area**: the counter and the tags on the right rim (decision 3);
   the violation and the save state in the chrome bar; the structure buttons in the Answer
   row, in the buttons' own places (`ADR-133-structure-editing.md`); the side-bubble `+` in
   the fan's next free slot; the strip's `+` in the strip band (`ADR-133-images-in-the-editor.md`);
   the Terminal's outcome select where the badge is; and everything else in a Sheet -- the
   Source's kind and URL, the attach dialog, the explainer, the top panel. The regions
   themselves are the same boxes the public text takes: an outline of 1 pixel in `rule`,
   drawn inside the box, on hover and focus only. So `tests/fixtures/full-node/` fits in the
   editor exactly as it fits on the public page, and `admin-no-scroll.spec.ts` measures it
   (`ADR-133-editor-testing.md`). Below the guaranteed viewport the editor gives things up
   in 10.5's order like the public page; a collapsed Sources block is edited in its Sheet.

8. **What the editor does not offer, said so nobody looks for it**: a Node's `metadata`
   (19.6: the store's); a Source's `id` and an Image's `source` pointer (nothing in the
   Bubble shows them); the manifest's `root` (a new Tree's root is `start` and the route
   allows re-pointing it, but no screen asked for it); the languages of a Tree after
   creation (`ADR-133-new-tree-form.md`, decision 6); a step counter (5.8: authored in the
   title, as text). Each is one field path away if the owner asks.

## Alternatives rejected

- **A WYSIWYG region for the description (`contenteditable` with formatting commands).**
  A second renderer in the browser, HTML paste to sanitise, a serialiser back to the
  subset that must agree with `markdown.ts` character for character, and the counting rule
  of 3.8 applied to a DOM tree; all for two lines of text. The source is what the file
  holds and what the validator measures.
- **Stopping the keystroke at the maximum (`maxlength`).** It would make the counter
  pointless, lose a pasted paragraph at its 151st character, and count in UTF-16 units
  where 3.8 counts code points. #132 rejected the store-side form of it for the same
  reason.
- **Refusing the write at the limit and keeping it only on screen.** A creator who leaves
  the page loses the text; the draft is the place text is safe.
- **A per-field language tab inside the region** (edit `en` and `nl` of the title side by
  side). Every region doubles, the row budget breaks, and the page language would no
  longer be the language shown; the switch already exists.
- **Counting in the browser with a second, simpler rule.** The message at the field and
  the validator's line for the same Tree would disagree, which #138's DONE WHEN forbids
  ("the same rule id").
- **The violation message drawn under the field.** It takes a line from the text area,
  which the limits are derived from; the indicator has the room and the panel keeps the
  list.
- **Editing `metadata`, `root`, a Source's `id`.** Nothing on screen shows them; a field
  nobody sees is a field nobody checks.

## Consequences

- #138 builds `src/editor/Field.tsx`, moves the three counting functions to
  `src/tree/measure.ts` (with re-exports), and adds the rim's pill and tags to the
  stylesheet; `src/chrome.ts` gains `addSource`, `removeSource`, `sourceKind`,
  `sourceUrl`, `outcome`, `characters`, `lines` (#138).
- `tests/editor/field.test.tsx` (#138) asserts the counter against `countedLength` and
  `estimatedLines` on the fixture strings of `markdown.test.ts`, the plain field's line-break
  rule, and the source and rendered states; `tests/browser/editor.spec.ts` asserts the
  regions in place, the switch, the tags, typing past 80, the indicator's message equal to
  `npm run validate --draft`'s line for the same Tree (the same rule id), and the fit at
  every viewport.
