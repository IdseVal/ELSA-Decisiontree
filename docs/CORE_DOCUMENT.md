# Core document

> Populated by deep interview with the project owner. Nothing here is inferred.
> Status: EMPTY -- run the onboarding interview.

Owner: Idse Val (`IdseVal`). Interview 2026-09-02 -- 2026-09-03.
Items marked **OPEN** are unanswered; they are decisions waiting, not gaps to fill.
Items marked **PROPOSED** are the Planner's wording, waiting for the owner to confirm or correct.

## 1. Purpose and success criteria

**What it is.** A small web application -- essentially a single interactive component
(React or Next.js) -- that walks people who develop AI systems through a decision tree
about the ethical, legal and social aspects (ELSA) of their AI system. The name "ELSA"
refers to the Dutch ELSA-lab funding programme (see Stakeholders); it is not a product,
a person, or an external system.

**First tree.** The first and only tree at launch is the applicability of the EU AI Act
to agrifood AI systems. The owner is the domain expert on this tree and authors its
content.

**Why (confirmed by the owner).** An interactive, click-based presentation of a decision
tree, instead of a static document, so that a user can quickly and accurately work out
how the AI Act applies to their AI system.

**Success criterion (owner's words).** "If a user can quickly and accurately qualify
how the AI Act applies to their AI system, the tool has worked." No numeric target was
given and the owner did not ask for one.

**Stakeholders.** The project belongs to the **ELSA-Lab for sustainable food systems**
at **Wageningen University**, funded by **NWO** as part of the Dutch ELSA funding
strategy. The interoperability requirement (section 3.1) exists so that *other* ELSA
labs -- the owner named the ELSA lab on defence AI and the one on healthcare -- can load
their own tree into the same frontend. No other person or body whose sign-off is
required was named.

## 2. Target users

- **End users**: people developing AI systems -- mostly AI developers who are not
  lawyers, but also lawyers; a broad audience. The owner considers the audience's
  expertise a concern for whoever authors the tree content, not for the code.
- **Languages**: see 3.1 (multilingual data) and 3.2 (language switch).
- **The owner**, as *author* of tree content: the tree data must be easy for a human --
  the owner in particular -- to create and maintain by hand, in a text editor.
- **Other ELSA labs / third parties**, as authors of *other* trees in the same shape
  (e.g. an ethics tree, a defence-AI tree, a healthcare tree), loaded by the same
  frontend without code changes.

## 3. Scope

### 3.1 The decision tree data

- One loadable dataset is a **Tree**. It is a set of **Nodes** connected by **Links**
  (vocabulary in section 5). The structure is graph-shaped: in future (a) different
  trees may be linked to each other and (b) nodes may cross-link to other nodes.
- **Storage (agreed 2026-09-03):** Trees are stored as **plain files in the repository,
  not in a database**. Every Node has an id; a Link holds the id of its target Node; a
  future cross-link holds `tree-id:node-id`. The file format (one file per Tree vs. one
  file per Node; YAML / JSON / Markdown-with-frontmatter) and the exact schema are
  contracts for the Architect to freeze; the published schema *is* the
  interoperability contract. The owner confirmed nothing in their future plans (no
  concurrent multi-author editing, no live editing without redeploy) changes this.
- **Multilingual (agreed 2026-09-03):** every piece of user-facing text in a Node
  (title, description, Option titles, Image descriptions, ...) is held **per language**
  inside the Node. Which languages a Tree provides is up to its author: the first Tree
  provides English and Dutch; a Tree that provides only Dutch, or adds German, must load
  without breaking. Languages are therefore optional and open-ended, not a fixed pair.
- Every Node carries at minimum:
  - a **title**;
  - a **description** (explanatory text; may be several paragraphs);
  - **Sources** -- references of three kinds that are labelled differently in the data:
    **legal** (an article/annex of a regulation), **case law**, and **literature**. A
    Source carries a **URL** (e.g. EUR-Lex) which the frontend renders as a clickable
    link that opens in a new tab. Sources are written inline on the Node that uses them
    (PROPOSED; the owner described "a source parameter" on the node).
  - **metadata**: at least a **version**; otherwise a free-form bag.
  - **Images**: a list, each with its own **description**, a **credit** (attribution /
    licence -- required), and an optional pointer to a Source.
- A Node's outgoing Links are of two kinds:
  - **Answers**: a **yes** and a **no**, each leading to exactly one target Node.
  - **Options** (PROPOSED name; the owner said "conditions"): a list of clickable
    entries, each with its own title and optional Images, each leading to a **child
    Node** that explains that entry in more depth (e.g. the "prohibited practices" Node
    lists "social scoring"; clicking it moves the view to the "social scoring" Node,
    which carries explanation and literature). The high-risk lists work the same way:
    every Annex area is an Option in the top Node and has its own child Node.
- **Traversal rule (owner, 2026-09-03; may be refined once the owner has seen the
  tool):** a child Node reached through an Option is **explanation only** -- it has no
  Answers of its own. The user reads it, goes back through the Trail to the parent, and
  answers the parent's yes/no there (e.g. having found that none of the prohibited
  practices applies, they answer "no" on the "prohibited practices" Node and move on).
