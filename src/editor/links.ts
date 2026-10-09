/**
 * The editor's `Links` (docs/specs/application.md 34.3; ADR-133-admin-routes decision 2):
 * the public grammar of 4.1 behind `/admin/trees`, so that the up arrow, the Answer
 * buttons and the language switch work in the editor by construction, and every picture
 * from the admin image route, which serves a draft's files to a reader with a role (22.6).
 * **[#205]** And the preview's, the same grammar behind `/admin/preview` (40.1).
 * Server side: the page builds it once and hands it to the components through `edit`.
 */
import { adminImageHref, PUBLIC_LINKS, type Links } from '../url.ts'

/** Where the editor's addresses live (24.1). */
export const EDITOR_PREFIX = '/admin/trees'

/** **[#205]** Where the preview of a hidden Tree lives (40.1). */
export const PREVIEW_PREFIX = '/admin/preview'

export function editorLinks(): Links {
  return prefixed(EDITOR_PREFIX)
}

/**
 * **[#205]** The preview's `Links` (40.1): the four addresses behind `/admin/preview`, so the
 * reader walks the draft without leaving the preview, and every picture from the admin image
 * route, since no public route serves a hidden Tree's files (23.1).
 */
export function previewLinks(): Links {
  return prefixed(PREVIEW_PREFIX)
}

/** The public page's four addresses behind `prefix`, and the pictures from the admin image route. */
function prefixed(prefix: string): Links {
  return {
    node: (a) => `${prefix}${PUBLIC_LINKS.node(a)}`,
    follow: (a, targetId) => `${prefix}${PUBLIC_LINKS.follow(a, targetId)}`,
    trail: (a, index) => `${prefix}${PUBLIC_LINKS.trail(a, index)}`,
    withLang: (a, lang) => `${prefix}${PUBLIC_LINKS.withLang(a, lang)}`,
    image: adminImageHref,
  }
}
