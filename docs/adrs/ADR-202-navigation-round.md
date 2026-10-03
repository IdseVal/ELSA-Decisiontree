# ADR-202-navigation-round: the owner's three missing ways between pages are two build issues, one architecture freeze for the preview and the build after it, filed `ready` on the owner's words

- Status: ACCEPTED -- 2026-10-03
- Issue: #202 -- Missing navigation components (the owner's instruction)
- Issues filed: #203 to #206
- Specs affected: none amended here; #203 and #204 amend the sections they change, #205
  freezes the preview in a new section of `docs/specs/application.md`, #206 builds it
- Measured: `docs/research/issue-202-bar-room.md`, the room in the chrome bars for #204's
  two buttons
- Core document: amended here, marked `[#202]`: the preamble; a new bullet of 3.4 holding
  the owner's words whole; 3.4's passage on what the round does not change, for the
  end-user pages; a PROPOSED row **Preview** in 5; a new open item 10.41 (the preview),
  OPEN for #205

## Context

The owner wrote in issue #202, under "Context":

> "I am still missing a back to the top level interface button in the tree editor interface
> /admin/trees/...
>
> From the regular window, I want top right a button that says Editor and that directs to
> the login, or if user is logged in, moves to the editor interface on /admin. From the
> /Admin page I want a button that routes back to the regular page, in the same place.
>
> In an unpublished tree, I want a button that routes to a window with a preview of the
> tree, how the end users will see it. Place the button top left (not in the header bar).
> And from that view, in the same place a button that brings the user back to the editor
> interface where he came from"

and under "Task": "Put issues on the board for these and set them to ready. Thanks!" The
task is the issues, not the changes, as it was in #169 and #194.

What stands on `dev` (`6d0ea4b`) where the three points land:

- **The editor's bar** holds the Tree's logo at the left and, at the right, the language
  switch, the autosave indicator, `account` and `logout` (`docs/specs/application.md` 24.3;
  `src/app/[lang]/admin/trees/[tree]/[...path]/page.tsx`). Nothing on the page leads to the
  creators' overview at `/admin` (26.4) but the Sheet that asks for a new login once the
  session has expired, and deleting the Tree, which ends there. The public Node page has
  had a way out since #163: a round arrow at the left of its bar, before the Tree's logo,
  that leads to the public overview (`src/components/BackToOverview.tsx`, named by the
  chrome string `toOverview`, "All decision trees"). Its pull request, #164, left the editor
  out: "Adding the arrow there would be one line in the editor page's header with
  `adminHref('/admin', uiLang)`, but it is not in this issue, so I left it out."
- **The public pages and `/admin`**: no chrome bar links them (24.3). The session cookie
  is sent to `/admin` only (`Path=/admin`, 20.4), and no public route reads or sets a
  cookie (20.5; core document 8 and 9). `/admin` shows the login page to a visitor without
  a session and the creators' overview to one with a session (24.1, 24.2).
- **The room in the bars**, measured on 2026-10-03 on the production build of `dev`
  (`6d0ea4b`), the two seeded Trees in English and in Dutch, at the ten viewports of 10.6
  and at 479 x 800, with a control saying "Editor" or "Website" drawn into the bar's
  controls in the share button's look and in the account link's: at 390 x 844 and below, a
  Node page's bar has 7 to 83 pixels of room left, and "Editor" takes 45 to 47 of it, its
  gap included, in the share button's look (38 to 40 in the account link's). At 320 x 480
  the bar then grows past the window in both languages and beside both Trees' logos, to
  330 to 360 pixels, and at 360 x 640 in Dutch beside the first Tree's logo, to 362 to
  368, which the no-scroll rule forbids (10.6). At 320 x 480 the current language's pill
  is 48.4 ("English") or 71.5 ("Nederlands") pixels wide beside the first Tree, 46.5 or 67.7
  beside the second; with it given up below 480, as the Tree-less admin pages' bar has
  given it up since #135 (24.3), "Editor" in the share button's look fits every viewport
  below 480, with 27 to 43 pixels to spare at 320. The overview's bar keeps 37 to
  48 pixels at 320 x 480 with "Editor" in it, and the bar at `/admin` keeps 13 to 27 with
  "Website" beside the administrator's four controls, so neither needs to give anything
  up. The method, the script and every row are `docs/research/issue-202-bar-room.md`.
