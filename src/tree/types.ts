/**
 * The types of the `elsa-tree/1` format (docs/specs/tree-format.md) as the loader hands
 * them out (docs/specs/application.md section 5.1). Two normalisations against the
 * files: `id` and `kind` are added, and absent lists become empty arrays.
 */

/** Language tag -> text, holding every language the manifest declares. */
export type LocalisedText = Record<string, string>

export interface Metadata {
  version: string
  [key: string]: unknown
}

export interface Manifest {
  format: 'elsa-tree/1'
  languages: string[]
  /** The first declared language: what the frontend shows before the user chooses. */
  defaultLanguage: string
  root: string
  title: LocalisedText
  description?: LocalisedText
  metadata: Metadata
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
  /** Path inside the Tree folder, e.g. `nodes/start.yaml`. */
  file: string
  /** Key path inside the file, e.g. `options[2].target`; empty for the file as a whole. */
  keyPath: string
  /** The rule id, e.g. `V-ANSWERS`. */
  rule: string
  message: string
}
