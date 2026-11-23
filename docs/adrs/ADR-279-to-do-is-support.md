# ADR-279-to-do-is-support: the to-do list is support only -- Publish copies the draft as it is, every save of a published Tree reaches the public at once, and the public pages draw a Tree with a to-do open

- Status: ACCEPTED -- 2026-11-23, built by #279 in the same pull request; decides core document
  10.33 by the owner's words
- Issue: #279 -- The to-do list is support only: an open to-do never keeps a Tree from publishing,
  and every save of a published Tree reaches the public at once
- Spec: `docs/specs/application.md` 3.2, 5.1, 9, 17.4, 19.3, 19.4, 19.5, 19.8 (new), 22.3, 26.6,
  29.3, 33.1 and 33.3, amended `[#279]`; `docs/specs/tree-format.md` 7, amended `[#279]`
- Core document: 3.4 ("Hidden until Publish") and 10.33, amended `[#279]`
- Amends: `ADR-132-draft-and-publish.md` decisions 5 and 6 (Publish no longer runs the full
  validation; a save of a published Tree is copied whether or not the draft is valid in full) and
  its rejected alternative "Reject an autosave that breaks any rule", whose last sentence -- "Publish
  is where a limit is a wall" -- no longer holds; `ADR-132-many-trees-per-deployment.md` where it
  has a published copy opened under every rule (the store opens it under the draft rules);
  `ADR-176-floating-settings-and-to-do.md` (the Publish section's `publishRefused` and `showTodo`,
  the bubble's heading `publicBehindBecause` and the button's `publicBehind` are gone);
  `ADR-205-unfinished-draft.md` in its Context alone ("every public component draws a published
  Tree, which passes every rule": no longer so; its decisions for the preview stand);
  `ADR-273-tags.md` (a tag with no text in the tile's language is listed in another language of its
  Tree, no longer left out); `ADR-4-validity-rules.md` as `ADR-132-draft-and-publish.md` amended it
  ("reject the whole Tree" stands for the format and the validator; the application serves a file
  that fails an advisory rule)
- Depends on: `ADR-132-draft-and-publish.md` (the draft rules, which are unchanged),
  `ADR-252-a-release-keeps-the-data.md` (a start writes nothing in the data directory)
- Format: unchanged. No key, no rule, no limit and no format number moves (decision 6)

## Context

The owner wrote on 2026-11-23, after testing `dev` at ed60bc5 on the demo server:

> "There is no filter mechanism for the tags. Also, I don't want open to-do's stop a tree from publishing, the to-do's list is sometimes confused and then my changes to the graph don't get updated on the live version, basically, they should just be there as support not as anything else. Right now I made changes to a tree, it is still published, but they do not show on the viewing page..."

What was measured on the demo server's data directory before the issue was filed (the issue's
CONTEXT): the owner's published Tree had a draft newer than its public copy, and the draft's one
violation was `tags[0].nl  V-L10N` -- a tag written in English with its Dutch left empty. By
`ADR-132-draft-and-publish.md` decision 6 the store ran the full validation after every write to a
published Tree and left `tree.json` as it was while it failed, so every change after that tag
stayed off the public pages; the tag filter, which lists the tags of the served copies (26.6),
had no tag to list. By its decision 5, Publish ran the same validation and answered 409.

