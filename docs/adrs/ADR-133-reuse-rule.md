# ADR-133-reuse-rule: the editor renders the public components through one optional prop, `edit`, that names the addresses, the image route and the slots the editor's client components fill; absent on every public page, so the public markup is what it was; the editor's client components live in `src/editor/` and import two pure modules and nothing else of `src/`

- Status: ACCEPTED (frozen) -- 2026-09-26
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 34 (new); 1, 6, 10.9 and 11.2 amended
- Amends: `docs/adrs/ADR-38-modules-and-tests.md` (the module table and the dependency
  lines gain `src/editor/`; the client components are four on the public page and more on
  the admin pages), `ADR-5-repository-layout.md` (the admin page files), `ADR-38-neighbourhood.md`
  (the editor page's bound), `ADR-132-editor-api.md` (decision 8: "the Bubble takes its
  image URL builder as a parameter; #133 decides the mechanism")
- Depends on: `docs/adrs/ADR-133-admin-routes.md`, `ADR-132-draft-and-publish.md` (`Draft`,
  `DraftNode`)

## Context

The owner: "The new datastructure creation looks exactly like the final datastructure".
`ADR-131` decision 5: "The reuse rule of #133 is what makes the editor look like the final
Tree without forking the components", and the end-user pages of `version-1.0` are not
changed in behaviour. The public tree view is `TreeView`, `Bubble` (with the exported
`Interior`), `Branch`, `Carousel`, `EnlargedView`, `Sheet`, `Explainer`, `Slider`, `Logo`,
`LanguageSwitch`, `Disclaimer` (section 6); four of them are client components that "own
exactly one interaction each" and "import no server module" (section 1, 6). Every address
a component builds comes from `src/url.ts` (`nodeHref`, `followHref`, `trailHref`,
`withLang`, `imageHref`), every picture from `imageHref`. A draft's Node is a `DraftNode`
-- a `Node` whose `answers` may lack a key and whose texts may lack a language (19.2) --
and its pictures come from the admin image route (22.6). Every existing browser test must
stay green untouched (#138's DONE WHEN).

## Decision

1. **One optional prop, `edit`, on the components that draw a Node.** `TreeView`, `Bubble`,
   `Interior`, `Carousel`, `EnlargedView`, `LanguageSwitch` and `Explainer` take
   `edit?: EditMode`; every public page leaves it absent, and **a component with `edit`
   absent renders exactly what it renders today** -- not one attribute more. That is the
   whole rule: the public page's markup is unchanged because nothing in it is conditional
   on a value the public page never passes. A component passes `edit` down unchanged to
   the components it renders. No wrapper that post-processes markup, no parallel tree of
   components, no second `Bubble`.

   ```ts
   // src/editor/mode.ts -- server side; the type the public components take
   export interface EditMode {
     treeId: string
     links: Links                 // decision 3
     languages: string[]          // the draft's declared languages, for the rim's tags
     words: EditorWords           // the chrome strings the editor's client components say
     slots: EditorSlots           // decision 2
   }
   ```

2. **The slots are the places the editor adds something, named once, filled by the build
   issues.** Each is a function the server component calls where the control belongs and
   renders the result; an absent slot renders nothing. #138 lands **every** call site in
   the server components; #139 to #142 supply the functions from `src/editor/` and edit
   the editor's page, **never a server component again**, so four issues in parallel share
   no file but `src/chrome.ts`.

   | Slot | Called by | Where, and what fills it (issue) |
   |---|---|---|
   | `field(path, value, limit)` | `Interior`, `Carousel`, `EnlargedView`, `TreeView` (an Option's title), `Bubble` (a Terminal's outcome) | Every text of `ADR-133-bubble-edited-in-place.md`; `Field` (#138) |
   | `imageSlot(node)` | `Interior` | The empty slot as a picker; `ImageSlot` (#140) |
   | `stripAdd(node)` | `Carousel` | The `+` thumbnail; `ImageSlot` (#140) |
   | `enlargedControls(node, index)` | `EnlargedView` | The fields and four controls under the picture (#140) |
   | `structure(node)` | `TreeView` (the Answer row) | The three buttons, or the `+` for the missing Answer; `Structure` (#139) |
   | `linkMenu(node, link)` | `TreeView` (each Answer and Option button) | The `...` control; `Structure` (#139) |
   | `sideAdd(node)` | `TreeView` (the fan; the Overlay's list) | The side-bubble `+`; `Structure` (#139) |
   | `stepMenu(node)` | `Bubble` (the rim above) | The `...` with `removeEnd` and `deleteStep`; `StepMenu` (#139) |
   | `mark()` | `Interior` (the description's rim) | The mark button; `Marker` (#141) |
   | `onTermClick` | `Explainer` | Open the explainer Sheet instead of the tap toggle; (#141) |

   A slot's function is a server-side function returning a React element (the client
   component with string props), so a server component never imports a client component
   it does not render on the public page; what it imports is the `EditMode` type.

3. **The addresses and the pictures come from `links`, with the public functions as the
   default.** Every component that builds an address or a picture URL calls
   `links.node(a)`, `links.follow(a, id)`, `links.trail(a, i)`, `links.withLang(a, lang)`
   and `links.image(file)`, where `links` is `edit?.links ?? PUBLIC_LINKS` and
   `PUBLIC_LINKS` is the five functions of `src/url.ts` as they are. The editor's `links`
   prefixes the first four with `/admin/trees` (`ADR-133-admin-routes.md`, decision 2) and
   makes the fifth `adminImageHref(treeId, file)` (22.6). `src/url.ts` is unchanged but for
   `adminImageHref`, which #132 already gave it; the prefixing lives in
   `src/editor/links.ts`, server side.

4. **The editor's client components are leaves in `src/editor/`**, wrapped by one provider.
   `Editor` (client) wraps the editor page's tree view and holds the write queue, the
   indicator and the session Sheet (`ADR-133-autosave.md`); `Field`, `ImageSlot`,
   `AttachSheet`, `Structure`, `StepMenu`, `Marker`, `ExplainerSheet`, `Panel`, `LoginForm`
   and `NewTreeForm` are its children, take **strings and ids** as props, and reach the
   queue through React context. They import, of `src/`, exactly two modules:
   `src/tree/measure.ts` (the counting rule, `ADR-133-bubble-edited-in-place.md` decision 4)
   and `src/markdown.ts` (the rendered form of a description after an edit), both pure --
   `markdown.ts` imports `measure.ts` and types, and must stay so; a test asserts that
   neither imports `node:` modules, `ajv` or the schema. `src/editor/writes.ts` is the one
   module that calls `fetch` against `/admin/api/`, one function per row of 22.1 the
   editor uses; `src/editor/slug.ts` derives ids. Nothing in `src/editor/` reads the file
   system, the environment or a request; nothing in `src/components/` imports
   `src/editor/` except the `EditMode` type.

5. **What edit mode does not render**: no neighbour frames and no `data-slide` (the
   `Slider` is mounted with no neighbours, so every control is a plain link,
   `ADR-133-structure-editing.md` decision 3); no JSON-LD script, no `hreflang` links, no
   canonical link, no dataset link (the page is `noindex`, 20.9); no share button
   (`ADR-133-admin-routes.md`, decision 7). The strip, the enlarged view, the Overlays and
   the explainer panels render as on the public page, with the slots of decision 2 added.

6. **The types.** `src/tree/types.ts` gains `NodeContent`: the fields `Interior`,
   `Carousel` and `EnlargedView` read (`id`, `title`, `description`, `sources`, `images`,
   `explainers`), which a `Node` and a `DraftNode` both satisfy; those three components
   take `NodeContent`. `TreeView` and `Bubble` take `Node | DraftNode` and read `kind`
   and `answers` through one helper, `linksOf(node)`, which answers `{ yes?, no?,
   terminal? }`; where a public `Node` is passed nothing differs. `parseUrl`, `centreOf`
   and `contentLanguage` take the two members of `Tree` they use (`manifest`, `getNode`)
   as a narrower type, `Readable`, so a `Draft` passes where a `Tree` did; no behaviour
   changes and `url.test.ts` and `neighbourhood.test.ts` run unchanged.

7. **The editor page reads at most twelve Nodes.** `src/app/[lang]/admin/trees/[tree]/[...path]/page.tsx`
   is `authenticated → permit('read') → store.drafts.draft(by, id) → parseUrl → centreOf →
   the asides by id → TreeView`: the centre and its chain (at most 3, 10.9), the centre's
   Option targets (at most 8), and the titles of its Answer targets from the index. It
   does not call `neighbourhood()`, because nothing is placed (decision 5). Twelve is
   under 11.2's seventeen, and the rule that a page never carries the Tree holds in the
   editor as on the public page; the picker of `ADR-133-structure-editing.md` decision 7
   carries ids and titles from the index, never Nodes.

8. **The tests that hold the rule.** `views.test.tsx` gains two assertions: the public
   render of every fixture contains no `[data-field]`, no `contenteditable`, no element
   whose class starts with `editor-`; and the same fixtures rendered with an `edit` whose
   slots are all absent produce the **same markup string** as without it, save the
   addresses `links` rewrote. Every existing browser spec is run unchanged by #138 to
   #142, and each pull request pastes the counts (#138's DONE WHEN); a change to a public
   spec file in one of those branches is a defect the Verifier is told to look for.

## Alternatives rejected

- **A parallel set of components for the editor** (`EditorBubble`, `EditorTreeView`).
  Two Bubbles to keep in step at every amendment of section 10; the owner's "looks exactly
  like" would be true on the day it merged and false a month later.
- **A wrapper that walks the rendered markup and makes elements editable** (by
  `data-field` attributes the public components would emit). Attributes on the public
  page for the editor's sake, and a client component reaching into React-owned DOM,
  which React does not promise to leave alone.
- **A boolean `editable` prop with the client components imported by the server
  components directly.** Every server component would import every editor component,
  and the four build issues after #138 would each edit `TreeView.tsx`, `Bubble.tsx` and
  `Carousel.tsx` in parallel. The slots put the call sites in one issue and the controls
  in the others.
- **Passing the whole `Chrome` object to the client components.** Functions are not
  serialisable across the server-client seam; the components already take words as
  strings (`SheetWords`), and `EditorWords` is the same idiom.
- **The slide in the editor.** See `ADR-133-structure-editing.md`.
- **Letting `Field` import `validate.ts`.** It carries `ajv` and the schema into the
  client bundle; the three counting functions are twenty lines and move.
- **Widening `Node` so that `answers` may lack a key everywhere.** Every public component
  would then have to handle a half-question that no published Tree can hold; the union at
  two components and a helper keeps the public type strict.

## Consequences

- #138 lands: `src/editor/mode.ts`, `links.ts`, `Editor.tsx`, `Field.tsx`, `writes.ts`,
  `src/tree/measure.ts` (with re-exports from `validate.ts`), `NodeContent`, `Readable`,
  `linksOf`, every slot call site, and the editor page. `application.md` 6 gains the files
  and the dependency lines `app -> editor`, `components -> editor (the EditMode type)`,
  `editor -> tree/measure, markdown`; section 1's client-component row gains "on the
  admin pages, the editor's".
- `tests/editor/imports.test.ts` (#138) asserts decision 4's import rule by reading the
  files; `views.test.tsx` gains decision 8's two assertions.
- The `EditMode` type and the slot table are the contract the later issues build
  against; adding a slot is an `architecture` issue, not a build's convenience.
