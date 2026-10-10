# Issue #222: the height of the editor's notice for a row of three or four buttons

- Issue: #222 -- Editor: the creator chooses how many next steps a step has
- Asked by: `docs/specs/application.md` 41.7 item 8 ("Where the row has three or more buttons, the
  editor shows the notice below 390 pixels wide by 41.4's rule, its height measured by #222 on the
  editor's page with its bar and floating controls (the highest need, rounded up to ten, never below
  41.4's)") and `ADR-220-editing-next-steps.md` decision 8
- Measured: 2026-10-10, on the production build of the branch `DeKnecht/issue-222` at `e4d45d3`,
  Windows 11, Chromium of Playwright 1.62.1
- Follows: `docs/research/issue-221-answer-row-faces.md` (its method, its widths, its faces)

## 1. What was measured

- **Pages**: the editor (`/admin/trees/...`, logged in as the administrator, with its bar and the
  controls that float under it) on three rows of four buttons, in English and in Dutch:
  - **four next steps**: `tests/fixtures/full-node/`'s full Node at its 49-entry Trail, four next
    steps of 19 characters, each a field between its move arrows;
  - **three and +**: `tests/fixtures/three-next-steps/`'s full Node at the same Trail, three next
    steps of 19 characters and the editor's `+`;
  - **the empty step's four**: `full-node`'s `opt-three`, a step without Links, with `+ Yes`,
    `Tree ends here`, `+ No` and `+`.
- **The width**: 41.4's rule gives it, 600 as #221 measured it (`application.md` 41.4); 41.7 item 8
  measures the height only, below it. Part 2's widths below 600 -- 321, 360, 390, 420, 479, 480 and
  520 -- and 599.
- **What fits**: the page walked as `tests/browser/admin-no-scroll.spec.ts` walks it, with its
  exemptions, overflows nothing, with the notice taken off (its classes `minimum-size--steps` and
  `minimum-size--editor-steps` removed) so the row is measured where the notice would stand in for
  it. Between about 480 and 640 pixels wide dev's disclaimer takes two lines and overflows its band
  at every height on every page, a known defect that is not the row's
  (`issue-221-answer-row-faces.md` section 1): its band is not counted, and the page may be taller
  than the window by what the disclaimer overflows its band by.
- **The lowest window**: at each width, the lowest height from 481 up at which the page fits, found
  by halving between 481 and 1080, each height the same page resized. A cell gives the height and,
  in brackets, what overflowed one pixel lower.
- **Faces**: the default stack, drawn in **Segoe UI** on Windows; and the row's buttons set to
  **Verdana**, #220's and #221's stand-in for DejaVu Sans. #221 measured the Linux faces in Ubuntu
  24.04 and found Liberation Sans giving Segoe UI's windows and DejaVu Sans giving Verdana's, cell for
  cell (`issue-221-answer-row-faces.md` section 2); this run did not measure them again.
- **Earlier runs, not recorded**: a first that counted the disclaimer found no height that fits at
  480 and 520 wide, nor at 599 in Dutch (and its third page was `/full/opt-three`, the full Node with
  an Overlay open, by mistake); a second, which clipped the disclaimer to one line at every width,
  took away the second line it is drawn with below 480 too and found 481 there, which is too low. A
  third, counting the disclaimer as above on the build of `27429bd`, where the move arrows
  straddled the button's top outline, found a highest need of **536** (four next steps, English, the
  row in Verdana, 321 wide), so 560. The creator's walk (`tests/browser/creation-walk.spec.ts`, the
  owner's standard of #181: no control across its box) then refused those arrows, and `1df0b96` put
  them inside the button at its ends, the label's padding widened to 32 to keep clear of them. The
  run below is on that row; the same script on the build of `1df0b96`, before the editor's notice
  had a class of its own, gave the same tables cell for cell.

## 2. What it shows

1. **From 420 to 599 wide the editor gives the windows #221 found for the public page**: 488 at 480
   and 520, 481 at 420, 479 and 599, in both faces and both languages.
2. **Below 420 the labels between the arrows need more.** At 321 wide the full Node of four next
   steps and of three and `+` needs **584** in English in both faces and in Dutch with the row in
   Verdana (536 in Dutch in Segoe UI); at 360, 512 to 584; at 390, 481 in Segoe UI and 493 to 517
   with the row in Verdana.
3. **The empty step's four fit a window 481 tall at every width measured**, in both faces and both
   languages: they carry no arrows.

## 3. The height, by 41.7 item 8's rule

| Rule (application.md 41.7 item 8, 41.4) | Measured | Result |
|---|---|---|
| the highest need below 41.4's width (600), rounded up to the next ten, never below 41.4's height (560) | 584 (four next steps and three and `+`, 321 wide, English in both faces): 590 | **590** |

