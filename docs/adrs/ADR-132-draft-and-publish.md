# ADR-132-draft-and-publish: the draft is the same `elsa-tree/4` file under a named set of advisory rules; Publish copies it when it validates in full; while published, every valid save is public at once

- Status: ACCEPTED (frozen) -- 2026-09-23; decides core document 10.33
- Issue: #132 -- Architecture: freeze the store for the editor round
- Spec: `docs/specs/application.md` section 19 (new); 5.1 amended; `docs/specs/tree-format.md`
  7 and 10 amended
- Amends: `docs/adrs/ADR-4-validity-rules.md` ("reject the whole Tree" stands for the
  published copy; a draft is held with its violations listed),
  `ADR-118-json-schema.md` (a second compiled schema, derived from the first at start,
  never a second file), `ADR-118-json-serialisation.md` (the byte form gains its second
  writer, the store)
- Depends on: `docs/adrs/ADR-132-data-directory.md`

## Context

A Tree that is being built is not a valid `elsa-tree/4` file. The owner's flow (core
document 3.4) creates a Node, types a title, clicks "yes" to create the next Node before
"no" exists, uploads a picture before writing its credit. Each of those states breaks a
rule of `tree-format.md` section 7 -- V-ANSWERS wants both keys, V-L10N wants every
language, the schema wants a non-empty credit -- and section 7 says a loader rejects the
whole Tree. So what the autosave writes cannot be the `tree.json` the public routes serve,
and 10.33 asks what happens when the Tree is already public and the draft is, for a
moment, not valid.

The alternative the issue names -- a second format for drafts -- would give the editor,
the validator and the loader two shapes to agree on, and #131 decided the format stays
`elsa-tree/4` with "a named subset of the validity rules relaxed".

## Decision

1. **The draft is an `elsa-tree/4` file**, `draft.json` in the Tree's store folder, written
   in the canonical byte form of 3.7 by the one writer the migration already uses. Its
   `$schema` and `format` are the published format's. Nothing new enters the format: no
   `draft` key, no `status`, no per-Node version. Whatever is not content -- who, when,
   the revision -- is in `meta.json`.

