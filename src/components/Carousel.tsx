/**
 * The Carousel (docs/specs/application.md section 12, ADR-78-carousel): a strip of 48-pixel
 * round thumbnails straddling the Bubble's lower outline, holding the Node's Images after the
 * main one in the author's order. Pictures only: no buttons, no position text, nothing
 * written under them. A picture's description is its alternative text and its credit its
 * accessible description; both are shown, whole, in the enlarged view.
 *
 * Everything that works without JavaScript is here, in markup (section 14): the strip is a
 * focusable native scroll container, each thumbnail is a link to its file, and the enlarged
 * view is a `Sheet` whose control -- what the strip collapses to below the guaranteed height
 * (10.5, step 1) -- a `<noscript>` stylesheet shows at every size, so every credit is one
 * disclosure away. `EnlargedView` adds what needs a script.
 *
 * The component sits in the strip band on every Node; it is empty where the Node has no
 * Image, and has no strip where it has one, so the Bubble never moves.
 *
 * **[#138]** With `edit` (34.1) the pictures come from `edit.links`, the `stripAdd` slot is
 * drawn in the band, and each picture's caption in the enlarged view is built from the
 * `field` and `enlargedControls` slots where they answer; absent, nothing differs.
 */
import type { ReactNode } from 'react'
import { text, type Chrome } from '../chrome.ts'
import type { EditMode } from '../editor/mode.ts'
import type { NodeContent } from '../tree/types.ts'
import { PUBLIC_LINKS } from '../url.ts'
import { sheetWords } from './Bubble.tsx'
import { EnlargedView, type EnlargedImage } from './EnlargedView.tsx'

/**
 * Without a script a thumbnail cannot open the enlarged view in place, so its control shows
 * beside the strip at every size (section 14, 12.3).
 */
const NO_SCRIPT = '.carousel-sheet > .sheet-open { display: block; }'

/** The maximum lengths of tree-format.md 5.7 an Image's texts are counted against (28.1). */
const LIMIT = { description: { characters: 120 }, credit: { characters: 120 } } as const

/** The Carousel's band: the strip and the enlarged view, or an empty band where the Node has no Image. */
export function Carousel({
  node,
  treeId,
  lang,
  ui,
  uiLang,
  edit,
}: {
  node: NodeContent
  /** The Tree the Node is of: its pictures are under its id (application.md 18.1). */
  treeId: string
  lang: string
  ui: Chrome
  uiLang: string | undefined
  /** Edit mode (34.1); absent on every public page. */
  edit?: EditMode
}) {
  const links = edit?.links ?? PUBLIC_LINKS
  const images: EnlargedImage[] = node.images.map((image) => ({
    href: links.image(treeId, image.file),
    description: text(image.description, lang, `${node.id}.images[${image.file}].description`),
    credit: image.credit,
  }))
  if (images.length === 0) return <div className="carousel">{edit?.slots.stripAdd?.(node)}</div>
  const strip = images.slice(1)
  const captions = edit && editedCaptions(node, lang, ui, uiLang, edit)

  return (
    // Unnamed: the strip inside is the region 12.3 names, and naming both says "Images" twice.
    <section className="carousel">
      {strip.length > 0 && (
        <>
          {/* Hidden, not clipped: read as names all the same, and never wider than themselves (10.6). */}
          <span hidden id="images-label" lang={uiLang}>
            {ui.images}
          </span>
          <span hidden id="carousel-enlarge" lang={uiLang}>
            {ui.enlarge}
          </span>
          {/* A tab stop, so that without the script the arrow keys scroll it (12.2); the script moves the stop to the selected thumbnail. */}
          <ul className="carousel-strip" tabIndex={0} aria-labelledby="images-label" data-carousel-strip="">
            {strip.map((image, index) => (
              <li key={index}>
                <span hidden id={`carousel-credit-${index}`}>
                  {image.credit}
                </span>
                {/* `data-enlarge` is the page of the enlarged view: the main image is page 0. */}
                <a
                  className="thumbnail"
                  href={image.href}
                  data-enlarge={index + 1}
                  aria-labelledby={`carousel-enlarge carousel-image-${index}`}
                  aria-describedby={`carousel-credit-${index}`}
                >
                  <img id={`carousel-image-${index}`} src={image.href} alt={image.description} width={48} height={48} loading="lazy" />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      {edit?.slots.stripAdd?.(node)}
      <EnlargedView
        images={images}
        counts={images.map((_, index) => ui.imageCount(index + 1, images.length))}
        credit={ui.credit}
        sheetWords={sheetWords(ui)}
        uiLang={uiLang}
        captions={captions?.some((caption) => caption !== null) ? captions : undefined}
      />
      <noscript>
        <style>{NO_SCRIPT}</style>
      </noscript>
    </section>
  )
}

/**
 * The enlarged view's captions in edit mode (28.1, 31.3): per Image, its description and its
 * credit as fields and the controls of #140 under them -- or null where no slot answers, so
 * the public caption stands.
 */
function editedCaptions(node: NodeContent, lang: string, ui: Chrome, uiLang: string | undefined, edit: EditMode): (ReactNode | null)[] {
  const { field, enlargedControls } = edit.slots
  return node.images.map((image, index) => {
    const at = `images[${index}]`
    const description = field?.(node, `${at}.description`, image.description[lang] ?? '', LIMIT.description) ?? null
    const credit = field?.(node, `${at}.credit`, image.credit, LIMIT.credit) ?? null
    const controls = enlargedControls?.(node, index) ?? null
    if (description === null && credit === null && controls === null) return null
    return (
      <>
        <p>{description ?? text(image.description, lang, `${node.id}.images[${image.file}].description`)}</p>
        <p className="credit">
          <span className="kind" lang={uiLang}>
            {ui.credit}
          </span>{' '}
          {credit ?? image.credit}
        </p>
        {controls}
      </>
    )
  })
}
