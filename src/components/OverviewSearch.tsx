'use client'

/**
 * **[#272]** The public overview's search bar and the tiles it narrows (docs/specs/application.md
 * 26.5): as the visitor types, the box holds only the tiles whose Tree's text -- its titles and
 * descriptions in every language it declares, folded by the server (`searchText`) -- holds every
 * word typed. The page already holds every tile, so nothing is asked of the server; an emptied
 * field shows every tile again, and no tile says so in the chrome language.
 *
 * Without the script the field is a form that asks for `/?q=...`, which the server answers with
 * the same narrowing, so the bar does what it says either way.
 */
import { type ReactNode, useState } from 'react'
import { chrome, CHROME_LANGUAGES } from '../chrome.ts'
import { matchesSearch } from '../search.ts'
import { TileBox } from './TileBox.tsx'

export function OverviewSearch({
  tiles,
  lang,
  query: asked,
}: {
  /** Every tile in the overview's order, each drawn by the server with its Tree's folded text. */
  tiles: { text: string; tile: ReactNode }[]
  /** The page's chrome language. */
  lang: string
  /** The field's text when the page opens: the request's `q`. */
  query: string
}) {
  const [query, setQuery] = useState(asked)
  const ui = chrome(lang)
  const shown = tiles.filter(({ text }) => matchesSearch(text, query))

  return (
    <>
      {/* The script narrows as the visitor types: Enter has nothing left to send. */}
      <form className="overview-search" role="search" action="/" onSubmit={(event) => event.preventDefault()}>
        <label className="overview-search-field">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 21 21" />
          </svg>
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={ui.searchTrees}
            placeholder={ui.searchTrees}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {/* The page's language travels with a search sent without the script, as `?lang` (4.1). */}
        {lang !== CHROME_LANGUAGES[0] && <input type="hidden" name="lang" value={lang} />}
      </form>
      <TileBox>
        {shown.length > 0 ? (
          <ul className="tiles">{shown.map(({ tile }) => tile)}</ul>
        ) : (
          <p className="overview-empty" role="status">
            {ui.noMatch}
          </p>
        )}
      </TileBox>
    </>
  )
}
