# Issue #220: the room in the Answer row for more than two next steps

> Measured on 2026-10-09 by the architecture run of #220, on the production build (`npm run
> build`) of `dev` at `46ee621`, served by `node .next/standalone/server.js` from a scratch data
> directory holding `trees/ai-act-example`, `trees/ai-act-applicability-agrifood` and
> `tests/fixtures/full-node`, imported by `tests/browser/data-dir.ts`, on Windows 11 with Node
> 22.18.0 and Playwright's Chromium (`playwright-core` of the repository's lock file). Every
> number that `docs/adrs/ADR-220-*.md`, core document 10.43 and the amended sections of
> `docs/specs/application.md` and `docs/specs/tree-format.md` cite is here, with the script that
> produced it, copied whole in section 4, and its output, whole, in section 5.
>
> **Not measured: the CI runner's faces.** #202's record ran the same script in the
> `mcr.microsoft.com/playwright:v1.62.1-noble` image, where the default stack is drawn in
> Liberation Sans and DejaVu Sans is installed. Docker was not running on this machine, and
> starting Docker Desktop from the run did not bring its engine up. In its place the second pass
> draws the buttons in **Verdana**, which #175 measured as the Windows stand-in for DejaVu Sans
> Bold, the widest fallback a reader is likely to meet (`application.md` 10.7, amended by #175:
> Verdana "breaks these titles' lines as DejaVu Sans does"). #221 measures the Linux faces on its
> own build, where a number decides a test (`application.md` 41.9).
>
> This is a record, not a contract: #221 builds the row and measures again on its build.

## 1. What was measured

- **The Answer row of the centre frame, redrawn** by the script (section 4) with *n* copies of
  dev's own first Answer button, *n* from 2 to 6, each labelled with one text alone, in one of
  two arrangements:
  - **one row**: every button an equal share of the row, at most 620 wide, as dev's two are
    (`flex: 1 1 0`);
  - **two a row**: each button half the row less half its gap, a third or a fifth on a row of its
    own, centred (`flex-wrap: wrap`, a gap of 8 between the rows).

  The label may break inside a word (`overflow-wrap: anywhere`), hyphenated in the page's
  language (`hyphens: auto`). Nothing else on the page was changed.
- **The labels**, in six groups, each label at most its group's length in characters: 12
  ("Distributeur", "Not relevant", "MANUFACTURER", "Gemachtigde?"), 19 ("Mandatory safeguard",
  "Niet van toepassing", "ONLY AS AN IMPORTER", "Ethisch aanvaardbaa"), 25
  ("Gebruiksverantwoordelijke", ...), 30, 40, and **the next step's title alone** at the 80
  characters of `tree-format.md` 5.7. Each group has a label in capitals and the longest Dutch
  word that fits it. A cell gives the group's worst label: the most lines its buttons took, the
  tallest button in brackets, **WIDE** where a label was wider than its button, and **DOES NOT
  FIT** where the page, walked as `tests/browser/no-scroll.spec.ts` walks it (10.6, with its
  exemptions), had an element whose content was wider or taller than itself **beyond what dev's
  own row overflows on the same page in the same window** -- dev's disclaimer takes two lines
  between 480 and about 640 pixels wide, a known defect of `dev` that is not this row's.
- **Pages**: `tests/fixtures/full-node/` at its 49-entry Trail, in English and in Dutch: every
  maximum the format allows at once (10.6: "If this fits, every valid Tree fits"), in the default
  stack, which Windows draws in Segoe UI; the root of `ai-act-applicability-agrifood` in Dutch,
  whose Theme draws the buttons in Open Sans; the root of `ai-act-example`, whose Theme draws them
  in Nova Square, a wide display face.
- **Faces**: the page's own, and then every button in Verdana (the script's second argument).
- **Viewports**: the ten of 10.6, and 1279 x 640, 1100, 1000, 900 and 800 x 640, 700, 600, 520,
  480 and 479 x 800, 479, 768, 1024 and 360 x 481 -- one pixel above the floor's height -- and
  321 x 640, one pixel above its width.
- **Part 2, the lowest window**: for the full Node, at sixteen widths from 321 to 1279, the
  lowest height from 481 up at which the buttons fit (nothing beyond dev's own overflow, no label
  wider than its button), found by halving between 481 and 1080, each height the same page
  resized: two buttons in one row, and three or four in one row from 1000 pixels wide and two a
  row below -- the arrangement #220 decides -- with the 19- and the 25-character labels. A cell
  gives the height and, in brackets, the most lines a label took there.

## 2. What it shows

1. **At the guarantee, 1280 x 640, one row holds four buttons of 300 pixels**, each with a label
   of up to 19 characters on **one** line and up to 40 on two, in every face and page measured
   (Segoe UI, Open Sans, Nova Square, Verdana). The row is 68 tall there and its buttons 60, so a
   label may take two lines and no more.
2. **The next step's title alone does not fit**: at 1280 x 640 a title of 80 characters takes
   three lines in a button of 406 (three buttons) and three or four in one of 300 (four), and
   the page overflows. A button cannot show the title once a step has more than two next steps.
3. **Five or six buttons**: at 1280 x 640 one row holds 19 characters in two lines at five and
   six too, but 30 already takes three lines at six in every face measured. Below 1000 pixels
   wide, where they stand two a row, five or six need a **third row**, and on the full Node it
   overflows the page in every window measured 481 pixels tall -- 360, 479, 768 and 1024 x 481
   -- and at 1000 x 640 and 800 x 640, at every label length, 12 characters included (the cells
   "two a row, 5" and "two a row, 6" of section 5.1). Four is the most that stays in two rows.
4. **Below 1000 pixels wide one row of four is too narrow**: at 900 x 640 a 19-character label
   takes two lines in Verdana (197 pixels a button), at 800 three, at 700 three in Segoe UI too;
   one row of three keeps two lines in Verdana down to 700. Two a row keeps a 19-character label
   on two lines at every width from 390 up, in Segoe UI and in Verdana (part 2).
5. **Below 390 pixels wide** a half-row button is 140 to 160 pixels (175 at 390), and a 19-character label
   takes two lines in Segoe UI and Nova Square, two in Open Sans at 360 and three at 321, and
   **three** in Verdana; a 25-character one three in Segoe UI and four in Verdana at 321.
6. **The lowest window (part 2)**: two buttons fit in every window above the floor, with either
   group, in either face (a button's label takes up to three lines below 390, where dev's took
   one word). Three or four, with 19 characters, fit in every window above the floor from 390
   pixels wide, and below 390 from **488** pixels tall in Segoe UI and **536** in Verdana;
   with 25 characters, from 536 in Segoe UI and **584** in Verdana below 390, and from 493 to
   536 at 390, 420 and 480 wide in Verdana too. The Dutch full Node gives the same heights as the English one.
7. So **19 characters**, the limit of the ending's words on the Terminal's badge (`tree-format.md`
   5.7), is the most a label can take without a cost above 390 pixels wide; and **three or four
   buttons below 390 wide cost the windows from 481 to 535 pixels tall** in the widest face,
   which #220 gives to the `minimumSize` notice for such a step (`application.md` 41.4).

## 3. The arrangement #220 decides, in the numbers above

| | Buttons | Where |
|---|---|---|
| One row | 2, at every width; 3 and 4 from 1000 pixels wide | each an equal share, at most 620, 60 tall: one or two lines at 19 characters (sections 5.1 and 5.2) |
| Two a row | 3 and 4 below 1000 pixels wide | each half the row, a third centred on the second row; two rows of 60 and a gap of 8 |
| The notice | 3 and 4 below 390 pixels wide and below 560 pixels tall | the lowest window measured is 536 in Verdana; the 24 above it are the margin for the Linux faces this run did not measure (#221 measures them) |

## 4. The script

Run as `node measure.mjs http://127.0.0.1:<port>` and `node measure.mjs http://127.0.0.1:<port>
Verdana` from the repository's root against the server above. Its code is as it ran.

```js
// Issue #220: the room in the Answer row for more than two next steps, on the production build of
// dev. A scratch script of the architecture run, copied whole into
// docs/research/issue-220-answer-row-room.md and deleted. Usage, from a folder whose node_modules
// holds playwright-core -- the repository, or the CI image's /work:
//   node measure.mjs <origin> [<face>]
// <face>, when given, is set as the Answer buttons' font-family (Verdana on Windows as the stand-in
// for DejaVu Sans Bold, which Windows lacks; DejaVu Sans in Linux); without it the buttons are drawn
// in the Tree's own heading face, as dev draws them.
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('playwright-core')

const [origin, face] = process.argv.slice(2)

/**
 * The ten viewports of 10.6, then widths between them where a row of buttons narrows -- 1279 (the
 * first below the guarantee), 1100, 1000, 900, 800, 700, 600, 520, 480 and 479 -- at the heights of
 * 10.6's neighbours, and the lowest heights above the floor at a phone's and a tablet's width.
 */
const VIEWPORTS = [
  [1280, 640], [1366, 768], [1920, 1080], [2560, 1440], [1280, 800],
  [1024, 768], [768, 1024], [390, 844], [360, 640], [320, 480],
  [1279, 640], [1100, 640], [1000, 640], [900, 640], [800, 640], [700, 800], [600, 800],
  [520, 800], [480, 800], [479, 800], [479, 481], [768, 481], [1024, 481], [360, 481], [321, 640],
]

/** Labels the creator might write, grouped by the limit they test: each at most its group's length. */
const LABELS = {
  12: ['Distributeur', 'Not relevant', 'MANUFACTURER', 'Gemachtigde?'],
  19: ['Mandatory safeguard', 'Niet van toepassing', 'ONLY AS AN IMPORTER', 'Ethisch aanvaardbaa'],
  25: ['Gebruiksverantwoordelijke', 'Provider and importer too', 'Aanbieder en distributeur', 'NOT YET ON THE EU MARKET'],
  30: ['Both provider and distributor?', 'Gebruiksverantwoordelijke, ja', 'Aanbieder en ook importeur ja', 'OUTSIDE THE UNION ALTOGETHER'],
  40: ['Gebruiksverantwoordelijke of aanbieder', 'Neither of the two: something else', 'Beide: als aanbieder en als gebruiker', 'A PROVIDER WHO ALSO DEPLOYS THE SYSTEM'],
  // The next step's title alone, at the 80 characters of tree-format.md 5.7.
  title: ['The rules apply: a Terminal whose title is also eighty characters long The rule.', 'Valt uw AI-systeem onder een van de verboden praktijken van artikel 5 AI-verordening?'.slice(0, 80)],
}
for (const [limit, labels] of Object.entries(LABELS)) {
  for (const label of labels) if (limit !== 'title' && label.length > Number(limit)) throw new Error(`${label} is over ${limit}`)
}

/** The widths of part 2, from just above the floor to just below the guarantee. */
const SWEEP_WIDTHS = [321, 360, 390, 420, 479, 480, 520, 600, 700, 767, 768, 800, 900, 1000, 1100, 1279]

const PAGES = [
  ['full-node, en', `/full-node/${Array.from({ length: 50 }, () => 'full').join('/')}`],
  ['full-node, nl', `/full-node/${Array.from({ length: 50 }, () => 'full').join('/')}?lang=nl`],
  ['ai-act-applicability-agrifood, start, nl', '/ai-act-applicability-agrifood/start?lang=nl'],
  ['ai-act-example, start, en', '/ai-act-example/start'],
]

/**
 * Redraws the centre frame's Answer row with `n` copies of its first button, every one labelled
 * `label` alone, in `layout`: 'row' -- one row, each button an equal share of it, at most 620
 * wide, as dev's two are -- or 'two' -- two to a row, each half the row less half its gap, a third
 * or a fifth button centred on a row of its own. The label may break inside a word
 * (`overflow-wrap: anywhere`), hyphenated in the page's language (`hyphens: auto`). Returns the
 * most lines any button's label takes, whether a label is wider than its button, the row's
 * height, the tallest button, and every element whose content is wider or taller than itself,
 * by the walk of tests/browser/no-scroll.spec.ts (10.6) with its exemptions.
 */
