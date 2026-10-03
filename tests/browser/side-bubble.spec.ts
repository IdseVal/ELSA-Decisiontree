/**
 * **[#177]** The side bubble in the editor (docs/specs/application.md 30.4, 30.5, 30.7, amended
 * 2026-10-02; ADR-177-side-bubble-editing): one click on the fan's `+` opens a new side bubble,
 * empty with its placeholders; its title names its button as it is typed; its Sources are added,
 * labelled, edited and removed inside it, below the guarantee in their collapsed Sheet, where the
 * Overlay used to hide them whole (the owner's finding, #169); its Overlay offers no new side
 * bubble; `deleteSideBubble` at
 * its bottom deletes the Option and the Node, or only the Option where another step leads to the
 * aside too; and the published result walks on the public page.
 *
 * One story, in order, on a Tree of this file's own; the fixture Tree `hidden-draft` stands for
 * the second-level side bubbles a Tree already has. The Nodes of the draft are counted in the
 * store's own `draft.json`, which the page never reads. The screenshots the issue asks for go to
 * `docs/screenshots/issue-177/` under `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Browser, type Page } from '@playwright/test'
import type { DraftNode, Violation } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-177') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 170

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }
const TREE = 'side-bubbles'
/** A new Node's id is the server's: `n-` and six base32 characters (22.4). */
const NEW_ID = /^n-[a-z2-7]{6}$/
const LAW = 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'
const PICTURE = { name: 'covered.png', mimeType: 'image/png', buffer: Buffer.alloc(0) }

let origin: string
let dir: string

/** The three side bubbles of the story: the one that is kept, the one deleted, the one another step leads to. */
let a1 = ''
let a2 = ''
let a3 = ''

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  PICTURE.buffer = await readFile(path.join(repo, 'trees', 'ai-act-example', 'images', 'covered.png'))
  dir = await buildDataDir({
    trees: [{ folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, creator: ANNA.login }],
    accounts: [ANNA],
  })
  origin = await serveStore(dir, PORT, ADMIN_ENV)
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

/** A page logged in as Anna, at 1280 x 640 unless told otherwise, and the cookie for API calls of its own. */
async function loggedIn(browser: Browser, viewport = { width: 1280, height: 640 }): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext({ viewport })).newPage()
  const { status, cookie } = await login(page, origin, ANNA.login, ANNA.password)
  expect(status).toBe(204)
  return { page, cookie }
}

async function nodeOf(page: Page, cookie: string, id: string): Promise<DraftNode> {
  const response = await api(page, cookie, 'GET', `/trees/${TREE}/nodes/${id}`)
  expect(response.status(), `GET ${id}`).toBe(200)
  return ((await response.json()) as { node: DraftNode }).node
}

/** The ids of the draft's Nodes as the store wrote them, in its own file (17.2): a count the page does not make. */
async function draftNodes(): Promise<string[]> {
  const draft = JSON.parse(await readFile(path.join(dir, 'trees', TREE, 'draft.json'), 'utf8')) as { nodes: { id: string }[] }
  return draft.nodes.map((node) => node.id)
}

/** `GET /admin/api/trees/<t>` (22.1): the entry, whose to-do list names every Node a violation is at. */
async function entry(page: Page, cookie: string): Promise<{ advisory: Violation[] }> {
  const response = await api(page, cookie, 'GET', `/trees/${TREE}`)
  expect(response.status()).toBe(200)
  return (await response.json()) as { advisory: Violation[] }
}

const editor = (nodeIds: string[], tree = TREE) => `${origin}/admin/trees/${tree}/${nodeIds.join('/')}`
/** The open Overlay's panel: the side bubble on screen. */
const opened = (page: Page) => page.locator('details.overlay[open] > .sheet-panel')
/** Its Sources block inline, at and above the guarantee; the collapsed copy below it is `.sources-sheet` (28.6). */
const inline = (page: Page) => opened(page).locator('.sources--editing')

/**
 * Resolves once the page's script is there: `goto` resolves on `load`, before the Sheets are
 * hydrated, and a click on a button no script listens to yet is lost. Every Sheet draws its
 * backdrop in the render after hydration (`Sheet`), so one drawn means the page listens.
 */
