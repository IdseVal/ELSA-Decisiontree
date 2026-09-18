# ADR-78-sources-heading: the Sources sit under a chrome heading "Legal sources" / "Juridische bronnen" on one 20-pixel line, the `Legal` kind label goes because the heading says it, `Case law` and `Literature` stay, and the block is at most three lines of the text area

- Status: ACCEPTED (frozen) -- 2026-09-17
- Issue: #78 -- Architecture: freeze the contracts for the display changes of #75
- Spec: `docs/specs/application.md` 3.2 (the `sources` key), 10.3, 10.5 (step 6), 10.7; `docs/specs/tree-format.md` 5.1, 5.7
- Core document: 3.1 (Sources of three kinds), 3.2 ("A 'Legal sources' heading"), 10.20 (chrome languages)
- Supersedes in part: `ADR-37-length-limits.md` (decision 4: "Sources 2 lines" becomes three with the heading), `ADR-38-tree-view.md` (decision 8's "Sources" line of the Bubble)
- Built by: #81

## Context

The owner (#75): "In the node bubble, I want the sources to have a header 'Legal
sources' or 'Juridische bronnen' in Dutch, with the sources listed below that."

In 0.2 the Sources are a list at the foot of the text area with no visible heading (the
group's accessible name is the chrome key `sources`, "Sources"), each entry prefixed by
its kind in muted text -- `Legal`, `Case law`, `Literature` (`tree-format.md` 5.1 keeps
the three kinds "labelled distinctly so the frontend can group or style them") -- and the
block has 40 pixels, two 20-pixel lines, in the budget of `tree-format.md` 5.7. Below the
guarantee it collapses to one control that opens a Sheet (10.5 step 5).

## Decision

1. **The heading is chrome, one line, 20 pixels**: the chrome key `sources`, whose
   strings become `Legal sources` and `Juridische bronnen`. It is a real heading in the
   markup (`<h2>`), in 13-pixel small capitals in `text-muted`, marked `lang` where the
   chrome language differs from the content language (3.1). No new key: the group's
   accessible name and the collapsed control's label already said "Sources" through this
   key and now say the owner's words.
2. **The `Legal` kind label is dropped** from each entry: under a heading that says
   "legal" it repeats the heading. **`Case law` and `Literature` stay** as muted
   prefixes, because a court decision and a paper under a heading that says "legal
   sources" are the two things a reader may want told apart, and the data keeps the
   three kinds for exactly that (5.1).
3. **The block is at most 60 pixels: the heading line and two lines of entries.** Three
   labels of 60 characters with two prefixes and separators are at most 200 characters,
   which is two lines at the 90 characters a 13-pixel line of the text area holds; the
   entries wrap as they did, and dropping the `Legal` prefix only shortens them. The
   budget in `ADR-78-main-image-and-row-budget.md` counts the 60.
4. **Below the guarantee the whole block collapses, heading included**, to the one
   control (10.5 step 6) that opens the Sources Sheet, whose title is the same heading.

## Alternatives rejected

- **A new chrome key `legalSources`, keeping `sources` for the Sheet and the group
  name.** Rejected: two names for one thing, and the Sheet would then be titled
  differently from the block it stands for.
- **Dropping all three kind labels under the heading.** Simpler and shorter. Rejected:
  the owner's heading says "legal" and the format's second and third kinds are not
  legal sources in that sense; a reader told that a literature reference is a legal
  source has been misinformed by the chrome.
- **A heading per kind (`Legal`, `Case law`, `Literature`) instead of one heading.**
  Three lines of heading in a block that has three lines in all. Rejected; the owner
  asked for one heading with the list under it.
- **Writing the heading in the Tree as content.** Rejected: it is the same words on
  every Node, which is the definition of chrome (`application.md` section 3), and the
  format has no field for it.

## Consequences

- `chrome.ts` changes two strings; `chrome.test.ts` keeps asserting the key exists in
  both languages. The Sheet listing the Sources takes its title from the same key.
- `views.test.tsx` asserts the heading element, its `lang` where set, no `Legal` prefix,
  and the `Case law` and `Literature` prefixes where their kinds occur.
- `tree-format.md` 5.7's Sources row of the assumption table becomes "three lines, 60
  pixels, the first the heading".
