/**
 * The editor page's `EditMode` (docs/specs/application.md 34.1, 34.2): the words the
 * editor's client components say and the slots of #138 -- `field` for every text and select
 * of 28.1 that this issue edits, `operation` for the two Source operations -- and **[#139]**
 * the four structure slots of 30: `structure` for the Answer row, `linkMenu` beside each
 * Answer and Option button, `sideAdd` in the fan and after an Overlay's list, `stepMenu` on
 * the rim. Each structure slot is a Sheet built here around a client form of
 * `src/editor/Structure.tsx` or `StepMenu.tsx`, with the addresses it navigates to and the
 * picker's index handed over as strings (34.4).
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
import { StepMenuForm } from '../editor/StepMenu.tsx'
import { AnswerAdd, EndForm, LinkMenuForm, SideAddForm, type MenuLink, type Pickable, type StructureWords } from '../editor/Structure.tsx'
import { MAX_ASIDES } from '../neighbourhood.ts'
import { linksOf, type Explainer, type NodeContent, type Outcome, type Source } from '../tree/types.ts'
import type { PageAddress } from '../url.ts'

/**
 * **[#139]** What the structure slots need of the page (30): the picker's index -- every
 * Node of the draft by id and title in the page's language, in file order, from `nodeIds()`
 * and `getTitle`, never a Node read (30.6) -- the address of every Node the page carries,
 * by id, from which a creation's destination and a deletion's way out are built, and the
 * root, which has no `deleteStep`.
 */
export interface Structure {
  index: Pickable[]
  addresses: Record<string, PageAddress>
  root: string
  /** The centre's id: the `+` is the fan's on the centre and an Overlay's list entry on every other Node (30.4, 30.5). */
  centre: string
}

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
    close: ui.close,
    mark: ui.mark,
    unmark: ui.unmark,
    cannotMarkHere: ui.cannotMarkHere,
    explainerLimit: ui.explainerLimit,
    term: ui.term,
    explanation: ui.explanation,
    markedIn: ui.markedIn,
    notMarkedIn: ui.notMarkedIn,
  }
}

/** The paths this issue edits in place; an Image's texts wait for #140 (the issue's task 1). */
const EDITED = /^(title|description|sources\[\d+\]\.(label|kind|url)|options\[\d+\]\.title|terminal\.outcome)$/

/** Which paths hold a localised text: the page's language is appended to their key path (22.2). */
const LOCALISED = /^(title|description|sources\[\d+\]\.label|options\[\d+\]\.title)$/

/** What a click or Enter on a marked term dispatches in the editor (32.3). */
const TERM_EVENT = 'elsa-term'

const KINDS: Source['kind'][] = ['legal', 'case-law', 'literature']
const OUTCOMES: Outcome[] = ['not-applicable', 'applicable', 'prohibited', 'refer']

