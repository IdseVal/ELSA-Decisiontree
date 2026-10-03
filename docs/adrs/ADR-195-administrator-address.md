# ADR-195-administrator-address: the administrator logs in with the address `ELSA_ADMIN_EMAIL` gives it, read at every start as `ELSA_ADMIN_PASSWORD` is; the repository invents no address, and the live demo server's is the owner's to choose

- Status: ACCEPTED (frozen) -- 2026-10-03; decides core document 10.39 (which address the
  administrator logs in with, and how a deployment supplies it) and amends 10.32
- Issue: #195 -- Architecture: freeze the login by e-mail address and password, and the
  mention of who authored a Tree, the collaborators in the order they joined it
- Spec: `docs/specs/application.md` 38.3, 38.9 (new); 17.1, 20.3 amended, marked **[#195]**
- Supersedes: `ADR-132-accounts-and-sessions.md` decision 4's "login `admin`"; its decision 5
  (the password from `ELSA_ADMIN_PASSWORD`, read at every start) stands, and this decision
  gives the address the same rule
- Depends on: `ADR-195-login-by-email-address.md` (what an address is)
- Value only the owner can choose: **the live demo server's administrator address** -- asked
  by #198 before it brings that server to a `dev` that carries #196
- Built by: #196

## Context

Today the administrator is the one account the server makes, with the fixed login `admin`
(20.3, `ADMIN_LOGIN` in `src/store/accounts.ts`) and the password `ELSA_ADMIN_PASSWORD` gives
it, read at every start: the variable creates the account when there is none and replaces its
password when it is set, which is the recovery of a lost password -- set, restart, log in,
remove (`ADR-132-accounts-and-sessions.md` decision 5).

The owner's words make no exception (core document 3.4 `[#194]`): the administrator logs in
with an e-mail address and a password, like every account. The owner gave no address for it:
the one the owner gave, idse.val@wur.nl, is for an account of the owner's own, "next to the
admin account" (#194; #198 makes it). Which address the administrator logs in with is a value
of each deployment, and nothing the repository can know.

## Decision

1. **`ELSA_ADMIN_EMAIL`**, an environment variable read **at every start**, as
   `ELSA_ADMIN_PASSWORD` is, checked by `normaliseEmail` (38.1) and lower-cased by it:

   | The store holds | `ELSA_ADMIN_EMAIL` | The start |
   |---|---|---|
   | no administrator | set, with `ELSA_ADMIN_PASSWORD` | creates the administrator with that address and that password |
   | no administrator | absent (or the password absent) | **refuses to start**, naming each variable that is missing |
   | an administrator without an address -- a store of user names (`ADR-195-accounts-without-an-address.md`) | set | gives it that address |
   | an administrator without an address | absent | **refuses to start**: `ELSA_ADMIN_EMAIL is not set and the administrator has no e-mail address: set it to the address the administrator will log in with (docs/deployment.md)` |
   | an administrator with an address | set to another | **replaces** it: the recovery of a forgotten address, as the password's -- set, restart, log in, remove |
   | an administrator with an address | set to the same, or absent | changes nothing |
   | any | set to a value that is not an address (38.1), or to the address of another account | **refuses to start**, saying which, without the value |

2. **The log says the variable was used, never its value**: `administrator e-mail address set
   from ELSA_ADMIN_EMAIL; remove the variable`, when the start gave or replaced the address,
   beside the password's line (20.3). An address is personal data, and 20.8 holds none.

3. **Removed after the first start, like the password.** It is not a secret, but the rule that
   makes it the recovery path is the password's: while it is set, it wins at every start over a
   change made in the admin area (the accounts page, 38.5). `docs/deployment.md` says to remove
   both, and to set the address again only to recover it.

4. **The account itself is unchanged**: one account, `administrator: true`, display name
   `Administrator` at creation, the flag set by the server alone and never by a request (20.3).
   Its address is shown on its own row of the accounts page and on its account page, as every
   account's is to its holder (38.5).

5. **No address in the repository is a real one.** The environment file's example names the
   variable and leaves it empty, as it leaves the password. The tests set
   `ELSA_ADMIN_EMAIL=admin@example.org` beside their `ELSA_ADMIN_PASSWORD`
   (`tests/store/admin.ts`, `playwright.config.ts`, `tests/browser/serve.ts`): `example.org` is
   reserved for examples (RFC 2606).

6. **The live demo server's address is a value only the owner can choose.** That server -- the
   production build of `dev` behind http://petercelie:3000 -- holds one account, the
   administrator, with a user name (measured on #194). The first start of a release that
   carries #196 refuses there until the variable is set (decision 1, third and fourth rows).
   #198 asks the owner for the address on #198, with `needs-human`, before it brings that
   server to `dev`, and never chooses one itself: the variable goes where that server's own
   script reads the administrator's password.

## Alternatives rejected

- **A fixed address** (`admin@localhost`, `admin@example.org`). An invented address, and the
  same on every deployment, so the administrator's login identifier would be printed in the
  repository for anyone to read -- what `admin` is today, and what the owner's words replace.
- **An address made from the deployment** (`admin@` and the host of `ELSA_BASE_URL`). Invented
  as well; the base URL is optional (section 1), and a web host is not a mail domain.
- **The user name `admin` kept for the administrator alone.** The owner's words make no
  exception (core document 3.4 `[#194]`).
- **The address chosen at the first login after the upgrade**, entered once with the old user
  name. A second way to log in, kept until someone uses it, for the one account that may do
  everything.
- **A command** (`npm run store -- set-admin-email`). A container has no terminal: the reason
  `ADR-132-accounts-and-sessions.md` decision 5 gives for the password holds for the address.
- **The variable read at the first start only.** No way back for a forgotten address but
  editing `accounts.json` by hand; decision 5 of ADR-132 rejected the same for the password.
- **The owner's address, idse.val@wur.nl, for the administrator.** The owner gave it for an
  account of the owner's own, beside the administrator's (#194, #198).

## Consequences

- `src/store/accounts.ts`: `openAccounts` reads `ELSA_ADMIN_EMAIL` with `ELSA_ADMIN_PASSWORD`,
  by the table above; `ADMIN_LOGIN` goes. `src/config.ts`'s `Environment` names the variable.
  #196's.
- `deploy/elsa-decisiontree.env.example` gains `ELSA_ADMIN_EMAIL=` beside
  `ELSA_ADMIN_PASSWORD=`; `docs/deployment.md` names it in its configuration table, step 4, the
  container's first run, "The administrator and the login" and "Putting a new version of the
  application on the server" (38.9).
- A deployment upgraded without the variable does not start, and says why: the public pages are
  down until the deployer sets it. The deployment notes say so before the upgrade, not after.
