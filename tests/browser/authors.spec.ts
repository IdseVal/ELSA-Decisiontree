/**
 * **[#197]** The mention of a Tree's Authors, in a browser (docs/specs/application.md 39.1 to
 * 39.7, 39.9; ADR-195-the-mention, ADR-195-authors): "By A, B and C" in the chrome bar of a
 * published Tree's Node pages and on its tile on both overviews, in English and in Dutch, at the
 * ten viewports of 10.6 -- one name and three, beside a logo and beside a title of 80 characters,
 * and eight Authors whose names do not fit. At each it is drawn whole, cut with its whole text as
 * its `title`, or not drawn, by the room 39.4 and 39.5 give it: one line, inside its bar or row,
 * the width of its room, with the mark, the controls, the tags and the state mark where they stand
 * on the same page of the same Tree without Authors. And: the order of joining after a hand-over,
 * and after a removal and a second invitation; no element for a Tree whose only role holder is the
 * administrator, none in the editor and none on the 404 and 403 pages; the same markup without
 * JavaScript; the chrome language's `lang` where the content speaks another; the screenshots of
 * 35.7, under `docs/screenshots/issue-197/` with `ELSA_SHOTS=1`.
 *
 * One server of this file's own, on a data directory built with accounts (35.1): copies of the
 * example Tree, whose logo is 120 pixels wide, and of the full-node fixture, which has no logo,
 * given a title of the format's 80 characters, each with one Author, three, eight or none. Every
 * measurement is written to `tests/browser/.results/authors.md`, so the pull request can paste it.
 */
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { chrome } from '../../src/chrome.ts'
import { treeBytes } from '../../src/tree/serialise.ts'
import { ADMIN_ENV, buildDataDir, login, type TestAccount } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
/** Clear of every other spec's ports. */
const PORT = BASE_PORT + 185
/** The screenshots 35.7 asks for: the tracked set under `ELSA_SHOTS=1`, the results folder otherwise. */
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-197') : path.join(RESULTS, 'shots')

/** The viewports of 10.6, in its order. */
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
  [320, 480],
] as const

const LANGUAGES = ['en', 'nl'] as const

/** An account of the data directory, its password made from its address. */
function account(name: string, email: string): TestAccount & { email: string } {
  return { name, email, password: `${email} password` }
}

const ANNA = account('Anna de Vries', 'anna@example.org')
const BRAM = account('Bram Jansen', 'bram@example.org')
const CEES = account('Cees Bakker', 'cees@example.org')
/** Five more, whose names after the three above are far wider than the bar's room at 1280 x 640. */
const FIVE = [
  account('Dirk-Jan van der Heijden', 'dirk-jan@example.org'),
  account('Elisabeth Vermeulen-Smit', 'elisabeth@example.org'),
  account('Frederika van Oldenbarnevelt', 'frederika@example.org'),
  account('Gijsbertus Mulder-Hoekstra', 'gijsbertus@example.org'),
  account('Hendrika de Groot-Bakker', 'hendrika@example.org'),
]
/** The Author of a hidden Tree, and of nothing else. */
const DORA = account('Dora Kwast', 'dora@example.org')

/** A title of the format's 80 characters in both languages (`tree-format.md` 5.7), for a Tree the bar names in text. */
const LONG_TITLE = {
  en: 'Does the EU AI Act apply to my AI system and which of its duties follow from it?',
  nl: 'Geldt de EU AI-verordening voor mijn AI-systeem, en welke plichten volgen er nu?',
}

/** The published Trees whose Authors this file never changes, each with its Authors in the order they joined it. */
const AUTHORED: Record<string, TestAccount[]> = {
  'example-one': [ANNA],
  'example-three': [ANNA, BRAM, CEES],
  'example-eight': [ANNA, BRAM, CEES, ...FIVE],
  'long-one': [ANNA],
  'long-three': [ANNA, BRAM, CEES],
}

