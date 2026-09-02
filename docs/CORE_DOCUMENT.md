# Core document

> Populated by deep interview with the project owner. Nothing here is inferred.
> Status: EMPTY -- run the onboarding interview.

Owner: Idse Val (`IdseVal`). Interview started 2026-09-02.
Items marked **OPEN** are unanswered; they are decisions waiting, not gaps to fill.
Items marked **PROPOSED** are the Planner's wording, waiting for the owner to confirm or correct.

## 1. Purpose and success criteria

**What it is.** A small web application -- essentially a single interactive component
(React or Next.js) -- that walks people who develop AI systems through a decision tree
about the ethical, legal and social aspects (ELSA) of their AI system. The name "ELSA"
carries no further meaning; it is not a product, a person, or an external system.

**First tree.** The first and only tree at launch is the applicability of the EU AI Act
to agrifood AI systems. The owner is the domain expert on this tree and authors its
content.

**Why.** The owner wants an interactive, click-based way to present a decision tree,
instead of a static document. (Nothing more specific was said about the cost of not
having it -- see OPEN 10.1.)

**Success criteria.** **OPEN 10.2** -- the owner has not yet said how they will judge
success or failure (audience reached, usage, feedback, accuracy, time-to-answer, ...).

**Stakeholders.** **OPEN 10.3** -- the owner referred to "we"; who else has a say is not
yet recorded.

## 2. Target users

- People developing AI systems, who use the tree to find out how ELSA aspects apply to
  their system. The first tree targets people developing AI for agrifood.
- **OPEN 10.4** -- expected expertise of these users (lawyers? engineers? founders with no
  legal background?), and whether the language of the UI and content is English, Dutch,
  or both.
- The owner themselves, as *author* of tree content: the tree data must be easy for a
  human -- the owner in particular -- to create and maintain by hand.
- Third parties who author *other* trees (e.g. an ethics tree) in the same shape, to be
  loaded by the same frontend.

## 3. Scope

### 3.1 The decision tree data

- One loadable dataset is a **Tree** (PROPOSED name, see section 5). It is a set of
  **Nodes** connected by links. The owner wants a graph-shaped structure, because in
  future (a) different trees may be linked to each other and (b) nodes may cross-link to
  other nodes.
- Every Node carries at minimum:
  - a **title**;
  - a **description**;
  - a **legal reference** to its legal source;
  - optional **metadata** (contents **OPEN 10.5**);
  - **images**: a list of images, each with its own **description** and an optional
    pointer to a **source** elsewhere in the data structure.
- A Node either gives a **definition** or gives a series of **conditions**. Each
  condition is clickable and may have its own images.
- Each Node presents a **yes** and a **no** choice; each choice leads to exactly one
  other Node, which is then shown.
- Children of a Node are pulled from the data structure only when that Node is opened
  (lazy). Images are loaded only for the Node currently rendered.
- The storage technology (graph database vs. file-based structure vs. other) is NOT yet
  decided. The owner wants to discuss options before deciding. Constraints the owner
  has stated and the decision must honour:
  1. graph-shaped (links between trees and between nodes must be possible later);
  2. easily editable by hand by the owner;
  3. lightweight -- the app must stay quick and snappy;
  4. the *shape* of a Tree is a public contract: any third-party tree with the same
     shape must load in this frontend unchanged.

### 3.2 The frontend

- Shows one Node at a time: its title, description, and a small **carousel** of the
  Node's images. Clicking an image raises it and shows it larger on screen. The owner
  said "the carousel itself is invisible" -- exact meaning **OPEN 10.6**.
- The Node offers **yes** / **no**; clicking one navigates to the linked Node.
- Navigation through the tree must be intuitive and click-based.
- The way back must be clearly visible: a **line to previous Nodes**, which leaves the
  screen at the top (the trail of visited Nodes is drawn upward and scrolls off the
  top).
- Interoperable: the same frontend loads any Tree in the agreed shape (e.g. a future
  ethics tree) with no code change.
- Technical qualities the owner requires: lightweight component, lazy loading,
  server-side rendering, nothing heavy on screen; prefer slightly more network traffic
  over a clunky app. Simple code: not many files, no long files -- it is a small app.

### 3.3 Content of the first Tree (AI Act applicability, agrifood)

The owner's outline, to be populated from the actual text of the AI Act (a research
task; the owner's recollections below are starting points, NOT verified facts):

1. **Jurisdictional scope.** Owner's recollection: applies to (1) people making AI in
   the EU, (2) people serving AI in the EU, (3) people making AI outside the EU and
   serving people outside the EU, where the AI's outputs are used in the EU. If no: the
   AI Act does not apply (terminal message).
2. **Material scope.** Gated by the AI Act's own definition of "AI system". If no: show a
   message that other regulations apply instead (examples the owner gave: product
   safety regulation, product liability directive, etc.).
3. **Risk categorisation, step 1 -- prohibited systems.** List the practices prohibited
   under the AI Act as conditions. If all are "no": continue to step 4.
