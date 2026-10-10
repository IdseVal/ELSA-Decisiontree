# Issue #231: the room for five next steps, on the public page and in the editor

- Issue: #231 -- Architecture: the round of #230 (core document open item 10.44)
- Asked by: #231's TASK item 1 ("What gives way so that a step of five next steps, with the longest
  words the format allows (19 characters), keeps the no-scroll rule at 1280 x 640 and below it, down
  to the floor ..., on the public page, in the preview and in the editor (with its bar, its floating
  controls and its move arrows) ... Measure on the production build, in the faces #221 measured")
- Measured: 2026-10-10, on the production build (`npm run build`) of `dev` at `1b3a076`, served by
  `node .next/standalone/server.js` from a scratch data directory made by `node
  tests/browser/data-dir.ts <dir> tests/fixtures/full-node tests/fixtures/three-next-steps`, with
  `tests/store/admin.ts`'s administrator
- Follows: `docs/research/issue-220-answer-row-room.md` (its redrawn row),
  `docs/research/issue-221-answer-row-faces.md` (its faces) and
  `docs/research/issue-222-editor-notice-height.md` (the editor's page, its walk)

This is a record, not a contract: #232 and #233 build the row and the notices, and measure them
again on their builds, as #221 and #222 did.

## 1. What was measured

- **Pages**: the full Node of `application.md` 10.6 (`tests/fixtures/full-node/` at its 49-entry
  Trail: every maximum the format allows at once) in English and in Dutch,
  - on **the public page** (`/full-node/<trail>/full`), which the preview of a hidden Tree draws
    with the same components and no slot (`application.md` 40.2);
  - in **the editor** (`/admin/trees/full-node/<trail>/full`, logged in as the administrator), with
    its bar and the controls that float under it;
  - in **the editor, four and +**: the same page with the fifth button standing for the editor's
    `+`: its move arrows taken off and its words a lone `+`.
- **The row, redrawn** by the script (section 5), as #220's script redrew it: the full Node's four
  next steps replaced by **five copies** of its second button -- in the editor the one that carries
  both move arrows, its field between them -- every one labelled with one 19-character label,
  standing as #231 decides (`application.md` 42.3): **one row from 1000 pixels wide**, each an equal
  share of it, at most 620; **below 1000, three and then two**, each a third of the row less its
  gaps, the two of the second row as wide as each above and centred. Nothing else on the page was
  changed.
- **The labels**: #220's four of 19 characters ("Mandatory safeguard", "Niet van toepassing",
  "ONLY AS AN IMPORTER", "Ethisch aanvaardbaa") and #221's one word of 19 ("Notwithstandingness").
  A window fits when it fits with every one of them; a cell's lines are the worst label's.
- **What fits**: the page walked as `tests/browser/admin-no-scroll.spec.ts` walks it, with its
  exemptions, overflows nothing, and no label is wider than its button; the notices of 41.4 and 41.7
  item 8 taken off (their classes `minimum-size--steps` and `minimum-size--editor-steps` removed) so
  the row is measured where a notice would stand in for it. Between about 480 and 640 pixels wide
  dev's disclaimer takes two lines and overflows its band, a known defect that is not the row's: its
  band is not counted, and the page may be taller than the window by what the disclaimer overflows
  its band by, as #222's script counted it.
- **At the viewports**: the ten of 10.6 but the floor, and 1000 x 640 and 999 x 640, the two sides of
  the width where the row changes.
- **The heights at which a width does not fit.** The stylesheet (`src/app/[lang]/globals.css`)
  changes the page as a window grows taller, at 484, 488, 506, 550, 564, 632, 640 and 744 pixels
  (the type steps up, the Sources and the main image come back), and as it grows wider, at 360, 480,
  520, 600, 640, 764, 768, 770, 792, 1000, 1200 and 1280, the last interval running to every width
  above the guarantee. Between two such heights, and between two
  such widths, the page draws one layout, which a taller or a wider window only gives more room. So
  the script tries, at the narrowest width of each interval of widths (and at 390 too, a width of
  10.6), the lowest height of each interval of heights from 481 to 1440; where that height does not
  fit, it tries the interval's highest, and between them it finds the lowest height that fits by
  halving. A cell lists the heights that do not fit and **what the width needs**: the lowest height
  from which every height up to 1440 fits. A window taller than one that fits need not fit: the
  public page at 321 wide with the row in Verdana fits from 632 to 639 and not from 640 to 647, where
  the main image comes back.