So the editor shows the notice for a row of three or four buttons below **600** pixels wide and
**590** tall, naming 590; the public page and the preview keep 41.4's 560 for a step of three or
four. The editor counts its own buttons (`src/components/TreeView.tsx`, `buttonsOf`) and gives its
notice the class `minimum-size--editor-steps`, whose media query holds the numbers.
`tests/browser/admin-no-scroll.spec.ts` holds the editor at 599 and 600 x 481 and at 599 and 321 x
589 and 590, both languages.

## 4. The script

Run as `node measure-222.mjs http://127.0.0.1:<port>` and `node measure-222.mjs
http://127.0.0.1:<port> Verdana`, from the worktree, against `node .next/standalone/server.js`
serving a data directory made by `node tests/browser/data-dir.ts <dir> tests/fixtures/full-node
tests/fixtures/three-next-steps`, with `tests/store/admin.ts`'s administrator. Its code is as it ran.

```js
// Issue #222: the height of the editor's notice for a row of three or four buttons (application.md
// 41.7 item 8): below 41.4's width, the lowest window from 481 up in which the editor's page of the
// full Node fits, its notice taken off. A scratch script, copied whole into
// docs/research/issue-222-editor-notice-height.md and deleted. Usage, from the worktree (its
// node_modules holds playwright-core), against a server whose data directory holds full-node and
// three-next-steps, published, and the administrator of tests/store/admin.ts:
//   node measure-222.mjs <origin> [<face>]
// <face>, when given, is set as the font-family of the Answer row's buttons, as #221's script set it
// (Verdana on Windows, the stand-in for DejaVu Sans). Between about 480 and 640 pixels wide dev's
// disclaimer takes two lines and overflows its band at every height, a known defect that is not the
// row's (docs/research/issue-221-answer-row-faces.md section 1): the page may be taller than the
// window by what the disclaimer overflows its band by, and the band itself is not counted.
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(path.join(process.cwd(), 'package.json'))
const { chromium } = require('playwright-core')

const [origin, face] = process.argv.slice(2)

/** Part 2's widths below 41.4's 600 (docs/research/issue-220-answer-row-room.md section 1), and 599. */
const WIDTHS = [321, 360, 390, 420, 479, 480, 520, 599]
const TRAIL = Array.from({ length: 49 }, () => 'full').join('/')
const PAGES = [
  ['four next steps', `/admin/trees/full-node/${TRAIL}/full`],
  ['three and +', `/admin/trees/three-next-steps/${TRAIL}/full`],
  ['the empty step\'s four', `/admin/trees/full-node/opt-three`],
]

/**
 * The page as admin-no-scroll.spec.ts measures it, with 41.4's notice taken off so the row is
 * measured where the notice would stand in for it: the document's overflow and every element whose
 * content is larger than itself, with that spec's exemptions; and the face a button is drawn in.
 */
async function measure(page) {
  return page.evaluate((face) => {
    document.querySelector('.minimum-size')?.classList.remove('minimum-size--steps', 'minimum-size--editor-steps')
    if (face && !document.getElementById('face-222')) {
      const style = document.createElement('style')
      style.id = 'face-222'
      style.textContent = `.answers :is(.answer, .structure, .sheet-open, textarea) { font-family: ${face} !important; }`
      document.head.append(style)
    }
    const overflowing = []
    const d = document.documentElement
    const b = document.body
    // What the disclaimer overflows its own band by, the known defect: the page may be that much taller.
    const footer = document.querySelector('footer.disclaimer')
    const slack = footer ? Math.max(0, footer.scrollHeight - footer.clientHeight) : 0
    const tall = (el) => el.scrollHeight > el.clientHeight + 1 + (el === d || el === b ? slack : 0)
    if (Math.max(d.scrollHeight, b.scrollHeight) > innerHeight + 1 + slack || Math.max(d.scrollWidth, b.scrollWidth) > innerWidth + 1) overflowing.push('document')
    for (const el of document.querySelectorAll('*')) {
      if (el.matches('[data-scroll-box], [data-clamp], [data-carousel-strip], footer.disclaimer')) continue
      if (el === d || el === b) {
        if (tall(el) || el.scrollWidth > el.clientWidth + 1) overflowing.push(el.tagName.toLowerCase())
        continue
      }
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) overflowing.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`)
    }
    const button = document.querySelector('.tree-frame:not([aria-hidden]) .answers > :not(.answer--start-again)')
    return { overflowing, family: getComputedStyle(button).fontFamily, row: Math.round(button.parentElement.getBoundingClientRect().height) }
  }, face ?? null)
}

