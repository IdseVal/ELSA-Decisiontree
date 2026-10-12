# Issue #230: where each next step's button stands, and where its slide goes

- Issue: #230 -- Tree creation (the owner's instruction)
- Asked by: the owner's "make sure that these amount of buttons to navigate down the tree (up to 5
  buttons) are displayed in a evenly spread out manner and that when click, the view slides in the
  direction of the button, so it feels as if you are moving in its direction"; this record states
  what `dev` does today, for `docs/adrs/ADR-230-tree-creation-round.md` and for #231
- Measured: 2026-10-10, on the production build of `dev` at `b9e7c03`, Windows 11, Chromium of
  Playwright, the fixtures served by `tests/browser/serve.ts` as `transition.spec.ts` serves them

## 1. What was measured

- **Pages**: the public page of the full Node (`/full`) of `tests/fixtures/three-next-steps/`
  (three next steps) and of `tests/fixtures/full-node/` (four), in English.
- **Viewports**: 1280 x 640 (the guarantee), 999 x 640 (the first width at which three and four
  stand two a row, `docs/specs/application.md` 41.3), 800 x 640 and 360 x 640.
- **The button's place**: the middle of the button's box less the middle of the Answer row's
  box, across ("across", pixels, negative left of the middle), and the button's top less the row's
  top ("down": 0 or 4 is the first row, 68 or 72 the second).
- **The slide**: clicking the button, the last keyframe of the tree layer's animation, read as
  `transition.spec.ts`'s `slideOf` reads it, with the target's payload held back until it is read.
  The layer moves opposite the reader, so "the reader goes" is the keyframe's translation negated:
  where the reader travels, in pixels (positive across is to the right, positive down is down).
- **Agree**: whether the button stands on the side of the row the reader travels to:
  `same side` when both are left, both right or both in the middle; `one straight` when one of
  them is in the middle and the other is not; `OPPOSITE` when they are on opposite sides.

## 2. Result

| Fixture | Viewport | Button | Across | Down | The reader goes (across, down) | Agree |
|---|---|---|---|---|---|---|
| three-next-steps | 1280 x 640 | 1 of 3 | -427 | 4 | -1280, 568 | same side |
| three-next-steps | 1280 x 640 | 2 of 3 | 0 | 4 | 0, 568 | same side |
| three-next-steps | 1280 x 640 | 3 of 3 | 427 | 4 | 1280, 568 | same side |
| three-next-steps | 999 x 640 | 1 of 3 | -242 | 4 | -967, 568 | same side |
| three-next-steps | 999 x 640 | 2 of 3 | 242 | 4 | 0, 568 | one straight |
| three-next-steps | 999 x 640 | 3 of 3 | 0 | 72 | 967, 568 | one straight |
| three-next-steps | 800 x 640 | 1 of 3 | -192 | 4 | -768, 568 | same side |
| three-next-steps | 800 x 640 | 2 of 3 | 192 | 4 | 0, 568 | one straight |
| three-next-steps | 800 x 640 | 3 of 3 | 0 | 72 | 768, 568 | one straight |
| three-next-steps | 360 x 640 | 1 of 3 | -84 | 0 | -328, 569 | same side |
| three-next-steps | 360 x 640 | 2 of 3 | 84 | 0 | 0, 569 | one straight |
| three-next-steps | 360 x 640 | 3 of 3 | 0 | 68 | 328, 569 | one straight |
| full-node | 1280 x 640 | 1 of 4 | -480 | 4 | -1920, 568 | same side |
| full-node | 1280 x 640 | 2 of 4 | -160 | 4 | -640, 568 | same side |
| full-node | 1280 x 640 | 3 of 4 | 160 | 4 | 640, 568 | same side |
| full-node | 1280 x 640 | 4 of 4 | 480 | 4 | 1920, 568 | same side |
| full-node | 999 x 640 | 1 of 4 | -242 | 4 | -1450, 568 | same side |
| full-node | 999 x 640 | 2 of 4 | 242 | 4 | -483, 568 | OPPOSITE |
| full-node | 999 x 640 | 3 of 4 | -242 | 72 | 484, 568 | OPPOSITE |
| full-node | 999 x 640 | 4 of 4 | 242 | 72 | 1451, 568 | same side |
| full-node | 800 x 640 | 1 of 4 | -192 | 4 | -1152, 568 | same side |
| full-node | 800 x 640 | 2 of 4 | 192 | 4 | -384, 568 | OPPOSITE |
| full-node | 800 x 640 | 3 of 4 | -192 | 72 | 384, 568 | OPPOSITE |
| full-node | 800 x 640 | 4 of 4 | 192 | 72 | 1152, 568 | same side |
| full-node | 360 x 640 | 1 of 4 | -84 | 0 | -492, 569 | same side |
| full-node | 360 x 640 | 2 of 4 | 84 | 0 | -164, 569 | OPPOSITE |
| full-node | 360 x 640 | 3 of 4 | -84 | 68 | 164, 569 | OPPOSITE |
| full-node | 360 x 640 | 4 of 4 | 84 | 68 | 492, 569 | same side |