/** Each of them beside the same Tree without an Author: its only role holder the administrator. */
const TWIN = (id: string): string => (id.startsWith('example-') ? 'example-nobody' : 'long-nobody')

let origin: string
/** Each account's id, by its address: what the API names an account by. */
let ids: Map<string, string>
let longFolder: string

/** One row of the table the pull request pastes. */
interface Row {
  place: string
  id: string
  lang: string
  viewport: string
  room: number
  shown: string
}

const rows: Row[] = []

test.beforeAll(async () => {
  longFolder = await longTitleTree()
  const example = path.join(repo, 'trees', 'ai-act-example')
  const roles = (authors: TestAccount[]) => ({ creator: authors[0]!.email!, collaborators: authors.slice(1).map((author) => author.email!) })
  const dir = await buildDataDir({
    trees: [
      ...Object.entries(AUTHORED).map(([id, authors]) => ({ folder: id.startsWith('example-') ? example : longFolder, id, ...roles(authors) })),
      { folder: example, id: 'example-nobody' },
      { folder: longFolder, id: 'long-nobody' },
      { folder: example, id: 'handed-over', ...roles([ANNA, BRAM]) },
      { folder: example, id: 'rejoined', ...roles([ANNA, BRAM, CEES]) },
      { folder: path.join(repo, 'tests', 'fixtures', 'german-only'), id: 'german-one', ...roles([ANNA]) },
      { folder: path.join(repo, 'tests', 'fixtures', 'full-node'), id: 'hidden-draft', hidden: true, ...roles([DORA]) },
    ],
    accounts: [ANNA, BRAM, CEES, ...FIVE, DORA],
  })
  const records = JSON.parse(await readFile(path.join(dir, 'accounts.json'), 'utf8')) as { id: string; email: string }[]
  ids = new Map(records.map(({ id, email }) => [email, id]))
  origin = await serveStore(dir, PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
  await rm(path.dirname(longFolder), { recursive: true, force: true })
  await mkdir(RESULTS, { recursive: true })
  const table = [
    '| place | Tree | lang | viewport | room | mention |',
    '|---|---|---|---|---|---|',
    ...rows.map((row) => `| ${row.place} | ${row.id} | ${row.lang} | ${row.viewport} | ${Math.max(0, row.room).toFixed(1)} | ${row.shown} |`),
  ]
  await writeFile(path.join(RESULTS, 'authors.md'), `${table.join('\n')}\n`)
})

/**
 * A copy of `tests/fixtures/full-node/`, whose Theme names no logo, with `LONG_TITLE`: the bar
 * names it in text (13.4), which leaves the mention the least room a Tree's mark leaves (39.4).
 */
async function longTitleTree(): Promise<string> {
  const folder = path.join(await mkdtemp(path.join(tmpdir(), 'elsa-authors-')), 'long-title')
  await cp(path.join(repo, 'tests', 'fixtures', 'full-node'), folder, { recursive: true })
  const file = path.join(folder, 'tree.json')
  const tree = JSON.parse(await readFile(file, 'utf8'))
  tree.title = LONG_TITLE
  await writeFile(file, treeBytes(tree))
  return folder
}

/** `address` in `lang`: the query of 4.1, left out for English, every Tree's default here. */
function inLang(address: string, lang: string): string {
  return lang === 'en' ? address : `${address}${address.includes('?') ? '&' : '?'}lang=${lang}`
}

/** The names of `authors`, as their accounts hold them. */
function namesOf(authors: TestAccount[]): string[] {
  return authors.map((author) => author.name)
}

/** A page in a context of its own, logged in as `who`; and the `Cookie` header its API calls carry (`login`). */
async function loggedIn(browser: Browser, who: TestAccount): Promise<{ page: Page; cookie: string }> {
  const page = await (await browser.newContext()).newPage()
  const { status, cookie } = await login(page, origin, who.email!, who.password)
  expect(status).toBe(204)
  return { page, cookie }
}

/** `method` on the editor's API at `address` as the session `cookie` (22.1); answers the status. */
async function send(page: Page, cookie: string, method: 'PUT' | 'DELETE', address: string, data: unknown = {}): Promise<number> {
  return (await page.request.fetch(`${origin}${address}`, { method, headers: { Origin: origin, Cookie: cookie }, data })).status()
}

/** A box as `getBoundingClientRect` gives it. */
interface Box {
  left: number
  top: number
  width: number
  height: number
}

/** The mention's line as laid out: what 39.4 and 39.5 decide about it. */
interface Line {
  drawn: boolean
  box: Box
  lineHeight: number
  clientWidth: number
  scrollWidth: number
  title: string | null
  text: string | null
  lang: string | null
  clamp: boolean
  markup: string
}

/** The chrome bar of a Node page: the bar, the mark, the controls and the mention's room and line. */
interface Bar {
  gap: number
  bar: Box
  brand: Box
  mark: Box
  controls: Box
  /** The room's width; null when the page has no mention at all. */
  room: number | null
  roomBox: Box | null
  line: Line | null
}

/** Opens `url` and measures its chrome bar once its fonts have settled. */
async function barAt(page: Page, url: string): Promise<Bar> {
  expect((await page.goto(url))?.status(), url).toBe(200)
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const box = (el: Element): Box => {
      const { left, top, width, height } = el.getBoundingClientRect()
      return { left, top, width, height }
    }
    const bar = document.querySelector('header.page-chrome')!
    const room = bar.querySelector(':scope > .authors-room')
    const line = room?.querySelector<HTMLElement>(':scope > p.authors') ?? null
    const style = line && getComputedStyle(line)
    return {
      gap: parseFloat(getComputedStyle(bar).columnGap),
      bar: box(bar),
      brand: box(bar.querySelector('.page-brand')!),
      mark: box(bar.querySelector('.page-brand .logo, .page-brand .tree-title')!),
      controls: box(bar.querySelector('.page-controls')!),
      room: room && room.getBoundingClientRect().width,
      roomBox: room && box(room),
      line: line && {
        drawn: style!.display !== 'none',
        box: box(line),
        lineHeight: parseFloat(style!.lineHeight),
        clientWidth: line.clientWidth,
        scrollWidth: line.scrollWidth,
        title: line.getAttribute('title'),
        text: line.textContent,
        lang: line.getAttribute('lang'),
        clamp: line.hasAttribute('data-clamp'),
        markup: room!.outerHTML,
      },
    }
  })
}