The draft rules (19.2; `tree-format.md` 7's Draft column) split the rules in two: shape and safety
rules are blocking, refused at the write and never stored; completeness and size rules are
advisory, stored and listed as the to-do. So a stored draft carries advisory violations only. The
public pages, the dataset, the sitemap and the JSON-LD had until now read a file that passed every
rule.

## Decision

1. **Publish copies the draft as it is.** `PUT .../published { published: true }` asks nothing of
   the to-do list: the store sets the manifest's `metadata.version`, writes the draft and copies its
   bytes to `tree.json`, as before, without the full validation. The one refusal left is 409
   `uneditable` for a draft a hand edit broke (19.5), which the editor cannot have produced.

2. **Every save of a published Tree reaches the public at once.** After each accepted write the
   store copies the draft's bytes to `tree.json` and swaps the served Tree, whatever the to-do list
   holds. A write that breaks a blocking rule is refused as before (422) and stores nothing, so the
   public copy is always a file the editor accepted. `publicCopyCurrent` leaves `TreeEntry` and the
   write response; the editor's `publicBehind`, `publicBehindBecause`, `publishRefused` and
   `showTodo` are gone.

3. **The to-do is support.** The bubble, its count, its lines and their links stay (33.3, #176,
   #271). Its heading says what is left -- `todoStill`, "Still to do:" / "Nog te doen:" -- in place of
   `todoBefore`, "To do before publishing:", which named a condition that no longer exists. A
   publish leaves the count what it was.

4. **The served copy is the draft's bytes, read under the draft rules.** The store opens a
   published Tree with `openTree(dir, { served: true })`: the draft schema and the rules, a
   blocking violation refusing the Tree (18.3) and an advisory one not. It answers a `Tree` as
   before, with two normalisations for a file that may lack a text: every localised text holds
   every declared language, in the order declared, `""` where the file has none; and a step
   without a `title` or a `description` has them with `""` in each language. `openTree(dir)`
   without the option is the format's reading, every rule refusing, and is what
   `npm run validate` and the migration command run. 15.3 holds: the dataset is `tree.json`,
   byte for byte the draft at its last save.

5. **What a reader sees of each advisory rule** (`application.md` 19.8 is the contract):
   - **A text the Tree lacks in the language on screen (V-L10N)** is shown in the first language
     the Tree declares that has it, on an element that carries that language as `lang` -- the
     step's title and text, a Source's label, an Option's title, a next step's words, the ending's
     words, an explainer's term and text, a picture's description (its `alt`), the logo's
     alternative text, the Tree's title and description on a tile. A text no language has is not
     drawn, and neither is the element that would hold it alone: no heading, no description box, no
     badge, no Source line, no Option button, no button for a next step without words. A step none
     of whose next steps can be drawn shows `startAgain`, as a step that has none. An `alt` and a
     credit are empty rather than invented; the credit's line in the enlarged view is not drawn.
     A name assembled from two texts -- a next step's button, "words: title" -- is its parts that
     exist.
   - **The Tree's title in no language (V-TITLE's state, reported as V-L10N)**: the Tree's id
     stands where a name must -- its tile (as 27.1 already has it), the tab's title, the JSON-LD's
     `Dataset.name`, the lines of `llms.txt` -- and the chrome bar's place for the title is empty.
   - **The structure rules** are drawn as the preview draws them (40.7): a step with one next step
     shows its one button (V-ANSWERS); a next step not yet finished -- an explanation Node by its
     kind -- is the centre of its own page with the way back and `startAgain`; an Option whose
     target is not an explanation Node opens that step's text (V-OPTIONS); a first step with no
     next step and no end shows `startAgain` (V-ROOT).
   - **An unreachable step (V-REACH, V-ORPHAN)** is at its own address and in the sitemap: the
     sitemap lists the pages that exist (16.2), the dataset holds the step, and an address that
     answered 404 for a step the dataset carries would make the two disagree.
   - **A text or a list over its limit (V-LENGTH, V-LINES, V-COUNT)** is drawn whole, with the
     description's scroll box where there is one (#264); nothing is cut.
   - **An explainer no description marks (V-EXPLAINER)** shows nothing; **a mark to a removed
     explainer (V-MARK)** is drawn as its words alone, without the mark's syntax.
   - **A picture with an empty credit or description (V-IMAGE)**: as the first bullet has it.

   The editor and the preview read their drafts as before (`text()`, 40.7's placeholders): a
   creator is told what is missing where it is missing; a reader is shown what there is.

6. **The format's definition of a valid Tree does not change.** A Tree with a to-do open is not a
   valid `elsa-tree/9` file; the schema and `npm run validate` still say so, and
   `tree-format.md` 1, 7 and 8 stand. What changes is that the application serves one.
   `tree-format.md` 7 says that in one place.

7. **Import and seed follow Publish.** `importTree` (17.4) refuses a folder whose `tree.json`
   fails a blocking rule and accepts one with advisory violations, which becomes a published Tree
   with that to-do list. The conversion at the start (36.4) writes a converted published copy when
   it passes the blocking rules, as it writes a draft.

8. **A start writes nothing for this.** A store an earlier release wrote may hold a published
   Tree whose copy is behind its draft -- the owner's Tree on the demo server. The store does not
   re-copy at the start: `ADR-252-a-release-keeps-the-data.md` has a later start keep every file
   of the data directory as it is. Such a Tree's copy follows its draft at the first save after
   the release, and is served as it stands until then.

## Alternatives rejected

- **Keeping the full validation for Publish only**, and letting saves through once published. The
  owner's first sentence on the point is "I don't want open to-do's stop a tree from publishing";
  and a creator could then reach any state by publishing early, so the wall would hold nobody.
- **Keeping the public copy behind, but saying so louder** -- a banner in the editor in place of
  the indicator's `publicBehind`. The owner did say the list "is sometimes confused", and asked
  for something else: the to-dos "should just be there as support not as anything else".
- **A second file for the public copy, normalised or repaired by the store** (missing texts
  filled in, unfinished Links dropped). The dataset would no longer be the draft's bytes (15.3,
  19.3), and a repair is where a field goes missing.
- **A served schema of its own in `schemas/`.** The draft schema is derived in code from the
  published one and cannot drift (`ADR-132-draft-and-publish.md`); a third reading of the rules
  would be one more to keep equal to it.
- **The bracketed placeholder on the public page** (`[Text missing in this language]`), as the
  preview shows a creator. It tells a reader about the Tree's making, in every place a text is
  missing; the Tree's own words in another language say what the step is about, and the `lang`
  attribute lets a screen reader pronounce them.
- **Leaving an unreachable step out of the sitemap, or answering 404 at its address.** It needs a
  reachability walk at every swap for a state the to-do list already names, and the dataset
  carries the step either way.
- **Re-copying a draft to its public copy at the start.** It would bring the owner's Tree up to
  date at the deploy rather than at the first save, and it contradicts
  `ADR-252-a-release-keeps-the-data.md`.

## Consequences

- `src/store/drafts.ts`: `commit` copies to `tree.json` whenever the Tree is published; `publish`
  runs no validation; `publicCopyCurrent` is gone from `TreeEntry`, `WriteResponse` and `Held`.
  `src/store/index.ts` opens, imports and converts published copies under the draft rules.
- `src/tree/loader.ts`: `openTree(dir, { served: true })`, and the two normalisations of decision 4.
- `src/chrome.ts`: `shown(text, lang, where, draft)`, the one reading of a localised text for a
  public page; `text()` stays the editor's and the preview's. The public components
  (`Bubble`, `TreeView`, `Carousel`, `EnlargedView`, `Logo`, `Tile`, `Sheet`, `Explainer`),
  `src/markdown.ts`, `src/findability/`, `src/tags.ts` and the Node page's metadata read through
  it. `loadPage` makes an unfinished next step the centre of its page.
- `src/editor/`: the Publish section has no refusal, the indicator no `publicBehind`, the to-do
  bubble one heading besides `notServableBecause`; four chrome keys are gone and one is renamed.
- A reader of a published Tree may meet an unfinished step, a text in another language of the
  Tree, or a page with no heading. That is what the owner chose; the to-do list names each to the
  creator.
- A third party that validates a downloaded `tree.json` against `schemas/elsa-tree-9.json` may
  find it invalid while a to-do is open.
- Tests: `tests/store/drafts.test.ts` (Publish with every to-do open, every write reaching the
  copy, the demo server's tag, the uneditable refusal), `tests/unfinished-tree.test.tsx` (a public
  page per advisory rule), `tests/tags.test.ts`, `tests/language.test.tsx`,
  `tests/editor/todo.test.tsx`, `tests/admin/trees.test.ts`, `tests/store/store.test.ts`,
  `tests/store/import-command.test.ts`, and `tests/browser/admin-api.spec.ts` (the unfinished Tree
  and the demo server's tag in a browser).
