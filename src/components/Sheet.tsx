'use client'

/**
 * The Sheet: the one overlay of the tree view (docs/specs/application.md 10.2, 10.5, 12.3).
 * A group the layout has collapsed -- the middle of a long Trail, the Options, the Sources
 * -- is one control that opens the whole group as a list of links, laid over the page and
 * never scrolling. The enlarged Image of the Carousel is the same component, holding one
 * Image per page instead of eight links; so is the Overlay (10.9), whose control is the
 * Option button and whose one page is its target's Interior, closed by a cross at its top
 * right corner, and rendered open by the server when the URL names its explanation Node.
 *
 * It is a native `<details>`, so it is correct without JavaScript (section 14): the summary
 * is a real disclosure button and opening it shows the first page. A longer list is paged
 * either way. With the script, `previous` and `next` turn the page (10.2); without it,
 * every page after the first is a nested disclosure whose summary is `next`, and the
 * stylesheet shows one page at a time -- a reader with no script turns the pages by opening
 * disclosures, and the panel is never asked to hold a 49-entry Trail on a phone. What else
 * the script adds is what a disclosure does not do on its own: Escape closes it and returns
 * focus to the control that opened it, a click outside closes it, and an Overlay moves the
 * focus to its cross when it opens (10.9).
 */
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react'

/** One link of the list a Sheet shows. */
export interface SheetItem {
  href: string
  label: string
  /** A kind label before the link, for a Source (`Legal`, `Case law`, `Literature`). */
  kind?: string
  /** Opens in a new tab: a Source URL, which leaves the app (core document 3.1). */
  newTab?: boolean
}

/** The chrome words the Sheet says; strings, because a client component takes no module. */
export interface SheetWords {
  close: string
  previous: string
  next: string
  opensInNewTab: string
}

/**
 * What a control outside the Sheet may do with it: the Carousel's thumbnails open the
 * enlarged view at their own Image, not at the first.
 */
export interface SheetHandle {
  open: (page: number) => void
}

/** How many entries one page of the panel holds: 8 titles of up to three lines fit 640 px. */
const PAGE = 8