async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('details.sheet > .sheet-backdrop').first()).toBeAttached()
}

/** Waits for the plain navigation a creation makes, to an address one id longer than `from`, and answers the id (30.4). */
async function landed(page: Page, from: string): Promise<string> {
  await page.waitForURL((url) => url.pathname.startsWith(`${from}/`) && url.pathname.split('/').length === from.split('/').length + 1)
  const id = new URL(page.url()).pathname.split('/').pop() ?? ''
  expect(id).toMatch(NEW_ID)
  return id
}

/** One click on the fan's `+` of the step at `path`, and the new side bubble it lands on, once its page listens (30.4). */
async function newSideBubble(page: Page, path: string[]): Promise<string> {
  await page.goto(editor(path))
  await hydrated(page)
  await page.locator('.options > li.options-add > .side-add').click()
  const id = await landed(page, `/admin/trees/${TREE}/${path.join('/')}`)
  await hydrated(page)
  return id
}

/** A Node of the draft as the store holds it once every write sent so far is in: polled, since "Saved" may still be the last one's. */
async function eventually<T>(read: () => Promise<T>, expected: T): Promise<void> {
  await expect.poll(read).toEqual(expected)
}

/** Types `text` into a field as a creator does, key by key, replacing what it held, and leaves it, which sends it (29.1). */
async function retype(page: Page, nodeId: string, keyPath: string, text: string): Promise<void> {
  const area = page.locator(`[data-field="${nodeId} ${keyPath}"] textarea`).filter({ visible: true })
  await area.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.type(text, { delay: 2 })
  await expect(area).toHaveValue(text)
  await area.blur()
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

test('one click on the fan’s + creates the Option and its Node and opens the new side bubble, empty with its placeholders: no Sheet, no question (30.4)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  expect((await api(page, cookie, 'POST', '/trees', { id: TREE, languages: ['en'], title: { en: 'Side bubbles' } })).status()).toBe(201)
  await page.goto(editor(['start']))
  await hydrated(page)
  const add = page.locator('.options > li.options-add > .side-add')
  await expect(add.locator('.option-title')).toHaveText('New side bubble')
  // The button is the control: no Sheet behind it, and no way to link an existing step (30.4, amended).
  await expect(page.locator('.options-add details')).toHaveCount(0)
  const before = await draftNodes()

  a1 = await newSideBubble(page, ['start'])
  const after = await draftNodes()
  console.log(`draft.json before the click: ${before.length} Node(s) (${before.join(', ')}); after it: ${after.length} (${after.join(', ')})`)
  expect(after).toEqual([...before, a1])
  expect((await nodeOf(page, cookie, 'start')).options).toEqual([{ title: { en: '' }, target: a1 }])
  expect((await nodeOf(page, cookie, a1)).title).toEqual({ en: '' })

  // The aside's address under the page renders it with the new Overlay open (10.9), every field empty and named.
  const panel = opened(page)
  await expect(panel.locator(`.overlay-interior[data-node="${a1}"]`)).toBeVisible()
  const title = panel.locator(`[data-field="${a1} title.en"] textarea`)
  await expect(title).toHaveValue('')
  await expect(title).toHaveAttribute('placeholder', 'Title')
  await expect(panel.locator(`[data-field="${a1} description.en"]`)).toContainText('Text')
  await expect(panel.locator('.editor-picker--slot')).toBeVisible()
  await expect(inline(page).locator('.source-sheet--add > .sheet-open')).toHaveText('+ Add a source')
  await expect(panel.locator('.side-delete-button')).toHaveText('Delete side bubble')
  const button = page.locator('[data-field="start options[0].title.en"] textarea')
  await expect(button).toHaveValue('')
  await expect(button).toHaveAttribute('placeholder', 'Side bubble title')
  await shoot(page, 'new-side-bubble')
})

