# ADR-118-sitemap-and-alternates: one address set per Node, emitted twice -- as the page's `hreflang` links and as the sitemap's `<url>` entries -- so the two cannot disagree

- Status: ACCEPTED (frozen) -- 2026-09-21
- Issue: #118 -- Architecture: freeze the JSON-only Tree format (`elsa-tree/4`)
- Spec: `docs/specs/application.md` 16.2, 16.3
- Amends: `docs/adrs/ADR-5-url-scheme.md` (`/sitemap.xml` joins the grammar of
  4.1), `ADR-5-repository-layout.md` (`src/findability/sitemap.ts` and
  `src/app/[lang]/sitemap.xml/route.ts`; `url.ts` gains a Node's address set and
  the absolute form of a link, `markdown.ts` the plain-text reduction and the
  155-character cut) and `ADR-5-testing-approach.md`
  (`tests/findability/sitemap.test.ts`, `findability.spec.ts`, and the grown rows
  on `url.test.ts` and `markdown.test.ts`). Also `ADR-11-public-base-url.md`: the
  address set is absolute, so `src/url.ts` -- which its decision 2 says does not
  know the variable exists -- takes the base as an argument and builds against it,
  and the canonical link becomes one entry of the set rather than a path

## Context

Every Node is a server-rendered page with real links, a canonical link and a content
language in `<html lang>`. What a search engine cannot work out from that is: which pages
exist (it must walk the whole Tree from the root to find out), and that
`/<tree>/start?lang=nl` is the Dutch twin of `/<tree>/start` rather than a second,
thinner page about the same thing. Untold, the two are duplicates competing with each
other, and the Dutch reader is served the English page.

The mechanism for the second is `hreflang`, and it has one property that decides the
shape of this decision: **it is declared in two places that must agree.** Google treats a
page's `hreflang` set and the sitemap's `xhtml:link` entries as one graph, and drops the
annotation entirely when the two disagree or when a page named as an alternate does not
name the first page back. Two generators, written a month apart, that each build a URL
out of a base and a Node id, will eventually disagree -- over a trailing slash, over the
`?lang` of the default language, over what a page reached with a Trail should say.

The application already has the rule that settles it. `application.md` 4.1: a Node's URL
is the page with an empty Trail, and every page carries `<link rel="canonical">` to it,
absolute when `ELSA_BASE_URL` is set. Alternates are the same thing, once per language.

## Decision

1. **One function answers, for a Node, the whole set of its public addresses**: the
   canonical URL per declared language, and which of them is the default. Both the head
   and the sitemap are rendered from its result. This is the decision; 2 to 7 are what it
   returns and how each side prints it.
2. **An address is the Node's canonical address** (`application.md` 4.1): the empty-Trail
   path `/<tree-id>/<node-id>`, with `?lang=<tag>` for every language but the Tree's
   default, made absolute against `ELSA_BASE_URL` -- or, when that is unset, against the
   request's origin (16). A page reached with a Trail lists the same alternates as the
   same page reached without one, because both are the same Node, which is what the
   canonical link already says.
3. **On every Node page**: one `<link rel="alternate" hreflang="<tag>">` per declared
   language, including the page's own -- the self-reference is required for the
   annotation to be read -- and one `hreflang="x-default"` pointing at the
   default-language address.
4. **In the sitemap**: one `<url>` per Node per language, each with the same
   `xhtml:link rel="alternate"` set including its own and `x-default`. So a Tree of `n`
   Nodes in 2 languages is `2n` `<url>` elements, each with 3 `xhtml:link` children.
   That is what the protocol asks for: the alternate set is repeated in every member of
   the group.
5. **A Tree that declares one language gets no alternates at all** -- none in the head,
   none in the sitemap. `hreflang` exists to relate translations; a group of one relates
   nothing, and an `x-default` alone is noise. This is the case the core document's
   section 9 cares about (a third-party Tree in one language must not break anything),
   and here "not breaking" means emitting nothing rather than emitting a degenerate
   group.
6. **`lastmod` is the Tree file's last-modified time, as a `YYYY-MM-DD` UTC date**, read
   once when the Tree is loaded at server start. Every `<url>` carries the same value,
   which is the truth: there is one file, so no Node's text can change without it
   changing. A deployment whose build pipeline does not preserve timestamps sets
   `ELSA_TREE_LASTMOD` to an ISO date and that wins; `docs/deployment.md` says to copy
   the Tree folder with the timestamp preserved (`cp -p`, `rsync -t`, a bind mount), and
   says why. When neither is available -- the variable unset and the file's time in the
   future or unreadable -- **the `<url>` carries no `lastmod`**: the element is optional
   in the protocol, and a search engine that catches a site lying about it stops reading
   it for that site altogether.
