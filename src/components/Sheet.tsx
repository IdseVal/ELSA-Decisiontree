'use client'

/**
 * The Sheet: the one overlay of the tree view (docs/specs/application.md 10.2, 10.5). A
 * group the layout has collapsed -- the middle of a long Trail, the Options, the Sources --
 * is one control that opens the whole group as a list of links, laid over the page and
 * never scrolling. The enlarged Image of the Carousel (#43) is the same component.
 *
 * It is a native `<details>`, so it is correct without JavaScript (section 14): the summary
 * is a real disclosure button and opening it shows the whole list, laid out to fit. What
 * the script adds is what a disclosure does not do on its own -- Escape closes it and
 * returns focus to the control, a click outside closes it, and a long list is paged with
 * `previous` and `next` so that the panel holds as many entries as fit (10.2).
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
  // Paging and the close button exist only once the script runs: before that the panel
  // shows every entry, which is the fallback section 14 promises.
  const [enhanced, setEnhanced] = useState(false)
  useEffect(() => setEnhanced(true), [])

  const pages = Math.max(1, Math.ceil(items.length / PAGE))
  const shown = enhanced ? items.slice(page * PAGE, (page + 1) * PAGE) : items

  const close = (): void => {
    const element = details.current
    if (!element?.open) return
    element.open = false
    element.querySelector('summary')?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>): void => {
    if (event.key === 'Escape') close()
  }

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
        <ul className="sheet-list">
          {shown.map((item) => (
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
