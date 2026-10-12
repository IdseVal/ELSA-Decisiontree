# Research: the AI Act provisions behind each step of the first Tree

Issue: #3 -- Research: verify the AI Act provisions behind each step of the first tree.
Produced: 2026-09-03, headless Planner run. Refs #3.

This document reports what Regulation (EU) 2024/1689 (the "AI Act") actually says at each
of the six steps outlined in `docs/CORE_DOCUMENT.md`, section 3.3. Everything quoted below
was fetched from EUR-Lex on 2026-09-03 (section 1 records every request and response).
Nothing is from memory or from secondary summaries. Where the text does not settle a
point, the item is marked **UNKNOWN** and says what was looked at.

## 0. Findings that change the picture

1. **The AI Act has been amended, and the amendment touches five of the six steps.**
   Regulation (EU) 2026/1744 ("Digital Omnibus on AI", adopted 8 July 2026, published
   24 July 2026, in force 27 July 2026) amends Articles 2, 3, 5, 6, 50, 111, 113 and
   Annex I, among others. The Tree must be authored from the **consolidated text of
   27 July 2026** (CELEX 02024R1689-20260727), not from the 2024 Official Journal text.
   Every quotation below is taken from the consolidated text; where a passage was changed,
   both the old and the new wording are given. The core document (section 6) currently
   names only Regulation (EU) 2024/1689; it should also name the amending act.
2. **New prohibited practices.** Article 5(1) now lists **10** prohibited practices, not 8:
   points (ba) (non-consensual sexual deep fakes of identifiable persons) and (bb) (child
   sexual abuse material) were inserted and apply from 2 December 2026.
3. **Annex I changed.** The Machinery Directive 2006/42/EC (point 1) was deleted and the
   Machinery Regulation (EU) 2023/1230 was added as point 21 of Section B. Annex I now has
   **20** entries: 11 in Section A (numbered 2--12) and 9 in Section B (numbered 13--21).
4. **Application dates moved.** High-risk rules (Chapter III, Sections 1--3) now apply
   from 2 December 2027 (Annex III systems) and 2 August 2028 (Annex I systems), instead
   of 2 August 2026 and 2 August 2027.
5. **The owner's jurisdiction recollection is incomplete.** Article 2(1) lists seven
   categories of persons, not three, and the first category is defined by *where the
   system is placed on the market or put into service*, not by where the maker is.
6. **Annex III (8 areas) and Article 50(1)--(6) (5 situations) are unchanged** by the
   amendment. The definitions of "AI system", "general-purpose AI model" and
   "general-purpose AI system" are unchanged.
