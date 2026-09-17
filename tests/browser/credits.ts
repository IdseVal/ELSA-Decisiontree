/**
 * Every picture a Tree shows, and whether a reader can read its credit without a click
 * (issue #55; docs/specs/application.md 12.1, 12.2). Shared by the example Tree's
 * `carousel.spec.ts` and the first Tree's `walk.spec.ts`, which each serve their own Tree.
 *
 * Not a spec file: the specs import it.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'
import type { Tree } from '../../src/tree/loader.ts'
import type { Image } from '../../src/tree/types.ts'
import { imageHref } from '../../src/url.ts'

/** One picture on a Node's page, in the Carousel's order. */
export interface Picture {
  image: Image
}

/**
 * Every Node of the Tree in `treeDir` that shows a picture, with its own Images in strip order
 * (12.1). The ids are read off the file only to enumerate; every Node comes through the loader
 * (section 7).
 */
export async function picturesByNode(tree: Tree, treeDir: string): Promise<Map<string, Picture[]>> {
  const yaml = await readFile(path.join(treeDir, 'tree.yaml'), 'utf8')
  const byNode = new Map<string, Picture[]>()
  for (const [, id] of yaml.matchAll(/^id: (\S+)$/gm)) {
    const node = await tree.getNode(id!)
    if (!node) throw new Error(`${id} cannot be read`)
    const pictures: Picture[] = node.images.map((image) => ({ image }))
    if (pictures.length > 0) byNode.set(node.id, pictures)
  }
  return byNode
}

/**
 * Opens `url` and moves along the strip with the keyboard alone -- focus on the first
 * thumbnail, then the right arrow -- asserting at each picture that the caption line a reader
 * sees holds its whole credit and, for an Option's picture, the Option's title. The page is
 * never clicked. Returns how many pictures were read.
 */
export async function readEveryCredit(page: Page, url: string, pictures: Picture[]): Promise<number> {
  await page.goto(url)
  const thumbnails = page.locator('.thumbnail')
  await expect(thumbnails, `${url}: thumbnails in the strip`).toHaveCount(pictures.length)
  await thumbnails.first().focus()
  for (const [index, { image }] of pictures.entries()) {
    const where = `${url}, picture ${index + 1} (${image.file})`
    await expect(thumbnails.nth(index), where).toBeFocused()
    await expect(thumbnails.nth(index), where).toHaveAttribute('href', imageHref(image.file))
    await expect(thumbnails.nth(index), `${where}: in view`).toBeInViewport({ ratio: 1 })
    // `useInnerText`: what a reader can read on the page, not what is in the markup.
    const caption = page.locator('.carousel-caption:visible')
    await expect(caption, where).toContainText(image.credit, { useInnerText: true })
    await page.keyboard.press('ArrowRight')
  }
  return pictures.length
}
