# ADR-248-admin-bar-buttons-round: the controls of the bar at `/admin` in the look of "Editor" are one build issue, #249, filed `ready`

- Status: ACCEPTED -- 2026-10-13
- Issue: #248 -- Another issue (the owner's instruction)
- Issues filed: #249 (`ui`)
- Specs affected: none here; #249 amends `docs/specs/application.md` 24.3: the table's rows
  for the login page, the creators' overview, `/admin/new`, `/admin/account`, `/admin/accounts`
  and the editor, the `[#135]` note and both `[#204]` notes
- Core document: amended here, marked `[#248]`: the preamble, the status and owner lines, a dated
  note on the `[#202]` bullet of 3.4 where it gives `website` "the look of that bar's own
  controls", another where that bullet gives the widths below which the bars at `/admin` give
  up the site's title, and a new bullet in 3.4 holding the owner's words whole and the readings
  taken of them
- Older decisions amended (decision 4):
  - `docs/adrs/ADR-202-navigation-round.md` decision 5: "in the look of that bar's own controls
    -- a pill like the share button on the public bars, a link like `account` on the bar at
    `/admin`", and its widths: the creators' overview giving up its title and current language
    below 600, the Tree-less admin pages' bar below 480; and its alternative rejected "Giving up
    the site's title below 600 on every Tree-less admin page";
  - `docs/adrs/ADR-133-admin-routes.md`, its `[#204]` amendment: "below 600 the creators'
    overview's bar gives up `siteTitle` and the current language's pill" and "`/admin/new`,
    `/admin/account`, `/admin/accounts` and the editor keep their bars"

## Context

The owner wrote in issue #248, on 2026-10-13 at 06:46:24Z:

> "Make the buttons for account accounts log out, and website in the header bar on /admin look
> the same as the editor button looks in the regular view (with the line around it, more like a
> real button)"

In the issue the sentence is a list item starting with "- ". It is quoted here without that
dash, wrapped so that no line starts with "- ", because a quoted line that does is drawn as a
list item of the quote.

Under "Task", the owner wrote: "Create issues on the board for these points to be picked up and
set them to ready."

**The bar at `/admin`.** `AdminChrome` (`src/components/AdminChrome.tsx`) draws the bar of the
admin area's Tree-less pages (`docs/specs/application.md` 24.3). With a session it holds
`account`, `accounts` (the administrator only) and `logout`; at the address `/admin`, on the login
page and on the creators' overview, `website` ends it (#204). All four carry `.admin-link`:
underlined text without a border. The same component draws the bar of `/admin/new`,
`/admin/account` and `/admin/accounts`. The editor's bar (`/admin/trees/...`) is drawn by the
editor's page, and holds `account` and `logout` with the same class.

**"Editor" in the regular view.** `ToEditor` (`src/components/ToEditor.tsx`) draws `editor`
("Editor") at the right end of the public pages' bar, "in the share button's look" (24.3,
`[#204]`): a pill with a thin line around it. ADR-202 decision 5 gave each of the two buttons "the
look of that bar's own controls -- a pill like the share button on the public bars, a link like
`account` on the bar at `/admin`".

This run measured both on `dev` (`4a8d7b8`), on the production build, in Playwright's Chromium on
Windows, with a scratch spec on its own port (14248) that was deleted afterwards. As the
administrator, it read the computed styles and swept every width from 320 to 1000 pixels at a
height of 800, in English and in Dutch, with `tests/browser/bar.ts`'s `measureBar` on the login
page at `/admin`, the creators' overview, `/admin/accounts`, `/admin/account` and `/admin/new`. It
measured three variants: the bar as built; the "pill" variant, a copy of `.to-editor`'s
declarations (base, border colour, and below 480 its padding and size) written for
`.admin-chrome:not(.editor-chrome) .admin-link` and added after the whole stylesheet with
`addStyleTag`; and the "pill+cuts" variant, the pill variant with the cuts that #249 point 2
names, added the same way. No rule of the stylesheet as specific as that selector touches these
controls, so its place in the cascade does not change the sizes. The hover was not measured. Its output, the computed styles at
1280 x 800, the same in Dutch:

```
LOOK en public "Editor" (.to-editor) 1280: display=block; padding=3px 12px; border=1px solid color(srgb 0.0784314 0.0941176 0.109804 / 0.18); border-radius=999px; font-size=12px; line-height=18px; ...; color=rgb(90, 100, 112); background-color=rgba(0, 0, 0, 0); text-decoration-line=none; height=26px; width=57.3125px
LOOK en /admin .admin-link as built 1280: display=block; padding=0px; border=0px none rgb(20, 24, 28); border-radius=0px; font-size=13px; line-height=20px; ...; color=rgb(20, 24, 28); background-color=rgba(0, 0, 0, 0); text-decoration-line=underline; height=20px; width=47.1406px
LOOK en /admin .admin-link pill 1280: display=block; padding=3px 12px; border=1px solid color(srgb 0.0784314 0.0941176 0.109804 / 0.18); border-radius=999px; font-size=12px; line-height=18px; ...; color=rgb(90, 100, 112); background-color=rgba(0, 0, 0, 0); text-decoration-line=none; height=26px; width=69.5156px
LOOK en public "Editor" 400: display=block; padding=3px 5px; border=1px solid ...; border-radius=999px; font-size=11px; ...; height=26px; width=40.7031px
LOOK en /admin .admin-link pill 400: display=block; padding=3px 5px; border=1px solid ...; border-radius=999px; font-size=11px; ...; height=26px; width=51.8906px
```

