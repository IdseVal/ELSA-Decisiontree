/**
 * **[#206]** The preview of a hidden Tree, in a browser (docs/specs/application.md 40;
 * ADR-205-*): the preview's address and every answer of 40.1's table, the page without script;
 * what it draws of the draft (40.2) -- the public markup, every address under `/admin/preview`,
 * every file from the admin routes, the slide, at most seventeen Nodes; its Theme, head and
 * `<html lang>` (40.3); its bar (40.4); the two buttons at the top left, their words, their tab
 * order and their boxes beside the up arrow, the step's buttons and the floating controls at every
 * viewport of the research record's column "the rule", and the ending's button beside them on a
 * hidden Tree (40.5); the way there and back (40.6); a draft that is not valid yet (40.7).
 *
 * Against a data directory of hidden and published Trees, Anna their creator, on a server of this
 * file's own whose log is kept: `hidden-draft` the full Node under a first step put above it
 * through the API, as `step-buttons.spec.ts` does, with Bram and Cees its collaborators;
 * `unfinished` the full Node with 40.7's gaps made through the API; `example-hidden` the example
 * Tree, its Theme and logo, hidden; the example Tree published; `german-only` and
 * `single-language`, a German and a Dutch-first draft; `hand-edited`, uneditable (19.5); `walk`,
 * the full Node again, for the writes of 40.6. The screenshots the issue asks for go to
 * `docs/screenshots/issue-206/` under `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type BrowserContextOptions, type Page, type Request } from '@playwright/test'
import { chrome } from '../../src/chrome.ts'
import type { DraftNode } from '../../src/tree/types.ts'
import { ADMIN_ENV, ADMIN_EMAIL, ADMIN_PASSWORD, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-206') : path.join(RESULTS, 'shots')
const LOG = path.join(RESULTS, 'preview-server.log')
const PORT = BASE_PORT + 205

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const BRAM = { email: 'bram@example.org', name: 'Bram', password: 'brams first password' }
const CEES = { email: 'cees@example.org', name: 'Cees', password: 'cees first password' }
/** An account with no role on any Tree. */
const DORA = { email: 'dora@example.org', name: 'Dora', password: 'doras first password' }
const ADMIN = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }

/**
 * The viewports of the research record's column "the rule" (docs/research/issue-205-top-left-room.md
 * section 1): the nine of 10.6 where the tree view shows and both sides of 1000 wide, 640 tall,
 * 640 wide and 480 wide, and the narrowest windows above the floor.
 */
const VIEWPORTS = [
  [1280, 640],
  [1366, 768],
  [1920, 1080],
  [2560, 1440],
  [1280, 800],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [360, 640],
  [1000, 700],
  [999, 700],
  [1000, 639],
  [999, 639],
  [640, 700],
  [639, 700],
  [640, 639],
  [639, 639],
  [480, 640],
  [480, 639],
  [479, 639],
  [321, 481],
  [321, 700],
] as const

const LANGUAGES = [
  { lang: 'en', query: '' },
  { lang: 'nl', query: '?lang=nl' },
] as const

let origin: string
/** The first step of `hidden-draft`, put above the full Node in `beforeAll`. */
let top = ''
/** `unfinished`'s fresh step: the Yes `opt-two` was given, with nothing written in it. */
let fresh = ''

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ browser }) => {
  await mkdir(SHOTS, { recursive: true })
  await mkdir(RESULTS, { recursive: true })
  const full = path.join(repo, 'tests', 'fixtures', 'full-node')
  const example = path.join(repo, 'trees', 'ai-act-example')
  const fixtures = path.join(repo, 'tests', 'fixtures')
  const dir = await buildDataDir({
    trees: [
      { folder: full, id: 'hidden-draft', hidden: true, creator: ANNA.email, collaborators: [BRAM.email, CEES.email] },
      { folder: full, id: 'unfinished', hidden: true, creator: ANNA.email },
      { folder: full, id: 'walk', hidden: true, creator: ANNA.email },
      { folder: example, id: 'example-hidden', hidden: true, creator: ANNA.email },
      { folder: example, creator: ANNA.email },
      { folder: path.join(fixtures, 'german-only'), hidden: true, creator: ANNA.email },
      { folder: path.join(fixtures, 'single-language'), hidden: true, creator: ANNA.email },
      { folder: path.join(fixtures, 'single-language'), id: 'hand-edited', hidden: true, creator: ANNA.email },
    ],
    accounts: [ANNA, BRAM, CEES, DORA],
  })
  // One key twice: a blocking rule broken (V-JSON), as by an edit outside the editor (19.5).
  await writeFile(path.join(dir, 'trees', 'hand-edited', 'draft.json'), '{ "format": "elsa-tree/6", "format": "twice" }\n')
  origin = await serveStore(dir, PORT, ADMIN_ENV, LOG)

  const { page, cookie } = await loggedIn(browser, ANNA)
  // A Node is made from a parent's Link (22.4): made under an aside, pointed at the full Node,
  // unhung from the aside, and made the root, it stands above the full Node (step-buttons.spec.ts).
  const made = await api(page, cookie, 'POST', '/trees/hidden-draft/nodes', { from: { node: 'opt-two', link: 'answer', label: {} } })
  expect(made.status()).toBe(201)
  top = ((await made.json()) as { node: DraftNode }).node.id
  for (const [route, change] of [
    [`/nodes/${top}`, { op: 'set-answer', answer: 'yes', target: 'full' }],
    ['/nodes/opt-two', { op: 'remove-answer', answer: 'yes' }],
    [`/nodes/${top}`, { path: 'title.en', value: 'The first step' }],
    [`/nodes/${top}`, { path: 'title.nl', value: 'De eerste stap' }],
    ['', { path: 'root', value: top }],
  ] as const) {
    expect((await api(page, cookie, 'PATCH', `/trees/hidden-draft${route}`, change)).status(), `${route} ${JSON.stringify(change)}`).toBe(200)
  }

  // 40.7's draft: no Dutch title or text, a step with one Answer, a fresh step, an ending without
  // Dutch words, a picture without a credit or a Dutch description, and no Dutch Tree title.
  const fresher = await api(page, cookie, 'POST', '/trees/unfinished/nodes', { from: { node: 'opt-two', link: 'answer', label: {} } })
  expect(fresher.status()).toBe(201)
  fresh = ((await fresher.json()) as { node: DraftNode }).node.id
  for (const [route, change] of [
    ['/nodes/full', { op: 'remove-answer', answer: 'yes' }],
    ['/nodes/full', { path: 'title.nl', value: '' }],
    ['/nodes/full', { path: 'description.nl', value: '' }],
    ['/nodes/full', { path: 'images[0].credit', value: '' }],
    ['/nodes/full', { path: 'images[0].description.nl', value: '' }],
    ['/nodes/does-not-apply', { path: 'terminal.label.nl', value: '' }],
    ['', { path: 'title.nl', value: '' }],
  ] as const) {
    expect((await api(page, cookie, 'PATCH', `/trees/unfinished${route}`, change)).status(), `${route} ${JSON.stringify(change)}`).toBe(200)
  }
  await page.context().close()
})

