# ADR-263-description-limit: a Node's description is at most 600 counted characters and 8 estimated lines in every language, and the findability readers take the longer text as 16.3 already says

- Status: ACCEPTED (frozen) -- 2026-11-18; decides core document 10.46 with
  `ADR-263-description-box.md`, `ADR-263-description-scroll.md`, `ADR-263-elsa-tree-8.md` and
  `ADR-263-description-field.md`
- Issue: #263 -- Decide the longer description that scrolls in the Bubble and the Overlay (#262)
- Spec: `docs/specs/tree-format.md` 3.8, 5.7 (amended `[#263]`); `docs/specs/application.md` 10.6,
  10.7, 16.3, 16.4 (amended `[#263]`) and 43.1, 43.7, 43.11 (new)
- Core document: 3.1 `[#262]` (the PROPOSED maximum, confirmed), 3.2 `[#262]` (the reading
  "longer is a higher limit", confirmed), 10.28 and 10.46
- Amends: `ADR-78-main-image-and-row-budget.md` (its #102 note's 150 characters and 2 lines),
  `ADR-37-length-limits.md` (5.7's Node description row), `ADR-118-json-ld.md` (decision 6's "For a
  conforming Tree the two strings are identical"), `ADR-118-sitemap-and-alternates.md` (decision
  8's "The cut is stated although it cannot fire for a conforming Tree")
- Measured in: `docs/research/issue-263-description-box.md`
- Built by: #264 (the validator and the fixtures), #265 (the editor's live limit)

## Context

The owner wrote in issue #262: "The 150 character limit that we picked is waaaaay too short
sadly." The round's record (`ADR-262-longer-description-round.md` decision 5) read "longer" as
both a taller box and a higher limit, and kept a limit, because core document 3.1's `[v0.2]` rule
gives every user-facing text a maximum ("we have to have max length on content"). The number was
left to this issue: the owner named none.

On `dev` (`8e7ad6c`) the limit is `tree-format.md` 5.7's "150 characters and 2 estimated lines",
held by `src/tree/validate.ts` (`nodeDescription: 150`, `nodeLines: 2`) and by the editor's live
limit in `src/components/Bubble.tsx` (`description: { characters: 150, lines: 2 }`). It was 600
characters and 8 lines from #37 until #102, when the owner took the picture's two fifths over the
text (PR #110, answer (b)); the Tree's own `description` has kept 600 and 8 throughout. Both
numbers were derived from the height of a box that did not scroll: 8 lines of 24 pixels in 192,
then 2 in 48 (`application.md` 10.7).

`ADR-263-description-box.md` and `ADR-263-description-scroll.md` give the description a box that
scrolls, so its limit no longer has to fit a height: the record measured a text of 600 counted
characters in one paragraph at every viewport of 10.6, in both languages and in Segoe UI,
Liberation Sans and Open Sans, and the page fit at every one with the box scrolling where the
text was taller (the record's section 2). Findability was written for this day: 16.3's cut "is
stated anyway, because a reduction that is not total is a reduction with a crash in it, and
because that limit is the layout's and has already moved twice"; `src/markdown.ts` builds both
strings, and `tests/markdown.test.ts` cuts texts of 180 characters and more.

## Decision

1. **600 counted characters and 8 estimated lines** (`tree-format.md` 3.8), the same for every
   language, under rules V-LENGTH and V-LINES as before. It is the pair this field had from #37
   until #102 and the pair the Tree's own `description` has today, so the validator, the counter
   and the to-do list already carry it for one field; four times the 150 the owner calls too
   short.
2. **V-LINES stays, at 8: one line per 75 counted characters**, the same rule as the Tree's
   description. The box scrolls, so the estimate no longer protects a height on the page; it
   still bounds how far the box scrolls, and it keeps the estimate's one rule for the two rich
   texts the format has. A text at both maxima takes 7 lines at 640 pixels in Segoe UI and
   Liberation Sans and 8 in Open Sans (the record's third table): 168 and 192 pixels, in a box of
   104.9 at 1280 x 640 and of 168 to 170.3 at the largest Bubble.
3. **The findability readers stand as written (16.3, 16.4, 16.5).** With descriptions over 155
   reduced characters, 16.3's steps 3 and 4 fire for a conforming Tree: the page's
   `<meta name="description">` and the `WebPage`'s `description` take the **cut** string, at most
   155 characters at a sentence end or a word with an ellipsis; the `Question`'s `text`, the
   `Dataset`'s `description` (where the root Node's stands in for the manifest's) and `llms.txt`'s
   blockquote take the **reduced** string, whole. That is what 16.3's table already assigns; what
   becomes untrue are the sentences that say steps 3 and 4 do not fire and that the two strings
   are one for a conforming Tree, in 16.3 and in `ADR-118-json-ld.md` and
   `ADR-118-sitemap-and-alternates.md`, which carry a dated line naming this ADR. Nothing in
   `src/markdown.ts` or `src/findability/` changes.
4. **Two fixtures at the new maximum, beside the ones that stay.** #264 adds
   `tests/fixtures/long-full-node/`, a copy of `tests/fixtures/full-node/` whose `full` Node's
   description is 600 counted characters and 8 estimated lines in English and in Dutch, its
   explainer marks kept, and `tests/fixtures/long-overlay/`, a copy of `tests/fixtures/overlay/`
   whose `big`, the Overlay at its largest, has such a description: together they are "every
   maximum the format allows at once" (10.6), the description's among them. `full-node` and
   `overlay` keep their 150 characters, because 24 files of `tests/browser/` name `full-node` and 21
   of them log in to the admin area, where the editor draws it, and the editor's field holds a longer
   text only from #265 (`admin-no-scroll.spec.ts` loads `overlay` too); #264's public specs measure the copies where 10.6 measures the originals at
   every maximum, and #265's editor specs load the copies as drafts. `invalid/v-lines`, whose
   description is 4 estimated lines and would be valid at 8, is re-fitted by #264 to 9 estimated
   lines within 600 characters, its one defect kept. No Tree in `trees/` gets a longer
   description: the content is the owner's.
5. **The limit is enforced where it is today**: `MAX.nodeDescription` and `MAX.nodeLines` in
   `src/tree/validate.ts` (#264) and the editor's `LIMIT.description` in
   `src/components/Bubble.tsx` (#265); typing stops at it as ADR-172 decided.

## Alternatives rejected

- **No limit.** Core document 3.1's `[v0.2]` rule gives every text a maximum, and the owner's words
  call 150 too short rather than the limit wrong (`ADR-262-longer-description-round.md`
  decision 5).
- **A number above 600** (1,000, 1,200, 2,000). Nothing measured here asks for one: the box holds
  any length by scrolling, so a larger number would rest on no measurement. 600 is the number the
  format has already carried for this field and still carries for the Tree's, and a page reads
  up to 41 Nodes (`application.md` 42.5) and draws the description of each neighbour frame and
  closed aside it carries, so the number is not free. The owner may raise it; a higher number changes 5.7's row, the two
  constants of decision 5 and V-LINES by the rule of decision 2, and nothing in the box.
- **Dropping V-LINES for the Node description.** It would leave one rich text with the estimate
  and one without, and a text of 600 one-character paragraphs valid; the estimate costs nothing
  to keep.
- **8 lines at more characters a line**, or a separate lines number. 75 characters a line is the
  assumption every limit of 5.7 is written in; changing it for one field would make the estimate
  mean two things.

## Consequences

- `tree-format.md` 5.7's row reads 600 characters and 8 estimated lines from `elsa-tree/8`
  (`ADR-263-elsa-tree-8.md`); a Tree written to 150 stays valid.
- 16.3's meta description now differs from the `Question`'s `text` on a Node whose description is
  longer than 155 reduced characters, as 16.3 decided in advance.
- If the owner names another number, it is the build issues' requirement if they have not run, and
  otherwise a new issue; the rule of decision 2 sets its lines.
