/**
 * The editor page's `EditMode` (docs/specs/application.md 34.1, 34.2): the words the
 * editor's client components say and the slots of #138 -- `field` for every text and select
 * of 28.1 that this issue edits, `operation` for the two Source operations. Later issues
 * add their slot functions to the object this module builds, one line each (ADR-133-build-order).
 *
 * Server side: it reads the chrome and builds client elements with string props.
 */
import type { ReactNode } from 'react'
import { chrome, type Chrome } from '../chrome.ts'
import { editorLinks } from '../editor/links.ts'
import { Field, Operation, type FieldWords, type OtherLanguage } from '../editor/Field.tsx'
import type { EditMode, EditorSlots, EditorWords, FieldLimit } from '../editor/mode.ts'
import type { Explainer, NodeContent, Outcome, Source } from '../tree/types.ts'
import type { PageAddress } from '../url.ts'

/** The chrome strings of 3.2's #138 block and the few older ones the editor's components say. */
export function editorWords(lang: string): EditorWords {
  const ui = chrome(lang)
  return {
    missingText: ui.missingText,
    characters: ui.characters,
    lines: ui.lines,
    addSource: ui.addSource,
    editSource: ui.editSource,
    removeSource: ui.removeSource,
    sourceKind: ui.sourceKind,
    sourceUrl: ui.sourceUrl,
    sourceLegal: ui.sourceLegal,
    sourceCaseLaw: ui.sourceCaseLaw,
    sourceLiterature: ui.sourceLiterature,
    outcome: ui.outcome,
    outcomeNotApplicable: ui.outcomeNotApplicable,
    outcomeApplicable: ui.outcomeApplicable,
    outcomeProhibited: ui.outcomeProhibited,
    outcomeRefer: ui.outcomeRefer,
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

/** A new Source (28.1): the `legal` kind, an empty label -- and a URL, because the schema requires one and the Sheet is where it is set. */
export const NEW_SOURCE_URL = 'https://example.org/'

/** The edit mode of the page at `address`, whose draft declares `languages`. */
export function editMode(address: PageAddress, languages: string[]): EditMode {
  const lang = address.lang
  const ui = chrome(lang)
  const words = editorWords(lang)
  const links = editorLinks()
  const fieldWords: FieldWords = { missingText: words.missingText, characters: words.characters, lines: words.lines }
  const others: OtherLanguage[] = languages.filter((other) => other !== lang).map((other) => ({ lang: other, href: links.withLang(address, other) }))

  const slots: EditorSlots = {
    field(node, path, value, limit, rendered) {
      if (!EDITED.test(path)) return null
      const localised = LOCALISED.test(path)
      const common = { nodeId: node.id, path, lang: localised ? lang : null, value, limit, others, words: fieldWords }
      if (path === 'terminal.outcome') {
        return <Field {...common} select={OUTCOMES.map((outcome) => ({ value: outcome, label: outcomeLabel(ui, outcome) }))} label={ui.outcome} className="outcome" classByValue />
      }
      if (path.endsWith('.kind')) {
        return <Field {...common} select={KINDS.map((kind) => ({ value: kind, label: kindLabel(ui, kind) }))} label={ui.sourceKind} />
      }
      if (path === 'description') {
        return <Field {...common} rich rendered={rendered} explainers={node.explainers as Explainer[]} />
      }
      return <Field {...common} />
    },
    operation(node: NodeContent, op, index): ReactNode {
      if (op === 'add-source') {
        return (
          <Operation
            nodeId={node.id}
            change={{ op: 'add-source', kind: 'legal', label: {}, url: NEW_SOURCE_URL }}
            label={`+ ${ui.addSource}`}
            focusPath={`sources[${node.sources.length}].label.${lang}`}
          />
        )
      }
      return <Operation nodeId={node.id} change={{ op: 'remove-source', index }} label={ui.removeSource} className="admin-submit" />
    },
  }
  return { treeId: address.treeId, links, languages, words, slots }
}

function outcomeLabel(ui: Chrome, outcome: Outcome): string {
  return {
    'not-applicable': ui.outcomeNotApplicable,
    applicable: ui.outcomeApplicable,
    prohibited: ui.outcomeProhibited,
    refer: ui.outcomeRefer,
  }[outcome]
}

function kindLabel(ui: Chrome, kind: Source['kind']): string {
  return { legal: ui.sourceLegal, 'case-law': ui.sourceCaseLaw, literature: ui.sourceLiterature }[kind]
}

/** The limits are the components' (28.1); exported for the tests that assert the slot's contract. */
export type { FieldLimit }
