/**
 * The validity rules of docs/specs/tree-format.md section 7, applied to a Tree folder
 * that has already been read and parsed (see loader.ts, which owns the file system and
 * reports V-DIR, V-YAML and bad file names). Every failing rule is collected; nothing
 * stops at the first (ADR-4-validity-rules).
 */
import type { NodeKind, Violation } from './types.ts'

/** A parsed YAML mapping whose shape is not yet trusted. */
export type Mapping = Record<string, unknown>

/** The parsed contents of a Tree folder. `null` stands for a file that did not parse. */
export interface RawTree {
  id: string
  manifest: Mapping | null
  nodes: Map<string, Mapping | null>
  /** The file names in `images/`. */
  images: Set<string>
}

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
const IMAGE_FILE = /^[a-z0-9]+([._-][a-z0-9]+)*\.(png|jpg|jpeg|gif|webp|svg)$/
const LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/
const RAW_HTML = /<[a-zA-Z/!]/
const OUTCOMES: readonly string[] = ['not-applicable', 'applicable', 'prohibited', 'refer']
const SOURCE_KINDS: readonly string[] = ['legal', 'case-law', 'literature']
const MANIFEST_KEYS = ['format', 'languages', 'root', 'title', 'description', 'metadata']
const NODE_KEYS = ['title', 'description', 'metadata', 'sources', 'images', 'answers', 'options', 'terminal']

/** Tree-format.md 3.1: lowercase letters, digits, single hyphens, at most 64 characters. */
export function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && ID.test(value)
}

/** Tree-format.md 3.5: a bare lowercase image file name, at most 128 characters. */
export function isImageFile(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 128 && IMAGE_FILE.test(value)
}

export function isMapping(value: unknown): value is Mapping {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Tree-format.md 5.6: the kind follows from which of `answers` / `terminal` is present.
 * When both are present (V-KIND reports it) `answers` decides, so the other rules still run.
 */
export function nodeKind(node: Mapping): NodeKind {
  if ('answers' in node) return 'question'
  if ('terminal' in node) return 'terminal'
  return 'explanation'
}

/** Runs every rule and returns every violation found. */
export function validateTree(tree: RawTree): Violation[] {
  const out: Violation[] = []
  // Languages are filled in from the manifest before any text is checked; `null` means the
  // manifest could not tell us, so texts are checked for shape only.
  const context: Context = { languages: null, images: tree.images }
  let root: string | null = null

  if (tree.manifest) {
    const c = new FileChecker('tree.yaml', context, out)
    const m = tree.manifest
    c.keys(m, '', MANIFEST_KEYS)
    if (m.format !== 'elsa-tree/1') c.fail('format', 'V-FORMAT', 'must be exactly "elsa-tree/1"')
    context.languages = checkLanguages(c, m.languages)
    root = c.reference(m.root, 'root', 'V-ROOT')
    if (!('title' in m)) c.fail('title', 'V-TITLE', 'title is required')
    else c.localised(m.title, 'title', false)
    if ('description' in m) c.localised(m.description, 'description', true)
    c.metadata(m.metadata)
  }

  const shapes = new Map<string, NodeShape>()
  for (const [id, node] of tree.nodes) {
    if (node) shapes.set(id, checkNode(new FileChecker(`nodes/${id}.yaml`, context, out), node))
  }
  checkGraph(out, tree, root, shapes)
  return out
}

interface Context {
  languages: string[] | null
  images: Set<string>
}

/** An outgoing Link, kept for the rules that need every Node to have been read. */
interface Link {
  keyPath: string
  target: string
}

interface NodeShape {
  kind: NodeKind
  answers: Link[]
  options: Link[]
}

/**
 * Collects violations for one file; the small checks shared by manifest and Nodes.
 *
 * The fields are assigned in the body rather than declared as constructor parameter
 * properties: Node's built-in type stripping, which runs scripts/validate.ts, rejects those.
 */
class FileChecker {
  readonly file: string
  private readonly context: Context
  private readonly out: Violation[]

  constructor(file: string, context: Context, out: Violation[]) {
    this.file = file
    this.context = context
    this.out = out
  }

  fail(keyPath: string, rule: string, message: string): void {
    this.out.push({ file: this.file, keyPath, rule, message })
  }

  /** V-KEYS: no keys other than the listed ones. */
  keys(value: Mapping, keyPath: string, allowed: string[]): void {
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) {
        this.fail(join(keyPath, key), 'V-KEYS', `unknown key "${key}"; allowed keys: ${allowed.join(', ')}`)
      }
    }
  }

  /** V-L10N, and V-PLAIN or V-HTML depending on whether the text is rich. */
  localised(value: unknown, keyPath: string, rich: boolean): void {
    if (!isMapping(value)) {
      this.fail(keyPath, 'V-L10N', 'must be a mapping from language tag to text, even for one language')
      return
    }
    const expected = this.context.languages ?? Object.keys(value)
    for (const lang of expected) {
      const text = value[lang]
      if (typeof text !== 'string' || text.trim() === '') {
        this.fail(`${keyPath}.${lang}`, 'V-L10N', `missing or empty text for the declared language "${lang}"`)
        continue
      }
      if (rich && RAW_HTML.test(text)) this.fail(`${keyPath}.${lang}`, 'V-HTML', 'raw HTML is not allowed in rich text')
      if (!rich && text.trim().includes('\n')) this.fail(`${keyPath}.${lang}`, 'V-PLAIN', 'plain text must be a single line')
    }
    for (const lang of Object.keys(value)) {
      if (!expected.includes(lang)) this.fail(`${keyPath}.${lang}`, 'V-L10N', `"${lang}" is not a language the manifest declares`)
    }
  }

  /** V-META: a mapping whose `version` is a non-empty string. */
  metadata(value: unknown): void {
    if (!isMapping(value)) {
      this.fail('metadata', 'V-META', 'metadata must be a mapping with a version')
      return
    }
    if (typeof value.version !== 'string' || value.version.trim() === '') {
      this.fail('metadata.version', 'V-META', 'version must be a non-empty string; quote it: version: "1.0"')
    }
  }

  /** A Node reference (3.2): an id without a colon (V-CROSS). Returns it, or null when unusable. */
  reference(value: unknown, keyPath: string, rule: string): string | null {
    if (typeof value === 'string' && value.includes(':')) {
      this.fail(keyPath, 'V-CROSS', `"${value}" contains a colon; Cross-links are not part of elsa-tree/1`)
      return null
    }
    if (!isId(value)) {
      this.fail(keyPath, rule, 'must be a Node id: lowercase letters, digits and single hyphens')
      return null
    }
    return value
  }

  hasImage(file: string): boolean {
    return this.context.images.has(file)
  }
}

