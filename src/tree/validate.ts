/**
 * The validity rules of docs/specs/tree-format.md section 7, applied to a Tree that has
 * already been read and parsed (see loader.ts, which owns the file system and reports
 * V-DIR and V-YAML). Every failing rule is collected; nothing stops at the first
 * (ADR-4-validity-rules).
 */
import type { NodeKind, Violation } from './types.ts'

/** A parsed YAML mapping whose shape is not yet trusted. */
export type Mapping = Record<string, unknown>

/** One Node document of the stream. */
export interface RawNode {
  /** The `id` key when it is a valid id, else null; `where` names the document either way. */
  id: string | null
  /** What a violation of this document is reported under: the id, or `document at line N`. */
  where: string
  /** The parsed document; null when it did not parse. */
  document: Mapping | null
}

/** The parsed contents of a Tree folder. */
export interface RawTree {
  id: string
  /** The first document of `tree.yaml`; null when it did not parse. */
  manifest: Mapping | null
  /** Every document after the first, in stream order. */
  nodes: RawNode[]
  /** The file names in `images/`. */
  images: Set<string>
  /** The file names in `theme/`. */
  themeFiles: Set<string>
}

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
const IMAGE_FILE = /^[a-z0-9]+([._-][a-z0-9]+)*\.(png|jpg|jpeg|gif|webp|svg)$/
const THEME_FILE = /^[a-z0-9]+([._-][a-z0-9]+)*\.(svg|png|webp|ico|woff2)$/
const LOGO_FILE = /\.(svg|png|webp|ico)$/
const FONT_FILE = /\.woff2$/
const LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/
const COLOUR = /^#[0-9a-f]{6}$/
const FONT_WEIGHT = /^\d{1,4}( \d{1,4})?$/
const RAW_HTML = /<[a-zA-Z/!]/
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g
const LIST_ITEM = /^(-\s|\d+\.\s)/
const OUTCOMES: readonly string[] = ['not-applicable', 'applicable', 'prohibited', 'refer']
const SOURCE_KINDS: readonly string[] = ['legal', 'case-law', 'literature']
const FONT_ROLES: readonly string[] = ['body', 'heading']
const FONT_STYLES: readonly string[] = ['normal', 'italic']
const COLOUR_ROLES = ['background', 'surface', 'text', 'text-muted', 'accent', 'accent-secondary', 'danger']
const MANIFEST_KEYS = ['format', 'languages', 'root', 'title', 'description', 'metadata', 'theme']
const NODE_KEYS = ['id', 'title', 'description', 'metadata', 'sources', 'images', 'answers', 'options', 'terminal']

/** The maximum lengths and counts of tree-format.md 5.7; the same for every language. */
const MAX = {
  title: 80,
  description: 600,
  lines: 8,
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
  optionImages: 3,
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
  const context: Context = { languages: null, images: tree.images, themeFiles: tree.themeFiles }
  let root: string | null = null

  if (tree.manifest) {
    const c = new DocumentChecker('manifest', context, out)
    const m = tree.manifest
    c.keys(m, '', MANIFEST_KEYS)
    if (m.format !== 'elsa-tree/2') c.fail('format', 'V-FORMAT', 'must be exactly "elsa-tree/2"')
    context.languages = checkLanguages(c, m.languages)
    root = c.reference(m.root, 'root', 'V-ROOT')
    if (!('title' in m)) c.fail('title', 'V-TITLE', 'title is required')
    else c.localised(m.title, 'title', false, MAX.title)
    if ('description' in m) c.localised(m.description, 'description', true, MAX.description)
    c.metadata(m.metadata)
    if ('theme' in m) checkTheme(c, m.theme)
  }

  // A document that did not parse still holds its place: `null` stands for a Node whose
  // kind and Links are unknown, so one mis-indented line breaks one Node, not the Nodes
  // that link to it (tree-format.md 3.7).
  const shapes = new Map<string, NodeShape | null>()
  for (const node of tree.nodes) {
    const c = new DocumentChecker(node.where, context, out)
    const shape = node.document ? checkNode(c, node.document) : null
    if (node.id === null) continue
    if (shapes.has(node.id)) c.fail('id', 'V-NODE', `"${node.id}" is the id of two Node documents`)
    else shapes.set(node.id, shape)
  }
  if (tree.nodes.length === 0) {
    out.push({ file: 'manifest', keyPath: '', rule: 'V-NODE', message: 'a Tree needs at least one Node document' })
  }
  checkGraph(out, root, shapes)
  return out
}