2. **Every rule of section 7 is checked on a draft; a named set is advisory.** The loader
   gains a draft mode, `openTree(dir, { draft: true })`, which reads `draft.json` and
   reports two lists instead of throwing: **blocking** violations, which the store never
   lets onto disk (a write that would cause one is refused, `ADR-132-editor-api.md`), and
   **advisory** violations, which are the creator's to-do list. The set, by rule id, is the
   table in `tree-format.md` section 7 ("Draft" column) and it is the contract; in one
   sentence, **shape and safety rules are blocking, completeness and size rules are
   advisory**:

   | Blocking in a draft (never on disk) | Advisory in a draft (reported, held) |
   |---|---|
   | V-DIR, V-JSON, V-SCHEMA, V-FORMAT, V-NULL, V-EMPTY, V-LANG, V-META, V-KEYS, V-CROSS | V-L10N (a missing or empty language), V-LENGTH, V-LINES, V-COUNT |
   | V-NODE (an `id` that is not an id, or is another Node's) | V-NODE's other half: a Node without `title` or `description` yet |
   | V-KIND, V-TERMINAL (the outcome set) | V-ROOT (the root has neither Answers nor a terminal yet) |
   | V-ANSWERS and V-OPTIONS: a target that does not exist, or is listed twice | V-ANSWERS: one Answer missing, or a target that is not yet a question Node or Terminal; V-OPTIONS: a target that is not yet an explanation Node |
   | V-SOURCE, V-IMAGE, V-EXPLAINER: shape, grammars, a file that is not in `images/`, an id used twice | V-IMAGE: an empty `credit` or `description`; V-EXPLAINER: a term not yet marked; V-MARK: a mark to an explainer that was removed |
   | V-PLAIN, V-HTML | V-REACH, V-ORPHAN |
   | V-THEME (the files exist, one family per role) | V-TITLE (a title whose every language is still empty: the key stays required and the empty strings are V-L10N's report -- nothing reports V-TITLE itself, section 7) |

   Two mechanisms make one validator do both, and neither is a second document. **The
   schema half**: at start the loader derives a **draft schema** from
   `schemas/elsa-tree-4.json` in code and compiles both. The derivation relaxes exactly
   what an incomplete Tree needs and nothing else. It drops **two keywords** -- the
   `minLength` on `$defs/localisedText`'s `additionalProperties` (a language whose text is
   not written yet) and the `minLength` on `$defs/image/properties/credit` (a picture
   whose credit is not written yet) -- and removes `title` and `description` from a
   Node's `required` and `yes` and `no` from `answers`'. **Every other `minLength`,
   `minItems` and `minProperties` of the published schema stays**, because each is the
   only place a rule the table above keeps blocking is enforced: a non-empty `languages`
   and `nodes` (V-LANG, V-NODE), a non-empty `metadata.version` (V-META), no empty
   `sources`, `images`, `options` or `explainers` array (V-EMPTY, V-OPTIONS, V-EXPLAINER),
   a `theme` with at least one key and a font family with a name, a licence and a file
   (V-THEME), and a localised text that is never `{}` (V-EMPTY). So the draft schema
   still refuses an unknown key, a wrong type, a malformed id or file name, a bad outcome,
   a `null`, an empty array and an empty `version`; what it lets through that the
   published schema would not is an empty string in a localised text or a credit, a Node
   without `title` or `description`, and an Answer pair with one key. **The rules half**:
   `validateTree(raw, mode)` runs every content rule as today and, in draft mode, tags
   each violation blocking or advisory by the table, and additionally reports under V-L10N
   and V-IMAGE the empty strings the two dropped keywords let through. The rule ids do not
   change; the published copy is validated exactly as before, with the published schema
   and every rule blocking.

3. **Referential integrity is the store's, so a target that does not exist stays
   blocking.** Deleting a Node removes every Answer and Option that points at it in the
   same write; deleting an explainer does not remove its marks, because a mark is text the
   author wrote and losing it silently is worse than a to-do -- so V-MARK is advisory. The
   store never writes an empty array or object: removing the last Source, Image, Option or
   explainer removes the key, and `remove-answer` on the last Answer removes `answers`, so
   the Node is an explanation Node again -- which is why V-EMPTY stays blocking in a draft
   with no exception and no dropped keyword. A
   Node's `kind` in a draft is derived as it always was (`answers` → question, `terminal` →
   Terminal, neither → explanation), which is why a freshly created Node is "an explanation
   Node" until the creator gives it Answers or an end, and why V-ANSWERS' target-kind half
   is advisory.

4. **`draft.json` always passes the draft schema and every blocking rule.** That is the
   invariant of the store: what it refuses, it never writes, so a draft can always be
   opened, indexed and shown, and the editor always has a Tree to render. A `draft.json`
   that breaks the invariant -- a hand edit -- makes the Tree **uneditable** rather than
   the deployment down: the admin area shows the violations and the administrator's way
   out is the import command with a repaired file.

5. **Publish.** Turning the toggle on runs the full validation -- the published schema,
   every rule blocking -- on the draft. **Passes**: the store bumps the manifest's
   `metadata.version` in the draft to the publish count as a string (`"1"`, `"2"`, ...),
   writes the draft, then copies its bytes to `tree.json` and swaps the in-memory `Tree`
   (`ADR-132-many-trees-per-deployment.md`, decision 4); `publishedAt` is set in
   `meta.json`; the Tree is public in the same call. **Fails**: 409, with the full list of
   violations in the form of 5.1, and nothing changes -- no file, no flag. The editor shows
   them at the fields they name.

6. **While published, every autosave that leaves the draft fully valid reaches the public
   at once** (10.33, as PROPOSED): after each write the store runs the full validation on
   the new draft; when it passes, `tree.json` is replaced by the draft's bytes and the
   in-memory `Tree` is swapped; when it does not, `tree.json` is left as it was and the
   editor is told, in the write's response, that the public copy is behind and by which
   violations. The public never sees a Tree that fails section 7. Turning the toggle off
   deletes `tree.json` and drops the in-memory `Tree` in the same call: 404 at once, absent
   from the next sitemap, `llms.txt` and overview request.

7. **The published copy is byte-identical to the draft at the moment it was copied.** So
   15.3 still holds -- the route streams the file -- and `curl <url>/tree.json` equals
   `$ELSA_DATA_DIR/trees/<id>/tree.json`; and the draft's `metadata.version` equals the
   public copy's exactly when the two are the same file.

