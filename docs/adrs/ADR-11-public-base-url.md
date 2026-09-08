# ADR-11-public-base-url: `ELSA_BASE_URL` is optional, its one consumer is the canonical link, and a bad value refuses to start

- Status: ACCEPTED (frozen) -- 2026-09-08
- Issue: #11 -- Deploy on a plain Linux server
- Spec: `docs/specs/application.md`, sections 1 and 4.1
- Amends: `ADR-5-url-scheme.md` -- its canonical-link bullet. The path grammar, the share
  link, the Trail and every answer of the error table are unchanged.

## Context

`docs/CORE_DOCUMENT.md` section 7 wants the application to run on a plain Linux machine,
and issue #11 TASK 2 asks for the public base URL to be configurable, because a deployment
listens on `127.0.0.1:3000` behind a reverse proxy and is *reached* at something else
entirely. Nothing in the process can work that address out for itself: the proxy is
deliberately invisible to the app (`docs/specs/application.md` section 1).

The question that had to be answered before writing the variable down was **who reads it**.
The application emits exactly two kinds of absolute address:

- the **share link**, which the share button copies. It turned out to need no
  configuration at all: the button copies the browser's own address bar, so it is already
  the public URL, whatever proxy produced it.
- the **canonical link** of a Node page (4.1), which the *server* writes into the markup
  and which no browser tells it. It is the only honest consumer left.

So the variable exists for one link, and this is the record of that -- and of the two
things that follow from it: what happens when a deployment names no base URL, and what
happens when it names a bad one. #11 is a build issue, not an `architecture` one; the
behaviour was built against the contracts, and PR #34's reviewer found this decision living
only in a PR body and in code comments. It is written down here instead.

## Decision

**1. `ELSA_BASE_URL` is optional, and a deployment that names none is a valid deployment.**
It is not in the required set with `ELSA_TREE`. Without it the canonical link stays exactly
the path 4.1 froze -- `/<tree-id>/<id-n>`, with `lang` when not the default -- which every
browser and every crawler resolves against the address it fetched the page from. The only
thing a deployment gives up by leaving it out is telling a crawler which host is the
canonical one when the same content answers on more than one; that is a real but narrow
loss, and it is the reader's experience that decides here, not the crawler's.

**2. Its one consumer is the canonical link. The share link never reads it.** The variable
reaches exactly one place in the code, `metadataBase` in
`src/app/[lang]/[tree]/[...path]/page.tsx`; `src/url.ts` -- which owns the grammar and
builds every link the app emits -- does not know it exists. This is what keeps the
amendment to 4.1 as small as it is: no link a reader clicks, and no link a reader shares,
changes shape whether the variable is set or not.

**3. A bad value is a refusal to start, not a fallback.** `publicBaseUrl()` in
`src/config.ts` accepts a bare `http(s)` origin and refuses everything else with a message
naming the value:

| Value | Message |
|---|---|
| no scheme, e.g. `elsa.example.org` | `ELSA_BASE_URL=... is not an absolute URL` |
| another scheme, e.g. `file:///opt/elsa` | `ELSA_BASE_URL=...: only http and https are served` |
| a path, query or fragment, e.g. `https://elsa.example.org/tool` | `ELSA_BASE_URL=... must be a bare origin` |

The path case is not fussiness: the app sets no `basePath` and is served at the root of its
host, so a base URL carrying one would publish canonical addresses that answer 404. The
three messages are distinct because `docs/deployment.md`'s "when it does not start" table
gives each its own row, and an operator greps the journal against that table.

**4. It is read at start, before the Tree, and again per request.** At start, so that a
typo is a server that does not come up rather than a wrong address on every page --
and before `servedTree()`, because parsing a URL is the cheaper of the two failures to
report. Per request in `generateMetadata`, so the value is a run-time setting like the Tree
itself: the same built artefact serves any address, and no rebuild is needed to move a
deployment. Under `Restart=always` a bad value is a restart loop that says why every five
seconds, which is the same shape a broken Tree already has.

## What was measured

On the standalone build (`npm run build` then `node .next/standalone/server.js`), Tree
`ai-act-example`, and in a real `ubuntu:24.04` boot under systemd 255 -- the full evidence
is on PR #34.

