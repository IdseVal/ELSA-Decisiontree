# ADR-118-build-order: the migration first; the endpoint and `llms.txt` on the migration; the sitemap, robots and `hreflang` on this freeze alone; the JSON-LD on the endpoint

- Status: ACCEPTED (frozen) -- 2026-09-21
- Issue: #118 -- Architecture: freeze the JSON-only Tree format (`elsa-tree/4`)
- Spec: `docs/specs/tree-format.md` 12.6; `docs/specs/application.md` 15, 16

## Context

Four build issues follow this freeze: #119 (the data becomes JSON), #120 (robots, sitemap,
`hreflang` and the description), #121 (the dataset endpoint, the schema route and
`llms.txt`), #122 (the JSON-LD). They run in separate worktrees, in parallel where they
can. The dispatcher's `Depends on:` lines decide which may start when, and a wrong line
costs either a stalled worktree or a merge conflict between two branches that both
rewrote the same file.

The dependency that matters is not "mentions the same subject" but **"cannot be written,
or cannot be true, until the other has merged"**.

## Decision

```
        #118  freeze  (this issue)
          |
    +-----+---------------------------+
    |                                 |
  #119  JSON data                   #120  robots, sitemap, hreflang,
    |                                     the address set, the reduction
    |                                 |
    +-----------------+---------------+
                      |
                    #121  dataset endpoint, schema route, llms.txt
                      |
                    #122  JSON-LD
```

| Issue | Depends on | Why exactly |
|---|---|---|
| #119 the migration | #118 | It writes the shape this freeze decided and validates against the schema this freeze published. Nothing else it needs exists. |
| #120 robots, sitemap, `hreflang`, description | #118 | It reads the loader's Node index and the URL scheme, both of which are what they were. Not #119: which serialisation the Tree was read from is invisible to it. It may run beside #119 from the hour this merges; the files the two share are named below. |
| #121 the endpoint, the schema route, `llms.txt` | #118, #119, #120 | It serves `tree.json` byte-identical. Until #119 has merged there is no `tree.json` to serve, and an endpoint written against a file that does not exist cannot be tested against the one claim that matters (`curl \| diff` is empty). **#120 for `llms.txt`**: its blockquote is the **reduced** description (`application.md` 16.3), which comes from the one function in `markdown.ts` that #120 writes -- `ADR-118-json-ld.md` makes "one implementation, so the four cannot drift" a decision in its own right, and a #121 that starts before #120 has merged has no reduction to call and writes the second one that decision forbids. Its absolute URLs come from the same module member. Also the head link of 16.3: #121 adds it with the route (decision 6 of `ADR-118-dataset-endpoint.md`), into a head #120 wrote. |
| #122 the JSON-LD | #118, #120, #121 | The `Dataset`'s `distribution` is a `DataDownload` whose `contentUrl` is the endpoint. Emitting it before #121 publishes a `Dataset` record pointing at a 404, which is worse than emitting none: a crawler that fetches a broken `contentUrl` may drop the record and re-try slowly. **#120 as well**, and not only through #121: the `WebPage`'s `description` is the **cut** string and the `Question`'s `text` the **reduced** one, both from #120's one function in `markdown.ts`, and every `@id` and `url` in the graph is an entry of the **address set** `url.ts` gains with #120 (`application.md` 16.3, and `findability.spec.ts` asserts the JSON-LD's `@id` equals the head's canonical). Naming it rather than leaning on the chain through #121 is the point: were #121 ever re-ordered or split, #122 would still be unable to start before #120. |

**The two that may run in parallel are #119 and #120**, and they are the two largest, so
the order above is still the fastest one available: the round is as long as the longer of
those two plus #121 plus #122, and no ordering of these four is shorter. #121 waits for
both of them -- for the data from #119 and for the shared members of `url.ts` and
`markdown.ts` from #120 -- and #122 follows #121.