- **Faces**, each proved by Chromium's own report of the font it drew a label in
  (`CSS.getPlatformFontsForNode`), printed under each table:
  - **Windows 11**, Node 22.18.0, Chromium of Playwright 1.62.1: the default stack, drawn in
    **Segoe UI**; and the row set to **Verdana**, #220's stand-in for DejaVu Sans.
  - **Linux**, Ubuntu 24.04.2 LTS in WSL 2 -- the release of the CI runner -- with `fonts-liberation`
    and `fonts-dejavu-core` and the Chromium headless shell of Playwright 1.62.1, the server run in
    the same Linux from the same build: the default stack, drawn in **Liberation Sans**; and the row
    set to **DejaVu Sans**.
- **Earlier runs, not recorded**: three that searched, at part 2's sixteen widths of #220's record,
  for the lowest window by halving from 481 up -- which takes a window that fits to prove every taller
  one, and the steps above show it does not. They gave the same needs at the widths both measured,
  but did not measure 640, so they put the public page's first width at 700. A fourth and a fifth,
  the run below without 390 and without 1280, gave the same cells. A Segoe UI run of the script below gave the same cells as the one
  recorded, with one face report empty; it was run again.

## 2. What it shows

1. **At the guarantee, 1280 x 640, one row of five holds every label on two lines**, buttons of 236
   pixels, 60 tall, on the public page and in the editor, in every face: the row stays the 68 of
   `application.md` 10.1 and 41.3.
2. **One row of five from 1000 pixels wide** fits every window from 481 tall up at 1000, 1200 and 1280, in
   every face, on both pages. At 1000 x 640 a label takes two lines on the public page in Segoe UI and
   Liberation Sans and three in Verdana and DejaVu Sans, and three or four in the editor between its
   arrows. 41.3's 1000 holds for five.
3. **The public page, three and then two below 1000**: from **640** wide up every face fits every
   window from 481 tall. At 600 Verdana and DejaVu Sans need **515**; from 360 to 599 the highest need
   is **584** (360 and 480 in every face, 520 in Verdana and DejaVu Sans); at 321, **648** in Verdana
   and DejaVu Sans and 584 in Segoe UI and Liberation Sans. At **360 x 640** and **390 x 844**, two of
   10.6's viewports, five fit in every face, a label on four lines in a button of 104 and 114.
4. **The editor, three and then two below 1000**: the words stand between the move arrows (the
   label's padding of 32 each side, #222), so a third of the row leaves them little room. From **764**
   wide up every face fits every window from 481 tall; at 640 Verdana and DejaVu Sans need **522**, at
   600 **563**; from 390 to 639 the highest need is **685** (480 wide, Verdana and DejaVu Sans; 677 at
   390 in every face); below 390, **792** at 360 (Verdana and DejaVu Sans; 744 in Segoe UI and
   Liberation Sans) and **1080** at 321 (Verdana; DejaVu Sans 1032, Liberation Sans 936, Segoe UI
   888). At **360 x 640** it does not fit in any face, a label on seven lines (Segoe UI, Liberation
   Sans) or eight (Verdana, DejaVu Sans) in a button of 104; at **390 x 844** it fits in every face.
5. **"Four and +" needs what five need**, cell for cell, in every face and both languages: the
   tallest button of the row sets its height, and the four next steps carry their arrows at the
   same width.
6. **English and Dutch** need the same at every width, in every face.
7. **Liberation Sans needs what Segoe UI needs** but at 321 wide in the editor (936 against 888),
   **and DejaVu Sans what Verdana needs** but at 321 in the editor (1032 against 1080).

## 3. The numbers, by #231's rules (`application.md` 42.4)

The rule is 41.4's, with a second box below the narrowest of 10.6's viewports that fits, so that a
need at the narrowest widths does not take that viewport from the reader. A width's need, below, is
section 1's: the lowest height from which every height up to 1440 fits; an interval of widths needs
what its narrowest width needs.

- **W1**, the width: the narrowest width from which the page fits every window from 481 tall up, in
  every face and both languages, rounded up to the next ten.
- **W2**: the width of the narrowest viewport of 10.6 narrower than W1 at which the page fits in every
  face.
- **H1**: the highest need at the widths from W2 up to below W1, rounded up to the next ten, never
  below the notice of the same page for three or four (41.4's 560, 41.7 item 8's 590).
- **H2**: the highest need below W2, rounded up to the next ten.
- The notice stands **below W1 wide and H1 tall, and below W2 wide and H2 tall**.

| | W1 | W2 | H1 | H2 |
|---|---|---|---|---|
| **The public page and the preview**, a step of five | 600 to 639 needs 515 (Verdana, DejaVu Sans); from 640 every window fits: **640** | 360 x 640 fits (584): **360** | from 360 to 639 the highest is 584: **590** | 321 to 359 needs 648: **650** |
| **The editor**, a row of five buttons (five next steps, or four and `+`) | 640 to 763 needs 522 (Verdana, DejaVu Sans); from 764 every window fits: 764, **770** | 360 x 640 does not fit (792); 390 x 844 does (677): **390** | from 390 to 769 the highest is 685 (480, Verdana and DejaVu Sans): **690** | 321 to 389 needs up to 1080 (321, Verdana): **1080** |

So a step of five next steps shows the notice on the public page and in the preview **below 640 x
590 and below 360 x 650**, and the editor's row of five buttons **below 770 x 690 and below 390 x
1080**. Every viewport of 10.6 keeps the tree view on the public page; in the editor 360 x 640 shows
the notice for a row of five, and 390 x 844 keeps the tree view.

## 4. Where each button stands, and where its slide goes

Not measured: what follows from the arrangement of section 1 and #231's rule (`application.md`
42.5), for #232's and #234's tests. A button's place across is its place in its own row, counted in
buttons from the row's middle, *c* - (*m* - 1) / 2 for the *c*-th (from 0) of *m*; it is where its
target is placed, in layer widths, one layer height down.

