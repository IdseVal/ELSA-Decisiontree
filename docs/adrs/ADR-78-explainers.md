# ADR-78-explainers: a Node declares its explainers in an `explainers` list, marks each occurrence in its description with the format's own link syntax pointing at the explainer's id, and the frontend shows the panel from markup that works by hover and focus before any script runs

- Status: ACCEPTED (frozen) -- 2026-09-17
- Issue: #78 -- Architecture: freeze the contracts for the display changes of #75
- Spec: `docs/specs/tree-format.md` (`elsa-tree/3`), sections 3.4, 5, 5.7, 5.9, 7, 8, 12.5; `docs/specs/application.md` 10.8, 6, 7, 14
- Core document: 3.1 ("Explainers"), 3.3 item 9, section 9 (an open panel never scrolls)
- Built by: #79 (format, loader, validator, migration), #83 (the panel), #85 (the first Tree's content)

## Context

The owner (#75): "I want certain items of texts on a displayed bubble to be hoverable,
which should lift a small panel with an overlay with a brief explainer of that term. This
is for small explainers. So for example: on 'Jurisdictional scope of the AI Act? (1/7)' I
want 'provider' to be hoverable with this mechanism with an explainer, this should be
clear from the datastructure that this term has a small explainer with a hover."

`elsa-tree/2` has no way to say it. Three things have to be decided together: how a Node
declares an explainer (a term and its text, per language); how an occurrence of the term
in the Node's text is marked, given that the description is rich text in a fixed Markdown
subset (`tree-format.md` 3.4) and the title is plain text; and what the frontend renders
so that the panel opens on hover, on keyboard focus and on tap, never scrolls, never
leaves the viewport, is heard by a screen reader, and still gives the reader the
explanation without JavaScript (`application.md` 14).

The first Tree writes its defined terms in bold today (`**provider**` on `start`), and the
same word occurs in several Nodes and in both languages with different inflections
("provider", "providers"; "aanbieder", "aanbieders").

## Decision

1. **The key is `explainers`, a list on a Node, at most 8 entries.** Each entry has an
   `id` (the id grammar of 3.1, unique within the Node), a `term` (localised plain text,
   at most 40 characters: the canonical word the panel is headed with) and a `text`
   (localised plain text, at most 200 characters: the explanation). Plain, not rich: no
   emphasis, no links, no lists in a panel that must stay small. The limits are derived
   in `tree-format.md` 5.9: at 14 pixels on 20-pixel lines a 200-character text is at
   most five lines in a 320-pixel panel, so the panel is at most 148 pixels tall and fits
   above or below any line of the 394-pixel text area.
2. **An occurrence is marked explicitly, with the link syntax the subset already has,
   pointing at the explainer's id**: `[providers](#provider)`. The mark's text is what the
   reader sees and may be any inflection or capitalisation of the term; the fragment
   names the explainer. Nothing new enters the Markdown subset, the counting rule of 3.8
   already counts a link's text and not its target, and an author who knows how to write
   a Source link knows how to mark a term.
3. **Only the description carries marks.** The title stays plain text (3.4): it is drawn
   on the Answer buttons of the parent, in the document title, in the up arrow's
   accessible name and in every place a title index feeds, and a mark in it would have to
   be stripped in each. A term that occurs in the title is marked where it occurs in the
   description.
4. **Validity is strict, like every other rule (`ADR-4-validity-rules.md`):** an
   explainer that is marked nowhere in some language is an error (V-EXPLAINER), because
   it is dead data the reader can never reach; a mark whose fragment names no explainer
   on the same Node is an error (V-MARK); a mark inside emphasis or strong text is not
   supported by the subset and is an error (V-MARK), so the frontend owns how a marked
   term looks. Explainers are per Node, written again on every Node that uses the term,
   by the same rule as Sources (core document 10.11): a Node is complete on its own.
5. **The migration from `elsa-tree/2` is the format line for a Tree without Option
   Images** (12.5; the Option `images` change of `ADR-78-fan-out-and-option-picture.md`
   is the only other step). `explainers` is optional, `[text](#id)` did not occur in any
   Tree or fixture on `dev` (checked 2026-09-17), and every valid `elsa-tree/2` Tree is
   therefore a valid `elsa-tree/3` Tree once its format line and its Option pictures are
   converted.
6. **The frontend renders a marked term as a focusable inline element with its panel as
   the next sibling**, described by it for assistive technology (`application.md` 10.8):
   the term is `<span class="term" tabindex="0" aria-describedby="<panel id>">` and the
   panel `<span class="explainer" role="tooltip" id="<panel id>">` holding the canonical
   term and the text. A screen reader announces the term and then its description, which
   is the explanation. The panel opens on hover and on focus **by CSS alone**, so a
   reader without JavaScript has the explanation by hover and by Tab; the script
   (`Explainer.tsx`, a client component) adds what CSS cannot: closing on Escape, opening
   and closing on tap, one panel open at a time, and placing the panel so that it never
   leaves the Bubble's text area (below the term's line when it fits there, above it
   otherwise, shifted sideways to stay inside the area). Without the script the panel
   sits at the foot of the text area, full width, where it can never overflow the
   Bubble; with it, next to the term.
