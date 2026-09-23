# ADR-132-editor-api: route handlers under `/admin/api`; a write is one field or one structural operation on one Node; the response is the Node as stored with its advisory violations; last write wins per field; uploads are sniffed, renamed and capped

- Status: ACCEPTED (frozen) -- 2026-09-23
- Issue: #132 -- Architecture: freeze the store for the editor round
- Spec: `docs/specs/application.md` section 22 (new); 4.1 and 6 amended
- Amends: `docs/adrs/ADR-5-url-scheme.md` (the `/admin` prefix joins the grammar as one
  reserved word), `ADR-5-repository-layout.md` (`src/app/[lang]/admin/` and `src/store/`),
  `ADR-4-image-reference.md` (the file-name grammar of 3.5 is now applied server-side to an
  uploaded name)
- Depends on: `ADR-132-draft-and-publish.md`, `ADR-132-accounts-and-sessions.md`,
  `ADR-132-roles-and-permissions.md`

## Context

The editor of #133 and #138 to #142 "looks exactly like the final datastructure" with every
field editable in place and saved automatically (core document 3.4). Between it and the
store something has to carry a write and answer it, and the answer has to be good enough
for the editor to show a length problem at the field it belongs to, to show two
collaborators each other's work, and to refuse a bad file name before it reaches a disk.
Next.js offers two shapes: Server Actions, and route handlers.

## Decision

1. **Route handlers, under one prefix, `/admin/api/`.** Every request and response is JSON
   over plain HTTP with a documented path, method and status, so it can be exercised with
   `curl`, with Playwright's `request` fixture and with a unit test that calls the handler;
   the CSRF check is this project's (`ADR-132-accounts-and-sessions.md`, decision 9) on one
   prefix, and the session cookie's `Path=/admin` covers screens and API with one attribute.
   The prefix is `/admin/api/` and not `/api/admin/` for that one reason. `admin` is the one
   reserved word it costs (`application.md` 4.3). Not Server Actions: their wire format is
   the framework's, undocumented and versioned with it, and a contract the Verifier can
   only check through the framework's own client is not a contract this project can hold.

