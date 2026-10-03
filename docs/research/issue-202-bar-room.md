# Issue #202: the room in the chrome bars for the "Editor" and "Website" buttons

> Measured on 2026-10-03 by the run that filed the issues of #202, on Windows 11 with Node
> 22.18.0 and Playwright 1.62.1 (its Chromium), against the production build (`npm run build`)
> of `dev` at `6d0ea4b`, served by `node .next/standalone/server.js` from a scratch data
> directory seeded from the repository's `trees/` (`ELSA_SEED_DIR`), with `ELSA_ADMIN_PASSWORD`
> set for the administrator. Every number that `docs/adrs/ADR-202-navigation-round.md`, core
> document 3.4 `[#202]` and issue #204 cite is here, with the script that produced it, copied
> whole in section 3, and its output as it ran, in section 2. The script was a scratch file of
> that run and was deleted; it ran twice, and the two runs printed the same tables. This is a
> record, not a contract: #204 builds the buttons, amends `docs/specs/application.md` 24.3, and
> measures again where a number decides a test. Windows draws the default stack in Arial and the
> first Tree in its own Open Sans; Linux draws web fonts up to 1.9 pixels wider
> (`issue-171-measurements.md` 3).

## 1. What was measured

- **A control drawn into each bar** by the script, at the end of its controls
  (`.page-controls`), where #204 is to put it: an `<a>` saying "Editor" on the public pages or
  "Website" at `/admin`, with the class of the share button (`share`: a pill with a border, the
  look of the public bars' own controls) or of the account link (`admin-link`: underlined text,
  the look of the admin bars' own). Nothing else on the page was changed, except in the Node
  pages' last column, where the current language's pill (`.language--current`) is hidden too --
  there at every viewport, where #204 is to hide it below 480 pixels wide only.
- ***room***: the width between the bar's first child -- the arrow and the Tree's mark on a
  Node page, the site's title elsewhere -- and its controls, the bar's gap taken off. Where the
  first child is hidden, as the site's title is on the Tree-less admin bars below 480 pixels
  wide (`application.md` 24.3, #135), the width after the controls, which then stand alone at
  the left.
- ***DOES NOT FIT***: the bar is wider than the window, the body is wider than the window, or
  an element of the bar has content wider than itself (10.6). Once nothing in the bar can
  shrink any more, the bar grows past the window: "bar 346 in 320" is that width.
- **Pages**: the root Node pages of the two seeded Trees, both with a logo; the overview `/`;
  the login page at `/admin`, without a session; and the creators' overview at `/admin` as the
  administrator, whose bar holds the most controls -- the language switch, Account, Accounts and
  Log out.
- **Viewports**: the ten of 10.6, then 479 x 800, the widest window below 480.

## 2. The output, as it ran

What it shows:

- "Editor" does not fit a Node page's bar at 320 x 480, in either language, beside either
  Tree's logo: the bar grows to 330 to 360 pixels. Nor at 360 x 640 in Dutch beside the first
  Tree's logo: 362 to 368. In both looks.
- With the current language's pill given up -- 48.4 pixels for "English", 71.5 for
  "Nederlands" at 320 x 480 -- "Editor" in the share button's look fits every viewport, with
  26.8 to 43.3 pixels to spare at 320 x 480.
- At 390 x 844 and below, a Node page's bar has 7.1 to 82.9 pixels of room on `dev`; "Editor"
  takes about 45 to 47 pixels of it, its gap included, in the share button's look, and about
  38 to 40 in the account link's (each the difference of two rooms rounded to a tenth).
- The overview's bar keeps 37.1 to 48.1 pixels at 320 x 480 with "Editor" in it. With
  "Website" in it, the bar at `/admin` keeps at least 177.4 pixels on the login page, and 13.3
  to 27.0 at 320 x 480 on the administrator's creators' overview. Neither has to give anything
  up.

### The root Node page of ai-act-applicability-agrifood

| lang | viewport | room on dev | + "Editor", share look | + "Editor", account-link look | + "Editor", share look, no current-language pill |
|---|---|---|---|---|---|
| en | 1280 x 640 | 824.7 | 755.3 | 778.5 | 824.9 |
| en | 1366 x 768 | 910.7 | 841.3 | 864.5 | 910.9 |
| en | 1920 x 1080 | 1464.7 | 1395.3 | 1418.5 | 1464.9 |
| en | 2560 x 1440 | 2104.7 | 2035.3 | 2058.5 | 2104.9 |
| en | 1280 x 800 | 824.7 | 755.3 | 778.5 | 824.9 |
| en | 1024 x 768 | 568.7 | 499.3 | 522.5 | 568.9 |
| en | 768 x 1024 | 312.7 | 243.3 | 266.5 | 312.9 |
| en | 390 x 844 | 75.6 | 29 | 35.4 | 81.3 |
| en | 360 x 640 | 52.2 | 5.6 | 12 | 58 |
| en | 320 x 480 | 21 | 0 -- DOES NOT FIT: bar 346 in 320 | 0 -- DOES NOT FIT: bar 339 in 320 | 26.8 |
| en | 479 x 800 | 145 | 98.4 | 104.8 | 150.8 |
| nl | 1280 x 640 | 809.5 | 740.1 | 763.3 | 834.9 |
| nl | 1366 x 768 | 895.5 | 826.1 | 849.3 | 920.9 |
| nl | 1920 x 1080 | 1449.5 | 1380.1 | 1403.3 | 1474.9 |
| nl | 2560 x 1440 | 2089.5 | 2020.1 | 2043.3 | 2114.9 |
| nl | 1280 x 800 | 809.5 | 740.1 | 763.3 | 834.9 |
| nl | 1024 x 768 | 553.5 | 484.1 | 507.3 | 578.9 |
| nl | 768 x 1024 | 297.5 | 228.1 | 251.3 | 322.9 |
| nl | 390 x 844 | 61.7 | 15 | 21.5 | 90.5 |
| nl | 360 x 640 | 38.3 | 0 -- DOES NOT FIT: bar 368 in 360 | 0 -- DOES NOT FIT: bar 362 in 360 | 67.1 |
| nl | 320 x 480 | 7.1 | 0 -- DOES NOT FIT: bar 360 in 320 | 0 -- DOES NOT FIT: bar 353 in 320 | 35.9 |
| nl | 479 x 800 | 131.1 | 84.5 | 90.9 | 159.9 |

### The root Node page of ai-act-example

| lang | viewport | room on dev | + "Editor", share look | + "Editor", account-link look | + "Editor", share look, no current-language pill |
|---|---|---|---|---|---|
| en | 1280 x 640 | 832.5 | 765.1 | 788.5 | 832.8 |
| en | 1366 x 768 | 918.5 | 851.1 | 874.5 | 918.8 |
| en | 1920 x 1080 | 1472.5 | 1405.1 | 1428.5 | 1472.8 |
| en | 2560 x 1440 | 2112.5 | 2045.1 | 2068.5 | 2112.8 |
| en | 1280 x 800 | 832.5 | 765.1 | 788.5 | 832.8 |
| en | 1024 x 768 | 576.5 | 509.1 | 532.5 | 576.8 |
| en | 768 x 1024 | 320.5 | 253.1 | 276.5 | 320.8 |
| en | 390 x 844 | 82.9 | 38.2 | 45 | 88.7 |
| en | 360 x 640 | 59.5 | 14.8 | 21.6 | 65.3 |
| en | 320 x 480 | 28.3 | 0 -- DOES NOT FIT: bar 336 in 320 | 0 -- DOES NOT FIT: bar 330 in 320 | 34.1 |
| en | 479 x 800 | 152.4 | 107.7 | 114.4 | 158.2 |
| nl | 1280 x 640 | 819.4 | 752.1 | 775.5 | 842.8 |
| nl | 1366 x 768 | 905.4 | 838.1 | 861.5 | 928.8 |
| nl | 1920 x 1080 | 1459.4 | 1392.1 | 1415.5 | 1482.8 |
| nl | 2560 x 1440 | 2099.4 | 2032.1 | 2055.5 | 2122.8 |
| nl | 1280 x 800 | 819.4 | 752.1 | 775.5 | 842.8 |
| nl | 1024 x 768 | 563.4 | 496.1 | 519.5 | 586.8 |
| nl | 768 x 1024 | 307.4 | 240.1 | 263.5 | 330.8 |
| nl | 390 x 844 | 71 | 26.3 | 33 | 97.9 |
| nl | 360 x 640 | 47.6 | 2.9 | 9.7 | 74.5 |
| nl | 320 x 480 | 16.4 | 0 -- DOES NOT FIT: bar 348 in 320 | 0 -- DOES NOT FIT: bar 342 in 320 | 43.3 |
| nl | 479 x 800 | 140.4 | 95.7 | 102.5 | 167.4 |

### The overview, /

| lang | viewport | room on dev | + "Editor", share look | + "Editor", account-link look |
|---|---|---|---|---|
| en | 1280 x 640 | 964.2 | 896.9 | 920.3 |
| en | 1366 x 768 | 1050.2 | 982.9 | 1006.3 |
| en | 1920 x 1080 | 1604.2 | 1536.9 | 1560.3 |
| en | 2560 x 1440 | 2244.2 | 2176.9 | 2200.3 |
| en | 1280 x 800 | 964.2 | 896.9 | 920.3 |
| en | 1024 x 768 | 708.2 | 640.9 | 664.3 |
| en | 768 x 1024 | 452.2 | 384.9 | 408.3 |
| en | 390 x 844 | 151.8 | 107.1 | 113.9 |
| en | 360 x 640 | 121.8 | 77.1 | 83.9 |
| en | 320 x 480 | 81.8 | 37.1 | 43.9 |
| en | 479 x 800 | 240.8 | 196.1 | 202.9 |
| nl | 1280 x 640 | 969.2 | 901.9 | 925.3 |
| nl | 1366 x 768 | 1055.2 | 987.9 | 1011.3 |
| nl | 1920 x 1080 | 1609.2 | 1541.9 | 1565.3 |
| nl | 2560 x 1440 | 2249.2 | 2181.9 | 2205.3 |
| nl | 1280 x 800 | 969.2 | 901.9 | 925.3 |
| nl | 1024 x 768 | 713.2 | 645.9 | 669.3 |
| nl | 768 x 1024 | 457.2 | 389.9 | 413.3 |
| nl | 390 x 844 | 156 | 111.3 | 118.1 |
| nl | 360 x 640 | 126 | 81.3 | 88.1 |
| nl | 320 x 480 | 86 | 41.3 | 48.1 |
| nl | 479 x 800 | 245 | 200.3 | 207.1 |

### The login page at /admin

| lang | viewport | room on dev | + "Website", account-link look | + "Website", share look |
|---|---|---|---|---|
| en | 1280 x 640 | 964.2 | 908.2 | 885.8 |
| en | 1366 x 768 | 1050.2 | 994.2 | 971.8 |
| en | 1920 x 1080 | 1604.2 | 1548.2 | 1525.8 |
| en | 2560 x 1440 | 2244.2 | 2188.2 | 2165.8 |
| en | 1280 x 800 | 964.2 | 908.2 | 885.8 |
| en | 1024 x 768 | 708.2 | 652.2 | 629.8 |
| en | 768 x 1024 | 452.2 | 396.2 | 373.8 |
| en | 390 x 844 | 302.3 | 252.4 | 247.4 |
| en | 360 x 640 | 272.3 | 222.4 | 217.4 |
| en | 320 x 480 | 232.3 | 182.4 | 177.4 |
| en | 479 x 800 | 391.3 | 341.4 | 336.4 |
| nl | 1280 x 640 | 969.2 | 913.2 | 890.8 |
| nl | 1366 x 768 | 1055.2 | 999.2 | 976.8 |
| nl | 1920 x 1080 | 1609.2 | 1553.2 | 1530.8 |
| nl | 2560 x 1440 | 2249.2 | 2193.2 | 2170.8 |
| nl | 1280 x 800 | 969.2 | 913.2 | 890.8 |
| nl | 1024 x 768 | 713.2 | 657.2 | 634.8 |
| nl | 768 x 1024 | 457.2 | 401.2 | 378.8 |
| nl | 390 x 844 | 323.5 | 273.5 | 268.6 |
| nl | 360 x 640 | 293.5 | 243.5 | 238.6 |
| nl | 320 x 480 | 253.5 | 203.5 | 198.6 |
| nl | 479 x 800 | 412.5 | 362.5 | 357.6 |

### The creators' overview at /admin, as the administrator (four controls: the switch, Account, Accounts, Log out)

| lang | viewport | room on dev | + "Website", account-link look | + "Website", share look |
|---|---|---|---|---|
| en | 1280 x 640 | 790 | 734.1 | 711.6 |
| en | 1366 x 768 | 876 | 820.1 | 797.6 |
| en | 1920 x 1080 | 1430 | 1374.1 | 1351.6 |
| en | 2560 x 1440 | 2070 | 2014.1 | 1991.6 |
| en | 1280 x 800 | 790 | 734.1 | 711.6 |
| en | 1024 x 768 | 534 | 478.1 | 455.6 |
| en | 768 x 1024 | 278 | 222.1 | 199.6 |
| en | 390 x 844 | 138.2 | 88.2 | 83.3 |
| en | 360 x 640 | 108.2 | 58.2 | 53.3 |
| en | 320 x 480 | 68.2 | 18.2 | 13.3 |
| en | 479 x 800 | 227.2 | 177.2 | 172.3 |
| nl | 1280 x 640 | 782.7 | 726.7 | 704.2 |
| nl | 1366 x 768 | 868.7 | 812.7 | 790.2 |
| nl | 1920 x 1080 | 1422.7 | 1366.7 | 1344.2 |
| nl | 2560 x 1440 | 2062.7 | 2006.7 | 1984.2 |
| nl | 1280 x 800 | 782.7 | 726.7 | 704.2 |
| nl | 1024 x 768 | 526.7 | 470.7 | 448.2 |
| nl | 768 x 1024 | 270.7 | 214.7 | 192.2 |
| nl | 390 x 844 | 147 | 97 | 92.1 |
| nl | 360 x 640 | 117 | 67 | 62.1 |
| nl | 320 x 480 | 77 | 27 | 22.1 |
| nl | 479 x 800 | 236 | 186 | 181.1 |

### The language switch on the root Node page of ai-act-applicability-agrifood at 320 x 480

- en: "English" (the current language) 48.4 pixels, "Nederlands" 71.5 pixels
- nl: "English" 48.4 pixels, "Nederlands" (the current language) 71.5 pixels

## 3. The script

Run as `node measure.mjs http://127.0.0.1:<port> <the administrator's password>` against the server above.

```js
// Issue #202: the room in the chrome bars for #204's "Editor" and "Website", on the production
// build of dev. A scratch script of the filing run, copied whole into
// docs/research/issue-202-bar-room.md and deleted. Usage: node measure.mjs <origin> <admin password>
import { createRequire } from 'node:module'

const require = createRequire('C:/Users/idse_/orca/workspaces/ELSA-Decisiontree/issue-202/package.json')
const { chromium } = require('@playwright/test')

const [origin, password] = process.argv.slice(2)
/** The ten viewports of 10.6, then 479 x 800, the widest window below 480. */
const VIEWPORTS = [
  [1280, 640], [1366, 768], [1920, 1080], [2560, 1440], [1280, 800],
  [1024, 768], [768, 1024], [390, 844], [360, 640], [320, 480], [479, 800],
]

/**
 * The room in the page's chrome bar, after drawing `add` -- an `<a>` with a class of the bar's
 * own controls -- at the end of its controls, and after hiding the current language's pill
 * when `hideCurrent`. Room: between the bar's first child and its controls, the bar's gap
 * taken off; where the first child is hidden (the Tree-less admin bars below 480), after the
 * controls, which then stand alone at the left. Fits: the bar no wider than the window, and
 * nothing in the bar wider than itself.
 */
async function measure(page, add, hideCurrent) {
  return page.evaluate(({ add, hideCurrent }) => {
    const bar = document.querySelector('header.page-chrome')
    const controls = bar.querySelector(':scope > .page-controls')
    if (hideCurrent) for (const pill of controls.querySelectorAll('.language--current')) pill.closest('li').style.display = 'none'
    if (add) {
      const a = document.createElement('a')
      a.className = add.className
      a.href = add.href
      a.textContent = add.text
      controls.append(a)
    }
    const cs = getComputedStyle(bar)
    const first = bar.firstElementChild
    const f = first.getBoundingClientRect()
    const c = controls.getBoundingClientRect()
    const box = bar.getBoundingClientRect()
    const shown = getComputedStyle(first).display !== 'none' && f.width > 0
    const room = shown ? c.left - f.right - parseFloat(cs.columnGap) : box.right - parseFloat(cs.paddingRight) - c.right
    const overflowing = [...bar.querySelectorAll('*')].some((el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1)
    const fits = box.width <= window.innerWidth + 0.5 && document.body.scrollWidth <= window.innerWidth && !overflowing
    return `${Math.round(room * 10) / 10}${fits ? '' : ` -- DOES NOT FIT: bar ${Math.round(box.width)} in ${window.innerWidth}`}`
  }, { add, hideCurrent })
}

const browser = await chromium.launch()
const tables = []
async function table(context, title, path, variants) {
  const rows = [`### ${title}`, '', `| lang | viewport | room on dev | ${variants.map((v) => v.label).join(' | ')} |`, `|---|---|---|${variants.map(() => '---|').join('')}`]
  const page = await context.newPage()
  for (const lang of ['en', 'nl']) {
    for (const [w, h] of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h })
      const url = new URL(path, origin)
      if (lang === 'nl') url.searchParams.set('lang', 'nl')
      await page.goto(url.href, { waitUntil: 'load' })
      const cells = [await measure(page, null, false)]
      for (const v of variants) {
        await page.reload({ waitUntil: 'load' })
        cells.push(await measure(page, v.add, v.hideCurrent))
      }
      rows.push(`| ${lang} | ${w} x ${h} | ${cells.join(' | ')} |`)
    }
  }
  await page.close()
  tables.push(rows.join('\n'))
}

