'use client'

/**
 * The Node's Images as plain thumbnails -- no frame, arrows or dots (core document 10.6).
 * Clicking one shows the same file larger, with its description and credit.
 *
 * Each thumbnail is a link to the image file, so without JavaScript clicking it opens the
 * file; with JavaScript the click is intercepted and the image is shown in place
 * (docs/specs/application.md 5.3). The enlarged view is a native `<dialog>`: Escape, the
 * focus trap and returning focus to the thumbnail are the browser's, not ours.
 */
import { useEffect, useRef, useState } from 'react'
import type { Chrome } from '../chrome.ts'
import type { Image } from '../tree/types.ts'
import { imageHref } from '../url.ts'
import { text } from './NodeView.tsx'

export function Thumbnails({
  images,
  lang,
  ui,
  uiLang,
}: {
  images: Image[]
  lang: string
  ui: Chrome
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
}) {
  const [shown, setShown] = useState<Image | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (shown) dialog.current?.showModal()
    else dialog.current?.close()
  }, [shown])

  return (
    <section className="images" aria-label={ui.images}>
      <ul>
        {images.map((image) => (
          <li key={image.file}>
            <a
              className="thumbnail"
              href={imageHref(image.file)}
              aria-label={`${ui.enlarge}: ${text(image.description, lang)}`}
              onClick={(event) => {
                // A modified click still opens the file the way the reader asked for.
                if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                setShown(image)
              }}
            >
              <img src={imageHref(image.file)} alt={text(image.description, lang)} loading="lazy" />
            </a>
          </li>
        ))}
      </ul>

      <dialog
        className="enlarged"
        ref={dialog}
        onClose={() => setShown(null)}
        onClick={(event) => {
          if (event.target === dialog.current) setShown(null)
        }}
      >
        {shown && (
          <figure>
            <img src={imageHref(shown.file)} alt={text(shown.description, lang)} />
            <figcaption>
              <p>{text(shown.description, lang)}</p>
              <p className="credit">
                <span className="kind" lang={uiLang}>
                  {ui.credit}
                </span>{' '}
                {shown.credit}
              </p>
            </figcaption>
          </figure>
        )}
        <form method="dialog">
          <button className="close" lang={uiLang}>
            {ui.close}
          </button>
        </form>
      </dialog>
    </section>
  )
}
