/**
 * Issue #46: version 0.2 of the first Tree walked in the running app, as a reader would, with
 * every page measured and every request recorded. The record this writes -- `walk-record.md`, which
 * `README.md` embeds, `requests.md` and the screenshots beside this file -- is what the owner inspects (core
 * document 3.3); it is not a test and asserts nothing, because the issue files what it finds
 * as issues instead of failing on it.
 *
 * Run from the repository root, after `npm run build`:
 *
 *     node docs/screenshots/issue-46/walk.ts
 *
 * It starts the standalone server a deployment runs (docs/deployment.md), serving
 * `ai-act-applicability-agrifood`, and for each language and viewport opens a fresh browser
 * context at the root and walks by clicking: yes and no on every question Node, every Option,
 * and after each the parent's Trail Branch back. A Node already walked is still clicked into
 * and measured from every Link that leads to it, but its own Links are followed only the first
 * time, so every Link of the Tree is followed exactly once per language and viewport.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type BrowserContext, type Page, type Request } from '@playwright/test'
import { openTree, type Tree } from '../../../src/tree/loader.ts'
import type { Node } from '../../../src/tree/types.ts'
import { serve, stopServers } from '../../../tests/browser/serve.ts'

const TREE = 'ai-act-applicability-agrifood'
const repo = fileURLToPath(new URL('../../..', import.meta.url))
const OUT = fileURLToPath(new URL('.', import.meta.url))
const PORT = 3146

/**
 * The guaranteed viewport of application.md 10.4, and 1280 x 800, the first of the two
 * "common laptop shapes" 10.6 measures: the other, 1024 x 768, puts a five-Option Node's
 * Options behind a Sheet (10.5, step 4), which is a degradation rather than the layout.
 */
const VIEWPORTS = [
  [1280, 640],
  [1280, 800],
] as const
const LANGUAGES = ['en', 'nl'] as const
type Lang = (typeof LANGUAGES)[number]

/** The bound of application.md 11.5: the Node a page shows and at most sixteen neighbours. */
const MAX_NODES = 17

/** Page visits per tab before the walk moves to a new one (`Walker.freshTab`). */
const FRESH_TAB_EVERY = 50

/** The centre frame: the neighbour frames are `inert` and are never clicked (11.3). */
const CENTRE = '.tree-frame:not([inert])'

/** One request, as the browser made it. */
interface Asked {
  url: string
  kind: string
  /** For a page payload: the Nodes its body carries, by `data-node`. */
  nodes?: string[]
}

/** One page visited: how it was reached, what it measured, and what it asked for. */
interface Visit {
  n: number
  lang: Lang
  viewport: string
  how: string
  url: string
  node: string
  situation: string
  inner: { w: number; h: number }
  docSH: number
  docSW: number
  bodySH: number
  bubbleSH: number
  bubbleCH: number
  overflowing: string[]
  requests: Asked[]
  error?: string
  shot?: string
}

const visits: Visit[] = []
let tree: Tree
let origin: string

/** The four situations of application.md 10.3, which is how a screenshot is chosen. */
function situation(node: Node): string {
  if (node.kind === 'question') return node.options.length > 0 ? 'question-with-options' : 'question-without-options'
  return node.kind
}

/** The page for a Trail ending at the Node shown; `lang` is omitted for the default (4.1). */
function pageUrl(ids: string[], lang: Lang): string {
  return `/${TREE}/${ids.join('/')}${lang === 'en' ? '' : `?lang=${lang}`}`
}

/** A URL of this server as a path and query; any other origin's whole. */
function local(url: string): string {
  const u = new URL(url)
  return u.origin === origin ? u.pathname + u.search : url
}

/** Every Node reachable from the root through Answers and Options, read through the loader. */
async function reachableNodes(): Promise<Map<string, Node>> {
  const nodes = new Map<string, Node>()
  const queue = [tree.manifest.root]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (nodes.has(id)) continue
    const node = await tree.getNode(id)
    if (!node) throw new Error(`the loader cannot read ${id}`)
    nodes.set(id, node)
    if (node.kind === 'question') queue.push(node.answers.yes, node.answers.no)
    queue.push(...node.options.map((o) => o.target))
  }
  return nodes
}

