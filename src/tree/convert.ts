/**
 * The conversion of docs/specs/tree-format.md 12.7, from `elsa-tree/4` to `elsa-tree/5`
 * (ADR-171-elsa-tree-5): the format's two names of itself, and every Terminal, whose
 * `outcome` becomes the words its badge showed, `terminal.label`. Nothing else changes.
 * Pure: one parsed file in, the converted file and what was done out. The migration
 * (`npm run migrate`) and the store, which converts the files it opens (application.md
 * 36.4), both run it; each then validates the result and writes it in the byte form of 3.7
 * in its own order, so those two steps are theirs.
 *
 * Imports carry `.ts` extensions because scripts/migrate-tree.ts runs this module with
 * plain Node.
 */
import { isMapping, type Mapping } from './validate.ts'

/**
 * The badge words of `elsa-tree/4`, as `src/chrome.ts` held them on 2026-10-02: the table
 * of 12.7.1 step 5, frozen there because the chrome no longer has them. Nothing else in the
 * application knows the four outcomes.
 */
const ENDING_WORDS: Record<'en' | 'nl', Record<string, string>> = {
  en: { 'not-applicable': 'Does not apply', applicable: 'Applies', prohibited: 'Prohibited', refer: 'Look elsewhere' },
  nl: { 'not-applicable': 'Niet van toepassing', applicable: 'Van toepassing', prohibited: 'Verboden', refer: 'Elders geregeld' },
}

/** The `$schema` grammar of `elsa-tree/4` (schemas/elsa-tree-4.json): the path, or an http(s) URL whose path ends with it. */
const SCHEMA_4 = /^(?:\/|https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?\/)schemas\/elsa-tree-4\.json$/

/** What `convertTree` did to one file. */
export interface Conversion {
  /** The converted file; null for a file that is not `elsa-tree/4`, which is left alone (12.7.1 step 2). */
  tree: Mapping | null
  /** The file's own `format`: what a file left alone is reported with. */
  format: unknown
  /** How many Terminals were given their words (step 5). */
  endings: number
  /** Each Terminal left as it was, by Node id and what it holds, to fail V-TERMINAL afterwards (step 5). */
  left: string[]
}

/**
 * Steps 2 to 6 of 12.7.1 on `tree`, a parsed `tree.json` or `draft.json` that the loader's
 * reader accepted (step 1). A file that is not `elsa-tree/4` -- `elsa-tree/5` included,
 * which is what makes the procedure idempotent -- is answered with `tree` null. Otherwise
 * the answer is a copy with `format` and `$schema` naming `/5` and every Terminal whose one
 * key is `outcome`, holding one of the four, given for each declared language, in the
 * manifest's order, the word its badge showed in that language. Any other Terminal, and
 * every Terminal of a file whose `languages` is not a list of strings, is left as it is and
 * reported. Every key keeps its place, so step 7's byte form is the only reordering.
 */
export function convertTree(tree: Mapping): Conversion {
  if (tree.format !== 'elsa-tree/4') return { tree: null, format: tree.format, endings: 0, left: [] }
  const out = structuredClone(tree)
  out.format = 'elsa-tree/5'
  if (typeof out.$schema === 'string' && SCHEMA_4.test(out.$schema)) out.$schema = out.$schema.replace(/elsa-tree-4\.json$/, 'elsa-tree-5.json')

  const languages = Array.isArray(out.languages) && out.languages.every((tag) => typeof tag === 'string') ? (out.languages as string[]) : null
  let endings = 0
  const left: string[] = []
  for (const node of Array.isArray(out.nodes) ? out.nodes : []) {
    if (!isMapping(node) || !('terminal' in node)) continue
    const terminal = node.terminal
    const outcome = isMapping(terminal) && Object.keys(terminal).length === 1 ? terminal.outcome : undefined
    // `Object.hasOwn`, not `in`: an outcome named `toString` is no outcome of the four.
    const known = typeof outcome === 'string' && Object.hasOwn(ENDING_WORDS.en, outcome)
    if (!known || languages === null) {
      const why = known ? 'languages is not a list of language tags' : 'it is not one of the four outcomes'
      left.push(`"${String(node.id)}": terminal ${JSON.stringify(terminal)} left as it is, ${why}`)
      continue
    }
    node.terminal = { label: Object.fromEntries(languages.map((tag) => [tag, ENDING_WORDS[chromeLanguageOf(tag)][outcome]])) }
    endings += 1
  }
  return { tree: out, format: tree.format, endings, left }
}

/**
 * The chrome language a tag's badge was drawn in (application.md 3.1): Dutch for a tag whose
 * primary subtag is `nl`, English for every other. Spelled out here, not taken from
 * `src/chrome.ts`, because the conversion is frozen with its table: a chrome language added
 * later must not change what a `/4` file converts to.
 */
function chromeLanguageOf(tag: string): 'en' | 'nl' {
  return tag.split('-')[0] === 'nl' ? 'nl' : 'en'
}
