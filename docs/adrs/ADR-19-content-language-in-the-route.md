# ADR-19-content-language-in-the-route: a rewrite copies `?lang` into a `[lang]` route segment, so the root layout can set `<html lang>`

- Status: ACCEPTED (frozen) -- 2026-09-04
- Issue: #19 -- Decide what `<html lang>` says
- Spec: `docs/specs/application.md`, sections 3.1, 4.1, 4.3, 4.4, 6
- Amends: `ADR-5-url-scheme.md` (the 4.3 error table only; the public grammar is untouched)
  and `ADR-5-repository-layout.md` (the shape of `src/app/`)

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
costs -- because it changes the module layout frozen in section 6 and one row of the error
table frozen in 4.3.

## Decision

**1. The public URL scheme of 4.1 does not change.** `?lang=<tag>` remains the only public
carrier of the content language, absent for the default language. Every share link, every
canonical link and every link the application emits is exactly what it was.
`ADR-5-url-scheme.md`'s rejection of a *public* language prefix (`/nl/<tree-id>/...`)
stands: it would lengthen every URL and invalidate every link already shared.

**2. A rewrite restates the query as a leading path segment, before the file system.**
`next.config.ts` gains two mutually exclusive rules:

```ts
async rewrites() {
  return {
    beforeFiles: [
      // ?lang=<well-formed tag>  ->  /<tag>/...   so the root layout gets it as a param
      {
        source: '/:path*',
        has: [{ type: 'query', key: 'lang', value: '(?<lang>[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*)' }],
        destination: '/:lang/:path*',
      },
      // no ?lang at all  ->  /_/...   `_` is not a language tag, so it reads as "the default"
      { source: '/:path*', missing: [{ type: 'query', key: 'lang' }], destination: '/_/:path*' },
    ],
  }
}
```

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
called `_`, and `_` is not a well-formed language tag, so the ordinary resolution rule --
a language the Tree does not declare means the Tree's default -- already gives the right
answer for it. No special case is needed anywhere in `src/`.

**5. Only a well-formed language tag ever becomes a path segment.** The value must match
`[a-zA-Z]{2,8}(-[a-zA-Z0-9]{1,8})*`. This whitelist is the reason the rewrite is safe:
nothing a caller writes into `?lang` can introduce a path separator, a traversal or markup
into the route. It costs one amendment to 4.3, which previously said that every undeclared
`lang` is ignored:

| `?lang=` | Before | Now |
|---|---|---|
| a well-formed tag the Tree declares (`nl`) | that language, 200 | unchanged |
| a well-formed tag the Tree does not declare (`de`, `pt-BR`, `nl-be`) | ignored, default, 200 | unchanged |
| absent, or present and empty (`?lang=`) | default, 200 | unchanged |
| not a well-formed tag (`../../etc/passwd`, `%2e%2e%2f`, `<script>`, `toolongalanguagetag`) | ignored, default, 200 | **404** |

The new row applies the judgement 4.3 already makes about ids: malformed is 404. No reader
produces such a URL; a crawler or a prober does, and 404 is both the correct answer and the
cheapest one.

**6. The language is decided in exactly one place.** After the rewrite no server component
reads `searchParams` for the language: the layout, the page and its `generateMetadata` all
take it from the `[lang]` segment. `src/url.ts` keeps the resolution rule, and `parseUrl`
takes the language value instead of the whole query:

```ts
parseUrl(path: string, lang: string | null, tree: Tree): PageAddress | NotFound
```

That is narrower than the `URLSearchParams` it replaces -- `parseUrl` never read any other
key -- and it removes a class of bug rather than a line of code. Measured on the probe
before this change: `?lang=nl&lang=en` made the routing layer take the last value and
`query.get('lang')` in the page take the first, producing `<html lang="en">` around Dutch
content -- this issue's own bug, reintroduced in an edge case. With one source there is
nothing left to disagree.

**7. The 404 page speaks the Tree's default language, and says so on its own elements.**
Next.js renders `not-found.tsx` without params, so it cannot know the language, and it
renders *inside* the `[lang]` layout: on `/<tree-id>/<unknown>?lang=nl` the document is
`<html lang="nl">` while its chrome is English. Every element the 404 page renders
therefore carries `lang={tree.manifest.defaultLanguage}` explicitly. That is 3.1's second
half -- chrome in another language carries its own `lang` -- applied to the one page that
cannot follow the content language, and it needs no new mechanism.

## What was measured

A copy of `DeKnecht/issue-7` (Next.js 16.3.4, Node 22.18, Tree `ai-act-example`, languages
`en` and `nl`, default `en`) restructured exactly as above, served both by `next dev` and
by `next build` + `next start`. The two agreed on every row.

