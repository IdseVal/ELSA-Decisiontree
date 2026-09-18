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

/**
 * Presses Escape on a page that arrived with its Overlay open (10.9), once the script is
 * there to hear it. `goto` resolves on the page's `load` event, and the Sheets are hydrated
 * after it -- about 50 ms after, measured at a quarter of a desktop's speed, which is a CI
 * runner's -- so an Escape pressed at once can fall before anything listens, and is lost:
 * the cross, Escape and the click outside need the script (10.9). The backdrop is drawn by
 * the render that the commit attaching the Escape listener asks for, so it is never there
 * before the listener is.
 */
export async function escapeUrlOpened(page: Page): Promise<void> {
  await expect(page.locator('details.sheet[open] > .sheet-backdrop')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(page.locator('details.sheet[open]')).toHaveCount(0)
}

/** Resolves once the page is at `url` and its tree layer is at rest. */
export async function arrived(page: Page, url: string | RegExp): Promise<void> {
  await expect(page).toHaveURL(url)
  await expect(page.locator('.tree-layer[data-sliding]')).toHaveCount(0)
}