const editor = (className) => ({ className, href: '/admin', text: 'Editor' })
const website = (className) => ({ className, href: '/', text: 'Website' })
const node = [
  { label: '+ "Editor", share look', add: editor('share'), hideCurrent: false },
  { label: '+ "Editor", account-link look', add: editor('admin-link'), hideCurrent: false },
  { label: '+ "Editor", share look, no current-language pill', add: editor('share'), hideCurrent: true },
]

const visitor = await browser.newContext()
await table(visitor, 'The root Node page of ai-act-applicability-agrifood', '/ai-act-applicability-agrifood', node)
await table(visitor, 'The root Node page of ai-act-example', '/ai-act-example', node)
await table(visitor, 'The overview, /', '/', node.slice(0, 2))
await table(visitor, 'The login page at /admin', '/admin', [
  { label: '+ "Website", account-link look', add: website('admin-link'), hideCurrent: false },
  { label: '+ "Website", share look', add: website('share'), hideCurrent: false },
])

const admin = await browser.newContext()
const answer = await admin.request.post(`${origin}/admin/api/login`, {
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  data: { login: 'admin', password },
})
if (answer.status() !== 204) throw new Error(`login answered ${answer.status()}`)
await table(admin, "The creators' overview at /admin, as the administrator (four controls: the switch, Account, Accounts, Log out)", '/admin', [
  { label: '+ "Website", account-link look', add: website('admin-link'), hideCurrent: false },
  { label: '+ "Website", share look', add: website('share'), hideCurrent: false },
])
// What the language switch's pills say, and how wide they are, at the floor.
const pills = ['### The language switch on the root Node page of ai-act-applicability-agrifood at 320 x 480', '']
const floor = await visitor.newPage()
await floor.setViewportSize({ width: 320, height: 480 })
for (const lang of ['en', 'nl']) {
  await floor.goto(`${origin}/ai-act-applicability-agrifood${lang === 'nl' ? '?lang=nl' : ''}`, { waitUntil: 'load' })
  const said = await floor.evaluate(() =>
    [...document.querySelectorAll('header.page-chrome .language-switch li')]
      .map((li) => `"${li.textContent.trim()}"${li.querySelector('.language--current') ? ' (the current language)' : ''} ${Math.round(li.getBoundingClientRect().width * 10) / 10} pixels`)
      .join(', '),
  )
  pills.push(`- ${lang}: ${said}`)
}
tables.push(pills.join('\n'))
await browser.close()
console.log(tables.join('\n\n'))
```
