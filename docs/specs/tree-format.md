# Tree file format -- `elsa-tree/2`

> Status: FROZEN -- 2026-09-10 (issue #37). This document is the interoperability
> contract: any Tree that follows it loads in the ELSA decision-tree frontend without a
> code change. Changing it requires a new `architecture` issue and a new format number.
>
> **What this version is.** `elsa-tree/2` replaces `elsa-tree/1` (frozen 2026-09-03,
> issue #4; kept readable on branch `version-0.1`, file `docs/specs/tree-format.md`
> there). The owner changed three requirements the old format rested on
> (`docs/CORE_DOCUMENT.md`, revised 2026-09-09; `docs/adrs/ADR-35-version-0-2-rework.md`):
> a Tree is **one text file** instead of a folder of Node files; the Tree carries its
> **Theme** (logo, fonts, colours); and every user-facing text has a **maximum length**,
> because nothing on the page may scroll. Everything else is carried over unchanged:
> ids and Node references, localised text, the Markdown subset, image file names and the
> `images/` folder, Sources, Images, Answers, Options, the terminal marker, the three
> kinds of Node, strict validation, and the reservation for Cross-links.
>
> **Until the loader of issue #39 merges, the code on `dev` still reads `elsa-tree/1`**,
> and the two Trees under `trees/` are still written in it. Section 12 specifies the
> mechanical conversion that #39 scripts. Nothing new may be built against
> `elsa-tree/1`.
>
> Vocabulary: the canonical names from `docs/CORE_DOCUMENT.md` section 5 -- **Tree**,
> **Node**, **Link**, **Answer**, **Option**, **Terminal**, **Image**, **Source**,
> **Trail**, **Cross-link**, **Bubble**, **Branch**, **Carousel**, **Theme** -- are used
> here with exactly that meaning. The decisions behind this document are recorded one
> per file in `docs/adrs/ADR-37-*.md`; the decisions carried over from `elsa-tree/1` in
> `docs/adrs/ADR-4-*.md` (section 11).

This document is written so that a third party -- another ELSA lab, or the owner of this
project -- can author a complete Tree from it alone, in a text editor, with no other
reference. Section 8 contains a complete, loadable example Tree in English and Dutch;
section 9 shows what changes for a Tree with a single language; section 12 says how a
Tree written in `elsa-tree/1` is converted.

## 1. Overview

A Tree is a **folder** holding **one text file** and up to two folders of asset files:

```
trees/
  <tree-id>/
    tree.yaml               the whole Tree: the manifest, the Theme, and every Node
    images/                 the Tree's Images, placed here by hand (optional folder)
      <file>
    theme/                  the Theme's files: logo, icon, fonts (optional folder)
      <file>
```

- `tree.yaml` is a **YAML 1.2 stream**: a sequence of YAML documents separated by
  `---` lines. The **first document is the manifest** (identity, languages, root,
  metadata, Theme). **Every following document is one Node**, addressed by its `id`
  key. Section 4 has the manifest, section 5 a Node, section 3.7 the YAML rules.
- Every piece of user-facing text is a **localised text**: a mapping from language tag
  to string, holding every language the Tree declares (section 3.3).
- A Node is one of three kinds, decided by its own content: a **question Node** (has
  Answers), a **Terminal** (has the terminal marker), or an **explanation Node** (has
  neither; it is reached through an Option).
- Every user-facing text field has a **maximum length**, and every list a maximum
  count, so that a Node fits inside its Bubble on the screen without scrolling
  (section 5.7). The validator, not the screen, is what stops an author.
- The Theme is optional. A Tree without one loads and is shown in the frontend's plain
  default look (section 4.3).

All folders under `trees/` are read by the loader; nothing else in the repository is
part of a Tree. Which Tree a deployment serves is outside this contract
(`docs/specs/application.md` section 2).

## 2. Files and names

| Path | Meaning | Rule |
|---|---|---|
| `trees/<tree-id>/` | One Tree. | `<tree-id>` is an **id** (section 3.1). The folder name *is* the Tree's id; there is no `id` field in the manifest. |
| `trees/<tree-id>/tree.yaml` | The whole Tree (section 4, section 5). | Required, exactly this name. |
| `trees/<tree-id>/images/<file>` | One image file. | `<file>` follows the image file name rule (section 3.5). Flat: sub-folders are not read. The folder may be absent if no Node has Images. |
| `trees/<tree-id>/theme/<file>` | One Theme file: a logo, an icon, a font. | `<file>` follows the theme file name rule (section 3.6). Flat. The folder may be absent if the Tree has no Theme or the Theme names no files. |

Anything else inside a Tree folder (a `README.md`, a `NOTES.md`, a `drafts/` folder,
a licence text next to a font, editor files) is ignored by the loader. That is the place
for work in progress that must not yet be validated. There is no `nodes/` folder any
more; a folder of that name is ignored like any other.

## 3. Conventions used throughout

### 3.1 Ids

An id is lowercase ASCII letters and digits, with single hyphens between groups:

```
^[a-z0-9]+(-[a-z0-9]+)*$        at most 64 characters
```

Examples: `start`, `prohibited-practices`, `jurisdiction-1`, `annex-iii-area-5`. Not
allowed: capitals, spaces, underscores, dots, a leading or trailing hyphen, two hyphens
in a row, and the colon `:` (reserved for Cross-links, section 10). Ids are used
verbatim in URLs and in the Trail carried by a shared link, which is why the alphabet is
this small. **The grammar is unchanged from `elsa-tree/1`**, so no URL and no shared
link changes when a Tree is converted.

A Node's id is the value of its `id` key (section 5). Since a Node no longer has a file
of its own, the `id` key is the one and only place the id is written, and every Node
document must have one.

### 3.2 Node references

Wherever a Link names its target, it does so with a **Node reference**: the id of a
Node in the same Tree, written bare, e.g. `target: social-scoring`. In `elsa-tree/2` a
reference containing a colon is an error (rule V-CROSS); the shape `tree-id:node-id`
is reserved for future Cross-links and must not be used yet.

### 3.3 Languages and localised text

The manifest declares the languages the Tree provides as a list of **language tags**:
lowercase [BCP 47](https://www.rfc-editor.org/info/bcp47) tags such as `en`, `nl`,
`de`, `pt-br`:

```
^[a-z]{2,3}(-[a-z0-9]{2,8})*$
```

A **localised text** is a mapping from language tag to string. It must contain a
non-empty string for **every** language the manifest declares, and no other keys:

```yaml
title:
  en: Does the AI Act apply?
  nl: Is de AI-verordening van toepassing?
```

The first language in the manifest's list is the Tree's **default language**: the one
the frontend shows before the user chooses. Consequences of this rule:

- A Tree that provides only Dutch declares `languages: [nl]` and writes `nl:` only.
- A language is added to a Tree by adding it to the manifest *and* to every localised
  text. Until that is done the Tree does not validate; a half-translated language is a
  broken Tree, not a partially working one.
- The frontend never has to fall back for Tree content. (Fallback for UI chrome is
  `docs/specs/application.md` section 3.)
- **Every language is held to the same maximum length** (section 5.7). The Bubble
  does not grow for a language whose words are longer; the text must be cut to fit.

Strings that are **not** localised: image and theme file names, URLs, credits (an
attribution is reproduced as written), font family names, licence lines, colours, ids,
and everything under `metadata`.

### 3.4 Plain text and rich text

- **Plain text** fields (`title`, an Option's `title`, a Source's `label`, an Image's
  `description`, the logo's `alt`) are a single line. Markdown is not interpreted in
  them.
- **Rich text** fields (a Node's `description`, the manifest's `description`) are
  written as a YAML literal block scalar (`description:` then `en: |`) and may use this
  subset of [CommonMark](https://commonmark.org/): paragraphs separated by a blank line,
  `*emphasis*`, `**strong**`, bulleted lists (`- `), numbered lists (`1. `), and links
  `[text](https://...)`. The frontend opens such links in a new tab, like Source
  links. Nothing else is part of the contract: headings, tables, raw HTML, embedded
  images and footnotes are not supported. Raw HTML is an error (rule V-HTML). Images
  belong in `images:`, never inline.

Writing multi-paragraph text by hand:

```yaml
description:
  en: |
    The first paragraph. It can run over several lines of the file; the line breaks
    inside a paragraph are joined into spaces when rendered.

    A blank line starts the second paragraph. A list:

    - one entry
    - another entry
  nl: |
    De eerste alinea.

    De tweede alinea.
```

Rich text is short in `elsa-tree/2`: a description has at most 600 characters and must
fit an estimate of 8 rendered lines (section 3.8, section 5.7). Several paragraphs and
a list still fit, but a Node that needs more becomes several Nodes (core document 3.3,
item 8).

### 3.5 Image file names

```
^[a-z0-9]+([._-][a-z0-9]+)*\.(png|jpg|jpeg|gif|webp|svg)$        at most 128 characters
```

Lowercase only, no spaces, no path separators, no `..`. Lowercase is required because
the files are edited on Windows and served from Linux, where `Map.PNG` and `map.png`
are different files. A Node refers to an image by this bare file name; the loader
resolves it inside the Tree's own `images/` folder and nowhere else. Unchanged from
`elsa-tree/1`.

### 3.6 Theme file names

The same grammar, with the extensions a Theme needs:

```
^[a-z0-9]+([._-][a-z0-9]+)*\.(svg|png|webp|ico|woff2)$           at most 128 characters
```

A logo or icon is `.svg`, `.png`, `.webp` or `.ico`; a font file is `.woff2` and nothing
else (one modern, compressed format; every browser the application supports reads it).
The Theme refers to a file by this bare name; the loader resolves it inside the Tree's
own `theme/` folder and nowhere else. A file is served as a file, never inlined into the
page: an SVG logo is shown through `<img>`, so a script inside it cannot run. (How the
files are served is `docs/specs/application.md`, issue #38.)

### 3.7 YAML rules that matter

- `tree.yaml` is parsed as a **YAML 1.2 stream**. In YAML 1.2 the words `yes` and `no`
  are ordinary strings, which is what the `answers` block relies on. Some older tools
  (YAML 1.1, e.g. Python's PyYAML by default) turn them into booleans; a loader must use
  a 1.2 parser, and an author who uses another tool to generate the file must make sure
  `yes` and `no` stay strings.
- **Documents are separated by a line that is exactly `---`**, optionally followed by a
  comment. The first document may start without a `---` line. Each document is a
  mapping at its top level. A `...` document-end line is allowed by YAML and not needed.
- **Write the Node's id on the separator line as a comment, and first in the document:**

  ```yaml
  --- # social-scoring
  id: social-scoring
  title:
    ...
  ```

  This is a writing convention, not a validity rule: the loader reads `id:` wherever it
  is in the document. It is what makes a file of several thousand lines navigable: a
  search for `# social-scoring` or `id: social-scoring` lands on the Node, and an
  editor's search for `^--- #` lists every Node in the file, in order, as a table of
  contents. The migration writes this shape (section 12) and the example (section 8)
  shows it.
- **The order of Node documents is free.** The loader indexes Nodes by `id`, not by
  position. Put them in the order that reads best: the root first, then the walk, with
  each question Node followed by its explanation Nodes, is the recommendation; the
  migration writes the root first and the rest by file name in byte order (section
  12.1).
- **Quote version numbers**: `version: "1.0"`. Unquoted, `1.0` is a number and is
  rejected (rule V-META). **Quote colours**: `background: "#ffffff"`; unquoted, `#`
  starts a comment and the value is lost. **Quote font weights**: `weight: "400"`.
- Unknown keys are errors (rule V-KEYS). This is deliberate: a misspelt `anwsers:`
  must fail loudly, not silently become an explanation Node. The only place for
  free-form keys is `metadata`.
- A YAML error inside one Node document is reported for that document, with its line
  number, and does not stop the other documents from being read and checked (rule
  V-YAML). One mis-indented line breaks one Node, not the file.
- File encoding is UTF-8 without a byte-order mark. Line endings do not matter.
- Comments (`# ...`) are welcome anywhere and are ignored by the loader. A comment line
  is the right place for an author's notes between Nodes.

### 3.8 How text is measured

The limits of section 5.7 are checked on the **counted text** of a field:

1. Take the string value. Remove leading and trailing whitespace (a block scalar ends
   with a line break; it is not counted).
2. Replace every Markdown link `[text](url)` by its `text`. The URL is not shown to the
   reader, so it does not take space in the Bubble. Every other character counts,
   including emphasis markers (`*`, `**`), list markers and punctuation: this is a
   little conservative and keeps the rule simple.
3. **Length** is the number of Unicode code points of the result. Not bytes, not UTF-16
   units: `é` is one character whether or not it is precomposed, so authors should save
   files in NFC (the normal form every editor writes). A line break inside the text
   counts as one character.

For rich text the height matters more than the length: five short paragraphs take more
of the Bubble than one long one. So rich text is also checked against an **estimated
line count**, computed from the counted text as a renderer would lay it out at the
assumed width of 75 characters per line (section 5.7):

1. Split the counted text into **blocks**. A new block starts on a line that follows a
   blank line, and on every line that begins a list item (`- `, or digits followed by
   `. `). The lines up to the next block belong to the current block (a paragraph's
   wrapped lines; a list item's continuation lines). A run of one or more blank lines
   between two blocks is one **break**.
2. For each block, join its lines with single spaces and count the characters `c`; the
   block takes `max(1, ceil(c / 75))` lines.
3. The estimate is the sum over blocks, plus one line per break (paragraph spacing is
   one line height; consecutive list items have none).

Worked example, English text of the root Node in section 8: three blocks, two breaks.
The first paragraph has 163 characters (3 lines), the second 135 (2 lines), the list
item 61 (1 line): `3 + 2 + 1` block lines `+ 2` breaks `= 8` estimated lines, which is
exactly the maximum. The validator reports the estimate next to the maximum so that the
author knows how much to cut.

## 4. The manifest: the first document of `tree.yaml`

```yaml
format: elsa-tree/2
languages: [en, nl]
root: start
title:
  en: Does the EU AI Act apply to my agrifood AI system?
  nl: Is de EU AI-verordening van toepassing op mijn agrifood-AI-systeem?
description:                       # optional
  en: |
    An interactive walk through the applicability of Regulation (EU) 2024/1689.
  nl: |
    Een interactieve doorloop van de toepasselijkheid van Verordening (EU) 2024/1689.
metadata:
  version: "1.0"
  author: ELSA-Lab for sustainable food systems, Wageningen University
theme:                             # optional; section 4.3
  ...
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `format` | yes | string, exactly `elsa-tree/2` | The version of this contract the Tree is written against. A loader that does not know the value rejects the Tree. Only the first document has this key; a Node document with `format` is an error (V-KEYS). |
| `languages` | yes | list of language tags, non-empty, distinct | The languages every localised text in the Tree provides. First entry is the default language. |
| `root` | yes | Node reference | The Node the walk starts at. Must be a question Node or a Terminal, never an explanation Node. |
| `title` | yes | localised text, plain, at most 80 characters | The Tree's name, shown by the frontend. |
| `description` | no | localised text, rich, limits as a Node's description | What the Tree is about. |
| `metadata` | yes | mapping | `version` (non-empty string) is required. Any other keys are the author's own; the loader keeps them and does not interpret them. |
| `theme` | no | Theme (4.3) | The look the frontend shows for this Tree. Absent: the frontend's plain default look. |

### 4.1 Where the manifest stops and the Nodes begin

The manifest is the first document of the stream, and only the first. It is recognised
by position, not by content; that it carries `format` is a consequence. The second
document onwards are Nodes (section 5). A stream with only one document is a Tree
without Nodes and is rejected (V-NODE, at least one Node; V-ROOT, the root must exist).

### 4.2 The Tree's id

The folder name is the Tree's id, as in `elsa-tree/1`. The manifest has no `id` key
(V-KEYS). The Tree id appears in every Node URL, so renaming the folder breaks every
shared link; do not.

### 4.3 The Theme

A Tree carries the look its lab wants: logo, fonts, colours. The frontend reads them
from here and never carries a lab's branding in its own code (core document 3.2, 9).
Everything the Theme names is a file in the Tree's own `theme/` folder; nothing is
fetched from anywhere else at run time.

```yaml
theme:
  logo:
    light: elsa-lab-logo.svg               # shown on a light background
    dark: elsa-lab-logo-white.svg          # optional: shown on a dark background
    icon: elsa-lab-icon.png                # optional: the browser tab icon
    alt:
      en: ELSA-Lab for sustainable food systems
      nl: ELSA-Lab voor duurzame voedselsystemen
    url: https://ai4sfs.org                # optional: where clicking the logo goes
  fonts:
    - family: Open Sans
      role: body
      files:
        - { file: open-sans-400.woff2, weight: "400", style: normal }
        - { file: open-sans-400-italic.woff2, weight: "400", style: italic }
        - { file: open-sans-700.woff2, weight: "700", style: normal }
      licence: SIL Open Font License 1.1 (theme/ofl-open-sans.txt)
    - family: Nova Square
      role: heading
      files:
        - { file: nova-square-400.woff2, weight: "400", style: normal }
      licence: SIL Open Font License 1.1 (theme/ofl-nova-square.txt)
  colours:
    background: "#ffffff"
    surface: "#f0f3f7"
    text: "#2d2e33"
    text-muted: "#a3a4a8"
    accent: "#ffc600"
    accent-secondary: "#41ab64"
    danger: "#e44e56"
```

The three parts are independent: a Theme may carry any one, two or all three of
`logo`, `fonts` and `colours`, but it must carry at least one (V-THEME; an empty
`theme:` is a mistake, not a choice). **Each part that is present is complete**: a
`colours` block has all seven roles, a font family has its files. The frontend never
merges half a Theme with half a default, because a palette or a type pairing is
designed as a set; what it does when a part is absent is stated per part below.

#### 4.3.1 `logo`

| Key | Required | Type | Meaning |
|---|---|---|---|
| `light` | yes | theme file name (3.6), a logo or icon extension | The logo variant for a **light** background. Must exist in `theme/`. Used wherever the frontend shows the logo unless the background is dark and `dark` is given. |
| `dark` | no | theme file name, a logo or icon extension | The variant for a **dark** background (typically white-on-transparent). Absent: `light` is used on every background. |
| `icon` | no | theme file name, a logo or icon extension | The browser tab icon (favicon). Absent: the frontend's default icon. |
| `alt` | yes | localised text, plain, at most 80 characters | The alternative text of the logo image: the lab's name. |
| `url` | no | absolute `http://` or `https://` URL | Where clicking the logo leads; opened in a new tab; never fetched. Absent: the logo is not a link. |

Absent `logo`: the frontend shows the Tree's `title` as text where the logo would be.

#### 4.3.2 `fonts`

A list of **font families**, at most two, at most one per role.

| Key | Required | Type | Meaning |
|---|---|---|---|
| `family` | yes | string, non-empty, at most 64 characters | The family name as it will be used in CSS (`font-family`). Reproduced as written. |
| `role` | yes | one of `body`, `heading` | Where the family is used: `body` for all running text, `heading` for the Node title, the Tree title and the Branch labels. A Tree that gives only `body` has headings in the body family; a Tree that gives only `heading` has running text in the frontend's default family. |
| `files` | yes | list of font files, non-empty, at most 8 | The faces of the family, one file each. |
| `files[].file` | yes | theme file name (3.6), `.woff2` | The font file. Must exist in `theme/`. |
| `files[].weight` | yes | string: one number `"400"`, or a range `"300 800"` for a variable font; numbers 1 to 1000 | The `font-weight` descriptor of the face, reproduced verbatim into `@font-face`. |
| `files[].style` | yes | one of `normal`, `italic` | The `font-style` descriptor of the face. |
| `licence` | yes | string, non-empty, at most 200 characters | The licence under which the family is redistributed with this Tree, and where its text is. Reproduced as written, like an Image's `credit`; the loader does not interpret it. A font file whose licence the author cannot state does not belong in the Tree. |

The licence *text* (the SIL Open Font License requires it to accompany the files) is
an ordinary file in `theme/` that the Theme does not reference; the loader ignores it.

Absent `fonts`: the frontend's default type stack, for both roles.

#### 4.3.3 `colours`

A mapping with **exactly** these seven keys, each a colour written as `#` and six
lowercase hexadecimal digits (`^#[0-9a-f]{6}$`), quoted. No alpha, no names, no
shorthand.

| Role | Used for |
|---|---|
| `background` | The page behind everything. |
| `surface` | The Bubble and other raised areas (the Carousel, the chrome bar). |
| `text` | Running text and titles on `background` and `surface`. |
| `text-muted` | Secondary text: credits, the disclaimer, Source labels, the counter in a title. |
| `accent` | The primary accent: the Bubble's outline, the Answer Branches, primary controls. |
| `accent-secondary` | The secondary accent: the Option Branches, secondary controls, links. |
| `danger` | The `prohibited` outcome and error states. |

The set is closed: no eighth key, no missing key (V-THEME). Everything else the
frontend needs -- a hover shade, the text colour on an accent button, the colour of a
disabled control -- it **derives** from these seven (for instance, text on `accent` is
whichever of `text` and `background` has the higher contrast against it); how is
`docs/specs/application.md`'s, issue #38. A Theme author is responsible for a palette
whose `text` reads on `background` and on `surface`; the validator does not measure
contrast.

Absent `colours`: the frontend's default palette.

## 5. A Node: every document after the first

A Node document is a mapping with these keys:

| Key | Required | Type | Meaning |
|---|---|---|---|
| `id` | yes | id (3.1), unique in the Tree | The Node's id: what URLs, the Trail and Links use. Write it first in the document (3.7). |
| `title` | yes | localised text, plain, at most 80 characters | The Node's heading, shown in the Bubble and on the Branch that leads to it. A step counter such as `(1/7)` is written here, at the end (5.8). |
| `description` | yes | localised text, rich, at most 600 characters and 8 estimated lines | The explanatory text, shown in the Bubble. |
| `metadata` | yes | mapping | `version` (non-empty string) required; the rest free-form, kept but not interpreted. |
| `sources` | no | list of Source (5.1), at most 3 | References this Node cites. Absent means none. |
| `images` | no | list of Image (5.2), at most 10 | Pictures shown in the Carousel below this Node's Bubble. Absent means none. |
| `answers` | see 5.6 | Answers (5.3) | The yes/no Links. Present exactly on question Nodes. |
| `options` | no | list of Option (5.4), at most 8 | The clickable list of entries, each leading to an explanation Node. Allowed on question Nodes and explanation Nodes; never on a Terminal. |
| `terminal` | see 5.6 | Terminal marker (5.5) | Present exactly on Terminals. |

There is no `kind` key: the kind follows from which of `answers` / `terminal` is present
(5.6). The limits are collected in 5.7.

### 5.1 Source

```yaml
sources:
  - id: art-2                       # optional; needed only if an Image points at it
    kind: legal
    label:
      en: Article 2 AI Act (scope)
      nl: Artikel 2 AI-verordening (toepassingsgebied)
    url: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `kind` | yes | one of `legal`, `case-law`, `literature` | The three kinds of reference, labelled distinctly so the frontend can group or style them. `legal`: an article, annex or recital of a regulation or directive. `case-law`: a court decision. `literature`: anything else -- papers, guidance, books, reports. |
| `label` | yes | localised text, plain, at most 60 characters | The visible text of the link. Short: `Article 5(1)(c) AI Act`, not the article's title. |
| `url` | yes | string, absolute `http://` or `https://` URL | Where the link goes; opened in a new tab; never fetched by the app. One URL for all languages -- prefer language-neutral URLs (EUR-Lex's `/eli/...` addresses negotiate the reader's language). |
| `id` | no | id, unique within the Node | A handle so an Image on this Node can point at this Source. |

Sources are written **inline on the Node that cites them** (core document 10.11). The
same reference cited by two Nodes is written twice; there is no shared registry.

### 5.2 Image

```yaml
images:
  - file: eu-map.png
    description:
      en: Map of the EU member states
      nl: Kaart van de EU-lidstaten
    credit: "Map: Example Cartography, CC BY 4.0"
    source: art-2                   # optional: id of a Source on this Node
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `file` | yes | image file name (3.5) | A file in this Tree's `images/` folder. Must exist. |
| `description` | yes | localised text, plain, at most 120 characters | What the picture shows: the Carousel's caption, and the accessible alternative text. |
| `credit` | yes | non-empty string, at most 120 characters | Attribution and licence, reproduced as written, shown with the picture. Required for every Image without exception. |
| `source` | no | id of a Source on the same Node | Where the picture or its content comes from. For an Image on an Option this refers to the `sources` of the Node the Option is written in. |

**The Carousel needs nothing more than this.** The order of the list is the order of
the Carousel, first entry first; the caption under a picture is its `description`; the
credit is shown with it, in the Carousel and in the enlarged view. There is no `order`
key, no `caption` key and no `cover` key: the list is the order, the description is the
caption, and a Node that wants a different first picture moves it up the list. Unchanged
from `elsa-tree/1` in every key (`docs/adrs/ADR-37-images-carousel.md`).

### 5.3 Answers

```yaml
answers:
  yes: prohibited-practices
  no: outside-scope
```

Exactly the two keys `yes` and `no`, each a Node reference. The target of an Answer
must be a question Node or a Terminal -- never an explanation Node, because arriving
at an explanation Node by an Answer would leave the user with no way forward. The
labels "yes" and "no" are UI chrome, translated by the frontend, not by the Tree. On
screen an Answer is a Branch out of the Bubble, labelled with its target's `title`.

### 5.4 Option

```yaml
options:
  - title:
      en: Social scoring
      nl: Sociale scoring
    target: social-scoring
    images:                         # optional, same shape as 5.2
      - file: scoreboard.png
        description: { en: A scoreboard, nl: Een scorebord }
        credit: "Illustration: Example Studio, CC0"
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `title` | yes | localised text, plain, at most 60 characters | The entry's text: the label of its Branch out of the Bubble. |
| `target` | yes | Node reference | The explanation Node that expands on this entry. Must be an explanation Node (5.6). |
| `images` | no | list of Image, at most 3 | Pictures for this entry (e.g. what kind of product a piece of legislation covers). Whether the Carousel shows them with the Node's own Images is the frontend's (issue #38). |

Options in one list have distinct targets. Several Nodes may point at the same
explanation Node. The order of the list is the order shown. **At most 8 Options on a
Node**: a longer list becomes several Nodes, each a step with its own title (5.8), as
the owner's "(1/7)" example does for the seven jurisdiction categories.

### 5.5 Terminal marker

```yaml
terminal:
  outcome: not-applicable
```

A Terminal ends the walk. The marker is explicit: "no outgoing Links" is *not* a
Terminal, because explanation Nodes also have no Answers. `outcome` is one of four
fixed values the frontend knows how to style; the Node's `title` and `description`
carry the actual message.

| `outcome` | Meaning | First-Tree example |
|---|---|---|
| `not-applicable` | The rules this Tree is about do not apply to the user's system. | "The AI Act does not apply." |
| `applicable` | The rules apply; the text says what that means. | "The AI Act applies; obligations follow." |
| `prohibited` | The system, as described, is not permitted. | "This is a prohibited practice." |
| `refer` | This Tree has nothing further to say; the text refers the user elsewhere. | "Not an AI system under the Act; product-safety law applies instead." |

The set is closed. A Tree that needs a fifth value needs a new format number.

### 5.6 The three kinds of Node

| Kind | Has `answers` | Has `terminal` | May have `options` | Reached by | Must be reached by |
|---|---|---|---|---|---|
| **question Node** | yes | no | yes | an Answer, or being `root` | -- |
| **Terminal** | no | yes | no | an Answer, or being `root` | -- |
| **explanation Node** | no | no | yes | an Option | at least one Option |

A document with both `answers` and `terminal` is an error. An explanation Node reached
through an Option is "explanation only" (core document 3.1, traversal rule): the user
reads it, may open its own Options, and goes back through the Trail to answer the
parent's question. A Trail is therefore just a list of Node ids, which the frontend can
carry in a shareable link.

### 5.7 Maximum lengths and counts

Nothing on the page may scroll (core document 3.2, 9): everything a Node shows fits
inside its Bubble. These maxima are what makes that a property of the data. They apply
to the counted text of section 3.8, **per language, the same number for every
language**.

| Field | Maximum | Rule |
|---|---|---|
| Tree `title` (any language) | 80 characters | V-LENGTH |
| Tree `description` (any language) | 600 characters and 8 estimated lines | V-LENGTH, V-LINES |
| Node `title` (any language) | 80 characters | V-LENGTH |
| Node `description` (any language) | 600 characters and 8 estimated lines | V-LENGTH, V-LINES |
| Option `title` (any language) | 60 characters | V-LENGTH |
| Source `label` (any language) | 60 characters | V-LENGTH |
| Image `description` (any language) | 120 characters | V-LENGTH |
| Image `credit` | 120 characters | V-LENGTH |
| Logo `alt` (any language) | 80 characters | V-LENGTH |
| Font `family` | 64 characters | V-LENGTH |
| Font `licence` | 200 characters | V-LENGTH |
| `sources` on a Node | 3 entries | V-COUNT |
| `options` on a Node | 8 entries | V-COUNT |
| `images` on a Node | 10 entries | V-COUNT |
| `images` on an Option | 3 entries | V-COUNT |
| `fonts` in a Theme | 2 families, 8 files each | V-COUNT |

`metadata` values, URLs, ids and file names have no length rule beyond their own
grammar; they are not shown in the Bubble.

**The assumptions the numbers derive from.** They are written down so that the
application architecture (issue #38), which fixes the layout, can confirm or correct
them; if it corrects them, it says so on issue #37 and the numbers here change with a
new format number. `docs/adrs/ADR-37-length-limits.md` has the reasoning.

| Assumption | Value |
|---|---|
| Viewport the layout guarantees | 1280 x 640 CSS pixels: a 1366 x 768 laptop display, or a 1920 x 1080 one at 150 % scaling, minus browser tabs, address bar and taskbar |
| Vertical budget at that height | chrome bar 44 + Trail Branches 64 + Bubble 360 + outgoing Branches 64 + Carousel 80 + disclaimer 28 = 640 |
| Text area inside the Bubble | 640 x 304 CSS pixels, inside the curve and the padding of a 760 x 360 rounded Bubble |
| Body text | 16 px, line height 24 px, average advance 8.5 px per character (Open Sans and similar humanist sans-serifs): **75 characters per line** |
| Node title | 22 px, line height 28 px, about 55 characters per line: 80 characters is at most **2 lines** (56 px) |
| Sources | 13 px, line height 20 px, about 90 characters per line: 3 labels of 60 characters with separators is at most **2 lines** (40 px) |
| Description | what remains: 304 - 56 - 8 - 40 - 8 = 192 px = **8 lines** of 24 px, at 75 characters = 600 characters |
| Option Branch labels | 13 px, line height 20 px, in a label at most 150 px wide, about 21 characters per line: an Option title of 60 characters is at most **3 lines** (60 px, inside the 64 px row); 8 Option Branches fit 1280 px side by side (1200 px). A question Node that carries both `answers` and `options` (section 5.6) shows 10 Branches, which need 1500 px at that width: #38 decides whether they narrow or wrap |
| Answer and Trail Branch labels | the same 13 px on 20 px lines, but the label is a Node `title` of up to 80 characters (5.3, section 6), which at 150 px would be 4 lines = 80 px and not fit a 64 px row. The 2 Answer Branches have 640 px each (about 90 characters per line): 80 characters is **1 line**. A Trail of n Nodes has n Branches in the 64 px Trail row: up to 6 fit, at 213 px each (about 30 characters per line: 80 characters is at most **3 lines**, 60 px); the format does not bound a Trail's length, so a longer Trail is real, and #38 decides whether its labels truncate, its row wraps or its middle collapses to a count |
| Carousel | one picture at a time, 80 px strip; a caption of 120 characters fits one line at 13 px under the enlarged view, two in the strip |

What these numbers do **not** promise: that a description written at the maximum in a
wide font (a `heading`-role font is never used for it) or in a script with wider
glyphs fits. The Theme author who chooses an unusually wide body font chooses shorter
text with it.

### 5.8 Step counters in titles

A step that was cut into several Nodes says so **in its title**, at the end, as
`(n/m)`: `Jurisdictional scope of the AI Act? (1/7)`. The counter is authored text like
the rest of the title, in every language, and counts toward the 80 characters; the
format has no field for it and the validator does not check that `2/7` follows `1/7`
(`docs/adrs/ADR-37-step-counter.md`). The frontend may recognise a trailing `(n/m)`
and style it as muted text; it does not depend on it.

## 6. Loading: the file is read once, a page still receives one Node

The Tree is one file, so it is read as one file, and the moment it is read is the moment
it is validated:

- **At server start (or build time)** the loader reads `tree.yaml` once, parses the
  stream, checks every rule of section 7 and builds its index: Node id to parsed Node,
  Node id to title. That is the one whole-Tree read, server-side, one-off. It is the
  same moment `elsa-tree/1` validated, and it costs the same: every Node was read then
  too, only from sixty files instead of one.
- **To render Node `x`** the server takes `x` from the index. It reads no file. The
  page is given **one Node, never the Tree**: its text in every language, its Sources,
  the file names of its own Images, the *ids* of its Link targets, and the titles of
  the Trail from the title index. The Theme reaches the page from the manifest.
- **The browser** receives that one Node's HTML and then requests the image files it
  names, and the Theme files, as it needs them. Nothing in the format lets a Node refer
  to another Node's images, so "only the current Node's images" holds by construction.
  Which neighbouring Nodes may be pre-rendered ahead of a click, and through which
  route, is the application contract of issue #38; whatever it decides, the browser is
  never sent the whole Tree.

A loader therefore keeps a narrow interface -- in words, not code, since the code is
issue #39: *validate a Tree folder and report every violation*, *give me the manifest*
(with its Theme), *give me Node `x`*, *give me the title of Node `x`*, *resolve this
image file name*, *resolve this theme file name*. Everything about the stream, YAML,
and the rules below sits behind that interface; the frontend never touches a file
path. `docs/adrs/ADR-37-single-file-layout.md` records why holding the parsed Tree in
memory is the right trade.

## 7. Validity rules

A loader **rejects the whole Tree** if any rule fails, and reports every failure it
found (not just the first) with: the Tree id, the Node id (or `manifest`), the key path
inside the document (e.g. `options[2].target`, `description.nl`), the rule id below,
and a plain-language message that, for a length rule, names the actual and the maximum.
A Tree is never partially loaded.

### Tree level

| Rule | A valid Tree has... |
|---|---|
| V-DIR | a folder name that is an id (3.1), containing `tree.yaml`. `images/` and `theme/`, when present, are folders. |
| V-YAML | a `tree.yaml` that parses as a YAML 1.2 stream in which every document is a mapping at the top level. A document that fails to parse is reported with its line number; the other documents are still checked. |
| V-FORMAT | a first document whose `format` is exactly `elsa-tree/2`. |
| V-LANG | `languages`: a non-empty list of distinct, valid language tags (3.3). |
| V-ROOT | `root` naming an existing Node that is a question Node or a Terminal. |
| V-TITLE | `title` as a plain localised text, in the manifest. |
| V-META | `metadata` as a mapping whose `version` is a non-empty string (in the manifest and in every Node). |
| V-KEYS | no keys other than those listed in sections 4 and 5, at every level except inside `metadata`. `format` and `theme` only in the first document; `id` never in the first document. |
| V-REACH | every Node document reachable from `root` by following Answers and Options. An unreachable Node is almost always a misspelt target; keep drafts in comments or outside the file. |
| V-THEME | `theme`, when present, a mapping with at least one of `logo`, `fonts`, `colours`, each as section 4.3 defines it: files matching 3.6 and existing in `theme/`; `logo.alt` a plain localised text; `logo.url` an absolute http(s) URL if present; at most one font family per `role`; every font file `.woff2` with a valid `weight` and `style`; `colours` with exactly the seven roles, each `^#[0-9a-f]{6}$`. |

### Text

| Rule | A valid Tree has... |
|---|---|
| V-L10N | every localised text providing a non-empty string for every declared language and no keys for other languages. |
| V-PLAIN | plain text fields on a single line (no line breaks). |
| V-HTML | no raw HTML in rich text: the sequence `<` followed by a letter, `/` or `!` is rejected. |
| V-LENGTH | every text field within the maximum characters of 5.7, per language, measured as 3.8 says. The message names the field, the language, the actual length and the maximum. |
| V-LINES | every rich text within 8 estimated lines (3.8), per language. The message names the estimate and the maximum. |
| V-COUNT | every list within the maximum entries of 5.7. |

### Node level

| Rule | A valid Tree has... |
|---|---|
| V-NODE | at least one Node document; every Node document with an `id` that is a valid id and is distinct from every other Node's, and `title`, `description`, `metadata` present. |
| V-KIND | at most one of `answers` and `terminal` on a Node. |
| V-ANSWERS | `answers` with exactly the keys `yes` and `no`, each a Node reference to an existing question Node or Terminal. |
| V-OPTIONS | `options`, when present, a non-empty list; each with `title` and `target`; targets existing explanation Nodes; targets distinct within the list. |
| V-ORPHAN | every explanation Node targeted by at least one Option (this is also implied by V-REACH, but gets its own message). |
| V-TERMINAL | `terminal` as a mapping whose `outcome` is one of `not-applicable`, `applicable`, `prohibited`, `refer`; a Terminal has no `options`. |
| V-SOURCE | every Source with a `kind` in `legal` / `case-law` / `literature`, a plain localised `label`, an absolute http(s) `url`; Source ids valid and distinct within the Node. |
| V-IMAGE | every Image with a `file` matching 3.5 that exists in the Tree's `images/`, a plain localised `description`, a non-empty `credit`, and, if present, a `source` naming a Source id on the same Node. |
| V-CROSS | no Node reference containing `:` (Cross-links are not part of `elsa-tree/2`). |

Not errors: an image file in `images/` or a file in `theme/` that nothing references; a
Node reached by more than one Link; a cycle among question Nodes (the Tree is
graph-shaped by design; the Trail is how the user finds their way back); Node documents
in any order; comments anywhere.

## 8. Complete example Tree (English and Dutch)

The Tree below is complete and valid: it observes every limit of 5.7 and exercises
every element of the format, including a Theme and two Images. It is **illustrative
content**: the legal statements are simplified sketches used to show the format, not
verified readings of the AI Act. The real first Tree is authored separately.

Folder layout:

```
trees/
  ai-act-example/
    tree.yaml
    images/
      eu-map.png
      scoreboard.png
    theme/
      elsa-lab-logo.svg
      elsa-lab-logo-white.svg
      open-sans-400.woff2
      open-sans-700.woff2
      nova-square-400.woff2
      ofl-open-sans.txt              licence text; not referenced, ignored by the loader
      ofl-nova-square.txt
```

Shape: `start` is the root question Node with an Image and a legal Source. Its `no`
Answer ends at the Terminal `outside-scope`; its `yes` Answer leads to
`prohibited-practices`, a question Node with two Options, each opening an explanation
Node (`social-scoring`, with a case-law and a literature Source and an Image on the
Option; `emotion-recognition-at-work`). Answering `yes` there reaches the Terminal
`prohibited`, `no` reaches the Terminal `covered`. The Theme adapts what issue #36
measured on https://ai4sfs.org (`docs/research/issue-36-ai4sfs-visual-identity.md`,
section 7) to the Bubble rather than copying it: six of the seven colours are the
measured values, `surface` is the site's quiet-control tint `#f0f3f7` (its cards are
white with a shadow, which the Bubble does not have), and Nova Square, which the site
uses only for one oversized display heading, is the example's `heading` family; the
font and logo files are whatever valid files the repository carries under that name.

### `trees/ai-act-example/tree.yaml`

```yaml
# The example Tree of docs/specs/tree-format.md, section 8: every element of the format
# in one small Tree. Its legal content is simplified and not to be relied on.
format: elsa-tree/2
languages: [en, nl]
root: start
title:
  en: Does the EU AI Act apply to my AI system? (example)
  nl: Is de EU AI-verordening van toepassing op mijn AI-systeem? (voorbeeld)
description:
  en: |
    A small example Tree that exercises every element of the `elsa-tree/2` format.
    Its legal content is simplified and not to be relied on.
  nl: |
    Een kleine voorbeeldboom die elk onderdeel van het `elsa-tree/2`-formaat gebruikt.
    De juridische inhoud is vereenvoudigd en niet bedoeld om op te vertrouwen.
metadata:
  version: "2.0"
  author: ELSA-Lab for sustainable food systems, Wageningen University
  licence: to be decided (core document OPEN 10.14)
theme:
  logo:
    light: elsa-lab-logo.svg
    dark: elsa-lab-logo-white.svg
    alt:
      en: ELSA-Lab for sustainable food systems
      nl: ELSA-Lab voor duurzame voedselsystemen
    url: https://ai4sfs.org
  fonts:
    - family: Open Sans
      role: body
      files:
        - { file: open-sans-400.woff2, weight: "400", style: normal }
        - { file: open-sans-700.woff2, weight: "700", style: normal }
      licence: SIL Open Font License 1.1 (theme/ofl-open-sans.txt)
    - family: Nova Square
      role: heading
      files:
        - { file: nova-square-400.woff2, weight: "400", style: normal }
      licence: SIL Open Font License 1.1 (theme/ofl-nova-square.txt)
  colours:
    background: "#ffffff"
    surface: "#f0f3f7"
    text: "#2d2e33"
    text-muted: "#a3a4a8"
    accent: "#ffc600"
    accent-secondary: "#41ab64"
    danger: "#e44e56"

--- # start
id: start
title:
  en: Is your AI system within the reach of the AI Act?
  nl: Valt uw AI-systeem binnen het bereik van de AI-verordening?
description:
  en: |
    The AI Act reaches AI systems **placed on the market or put into service in the
    EU**, and systems whose *output is used in the EU*, wherever the provider is based.

    Answer **yes** if you place your system on the EU market, put it into service in
    the EU, use it in the EU, or use its output in the EU.

    - Answer **no** only if none of these applies to your system.
  nl: |
    De AI-verordening bestrijkt AI-systemen die **in de EU in de handel worden gebracht
    of in gebruik worden gesteld**, en systemen waarvan de *output in de EU wordt
    gebruikt*, waar de aanbieder ook is gevestigd.

    Antwoord **ja** als u uw systeem in de EU in de handel brengt, in gebruik stelt,
    gebruikt, of als de output ervan in de EU wordt gebruikt.

    - Antwoord **nee** alleen als geen hiervan op uw systeem van toepassing is.
metadata:
  version: "2.0"
sources:
  - id: art-2
    kind: legal
    label:
      en: Article 2 AI Act (scope)
      nl: Artikel 2 AI-verordening (toepassingsgebied)
    url: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
images:
  - file: eu-map.png
    description:
      en: Map of the European Union member states
      nl: Kaart van de lidstaten van de Europese Unie
    credit: "Map: Example Cartography, CC BY 4.0"
    source: art-2
answers:
  yes: prohibited-practices
  no: outside-scope

--- # outside-scope
id: outside-scope
title:
  en: The AI Act does not apply
  nl: De AI-verordening is niet van toepassing
description:
  en: |
    Your system is outside the territorial scope of the AI Act. Other rules may still
    apply to it; this Tree does not cover them.
  nl: |
    Uw systeem valt buiten het territoriale toepassingsgebied van de AI-verordening.
    Andere regels kunnen nog steeds van toepassing zijn; deze boom behandelt die niet.
metadata:
  version: "2.0"
terminal:
  outcome: not-applicable

--- # prohibited-practices
id: prohibited-practices
title:
  en: Does your system do any of the prohibited practices?
  nl: Verricht uw systeem een van de verboden praktijken?
description:
  en: |
    Article 5 lists practices that are **prohibited** outright. Open each entry to read
    what it covers, then come back here and answer.

    Answer **yes** if your system does any of them, **no** if it does none.
  nl: |
    Artikel 5 noemt praktijken die zonder meer **verboden** zijn. Open elk onderdeel om
    te lezen wat het inhoudt, en kom dan hier terug om te antwoorden.

    Antwoord **ja** als uw systeem een van deze praktijken verricht, **nee** als geen
    ervan van toepassing is.
metadata:
  version: "2.0"
  reviewed: 2026-09-10
sources:
  - kind: legal
    label:
      en: Article 5 AI Act (prohibited AI practices)
      nl: Artikel 5 AI-verordening (verboden AI-praktijken)
    url: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
options:
  - title:
      en: Social scoring
      nl: Sociale scoring
    target: social-scoring
    images:
      - file: scoreboard.png
        description:
          en: A scoreboard ranking people
          nl: Een scorebord dat mensen rangschikt
        credit: "Illustration: Example Studio, CC0 1.0"
  - title:
      en: Emotion recognition at work or in education
      nl: Emotieherkenning op het werk of in het onderwijs
    target: emotion-recognition-at-work
answers:
  yes: prohibited
  no: covered

--- # social-scoring
id: social-scoring
title:
  en: Social scoring
  nl: Sociale scoring
description:
  en: |
    Evaluating or classifying people over time on the basis of their social behaviour
    or personal characteristics, where the resulting score leads to detrimental
    treatment that is unrelated to the context in which the data was collected, or
    that is disproportionate.
  nl: |
    Het beoordelen of indelen van mensen gedurende een periode op basis van hun
    sociale gedrag of persoonlijke kenmerken, waarbij de score leidt tot nadelige
    behandeling die losstaat van de context waarin de gegevens zijn verzameld, of die
    onevenredig is.
metadata:
  version: "2.0"
sources:
  - kind: legal
    label:
      en: Article 5(1)(c) AI Act
      nl: Artikel 5, lid 1, onder c, AI-verordening
    url: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
  - kind: case-law
    label:
      en: CJEU, C-634/21 SCHUFA (Scoring), 7 December 2023
      nl: HvJ EU, C-634/21 SCHUFA (Scoring), 7 december 2023
    url: https://curia.europa.eu/juris/liste.jsf?num=C-634/21
  - kind: literature
    label:
      en: Veale & Zuiderveen Borgesius (2021), Demystifying the AI Act
      nl: Veale & Zuiderveen Borgesius (2021), Demystifying the AI Act
    url: https://arxiv.org/abs/2107.03721

--- # emotion-recognition-at-work
id: emotion-recognition-at-work
title:
  en: Emotion recognition at work or in education
  nl: Emotieherkenning op het werk of in het onderwijs
description:
  en: |
    Inferring the emotions of a person in the workplace or in an education
    institution, except for medical or safety reasons.
  nl: |
    Het afleiden van emoties van een persoon op de werkplek of in een
    onderwijsinstelling, behalve om medische of veiligheidsredenen.
metadata:
  version: "2.0"
sources:
  - kind: legal
    label:
      en: Article 5(1)(f) AI Act
      nl: Artikel 5, lid 1, onder f, AI-verordening
    url: https://eur-lex.europa.eu/eli/reg/2024/1689/oj

--- # prohibited
id: prohibited
title:
  en: This is a prohibited practice
  nl: Dit is een verboden praktijk
description:
  en: |
    The AI Act prohibits placing on the market, putting into service or using a system
    for this practice. The walk ends here.
  nl: |
    De AI-verordening verbiedt het in de handel brengen, in gebruik stellen of
    gebruiken van een systeem voor deze praktijk. De doorloop eindigt hier.
metadata:
  version: "2.0"
terminal:
  outcome: prohibited

--- # covered
id: covered
title:
  en: The AI Act applies to your system
  nl: De AI-verordening is van toepassing op uw systeem
description:
  en: |
    Your system is within scope and is not a prohibited practice. The real Tree
    continues with the high-risk categorisation; this example stops here.
  nl: |
    Uw systeem valt binnen het toepassingsgebied en is geen verboden praktijk. De echte
    boom gaat verder met de hoog-risico-indeling; dit voorbeeld eindigt hier.
metadata:
  version: "2.0"
terminal:
  outcome: applicable
```

The two image files `eu-map.png` and `scoreboard.png` are ordinary PNG files placed in
`trees/ai-act-example/images/` by hand; the logo and font files are placed in
`trees/ai-act-example/theme/` the same way, with the licence texts next to them.

Note what the explanation Nodes no longer say: the sentence "This is an explanation
only. Go back to the previous step to answer" of the `elsa-tree/1` example is chrome,
said by the frontend on every explanation Node, and no longer spends Bubble space.

## 9. A single-language Tree

Nothing structural changes. The manifest declares one language and every localised
text has one key:

```yaml
format: elsa-tree/2
languages: [nl]
root: start
title:
  nl: Is de AI-verordening van toepassing?
metadata:
  version: "1.0"

--- # start
id: start
title:
  nl: Valt uw AI-systeem binnen het bereik van de AI-verordening?
description:
  nl: |
    ...
```

Writing `title: Valt uw AI-systeem ...` as a bare string instead of a mapping is
**not** allowed even for one language (rule V-L10N): a localised text is always a
mapping, so that a second language can be added without changing the shape. The
frontend shows the Tree in its only language and offers no language switch.

A Tree in German, or in English, Dutch and German, is written the same way with
`languages: [de]` or `languages: [en, nl, de]`. A Tree without a `theme` key, like this
one, is shown in the frontend's plain default look.

## 10. Reserved for the future

- **Cross-links.** A Node reference of the shape `tree-id:node-id` (two ids joined by a
  colon) will address a Node in another Tree, and a bare reference to a non-child Node
  may become allowed for in-Tree cross-links. Ids therefore cannot contain a colon
  today, and today's loader rejects references with a colon (V-CROSS). Files written
  against `elsa-tree/2` will remain valid when Cross-links arrive.
- **Format number.** `format: elsa-tree/2` is the only accepted value. Any change to
  the keys, the kinds, the outcome set, the Theme roles, the limits or the validity
  rules is published as `elsa-tree/3` with its own document; a loader states which
  format numbers it accepts.

## 11. Where each decision is recorded

Decisions of `elsa-tree/2` (issue #37):

| Decision | ADR |
|---|---|
| One file per Tree: a YAML stream, manifest first, one document per Node, `id` inside the document; `images/` and `theme/` beside it; the Tree is read once and held in memory | `docs/adrs/ADR-37-single-file-layout.md` (supersedes `ADR-4-file-layout.md`) |
| YAML 1.2 kept as the serialisation of one large multilingual file; the stream, the `--- # id` convention, free document order | `docs/adrs/ADR-37-serialisation.md` (amends `ADR-4-serialisation-format.md`, `ADR-4-identifiers-and-cross-links.md`) |
| The Theme block: logo, fonts, colours by role; each part optional, each present part complete; files in `theme/` | `docs/adrs/ADR-37-theme-block.md` |
| Maximum lengths and counts, the same for every language, derived from a stated viewport and Bubble; the estimated-line rule for rich text | `docs/adrs/ADR-37-length-limits.md` |
| The step counter `(n/m)` is authored in the title, not a field | `docs/adrs/ADR-37-step-counter.md` |
| Images unchanged; the Carousel's order is the list order and its caption the description | `docs/adrs/ADR-37-images-carousel.md` |
| Textual migration from `elsa-tree/1`: concatenate, prefix `id`, report every limit violation, shorten nothing | `docs/adrs/ADR-37-migration.md` |

Decisions carried over unchanged from `elsa-tree/1` (issue #4):

| Decision | ADR |
|---|---|
| Localised text as a per-language mapping, all declared languages required | `docs/adrs/ADR-4-localised-text.md` |
| Id grammar, colon reserved for Cross-links | `docs/adrs/ADR-4-identifiers-and-cross-links.md` (the "file name is the id" part is amended by `ADR-37-serialisation.md`) |
| Explicit terminal marker with a closed outcome set; Node kind derived | `docs/adrs/ADR-4-terminal-marker.md` |
| Images in the Tree's own `images/` folder, referenced by bare file name | `docs/adrs/ADR-4-image-reference.md` |
| Strict validation: reject the whole Tree, report every violation | `docs/adrs/ADR-4-validity-rules.md` |
| YAML 1.2 with a Markdown subset for rich text | `docs/adrs/ADR-4-serialisation-format.md` (the "one file per Node" consequence is amended by `ADR-37-serialisation.md`) |

## 12. Migration from `elsa-tree/1`

A Tree folder written against `elsa-tree/1` -- `tree.yaml` plus `nodes/<id>.yaml` files
plus `images/` -- is converted to `elsa-tree/2` by a **textual** procedure: no Node
file is parsed and re-serialised, so every comment, every line break and every quoting
choice an author made survives, and a file that does not parse is carried over as it
is, to fail the same rule it failed before. The procedure is precise enough to script
(issue #39) and to do by hand for a small Tree. `docs/adrs/ADR-37-migration.md` has
the reasoning.

### 12.1 The procedure

Input: the folder `<in>/`. Output: the folder `<out>/` (which may be the same folder).

1. **Read the manifest** `<in>/tree.yaml` as text. Find the first line that matches
   `^format:\s*elsa-tree/1\s*(#.*)?$` and replace it by `format: elsa-tree/2`, keeping
   any comment. If no such line exists, leave the text unchanged and report
   `manifest: no "format: elsa-tree/1" line found` (the result will fail V-FORMAT, as
   the input would have). Strip a leading byte-order mark and a leading `---` line if
   present. Strip trailing blank lines.
2. **Determine the root id**: the value of the first line matching `^root:\s*(\S+)`.
   Absent: no root (the result will fail V-ROOT).
3. **List the Node files**: every regular file `<in>/nodes/*.yaml`, non-recursive, and
   nothing else. Order them: the file named `<root>.yaml` first if it exists, then the
   others by file name in byte order (`LC_ALL=C sort` order; the order `ls` shows
   depends on the locale and is not it).
   No `nodes/` folder or no files: no Node documents (the result will fail V-NODE).
4. **For each Node file, in that order**, append to the output text:
   - a blank line;
   - the line `--- # <id>`, where `<id>` is the file name without `.yaml` (whatever
     it is: a name that is not a valid id is carried over and fails V-NODE);
   - the line `id: <id>`;
   - the file's text, with a leading byte-order mark and a leading `---` line removed,
     trailing blank lines removed, and a final line break ensured. Nothing inside it is
     changed: not a key, not a value, not a comment, not the key order.
5. **Write** `<out>/tree.yaml` as UTF-8 without a byte-order mark, with `\n` line
   endings. If `<out>` differs from `<in>`, copy `<in>/images/` to `<out>/images/`
   unchanged (bytes and names). Do not create `<out>/theme/`; a Theme is authored, not
   migrated. Copy any other top-level files of `<in>` (a `NOTES.md`, a `README.md`)
   unchanged; ignore `nodes/`.
6. **Validate** the result with the rules of section 7 and **report every violation**
   as the loader would: Node id, key path, language, rule, actual and maximum for a
   length or count rule. Shorten nothing, drop nothing, silence nothing. The report is
   the content issue's (#44) work list. Exit successfully if the only violations are of
   V-LENGTH, V-LINES and V-COUNT (the input was a valid `elsa-tree/1` Tree that is too
   long for `elsa-tree/2`), and unsuccessfully otherwise.
7. **Only when `<out>` is `<in>` and step 5 succeeded**: delete `<in>/nodes/`. Never
   before the new file has been written and parsed back.

### 12.2 What the procedure guarantees

- The output has exactly as many Node documents as the input had `nodes/*.yaml` files,
  each with the same id, and every key and value of every Node is what it was. The
  `elsa-tree/1` rule "unknown keys are errors" means no `elsa-tree/1` Node file
  contained an `id` key, so the prefixed `id` line never collides.
- Every Node reference, every Source, every Image reference and every `metadata` bag is
  unchanged, so every URL and every shared link keeps working, and `images/` needs no
  change.
- A valid `elsa-tree/1` Tree whose texts and lists are within the limits of 5.7
  converts to a valid `elsa-tree/2` Tree with no hand-editing. A valid `elsa-tree/1`
  Tree that exceeds them converts to a file that fails **only** V-LENGTH, V-LINES and
  V-COUNT, with every failure reported; cutting the content is the content issue's
  work, not the migration's.
- An invalid `elsa-tree/1` Tree (the `tests/fixtures/invalid/*` and
  `tests/fixtures/broken/*` fixtures) converts to a file that fails the corresponding
  `elsa-tree/2` rule, because the text of each Node is carried over verbatim: a
  misspelt target is still misspelt, a missing Dutch string is still missing, a file
  that did not parse is now a document that does not parse.

### 12.3 What it does for the Trees on `dev`

- `trees/ai-act-example` (7 Nodes, 2 Images): converts and validates once its texts are
  cut to section 8, which is its new content; #39 writes section 8 as the file rather
  than converting the old one, and adds the Theme files section 8 lists.
- `trees/ai-act-applicability-agrifood` (61 Nodes, no Images): converts to one file of
  about 4,600 lines that fails only V-LENGTH, V-LINES and V-COUNT. Measured on 2026-09-10
  with the procedure above: every one of the 61 Nodes, and the manifest, has a
  description over 600 characters or 8 lines in at least one language; the Annex I
  Node has 20 Options and 4 Sources and the prohibited-practices Node 10 Options; and
  27 Node titles (across 19 Nodes), 41 Option titles and 136 Source labels exceed
  their maxima (the figures count each language separately). The migration reports
  each of them; #44 makes the cut the owner described, including cutting the two long
  Option lists into steps of at most 8.
- `tests/fixtures/single-language`, `other-languages`, `german-only`: convert and
  validate as they are with no violation; #39 gives one of them a Theme so both paths
  are tested.
- `tests/fixtures/invalid/<rule>` and `broken/<case>`: convert and fail the same rule,
  with two exceptions #39 re-fits: `v-dir` (no `nodes/` folder in `elsa-tree/1`; in
  `elsa-tree/2` the equivalent is a stream with no Node document, which fails V-NODE
  and V-ROOT) and `v-format` (its manifest says `elsa-tree/2` to be unknown to the old
  loader, which is now the accepted value; it must say something else, e.g.
  `elsa-tree/3`). New fixtures are needed for V-THEME, V-LENGTH, V-LINES and V-COUNT.

### 12.4 Worked example: the first two Nodes of `trees/ai-act-example`

Input, `elsa-tree/1`:

```
tree.yaml                         format: elsa-tree/1 ... root: start ...
nodes/start.yaml                  title: ... answers: ...
nodes/covered.yaml                title: ... terminal: ...
```

Output, `elsa-tree/2` (text abbreviated):

```yaml
format: elsa-tree/2
languages: [en, nl]
root: start
...

--- # start
id: start
title:
  en: Is your AI system within the reach of the AI Act?
  ...

--- # covered
id: covered
title:
  en: The AI Act applies to your system
  ...
```

`start` comes first because it is the root; `covered` next because it sorts first
among the rest; the other five follow in byte order of their old file names.
