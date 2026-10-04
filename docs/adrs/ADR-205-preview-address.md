# ADR-205-preview-address: the preview of a hidden Tree is `/admin/preview/<tree-id>/<path>`, the public grammar behind a sixth word of the admin area; it answers like the editor's address for a caller without a session or a role, and sends a published Tree's preview to its editor

- Status: ACCEPTED (frozen) -- 2026-10-04; decides core document 10.41 (the preview's address,
  who may open it, and what it answers without a session or a role, for an unknown id, for an
  uneditable Tree and for a Tree published since it was opened) and confirms 3.4 `[#202]`'s
  reading that the preview is a page of the admin area, behind the login, for an account with a
  role on the Tree, and never a public route
- Issue: #205 -- Architecture: the preview of a hidden Tree as its readers will see it -- its
  address, what it shows of an unfinished draft, and its two buttons at the top left
- Spec: `docs/specs/application.md` 40.1 and 40.8 (new); 4.1, 4.3, 6, 14, 24.1 and 24.2 amended,
  marked **[#205]**
- Amends: `ADR-133-admin-routes.md` decision 1 ("The admin area is exactly these addresses":
  the preview's two join them) and decision 5 (the admin area needs JavaScript, but for the
  preview, whose markup is the public page's)
- Depends on: `ADR-133-admin-routes.md` (the admin area's addresses, the login page in place,
  the 403 page), `ADR-132-hidden-trees-and-findability.md` (a hidden Tree on no public route),
  `ADR-132-roles-and-permissions.md` (who may read a draft)
- Built by: #206

## Context

The owner (issue #202, 2026-10-03): "In an unpublished tree, I want a button that routes to a
window with a preview of the tree, how the end users will see it. Place the button top left (not
in the header bar). And from that view, in the same place a button that brings the user back to
the editor interface where he came from".

A hidden Tree is on no public route: "A hidden Tree must never appear on a public route" (core
document 9); every public route works from the published set, and none reads a draft
(`application.md` 23.1). Its creators see it in the editor alone, at
`/admin/trees/<tree-id>/<id-1>/.../<id-n>[?lang]`: the public grammar of 4.1 behind
`/admin/trees`, so that the up arrow, the Answer buttons and the language switch build the
editor's addresses by construction (24.1, `ADR-133-admin-routes.md` decision 2). The admin area
"is exactly these addresses" (decision 1): `/admin`, `/admin/new`, `/admin/account`,
`/admin/accounts`, the editor's two and `/admin/api/...`. The session cookie is sent under
`/admin` only (`Path=/admin`, 20.4); every response there is `noindex` and `no-store` (20.9). A
caller without a session sees the login page at the address asked for; a caller without a role
on the Tree, the 403 page (24.2, 21.3).

## Decision

1. **The address is the public grammar behind `/admin/preview`.**

   ```
   /admin/preview/<tree-id>                                 307 to the preview of the root Node, ?lang kept
   /admin/preview/<tree-id>/<id-1>/.../<id-n>[?lang=<tag>]  the preview: the grammar of 4.1, 1 <= n <= 50
   ```

   The path after the Tree id is the public path -- the Trail, then the Node; at most 50 ids;
   `?lang` the same -- parsed by the same `parseUrl` against the draft, as the editor's is (24.1).
   The preview's `Links` (`previewLinks()`, beside `editorLinks()` in `src/editor/links.ts`)
   prefix the four addresses with `/admin/preview`, so the up arrow (`trail`), the Answer
   buttons (`follow`), the language switch (`withLang`), an Overlay's heading and its links, and
   `startAgain` keep the reader inside the preview; the preview's address of a step and the
   editor's differ in that word alone. `preview` is a sixth word under `/admin`, beside `new`,
   `account`, `accounts`, `trees` and `api`. No Tree id stands there -- Tree ids stand after
   `/admin/trees/` and now `/admin/preview/` -- so it collides with nothing and reserves no
   Tree id.

2. **Who may open it, and what it answers.** The page is `authenticated → permit('read') → draft
   → parseUrl`, as the editor's (34.7), and then the 307 of a published Tree: a role on the Tree --
   its creator, a collaborator, the administrator -- reads its draft (21.2), and a path that is not
   a Node of the draft is the 404 page before the Tree's state is asked.

   | Case | Answer |
   |---|---|
   | No session | The login page rendered at that address, 200, `noindex`; it reloads the address on success (24.2). |
   | A role on a hidden Tree | The preview. |
   | No role on the Tree | The 403 page (21.3, 24.2). |
   | A reserved or unknown Tree id | 403 for a caller without the administrator flag; 404 for the administrator (24.2). |
   | A path that is not a Node of the draft | The 404 page, for a caller with a role (24.2). |
   | An uneditable Tree (19.5) | The page the editor's address shows for it: its blocking violations under `notEditable`, and the link to `/admin` (`toOverview`). |
   | A published Tree | **307 to the editor at the same path and `?lang`**: `/admin/trees/<tree-id>/<id-1>/.../<id-n>[?lang]`. |

   Every answer carries 20.9's two headers, which the proxy sets under `/admin`, and none sets a
   cookie (20.5, 35.5).

3. **A published Tree's preview leads to its editor.** The preview shows a hidden Tree as its
   readers will see it once it is published, and its button is offered on a hidden Tree only
   (`ADR-205-way-there-and-back.md` decision 4). A Tree that is published has its readers' view
   on its public page, which the editor's settings panel links (the public link, 33.3). So a
   preview address of a published Tree -- the preview of a Tree published while its editor stood
   open in another tab, or a preview reloaded after publishing -- answers a 307 to the editor of
   the same step in the same language, whose settings button then says `published` (33.1). The
   target is built from the address `parseUrl` accepted, so it is never an address the request
   chose.

4. **The preview needs no script.** Its markup is the public page's (`ADR-205-preview-drawing.md`
   decision 1), whose every control is a link or a disclosure without JavaScript (section 14):
   the walk, the Sheets, the language switch, the way back. It carries no `needsJavaScript`
   sentence, which 24.2 and 14 have an admin page show in place of its first control. The login
   page shown at its address without a session needs script, as at every admin address.

5. **Never a public route.** The preview is under `/admin`, behind `Path=/admin`, `noindex` and
   `no-store`; its pictures and theme files come from the admin routes that serve a draft's to a
   caller with a role (22.6, 33.8). No public route reads a draft still (23.1): a hidden Tree's
   every public address answers the 404 of 4.3 after a preview of it as before, and core
   document 9's "A hidden Tree must never appear on a public route" stands as written.

## Alternatives rejected

- **A word inside the editor's path** (`/admin/trees/<tree-id>/preview/...`, or `.../<node>/preview`).
  The editor's path is the public grammar, in which every id is a valid Node id: `preview` is a
  valid id (`tree-format.md` 3.1), so the word would collide with a Node of that name, and
  reserving it would change the format's id grammar for a screen.
- **A query parameter on the editor's address** (`?preview`, `?view=reader`). One address would
  draw two pages; every link of the walk would have to carry the parameter (`trail`, `follow`,
  `withLang`), where 4.1 says other parameters are ignored; and the address bar would not tell a
  creator, or a collaborator a link is pasted to, which page an address opens.
- **A public address with a secret** (`/<tree-id>/...?preview=<token>`). A hidden Tree on a
  public route, which core document 9 forbids; and a preview for someone without an account,
  which the owner did not ask for (#205's OUT OF SCOPE).
- **The public Node page drawing the draft for a logged-in creator.** A public route would read
  the session, which `Path=/admin` keeps from it and 20.5 forbids, and a draft, which 23.1
  forbids.
- **Drawing a published Tree's draft at its preview address.** A preview of a published Tree,
  which the owner did not ask for (#205's OUT OF SCOPE): their words are "In an unpublished
  tree".
- **A published Tree's preview sending the reader to its public page.** The public copy may lack
  the step: while the draft fails a rule, the last valid copy stays public (19.4), and a step
  made since is a 404 there; and it would leave the admin area, and with it the way back.
- **A 403 or a 404 for a published Tree's preview.** The Tree exists, the caller may read it, and
  neither answer says either.
- **`/admin/previews/<tree-id>/...`**, plural like `trees`. `trees` names the Trees the editor
  holds; `preview` names the view, and one word is what a creator reads in the address bar.

## Consequences

- `application.md` 4.1 gains the two lines above; 4.3's rows that name an editor address name the
  preview's too; 24.1 gains the addresses and 24.2 the rows for a published Tree and for script;
  section 6 gains `src/app/[lang]/admin/preview/[tree]/page.tsx` and `[...path]/page.tsx`.
- `tests/browser/preview.spec.ts` (#206) asserts every row of decision 2's table, the 307s, the
  headers and the absence of `Set-Cookie`; `deployment.spec.ts` and `findability.spec.ts` add
  the preview to their sweeps (40.9).