8. **`metadata.version` is the store's on the manifest and the Node.** The manifest's is
   the publish count (decision 5); a new Node's is `"1"` at creation. The editor of this
   round exposes no metadata field; a Tree imported with an author's own `metadata` keeps
   them, and the bump touches `version` only. #133 may add editing of `metadata`; the
   store's two writes above are the contract it works inside.

9. **The format number stays `elsa-tree/4`.** Nothing above adds or changes a key, a kind,
   a limit or a rule of the published file; the draft is the same file under a reading of
   the rules that section 7 now states. A reader who fetches `tree.json` sees exactly what
   they saw. No case for `elsa-tree/5` was found, and none is opened.

## Alternatives rejected

- **A draft format** (`elsa-draft/1`, or `tree.json` plus a `draft` key). Two shapes for
  the editor to write, the validator to check and the loader to index; and the publish
  step becomes a conversion, which is where a field goes missing. #131 decided against it
  and this ADR found no reason to reopen.
- **A second schema file for drafts in `schemas/`.** It would be published beside the
  first, a third party would find it, and it would drift from the first at the first
  amendment. Derived in code from the one published schema, it cannot drift; a test
  asserts the derivation (every keyword the published schema has, the draft schema has,
  minus the two named ones and the two `required` entries).
- **Drop every `minLength`, `minProperties` and `minItems` from the draft schema** (the
  first draft of this ADR). `elsa-tree-4.json` carries fifteen such keywords; thirteen of
  them are the only place six rules the table keeps blocking are enforced -- V-LANG,
  V-META, V-EMPTY, V-NODE's non-empty `nodes`, V-OPTIONS' and V-EXPLAINER's non-empty
  arrays, V-THEME -- so a hand-edited `draft.json` with `"languages": []`,
  `"version": ""` or `"sources": []` would have passed the draft schema, counted as
  editable rather than uneditable, and left every localised-text rule with no language
  list to check against; decision 4's invariant could not hold. The derivation exists to
  admit an incomplete Node or an unwritten text, not an empty array or an empty version;
  two keywords do that.
- **Reject an autosave that breaks any rule, including length.** The autosave would lose
  the author's text at the 151st character, or the editor would have to block typing, and
  the owner asked for the limits *live* (#138), which means shown, not enforced by loss.
  The draft holds the text and says by how much it is over; Publish is where a limit is a
  wall.
- **Hold blocking violations too, so that anything at all can be autosaved.** A draft with
  an unknown key, a `null`, a wrong type or a dangling target cannot be indexed or shown
  without the loader growing a tolerant mode of its own, and those states are not authoring
  states -- nothing in the editor produces them. A write that would cause one is a bug or
  an attack, and 422 is the right answer to both.
- **Publish as a snapshot, autosave never touching the public copy until the next
  toggle.** A safer feel and a second mental model: two versions of every published Tree,
  a "republish" button, and a creator who fixes a typo and wonders why the site still
  shows it. The owner said "saved automatically"; 10.33's PROPOSED reading is the plain
  one, and the safety it gives up is regained by the rule that an invalid draft leaves the
  last valid copy in place.
- **A version per Node with a `409` on a stale write.** See `ADR-132-editor-api.md`; the
  unit of a write is a field and last write wins per field, so no per-Node version is
  needed in the file or beside it.
- **Storing the published flag and the version in `tree.json`.** The file is the public
  dataset; the flag is not content, and 8's "no account name in the file" would be one key
  away from being broken.

## Consequences

- `src/tree/validate.ts` gains the mode and the table; `src/tree/loader.ts` gains the draft
  mode, the derived schema, and a `Draft` return whose `getNode` yields a `DraftNode` --
  a `Node` whose `answers` may lack a key and whose localised texts may lack a language or
  hold an empty string for one, and nothing else different. Issue #136 builds both, with the `Draft` type in `types.ts`.
- `tree-format.md` 7 gains the Draft column; its opening sentence "a loader rejects the
  whole Tree" is restated as true of the published copy.
- `scripts/validate.ts` gains `--draft`, so the same report the editor shows can be printed
  from a folder.
- `tests/fixtures/drafts/<state>/` (#136): one draft per advisory state above, each
  asserted to open in draft mode with exactly that advisory list and to be refused by the
  full validation with the same rule id; and one blocking state per row, asserted to be
  refused in draft mode too.
- A Tree of a thousand Nodes is a few hundred kilobytes; a full validation and a file write
  per autosave is milliseconds, and the editor's debounce (#133) bounds the rate.
