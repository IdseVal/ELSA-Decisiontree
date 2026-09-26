// A temporary config for the specs that start their own server: no webServer, so a run
// does not rebuild the app first. Not committed.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '../tests/browser',
  outputDir: '../tests/browser/.results',
  workers: 1,
  reporter: 'line',
  use: { trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