test.afterAll(async () => {
  await stopServers()
})

/** A request as the editor's script sends it: this origin, the session cookie, JSON. */
function api(page: Page, cookie: string, method: string, route: string, data?: unknown): Promise<APIResponse> {
  return page.request.fetch(`${origin}/admin/api${route}`, {
    method,
    headers: { Origin: origin, Cookie: cookie, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    data: data === undefined ? undefined : JSON.stringify(data),
  })
}

/** A page logged in as `who`, in a context of its own, and the cookie for requests of its own. */
async function loggedIn(browser: Browser, who: { email: string; password: string }, width = 1280, height = 640, options: BrowserContextOptions = {}): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport: { width, height }, ...options })).newPage()
  const { status, cookie } = await login(page, origin, who.email, who.password)
  expect(status).toBe(204)
  return { page, cookie }
}

/** The address of the path of Node ids `ids` of `tree` under `prefix`, in `lang`. */
const at = (prefix: 'preview' | 'trees', tree: string, ids: string[], lang = 'en') => `/admin/${prefix}/${tree}/${ids.join('/')}${lang === 'en' ? '' : `?lang=${lang}`}`
const preview = (tree: string, ids: string[], lang = 'en') => at('preview', tree, ids, lang)
const editor = (tree: string, ids: string[], lang = 'en') => at('trees', tree, ids, lang)

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

/** 20.9's two headers, and no cookie set (20.5, 35.5). */
async function adminHeaders(response: APIResponse, what: string): Promise<void> {
  const headers = response.headers()
  expect(headers['x-robots-tag'], what).toBe('noindex, nofollow')
  expect(headers['cache-control'], what).toBe('no-store')
  expect(headers['set-cookie'], what).toBeUndefined()
}