interface Context {
  languages: string[] | null
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
 * Collects violations for one document; the small checks shared by manifest and Nodes.
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

  /** V-KEYS: no keys other than the listed ones. */
  keys(value: Mapping, keyPath: string, allowed: string[]): void {
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) {
        this.fail(join(keyPath, key), 'V-KEYS', `unknown key "${key}"; allowed keys: ${allowed.join(', ')}`)
      }
    }
  }

  /**
   * V-L10N, V-PLAIN or V-HTML depending on whether the text is rich, and the length rules
   * V-LENGTH and V-LINES, per language (tree-format.md 3.8, 5.7).
   */
  localised(value: unknown, keyPath: string, rich: boolean, max: number): void {
    if (!isMapping(value)) {
      this.fail(keyPath, 'V-L10N', 'must be a mapping from language tag to text, even for one language')
      return
    }
    const expected = this.context.languages ?? Object.keys(value)
    for (const lang of expected) {
      const text = value[lang]
      const at = `${keyPath}.${lang}`
      if (typeof text !== 'string' || text.trim() === '') {
        this.fail(at, 'V-L10N', `missing or empty text for the declared language "${lang}"`)
        continue
      }
      if (rich) {
        if (RAW_HTML.test(text)) this.fail(at, 'V-HTML', 'raw HTML is not allowed in rich text')
        const lines = estimatedLines(text)
        if (lines > MAX.lines) this.fail(at, 'V-LINES', `${lines} estimated lines; at most ${MAX.lines}`)
      } else if (text.trim().includes('\n')) {
        this.fail(at, 'V-PLAIN', 'plain text must be a single line')
      }
      const length = countedLength(text)
      if (length > max) this.fail(at, 'V-LENGTH', `${length} characters; at most ${max}`)
    }
    for (const lang of Object.keys(value)) {
      if (!expected.includes(lang)) this.fail(`${keyPath}.${lang}`, 'V-L10N', `"${lang}" is not a language the manifest declares`)
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
      this.fail(keyPath, 'V-CROSS', `"${value}" contains a colon; Cross-links are not part of elsa-tree/2`)
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

  hasThemeFile(file: string): boolean {
    return this.context.themeFiles.has(file)
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

/** Tree-format.md 4.3.2: one weight, or a variable font's range, each number 1 to 1000. */
function isFontWeight(value: unknown): boolean {
  if (typeof value !== 'string' || !FONT_WEIGHT.test(value)) return false
  return value.split(' ').every((number) => Number(number) >= 1 && Number(number) <= 1000)
}

/** V-LANG. Returns the languages when they are usable for the text checks, else null. */
function checkLanguages(c: DocumentChecker, value: unknown): string[] | null {
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

/** V-THEME: the optional Theme of tree-format.md 4.3, each part present in full. */
function checkTheme(c: DocumentChecker, value: unknown): void {
  if (!isMapping(value)) {
    c.fail('theme', 'V-THEME', 'must be a mapping with at least one of logo, fonts, colours')
    return
  }
  c.keys(value, 'theme', ['logo', 'fonts', 'colours'])
  if (!('logo' in value) && !('fonts' in value) && !('colours' in value)) {
    c.fail('theme', 'V-THEME', 'must carry at least one of logo, fonts, colours; an empty theme is a mistake')
  }
  if ('logo' in value) checkLogo(c, value.logo)
  if ('fonts' in value) checkFonts(c, value.fonts)
  if ('colours' in value) checkColours(c, value.colours)
}

/** V-THEME, the logo part (4.3.1). */
function checkLogo(c: DocumentChecker, value: unknown): void {
  const at = 'theme.logo'
  if (!isMapping(value)) {
    c.fail(at, 'V-THEME', 'logo must be a mapping with light and alt')
    return
  }
  c.keys(value, at, ['light', 'dark', 'icon', 'alt', 'url'])
  for (const key of ['light', 'dark', 'icon']) {
    if (!(key in value)) {
      if (key === 'light') c.fail(`${at}.light`, 'V-THEME', 'light is required: the logo for a light background')
      continue
    }
    checkThemeFile(c, value[key], `${at}.${key}`, LOGO_FILE, 'a logo file must be .svg, .png, .webp or .ico')
  }
  if (!('alt' in value)) c.fail(`${at}.alt`, 'V-THEME', 'alt is required: the alternative text of the logo')
  else c.localised(value.alt, `${at}.alt`, false, MAX.logoAlt)
  if ('url' in value && !isHttpUrl(value.url)) {
    c.fail(`${at}.url`, 'V-THEME', 'url must be an absolute http:// or https:// URL')
  }
}

/** V-THEME, the fonts part (4.3.2), and the V-COUNT and V-LENGTH rules that apply to it. */
function checkFonts(c: DocumentChecker, value: unknown): void {
  if (!Array.isArray(value) || value.length === 0) {
    c.fail('theme.fonts', 'V-THEME', 'fonts must be a non-empty list of font families')
    return
  }
  c.count(value, 'theme.fonts', MAX.fontFamilies)
  const roles = new Set<string>()
  value.forEach((family: unknown, i) => {
    const at = `theme.fonts[${i}]`
    if (!isMapping(family)) {
      c.fail(at, 'V-THEME', 'a font family must be a mapping with family, role, files and licence')
      return
    }
    c.keys(family, at, ['family', 'role', 'files', 'licence'])
    if (typeof family.family !== 'string' || family.family.trim() === '') {
      c.fail(`${at}.family`, 'V-THEME', 'family must be a non-empty string: the CSS font-family name')
    } else {
      c.length(family.family, `${at}.family`, MAX.fontFamily)
    }
    if (typeof family.role !== 'string' || !FONT_ROLES.includes(family.role)) {
      c.fail(`${at}.role`, 'V-THEME', `role must be one of ${FONT_ROLES.join(', ')}`)
    } else if (roles.has(family.role)) {
      c.fail(`${at}.role`, 'V-THEME', `a Theme has at most one family per role; "${family.role}" is used twice`)
    } else {
      roles.add(family.role)
    }
    if (typeof family.licence !== 'string' || family.licence.trim() === '') {
      c.fail(`${at}.licence`, 'V-THEME', 'licence is required for every font family and must be a non-empty string')
    } else {
      c.length(family.licence, `${at}.licence`, MAX.fontLicence)
    }
    checkFontFiles(c, family.files, `${at}.files`)
  })
}

function checkFontFiles(c: DocumentChecker, value: unknown, at: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    c.fail(at, 'V-THEME', 'files must be a non-empty list of font files')
    return
  }
  c.count(value, at, MAX.fontFiles)
  value.forEach((face: unknown, i) => {
    const here = `${at}[${i}]`
    if (!isMapping(face)) {
      c.fail(here, 'V-THEME', 'a font file must be a mapping with file, weight and style')
      return
    }
    c.keys(face, here, ['file', 'weight', 'style'])
    checkThemeFile(c, face.file, `${here}.file`, FONT_FILE, 'a font file must be .woff2')
    if (!isFontWeight(face.weight)) {
      c.fail(`${here}.weight`, 'V-THEME', 'weight must be a quoted number such as "400", or a range such as "300 800"')
    }
    if (typeof face.style !== 'string' || !FONT_STYLES.includes(face.style)) {
      c.fail(`${here}.style`, 'V-THEME', `style must be one of ${FONT_STYLES.join(', ')}`)
    }
  })
}

/** A theme file name (3.6) with the extension its role allows, present in `theme/`. */
function checkThemeFile(c: DocumentChecker, value: unknown, at: string, extension: RegExp, message: string): void {
  if (!isThemeFile(value)) {
    c.fail(at, 'V-THEME', 'must be a bare lowercase theme file name such as logo.svg')
    return
  }
  if (!extension.test(value)) c.fail(at, 'V-THEME', message)
  else if (!c.hasThemeFile(value)) c.fail(at, 'V-THEME', `"${value}" is not in the Tree's theme/ folder`)
}

/** V-THEME, the colours part (4.3.3): exactly the seven roles, each `#rrggbb`. */
function checkColours(c: DocumentChecker, value: unknown): void {
  if (!isMapping(value)) {
    c.fail('theme.colours', 'V-THEME', `colours must be a mapping with the roles ${COLOUR_ROLES.join(', ')}`)
    return
  }
  for (const role of COLOUR_ROLES) {
    if (!(role in value)) {
      c.fail(`theme.colours.${role}`, 'V-THEME', `the colour role "${role}" is missing; the set of seven is closed`)
    } else if (typeof value[role] !== 'string' || !COLOUR.test(value[role])) {
      c.fail(`theme.colours.${role}`, 'V-THEME', 'must be a quoted colour of six lowercase hex digits, such as "#ffc600"')
    }
  }
  for (const role of Object.keys(value)) {
    if (!COLOUR_ROLES.includes(role)) {
      c.fail(`theme.colours.${role}`, 'V-THEME', `unknown colour role "${role}"; the set of seven is closed`)
    }
  }
}

function checkNode(c: DocumentChecker, node: Mapping): NodeShape {
  c.keys(node, '', NODE_KEYS)
  if (!('id' in node)) c.fail('id', 'V-NODE', 'every Node document needs an id')
  else if (!isId(node.id)) c.fail('id', 'V-NODE', 'id must be an id: lowercase letters, digits and single hyphens')
  for (const key of ['title', 'description', 'metadata']) {
    if (!(key in node)) c.fail(key, 'V-NODE', `"${key}" is required on every Node`)
  }
  if ('title' in node) c.localised(node.title, 'title', false, MAX.title)
  if ('description' in node) c.localised(node.description, 'description', true, MAX.description)
  if ('metadata' in node) c.metadata(node.metadata)
  const sourceIds = checkSources(c, node.sources)
  checkImages(c, node.images, 'images', MAX.nodeImages, sourceIds)
  if ('answers' in node && 'terminal' in node) {
    c.fail('terminal', 'V-KIND', 'a Node has either answers (question Node) or terminal (Terminal), never both')
  }
  const answers = 'answers' in node ? checkAnswers(c, node.answers) : []
  const options = 'options' in node ? checkOptions(c, node.options, sourceIds) : []
  if ('terminal' in node) checkTerminal(c, node.terminal, 'options' in node)
  return { kind: nodeKind(node), answers, options }
}

/** V-SOURCE. Returns the Source ids declared, for the Images that point at them. */
function checkSources(c: DocumentChecker, value: unknown): Set<string> {
  const ids = new Set<string>()
  if (value === undefined) return ids
  if (!Array.isArray(value)) {
    c.fail('sources', 'V-SOURCE', 'must be a list')
    return ids
  }
  c.count(value, 'sources', MAX.sources)
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
    else c.localised(source.label, `${at}.label`, false, MAX.sourceLabel)
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
function checkImages(c: DocumentChecker, value: unknown, keyPath: string, max: number, sourceIds: Set<string>): void {
  if (value === undefined) return
  if (!Array.isArray(value)) {
    c.fail(keyPath, 'V-IMAGE', 'must be a list')
    return
  }
  c.count(value, keyPath, max)
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
    else c.localised(image.description, `${at}.description`, false, MAX.imageDescription)
    if (typeof image.credit !== 'string' || image.credit.trim() === '') {
      c.fail(`${at}.credit`, 'V-IMAGE', 'credit is required for every Image and must be a non-empty string')
    } else {
      c.length(image.credit, `${at}.credit`, MAX.credit)
    }
    if ('source' in image && !(typeof image.source === 'string' && sourceIds.has(image.source))) {
      c.fail(`${at}.source`, 'V-IMAGE', 'source must name the id of a Source on this Node')
    }
  })
}

/** V-ANSWERS, the part that needs only this document; the targets are checked in checkGraph. */
function checkAnswers(c: DocumentChecker, value: unknown): Link[] {
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

/** V-OPTIONS, the part that needs only this document; the targets are checked in checkGraph. */
function checkOptions(c: DocumentChecker, value: unknown, sourceIds: Set<string>): Link[] {
  if (!Array.isArray(value) || value.length === 0) {
    c.fail('options', 'V-OPTIONS', 'must be a non-empty list')
    return []
  }
  c.count(value, 'options', MAX.options)
  const links: Link[] = []
  value.forEach((option: unknown, i) => {
    const at = `options[${i}]`
    if (!isMapping(option)) {
      c.fail(at, 'V-OPTIONS', 'must be a mapping with title and target')
      return
    }
    c.keys(option, at, ['title', 'target', 'images'])
    if (!('title' in option)) c.fail(`${at}.title`, 'V-OPTIONS', 'title is required')
    else c.localised(option.title, `${at}.title`, false, MAX.optionTitle)
    const target = c.reference(option.target, `${at}.target`, 'V-OPTIONS')
    if (target && links.some((link) => link.target === target)) {
      c.fail(`${at}.target`, 'V-OPTIONS', `"${target}" is the target of two Options in this list`)
    } else if (target) {
      links.push({ keyPath: `${at}.target`, target })
    }
    checkImages(c, option.images, `${at}.images`, MAX.optionImages, sourceIds)
  })
  return links
}

/** V-TERMINAL. */
function checkTerminal(c: DocumentChecker, value: unknown, hasOptions: boolean): void {
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
function checkGraph(out: Violation[], root: string | null, shapes: Map<string, NodeShape | null>): void {
  const fail = (where: string, keyPath: string, rule: string, message: string): void => {
    out.push({ file: where, keyPath, rule, message })
  }
  const exists = (id: string): boolean => shapes.has(id)
  // Undefined for a Node whose document did not parse: its kind is unknown, so kind rules skip it.
  const kindOf = (id: string): NodeKind | undefined => shapes.get(id)?.kind

  if (root !== null) {
    if (!exists(root)) fail('manifest', 'root', 'V-ROOT', `"${root}" is not a Node of this Tree`)
    else if (kindOf(root) === 'explanation') fail('manifest', 'root', 'V-ROOT', `"${root}" is an explanation Node; root must be a question Node or a Terminal`)
  }

  const optionTargets = new Set<string>()
  for (const [id, shape] of shapes) {
    if (!shape) continue
    for (const { keyPath, target } of shape.answers) {
      if (!exists(target)) fail(id, keyPath, 'V-ANSWERS', `"${target}" is not a Node of this Tree`)
      else if (kindOf(target) === 'explanation') fail(id, keyPath, 'V-ANSWERS', `"${target}" is an explanation Node; an Answer must lead to a question Node or a Terminal`)
    }
    for (const { keyPath, target } of shape.options) {
      const kind = kindOf(target)
      if (!exists(target)) fail(id, keyPath, 'V-OPTIONS', `"${target}" is not a Node of this Tree`)
      else if (kind !== undefined && kind !== 'explanation') fail(id, keyPath, 'V-OPTIONS', `"${target}" is a ${kind} Node; an Option must lead to an explanation Node`)
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
    // An explanation Node nobody targets is unreachable by construction; one message that
    // names the cause beats two.
    if (shape?.kind === 'explanation' && !optionTargets.has(id)) {
      fail(id, '', 'V-ORPHAN', 'an explanation Node must be the target of at least one Option')
    } else if (walk && !reachable.has(id)) {
      fail(id, '', 'V-REACH', `not reachable from root "${root}" by following Answers and Options`)
    }
  }
}