The sweep, one line a page and variant: how many of the 681 widths fail `expectBarFits`'s checks
(the bar inside the window, nothing in it overflowing, the title on one line), with the first and
last failures:

```
BAR en | login page /admin | as built | widths 320-1000 failing: 0 | least room 108.2 at 480
BAR en | login page /admin | pill | widths 320-1000 failing: 0 | least room 85.8 at 480
BAR en | creators' overview /admin, administrator | as built | widths 320-1000 failing: 0 | least room 14.2 at 320
BAR en | creators' overview /admin, administrator | pill | widths 320-1000 failing: 40 | least room 0 at 320
    320: right 324.5/320 header.page-chrome.admin-chrome.admin-home stands at 0..324.53125 in 320
    600: right 600/600 header.page-chrome.admin-chrome.admin-home holds 600x52 in 600x43; span.tree-title "ELSA decision trees" takes 3 lines of 1
    ... last: 635: right 635/635 span.tree-title "ELSA decision trees" takes 2 lines of 1
BAR en | /admin/accounts, administrator | as built | widths 320-1000 failing: 10 | least room 0 at 320
    480: right 480/480 span.tree-title "ELSA decision trees" takes 2 lines of 1
    ... last: 489: right 489/489 span.tree-title "ELSA decision trees" takes 2 lines of 1
BAR en | /admin/accounts, administrator | pill | widths 320-1000 failing: 77 | least room 0 at 320
    480: right 492/480 header.page-chrome.admin-chrome stands at 0..492 in 480; ...; span.tree-title "ELSA decision trees" takes 3 lines of 1
    ... last: 556: right 556/556 span.tree-title "ELSA decision trees" takes 2 lines of 1
BAR nl | login page /admin | pill | widths 320-1000 failing: 0 | least room 90.8 at 480
BAR nl | creators' overview /admin, administrator | as built | widths 320-1000 failing: 0 | least room 23 at 320
BAR nl | creators' overview /admin, administrator | pill | widths 320-1000 failing: 42 | least room 0 at 600
    600: right 607.6/600 header.page-chrome.admin-chrome.admin-home stands at 0..607.609375 in 600; span.tree-title "ELSA-beslisbomen" takes 2 lines of 1
    ... last: 641: right 641/641 span.tree-title "ELSA-beslisbomen" takes 2 lines of 1
BAR nl | /admin/accounts, administrator | as built | widths 320-1000 failing: 18 | least room 0 at 320
    480: right 480/480 span.tree-title "ELSA-beslisbomen" takes 2 lines of 1
    ... last: 497: right 497/497 span.tree-title "ELSA-beslisbomen" takes 2 lines of 1
BAR nl | /admin/accounts, administrator | pill | widths 320-1000 failing: 84 | least room 0 at 320
    480: right 529.2/480 header.page-chrome.admin-chrome stands at 0..529.1875 in 480; ...; button.admin-link stands at 434.828125..513.1875 in 480; span.tree-title "ELSA-beslisbomen" takes 2 lines of 1
    ... last: 563: right 563/563 span.tree-title "ELSA-beslisbomen" takes 2 lines of 1
```

`/admin/account` and `/admin/new` gave the same lines as `/admin/accounts` in both languages and
both variants: the same controls in the same bar. The pill+cuts variant:

```
BAR en | login page /admin | pill+cuts | widths 320-1000 failing: 0 | least room 85.8 at 480
BAR en | creators' overview /admin, administrator | pill+cuts | widths 320-1000 failing: 0 | least room 7.5 at 320
BAR en | /admin/accounts, administrator | pill+cuts | widths 320-1000 failing: 0 | least room 0 at 320
BAR en | /admin/account, administrator | pill+cuts | widths 320-1000 failing: 0 | least room 0 at 320
BAR en | /admin/new, administrator | pill+cuts | widths 320-1000 failing: 0 | least room 0 at 320
BAR nl | login page /admin | pill+cuts | widths 320-1000 failing: 0 | least room 90.8 at 480
BAR nl | creators' overview /admin, administrator | pill+cuts | widths 320-1000 failing: 0 | least room 18.2 at 320
BAR nl | /admin/accounts, administrator | pill+cuts | widths 320-1000 failing: 0 | least room 0 at 320
BAR nl | /admin/account, administrator | pill+cuts | widths 320-1000 failing: 0 | least room 0 at 320
BAR nl | /admin/new, administrator | pill+cuts | widths 320-1000 failing: 0 | least room 0 at 320
```

