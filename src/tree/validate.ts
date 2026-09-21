/**
 * Whether a Tree is valid, in the two passes docs/specs/tree-format.md section 7 fixes:
 * the JSON Schema of 3.9 first, for the shape, and then the content rules of section 7 for
 * everything a schema cannot compute -- the counted text of 3.8, the declared languages,
 * the Node graph and the files on disk. Neither pass translates the other's message: a
 * shape failure arrives as a JSON Pointer in the schema's own words, a content failure as
 * the Tree id, the Node id, the key path and a rule id (ADR-118-json-schema).
 *
 * The content rules run ONLY when the schema passed, so they may trust the shape: `nodes`
 * is a non-empty array, every Node has an id, a title, a description and a `metadata`, and
 * every localised text is an object of non-empty strings. That is what keeps one defect to
 * one voice -- a Tree whose `title` is a bare string is answered by the schema, not by the
 * schema and then by V-L10N saying the same thing in other words.
 *
 * Every failing rule inside a pass is collected; nothing stops at the first
 * (ADR-4-validity-rules). The file system belongs to loader.ts, which reports V-DIR and
 * V-JSON before this module is reached.
 */
import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js'
import { explainerMarks } from '../markdown.ts'
import type { LocalisedText, NodeKind, Violation } from './types.ts'
import schemaDocument from '../../schemas/elsa-tree-4.json' with { type: 'json' }

/** A parsed JSON object whose shape is not yet trusted. */
export type Mapping = Record<string, unknown>

/** The parsed contents of a Tree folder. */
export interface RawTree {
  id: string
  /** The parsed `tree.json`: the manifest fields and `nodes` in one object (3.7, section 4). */
  tree: Mapping
  /** The file names in `images/`. */
  images: Set<string>
  /** The file names in `theme/`. */
  themeFiles: Set<string>
}

/**
 * The schema of 3.9, compiled once. It is a file of this build, never fetched from a
 * Tree's `$schema`: a Tree is third-party data and nothing here reaches another origin
 * at run time (ADR-118-json-schema, decision 7).
 */
const validateShape = new Ajv2020({ allErrors: true }).compile(schemaDocument)

const IMAGE_FILE = /^[a-z0-9]+([._-][a-z0-9]+)*\.(png|jpg|jpeg|gif|webp|svg)$/
const THEME_FILE = /^[a-z0-9]+([._-][a-z0-9]+)*\.(svg|png|webp|ico|woff2)$/
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
const RAW_HTML = /<[a-zA-Z/!]/
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g
const LIST_ITEM = /^(-\s|\d+\.\s)/

/** The maximum lengths and counts of tree-format.md 5.7; the same for every language. */
const MAX = {
  title: 80,
  treeDescription: 600,
  treeLines: 8,
  /* What fits beside a main image of two fifths of the Bubble (application.md 10.7, #102). */
  nodeDescription: 150,
  nodeLines: 2,
  optionTitle: 60,
  sourceLabel: 60,
  imageDescription: 120,
  credit: 120,
  logoAlt: 80,
  fontFamily: 64,
  fontLicence: 200,
  sources: 3,
  options: 8,
  nodeImages: 10,
  explainers: 8,
  explainerTerm: 40,
  explainerText: 200,
  fontFamilies: 2,
  fontFiles: 8,
}

/** The width the estimated line count of rich text assumes (tree-format.md 3.8, 5.7). */
const CHARS_PER_LINE = 75

/** Tree-format.md 3.1: lowercase letters, digits, single hyphens, at most 64 characters. */
export function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && ID.test(value)
}

/** Tree-format.md 3.5: a bare lowercase image file name, at most 128 characters. */
export function isImageFile(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 128 && IMAGE_FILE.test(value)
}

/** Tree-format.md 3.6: a bare lowercase theme file name, at most 128 characters. */
export function isThemeFile(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 128 && THEME_FILE.test(value)
}

