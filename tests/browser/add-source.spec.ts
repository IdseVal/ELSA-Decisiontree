/**
 * **[#242]** The `+ addSource` Sheet (docs/specs/application.md 28.1, amended by #242; the
 * owner's finding in #241): a link typed without `https://` is added with it in front, the
 * Link field shows `placeholderUrl`, the button looks disabled while it cannot send, and text
 * that is not a link gets a hint line the field names by `aria-describedby`.
 *
 * On the main Bubble and in a side bubble's Overlay, in English and in Dutch, at 1280 x 640, and
 * below the guarantee, where the Sources stand in their collapsed Sheet (28.6), at 720 x 800 and
 * at a phone's 400 x 700, where the Sheet's labels stand above their fields.
 * Each test on a Tree of its own; the stored URL read back through `GET /admin/api/trees/<t>/
 * nodes/<id>`. The screenshots the issue asks for go to `docs/screenshots/issue-242/` under
 * `ELSA_SHOTS=1`, the results folder otherwise (35.7).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type APIResponse, type Locator, type Page } from '@playwright/test'
import type { DraftNode } from '../../src/tree/types.ts'
import { ADMIN_ENV, buildDataDir, login } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-242') : path.join(RESULTS, 'shots')
const PORT = BASE_PORT + 242

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }

/** The chrome words this Sheet says, per language (src/chrome.ts). */
const WORDS = {
  en: { addSource: 'Add a source', hint: 'Type a web address, such as https://eur-lex.europa.eu' },
  nl: { addSource: 'Bron toevoegen', hint: 'Typ een webadres, zoals https://eur-lex.europa.eu' },
} as const

let origin: string

test.beforeAll(async () => {
  await mkdir(SHOTS, { recursive: true })
  const dir = await buildDataDir({ trees: [], accounts: [ANNA] })
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

async function nodeOf(page: Page, cookie: string, tree: string, id: string): Promise<DraftNode> {
  const response = await api(page, cookie, 'GET', `/trees/${tree}/nodes/${id}`)
  expect(response.status(), `GET ${id}`).toBe(200)
  return ((await response.json()) as { node: DraftNode }).node
}

/** Resolves once the page's script listens: every Sheet draws its backdrop in the render after hydration (`Sheet`). */
async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('details.sheet > .sheet-backdrop').first()).toBeAttached()
}

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
}

const opacityOf = (button: Locator): Promise<string> => button.evaluate((element) => getComputedStyle(element).opacity)

