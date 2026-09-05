# Notes for the owner: how this Tree is organised and how to edit it

This Tree is **version 0.1**. It was prepared by the project's agents from the research in
`docs/research/issue-3-ai-act-applicability.md` so that you can see the working tool with
real content and correct it by hand. **Nothing here has had legal review.** That review is
yours, and it is deliberately not enforced by any code (core document, section 3.3).

The loader ignores this file, so you can write anything in it.

## 1. Where the files are

```
trees/ai-act-applicability-agrifood/
  tree.yaml          the manifest: languages, root Node, title, metadata
  NOTES.md           this file (ignored by the loader)
  nodes/             61 files, one per Node; the file name IS the Node's id
```

There is no `images/` folder yet. See section 6.

The full file format is `docs/specs/tree-format.md`. Everything below is a short guide to
this Tree in particular; the spec is the contract.

## 2. The six steps, and which file is which

The walk starts at `nodes/start.yaml` (the manifest's `root`) and runs through eight
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

The other 49 files are **explanation Nodes**: one per entry in a list. They have no
Answers. A reader opens one, reads it, and goes back through the Trail to answer the
question it hangs under.

| List | Node holding the list | Entries | File name prefix |
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

It prints `valid` or one line per problem: file, key path, rule id, and what is wrong.
The application refuses to start on an invalid Tree, so this is the same check the server
does. `npm test` additionally checks the counts and the shape described above.

Things that will trip you up, in rough order of likelihood:

- **Both languages, always.** Every `title`, `description`, Option `title` and Source
  `label` must have an `en:` and an `nl:`. A half-translated Tree does not load at all;
  there is no fallback for content.
- **Quote the version.** `version: "0.1"`, with the quotes. Unquoted it is a number and is
  rejected.
- **Titles are one line.** `title`, Option titles and Source labels take no line breaks.
  Descriptions can be as long as you like.
- **No unknown keys.** A typo like `anwsers:` is an error, not a silently ignored key. The
  one place you may invent keys is under `metadata:`.
- **`yes` and `no` are the only Answer keys**, and both are required on a question Node.
- **Renaming a file renames the Node.** The file name is the id. If you rename
  `social-scoring.yaml`, every `target:` and Answer pointing at `social-scoring` has to
  change too, and any link anyone has shared to that Node breaks.

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
- **A high-risk system under Annex I, Section B may not carry Article 50 obligations at
  all** - found while deciding issue #24, not fixed. `high-risk`'s own text says that for
  such a system Article 2(2) makes only Article 6(1), Article 60a and Articles 102 to 112
  apply, and Article 50 is not among them. The Tree now sends every high-risk reader into
  the Article 50 step without telling them this. Splitting step 4c by Annex I Section is
  legal authoring and a new branch, which issue #24 put out of scope; it is worth its own
  issue.
- **The Tree cannot be walked by clicking yet.** Every Node is reachable at its own URL and
  the test walks the whole graph, but the page that ships today renders a Node's title and
  description only - no Answers, no Options, no language switch. That is issue #7's work,
  which issue #10 put out of scope. **Issue #23** walks the Tree in the app and re-takes the
  screenshots once #7 has merged.

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
