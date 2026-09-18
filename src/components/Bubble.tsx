/**
 * One Node as the Bubble (docs/specs/application.md 10.1, 10.3): the round element in the
 * centre of the tree view, holding the Node's Interior in its text area, and on its rim --
 * outside the text area, so the format's length limits stand -- the up arrow on the top
 * outline where the page has a way back, and the one chrome element a Node kind adds: a
 * Terminal's outcome badge above, an explanation Node's hint below.
 *
 * The Interior (10.3, ADR-78-main-image-and-row-budget, ADR-78-sources-heading) is what a
 * Node shows inside its text area, in order -- the main image, the title, the description
 * and the Sources under their chrome heading. It is exported because the Overlay (10.9)
 * renders it too, so a change here reaches both.
 *
 * The main image is the Node's first Image, a link to its file that opens the enlarged view
 * (12.3). A Node without Images keeps the same 60 pixels as an empty slot, so the title sits
 * at the same height on every Node and a slide has nothing to reflow.
 *
 * The Sources are rendered twice, once inline and once inside a Sheet, and the stylesheet
 * shows one or the other: below the guaranteed viewport they collapse to one control (10.5,
 * step 6), and the markup must be present either way so the page is correct without
 * JavaScript (section 14).
 */
import type { ReactNode } from 'react'
import { text, type Chrome, type ChromeString } from '../chrome.ts'
import { richTextToHtml } from '../markdown.ts'
import type { Node, Outcome, Source } from '../tree/types.ts'
import { imageHref } from '../url.ts'
import { Sheet, type SheetWords } from './Sheet.tsx'

/** The chrome key that names each Terminal outcome (tree-format.md 5.5). */
const OUTCOME_LABEL: Record<Outcome, ChromeString> = {
  'not-applicable': 'outcomeNotApplicable',
  applicable: 'outcomeApplicable',
  prohibited: 'outcomeProhibited',
  refer: 'outcomeRefer',
}

export function Bubble({
  node,
  lang,
  ui,
  uiLang,
  idPrefix = '',
  pictures = true,
  up,
}: {
  node: Node
  lang: string
  ui: Chrome
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
  /** Prepended to every `id` the Bubble writes, for a copy of it in a neighbour frame. */
  idPrefix?: string
  /** False in a neighbour frame, which names no image file at all (11.4). */
  pictures?: boolean
  /**
   * The up arrow (10.2), drawn on the top outline. It is placed from the Bubble's own box
   * because the Bubble is centred in its row: a Bubble shorter than the row would leave an
   * arrow placed from the row floating above it.
   */
  up: ReactNode
}) {
  return (
    // `data-node` names the Node a Bubble draws, so a response can be counted in Nodes (11.5).
    <article className={`bubble bubble--${node.kind}`} lang={lang} data-node={node.id}>
      {up}
      {node.kind === 'terminal' && (
        <p className={`outcome outcome--${node.outcome}`} lang={uiLang}>
          {ui[OUTCOME_LABEL[node.outcome]]}
        </p>
      )}

      <Interior node={node} lang={lang} ui={ui} uiLang={uiLang} idPrefix={idPrefix} pictures={pictures} />

      {node.kind === 'explanation' && (
        <p className="hint" lang={uiLang}>
          {ui.explanationOnly}
        </p>
      )}
    </article>
  )
}

/**
 * The chrome key that labels a kind of Source. `legal` has none: under the heading "Legal
 * sources" the label only repeats it (ADR-78-sources-heading, decision 2).
 */
const SOURCE_LABEL: Partial<Record<Source['kind'], ChromeString>> = {
  'case-law': 'sourceCaseLaw',
  literature: 'sourceLiterature',
}

/** The chrome words a Sheet says, taken from the chrome of the page. */
export function sheetWords(ui: Chrome): SheetWords {
  return { close: ui.close, previous: ui.previous, next: ui.next, opensInNewTab: ui.opensInNewTab }
}

