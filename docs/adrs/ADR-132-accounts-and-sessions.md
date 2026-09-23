# ADR-132-accounts-and-sessions: accounts made by the administrator, a user name and a scrypt hash; the administrator's password from `ELSA_ADMIN_PASSWORD`; one `HttpOnly; Secure; SameSite=Strict; Path=/admin` cookie, an origin check on every write, a rate limit on login; the public routes set no cookie

- Status: ACCEPTED (frozen) -- 2026-09-23; decides core document 10.31 and 10.32
- Issue: #132 -- Architecture: freeze the store for the editor round
- Spec: `docs/specs/application.md` section 20 (new); 7 and 8 amended
- Amends: `docs/adrs/ADR-118-dataset-endpoint.md` (its decision 4 said CORS is safe
  because "there is no cookie, no session, no account"; that is now true of the **public
  routes**, and this ADR is what keeps it true), `ADR-5-testing-approach.md`
  (`deployment.spec.ts` gains the logged-in half of the no-cookie sweep)
- Depends on: `docs/adrs/ADR-132-data-directory.md`

## Context

The owner asks for "a login window", "creators with an account [who] have a name",
collaborators a creator can invite, and "an admin account with all permissions to all
current and future datastructures" (core document 3.4). The core document held "no
accounts, no cookies" for four rounds and now holds it **for end users** (4, 8, 9): a
public route must never set a cookie, nothing about a creator reaches a public page or a
Tree file, and `tests/browser/deployment.spec.ts` is the contract. The owner did not say
who makes accounts (10.31) or how the first administrator gets a password (10.32); both
carry a PROPOSED default this ADR confirms.

The application has no mail: nothing is sent to anyone (core document 7), so no password
reset by e-mail, no invitation by e-mail, and no reason to hold an e-mail address.

## Decision

1. **An account is** `{ id, name, login, passwordHash, active, administrator, createdAt }`
   in `accounts.json`. `id` is 16 random bytes as hex, never reused, and is what `meta.json`
   names as creator and collaborator, so a rename changes no Tree. `name` is the display
   name the owner asked for: plain text, 1 to 80 characters, shown in the admin area only.
   `login` is a **user name** in the id grammar of `tree-format.md` 3.1 (lowercase letters,
   digits, single hyphens, 2 to 64 characters), unique, case-insensitive on entry. **Not
   an e-mail address**: the application sends no mail, so an address would be personal data
   held for nothing (core document 8).

2. **The password hash is `scrypt` from `node:crypto`** -- the one memory-hard KDF Node
   ships; `argon2` is not in `node:crypto` on Node 22 (measured) and a package for it is a
   native module. Parameters: **N = 2^16, r = 8, p = 2**, 16 random bytes of salt, a
   32-byte key, `maxmem` 128 MiB -- 64 MiB and about 100 ms per hash on a small server,
   one of OWASP's three equivalent settings. Stored as one string,
   `scrypt$16$8$2$<salt base64url>$<key base64url>`, so the parameters travel with the hash
   and a later raise re-hashes at the account's next successful login. Compared with
   `timingSafeEqual`. A login that names no account still runs `scrypt` against a fixed
   dummy hash, so the response time does not say whether the name exists. A password is
   **at least 12 characters** and at most 256; nothing else is required of it, and no
   composition rule is invented.

3. **The administrator creates every account** (10.31, as PROPOSED), in the admin area:
   name, login and a first password, which the administrator hands over out of band; the
   account holder changes it on first use (`PATCH /admin/api/accounts/<own id>` with the
   current password). **No self-registration**, no invitation link, no reset by mail. An
   account is **deactivated**, never deleted: `meta.json` files name it as creator or
   collaborator, and a deleted id would make them lies. A deactivated account cannot log
   in and its sessions end at once; its Trees stay, and the administrator hands them over
   (`ADR-132-roles-and-permissions.md`).

4. **The administrator is one account, login `admin`, `administrator: true`**, created by
   the server. Every permission on every Tree, present and future, whoever created it, is
   the one line in the permission check: `account.administrator || role(tree, account)`.
   The flag is set by the server alone; no request can set or clear it, and the account
   cannot be deactivated.

5. **Its password comes from `ELSA_ADMIN_PASSWORD`** (10.32, the first of the two PROPOSED
   forms), read **at every start**: when no administrator account exists it is created
   with that password; when one exists and the variable is set, the password is
   **replaced** with it. That is the recovery path for a lost administrator password --
   set the variable, restart, remove the variable -- and the reason the deployment notes
   say to remove it after the first start: while it is set, it wins at every start over a
   change made in the admin area. Shorter than 12 characters, or set when the account
   cannot be written, refuses to start. **Never a default, never generated and printed**:
   the log says `administrator password set from ELSA_ADMIN_PASSWORD; remove the variable`
   and no more. The environment file that holds it is `0600`. A first start with no
   variable and no administrator refuses to start too: an admin area nobody can enter is
   a deployment nobody asked for.

