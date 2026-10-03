/**
 * **[#181]** The tree creation interface walked as one, after #172 to #180 built the owner's
 * fifteen points of #169 each on its own (docs/specs/application.md 28, 30, 31, 33, 35.7): a
 * creator signs in, makes a Tree, fills its first step with a title, a text, three pictures
 * and a Source, adds yes and no, ends a step with typed words, adds eight side bubbles and fills
 * one, deletes a side bubble and a step, opens the to-do bubble and the settings panel, changes
 * the colours and the fonts, publishes, and opens the public page.
 *
 * Six walks, each on a Tree of its own in the chrome language it is walked in: 1280 x 640 (the
 * guarantee, 10.4), 1920 x 1080 and 390 x 844, in English and in Dutch. At every step the page
 * is photographed and audited; the audit is the owner's standard of #169 ("all input boxes and
 * fonts everywhere ... don't exceed their parent boxes") made measurable:
 *
 * - 10.6's exact test, as `admin-no-scroll.spec.ts` runs it;
 * - no two controls on screen drawing over each other (`overlapping`);
 * - no field, button or line of text crossing the box it is drawn in (`outside`);
 * - no chrome word of the other language on the page (`otherLanguage`).
 *
 * All four are asserted, and every row goes to `measurements-<lang>-<size>.md` beside the
 * screenshots, which go to `docs/screenshots/issue-181/` under `ELSA_SHOTS=1` and the results
 * folder otherwise (35.7). The two scroll boxes the walk opens, the to-do bubble and the
 * settings panel, are audited at every scroll position as well (`sweep`).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Locator, type Page, type Response } from '@playwright/test'
import { chrome, type Chrome } from '../../src/chrome.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { arrived } from './arrived.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-181') : path.join(RESULTS, 'shots', 'issue-181')
const PORT = BASE_PORT + 180

const CREATOR = {
  email: 'carla@example.org',
  name: 'Carla',
  password: 'carlas first password',
}
const IMAGES = path.join(repo, 'trees', 'ai-act-example', 'images')
const FONT = path.join(repo, 'trees', 'ai-act-example', 'theme', 'nova-square-400.woff2')
const LAW = 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'
/** A credit of the 120 characters the format allows (tree-format.md 5.7), in words as a credit has them. */
const FULL_CREDIT = 'Photograph by Maria van den Berg-Oosterhuis for the ELSA Lab, licensed CC BY-SA 4.0, cropped and recoloured by the team.'

type Lang = 'en' | 'nl'

/** The six walks of the issue: three viewports, two languages. */
const WALKS: { lang: Lang; width: number; height: number }[] = [
  { lang: 'en', width: 1280, height: 640 },
  { lang: 'nl', width: 1280, height: 640 },
  { lang: 'en', width: 1920, height: 1080 },
  { lang: 'nl', width: 1920, height: 1080 },
  { lang: 'en', width: 390, height: 844 },
  { lang: 'nl', width: 390, height: 844 },
]

/** The texts the creator types, per language: placeholder content (the Tree's content is the owner's to write). */
const WORDS = {
  en: {
    tree: 'Does the walk reach the end',
    title: 'Is the system placed on the market by a provider?',
    text: 'A provider develops an AI system and puts it on the market under its own name.',
    credit: 'ELSA project, placeholder picture',
    description: 'A crate of produce on a conveyor belt',
    source: 'Article 3 of the AI Act',
    yesTitle: 'The AI Act applies to you',
    yesText: 'As the provider you carry the obligations of the Act.',
    yesEnding: 'Applies to you',
    noTitle: 'The AI Act does not apply to you',
    noText: 'Without placing a system on the market you are not its provider.',
    noEnding: 'Does not apply',
    asideTitle: 'What is placing on the market?',
    asideText: 'Making a system available on the EU market for the first time.',
    otherAside: 'Side bubble',
    otherText: 'A side bubble the walk fills to publish.',
  },
  nl: {
    tree: 'Bereikt de wandeling het einde',
    title: 'Brengt een aanbieder het systeem op de markt?',
    text: 'Een aanbieder ontwikkelt een AI-systeem en brengt het onder eigen naam op de markt.',
    credit: 'ELSA-project, voorlopige afbeelding',
    description: 'Een krat groente op een lopende band',
    source: 'Artikel 3 van de AI-verordening',
    yesTitle: 'De AI-verordening is op u van toepassing',
    yesText: 'Als aanbieder draagt u de verplichtingen van de verordening.',
    yesEnding: 'Van toepassing',
    noTitle: 'De AI-verordening is niet op u van toepassing',
    noText: 'Wie geen systeem op de markt brengt, is er niet de aanbieder van.',
    noEnding: 'Niet van toepassing',
    asideTitle: 'Wat is in de handel brengen?',
    asideText: 'Een systeem voor het eerst op de EU-markt aanbieden.',
    otherAside: 'Zijbel',
    otherText: 'Een zijbel die de wandeling invult om te publiceren.',
  },
} as const

