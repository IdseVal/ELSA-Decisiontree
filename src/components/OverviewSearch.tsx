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
 *
 * **[#273]** The tag filter (26.6) is the form's second control, beside the field: a tile stands
 * while it matches the search and carries a ticked tag, so `noMatch` speaks for both. One form, so
 * that without the script each control sends the other's state too (`q`, the ticked `tag`s, `lang`).
 */
import { type ReactNode, useState } from 'react'
import { chrome, CHROME_LANGUAGES } from '../chrome.ts'
import { matchesSearch } from '../search.ts'
import { shows, type TagOption } from '../tags.ts'
import { TagFilter } from './TagFilter.tsx'
import { TileBox } from './TileBox.tsx'

export function OverviewSearch({
  tiles,
  lang,
  query: asked,
  tagOptions,
  chosenTags,
}: {
  /** Every tile in the overview's order, each drawn by the server with its Tree's folded text and the keys of its tags. */
  tiles: { text: string; tags: readonly string[]; tile: ReactNode }[]
  /** The page's chrome language. */
  lang: string
  /** The field's text when the page opens: the request's `q`. */
  query: string
  /** **[#273]** Every tag the served Trees carry, in the list's order; none, no filter. */
  tagOptions: readonly TagOption[]
  /** **[#273]** The keys of the tags ticked when the page opens: the request's `tag`s. */
  chosenTags: string[]
}) {
  const [query, setQuery] = useState(asked)
  const [chosen, choose] = useState(chosenTags)
  const ui = chrome(lang)
  const shown = tiles.filter(({ text, tags }) => matchesSearch(text, query) && shows(tags, chosen))
  // "Show all trees" without the script: the overview in this language, the search kept.
  const kept = new URLSearchParams()
  if (lang !== CHROME_LANGUAGES[0]) kept.set('lang', lang)
  if (query !== '') kept.set('q', query)

  return (
    <>
      {/* The script narrows as the visitor types and ticks: Enter has nothing left to send. */}
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
        {tagOptions.length > 0 && (
          <TagFilter
            options={tagOptions}
            chosen={chosen}
            onChoose={choose}
            words={{ tags: ui.tags, filterByTag: ui.filterByTag, applyTags: ui.applyTags, showAllTrees: ui.showAllTrees }}
            allHref={kept.toString() === '' ? '/' : `/?${kept}`}
          />
        )}
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
