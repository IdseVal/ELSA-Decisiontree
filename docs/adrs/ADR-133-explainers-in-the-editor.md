# ADR-133-explainers-in-the-editor: a term is marked by selecting it in the description's source and pressing one control; the id is derived from the selection; the term and the text are written per language in the explainer Sheet; a marked term looks as it does on the public page and opens its Sheet on click; unmarking removes the mark's syntax and, when no language marks it any more, the explainer; the title carries none

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 32 (new)
- Amends: `docs/adrs/ADR-78-explainers.md` (decision 6: in the editor a click on a marked
  term opens its Sheet; decision 3 confirmed: the title stays plain)
- Depends on: `docs/adrs/ADR-133-bubble-edited-in-place.md` (the description's source
  state), `ADR-132-editor-api.md` (`add-explainer`, `remove-explainer`, the explainer field
  paths), `ADR-132-draft-and-publish.md` (V-MARK and V-EXPLAINER advisory)

## Context

The owner: "text content can be labelled to have the explanation on hover". The format
(`tree-format.md` 5.9, `ADR-78-explainers.md`) declares an explainer on the Node -- an
`id`, a `term` per language of at most 40 characters, a `text` per language of at most 200
-- and marks each occurrence in the description with the link syntax, `[providers](#provider)`;
at most eight per Node; every explainer marked at least once in every language
(V-EXPLAINER) and every mark naming an explainer of the Node (V-MARK), both advisory in a
draft (19.2); only the description carries marks, the title is plain (3.4). On the public
page a marked term is bold in `accent-secondary` and opens its panel on hover, focus and
tap (10.8). The description is edited as its source text (`ADR-133-bubble-edited-in-place.md`,
decision 6), so a mark is, in the end, characters in a field.

## Decision

1. **Marking is a selection and one control.** While the description region is focused
   (source state) and a selection lies inside it, the right rim shows, under the counter
   pill, one button `mark`. Pressing it: derives the **id** from the selected text -- the
   same function that proposes a Tree id (`ADR-133-new-tree-form.md`, decision 1:
   lower-cased, runs outside `[a-z0-9]` to one hyphen, trimmed, cut to 64), with `-2`,
   `-3` appended while the id is taken on this Node -- sends `add-explainer { id, term: {
   <lang>: <selection> }, text: { <lang>: '' } }` through the queue, replaces the
   selection in the source by `[<selection>](#<id>)`, which is the description write that
   follows in the same queue, and opens the **explainer Sheet** (decision 2) on the new
   explainer with the `text` field focused. A selection that spans a line break, or lies
   inside `*emphasis*` or `**strong**` (V-MARK: a mark is not written inside them), or
   already lies inside a mark, shows the button disabled with `cannotMarkHere` as its
   title. At eight explainers the button is disabled with `explainerLimit`.

2. **The explainer Sheet is where the term and the text are written.** A Sheet titled by the
   explainer's `term` in the page's language (or its id, while the term is empty), with two
   `Field`s per declared language, in the manifest's order: `term` (40, plain) and `text`
   (200, plain), each with its counter pill inside the Sheet; the page's language first
   and open, the others as one section each. Every language of an explainer is edited
   **here**, in one place, because an explainer is one thing in every language and the
   panel a reader sees is per language: the rim's language tags of
   `ADR-133-bubble-edited-in-place.md` decision 3 are not used inside this Sheet. Under the
   fields: `unmark` (decision 4). The Sheet says, per language, whether the description in
   that language marks this explainer (`markedIn` / `notMarkedIn`, from V-EXPLAINER's
   advisory), because a term marked in English and not in Dutch is the commonest to-do the
   validator will report.

