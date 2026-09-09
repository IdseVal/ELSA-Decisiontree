# Core document

> Populated by deep interview with the project owner. Nothing here is inferred.
> Status: AGREED -- 2026-09-09 (revised; first agreed 2026-09-03)
> The owner noted the document may change in future; changes go through a revision round and a PR.
>
> **Revision of 2026-09-09 (issue #35).** After seeing version 0.1 of the tool the owner
> wrote, in issue #35, what must change. Every passage that changed is marked **[v0.2]**
> and quotes or cites #35; nothing else in this document was touched. Version 0.1 as
> built -- code, both Trees, the specs it was built against -- is preserved on the branch
> `version-0.1`. The decision to rework in place and how the change reaches the specs is
> `docs/adrs/ADR-35-version-0-2-rework.md`; the work is issues #36 to #46.

Owner: Idse Val (`IdseVal`). Interview 2026-09-02 -- 2026-09-03; written revision 2026-09-09.
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
- **[v0.2] One file per Tree (owner, #35).** Version 0.1 froze one file per Node; the
  owner, having edited the first Tree, rejects it: "the datastructure must be loadable
  from a single file, this .yaml way not easy to work with or navigate for a human
  working with this." All text and structure of a Tree live in **one file**; image
  files and theme assets (logo, fonts) stay separate files in the Tree's folder. The
  serialisation of that one file is the Architect's to freeze (**OPEN 10.21**, issue
  #37). The owner's alternative -- "an interface that makes the nodes editable in view
  (a lot of work, but we might have to do that)" -- stays out of scope (section 4).
- **[v0.2] The look travels with the Tree (owner, #35).** A Tree carries its own
  **Theme**: logo, colours and fonts, "hosted in the datastructure and not in the
  frontend itself, so a different ELSA-lab can load in their own datastructures and
  their logo is displayed". The first Tree uses the styles and logo of the ELSA-Lab's
  website, https://ai4sfs.org (issue #36 measures them). Theme assets are files in the
  Tree's folder; nothing is fetched from a third party at run time (section 7).
- **[v0.2] Text has a maximum length (owner, #35).** Because nothing on the page may
  scroll (section 3.2), every user-facing text field has a maximum length fixed by the
  format and enforced by the validator: "we have to have max length on content". A
  step that needs more text becomes several steps (section 3.3).
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
    licence -- required), and an optional pointer to a Source. **[v0.2]** The owner
    expects them on every step and list entry ("where are the images? I told you there
    should be image carrousells below the node bubble"); the first Tree was authored
    without any, which issue #45 corrects. The format always had room for them.
- A Node's outgoing Links are of two kinds. **[v0.2]** On screen the Answer targets
  are the Node's **children** and the Option targets its **side children** (the owner's
  words in #35; this reading is PROPOSED, **OPEN 10.23**):
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
  loaded only for the Node currently rendered. **[v0.2]** Refined by the owner in #35
  for smooth transitions: the frontend may fetch and render the **neighbouring Nodes**
  -- "the next two nodes in each direction of the screen (still lazy loading)" --
  ahead of a click. Neighbours means a bounded set around the current Node, never the
  whole Tree; images are still loaded only for the Node on screen.
- The Tree may grow large (the owner mentioned "a thousand images" as a plausible
  size); nothing may load the whole Tree or all images on first visit.
- Constraints on the format, stated by the owner: graph-shaped; hand-editable;
  lightweight; the shape is a public contract for third-party Trees.

### 3.2 The frontend

- **[v0.2] The screen is a tree (owner, #35).** Version 0.1 showed a column of text;
  the owner: "the view of the frontend in no way resembles a tree". The open Node is
  displayed as a **Bubble** ("a bubble is round btw"), "with the branches above visible
  and clickable, and branches going out for the children and side children". So: the
  Trail is the branches above the Bubble; the Answer targets and the Option targets are
  branches out of it, each showing its target's title and leading to it.
- **[v0.2] Everything fits inside the Bubble; the page never scrolls (owner, #35).**
  "Everything that is on an opened node should fit on the screen, inside the bubble. We
  absolutely cannot have any scrolling on the page." This is a hard rule (section 9).
  It is met on the data side by length limits (3.1) and by cutting long steps into
  several (3.3), and on the frontend side by a layout designed for a stated viewport,
  which the Architect fixes (**OPEN 10.22**, issue #38).
- **[v0.2] Smooth transitions (owner, #35).** "I want the transitions to slide over the
  tree to the next node." Following a branch slides the tree so the target becomes the
  Bubble; the neighbouring Nodes are pre-rendered for that (3.1).
- **[v0.2] Images as a carousel (owner, #35).** The Node's Images are shown as an
  **image carousel below the Bubble**. This reverses 10.6 (thumbnails without chrome).
  Clicking an image still shows it larger, with its description and credit.
- The Node offers its Answers (yes / no) and, if it has them, its Options; clicking any
  of these navigates to the linked Node. **[v0.2]** They are the branches out of the
  Bubble.
- Navigation through the tree must be intuitive and click-based.
- The way back must be clearly visible: the **Trail** of visited Nodes is drawn upward
  from the current Node. **Clicking a Trail entry jumps back to that Node and discards
  the part of the Trail after it.** **[v0.2]** The Trail is the branches above the
  Bubble.
- **[v0.2] Branding from the Tree (owner, #35).** Logo, colours and fonts come from
  the loaded Tree's Theme (3.1), so a third-party Tree shows its own lab's identity
  without a code change; a Tree without a Theme gets a plain default look. The first
  Tree uses the styles and logo of https://ai4sfs.org.
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
- **[v0.2] Unchanged by the owner's instruction (#35, "out of scope"):** the
  mechanisms for different languages, and the way navigation works in line with the URL
  and the copy-link (share) option.

### 3.3 Content of the first Tree (AI Act applicability, agrifood)

The owner's outline, to be populated from the actual text of the AI Act (a research
task; the owner's recollections below are starting points, NOT verified facts):

1. **Jurisdictional scope.** Owner's recollection: applies to (1) people making AI in
   the EU, (2) people serving AI in the EU, (3) people making AI outside the EU and
   serving people outside the EU, where the AI's outputs are used in the EU. If no: the
   AI Act does not apply (terminal). **[v0.2]** The research of #3 found seven
   categories in Article 2(1), which version 0.1 put on one Node. The owner (#35):
   "the seven potential options for what is currently the first node in the tree can
   each be their own step that receives a yes and a no. So: Title: Jurisdictional scope
   of the AI Act? (1/7) Content: We first have to assess whether the AI Act applies to
   where you are located: Are you a provider who places an AI system or general purpose
   AI system on the market? A provider is someone that...." Issue #44 makes that cut.
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
5. **General-purpose AI.** A step checking whether the system is a general-purpose AI
   model/system (owner's outline; to be populated from the Act).
6. **Special transparency requirements.** A step checking whether the system is one
   with special transparency requirements (owner cites Article 50 AI Act).
7. The tree goes **no further than step 6 for now**. Steps 5--6 are placeholders the
   owner will make sound themselves; what the tree says when a system is neither
   prohibited nor high-risk, and whether obligations follow a "high-risk" outcome, is
   left to the owner's later authoring, not to this iteration.
8. **[v0.2] The cut (owner, #35).** Every step must fit its Bubble (3.2). Where a
   step does not, "we must make the decision-tree multistep where we now made it single
   step or we collapse duplicate sentences." The legal content stays as #3 verified it;
   only the cut changes. Item 1 is the owner's worked example.

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
- No graphical editor for tree content -- content is edited as files. **[v0.2]** The
  owner named an in-view editor as the fallback if a single file (3.1) does not prove
  hand-editable: "OR we have to build an interface that makes the nodes editable in
  view (a lot of work, but we might have to do that)". It stays out of scope until the
  owner says the single file has failed.
- No analytics, no tracking.
- No database.
- No editorial-review workflow in code (see 3.3, last paragraph).
- Cross-links between Trees: designed for, not built in the first iteration.
- Anything in the first Tree beyond the Article 50 transparency step (obligations per role, conformity assessment, ...): later, by the owner.

## 5. Domain model and vocabulary

One name per concept. The owner used several words for the same things; the names below
are canonical once confirmed. PROPOSED items were accepted by the owner's silence on agreement (2026-09-03).

| Term | Meaning | Words the owner used |
|---|---|---|
| **Tree** | One loadable dataset (e.g. "AI Act applicability, agrifood"; a future "ethics" tree). Graph-shaped internally, presented as a decision tree. Declares which languages it provides. **[v0.2]** Stored as one file plus its asset files; carries its Theme. | decision-tree, datastructure, graph |
| **Node** | One step in a Tree. Has title, description, Sources, metadata (incl. version), Images, and outgoing Links (Answers and/or Options), or a terminal marker. All user-facing text is per language. **[v0.2]** Every text field has a maximum length. | item, step, object, bubble, data item, reasoning step |
| **Link** | Any clickable connection from one Node to another. Two kinds: Answer and Option. | -- |
| **Answer** | The yes or no Link on a Node; each leads to exactly one target Node. **[v0.2]** Its target is a **child** of the Node on screen (PROPOSED, 10.23). | yes/no, children |
| **Option** (PROPOSED) | A named entry in a Node's list, with its own title and optional Images, leading to an explanation-only child Node. **[v0.2]** Its target is a **side child** of the Node on screen (PROPOSED, 10.23). | condition, area, listed item, side children |
| **Terminal** | A Node explicitly marked as ending the walk, with an outcome (e.g. "AI Act does not apply"). | message |
| **Image** | A picture attached to a Node or an Option; has a description, a credit, and an optional pointer to a Source. Stored server-side in a dedicated images folder. **[v0.2]** Shown in the Carousel. | image, picture |
| **Source** | A reference attached to a Node or Image, with a URL. Kinds: **legal**, **case law**, **literature**, labelled distinctly in the data. | legal reference, caselaw reference, literature reference, source parameter |
| **Trail** | The ordered list of Nodes the user visited to reach the current Node; clickable to jump back. Carried in a shared link. **[v0.2]** Drawn as the Branches above the Bubble (was: a line upward). | the way back, line to previous items, path, the branches above |
| **Cross-link** | A Link from a Node to a Node in another Tree, or to a non-child Node in the same Tree. Future capability. | link different graphs, cross-link between graph items |
| **[v0.2] Bubble** | The round view of the Node that is open: its title, description, Sources, outcome. Everything in it fits on screen without scrolling. | bubble, opened node |
| **[v0.2] Branch** | A Link as drawn on screen: a line from the Bubble to a Trail entry above it, or out to a child or side child, labelled with the target's title, clickable. | branches above, branches going out |
| **[v0.2] Carousel** | The strip of the open Node's Images below the Bubble, with controls to move between them. | image carrousell |
| **[v0.2] Theme** | The logo, colours and fonts a Tree carries so the frontend shows that Tree's lab's identity. Files in the Tree's folder; nothing external. | styles and logo, their logo is displayed |

## 6. Data sources and their constraints

- **The AI Act** (Regulation (EU) 2024/1689) -- the legal source for the first Tree.
  Content must be derived from the actual text, with each Node citing its article /
  annex as a legal Source with its EUR-Lex URL. Verification of the owner's
  recollections is a research task.
- **Tree content is authored by the owner** as files and must remain hand-editable.
- **Images**: the owner downloads them and places them in a **dedicated images folder**
  in the repository. Each carries a credit. They are served from the server and loaded
  only for the Node on screen -- never all at once. **[v0.2]** The owner has not placed
  any and asked in #35 where they are; issue #45 has the agents source openly licensed
  images with full credits, which the owner may replace (PROPOSED, **OPEN 10.24**).
- **[v0.2] Theme assets** for the first Tree: the logo and fonts of https://ai4sfs.org,
  the ELSA-Lab's own site, copied into the Tree's folder with their licences (the fonts
  are expected to be under the SIL Open Font License; issue #36 verifies). Reuse of the
  logo is the owner's instruction (#35); **OPEN 10.25** records what is still to confirm.

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
- **[v0.2] The page must never scroll** (owner, #35: "We absolutely cannot have any
  scrolling on the page"). Everything a Node shows fits inside its Bubble on the screen.
- **[v0.2] The frontend must never carry a lab's branding in its code**: logo, colours
  and fonts come from the loaded Tree, so a third-party Tree shows its own (#35).

## 10. Open questions

| # | Question | Owner | Status |
|---|---|---|---|
| 10.1 | Problem statement. | -- | confirmed |
| 10.2 | Success criterion. | -- | answered (section 1) |
| 10.3 | Stakeholders. | -- | answered (section 1) |
| 10.4 | Languages. | -- | answered: per-language text inside each Node; languages optional and open-ended |
| 10.5 | Metadata. | -- | answered: version + free-form; Sources carry URLs |
| 10.6 | Carousel. | -- | **[v0.2] reversed by the owner (#35, 2026-09-09):** an image carousel below the Bubble. Was: thumbnails only, no chrome (2026-09-03). Built by #43 |
| 10.7 | After the high-risk step. | -- | answered: general-purpose AI step, then Article 50 transparency step; nothing further for now (section 3.3) |
| 10.8 | NON-scope. | -- | answered (section 4) |
| 10.9 | Traversal after an Option's child Node. | -- | answered: explanation only; back via Trail; may be refined later |
| 10.10 | Terminal marker. | -- | decided by Planner: explicit marker with outcome |
| 10.11 | Sources inline vs shared. | -- | inline (PROPOSED, from owner's "source parameter") |
| 10.12 | Image credits. | -- | answered: required |
| 10.13 | Hosting. | -- | answered: undecided between university server and Hetzner; plain Linux, no vendor lock-in |
| 10.14 | Which open-source licence for code, and which for content? | Idse | open (confirmed undecided 2026-09-03) -- must be chosen before publishing the repo |
| 10.15 | What must never happen. | -- | answered (section 9) |
| 10.16 | Storage technology. | -- | answered: files in the repo, no database |
| 10.17 | Trail click. | -- | answered: jump back, discard later Trail |
| 10.18 | Disclaimer. | -- | answered: permanent footer |
| 10.19 | One Tree per deployment, or a choice of Trees in the UI? Owner did not answer; the Architect decides, default *one Tree per deployment, chosen by configuration* (does not preclude a landing page later). | Architect | decided by Architect (2026-09-03): one Tree per deployment, named by the environment variable `ELSA_TREE` (no default; the server refuses to start without it). The Tree id stays in every Node URL, so a landing page or a second Tree can be added later without breaking shared links. `docs/adrs/ADR-5-tree-selection.md`, `docs/specs/application.md` section 2 |
| 10.20 | UI chrome languages, and fallback when the Tree's language has no chrome translation. Architect decides; Planner's expectation: chrome in English and Dutch, fall back to English. | Architect | decided by Architect (2026-09-03): chrome ships in English and Dutch, as typed strings in the code (`src/chrome.ts`). Chrome follows the content language when it is English or Dutch and falls back to English otherwise; the content language is never affected. `docs/adrs/ADR-5-chrome-languages.md`, `docs/specs/application.md` section 3 |
| 10.21 | **[v0.2]** Serialisation of the single Tree file (3.1): YAML kept, or another form, with hand-editability of one large multilingual file as the criterion; the theme block; the length limits and how a step counter such as "(1/7)" is written; the migration from `elsa-tree/1`. | Architect | open -- issue #37 decides and records the answer here |
| 10.22 | **[v0.2]** The viewport the no-scroll layout guarantees (3.2), what happens on a smaller screen, and how "never scrolls" is tested. | Architect | open -- issue #38 decides and records the answer here |
| 10.23 | **[v0.2]** What "children" and "side children" mean (3.2, section 5). PROPOSED reading: children are the yes/no Answer targets, side children the Option targets. | Idse | PROPOSED -- the owner confirms or corrects in a comment on #38 before it freezes the view; silence means accepted |
| 10.24 | **[v0.2]** Who sources the first Tree's images (section 6). PROPOSED: the agents source openly licensed images with full credits (#45); the owner replaces any at will. | Idse | PROPOSED -- the owner may object on #45; silence means accepted |
| 10.25 | **[v0.2]** May the ai4sfs.org logo and fonts be copied into the repository, and under what licence line (section 6)? The owner asked for the logo; the fonts' licences are to be verified by #36. | Idse | open -- #36 reports the licences; the owner confirms the logo's use on #40 if anything beyond their own lab's ownership is needed |