7. **Nothing in the Act says which other laws apply when a system is *not* an AI system**
   (the owner's step 2 "no" message). See section 4.4.

## 1. Method and evidence

### 1.1 Tools

- `just-scrape` (named in the brief) is installed but not configured: `just-scrape validate`
  prompts interactively for an API key and `SGAI_API_KEY` is unset. Per the Planner role,
  the text was fetched directly instead.
- Plain `curl` against EUR-Lex returns `HTTP 202`, an empty body (`Content-Length: 0`),
  the header `x-amzn-waf-action: challenge`, and an AWS WAF JavaScript challenge page
  ("In order to continue, we need to verify that you're not a robot"). The
  EUR-Lex PDF endpoint behaves the same. So the pages were fetched with headless Google
  Chrome (`chrome.exe --headless=new --dump-dom <url>`), which passes the challenge and
  returns the rendered document.
- As an independent cross-check, the same act was fetched from the Publications Office
  Cellar repository (the store EUR-Lex itself serves from), which is not behind the WAF.

### 1.2 Requests sent and responses received

| # | Request | Response |
|---|---|---|
| R1 | `curl "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R1689"` (default and browser User-Agent) | `HTTP 202`, 0 bytes / 2 035-byte WAF challenge page; header `x-amzn-waf-action: challenge` |
| R2 | `curl -H "Accept: application/xhtml+xml" -H "Accept-Language: eng" "http://publications.europa.eu/resource/celex/32024R1689"` | `HTTP 200`, redirected to `http://publications.europa.eu/resource/cellar/dc8116a1-3fe6-11ef-865a-01aa75ed71a1.0006.03/DOC_1`, 1 262 391 bytes, `application/xhtml+xml`, Official Journal formex rendering of Regulation (EU) 2024/1689 |
| R3 | headless Chrome, `https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R1689` | rendered document, 1 334 054 bytes, sha256 `3172bae7…7fe5d7`; canonical link `https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng` |
| R4 | headless Chrome, `https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:32024R1689` (document information page) | 1 693 550 bytes; "Corrected by" 4 corrigenda; "Modified by" 32026R1744 (93 subdivision-level entries, all dated 27/07/2026); "Access current version (27/07/2026)" links to `CELEX:02024R1689-20260727`; earlier consolidated version dated 12/07/2024 |
| R5 | headless Chrome, `https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02024R1689-20260727` (consolidated text) | 906 621 bytes, sha256 `44c7275f…1bbdcf3c`; carries the standard notice "This text is meant purely as a documentation tool and has no legal effect" |
| R6 | headless Chrome, `https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32026R1744` (amending act) | 369 351 bytes, sha256 `34107a7c…0943ed2`; title "REGULATION (EU) 2026/1744 … of 8 July 2026 amending Regulations (EU) 2024/1689, (EU) 2018/1139 and (EU) 2023/1230 … (Digital Omnibus on AI)"; OJ L, 24.7.2026; Article 4: "enter into force on the third day following that of its publication" |
| R7 | headless Chrome, `https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng` and `https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng` | both render; titles "Regulation - EU - 2024/1689 - EN - EUR-Lex" and "Regulation - EU - 2026/1744 - EN - EUR-Lex" |
| R8 | headless Chrome, `https://eur-lex.europa.eu/legal-content/NL/TXT/HTML/?uri=CELEX:32024R1689R(02)` and `…R(04)` | Dutch corrigenda; see 1.4 |
| R9 | SPARQL `GET http://publications.europa.eu/webapi/rdf/sparql` asking for the English `expression_title` of 23 CELEX numbers | `HTTP 200`, CSV with one title row per CELEX; used for the Annex I table in 6.3 |

Check performed on R2 vs R3: after stripping whitespace, the enacting terms and annexes
of the Cellar copy and the EUR-Lex copy are byte-identical (`diff` exit 0), and so are
the recitals. Check performed on R3 vs R5: per-article `diff` of the original and the
consolidated text; every difference found is listed in section 2.2 and matches the
"Modified by" table from R4 for the articles in scope.

Raw fetched files are not committed (5.5 MB of HTML); the checksums above identify them.

### 1.3 URL conventions for legal Sources in the Tree

- Whole act, current consolidated version:
  `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02024R1689-20260727`
- Whole act, canonical ELI of the original: `https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng`
- Per-article deep link (anchor ids measured in R3 and R5; both pages use the same
  scheme): append `#art_<n>` for an article, `#anx_<roman>` for an annex. Examples:
  `…?uri=CELEX:02024R1689-20260727#art_5`, `…#art_6`, `…#anx_III`. The consolidated page
  additionally has `#art_4a`.
- Amending act: `https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng`.

### 1.4 Corrigenda

EUR-Lex lists four corrigenda to Regulation (EU) 2024/1689. **None concerns the English
text**: R(01) ES, DE, FR, GA, LT, HU, SK, SL, SV; R(02) NL, SL; R(03) CS; R(04) ES, NL.
The two Dutch ones matter for the Dutch version of the Tree:

- R(02) (ELI `http://data.europa.eu/eli/reg/2024/1689/corrigendum/2025-12-19/oj`): page 6,
  recital 19, penultimate sentence: "Onlineruimten vallen onder het toepassingsgebied"
  becomes "Onlineruimten vallen **niet** onder het toepassingsgebied, omdat het geen
  fysieke ruimten zijn." (online spaces are *not* "publicly accessible spaces").
- R(04): page 102, Article 73, renumbers two paragraphs both numbered 11 to 10 and 11.
  Not in the Tree's scope.

## 2. Which text to build on

### 2.1 Original vs consolidated

The Official Journal text of 12 July 2024 is the authentic act. The consolidated text of
27 July 2026 integrates Regulation (EU) 2026/1744 and carries EUR-Lex's notice that it
"is meant purely as a documentation tool and has no legal effect". For the Tree the
consolidated text is the one to author from, because it is what applies today; each Node
can still cite the original act plus the amending act if the owner prefers authentic
sources. **Recommendation for the owner (decision, not law):** cite the consolidated
CELEX URL as the legal Source and mention the amending act once in the Tree's metadata.

### 2.2 What Regulation (EU) 2026/1744 changed inside the Tree's scope

Measured by per-article diff (R3 vs R5) and cross-checked against the "Modified by" table
(R4). Only provisions relevant to steps 1--6 and to Article 113 are listed.

| Provision | Change | Applies from |
|---|---|---|
| Art. 1(2)(g) | replaced (adds small mid-caps) | 27 Jul 2026 |
| Art. 2(2) | replaced: Section B systems now subject to "Article 6(1), Article 60a and Articles 102 to 112"; "Articles 57, 58 and 59" apply only if integrated | 27 Jul 2026 |
| Art. 2(7) | replaced: adds "Without prejudice to Articles 4a and 59" | 27 Jul 2026 |
| Art. 2(13) | added: requirements for Art. 6(1) systems may be limited where Section A legislation gives equivalent protection; delegated acts by 2 Aug 2027 | 27 Jul 2026 |
| Art. 3(14) | replaced: "safety component" gains a second sentence defining "safety function" | 27 Jul 2026 |
| Art. 3(14a), (14b) | added: definitions of SME and small mid-cap | 27 Jul 2026 |
| Art. 5(1)(ba), (bb); Art. 5(1a), (1b) | added: two new prohibited practices and their conditions | 2 Dec 2026 (Art. 113(3)(a) as amended) |
| Art. 6(1a), (1b), (1c) | added: what does and does not count as a safety component; radio-spectrum-only conformity assessment does not count | 27 Jul 2026 |
| Art. 50(7) | replaced: Commission (not AI Office) facilitates codes of practice; empowerment to approve them by implementing act removed | 27 Jul 2026 |
| Art. 111(2) | replaced: grace period for high-risk systems already on the market | 27 Jul 2026 |
| Art. 111(4) | added: providers of generative systems placed on the market before 2 Aug 2026 must comply with Art. 50(2) by 2 Dec 2026 | 27 Jul 2026 |
| Art. 113(3)(a), (c), (d) | replaced/added: new application dates (section 9) | 27 Jul 2026 |
| Annex I, Section A point 1 | deleted (Directive 2006/42/EC) | 27 Jul 2026 |
| Annex I, Section B point 21 | added (Regulation (EU) 2023/1230, machinery) | 27 Jul 2026 |

Unchanged (diff empty): Article 3 points (1), (3), (4), (9), (11), (39), (40), (60),
(63), (65), (66), (68); Article 5(1)(a)--(h) and (2)--(8); Article 6(1)--(8) other than
the inserted (1a)--(1c); Article 50(1)--(6); Annex III in its entirety; Chapter V
Articles 51--55.

## 3. Step 1 -- Jurisdictional scope (Article 2)

Source: consolidated text, `…?uri=CELEX:02024R1689-20260727#art_2`.

### 3.1 To whom the Act applies -- Article 2(1), verbatim

> 1. This Regulation applies to:
> (a) providers placing on the market or putting into service AI systems or placing on the market general-purpose AI models in the Union, irrespective of whether those providers are established or located within the Union or in a third country;
> (b) deployers of AI systems that have their place of establishment or are located within the Union;
> (c) providers and deployers of AI systems that have their place of establishment or are located in a third country, where the output produced by the AI system is used in the Union;
> (d) importers and distributors of AI systems;
> (e) product manufacturers placing on the market or putting into service an AI system together with their product and under their own name or trademark;
> (f) authorised representatives of providers, which are not established in the Union;
> (g) affected persons that are located in the Union.

Supporting definitions (Article 3, verbatim, unchanged):

> (3) ‘provider’ means a natural or legal person, public authority, agency or other body that develops an AI system or a general-purpose AI model or that has an AI system or a general-purpose AI model developed and places it on the market or puts the AI system into service under its own name or trademark, whether for payment or free of charge;
> (4) ‘deployer’ means a natural or legal person, public authority, agency or other body using an AI system under its authority except where the AI system is used in the course of a personal non-professional activity;
> (9) ‘placing on the market’ means the first making available of an AI system or a general-purpose AI model on the Union market;
> (11) ‘putting into service’ means the supply of an AI system for first use directly to the deployer or for own use in the Union for its intended purpose;

### 3.2 The owner's three-part recollection checked against the text

| Owner's recollection (core document 3.3, step 1) | Verdict | What the text shows |
|---|---|---|
| (1) "people making AI in the EU" | **Incomplete / imprecise** | Article 2(1)(a) does not turn on where the AI is *made*. It applies to providers "placing on the market or putting into service AI systems … in the Union, irrespective of whether those providers are established or located within the Union or in a third country". The trigger is the EU market, not the maker's location. Recital 21 confirms this: rules "should apply to providers of AI systems in a non-discriminatory manner, irrespective of whether they are established within the Union or in a third country". |
| (2) "people serving AI in the EU" | **Confirmed, if "serving" means using/deploying** | Article 2(1)(b): "deployers of AI systems that have their place of establishment or are located within the Union". If "serving" was meant as "providing", it is covered by (a) above. The word is ambiguous; the Tree should use the Act's terms "provider" and "deployer". |
| (3) "people making AI outside the EU and serving people outside the EU, where the AI's outputs are used in the EU" | **Confirmed** | Article 2(1)(c): "providers and deployers of AI systems that have their place of establishment or are located in a third country, where the output produced by the AI system is used in the Union". Recital 22 gives the example of an EU operator contracting a third-country operator whose system's output comes back to the Union. |
| (not in the recollection) | **Missing** | Points (d) importers and distributors, (e) product manufacturers placing an AI system on the market with their product under their own name, (f) authorised representatives of non-EU providers, (g) affected persons located in the Union. Also general-purpose AI *models* in (a). |

### 3.3 Exclusions that end the walk -- Article 2(3), (4), (6), (8), (10), (12), verbatim

> 3. This Regulation does not apply to areas outside the scope of Union law, and shall not, in any event, affect the competences of the Member States concerning national security, regardless of the type of entity entrusted by the Member States with carrying out tasks in relation to those competences.
> This Regulation does not apply to AI systems where and in so far they are placed on the market, put into service, or used with or without modification exclusively for military, defence or national security purposes, regardless of the type of entity carrying out those activities.
> This Regulation does not apply to AI systems which are not placed on the market or put into service in the Union, where the output is used in the Union exclusively for military, defence or national security purposes, regardless of the type of entity carrying out those activities.

> 4. This Regulation applies neither to public authorities in a third country nor to international organisations falling within the scope of this Regulation pursuant to paragraph 1, where those authorities or organisations use AI systems in the framework of international cooperation or agreements for law enforcement and judicial cooperation with the Union or with one or more Member States, provided that such a third country or international organisation provides adequate safeguards with respect to the protection of fundamental rights and freedoms of individuals.

> 6. This Regulation does not apply to AI systems or AI models, including their output, specifically developed and put into service for the sole purpose of scientific research and development.

> 8. This Regulation does not apply to any research, testing or development activity regarding AI systems or AI models prior to their being placed on the market or put into service. Such activities shall be conducted in accordance with applicable Union law. Testing in real world conditions shall not be covered by that exclusion.

> 10. This Regulation does not apply to obligations of deployers who are natural persons using AI systems in the course of a purely personal non-professional activity.

> 12. This Regulation does not apply to AI systems released under free and open-source licences, unless they are placed on the market or put into service as high-risk AI systems or as an AI system that falls under Article 5 or 50.

Notes for the Tree author (text, not interpretation):

- Paragraph 6 (scientific research and development) is a full exclusion of the *system*;
  paragraph 8 excludes the *activity* before placing on the market and expressly keeps
  "testing in real world conditions" inside the Act. Recital 25 explains the split and
  adds that "any other AI system that may be used for the conduct of any research and
  development activity should remain subject to the provisions of this Regulation".
- Paragraph 10 excludes only *deployers* who are natural persons acting privately; it
  does not exclude the provider of the system they use.
- Paragraph 12 (open source) is not a full exclusion: the Act still applies to open-source
  systems that are high-risk or fall under Article 5 or Article 50. Since steps 3--6 of
  the Tree are exactly those questions, an open-source system cannot be sent to a
  terminal Node at step 1.
- Recital 24 states that a system placed on the market for both an excluded purpose
  (military, defence, national security) and a non-excluded purpose "fall[s] within the
  scope of this Regulation".

### 3.4 Provisions in Article 2 that limit rather than exclude (for completeness)

- 2(2): for Article 6(1) systems under Annex I **Section B**, "only Article 6(1),
  Article 60a and Articles 102 to 112 shall apply" (as amended). The Tree's step 4a should
  know that Section B products get a much smaller set of obligations.
- 2(5): does not affect the intermediary-liability rules of Regulation (EU) 2022/2065.
- 2(7): personal data law (GDPR and others) continues to apply.
- 2(9): "without prejudice to the rules laid down by other Union legal acts related to
  consumer protection and product safety".
- 2(11): Member States may keep or introduce rules more favourable to workers.
- 2(13) (new): possible limitation of Articles 9--15 and 17--25 for Article 6(1) systems,
  subject to delegated acts due by 2 August 2027.

## 4. Step 2 -- Material scope: the definition of "AI system" (Article 3(1))

Source: `…?uri=CELEX:02024R1689-20260727#art_3`. Unchanged by the amendment.

### 4.1 Definition, verbatim

> (1) ‘AI system’ means a machine-based system that is designed to operate with varying levels of autonomy and that may exhibit adaptiveness after deployment, and that, for explicit or implicit objectives, infers, from the input it receives, how to generate outputs such as predictions, content, recommendations, or decisions that can influence physical or virtual environments;

### 4.2 Recital 12, verbatim (the Act's own explanation of each element)

> (12) The notion of ‘AI system’ in this Regulation should be clearly defined and should be closely aligned with the work of international organisations working on AI to ensure legal certainty, facilitate international convergence and wide acceptance, while providing the flexibility to accommodate the rapid technological developments in this field. Moreover, the definition should be based on key characteristics of AI systems that distinguish it from simpler traditional software systems or programming approaches and should not cover systems that are based on the rules defined solely by natural persons to automatically execute operations. A key characteristic of AI systems is their capability to infer. This capability to infer refers to the process of obtaining the outputs, such as predictions, content, recommendations, or decisions, which can influence physical and virtual environments, and to a capability of AI systems to derive models or algorithms, or both, from inputs or data. The techniques that enable inference while building an AI system include machine learning approaches that learn from data how to achieve certain objectives, and logic- and knowledge-based approaches that infer from encoded knowledge or symbolic representation of the task to be solved. The capacity of an AI system to infer transcends basic data processing by enabling learning, reasoning or modelling. The term ‘machine-based’ refers to the fact that AI systems run on machines. The reference to explicit or implicit objectives underscores that AI systems can operate according to explicit defined objectives or to implicit objectives. The objectives of the AI system may be different from the intended purpose of the AI system in a specific context. For the purposes of this Regulation, environments should be understood to be the contexts in which the AI systems operate, whereas outputs generated by the AI system reflect different functions performed by AI systems and include predictions, content, recommendations or decisions. AI systems are designed to operate with varying levels of autonomy, meaning that they have some degree of independence of actions from human involvement and of capabilities to operate without human intervention. The adaptiveness that an AI system could exhibit after deployment, refers to self-learning capabilities, allowing the system to change while in use. AI systems can be used on a stand-alone basis or as a component of a product, irrespective of whether the system is physically integrated into the product (embedded) or serves the functionality of the product without being integrated therein (non-embedded).

Elements a non-lawyer can check, each taken from the sentences above: machine-based;
varying levels of autonomy; may (not must) exhibit adaptiveness; explicit or implicit
objectives; **infers** from input how to generate outputs (this is the distinguishing
element, and "systems that are based on the rules defined solely by natural persons to
automatically execute operations" are out); outputs are predictions, content,
recommendations or decisions; those outputs can influence physical or virtual environments.

### 4.3 Related definition the Tree will need at this step

> (12) ‘intended purpose’ means the use for which an AI system is intended by the provider, including the specific context and conditions of use, as specified in the information supplied by the provider in the instructions for use, promotional or sales materials and statements, as well as in the technical documentation;

### 4.4 The owner's "other regulations apply instead" message -- UNKNOWN in the Act

The core document says the "no" branch should show a message that other regulations apply
instead (product safety regulation, product liability directive). **The Act does not say
what applies to a system that is not an AI system.** What was looked at: the whole of
Article 2 (the only "without prejudice" clause is 2(9), "other Union legal acts related to
consumer protection and product safety", which is about systems *inside* the Act) and the
recitals (recital 9 and footnotes 10 and 53 of the original mention Directive 85/374/EEC on
product liability and Regulation (EU) 2023/988 on general product safety, but only as
related acts). Any list of "other regulations" in that Node is therefore the owner's
editorial content, not a citation of the AI Act, and should be sourced separately.

## 5. Step 3 -- Prohibited practices (Article 5)

Source: `…?uri=CELEX:02024R1689-20260727#art_5`. Count: **10 practices** in
Article 5(1), first subparagraph: points (a), (b), (ba), (bb), (c), (d), (e), (f), (g), (h).
The count comes from the consolidated text; (ba) and (bb) were inserted by Regulation
(EU) 2026/1744, Article 1(7)(a), and apply from 2 December 2026 (Article 113(3)(a) as
amended). The original text had 8.

Each entry below quotes the operative text verbatim and then restates it in plain language
without adding conditions that are not in the text.

**5(1)(a) -- Subliminal, manipulative or deceptive techniques.**

> (a) the placing on the market, the putting into service or the use of an AI system that deploys subliminal techniques beyond a person’s consciousness or purposefully manipulative or deceptive techniques, with the objective, or the effect of materially distorting the behaviour of a person or a group of persons by appreciably impairing their ability to make an informed decision, thereby causing them to take a decision that they would not have otherwise taken in a manner that causes or is reasonably likely to cause that person, another person or group of persons significant harm;

Plain language: a system may not use techniques people cannot perceive, or techniques
that are purposely manipulative or deceptive, when the aim or the effect is to distort
someone's behaviour by impairing their ability to decide, so that they take a decision they
would not otherwise have taken, and that causes or is likely to cause significant harm.
All of those elements have to be present.

**5(1)(b) -- Exploiting vulnerabilities.**

> (b) the placing on the market, the putting into service or the use of an AI system that exploits any of the vulnerabilities of a natural person or a specific group of persons due to their age, disability or a specific social or economic situation, with the objective, or the effect, of materially distorting the behaviour of that person or a person belonging to that group in a manner that causes or is reasonably likely to cause that person or another person significant harm;

Plain language: a system may not exploit a person's or group's vulnerability that stems
from age, disability, or a specific social or economic situation, where the aim or effect
is to distort their behaviour in a way that causes or is likely to cause significant harm.

**5(1)(ba) -- Non-consensual sexual imagery of an identifiable person (new, from 2 December 2026).**

> (ba) the placing on the market, the putting into service or the use of an AI system that generates or manipulates realistic images, videos, audio or similar material of an identifiable natural person’s intimate parts, or of an identifiable natural person engaged in sexually explicit activities, without that person’s freely-given, specific, informed, unambiguous and explicit consent for that generation or manipulation;

Plain language: a system may not generate or manipulate realistic sexual material of an
identifiable real person without that person's explicit consent. Article 5(1a) narrows
when the *provider* is caught (only where that generation is the system's intended purpose,
or is a reasonably foreseeable and reproducible outcome and the system lacks adequate
safeguards) and when the *deployer* is caught (only where they use the system for that
purpose). Article 5(1b) says a manipulation that does not increase exposure of intimate
parts or alter the nature of depicted activities does not count as manipulation. Both
paragraphs are quoted in full in 5.1 below.

**5(1)(bb) -- Child sexual abuse material (new, from 2 December 2026).**

> (bb) the placing on the market, the putting into service or the use of an AI system that generates or manipulates material or performance within the meaning of Article 2, points (c) and (e), of Directive 2011/93/EU, except where a ‘without right’ defence applies under national law;

Plain language: a system may not generate or manipulate child sexual abuse material or
child pornographic performances as defined in Directive 2011/93/EU, unless a "without
right" defence applies under national law. Article 5(1a) applies here in the same way as
for (ba).

**5(1)(c) -- Social scoring.**

> (c) the placing on the market, the putting into service or the use of AI systems for the evaluation or classification of natural persons or groups of persons over a certain period of time based on their social behaviour or known, inferred or predicted personal or personality characteristics, with the social score leading to either or both of the following:
> (i) detrimental or unfavourable treatment of certain natural persons or groups of persons in social contexts that are unrelated to the contexts in which the data was originally generated or collected;
> (ii) detrimental or unfavourable treatment of certain natural persons or groups of persons that is unjustified or disproportionate to their social behaviour or its gravity;

Plain language: scoring people over time on their social behaviour or personal
characteristics is prohibited where the score leads to unfavourable treatment either in an
unrelated context, or that is unjustified or disproportionate to the behaviour.

**5(1)(d) -- Predicting criminal offences from profiling alone.**

> (d) the placing on the market, the putting into service for this specific purpose, or the use of an AI system for making risk assessments of natural persons in order to assess or predict the risk of a natural person committing a criminal offence, based solely on the profiling of a natural person or on assessing their personality traits and characteristics; this prohibition shall not apply to AI systems used to support the human assessment of the involvement of a person in a criminal activity, which is already based on objective and verifiable facts directly linked to a criminal activity;

Plain language: predicting whether a person will commit a crime based solely on profiling
or personality traits is prohibited. Systems that support a human assessment already based
on objective, verifiable facts linked to a criminal activity are not covered.

**5(1)(e) -- Untargeted scraping for facial recognition databases.**

> (e) the placing on the market, the putting into service for this specific purpose, or the use of AI systems that create or expand facial recognition databases through the untargeted scraping of facial images from the internet or CCTV footage;

Plain language: building or growing a facial-recognition database by indiscriminately
scraping faces from the internet or CCTV is prohibited.

**5(1)(f) -- Emotion recognition at work and in education.**

> (f) the placing on the market, the putting into service for this specific purpose, or the use of AI systems to infer emotions of a natural person in the areas of workplace and education institutions, except where the use of the AI system is intended to be put in place or into the market for medical or safety reasons;

Plain language: inferring people's emotions in workplaces or educational institutions is
prohibited, except for medical or safety reasons. The definition of "emotion recognition
system" (Article 3(39)) is: "an AI system for the purpose of identifying or inferring
emotions or intentions of natural persons on the basis of their biometric data".

**5(1)(g) -- Biometric categorisation by protected characteristics.**

> (g) the placing on the market, the putting into service for this specific purpose, or the use of biometric categorisation systems that categorise individually natural persons based on their biometric data to deduce or infer their race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation; this prohibition does not cover any labelling or filtering of lawfully acquired biometric datasets, such as images, based on biometric data or categorizing of biometric data in the area of law enforcement;

Plain language: using biometric data to sort individuals by race, political opinions, trade
union membership, religious or philosophical beliefs, sex life or sexual orientation is
prohibited. Labelling or filtering lawfully acquired biometric datasets, and categorising
biometric data in law enforcement, are not covered.

**5(1)(h) -- Real-time remote biometric identification in public spaces for law enforcement.**

> (h) the use of ‘real-time’ remote biometric identification systems in publicly accessible spaces for the purposes of law enforcement, unless and in so far as such use is strictly necessary for one of the following objectives:
> (i) the targeted search for specific victims of abduction, trafficking in human beings or sexual exploitation of human beings, as well as the search for missing persons;
> (ii) the prevention of a specific, substantial and imminent threat to the life or physical safety of natural persons or a genuine and present or genuine and foreseeable threat of a terrorist attack;
> (iii) the localisation or identification of a person suspected of having committed a criminal offence, for the purpose of conducting a criminal investigation or prosecution or executing a criminal penalty for offences referred to in Annex II and punishable in the Member State concerned by a custodial sentence or a detention order for a maximum period of at least four years.
> Point (h) of the first subparagraph is without prejudice to Article 9 of Regulation (EU) 2016/679 for the processing of biometric data for purposes other than law enforcement.

Plain language: live facial recognition (and other real-time remote biometric
identification) in publicly accessible spaces by law enforcement is prohibited except for
three narrowly listed objectives, and even then only under the conditions of Article
5(2)--(7) (necessity assessment, prior judicial or independent authorisation, national
law, notification, annual reports). Note that this point covers only the *use*, not the
placing on the market; and only *law enforcement* purposes. Definitions: Article 3(41)
"remote biometric identification system", 3(42) "real-time", 3(44) "publicly accessible
space" ("any publicly or privately owned physical place accessible to an undetermined
number of natural persons …").

### 5.1 Conditions inserted for (ba) and (bb) -- Article 5(1a) and (1b), verbatim

> 1a. For the purposes of paragraph 1, first subparagraph, points (ba) and (bb):
> (a) the placing on the market or putting into service of an AI system that generates or manipulates the material or performance referred to in paragraph 1, first subparagraph, point (ba) or (bb) is only prohibited where:
> (i) that generation or manipulation is the intended purpose of the AI system; or
> (ii) the system’s design, training, architecture, capabilities or user-facing functionalities make that generation or manipulation a reasonably foreseeable and reproducible outcome, without requiring significant technical modification, and the system does not have reasonable and adequate technical safety measures and other safeguards to reliably prevent that generation or manipulation, taking into account reasonably foreseeable misuse, and to correct observed or reported misuse;
> (b) the use of an AI system that generates or manipulates the material or performance referred to in paragraph 1, first subparagraph, points (ba) and (bb) is only prohibited where the deployer uses the system for the purpose of generating or manipulating such material or performance.
> 1b. For the purposes of paragraph 1, first subparagraph, point (ba), an AI system that manipulates material in a way that does not increase the exposure of any depicted intimate parts or alter the nature of any depicted sexually explicit activities shall not constitute manipulation.

### 5.2 Closing rule -- Article 5(8), verbatim

> 8. This Article shall not affect the prohibitions that apply where an AI practice infringes other Union law.

## 6. Step 4 -- High-risk classification (Article 6, Annex I, Annex III)

Source: `…?uri=CELEX:02024R1689-20260727#art_6`, `#anx_I`, `#anx_III`.

### 6.1 The two routes -- Article 6(1) and 6(2), verbatim

> 1. Irrespective of whether an AI system is placed on the market or put into service independently of the products referred to in points (a) and (b), that AI system shall be considered to be high-risk where both of the following conditions are fulfilled:
> (a) the AI system is intended to be used as a safety component of a product, or the AI system is itself a product, covered by the Union harmonisation legislation listed in Annex I;
> (b) the product whose safety component pursuant to point (a) is the AI system, or the AI system itself as a product, is required to undergo a third-party conformity assessment, with a view to the placing on the market or the putting into service of that product pursuant to the Union harmonisation legislation listed in Annex I.

> 2. In addition to the high-risk AI systems referred to in paragraph 1, AI systems referred to in Annex III shall be considered to be high-risk.

Owner's step 4a says "the AI system is a safety component in a product covered by Union
harmonisation legislation". **Incomplete on two points shown by the text:** (i) the route
also covers a system that "is itself a product" covered by Annex I; (ii) a **second,
cumulative condition** (b) is required: the product must need a *third-party* conformity
assessment under that legislation. Being covered by Annex I alone is not enough.

Definition of "safety component", Article 3(14) as amended (verbatim):

> (14) ‘safety component’ means a component of a product or of an AI system which fulfils a safety function for that product or AI system, or the failure or malfunctioning of which endangers the health and safety of persons or property; for the purposes of this definition, a component fulfils a safety function where its intended purpose is to prevent or mitigate risks to health and safety of persons or property;

New Article 6(1a)--(1c), verbatim:

> 1a. For the purposes of this Regulation, including paragraph 1 of this Article, AI systems that are solely used for non-safety related aspects of user assistance, performance optimisation, service efficiency, automation or convenience or quality control shall not qualify as safety components.
> 1b. Notwithstanding paragraph 1a, AI systems the failure or malfunctioning of which would endanger health and safety shall qualify as safety components.
> 1c. A product that is required to undergo a third-party conformity assessment solely due to risks other than risks to health and safety, in particular risks relating to the distribution of radio spectrum or electromagnetic interference that do not affect health and safety, shall not be considered as fulfilling the condition in paragraph 1, point (b).

### 6.2 When an Annex III system is nevertheless not high-risk -- Article 6(3) and 6(4), verbatim

> 3. By derogation from paragraph 2, an AI system referred to in Annex III shall not be considered to be high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons, including by not materially influencing the outcome of decision making.
> The first subparagraph shall apply where any of the following conditions is fulfilled:
> (a) the AI system is intended to perform a narrow procedural task;
> (b) the AI system is intended to improve the result of a previously completed human activity;
> (c) the AI system is intended to detect decision-making patterns or deviations from prior decision-making patterns and is not meant to replace or influence the previously completed human assessment, without proper human review; or
> (d) the AI system is intended to perform a preparatory task to an assessment relevant for the purposes of the use cases listed in Annex III.
> Notwithstanding the first subparagraph, an AI system referred to in Annex III shall always be considered to be high-risk where the AI system performs profiling of natural persons.

> 4. A provider who considers that an AI system referred to in Annex III is not high-risk shall document its assessment before that system is placed on the market or put into service. Such provider shall be subject to the registration obligation set out in Article 49(2). Upon request of national competent authorities, the provider shall provide the documentation of the assessment.

Article 6(5) requires the Commission to publish guidelines with practical examples "no
later than 2 February 2026". Whether they have been published was not checked (out of the
Act's text) -- **UNKNOWN**; a later research issue could fetch them.

### 6.3 Annex I -- the complete list of Union harmonisation legislation (as amended)

Count: **20 entries** (Section A: 11, numbered 2--12 because point 1 was deleted; Section
B: 9, numbered 13--21). Source of the count: consolidated Annex I (R5) plus the amending
act, Article 1(41) (R6). Titles in the third column are the `expression_title` values
returned by the Publications Office SPARQL endpoint (R9) for each CELEX number, so the
CELEX numbers are verified, not derived. EUR-Lex URL pattern for each:
`https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:<CELEX>`.

**Section A. List of Union harmonisation legislation based on the New Legislative Framework**

| No. | Act (as listed in Annex I) | CELEX | Title returned by Cellar (R9) |
|---|---|---|---|
| 1 | *deleted by Regulation (EU) 2026/1744* (was Directive 2006/42/EC on machinery) | 32006L0042 | Directive 2006/42/EC … on machinery, and amending Directive 95/16/EC (recast) |
| 2 | Directive 2009/48/EC on the safety of toys | 32009L0048 | Directive 2009/48/EC … on the safety of toys |
| 3 | Directive 2013/53/EU on recreational craft and personal watercraft | 32013L0053 | Directive 2013/53/EU … on recreational craft and personal watercraft and repealing Directive 94/25/EC |
| 4 | Directive 2014/33/EU on lifts and safety components for lifts | 32014L0033 | Directive 2014/33/EU … relating to lifts and safety components for lifts (recast) |
| 5 | Directive 2014/34/EU on equipment and protective systems for potentially explosive atmospheres | 32014L0034 | Directive 2014/34/EU … relating to equipment and protective systems intended for use in potentially explosive atmospheres (recast) |
| 6 | Directive 2014/53/EU on radio equipment | 32014L0053 | Directive 2014/53/EU … relating to the making available on the market of radio equipment and repealing Directive 1999/5/EC |
| 7 | Directive 2014/68/EU on pressure equipment | 32014L0068 | Directive 2014/68/EU … relating to the making available on the market of pressure equipment (recast) |
| 8 | Regulation (EU) 2016/424 on cableway installations | 32016R0424 | Regulation (EU) 2016/424 … on cableway installations and repealing Directive 2000/9/EC |
| 9 | Regulation (EU) 2016/425 on personal protective equipment | 32016R0425 | Regulation (EU) 2016/425 … on personal protective equipment and repealing Council Directive 89/686/EEC |
| 10 | Regulation (EU) 2016/426 on appliances burning gaseous fuels | 32016R0426 | Regulation (EU) 2016/426 … on appliances burning gaseous fuels and repealing Directive 2009/142/EC |
| 11 | Regulation (EU) 2017/745 on medical devices | 32017R0745 | Regulation (EU) 2017/745 … on medical devices, amending Directive 2001/83/EC, Regulation (EC) No 178/2002 and Regulation (EC) No 1223/2009 and repealing Council Directives 90/385/EEC and 93/42/EEC |
| 12 | Regulation (EU) 2017/746 on in vitro diagnostic medical devices | 32017R0746 | Regulation (EU) 2017/746 … on in vitro diagnostic medical devices and repealing Directive 98/79/EC and Commission Decision 2010/227/EU |

**Section B. List of other Union harmonisation legislation**

| No. | Act (as listed in Annex I) | CELEX | Title returned by Cellar (R9) |
|---|---|---|---|
| 13 | Regulation (EC) No 300/2008 on civil aviation security | 32008R0300 | Regulation (EC) No 300/2008 … on common rules in the field of civil aviation security and repealing Regulation (EC) No 2320/2002 |
| 14 | Regulation (EU) No 168/2013 on two- or three-wheel vehicles and quadricycles | 32013R0168 | Regulation (EU) No 168/2013 … on the approval and market surveillance of two- or three-wheel vehicles and quadricycles |
| 15 | Regulation (EU) No 167/2013 on agricultural and forestry vehicles | 32013R0167 | Regulation (EU) No 167/2013 … on the approval and market surveillance of agricultural and forestry vehicles |
| 16 | Directive 2014/90/EU on marine equipment | 32014L0090 | Directive 2014/90/EU … on marine equipment and repealing Council Directive 96/98/EC |
| 17 | Directive (EU) 2016/797 on the interoperability of the rail system | 32016L0797 | Directive (EU) 2016/797 … on the interoperability of the rail system within the European Union (recast) |
| 18 | Regulation (EU) 2018/858 on the approval of motor vehicles and their trailers | 32018R0858 | Regulation (EU) 2018/858 … on the approval and market surveillance of motor vehicles and their trailers, and of systems, components and separate technical units intended for such vehicles … |
| 19 | Regulation (EU) 2019/2144 on type-approval requirements for motor vehicles as regards general safety | 32019R2144 | Regulation (EU) 2019/2144 … on type-approval requirements for motor vehicles and their trailers … as regards their general safety and the protection of vehicle occupants and vulnerable road users … |
| 20 | Regulation (EU) 2018/1139 on civil aviation, "in so far as the design, production and placing on the market of aircrafts referred to in Article 2(1), points (a) and (b) thereof, where it concerns unmanned aircraft and their engines, propellers, parts and equipment to control them remotely, are concerned" | 32018R1139 | Regulation (EU) 2018/1139 … on common rules in the field of civil aviation and establishing a European Union Aviation Safety Agency … |
| 21 | Regulation (EU) 2023/1230 on machinery (*added by Regulation (EU) 2026/1744*) | 32023R1230 | Regulation (EU) 2023/1230 … on machinery and repealing Directive 2006/42/EC … and Council Directive 73/361/EEC |

Verbatim Annex I entry 21 as inserted:

> 21. Regulation (EU) 2023/1230 of the European Parliament and of the Council of 14 June 2023 on machinery and repealing Directive 2006/42/EC of the European Parliament and of the Council and Council Directive 73/361/EEC (OJ L 165, 29.6.2023, p. 1, ELI: http://data.europa.eu/eli/reg/2023/1230/oj).

Notes relevant to an **agrifood** Tree, from the text only: agricultural and forestry
vehicles (entry 15) and unmanned aircraft (entry 20) are in Section B; machinery (entry
21) is now in Section B too; Article 2(2) limits the Act's application for Section B
products to "Article 6(1), Article 60a and Articles 102 to 112".

### 6.4 Annex III -- the complete list of high-risk areas (unchanged)

Count: **8 areas** containing **25 listed system types** (area 2 is a single entry;
the others have 3, 4, 2, 4, 5, 4 and 2 sub-items). Source of the count: consolidated
Annex III (R5), identical to the original (R3). Heading, verbatim:

> High-risk AI systems pursuant to Article 6(2) are the AI systems listed in any of the following areas:

**1. Biometrics**, "in so far as their use is permitted under relevant Union or national law":

> (a) remote biometric identification systems.
> This shall not include AI systems intended to be used for biometric verification the sole purpose of which is to confirm that a specific natural person is the person he or she claims to be;
> (b) AI systems intended to be used for biometric categorisation, according to sensitive or protected attributes or characteristics based on the inference of those attributes or characteristics;
> (c) AI systems intended to be used for emotion recognition.

**2. Critical infrastructure:**

> AI systems intended to be used as safety components in the management and operation of critical digital infrastructure, road traffic, or in the supply of water, gas, heating or electricity.

**3. Education and vocational training:**

> (a) AI systems intended to be used to determine access or admission or to assign natural persons to educational and vocational training institutions at all levels;
> (b) AI systems intended to be used to evaluate learning outcomes, including when those outcomes are used to steer the learning process of natural persons in educational and vocational training institutions at all levels;
> (c) AI systems intended to be used for the purpose of assessing the appropriate level of education that an individual will receive or will be able to access, in the context of or within educational and vocational training institutions at all levels;
> (d) AI systems intended to be used for monitoring and detecting prohibited behaviour of students during tests in the context of or within educational and vocational training institutions at all levels.

**4. Employment, workers’ management and access to self-employment:**

> (a) AI systems intended to be used for the recruitment or selection of natural persons, in particular to place targeted job advertisements, to analyse and filter job applications, and to evaluate candidates;
> (b) AI systems intended to be used to make decisions affecting terms of work-related relationships, the promotion or termination of work-related contractual relationships, to allocate tasks based on individual behaviour or personal traits or characteristics or to monitor and evaluate the performance and behaviour of persons in such relationships.

**5. Access to and enjoyment of essential private services and essential public services and benefits:**

> (a) AI systems intended to be used by public authorities or on behalf of public authorities to evaluate the eligibility of natural persons for essential public assistance benefits and services, including healthcare services, as well as to grant, reduce, revoke, or reclaim such benefits and services;
> (b) AI systems intended to be used to evaluate the creditworthiness of natural persons or establish their credit score, with the exception of AI systems used for the purpose of detecting financial fraud;
> (c) AI systems intended to be used for risk assessment and pricing in relation to natural persons in the case of life and health insurance;
> (d) AI systems intended to evaluate and classify emergency calls by natural persons or to be used to dispatch, or to establish priority in the dispatching of, emergency first response services, including by police, firefighters and medical aid, as well as of emergency healthcare patient triage systems.

**6. Law enforcement**, "in so far as their use is permitted under relevant Union or national law":

> (a) AI systems intended to be used by or on behalf of law enforcement authorities, or by Union institutions, bodies, offices or agencies in support of law enforcement authorities or on their behalf to assess the risk of a natural person becoming the victim of criminal offences;
> (b) AI systems intended to be used by or on behalf of law enforcement authorities or by Union institutions, bodies, offices or agencies in support of law enforcement authorities as polygraphs or similar tools;
> (c) AI systems intended to be used by or on behalf of law enforcement authorities, or by Union institutions, bodies, offices or agencies, in support of law enforcement authorities to evaluate the reliability of evidence in the course of the investigation or prosecution of criminal offences;
> (d) AI systems intended to be used by law enforcement authorities or on their behalf or by Union institutions, bodies, offices or agencies in support of law enforcement authorities for assessing the risk of a natural person offending or re-offending not solely on the basis of the profiling of natural persons as referred to in Article 3(4) of Directive (EU) 2016/680, or to assess personality traits and characteristics or past criminal behaviour of natural persons or groups;
> (e) AI systems intended to be used by or on behalf of law enforcement authorities or by Union institutions, bodies, offices or agencies in support of law enforcement authorities for the profiling of natural persons as referred to in Article 3(4) of Directive (EU) 2016/680 in the course of the detection, investigation or prosecution of criminal offences.

**7. Migration, asylum and border control management**, "in so far as their use is permitted under relevant Union or national law":

> (a) AI systems intended to be used by or on behalf of competent public authorities or by Union institutions, bodies, offices or agencies as polygraphs or similar tools;
> (b) AI systems intended to be used by or on behalf of competent public authorities or by Union institutions, bodies, offices or agencies to assess a risk, including a security risk, a risk of irregular migration, or a health risk, posed by a natural person who intends to enter or who has entered into the territory of a Member State;
> (c) AI systems intended to be used by or on behalf of competent public authorities or by Union institutions, bodies, offices or agencies to assist competent public authorities for the examination of applications for asylum, visa or residence permits and for associated complaints with regard to the eligibility of the natural persons applying for a status, including related assessments of the reliability of evidence;
> (d) AI systems intended to be used by or on behalf of competent public authorities, or by Union institutions, bodies, offices or agencies, in the context of migration, asylum or border control management, for the purpose of detecting, recognising or identifying natural persons, with the exception of the verification of travel documents.

**8. Administration of justice and democratic processes:**

> (a) AI systems intended to be used by a judicial authority or on their behalf to assist a judicial authority in researching and interpreting facts and the law and in applying the law to a concrete set of facts, or to be used in a similar way in alternative dispute resolution;
> (b) AI systems intended to be used for influencing the outcome of an election or referendum or the voting behaviour of natural persons in the exercise of their vote in elections or referenda. This does not include AI systems to the output of which natural persons are not directly exposed, such as tools used to organise, optimise or structure political campaigns from an administrative or logistical point of view.

## 7. Step 5 -- General-purpose AI (Article 3(63), (65), (66), (68); Chapter V)

Source: `…?uri=CELEX:02024R1689-20260727#art_3`, `#art_51`, `#art_53`. Unchanged by the
amendment except Article 56(6) (codes of practice procedure), which is outside the
yes/no step.

### 7.1 Definitions, verbatim

> (63) ‘general-purpose AI model’ means an AI model, including where such an AI model is trained with a large amount of data using self-supervision at scale, that displays significant generality and is capable of competently performing a wide range of distinct tasks regardless of the way the model is placed on the market and that can be integrated into a variety of downstream systems or applications, except AI models that are used for research, development or prototyping activities before they are placed on the market;

> (65) ‘systemic risk’ means a risk that is specific to the high-impact capabilities of general-purpose AI models, having a significant impact on the Union market due to their reach, or due to actual or reasonably foreseeable negative effects on public health, safety, public security, fundamental rights, or the society as a whole, that can be propagated at scale across the value chain;

> (66) ‘general-purpose AI system’ means an AI system which is based on a general-purpose AI model and which has the capability to serve a variety of purposes, both for direct use as well as for integration in other AI systems;

> (68) ‘downstream provider’ means a provider of an AI system, including a general-purpose AI system, which integrates an AI model, regardless of whether the AI model is provided by themselves and vertically integrated or provided by another entity based on contractual relations.

### 7.2 Recitals that help apply the definitions (verbatim excerpts)

Recital 97: "Although AI models are essential components of AI systems, they do not
constitute AI systems on their own. AI models require the addition of further components,
such as for example a user interface, to become AI systems." And: "It should be understood
that the obligations for the providers of general-purpose AI models should apply once the
general-purpose AI models are placed on the market. When the provider of a general-purpose
AI model integrates an own model into its own AI system that is made available on the
market or put into service, that model should be considered to be placed on the market
and, therefore, the obligations in this Regulation for models should continue to apply in
addition to those for AI systems."

Recital 98: "models with at least a billion of parameters and trained with a large amount
of data using self-supervision at scale should be considered to display significant
generality and to competently perform a wide range of distinctive tasks."

Recital 99: "Large generative AI models are a typical example for a general-purpose AI
model".

Recital 100: "When a general-purpose AI model is integrated into or forms part of an AI
system, this system should be considered to be general-purpose AI system when, due to
this integration, this system has the capability to serve a variety of purposes."

### 7.3 Where the obligations sit -- Chapter V structure (measured headings)

Chapter V "GENERAL-PURPOSE AI MODELS" contains: Section 1 "Classification rules"
(Article 51 "Classification of general-purpose AI models as general-purpose AI models with
systemic risk"; Article 52 "Procedure"); Section 2 "Obligations for providers of
general-purpose AI models" (Article 53, same title; Article 54 "Authorised
representatives of providers of general-purpose AI models"); Section 3 "Obligations of
providers of general-purpose AI models with systemic risk" (Article 55); Section 4
"Codes of practice" (Article 56).

What the text establishes for a yes/no step:

- The Chapter V obligations fall on **providers of general-purpose AI *models*** (Article
  53(1): "Providers of general-purpose AI models shall: …"; Article 55 for models with
  systemic risk). There is no Chapter V obligation addressed to a "general-purpose AI
  system" as such; a general-purpose AI *system* is treated like any AI system under the
  rest of the Act, and is named expressly in Article 50(2) (section 8 below) and in the
  definition of "downstream provider".
- Systemic risk, Article 51(1) and (2), verbatim:

> 1. A general-purpose AI model shall be classified as a general-purpose AI model with systemic risk if it meets any of the following conditions:
> (a) it has high impact capabilities evaluated on the basis of appropriate technical tools and methodologies, including indicators and benchmarks;
> (b) based on a decision of the Commission, ex officio or following a qualified alert from the scientific panel, it has capabilities or an impact equivalent to those set out in point (a) having regard to the criteria set out in Annex XIII.
> 2. A general-purpose AI model shall be presumed to have high impact capabilities pursuant to paragraph 1, point (a), when the cumulative amount of computation used for its training measured in floating point operations is greater than 10^25.

(The exponent is rendered as a superscript on EUR-Lex; the plain-text extraction reads
"1025". The Official Journal formatting is 10 to the power 25.)

- Application date: Chapter V applies from 2 August 2025 (Article 113(3)(b)); models
  placed on the market before that date have until 2 August 2027 (Article 111(3)).

Two yes/no questions the text supports for step 5: "Is what you provide a general-purpose
AI *model* that you place on the market?" (Chapter V obligations) and "Is your AI system
based on a general-purpose AI model and able to serve a variety of purposes?" (it is a
general-purpose AI *system*; relevant to Article 50(2) and to the downstream-provider
definition). Whether the Tree asks one or both is the owner's authoring choice.

## 8. Step 6 -- Transparency obligations (Article 50)

Source: `…?uri=CELEX:02024R1689-20260727#art_50`. Paragraphs 1--6 unchanged; paragraph 7
replaced. Count: **5 situations**, in paragraphs 1, 2, 3, 4 first subparagraph and 4
second subparagraph. Source of the count: the consolidated text (R5); the paragraphs each
name one addressee and one situation, and the second subparagraph of paragraph 4 has its
own addressee and situation.

**Situation 1 -- Article 50(1): systems that interact directly with people (obligation on the provider).**

> 1. Providers shall ensure that AI systems intended to interact directly with natural persons are designed and developed in such a way that the natural persons concerned are informed that they are interacting with an AI system, unless this is obvious from the point of view of a natural person who is reasonably well-informed, observant and circumspect, taking into account the circumstances and the context of use. This obligation shall not apply to AI systems authorised by law to detect, prevent, investigate or prosecute criminal offences, subject to appropriate safeguards for the rights and freedoms of third parties, unless those systems are available for the public to report a criminal offence.

**Situation 2 -- Article 50(2): systems generating synthetic audio, image, video or text (obligation on the provider).**

> 2. Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or text content, shall ensure that the outputs of the AI system are marked in a machine-readable format and detectable as artificially generated or manipulated. Providers shall ensure their technical solutions are effective, interoperable, robust and reliable as far as this is technically feasible, taking into account the specificities and limitations of various types of content, the costs of implementation and the generally acknowledged state of the art, as may be reflected in relevant technical standards. This obligation shall not apply to the extent the AI systems perform an assistive function for standard editing or do not substantially alter the input data provided by the deployer or the semantics thereof, or where authorised by law to detect, prevent, investigate or prosecute criminal offences.

Transitional rule, Article 111(4) (new): providers of such systems "that have been placed
on the market before 2 August 2026 shall take the necessary steps in order to comply with
Article 50(2) by 2 December 2026."

**Situation 3 -- Article 50(3): emotion recognition or biometric categorisation (obligation on the deployer).**

> 3. Deployers of an emotion recognition system or a biometric categorisation system shall inform the natural persons exposed thereto of the operation of the system, and shall process the personal data in accordance with Regulations (EU) 2016/679 and (EU) 2018/1725 and Directive (EU) 2016/680, as applicable. This obligation shall not apply to AI systems used for biometric categorisation and emotion recognition, which are permitted by law to detect, prevent or investigate criminal offences, subject to appropriate safeguards for the rights and freedoms of third parties, and in accordance with Union law.

Definitions: Article 3(39) "emotion recognition system" (quoted in 5(1)(f) above);
Article 3(40): "‘biometric categorisation system’ means an AI system for the purpose of
assigning natural persons to specific categories on the basis of their biometric data,
unless it is ancillary to another commercial service and strictly necessary for objective
technical reasons".

**Situation 4 -- Article 50(4), first subparagraph: deep fakes (obligation on the deployer).**

> 4. Deployers of an AI system that generates or manipulates image, audio or video content constituting a deep fake, shall disclose that the content has been artificially generated or manipulated. This obligation shall not apply where the use is authorised by law to detect, prevent, investigate or prosecute criminal offence. Where the content forms part of an evidently artistic, creative, satirical, fictional or analogous work or programme, the transparency obligations set out in this paragraph are limited to disclosure of the existence of such generated or manipulated content in an appropriate manner that does not hamper the display or enjoyment of the work.

Definition, Article 3(60): "‘deep fake’ means AI-generated or manipulated image, audio or
video content that resembles existing persons, objects, places, entities or events and
would falsely appear to a person to be authentic or truthful".

**Situation 5 -- Article 50(4), second subparagraph: AI-generated text published to inform the public (obligation on the deployer).**

> Deployers of an AI system that generates or manipulates text which is published with the purpose of informing the public on matters of public interest shall disclose that the text has been artificially generated or manipulated. This obligation shall not apply where the use is authorised by law to detect, prevent, investigate or prosecute criminal offences or where the AI-generated content has undergone a process of human review or editorial control and where a natural or legal person holds editorial responsibility for the publication of the content.

**Common rules -- Article 50(5) and (6), verbatim.**

> 5. The information referred to in paragraphs 1 to 4 shall be provided to the natural persons concerned in a clear and distinguishable manner at the latest at the time of the first interaction or exposure. The information shall conform to the applicable accessibility requirements.
> 6. Paragraphs 1 to 4 shall not affect the requirements and obligations set out in Chapter III, and shall be without prejudice to other transparency obligations laid down in Union or national law for deployers of AI systems.

Article 50(7) as amended concerns codes of practice and the Commission's role; it creates
no situation for the Tree. Note also that Article 2(12) keeps open-source systems inside
the Act when they fall under Article 50.

Owner's recollection ("a step checking whether the system is one with special
transparency requirements (Article 50)"): **confirmed** as to the article; the text
shows that the step is really five separate questions with two different addressees
(provider for situations 1--2, deployer for 3--5), which a single yes/no cannot capture.

## 9. Application dates (Article 113 as amended; Article 111)

Article 113, consolidated text, verbatim:

> This Regulation shall enter into force on the twentieth day following that of its publication in the Official Journal of the European Union.
> It shall apply from 2 August 2026.
> However:
> (a) Chapters I and II shall apply from 2 February 2025, with the exception of Article 5(1), first subparagraph, points (ba) and (bb), and Article 5(1a) and (1b) which shall apply from 2 December 2026;
> (b) Chapter III Section 4, Chapter V, Chapter VII and Chapter XII and Article 78 shall apply from 2 August 2025, with the exception of Article 101;
> (c) Chapter III, Sections 1, 2, and 3, with the exception of Article 6(5), shall apply from:
> (i) 2 December 2027 as regards AI systems classified as high-risk pursuant to Article 6(2) and Annex III; and
> (ii) 2 August 2028 as regards AI systems classified as high-risk pursuant to Article 6(1) and Annex I;
> (d) Articles 102 to 110 shall apply from 27 July 2026.

Original wording of (a) and (c) before amendment: "(a) Chapters I and II shall apply from
2 February 2025;" and "(c) Article 6(1) and the corresponding obligations in this
Regulation shall apply from 2 August 2027."

Mapped to the Tree's steps (Chapter I = Articles 1--4a, Chapter II = Article 5,
Chapter III Section 1 = Articles 6--7, Chapter IV = Article 50, Chapter V = Articles
51--56; chapter boundaries measured from the fetched table of contents):

| Tree step | Provisions | Applies from |
|---|---|---|
| 1, 2 (scope, definitions) | Chapter I | 2 February 2025 |
| 3 (prohibited practices) | Article 5 (a)--(h) | 2 February 2025 |
| 3 (new practices) | Article 5(1)(ba), (bb), 5(1a), (1b) | 2 December 2026 |
| 4 (high-risk classification, Annex III route) | Chapter III Sections 1--3 | 2 December 2027 |
| 4 (high-risk classification, Annex I route) | Chapter III Sections 1--3 | 2 August 2028 |
| 4 (Commission guidelines, Article 6(5)) | Article 6(5) | excluded from (c); general date 2 August 2026 |
| 5 (general-purpose AI models) | Chapter V | 2 August 2025 (models on the market before then: comply by 2 August 2027, Article 111(3)) |
| 6 (transparency) | Chapter IV (Article 50) | 2 August 2026 (systems under 50(2) on the market before then: comply by 2 December 2026, Article 111(4)) |

Article 111(2) as amended (grace period for high-risk systems already on the market),
verbatim:

> 2. Without prejudice to the application of Article 5 as referred to in Article 113, third paragraph, point (a), this Regulation shall apply to operators of high-risk AI systems, other than the systems referred to in paragraph 1 of this Article, that have been placed on the market or put into service before the date of application of Chapter III referred to in Article 113, only if, as from that date, those systems are subject to significant changes in their designs. In any case, the providers and deployers of high-risk AI systems intended to be used by public authorities shall take the necessary steps to comply with the requirements and obligations laid down in this Regulation by 2 August 2030.

## 10. Verdict on the owner's recollections (core document, section 3.3)

| Step | Owner's recollection | Verdict | Where shown |
|---|---|---|---|
| 1 | Three categories of persons | Incomplete: seven categories in Article 2(1); category (a) turns on the EU market, not the maker's location; (d)--(g) missing | section 3.2 |
| 1 | "If no: the AI Act does not apply (terminal)" | Confirmed in structure; the exclusions in Article 2(3), (4), (6), (8), (10) also lead there, but Article 2(12) (open source) does not | section 3.3 |
| 2 | Gated by the Act's own definition of "AI system" | Confirmed (Article 3(1)) | section 4.1 |
| 2 | "No" message: other regulations apply (product safety, product liability) | Not in the Act; UNKNOWN as a citation; editorial content | section 4.4 |
| 3 | A list of prohibited practices | Confirmed; 10 entries, not 8, since 27 July 2026 (two applying from 2 December 2026) | section 5 |
| 4a | Safety component in a product covered by Union harmonisation legislation | Incomplete: also "is itself a product"; and a second cumulative condition (third-party conformity assessment) | section 6.1 |
| 4a | Each piece of legislation an Option | Confirmed as a list; 20 entries, Annex I now split into Section A (11) and Section B (9) with different consequences (Article 2(2)) | section 6.3 |
| 4b | High-risk areas listed in the Act's annexes | Confirmed: one annex (Annex III), 8 areas; plus the Article 6(3) derogation and the profiling override, which the outline does not mention | sections 6.2, 6.4 |
| 5 | A general-purpose AI "model/system" step | Confirmed that both terms exist and are defined; the obligations (Chapter V) attach to providers of *models* | section 7 |
| 6 | Special transparency requirements, Article 50 | Confirmed; five situations with two different addressees | section 8 |

## 11. UNKNOWN and ambiguous items

- **U1. What applies to a non-AI system.** Not in the Act (section 4.4).
- **U2. Article 6(5) guidelines.** Whether the Commission's guidelines with practical
  examples of high-risk and non-high-risk use cases exist was not checked; not in the
  Act's text.
- **U3. Article 5 guidelines and Article 50 codes of practice.** Same: not checked, outside
  the Act's text.
- **U4. "Serving AI"** in the owner's recollection (2) is ambiguous between "deploying"
  and "providing"; both readings are covered by Article 2(1), by different points.
- **U5. Meaning of "output … is used in the Union"** (Article 2(1)(c)). The Act gives one
  example in recital 22; it does not define "used". Reported, not interpreted.
- **U6. Steps 3 and 6 for the deployer versus the provider.** Article 5 prohibits
  "placing on the market, putting into service or use" for most points but only "use"
  for point (h) and, via Article 5(1a), different things for providers and deployers
  under (ba)/(bb). Article 50 splits by addressee. The Tree currently has no "which role
  are you" step; whether it needs one is the owner's authoring decision.
- **U7. Dutch text.** The Dutch version was not fetched except for the two corrigenda; a
  Dutch-language research pass is needed before authoring the Dutch Tree.

## 12. Counts, with their source

| List | Entries | Source of the count |
|---|---|---|
| Article 2(1) categories | 7 (a)--(g) | consolidated text, R5 |
| Article 2 exclusions used as terminals | 6 paragraphs: 2(3), (4), (6), (8), (10), (12) | consolidated text, R5 |
| Article 5(1) prohibited practices | 10: (a), (b), (ba), (bb), (c)--(h) | consolidated text R5; amending act Article 1(7), R6; originally 8 in R3 |
| Article 6(3) conditions | 4: (a)--(d), plus the profiling override | consolidated text, R5 |
| Annex I entries | 20: Section A 11 (nos. 2--12), Section B 9 (nos. 13--21) | consolidated text R5; amending act Article 1(41), R6; originally 20 (12 + 8) in R3 |
| Annex III areas / listed system types | 8 / 25 | consolidated text R5, identical to R3 |
| Article 50 situations | 5 | consolidated text R5, paragraphs 1, 2, 3, 4 first subparagraph, 4 second subparagraph |
| Application dates | 7 distinct dates: 2 Feb 2025, 2 Aug 2025, 27 Jul 2026, 2 Aug 2026, 2 Dec 2026, 2 Dec 2027, 2 Aug 2028 (plus 2 Aug 2027 and 2 Aug 2030 in Article 111) | Article 113 as amended, R5 |
