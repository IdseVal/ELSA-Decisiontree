import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests (`npm run test:browser`). docs/specs/application.md section 7 leaves these
 * to a later issue; issue #7 is that issue, because what a thumbnail does when it is
 * clicked and which files a browser actually asks for cannot be checked from markup alone.
 *
 * The server under test is a production build serving the example Tree, so what the tests
 * see is what a deployment serves. `npm test` (Vitest) stays the unit suite.
 */
const PORT = Number(process.env.ELSA_TEST_PORT ?? 3117)

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './tests/browser/.results',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : 'line',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next build && npx next start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/ai-act-example/start`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { ELSA_TREE: 'ai-act-example', NEXT_TELEMETRY_DISABLED: '1' },
  },
})
