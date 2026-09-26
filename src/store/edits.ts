/**
 * The unit of a write (docs/specs/application.md 22.2, 22.4; ADR-132-editor-api decisions 3
 * and 6), applied to a draft held in memory: one field of the manifest or of one Node, one
 * operation of a closed set on one Node, creating a Node with its Link, deleting a Node with
 * every Link to it. Pure: each function changes the parsed draft it is given -- the store
 * hands it a copy -- and the store validates the result before a byte reaches the disk.
 *
 * What is refused here is what the format's key set refuses before anything is applied: a
 * path the format does not define (V-KEYS), a language the manifest does not declare
 * (V-L10N), an index or a Node that is not there. Everything else -- a wrong type, a bad
 * URL, an Answer on a Terminal -- is left to the validator, which answers it with the rule
 * the format names.
 */
import { randomBytes } from 'node:crypto'
import { isId, type Mapping } from '../tree/validate.ts'
import { malformed, StoreError } from './errors.ts'

/** One field: a key path the format defines, and the string it becomes (22.2). */
export interface Field {
  path: string
  value: unknown
}

/** One operation of 22.2's closed set, with its own arguments. */
export interface Operation {
  op: string
  [argument: string]: unknown
}

/** The manifest's fields (22.1): its title and description per language, and `root`. */
const MANIFEST_FIELD = /^(?:(title|description)\.([^.[\]]+)|root)$/

/**
 * A Node's fields (22.2), each with the key path's segments as capture groups. A language
 * segment is anything without a dot or a bracket, then checked against the declared ones.
 */
const NODE_FIELDS: RegExp[] = [
  /^(title|description)\.([^.[\]]+)$/,
  /^(sources)\[(\d+)\]\.(label)\.([^.[\]]+)$/,
  /^(sources)\[(\d+)\]\.(url|kind)$/,
  /^(images)\[(\d+)\]\.(description)\.([^.[\]]+)$/,
  /^(images)\[(\d+)\]\.(credit|source)$/,
  /^(explainers)\[(\d+)\]\.(term|text)\.([^.[\]]+)$/,
  /^(options)\[(\d+)\]\.(title)\.([^.[\]]+)$/,
  /^(terminal)\.(outcome)$/,
]

/** The keys whose value is a localised text: the segment after one of them is a language. */
const LOCALISED = new Set(['title', 'description', 'label', 'term', 'text'])

/**
 * A new, empty draft (22.1 `POST /admin/api/trees`, 27.2): the manifest from the creation
 * form's three fields and one root Node `start` with nothing in it yet. Hidden, and not
 * published: the manifest's `version` is the publish count, `"0"` until the first (19.6).
 */
export function newDraft(languages: string[], title: Mapping): Mapping {
  return {
    $schema: '/schemas/elsa-tree-4.json',
    format: 'elsa-tree/4',
    languages,
    root: 'start',
    title: localisedInput(title, languages, 'manifest', 'title'),
    metadata: { version: '0' },
    nodes: [{ id: 'start', metadata: { version: '1' } }],
  }
}

/** The Node of `tree` with `id`; 404 when there is none. */
export function nodeOf(tree: Mapping, id: string): Mapping {
  const node = (tree.nodes as Mapping[]).find((candidate) => candidate.id === id)
  if (!node) throw new StoreError(404, 'no-node')
  return node
}

/**
 * Sets one field of the manifest (`nodeId` null) or of one Node to `value` (22.2), replacing
 * that field and no other, so two collaborators in two fields never touch each other's text
 * (22.5). A localised text a Node does not have yet is created with the one language.
 */
export function applyField(tree: Mapping, nodeId: string | null, field: Field): void {
  const where = nodeId ?? 'manifest'
  const { path, value } = field
  if (typeof path !== 'string') throw malformed(where, '', 'V-KEYS', 'a field write names a path')
  if (typeof value !== 'string') throw malformed(where, path, 'schema', 'a field holds a string')
  const segments = nodeId === null ? manifestSegments(path) : nodeSegments(path)
  if (!segments) throw malformed(where, path, 'V-KEYS', `"${path}" is not a field the editor writes`)
  const languages = tree.languages as string[]

  let holder: Mapping = nodeId === null ? tree : nodeOf(tree, nodeId)
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i]!
    const next = segments[i + 1]!
    if (typeof next === 'number') {
      const list = holder[key as string]
      if (!Array.isArray(list) || next >= list.length) throw malformed(where, path, 'V-KEYS', `there is no ${key}[${next}]`)
      holder = list[next] as Mapping
      i += 1
      continue
    }
    if (LOCALISED.has(key as string) && i + 1 === segments.length - 1 && !languages.includes(next)) {
      throw malformed(where, path, 'V-L10N', `"${next}" is not a language the manifest declares`)
    }
    if (key === 'terminal' && !('terminal' in holder)) throw malformed(where, path, 'V-TERMINAL', 'this Node is not a Terminal')
    holder[key as string] ??= {}
    holder = holder[key as string] as Mapping
  }
  const last = segments[segments.length - 1] as string
  // An Image's `source` is optional: emptied, the key goes, as the format writes an absent field (3.7).
  if (last === 'source' && value === '') delete holder.source
  else holder[last] = value
}

