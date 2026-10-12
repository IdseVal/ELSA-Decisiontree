/**
 * **[#197]** The mention of a Tree's Authors (docs/specs/application.md 39.4, 39.5;
 * ADR-195-the-mention): `byAuthors` in the chrome language -- "By A, B and C" -- on one line in
 * a room of its own, cut with an ellipsis where the room ends and not drawn where it is under 80
 * pixels, which the stylesheet decides with a container query. The whole text is the line's
 * `title`, and its text: a screen reader reads it whole. A Tree without an Author has no element.
 *
 * Two places and no other (39.7): the chrome bar of a published Tree's Node pages, between its
 * mark and the controls, and its tile on both overviews, after the language tags. In each the
 * room takes the free space and cancels the gap before it, so nothing else moves for it.
 */
import { chrome, chromeLang } from '../chrome.ts'

/** The mention in the chrome bar (39.4); `lang` is the page's content language. */
export function Authors({ names, lang }: { names: string[]; lang: string }) {
  if (names.length === 0) return null
  const words = chrome(lang).byAuthors(names)
  return (
    <div className="authors-room">
      <p className="authors" data-clamp="" title={words} lang={chromeLang(lang)}>
        {words}
      </p>
    </div>
  )
}

/**
 * The mention on a tile (39.5); `lang` is the page's, a chrome language. `marked` when the tile
 * around it speaks the Tree's language (23.2), so the mention says which it speaks, as the state
 * mark does.
 */
export function TileAuthors({ names, lang, marked }: { names: string[]; lang: string; marked: boolean }) {
  if (names.length === 0) return null
  const words = chrome(lang).byAuthors(names)
  return (
    <span className="tile-authors-room">
      <span className="tile-authors" data-clamp="" title={words} lang={marked ? lang : undefined}>
        {words}
      </span>
    </span>
  )
}
