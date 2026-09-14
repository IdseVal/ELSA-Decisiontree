/**
 * The Carousel (docs/specs/application.md section 12, ADR-38-carousel): the 80-pixel row
 * under the Bubble, holding this Node's own Images in the author's order and then its
 * Options' pictures as a native scroll-snap strip of thumbnails, with the selected Image's
 * description and credit on one caption line beneath it.
 *
 * Everything that works without JavaScript is here, in markup (section 14): the strip is a
 * focusable scroll container, each thumbnail is a link to its file, and each Image carries its own
 * caption, which the stylesheet shows for the selected Image -- the first, or the one the
 * keyboard is on. `CarouselButtons` adds what needs a script: the previous and next buttons,
 * the position, the arrow keys, and the enlarged view in the one `Sheet`.
 *
 * The caption is shortened here, on the server, and not with `text-overflow`: an ellipsis
 * painted over text that still overflows its box is exactly what the no-scroll test of 10.6
 * measures and forbids (12.2). The credit is never cut; the description gives way.
 */
import { text, type Chrome } from '../chrome.ts'
import type { Node } from '../tree/types.ts'
import { imageHref } from '../url.ts'
import { sheetWords } from './Bubble.tsx'
import { CarouselButtons, type CarouselImage } from './CarouselButtons.tsx'

/**
 * How many characters the caption line holds (12.2): about 1230 pixels at the guaranteed
 * viewport and, below it, the 896 left beside the page margins at the narrowest width the
 * strip is shown at (960), each at tree-format.md 5.7's 13-pixel advance of 7.24 pixels.
 * The narrow line is a 120-character credit and its separator exactly, so every credit the
 * format allows is whole on it; the description may have no room left there.
 */
const CAPTION_WIDE = 170
const CAPTION_NARROW = 123

/** Between the description and the credit on the caption line. */
const SEPARATOR = ' — '

/**
 * The description as far as the caption line holds it beside the whole credit: whole when
 * it fits, otherwise cut with an ellipsis, and left out when not even a word would fit.
 */
export function captionDescription(description: string, credit: string, budget: number): string {
  const room = budget - credit.length - SEPARATOR.length
  if (description.length <= room) return description
  if (room < 12) return ''
  return `${description.slice(0, room - 1).trimEnd()}…`
}

/**
 * What the strip holds (12.1): this Node's own Images in the author's order, then the picture
 * each Option's Branch shows, in Option order. An Option's caption names the Option first, so
 * a reader can tell which Branch a picture and its credit belong to.
 */
function carouselImages(node: Node, lang: string): CarouselImage[] {
  const own = node.images.map((image) => {
    const description = text(image.description, lang, `${node.id}.images[${image.file}].description`)
    return { href: imageHref(image.file), description, caption: description, credit: image.credit }
  })
  const options = node.options.flatMap((option, index) => {
    const image = option.images[0]
    if (!image) return []
    const where = `${node.id}.options[${index}]`
    const description = text(image.description, lang, `${where}.images[${image.file}].description`)
    const caption = `${text(option.title, lang, `${where}.title`)}: ${description}`
    return [{ href: imageHref(image.file), description, caption, credit: image.credit }]
  })
  return [...own, ...options]
}

/** The Carousel row: the strip and its controls, or the empty row where nothing on the Node has a picture. */
export function Carousel({ node, lang, ui, uiLang }: { node: Node; lang: string; ui: Chrome; uiLang: string | undefined }) {
  const images = carouselImages(node, lang)
  if (images.length === 0) return <div className="carousel" />

  return (
    // Unnamed: the strip inside is the region 12.3 names, and naming both says "Images" twice.
    <section className="carousel">
      {/* Hidden, not clipped: read as names all the same, and never wider than themselves (10.6). */}
      <span hidden id="images-label" lang={uiLang}>
        {ui.images}
      </span>
      <span hidden id="carousel-enlarge" lang={uiLang}>
        {ui.enlarge}
      </span>
      {/* A tab stop, so that without the script the arrow keys scroll it (12.2); the script moves the stop to the selected thumbnail. */}
      <ul className="carousel-strip" tabIndex={0} aria-labelledby="images-label" data-carousel-strip="">
        {images.map((image, index) => (
          // By position: an Option may show a file the Node shows too.
          <li key={index}>
            <a
              className="thumbnail"
              href={image.href}
              aria-labelledby={`carousel-enlarge carousel-image-${index}`}
              aria-describedby={`carousel-credit-${index}`}
            >
              {/* The caption's words, not the description alone: an Option's picture is named with its Option, which the caption line may cut and hides from assistive technology (12.1). */}
              <img id={`carousel-image-${index}`} src={image.href} alt={image.caption} width={80} height={60} loading="lazy" />
            </a>
            <p className="carousel-caption">
              <span className="caption-wide">
                <ShortDescription image={image} budget={CAPTION_WIDE} />
                <span id={`carousel-credit-${index}`}>{image.credit}</span>
              </span>
              <span className="caption-narrow">
                <ShortDescription image={image} budget={CAPTION_NARROW} />
                <span>{image.credit}</span>
              </span>
            </p>
          </li>
        ))}
      </ul>
      <CarouselButtons
        images={images}
        counts={images.map((_, index) => ui.imageCount(index + 1, images.length))}
        words={{ previous: ui.previous, next: ui.next, credit: ui.credit }}
        sheetWords={sheetWords(ui)}
        uiLang={uiLang}
      />
    </section>
  )
}

/**
 * The caption's text and separator in front of its credit, as far as `budget` holds them;
 * nothing when no word fits. The whole caption text -- an Option's title included -- is the
 * thumbnail's name already, so the shortened copy is for the eye and hidden from assistive
 * technology.
 */
function ShortDescription({ image, budget }: { image: CarouselImage; budget: number }) {
  const description = captionDescription(image.caption, image.credit, budget)
  return description ? (
    <span aria-hidden="true">
      {description}
      {SEPARATOR}
    </span>
  ) : null
}