2. **The routes.** Every one requires a session except `login`; every writing one passes
   the CSRF check and `permit` (`ADR-132-roles-and-permissions.md`); every one answers
   `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.

   | Method and path | Does | Answers |
   |---|---|---|
   | `POST /admin/api/login` | `{ login, password }` | 204 and the cookie; 401; 429 |
   | `POST /admin/api/logout` | ends the session | 204 and the clearing cookie |
   | `GET /admin/api/me` | the caller | `{ id, name, login, administrator }` |
   | `GET /admin/api/accounts` | every active account, for an invitation | `[{ id, name, login }]` |
   | `POST /admin/api/accounts` | administrator: `{ name, login, password }` | 201 the account; 422 |
   | `PATCH /admin/api/accounts/<id>` | administrator: `name`, `active`, `password`; self: `name`, `password` with `currentPassword` | 200; 403; 422 |
   | `GET /admin/api/trees` | the caller's Trees (administrator: every Tree), each with `meta`, `published`, `servable`, the advisory count and, when not servable, the violations | `[...]` |
   | `POST /admin/api/trees` | `{ id, languages, title }`: creates the folder, `meta.json`, and a draft with one root Node `start` | 201 the Tree's entry; 409 id taken; 422 reserved or malformed |
   | `GET /admin/api/trees/<t>` | `meta`, the manifest, `published`, `servable`, and the Tree's full violation lists (advisory; and blocking, only for an uneditable Tree) | 200 |
   | `PATCH /admin/api/trees/<t>` | one manifest field: `{ path, value }` (`title.<lang>`, `description.<lang>`, `root`) | the write response below |
   | `DELETE /admin/api/trees/<t>` | creator or administrator, hidden Trees only | 204; 409 while published |
   | `PUT /admin/api/trees/<t>/published` | `{ published: true }` publishes; `false` hides | 200 `{ published, publishedAt }`; 409 `{ violations }` |
   | `PUT /admin/api/trees/<t>/creator` | `{ accountId }`: hand over | 200 `meta` |
   | `PUT` / `DELETE /admin/api/trees/<t>/collaborators/<accountId>` | add; remove | 200 `meta`; 422 |
   | `GET /admin/api/trees/<t>/nodes/<n>` | one `DraftNode`, its advisory violations, the titles its Links need | 200; 404 |
   | `POST /admin/api/trees/<t>/nodes` | `{ from: { node, link: 'yes' \| 'no' \| 'option' }, title? }`: creates a Node **and** the Link to it in one write; `{ from: { node, link: 'end', outcome } }` gives the Node a terminal instead | 201 the write response for the new Node, and the parent's as `also` |
   | `PATCH /admin/api/trees/<t>/nodes/<n>` | one field: `{ path, value }`; or one operation: `{ op, ... }` | the write response |
   | `DELETE /admin/api/trees/<t>/nodes/<n>` | removes the Node and every Link to it; the root cannot be deleted | 204 and `also` for every Node that lost a Link; 409 on the root |
   | `POST /admin/api/trees/<t>/images` | `multipart/form-data`, one file | 201 `{ file, width, height }`; 413; 415; 422 |
   | `DELETE /admin/api/trees/<t>/images/<file>` | a file no Node of the draft or the published copy names | 204; 409 while referenced |
   | `GET /admin/api/trees/<t>/images/<file>` | a draft's picture, to a reader with a role on the Tree | the file with the headers of 5.3; 403; 404 |

   The routes for the overview and the editor's pages themselves are `/admin` and
   `/admin/trees/<t>/...`, #133's, and render inside the `[lang]` layout like every page.

3. **The unit of a write is one field or one operation on one Node.** A **field** is a key
   path the format defines -- `title.nl`, `description.en`, `sources[1].label.en`,
   `images[0].credit`, `explainers[2].text.nl`, `options[0].title.en`, `terminal.outcome`
   -- checked against the key set of `tree-format.md` 4 and 5 before anything is applied
   (a path the format does not define is 422 with V-KEYS). An **operation** is one of a
   closed set on one Node: `add-source`, `remove-source`, `add-image` (naming an uploaded
   file), `remove-image`, `move-image`, `add-explainer`, `remove-explainer`, `add-option`
   (naming an existing explanation Node or asking for a new one), `remove-option`,
   `set-answer` (`yes` or `no` to an existing Node), `remove-answer`, `set-terminal`,
   `remove-terminal`. The manifest takes fields only. A request body is at most **64 kB**
   and any string in it at most **2,000 code points** (the largest limit of 5.7 is 600);
   above either, 413 or 422, nothing stored.

4. **The write response is the truth, and it is the same shape for every write:**

   ```ts
   interface WriteResponse {
     revision: number            // the Tree's, after this write; monotonic per Tree
     node: DraftNode | null      // the Node as stored, or null after a delete
     manifest?: Manifest         // when the write was to the manifest
     violations: Violation[]     // this Node's (or the manifest's) advisory list, after the write
     tree: {
       advisory: number          // the whole draft's advisory count: what the Publish toggle shows
       published: boolean
       publicCopyCurrent: boolean   // false while an invalid draft leaves the last valid copy in place (ADR-132-draft-and-publish 6)
     }
     also?: WriteResponse[]      // other Nodes this write changed (a created Node's parent; a deleted Node's referrers)
   }
   ```

   **A write that violates 5.7 -- or any advisory rule -- is stored and answers 200** with
   the violation in `violations`, each carrying `keyPath` (`description.nl`), `rule`
   (`V-LENGTH`) and the message that names the actual and the maximum, which is what the
   editor puts at the field. **A write that would break a blocking rule answers 422** with
   the same `Violation` shape and stores nothing. A write to a Tree the caller has no role
   on is 403; to an unknown Tree or Node, 404; to an uneditable Tree
   (`ADR-132-draft-and-publish.md`, decision 4), 409.

5. **Concurrency between collaborators: last write wins, per field, and the response shows
   the other's work.** Writes to one Tree are serialised by the store's queue, so two
   writes never interleave; a field write replaces that field and no other, so two people
   in two fields of one Node never touch each other's text; two people in **one** field
   get the later value, and each response carries the Node as stored, so the editor
   repaints every field it is not focused on and shows the newer text where it lost.
   `revision` lets the editor tell "changed under me" from "my own write" (the response to
   its write carries the revision it produced); what it shows is #133's. **No `If-Match`
   and no 409 on a stale write**: an autosave that fails on a race would have to be retried
   or dropped, and both lose text; a field that repaints does not.

6. **Structural writes are one operation, applied whole.** Creating a Node from a parent
   writes the Node and the parent's Link in one store write, so no draft ever holds a
   Link to nothing; deleting a Node removes every Answer and Option that names it in the
   same write; the root Node cannot be deleted, and `root` in the manifest may be pointed
   at another question Node or Terminal instead. A new Node's id is the server's:
   `n-<6 lowercase base32 characters>` unless the request names one that is free and
   valid; ids are stable for the Tree's life, because they are in every URL.

7. **Image upload.** One file per request, `multipart/form-data`, refused above **5 MiB**
   (413) before the body is read past that point. The type is taken from the **first
   bytes**, never from the name or the declared `Content-Type`: PNG, JPEG, GIF and WebP
   are accepted; anything else, **SVG included**, is 415 -- an SVG is a document that can
   carry script, the public route's `sandbox` header makes it inert only where that route
   serves it, and the editor has no use for a vector picture the format's raster types do
   not cover. Width and height are read from the same bytes and returned, for the
   `<img width height>` the Carousel wants. **The file name is the server's**: the client's
   name is lowered, every run of characters outside `[a-z0-9]` becomes one `-`, leading
   and trailing separators go, the stem is cut to 100 characters, and the result is
   `<stem>-<first 8 hex of the content's SHA-256>.<extension of the sniffed type>` --
   which matches 3.5 by construction and is then **checked against 3.5 anyway** before
   the write, and the resolved path is required to be inside the Tree's `images/` after
   `path.resolve`, the two-checks rule of 5.5. The same bytes uploaded twice give the same
   name and one file. The file is written to `$ELSA_DATA_DIR/trees/<t>/images/` through
   the atomic writer; attaching it to a Node is the separate `add-image` operation, so an
   upload knows nothing about Nodes. Removing a file is refused while the draft or the
   published copy names it; after a publish, the store deletes files neither names.

