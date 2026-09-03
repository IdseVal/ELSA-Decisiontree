# ADR-5-tree-selection: one Tree per deployment, chosen by the `ELSA_TREE` environment variable; the Tree id stays in every URL

- Status: ACCEPTED (frozen) -- 2026-09-03; decides core document OPEN 10.19
- Issue: #5 -- Architecture: freeze the application contracts
- Spec: `docs/specs/application.md`, section 2

## Context

Open item 10.19 asks whether one deployment serves exactly one Tree or offers a choice.
The owner did not answer and delegated it to the Architect, with the Planner's default
"one Tree per deployment, chosen by configuration (does not preclude a landing page
later)". The first and only Tree at launch is the AI Act applicability Tree; other ELSA
labs are expected to run *their own* deployment of the same frontend with their own
Tree (core document 1, 2). Trees are folders under `trees/` (`ADR-4-file-layout.md`).
Nothing is stored server-side and there are no cookies, so any choice a visitor made
would have to live in the URL.

## Decision

- **One deployment serves exactly one Tree.** The Tree is named by the environment
  variable `ELSA_TREE`, whose value is the Tree id: the folder name under the
  directory named by `ELSA_TREES_DIR` (default: `trees` under the working directory).
- `ELSA_TREE` has **no default**. If it is unset, names a folder that does not exist,
  names a reserved word (currently only `images`, see `ADR-5-url-scheme.md`), or the
  Tree fails validation, the server refuses to start and prints why, listing the Tree
  ids it did find. Development sets it in `.env.development`, which Next.js reads only
  in `next dev`; production sets it in the process environment.
- **The Tree id is nevertheless part of every Node URL** (`/<tree-id>/<node-id>...`).
  A request naming any other Tree id answers 404. `/` redirects to the served Tree's
  root Node.

## Alternatives rejected

- **A choice of Trees in the UI (landing page; every folder under `trees/` served).**
  Nobody asked for it: each lab runs its own deployment. It would make the validator
  load every folder, make every page aware of "which Tree", and put a landing page in
  the way of the one Tree people come for. The URL scheme keeps the door open.
- **Serve the only folder under `trees/` when there is exactly one, otherwise fail.**
  Saves one variable in the simplest case, but the repository already holds two Trees
  (the spec's example and the real one), so the simple case never occurs, and a
  deployment that changes behaviour when a folder is added is a surprise waiting.
- **A configuration file (`elsa.config.yaml`) committed in the repository.** Ties the
  deployed Tree to a commit: deploying the same build with a different Tree becomes a
  code change. An environment variable is set by the systemd unit and nothing else.
- **Node URLs without the Tree id (`/node/<id>`).** Shorter, but a share link is the
  one artefact the project cannot change later without breaking what people saved and
  sent. Sixteen characters buy links that survive a landing page, a second Tree on the
  same host, and Cross-links (`tree-id:node-id`, `ADR-4-identifiers-and-cross-links.md`)
  without a redirect table.

## Consequences

- The application holds one Tree in memory, opened and validated once at start; there
  is no "current Tree" parameter threaded through the code.
- Switching a deployment to another Tree is changing one variable and restarting.
- A later multi-Tree deployment is an additive change (open several folders, keep the
  URLs), not a migration.
