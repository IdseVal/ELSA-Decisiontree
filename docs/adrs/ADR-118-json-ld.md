# ADR-118-json-ld: one `@graph` per page -- a `Dataset` on the root Node, a `WebPage` on every Node, a `Question` as the question Node's `mainEntity`

- Status: ACCEPTED (frozen) -- 2026-09-21
- Issue: #118 -- Architecture: freeze the JSON-only Tree format (`elsa-tree/4`)
- Spec: `docs/specs/application.md` 16.4
- Amends: `docs/adrs/ADR-5-repository-layout.md` (`src/findability/jsonld.ts`; the
  graph is emitted into the page head, so this one adds no route) and
  `ADR-5-testing-approach.md` (`tests/findability/jsonld.test.ts`, and the
  escaping half of `findability.spec.ts`)

## Context

Google Dataset Search, and the indexes behind the AI assistants, do not read prose. They
read `schema.org` markup: a `Dataset` that names a licence and a download is what makes a
page a dataset record rather than a web page that mentions data. The application emits
none today.

Two things make the mapping non-obvious rather than mechanical:

- **The Dataset is the Tree, and a Tree has many pages.** Repeating the whole `Dataset`
  on all 71 pages states 71 datasets unless every copy carries the same `@id`; carrying
  it once and referring to it by `@id` from the rest states one. And the `@id` must not
  change with the page's language, or the English pages and the Dutch pages belong to two
  datasets.
- **A question Node looks like a Q&A page and is not one.** `QAPage` and the `Question`
  rich result are for community question-and-answer sites, where the answers are written
  by people. A step of a decision tree whose two answers are "yes" and "no" is not that,
  and claiming the type to get a rich result is a misstatement in a document whose whole
  purpose is to be a trustworthy legal aid.

## Decision

1. **One `<script type="application/ld+json">` per page**, emitted by the server, holding
   a single object with `@context: "https://schema.org"` and an `@graph` array. No client
   code, no third-party host, nothing fetched (core document 7, 8, 9).
2. **The `Dataset` is emitted on the root Node's page only**, with a language-independent
   `@id`: `<base>/<tree-id>#dataset`. Every other page refers to it by that `@id` and
   never restates it, so the English pages and the Dutch pages belong to one dataset and
   not two. **Its fields are the table in `application.md` 16.4 -- one table, and this
   ADR does not repeat it**, for the reason `ADR-118-crawler-access.md` gives for the
   token list. Two of the rows are decisions rather than mappings, and they are decided
   here: `description` falls back to the **root Node's** `description` when the manifest
   has none, because `name` and `description` are the two fields Google requires and a
   required field may not rest on an optional one; and `isBasedOn` is derived from the
   Tree rather than written into the code (decision 4).

3. **The holder line is a constant of the deployment, checked against `CONTENT-LICENSE`
   by a test**, not parsed out of the file at run time. Reading a licence text at startup
   to find a name is brittle in a way that fails silently; a constant with a test that
   greps `^Copyright \(c\) \d{4} (.+)$` out of `CONTENT-LICENSE` and compares fails loudly
   the day the line changes, which is the only day it matters.
4. **`isBasedOn` is derived from the Tree, not written into the code**: the most frequent
   `url` among every `kind: legal` Source in the Tree, compared after dropping any
   fragment and query, ties broken by first occurrence in Node order. For both Trees here
   that is `https://eur-lex.europa.eu/eli/reg/2024/1689/oj`, EUR-Lex's
   language-negotiating ELI address for the AI Act (CELEX 32024R1689) -- which is the
   address the Trees actually cite, and therefore the honest answer to "what is this
   based on". A Tree with no legal Source omits the field. A third-party Tree about
   another instrument gets its own instrument, with no code change, which is the
   interoperability requirement of core document 3.1 applied to metadata.
5. **Every Node page carries a `WebPage`**: `@id` the page's canonical URL (which
   includes `?lang` when not the default, so each language is its own `WebPage`), `name`
   the Node's title, `description` the page's meta description (the same reduced string,
   so the two cannot differ), `inLanguage` the page's language, `url` the canonical URL,
   and `isPartOf` `{ "@id": "<base>/<tree-id>#dataset" }`.
6. **A question Node adds a `Question` as the `WebPage`'s `mainEntity`**, not as the
   page's type:
   - `@type` `Question`, `@id` `<page canonical>#question`;
   - `name` the Node's title, `text` the Node's description reduced to plain text
     **without the 155-character cut** (`application.md` 16.3, steps 1 and 2 only),
     `inLanguage` the page's language. The `WebPage`'s `description` takes the cut
     string and the `Question`'s `text` does not, because a `description` is a summary
     for a result listing and a `text` is the question itself: a question closed with an
     ellipsis is a different question, and this is a legal aid. For a conforming Tree
     the two strings are identical -- a Node description is at most 150 counted
     characters -- so this decides which consumer takes the loss the day that limit
     moves, not what is emitted today;
   - `suggestedAnswer`: two `Answer` entries, in the order yes then no, each with `text`
     the chrome word for that Answer followed by a colon and the target Node's title in
     the page's language -- the exact label the button carries (`application.md` 10.3) --
     and `url` the target Node's canonical URL in the same language.

   `suggestedAnswer`, not `acceptedAnswer`: which answer is right depends on the reader's
   system, which is the whole point of the Tree. There is no accepted answer to state.
