/**
 * The overview's grid (docs/specs/application.md 23.2, 26.2, 26.3; ADR-133-overview-tiles
 * decisions 2, 5 and 6): one tile per Tree, in the order given, in a box between the chrome
 * bar and the disclaimer that scrolls inside its own bounds while the document never does
 * (`TileBox`).
 *
 * **[#137]** The creators' overview (26.4) is this grid with the + tile first, and its tiles
 * carrying a state mark and, where the caller has a role, the editor's address.
 *
 * **[#272]** The public overview's grid stands under a search bar that narrows it (26.5): given a
 * `query`, the tiles are drawn here and handed, each with its Tree's folded text, to
 * `OverviewSearch`. With no Tree to search there is no bar, only `noTrees`.
 *
 * **[#273]** On the public overview each tile also carries its Tree's tag keys, which the bar's tag
 * filter narrows by with the search (26.6).
 */
import type { ComponentProps } from 'react'
import { chrome } from '../chrome.ts'
import { searchText } from '../search.ts'
import type { TagOption } from '../tags.ts'
import { OverviewSearch } from './OverviewSearch.tsx'
import { Tile } from './Tile.tsx'
import { TileBox } from './TileBox.tsx'

export function Overview({
  tiles,
  lang,
  newTreeHref,
  query,
  tags,
}: {
  /** The tiles; **[#273]** on the public overview each with the keys of its Tree's tags. */
  tiles: (Omit<ComponentProps<typeof Tile>, 'lang'> & { tags?: string[] })[]
  lang: string
  /** The + tile's link, `/admin/new`; the creators' overview only. */
  newTreeHref?: string
  /** **[#272]** The search field's text when the page opens; the public overview only: absent, no bar. */
  query?: string
  /** **[#273]** The tag filter's list and the request's choice; the public overview only. */
  tags?: { options: TagOption[]; chosen: string[] }
}) {
  const ui = chrome(lang)
  const drawn = tiles.map(({ tags: _keys, ...tile }) => <Tile key={tile.tree.id} {...tile} lang={lang} />)
  if (query !== undefined && tiles.length > 0) {
    const searched = tiles.map(({ tree, tags: keys = [] }, index) => ({
      text: tree.manifest ? searchText(tree.manifest) : '',
      tags: keys,
      tile: drawn[index],
    }))
    return (
      <OverviewSearch tiles={searched} lang={lang} query={query} tagOptions={tags?.options ?? []} chosenTags={tags?.chosen ?? []} />
    )
  }
  return (
    <TileBox>
      {tiles.length === 0 && !newTreeHref ? (
        <p className="overview-empty">{ui.noTrees}</p>
      ) : (
        <ul className="tiles">
          {newTreeHref && (
            <li>
              <a className="tile tile--new" href={newTreeHref}>
                <span className="tile-plus" aria-hidden="true">
                  +
                </span>
                {ui.newTree}
              </a>
            </li>
          )}
          {drawn}
        </ul>
      )}
    </TileBox>
  )
}
