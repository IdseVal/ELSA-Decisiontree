/**
 * Edit mode (docs/specs/application.md 34.1, 34.2; ADR-133-reuse-rule): the one optional
 * prop, `edit`, through which the editor's page renders the public components. Absent on
 * every public page, so a component renders exactly what it renders today; present, it names
 * the addresses, the pictures and the **slots** -- the places where the editor adds
 * something, each a server-side function the page supplies and a server component calls
 * where the control belongs, rendering what it returns. A slot that is absent, or that
 * answers null, renders nothing: the public markup stands in its place.
 *
 * Server side, types only: the client components under `src/editor/` never see this object.
 * `src/components/` imports nothing of `src/editor/` but these types.
 */
import type { ReactNode } from 'react'
import type { Chrome } from '../chrome.ts'
import type { DraftNode, Node, NodeContent } from '../tree/types.ts'
import type { Links } from '../url.ts'

export interface EditMode {
  treeId: string
  /** The addresses and the pictures (34.3): `/admin/trees/...` and the admin image route. */
  links: Links
  /** The draft's declared languages, for the rim's tags (28.3). */
  languages: string[]
  /** The chrome strings the editor's client components say, as strings. */
  words: EditorWords
  slots: EditorSlots
}

/** The maximum of a text field (tree-format.md 5.7); `lines` for the rich description only. */
export interface FieldLimit {
  characters: number
  lines?: number
}

/** Which Link of a Node a link menu is for (30.6). */
export type LinkRef = { kind: 'yes' | 'no' } | { kind: 'option'; index: number }

/**
 * The slot table of 34.2. Each takes the Node it is drawn on, because a write names the
 * Node; the Interior and the Carousel know it as `NodeContent`, the tree view as a Node.
 */
export interface EditorSlots {
  /**
   * Every text of 28.1 and the two selects, in place of the public text: `path` is the key
   * path of 22.2 without its language (`title`, `sources[1].label`, `terminal.outcome`),
   * `value` the text in the page's language, `limit` the maximum of 5.7 or null for a select
   * and a URL. `rendered` is the public element the region shows while it is not being
   * edited, where that element carries a script of its own (the description's explainers).
   */
  field?(node: NodeContent, path: string, value: string, limit: FieldLimit | null, rendered?: ReactNode): ReactNode
  /** The two Source operations of 28.1 that are not fields: `+ addSource` after the last Source, `removeSource` in its Sheet. */
  operation?(node: NodeContent, op: 'add-source' | 'remove-source', index?: number): ReactNode
  /** The empty main-image slot as a picker (#140). */
  imageSlot?(node: NodeContent): ReactNode
  /** The `+` thumbnail in the strip band (#140). */
  stripAdd?(node: NodeContent): ReactNode
  /** The controls under a picture in the enlarged view (#140). */
  enlargedControls?(node: NodeContent, index: number): ReactNode
  /** The three buttons of the Answer row, or the `+` for the missing Answer (#139). */
  structure?(node: Node | DraftNode): ReactNode
  /** The `...` control of an Answer or Option button (#139). */
  linkMenu?(node: Node | DraftNode, link: LinkRef): ReactNode
  /** The side-bubble `+` in the fan's next free slot (#139); **[#177]** on the centre only, no longer after an Overlay's list. */
  sideAdd?(node: Node | DraftNode): ReactNode
  /** **[#177]** `deleteSideBubble` at the bottom of the Overlay the Node's Option `index` opens (30.7). */
  sideDelete?(node: Node | DraftNode, index: number): ReactNode
  /** The `...` on the rim above, with `removeEnd` and `deleteStep` (#139). */
  stepMenu?(node: Node | DraftNode): ReactNode
  /**
   * The name of the DOM event a click on a marked term dispatches instead of toggling its
   * panel: the description's `Field` opens the explainer Sheet on it (32.3). A string,
   * because a client component takes no function across the seam. **[#141]** The `mark`
   * button needs the source's selection, which only the description's `Field` holds, so the
   * `Field` draws it on its own rim and there is no `mark()` slot.
   */
  onTermClick?: string
}

/**
 * The chrome strings the editor's client components read through `words` (3.2, 34.1): the
 * field's two, the indicator's and the session Sheet's, and **[#141]** the `mark` button's
 * and the explainer Sheet's, **[#172]** its two placeholders among them. The slots hand every
 * other string -- a select's labels, a field's placeholder, the add-Source Sheet's -- straight
 * from the chrome.
 */
export type EditorWords = Pick<
  Chrome,
  | 'characters'
  | 'lines'
  | 'saving'
  | 'saved'
  | 'notSaved'
  | 'retrying'
  | 'retry'
  | 'notEditable'
  | 'changedElsewhere'
  | 'sessionExpired'
  | 'publicBehind'
  | 'toOverview'
  | 'close'
  | 'mark'
  | 'unmark'
  | 'cannotMarkHere'
  | 'explainerLimit'
  | 'term'
  | 'explanation'
  | 'placeholderTerm'
  | 'placeholderExplanation'
  | 'markedIn'
  | 'notMarkedIn'
>