/** One tile's bottom row, every box in it relative to the tile's own. */
interface Tile {
  lang: string | null
  gap: number
  row: Box
  tags: Box[]
  state: Box | null
  room: number | null
  roomBox: Box | null
  line: Line | null
}

/** Every tile of the overview `url`, by its Tree's id, once the fonts have settled. */
async function tilesAt(page: Page, url: string): Promise<Record<string, Tile>> {
  expect((await page.goto(url))?.status(), url).toBe(200)
  await page.evaluate(() => document.fonts.ready)
  return page.evaluate(() => {
    const tiles: Record<string, unknown> = {}
    for (const tile of document.querySelectorAll<HTMLElement>('a.tile[data-tree]')) {
      const origin = tile.getBoundingClientRect()
      const box = (el: Element): Box => {
        const { left, top, width, height } = el.getBoundingClientRect()
        return { left: left - origin.left, top: top - origin.top, width, height }
      }
      const row = tile.querySelector('.tile-languages')!
      const room = row.querySelector(':scope > .tile-authors-room')
      const line = room?.querySelector<HTMLElement>(':scope > .tile-authors') ?? null
      const style = line && getComputedStyle(line)
      const state = row.querySelector(':scope > .tile-state')
      tiles[tile.dataset.tree!] = {
        lang: tile.getAttribute('lang'),
        gap: parseFloat(getComputedStyle(row).columnGap),
        row: box(row),
        tags: [...row.querySelectorAll(':scope > .tile-language')].map(box),
        state: state && box(state),
        room: room && room.getBoundingClientRect().width,
        roomBox: room && box(room),
        line: line && {
          drawn: style!.display !== 'none',
          box: box(line),
          lineHeight: parseFloat(style!.lineHeight),
          clientWidth: line.clientWidth,
          scrollWidth: line.scrollWidth,
          title: line.getAttribute('title'),
          text: line.textContent,
          lang: line.getAttribute('lang'),
          clamp: line.hasAttribute('data-clamp'),
          markup: room!.outerHTML,
        },
      }
    }
    return tiles as Record<string, Tile>
  })
}