**The rule that produced the two lines with three entries.** #121 and #122 each consume
a *function* #120 writes, not merely a subject #120 also mentions: the plain-text
reduction with its two outputs, and the address set. Both are single-implementation
decisions by name (`ADR-118-json-ld.md`, `ADR-118-sitemap-and-alternates.md`), so a
branch that starts before #120 merges does not wait for a file -- it writes a second
implementation, and the decision that there is one is the thing that has been broken. By
the criterion above, that is "cannot be true until the other has merged", not "mentions
the same subject".

**The files two branches share, named so nobody is surprised.** Three, and in each the
parts are disjoint:

- `docs/specs/application.md`: #119 amends 5.1 to 5.4 (the loader reads `tree.json`),
  #120 fills 16.1 to 16.3 **except 16.3's dataset link**, #121 fills 15, that one link
  and 16.5, #122 fills 16.4. This freeze writes 15 and 16 in full, so no build issue has
  to create a section another is also creating. The one line 16.3 does not give #120 is
  the `<link rel="alternate" type="application/json">`: it names the route #121 builds,
  and a head that advertises it before the route answers is a link to a 404
  (`ADR-118-dataset-endpoint.md` decision 6). 16.3 and 15.3 both name #121 for it, and
  it has a test row of its own in `application.md` section 7.
- `docs/deployment.md`: #120 adds what `ELSA_BASE_URL` now advertises and how to preserve
  the Tree file's timestamp; #121 adds the dataset URL and the reverse-proxy line.
- `README.md`: #119 renames the Tree file; #121 and #122 add a line each.

A textual conflict between #119 and #120 in `application.md` is possible and small; it is
two different sections of one file, and whichever lands second rebases. Nothing about the
*contracts* conflicts, which is what the order is for.

## Alternatives rejected

- **#120 after #119**, so that every findability issue builds on JSON data. It reads
  nothing from the file: the loader's interface is unchanged by #119, and a sitemap built
  from `getNode` and the title index does not know what parsed them. Serialising the two
  would leave the larger half of the round idle behind the other.
- **#121 before #119, serving `tree.yaml` in the meantime**, so that the endpoint exists
  sooner. It would ship a dataset URL that changes its media type and its bytes a week
  later -- the one property of a dataset URL that must not change.
- **One build issue for all of findability.** It would touch the loader's consumers, four
  new routes, the Node page's head and three specs in one branch, and its review would be
  the review of a round rather than of a change.
- **#122 before #121, with the `contentUrl` written against the planned URL.** The URL
  would be right and the resource absent. A `Dataset` is a claim that a download exists.
- **Leaving #120 off the #121 and #122 lines**, on the ground that the chain through
  #119 and #121 does not need it and a shorter line is easier to read. It would be a
  line that is false by this ADR's own criterion: both issues consume the reduction and
  the address set, and a dependency that holds only because of the order the issues
  happen to be dispatched in is not a dependency anyone can rely on. The cost of naming
  it is two words; the cost of omitting it is a second implementation of a function two
  ADRs decided there would be one of.
- **Splitting the reduction and the address set out of #120 into their own issue**, so
  that #121 and #122 depend on something smaller than the whole of robots, sitemap and
  `hreflang`. It would be an issue whose deliverable is two functions and no observable
  behaviour, reviewed against no document a reader can fetch -- and #120 is the first
  consumer of both, so it would ship them anyway, a week earlier, untested by a route.

## Consequences

- #119 and #120 were filed with the lines this decision gives them. **#121 and #122 were
  re-filed on 2026-09-21**, while this freeze was in review, to add #120: they read
  "#118, #119" and "#118, #121" and now read "#118, #119, #120" and "#118, #120, #121".
  The lines on the four issues and the table above are the same four lines.
- #119 is on the critical path for two of the four, so it is the one to dispatch first.
- Should #119 change the loader's interface beyond reading a different file -- it should
  not, and `ADR-118-json-serialisation.md` says why -- #120 becomes dependent on it, and
  that is a correction to file on this issue, not a decision for #120 to take alone
  (`.orca/roles/architect.md`: a frozen contract that turns out to be wrong is said so on
  the issue).
