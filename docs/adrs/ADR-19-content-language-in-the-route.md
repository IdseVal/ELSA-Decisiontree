# ADR-19-content-language-in-the-route: a rewrite copies `?lang` into a `[lang]` route segment, so the root layout can set `<html lang>`

- Status: ACCEPTED (frozen) -- 2026-09-04
- Issue: #19 -- Decide what `<html lang>` says
- Spec: `docs/specs/application.md`, sections 3.1, 4.1, 4.3, 4.4, 6, 7
- Amends: `ADR-5-repository-layout.md` (the shape of `src/app/`), `ADR-5-url-scheme.md`
  (how `parseUrl` is reached; its public grammar and every answer of its error table are
  unchanged) and `ADR-5-testing-approach.md` (one test file added)

## Context

`docs/specs/application.md` 3.1 says, frozen since 2026-09-03:

> `<html lang>` is the content language; chrome elements in another language carry their
> own `lang` attribute.

The content language is carried by the query string (`?lang=nl`, 4.1). In the Next.js App
Router only the owner of the `<html>` element -- the root layout -- can set `lang`, and a
layout is **not** given `searchParams`: Next.js passes `params` to a layout, and `params`
plus `searchParams` to a page. A layout may read `headers()`, but no browser sends a header
carrying the query. Nothing inside the root layout can therefore know which language the
page below it is about to render.

