# ADR-195-names-on-public-routes: the Authors' names reach a public route in the mention and nowhere else -- not the Tree file, the JSON-LD, `llms.txt`, the sitemap or a header -- and nothing else about an account reaches one; a hidden Tree's names reach none; `deployment.spec.ts` sweeps every public route for addresses, ids and names

- Status: ACCEPTED (frozen) -- 2026-10-03; decides core document 10.40 (whether the names go
  beyond the page) and restates the rule of core document 8 and 9 for the owner's exception
- Issue: #195 -- Architecture: freeze the login by e-mail address and password, and the
  mention of who authored a Tree, the collaborators in the order they joined it
- Spec: `docs/specs/application.md` 39.7, 39.8 (new); 8, 15.3, 16.4, 16.5, 17.2, 17.5, 20.5,
  23.1, 23.5, 25.2, 35.5 amended or stated unchanged, marked **[#195]**
- Amends: `ADR-132-hidden-trees-and-findability.md` decision 1 ("the store's public interface
  has no member that could return one": it gains one, which returns names only);
  `ADR-132-accounts-and-sessions.md` decision 1 (an account's name is shown in the admin area
  and, for an Author, on the public pages of its Trees); `ADR-133-login-and-account-pages.md`
  decision 4 (the name card tells every account but the administrator that its name is
  public, decision 5); `ADR-133-editor-testing.md` decision 5 (the no-cookie sweep of
  `deployment.spec.ts` gains the account sweep, decision 6)
- Depends on: `ADR-195-authors.md`, `ADR-195-the-mention.md`
- Built by: #197

## Context

Core document 8 and 9 held that nothing about a creator reaches a public page or a Tree file;
`application.md` 17.2 says `tree.json` "carries no name", 20.1 that an account's name is "shown
in the admin area only", and 23.1 that no public route reads a draft, a `meta.json` or
`accounts.json`, "the store's public interface has no member that could return one". The owner
has made one exception (#194): who authored a Tree is mentioned on it. The owner named the
mention on the Tree and nothing else. Core document 9 adds: a hidden Tree appears on no public
route.

What carries a Tree beyond its pages today: `/<tree-id>/tree.json`, the published file byte for
byte, under CC BY 4.0 (15); the JSON-LD, whose `Dataset` names as `creator` the Organization of
`CONTENT-LICENSE`'s holder line (16.4); `llms.txt` (16.5, 23.5); the sitemap (16.2, 23.4).
`tests/browser/deployment.spec.ts` sweeps every public route for cookies (20.5).

## Decision

1. **The names go nowhere beyond the mention** (39.4, 39.5). Not into `tree.json`: 17.2 stands,
   the file carries no name and its format stays `elsa-tree/5`. Not into the JSON-LD: 16.4's
   `creator` stays the Organization, and no `author` or `Person` is added. Not into `llms.txt`,
   the sitemap, a `<meta name="author">`, a header or an image's text.

2. **What about an account may reach a public route, restated** (core document 8 and 9;
   `application.md` 8, 20.5): exactly the `name` of each Author of a published, servable Tree,
   in that Tree's mention on its Node pages and on its tile on the public overview. Nothing else
   about any account: no address, no id, no role, no time of joining, and no name of an account
   that is no Author of a published Tree -- the administrator's included.

3. **A hidden Tree's names reach no public route.** The public overview lists published Trees
   only, a hidden Tree's Node pages are the 404 of 23.1, and the store's one new public member
   answers nothing for it (decision 4).

4. **The store's public interface gains exactly one member that reads `meta.json` and
   `accounts.json`**: `authors(id): string[]` (17.5), the names of the Authors of the servable
   published Tree `id` in their order, and `[]` for every id `published(id)` answers `null` for
   -- hidden, unservable, unknown or reserved, one case as 23.1 has it. It answers names and
   nothing else; no member answers a draft, a `meta.json` or an account. 23.1's sentence is
   restated so.

5. **The holder is told.** The account page's name card says, under the field, on every
   account's page but the administrator's: `nameShownPublicly` -- "Shown on the public pages of
   the trees you create or collaborate on." / "Wordt getoond op de openbare pagina's van de
   bomen die u maakt of waaraan u meewerkt." An account's name was the admin area's alone until
   this round (20.1).

6. **The test** is `tests/browser/deployment.spec.ts`, which already sweeps every public route
   (20.5), and gains, with #197, the account sweep: a data directory whose accounts have known
   addresses and ids -- an Author of a published Tree, an Author of a hidden Tree only, an
   account with no role, the administrator -- and a walk of every public route of 4.1, 15, 16
   and 23: the overview in both languages; every Node page of the published Tree in both
   languages; its `tree.json`; the schema; `robots.txt`; `sitemap.xml`; `llms.txt`; an image and
   a theme file; and the hidden Tree's root address, which is the 404. It asserts that no
   response, headers or body, holds any account's address or id; that the hidden-only Author's
   name is in none, every byte read; and that the published Tree's Authors' names are in its
   Node pages and the overview, and in no other response. In each of those, the names are read
   in its markup with every `<script>` element removed but the JSON-LD's: there they stand only
   inside a mention's element, and the markup without the mention's elements holds none of
   them. The scripts are taken out because the inline React payload
   (`self.__next_f.push(...)`) repeats a server component's text for hydration, and
   `Authors.tsx` is one: the disclaimer's sentence stands four times in the body of
   `/ai-act-example/start` and once without its scripts. The JSON-LD stays in, since it must
   hold no name (decision 1). Addresses and ids are asserted absent from every byte, the
   scripts included.

## Alternatives rejected

- **An `authors` list in `tree.json`.** A new format number, a schema and a conversion for a
  mention the owner asked to see on the Tree; a Tree moved to another deployment (17.4) would
  carry the source's account names into a store whose accounts they are not; and every rename
  would change the dataset's bytes, and with them its `version` (19.6).
- **`author` or `creator` entries of type `Person` in the JSON-LD.** A machine-readable claim
  about who wrote a dataset, which search engines and dataset indexes harvest and keep; the
  owner did not ask for it, and the `Organization` stays the holder of the content licence.
- **The names in `llms.txt`.** A signpost with no Tree content beyond the title and the
  description (16.5); the pages it points to hold the mention.
- **A `<meta name="author">` on the Node pages.** The same claim as the JSON-LD's, in the head,
  for crawlers rather than readers.
- **The administrator's name allowed, as the deployment's.** `ADR-195-authors.md` decision 4:
  it is never an Author, so it is never named.

## Consequences

- `src/store/index.ts`: `Store.authors(id)` through `authorsOf` (39.3). The public Node page and
  the public overview read it; no other public route does. #197's.
- `tests/browser/deployment.spec.ts`: the account sweep above, by #197. `findability.spec.ts`
  and `tests/findability/*.test.ts` stand unchanged, and so do 16.4's and 16.5's outputs.
- `src/editor/AccountForms.tsx` shows `nameShownPublicly`; `src/chrome.ts` gains it (3.2's #197
  row).
