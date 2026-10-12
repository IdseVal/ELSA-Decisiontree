# ADR-241-small-final-tasks-round: the owner's two editor faults are two build issues, #242 and #243, filed `ready`

- Status: ACCEPTED -- 2026-10-12
- Issue: #241 -- Small final tasks (the owner's instruction)
- Issues filed: #242 (`bug`, `ui`), #243 (`ui`)
- Specs affected: none here; #242 amends `docs/specs/application.md` 28.1, and #243 amends 30.2,
  41.7, 42.7 and 42.8
- Core document: amended here, marked `[#241]`: the preamble, the status and owner lines, the
  sentence of 3.4 on what a creation does, and a new bullet in 3.4 holding the owner's words
  whole and the readings taken of them

## Context

The owner wrote in issue #241, on 2026-10-12 at 08:14:23Z:

> "- The "add source" overlay on both the main bubble and on side bubbles doesn't work, does
> not allow for sources to be added, window doesnt close, disfunctional button/overlay - The "Add a next step"
> overlay, when clicked moves the user to that new node, let's just
> make it so on pressing the button to create a next step, the view stays on the panel where
> the user was editing."

and under "Task": "Put issues on the board for these things and set them to ready so they can
be picked up".

**The Source Sheet.** "The add source overlay" is the Sheet that `+ Add a source` opens after a
step's last Source, on the main Bubble and in an open side bubble's Overlay
(`docs/specs/application.md` 28.1, 30.5; `AddSourceForm` in `src/editor/Field.tsx`). By 28.1
(**[#138] as built**), it sends nothing until the Link field holds a URL of the schema's
grammar, `isUrl` in `src/tree/grammar.ts`: `^https?://[^\s/?#]+(?:[/?#][^\s]*)?$`.

This run reproduced the Sheet on `dev` (`2348030`) on the production build, in Playwright's
Chromium on Windows, in English, with a scratch spec that was deleted afterwards. It used a
fresh Tree's root step and a side bubble made with the fan's `+`, at 1280 x 640 and
1920 x 1080. Its output:

```
1280x640 main after submit: open add Sheets 0, visible label fields 1, overlay open 0
1280x640 side: visible add buttons in the Overlay: 1
1280x640 side after submit: open add Sheets 0, visible label fields 2, overlay open 1
1280x640 console: none
1920x1080 main after submit: open add Sheets 0, visible label fields 1, overlay open 0
1920x1080 side after submit: open add Sheets 0, visible label fields 2, overlay open 1
1920x1080 console: none
empty: button disabled=true bg=rgb(60, 90, 134) color=rgb(251, 250, 246) opacity=1 cursor=pointer
'eur-lex.europa.eu/eli/reg/2024/1689/oj': button disabled=true bg=rgb(60, 90, 134) ... opacity=1 cursor=pointer; url aria-invalid=true
'www.example.org': button disabled=true bg=rgb(60, 90, 134) ... opacity=1 cursor=pointer; url aria-invalid=true
'https://example.org/a': button disabled=false bg=rgb(60, 90, 134) ... opacity=1 cursor=pointer
after click and Enter on 'www.example.org': open add Sheets 1
after Close: open add Sheets 0
```

With `https://` typed, the Sheet adds the Source on both Bubbles and closes. With a link typed
without its scheme, it refuses the link and says nothing: the button is disabled but drawn
exactly as when enabled, and the Sheet stays open. Close works. The Link field has no
placeholder, although a Source's own URL field shows `placeholderUrl` (`https://…`).

**The next step's Sheet.** "The Add a next step overlay" is the Sheet of the row's one `+`,
titled `addNextStep` (42.7 items 1 and 2). Since #233 it is the only control that makes a
next step. With its switch `Tree ends here` off, `confirm` creates the next step, and the editor
then leaves the page by a plain navigation to the new step (42.7 item 3, 41.7 item 3, 30.2;
`WordsForm` in `src/editor/Structure.tsx`). That navigation goes back to
`ADR-133-structure-editing.md` decision 3, and `ADR-231-slide-in-the-editor.md` decision 9
kept it, without a slide. With the switch on, the editor already stays on the page.

## Decision

1. **Two issues, one per point of the owner's, both labelled `ready`.** `ready`, not
   `proposed`, because the owner said so on #241 ("set them to ready so they can be picked
   up"), although `.orca/dispatch.yml` has `autonomy: propose`.
   - **#242** (`bug`, `ui`) reproduces the Source Sheet's fault first, on both Bubbles and in
     both languages, and fixes what it finds. The reproduction above is its starting point.
     It also accepts a link typed without a scheme, by putting `https://` in front where that
     makes a URL of the grammar, and it makes the Sheet say what it needs.
   - **#243** (`ui`) keeps the editor on the step when a next step is created. The Sheet closes,
     the new button stands in the row, and following it afterwards slides as its siblings'
     buttons do.
2. **The readings taken, PROPOSED** (core document 3.4 `[#241]`; the owner can overrule them in
   a new issue):
   - the owner typed or pasted a link without `https://`, and met a button that looked
     enabled and did nothing, in a Sheet that stayed open. The reproduction found no other
     failure, and #242 fixes another one if its own reproduction finds it;
   - "the button to create a next step" is the `+` Sheet's `confirm` with the switch off, and
     "the panel where the user was editing" is the step whose `+` was pressed;
   - the side bubble's `+` makes an Option, not a next step, and still opens the new side
     bubble (30.4).
3. **Each issue amends its own spec sections and records its own ADR**, as #177 did for the
   side bubble. This record changes no spec. #242's amendment of 28.1 and #243's of 30.2, 41.7,
   42.7 and 42.8 do not share a section, so the two issues do not wait on each other.
4. **Both depend on #241**, so that neither is dispatched before this record, whose 3.4 bullet
   and ADR their `Read:` lines name, is on `dev`.

## Alternatives rejected

- **One issue for both points.** They touch different code (`Field.tsx` and the stylesheet;
  `Structure.tsx` and the creation tests) and different spec sections. One of them is a bug to
  reproduce, the other a change of behaviour the owner decided. Two runs are smaller and
  review apart.
- **An architecture issue before #243.** The owner decided the behaviour. What is left is
  which repaint and which focus, and the spec already has the repaint: an accepted structural
  write draws the page again (`router.refresh()` in `src/editor/Editor.tsx`), as the switch-on
  case does today. #243 names a fallback, a plain link, if the new button cannot slide.
- **Fix the Source Sheet in this run.** #241's task is to put issues on the board.
- **Send links without a scheme as typed.** The schema requires `http://` or `https://`
  (`tree-format.md` 5.1 and V-SOURCE; 28.1's reason: "a made-up address would be silent content"). #242
  puts `https://` in front only where the text already has a host with a dot, and refuses
  everything else with a hint.

## Consequences

- #242 and #243 are dispatched once this pull request merges and closes #241.
- After #243, the tests that learn a new step's id from the address they land on read it from
  the write's response or the store instead. #243's point 6 names them.
- After #242, a creator who pastes `www.example.org` gets a Source with
  `https://www.example.org`. The stored format does not change.