/** `a` and `b` are one box, to the half pixel: nothing moved. */
function expectSameBox(a: Box | null, b: Box | null, where: string): void {
  expect(a === null, `${where}: present on one page and not the other`).toBe(b === null)
  if (a === null || b === null) return
  for (const side of ['left', 'top', 'width', 'height'] as const) {
    expect(Math.abs(a[side] - b[side]), `${where}: ${side} ${a[side]} against ${b[side]}`).toBeLessThanOrEqual(0.5)
  }
}

/**
 * 39.4 and 39.5's rules for one line in its room of `room` pixels, the gap its margin gives
 * back already taken off: its whole text, as its text and its `title`, whatever is drawn; not
 * drawn under 80 pixels; drawn, one line as wide as its room. Answers what was shown, for the
 * table: whole, cut or not drawn.
 */
function expectRule(line: Line, room: number, words: string, where: string): 'whole' | 'cut' | 'not drawn' {
  expect(line.text, `${where}: the whole text, read whole by a screen reader`).toBe(words)
  expect(line.title, `${where}: the whole text as the title`).toBe(words)
  expect(line.clamp, `${where}: data-clamp, the cut being the design (39.6)`).toBe(true)
  expect(line.drawn, `${where}: drawn in ${room.toFixed(1)} pixels of room, not under 80`).toBe(room >= 80)
  if (!line.drawn) return 'not drawn'
  expect(Math.abs(line.box.width - room), `${where}: the line is its room's width, ${line.box.width} in ${room}`).toBeLessThanOrEqual(0.5)
  expect(line.box.height, `${where}: one line`).toBe(line.lineHeight)
  return line.scrollWidth > line.clientWidth ? 'cut' : 'whole'
}

