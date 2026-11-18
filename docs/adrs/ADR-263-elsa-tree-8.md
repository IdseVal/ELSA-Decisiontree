# ADR-263-elsa-tree-8: the longer description makes the format `elsa-tree/8`, a `/7` file is converted by its format and `$schema` alone, and the live server's files are converted at the first start of the release that carries it, which is 10.45's question

- Status: ACCEPTED (frozen) -- 2026-11-18; decides core document 10.46's format question with
  `ADR-263-description-limit.md`
- Issue: #263 -- Decide the longer description that scrolls in the Bubble and the Overlay (#262)
- Spec: `docs/specs/tree-format.md` (title, header, 5.7, 10, 11, 12, 12.10 new), amended `[#263]`;
  `docs/specs/application.md` 43.8 (new)
- Core document: 10.28 (the exception #102 took is not taken again), 10.45 (still OPEN: what this
  means for the live server), 10.46
- Depends on: `ADR-263-description-limit.md`
- Amends: `ADR-231-elsa-tree-7.md` (the next format number is taken: `/8`)
- Schema: `schemas/elsa-tree-8.json` is **not** written here; #264 writes it, beside
  `elsa-tree-7.json`, which stays served
- Built by: #264

## Context

`tree-format.md` section 10's rule: "Any change to the keys, the kinds, the outcome set, the Theme
roles, the limits or the validity rules is published as" a new format number, and "The next change
will be `elsa-tree/8`". One exception is on record: #102 cut this same field's limit from 600 to
150 under `elsa-tree/3`, because "the owner's answer scoped the change to the limit and the
validator, the shape of a Tree file is unchanged" (5.7; core document 10.28). #231 applied the rule
to a widened limit and wrote down why the exception was not taken again: "#102's exception was the
owner's answer to a question put on its PR; a change that only widens a limit gains nothing from
skipping the number but the conversion, and loses the guarantee above" (`ADR-231-elsa-tree-7.md`,
the second rejected alternative) -- the guarantee that a reader holding a published contract does
not refuse a file that says it follows it.

The schema carries no text maximum ("those are measured on the COUNTED TEXT", its own description,
`schemas/elsa-tree-7.json`), so no byte of it is about this limit; the limit is 5.7's, which the
loader applies, and which a third party implementing `elsa-tree/7` applies too.

Since #247 a release must never write the live deployment's data (core document section 9). Whether
the one write a release's code still makes there -- the store converting every `tree.json` and
`draft.json` of an older format at the first start of a release that carries a new one -- is
allowed is core document 10.45, OPEN for the owner since 2026-10-13; its PROPOSED reading, built by
#252, is that it is, made reversible by the copy of the data directory taken before every release
starts. The owner's Trees on the live server were written to 150 counted characters.

## Decision

1. **`elsa-tree/8`**: a Node's `description` is at most 600 counted characters and 8 estimated
   lines (`ADR-263-description-limit.md`); nothing else changes. The schema says `elsa-tree/8` in
   its `format` constant, its `title` and its own `description`, and is otherwise `/7`'s.
2. **By the rule, not as an exception**, as `ADR-231-elsa-tree-7.md` decision 2 decided for a
   widened limit: the owner's words on #262 name a limit too short, not the format, and a format
   number is the Architect's (10.21). A file that says `elsa-tree/7` keeps meaning 150 characters,
   for this release's own older copies as for a third party.
3. **`schemas/elsa-tree-8.json`** beside the `/7`, `/6`, `/5` and `/4` files, each still served;
   the loader accepts `/8` alone; `Manifest['format']` is `elsa-tree/8`.
4. **12.10 converts a `/7` file** by its `format` and its `$schema` and nothing else: every valid
   `/7` file is a valid `/8` file, since 150 characters and 2 lines are within 600 and 8. `npm run
   migrate` runs it over the repository after 12.7 to 12.9, and the store over a deployment's data
   directory when it opens a file, as 12.9.4 does.
5. **What it means for the live server (10.45).** The first release that carries `/8` converts
   every `tree.json` and `draft.json` of the live data directory at its first start, changing two
   strings in each and nothing else; that is the write 10.45 asks the owner about. Under 10.45's
   PROPOSED reading, which #252 built, the release goes and the copy taken before it starts makes
   the conversion reversible. If the owner answers no, the release that carries `/8` does not reach
   the live server as it is, and the answer becomes an issue, as 10.45 says. `dev` is not the live
   server: merging #264 into `dev` deploys nothing, and the live server takes a release when
   `main` is pushed (`docs/hosting-shared-box.md`, "Deploying from `main`").
6. **No Tree on `dev` is given a longer description** by the conversion: the content is the
   owner's. The two fixtures of `ADR-263-description-limit.md` decision 4 are written at the new
   maximum after the conversion.

## Alternatives rejected

- **Keeping `elsa-tree/7` and raising its limit in place, as #102 kept `/3`.** It would spare the
  conversion and so 10.45's write. But a file saying `elsa-tree/7` with a description of 600
  characters would claim a contract it breaks: every reader that applies `/7`'s published 5.7
  refuses it for its length, where it refuses an `/8` file for its number, which says why. The
  exception was the owner's to take (`ADR-231-elsa-tree-7.md` decision 2), and the owner has not
  taken it. The owner
  may: the answer is then a requirement of #264 if it has not run, and a new issue if it has.
- **Waiting for the owner's answer on 10.45 before building.** Nothing on `dev` writes the live
  data; #252 built the PROPOSED reading, and the release is a separate step the owner can hold.
- **Converting a `/7` file only when it is written again.** Every reader would then accept two
  numbers; the loader accepts one, and the store converts on open, as for `/4` to `/6`.

## Consequences

- #264 writes the schema file, the loader's accepted number, `Manifest['format']`, 12.10 in
  `src/tree/` beside 12.7 to 12.9, the store's conversion on open, and runs `npm run migrate` over
  `trees/` and `tests/fixtures/`, recording the count in `tree-format.md` 12.10.3; the example
  Tree's description, which names its format, and section 8's block change with it in one commit
  (`tests/migrate-tree.test.ts`).
- #264 also writes `/8` in the places that name the current number, as #232 did for `/7`: the
  schema route, the dataset's `Link` header and `llms.txt` (`SCHEMA_HREF`), and the specs'
  passages that say `elsa-tree/7` is the current format, each with a dated `[#264]` note.
- `ADR-231-elsa-tree-7.md` carries a dated line naming this ADR; `tree-format.md` 10's "The next
  change will be `elsa-tree/8`" becomes "`elsa-tree/9`".
