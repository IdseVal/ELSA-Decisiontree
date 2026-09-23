# ADR-132-hidden-trees-and-findability: a hidden or unknown Tree is the same 404 on every public route; one sitemap, one `robots.txt` and one `llms.txt` over every served Tree; one `Dataset` per Tree on its own root page; `lastmod` per Tree from the store

- Status: ACCEPTED (frozen) -- 2026-09-23; restates core document 9's hidden-Tree bullet as a contract
- Issue: #132 -- Architecture: freeze the store for the editor round
- Spec: `docs/specs/application.md` section 23 (new); 4.3, 15 and 16 amended
- Amends: `docs/adrs/ADR-118-crawler-access.md`, `ADR-118-sitemap-and-alternates.md`,
  `ADR-118-json-ld.md`, `ADR-118-llms-txt.md`, `ADR-118-dataset-endpoint.md` (each written
  for "the served Tree"; each now reads over the set of served Trees, as below)
- Depends on: `ADR-132-many-trees-per-deployment.md`, `ADR-132-draft-and-publish.md`

## Context

Sections 15 and 16 of `application.md` were written for one Tree: one `Dataset`, a sitemap
of one Tree's Nodes, an `llms.txt` whose H1 is that Tree's title. With many Trees each
document has to say which, and with a **hidden** Tree -- one a creator has not published,
or has unpublished -- every one of them must say nothing at all (core document 9: "not on
the overview, not at a Node URL, not in the sitemap, the dataset endpoint, the JSON-LD or
`llms.txt`, and none of its images or theme files").

## Decision

1. **The set every public route works from is `store.publishedIds()` and
   `store.published(id)`**: the Trees whose `tree.json` exists and validated in full at
   start or at their last publish (`ADR-132-many-trees-per-deployment.md`, decisions 3 and
   5). A hidden Tree, a published-but-not-servable Tree, an id that was never a Tree and a
   reserved word are **one case** to every public route: `published(id)` is `null`, and
   the answer is the 404 of 4.3 -- the same page, the same status, the same headers, no
   difference a caller can measure. Nothing on a public route reads a draft, a `meta.json`
   or `accounts.json`; the store's public interface has no member that could return one.

2. **What that covers, route by route** (4.1): the Node page and both redirects;
   `/<tree-id>/tree.json`; `/<tree-id>/images/<file>` and `/<tree-id>/theme/<file>`; and
   absence from the overview, `sitemap.xml`, `llms.txt` and every JSON-LD graph. Turning
   the toggle off makes all of it true in the same call (`ADR-132-draft-and-publish.md`,
   decision 6); the hour of `Cache-Control` on images, the dataset and the documents is
   the one delay, and it is the same hour a Tree update always had.

3. **The overview, `/`**, lists every served Tree: its title in the page's language when
   the Tree declares it, else in the Tree's default language with a `lang` attribute on
   that tile; the Tree's logo when its Theme names one; a link to its root Node in the
   page's language, or the Tree's default. Order: by `id`, so that two requests agree and
   no Tree can buy the top by renaming (#133 may choose the display order within that
   contract). The page's own languages are the chrome's, `en` and `nl`: it carries a
   canonical link, `hreflang` for both and `x-default`, and a `<meta name="description">`
   from a chrome string -- no Tree content in it beyond the titles on the tiles. It sets
   no cookie and emits no JSON-LD in this round (an `ItemList` of `Dataset`s is reserved,
   not built: nothing asked for it and a wrong `@type` here would be a misstatement about
   every Tree at once).

4. **`robots.txt` is one file and is unchanged.** Nothing about it names a Tree; nothing is
   disallowed, `/admin` included (`ADR-132-accounts-and-sessions.md`, decision 12, uses the
   header instead). 16.1 and its test stand as written.

5. **`sitemap.xml` is one document over every served Tree.** The overview's two addresses
   first (`/` and `/?lang=nl`, with their alternates), then the Trees in `id` order, each
   Tree's Nodes in file order, each `<url>` as 16.2 gives it. **`lastmod` is per Tree**:
   the modification time of that Tree's `tree.json`, which the store wrote at its last
   publish, so it is right by construction and the copy-pipeline caveat of 16.2 and
   `ELSA_TREE_LASTMOD` are gone. A Tree whose file time cannot be read still gets no
   `lastmod` rather than a wrong one. The 50,000-URL limit is now a sum over Trees; the
   generator still fails loudly rather than truncating, and a sitemap index is the
   reserved answer for the day it is reached -- a day that is nearer with many Trees and
   is still not this round's.

6. **`llms.txt` is one document, the deployment's rather than one Tree's.** The H1 becomes
   a chrome string in English (`ELSA decision trees`), the blockquote one chrome sentence
   saying what this site is; then a new first section, `## The Trees`, with one entry per
   served Tree in `id` order -- `- [<title in its default language>](<root URL>): <its
   description reduced by 16.3 steps 1 and 2, or its root Node's>` -- and the sections of
   16.5 follow with one line per Tree where they named one: `## The datasets` lists every
   Tree's `tree.json` and the one schema; `## Walking a Tree` gives the overview URL, the
   sitemap and the grammar line; `## Languages` lists each Tree's declared languages with
   its default marked; `## Licence` is unchanged. Still a signpost: no Node's text anywhere
   in it, and no `llms-full.txt`.

7. **The JSON-LD is per Tree and per page, unchanged in shape.** The `Dataset` is emitted on
   each Tree's own root page with its own `@id` `<base>/<tree-id>#dataset`; every other
   page of that Tree refers to that `@id`; no page of one Tree names another Tree's
   `Dataset`. `version` is the manifest's `metadata.version`, which the store now sets to
   the publish count (`ADR-132-draft-and-publish.md`, decision 8), so it changes exactly
   when the dataset does.

8. **The dataset endpoint streams the store's `tree.json`** -- `Tree.filePath` now points
   into `$ELSA_DATA_DIR/trees/<id>/` -- so 15.3's byte-identity claim is asserted against
   that file, and the licence header, `ETag`, CORS and no-cookie rows of 15.2 are unchanged.
   The `Access-Control-Allow-Origin: *` of 15.2 stays safe for the reason 15.2 gives, now
   kept true by `Path=/admin` and the sweep (`ADR-132-accounts-and-sessions.md`, decision 8).

9. **The image and theme routes serve the published copy's references** and answer 404 for
   everything else -- a draft's picture, a stray file, a hidden Tree's logo -- by one rule
   in the loader (`ADR-132-many-trees-per-deployment.md`, decision 9).

## Alternatives rejected

- **A distinct answer for a hidden Tree** (410, or a "not published" page). It would tell
  anyone which ids exist unpublished, one guess at a time, and a creator's unfinished work
  would be the thing announced. The 404 of an unknown id is the only honest answer that
  says nothing.
- **Redirecting `/` to the only Tree when exactly one is served.** `ADR-5-tree-selection.md`
  rejected the shape -- a deployment that changes behaviour when a folder is added -- and
  it holds: the overview of one tile is the owner's front page.
- **One sitemap per Tree with a sitemap index.** The protocol allows it and a crawler
  handles it; but the index is the mechanism reserved for the size limit, and spending it
  on structure would leave nothing for the day the limit arrives. One document, ordered,
  is also what a reader can check with one fetch.
- **A `lastmod` for the whole sitemap from the newest Tree.** Every page of an unchanged
  Tree would claim to have changed when another Tree published; that is the lie 16.2's
  last sentence warns about.
- **`llms.txt` keeping a Tree's title as its H1**, choosing the first or the newest Tree.
  Whichever rule, the file would describe one Tree as the site and list the others under
  it; the deployment is the site now.
- **A `CollectionPage` or `ItemList` on the overview.** Reserved; see decision 3.
- **`Disallow: /admin` in `robots.txt`.** See `ADR-132-accounts-and-sessions.md`.

## Consequences

- Issue #134 amends 15.1, 16.2, 16.3 (the overview's head) and 16.5 in `application.md`
  with the text above, adds the chrome strings the overview and `llms.txt` need, and
  extends `tests/findability/sitemap.test.ts` and `llms.test.ts` with a two-Tree data
  directory where one Tree is hidden: the hidden Tree's id must appear **nowhere** in
  either document, and the overview must not list it. `findability.spec.ts` asserts the
  same on a served deployment, plus the 404 rows of 23 on a hidden Tree's every route.
- The `Dataset`'s `version` gains a test in `jsonld.test.ts` that it equals the publish
  count after two publishes (#136 or #143).
- `src/findability/` takes the list of Trees where it took one; the routes hand it
  `store.publishedIds().map(store.published)`. The module still reads no file and knows
  no store.
