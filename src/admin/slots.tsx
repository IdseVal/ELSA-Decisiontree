/**
 * The editor page's `EditMode` (docs/specs/application.md 34.1, 34.2): the words the
 * editor's client components say and the slots of #138 -- `field` for every text and select
 * of 28.1 that this issue edits, `operation` for the two Source operations -- and **[#139]**
 * the structure slots of 30: `structure` for the Answer row and `sideAdd` in the fan, each
 * built here around a client leaf of `src/editor/Structure.tsx`, with the addresses it
 * navigates to handed over as strings (34.4); **[#177]** the side-bubble `+` is a button alone,
 * which creates at one click, and `sideDelete` puts `deleteSideBubble` at the bottom of an
 * opened side bubble (30.4, 30.7, amended 2026-10-02); **[#178]** `stepButtons` puts the step's
 * red cross and, on a Terminal, "Tree does not end here after all" beside the up arrow, from
 * `src/editor/StepButtons.tsx`, in place of the step menu, and no Answer or Option button has a
 * link menu any more (30.6, 30.8, amended 2026-10-02) -- and of #140: `imageSlot` and `stripAdd`,
 * the two pickers of 31.1, and `enlargedControls`, the four controls under a picture in the
 * enlarged view (31.3). Later issues add their slot functions to the object this module
 * builds, one line each (ADR-133-build-order).
 *
 * Server side: it reads the chrome and builds client elements with string props.
 */
import type { ReactNode } from 'react'
import { chrome, chromeLang, type Chrome } from '../chrome.ts'
import { sheetWords, SOURCE_LABEL } from '../components/Bubble.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { editorLinks } from '../editor/links.ts'
import { AddSourceForm, Field, Operation, type FieldWords, type OtherLanguage } from '../editor/Field.tsx'
import { Hint } from '../editor/Hint.tsx'
import { ImageControls } from '../editor/ImageControls.tsx'
import { ImageSlot, type PickerWords } from '../editor/ImageSlot.tsx'
import type { EditMode, EditorSlots, EditorWords } from '../editor/mode.ts'
import { DeleteStep, RemoveEnd } from '../editor/StepButtons.tsx'
import { AnswerAdd, AnswerMoves, SideAdd, SideDelete, WordsForm } from '../editor/Structure.tsx'
import { MAX_ASIDES } from '../neighbourhood.ts'
import { linksOf, type Explainer, type NodeContent, type Source } from '../tree/types.ts'
import type { PageAddress } from '../url.ts'

/**
 * **[#139]** What the structure slots need of the page (30): the address of every Node the
 * page carries, by id, from which a creation's destination and a deletion's way out are
 * built, and the root, which has no `deleteStep`. **[#178]** No longer the picker's index of
 * every Node of the draft: the picker is gone (30.6, amended).
 */
export interface Structure {
  addresses: Record<string, PageAddress>
  root: string
  /** The centre's id: the side-bubble `+` is the fan's, on the centre only (30.4, 30.5). */
  centre: string
  /**
   * **[#177]** The targets of the centre's Options, in order: the asides whose titles the Option
   * buttons' follow (30.5), and whose Overlays hold `deleteSideBubble` (30.7).
   */
  options: string[]
  /** **[#177]** Those of them another Node leads to as well: their delete removes only the centre's Option (30.7). */
  shared: string[]
  /** **[#178]** Their titles in the page's language, by id: what their delete names (30.7). */
  titles: Record<string, string>
}

/** The chrome strings the editor's client components read through `words`, as strings. */
export function editorWords(ui: Chrome): EditorWords {
  return {
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
    placeholderTerm: ui.placeholderTerm,
    placeholderExplanation: ui.placeholderExplanation,
    markedIn: ui.markedIn,
    notMarkedIn: ui.notMarkedIn,
  }
}

/**
 * The paths edited in place: #138's, **[#140]** an Image's two texts in the enlarged view (31.3),
 * **[#179]** a Terminal's words on its badge (36.3), and **[#222]** a next step's on its button (41.7 item 2).
 */
const EDITED = /^(title|description|sources\[\d+\]\.(label|kind|url)|images\[\d+\]\.(description|credit)|options\[\d+\]\.title|answers\[\d+\]\.label|terminal\.label)$/

/**
 * **[#172]** What belongs in the field at a path, its placeholder while it is empty (28.2,
 * amended): the chrome word for it, or none for a select.
 */