function join(keyPath: string, key: string): string {
  return keyPath === '' ? key : `${keyPath}.${key}`
}

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** V-LANG. Returns the languages when they are usable for the text checks, else null. */
function checkLanguages(c: FileChecker, value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    c.fail('languages', 'V-LANG', 'must be a non-empty list of language tags such as [en, nl]')
    return null
  }
  let usable = true
  value.forEach((tag, i) => {
    if (typeof tag !== 'string' || !LANGUAGE_TAG.test(tag)) {
      c.fail(`languages[${i}]`, 'V-LANG', `"${String(tag)}" is not a lowercase BCP 47 tag such as en or pt-br`)
      usable = false
    } else if (value.indexOf(tag) !== i) {
      c.fail(`languages[${i}]`, 'V-LANG', `"${tag}" is declared twice`)
      usable = false
    }
  })
  return usable ? (value as string[]) : null
}

function checkNode(c: FileChecker, node: Mapping): NodeShape {
  c.keys(node, '', NODE_KEYS)
  for (const key of ['title', 'description', 'metadata']) {
    if (!(key in node)) c.fail(key, 'V-NODE', `"${key}" is required on every Node`)
  }
  if ('title' in node) c.localised(node.title, 'title', false)
  if ('description' in node) c.localised(node.description, 'description', true)
  if ('metadata' in node) c.metadata(node.metadata)
  const sourceIds = checkSources(c, node.sources)
  checkImages(c, node.images, 'images', sourceIds)
  if ('answers' in node && 'terminal' in node) {
    c.fail('terminal', 'V-KIND', 'a Node has either answers (question Node) or terminal (Terminal), never both')
  }
  const answers = 'answers' in node ? checkAnswers(c, node.answers) : []
  const options = 'options' in node ? checkOptions(c, node.options, sourceIds) : []
  if ('terminal' in node) checkTerminal(c, node.terminal, 'options' in node)
  return { kind: nodeKind(node), answers, options }
}

