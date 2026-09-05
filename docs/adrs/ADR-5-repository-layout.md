# ADR-5-repository-layout: `src/` holds six modules and the routes; Trees in `trees/`; tests and fixtures in `tests/`

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #5 -- Architecture: freeze the application contracts
- Spec: `docs/specs/application.md`, section 6
- Amended 2026-09-04 by `ADR-19-content-language-in-the-route.md`: every file of
  `src/app/` listed below moves one level down, under `[lang]/`, whose `layout.tsx` is the
  root layout and owns `<html lang>`; `next.config.ts` gains the two rewrites of
  application.md 4.4. No other module moves.

## Context

The core document asks for simple code: not many files, no long files (3.2). Tree data
lives in `trees/<tree-id>/` and is edited by hand (`ADR-4-file-layout.md`). The
loader, the Node view, the Trail and sharing, the language switch and the deployment
are built in separate issues by separate runs, so each must know where its code goes
and what the neighbouring modules own. The repository already contains `docs/`,
`.orca/`, `.claude/`, `.github/` and `.devcontainer/` for the agent workflow; those are
not the application.

## Decision

Top level:

| Folder or file | Owns |
|---|---|
| `src/app/` | Next.js routes only: `layout.tsx`, `page.tsx` (`/` redirect), `[tree]/page.tsx` (`/<tree-id>` redirect), `[tree]/[...path]/page.tsx` (the Node page), `images/[file]/route.ts`, `not-found.tsx`, `globals.css`. A route file parses, loads, and hands data to a view; it holds no logic of its own. |
| `src/components/` | Synchronous React views that take data and return markup: the Node view, the Trail, the thumbnails (client), the share button (client), the language switch and the footer. No file system, no environment, no URL parsing here. |
| `src/tree/` | The Tree loader module: `loader.ts` (the interface of `ADR-5-lazy-loading.md`), `validate.ts` (the rules of `tree-format.md` section 7), `types.ts` (the TypeScript types of `elsa-tree/1`). Nothing outside `src/tree/` reads YAML or touches a Tree folder. |
| `src/url.ts` | The URL scheme (`ADR-5-url-scheme.md`): parse a request path and query into `{ treeId, trail, nodeId, lang }`, and build every link the app emits. |
| `src/chrome.ts` | The chrome strings in `en` and `nl`, and the fallback rule (`ADR-5-chrome-languages.md`). |
| `src/config.ts` | Reads `ELSA_TREE` and `ELSA_TREES_DIR`, rejects reserved ids, and exposes the one opened `Tree` for this process. |
| `src/markdown.ts` | Renders the rich-text subset of `tree-format.md` section 3.4 to safe HTML: raw HTML escaped, links opened in a new tab with `rel="noopener"`. |
| `src/instrumentation.ts` | Next.js's startup hook: opens the Tree at server start and exits on failure. |
| `scripts/validate.ts` | `npm run validate <dir>`: prints every violation of a Tree folder, exit code 1 if any. |
| `trees/` | Tree data, one folder per Tree in the `elsa-tree/1` format. `trees/ai-act-example/` is the spec's example Tree and the development default; the first real Tree is authored beside it. |
| `tests/` | Vitest tests, one file per module (`loader.test.ts`, `url.test.ts`, `chrome.test.ts`, `views.test.tsx`, `interop.test.tsx`) and `tests/fixtures/` with small Trees for the invalid and other-language cases (`ADR-5-testing-approach.md`). |
| `docs/` | The core document, specs, ADRs, research. Unchanged. |
| root files | `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.nvmrc`, `.env.development` (sets `ELSA_TREE=ai-act-example`), plus the existing workflow folders. |

Rules:

- **Dependencies point inward:** `app` -> `components`, `url`, `chrome`, `config`,
  `markdown`; `config` -> `tree`; `components` -> `chrome`, `url`, `markdown`, `tree`
  (types only). `src/tree/` imports nothing from the rest of the app.
- A file that passes about 200 lines is split along a seam the spec names, not
  wherever it happens to be long. The UI issue may split or merge files inside
  `src/components/` freely; the other module boundaries change only through an ADR.
- No `lib/`, `utils/`, `helpers/` or `services/` folders: a function that has no
  module of its own belongs in the module that calls it.

## Alternatives rejected

- **Feature folders (`features/node`, `features/trail`, `features/share`).** Groups by
  screen area, but the seams that matter here are data / URL / view, and every feature
  would need all three. The result is six folders of one file each.
- **Colocated tests (`loader.test.ts` next to `loader.ts`).** Doubles the file count in
  `src/` for an app that is meant to have few files, and the fixtures need a folder of
  their own anyway. One `tests/` folder mirrors `src/` by name.
- **Everything under `src/app/`, Next.js style.** Route folders are for routes; putting
  the loader under `src/app/[tree]/` couples it to a URL and hides it from the
  validator CLI and from tests.
- **A `public/` folder for images.** See `ADR-5-lazy-loading.md`: images are served by
  a route from the Tree's own folder, so `public/` holds only the favicon.
- **A `packages/` monorepo (loader as its own package).** Nobody else consumes the
  loader today; a second consumer (a lab's own validator, an editor) can extract it
  then. One adapter is a hypothetical seam.

## Consequences

- A newcomer reads seven short modules and knows the whole application.
- The five build issues each own a named place: loader -> `src/tree/` and
  `scripts/`; Node view -> `src/components/`, `src/markdown.ts`, `src/app/`; Trail and
  sharing -> `src/url.ts` and two components; language switch -> `src/chrome.ts` and
  one component; deployment -> `next.config.ts`, the systemd unit and CI.