/** One browser context walking one language at one viewport, and the requests it makes. */
class Walker {
  private visit: Visit | null = null
  private inflight = 0
  private lastActivity = Date.now()
  private readonly walked = new Set<string>()
  private readonly shot = new Set<string>()
  /** Resolves once page payloads are being read on their way in; await before the first navigation. */
  readonly routed: Promise<unknown>

  page: Page
  readonly lang: Lang
  readonly viewport: string
  readonly nodes: Map<string, Node>
  /** Page visits since the tab was last replaced; see `freshTab`. */
  private sinceFresh = 0

  constructor(page: Page, lang: Lang, viewport: string, nodes: Map<string, Node>) {
    this.page = page
    this.lang = lang
    this.viewport = viewport
    this.nodes = nodes
    // Listened for on the context, so a tab `freshTab` opens is recorded the same way.
    const context = page.context()
    context.setDefaultTimeout(20_000)
    context.on('request', (request) => {
      this.inflight += 1
      this.lastActivity = Date.now()
      this.visit?.requests.push({ url: local(request.url()), kind: kindOf(request) })
    })
    const done = () => {
      this.inflight = Math.max(0, this.inflight - 1)
      this.lastActivity = Date.now()
    }
    context.on('requestfinished', done)
    context.on('requestfailed', done)
    // A page payload's body is taken on its way to the page, so the Nodes it carries can be
    // counted: Chromium does not keep a client navigation's payload for `response.body()`.
    this.routed = context.route(
      (url) => url.pathname.startsWith(`/${TREE}`),
      async (route) => {
        const response = await route.fetch()
        const body = await response.body()
        const asked = this.visit?.requests.findLast((r) => r.url === local(route.request().url()))
        if (asked) asked.nodes = [...new Set([...body.toString('utf8').matchAll(/data-node\\?"?[=:]\\?"([^"\\]+)/g)].map((m) => m[1]!))]
        await route.fulfill({ response, body })
      },
    )
  }

  /** Starts the record of the page the next action opens; its requests are counted from here. */
  private begin(how: string): Visit {
    this.visit = {
      n: visits.length + 1,
      lang: this.lang,
      viewport: this.viewport,
      how,
      url: '',
      node: '',
      situation: '',
      inner: { w: 0, h: 0 },
      docSH: 0,
      docSW: 0,
      bodySH: 0,
      bubbleSH: 0,
      bubbleCH: 0,
      overflowing: [],
      requests: [],
    }
    visits.push(this.visit)
    this.sinceFresh += 1
    if (visits.length % 50 === 0) console.log(`${visits.length} pages, ${new Date().toISOString()}`)
    return this.visit
  }

  /** Waits for `ids` to be the page on screen, settled, then measures it (application.md 10.6). */
  private async arrive(visit: Visit, ids: string[]): Promise<void> {
    const id = ids[ids.length - 1]!
    const url = pageUrl(ids, this.lang)
    visit.url = url
    visit.node = id
    visit.situation = situation(this.nodes.get(id)!)
    await this.page.waitForURL((u) => u.pathname + u.search === url)
    await this.page.locator(`${CENTRE} .bubble[data-node="${id}"]`).waitFor()
    await this.page.locator('.tree-layer[data-sliding]').waitFor({ state: 'detached' })
    await this.settle()
    await this.page.evaluate(() => document.fonts.ready)
    Object.assign(
      visit,
      await this.page.evaluate((centre) => {
        const overflowing: string[] = []
        for (const el of document.querySelectorAll('*')) {
          // The one exemption of 10.6: the Carousel strip scrolls sideways inside its own row.
          if (el.matches('[data-carousel-strip]')) continue
          if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
            const name = `${el.tagName.toLowerCase()}${[...el.classList].map((c) => `.${c}`).join('')}`
            overflowing.push(`${name} holds ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`)
          }
        }
        const bubble = document.querySelector(`${centre} .bubble`)
        return {
          inner: { w: window.innerWidth, h: window.innerHeight },
          docSH: document.documentElement.scrollHeight,
          docSW: document.documentElement.scrollWidth,
          bodySH: document.body.scrollHeight,
          bubbleSH: bubble?.scrollHeight ?? -1,
          bubbleCH: bubble?.clientHeight ?? -1,
          overflowing,
        }
      }, CENTRE),
    )
  }

  /** Until no request has been in flight for 400 ms, or five seconds have passed. */
  private async settle(): Promise<void> {
    const deadline = Date.now() + 5_000
    while (Date.now() < deadline && (this.inflight > 0 || Date.now() - this.lastActivity < 400)) {
      await new Promise((wake) => setTimeout(wake, 50))
    }
  }

  /** A screenshot of the viewport, named for what it shows. The document never scrolls (10.6). */
  private async screenshot(visit: Visit, name: string): Promise<void> {
    const file = `${name}-${this.lang}-${this.viewport}.png`
    await this.page.screenshot({ path: path.join(OUT, file) })
    visit.shot = file
  }

  /** Opens the root in this context's language: English by URL, Dutch by the app's own switch. */
  async open(): Promise<void> {
    const root = tree.manifest.root
    await this.routed
    let visit = this.begin('opened')
    await this.page.goto(pageUrl([root], 'en'))
    if (this.lang !== 'en') {
      const english = visit
      english.url = pageUrl([root], 'en')
      english.node = root
      visit = this.begin('language switch')
      await this.page.locator(`.language-switch a.language[lang="${this.lang}"]`).click()
    }
    await this.arrive(visit, [root])
    this.walked.add(root)
    await this.shoot(visit)
    await this.explore([root])
  }

  /** Takes the screenshots this issue asks for, the first time each is due. */
  private async shoot(visit: Visit): Promise<void> {
    const node = this.nodes.get(visit.node)!
    const step = node.title.en?.match(/\((\d)\/7\)$/)
    if (this.lang === 'en' && step && !this.shot.has(node.id)) {
      this.shot.add(node.id)
      await this.screenshot(visit, `jurisdiction-${step[1]}-of-7-${node.id}`)
    } else if (!this.shot.has(visit.situation)) {
      this.shot.add(visit.situation)
      await this.screenshot(visit, `${visit.situation}-${node.id}`)
    }
  }

  /** Follows every Link of the Node at the end of `ids`, going back by the Trail after each. */
  private async explore(ids: string[]): Promise<void> {
    const node = this.nodes.get(ids[ids.length - 1]!)!
    const links: { how: string; target: string; selector: string }[] = []
    if (node.kind === 'question') {
      links.push({ how: 'yes', target: node.answers.yes, selector: `${CENTRE} .answer--yes` })
      links.push({ how: 'no', target: node.answers.no, selector: `${CENTRE} .answer--no` })
    }
    for (const option of node.options) {
      const href = pageUrl([...ids, option.target], this.lang)
      links.push({ how: 'option', target: option.target, selector: `${CENTRE} a.option[href="${href}"]` })
    }

    for (const link of links) {
      if (this.sinceFresh >= FRESH_TAB_EVERY) await this.freshTab(ids)
      const there = [...ids, link.target]
      const visit = this.begin(`${link.how} from ${node.id}`)
      try {
        await this.page.locator(link.selector).click()
        await this.arrive(visit, there)
        await this.shoot(visit)
        if (this.lang === 'en' && this.viewport === '1280x640' && link.target === 'end-of-walk' && !shared) {
          shared = true
          await this.share(visit, there)
        }
      } catch (error) {
        visit.error = String(error).split('\n')[0]
        console.log(visit.n, visit.how, String(error).slice(0, 700))
        await this.recover(there)
      }
      if (!this.walked.has(link.target)) {
        this.walked.add(link.target)
        await this.explore(there)
      }
      const back = this.begin(`Trail back from ${link.target}`)
      try {
        await this.page.locator(`${CENTRE} .trail-step[data-parent] .trail-entry`).click()
        await this.arrive(back, ids)
      } catch (error) {
        back.error = String(error).split('\n')[0]
        console.log(back.n, back.how, String(error).slice(0, 700))
        await this.recover(ids)
      }
    }
  }

  /**
   * Replaces the tab with a new one at the page the walk is on. Headless Chromium's renderer
   * crashed after 119 to about 310 slides in one tab (#63), which
   * would end the walk; a tab of its own every FRESH_TAB_EVERY pages keeps it well short.
   */
  private async freshTab(ids: string[]): Promise<void> {
    const old = this.page
    this.page = await old.context().newPage()
    await old.close()
    this.sinceFresh = 0
    const visit = this.begin('the same page in a new tab (renderer crash, #63)')
    await this.page.goto(pageUrl(ids, this.lang))
    await this.arrive(visit, ids)
  }

  /** After a failed click: loads the page the walk expected, so the walk carries on from it. */
  private async recover(ids: string[]): Promise<void> {
    const visit = this.begin('recovery (typed URL)')
    await this.page.goto(pageUrl(ids, this.lang))
    await this.arrive(visit, ids)
  }

  /** The share button on a deep page, and its link opened in a fresh browser context. */
  private async share(from: Visit, ids: string[]): Promise<void> {
    await this.page.locator('.share').click()
    const copied = await this.page.evaluate(() => navigator.clipboard.readText())
    sharing = { fromPage: from.n, from: from.url, copied: local(copied), trailFrom: await trailOf(this.page) }
    const fresh = await context(this.page.context().browser()!, VIEWPORTS[0])
    try {
      const walker = new Walker(await fresh.newPage(), this.lang, this.viewport, this.nodes)
      await walker.routed
      const visit = walker.begin('share link opened in a fresh context')
      await walker.page.goto(copied)
      await walker.arrive(visit, ids)
      sharing.trailOpened = await trailOf(walker.page)
      sharing.visit = visit.n
      await walker.screenshot(visit, 'share-link-fresh-context')
    } finally {
      await fresh.close()
    }
  }
}

/** The shared page's record: what was copied, and the Trail on both sides. */
let sharing: { fromPage: number; from: string; copied: string; trailFrom: string[]; trailOpened?: string[]; visit?: number } | null = null
let shared = false

/** The Trail Branches of the centre frame, by their `href`. */
async function trailOf(page: Page): Promise<string[]> {
  return page.locator(`${CENTRE} .trail-entry`).evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''))
}

function kindOf(request: Request): string {
  if (request.resourceType() === 'document') return 'page (HTML)'
  if (request.headers()['rsc'] === '1') return 'page (payload)'
  return request.resourceType()
}

async function context(browser: Browser, [width, height]: readonly [number, number]): Promise<BrowserContext> {
  return browser.newContext({ viewport: { width, height }, permissions: ['clipboard-read', 'clipboard-write'], baseURL: origin })
}

/** What is wrong with a visit, by the rules of application.md 10.6 and 11.5; empty when nothing. */
async function problems(v: Visit): Promise<string[]> {
  const found: string[] = []
  if (v.error) found.push(`walk: ${v.error}`)
  if (v.docSH > v.inner.h + 1) found.push(`document ${v.docSH} px tall in a ${v.inner.h} px window`)
  if (v.docSW > v.inner.w + 1) found.push(`document ${v.docSW} px wide in a ${v.inner.w} px window`)
  if (v.bubbleSH > v.bubbleCH + 1) found.push(`Bubble content ${v.bubbleSH} px in ${v.bubbleCH} px`)
  found.push(...v.overflowing.map((o) => `overflow: ${o}`))
  const node = await tree.getNode(v.node)
  const images = node ? [...node.images, ...node.options.flatMap((o) => o.images.slice(0, 1))].map((i) => i.file) : []
  for (const r of v.requests) {
    if (!r.url.startsWith('/')) found.push(`third-party request: ${r.url}`)
    if (/tree\.ya?ml|\/api\//.test(r.url)) found.push(`request for the Tree: ${r.url}`)
    if ((r.nodes?.length ?? 0) > MAX_NODES) found.push(`${r.url} carries ${r.nodes!.length} Nodes`)
    const image = r.url.match(/^\/images\/([^?]+)/)
    if (image && !images.includes(decodeURIComponent(image[1]!))) found.push(`image of an off-screen Node: ${r.url}`)
  }
  return found
}

async function main(): Promise<void> {
  tree = await openTree(path.join(repo, 'trees', TREE))
  const nodes = await reachableNodes()
  const served = await serve(path.join(repo, 'trees'), TREE, PORT)
  if (!served) throw new Error(`${TREE} did not start: run npm run build first, and check the Tree validates`)
  origin = served
  const browser = await chromium.launch()
  try {
    for (const viewport of VIEWPORTS) {
      for (const lang of LANGUAGES) {
        const ctx = await context(browser, viewport)
        try {
          const walker = new Walker(await ctx.newPage(), lang, `${viewport[0]}x${viewport[1]}`, nodes)
          await walker.open()
          console.log(`${lang} ${viewport.join('x')}: ${visits.length} pages so far`)
        } finally {
          await ctx.close()
        }
      }
    }
  } finally {
    await browser.close()
    stopServers()
  }
  await writeRecord(nodes)
}

/** A visit's document and Bubble columns; the English root a Dutch walk switches language on is not measured. */
function measured(v: Visit): string {
  if (v.inner.h === 0) return 'not measured: the language switch was clicked on it; the next row is where it led | '
  return `${v.docSH} / ${v.inner.h} | ${v.bubbleSH} / ${v.bubbleCH}`
}

/** `README.md`'s generated half and `requests.md`: every page, every number, every request. */
async function writeRecord(nodes: Map<string, Node>): Promise<void> {
  const lines: string[] = []
  const runs = VIEWPORTS.flatMap(([w, h]) => LANGUAGES.map((lang) => ({ lang, viewport: `${w}x${h}` })))
  lines.push('## The count', '', `Nodes the loader reaches from the root: **${nodes.size}**.`, '')
  lines.push('| language | viewport | pages visited | distinct Nodes shown | Links followed | Trail backs | Terminals reached | pages with a problem |')
  lines.push('|---|---|---|---|---|---|---|---|')
  for (const run of runs) {
    const mine = visits.filter((v) => v.lang === run.lang && v.viewport === run.viewport && !v.how.startsWith('share'))
    let bad = 0
    for (const v of mine) if ((await problems(v)).length > 0) bad += 1
    const shown = new Set(mine.filter((v) => v.bubbleSH >= 0 && !v.error).map((v) => v.node))
    lines.push(
      `| ${run.lang} | ${run.viewport} | ${mine.length} | ${shown.size} | ${mine.filter((v) => /^(yes|no|option) from/.test(v.how)).length} | ` +
        `${mine.filter((v) => v.how.startsWith('Trail back')).length} | ${new Set(mine.filter((v) => v.situation === 'terminal').map((v) => v.node)).size} | ${bad} |`,
    )
  }
  lines.push('', `All pages visited, the share link's included: **${visits.length}**.`, '')
  if (sharing) {
    lines.push('## The share link', '')
    lines.push(`- Copied on \`${sharing.from}\` (page ${sharing.fromPage}): \`${sharing.copied}\``)
    lines.push(`- Trail Branches on the page it was copied from: ${sharing.trailFrom.length}; on the page opened in a fresh context (page ${sharing.visit}): ${sharing.trailOpened?.length}; identical: ${JSON.stringify(sharing.trailFrom) === JSON.stringify(sharing.trailOpened)}`, '')
  }
  lines.push('## Every page', '')
  lines.push('`document` is `document.documentElement.scrollHeight` / `window.innerHeight`; `Bubble` is the centre Bubble\'s `scrollHeight` / `clientHeight`; `requests` counts every request from the action that opened the page to the one that left it (listed in `requests.md`); `payload Nodes` is the most Nodes one page response carried.', '')
  lines.push('| # | language | viewport | reached by | URL | document | Bubble | overflowing elements | requests | payload Nodes | problem |')
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|')
  for (const v of visits) {
    const found = await problems(v)
    const payload = Math.max(0, ...v.requests.map((r) => r.nodes?.length ?? 0))
    lines.push(
      `| ${v.n} | ${v.lang} | ${v.viewport} | ${v.how} | \`${v.url}\` | ${measured(v)} | ${v.overflowing.length} | ` +
        `${v.requests.length} | ${payload || ''} | ${found.join('; ').replaceAll('|', '\\|')} |`,
    )
  }
  await writeFile(path.join(OUT, 'walk-record.md'), lines.join('\n') + '\n')

  const requests = ['# Every request, by page', '', 'The page numbers are those of `README.md`. A path is this server; anything else would be printed whole.', '']
  requests.push('| page | kind | URL | Nodes carried |', '|---|---|---|---|')
  for (const v of visits) {
    for (const r of v.requests) requests.push(`| ${v.n} | ${r.kind} | \`${r.url}\` | ${r.nodes ? r.nodes.length : ''} |`)
  }
  await writeFile(path.join(OUT, 'requests.md'), requests.join('\n') + '\n')
}

await mkdir(OUT, { recursive: true })
process.once('SIGINT', () => {
  stopServers()
  process.exit(130)
})
await main()
