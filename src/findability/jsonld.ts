/**
 * The JSON-LD graph of one page (docs/specs/application.md 16.4, ADR-118-json-ld): one
 * `@graph`, a `Dataset` on the root Node's page alone, a `WebPage` on every page, and a
 * `Question` as a question Node's `mainEntity`.
 *
 * Google Dataset Search and the indexes behind the AI assistants do not read prose. A
 * `Dataset` that names a licence and a download is what makes a page a dataset record
 * rather than a web page that mentions data. It is carried once and referred to by `@id`
 * from every other page, and that `@id` does not change with the page's language, so the
 * English pages and the Dutch pages belong to one dataset and not two.
 *
 * Every address here comes from `url.ts`'s address set -- the same call the page head and
 * the sitemap render -- so a page's canonical link, its `<loc>` and its `@id` are one
 * string, which is what lets a crawler read all three as one graph.
 *
 * The page is a `WebPage` and never a `QAPage` or an `FAQPage`: those say the page is
 * community question-and-answer, and a step of a legal decision aid is not that. Claiming
 * a type to win a rich result would be a misstatement about structure in a document whose
 * value is that it is trustworthy.
 */
import { CONTENT_LICENCE_URL } from '../assets.ts'
import { chrome, text } from '../chrome.ts'
import { plainDescription } from '../markdown.ts'
import type { Tree } from '../tree/loader.ts'
import type { Node } from '../tree/types.ts'
import { absolute, addressSet, datasetHref } from '../url.ts'
import { CONTENT_HOLDER } from './llms.ts'

/** One served format of the dataset (15.1). */
interface DataDownload {
  '@type': 'DataDownload'
  contentUrl: string
  encodingFormat: string
}

/** Who holds the content licence: the `Copyright (c)` line of `CONTENT-LICENSE`. */
interface Organization {
  '@type': 'Organization'
  name: string
}

/**
 * One Answer of a question Node. `suggestedAnswer` and never `acceptedAnswer`: which
 * answer is right depends on the reader's own system, which is the whole point of the Tree.
 */
interface Answer {
  '@type': 'Answer'
  /** The exact label the button carries: the chrome word, a colon and the target's title. */
  text: string
  url: string
}

/** The question a question Node asks, as its page's `mainEntity` -- not as its type. */
export interface Question {
  '@type': 'Question'
  '@id': string
  name: string
  /** The description reduced to plain text and **never cut**: a question closed with an
   * ellipsis is a different question, and this is a legal aid (16.3). */
  text: string
  inLanguage: string
  suggestedAnswer: Answer[]
}

/** The record of one page, in one language. Every Node page carries one. */
export interface WebPage {
  '@type': 'WebPage'
  '@id': string
  url: string
  name: string
  /** The cut string of 16.3: the same bytes `<meta name="description">` carries. */
  description?: string
  inLanguage: string
  isPartOf: { '@id': string }
  mainEntity?: Question
}

/** The record of the Tree as data, carried by the root Node's page alone. */
export interface Dataset {
  '@type': 'Dataset'
  '@id': string
  /** Google requires `name` and `description`, so 16.4 leaves neither to chance. */
  name: string
  description: string
  url: string
  license: string
  creator: Organization
  version: string
  inLanguage: string[]
  isAccessibleForFree: true
  distribution: DataDownload[]
  /** Omitted for a Tree that cites no legal Source (16.4). */
  isBasedOn?: string
}

/** What one page's `<script type="application/ld+json">` holds. */
export interface Graph {
  '@context': 'https://schema.org'
  '@graph': Array<Dataset | WebPage>
}

/**
 * The graph of the page that shows `node` in `lang`, built against the base the route was
 * given (16). `node` is the Node the **address** names, which is the Node the page head
 * describes too -- an explanation Node reached through an Option renders its parent's page
 * with an Overlay open, and its `WebPage` is that address's (10.9, 16.4).
 *
 * Asynchronous because of `isBasedOn` alone, which counts the Sources of every Node
 * (`mostCitedLegalSource`). That reads the whole Tree out of the in-memory index and puts
 * one URL in the response, so the bound of 5.2 -- on what a page **carries** -- is untouched.
 */
