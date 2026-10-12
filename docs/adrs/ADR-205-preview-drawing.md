# ADR-205-preview-drawing: the preview draws the draft through the public components by the reuse rule's one setting with no slot, with the neighbour frames and the slide within the seventeen Nodes of a public page, in the draft's Theme on the whole page, with a head for no crawler and the content language on `<html>`

- Status: ACCEPTED (frozen) -- 2026-10-04; decides core document 10.41 (how the public components
  draw a draft through the preview: the addresses and the pictures the reuse rule gives them, the
  neighbour frames and the slide the editor never renders, the Theme, and the page's head) and
  keeps true 3.4's sentence "The editor reuses the end-user components through one optional
  setting": the preview reuses them through the same setting
- **[#220] Amended (2026-10-09)** by `ADR-220-slide-and-neighbourhood.md`: the preview's seventeen Nodes are the public page's 31 from #221 (`docs/specs/application.md` 41.5).
- **[#231] Amended (2026-10-10)** by `ADR-231-slide-toward-the-button.md`: the preview's 31 Nodes
  are the public page's 41 (`docs/specs/application.md` 42.5); and by
  `ADR-231-slide-in-the-editor.md`: the editor's page places its parent and its next steps and
  slides, so "nothing slides there" no longer holds (42.8).
- Issue: #205 -- Architecture: the preview of a hidden Tree as its readers will see it -- its
  address, what it shows of an unfinished draft, and its two buttons at the top left
- Spec: `docs/specs/application.md` 40.2 and 40.3 (new); 6, 11.2, 13.1, 24.1, 24.3, 34.1, 34.3,
  34.5 and 34.7 amended, marked **[#205]**
- Amends: `ADR-133-reuse-rule.md` decisions 3 (a third `Links`, the preview's), 5 (what edit mode
  does not render is the editor page's choice; the preview's page renders the neighbour frames
  and the slide) and 7 (the preview's page reads at most seventeen Nodes, as a public page);
  `ADR-38-neighbourhood.md` decisions 1 and 5 (`neighbourhood` reads a draft too, through the same
  `getNode`, within the same seventeen); `ADR-133-admin-routes.md` decision 6 (the preview emits its
  draft's Theme as the editor does, on the whole page; and `<html lang>` on an editor or preview
  address is the content language, resolved from the draft for a caller with a role)
- Depends on: `ADR-205-preview-address.md`, `ADR-133-reuse-rule.md`, `ADR-133-structure-editing.md`
  (decision 3 and its rejected slide), `ADR-180-editor-interface-not-themed.md` (the editor's own
  interface in the default look)
- Measurements: `docs/research/issue-205-top-left-room.md` (section 5, `<html lang>`)
- Built by: #206

## Context

"how the end users will see it" (the owner, #202). The public Node page draws a published Tree
through `TreeView`, `Bubble`, `Interior`, `Carousel`, `EnlargedView`, `LanguageSwitch` and
`Explainer`, which take one optional setting, `edit` (34.1): absent, a component draws exactly
the public markup; present, it builds its addresses and picture URLs through `edit.links` and
calls the editor's slots where the controls belong (34.2, 34.3). `views.test.tsx` pins that a
component given an `edit` whose slots are all absent draws the same markup, save the addresses
`links` builds (34.8). The editor's page passes no neighbours, so nothing slides there (34.5);
`ADR-133-structure-editing.md` rejected the slide in the editor "for a motion the creator does
not walk in", at the cost of "neighbour frames of draft Nodes, a `neighbourhood` over `DraftNode`,
and the 17-Node payload of a draft". A draft's pictures and theme files are served by the admin
routes alone, to a caller with a role (22.6, 33.8). In the editor the draft's Theme paints the
Tree, and the editor's own interface -- what carries `data-editor-ui` -- keeps the default look
(13.1, #180). The editor's `<html lang>` is the chrome language of the `[lang]` segment, English
for a draft in German (the research record, section 5), where 24.1 says it is the language being
edited.

## Decision

1. **The draft through the public components, by the reuse rule's one setting with no slot.**
   The preview's page passes `edit` = `previewMode(...)` (`src/admin/preview.ts`): an `EditMode`
   whose `links` are the preview's -- `previewLinks()`, the four addresses behind
   `/admin/preview` and every picture through `adminImageHref`, the admin image route (22.6) --
   and whose `slots` are `{}`; its `treeId`, `languages` and `words` are the editor's, which no
   component reads without a slot. By 34.1 and 34.8 the components then draw the public markup
   with the preview's addresses: no field, no structure control, no step button, no
   `[data-field]`, no `contenteditable`, no `editor-` class. No component changes, and 3.4's
   "one optional setting" stays true. `views.test.tsx` holds it: the fixtures of 34.8 drawn with
   the preview's `edit` give the public markup but for the addresses, each of which is the
   public one behind `/admin/preview` or a picture on the admin image route.

2. **The neighbour frames and the slide run, within a public page's bound.** The readers walk
   the Tree with the slide (11), so the preview draws it: the page reads its Nodes as the public
   page does -- the centre and its chain (`centreOf`), then the centre's neighbourhood -- at most
   **seventeen** Nodes (11.2), never more. The editor's reason against the slide, a motion the
   creator does not walk in, does not hold where the creator walks the Tree as a reader, and the
   preview takes the cost it named:
   - `neighbourhood` takes a `Readable<N>`, as `centreOf` does (34.6), and reads a Node's Links
     through `linksOf`, so a draft's question step with one Answer places that one; public
     callers are unchanged, and the assertions `neighbourhood.test.ts` holds run as they are.
     `loadPage`, whose only caller among the pages is the public Node page, is not widened:
     the preview's page calls `centreOf`, `draftCentre` and `neighbourhood` itself, as the
     editor's page calls `centreOf` itself.
   - The page applies the editor's centre rule for a draft between `centreOf` and
     `neighbourhood` (#139, inline in the editor's page today, moved into `src/neighbourhood.ts`
     as `draftCentre` and called by both pages): a Node at the end of the path is an aside only
     where the entry before names it as an Option; any other explanation Node there is the
     centre. So a fresh step a yes or a no made is the centre in the preview as in the editor,
     and the way back shows the step the preview showed.
   - Every `href` the page carries -- the chain's, the placements', the asides' -- is the
     preview's address of its `address` (`previewLinks().node`), as the editor's page gives the
     chain and the asides theirs (34.7), so `Slider` finds the placement a control names
     (11.3).
   - A neighbour frame names no picture (11.4); the centre's pictures and an open Overlay's are
     requested from the admin image route, file for file as 11.5 lists them for a public page.

3. **The draft's Theme, on the whole page.** As on a public page (13.1), the draft's Theme paints
   everything: the chrome bar (`ADR-205-preview-bar.md`), the page behind the Bubble, the
   Bubble, its buttons, the Overlay, the strip and the disclaimer. The bar's logo is the variant
   for the draft's background (13.2), not the editor's `logo.light`; the tab's icon is the
   draft's. `ThemeStyle` emits it as the editor does -- the draft, its files through
   `adminThemeHref` (the public theme route serves only a published copy's), and the second
   block for `[data-editor-ui]` (13.1, #180) -- because the preview's way back is the editor's
   own control and carries `data-editor-ui`, so it keeps the default look; nothing else on the
   page carries it. No revision in the element's `href`: nothing writes on the page.

4. **A head for no crawler.** `noindex, nofollow` (20.9: the admin layout's `<meta>` and the
   proxy's header); the `<title>` the public Node page's, "<the step's title> - <the Tree's
   title>", the placeholder of `ADR-205-unfinished-draft.md` standing in for a title the draft
   lacks; and **no** JSON-LD, canonical link, `hreflang` alternates, dataset link or
   `<meta name="description">`: no crawler reads the page, and each of them names a public
   address that answers 404 while the Tree is hidden (23.1).

5. **`<html lang>` is the content language.** As on the public page and as 24.1 says of the
   editor: the root layout's `htmlLang` resolves an address under `/admin/preview/` or
   `/admin/trees/` from the draft for a caller with a role on its Tree -- the page's session,
   `permitted('read')`, the draft, `parseUrl` -- and gives anyone else the chrome language of
   the `[lang]` segment, as it gives every admin address today, so that the language a hidden
   Tree declares reaches nobody without a role. Where a caller with a role asks for a path that
   names no Node of the draft (the 404 page) or for a draft that cannot be opened (19.5), it gives
   the chrome language of the segment too. One rule for both addresses: it also makes the
   editor's `<html lang>` what 24.1 says, which on `dev` it is not for a draft in a language the
   chrome does not speak (the research record, section 5: `en` around a Bubble in German) nor, by
   the same rule read in `src/app/[lang]/layout.tsx`, for a draft whose default language is Dutch
   opened without `?lang`, whose segment is `_`.

## Alternatives rejected

- **No slide, as in the editor.** The readers see the slide; the owner asked for it in #35 ("I
  want the transitions to slide over the tree to the next node"); and the editor's reason against
  it does not hold here (decision 2).
- **A second optional prop on the seven components** (`links?: Links`), **or a mode union in place
  of `edit`** (`{ kind: 'edit' | 'preview' }`). Seven interfaces widened, or rewritten, for what
  an `edit` with no slot already draws and 34.8 already tests; and 3.4's "one optional setting"
  would then be false.
- **A wrapper that rewrites the addresses in the rendered public markup.** `ADR-133-reuse-rule.md`
  rejected wrappers over React's markup; a rewrite by string would also miss an address a client
  component builds.
- **The public route drawing the draft, or the preview framing the public page.** A public route
  reading a draft and the session (23.1, 20.5); and a hidden Tree has no public page to frame.
- **The editor's look on the preview's bar** (`data-editor-ui`, `logo.light`). The bar is the
  readers' (`ADR-205-preview-bar.md`), painted by the Tree's Theme on the public page.
- **The JSON-LD, the canonical link and `hreflang` "as the readers' page will have them".** They
  are for crawlers, not readers, and would name addresses that answer 404 while the Tree is
  hidden.
- **`<html lang>` from the segment alone, as the editor has it today.** Wrong for a draft whose
  language on screen is not a chrome language, and for a Dutch-first draft opened without
  `?lang`; and **resolving it for every caller** would tell a visitor without a role which
  languages a hidden Tree declares.
- **Raising the bound for the preview.** Seventeen is the number that stands between a page and
  "the browser received the whole Tree" (11.2); the preview is a page.

## Consequences

- `src/admin/preview.ts` (new): `previewMode`, and the draft as the preview reads it
  (`ADR-205-unfinished-draft.md`); `src/editor/links.ts` gains `PREVIEW_PREFIX` and
  `previewLinks()`; `src/neighbourhood.ts` gains `draftCentre`, and `neighbourhood` takes a
  `Readable<N>` (`loadPage` is unchanged); the editor's page calls `draftCentre` where it has the
  rule inline; `src/app/[lang]/layout.tsx`'s `htmlLang` gains the admin rule of decision 5.
- `application.md` 11.2's signature, 13.1, 24.1's last bullet, 24.3, 34.1, 34.3, 34.5 and 34.7
  carry dated notes; section 40.2 and 40.3 are the contract.
- `views.test.tsx`, `neighbourhood.test.ts`, `tests/admin/preview.test.ts` and
  `tests/browser/preview.spec.ts` (#206) assert the decisions (40.9); decision 5 for a caller
  with a role, a caller without a session and an account logged in with no role on the Tree, at
  a preview and an editor address, on a path of the draft and on one that is not.