3. **A marked term looks as it does on the public page and opens its Sheet on click.** In
   the description's rendered (blurred) state a marked term is bold in `accent-secondary`,
   opens its panel on hover and on focus exactly as 10.8 says -- the same `Explainer`
   client component, on the same markup, so the creator sees what the reader will -- and a
   **click** (or Enter) on it opens the explainer Sheet instead of the tap-toggle of the
   public page, which is the one behaviour edit mode changes on that element. In the
   source state a mark is its syntax, `[providers](#provider)`, and may be edited by hand
   like any text: a mark whose id names no explainer of the Node is V-MARK's advisory,
   shown at the field and in the to-do, and stays as the creator wrote it (19.2: "a mark is
   text the author wrote").

4. **Unmarking is the reverse, and removes the explainer when nothing marks it.** `unmark`
   in the Sheet replaces every `[text](#<id>)` of that id in the **page's language's**
   description by its `text` and writes the description; when, after that, no declared
   language's description marks the id (the editor checks the draft Node it holds), it
   sends `remove-explainer { id }`; otherwise the explainer stays, unmarked in this
   language, which V-EXPLAINER reports for it until it is marked again or unmarked in the
   other languages too. Deleting a mark's syntax by hand in the source has the same effect
   on the description and none on the explainer: it is then V-EXPLAINER's to-do, listed in
   the panel with `remove` beside it.

5. **The id is stable and invisible.** Once derived it is never changed by the editor (a
   mark in every language names it; a rename would rewrite them all), and it is shown
   nowhere but the source state's syntax and the Sheet's title while the term is empty.
   Two explainers on one Node may have the same term in one language and different ids;
   the panel shows the term.

6. **The title carries no mark, confirmed** (`ADR-78-explainers.md`, decision 3; `tree-format.md`
   3.4): the title is drawn in six places as plain text. The editor's title region has no
   `mark` control, and an Option's title and a Source's label likewise. A term that occurs
   in the title is marked where it occurs in the description.

## Alternatives rejected

- **Marking in the rendered state by selecting rendered text.** A selection over rendered
  HTML must be mapped back to source offsets through emphasis, list markers and existing
  marks; the source state is where the characters are.
- **A term list in the panel with "mark every occurrence" automatically.** `ADR-78-explainers.md`
  rejected automatic matching for the format ("provider" inside "service provider", Dutch
  inflections) and the same holds for a button that does it.
- **Typing the id.** A Node's explainer id is in no screen the reader sees; the slug of the
  selection is what an author would type anyway, and the Sheet's title shows the term.
- **Removing the explainer on the first `unmark`, whatever the other languages hold.** The
  Dutch description would then carry a mark to nothing, V-MARK's advisory, for a creator
  who only meant to reword the English sentence.
- **Removing the marks in every language on `unmark`.** The Dutch mark is Dutch text the
  creator wrote; unmarking is per language, like every other edit.
- **A per-language tab on the term and text fields, as the Bubble has.** The Sheet shows
  every language of one explainer at once because that is the unit -- one term, one text,
  in each language -- and there are at most two fields per language.
- **Marks in the title.** Rejected once with reasons that still hold (`ADR-78-explainers.md`).

## Consequences

- #141 builds `src/editor/Marker.tsx` (the `mark` button, the id derivation shared with
  `NewTreeForm.tsx` through `src/editor/slug.ts`, the selection rules) and
  `ExplainerSheet.tsx`; the click-to-edit on a rendered term is a prop of `Explainer.tsx`
  that only the editor sets, so the public component's behaviour is unchanged and
  `explainer.spec.ts` stays green untouched (#141's DONE WHEN).
- `src/chrome.ts` gains `mark`, `unmark`, `cannotMarkHere`, `explainerLimit`, `term`,
  `explanation`, `markedIn`, `notMarkedIn` (#141).
- `tests/editor/slug.test.ts` (#141) asserts the derivation on the strings of
  `tree-format.md` 3.1's examples and on `Provider (EU)`, `aanbieder`, an all-punctuation
  selection (refused) and a 70-character one (cut); `tests/browser/marking.spec.ts`
  asserts: marking "provider" writes `[provider](#provider)` and an explainer with that
  id; both languages written in the Sheet and the panel visible on the public page after
  publishing; a 201-character text stored and shown over the limit at the field with
  V-LENGTH's message, and Publish refused with the same rule id (22.3, 19.3 -- this is
  what #141's "refused at the field" means, since #132 stores an advisory write); the
  ninth `mark` disabled; `unmark` in one language leaves the
  explainer and the Sheet says `notMarkedIn`; `unmark` in the last language removes it and
  the published `tree.json` has no `explainers` key on that Node.
