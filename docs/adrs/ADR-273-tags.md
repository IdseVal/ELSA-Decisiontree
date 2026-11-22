# ADR-273-tags: a Tree carries up to eight short localised tags in `elsa-tree/9`, edited in "This Tree", and the public overview's bar filters its tiles by any ticked tag, the choice in the address

- Status: ACCEPTED -- 2026-11-22, built by #273 in the same pull request
- Issue: #273 -- Tags on a Tree, added in the editor, and a filter dropdown on the main overview over
  every tag of the published Trees
- Spec: `docs/specs/tree-format.md` (title, header, 4, 4.1, 5.7, 7 V-TAGS, 10, 11, 12, 12.11 new),
  amended `[#273]`; `docs/specs/application.md` 22.1, 23.2, 24.3, 26.5 (new), 33.5, amended `[#273]`
- Core document: 10.45 (still OPEN: the conversion on the live server)
- Amends: `ADR-263-elsa-tree-8.md` (the next format number is taken: `/9`)
- Schema: `schemas/elsa-tree-9.json`, beside `elsa-tree-8.json`, which stays served

## Context

The owner wrote on #273 (2026-11-22): "the option to add tags to decision-trees and a filter in the
main overview with a dropdown where people can filter on all tags that exist in the published
decision-trees". The issue named the format change, `elsa-tree/9`, and set out PROPOSED readings for
the rest -- a short plain localised text per tag, "a small count (say 8) and length (say 30
characters)", the field in the settings panel's "This Tree", a dropdown beside the search bar that a
sister issue (#272) builds, several tags at once, the choice in the address and sent to no one, no
cookie, hidden Trees' tags in no list, tags on the tile only if its rows have room -- for "the run
[to decide] within them or [ask] on the issue".

`tree-format.md`'s header says a change of the contract "requires a new `architecture` issue and a
new format number". This change came as a build issue that carried its own architecture as PROPOSED
readings; the run took the readings rather than stop, records them here, and says so in its pull
request, so that a reviewer or the owner who wants the architecture issue can send it back.

## Decision

1. **`tags` is an optional manifest key of `elsa-tree/9`**, after `description` in the byte form of
   3.7: a list of localised texts, plain. Absent, or never empty (V-EMPTY). An `/8` file is
   converted by 12.11, which renames `format` and `$schema` alone, as 12.9 and 12.10 do: an `/8` file
   is a `/9` file without tags. One function, `convertTags`, runs in `npm run migrate` and in the
   store's start, after 12.10.
2. **At most 8 tags, each at most 30 counted characters** (5.7) -- the issue's own numbers: a tag is
   a word or two in a list, and the filter lists every tag of every served Tree. Both are the
   loader's rules (V-COUNT, V-LENGTH), as every limit of 5.7 is, not the schema's. **V-TAGS** is new:
   no two tags the same text in one language once the spaces around each are dropped and both are in
   lower case (`tagKey`); the filter matches by the same key, so two tags one rule calls the same are
   one entry of the filter. V-TAGS and a ninth tag are **blocking** in a draft: the editor writes the
   list whole, so either is a list the editor never sends, not an unfinished state. An empty language
   is V-L10N's advisory, as for every text.
3. **The editor** shows the tags in "This Tree" after the languages (33.5): a chip per tag, its text
   in the page's language edited in place, a cross to remove it, a field to add one. One language at
   a time (28.2): a tag added is `""` in the other languages, each the to-do, and a chip empty in the
   page's language shows its default language's text as the placeholder. Every change writes the
   whole list at the manifest path `tags`, as a Theme part is written whole (33.8): the list is
   small, its order and its distinctness are properties of the whole, and one path keeps the
   interface's set of fields closed. The language operations reach the tags as every other text.
4. **The filter is a pill in the public overview's chrome bar**, first of its controls, whose list
   drops over the grid -- not a row above the grid's box, which would take the box's third row of
   tiles at 1280 x 640 (26.2, `tests/browser/overview.spec.ts`). Below 480 pixels wide a funnel
   stands for its word, which stays its accessible name: the overview keeps its current language's
   pill at every width (24.3), and the site title took a second line at 320 beside the word. #272's
   search bar did not exist when this was built; "beside the search bar" is that issue's to keep.
5. **A tick narrows the tiles to the Trees carrying any ticked tag**, at once, in the browser. "Any"
   rather than "all": a choice of tags the overview lists can then never leave it empty, and the
   list is one facet, where ticking a second value widens. The choice is the query's `tag`, once per
   tag in the list's words, written with `history.replaceState` -- shareable, reloadable, sent to no
   one while a reader ticks, no cookie -- and the server draws a shared address filtered already,
   ignoring a tag no served Tree carries. Without script the list is a plain `GET` form. Each tag is
   listed in the page's language where its Tree declares it, else in the default, as the tile's
   title is (23.2). Hidden Trees are not served, so their tags are in no public list. The tile does
   not draw its tags: its rows hold 158 of its 160 pixels (26.1). The creators' overview has no
   filter: the owner asked for the main overview's.
6. **The live server.** The first start of the release that carries `/9` converts every `/8`
   `tree.json` and `draft.json` of the data directory by 12.11.4: the `format` and the `$schema` of
   each file, nothing else. That is the write core document 10.45 asks the owner about, as
   `ADR-263-elsa-tree-8.md` decision 5's was; the pre-deploy copy of #252 is its way back. This ADR
   does not answer 10.45.

## Alternatives rejected

- **Tags as one string in each language** (`{ "en": "food, law" }`): a list in a string needs a
  separator grammar and makes "the same tag" a parsing question; a list of localised texts uses the
  format's one text shape.
- **Language-independent tags** (one string per tag): the owner's readers read the overview in
  English or Dutch, and a tag reads in the page's language as the title does.
- **Writing a tag at a time** (`tags[2].nl`, `add-tag`, `remove-tag`): four paths or operations for
  a list of at most eight, and a write could leave two tags the same between two calls.
- **All ticked tags must match**: ticking a second tag of the same list would narrow to nothing as
  often as not; one facet widens.
- **Server-side filtering by navigation on every tick**: a request per tick, and the choice sent to
  the server while the reader is still choosing; the server reads it only from an address loaded.

## Consequences

- `schemas/elsa-tree-9.json` is served beside `/8` to `/4`; `SCHEMA_HREF`, the dataset's `Link`
  header and `llms.txt` name `/9`.
- Every Tree and fixture on `dev` is `/9` (12.11.3); the example Tree carries two tags, so section 8
  exercises the new key and the filter has something to list on `dev`.
- The next format change is `elsa-tree/10`. #274 (a background image, filed beside this one) asked
  for "one conversion, not two" if both land: if #274 reaches `dev` after this, its key can join
  `/9` only while no release that carries `/9` has reached the live server; afterwards it is `/10`.
