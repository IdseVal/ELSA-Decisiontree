# ADR-219-number-of-next-steps-round: the owner's "how many next steps" is one architecture freeze and two build issues after it, filed `proposed`

- Status: ACCEPTED -- 2026-10-09
- Issue: #219 -- Let the creator choose the options for down the tree (the owner's instruction)
- Issues filed: #220 to #222
- Specs affected: none amended here; #220 amends the sections it decides, #221 and #222 what
  they build
- Core document: amended here, marked `[#219]`: the preamble, its status line and the owner
  line; 3.1's Answers and its traversal rule; in 3.2 the opening bullet, the bullet on the
  Answer buttons, the sentence on what a Node offers and the language switch's chrome words;
  in 3.4 the `[#131]` item's reading of "yes" and "no" and the `[#133]` sentence on the
  editor's Answer row, a new bullet holding the owner's words whole, and the passage on what
  the round does not change; the rows **Answer** and **Branch** in 5; a new open item 10.43,
  OPEN for #220

## Context

The owner wrote in issue #219, on 2026-10-09:

> "Some trees might consist of yes or no, some trees might end there, but some trees might
> also have three or four options. Let's change the design to let the creator of a
> decision-tree choose themselves to how many next steps there are in the tree."

and under "Task": "Put issues on the board based on this instruction, start from
architecture, we might need some structural changes here. Thanks!" The task is the issues,
not the change, as it was in #194 and #202.

What stands on `dev` (`e190507`), where the instruction lands:

- **A step that leads on has exactly two next steps.** In the Tree format `elsa-tree/5`,
  `answers` holds "Exactly the two keys `yes` and `no`, each a Node reference"
  (`docs/specs/tree-format.md` 5.3), and the words "yes" and "no" are chrome the frontend
  translates (`docs/specs/application.md` 3.2). The format's section 10 says that the next
  change of its keys or rules "will be `elsa-tree/6`".
- **The data.** The two Trees in `trees/` and the 13 valid fixtures at the top of
  `tests/fixtures/` hold 38 question Nodes, every one with a `yes` and a `no`. The 44
  deliberately broken fixtures under `tests/fixtures/broken/` and `tests/fixtures/invalid/`
  hold 44 Nodes with `answers` -- 43 with a `yes` and a `no`, one with a `yes` alone -- and
  one file that is not JSON on purpose (counted with the scripts below).
- **The public page** draws two Answer buttons, 620 x 60 pixels, side by side in a row of
  68, each labelled with the chrome word, a colon and the next step's title
  (`application.md` 10.3, 10.7); the room under the no-scroll rule, at the guaranteed
  1280 x 640 and below it, was measured for two (10.4 to 10.7,
  `docs/adrs/ADR-78-answer-buttons-and-up-arrow.md`).
- **The editor** offers `+ Yes`, `Tree ends here` and `+ No` on a step without Links, and
  the structural write names the Link `'yes' | 'no' | 'option' | 'end'` (`application.md`
  19.7, 30.1, 30.2; `src/editor/writes.ts`; `docs/adrs/ADR-133-structure-editing.md`).
- **Findability.** Each question Node's JSON-LD `Question` carries a suggested answer for the
  yes and one for the no (`application.md` 16.4).
- **The code.** Fourteen files under `src/` name `yes`; seven of them read `answers.yes` /
  `answers.no` or the `'yes' | 'no'` key, and 17 test files read one of those or write
  `link: 'yes'` (grep below).
- **The Options beside the Bubble** -- the other kind of Link (core document 3.1, section
  5) -- number none to eight on any step, as its author chooses (`tree-format.md` 5.4, 5.7),
  and the editor's side-bubble `+` adds one (`application.md` 30.4).
- **"Tree ends here"** makes a step a Terminal, which ends the walk with words its creator
  types (`tree-format.md` 5.5, `application.md` 36).

The counts, run in this worktree at `e190507`:

