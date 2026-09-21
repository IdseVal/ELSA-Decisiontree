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
  #119  JSON data                   #120  robots, sitemap, hreflang
    |
  #121  dataset endpoint, schema route, llms.txt
    |
  #122  JSON-LD
```

| Issue | Depends on | Why exactly |
|---|---|---|
| #119 the migration | #118 | It writes the shape this freeze decided and validates against the schema this freeze published. Nothing else it needs exists. |
| #120 robots, sitemap, `hreflang`, description | #118 | It reads the loader's Node index and the URL scheme, both of which are what they were. Not #119: which serialisation the Tree was read from is invisible to it, and it touches no file #119 touches -- the routes are new, and the one shared file, the Node page's head, is a different part of it from the loader #119 changes. It may run beside #119 from the hour this merges. |
| #121 the endpoint, the schema route, `llms.txt` | #118, #119 | It serves `tree.json` byte-identical. Until #119 has merged there is no `tree.json` to serve, and an endpoint written against a file that does not exist cannot be tested against the one claim that matters (`curl \| diff` is empty). |
| #122 the JSON-LD | #118, #121 | The `Dataset`'s `distribution` is a `DataDownload` whose `contentUrl` is the endpoint. Emitting it before #121 publishes a `Dataset` record pointing at a 404, which is worse than emitting none: a crawler that fetches a broken `contentUrl` may drop the record and re-try slowly. It does not depend on #120: the JSON-LD and the `hreflang` links are different elements of the same head, and each is correct alone. |

**The two that may run in parallel are #119 and #120**, and they are the two largest, so
the order above is also the fastest one available. #121 and #122 are a chain, and a short
one.

**One shared file, named so nobody is surprised**: `docs/specs/application.md`. #120 fills
16.1 to 16.3, #121 fills 15 and 16.5, #122 fills 16.4. This freeze writes all of those
sections in full, so each build issue amends its own sections in place and adds its
measured evidence; none of them has to create a section another is also creating.

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

## Consequences

- The `Depends on:` lines already on #119, #120, #121 and #122 match this decision as
  filed; nothing needs re-filing.
- #119 is on the critical path for two of the four, so it is the one to dispatch first.
- Should #119 change the loader's interface beyond reading a different file -- it should
  not, and `ADR-118-json-serialisation.md` says why -- #120 becomes dependent on it, and
  that is a correction to file on this issue, not a decision for #120 to take alone
  (`.orca/roles/architect.md`: a frozen contract that turns out to be wrong is said so on
  the issue).
