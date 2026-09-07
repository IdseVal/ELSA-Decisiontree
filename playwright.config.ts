import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests (`npm run test:browser`). docs/specs/application.md section 7 leaves these
 * to a later issue; issue #7 is that issue, because what a thumbnail does when it is
 * clicked and which files a browser actually asks for cannot be checked from markup alone.
 *
 * The server under test is the standalone server a deployment runs (`npm run build` then
 * `node .next/standalone/server.js`), serving the example Tree, so what the tests see is
 * what a deployment serves. `npm test` (Vitest) stays the unit suite.
 */
const PORT = Number(process.env.ELSA_TEST_PORT ?? 3117)

/**
 * A second server of the same build, started with no public base URL: the default
 * deployment of docs/deployment.md, where the canonical link stays a path. Only
 * tests/browser/deployment.spec.ts asks it anything.
 */
export const NO_BASE_URL_ORIGIN = `http://127.0.0.1:${PORT + 1}`

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
  // Started in order, each waited for: the first is the one that builds, the second runs
  // the build it left behind.
  webServer: [
    {
      command: 'npm run build && node .next/standalone/server.js',
      url: `http://127.0.0.1:${PORT}/ai-act-example/start`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: {
        ELSA_TREE: 'ai-act-example',
        NEXT_TELEMETRY_DISABLED: '1',
        // The standalone server reads where to listen from the environment, not from flags.
        PORT: String(PORT),
        HOSTNAME: '127.0.0.1',
        // The address a deployment is reached at, which is not the address it listens on
        // (docs/deployment.md). tests/browser/deployment.spec.ts reads it back out of the
        // canonical link.
        ELSA_BASE_URL: 'https://elsa.example.org',
      },
    },
    {
      command: 'node .next/standalone/server.js',
      url: `${NO_BASE_URL_ORIGIN}/ai-act-example/start`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        ELSA_TREE: 'ai-act-example',
        NEXT_TELEMETRY_DISABLED: '1',
        PORT: String(PORT + 1),
        HOSTNAME: '127.0.0.1',
        // Empty rather than absent: the variable is inherited from whoever runs the suite,
        // and this server is here precisely to be the one that was given no address.
        ELSA_BASE_URL: '',
      },
    },
  ],
})