```
$ python -c "
import json,glob
for f in sorted(glob.glob('trees/*/tree.json')+glob.glob('tests/fixtures/*/tree.json')):
    t=json.load(open(f,encoding='utf-8')); q=[n for n in t['nodes'] if 'answers' in n]
    print(f.replace(chr(92),'/'), t['format'], 'question', len(q), sorted({tuple(sorted(n['answers'])) for n in q}))
"
tests/fixtures/carousel/tree.json elsa-tree/5 question 3 [('no', 'yes')]
tests/fixtures/cycle/tree.json elsa-tree/5 question 3 [('no', 'yes')]
tests/fixtures/explainers/tree.json elsa-tree/5 question 1 [('no', 'yes')]
tests/fixtures/findability/tree.json elsa-tree/5 question 2 [('no', 'yes')]
tests/fixtures/four-languages/tree.json elsa-tree/5 question 1 [('no', 'yes')]
tests/fixtures/full-node/tree.json elsa-tree/5 question 1 [('no', 'yes')]
tests/fixtures/german-only/tree.json elsa-tree/5 question 1 [('no', 'yes')]
tests/fixtures/long-title/tree.json elsa-tree/5 question 1 [('no', 'yes')]
tests/fixtures/other-languages/tree.json elsa-tree/5 question 1 [('no', 'yes')]
tests/fixtures/overlay/tree.json elsa-tree/5 question 1 [('no', 'yes')]
tests/fixtures/single-language/tree.json elsa-tree/5 question 1 [('no', 'yes')]
tests/fixtures/tied-sources/tree.json elsa-tree/5 question 1 [('no', 'yes')]
tests/fixtures/wide-logo/tree.json elsa-tree/5 question 1 [('no', 'yes')]
trees/ai-act-applicability-agrifood/tree.json elsa-tree/5 question 18 [('no', 'yes')]
trees/ai-act-example/tree.json elsa-tree/5 question 2 [('no', 'yes')]

$ python -c "
import json,glob,collections
fs=sorted(glob.glob('tests/fixtures/broken/**/tree.json',recursive=True)+glob.glob('tests/fixtures/invalid/**/tree.json',recursive=True))
tot=0; bad=0; keys=collections.Counter()
for f in fs:
    try: t=json.loads(open(f,encoding='utf-8-sig').read())
    except Exception as e: bad+=1; continue
    for n in t.get('nodes',[]) if isinstance(t,dict) else []:
        if isinstance(n,dict) and 'answers' in n:
            tot+=1; a=n['answers']; keys[tuple(sorted(a)) if isinstance(a,dict) else type(a).__name__]+=1
print(len(fs),'files', bad,'not JSON', tot,'nodes with answers', dict(keys))
"
44 files 1 not JSON 44 nodes with answers {('no', 'yes'): 43, ('yes',): 1}

$ grep -rln "\byes\b" src --include=*.ts*
src/admin/slots.tsx
src/app/[lang]/admin/trees/[tree]/[...path]/page.tsx
src/chrome.ts
src/components/Branch.tsx
src/components/TreeView.tsx
src/editor/Structure.tsx
src/editor/writes.ts
src/findability/jsonld.ts
src/neighbourhood.ts
src/store/edits.ts
src/tree/loader.ts
src/tree/serialise.ts
src/tree/types.ts
src/tree/validate.ts

$ grep -rln -E "answers(\?)?\.(yes|no)|'yes' \| 'no'" src | sort
src/components/TreeView.tsx
src/editor/Structure.tsx
src/editor/writes.ts
src/findability/jsonld.ts
src/store/edits.ts
src/tree/types.ts
src/tree/validate.ts

$ grep -rln -E "answers(\?)?\.(yes|no)|'yes' \| 'no'|link: 'yes'" tests | wc -l
17
```

#220's CONTEXT lists the fourteen and tells its run to grep rather than rely on the list.

## Decision

