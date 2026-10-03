# Issue #195: the room the mention of a Tree's Authors has, in the chrome bar and on a tile

> Measured on 2026-10-03 by the architect run for issue #195, on Windows 11 with Node 22.18.0
> and Playwright 1.62.1 (its Chromium), against the production build (`npm run build`) of
> `dev` at `b6d9566`, served by the browser tests' own `serveStore` from a data directory
> holding the repository's two Trees and a third with no logo and a title of the format's 80
> characters. Every number that `docs/adrs/ADR-195-the-mention.md` and
> `docs/specs/application.md` 39.4 and 39.5 cite is here, with the script that produced it and
> its output as it ran. The script was a scratch spec of this run, deleted before the pull
> request; it is copied whole below. This is a record, not a contract: the contracts are the
> spec and the ADRs. Windows draws the default stack in Arial and the first Tree in its own
> Open Sans; Linux draws web fonts up to 1.9 pixels wider (`issue-171-measurements.md` 3), so a
> build issue measures again where a number decides a test.

## 1. What was measured

The mention was drawn into the page by the script, as 39.4 and 39.5 describe it, and nothing
else of the page was changed:

- **In the chrome bar** of the Tree's root Node page: a box between the Tree's mark (the logo,
  or the title as text) and the controls (the language switch and the share button), taking
  the free room of the bar (`flex: 1 1 0`), its own left margin cancelling the bar's gap so
  that it takes no pixel when it holds nothing; a size container (`container-type:
  inline-size`), whose one line -- 13 pixels on 20 in `text-muted`, 11 on 14 below 480 pixels
  wide as the bar's pills -- is cut with an ellipsis where the box ends, and is not drawn where
  the box leaves it under 80 pixels. *room* is the width the line has, the bar's gap taken off.