let origin: string

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  origin = await serveStore(await buildDataDir({ trees: [], accounts: [CREATOR] }), PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

/**
 * A walk's rows, written to a file of its own when it ends, passed or not: a failed walk
 * restarts the worker, and with it anything a file shared by the six would have held.
 */
async function writeRows(walk: Walk): Promise<void> {
  const table = [
    '| Step | document h/inner h | document w/inner w | overflowing | overlapping controls | crossing their box | words of the other language |',
    '|---|---|---|---|---|---|---|',
    ...walk.rows,
  ]
  const detours = walk.detours.length ? `\nDone otherwise than through the page:\n\n${walk.detours.map((d) => `- ${d}`).join('\n')}\n` : ''
  await writeFile(path.join(SHOTS, `measurements-${walk.lang}-${walk.size}.md`), `# ${walk.lang}, ${walk.size}\n\n${table.join('\n')}\n${detours}`)
}

interface Audit {
  doc: { sh: number; sw: number }
  inner: { h: number; w: number }
  overflowing: string[]
  overlapping: string[]
  outside: string[]
  otherLanguage: string[]
}

/**
 * The chrome strings of the other language that this one says differently: one of them on a
 * page in `lang` is a word left untranslated (#181's "a word left in one language only").
 * Templates and words both languages share are not looked for; the short ones are, "Ja" and
 * "No" among them.
 */
function otherWords(lang: Lang): string[] {
  const own = chrome(lang) as unknown as Record<string, unknown>
  const other = chrome(lang === 'en' ? 'nl' : 'en') as unknown as Record<string, unknown>
  const words = new Set<string>()
  for (const [key, value] of Object.entries(other)) {
    if (typeof value !== 'string' || value === own[key] || /[{}]/.test(value)) continue
    words.add(value.trim())
  }
  return [...words]
}

/**
 * The page audited once its fonts have settled: 10.6's exact test (the exemptions of
 * `admin-no-scroll.spec.ts`), then, over what is drawn inside the window and not under a
 * Sheet's scrim, the three checks of the owner's standard.
 */
async function audit(page: Page, lang: Lang): Promise<Audit> {
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate((other) => {
    const name = (el: Element): string => {
      const classes = [...el.classList]
        .slice(0, 2)
        .map((c) => `.${c}`)
        .join('')
      const field = el.closest('[data-field]')?.getAttribute('data-field')
      return `${el.tagName.toLowerCase()}${classes}${field && !classes ? `[${field}]` : ''}`
    }
    const overflowing: string[] = []
    for (const el of document.querySelectorAll('*')) {
      if (el.matches('[data-scroll-box], [data-clamp], [data-carousel-strip]')) continue
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
        overflowing.push(`${name(el)} holds ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`)
      }
    }

    // Drawn, inside the window, and not a neighbour frame's copy (11.3) or a hidden duplicate.
    const shown = (el: Element): boolean => {
      if (el.closest('[aria-hidden="true"], [inert], [hidden]')) return false
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) return false
      if (r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) return false
      const style = getComputedStyle(el)
      return style.visibility !== 'hidden' && Number(style.opacity) > 0.05
    }
    // On top: what the pointer reaches at its middle is the control, not a scrim over it.
    const onTop = (el: Element): boolean => {
      const r = el.getBoundingClientRect()
      const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1)
      const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1)
      const hit = document.elementFromPoint(x, y)
      return hit !== null && (hit === el || el.contains(hit) || (hit.tagName === 'LABEL' && hit.contains(el)))
    }
    const controls = [...document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="switch"]')].filter(
      (el) => shown(el) && onTop(el),
    )
    const overlapping: string[] = []
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        const a = controls[i]!
        const b = controls[j]!
        if (a.contains(b) || b.contains(a)) continue
        const ra = a.getBoundingClientRect()
        const rb = b.getBoundingClientRect()
        const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
        const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
        if (w > 1 && h > 1) overlapping.push(`${name(a)} and ${name(b)} by ${Math.round(w)}x${Math.round(h)}`)
      }
    }

    // A box: what draws an edge around what it holds -- a fill, a border, a clip.
    const isBox = (el: Element): boolean => {
      const s = getComputedStyle(el)
      return s.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0 || s.overflow !== 'visible'
    }
    const boxOf = (el: Element | null): Element | null => {
      let box = el
      while (box && box !== document.body && !isBox(box)) box = box.parentElement
      return box === document.body ? null : box
    }
    // **[#181]** A scroll box's content passes its top and bottom as it scrolls (26.3): there, only its sides are edges.
    const crossing = (r: DOMRect, q: DOMRect, scrolls = false): string | null => {
      const by = [q.left - r.left, r.right - q.right, scrolls ? 0 : q.top - r.top, scrolls ? 0 : r.bottom - q.bottom].map((d) => Math.round(d * 10) / 10)
      return by.some((d) => d > 1) ? `left ${by[0]}, right ${by[1]}, top ${by[2]}, bottom ${by[3]}` : null
    }
    const outside: string[] = []
    for (const el of document.querySelectorAll('textarea, input:not([type="hidden"]), select, button')) {
      // The step's two buttons stand in the band above the Bubble, out of its box by design (30.8).
      if (!shown(el) || el.closest('.step-delete, .step-end')) continue
      const box = boxOf(el.parentElement)
      if (!box || !shown(box)) continue
      const by = crossing(el.getBoundingClientRect(), box.getBoundingClientRect(), box.matches('[data-scroll-box]'))
      if (by) outside.push(`${name(el)} out of ${name(box)}: ${by}`)
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set<string>()
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement
      if (!node.textContent?.trim() || !parent || !shown(parent)) continue
      if (parent.closest('[data-clamp], [data-carousel-strip], [data-scroll-box], script, style, noscript')) continue
      const box = boxOf(parent)
      if (!box || !shown(box)) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const q = box.getBoundingClientRect()
      for (const r of range.getClientRects()) {
        const by = crossing(r, q)
        const line = `"${node.textContent.trim().slice(0, 30)}" out of ${name(box)}: ${by}`
        if (by && !seen.has(line)) {
          seen.add(line)
          outside.push(line)
        }
      }
    }

    const otherLanguage = new Set<string>()
    const words = new Set(other)
    for (const el of document.querySelectorAll('body *')) {
      if (!shown(el) && !el.matches('[aria-label], [title]')) continue
      if (el.closest('[aria-hidden="true"]')) continue
      for (const attribute of ['aria-label', 'title', 'placeholder', 'alt']) {
        const value = el.getAttribute(attribute)?.trim()
        if (value && words.has(value)) otherLanguage.add(`${attribute} "${value}" on ${name(el)}`)
      }
      for (const child of el.childNodes) {
        const value = child.nodeType === Node.TEXT_NODE ? child.textContent?.trim() : ''
        if (value && words.has(value) && shown(el)) otherLanguage.add(`"${value}" in ${name(el)}`)
      }
    }

    const d = document.documentElement
    const b = document.body
    return {
      doc: {
        sh: Math.max(d.scrollHeight, b.scrollHeight),
        sw: Math.max(d.scrollWidth, b.scrollWidth),
      },
      inner: { h: window.innerHeight, w: window.innerWidth },
      overflowing,
      overlapping,
      outside,
      otherLanguage: [...otherLanguage],
    }
  }, otherWords(lang))
}

