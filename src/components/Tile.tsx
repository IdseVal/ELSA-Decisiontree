/**
 * One Tree on the overview (docs/specs/application.md 23.2, 26.1; ADR-133-overview-tiles
 * decision 1): a 280 x 160 link to the Tree's root Node, holding its logo when its Theme
 * names one, its title, its description and its languages.
 *
 * Drawn in the page's Theme, never the Tree's: thirty palettes on one page would be a
 * fairground, and the logo already says whose Tree it is. For the same reason the logo is
 * the light variant -- the tile's `surface` is the default palette's, which is light.
 */
import { text } from '../chrome.ts'
import { plainDescription } from '../markdown.ts'
import type { Tree } from '../tree/loader.ts'
import { contentLanguage, rootHref, themeHref } from '../url.ts'

export function Tile({
  tree,
  /** The page's language, a chrome language: the tile speaks it when the Tree declares it. */
  lang,
}: {
  tree: Tree
  lang: string
}) {
  const { manifest } = tree
  // The Tree's own language when it does not declare the page's, marked on the tile (23.2).
  const shown = contentLanguage(tree, lang)
  const description = manifest.description && plainDescription(text(manifest.description, shown, 'tree.description')).cut
  const logo = manifest.theme?.logo

  return (
    <li>
      <a className="tile" href={rootHref(tree, lang)} lang={shown === lang ? undefined : shown} data-tree={tree.id}>
        {logo && (
          <img className="tile-logo" src={themeHref(tree.id, logo.light)} alt={text(logo.alt, shown, 'theme.logo.alt')} />
        )}
        <span className="tile-title">{text(manifest.title, shown, 'tree.title')}</span>
        {description && <span className="tile-description">{description}</span>}
        <span className="tile-languages">
          {manifest.languages.map((language) => (
            <span key={language} className="tile-language">
              {language.toUpperCase()}
            </span>
          ))}
        </span>
      </a>
    </li>
  )
}
