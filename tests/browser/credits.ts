/**
 * Every picture a Node shows, and whether a reader reaches its credit where
 * docs/specs/application.md 12.2 and 12.3 now put it (ADR-78-carousel, decision 5): whole in
 * the enlarged view, and as the picture's accessible description. Shared by the example
 * Tree's `carousel.spec.ts` and the first Tree's `walk.spec.ts`, which each serve their own
 * Tree.
 *
 * An Option's picture is not here: it is its target's main image, credited in the target's
 * Overlay (12.1), which #80 builds.
 *
 * Not a spec file: the specs import it.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'
import type { Tree } from '../../src/tree/loader.ts'
import type { Image } from '../../src/tree/types.ts'
import { imageHref } from '../../src/url.ts'

/**
 * Every Node of the Tree in `treeDir` that has an Image, with its Images in the author's
 * order: the main image, then the strip's (12.1). The ids are read off the file only to
 * enumerate; every Node comes through the loader (section 7).
 */
export async function picturesByNode(tree: Tree, treeDir: string): Promise<Map<string, Image[]>> {
  const file = JSON.parse(await readFile(path.join(treeDir, 'tree.json'), 'utf8')) as { nodes: Array<{ id: string }> }
  const byNode = new Map<string, Image[]>()
  for (const { id } of file.nodes) {
    const node = await tree.getNode(id)
    if (!node) throw new Error(`${id} cannot be read`)
    if (node.images.length > 0) byNode.set(node.id, node.images)
  }
  return byNode
}

/**
 * Opens `url` and reads every credit with the keyboard alone. First as assistive technology
 * hears it: the main image and each thumbnail link to their file and are described by their
 * credit. Then as the eye reads it: Enter on the main image opens the enlarged view, which
 * shows the credit whole beneath each picture, and its `next` turns to the following one.
 * The page is never clicked. Returns how many credits were read on screen.
 */
export async function readEveryCredit(page: Page, url: string, images: Image[]): Promise<number> {
  await page.goto(url)
  // The Tree's pictures are under its id (application.md 18.1): the first segment of the path.
  const treeId = new URL(url, 'http://localhost').pathname.split('/')[1]!
  const [main, ...strip] = images
  const mainImage = page.locator('.bubble a.main-image')
  await expect(mainImage, `${url}: the main image`).toHaveAttribute('href', imageHref(treeId, main!.file))
  await expect(mainImage, `${url}: the main image's credit`).toHaveAccessibleDescription(main!.credit)

  const thumbnails = page.locator('.thumbnail')
  await expect(thumbnails, `${url}: thumbnails in the strip`).toHaveCount(strip.length)
  for (const [index, image] of strip.entries()) {
    const where = `${url}, thumbnail ${index + 1} (${image.file})`
    await expect(thumbnails.nth(index), where).toHaveAttribute('href', imageHref(treeId, image.file))
    await expect(thumbnails.nth(index), where).toHaveAccessibleDescription(image.credit)
  }

  await mainImage.focus()
  await page.keyboard.press('Enter')
  const panel = page.locator('.carousel-sheet .sheet-panel')
  for (const [index, image] of images.entries()) {
    const where = `${url}, enlarged picture ${index + 1} (${image.file})`
    await expect(panel.locator('.sheet-figure img'), where).toHaveAttribute('src', imageHref(treeId, image.file))
    // `useInnerText`: what a reader can read on the page, not what is in the markup.
    await expect(panel.locator('.credit'), where).toContainText(image.credit, { useInnerText: true })
    await expect(panel.locator('.credit'), `${where}: in view`).toBeInViewport({ ratio: 1 })
    if (index < images.length - 1) await panel.locator('.sheet-controls button').nth(1).press('Enter')
  }
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(mainImage, `${url}: the focus is back on the main image`).toBeFocused()
  return images.length
}
