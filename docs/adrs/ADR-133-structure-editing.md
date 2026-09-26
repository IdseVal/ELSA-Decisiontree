# ADR-133-structure-editing: a Node without Links offers three buttons in the Answer row; a fresh yes or no creates its target and navigates to it without a slide; the side-bubble + creates an Option and opens its aside for editing in the Overlay; an Answer or an Option may be re-pointed at an existing Node; a Node is deleted from its own page and an orphan stays until someone deletes it

- Status: ACCEPTED (frozen) -- 2026-09-26; confirms the PROPOSED reading of core document 3.4
- Issue: #133 -- Architecture: freeze the editor contracts
- Spec: `docs/specs/application.md` section 30 (new)
- Amends: `docs/adrs/ADR-78-overlay.md` (the Overlay is also where an aside is edited),
  `ADR-38-transitions.md` (the editor does not slide), `ADR-78-answer-buttons-and-up-arrow.md`
  (the Answer row holds the structure buttons where the Answers are not yet made)
- Depends on: `docs/adrs/ADR-132-editor-api.md` (`POST .../nodes`, the operations, the
  cascade on delete), `ADR-132-draft-and-publish.md` (a fresh Node is an explanation Node
  until it gets Answers or an end), `ADR-133-reuse-rule.md`, `ADR-133-autosave.md`

## Context

The owner: "there is a side-bubble with a + where one of those side-bubbles can be created,
then in editing mode 'yes', 'no' and 'tree ends here' buttons can be created and when they
are clicked the editor moves to a sequential new bubble, which can then be created with the
same editor etc." The core document's PROPOSED reading (3.4): "tree ends here" is the
Terminal of 3.1 with its outcome; "yes" and "no" are the Answers; the side-bubble is an
Option; nothing new enters the format. #132 gave the store the writes: `POST
/admin/api/trees/<t>/nodes` creates a Node **and** the Link to it in one write, `link:
'end'` makes the parent a Terminal, `set-answer`, `add-option`, `remove-answer`,
`remove-option`, `set-terminal`, `remove-terminal`, and `DELETE .../nodes/<n>` removes the
Node and every Link to it (22.1, 22.2, 22.4). The data is a graph: two Answers may reach one
Node today, several Nodes may point at one explanation Node (5.4), and V-REACH and V-ORPHAN
are advisory in a draft (19.2).

On the public page an Answer slides the tree to a pre-rendered neighbour frame (11.3); an
Option opens its target in the Overlay (10.9), the aside being pre-rendered on the page.

## Decision

1. **The PROPOSED reading of 3.4 is confirmed.** "Yes" and "no" are the two Answers of a
   question Node; "tree ends here" makes the Node a Terminal with one of the four outcomes
   of 5.5; the side-bubble is an Option and its target an explanation Node. The format
   stays `elsa-tree/4`, and the editor never writes a key the format lacks.

2. **A Node without Links shows three buttons in the Answer row**, in the Answer buttons'
   style (10.3) but **outlined** in `accent-secondary` rather than filled, so that a
   button that creates is told from a button that leads: `+ Yes`, `treeEndsHere`, `+ No`,
   left to right, each 400 x 60 with 20-pixel gaps (1240 of the row's 1260), the words
   alone below 480 pixels of width as 10.3 has it. The Answer row is 68 pixels on every
   Node and is never given up (10.5); nothing is added to the row budget of 10.1. A Node
   with **one** Answer is a question Node already (it has `answers`, 19.2) and cannot end
   without losing it (V-KIND), so it shows the real button for the Answer it has (`Yes:
   <title>`, filled, 620 x 60) and the `+` button for the other, 620 x 60; a Node with
   both shows the public row; a Terminal shows the outcome select on the rim and
   `startAgain` in the row (the way back is the up arrow, as on the public page). A Node
   is "without Links" by its draft kind: no `answers` and no `terminal`
   (19.2), whatever Options it has -- the editor does not scan the draft for Options that
   point at it, because a Node that an Option targets and that then gets Answers is
   exactly what V-OPTIONS reports (advisory: "the target is not an explanation Node"), on
   the Option's parent and in the to-do list, and the format's rule is the one place that
   judgement lives.

3. **A fresh `+ Yes` or `+ No` creates the target and navigates to it.** The button sends
   `POST .../nodes { from: { node, link } }`; the 201 carries the new Node and, in `also`,
   the parent with its new Answer; the editor then goes to `followHref` of the new Node --
   a **plain navigation**, not the slide of section 11. In edit mode `TreeView` renders no
   neighbour frames and marks no control `data-slide` (`ADR-133-reuse-rule.md`, decision
   5), so `Slider` has nothing to move and every Answer button and the up arrow are the
   ordinary links they are without JavaScript (14). The new Node arrives empty: no title,
   no description, the three buttons of decision 2, the up arrow leading back to the
   parent, whose `Yes:` button now reads the empty title's placeholder until one is typed.
   The new Node's id is the server's (`n-<6 characters>`, 22.4); the editor never proposes
   one, because a Node's id is not on screen anywhere the end user reads.

4. **`treeEndsHere` asks for the outcome, then makes the Node a Terminal.** The button opens
   a Sheet with the four outcomes as radio choices, each labelled with its chrome badge
   text (`outcomeNotApplicable` ...), and `confirm`; that sends `POST .../nodes { from: {
   node, link: 'end', outcome } }` (22.1) and the page repaints from the response: the badge
   on the rim, `startAgain` in the row, the fan's Options gone from the draw (a Terminal
   may carry none, 5.6: the store's `set-terminal` on a Node with Options is a V-TERMINAL
   blocking refusal, 422, which the Sheet shows and the creator removes the Options first).
   On a Terminal the badge is a **select** of the four (the field `terminal.outcome`); the
   top panel's "This step" section holds `removeEnd` (`remove-terminal`), after which the
   Node is without Links again and decision 2 applies.

5. **The side-bubble `+` is one more control in the fan.** On a question Node and on an
   explanation Node shown as the centre, the fan of Option buttons (10.3) gets, in the
   **next free slot of the alternating order** (the first Option right, the second left
   ...), a button of the Option button's size (232 x 96) outlined dashed in `rule`, a `+`
   where the picture is and `newSideBubble` where the title is; absent at eight Options
   (V-COUNT). It opens a Sheet with two choices: `createNew`, one field for the title in
   the page's language, which sends `POST .../nodes { from: { node, link: 'option' },
   title }` -- the store writes the Node with that title and the Option with the same
   title in one write; or `linkExisting`, the picker of decision 7, which sends
   `add-option { target }`. After a creation the editor navigates to **the aside's
   address** under this page -- `<the page's path>/<new id>` -- which by 10.9 renders this
   same page with the new Overlay open: the creator is looking at the side-bubble they
   just made, editable.

