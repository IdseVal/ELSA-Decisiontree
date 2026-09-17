/**
 * One Node as the Bubble (docs/specs/application.md 10.1, 10.3): the round element in the
 * centre of the tree view, holding the Node's Interior in its text area, and on its rim --
 * outside the text area, so the format's length limits stand -- the one chrome element a
 * Node kind adds: a Terminal's outcome badge above. (An explanation Node's hint went with
 * the side slide, 10.9: an explanation Node opens in an Overlay, and is the centre only
 * when a path names no parent for it.)
 */
import type { Chrome, ChromeString } from '../chrome.ts'
import type { Node, Outcome } from '../tree/types.ts'
import { Interior } from './Interior.tsx'

export { sheetWords } from './Interior.tsx'

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
}: {
  node: Node
  lang: string
  ui: Chrome
  /** Set when the chrome speaks another language than the content. */
  uiLang: string | undefined
  /** Prepended to every `id` the Bubble writes, for a copy of it in a neighbour frame. */
  idPrefix?: string
}) {
  return (
    // `data-node` names the Node a Bubble draws, so a response can be counted in Nodes (11.5).
    <article className={`bubble bubble--${node.kind}`} lang={lang} data-node={node.id}>
      {node.kind === 'terminal' && (
        <p className={`outcome outcome--${node.outcome}`} lang={uiLang}>
          {ui[OUTCOME_LABEL[node.outcome]]}
        </p>
      )}

      <div className="bubble-text">
        <Interior node={node} lang={lang} ui={ui} uiLang={uiLang} idPrefix={idPrefix} />
      </div>
    </article>
  )
}
