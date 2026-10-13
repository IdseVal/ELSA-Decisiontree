# ADR-253-way-back-from-the-account-pages: `/admin/account` and `/admin/accounts` begin their bar with #163's arrow back to the creators' overview, and give up the site's title below 620

- Status: ACCEPTED -- 2026-10-13
- Issue: #253 -- The account and accounts pages begin with the arrow back to the creators' overview
- Spec: `docs/specs/application.md` 24.3 amended, marked `[#253]`: the row for `/admin/new`,
  `/admin/account` and `/admin/accounts`, the `[#249]` note under the table and the end of the
  `[#204]` note
- Older decisions amended:
  - `docs/adrs/ADR-202-navigation-round.md`, its alternative rejected "Giving up the site's title
    below 600 on every Tree-less admin page", where decision 5's round left these pages as they
    were: "`/admin/new`, `/admin/account` and `/admin/accounts` gain nothing". A dated note there
    points here;
  - `docs/adrs/ADR-133-admin-routes.md` decision 7, the bar of the Tree-less admin pages: a dated
    amendment in its header points here.

## Context

The owner wrote in issue #247 (2026-10-13), held whole in core document 3.4 `[#247]`:

> "We need a back to app button from the account or accounts pages."

`/admin/account` and `/admin/accounts` draw `AdminChrome`'s bar (`src/components/AdminChrome.tsx`):
`siteTitle` as text, the language switch, `account`, `accounts` (the administrator only) and
`logout`, which #249 drew in "Editor"'s look and for whose room the bar gives up `siteTitle` and
the current language's pill below 600 pixels wide (24.3). Neither page led anywhere but out: the
browser's back button, `logout`, or a typed address.

`docs/adrs/ADR-247-small-additions-round.md` decision 2 took the reading, PROPOSED: "the app" is
the creators' overview at `/admin`, the "top level interface" of `[#202]`, and "a back to app
button" is the arrow the editor's bar begins with (#203), the same look and name (`toOverview`,
"All decision trees", "Alle beslisbomen").

## Measured

On this branch's production build, after `dev` at `5077a0a` (#249). A scratch spec swept every
width from 320 to 1000 pixels at a height of 800, loading each page once and resizing one pixel
at a time, with `tests/browser/bar.ts`'s checks (the bar inside the window, nothing in it
overflowing, the title on one line): in English and Dutch, on `/admin/account` as a creator and
as the administrator, on `/admin/accounts` as the administrator, and on `/admin/new` as the
administrator, which carries no arrow, for comparison. Windows' faces in Playwright's Chromium on
Windows; the CI runner's in WSL 2 Ubuntu 24.04 with `playwright-core` 1.62.1's headless shell
and the server inside WSL, where CDP's `CSS.getPlatformFontsForNode` gave Liberation Sans for the
site's title and the account controls. Count of failing widths of 681, with the first and last:

```
the arrow, the cut at 600 (#249's)        Windows                     CI runner (Liberation Sans)
en /admin/account, a creator              0                           0
en /admin/account, the administrator      0                           11: 600-610, title on 2 lines
en /admin/accounts, the administrator     0                           11: 600-610, title on 2 lines
en /admin/new, the administrator          0                           0
nl /admin/account, a creator              0                           0
nl /admin/account, the administrator      4: 600-603, title on 2 lines  15: 600-614, title on 2 lines
nl /admin/accounts, the administrator     4: 600-603, title on 2 lines  15: 600-614, title on 2 lines
nl /admin/new, the administrator          0                           0

the arrow, the cut at 620 for the bars that carry it
every page and account above, en and nl   0                           0
least room beside the title (at 620)      en 23.1, nl 16.7 (admin)    en 9.3, nl 5.4 (admin)
```

No width below 600 failed with either cut, in either face. The issue named DejaVu Sans as the CI
runner's face for `system-ui`; CDP showed Liberation Sans there, the face the merged #249 passed
CI in. With DejaVu Sans forced on the page in WSL, as a counterfactual only, the arrow's bars failed
from 620 to 656 (en) and 659 (nl), and `/admin/new` failed from 600 to 616 and 619 with #249's own
cut, which CI passed.

## Decision

1. **The arrow, PROPOSED** (the reading of ADR-247 decision 2). `AdminChrome` takes `back`, which
   only `/admin/account` and `/admin/accounts` pass, after their session check: the bar begins
   with `BackToOverview`, linking to `/admin` in the chrome language (`/admin`, `/admin?lang=nl`),
   held with `siteTitle` in one `.page-brand` group, as the editor's arrow is held with the Tree's
   mark -- `.page-chrome` spreads its children with `space-between`, so a third child would stand
   in the middle. The login page those addresses show without a session, `/admin/new` and the 403
   page carry no arrow.
2. **The cut moves from 600 to 620 on these two pages**, by #249 point 2's rule (up by 20 at a
   time until every width fits): one step made every width from 320 to 1000 fit in both faces.
   The rule is keyed to the arrow, `.admin-chrome:not(.editor-chrome):has(.back-to-overview)`,
   so `/admin/new` keeps 600 and the editor's bar, which carries the arrow too, is untouched. It
   holds for the creator's bar as well, which fits at 600: one cut for the two pages the arrow is
   on, rather than a third keyed to `accounts`.

## Alternatives rejected

- **A button with words** ("Back", "Overview"). The reading is the editor's arrow; a second way
  back with another look would be one more control to learn.
- **A history step** (`history.back()`). `docs/adrs/ADR-205-way-there-and-back.md` rejected it: a
  page opened from a typed address has nothing behind it.
- **The arrow on `/admin/new`, the 403 page or the login page.** The owner named the account
  pages.
- **Room from the controls instead of a higher cut** (smaller pills, a smaller gap). #249 gave the
  controls "Editor"'s look, and its rule for a width that fails is to move the cut.

## Consequences

- The account pages lead back to `/admin` in one click, in the chrome language, as the editor does.
- Between 600 and 619 pixels wide the account pages no longer show the site's title and the
  current language's pill; `/admin/new` still does.
- At 620 the administrator's Dutch bar keeps 5.4 pixels beside the title in the CI runner's faces.
  A longer `siteTitle` or a wider control in this bar needs the sweep again.
- `tests/browser/account-back-to-overview.spec.ts` pins the arrow, its target, the pages without
  it and the cut; `admin-no-scroll.spec.ts` measures the three bars at 10.6's viewports,
  `BAR_SIZES`, 489, 497, 619 and 620.
