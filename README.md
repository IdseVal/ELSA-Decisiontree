# ELSA decision tree

A small web application that walks a reader through a legal decision tree, one **Node**
at a time. It serves one **Tree** -- one `tree.json` file in the `elsa-tree/4` format
([`docs/specs/tree-format.md`](docs/specs/tree-format.md)), with its images and its theme
beside it -- and holds its whole state in the URL: no database, no account, no cookie, no
tracking.

- What the project is for: [`docs/CORE_DOCUMENT.md`](docs/CORE_DOCUMENT.md)
- The Tree file format, for anyone authoring a Tree: [`docs/specs/tree-format.md`](docs/specs/tree-format.md)
- The structure half of that format as a JSON Schema: [`schemas/elsa-tree-4.json`](schemas/elsa-tree-4.json),
  which any validator checks. It carries no length limit and no list maximum: those are
  measured on counted text (`tree-format.md` 3.8, 5.7) and are reported by `npm run validate`,
  so run that too before you call a Tree finished.
- The application contracts: [`docs/specs/application.md`](docs/specs/application.md)
- How to run it on a server: [`docs/deployment.md`](docs/deployment.md)
- Licence: the code is MIT ([`LICENSE`](LICENSE)); the Tree content is CC BY 4.0 ([`CONTENT-LICENSE`](CONTENT-LICENSE)).

Version 0.1 -- the state described by those two specs -- is preserved on the branch
`version-0.1`. `dev` carries the plan for the version 0.2 rework the owner asked for in
issue #35 (a tree on screen, no scrolling, a carousel, branding from the Tree, one file
per Tree): the 0.1 code, the two specs marked superseded in part, and the issues that do
the work. See `docs/adrs/ADR-35-version-0-2-rework.md` for what changes and in which issue.

## Install

Node.js 22 (see `.nvmrc`) and npm.

```sh
npm ci
```

## Run

The application serves every published Tree of its data directory, `ELSA_DATA_DIR`. There
is no default: the server refuses to start when the variable is unset or names a folder it
cannot write. The first start fills the folder from `trees/`, every Tree published, and
creates the administrator from `ELSA_ADMIN_PASSWORD` (12 characters or more; there is no
default, so a first start without it refuses to start). Later starts need it no more.

```sh
ELSA_ADMIN_PASSWORD='choose a password' npm run dev   # development; .env.development points at .elsa-data/
mkdir -p /tmp/elsa-data
npm run build && ELSA_DATA_DIR=/tmp/elsa-data ELSA_ADMIN_PASSWORD='choose a password' npm start
```

Then open `http://localhost:3000/` -- the overview of every published Tree, one tile each --
or `http://localhost:3000/admin` to log in as `admin`.
The URL of a Node is `/<tree-id>/<node-id>`, e.g. `/ai-act-example/start`. Deleting the
data directory resets it: the next start seeds it again. `npm run build` also copies the
client bundle, the stylesheet and `schemas/` into `.next/standalone/`, so that folder plus
a data directory is the whole deployment.

## What a deployment serves besides the pages

Every published Tree is a public dataset as well as a walk (`docs/specs/application.md`
15, 16 and 23); a Tree that is not published answers 404 on all of these and is listed in
none:

| URL | What |
|---|---|
| `/<tree-id>/tree.json` | That Tree's published file, byte for byte, under CC BY 4.0 -- the licence is in a `Link` header on the bytes. Cross-origin reads are allowed; no cookie is set. |
| `/schemas/elsa-tree-4.json` | The format's JSON Schema, which that file names in its own `$schema` key. MIT, like the rest of the code. |
| `/<tree-id>/images/<file>`, `/<tree-id>/theme/<file>` | That Tree's pictures and Theme files. |
| `/llms.txt` | A short plain-text description of the site for an AI agent: what it is, where each Tree's dataset and the schema are, and how to address any step by URL. |
| `/sitemap.xml`, `/robots.txt` | The overview and every Node of every published Tree in every language, and a crawler policy that allows everything. |
| Every Node page | A `schema.org` `@graph` in one `application/ld+json` script: the `Dataset` on the root Node's page -- its licence, its download and the instrument it is based on -- and a `WebPage` on every page, with the step's `Question` and its two answers where the Node asks one. |

`curl -s http://localhost:3000/ai-act-example/tree.json | diff - trees/ai-act-example/tree.json`
is empty: the download **is** the dataset, not an export of it.

## Point the app at its data

| Variable | Meaning |
|---|---|
| `ELSA_DATA_DIR` | The one writable folder that holds every Tree, under `trees/<tree-id>/`. Required. |
| `ELSA_SEED_DIR` | The Tree folders the first start imports, published, into an empty data directory. Defaults to `trees` under the working directory. Never read again. |
| `ELSA_BASE_URL` | The public origin the deployment is reached at, e.g. `https://elsa.example.org`. Optional; it is what makes the canonical link of a page absolute. |
| `PORT`, `HOSTNAME` | Where the server listens. |

`ELSA_TREE`, `ELSA_TREES_DIR` and `ELSA_TREE_LASTMOD` are retired: set, the server refuses
to start and says what replaced them. A Tree is published exactly when its folder in the
data directory holds a `tree.json`. To serve your own Tree, put its folder next to
`trees/ai-act-example/` before the first start, or copy it into `$ELSA_DATA_DIR/trees/`
with the server stopped (`docs/deployment.md`).

## Test

```sh
npm test          # vitest: the loader, the URL scheme, the chrome, the views
npm run typecheck # tsc --noEmit
npm run validate trees/ai-act-example   # check one Tree folder against the format

npx playwright install chromium         # once
npm run test:browser                    # the same app in a real browser
```

`npm run test:browser` builds the app and starts two standalone servers on that build, each
on a fresh data directory seeded with `ai-act-example` -- the same command a deployment
runs -- then drives them with
Playwright: port 3117 with a public base URL configured, and port 3118 with none, the
default `docs/deployment.md` leaves a deployment at. It covers what markup cannot show:
what a click on a thumbnail does, which image files the browser actually asks for, and
whether a keyboard reaches everything.

`npm run validate` prints one line per broken rule -- `tree-id  node-id  key.path  RULE
message` -- and exits 1 if there is any. Run it before pushing a Tree.