test.describe('40.1: the address, and what it answers', () => {
  test('every row of the table: login page, 403, 403 and 404 by role, 404 off the draft, the uneditable page, the 307s -- each with 20.9’s headers and no Set-Cookie', async ({ browser }) => {
    const anna = await loggedIn(browser, ANNA)
    const dora = await loggedIn(browser, DORA)
    const admin = await loggedIn(browser, ADMIN)
    const get = (cookie: string | null, address: string) =>
      anna.page.request.get(`${origin}${address}`, { maxRedirects: 0, headers: cookie === null ? {} : { Cookie: cookie } })
    const full = preview('hidden-draft', [top, 'full'])

    const rows: Array<[who: string, cookie: string | null, address: string, status: number, check?: (response: APIResponse) => Promise<void>]> = [
      ['no session', null, full, 200, async (response) => expect(await response.text()).toContain(chrome('en').signIn)],
      ['Anna, a role on the hidden Tree', anna.cookie, full, 200, async (response) => expect(await response.text()).toContain('class="preview-back"')],
      ['Dora, no role', dora.cookie, full, 403],
      ['Dora, an unknown id', dora.cookie, preview('no-such-tree', ['start']), 403],
      ['Dora, a reserved id', dora.cookie, preview('images', ['start']), 403],
      ['the administrator, an unknown id', admin.cookie, preview('no-such-tree', ['start']), 404],
      ['the administrator, a reserved id', admin.cookie, preview('images', ['start']), 404],
      ['Anna, a path not in the draft', anna.cookie, preview('hidden-draft', [top, 'no-such-step']), 404],
      ['Anna, an uneditable Tree', anna.cookie, preview('hand-edited', ['start']), 200, async (response) => expect(await response.text()).toContain('id="uneditable"')],
      ['Anna, the bare preview of a Tree', anna.cookie, '/admin/preview/hidden-draft', 307, async (response) => expect(response.headers().location).toBe(preview('hidden-draft', [top]))],
      ['Anna, the bare preview with ?lang', anna.cookie, '/admin/preview/hidden-draft?lang=nl', 307, async (response) => expect(response.headers().location).toBe(preview('hidden-draft', [top], 'nl'))],
      [
        'Anna, a published Tree',
        anna.cookie,
        preview('ai-act-example', ['start', 'outside-scope'], 'nl'),
        307,
        async (response) => expect(response.headers().location).toBe(editor('ai-act-example', ['start', 'outside-scope'], 'nl')),
      ],
      ['Anna, /admin/preview alone', anna.cookie, '/admin/preview', 404],
      ['Anna, more than 50 ids', anna.cookie, preview('hidden-draft', Array.from({ length: 51 }, () => 'full')), 404],
    ]
    for (const [who, cookie, address, status, check] of rows) {
      const response = await get(cookie, address)
      console.log(`${who}: ${address} -> ${response.status()}${response.headers().location ? ` ${response.headers().location}` : ''}`)
      expect(response.status(), `${who}: ${address}`).toBe(status)
      await adminHeaders(response, `${who}: ${address}`)
      await check?.(response)
    }
  })

  test('without a session the login page stands at the preview’s address, and signing in reloads it as the preview', async ({ page }) => {
    const address = preview('hidden-draft', [top, 'full'])
    await page.goto(`${origin}${address}`)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
    await page.getByLabel('E-mail address').fill(ANNA.email)
    await page.getByLabel('Password').fill(ANNA.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.locator('.tree-frame:not([aria-hidden]) .bubble[data-node="full"]')).toBeVisible()
    expect(page.url()).toBe(`${origin}${address}`)
    await expect(page.getByRole('link', { name: 'Back to the editor' })).toBeVisible()
  })

  test('it needs no script: without JavaScript an Answer, the up arrow and the language switch walk the preview, each a page load, and no page says the editor needs JavaScript', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA, 1280, 640, { javaScriptEnabled: false })
    const sentences = [chrome('en').needsJavaScript, chrome('nl').needsJavaScript]
    const loads: string[] = []
    page.on('request', (request) => request.resourceType() === 'document' && loads.push(new URL(request.url()).pathname + new URL(request.url()).search))
    const check = async (address: string): Promise<void> => {
      await expect(page).toHaveURL(`${origin}${address}`)
      const html = await page.content()
      for (const sentence of sentences) expect(html, address).not.toContain(sentence)
      await expect(page.locator('.tree-frame'), address).toHaveCount(1)
    }

    await page.goto(`${origin}${preview('hidden-draft', [top, 'full'])}`)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .bubble h1')).toHaveText(/^The full Node/)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--yes')).toBeVisible()
    await expect(page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--no')).toBeVisible()
    await check(preview('hidden-draft', [top, 'full']))
    await page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--yes').click()
    await check(preview('hidden-draft', [top, 'full', 'applies']))
    await page.locator('.tree-frame:not([aria-hidden]) .up-arrow').click()
    await check(preview('hidden-draft', [top, 'full']))
    await page.locator('header .language-switch').getByRole('link', { name: 'Nederlands' }).click()
    await check(preview('hidden-draft', [top, 'full'], 'nl'))
    expect(loads).toEqual([
      preview('hidden-draft', [top, 'full']),
      preview('hidden-draft', [top, 'full', 'applies']),
      preview('hidden-draft', [top, 'full']),
      preview('hidden-draft', [top, 'full'], 'nl'),
    ])
  })
})

/** A request for a Node page: the document itself, or the payload a client navigation fetches (transition.spec.ts). */
function isPagePayload(request: Request): boolean {
  return request.resourceType() === 'document' || request.headers()['rsc'] === '1'
}