/** One walk: its language, its viewport, the Tree it makes, and what it measured. */
interface Walk {
  page: Page
  lang: Lang
  ui: Chrome
  size: string
  tree: string
  rows: string[]
  /** What the walk could not do through the page, and did otherwise: each a finding for the pull request. */
  detours: string[]
}

/**
 * One step's record: the screenshot `name` and the audit, the row kept for
 * `measurements-<lang>-<size>.md` whether it passes or not, so a failing step still leaves its
 * numbers.
 */
async function step(walk: Walk, name: string): Promise<void> {
  const { page, lang, size } = walk
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: path.join(SHOTS, `${name}-${lang}-${size}.png`),
  })
  const m = await audit(page, lang)
  const cell = (list: string[]) => list.join('; ').replace(/\|/g, '/') || 'none'
  walk.rows.push(
    `| ${name} | ${m.doc.sh}/${m.inner.h} | ${m.doc.sw}/${m.inner.w} | ${cell(m.overflowing)} | ${cell(m.overlapping)} | ${cell(m.outside)} | ${cell(m.otherLanguage)} |`,
  )
  const where = `${name} (${lang}, ${size})`
  expect.soft(m.doc.sh, `${where}: taller than the window`).toBeLessThanOrEqual(m.inner.h + 1)
  expect.soft(m.doc.sw, `${where}: wider than the window`).toBeLessThanOrEqual(m.inner.w + 1)
  expect.soft(m.overflowing, `${where}: elements whose content is larger than themselves`).toEqual([])
  // **[#181]** The owner's standard: no control over another, nothing across its box, no word left in the other language.
  expect.soft(m.overlapping, `${where}: controls drawn over each other`).toEqual([])
  expect.soft(m.outside, `${where}: fields, buttons and lines of text crossing their box`).toEqual([])
  expect.soft(m.otherLanguage, `${where}: chrome words of the other language`).toEqual([])
}

