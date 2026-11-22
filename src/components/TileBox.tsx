/**
 * The overview's box (docs/specs/application.md 26.2, 26.3; ADR-133-overview-tiles decision 5):
 * between the chrome bar and the disclaimer, it scrolls inside its own bounds while the document
 * never does. `data-scroll-box` is what the no-scroll test exempts, as it exempts the Carousel
 * strip (10.6). **[#272]** Its own component, since the public overview's search (26.5) draws it
 * from the page's script and the creators' overview from the server.
 */
import type { ReactNode } from 'react'

export function TileBox({ children }: { children: ReactNode }) {
  return (
    // A tab stop, so that the box scrolls by the keyboard as the Carousel strip does (12.2).
    <div className="overview" data-scroll-box="" tabIndex={0} aria-labelledby="site-title">
      {children}
    </div>
  )
}
