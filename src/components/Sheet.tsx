'use client'

/**
 * The Sheet: the one overlay of the tree view (docs/specs/application.md 10.2, 10.5). A
 * group the layout has collapsed -- the middle of a long Trail, the Options, the Sources --
 * is one control that opens the whole group as a list of links, laid over the page and
 * never scrolling. The enlarged Image of the Carousel (#43) is the same component.
 *
 * It is a native `<details>`, so it is correct without JavaScript (section 14): the summary
 * is a real disclosure button and opening it shows the list, as many entries as fit. A
 * longer list is paged either way. With the script, `previous` and `next` turn the page
 * (10.2); without it, every page after the first is a nested disclosure whose summary is
 * `next`, and the stylesheet shows one page at a time -- a reader with no script turns the
 * pages by opening disclosures, and the panel is never asked to hold a 49-entry Trail on a
 * phone. What else the script adds is what a disclosure does not do on its own: Escape
 * closes it and returns focus to the control, and a click outside closes it.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

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

/** How many entries one page of the panel holds: 8 titles of up to three lines fit 640 px. */
const PAGE = 8

export function Sheet({
  summary,
  items,
  words,
  uiLang,
  className,
}: {
  /** What the control says: chrome, already in its own `lang` where it needs one. */
  summary: ReactNode
  items: SheetItem[]
  words: SheetWords
  /** Set when the chrome speaks another language than the content around it. */
  uiLang: string | undefined
  className: string
}) {
  const details = useRef<HTMLDetailsElement>(null)
  const [page, setPage] = useState(0)
  // Paging by button and the close button exist only once the script runs: before that the
  // panel holds every page as nested disclosures, which is the fallback section 14 promises.
  const [enhanced, setEnhanced] = useState(false)
  useEffect(() => setEnhanced(true), [])

  const pages = Math.max(1, Math.ceil(items.length / PAGE))

  const close = (): void => {
    const element = details.current
    if (!element?.open) return
    element.open = false
    element.querySelector('summary')?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>): void => {
    if (event.key === 'Escape') close()
  }

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
            aria-describedby={item.newTab ? `${className}-new-tab` : undefined}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  )

  // Page `from` and, nested, every page after it: the no-script panel. The summary says
  // `next` while its page is closed and `previous` once it is open, and the stylesheet
  // hides the page before an open one, so exactly one page is on the panel at a time.
  const pagesFrom = (from: number): ReactNode => (
    <>
      {list(items.slice(from * PAGE, (from + 1) * PAGE))}
      {from + 1 < pages && (
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

  return (
    <details
      className={`sheet ${className}`}
      ref={details}
      onKeyDown={onKeyDown}
      onToggle={() => setPage(0)}
    >
      <summary className="sheet-open">{summary}</summary>
      {enhanced && <div className="sheet-backdrop" onClick={close} />}
      <div className="sheet-panel">
        {/* Hidden, not clipped: read as a description all the same, and never wider than itself (10.6). */}
        <span hidden id={`${className}-new-tab`} lang={uiLang}>
          {words.opensInNewTab}
        </span>
        {enhanced ? list(items.slice(page * PAGE, (page + 1) * PAGE)) : pagesFrom(0)}
        {enhanced && (
          <div className="sheet-controls" lang={uiLang}>
            {pages > 1 && (
              <>
                <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  {words.previous}
                </button>
                <button
                  type="button"
                  disabled={page === pages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  {words.next}
                </button>
              </>
            )}
            <button type="button" className="sheet-close" onClick={close}>
              {words.close}
            </button>
          </div>
        )}
      </div>
    </details>
  )
}
