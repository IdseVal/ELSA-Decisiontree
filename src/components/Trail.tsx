/**
 * The Trail: the Nodes visited to reach the one on screen, drawn as a line rising from it
 * and leaving the screen at the top (docs/CORE_DOCUMENT.md 3.2). Clicking an entry jumps
 * back to that Node and discards everything visited after it (10.17) -- which is what the
 * URL of the entry already says, because the path is the Trail (application.md 4.1).
 *
 * It is the one way back. A Node reached by its own URL -- a shared link to a single step,
 * or a search result -- carries no Trail; it offers instead the link to the root Node that
 * the chrome calls `start` (application.md 3.2), so no reader is ever stranded.
 */
import type { Chrome } from '../chrome.ts'

/** One Node the reader has been to: where it is now, and what it was called. */
export interface TrailEntry {
  /** That Node with the rest of the Trail discarded. */
  href: string
  /** The Node's title in the content language. */
  title: string
}

export function Trail({
  entries,
  start,
  ui,
  uiLang,
}: {
  entries: TrailEntry[]
  /**
   * The way into the walk: set only when there is no Trail and this is not the root Node,
   * so it never appears beside `entries`.
   */
  start: string | undefined
  ui: Chrome
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
}) {
  if (entries.length === 0 && start === undefined) return null

  return (
    <nav className="trail" aria-labelledby="trail-label">
      {/* The name of the region is chrome and may be in another language than the titles
          under it. Only a referenced element can say so; an `aria-label` string cannot. */}
      <span className="visually-hidden" id="trail-label" lang={uiLang}>
        {ui.trail}
      </span>
      <ol>
        {start !== undefined ? (
          <li>
            {/* Chrome, not a Node title: it marks its own language. */}
            <a className="trail-entry" href={start} lang={uiLang}>
              {ui.start}
            </a>
          </li>
        ) : (
          entries.map((entry, index) => (
            <li key={entry.href}>
              <a
                className="trail-entry"
                href={entry.href}
                // The entry just above the current Node is the page the reader came from.
                rel={index === entries.length - 1 ? 'prev' : undefined}
              >
                {entry.title}
              </a>
            </li>
          ))
        )}
      </ol>
    </nav>
  )
}
