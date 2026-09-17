/**
 * One Node as the Bubble (docs/specs/application.md 10.1, 10.3): the round element in the
 * centre of the tree view, holding the Node's Interior in its text area, and on its rim --
 * outside the text area, so the format's length limits stand -- the one chrome element a
 * Node kind adds: a Terminal's outcome badge above, an explanation Node's hint below.
 */
import type { Chrome, ChromeString } from '../chrome.ts'
import type { Node, Outcome } from '../tree/types.ts'
import { Interior } from './Interior.tsx'

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
}) {
  return (
    // `data-node` names the Node a Bubble draws, so a response can be counted in Nodes (11.5).
    <article className={`bubble bubble--${node.kind}`} lang={lang} data-node={node.id}>
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