export async function pageGraph(tree: Tree, node: Node, lang: string, base: URL): Promise<Graph> {
  const page = webPage(tree, node, lang, base)
  return {
    '@context': 'https://schema.org',
    '@graph': node.id === tree.manifest.root ? [await dataset(tree, node, lang, base), page] : [page],
  }
}

/**
 * `<base>/<tree-id>#dataset` (16.4). It carries no `?lang`, which is the whole point: an
 * `@id` that changed with the page's language would state two datasets where there is one.
 */
export function datasetId(tree: Tree, base: URL): string {
  return `${absolute(`/${tree.id}`, base)}#dataset`
}

/**
 * The text of the `<script>` element, or **null when it must not be emitted** (16.4).
 *
 * Two things happen here, and they are two checks rather than one because the second is at
 * the sink. Every `<` of the serialised graph is replaced by the JSON escape for it -- the
 * six characters `\u003c` -- which a consumer's parser reads back as `<`, so the object is
 * unchanged while the bytes in the element can no longer spell `</script>`: no title,
 * description, credit or origin can close the element it sits in. An HTML entity would not
 * do it, since the content of a `<script>` element is not entity-decoded and `&lt;` would
 * land in the JSON as four literal characters. The payload is then tested for the two
 * sequences that end a script -- `</script` and `<!--` -- and dropped if either survived.
 * The test cannot fire while the escape above is correct, which is exactly why it is here:
 * it is the assertion that the escape is still correct, and its cost is one regexp a page.
 */
export function graphScript(graph: Graph): string | null {
  const payload = JSON.stringify(graph).replaceAll('<', LESS_THAN)
  return closesTheElement(payload) ? null : payload
}

/**
 * Whether `payload` holds either sequence that ends a `<script>` element's content: its end
 * tag, in any case, or a comment's opening. Exported because it is the second of the two
 * checks 16.4 asks for and the one the escape above makes unreachable -- a check no test
 * can reach through `graphScript` is a check nobody knows still works.
 */
export function closesTheElement(payload: string): boolean {
  return /<\/script|<!--/i.test(payload)
}

/** The JSON escape for `<` (U+003C), written so that no editor can fold it into the character. */
const LESS_THAN = '\\u003c'

/**
 * What the Tree is based on: the most frequent `url` among its `kind: legal` Sources,
 * compared after dropping fragment and query so that twenty citations of twenty articles
 * of one instrument count as one instrument, and the URL emitted being the first of the
 * winning group in Node order. Null for a Tree that cites no legal Source.
 *
 * **The emitted value is a Source's URL as the Tree wrote it, not the stripped comparison
 * key.** The key of the first Tree's Sources is `https://eur-lex.europa.eu/legal-content/
 * EN/TXT/`, which identifies no instrument at all: it is the query that names the AI Act
 * there. `isBasedOn` has to name the thing a reader following the page's own links arrives
 * at (ADR-118-json-ld decision 4), and only the URL as written does.
 *
 * Derived from the Tree rather than written into the code, so that a third-party Tree about
 * another instrument gets its own with no code change -- the interoperability requirement
 * of core document 3.1, applied to metadata.
 */
export async function mostCitedLegalSource(tree: Tree): Promise<string | null> {
  // Insertion order is Node order, and `>` below never displaces an earlier entry, which
  // together are 16.4's "ties broken by first occurrence in Node order".
  const cited = new Map<string, { url: string; count: number }>()
  for (const id of tree.nodeIds()) {
    const node = await tree.getNode(id)
    for (const source of node?.sources ?? []) {
      if (source.kind !== 'legal') continue
      const seen = cited.get(instrument(source.url))
      if (seen) seen.count += 1
      else cited.set(instrument(source.url), { url: source.url, count: 1 })
    }
  }

  let most: { url: string; count: number } | null = null
  for (const entry of cited.values()) if (!most || entry.count > most.count) most = entry
  return most?.url ?? null
}

/** A Source URL without fragment or query: what two citations of one instrument share. */
function instrument(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    parsed.search = ''
    return parsed.href
  } catch {
    // Not a URL this module can take apart; then it is its own comparison key.
    return url
  }
}