- **From 1000 pixels wide up** every button of three and of four stands on the side its slide
  goes to: one row, and 41.5's places, `x` = *i* - (*n* - 1) / 2, in the same order.
- **Below 1000 pixels wide** the buttons stand two a row (41.3), while the slide still goes to the
  places of one row (41.5). Of four, the second button stands right of the middle and the reader
  goes down and to the **left**; the third stands left of the middle, on the second row, and the
  reader goes down and to the **right**. Of three, the second stands right of the middle and the
  reader goes **straight down**; the third stands in the middle of the second row and the reader
  goes down and to the **right**. That is 4 of the 7 buttons at each of 999, 800 and 360 pixels
  wide, and every step of three or four next steps below 1000 pixels wide.
- Two of the rows are 0 and 68 apart at 360 x 640 and 4 and 72 at the wider viewports: the row's
  padding of 4 above and below stops below 480 pixels wide (41.4).
- **The editor** was not measured: it renders no neighbour frame and no `data-slide`, and every
  control in it is a plain link, so nothing in it slides (`docs/specs/application.md` 34.5; 30.2:
  "a plain navigation, no slide"; `goTo` in `src/editor/Structure.tsx`).

## 3. The script

Run from the worktree root after `npm run build`, with a configuration that starts no server of its
own (`serve` starts one per fixture), the output appended to the file `SCRATCH_OUT` names:

```
$ export SCRATCH_OUT="$TEMP/scratch-230.md"
$ ELSA_TEST_PORT=13900 npx playwright test -c playwright.scratch-230.config.ts
Running 2 tests using 1 worker
[1/2] [chromium] › tests/browser/scratch-230.spec.ts:36:3 › three-next-steps
[2/2] [chromium] › tests/browser/scratch-230.spec.ts:36:3 › full-node
  2 passed (30.6s)
```

`playwright.scratch-230.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'scratch-230.spec.ts',
  outputDir: './tests/browser/.results-scratch-230',
  workers: 1,
  reporter: 'line',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

`tests/browser/scratch-230.spec.ts`:

```ts
// Scratch measurement for #230's round record: where each next step's button stands against
// the direction its slide goes. Not committed.
import { appendFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, type Page } from '@playwright/test'
import { arrived } from './arrived.ts'
import { BASE_PORT, serve, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const OUT = process.env.SCRATCH_OUT!

test.afterAll(stopServers)

async function slideOf(page: Page, control: string): Promise<{ x: number; y: number }> {
  let release = () => {}
  const held = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/*', async (route) => {
    if (route.request().headers()['rsc'] === '1') await held
    await route.continue()
  })
  const href = new URL((await page.locator(control).getAttribute('href'))!, page.url()).href
  await page.locator(control).click()
  const away = await page.waitForFunction(() => {
    const frames = document.querySelector('.tree-layer')?.getAnimations()[0]?.effect
    return frames instanceof KeyframeEffect ? String(frames.getKeyframes().at(-1)?.transform) : null
  })
  const [, x, y] = (await away.jsonValue())!.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/)!.map(Number)
  release()
  await arrived(page, href)
  await page.unroute('**/*')
  return { x: x!, y: y! }
}

for (const [fixture, port] of [['three-next-steps', 70], ['full-node', 71]] as const) {
  test(fixture, async ({ page }) => {
    test.setTimeout(300_000)
    const origin = await serve(path.join(repo, 'tests', 'fixtures'), fixture, BASE_PORT + port)
    for (const [width, height] of [[1280, 640], [999, 640], [800, 640], [360, 640]]) {
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}/${fixture}/full`)
      const count = await page.locator('.tree-layer .tree-frame:not([aria-hidden]) .answers > .answer--next').count()
      const rows: string[] = []
      for (let i = 1; i <= count; i++) {
        await page.goto(`${origin}/${fixture}/full`)
        const control = `.answers > .answer--next:nth-child(${i})`
        const box = await page.locator(control).first().boundingBox()
        const row = await page.locator('.answers').first().boundingBox()
        const across = Math.round(box!.x + box!.width / 2 - (row!.x + row!.width / 2))
        const down = Math.round(box!.y - row!.y)
        const slide = await slideOf(page, control)
        // The layer moves opposite the reader, so the reader goes to -slide.
        const goes = { x: Math.round(-slide.x), y: Math.round(-slide.y) }
        const agree = Math.sign(across) === Math.sign(goes.x) ? 'same side' : Math.sign(goes.x) === 0 || Math.sign(across) === 0 ? 'one straight' : 'OPPOSITE'
        rows.push(`| ${fixture} | ${width} x ${height} | ${i} of ${count} | ${across} | ${down} | ${goes.x}, ${goes.y} | ${agree} |`)
      }
      appendFileSync(OUT, rows.join('\n') + '\n')
    }
  })
}
```

Both files were deleted after the run; neither is in the repository.
