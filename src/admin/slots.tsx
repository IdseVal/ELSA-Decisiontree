/**
 * The editor page's `EditMode` (docs/specs/application.md 34.1, 34.2): the words the
 * editor's client components say and the slots of #138 -- `field` for every text and select
 * of 28.1 that this issue edits, `operation` for the two Source operations. Later issues
 * add their slot functions to the object this module builds, one line each (ADR-133-build-order).
 *
 * Server side: it reads the chrome and builds client elements with string props.
 */
import type { ReactNode } from 'react'
import { chrome, chromeLang, type Chrome } from '../chrome.ts'
import { OUTCOME_LABEL, sheetWords, SOURCE_LABEL } from '../components/Bubble.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { editorLinks } from '../editor/links.ts'
import { AddSourceForm, Field, Operation, type FieldWords, type OtherLanguage } from '../editor/Field.tsx'
import type { EditMode, EditorSlots, EditorWords } from '../editor/mode.ts'
import type { Explainer, NodeContent, Outcome, Source } from '../tree/types.ts'
import type { PageAddress } from '../url.ts'

/** The chrome strings the editor's client components read through `words`, as strings. */
function editorWords(ui: Chrome): EditorWords {
  return {
    missingText: ui.missingText,
    characters: ui.characters,
    lines: ui.lines,
    saving: ui.saving,
    saved: ui.saved,
    notSaved: ui.notSaved,
    retrying: ui.retrying,
    retry: ui.retry,
    notEditable: ui.notEditable,
    changedElsewhere: ui.changedElsewhere,
    sessionExpired: ui.sessionExpired,
    publicBehind: ui.publicBehind,
    toOverview: ui.toOverview,
  }
}

/** The paths this issue edits in place; an Image's texts wait for #140 (the issue's task 1). */
const EDITED = /^(title|description|sources\[\d+\]\.(label|kind|url)|options\[\d+\]\.title|terminal\.outcome)$/

/** Which paths hold a localised text: the page's language is appended to their key path (22.2). */
const LOCALISED = /^(title|description|sources\[\d+\]\.label|options\[\d+\]\.title)$/

const KINDS: Source['kind'][] = ['legal', 'case-law', 'literature']
const OUTCOMES: Outcome[] = ['not-applicable', 'applicable', 'prohibited', 'refer']

/** The edit mode of the page at `address`, whose draft declares `languages`. */
export function editMode(address: PageAddress, languages: string[]): EditMode {
  const lang = address.lang
  const ui = chrome(lang)
  const uiLang = chromeLang(lang)
  const words = editorWords(ui)
  const links = editorLinks()
  const fieldWords: FieldWords = { missingText: words.missingText, characters: words.characters, lines: words.lines }
  const others: OtherLanguage[] = languages.filter((other) => other !== lang).map((other) => ({ lang: other, href: links.withLang(address, other) }))
  const outcomes = OUTCOMES.map((outcome) => ({ value: outcome, label: ui[OUTCOME_LABEL[outcome]] }))
  // The badge leaves `legal` unlabelled under its heading (ADR-78); a select must name every kind.
  const kinds = KINDS.map((kind) => ({ value: kind, label: ui[SOURCE_LABEL[kind] ?? 'sourceLegal'] }))

  const slots: EditorSlots = {
    field(node, path, value, limit, rendered) {
      if (!EDITED.test(path)) return null
      const localised = LOCALISED.test(path)
      const common = { nodeId: node.id, path, lang: localised ? lang : null, value, limit, others, words: fieldWords }
      if (path === 'terminal.outcome') {
        return <Field {...common} select={outcomes} label={ui.outcome} className="outcome" classByValue />
      }
      if (path.endsWith('.kind')) {
        return <Field {...common} select={kinds} label={ui.sourceKind} />
      }
      if (path === 'description') {
        return <Field {...common} rich rendered={rendered} explainers={node.explainers as Explainer[]} />
      }
      return <Field {...common} />
    },
    operation(node: NodeContent, op, index): ReactNode {
      // `+ addSource` is a Sheet holding the kind and the URL: the schema requires a URL, so
      // nothing is sent before one is typed (28.1); the new label then takes the focus.
      if (op === 'add-source') {
        return (
          <Sheet
            className="source-sheet source-sheet--add"
            name="source-sheet"
            summary={<span lang={uiLang}>{`+ ${ui.addSource}`}</span>}
            pages={[
              <AddSourceForm
                key="add"
                nodeId={node.id}
                focusPath={`sources[${node.sources.length}].label.${lang}`}
                kinds={kinds}
                words={{ addSource: ui.addSource, sourceKind: ui.sourceKind, sourceUrl: ui.sourceUrl }}
              />,
            ]}
            words={sheetWords(ui)}
            uiLang={uiLang}
            idPrefix={`${node.id}-add-source-`}
          />
        )
      }
      return <Operation nodeId={node.id} change={{ op: 'remove-source', index }} label={ui.removeSource} className="admin-submit" />
    },
  }
  return { treeId: address.treeId, links, languages, words, slots }
}
