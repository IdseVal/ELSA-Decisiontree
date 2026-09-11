/**
 * The types of the `elsa-tree/2` format (docs/specs/tree-format.md) as the loader hands
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
  format: 'elsa-tree/2'
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

export interface Option {
  title: LocalisedText
  target: string
  images: Image[]
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
} & (
  | { kind: 'question'; answers: { yes: string; no: string } }
  | { kind: 'terminal'; outcome: Outcome }
  | { kind: 'explanation' }
)

/** One broken validity rule of docs/specs/tree-format.md section 7. */
export interface Violation {
  /**
   * Where in the Tree: `manifest`, the Node's id, or `document at line N` for a Node
   * document whose id could not be read. The Tree is one file, so this is no longer a
   * path; the field keeps its name from the interface of application.md section 5.1.
   */
  file: string
  /** Key path inside the document, e.g. `options[2].target`; empty for the document as a whole. */
  keyPath: string
  /** The rule id, e.g. `V-ANSWERS`. */
  rule: string
  message: string
}