Measured on the Node view branch (`DeKnecht/issue-7`, PR #17), Next.js 16.3.4:

```
GET /ai-act-example/start?lang=nl   ->   <html lang="en"> ... <article class="node" lang="nl">
```

Every element that carries text already marks its own language, so no visible text is
announced in the wrong one. What is wrong is the document itself: `<html lang="en">` is a
false statement about a Dutch page, and the `<title>` produced by `generateMetadata` is
Dutch content sitting in `<head>`, where the only `lang` in scope is `<html>`'s and there
is no element to mark. Assistive technology announces the tab and the page in the wrong
voice, and so does any other consumer that trusts the document language.

The issue offered three ways out. The owner chose to put the language in the path (comment
on #19, 2026-09-04). This ADR records that decision, the exact mechanism, and what it
costs -- because it changes the module layout frozen in section 6, and nothing else about
what a reader may ask for or what they get back.

## Decision

**1. The public URL scheme of 4.1 does not change.** `?lang=<tag>` remains the only public
carrier of the content language, absent for the default language. Every share link, every
canonical link and every link the application emits is exactly what it was.
`ADR-5-url-scheme.md`'s rejection of a *public* language prefix (`/nl/<tree-id>/...`)
stands: it would lengthen every URL and invalidate every link already shared.

**2. A rewrite restates the query as a leading path segment, before the file system.**
`next.config.ts` gains two `beforeFiles` rewrite rules that partition every request between
them. Both test the same grammar -- 4.1's well-formed language tag, written once as a
constant. A request whose `lang` query `has` a well-formed value is rewritten to
`/<that tag>/:path*`, so the root layout gets it as a param; a request `missing` one -- no
`lang`, an empty one, or a value that is not a tag -- is rewritten to `/_/:path*`.

The rules as frozen, with their exact `source`, `has`, `missing` and `destination`, are in
`docs/specs/application.md` 4.4. They are written out in that one place, not here as well,
so that the contract and this record cannot drift apart.

Because `missing` holds exactly when `has` does not, over the same grammar, the pair is
**exhaustive and mutually exclusive**: every request is rewritten exactly once, whether or
not `beforeFiles` stops at the first rule it matches -- behaviour the documentation does
not promise either way, and which the experiment below found does *not* stop at the first
match. Nothing reaches the file system with its public path.

A rewrite is internal: the address bar, the share link and the canonical link keep the
query. This is plain Next.js configuration on the Node.js runtime -- no edge runtime, no
hosting-vendor feature -- so section 1's vendor-neutrality row is untouched.

**3. Every page and route moves under `src/app/[lang]/`.** `src/app/[lang]/layout.tsx`
becomes the root layout: it owns `<html>`, reads `params.lang`, resolves it and sets
`<html lang>`. There is no `src/app/layout.tsx`. The image route moves with the rest, to
`src/app/[lang]/images/[file]/route.ts`, so that no rewrite has to carve out an exception
for it; the route ignores the segment, and the public image URL stays `/images/<file>`.

**4. `_` is the segment for "no language asked for".** It cannot collide with anything: an
id is `[a-z0-9-]` (`ADR-4-identifiers-and-cross-links.md`), so no Tree and no Node can be
called `_`, and `_` is not a well-formed language tag, so the second rule is the only way
it can ever appear. It needs no special case: the ordinary resolution rule of 4.3 -- a
language the Tree does not declare means the Tree's default -- already gives the right
answer for it. The literal is written in `next.config.ts` and nowhere else; `src/url.ts`
has no branch for it.

**5. Only a well-formed language tag ever becomes a path segment, and a value that is not
one is *ignored*, not rejected.** The whitelist is the reason the rewrite is safe: nothing
a caller writes into `?lang` can introduce a path separator, a traversal or markup into the
route, and the grammar is applied to the decoded value, so `%2e%2e%2f` is refused for the
same reason `../` is. A value that fails the grammar takes the second rule -- the same
route an absent `lang` takes -- so the answer is the one 4.3 has said since it was frozen:
the Tree's default language, and whatever status the URL would have had anyway.

**This costs no amendment to 4.3's error table.** That is the point of the second rule
carrying the grammar. An earlier version of this ADR let a malformed value match neither
rule, which made it 404, and amended 4.3 to say so; measuring that pair showed the promise
was false for one URL shape (below, under *alternatives rejected*). The rule that shipped
is the one that can be stated without an exception: **the language never decides which page
is served or what its status is.**

**6. The language is decided in exactly one place.** After the rewrite no server component
reads `searchParams` for the language: the layout, the page and its `generateMetadata` all
take it from the `[lang]` segment. `src/url.ts` keeps the resolution rule, and `parseUrl`
takes the language value instead of the whole query:

```ts
parseUrl(path: string, lang: string, tree: Tree): PageAddress | NotFound
```

Not `string | null`: 4.4 guarantees the segment always exists -- `_` when no language was
asked for -- so a null would be unreachable by construction and would give "none asked for"
two encodings. The signature is narrower than the `URLSearchParams` it replaces --
`parseUrl` never read any other key -- and it removes a class of bug rather than a line of
code. Measured on the probe before this change: `?lang=nl&lang=en` made the routing layer
take the last value and `query.get('lang')` in the page take the first, producing
`<html lang="en">` around Dutch content -- this issue's own bug, reintroduced in an edge
case. With one source there is nothing left to disagree.

**7. The 404 page speaks the chrome language 3.1 resolves from the Tree's default
language, and says so on its own elements.** Next.js renders `not-found.tsx` without
params, so it cannot know the content language; `notFoundTitle` and `notFoundText` are
chrome keys (3.2), and chrome exists only in `en` and `nl`. The language of this page is
therefore the chrome language of the Tree's default -- `en` or `nl`, **never an arbitrary
tag** -- and every element it renders carries exactly that as its own `lang`. On a Tree
whose languages are `de` and `fr` the page is English and marked `lang="en"`; on an `nl`
Tree it is Dutch and marked `lang="nl"`. Marking it with the Tree's default language
instead would put `lang="de"` on English text: the same false attribute this ADR exists to
remove, which is why the row in 4.3 keeps its original wording. The page renders *inside*
the `[lang]` layout, so `<html lang>` around it is the resolved content language of the
request -- a language the Tree declares, or the Tree's default -- exactly as on every
other page; decision 7 is 3.1's second half -- chrome in another language carries its own
`lang` -- applied to the one page that cannot follow the content language, and it needs no
new mechanism.

## What was measured

A copy of `DeKnecht/issue-7` (Next.js 16.3.4, Node 22.18) restructured exactly as above,
served both by `next dev` and by `next build` + `node .next/standalone/server.js` -- the
production shape of section 1, not `next start`. **The two agreed on every row below.** The
Tree is `ai-act-example` (`en`, `nl`, default `en`) unless another is named. The baseline
first reproduced the reported symptom, `<html lang="en">` on a `?lang=nl` page.

| Request | `<html lang>` | Status |
|---|---|---|
| `/ai-act-example/start` | `en` | 200; `<article lang="en">`, `<footer lang="en">` |
| `/ai-act-example/start?lang=nl` | `nl` | 200; Dutch `<title>`, `<article lang="nl">`, `<footer lang="nl">`, canonical `?lang=nl` |
| `?lang=de`, `?lang=pt-BR`, `?lang=nl-BE`, `?lang=NL` (well-formed, undeclared) | `en` | 200 |
| `?lang=` (empty) | `en` | 200 |
| `?lang=<script>`, `?lang=../../etc/passwd`, `?lang=%2e%2e%2f` | `en` | 200 |
| `?lang=toolongalanguagetag`, `?lang=nl2` (fail the grammar) | `en` | 200 |
| `?lang=script` (well-formed; the grammar is anchored, so `<script>` above is not this) | `en` | 200 |
| `?lang=%6el` (encoded `nl`; the grammar sees the decoded value) | `nl` | 200 |
| `?foo=bar&lang=nl` | `nl` | 200 |
| `/ai-act-example/start/prohibited-practices?lang=nl` | `nl` | 200; canonical `/ai-act-example/prohibited-practices?lang=nl` |
| `/?lang=nl`, `/ai-act-example?lang=nl` | -- | 307 to `/ai-act-example/start?lang=nl` |
| `/`, `/?lang=<script>`, `/ai-act-example?lang=<script>` | -- | 307 to `/ai-act-example/start` |
| `/images/eu-map.png`, with `?lang=nl` and with `?lang=<script>` | -- | 200 `image/png`, `Cache-Control: public, max-age=3600` |
| `/images/nope.png` | -- | 404 |
| `/other-tree/start`, `/other-tree?lang=<script>` | -- | 404 |
| `/ai-act-example/nope?lang=nl` | -- | 404 |
| `/ai-act-example/start?lang=nl` sent with `RSC: 1` | `nl` in the payload | 200 `text/x-component` |
| `/_next/static/...` | -- | served; Next.js excludes its own paths from rewrites |

**A repeated `lang`.** 4.1 freezes "the last occurrence is the one that counts". These are
the rows behind that sentence, taken on the restructured build rather than on the old code
path; every one of them is the answer the single-occurrence rules give for the last value.

| Request | `<html lang>` | Status |
|---|---|---|
| `?lang=nl&lang=en` | `en` | 200 |
| `?lang=en&lang=nl` | `nl` | 200 |
| `?lang=nl&lang=en&lang=nl` | `nl` | 200 |
| `?lang=nl&lang=de` (last undeclared) | `en` | 200 |
| `?lang=nl&lang=../../etc/passwd` (last fails the grammar) | `en` | 200 |
| `?lang=../../etc/passwd&lang=nl` | `nl` | 200 |
| `?lang=nl&lang=`, `?lang=&lang=` (last empty) | `en` | 200 |

Whether the router sees the last value, or a joined one that only the last value can make
match, is a Next.js internal and is not frozen. What is frozen is the answer, and the
answer is the same in `next dev` and in the standalone build. No link the application emits
ever repeats `lang`.

**The 404 page.** Served from the same build with `ELSA_TREE` pointed at two fixtures,
`tests/fixtures/other-languages/` (`de`, `fr`, default `de`) and
`tests/fixtures/single-language/` (`nl`).

| Request | Text | `lang` on its elements | `<html lang>` |
|---|---|---|---|
| `/other-languages/nope` | English | `en` | `de` |
| `/other-languages/nope?lang=fr` | English | `en` | `fr` |
| `/single-language/nope` | Dutch | `nl` | `nl` |

The `de` Tree is the case that decides decision 7: the page's text is English, so `en` is
the only attribute that is true of it. The last column is the resolved content language of
the request, by the same rule as every other page -- `de` because that fixture declares it
as its default, `fr` because that fixture declares it as well. (`<html lang>` here is read
out of the React payload, because of the defect below.)

Three things were established by experiment rather than assumed, and all three changed a
rule rather than confirming one.

- **`beforeFiles` rewrites do not stop at the first match.** A first rule set used an
  unconditional catch-all last; it fired *in addition to* the language rule and turned
  `/ai-act-example/start?lang=nl` into `/_/nl/ai-act-example/start`, a 404. Hence a pair
  that is exclusive by construction, and correct under either behaviour.
- **A pair that leaves a request unmatched cannot promise a 404.** The first rejected
  alternative below; it is why the grammar is written twice.
- **The image route cannot stay outside the segment.** An identity rewrite meant to shield
  `/images/:file` did not shield it, for the same reason as the first finding. Moving the
  route under `[lang]` removes the need: the static segment `images` wins over the dynamic
  `[tree]`, and the route never looks at the language.

## Alternatives rejected

- **The same pair with a bare `missing: [{ type: 'query', key: 'lang' }]`,** so that a
  value failing the grammar matches neither rule and falls through to a path with no
  language segment. It looks tidier -- the whitelist appears once -- and it answers 404 for
  a malformed `lang` on any Node or image URL, which reads like the judgement 4.3 already
  makes about malformed ids. Rejected on measurement: a path of exactly one segment has no
  language segment to miss, so `/ai-act-example?lang=<script>` matched `/[lang]` and
  answered **307 to the root Node**, not the 404 the amended table promised, while
  `/other-tree?lang=<script>` went from 404 to 307 -- a malformed language turning a
  not-found into a redirect. The rule could not be written down without an exception per
  URL shape, and it bought that exception by amending a frozen error table. Carrying the
  grammar in `missing` costs one repeated constant and makes the language irrelevant to the
  status, which is a rule with no exceptions at all.
- **`src/proxy.ts` (Next.js 16's renamed middleware), option 1 on the issue.** Ten lines,
  and it works: read `?lang`, set a request header, read it in the layout with `headers()`.
  Rejected because it buys the same result through a hidden channel -- a header that exists
  only by convention between two files -- and puts our code on the path of every request,
  including every image. The rewrite is declarative, is resolved by the router before any
  of our code runs, and makes the language visible in the route tree
  (`/[lang]/[tree]/[...path]`), which is where the next reader will look for it.
- **Amending 3.1 to say `<html lang>` is the Tree's default language, option 3 on the
  issue.** Zero code, and it would have been an honest description of today's behaviour.
  Rejected because it gives up the guarantee instead of meeting it: a Dutch page would go
  on telling every assistive technology that it is English, and the `<title>` would stay
  unmarkable. The core document asks for a frontend that a third party's Tree cannot break
  (section 9); a document whose declared language is wrong for every non-default reader is
  the frontend breaking itself.
- **A public language prefix, `/nl/<tree-id>/...`.** The conventional i18n layout, already
  rejected in `ADR-5-url-scheme.md` and still rejected: it lengthens the common case, puts
  a language in front of URLs that do not need one, and would invalidate every link shared
  before the change. The rewrite gets the same routing shape internally at no cost to the
  reader.
- **`next/root-params` (`import { lang } from 'next/root-params'`).** Next.js 16.3.4 ships
  it, and it would let `not-found.tsx` read the language too. Rejected because in this
  version it is still behind `experimental.rootParams`, and its own source says support in
  route handlers "is planned for a future version of Next.js". A frozen contract does not
  rest on an experimental API. If it stabilises, a later ADR can adopt it and delete
  decision 7.
- **One unconditional rewrite to `/_/:path*` first, then a second rule matching
  `/_/:path*` with `?lang` present.** Two rules, no whitelist needed, and it works today.
  Rejected because it depends on `beforeFiles` chaining every matching rule -- the
  behaviour measured above, which the documentation does not promise.
- **`Accept-Language`, or a cookie.** Ruled out by the core document (no cookies, section
  8) and by 4.1: a shared link must reproduce the sender's screen, so the language belongs
  inside the link.

## Consequences

- Section 6's `src/app/` gains one level. The route tree becomes `/[lang]`,
  `/[lang]/[tree]`, `/[lang]/[tree]/[...path]` and `/[lang]/images/[file]`. Nothing outside
  `src/app/` and `next.config.ts` moves: `src/components/`, `src/tree/`, `src/chrome.ts`,
  `src/config.ts` and `src/markdown.ts` are untouched.
- `next.config.ts` stops being purely deployment configuration and holds one routing rule.
  Section 6 names it as owning that rule and nothing else. It is also the one file that
  spells `_`; `src/url.ts` resolves it by the ordinary rule and never names it, and 4.3
  states that split as a rule rather than as a comment on a signature.
- **Section 7 gains `routing.test.ts`.** 4.4 is the first contract whose subject lives in
  `next.config.ts`, and browser tests are deliberately out of the contract, so the rules
  are asserted where they are written: the test reads `config.rewrites()` and checks that
  the grammar accepts exactly the well-formed tags of 4.1 and that the second rule fires
  for exactly the values the first rejects. No server, no browser. The end-to-end table
  above is the acceptance criteria of #20, not a frozen test.
- `url.test.ts`'s promise -- every 404 case of 4.3 -- still holds exactly as frozen and is
  not touched by this ADR, because 4.3 gains no 404 case: no answer in that table moved,
  and not one of them became the router's to make. This is the second reason decision 5
  ignores rather than rejects.
- The application never reads the *language* from `searchParams` again. That is the rule
  section 6 freezes, and it is what makes 4.4 true; `searchParams` itself is not forbidden,
  or a later query parameter could never be read at all. If a later issue needs one it
  arrives through the page, not through the layout -- a layout is not given `searchParams`
  -- and 4.1's "other query parameters are ignored" still holds today.
- Navigation is plain `<a href>` today, so the rewrite only ever sees full document
  requests. It was checked against React Server Component requests as well -- the shape a
  `next/link` navigation sends -- and those resolve to the same language, so a later issue
  may adopt `next/link` without revisiting this.
- Separately, and **not** caused by this decision: on `DeKnecht/issue-7` the 404 page's
  markup reaches the browser only inside the embedded React payload -- the first HTML
  document is Next.js's built-in error shell, `<html id="__next_error__">`, with the status
  correctly 404 and no `lang` at all. It reproduces identically before and after this
  restructure, in `next dev` and in the standalone build, so it is a defect of the Node
  view and not of the language route. It is reported on PR #17 and filed as #21; until it
  is fixed, decision 7's attributes and the `<html lang>` of a 404 page are observable only
  in the payload. It must not be mistaken for a consequence of this ADR.
