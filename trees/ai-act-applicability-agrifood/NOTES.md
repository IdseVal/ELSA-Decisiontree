# Notes for the owner: how this Tree is organised and how to edit it

This Tree is **version 0.2**. It was prepared by the project's agents from the research in
`docs/research/issue-3-ai-act-applicability.md` so that you can see the working tool with
real content and correct it by hand. **Nothing here has had legal review.** That review is
yours, and it is deliberately not enforced by any code (core document, section 3.3).

Version 0.2 is the same content as 0.1, re-cut to the length limits of `elsa-tree/2` so
that no Node scrolls (issue #44): the long steps became sequences of short ones, and the
explanations lost words, not entries. Section 10 records what that cut did, and where it
compressed hard enough that you should read twice.

The loader ignores this file, so you can write anything in it.

## 1. Where the files are

```
trees/ai-act-applicability-agrifood/
  tree.yaml          the WHOLE Tree: the manifest, then one document per Node
  NOTES.md           this file (ignored by the loader)
  images/            the 35 pictures the Nodes and Options show, with their credits
  theme/             the lab's look: the logo, the tab icon, the fonts and their licence
```

The `images/` folder holds the 35 pictures of section 6. The `theme/` folder holds what the
manifest's `theme:` block names -- the ELSA-Lab logo, the favicon and three Open Sans
files, downloaded from ai4sfs.org by issue #40 -- plus `LICENCE.md`, which states the
terms of each and carries the three questions about the logo that only the owner can
answer. Changing a colour in `theme:` and restarting the server changes the page; no code
knows any of these values. There is no `nodes/` folder any more:
`elsa-tree/2` (issue #37) puts the whole Tree in one file, and issue #39 converted it.
Inside `tree.yaml` a Node begins at a line `--- # <node-id>` followed by `id: <node-id>`,
so searching for `--- #` lists every Node in order, and searching for `# social-scoring`
lands on that Node. Everything else about a Node is exactly what its old file held.

**This Tree loads.** `npm run validate trees/ai-act-applicability-agrifood` prints
`valid`, and `npm run test:first-tree` walks it in a browser. The development default of
`next dev` is still `trees/ai-act-example` (`.env.development`); point `ELSA_TREE` at this
Tree to see this one instead.

The full file format is `docs/specs/tree-format.md`. Everything below is a short guide to
this Tree in particular; the spec is the contract.

## 2. The six steps, and which Node is which

The walk starts at the Node `start` (the manifest's `root`) and runs through **18 question
Nodes** to one of four Terminals. Three of the six steps span several Nodes since issue
#44, because their text or their list of Options did not fit on one: step 1 is the seven
categories of Article 2(1), one per Node, plus a Node for the exclusions; step 3 is two
Nodes; step 4a is three. The six steps and their order are unchanged.

| Step | Question Node | yes | no |
|---|---|---|---|
| 1. Scope, provider (Art. 2(1)) | `start` | the exclusions | step 1 (2/7) |
| 1. Scope, deployer | `jurisdiction-deployer` | the exclusions | step 1 (3/7) |
| 1. Scope, third-country output | `jurisdiction-third-country-output` | the exclusions | step 1 (4/7) |
| 1. Scope, importer or distributor | `jurisdiction-importer-distributor` | the exclusions | step 1 (5/7) |
| 1. Scope, product manufacturer | `jurisdiction-product-manufacturer` | the exclusions | step 1 (6/7) |
| 1. Scope, authorised representative | `jurisdiction-authorised-representative` | the exclusions | step 1 (7/7) |
| 1. Scope, affected person | `jurisdiction-affected-person` | the exclusions | `ai-act-does-not-apply` |
| 1. The Article 2 exclusions | `article-2-exclusions` | `ai-act-does-not-apply` | step 2 |
| 2. Material scope (Art. 3(1)) | `ai-system-definition` | step 3 | `not-an-ai-system` |
| 3. Prohibited practices (Art. 5), 1/2 | `prohibited-practices` | `prohibited` | step 3 (2/2) |
| 3. Prohibited practices, 2/2 | `prohibited-practices-2` | `prohibited` | step 4a |
| 4a. High-risk, Annex I (Art. 6(1)), 1/3 | `annex-i-legislation` | step 4c | step 4a (2/3) |
| 4a. High-risk, Annex I, 2/3 | `annex-i-legislation-2` | step 4c | step 4a (3/3) |
| 4a. High-risk, Annex I, 3/3 | `annex-i-legislation-3` | step 4c | step 4b |
| 4b. High-risk, Annex III (Art. 6(2)) | `annex-iii-areas` | step 4c | step 5 |
| 4c. The high-risk finding | `high-risk` | step 5 | step 5 |
| 5. General-purpose AI (Ch. V) | `general-purpose-ai` | step 6 | step 6 |
| 6. Transparency (Art. 50) | `transparency-obligations` | `end-of-walk` | `end-of-walk` |

**Step 1 is one question asked seven times, then the exclusions.** A **yes** on any of the
seven means the Act reaches you, and goes to the exclusions Node, where the six Article 2
exclusions live as Options; a **no** asks about the next category. On the exclusions Node
a **yes** -- a *full* exclusion covers your system -- ends at `ai-act-does-not-apply`, and
a **no** goes on to step 2. A **no** on the seventh category means none of the seven
describes you, and ends at `ai-act-does-not-apply` without showing the exclusions: for a
reader the Act does not reach they change nothing. (Your answer on PR #53: in the first
cut the exclusions sat only behind that seventh **no**, so a defence or sole-research
provider in scope never met them and was walked on to a high-risk or Article 50 finding.)
The exclusions Node carries no counter: it is not an eighth category. The counter in the
other titles ("(1/7)" ... "(7/7)") is what the format asks for on a step spread over
several Nodes (`docs/specs/tree-format.md` 5.8); the same counter marks steps 3 and 4a.

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

A Node carries at most 8 Options (`docs/specs/tree-format.md` 5.7), so a list longer than
that runs over the steps of its question and the count is the sum across them:

| List | Node(s) holding the list | Entries | Id prefix |
|---|---|---|---|
| Article 2 exclusions | `article-2-exclusions` | 6 | `exclusion-` |
| Article 5(1) prohibited practices | `prohibited-practices` (5), `prohibited-practices-2` (5) | 10 | (named per practice) |
| Annex I legislation | `annex-i-legislation` (8), `-2` (7), `-3` (5) | 20 | `annex-i-` |
| Annex III high-risk areas | `annex-iii-areas` | 8 | `annex-iii-` |
| Article 50 situations | `transparency-obligations` | 5 | `article-50-` |

Each count is the count issue #3 measured in the Act itself, and issue #44 changed none of
them: it moved entries between steps and shortened their text. The Annex I entries keep
the Annex's own order across the three steps - points 2 to 9, then 10 to 16, then 17 to 21
- and the 11 Section A / 9 Section B split is untouched. `tests/ai-act-tree.test.ts` fails
if a list and its count drift apart, so if you add or remove an entry on purpose, update
that test in the same commit.

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
- **Quote the version.** `version: "0.2"`, with the quotes. Unquoted it is a number and is
  rejected.
- **Titles are one line.** `title`, Option titles and Source labels take no line breaks.
- **Everything has a maximum length now**, because nothing on the page may scroll: 80
  characters for a title, 600 for a description (and at most 8 rendered lines), 60 for an
  Option title or a Source label, 3 Sources, 8 Options. The validator names the actual
  length and the maximum. This Tree now fits inside all of them with very little room to
  spare (section 10), so a sentence you add has to buy its space from another.
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

## 6. The images, and how to replace one

This Tree carries **35 pictures**, in `images/`. The core document (section 6) says you
download them and place them yourself; you asked in issue #35 where they were, so issue
#45 sourced them instead, under the rule recorded as open item **10.24**: every picture is
**openly licensed** -- public domain, CC0, CC BY or CC BY-SA -- and **you may replace any
of them at any time**. Nothing about them is legal content; they are there so the tool
looks like a tool.

Where they hang:

- **20** on the Options of the three `annex-i-legislation` steps -- one per piece of
  Annex I legislation, showing what kind of product it covers (core document 3.3, 4a);
- **8** on the Options of `annex-iii-areas` -- one per high-risk area (3.3, 4b);
- **7** on the step Nodes themselves: `start`, `ai-system-definition`,
  `prohibited-practices`, `annex-i-legislation`, `annex-iii-areas`, `general-purpose-ai`
  and `transparency-obligations`. That is seven pictures for six steps because step 4 is
  asked twice, once down each route, and each entry Node carries its own.

Nothing else has a picture. The explanation Nodes, the Terminals and the seven
jurisdiction sub-steps have none: 49 more pictures would be a second sourcing job with a
worse fit, and a Terminal reads better without one.

**How they were prepared.** Each file is the **500-pixel-wide rendering** Wikimedia
Commons serves of the original, downloaded once and committed; nothing is fetched from
Commons, or from anywhere else, while the app runs (core document 7 and 9). 500 pixels
because the Carousel shows a thumbnail 136 pixels wide and the enlarged view is bounded by
the viewport, so a wider file would cost the reader bytes it never shows. The result is
**35 files, 1.9 MB in total, none over 120 KB**; the heaviest Node in the Tree
(`annex-i-legislation`: its own picture and eight Options) asks for **9 files, 457 KB**.

**To replace one**, put your file in `images/` with a lowercase name and no spaces and
point the `images:` entry at it:

```yaml
images:
  - file: annex-i-tractor.jpg
    description:                        # at most 120 characters, both languages
      en: A tractor with an automated steering system
      nl: Een trekker met een automatisch stuursysteem
    credit: "Name, via where you got it, CC BY 4.0"
    source: anx-i                       # optional: the id of a Source on the same Node
```

`credit` is required on every image without exception, and it is shown to the reader as
you write it. The `description` is the Carousel's caption and the alternative text a
screen reader speaks, so write what the picture *shows*. Delete the whole `images:` list
to leave a Node or an Option without a picture; an unused file in `images/` is not an
error.

**The `source:` pointer.** Where a picture illustrates a legal Source the Node already
cites, it names that Source's id: the step pictures point at the provision the step asks
about (`art-2-1`, `art-3-1`, `art-5`, `art-6-1`, `art-6-2`, `art-3-63`, `art-50`), the
Annex III pictures at `anx-iii`, and the Annex I pictures at `anx-i` -- except on step
**2/3** of the Annex I list, which cites Article 3(14) and Article 6(1a) to (1c) rather
than Annex I itself. Those seven Options carry no `source`, because the format only allows
an Image to point at a Source on its own Node, and adding a Source to that Node would have
been a content change this issue was not asked to make.

### Where every picture came from

Author, licence and page as Wikimedia Commons states them. The credit in `tree.yaml` is
`<author>, via Wikimedia Commons, <licence>`.

| File | What it illustrates | Author | Licence | Source page |
|---|---|---|---|---|
| `toys.jpg` | Annex I: safety of toys | Gausanchennai | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Wooden_toy_models.jpg |
| `recreational-craft.jpg` | Annex I: recreational craft | Pjotr Mahhonin | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Akka_Sailing_Yacht_leaving_Old_City_Marina_Tallinn_24_July_2017.jpg |
| `lifts.jpg` | Annex I: lifts | Edward Orde | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Destination_control_elevator_interior_2.jpg |
| `explosive-atmospheres.jpg` | Annex I: equipment for explosive atmospheres | TheTechnician27 | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Gifford,_IL_silo_and_grain_elevator.jpg |
| `radio-equipment.jpg` | Annex I: radio equipment | USDAgov | public domain | https://commons.wikimedia.org/wiki/File:Drought_Mitigation_-_Reiter_Berry_Farms_-_Wireless_Irrigation_monitoring_Network_(20150827-NRCS-LSC-0258).jpg |
| `pressure-equipment.jpg` | Annex I: pressure equipment | Exit2dos2000 | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Pressure_Vessel.jpg |
| `cableway-installations.jpg` | Annex I: cableway installations | Yamen | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:First_cable_Car_to_Vogel_Ski_Resort.jpg |
| `personal-protective-equipment.jpg` | Annex I: personal protective equipment | Protectepi | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Standard_PPE.jpg |
| `gas-appliances.jpg` | Annex I: appliances burning gaseous fuels | Oleg Bor | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Gas_boiler_at_school._Buryatia,_Russia.jpg |
| `medical-devices.jpg` | Annex I: medical devices | DiverDave | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:PCA-01.JPG |
| `ivd-medical-devices.jpg` | Annex I: in vitro diagnostic medical devices | Goleisureintl | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Clinical_Pathology_Blood_Testing_Laboratory_in_Navi_Mumbai,_India.jpg |
| `civil-aviation-security.jpg` | Annex I: civil aviation security | Michael Ball | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Transportation_Security_Administration_Checkpoint_at_John_Glenn_Columbus_International_Airport.jpg |
| `two-or-three-wheel-vehicles.jpg` | Annex I: two- or three-wheel vehicles and quadricycles | Norbert Nagel | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:ATV_-_Quad_-_SYM_Quadlander_200_-_Santorini_-_Greece_-_01.jpg |
| `agricultural-vehicles.jpg` | Annex I: agricultural and forestry vehicles | Petar Milošević | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Tractor_New_Holland_T6.165_plowing_(Zadobrova,_Ljubljana).jpg |
| `marine-equipment.jpg` | Annex I: marine equipment | Christian Ferrer | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Gulls_over_a_fishing_trawler,_S%C3%A8te_01.jpg |
| `rail-interoperability.jpg` | Annex I: interoperability of the rail system | Philip Mallis | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Siemens_train_772M_departing_Platform_2_at_Sunshine_Railway_Station_running_a_Down_service_to_Sunbury.jpg |
| `motor-vehicle-approval.jpg` | Annex I: approval of motor vehicles and their trailers | TCExplorer | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:M%C3%BCller_milk_tanker_in_Longnor_-_geograph.org.uk_-_7919111.jpg |
| `motor-vehicle-general-safety.jpg` | Annex I: type-approval of motor vehicles, general safety | Hans Haase | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Verkehrszeichenerkennung_IMG_6859.JPG |
| `unmanned-aircraft.jpg` | Annex I: civil aviation, unmanned aircraft | Shreesha Sharma | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Agricultural_drone_spraying_on_paddy_field.jpg |
| `machinery.jpg` | Annex I: machinery | .Anja. | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Cow_in_milking_robot_01.jpg |
| `biometrics.jpg` | Annex III 1: biometrics | Patrick H~ | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Fraunhofer_-_Face_Detection_-_4406340595.jpg |
| `critical-infrastructure.jpg` | Annex III 2: critical infrastructure | Matthew T Rader | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Transmission_towers_at_sunset_in_East_Texas.jpg |
| `education.jpg` | Annex III 3: education and vocational training | Michael Surran | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Students_taking_computerized_exam.jpg |
| `employment.jpg` | Annex III 4: employment and workers management | USDAgov | public domain | https://commons.wikimedia.org/wiki/File:Lewis_Taylor_Farms_seven_months_after_Hurricane_Michael_(20190507-OSEC-LSC-0555).jpg |
| `essential-services.jpg` | Annex III 5: essential private and public services | Raymond Wambsgans | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Cleveland_Ohio_Emergency_medical_Service_International_Ambulance_(14014739819).jpg |
| `law-enforcement.jpg` | Annex III 6: law enforcement | Maksim Sokolov | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Three_Toronto_police_officers.jpg |
| `migration-and-borders.jpg` | Annex III 7: migration, asylum and border control | PESP / Bonus bon | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Zurich_International_Airport_e-Passport_control_gates.jpg |
| `justice-and-democracy.jpg` | Annex III 8: administration of justice and democratic processes | Michael D Beckwith | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Beverley_Guildhall_Courtroom.jpg |
| `step-jurisdiction.jpg` | Step 1: jurisdictional scope | Ssolbergj and Moonraker | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Member_States_of_the_European_Union_(polar_stereographic_projection)_2020_EN.jpg |
| `step-ai-system.jpg` | Step 2: is it an AI system | Max Gruber | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Ceci_n%27est_pas_une_banane_by_Max_Gruber.jpg |
| `step-prohibited-practices.jpg` | Step 3: prohibited practices | Tiia Monto | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Prohibition_signs_in_Prague.jpg |
| `step-annex-i.jpg` | Step 4a: the Annex I route | Shixart1985 | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Emergency_stop_button_on_a_control_panel_in_a_factory.jpg |
| `step-annex-iii.jpg` | Step 4b: the Annex III route | Olga Ernst | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:High_Risk_Accident_Zone,_B2_road_Namibia.jpg |
| `step-general-purpose-ai.jpg` | Step 5: general-purpose AI | Derrick Coetzee | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Technician_with_laptop_working_on_server_rack_at_NERSC.jpg |
| `step-transparency.jpg` | Step 6: transparency obligations | piqsels | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Piqsels.com-id-zbxec.jpg |

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
    Terminal, which fails five older tests (the six-step chain, the 18/4/49 kind counts,
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

## 10. What issue #44 cut, and where to read twice

`elsa-tree/2` gives every text a maximum length, because nothing on the page may scroll
(`docs/specs/tree-format.md` 5.7). This Tree was written before those limits existed, so
issue #39 converted it faithfully -- not one word was shortened -- and the validator
counted **454 violations**: 327 texts over their maximum, 124 descriptions over 8 rendered
lines, and 3 lists over their maximum -- two lists of Options and one Node citing four
Sources. Issue #44 is that cut, and the count is now **0**. Reproduce it at any time with:

```
npm run validate trees/ai-act-applicability-agrifood
```

### What the cut did, in numbers

| | 0.1 | 0.2 |
|---|---|---|
| validator violations | 454 | 0 |
| Nodes | 61 | 71 |
| question / Terminal / explanation Nodes | 8 / 4 / 49 | 18 / 4 / 49 |
| description characters, en and nl together | 169,342 | 60,885 |
| longest single description | 3,104 (`general-purpose-ai`, nl) | 584 (`annex-iii-areas`, nl) |
| distinct legal Sources cited | 33 | 33 |

Ten Nodes were added and none was removed: the six jurisdiction Nodes after `start` and
the exclusions Node of step 1, the second prohibited-practices step, and the second and
third Annex I steps.

### What the cut did not touch

- **The entries and their counts.** 6 exclusions, 10 prohibited practices, 20 Annex I
  entries (11 Section A, 9 Section B), 8 Annex III areas covering 25 listed system types,
  5 Article 50 situations -- the numbers issue #3 measured in the Act. Long lists were
  spread over the steps of their question, never trimmed.
- **The Sources.** The same 33 legal URLs are cited, no URL was added, and no Source of a
  kind the research does not provide was introduced. Where a Node was over the limit of 3
  Sources, they moved instead of going: `annex-i-legislation` had four, and Article 3 now
  sits on step 2/3 and Article 2 on step 3/3 of that same list.
- **The two sentences issue #26 deliberately left contradicting each other** (section 8).
  Both survive the cut word for word, and the test that pins them still passes.

### Where the text lost content, and not only words

Shortening prose by two thirds does not happen by tightening sentences alone. These are
the places where a statement went, rather than a phrase -- each traces to the same Source
as before, and none says anything the 0.1 text did not, but you are the one who decides
whether the remainder is still the right thing to tell a reader. Measured against 0.1, 45
of its 61 Nodes lost 60% or more of their English text; the list names every Node where
that took a statement with it, as far as a side-by-side reading of the two versions shows.

- **`general-purpose-ai`** (2,543 to 508 characters of English, 80% off). The verbatim
  Article 3(63) and 3(66) definitions are paraphrases now. Gone: the systemic-risk
  presumption of Article 51(2) (cumulative training compute above 10^25 floating point
  operations), the downstream-provider definition of Article 3(68), the Chapter V
  application dates (Article 111(3)) and the paragraph telling the reader when to answer
  yes. The Node is still marked `placeholder: true` for the split section 8 describes.
- **`high-risk`** (2,289 to 494, 78% off). Gone: Article 111(2) on systems already on the
  market, with its 2 August 2030 date for systems used by public authorities; the reminder
  that an Article 6(3) assessment must be documented and registered under Article 49(2);
  and the paragraph saying the Chapter III obligations are out of this version's scope
  (section 8 says it here instead). Its third Source is Article 2(2), the article the
  surviving Section B sentence quotes; Article 111(2) is still cited on
  `article-50-synthetic-content`.
- **`annex-iii-areas`** (2,414 to 579, 76% off). The four Article 6(3) conditions are four
  phrases in one sentence rather than four bullets with their qualifiers, and the sentence
  says that **any** one of them is enough, as 0.1 did (restored on PR #53); the profiling
  override and the Article 6(4) duty to document keep their own sentences, but the duty to
  provide that documentation to national competent authorities on request is gone.
- **`ai-system-definition`** (1,931 to 521, 73% off). The verbatim Article 3(1) definition
  is a paraphrase, and the element-by-element reading of Recital 12 is one sentence naming
  the distinguishing element: as Recital 12 says, the *definition* does not cover systems
  based on rules defined solely by natural persons.
- **`annex-i-legislation`** (2,464 to 493, 80% off) is the one that only looks severe: its
  content moved along the list rather than going. The safety-component definition and
  Articles 6(1a) to (1c) are on step 2/3, and the Section A / Section B split, the Article
  2(2) limit and the deletion of the Machinery Directive on step 3/3.
- **The 20 Annex I entry Nodes** each lost about three quarters of their text (for example
  `annex-i-toys`, 935 to 231) for two reasons. Every one of them repeated the two
  conditions of Article 6(1), and the 11 Section A entries each repeated that Article
  2(13) lets the Commission limit Articles 9 to 15 and 17 to 25 for them by delegated act.
  Both are now said once, on `annex-i-legislation`, the step that lists the Section A
  entries: the two conditions, and Article 2(13) with its own Source. (The first cut of
  #44 dropped Article 2(13) from the Tree altogether; your answer on PR #53 brought it back
  there.) Each entry says what its legislation covers and what it means for agrifood.
- **`transparency-obligations`** (1,241 to 452, 64% off). Gone: the Article 111(4)
  transitional period, until 2 December 2026, for Article 50(2) systems placed on the
  market before 2 August 2026; the applicable accessibility requirements Article 50(5) sets
  for the information; and that Article 50(6) is without prejudice to other transparency
  obligations in Union or national law.
- **`prohibited`** (1,486 to 483, 68% off). The three checks before relying on the outcome
  are one sentence without their content: the carve-outs of points (d), (f) and (g) and the
  narrowing of points (ba) and (bb) by Article 5(1a) and (1b) are gone, and so are the
  application dates and Article 5(8). The dates are still on `prohibited-practices`, and
  Article 5(8) on `prohibited-practices-2`.
- **`end-of-walk`** (1,867 to 497, 73% off). Gone: *"its content has not been through
  legal review"* (the page still says "not legal advice" on every Node, and section 1 of
  this file says there was no legal review); the advice to walk the Tree again after a
  significant change to the system; and the named list of what the Tree does not cover,
  which is one phrase now.
- **`not-an-ai-system`** (1,271 to 503, 60% off). Gone: that Article 2(9) is about systems
  *inside* the Act; plant protection product law and contract law from the list of other
  law worth checking; and the two reasons to come back to this step later (a rule-based
  system may start learning from data, and a system that is not an AI system may be a
  component of a product that is one).
- **Seven Option titles** were narrowed past their entry to fit 60 characters. The Article
  5(1)(h) one has its qualifier back since PR #53 ("Real-time biometric ID in public for
  law enforcement"), because a Branch label must not read as a blanket prohibition. Six
  stay narrowed, and each child Node still carries what its label lost:
  `biometric-categorisation` (political opinions, trade union membership and sexual
  orientation),
  `predicting-criminal-offences` ("or personality traits"), `exclusion-national-security`
  (areas outside the scope of Union law), `exclusion-third-country-authorities` (and
  international organisations), `annex-iii-employment` (access to self-employment) and
  `annex-i-explosive-atmospheres` (and protective systems).
- **Every explanation Node lost its closing line** "This is an explanation only. Go back to
  the previous step to answer." The frontend already says exactly that under a Node with no
  Answers (`src/chrome.ts`, and `docs/adrs/ADR-37-length-limits.md`), so it was the same
  sentence written out 49 times in two languages.

### If you want a sentence back

There is little room left: the longest description is 584 characters of the 600 allowed,
and every Node is inside the 8-line limit. So adding a sentence means taking one out --
or, better, doing what this cut did to the three steps that would not fit: give the step
another numbered Node and carry the counter, `(1/2)`, `(2/2)`, as the format describes
(`docs/specs/tree-format.md` 5.8). `npm run validate` tells you which of the two you are
looking at.