4. **Risk categorisation, step 2 -- high-risk.** Two flavours:
   a. the AI system is a safety component in a product covered by Union harmonisation
      legislation -- list each piece of legislation, each with an image showing what
      kind of product it covers;
   b. the AI system falls in a high-risk area of application listed in the Act's
      annexes -- list each area, each with an image.
5. What follows after step 4 (e.g. limited-risk / transparency obligations, minimal
   risk, obligations per role) is **OPEN 10.7**.

The owner wants this content researched properly against the AI Act, and wants to be
able to keep working on the content themselves afterwards.

## 4. Explicit NON-scope

**OPEN 10.8** -- not yet discussed. Candidates the owner must confirm or reject: user
accounts; saving a user's progress; a graphical editor for tree content; multi-language
UI; analytics; a backend API beyond serving the tree; anything beyond presenting a tree.

## 5. Domain model and vocabulary

One name per concept. The owner used several words for the same things ("item", "step",
"object", "bubble", "data item"); the names below are PROPOSED and become canonical once
the owner confirms them.

| Term (PROPOSED) | Meaning | Words the owner used |
|---|---|---|
| **Tree** | One loadable dataset (e.g. "AI Act applicability, agrifood"; a future "ethics" tree). Graph-shaped internally, presented as a decision tree. | decision-tree, datastructure, graph |
| **Node** | One step in a Tree. Has title, description, legal reference, metadata, images; gives either a definition or a list of conditions; offers a yes and a no. | item, step, object, bubble, data item, reasoning step |
| **Condition** | One clickable statement inside a Node, with optional images of its own. Whether a Condition is itself a Node or a part of a Node is **OPEN 10.9**. | condition |
| **Answer** | The yes or no choice on a Node; each Answer links to exactly one target Node. | yes/no |
| **Terminal message** | A Node with no Answers that ends the walk (e.g. "the AI Act does not apply"). Whether this is a distinct kind of Node is **OPEN 10.10**. | message |
| **Image** | A picture attached to a Node or Condition; has a description and an optional pointer to a Source. | image, picture |
| **Source** | A legal or documentary reference (e.g. an article of the AI Act). Nodes carry one as their "legal reference"; Images may point to one. Whether Sources are first-class entries in the Tree or plain text is **OPEN 10.11**. | legal reference, legal source, source |
| **Trail** | The ordered list of Nodes the user has visited to reach the current Node; drawn as a line upward from the current Node. | the way back, line to previous items |
| **Cross-link** | A link from a Node to a Node in another Tree, or to a non-child Node in the same Tree. Future capability; not in the first iteration. | link different graphs, cross-link between graph items |

## 6. Data sources and their constraints

- **The AI Act** (Regulation (EU) 2024/1689) -- the legal source for the first Tree.
  Content must be derived from the actual text, with each Node citing its article /
  annex. Verification of the owner's recollections is a research task.
- **Tree content is authored by the owner** and must remain hand-editable.
- **Images**: **OPEN 10.12** -- where do they come from (owner-supplied, stock, generated),
  where are they stored, and who holds the rights.

## 7. External systems

- **OPEN 10.13** -- hosting / deployment target (Vercel, own server, ...), domain, and
  whether the tree data lives in the repository or in an external store (this depends on
  the storage decision in 3.1).
- No integrations with other systems were mentioned.

## 8. Legal, privacy and compliance limits

**OPEN 10.14** -- not yet discussed. Questions the owner must answer: is anything about
the user collected or stored (answers given, analytics, cookies)? Must the tool carry a
"this is not legal advice" disclaimer? Licence of the tree content and of the code?

## 9. What must never happen

**OPEN 10.15** -- not yet discussed. Candidates for the owner to confirm: the frontend
must never display legal content that the owner has not reviewed; the frontend must
never break when loaded with a third-party Tree that follows the agreed shape; the app
must never become heavy (large bundles, all images loaded up front).

## 10. Open questions

| # | Question | Owner |
|---|---|---|
| 10.1 | What is the concrete cost/problem today that this removes? | Idse |
| 10.2 | Success and failure criteria, with numbers where possible. | Idse |
| 10.3 | Who besides the owner has a say ("we")? | Idse |
| 10.4 | Expertise level of target users; UI/content language(s). | Idse |
| 10.5 | What goes in a Node's "metadata"? | Idse |
| 10.6 | What does "the carousel itself is invisible" mean exactly? | Idse |
| 10.7 | What comes after the high-risk step in the first Tree? | Idse |
| 10.8 | Explicit NON-scope. | Idse |
| 10.9 | Is a Condition its own Node (clicking navigates) or part of a Node (clicking expands in place)? | Idse |
| 10.10 | Are terminal messages a distinct kind of Node? | Idse |
| 10.11 | Are Sources first-class entries or plain text on each Node/Image? | Idse |
| 10.12 | Image provenance, storage and rights. | Idse |
| 10.13 | Hosting/deployment target; where tree data lives. | Idse |
| 10.14 | Privacy: is anything collected? Disclaimer? Licences? | Idse |
| 10.15 | What must never happen. | Idse |
| 10.16 | Storage technology for Trees (graph DB / files / other) -- to be discussed with the owner, then decided by the Architect within the constraints in 3.1. | Idse + Architect |
