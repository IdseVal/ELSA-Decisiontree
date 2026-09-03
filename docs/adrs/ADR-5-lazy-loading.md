# ADR-5-lazy-loading: the Tree loader is the one seam between disk and page; a request reads one Node file and the browser fetches only that Node's images

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #5 -- Architecture: freeze the application contracts
- Spec: `docs/specs/application.md`, section 5

## Context

Children of a Node are fetched only when that Node is opened; images are loaded only
for the Node on screen; nothing may load the whole Tree or all images on first visit;
"a thousand images" is a plausible size (core document 3.1, 9). The file format was
designed so that rendering Node `x` needs exactly one file (`ADR-4-file-layout.md`,
spec section 6), and validation is the one whole-Tree read, server-side, once
(`ADR-4-validity-rules.md`). The loader and the Node view are built in separate issues,
so the interface between "Tree data on disk" and "what the page renders" must be named
now.

## Decision

- **One module, `src/tree/loader.ts`, is the seam.** Its interface is:

  ```ts
  openTree(dir: string): Promise<Tree>        // reads and validates the folder once
  interface Tree {
    readonly id: string
    readonly manifest: Manifest
    getNode(id: string): Promise<Node | null> // reads exactly ONE Node file; null if unknown
    getTitle(id: string): LocalisedText | null // from the in-memory index; no file read
    imagePath(file: string): string | null     // absolute path inside this Tree's images/, or null
  }
  ```

  `openTree` rejects with `TreeInvalid`, carrying every violation, if any rule of
  `docs/specs/tree-format.md` section 7 fails. `getNode` returns **one Node, never
  the Tree**: a normalised object with its `id`, its `kind` derived from the file
  (`question` / `terminal` / `explanation`), and empty arrays where the file had no
  `sources`, `images` or `options`. Both `getNode` and `imagePath` check their
  argument against the id / file-name grammar before touching the file system and
  return `null` for anything that does not match.
- **Validation happens at server start.** `src/instrumentation.ts` (Next.js's startup
  hook) opens the Tree named by `ELSA_TREE`; on failure it prints every violation and
  exits non-zero, so a broken Tree never serves a page. The same function backs
  `npm run validate <dir>` for authors and CI. Validation builds the **title index**
  (`id -> localised title`) that the Trail uses, so the Trail costs no file reads.
- **What the server renders on the first request:** complete HTML for one Node -- text
  in the chosen language, Sources, Trail (titles from the index), Answers and Options
  as links, one `<img loading="lazy">` per Image of this Node (and of its Options),
  chrome, disclaimer -- plus the stylesheet and the small client bundle. No Node other
  than the one shown is read, and no image file is sent with the HTML.
- **What the browser fetches afterwards:** the image files this Node's HTML names,
  through `GET /images/<file>`, as the viewport reaches them. When the user follows a
  link, the browser requests that URL; the server reads that one Node file; the
  browser then fetches that Node's images. Whether the framework's `<Link>` prefetches
  the *page* of a visible link is the Node view issue's choice; prefetching images of
  Nodes not on screen is never allowed.
- **Image route:** `GET /images/<file>` asks `imagePath`; 404 if `null`; otherwise
  streams the file with a `Content-Type` from the extension and
  `Cache-Control: public, max-age=3600`. A thumbnail and its enlarged view are the
  same file; the thumbnail is an `<a href="/images/<file>">` around the `<img>`, so
  without JavaScript enlarging opens the file, and with it a client component shows
  it in place.
- The whole Tree may be cached in memory by the loader; that is an implementation
  choice invisible through the interface. What the *browser* receives is one Node.

## Alternatives rejected

- **A JSON API (`GET /api/node/<id>`) fetched by a client-side router.** The classic
  single-page shape: first paint is an empty shell, the Node arrives by a second
  request, and the Trail titles need N more. Server components give the same "one Node
  per navigation" with the content in the first response and no API to version.
- **Pre-loading the children of the current Node (one hop ahead).** Makes the next
  click instant at the cost of reading up to 2 + Options Node files per request and,
  if their images were included, breaking the "only this Node's images" rule. Node
  files are tiny and local; the click is fast enough without it.
- **Reading Trail Nodes' files for their titles.** Up to 49 small reads per request.
  Works, but the validator has already read every title; keeping them is a few
  kilobytes and makes a request cost exactly one file, which is the property the
  format was designed for.
- **Validating lazily on the first request.** A broken Tree would then produce a 500
  on the first visit instead of a failed start that systemd shows and a deploy script
  can catch.
- **Serving images from `public/` (copy or symlink at build).** Ties a Tree update to a
  build and leaks every file in the folder; a route that resolves only valid names
  inside the served Tree's `images/` folder is the same amount of code and cannot
  serve anything else.
- **Wider interface (`listNodes`, `getChildren`, `getTree`).** Every extra member is
  a way for a page to read more than one Node. The four members above are what the
  Node page, the image route, the Trail and the validator CLI need, and nothing else
  is a caller.

## Consequences

- The loader is a deep module: YAML parsing, every validity rule, path safety, the
  index and any caching sit behind five members. Its tests are the rules of
  `docs/specs/tree-format.md` section 7, exercised through `openTree` on fixture
  folders.
- The Node view receives a `Node` and renders it; it never sees a file path.
- A visitor who walks the whole Tree still downloads it one Node at a time; the
  server's memory holds the index, not the Tree's text.