6. **An aside is edited in the Overlay, in place.** The Overlay of 10.9 holds the target's
   Interior rendered by the same component as the Bubble's, so with the `edit` seam its
   title, description, Sources and main image are `Field`s and slots exactly as the
   centre's are, with the rim's counter and tags inside the panel (the Overlay's panel is
   760 x 608 with 60-pixel sides, 10.9, which is the rim). The Option's **own title** -- a
   different field from the Node's, `options[i].title.<lang>` -- is edited on the **Option
   button** beside the Bubble, in place. The Overlay's list of second-level Options stays
   the plain links of 10.9 and gains a last entry, `+ newSideBubble`, which creates a
   second-level Option the same way and navigates to the deeper address (10.9's rule
   renders the deeper Overlay). The Overlay's heading link to the explanation Node's own
   address is where a creator goes to give an aside Options of its own with the fan, or to
   delete it (decision 8). Nothing is edited in two places: the centre's fields are on the
   Bubble, the aside's in its Overlay, the Option's title on its button.

7. **An Answer or an Option may be pointed at an existing Node.** Every Answer button and
   every Option button carries, in edit mode, a small `...` control at its outer end
   (`linkMenu`) that opens a Sheet: `changeTarget`, which opens the **picker**, and
   `removeLink` (`remove-answer` for an Answer, `remove-option` for an Option). The picker
   lists **every Node of the draft by its title in the page's language, in file order**,
   with its id in `text-muted` beside it, the current Node excluded, from the draft's
   `nodeIds()` and `getTitle` (5.1: ids and titles, never a Node read) -- so the page's
   payload stays what it is -- and above the list, for an Answer, `createNew` (decision 3).
   Choosing sends `set-answer { yes|no, target }` or `add-option { target }` after
   `remove-option` of the old; a target of the wrong kind is **stored and reported** by the
   store's advisory rule (V-ANSWERS: not a question Node or Terminal; V-OPTIONS: not an
   explanation Node), shown at the button and in the to-do list, because the picker cannot
   know a Node's kind from its title and the editor does not read every Node to find out.
   The graph the format allows -- two Answers to one Node, one aside under several Nodes --
   is what this makes: nothing is copied.

