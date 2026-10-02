# Issue #171: what the ending's 19 characters and the font library rest on

> Measured on 2026-10-02 by the architect run for issue #171, on Windows 11 with Node 22.18.0,
> Playwright 1.62.1 (its Chromium), Python 3.13.5, fontTools 4.60.0 and the `brotli` module
> 1.2.0. Every number that `docs/adrs/ADR-171-*.md` and the **[#171]** amendments of
> `docs/specs/` cite is here, with the script that produced it and its output as it ran.
> The scripts read this repository at the commit they ran on and a work folder outside it;
> none of them is part of the application. This is a record, not a contract: the contracts
> are the specs and the ADRs. Section 3's second script, `badge-room.mjs`, was run on the
> same day with the same tools by the fix run that answered the review of pull request #185.

## 1. The Terminals of the repository

Counted twice, by the text and by parsing, on `trees/` and `tests/fixtures/`
(`tree-format.md` 12.7.3; `ADR-171-elsa-tree-5.md`):

```
$ grep -r -o '"outcome"' trees tests/fixtures --include=tree.json | wc -l
108
$ grep -r -l '"outcome"' trees tests/fixtures --include=tree.json | wc -l
55
$ find trees tests/fixtures -name tree.json | wc -l
56
```

The parse, with `json.loads` on every `tree.json` (a byte-order mark tolerated, so the one file
that does not parse is the one built not to):

```
56 tree.json files; 55 hold a Terminal; not parsed: ['tests/fixtures/invalid/v-json/tree.json']
Terminals by outcome: {'not-applicable': 54, 'applicable': 49, 'refer': 2, 'maybe': 1, 'prohibited': 2} -- in all 108
```

## 2. The conversion of `tree-format.md` 12.7, run in memory

`convert5.mjs` applies 12.7.1 to every `tree.json` of `trees/` and `tests/fixtures/` without
writing anything back, validates each result against `schemas/elsa-tree-5.json` with Ajv 2020
(the loader's validator), checks that converting the converted example again does nothing,
and tries twelve mutations of the converted example on the schema. Run as
`node convert5.mjs <repository>`.

```js
// The elsa-tree/4 -> elsa-tree/5 conversion of issue #171 (tree-format.md 12.7), run in memory
// over every Tree and fixture of the repository, then the elsa-tree/5 schema against the
// results and against mutations of the example Tree. Temporary; nothing here is written into
// the repository except what is printed.
import { createRequire } from 'node:module'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const repo = process.argv[2]
const require = createRequire(path.join(repo, 'package.json'))
const Ajv2020 = require('ajv/dist/2020.js').default
const schema = JSON.parse(readFileSync(path.join(repo, 'schemas', 'elsa-tree-5.json'), 'utf8'))
const validate = new Ajv2020({ allErrors: true }).compile(schema)

// The badge words of elsa-tree/4, as src/chrome.ts holds them on 2026-10-02 (12.7's table).
const WORDS = {
  en: { 'not-applicable': 'Does not apply', applicable: 'Applies', prohibited: 'Prohibited', refer: 'Look elsewhere' },
  nl: { 'not-applicable': 'Niet van toepassing', applicable: 'Van toepassing', prohibited: 'Verboden', refer: 'Elders geregeld' },
}
// application.md 3.1: chrome follows the content language's primary subtag when it is en or nl, else English.
const chromeOf = (tag) => (tag.split('-')[0] === 'nl' ? 'nl' : 'en')

function convert(tree) {
  const report = { terminals: 0, converted: 0, left: [] }
  if (tree.format !== 'elsa-tree/4') return { tree, report, skipped: `format is ${JSON.stringify(tree.format)}` }
  const out = {}
  for (const [key, value] of Object.entries(tree)) {
    if (key === '$schema') out[key] = typeof value === 'string' ? value.replace(/(^|\/)schemas\/elsa-tree-4\.json$/, '$1schemas/elsa-tree-5.json') : value
    else if (key === 'format') out[key] = 'elsa-tree/5'
    else out[key] = value
  }
  const languages = Array.isArray(tree.languages) ? tree.languages.filter((tag) => typeof tag === 'string') : null
  for (const node of out.nodes ?? []) {
    if (!node || typeof node !== 'object' || !('terminal' in node)) continue
    report.terminals += 1
    const t = node.terminal
    const outcome = t && typeof t === 'object' && !Array.isArray(t) && Object.keys(t).length === 1 ? t.outcome : undefined
    if (!languages || !(outcome in WORDS.en)) {
      report.left.push(`${node.id}: ${JSON.stringify(t)}`)
      continue
    }
    node.terminal = { label: Object.fromEntries(languages.map((tag) => [tag, WORDS[chromeOf(tag)][outcome]])) }
    report.converted += 1
  }
  return { tree: out, report }
}

const serialise = (value) => `${JSON.stringify(value, null, 2)}\n`
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name === 'tree.json') files.push(p)
  }
}
walk(path.join(repo, 'trees'))
walk(path.join(repo, 'tests', 'fixtures'))

let before = 0
let after = 0
const results = {}
for (const file of files.sort()) {
  const rel = path.relative(repo, file).split(path.sep).join('/')
  const bytes = readFileSync(file)
  const text = bytes.toString('utf8')
  before += (text.match(/"outcome"/g) ?? []).length
  // The loader's reader refuses a byte-order mark and a duplicate key (3.7, V-JSON); so does this.
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) { results[rel] = 'refused: byte-order mark'; continue }
  let parsed
  try { parsed = JSON.parse(text) } catch (error) { results[rel] = `refused: ${error.message.slice(0, 50)}`; continue }
  if (rel.includes('duplicate-key')) { results[rel] = 'refused: duplicate key (V-JSON)'; continue }
  const { tree, report, skipped } = convert(parsed)
  if (skipped) { results[rel] = `not converted: ${skipped}`; continue }
  const labels = []
  for (const node of tree.nodes ?? []) if (node?.terminal?.label) labels.push(...Object.values(node.terminal.label))
  after += report.converted
  const longest = Math.max(0, ...labels.map((l) => [...l.trim()].length))
  const valid = validate(tree)
  results[rel] = `${report.converted}/${report.terminals} Terminals labelled, longest label ${longest}; schema ${valid ? 'valid' : 'INVALID: ' + validate.errors.map((e) => `${e.instancePath} ${e.message}`).slice(0, 2).join('; ')}${report.left.length ? '; left: ' + report.left.join(', ') : ''}`
  if (rel === 'trees/ai-act-example/tree.json') results.__example = serialise(tree)
  if (rel === 'trees/ai-act-applicability-agrifood/tree.json') results.__firstTree = tree
  if (rel === 'tests/fixtures/german-only/tree.json' || rel === 'tests/fixtures/other-languages/tree.json' || rel === 'tests/fixtures/single-language/tree.json') {
    results[`__labels ${rel}`] = (tree.nodes ?? []).filter((n) => n.terminal).map((n) => JSON.stringify(n.terminal.label)).join(' ')
  }
}
for (const [rel, line] of Object.entries(results)) if (!rel.startsWith('__')) console.log(`${rel.padEnd(60)} ${line}`)
for (const [rel, line] of Object.entries(results)) if (rel.startsWith('__labels')) console.log(rel, line)
console.log(`\n"outcome" keys before: ${before} in ${files.length} files; Terminals labelled after: ${after}`)

// Idempotence: converting the converted example does nothing.
const example = JSON.parse(results.__example)
const again = convert(example)
console.log(`idempotent on the converted example: ${again.skipped ? 'yes (' + again.skipped + ')' : 'NO'}`)

// The first Tree's four endings, as they will read.
for (const node of results.__firstTree.nodes) if (node.terminal) console.log(`first Tree ${node.id}: ${JSON.stringify(node.terminal.label)}`)

// Mutations of the converted example, each of which the schema must refuse.
const terminalAt = example.nodes.findIndex((node) => node.terminal)
const mutations = {
  'an outcome instead of a label': (t) => { t.nodes[terminalAt].terminal = { outcome: 'prohibited' } },
  'a label and an outcome': (t) => { t.nodes[terminalAt].terminal.outcome = 'prohibited' },
  'no label: terminal {}': (t) => { t.nodes[terminalAt].terminal = {} },
  'an empty label in one language': (t) => { t.nodes[terminalAt].terminal.label.nl = '' },
  'a label as a bare string': (t) => { t.nodes[terminalAt].terminal.label = 'Does not apply' },
  'a label key that is not a language tag': (t) => { t.nodes[terminalAt].terminal.label.EN = 'x' },
  'a label of null': (t) => { t.nodes[terminalAt].terminal.label = null },
  'a label {}': (t) => { t.nodes[terminalAt].terminal.label = {} },
  'a Terminal with Options': (t) => { t.nodes[terminalAt].options = [{ title: { en: 'x', nl: 'x' }, target: 'social-scoring' }] },
  'a Terminal with Answers': (t) => { t.nodes[terminalAt].answers = { yes: 'start', no: 'start' } },
  'format elsa-tree/4': (t) => { t.format = 'elsa-tree/4' },
  '$schema naming elsa-tree-4.json': (t) => { t.$schema = '/schemas/elsa-tree-4.json' },
}
console.log(`\nthe converted example against elsa-tree-5.json: ${validate(example) ? 'valid' : 'INVALID'}`)
for (const [name, mutate] of Object.entries(mutations)) {
  const copy = structuredClone(example)
  mutate(copy)
  const ok = validate(copy)
  console.log(`  ${ok ? 'ACCEPTED (wrong)' : 'refused'}  ${name}${ok ? '' : ': ' + validate.errors.map((e) => `${e.instancePath || '/'} ${e.message}`).slice(0, 2).join('; ')}`)
}
if (process.argv[3]) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(process.argv[3], results.__example)
  console.log(`\nwrote the converted example to ${process.argv[3]}`)
}
```

Output:

```
tests/fixtures/broken/answer-to-explanation/tree.json        1/1 Terminals labelled, longest label 14; schema valid
tests/fixtures/broken/answer-to-missing-node/tree.json       2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/broken/byte-order-mark/tree.json              refused: byte-order mark
tests/fixtures/broken/duplicate-key/tree.json                refused: duplicate key (V-JSON)
tests/fixtures/broken/explainer-malformed/tree.json          2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/broken/explainer-too-long/tree.json           2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/broken/explainers-empty/tree.json             2/2 Terminals labelled, longest label 19; schema INVALID: /nodes/0/explainers must NOT have fewer than 1 items
tests/fixtures/broken/mark-in-manifest/tree.json             2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/broken/mark-inside-strong/tree.json           2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/broken/metadata-all-digits/tree.json          2/2 Terminals labelled, longest label 14; schema INVALID: /metadata must NOT be valid; /metadata property name must be valid
tests/fixtures/broken/option-to-missing-node/tree.json       2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/broken/option-to-terminal/tree.json           2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/broken/terminal-with-options/tree.json        2/2 Terminals labelled, longest label 14; schema INVALID: /nodes/3/options boolean schema is false
tests/fixtures/broken/too-many-explainers/tree.json          2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/carousel/tree.json                            1/1 Terminals labelled, longest label 19; schema valid
tests/fixtures/cycle/tree.json                               1/1 Terminals labelled, longest label 14; schema valid
tests/fixtures/explainers/tree.json                          2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/findability/tree.json                         2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/full-node/tree.json                           2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/german-only/tree.json                         2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-answers/tree.json                   1/1 Terminals labelled, longest label 7; schema INVALID: /nodes/0/answers must have required property 'no'
tests/fixtures/invalid/v-count/tree.json                     2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-cross/tree.json                     1/1 Terminals labelled, longest label 14; schema INVALID: /nodes/0/answers/yes must match pattern "^[a-z0-9]+(-[a-z0-9]+)*$"
tests/fixtures/invalid/v-dir/tree.json                       2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-empty/tree.json                     2/2 Terminals labelled, longest label 14; schema INVALID: /nodes/1/sources must NOT have fewer than 1 items
tests/fixtures/invalid/v-explainer/tree.json                 2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/invalid/v-format/tree.json                    not converted: format is "elsa-tree/3"
tests/fixtures/invalid/v-html/tree.json                      2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-image/tree.json                     2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-json/tree.json                      refused: Expected double-quoted property name in JSON at po
tests/fixtures/invalid/v-keys/tree.json                      2/2 Terminals labelled, longest label 14; schema INVALID: /nodes/0 must NOT have additional properties
tests/fixtures/invalid/v-kind/tree.json                      2/2 Terminals labelled, longest label 14; schema INVALID: /nodes/3/terminal boolean schema is false; /nodes/3/answers boolean schema is false
tests/fixtures/invalid/v-l10n/tree.json                      2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-lang/tree.json                      2/2 Terminals labelled, longest label 14; schema INVALID: /languages must NOT have duplicate items (items ## 0 and 1 are identical)
tests/fixtures/invalid/v-length/tree.json                    2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-lines/tree.json                     2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-mark/tree.json                      2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/invalid/v-meta/tree.json                      2/2 Terminals labelled, longest label 14; schema INVALID: /metadata/version must be string
tests/fixtures/invalid/v-node/tree.json                      2/2 Terminals labelled, longest label 14; schema INVALID: /nodes/1 must have required property 'description'
tests/fixtures/invalid/v-null/tree.json                      2/2 Terminals labelled, longest label 14; schema INVALID: /description must be object
tests/fixtures/invalid/v-options/tree.json                   2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-orphan/tree.json                    2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-plain/tree.json                     2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-reach/tree.json                     3/3 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-root/tree.json                      2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/invalid/v-schema/tree.json                    2/2 Terminals labelled, longest label 14; schema INVALID: /$schema must match pattern "^(?:/|https?://[^\s/?#]+(?:/[^\s?#]*)?/)schemas/elsa-tree-5\.json$"
tests/fixtures/invalid/v-source/tree.json                    2/2 Terminals labelled, longest label 14; schema INVALID: /nodes/0/sources/0/kind must be equal to one of the allowed values
tests/fixtures/invalid/v-terminal/tree.json                  1/2 Terminals labelled, longest label 14; schema INVALID: /nodes/3/terminal must have required property 'label'; /nodes/3/terminal must NOT have additional properties; left: yes-end: {"outcome":"maybe"}
tests/fixtures/invalid/v-theme/tree.json                     2/2 Terminals labelled, longest label 14; schema INVALID: /theme/colours must have required property 'danger'
tests/fixtures/invalid/v-title/tree.json                     2/2 Terminals labelled, longest label 14; schema INVALID:  must have required property 'title'
tests/fixtures/other-languages/tree.json                     2/2 Terminals labelled, longest label 14; schema valid
tests/fixtures/overlay/tree.json                             1/1 Terminals labelled, longest label 19; schema valid
tests/fixtures/single-language/tree.json                     2/2 Terminals labelled, longest label 19; schema valid
tests/fixtures/tied-sources/tree.json                        2/2 Terminals labelled, longest label 14; schema valid
trees/ai-act-applicability-agrifood/tree.json                4/4 Terminals labelled, longest label 19; schema valid
trees/ai-act-example/tree.json                               3/3 Terminals labelled, longest label 19; schema valid
__labels tests/fixtures/german-only/tree.json {"de":"Applies"} {"de":"Does not apply"}
__labels tests/fixtures/other-languages/tree.json {"de":"Applies","fr":"Applies"} {"de":"Does not apply","fr":"Does not apply"}
__labels tests/fixtures/single-language/tree.json {"nl":"Niet van toepassing"} {"nl":"Van toepassing"}

"outcome" keys before: 108 in 56 files; Terminals labelled after: 101
idempotent on the converted example: yes (format is "elsa-tree/5")
first Tree ai-act-does-not-apply: {"en":"Does not apply","nl":"Niet van toepassing"}
first Tree end-of-walk: {"en":"Applies","nl":"Van toepassing"}
first Tree not-an-ai-system: {"en":"Look elsewhere","nl":"Elders geregeld"}
first Tree prohibited: {"en":"Prohibited","nl":"Verboden"}

the converted example against elsa-tree-5.json: valid
  refused  an outcome instead of a label: /nodes/1/terminal must have required property 'label'; /nodes/1/terminal must NOT have additional properties
  refused  a label and an outcome: /nodes/1/terminal must NOT have additional properties
  refused  no label: terminal {}: /nodes/1/terminal must have required property 'label'
  refused  an empty label in one language: /nodes/1/terminal/label/nl must NOT have fewer than 1 characters
  refused  a label as a bare string: /nodes/1/terminal/label must be object
  refused  a label key that is not a language tag: /nodes/1/terminal/label must match pattern "^[a-z]{2,3}(-[a-z0-9]{2,8})*$"; /nodes/1/terminal/label property name must be valid
  refused  a label of null: /nodes/1/terminal/label must be object
  refused  a label {}: /nodes/1/terminal/label must NOT have fewer than 1 properties
  refused  a Terminal with Options: /nodes/1/options boolean schema is false
  refused  a Terminal with Answers: /nodes/1/terminal boolean schema is false; /nodes/1/answers boolean schema is false
  refused  format elsa-tree/4: /format must be equal to constant
  refused  $schema naming elsa-tree-4.json: /$schema must match pattern "^(?:/|https?://[^\s/?#]+(?:/[^\s?#]*)?/)schemas/elsa-tree-5\.json$"
```

## 3. The ending badge: its room, and the width of 19 and 20 characters

**The room**, from `src/app/[lang]/globals.css` as it stands on `dev`: the badge (`.outcome`)
is absolutely placed in the Bubble's padding box with `right: calc(50% + var(--up-size) / 2)`
and `max-width: calc(50% - var(--up-size) / 2)`, so it is at most half the padding box less
24 pixels; the padding box is the Bubble less its two 2-pixel borders. The Bubble is 760 wide
down to a 792-pixel window (`--bubble-width`, with `--column: 200px` from 1279 and 0 from
1199), and below that the window less the page inset of 16 a side (`main { padding: 0
var(--page-inset) }`). Below 480 pixels the badge stands across the band, `max-width:
calc(100% - 24px)`. So:

| Window width | Bubble | The badge's room |
|---|---|---|
| 792 and wider | 760 | (756 / 2) - 24 = **354** |
| 480 to 791 | width - 32 | ((width - 36) / 2) - 24: **198 at 480** |
| 321 to 479 | width - 32 | width - 60: 261 at 321, 300 at 360 |

**The text**, measured by `badge-final.mjs` in Chromium in the badge's own style -- 11 px,
weight 700, capitals, 14 px of padding and a 1 px border each side -- at its tracking of
0.12 em and at 0.04 em, for fifteen distinct endings of 18 to 20 characters, in seven faces:
the library's four (section 5), Arial Bold and Segoe UI Bold (the default stack's faces on
Windows; Liberation Sans, which the CI runner draws, has Arial's metrics) and DejaVu Sans Bold
2.37 (the widest fallback, `application.md` 10.7). Not measured: San Francisco, the face the
default stack names first on Apple's systems (`-apple-system`, `BlinkMacSystemFont`,
`src/theme.ts`), and Helvetica Neue, which it names fifth; neither is installed on the
machine these scripts ran on. Run as
`node badge-final.mjs <repository> <work folder>`, with the library built (section 5) and
`ref/DejaVuSans-Bold.ttf` from the `dejavu-fonts-ttf-2.37.zip` release in the work folder.

```js
// The ending badge of globals.css (.outcome) measured in Chromium: fifteen distinct endings of
// 18 to 20 characters, at the badge's 0.12 em tracking and at 0.04 em, in every face a badge
// can be drawn in. Usage: node badge-final.mjs <repo> <work folder>. (issue #171)
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const [repo, work] = process.argv.slice(2)
const require = createRequire(path.join(repo, 'package.json'))
const { chromium } = require('@playwright/test')

const url = (file, type) => `url(data:font/${type};base64,${readFileSync(path.join(work, file)).toString('base64')})`
const faces = [
  ['Open Sans (library)', `@font-face{font-family:'F1';font-weight:400 700;src:${url('library/fonts/open-sans/open-sans-normal.woff2', 'woff2')}}`, "'F1'"],
  ['Roboto (library)', `@font-face{font-family:'F2';font-weight:400 700;src:${url('library/fonts/roboto/roboto-normal.woff2', 'woff2')}}`, "'F2'"],
  ['Atkinson Hyperlegible Next (library)', `@font-face{font-family:'F3';font-weight:400 700;src:${url('library/fonts/atkinson-hyperlegible-next/atkinson-hyperlegible-next-normal.woff2', 'woff2')}}`, "'F3'"],
  ['Faustina (library)', `@font-face{font-family:'F4';font-weight:400 700;src:${url('library/fonts/faustina/faustina-normal.woff2', 'woff2')}}`, "'F4'"],
  ['DejaVu Sans Bold 2.37', `@font-face{font-family:'F5';font-weight:700;src:${url('ref/DejaVuSans-Bold.ttf', 'ttf')}}`, "'F5'"],
  ['Arial Bold (Windows)', '', 'Arial'],
  ['Segoe UI Bold (Windows)', '', "'Segoe UI'"],
]
const endings = [
  'Vergunning vereist',
  'Niet van toepassing', 'Maatregelen vereist', 'Hoog risico: melden', 'Wettelijk verboden!',
  'Mandatory safeguard', 'Women at work only!', 'Moderate to high MW',
  'Raadpleeg een jurist', 'Ethisch aanvaardbaar', 'Waarborgen verplicht', 'Mandatory safeguards',
  'Seek specialist help', 'Not an AI system yet', 'Zulässig mit Auflage',
]
const style = (tracking) => `display:inline-block;white-space:nowrap;padding:0 14px;border:1px solid;font-size:11px;line-height:22px;font-weight:700;letter-spacing:${tracking};text-transform:uppercase`
const html = `<!doctype html><html><head><style>${faces.map(([, css]) => css).join('\n')}</style></head><body>
${faces.map(([name, , stack]) => ['0.12em', '0.04em'].map((t) => `<div data-face="${name}" data-tracking="${t}" style="font-family:${stack}">${endings.map((e) => `<span style="${style(t)}">${e}</span>`).join('')}</div>`).join('\n')).join('\n')}
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
const rows = await page.evaluate(() => [...document.querySelectorAll('[data-face]')].map((div) => ({
  face: div.dataset.face,
  tracking: div.dataset.tracking,
  widths: [...div.querySelectorAll('span')].map((s) => [s.textContent, [...s.textContent].length, s.getBoundingClientRect().width]),
})))
console.log(`${new Set(endings).size} distinct endings: ${endings.map((e) => `${e} (${[...e].length})`).join(', ')}`)
for (const { face, tracking, widths } of rows) {
  const widest = widths.reduce((a, b) => (b[2] > a[2] ? b : a))
  const niet = widths.find(([t]) => t === 'Niet van toepassing')[2]
  const over = widths.filter(([, , w]) => w > 198).map(([t, n, w]) => `${t} (${n}) ${w.toFixed(1)}`)
  console.log(`${face.padEnd(38)} ${tracking}  Niet van toepassing ${niet.toFixed(1)}  widest ${widest[0]} (${widest[1]}) ${widest[2].toFixed(1)}  over 198: ${over.length ? over.join(', ') : 'none'}`)
}
await browser.close()
```

Output:

```
15 distinct endings: Vergunning vereist (18), Niet van toepassing (19), Maatregelen vereist (19), Hoog risico: melden (19), Wettelijk verboden! (19), Mandatory safeguard (19), Women at work only! (19), Moderate to high MW (19), Raadpleeg een jurist (20), Ethisch aanvaardbaar (20), Waarborgen verplicht (20), Mandatory safeguards (20), Seek specialist help (20), Not an AI system yet (20), Zulässig mit Auflage (20)
Open Sans (library)                    0.12em  Niet van toepassing 178.0  widest Mandatory safeguards (20) 202.3  over 198: Mandatory safeguards (20) 202.3
Open Sans (library)                    0.04em  Niet van toepassing 161.3  widest Mandatory safeguards (20) 184.7  over 198: none
Roboto (library)                       0.12em  Niet van toepassing 172.0  widest Mandatory safeguards (20) 195.0  over 198: none
Roboto (library)                       0.04em  Niet van toepassing 155.3  widest Mandatory safeguards (20) 177.4  over 198: none
Atkinson Hyperlegible Next (library)   0.12em  Niet van toepassing 177.8  widest Mandatory safeguards (20) 197.5  over 198: none
Atkinson Hyperlegible Next (library)   0.04em  Niet van toepassing 161.1  widest Mandatory safeguards (20) 179.9  over 198: none
Faustina (library)                     0.12em  Niet van toepassing 170.2  widest Mandatory safeguards (20) 193.2  over 198: none
Faustina (library)                     0.04em  Niet van toepassing 153.5  widest Mandatory safeguards (20) 175.6  over 198: none
DejaVu Sans Bold 2.37                  0.12em  Niet van toepassing 194.2  widest Mandatory safeguards (20) 221.5  over 198: Maatregelen vereist (19) 201.3, Wettelijk verboden! (19) 198.2, Mandatory safeguard (19) 212.3, Women at work only! (19) 206.2, Moderate to high MW (19) 206.1, Raadpleeg een jurist (20) 203.1, Ethisch aanvaardbaar (20) 216.3, Waarborgen verplicht (20) 217.8, Mandatory safeguards (20) 221.5, Seek specialist help (20) 198.0, Not an AI system yet (20) 200.9, Zulässig mit Auflage (20) 204.2
DejaVu Sans Bold 2.37                  0.04em  Niet van toepassing 177.4  widest Mandatory safeguards (20) 203.9  over 198: Ethisch aanvaardbaar (20) 198.7, Waarborgen verplicht (20) 200.2, Mandatory safeguards (20) 203.9
Arial Bold (Windows)                   0.12em  Niet van toepassing 179.8  widest Mandatory safeguards (20) 206.3  over 198: Ethisch aanvaardbaar (20) 201.2, Waarborgen verplicht (20) 203.7, Mandatory safeguards (20) 206.3
Arial Bold (Windows)                   0.04em  Niet van toepassing 163.0  widest Mandatory safeguards (20) 188.7  over 198: none
Segoe UI Bold (Windows)                0.12em  Niet van toepassing 175.3  widest Mandatory safeguards (20) 199.6  over 198: Mandatory safeguards (20) 199.6
Segoe UI Bold (Windows)                0.04em  Niet van toepassing 158.6  widest Mandatory safeguards (20) 182.0  over 198: none
```

Read with the room: at 0.12 em, three 20-character endings exceed the 198 pixels at 480 wide
in Arial Bold, one in Open Sans and in Segoe UI Bold; at 0.04 em none does in any face but
DejaVu Sans Bold, where three of the seven 20-character endings do, by at most 5.9 pixels --
a second line between 480 and 491 pixels wide. `Niet van toepassing`, the longest word the
conversion writes, is 178.0 pixels in Open Sans at 0.12 em, the 178 that issue #82 measured
on the running page. The first version of `ADR-171-ending-text.md` took 20 characters and
0.04 em below 792 pixels wide from this, and counted DejaVu Sans Bold's second line as
harmless; the review of pull request #185 found that it is not, and the next script measures
it.

**The badge in place, and 19 characters.** The widths above are each badge alone, on one line.
`badge-room.mjs` places the same fifteen endings where and as `globals.css` places the badge --
absolutely, in the padding box of the Bubble at a 480-pixel window, with the stylesheet's
`border-box` sizing -- so a text wider than the room wraps as it would on the page, and it reads
each badge's height: 24 pixels is one line, 46 is two. The band above the text area is 24
pixels inside the outline (`--rim-y`) and the badge stands 2 pixels down in it, so a second line
reaches 24 pixels into the text area, over the title, which is the text area's first line
below 792 pixels wide (`application.md` 10.5's step 5 hides the main image there). It adds one
face, DejaVu Sans as installed, and names the face Chromium drew each row in, since a machine
without the face a row names draws another. Run as `node badge-room.mjs <repository> <work
folder>` in the work folder of `badge-final.mjs`, built again for this run: `library.py`
(section 5) gave every file the hash it shows there, and `ref/DejaVuSans-Bold.ttf` is the 2.37
release's.

```js
// The ending badge as globals.css places it (.outcome) in the Bubble's padding box at a 480-pixel
// window: 444 pixels wide, so the badge's room is 198. The fifteen endings of badge-final.mjs, in
// the same faces and in an installed DejaVu Sans, at 0.04 em (the tracking below 792 pixels
// wide) and 0.12 em; each badge's height says whether it holds one line (24) or takes a second
// (46), and each row names the face Chromium drew it in. Usage: node badge-room.mjs <repo>
// <work folder>. (issue #171, the review of PR #185)
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const [repo, work] = process.argv.slice(2)
const require = createRequire(path.join(repo, 'package.json'))
const { chromium } = require('@playwright/test')

const url = (file, type) => `url(data:font/${type};base64,${readFileSync(path.join(work, file)).toString('base64')})`
const faces = [
  ['Open Sans (library)', `@font-face{font-family:'F1';font-weight:400 700;src:${url('library/fonts/open-sans/open-sans-normal.woff2', 'woff2')}}`, "'F1'"],
  ['Roboto (library)', `@font-face{font-family:'F2';font-weight:400 700;src:${url('library/fonts/roboto/roboto-normal.woff2', 'woff2')}}`, "'F2'"],
  ['Atkinson Hyperlegible Next (library)', `@font-face{font-family:'F3';font-weight:400 700;src:${url('library/fonts/atkinson-hyperlegible-next/atkinson-hyperlegible-next-normal.woff2', 'woff2')}}`, "'F3'"],
  ['Faustina (library)', `@font-face{font-family:'F4';font-weight:400 700;src:${url('library/fonts/faustina/faustina-normal.woff2', 'woff2')}}`, "'F4'"],
  ['DejaVu Sans Bold 2.37', `@font-face{font-family:'F5';font-weight:700;src:${url('ref/DejaVuSans-Bold.ttf', 'ttf')}}`, "'F5'"],
  ['Arial Bold (Windows)', '', 'Arial'],
  ['Segoe UI Bold (Windows)', '', "'Segoe UI'"],
  ['DejaVu Sans Bold (installed)', '', "'DejaVu Sans'"],
]
const endings = [
  'Vergunning vereist',
  'Niet van toepassing', 'Maatregelen vereist', 'Hoog risico: melden', 'Wettelijk verboden!',
  'Mandatory safeguard', 'Women at work only!', 'Moderate to high MW',
  'Raadpleeg een jurist', 'Ethisch aanvaardbaar', 'Waarborgen verplicht', 'Mandatory safeguards',
  'Seek specialist help', 'Not an AI system yet', 'Zulässig mit Auflage',
]
// .outcome of globals.css, with --up-size 48px and the stylesheet's border-box sizing; the box is
// the padding box of a 448-pixel Bubble (a 480 window less the page inset of 16 a side) inside
// its two 2-pixel borders. The probe, a badge of many short words, fills the room.
const outcome = (tracking) => `position:absolute;top:2px;left:0;right:calc(50% + 24px);width:fit-content;max-width:calc(50% - 24px);margin:0 auto;padding:0 14px;border:1px solid;border-radius:999px;font-size:11px;line-height:22px;font-weight:700;letter-spacing:${tracking};text-transform:uppercase`
const box = 'position:relative;width:444px;height:60px'
const html = `<!doctype html><html><head><style>*,*::before,*::after{box-sizing:border-box}
${faces.map(([, css]) => css).join('\n')}</style></head><body>
${faces.map(([name, , stack]) => ['0.04em', '0.12em'].map((t) => endings.map((e) => `<div style="${box};font-family:${stack}"><p data-face="${name}" data-tracking="${t}" style="${outcome(t)}">${e}</p></div>`).join('')).join('\n')).join('\n')}
<div style="${box}"><p id="probe" style="${outcome('0.04em')}">${'WWW '.repeat(30)}</p></div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
const room = await page.evaluate(() => document.getElementById('probe').getBoundingClientRect().width)
const badges = await page.evaluate(() => [...document.querySelectorAll('p[data-face]')].map((p) => {
  const r = p.getBoundingClientRect()
  return { face: p.dataset.face, tracking: p.dataset.tracking, text: p.textContent, n: [...p.textContent].length, width: r.width, height: r.height }
}))
// The face Chromium drew each row in, from the DevTools protocol: a stack names a face, and a
// machine without it draws another.
const cdp = await page.context().newCDPSession(page)
await cdp.send('DOM.enable')
await cdp.send('CSS.enable')
const { root } = await cdp.send('DOM.getDocument', { depth: -1 })
const drawnIn = {}
for (const [face] of faces) {
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `p[data-face="${face}"]` })
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
  drawnIn[face] = fonts.map((f) => f.familyName).join(' + ')
}
await browser.close()

console.log(`the badge's room at a 480-pixel window: ${room.toFixed(1)} pixels`)
for (const [face] of faces) {
  for (const tracking of ['0.04em', '0.12em']) {
    const rows = badges.filter((b) => b.face === face && b.tracking === tracking)
    const of19 = rows.filter((b) => b.n <= 19)
    const widest19 = of19.reduce((a, b) => (b.width > a.width ? b : a))
    const two = rows.filter((b) => b.height > 30).map((b) => `${b.text} (${b.n}) ${b.height.toFixed(0)}px tall`)
    console.log(`${face.padEnd(38)} ${tracking}  drawn in ${drawnIn[face]}  widest of at most 19: ${widest19.text} ${widest19.width.toFixed(1)}  one line: ${rows.length - two.length}/${rows.length}  two lines: ${two.length ? two.join(', ') : 'none'}`)
  }
}
// Liberation Sans, which the CI runner draws the default stack in, has Arial's metrics.
const arial = badges.filter((b) => b.face === 'Arial Bold (Windows)' && b.tracking === '0.04em')
console.log(`each ending in Arial Bold at 0.04em: ${arial.map((b) => `${b.text} (${b.n}) ${b.width.toFixed(1)}`).join(', ')}`)
```

Output on Windows 11, as `badge-final.mjs` ran (DejaVu Sans is not installed there, so its
last two rows are drawn in a fallback):

```
the badge's room at a 480-pixel window: 198.0 pixels
Open Sans (library)                    0.04em  drawn in Open Sans  widest of at most 19: Mandatory safeguard 178.2  one line: 15/15  two lines: none
Open Sans (library)                    0.12em  drawn in Open Sans  widest of at most 19: Mandatory safeguard 195.0  one line: 14/15  two lines: Mandatory safeguards (20) 46px tall
Roboto (library)                       0.04em  drawn in Roboto  widest of at most 19: Mandatory safeguard 170.2  one line: 15/15  two lines: none
Roboto (library)                       0.12em  drawn in Roboto  widest of at most 19: Mandatory safeguard 186.9  one line: 15/15  two lines: none
Atkinson Hyperlegible Next (library)   0.04em  drawn in Atkinson Hyperlegible Next  widest of at most 19: Mandatory safeguard 172.8  one line: 15/15  two lines: none
Atkinson Hyperlegible Next (library)   0.12em  drawn in Atkinson Hyperlegible Next  widest of at most 19: Mandatory safeguard 189.5  one line: 15/15  two lines: none
Faustina (library)                     0.04em  drawn in Faustina Light  widest of at most 19: Mandatory safeguard 169.3  one line: 15/15  two lines: none
Faustina (library)                     0.12em  drawn in Faustina Light  widest of at most 19: Mandatory safeguard 186.0  one line: 15/15  two lines: none
DejaVu Sans Bold 2.37                  0.04em  drawn in DejaVu Sans  widest of at most 19: Mandatory safeguard 195.5  one line: 12/15  two lines: Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall
DejaVu Sans Bold 2.37                  0.12em  drawn in DejaVu Sans  widest of at most 19: Maatregelen vereist 198.0  one line: 3/15  two lines: Maatregelen vereist (19) 46px tall, Wettelijk verboden! (19) 46px tall, Mandatory safeguard (19) 46px tall, Women at work only! (19) 46px tall, Moderate to high MW (19) 46px tall, Raadpleeg een jurist (20) 46px tall, Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall, Seek specialist help (20) 46px tall, Not an AI system yet (20) 46px tall, Zulässig mit Auflage (20) 46px tall
Arial Bold (Windows)                   0.04em  drawn in Arial  widest of at most 19: Mandatory safeguard 181.0  one line: 15/15  two lines: none
Arial Bold (Windows)                   0.12em  drawn in Arial  widest of at most 19: Mandatory safeguard 197.7  one line: 12/15  two lines: Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall
Segoe UI Bold (Windows)                0.04em  drawn in Segoe UI  widest of at most 19: Mandatory safeguard 175.4  one line: 15/15  two lines: none
Segoe UI Bold (Windows)                0.12em  drawn in Segoe UI  widest of at most 19: Mandatory safeguard 192.1  one line: 14/15  two lines: Mandatory safeguards (20) 46px tall
DejaVu Sans Bold (installed)           0.04em  drawn in Times New Roman  widest of at most 19: Mandatory safeguard 181.7  one line: 15/15  two lines: none
DejaVu Sans Bold (installed)           0.12em  drawn in Times New Roman  widest of at most 19: Mandatory safeguard 198.0  one line: 11/15  two lines: Mandatory safeguard (19) 46px tall, Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall
each ending in Arial Bold at 0.04em: Vergunning vereist (18) 162.6, Niet van toepassing (19) 163.0, Maatregelen vereist (19) 172.6, Hoog risico: melden (19) 166.1, Wettelijk verboden! (19) 169.8, Mandatory safeguard (19) 181.0, Women at work only! (19) 172.4, Moderate to high MW (19) 171.8, Raadpleeg een jurist (20) 175.7, Ethisch aanvaardbaar (20) 183.6, Waarborgen verplicht (20) 186.1, Mandatory safeguards (20) 188.7, Seek specialist help (20) 169.0, Not an AI system yet (20) 166.8, Zulässig mit Auflage (20) 172.2
```

Output in Linux, in the `mcr.microsoft.com/playwright:v1.62.1-noble` image -- its Chromium,
the repository's `@playwright/test` 1.62.1, and `fonts-dejavu-core` 2.37-8 installed with
`apt-get` -- where `Arial` resolves to Liberation Sans, as on the CI runner, and `Segoe UI`, not
installed, to a fallback:

```
the badge's room at a 480-pixel window: 198.0 pixels
Open Sans (library)                    0.04em  drawn in Open Sans  widest of at most 19: Mandatory safeguard 178.4  one line: 15/15  two lines: none
Open Sans (library)                    0.12em  drawn in Open Sans  widest of at most 19: Mandatory safeguard 195.1  one line: 14/15  two lines: Mandatory safeguards (20) 46px tall
Roboto (library)                       0.04em  drawn in Roboto  widest of at most 19: Mandatory safeguard 170.4  one line: 15/15  two lines: none
Roboto (library)                       0.12em  drawn in Roboto  widest of at most 19: Mandatory safeguard 187.1  one line: 15/15  two lines: none
Atkinson Hyperlegible Next (library)   0.04em  drawn in Atkinson Hyperlegible Next  widest of at most 19: Mandatory safeguard 173.4  one line: 15/15  two lines: none
Atkinson Hyperlegible Next (library)   0.12em  drawn in Atkinson Hyperlegible Next  widest of at most 19: Mandatory safeguard 190.1  one line: 14/15  two lines: Mandatory safeguards (20) 46px tall
Faustina (library)                     0.04em  drawn in Faustina Light  widest of at most 19: Mandatory safeguard 170.4  one line: 15/15  two lines: none
Faustina (library)                     0.12em  drawn in Faustina Light  widest of at most 19: Mandatory safeguard 187.1  one line: 15/15  two lines: none
DejaVu Sans Bold 2.37                  0.04em  drawn in DejaVu Sans  widest of at most 19: Mandatory safeguard 197.4  one line: 12/15  two lines: Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall
DejaVu Sans Bold 2.37                  0.12em  drawn in DejaVu Sans  widest of at most 19: Maatregelen vereist 198.0  one line: 3/15  two lines: Maatregelen vereist (19) 46px tall, Wettelijk verboden! (19) 46px tall, Mandatory safeguard (19) 46px tall, Women at work only! (19) 46px tall, Moderate to high MW (19) 46px tall, Raadpleeg een jurist (20) 46px tall, Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall, Seek specialist help (20) 46px tall, Not an AI system yet (20) 46px tall, Zulässig mit Auflage (20) 46px tall
Arial Bold (Windows)                   0.04em  drawn in Liberation Sans  widest of at most 19: Mandatory safeguard 181.0  one line: 15/15  two lines: none
Arial Bold (Windows)                   0.12em  drawn in Liberation Sans  widest of at most 19: Mandatory safeguard 197.7  one line: 12/15  two lines: Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall
Segoe UI Bold (Windows)                0.04em  drawn in Liberation Serif  widest of at most 19: Mandatory safeguard 181.7  one line: 15/15  two lines: none
Segoe UI Bold (Windows)                0.12em  drawn in Liberation Serif  widest of at most 19: Mandatory safeguard 198.0  one line: 11/15  two lines: Mandatory safeguard (19) 46px tall, Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall
DejaVu Sans Bold (installed)           0.04em  drawn in DejaVu Sans  widest of at most 19: Mandatory safeguard 195.5  one line: 12/15  two lines: Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall
DejaVu Sans Bold (installed)           0.12em  drawn in DejaVu Sans  widest of at most 19: Maatregelen vereist 198.0  one line: 3/15  two lines: Maatregelen vereist (19) 46px tall, Wettelijk verboden! (19) 46px tall, Mandatory safeguard (19) 46px tall, Women at work only! (19) 46px tall, Moderate to high MW (19) 46px tall, Raadpleeg een jurist (20) 46px tall, Ethisch aanvaardbaar (20) 46px tall, Waarborgen verplicht (20) 46px tall, Mandatory safeguards (20) 46px tall, Seek specialist help (20) 46px tall, Not an AI system yet (20) 46px tall, Zulässig mit Auflage (20) 46px tall
each ending in Arial Bold at 0.04em: Vergunning vereist (18) 162.6, Niet van toepassing (19) 163.0, Maatregelen vereist (19) 172.6, Hoog risico: melden (19) 166.1, Wettelijk verboden! (19) 169.8, Mandatory safeguard (19) 181.0, Women at work only! (19) 172.4, Moderate to high MW (19) 171.8, Raadpleeg een jurist (20) 175.7, Ethisch aanvaardbaar (20) 183.6, Waarborgen verplicht (20) 186.1, Mandatory safeguards (20) 188.7, Seek specialist help (20) 169.0, Not an AI system yet (20) 166.8, Zulässig mit Auflage (20) 172.2
```

Read with the room: at 0.04 em every ending of at most 19 characters holds one line in every
face of the default stack and the library that was measured, on Windows and in Linux. The
widest, `Mandatory safeguard` in DejaVu Sans Bold, is 195.5 of the 198 pixels on Windows, from
the release's file, and in Linux where DejaVu Sans is installed; and 197.4 where Linux draws the
release's file as a web font, as a Tree's Theme would serve it. Three of the seven 20-character
endings take a second line in DejaVu Sans Bold on both systems, a badge 46 pixels tall. At 0.12
em, 19 characters hold one line in every face of the stack and the library but DejaVu Sans Bold,
where five of the seven endings of 19 take a second line, and Arial Bold's widest, like
Liberation Sans's, is 197.7. Hence `ADR-171-ending-text.md` decisions 2 and 6: 19 characters,
and 0.04 em below 792 pixels wide.

## 4. The candidate families

Downloaded from `https://raw.githubusercontent.com/google/fonts/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/<folder>/`:
each folder's upright and italic variable TTF and its `OFL.txt`. `candidates.py` builds each by
the library's recipe (`ADR-171-font-library.md`; `recipe.py` is that block, verbatim), reads
its copyright statements for a Reserved Font Name -- the font file's copyright record, and the
part of `OFL.txt` above the licence's first sentence, because the licence text below it
defines the term and would match every file -- and measures its average advance on the two
Trees' own text against Open Sans built the same way. Run as
`python candidates.py <repository> <work folder>`.

```python
"""Every font family considered for the library of issue #171, in one table.

Usage: python candidates.py <repository> <work folder>
The work folder holds src/<google-fonts folder>/ with the upstream variable TTFs and OFL.txt
from github.com/google/fonts at 9710da1eacb3be272583c3224dcb70f9da6eadbb, and recipe.py --
the recipe of docs/adrs/ADR-171-font-library.md, verbatim. Each family is built by that
recipe and measured against Open Sans built the same way, on the two Trees' own text.
"""
import glob
import importlib.util
import io
import json
import os
import re
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

repo, work = sys.argv[1], sys.argv[2]
spec = importlib.util.spec_from_file_location('recipe', os.path.join(work, 'recipe.py'))
recipe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recipe)

# The counted text of tree-format.md 3.8: trimmed, a Markdown link counted as its text.
LINK = re.compile(r'\[([^\]]*)\]\([^)]*\)')
body, titles = [], []
for tree in ('ai-act-applicability-agrifood', 'ai-act-example'):
    for node in json.load(open(os.path.join(repo, 'trees', tree, 'tree.json'), encoding='utf-8'))['nodes']:
        for lang in ('en', 'nl'):
            body.append(LINK.sub(r'\1', node['description'][lang].strip()))
            titles.append(LINK.sub(r'\1', node['title'][lang].strip()))
body_text, title_text = ''.join(body), ''.join(titles)
print(f'corpus: {sum(len(s) for s in body)} description characters, {sum(len(s) for s in titles)} title characters')


def em(data, wght, text):
    font = instancer.instantiateVariableFont(TTFont(io.BytesIO(data)), {'wght': wght})
    cmap, hmtx, upm = font.getBestCmap(), font['hmtx'], font['head'].unitsPerEm
    chars = [c for c in text if c != '\n']
    return sum(hmtx[cmap.get(ord(c), '.notdef')][0] for c in chars) / upm / len(chars)


rows = []
for folder in sorted(os.listdir(os.path.join(work, 'src'))):
    ttfs = sorted(glob.glob(os.path.join(work, 'src', folder, '*.ttf')))
    upright = [p for p in ttfs if 'Italic' not in os.path.basename(p)][0]
    italic = [p for p in ttfs if 'Italic' in os.path.basename(p)][0]
    original = TTFont(upright)
    names = {r.nameID: r.toUnicode() for r in original['name'].names if r.platformID == 3 and r.langID == 0x409}
    # The copyright statement is what stands above the licence's first sentence: the licence
    # text below it defines the term "Reserved Font Name", so it cannot be searched whole.
    statement = open(os.path.join(work, 'src', folder, 'OFL.txt'), encoding='utf-8').read().split('This Font Software is licensed under')[0]
    normal, slanted = recipe.build(upright), recipe.build(italic)
    rows.append({
        'folder': folder,
        'family': names.get(16, names.get(1)),
        'rfn_file': 'Reserved Font Name' in names.get(0, ''),
        'rfn_ofl': 'Reserved Font Name' in statement,
        'xheight': original['OS/2'].sxHeight / original['head'].unitsPerEm,
        'fstype': original['OS/2'].fsType,
        'body': em(normal, 400, body_text),
        'title': em(normal, 700, title_text),
        'italic': em(slanted, 400, body_text),
        'bytes': len(normal) + len(slanted),
    })

ref = next(r for r in rows if r['folder'] == 'opensans')
print(f"{'google/fonts folder':<26}{'RFN file':>9}{'RFN OFL':>8}{'x-height':>9}{'fsType':>7}{'body':>7}{'title':>7}{'italic':>7}{'bytes':>9}")
for r in sorted(rows, key=lambda r: max(r['body'] / ref['body'], r['title'] / ref['title'])):
    print(f"{r['folder']:<26}{'yes' if r['rfn_file'] else 'no':>9}{'yes' if r['rfn_ofl'] else 'no':>8}{r['xheight']:>9.3f}{r['fstype']:>7}"
          f"{r['body'] / ref['body']:>7.3f}{r['title'] / ref['title']:>7.3f}{r['italic'] / ref['italic']:>7.3f}{r['bytes']:>9}")
print('body, title, italic: average advance on the corpus at 400 (descriptions), 700 (titles) and italic 400, as a multiple of Open Sans; bytes: both files by the recipe')
```

Output:

```
corpus: 19219 description characters, 6532 title characters
google/fonts folder        RFN file RFN OFL x-height fsType   body  title italic    bytes
ebgaramond                       no      no    0.400      0  0.816  0.841  0.838   372584
crimsonpro                       no      no    0.420      0  0.853  0.852  0.836   117456
alegreya                         no      no    0.452      0  0.873  0.832  0.819   149536
newsreader                       no      no    0.426      0  0.873  0.876  0.858   134740
faustina                         no      no    0.494      0  0.879  0.879  0.856    79552
piazzolla                        no      no    0.478      0  0.886  0.864  0.895   116736
petrona                          no      no    0.443      0  0.924  0.921  0.908   117068
roboto                           no      no    0.528      0  0.944  0.904  0.970   105416
vollkorn                         no      no    0.458      0  0.934  0.950  0.858   176428
atkinsonhyperlegiblenext         no      no    0.496      0  0.949  0.952  1.003    54844
sourceserif4                    yes      no    0.475      0  0.958  0.931  0.945   130316
andadapro                        no      no    0.494      0  0.984  0.955  0.934   178100
bitter                           no     yes    0.522      0  0.989  0.953  1.008   125340
publicsans                       no      no    0.517      0  0.990  0.959  1.015    66128
brygada1918                      no      no    0.460      0  0.994  0.967  0.988   112952
opensans                         no      no    0.535      0  1.000  1.000  1.000    87700
inter                            no      no    0.546      0  1.017  0.985  1.078   201584
notoserif                        no      no    0.536      0  1.024  1.020  1.053   289888
literata                         no      no    0.507      0  1.018  1.029  1.018   164080
gelasio                          no      no    0.481      0  0.951  1.035  1.021   128076
besley                           no      no    0.520      0  1.079  1.099  1.123    83180
body, title, italic: average advance on the corpus at 400 (descriptions), 700 (titles) and italic 400, as a multiple of Open Sans; bytes: both files by the recipe
```

A first pass that read only the first line of each `OFL.txt` missed Bitter's reserved name,
which its statement gives on the second line ("with Reserved Font Name "Bitter Pro""); the
check above reads the whole statement, and Bitter left the library for Faustina before the
pull request was opened (`ADR-171-font-library.md`, Alternatives rejected). The italic column
is not part of the library's width rule: the italic sets a few words of emphasis, and the
widest italic kept is Atkinson Hyperlegible Next's, 1.003 of Open Sans's.

## 5. The library

`library.py` builds the four families twice each by the recipe and asserts the two builds are
the same bytes, lays them out as `fonts/<id>/` with each family's `OFL.txt`, and measures the
folder, a git pack of it, and a tar and gzip of it. Run as `python library.py <work folder>`.

```python
"""The font library of issue #171: built twice by the recipe of ADR-171-font-library.md to prove
the bytes reproduce, laid out as fonts/<id>/, and measured as the repository and a container
layer would carry it.

Usage: python library.py <work folder>
The work folder holds src/<google-fonts folder>/ (the upstream files) and recipe.py (the ADR's
recipe, verbatim). The library is written to <work folder>/library/fonts/.
"""
import gzip
import hashlib
import importlib.util
import io
import os
import shutil
import stat
import subprocess
import sys
import tarfile

work = sys.argv[1]
spec = importlib.util.spec_from_file_location('recipe', os.path.join(work, 'recipe.py'))
recipe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recipe)

FAMILIES = [  # library id, google/fonts folder, upright, italic
    ('open-sans', 'opensans', 'OpenSans[wdth,wght].ttf', 'OpenSans-Italic[wdth,wght].ttf'),
    ('roboto', 'roboto', 'Roboto[wdth,wght].ttf', 'Roboto-Italic[wdth,wght].ttf'),
    ('atkinson-hyperlegible-next', 'atkinsonhyperlegiblenext', 'AtkinsonHyperlegibleNext[wght].ttf', 'AtkinsonHyperlegibleNext-Italic[wght].ttf'),
    ('faustina', 'faustina', 'Faustina[wght].ttf', 'Faustina-Italic[wght].ttf'),
]
sha = lambda data: hashlib.sha256(data).hexdigest()


def remove(path):
    # git writes its objects read-only, which Windows will not delete without a chmod first.
    shutil.rmtree(path, onerror=lambda f, p, _: (os.chmod(p, stat.S_IWRITE), f(p))) if os.path.exists(path) else None


root = os.path.join(work, 'library')
remove(root)
lib = os.path.join(root, 'fonts')
os.makedirs(lib)
total = 0
for fid, folder, upright, italic in FAMILIES:
    os.makedirs(os.path.join(lib, fid))
    print(f'{fid}')
    for style, ttf in (('normal', upright), ('italic', italic)):
        src = os.path.join(work, 'src', folder, ttf)
        first, second = recipe.build(src), recipe.build(src)
        assert first == second, f'{fid} {style}: two builds differ'
        open(os.path.join(lib, fid, f'{fid}-{style}.woff2'), 'wb').write(first)
        source = open(src, 'rb').read()
        print(f'    in  ofl/{folder}/{ttf}  {len(source)}  {sha(source)}')
        print(f'    out {fid}-{style}.woff2  {len(first)}  {sha(first)}  (built twice, identical)')
        total += len(first)
    ofl = open(os.path.join(work, 'src', folder, 'OFL.txt'), 'rb').read()
    open(os.path.join(lib, fid, 'OFL.txt'), 'wb').write(ofl)
    print(f'    OFL.txt  {len(ofl)}  {sha(ofl)}')
    total += len(ofl)
print(f'library folder: {total} bytes')

# As git stores it: a fresh repository holding only the folder, one commit, packed.
repo = os.path.join(root, 'gitcheck')
shutil.copytree(lib, os.path.join(repo, 'fonts'))
git = lambda *args: subprocess.run(['git', *args], cwd=repo, check=True, capture_output=True, text=True).stdout
git('init', '-q')
git('add', '.')
git('-c', 'user.name=measure', '-c', 'user.email=measure@example.org', 'commit', '-q', '-m', 'library')
git('gc', '-q', '--aggressive')
print('git count-objects -v:', ' '.join(line for line in git('count-objects', '-v').splitlines() if line.startswith(('in-pack', 'size-pack'))))

# As a container layer: a tar of the folder, and that tar gzip'd as a registry stores a layer.
buffer = io.BytesIO()
with tarfile.open(fileobj=buffer, mode='w') as tar:
    tar.add(lib, arcname='fonts')
raw = buffer.getvalue()
print(f'tar of the folder: {len(raw)} bytes; gzip -6: {len(gzip.compress(raw, 6))} bytes')
```

Output:

```
open-sans
    in  ofl/opensans/OpenSans[wdth,wght].ttf  532636  36643644f318a812aab2d2ed3bb98f8cf0872527f835fe9398d95fe6b9adb878
    out open-sans-normal.woff2  42904  a01904f4431dc90d3df322c58a7e7f466b55d8b8a0b2e2a899ac6daf0b105689  (built twice, identical)
    in  ofl/opensans/OpenSans-Italic[wdth,wght].ttf  583992  fe269381e992f32e135801740998544d6235061e37c93ec067ad2be3edd5b17b
    out open-sans-italic.woff2  44796  44c77ff92035694c70d40b2ef2c0ddc92027987bb6659fcc9fcf1bbe3535ce69  (built twice, identical)
    OFL.txt  4389  fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602
roboto
    in  ofl/roboto/Roboto[wdth,wght].ttf  488584  d7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134
    out roboto-normal.woff2  50252  56802c518d2124afc44b35e512d31e7e5c4147e7f86f9a8f2788f3e141980dfc  (built twice, identical)
    in  ofl/roboto/Roboto-Italic[wdth,wght].ttf  530944  9725a847af6b460ffca162ae66d20dad48b01876137947180b42d7dcd7887182
    out roboto-italic.woff2  55164  3b44bb9a4d12169b3af5b7a7ef165de37f80d68826c9c2aa59877ce133c91513  (built twice, identical)
    OFL.txt  4394  061402327a96aadb0bfb694a960ed289ecd38d383e396243831ab81feb109c41
atkinson-hyperlegible-next
    in  ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf  114552  5a455d1cfa099b601ab70751bb9673e8fe1854dc4500c80e1a220d0d75e31745
    out atkinson-hyperlegible-next-normal.woff2  25688  9dc2c98eb9bc3522391fbaeb9dfe994dd50067ff738a568d87acce973c62b11a  (built twice, identical)
    in  ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic[wght].ttf  123916  ce9cffed32742ad2d9238c561a93220385e5934cdc02b8eb4097a50efa957dc6
    out atkinson-hyperlegible-next-italic.woff2  29156  aa55d8399746875ef8d3ef7a82ccc5d6a68331befc0517f3a42ad4b653fa6509  (built twice, identical)
    OFL.txt  4431  aca6a428580965d2297d1b718042dd427c2a9443ece3b0d02d758e161e0c4030
faustina
    in  ofl/faustina/Faustina[wght].ttf  118468  2ce2606f0ee1d493873c24818a391e02606ee76ac924b3d985cbb820c0a53ea5
    out faustina-normal.woff2  38648  a84c008b88322919d47e487af4ad88cff098481940d24b61a553327061d01efa  (built twice, identical)
    in  ofl/faustina/Faustina-Italic[wght].ttf  120744  215b9bf63da0c9584b5a0aa8e2270da6a2b62c1281f5c39089613c3aaeffa2be
    out faustina-italic.woff2  40904  5ab1ba6428cbbec0c11a6847869aa2a17bbc18fcd7472e7c7024a0c1af8d8d6a  (built twice, identical)
    OFL.txt  4390  2d8f6a7be96a15fd2deaa8e6b5320cec6c253216b5a8f7e1becccfc51147b877
library folder: 345116 bytes
git count-objects -v: in-pack: 19 size-pack: 324
tar of the folder: 378880 bytes; gzip -6: 339475 bytes
```

The `name` records and embedding flags of the built files, which `woff2FamilyName`
(`application.md` 37.4) reads and the OFL asks to keep:

```
atkinson-hyperlegible-next-italic.woff2    name ID 16 None         name ID 1 Atkinson Hyperlegible Next   fsType 0  wght [(400.0, 700.0)]  copyright 'Copyright 2020-2024 The Atkinson Hyperlegible Next Project A'
atkinson-hyperlegible-next-normal.woff2    name ID 16 None         name ID 1 Atkinson Hyperlegible Next   fsType 0  wght [(400.0, 700.0)]  copyright 'Copyright 2020-2024 The Atkinson Hyperlegible Next Project A'
faustina-italic.woff2                      name ID 16 Faustina     name ID 1 Faustina Light               fsType 0  wght [(400.0, 700.0)]  copyright 'Copyright 2019 The Faustina Project Authors (https://github.'
faustina-normal.woff2                      name ID 16 Faustina     name ID 1 Faustina Light               fsType 0  wght [(400.0, 700.0)]  copyright 'Copyright 2019 The Faustina Project Authors (https://github.'
open-sans-italic.woff2                     name ID 16 None         name ID 1 Open Sans                    fsType 0  wght [(400.0, 700.0)]  copyright 'Copyright 2020 The Open Sans Project Authors (https://github'
open-sans-normal.woff2                     name ID 16 None         name ID 1 Open Sans                    fsType 0  wght [(400.0, 700.0)]  copyright 'Copyright 2020 The Open Sans Project Authors (https://github'
roboto-italic.woff2                        name ID 16 None         name ID 1 Roboto                       fsType 0  wght [(400.0, 700.0)]  copyright 'Copyright 2011 The Roboto Project Authors (https://github.co'
roboto-normal.woff2                        name ID 16 None         name ID 1 Roboto                       fsType 0  wght [(400.0, 700.0)]  copyright 'Copyright 2011 The Roboto Project Authors (https://github.co'
```

Each built family loaded in Chromium through `@font-face` as `src/theme.ts` writes it --
weight `400 700`, a `normal` and an `italic` file -- and usable at 400, 700 and italic
(`document.fonts.check`), with four badges measured in it:

```
open-sans                     | check 400/700/italic: true | Niet van toepassing 178.0px; Elders geregeld 148.7px; Ethisch aanvaardbaar 197.0px; Seek legal advice 157.7px
roboto                       normal:loaded italic:loaded | check 400/700/italic: true | Niet van toepassing 172.0px; Elders geregeld 145.5px; Ethisch aanvaardbaar 192.1px; Seek legal advice 155.3px
atkinson-hyperlegible-next    | check 400/700/italic: true | Niet van toepassing 177.8px; Elders geregeld 150.0px; Ethisch aanvaardbaar 196.0px; Seek legal advice 160.1px
faustina                     normal:loaded italic:loaded | check 400/700/italic: true | Niet van toepassing 170.2px; Elders geregeld 144.8px; Ethisch aanvaardbaar 190.8px; Seek legal advice 153.1px
```

## 6. The licence list

The six SPDX pages answer, and each stored string is at most 200 characters
(`ADR-171-licence-dropdown.md`; the names are the SPDX licence list's, version 3.29.0 of
2026-09-16):

```
200 https://spdx.org/licenses/OFL-1.1.html
200 https://spdx.org/licenses/Apache-2.0.html
200 https://spdx.org/licenses/Ubuntu-font-1.0.html
200 https://spdx.org/licenses/Bitstream-Vera.html
200 https://spdx.org/licenses/MIT.html
200 https://spdx.org/licenses/CC0-1.0.html
SPDX licence list 3.29.0
66 SIL Open Font License 1.1 (https://spdx.org/licenses/OFL-1.1.html)
62 Apache License 2.0 (https://spdx.org/licenses/Apache-2.0.html)
73 Ubuntu Font Licence v1.0 (https://spdx.org/licenses/Ubuntu-font-1.0.html)
75 Bitstream Vera Font License (https://spdx.org/licenses/Bitstream-Vera.html)
48 MIT License (https://spdx.org/licenses/MIT.html)
77 Creative Commons Zero v1.0 Universal (https://spdx.org/licenses/CC0-1.0.html)
```