**One build, two addresses.** `tests/browser/deployment.spec.ts` runs against two servers
started by `playwright.config.ts` from *the same* build, one with
`ELSA_BASE_URL=https://elsa.example.org` and one with the variable empty:

| Page | With the variable | With it empty |
|---|---|---|
| `/ai-act-example/start` | `https://elsa.example.org/ai-act-example/start` | `/ai-act-example/start` |
| `/ai-act-example/start/prohibited-practices?lang=nl` | `https://elsa.example.org/ai-act-example/prohibited-practices?lang=nl` | `/ai-act-example/prohibited-practices?lang=nl` |

That the second server runs the build the first one made, with `ELSA_BASE_URL` set, is what
pins decision 4's second half: the address is not baked in at build time. Both rows also
show the canonical link still dropping the Trail and keeping the language, which is 4.1
unchanged.

**The refusals.** The three messages of decision 3 are the ones the code prints, each for
its own class of value; `tests/config.test.ts` pins them by the words that tell them apart,
and pins that an unset, empty or whitespace-only value is accepted as "none". On PR #34's
`ubuntu:24.04` run, `ELSA_BASE_URL=https://elsa.example.org/tool` in
`/etc/elsa-decisiontree.env` gave the third message, `status=1/FAILURE`, and 3 refusals
logged in 12 s with `NRestarts=2` -- decision 4's restart loop, saying why each time.

**Nothing else changed.** `npm test` -- 13 files, 201 tests; `npm run typecheck` clean;
`npm run test:browser` 40 tests on the two servers. The only runtime difference this
decision makes to a served page is the one attribute in the table above.

## Alternatives rejected

- **Ship the variable unused.** TASK 2 asks for the public base URL to be configurable, and
  the share link -- the obvious consumer -- turned out not to need it. Defining
  `ELSA_BASE_URL` in the unit file and the documentation while nothing read it would have
  closed the task on paper. Rejected: a configuration variable that changes nothing
  observable is a false statement in an operator's runbook, and it would leave the one link
  the *server* writes about itself with no way ever to be absolute. Either the variable has
  a consumer or it should not exist; it has exactly one, and decision 2 names it.
- **Default instead of refusing.** On a value that does not parse, fall back to the path --
  the same behaviour as naming no base URL -- and log a warning. It never costs an outage,
  which is the whole of its appeal. Rejected because the failure it hides is silent and
  total: `elsa.example.org` without a scheme, or a trailing `/tool` copied from a proxy
  configuration, is exactly the typo an operator makes, and the deployment would then serve
  every page with a wrong or missing canonical link while `systemctl is-active` says
  `active`. A refusal is noticed in the minute it is made, by the person who made it. The
  Tree already sets this precedent (`ADR-5-lazy-loading.md`: a Tree that does not validate
  is a server that does not start), and one rule for both is easier to hold than two.
- **Derive the origin from the request instead of configuring it** -- read `Host`, or
  `X-Forwarded-Host`, in `generateMetadata`. It needs no variable at all and it is what many
  applications do. Rejected because both headers are supplied by the caller: whoever can
  reach the port can put any host in them and have the server publish a canonical link
  pointing at it. Trusting `X-Forwarded-Host` would additionally make the app depend on the
  proxy setting it correctly -- the app knowing the proxy exists, which section 1 says it
  does not. The address a deployment is reached at is a fact about the deployment, so it is
  configured where the rest of the deployment is.

## Consequences

- `docs/specs/application.md` 4.1's canonical bullet gains its "and absolute when
  `ELSA_BASE_URL` is set" half, and section 1's configuration row gains the variable. That
  is the whole contract change; the amendment note at the top of the file states it.
- `src/config.ts` grows one exported function, `publicBaseUrl()`, next to the Tree
  selection it already owns -- both are "what a deployment configures".
- A deployment that later needs a second absolute link -- an Open Graph URL, a sitemap --
  has the origin already, and reads it from the same place. Nothing here has to be
  revisited for that; a new consumer does not make a new decision.
- `docs/deployment.md` is the procedure, and its error table is the operator-facing half of
  decision 3. The table and the messages must stay in step: `tests/config.test.ts` pins the
  messages, so a change to one fails a test rather than quietly making the table wrong.