async function resized(page, width, height) {
  await page.setViewportSize({ width, height })
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
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
  for (const lang of ['en', 'nl']) {
    const query = lang === 'nl' ? '?lang=nl' : ''
    console.log(`\n### The editor, ${lang}${face ? `, the row in ${face}` : ''}: the lowest window that holds the page\n`)
    console.log(`| width | ${PAGES.map(([name]) => name).join(' | ')} |`)
    console.log(`|---|${PAGES.map(() => '---|').join('')}`)
    let family = ''
    let worst = { height: 0, at: '' }
    for (const width of WIDTHS) {
      const cells = []
      for (const [name, url] of PAGES) {
        const page = await context.newPage()
        await page.setViewportSize({ width, height: 1080 })
        await page.goto(origin + url + query, { waitUntil: 'load' })
        await page.evaluate(() => document.fonts.ready)
        let last = []
        const fits = async (height) => {
          await resized(page, width, height)
          const m = await measure(page)
          family = m.family
          last = m.overflowing
          return m.overflowing.length === 0
        }
        let low = 481
        let high = 1080
        if (await fits(low)) cells.push('481')
        else if (!(await fits(high))) cells.push(`over 1080 (${last.join(', ')})`)
        else {
          while (high - low > 1) {
            const mid = Math.floor((low + high) / 2)
            if (await fits(mid)) high = mid
            else low = mid
          }
          await fits(low)
          cells.push(`${high} (${last.join(', ')} at ${low})`)
          if (high > worst.height) worst = { height: high, at: `${name}, ${width} wide` }
        }
        await page.close()
      }
      console.log(`| ${width} | ${cells.join(' | ')} |`)
    }
    console.log(`\nButtons drawn in: ${family}. Highest need: ${worst.height || 481}${worst.at ? ` (${worst.at})` : ''}.`)
  }
} finally {
  await browser.close()
}
```

## 5. The output

### 5.1 Windows, the default stack (Segoe UI)

#### The editor, en: the lowest window that holds the page

| width | four next steps | three and + | the empty step's four |
|---|---|---|---|
| 321 | 584 (div.bubble-text at 583) | 584 (div.bubble-text at 583) | 481 |
| 360 | 536 (div.bubble-text at 535) | 512 (div.bubble-text at 511) | 481 |
| 390 | 481 | 481 | 481 |
| 420 | 481 | 481 | 481 |
| 479 | 481 | 481 | 481 |
| 480 | 488 (div.bubble-text at 487) | 488 (div.bubble-text at 487) | 481 |
| 520 | 488 (div.bubble-text at 487) | 488 (div.bubble-text at 487) | 481 |
| 599 | 481 | 481 | 481 |

Buttons drawn in: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif. Highest need: 584 (four next steps, 321 wide).

#### The editor, nl: the lowest window that holds the page

| width | four next steps | three and + | the empty step's four |
|---|---|---|---|
| 321 | 536 (div.bubble-text at 535) | 536 (div.bubble-text at 535) | 481 |
| 360 | 536 (div.bubble-text at 535) | 512 (div.bubble-text at 511) | 481 |
| 390 | 481 | 481 | 481 |
| 420 | 481 | 481 | 481 |
| 479 | 481 | 481 | 481 |
| 480 | 488 (div.bubble-text at 487) | 488 (div.bubble-text at 487) | 481 |
| 520 | 488 (div.bubble-text at 487) | 488 (div.bubble-text at 487) | 481 |
| 599 | 481 | 481 | 481 |

Buttons drawn in: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif. Highest need: 536 (four next steps, 321 wide).

### 5.2 Windows, the row in Verdana

#### The editor, en, the row in Verdana: the lowest window that holds the page

| width | four next steps | three and + | the empty step's four |
|---|---|---|---|
| 321 | 584 (div.bubble-text at 583) | 584 (div.bubble-text at 583) | 481 |
| 360 | 584 (div.bubble-text at 583) | 584 (div.bubble-text at 583) | 481 |
| 390 | 517 (div.bubble-text at 516) | 493 (div.bubble-text at 492) | 481 |
| 420 | 481 | 481 | 481 |
| 479 | 481 | 481 | 481 |
| 480 | 488 (div.bubble-text at 487) | 488 (div.bubble-text at 487) | 481 |
| 520 | 488 (div.bubble-text at 487) | 488 (div.bubble-text at 487) | 481 |
| 599 | 481 | 481 | 481 |

Buttons drawn in: Verdana. Highest need: 584 (four next steps, 321 wide).

#### The editor, nl, the row in Verdana: the lowest window that holds the page

| width | four next steps | three and + | the empty step's four |
|---|---|---|---|
| 321 | 584 (div.bubble-text at 583) | 584 (div.bubble-text at 583) | 481 |
| 360 | 536 (div.bubble-text at 535) | 536 (div.bubble-text at 535) | 481 |
| 390 | 517 (div.bubble-text at 516) | 493 (div.bubble-text at 492) | 481 |
| 420 | 481 | 481 | 481 |
| 479 | 481 | 481 | 481 |
| 480 | 488 (div.bubble-text at 487) | 488 (div.bubble-text at 487) | 481 |
| 520 | 488 (div.bubble-text at 487) | 488 (div.bubble-text at 487) | 481 |
| 599 | 481 | 481 | 481 |

Buttons drawn in: Verdana. Highest need: 584 (four next steps, 321 wide).