6. **A session is a server-side record and one cookie.** On login the server draws
   **32 random bytes**, base64url, as the token; stores `{ tokenHash: sha256(token),
   accountId, createdAt, lastSeen, expiresAt }` in `sessions.json`; and sets

   ```
   Set-Cookie: elsa-admin-session=<token>; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=<seconds to expiresAt>
   ```

   `HttpOnly`: no script reads it. `Secure`: HTTPS only; development on `localhost` is a
   secure context to every browser, so the flag never comes off. **`SameSite=Strict`**,
   not `Lax`: `Lax` sends the cookie on a top-level navigation from another site, which
   is the one hole a same-site cookie leaves open, and the admin area has no cross-site
   entry that needs the session -- a creator who arrives at `/admin/...` from a link
   without the cookie sees the login page and is sent on to the page they asked for.
   **`Path=/admin`**: the browser never sends the cookie to a public route, so no public
   route can read it, log it or echo it; this is why the editor's API lives at
   `/admin/api/...` and not `/api/admin/...` (`ADR-132-editor-api.md`). No `Domain`, so it
   is host-only. The record stores the token's hash: a read of `sessions.json` yields
   nothing that logs in.

7. **Expiry: 12 hours idle, 14 days absolute.** `lastSeen` is refreshed on a request when
   it is more than 5 minutes old, so an active editor writes one line per session per
   five minutes and not per keystroke; a record older than 14 days, or unseen for 12
   hours, is invalid whatever the cookie says, and is swept at the next write to the
   file. **Regeneration**: a login always issues a new token and never accepts one from
   the request; a login while a session is live replaces the record and the cookie.
   **Logout** deletes the record and answers `Set-Cookie` with the same attributes and
   `Max-Age=0`. Deactivating an account, or changing its password, ends every session of
   that account.

8. **The public routes set no cookie, and it is a rule of section 8 with its test named.**
   No route outside `/admin` sends `Set-Cookie`, under any condition, and none reads
   `Cookie`. `tests/browser/deployment.spec.ts` keeps its sweep and gains its other half:
   after a login in the same browser context, a walk of every public route of 4.1, 15 and
   16 sends **no** `Cookie` header (the `Path` keeps it home) and receives no `Set-Cookie`;
   and `/admin/api/login` is asserted to be the **only** URL in the whole run that ever
   set one, with every attribute above present. The CORS permission of 15.2 stays safe for
   the reason it gave: on the public routes there is still no credential to reach.

9. **CSRF: three layers, and every state-changing request passes all of them.** Every
   `POST`, `PUT`, `PATCH` and `DELETE` under `/admin` is refused with **403** unless
   (a) `Sec-Fetch-Site` is `same-origin`, or the header is absent and `Origin` equals the
   deployment's own origin (`ELSA_BASE_URL` when set, else the request's `Host` as
   `config.ts`'s `baseUrl` already resolves it); (b) on a request that carries a body --
   a `Content-Type` header or any body bytes -- the type is `application/json`, or
   `multipart/form-data` on the one upload route; and (c) the cookie's `SameSite=Strict`,
   which keeps a cross-site request from carrying the session at all. On (b):
   `application/json` is a type no HTML form can send and no cross-site script can send
   without a preflight this server does not answer, so on every JSON route (b) alone
   refuses a form. `multipart/form-data` is one of the three types a form *can* send with
   no preflight, so on the upload route (b) refuses only the other two form types and (a)
   and (c) carry the route -- there is no hole, and this ADR claims no more for (b) than
   it does there. A request with no `Content-Type` and no body -- logout and the three
   `DELETE` routes, whose handlers read no body -- passes (b) and is carried by (a) and
   (c); a form cannot produce one, since a form `POST` always carries one of its three
   types and a form cannot send `DELETE`. `GET` and `HEAD` change nothing, ever. **No synchroniser token**: the
   three layers above have no common failure mode, and a token has one of its own (a page
   that leaks it) and a cost on every form and every render. The login route passes (a)
   and (b) too, against login CSRF. No route under `/admin` sends any
   `Access-Control-*` header.

10. **Rate limit on login**, in memory, two counters. **Per login name**: after **5**
    consecutive failures the name is locked for **15 minutes**; a success resets it. **Per
    deployment**: more than **60 failed logins in one minute** across all names locks the
    login route for one minute (429 with `Retry-After`) -- a name spray is the case, and
    each attempt costs 64 MiB of scrypt, so the ceiling is also what keeps the box up. A
    lock answers **429**; a wrong password **401**; both with the same body, so the
    response does not say which name exists. Not per client address: the reverse proxy of
    `docs/deployment.md` passes no `X-Forwarded-For`, so every request would be
    `127.0.0.1` and one lock would be everyone's, and an address is the one datum about a
    person this project has never held.