for (const lang of LANGUAGES) {
  test(`the mention in the chrome bar, ${lang}, at every viewport of 10.6: whole, cut or not drawn by its room, and nothing else moved (39.4)`, async ({ page }) => {
    test.slow()
    for (const [width, height] of VIEWPORTS) {
      const viewport = `${width}x${height}`
      await page.setViewportSize({ width, height })
      const twins = new Map<string, Bar>()
      for (const id of ['example-nobody', 'long-nobody']) {
        const twin = await barAt(page, `${origin}${inLang(`/${id}`, lang)}`)
        expect(twin.room, `${id} (${lang}) at ${viewport}: no mention, the administrator is its only role holder`).toBeNull()
        twins.set(id, twin)
      }
      for (const [id, authors] of Object.entries(AUTHORED)) {
        const where = `${id} (${lang}) at ${viewport}`
        const m = await barAt(page, `${origin}${inLang(`/${id}`, lang)}`)
        const twin = twins.get(TWIN(id))!
        // The room takes no pixel: the bar, the mark and the controls as on the Tree without Authors.
        expectSameBox(m.bar, twin.bar, `${where}: the bar`)
        expectSameBox(m.brand, twin.brand, `${where}: the way back and the mark`)
        expectSameBox(m.mark, twin.mark, `${where}: the mark`)
        expectSameBox(m.controls, twin.controls, `${where}: the controls`)
        expect(m.line, `${where}: the mention`).not.toBeNull()
        // Its own margin cancels the bar's gap before it: the room begins where the mark ends.
        const { roomBox } = m
        expect(Math.abs(roomBox!.left - (m.brand.left + m.brand.width)), `${where}: the room begins at the mark's end`).toBeLessThanOrEqual(0.5)
        expect(Math.abs(roomBox!.left + roomBox!.width + m.gap - m.controls.left), `${where}: the room ends a gap before the controls`).toBeLessThanOrEqual(0.5)
        const room = m.room! - m.gap
        const shown = expectRule(m.line!, room, chrome(lang).byAuthors(namesOf(authors)), where)
        rows.push({ place: 'chrome bar', id, lang, viewport, room, shown })
        if (m.line!.drawn) {
          const { box } = m.line!
          expect(box.left, `${where}: inside the bar`).toBeGreaterThanOrEqual(m.bar.left)
          expect(box.left + box.width, `${where}: inside the bar`).toBeLessThanOrEqual(m.bar.left + m.bar.width + 0.5)
          expect(box.top, `${where}: inside the bar`).toBeGreaterThanOrEqual(m.bar.top)
          expect(box.top + box.height, `${where}: inside the bar`).toBeLessThanOrEqual(m.bar.top + m.bar.height + 0.5)
          expect(box.left, `${where}: after the mark`).toBeGreaterThanOrEqual(m.brand.left + m.brand.width + m.gap - 0.5)
          expect(box.left + box.width, `${where}: before the controls`).toBeLessThanOrEqual(m.controls.left - m.gap + 0.5)
        }
        // What 39.4 says this gives: beside a 120-pixel logo drawn from 768 x 1024 up and not on a
        // phone; beside an 80-character title drawn from 1024 x 768 up and not below.
        if (id.startsWith('example-') && (width >= 768 || viewport === '390x844' || viewport === '360x640')) {
          expect(m.line!.drawn, `${where}: beside the logo`).toBe(width >= 768)
        }
        if (id.startsWith('long-')) expect(m.line!.drawn, `${where}: beside the 80-character title`).toBe(width >= 1024)
        if (viewport === '1280x640' && id === 'example-three') expect(shown, `${where}: three names whole at the guarantee`).toBe('whole')
        if (viewport === '1280x640' && id === 'example-eight') expect(shown, `${where}: eight names do not fit`).toBe('cut')
      }
    }
  })
}

for (const lang of LANGUAGES) {
  test(`the mention on the tiles of both overviews, ${lang}, at every viewport of 10.6: one name whole, three cut, and the tags and the state mark where they stand without it (39.5)`, async ({ browser }) => {
    test.slow()
    const visitor = await browser.newPage()
    // Anna holds a role on every authored Tree, so on her overview each of them carries a state
    // mark, as its twin does, which she has no role on (26.4).
    const { page: creator } = await loggedIn(browser, ANNA)
    for (const [width, height] of VIEWPORTS) {
      const viewport = `${width}x${height}`
      for (const [page, overview] of [
        [visitor, '/'],
        [creator, '/admin'],
      ] as const) {
        await page.setViewportSize({ width, height })
        const tiles = await tilesAt(page, `${origin}${inLang(overview, lang)}`)
        // Dora's hidden Tree: on no public overview, and on the overview of no one without a role on it.
        expect(Object.keys(tiles), overview).not.toContain('hidden-draft')
        for (const twin of ['example-nobody', 'long-nobody']) expect(tiles[twin]!.room, `${twin} on ${overview}: no mention`).toBeNull()
        for (const [id, authors] of Object.entries(AUTHORED)) {
          const where = `the tile of ${id} on ${overview} (${lang}) at ${viewport}`
          const tile = tiles[id]!
          const twin = tiles[TWIN(id)]!
          expectSameBox(tile.row, twin.row, `${where}: the row`)
          expect(tile.tags.length, `${where}: the tags`).toBe(twin.tags.length)
          tile.tags.forEach((tag, at) => expectSameBox(tag, twin.tags[at]!, `${where}: tag ${at + 1}`))
          expectSameBox(tile.state, twin.state, `${where}: the state mark`)
          expect(tile.line, `${where}: the mention`).not.toBeNull()
          const last = tile.tags.at(-1)!
          const roomBox = tile.roomBox!
          expect(Math.abs(roomBox.left - (last.left + last.width)), `${where}: the room begins at the last tag's end`).toBeLessThanOrEqual(0.5)
          const rowEnd = tile.state ? tile.state.left - tile.gap : tile.row.left + tile.row.width
          expect(Math.abs(roomBox.left + roomBox.width - rowEnd), `${where}: the room ends at the state mark's gap or the row's end`).toBeLessThanOrEqual(0.5)
          const room = tile.room! - tile.gap
          const shown = expectRule(tile.line!, room, chrome(lang).byAuthors(namesOf(authors)), where)
          rows.push({ place: `tile on ${overview}`, id, lang, viewport, room, shown })
          if (tile.line!.drawn) {
            const { box } = tile.line!
            expect(box.left, `${where}: after the tags`).toBeGreaterThanOrEqual(tile.tags.at(-1)!.left + tile.tags.at(-1)!.width + tile.gap - 0.5)
            const end = tile.state ? tile.state.left - tile.gap : tile.row.left + tile.row.width
            expect(box.left + box.width, `${where}: before the state mark, inside the row`).toBeLessThanOrEqual(end + 0.5)
            expect(box.top, `${where}: on the tags' line`).toBeGreaterThanOrEqual(tile.row.top)
            expect(box.top + box.height, `${where}: on the tags' line`).toBeLessThanOrEqual(tile.row.top + tile.row.height + 0.5)
          }
          // 39.5, measured: one name is whole on both overviews at every width, three are cut.
          expect(shown, where).toBe(authors.length === 1 ? 'whole' : 'cut')
        }
      }
    }
  })
}

