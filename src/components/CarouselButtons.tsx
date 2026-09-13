'use client'

/**
 * What the Carousel does with a script (docs/specs/application.md 12.3): the previous and
 * next buttons, the position, the keyboard, and the enlarged view. Every one of them is an
 * enhancement of the strip `Carousel.tsx` already renders, which scrolls, links to each
 * file and shows the selected Image's caption on its own (section 14).
 *
 * The scroll position is the strip's, not this component's: previous and next scroll the
 * strip by one page and are disabled at its ends. What this component keeps is which Image
 * is selected -- the one the caption, the position and Enter are about -- and it moves with
 * the arrow keys, with Home and End, with a click, and with the page the buttons turn to.
 * The strip's thumbnails are one tab stop between them, the selected one, so a keyboard
 * reader tabs past ten pictures in one step and moves among them with the arrows.
 *
 * The enlarged view is the `Sheet` every other overlay is. Below the guaranteed viewport the
 * row collapses to the Sheet's own control, which says the position (10.5, step 2).
 */
import { useEffect, useRef, useState } from 'react'
import { Sheet, type SheetHandle, type SheetWords } from './Sheet.tsx'

/** One of the Node's Images, its description already in the content language. */
export interface CarouselImage {
  /** The image route's URL for the file, `/images/<file>` (5.3). */
  href: string
  description: string
  credit: string
}

/** The chrome words the controls say; strings, because a client component takes no module. */
export interface CarouselWords {
  previous: string
  next: string
  credit: string
}