test('the side bubble’s title names its button as it is typed, cut to the button’s 60; a title edited on the button stops following (30.5)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start', a1]))
  await hydrated(page)
  await retype(page, a1, 'title.en', 'Placing on the market')
  const button = page.locator('[data-field="start options[0].title.en"] textarea')
  await expect(button).toHaveValue('Placing on the market')
  await eventually(async () => (await nodeOf(page, cookie, 'start')).options[0]!.title, { en: 'Placing on the market' })
  await eventually(async () => (await nodeOf(page, cookie, a1)).title, { en: 'Placing on the market' })

  // Eighty characters for the aside, the first sixty of them on the button (5.7).
  const long = 'Placing on the market, or putting into service, of an AI system in the Union'
  expect(long.length).toBeLessThanOrEqual(80)
  await retype(page, a1, 'title.en', long)
  await expect(button).toHaveValue(long.slice(0, 60))
  await eventually(async () => (await nodeOf(page, cookie, 'start')).options[0]!.title.en, long.slice(0, 60))
  await eventually(async () => (await nodeOf(page, cookie, a1)).title.en, long)

  // The words on the button are the creator's to change; from then on the button keeps them.
  await page.goto(editor(['start']))
  await hydrated(page)
  await retype(page, 'start', 'options[0].title.en', 'On the market')
  await eventually(async () => (await nodeOf(page, cookie, 'start')).options[0]!.title.en, 'On the market')
  await page.goto(editor(['start', a1]))
  await hydrated(page)
  await retype(page, a1, 'title.en', 'Placing on the market in the Union')
  await eventually(async () => (await nodeOf(page, cookie, a1)).title.en, 'Placing on the market in the Union')
  expect((await nodeOf(page, cookie, 'start')).options[0]!.title.en).toBe('On the market')
})

for (const [width, height] of [
  [1280, 640],
  [1280, 560],
  [720, 800],
] as const) {
  // Below 564 pixels of height or 792 of width the Sources collapse to their Sheet (10.5, step 6).
  const collapsed = height < 564 || width < 792
  test(`a Source is added, labelled, edited and removed inside the side bubble as in the centre, at ${width}x${height}${collapsed ? ', in its collapsed Sheet' : ''} (28.1, 28.6; the owner’s finding)`, async ({ browser }) => {
    const { page, cookie } = await loggedIn(browser, { width, height })
    await page.goto(editor(['start', a1]))
    await hydrated(page)
    const panel = opened(page)
    let block = inline(page)
    if (collapsed) {
      // The Bubble's Sources are edited in their Sheet there (28.6); before #177 the side bubble
      // had no such Sheet, and the stylesheet hid its Sources whole (#169).
      await expect(block).toBeHidden()
      await panel.locator('.sources-sheet > .sheet-open').click()
      block = panel.locator('.sources-sheet > .sheet-panel')
    }
    const add = block.locator('.source-sheet--add > .sheet-open')
    await expect(add).toBeVisible()
    await add.click()
    await expect(block.locator('.source-editor--add .editor-url')).toBeFocused()
    await page.keyboard.type(LAW)
    await page.keyboard.press('Enter')
    const label = block.locator(`[data-field="${a1} sources[0].label.en"] textarea`)
    await expect(label).toBeFocused()
    await page.keyboard.type('Article 3 of the AI Act', { delay: 2 })
    await label.blur()
    await eventually(async () => (await nodeOf(page, cookie, a1)).sources, [{ kind: 'legal', label: { en: 'Article 3 of the AI Act' }, url: LAW }])

    // Edited in its own Sheet: the kind and the link (28.1), the side bubble open around it.
    await block.locator(`.source-sheet:not(.source-sheet--add) > .sheet-open`).click()
    await block.locator(`[data-field="${a1} sources[0].kind"] select`).selectOption('case-law')
    const url = block.locator(`[data-field="${a1} sources[0].url"] textarea`)
    await url.fill(`${LAW}/eng`)
    await url.blur()
    await eventually(async () => (await nodeOf(page, cookie, a1)).sources, [{ kind: 'case-law', label: { en: 'Article 3 of the AI Act' }, url: `${LAW}/eng` }])
    // One Escape closes the Source's Sheet and no more: the side bubble stays open around it.
    const menu = block.locator('.source-sheet:not(.source-sheet--add)')
    await url.focus()
    await page.keyboard.press('Escape')
    await expect(menu.locator(':scope > .sheet-panel')).toBeHidden()
    await expect(panel).toBeVisible()

    await menu.locator(':scope > .sheet-open').click()
    await block.getByRole('button', { name: 'Remove this source' }).click()
    await expect(panel.locator(`[data-field="${a1} sources[0].label.en"]`)).toHaveCount(0)
    await eventually(async () => (await nodeOf(page, cookie, a1)).sources, [])
    await expect(panel).toBeVisible()
  })
}