test('the order of joining after a hand-over: the account that made the Tree stays first, and one removed is named no more (39.1, 39.2)', async ({ browser }) => {
  const page = await browser.newPage()
  const mention = page.locator('header.page-chrome .authors')
  const tile = page.locator('a.tile[data-tree="handed-over"] .tile-authors')
  await page.goto(`${origin}/handed-over`)
  await expect(mention).toHaveText('By Anna de Vries and Bram Jansen')

  // Anna made the Tree and invited Bram, then hands it to Cees: the new creator joins last.
  const anna = await loggedIn(browser, ANNA)
  expect(await send(anna.page, anna.cookie, 'PUT', '/admin/api/trees/handed-over/creator', { accountId: ids.get(CEES.email) })).toBe(200)
  for (const lang of LANGUAGES) {
    await page.goto(`${origin}${inLang('/handed-over', lang)}`)
    const words = lang === 'en' ? 'By Anna de Vries, Bram Jansen and Cees Bakker' : 'Door Anna de Vries, Bram Jansen en Cees Bakker'
    await expect(mention).toHaveText(words)
    await page.goto(`${origin}${inLang('/', lang)}`)
    await expect(tile).toHaveText(words)
  }
  // Cees, the creator now, takes Anna off the Tree: she is no longer named.
  const cees = await loggedIn(browser, CEES)
  expect(await send(cees.page, cees.cookie, 'DELETE', `/admin/api/trees/handed-over/collaborators/${ids.get(ANNA.email)}`)).toBe(200)
  await page.goto(`${origin}/handed-over`)
  await expect(mention).toHaveText('By Bram Jansen and Cees Bakker')
})

