'use client'

/**
 * The Node's own Images in the Carousel's row, until issue #43 draws the Carousel: plain
 * thumbnails in the strip's place, each opening the enlarged view with the Image's
 * description and credit (docs/specs/application.md 12.3). No paging, no caption line, no
 * transitions -- this is what version 0.1 showed, kept alive so that no picture and no
 * credit (`tree-format.md` 5.2; several are CC BY) is out of a reader's reach between this
 * issue and #43 (the owner, PR #56).
 *
 * Each thumbnail is a link to the image file, so without JavaScript clicking it opens the
 * file (section 14); with JavaScript the click is intercepted and the Image is shown in
 * place. The enlarged view is a native `<dialog>`: Escape, the focus trap and returning
 * focus to the thumbnail are the browser's, not ours.
 */
import { useEffect, useRef, useState } from 'react'

/** One of the Node's Images, its texts already in the content language. */
export interface Thumbnail {
  /** The image route's URL for the file, `/images/<file>` (5.3). */
  href: string
  description: string
  credit: string
}

/** The chrome words the thumbnails say; strings, because a client component takes no module. */
export interface ThumbnailWords {
  images: string
  enlarge: string
  close: string
  credit: string
}

export function Thumbnails({
  images,
  words,
  uiLang,
}: {
  images: Thumbnail[]
  words: ThumbnailWords
  /** Set when the chrome speaks another language than the content around it. */
  uiLang: string | undefined
}) {
  const [shown, setShown] = useState<Thumbnail | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (shown) dialog.current?.showModal()
    else dialog.current?.close()
  }, [shown])

  return (
    <section className="images" aria-labelledby="images-label">
      {/* Hidden, not clipped: read as the region's name all the same, and never wider than itself (10.6). */}
      <span hidden id="images-label" lang={uiLang}>
        {words.images}
      </span>
      <ul>
        {images.map((image) => (
          <li key={image.href}>
            <a
              className="thumbnail"
              href={image.href}
              aria-label={`${words.enlarge}: ${image.description}`}
              onClick={(event) => {
                // A modified click still opens the file the way the reader asked for.
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                setShown(image)
              }}
            >
              <img src={image.href} alt={image.description} width={60} height={60} loading="lazy" />
            </a>
          </li>
        ))}
      </ul>

      <dialog
        className="enlarged"
        // The Image's own description names the dialog; without it the overlay is announced
        // as a bare "dialog".
        aria-labelledby="enlarged-description"
        ref={dialog}
        onClose={() => setShown(null)}
        onClick={(event) => {
          if (event.target === dialog.current) setShown(null)
        }}
      >
        {shown && (
          <figure>
            <img src={shown.href} alt={shown.description} />
            <figcaption>
              <p id="enlarged-description">{shown.description}</p>
              <p className="credit">
                <span className="kind" lang={uiLang}>
                  {words.credit}
                </span>{' '}
                {shown.credit}
              </p>
            </figcaption>
          </figure>
        )}
        <form method="dialog">
          <button className="close" lang={uiLang}>
            {words.close}
          </button>
        </form>
      </dialog>
    </section>
  )
}