/** The `Dataset`, from the manifest, the licence and the endpoint (16.4). */
async function dataset(tree: Tree, root: Node, lang: string, base: URL): Promise<Dataset> {
  const { manifest } = tree
  // The manifest's description is optional in the format and `description` is one of
  // Google's two requirements, so a required field is not left resting on an optional one.
  const summary = manifest.description
    ? text(manifest.description, lang, 'tree.description')
    : text(root.description, lang, `${root.id}.description`)
  const isBasedOn = await mostCitedLegalSource(tree)

  return {
    '@type': 'Dataset',
    '@id': datasetId(tree, base),
    name: text(manifest.title, lang, 'tree.title'),
    description: plainDescription(summary).reduced,
    url: addressOf(tree, manifest.root, lang, base),
    license: CONTENT_LICENCE_URL,
    creator: { '@type': 'Organization', name: CONTENT_HOLDER },
    version: manifest.metadata.version,
    inLanguage: manifest.languages,
    isAccessibleForFree: true,
    distribution: [
      {
        '@type': 'DataDownload',
        contentUrl: absolute(datasetHref(tree.id), base),
        encodingFormat: 'application/json',
      },
    ],
    // A Tree about no instrument names none, rather than one it is not about.
    ...(isBasedOn === null ? {} : { isBasedOn }),
  }
}

/** The `WebPage` every Node page carries, with a question Node's `Question` under it. */
function webPage(tree: Tree, node: Node, lang: string, base: URL): WebPage {
  const url = addressOf(tree, node.id, lang, base)
  const description = node.description[lang]

  return {
    '@type': 'WebPage',
    '@id': url,
    url,
    name: text(node.title, lang, `${node.id}.title`),
    // The cut string, byte for byte what `<meta name="description">` carries: the WebPage
    // is the record of this page, and the two may not describe it differently (16.3).
    ...(description === undefined ? {} : { description: plainDescription(description).cut }),
    inLanguage: lang,
    isPartOf: { '@id': datasetId(tree, base) },
    // A Terminal is an outcome, not a question; an explanation Node has no answers of its
    // own. Both carry the WebPage and nothing more, and the Options are mapped nowhere:
    // an Option opens an aside the reader comes back from, which `schema.org` has no term
    // for, and inventing a `suggestedAnswer` for it would say the opposite of what it means.
    ...(node.kind === 'question' ? { mainEntity: question(tree, node, lang, base, url) } : {}),
  }
}

/** The `Question`, with its two Answers in the order the buttons stand: yes, then no. */
function question(
  tree: Tree,
  node: Extract<Node, { kind: 'question' }>,
  lang: string,
  base: URL,
  pageUrl: string,
): Question {
  const words = chrome(lang)
  return {
    '@type': 'Question',
    '@id': `${pageUrl}#question`,
    name: text(node.title, lang, `${node.id}.title`),
    text: plainDescription(text(node.description, lang, `${node.id}.description`)).reduced,
    inLanguage: lang,
    suggestedAnswer: [
      answer(tree, words.yes, node.answers.yes, lang, base),
      answer(tree, words.no, node.answers.no, lang, base),
    ],
  }
}

/**
 * One Answer: the exact label its button carries (10.3) and where it leads. The title comes
 * from the in-memory title index, as the button's does, so the two cannot differ.
 */
function answer(tree: Tree, word: string, targetId: string, lang: string, base: URL): Answer {
  const title = text(tree.getTitle(targetId) ?? {}, lang, `${targetId}.title`)
  return { '@type': 'Answer', text: `${word}: ${title}`, url: addressOf(tree, targetId, lang, base) }
}

/** The canonical URL of `nodeId` in `lang`, from the one address set of 16.3. */
function addressOf(tree: Tree, nodeId: string, lang: string, base: URL): string {
  const { addresses } = addressSet(tree, nodeId, base)
  // `lang` is always a declared language: `parseUrl` normalises it before a page renders.
  return addresses.find((entry) => entry.lang === lang)?.url ?? addresses[0]!.url
}