8. **A Node is deleted from its own page**, in the top panel's "This step" section
   (`deleteStep`, then a confirmation in place naming the step's title, `confirmDelete`),
   sending `DELETE .../nodes/<n>` (22.1); the store removes every Answer and Option that
   names it in the same write (22.4), and the response's `also` says which Nodes lost a
   Link. The editor then goes to the parent (`trailHref` of the entry above) or, with no
   Trail, to the root. The root Node has no `deleteStep` (409 anyway). **An Answer's or an
   Option's `removeLink` (decision 7) does not delete the target**: the target stays in
   the draft. What a deleted Node led to -- its own Answer targets and asides -- stays too,
   reported by V-REACH where nothing else reaches it (decision 9): a delete removes one
   step, never a sub-tree, because the same Nodes may be reached from elsewhere.

9. **A Node nothing reaches stays until someone deletes it.** After a `removeLink` or a
   `deleteStep`, a Node that no Answer and no Option names any more is reported by V-REACH
   (advisory, 19.2) and listed in the top panel's to-do with a link to its editor page,
   where `deleteStep` is; it is never deleted by the editor on its own, because a creator
   who unlinks a step to re-link it elsewhere has not asked to lose it. Publish refuses
   while one exists (V-REACH blocking at publish), which is the wall.

## Alternatives rejected

- **The slide on creation and on the Answer buttons in the editor.** It needs neighbour
  frames of draft Nodes, a `neighbourhood` over `DraftNode`, and the 17-Node payload of a
  draft on every editor page, for a motion the creator does not walk in; a plain
  navigation is what the same links do without script.
- **Editing an aside on its own page only (the Overlay read-only).** The owner's "side-bubble
  with a +" is edited where it appears; the Overlay renders the same Interior, so editing in
  it costs nothing but the seam, and the heading link keeps the page for what the Overlay
  lacks (the fan, deletion).
- **One "create step" button with a kind chooser (question / end / aside).** The owner named
  three buttons and where they go; a chooser is a fourth screen.
- **Offering `+ Yes` and `+ No` only on Nodes no Option targets.** It needs a referrer index
  of the draft on every editor page, or a scan of every Node, to hide two buttons; the
  format's own advisory rule reports the case, at the right place, when it happens.
- **A picker that lists only Nodes of the right kind.** The title index has no kinds, and
  reading every Node of the draft to sort them is the whole-Tree read the app is built
  not to make; the store reports a wrong kind on the next response, and the to-do carries
  it until fixed.
- **Deleting an orphan automatically when its last Link goes.** A creator re-linking a step
  from one Answer to another would lose it between the two clicks.
- **Deleting a Node from its parent's button menu.** One click on the wrong menu deletes a
  step with sub-trees; from its own page the creator is looking at what goes.
- **Proposing a Node id from its title**, as the Tree id is proposed. A Node's id is in no
  screen the end user reads, only in the address; the server's is fine and cannot collide.

## Consequences

- #139 builds `src/editor/Structure.tsx` (the three buttons, the outcome Sheet, the
  side-bubble `+`, the link menu, the picker) and the "This step" section of the panel's
  `Panel.tsx` with #142 (the panel's frame is #142's; `deleteStep` and `removeEnd` are
  #139's inside it: #139 lands the section with its two controls, #142 the panel around
  it, and the two share one file, which `ADR-133-build-order.md` names).
- `src/chrome.ts` gains `treeEndsHere`, `newSideBubble`, `createNew`, `linkExisting`,
  `changeTarget`, `removeLink`, `linkMenu`, `deleteStep`, `removeEnd`, `confirm`,
  `cancel` (#139).
- `tests/browser/structure.spec.ts` (#139) asserts: from an empty root, `+ Yes` lands on a
  new empty Node whose up arrow returns; `treeEndsHere` with an outcome shows the badge;
  the side `+` opens the new Overlay editable and the Option's title edits on the button;
  `changeTarget` to an existing Node makes two Answers reach one Node and the published
  walk (through #136's route) follows both; `removeLink` leaves an orphan in the to-do;
  `deleteStep` goes to the parent and the parent's button is gone; the ninth Option's `+`
  is absent; the count of Nodes created equals the count in the published `tree.json`.