test('the side bubble filled: its text, a picture and a Source, entered in it; the button shows the picture (30.5, 31.5)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  await page.goto(editor(['start', a1]))
  await hydrated(page)
  const panel = opened(page)
  await retype(page, a1, 'title.en', 'Placing on the market')
  await panel.locator(`[data-field="${a1} description.en"]`).click()
  await page.keyboard.type('Making an AI system available on the Union market for the first time.', { delay: 2 })
  await panel.locator(`[data-field="${a1} description.en"] textarea`).blur()

  await inline(page).locator('.source-sheet--add > .sheet-open').click()
  // The form takes the focus when its Sheet has opened (28.1); a key before that is the summary's.
  await expect(inline(page).locator('.source-editor--add .editor-url')).toBeFocused()
  await page.keyboard.type(LAW)
  await page.keyboard.press('Enter')
  const label = inline(page).locator(`[data-field="${a1} sources[0].label.en"] textarea`)
  await expect(label).toBeFocused()
  await page.keyboard.type('Article 3(9) AI Act', { delay: 2 })
  await label.blur()
  await eventually(async () => (await nodeOf(page, cookie, a1)).sources, [{ kind: 'legal', label: { en: 'Article 3(9) AI Act' }, url: LAW }])

  await panel.locator('.editor-picker--slot input[type="file"]').setInputFiles(PICTURE)
  const attach = page.locator('.editor-attach-panel')
  await attach.getByLabel('Credit').fill('Drawing: ELSA lab')
  await attach.getByLabel('Description').fill('A covered system, drawn')
  await attach.getByRole('button', { name: 'Attach' }).click()
  await expect(attach).toHaveCount(0)
  await expect.poll(async () => (await nodeOf(page, cookie, a1)).images.length).toBe(1)

  const node = await nodeOf(page, cookie, a1)
  expect(node.title.en).toBe('Placing on the market')
  expect(node.description.en).toBe('Making an AI system available on the Union market for the first time.')
  expect(node.sources).toEqual([{ kind: 'legal', label: { en: 'Article 3(9) AI Act' }, url: LAW }])
  expect(node.images).toHaveLength(1)
  await expect(panel.locator('.main-image img')).toHaveAttribute('src', `/admin/api/trees/${TREE}/images/${node.images[0]!.file}`)
  await expect(page.locator('.options > li:first-child img.option-image')).toHaveAttribute('src', `/admin/api/trees/${TREE}/images/${node.images[0]!.file}`)
  await expect(panel).toBeVisible()
  await shoot(page, 'side-bubble-filled')
})

test('no “New side bubble” inside a side bubble: the second-level side bubbles a Tree has are still listed and still open; an aside on its own page keeps its fan’s + (30.5, 10.9)', async ({ browser }) => {
  const { page } = await loggedIn(browser)
  await page.goto(editor(['full'], 'hidden-draft'))
  await hydrated(page)
  const overlay = page.locator('details.overlay').first()
  await overlay.locator(':scope > .sheet-open .option-image').click()
  const panel = overlay.locator(':scope > .sheet-panel')
  await expect(panel).toBeVisible()
  // opt-one's own Option, to opt-two, is its list; nothing after it offers a new one.
  await expect(panel.locator('.overlay-options a')).toHaveAttribute('href', '/admin/trees/hidden-draft/full/opt-one/opt-two')
  await expect(panel.getByText('New side bubble')).toHaveCount(0)
  await expect(page.locator('.overlay-interior .side-add, .side-add--list')).toHaveCount(0)

  await panel.locator('.overlay-options a').click()
  await expect(page).toHaveURL(editor(['full', 'opt-one', 'opt-two'], 'hidden-draft'))
  await expect(opened(page).locator('.overlay-interior[data-node="opt-two"]')).toBeVisible()
  await expect(opened(page).getByText('New side bubble')).toHaveCount(0)

  // opt-three opened as its own page is the centre: its fan has the + (30.4).
  await page.goto(editor(['opt-three'], 'hidden-draft'))
  await expect(page.locator('.options > li.options-add > .side-add')).toHaveCount(1)
})