/** Every Node a response carries, by the `data-node` each Bubble writes, in markup and payload alike (transition.spec.ts). */
function nodesIn(body: string): string[] {
  return [...new Set([...body.matchAll(/data-node\\?"?[=:]\\?"([^"\\]+)/g)].map((m) => m[1]!))].sort()
}

test.describe('40.2: what it draws', () => {
  test('the public markup: no field, no contenteditable, no editor- class; every link under /admin/preview, every picture and theme file from the admin routes', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    const files: string[] = []
    page.on('request', (request) => ['image', 'font'].includes(request.resourceType()) && files.push(new URL(request.url()).pathname))
    for (const [tree, ids] of [
      ['hidden-draft', [top, 'full']],
      ['hidden-draft', [top, 'full', 'opt-one']],
      ['example-hidden', ['start']],
    ] as const) {
      await page.goto(`${origin}${preview(tree, [...ids])}`)
      await page.evaluate(() => document.fonts.ready)
      const found = await page.evaluate(() => ({
        fields: document.querySelectorAll('main [data-field], main [contenteditable]').length,
        editorClasses: [...document.querySelectorAll('main [class*="editor-"]')].map((element) => element.className),
        links: [...document.querySelectorAll<HTMLAnchorElement>('main a[href^="/"], header .language-switch a[href^="/"]')].map((a) => a.getAttribute('href')!),
        theme: [...document.querySelectorAll('style')].map((style) => style.textContent ?? '').join('\n').match(/url\("?[^)"]+"?\)/g) ?? [],
      }))
      const where = `${tree}/${ids.join('/')}`
      console.log(`${where}: ${found.links.length} links, theme files ${JSON.stringify(found.theme)}`)
      expect(found.fields, where).toBe(0)
      expect(found.editorClasses, where).toEqual([])
      expect(found.links.length, where).toBeGreaterThan(0)
      for (const href of found.links) expect(href, where).toMatch(new RegExp(`^/admin/(preview/${tree}/|api/trees/${tree}/images/)`))
      for (const url of found.theme) expect(url, where).toContain(`/admin/api/trees/${tree}/theme/`)
    }
    console.log(`files asked for: ${JSON.stringify([...new Set(files)])}`)
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) expect(file).toMatch(/^\/admin\/api\/trees\/(hidden-draft\/images|example-hidden\/(images|theme))\//)
  })

  test('an Answer slides to the target’s preview, one payload per navigation, and the up arrow slides back; a response carries at most seventeen Nodes', async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, ANNA)
    const payloads: string[] = []
    page.on('request', (request) => isPagePayload(request) && payloads.push(request.resourceType()))
    await page.goto(`${origin}${preview('hidden-draft', [top, 'full'])}`)
    const yes = page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--yes')
    await expect(yes).toHaveAttribute('data-slide', '')
    await expect(yes).toHaveAttribute('href', preview('hidden-draft', [top, 'full', 'applies']))
    await page.waitForLoadState('networkidle')
    payloads.length = 0
    await yes.click()
    await expect(page).toHaveURL(`${origin}${preview('hidden-draft', [top, 'full', 'applies'])}`)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .bubble[data-node="applies"]')).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(payloads, 'one payload for the Answer').toEqual(['fetch'])
    const up = page.locator('.tree-frame:not([aria-hidden]) .up-arrow')
    await expect(up).toHaveAttribute('data-slide', '')
    payloads.length = 0
    await up.click()
    await expect(page).toHaveURL(`${origin}${preview('hidden-draft', [top, 'full'])}`)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .bubble[data-node="full"]')).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(payloads, 'one payload for the up arrow').toEqual(['fetch'])

    for (const ids of [[top, 'full'], [top, 'full', 'opt-one'], [top, 'full', 'opt-one', 'opt-two'], [top]]) {
      const body = await (await page.request.get(`${origin}${preview('hidden-draft', ids)}`, { headers: { Cookie: cookie } })).text()
      const nodes = nodesIn(body)
      console.log(`${ids.join('/')}: ${nodes.length} Nodes: ${nodes.join(' ')}`)
      expect(nodes.length, ids.join('/')).toBeLessThanOrEqual(17)
    }
    // The full Node's page carries its frames: the step above, both Answers and the eight asides.
    const body = await (await page.request.get(`${origin}${preview('hidden-draft', [top, 'full'])}`, { headers: { Cookie: cookie } })).text()
    expect(nodesIn(body)).toEqual([top, 'applies', 'does-not-apply', 'full', 'opt-eight', 'opt-five', 'opt-four', 'opt-one', 'opt-seven', 'opt-six', 'opt-three', 'opt-two'].sort())
  })

  test('a fresh step reached by its yes is the centre, with startAgain below it', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}${preview('unfinished', ['full', 'opt-two', fresh])}`)
    const bubble = page.locator(`.tree-frame:not([aria-hidden]) .bubble[data-node="${fresh}"]`)
    await expect(bubble).toBeVisible()
    await expect(page.locator('.tree-frame:not([aria-hidden]) .up-arrow')).toHaveAttribute('href', preview('unfinished', ['full', 'opt-two']))
    const again = page.locator('.tree-frame:not([aria-hidden]) .answer--start-again')
    await expect(again).toBeVisible()
    expect((await again.boundingBox())!.y).toBeGreaterThan((await bubble.boundingBox())!.y)
  })
})

/** The computed background of the first element `selector` names. */
const background = (page: Page, selector: string) => page.locator(selector).first().evaluate((element) => getComputedStyle(element).backgroundColor)

test.describe('40.3: the Theme, the head and <html lang>', () => {
  test('the draft’s colours on the bar and the page, the default’s on the way back; noindex, the public title, and nothing else of the public head', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}/ai-act-example/start/outside-scope`)
    const publicLook = { bar: await background(page, 'header'), page: await background(page, 'body'), bubble: await background(page, '.tree-frame:not([aria-hidden]) .bubble') }
    const publicTitle = await page.title()
    await page.goto(`${origin}${editor('example-hidden', ['start', 'outside-scope'])}`)
    const defaultLook = await background(page, '.preview-button')

    await page.goto(`${origin}${preview('example-hidden', ['start', 'outside-scope'])}`)
    const look = { bar: await background(page, 'header'), page: await background(page, 'body'), bubble: await background(page, '.tree-frame:not([aria-hidden]) .bubble') }
    console.log(`public ${JSON.stringify(publicLook)}, preview ${JSON.stringify(look)}, the way back ${await background(page, '.preview-back')}, the default ${defaultLook}`)
    expect(look).toEqual(publicLook)
    expect(await background(page, '.preview-back')).toBe(defaultLook)
    expect(defaultLook).not.toBe(look.bar)

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
    expect(await page.title()).toBe(publicTitle)
    for (const selector of ['script[type="application/ld+json"]', 'link[rel="canonical"]', 'link[hreflang]', 'link[type="application/json"]', 'meta[name="description"]']) {
      await expect(page.locator(selector), selector).toHaveCount(0)
    }
  })

  test('<html lang>: the content language for a role, the chrome language of the segment for no session, no role and a path off the draft', async ({ browser }) => {
    const anna = await loggedIn(browser, ANNA)
    const dora = await loggedIn(browser, DORA)
    const nobody = await (await browser.newContext()).newPage()
    const rows: Array<[who: string, page: Page, address: string, lang: string]> = []
    for (const prefix of ['preview', 'trees'] as const) {
      rows.push(
        ['Anna', anna.page, at(prefix, 'german-only', ['start']), 'de'],
        ['Anna', anna.page, at(prefix, 'single-language', ['start']), 'nl'],
        ['Anna, a path off the draft', anna.page, at(prefix, 'german-only', ['no-such-step']), 'en'],
      )
      for (const [who, page] of [
        ['no session', nobody],
        ['Dora, no role', dora.page],
      ] as const) {
        rows.push(
          [who, page, at(prefix, 'german-only', ['start']), 'en'],
          [who, page, `${at(prefix, 'german-only', ['start'])}?lang=de`, 'en'],
          [who, page, at(prefix, 'german-only', ['no-such-step']), 'en'],
          [who, page, at(prefix, 'single-language', ['start']), 'en'],
        )
      }
    }
    for (const [who, page, address, lang] of rows) {
      await page.goto(`${origin}${address}`)
      const said = await page.locator('html').getAttribute('lang')
      console.log(`${who}: ${address} -> <html lang="${said}">`)
      expect(said, `${who}: ${address}`).toBe(lang)
    }
  })
})

test.describe('40.4: the chrome bar', () => {
  test('the arrow to /admin named toOverview, the logo, the mention of three Authors, the switch’s links; no share button, no Editor', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    for (const { lang, query } of LANGUAGES) {
      const ui = chrome(lang)
      await page.goto(`${origin}${preview('example-hidden', ['start'], lang)}`)
      const bar = page.locator('header')
      await expect(bar.getByRole('link', { name: ui.toOverview, exact: true })).toHaveAttribute('href', `/admin${query}`)
      await expect(bar.locator('img.logo')).toHaveAttribute('src', '/admin/api/trees/example-hidden/theme/example-lab-logo-white.svg')
      const other = lang === 'en' ? 'nl' : 'en'
      await expect(bar.locator('.language-switch a[href]')).toHaveAttribute('href', preview('example-hidden', ['start'], other))
      await expect(bar.locator('.share, .to-editor')).toHaveCount(0)
      await expect(bar.getByRole('link', { name: 'Editor', exact: true })).toHaveCount(0)

      await page.goto(`${origin}${preview('hidden-draft', [top, 'full'], lang)}`)
      await expect(page.locator('header .authors')).toHaveText(ui.byAuthors(['Anna', 'Bram', 'Cees']))
    }
  })

  test('the current language’s pill stays at 480 x 800 and 767 x 800', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    for (const [width, height] of [
      [480, 800],
      [767, 800],
    ] as const) {
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}${preview('hidden-draft', [top, 'full'])}`)
      await expect(page.locator('.preview-back'), `${width}x${height}`).toBeVisible()
      // The public page's bar, by the same component, where #204 gives the pill up below 768 for "Editor".
      await expect(page.locator('header.node-chrome .language--current'), `${width}x${height}`).toBeVisible()
    }
  })
})

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** The button at the top left and every box it must stay clear of, as laid out. */
function layout(page: Page, button: string) {
  return page.evaluate((button) => {
    const boxOf = (element: Element): Box => {
      const rect = element.getBoundingClientRect()
      return { x: Math.round(rect.x * 10) / 10, y: Math.round(rect.y * 10) / 10, w: Math.round(rect.width * 10) / 10, h: Math.round(rect.height * 10) / 10 }
    }
    const shown = (selector: string): Box[] => [...document.querySelectorAll(selector)].map(boxOf).filter((box) => box.w > 0 && box.h > 0)
    return {
      button: shown(button),
      others: {
        'the up arrow': shown('.tree-frame:not([aria-hidden]) .up-arrow'),
        'the cross': shown('.tree-frame:not([aria-hidden]) .step-delete'),
        "the ending's button": shown('.tree-frame:not([aria-hidden]) .step-end > button'),
        'the Bubble': shown('.tree-frame:not([aria-hidden]) .bubble'),
        'an Option button': shown('.tree-frame:not([aria-hidden]) .options > li'),
        "the Options' control": shown('.tree-frame:not([aria-hidden]) .options-collapsed .sheet-open'),
        'a floating control': shown('.editor-float > .sheet > .sheet-open'),
      },
      header: boxOf(document.querySelector('header')!),
      window: { w: window.innerWidth, h: window.innerHeight },
    }
  }, button)
}

const overlap = (a: Box, b: Box): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const show = (box: Box): string => `${box.x},${box.y} ${box.w}x${box.h}`

test.describe('40.5: the two buttons', () => {
  test('their names, titles and addresses in both languages; words from 1000 pixels wide, an icon below', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    for (const { lang } of LANGUAGES) {
      const ui = chrome(lang)
      for (const [address, name, href, selector] of [
        [editor('hidden-draft', [top, 'full'], lang), ui.preview, preview('hidden-draft', [top, 'full'], lang), '.preview-button'],
        [preview('hidden-draft', [top, 'full'], lang), ui.backToEditor, editor('hidden-draft', [top, 'full'], lang), '.preview-back'],
      ] as const) {
        for (const [width, words] of [
          [1000, true],
          [999, false],
        ] as const) {
          await page.setViewportSize({ width, height: 700 })
          await page.goto(`${origin}${address}`)
          const link = page.getByRole('link', { name, exact: true })
          await expect(link).toHaveCount(1)
          await expect(link).toHaveClass(selector.slice(1))
          await expect(link).toHaveAttribute('title', name)
          await expect(link).toHaveAttribute('href', href)
          const box = (await link.boundingBox())!
          if (words) {
            await expect(link.locator('.float-words')).toHaveText(name)
            await expect(link.locator('.float-words')).toBeVisible()
            expect(box.width, `${address} at ${width}`).toBeGreaterThan(80)
          } else {
            await expect(link.locator('.float-words')).toBeHidden()
            expect([box.width, box.height], `${address} at ${width}`).toEqual([32, 32])
          }
        }
      }
    }
  })

  test('the tab order: logout, the preview button, the to-do control, settings in the editor; the switch’s last link, the way back, the tree view in the preview', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}${editor('hidden-draft', [top, 'full'])}`)
    await page.locator('header').getByRole('button', { name: 'Log out' }).focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('.preview-button')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.locator('.editor-float > .todo-sheet > .sheet-open')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.locator('.editor-float > .panel-sheet > .sheet-open')).toBeFocused()

    await page.goto(`${origin}${preview('hidden-draft', [top, 'full'])}`)
    await page.locator('header .language-switch a[href]').last().focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('.preview-back')).toBeFocused()
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.closest('main .tree-frame') !== null)).toBe(true)
  })

  test('both buttons cover no part of the up arrow, the step’s buttons, the Bubble, an Option button, the Options’ control or the floating controls, under the bar and inside the window, at every viewport of the rule, in both languages', async ({ browser }) => {
    test.setTimeout(900_000)
    const { page } = await loggedIn(browser, ANNA)
    const rows: string[] = []
    for (const { lang } of LANGUAGES) {
      for (const [width, height] of VIEWPORTS) {
        await page.setViewportSize({ width, height })
        for (const [what, ids] of [
          ['the full Node under a first step', [top, 'full']],
          ['its No, a step that ends', [top, 'full', 'does-not-apply']],
          ['the root', [top]],
        ] as const) {
          for (const [surface, address, button] of [
            ['editor', editor('hidden-draft', [...ids], lang), '.preview-button'],
            ['preview', preview('hidden-draft', [...ids], lang), '.preview-back'],
          ] as const) {
            await page.goto(`${origin}${address}`)
            await page.evaluate(() => document.fonts.ready)
            const laid = await layout(page, button)
            const where = `${width}x${height} ${lang}, ${surface}, ${what}`
            expect(laid.button, `${where}: the button`).toHaveLength(1)
            const [box] = laid.button as [Box]
            rows.push(`${where}: ${show(box)} | ${Object.entries(laid.others).map(([name, boxes]) => `${name} ${boxes.map(show).join(' ')}`).filter((line) => !line.endsWith(' ')).join('; ')}`)
            expect(box.y, `${where}: ${show(box)} under the bar`).toBeGreaterThanOrEqual(laid.header.y + laid.header.h)
            expect(box.x, `${where}: inside the window`).toBeGreaterThanOrEqual(0)
            expect(box.x + box.w, `${where}: inside the window`).toBeLessThanOrEqual(laid.window.w)
            for (const [name, boxes] of Object.entries(laid.others)) {
              for (const other of boxes) expect(overlap(box, other), `${where}: ${show(box)} covers ${name} ${show(other)}`).toBe(false)
            }
          }
        }
      }
    }
    await writeFile(path.join(RESULTS, 'preview-boxes.md'), `${rows.join('\n')}\n`)
    console.log(`${rows.length} rows, clear; the boxes in tests/browser/.results/preview-boxes.md`)
  })

  test('on a hidden Tree the ending’s button is an icon named removeEnd at 639 x 700 and 360 x 640, its words at 640 x 700; on a published Tree its words and 30.8’s max-width', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    const ending = page.getByRole('button', { name: 'Tree does not end here after all', exact: true })
    for (const [width, height, icon] of [
      [639, 700, true],
      [360, 640, true],
      [640, 700, false],
    ] as const) {
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}${editor('hidden-draft', [top, 'full', 'does-not-apply'])}`)
      const where = `hidden, ${width}x${height}`
      await expect(ending, where).toHaveAttribute('title', 'Tree does not end here after all')
      const box = (await ending.boundingBox())!
      const cross = (await page.locator('.tree-frame:not([aria-hidden]) .step-delete').boundingBox())!
      console.log(`${where}: the ending's button ${box.x},${box.y} ${box.width}x${box.height}, the cross ${cross.width}x${cross.height}`)
      if (icon) {
        await expect(ending.locator('.step-end-words'), where).toBeHidden()
        await expect(ending.locator('.step-end-glyph'), where).toBeVisible()
        expect([box.width, box.height], where).toEqual([cross.width, cross.height])
      } else {
        await expect(ending.locator('.step-end-words'), where).toBeVisible()
        await expect(ending.locator('.step-end-glyph'), where).toBeHidden()
      }
    }
    for (const [width, height] of [
      [360, 640],
      [999, 700],
    ] as const) {
      await page.setViewportSize({ width, height })
      await page.goto(`${origin}${editor('ai-act-example', ['start', 'outside-scope'])}`)
      const where = `published, ${width}x${height}`
      await expect(ending.locator('.step-end-words'), where).toBeVisible()
      await expect(ending.locator('.step-end-glyph'), where).toHaveCount(0)
      const maxWidth = await page.locator('.tree-frame:not([aria-hidden]) .step-end').evaluate((element) => getComputedStyle(element).maxWidth)
      expect(maxWidth, where).toBe(`${width / 2 - 24 - 16}px`)
    }
  })

  test('at 320 x 480 both buttons are icons inside the window, under the bar', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA, 320, 480)
    for (const [address, button] of [
      [editor('hidden-draft', [top, 'full', 'does-not-apply']), '.preview-button'],
      [preview('hidden-draft', [top, 'full', 'does-not-apply']), '.preview-back'],
    ] as const) {
      await page.goto(`${origin}${address}`)
      await expect(page.locator('.minimum-size')).toBeVisible()
      const box = (await page.locator(button).boundingBox())!
      const bar = (await page.locator('header').boundingBox())!
      console.log(`${button} at 320 x 480: ${box.x},${box.y} ${box.width}x${box.height}`)
      expect([box.width, box.height]).toEqual([32, 32])
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(320)
      expect(box.y).toBeGreaterThanOrEqual(bar.y + bar.height)
      expect(box.y + box.height).toBeLessThanOrEqual(480)
    }
  })
})

