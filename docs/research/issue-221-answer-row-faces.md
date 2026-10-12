# Issue #221: the Answer row of three and four next steps in the CI runner's faces and in Windows

- Issue: #221 -- the creator's number of next steps in the Tree format, its migration, and the
  public page's Answer row
- Asked by: `docs/specs/application.md` 41.4 ("#221 measures the full Node with three and with four
  next steps, 19-character labels, in both languages, at part 2's sixteen widths, in the CI runner's
  faces (DejaVu Sans, Liberation Sans) and on Windows (Segoe UI, Verdana), and records the three
  numbers here with its output") and the owner's comment on #221
- Measured: 2026-10-10, on the production build of `6372b06` (branch `DeKnecht/issue-221`), the row
  as #221 built it -- no redrawn buttons, unlike #220's script
- Follows: `docs/research/issue-220-answer-row-room.md` (its part 2 and its sixteen widths)

## 1. What was measured

- **Pages**: the full Node of 10.6 at its 49-entry Trail, in English and in Dutch, with **four**
  next steps (`tests/fixtures/full-node/`) and with **three** (`tests/fixtures/three-next-steps/`),
  every label 19 characters in both languages, one of them a single word ("Notwithstandingness").
  The baseline is the same full Node with **two** next steps, as `dev` had it before #221 (the file
  `tests/fixtures/full-node/tree.json` at `364a025`), served beside them as `two-next-steps`.