export function Sheet({
  summary,
  items,
  pages,
  words,
  uiLang,
  className,
  idPrefix = '',
  startPage = 0,
  onPage,
  open = false,
  cross = false,
  ref,
}: {
  /** What the control says: chrome, already in its own `lang` where it needs one. */
  summary: ReactNode
  /** Links, eight to a page. */
  items?: SheetItem[]
  /** Or content already cut into pages, one page each: the enlarged Images. */
  pages?: ReactNode[]
  words: SheetWords
  /** Set when the chrome speaks another language than the content around it. */
  uiLang: string | undefined
  className: string
  /** Prepended to the one `id` the Sheet writes, for a copy of it in a neighbour frame. */
  idPrefix?: string
  /** The page the summary opens the Sheet at: the Image the collapsed Carousel names. */
  startPage?: number
  /** Told the page on the panel whenever it changes while the Sheet is open. */
  onPage?: (page: number) => void
  /** Rendered open by the server: the Overlay a URL names (10.9). */
  open?: boolean
  /**
   * The Overlay's close: a round cross at the panel's top right corner, first on the panel,
   * where the focus lands when the Sheet opens (10.9). Otherwise the close is a button among
   * the panel's controls, and the focus stays on the summary that was pressed.
   */
  cross?: boolean
  ref?: Ref<SheetHandle>
}) {
  const details = useRef<HTMLDetailsElement>(null)
  const [page, setPage] = useState(0)
  // Where the next opening starts, and what had the focus before it: a thumbnail opens the
  // Sheet from outside it, and the focus goes back there rather than to a hidden summary.
  const startAt = useRef<number | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  // Paging by button and the close button exist only once the script runs: before that the
  // panel holds every page as nested disclosures, which is the fallback section 14 promises.
  const [enhanced, setEnhanced] = useState(false)
  useEffect(() => setEnhanced(true), [])

  const list = (entries: SheetItem[]): ReactNode => (
    <ul className="sheet-list">
      {entries.map((item) => (
        <li key={`${item.href} ${item.label}`}>
          {item.kind !== undefined && (
            <span className="kind" lang={uiLang}>
              {item.kind}
            </span>
          )}
          <a
            href={item.href}
            target={item.newTab ? '_blank' : undefined}
            rel={item.newTab ? 'noopener noreferrer' : undefined}
            aria-describedby={item.newTab ? `${idPrefix}${className}-new-tab` : undefined}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  )

  const all: ReactNode[] =
    pages ??
    Array.from({ length: Math.max(1, Math.ceil((items ?? []).length / PAGE)) }, (_, at) =>
      list((items ?? []).slice(at * PAGE, (at + 1) * PAGE)),
    )

  const turnTo = (to: number): void => {
    setPage(to)
    onPage?.(to)
  }

  useImperativeHandle(ref, () => ({
    open: (at) => {
      const element = details.current
      if (!element) return
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      startAt.current = at
      element.open = true
      // Into the panel, so Escape reaches the Sheet and a screen reader is where the Image is.
      element.querySelector<HTMLElement>('.sheet-close')?.focus()
    },
  }))

  const close = (): void => {
    const element = details.current
    if (!element?.open) return
    element.open = false
    const back = opener.current?.isConnected ? opener.current : element.querySelector('summary')
    back?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>): void => {
    if (event.key !== 'Escape') return
    // One Escape closes one Sheet: the Overlay around a Sheet its Interior holds stays open.
    event.stopPropagation()
    close()
  }

  const onToggle = (): void => {
    if (details.current?.open) {
      turnTo(startAt.current ?? startPage)
      // Into the panel, so Escape reaches the Sheet and a screen reader is where the aside is (10.9).
      if (cross) details.current.querySelector<HTMLElement>('.sheet-close')?.focus()
    } else {
      startAt.current = null
      opener.current = null
    }
  }

  // Page `from` and, nested, every page after it: the no-script panel. The summary says
  // `next` while its page is closed and `previous` once it is open, and the stylesheet
  // hides the page before an open one, so exactly one page is on the panel at a time.
  const pagesFrom = (from: number): ReactNode => (
    <>
      <div className="sheet-page">{all[from]}</div>
      {from + 1 < all.length && (
        <details className="sheet-more">
          <summary lang={uiLang}>
            <span className="sheet-more-next">{words.next}</span>
            <span className="sheet-more-previous">{words.previous}</span>
          </summary>
          {pagesFrom(from + 1)}
        </details>
      )}
    </>
  )

  // One name for every Sheet: opening one closes any other, so without the script, where no
  // backdrop keeps the page from a second click, two panels are never laid over each other.
  return (
    <details className={`sheet ${className}`} name="sheet" open={open} ref={details} onKeyDown={onKeyDown} onToggle={onToggle}>
      <summary className="sheet-open">{summary}</summary>
      {enhanced && <div className="sheet-backdrop" onClick={close} />}
      <div className="sheet-panel">
        {enhanced && cross && (
          <button type="button" className="sheet-close sheet-close--cross" onClick={close} aria-label={words.close}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        )}
        {items && (
          /* Hidden, not clipped: read as a description all the same, and never wider than itself (10.6). */
          <span hidden id={`${idPrefix}${className}-new-tab`} lang={uiLang}>
            {words.opensInNewTab}
          </span>
        )}
        {enhanced ? <div className="sheet-page">{all[page]}</div> : pagesFrom(0)}
        {enhanced && (all.length > 1 || !cross) && (
          <div className="sheet-controls" lang={uiLang}>
            {all.length > 1 && (
              <>
                <button type="button" disabled={page === 0} onClick={() => turnTo(page - 1)}>
                  {words.previous}
                </button>
                <button type="button" disabled={page === all.length - 1} onClick={() => turnTo(page + 1)}>
                  {words.next}
                </button>
              </>
            )}
            {!cross && (
              <button type="button" className="sheet-close" onClick={close}>
                {words.close}
              </button>
            )}
          </div>
        )}
      </div>
    </details>
  )
}
