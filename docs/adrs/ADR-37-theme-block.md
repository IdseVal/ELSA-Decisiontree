# ADR-37-theme-block: the manifest carries an optional `theme` with a logo, up to two font families by role, and exactly seven colours by role; every part present is complete; every file is in the Tree's `theme/` folder

- Status: ACCEPTED (frozen) -- 2026-09-10
- Issue: #37 -- Architecture: freeze elsa-tree/2
- Spec: `docs/specs/tree-format.md`, sections 3.6, 4.3; rule V-THEME

## Context

The owner (issue #35): the look must be "hosted in the datastructure and not in the
frontend itself, so a different ELSA-lab can load in their own datastructures and their
logo is displayed". The core document (3.1, 3.2, 6, 9, revised 2026-09-09): a Tree
carries its Theme -- logo, colours and fonts; theme assets are files in the Tree's
folder; nothing is fetched from a third party at run time; the frontend never carries a
lab's branding in its code; a Tree without a Theme gets a plain default look. Research
issue #36 measures the identity of https://ai4sfs.org and has not merged; its first look
found two logo variants (colour, and white for dark backgrounds), two font families
(Open Sans for body text, Nova Square for display headings, self-hosted as woff2), and
about ten colours of which six or seven have distinct roles. Fonts and logos carry
licences (core document open item 10.25).

The frontend must style any third-party Tree without a code change (core document 9),
so what it reads from the Theme must be finite and known in advance -- the same
constraint that made the terminal outcome set closed (`ADR-4-terminal-marker.md`).

## Decision

1. **`theme` is an optional key of the manifest** with up to three parts: `logo`,
   `fonts`, `colours`. A Tree without `theme` loads and is shown in the frontend's
   default look. A `theme` must have at least one part (V-THEME).
2. **Each part is independent and, when present, complete.** A Tree may give colours
   without fonts, or a logo alone. But a `colours` block has all seven roles, a font
   family has all its files with weight and style, a logo has its light variant and its
   alternative text. The frontend never merges half a Theme with half a default; where a
   part is absent the spec states what the frontend does (title text instead of a logo;
   default type stack; default palette).
3. **`logo`**: `light` (required; the variant for a light background), `dark`
   (optional; for a dark background, else `light` is used), `icon` (optional; the tab
   icon), `alt` (required; localised, the lab's name), `url` (optional; where the logo
   links, opened in a new tab, never fetched).
4. **`fonts`**: a list of at most two families, at most one per `role` in the closed
   set `body`, `heading`. A family has `family` (the CSS name), `files` (each a `.woff2`
   file with a `weight` string that is a number or a range, and a `style` of `normal`
   or `italic`) and a required `licence` line, reproduced as written like an Image's
   credit.
5. **`colours`**: exactly seven roles -- `background`, `surface`, `text`,
   `text-muted`, `accent`, `accent-secondary`, `danger` -- each `#` and six lowercase
   hex digits. Everything else the frontend needs it derives (hover shades, text on an
   accent, borders); how is #38's.
6. **Files live in `trees/<tree-id>/theme/`**, flat, named by the image file name
   grammar extended with `.ico` and `.woff2`, referenced by bare name, resolved only
   inside that folder; the validator checks they exist. A file is served as a file and
   never inlined, so an SVG cannot carry a script into the page. Unreferenced files
   (licence texts) are ignored.

## Alternatives rejected

- **A free-form theme (any colour role, any font role, any key).** The frontend cannot
  style a role it has never heard of without a code change, which is the interoperability
  failure the core document forbids. A third-party Tree with a `primary` colour would
  render in the default look and its author would not know why. A closed set makes the
  frontend's styling table complete by construction; a Tree that needs an eighth role
  needs a new format number, visibly.
- **More colour roles now (`link`, `border`, `on-accent`, `heading`).** Each is
  derivable from the seven with a contrast rule or a shade, and each extra required
  role is one more thing every third-party author must choose correctly. The seven
  cover the measured ai4sfs.org roles and every surface the tree view has (page,
  Bubble, text, muted text, two Branch kinds, the prohibited outcome). Adding a role
  later is a format bump, which is the right cost for widening a contract three labs
  may depend on.
- **Partial palettes allowed, defaults filled in per key.** A palette is designed as a
  set: a lab's `accent` on the frontend's default `background` may be unreadable, and
  the author would not see it because the validator passed. All-or-nothing per part
  keeps the responsibility for contrast with the person who chose the colours.
- **A single `logo` file, no light/dark distinction.** The measured site serves a white
  variant for dark headers; a single file forced onto a dark Bubble outline or a light
  page is wrong on one of them. `dark` is optional, so a lab with one logo writes one
  line.
- **A CSS file in the Tree (`theme/theme.css`).** The most flexible, and the most
  dangerous: arbitrary CSS from a data folder is code, can load remote resources, can
  hide the disclaimer, and cannot be validated for the things that matter (files exist,
  colours are colours). Roles as data are what the frontend can check and what a
  non-programmer can fill in.
- **Fonts by name only, resolved from Google Fonts or a system stack at run time.**
  Nothing is fetched from a third party (core document 7, 9); and a system stack
  differs per visitor, which defeats "their own identity".
- **Fonts in any format (`.ttf`, `.otf`, `.woff`).** One format keeps the file-name
  grammar one line and the `@font-face` rule one `src`; woff2 is supported by every
  browser the application targets and is the format the measured site serves.
- **A licence per file or a licence-text file reference.** A licence attaches to a
  family; a line per family with a pointer to the text next to the font files is what
  the SIL Open Font License asks for and what an author can write without tooling.

## Consequences

- Research issue #36's "role -> value" table maps one-to-one onto this block: the seven
  colour roles, body and heading fonts, light and dark logos. If #36 finds a role the
  block cannot hold, that is a new architecture issue, not a silent extension.
- Core document open item 10.25 (may the ai4sfs.org logo and fonts be copied, under
  what licence line) is answered on the format side -- every font carries its licence
  line, and the logo its alternative text -- and remains the owner's on the substance.
- The frontend (#38, #40) emits the colours as CSS custom properties, the fonts as
  `@font-face` rules and the logo as an `<img>`, all pointing at a theme route with the
  same path-safety rule as the image route; its default look is what applies when a
  part is absent.
- A theme folder is optional, so every existing fixture stays valid; #39 adds a Theme
  to one interoperability fixture so both paths are covered.
