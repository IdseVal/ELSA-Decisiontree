/**
 * The conversion of docs/specs/tree-format.md 12.7, from `elsa-tree/4` to `elsa-tree/5`
 * (ADR-171-elsa-tree-5): the format's two names of itself, and every Terminal, whose
 * `outcome` becomes the words its badge showed, `terminal.label`. Nothing else changes.
 * **[#221]** And 12.8's, from `elsa-tree/5` to `elsa-tree/6` (ADR-220-elsa-tree-6): the two
 * names again, and every `answers`, whose `yes` and `no` become an array of next steps
 * labelled with the words their buttons showed. A `/4` file takes both, in that order.
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

/**
 * **[#221]** The words of `elsa-tree/5`'s two Answer buttons, as `src/chrome.ts`'s `yes` and
 * `no` stood on 2026-10-09: the table of 12.8.1 step 5, frozen there so that the conversion
 * does not change with the chrome.
 */
const ANSWER_WORDS: Record<'en' | 'nl', Record<'yes' | 'no', string>> = {
  en: { yes: 'Yes', no: 'No' },
  nl: { yes: 'Ja', no: 'Nee' },
}

/** The `$schema` grammar of `elsa-tree/4` (schemas/elsa-tree-4.json): the path, or an http(s) URL whose path ends with it. */
const SCHEMA_4 = /^(?:\/|https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?\/)schemas\/elsa-tree-4\.json$/

/** **[#221]** The same grammar for `elsa-tree/5` (schemas/elsa-tree-5.json). */
const SCHEMA_5 = /^(?:\/|https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?\/)schemas\/elsa-tree-5\.json$/

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

  const languages = languagesOf(out)
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

/** **[#221]** What `convertAnswers` did to one file. */
export interface AnswersConversion {
  /** The converted file; null for a file that is not `elsa-tree/5`, which is left alone (12.8.1 step 2). */
  tree: Mapping | null
  /** The file's own `format`: what a file left alone is reported with. */
  format: unknown
  /** How many `answers` became an array of next steps (step 5). */
  steps: number
  /** Each `answers` left as it was, by Node id and what it holds, to fail V-ANSWERS afterwards (step 5). */
  left: string[]
}

/**
 * **[#221]** Steps 2 to 6 of 12.8.1 on `tree`, a parsed file the loader's reader accepted
 * (step 1) or `convertTree`'s answer. A file that is not `elsa-tree/5` -- `elsa-tree/6`
 * included, which makes the procedure idempotent -- is answered with `tree` null. Otherwise
 * the answer is a copy with `format` and `$schema` naming `/6` and every `answers` whose keys
 * are among `yes` and `no`, each a string, made an array: the yes first, then the no, a key it
 * lacks left out, each labelled for each declared language, in the manifest's order, with the
 * word its button showed in that language. Any other `answers`, and every one of a file whose
 * `languages` is not a list of strings, is left as it is and reported.
 */
export function convertAnswers(tree: Mapping): AnswersConversion {
  if (tree.format !== 'elsa-tree/5') return { tree: null, format: tree.format, steps: 0, left: [] }
  const out = structuredClone(tree)
  out.format = 'elsa-tree/6'
  if (typeof out.$schema === 'string' && SCHEMA_5.test(out.$schema)) out.$schema = out.$schema.replace(/elsa-tree-5\.json$/, 'elsa-tree-6.json')

  const languages = languagesOf(out)
  let steps = 0
  const left: string[] = []
  for (const node of Array.isArray(out.nodes) ? out.nodes : []) {
    if (!isMapping(node) || !('answers' in node)) continue
    const answers = isMapping(node.answers) ? node.answers : null
    const known = answers !== null && Object.keys(answers).every((key) => (key === 'yes' || key === 'no') && typeof answers[key] === 'string')
    if (!known || languages === null) {
      const why = known ? 'languages is not a list of language tags' : 'it is not an object of a "yes" and a "no"'
      left.push(`"${String(node.id)}": answers ${JSON.stringify(node.answers)} left as it is, ${why}`)
      continue
    }
    node.answers = (['yes', 'no'] as const)
      .filter((key) => key in answers)
      .map((key) => ({ label: Object.fromEntries(languages.map((tag) => [tag, ANSWER_WORDS[chromeLanguageOf(tag)][key]])), target: answers[key] }))
    steps += 1
  }
  return { tree: out, format: tree.format, steps, left }
}

/** The file's `languages` when it is a list of strings, which both conversions need to write a label; null otherwise. */
function languagesOf(tree: Mapping): string[] | null {
  return Array.isArray(tree.languages) && tree.languages.every((tag) => typeof tag === 'string') ? (tree.languages as string[]) : null
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
