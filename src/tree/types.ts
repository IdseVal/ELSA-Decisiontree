/**
 * The types of the `elsa-tree/4` format (docs/specs/tree-format.md) as the loader hands
 * them out (docs/specs/application.md section 5.1). Two normalisations against the
 * file: `id` and `kind` are added, and absent lists become empty arrays.
 */

/** Language tag -> text, holding every language the manifest declares. */
export type LocalisedText = Record<string, string>

export interface Metadata {
  version: string
  [key: string]: unknown
}

/** The lab's look, carried by the Tree itself (tree-format.md 4.3). */
export interface Logo {
  light: string
  dark?: string
  icon?: string
  alt: LocalisedText
  url?: string
}

export interface FontFile {
  file: string
  /** One number (`"400"`) or a variable font's range (`"300 800"`), verbatim into `@font-face`. */
  weight: string
  style: 'normal' | 'italic'
}

export interface FontFamily {
  family: string
  role: 'body' | 'heading'
  files: FontFile[]
  licence: string
}

export type ColourRole =
  | 'background'
  | 'surface'
  | 'text'
  | 'text-muted'
  | 'accent'
  | 'accent-secondary'
  | 'danger'

/** Each `#rrggbb`, validated by the loader. */
export type Colours = Record<ColourRole, string>

export interface Theme {
  logo?: Logo
  fonts?: FontFamily[]
  colours?: Colours
}

export interface Manifest {
  format: 'elsa-tree/4'
  languages: string[]
  /** The first declared language: what the frontend shows before the user chooses. */
  defaultLanguage: string
  root: string
  title: LocalisedText
  description?: LocalisedText
  metadata: Metadata
  theme?: Theme
}

export interface Source {
  id?: string
  kind: 'legal' | 'case-law' | 'literature'
  label: LocalisedText
  url: string
}

export interface Image {
  file: string
  description: LocalisedText
  credit: string
  source?: string
}

/** No pictures of its own: the button shows its target's main image (tree-format.md 5.4). */
export interface Option {
  title: LocalisedText
  target: string
}

/** A term of the Node's description with a short explanation shown on hover (tree-format.md 5.9). */
export interface Explainer {
  id: string
  term: LocalisedText
  text: LocalisedText
}

export type Outcome = 'not-applicable' | 'applicable' | 'prohibited' | 'refer'

export type NodeKind = 'question' | 'terminal' | 'explanation'

export type Node = {
  id: string
  title: LocalisedText
  description: LocalisedText
  metadata: Metadata
  sources: Source[]
  images: Image[]
  options: Option[]
  explainers: Explainer[]
} & (
  | { kind: 'question'; answers: { yes: string; no: string } }
  | { kind: 'terminal'; outcome: Outcome }
  | { kind: 'explanation' }
)

/**
 * **[#136]** A Node of a draft (docs/specs/application.md 19.2): a `Node` whose `answers` may
 * lack a key and whose localised texts may lack a language or hold an empty string for one
 * -- a `title` or `description` not written yet is `{}` -- and nothing else different.
 */
export type DraftNode = Omit<Node, 'kind'> & {
  kind: NodeKind
  answers?: { yes?: string; no?: string }
  outcome?: Outcome
}

/**
 * **[#138]** The fields the Interior, the Carousel and the enlarged view read (application.md
 * 34.6): what a `Node` and a `DraftNode` both satisfy, so the three components draw either
 * without knowing which.
 */
export interface NodeContent {
  id: string
  title: LocalisedText
  description: LocalisedText
  sources: Source[]
  images: Image[]
  explainers: Explainer[]
}

/** **[#138]** A Node's Links as the tree view reads them (34.6): the Answers that exist, and the end. */
export interface NodeLinks {
  yes?: string
  no?: string
  terminal?: Outcome
}

/**
 * **[#138]** The one helper through which `TreeView` and `Bubble` read a Node's Links, so that
 * a draft's half-question -- one Answer, or none yet -- and a published Node's pair are read
 * by one rule (34.6). Where a public `Node` is passed nothing differs.
 */
export function linksOf(node: Node | DraftNode): NodeLinks {
  const links: NodeLinks = {}
  if ('answers' in node && node.answers) {
    if (node.answers.yes !== undefined) links.yes = node.answers.yes
    if (node.answers.no !== undefined) links.no = node.answers.no
  }
  if ('outcome' in node && node.outcome !== undefined) links.terminal = node.outcome
  return links
}

/** One broken validity rule of docs/specs/tree-format.md section 7. */
export interface Violation {
  /**
   * Where in the Tree: `manifest`, the Node's id, or `tree.json` for the file as a whole
   * and for every failure the schema reports. The Tree is one file, so this is no longer a
   * path; the field keeps its name from the interface of application.md section 5.1.
   */
  file: string
  /**
   * Where inside it: a key path such as `options[2].target` for a content rule, a JSON
   * Pointer such as `/nodes/3/options/2` for the schema (tree-format.md 7); empty for the
   * file as a whole.
   */
  keyPath: string
  /** The rule id, e.g. `V-ANSWERS`, or `schema` for a shape failure the schema reports. */
  rule: string
  message: string
  /**
   * **[#136]** Set on a draft's violations only (application.md 19.2): true for one of the
   * creator's to-do list, which the draft holds; false for one the store never writes.
   */
  advisory?: boolean
}
