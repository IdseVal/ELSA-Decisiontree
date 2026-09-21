# ADR-118-dataset-endpoint: the Tree file is served byte-identical at `/<tree-id>/tree.json`, under CC BY 4.0, cross-origin and without a cookie

- Status: ACCEPTED (frozen) -- 2026-09-21
- Issue: #118 -- Architecture: freeze the JSON-only Tree format (`elsa-tree/4`)
- Spec: `docs/specs/application.md` section 15; 4.1, 4.3 and 5.2 amended
- Depends on: `docs/adrs/ADR-118-json-serialisation.md`, `ADR-118-json-schema.md`
- Amends: `docs/adrs/ADR-5-url-scheme.md` (`/<tree-id>/tree.json` joins the
  grammar of 4.1 and 4.3 gains its 404 row; the Trail, the share link and `?lang`
  are untouched), `ADR-5-repository-layout.md` (one route file, served through
  `src/assets.ts`) and `ADR-5-testing-approach.md` (`deployment.spec.ts` becomes a
  contract of this issue and its no-cookie sweep covers every route of 15 and 16)

## Context

The application serves every Node as a page and every Image and Theme file as a file, and
serves the Tree file not at all: `/<tree>/tree.yaml` is a 404 today, because no route
matches it and `tree.yaml` is not a valid id. A reader who finds the walk has no way to
the data behind it, and the only copy of the dataset is the git repository.

The owner's direction of 2026-09-21 is that the Trees are **findable as datasets** -- by
Google Dataset Search, by the crawlers behind AI assistants, by another ELSA lab that
wants to load this Tree into its own build. Every one of those wants the same thing: one
URL that returns the whole dataset, in a documented format, under a stated licence.

