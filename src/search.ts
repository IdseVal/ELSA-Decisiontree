/**
 * **[#272]** What the overview's search bar finds a Tree by (docs/specs/application.md 26.5): its
 * title and its description in every language it declares -- so a Dutch title is found from the
 * English page -- folded so that neither case nor accents decide a match. The server folds each
 * Tree's text once; the page folds the query as the visitor types, with no round trip.
 */
import { plainDescription } from './markdown.ts'
import type { Manifest } from './tree/types.ts'

/** Lower-cased, accents and other combining marks dropped, every run of white space one space. */
export function foldForSearch(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** A Tree's titles and descriptions in every declared language, folded; the description's words without its marks (16.3). */
export function searchText(manifest: Pick<Manifest, 'title' | 'description'>): string {
  const descriptions = Object.values(manifest.description ?? {}).map((text) => plainDescription(text).reduced)
  return foldForSearch([...Object.values(manifest.title), ...descriptions].join(' '))
}

/**
 * Whether a Tree's folded text holds every word of the query, in any order: a blank query holds
 * none and matches every Tree.
 */
export function matchesSearch(text: string, query: string): boolean {
  return foldForSearch(query)
    .split(' ')
    .every((word) => text.includes(word))
}
