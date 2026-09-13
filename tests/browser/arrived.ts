/**
 * Waiting for a Node page the way a reader does: at its URL, and done moving.
 *
 * Following a Branch slides the tree layer (docs/specs/application.md 11.3). The address
 * bar changes when the target's page arrives, and the arriving page then finishes the slide
 * with the page it replaced drawn beside it for a moment -- an inert, `aria-hidden` copy with
 * the same classes. A test that looks the page up by class in that moment finds both, so the
 * browser specs wait for the slide to end before they read or click anything.
 */
import { expect, type Page } from '@playwright/test'

/** Resolves once the page is at `url` and its tree layer is at rest. */
export async function arrived(page: Page, url: string | RegExp): Promise<void> {
  await expect(page).toHaveURL(url)
  await expect(page.locator('.tree-layer[data-sliding]')).toHaveCount(0)
}
