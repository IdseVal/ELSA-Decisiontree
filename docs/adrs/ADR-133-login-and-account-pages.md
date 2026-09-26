# ADR-133-login-and-account-pages: the login page is one card with two fields and one error; the account page changes the caller's own name and password; the accounts page is the administrator's list with a create form and two row actions, all in the default Theme

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 25 (new)
- Depends on: `docs/adrs/ADR-133-admin-routes.md` (the addresses, the chrome bar, the
  Theme), `ADR-132-accounts-and-sessions.md` (the login route, the rate limit, the
  accounts routes)

## Context

The owner: "we will first be shown a login page". #132 gave the login route its answers --
204 with the cookie, 401 for a wrong name or password, 429 for a lock, the same body for
both refusals so that the response never says whether a name exists (20.7) -- and gave the
administrator the only way to make an account (20.1): name, login, first password, handed
over out of band, changed by the holder on first use. The screens for those three things
have to exist before anything else in the admin area can be tested through a browser, and
#132's build order puts them in #135, the second build issue, so they must be small.

## Decision

1. **The login page is one centred card.** Under the chrome bar of `ADR-133-admin-routes.md`
   decision 7 (the site title, the language switch, no account) and above the disclaimer: a
   card 360 pixels wide, filled `surface`, outlined `rule`, holding the heading `signIn`,
   a text field labelled `login` with `autocomplete="username"`, a password field labelled
   `password` with `autocomplete="current-password"`, and one button `signIn` in the Answer
   buttons' style. Below the button one line for the error. The card fits at every viewport
   of 10.6 above the floor; the document never scrolls (10.6, unchanged).

   ```
   +------------------------------------------------------------------+ 44
   | ELSA decision trees                                  [language]  |
   +------------------------------------------------------------------+
   |                                                                  |
   |                  +----------------------------+                  |
   |                  |  Sign in                   |                  |
   |                  |  Name      [____________]  |                  |
   |                  |  Password  [____________]  |                  |
   |                  |  [        Sign in        ] |                  |
   |                  |  Wrong name or password.   |  <- one line     |
   |                  +----------------------------+                  |
   |                                                                  |
   +------------------------------------------------------------------+ 28
   |                 This tool is not legal advice.                   |
   +------------------------------------------------------------------+
   ```

2. **One error for a wrong name or a wrong password, and one for a lock.** A 401 shows
   `loginFailed` ("Wrong name or password.") and nothing else -- never which of the two,
   which 20.7 already keeps out of the response. A 429 shows `loginLocked` ("Too many
   attempts. Try again in a few minutes."), because the status differs and a creator who
   is locked out for fifteen minutes must not be told to retype the password. A network
   failure shows `notSaved`'s sibling `requestFailed`. The password field is cleared on
   any error; the name is kept. The error line has `role="alert"`.

3. **Submitting posts JSON.** The script serialises the two fields as `{ login, password }`
   to `POST /admin/api/login` (22.1) with `Content-Type: application/json`, which is what
   20.6's layer (b) wants and what a form cannot send. On 204 the script reloads the current
   address (`ADR-133-admin-routes.md`, decision 4). The login form is **one client
   component**, `LoginForm`, because the editor reuses it in a Sheet when a session expires
   under an open page (`ADR-133-autosave.md`, decision 6); the page and the Sheet render the
   same component with the same strings.

4. **The account page, `/admin/account`, is the same card twice.** Any logged-in account:
   a card "Your name" with one field (1 to 80 characters, the limit of 20.1 as a live
   counter) and a save button, and a card "Change password" with the current password, the
   new one and the new one again (12 to 256 characters; the two must match, checked in the
   script before sending), calling `PATCH /admin/api/accounts/<own id>` with `name`, or
   with `password` and `currentPassword` (22.1). A 422 is shown at the field; a 403 on the
   current password shows `wrongPassword`. Changing the password ends every other session
   of the account (20.4), which the page says under the button.

5. **The accounts page, `/admin/accounts`, is the administrator's.** Anyone else gets the
   403 page. It holds one list in a scroll box (`ADR-133-overview-tiles.md`, decision 5:
   the box scrolls, the document never does) with one row per account -- name, login,
   `active` or `deactivated`, `administrator` on the one -- and, above it, a button `newAccount`
   that opens a Sheet with three fields (name, login, first password) and `create`, calling
   `POST /admin/api/accounts`; a 422 (a login taken, or not in the grammar of 20.1, or a
   password under 12 characters) is shown at the field. Each row has two actions in the
   row: `deactivate` / `reactivate` (`PATCH` with `active`), and `setPassword`, which opens
   a Sheet with one field. The administrator's own row has neither: the flag cannot be
   cleared by any request (20.3), and its password is `ELSA_ADMIN_PASSWORD`'s or the account
   page's. Nothing is deleted, because nothing can be (20.1). The page shows no password
   hash, no session and no token, because the routes answer none.

6. **The look is the default Theme** (13.4) on all three pages: no Tree is on screen, so no
   Tree's logo, colours or fonts are. The card, the fields and the buttons use the same
   custom properties every other page uses (`--elsa-surface`, `--elsa-accent-secondary` on
   the button, the `rule` shade the stylesheet derives with `color-mix()` for outlines,
   13.1), so the stylesheet still contains no colour and no font-family literal (13.5,
   `stylesheet.test.ts`).

## Alternatives rejected

- **A single "Wrong password" message.** It names the field, which is the one thing the
  response is built not to say.
- **Showing the lock's remaining time.** `Retry-After` is on the 429 (20.7); showing "in a
  few minutes" rather than a countdown keeps one string and gives a scripted attacker
  nothing it cannot read from the header.
- **A "forgot password" link.** There is no mail (core document 7) and no reset route
  (20.1); the administrator sets a new password from the accounts page. A link that says
  "ask your administrator" is the `loginHelp` sentence under the card, not a control.
- **Account creation as a full page instead of a Sheet.** Three fields; the Sheet is the
  one panel component the app has (10.5) and keeps the list on screen.
- **Letting the administrator change another account's login.** The route offers `name`,
  `active` and `password` (22.1) and no more; a login is in every session's audit line and
  changing it is not asked for.
- **A visible "remember me".** The expiry is the server's (20.4: 12 hours idle, 14 days
  absolute) and is not a per-login choice.

## Consequences

- `src/app/[lang]/admin/page.tsx` renders `LoginForm` when `authenticated` finds no
  session, `account/page.tsx` and `accounts/page.tsx` the two cards and the list; all three
  are #135's, with the 403 page. `src/editor/LoginForm.tsx` is the client component.
- `src/chrome.ts` gains `signIn`, `login`, `password`, `loginFailed`, `loginLocked`,
  `loginHelp`, `requestFailed`, `yourName`, `changePassword`, `currentPassword`,
  `newPassword`, `repeatPassword`, `passwordsDiffer`, `wrongPassword`, `sessionsEnded`,
  `newAccount`, `create`, `deactivate`, `reactivate`, `deactivated`, `administrator`,
  `setPassword`, `save` (#135), in both languages.
- `tests/browser/login.spec.ts` (#135) asserts: the two fields and the one error on a
  wrong name and on a wrong password (the same string), `loginLocked` after five failures
  on one name, the password field cleared, the reload to the address asked for, the
  `<noscript>` sentence, the account page's two cards against the routes, and the accounts
  page's create and deactivate against a fresh data directory; and that the login page,
  the account page and the accounts page fit at every viewport of 10.6 above the floor
  (`admin-no-scroll.spec.ts`, `ADR-133-editor-testing.md`).
