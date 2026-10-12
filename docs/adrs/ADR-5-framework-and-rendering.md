# ADR-5-framework-and-rendering: Next.js (App Router) rendered on the server, shipped as a standalone Node.js server

- Status: ACCEPTED (frozen) -- 2026-09-03; amended 2026-09-05 (see Amendments)
- Issue: #5 -- Architecture: freeze the application contracts
- Spec: `docs/specs/application.md`, sections 1 and 5

## Context

The core document asks for a small web application, "essentially a single interactive
component (React or Next.js)", with server-side rendering, lazy loading, a lightweight
client, and simple code in few, short files (sections 1, 3.2). It must run on a plain
Linux server -- a Wageningen University machine or a Hetzner box -- and must not depend
on features of a specific hosting vendor (section 7). There are no accounts, cookies,
analytics or database (sections 4, 8). The devcontainer already pins Node.js 22 and
uses npm; the CI pipeline template expects Node 22 and `npm ci`.

## Decision

- **Framework: Next.js with the App Router, on React.** TypeScript throughout, strict.
  The current stable major at the time the scaffold issue runs is pinned in
  `package.json`; minor and patch upgrades need no ADR.
- **Rendering: React Server Components.** The Node page is an `async` server component
  that reads one Node through the loader (`ADR-5-lazy-loading.md`) and returns HTML.
  The first response to any URL is complete HTML: title, description, Sources, Trail,
  the thumbnails' `<img>` tags, links, disclaimer. Only two things are client
  components: the thumbnail enlarge and the share button. Navigation, the Trail and
  the language switch are plain links, so the app works without JavaScript.
- **Deployment shape: `output: 'standalone'`.** `next build` produces a self-contained
  folder that runs with `node server.js`, configured by environment variables only
  (`PORT`, `HOSTNAME`, and the app's own `ELSA_TREE` / `ELSA_TREES_DIR`). A reverse
  proxy for TLS and a systemd unit are the deployment issue's concern; nothing in the
  app knows about them. No vendor-only features: no edge runtime, no Incremental Static
  Regeneration, no image-optimisation service, no `next/font` fetching from Google at
  build time unless the font files are vendored.
- **Runtime: Node.js 22 (LTS)**, the version the devcontainer pins, recorded in
  `.nvmrc` and in `engines`. **Package manager: npm** with a committed
  `package-lock.json`; CI and deployment use `npm ci`.
- `poweredByHeader: false`; `NEXT_TELEMETRY_DISABLED=1` in every environment; no
  request from the running app ever leaves the server (core document 7, 8).

## Alternatives rejected

- **Vite + React single-page app.** The lightest client, but server-side rendering
  would have to be assembled by hand (an Express server, `renderToString`, hydration,
  a router that works on both sides). That is the framework Next.js already is, written
  again in this repository, in more files than the app itself.
- **Next.js static export (`output: 'export'`).** Would run on any static host, but the
  URL of a page carries the Trail (`ADR-5-url-scheme.md`), and the set of possible
  Trails through a graph is unbounded, so the pages cannot be pre-rendered. The Trail
  would have to be drawn client-side after load -- a flash, and no Trail without
  JavaScript. A static export also cannot answer 404 for an unknown Node id and cannot
  validate the Tree at server start.
- **Remix / React Router framework mode, Astro.** Capable and vendor-neutral, but the
  owner named React or Next.js, and the difference for an app of this size is taste,
  not capability. Choosing what the owner named removes a discussion.
- **Docker as the deployment unit.** Not rejected as a tool -- the devcontainer exists
  -- but not required: the contract is `node server.js` on a plain server, which a
  container can wrap later without a decision here.
- **pnpm / yarn / bun.** One more thing to install on the server and in CI, for
  workspaces and speed the project does not need.

## Consequences

- The client bundle is React plus two small client components; everything else is
  HTML from the server.
- Every URL is a full document render; there is no client-side state to lose, and a
  shared link reproduces the screen exactly (core document 3.2).
- The app is one Node.js process reading files from disk; moving between the
  university server and a Hetzner box is copying a folder and setting three
  environment variables.

## Amendments

- **2026-09-05 (owner, on PR #17).** "The first response to any URL is complete HTML"
  above holds for every page except the 404, whose body Next.js delivers as an RSC
  payload for the client bundle to paint. The status code stays 404 in the response.
  The reasoning and the exact wording are in `docs/specs/application.md` 4.3.