7. **What the sitemap does not list**: `/images/<file>` and `/theme/<file>` (assets, not
   pages), `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/<tree>/tree.json` and the schema
   (not pages either), the 404 page, and every address that carries a Trail. The sitemap
   holds exactly the set of canonical Node addresses, which is the set the head's
   alternates name -- the same sentence as decision 1, checked from the other side.
8. **The page's description meta tag comes from the Node's description**, by a stated,
   deterministic reduction. **It is written out as four numbered steps in
   `application.md` 16.3 and is not repeated here**: the counted text; the Markdown
   markers that are punctuation dropped and the blocks joined; the 155-character test;
   and the cut. One copy means one numbering, so "step 4" names the same step wherever
   it is cited -- `ADR-118-crawler-access.md`'s reasoning, applied to a numbered list.

   What this decision settles is that the reduction exists, that it is
   **deterministic** -- the same description gives the same meta tag on every build --
   and that it deliberately does not match 3.8's counted text: 3.8 counts the Markdown
   markers because they take a reader's space on screen, and a meta description shows
   nobody an asterisk. The cut is stated although it cannot fire for a conforming Tree
   -- a Node description is at most 150 counted characters since #102 -- because a
   reduction that is not total is a reduction with a crash in it, and because the limit
   it guards is the layout's and has already moved twice.
9. **`<meta name="description">` is on every Node page, in the page's language.** The
   Tree's own description is the Dataset's (`ADR-118-json-ld.md`), not every page's.
10. **The sitemap is generated from the loaded Tree at request time**, never a file in
    the repository, and it is not paginated: the protocol's limit is 50,000 URLs or 50 MB
    uncompressed, and a Tree would need 25,000 Nodes in two languages to reach it against
    a thousand the owner called a plausible size. A sitemap index is reserved, named in
    16.2 and not built.

## Alternatives rejected

- **Two generators, one for the head and one for the sitemap, each building URLs from
  `ELSA_BASE_URL` and an id.** The obvious way, and the way the two drift apart. The
  failure is silent: the annotation is simply ignored, so nothing breaks, nothing logs,
  and the Dutch pages quietly do not rank.
- **`lastmod` from the manifest** -- a date the author writes. Rejected because the
  content model of `elsa-tree/3` is kept as it stands in this round (the issue's own
  constraint), and because an authored date is a second thing to remember to change: the
  first time it is forgotten it is a false statement, where a file time is at worst a
  coarse one.
- **`lastmod` per Node, from a per-Node date.** Same objection, and there is no per-Node
  fact to read: one file, one modification.
- **Omitting `lastmod` altogether.** Simpler and defensible, and it throws away the one
  signal that tells a crawler a re-crawl is worth its bandwidth. Decision 6 keeps it where
  it can be trusted and drops it where it cannot, which is the same trade made honestly.
- **Listing Trail-carrying addresses in the sitemap** so that a shared link is indexed.
  A Tree of 71 Nodes has an unbounded number of Trails; the canonical link already folds
  every one of them onto the Node's own page, which is exactly what should be indexed.
- **A static `sitemap.xml` generated at build time.** It would have to be regenerated
  whenever the Tree file changed, which is the thing a deployment most easily forgets,
  and it would need the public origin baked in at build time rather than read at run time.
- **Next.js's `sitemap.ts` and `robots.ts` file conventions.** They would do most of this
  for less code. Rejected for `sitemap.xml` because the convention does not emit
  `xhtml:link` alternate sets in the form this decision needs, and taking it for one file
  and hand-rolling the other splits one contract across two mechanisms. It is also a
  framework feature where section 1 prefers plain routes.
- **`<meta name="keywords">`.** Read by nothing since the 2000s, and there is no field in
  the Tree that would supply it honestly.

## Consequences

- `application.md` 4.1 gains `/sitemap.xml` to its grammar and the head of a Node page
  gains the alternate links and the description; 4.3's reserved-word table is untouched,
  because `sitemap.xml` cannot be a Tree id (the dot).
- A browser test can assert the agreement directly and should: for every Node in every
  language, the page's `hreflang` set equals the sitemap's `xhtml:link` set for that
  Node's `<url>`, and the sitemap's `<url>` count equals the loader's Node count times
  the number of declared languages (issue #120).
- `ELSA_TREE_LASTMOD` is the second optional deployment variable, read in one place and
  refused when it is not an ISO date, as `ELSA_BASE_URL` is refused when malformed
  (ADR-11).
- The fixture `tests/fixtures/single-language` becomes the test of decision 5: its pages
  carry no `alternate` link and its sitemap carries no `xhtml:link`.
