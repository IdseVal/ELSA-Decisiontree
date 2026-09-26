'use client'

/**
 * The enlarged view and what the Carousel does with a script (docs/specs/application.md
 * 12.3): a click, Enter or Space on the main image or a thumbnail opens the `Sheet` at that
 * picture, one picture a page with its description and its credit beneath it; the arrow keys,
 * Home and End move along the strip. Every one of them enhances markup `Carousel.tsx` and the
 * Interior already render, which link to each file and scroll on their own (section 14).
 *
 * The thumbnails are one tab stop between them, the selected one, so a keyboard reader tabs
 * past nine pictures in one step and moves among them with the arrows. The Sheet's own
 * control is what the strip collapses to below the guaranteed height (10.5, step 1): it says
 * the position of the picture it opens at, and the only place `imageCount` is still spoken.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Sheet, type SheetHandle, type SheetWords } from './Sheet.tsx'

/** One picture of the Node, its texts already in the content language. */
export interface EnlargedImage {
  /** The image route's URL for the file, `/images/<file>` (5.3). */
  href: string
  description: string
  credit: string
}

export function EnlargedView({
  images,
  counts,
  credit,
  sheetWords,
  uiLang,
  captions,
}: {
  /** The Node's Images in the author's order: the main image first. */
  images: EnlargedImage[]
  /** `imageCount` for each Image in turn: the chrome function, already called (3.2). */
  counts: string[]
  /** The chrome word before a credit; a string, because a client component takes no module. */
  credit: string
  sheetWords: SheetWords
  /** Set when the chrome speaks another language than the content around it. */
  uiLang: string | undefined
  /**
   * **[#138]** In edit mode, per Image: the caption as the editor draws it -- the description
   * and the credit as fields, and the controls of #140 -- or null for the public caption. The
   * Carousel, a server component, calls the slots of 34.2 and hands the elements in.
   */
  captions?: (ReactNode | null)[]
}) {
  const anchor = useRef<HTMLSpanElement>(null)
  const sheet = useRef<SheetHandle>(null)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    // The frame holds the main image in the Bubble and the strip in its band: one listener for both.
    const frame = anchor.current?.closest<HTMLElement>('.tree-frame')
    if (!frame) return
    const strip = frame.querySelector<HTMLElement>('[data-carousel-strip]')
    const thumbnails = strip ? [...strip.querySelectorAll<HTMLAnchorElement>('.thumbnail')] : []
    // The selected thumbnail is the strip's tab stop now; the strip itself stays focusable.
    if (strip) strip.tabIndex = -1

    const pageOf = (target: EventTarget | null): number => {
      const link = target instanceof Element ? target.closest<HTMLAnchorElement>('a[data-enlarge]') : null
      return link && frame.contains(link) ? Number(link.dataset.enlarge) : -1
    }

    const onClick = (event: MouseEvent): void => {
      const page = pageOf(event.target)
      // A modified click still opens the file the way the reader asked for.
      if (page < 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      setSelected(page)
      sheet.current?.open(page)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      const page = pageOf(event.target)
      if (page < 0) return
      // Enter is the link's own click; Space is not, and would otherwise scroll nothing here.
      if (event.key === ' ') {
        event.preventDefault()
        setSelected(page)
        sheet.current?.open(page)
        return
      }
      const index = thumbnails.indexOf(event.target as HTMLAnchorElement)
      if (index < 0) return
      const to =
        event.key === 'ArrowLeft' ? index - 1
        : event.key === 'ArrowRight' ? index + 1
        : event.key === 'Home' ? 0
        : event.key === 'End' ? thumbnails.length - 1
        : null
      if (to === null) return
      event.preventDefault()
      const clamped = Math.min(Math.max(to, 0), thumbnails.length - 1)
      move(thumbnails, clamped)
      setSelected(clamped + 1)
    }

    const onFocusIn = (event: FocusEvent): void => {
      const index = thumbnails.indexOf(event.target as HTMLAnchorElement)
      if (index < 0) return
      thumbnails.forEach((thumbnail, at) => (thumbnail.tabIndex = at === index ? 0 : -1))
      setSelected(index + 1)
    }

    thumbnails.forEach((thumbnail, index) => (thumbnail.tabIndex = index === 0 ? 0 : -1))
    frame.addEventListener('click', onClick)
    frame.addEventListener('keydown', onKeyDown)
    frame.addEventListener('focusin', onFocusIn)
    return () => {
      frame.removeEventListener('click', onClick)
      frame.removeEventListener('keydown', onKeyDown)
      frame.removeEventListener('focusin', onFocusIn)
    }
  }, [])

  return (
    <>
      <span ref={anchor} hidden />
      <Sheet
        ref={sheet}
        className="carousel-sheet"
        summary={<span lang={uiLang}>{counts[selected]}</span>}
        pages={images.map((image, index) => (
          <figure className="sheet-figure" key={index}>
            <img src={image.href} alt={image.description} loading="lazy" />
            <figcaption>
              {captions?.[index] ?? (
                <>
                  <p>{image.description}</p>
                  <p className="credit">
                    <span className="kind" lang={uiLang}>
                      {credit}
                    </span>{' '}
                    {image.credit}
                  </p>
                </>
              )}
            </figcaption>
          </figure>
        ))}
        words={sheetWords}
        uiLang={uiLang}
        startPage={selected}
        onPage={setSelected}
      />
    </>
  )
}

/**
 * Focuses thumbnail `to`, scrolling the strip -- and
 * nothing else -- until it is in view: `scrollIntoView` would scroll every scrollable
 * ancestor too, the document included, and the document is the one thing that may never
 * scroll (10.6).
 */
function move(thumbnails: HTMLAnchorElement[], to: number): void {
  const target = thumbnails[to]
  const strip = target?.closest<HTMLElement>('[data-carousel-strip]')
  if (!target || !strip) return
  // The tab stop follows in the focus handler.
  target.focus({ preventScroll: true })
  const shown = strip.getBoundingClientRect()
  const box = target.getBoundingClientRect()
  if (box.left < shown.left) strip.scrollBy({ left: box.left - shown.left })
  else if (box.right > shown.right) strip.scrollBy({ left: box.right - shown.right })
}