- **Terminal Nodes** (Planner's decision, delegated by the owner): a Node that ends the
  walk (e.g. "the AI Act does not apply") is **marked explicitly** as a terminal, with
  an outcome the frontend can style. "No outgoing Links" is NOT sufficient as a marker,
  because explanation-only child Nodes also have no outgoing Links and are not the end.
  The exact marker/outcome values are the Architect's to freeze.
- Children of a Node are fetched only when that Node is opened (lazy). Images are
  loaded only for the Node currently rendered.
- The Tree may grow large (the owner mentioned "a thousand images" as a plausible
  size); nothing may load the whole Tree or all images on first visit.
- Constraints on the format, stated by the owner: graph-shaped; hand-editable;
  lightweight; the shape is a public contract for third-party Trees.

### 3.2 The frontend

- Shows one Node at a time: title, description, Sources (as links), and the Node's
  Images as plain **thumbnails** -- no carousel chrome (no frame, arrows or dots).
  Clicking a thumbnail raises the image and shows it larger on screen.
- The Node offers its Answers (yes / no) and, if it has them, its Options as a
  clickable list; clicking any of these navigates to the linked Node.
- Navigation through the tree must be intuitive and click-based.
- The way back must be clearly visible: the **Trail** of visited Nodes is drawn as a
  line upward from the current Node and leaves the screen at the top. **Clicking a
  Trail entry jumps back to that Node and discards the part of the Trail after it.**
- **Shareable links (agreed 2026-09-03):** every Node is reachable by URL. A **share
  button** produces a link that carries both the destination Node and the Trail taken
  to reach it, so the recipient sees the same path. Since nothing is stored server-side
  (section 4), the path travels inside the link itself (PROPOSED consequence).
- **Language switch**: the UI lets the user choose among the languages the loaded Tree
  provides. UI chrome (yes/no labels, disclaimer, share button) -- which languages, and
  what to show when the Tree's language has no chrome translation -- **OPEN 10.20**.
- A permanently visible **"not legal advice" disclaimer** (footer).
- Interoperable: the same frontend loads any Tree in the agreed shape with no code
  change. Whether one deployment serves exactly one Tree or offers a choice of Trees
  is **OPEN 10.19**.
- Technical qualities the owner requires: lightweight component, lazy loading,
  server-side rendering, nothing heavy on screen; prefer slightly more network traffic
  over a clunky app. Simple code: not many files, no long files -- it is a small app.

### 3.3 Content of the first Tree (AI Act applicability, agrifood)

The owner's outline, to be populated from the actual text of the AI Act (a research
task; the owner's recollections below are starting points, NOT verified facts):

1. **Jurisdictional scope.** Owner's recollection: applies to (1) people making AI in
   the EU, (2) people serving AI in the EU, (3) people making AI outside the EU and
   serving people outside the EU, where the AI's outputs are used in the EU. If no: the
   AI Act does not apply (terminal).
2. **Material scope.** Gated by the AI Act's own definition of "AI system". If no: show a
   message that other regulations apply instead (examples the owner gave: product
   safety regulation, product liability directive, etc.).
3. **Risk categorisation, step 1 -- prohibited practices.** A Node listing the practices
   prohibited under the AI Act as Options, each with an explanation-only child Node
   (text, literature). If none applies: "no" continues to step 4.
4. **Risk categorisation, step 2 -- high-risk.** Two flavours:
   a. the AI system is a safety component in a product covered by Union harmonisation
      legislation -- each piece of legislation is an Option with an image showing what
      kind of product it covers, and a child Node;
   b. the AI system falls in a high-risk area of application listed in the Act's
      annexes -- each area is an Option with an image and a child Node.
5. **Later, not in the first iteration** (owner's outline): a step checking whether the
   system is **general-purpose AI**, then whether it is an AI system with **special
   transparency requirements** (owner cites Article 50 AI Act). What the tree says when
   a system is neither prohibited nor high-risk, and whether the walk ends at
   "high-risk" or continues into obligations, remains **OPEN 10.7** (deferred by the
   owner until they have seen the tool).

The owner will author and refine the data structure themselves and expects to refine
the traversal details once they have visual feedback from the working tool. For the
first version the frontend displays content prepared by the agents so the owner can
inspect what the app looks like; the owner alone is responsible for reviewing legal
content before it is published, and this is NOT enforced by code.

## 4. Explicit NON-scope

Confirmed by the owner on 2026-09-03:

- No user accounts.
- No saving of a user's progress across visits (a shared link is the only persistence,
  and it lives in the link).
- No graphical editor for tree content -- content is edited as files.
- No analytics, no tracking.
- No database.
- No editorial-review workflow in code (see 3.3, last paragraph).
- Cross-links between Trees: designed for, not built in the first iteration.
- The general-purpose-AI and Article 50 transparency steps: later iteration.

## 5. Domain model and vocabulary

One name per concept. The owner used several words for the same things; the names below
are canonical once confirmed. Items still marked PROPOSED await the owner's word.

| Term | Meaning | Words the owner used |
|---|---|---|
| **Tree** | One loadable dataset (e.g. "AI Act applicability, agrifood"; a future "ethics" tree). Graph-shaped internally, presented as a decision tree. Declares which languages it provides. | decision-tree, datastructure, graph |
| **Node** | One step in a Tree. Has title, description, Sources, metadata (incl. version), Images, and outgoing Links (Answers and/or Options), or a terminal marker. All user-facing text is per language. | item, step, object, bubble, data item, reasoning step |
| **Link** | Any clickable connection from one Node to another. Two kinds: Answer and Option. | -- |
| **Answer** | The yes or no Link on a Node; each leads to exactly one target Node. | yes/no |
| **Option** (PROPOSED) | A named entry in a Node's list, with its own title and optional Images, leading to an explanation-only child Node. | condition, area, listed item |
| **Terminal** | A Node explicitly marked as ending the walk, with an outcome (e.g. "AI Act does not apply"). | message |
| **Image** | A picture attached to a Node or an Option; has a description, a credit, and an optional pointer to a Source. Stored server-side in a dedicated images folder. | image, picture |
| **Source** | A reference attached to a Node or Image, with a URL. Kinds: **legal**, **case law**, **literature**, labelled distinctly in the data. | legal reference, caselaw reference, literature reference, source parameter |
| **Trail** | The ordered list of Nodes the user visited to reach the current Node; drawn as a line upward from the current Node; clickable to jump back. Carried in a shared link. | the way back, line to previous items, path |
| **Cross-link** | A Link from a Node to a Node in another Tree, or to a non-child Node in the same Tree. Future capability. | link different graphs, cross-link between graph items |

## 6. Data sources and their constraints

- **The AI Act** (Regulation (EU) 2024/1689) -- the legal source for the first Tree.
  Content must be derived from the actual text, with each Node citing its article /
  annex as a legal Source with its EUR-Lex URL. Verification of the owner's
  recollections is a research task.
- **Tree content is authored by the owner** as files and must remain hand-editable.
- **Images**: the owner downloads them and places them in a **dedicated images folder**
  in the repository. Each carries a credit. They are served from the server and loaded
  only for the Node on screen -- never all at once.

## 7. External systems

- **Hosting**: undecided -- either a Wageningen University server or a Hetzner box.
  Development is local for now. Confirmed consequence: **the app must run on a plain
  Linux server and must not depend on features of a specific hosting vendor.**
- **EUR-Lex** (and other Source URLs): linked to, opened in a new tab; never fetched or
  embedded by the app.
- No other integrations.

## 8. Legal, privacy and compliance limits

- **Nothing about the user is collected or stored**: no accounts, no cookies, no
  tracking, no analytics.
- The app **must display a permanently visible "not legal advice" disclaimer**.
- **Licence**: the project is an academic research project funded by NWO; the owner
  wants it **open source**. The specific licence for the code and for the tree content
  is not chosen -- **OPEN 10.14**; it must be chosen before the repository is made
  public.
- **Image rights**: every Image carries a credit/attribution.
- Content review before publication is the owner's responsibility, outside the code.

## 9. What must never happen

Confirmed by the owner on 2026-09-03:

- The frontend must never break when loaded with a third-party Tree that follows the
  agreed shape -- including a Tree that provides only one language, or languages other
  than English and Dutch.
- The app must never load all images -- or the whole Tree -- up front; only what the
  current Node needs.
- The app must never store or transmit anything about the user (section 8).
- (Struck by the owner: "never show unreviewed legal content" -- that is an editorial
  duty of the owner, not a property of the code.)

## 10. Open questions

| # | Question | Owner | Status |
|---|---|---|---|
| 10.1 | Problem statement. | -- | confirmed |
| 10.2 | Success criterion. | -- | answered (section 1) |
| 10.3 | Stakeholders. | -- | answered (section 1) |
| 10.4 | Languages. | -- | answered: per-language text inside each Node; languages optional and open-ended |
| 10.5 | Metadata. | -- | answered: version + free-form; Sources carry URLs |
| 10.6 | Carousel. | -- | answered: thumbnails only, no chrome |
| 10.7 | What the tree says after the high-risk step (neither/nor; obligations). | Idse | open, deferred by owner until the tool can be seen |
| 10.8 | NON-scope. | -- | answered (section 4) |
| 10.9 | Traversal after an Option's child Node. | -- | answered: explanation only; back via Trail; may be refined later |
| 10.10 | Terminal marker. | -- | decided by Planner: explicit marker with outcome |
| 10.11 | Sources inline vs shared. | -- | inline (PROPOSED, from owner's "source parameter") |
| 10.12 | Image credits. | -- | answered: required |
| 10.13 | Hosting. | -- | answered: undecided between university server and Hetzner; plain Linux, no vendor lock-in |
| 10.14 | Which open-source licence for code, and which for content? | Idse | open -- must be chosen before publishing the repo |
| 10.15 | What must never happen. | -- | answered (section 9) |
| 10.16 | Storage technology. | -- | answered: files in the repo, no database |
| 10.17 | Trail click. | -- | answered: jump back, discard later Trail |
| 10.18 | Disclaimer. | -- | answered: permanent footer |
| 10.19 | One Tree per deployment, or a choice of Trees in the UI? | Idse | open |
| 10.20 | UI chrome languages, and fallback when the Tree's language has no chrome translation. | Idse | open |
