/**
 * The editor's `Links` (docs/specs/application.md 34.3; ADR-133-admin-routes decision 2):
 * the public grammar of 4.1 behind `/admin/trees`, so that the up arrow, the Answer
 * buttons and the language switch work in the editor by construction, and every picture
 * from the admin image route, which serves a draft's files to a reader with a role (22.6).
 * Server side: the page builds it once and hands it to the components through `edit`.
 */
import { adminImageHref, PUBLIC_LINKS, type Links } from '../url.ts'

/** Where the editor's addresses live (24.1). */
export const EDITOR_PREFIX = '/admin/trees'

export function editorLinks(): Links {
  return {
    node: (a) => `${EDITOR_PREFIX}${PUBLIC_LINKS.node(a)}`,
    follow: (a, targetId) => `${EDITOR_PREFIX}${PUBLIC_LINKS.follow(a, targetId)}`,
    trail: (a, index) => `${EDITOR_PREFIX}${PUBLIC_LINKS.trail(a, index)}`,
    withLang: (a, lang) => `${EDITOR_PREFIX}${PUBLIC_LINKS.withLang(a, lang)}`,
    image: adminImageHref,
  }
}