That collides, on its face, with a contract this project has held since 0.1 and restated
in 0.2: **no response carries the whole Tree** (core document 3.1 and 9;
`application.md` 5.2, "Never, in any response ... the Tree file, a file path, or any
route that returns more than one Node"). It has to be read for what it protects. The rule
exists so that a *page* stays small on a slow connection and so that opening a Tree of a
thousand Nodes does not download a thousand Nodes. It was never a rule that the data must
be secret -- the content is CC BY 4.0 and the repository is public.

## Decision

1. **`GET /<tree-id>/tree.json`** serves the served Tree's file. `<tree-id>` must be the
   Tree this deployment serves (`ELSA_TREE`); any other id is the 404 that 4.3 already
   gives. The id is in the path, rather than a bare `/tree.json`, so that the dataset
   URL of a Tree is stable across a deployment that later serves a second Tree, exactly
   as the Node URLs are (`ADR-5-tree-selection.md`).
2. **`GET /schemas/elsa-tree-4.json`** serves the schema. `schemas` joins `images` and
   `theme` as a reserved Tree id (4.3), and a deployment whose `ELSA_TREE` is one of the
   three refuses to start.
3. **The bytes served are the file's bytes.** Not a re-serialisation of the in-memory
   Tree, not a pretty-print, not a projection: the route streams the file, through the
   same code path as an Image or a Theme file (`src/assets.ts`), so that `curl <url> |
   diff - trees/<id>/tree.json` is empty and a checksum taken from the download equals
   one taken from the repository. **The download IS the dataset.** The file was validated
   at server start, so what is served is data that passed section 7.
4. **One header set for both routes**, defined once. `Content-Type`; a `Link` carrying
   the licence -- CC BY 4.0 on `tree.json`, MIT on the schema, because the licence must
   travel with the bytes and not only with the page that links to them (core document
   8); a `Link` carrying `rel="describedby"` to the schema on `tree.json`;
   `Cache-Control`, the same hour as an image or a font; a strong `ETag` answering
   `304`; `Access-Control-Allow-Origin: *` with **`Access-Control-Allow-Credentials`
   never sent**; `Access-Control-Allow-Methods: GET, HEAD`; `X-Content-Type-Options:
   nosniff`; the `Content-Security-Policy` 5.3 already applies to third-party bytes,
   unchanged; `Content-Disposition: inline`; and **never a `Set-Cookie`**. **The
   values, and the reason for each row, are in `application.md` 15.2 -- one table, and
   this ADR does not repeat it**, for the reason `ADR-118-crawler-access.md` gives for
   the token list: a normative table in two documents is two tables, and the second is
   the one that drifts.

   What this decision settles, rather than the values, is that **CORS is safe on this
   origin**: there is no cookie, no session, no account and no header that carries
   authority, so a cross-origin read reaches nothing a plain `curl` does not (core
   document 4, 8). That is a fact about this deployment and not a precedent for any
   future route that gains a credential.

5. **5.2's "never" is restated as a rule about pages.** The sentence becomes: never, in
   any **page** response, more than 17 Nodes' content, a file path, or any route a *page*
   follows that returns more than one Node. The dataset endpoint is a URL a reader or a
   crawler asks for on purpose; no page fetches it, no client component knows it exists,
   and the bound on what a page carries is untouched. Without this restatement #121 would
   have to break a frozen contract to do what the owner asked, which is the situation this
   project's architect role exists to avoid.
6. **Every Node page links to it once**: `<link rel="alternate" type="application/json"
   href="<dataset URL>">` in the head, so a crawler that landed on any page of the walk
   finds the data (issue #121).
7. **No collision, and no existing URL changes.** `tree.json` cannot be a Node id -- the
   id grammar of `tree-format.md` 3.1 admits no dot -- so `/<tree-id>/tree.json` is a
   path the Node page route answers 404 for today and the dataset route answers 200 for
   tomorrow. Nothing that resolves now resolves differently.

## Alternatives rejected

- **`GET /tree.json` at the root**, without the Tree id. Shorter, and unambiguous while a
  deployment serves one Tree. Rejected because every other public URL of this application
  carries the Tree id for the same reason (`ADR-5-tree-selection.md`): the day a landing
  page or a second Tree arrives, a root-level dataset URL either breaks or lies.
- **Serving the dataset from the in-memory Tree, re-serialised on request.** It would
  make byte-identity a property of the writer rather than of the file, which sounds
  equivalent and is not: the reader could no longer check a download against the
  repository, and a bug in the writer would be invisible until someone diffed. Streaming
  the file makes the claim checkable with `diff`.
- **A `Content-Disposition: attachment` download.** Friendlier to a person clicking a
  link, hostile to everything else: a crawler that follows the link gets a file it is
  asked to save rather than a document it can read, and a browser cannot show it.
- **No CORS header.** The conservative default, and wrong for this one route: a dataset
  that a notebook or another lab's page cannot `fetch` is a dataset only in name. The
  reason it is safe is stated in decision 4 and in `application.md` 15.2, and it is
  specific to an origin with no credentials at all -- it is not a precedent for any
  future route that gains one.
- **Serving `tree.yaml` as well, for a transition period.** Two serialisations of one
  contract, which `ADR-118-json-serialisation.md` rejected for the format and which is
  no better at the edge of the system.
- **Putting the licence only in the page, not in a header.** A crawler that fetches only
  the JSON never sees the page. `rel="license"` is the one place a machine looks.

## Consequences

- The loader's seam gains one member -- the path of the Tree's own file, the third file
  of a Tree beside `imagePath` and `themePath`. It hands out a path, not Nodes; nothing
  on the interface enumerates the Tree still (`application.md` 5.1, issue #121).
- `application.md` 4.1's grammar gains three lines (`/<tree-id>/tree.json`,
  `/schemas/elsa-tree-4.json`, and the findability routes of `ADR-118-crawler-access.md`
  and `ADR-118-llms-txt.md`), and 4.3 gains `schemas` to the reserved ids.
- The no-cookie and own-origin browser sweeps must include the new routes, or the
  guarantee of core document 8 is asserted about a shrinking share of the surface
  (issue #121).
- `scripts/collect-standalone.ts` gains `schemas/`, so the run command the README and
  section 1 document keeps working from the standalone folder alone. The Tree folders are
  not in that list and should not be: they are chosen at run time by `ELSA_TREES_DIR`,
  where the schema is a constant of the build.
- A Tree file is a few hundred kilobytes at the sizes in this repository. A crawler that
  fetches it daily costs a deploy nothing; `ETag` makes that cost zero after the first.
