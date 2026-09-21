# Tree file format -- `elsa-tree/4`

> Status: FROZEN -- 2026-09-21 (issue #118); `elsa-tree/4` replaces `elsa-tree/3` (frozen
> 2026-09-17, issue #78). This document is the interoperability contract: any Tree that
> follows it loads in the ELSA decision-tree frontend without a code change. Its structural
> half is published as a JSON Schema at `schemas/elsa-tree-4.json` (3.9), which the app
> serves at `/schemas/elsa-tree-4.json`. Changing this contract requires a new
> `architecture` issue and a new format number.
>
> **What this version is.** `elsa-tree/4` is `elsa-tree/3` in JSON. **Only the
> serialisation changes.** Every field, every kind of Node, every closed set, every
> validity rule about content and every limit of 5.7 is what it was -- the Node
> description's 150 characters and 2 estimated lines included, which the owner cut under
> `elsa-tree/3` on 2026-09-19 (#102, 5.7) -- so a Tree converts by the procedure of 12.6
> with no hand-editing and no change to a single piece of its text.
> What changes is the file: one `tree.json` object instead of a `tree.yaml` stream, `nodes`
> an array in the author's order, multi-line text a string with `\n` instead of a block
> scalar, no comments anywhere, a required `$schema`, and a canonical byte form so that two
> writers of the same Tree produce the same bytes (3.7). The decisions are
> `docs/adrs/ADR-118-json-serialisation.md` and `ADR-118-json-schema.md`; section 11 has
> the table.
>
> **Why.** The criterion that chose YAML is gone. `elsa-tree/1` to `/3` weighed
> **hand-editability of one large multilingual file** above everything else (core document
> item 10.21), because the owner authored Tree content in a text editor. On 2026-09-21 the
> owner decided that Trees are edited **through the frontend** in the round after this one,
> so no person will work inside the file again, and that Tree data is **JSON only**, so
> that the editor, the validator, the loader, the app and the public download all speak one
> format from one schema (core document 3.1, revised 2026-09-21; item 10.21, superseded).
> The file is therefore **written by tools and read by tools**: it carries no comments, it
> promises no formatting beyond the byte form of 3.7, and it is served to the public
> unchanged at the dataset endpoint (`docs/specs/application.md` section 15), so the
> download *is* the dataset.
>
> **Until the loader of issue #119 merges, the code on `dev` still reads `elsa-tree/3`**,
> and both Trees under `trees/` and every fixture are still written in it; nothing new may
> be built against `elsa-tree/3`.
>
> **What `elsa-tree/3` was.** `elsa-tree/3` replaced `elsa-tree/2` (issue #78, 2026-09-17)
> for two things the owner asked the data to carry (`docs/CORE_DOCUMENT.md` 3.1, revised
> 2026-09-17; `docs/adrs/ADR-75-presentation-changes.md`): **explainers** -- the Tree says
> which words of a Node's description have a short explanation shown on hover, and what it
> says, per language (5.9, rules V-EXPLAINER and V-MARK) -- and a **main image** on every
> Node, the first entry of its `images` (5.2), which is also the picture on the button of
> every Option that leads to it, so an Option no longer carries `images` of its own (5.4).
> The limits of 5.7 were confirmed unchanged against the layout of #75. All of that is
> `elsa-tree/4`'s too.
>
> **What `elsa-tree/2` was.** `elsa-tree/2` replaced `elsa-tree/1` (issue #37, 2026-09-10;
> `elsa-tree/1` is kept readable on branch `version-0.1`) after the owner changed three
> requirements (`docs/CORE_DOCUMENT.md`, revised 2026-09-09;
> `docs/adrs/ADR-35-version-0-2-rework.md`): a Tree is **one file** instead of a folder of
> Node files; the Tree carries its **Theme**; and every user-facing text has a **maximum
> length**, because nothing on the page may scroll. Everything else was carried over
> unchanged, and still is: ids and Node references, localised text, the Markdown subset,
> image file names and the `images/` folder, Sources, Images, Answers, Options, the
> terminal marker, the three kinds of Node, strict validation, and the reservation for
> Cross-links.
>
> **The migrations** are section 12: 12.1 to 12.4 from `elsa-tree/1`, 12.5 from
> `elsa-tree/2`, and 12.6 from `elsa-tree/3` to this version.
>
> Vocabulary: the canonical names from `docs/CORE_DOCUMENT.md` section 5 -- **Tree**,
> **Node**, **Link**, **Answer**, **Option**, **Terminal**, **Image**, **Source**,
> **Trail**, **Cross-link**, **Bubble**, **Branch**, **Carousel**, **Theme** -- are used
> here with exactly that meaning; **explainer** and **main image** are defined in 5.9 and
> 5.2. The decisions behind this document are recorded one per file in
> `docs/adrs/ADR-118-*.md` (`elsa-tree/4`), `ADR-78-*.md` (`elsa-tree/3`), `ADR-37-*.md`
> (`elsa-tree/2`) and `ADR-4-*.md` (`elsa-tree/1`), section 11.

This document is written so that a third party -- another ELSA lab, or the owner of this
project -- can produce a complete Tree from it alone, with whatever tool they write it
with, and check it against the schema of 3.9 before it ever meets this application.
Section 8 contains a complete, loadable example Tree in English and Dutch; section 9 shows
what changes for a Tree with a single language; section 12 says how a Tree written in an
earlier version is converted.

## 1. Overview

A Tree is a **folder** holding **one text file** and up to two folders of asset files:

```
trees/
  <tree-id>/
    tree.json               the whole Tree: the manifest, the Theme, and every Node
    images/                 the Tree's Images, placed here by hand (optional folder)
      <file>
    theme/                  the Theme's files: logo, icon, fonts (optional folder)
      <file>
```

- `tree.json` is **one JSON object** (RFC 8259, UTF-8). It carries `$schema` and `format`,
  the **manifest fields** (identity, languages, root, metadata, Theme) at its top level,
  and **`nodes`: an array holding every Node, in the author's order**, each element with
  its own `id`. Section 4 has the manifest, section 5 a Node, section 3.7 the JSON rules
  and the byte form, section 3.9 the schema.
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
- **The file is written by tools and read by tools.** It has no comments, no formatting
  promises beyond the byte form of 3.7, and no place for a note that is not data: an
  author's note goes in a `metadata` key. The same bytes are served to the public at the
  dataset endpoint (`docs/specs/application.md` 15), so the file, the validator's input
  and the published dataset are one thing.

All folders under `trees/` are read by the loader; nothing else in the repository is
part of a Tree. Which Tree a deployment serves is outside this contract
(`docs/specs/application.md` section 2).

## 2. Files and names

| Path | Meaning | Rule |
|---|---|---|
| `trees/<tree-id>/` | One Tree. | `<tree-id>` is an **id** (section 3.1). The folder name *is* the Tree's id; there is no `id` field in the manifest. |
| `trees/<tree-id>/tree.json` | The whole Tree (section 4, section 5). | Required, exactly this name. |
| `trees/<tree-id>/images/<file>` | One image file. | `<file>` follows the image file name rule (section 3.5). Flat: sub-folders are not read. The folder may be absent if no Node has Images. |
| `trees/<tree-id>/theme/<file>` | One Theme file: a logo, an icon, a font. | `<file>` follows the theme file name rule (section 3.6). Flat. The folder may be absent if the Tree has no Theme or the Theme names no files. |

One file of this repository is not part of a Tree and belongs beside this table because
every Tree points at it:

| Path | Meaning |
|---|---|
| `schemas/elsa-tree-4.json` | The JSON Schema of this format (3.9). Served at `/schemas/elsa-tree-4.json`. Every `tree.json` names it in `$schema`. |

Anything else inside a Tree folder (a `README.md`, a `NOTES.md`, a `drafts/` folder,
a licence text next to a font, editor files) is ignored by the loader. That is the place
for work in progress that must not yet be validated. There is no `nodes/` folder any
more and no `tree.yaml`; a file or folder of either name is ignored like any other.

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

A Node's id is the value of its `id` key (section 5). Since a Node has neither a file nor
a mapping key of its own, the `id` key is the one and only place the id is written, and
every element of `nodes` must have one.

### 3.2 Node references

Wherever a Link names its target, it does so with a **Node reference**: the id of a
Node in the same Tree, as a plain string: `"target": "social-scoring"`. A reference
containing a colon is an error (rule V-CROSS, which the id grammar of 3.1 gives for
free); the shape `tree-id:node-id` is reserved for future Cross-links and must not be
used yet.

### 3.3 Languages and localised text

The manifest declares the languages the Tree provides as a list of **language tags**:
lowercase [BCP 47](https://www.rfc-editor.org/info/bcp47) tags such as `en`, `nl`,
`de`, `pt-br`:

```
^[a-z]{2,3}(-[a-z0-9]{2,8})*$
```

A **localised text** is a mapping from language tag to string. It must contain a
non-empty string for **every** language the manifest declares, and no other keys:

```json
"title": {
  "en": "Does the AI Act apply?",
  "nl": "Is de AI-verordening van toepassing?"
}
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
  `description`, the logo's `alt`) are a single line: the string contains no line break
  (rule V-PLAIN). Markdown is not interpreted in them.
- **Rich text** fields (a Node's `description`, the manifest's `description`) are a
  **single JSON string whose line breaks are written `\n`**, and may use this subset of
  [CommonMark](https://commonmark.org/): paragraphs separated by a blank line (`\n\n`),
  `*emphasis*`, `**strong**`, bulleted lists (`- `), numbered lists (`1. `), and links
  `[text](https://...)`. The frontend opens such links in a new tab, like Source
  links. Nothing else is part of the contract: headings, tables, raw HTML, embedded
  images and footnotes are not supported. Raw HTML is an error (rule V-HTML). Images
  belong in `images`, never inline.
- **An explainer mark** is the link syntax with a fragment target: `[providers](#provider)`
  in a Node's `description` marks those words as carrying the explainer whose `id` is
  `provider` on the same Node (5.9). The mark's text is what the reader sees and may be
  any inflection of the term; the frontend styles it as hoverable, so a mark is not
  written inside `*emphasis*` or `**strong**` (rule V-MARK). Only the description carries
  marks: a title is plain text.

Multi-paragraph text, as it appears in the file:

```json
"description": {
  "en": "The first paragraph. Its line breaks are joined into spaces when rendered.\n\nA blank line starts the second paragraph. A list:\n\n- one entry\n- another entry",
  "nl": "De eerste alinea.\n\nDe tweede alinea."
}
```

The string is one line of the file however long it is; the byte form of 3.7 does not wrap
it, and no tool may. A `\n` inside it is a line break of the text, not of the file, and
counts as one character (3.8). `elsa-tree/3` wrote the same text as a YAML block scalar,
which ended with a trailing line break that 3.8 step 1 stripped before measuring; the
conversion of 12.6 drops that one character, so no text changes length.

Rich text is short in `elsa-tree/4`: a Node's description has at most 150 characters and
must fit an estimate of 2 rendered lines, and the Tree's at most 600 and 8 (section 3.8,
section 5.7; 600 and 8 for a Node until #102). A Node that needs more becomes several
Nodes (core document 3.3, item 8).

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

The same grammar, with the extensions a Theme needs -- and it is **two** grammars, one
per role, because a logo is never a font file and a font file is never a logo:

```
logo or icon   ^[a-z0-9]+([._-][a-z0-9]+)*\.(svg|png|webp|ico)$   at most 128 characters
font file      ^[a-z0-9]+([._-][a-z0-9]+)*\.woff2$                at most 128 characters
```

A logo or icon is `.svg`, `.png`, `.webp` or `.ico`; a font file is `.woff2` and nothing
else (one modern, compressed format; every browser the application supports reads it).
**[#118]** Until this freeze the block above was written once, as the union of the two
extension sets, with the split stated only in the sentence that follows it. The schema
of 3.9 carries the two separately (`logoFileName` and `fontFileName`), so a Theme naming
`"logo": {"light": "a.woff2"}` is refused by the schema and not only by V-THEME's file
check; the published grammar now says the same thing. **No rule changed** -- `.woff2` was
never a logo and `.svg` was never a font -- only what section 3.6 states out loud.
The Theme refers to a file by this bare name; the loader resolves it inside the Tree's
own `theme/` folder and nowhere else. A file is served as a file, never inlined into the
page: an SVG logo is shown through `<img>`, so a script inside it cannot run. (How the
files are served is `docs/specs/application.md`, issue #38.)

### 3.7 JSON rules, and the byte form

`tree.json` is one JSON object as RFC 8259 defines it, and nothing more: no JSON5, no
JSONC, no trailing comma, no comment. What follows is what a writer must do and what a
reader may rely on. `docs/adrs/ADR-118-json-serialisation.md` has the reasoning.

**The rules a Tree must obey.**

- **One top-level object.** Not an array, not a stream of objects. Its keys are
  `$schema`, `format`, the manifest fields and `nodes` (section 4).
- **`$schema` is required and is written first.** Its value is the origin-relative path
  `/schemas/elsa-tree-4.json`, or an absolute `http://` or `https://` URL whose path ends
  with `/schemas/elsa-tree-4.json` for a Tree that publishes the schema elsewhere (rule
  V-SCHEMA, 3.9). The loader never fetches it.
- **No duplicate keys** in any object (rule V-JSON). Most parsers keep the last and say
  nothing, which is exactly the silent loss this rule exists to prevent. **This one rule
  needs a mechanism named, because the obvious one does not work.** A standard JSON
  parser cannot report a duplicate: on Node 22, `JSON.parse('{"a":1,"a":2}')` returns
  `{a: 2}` without complaint, and a reviver does not help -- it is called once for `a`,
  after the duplicate has already been discarded. The check is therefore a **scan of the
  file's raw text**, made by the loader (`src/tree/loader.ts`) before it hands the parsed
  value on: a single pass that tracks string, object and array boundaries and the keys
  seen in the object currently open, and reports the first repeat with its position, in
  the same form as a parse error. It is about sixty lines and takes no dependency. It is
  the only rule of this format that reads the bytes rather than the value, and it is
  worth it because a duplicate key is the one malformation that changes what a Tree says
  without changing whether it loads. Issue #119 writes it with the loader.

  Two limits, stated so nobody assumes more. **The rule binds the file, not every
  reader**: a third-party consumer that calls its language's `JSON.parse` on
  `/<tree-id>/tree.json` gets the last value silently, and this format cannot change
  that. And a **conforming writer cannot produce a duplicate** in the first place, since
  the byte form below is serialised from an in-memory object whose keys are unique by
  construction. The rule is aimed at a file that reached the repository some other way --
  a hand-merged conflict, a patch, a generator someone wrote in an afternoon.
- **No `null` as the value of any key this format defines** (rule V-NULL). An optional
  field that is absent is **omitted**: the key is not written.
- **No empty array and no empty object as the value of any key this format defines**
  (rule V-EMPTY). "No Sources" is the absence of `sources`, not `"sources": []` -- one
  way to say a thing, not three. What the loader holds in memory is a different matter:
  it normalises an absent list to an empty array (`docs/specs/application.md` 5.1),
  which is the one place the three ways would otherwise have to be made one.
- **Both stop at `metadata`**, and say so rather than leaving it to be discovered.
  `metadata` is the author's bag: open by decision, uninterpreted by the loader, and
  outside V-KEYS for the same reason. `"note": null`, `"note": {}` and `"note": []`
  inside it are the author's business and the schema accepts all three -- it enforces
  only `version` and the key-name rule of V-META. A rule written as enforced that never
  fires is the thing not to freeze; that was the lesson of V-JSON above, and it applies
  to its own neighbours.
- **Unknown keys are errors** (rule V-KEYS), at every level except inside `metadata`. A
  misspelt `"anwsers"` must fail loudly, not silently become an explanation Node.
- **Numbers and booleans appear nowhere in the contract.** Every value this format
  defines is a string, an object or an array -- `version` is `"1.0"` and not `1.0`, a
  colour is `"#ffffff"`, a font weight is `"400"`. Only inside `metadata`, which the
  loader does not interpret, may an author write a number or a boolean.
- **The keys `yes` and `no`** are ordinary strings in JSON, so the YAML 1.1 trap that
  turned them into booleans -- and the warning `elsa-tree/3` had to carry about it -- is
  gone.
- **UTF-8 without a byte-order mark.** Escape sequences are allowed where JSON allows
  them, but the canonical form below writes non-ASCII characters as themselves.
- **There are no comments.** The `--- # <id>` table of contents and the author's comments
  of `elsa-tree/3` do not survive the conversion (12.6). A note that must stay with the
  data goes in `metadata`, which is a free-form bag the loader keeps and does not read.

**The byte form.** A tool that writes a `tree.json` writes exactly these bytes:

- the value serialised as `JSON.stringify(value, null, 2)` does it -- two-space
  indentation, one key or array element per line, `": "` between a key and its value, no
  space inside empty brackets (there are none, by V-EMPTY) -- followed by **one line
  feed**;
- `\n` line endings, no trailing whitespace on any line, UTF-8 with no byte-order mark;
- non-ASCII characters as themselves, not as `\uXXXX`; `/` not escaped; the escapes JSON
  requires (`\"`, `\\`, `\n`, `\t`, `\r`, `\b`, `\f`, and `\u00XX` for any other control
  character) and no others;
- **key order fixed by this document, not alphabetical**: `$schema`, `format`,
  `languages`, `root`, `title`, `description`, `metadata`, `theme`, `nodes` at the top
  level; per Node `id`, `title`, `description`, `metadata`, `sources`, `images`,
  `answers`, `options`, `explainers`, `terminal`; and inside every other object the order
  its table in sections 4 and 5 gives. Inside `metadata`, `version` comes first and the
  author's own keys keep the order they were written in. A localised text lists its
  languages in the order the manifest declares them.
- **A `metadata` key made only of digits is refused** (V-META, and the schema's
  `propertyNames` on `metadata`). It is the one key shape that would make the order above
  impossible to hold: a JavaScript object treats an integer-like key as an array index
  and puts it in front of everything else, so `{"version": "1.0", "2024": "note",
  "author": "x"}` re-serialises with `2024` first, `version` no longer first and the
  author's order gone -- and idempotence, the contract below, would fail on a file whose
  author did nothing wrong. Writing `note-2024` instead costs nothing and the rule fires
  at validation rather than as a mystery diff. This is the only constraint this format
  puts on the name of a key inside the free-form bag.

That form is chosen because every mainstream language's standard library produces it from
the same value with no bespoke pretty-printer, so the migration, the validator and the
frontend editor of the next round agree on the bytes without agreeing on a library. Two
consequences are contracts of their own: **writing a Tree that was just read changes no
byte** (idempotence, which 12.6 is tested against), and **a diff shows the fields that
changed and nothing else**.

A file that parses but is not in the canonical byte form is still a valid Tree: the byte
form binds writers, not readers. The loader does not reformat what it reads, and the
dataset endpoint serves the file's own bytes (`docs/specs/application.md` 15.1).

### 3.8 How text is measured

The limits of section 5.7 are checked on the **counted text** of a field:

1. Take the string value. Remove leading and trailing whitespace (a block scalar ends
   with a line break; it is not counted).
2. Replace every Markdown link `[text](url)` by its `text`. The URL is not shown to the
   reader, so it does not take space in the Bubble. An explainer mark `[text](#id)` (5.9)
   is a link for this rule: its text counts, its target does not. Every other character counts,
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

Worked example, English text of the root Node in section 8: one block, no break. The
paragraph has 117 characters -- the Markdown of its explainer mark `[provider](#provider)`
counts as the 8 characters of `provider` -- so it takes `ceil(117 / 75) = 2` estimated
lines, which is exactly the maximum. A paragraph and a one-line list item under it would be
`1 + 1` block lines `+ 1` break `= 3`: over it, however short the text. The validator
reports the estimate next to the maximum so that the author knows how much to cut.

### 3.9 The JSON Schema

The structural half of this contract is published as a JSON Schema (draft 2020-12) at
**`schemas/elsa-tree-4.json`** in this repository, and served by the app at
**`/schemas/elsa-tree-4.json`** (`docs/specs/application.md` 15.1). Every `tree.json`
names it in `$schema` (3.7). The format number is in the file name, so `elsa-tree/5` will
be `schemas/elsa-tree-5.json` beside it and this file stays where it is: a Tree written
today keeps a schema to point at after the next format lands.

**What the schema checks**, and therefore what any JSON Schema validator can check
without this application -- with no plugin, because every grammar in it is a `pattern`
and it uses no `format` keyword: types, which keys exist and which are required, no
unknown keys at any level (V-KEYS), the closed sets (the three Source kinds, the four
outcomes, the seven colour roles, the two font roles), the grammars of ids, language
tags, image and theme file names, colours, font weights and URLs, the absence of `null`
and of empty lists (V-NULL, V-EMPTY), that `$schema` and `format` name this version
(V-SCHEMA, V-FORMAT), and the two kind rules one Node object can state on its own: a
question Node is not also a Terminal, and a Terminal has no Answers and no Options
(V-KIND, V-TERMINAL).

**What the schema deliberately does not check**, and why:

- **The text limits of 5.7** (V-LENGTH, V-LINES), because a JSON Schema cannot compute
  them. They are measured on the **counted text** of 3.8 -- Markdown links replaced by
  their text, Unicode code points counted, and for rich text an estimated line count. A
  JSON Schema's `maxLength` counts the raw string, so for a description with two links
  the two numbers differ. A `maxLength: 600` would be a different rule wearing the same
  number, and an author would be told two things.
- **The list maxima of 5.7** (V-COUNT): 3 `sources`, 8 `options`, 10 `images`, 8
  `explainers`, 2 font families of 8 files each. The reason above does **not** reach
  these. They are plain counts of array entries, `maxItems` computes them exactly, and
  nothing in them comes from 3.8. They are left out for a different reason: every limit
  of 5.7 is written once, in 5.7, and reported once, by the rules, in the message form
  that names the Tree, the Node, the key path and the actual against the maximum.
  Putting half of that table in the schema would make a change to it an edit in two
  files, and would answer an author over one table in two voices -- a rule id and a
  sentence for a title that is too long, and for a ninth Option a JSON Pointer with
  `must NOT have more than 8 items`.
- **Two single-string rules a `pattern` could carry**: V-PLAIN (no `\n` in a plain text
  field) and V-HTML (in rich text, no `<` followed by a letter, `/` or `!`). Neither
  reads another part of the file. They stay with the rules because plain versus rich is
  a property of the **field**, not of the string, and this schema gives every localised
  text one definition (`localisedText`, in the schema's `$defs`); splitting it in two
  would restate in a regular expression what 3.4 and 3.5 already state, and would report
  raw HTML in a description as a pointer and a pattern instead of as V-HTML on a named
  key in a named language.
- **Every rule that must read another part of the file**, or the file system: V-L10N
  (exactly the declared languages), V-ROOT, V-ANSWERS, V-OPTIONS, V-ORPHAN, V-REACH,
  V-IMAGE (the file exists in `images/`), V-EXPLAINER, V-MARK and V-THEME's "at most one
  family per role".

Section 7 says, rule by rule, which of the two answers for it. The order is fixed: the
schema first, the rules of section 7 second, and neither translates the other's message.
A shape error names a JSON Pointer; a content error names the Tree id, the Node id, the
key path, the rule and the actual against the maximum. `docs/adrs/ADR-118-json-schema.md`
records the decision and the rejected alternatives.

## 4. The manifest: the top-level fields of `tree.json`

```json
{
  "$schema": "/schemas/elsa-tree-4.json",
  "format": "elsa-tree/4",
  "languages": ["en", "nl"],
  "root": "start",
  "title": {
    "en": "Does the EU AI Act apply to my agrifood AI system?",
    "nl": "Is de EU AI-verordening van toepassing op mijn agrifood-AI-systeem?"
  },
  "description": {
    "en": "An interactive walk through the applicability of Regulation (EU) 2024/1689.",
    "nl": "Een interactieve doorloop van de toepasselijkheid van Verordening (EU) 2024/1689."
  },
  "metadata": {
    "version": "1.0",
    "author": "ELSA-Lab for sustainable food systems, Wageningen University"
  },
  "theme": { "...": "optional; section 4.3" },
  "nodes": [ "... section 5 ..." ]
}
```

(The last two values are placeholders for this illustration only; `"..."` is not a key of
anything.) The `languages` array is shown on one line for readability here; the canonical
byte form of 3.7 puts one element per line, as section 8 shows.

| Key | Required | Type | Meaning |
|---|---|---|---|
| `$schema` | yes | string | The JSON Schema of this format (3.9), as the origin-relative path `/schemas/elsa-tree-4.json` or an absolute http(s) URL ending the same way. Written first. Not fetched by the loader. |
| `format` | yes | string, exactly `elsa-tree/4` | The version of this contract the Tree is written against. A loader that does not know the value rejects the Tree. |
| `languages` | yes | array of language tags, non-empty, distinct | The languages every localised text in the Tree provides. First entry is the default language. |
| `root` | yes | Node reference | The Node the walk starts at. Must be a question Node or a Terminal, never an explanation Node. |
| `title` | yes | localised text, plain, at most 80 characters | The Tree's name, shown by the frontend. |
| `description` | no | localised text, rich, at most 600 characters and 8 estimated lines (**[#102]** as a Node's description until 2026-09-19; the Tree's is not drawn in the Bubble and kept these) | What the Tree is about. Also what the dataset record and `llms.txt` say the Tree is (`docs/specs/application.md` 16.4, 16.5), so a Tree that omits it is described by its root Node instead. |
| `metadata` | yes | object | `version` (non-empty string) is required. A key made only of digits is refused (3.7). Any other keys are the author's own; the loader keeps them and does not interpret them. This is where a note that would have been a comment goes. |
| `theme` | no | Theme (4.3) | The look the frontend shows for this Tree. Absent: the frontend's plain default look. |
| `nodes` | yes | array of Node (section 5), non-empty | Every Node of the Tree, in the author's order. |

### 4.1 The manifest fields and `nodes`

The manifest is not a separate document any more: its fields **are** the top-level fields
of the object, beside `nodes`. A Node is an element of `nodes` and never carries `format`,
`$schema`, `theme`, `languages` or `root` (V-KEYS); the manifest never carries `id`
(4.2).

**`nodes` is an array, not an object keyed by id.** Four things follow from that, and they
are why it is an array (`docs/adrs/ADR-118-json-serialisation.md`):

- the author's order survives, and it is the Tree's reading order -- the root first, then
  the walk, each question Node followed by its explanation Nodes, is the recommendation --
  which the editor, the sitemap and a reader of the file all walk;
- **a duplicate id is a rule, not a silent merge**: two elements with `"id": "start"` fail
  V-NODE with both places named, where two `"start"` keys in one object are "last wins" in
  every mainstream parser and lose a Node without a message;
- the id stays one thing in one place -- the `id` key -- rather than a key that a rename
  must be kept in step with;
- a Node is searched for by the same string it is referenced by: `"id": "start"` beside
  `"target": "start"`.

**The order of `nodes` is free.** The loader indexes Nodes by `id`, not by position, so no
Link and no URL depends on it. A Tree with no Nodes is rejected (V-NODE, at least one
Node; V-ROOT, the root must exist).

### 4.2 The Tree's id

The folder name is the Tree's id, as in `elsa-tree/1`. The manifest has no `id` key
(V-KEYS). The Tree id appears in every Node URL, so renaming the folder breaks every
shared link; do not.

### 4.3 The Theme

A Tree carries the look its lab wants: logo, fonts, colours. The frontend reads them
from here and never carries a lab's branding in its own code (core document 3.2, 9).
Everything the Theme names is a file in the Tree's own `theme/` folder; nothing is
fetched from anywhere else at run time.

```json
"theme": {
  "logo": {
    "light": "elsa-lab-logo.svg",
    "dark": "elsa-lab-logo-white.svg",
    "icon": "elsa-lab-icon.png",
    "alt": {
      "en": "ELSA-Lab for sustainable food systems",
      "nl": "ELSA-Lab voor duurzame voedselsystemen"
    },
    "url": "https://ai4sfs.org"
  },
  "fonts": [
    {
      "family": "Open Sans",
      "role": "body",
      "files": [
        { "file": "open-sans-400.woff2", "weight": "400", "style": "normal" },
        { "file": "open-sans-400-italic.woff2", "weight": "400", "style": "italic" },
        { "file": "open-sans-700.woff2", "weight": "700", "style": "normal" }
      ],
      "licence": "SIL Open Font License 1.1 (theme/ofl-open-sans.txt)"
    },
    {
      "family": "Nova Square",
      "role": "heading",
      "files": [
        { "file": "nova-square-400.woff2", "weight": "400", "style": "normal" }
      ],
      "licence": "SIL Open Font License 1.1 (theme/ofl-nova-square.txt)"
    }
  ],
  "colours": {
    "background": "#ffffff",
    "surface": "#f0f3f7",
    "text": "#2d2e33",
    "text-muted": "#a3a4a8",
    "accent": "#ffc600",
    "accent-secondary": "#41ab64",
    "danger": "#e44e56"
  }
}
```

(Shown here with each font file on one line for readability; the canonical byte form of
3.7 gives every key its own line, as section 8 shows.)

The three parts are independent: a Theme may carry any one, two or all three of
`logo`, `fonts` and `colours`, but it must carry at least one (V-THEME; an empty
`"theme": {}` is not written at all, V-EMPTY). **Each part that is present is complete**: a
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

An object with **exactly** these seven keys, each a colour written as a string of `#`
and six lowercase hexadecimal digits (`^#[0-9a-f]{6}$`). No alpha, no names, no
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

## 5. A Node: one element of `nodes`

A Node is an object with these keys, written in this order (3.7):

| Key | Required | Type | Meaning |
|---|---|---|---|
| `id` | yes | id (3.1), unique in the Tree | The Node's id: what URLs, the Trail and Links use. Written first. |
| `title` | yes | localised text, plain, at most 80 characters | The Node's heading, shown in the Bubble and on the Branch that leads to it. A step counter such as `(1/7)` is written here, at the end (5.8). |
| `description` | yes | localised text, rich, at most 150 characters and 2 estimated lines (**[#102]** amended 2026-09-19; 600 and 8 until #102) | The explanatory text, shown in the Bubble. |
| `metadata` | yes | object | `version` (non-empty string) required; no key made only of digits (3.7); the rest free-form, kept but not interpreted. A note that would have been a comment goes here. |
| `sources` | no | array of Source (5.1), at most 3 | References this Node cites. Absent means none. |
| `images` | no | array of Image (5.2), at most 10 | The Node's pictures: the **first is its main image**, shown above the title in the Bubble and, small, on the Option button that leads to this Node; the rest are the Carousel's. Absent means none. |
| `answers` | see 5.6 | Answers (5.3) | The yes/no Links. Present exactly on question Nodes. |
| `options` | no | array of Option (5.4), at most 8 | The clickable list of entries, each opening an explanation Node in an Overlay. Allowed on question Nodes and explanation Nodes; never on a Terminal. |
| `explainers` | no | array of Explainer (5.9), at most 8 | The terms of this Node's description that carry a short explanation shown on hover. Absent means none. |
| `terminal` | see 5.6 | Terminal marker (5.5) | Present exactly on Terminals. |

There is no `kind` key: the kind follows from which of `answers` / `terminal` is present
(5.6). The limits are collected in 5.7. An absent optional key is **omitted**, never
`null` and never an empty array (3.7, rules V-NULL and V-EMPTY).

### 5.1 Source

```json
"sources": [
  {
    "id": "art-2",
    "kind": "legal",
    "label": {
      "en": "Article 2 AI Act (scope)",
      "nl": "Artikel 2 AI-verordening (toepassingsgebied)"
    },
    "url": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
  }
]
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `id` | no | id, unique within the Node | A handle so an Image on this Node can point at this Source. Written first when present. |
| `kind` | yes | one of `legal`, `case-law`, `literature` | The three kinds of reference, labelled distinctly so the frontend can group or style them. `legal`: an article, annex or recital of a regulation or directive. `case-law`: a court decision. `literature`: anything else -- papers, guidance, books, reports. |
| `label` | yes | localised text, plain, at most 60 characters | The visible text of the link. Short: `Article 5(1)(c) AI Act`, not the article's title. |
| `url` | yes | string, absolute `http://` or `https://` URL | Where the link goes; opened in a new tab; never fetched by the app. One URL for all languages -- prefer language-neutral URLs (EUR-Lex's `/eli/...` addresses negotiate the reader's language). |

Sources are written **inline on the Node that cites them** (core document 10.11). The
same reference cited by two Nodes is written twice; there is no shared registry. The
`legal` Sources are also what the dataset record's `isBasedOn` is derived from
(`docs/specs/application.md` 16.4), which is one more reason to give a Tree's legal
citations one consistent URL.

### 5.2 Image

```json
"images": [
  {
    "file": "eu-map.png",
    "description": {
      "en": "Map of the EU member states",
      "nl": "Kaart van de EU-lidstaten"
    },
    "credit": "Map: Example Cartography, CC BY 4.0",
    "source": "art-2"
  }
]
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `file` | yes | image file name (3.5) | A file in this Tree's `images/` folder. Must exist. |
| `description` | yes | localised text, plain, at most 120 characters | What the picture shows: the accessible alternative text, and the name of the picture's link. Not displayed as a caption. |
| `credit` | yes | non-empty string, at most 120 characters | Attribution and licence, reproduced as written. Shown whole in the enlarged view a click on the picture opens, and read as the picture's accessible description (`application.md` 12.3). Required for every Image without exception. |
| `source` | no | id of a Source on the same Node | Where the picture or its content comes from. |

**The Carousel needs nothing more than this.** The order of the array is the order of
the pictures, and **the first entry is the Node's main image**: shown 60 pixels tall above
the Node's title in its Bubble and in its Overlay, and small on the button of every Option
that leads to the Node (`application.md` 10.3). The entries after it are the Carousel's,
in order. Nothing is written under a picture: the `description` is its alternative text
and the `credit` is shown in the enlarged view and read as the picture's description.
There is no `order` key, no `caption` key and no `main` key: the array is the order, and a
Node that wants a different main image moves it up the array. The keys are unchanged from
`elsa-tree/1` (`docs/adrs/ADR-37-images-carousel.md`, `ADR-78-carousel.md`,
`ADR-78-main-image-and-row-budget.md`).

### 5.3 Answers

```json
"answers": {
  "yes": "prohibited-practices",
  "no": "outside-scope"
}
```

Exactly the two keys `yes` and `no`, each a Node reference. In JSON they are strings by
construction, so a loader needs no rule to keep them from becoming booleans -- which is
one trap of `elsa-tree/3` that `elsa-tree/4` simply does not have. The target of an Answer
must be a question Node or a Terminal -- never an explanation Node, because arriving
at an explanation Node by an Answer would leave the user with no way forward. The
labels "yes" and "no" are UI chrome, translated by the frontend, not by the Tree. On
screen an Answer is a Branch out of the Bubble, labelled with its target's `title`.

### 5.4 Option

```json
"options": [
  {
    "title": {
      "en": "Social scoring",
      "nl": "Sociale scoring"
    },
    "target": "social-scoring"
  }
]
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `title` | yes | localised text, plain, at most 60 characters | The entry's text: the label of its Branch out of the Bubble. |
| `target` | yes | Node reference | The explanation Node that expands on this entry. Must be an explanation Node (5.6). |

**An Option has no Images of its own** (`elsa-tree/3`; `docs/adrs/ADR-78-fan-out-and-option-picture.md`).
The picture on its button is its target's main image, the first entry of the target's
`images` (5.2): a picture that shows what an entry covers is written once, on the Node
that explains it, and the button and the Overlay show the same file. An `images` key on
an Option is an error (V-KEYS).

Options in one array have distinct targets. Several Nodes may point at the same
explanation Node. The order of the array is the order shown. **At most 8 Options on a
Node**: a longer list becomes several Nodes, each a step with its own title (5.8), as
the owner's "(1/7)" example does for the seven jurisdiction categories.

### 5.5 Terminal marker

```json
"terminal": { "outcome": "not-applicable" }
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

A Node with both `answers` and `terminal` is an error, and it is one the schema of 3.9
catches on its own. An explanation Node reached through an Option is "explanation only"
(core document 3.1, traversal rule): on screen it opens in an Overlay over its parent's
page (`application.md` 10.9); the user reads it, may follow its own Options, and closes it
to answer the parent's question. A Trail is therefore just a list of Node ids, which the
frontend can carry in a shareable link.

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
| Node `description` (any language) | 150 characters and 2 estimated lines (600 and 8 until #102) | V-LENGTH, V-LINES |
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
| Explainer `term` (any language) | 40 characters | V-LENGTH |
| Explainer `text` (any language) | 200 characters | V-LENGTH |
| `explainers` on a Node | 8 entries | V-COUNT |
| `fonts` in a Theme | 2 families, 8 files each | V-COUNT |

`metadata` values and URLs have no length rule beyond their own grammar; they are not
shown in the Bubble. **[#118]** An **id** is capped at **64** characters and an image,
logo or font **file name** at **128**, and those two caps are in the schema
(`schemas/elsa-tree-4.json`, the `maxLength` keywords on `id`, `imageFileName`,
`logoFileName` and `fontFileName`) rather than here. They are not layout limits and
nothing in the Bubble depends on them: they are structural caps on machine-facing
tokens, which the schema can assert because the grammar of both is already ASCII, so a
code-point count is a byte count and section 3.8 has nothing to contribute. An id
travels in every URL and a file name in every image request; the caps keep either from
growing into a path or a header a server has to carry.

**The assumptions the numbers derive from.** They are written down so that the
application architecture, which fixes the layout, can confirm or correct them; if it
corrects them, the numbers here change with a new format number (**[#102]** amended
2026-09-19: except the cut below, which the owner took under `elsa-tree/3`). Issue #38 confirmed
them against the 0.2 layout; issue #78 re-derived them against the layout of #75 --
the Trail row gone, a main image above the title, a heading over the Sources, the
Carousel on the Bubble's lower edge -- and **confirmed every limit unchanged, with two
pixels to spare** (`application.md` 10.1, 10.7; `docs/adrs/ADR-78-main-image-and-row-budget.md`).
`docs/adrs/ADR-37-length-limits.md` has the original reasoning.

**Amended 2026-09-19 (#102, by the owner; answer (b) on PR #110): the Node description is
cut to 150 characters and 2 estimated lines.** The owner chose a main image of two fifths
of the Bubble on every Node over the description's length. The up arrow now stands above
the Bubble, which is 760 x 416 with a text area of 640 x 364, and the picture is 166.4 of
it; `application.md` 10.7 derives the 57.6 pixels left, of which two 24-pixel lines are
used. The rows below record the layout #78 confirmed; where this amendment changes one, its
new value is in the row after the word **Now**. No other limit moves, and the Tree
`description`, which is not drawn in the Bubble, keeps 600 characters and 8 lines.
The format number stays `elsa-tree/3`, though the rule above asks for a new one: the owner's
answer scoped the change to the limit and the validator, the shape of a Tree file is
unchanged, and a Tree written to the old limit is told by V-LENGTH and V-LINES which field
to cut, by how much (`application.md` 10.7).

| Assumption | Value |
|---|---|
| Viewport the layout guarantees | 1280 x 640 CSS pixels: a 1366 x 768 laptop display, or a 1920 x 1080 one at 150 % scaling, minus browser tabs, address bar and taskbar |
| Vertical budget at that height | chrome bar 44 + up-arrow band 26 + Bubble 446 + Carousel strip band 28 + Answer buttons 68 + disclaimer 28 = 640 (was: chrome 44 + Trail 64 + Bubble 360 + Branches 64 + Carousel 80 + disclaimer 28). **Now** (#102): chrome bar 44 + up-arrow band 56 + Bubble 416 + strip band 28 + Answer buttons 68 + disclaimer 28 = 640 |
| Text area inside the Bubble | 640 x 394 CSS pixels, inside the curve and the padding of a 760 x 446 rounded Bubble (was 640 x 304 in 760 x 360). **Now** (#102): 640 x 364 in 760 x 416 |
| Main image | 60 px tall, at most 90 wide, above the title; an empty slot of the same height on a Node without Images (`application.md` 10.3). **Now** (#102): two fifths of the Bubble's height, 166.4 px, in a 3 : 2 box |
| Body text | 16 px, line height 24 px, average advance 8.5 px per character (Open Sans and similar humanist sans-serifs): **75 characters per line** |
| Node title | 22 px, line height 28 px, about 55 characters per line: 80 characters is at most **2 lines** (56 px) |
| Sources | a 20 px heading line ("Legal sources"), then 13 px on 20 px lines, about 90 characters per line: 3 labels of 60 characters with two kind prefixes and separators is at most **2 lines**: 60 px in all |
| Description | what remains: 394 - 60 - 8 - 56 - 8 - 60 - 8 = 194 px, of which **8 lines** of 24 px = 192 are used, at 75 characters = 600 characters; 2 px spare. **Now** (#102): 364 - 166.4 - 8 - 56 - 8 - 60 - 8 = 57.6 px, of which **2 lines** of 24 px = 48 are used, at 75 characters = **150 characters**; 9.6 px spare |
| Explainer panel | 320 px wide, 14 px text on 20 px lines, about 45 characters per line: a 200-character `text` is at most 5 lines, and the panel with its `term` heading and padding at most 148 px, which fits above or below any line of the 394 px text area (5.9). **Now** (#102): any line of the 364 px text area; 148 fits still |
| Option button labels | an Option button of 232 x 96 px beside the Bubble, with 152 px of label at 16 px on 20 px lines, up to four lines: an Option title of 60 characters is at most **3 lines** in a humanist face and 4 in DejaVu Sans, the widest fallback (80 px, inside the 96 px button). **Amended 2026-09-19 (#105, PR #109):** not for every title: in Open Sans the Dutch "Seksueel beeldmateriaal zonder toestemming (2-12-2026)" (54 characters) takes 4 lines only hyphenated in the page's language and 5 without, and its button then grows to 102 px; the limit stays 60 for the owner to judge (`application.md` 10.3 and 10.7, both amended). The Options fan out at most 4 a side at a pitch of 111.5 px: four buttons are 384 px of the Bubble's 446, so 8 Options fit without narrowing or wrapping (**Now**, #102: of the Bubble's 416, which still holds the 384). A question Node that carries both `answers` and `options` (section 5.6) puts its 2 Answer buttons below the Bubble and its Options beside it, so the two never share a row (`application.md` 10.3, 10.7; `docs/adrs/ADR-78-fan-out-and-option-picture.md`) |
| Answer button labels, and the Trail | the label is the chrome word, a colon and a Node `title` of up to 80 characters (5.3, section 6): at most 86 characters in one run of 19 px bold on 24 px lines, in a 620 x 60 px button with 580 px of label, at least 43 characters per line in DejaVu Sans Bold: **2 lines** (48 px, inside the 60 px button). The 2 Answer buttons sit side by side in the 68 px Answer row. No Trail is drawn: the up arrow carries the parent's title as its accessible name only, so no Trail label has a width to fit; the format still does not bound a Trail's length, and a long one costs the screen nothing (`application.md` 10.2, 10.3, 10.7; `docs/adrs/ADR-78-answer-buttons-and-up-arrow.md`) |
| Carousel | a strip of 48 px round thumbnails on the Bubble's lower outline, the Images after the main one, seven visible, no caption; the description is alternative text and the credit is shown in the enlarged view, where it fits one line at 13 px (`application.md` 12) |

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

### 5.9 Explainers

```json
"explainers": [
  {
    "id": "provider",
    "term": {
      "en": "provider",
      "nl": "aanbieder"
    },
    "text": {
      "en": "Someone who develops an AI system, or has one developed, and places it on the market or puts it into service under their own name or trademark.",
      "nl": "Wie een AI-systeem ontwikkelt of laat ontwikkelen en het onder eigen naam of merk in de handel brengt of in gebruik stelt."
    }
  }
],
"description": {
  "en": "Are you a [provider](#provider) who places an AI system on the Union market? ..."
}
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `id` | yes | id (3.1), unique among this Node's explainers | What a mark in the description points at: `[providers](#provider)`. |
| `term` | yes | localised text, plain, at most 40 characters | The canonical word or phrase, shown as the panel's heading. The mark's own text may be an inflection of it. |
| `text` | yes | localised text, plain, at most 200 characters | The explanation, shown in the panel. One line of plain text: no emphasis, no links, no lists. |

An explainer belongs to the Node it is written on, like a Source (core document 10.11):
a term used on several Nodes is written on each. Every explainer must be marked at
least once in the description, in every language (V-EXPLAINER), and every mark must name
an explainer of the same Node (V-MARK); a mark is not written inside emphasis or strong
text. What the frontend shows -- the panel on hover, focus and tap, what a screen reader
hears, and what holds without JavaScript -- is `application.md` 10.8. The limits are
derived in 5.7. `docs/adrs/ADR-78-explainers.md` has the reasoning.

## 6. Loading: the file is read once, a page still receives one Node

The Tree is one file, so it is read as one file, and the moment it is read is the moment
it is validated:

- **At server start (or build time)** the loader reads `tree.json` once, parses it,
  validates it against the schema of 3.9, then checks every rule of section 7 and builds
  its index: Node id to parsed Node, Node id to title. That is the one whole-Tree read,
  server-side, one-off.
- **To render Node `x`** the server takes `x` from the index. It reads no file. The
  page is given **one Node, never the Tree**: its text in every language, its Sources,
  the file names of its own Images, its explainers, the *ids* of its Link targets, and the titles of
  the Trail from the title index. The Theme reaches the page from the manifest.
- **The browser** receives that one Node's HTML and then requests the image files it
  names, and the Theme files, as it needs them. Nothing in the format lets a Node refer
  to another Node's images, so "only the current Node's images" holds by construction.
  Which neighbouring Nodes may be pre-rendered ahead of a click, and through which
  route, is the application contract of issue #38; whatever it decides, **no page** is
  ever sent the whole Tree.
- **The dataset endpoint is the one place the whole file leaves the server**, and it is a
  URL a reader or a crawler asks for on purpose, not something a page carries: `GET
  /<tree-id>/tree.json` streams the same bytes that are on disk
  (`docs/specs/application.md` 15, `docs/adrs/ADR-118-dataset-endpoint.md`). The bound on
  what a *page* may carry is untouched by it.

A loader therefore keeps a narrow interface -- in words, not code: *validate a Tree folder
and report every violation*, *give me the manifest* (with its Theme), *give me Node `x`*,
*give me the title of Node `x`*, *resolve this image file name*, *resolve this theme file
name*, and, since the endpoint exists, *where is this Tree's own file*. Everything about
JSON, the schema and the rules below sits behind that interface; the frontend never
touches a file path. `docs/adrs/ADR-37-single-file-layout.md` records why holding the
parsed Tree in memory is the right trade, and
`docs/adrs/ADR-118-json-serialisation.md` why the file it parses is JSON.

## 7. Validity rules

A loader **rejects the whole Tree** if any rule fails, and reports every failure it
found (not just the first). A Tree is never partially loaded.

Two tools answer between them, in this order, and neither translates the other's message
(3.9):

- **the schema** (`schemas/elsa-tree-4.json`) reports a shape failure with a JSON Pointer
  into the file, e.g. `/nodes/3/options/2` -- *must NOT have additional properties*;
- **the rules** report a content failure with the Tree id, the Node id (or `manifest`),
  the key path inside it (e.g. `options[2].target`, `description.nl`), the rule id below,
  and a plain-language message that, for a length rule, names the actual and the maximum.

The **Where** column below says which of the two a rule belongs to.

### Tree level

| Rule | Where | A valid Tree has... |
|---|---|---|
| V-DIR | rules | a folder name that is an id (3.1), containing `tree.json`. `images/` and `theme/`, when present, are folders. |
| V-JSON | rules | a `tree.json` that parses as one JSON object (RFC 8259) in UTF-8 without a byte-order mark, with no duplicate key in any object. A file that does not parse is reported with the parser's position and nothing else is checked: unlike the YAML stream of `elsa-tree/3`, one JSON file is one document, so a syntax error anywhere is a syntax error everywhere. **The duplicate-key half is checked by a scan of the raw text, not by the parser**, which cannot see it (3.7 gives the mechanism and the measurement); it reports the first repeated key with its position. |
| V-SCHEMA | schema | `$schema`, as the path `/schemas/elsa-tree-4.json` or an absolute http(s) URL whose path ends the same way (3.7). |
| V-FORMAT | schema | `format` exactly `elsa-tree/4`. |
| V-NULL | schema | no `null` as the value of any key this format defines. An absent optional field is omitted. |
| V-EMPTY | schema | no empty array and no empty object as the value of any key this format defines. Inside `metadata` the schema accepts both, as it accepts `null` there (V-NULL, 3.7). |
| V-LANG | schema, rules | `languages`: a non-empty array of valid language tags (3.3), which the rules also check are distinct. |
| V-ROOT | rules | `root` naming an existing Node that is a question Node or a Terminal. |
| V-TITLE | schema, rules | `title` as a plain localised text, at the top level. |
| V-META | schema | `metadata` as an object whose `version` is a non-empty string (at the top level and on every Node), and **no key made only of digits** -- an integer-like key sorts to the front of a JavaScript object and would break the key order and the idempotence of 3.7. |
| V-KEYS | schema | no keys other than those listed in sections 4 and 5, at every level except inside `metadata`. `$schema`, `format`, `languages`, `root`, `theme` and `nodes` only at the top level; `id` never at the top level. |
| V-REACH | rules | every Node reachable from `root` by following Answers and Options. An unreachable Node is almost always a misspelt target. |
| V-THEME | schema, rules | `theme`, when present, an object with at least one of `logo`, `fonts`, `colours`, each as section 4.3 defines it: the schema checks the keys, the grammars, the seven colour roles and every font file's `weight` and `style`; the rules check that the files exist in `theme/` and that there is at most one font family per `role`. |

### Text

| Rule | Where | A valid Tree has... |
|---|---|---|
| V-L10N | rules | every localised text providing a non-empty string for every declared language and no keys for other languages. (The schema checks that it is an object of language tags to non-empty strings; which languages are the declared ones it cannot know.) |
| V-PLAIN | rules | plain text fields on a single line (no `\n` in the string). |
| V-HTML | rules | no raw HTML in rich text: the sequence `<` followed by a letter, `/` or `!` is rejected. |
| V-LENGTH | rules | every text field within the maximum characters of 5.7, per language, measured as 3.8 says. The message names the field, the language, the actual length and the maximum. |
| V-LINES | rules | every rich text within its estimated lines (3.8, 5.7): 2 for a Node description, 8 for the Tree's, per language. The message names the estimate and the maximum. |
| V-COUNT | rules | every array within the maximum entries of 5.7. |

### Node level

| Rule | Where | A valid Tree has... |
|---|---|---|
| V-NODE | schema, rules | a non-empty `nodes` array; every element with an `id` that is a valid id (schema) and is distinct from every other Node's (rules), and `title`, `description`, `metadata` present. |
| V-KIND | schema | at most one of `answers` and `terminal` on a Node. |
| V-ANSWERS | schema, rules | `answers` with exactly the keys `yes` and `no` (schema), each a Node reference to an existing question Node or Terminal (rules). |
| V-OPTIONS | schema, rules | `options`, when present, a non-empty array; each entry with `title` and `target` and nothing else (schema; an `images` key on an Option fails V-KEYS); targets existing explanation Nodes, distinct within the array (rules). |
| V-ORPHAN | rules | every explanation Node targeted by at least one Option (this is also implied by V-REACH, but gets its own message). |
| V-TERMINAL | schema | `terminal` as an object whose `outcome` is one of `not-applicable`, `applicable`, `prohibited`, `refer`; a Terminal has no `options`. |
| V-SOURCE | schema, rules | every Source with a `kind` in `legal` / `case-law` / `literature`, a plain localised `label`, an absolute http(s) `url` and a valid `id` when present (schema); Source ids distinct within the Node (rules). |
| V-IMAGE | schema, rules | every Image with a `file` matching 3.5, a plain localised `description` and a non-empty `credit` (schema); the file existing in the Tree's `images/`, and a `source`, if present, naming a Source id on the same Node (rules). |
| V-EXPLAINER | schema, rules | `explainers`, when present, a non-empty array; each with a valid `id`, a plain localised `term` and a plain localised `text` (schema); ids distinct within the Node, at most 8 entries, the lengths of 5.7, and each marked at least once in the Node's `description` in every declared language (rules). |
| V-MARK | rules | every `[text](#id)` in a `description` names an explainer `id` of the same Node, has non-empty text, and is not inside `*emphasis*` or `**strong**`. |
| V-CROSS | schema | no Node reference containing `:` -- which the id grammar excludes, so the schema catches it (Cross-links are not part of `elsa-tree/4`). |

Not errors: an image file in `images/` or a file in `theme/` that nothing references; a
Node reached by more than one Link; a cycle among question Nodes (the Tree is
graph-shaped by design; the Trail is how the user finds their way back); the elements of
`nodes` in any order; a file that parses but is not in the canonical byte form of 3.7
(the byte form binds writers, not readers).

## 8. Complete example Tree (English and Dutch)

The Tree below is complete and valid: it observes every limit of 5.7 and exercises
every element of the format, including a Theme, Images and an explainer. It is **illustrative
content**: the legal statements are simplified sketches used to show the format, not
verified readings of the AI Act. The real first Tree is authored separately.

It is also the `elsa-tree/4` form of the `elsa-tree/3` example this section held before,
produced by the procedure of 12.6 and validated against `schemas/elsa-tree-4.json`. Issue
#119 converts `trees/ai-act-example/tree.yaml` into `trees/ai-act-example/tree.json`, and
that file is byte-identical to the block below.

Folder layout:

```
trees/
  ai-act-example/
    tree.json
    images/
      eu-map.png
      scoreboard.png
      outside-scope.png
      prohibited-practices.png
      emotion-recognition.png
      prohibited.png
      covered.png
    theme/
      example-lab-logo.svg
      example-lab-logo-white.svg
      nova-square-400.woff2
      ofl-nova-square.txt            licence text; not referenced, ignored by the loader
      LICENCE.md                     ownership of the logo; likewise ignored
```

Shape: `start` is the root question Node with an Image (its main image), a legal Source and an explainer for "provider". Its `no`
Answer ends at the Terminal `outside-scope`; its `yes` Answer leads to
`prohibited-practices`, a question Node with two Options, each opening an explanation
Node (`social-scoring`, with a case-law and a literature Source and a main image, which
its Option's button shows; `emotion-recognition-at-work`). Answering `yes` there reaches the Terminal
`prohibited`, `no` reaches the Terminal `covered`. Every Node carries a main image (issue #84).

The Theme is **deliberately unlike the first Tree's** (issue #40; `ADR-38-theme-delivery`,
Consequences: "the example Tree and the first Tree can ship deliberately different Themes
on the same build, which is what makes the interoperability requirement visible rather
than claimed"). It carries a mark that is no real laboratory's, a dark palette -- so the
frontend derives that `logo.dark` is the variant to show -- and one font family in the
`heading` role only, which leaves its running text in the frontend's own type stack. That
last choice makes this Tree the one that exercises the `fonts` fallback of 4.3.2 as well
as `@font-face` itself. The Theme of the first Tree, `trees/ai-act-applicability-agrifood`,
is the identity issue #36 measured on https://ai4sfs.org.

Note what an `elsa-tree/3` reader will miss here: the comments that stood above the
manifest and the Theme, and the `--- # <id>` line before every Node. JSON has neither, and
none is invented (3.7). What those comments said is in this section's prose, where a
reader of the contract finds it; what an author needs to keep beside the data goes in
`metadata`.

### `trees/ai-act-example/tree.json`

```json
{
  "$schema": "/schemas/elsa-tree-4.json",
  "format": "elsa-tree/4",
  "languages": [
    "en",
    "nl"
  ],
  "root": "start",
  "title": {
    "en": "Does the EU AI Act apply to my AI system? (example)",
    "nl": "Is de EU AI-verordening van toepassing op mijn AI-systeem? (voorbeeld)"
  },
  "description": {
    "en": "A small example Tree that exercises every element of the `elsa-tree/4` format.\nIts legal content is simplified and not to be relied on.",
    "nl": "Een kleine voorbeeldboom die elk onderdeel van het `elsa-tree/4`-formaat gebruikt.\nDe juridische inhoud is vereenvoudigd en niet bedoeld om op te vertrouwen."
  },
  "metadata": {
    "version": "2.0",
    "author": "ELSA-Lab for sustainable food systems, Wageningen University",
    "licence": "CC BY 4.0 (CONTENT-LICENSE at the repository root)"
  },
  "theme": {
    "logo": {
      "light": "example-lab-logo.svg",
      "dark": "example-lab-logo-white.svg",
      "alt": {
        "en": "Example Lab",
        "nl": "Voorbeeldlab"
      },
      "url": "https://example.org"
    },
    "fonts": [
      {
        "family": "Nova Square",
        "role": "heading",
        "files": [
          {
            "file": "nova-square-400.woff2",
            "weight": "400",
            "style": "normal"
          }
        ],
        "licence": "SIL Open Font License 1.1 (theme/ofl-nova-square.txt)"
      }
    ],
    "colours": {
      "background": "#161a1d",
      "surface": "#212729",
      "text": "#eef1f2",
      "text-muted": "#9aa5aa",
      "accent": "#e2604a",
      "accent-secondary": "#5aa9c9",
      "danger": "#ff8a7a"
    }
  },
  "nodes": [
    {
      "id": "start",
      "title": {
        "en": "Is your AI system within the reach of the AI Act?",
        "nl": "Valt uw AI-systeem binnen het bereik van de AI-verordening?"
      },
      "description": {
        "en": "The AI Act reaches AI systems **placed on the market or put into service in the EU**, wherever the [provider](#provider) is based.",
        "nl": "De AI-verordening bestrijkt AI-systemen die **in de EU in de handel worden gebracht of in gebruik worden gesteld**, waar de [aanbieder](#provider) ook zit."
      },
      "metadata": {
        "version": "2.0"
      },
      "sources": [
        {
          "id": "art-2",
          "kind": "legal",
          "label": {
            "en": "Article 2 AI Act (scope)",
            "nl": "Artikel 2 AI-verordening (toepassingsgebied)"
          },
          "url": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
        }
      ],
      "images": [
        {
          "file": "eu-map.png",
          "description": {
            "en": "Map of the European Union member states",
            "nl": "Kaart van de lidstaten van de Europese Unie"
          },
          "credit": "Map: Example Cartography, CC BY 4.0",
          "source": "art-2"
        }
      ],
      "answers": {
        "yes": "prohibited-practices",
        "no": "outside-scope"
      },
      "explainers": [
        {
          "id": "provider",
          "term": {
            "en": "provider",
            "nl": "aanbieder"
          },
          "text": {
            "en": "Someone who develops an AI system, or has one developed, and places it on the market or puts it into service under their own name or trademark.",
            "nl": "Wie een AI-systeem ontwikkelt of laat ontwikkelen en het onder eigen naam of merk in de handel brengt of in gebruik stelt."
          }
        }
      ]
    },
    {
      "id": "outside-scope",
      "title": {
        "en": "The AI Act does not apply",
        "nl": "De AI-verordening is niet van toepassing"
      },
      "description": {
        "en": "Your system is outside the territorial scope of the AI Act. Other rules may still\napply to it; this Tree does not cover them.",
        "nl": "Uw systeem valt buiten het territoriale toepassingsgebied van de AI-verordening."
      },
      "metadata": {
        "version": "2.0"
      },
      "images": [
        {
          "file": "outside-scope.png",
          "description": {
            "en": "Placeholder picture for a system outside the scope",
            "nl": "Plaatsvervangende afbeelding voor een systeem buiten het toepassingsgebied"
          },
          "credit": "Placeholder drawn for this repository, CC0 1.0"
        }
      ],
      "terminal": {
        "outcome": "not-applicable"
      }
    },
    {
      "id": "prohibited-practices",
      "title": {
        "en": "Does your system do any of the prohibited practices?",
        "nl": "Verricht uw systeem een van de verboden praktijken?"
      },
      "description": {
        "en": "Article 5 lists practices that are **prohibited** outright. Open each entry to read what it covers, then come back here and answer.",
        "nl": "Artikel 5 noemt praktijken die zonder meer **verboden** zijn. Open elk onderdeel om te lezen wat het inhoudt, en kom dan hier terug om te antwoorden."
      },
      "metadata": {
        "version": "2.0",
        "reviewed": "2026-09-10"
      },
      "sources": [
        {
          "kind": "legal",
          "label": {
            "en": "Article 5 AI Act (prohibited AI practices)",
            "nl": "Artikel 5 AI-verordening (verboden AI-praktijken)"
          },
          "url": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
        }
      ],
      "images": [
        {
          "file": "prohibited-practices.png",
          "description": {
            "en": "Placeholder picture for the prohibited practices",
            "nl": "Plaatsvervangende afbeelding voor de verboden praktijken"
          },
          "credit": "Placeholder drawn for this repository, CC0 1.0"
        }
      ],
      "answers": {
        "yes": "prohibited",
        "no": "covered"
      },
      "options": [
        {
          "title": {
            "en": "Social scoring",
            "nl": "Sociale scoring"
          },
          "target": "social-scoring"
        },
        {
          "title": {
            "en": "Emotion recognition at work or in education",
            "nl": "Emotieherkenning op het werk of in het onderwijs"
          },
          "target": "emotion-recognition-at-work"
        }
      ]
    },
    {
      "id": "social-scoring",
      "title": {
        "en": "Social scoring",
        "nl": "Sociale scoring"
      },
      "description": {
        "en": "Evaluating or classifying people over time on the basis of their social behaviour or personal characteristics, where the resulting score leads to…",
        "nl": "Het beoordelen of indelen van mensen gedurende een periode op basis van hun sociale gedrag of persoonlijke kenmerken, waarbij de score leidt tot…"
      },
      "metadata": {
        "version": "2.0"
      },
      "sources": [
        {
          "kind": "legal",
          "label": {
            "en": "Article 5(1)(c) AI Act",
            "nl": "Artikel 5, lid 1, onder c, AI-verordening"
          },
          "url": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
        },
        {
          "kind": "case-law",
          "label": {
            "en": "CJEU, C-634/21 SCHUFA (Scoring), 7 December 2023",
            "nl": "HvJ EU, C-634/21 SCHUFA (Scoring), 7 december 2023"
          },
          "url": "https://curia.europa.eu/juris/liste.jsf?num=C-634/21"
        },
        {
          "kind": "literature",
          "label": {
            "en": "Veale & Zuiderveen Borgesius (2021), Demystifying the AI Act",
            "nl": "Veale & Zuiderveen Borgesius (2021), Demystifying the AI Act"
          },
          "url": "https://arxiv.org/abs/2107.03721"
        }
      ],
      "images": [
        {
          "file": "scoreboard.png",
          "description": {
            "en": "A scoreboard ranking people",
            "nl": "Een scorebord dat mensen rangschikt"
          },
          "credit": "Illustration: Example Studio, CC0 1.0"
        }
      ]
    },
    {
      "id": "emotion-recognition-at-work",
      "title": {
        "en": "Emotion recognition at work or in education",
        "nl": "Emotieherkenning op het werk of in het onderwijs"
      },
      "description": {
        "en": "Inferring the emotions of a person in the workplace or in an education\ninstitution, except for medical or safety reasons.",
        "nl": "Het afleiden van emoties van een persoon op de werkplek of in een\nonderwijsinstelling, behalve om medische of veiligheidsredenen."
      },
      "metadata": {
        "version": "2.0"
      },
      "sources": [
        {
          "kind": "legal",
          "label": {
            "en": "Article 5(1)(f) AI Act",
            "nl": "Artikel 5, lid 1, onder f, AI-verordening"
          },
          "url": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
        }
      ],
      "images": [
        {
          "file": "emotion-recognition.png",
          "description": {
            "en": "Placeholder picture for emotion recognition",
            "nl": "Plaatsvervangende afbeelding voor emotieherkenning"
          },
          "credit": "Placeholder drawn for this repository, CC0 1.0"
        }
      ]
    },
    {
      "id": "prohibited",
      "title": {
        "en": "This is a prohibited practice",
        "nl": "Dit is een verboden praktijk"
      },
      "description": {
        "en": "The AI Act prohibits placing on the market, putting into service or using a system\nfor this practice. The walk ends here.",
        "nl": "De AI-verordening verbiedt het in de handel brengen, in gebruik stellen of\ngebruiken van een systeem voor deze praktijk. De doorloop eindigt hier."
      },
      "metadata": {
        "version": "2.0"
      },
      "images": [
        {
          "file": "prohibited.png",
          "description": {
            "en": "Placeholder picture for a prohibited practice",
            "nl": "Plaatsvervangende afbeelding voor een verboden praktijk"
          },
          "credit": "Placeholder drawn for this repository, CC0 1.0"
        }
      ],
      "terminal": {
        "outcome": "prohibited"
      }
    },
    {
      "id": "covered",
      "title": {
        "en": "The AI Act applies to your system",
        "nl": "De AI-verordening is van toepassing op uw systeem"
      },
      "description": {
        "en": "Your system is within scope and is not a prohibited practice. The real Tree\ncontinues with the high-risk categorisation; this example stops here.",
        "nl": "Uw systeem valt binnen het toepassingsgebied en is geen verboden praktijk."
      },
      "metadata": {
        "version": "2.0"
      },
      "images": [
        {
          "file": "covered.png",
          "description": {
            "en": "Placeholder picture for a system the AI Act applies to",
            "nl": "Plaatsvervangende afbeelding voor een systeem waarop de AI-verordening van toepassing is"
          },
          "credit": "Placeholder drawn for this repository, CC0 1.0"
        }
      ],
      "terminal": {
        "outcome": "applicable"
      }
    }
  ]
}
```

The image files are ordinary PNG files placed in `trees/ai-act-example/images/` by hand;
the five added by issue #84 are labelled placeholders; the logo and font files are placed in
`trees/ai-act-example/theme/` the same way, with the licence texts next to them.

Note what the explanation Nodes do not say: the sentence "This is an explanation
only. Go back to the previous step to answer" of the `elsa-tree/1` example is chrome,
said by the frontend on every explanation Node, and no longer spends Bubble space.

## 9. A single-language Tree

Nothing structural changes. The manifest declares one language and every localised
text has one key:

```json
{
  "$schema": "/schemas/elsa-tree-4.json",
  "format": "elsa-tree/4",
  "languages": [
    "nl"
  ],
  "root": "start",
  "title": {
    "nl": "Is de AI-verordening van toepassing?"
  },
  "metadata": {
    "version": "1.0"
  },
  "nodes": [
    {
      "id": "start",
      "title": {
        "nl": "Valt uw AI-systeem binnen het bereik van de AI-verordening?"
      },
      "description": {
        "nl": "..."
      },
      "metadata": {
        "version": "1.0"
      }
    }
  ]
}
```

Writing `"title": "Valt uw AI-systeem ..."` as a bare string instead of an object is
**not** allowed even for one language (rule V-L10N): a localised text is always an
object, so that a second language can be added without changing the shape. The
frontend shows the Tree in its only language and offers no language switch -- and, because
there is only one, its pages carry no `hreflang` alternates and its sitemap no
`xhtml:link` (`docs/specs/application.md` 16.2, 16.3).

A Tree in German, or in English, Dutch and German, is written the same way with
`"languages": ["de"]` or `["en", "nl", "de"]`. A Tree without a `theme` key, like this
one, is shown in the frontend's plain default look.

## 10. Reserved for the future

- **Cross-links.** A Node reference of the shape `tree-id:node-id` (two ids joined by a
  colon) will address a Node in another Tree, and a bare reference to a non-child Node
  may become allowed for in-Tree cross-links. Ids therefore cannot contain a colon
  today, and today's grammar rejects references with a colon (V-CROSS). Files written
  against `elsa-tree/4` will remain valid when Cross-links arrive.
- **Format number.** `format: elsa-tree/4` is the only accepted value, and
  `schemas/elsa-tree-4.json` the only schema a Tree may name. Any change to the keys, the
  kinds, the outcome set, the Theme roles, the limits or the validity rules is published
  as `elsa-tree/5`, with its own document and its own `schemas/elsa-tree-5.json` beside
  this one; a loader states which format numbers it accepts, and the older schema files
  stay where they are so that a Tree written today keeps something to point at.
- **Where an edited Tree is stored.** The round after this one edits Trees through the
  frontend. Whether the edited `tree.json` is written back into the repository through
  git, or into a store of some other kind, is the owner's to define (core document open
  item 10.30). Nothing in this format depends on the answer: the file is the same file
  wherever it is kept.

## 11. Where each decision is recorded

Decisions of `elsa-tree/4` (issue #118):

| Decision | ADR |
|---|---|
| JSON replaces YAML: one `tree.json` object, `nodes` an array in the author's order with each element's own `id`, rich text a string with `\n`, an absent optional field omitted, a required `$schema`, no comments, and a canonical byte form | `docs/adrs/ADR-118-json-serialisation.md` (supersedes `ADR-37-serialisation.md` and the YAML half of `ADR-4-serialisation-format.md`) |
| The JSON Schema at `schemas/elsa-tree-4.json`, served at `/schemas/elsa-tree-4.json`: the structure and the grammars, deliberately not the limits of 5.7, and no `$id` | `docs/adrs/ADR-118-json-schema.md` |
| The dataset endpoint serves the file byte-identical under CC BY 4.0; "never the whole Tree" is restated as a rule about pages | `docs/adrs/ADR-118-dataset-endpoint.md` |
| The order of the four build issues that follow the freeze | `docs/adrs/ADR-118-build-order.md` |

The findability contracts decided on the same issue -- `robots.txt`, the sitemap and the
`hreflang` alternates, the JSON-LD, `llms.txt` -- are the application's, not the format's:
`docs/adrs/ADR-118-crawler-access.md`, `ADR-118-sitemap-and-alternates.md`,
`ADR-118-json-ld.md`, `ADR-118-llms-txt.md`, and `docs/specs/application.md` sections 15
and 16.

Decisions of `elsa-tree/3` (issue #78):

| Decision | ADR |
|---|---|
| Explainers: an `explainers` list of `id`, `term` and `text`, at most 8 of 40 and 200 characters; each occurrence marked in the description with the link syntax `[text](#id)`; strict rules V-EXPLAINER and V-MARK; the title stays plain | `docs/adrs/ADR-78-explainers.md` |
| An Option has no Images of its own: the picture on its button is its target's main image, and the migration moves an `elsa-tree/2` Option's first picture to its target | `docs/adrs/ADR-78-fan-out-and-option-picture.md` |
| The first Image is the main image; the length limits confirmed unchanged against the layout of #75 | `docs/adrs/ADR-78-main-image-and-row-budget.md` (amends `ADR-37-length-limits.md`) |
| Nothing under the pictures: the description is accessible text, the credit is shown in the enlarged view and read as the picture's description | `docs/adrs/ADR-78-carousel.md` (amends `ADR-37-images-carousel.md`) |

Decisions of `elsa-tree/2` (issue #37):

| Decision | ADR |
|---|---|
| One file per Tree; `images/` and `theme/` beside it; the Tree is read once and held in memory | `docs/adrs/ADR-37-single-file-layout.md` (supersedes `ADR-4-file-layout.md`) |
| YAML 1.2 as the serialisation of one large multilingual file; the stream, the `--- # id` convention, free document order | `docs/adrs/ADR-37-serialisation.md` -- **superseded by `ADR-118-json-serialisation.md`**; the free order of Nodes carries over as the order of the `nodes` array |
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
| A Markdown subset for rich text | `docs/adrs/ADR-4-serialisation-format.md` (its YAML half is superseded by `ADR-118-json-serialisation.md`) |

## 12. Migrations

Three conversions are recorded here. **12.6 is the one that runs now**: `elsa-tree/3` to
`elsa-tree/4`, the JSON conversion of issue #119. 12.1 to 12.4 (`elsa-tree/1` to `/2`) and
12.5 (`/2` to `/3`) are kept as the record of how the Trees on `dev` got here; a Tree
still written in `elsa-tree/1` or `/2` is converted with **the last release that read
YAML** -- the commit tagged before #119 merges -- and then by 12.6. No Tree in this
repository is in that state.

**12.1 to 12.4: from `elsa-tree/1` to `elsa-tree/2`.**
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

### 12.5 From `elsa-tree/2` to `elsa-tree/3`

A Tree folder written against `elsa-tree/2` is converted to `elsa-tree/3` by a procedure
that is textual wherever it can be and touches only what changed, so that every comment
and every quoting choice an author made survives. `docs/adrs/ADR-78-fan-out-and-option-picture.md`
and `ADR-78-explainers.md` have the reasoning; issue #79 scripts it.

1. **The format line.** In `tree.yaml` find the first line matching
   `^format:\s*elsa-tree/2\s*(#.*)?$` and replace it by `format: elsa-tree/3`, keeping any
   comment. If no such line exists, leave the text unchanged and report
   `manifest: no "format: elsa-tree/2" line found` (the result will fail V-FORMAT, as the
   input would have).
2. **Option pictures.** For every Option that has an `images` key: take its **first**
   Image; if the target Node's `images` list is absent or its first entry names a
   different `file`, insert that Image, unchanged in every key, as the **first** entry of
   the target's `images` (creating the key after the target's `metadata` when it is
   absent); a `source` on the moved Image is dropped, with a report, unless the target has
   a Source of that id. Then remove the Option's `images` key and its block. Report every
   second and third Image an Option had, by file name: they are shown nowhere in
   `elsa-tree/3`, and the author decides whether the target's Carousel should carry them
   (an image file nothing references is not an error). The block is moved as text, with
   its indentation adjusted from the Option's level to the Node's, so a comment inside it
   survives.
3. **Nothing else changes.** No `explainers` key is added: a Tree without explainers is a
   valid `elsa-tree/3` Tree, and `[text](#id)` did not occur in any Tree or fixture on
   `dev` on 2026-09-17, so no existing description acquires a mark by accident. A
   description that does contain `](#` fails V-MARK afterwards, and is reported.
4. **Validate** the result with the rules of section 7 and **report every violation** as
   the loader would. Shorten nothing, drop nothing else, silence nothing. Exit
   successfully when the result validates, and unsuccessfully otherwise.

What the procedure guarantees: a valid `elsa-tree/2` Tree whose Options carry no Images
converts by its format line alone; one whose Options carry Images converts to a Tree in
which every side child's button shows the picture its Option showed, the same file and
the same credit, and every Node reference, Source, Theme and `metadata` bag is what it
was, so every URL and every shared link keeps working. For the Trees on `dev`: issue #84
gives every Node of both Trees a main image first, copying each of the first Tree's 28
Option pictures to its target as that target's first Image, so step 2 finds them there
and moves nothing; the example Tree's `scoreboard.png` is written on `social-scoring` in
section 8 for the same reason.

### 12.6 From `elsa-tree/3` to `elsa-tree/4`

This conversion is **not textual**, and it is the first of the three that is not: the
shapes differ, so the file is parsed and re-serialised. It is a **one-time job**, done
while a YAML parser is still in the repository; the parser and the `yaml` dependency leave
with it (issue #119), and after this round nothing here reads YAML.
`docs/adrs/ADR-118-json-serialisation.md` has the reasoning.

#### 12.6.1 The procedure

Input: the folder `<in>/` holding `tree.yaml`. Output: `<in>/tree.json`.

1. **Parse** `<in>/tree.yaml` as a YAML 1.2 stream, with the same parser the
   `elsa-tree/3` loader used. If any document fails to parse, **report and stop**: nothing
   is written. An invalid Tree is not converted, because a re-serialisation cannot carry a
   syntax error across the way a textual concatenation could.
2. **The first document becomes the top-level object**, the rest become the elements of
   `nodes`, **in stream order**, so the author's order -- the root first, then the walk --
   survives as the array's order.
3. **`format` becomes `elsa-tree/4`**, and **`$schema` is written first**, with the value
   `/schemas/elsa-tree-4.json`.
4. **Every scalar is carried over unchanged**, with one rule for text: a block scalar's
   **single trailing line break is removed**; every other character, line break included,
   is kept exactly. Nothing is re-wrapped, nothing is trimmed inside, nothing is
   re-punctuated. 3.8 step 1 already stripped that trailing break before measuring, so no
   text changes its counted length.
5. **Keys are written in the order of 3.7**; `metadata` keeps `version` first and the
   author's remaining keys in the order they were written; a localised text lists its
   languages in the manifest's order. **A `metadata` key made only of digits stops the
   job**, like a parse failure in step 1: it is reported by name, with the object it
   sits on and the remedy (`2024` becomes `note-2024`), and nothing is written. It is
   the one thing an `elsa-tree/3` Tree can carry that this conversion cannot (V-META,
   3.7), and a procedure that renamed the key itself would be a procedure that edits
   content.
6. **An absent key stays absent.** Nothing becomes `null`, `[]` or `{}` (V-NULL,
   V-EMPTY).
7. **Write** `<in>/tree.json` in the canonical byte form of 3.7. Do not touch `images/`,
   `theme/`, or any other file in the folder.
8. **Validate** the result against `schemas/elsa-tree-4.json` and then against the rules
   of section 7, and **report every violation** as the loader would. Shorten nothing, drop
   nothing, silence nothing.
9. **Delete `<in>/tree.yaml` only after** the written file has been read back and
   validated. Never before.

**Idempotence.** Running the writer on a Tree it has already written changes no byte.
Running the whole procedure on a folder that holds a `tree.json` and no `tree.yaml` does
nothing and reports nothing. Issue #119 tests both, because the byte form of 3.7 is only
worth stating if it is stable.

#### 12.6.2 What the procedure guarantees, and what it does not

**Guaranteed.** Every Node of the input is an element of `nodes` in the same order, with
the same `id`. Every piece of text in every language is the same sequence of characters,
minus the one trailing line break of step 4. Every id, Node reference, Source, URL, image
and theme file name, colour, font descriptor and `metadata` value is what it was. So
**every URL and every shared link keeps working**, `images/` and `theme/` need no change,
and no Tree is re-cut.

**The one exception**, and the only rule of this round that can make a valid
`elsa-tree/3` Tree invalid: `elsa-tree/3` said nothing about `metadata` key names, and
`elsa-tree/4` refuses a key made only of digits (V-META, 3.7). A `/3` Tree carrying one
is reported by step 5 and is not converted until its author prefixes the key. Every
other Tree that validated as `elsa-tree/3` validates as `elsa-tree/4`. No Tree or
fixture on `dev` carries such a key (12.6.3).

**Not guaranteed, and lost on purpose.** Comments, the `--- # <id>` table of contents,
the author's quoting choices and the author's line wrapping inside a block scalar. JSON
has none of these and none is invented (3.7). This is the price of the owner's decision
that no person works inside the file again; it is written here so that nobody looks for
them afterwards. What must stay beside the data goes in `metadata`.

**One text the conversion does change**, and only in the example Tree: its manifest
`description` names the format version ("every element of the `elsa-tree/3` format"), so
that self-reference becomes `elsa-tree/4`. It is the one sentence in either Tree that is
about the format rather than about the AI Act. Section 8 shows the result, and issue #119
makes exactly that change so that `trees/ai-act-example/tree.json` stays byte-identical to
section 8's block.

#### 12.6.3 What it does for the Trees and fixtures on `dev`

- `trees/ai-act-example` (7 Nodes, 7 Images, a Theme): converts to the file in section 8.
- `trees/ai-act-applicability-agrifood` (the first Tree): converts and validates as it
  stands; its content, its limits and its images are untouched.
- `tests/fixtures/single-language`, `other-languages`, `german-only`: convert and validate
  with no violation.
- `tests/fixtures/full-node`, `carousel`, `overlay`, `explainers`: convert and validate;
  each still exercises exactly the maximum it was built for, because no limit moved.
- `tests/fixtures/cycle`: converts and validates. It is not about a maximum -- it holds a
  cycle among question Nodes, one Node whose `yes` and `no` name the same target, and a
  Node with no Images, all three of which are valid (section 7) -- and the conversion
  touches none of it. Its four header comments go the way every comment goes (12.6.2),
  so #119 moves what they say into the tests that open it:
  `tests/neighbourhood.test.ts`, `tests/views.test.tsx` and
  `tests/browser/carousel.spec.ts`.
- `tests/fixtures/invalid/<rule>`: each converts and fails **the same rule**, because
  step 4 carries every value across -- a misspelt target is still misspelt, a missing
  Dutch string is still missing. Two need re-fitting by hand, and #119 does it: `v-yaml`
  becomes `v-json` (a file that does not parse as JSON), and `v-format`'s manifest must
  say something that is not `elsa-tree/4`. New fixtures are needed for V-SCHEMA, V-NULL
  and V-EMPTY, which are rules `elsa-tree/3` had no equivalent of, and one for the
  all-digit `metadata` key of V-META, which is the new rule an existing `/3` Tree could
  actually trip. **No Tree and no fixture on `dev` carries such a key** -- checked, key by
  key, over every `metadata` block in `trees/` and `tests/fixtures/`, which is why the
  exception in 12.6.2 costs this round nothing and is stated for the author who writes the
  next Tree.
- `tests/fixtures/broken/<case>`: a case whose point is a YAML syntax error becomes the
  JSON equivalent -- a truncated file, a trailing comma, a duplicate key -- and fails
  V-JSON. There is one behavioural change to record: `elsa-tree/3` reported a parse error
  per document and still checked the others (V-YAML), and `elsa-tree/4` cannot, because
  one JSON file is one document. A syntax error anywhere is now a syntax error everywhere.
  That is a real loss of an author-facing property, and it is acceptable only because no
  author edits the file by hand any more -- which is the premise of this whole version.
