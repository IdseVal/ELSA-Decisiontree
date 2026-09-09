# ELSA decision tree

A small web application that walks a reader through a legal decision tree, one **Node**
at a time. It serves one **Tree** -- a folder of YAML files in the `elsa-tree/1` format --
and holds its whole state in the URL: no database, no account, no cookie, no tracking.

- What the project is for: [`docs/CORE_DOCUMENT.md`](docs/CORE_DOCUMENT.md)
- The Tree file format, for anyone authoring a Tree: [`docs/specs/tree-format.md`](docs/specs/tree-format.md)
- The application contracts: [`docs/specs/application.md`](docs/specs/application.md)
- How to run it on a server: [`docs/deployment.md`](docs/deployment.md)

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

The application serves exactly one Tree, named by `ELSA_TREE`. There is no default: the
server refuses to start when the variable is unset or names a Tree that does not validate.

```sh
npm run dev                    # development; .env.development points at trees/ai-act-example
npm run build && ELSA_TREE=ai-act-example npm start
```

Then open `http://localhost:3000/ai-act-example/start` -- the URL of a Node is
`/<tree-id>/<node-id>`. `npm run build` also copies the client bundle and the stylesheet
into `.next/standalone/`, so that folder plus `trees/` is the whole deployment.

## Point the app at a Tree

| Variable | Meaning |
|---|---|
| `ELSA_TREE` | The Tree id: the folder name under `ELSA_TREES_DIR`. Required. |
| `ELSA_TREES_DIR` | Where the Tree folders live. Defaults to `trees` under the working directory. |
| `ELSA_BASE_URL` | The public origin the deployment is reached at, e.g. `https://elsa.example.org`. Optional; it is what makes the canonical link of a page absolute. |
| `PORT`, `HOSTNAME` | Where the server listens. |

To serve your own Tree, put its folder next to `trees/ai-act-example/` (or point
`ELSA_TREES_DIR` at your own folder) and name it in `ELSA_TREE`.

## Test

```sh
npm test          # vitest: the loader, the URL scheme, the chrome, the views
npm run typecheck # tsc --noEmit
npm run validate trees/ai-act-example   # check one Tree folder against the format

npx playwright install chromium         # once
npm run test:browser                    # the same app in a real browser
```

`npm run test:browser` builds the app and starts two standalone servers on that build with
`ELSA_TREE=ai-act-example` -- the same command a deployment runs -- then drives them with
Playwright: port 3117 with a public base URL configured, and port 3118 with none, the
default `docs/deployment.md` leaves a deployment at. It covers what markup cannot show:
what a click on a thumbnail does, which image files the browser actually asks for, and
whether a keyboard reaches everything.

`npm run validate` prints one line per broken rule -- `tree-id  file  key.path  RULE
message` -- and exits 1 if there is any. Run it before pushing a Tree.