8. **A draft's images are served to a logged-in reader with a role on the Tree only**, at
   `GET /admin/api/trees/<t>/images/<file>`, with the headers of 5.3 plus `no-store`.
   The public route `/<tree-id>/images/<file>` serves what the **published** copy
   references and nothing else (`ADR-132-many-trees-per-deployment.md`, decision 9), so a
   picture uploaded to a draft is not public until a publish carries a Node that names it.
   The editor's Bubble therefore takes its image URL builder as a parameter: the public
   page passes `imageHref`, the editor passes the admin one; #133 decides the mechanism
   inside the reuse rule.

## Alternatives rejected

- **Server Actions.** Less code per write and a request format the project does not own;
  the CSRF protection would be the framework's, the test would need the framework's client,
  and `curl <url>` -- the check every other contract of this project offers -- would show
  nothing readable.
- **`/api/admin/` as the prefix.** The cookie's `Path=/admin` would not reach it; a second
  cookie or `Path=/` would put the session on the public routes' path. One prefix, one
  `Path`.
- **A whole Node as the unit of a write.** Two collaborators in two fields of one Node
  would overwrite each other on every autosave, and the response could not say which field
  was wrong without the editor diffing. A field is what autosave saves.
- **A version per Node with `If-Match` and 409.** See decision 5: correct and hostile to an
  autosave, which has no user to ask.
- **Reject a write that breaks 5.7.** See `ADR-132-draft-and-publish.md`: the draft holds
  the text and reports; Publish is the wall.
- **Accept SVG uploads.** See decision 7.
- **Trust the client's file name after checking it against 3.5.** The grammar would be met
  and the name would still be the client's choice -- `logo.png` from two collaborators,
  the second overwriting the first. The hash suffix ends that, and the sniffed extension
  ends a `.png` that is a GIF.
- **Upload and attach in one request.** Simpler for one call and it ties the upload route
  to a Node's `images` list and its V-COUNT; two calls keep the upload dumb.
- **A single `PUT` of the whole draft**, the editor holding the Tree and writing it back.
  A thousand-Node Tree per keystroke, and every collaborator overwriting every other.

## Consequences

- `src/app/[lang]/admin/api/` holds the route files, one per row of decision 2, each thin:
  `authenticated -> permit -> store -> JSON`. `src/store/drafts.ts` holds the writes;
  `src/store/images.ts` the sniffing, naming and file write. Issue #136 builds the store
  side and the routes; #138 to #142 call them; #140 builds the upload's screen.
- `application.md` 4.1 gains the `/admin` line and 4.3 the reserved word and its 404 row
  (`/admin/...` is never a Tree). `src/url.ts` gains `adminImageHref(treeId, file)` and
  nothing else about `/admin`: the admin paths are the route files' and are not built by
  `url.ts`, which stays the public grammar's.
- `tests/store/drafts.test.ts` (#136) asserts: every field path of decision 3 is accepted
  and every other path refused; every operation; the cascade on delete; the root cannot be
  deleted; an advisory write is stored and reported; a blocking write is refused and not
  stored; the whole-draft validation after a write publishes or holds the public copy as
  decision 6 of `ADR-132-draft-and-publish.md` says. `tests/store/images.test.ts` asserts
  the sniffing (a PNG named `.jpg`, a text file named `.png`, an SVG), the name grammar on
  hostile names (`../x.png`, spaces, upper case, 300 characters, a name with `%2F`), the
  size cap, and that the same bytes yield one file.
- `tests/browser/admin.spec.ts` (#143, the walk) exercises the API through the screens; a
  request-level spec (`tests/browser/admin-api.spec.ts`, #136) asserts 401 without a
  session, 403 on a foreign Tree, 403 on a write without `Origin`/`Sec-Fetch-Site`, 415 on
  an SVG, and that no response under `/admin` is cacheable.
