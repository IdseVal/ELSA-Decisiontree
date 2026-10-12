# ADR-205-preview-bar: the preview's chrome bar is the public Node page's, drawn by the same component -- the arrow, the Tree's mark, the mention of its Authors, the language switch -- with the arrow leading to `/admin`, and without the share button and "Editor"

- Status: ACCEPTED (frozen) -- 2026-10-04; decides core document 10.41's chrome bar (the arrow of
  #163, the language switch, the share button, the mention of the Authors, #204's "Editor")
- Issue: #205 -- Architecture: the preview of a hidden Tree as its readers will see it -- its
  address, what it shows of an unfinished draft, and its two buttons at the top left
- Spec: `docs/specs/application.md` 40.4 (new); 24.3, 39.4, 39.7 and 6 amended, marked
  **[#205]**
- Amends: `ADR-133-admin-routes.md` decision 7 (each page's bar: the preview's is the public Node
  page's, as this ADR draws it); `ADR-195-the-mention.md` decisions 2 ("Where: two places, and no
  other": a third, the preview's bar) and 5 ("Nowhere else": not the preview); and in the core
  document, "the names go nowhere else", said of the Authors' names in 3.4's `[#194]` bullet and
  in 10.40, carries a dated **[#205]** note for it
- Depends on: `ADR-205-preview-drawing.md` (the draft's Theme on the whole page, the preview's
  `Links`), `ADR-195-the-mention.md`, `ADR-195-authors.md` (the mention, and who it names)
- Measurements: `docs/research/issue-205-top-left-room.md` (section 2, the public bar's room
  without the share button)
- Built by: #206, after #197 (the mention) and #204 (the public bar's "Editor")

## Context

The public Node page's bar holds, at the left, #163's round arrow back to the public overview
`/` (`BackToOverview`, named `toOverview`, "All decision trees") and the Tree's logo, or its
title as text in two lines at most (#200); at the right the language switch -- a pill per
declared language, the current one included -- and the share button, which copies the page's own
address (4.1, 24.3). #197 built the mention of the Tree's Authors between the two (39.4; merged
on 2026-10-04 at `0a43073`, after the research record was measured, its rules reaching neither
the band nor the tree view);
#204 is to add "Editor", a link to `/admin`, at the right end, and to give up the current
language's pill below 768 pixels wide to make room for it (core document 3.4 `[#202]`, PROPOSED).
The editor's bar is the editor's own interface, in the default look: the draft's logo (its
`logo.light`), the language switch, the autosave indicator, `account` and `logout` (24.3, #180).
The creators' overview at `/admin` lists the Trees a creator edits, a hidden Tree among them with
its mark `hidden`; the public overview `/` lists published Trees alone (26.4, 23.2). On `dev`
without its share button the public bar has 57.1 to 92.2 pixels more room on Windows, and 57.2
to 91 in the CI runner's faces, at every viewport of 10.6 where the tree view shows (the research
record, section 2).

## Decision

1. **The public Node page's bar, by the same component.** #206 moves the public Node page's
   `<header>` into one server component, `src/components/NodeChrome.tsx`, which the public Node
   page and the preview both render, so the two bars cannot drift apart at the next amendment of
   24.3; the public page's markup stays what it was. In the preview it holds what the Tree brings
   to its readers' bar, in the draft's Theme (`ADR-205-preview-drawing.md` decision 3), and carries
   no `data-editor-ui`:
   - the Tree's logo, in the variant for the draft's background, or its title as text, as 13.2
     and #200 draw it;
   - the mention of its Authors, as 39.4 draws it, from `authorsOf` of the draft's
     `TreeEntry.meta` (39.3) -- the creators' overview names a hidden Tree's Authors on its tile
     from the same meta (39.5), to the same readers, who see the same accounts in the settings
     panel's Collaborators (33.4); none where the Tree has no Author;
   - the language switch over the draft's declared languages, its links the preview's
     (`withLang` through `previewLinks()`), so that it keeps the reader in the preview.

2. **The arrow leads to `/admin`.** #163's arrow stands where it stands on the public page, in
   its look, named `toOverview`, and leads to the creators' overview in the page's chrome
   language (`adminHref('/admin', <chrome language>)`), where #203's arrow in the editor leads
   too. The public overview `/` does not list a hidden Tree (23.1, 23.2), and leaving the admin
   area from the preview would leave the way back behind; the creators' overview lists the Tree
   with its mark.

3. **No share button, no "Editor".** The share button copies the page's own address (4.1), which
   in the preview is an admin address: copying it shares a preview, which the owner did not ask
   for (#205's OUT OF SCOPE), and the public address it would stand for answers 404 while the
   Tree is hidden (23.1) -- `ADR-133-admin-routes.md` decision 7 left it out of the editor for
   that reason. "Editor" leads to `/admin`, where the arrow already leads, and on a page whose
   way back says "Back to the editor" (`ADR-205-preview-buttons.md`), a second button named
   "Editor" that leads elsewhere would contradict it.

4. **The current language's pill stays at every width.** #204 gives it up below 768 pixels wide
   to make room for "Editor" (#204's TASK 3), which this bar does not hold: the preview's bar
   holds the public bar's controls but two, and has 57.1 pixels or more of room beyond `dev`'s
   public bar wherever the tree view shows (the research record, section 2), so whatever fits
   there fits here. `NodeChrome` takes whether to draw the share button and "Editor"; #204's rule
   for the pill is for a bar holding "Editor", and #206, which builds after #204, keys it to the
   bar that draws "Editor" where #204 keyed it otherwise, so that it does not reach this bar.

## Alternatives rejected

- **The editor's bar** -- the account link, `logout`, the autosave indicator, in the default look.
  The owner asked for the Tree "how the end users will see it"; that bar is the editor's
  interface.
- **No bar.** The readers see one, with the Tree's mark at its left.
- **The public bar exactly, with the share button and "Editor".** Decision 3.
- **The share button copying the step's public address.** It answers 404 until the Tree is
  published; "a button that sometimes copies a dead link is worse than none"
  (`ADR-133-admin-routes.md`).
- **A copy of the public bar's markup in the preview's page.** Two bars that drift apart at the
  next amendment of 24.3 -- #204 is about to change the public one.
- **The arrow leading to `/`, as on the public page.** A page without the hidden Tree, outside the
  admin area, with no way back to the editor.
- **No mention in the preview, as in the editor** (39.7). The editor leaves it out because its bar
  is the editor's interface (39.7); the preview's bar is the readers', and the readers will see
  the mention there once the Tree is published.
- **Giving up the current language's pill below 768, as #204's public bar will.** It gives way
  for "Editor", which this bar does not hold.

## Consequences

- `src/components/NodeChrome.tsx` (new, #206): the public Node page's bar, rendered by the public
  Node page and the preview; `src/app/[lang]/[tree]/[...path]/page.tsx` renders it in place of
  its `<header>`.
- `application.md` 24.3 gains the preview's row; 39.4's "Where" and 39.7's "Not in the editor"
  name the preview (dated).
- #206 waits for #197, which draws the mention, and for #204, which changes the public bar this
  component holds (40.4; #206's `Depends on:` line). `tests/browser/preview.spec.ts` asserts the
  bar's controls and their addresses, the mention, and the pill at 480 x 800 and 767 x 800
  (40.9).
