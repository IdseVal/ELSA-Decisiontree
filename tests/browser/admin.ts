/**
 * The admin area's test helpers (docs/specs/application.md 35.1, 35.2): a data directory
 * with accounts in it, and logging in and out through the API; **[#233]** and the editor's one
 * `+`, which every spec that builds a step in the browser goes through (42.7).
 *
 * Not a spec file: the admin specs import it.
 */
import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, type Locator, type Page } from '@playwright/test'
import { hashPassword, type Account } from '../../src/store/accounts.ts'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../store/admin.ts'
import { dataDir, type StoreTree } from './serve.ts'

export { ADMIN_EMAIL, ADMIN_PASSWORD }

/** One account of a test data directory, besides the administrator the server creates. */
export interface TestAccount {
  /** **[#196]** The address it logs in with (35.1, 38.10); null as a converted store leaves an account (38.4). */
  email: string | null
  name: string
  password: string
  active?: boolean
}

/** **[#138]** A Tree of the directory with its roles (35.1): the creator and the collaborators by **[#196]** address. */
export interface RoledTree extends StoreTree {
  creator?: string
  collaborators?: string[]
}

/**
 * A fresh data directory holding `trees` and `accounts` (35.1): `accounts.json` with hashes
 * in the format of 20.2, so the store authenticates them as it would any. The administrator
 * is not in it: the server creates it from `ELSA_ADMIN_EMAIL` and `ELSA_ADMIN_PASSWORD` at start,
 * as a deployment's.
 * **[#138]** A Tree that names a `creator` or `collaborators` gets them written into its
 * `meta.json` by account id; one that names none is the administrator's.
 */
export async function buildDataDir({ trees, accounts }: { trees: RoledTree[]; accounts: TestAccount[] }): Promise<string> {
  const dir = await dataDir(trees)
  const records: Account[] = []
  for (const { email, name, password, active = true } of accounts) {
    records.push({
      id: randomBytes(16).toString('hex'),
      name,
      email,
      passwordHash: await hashPassword(password),
      active,
      administrator: false,
      createdAt: new Date().toISOString(),
    })
  }
  await writeFile(path.join(dir, 'accounts.json'), `${JSON.stringify(records, null, 2)}\n`)
  const idOf = (email: string): string => {
    const record = records.find((account) => account.email === email)
    if (!record) throw new Error(`no account "${email}" in the data directory`)
    return record.id
  }
  for (const { folder, id, creator, collaborators } of trees) {
    if (creator === undefined && collaborators === undefined) continue
    const metaFile = path.join(dir, 'trees', id ?? path.basename(folder), 'meta.json')
    const meta = JSON.parse(await readFile(metaFile, 'utf8')) as Record<string, unknown>
    if (creator !== undefined) meta.creator = idOf(creator)
    meta.collaborators = (collaborators ?? []).map(idOf)
    await writeFile(metaFile, `${JSON.stringify(meta, null, 2)}\n`)
  }
  return dir
}

/** The server's environment for a data directory built above (35.2, **[#196]** 38.10). */
export const ADMIN_ENV = { ELSA_ADMIN_EMAIL: ADMIN_EMAIL, ELSA_ADMIN_PASSWORD: ADMIN_PASSWORD }

/**
 * Logs `email` in through `page.request` and puts the session cookie into the page's browser
 * context, so the pages the test opens next carry it (35.2). The request comes from no page,
 * so it carries the `Origin` the CSRF check wants from a client that sends no
 * `Sec-Fetch-Site` (20.6) -- as `curl` must.
 *
 * Answers the status and the `Cookie` header the session travels in: Playwright's request
 * context keeps no `Secure` cookie on plain http, so an API call a test makes itself passes
 * the header (`me`), while the browser -- to which `127.0.0.1` is a secure context -- keeps
 * it as a deployment's readers' browsers do.
 */
export async function login(page: Page, origin: string, email: string, password: string): Promise<{ status: number; cookie: string }> {
  const response = await page.request.post(`${origin}/admin/api/login`, {
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    data: { email, password },
  })
  const setCookie = response.headersArray().find((header) => header.name.toLowerCase() === 'set-cookie')?.value ?? ''
  const token = /^elsa-admin-session=([^;]+)/.exec(setCookie)?.[1] ?? ''
  if (token) {
    await page.context().addCookies([
      { name: 'elsa-admin-session', value: token, domain: new URL(origin).hostname, path: '/admin', httpOnly: true, secure: true, sameSite: 'Strict' },
    ])
  }
  return { status: response.status(), cookie: `elsa-admin-session=${token}` }
}

/** `GET /admin/api/me` with the session `cookie`: the caller's status, 200 or 401. */
export async function me(page: Page, origin: string, cookie: string): Promise<number> {
  return (await page.request.get(`${origin}/admin/api/me`, { headers: { Cookie: cookie } })).status()
}

/** **[#233]** The one `+` in the Answer row of the page's centre (42.7 item 1). */
export const plusOf = (page: Page): Locator => page.locator('.tree-frame:not([aria-hidden]) .answers > .structure-add > .sheet-open')

/**
 * **[#233]** Opens the centre's `+` Sheet and types `words` into its one field, key by key, once the
 * field has the focus (42.7 item 2): with `ending`, after turning its switch `Tree ends here` on.
 * Answers the Sheet's form, the words typed and not yet confirmed.
 */
export async function typeInPlus(page: Page, words: string, ending = false): Promise<Locator> {
  await plusOf(page).click()
  const form = page.locator('.structure-form').filter({ visible: true })
  const field = form.getByRole('textbox')
  await expect(field).toBeFocused()
  if (ending) {
    await form.getByRole('switch').click()
    await field.focus()
  }
  await page.keyboard.type(words, { delay: 5 })
  await expect(field).toHaveValue(words)
  return form
}

/**
 * **[#233]** A next step of the centre with `words` on its button, through the `+` and Enter (42.7
 * item 3): answers once the editor has gone to the new step, with its id.
 */
export async function addNextStep(page: Page, words: string): Promise<string> {
  const from = new URL(page.url()).pathname
  await (await typeInPlus(page, words)).getByRole('textbox').press('Enter')
  await page.waitForURL((url) => url.pathname.startsWith(`${from}/`) && url.pathname.split('/').length === from.split('/').length + 1)
  return new URL(page.url()).pathname.split('/').pop() ?? ''
}