test('a collaborator removed is no longer named, and invited again stands in the place it first joined (39.1, 39.2)', async ({ browser }) => {
  const page = await browser.newPage()
  const mention = page.locator('header.page-chrome .authors')
  const anna = await loggedIn(browser, ANNA)
  const collaborator = `/admin/api/trees/rejoined/collaborators/${ids.get(BRAM.email)}`
  await page.goto(`${origin}/rejoined`)
  await expect(mention).toHaveText('By Anna de Vries, Bram Jansen and Cees Bakker')

  expect(await send(anna.page, anna.cookie, 'DELETE', collaborator)).toBe(200)
  await page.goto(`${origin}/rejoined?lang=nl`)
  await expect(mention).toHaveText('Door Anna de Vries en Cees Bakker')
  await page.goto(`${origin}/`)
  await expect(page.locator('a.tile[data-tree="rejoined"] .tile-authors')).toHaveText('By Anna de Vries and Cees Bakker')

  // Invited again, Bram is a collaborator after Cees (21.4), and named before him: where he first joined.
  expect(await send(anna.page, anna.cookie, 'PUT', collaborator)).toBe(200)
  await page.goto(`${origin}/rejoined`)
  await expect(mention).toHaveText('By Anna de Vries, Bram Jansen and Cees Bakker')
  await page.goto(`${origin}/`)
  await expect(page.locator('a.tile[data-tree="rejoined"] .tile-authors')).toHaveText('By Anna de Vries, Bram Jansen and Cees Bakker')
})

test('no element for a Tree whose only role holder is the administrator, none in the editor, none on the 404 and 403 pages (39.4, 39.7)', async ({ browser }) => {
  const page = await browser.newPage()
  const anywhere = page.locator('.authors-room, .authors, .tile-authors-room, .tile-authors')
  await page.goto(`${origin}/example-nobody`)
  await expect(page.locator('header.page-chrome .page-controls')).toBeVisible()
  await expect(anywhere).toHaveCount(0)
  await page.goto(`${origin}/`)
  await expect(page.locator('a.tile[data-tree="example-nobody"] .tile-languages')).toHaveText('ENNL')
  await expect(page.locator('a.tile[data-tree="example-nobody"] .tile-authors-room')).toHaveCount(0)

  // A hidden Tree is the 404 of 23.1, and its Author's name is on no public overview.
  expect((await page.goto(`${origin}/hidden-draft`))?.status()).toBe(404)
  await expect(anywhere).toHaveCount(0)
  for (const overview of ['/', '/?lang=nl']) {
    await page.goto(`${origin}${overview}`)
    expect(await page.content(), overview).not.toContain(DORA.name)
  }

  // The editor's bar is the editor's own interface (34.5); the 403 page names no Tree's Authors.
  const anna = await loggedIn(browser, ANNA)
  await anna.page.goto(`${origin}/admin/trees/example-three/start`)
  await expect(anna.page.locator('header.page-chrome')).toBeVisible()
  await expect(anna.page.locator('.authors-room, .authors')).toHaveCount(0)
  expect((await anna.page.goto(`${origin}/admin/trees/example-nobody/start`))?.status()).toBe(403)
  await expect(anna.page.locator('.authors-room, .authors')).toHaveCount(0)

  // Dora's own overview shows her hidden Tree, with the mention (39.3).
  const dora = await loggedIn(browser, DORA)
  await dora.page.goto(`${origin}/admin`)
  await expect(dora.page.locator('a.tile[data-tree="hidden-draft"] .tile-authors')).toHaveText('By Dora Kwast')
})