/**
 * **[#181]** The controls of a scroll box (26.3) against what is drawn over them, wherever it is
 * scrolled: the settings panel's slid under its cross at some scroll positions only (at 1280 x
 * 640, 122 of 345), which one screenshot at one position meets or misses by the font's metrics.
 */
async function sweep(walk: Walk, box: Locator, what: string): Promise<void> {
  const range = await box.evaluate((element) => element.scrollHeight - element.clientHeight)
  for (let top = 0; ; top += 12) {
    const at = Math.min(top, range)
    await box.evaluate((element, y) => element.scrollTo(0, y), at)
    const { overlapping } = await audit(walk.page, walk.lang)
    expect.soft(overlapping, `${what} scrolled to ${at} of ${range} (${walk.lang}, ${walk.size}): controls drawn over each other`).toEqual([])
    if (at === range) break
  }
}

/**
 * **[#181]** The language field names what it takes and says it while it is empty, in a
 * placeholder that fits its box: the audit's scroll measure does not see a placeholder.
 */
async function expectLanguageField(walk: Walk, scope: Page | Locator): Promise<void> {
  const { ui } = walk
  const field = scope.getByRole('textbox', { name: ui.languageTag, exact: true })
  await expect(field).toHaveAttribute('placeholder', ui.languageTag)
  const fit = await field.evaluate((element) => {
    const input = element as HTMLInputElement
    const style = getComputedStyle(input)
    const context = document.createElement('canvas').getContext('2d')!
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    return { text: context.measureText(input.placeholder).width, room: input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) }
  })
  expect.soft(fit.text, `${walk.lang}, ${walk.size}: the language field's placeholder is wider than its room of ${fit.room}`).toBeLessThanOrEqual(fit.room)
}

/** The page's own script is there: every Sheet draws its backdrop in the render after hydration. */
async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('details.sheet > .sheet-backdrop').first()).toBeAttached()
}

const status = (page: Page) => page.getByRole('status')
/** The visible region of one field (28.1). */
const field = (page: Page, nodeId: string, keyPath: string) => page.locator(`[data-field="${nodeId} ${keyPath}"]`).filter({ visible: true })

/** The editor's write of a field, answered: registered before the blur that sends it (29.1). */
function written(page: Page): Promise<Response> {
  return page.waitForResponse((response) => response.url().startsWith(`${origin}/admin/api/trees/`) && response.request().method() === 'PATCH', { timeout: 20_000 })
}

/**
 * Types `text` into the field `keyPath` of `nodeId` as a creator does and leaves it, which
 * writes it at once (29.1); waits for the store's answer and the indicator's `saved`. A
 * description is shown rendered until it is clicked (28.5), so the click comes first.
 */
async function write(walk: Walk, nodeId: string, keyPath: string, text: string): Promise<void> {
  const { page, ui } = walk
  const region = field(page, nodeId, keyPath)
  const rendered = region.locator('.editor-rendered')
  if (await rendered.count()) await rendered.click({ position: { x: 2, y: 2 } })
  const area = region.locator('textarea')
  await area.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.type(text, { delay: 1 })
  await expect(area).toHaveValue(text)
  const answer = written(page)
  await area.blur()
  expect((await answer).status(), `${nodeId} ${keyPath}`).toBe(200)
  await expect(status(page)).toContainText(ui.saved)
}

/** The id at the end of the page's address, where a creation just navigated (30.2, 30.4). */
async function landed(page: Page, from: string): Promise<string> {
  await page.waitForURL((url) => url.pathname.startsWith(`${from}/`) && url.pathname.split('/').length === from.split('/').length + 1, { timeout: 20_000 })
  const id = new URL(page.url()).pathname.split('/').pop() ?? ''
  expect(id).toMatch(/^n-[a-z2-7]{6}$/)
  await hydrated(page)
  return id
}

const editor = (walk: Walk, ...nodeIds: string[]) => `${origin}/admin/trees/${walk.tree}/${nodeIds.join('/')}`

/** Opens the editor at `nodeIds`, its script listening. */
async function open(walk: Walk, ...nodeIds: string[]): Promise<void> {
  await walk.page.goto(editor(walk, ...nodeIds))
  await hydrated(walk.page)
}

/** A picture of the example Tree, as a file the page's input takes. */
async function picture(file: string): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
  return {
    name: file,
    mimeType: 'image/png',
    buffer: await readFile(path.join(IMAGES, file)),
  }
}

/**
 * The picker a creator uploads with in `scope`: the empty slot, or the strip's `+` where the
 * slot is given up (10.5, step 5) or taken (31.1). Null where neither is on screen.
 */
async function picker(scope: Locator): Promise<Locator | null> {
  for (const candidate of [scope.locator('.editor-picker--slot'), scope.locator('.carousel > .editor-picker--strip')]) {
    const shown = candidate.filter({ visible: true }).first()
    if (await shown.count()) return shown
  }
  return null
}

