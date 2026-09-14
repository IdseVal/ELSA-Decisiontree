/**
 * One Node as the Bubble (docs/specs/application.md 10.1, 10.3): the round element in the
 * centre of the tree view, holding the Node's title, description and Sources in its text
 * area, and on its rim -- outside the text area, so the format's length limits stand -- the
 * one chrome element a Node kind adds: a Terminal's outcome badge above, an explanation
 * Node's hint below.
 *
 * The Sources are rendered twice, once inline and once inside a Sheet, and the stylesheet
 * shows one or the other: below the guaranteed viewport they collapse to one control
 * (10.5, step 5), and the markup must be present either way so the page is correct
 * without JavaScript (section 14).
 */
import { text, type Chrome, type ChromeString } from '../chrome.ts'
import { richTextToHtml } from '../markdown.ts'
import type { Node, Outcome, Source } from '../tree/types.ts'
import { Sheet, type SheetWords } from './Sheet.tsx'

/** The chrome key that labels each kind of Source (tree-format.md 5.1). */
const SOURCE_LABEL: Record<Source['kind'], ChromeString> = {
  legal: 'sourceLegal',
  'case-law': 'sourceCaseLaw',
  literature: 'sourceLiterature',
}

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
}: {
  node: Node
  lang: string
  ui: Chrome
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
}) {
  return (
    <article className={`bubble bubble--${node.kind}`} lang={lang}>
      {node.kind === 'terminal' && (
        <p className={`outcome outcome--${node.outcome}`} lang={uiLang}>
          {ui[OUTCOME_LABEL[node.outcome]]}
        </p>
      )}

      <div className="bubble-text">
        <h1 id="node-title">{text(node.title, lang, `${node.id}.title`)}</h1>

        <div
          className="prose"
          dangerouslySetInnerHTML={{
            __html: richTextToHtml(text(node.description, lang, `${node.id}.description`)),
          }}
        />

        {node.sources.length > 0 && (
          <Sources sources={node.sources} nodeId={node.id} lang={lang} ui={ui} uiLang={uiLang} />
        )}
      </div>

      {node.kind === 'explanation' && (
        <p className="hint" lang={uiLang}>
          {ui.explanationOnly}
        </p>
      )}
    </article>
  )
}

/** The chrome words a Sheet says, taken from the chrome of the page. */
export function sheetWords(ui: Chrome): SheetWords {
  return { close: ui.close, previous: ui.previous, next: ui.next, opensInNewTab: ui.opensInNewTab }
}

/**
 * The Node's Sources, each labelled by its kind, each opening in a new tab: inline on one
 * or two lines of the text area, and as the Sheet the inline list collapses to.
 */
function Sources({
  sources,
  nodeId,
  lang,
  ui,
  uiLang,
}: {
  sources: Source[]
  /** The Node these Sources belong to, for the warning `text` logs. */
  nodeId: string
  lang: string
  ui: Chrome
  uiLang: string | undefined
}) {
  const entries = sources.map((source, index) => ({
    kind: ui[SOURCE_LABEL[source.kind]],
    href: source.url,
    label: text(source.label, lang, `${nodeId}.sources[${index}].label`),
  }))

  return (
    <>
      <section className="sources" aria-labelledby="sources-label">
        {/* Both `hidden`, not clipped off screen: a name and a description are read from a
            hidden element all the same, and a clipped element is one whose content is wider
            than itself, which the no-scroll rule forbids (10.6). */}
        <span hidden id="sources-label" lang={uiLang}>
          {ui.sources}
        </span>
        <span hidden id="sources-new-tab" lang={uiLang}>
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
                aria-describedby="sources-new-tab"
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
        />
      </div>
    </>
  )
}
