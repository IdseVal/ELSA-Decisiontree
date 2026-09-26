import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

/**
 * The browser walk of the FIRST Tree (`npm run test:first-tree`), issue #23.
 *
 * It walks again since issue #44 cut that Tree's content to the maximum lengths
 * `elsa-tree/2` gives every text (`docs/specs/tree-format.md` 5.7): the Tree was over
 * them in 454 places, so the server this config starts refused to start at all. The cut
 * made three of the six steps span several Nodes, which is why the click paths in
 * `tests/first-tree/walk.spec.ts` are longer than they were. `npm run test:browser`,
 * which serves the example Tree, is unaffected.
 *
 * It is a second configuration rather than a second project inside
 * `playwright.config.ts` because a Playwright server serves one Tree at a time: the
 * default config serves `trees/ai-act-example`, which is what `tests/browser/` asserts
 * against, and this one serves the Tree the owner authored -- each from a data directory
 * holding that Tree alone. Both start the standalone
 * server a deployment runs, so what the tests see -- and what the screenshots show -- is
 * what a deployment serves.
 *
 * The suite also takes the eight screenshots issue #10 owes, but only when `ELSA_SHOTS=1`
 * asks for them: the app renders in whatever fonts the machine has, so the PNGs record one
 * machine's rendering and any other machine re-renders them differently. A plain run writes
 * its shots to the gitignored results directory and leaves the tracked files alone -- see
 * the note at the top of `tests/first-tree/walk.spec.ts`.
 *
 * `tests/first-tree/every-link.spec.ts` (issue #46) follows every Link of the Tree in both
 * languages at two viewports and records each page; under `ELSA_SHOTS=1` it rewrites
 * `docs/screenshots/issue-46/`, so re-take one issue's record by naming its file.
 *
 * `tests/first-tree/explainers.spec.ts` (issue #103) hovers every marked term of the Tree in
 * both languages at two viewports and holds each panel to the 148 pixels of 10.8: the Tree's
 * Dutch, in its own font, is the long-worded text the `explainers` fixture is not.
 *
 * `tests/first-tree/slide-endurance.spec.ts` (issue #63) slides 400 times in one tab. It is
 * here rather than in `tests/browser/` for its six minutes, which `npm run test:browser`,
 * the command CI runs, cannot spare (docs/specs/application.md section 7).
 */
const PORT = Number(process.env.ELSA_TEST_PORT ?? 3118)

/**
 * **[#134]** The server's data directory, built fresh before it starts and holding the first
 * Tree alone (application.md 18.1; `tests/browser/data-dir.ts`). Absolute, because the
 * standalone server moves into its own folder before it reads the variable.
 */
const DATA_DIR = path.resolve('tests', 'first-tree', '.data', String(PORT))

export default defineConfig({
  testDir: './tests/first-tree',
  outputDir: './tests/first-tree/.results',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : 'line',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // The viewport comes after the device, which carries one of its own: the guaranteed
      // viewport of docs/specs/application.md 10.4, where the tree view shows every Option
      // as a Branch. The 1000 px this suite used until issue #41 was the width of the 0.1
      // screenshot set; below 1280 px the Options of a five-Option Node are behind a Sheet
      // (10.5, step 4), and this suite walks by clicking what is on the page.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 640 } },
    },
  ],
  webServer: {
    command: `node tests/browser/data-dir.ts "${DATA_DIR}" trees/ai-act-applicability-agrifood && npm run build && node .next/standalone/server.js`,
    url: `http://127.0.0.1:${PORT}/ai-act-applicability-agrifood/start`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      ELSA_DATA_DIR: DATA_DIR,
      NEXT_TELEMETRY_DISABLED: '1',
      // The standalone server reads where to listen from the environment, not from flags.
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
    },
  },
})