function placeholderOf(path: string, ui: Chrome): string {
  if (path === 'title') return ui.placeholderTitle
  if (path === 'description') return ui.placeholderText
  if (/^sources\[\d+\]\.label$/.test(path)) return ui.placeholderSourceLabel
  if (/^sources\[\d+\]\.url$/.test(path)) return ui.placeholderUrl
  if (/^options\[\d+\]\.title$/.test(path)) return ui.placeholderOptionTitle
  if (/^images\[\d+\]\.description$/.test(path)) return ui.placeholderImageDescription
  if (/^images\[\d+\]\.credit$/.test(path)) return ui.placeholderCredit
  if (path === 'terminal.label') return ui.endingText
  if (/^answers\[\d+\]\.label$/.test(path)) return ui.nextStepWords
  return ''
}

/** Which paths hold a localised text: the page's language is appended to their key path (22.2). */
const LOCALISED = /^(title|description|sources\[\d+\]\.label|images\[\d+\]\.description|options\[\d+\]\.title|answers\[\d+\]\.label|terminal\.label)$/

/** **[#222]** The most next steps a step may have (41.1): the row's `+` is absent at that many. */
const MAX_ANSWERS = 4

/** The most Images a Node may hold (V-COUNT, 5.7): the strip's `+` is absent at that many (31.1). */
const MAX_IMAGES = 10

/** **[#174]** An Image's two texts, which the enlarged view shows with a hint behind their labels (31.3). */
const IMAGE_TEXT = /^images\[(\d+)\]\.(credit|description)$/

/** The maximum length of an Option's title (tree-format.md 5.7): what a title that follows the aside's is cut to (30.5). */
const OPTION_TITLE = { characters: 60 }

/** What a click or Enter on a marked term dispatches in the editor (32.3). */
const TERM_EVENT = 'elsa-term'

/** Where the confirmations of 30.7 and **[#178]** 30.8 put the title: a character no chrome sentence holds, cut at on the server. */
const TITLE_MARK = '\u0000'

const KINDS: Source['kind'][] = ['legal', 'case-law', 'literature']

