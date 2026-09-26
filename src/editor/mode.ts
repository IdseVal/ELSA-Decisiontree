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
import type { DraftNode, Node, NodeContent } from '../tree/types.ts'
import type { Links } from '../url.ts'

export type { Links }

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
  /** The side-bubble `+` in the fan's next free slot, and after an Overlay's list (#139). */
  sideAdd?(node: Node | DraftNode): ReactNode
  /** The `...` on the rim above, with `removeEnd` and `deleteStep` (#139). */
  stepMenu?(node: Node | DraftNode): ReactNode
  /** The mark button on the description's rim (#141). */
  mark?(): ReactNode
  /**
   * The name of the DOM event a click on a marked term dispatches instead of toggling its
   * panel (#141 opens the explainer Sheet on it). A string, because a client component takes
   * no function across the seam.
   */
  onTermClick?: string
}

/** The chrome strings of the editor round the client components take (3.2, 34.1). */
export interface EditorWords {
  missingText: string
  characters: string
  lines: string
  addSource: string
  editSource: string
  removeSource: string
  sourceKind: string
  sourceUrl: string
  sourceLegal: string
  sourceCaseLaw: string
  sourceLiterature: string
  outcome: string
  outcomeNotApplicable: string
  outcomeApplicable: string
  outcomeProhibited: string
  outcomeRefer: string
  saving: string
  saved: string
  notSaved: string
  retrying: string
  retry: string
  notEditable: string
  changedElsewhere: string
  sessionExpired: string
  publicBehind: string
  toOverview: string
}