function manifestSegments(path: string): Array<string | number> | null {
  const match = MANIFEST_FIELD.exec(path)
  if (!match) return null
  return match[1] ? [match[1], match[2]!] : ['root']
}

function nodeSegments(path: string): Array<string | number> | null {
  for (const pattern of NODE_FIELDS) {
    const match = pattern.exec(path)
    if (match) return match.slice(1).map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment))
  }
  return null
}

/**
 * Applies one operation of 22.2's closed set to the Node `nodeId`. Answers the ids of the
 * other Nodes it created or changed, for the write response's `also`. No list is ever left
 * empty and no `answers` without an Answer: the key goes instead (22.4, V-EMPTY).
 */
export function applyOperation(tree: Mapping, nodeId: string, operation: Operation, newId: () => string): string[] {
  const node = nodeOf(tree, nodeId)
  const languages = tree.languages as string[]
  const fail = (keyPath: string, message: string): StoreError => malformed(nodeId, keyPath, 'V-KEYS', message)

  switch (operation.op) {
    case 'add-source': {
      const source: Mapping = {}
      if (operation.id !== undefined) source.id = operation.id
      source.kind = operation.kind
      source.label = localisedInput(operation.label, languages, nodeId, 'sources')
      source.url = operation.url
      append(node, 'sources', source)
      return []
    }
    case 'remove-source': {
      const [removed] = removeAt(node, 'sources', index(node, 'sources', operation.index, fail))
      // An Image may point at the Source by its id; a pointer to nothing is not left behind.
      for (const image of (node.images as Mapping[] | undefined) ?? []) {
        if (removed?.id !== undefined && image.source === removed.id) delete image.source
      }
      return []
    }
    case 'add-image': {
      const image: Mapping = {
        file: operation.file,
        description: localisedInput(operation.description ?? {}, languages, nodeId, 'images'),
        credit: operation.credit ?? '',
      }
      append(node, 'images', image)
      return []
    }
    case 'remove-image':
      removeAt(node, 'images', index(node, 'images', operation.index, fail))
      return []
    case 'move-image': {
      const images = node.images as Mapping[]
      const from = index(node, 'images', operation.from, fail)
      const to = index(node, 'images', operation.to, fail)
      images.splice(to, 0, images.splice(from, 1)[0]!)
      return []
    }
    case 'add-explainer':
      append(node, 'explainers', {
        id: operation.id,
        term: localisedInput(operation.term ?? {}, languages, nodeId, 'explainers'),
        text: localisedInput(operation.text ?? {}, languages, nodeId, 'explainers'),
      })
      return []
    case 'remove-explainer': {
      const explainers = (node.explainers as Mapping[] | undefined) ?? []
      const at = explainers.findIndex((explainer) => explainer.id === operation.id)
      if (at < 0) throw fail('explainers', `no explainer "${String(operation.id)}" on this Node`)
      // Its marks stay: a mark is text the author wrote, and V-MARK reports it (19.2).
      removeAt(node, 'explainers', at)
      return []
    }
    case 'add-option': {
      const title = localisedInput(operation.title ?? {}, languages, nodeId, 'options')
      if (operation.target !== undefined) {
        append(node, 'options', { title, target: operation.target })
        return []
      }
      const aside = createEmptyNode(tree, newId())
      append(node, 'options', { title, target: aside.id })
      return [aside.id as string]
    }
    case 'remove-option': {
      const options = (node.options as Mapping[] | undefined) ?? []
      const at = options.findIndex((option) => option.target === operation.target)
      if (at < 0) throw fail('options', `no Option to "${String(operation.target)}" on this Node`)
      removeAt(node, 'options', at)
      return []
    }
    case 'set-answer': {
      const answer = answerKey(operation.answer, fail)
      node.answers = { ...((node.answers as Mapping | undefined) ?? {}), [answer]: operation.target }
      return []
    }
    case 'remove-answer': {
      const answer = answerKey(operation.answer, fail)
      const answers = node.answers as Mapping | undefined
      if (!answers || !(answer in answers)) throw fail(`answers.${answer}`, `this Node has no "${answer}" Answer`)
      delete answers[answer]
      if (Object.keys(answers).length === 0) delete node.answers
      return []
    }
    case 'set-terminal':
      node.terminal = { outcome: operation.outcome }
      return []
    case 'remove-terminal':
      if (!('terminal' in node)) throw fail('terminal', 'this Node is not a Terminal')
      delete node.terminal
      return []
    default:
      throw fail('', `"${String(operation.op)}" is not an operation of the editor's interface`)
  }
}

/**
 * Creates a Node and the Link to it from `from.node` in one write (22.4): an Answer (`yes`,
 * `no`) or an Option, the new Node empty but for `title`. `end` creates no Node: it gives
 * `from.node` a terminal with `outcome` (30.3). Answers the id of the Node the response is
 * about -- the new one, or `from.node` for an end.
 */