async function measure(page, n, layout, label, face) {
  return page.evaluate(({ n, layout, label, face }) => {
    const row = document.querySelector('.tree-frame .answers')
    if (!row.dataset.original) row.dataset.original = row.innerHTML
    row.innerHTML = row.dataset.original
    row.style.flexWrap = ''
    row.style.rowGap = ''
    const template = row.querySelector('.answer')
    if (n > 0) row.innerHTML = ''
    const gap = parseFloat(getComputedStyle(row).columnGap)
    row.style.flexWrap = layout === 'two' ? 'wrap' : 'nowrap'
    row.style.rowGap = `${Math.min(gap, 8)}px`
    for (let i = 0; i < n; i++) {
      const button = template.cloneNode(true)
      button.querySelector('.branch-label').textContent = label
      button.style.flex = layout === 'two' ? `0 1 calc(50% - ${gap / 2}px)` : '1 1 0'
      button.style.width = 'auto'
      button.style.minWidth = '0'
      button.style.maxWidth = '620px'
      button.style.overflowWrap = 'anywhere'
      button.style.hyphens = 'auto'
      if (face) button.style.fontFamily = face
      row.append(button)
    }
    // Every element whose content is wider or taller than itself, by how much: the caller
    // compares this with dev's own row on the same page, so that what dev already does there
    // (its disclaimer on two lines between 480 and 640 wide, for one) is not counted twice.
    const overflowing = {}
    const d = document.documentElement
    if (d.scrollHeight > innerHeight + 1 || d.scrollWidth > innerWidth + 1) overflowing.document = [d.scrollWidth - innerWidth, d.scrollHeight - innerHeight, `${d.scrollWidth}x${d.scrollHeight}`]
    for (const el of document.querySelectorAll('body, body *')) {
      if (el.matches('[data-carousel-strip], [data-scroll-box], [data-scroll-box] [data-clamp], .page-chrome [data-clamp]')) continue
      if (el.closest('[aria-hidden="true"], template, script, style')) continue
      if (n > 0 && el.closest('.answer')) continue
      if ((el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) || (el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1)) {
        const name = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`
        overflowing[name] = [el.scrollWidth - el.clientWidth, el.scrollHeight - el.clientHeight, `${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`]
      }
    }
    if (n === 0) return { overflowing }
    let lines = 0
    let wide = false
    let tallest = 0
    for (const button of row.children) {
      const span = button.querySelector('.branch-label')
      const range = document.createRange()
      range.selectNodeContents(span)
      const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)))
      lines = Math.max(lines, tops.size)
      if (span.scrollWidth > span.clientWidth + 1 || button.scrollWidth > button.clientWidth + 1) wide = true
      tallest = Math.max(tallest, button.getBoundingClientRect().height)
    }
    return {
      lines,
      wide,
      row: Math.round(row.getBoundingClientRect().height * 10) / 10,
      button: Math.round(tallest * 10) / 10,
      width: Math.round(row.firstElementChild.getBoundingClientRect().width * 10) / 10,
      overflowing,
      family: getComputedStyle(row.firstElementChild).fontFamily,
    }
  }, { n, layout, label, face })
}

/** What `m` overflows beyond `base`, dev's own row on the same page at the same size: an element dev does not overflow, or one that overflows more than one pixel further. */
function beyond(m, base) {
  return Object.entries(m.overflowing)
    .filter(([name, [x, y]]) => !base.overflowing[name] || x > base.overflowing[name][0] + 1 || y > base.overflowing[name][1] + 1)
    .map(([name, [, , text]]) => `${name} ${text}`)
}

/** The label of `labels` whose buttons take the most lines in `layout` at this size, and what they overflow. */
async function worstOf(page, n, layout, labels, base) {
  let worst = null
  for (const label of labels) {
    const m = await measure(page, n, layout, label, face)
    m.beyond = beyond(m, base)
    const worse = !worst || m.lines > worst.lines || (m.wide && !worst.wide) || (m.lines === worst.lines && m.beyond.length > worst.beyond.length)
    if (worse) worst = { ...m, label }
  }
  return worst
}

async function open(page, url, width, height) {
  await page.setViewportSize({ width, height })
  await page.goto(origin + url, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const row = document.querySelector('.tree-frame .answers')
    return !!row && row.getBoundingClientRect().height > 0
  })
}

/** Part 1: every label group, 2 to 6 buttons, in one row and two a row, at every viewport. */
async function table(browser, name, url) {
  const context = await browser.newContext()
  const page = await context.newPage()
  console.log(`\n### ${name}${face ? `, the buttons in ${face}` : ''}\n`)
  let family = ''
  const out = []
  for (const [width, height] of VIEWPORTS) {
    if (!(await open(page, url, width, height))) {
      out.push(`| ${width} x ${height} | the minimumSize notice: no Answer row | | | | | | | | |`)
      continue
    }
    const base = await measure(page, 0, 'row', '', face)
    for (const layout of ['row', 'two']) {
      for (const n of [2, 3, 4, 5, 6]) {
        if (layout === 'two' && n === 2) continue
        const cells = []
        for (const [limit, labels] of Object.entries(LABELS)) {
          const worst = await worstOf(page, n, layout, labels, base)
          family = worst.family
          cells.push(`${worst.lines} (${worst.button})${worst.wide ? ' WIDE' : ''}${worst.beyond.length ? ' DOES NOT FIT' : ''}`)
          if (worst.beyond.length) console.error(`${name} ${width}x${height} ${layout} ${n} ${limit} "${worst.label}": ${worst.beyond.join('; ')}`)
        }
        const m = await measure(page, n, layout, 'x', face)
        out.push(`| ${width} x ${height} | ${layout === 'row' ? 'one row' : 'two a row'} | ${n} | ${m.width} | ${cells.join(' | ')} |`)
      }
    }
  }
  console.log(`Buttons drawn in: ${family}\n`)
  console.log('| viewport | layout | buttons | button width | 12 | 19 | 25 | 30 | 40 | title of 80 |')
  console.log('|---|---|---|---|---|---|---|---|---|---|')
  for (const line of out) console.log(line)
  await context.close()
}

/**
 * Part 2: the lowest window, at each width, in which `n` buttons fit -- nothing overflows beyond
 * what dev's own row overflows in the same window, and no label is wider than its button -- with
 * the labels of the 19- and the 25-character groups, the buttons standing as #220 decides: one
 * row of two at every width, and three or four in one row from 1000 pixels wide and two a row
 * below. Found by halving between 481 and 1080; "481" means every height above the floor. The
 * cell also gives the most lines a label took in that lowest window.
 */
async function sweep(browser, name, url) {
  const context = await browser.newContext()
  const page = await context.newPage()
  console.log(`\n### ${name}${face ? `, the buttons in ${face}` : ''}: the lowest window that holds the buttons\n`)
  console.log('| width | 2, 19 | 3, 19 | 4, 19 | 2, 25 | 3, 25 | 4, 25 |')
  console.log('|---|---|---|---|---|---|---|')
  for (const width of SWEEP_WIDTHS) {
    // One load per width; each height is the same page resized, as a reader's window is.
    await open(page, url, width, 1080)
    const cells = []
    for (const [limit, n] of [[19, 2], [19, 3], [19, 4], [25, 2], [25, 3], [25, 4]]) {
      const layout = n > 2 && width < 1000 ? 'two' : 'row'
      let lines = 0
      const fits = async (height) => {
        await page.setViewportSize({ width, height })
        const shown = await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => {
          const row = document.querySelector('.tree-frame .answers')
          done(!!row && row.getBoundingClientRect().height > 0)
        }))))
        if (!shown) return true
        const base = await measure(page, 0, 'row', '', face)
        const worst = await worstOf(page, n, layout, LABELS[limit], base)
        lines = worst.lines
        return worst.beyond.length === 0 && !worst.wide
      }
      let low = 481
      let high = 1080
      if (await fits(low)) {
        cells.push(`481 (${lines})`)
        continue
      }
      if (!(await fits(high))) {
        cells.push('over 1080')
        continue
      }
      while (high - low > 1) {
        const mid = Math.floor((low + high) / 2)
        if (await fits(mid)) high = mid
        else low = mid
      }
      await fits(high)
      cells.push(`${high} (${lines})`)
    }
    console.log(`| ${width} | ${cells.join(' | ')} |`)
  }
  await context.close()
}

const browser = await chromium.launch()
try {
  if (!process.env.SWEEP_ONLY) for (const [name, url] of PAGES) await table(browser, name, url)
  for (const [name, url] of PAGES.slice(0, 2)) await sweep(browser, name, url)
} finally {
  await browser.close()
}
```

## 5. The output, as it ran on `46ee621`

### 5.1 In the pages' own faces

#### full-node, en

Buttons drawn in: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif

| viewport | layout | buttons | button width | 12 | 19 | 25 | 30 | 40 | title of 80 |
|---|---|---|---|---|---|---|---|---|---|
| 1280 x 640 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 640 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1280 x 640 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1280 x 640 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1366 x 768 | one row | 3 | 435.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1366 x 768 | one row | 4 | 321.5 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1366 x 768 | one row | 5 | 253.2 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1366 x 768 | one row | 6 | 207.7 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1366 x 768 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 4 | 460 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1920 x 1080 | one row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 6 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 5 | 492 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 6 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 2560 x 1440 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 800 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1280 x 800 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1280 x 800 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 768 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1024 x 768 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) |
| 1024 x 768 | one row | 6 | 145.3 | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 6 (156) | 9 (228) |
| 1024 x 768 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 768 x 1024 | one row | 2 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 768 x 1024 | one row | 4 | 164 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 768 x 1024 | one row | 5 | 127.2 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 768 x 1024 | one row | 6 | 102.7 | 3 (84) | 5 (132) | 7 (180) | 7 (180) | 10 (252) | 16 (396) |
| 768 x 1024 | two a row | 3 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 4 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 5 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 6 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 390 x 844 | one row | 2 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | one row | 3 | 114 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 390 x 844 | one row | 4 | 83.5 | 3 (84) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 16 (396) |
| 390 x 844 | one row | 5 | 65.2 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 14 (348) | 24 (588) DOES NOT FIT |
| 390 x 844 | one row | 6 | 53 | 7 (180) | 9 (228) | 13 (324) | 13 (324) | 18 (444) | 34 (828) DOES NOT FIT |
| 390 x 844 | two a row | 3 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 4 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 5 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 6 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 360 x 640 | one row | 2 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 360 x 640 | one row | 3 | 104 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 12 (300) DOES NOT FIT |
| 360 x 640 | one row | 4 | 76 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 21 (516) DOES NOT FIT |
| 360 x 640 | one row | 5 | 59.2 | 5 (132) | 8 (204) | 10 (252) | 12 (300) DOES NOT FIT | 18 (444) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 360 x 640 | one row | 6 | 48 | 9 (228) | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 360 x 640 | two a row | 3 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 4 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 5 | 160 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 6 | 160 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 320 x 480 | the minimumSize notice: no Answer row | | | | | | | | |
| 1279 x 640 | one row | 2 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | one row | 3 | 406.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 4 | 299.8 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 5 | 235.8 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 1279 x 640 | one row | 6 | 193.2 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1279 x 640 | two a row | 3 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 4 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 5 | 619.5 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1279 x 640 | two a row | 6 | 619.5 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1100 x 640 | one row | 2 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | one row | 3 | 336 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1100 x 640 | one row | 4 | 247 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 1100 x 640 | one row | 5 | 193.6 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1100 x 640 | one row | 6 | 158 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 1100 x 640 | two a row | 3 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 4 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 5 | 514 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1100 x 640 | two a row | 6 | 514 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1000 x 640 | one row | 2 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1000 x 640 | one row | 3 | 302.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | one row | 4 | 222 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1000 x 640 | one row | 5 | 173.6 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 1000 x 640 | one row | 6 | 141.3 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 9 (228) DOES NOT FIT |
| 1000 x 640 | two a row | 3 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1000 x 640 | two a row | 4 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1000 x 640 | two a row | 5 | 464 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1000 x 640 | two a row | 6 | 464 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 900 x 640 | one row | 2 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 900 x 640 | one row | 3 | 269.3 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 900 x 640 | one row | 4 | 197 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 900 x 640 | one row | 5 | 153.6 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 900 x 640 | one row | 6 | 124.7 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 12 (300) DOES NOT FIT |
| 900 x 640 | two a row | 3 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 900 x 640 | two a row | 4 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 900 x 640 | two a row | 5 | 414 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 900 x 640 | two a row | 6 | 414 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 800 x 640 | one row | 2 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 800 x 640 | one row | 3 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 800 x 640 | one row | 4 | 172 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 800 x 640 | one row | 5 | 133.6 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 800 x 640 | one row | 6 | 108 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) DOES NOT FIT | 15 (372) DOES NOT FIT |
| 800 x 640 | two a row | 3 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 4 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 5 | 364 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 6 | 364 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 700 x 800 | one row | 2 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | one row | 3 | 202.7 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 700 x 800 | one row | 4 | 147 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) | 9 (228) |
| 700 x 800 | one row | 5 | 113.6 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 8 (204) | 13 (324) |
| 700 x 800 | one row | 6 | 91.3 | 4 (108) | 6 (156) | 7 (180) | 8 (204) | 10 (252) | 21 (516) DOES NOT FIT |
| 700 x 800 | two a row | 3 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 4 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 5 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 6 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 600 x 800 | one row | 2 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | one row | 3 | 169.3 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 600 x 800 | one row | 4 | 122 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 12 (300) |
| 600 x 800 | one row | 5 | 93.6 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 20 (492) DOES NOT FIT |
| 600 x 800 | one row | 6 | 74.7 | 6 (156) | 8 (204) | 10 (252) | 13 (324) | 18 (444) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 600 x 800 | two a row | 3 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 4 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 5 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 6 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 520 x 800 | one row | 2 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | one row | 3 | 142.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 9 (228) |
| 520 x 800 | one row | 4 | 102 | 3 (84) | 5 (132) | 7 (180) | 7 (180) | 10 (252) | 16 (396) DOES NOT FIT |
| 520 x 800 | one row | 5 | 77.6 | 5 (132) | 7 (180) | 9 (228) | 10 (252) | 15 (372) | 25 (612) DOES NOT FIT |
| 520 x 800 | one row | 6 | 61.3 | 12 (300) | 14 (348) | 19 (468) DOES NOT FIT | 22 (540) DOES NOT FIT | 29 (708) DOES NOT FIT | 46 (1116) DOES NOT FIT |
| 520 x 800 | two a row | 3 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 4 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 5 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) DOES NOT FIT |
| 520 x 800 | two a row | 6 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) DOES NOT FIT |
| 480 x 800 | one row | 2 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | one row | 3 | 129.3 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 480 x 800 | one row | 4 | 92 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 21 (516) DOES NOT FIT |
| 480 x 800 | one row | 5 | 69.6 | 7 (180) | 8 (204) | 12 (300) | 13 (324) | 18 (444) DOES NOT FIT | 32 (780) DOES NOT FIT |
| 480 x 800 | one row | 6 | 54.7 | 12 (300) WIDE | 18 (444) WIDE DOES NOT FIT | 22 (540) WIDE DOES NOT FIT | 25 (612) WIDE DOES NOT FIT | 32 (780) WIDE DOES NOT FIT | 63 (1524) WIDE DOES NOT FIT |
| 480 x 800 | two a row | 3 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | two a row | 4 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | two a row | 5 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT |
| 480 x 800 | two a row | 6 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT |
| 479 x 800 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 800 | one row | 3 | 143.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) |
| 479 x 800 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 12 (300) |
| 479 x 800 | one row | 5 | 83 | 3 (84) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 16 (396) |
| 479 x 800 | one row | 6 | 67.8 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 14 (348) | 23 (564) DOES NOT FIT |
| 479 x 800 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 800 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 800 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 800 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 481 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 481 | one row | 3 | 143.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) DOES NOT FIT |
| 479 x 481 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 12 (300) DOES NOT FIT |
| 479 x 481 | one row | 5 | 83 | 3 (84) | 5 (132) | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 16 (396) DOES NOT FIT |
| 479 x 481 | one row | 6 | 67.8 | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 9 (228) DOES NOT FIT | 14 (348) DOES NOT FIT | 23 (564) DOES NOT FIT |
| 479 x 481 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 479 x 481 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 479 x 481 | two a row | 5 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 479 x 481 | two a row | 6 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 768 x 481 | one row | 2 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 481 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 768 x 481 | one row | 4 | 164 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 768 x 481 | one row | 5 | 127.2 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 11 (276) DOES NOT FIT |
| 768 x 481 | one row | 6 | 102.7 | 3 (84) | 5 (132) | 7 (180) DOES NOT FIT | 7 (180) DOES NOT FIT | 10 (252) DOES NOT FIT | 16 (396) DOES NOT FIT |
| 768 x 481 | two a row | 3 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 768 x 481 | two a row | 4 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 768 x 481 | two a row | 5 | 348 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 768 x 481 | two a row | 6 | 348 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 1024 x 481 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1024 x 481 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 1024 x 481 | one row | 6 | 145.3 | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 6 (156) DOES NOT FIT | 9 (228) DOES NOT FIT |
| 1024 x 481 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 5 | 476 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 481 | two a row | 6 | 476 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 360 x 481 | one row | 2 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 481 | one row | 3 | 104 | 3 (84) | 4 (108) | 4 (108) | 5 (132) DOES NOT FIT | 7 (180) DOES NOT FIT | 12 (300) DOES NOT FIT |
| 360 x 481 | one row | 4 | 76 | 4 (108) | 5 (132) DOES NOT FIT | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 21 (516) DOES NOT FIT |
| 360 x 481 | one row | 5 | 59.2 | 5 (132) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 12 (300) DOES NOT FIT | 18 (444) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 360 x 481 | one row | 6 | 48 | 9 (228) DOES NOT FIT | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 360 x 481 | two a row | 3 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 4 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 5 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 6 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 321 x 640 | one row | 2 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 321 x 640 | one row | 3 | 91 | 3 (84) | 4 (108) | 6 (156) | 5 (132) | 9 (228) | 15 (372) DOES NOT FIT |
| 321 x 640 | one row | 4 | 66.3 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 14 (348) DOES NOT FIT | 24 (588) DOES NOT FIT |
| 321 x 640 | one row | 5 | 51.4 | 8 (204) | 10 (252) | 13 (324) DOES NOT FIT | 15 (372) DOES NOT FIT | 20 (492) DOES NOT FIT | 35 (852) DOES NOT FIT |
| 321 x 640 | one row | 6 | 41.5 | 12 (300) DOES NOT FIT | 17 (420) DOES NOT FIT | 22 (540) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 59 (1428) DOES NOT FIT |
| 321 x 640 | two a row | 3 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 321 x 640 | two a row | 4 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 321 x 640 | two a row | 5 | 140.5 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 321 x 640 | two a row | 6 | 140.5 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |

#### full-node, nl

Buttons drawn in: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif

| viewport | layout | buttons | button width | 12 | 19 | 25 | 30 | 40 | title of 80 |
|---|---|---|---|---|---|---|---|---|---|
| 1280 x 640 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 640 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1280 x 640 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1280 x 640 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1366 x 768 | one row | 3 | 435.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1366 x 768 | one row | 4 | 321.5 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1366 x 768 | one row | 5 | 253.2 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1366 x 768 | one row | 6 | 207.7 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1366 x 768 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 4 | 460 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1920 x 1080 | one row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 6 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 5 | 492 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 6 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 2560 x 1440 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 800 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1280 x 800 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1280 x 800 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 768 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1024 x 768 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) |
| 1024 x 768 | one row | 6 | 145.3 | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 9 (228) |
| 1024 x 768 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 768 x 1024 | one row | 2 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 768 x 1024 | one row | 4 | 164 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 768 x 1024 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 768 x 1024 | one row | 6 | 102.7 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 16 (396) |
| 768 x 1024 | two a row | 3 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 4 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 5 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 6 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 390 x 844 | one row | 2 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | one row | 3 | 114 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 11 (276) |
| 390 x 844 | one row | 4 | 83.5 | 5 (132) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 16 (396) |
| 390 x 844 | one row | 5 | 65.2 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) | 24 (588) DOES NOT FIT |
| 390 x 844 | one row | 6 | 53 | 7 (180) | 10 (252) | 13 (324) | 13 (324) | 18 (444) | 34 (828) DOES NOT FIT |
| 390 x 844 | two a row | 3 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 4 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 5 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 6 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 360 x 640 | one row | 2 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 360 x 640 | one row | 3 | 104 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 12 (300) DOES NOT FIT |
| 360 x 640 | one row | 4 | 76 | 5 (132) | 6 (156) | 7 (180) | 9 (228) | 11 (276) DOES NOT FIT | 21 (516) DOES NOT FIT |
| 360 x 640 | one row | 5 | 59.2 | 5 (132) | 8 (204) | 10 (252) | 12 (300) DOES NOT FIT | 18 (444) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 360 x 640 | one row | 6 | 48 | 9 (228) | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 360 x 640 | two a row | 3 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 4 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 5 | 160 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 6 | 160 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 320 x 480 | the minimumSize notice: no Answer row | | | | | | | | |
| 1279 x 640 | one row | 2 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | one row | 3 | 406.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 4 | 299.8 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 5 | 235.8 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 1279 x 640 | one row | 6 | 193.2 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1279 x 640 | two a row | 3 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 4 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 5 | 619.5 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1279 x 640 | two a row | 6 | 619.5 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1100 x 640 | one row | 2 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | one row | 3 | 336 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1100 x 640 | one row | 4 | 247 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 1100 x 640 | one row | 5 | 193.6 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1100 x 640 | one row | 6 | 158 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 1100 x 640 | two a row | 3 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 4 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 5 | 514 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1100 x 640 | two a row | 6 | 514 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1000 x 640 | one row | 2 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1000 x 640 | one row | 3 | 302.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | one row | 4 | 222 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1000 x 640 | one row | 5 | 173.6 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 1000 x 640 | one row | 6 | 141.3 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) DOES NOT FIT |
| 1000 x 640 | two a row | 3 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1000 x 640 | two a row | 4 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1000 x 640 | two a row | 5 | 464 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1000 x 640 | two a row | 6 | 464 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 900 x 640 | one row | 2 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 900 x 640 | one row | 3 | 269.3 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 900 x 640 | one row | 4 | 197 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 900 x 640 | one row | 5 | 153.6 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 900 x 640 | one row | 6 | 124.7 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) DOES NOT FIT | 12 (300) DOES NOT FIT |
| 900 x 640 | two a row | 3 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 900 x 640 | two a row | 4 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 900 x 640 | two a row | 5 | 414 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 900 x 640 | two a row | 6 | 414 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 800 x 640 | one row | 2 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 800 x 640 | one row | 3 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 800 x 640 | one row | 4 | 172 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 800 x 640 | one row | 5 | 133.6 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 800 x 640 | one row | 6 | 108 | 3 (84) | 5 (132) | 5 (132) | 7 (180) DOES NOT FIT | 9 (228) DOES NOT FIT | 15 (372) DOES NOT FIT |
| 800 x 640 | two a row | 3 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 4 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 5 | 364 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 6 | 364 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 700 x 800 | one row | 2 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | one row | 3 | 202.7 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 700 x 800 | one row | 4 | 147 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) |
| 700 x 800 | one row | 5 | 113.6 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 14 (348) |
| 700 x 800 | one row | 6 | 91.3 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 12 (300) | 21 (516) DOES NOT FIT |
| 700 x 800 | two a row | 3 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 4 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 5 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 6 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 600 x 800 | one row | 2 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | one row | 3 | 169.3 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 600 x 800 | one row | 4 | 122 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 12 (300) |
| 600 x 800 | one row | 5 | 93.6 | 5 (132) | 6 (156) | 7 (180) | 9 (228) | 11 (276) | 20 (492) DOES NOT FIT |
| 600 x 800 | one row | 6 | 74.7 | 6 (156) | 8 (204) | 10 (252) | 13 (324) | 18 (444) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 600 x 800 | two a row | 3 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 4 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 5 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 6 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 520 x 800 | one row | 2 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | one row | 3 | 142.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) |
| 520 x 800 | one row | 4 | 102 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 16 (396) DOES NOT FIT |
| 520 x 800 | one row | 5 | 77.6 | 5 (132) | 8 (204) | 9 (228) | 10 (252) | 15 (372) | 26 (636) DOES NOT FIT |
| 520 x 800 | one row | 6 | 61.3 | 12 (300) | 14 (348) | 19 (468) DOES NOT FIT | 22 (540) DOES NOT FIT | 29 (708) DOES NOT FIT | 45 (1092) DOES NOT FIT |
| 520 x 800 | two a row | 3 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 4 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 5 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) DOES NOT FIT |
| 520 x 800 | two a row | 6 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) DOES NOT FIT |
| 480 x 800 | one row | 2 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | one row | 3 | 129.3 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 480 x 800 | one row | 4 | 92 | 5 (132) | 6 (156) | 7 (180) | 9 (228) | 11 (276) | 21 (516) DOES NOT FIT |
| 480 x 800 | one row | 5 | 69.6 | 7 (180) | 8 (204) | 12 (300) | 13 (324) | 18 (444) DOES NOT FIT | 32 (780) DOES NOT FIT |
| 480 x 800 | one row | 6 | 54.7 | 12 (300) WIDE | 18 (444) WIDE DOES NOT FIT | 22 (540) WIDE DOES NOT FIT | 25 (612) WIDE DOES NOT FIT | 32 (780) WIDE DOES NOT FIT | 63 (1524) WIDE DOES NOT FIT |
| 480 x 800 | two a row | 3 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | two a row | 4 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | two a row | 5 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT |
| 480 x 800 | two a row | 6 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT |
| 479 x 800 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 800 | one row | 3 | 143.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) |
| 479 x 800 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 12 (300) |
| 479 x 800 | one row | 5 | 83 | 5 (132) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 16 (396) |
| 479 x 800 | one row | 6 | 67.8 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 14 (348) | 23 (564) DOES NOT FIT |
| 479 x 800 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 800 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 800 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 800 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 481 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 479 x 481 | one row | 3 | 143.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) DOES NOT FIT |
| 479 x 481 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) DOES NOT FIT | 12 (300) DOES NOT FIT |
| 479 x 481 | one row | 5 | 83 | 5 (132) | 5 (132) | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 16 (396) DOES NOT FIT |
| 479 x 481 | one row | 6 | 67.8 | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 9 (228) DOES NOT FIT | 14 (348) DOES NOT FIT | 23 (564) DOES NOT FIT |
| 479 x 481 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 479 x 481 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 479 x 481 | two a row | 5 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 479 x 481 | two a row | 6 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 768 x 481 | one row | 2 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 481 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 768 x 481 | one row | 4 | 164 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 768 x 481 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 11 (276) DOES NOT FIT |
| 768 x 481 | one row | 6 | 102.7 | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 16 (396) DOES NOT FIT |
| 768 x 481 | two a row | 3 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 768 x 481 | two a row | 4 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 768 x 481 | two a row | 5 | 348 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 768 x 481 | two a row | 6 | 348 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 1024 x 481 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1024 x 481 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 1024 x 481 | one row | 6 | 145.3 | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 1024 x 481 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 5 | 476 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 481 | two a row | 6 | 476 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 360 x 481 | one row | 2 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 481 | one row | 3 | 104 | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 8 (204) DOES NOT FIT | 12 (300) DOES NOT FIT |
| 360 x 481 | one row | 4 | 76 | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 7 (180) DOES NOT FIT | 9 (228) DOES NOT FIT | 11 (276) DOES NOT FIT | 21 (516) DOES NOT FIT |
| 360 x 481 | one row | 5 | 59.2 | 5 (132) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 12 (300) DOES NOT FIT | 18 (444) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 360 x 481 | one row | 6 | 48 | 9 (228) DOES NOT FIT | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 360 x 481 | two a row | 3 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 4 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 5 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 6 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 321 x 640 | one row | 2 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 321 x 640 | one row | 3 | 91 | 4 (108) | 5 (132) | 6 (156) | 7 (180) | 9 (228) | 15 (372) DOES NOT FIT |
| 321 x 640 | one row | 4 | 66.3 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) DOES NOT FIT | 23 (564) DOES NOT FIT |
| 321 x 640 | one row | 5 | 51.4 | 8 (204) | 10 (252) | 13 (324) DOES NOT FIT | 15 (372) DOES NOT FIT | 20 (492) DOES NOT FIT | 35 (852) DOES NOT FIT |
| 321 x 640 | one row | 6 | 41.5 | 12 (300) DOES NOT FIT | 17 (420) DOES NOT FIT | 22 (540) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 59 (1428) DOES NOT FIT |
| 321 x 640 | two a row | 3 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 321 x 640 | two a row | 4 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 321 x 640 | two a row | 5 | 140.5 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 321 x 640 | two a row | 6 | 140.5 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |

#### ai-act-applicability-agrifood, start, nl

Buttons drawn in: "Open Sans", "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif

| viewport | layout | buttons | button width | 12 | 19 | 25 | 30 | 40 | title of 80 |
|---|---|---|---|---|---|---|---|---|---|
| 1280 x 640 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 640 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 640 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 640 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1280 x 640 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1366 x 768 | one row | 3 | 435.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1366 x 768 | one row | 4 | 321.5 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1366 x 768 | one row | 5 | 253.2 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1366 x 768 | one row | 6 | 207.7 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1366 x 768 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 4 | 460 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1920 x 1080 | one row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 6 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1920 x 1080 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 5 | 492 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 6 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 2560 x 1440 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 800 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 800 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 800 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1280 x 800 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 768 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 768 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1024 x 768 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1024 x 768 | one row | 6 | 145.3 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) |
| 1024 x 768 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 768 x 1024 | one row | 2 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 768 x 1024 | one row | 4 | 164 | 2 (60) | 3 (84) | 3 (84) | 3 (84) | 4 (108) | 8 (204) |
| 768 x 1024 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 12 (300) |
| 768 x 1024 | one row | 6 | 102.7 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 18 (444) |
| 768 x 1024 | two a row | 3 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 4 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 5 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 6 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 390 x 844 | one row | 2 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | one row | 3 | 114 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 12 (300) |
| 390 x 844 | one row | 4 | 83.5 | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 11 (276) | 19 (468) |
| 390 x 844 | one row | 5 | 65.2 | 5 (132) | 7 (180) | 9 (228) | 10 (252) | 14 (348) | 25 (612) DOES NOT FIT |
| 390 x 844 | one row | 6 | 53 | 7 (180) | 10 (252) | 13 (324) | 15 (372) | 19 (468) | 36 (876) DOES NOT FIT |
| 390 x 844 | two a row | 3 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 4 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 5 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 6 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 360 x 640 | one row | 2 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 360 x 640 | one row | 3 | 104 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 14 (348) DOES NOT FIT |
| 360 x 640 | one row | 4 | 76 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 11 (276) | 22 (540) DOES NOT FIT |
| 360 x 640 | one row | 5 | 59.2 | 6 (156) | 8 (204) | 10 (252) | 13 (324) DOES NOT FIT | 18 (444) DOES NOT FIT | 29 (708) DOES NOT FIT |
| 360 x 640 | one row | 6 | 48 | 9 (228) | 12 (300) | 17 (420) DOES NOT FIT | 19 (468) DOES NOT FIT | 25 (612) DOES NOT FIT | 40 (972) DOES NOT FIT |
| 360 x 640 | two a row | 3 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 4 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 5 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 6 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 320 x 480 | the minimumSize notice: no Answer row | | | | | | | | |
| 1279 x 640 | one row | 2 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | one row | 3 | 406.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 4 | 299.8 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1279 x 640 | one row | 5 | 235.8 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 1279 x 640 | one row | 6 | 193.2 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1279 x 640 | two a row | 3 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 4 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 5 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 6 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | one row | 2 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | one row | 3 | 336 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1100 x 640 | one row | 4 | 247 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 1100 x 640 | one row | 5 | 193.6 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1100 x 640 | one row | 6 | 158 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 9 (228) DOES NOT FIT |
| 1100 x 640 | two a row | 3 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 4 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 5 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 6 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1000 x 640 | one row | 2 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | one row | 3 | 302.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1000 x 640 | one row | 4 | 222 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1000 x 640 | one row | 5 | 173.6 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1000 x 640 | one row | 6 | 141.3 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 10 (252) DOES NOT FIT |
| 1000 x 640 | two a row | 3 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | two a row | 4 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | two a row | 5 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | two a row | 6 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 900 x 640 | one row | 2 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | one row | 3 | 269.3 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 900 x 640 | one row | 4 | 197 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 900 x 640 | one row | 5 | 153.6 | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 900 x 640 | one row | 6 | 124.7 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 8 (204) | 12 (300) DOES NOT FIT |
| 900 x 640 | two a row | 3 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | two a row | 4 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | two a row | 5 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 6 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | one row | 2 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 800 x 640 | one row | 3 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 800 x 640 | one row | 4 | 172 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 800 x 640 | one row | 5 | 133.6 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 11 (276) DOES NOT FIT |
| 800 x 640 | one row | 6 | 108 | 3 (84) | 5 (132) | 6 (156) | 8 (204) | 9 (228) DOES NOT FIT | 16 (396) DOES NOT FIT |
| 800 x 640 | two a row | 3 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 800 x 640 | two a row | 4 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 800 x 640 | two a row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 6 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 700 x 800 | one row | 2 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | one row | 3 | 202.7 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 700 x 800 | one row | 4 | 147 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) |
| 700 x 800 | one row | 5 | 113.6 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 15 (372) |
| 700 x 800 | one row | 6 | 91.3 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 12 (300) | 22 (540) DOES NOT FIT |
| 700 x 800 | two a row | 3 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 4 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 5 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 6 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 600 x 800 | one row | 2 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | one row | 3 | 169.3 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 600 x 800 | one row | 4 | 122 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 8 (204) | 13 (324) |
| 600 x 800 | one row | 5 | 93.6 | 5 (132) | 6 (156) | 7 (180) | 9 (228) | 11 (276) | 22 (540) DOES NOT FIT |
| 600 x 800 | one row | 6 | 74.7 | 6 (156) | 8 (204) | 10 (252) | 13 (324) | 18 (444) DOES NOT FIT | 32 (780) DOES NOT FIT |
| 600 x 800 | two a row | 3 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 4 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 5 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 6 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 520 x 800 | one row | 2 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | one row | 3 | 142.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 10 (252) |
| 520 x 800 | one row | 4 | 102 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 18 (444) DOES NOT FIT |
| 520 x 800 | one row | 5 | 77.6 | 5 (132) | 8 (204) | 10 (252) | 11 (276) | 15 (372) | 27 (660) DOES NOT FIT |
| 520 x 800 | one row | 6 | 61.3 | 12 (300) | 16 (396) | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 30 (732) DOES NOT FIT | 53 (1284) DOES NOT FIT |
| 520 x 800 | two a row | 3 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 4 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 5 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 6 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 480 x 800 | one row | 2 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 480 x 800 | one row | 3 | 129.3 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 12 (300) |
| 480 x 800 | one row | 4 | 92 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 11 (276) | 22 (540) DOES NOT FIT |
| 480 x 800 | one row | 5 | 69.6 | 7 (180) | 10 (252) | 13 (324) | 14 (348) | 19 (468) DOES NOT FIT | 35 (852) DOES NOT FIT |
| 480 x 800 | one row | 6 | 54.7 | 12 (300) WIDE | 18 (444) WIDE DOES NOT FIT | 22 (540) WIDE DOES NOT FIT | 25 (612) WIDE DOES NOT FIT | 32 (780) WIDE DOES NOT FIT | 65 (1572) WIDE DOES NOT FIT |
| 480 x 800 | two a row | 3 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 480 x 800 | two a row | 4 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 480 x 800 | two a row | 5 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 480 x 800 | two a row | 6 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 479 x 800 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 800 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 9 (228) |
| 479 x 800 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 13 (324) |
| 479 x 800 | one row | 5 | 83 | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 11 (276) | 20 (492) DOES NOT FIT |
| 479 x 800 | one row | 6 | 67.8 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) | 23 (564) DOES NOT FIT |
| 479 x 800 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 9 (228) DOES NOT FIT |
| 479 x 481 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 13 (324) DOES NOT FIT |
| 479 x 481 | one row | 5 | 83 | 5 (132) | 5 (132) | 7 (180) | 9 (228) DOES NOT FIT | 11 (276) DOES NOT FIT | 20 (492) DOES NOT FIT |
| 479 x 481 | one row | 6 | 67.8 | 5 (132) | 7 (180) | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 14 (348) DOES NOT FIT | 23 (564) DOES NOT FIT |
| 479 x 481 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 5 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 6 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 768 x 481 | one row | 2 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 481 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 768 x 481 | one row | 4 | 164 | 2 (60) | 3 (84) | 3 (84) | 3 (84) | 4 (108) | 8 (204) DOES NOT FIT |
| 768 x 481 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 12 (300) DOES NOT FIT |
| 768 x 481 | one row | 6 | 102.7 | 4 (108) | 5 (132) | 7 (180) | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 18 (444) DOES NOT FIT |
| 768 x 481 | two a row | 3 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 481 | two a row | 4 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 768 x 481 | two a row | 5 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 768 x 481 | two a row | 6 | 348 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1024 x 481 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 481 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1024 x 481 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1024 x 481 | one row | 6 | 145.3 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) DOES NOT FIT |
| 1024 x 481 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 360 x 481 | one row | 2 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 481 | one row | 3 | 104 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 14 (348) DOES NOT FIT |
| 360 x 481 | one row | 4 | 76 | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 9 (228) DOES NOT FIT | 11 (276) DOES NOT FIT | 22 (540) DOES NOT FIT |
| 360 x 481 | one row | 5 | 59.2 | 6 (156) | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 13 (324) DOES NOT FIT | 18 (444) DOES NOT FIT | 29 (708) DOES NOT FIT |
| 360 x 481 | one row | 6 | 48 | 9 (228) DOES NOT FIT | 12 (300) DOES NOT FIT | 17 (420) DOES NOT FIT | 19 (468) DOES NOT FIT | 25 (612) DOES NOT FIT | 40 (972) DOES NOT FIT |
| 360 x 481 | two a row | 3 | 160 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 4 | 160 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 5 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 6 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 321 x 640 | one row | 2 | 140.5 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) |
| 321 x 640 | one row | 3 | 91 | 3 (84) | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 16 (396) DOES NOT FIT |
| 321 x 640 | one row | 4 | 66.3 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) DOES NOT FIT | 24 (588) DOES NOT FIT |
| 321 x 640 | one row | 5 | 51.4 | 8 (204) | 10 (252) | 13 (324) DOES NOT FIT | 15 (372) DOES NOT FIT | 21 (516) DOES NOT FIT | 37 (900) DOES NOT FIT |
| 321 x 640 | one row | 6 | 41.5 | 12 (300) DOES NOT FIT | 18 (444) DOES NOT FIT | 23 (564) DOES NOT FIT | 24 (588) DOES NOT FIT | 33 (804) DOES NOT FIT | 62 (1500) DOES NOT FIT |
| 321 x 640 | two a row | 3 | 140.5 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 321 x 640 | two a row | 4 | 140.5 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 321 x 640 | two a row | 5 | 140.5 | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 9 (228) DOES NOT FIT |
| 321 x 640 | two a row | 6 | 140.5 | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 9 (228) DOES NOT FIT |

#### ai-act-example, start, en

Buttons drawn in: "Nova Square", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif

| viewport | layout | buttons | button width | 12 | 19 | 25 | 30 | 40 | title of 80 |
|---|---|---|---|---|---|---|---|---|---|
| 1280 x 640 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 640 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 640 | one row | 6 | 193.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1280 x 640 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1366 x 768 | one row | 3 | 435.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1366 x 768 | one row | 4 | 321.5 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1366 x 768 | one row | 5 | 253.2 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1366 x 768 | one row | 6 | 207.7 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1366 x 768 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 4 | 460 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1920 x 1080 | one row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 6 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 5 | 492 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 6 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 2560 x 1440 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 800 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 800 | one row | 6 | 193.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1280 x 800 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 768 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 1024 x 768 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1024 x 768 | one row | 6 | 145.3 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) | 9 (228) |
| 1024 x 768 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 768 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 768 x 1024 | one row | 2 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 768 x 1024 | one row | 4 | 164 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 768 x 1024 | one row | 5 | 127.2 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 768 x 1024 | one row | 6 | 102.7 | 3 (84) | 5 (132) | 7 (180) | 6 (156) | 10 (252) | 17 (420) |
| 768 x 1024 | two a row | 3 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 4 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 5 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | two a row | 6 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 390 x 844 | one row | 2 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | one row | 3 | 114 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 390 x 844 | one row | 4 | 83.5 | 3 (84) | 5 (132) | 7 (180) | 7 (180) | 10 (252) | 17 (420) |
| 390 x 844 | one row | 5 | 65.2 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) | 23 (564) DOES NOT FIT |
| 390 x 844 | one row | 6 | 53 | 7 (180) | 8 (204) | 12 (300) | 13 (324) | 19 (468) | 34 (828) DOES NOT FIT |
| 390 x 844 | two a row | 3 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 4 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 5 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 390 x 844 | two a row | 6 | 175 | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 360 x 640 | one row | 2 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 360 x 640 | one row | 3 | 104 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 12 (300) |
| 360 x 640 | one row | 4 | 76 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 11 (276) | 20 (492) DOES NOT FIT |
| 360 x 640 | one row | 5 | 59.2 | 6 (156) | 8 (204) | 8 (204) | 10 (252) | 16 (396) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 360 x 640 | one row | 6 | 48 | 9 (228) | 13 (324) | 14 (348) DOES NOT FIT | 15 (372) DOES NOT FIT | 24 (588) DOES NOT FIT | 38 (924) DOES NOT FIT |
| 360 x 640 | two a row | 3 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 4 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 5 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 640 | two a row | 6 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 320 x 480 | the minimumSize notice: no Answer row | | | | | | | | |
| 1279 x 640 | one row | 2 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | one row | 3 | 406.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 4 | 299.8 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 5 | 235.8 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 1279 x 640 | one row | 6 | 193.2 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1279 x 640 | two a row | 3 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 4 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 5 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 6 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | one row | 2 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | one row | 3 | 336 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1100 x 640 | one row | 4 | 247 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) |
| 1100 x 640 | one row | 5 | 193.6 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1100 x 640 | one row | 6 | 158 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) |
| 1100 x 640 | two a row | 3 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 4 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 5 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | two a row | 6 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1000 x 640 | one row | 2 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | one row | 3 | 302.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | one row | 4 | 222 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 1000 x 640 | one row | 5 | 173.6 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1000 x 640 | one row | 6 | 141.3 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 7 (180) | 9 (228) |
| 1000 x 640 | two a row | 3 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | two a row | 4 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | two a row | 5 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | two a row | 6 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 900 x 640 | one row | 2 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | one row | 3 | 269.3 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 900 x 640 | one row | 4 | 197 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 900 x 640 | one row | 5 | 153.6 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) | 8 (204) |
| 900 x 640 | one row | 6 | 124.7 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) DOES NOT FIT |
| 900 x 640 | two a row | 3 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | two a row | 4 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | two a row | 5 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 6 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | one row | 2 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 800 x 640 | one row | 3 | 236 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 800 x 640 | one row | 4 | 172 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 800 x 640 | one row | 5 | 133.6 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 10 (252) DOES NOT FIT |
| 800 x 640 | one row | 6 | 108 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) | 15 (372) DOES NOT FIT |
| 800 x 640 | two a row | 3 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 800 x 640 | two a row | 4 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 800 x 640 | two a row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 6 | 364 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 700 x 800 | one row | 2 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | one row | 3 | 202.7 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 700 x 800 | one row | 4 | 147 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) | 9 (228) |
| 700 x 800 | one row | 5 | 113.6 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) | 13 (324) |
| 700 x 800 | one row | 6 | 91.3 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 20 (492) DOES NOT FIT |
| 700 x 800 | two a row | 3 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 4 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 5 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 700 x 800 | two a row | 6 | 314 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 600 x 800 | one row | 2 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | one row | 3 | 169.3 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 600 x 800 | one row | 4 | 122 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 12 (300) |
| 600 x 800 | one row | 5 | 93.6 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 19 (468) DOES NOT FIT |
| 600 x 800 | one row | 6 | 74.7 | 6 (156) | 8 (204) | 8 (204) | 10 (252) | 16 (396) | 26 (636) DOES NOT FIT |
| 600 x 800 | two a row | 3 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 4 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 5 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | two a row | 6 | 264 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 520 x 800 | one row | 2 | 224 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 520 x 800 | one row | 3 | 142.7 | 2 (60) | 3 (84) | 3 (84) | 5 (132) | 6 (156) | 9 (228) |
| 520 x 800 | one row | 4 | 102 | 3 (84) | 5 (132) | 7 (180) | 6 (156) | 10 (252) | 17 (420) |
| 520 x 800 | one row | 5 | 77.6 | 5 (132) | 8 (204) | 8 (204) | 10 (252) | 15 (372) | 24 (588) DOES NOT FIT |
| 520 x 800 | one row | 6 | 61.3 | 12 (300) | 14 (348) | 17 (420) | 20 (492) DOES NOT FIT | 29 (708) DOES NOT FIT | 42 (1020) DOES NOT FIT |
| 520 x 800 | two a row | 3 | 224 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 4 | 224 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 5 | 224 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 520 x 800 | two a row | 6 | 224 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 480 x 800 | one row | 2 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | one row | 3 | 129.3 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 480 x 800 | one row | 4 | 92 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 11 (276) | 20 (492) DOES NOT FIT |
| 480 x 800 | one row | 5 | 69.6 | 7 (180) | 8 (204) | 12 (300) | 13 (324) | 19 (468) DOES NOT FIT | 32 (780) DOES NOT FIT |
| 480 x 800 | one row | 6 | 54.7 | 12 (300) WIDE | 18 (444) WIDE DOES NOT FIT | 19 (468) WIDE DOES NOT FIT | 27 (660) DOES NOT FIT | 32 (780) WIDE DOES NOT FIT | 65 (1572) DOES NOT FIT |
| 480 x 800 | two a row | 3 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | two a row | 4 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | two a row | 5 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 480 x 800 | two a row | 6 | 204 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 5 (132) |
| 479 x 800 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 800 | one row | 3 | 143.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) |
| 479 x 800 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 12 (300) |
| 479 x 800 | one row | 5 | 83 | 3 (84) | 5 (132) | 7 (180) | 7 (180) | 10 (252) | 17 (420) |
| 479 x 800 | one row | 6 | 67.8 | 5 (132) | 7 (180) | 8 (204) | 9 (228) | 14 (348) | 24 (588) DOES NOT FIT |
| 479 x 800 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 3 | 143.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) |
| 479 x 481 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 12 (300) DOES NOT FIT |
| 479 x 481 | one row | 5 | 83 | 3 (84) | 5 (132) | 7 (180) | 7 (180) | 10 (252) DOES NOT FIT | 17 (420) DOES NOT FIT |
| 479 x 481 | one row | 6 | 67.8 | 5 (132) | 7 (180) | 8 (204) | 9 (228) DOES NOT FIT | 14 (348) DOES NOT FIT | 24 (588) DOES NOT FIT |
| 479 x 481 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 768 x 481 | one row | 2 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 481 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 768 x 481 | one row | 4 | 164 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 768 x 481 | one row | 5 | 127.2 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) DOES NOT FIT |
| 768 x 481 | one row | 6 | 102.7 | 3 (84) | 5 (132) | 7 (180) | 6 (156) | 10 (252) DOES NOT FIT | 17 (420) DOES NOT FIT |
| 768 x 481 | two a row | 3 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 481 | two a row | 4 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 481 | two a row | 5 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 768 x 481 | two a row | 6 | 348 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1024 x 481 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 1024 x 481 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1024 x 481 | one row | 6 | 145.3 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) | 9 (228) DOES NOT FIT |
| 1024 x 481 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1024 x 481 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 360 x 481 | one row | 2 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 360 x 481 | one row | 3 | 104 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 12 (300) DOES NOT FIT |
| 360 x 481 | one row | 4 | 76 | 4 (108) | 5 (132) | 7 (180) | 8 (204) DOES NOT FIT | 11 (276) DOES NOT FIT | 20 (492) DOES NOT FIT |
| 360 x 481 | one row | 5 | 59.2 | 6 (156) | 8 (204) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 16 (396) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 360 x 481 | one row | 6 | 48 | 9 (228) DOES NOT FIT | 13 (324) DOES NOT FIT | 14 (348) DOES NOT FIT | 15 (372) DOES NOT FIT | 24 (588) DOES NOT FIT | 38 (924) DOES NOT FIT |
| 360 x 481 | two a row | 3 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 4 | 160 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 5 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 360 x 481 | two a row | 6 | 160 | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 321 x 640 | one row | 2 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) |
| 321 x 640 | one row | 3 | 91 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 9 (228) | 15 (372) DOES NOT FIT |
| 321 x 640 | one row | 4 | 66.3 | 5 (132) | 7 (180) | 8 (204) | 9 (228) | 14 (348) DOES NOT FIT | 24 (588) DOES NOT FIT |
| 321 x 640 | one row | 5 | 51.4 | 7 (180) | 10 (252) | 12 (300) | 13 (324) | 19 (468) DOES NOT FIT | 36 (876) DOES NOT FIT |
| 321 x 640 | one row | 6 | 41.5 | 12 (300) WIDE | 16 (396) WIDE DOES NOT FIT | 19 (468) WIDE DOES NOT FIT | 25 (612) DOES NOT FIT | 31 (756) WIDE DOES NOT FIT | 54 (1308) DOES NOT FIT |
| 321 x 640 | two a row | 3 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) DOES NOT FIT |
| 321 x 640 | two a row | 4 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 8 (204) DOES NOT FIT |
| 321 x 640 | two a row | 5 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 321 x 640 | two a row | 6 | 140.5 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |

#### full-node, en: the lowest window that holds the buttons

| width | 2, 19 | 3, 19 | 4, 19 | 2, 25 | 3, 25 | 4, 25 |
|---|---|---|---|---|---|---|
| 321 | 481 (2) | 488 (2) | 488 (2) | 481 (3) | 536 (3) | 536 (3) |
| 360 | 481 (2) | 488 (2) | 488 (2) | 481 (3) | 536 (3) | 536 (3) |
| 390 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 420 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 479 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 480 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 520 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 600 | 481 (1) | 481 (1) | 481 (1) | 481 (2) | 481 (2) | 481 (2) |
| 700 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 767 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 768 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 800 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 900 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 1000 | 481 (1) | 481 (1) | 481 (2) | 481 (1) | 481 (2) | 481 (2) |
| 1100 | 481 (1) | 481 (1) | 481 (2) | 481 (1) | 481 (1) | 481 (2) |
| 1279 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (2) |

#### full-node, nl: the lowest window that holds the buttons

| width | 2, 19 | 3, 19 | 4, 19 | 2, 25 | 3, 25 | 4, 25 |
|---|---|---|---|---|---|---|
| 321 | 481 (2) | 488 (2) | 488 (2) | 481 (3) | 536 (3) | 536 (3) |
| 360 | 481 (2) | 488 (2) | 488 (2) | 481 (3) | 536 (3) | 536 (3) |
| 390 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 420 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 479 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 480 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 520 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 600 | 481 (1) | 481 (1) | 481 (1) | 481 (2) | 481 (2) | 481 (2) |
| 700 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 767 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 768 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 800 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 900 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 1000 | 481 (1) | 481 (1) | 481 (2) | 481 (1) | 481 (2) | 481 (2) |
| 1100 | 481 (1) | 481 (1) | 481 (2) | 481 (1) | 481 (1) | 481 (2) |
| 1279 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (2) |

### 5.2 Every button in Verdana

#### full-node, en, the buttons in Verdana

Buttons drawn in: Verdana

| viewport | layout | buttons | button width | 12 | 19 | 25 | 30 | 40 | title of 80 |
|---|---|---|---|---|---|---|---|---|---|
| 1280 x 640 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 640 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 640 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 640 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 1280 x 640 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1366 x 768 | one row | 3 | 435.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1366 x 768 | one row | 4 | 321.5 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1366 x 768 | one row | 5 | 253.2 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1366 x 768 | one row | 6 | 207.7 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1366 x 768 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 4 | 460 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 6 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1920 x 1080 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 5 | 492 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 2560 x 1440 | one row | 6 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 2560 x 1440 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 800 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 800 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 800 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 1280 x 800 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 768 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 768 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1024 x 768 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 1024 x 768 | one row | 6 | 145.3 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 1024 x 768 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | one row | 2 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 768 x 1024 | one row | 4 | 164 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 9 (228) |
| 768 x 1024 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 8 (204) | 14 (348) |
| 768 x 1024 | one row | 6 | 102.7 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 20 (492) |
| 768 x 1024 | two a row | 3 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 4 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 5 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 6 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 390 x 844 | one row | 2 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | one row | 3 | 114 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 13 (324) |
| 390 x 844 | one row | 4 | 83.5 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 22 (540) DOES NOT FIT |
| 390 x 844 | one row | 5 | 65.2 | 6 (156) | 8 (204) | 10 (252) | 13 (324) | 18 (444) | 27 (660) DOES NOT FIT |
| 390 x 844 | one row | 6 | 53 | 8 (204) | 11 (276) | 15 (372) | 16 (396) | 22 (540) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 390 x 844 | two a row | 3 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | two a row | 4 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | two a row | 5 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 390 x 844 | two a row | 6 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | one row | 2 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 360 x 640 | one row | 3 | 104 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) | 16 (396) DOES NOT FIT |
| 360 x 640 | one row | 4 | 76 | 4 (108) | 6 (156) | 8 (204) | 10 (252) | 14 (348) DOES NOT FIT | 24 (588) DOES NOT FIT |
| 360 x 640 | one row | 5 | 59.2 | 6 (156) | 8 (204) | 11 (276) DOES NOT FIT | 14 (348) DOES NOT FIT | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 360 x 640 | one row | 6 | 48 | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 53 (1284) DOES NOT FIT |
| 360 x 640 | two a row | 3 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 4 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 5 | 160 | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 6 | 160 | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 320 x 480 | the minimumSize notice: no Answer row | | | | | | | | |
| 1279 x 640 | one row | 2 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | one row | 3 | 406.3 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 4 | 299.8 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1279 x 640 | one row | 5 | 235.8 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1279 x 640 | one row | 6 | 193.2 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1279 x 640 | two a row | 3 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 4 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 5 | 619.5 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1279 x 640 | two a row | 6 | 619.5 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1100 x 640 | one row | 2 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | one row | 3 | 336 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1100 x 640 | one row | 4 | 247 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1100 x 640 | one row | 5 | 193.6 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 1100 x 640 | one row | 6 | 158 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 1100 x 640 | two a row | 3 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 4 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 5 | 514 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1100 x 640 | two a row | 6 | 514 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1000 x 640 | one row | 2 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | one row | 3 | 302.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1000 x 640 | one row | 4 | 222 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1000 x 640 | one row | 5 | 173.6 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 8 (204) DOES NOT FIT |
| 1000 x 640 | one row | 6 | 141.3 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 11 (276) DOES NOT FIT |
| 1000 x 640 | two a row | 3 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1000 x 640 | two a row | 4 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1000 x 640 | two a row | 5 | 464 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 1000 x 640 | two a row | 6 | 464 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 900 x 640 | one row | 2 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | one row | 3 | 269.3 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 900 x 640 | one row | 4 | 197 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 900 x 640 | one row | 5 | 153.6 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 900 x 640 | one row | 6 | 124.7 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) DOES NOT FIT | 15 (372) DOES NOT FIT |
| 900 x 640 | two a row | 3 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 4 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 5 | 414 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 6 | 414 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 800 x 640 | one row | 2 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 800 x 640 | one row | 3 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 800 x 640 | one row | 4 | 172 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) | 8 (204) DOES NOT FIT |
| 800 x 640 | one row | 5 | 133.6 | 2 (60) | 4 (108) | 5 (132) | 5 (132) | 7 (180) DOES NOT FIT | 12 (300) DOES NOT FIT |
| 800 x 640 | one row | 6 | 108 | 3 (84) | 5 (132) | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 19 (468) DOES NOT FIT |
| 800 x 640 | two a row | 3 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 4 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 5 | 364 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 6 | 364 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 700 x 800 | one row | 2 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | one row | 3 | 202.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 700 x 800 | one row | 4 | 147 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 700 x 800 | one row | 5 | 113.6 | 3 (84) | 5 (132) | 7 (180) | 7 (180) | 10 (252) | 16 (396) |
| 700 x 800 | one row | 6 | 91.3 | 4 (108) | 6 (156) | 8 (204) | 10 (252) | 14 (348) | 24 (588) DOES NOT FIT |
| 700 x 800 | two a row | 3 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 4 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 5 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 6 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | one row | 2 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | one row | 3 | 169.3 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) | 9 (228) |
| 600 x 800 | one row | 4 | 122 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) | 15 (372) |
| 600 x 800 | one row | 5 | 93.6 | 4 (108) | 6 (156) | 8 (204) | 9 (228) | 13 (324) | 24 (588) DOES NOT FIT |
| 600 x 800 | one row | 6 | 74.7 | 6 (156) | 9 (228) | 12 (300) | 14 (348) | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 600 x 800 | two a row | 3 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 4 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 5 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) DOES NOT FIT |
| 600 x 800 | two a row | 6 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) DOES NOT FIT |
| 520 x 800 | one row | 2 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | one row | 3 | 142.7 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 520 x 800 | one row | 4 | 102 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 20 (492) DOES NOT FIT |
| 520 x 800 | one row | 5 | 77.6 | 6 (156) | 8 (204) | 11 (276) | 13 (324) | 18 (444) DOES NOT FIT | 32 (780) DOES NOT FIT |
| 520 x 800 | one row | 6 | 61.3 | 12 (300) | 17 (420) DOES NOT FIT | 22 (540) DOES NOT FIT | 25 (612) DOES NOT FIT | 32 (780) DOES NOT FIT | 59 (1428) DOES NOT FIT |
| 520 x 800 | two a row | 3 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | two a row | 4 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | two a row | 5 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 520 x 800 | two a row | 6 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 480 x 800 | one row | 2 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | one row | 3 | 129.3 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 13 (324) |
| 480 x 800 | one row | 4 | 92 | 4 (108) | 6 (156) | 8 (204) | 10 (252) | 14 (348) | 24 (588) DOES NOT FIT |
| 480 x 800 | one row | 5 | 69.6 | 8 (204) | 11 (276) | 13 (324) | 15 (372) | 22 (540) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 480 x 800 | one row | 6 | 54.7 | 12 (300) WIDE | 18 (444) WIDE DOES NOT FIT | 24 (588) WIDE DOES NOT FIT | 27 (660) WIDE DOES NOT FIT | 35 (852) WIDE DOES NOT FIT | 67 (1620) WIDE DOES NOT FIT |
| 480 x 800 | two a row | 3 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | two a row | 4 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | two a row | 5 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 480 x 800 | two a row | 6 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 479 x 800 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) |
| 479 x 800 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) | 15 (372) |
| 479 x 800 | one row | 5 | 83 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 11 (276) | 22 (540) DOES NOT FIT |
| 479 x 800 | one row | 6 | 67.8 | 5 (132) | 7 (180) | 9 (228) | 10 (252) | 15 (372) | 26 (636) DOES NOT FIT |
| 479 x 800 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 479 x 481 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) DOES NOT FIT | 15 (372) DOES NOT FIT |
| 479 x 481 | one row | 5 | 83 | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 11 (276) DOES NOT FIT | 22 (540) DOES NOT FIT |
| 479 x 481 | one row | 6 | 67.8 | 5 (132) | 7 (180) DOES NOT FIT | 9 (228) DOES NOT FIT | 10 (252) DOES NOT FIT | 15 (372) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 479 x 481 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 5 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 6 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 768 x 481 | one row | 2 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 481 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 768 x 481 | one row | 4 | 164 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 9 (228) DOES NOT FIT |
| 768 x 481 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 8 (204) DOES NOT FIT | 14 (348) DOES NOT FIT |
| 768 x 481 | one row | 6 | 102.7 | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 20 (492) DOES NOT FIT |
| 768 x 481 | two a row | 3 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 4 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 5 | 348 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 6 | 348 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1024 x 481 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 481 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 1024 x 481 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 1024 x 481 | one row | 6 | 145.3 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 11 (276) DOES NOT FIT |
| 1024 x 481 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1024 x 481 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1024 x 481 | two a row | 5 | 476 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 1024 x 481 | two a row | 6 | 476 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 360 x 481 | one row | 2 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 481 | one row | 3 | 104 | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT | 5 (132) DOES NOT FIT | 9 (228) DOES NOT FIT | 16 (396) DOES NOT FIT |
| 360 x 481 | one row | 4 | 76 | 4 (108) | 6 (156) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 14 (348) DOES NOT FIT | 24 (588) DOES NOT FIT |
| 360 x 481 | one row | 5 | 59.2 | 6 (156) DOES NOT FIT | 8 (204) DOES NOT FIT | 11 (276) DOES NOT FIT | 14 (348) DOES NOT FIT | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 360 x 481 | one row | 6 | 48 | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 53 (1284) DOES NOT FIT |
| 360 x 481 | two a row | 3 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 4 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 5 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 6 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 321 x 640 | one row | 2 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) |
| 321 x 640 | one row | 3 | 91 | 3 (84) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 19 (468) DOES NOT FIT |
| 321 x 640 | one row | 4 | 66.3 | 6 (156) | 8 (204) | 9 (228) | 10 (252) | 16 (396) DOES NOT FIT | 27 (660) DOES NOT FIT |
| 321 x 640 | one row | 5 | 51.4 | 10 (252) | 14 (348) DOES NOT FIT | 17 (420) DOES NOT FIT | 20 (492) DOES NOT FIT | 28 (684) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 321 x 640 | one row | 6 | 41.5 | 11 (276) WIDE DOES NOT FIT | 18 (444) DOES NOT FIT | 22 (540) WIDE DOES NOT FIT | 25 (612) WIDE DOES NOT FIT | 32 (780) WIDE DOES NOT FIT | 65 (1572) WIDE DOES NOT FIT |
| 321 x 640 | two a row | 3 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 4 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 5 | 140.5 | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 6 | 140.5 | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |

#### full-node, nl, the buttons in Verdana

Buttons drawn in: Verdana

| viewport | layout | buttons | button width | 12 | 19 | 25 | 30 | 40 | title of 80 |
|---|---|---|---|---|---|---|---|---|---|
| 1280 x 640 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 640 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 640 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 640 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 1280 x 640 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1366 x 768 | one row | 3 | 435.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1366 x 768 | one row | 4 | 321.5 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1366 x 768 | one row | 5 | 253.2 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1366 x 768 | one row | 6 | 207.7 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1366 x 768 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 4 | 460 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 6 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1920 x 1080 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 5 | 492 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 2560 x 1440 | one row | 6 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 2560 x 1440 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 800 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 800 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 800 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 1280 x 800 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 768 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 768 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1024 x 768 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 1024 x 768 | one row | 6 | 145.3 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 11 (276) |
| 1024 x 768 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | one row | 2 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 768 x 1024 | one row | 4 | 164 | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 9 (228) |
| 768 x 1024 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 14 (348) |
| 768 x 1024 | one row | 6 | 102.7 | 5 (132) | 6 (156) | 7 (180) | 9 (228) | 11 (276) | 20 (492) |
| 768 x 1024 | two a row | 3 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 4 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 5 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 6 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 390 x 844 | one row | 2 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | one row | 3 | 114 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 14 (348) |
| 390 x 844 | one row | 4 | 83.5 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 12 (300) | 22 (540) DOES NOT FIT |
| 390 x 844 | one row | 5 | 65.2 | 6 (156) | 8 (204) | 10 (252) | 13 (324) | 18 (444) | 27 (660) DOES NOT FIT |
| 390 x 844 | one row | 6 | 53 | 8 (204) | 11 (276) | 15 (372) | 16 (396) | 22 (540) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 390 x 844 | two a row | 3 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | two a row | 4 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | two a row | 5 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 390 x 844 | two a row | 6 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | one row | 2 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 360 x 640 | one row | 3 | 104 | 3 (84) | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 16 (396) DOES NOT FIT |
| 360 x 640 | one row | 4 | 76 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) DOES NOT FIT | 23 (564) DOES NOT FIT |
| 360 x 640 | one row | 5 | 59.2 | 6 (156) | 9 (228) | 11 (276) DOES NOT FIT | 14 (348) DOES NOT FIT | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 360 x 640 | one row | 6 | 48 | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 53 (1284) DOES NOT FIT |
| 360 x 640 | two a row | 3 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 4 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 5 | 160 | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 6 | 160 | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 320 x 480 | the minimumSize notice: no Answer row | | | | | | | | |
| 1279 x 640 | one row | 2 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | one row | 3 | 406.3 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 4 | 299.8 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1279 x 640 | one row | 5 | 235.8 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1279 x 640 | one row | 6 | 193.2 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1279 x 640 | two a row | 3 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 4 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 5 | 619.5 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1279 x 640 | two a row | 6 | 619.5 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1100 x 640 | one row | 2 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | one row | 3 | 336 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1100 x 640 | one row | 4 | 247 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1100 x 640 | one row | 5 | 193.6 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 1100 x 640 | one row | 6 | 158 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 1100 x 640 | two a row | 3 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 4 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 5 | 514 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1100 x 640 | two a row | 6 | 514 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1000 x 640 | one row | 2 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | one row | 3 | 302.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1000 x 640 | one row | 4 | 222 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1000 x 640 | one row | 5 | 173.6 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 1000 x 640 | one row | 6 | 141.3 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) DOES NOT FIT | 11 (276) DOES NOT FIT |
| 1000 x 640 | two a row | 3 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1000 x 640 | two a row | 4 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1000 x 640 | two a row | 5 | 464 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 1000 x 640 | two a row | 6 | 464 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 900 x 640 | one row | 2 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | one row | 3 | 269.3 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 900 x 640 | one row | 4 | 197 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 900 x 640 | one row | 5 | 153.6 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 900 x 640 | one row | 6 | 124.7 | 3 (84) | 4 (108) | 5 (132) | 7 (180) DOES NOT FIT | 9 (228) DOES NOT FIT | 14 (348) DOES NOT FIT |
| 900 x 640 | two a row | 3 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 4 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 5 | 414 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 6 | 414 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 800 x 640 | one row | 2 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 800 x 640 | one row | 3 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 800 x 640 | one row | 4 | 172 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 800 x 640 | one row | 5 | 133.6 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 13 (324) DOES NOT FIT |
| 800 x 640 | one row | 6 | 108 | 5 (132) | 5 (132) | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 11 (276) DOES NOT FIT | 19 (468) DOES NOT FIT |
| 800 x 640 | two a row | 3 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 4 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 5 | 364 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 6 | 364 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 700 x 800 | one row | 2 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | one row | 3 | 202.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 700 x 800 | one row | 4 | 147 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 11 (276) |
| 700 x 800 | one row | 5 | 113.6 | 3 (84) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 16 (396) |
| 700 x 800 | one row | 6 | 91.3 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) | 24 (588) DOES NOT FIT |
| 700 x 800 | two a row | 3 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 4 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 5 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 6 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | one row | 2 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | one row | 3 | 169.3 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) |
| 600 x 800 | one row | 4 | 122 | 3 (84) | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 15 (372) |
| 600 x 800 | one row | 5 | 93.6 | 5 (132) | 7 (180) | 8 (204) | 9 (228) | 13 (324) | 23 (564) DOES NOT FIT |
| 600 x 800 | one row | 6 | 74.7 | 6 (156) | 9 (228) | 12 (300) | 14 (348) | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 600 x 800 | two a row | 3 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 4 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 5 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) DOES NOT FIT |
| 600 x 800 | two a row | 6 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) DOES NOT FIT |
| 520 x 800 | one row | 2 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | one row | 3 | 142.7 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 11 (276) |
| 520 x 800 | one row | 4 | 102 | 5 (132) | 6 (156) | 7 (180) | 9 (228) | 11 (276) | 20 (492) DOES NOT FIT |
| 520 x 800 | one row | 5 | 77.6 | 6 (156) | 8 (204) | 11 (276) | 13 (324) | 18 (444) DOES NOT FIT | 32 (780) DOES NOT FIT |
| 520 x 800 | one row | 6 | 61.3 | 12 (300) | 17 (420) DOES NOT FIT | 22 (540) DOES NOT FIT | 25 (612) DOES NOT FIT | 32 (780) DOES NOT FIT | 59 (1428) DOES NOT FIT |
| 520 x 800 | two a row | 3 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | two a row | 4 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | two a row | 5 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 520 x 800 | two a row | 6 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 480 x 800 | one row | 2 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | one row | 3 | 129.3 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 14 (348) |
| 480 x 800 | one row | 4 | 92 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) | 23 (564) DOES NOT FIT |
| 480 x 800 | one row | 5 | 69.6 | 8 (204) | 11 (276) | 13 (324) | 15 (372) | 22 (540) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 480 x 800 | one row | 6 | 54.7 | 12 (300) WIDE | 18 (444) WIDE DOES NOT FIT | 24 (588) WIDE DOES NOT FIT | 27 (660) WIDE DOES NOT FIT | 35 (852) WIDE DOES NOT FIT | 67 (1620) WIDE DOES NOT FIT |
| 480 x 800 | two a row | 3 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | two a row | 4 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | two a row | 5 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 480 x 800 | two a row | 6 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 479 x 800 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 10 (252) |
| 479 x 800 | one row | 4 | 105.8 | 3 (84) | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 15 (372) |
| 479 x 800 | one row | 5 | 83 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 12 (300) | 22 (540) DOES NOT FIT |
| 479 x 800 | one row | 6 | 67.8 | 5 (132) | 8 (204) | 10 (252) | 11 (276) | 15 (372) | 26 (636) DOES NOT FIT |
| 479 x 800 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 10 (252) DOES NOT FIT |
| 479 x 481 | one row | 4 | 105.8 | 3 (84) | 5 (132) | 5 (132) | 7 (180) DOES NOT FIT | 9 (228) DOES NOT FIT | 15 (372) DOES NOT FIT |
| 479 x 481 | one row | 5 | 83 | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 9 (228) DOES NOT FIT | 12 (300) DOES NOT FIT | 22 (540) DOES NOT FIT |
| 479 x 481 | one row | 6 | 67.8 | 5 (132) | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 11 (276) DOES NOT FIT | 15 (372) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 479 x 481 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 5 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 6 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 768 x 481 | one row | 2 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 481 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 768 x 481 | one row | 4 | 164 | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 768 x 481 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 14 (348) DOES NOT FIT |
| 768 x 481 | one row | 6 | 102.7 | 5 (132) | 6 (156) | 7 (180) DOES NOT FIT | 9 (228) DOES NOT FIT | 11 (276) DOES NOT FIT | 20 (492) DOES NOT FIT |
| 768 x 481 | two a row | 3 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 4 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 5 | 348 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 6 | 348 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 4 (108) DOES NOT FIT |
| 1024 x 481 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 481 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 1024 x 481 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 1024 x 481 | one row | 6 | 145.3 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 6 (156) DOES NOT FIT | 11 (276) DOES NOT FIT |
| 1024 x 481 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1024 x 481 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1024 x 481 | two a row | 5 | 476 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 1024 x 481 | two a row | 6 | 476 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT |
| 360 x 481 | one row | 2 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 481 | one row | 3 | 104 | 3 (84) | 5 (132) DOES NOT FIT | 5 (132) DOES NOT FIT | 7 (180) DOES NOT FIT | 9 (228) DOES NOT FIT | 16 (396) DOES NOT FIT |
| 360 x 481 | one row | 4 | 76 | 5 (132) DOES NOT FIT | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 14 (348) DOES NOT FIT | 23 (564) DOES NOT FIT |
| 360 x 481 | one row | 5 | 59.2 | 6 (156) DOES NOT FIT | 9 (228) DOES NOT FIT | 11 (276) DOES NOT FIT | 14 (348) DOES NOT FIT | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 360 x 481 | one row | 6 | 48 | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 53 (1284) DOES NOT FIT |
| 360 x 481 | two a row | 3 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 4 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 5 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 6 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 321 x 640 | one row | 2 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) |
| 321 x 640 | one row | 3 | 91 | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 11 (276) DOES NOT FIT | 19 (468) DOES NOT FIT |
| 321 x 640 | one row | 4 | 66.3 | 6 (156) | 8 (204) | 10 (252) | 11 (276) DOES NOT FIT | 16 (396) DOES NOT FIT | 27 (660) DOES NOT FIT |
| 321 x 640 | one row | 5 | 51.4 | 10 (252) | 14 (348) DOES NOT FIT | 17 (420) DOES NOT FIT | 20 (492) DOES NOT FIT | 28 (684) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 321 x 640 | one row | 6 | 41.5 | 11 (276) WIDE DOES NOT FIT | 18 (444) DOES NOT FIT | 22 (540) WIDE DOES NOT FIT | 25 (612) WIDE DOES NOT FIT | 32 (780) WIDE DOES NOT FIT | 65 (1572) WIDE DOES NOT FIT |
| 321 x 640 | two a row | 3 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 4 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 5 | 140.5 | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 6 | 140.5 | 2 (60) | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |

#### ai-act-applicability-agrifood, start, nl, the buttons in Verdana

Buttons drawn in: Verdana

| viewport | layout | buttons | button width | 12 | 19 | 25 | 30 | 40 | title of 80 |
|---|---|---|---|---|---|---|---|---|---|
| 1280 x 640 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 640 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 640 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 640 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 1280 x 640 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1366 x 768 | one row | 3 | 435.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1366 x 768 | one row | 4 | 321.5 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1366 x 768 | one row | 5 | 253.2 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1366 x 768 | one row | 6 | 207.7 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1366 x 768 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 4 | 460 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 6 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1920 x 1080 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 5 | 492 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 2560 x 1440 | one row | 6 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 2560 x 1440 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 800 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 800 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 800 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 1280 x 800 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 768 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 768 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1024 x 768 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 1024 x 768 | one row | 6 | 145.3 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 11 (276) |
| 1024 x 768 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | one row | 2 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 768 x 1024 | one row | 4 | 164 | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 9 (228) |
| 768 x 1024 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 14 (348) |
| 768 x 1024 | one row | 6 | 102.7 | 5 (132) | 6 (156) | 7 (180) | 9 (228) | 11 (276) | 20 (492) |
| 768 x 1024 | two a row | 3 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 4 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 5 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 6 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 390 x 844 | one row | 2 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | one row | 3 | 114 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 14 (348) |
| 390 x 844 | one row | 4 | 83.5 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 12 (300) | 22 (540) DOES NOT FIT |
| 390 x 844 | one row | 5 | 65.2 | 6 (156) | 8 (204) | 10 (252) | 13 (324) | 18 (444) | 27 (660) DOES NOT FIT |
| 390 x 844 | one row | 6 | 53 | 8 (204) | 11 (276) | 15 (372) | 16 (396) | 22 (540) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 390 x 844 | two a row | 3 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | two a row | 4 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | two a row | 5 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 390 x 844 | two a row | 6 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | one row | 2 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 360 x 640 | one row | 3 | 104 | 3 (84) | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 16 (396) DOES NOT FIT |
| 360 x 640 | one row | 4 | 76 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) DOES NOT FIT | 23 (564) DOES NOT FIT |
| 360 x 640 | one row | 5 | 59.2 | 6 (156) | 9 (228) | 11 (276) | 14 (348) DOES NOT FIT | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 360 x 640 | one row | 6 | 48 | 12 (300) | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 53 (1284) DOES NOT FIT |
| 360 x 640 | two a row | 3 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 4 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 5 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 6 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 320 x 480 | the minimumSize notice: no Answer row | | | | | | | | |
| 1279 x 640 | one row | 2 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | one row | 3 | 406.3 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 4 | 299.8 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1279 x 640 | one row | 5 | 235.8 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1279 x 640 | one row | 6 | 193.2 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1279 x 640 | two a row | 3 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 4 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 5 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 6 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | one row | 2 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | one row | 3 | 336 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1100 x 640 | one row | 4 | 247 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1100 x 640 | one row | 5 | 193.6 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1100 x 640 | one row | 6 | 158 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 1100 x 640 | two a row | 3 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 4 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 5 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 6 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | one row | 2 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | one row | 3 | 302.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1000 x 640 | one row | 4 | 222 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1000 x 640 | one row | 5 | 173.6 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 1000 x 640 | one row | 6 | 141.3 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 11 (276) DOES NOT FIT |
| 1000 x 640 | two a row | 3 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | two a row | 4 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | two a row | 5 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1000 x 640 | two a row | 6 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | one row | 2 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | one row | 3 | 269.3 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 900 x 640 | one row | 4 | 197 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 900 x 640 | one row | 5 | 153.6 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 900 x 640 | one row | 6 | 124.7 | 3 (84) | 4 (108) | 5 (132) | 7 (180) | 9 (228) DOES NOT FIT | 14 (348) DOES NOT FIT |
| 900 x 640 | two a row | 3 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | two a row | 4 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | two a row | 5 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 6 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | one row | 2 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 800 x 640 | one row | 3 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 800 x 640 | one row | 4 | 172 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 800 x 640 | one row | 5 | 133.6 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 13 (324) DOES NOT FIT |
| 800 x 640 | one row | 6 | 108 | 5 (132) | 5 (132) | 7 (180) | 8 (204) | 11 (276) DOES NOT FIT | 19 (468) DOES NOT FIT |
| 800 x 640 | two a row | 3 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 800 x 640 | two a row | 4 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 800 x 640 | two a row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 6 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 700 x 800 | one row | 2 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | one row | 3 | 202.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 700 x 800 | one row | 4 | 147 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 11 (276) |
| 700 x 800 | one row | 5 | 113.6 | 3 (84) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 16 (396) |
| 700 x 800 | one row | 6 | 91.3 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) | 24 (588) DOES NOT FIT |
| 700 x 800 | two a row | 3 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 4 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 5 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 6 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | one row | 2 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | one row | 3 | 169.3 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 9 (228) |
| 600 x 800 | one row | 4 | 122 | 3 (84) | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 15 (372) |
| 600 x 800 | one row | 5 | 93.6 | 5 (132) | 7 (180) | 8 (204) | 9 (228) | 13 (324) | 23 (564) DOES NOT FIT |
| 600 x 800 | one row | 6 | 74.7 | 6 (156) | 9 (228) | 12 (300) | 14 (348) | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 600 x 800 | two a row | 3 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 4 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 5 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 6 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 520 x 800 | one row | 2 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | one row | 3 | 142.7 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 11 (276) |
| 520 x 800 | one row | 4 | 102 | 5 (132) | 6 (156) | 7 (180) | 9 (228) | 11 (276) | 20 (492) DOES NOT FIT |
| 520 x 800 | one row | 5 | 77.6 | 6 (156) | 8 (204) | 11 (276) | 13 (324) | 18 (444) DOES NOT FIT | 32 (780) DOES NOT FIT |
| 520 x 800 | one row | 6 | 61.3 | 12 (300) | 17 (420) DOES NOT FIT | 22 (540) DOES NOT FIT | 25 (612) DOES NOT FIT | 32 (780) DOES NOT FIT | 59 (1428) DOES NOT FIT |
| 520 x 800 | two a row | 3 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | two a row | 4 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | two a row | 5 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 520 x 800 | two a row | 6 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 480 x 800 | one row | 2 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | one row | 3 | 129.3 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) | 14 (348) |
| 480 x 800 | one row | 4 | 92 | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 14 (348) | 23 (564) DOES NOT FIT |
| 480 x 800 | one row | 5 | 69.6 | 8 (204) | 11 (276) | 13 (324) | 15 (372) | 22 (540) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 480 x 800 | one row | 6 | 54.7 | 12 (300) WIDE | 18 (444) WIDE DOES NOT FIT | 24 (588) WIDE DOES NOT FIT | 27 (660) WIDE DOES NOT FIT | 35 (852) WIDE DOES NOT FIT | 67 (1620) WIDE DOES NOT FIT |
| 480 x 800 | two a row | 3 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | two a row | 4 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | two a row | 5 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 480 x 800 | two a row | 6 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 479 x 800 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 10 (252) |
| 479 x 800 | one row | 4 | 105.8 | 3 (84) | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 15 (372) |
| 479 x 800 | one row | 5 | 83 | 5 (132) | 6 (156) | 8 (204) | 9 (228) | 12 (300) | 22 (540) DOES NOT FIT |
| 479 x 800 | one row | 6 | 67.8 | 5 (132) | 8 (204) | 10 (252) | 11 (276) | 15 (372) | 26 (636) DOES NOT FIT |
| 479 x 800 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 10 (252) DOES NOT FIT |
| 479 x 481 | one row | 4 | 105.8 | 3 (84) | 5 (132) | 5 (132) | 7 (180) | 9 (228) DOES NOT FIT | 15 (372) DOES NOT FIT |
| 479 x 481 | one row | 5 | 83 | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 9 (228) DOES NOT FIT | 12 (300) DOES NOT FIT | 22 (540) DOES NOT FIT |
| 479 x 481 | one row | 6 | 67.8 | 5 (132) | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 11 (276) DOES NOT FIT | 15 (372) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 479 x 481 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 5 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 6 | 219.5 | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 768 x 481 | one row | 2 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 481 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 768 x 481 | one row | 4 | 164 | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 9 (228) DOES NOT FIT |
| 768 x 481 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 8 (204) DOES NOT FIT | 14 (348) DOES NOT FIT |
| 768 x 481 | one row | 6 | 102.7 | 5 (132) | 6 (156) | 7 (180) | 9 (228) DOES NOT FIT | 11 (276) DOES NOT FIT | 20 (492) DOES NOT FIT |
| 768 x 481 | two a row | 3 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 4 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 5 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 6 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1024 x 481 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 481 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1024 x 481 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 1024 x 481 | one row | 6 | 145.3 | 3 (84) | 4 (108) | 4 (108) | 5 (132) | 6 (156) | 11 (276) DOES NOT FIT |
| 1024 x 481 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1024 x 481 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 360 x 481 | one row | 2 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 481 | one row | 3 | 104 | 3 (84) | 5 (132) | 5 (132) | 7 (180) DOES NOT FIT | 9 (228) DOES NOT FIT | 16 (396) DOES NOT FIT |
| 360 x 481 | one row | 4 | 76 | 5 (132) | 7 (180) DOES NOT FIT | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 14 (348) DOES NOT FIT | 23 (564) DOES NOT FIT |
| 360 x 481 | one row | 5 | 59.2 | 6 (156) | 9 (228) DOES NOT FIT | 11 (276) DOES NOT FIT | 14 (348) DOES NOT FIT | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 360 x 481 | one row | 6 | 48 | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 53 (1284) DOES NOT FIT |
| 360 x 481 | two a row | 3 | 160 | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 4 | 160 | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 5 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 6 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 321 x 640 | one row | 2 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) |
| 321 x 640 | one row | 3 | 91 | 5 (132) | 5 (132) | 7 (180) | 9 (228) | 11 (276) | 19 (468) DOES NOT FIT |
| 321 x 640 | one row | 4 | 66.3 | 6 (156) | 8 (204) | 10 (252) | 11 (276) | 16 (396) DOES NOT FIT | 27 (660) DOES NOT FIT |
| 321 x 640 | one row | 5 | 51.4 | 10 (252) | 14 (348) DOES NOT FIT | 17 (420) DOES NOT FIT | 20 (492) DOES NOT FIT | 28 (684) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 321 x 640 | one row | 6 | 41.5 | 11 (276) WIDE | 18 (444) DOES NOT FIT | 22 (540) WIDE DOES NOT FIT | 25 (612) WIDE DOES NOT FIT | 32 (780) WIDE DOES NOT FIT | 65 (1572) WIDE DOES NOT FIT |
| 321 x 640 | two a row | 3 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 4 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 5 | 140.5 | 2 (60) | 3 (84) | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 6 | 140.5 | 2 (60) | 3 (84) | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |

#### ai-act-example, start, en, the buttons in Verdana

Buttons drawn in: Verdana

| viewport | layout | buttons | button width | 12 | 19 | 25 | 30 | 40 | title of 80 |
|---|---|---|---|---|---|---|---|---|---|
| 1280 x 640 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 640 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 640 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 640 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 640 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 1280 x 640 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 640 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1366 x 768 | one row | 3 | 435.3 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1366 x 768 | one row | 4 | 321.5 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1366 x 768 | one row | 5 | 253.2 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1366 x 768 | one row | 6 | 207.7 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 6 (156) DOES NOT FIT |
| 1366 x 768 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1366 x 768 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | one row | 4 | 460 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1920 x 1080 | one row | 6 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1920 x 1080 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1920 x 1080 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1920 x 1080 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | one row | 5 | 492 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 2560 x 1440 | one row | 6 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 2560 x 1440 | two a row | 3 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 4 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 2560 x 1440 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 2560 x 1440 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | one row | 2 | 620 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1280 x 800 | one row | 3 | 406.7 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1280 x 800 | one row | 4 | 300 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1280 x 800 | one row | 5 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 1280 x 800 | one row | 6 | 193.3 | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 7 (180) DOES NOT FIT |
| 1280 x 800 | two a row | 3 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 4 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 5 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1280 x 800 | two a row | 6 | 620 | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 1 (60) DOES NOT FIT | 2 (60) DOES NOT FIT |
| 1024 x 768 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 768 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1024 x 768 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 1024 x 768 | one row | 6 | 145.3 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 1024 x 768 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 768 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 768 x 1024 | one row | 2 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 768 x 1024 | one row | 4 | 164 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 9 (228) |
| 768 x 1024 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 8 (204) | 14 (348) |
| 768 x 1024 | one row | 6 | 102.7 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 20 (492) |
| 768 x 1024 | two a row | 3 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 4 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 5 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 1024 | two a row | 6 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 390 x 844 | one row | 2 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | one row | 3 | 114 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 13 (324) |
| 390 x 844 | one row | 4 | 83.5 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 22 (540) DOES NOT FIT |
| 390 x 844 | one row | 5 | 65.2 | 6 (156) | 8 (204) | 10 (252) | 13 (324) | 18 (444) | 27 (660) DOES NOT FIT |
| 390 x 844 | one row | 6 | 53 | 8 (204) | 11 (276) | 15 (372) | 16 (396) | 22 (540) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 390 x 844 | two a row | 3 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | two a row | 4 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 390 x 844 | two a row | 5 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 390 x 844 | two a row | 6 | 175 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 360 x 640 | one row | 2 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) |
| 360 x 640 | one row | 3 | 104 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) | 16 (396) DOES NOT FIT |
| 360 x 640 | one row | 4 | 76 | 4 (108) | 6 (156) | 8 (204) | 10 (252) | 14 (348) DOES NOT FIT | 24 (588) DOES NOT FIT |
| 360 x 640 | one row | 5 | 59.2 | 6 (156) | 8 (204) | 11 (276) | 14 (348) DOES NOT FIT | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 360 x 640 | one row | 6 | 48 | 12 (300) | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 53 (1284) DOES NOT FIT |
| 360 x 640 | two a row | 3 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 4 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 5 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 640 | two a row | 6 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 320 x 480 | the minimumSize notice: no Answer row | | | | | | | | |
| 1279 x 640 | one row | 2 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | one row | 3 | 406.3 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 1279 x 640 | one row | 4 | 299.8 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1279 x 640 | one row | 5 | 235.8 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1279 x 640 | one row | 6 | 193.2 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1279 x 640 | two a row | 3 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 4 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 5 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1279 x 640 | two a row | 6 | 619.5 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) |
| 1100 x 640 | one row | 2 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | one row | 3 | 336 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1100 x 640 | one row | 4 | 247 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 1100 x 640 | one row | 5 | 193.6 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 1100 x 640 | one row | 6 | 158 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 1100 x 640 | two a row | 3 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 4 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 5 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1100 x 640 | two a row | 6 | 514 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) |
| 1000 x 640 | one row | 2 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | one row | 3 | 302.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1000 x 640 | one row | 4 | 222 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1000 x 640 | one row | 5 | 173.6 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 5 (132) | 8 (204) |
| 1000 x 640 | one row | 6 | 141.3 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) DOES NOT FIT |
| 1000 x 640 | two a row | 3 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | two a row | 4 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1000 x 640 | two a row | 5 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1000 x 640 | two a row | 6 | 464 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | one row | 2 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | one row | 3 | 269.3 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 900 x 640 | one row | 4 | 197 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 900 x 640 | one row | 5 | 153.6 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 10 (252) DOES NOT FIT |
| 900 x 640 | one row | 6 | 124.7 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) | 15 (372) DOES NOT FIT |
| 900 x 640 | two a row | 3 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | two a row | 4 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 900 x 640 | two a row | 5 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 900 x 640 | two a row | 6 | 414 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | one row | 2 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 800 x 640 | one row | 3 | 236 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 800 x 640 | one row | 4 | 172 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) | 8 (204) |
| 800 x 640 | one row | 5 | 133.6 | 2 (60) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 12 (300) DOES NOT FIT |
| 800 x 640 | one row | 6 | 108 | 3 (84) | 5 (132) | 7 (180) | 8 (204) | 10 (252) DOES NOT FIT | 19 (468) DOES NOT FIT |
| 800 x 640 | two a row | 3 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 800 x 640 | two a row | 4 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) |
| 800 x 640 | two a row | 5 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 800 x 640 | two a row | 6 | 364 | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 700 x 800 | one row | 2 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | one row | 3 | 202.7 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 700 x 800 | one row | 4 | 147 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 700 x 800 | one row | 5 | 113.6 | 3 (84) | 5 (132) | 7 (180) | 7 (180) | 10 (252) | 16 (396) |
| 700 x 800 | one row | 6 | 91.3 | 4 (108) | 6 (156) | 8 (204) | 10 (252) | 14 (348) | 24 (588) DOES NOT FIT |
| 700 x 800 | two a row | 3 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 4 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 5 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 700 x 800 | two a row | 6 | 314 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 600 x 800 | one row | 2 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | one row | 3 | 169.3 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 6 (156) | 9 (228) |
| 600 x 800 | one row | 4 | 122 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) | 15 (372) |
| 600 x 800 | one row | 5 | 93.6 | 4 (108) | 6 (156) | 8 (204) | 9 (228) | 13 (324) | 24 (588) DOES NOT FIT |
| 600 x 800 | one row | 6 | 74.7 | 6 (156) | 9 (228) | 12 (300) | 14 (348) | 18 (444) | 34 (828) DOES NOT FIT |
| 600 x 800 | two a row | 3 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 4 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 5 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 600 x 800 | two a row | 6 | 264 | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 3 (84) | 5 (132) |
| 520 x 800 | one row | 2 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | one row | 3 | 142.7 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) |
| 520 x 800 | one row | 4 | 102 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 20 (492) DOES NOT FIT |
| 520 x 800 | one row | 5 | 77.6 | 6 (156) | 8 (204) | 11 (276) | 13 (324) | 18 (444) DOES NOT FIT | 32 (780) DOES NOT FIT |
| 520 x 800 | one row | 6 | 61.3 | 12 (300) | 17 (420) | 22 (540) DOES NOT FIT | 25 (612) DOES NOT FIT | 32 (780) DOES NOT FIT | 59 (1428) DOES NOT FIT |
| 520 x 800 | two a row | 3 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | two a row | 4 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 520 x 800 | two a row | 5 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 520 x 800 | two a row | 6 | 224 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) DOES NOT FIT |
| 480 x 800 | one row | 2 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | one row | 3 | 129.3 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 7 (180) | 13 (324) |
| 480 x 800 | one row | 4 | 92 | 4 (108) | 6 (156) | 8 (204) | 10 (252) | 14 (348) | 24 (588) DOES NOT FIT |
| 480 x 800 | one row | 5 | 69.6 | 8 (204) | 11 (276) | 13 (324) | 15 (372) | 22 (540) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 480 x 800 | one row | 6 | 54.7 | 12 (300) WIDE | 18 (444) WIDE DOES NOT FIT | 24 (588) WIDE DOES NOT FIT | 27 (660) WIDE DOES NOT FIT | 35 (852) WIDE DOES NOT FIT | 67 (1620) WIDE DOES NOT FIT |
| 480 x 800 | two a row | 3 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | two a row | 4 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) |
| 480 x 800 | two a row | 5 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 480 x 800 | two a row | 6 | 204 | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 7 (180) DOES NOT FIT |
| 479 x 800 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) |
| 479 x 800 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) | 15 (372) |
| 479 x 800 | one row | 5 | 83 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 11 (276) | 22 (540) DOES NOT FIT |
| 479 x 800 | one row | 6 | 67.8 | 5 (132) | 7 (180) | 9 (228) | 10 (252) | 15 (372) | 26 (636) DOES NOT FIT |
| 479 x 800 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 800 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 2 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) |
| 479 x 481 | one row | 3 | 143.7 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 479 x 481 | one row | 4 | 105.8 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) DOES NOT FIT | 15 (372) DOES NOT FIT |
| 479 x 481 | one row | 5 | 83 | 4 (108) | 5 (132) | 7 (180) | 8 (204) | 11 (276) DOES NOT FIT | 22 (540) DOES NOT FIT |
| 479 x 481 | one row | 6 | 67.8 | 5 (132) | 7 (180) | 9 (228) DOES NOT FIT | 10 (252) DOES NOT FIT | 15 (372) DOES NOT FIT | 26 (636) DOES NOT FIT |
| 479 x 481 | two a row | 3 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 4 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 3 (84) | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 5 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 479 x 481 | two a row | 6 | 219.5 | 1 (60) | 2 (60) | 2 (60) | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 5 (132) DOES NOT FIT |
| 768 x 481 | one row | 2 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 768 x 481 | one row | 3 | 225.3 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 768 x 481 | one row | 4 | 164 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 9 (228) DOES NOT FIT |
| 768 x 481 | one row | 5 | 127.2 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 8 (204) DOES NOT FIT | 14 (348) DOES NOT FIT |
| 768 x 481 | one row | 6 | 102.7 | 4 (108) | 5 (132) | 7 (180) | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 20 (492) DOES NOT FIT |
| 768 x 481 | two a row | 3 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 4 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 5 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 768 x 481 | two a row | 6 | 348 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) DOES NOT FIT |
| 1024 x 481 | one row | 2 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | one row | 3 | 310.7 | 1 (60) | 1 (60) | 2 (60) | 2 (60) | 2 (60) | 4 (108) |
| 1024 x 481 | one row | 4 | 228 | 1 (60) | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 6 (156) |
| 1024 x 481 | one row | 5 | 178.4 | 2 (60) | 2 (60) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 1024 x 481 | one row | 6 | 145.3 | 2 (60) | 4 (108) | 4 (108) | 5 (132) | 7 (180) | 11 (276) DOES NOT FIT |
| 1024 x 481 | two a row | 3 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | two a row | 4 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) |
| 1024 x 481 | two a row | 5 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 1024 x 481 | two a row | 6 | 476 | 1 (60) | 1 (60) | 1 (60) | 1 (60) | 2 (60) | 3 (84) DOES NOT FIT |
| 360 x 481 | one row | 2 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) | 4 (108) | 8 (204) DOES NOT FIT |
| 360 x 481 | one row | 3 | 104 | 3 (84) | 4 (108) | 5 (132) | 5 (132) | 9 (228) DOES NOT FIT | 16 (396) DOES NOT FIT |
| 360 x 481 | one row | 4 | 76 | 4 (108) | 6 (156) | 8 (204) DOES NOT FIT | 10 (252) DOES NOT FIT | 14 (348) DOES NOT FIT | 24 (588) DOES NOT FIT |
| 360 x 481 | one row | 5 | 59.2 | 6 (156) | 8 (204) DOES NOT FIT | 11 (276) DOES NOT FIT | 14 (348) DOES NOT FIT | 18 (444) DOES NOT FIT | 34 (828) DOES NOT FIT |
| 360 x 481 | one row | 6 | 48 | 12 (300) DOES NOT FIT | 16 (396) DOES NOT FIT | 19 (468) DOES NOT FIT | 24 (588) DOES NOT FIT | 32 (780) DOES NOT FIT | 53 (1284) DOES NOT FIT |
| 360 x 481 | two a row | 3 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 4 | 160 | 2 (60) | 3 (84) | 3 (84) | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 5 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 360 x 481 | two a row | 6 | 160 | 2 (60) DOES NOT FIT | 3 (84) DOES NOT FIT | 3 (84) DOES NOT FIT | 4 (108) DOES NOT FIT | 4 (108) DOES NOT FIT | 8 (204) DOES NOT FIT |
| 321 x 640 | one row | 2 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) |
| 321 x 640 | one row | 3 | 91 | 3 (84) | 5 (132) | 7 (180) | 8 (204) | 10 (252) | 19 (468) DOES NOT FIT |
| 321 x 640 | one row | 4 | 66.3 | 6 (156) | 8 (204) | 9 (228) | 10 (252) | 16 (396) DOES NOT FIT | 27 (660) DOES NOT FIT |
| 321 x 640 | one row | 5 | 51.4 | 10 (252) | 14 (348) DOES NOT FIT | 17 (420) DOES NOT FIT | 20 (492) DOES NOT FIT | 28 (684) DOES NOT FIT | 39 (948) DOES NOT FIT |
| 321 x 640 | one row | 6 | 41.5 | 11 (276) WIDE | 18 (444) DOES NOT FIT | 22 (540) WIDE DOES NOT FIT | 25 (612) WIDE DOES NOT FIT | 32 (780) WIDE DOES NOT FIT | 65 (1572) WIDE DOES NOT FIT |
| 321 x 640 | two a row | 3 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 4 | 140.5 | 2 (60) | 3 (84) | 4 (108) | 5 (132) | 6 (156) | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 5 | 140.5 | 2 (60) | 3 (84) | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |
| 321 x 640 | two a row | 6 | 140.5 | 2 (60) | 3 (84) | 4 (108) DOES NOT FIT | 5 (132) DOES NOT FIT | 6 (156) DOES NOT FIT | 10 (252) DOES NOT FIT |

#### full-node, en, the buttons in Verdana: the lowest window that holds the buttons

| width | 2, 19 | 3, 19 | 4, 19 | 2, 25 | 3, 25 | 4, 25 |
|---|---|---|---|---|---|---|
| 321 | 481 (3) | 536 (3) | 536 (3) | 481 (4) | 584 (4) | 584 (4) |
| 360 | 481 (3) | 536 (3) | 536 (3) | 481 (3) | 536 (3) | 536 (3) |
| 390 | 481 (2) | 481 (2) | 481 (2) | 481 (3) | 517 (3) | 517 (3) |
| 420 | 481 (2) | 481 (2) | 481 (2) | 481 (3) | 493 (3) | 493 (3) |
| 479 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 480 | 481 (2) | 481 (2) | 481 (2) | 481 (3) | 536 (3) | 536 (3) |
| 520 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 600 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 700 | 481 (1) | 481 (1) | 481 (1) | 481 (2) | 481 (2) | 481 (2) |
| 767 | 481 (1) | 481 (1) | 481 (1) | 481 (2) | 481 (2) | 481 (2) |
| 768 | 481 (1) | 481 (1) | 481 (1) | 481 (2) | 481 (2) | 481 (2) |
| 800 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 900 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 1000 | 481 (1) | 481 (1) | 481 (2) | 481 (1) | 481 (2) | 481 (2) |
| 1100 | 481 (1) | 481 (1) | 481 (2) | 481 (1) | 481 (2) | 481 (2) |
| 1279 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (2) |

#### full-node, nl, the buttons in Verdana: the lowest window that holds the buttons

| width | 2, 19 | 3, 19 | 4, 19 | 2, 25 | 3, 25 | 4, 25 |
|---|---|---|---|---|---|---|
| 321 | 481 (3) | 536 (3) | 536 (3) | 481 (4) | 584 (4) | 584 (4) |
| 360 | 481 (3) | 536 (3) | 536 (3) | 481 (3) | 536 (3) | 536 (3) |
| 390 | 481 (2) | 481 (2) | 481 (2) | 481 (3) | 517 (3) | 517 (3) |
| 420 | 481 (2) | 481 (2) | 481 (2) | 481 (3) | 517 (3) | 517 (3) |
| 479 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 480 | 481 (2) | 481 (2) | 481 (2) | 481 (3) | 536 (3) | 536 (3) |
| 520 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 600 | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) | 481 (2) |
| 700 | 481 (1) | 481 (1) | 481 (1) | 481 (2) | 481 (2) | 481 (2) |
| 767 | 481 (1) | 481 (1) | 481 (1) | 481 (2) | 481 (2) | 481 (2) |
| 768 | 481 (1) | 481 (1) | 481 (1) | 481 (2) | 481 (2) | 481 (2) |
| 800 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 900 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) |
| 1000 | 481 (1) | 481 (1) | 481 (2) | 481 (1) | 481 (2) | 481 (2) |
| 1100 | 481 (1) | 481 (1) | 481 (2) | 481 (1) | 481 (2) | 481 (2) |
| 1279 | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (1) | 481 (2) |