test('Delete side bubble, below in the middle: asked once with its title, it deletes the Option and the Node; the Overlay closes and the fan closes the gap (30.7)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  a2 = await newSideBubble(page, ['start'])
  await retype(page, a2, 'title.en', 'To be deleted')
  await eventually(async () => (await nodeOf(page, cookie, a2)).title.en, 'To be deleted')
  a3 = await newSideBubble(page, ['start'])
  await retype(page, a3, 'title.en', 'Asked about twice')
  await eventually(async () => (await nodeOf(page, cookie, a3)).title.en, 'Asked about twice')
  expect((await nodeOf(page, cookie, 'start')).options.map((option) => option.target)).toEqual([a1, a2, a3])

  await page.goto(editor(['start', a2]))
  await hydrated(page)
  const panel = opened(page)
  const remove = panel.locator('.side-delete')
  // At the bottom of the panel, in its middle.
  const box = (await remove.locator('.side-delete-button').boundingBox())!
  const outer = (await panel.boundingBox())!
  console.log(`Delete side bubble: ${JSON.stringify(box)} in the panel ${JSON.stringify(outer)}`)
  expect(Math.abs(box.x + box.width / 2 - (outer.x + outer.width / 2))).toBeLessThanOrEqual(1)
  expect(outer.y + outer.height - (box.y + box.height)).toBeLessThanOrEqual(40)
  await shoot(page, 'delete-side-bubble')

  await remove.getByRole('button', { name: 'Delete side bubble' }).click()
  await expect(remove.locator('.structure-confirm')).toHaveText('Delete the side bubble "To be deleted"?')
  await expect(remove.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await shoot(page, 'delete-side-bubble-confirm')
  // Cancel keeps it; asked again, the confirmation is the one question.
  await remove.getByRole('button', { name: 'Cancel' }).click()
  await expect(remove.getByRole('button', { name: 'Delete side bubble' })).toBeVisible()
  await remove.getByRole('button', { name: 'Delete side bubble' }).click()

  const before = await draftNodes()
  const todoBefore = (await entry(page, cookie)).advisory
  await remove.getByRole('button', { name: 'Confirm' }).click()
  await page.waitForURL(editor(['start']))
  const after = await draftNodes()
  const todoAfter = (await entry(page, cookie)).advisory
  console.log(`draft.json before the delete: ${before.length} Node(s) (${before.join(', ')}); after it: ${after.length} (${after.join(', ')})`)
  console.log(`GET /admin/api/trees/${TREE}: ${todoBefore.length} to-do line(s) before, ${todoAfter.length} after; naming ${a2} after: ${todoAfter.filter((v) => v.file === a2).length}`)
  expect(after).toEqual(before.filter((id) => id !== a2))
  expect((await api(page, cookie, 'GET', `/trees/${TREE}/nodes/${a2}`)).status()).toBe(404)
  expect(todoAfter.filter((violation) => violation.file === a2)).toEqual([])
  expect((await nodeOf(page, cookie, 'start')).options.map((option) => option.target)).toEqual([a1, a3])

  // No Overlay open; the fan's two buttons, right then left, and the + after them.
  await expect(page.locator('details.overlay[open]')).toHaveCount(0)
  await expect(page.locator('.options > li')).toHaveCount(3)
  await expect(page.locator(`.options > li:has(.overlay-interior[data-node="${a3}"])`)).toHaveAttribute('data-side', 'left')
  await expect(page.locator('.options > li.options-add')).toHaveAttribute('data-side', 'right')
})

