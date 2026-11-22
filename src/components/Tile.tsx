/**
 * One Tree on the overview (docs/specs/application.md 23.2, 26.1; ADR-133-overview-tiles
 * decision 1): a 280 x 160 link to the Tree's root Node, holding its logo when its Theme
 * names one, its title, its description and its languages.
 *
 * Drawn in the page's Theme, never the Tree's: thirty palettes on one page would be a
 * fairground, and the logo already says whose Tree it is. For the same reason the logo is
 * the light variant -- the tile's `surface` is the default palette's, which is light.
 *
 * **[#137]** On the creators' overview (26.4) a tile also carries its Tree's state in the
 * bottom right corner, may lead to the editor instead of the public page, and may show a
 * draft: a hidden Tree's manifest, or none for a draft no longer editable (19.5).
 *
 * **[#197]** Its bottom row names the Tree's Authors after the language tags and before the state
 * mark (39.5), on both overviews.
 */
import { chrome, text } from '../chrome.ts'
import { plainDescription } from '../markdown.ts'
import type { Manifest } from '../tree/types.ts'
import { contentLanguage, rootHref, themeHref } from '../url.ts'
import { TileAuthors } from './Authors.tsx'

/** The state mark of 26.4: `notServable` is a published Tree the public routes refused (18.3). */
export type TileState = 'published' | 'hidden' | 'notServable'

export function Tile({
  tree,
  /** The page's language, a chrome language: the tile speaks it when the Tree declares it. */
  lang,
  /** Where the tile leads; the public root Node when absent. */
  href,
  /** The state mark; none on the public overview. */
  state,
  /** **[#197]** The names of the Tree's Authors, in the order they joined it; none, no mention (39.5). */
  authors = [],
}: {
  tree: { id: string; manifest: Manifest | null }
  lang: string
  href?: string
  state?: TileState
  authors?: string[]
}) {
  const { manifest } = tree
  // The Tree's own language when it does not declare the page's, marked on the tile (23.2).
  const shown = manifest ? contentLanguage({ manifest }, lang) : lang
  const title = manifest ? text(manifest.title, shown, 'tree.title') : ''
  const description = manifest?.description && plainDescription(text(manifest.description, shown, 'tree.description')).cut
  // A Theme's files are served for a servable published Tree only (13.2, 23.1).
  const logo = state === undefined || state === 'published' ? manifest?.theme?.logo : undefined

  return (
    <li>
      <a
        className="tile"
        href={href ?? (manifest ? rootHref({ id: tree.id, manifest }, lang) : undefined)}
        lang={shown === lang ? undefined : shown}
        data-tree={tree.id}
      >
        {logo && (
          <img className="tile-logo" src={themeHref(tree.id, logo.light)} alt={text(logo.alt, shown, 'theme.logo.alt')} />
        )}
        {/* A new Tree's title may still be empty in this language (27.1): the id names it until then. */}
        <span className="tile-title" data-clamp="">{title || tree.id}</span>
        {description && (
          <span className="tile-description" data-clamp="">
            {description}
          </span>
        )}
        <span className="tile-languages">
          {manifest?.languages.map((language) => (
            <span key={language} className="tile-language">
              {language.toUpperCase()}
            </span>
          ))}
          <TileAuthors names={authors} lang={lang} marked={shown !== lang} />
          {state && <StateMark state={state} lang={lang} marked={shown !== lang} />}
        </span>
      </a>
    </li>
  )
}

/**
 * A dot and one word, in the page's language: `published`, `hidden` or `notServable` (26.4).
 * `marked` when the tile around it speaks the Tree's language, so a screen reader says both.
 */
function StateMark({ state, lang, marked }: { state: TileState; lang: string; marked: boolean }) {
  const ui = chrome(lang)
  return (
    <span className={`tile-state tile-state--${state}`} lang={marked ? lang : undefined}>
      <span className="tile-state-dot" aria-hidden="true" />
      {state === 'published' ? ui.published : state === 'hidden' ? ui.hidden : ui.notServable}
    </span>
  )
}