| Buttons in the row | From 1000 pixels wide | Below 1000 pixels wide |
|---|---|---|
| 1 | 0 | 0 |
| 2 | -0.5, 0.5 | -0.5, 0.5 |
| 3 | -1, 0, 1 | -0.5, 0.5 / 0 |
| 4 | -1.5, -0.5, 0.5, 1.5 | -0.5, 0.5 / -0.5, 0.5 |
| 5 | -2, -1, 0, 1, 2 | -1, 0, 1 / -0.5, 0.5 |

Every button left of the row's middle slides down and to the left, every button right of it down
and to the right, a button in the middle straight down, at every width: what `dev` does from 1000
up, and below 1000 for the 4 of 7 buttons of three and four that
`docs/research/issue-230-slide-direction.md` found going the other way or straight down.

## 5. The script

Run as `node measure-231.mjs http://127.0.0.1:<port>` and `node measure-231.mjs
http://127.0.0.1:<port> Verdana` on Windows from the worktree, and with `'DejaVu Sans'` in Linux from
a folder holding `playwright-core` 1.62.1, each against the server of the header in the same system.
Its code is as it ran.

```js
// Issue #231: the room for five next steps, on the production build of dev. A scratch script of
// the architecture run, copied whole into docs/research/issue-231-five-next-steps.md and deleted.
// Usage, from a folder whose node_modules holds playwright-core (REPO names it):
//   node measure-231.mjs <origin> [<face>]
// <origin> serves full-node, published, with the administrator of tests/store/admin.ts; <face>,
// when given, is set as the font-family of the Answer row's buttons and their fields, as #221's and
// #222's scripts set it (Verdana on Windows, DejaVu Sans in Linux). The full Node's row of four is
// redrawn with five copies of one of its buttons, every one labelled with one 19-character label,
// standing as #231 decides: one row from 1000 pixels wide, each an equal share, at most 620; below
// 1000 three and then two, each a third of the row less its gaps, the two centred.
// At each width it tries every interval of heights the stylesheet draws differently, from just above
// the floor to 1440.
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.join(process.env.REPO ?? process.cwd(), 'package.json'))
const { chromium } = require('playwright-core')

const [origin, face] = process.argv.slice(2)

/**
 * The narrowest width of each interval between the stylesheet's width breakpoints
 * (src/app/[lang]/globals.css), from just above the floor to the guarantee and above it: within an interval the
 * page draws one layout, which a wider window only gives more room, so its narrowest width is its
 * worst.
 */
const WIDTH_STEPS = [321, 360, 390, 480, 520, 600, 640, 764, 768, 770, 792, 1000, 1200, 1280]
/** The lowest height of each interval between the stylesheet's height breakpoints, from just above the floor. */
const HEIGHT_STEPS = [481, 484, 488, 506, 550, 564, 632, 640, 744]
/** The tallest window tried: 2560 x 1440's, the tallest of 10.6. */
const TOP = 1440
/** The ten viewports of application.md 10.6 but the floor, and the two sides of 1000. */
const VIEWPORTS = [[1280, 640], [1366, 768], [1920, 1080], [2560, 1440], [1280, 800], [1024, 768], [768, 1024], [390, 844], [360, 640], [1000, 640], [999, 640]]
/** #220's 19-character labels and #221's one word of 19. */
const LABELS = ['Mandatory safeguard', 'Niet van toepassing', 'ONLY AS AN IMPORTER', 'Ethisch aanvaardbaa', 'Notwithstandingness']
for (const label of LABELS) if (label.length !== 19) throw new Error(`${label} is not 19`)
const TRAIL = Array.from({ length: 49 }, () => 'full').join('/')
const PAGES = [
  ['the public page', `/full-node/${TRAIL}/full`],
  ['the editor', `/admin/trees/full-node/${TRAIL}/full`],
  ['the editor, four and +', `/admin/trees/full-node/${TRAIL}/full`],
]

/**
 * Redraws the centre's row with five copies of a next step's button labelled `label` (in the
 * editor the second, which carries both move arrows), standing as #231 decides at this width, the
 * notice of 41.4 and 41.7 item 8 taken off; then walks the page as admin-no-scroll.spec.ts walks it,
 * with its exemptions, the disclaimer's band not counted (its two lines between about 480 and 640
 * wide are dev's known defect, docs/research/issue-222-editor-notice-height.md section 1). Returns
 * what overflows, the most lines a label takes, whether a label is wider than its button, the
 * tallest button, a button's width, and the face a label is drawn in.
 */
async function measure(page, label, plus) {
  return page.evaluate(({ face, label, plus }) => {
    document.querySelector('.minimum-size')?.classList.remove('minimum-size--steps', 'minimum-size--editor-steps')
    if (face && !document.getElementById('face-231')) {
      const style = document.createElement('style')
      style.id = 'face-231'
      style.textContent = `.answers :is(.answer, .structure, .sheet-open, textarea) { font-family: ${face} !important; }`
      document.head.append(style)
    }
    const row = document.querySelector('.tree-frame:not([aria-hidden]) .answers')
    if (!row.dataset.original) row.dataset.original = row.innerHTML
    row.innerHTML = row.dataset.original
    const buttons = [...row.querySelectorAll(':scope > .answer--next')]
    const template = buttons[1]
    row.innerHTML = ''
    const across = innerWidth >= 1000 ? 5 : 3
    row.style.flexWrap = 'wrap'
    for (let i = 0; i < 5; i++) {
      const button = template.cloneNode(true)
      const field = button.querySelector('textarea')
      if (field) {
        field.value = label
        field.textContent = label
        button.querySelector('.editor-text').dataset.value = label
      } else button.querySelector('.branch-title').textContent = label
      // "four and +": the fifth stands for the editor's `+`, one character and no move arrows.
      if (plus && i === 4) {
        for (const move of button.querySelectorAll('.answer-move')) move.remove()
        button.querySelector('.branch-title').textContent = '+'
      }
      button.style.flex = `0 0 calc((100% - ${across - 1} * var(--answers-gap)) / ${across})`
      button.style.maxWidth = '620px'
      button.style.minWidth = '0'
      row.append(button)
    }
    const overflowing = []
    const d = document.documentElement
    const b = document.body
    const footer = document.querySelector('footer.disclaimer')
    const slack = footer ? Math.max(0, footer.scrollHeight - footer.clientHeight) : 0
    if (Math.max(d.scrollHeight, b.scrollHeight) > innerHeight + 1 + slack || Math.max(d.scrollWidth, b.scrollWidth) > innerWidth + 1) overflowing.push('document')
    for (const el of document.querySelectorAll('*')) {
      if (el === d || el === b) continue
      if (el.matches('[data-scroll-box], [data-clamp], [data-carousel-strip], footer.disclaimer')) continue
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) overflowing.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`)
    }
    let lines = 0
    let wide = false
    let tallest = 0
    for (const button of row.children) {
      const text = button.querySelector('.editor-text') ?? button.querySelector('.branch-label')
      if (button.querySelector('.editor-text')) {
        lines = Math.max(lines, Math.round(text.getBoundingClientRect().height / parseFloat(getComputedStyle(text).lineHeight)))
      } else {
        const range = document.createRange()
        range.selectNodeContents(text)
        lines = Math.max(lines, new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size)
      }
      if (text.scrollWidth > text.clientWidth + 1 || button.scrollWidth > button.clientWidth + 1) wide = true
      tallest = Math.max(tallest, button.getBoundingClientRect().height)
    }
    const first = row.firstElementChild
    return {
      overflowing,
      lines,
      wide,
      tallest: Math.round(tallest),
      width: Math.round(first.getBoundingClientRect().width * 10) / 10,
      family: getComputedStyle(first.querySelector('textarea') ?? first).fontFamily,
    }
  }, { face: face ?? null, label, plus })
}

