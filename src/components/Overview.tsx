/**
 * The overview's grid (docs/specs/application.md 23.2, 26.2, 26.3; ADR-133-overview-tiles
 * decisions 2, 5 and 6): one tile per served Tree, in the order given, in a box between the
 * chrome bar and the disclaimer that scrolls inside its own bounds while the document
 * never does. `data-scroll-box` is what the no-scroll test exempts, as it exempts the
 * Carousel strip (10.6).
 *
 * The creators' overview (#137) is this page with the + tile first and a state mark on
 * every tile; neither is here.
 */
import { chrome } from '../chrome.ts'
import type { Tree } from '../tree/loader.ts'
import { Tile } from './Tile.tsx'

export function Overview({ trees, lang }: { trees: Tree[]; lang: string }) {
  const ui = chrome(lang)
  return (
    // A tab stop, so that the box scrolls by the keyboard as the Carousel strip does (12.2).
    <div className="overview" data-scroll-box="" tabIndex={0} aria-labelledby="site-title">
      {trees.length === 0 ? (
        <p className="overview-empty">{ui.noTrees}</p>
      ) : (
        <ul className="tiles">
          {trees.map((tree) => (
            <Tile key={tree.id} tree={tree} lang={lang} />
          ))}
        </ul>
      )}
    </div>
  )
}
