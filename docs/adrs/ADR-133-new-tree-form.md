# ADR-133-new-tree-form: the + tile opens a page with four things -- an id that never changes, the languages with the first as default, a title per language, and Create -- and lands the creator in the editor of the empty root Node; the description is edited later, in the top panel

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 27 (new)
- Depends on: `docs/adrs/ADR-133-overview-tiles.md` (the + tile), `ADR-133-top-panel.md`
  (where the Tree's description lives), `ADR-132-editor-api.md` (`POST /admin/api/trees`)

## Context

The owner: "when clicked a new datastructure can be created. The new datastructure
creation looks exactly like the final datastructure". #132's route takes `{ id, languages,
title }` and answers with a draft holding one root Node `start`, hidden, with the caller as
creator (22.1, 19.7); it refuses an id that is taken (409), reserved or malformed (422).
The Tree id is in every URL and every share link (4.1), which is why the issue asks whether
it may change after creation. The manifest's `description` is a field of its own
(`PATCH /admin/api/trees/<t>` with `description.<lang>`), not part of creation.

## Decision

1. **`/admin/new` is one page with one card in a scroll box** (`ADR-133-overview-tiles.md`,
   decision 5), 520 pixels wide, under the admin chrome bar, holding in this order:

   - **The id.** A text field labelled `treeId`, with the grammar of `tree-format.md` 3.1
     under it as a hint (`treeIdHint`: lowercase letters, digits and single hyphens, at most
     64 characters). **The script proposes one** from the first title typed -- lower-cased,
     every run outside `[a-z0-9]` replaced by one hyphen, leading and trailing hyphens
     dropped, cut to 64 -- until the creator edits the id field, after which the proposal
     stops. The field shows, live, the address the Tree will have (`/<id>/start`).
   - **The languages.** A row of tags with a text field to add one (the tag grammar of
     `tree-format.md` 3.3, checked in the script; `en` and `nl` are offered as two
     one-click buttons because they are the chrome's), a `remove` cross on every tag but
     the last, and a `makeDefault` control on every tag but the first: **the first tag is
     the default language** (3.3), shown with the word `default`. At least one tag; the
     page opens with the chrome language of the page as its one tag.
   - **The title, per language.** One field per tag, in tag order, labelled with the tag,
     with the 80-character counter of 5.7 (`countedLength`, as every counter in the editor,
     `ADR-133-bubble-edited-in-place.md` decision 4); a title may be left empty in a
     language -- it is then the to-do V-L10N reports -- and the route accepts an empty
     string as the draft schema does (19.2).
   - **`create`**, one button in the Answer buttons' style.

2. **The id never changes after creation.** It is the folder name (17.2), it is in every
   Node URL, every share link the creator will hand out and every dataset URL (4.1, 15), and
   `meta.json`, `images/` and the sitemap all hang off it. The form says so in one sentence
   under the field (`treeIdFixed`), and neither the editor nor the API offers a rename
   (22.1 has none). A creator who wants another id creates another Tree; while hidden the
   old one can be deleted (21.2).

3. **Errors are shown at the field**, from the route's answer: 409 → `treeIdTaken` at the
   id; 422 with a reserved word (`images`, `theme`, `schemas`, `admin`, 4.3) → `treeIdReserved`
   at the id; 422 for a malformed id or tag → the hint turns to `danger` at that field. The
   script checks the id grammar and the tag grammar before sending, so the only 422 a
   creator normally sees is a reserved word. Nothing is created on any error; the fields
   keep their values.

4. **The Tree starts hidden, with one empty root Node**, `start`, as the route makes it: no
   title, no description, no Links (19.2's draft schema admits it). On 201 the script goes
   to `/admin/trees/<id>/start` in the page's language when the Tree declares it, else in
   the Tree's default -- the editor on the root Node, which is where the owner's flow
   continues ("looks exactly like the final datastructure, but, the fields in the bubble
   are editable"). The creators' overview shows the new tile, marked `hidden`, the next
   time it is opened; the public overview does not show it (23.2).

5. **The Tree's description is not on this form.** It is not a creation field of the route,
   and it is not drawn in the Bubble; it is the manifest's rich text of 600 characters and
   8 lines (5.7), shown on the tile and in `llms.txt` (26, 23.5). It is edited, per
   language, in the top panel's "This Tree" section beside the title
   (`ADR-133-top-panel.md`, decision 5), where a creator can change it at any time. The
   form stays four things.

6. **Adding a language later** is the same control in the top panel's "This Tree" section:
   a tag added there is a manifest write of `languages` -- which is not a field path of
   22.2, so **this round does not offer it**; the languages a Tree declares are fixed at
   creation, the form says so (`languagesFixed`), and adding one later is filed with #144's
   kind of visibility: issue **#147**, `proposed`. Removing a language is likewise not
   offered.

## Alternatives rejected

- **A rename of the id after creation** (a `PATCH` of `id`, moving the folder). It would
  break every share link out and the route does not exist; the form's one sentence is
  cheaper than a migration nobody asked for.
- **The id generated by the server, never typed.** The id is the address, and the owner's
  first Tree is `ai-act-example`, not `n-7q3k2p`; a creator who names a Tree names its link.
  The proposal from the title gives the lazy path.
- **The description on the form.** It would be the only rich-text field outside the
  editor's own component, and the route does not take it.
- **The form in a Sheet on the overview.** A variable number of title fields in a panel
  bounded to the viewport; a page in a scroll box holds any number.
- **Languages editable after creation in this round.** Every localised text would gain or
  lose a key in one write across every Node, which is neither a field nor an operation of
  22.2; it is a store operation #132 did not define, and defining it here would widen
  #132's interface to unblock one control. It is filed as a `proposed` issue by this ADR's
  consequences so the gap is visible, as #144 was.

## Consequences

- #137 builds the page (`src/app/[lang]/admin/new/page.tsx`, the form as a client
  component `src/editor/NewTreeForm.tsx`) and the chrome keys `treeId`, `treeIdHint`,
  `treeIdFixed`, `treeIdTaken`, `treeIdReserved`, `languages`, `addLanguage`,
  `makeDefault`, `default`, `languagesFixed`, `title`, `create` (#137).
- `tests/browser/creators-overview.spec.ts` (#137) asserts the proposal from the title,
  the fixed-id sentence, each error at its field against the route, and the landing on
  `/admin/trees/<id>/start`.
- The `proposed` issue **#147**, "Editor: add or remove a language of an existing Tree",
  was filed by the run that lands this ADR, `Depends on: #136, #138`, so the owner decides
  by promoting it or leaving it.