| Request | `<html lang>` | Status |
|---|---|---|
| `/ai-act-example/start` | `en` | 200 |
| `/ai-act-example/start?lang=nl` | `nl` | 200; Dutch `<title>`, `<article lang="nl">`, `<footer lang="nl">` |
| `/ai-act-example/start?lang=de` | `en` | 200 |
| `/ai-act-example/start?lang=pt-BR` | `en` | 200 |
| `/ai-act-example/start?lang=` (empty) | `en` | 200 (Next.js reads an empty value as absent) |
| `/ai-act-example/start?foo=bar&lang=nl` | `nl` | 200 |
| `/ai-act-example/start?lang=../../etc/passwd` | -- | 404 |
| `/ai-act-example/start?lang=%2e%2e%2f` | -- | 404 |
| `/ai-act-example/start?lang=<script>` | -- | 404 |
| `/ai-act-example/start/prohibited-practices?lang=nl` | `nl` | 200; canonical `/ai-act-example/prohibited-practices?lang=nl` |
| `/?lang=nl` and `/ai-act-example?lang=nl` | -- | 307 to `/ai-act-example/start?lang=nl` |
| `/images/eu-map.png`, with and without `?lang=nl` | -- | 200 `image/png`, `Cache-Control: public, max-age=3600` |
| `/images/nope.png` | -- | 404 |
| `/other-tree/start` | -- | 404 |
| `/ai-act-example/start?lang=nl` sent with `RSC: 1` | `nl` in the payload | 200 `text/x-component` |
| `/_next/static/...` | -- | served; Next.js excludes its own paths from rewrites |

Two things were established by experiment rather than assumed, and both are why the rules
are shaped the way they are.

- **`beforeFiles` rewrites do not stop at the first match.** A first attempt used an
  unconditional catch-all as the last rule; it fired *in addition to* the language rule and
  turned `/ai-act-example/start?lang=nl` into `/_/nl/ai-act-example/start`, a 404. The two
  rules above are mutually exclusive by their `has`/`missing` conditions, so they give the
  same answer whether the pipeline stops at the first match or applies every match.
- **The image route cannot stay outside the segment.** An identity rewrite meant to shield
  `/images/:file` did not shield it, for the same reason. Moving the route under `[lang]`
  removes the need: the static segment `images` wins over the dynamic `[tree]`, and the
  route never looks at the language.

## Alternatives rejected

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
  behaviour measured above, which the documentation does not promise. The `has`/`missing`
  pair is correct under either behaviour.
- **`Accept-Language`, or a cookie.** Ruled out by the core document (no cookies, section
  8) and by 4.1: a shared link must reproduce the sender's screen, so the language belongs
  inside the link.

## Consequences

- Section 6's `src/app/` gains one level. The route tree becomes `/[lang]`,
  `/[lang]/[tree]`, `/[lang]/[tree]/[...path]` and `/[lang]/images/[file]`. Nothing outside
  `src/app/` and `next.config.ts` moves: `src/components/`, `src/tree/`, `src/chrome.ts`,
  `src/config.ts` and `src/markdown.ts` are untouched.
- `next.config.ts` stops being purely deployment configuration and holds one routing rule.
  Section 6 names it as owning that rule and nothing else. The literal `_` lives there and
  is understood by the resolution rule in `src/url.ts`; the two are tied together only by
  4.4, which is why 4.4 states it once and both files point at it.
- The application no longer reads `searchParams` anywhere. If a later issue needs a second
  query parameter it arrives through the page, not through the layout, and 4.1's "other
  query parameters are ignored" still holds.
- Navigation is plain `<a href>` today, so the rewrite only ever sees full document
  requests. It was checked against React Server Component requests as well -- the shape a
  `next/link` navigation sends -- and those resolve to the same language, so a later issue
  may adopt `next/link` without revisiting this.
- The 404 page renders inside the `[lang]` layout, so its document language is the one that
  was asked for while its text is the Tree's default language; decision 7 keeps that
  honest. Making the 404 page itself follow the content language is not solved here and is
  not needed for 3.1.
- Separately, and **not** caused by this decision: on `DeKnecht/issue-7` the 404 page's
  markup reaches the browser only inside the embedded React payload -- the first HTML
  document is Next.js's built-in error shell, `<html id="__next_error__">`, with the status
  correctly 404. It reproduces identically before and after this restructure, in `next dev`
  and in a production build, so it is a defect of the Node view and not of the language
  route. It is reported on PR #17 and filed as its own issue; it must not be mistaken for a
  consequence of this ADR.
