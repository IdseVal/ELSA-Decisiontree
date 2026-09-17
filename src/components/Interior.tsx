/**
 * The Interior (docs/specs/application.md 10.3): what a Node shows -- its title, its
 * description as rich text and its Sources -- rendered by one component for the Bubble and
 * for every Overlay (10.9), so that a change to one reaches the other. (The main image above
 * the title and the Sources heading arrive with issue #81, here.)
 *
 * In the Bubble the title is the page's `h1`; in an Overlay it is an `h2` that links to the
 * explanation Node's own address, the one plain link on the page that names the aside
 * (10.9). The Sources are rendered inline and, in the Bubble only, once more inside the Sheet
 * they collapse to below the guarantee (10.5, step 6): an Overlay is a Sheet already, and one
 * Sheet is open at a time, so its Sources stay inline at every size.
 */
import { text, type Chrome, type ChromeString } from '../chrome.ts'
import { richTextToHtml } from '../markdown.ts'
import type { Node, Source } from '../tree/types.ts'
import { Sheet, type SheetWords } from './Sheet.tsx'

/** The chrome key that labels each kind of Source (tree-format.md 5.1). */
const SOURCE_LABEL: Record<Source['kind'], ChromeString> = {
  legal: 'sourceLegal',
  'case-law': 'sourceCaseLaw',
  literature: 'sourceLiterature',
}

export function Interior({
  node,
  lang,
  ui,
  uiLang,
  idPrefix,
  href,
}: {
  node: Node
  lang: string
  ui: Chrome
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
  /** Prepended to every `id` written, for a copy in a neighbour frame or in an Overlay. */
  idPrefix: string
  /** In an Overlay: the explanation Node's own address, which its heading links to. Absent in the Bubble. */
  href?: string
}) {
  const title = text(node.title, lang, `${node.id}.title`)
  return (
    <>
      {href === undefined ? (
        <h1 id={`${idPrefix}node-title`}>{title}</h1>
      ) : (
        <h2 id={`${idPrefix}node-title`}>
          <a href={href}>{title}</a>
        </h2>
      )}

      <div
        className="prose"
        dangerouslySetInnerHTML={{
          __html: richTextToHtml(text(node.description, lang, `${node.id}.description`)),
        }}
      />

      {node.sources.length > 0 && (
        <Sources
          sources={node.sources}
          nodeId={node.id}
          lang={lang}
          ui={ui}
          uiLang={uiLang}
          idPrefix={idPrefix}
          collapsible={href === undefined}
        />
      )}
    </>
  )
}

/** The chrome words a Sheet says, taken from the chrome of the page. */
export function sheetWords(ui: Chrome): SheetWords {
  return { close: ui.close, previous: ui.previous, next: ui.next, opensInNewTab: ui.opensInNewTab }
}

/**
 * The Node's Sources, each labelled by its kind, each opening in a new tab: inline on one
 * or two lines of the text area, and, where `collapsible`, as the Sheet the inline list
 * collapses to.
 */
function Sources({
  sources,
  nodeId,
  lang,
  ui,
  uiLang,
  idPrefix,
  collapsible,
}: {
  sources: Source[]
  /** The Node these Sources belong to, for the warning `text` logs. */
  nodeId: string
  lang: string
  ui: Chrome
  uiLang: string | undefined
  idPrefix: string
  collapsible: boolean
}) {
  const entries = sources.map((source, index) => ({
    kind: ui[SOURCE_LABEL[source.kind]],
    href: source.url,
    label: text(source.label, lang, `${nodeId}.sources[${index}].label`),
  }))

  return (
    <>
      <section className="sources" aria-labelledby={`${idPrefix}sources-label`}>
        {/* Both `hidden`, not clipped off screen: a name and a description are read from a
            hidden element all the same, and a clipped element is one whose content is wider
            than itself, which the no-scroll rule forbids (10.6). */}
        <span hidden id={`${idPrefix}sources-label`} lang={uiLang}>
          {ui.sources}
        </span>
        <span hidden id={`${idPrefix}sources-new-tab`} lang={uiLang}>
          {ui.opensInNewTab}
        </span>
        <ul>
          {entries.map((entry) => (
            <li key={`${entry.href} ${entry.label}`}>
              <span className="kind" lang={uiLang}>
                {entry.kind}
              </span>{' '}
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
      {collapsible && (
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
      )}
    </>
  )
}