1. **One instruction, three issues.**

   | Issue | Labels | What it does |
   |---|---|---|
   | #220 | `architecture` | Decides 10.43: the lowest and highest number of next steps, the words on each button, the format and its migration, the Answer row on the public page and in the editor, every other reader; confirms or replaces the PROPOSED readings of decision 5 |
   | #221 | `data`, `ui` | Builds the format, its migration, every reader of the yes and the no, and the public page's Answer row |
   | #222 | `ui` | Builds the editor's control: the creator adds, removes and words a next step |

2. **Architecture first.** The owner asked for it ("start from architecture, we might need
   some structural changes here"), and the change meets frozen contracts at every layer: the
   format's "Exactly the two keys" and its rule that the next change is `elsa-tree/6`
   (`tree-format.md` 5.3, 10); a row whose room was measured for two buttons
   (`ADR-78-answer-buttons-and-up-arrow.md`); the editor's row and its write
   (`ADR-133-structure-editing.md`). A build run that met them would have to supersede them
   on its own, and the implementer's role tells it to report a contradiction with a spec
   and to ask rather than build its best guess (`.orca/roles/implementer.md`). What the
   owner's words leave open is listed in #220's TASK and in core document 10.43, as 10.39
   and 10.40 were listed for #195.

3. **Order, by `Depends on:` lines only.** #220 waits for #219, so that this record -- the
   `[#219]` passages and 10.43 -- is on `dev` before the Architect amends it, as #195 waited
   for #194 (`ADR-194-login-and-authors-round.md` decision 3). #221 waits for #220. #222
   waits for #220 and #221: #221 changes the format and every reader of it, among them the
   store's writes (`src/store/edits.ts`) and the editor's row (`src/editor/Structure.tsx`)
   and their tests, which #222 then extends; built side by side, one of the two would merge
   into a `dev` on which its tests no longer hold. The three issues were created in that
   order, each with its `Depends on:` line from the start (the bodies of #220 and #221 were
   corrected within three minutes, in their counts of the code and the data, and their
   lines did not change), and the lines were read back with the dispatcher's own expression (`_DEPENDS_RE` in
   `dispatch.py`), which finds exactly `#219`, `#220` and `#220, #221`: in the round of
   #194 a placeholder body let #195 and #196 be dispatched before their lines landed
   (reported on #196).

4. **All three are labelled `proposed`.** The project's autonomy mode is `propose`
   (`.orca/dispatch.yml`), in which an issue an agent files is labelled `proposed`, never
   `ready` (`.orca/roles/planner.md`); promoting it is the owner's step. The owner wrote "Put
   issues on the board", where #202 said "Put issues on the board for these and set them to
   ready"; this record does not read "on the board" as `ready`. The timeline of #219 shows
   the owner's account, `IdseVal`, applying `ready` to #219 at 19:56:21Z on 2026-10-09; that
   label released this filing run, not the issues it files. None is labelled `complex`, as
   no architecture issue of the rounds of #169, #194 and #202 was (#171, #195, #205); the
   owner may add it to #220 to route it to the most capable model.

5. **Where the owner's words leave a choice, the record says which reading was taken and
   does not widen the request.** Each is in core document 3.4's `[#219]` bullet, marked
   PROPOSED, and in #220, so that the Architect can confirm or replace it and the owner
   overrule it:
   - "options" are the next steps -- the Answers, the children below the Bubble (10.23) --
     and not the Options beside it. The owner sets "three or four options" against "yes or
     no", which are Answers, and speaks of "how many next steps"; and the number of Options
     is already the author's, none to eight (Context).
   - The number is chosen per step, not once per Tree. A Tree whose every step has a yes
     and a no -- the owner's first case -- is one a per-step choice allows, and so is a Tree
     with a yes and a no on one step and three next steps on another, which a choice made
     once per Tree would forbid.
   - "Three or four" names numbers the creator must be able to choose, not the most: two,
     three and four are allowed. Whether one is, or more than four, is a measurement of the
     room under the no-scroll rule (core document section 9), and #220's.
   - A step that is a yes and a no stays one. The format's migration converts every one of
     the 38, and none is given three or four next steps: Tree content is the owner's.
   - Every button of a step's Answer row looks the same: the owner's rule of #75, "we don't
     want to steer the user with the button colors, so both should have the same layout",
     held for two buttons and is read as holding for every button of the row.
   - "Some trees might end there" is the Terminal the creator has made with "Tree ends here"
     since #133, with words of their own since #179, and #219 does not change it, but for
     where its control stands in the editor's Answer row beside the next steps.

6. **The core document is amended here for every passage the owner's words make untrue**,
   each marked `[#219]` and pointing at the new bullet of 3.4, which holds the owner's words
   whole (the passages are listed in this record's header). Passages that stay true are not
   marked: 10.22's "the Node's title, description and Answer Branches are never given up",
   which #220 must keep for every number; 10.23's "children are the Answer targets", which
   holds for any number; section 9, whose rules hold for every number and which 10.43 names
   as what #220 decides against; and 3.3's first Tree, where each category is to "be their own step that receives a
   yes and a no", the content of the first Tree, which #219 does not change.

## Alternatives rejected

- **Asking the owner first, with `needs-human`, about the number and the words on the
  buttons.** The highest number is a measurement of the page, and the words, the format and
  the editor's control are contracts: the Architect's to decide and the owner's to
  overrule, as 10.39 and 10.40 were on #195. A value only the owner can choose is asked by
  #220 once it is known to be needed.
- **Fixing the highest number, or the words on a button, in this record.** The room is a
  measurement across the viewports of `application.md` 10.6 and below them, in several
  faces, not a reading of the owner's words: #202's record measured the room in the bars before it took a reading of where
  "Editor" goes (`docs/research/issue-202-bar-room.md`, `ADR-202-navigation-round.md`
  decision 5). That measurement is #220's TASK.
- **Reading "options" as the Options beside the Bubble.** Their number is already the
  author's choice, none to eight, so the request would ask for nothing; and the owner sets
  them against "yes or no" (decision 5).
- **A number chosen once per Tree.** It forbids a Tree that mixes a yes-and-no step with a
  three-way one and allows nothing a per-step choice does not (decision 5). The owner can
  overrule it on #220.
- **No architecture issue.** The owner asked for one, and decision 2 lists the frozen
  contracts a build run would have had to supersede alone.
- **One build issue for the format, the page and the editor.** One run would carry the
  format, a migration, every reader, the no-scroll measurements and the editor under one
  run's ceiling (`max_run_minutes`, 150): #179 built the ending's format, its migration and
  its editor in one issue and was still committing its screenshots at 133 minutes, with the
  final suites still to run (`.orca/dispatch.yml`, the comment on `max_run_minutes`).
- **The format in one build issue and the public page in another.** A format that accepts a
  step with three next steps on a `dev` whose page draws two would break the frontend on a
  Tree that follows the agreed shape, which core document section 9 forbids, from the first
  merge to the second.
- **Labelling the issues `ready`.** See decision 4.

## Consequences

- Nothing is dispatched until the owner promotes #220 (and then #221 and #222) to `ready`.
  Once promoted, the dispatcher holds #220 until this pull request merges and closes #219;
  then #221; then #222.
- The specs are not amended here; until #220 merges they describe what is on `dev`, which is
  correct. Core document 3.1, 3.2, 3.4 and 5 state the owner's change from the moment this
  merges, ahead of the build, as in the rounds of #75, #131, #169, #194 and #202; 10.43 is
  OPEN until #220 decides it.
- The fourteen files of `src/` above and the tests that walk a yes or a no change with #221
  if #220 changes the shape of `answers`, which the format's own rule asks for any change of
  its keys (`tree-format.md` 10).