7. **The panel never scrolls and never makes the page scroll**, which is core document
   section 9 restated: `no-scroll.spec.ts` measures every page with a panel open, with
   and without JavaScript (`application.md` 10.6).

## Alternatives rejected

- **Matching the term's words in the text automatically**, so that an author writes only
  the list and every occurrence lights up. Rejected: "provider" occurs inside "service
  provider" and "providers", the Dutch inflections differ, a term that is also an
  ordinary word would light up where it is not the defined term, and the same text would
  mark differently in two languages. The owner asked that the data make it "clear ...
  that this term has a small explainer": an explicit mark is exactly that, and it is
  checkable by the validator.
- **A new mark of its own, `{provider}` or `[[provider]]`.** Rejected: it is a second
  inline syntax to teach and to count, and it would need its own rule in 3.8; the link
  syntax already carries a visible text and a target and is already counted by its text.
- **Marking by the term alone, `[provider]`, with no id.** Rejected: the mark could not
  carry an inflection ("providers" is not the key "provider") and a term is localised,
  so the reference would differ per language.
- **Letting the title carry a mark.** Rejected, decision 3: the title is reused in six
  places as plain text.
- **A warning, not an error, for an explainer that is never marked.** Rejected: the
  project's validation is strict everywhere else, and a warning nobody reads is the same
  as no rule.
- **A shared glossary in the manifest, referenced by id from any Node.** Smaller files
  when a term recurs. Rejected for the same reason Sources are inline (core document
  10.11): a Node is complete on its own, the author reads one document, and a later
  edit to one Node's wording does not silently change another's.
- **A `<button>` with a `<dialog>` for the panel.** Correct focus semantics for free.
  Rejected: a dialog is modal and takes focus away from the text, which is the opposite
  of a tooltip a reader glances at; a button in running text is read as an action; and
  the panel would not open on hover without script. `role="tooltip"` with
  `aria-describedby` is the pattern for a description shown on hover and focus.
- **A panel that is a fragment link (`<a href="#…">`).** Rejected: a fragment jump can
  scroll an `overflow: hidden` container programmatically, which is the one thing the
  no-scroll rule forbids.

## Consequences

- `elsa-tree/3` is the format; `elsa-tree/2` stays readable on `dev`'s history. #79 makes
  the loader read `elsa-tree/3` only, as `ADR-37-migration.md` did for `elsa-tree/2`.
- `src/markdown.ts` renders a link whose target starts with `#` as a marked term rather
  than "shown as written"; it takes the Node's explainers as an argument so it can look
  the id up and emit the panel beside the term. The rendered description is what
  `views.test.tsx` asserts.
- The client components are four again: `Explainer.tsx` joins `Sheet`, `Slider` and
  `ShareButton` as `CarouselButtons.tsx` leaves (`ADR-78-carousel.md`).
- The first Tree's bold terms become marks (#85): `**provider**` becomes
  `[provider](#provider)`, and the bold goes, because the mark's own styling is the
  frontend's (decision 4).
- The example Tree of `tree-format.md` section 8 shows one explainer on `start`.