/** V-SOURCE. Returns the Source ids declared, for the Images that point at them. */
function checkSources(c: FileChecker, value: unknown): Set<string> {
  const ids = new Set<string>()
  if (value === undefined) return ids
  if (!Array.isArray(value)) {
    c.fail('sources', 'V-SOURCE', 'must be a list')
    return ids
  }
  value.forEach((source: unknown, i) => {
    const at = `sources[${i}]`
    if (!isMapping(source)) {
      c.fail(at, 'V-SOURCE', 'must be a mapping with kind, label and url')
      return
    }
    c.keys(source, at, ['id', 'kind', 'label', 'url'])
    if (typeof source.kind !== 'string' || !SOURCE_KINDS.includes(source.kind)) {
      c.fail(`${at}.kind`, 'V-SOURCE', `kind must be one of ${SOURCE_KINDS.join(', ')}`)
    }
    if (!('label' in source)) c.fail(`${at}.label`, 'V-SOURCE', 'label is required')
    else c.localised(source.label, `${at}.label`, false)
    if (!isHttpUrl(source.url)) c.fail(`${at}.url`, 'V-SOURCE', 'url must be an absolute http:// or https:// URL')
    if ('id' in source) {
      if (!isId(source.id)) c.fail(`${at}.id`, 'V-SOURCE', 'id must be an id: lowercase letters, digits and single hyphens')
      else if (ids.has(source.id)) c.fail(`${at}.id`, 'V-SOURCE', `Source id "${source.id}" is used twice on this Node`)
      else ids.add(source.id)
    }
  })
  return ids
}

/** V-IMAGE, for the Images of a Node or of one of its Options. */
function checkImages(c: FileChecker, value: unknown, keyPath: string, sourceIds: Set<string>): void {
  if (value === undefined) return
  if (!Array.isArray(value)) {
    c.fail(keyPath, 'V-IMAGE', 'must be a list')
    return
  }
  value.forEach((image: unknown, i) => {
    const at = `${keyPath}[${i}]`
    if (!isMapping(image)) {
      c.fail(at, 'V-IMAGE', 'must be a mapping with file, description and credit')
      return
    }
    c.keys(image, at, ['file', 'description', 'credit', 'source'])
    if (!isImageFile(image.file)) c.fail(`${at}.file`, 'V-IMAGE', 'file must be a bare lowercase image file name such as eu-map.png')
    else if (!c.hasImage(image.file)) c.fail(`${at}.file`, 'V-IMAGE', `"${image.file}" is not in the Tree's images/ folder`)
    if (!('description' in image)) c.fail(`${at}.description`, 'V-IMAGE', 'description is required')
    else c.localised(image.description, `${at}.description`, false)
    if (typeof image.credit !== 'string' || image.credit.trim() === '') {
      c.fail(`${at}.credit`, 'V-IMAGE', 'credit is required for every Image and must be a non-empty string')
    }
    if ('source' in image && !(typeof image.source === 'string' && sourceIds.has(image.source))) {
      c.fail(`${at}.source`, 'V-IMAGE', 'source must name the id of a Source on this Node')
    }
  })
}

/** V-ANSWERS, the part that needs only this file; the targets are checked in checkGraph. */
function checkAnswers(c: FileChecker, value: unknown): Link[] {
  if (!isMapping(value)) {
    c.fail('answers', 'V-ANSWERS', 'must be a mapping with exactly the keys yes and no')
    return []
  }
  const links: Link[] = []
  for (const key of ['yes', 'no']) {
    if (!(key in value)) {
      c.fail(`answers.${key}`, 'V-ANSWERS', `"${key}" is required`)
      continue
    }
    const target = c.reference(value[key], `answers.${key}`, 'V-ANSWERS')
    if (target) links.push({ keyPath: `answers.${key}`, target })
  }
  for (const key of Object.keys(value)) {
    if (key !== 'yes' && key !== 'no') c.fail(`answers.${key}`, 'V-ANSWERS', `unknown key "${key}"; only yes and no are allowed`)
  }
  return links
}

