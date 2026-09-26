/**
 * `llms.txt` (docs/specs/application.md 16.5, ADR-118-llms-txt): the one short fetch that
 * tells an agent what this site is and where the material it actually wants lives.
 *
 * An agent that lands on a Node page sees one question and two buttons; it has no way to
 * know that behind the walk there is a complete, validated, licensed dataset at one URL.
 * That is the single sentence this file exists to say. **[#134]** With many Trees it lists
 * them first, `## The Trees`, and the datasets second (23.5).
 *
 * **It is a signpost, and carries no Tree content beyond each manifest's title and
 * description.** Node titles, descriptions and Sources are in the pages, in the sitemap
 * and in the dataset; a fourth copy would be the one that goes stale. There is no
 * `llms-full.txt` for the same reason: `/<tree-id>/tree.json` already is one, with a
 * schema and a validator behind it (16.5).
 */
import { CODE_LICENCE_URL, CONTENT_LICENCE_URL } from '../assets.ts'
import { chrome, text } from '../chrome.ts'
import { plainDescription } from '../markdown.ts'
import type { Tree } from '../tree/loader.ts'
import { absolute, datasetHref, overviewHref, rootHref, SCHEMA_HREF } from '../url.ts'

/**
 * The holder of the Tree content: the `Copyright (c)` line of `CONTENT-LICENSE`.
 *
 * A constant of the deployment rather than a name parsed out of the licence text at
 * startup, which is brittle in a way that fails silently. `tests/findability/llms.test.ts`
 * greps the line out of the file and compares, so the day it changes fails loudly, which
 * is the only day it matters (ADR-118-json-ld decision 3, application.md 16.4).
 */
export const CONTENT_HOLDER = 'Wageningen University & Research'

/** One served Tree as `llms.txt` lists it. */
export interface LlmsTree {
  tree: Tree
  /**
   * The root Node's description in the Tree's default language, which the Tree's entry falls
   * back to when the manifest carries none: the manifest's is optional in the format, the
   * root Node's is not (16.5).
   */
  rootDescription: string
}

/**
 * The document, built against the base the route was given (16). **[#134]** The
 * deployment's, not one Tree's (23.5): its H1 and blockquote are chrome, and every served
 * Tree is one line of each section that names a Tree, in the order given -- the store's id
 * order. A Tree's title and description are in that Tree's **default** language; the rest
 * is English chrome. Every URL in it is absolute, because the file is read away from the
 * site that served it.
 */
export function llmsTxt(trees: LlmsTree[], base: URL): string {
  const url = (href: string): string => absolute(href, base)
  const ui = chrome('en')

  return [
    `# ${ui.siteTitle}`,
    '',
    `> ${ui.siteDescription}`,
    '',
    ...preamble(),
    '',
    '## The Trees',
    '',
    ...trees.map(({ tree, rootDescription }) => {
      const { title, description, defaultLanguage: lang } = tree.manifest
      const summary = description ? text(description, lang, 'tree.description') : rootDescription
      // The description as written, with no period of this file's added to its own.
      return `- [${oneLine(text(title, lang, 'tree.title'))}](${url(rootHref(tree, lang))}): ${plainDescription(summary).reduced}`
    }),
    '',
    '## The datasets',
    '',
    ...trees.map(({ tree }) =>
      entry(
        `${oneLine(text(tree.manifest.title, tree.manifest.defaultLanguage, 'tree.title'))}: the Tree file`,
        url(datasetHref(tree.id)),
        'every step of the tree, its text, its legal sources and its pictures, as one JSON file -- byte for byte the file this site serves its pages from',
      ),
    ),
    entry(
      'The JSON Schema',
      url(SCHEMA_HREF),
      'the structure every Tree file is checked against, and which it passed before any page of it was served',
    ),
    '',
    '## Walking a Tree',
    '',
    entry('The overview', url(overviewHref('en')), 'every tree this site serves, each a link to where its walk begins'),
    entry('Sitemap', url('/sitemap.xml'), 'every step of every tree, in every language'),
    // The grammar rather than a list of addresses: an agent can then reach any step
    // without guessing, and the file does not grow with the Trees (16.5).
    '- The address of one step is `/<tree-id>/<step-id>`. A longer path is the trail of steps visited, the last id being the step shown, and `?lang=<tag>` chooses the language, one of those the tree declares below.',
    '',
    '## Languages',
    '',
    ...trees.map(({ tree }) => {
      const { languages, defaultLanguage } = tree.manifest
      return `- \`${tree.id}\`: ${languages.map((tag) => `\`${tag}\`${tag === defaultLanguage ? ' (default)' : ''}`).join(', ')}`
    }),
    '',
    '## Licence',
    '',
    `- The content of the Tree -- its text, its structure and the images the authors made themselves -- is [CC BY 4.0](${CONTENT_LICENCE_URL}), (c) ${CONTENT_HOLDER}. Images copied from elsewhere keep their own licence, recorded in each picture's credit in the Tree file.`,
    `- The code of this application is [MIT](${CODE_LICENCE_URL}). Tree content and code are licensed separately.`,
    '',
  ].join('\n')
}

/**
 * A title as one line. It is plain text and may hold no line break (V-PLAIN), but this
 * document's shape is its line structure, so nothing enters it that could add a line.
 */
function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/** One `- [name](url): note` entry, the form the convention gives a section's list. */
function entry(name: string, url: string, note: string): string {
  return `- [${name}](${url}): ${note}.`
}

/**
 * The free-form paragraph the convention allows before the first heading: **chrome, not
 * Tree content**. It says what kind of thing this site is, that every step is a page with
 * an address, and that each tree is one JSON file -- the three facts an agent cannot infer
 * from a single Node page -- and it closes with the same disclaimer every page of the
 * application carries permanently (core document 8).
 */
function preamble(): string[] {
  return [
    'This site serves interactive legal decision trees: a reader answers one question at a',
    'time and arrives at an outcome. Every step is a page of its own with a real URL, so',
    'any step can be linked to, quoted and revisited, and each tree is one JSON file.',
    chrome('en').disclaimer,
  ]
}