export function Interior({
  node,
  lang,
  ui,
  uiLang,
  idPrefix = '',
  pictures = true,
}: {
  node: Node
  lang: string
  ui: Chrome
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
  /** Prepended to every `id` the Interior writes, for a copy of it in a neighbour frame. */
  idPrefix?: string
  /** False in a neighbour frame, which names no image file at all (11.4). */
  pictures?: boolean
}) {
  return (
    <div className="bubble-text">
      <MainImage node={node} lang={lang} ui={ui} uiLang={uiLang} idPrefix={idPrefix} pictures={pictures} />

      <h1 id={`${idPrefix}node-title`}>{text(node.title, lang, `${node.id}.title`)}</h1>

      <div
        className="prose"
        dangerouslySetInnerHTML={{
          __html: richTextToHtml(text(node.description, lang, `${node.id}.description`), {
            explainers: node.explainers,
            lang,
            idPrefix,
          }),
        }}
      />

      {node.sources.length > 0 && (
        <Sources sources={node.sources} nodeId={node.id} lang={lang} ui={ui} uiLang={uiLang} idPrefix={idPrefix} />
      )}
    </div>
  )
}

/**
 * The main image above the title (10.3): a link to its file, named by `enlarge` and its
 * description and described by its credit, which the enlarged view shows whole (12.3). The
 * empty slot stands in on a Node without Images, and in a neighbour frame, which carries no
 * image URL; both are decoration and say nothing to assistive technology.
 */
function MainImage({
  node,
  lang,
  ui,
  uiLang,
  idPrefix,
  pictures,
}: {
  node: Node
  lang: string
  ui: Chrome
  uiLang: string | undefined
  idPrefix: string
  pictures: boolean
}) {
  const image = node.images[0]
  if (!image) return <span className="main-image main-image--empty" aria-hidden="true" />
  if (!pictures) return <span className="main-image main-image--withheld" aria-hidden="true" />

  const href = imageHref(image.file)
  return (
    <>
      {/* Hidden, not clipped: read as a name and a description all the same, and never wider than themselves (10.6). */}
      <span hidden id={`${idPrefix}main-image-enlarge`} lang={uiLang}>
        {ui.enlarge}
      </span>
      <span hidden id={`${idPrefix}main-image-credit`}>
        {image.credit}
      </span>
      {/* `data-enlarge` is the page of the enlarged view it opens: the main image is the first. */}
      <a
        className="main-image"
        href={href}
        data-enlarge="0"
        aria-labelledby={`${idPrefix}main-image-enlarge ${idPrefix}main-image-picture`}
        aria-describedby={`${idPrefix}main-image-credit`}
      >
        <img
          id={`${idPrefix}main-image-picture`}
          src={href}
          alt={text(image.description, lang, `${node.id}.images[${image.file}].description`)}
          width={90}
          height={60}
        />
      </a>
    </>
  )
}

/**
 * The Node's Sources under the heading `sources`, each opening in a new tab and prefixed by
 * its kind where the kind is not `legal`: inline on the heading line and two lines of the
 * text area, and as the Sheet the block collapses to, titled by the same key.
 */
function Sources({
  sources,
  nodeId,
  lang,
  ui,
  uiLang,
  idPrefix,
}: {
  sources: Source[]
  /** The Node these Sources belong to, for the warning `text` logs. */
  nodeId: string
  lang: string
  ui: Chrome
  uiLang: string | undefined
  idPrefix: string
}) {
  const entries = sources.map((source, index) => {
    const label = SOURCE_LABEL[source.kind]
    return {
      kind: label && ui[label],
      href: source.url,
      label: text(source.label, lang, `${nodeId}.sources[${index}].label`),
    }
  })

  return (
    <>
      <section className="sources" aria-labelledby={`${idPrefix}sources-label`}>
        <h2 id={`${idPrefix}sources-label`} lang={uiLang}>
          {ui.sources}
        </h2>
        {/* Hidden, not clipped: read as a description all the same, and never wider than itself (10.6). */}
        <span hidden id={`${idPrefix}sources-new-tab`} lang={uiLang}>
          {ui.opensInNewTab}
        </span>
        <ul>
          {entries.map((entry) => (
            <li key={`${entry.href} ${entry.label}`}>
              {entry.kind !== undefined && (
                <>
                  <span className="kind" lang={uiLang}>
                    {entry.kind}
                  </span>{' '}
                </>
              )}
              <a
                href={entry.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-describedby={`${idPrefix}sources-new-tab`}
              >
                {entry.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <div className="sources-collapsed">
        <Sheet
          className="sources-sheet"
          summary={<span lang={uiLang}>{`${ui.sources} (${entries.length})`}</span>}
          items={entries.map((entry) => ({ ...entry, newTab: true }))}
          words={sheetWords(ui)}
          uiLang={uiLang}
          idPrefix={idPrefix}
        />
      </div>
    </>
  )
}
