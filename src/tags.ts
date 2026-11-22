/**
 * **[#273]** The public overview's tag filter (docs/specs/application.md 26.6; ADR-273-tags):
 * which tags it lists, which a request chose, and which tiles those leave. Pure, and free of
 * the store and of `validate.ts`, so the server page and the filter's client component share it.
 *
 * A tag is listed in the page's language where its Tree declares that language, else in the
 * Tree's default, as the tile's title is (23.2). Two Trees' tags are one entry when `tagKey`
 * makes them one -- letter case and the spaces around them aside -- and the entry reads as the
 * first Tree in `id` order writes it. Choosing several tags shows the Trees carrying **any** of
 * them, so a choice never empties the overview; a tag no served Tree carries, as an old shared
 * link may name, is no choice at all.
 */
import type { LocalisedText } from './tree/types.ts'
import { tagKey } from './tree/grammar.ts'

/** One entry of the filter's list: the key it is matched by and the words it shows. */
export interface TagOption {
  key: string
  label: string
}

/** The query parameter that carries a choice, once per chosen tag, in the words the list shows. */
export const TAG_PARAMETER = 'tag'

/**
 * The keys of a Tree's tags in `shown`, the language its tile speaks (23.2); a tag with no text
 * in it -- possible in a draft only, since a published Tree is valid in full -- is left out.
 */
export function treeTagKeys(tags: LocalisedText[] | undefined, shown: string): string[] {
  return (tags ?? []).map((tag) => tag[shown]?.trim() ?? '').filter((text) => text !== '').map(tagKey)
}

/**
 * Every tag of `trees`, given in `id` order with the language each is shown in, once per key, in
 * the order of `lang`'s alphabet, letter case aside.
 */
export function tagOptions(trees: Array<{ tags: LocalisedText[] | undefined; shown: string }>, lang: string): TagOption[] {
  const options = new Map<string, string>()
  for (const { tags, shown } of trees) {
    for (const tag of tags ?? []) {
      const label = tag[shown]?.trim() ?? ''
      if (label !== '' && !options.has(tagKey(label))) options.set(tagKey(label), label)
    }
  }
  return [...options].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label, lang, { sensitivity: 'base' }))
}

/** The keys of the listed tags among `requested`, the query's words, in the list's order. */
export function chosenTags(requested: readonly string[], options: readonly TagOption[]): string[] {
  const asked = new Set(requested.map(tagKey))
  return options.filter((option) => asked.has(option.key)).map((option) => option.key)
}

/** Whether a tile with the tags `keys` stands while `chosen` is chosen: always, while nothing is. */
export function shows(keys: readonly string[], chosen: readonly string[]): boolean {
  return chosen.length === 0 || keys.some((key) => chosen.includes(key))
}

/**
 * `href` with the choice `chosen` in its query in the list's words, after every other
 * parameter it has, which stay as they are (the page's `lang`); no `tag` at all for no choice.
 */
export function withTags(href: string, chosen: readonly string[], options: readonly TagOption[]): string {
  const url = new URL(href)
  url.searchParams.delete(TAG_PARAMETER)
  for (const option of options) if (chosen.includes(option.key)) url.searchParams.append(TAG_PARAMETER, option.label)
  return url.href
}