- **A hidden Tree** is on no public route (core document 9; 23.1, under which no public
  route reads a draft). The editor draws its draft through the public components with the
  edit setting of the reuse rule (34), without the neighbour frames and the slide (34.5),
  and keeps its own interface in the default look (24.3, #180). No page shows a hidden Tree
  as its readers will see it.
- **Three open issues work in the same places.** #196 builds the login by e-mail address:
  it changes the login page at `/admin` and the `login()` that every browser test that logs
  in calls (`tests/browser/admin.ts`, 35.2). #197 puts the mention of a Tree's Authors in
  the Node page's bar, in the room between the Tree's mark and the controls (39.4). #200
  cuts a long title written in the same bar. #196 and #200 were dispatched at 20:36Z and 20:37Z on
  2026-10-03, minutes before this run.

## Decision

1. **Three points, four issues.**

   | Owner's point (in the order of #202) | Issue |
   |---|---|
   | 1. "I am still missing a back to the top level interface button in the tree editor interface /admin/trees/..." | #203 |
   | 2. "From the regular window, I want top right a button that says Editor and that directs to the login, or if user is logged in, moves to the editor interface on /admin. From the /Admin page I want a button that routes back to the regular page, in the same place." | #204 |
   | 3. "In an unpublished tree, I want a button that routes to a window with a preview of the tree, how the end users will see it. Place the button top left (not in the header bar). And from that view, in the same place a button that brings the user back to the editor interface where he came from" | #205 (contract), #206 (build) |

2. **One architecture issue, #205, for the point that touches contracts.** A preview needs
   an address the admin area does not have (`ADR-133-admin-routes.md` decision 1: "The
   admin area is exactly these addresses"); the public drawing with addresses that stay in
   the preview and pictures from the draft, which are neither what the reuse rule gives a
   public page nor what it gives the editor (`ADR-133-reuse-rule.md` decisions 1, 3 and 5);
   a drawing of a draft that need not be valid yet (`ADR-132-draft-and-publish.md`,
   `docs/specs/tree-format.md` 7), where every public component draws a Tree that passes
   every rule; and a hidden Tree shown inside the admin area only (core document 9,
   `ADR-132-hidden-trees-and-findability.md`). The implementer role tells a build run to
   report a contradiction with a spec rather than route around it, and to ask rather than
   build its best guess. What the owner's words leave open is listed in #205's TASK and in
   core document 10.41, as 10.39 and 10.40 were listed for #195.

   Points 1 and 2 change no address, interface, store or format, and leave nothing to
   choose but the readings of decision 5. #203 puts a component that exists into the
   editor's bar. #204's "Editor" button is a link to an address that exists, and what the
   owner asks it to do -- "directs to the login, or if user is logged in, moves to the
   editor interface on /admin" -- is what that address already does (24.1, 24.2), so the
   public page needs no knowledge of the session, which it must not have (20.4, 20.5; core
   document 8 and 9). Both add a control to bars that 24.3 and `ADR-133-admin-routes.md`
   decision 7 list, on the owner's words, as #176 moved controls out of the editor's bar
   on #169's. Each build issue amends the spec text it changes, as the build issues of #102
   and #169 did, and marks decision 7 in that ADR's header, as #195 marked the ADRs it
   amended.

3. **Order, by `Depends on:` lines only.**
   - Every issue waits for #202, so that this record is on `dev` before any run reads it:
     in the round of #169, #171 and #172 were dispatched while that round's record (#182)
     was still in review (`ADR-194-login-and-authors-round.md` decision 3).
   - #203 and #204 wait for #196. Both need a session in their browser tests, and #196
     moves `login()` from a user name to an e-mail address and changes the login page at
     `/admin`, which #204 changes too. Built side by side, one of the two would merge into
     a `dev` on which its tests no longer log in -- the reason #197 waits for #196.
   - #204 also waits for #197 and #200. All three change the Node page's bar: #197's
     mention takes the room between the Tree's mark and the controls and gives way by that
     room (39.4), #204's control narrows it, and #200 cuts a long title beside it. One run
     at a time measures that bar.
   - #204 also waits for #203. Both amend 24.3's table and add a line to the header of
     `ADR-133-admin-routes.md`; one after the other, neither merges into the other's lines.
     It costs #204 little: #203 and #197, which #204 waits for as well, can both start when
     #196 merges, and #203 is the smaller.
   - #205 waits for #202 only. It changes no code and measures the editor, not the bars
     #196, #197 and #200 change, so it can run beside them.
   - #206 waits for #205 and for #203: both edit the editor's page and the styles of its
     bar, and #206's screenshots and measurements must show the arrow and the preview
     button together. If #206 is to touch what #204 or #197 change -- the public Node page's
     bar, its code or its chrome strings, for instance by drawing that bar in the preview --
     #205 adds them to #206's line (#205's TASK 8).

4. **All four are labelled `ready`, on the owner's words, by the account that filed them.**
   The owner wrote "Put issues on the board for these and set them to ready." The issues'
   timelines show `DeKnecht`, the account that filed them, applying `ready` to each at its
   creation, 20:54:29Z to 20:54:50Z on 2026-10-03. The project's autonomy mode is
   `propose`, in which an issue an agent files is labelled `proposed`
   (`.orca/roles/planner.md`); this rests on the owner's explicit words, as
   `ADR-169-tree-creation-ui-round.md` decision 4 did on #169's, and not on a reading of
   them (`ADR-194-login-and-authors-round.md` decision 4). `DeKnecht` is a trusted promoter
   in `.orca/dispatch.yml`, so the dispatcher keeps the label. None is labelled `complex`.

5. **Where the owner's words leave a choice, the record says which reading was taken and
   does not widen the request.** Each is in core document 3.4's `[#202]` bullet, marked
   PROPOSED, and in the issue concerned, so that the owner can overrule it there:
   - #203: "the top level interface" is the creators' overview at `/admin`, the first page
     of the admin area and the one that lists the Trees a creator edits -- in the owner's
     #131, "the same front page with the overview of datastructures". The owner gave no
     place: the button is #163's arrow, in the same place in the editor's bar -- at the
     left, before the Tree's logo -- with the same look and the same name, `toOverview`,
     since the editor "looks exactly like the final datastructure" (#131). The 403 page, the page of an uneditable Tree and the expired
     session's Sheet already link to `/admin` under that name.
   - #204: "the regular window" is the overview and every Node page of a published Tree,
     the pages a reader walks, and not the 404 page, which also answers addresses of the
     admin area (24.2) and has a button of its own that leads to the overview. The button
     says "Editor" in English and in Dutch, as the account link says "Account" in both since
     #176. "The /Admin page" is the page at `/admin` in both its states, as the owner's #131
     describes it ("if we go to our page on /admin, we will first be shown a login page,
     once logged in we are shown the editing page"), and no other admin page. The button
     back, whose words the owner did not give, says "Website" in English and in Dutch and
     leads to the public overview in the page's chrome language (an alternative rejected
     below). "In the same place": each button is the last control at the right end of its
     bar, in the look of that bar's own controls -- a pill like the share button on the
     public bars, a link like `account` on the bar at `/admin`. Below 480 pixels wide a Node
     page's bar gives up the current language's pill for "Editor", as the Tree-less admin
     pages' bar has given it up since #135, so that the bar holds the button at 320 pixels
     wide (the measurements above).
   - #205 confirms or replaces: the preview is a page of the admin area, behind the login,
     for an account with a role on the Tree -- never a public route, which core document 9
     rules out; it opens in the same tab; the button is offered on a hidden Tree only, as the
     owner's "In an unpublished tree" reads; "where he came from" is the step and the
     language the preview was opened from; the buttons say "Preview" ("Voorbeeld") and
     "Back to the editor" ("Terug naar de editor").

6. **The core document is amended here for every passage the owner's words make untrue.**
   One is: 3.4's passage on what the round does not change, among them the end-user pages,
   which gain the "Editor" button and, below 480 pixels wide on a Node page, give up the
   current language's pill for it (the pages it stands on, and the pill, PROPOSED, decision
   5). It carries a `[#202]`
   mark pointing at the new bullet of 3.4, which holds the owner's words whole with the
   readings of decision 5. Nothing else the core document says is made untrue by the
   owner's words: the editor's arrow and the button on `/admin` add to pages whose controls
   it does not list; the preview is a page of the admin area, so section 9's "A hidden Tree
   must never appear on a public route" stands as written; section 8's "no public route
   ever sets a cookie" stands because the "Editor" button is a plain link; and section 4's
   "No editorial-review workflow in code" stands, since the preview shows a creator the
   Tree and reviews nothing. One sentence may become untrue by what #205 decides, not by
   the owner's words: 3.4's "The editor reuses the end-user components through one optional
   setting", if the preview needs a second; #205 marks it then (its TASK 7). New: the
   PROPOSED row **Preview** in 5, and open item 10.41, OPEN for #205.

## Alternatives rejected

- **Asking the owner first, with `needs-human`, about the words, the places and the
  preview's details.** The words and the places are readings the owner can overrule on the
  issue concerned, where its run reads the answer. The preview's details are contracts: the
  Architect's to decide and the owner's to overrule, as 10.39 and 10.40 were on #195.
- **No architecture issue for the preview.** A build run would have to add an address that
  `ADR-133-admin-routes.md` decision 1 says the admin area does not have, change what the
  reuse rule gives a component, and decide on its own what a reader sees of an unfinished
  draft; the implementer role tells it to report and ask instead.
- **Deciding the preview in #206 itself**, the build issue amending the spec as #204 does.
  #204 adds a control to two bars on the owner's words and leaves nothing to choose but the
  readings of decision 5; the preview needs the four decisions of decision 2, between
  alternatives the owner did not choose.
- **Showing "Editor" only to a visitor who is logged in, or pointing it at the login page or
  the editor by the session.** The public page would have to read the session cookie, which
  the browser never sends it (20.4) and which no public route may read (20.5; core document
  9: "The account and the session exist on the admin routes and nowhere else"). `/admin`
  already tells the two cases apart.
- **Leading the button on `/admin` back to the page the visitor came from**, through the
  browser's history or the page that linked there. `/admin` is also opened from a bookmark
  or a typed address, where there is no such page, and a step back in the history may leave
  the site. The public overview is the top of the public pages, as `/admin` is the top of
  the admin area.
- **"Website" on every Tree-less admin page.** The owner named the `/admin` page. The four
  pages share one bar (`src/components/AdminChrome.tsx`), so the wider reading stays a small
  change if the owner asks for it on #204.
- **One issue for points 1 and 2.** #203 can start once #196 merges; #204 waits for #197 and
  #200 as well, and the editor's arrow would wait with it.
- **#204 before #197, with no dependency between them**, so that the button comes sooner.
  Built side by side, the two runs would measure the room in one bar against two different
  sets of controls, and the second to merge would measure it again.
- **#203 beside #196.** See decision 3.
- **Making room for "Editor" below 480 pixels wide with the Tree's logo, or with an icon.**
  At 320 x 480 in Dutch the first Tree's bar has 7.1 pixels of room, and "Editor" takes
  about 47 there: the logo, 58.4 pixels wide there (its maximum at that size,
  `calc(22vw - 12px)`), would keep about a third of its width. An icon that says nothing
  would not say "Editor", as the owner asked, and an icon button and its gap still take
  more than 7 pixels. The current language's pill is the one thing in the bar that is
  neither a control nor the Tree's mark -- but for #197's mention, which gives way by its
  own room already (39.4) -- and the Tree-less admin pages' bar already gives it up below
  480 (24.3, #135).
- **Labelling the issues `proposed`.** The owner said `ready`, in the issue.

## Consequences

- The dispatcher holds all four until this pull request merges and closes #202. Then #205
  can start at once; #203 once #196 merges; #204 once #196, #197, #200 and #203 have; #206
  once #205 and #203 have.
- The specs are not amended here; until #203 to #206 merge they describe what is on `dev`,
  which is correct. Core document 3.4 states the owner's changes from the moment this
  merges, ahead of the build, as it did in the rounds of #75, #131, #169 and #194; 10.41 is
  OPEN until #205 decides it.
- The overview and every Node page gain a link to `/admin`. `/admin` stays `noindex`
  (20.9) and outside the sitemap (23.4), and `robots.txt` is unchanged (23.3); #204 checks
  all three.
- #205 runs while #203 and #204 wait, and amends some of the same lines: 24.1 and 24.3, and
  the header of `ADR-133-admin-routes.md`, for decision 1's addresses where #203 and #204
  mark decision 7. Whichever merges second keeps both, as `ADR-169-tree-creation-ui-round.md`
  said of its own overlapping paragraph.
- #163's arrow is named neither in 3.4's passage on what the round does not change -- #164
  reported that and changed no document -- nor in `application.md` 24.3's row for the Node
  page. #202 did not ask about it, so the core document stays as it is there; #204 names the
  arrow in 24.3's row for the Node page, the row it amends for "Editor".