7. **A Terminal and an explanation Node carry the `WebPage` and nothing more.** A
   Terminal is an outcome, not a question; an explanation Node has no answers of its own
   (`tree-format.md` 5.6). An explanation Node's page is its parent's page with an
   Overlay open (`application.md` 10.9), so its `WebPage` is that address's.
8. **The Options are not mapped.** They are not answers to the Node's question: an Option
   opens an aside the reader comes back from (core document 3.1, traversal rule). Nothing
   in `schema.org` says "a further reading that does not answer this", and inventing a
   `suggestedAnswer` for each would tell a machine the opposite of what the data means.
   The Option targets are ordinary links in the page and are crawled as such.
9. **Escaping is part of the contract.** Every value the server puts in the script is
   JSON-encoded, and in the encoded payload every `<` (U+003C) is emitted as the JSON
   escape `\u003c` -- the six characters `\`, `u`, `0`, `0`, `3`, `c`, spelled out because
   an editor that folds that escape into the character it escapes is how this rule was
   a tautology once. A consumer's parser reads `\u003c` back as `<`, so the object is
   unchanged, but `</script>` cannot occur in the bytes: no title, description, credit
   or origin can close the element. An HTML entity such as `&lt;` would not do it, since
   a `<script>` element's content is not entity-decoded and the entity would land in the
   JSON as four literal characters. The emitted string is then checked for `</script>`
   and `<!--` at the sink and dropped rather than emitted if either is present -- two
   checks, one of them at the sink, which is `application.md` 13.3's discipline applied
   to a second place a Tree's text, third-party data, reaches the document.

## Alternatives rejected

- **Repeating the whole `Dataset` on every Node page.** Simplest to write; states one
  dataset per page unless the `@id` is right, and once the `@id` is right it is 60
  identical copies of the same object in the same site, which is what `@id` and
  `isPartOf` exist to avoid.
- **`QAPage` as the page type for a question Node, with the `Question` as its
  `mainEntity`.** The type Google's `Question` rich result wants. Rejected: `QAPage` says
  the page is a question-and-answer page of the community kind, and this is a step of a
  legal decision aid. Claiming the type would be a misstatement, and a misstatement about
  structure in a document about law is the last place to make one.
- **`FAQPage`.** The same objection, and its rich result has been retired for most sites
  in any case.
- **`acceptedAnswer` on the `Question`.** There is no accepted answer; there is the
  reader's answer.
- **Mapping each Option to a `suggestedAnswer`.** See decision 8.
- **`isBasedOn` as a fixed CELEX address for the AI Act.** The issue wrote the field this
  way: name the instrument the first Tree is about, by its CELEX number
  (`32024R1689`). Rejected on two counts. It hard-codes one instrument into the
  application, so a third-party Tree about another regulation -- the interoperability
  the format exists for (core document 3.1) -- would carry the AI Act's identifier and
  state something false; and a CELEX address is not what the Trees cite. Their legal
  Sources are ELI URLs, which negotiate language, and `isBasedOn` should name the thing
  a reader following the page's own links arrives at. Deriving the value from the most
  frequent `kind: legal` Source (decision 4) yields
  `https://eur-lex.europa.eu/eli/reg/2024/1689/oj` for both Trees here -- the same
  instrument the issue meant, reached by the address the data actually uses, and correct
  for a Tree nobody here wrote. The CELEX number stays in this ADR and in 16.4 as prose
  identifying the instrument, never as the emitted value.

- **`sameAs` pointing at the GitHub repository.** The issue offered it. Left out: what
  the public sees at that address is an open question (#112 -- `main` holds a stub
  today), and a `sameAs` that resolves to an empty repository is a worse statement than
  no `sameAs`. It is one field to add on the day the repository is the dataset's real
  home.
- **`identifier` with a DOI, and `keywords`.** A DOI would be the right thing for a
  research output and there is none to name yet; nothing in the Tree supplies keywords
  honestly. Both are named in 16.4 as reserved rather than filled with something
  plausible.
- **Emitting the JSON-LD from a client component**, or through a third-party tag manager.
  Core document 8 and 9: nothing about the user is transmitted and nothing is fetched from
  another origin; and a crawler that does not run scripts would see none of it.

## Consequences

- The reduction of a description has **one implementation** in `markdown.ts`, next to the
  address set of `ADR-118-sitemap-and-alternates.md`, and **two outputs**: the reduced
  string and the cut string built from it. The meta description and the `WebPage`'s
  `description` take the cut one, the `Question`'s `text` and `llms.txt`'s blockquote the
  reduced one (`application.md` 16.3 has the table). One function, so the four cannot
  drift; two outputs, so the one place a cut would be wrong does not get one.
- The JSON-LD's `Answer.url` values are canonical Node URLs, so the structured data names
  the same addresses as the sitemap and the alternates. A crawler that reads all three
  gets one consistent graph.
- The `Dataset` depends on the dataset endpoint existing, which is why #122 depends on
  #121 (`ADR-118-build-order.md`): a `DataDownload` whose `contentUrl` answers 404 is
  worse than no `Dataset`.
- A test may parse the emitted script back and assert each field, and should assert the
  two Google requirements -- `name` and `description` -- by name, and the `Dataset`'s
  `distribution` with its `contentUrl` beside them, so that a future edit that drops one
  fails for the stated reason (issue #122).
