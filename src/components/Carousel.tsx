/**
 * The Carousel (docs/specs/application.md section 12, ADR-38-carousel): the 80-pixel row
 * under the Bubble, holding this Node's own Images in the author's order as a native
 * scroll-snap strip of thumbnails, with the selected Image's description and credit on one
 * caption line beneath it.
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
import { CarouselButtons } from './CarouselButtons.tsx'

/**
 * How many characters the caption line holds (12.2): about 1230 pixels at the guaranteed
 * viewport and, below it, the 728 left beside the page margins at the narrowest width the
 * strip is shown at (792), each at tree-format.md 5.7's 13-pixel advance of 7.24 pixels.
 */
const CAPTION_WIDE = 170
const CAPTION_NARROW = 100

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

export function Carousel({ node, lang, ui, uiLang }: { node: Node; lang: string; ui: Chrome; uiLang: string | undefined }) {
  const images = node.images.map((image) => ({
    href: imageHref(image.file),
    description: text(image.description, lang, `${node.id}.images[${image.file}].description`),
    credit: image.credit,
  }))
  // A credit longer than the narrow line gives the row up to its collapsed control below
  // the guaranteed width, rather than being cut or pushed out of its box (12.2, 10.5 step 2).
  const longCredit = images.some((image) => image.credit.length > CAPTION_NARROW - SEPARATOR.length)

  return (
    <section className="carousel" aria-labelledby="images-label" data-long-credit={longCredit ? '' : undefined}>
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
          <li key={image.href}>
            <a
              className="thumbnail"
              href={image.href}
              aria-labelledby={`carousel-enlarge carousel-image-${index}`}
              aria-describedby={`carousel-credit-${index}`}
            >
              <img id={`carousel-image-${index}`} src={image.href} alt={image.description} width={80} height={60} loading="lazy" />
            </a>
            <p className="carousel-caption">
              {/* The whole description is the thumbnail's name already; the shortened copy is for the eye. */}
              {[CAPTION_WIDE, CAPTION_NARROW].map((budget) => {
                const description = captionDescription(image.description, image.credit, budget)
                return (
                  <span key={budget} className={budget === CAPTION_WIDE ? 'caption-wide' : 'caption-narrow'}>
                    {description && (
                      <span aria-hidden="true">
                        {description}
                        {SEPARATOR}
                      </span>
                    )}
                    <span id={budget === CAPTION_WIDE ? `carousel-credit-${index}` : undefined}>{image.credit}</span>
                  </span>
                )
              })}
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
