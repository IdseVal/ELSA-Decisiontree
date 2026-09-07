import { defineConfig, devices } from '@playwright/test'

/**
 * The browser walk of the FIRST Tree (`npm run test:first-tree`), issue #23.
 *
 * It is a second configuration rather than a second project inside
 * `playwright.config.ts` because a Playwright server serves one Tree at a time: the
 * default config serves `trees/ai-act-example`, which is what `tests/browser/` asserts
 * against, and this one serves the Tree the owner authored. Both start the standalone
 * server a deployment runs, so what the tests see -- and what the screenshots show -- is
 * what a deployment serves.
 *
 * The screenshots this suite writes into `docs/screenshots/issue-10/` are its output, not
 * a side effect: a run leaves them changed on disk when the app's rendering changes.
 */
const PORT = Number(process.env.ELSA_TEST_PORT ?? 3118)

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
      // The viewport comes after the device, which carries one of its own: 1000 px is the
      // width the earlier screenshot set in docs/screenshots/issue-10/ was taken at, and
      // the screenshots are the reason this suite exists.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1000, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run build && node .next/standalone/server.js',
    url: `http://127.0.0.1:${PORT}/ai-act-applicability-agrifood/start`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      ELSA_TREE: 'ai-act-applicability-agrifood',
      NEXT_TELEMETRY_DISABLED: '1',
      // The standalone server reads where to listen from the environment, not from flags.
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
    },
  },
})
