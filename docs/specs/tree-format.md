# Tree file format -- `elsa-tree/1`

> Status: FROZEN -- 2026-09-03 (issue #4). This document is the interoperability
> contract: any Tree that follows it loads in the ELSA decision-tree frontend without a
> code change. Changing it requires a new `architecture` issue and a new format number.
>
> Vocabulary: the canonical names from `docs/CORE_DOCUMENT.md` section 5 -- **Tree**,
> **Node**, **Link**, **Answer**, **Option**, **Terminal**, **Image**, **Source**,
> **Trail**, **Cross-link** -- are used here with exactly that meaning. The decisions
> behind this document are recorded one per file in `docs/adrs/ADR-4-*.md`.

This document is written so that a third party -- another ELSA lab, or the owner of this
project -- can author a complete Tree from it alone, in a text editor, with no other
reference. Section 8 contains a complete, loadable example Tree in English and Dutch;
section 9 shows what changes for a Tree with a single language.

## 1. Overview

A Tree is a **folder**. It contains one small manifest, one file per Node, and one
folder of image files:

```
trees/
  <tree-id>/
    tree.yaml               the manifest: identity, languages, root Node, metadata
    nodes/
      <node-id>.yaml        one file per Node; the file name is the Node's id
      ...
    images/
      <file>                the Tree's Images, placed here by hand
      ...
```

- Files are **YAML 1.2**. Multi-paragraph text is written as YAML block scalars and may
  use a small subset of Markdown (section 3.4).
- Every piece of user-facing text is a **localised text**: a mapping from language tag
  to string, holding every language the Tree declares (section 3.3).
- A Node is one of three kinds, decided by its own content: a **question Node** (has
  Answers), a **Terminal** (has the terminal marker), or an **explanation Node** (has
  neither; it is reached through an Option).
- The layout lets a server read exactly one Node file to render that Node, and only
  that Node's images are referenced from it (section 6).

All folders under `trees/` are read by the loader; nothing else in the repository is
part of a Tree. Which Tree a deployment serves is outside this contract (core document
OPEN 10.19; a later architecture issue).

## 2. Files and names

| Path | Meaning | Rule |
|---|---|---|
| `trees/<tree-id>/` | One Tree. | `<tree-id>` is an **id** (section 3.1). The folder name *is* the Tree's id; there is no `id` field. |
| `trees/<tree-id>/tree.yaml` | The manifest (section 4). | Required, exactly this name. |
| `trees/<tree-id>/nodes/<node-id>.yaml` | One Node (section 5). | `<node-id>` is an **id**. The file name *is* the Node's id; there is no `id` field. The `nodes/` folder is flat: sub-folders are not read. |
| `trees/<tree-id>/images/<file>` | One image file. | `<file>` follows the image file name rule (section 3.5). Flat: sub-folders are not read. |

Anything else inside a Tree folder (a `README.md`, a `drafts/` folder, editor files) is
ignored by the loader. That is the place for work in progress that must not yet be
validated.

## 3. Conventions used throughout

### 3.1 Ids

An id is lowercase ASCII letters and digits, with single hyphens between groups:

```
^[a-z0-9]+(-[a-z0-9]+)*$        at most 64 characters
```

Examples: `start`, `prohibited-practices`, `annex-iii-area-5`. Not allowed: capitals,
spaces, underscores, dots, a leading or trailing hyphen, two hyphens in a row, and the
colon `:` (reserved for Cross-links, section 10). Ids are used verbatim in URLs and in
the Trail carried by a shared link, which is why the alphabet is this small.

### 3.2 Node references

Wherever a Link names its target, it does so with a **Node reference**: the id of a
Node in the same Tree, written bare, e.g. `target: social-scoring`. In `elsa-tree/1` a
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
- The frontend never has to fall back for Tree content. (Fallback for UI chrome is a
  separate matter, core document OPEN 10.20.)

Strings that are **not** localised: image file names, URLs, credits (an attribution is
reproduced as written), ids, and everything under `metadata`.

### 3.4 Plain text and rich text

- **Plain text** fields (`title`, an Option's `title`, a Source's `label`, an Image's
  `description`) are a single line. Markdown is not interpreted in them.
- **Rich text** fields (a Node's `description`) are written as a YAML literal block
  scalar (`description:` then `en: |`) and may use this subset of
  [CommonMark](https://commonmark.org/): paragraphs separated by a blank line,
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

### 3.5 Image file names

```
^[a-z0-9]+([._-][a-z0-9]+)*\.(png|jpg|jpeg|gif|webp|svg)$        at most 128 characters
```

Lowercase only, no spaces, no path separators, no `..`. Lowercase is required because
the files are edited on Windows and served from Linux, where `Map.PNG` and `map.png`
are different files. A Node refers to an image by this bare file name; the loader
resolves it inside the Tree's own `images/` folder and nowhere else.

### 3.6 YAML rules that matter

- Files are parsed as **YAML 1.2**. In YAML 1.2 the words `yes` and `no` are ordinary
  strings, which is what the `answers` block relies on. Some older tools (YAML 1.1,
  e.g. Python's PyYAML by default) turn them into booleans; a loader must use a 1.2
  parser, and an author who uses another tool to generate files must make sure `yes`
  and `no` stay strings.
- **Quote version numbers**: `version: "1.0"`. Unquoted, `1.0` is a number and is
  rejected (rule V-META).
- Unknown keys are errors (rule V-KEYS). This is deliberate: a misspelt `anwsers:`
  must fail loudly, not silently become an explanation Node. The only place for
  free-form keys is `metadata`.
- File encoding is UTF-8 without a byte-order mark. Line endings do not matter.
- Comments (`# ...`) are welcome anywhere and are ignored by the loader.

## 4. The manifest: `tree.yaml`

```yaml
format: elsa-tree/1
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
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `format` | yes | string, exactly `elsa-tree/1` | The version of this contract the Tree is written against. A loader that does not know the value rejects the Tree. |
| `languages` | yes | list of language tags, non-empty, distinct | The languages every localised text in the Tree provides. First entry is the default language. |
| `root` | yes | Node reference | The Node the walk starts at. Must be a question Node or a Terminal, never an explanation Node. |
| `title` | yes | localised text, plain | The Tree's name, shown by the frontend. |
| `description` | no | localised text, rich | What the Tree is about. |
| `metadata` | yes | mapping | `version` (non-empty string) is required. Any other keys are the author's own; the loader keeps them and does not interpret them. |

## 5. A Node: `nodes/<node-id>.yaml`

A Node file is a mapping with these keys:

| Key | Required | Type | Meaning |
|---|---|---|---|
| `title` | yes | localised text, plain | The Node's heading. |
| `description` | yes | localised text, rich | The explanatory text; may be many paragraphs. |
| `metadata` | yes | mapping | `version` (non-empty string) required; the rest free-form, kept but not interpreted. |
| `sources` | no | list of Source (5.1) | References this Node cites. Absent means none. |
| `images` | no | list of Image (5.2) | Pictures shown as thumbnails on this Node. Absent means none. |
| `answers` | see 5.6 | Answers (5.3) | The yes/no Links. Present exactly on question Nodes. |
| `options` | no | list of Option (5.4) | The clickable list of entries, each leading to an explanation Node. Allowed on question Nodes and explanation Nodes; never on a Terminal. |
| `terminal` | see 5.6 | Terminal marker (5.5) | Present exactly on Terminals. |

There is no `id` and no `kind` key: the id is the file name, the kind follows from
which of `answers` / `terminal` is present (5.6).

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
| `label` | yes | localised text, plain | The visible text of the link. |
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
| `description` | yes | localised text, plain | What the picture shows; also used as the accessible alternative text. |
| `credit` | yes | non-empty string | Attribution and licence, reproduced as written. Required for every Image without exception. |
| `source` | no | id of a Source on the same Node | Where the picture or its content comes from. For an Image on an Option this refers to the `sources` of the Node the Option is written in. |

### 5.3 Answers

```yaml
answers:
  yes: prohibited-practices
  no: outside-scope
```

Exactly the two keys `yes` and `no`, each a Node reference. The target of an Answer
must be a question Node or a Terminal -- never an explanation Node, because arriving
at an explanation Node by an Answer would leave the user with no way forward. The
labels "yes" and "no" are UI chrome, translated by the frontend, not by the Tree.

### 5.4 Option

```yaml
options:
  - title:
      en: Social scoring
      nl: Sociale scoring
    target: social-scoring
    images:                         # optional, same shape as 5.2
      - file: scoring.png
        description: { en: A scoreboard, nl: Een scorebord }
        credit: "Illustration: Example Studio, CC0"
```

| Key | Required | Type | Meaning |
|---|---|---|---|
| `title` | yes | localised text, plain | The entry's text in the list. |
| `target` | yes | Node reference | The explanation Node that expands on this entry. Must be an explanation Node (5.6). |
| `images` | no | list of Image | Pictures for this entry (e.g. what kind of product a piece of legislation covers). |

Options in one list have distinct targets. Several Nodes may point at the same
explanation Node. The order of the list is the order shown.

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

A file with both `answers` and `terminal` is an error. An explanation Node reached
through an Option is "explanation only" (core document 3.1, traversal rule): the user
reads it, may open its own Options, and goes back through the Trail to answer the
parent's question. A Trail is therefore just a list of Node ids, which the frontend can
carry in a shareable link.

## 6. Loading one Node without reading the Tree

The layout makes a Node self-contained:

- To render Node `x`, a server reads `trees/<tree-id>/nodes/x.yaml` -- one small file.
  It contains everything the screen needs: text in every language, Sources, the file
  names of its own Images, and the *ids* (only the ids) of its Link targets.
- The children's files are not opened until the user follows a Link to one of them.
- Image files are referenced by name only, so the frontend requests an image file only
  when it renders the Node (or Option) that lists it. Nothing in the format lets a Node
  refer to another Node's images.
- The manifest is the only file needed on first visit besides the root Node.

**Validation is the one moment the whole Tree is read**, once, at build time or at
server start (whichever the implementation chooses), to enforce the rules in section 7
and to build an index of Node ids. That is a server-side, one-off cost and does not
contradict the rule that the *app* never loads the whole Tree or all images for a
visitor. Serving reads one Node file per request.

A loader therefore needs a narrow interface -- in words, not code, since writing it is a
later issue: *validate a Tree folder and report every violation*, *give me the
manifest*, *give me Node `x`*. Everything about file names, YAML, and the rules below
sits behind that interface; the frontend never touches a file path.

## 7. Validity rules

A loader **rejects the whole Tree** if any rule fails, and reports every failure it
found (not just the first) with: the Tree id, the file path, the key path inside the
file (e.g. `options[2].target`), the rule id below, and a plain-language message. A
Tree is never partially loaded.

### Tree level

| Rule | A valid Tree has... |
|---|---|
| V-DIR | a folder name that is an id (3.1), containing `tree.yaml` and a `nodes/` folder with at least one Node file. |
| V-YAML | files that parse as YAML 1.2 into a mapping at the top level. |
| V-FORMAT | `format` equal to `elsa-tree/1`. |
| V-LANG | `languages`: a non-empty list of distinct, valid language tags (3.3). |
| V-ROOT | `root` naming an existing Node that is a question Node or a Terminal. |
| V-TITLE | `title` as a plain localised text. |
| V-META | `metadata` as a mapping whose `version` is a non-empty string (in the manifest and in every Node). |
| V-KEYS | no keys other than those listed in sections 4 and 5, at every level except inside `metadata`. |
| V-REACH | every Node file under `nodes/` reachable from `root` by following Answers and Options. An unreachable Node is almost always a misspelt target; keep drafts outside `nodes/`. |

### Text

| Rule | A valid Tree has... |
|---|---|
| V-L10N | every localised text providing a non-empty string for every declared language and no keys for other languages. |
| V-PLAIN | plain text fields on a single line (no line breaks). |
| V-HTML | no raw HTML in rich text: the sequence `<` followed by a letter, `/` or `!` is rejected. |

### Node level

| Rule | A valid Tree has... |
|---|---|
| V-NODE | every file in `nodes/` named `<id>.yaml` with a valid id, and `title`, `description`, `metadata` present. |
| V-KIND | at most one of `answers` and `terminal` on a Node. |
| V-ANSWERS | `answers` with exactly the keys `yes` and `no`, each a Node reference to an existing question Node or Terminal. |
| V-OPTIONS | `options`, when present, a non-empty list; each with `title` and `target`; targets existing explanation Nodes; targets distinct within the list. |
| V-ORPHAN | every explanation Node targeted by at least one Option (this is also implied by V-REACH, but gets its own message). |
| V-TERMINAL | `terminal` as a mapping whose `outcome` is one of `not-applicable`, `applicable`, `prohibited`, `refer`; a Terminal has no `options`. |
| V-SOURCE | every Source with a `kind` in `legal` / `case-law` / `literature`, a plain localised `label`, an absolute http(s) `url`; Source ids valid and distinct within the Node. |
| V-IMAGE | every Image with a `file` matching 3.5 that exists in the Tree's `images/`, a plain localised `description`, a non-empty `credit`, and, if present, a `source` naming a Source id on the same Node. |
| V-CROSS | no Node reference containing `:` (Cross-links are not part of `elsa-tree/1`). |

Not errors: an image file in `images/` that no Node references; a Node reached by more
than one Link; a cycle among question Nodes (the Tree is graph-shaped by design; the
Trail is how the user finds their way back).

## 8. Complete example Tree (English and Dutch)

The Tree below is complete and valid. It is **illustrative content**: the legal
statements are simplified sketches used to show every element of the format, not
verified readings of the AI Act. The real first Tree is authored separately.

Folder layout:

```
trees/
  ai-act-example/
    tree.yaml
    nodes/
      start.yaml
      outside-scope.yaml
      prohibited-practices.yaml
      social-scoring.yaml
      emotion-recognition-at-work.yaml
      prohibited.yaml
      covered.yaml
    images/
      eu-map.png
      scoreboard.png
```

Shape: `start` is the root question Node with an Image and a legal Source. Its `no`
Answer ends at the Terminal `outside-scope`; its `yes` Answer leads to
`prohibited-practices`, a question Node with two Options, each opening an explanation
Node (`social-scoring`, with a case-law and a literature Source and an Image on the
Option; `emotion-recognition-at-work`). Answering `yes` there reaches the Terminal
`prohibited`, `no` reaches the Terminal `covered`.

### `trees/ai-act-example/tree.yaml`

```yaml
format: elsa-tree/1
languages: [en, nl]
root: start
title:
  en: Does the EU AI Act apply to my AI system? (example)
  nl: Is de EU AI-verordening van toepassing op mijn AI-systeem? (voorbeeld)
description:
  en: |
    A small example Tree that exercises every element of the `elsa-tree/1` format.
    Its legal content is simplified and not to be relied on.
  nl: |
    Een kleine voorbeeldboom die elk onderdeel van het `elsa-tree/1`-formaat gebruikt.
    De juridische inhoud is vereenvoudigd en niet bedoeld om op te vertrouwen.
metadata:
  version: "1.0"
  author: ELSA-Lab for sustainable food systems, Wageningen University
  licence: to be decided (core document OPEN 10.14)
```

### `trees/ai-act-example/nodes/start.yaml`

```yaml
title:
  en: Is your AI system within the reach of the AI Act?
  nl: Valt uw AI-systeem binnen het bereik van de AI-verordening?
description:
  en: |
    The AI Act reaches AI systems that are **placed on the market or put into service
    in the EU**, and systems whose *output is used in the EU*, wherever the provider
    or deployer is established.

    Answer **yes** if any of these applies to your system:

    - you place it on the EU market or put it into service in the EU;
    - you use it in the EU;
    - it is used outside the EU but its output is used in the EU.
  nl: |
    De AI-verordening bestrijkt AI-systemen die **in de EU in de handel worden gebracht
    of in gebruik worden gesteld**, en systemen waarvan de *output in de EU wordt
    gebruikt*, ongeacht waar de aanbieder of gebruiksverantwoordelijke is gevestigd.

    Antwoord **ja** als een van deze situaties op uw systeem van toepassing is:

    - u brengt het in de EU in de handel of stelt het in de EU in gebruik;
    - u gebruikt het in de EU;
    - het wordt buiten de EU gebruikt, maar de output wordt in de EU gebruikt.
metadata:
  version: "1.0"
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
```

### `trees/ai-act-example/nodes/outside-scope.yaml`

```yaml
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
  version: "1.0"
terminal:
  outcome: not-applicable
```

### `trees/ai-act-example/nodes/prohibited-practices.yaml`

```yaml
title:
  en: Does your system do any of the prohibited practices?
  nl: Verricht uw systeem een van de verboden praktijken?
description:
  en: |
    Article 5 lists practices that are **prohibited** outright. Open each entry below
    to read what it covers, then come back here and answer.

    Answer **yes** if your system does any of them, **no** if it does none.
  nl: |
    Artikel 5 noemt praktijken die zonder meer **verboden** zijn. Open elk onderdeel
    hieronder om te lezen wat het inhoudt, en kom dan hier terug om te antwoorden.

    Antwoord **ja** als uw systeem een van deze praktijken verricht, **nee** als geen
    ervan van toepassing is.
metadata:
  version: "1.0"
  reviewed: 2026-09-03
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
```

### `trees/ai-act-example/nodes/social-scoring.yaml`

```yaml
title:
  en: Social scoring
  nl: Sociale scoring
description:
  en: |
    Evaluating or classifying people over time on the basis of their social behaviour
    or personal characteristics, where the resulting score leads to detrimental
    treatment that is unrelated to the context in which the data was collected, or
    that is disproportionate.

    This is an explanation only. Go back to the previous step to answer.
  nl: |
    Het beoordelen of indelen van mensen gedurende een periode op basis van hun
    sociale gedrag of persoonlijke kenmerken, waarbij de score leidt tot nadelige
    behandeling die losstaat van de context waarin de gegevens zijn verzameld, of die
    onevenredig is.

    Dit is alleen uitleg. Ga terug naar de vorige stap om te antwoorden.
metadata:
  version: "1.0"
sources:
  - kind: legal
    label:
      en: Article 5(1)(c) AI Act
      nl: Artikel 5, lid 1, onder c, AI-verordening
    url: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
  - kind: case-law
    label:
      en: CJEU, Case C-634/21 SCHUFA Holding (Scoring), 7 December 2023
      nl: HvJ EU, zaak C-634/21 SCHUFA Holding (Scoring), 7 december 2023
    url: https://curia.europa.eu/juris/liste.jsf?num=C-634/21
  - kind: literature
    label:
      en: Veale & Zuiderveen Borgesius, "Demystifying the Draft EU Artificial Intelligence Act" (2021)
      nl: Veale & Zuiderveen Borgesius, "Demystifying the Draft EU Artificial Intelligence Act" (2021)
    url: https://arxiv.org/abs/2107.03721
```

### `trees/ai-act-example/nodes/emotion-recognition-at-work.yaml`

```yaml
title:
  en: Emotion recognition at work or in education
  nl: Emotieherkenning op het werk of in het onderwijs
description:
  en: |
    Inferring the emotions of a person in the workplace or in an education
    institution, except for medical or safety reasons.

    This is an explanation only. Go back to the previous step to answer.
  nl: |
    Het afleiden van emoties van een persoon op de werkplek of in een
    onderwijsinstelling, behalve om medische of veiligheidsredenen.

    Dit is alleen uitleg. Ga terug naar de vorige stap om te antwoorden.
metadata:
  version: "1.0"
sources:
  - kind: legal
    label:
      en: Article 5(1)(f) AI Act
      nl: Artikel 5, lid 1, onder f, AI-verordening
    url: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
```

### `trees/ai-act-example/nodes/prohibited.yaml`

```yaml
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
  version: "1.0"
terminal:
  outcome: prohibited
```

### `trees/ai-act-example/nodes/covered.yaml`

```yaml
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
  version: "1.0"
terminal:
  outcome: applicable
```

The two image files `eu-map.png` and `scoreboard.png` are ordinary PNG files placed in
`trees/ai-act-example/images/` by hand.

## 9. A single-language Tree

Nothing structural changes. The manifest declares one language and every localised
text has one key:

```yaml
# tree.yaml
format: elsa-tree/1
languages: [nl]
root: start
title:
  nl: Is de AI-verordening van toepassing?
metadata:
  version: "1.0"
```

```yaml
# nodes/start.yaml (excerpt)
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
`languages: [de]` or `languages: [en, nl, de]`.

## 10. Reserved for the future

- **Cross-links.** A Node reference of the shape `tree-id:node-id` (two ids joined by a
  colon) will address a Node in another Tree, and a bare reference to a non-child Node
  may become allowed for in-Tree cross-links. Ids therefore cannot contain a colon
  today, and today's loader rejects references with a colon (V-CROSS). Files written
  against `elsa-tree/1` will remain valid when Cross-links arrive.
- **Format number.** `format: elsa-tree/1` is the only accepted value. Any change to
  the keys, the kinds, the outcome set or the validity rules is published as
  `elsa-tree/2` with its own document; a loader states which format numbers it accepts.

## 11. Where each decision is recorded

| Decision | ADR |
|---|---|
| Folder per Tree, file per Node, manifest | `docs/adrs/ADR-4-file-layout.md` |
| YAML 1.2 with a Markdown subset for rich text | `docs/adrs/ADR-4-serialisation-format.md` |
| Localised text as a per-language mapping, all declared languages required | `docs/adrs/ADR-4-localised-text.md` |
| Id grammar, file name as id, colon reserved for Cross-links | `docs/adrs/ADR-4-identifiers-and-cross-links.md` |
| Explicit terminal marker with a closed outcome set; Node kind derived | `docs/adrs/ADR-4-terminal-marker.md` |
| Images in the Tree's own `images/` folder, referenced by bare file name | `docs/adrs/ADR-4-image-reference.md` |
| Strict validation: reject the whole Tree, report every violation | `docs/adrs/ADR-4-validity-rules.md` |