/**
 * Uploads `file` through the picker of `scope` and fills the attach Sheet (31.2); `beforeAttach`
 * runs with the Sheet open and filled. Answers false where the page offers no picker.
 */
async function attachPicture(walk: Walk, scope: Locator, file: string, beforeAttach?: (attach: Locator) => Promise<void>): Promise<boolean> {
  const { page, ui, lang } = walk
  const control = await picker(scope)
  if (!control) return false
  await control.locator('input[type="file"]').setInputFiles(await picture(file))
  const attach = page.locator('.editor-attach-panel')
  await expect(attach).toBeVisible()
  await attach.getByLabel(ui.credit, { exact: true }).fill(WORDS[lang].credit)
  await attach.getByLabel(ui.imageDescription, { exact: true }).fill(WORDS[lang].description)
  if (beforeAttach) await beforeAttach(attach)
  const answer = written(page)
  await attach.getByRole('button', { name: ui.attach, exact: true }).click()
  expect((await answer).status()).toBe(200)
  await expect(attach).toHaveCount(0)
  return true
}

/**
 * Adds a Source with its link and its name (28.1) in `scope`: inline where the Sources block is
 * on screen, in its collapsed Sheet below the guarantee (28.6). `shoot` runs with the new Source's
 * name typed, before the Sheet is left.
 */
async function addSource(walk: Walk, scope: Locator, nodeId: string, shoot?: () => Promise<void>): Promise<void> {
  const { page, lang } = walk
  let block = scope
  let add = block.locator('.source-sheet--add > .sheet-open').filter({ visible: true }).first()
  if ((await add.count()) === 0) {
    const collapsed = scope.locator('.sources-sheet > .sheet-open').filter({ visible: true }).first()
    await collapsed.click()
    block = scope.locator('.sources-sheet > .sheet-panel').filter({ visible: true }).first()
    add = block.locator('.source-sheet--add > .sheet-open')
  }
  await add.click()
  // The collapsed copy holds a form of its own: the one in the Sheet just opened is the creator's.
  await expect(add.locator('xpath=..').locator('.source-editor--add .editor-url')).toBeFocused()
  await page.keyboard.type(LAW)
  await page.keyboard.press('Enter')
  const label = block.locator(`[data-field="${nodeId} sources[0].label.${lang}"] textarea`).filter({ visible: true }).first()
  await expect(label).toBeFocused()
  await page.keyboard.type(WORDS[lang].source, { delay: 1 })
  const answer = written(page)
  await label.blur()
  expect((await answer).status()).toBe(200)
  if (shoot) await shoot()
}

/** `treeEndsHere` with `words` typed into its one field (30.3; **[#179]** 36.3); `shoot` runs with the words typed. */
async function endHere(walk: Walk, nodeId: string, words: string, shoot?: () => Promise<void>): Promise<void> {
  const { page, ui, lang } = walk
  await page.locator('.structure-end > .sheet-open').click()
  const form = page.locator('.structure-form--end')
  await expect(form).toBeVisible()
  await expect(form.getByRole('textbox')).toBeFocused()
  await page.keyboard.type(words, { delay: 5 })
  if (shoot) await shoot()
  await form.getByRole('button', { name: ui.confirm, exact: true }).click()
  await expect(page.locator(`[data-field="${nodeId} terminal.label.${lang}"] textarea`)).toHaveValue(words)
}

/** The fan's `+` (30.4), where it is on screen. */
const sideAdd = (page: Page) => page.locator('.options > li.options-add > .side-add').filter({ visible: true })

/**
 * One new side bubble of the root: the fan's `+` where it is on screen (30.4), the API's
 * `POST .../nodes` otherwise, recorded as a detour. Answers the new Node's id.
 */
