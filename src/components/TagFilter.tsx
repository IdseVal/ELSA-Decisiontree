'use client'

/**
 * **[#273]** The public overview's tag filter (docs/specs/application.md 26.6; ADR-273-tags): a
 * pill beside the search field that opens a list of every tag the served Trees carry, each a check
 * box; a tick narrows the tiles to the Trees carrying any ticked tag, at once and without a request.
 *
 * It stands inside the search bar's form (`OverviewSearch`), which holds the choice and narrows the
 * tiles by both. The choice lives in the address's query, `?tag=...` once per tag, so the page can
 * be shared or reloaded as it stands; the server draws a shared address filtered already, so a
 * reader without script sees the choice too, and changes it with the list's `applyTags` button,
 * which sends the whole form -- the search field's `q` with the ticks. Nothing is stored and no
 * cookie is set (23.2).
 */
import { useEffect, useRef } from 'react'
import type { Chrome } from '../chrome.ts'
import { TAG_PARAMETER, withTags, type TagOption } from '../tags.ts'

/** The chrome strings the filter says. */
export type TagFilterWords = Pick<Chrome, 'tags' | 'filterByTag' | 'applyTags' | 'showAllTrees'>

export function TagFilter({
  options,
  chosen,
  onChoose,
  words,
  allHref,
}: {
  /** Every tag the served Trees carry, in the list's order (`tagOptions`). */
  options: readonly TagOption[]
  /** The keys of the ticked tags. */
  chosen: readonly string[]
  /** Told the new choice, which the address is given here. */
  onChoose: (chosen: string[]) => void
  words: TagFilterWords
  /** The overview with no choice, in the page's language and with the search field's text. */
  allHref: string
}) {
  const sheet = useRef<HTMLDetailsElement>(null)

  // A dropdown closes on Escape, giving the focus back to its pill, and on a click outside it (10.5).
  useEffect(() => {
    const details = sheet.current
    if (!details) return
    const close = (event: Event): void => {
      if (!details.open) return
      if (event instanceof KeyboardEvent ? event.key !== 'Escape' : details.contains(event.target as Node)) return
      details.open = false
      if (event instanceof KeyboardEvent) details.querySelector('summary')?.focus()
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', close)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', close)
    }
  }, [])

  /** The new choice on the page and in the address, which is replaced rather than added to the history. */
  const choose = (next: string[]): void => {
    onChoose(next)
    window.history.replaceState(window.history.state, '', withTags(window.location.href, next, options))
  }

  return (
    <details className="tag-filter" ref={sheet}>
      {/* Named by its word and the count, which below 480 pixels wide a funnel and the count stand for. */}
      <summary className="tag-filter-button" aria-label={chosen.length > 0 ? `${words.tags} ${chosen.length}` : words.tags}>
        <svg className="tag-filter-icon" viewBox="0 0 12 18" aria-hidden="true">
          <path d="M1 4.5h10L7 9.5v4l-2 1.5v-5.5z" />
        </svg>
        <span className="tag-filter-word">{words.tags}</span>
        {chosen.length > 0 && <span className="tag-filter-count">{chosen.length}</span>}
      </summary>
      <div className="tag-filter-panel">
        <fieldset>
          <legend>{words.filterByTag}</legend>
          <ul>
            {options.map((option) => (
              <li key={option.key}>
                <label>
                  <input
                    type="checkbox"
                    name={TAG_PARAMETER}
                    value={option.label}
                    checked={chosen.includes(option.key)}
                    onChange={(event) =>
                      choose(event.currentTarget.checked ? [...chosen, option.key] : chosen.filter((key) => key !== option.key))
                    }
                  />
                  {option.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <div className="tag-filter-actions">
          <noscript>
            <button type="submit" className="tag-filter-apply">
              {words.applyTags}
            </button>
          </noscript>
          {chosen.length > 0 && (
            <a
              className="tag-filter-all"
              href={allHref}
              onClick={(event) => {
                event.preventDefault()
                choose([])
              }}
            >
              {words.showAllTrees}
            </a>
          )}
        </div>
      </div>
    </details>
  )
}