test('a screen reader reads a cut mention whole, and a mention not drawn not at all (39.4)', async ({ page }) => {
  const words = chrome('en').byAuthors(namesOf(AUTHORED['example-eight']!))
  const bar = page.locator('header.page-chrome')
  await page.setViewportSize({ width: 1280, height: 640 })
  await page.goto(`${origin}/example-eight`)
  const line = bar.locator('.authors')
  expect(await line.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
  expect(await bar.ariaSnapshot()).toContain(words)
  await expect(line).toHaveAttribute('title', words)

  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto(`${origin}/example-eight`)
  await expect(line).toBeHidden()
  expect(await bar.ariaSnapshot()).not.toContain('Anna de Vries')
})

test('without JavaScript the mention is the same markup, which the stylesheet alone draws, cuts and leaves out (39.4, 39.5)', async ({ browser }) => {
  const withScript = await browser.newPage()
  const without = await (await browser.newContext({ javaScriptEnabled: false })).newPage()
  for (const [width, height] of [
    [1280, 640],
    [560, 800],
    [360, 640],
  ] as const) {
    for (const lang of LANGUAGES) {
      for (const id of ['example-one', 'example-three', 'example-eight']) {
        const where = `${id} (${lang}) at ${width}x${height}`
        const url = `${origin}${inLang(`/${id}`, lang)}`
        await withScript.setViewportSize({ width, height })
        await without.setViewportSize({ width, height })
        const a = (await barAt(withScript, url)).line!
        const b = (await barAt(without, url)).line!
        expect(b.markup, `${where}: the markup`).toBe(a.markup)
        expect([b.drawn, b.clientWidth, b.scrollWidth], `${where}: drawn, and how wide`).toEqual([a.drawn, a.clientWidth, a.scrollWidth])
      }
      const a = await tilesAt(withScript, `${origin}${inLang('/', lang)}`)
      const b = await tilesAt(without, `${origin}${inLang('/', lang)}`)
      for (const id of Object.keys(AUTHORED)) {
        expect(b[id]!.line!.markup, `the tile of ${id} (${lang})`).toBe(a[id]!.line!.markup)
        expect(b[id]!.line!.scrollWidth, `the tile of ${id} (${lang})`).toBe(a[id]!.line!.scrollWidth)
      }
    }
  }
})

test("the mention speaks the chrome language, and carries its lang where the content speaks another (39.4, 39.5)", async ({ page }) => {
  // A Tree in German: the chrome falls back to English (3.1), and says so.
  await page.goto(`${origin}/german-one`)
  const line = page.locator('header.page-chrome .authors')
  await expect(line).toHaveText('By Anna de Vries')
  await expect(line).toHaveAttribute('lang', 'en')
  await page.goto(`${origin}/example-one?lang=nl`)
  await expect(line).toHaveText('Door Anna de Vries')
  await expect(line).not.toHaveAttribute('lang', /./)

  // On the overview the tile speaks the Tree's German, marked; its mention the page's language, marked too.
  for (const lang of LANGUAGES) {
    await page.goto(`${origin}${inLang('/', lang)}`)
    const tile = page.locator('a.tile[data-tree="german-one"]')
    await expect(tile).toHaveAttribute('lang', 'de')
    await expect(tile.locator('.tile-authors')).toHaveText(lang === 'en' ? 'By Anna de Vries' : 'Door Anna de Vries')
    await expect(tile.locator('.tile-authors')).toHaveAttribute('lang', lang)
    await expect(page.locator('a.tile[data-tree="example-one"] .tile-authors')).not.toHaveAttribute('lang', /./)
  }
})

test('the screenshots of 35.7: one Author and three on a Node page at 1280 x 640 and 360 x 640, both overviews, and eight that do not fit', async ({ browser }) => {
  await mkdir(SHOTS, { recursive: true })
  const visitor = await browser.newPage()
  const { page: creator } = await loggedIn(browser, ANNA)
  const shoot = async (page: Page, url: string, name: string, tile?: string): Promise<void> => {
    await page.goto(`${origin}${url}`)
    await page.evaluate(() => document.fonts.ready)
    // On a phone the overview's box shows a few tiles: the one asked for is scrolled into it.
    if (tile) await page.locator(`a.tile[data-tree="${tile}"]`).scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
  }
  for (const lang of LANGUAGES) {
    for (const [width, height] of [
      [1280, 640],
      [360, 640],
    ] as const) {
      const size = `${lang}-${width}x${height}`
      for (const page of [visitor, creator]) await page.setViewportSize({ width, height })
      await shoot(visitor, inLang('/example-one', lang), `one-author-${size}`)
      await shoot(visitor, inLang('/example-three', lang), `three-authors-${size}`)
      await shoot(visitor, inLang('/', lang), `overview-${size}`, 'example-one')
      await shoot(creator, inLang('/admin', lang), `creators-overview-${size}`, 'example-one')
    }
    await visitor.setViewportSize({ width: 1280, height: 640 })
    await shoot(visitor, inLang('/example-eight', lang), `eight-authors-${lang}-1280x640`)
  }
})