/** Whether every label fits at the page's present size; the worst label's lines and button. */
async function fitsAll(page, plus) {
  let worst = { lines: 0, tallest: 0, overflowing: [], fits: true }
  for (const label of LABELS) {
    const m = await measure(page, label, plus)
    const fits = m.overflowing.length === 0 && !m.wide
    if (!fits) worst.fits = false
    if (m.lines > worst.lines || (m.lines === worst.lines && m.tallest > worst.tallest)) worst = { ...m, fits: worst.fits, label }
    if (!fits) worst.overflowing = [...new Set([...worst.overflowing, ...m.overflowing, ...(m.wide ? ['a label wider than its button'] : [])])]
  }
  return worst
}

async function resized(page, width, height) {
  await page.setViewportSize({ width, height })
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
}

/** The face Chromium drew a label in, by its own report (CDP CSS.getPlatformFontsForNode). */
async function drawnIn(page) {
  await page.evaluate(() => {
    const field = document.querySelector('.tree-frame:not([aria-hidden]) .answers > .answer textarea')
    if (field && !document.getElementById('probe-231')) {
      const probe = document.createElement('span')
      probe.id = 'probe-231'
      probe.style.font = 'inherit'
      probe.textContent = field.value
      field.parentElement.append(probe)
    }
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 })
  let { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#probe-231' })
  if (!nodeId) ({ nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.tree-frame:not([aria-hidden]) .answers > .answer .branch-title' }))
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
  await cdp.detach()
  return fonts.map((f) => `${f.familyName} (${f.glyphCount} glyphs)`).join(', ')
}

const browser = await chromium.launch()
try {
  const context = await browser.newContext()
  const login = await context.request.post(`${origin}/admin/api/login`, {
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    data: { email: 'admin@example.org', password: 'test administrator password' },
  })
  const token = /^elsa-admin-session=([^;]+)/.exec(login.headers()['set-cookie'] ?? '')?.[1]
  if (!token) throw new Error(`login: ${login.status()}`)
  await context.addCookies([{ name: 'elsa-admin-session', value: token, domain: new URL(origin).hostname, path: '/admin', httpOnly: true, secure: true, sameSite: 'Strict' }])
  for (const [name, url] of PAGES) {
    for (const lang of ['en', 'nl']) {
      const query = lang === 'nl' ? '?lang=nl' : ''
      const page = await context.newPage()

      console.log(`\n### Five next steps, ${name}, ${lang}${face ? `, the row in ${face}` : ''}: at the viewports\n`)
      console.log('| viewport | arrangement | button width | most lines (tallest button) | fits |')
      console.log('|---|---|---|---|---|')
      for (const [width, height] of VIEWPORTS) {
        await page.setViewportSize({ width, height })
        await page.goto(origin + url + query, { waitUntil: 'load' })
        await page.evaluate(() => document.fonts.ready)
        const w = await fitsAll(page, name.endsWith('+'))
        console.log(`| ${width} x ${height} | ${width >= 1000 ? 'one row of 5' : '3, then 2'} | ${w.width} | ${w.lines} (${w.tallest}) | ${w.fits ? 'yes' : `NO: ${w.overflowing.join(', ')}`} |`)
      }

      console.log(`\n### Five next steps, ${name}, ${lang}${face ? `, the row in ${face}` : ''}: the heights at which the page does not fit\n`)
      console.log('| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |')
      console.log('|---|---|---|---|---|---|')
      let family = ''
      for (const width of WIDTH_STEPS) {
        await page.setViewportSize({ width, height: TOP })
        await page.goto(origin + url + query, { waitUntil: 'load' })
        await page.evaluate(() => document.fonts.ready)
        let last = null
        const fits = async (height) => {
          await resized(page, width, height)
          last = await fitsAll(page, name.endsWith('+'))
          return last.fits
        }
        // Each interval of heights between two of the stylesheet's steps draws one layout, which a
        // taller window only gives more room: its lowest height fitting proves the interval. Where it
        // does not, its highest is tried, and between them the lowest that fits is found by halving.
        const failing = []
        for (let k = 0; k < HEIGHT_STEPS.length; k++) {
          const low = HEIGHT_STEPS[k]
          const high = (HEIGHT_STEPS[k + 1] ?? TOP + 1) - 1
          if (await fits(low)) continue
          if (!(await fits(high))) {
            failing.push([low, high])
            continue
          }
          let bad = low
          let good = high
          while (good - bad > 1) {
            const mid = Math.floor((bad + good) / 2)
            if (await fits(mid)) good = mid
            else bad = mid
          }
          failing.push([low, bad])
        }
        const needs = failing.length ? failing[failing.length - 1][1] + 1 : HEIGHT_STEPS[0]
        await fits(Math.min(needs, TOP))
        const at = failing.map(([a, b]) => (a === b ? `${a}` : `${a} to ${b}`)).join(', ') || '--'
        family = await drawnIn(page)
        console.log(`| ${width} | ${width >= 1000 ? 'one row of 5' : '3, then 2'} | ${last.width} | ${at} | ${needs > TOP ? `over ${TOP}` : needs} | ${last.lines} (${last.tallest}) |`)
      }
      console.log(`\nA label drawn in (Chromium's report): ${family}`)
      await page.close()
    }
  }
} finally {
  await browser.close()
}
```

## 6. The output

### 6.1 Windows, the default stack (Segoe UI)

#### Five next steps, the public page, en: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 4 (108) | yes |
| 360 x 640 | 3, then 2 | 104 | 4 (108) | yes |
| 1000 x 640 | one row of 5 | 173.6 | 2 (60) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the public page, en: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 | 565 | 4 (108) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 535 | 536 | 3 (84) |
| 600 | 3, then 2 | 169.3 | -- | 481 | 2 (60) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 2 (60) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Segoe UI (19 glyphs)

#### Five next steps, the public page, nl: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 4 (108) | yes |
| 360 x 640 | 3, then 2 | 104 | 4 (108) | yes |
| 1000 x 640 | one row of 5 | 173.6 | 2 (60) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the public page, nl: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 | 565 | 4 (108) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 535 | 536 | 3 (84) |
| 600 | 3, then 2 | 169.3 | -- | 481 | 2 (60) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 2 (60) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Segoe UI (19 glyphs)

#### Five next steps, the editor, en: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 7 (180) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the editor, en: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 887 | 888 | 10 (252) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743 | 744 | 7 (180) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Segoe UI (19 glyphs)

#### Five next steps, the editor, nl: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 7 (180) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the editor, nl: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 887 | 888 | 10 (252) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743 | 744 | 7 (180) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Segoe UI (19 glyphs)

#### Five next steps, the editor, four and +, en: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 7 (180) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the editor, four and +, en: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 887 | 888 | 10 (252) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743 | 744 | 7 (180) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Segoe UI (19 glyphs)

#### Five next steps, the editor, four and +, nl: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 7 (180) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the editor, four and +, nl: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 887 | 888 | 10 (252) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743 | 744 | 7 (180) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Segoe UI (19 glyphs)

### 6.2 Windows, the row in Verdana

#### Five next steps, the public page, en, the row in Verdana: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 4 (108) | yes |
| 360 x 640 | 3, then 2 | 104 | 4 (108) | yes |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the public page, en, the row in Verdana: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 647 | 648 | 5 (132) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 | 565 | 4 (108) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Verdana (19 glyphs)

#### Five next steps, the public page, nl, the row in Verdana: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 4 (108) | yes |
| 360 x 640 | 3, then 2 | 104 | 4 (108) | yes |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the public page, nl, the row in Verdana: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 647 | 648 | 5 (132) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 | 565 | 4 (108) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Verdana (19 glyphs)

#### Five next steps, the editor, en, the row in Verdana: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 8 (204) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 4 (108) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 2 (60) | yes |

#### Five next steps, the editor, en, the row in Verdana: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 1079 | 1080 | 14 (348) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 791 | 792 | 8 (204) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 684 | 685 | 5 (132) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 562 | 563 | 4 (108) |
| 640 | 3, then 2 | 182.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 521 | 522 | 3 (84) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 4 (108) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Verdana (19 glyphs)

#### Five next steps, the editor, nl, the row in Verdana: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 8 (204) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 4 (108) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 2 (60) | yes |

#### Five next steps, the editor, nl, the row in Verdana: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 1079 | 1080 | 14 (348) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 791 | 792 | 8 (204) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 684 | 685 | 5 (132) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 562 | 563 | 4 (108) |
| 640 | 3, then 2 | 182.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 521 | 522 | 3 (84) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 4 (108) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Verdana (19 glyphs)

#### Five next steps, the editor, four and +, en, the row in Verdana: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 8 (204) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 4 (108) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 2 (60) | yes |

#### Five next steps, the editor, four and +, en, the row in Verdana: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 1079 | 1080 | 14 (348) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 791 | 792 | 8 (204) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 684 | 685 | 5 (132) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 562 | 563 | 4 (108) |
| 640 | 3, then 2 | 182.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 521 | 522 | 3 (84) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 4 (108) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Verdana (19 glyphs)

#### Five next steps, the editor, four and +, nl, the row in Verdana: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 8 (204) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 4 (108) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 2 (60) | yes |

#### Five next steps, the editor, four and +, nl, the row in Verdana: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 1079 | 1080 | 14 (348) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 791 | 792 | 8 (204) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 684 | 685 | 5 (132) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 562 | 563 | 4 (108) |
| 640 | 3, then 2 | 182.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 521 | 522 | 3 (84) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 4 (108) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Verdana (19 glyphs)

### 6.3 Linux, the default stack (Liberation Sans)

#### Five next steps, the public page, en: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 4 (108) | yes |
| 360 x 640 | 3, then 2 | 104 | 4 (108) | yes |
| 1000 x 640 | one row of 5 | 173.6 | 2 (60) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the public page, en: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 | 565 | 4 (108) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 535 | 536 | 3 (84) |
| 600 | 3, then 2 | 169.3 | -- | 481 | 2 (60) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 2 (60) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Liberation Sans (19 glyphs)

#### Five next steps, the public page, nl: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 2 (60) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 4 (108) | yes |
| 360 x 640 | 3, then 2 | 104 | 4 (108) | yes |
| 1000 x 640 | one row of 5 | 173.6 | 2 (60) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the public page, nl: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 | 565 | 4 (108) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 535 | 536 | 3 (84) |
| 600 | 3, then 2 | 169.3 | -- | 481 | 2 (60) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 2 (60) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Liberation Sans (19 glyphs)

#### Five next steps, the editor, en: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 7 (180) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the editor, en: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 935 | 936 | 11 (276) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743 | 744 | 7 (180) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Liberation Sans (19 glyphs)

#### Five next steps, the editor, nl: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 7 (180) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the editor, nl: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 935 | 936 | 11 (276) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743 | 744 | 7 (180) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Liberation Sans (19 glyphs)

#### Five next steps, the editor, four and +, en: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 7 (180) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the editor, four and +, en: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 935 | 936 | 11 (276) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743 | 744 | 7 (180) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Liberation Sans (19 glyphs)

#### Five next steps, the editor, four and +, nl: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 7 (180) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the editor, four and +, nl: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 935 | 936 | 11 (276) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743 | 744 | 7 (180) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): Liberation Sans (19 glyphs)

### 6.4 Linux, the row in DejaVu Sans

#### Five next steps, the public page, en, the row in DejaVu Sans: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 4 (108) | yes |
| 360 x 640 | 3, then 2 | 104 | 4 (108) | yes |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the public page, en, the row in DejaVu Sans: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 647 | 648 | 5 (132) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 | 565 | 4 (108) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): DejaVu Sans (19 glyphs)

#### Five next steps, the public page, nl, the row in DejaVu Sans: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 4 (108) | yes |
| 360 x 640 | 3, then 2 | 104 | 4 (108) | yes |
| 1000 x 640 | one row of 5 | 173.6 | 3 (84) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 1 (60) | yes |

#### Five next steps, the public page, nl, the row in DejaVu Sans: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 647 | 648 | 5 (132) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 | 565 | 4 (108) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 514 | 515 | 3 (84) |
| 640 | 3, then 2 | 182.7 | -- | 481 | 2 (60) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 3 (84) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): DejaVu Sans (19 glyphs)

#### Five next steps, the editor, en, the row in DejaVu Sans: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 8 (204) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 4 (108) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 2 (60) | yes |

#### Five next steps, the editor, en, the row in DejaVu Sans: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 1031 | 1032 | 13 (324) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 791 | 792 | 8 (204) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 684 | 685 | 5 (132) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 562 | 563 | 4 (108) |
| 640 | 3, then 2 | 182.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 521 | 522 | 3 (84) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 4 (108) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): DejaVu Sans (19 glyphs)

#### Five next steps, the editor, nl, the row in DejaVu Sans: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 8 (204) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 4 (108) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 2 (60) | yes |

#### Five next steps, the editor, nl, the row in DejaVu Sans: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 1031 | 1032 | 13 (324) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 791 | 792 | 8 (204) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 684 | 685 | 5 (132) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 562 | 563 | 4 (108) |
| 640 | 3, then 2 | 182.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 521 | 522 | 3 (84) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 4 (108) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): DejaVu Sans (19 glyphs)

#### Five next steps, the editor, four and +, en, the row in DejaVu Sans: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 8 (204) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 4 (108) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 2 (60) | yes |

#### Five next steps, the editor, four and +, en, the row in DejaVu Sans: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 1031 | 1032 | 13 (324) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 791 | 792 | 8 (204) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 684 | 685 | 5 (132) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 562 | 563 | 4 (108) |
| 640 | 3, then 2 | 182.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 521 | 522 | 3 (84) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 4 (108) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): DejaVu Sans (19 glyphs)

#### Five next steps, the editor, four and +, nl, the row in DejaVu Sans: at the viewports

| viewport | arrangement | button width | most lines (tallest button) | fits |
|---|---|---|---|---|
| 1280 x 640 | one row of 5 | 236 | 2 (60) | yes |
| 1366 x 768 | one row of 5 | 253.2 | 2 (60) | yes |
| 1920 x 1080 | one row of 5 | 364 | 1 (60) | yes |
| 2560 x 1440 | one row of 5 | 492 | 1 (60) | yes |
| 1280 x 800 | one row of 5 | 236 | 2 (60) | yes |
| 1024 x 768 | one row of 5 | 178.4 | 3 (84) | yes |
| 768 x 1024 | 3, then 2 | 225.3 | 2 (60) | yes |
| 390 x 844 | 3, then 2 | 114 | 6 (156) | yes |
| 360 x 640 | 3, then 2 | 104 | 8 (204) | NO: article.bubble.bubble--question, div.bubble-text |
| 1000 x 640 | one row of 5 | 173.6 | 4 (108) | yes |
| 999 x 640 | 3, then 2 | 302.3 | 2 (60) | yes |

#### Five next steps, the editor, four and +, nl, the row in DejaVu Sans: the heights at which the page does not fit

| width | arrangement | button width | does not fit at | needs (every height from it up to 1440 fits) | most lines there (tallest button) |
|---|---|---|---|---|---|
| 321 | 3, then 2 | 91 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 1031 | 1032 | 13 (324) |
| 360 | 3, then 2 | 104 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 743, 744 to 791 | 792 | 8 (204) |
| 390 | 3, then 2 | 114 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 632 to 639, 640 to 676 | 677 | 6 (156) |
| 480 | 3, then 2 | 129.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 631, 640 to 684 | 685 | 5 (132) |
| 520 | 3, then 2 | 142.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 563, 564 to 583 | 584 | 4 (108) |
| 600 | 3, then 2 | 169.3 | 481 to 483, 484 to 487, 488 to 505, 506 to 549, 550 to 562 | 563 | 4 (108) |
| 640 | 3, then 2 | 182.7 | 481 to 483, 484 to 487, 488 to 505, 506 to 521 | 522 | 3 (84) |
| 764 | 3, then 2 | 224 | -- | 481 | 2 (60) |
| 768 | 3, then 2 | 225.3 | -- | 481 | 2 (60) |
| 770 | 3, then 2 | 226 | -- | 481 | 2 (60) |
| 792 | 3, then 2 | 233.3 | -- | 481 | 2 (60) |
| 1000 | one row of 5 | 173.6 | -- | 481 | 4 (108) |
| 1200 | one row of 5 | 220 | -- | 481 | 2 (60) |
| 1280 | one row of 5 | 236 | -- | 481 | 2 (60) |

A label drawn in (Chromium's report): DejaVu Sans (19 glyphs)
