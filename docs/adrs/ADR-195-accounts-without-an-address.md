# ADR-195-accounts-without-an-address: the first start of the release converts `accounts.json` once -- the administrator's address from `ELSA_ADMIN_EMAIL`, every other account none until the administrator gives it one -- and every way back is written in `docs/deployment.md`

- Status: ACCEPTED (frozen) -- 2026-10-03; decides core document 10.39 (what the first start of
  the new release does with an account that has a user name and no address)
- Issue: #195 -- Architecture: freeze the login by e-mail address and password, and the
  mention of who authored a Tree, the collaborators in the order they joined it
- Spec: `docs/specs/application.md` 38.4, 38.9 (new); 17.4, 20.1 amended, marked **[#195]**
- Supersedes: no earlier decision. The `login` it converts away is superseded by
  `ADR-195-login-by-email-address.md`; `ADR-132-accounts-and-sessions.md`'s rule that an
  account is deactivated and never deleted stands, and no account is deleted here either
- Amends: `ADR-132-data-directory.md` decision 2 -- `accounts.json` holds an `email` per
  account in place of `login`, converted once, at the first start of the release (decision 1)
- Depends on: `ADR-195-login-by-email-address.md`, `ADR-195-administrator-address.md`
- Measurement: the live demo server's store, read on #194 (2026-10-03): one account, the
  administrator, login `admin`, display name `Administrator`
- Built by: #196

## Context

Every store written before #196 holds a `login` per account and no address: the
administrator's `admin`, and whatever user names its administrator gave the others. The task
of #195 sets the bar: nobody may be locked out without a way back in that `docs/deployment.md`
writes down. Only the administrator's address can come from the deployment
(`ADR-195-administrator-address.md`); no setting can give the other accounts theirs, and none
may be invented.

The store already converts what an earlier release wrote when it opens it -- `elsa-tree/4`
files since #179 (36.4) -- and writes each file whole and atomically through one writer
(17.3).

## Decision

1. **At every start, before anything reads an account**, `openAccounts` converts each record
   that holds `login` and no `email`: the administrator's `email` becomes `ELSA_ADMIN_EMAIL`'s
   (required for it, `ADR-195-administrator-address.md`), every other account's becomes
   `null`, and `login` is removed from every record. `id`, `name`, `passwordHash`, `active`,
   `administrator` and `createdAt` stay as they were. The file is written once, atomically
   (17.3), and a later start finds nothing to convert.

2. **An account without an address cannot log in, and is otherwise whole.** `authenticate`
   never answers it, so a login attempt for it is a 401 like any other. It stays active, keeps
   its roles on every Tree, is in `listActive` and so can be invited, and a session it held
   before the upgrade stays valid until it expires (20.4): sessions name an account, not a
   login.

3. **The way back.** For an account without an address: the administrator gives it one on the
   accounts page, where it is marked `noEmail` ("No e-mail address yet"), through `setEmail`
   (38.5), and tells its holder, who logs in with that address and the password they had. For
   the administrator: `ELSA_ADMIN_EMAIL`, without which the start refuses and names it.
   `docs/deployment.md` writes both down in "Putting a new version of the application on the
   server", with a backup of the data directory before that first start, since the user names
   are not kept (38.9).

4. **What the start logs**, ids and counts only (20.8): the start that converts, `accounts.json
   converted from user names to e-mail addresses: <n> accounts, <m> without an address`; and
   every start, per account that has no address yet, `account <id> has no e-mail address: give
   it one at /admin/accounts` -- a state the administrator is to end, so it is said until it
   ends, not once.

5. **Two accounts of one name in a converted store** -- names are one per account from #196 on
   (`ADR-195-who-sees-and-changes-an-address.md` decision 4), and were not before -- are left
   as they are: nothing is renamed, every start logs `accounts <id> and <id> share a name: give
   one of them another` while they do, and every name given from then on is held to the rule.

6. **On the live demo server** the conversion meets one account, the administrator, so it
   gives that account `ELSA_ADMIN_EMAIL`'s address and leaves no account without one.

## Alternatives rejected

- **The user name kept as a second way to log in** for the accounts that had one. Two login
  paths and two keys for the rate limit for as long as anyone has not switched, and the second
  is the one the owner's words replace.
- **Refusing to start until every account has an address.** No variable can give every
  account one; a deployment whose public pages stay down because an editor's account has no
  address is a larger failure than an account that waits for its administrator.
- **Addresses made from user names** (`<login>@<something>`). Invented, and a person would
  log in with an address that is not theirs.
- **The old user name kept in the record** (a `formerLogin` beside a missing address) to tell
  the administrator whose account it is. A field for a case the one measured deployment does
  not have; the display name, one per account from this release on, tells the administrator
  who made the account whose it is.
- **A conversion command run before the first start.** A container has no terminal, and the
  store already converts what it opens (36.4).

## Consequences

- `src/store/accounts.ts`: the conversion in `openAccounts`, before the administrator is
  sought; `Account['email']` is `string | null`, and `null` only on a converted account until
  the administrator gives it an address. #196's.
- `tests/store/accounts.test.ts` opens a directory written as `dev` writes it today -- the
  administrator `admin` and two accounts with user names -- and asserts the table of
  `ADR-195-administrator-address.md` decision 1 and decisions 1 to 5 here (38.10).
- #196's pull request pastes the count its issue asks for, each from a command: the accounts of
  a copy of such a store before the first start, after it, and those of them that log in with
  an address.
