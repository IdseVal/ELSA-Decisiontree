# ADR-38-theme-delivery: a Tree's Theme becomes one server-rendered `<style>` element of CSS custom properties and `@font-face` rules, its files come from a route that serves only what the Theme names, and the stylesheet holds no colour and no font name

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #38 -- Architecture: freeze the version 0.2 application contracts
- Spec: `docs/specs/application.md`, sections 4.1, 4.3, 5.5, 13
- Core document: 3.1, 3.2, section 9 ("the frontend must never carry a lab's branding in
  its code"), open item 10.25

## Context

The owner (#35) wants the look "hosted in the datastructure and not in the frontend
itself, so a different ELSA-lab can load in their own datastructures and their logo is
displayed". Issue #37 froze what a Tree carries: a `theme` block of `logo`, `fonts` and
`colours`, each part complete or absent, naming files in the Tree's own `theme/` folder
(`tree-format.md` 4.3). Issue #36 measured the first lab's identity. This issue is the
mechanism between them.

Three constraints shape it. Nothing may be fetched from a third party at run time (core
document 3.1, section 7; `application.md` section 1). A Tree is third-party data, so the
Theme is untrusted input that this section writes into a stylesheet -- the one place in
this application where author text becomes code. And `tree-format.md` 4.3.3 left the
derived values -- a hover shade, the text colour on an accent button -- to this issue.

## Decision

1. **One `<style>` element, emitted by the root layout on every page**, built by
   `src/theme.ts` and by nothing else. It holds the `@font-face` rules and a `:root`
   block of `--elsa-*` custom properties.
2. **The seven colour roles become `--elsa-<role>` verbatim.** There is no eighth.
3. **Three colours are derived at render time**, because CSS cannot compute contrast:
   `--elsa-on-accent`, `--elsa-on-accent-secondary`, `--elsa-on-danger`, each whichever
   of `text` and `background` has the higher WCAG contrast against that accent.
   Everything else -- hover shades, borders, disabled states -- is derived in CSS with
   `color-mix()`. `theme.ts` computes three values; it is not a colour system.
4. **Dark is derived, not declared:** `logo.dark` is used when the relative luminance of
   `background` is below 0.5. The format needs no key for it and an author cannot get it
   wrong.
5. **Fonts:** one `@font-face` per file, `font-weight` and `font-style` reproduced
   verbatim, `src` pointing at `/theme/<file>`, `font-display: swap`. The families become
   `--elsa-font-body` and `--elsa-font-heading`.
6. **`GET /theme/<file>`** (`application.md` 5.5) serves one file, with the path-safety
   rule of the image route: the name must match `tree-format.md` 3.6 **before** anything
   touches the file system, and the resolved path must still be inside the Tree's
   `theme/` folder afterwards. `theme` joins `images` as a reserved Tree id.
7. **`themePath` resolves only what the Theme references** -- not merely what is in the
   folder. `tree-format.md` 4.3.2 puts a font's licence text in `theme/` and says the
   loader ignores it; serving the referenced set is that sentence made into a rule, and
   it means an author's stray file, note or draft is never public. This is the one way
   `themePath` is stricter than `imagePath`.
8. **Both asset routes send `X-Content-Type-Options: nosniff` and
   `Content-Security-Policy: default-src 'none'; sandbox`.** An SVG is a document: opened
   directly, script inside it would run on this origin, and the format allows `.svg` for
   a logo from a Tree we did not write. The header makes anything these routes serve
   inert whatever it contains.
9. **Escaping is `theme.ts`'s, listed in `application.md` 13.3**: colours re-checked
   against `^#[0-9a-f]{6}$` at the sink; a font `family` emitted in single quotes with
   `'` and `\` escaped and refused outright if it holds a control character, newline,
   `;`, `{`, `}` or `<`; the whole emitted string checked for `</style>` before it is
   placed. A value that fails falls back to the default for that role rather than
   breaking the page.
10. **The stylesheet contains no colour literal and no `font-family` literal** -- only
    `var(--elsa-*)`. `stylesheet.test.ts` asserts it. That is core document section 9,
    mechanically, rather than as a thing reviewers must remember.
11. **The default is one palette and one type stack in `src/theme.ts`**, used whole for
    any part a Theme does not give. The parts are independent; half a Theme is never
    merged with half a default, because a palette is designed as a set.

## Alternatives rejected

- **`next/font` for the Tree's fonts.** The framework's own answer, with subsetting and a
  preload for free. It vendors fonts at *build* time, and these arrive at *run* time with
  the Tree -- a lab loading its own Tree must not need a rebuild. It would also make the
  frontend's build depend on a Tree's content, which is the coupling the whole
  interoperability requirement exists to prevent.
- **A generated stylesheet route, `GET /theme.css`.** Cacheable, and it keeps the
  document smaller. Rejected: it is a second request before first paint, so a themed page
  would flash the default palette, and it splits "what the Theme is" across a route and a
  layout. The block is a few hundred bytes inside HTML that was going to be sent anyway.
- **Inline `style` attributes on the elements that need a colour.** No `<style>` element
  to escape, which removes one class of bug. Rejected: it puts theme knowledge in every
  component, defeats `stylesheet.test.ts`, and makes `color-mix()`-derived shades
  impossible without computing each one per element in TypeScript.
- **Serving the whole `theme/` folder as static files.** One line, and every route
  question disappears. Rejected: it publishes whatever an author leaves in the folder --
  drafts, notes, a licence text, an unreleased logo -- and it needs the folder to be
  known to the build, which `ADR-5-lazy-loading.md` already rejected for images for the
  same reasons.
- **More colour roles, or letting a Theme supply arbitrary CSS.** The most flexible and
  the least interoperable: seven roles are a contract every Tree can meet and every
  frontend version can honour, while arbitrary CSS would make a Tree depend on this
  frontend's class names and would hand third-party data a stylesheet. `tree-format.md`
  4.3.3 closed the set; this ADR keeps it closed.
- **Trusting the loader's validation and emitting colours and families unchecked.** The
  loader does validate, and the check at the sink is three lines. Validation and escaping
  answer different questions -- "is this a valid Tree" and "is this safe to concatenate
  into CSS" -- and the second one is asked in only one module.
- **A `dark` key or a `mode` key in the format to say when the dark logo is used.**
  Another key for authors to get wrong, when the palette already says whether it is dark.

## Consequences

- Changing a colour in a Tree's `tree.yaml` and restarting changes the page, with no code
  change. Issue #40's pull request demonstrates exactly that.
- The example Tree and the first Tree can ship deliberately different Themes on the same
  build, which is what makes the interoperability requirement visible rather than
  claimed.
- A Tree with no Theme is a first-class case, tested by the interoperability test, not an
  error path.
- `theme.spec.ts` records every request a themed page makes and asserts they are all
  same-origin: core document section 7's "nothing fetched from a third party at run time"
  becomes a measurement.
- Core document 10.25's format side was settled by #37; nothing here needs the owner's
  answer to proceed, because the mechanism is the same whatever licence the fonts carry.