- **What fits**: the page walked as `tests/browser/no-scroll.spec.ts` walks it, with its exemptions,
  overflows nothing beyond what the baseline overflows in the same window (`dev`'s disclaimer takes
  two lines between about 480 and 640 pixels wide, a known defect that is not the row's), and no
  label is wider than its button. The notice of 41.4 is taken off for the measurement (its class
  removed), so the row is measured where the notice would stand in for it.
- **The lowest window**: at each of part 2's sixteen widths, the lowest height from 481 up at which
  the page fits, found by halving between 481 and 1080, each height the same page resized. A cell
  gives the height and, in brackets, the most lines a label took there.
- **Faces**, each proved by Chromium's `CSS.getPlatformFontsForNode` on a button's label:
  - **Windows 11**, Chromium of Playwright 1.62.1: the default stack, drawn in **Segoe UI** Bold;
    and every button set to **Verdana**, #220's stand-in for DejaVu Sans.
  - **Linux**, Ubuntu 24.04.2 in WSL 2 -- the release of the CI runner, `ubuntu-latest` -- with
    `fonts-liberation` and `fonts-dejavu-core` and the Chromium headless shell of Playwright 1.62.1:
    the default stack, drawn in **Liberation Sans** Bold (fontconfig's Arial), and every button set
    to **DejaVu Sans** Bold. The server ran in the same Linux, from the same build.

## 2. What it shows

1. **Every face gives the same windows but at 321 pixels wide.** Liberation Sans gives Segoe UI's
   numbers cell for cell, and DejaVu Sans gives Verdana's.
2. **From 600 pixels wide up to 999** the full Node with three and with four next steps fits a
   window 481 tall in every face, both languages.
3. **At 480 and 520 pixels wide it needs 488**, in every face: two rows of buttons are 136 pixels
   there (two of 60, a gap of 8 and the row's padding of 4 above and below, which stops below 480),
   and the Bubble's text area is left 147 of the 151 the full Node's text takes. At 479 the padding
   is gone and it fits at 481 again; at 390 and 420 it fits at 481 too.
4. **Below 390 pixels wide** it needs 488 at 360 in every face, and at 321 488 in Segoe UI and
   Liberation Sans and **536** (three next steps, English) or 512 in Verdana and DejaVu Sans, where
   a 19-character label takes three lines in a button of 141.
5. **One row of four from 1000 pixels wide** fits a window 481 tall at 1000, 1100 and 1279 in every
   face, a label on one line or two.

## 3. The three numbers of 41.4, by its rules

| Number | Rule (application.md 41.4) | Measured | Result |
|---|---|---|---|
| The width | the larger of 390 and the lowest of part 2's widths from which three and four fit a window 481 tall at it and at every one of part 2's widths above it up to 999, in every face, rounded up to the next ten | 520 needs 488 in every face; 600 and every width above it to 999 fit at 481 | **600** |
| The height | the larger of 560 and the highest height any face needs below the notice's width, rounded up to the next ten | below 600 the highest is 536 (DejaVu Sans and Verdana, 321 wide, three next steps, English): 540 | **560** |
| 41.3's 1000 | stays, unless a face does not fit one row of four in a window 481 tall at 1000, 1100 or 1279 | every face fits at 481 at all three | **1000** |

So a step of three or four next steps shows the notice below **600** pixels wide and below **560**
tall, naming 560; every other step keeps the floor of 10.4.

## 4. The script

Run as `node measure-221.mjs http://127.0.0.1:<port>` and `node measure-221.mjs
http://127.0.0.1:<port> Verdana` (Windows) or `'DejaVu Sans'` (Linux), from a folder whose
`node_modules` holds `playwright-core`, against `node .next/standalone/server.js` serving a data
directory seeded with the three Trees of section 1. Its code is as it ran.

```js
// Issue #221: application.md 41.4's three numbers, measured on the built Answer row. A scratch
// script, copied whole into docs/research/issue-221-answer-row-faces.md and deleted. Usage, from a
// folder whose node_modules holds playwright-core:
//   node measure-221.mjs <origin> [<face>]
// <origin> serves full-node (the full Node with four next steps), three-next-steps (three) and
// two-next-steps (dev's full Node, two: the baseline); <face>, when given, is set as the Answer
// buttons' font-family, as #220's script set it (Verdana on Windows, DejaVu Sans in Linux).
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('playwright-core')

const [origin, face] = process.argv.slice(2)

/** Part 2's sixteen widths (docs/research/issue-220-answer-row-room.md section 1). */
const WIDTHS = [321, 360, 390, 420, 479, 480, 520, 600, 700, 767, 768, 800, 900, 1000, 1100, 1279]
const TRAIL = Array.from({ length: 49 }, () => 'full').join('/')
const PAGES = [
  ['four', `/full-node/${TRAIL}/full`],
  ['three', `/three-next-steps/${TRAIL}/full`],
]
const BASELINE = `/two-next-steps/${TRAIL}/full`

/**
 * The page as 10.6's walk sees it, with the notice of 41.4 taken off so the row is measured where
 * the notice would stand in for it: every element whose content is wider or taller than itself,
 * with no-scroll.spec.ts's exemptions; the most lines a label takes; whether a label is wider than
 * its button; the row's height; the face the buttons are drawn in.
 */
async function measure(page) {
  return page.evaluate((face) => {
    document.querySelector('.minimum-size--steps')?.classList.remove('minimum-size--steps')
    const row = document.querySelector('.tree-frame:not([aria-hidden]) .answers')
    if (face) for (const button of row.querySelectorAll('.answer')) button.style.fontFamily = face
    const overflowing = {}
    const d = document.documentElement
    if (d.scrollHeight > innerHeight + 1 || d.scrollWidth > innerWidth + 1) overflowing.document = [d.scrollWidth - innerWidth, d.scrollHeight - innerHeight]
    for (const el of document.querySelectorAll('body, body *')) {
      if (el.matches('[data-carousel-strip], [data-scroll-box], [data-scroll-box] [data-clamp], .page-chrome [data-clamp]')) continue
      if (el.closest('[aria-hidden="true"], template, script, style')) continue
      if ((el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) || (el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1)) {
        const name = `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`
        overflowing[name] = [el.scrollWidth - el.clientWidth, el.scrollHeight - el.clientHeight]
      }
    }
    let lines = 0
    let wide = false
    for (const button of row.querySelectorAll('.answer')) {
      const span = button.querySelector('.branch-label')
      const range = document.createRange()
      range.selectNodeContents(span)
      lines = Math.max(lines, new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size)
      if (span.scrollWidth > span.clientWidth + 1 || button.scrollWidth > button.clientWidth + 1) wide = true
    }
    const first = row.querySelector('.answer')
    return { overflowing, lines, wide, row: Math.round(row.getBoundingClientRect().height), family: getComputedStyle(first).fontFamily, width: Math.round(first.getBoundingClientRect().width) }
  }, face ?? null)
}

/** What `m` overflows beyond `base`, the two-step full Node in the same window. */
function beyond(m, base) {
  return Object.entries(m.overflowing).filter(([name, [x, y]]) => !base.overflowing[name] || x > base.overflowing[name][0] + 1 || y > base.overflowing[name][1] + 1).map(([name]) => name)
}

async function resized(page, width, height) {
  await page.setViewportSize({ width, height })
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
}

const browser = await chromium.launch()
try {
  for (const lang of ['en', 'nl']) {
    const query = lang === 'nl' ? '?lang=nl' : ''
    console.log(`\n### The full Node, ${lang}${face ? `, the buttons in ${face}` : ''}: the lowest window that holds the next steps\n`)
    console.log('| width | 3 next steps | 4 next steps | button width (4) |')
    console.log('|---|---|---|---|')
    let family = ''
    for (const width of WIDTHS) {
      const cells = []
      let buttonWidth = 0
      for (const [, url] of PAGES) {
        const context = await browser.newContext()
        const page = await context.newPage()
        const base = await context.newPage()
        await page.setViewportSize({ width, height: 1080 })
        await base.setViewportSize({ width, height: 1080 })
        await page.goto(origin + url + query, { waitUntil: 'load' })
        await base.goto(origin + BASELINE + query, { waitUntil: 'load' })
        await page.evaluate(() => document.fonts.ready)
        await base.evaluate(() => document.fonts.ready)
        let lines = 0
        const fits = async (height) => {
          await resized(page, width, height)
          await resized(base, width, height)
          const m = await measure(page)
          const b = await measure(base)
          lines = m.lines
          family = m.family
          buttonWidth = m.width
          return beyond(m, b).length === 0 && !m.wide
        }
        let low = 481
        let high = 1080
        if (await fits(low)) cells.push(`481 (${lines})`)
        else if (!(await fits(high))) cells.push('over 1080')
        else {
          while (high - low > 1) {
            const mid = Math.floor((low + high) / 2)
            if (await fits(mid)) high = mid
            else low = mid
          }
          await fits(high)
          cells.push(`${high} (${lines})`)
        }
        await context.close()
      }
      console.log(`| ${width} | ${cells.join(' | ')} | ${buttonWidth} |`)
    }
    console.log(`\nButtons drawn in: ${family}`)
  }
} finally {
  await browser.close()
}
```

## 5. The output

### 5.1 Windows, the default stack (Segoe UI)
#### The full Node, en: the lowest window that holds the next steps

| width | 3 next steps | 4 next steps | button width (4) |
|---|---|---|---|
| 321 | 488 (2) | 488 (2) | 141 |
| 360 | 488 (2) | 488 (2) | 160 |
| 390 | 481 (2) | 481 (2) | 175 |
| 420 | 481 (2) | 481 (2) | 190 |
| 479 | 481 (1) | 481 (1) | 220 |
| 480 | 488 (2) | 488 (2) | 204 |
| 520 | 488 (2) | 488 (2) | 224 |
| 600 | 481 (1) | 481 (1) | 264 |
| 700 | 481 (1) | 481 (1) | 314 |
| 767 | 481 (1) | 481 (1) | 348 |
| 768 | 481 (1) | 481 (1) | 348 |
| 800 | 481 (1) | 481 (1) | 364 |
| 900 | 481 (1) | 481 (1) | 414 |
| 1000 | 481 (2) | 481 (1) | 303 |
| 1100 | 481 (1) | 481 (1) | 336 |
| 1279 | 481 (1) | 481 (1) | 406 |

Buttons drawn in: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif

#### The full Node, nl: the lowest window that holds the next steps

| width | 3 next steps | 4 next steps | button width (4) |
|---|---|---|---|
| 321 | 488 (2) | 488 (2) | 141 |
| 360 | 488 (2) | 488 (2) | 160 |
| 390 | 481 (2) | 481 (2) | 175 |
| 420 | 481 (2) | 481 (2) | 190 |
| 479 | 481 (1) | 481 (1) | 220 |
| 480 | 488 (2) | 488 (2) | 204 |
| 520 | 488 (1) | 488 (1) | 224 |
| 600 | 481 (1) | 481 (1) | 264 |
| 700 | 481 (1) | 481 (1) | 314 |
| 767 | 481 (1) | 481 (1) | 348 |
| 768 | 481 (1) | 481 (1) | 348 |
| 800 | 481 (1) | 481 (1) | 364 |
| 900 | 481 (1) | 481 (1) | 414 |
| 1000 | 481 (1) | 481 (1) | 303 |
| 1100 | 481 (1) | 481 (1) | 336 |
| 1279 | 481 (1) | 481 (1) | 406 |

Buttons drawn in: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif

### 5.2 Windows, the buttons in Verdana
#### The full Node, en, the buttons in Verdana: the lowest window that holds the next steps

| width | 3 next steps | 4 next steps | button width (4) |
|---|---|---|---|
| 321 | 536 (3) | 512 (3) | 141 |
| 360 | 488 (2) | 488 (2) | 160 |
| 390 | 481 (2) | 481 (2) | 175 |
| 420 | 481 (2) | 481 (2) | 190 |
| 479 | 481 (2) | 481 (2) | 220 |
| 480 | 488 (2) | 488 (2) | 204 |
| 520 | 488 (2) | 488 (2) | 224 |
| 600 | 481 (2) | 481 (1) | 264 |
| 700 | 481 (1) | 481 (1) | 314 |
| 767 | 481 (1) | 481 (1) | 348 |
| 768 | 481 (1) | 481 (1) | 348 |
| 800 | 481 (1) | 481 (1) | 364 |
| 900 | 481 (1) | 481 (1) | 414 |
| 1000 | 481 (2) | 481 (1) | 303 |
| 1100 | 481 (2) | 481 (1) | 336 |
| 1279 | 481 (1) | 481 (1) | 406 |

Buttons drawn in: Verdana

#### The full Node, nl, the buttons in Verdana: the lowest window that holds the next steps

| width | 3 next steps | 4 next steps | button width (4) |
|---|---|---|---|
| 321 | 512 (3) | 512 (3) | 141 |
| 360 | 488 (2) | 488 (2) | 160 |
| 390 | 481 (2) | 481 (2) | 175 |
| 420 | 481 (2) | 481 (2) | 190 |
| 479 | 481 (2) | 481 (2) | 220 |
| 480 | 488 (2) | 488 (2) | 204 |
| 520 | 488 (2) | 488 (2) | 224 |
| 600 | 481 (1) | 481 (1) | 264 |
| 700 | 481 (1) | 481 (1) | 314 |
| 767 | 481 (1) | 481 (1) | 348 |
| 768 | 481 (1) | 481 (1) | 348 |
| 800 | 481 (1) | 481 (1) | 364 |
| 900 | 481 (1) | 481 (1) | 414 |
| 1000 | 481 (2) | 481 (1) | 303 |
| 1100 | 481 (2) | 481 (1) | 336 |
| 1279 | 481 (1) | 481 (1) | 406 |

Buttons drawn in: Verdana

### 5.3 Linux, the default stack (Liberation Sans)
#### The full Node, en: the lowest window that holds the next steps

| width | 3 next steps | 4 next steps | button width (4) |
|---|---|---|---|
| 321 | 488 (2) | 488 (2) | 141 |
| 360 | 488 (2) | 488 (2) | 160 |
| 390 | 481 (2) | 481 (2) | 175 |
| 420 | 481 (2) | 481 (2) | 190 |
| 479 | 481 (1) | 481 (1) | 220 |
| 480 | 488 (2) | 488 (2) | 204 |
| 520 | 488 (2) | 488 (2) | 224 |
| 600 | 481 (1) | 481 (1) | 264 |
| 700 | 481 (1) | 481 (1) | 314 |
| 767 | 481 (1) | 481 (1) | 348 |
| 768 | 481 (1) | 481 (1) | 348 |
| 800 | 481 (1) | 481 (1) | 364 |
| 900 | 481 (1) | 481 (1) | 414 |
| 1000 | 481 (2) | 481 (1) | 303 |
| 1100 | 481 (1) | 481 (1) | 336 |
| 1279 | 481 (1) | 481 (1) | 406 |

Buttons drawn in: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif

#### The full Node, nl: the lowest window that holds the next steps

| width | 3 next steps | 4 next steps | button width (4) |
|---|---|---|---|
| 321 | 488 (2) | 488 (2) | 141 |
| 360 | 488 (2) | 488 (2) | 160 |
| 390 | 481 (2) | 481 (2) | 175 |
| 420 | 481 (2) | 481 (2) | 190 |
| 479 | 481 (1) | 481 (1) | 220 |
| 480 | 488 (2) | 488 (2) | 204 |
| 520 | 488 (1) | 488 (1) | 224 |
| 600 | 481 (1) | 481 (1) | 264 |
| 700 | 481 (1) | 481 (1) | 314 |
| 767 | 481 (1) | 481 (1) | 348 |
| 768 | 481 (1) | 481 (1) | 348 |
| 800 | 481 (1) | 481 (1) | 364 |
| 900 | 481 (1) | 481 (1) | 414 |
| 1000 | 481 (1) | 481 (1) | 303 |
| 1100 | 481 (1) | 481 (1) | 336 |
| 1279 | 481 (1) | 481 (1) | 406 |

Buttons drawn in: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif

### 5.4 Linux, the buttons in DejaVu Sans
#### The full Node, en, the buttons in DejaVu Sans: the lowest window that holds the next steps

| width | 3 next steps | 4 next steps | button width (4) |
|---|---|---|---|
| 321 | 536 (3) | 512 (3) | 141 |
| 360 | 488 (2) | 488 (2) | 160 |
| 390 | 481 (2) | 481 (2) | 175 |
| 420 | 481 (2) | 481 (2) | 190 |
| 479 | 481 (2) | 481 (2) | 220 |
| 480 | 488 (2) | 488 (2) | 204 |
| 520 | 488 (2) | 488 (2) | 224 |
| 600 | 481 (2) | 481 (1) | 264 |
| 700 | 481 (1) | 481 (1) | 314 |
| 767 | 481 (1) | 481 (1) | 348 |
| 768 | 481 (1) | 481 (1) | 348 |
| 800 | 481 (1) | 481 (1) | 364 |
| 900 | 481 (1) | 481 (1) | 414 |
| 1000 | 481 (2) | 481 (1) | 303 |
| 1100 | 481 (2) | 481 (1) | 336 |
| 1279 | 481 (1) | 481 (1) | 406 |

Buttons drawn in: "DejaVu Sans"

#### The full Node, nl, the buttons in DejaVu Sans: the lowest window that holds the next steps

| width | 3 next steps | 4 next steps | button width (4) |
|---|---|---|---|
| 321 | 536 (3) | 512 (3) | 141 |
| 360 | 488 (2) | 488 (2) | 160 |
| 390 | 481 (2) | 481 (2) | 175 |
| 420 | 481 (2) | 481 (2) | 190 |
| 479 | 481 (2) | 481 (2) | 220 |
| 480 | 488 (2) | 488 (2) | 204 |
| 520 | 488 (2) | 488 (2) | 224 |
| 600 | 481 (1) | 481 (1) | 264 |
| 700 | 481 (1) | 481 (1) | 314 |
| 767 | 481 (1) | 481 (1) | 348 |
| 768 | 481 (1) | 481 (1) | 348 |
| 800 | 481 (1) | 481 (1) | 364 |
| 900 | 481 (1) | 481 (1) | 414 |
| 1000 | 481 (2) | 481 (1) | 303 |
| 1100 | 481 (2) | 481 (1) | 336 |
| 1279 | 481 (1) | 481 (1) | 406 |

Buttons drawn in: "DejaVu Sans"