test.describe('40.6: the way there and back', () => {
  /** The title field of the Node `id` in the editor, in English. */
  const titleField = (page: Page, id: string) => page.locator(`[data-field="${id} title.en"] textarea`)

  test('a title typed and the preview pressed at once: the preview shows it, and no dialog asked', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    const dialogs: string[] = []
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.type())
      void dialog.dismiss()
    })
    await page.goto(`${origin}${editor('walk', ['full', 'applies'])}`)
    await titleField(page, 'applies').fill('Typed a moment ago')
    await page.locator('.preview-button').click()
    await expect(page).toHaveURL(`${origin}${preview('walk', ['full', 'applies'])}`)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .bubble h1')).toHaveText('Typed a moment ago')
    expect(dialogs).toEqual([])
  })

  test('with the write route failing the button stays busy and does not leave; a second click adds nothing', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}${editor('walk', ['full', 'applies'])}`)
    const writes: string[] = []
    await page.route('**/admin/api/trees/walk/nodes/**', (route) => {
      if (route.request().method() !== 'PATCH') return route.continue()
      writes.push(route.request().postData() ?? '')
      return route.abort()
    })
    await titleField(page, 'applies').fill('Never saved')
    const button = page.locator('.preview-button')
    await button.click()
    await expect(button).toHaveAttribute('aria-busy', 'true')
    // Faded in over the transition's 160 ms.
    await expect.poll(() => button.evaluate((element) => getComputedStyle(element).opacity)).toBe('0.6')
    await button.click()
    await page.waitForTimeout(2_000)
    expect(page.url()).toBe(`${origin}${editor('walk', ['full', 'applies'])}`)
    await expect(page.locator('.editor-status')).toContainText('Not saved')
    expect(writes).toHaveLength(1)
  })

  test('a refused value is not waited for: the preview opens and shows what the store holds', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}${editor('walk', ['full', 'applies'])}`)
    const held = await titleField(page, 'applies').inputValue()
    await page.route('**/admin/api/trees/walk/nodes/**', (route) =>
      route.request().method() === 'PATCH'
        ? route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: 'blocking', violations: [{ file: 'applies', keyPath: 'title.en', rule: 'V-LENGTH', message: 'refused here' }] }) })
        : route.continue(),
    )
    await titleField(page, 'applies').fill('Refused by the store')
    await page.locator('.preview-button').click()
    await expect(page).toHaveURL(`${origin}${preview('walk', ['full', 'applies'])}`)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .bubble h1')).toHaveText(held)
  })

  test('the way back after two steps and a switch to Dutch leads to the editor of that step in Dutch', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}${editor('hidden-draft', [top])}`)
    await page.locator('.preview-button').click()
    await expect(page).toHaveURL(`${origin}${preview('hidden-draft', [top])}`)
    await page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--yes').click()
    await expect(page).toHaveURL(`${origin}${preview('hidden-draft', [top, 'full'])}`)
    await page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--no').click()
    await expect(page).toHaveURL(`${origin}${preview('hidden-draft', [top, 'full', 'does-not-apply'])}`)
    await page.locator('header .language-switch').getByRole('link', { name: 'Nederlands' }).click()
    await expect(page).toHaveURL(`${origin}${preview('hidden-draft', [top, 'full', 'does-not-apply'], 'nl')}`)
    await page.getByRole('link', { name: 'Terug naar de editor', exact: true }).click()
    await expect(page).toHaveURL(`${origin}${editor('hidden-draft', [top, 'full', 'does-not-apply'], 'nl')}`)
    await expect(page.locator('header.editor-chrome')).toBeVisible()
    await expect(page.locator('[data-field="does-not-apply title.nl"]')).toBeVisible()
  })

  test('the button goes on a publish from the panel and comes back on an unpublish, without a reload; none on a published Tree’s editor', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    await page.goto(`${origin}${editor('example-hidden', ['start'])}`)
    const button = page.locator('.preview-button')
    await expect(button).toBeVisible()
    await page.evaluate(() => ((window as unknown as { notReloaded: boolean }).notReloaded = true))
    const settings = page.locator('.panel-sheet > .sheet-open')
    const panel = page.locator('.panel-sheet > .sheet-panel')
    const reread = page.waitForResponse((response) => response.url().endsWith('/admin/api/accounts'))
    await settings.click()
    await reread
    const publish = panel.getByRole('switch', { name: 'Publish' })
    await publish.click()
    await expect(publish).toHaveAttribute('aria-checked', 'true')
    await expect(button).toHaveCount(0)
    await publish.click()
    await panel.locator('.panel-ask').getByRole('button', { name: 'Confirm' }).click()
    await expect(publish).toHaveAttribute('aria-checked', 'false')
    await expect(button).toHaveCount(1)
    expect(await page.evaluate(() => (window as unknown as { notReloaded?: boolean }).notReloaded)).toBe(true)

    await page.goto(`${origin}${editor('ai-act-example', ['start'])}`)
    await expect(page.locator('header.editor-chrome')).toBeVisible()
    await expect(page.locator('.preview-button')).toHaveCount(0)
  })
})

test.describe('40.7: a draft that is not valid yet', () => {
  test('each placeholder in its place, the one Answer alone and centred with its word, startAgain below the fresh step, no to-do count, and nothing logged', async ({ browser }) => {
    const { page } = await loggedIn(browser, ANNA)
    const ui = chrome('nl')
    const missing = `[${ui.missingText}]`
    await page.goto(`${origin}${preview('unfinished', ['full'], 'nl')}`)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .bubble h1')).toHaveText(missing)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .bubble .prose').first()).toHaveText(missing)
    await expect(page.locator('header .tree-title')).toHaveText(missing)
    expect(await page.title()).toBe(`${missing} - ${missing}`)
    const picture = page.locator('.tree-frame:not([aria-hidden]) .bubble a.main-image img')
    await expect(picture).toHaveAttribute('alt', missing)
    await expect(page.locator('#main-image-credit')).toHaveText(`[${ui.placeholderCredit}]`)
    await expect(page.locator('.todo-count, .editor-float, .preview-button')).toHaveCount(0)

    await expect(page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--yes')).toHaveCount(0)
    const no = page.locator('.tree-frame:not([aria-hidden]) .answers > .answer--no')
    await expect(no.locator('.branch-word')).toHaveText(ui.no)
    const [lone, row] = [(await no.boundingBox())!, (await page.locator('.tree-frame:not([aria-hidden]) .answers').boundingBox())!]
    console.log(`the one Answer ${lone.x}..${lone.x + lone.width}, its row ${row.x}..${row.x + row.width}`)
    expect(Math.abs(lone.x + lone.width / 2 - (row.x + row.width / 2))).toBeLessThanOrEqual(1)

    await page.goto(`${origin}${preview('unfinished', ['full', 'does-not-apply'], 'nl')}`)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .outcome')).toHaveText(ui.endingText)

    await page.goto(`${origin}${preview('unfinished', ['full', 'opt-two', fresh], 'nl')}`)
    await expect(page.locator(`.tree-frame:not([aria-hidden]) .bubble[data-node="${fresh}"] h1`)).toHaveText(missing)
    await expect(page.locator('.tree-frame:not([aria-hidden]) .answer--start-again')).toBeVisible()

    const log = await readFile(LOG, 'utf8')
    expect(log).not.toContain('Tree text missing')
  })
})

test('screenshots for the pull request: the editor of a hidden Tree with the preview button, its preview, the preview of an unfinished step, and the way back', async ({ browser }) => {
  test.setTimeout(300_000)
  for (const [width, height] of [
    [1280, 640],
    [360, 640],
  ] as const) {
    for (const { lang } of LANGUAGES) {
      const size = `${lang}-${width}x${height}`
      const { page } = await loggedIn(browser, ANNA, width, height)
      await page.goto(`${origin}${editor('example-hidden', ['start', 'prohibited-practices'], lang)}`)
      await expect(page.locator('.preview-button')).toBeVisible()
      await shoot(page, `editor-${size}`)
      await page.locator('.preview-button').click()
      await expect(page.locator('.preview-back')).toBeVisible()
      await shoot(page, `preview-${size}`)
      await page.goto(`${origin}${preview('unfinished', ['full'], lang)}`)
      await expect(page.locator('.preview-back')).toBeVisible()
      await shoot(page, `unfinished-${size}`)
      await page.goto(`${origin}${preview('example-hidden', ['start', 'prohibited-practices'], lang)}`)
      await page.locator('.preview-back').click()
      await expect(page.locator('header.editor-chrome')).toBeVisible()
      await shoot(page, `way-back-${size}`)
      await page.context().close()
    }
  }
})