export function CarouselButtons({
  images,
  counts,
  words,
  sheetWords,
  uiLang,
}: {
  images: CarouselImage[]
  /** `imageCount` for each Image in turn: the chrome function, already called (3.2). */
  counts: string[]
  words: CarouselWords
  sheetWords: SheetWords
  /** Set when the chrome speaks another language than the content around it. */
  uiLang: string | undefined
}) {
  const controls = useRef<HTMLDivElement>(null)
  const sheet = useRef<SheetHandle>(null)
  const [selected, setSelected] = useState(0)
  const [ends, setEnds] = useState({ start: true, end: true })
  const [enhanced, setEnhanced] = useState(false)
  const turning = useRef(false)

  /** The strip this component enhances, and its thumbnails in order. */
  const strip = (): { element: HTMLElement; thumbnails: HTMLAnchorElement[] } | null => {
    const element = controls.current?.closest('.carousel')?.querySelector<HTMLElement>('[data-carousel-strip]')
    return element ? { element, thumbnails: [...element.querySelectorAll<HTMLAnchorElement>('.thumbnail')] } : null
  }

  useEffect(() => {
    setEnhanced(true)
    const found = strip()
    if (!found) return
    const { element, thumbnails } = found
    const indexOf = (target: EventTarget | null): number => {
      const thumbnail = target instanceof Element ? target.closest<HTMLAnchorElement>('.thumbnail') : null
      return thumbnail ? thumbnails.indexOf(thumbnail) : -1
    }

    const measureEnds = (): void =>
      setEnds({
        start: element.scrollLeft <= 1,
        end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
      })

    const onClick = (event: MouseEvent): void => {
      const index = indexOf(event.target)
      // A modified click still opens the file the way the reader asked for.
      if (index < 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      setSelected(index)
      sheet.current?.open(index)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      const index = indexOf(event.target)
      if (index < 0) return
      const to =
        event.key === 'ArrowLeft' ? index - 1
        : event.key === 'ArrowRight' ? index + 1
        : event.key === 'Home' ? 0
        : event.key === 'End' ? thumbnails.length - 1
        : null
      if (to !== null) {
        event.preventDefault()
        const clamped = Math.min(Math.max(to, 0), thumbnails.length - 1)
        setSelected(clamped)
        thumbnails[clamped]!.focus({ preventScroll: true })
      } else if (event.key === ' ') {
        // Enter is the link's own click; Space is not, and would otherwise do nothing here.
        event.preventDefault()
        sheet.current?.open(index)
      }
    }

    const onFocusIn = (event: FocusEvent): void => {
      const index = indexOf(event.target)
      if (index >= 0) setSelected(index)
    }

    measureEnds()
    const resized = new ResizeObserver(measureEnds)
    resized.observe(element)
    element.addEventListener('scroll', measureEnds, { passive: true })
    element.addEventListener('click', onClick)
    element.addEventListener('keydown', onKeyDown)
    element.addEventListener('focusin', onFocusIn)
    return () => {
      resized.disconnect()
      element.removeEventListener('scroll', measureEnds)
      element.removeEventListener('click', onClick)
      element.removeEventListener('keydown', onKeyDown)
      element.removeEventListener('focusin', onFocusIn)
    }
  }, [])

  // The selection, drawn on the strip: the one tab stop, the caption the stylesheet shows,
  // and the thumbnail scrolled into the strip's view if it was not.
  useEffect(() => {
    const found = strip()
    if (!found) return
    const { element, thumbnails } = found
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.tabIndex = index === selected ? 0 : -1
      thumbnail.parentElement?.toggleAttribute('data-selected', index === selected)
    })
    const item = thumbnails[selected]?.parentElement
    // A page turn has already scrolled the strip to where the selection is going.
    if (!item || turning.current) {
      turning.current = false
      return
    }
    const shown = element.getBoundingClientRect()
    const box = item.getBoundingClientRect()
    // `scrollIntoView` would scroll every scrollable ancestor too, the document included,
    // and the document is the one thing that may never scroll (10.6).
    if (box.left < shown.left) element.scrollBy({ left: box.left - shown.left })
    else if (box.right > shown.right) element.scrollBy({ left: box.right - shown.right })
  }, [selected])

  /** Scrolls the strip one page towards `direction` and selects the first Image that page brings into view. */
  const turn = (direction: -1 | 1): void => {
    const found = strip()
    if (!found) return
    const { element, thumbnails } = found
    const shown = element.getBoundingClientRect()
    const hidden = thumbnails.map((thumbnail) => thumbnail.getBoundingClientRect())
    const next =
      direction === 1
        ? hidden.findIndex((box) => box.right > shown.right + 1)
        : hidden.findLastIndex((box) => box.left < shown.left - 1)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollBy({ left: direction * element.clientWidth, behavior: still ? 'instant' : 'smooth' })
    if (next >= 0 && next !== selected) {
      turning.current = true
      setSelected(next)
    }
  }

  return (
    <>
      <div className="carousel-controls" ref={controls}>
        {enhanced && (
          <>
            <button
              type="button"
              className="carousel-button carousel-previous"
              lang={uiLang}
              aria-label={words.previous}
              disabled={ends.start}
              onClick={() => turn(-1)}
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
                <path d="M10 3 5 8l5 5" />
              </svg>
            </button>
            <p className="carousel-position" aria-live="polite" lang={uiLang}>
              {counts[selected]}
            </p>
            <button
              type="button"
              className="carousel-button carousel-next"
              lang={uiLang}
              aria-label={words.next}
              disabled={ends.end}
              onClick={() => turn(1)}
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
                <path d="m6 3 5 5-5 5" />
              </svg>
            </button>
          </>
        )}
      </div>
      {/* Beside the controls, not in them: it is what the row collapses to when they are gone (10.5, step 2). */}
      <Sheet
        ref={sheet}
        className="carousel-sheet"
        summary={<span lang={uiLang}>{counts[selected]}</span>}
        pages={images.map((image) => (
          <figure className="sheet-figure" key={image.href}>
            <img src={image.href} alt={image.description} loading="lazy" />
            <figcaption>
              <p>{image.description}</p>
              <p className="credit">
                <span className="kind" lang={uiLang}>
                  {words.credit}
                </span>{' '}
                {image.credit}
              </p>
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
