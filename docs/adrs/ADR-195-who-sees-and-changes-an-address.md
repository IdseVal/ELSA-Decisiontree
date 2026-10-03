# ADR-195-who-sees-and-changes-an-address: an address is seen by its holder and the administrator and by nobody else, and changed by the administrator alone; the invitation list shows names only, so one account per name

- Status: ACCEPTED (frozen) -- 2026-10-03; decides core document 10.39 (who sees an address,
  and who may change one)
- Issue: #195 -- Architecture: freeze the login by e-mail address and password, and the
  mention of who authored a Tree, the collaborators in the order they joined it
- Spec: `docs/specs/application.md` 38.5, 38.6, 38.8 (new); 20.1, 21.2, 21.4, 22.1, 25.2,
  25.3, 33.4 amended, marked **[#195]**
- Supersedes: `ADR-132-roles-and-permissions.md` decision 4's "every active account's `id`,
  `name` and `login`" and "the one place a creator sees another account's login";
  `ADR-133-login-and-account-pages.md` decision 5's row "name, login" and its new-account
  Sheet's `login`, and its rejected alternative "Letting the administrator change another
  account's login"; `ADR-133-top-panel.md`'s select of "name, then login"
- Depends on: `ADR-195-login-by-email-address.md`
- Built by: #196

## Context

Today three screens show a login. The accounts page, the administrator's (25.3), lists each
account's name and login. The account page (25.2) shows none, but its password form holds the
login in a hidden `username` field for password managers. The invitation and hand-over selects
of a Tree's settings panel (33.4, `AccountSelect` in `src/editor/Panel.tsx`) show "name ·
login" for every active account, to every logged-in account, through `GET
/admin/api/accounts` -- "to tell two of one name apart" (21.4; `ADR-132-roles-and-permissions.md`
decision 4). Nobody changes a login: 22.1 offers `name`, `active` and `password`, and
`ADR-133-login-and-account-pages.md` rejected the administrator changing one, "not asked for".

A login that becomes an e-mail address is a different thing to show. It is personal data, and
it is the identifier its holder uses on other sites too, so a list of them is what a
credential-stuffing attempt starts from. Two accounts may today carry one display name: 20.1
requires 1 to 80 characters and nothing more.

## Decision

1. **Who sees an address.** Its **holder**: on the account page, as one line, and in `GET
   /admin/api/me`. The **administrator**: every account's, on the accounts page, and in the
   answers of `POST /admin/api/accounts` and `PATCH /admin/api/accounts/<id>`. **Nobody
   else**: `GET /admin/api/accounts` answers `{ id, name }` per active account; the invitation
   and hand-over selects of 33.4 show names; no public route and no log line holds one (20.8,
   39.8).

2. **Who changes an address: the administrator alone**, on the accounts page, for every
   account, its own included: a row action `setEmail` opens a Sheet with one field, `email`,
   holding the current address, and `save` sends `PATCH /admin/api/accounts/<id> { email }`;
   422 `email-invalid` or `email-taken` at the field. No current password is asked: the
   administrator sets an address as it sets a password (25.3). The server refuses `email` from
   any other account, the holder included (403, field `email`). `ELSA_ADMIN_EMAIL` also sets
   the administrator's at a start (`ADR-195-administrator-address.md`). The holder's account
   page shows the address read-only, with `emailHelp`: "Ask your administrator to change it."

3. **A change of address ends no session** and changes nothing else: a session belongs to an
   account and the password is unchanged (20.4). It is logged as every account change is,
   `account <id> changed (email) by account <id> at <time>`, the word and never the value.

4. **One account per name.** With no address in the lists, a name is what tells two accounts
   apart, so no two accounts -- active or not -- carry one name. Names are compared after
   Unicode NFC normalisation, with runs of white space as one space and without regard to case,
   so "Anna de Vries" and "anna  de vries" are one name; a name is still stored as given,
   trimmed (20.1). A creation or a rename -- the holder's on the account page, the
   administrator's through `PATCH` -- that gives an account a name another account has is
   refused, 422 `name-taken` at the field. The public mention names Authors by these names
   (39), so it never names two people alike either.

5. **What the account page shows**: the line `signedInWith(email)` -- "You sign in with
   <address>." / "U logt in met <adres>.", in the words of `signIn`, "Sign in" / "Inloggen"
   -- in the password card, one line cut with an
   ellipsis where it does not fit, the whole address its `title`; for a converted account
   without an address, `noEmail` there instead (`ADR-195-accounts-without-an-address.md`); and
   `emailHelp` under it. The hidden `username` field of the password form holds the address, so
   a password manager files the new password under it.

6. **What the accounts page shows per row**: the name, the address -- one line, cut with an
   ellipsis, the whole address its `title`, or `noEmail` -- the state, and the actions:
   `deactivate` / `reactivate`, `setPassword` and `setEmail` on every row but the
   administrator's, `setEmail` alone on the administrator's. The new-account Sheet asks for
   `displayName`, `email` and `password`.

## Alternatives rejected

- **The holder changes their own address, with the current password** -- the form a password
  change takes. Every `email-taken` it answered would tell a logged-in account whether an
  address has an account here, which the login route was built never to say (20.7); and no
  mail confirms the new address, so the account could be moved to anyone's. An address changes
  rarely -- a new job -- and the administrator, who made the account, knows the person behind
  it. This is the nearest call of the decisions here: the owner may overrule it, and the route
  can take `email` with `currentPassword` from the holder without moving anything else in this
  freeze.
- **Both the holder and the administrator.** As above, for the holder's half.
- **The invitation list showing the address**, as it showed the login. Every account would
  read every other account's address; nothing in #194 asks for it, and a list of addresses is
  the first thing a credential-stuffing attempt needs.
- **The address's domain only** ("Anna · wur.nl"). Part of the personal datum, for a purpose
  one name per account serves whole.
- **Names left free, two of one name shown alike.** A creator would invite one of two "Jan de
  Vries" blind, and the public mention would name two people with one name.
- **Ending the account's sessions on a change of address.** Nothing about the credential that
  made them changed; the password is the secret, and its change already ends them (20.4).

## Consequences

- `src/store/accounts.ts`: `listActive` answers `id` and `name`; `create` and `update` refuse a
  name another account has (`name-taken`); `update` takes `email` from the administrator only.
  `src/editor/Panel.tsx`'s `AccountSelect` shows names; `AccountForms.tsx` the address line;
  `AccountsList.tsx` the address column and `setEmail`. `src/chrome.ts` gains `email`,
  `emailInvalid`, `emailTaken`, `nameTaken`, `setEmail`, `noEmail`, `signedInWith`,
  `emailHelp` (3.2's #196 row). #196's.
- `admin-no-scroll.spec.ts` measures the account page with its address line and the accounts
  page with the `setEmail` Sheet open, at its ten viewports (35.4, 38.10).
