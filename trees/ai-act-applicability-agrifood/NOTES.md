# Notes for the owner: how this Tree is organised and how to edit it

This Tree is **version 0.1**. It was prepared by the project's agents from the research in
`docs/research/issue-3-ai-act-applicability.md` so that you can see the working tool with
real content and correct it by hand. **Nothing here has had legal review.** That review is
yours, and it is deliberately not enforced by any code (core document, section 3.3).

The loader ignores this file, so you can write anything in it.

## 1. Where the files are

```
trees/ai-act-applicability-agrifood/
  tree.yaml          the WHOLE Tree: the manifest, then one document per Node
  NOTES.md           this file (ignored by the loader)
  theme/             the lab's look: the logo, the tab icon, the fonts and their licence
```

There is no `images/` folder yet. See section 6. The `theme/` folder holds what the
manifest's `theme:` block names -- the ELSA-Lab logo, the favicon and three Open Sans
files, downloaded from ai4sfs.org by issue #40 -- plus `LICENCE.md`, which states the
terms of each and carries the three questions about the logo that only the owner can
answer. Changing a colour in `theme:` and restarting the server changes the page; no code
knows any of these values. There is no `nodes/` folder any more:
`elsa-tree/2` (issue #37) puts the whole Tree in one file, and issue #39 converted it.
Inside `tree.yaml` a Node begins at a line `--- # <node-id>` followed by `id: <node-id>`,
so searching for `--- #` lists every Node in order, and searching for `# social-scoring`
lands on that Node. Everything else about a Node is exactly what its old file held.

**This Tree does not load yet.** Its text is longer than `elsa-tree/2` allows, so the
validator rejects it; section 10 is the list of what has to be cut, which is issue #44's
work. The application's development default is `trees/ai-act-example` until then.

The full file format is `docs/specs/tree-format.md`. Everything below is a short guide to
this Tree in particular; the spec is the contract.

## 2. The six steps, and which Node is which

The walk starts at the Node `start` (the manifest's `root`) and runs through eight
question Nodes to one of four Terminals.

| Step | Question Node | yes | no |
|---|---|---|---|
| 1. Jurisdictional scope (Art. 2) | `start` | step 2 | `ai-act-does-not-apply` |
| 2. Material scope (Art. 3(1)) | `ai-system-definition` | step 3 | `not-an-ai-system` |
| 3. Prohibited practices (Art. 5) | `prohibited-practices` | `prohibited` | step 4a |
| 4a. High-risk, Annex I (Art. 6(1)) | `annex-i-legislation` | step 4c | step 4b |
| 4b. High-risk, Annex III (Art. 6(2)) | `annex-iii-areas` | step 4c | step 5 |
| 4c. The high-risk finding | `high-risk` | step 5 | step 5 |
| 5. General-purpose AI (Ch. V) | `general-purpose-ai` | step 6 | step 6 |
| 6. Transparency (Art. 50) | `transparency-obligations` | `end-of-walk` | `end-of-walk` |

Steps 4c, 5 and 6 do not branch: both Answers lead on. That is deliberate and matches the
outline - a high-risk finding and being general-purpose AI neither end the walk nor remove
an earlier finding, and the Tree goes no further than Article 50 (core document 3.3, item
7). Step 4c is a **finding**, not a question: it reports that the system is high-risk and
carries that on. Its yes/no buttons therefore both do the same thing; see section 8.

The four Terminals are `ai-act-does-not-apply` (`not-applicable`), `not-an-ai-system`
(`refer`), `prohibited` (`prohibited`) and `end-of-walk` (`applicable`). Three of them end
the walk before step 6, deliberately: the first two because the Act does not reach the
system at all, `prohibited` because Article 5 leaves no route to compliance, so the
question "which obligations attach?" has nothing to add. The `prohibited` Node's own text
now says so, rather than leaving it to be inferred.

## 3. The lists, and how many entries each has

The other 49 Nodes are **explanation Nodes**: one per entry in a list. They have no
Answers. A reader opens one, reads it, and goes back through the Trail to answer the
question it hangs under.

| List | Node holding the list | Entries | Id prefix |
|---|---|---|---|
| Article 2 exclusions | `start` | 6 | `exclusion-` |
| Article 5(1) prohibited practices | `prohibited-practices` | 10 | (named per practice) |
| Annex I legislation | `annex-i-legislation` | 20 | `annex-i-` |
| Annex III high-risk areas | `annex-iii-areas` | 8 | `annex-iii-` |
| Article 50 situations | `transparency-obligations` | 5 | `article-50-` |

Each count is the count issue #3 measured in the Act itself; `tests/ai-act-tree.test.ts`
fails if a list and its count drift apart, so if you add or remove an entry on purpose,
update that test in the same commit.

## 4. Editing a Node

Open the file, change the text, save. Then run:

```
npm run validate trees/ai-act-applicability-agrifood
```

It prints `valid` or one line per problem: the Node, the key path, the rule id, and what
is wrong. The application refuses to start on an invalid Tree, so this is the same check
the server does. `npm test` additionally checks the counts and the shape described above.

Things that will trip you up, in rough order of likelihood:

- **Both languages, always.** Every `title`, `description`, Option `title` and Source
  `label` must have an `en:` and an `nl:`. A half-translated Tree does not load at all;
  there is no fallback for content.
- **Quote the version.** `version: "0.1"`, with the quotes. Unquoted it is a number and is
  rejected.
- **Titles are one line.** `title`, Option titles and Source labels take no line breaks.
- **Everything has a maximum length now**, because nothing on the page may scroll: 80
  characters for a title, 600 for a description (and at most 8 rendered lines), 60 for an
  Option title or a Source label, 3 Sources, 8 Options. The validator names the actual
  length and the maximum. Section 10 lists every place this Tree is over.
- **No unknown keys.** A typo like `anwsers:` is an error, not a silently ignored key. The
  one place you may invent keys is under `metadata:`.
- **`yes` and `no` are the only Answer keys**, and both are required on a question Node.
- **Renaming a Node renames its id.** The id is the `id:` line under the `--- #` separator.
  If you rename `social-scoring`, every `target:` and Answer pointing at it has to change
  too -- change the `--- # social-scoring` comment with it -- and any link anyone has
  shared to that Node breaks.

## 5. What the description may contain

Paragraphs separated by a blank line, `*emphasis*`, `**strong**`, `- ` bullets, `1. `
numbered lists, and `[text](https://...)` links. Nothing else: no headings, no tables, no
raw HTML, no inline images. Write it as a YAML block scalar, which is the `|` you see
after `en:` and `nl:`, and indent the text under it.

## 6. Adding images

There are **no images in this Tree**. Every `images:` list is absent, which is how the
format says "none". You add them, with their credits, as the core document (section 6)
says you would:

1. create the folder `trees/ai-act-applicability-agrifood/images/`;
2. put the file in it, with a lowercase name and no spaces, e.g. `annex-i-tractor.png`;
3. add an `images:` list to the Node, or to the Option that should carry the picture:

```yaml
images:
  - file: annex-i-tractor.png
    description:
      en: A tractor with an automated steering system
      nl: Een trekker met een automatisch stuursysteem
    credit: "Photo: Name, CC BY 4.0"
```

`credit` is required on every image without exception, and the description is used as the
alternative text. The natural places for them are the Options of `annex-i-legislation`
(what kind of product each piece of legislation covers) and of `annex-iii-areas`, which is
what the core document has in mind.

## 7. The Sources, and the URL language decision

Every Node cites at least one **legal** Source. There are no case-law or literature
Sources anywhere: the research document does not provide any, and this Tree does not cite
what has not been verified.

Two URL shapes are used, both from the research document:

- the AI Act itself, as the **consolidated text of 27 July 2026**, with the article or
  annex anchor:
  `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02024R1689-20260727#art_5`;
- another act named in Annex I, by its CELEX number:
  `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32013R0167`.

**You have decided this one: the `/EN/` addresses stay.** These URLs contain `/EN/`, so
they open the English rendering whatever language the reader is using. The format allows
only one URL per Source, and the spec prefers language-neutral addresses. Replacing `/EN/`
with `/NL/` flips it the other way; an `/eli/` address negotiates the language but does not
address the consolidated version. The research (section 2.1) recommends citing the
consolidated CELEX URL, which is what was done. Asked about this on PR #18, you answered:
*"we can link to EU legal texts that are in English, that is not an issue and can be solved
in the future if determined that it is an issue."* If a Dutch-language source requirement is
established later, it becomes its own issue; nothing in this Tree changes until then.

## 8. What is deliberately unfinished

- **`general-purpose-ai` is marked `placeholder: true` in its metadata.** The research
  (section 7.3) shows this step is really two questions with different consequences - "do
  you provide a general-purpose AI *model*?", which triggers Chapter V, and "is your system
  based on such a model?", which matters for Article 50(2) - and one yes/no cannot separate
  them. Splitting it in two is an authoring decision left to you.
- **`not-an-ai-system` names product safety regulation and the product liability directive
  in its text but does not cite them.** The AI Act does not say what applies to a system
  that is not an AI system (research, section 4.4), so any such list is your editorial
  content. Add the Sources you want to stand behind.
- **The Tree never asks which role you are in** - provider, deployer, importer,
  distributor. The research (item U6) shows that steps 3 and 6 both depend on that answer:
  Article 5 prohibits different things for providers and deployers under points (ba) and
  (bb), and Article 50 splits its five situations between the two. Adding a role step is
  the largest single improvement available, and it is your call.
- **Nothing after Article 50.** Obligations per role, conformity assessment, registration
  and penalties are out of scope for this version (core document, section 4).
- **`high-risk` is no longer a Terminal** (decided in **issue #24**). It used to end the
  walk while its own text told the reader to continue with steps 5 and 6, which the Tree
  could not do. It is now a question Node whose two Answers both lead to
  `general-purpose-ai`, so a high-risk system reaches the Article 50 step. The reasons: a
  high-risk system can carry Article 50 obligations at the same time (Article 50(6)); the
  core document answers OPEN 10.7 that the general-purpose AI and transparency steps come
  after the high-risk step; and the third option the issue offered - linking `high-risk` to
  step 5 as an Option - is not possible in `elsa-tree/1`, where a Terminal may have no
  Options and an Option must target an explanation Node (rules V-TERMINAL, V-OPTIONS).
  Two consequences you may want to change once you have seen the tool:
  - the high-risk finding is no longer a styled **outcome**. The walk for that branch ends
    at `end-of-walk` (`applicable`), whose text now says the high-risk finding stands
    alongside whatever step 6 found. If you would rather the reader see a high-risk
    *outcome*, the format has no way to do both, and the choice is between the two;
  - `high-risk` shows the frontend's **yes/no buttons under a statement**, because a Node
    that leads on must be a question Node and "yes"/"no" are UI chrome the Tree cannot
    rename. Its text says plainly that either answer continues.
- **A high-risk system under Annex I, Section B is sent into the Article 50 step anyway, and
  this version leaves it that way** (decided in **issue #26**). `high-risk`'s own text says
  that for such a system Article 2(2) makes only Article 6(1), Article 60a and Articles 102
  to 112 apply, and Article 50 is not among them; step 6 nonetheless tells every reader that
  Article 50 attaches whatever their risk classification. On that one route the Tree
  contradicts itself. Both ways out - a caveat sentence on `high-risk`, or splitting step 4c
  by Annex I Section - are legal authoring, and on issue #26 you answered: *"we are at this
  stage not going to worry about the contents of the Decision-tree, that is for a next
  iteration ... don't extend the decision-tree's contents, that will be a manual insert on my
  end."* So no Node was reworded and no branch was added here. What ships is pinned instead,
  in `tests/ai-act-tree.test.ts`, and it is worth knowing exactly what the pin catches before
  you make that insert:
  - **the wording.** The test *"the Annex I Section B tension is left standing, and nothing
    on the route reconciles it"* keeps both sentences that disagree verbatim in en and nl, so
    a reword fails. It also fails if any paragraph of steps 4c, 5 or 6 names the Section B
    carve-out and Article 50 together in either language - which is what a caveat resolving
    this has to do. **An added sentence therefore fails it too**, wherever on the route you
    add it; the failure message points back here;
  - **the branch.** Splitting step 4c by Annex I Section needs a new question Node and a new
    Terminal, which fails five older tests (the six-step chain, the 8/4/49 kind counts,
    Terminal reachability, *"a high-risk finding carries on ..."* and *"the walk stops early
    only where the Act itself stops"*). That is issue #24's traversal, pinned there rather
    than repeated here.

  Either way you land back on this entry, which is the point: rewrite the pin deliberately
  when you resolve this, do not delete it to get green. It matters for this audience: 9 of
  the 20 Annex I entries are Section B, `annex-i-agricultural-vehicles` among them.
- ~~**The Tree cannot be walked by clicking yet.**~~ **Closed by issue #23.** When #10
  shipped, the page rendered a Node's title and description only - no Answers, no Options,
  no language switch - so the Tree could be read at its URLs but not walked. #7, #8 and #9
  have merged since. `npm run test:first-tree` now walks this Tree in a browser as a reader
  does; every Terminal is reached from the root by clicking Answers alone. The screenshots
  in `docs/screenshots/issue-10/` come from that same walk, re-taken with
  `ELSA_SHOTS=1 npm run test:first-tree` - they record one machine's rendering, because the
  app uses whatever fonts the machine has, so a plain run leaves them untouched.

## 9. The legal text this was written from

The Act has been amended. Everything here is written from the **consolidated text of 27
July 2026** (CELEX `02024R1689-20260727`), which integrates Regulation (EU) 2026/1744
(Digital Omnibus on AI). Three consequences show up throughout, and are the things to
check first against any older document you may have:

- Article 5(1) lists **10** prohibited practices, not 8. Points (ba) and (bb) apply from
  2 December 2026.
- **Annex I changed**: the Machinery Directive 2006/42/EC was deleted from Section A, and
  the Machinery Regulation (EU) 2023/1230 was added as point 21 of Section B.
- The **high-risk rules apply later** than originally enacted: 2 December 2027 for Annex
  III systems, 2 August 2028 for Annex I systems.

The Dutch text uses the official terminology of the Dutch-language consolidated text -
`aanbieder`, `gebruiksverantwoordelijke`, `in de handel brengen`, `in gebruik stellen`,
`veiligheidscomponent`, `AI-systeem met een hoog risico`. Keep those words if you rewrite a
passage; they are the Regulation's own.

## 10. What has to be cut to fit `elsa-tree/2` (issue #44's work list)

`elsa-tree/2` gives every text a maximum length, because nothing on the page may scroll
(`docs/specs/tree-format.md` 5.7). This Tree was written before those limits existed, so
issue #39 converted it faithfully -- not one word was shortened -- and recorded here what
the validator says. **454 violations**, and nothing but these three rules:

| Rule | What it means | Count |
|---|---|---|
| V-LENGTH | a text longer than its maximum | 327 |
| V-LINES | a description that lays out over more than 8 lines | 124 |
| V-COUNT | a list with more entries than allowed | 3 |

Where the 327 V-LENGTH violations sit: 123 descriptions (over 600 characters), 136 Source
labels (over 60), 41 Option titles (over 60) and 27 Node titles (over 80, across 19
Nodes). All 124 V-LINES are descriptions: every one of the 61 Nodes and the manifest is
over 8 lines in both languages. The three V-COUNT are the two long Option lists and one
Node with four Sources -- `annex-i-legislation` (20 Options, 4 Sources) and
`prohibited-practices` (10 Options) -- which #44 cuts into steps of at most 8, titled
`(1/3)`, `(2/3)` and so on (5.8).

Each figure counts one language at a time: a Node whose English and Dutch titles are both
too long is two violations. Reproduce the list at any time with:

```
npm run validate trees/ai-act-applicability-agrifood
```

The list below is that output, grouped by Node, with the count per Node in brackets.

```manifest  (4)
  description.en              V-LINES   13 estimated lines; at most 8
  description.en              V-LENGTH  663 characters; at most 600
  description.nl              V-LINES   13 estimated lines; at most 8
  description.nl              V-LENGTH  766 characters; at most 600

start  (18)
  description.en              V-LINES   33 estimated lines; at most 8
  description.en              V-LENGTH  1744 characters; at most 600
  description.nl              V-LINES   35 estimated lines; at most 8
  description.nl              V-LENGTH  2008 characters; at most 600
  sources[1].label.en         V-LENGTH  101 characters; at most 60
  sources[1].label.nl         V-LENGTH  128 characters; at most 60
  options[0].title.en         V-LENGTH  76 characters; at most 60
  options[0].title.nl         V-LENGTH  89 characters; at most 60
  options[1].title.en         V-LENGTH  88 characters; at most 60
  options[1].title.nl         V-LENGTH  112 characters; at most 60
  options[2].title.en         V-LENGTH  90 characters; at most 60
  options[2].title.nl         V-LENGTH  111 characters; at most 60
  options[3].title.en         V-LENGTH  74 characters; at most 60
  options[3].title.nl         V-LENGTH  95 characters; at most 60
  options[4].title.en         V-LENGTH  96 characters; at most 60
  options[4].title.nl         V-LENGTH  131 characters; at most 60
  options[5].title.en         V-LENGTH  77 characters; at most 60
  options[5].title.nl         V-LENGTH  102 characters; at most 60

ai-act-does-not-apply  (4)
  description.en              V-LINES   14 estimated lines; at most 8
  description.en              V-LENGTH  648 characters; at most 600
  description.nl              V-LINES   17 estimated lines; at most 8
  description.nl              V-LENGTH  792 characters; at most 600

ai-system-definition  (6)
  description.en              V-LINES   38 estimated lines; at most 8
  description.en              V-LENGTH  1930 characters; at most 600
  description.nl              V-LINES   40 estimated lines; at most 8
  description.nl              V-LENGTH  2212 characters; at most 600
  sources[1].label.en         V-LENGTH  61 characters; at most 60
  sources[1].label.nl         V-LENGTH  72 characters; at most 60

annex-i-agricultural-vehicles  (8)
  description.en              V-LINES   23 estimated lines; at most 8
  description.en              V-LENGTH  1311 characters; at most 600
  description.nl              V-LINES   28 estimated lines; at most 8
  description.nl              V-LENGTH  1590 characters; at most 600
  sources[1].label.en         V-LENGTH  105 characters; at most 60
  sources[1].label.nl         V-LENGTH  110 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-cableway-installations  (6)
  description.en              V-LINES   17 estimated lines; at most 8
  description.en              V-LENGTH  942 characters; at most 600
  description.nl              V-LINES   20 estimated lines; at most 8
  description.nl              V-LENGTH  1143 characters; at most 600
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-civil-aviation-security  (8)
  description.en              V-LINES   18 estimated lines; at most 8
  description.en              V-LENGTH  1032 characters; at most 600
  description.nl              V-LINES   22 estimated lines; at most 8
  description.nl              V-LENGTH  1295 characters; at most 600
  sources[1].label.en         V-LENGTH  83 characters; at most 60
  sources[1].label.nl         V-LENGTH  119 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-explosive-atmospheres  (9)
  title.nl                    V-LENGTH  83 characters; at most 80
  description.en              V-LINES   21 estimated lines; at most 8
  description.en              V-LENGTH  1124 characters; at most 600
  description.nl              V-LINES   24 estimated lines; at most 8
  description.nl              V-LENGTH  1336 characters; at most 600
  sources[1].label.en         V-LENGTH  119 characters; at most 60
  sources[1].label.nl         V-LENGTH  130 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-gas-appliances  (7)
  description.en              V-LINES   20 estimated lines; at most 8
  description.en              V-LENGTH  1066 characters; at most 600
  description.nl              V-LINES   23 estimated lines; at most 8
  description.nl              V-LENGTH  1248 characters; at most 600
  sources[1].label.nl         V-LENGTH  63 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-ivd-medical-devices  (8)
  description.en              V-LINES   20 estimated lines; at most 8
  description.en              V-LENGTH  1071 characters; at most 600
  description.nl              V-LINES   23 estimated lines; at most 8
  description.nl              V-LENGTH  1316 characters; at most 600
  sources[1].label.en         V-LENGTH  63 characters; at most 60
  sources[1].label.nl         V-LENGTH  84 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-legislation  (14)
  title.nl                    V-LENGTH  86 characters; at most 80
  description.en              V-LINES   45 estimated lines; at most 8
  description.en              V-LENGTH  2463 characters; at most 600
  description.nl              V-LINES   53 estimated lines; at most 8
  description.nl              V-LENGTH  3075 characters; at most 600
  sources                     V-COUNT   4 entries; at most 3
  sources[0].label.en         V-LENGTH  86 characters; at most 60
  sources[0].label.nl         V-LENGTH  101 characters; at most 60
  sources[1].label.nl         V-LENGTH  70 characters; at most 60
  sources[3].label.nl         V-LENGTH  86 characters; at most 60
  options                     V-COUNT   20 entries; at most 8
  options[3].title.en         V-LENGTH  70 characters; at most 60
  options[3].title.nl         V-LENGTH  83 characters; at most 60
  options[17].title.nl        V-LENGTH  70 characters; at most 60

annex-i-lifts  (8)
  description.en              V-LINES   17 estimated lines; at most 8
  description.en              V-LENGTH  962 characters; at most 600
  description.nl              V-LINES   20 estimated lines; at most 8
  description.nl              V-LENGTH  1156 characters; at most 600
  sources[1].label.en         V-LENGTH  70 characters; at most 60
  sources[1].label.nl         V-LENGTH  72 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-machinery  (6)
  description.en              V-LINES   25 estimated lines; at most 8
  description.en              V-LENGTH  1410 characters; at most 600
  description.nl              V-LINES   28 estimated lines; at most 8
  description.nl              V-LENGTH  1666 characters; at most 600
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-marine-equipment  (6)
  description.en              V-LINES   21 estimated lines; at most 8
  description.en              V-LENGTH  1087 characters; at most 600
  description.nl              V-LINES   24 estimated lines; at most 8
  description.nl              V-LENGTH  1342 characters; at most 600
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-medical-devices  (6)
  description.en              V-LINES   17 estimated lines; at most 8
  description.en              V-LENGTH  936 characters; at most 600
  description.nl              V-LINES   20 estimated lines; at most 8
  description.nl              V-LENGTH  1144 characters; at most 600
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-motor-vehicle-approval  (8)
  description.en              V-LINES   22 estimated lines; at most 8
  description.en              V-LENGTH  1234 characters; at most 600
  description.nl              V-LINES   26 estimated lines; at most 8
  description.nl              V-LENGTH  1491 characters; at most 600
  sources[1].label.en         V-LENGTH  185 characters; at most 60
  sources[1].label.nl         V-LENGTH  212 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-motor-vehicle-general-safety  (8)
  description.en              V-LINES   20 estimated lines; at most 8
  description.en              V-LENGTH  1140 characters; at most 600
  description.nl              V-LINES   23 estimated lines; at most 8
  description.nl              V-LENGTH  1405 characters; at most 600
  sources[1].label.en         V-LENGTH  191 characters; at most 60
  sources[1].label.nl         V-LENGTH  229 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-personal-protective-equipment  (7)
  description.en              V-LINES   20 estimated lines; at most 8
  description.en              V-LENGTH  1082 characters; at most 600
  description.nl              V-LINES   24 estimated lines; at most 8
  description.nl              V-LENGTH  1311 characters; at most 600
  sources[1].label.nl         V-LENGTH  71 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-pressure-equipment  (8)
  description.en              V-LINES   20 estimated lines; at most 8
  description.en              V-LENGTH  1093 characters; at most 600
  description.nl              V-LINES   23 estimated lines; at most 8
  description.nl              V-LENGTH  1268 characters; at most 600
  sources[1].label.en         V-LENGTH  89 characters; at most 60
  sources[1].label.nl         V-LENGTH  72 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-radio-equipment  (8)
  description.en              V-LINES   21 estimated lines; at most 8
  description.en              V-LENGTH  1201 characters; at most 600
  description.nl              V-LINES   26 estimated lines; at most 8
  description.nl              V-LENGTH  1487 characters; at most 600
  sources[1].label.en         V-LENGTH  86 characters; at most 60
  sources[1].label.nl         V-LENGTH  73 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-rail-interoperability  (8)
  description.en              V-LINES   18 estimated lines; at most 8
  description.en              V-LENGTH  1041 characters; at most 600
  description.nl              V-LINES   21 estimated lines; at most 8
  description.nl              V-LENGTH  1277 characters; at most 600
  sources[1].label.en         V-LENGTH  92 characters; at most 60
  sources[1].label.nl         V-LENGTH  101 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-recreational-craft  (8)
  description.en              V-LINES   17 estimated lines; at most 8
  description.en              V-LENGTH  958 characters; at most 600
  description.nl              V-LINES   20 estimated lines; at most 8
  description.nl              V-LENGTH  1151 characters; at most 600
  sources[1].label.en         V-LENGTH  66 characters; at most 60
  sources[1].label.nl         V-LENGTH  67 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-toys  (6)
  description.en              V-LINES   17 estimated lines; at most 8
  description.en              V-LENGTH  934 characters; at most 600
  description.nl              V-LINES   20 estimated lines; at most 8
  description.nl              V-LENGTH  1144 characters; at most 600
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-two-or-three-wheel-vehicles  (8)
  description.en              V-LINES   23 estimated lines; at most 8
  description.en              V-LENGTH  1260 characters; at most 600
  description.nl              V-LINES   27 estimated lines; at most 8
  description.nl              V-LENGTH  1537 characters; at most 600
  sources[1].label.en         V-LENGTH  116 characters; at most 60
  sources[1].label.nl         V-LENGTH  131 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-i-unmanned-aircraft  (8)
  description.en              V-LINES   24 estimated lines; at most 8
  description.en              V-LENGTH  1355 characters; at most 600
  description.nl              V-LINES   28 estimated lines; at most 8
  description.nl              V-LENGTH  1655 characters; at most 600
  sources[1].label.en         V-LENGTH  72 characters; at most 60
  sources[1].label.nl         V-LENGTH  94 characters; at most 60
  sources[2].label.en         V-LENGTH  67 characters; at most 60
  sources[2].label.nl         V-LENGTH  91 characters; at most 60

annex-iii-areas  (12)
  description.en              V-LINES   41 estimated lines; at most 8
  description.en              V-LENGTH  2413 characters; at most 600
  description.nl              V-LINES   49 estimated lines; at most 8
  description.nl              V-LENGTH  2868 characters; at most 600
  sources[0].label.en         V-LENGTH  71 characters; at most 60
  sources[0].label.nl         V-LENGTH  82 characters; at most 60
  sources[1].label.en         V-LENGTH  67 characters; at most 60
  sources[1].label.nl         V-LENGTH  90 characters; at most 60
  options[3].title.en         V-LENGTH  63 characters; at most 60
  options[3].title.nl         V-LENGTH  71 characters; at most 60
  options[4].title.en         V-LENGTH  80 characters; at most 60
  options[4].title.nl         V-LENGTH  89 characters; at most 60

annex-iii-biometrics  (6)
  description.en              V-LINES   28 estimated lines; at most 8
  description.en              V-LENGTH  1453 characters; at most 600
  description.nl              V-LINES   32 estimated lines; at most 8
  description.nl              V-LENGTH  1675 characters; at most 600
  sources[1].label.en         V-LENGTH  89 characters; at most 60
  sources[1].label.nl         V-LENGTH  105 characters; at most 60

annex-iii-critical-infrastructure  (7)
  description.en              V-LINES   24 estimated lines; at most 8
  description.en              V-LENGTH  1266 characters; at most 600
  description.nl              V-LINES   26 estimated lines; at most 8
  description.nl              V-LENGTH  1464 characters; at most 600
  sources[0].label.nl         V-LENGTH  61 characters; at most 60
  sources[1].label.en         V-LENGTH  65 characters; at most 60
  sources[1].label.nl         V-LENGTH  104 characters; at most 60

annex-iii-education  (6)
  description.en              V-LINES   21 estimated lines; at most 8
  description.en              V-LENGTH  1105 characters; at most 600
  description.nl              V-LINES   21 estimated lines; at most 8
  description.nl              V-LENGTH  1189 characters; at most 600
  sources[0].label.en         V-LENGTH  61 characters; at most 60
  sources[0].label.nl         V-LENGTH  67 characters; at most 60

annex-iii-employment  (8)
  description.en              V-LINES   27 estimated lines; at most 8
  description.en              V-LENGTH  1490 characters; at most 600
  description.nl              V-LINES   31 estimated lines; at most 8
  description.nl              V-LENGTH  1725 characters; at most 600
  sources[0].label.en         V-LENGTH  88 characters; at most 60
  sources[0].label.nl         V-LENGTH  106 characters; at most 60
  sources[1].label.en         V-LENGTH  73 characters; at most 60
  sources[1].label.nl         V-LENGTH  85 characters; at most 60

annex-iii-essential-services  (7)
  title.nl                    V-LENGTH  86 characters; at most 80
  description.en              V-LINES   29 estimated lines; at most 8
  description.en              V-LENGTH  1708 characters; at most 600
  description.nl              V-LINES   35 estimated lines; at most 8
  description.nl              V-LENGTH  2085 characters; at most 600
  sources[0].label.en         V-LENGTH  78 characters; at most 60
  sources[0].label.nl         V-LENGTH  97 characters; at most 60

annex-iii-justice-and-democracy  (6)
  description.en              V-LINES   22 estimated lines; at most 8
  description.en              V-LENGTH  1195 characters; at most 600
  description.nl              V-LINES   24 estimated lines; at most 8
  description.nl              V-LENGTH  1394 characters; at most 600
  sources[0].label.en         V-LENGTH  78 characters; at most 60
  sources[0].label.nl         V-LENGTH  79 characters; at most 60

annex-iii-law-enforcement  (6)
  description.en              V-LINES   29 estimated lines; at most 8
  description.en              V-LENGTH  1628 characters; at most 600
  description.nl              V-LINES   32 estimated lines; at most 8
  description.nl              V-LENGTH  1877 characters; at most 600
  sources[1].label.en         V-LENGTH  86 characters; at most 60
  sources[1].label.nl         V-LENGTH  123 characters; at most 60

annex-iii-migration-and-borders  (6)
  description.en              V-LINES   24 estimated lines; at most 8
  description.en              V-LENGTH  1485 characters; at most 600
  description.nl              V-LINES   30 estimated lines; at most 8
  description.nl              V-LENGTH  1752 characters; at most 600
  sources[0].label.en         V-LENGTH  75 characters; at most 60
  sources[0].label.nl         V-LENGTH  79 characters; at most 60

article-50-deep-fakes  (4)
  description.en              V-LINES   27 estimated lines; at most 8
  description.en              V-LENGTH  1401 characters; at most 600
  description.nl              V-LINES   29 estimated lines; at most 8
  description.nl              V-LENGTH  1594 characters; at most 600

article-50-direct-interaction  (5)
  title.nl                    V-LENGTH  81 characters; at most 80
  description.en              V-LINES   23 estimated lines; at most 8
  description.en              V-LENGTH  1151 characters; at most 600
  description.nl              V-LINES   26 estimated lines; at most 8
  description.nl              V-LENGTH  1258 characters; at most 600

article-50-emotion-and-biometric  (8)
  title.en                    V-LENGTH  84 characters; at most 80
  title.nl                    V-LENGTH  110 characters; at most 80
  description.en              V-LINES   31 estimated lines; at most 8
  description.en              V-LENGTH  1711 characters; at most 600
  description.nl              V-LINES   36 estimated lines; at most 8
  description.nl              V-LENGTH  1968 characters; at most 600
  sources[1].label.en         V-LENGTH  88 characters; at most 60
  sources[1].label.nl         V-LENGTH  106 characters; at most 60

article-50-generated-text  (5)
  title.nl                    V-LENGTH  127 characters; at most 80
  description.en              V-LINES   28 estimated lines; at most 8
  description.en              V-LENGTH  1419 characters; at most 600
  description.nl              V-LINES   30 estimated lines; at most 8
  description.nl              V-LENGTH  1592 characters; at most 600

article-50-synthetic-content  (8)
  title.en                    V-LENGTH  85 characters; at most 80
  title.nl                    V-LENGTH  99 characters; at most 80
  description.en              V-LINES   30 estimated lines; at most 8
  description.en              V-LENGTH  1483 characters; at most 600
  description.nl              V-LINES   32 estimated lines; at most 8
  description.nl              V-LENGTH  1694 characters; at most 600
  sources[1].label.en         V-LENGTH  77 characters; at most 60
  sources[1].label.nl         V-LENGTH  104 characters; at most 60

biometric-categorisation  (7)
  title.en                    V-LENGTH  89 characters; at most 80
  title.nl                    V-LENGTH  110 characters; at most 80
  description.en              V-LINES   23 estimated lines; at most 8
  description.en              V-LENGTH  1208 characters; at most 600
  description.nl              V-LINES   26 estimated lines; at most 8
  description.nl              V-LENGTH  1409 characters; at most 600
  sources[1].label.nl         V-LENGTH  77 characters; at most 60

child-sexual-abuse-material  (7)
  description.en              V-LINES   20 estimated lines; at most 8
  description.en              V-LENGTH  1036 characters; at most 600
  description.nl              V-LINES   23 estimated lines; at most 8
  description.nl              V-LENGTH  1188 characters; at most 600
  sources[0].label.nl         V-LENGTH  70 characters; at most 60
  sources[1].label.en         V-LENGTH  76 characters; at most 60
  sources[1].label.nl         V-LENGTH  81 characters; at most 60

emotion-recognition-at-work  (5)
  description.en              V-LINES   25 estimated lines; at most 8
  description.en              V-LENGTH  1208 characters; at most 600
  description.nl              V-LINES   28 estimated lines; at most 8
  description.nl              V-LENGTH  1421 characters; at most 600
  sources[1].label.nl         V-LENGTH  75 characters; at most 60

end-of-walk  (6)
  description.en              V-LINES   34 estimated lines; at most 8
  description.en              V-LENGTH  1866 characters; at most 600
  description.nl              V-LINES   38 estimated lines; at most 8
  description.nl              V-LENGTH  2132 characters; at most 600
  sources[1].label.en         V-LENGTH  69 characters; at most 60
  sources[1].label.nl         V-LENGTH  83 characters; at most 60

exclusion-national-security  (5)
  title.nl                    V-LENGTH  89 characters; at most 80
  description.en              V-LINES   17 estimated lines; at most 8
  description.en              V-LENGTH  929 characters; at most 600
  description.nl              V-LINES   20 estimated lines; at most 8
  description.nl              V-LENGTH  1090 characters; at most 600

exclusion-open-source  (5)
  title.nl                    V-LENGTH  102 characters; at most 80
  description.en              V-LINES   15 estimated lines; at most 8
  description.en              V-LENGTH  734 characters; at most 600
  description.nl              V-LINES   17 estimated lines; at most 8
  description.nl              V-LENGTH  872 characters; at most 600

exclusion-personal-use  (5)
  title.en                    V-LENGTH  96 characters; at most 80
  title.nl                    V-LENGTH  131 characters; at most 80
  description.en              V-LINES   13 estimated lines; at most 8
  description.nl              V-LINES   14 estimated lines; at most 8
  description.nl              V-LENGTH  667 characters; at most 600

exclusion-research-and-development  (5)
  title.nl                    V-LENGTH  95 characters; at most 80
  description.en              V-LINES   16 estimated lines; at most 8
  description.en              V-LENGTH  715 characters; at most 600
  description.nl              V-LINES   19 estimated lines; at most 8
  description.nl              V-LENGTH  838 characters; at most 600

exclusion-scientific-research  (6)
  title.en                    V-LENGTH  90 characters; at most 80
  title.nl                    V-LENGTH  111 characters; at most 80
  description.en              V-LINES   15 estimated lines; at most 8
  description.en              V-LENGTH  782 characters; at most 600
  description.nl              V-LINES   16 estimated lines; at most 8
  description.nl              V-LENGTH  899 characters; at most 600

exclusion-third-country-authorities  (6)
  title.en                    V-LENGTH  88 characters; at most 80
  title.nl                    V-LENGTH  112 characters; at most 80
  description.en              V-LINES   11 estimated lines; at most 8
  description.en              V-LENGTH  603 characters; at most 600
  description.nl              V-LINES   12 estimated lines; at most 8
  description.nl              V-LENGTH  685 characters; at most 600

exploiting-vulnerabilities  (5)
  title.nl                    V-LENGTH  95 characters; at most 80
  description.en              V-LINES   21 estimated lines; at most 8
  description.en              V-LENGTH  1044 characters; at most 600
  description.nl              V-LINES   23 estimated lines; at most 8
  description.nl              V-LENGTH  1220 characters; at most 600

general-purpose-ai  (10)
  description.en              V-LINES   44 estimated lines; at most 8
  description.en              V-LENGTH  2542 characters; at most 600
  description.nl              V-LINES   51 estimated lines; at most 8
  description.nl              V-LENGTH  3103 characters; at most 600
  sources[0].label.en         V-LENGTH  74 characters; at most 60
  sources[0].label.nl         V-LENGTH  96 characters; at most 60
  sources[1].label.en         V-LENGTH  82 characters; at most 60
  sources[1].label.nl         V-LENGTH  104 characters; at most 60
  sources[2].label.en         V-LENGTH  74 characters; at most 60
  sources[2].label.nl         V-LENGTH  99 characters; at most 60

high-risk  (10)
  description.en              V-LINES   38 estimated lines; at most 8
  description.en              V-LENGTH  2288 characters; at most 600
  description.nl              V-LINES   45 estimated lines; at most 8
  description.nl              V-LENGTH  2777 characters; at most 600
  sources[0].label.en         V-LENGTH  64 characters; at most 60
  sources[0].label.nl         V-LENGTH  83 characters; at most 60
  sources[1].label.en         V-LENGTH  68 characters; at most 60
  sources[1].label.nl         V-LENGTH  109 characters; at most 60
  sources[2].label.en         V-LENGTH  64 characters; at most 60
  sources[2].label.nl         V-LENGTH  86 characters; at most 60

non-consensual-sexual-imagery  (9)
  title.en                    V-LENGTH  86 characters; at most 80
  title.nl                    V-LENGTH  105 characters; at most 80
  description.en              V-LINES   28 estimated lines; at most 8
  description.en              V-LENGTH  1574 characters; at most 600
  description.nl              V-LINES   32 estimated lines; at most 8
  description.nl              V-LENGTH  1828 characters; at most 600
  sources[0].label.nl         V-LENGTH  81 characters; at most 60
  sources[1].label.en         V-LENGTH  76 characters; at most 60
  sources[1].label.nl         V-LENGTH  81 characters; at most 60

not-an-ai-system  (6)
  description.en              V-LINES   25 estimated lines; at most 8
  description.en              V-LENGTH  1270 characters; at most 600
  description.nl              V-LINES   28 estimated lines; at most 8
  description.nl              V-LENGTH  1560 characters; at most 600
  sources[1].label.en         V-LENGTH  85 characters; at most 60
  sources[1].label.nl         V-LENGTH  100 characters; at most 60

predicting-criminal-offences  (5)
  title.nl                    V-LENGTH  102 characters; at most 80
  description.en              V-LINES   16 estimated lines; at most 8
  description.en              V-LENGTH  940 characters; at most 600
  description.nl              V-LINES   20 estimated lines; at most 8
  description.nl              V-LENGTH  1126 characters; at most 600

prohibited-practices  (22)
  description.en              V-LINES   19 estimated lines; at most 8
  description.en              V-LENGTH  926 characters; at most 600
  description.nl              V-LINES   22 estimated lines; at most 8
  description.nl              V-LENGTH  1147 characters; at most 600
  sources[1].label.en         V-LENGTH  86 characters; at most 60
  sources[1].label.nl         V-LENGTH  101 characters; at most 60
  options                     V-COUNT   10 entries; at most 8
  options[0].title.en         V-LENGTH  61 characters; at most 60
  options[0].title.nl         V-LENGTH  63 characters; at most 60
  options[1].title.en         V-LENGTH  79 characters; at most 60
  options[1].title.nl         V-LENGTH  95 characters; at most 60
  options[2].title.en         V-LENGTH  86 characters; at most 60
  options[2].title.nl         V-LENGTH  105 characters; at most 60
  options[3].title.nl         V-LENGTH  74 characters; at most 60
  options[5].title.en         V-LENGTH  71 characters; at most 60
  options[5].title.nl         V-LENGTH  102 characters; at most 60
  options[6].title.en         V-LENGTH  74 characters; at most 60
  options[6].title.nl         V-LENGTH  96 characters; at most 60
  options[8].title.en         V-LENGTH  89 characters; at most 60
  options[8].title.nl         V-LENGTH  110 characters; at most 60
  options[9].title.en         V-LENGTH  91 characters; at most 60
  options[9].title.nl         V-LENGTH  105 characters; at most 60

prohibited  (6)
  description.en              V-LINES   28 estimated lines; at most 8
  description.en              V-LENGTH  1485 characters; at most 600
  description.nl              V-LINES   31 estimated lines; at most 8
  description.nl              V-LENGTH  1793 characters; at most 600
  sources[1].label.en         V-LENGTH  69 characters; at most 60
  sources[1].label.nl         V-LENGTH  109 characters; at most 60

real-time-biometric-identification  (9)
  title.en                    V-LENGTH  91 characters; at most 80
  title.nl                    V-LENGTH  105 characters; at most 80
  description.en              V-LINES   32 estimated lines; at most 8
  description.en              V-LENGTH  1833 characters; at most 600
  description.nl              V-LINES   37 estimated lines; at most 8
  description.nl              V-LENGTH  2034 characters; at most 600
  sources[0].label.nl         V-LENGTH  77 characters; at most 60
  sources[1].label.en         V-LENGTH  107 characters; at most 60
  sources[1].label.nl         V-LENGTH  114 characters; at most 60

social-scoring  (4)
  description.en              V-LINES   22 estimated lines; at most 8
  description.en              V-LENGTH  1227 characters; at most 600
  description.nl              V-LINES   25 estimated lines; at most 8
  description.nl              V-LENGTH  1362 characters; at most 600

subliminal-or-manipulative-techniques  (4)
  description.en              V-LINES   23 estimated lines; at most 8
  description.en              V-LENGTH  1078 characters; at most 600
  description.nl              V-LINES   22 estimated lines; at most 8
  description.nl              V-LENGTH  1149 characters; at most 600

transparency-obligations  (13)
  description.en              V-LINES   23 estimated lines; at most 8
  description.en              V-LENGTH  1240 characters; at most 600
  description.nl              V-LINES   26 estimated lines; at most 8
  description.nl              V-LENGTH  1426 characters; at most 600
  sources[0].label.en         V-LENGTH  94 characters; at most 60
  sources[0].label.nl         V-LENGTH  126 characters; at most 60
  options[0].title.nl         V-LENGTH  63 characters; at most 60
  options[1].title.en         V-LENGTH  70 characters; at most 60
  options[1].title.nl         V-LENGTH  81 characters; at most 60
  options[2].title.en         V-LENGTH  69 characters; at most 60
  options[2].title.nl         V-LENGTH  92 characters; at most 60
  options[4].title.en         V-LENGTH  62 characters; at most 60
  options[4].title.nl         V-LENGTH  109 characters; at most 60

untargeted-facial-scraping  (5)
  title.nl                    V-LENGTH  96 characters; at most 80
  description.en              V-LINES   13 estimated lines; at most 8
  description.en              V-LENGTH  618 characters; at most 600
  description.nl              V-LINES   13 estimated lines; at most 8
  description.nl              V-LENGTH  671 characters; at most 600
```