export function isMapping(value: unknown): value is Mapping {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Tree-format.md 3.8 steps 1 and 2: what a length rule is measured on -- the text
 * trimmed, with every Markdown link replaced by the words the reader sees.
 */
export function countedText(text: string): string {
  return text.trim().replace(MARKDOWN_LINK, '$1')
}

/** Tree-format.md 3.8 step 3: the length in Unicode code points, not bytes. */
export function countedLength(text: string): number {
  return [...countedText(text)].length
}

/**
 * Tree-format.md 3.8: how many lines this rich text takes when a renderer lays it out at
 * `CHARS_PER_LINE`. Blocks are paragraphs and list items; a run of blank lines between
 * two blocks costs one line of paragraph spacing.
 */
export function estimatedLines(text: string): number {
  const blocks: string[] = []
  let breaks = 0
  let afterBlank = false
  for (const raw of countedText(text).split('\n')) {
    const line = raw.trim()
    if (line === '') {
      if (blocks.length > 0 && !afterBlank) breaks += 1
      afterBlank = true
      continue
    }
    if (afterBlank || blocks.length === 0 || LIST_ITEM.test(line)) blocks.push(line)
    else blocks[blocks.length - 1] += ` ${line}`
    afterBlank = false
  }
  const lines = blocks.reduce((sum, block) => sum + Math.max(1, Math.ceil([...block].length / CHARS_PER_LINE)), 0)
  return lines + breaks
}

/**
 * Tree-format.md 5.6: the kind follows from which of `answers` / `terminal` is present.
 * The schema has already refused a Node carrying both (V-KIND).
 */
export function nodeKind(node: Mapping): NodeKind {
  if ('answers' in node) return 'question'
  if ('terminal' in node) return 'terminal'
  return 'explanation'
}

/** Runs both passes and returns every violation found. */
export function validateTree(tree: RawTree): Violation[] {
  const shape = shapeViolations(tree.tree)
  return shape.length > 0 ? shape : contentViolations(tree)
}

/** The schema pass: the rules section 7 marks `schema` in its Where column. */
function shapeViolations(tree: Mapping): Violation[] {
  if (validateShape(tree)) return []
  return (validateShape.errors ?? []).map(toViolation)
}

/**
 * One schema failure as a violation: the JSON Pointer into the file where a content rule
 * writes a key path, `schema` where it writes a rule id, and the schema's own words as the
 * message. The key that broke the rule is named when the schema knows it, because
 * "must NOT have additional properties" on an object of ten keys is otherwise a search.
 */
function toViolation(error: ErrorObject): Violation {
  const key = error.params.additionalProperty ?? error.params.propertyName
  const message = error.message ?? 'does not match the schema'
  return {
    file: 'tree.json',
    keyPath: error.instancePath || '/',
    rule: 'schema',
    message: typeof key === 'string' ? `${message}: "${key}"` : message,
  }
}

/** The content pass: the rules section 7 marks `rules`, on a Tree whose shape is known good. */
function contentViolations(tree: RawTree): Violation[] {
  const out: Violation[] = []
  const manifest = tree.tree
  const context: Context = {
    languages: manifest.languages as string[],
    images: tree.images,
    themeFiles: tree.themeFiles,
  }

  const c = new DocumentChecker('manifest', context, out)
  c.localised(manifest.title, 'title', false, MAX.title)
  if ('description' in manifest) {
    c.localised(manifest.description, 'description', true, MAX.treeDescription, MAX.treeLines)
    checkMarks(c, manifest.description, null)
  }
  if ('theme' in manifest) checkTheme(c, manifest.theme as Mapping)

  const shapes = new Map<string, NodeShape>()
  for (const node of manifest.nodes as Mapping[]) {
    const id = node.id as string
    const nodeChecker = new DocumentChecker(id, context, out)
    const shape = checkNode(nodeChecker, node)
    if (shapes.has(id)) nodeChecker.fail('id', 'V-NODE', `"${id}" is the id of two Nodes`)
    else shapes.set(id, shape)
  }
  checkGraph(out, manifest.root as string, shapes)
  return out
}

interface Context {
  languages: string[]
  images: Set<string>
  themeFiles: Set<string>
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
 * Collects violations for the manifest or one Node; the small checks they share.
 *
 * The fields are assigned in the body rather than declared as constructor parameter
 * properties: Node's built-in type stripping, which runs scripts/validate.ts, rejects those.
 */
class DocumentChecker {
  readonly where: string
  private readonly context: Context
  private readonly out: Violation[]

  constructor(where: string, context: Context, out: Violation[]) {
    this.where = where
    this.context = context
    this.out = out
  }

  fail(keyPath: string, rule: string, message: string): void {
    this.out.push({ file: this.where, keyPath, rule, message })
  }

  /**
   * V-L10N, then V-PLAIN or V-HTML depending on whether the text is rich, and the length
   * rules V-LENGTH and V-LINES, per language (tree-format.md 3.8, 5.7). `maxLines` is the
   * estimated line count rich text may take; plain text is one line by V-PLAIN.
   */
  localised(value: unknown, keyPath: string, rich: boolean, max: number, maxLines = 1): void {
    const localised = value as LocalisedText
    for (const lang of this.context.languages) {
      const text = localised[lang]
      const at = `${keyPath}.${lang}`
      // The schema has refused an empty string; a string of only spaces still reaches here.
      if (typeof text !== 'string' || text.trim() === '') {
        this.fail(at, 'V-L10N', `missing or empty text for the declared language "${lang}"`)
        continue
      }
      if (rich) {
        if (RAW_HTML.test(text)) this.fail(at, 'V-HTML', 'raw HTML is not allowed in rich text')
        const lines = estimatedLines(text)
        if (lines > maxLines) this.fail(at, 'V-LINES', `${lines} estimated lines; at most ${maxLines}`)
      } else if (text.trim().includes('\n')) {
        this.fail(at, 'V-PLAIN', 'plain text must be a single line')
      }
      const length = countedLength(text)
      if (length > max) this.fail(at, 'V-LENGTH', `${length} characters; at most ${max}`)
    }
    for (const lang of Object.keys(localised)) {
      if (!this.context.languages.includes(lang)) {
        this.fail(`${keyPath}.${lang}`, 'V-L10N', `"${lang}" is not a language the manifest declares`)
      }
    }
  }

  /** V-LENGTH for a string that is not localised: a credit, a font family, a licence. */
  length(text: string, keyPath: string, max: number): void {
    const length = countedLength(text)
    if (length > max) this.fail(keyPath, 'V-LENGTH', `${length} characters; at most ${max}`)
  }

  /** V-COUNT: a list within the maximum entries of 5.7. */
  count(value: unknown[], keyPath: string, max: number): void {
    if (value.length > max) this.fail(keyPath, 'V-COUNT', `${value.length} entries; at most ${max}`)
  }

  hasImage(file: string): boolean {
    return this.context.images.has(file)
  }

  hasThemeFile(file: string): boolean {
    return this.context.themeFiles.has(file)
  }
}

/**
 * V-THEME, the half that reads the file system and the other families (section 7); the
 * keys, the grammars, the seven colour roles and every font descriptor are the schema's.
 */
function checkTheme(c: DocumentChecker, theme: Mapping): void {
  if ('logo' in theme) checkLogo(c, theme.logo as Mapping)
  if ('fonts' in theme) checkFonts(c, theme.fonts as Mapping[])
}

/** V-THEME for the logo (4.3.1): its files are in `theme/`, and its alt text fits. */
function checkLogo(c: DocumentChecker, logo: Mapping): void {
  for (const key of ['light', 'dark', 'icon'] as const) {
    const file = logo[key]
    if (typeof file === 'string' && !c.hasThemeFile(file)) {
      c.fail(`theme.logo.${key}`, 'V-THEME', `"${file}" is not in the Tree's theme/ folder`)
    }
  }
  c.localised(logo.alt, 'theme.logo.alt', false, MAX.logoAlt)
}

/** V-THEME for the fonts (4.3.2): at most one family per role, its files present, 5.7's limits. */
function checkFonts(c: DocumentChecker, fonts: Mapping[]): void {
  c.count(fonts, 'theme.fonts', MAX.fontFamilies)
  const roles = new Set<string>()
  fonts.forEach((family, i) => {
    const at = `theme.fonts[${i}]`
    const role = family.role as string
    if (roles.has(role)) c.fail(`${at}.role`, 'V-THEME', `a Theme has at most one family per role; "${role}" is used twice`)
    else roles.add(role)
    c.length(family.family as string, `${at}.family`, MAX.fontFamily)
    c.length(family.licence as string, `${at}.licence`, MAX.fontLicence)
    const files = family.files as Mapping[]
    c.count(files, `${at}.files`, MAX.fontFiles)
    files.forEach((face, j) => {
      const file = face.file as string
      if (!c.hasThemeFile(file)) c.fail(`${at}.files[${j}].file`, 'V-THEME', `"${file}" is not in the Tree's theme/ folder`)
    })
  })
}

function checkNode(c: DocumentChecker, node: Mapping): NodeShape {
  c.localised(node.title, 'title', false, MAX.title)
  c.localised(node.description, 'description', true, MAX.nodeDescription, MAX.nodeLines)
  const sourceIds = checkSources(c, node.sources as Mapping[] | undefined)
  checkImages(c, node.images as Mapping[] | undefined, sourceIds)
  checkMarks(c, node.description, 'explainers' in node ? checkExplainers(c, node.explainers as Mapping[]) : [])
  const answers = 'answers' in node ? answerLinks(node.answers as Mapping) : []
  const options = 'options' in node ? checkOptions(c, node.options as Mapping[]) : []
  return { kind: nodeKind(node), answers, options }
}

/** V-SOURCE, the half the schema leaves: ids distinct within the Node, and 5.7's limits. */
function checkSources(c: DocumentChecker, sources: Mapping[] | undefined): Set<string> {
  const ids = new Set<string>()
  if (sources === undefined) return ids
  c.count(sources, 'sources', MAX.sources)
  sources.forEach((source, i) => {
    const at = `sources[${i}]`
    c.localised(source.label, `${at}.label`, false, MAX.sourceLabel)
    const id = source.id
    if (typeof id !== 'string') return
    if (ids.has(id)) c.fail(`${at}.id`, 'V-SOURCE', `Source id "${id}" is used twice on this Node`)
    else ids.add(id)
  })
  return ids
}

/** V-IMAGE, the half that reads `images/` and the Node's own Sources, and 5.7's limits. */
function checkImages(c: DocumentChecker, images: Mapping[] | undefined, sourceIds: Set<string>): void {
  if (images === undefined) return
  c.count(images, 'images', MAX.nodeImages)
  images.forEach((image, i) => {
    const at = `images[${i}]`
    const file = image.file as string
    if (!c.hasImage(file)) c.fail(`${at}.file`, 'V-IMAGE', `"${file}" is not in the Tree's images/ folder`)
    c.localised(image.description, `${at}.description`, false, MAX.imageDescription)
    c.length(image.credit as string, `${at}.credit`, MAX.credit)
    if ('source' in image && !sourceIds.has(image.source as string)) {
      c.fail(`${at}.source`, 'V-IMAGE', 'source must name the id of a Source on this Node')
    }
  })
}

/** The Answers as Links; whether each target exists and is of the right kind is checkGraph's. */
function answerLinks(answers: Mapping): Link[] {
  return (['yes', 'no'] as const).map((key) => ({ keyPath: `answers.${key}`, target: answers[key] as string }))
}

/** V-OPTIONS, the half that needs only this list: distinct targets, and 5.7's limits. */
function checkOptions(c: DocumentChecker, options: Mapping[]): Link[] {
  c.count(options, 'options', MAX.options)
  const links: Link[] = []
  options.forEach((option, i) => {
    const at = `options[${i}]`
    c.localised(option.title, `${at}.title`, false, MAX.optionTitle)
    const target = option.target as string
    if (links.some((link) => link.target === target)) {
      c.fail(`${at}.target`, 'V-OPTIONS', `"${target}" is the target of two Options in this list`)
    } else {
      links.push({ keyPath: `${at}.target`, target })
    }
  })
  return links
}

/**
 * V-EXPLAINER, the half that needs only the list (tree-format.md 5.9). Returns the ids that
 * a mark may name, each with its place in the list, for `checkMarks`.
 */
function checkExplainers(c: DocumentChecker, explainers: Mapping[]): Array<{ id: string; keyPath: string }> {
  c.count(explainers, 'explainers', MAX.explainers)
  const known: Array<{ id: string; keyPath: string }> = []
  explainers.forEach((explainer, i) => {
    const at = `explainers[${i}]`
    const id = explainer.id as string
    if (known.some((seen) => seen.id === id)) c.fail(`${at}.id`, 'V-EXPLAINER', `explainer id "${id}" is used twice on this Node`)
    else known.push({ id, keyPath: at })
    c.localised(explainer.term, `${at}.term`, false, MAX.explainerTerm)
    c.localised(explainer.text, `${at}.text`, false, MAX.explainerText)
  })
  return known
}

/**
 * V-MARK for every mark of a description, and the half of V-EXPLAINER that needs the
 * description: each explainer marked at least once in every language. `explainers` is null
 * for the manifest, which has none. A mark that breaks V-MARK in form still marks its
 * explainer, so one defect is reported once.
 */
function checkMarks(c: DocumentChecker, description: unknown, explainers: Array<{ id: string; keyPath: string }> | null): void {
  for (const [lang, text] of Object.entries(description as LocalisedText)) {
    const at = `description.${lang}`
    const marks = explainerMarks(text)
    for (const mark of marks) {
      const written = `"[${mark.text}](#${mark.id})"`
      if (explainers === null) c.fail(at, 'V-MARK', `${written} names no explainer; the manifest has none`)
      else if (!explainers.some((explainer) => explainer.id === mark.id)) c.fail(at, 'V-MARK', `${written} names no explainer of this Node`)
      if (mark.text.trim() === '') c.fail(at, 'V-MARK', `${written} has no text for the reader to see`)
      if (mark.emphasised) {
        c.fail(at, 'V-MARK', `${written} is inside emphasis or strong text, or holds some; the frontend styles a mark itself`)
      }
    }
    for (const { id, keyPath } of explainers ?? []) {
      if (!marks.some((mark) => mark.id === id)) {
        c.fail(keyPath, 'V-EXPLAINER', `"${id}" is not marked in ${at}; write [words](#${id}) where the term occurs`)
      }
    }
  }
}

/** The rules that need every Node: V-ROOT, Link targets, V-ORPHAN, V-REACH. */
function checkGraph(out: Violation[], root: string, shapes: Map<string, NodeShape>): void {
  const fail = (where: string, keyPath: string, rule: string, message: string): void => {
    out.push({ file: where, keyPath, rule, message })
  }
  const kindOf = (id: string): NodeKind | undefined => shapes.get(id)?.kind

  if (!shapes.has(root)) fail('manifest', 'root', 'V-ROOT', `"${root}" is not a Node of this Tree`)
  else if (kindOf(root) === 'explanation') fail('manifest', 'root', 'V-ROOT', `"${root}" is an explanation Node; root must be a question Node or a Terminal`)

  const optionTargets = new Set<string>()
  for (const [id, shape] of shapes) {
    for (const { keyPath, target } of shape.answers) {
      if (!shapes.has(target)) fail(id, keyPath, 'V-ANSWERS', `"${target}" is not a Node of this Tree`)
      else if (kindOf(target) === 'explanation') fail(id, keyPath, 'V-ANSWERS', `"${target}" is an explanation Node; an Answer must lead to a question Node or a Terminal`)
    }
    for (const { keyPath, target } of shape.options) {
      const kind = kindOf(target)
      if (kind === undefined) fail(id, keyPath, 'V-OPTIONS', `"${target}" is not a Node of this Tree`)
      else if (kind !== 'explanation') fail(id, keyPath, 'V-OPTIONS', `"${target}" is a ${kind} Node; an Option must lead to an explanation Node`)
      optionTargets.add(target)
    }
  }

  // Reachability is undefined without a valid root; V-ROOT has already said so.
  const reachable = new Set<string>()
  const walk = shapes.has(root)
  if (walk) {
    const queue = [root]
    for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
      if (reachable.has(id)) continue
      reachable.add(id)
      const shape = shapes.get(id)
      if (shape) queue.push(...[...shape.answers, ...shape.options].map((link) => link.target).filter((target) => shapes.has(target)))
    }
  }
  for (const [id, shape] of shapes) {
    // An explanation Node nobody targets is unreachable by construction; one message that
    // names the cause beats two.
    if (shape.kind === 'explanation' && !optionTargets.has(id)) {
      fail(id, '', 'V-ORPHAN', 'an explanation Node must be the target of at least one Option')
    } else if (walk && !reachable.has(id)) {
      fail(id, '', 'V-REACH', `not reachable from root "${root}" by following Answers and Options`)
    }
  }
}