/** V-OPTIONS, the part that needs only this file; the targets are checked in checkGraph. */
function checkOptions(c: FileChecker, value: unknown, sourceIds: Set<string>): Link[] {
  if (!Array.isArray(value) || value.length === 0) {
    c.fail('options', 'V-OPTIONS', 'must be a non-empty list')
    return []
  }
  const links: Link[] = []
  value.forEach((option: unknown, i) => {
    const at = `options[${i}]`
    if (!isMapping(option)) {
      c.fail(at, 'V-OPTIONS', 'must be a mapping with title and target')
      return
    }
    c.keys(option, at, ['title', 'target', 'images'])
    if (!('title' in option)) c.fail(`${at}.title`, 'V-OPTIONS', 'title is required')
    else c.localised(option.title, `${at}.title`, false)
    const target = c.reference(option.target, `${at}.target`, 'V-OPTIONS')
    if (target && links.some((link) => link.target === target)) {
      c.fail(`${at}.target`, 'V-OPTIONS', `"${target}" is the target of two Options in this list`)
    } else if (target) {
      links.push({ keyPath: `${at}.target`, target })
    }
    checkImages(c, option.images, `${at}.images`, sourceIds)
  })
  return links
}

/** V-TERMINAL. */
function checkTerminal(c: FileChecker, value: unknown, hasOptions: boolean): void {
  if (!isMapping(value)) {
    c.fail('terminal', 'V-TERMINAL', 'must be a mapping with an outcome')
    return
  }
  c.keys(value, 'terminal', ['outcome'])
  if (typeof value.outcome !== 'string' || !OUTCOMES.includes(value.outcome)) {
    c.fail('terminal.outcome', 'V-TERMINAL', `outcome must be one of ${OUTCOMES.join(', ')}`)
  }
  if (hasOptions) c.fail('options', 'V-TERMINAL', 'a Terminal cannot have options')
}

/** The rules that need every Node: V-ROOT, Link targets, V-ORPHAN, V-REACH. */
function checkGraph(out: Violation[], tree: RawTree, root: string | null, shapes: Map<string, NodeShape>): void {
  const fail = (file: string, keyPath: string, rule: string, message: string): void => {
    out.push({ file, keyPath, rule, message })
  }
  const exists = (id: string): boolean => tree.nodes.has(id)
  // Undefined for a Node whose file did not parse: its kind is unknown, so kind rules skip it.
  const kindOf = (id: string): NodeKind | undefined => shapes.get(id)?.kind

  if (root !== null) {
    if (!exists(root)) fail('tree.yaml', 'root', 'V-ROOT', `"${root}" is not a Node of this Tree`)
    else if (kindOf(root) === 'explanation') fail('tree.yaml', 'root', 'V-ROOT', `"${root}" is an explanation Node; root must be a question Node or a Terminal`)
  }

  const optionTargets = new Set<string>()
  for (const [id, shape] of shapes) {
    const file = `nodes/${id}.yaml`
    for (const { keyPath, target } of shape.answers) {
      if (!exists(target)) fail(file, keyPath, 'V-ANSWERS', `"${target}" is not a Node of this Tree`)
      else if (kindOf(target) === 'explanation') fail(file, keyPath, 'V-ANSWERS', `"${target}" is an explanation Node; an Answer must lead to a question Node or a Terminal`)
    }
    for (const { keyPath, target } of shape.options) {
      const kind = kindOf(target)
      if (!exists(target)) fail(file, keyPath, 'V-OPTIONS', `"${target}" is not a Node of this Tree`)
      else if (kind !== undefined && kind !== 'explanation') fail(file, keyPath, 'V-OPTIONS', `"${target}" is a ${kind} Node; an Option must lead to an explanation Node`)
      optionTargets.add(target)
    }
  }

  // Reachability is undefined without a valid root; V-ROOT has already said so.
  const reachable = new Set<string>()
  const walk = root !== null && exists(root)
  if (walk) {
    const queue = [root]
    for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
      if (reachable.has(id)) continue
      reachable.add(id)
      const shape = shapes.get(id)
      if (shape) queue.push(...[...shape.answers, ...shape.options].map((link) => link.target).filter(exists))
    }
  }
  for (const [id, shape] of shapes) {
    const file = `nodes/${id}.yaml`
    // An explanation Node nobody targets is unreachable by construction; one message that
    // names the cause beats two.
    if (shape.kind === 'explanation' && !optionTargets.has(id)) {
      fail(file, '', 'V-ORPHAN', 'an explanation Node must be the target of at least one Option')
    } else if (walk && !reachable.has(id)) {
      fail(file, '', 'V-REACH', `not reachable from root "${root}" by following Answers and Options`)
    }
  }
}