for (const where of ['main', 'side'] as const) {
  for (const lang of ['en', 'nl'] as const) {
    for (const [width, height] of [
      [1280, 640],
      [720, 800],
      [400, 700],
    ] as const) {
      // Below 792 pixels of width the Sources collapse to their Sheet (10.5, step 6; 28.6).
      const collapsed = width < 792
      test(`on the ${where === 'main' ? 'main Bubble' : 'side bubble'}, ${lang}, ${width}x${height}${collapsed ? ' (the collapsed Sources Sheet)' : ''}: www.example.org is added as https://www.example.org; the Sheet says what it needs (28.1)`, async ({ browser }) => {
        const page = await (await browser.newContext({ viewport: { width, height } })).newPage()
        const { status, cookie } = await login(page, origin, ANNA.email, ANNA.password)
        expect(status).toBe(204)
        const tree = `${where}-${lang}-${width}`
        expect((await api(page, cookie, 'POST', '/trees', { id: tree, languages: ['en', 'nl'], title: { en: 'Sources', nl: 'Bronnen' } })).status()).toBe(201)
        let nodeId = 'start'
        let address = `${origin}/admin/trees/${tree}/start`
        if (where === 'side') {
          expect((await api(page, cookie, 'PATCH', `/trees/${tree}/nodes/start`, { op: 'add-option', title: {} })).status()).toBe(200)
          nodeId = (await nodeOf(page, cookie, tree, 'start')).options[0]!.target
          address += `/${nodeId}`
        }
        await page.goto(lang === 'nl' ? `${address}?lang=nl` : address)
        await hydrated(page)

        // The side bubble's Overlay is open at its address (10.9); its Sources are inside it.
        const scope = where === 'side' ? page.locator('details.overlay[open] > .sheet-panel') : page.locator('body')
        if (collapsed) {
          const sources = scope.locator('.sources-sheet > .sheet-open').filter({ visible: true })
          await expect(sources).toHaveCount(1)
          await sources.click()
        }
        const control = scope.locator('.source-sheet--add > .sheet-open').filter({ visible: true })
        await expect(control).toHaveText(`+ ${WORDS[lang].addSource}`)
        await control.click()
        const form = scope.locator('.source-editor--add').filter({ visible: true })
        const url = form.locator('.editor-url')
        const add = form.locator('button[type="submit"]')
        await expect(url).toBeFocused()
        await expect(url).toHaveAttribute('placeholder', 'https://…')

        // Empty: disabled, and drawn so -- dimmer than the enabled button, no pointer.
        await expect(add).toBeDisabled()
        const disabled = await opacityOf(add)
        expect(await add.evaluate((element) => getComputedStyle(element).cursor)).toBe('default')
        await url.fill('https://example.org/a')
        await expect(add).toBeEnabled()
        const enabled = await opacityOf(add)
        expect(disabled, `disabled ${disabled}, enabled ${enabled}`).not.toBe(enabled)
        await expect(form.locator('.source-url-hint')).toHaveCount(0)

        // Not a link: the line under the field says what it needs, and the field names it.
        await url.fill('not a link')
        await expect(add).toBeDisabled()
        const hint = form.locator('.source-url-hint')
        await expect(hint).toBeVisible()
        await expect(hint).toHaveText(WORDS[lang].hint)
        const hintId = await hint.getAttribute('id')
        expect(hintId).toBeTruthy()
        await expect(url).toHaveAttribute('aria-describedby', hintId!)
        await expect(url).toHaveAccessibleDescription(WORDS[lang].hint)
        // Under the field it names: its text starts where the field does, beside the label or under it.
        const hintStart = await hint.evaluate((element) => element.getBoundingClientRect().left + parseFloat(getComputedStyle(element).paddingInlineStart))
        expect(Math.abs(hintStart - (await url.boundingBox())!.x), `hint ${hintStart}`).toBeLessThan(1)
        await expect(hint).toHaveCSS('text-align', 'start')
        if (where === 'main' && lang === 'en' && width === 1280) await shoot(page, 'add-source-not-a-link')

        // A link without its scheme: sent with `https://` in front, and the Sheet closes.
        await url.fill('www.example.org')
        await expect(add).toBeEnabled()
        await expect(form.locator('.source-url-hint')).toHaveCount(0)
        await expect(url).not.toHaveAttribute('aria-describedby')
        if (where === 'main' && lang === 'en' && width === 1280) await shoot(page, 'add-source-www')
        await add.click()
        await expect(scope.locator('.source-editor--add').filter({ visible: true })).toHaveCount(0)
        await expect.poll(async () => (await nodeOf(page, cookie, tree, nodeId)).sources).toEqual([{ kind: 'legal', label: { en: '', nl: '' }, url: 'https://www.example.org' }])
        if (where === 'side') await expect(scope).toBeVisible()

        // The Source's own URL field shows the link as stored (28.1).
        const label = scope.locator(`[data-field="${nodeId} sources[0].label.${lang}"] textarea`).filter({ visible: true })
        await expect(label).toBeFocused()
        await scope.locator('.source-sheet:not(.source-sheet--add) > .sheet-open').filter({ visible: true }).click()
        await expect(scope.locator(`[data-field="${nodeId} sources[0].url"] textarea`).filter({ visible: true })).toHaveValue('https://www.example.org')
      })
    }
  }
}
