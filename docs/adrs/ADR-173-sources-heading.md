# ADR-173-sources-heading: the heading over a Node's Sources says "Sources" / "Bronnen", not "Legal sources" / "Juridische bronnen"; the kind labels stay as they are

- Status: ACCEPTED (frozen) -- 2026-10-02
- Issue: #173 -- Say 'Sources' instead of 'Legal sources' ('Bronnen' in Dutch), on the public page and in the editor
- Owner's request: #169 (2026-10-02)
- Spec: `docs/specs/application.md` 3.2 (the `sources` key), 10.3; `docs/specs/tree-format.md` 5.7 (the Sources row of the assumptions table)
- Core document: 3.2 ("[#75] A 'Legal sources' heading", amended `[#169]`)
- Supersedes in part: `ADR-78-sources-heading.md` (decision 1). Its decisions 2 to 4 stand.
- Built by: #173

## Context

The owner (#169, 2026-10-02): "Instead of "Legal sources", the app should just say
"sources"", and in the same list: "This graph creation tool is not just for Legal trees,
also for ethical or social trees, so we want to keep the graph creator useable for all."

`ADR-78-sources-heading.md` decision 1 put a chrome heading over the Sources, the key
`sources`, with the owner's words of #75: `Legal sources` and `Juridische bronnen`. The
same key titles four things: the heading in the Bubble, the heading in the Overlay (the
same component, 10.3), the control the block collapses to below the guarantee, and the
Sources Sheet that control opens (10.5, step 6). The editor draws the same component in
edit mode (28.1), so the words are the same there. With that heading, every Node of an
ethical or a social Tree called its sources legal.

## Decision

1. **The chrome key `sources` says `Sources` in English and `Bronnen` in Dutch.** The
   rest of ADR-78's decision 1 stands: one key, no new one; a real `<h2>` in 13-pixel
   small capitals in `text-muted` on its own 20-pixel line, marked `lang` where the
   chrome language differs from the content language; and the title of the collapsed
   control and of the Sheet.
2. **The kind labels do not change.** No label in front of a `legal` Source; `Case law` /
   `Rechtspraak` and `Literature` / `Literatuur` in front of the other two, as
   `ADR-78-sources-heading.md` decision 2 has it. That decision gave as its reason that
   a `Legal` label under a heading that says "legal" repeats the heading. The heading no
   longer says "legal", so the reason is gone, but the decision stays: whether a legal
   Source gets its label back is the owner's to decide separately (#173 asks for the
   question to be raised, not for a change).
3. **The block's budget does not change.** It is still the heading line and two lines of
   entries, 60 pixels (`ADR-78-sources-heading.md` decision 3). The shorter heading fits
   on the same line.

## Alternatives rejected

- **"Sources" in English, "Juridische bronnen" kept in Dutch.** The owner's reason is
  what the tool is for, and that is the same in every language.
- **The heading as content in the Tree, so a legal Tree could keep "Legal sources".**
  Rejected for ADR-78's reason: words that are the same on every Node are chrome
  (`application.md` section 3), and the format has no field for them.

## Consequences

- `src/chrome.ts` changes two strings. The tests that asserted the old words assert the
  new ones, and the headings in the Overlay and in the editor are now asserted too.
- `application.md` 3.2 and 10.3, `tree-format.md` 5.7 and the core document's 3.2 keep
  the words of #75 as the record and carry an amendment, dated 2026-10-02 and marked
  `[#169]`. `application.md` section 9 gains a row for this record.
- `ADR-78-sources-heading.md` gets a "Superseded in part by" line.