async function newSideBubble(walk: Walk, cookie: string, number: number): Promise<string> {
  const { page } = walk
  await open(walk, 'start')
  if (await sideAdd(page).count()) {
    await sideAdd(page).click()
    return landed(page, `/admin/trees/${walk.tree}/start`)
  }
  walk.detours.push(`side bubble ${number} through the API -- the fan's + is not on screen at ${number - 1} side bubbles`)
  const created = await page.request.post(`${origin}/admin/api/trees/${walk.tree}/nodes`, {
    headers: {
      Origin: origin,
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({ from: { node: 'start', link: 'option' } }),
  })
  expect(created.status()).toBe(201)
  return ((await created.json()) as { node: { id: string } }).node.id
}

const panelButton = (page: Page) => page.locator('.panel-sheet > .sheet-open')
const panel = (page: Page) => page.locator('.panel-sheet > .sheet-panel')
const todoButton = (page: Page) => page.locator('.todo-sheet > .sheet-open')
const todoBubble = (page: Page) => page.locator('.todo-sheet > .sheet-panel')
const themePanel = (page: Page) => panel(page).locator('[data-theme-panel]')

/** Opens the settings panel (33.1) once it has re-read what it shows. */
async function openPanel(page: Page): Promise<void> {
  const reread = page.waitForResponse((response) => response.url().endsWith('/admin/api/accounts'), { timeout: 20_000 })
  await panelButton(page).click()
  await expect(panel(page)).toBeVisible()
  await reread
}

/** Waits for the Theme's next part write to be answered (33.8). */
function themeWrite(walk: Walk): Promise<Response> {
  return walk.page.waitForResponse((response) => response.request().method() === 'PATCH' && response.url().endsWith(`/admin/api/trees/${walk.tree}`), {
    timeout: 20_000,
  })
}

/** Signs in on the login page by its form (25.1). */
async function signIn(walk: Walk): Promise<void> {
  const { page, ui } = walk
  const answered = page.waitForResponse((response) => response.url() === `${origin}/admin/api/login`, { timeout: 20_000 })
  await page.getByLabel(ui.email, { exact: true }).fill(CREATOR.email)
  await page.getByLabel(ui.password, { exact: true }).fill(CREATOR.password)
  await page.getByRole('button', { name: ui.signIn, exact: true }).click()
  expect((await answered).status()).toBe(204)
}

async function creator(browser: Browser, lang: Lang, width: number, height: number): Promise<Walk> {
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage()
  return {
    page,
    lang,
    ui: chrome(lang),
    size: `${width}x${height}`,
    tree: '',
    rows: [],
    detours: [],
  }
}

for (const { lang, width, height } of WALKS) {
  test(`the creator's walk, ${lang}, at ${width} x ${height}`, async ({ browser }) => {
    test.setTimeout(420_000)
    const walk = await creator(browser, lang, width, height)
    try {
      await walkThrough(walk)
    } finally {
      await writeRows(walk)
      await walk.page.context().close()
    }
  })
}

/** The walk of the issue, in its order, as one creator. */
async function walkThrough(walk: Walk): Promise<void> {
  const { page, ui, lang } = walk
  const words = WORDS[lang]
  // Sign in, and the + tile's form: one language, the walk's own (27.1).
  await page.goto(`${origin}/admin${lang === 'en' ? '' : '?lang=nl'}`)
  await signIn(walk)
  await page.locator('a.tile--new').click()
  await expect(page).toHaveURL(new RegExp(`/admin/new`))
  // **[#181]** The language field says what it takes: its button's word named it.
  await expectLanguageField(walk, page)
  await page.locator(`#new-tree-title-${lang}`).fill(`${words.tree} (${walk.size})`)
  await page.getByRole('button', { name: ui.create, exact: true }).click()
  await page.waitForURL(/\/admin\/trees\/[^/]+\/start/, { timeout: 20_000 })
  walk.tree = new URL(page.url()).pathname.split('/')[3] ?? ''
  await hydrated(page)
  // The walk's own API call -- a side bubble made where the page shows no `+`, a detour -- carries the session in the header (admin.ts).
  const { cookie } = await login(page, origin, CREATOR.email, CREATOR.password)
  await step(walk, '01-empty-step')

  // The first step: title and text (28.1, 28.2), then a picture with its credit and description (31.2).
  await write(walk, 'start', `title.${lang}`, words.title)
  await write(walk, 'start', `description.${lang}`, words.text)
  await step(walk, '02-title-and-text')
  const first = await attachPicture(walk, page.locator('main'), 'covered.png', async (attach) => {
    // **[#181]** Each field holds its 120 characters in its own box, wrapped, as the enlarged view's do (28.4).
    for (const label of [ui.credit, ui.imageDescription]) {
      const box = attach.getByLabel(label, { exact: true })
      const typed = await box.inputValue()
      await box.fill(FULL_CREDIT)
      expect(await box.inputValue()).toHaveLength(120)
      const held = await box.evaluate((element) => ({ sw: element.scrollWidth, cw: element.clientWidth, sh: element.scrollHeight, ch: element.clientHeight }))
      expect.soft(held.sw, `${label}: 120 characters wider than the box`).toBeLessThanOrEqual(held.cw + 1)
      expect.soft(held.sh, `${label}: 120 characters taller than the box`).toBeLessThanOrEqual(held.ch + 1)
      await box.fill(typed)
    }
    await attach.locator('.hint-mark').first().hover()
    await expect(page.locator('.hint-panel[data-open]')).toBeVisible()
    await step(walk, '03-attach-sheet-credit-hint')
    await page.mouse.move(1, 1)
  })
  if (!first) walk.detours.push(`no picture picker on the empty first step`)
  await step(walk, '04-main-picture')

  // Two more pictures from the strip's `+`, "Add an extra image" on hover (31.1, #174).
  const plus = page.locator('.carousel > .editor-picker--strip').filter({ visible: true }).first()
  if (await plus.count()) {
    await plus.hover()
    await step(walk, '05-add-an-extra-image')
    await page.mouse.move(1, 1)
  }
  for (const file of ['eu-map.png', 'scoreboard.png']) {
    if (!(await attachPicture(walk, page.locator('main'), file))) walk.detours.push(`no picture picker for ${file}`)
  }
  await page.mouse.move(1, 1)
  await step(walk, '06-three-pictures')

  // A Source (28.1): its link, then its name.
  await addSource(walk, page.locator('main'), 'start', () => step(walk, '07-source-added'))
  await page.keyboard.press('Escape')
  // **[#181]** `+ addSource` is no Source: no separator before it, which began its line as a lone dot.
  const separators = await page.locator('.sources li.sources-add').evaluateAll((items) => items.map((item) => getComputedStyle(item, '::before').content))
  expect(separators.length).toBeGreaterThan(0)
  for (const content of separators) expect(content).toBe('none')

  // Yes and no (30.2): each a new step, landed on; back with the up arrow.
  await page.locator('.structure--yes').click()
  const yesId = await landed(page, `/admin/trees/${walk.tree}/start`)
  await page.locator('.up-arrow').click()
  await page.waitForURL((url) => url.pathname === `/admin/trees/${walk.tree}/start`, { timeout: 20_000 })
  await hydrated(page)
  await page.locator('.structure--no').click()
  const noId = await landed(page, `/admin/trees/${walk.tree}/start`)
  await open(walk, 'start')
  await step(walk, '08-yes-and-no')

  // A step filled and ended with typed words (30.3, 36.3), its two buttons beside the arrow (30.8).
  await open(walk, 'start', yesId)
  await write(walk, yesId, `title.${lang}`, words.yesTitle)
  await write(walk, yesId, `description.${lang}`, words.yesText)
  await endHere(walk, yesId, words.yesEnding, () => step(walk, '09-ending-typed'))
  await step(walk, '10-step-ends-here')

  // Eight side bubbles (30.4), the first filled in its Overlay: title, text, picture, Source (30.5).
  const asides: string[] = []
  asides.push(await newSideBubble(walk, cookie, 1))
  const overlay = page.locator('details.overlay[open] > .sheet-panel')
  await expect(overlay).toBeVisible()
  await step(walk, '11-new-side-bubble')
  await write(walk, asides[0]!, `title.${lang}`, words.asideTitle)
  await write(walk, asides[0]!, `description.${lang}`, words.asideText)
  if (!(await attachPicture(walk, overlay, 'emotion-recognition.png'))) walk.detours.push(`no picture picker in the side bubble`)
  await addSource(walk, overlay, asides[0]!)
  await page.keyboard.press('Escape')
  if (!(await overlay.isVisible())) await open(walk, 'start', asides[0]!)
  await step(walk, '12-side-bubble-filled')
  for (let n = 2; n <= 8; n += 1) asides.push(await newSideBubble(walk, cookie, n))
  await open(walk, 'start')
  await expect(sideAdd(page)).toHaveCount(0)
  await step(walk, '13-eight-side-bubbles')

  // A side bubble deleted from its own Overlay (30.7).
  const last = asides.pop()!
  await open(walk, 'start', last)
  await overlay.locator('.side-delete-button').click()
  await expect(overlay.locator('.side-delete .structure-confirm')).toBeVisible()
  await step(walk, '14-delete-side-bubble-asked')
  await overlay.locator('.side-delete').getByRole('button', { name: ui.confirm, exact: true }).click()
  await page.waitForURL((url) => url.pathname === `/admin/trees/${walk.tree}/start`, { timeout: 20_000 })
  await hydrated(page)

  // A step deleted with its red cross (30.8): the No step, made again after.
  await open(walk, 'start', noId)
  await page.locator('.step-delete').click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await step(walk, '15-delete-step-asked')
  await page.getByRole('alertdialog').getByRole('button', { name: ui.confirm, exact: true }).click()
  await page.waitForURL((url) => url.pathname === `/admin/trees/${walk.tree}/start`, { timeout: 20_000 })
  await hydrated(page)
  await expect(page.locator('.structure--no')).toBeVisible()

  // The to-do bubble (33.3), with what is left to do.
  const reread = page.waitForResponse((response) => new URL(response.url()).pathname === `/admin/api/trees/${walk.tree}`, { timeout: 20_000 })
  await todoButton(page).click()
  await reread
  await expect(todoBubble(page)).toBeVisible()
  await step(walk, '16-to-do-bubble')
  await sweep(walk, todoBubble(page).locator('.panel-body'), 'the to-do bubble')
  await page.keyboard.press('Escape')

  // What is left, done: the No step again, ended; the other side bubbles named and written.
  await page.locator('.structure--no').click()
  const noAgain = await landed(page, `/admin/trees/${walk.tree}/start`)
  await write(walk, noAgain, `title.${lang}`, words.noTitle)
  await write(walk, noAgain, `description.${lang}`, words.noText)
  await endHere(walk, noAgain, words.noEnding)
  for (const [index, aside] of asides.slice(1).entries()) {
    await open(walk, 'start', aside)
    await write(walk, aside, `title.${lang}`, `${words.otherAside} ${index + 2}`)
    await write(walk, aside, `description.${lang}`, words.otherText)
  }
  await open(walk, 'start')

  // The settings panel (33.1, 33.2), the colours (33.8, #180) and the fonts (37).
  await openPanel(page)
  // **[#181]** The panel's language field too: the new-Tree form's control (27.1, 33.5).
  await expectLanguageField(walk, panel(page))
  await step(walk, '17-settings-panel')
  const chosen = themeWrite(walk)
  await themePanel(page).getByRole('button', { name: ui.chooseColours, exact: true }).click()
  expect((await chosen).status()).toBe(200)
  for (const [role, value] of [
    ['background', '#fdf1d8'],
    ['accent', '#8a3b12'],
    ['accent-secondary', '#1d6b8a'],
  ] as const) {
    const picked = themeWrite(walk)
    await themePanel(page).locator(`input[type="color"][data-role="${role}"]`).fill(value)
    expect((await picked).status()).toBe(200)
  }
  await themePanel(page).locator('input[type="color"][data-role="background"]').scrollIntoViewIfNeeded()
  await step(walk, '18-colours-changed')
  const heading = themePanel(page).locator('[data-font-role="heading"]')
  const font = themeWrite(walk)
  await heading.getByRole('combobox').selectOption('library:faustina')
  expect((await font).status()).toBe(200)
  await heading.scrollIntoViewIfNeeded()
  await step(walk, '19-font-from-the-dropdown')
  const body = themePanel(page).locator('[data-font-role="body"]')
  await body.getByRole('combobox').selectOption({ label: ui.fontUpload })
  await body.getByLabel(ui.fontFile, { exact: true }).setInputFiles(FONT)
  await expect(body.getByLabel(ui.fontFamily, { exact: true })).toHaveValue('Nova Square')
  await body.getByLabel(ui.fontLicence, { exact: true }).selectOption({ label: 'SIL Open Font License 1.1' })
  await body.getByLabel(ui.fontLicence, { exact: true }).scrollIntoViewIfNeeded()
  await step(walk, '20-licence-dropdown')
  // **[#181]** The panel at its longest, the upload's form open, at every scroll position.
  await sweep(walk, panel(page).locator('.panel-body'), 'the settings panel')
  // **[#181]** The panel's fields and dropdowns in one size: the language field and the family name stood out at 16.
  const sizes = await panel(page)
    .locator('input:not([type="color"]):not([type="file"]):not([type="checkbox"]), select')
    .evaluateAll((controls) => [...new Set(controls.filter((control) => control.getClientRects().length > 0).map((control) => getComputedStyle(control).fontSize))])
  expect(sizes).toHaveLength(1)
  const added = themeWrite(walk)
  await body.getByRole('button', { name: ui.addFont, exact: true }).click()
  expect((await added).status()).toBe(200)

  // Publish (33.3), and the public page.
  await themePanel(page).evaluate((element) => element.closest('[data-scroll-box]')?.scrollTo(0, 0))
  const publish = panel(page).getByRole('switch', {
    name: ui.publish,
    exact: true,
  })
  await publish.click()
  await expect(publish).toHaveAttribute('aria-checked', 'true')
  await step(walk, '21-published')
  await page.goto(`${origin}/${walk.tree}/start`)
  await arrived(page, `${origin}/${walk.tree}/start`)
  await page.mouse.move(1, 1)
  await step(walk, '22-public-page')
  // The first side bubble: its button in the fan; **[#181]** on a phone, where the Options are a
  // list (10.5), its link there, which opens it at its own address (10.9).
  const optionButton = page.locator('details.overlay').filter({ visible: true }).first()
  if (await optionButton.count()) {
    await optionButton.locator(':scope > .sheet-open').click()
  } else {
    await page.locator('.options-sheet > .sheet-open').filter({ visible: true }).click()
    await page.locator('.options-sheet .sheet-list a').filter({ visible: true }).first().click()
    await arrived(page, new RegExp(`/${walk.tree}/start/n-[a-z2-7]{6}$`))
  }
  await expect(page.locator('details.overlay[open] > .sheet-panel').filter({ visible: true })).toBeVisible()
  await step(walk, '23-public-side-bubble')
}