export function createNode(
  tree: Mapping,
  from: { node: unknown; link: unknown; outcome?: unknown },
  title: unknown,
  id: string,
): string {
  if (typeof from.node !== 'string') throw malformed('', 'from.node', 'V-KEYS', 'from names the Node the Link starts at')
  const parent = nodeOf(tree, from.node)
  const languages = tree.languages as string[]
  switch (from.link) {
    case 'end':
      parent.terminal = { outcome: from.outcome }
      return from.node
    case 'yes':
    case 'no': {
      const node = createEmptyNode(tree, id, title === undefined ? undefined : localisedInput(title, languages, id, 'title'))
      parent.answers = { ...((parent.answers as Mapping | undefined) ?? {}), [from.link]: node.id }
      return id
    }
    case 'option': {
      const text = localisedInput(title ?? {}, languages, id, 'title')
      createEmptyNode(tree, id, text)
      append(parent, 'options', { title: structuredClone(text), target: id })
      return id
    }
    default:
      throw malformed(from.node, 'from.link', 'V-KEYS', "link is 'yes', 'no', 'option' or 'end'")
  }
}

/**
 * Deletes the Node `id` and every Answer and Option that names it, in one write (22.4). The
 * root is never deleted (409); what the Node led to stays. Answers the ids of the Nodes that
 * lost a Link.
 */
export function deleteNode(tree: Mapping, id: string): string[] {
  nodeOf(tree, id)
  if (tree.root === id) throw new StoreError(409, 'root')
  tree.nodes = (tree.nodes as Mapping[]).filter((node) => node.id !== id)
  const referrers: string[] = []
  for (const node of tree.nodes as Mapping[]) {
    let lost = false
    const answers = node.answers as Mapping | undefined
    for (const key of ['yes', 'no']) {
      if (answers?.[key] === id) {
        delete answers[key]
        lost = true
      }
    }
    if (answers && Object.keys(answers).length === 0) delete node.answers
    const options = node.options as Mapping[] | undefined
    if (options?.some((option) => option.target === id)) {
      const kept = options.filter((option) => option.target !== id)
      if (kept.length > 0) node.options = kept
      else delete node.options
      lost = true
    }
    if (lost) referrers.push(node.id as string)
  }
  return referrers
}

/**
 * A new Node's id (22.4): `n-` and six lowercase base32 characters, drawn again while taken.
 * Ids are in every URL, so the server draws them; a request may name a free, valid one.
 */
export function freshNodeId(tree: Mapping, requested?: unknown): string {
  const taken = new Set((tree.nodes as Mapping[]).map((node) => node.id))
  if (requested !== undefined) {
    if (!isId(requested)) throw malformed('', 'id', 'V-NODE', `"${String(requested)}" is not an id (tree-format.md 3.1)`)
    if (taken.has(requested)) throw new StoreError(409, 'node-id-taken')
    return requested
  }
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567'
  for (;;) {
    const id = `n-${[...randomBytes(6)].map((byte) => alphabet[byte % 32]).join('')}`
    if (!taken.has(id)) return id
  }
}

/** A Node with nothing in it yet (30.2): an id, a version, and a title when one was given. */
function createEmptyNode(tree: Mapping, id: string, title?: Mapping): Mapping {
  const node: Mapping = { id }
  if (title) node.title = title
  node.metadata = { version: '1' }
  ;(tree.nodes as Mapping[]).push(node)
  return node
}

/**
 * A localised text from a request: an object of strings, copied into a fresh object (so a
 * key such as `__proto__` is an own key, never a prototype), with every declared language it
 * lacks added as `""` -- V-L10N's advisory, and never the `{}` V-EMPTY blocks.
 */
function localisedInput(value: unknown, languages: string[], where: string, keyPath: string): Mapping {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw malformed(where, keyPath, 'schema', 'a localised text is an object of language tags to strings')
  }
  const given = Object.entries(value as Mapping)
  return Object.fromEntries([...given, ...languages.filter((lang) => !(lang in value)).map((lang) => [lang, ''])])
}

function append(node: Mapping, key: string, entry: Mapping): void {
  node[key] = [...((node[key] as Mapping[] | undefined) ?? []), entry]
}

/** Removes one entry; the key goes with the last one (22.4). */
function removeAt(node: Mapping, key: string, at: number): Mapping[] {
  const list = node[key] as Mapping[]
  const removed = list.splice(at, 1)
  if (list.length === 0) delete node[key]
  return removed
}

function index(node: Mapping, key: string, value: unknown, fail: (keyPath: string, message: string) => StoreError): number {
  const list = node[key] as unknown[] | undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || !list || value < 0 || value >= list.length) {
    throw fail(key, `there is no ${key}[${String(value)}]`)
  }
  return value
}

function answerKey(value: unknown, fail: (keyPath: string, message: string) => StoreError): 'yes' | 'no' {
  if (value !== 'yes' && value !== 'no') throw fail('answers', "answer is 'yes' or 'no'")
  return value
}
