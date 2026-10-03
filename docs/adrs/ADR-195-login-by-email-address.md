# ADR-195-login-by-email-address: an account logs in with an e-mail address, `email` in place of `login` -- the browser's own check, at most 254 characters, lower-cased on entry, one account per address -- and the rate limit counts per address typed, which the log never holds

- Status: ACCEPTED (frozen) -- 2026-10-03; decides core document 10.39 (what an address must
  be, the routes, the rate limit and the log)
- Issue: #195 -- Architecture: freeze the login by e-mail address and password, and the
  mention of who authored a Tree, the collaborators in the order they joined it
- Spec: `docs/specs/application.md` 38.1, 38.2, 38.7, 38.8 (new); 20.1, 20.4, 20.7, 20.8,
  22.1, 25.1 amended, each change marked **[#195]**
- Supersedes: `ADR-132-accounts-and-sessions.md` decision 1's user name and its rejected
  alternative "E-mail address as login"; the "per login name" of its decision 10 and the
  "never the name typed" of its decision 11, restated here for an address.
  `ADR-133-login-and-account-pages.md` decisions 1 and 3, where they name the field `login`
- Depends on: `ADR-132-accounts-and-sessions.md` (the hash, the session, the CSRF layers and
  the two counters, all of which stand)
- Built by: #196

## Context

The owner, in issue #194 (2026-10-03): "To login should be based on an email and a password".
Core document 3.4 holds the words whole, under `[#194]`, and reads them as making no exception:
every account logs in with an address, the administrator's included (10.32).

The editor round had decided the opposite. `ADR-132-accounts-and-sessions.md` decision 1 made
the login a **user name** in the id grammar of `tree-format.md` 3.1 -- "Not an e-mail address:
the application sends no mail, so an address would be personal data held for nothing" -- and
rejected "E-mail address as login" as "Held for nothing, since no mail is sent". The owner has
now decided what is held. The application still sends no mail (core document 7, 10.31), and
#194 does not ask it to: the address is what a person types to log in, and nothing is ever
sent to it.

What the code does today, read on `dev` at `b6d9566`: `src/store/accounts.ts` holds `login`
per account, lower-cased on entry, unique, in the id grammar (`normaliseLogin`);
`POST /admin/api/login` reads `body.login`, keys the rate limit on `login.trim().toLowerCase()`
and logs `login failed for an unknown name` or a lock "for an unknown name"
(`src/app/[lang]/admin/api/login/route.ts`).

## Decision

1. **`email` replaces `login`** in the `Account` record of `accounts.json` and in every
   member, route body and screen that named it. The field is named for what it holds.

2. **What counts as an address: the browser's own check.** An address is a string that, after
   the value sanitisation of the HTML Standard's `<input type="email">` -- newlines removed,
   leading and trailing ASCII white space stripped -- matches that standard's *valid e-mail
   address* (WHATWG HTML, "E-mail state"), whose regular expression the standard gives as

   ```
   /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
   ```

   and is **at most 254 characters**: the longest address a 256-octet SMTP path can carry
   (RFC 5321 4.5.3.1.3, as RFC 3696 erratum 1690 states the limit). Nothing else is required
   of it: no dot in the domain, no known top-level domain, no lookup. The production is ASCII,
   so an address is too.

3. **Lower-cased on entry, compared byte for byte.** Every upper-case ASCII letter is lowered
   when an address is given -- at creation, at a change, in `ELSA_ADMIN_EMAIL`, at a login --
   so `Idse.Val@WUR.nl` and `idse.val@wur.nl` are one address, stored once in one form.

4. **One account per address**, deactivated accounts included: an address names one account,
   and a deactivated account may be reactivated with it (20.1). A second account with an
   address already held is refused (422, `email-taken`).

5. **One function holds the rule**: `normaliseEmail(input: unknown): string | null` in
   `src/store/accounts.ts`, pure, answering the sanitised, lower-cased address or `null`. The
   store's `create` and `update`, the start's reading of `ELSA_ADMIN_EMAIL`
   (`ADR-195-administrator-address.md`) and `authenticate`'s lookup call it; nothing else
   checks an address. A string it answers `null` for names no account.

6. **The interface** (20.4, restated in 38.2): `authenticate(email, password)`, which runs
   scrypt either way (20.2) and never answers an account that has no address
   (`ADR-195-accounts-without-an-address.md`); `byEmail(email)` in place of `byLogin`, for the
   log line of a lock; `listActive()` answering `id` and `name` only
   (`ADR-195-who-sees-and-changes-an-address.md`); `create(by, name, email, password)`;
   `update(by, id, change)` with `email` among the fields of `change`.

7. **The routes** (22.1, restated in 38.2): `POST /admin/api/login` takes `{ email, password }`
   and answers as before -- 204 with the cookie, 401, 429, the two refusals with one body.
   `GET /admin/api/me` answers `{ id, name, email, administrator }`. `POST /admin/api/accounts`
   takes `{ name, email, password }`. `PATCH /admin/api/accounts/<id>` takes `email` from the
   administrator. Every answer that carried `login` carries `email` in its place; `GET
   /admin/api/accounts` carries neither. A body that still sends `login` sends no address: a
   login answers 401, a creation 422 `email-invalid`.

8. **The rate limit counts per address typed** (20.7): its first counter is keyed by the
   address the lookup reads, `loginKey(email)` in `src/store/login-limit.ts`:
   `normaliseEmail(email) ?? email.trim().toLowerCase()` -- the address decision 5's function
   makes of the string typed, and where that string is no address, the string trimmed and
   lower-cased -- whether or not an account holds it. Every spelling the lookup reads as one
   address is one key. Decision 2's sanitisation removes a line break anywhere in the string,
   so a key made of the string as typed would give each placement of one five more tries at
   the same account's password, and the lock would come down to the deployment's 60 a minute.
   So five failures on one address lock it for 15 minutes, and an attempt on an address no
   account holds counts exactly as one on an address an account holds. The per-deployment
   counter is unchanged. Still not per client address.

9. **The log never holds an address** (20.8): a failure is `login failed for account <id>` or
   `login failed for an unknown address`; a lock `login locked for 15 minutes for account
   <id>` or `... for an unknown address`. Never the address typed, never an account's address
   -- the administrator's included: the start's line names the variable, not its value
   (`ADR-195-administrator-address.md`) -- in any line, at any level.

10. **The login page's field** (25.1, `ADR-133-login-and-account-pages.md` decision 1): labelled
    `email` ("E-mail address" / "E-mailadres"), `type="email"` -- the keyboard of a phone, and
    the browser's own sanitisation -- with `autocomplete="username"`, the token password
    managers read as the login of a sign-in form whatever kind of value it is (web.dev, "Sign-in
    form best practices"). The form is `noValidate`: the browser's own message about a value
    that is not an address, in the browser's language, never stands in for the card's one error
    line; such a value is sent and answered 401, as an address that names no account is.
    `loginFailed` says "Wrong e-mail address or password." / "Verkeerd e-mailadres of
    wachtwoord.", one string for either, as before; `sessionNotKept` opens with "Your e-mail
    address and password are right" / "Uw e-mailadres en wachtwoord kloppen".

## Alternatives rejected

- **RFC 5322's whole grammar** -- quoted local parts, comments, IP-literal domains. The browser's
  field refuses most of it before the server sees it, a quoted local part with a space in it is
  a typo far more often than an address, and no mail is sent, so the forms the browser does not
  know would be accepted for nothing.
- **Internationalised addresses** (RFC 6531, a local part or a domain in Unicode). The
  browser's field refuses them, no account has asked for one, and the check can be widened
  later without converting any stored address.
- **The case kept as typed and compared without regard to it.** Two forms of one value, one
  shown and one compared, for an identifier shown to nobody but its holder and the
  administrator.
- **A local part compared with its case** (RFC 5321 2.4 lets a mail server do so). No mail is
  delivered, so no mailbox's rule applies; two accounts whose addresses differ in case only
  would be one person typed twice.
- **The field kept as `login`, holding an address.** Every store written before #196 holds a
  user name there, which the new check refuses; and the name would say less than the field
  holds.
- **A stricter check than the browser's** (a dot in the domain, a minimum length). It would
  refuse, after sending, what the field let through, with a message the login card has no line
  for; the one error line is the card's design (25.1).
- **Counting failures per account.** An attempt on an unknown address would count nothing, and
  a lock that falls on a known address but never on an unknown one says which exists -- what
  20.7's one body was built never to say.

## Consequences

- `src/store/accounts.ts`: `normaliseEmail` in place of `normaliseLogin`, `byEmail` in place of
  `byLogin`, `email` in `Account` and `AccountChange`, the `AccountError` codes `email-invalid`
  and `email-taken` in place of `login-invalid` and `login-taken`, its field `email` in place
  of `login`. `src/store/login-limit.ts`: `loginKey` (decision 8), by which the login route
  keys its counters. `src/app/[lang]/admin/api/login/route.ts`, `me/route.ts`, `accounts/route.ts`,
  `accounts/[id]/route.ts`; `src/editor/LoginForm.tsx`, `AccountForms.tsx`, `AccountsList.tsx`,
  `Panel.tsx`; `src/admin/words.ts`; `src/chrome.ts` (3.2's #196 row). All #196's.
- Every test that logs in by user name moves to an address with the code it tests (38.10):
  `tests/browser/admin.ts`'s `login(page, origin, ...)` and `buildDataDir` take an address, and
  the named accounts of 35.3 log in as `anna@example.org`, `bram@example.org` and
  `cees@example.org`, addresses RFC 2606 reserves for examples, so no real person's address is
  in the repository.
- `docs/deployment.md`'s "The administrator and the login" says "e-mail address" where it says
  "name", and its journal paragraph "an unknown address" (38.9).
