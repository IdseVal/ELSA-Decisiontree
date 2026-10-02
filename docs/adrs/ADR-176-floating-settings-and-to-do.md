# ADR-176-floating-settings-and-to-do: the panel's button and a to-do bubble float under the editor's chrome bar at the top right; the button says "Decision-tree settings" with the Tree's state as a tag; the to-do list leaves the panel for the bubble, at which a refused publish points; the link to the account page says "Account"

- Status: ACCEPTED -- 2026-10-02
- Issue: #176 -- Editor top right: a floating 'Decision-tree settings' button and a floating
  to-do bubble outside the header bar, and an account link that says 'Account' (from the
  owner's walk of the editor, #169)
- Spec: `docs/specs/application.md` 24.3, 33.1, 33.2, 33.3 and 33.7, amended 2026-10-02; and,
  as consequences, 3.2 (the chrome keys), 10.6 and 26.3 (a fifth scroll box), 28.6 and 29.3
  (where the editor's controls stand)
- Supersedes in part: `ADR-133-top-panel.md` -- decision 1 (the button at the top right of the
  chrome bar whose label is the state and the to-do count, "Hidden (3)"), the panel's heading
  "Tree: Hidden (3)" in decision 2's sketch, the to-do list's place in decision 3 (the Publish
  section), and the first alternative's "the button's label carries the state to the bar";
  `ADR-133-admin-routes.md` -- in decision 7, "the caller's name as a link to `/admin/account`"
  on the Tree-less pages, and in the editor's bar "the button that opens the top panel" and
  "the caller's name". Everything else those decisions say stands.
- Depends on: `docs/adrs/ADR-133-top-panel.md` (the panel, its sections, Publish and its
  to-do list), `ADR-133-admin-routes.md` (the chrome bars), `ADR-133-overview-tiles.md`
  (decision 5, the scroll box), `ADR-78-answer-buttons-and-up-arrow.md` (the up arrow's band)

## Context

The owner walked the editor and listed what must change (#169, 2026-10-02). Two points are
about the controls at the top right:

> "The UI names of the top right buttons don't make sense at all: Why does it say hidden? Say
> what opens when that button is clicked, 'Decision-tree settings' and next to it it says
> adminstrator, make it say 'Account' or at least make it say what it is."

> "The to-do before publishing is ok to have somewhere, but not in the sidepane and not on top,
> make it a bubble on the top right (not in the header bar). I also want the 'Decision-tree
> settings' button to be a hover top right, but not in the header bar."

#133 made the button's label the Tree's state, so that a creator reads it without opening
anything (`ADR-133-top-panel.md`, decision 1). A creator read "Hidden (3)" as the name of a
button and could not tell what it opens; "Administrator", the administrator account's name,
read as a label too. The to-do list sat in the panel's Publish section, under the switch.

## Decision

1. **The panel's button floats under the bar.** It leaves the chrome bar for a fixed box under
   it, at the top right of the editor's page: 32 pixels tall, 10 under the bar, 16 from the
   right edge. At the guarantee of 1280 x 640 that is the band beside the up arrow, 56 tall,
   which no row of 10.1 gives to anything else, so the button covers no part of the Bubble,
   the arrow, an Option button or its menu; `tests/browser/floating-controls.spec.ts` measures
   the boxes there and at the other viewports of 10.6 where the tree view shows. Fixed, it
   moves no row and is no element's overflow (10.6). Where the band is 26 (below 640 pixels of
   height) the controls are 24 tall, one under the bar; on a phone's band of 40, 32 and four
   under it.
2. **It says what it opens, and the state is a tag.** A gear and `settings` -- "Decision-tree
   settings", "Beslisboominstellingen" -- then, set off by a hairline, the state as a tile marks
   it on the overview (26.4): a dot and a word, `hidden`, `published` or `notServable`. A
   published Tree whose public copy is behind keeps the word `published` with its dot in
   `accent`, as #142 drew it, and the indicator in the bar says `publicBehind` (29.3). The
   panel it opens is titled with the same words. The button's accessible name is the words, a
   colon and the state -- "Decision-tree settings: Hidden" -- the same at every width.
3. **The to-do list is a bubble of its own.** A second floating control stands left of the
   button: the count in a small round bubble filled with `accent` and the words "3 things to
   do" ("1 thing to do"), or at zero a quiet tick named "Nothing to do". It opens a Sheet under
   the two controls at the top right, at most 400 pixels wide and as tall as its list up to the
   disclaimer, holding the list of 33.3 as the panel held it: its heading (`todoBefore`, or
   `publicBehindBecause` / `notServableBecause` when they apply), one line per thing, the
   step's title a link to its editor page, `remove` beside an unreachable step. Its body is a
   scroll box (26.3): the list is unbounded, which is why the panel's body was one. The list
   is re-read when the bubble opens; the count follows every write response.
4. **A refused publish points at the bubble.** The Publish switch stays in the panel. On a 409
   the switch stays off and the Publish section says `publishRefused` with a button `showTodo`,
   "See what to do", which opens the bubble on the list that refusal answered -- the draft's
   own while it has lines, the response's otherwise, as #142 built it -- without re-reading
   it, since a re-read would lose the response's lines. The request travels through the
   `Editor`'s context (`openTodo`), the one place that holds both Sheets.
5. **Small windows: icons with their names.** Below 1000 pixels the words do not fit beside the
   arrow, and each control is a round button: the count's bubble, or the gear with the state's
   dot on its shoulder. With the word gone, a hidden Tree's dot is a ring, so the state does
   not rest on its colour alone. Each name is a `role="img"` label inside the control, so it is
   whole at every width without a second copy of the words.
6. **They are Sheets like every other.** Both are Sheets of the page's one exclusive group:
   Escape, the cross, a click outside, focus to the cross and back to the control, one open at
   a time, an Overlay included. In the tab order they come after the bar's last control, the
   to-do control first. Their box lies under any other Sheet's scrim while its own Sheets are
   closed, and lifts over the page while one is open, so that scrim covers the bar too.
7. **The link to the account page says "Account".** On every admin page with a session -- the
   creators' overview, `/admin/new`, `/admin/account`, `/admin/accounts`, the editor -- the
   link reads `account`, "Account" in both languages, and the caller's name is its `title`:
   the tooltip and the accessible description. `accounts` and `logout` stay. With the name out
   of the bar nothing there is cut with an ellipsis any more.

## Alternatives rejected

- **The state as the button's label, as before, with "Decision-tree settings" added.** The owner's
  complaint is exactly that a state reads as a button's name; one label that is both is the
  thing to undo.
- **The state as a status line beside the controls, outside the button.** A third element in a
  band that has room for two at a phone's width, and a word floating by itself reads as one more
  button. Inside the settings button, after its words and behind a hairline, it is a tag on the
  control that holds the Publish switch, which is what changes it.
- **Wording "the public copy is behind" in the tag.** It does not fit beside the arrow: at
  1024 x 768 in Dutch, with three things to do, the controls start 58 pixels right of the
  arrow's edge (594.5 against 536, measured), and "Gepubliceerd, de openbare versie loopt
  achter" is 231 pixels wide in the tag's type where "Verborgen" is 52. The indicator already
  says it in the bar whenever it is true, the dot says it in `accent`, and the to-do bubble's
  heading names why.
- **The to-do control under the settings button.** The band beside the arrow is 56 pixels tall
  at the guarantee and 26 below it; two rows of controls do not fit in it, and a second row
  would stand beside the Option buttons.
- **No to-do control at zero.** The issue allows it; a quiet tick keeps the control where the
  creator learned to find it, and its bubble confirms there is nothing left.
- **Opening the to-do bubble at once on a refused publish.** The panel would vanish under the
  creator's hand as they flipped a switch in it. A sentence and a button in the place they acted
  say why, and one click shows the list.
- **An `aria-label` on the Sheet's summary.** It would add a prop to `Sheet`, a component of the
  public pages (34.1); a label inside the control gives the same name and leaves the public
  component as it is.
- **The controls on the Bubble's rim or in the fan's top slot.** The rim belongs to the step (its
  counter, its tags, its step menu, 28.6) and the fan's slots to its Options; the settings and the
  to-do list are the Tree's.

## Consequences

- `src/editor/Todo.tsx` (new) draws the to-do control and the bubble; `src/editor/Panel.tsx`
  loses the list and gains the refusal's sentence; `src/editor/Editor.tsx` gains `openTodo`;
  the editor's page renders the two Sheets in `.editor-float` between the bar and `main`;
  `src/components/AdminChrome.tsx` and the editor's bar render the "Account" link.
- `src/chrome.ts` gains `settings`, `todoCountOne`, `todoNone`, `publishRefused`, `showTodo`;
  `treeState` goes; `account` says "Account" (en and nl).
- `tests/browser/floating-controls.spec.ts` and `tests/editor/todo.test.tsx` assert the
  decisions above; `admin-no-scroll.spec.ts` measures both Sheets at every viewport, the floor's
  included, and the bubble with a list longer than the window; `panel.spec.ts`,
  `languages.spec.ts`, `theme-panel.spec.ts`, `admin.spec.ts` and `login.spec.ts` read the state,
  the count, the list and the account link where they are now.
- The core document's sentence on "a button at the top right of the editor's bar showing the
  Tree's state" (3.4) is amended by pull request #182, not here.
