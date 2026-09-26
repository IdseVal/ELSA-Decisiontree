# ADR-133-admin-routes: the admin area is five pages under `/admin`, all inside `[lang]`; the editor's address is the public grammar behind `/admin/trees`; the login page is rendered in place of any admin page a visitor asks for; the admin area needs JavaScript; every page emits its own Theme

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 24 (new); 4.1, 4.3, 6, 13.1 and 14 amended
- Amends: `docs/adrs/ADR-5-url-scheme.md` (the admin addresses join the grammar behind the
  one reserved word #132 added), `ADR-19-content-language-in-the-route.md` (the admin pages
  take their language from the same `[lang]` segment), `ADR-38-theme-delivery.md` and
  `ADR-38-without-javascript.md` (decisions 5 and 6 below), `ADR-132-editor-api.md`
  (decision 2 named `/admin/trees/<t>/...` as #133's; this is it)
- Depends on: `docs/adrs/ADR-132-accounts-and-sessions.md` (the session and the cookie),
  `ADR-132-many-trees-per-deployment.md` (the overview at `/`, `admin` reserved)

## Context

The owner (core document 3.4): "if we go to our page on /admin, we will first be shown a
login page, once logged in we are shown the editing page, this is the same front page with
the overview of datastructures ... when clicked a new datastructure can be created. The new
datastructure creation looks exactly like the final datastructure". #132 froze what is
behind the screens -- the cookie with `Path=/admin`, the route handlers under
`/admin/api/`, `admin` as a reserved Tree id -- and named the screens' addresses as this
issue's (`application.md` 22.1: "`/admin`, `/admin/trees/<t>/...`"). Four things have to be
decided before a screen can be drawn: which addresses exist, whether they sit under the
`[lang]` segment of 4.4 and in which language their chrome speaks, what a visitor without a
session sees at each, and what a reader without JavaScript gets.

The public Node page's up arrow, Answer buttons and language switch are built from a
`PageAddress` whose path is the Trail (4.1). The editor must "look exactly like the final
datastructure", which includes the way back and the language switch, so its address has
to carry the same Trail and the same `?lang`.

## Decision

1. **Five pages, one prefix.** The admin area is exactly these addresses, every one behind
   the cookie's `Path=/admin` (20.4), every one answering 20.9's headers, none of them ever
   a Tree page (4.3):

   ```
   /admin                                   the login page (no session) or the creators' overview (session)
   /admin/new                               the new-Tree form behind the + tile
   /admin/account                           the caller's own name and password
   /admin/accounts                          the administrator's accounts page (403 page for anyone else)
   /admin/trees/<tree-id>                   307 to the editor of the root Node, like /<tree-id> (4.1)
   /admin/trees/<tree-id>/<id-1>/.../<id-n>[?lang=<tag>]   the editor: the public grammar of 4.1, 1 <= n <= 50
   ```

   Logout is not a page: it is the button of `POST /admin/api/logout` (22.1), after which
   the script goes to `/admin`, which shows the login page. There is no `/admin/logout`
   address, because a `GET` may change nothing (20.6).

2. **The editor's address is the public address behind `/admin/trees`.** The path after the
   Tree id is exactly the path of 4.1 -- the Trail then the Node, at most 50 ids, `?lang`
   the same -- parsed by the same `parseUrl`, so the up arrow (`trailHref`), the Answer
   buttons (`followHref`), the language switch (`withLang`) and the centre rule of 10.9
   (`centreOf`) work in the editor by construction: every address the public components
   build is prefixed by the reuse rule (`ADR-133-reuse-rule.md`, decision 3) and nothing
   else about it changes. An explanation Node's editor address renders its parent's editor
   with that Node's Overlay open, as on the public page, and the Overlay is where the aside
   is edited (`ADR-133-structure-editing.md`). The prefix is `/admin/trees/` and not
   `/admin/` so that `accounts`, `account` and `new` -- all valid Tree ids by the grammar
   of `tree-format.md` 3.1 -- can never collide with a Tree, and no further word need be
   reserved.

3. **Every admin page sits under `[lang]`, and the chrome language is resolved as 3.1
   resolves it.** The rewrite of 4.4 already restates `?lang` as the leading segment for
   every path, `/admin/...` included, so nothing about routing is added. On the four pages
   that show no Tree (`/admin`, `/admin/new`, `/admin/account`, `/admin/accounts`) the
   segment is resolved against the chrome languages, exactly as 23.2 resolves the public
   overview: `nl` gives Dutch, anything else English, and `<html lang>` is that chrome
   language. In the editor the segment is resolved against the draft's declared languages
   as the public Node page resolves it against the Tree's (4.3, 4.4): the content language
   is the language being edited, `<html lang>` is it, and the chrome follows it by 3.1.
   `?lang` on an admin address is therefore never a second mechanism: the link the
   language switch emits is the same `withLang` link.

4. **A visitor without a session sees the login page at whatever admin address they asked
   for**, rendered at that address with status 200 and `noindex` (4.3), and the login
   script reloads the same address on success. No `?next=` parameter and no redirect to
   `/admin`, so there is no return address to validate and no open-redirect surface; a link
   to an editor page pasted between collaborators lands on the login form and then on the
   page. `/admin/api/...` without a session stays 401 (22.1). A logged-in caller who asks
   for a Tree they have no role on, or for `/admin/accounts` without being the
   administrator, gets a **403 page** in the chrome language (`forbiddenTitle`,
   `forbiddenText`, a link to `/admin`), never the login page and never a 404 (21.3).

5. **The admin area needs JavaScript, and says so.** Every admin page is rendered on the
   server as complete markup, but its one action -- logging in, creating a Tree, every
   autosave -- is a JSON request the browser's script makes (22.1), because the CSRF layer
   of 20.6 refuses a form-encoded body on every JSON route by design. A page rendered
   without script therefore shows its markup and, in place of its first control, one
   sentence (`needsJavaScript`) in a `<noscript>` element. The guarantee of section 14 is
   the **public** pages' and is unchanged: the editor is an enhancement of nothing, it is
   the application's one interactive tool, and it is used by a lab's creators on their own
   machines, not by "a broad audience" (core document 2).

6. **Every page emits its own Theme, once; the root layout emits none.** 13.1 said the root
   layout emits the one `<style>` block; with many Trees the root layout, which is given
   only the `[lang]` segment, cannot know which Tree a page shows. So the `<style
   precedence="high" href="elsa-theme">` element moves into the pages: the public Node page
   emits its published Tree's Theme, the editor emits its **draft's** Theme (the draft's
   manifest, so a creator who changes a colour -- #144, if promoted -- sees it before
   publishing), and every other page -- the public overview, the four Tree-less admin pages
   and the 404 page -- emits the default of 13.4. One server component, `ThemeStyle`, in
   `src/components/`, is the only caller of `themeStyle`; React hoists the element into
   `<head>` from wherever it is rendered, which is what the `precedence` attribute is for,
   and the layout keeps `<link rel="icon">` out of it by the same move (the page emits it).
   The rules of 13.3 and the test of `theme.spec.ts` are unchanged; `stylesheet.test.ts` is
   unchanged. How `<html lang>` is set for a page whose Tree the root layout cannot see is
   the same problem, and its mechanism is #134's inside this contract: `<html lang>` on a
   Node page and in the editor is the content language of 4.4, on every other page the
   chrome language of decision 3. Two shapes are known to satisfy it -- a request header
   set by a `proxy.ts` (Next.js's middleware) from the path and read by the layout with
   `headers()`, or two root layouts in route groups, one for the paths that carry a
   `[tree]` segment and one for the rest -- and #134 takes the first that measures green in
   `next dev` and in the standalone server, and records which in an amendment to this ADR.
   What is frozen is the contract, not the file.

7. **The chrome bar of each page.** The public Node page's bar is unchanged. The four
   Tree-less admin pages show, where the logo would be, the chrome string `siteTitle` (the
   same string 23.5 makes `llms.txt`'s H1, added by #134) as text, then the language
   switch of the chrome languages, then -- with a session -- the caller's name as a link
   to `/admin/account`, a link to `/admin/accounts` for the administrator, and the logout
   button. The editor's bar shows the draft's logo or title as the public page does, the
   language switch over the draft's languages, the autosave indicator
   (`ADR-133-autosave.md`), the button that opens the top panel (`ADR-133-top-panel.md`),
   the caller's name and the logout button; **no share button**, because the editor's
   address is not a public address and the public link of a hidden Tree is a 404. The
   disclaimer footer stands on every admin page, as the owner asked for "similar styling".

## Alternatives rejected

- **`/admin/<tree-id>/<node-id>`**, the issue's proposal. Shorter by one word, and it makes
  `/admin/new`, `/admin/account` and `/admin/accounts` collide with three legal Tree ids,
  which would have to be reserved one by one as pages are added. One prefix for Trees
  costs one word and reserves nothing.
- **Admin pages outside `[lang]`**, in English only. It would make the admin area the one
  part of the app that ignores `?lang`, and the editor could not reuse the language
  switch, whose links are `withLang` links; the rewrite of 4.4 already covers every path,
  so putting the pages under the segment costs nothing.
- **A separate `?lang` meaning for the editor** (the editing language apart from the page
  language). Two language mechanisms on one page; the content language of the public
  page is already "the language shown", which in the editor is the language edited.
- **Redirecting a visitor without a session to `/admin?next=<path>`.** The usual shape,
  and it needs a validated return address (an open redirect otherwise); rendering the
  form in place needs none and lands on the page asked for by reloading it.
- **A logout page (`GET /admin/logout`).** A `GET` that ends a session is a state change
  on a `GET`, which 20.6 rules out; a button that posts is the shape the API has.
- **A no-script login through a form-encoded route.** It would widen 20.6's layer (b) for
  one page -- the CSRF contract of #132 -- to serve a reader who then cannot edit anything
  without script anyway. Section 14's guarantee stays where it is.
- **Keeping the Theme in the root layout and telling it the Tree some other way.** The
  layout would still have to parse the path, or read a header, to pick a Theme; a page
  that shows a Tree already holds it, and one component that emits the block from the page
  is smaller than a second parser. It also gives the editor its draft's Theme for free.
- **The share button in the editor, copying the public link.** The public link of a hidden
  Tree is a 404, and of a published one it is already on the public page one click away
  (the panel links to it, `ADR-133-top-panel.md`); a button that sometimes copies a dead
  link is worse than none.

## Consequences

- `application.md` 4.1 gains the six admin lines above; 4.3 gains the 403-page row and
  restates the `/admin/...` row; section 6 gains the page files under
  `src/app/[lang]/admin/`; 13.1 is amended (decision 6); 14 gains one row (decision 5).
- `src/chrome.ts` gains `siteTitle` (#134), `needsJavaScript`, `forbiddenTitle`,
  `forbiddenText`, `logout`, `account`, `accounts` (#135), in both languages
  (`application.md` 3.2, the table of new keys).
- #134 moves the Theme emission (decision 6) when it retires `servedTree()` from the
  layout, and chooses the `<html lang>` mechanism; #135 builds `/admin`'s login page and
  the 403 page; #137 the creators' overview and `/admin/new`; #138 the editor's route.
- `tests/browser/login.spec.ts` (#135) asserts decision 4 on three addresses (`/admin`, an
  editor address, `/admin/accounts`) and decision 5's `<noscript>` sentence; the
  `routing.test.ts` of 4.4 is unchanged, because no rewrite changed.
