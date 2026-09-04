# ADR-5-url-scheme: the path is the Trail -- `/<tree-id>/<visited ids...>/<current id>`, language as `?lang=`

- Status: ACCEPTED (frozen) -- 2026-09-03
- Issue: #5 -- Architecture: freeze the application contracts
- Spec: `docs/specs/application.md`, section 4
- Amended 2026-09-04 by `ADR-19-content-language-in-the-route.md`: the public grammar
  below is unchanged, but a `lang` value that is not a well-formed language tag now
  answers 404, and inside the server the query is restated as a `[lang]` path segment so
  that the root layout can set `<html lang>` (application.md 4.4). The rejection of a
  *public* language prefix, below, stands.

## Context

Every Node is reachable by URL. A share link carries both the destination Node and the
Trail taken to reach it, inside the link, because nothing is stored server-side (core
document 3.2, 4). Clicking a Trail entry jumps back to that Node and discards the rest
of the Trail (10.17). The language is the user's choice and must survive navigation
without cookies (8). Ids are `[a-z0-9-]`, at most 64 characters, chosen so they can be
used verbatim in URLs (`ADR-4-identifiers-and-cross-links.md`). One deployment serves
one Tree, and the Tree id is part of the URL (`ADR-5-tree-selection.md`).

## Decision

- **Node page:** `/<tree-id>/<id-1>/<id-2>/.../<id-n>`, `n >= 1`. The last id is the
  Node shown; the ids before it are the Trail, in the order visited. The URL of a Node
  on its own is `/<tree-id>/<node-id>` (an empty Trail). **The page's own URL is the
  share link**; there is nothing to encode.
- **Language:** the query parameter `lang=<tag>`, one of the Tree's declared languages.
  Absent means the Tree's default language; the app omits it for the default language
  so those links stay short. A value the Tree does not declare is ignored, not an
  error.
- **Images:** `/images/<file>`, where `<file>` is an image file name of the served Tree
  (`ADR-4-image-reference.md` grammar). The top-level segment `images` is therefore a
  **reserved word**: a Tree with that id refuses to start.
- **Redirects:** `/` and `/<tree-id>` redirect (307) to `/<tree-id>/<root-id>`,
  keeping `lang` if present. No trailing slashes; the framework redirects them away.
- **Limits and errors:** at most **50 ids** in the path (49 Trail entries plus the
  current Node). When the app would build a longer link it drops the oldest Trail
  entries. A request is answered **404** -- a small page in the chrome language with a
  link to the start -- when the Tree id is not the served one, when any id is malformed
  or is not a Node of the Tree, when the path has more than 50 ids, or when an image
  name is malformed or not present. The Trail is **not** checked for adjacency (that
  each id is linked from the previous one): a Trail is a record of visits, not a proof.
- **Canonical:** every Node page carries `<link rel="canonical">` pointing at the
  Trail-less URL of the same Node in the same language, so search engines treat the
  many Trail variants as one page.
- The grammar lives in **one module, `src/url.ts`** (parse and build); nothing else
  in the app concatenates path segments.

Worked examples (host is a placeholder):

```
Node URL      https://example.org/ai-act-agrifood/prohibited-practices
Share link    https://example.org/ai-act-agrifood/start/prohibited-practices/social-scoring?lang=nl
```

The share link shows the Node `social-scoring` in Dutch, with a Trail of two entries,
`start` and `prohibited-practices`. Clicking the Trail entry `prohibited-practices`
goes to `/ai-act-agrifood/start/prohibited-practices?lang=nl`.

## Alternatives rejected

- **Trail in a query parameter (`/ai-act-agrifood/social-scoring?trail=start.prohibited-practices`).**
  Works, but splits one fact (the path taken) across two places, needs a separator and
  an encoding rule, and the address bar is no longer obviously the share link. With the
  Trail in the path, "go back to a Trail entry" is truncating the path, and the URL
  reads as what it is.
- **Trail encoded (base64, compressed, hashed) or stored server-side behind a short
  code.** Storing is ruled out by the core document. Encoding makes links opaque for a
  gain of a few characters; ids were designed to be readable in URLs.
- **Language as a path prefix (`/nl/ai-act-agrifood/...`).** The common i18n layout,
  but it puts a language in front of every URL including the default one, and Next.js
  would need a third dynamic segment. A query parameter that is absent for the default
  language keeps the common case short, and the share link still carries it.
- **Language in a cookie or from `Accept-Language`.** No cookies (core document 8);
  and a shared link must reproduce the sender's screen, so the language must be in it.
- **Redirecting unknown ids to the root instead of 404.** Hides broken links from the
  person who made them and lies to crawlers. A 404 with a link to the start is honest
  and just as easy to recover from.
- **Validating adjacency of the Trail.** Would need an edge index in memory and would
  break the day Cross-links or hand-edited "compare these two" links appear. Nothing
  is gained: the page renders correctly whatever the Trail says.
- **Unlimited Trail length.** 64-character ids times an unbounded Trail can exceed
  proxy and browser header limits (nginx defaults to 8 kB). Fifty ids is at most
  about 3.3 kB and far more steps than any Tree walk needs.

## Consequences

- The Trail needs the titles of up to 49 other Nodes. They come from the loader's
  in-memory title index built during validation (`ADR-5-lazy-loading.md`), so a
  request still reads exactly one Node file.
- The URL is the whole application state; the back button, bookmarks and share links
  all behave the same way for free.
- A later multi-Tree deployment or Cross-links reuse the scheme unchanged.