/** The edit mode of the page at `address`, whose draft declares `languages`; `structure` for the slots of 30. */
export function editMode(address: PageAddress, languages: string[], structure: Structure): EditMode {
  const lang = address.lang
  const ui = chrome(lang)
  const uiLang = chromeLang(lang)
  const words = editorWords(ui)
  const links = editorLinks()
  const sheet = sheetWords(ui)
  /** The page's own address of a Node it carries, or null for one it does not (a slot draws nothing then). */
  const hereOf = (nodeId: string): string | null => {
    const at = structure.addresses[nodeId]
    return at ? links.node(at) : null
  }
  const fieldWords: FieldWords = { characters: words.characters, lines: words.lines }
  const others: OtherLanguage[] = languages.filter((other) => other !== lang).map((other) => ({ lang: other, href: links.withLang(address, other) }))
  // **[#221]** `+ Yes` and `+ No` label their next step with the chrome word in every language of the Tree, by 3.1's rule (41.7 item 1).
  const wordOf = (key: 'yes' | 'no'): Record<string, string> => Object.fromEntries(languages.map((tag) => [tag, chrome(tag)[key]]))
  // The badge leaves `legal` unlabelled under its heading (ADR-78); a select must name every kind.
  const kinds = KINDS.map((kind) => ({ value: kind, label: ui[SOURCE_LABEL[kind] ?? 'sourceLegal'] }))
  const pickerWords: PickerWords = {
    addPicture: ui.addPicture,
    fileTooLarge: ui.fileTooLarge,
    fileTypeRefused: ui.fileTypeRefused,
    credit: ui.credit,
    imageDescription: ui.imageDescription,
    attach: ui.attach,
    cancel: ui.cancel,
    placeholderCredit: ui.placeholderCredit,
    placeholderImageDescription: ui.placeholderImageDescription,
    addExtraPicture: ui.addExtraPicture,
    hint: ui.hint,
    creditHint: ui.creditHint,
    imageDescriptionHint: ui.imageDescriptionHint,
  }
  // The admin image route's folder: the attach Sheet shows a picture no Node names yet (31.2).
  const images = links.image(address.treeId, '')

  const slots: EditorSlots = {
    field(node, path, value, limit, rendered) {
      if (!EDITED.test(path)) return null
      const localised = LOCALISED.test(path)
      const common = { nodeId: node.id, path, lang: localised ? lang : null, value, limit, others, placeholder: placeholderOf(path, ui), words: fieldWords }
      // **[#179]** The ending's words, drawn as the badge they are on the public page (36.3).
      if (path === 'terminal.label') return <Field {...common} className="outcome" />
      if (path.endsWith('.kind')) {
        return <Field {...common} select={kinds} label={ui.sourceKind} />
      }
      if (path === 'description') {
        return <Field {...common} rich rendered={rendered} explainers={node.explainers as Explainer[]} termEvent={TERM_EVENT} markerWords={{ mark: ui.mark, cannotMarkHere: ui.cannotMarkHere, explainerLimit: ui.explainerLimit }} />
      }
      // [#174] The enlarged view's label is the Carousel's; the hint behind it is the editor's.
      const image = IMAGE_TEXT.exec(path)
      if (image) {
        const credit = image[2] === 'credit'
        return (
          <>
            <Hint id={`${node.id}-images-${image[1]}-${image[2]}-hint`} text={credit ? ui.creditHint : ui.imageDescriptionHint} name={ui.hint} />{' '}
            <Field {...common} />
          </>
        )
      }
      // **[#177]** An aside's title leads the title of its Option button on the centre, which follows it (30.5).
      const option = path === 'title' && node.id !== structure.centre ? structure.options.indexOf(node.id) : -1
      if (option >= 0) return <Field {...common} follower={{ nodeId: structure.centre, path: `options[${option}].title`, limit: OPTION_TITLE }} />
      return <Field {...common} />
    },
    operation(node: NodeContent, op, index): ReactNode {
      // `+ addSource` is a Sheet holding the kind and the URL: the schema requires a URL, so
      // nothing is sent before one is typed (28.1); the new label then takes the focus.
      if (op === 'add-source') {
        return (
          <Sheet
            className="source-sheet source-sheet--add"
            editorUi
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
    imageSlot(node) {
      return <ImageSlot nodeId={node.id} place="slot" images={images} words={pickerWords} />
    },
    stripAdd(node) {
      // A Node with no Image has the slot's `+` only; at ten, none (31.1).
      if (node.images.length === 0 || node.images.length >= MAX_IMAGES) return null
      return <ImageSlot nodeId={node.id} place="strip" images={images} words={pickerWords} />
    },
    enlargedControls(node, index) {
      const words = { makeMain: ui.makeMain, moveEarlier: ui.moveEarlier, moveLater: ui.moveLater, removeImage: ui.removeImage }
      return <ImageControls nodeId={node.id} index={index} count={node.images.length} file={node.images[index]!.file} words={words} />
    },
    onTermClick: TERM_EVENT,

    // The situations of 30.1, **[#222]** as 41.7 items 1 and 2 have them: a Terminal takes the
    // public row; a step without Links offers `+ Yes`, `treeEndsHere`, `+ No` and `+`; one next
    // step, the one-click `+ Yes` or `+ No` for the word its label does not already say in the
    // language edited, then `+`; two or three, `+`; four, nothing more.
    structure(node) {
      const has = linksOf(node)
      const here = hereOf(node.id)
      if (here === null || has.terminal !== undefined || has.answers.length >= MAX_ANSWERS) return []
      const formWords = { characters: ui.characters, confirm: ui.confirm, cancel: ui.cancel }
      const add = (
        <Sheet
          key="add"
          className="structure-add"
          editorUi
          summary={
            <span lang={uiLang} role="img" aria-label={ui.addNextStep} title={ui.addNextStep}>
              +
            </span>
          }
          pages={[<WordsForm key="add" nodeId={node.id} lang={lang} link="answer" here={here} heading={ui.addNextStep} words={{ ...formWords, name: ui.nextStepWords }} />]}
          words={sheet}
          uiLang={uiLang}
          idPrefix={`${node.id}-add-`}
        />
      )
      if (has.answers.length > 1) return [add]
      if (has.answers.length === 1) {
        const said = (has.answers[0]!.label[lang] ?? '').trim().toLocaleLowerCase(lang)
        const lacking = (['yes', 'no'] as const).filter((key) => ui[key].toLocaleLowerCase(lang) !== said)
        return [...lacking.map((key) => <AnswerAdd key={key} nodeId={node.id} which={key} word={ui[key]} label={wordOf(key)} here={here} />), add]
      }
      return [
        <AnswerAdd key="yes" nodeId={node.id} which="yes" word={ui.yes} label={wordOf('yes')} here={here} />,
        <Sheet
          key="end"
          className="structure-end"
          editorUi
          summary={<span lang={uiLang}>{ui.treeEndsHere}</span>}
          pages={[<WordsForm key="end" nodeId={node.id} lang={lang} link="end" heading={ui.treeEndsHere} words={{ ...formWords, name: ui.endingText }} />]}
          words={sheet}
          uiLang={uiLang}
          idPrefix={`${node.id}-end-`}
        />,
        <AnswerAdd key="no" nodeId={node.id} which="no" word={ui.no} label={wordOf('no')} here={here} />,
        add,
      ]
    },

    // **[#222]** The order of a step's next steps (41.7 item 4): each button but the first can go
    // one place earlier, each but the last one place later.
    answerMoves(node, index) {
      const count = linksOf(node).answers.length
      if (hereOf(node.id) === null || count < 2) return null
      return <AnswerMoves nodeId={node.id} index={index} count={count} words={{ moveEarlier: ui.moveEarlier, moveLater: ui.moveLater }} />
    },

    // The side-bubble `+` (30.4): the fan's next free slot, on the centre; absent at eight
    // Options and on a Terminal (5.6, 5.7). **[#177]** Not in an Overlay any more: an aside
    // opened as its own page is the centre, and its fan has the `+` (30.5, amended).
    sideAdd(node) {
      const here = hereOf(node.id)
      if (here === null || node.id !== structure.centre || node.options.length >= MAX_ASIDES || linksOf(node).terminal !== undefined) return null
      return <SideAdd nodeId={node.id} here={here} word={ui.newSideBubble} wordLang={uiLang} />
    },

    // **[#177]** `deleteSideBubble` in the Overlay of each of the centre's Options (30.7): the
    // aside's Node goes with the Option unless another Node leads to it too.
    sideDelete(node, index) {
      const here = hereOf(node.id)
      const target = node.options[index]?.target
      if (here === null || node.id !== structure.centre || target === undefined) return null
      const [confirmBefore = '', confirmAfter = ''] = ui.confirmDeleteSideBubble(TITLE_MARK).split(TITLE_MARK)
      const words = {
        deleteSideBubble: ui.deleteSideBubble,
        confirmBefore,
        confirmAfter,
        confirmUntitled: ui.confirmDeleteUntitledSideBubble,
        stays: ui.sideBubbleStays,
        confirm: ui.confirm,
        cancel: ui.cancel,
      }
      return <SideDelete parentId={node.id} asideId={target} lang={lang} title={structure.titles[target] ?? ''} shared={structure.shared.includes(target)} centreHref={here} words={words} />
    },

    // **[#178]** The step's buttons beside the up arrow (30.8, amended): on a Terminal "Tree does
    // not end here after all", and on every Node but the root the red cross, whose delete goes to
    // the parent or, with no Trail, to the root. The root that is not a Terminal has neither.
    stepButtons(node) {
      const at = structure.addresses[node.id]
      if (!at) return null
      const root = node.id === structure.root
      const terminal = linksOf(node).terminal !== undefined
      if (root && !terminal) return null
      const parentHref = at.trail.length > 0 ? links.trail(at, at.trail.length - 1) : links.node({ ...at, trail: [], nodeId: structure.root })
      const [confirmBefore = '', confirmAfter = ''] = ui.confirmDelete(TITLE_MARK).split(TITLE_MARK)
      const words = {
        deleteStep: ui.deleteStep,
        confirmBefore,
        confirmAfter,
        confirmUntitled: ui.confirmDeleteUntitled,
        confirm: ui.confirm,
        cancel: ui.cancel,
      }
      return (
        <>
          {!root && <DeleteStep nodeId={node.id} lang={lang} title={node.title[lang] ?? ''} parentHref={parentHref} words={words} uiLang={uiLang} />}
          {terminal && <RemoveEnd nodeId={node.id} word={ui.removeEnd} uiLang={uiLang} />}
        </>
      )
    },
  }
  return { treeId: address.treeId, links, languages, words, slots }
}