test('a side bubble another step leads to as well: Delete removes this step’s Option, and the aside stays where the other leads to it (30.7)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  // a1 leads to a3 too: one aside under two Nodes (tree-format.md 5.4), as the owner's Trees may hold.
  expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${a1}`, { op: 'add-option', target: a3, title: { en: 'Asked about twice' } })).status()).toBe(200)
  await page.goto(editor(['start', a3]))
  await hydrated(page)
  const remove = opened(page).locator('.side-delete')
  await remove.getByRole('button', { name: 'Delete side bubble' }).click()
  await expect(remove.locator('.structure-confirm')).toHaveText('Delete the side bubble "Asked about twice"? Another step leads to it too: it stays there.')
  const before = await draftNodes()
  await remove.getByRole('button', { name: 'Confirm' }).click()
  await page.waitForURL(editor(['start']))
  const after = await draftNodes()
  console.log(`draft.json before the delete of a shared side bubble: ${before.length} Node(s); after it: ${after.length} (${after.join(', ')})`)
  expect(after).toEqual(before)
  expect((await nodeOf(page, cookie, 'start')).options.map((option) => option.target)).toEqual([a1])
  expect((await nodeOf(page, cookie, a3)).title.en).toBe('Asked about twice')
  expect((await nodeOf(page, cookie, a1)).options).toEqual([{ title: { en: 'Asked about twice' }, target: a3 }])
  await expect(page.locator('.options > li')).toHaveCount(2)
})

test('published, the side bubble walks on the public page: its button with its title and picture, its text and Source in the Overlay, and its own aside after it (DONE WHEN)', async ({ browser }) => {
  const { page, cookie } = await loggedIn(browser)
  const write = async (id: string, change: unknown): Promise<void> => {
    expect((await api(page, cookie, 'PATCH', `/trees/${TREE}/nodes/${id}`, change)).status()).toBe(200)
  }
  // The rest of a Tree Publish takes (19.3): the root's two Answers, each an end, and every text.
  for (const [link, words] of [
    ['yes', 'Applies'],
    ['no', 'Does not apply'],
  ] as const) {
    const made = (await (await api(page, cookie, 'POST', `/trees/${TREE}/nodes`, { from: { node: 'start', link }, title: { en: `It ends: ${words}` } })).json()) as { node: { id: string } }
    expect((await api(page, cookie, 'POST', `/trees/${TREE}/nodes`, { from: { node: made.node.id, link: 'end', label: { en: words } } })).status()).toBe(201)
    await write(made.node.id, { path: 'description.en', value: `The Act: ${words}.` })
  }
  await write('start', { path: 'title.en', value: 'Is it placed on the market?' })
  await write('start', { path: 'description.en', value: 'The first question.' })
  await write(a3, { path: 'description.en', value: 'Asked about from two places.' })
  const published = await api(page, cookie, 'PUT', `/trees/${TREE}/published`, { published: true })
  expect(published.status(), await published.text()).toBe(200)

  const dataset = (await (await page.request.get(`${origin}/${TREE}/tree.json`)).json()) as { nodes: { id: string }[] }
  const inFile = dataset.nodes.map((node) => node.id)
  console.log(`Nodes in the published tree.json: ${inFile.length} (${inFile.join(', ')})`)
  expect(inFile).toEqual(await draftNodes())
  expect(inFile).not.toContain(a2)

  await page.goto(`${origin}/${TREE}/start`)
  await expect(page.locator('[data-field], .side-add, .side-delete')).toHaveCount(0)
  const overlay = page.locator('details.overlay').filter({ has: page.locator(`.overlay-interior[data-node="${a1}"]`) })
  await expect(overlay.locator(':scope > .sheet-open .option-title')).toHaveText('On the market')
  await expect(overlay.locator(':scope > .sheet-open img.option-image')).toHaveAttribute('src', /^\/side-bubbles\/images\//)
  await overlay.locator(':scope > .sheet-open').click()
  const panel = overlay.locator(':scope > .sheet-panel')
  await expect(panel.locator('h2 a')).toHaveText('Placing on the market')
  await expect(panel.locator('.overlay-interior')).toContainText('Making an AI system available on the Union market for the first time.')
  await expect(panel.locator('.sources a')).toHaveAttribute('href', LAW)
  await expect(panel.locator('.sources a')).toHaveText('Article 3(9) AI Act')
  await panel.locator('.overlay-options a').click()
  await expect(page).toHaveURL(`${origin}/${TREE}/start/${a1}/${a3}`)
  await expect(page.locator('details.overlay[open] .overlay-interior')).toHaveAttribute('data-node', a3)
  await shoot(page, 'public-walk-after-publish')
})