"Least room 0" on a page whose title is not drawn means its controls start at the bar's left
padding, not that they touch anything.

**A fault on `dev`.** The bar as built already wraps the site's title onto a second line on
`/admin/new`, `/admin/account` and `/admin/accounts` from 480 to 489 pixels wide in English and from
480 to 497 in Dutch. `admin-no-scroll.spec.ts` checks those pages at 10.6's viewports only, none
of which is in that range, and runs its bar test, which counts the title's lines, only at
`/admin`.

## Decision

1. **One issue, #249 (`ui`), labelled `ready`.** `ready`, not `proposed`, because the owner said
   so on #248 ("set them to ready"), although `.orca/dispatch.yml` has `autonomy: propose`. The
   owner's words make one point, and it touches one component's bar and one stylesheet.
2. **The readings taken, PROPOSED** (core document 3.4 `[#248]`; the owner can overrule them in a
   new issue):
   - "account accounts log out, and website" are `account`, `accounts`, `logout` and `website`;
   - "the header bar on /admin" is `AdminChrome`'s bar wherever it is drawn: at `/admin`, and on
     `/admin/new`, `/admin/account` and `/admin/accounts`, which hold the same controls from the
     same component;
   - the editor's bar keeps its look, although it holds `account` and `logout`: the owner named
     `accounts` and `website`, which only `AdminChrome`'s bar holds;
   - "the editor button ... in the regular view" is `editor` on the public pages' bar, and "look
     the same" is its look at every width: its smaller size below 480 pixels and its hover
     included.
3. **The room the look takes is given back by the cuts measured above, PROPOSED** (#249 point 2).
   With a session, `/admin/new`, `/admin/account` and `/admin/accounts` give up the site's title
   and the current language's pill below 600 pixels wide instead of 480, and the creators' overview
   below 660 instead of 600. Below 480 the account controls and `website` stand 4 apart instead of
   8. The login page keeps its rules. #249 measures the CI runner's faces too and moves a cut up
   by 20 at a time where they need it; a width below 480 that fails there, or a cut that would
   have to pass 767, goes back to the owner with the rows (`needs-human`). This also ends the
   title's wrap on `dev` described above.
4. **Older decisions are amended, PROPOSED where decision 3 is.** In ADR-202 decision 5 the
   controls of `AdminChrome`'s bar are pills like the share button's, as on the public bars,
   not links like `account`; the creators' overview gives up its title and current language
   below 660, not 600; and the Tree-less admin pages with a session give them up below 600, not
   480, which ADR-202 rejected when only the page at `/admin` gained a control: now every one of
   them does, wider. ADR-133-admin-routes' `[#204]` amendment changes the same way for the
   creators' overview, and `/admin/new`, `/admin/account` and `/admin/accounts` no longer keep
   their bars; the editor still does. The rest of both stands. #249 records the change in
   24.3; this record is where the two ADRs' readers find it.
5. **#249 depends on #248**, so that it is not dispatched before this record, whose 3.4 bullet
   and ADR its `Read:` line names, is on `dev`.

## Alternatives rejected

- **The editor's bar too.** It holds `account` and `logout`, and one look for one control across
  the admin area would be consistent. The owner named the bar "on /admin" and two controls the
  editor's bar does not have. Its room is narrower than `AdminChrome`'s: it holds the Tree's logo,
  the language switch of the Tree's languages and the autosave word, and below 480 pixels wide
  #203 (PR #214) gave its language names 2 pixels at their sides instead of 5, and gave up the
  current language's list item and the drawn `saving` and `saved`, to fit #163's arrow in it. This run did not
  measure it. If the owner wants it, a new issue asks for it.
- **Only the bar at the address `/admin`.** `/admin/new`, `/admin/account` and `/admin/accounts`
  draw the same controls from the same component; at `/admin` they would be pills and one click
  later links.
- **Keep the old cuts and shrink the pills instead.** The owner asked for the same look as
  "Editor"; a smaller pill would not be the same.
- **An architecture issue first.** The look is decided by the owner's words and exists in the
  stylesheet; what is left is the room, which this record measured.
- **Fix the bar in this run.** #248's task is to put issues on the board.

## Consequences

- #249 is dispatched once this pull request merges and closes #248.
- After #249, the bar of the Tree-less admin pages with a session shows the site's title from 600
  pixels wide, not 480, and the creators' overview from 660, not 600.
- #247, filed beside #248 by the same owner on the same morning, asks for "a back to app button
  from the account or accounts pages"; its build issue was not filed when this record was
  written. If that button stands in this bar, the second of the two pull requests to merge into
  `dev` re-runs #249 point 2's sweep with both, after merging `dev`.
