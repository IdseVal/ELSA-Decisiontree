/**
 * The overview's grid (docs/specs/application.md 23.2, 26.2, 26.3; ADR-133-overview-tiles
 * decisions 2, 5 and 6): one tile per Tree, in the order given, in a box between the chrome
 * bar and the disclaimer that scrolls inside its own bounds while the document never does.
 * `data-scroll-box` is what the no-scroll test exempts, as it exempts the Carousel strip
 * (10.6).
 *
 * **[#137]** The creators' overview (26.4) is this grid with the + tile first, and its tiles
 * carrying a state mark and, where the caller has a role, the editor's address.
 */
import type { ComponentProps } from 'react'
import { chrome } from '../chrome.ts'
import { Tile } from './Tile.tsx'

export function Overview({
  tiles,
  lang,
  newTreeHref,
}: {
  tiles: Omit<ComponentProps<typeof Tile>, 'lang'>[]
  lang: string
  /** The + tile's link, `/admin/new`; the creators' overview only. */
  newTreeHref?: string
}) {
  const ui = chrome(lang)
  return (
    // A tab stop, so that the box scrolls by the keyboard as the Carousel strip does (12.2).
    <div className="overview" data-scroll-box="" tabIndex={0} aria-labelledby="site-title">
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
          {tiles.map((tile) => (
            <Tile key={tile.tree.id} {...tile} lang={lang} />
          ))}
        </ul>
      )}
    </div>
  )
}