/** The edit mode of the page at `address`, whose draft declares `languages`; `structure` for the slots of 30. */
export function editMode(address: PageAddress, languages: string[], structure: Structure): EditMode {
  const lang = address.lang
  const ui = chrome(lang)
  const uiLang = chromeLang(lang)
  const words = editorWords(ui)
  const links = editorLinks()
  const sheet = sheetWords(ui)
  const structureWords: StructureWords = {
    yes: ui.yes,
    no: ui.no,
    confirm: ui.confirm,
    cancel: ui.cancel,
    createNew: ui.createNew,
    linkExisting: ui.linkExisting,
    changeTarget: ui.changeTarget,
    removeLink: ui.removeLink,
    pickTarget: ui.pickTarget,
    sideBubbleTitle: ui.sideBubbleTitle,
    newSideBubble: ui.newSideBubble,
    missingText: ui.missingText,
  }
  /** The page's own address of a Node it carries, or null for one it does not (a slot draws nothing then). */
  const hereOf = (nodeId: string): string | null => {
    const at = structure.addresses[nodeId]
    return at ? links.node(at) : null
  }
  /** The picker's list for a Node: every other Node (30.6). */
  const otherNodes = (nodeId: string): Pickable[] => structure.index.filter((entry) => entry.id !== nodeId)
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
        return <Field {...common} rich rendered={rendered} explainers={node.explainers as Explainer[]} termEvent={TERM_EVENT} markerWords={{ mark: ui.mark, cannotMarkHere: ui.cannotMarkHere, explainerLimit: ui.explainerLimit }} />
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
    onTermClick: TERM_EVENT,

    // The three situations of 30.1: a Terminal or a Node with both Answers takes the public
    // row; one Answer, the `+` for the other at 620; none, `+ Yes`, `treeEndsHere`, `+ No`.
    structure(node) {
      const has = linksOf(node)
      const here = hereOf(node.id)
      if (here === null || has.terminal !== undefined || (has.yes !== undefined && has.no !== undefined)) return null
      if (has.yes !== undefined) return <AnswerAdd nodeId={node.id} link="no" here={here} word={ui.no} lone />
      if (has.no !== undefined) return <AnswerAdd nodeId={node.id} link="yes" here={here} word={ui.yes} lone />
      return (
        <>
          <AnswerAdd nodeId={node.id} link="yes" here={here} word={ui.yes} />
          <Sheet
            className="structure-end"
            summary={<span lang={uiLang}>{ui.treeEndsHere}</span>}
            pages={[<EndForm key="end" nodeId={node.id} outcomes={outcomes} heading={ui.treeEndsHere} words={structureWords} />]}
            words={sheet}
            uiLang={uiLang}
            idPrefix={`${node.id}-end-`}
          />
          <AnswerAdd nodeId={node.id} link="no" here={here} word={ui.no} />
        </>
      )
    },

    // The `...` at the outer end of an Answer or Option button (30.6): absent where the
    // Answer is not yet made, since the row's `+` stands there.
    linkMenu(node, link) {
      const here = hereOf(node.id)
      if (here === null) return null
      let menu: MenuLink
      if (link.kind === 'option') {
        const option = node.options[link.index]
        if (!option) return null
        menu = { kind: 'option', target: option.target, title: option.title[lang] ?? '' }
      } else {
        if (linksOf(node)[link.kind] === undefined) return null
        menu = { kind: link.kind }
      }
      const which = link.kind === 'option' ? `option${link.index}` : link.kind
      return (
        <Sheet
          className={`link-menu link-menu--${link.kind}`}
          summary={<span aria-label={ui.linkMenu} lang={uiLang}>…</span>}
          pages={[<LinkMenuForm key="menu" nodeId={node.id} lang={lang} link={menu} here={here} nodes={otherNodes(node.id)} words={structureWords} />]}
          words={sheet}
          uiLang={uiLang}
          idPrefix={`${node.id}-${which}-menu-`}
        />
      )
    },

    // The side-bubble `+` (30.4): the fan's next free slot on the centre, the last entry of an
    // Overlay's list on an aside; absent at eight Options and on a Terminal (5.6, 5.7).
    sideAdd(node) {
      const here = hereOf(node.id)
      if (here === null || node.options.length >= MAX_ASIDES || linksOf(node).terminal !== undefined) return null
      const inOverlay = node.id !== structure.centre
      return (
        <Sheet
          className={`side-add${inOverlay ? ' side-add--list' : ''}`}
          // Inside an Overlay's panel a Sheet names a group of its own, or opening it would close the Overlay.
          name={inOverlay ? 'side-sheet' : 'sheet'}
          summary={
            inOverlay ? (
              <span lang={uiLang}>{`+ ${ui.newSideBubble}`}</span>
            ) : (
              <>
                <span className="option-image option-image--empty side-add-plus" aria-hidden="true">
                  +
                </span>
                <span className="option-title" lang={uiLang}>
                  {ui.newSideBubble}
                </span>
              </>
            )
          }
          pages={[<SideAddForm key="side" nodeId={node.id} lang={lang} here={here} nodes={otherNodes(node.id)} words={structureWords} />]}
          words={sheet}
          uiLang={uiLang}
          idPrefix={`${node.id}-side-`}
        />
      )
    },

    // The `...` on the rim above, right of the up arrow (30.8): `removeEnd` on a Terminal,
    // `deleteStep` on every Node but the root, which goes to the parent or, with no Trail, to the root.
    stepMenu(node) {
      const at = structure.addresses[node.id]
      if (!at) return null
      const parentHref = at.trail.length > 0 ? links.trail(at, at.trail.length - 1) : links.node({ ...at, trail: [], nodeId: structure.root })
      const title = node.title[lang] || ui.missingText
      return (
        <Sheet
          className="step-menu"
          summary={<span aria-label={ui.stepMenu} lang={uiLang}>…</span>}
          pages={[
            <StepMenuForm
              key="step"
              nodeId={node.id}
              heading={title}
              root={node.id === structure.root}
              terminal={linksOf(node).terminal !== undefined}
              parentHref={parentHref}
              words={{ removeEnd: ui.removeEnd, deleteStep: ui.deleteStep, confirmDelete: ui.confirmDelete(title), confirm: ui.confirm, cancel: ui.cancel }}
            />,
          ]}
          words={sheet}
          uiLang={uiLang}
          idPrefix={`${node.id}-step-`}
        />
      )
    },
  }
  return { treeId: address.treeId, links, languages, words, slots }
}