- Two mentions per page: one name ("By Idse Val" / "Door Idse Val") and three ("By Anna de
  Vries, Bram Jansen and Cees Bakker" / "Door Anna de Vries, Bram Jansen en Cees Bakker"), each
  given with its own width at the line's size in brackets; *whole* when the line holds it,
  *cut* when the ellipsis takes its end.
- *mark, controls moved*: whether the Tree's mark changed width or height, or the controls
  moved, between the page without the box and the page with it -- the box taking a pixel.
  *overflowing*: an element of the bar, the mention aside, whose content is wider or taller
  than itself (10.6's walk), or the bar itself.
- **On the tile** of the public overview, `/`: the same line at the language tags' type (11 on
  16), after the tags in the tile's bottom row; and again with a state mark of the creators'
  overview after it (26.4), `Published` / `Gepubliceerd`.

## 2. The chrome bar

`long-title` is the Tree with no logo: its title is the mark, as text. At 480 and above the
bar is 44 pixels tall and its gap 16; below 480, 36 and 8 (10.5's phone rule). Two things in
the table are not the mention's:

- **Below 600 pixels wide, an 80-character title as text is taller than the bar** -- three to
  five lines of 20 pixels in a bar of 44 (the rows where *overflowing* says "the bar") -- with
  or without the mention: *mark* is measured on the page before the box is added. No Tree of
  the repository has no logo, and no page of 10.6 shows a Tree with such a title; a defect of
  today, reported by #195 and not fixed by it.
- At 479 pixels wide the bar has more room than at 480: below 480 its pills and the logo
  shrink (10.5's phone rule).

| Tree | lang | viewport | mark | room | one name | three names | mark, controls moved | overflowing |
|---|---|---|---|---|---|---|---|---|
| ai-act-applicability-agrifood | en | 2560 x 1440 | 120 x 30 | 2089 | whole (65) | whole (289) | no | none |
| ai-act-applicability-agrifood | en | 1920 x 1080 | 120 x 30 | 1449 | whole (65) | whole (289) | no | none |
| ai-act-applicability-agrifood | en | 1366 x 768 | 120 x 30 | 895 | whole (65) | whole (289) | no | none |
| ai-act-applicability-agrifood | en | 1280 x 800 | 120 x 30 | 809 | whole (65) | whole (289) | no | none |
| ai-act-applicability-agrifood | en | 1280 x 640 | 120 x 30 | 809 | whole (65) | whole (289) | no | none |
| ai-act-applicability-agrifood | en | 1024 x 768 | 120 x 30 | 553 | whole (65) | whole (289) | no | none |
| ai-act-applicability-agrifood | en | 800 x 800 | 120 x 30 | 329 | whole (65) | whole (289) | no | none |
| ai-act-applicability-agrifood | en | 768 x 1024 | 120 x 30 | 297 | whole (65) | whole (289) | no | none |
| ai-act-applicability-agrifood | en | 700 x 800 | 120 x 30 | 229 | whole (65) | cut (289) | no | none |
| ai-act-applicability-agrifood | en | 640 x 800 | 120 x 30 | 169 | whole (65) | cut (289) | no | none |
| ai-act-applicability-agrifood | en | 600 x 800 | 120 x 30 | 129 | whole (65) | cut (289) | no | none |
| ai-act-applicability-agrifood | en | 560 x 800 | 120 x 30 | 89 | whole (65) | cut (289) | no | none |
| ai-act-applicability-agrifood | en | 520 x 800 | 120 x 30 | 49 | not drawn | not drawn | no | none |
| ai-act-applicability-agrifood | en | 480 x 640 | 120 x 30 | 9 | not drawn | not drawn | no | none |
| ai-act-applicability-agrifood | en | 479 x 640 | 93 x 30 | 137 | whole (55) | cut (244) | no | none |
| ai-act-applicability-agrifood | en | 390 x 844 | 74 x 30 | 68 | not drawn | not drawn | no | none |
| ai-act-applicability-agrifood | en | 360 x 640 | 67 x 30 | 44 | not drawn | not drawn | no | none |
| ai-act-applicability-agrifood | nl | 2560 x 1440 | 120 x 30 | 2074 | whole (80) | whole (297) | no | none |
| ai-act-applicability-agrifood | nl | 1920 x 1080 | 120 x 30 | 1434 | whole (80) | whole (297) | no | none |
| ai-act-applicability-agrifood | nl | 1366 x 768 | 120 x 30 | 880 | whole (80) | whole (297) | no | none |
| ai-act-applicability-agrifood | nl | 1280 x 800 | 120 x 30 | 794 | whole (80) | whole (297) | no | none |
| ai-act-applicability-agrifood | nl | 1280 x 640 | 120 x 30 | 794 | whole (80) | whole (297) | no | none |
| ai-act-applicability-agrifood | nl | 1024 x 768 | 120 x 30 | 538 | whole (80) | whole (297) | no | none |
| ai-act-applicability-agrifood | nl | 800 x 800 | 120 x 30 | 314 | whole (80) | whole (297) | no | none |
| ai-act-applicability-agrifood | nl | 768 x 1024 | 120 x 30 | 282 | whole (80) | cut (297) | no | none |
| ai-act-applicability-agrifood | nl | 700 x 800 | 120 x 30 | 214 | whole (80) | cut (297) | no | none |
| ai-act-applicability-agrifood | nl | 640 x 800 | 120 x 30 | 154 | whole (80) | cut (297) | no | none |
| ai-act-applicability-agrifood | nl | 600 x 800 | 120 x 30 | 114 | whole (80) | cut (297) | no | none |
| ai-act-applicability-agrifood | nl | 560 x 800 | 120 x 30 | 74 | not drawn | not drawn | no | none |
| ai-act-applicability-agrifood | nl | 520 x 800 | 120 x 30 | 34 | not drawn | not drawn | no | none |
| ai-act-applicability-agrifood | nl | 480 x 640 | 120 x 30 | 0 | not drawn | not drawn | no | none |
| ai-act-applicability-agrifood | nl | 479 x 640 | 93 x 30 | 123 | whole (68) | cut (251) | no | none |
| ai-act-applicability-agrifood | nl | 390 x 844 | 74 x 30 | 54 | not drawn | not drawn | no | none |
| ai-act-applicability-agrifood | nl | 360 x 640 | 67 x 30 | 30 | not drawn | not drawn | no | none |
| ai-act-example | en | 2560 x 1440 | 120 x 30 | 2096 | whole (61) | whole (272) | no | none |
| ai-act-example | en | 1920 x 1080 | 120 x 30 | 1456 | whole (61) | whole (272) | no | none |
| ai-act-example | en | 1366 x 768 | 120 x 30 | 902 | whole (61) | whole (272) | no | none |
| ai-act-example | en | 1280 x 800 | 120 x 30 | 816 | whole (61) | whole (272) | no | none |
| ai-act-example | en | 1280 x 640 | 120 x 30 | 816 | whole (61) | whole (272) | no | none |
| ai-act-example | en | 1024 x 768 | 120 x 30 | 560 | whole (61) | whole (272) | no | none |
| ai-act-example | en | 800 x 800 | 120 x 30 | 336 | whole (61) | whole (272) | no | none |
| ai-act-example | en | 768 x 1024 | 120 x 30 | 304 | whole (61) | whole (272) | no | none |
| ai-act-example | en | 700 x 800 | 120 x 30 | 236 | whole (61) | cut (272) | no | none |
| ai-act-example | en | 640 x 800 | 120 x 30 | 176 | whole (61) | cut (272) | no | none |
| ai-act-example | en | 600 x 800 | 120 x 30 | 136 | whole (61) | cut (272) | no | none |
| ai-act-example | en | 560 x 800 | 120 x 30 | 96 | whole (61) | cut (272) | no | none |
| ai-act-example | en | 520 x 800 | 120 x 30 | 56 | not drawn | not drawn | no | none |
| ai-act-example | en | 480 x 640 | 120 x 30 | 16 | not drawn | not drawn | no | none |
| ai-act-example | en | 479 x 640 | 93 x 30 | 144 | whole (52) | cut (230) | no | none |
| ai-act-example | en | 390 x 844 | 74 x 30 | 75 | not drawn | not drawn | no | none |
| ai-act-example | en | 360 x 640 | 67 x 30 | 52 | not drawn | not drawn | no | none |
| ai-act-example | nl | 2560 x 1440 | 120 x 30 | 2083 | whole (76) | whole (280) | no | none |
| ai-act-example | nl | 1920 x 1080 | 120 x 30 | 1443 | whole (76) | whole (280) | no | none |
| ai-act-example | nl | 1366 x 768 | 120 x 30 | 889 | whole (76) | whole (280) | no | none |
| ai-act-example | nl | 1280 x 800 | 120 x 30 | 803 | whole (76) | whole (280) | no | none |
| ai-act-example | nl | 1280 x 640 | 120 x 30 | 803 | whole (76) | whole (280) | no | none |
| ai-act-example | nl | 1024 x 768 | 120 x 30 | 547 | whole (76) | whole (280) | no | none |
| ai-act-example | nl | 800 x 800 | 120 x 30 | 323 | whole (76) | whole (280) | no | none |
| ai-act-example | nl | 768 x 1024 | 120 x 30 | 291 | whole (76) | whole (280) | no | none |
| ai-act-example | nl | 700 x 800 | 120 x 30 | 223 | whole (76) | cut (280) | no | none |
| ai-act-example | nl | 640 x 800 | 120 x 30 | 163 | whole (76) | cut (280) | no | none |
| ai-act-example | nl | 600 x 800 | 120 x 30 | 123 | whole (76) | cut (280) | no | none |
| ai-act-example | nl | 560 x 800 | 120 x 30 | 83 | whole (76) | cut (280) | no | none |
| ai-act-example | nl | 520 x 800 | 120 x 30 | 43 | not drawn | not drawn | no | none |
| ai-act-example | nl | 480 x 640 | 120 x 30 | 3 | not drawn | not drawn | no | none |
| ai-act-example | nl | 479 x 640 | 93 x 30 | 132 | whole (65) | cut (237) | no | none |
| ai-act-example | nl | 390 x 844 | 74 x 30 | 63 | not drawn | not drawn | no | none |
| ai-act-example | nl | 360 x 640 | 67 x 30 | 40 | not drawn | not drawn | no | none |
| long-title | en | 2560 x 1440 | 474 x 20 | 1743 | whole (61) | whole (272) | no | none |
| long-title | en | 1920 x 1080 | 474 x 20 | 1103 | whole (61) | whole (272) | no | none |
| long-title | en | 1366 x 768 | 474 x 20 | 549 | whole (61) | whole (272) | no | none |
| long-title | en | 1280 x 800 | 474 x 20 | 463 | whole (61) | whole (272) | no | none |
| long-title | en | 1280 x 640 | 474 x 20 | 463 | whole (61) | whole (272) | no | none |
| long-title | en | 1024 x 768 | 474 x 20 | 207 | whole (61) | cut (272) | no | none |
| long-title | en | 800 x 800 | 472 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | en | 768 x 1024 | 440 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | en | 700 x 800 | 372 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | en | 640 x 800 | 312 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | en | 600 x 800 | 272 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | en | 560 x 800 | 232 x 60 | 0 | not drawn | not drawn | no | the bar |
| long-title | en | 520 x 800 | 192 x 60 | 0 | not drawn | not drawn | no | the bar |
| long-title | en | 480 x 640 | 152 x 80 | 0 | not drawn | not drawn | no | the bar |
| long-title | en | 479 x 640 | 246 x 28 | 0 | not drawn | not drawn | no | none |
| long-title | en | 390 x 844 | 157 x 42 | 0 | not drawn | not drawn | no | the bar |
| long-title | en | 360 x 640 | 127 x 56 | 0 | not drawn | not drawn | no | the bar |
| long-title | nl | 2560 x 1440 | 484 x 20 | 1719 | whole (76) | whole (280) | no | none |
| long-title | nl | 1920 x 1080 | 484 x 20 | 1079 | whole (76) | whole (280) | no | none |
| long-title | nl | 1366 x 768 | 484 x 20 | 525 | whole (76) | whole (280) | no | none |
| long-title | nl | 1280 x 800 | 484 x 20 | 439 | whole (76) | whole (280) | no | none |
| long-title | nl | 1280 x 640 | 484 x 20 | 439 | whole (76) | whole (280) | no | none |
| long-title | nl | 1024 x 768 | 484 x 20 | 183 | whole (76) | cut (280) | no | none |
| long-title | nl | 800 x 800 | 459 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | nl | 768 x 1024 | 427 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | nl | 700 x 800 | 359 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | nl | 640 x 800 | 299 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | nl | 600 x 800 | 259 x 40 | 0 | not drawn | not drawn | no | none |
| long-title | nl | 560 x 800 | 219 x 60 | 0 | not drawn | not drawn | no | the bar |
| long-title | nl | 520 x 800 | 179 x 80 | 0 | not drawn | not drawn | no | the bar |
| long-title | nl | 480 x 640 | 139 x 100 | 0 | not drawn | not drawn | no | the bar |
| long-title | nl | 479 x 640 | 234 x 28 | 0 | not drawn | not drawn | no | none |
| long-title | nl | 390 x 844 | 145 x 56 | 0 | not drawn | not drawn | no | the bar |
| long-title | nl | 360 x 640 | 115 x 70 | 0 | not drawn | not drawn | no | the bar |

## 3. The tile

The tile is 280 wide at every viewport here, so its bottom row is 248 pixels inside its
padding at all three. The repository's Trees declare two languages each.

| lang | viewport | Tree | row | room, public | room with a state mark | one name, public | three names, public | one name, with a state mark |
|---|---|---|---|---|---|---|---|---|
| en | 1280 x 640 | ai-act-applicability-agrifood | 248 | 187 | 125 | whole | cut | whole |
| en | 1280 x 640 | ai-act-example | 248 | 187 | 125 | whole | cut | whole |
| en | 1280 x 640 | long-title | 248 | 187 | 125 | whole | cut | whole |
| en | 390 x 844 | ai-act-applicability-agrifood | 248 | 187 | 125 | whole | cut | whole |
| en | 390 x 844 | ai-act-example | 248 | 187 | 125 | whole | cut | whole |
| en | 390 x 844 | long-title | 248 | 187 | 125 | whole | cut | whole |
| en | 360 x 640 | ai-act-applicability-agrifood | 248 | 187 | 125 | whole | cut | whole |
| en | 360 x 640 | ai-act-example | 248 | 187 | 125 | whole | cut | whole |
| en | 360 x 640 | long-title | 248 | 187 | 125 | whole | cut | whole |
| nl | 1280 x 640 | ai-act-applicability-agrifood | 248 | 187 | 107 | whole | cut | whole |
| nl | 1280 x 640 | ai-act-example | 248 | 187 | 107 | whole | cut | whole |
| nl | 1280 x 640 | long-title | 248 | 187 | 107 | whole | cut | whole |
| nl | 390 x 844 | ai-act-applicability-agrifood | 248 | 187 | 107 | whole | cut | whole |
| nl | 390 x 844 | ai-act-example | 248 | 187 | 107 | whole | cut | whole |
| nl | 390 x 844 | long-title | 248 | 187 | 107 | whole | cut | whole |
| nl | 360 x 640 | ai-act-applicability-agrifood | 248 | 187 | 107 | whole | cut | whole |
| nl | 360 x 640 | ai-act-example | 248 | 187 | 107 | whole | cut | whole |
| nl | 360 x 640 | long-title | 248 | 187 | 107 | whole | cut | whole |

## 4. The script

`tests/browser/scratch-authors-room.spec.ts`, run alone by a scratch Playwright configuration
with no web server of its own (`npx playwright test --config=playwright.scratch.config.ts`),
with port 14417 free before it started:

```ts
// SCRATCH for #195: measures the room a mention of a Tree's Authors has in the public chrome
// bar and on a tile's bottom row, with the mention drawn as docs/specs/application.md 39 has
// it. Copied whole into docs/research/issue-195-measurements.md; deleted before the pull request.
import { test } from '@playwright/test'
import { cp, mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { dataDir, serveStore, stopServers } from './serve.ts'
import { treeBytes } from '../../src/tree/serialise.ts'

const PORT = Number(process.env.SCRATCH_PORT ?? 14417)
let origin = ''
const lines: string[] = []

const VIEWPORTS: [number, number][] = [
  [2560, 1440], [1920, 1080], [1366, 768], [1280, 800], [1280, 640], [1024, 768], [800, 800], [768, 1024],
  [700, 800], [640, 800], [600, 800], [560, 800], [520, 800], [480, 640], [479, 640], [390, 844], [360, 640],
]
const MENTION: Record<string, { one: string; three: string }> = {
  en: { one: 'By Idse Val', three: 'By Anna de Vries, Bram Jansen and Cees Bakker' },
  nl: { one: 'Door Idse Val', three: 'Door Anna de Vries, Bram Jansen en Cees Bakker' },
}

/** The mention as 39.4 draws it: a size container in the bar's free room, its own margin cancelling the bar's gap. */
const STYLE = `
  .authors-room { flex: 1 1 0; min-width: 0; margin-left: -16px; container-type: inline-size; }
  .authors { display: block; margin: 0 0 0 16px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
             font-size: 13px; line-height: 20px; color: var(--elsa-text-muted); }
  @media (min-width: 480px) { @container (width < 96px) { .authors { display: none; } } }
  @media (max-width: 479px) {
    .authors-room { margin-left: -8px; }
    .authors { margin-left: 8px; font-size: 11px; line-height: 14px; }
    @container (width < 88px) { .authors { display: none; } }
  }
  .tile-authors-room { flex: 1 1 0; min-width: 0; container-type: inline-size; }
  .tile-authors { display: block; margin: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
                  font-size: 11px; line-height: 16px; color: var(--elsa-text-muted); }
  @container (width < 80px) { .tile-authors { display: none; } }
`

test.beforeAll(async () => {
  // A Tree with no logo and a title of the format's 80 characters, so the bar names it in text.
  const tmp = await mkdtemp(path.join(tmpdir(), 'authors-room-'))
  const long = path.join(tmp, 'long-title')
  await cp('tests/fixtures/full-node', long, { recursive: true })
  const file = path.join(long, 'tree.json')
  const tree = JSON.parse(await readFile(file, 'utf8'))
  const pad = (s: string): string => (s + ' '.repeat(80)).slice(0, 80).trimEnd().padEnd(80, 'x')
  tree.title = {
    en: pad('Does the EU AI Act apply to my AI system, and which of its obligations follow?'),
    nl: pad('Is de EU AI-verordening van toepassing op mijn AI-systeem, en welke plichten?'),
  }
  await writeFile(file, treeBytes(tree))
  const dir = await dataDir([
    { folder: 'trees/ai-act-applicability-agrifood' },
    { folder: 'trees/ai-act-example' },
    { folder: long },
  ])
  origin = await serveStore(dir, PORT)
})

test.afterAll(async () => {
  await stopServers()
  await mkdir('tests/browser/.results', { recursive: true })
  await writeFile('tests/browser/.results/scratch-authors-room.md', lines.join('\n') + '\n')
})

test('the chrome bar', async ({ page }) => {
  test.setTimeout(600_000)
  lines.push(
    '| Tree | lang | viewport | mark | room | one name | three names | mark, controls moved | overflowing |',
    '|---|---|---|---|---|---|---|---|---|',
  )
  for (const id of ['ai-act-applicability-agrifood', 'ai-act-example', 'long-title']) {
    for (const lang of ['en', 'nl']) {
      for (const [w, h] of VIEWPORTS) {
        await page.setViewportSize({ width: w, height: h })
        await page.goto(`${origin}/${id}${lang === 'nl' ? '?lang=nl' : ''}`)
        await page.evaluate(() => document.fonts.ready)
        const m = await page.evaluate(
          ({ style, one, three }) => {
            const sheet = document.createElement('style')
            sheet.textContent = style
            document.head.appendChild(sheet)
            const bar = document.querySelector('header.page-chrome') as HTMLElement
            bar.style.setProperty('--bar-gap', getComputedStyle(bar).columnGap)
            const brand = bar.querySelector('.page-brand') as HTMLElement
            const controls = bar.querySelector('.page-controls') as HTMLElement
            const mark = brand.querySelector('.logo, .tree-title') as HTMLElement
            const box = (el: Element) => el.getBoundingClientRect()
            const before = { mark: box(mark), controls: box(controls) }
            const probe = (text: string) => {
              const room = document.createElement('div')
              room.className = 'authors-room'
              room.innerHTML = `<p class="authors" data-clamp=""></p>`
              ;(room.firstElementChild as HTMLElement).textContent = text
              bar.insertBefore(room, controls)
              const p = room.firstElementChild as HTMLElement
              const width = (() => {
                const span = document.createElement('span')
                span.textContent = text
                span.style.cssText = `position:absolute;white-space:nowrap;font-size:${getComputedStyle(p).fontSize}`
                bar.appendChild(span)
                const w = span.getBoundingClientRect().width
                span.remove()
                return w
              })()
              const after = { mark: box(mark), controls: box(controls) }
              const drawn = getComputedStyle(p).display !== 'none'
              const moved =
                Math.abs(after.mark.width - before.mark.width) > 0.5 ||
                Math.abs(after.mark.height - before.mark.height) > 0.5 ||
                Math.abs(after.controls.left - before.controls.left) > 0.5
              const overflowing: string[] = []
              for (const el of bar.querySelectorAll('*')) {
                if (el.matches('[data-clamp]')) continue
                if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) overflowing.push(el.className)
              }
              if (bar.scrollWidth > bar.clientWidth + 1 || bar.scrollHeight > bar.clientHeight + 1) overflowing.push('the bar')
              const roomWidth = room.getBoundingClientRect().width - parseFloat(getComputedStyle(bar).columnGap)
              const shownWidth = p.getBoundingClientRect().width
              const line = p.getBoundingClientRect().height
              room.remove()
              return {
                room: Math.max(0, Math.round(roomWidth)),
                shown: drawn ? `${shownWidth + 0.5 >= width ? 'whole' : 'cut'} (${Math.round(width)}${line > 21 ? ', TWO LINES' : ''})` : 'not drawn',
                moved,
                overflowing,
              }
            }
            const a = probe(one)
            const b = probe(three)
            return {
              mark: `${Math.round(before.mark.width)} x ${Math.round(before.mark.height)}`,
              room: a.room,
              one: a.shown,
              three: b.shown,
              moved: a.moved || b.moved,
              overflowing: [...new Set([...a.overflowing, ...b.overflowing])],
            }
          },
          { style: STYLE, one: MENTION[lang].one, three: MENTION[lang].three },
        )
        lines.push(
          `| ${id} | ${lang} | ${w} x ${h} | ${m.mark} | ${m.room} | ${m.one} | ${m.three} | ${m.moved ? 'MOVED' : 'no'} | ${m.overflowing.join(', ') || 'none'} |`,
        )
      }
    }
  }
})

test('the tile bottom row', async ({ page }) => {
  test.setTimeout(300_000)
  lines.push(
    '',
    '| lang | viewport | Tree | row | room, public | room with a state mark | one name, public | three names, public | one name, with a state mark |',
    '|---|---|---|---|---|---|---|---|---|',
  )
  for (const lang of ['en', 'nl']) {
    for (const [w, h] of [[1280, 640], [390, 844], [360, 640]] as [number, number][]) {
      await page.setViewportSize({ width: w, height: h })
      await page.goto(`${origin}/${lang === 'nl' ? '?lang=nl' : ''}`)
      await page.evaluate(() => document.fonts.ready)
      const rows = await page.evaluate(
        ({ style, lang, w, h, one, three }) => {
          const sheet = document.createElement('style')
          sheet.textContent = style
          document.head.appendChild(sheet)
          const out: string[] = []
          for (const tile of document.querySelectorAll('a.tile')) {
            const row = tile.querySelector('.tile-languages') as HTMLElement
            const probe = (text: string, state: boolean) => {
              const room = document.createElement('span')
              room.className = 'tile-authors-room'
              room.innerHTML = '<span class="tile-authors" data-clamp=""></span>'
              ;(room.firstElementChild as HTMLElement).textContent = text
              row.appendChild(room)
              let mark: HTMLElement | null = null
              if (state) {
                mark = document.createElement('span')
                mark.className = 'tile-state tile-state--published'
                mark.innerHTML = `<span class="tile-state-dot"></span>${lang === 'nl' ? 'Gepubliceerd' : 'Published'}`
                row.appendChild(mark)
              }
              const p = room.firstElementChild as HTMLElement
              const drawn = getComputedStyle(p).display !== 'none'
              const whole = p.scrollWidth <= p.clientWidth + 1
              const width = Math.round(room.getBoundingClientRect().width)
              room.remove()
              mark?.remove()
              return { width, shown: drawn ? (whole ? 'whole' : 'cut') : 'not drawn' }
            }
            const pub1 = probe(one, false)
            const pub3 = probe(three, false)
            const st1 = probe(one, true)
            out.push(
              `| ${lang} | ${w} x ${h} | ${(tile as HTMLElement).dataset.tree} | ${Math.round(row.getBoundingClientRect().width)} | ${pub1.width} | ${st1.width} | ${pub1.shown} | ${pub3.shown} | ${st1.shown} |`,
            )
          }
          return out
        },
        { style: STYLE, lang, w, h, one: MENTION[lang].one, three: MENTION[lang].three },
      )
      lines.push(...rows)
    }
  }
})
```