11. **What is logged**, to standard output as everything is: a login success (`account
    <id> logged in`), a failure (`login failed for account <id>` when the name exists,
    `login failed for an unknown name` when it does not -- **never the name typed**,
    because a password typed into the login field is the commonest thing in that log),
    a lock, a logout, and every account, permission and publish change with the acting
    account's id, the Tree id and the time. **Never**: a password, a token or its hash, a
    request body, a client address, or a field's text.

12. **Every response under `/admin` carries `X-Robots-Tag: noindex, nofollow`** and
    `Cache-Control: no-store`, and the login page a `<meta name="robots">` to match.
    `robots.txt` is unchanged -- 16.1's "nothing is disallowed" and its test stand -- because
    a `Disallow` keeps a crawler from reading a page and not from indexing its address,
    and the header does both.

## Alternatives rejected

- **E-mail address as login.** Held for nothing, since no mail is sent; and a lab's members
  already know each other's names.
- **Self-registration**, or an invitation link a creator sends. Both need mail or a shared
  secret in a URL; both make "who has an account" something the administrator finds out
  after the fact. The owner's "start by having an admin account" reads as the
  administrator being the door.
- **Argon2id.** The better KDF and not in `node:crypto` on Node 22; a native package is
  core document 7's compiler on the server. Revisit when Node ships it.
- **PBKDF2 or bcrypt.** Both in reach (`node:crypto` has PBKDF2), both cheaper for an
  attacker per unit of the defender's cost than scrypt; `bcrypt` is a package besides.
- **The administrator's password from a CLI prompt** (`scripts/store.ts set-admin-password`).
  A container has no terminal, and the checkout is not always on the server. The variable
  works everywhere the service runs; the CLI is kept for the import, where a file is the
  input and not a secret.
- **`ELSA_ADMIN_PASSWORD` read at the first start only.** No recovery path but editing
  `accounts.json` by hand. Reading it at every start and telling the deployer to remove it
  costs one log line.
- **A generated password printed to the journal.** The journal is kept, is readable by more
  than root on many hosts, and is the one place a password should never be.
- **`SameSite=Lax`.** One click saved on a cross-site arrival, against the cookie riding
  along on every cross-site top-level `GET`; a `GET` under `/admin` changes nothing, so the
  hole is small, and `Strict` closes it for nothing.
- **A `__Host-` cookie prefix.** It requires `Path=/`, and the `Path` is what keeps the
  cookie off the public routes; the prefix's other guarantees (`Secure`, no `Domain`) are
  set explicitly.
- **Sliding expiry written on every request.** A write to `sessions.json` per autosave;
  five minutes of tolerance costs nothing a user can notice.
- **A synchroniser token as the CSRF mechanism, alone or in addition.** Alone, it is one
  layer where the decision above has three; in addition, it is upkeep on every form for a
  failure mode the other three do not share.
- **Server Actions' built-in origin check as the CSRF mechanism.** It exists and it is
  Next.js's, on a request format that is Next.js's; `ADR-132-editor-api.md` chooses route
  handlers, so the check is this project's and testable with `curl`.
- **Rate limiting by client address.** See decision 10.
- **`Disallow: /admin` in `robots.txt`.** It would break 16.1's frozen test and does less
  than the header.

## Consequences

- `src/store/accounts.ts` and `src/store/sessions.ts` (#135): the hash, the compare, the
  dummy hash, the token, the cookie string, the expiry rule, the two counters. The cookie
  attributes are one constant with one test that asserts every attribute by name.
- `src/app/[lang]/admin/` (#135 for login and accounts, #133 for the screens): every route
  handler under `/admin/api` passes through one function, `authenticated(request)`, which
  resolves the session, applies decision 9 to a writing method, and answers 401 or 403
  itself; a handler that does not call it cannot read the store, because the store's
  writing members take the resolved `Account` as their first argument.
- `deploy/elsa-decisiontree.env.example` gains `ELSA_ADMIN_PASSWORD` with the removal
  note; `docs/deployment.md` step 4 sets the file's mode to `0600` and says the file now
  holds a secret at first start.
- `deployment.spec.ts` gains the logged-in half of the sweep; `tests/store/accounts.test.ts`
  and `sessions.test.ts` (#135) assert the hash format, the dummy-hash timing path
  (structurally: the function is called on an unknown name), the lock counters, the expiry
  rule and the cookie constant.
- The dataset endpoint's CORS argument (15.2) is restated in 20: "no credential on the
  public routes" is now a rule kept by `Path`, `SameSite` and the sweep, rather than a fact
  about the whole origin.
