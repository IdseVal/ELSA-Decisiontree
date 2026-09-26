/**
 * The login page, the account page and the accounts page, in a browser (docs/specs/
 * application.md 20, 24.2, 25; ADR-133-login-and-account-pages): the login form at every
 * admin address a visitor asks for, the one error for a wrong name and a wrong password,
 * the lock, the reload to the address asked for, the `<noscript>` sentence, the 403 page,
 * the two cards of the account page and the accounts page's create and deactivate --
 * against a fresh data directory on a server of this file's own. And what only a browser
 * can show: the cookie's flags as the server sent them, logout ending the session, a
 * cross-site form refused, and the server's log holding no password and no token.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login, me } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const PORT = BASE_PORT + 80
/** A second origin on the same host: same-site, cross-origin -- where a forged request would come from. */
const OTHER_PORT = BASE_PORT + 81
const LOG = path.join(RESULTS, 'login-server.log')
/** The screenshots 35.7 asks for: the tracked set under `ELSA_SHOTS=1`, the results folder otherwise. */
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-135') : path.join(RESULTS, 'shots')

const ANNA = { login: 'anna', name: 'Anna', password: 'annas first password' }
const CEES = { login: 'cees', name: 'Cees', password: 'cees first password' }
const LOCKED = { login: 'lotte', name: 'Lotte', password: 'lottes first password' }

let origin: string
let otherOrigin: string
/** Every password and token this file typed or received: none may reach the server's log. */
const secrets = new Set<string>([ADMIN_PASSWORD, ANNA.password, CEES.password, LOCKED.password])

test.beforeAll(async () => {
  const { mkdir } = await import('node:fs/promises')
  await mkdir(RESULTS, { recursive: true })
  const dir = await buildDataDir({ trees: [{ folder: path.join(repo, 'trees', 'ai-act-example') }], accounts: [ANNA, CEES, LOCKED] })
  origin = await serveStore(dir, PORT, ADMIN_ENV, LOG)
  otherOrigin = await serveStore(await buildDataDir({ trees: [], accounts: [] }), OTHER_PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

/** Signs in through the form on the page that is open, as a creator does. */
async function signIn(page: Page, name: string, password: string): Promise<void> {
  await page.getByLabel(/^(Name|Naam)$/).fill(name)
  await page.getByLabel(/^(Password|Wachtwoord)$/).fill(password)
  await page.getByRole('button', { name: /^(Sign in|Inloggen)$/ }).click()
}

test.describe('the login page at every admin address (24.2, 25.1)', () => {
  for (const address of ['/admin', '/admin/trees/ai-act-example/start', '/admin/accounts', '/admin/account']) {
    test(`${address} without a session is the login page, 200, noindex`, async ({ page }) => {
      const answer = await page.goto(`${origin}${address}`)

      expect(answer?.status()).toBe(200)
      expect(page.url()).toBe(`${origin}${address}`)
      const headers = await answer!.allHeaders()
      expect(headers['x-robots-tag']).toBe('noindex, nofollow')
      expect(headers['cache-control']).toBe('no-store')
      expect(headers['set-cookie']).toBeUndefined()
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
      await expect(page.getByLabel('Name')).toHaveAttribute('autocomplete', 'username')
      await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'current-password')
      await expect(page.getByText('Ask your administrator for an account or a new password.')).toBeVisible()
    })
  }

  test('in Dutch with ?lang=nl', async ({ page }) => {
    await page.goto(`${origin}/admin?lang=nl`)

    await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
    await expect(page.getByRole('heading', { name: 'Inloggen' })).toBeVisible()
  })

  test('a wrong name and a wrong password say the same thing; the name is kept, the password cleared', async ({ page }) => {
    await page.goto(`${origin}/admin`)
    const error = page.getByRole('main').getByRole('alert')

    await signIn(page, 'nobody-by-this-name', 'some password here')
    await expect(error).toHaveText('Wrong name or password.')
    const forUnknown = await error.textContent()
    await expect(page.getByLabel('Name')).toHaveValue('nobody-by-this-name')
    await expect(page.getByLabel('Password')).toHaveValue('')

    await signIn(page, ANNA.login, 'not annas password')
    await expect(error).toHaveText(forUnknown!)
    await expect(page.getByLabel('Password')).toHaveValue('')
  })

  test('five failures on one name lock it: loginLocked, even for the right password', async ({ page }) => {
    await page.goto(`${origin}/admin`)
    for (let failure = 1; failure <= 5; failure += 1) {
      await signIn(page, LOCKED.login, `wrong password ${failure}`)
      await expect(page.getByRole('main').getByRole('alert')).toHaveText('Wrong name or password.')
      // The line is re-set on each answer: wait until this answer's was drawn.
      await expect(page.getByLabel('Password')).toHaveValue('')
    }

    await signIn(page, LOCKED.login, LOCKED.password)

    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Too many attempts. Try again in a few minutes.')
  })

  test('the right password reloads the address asked for, and the cookie carries every flag (20.4)', async ({ page, context }) => {
    await page.goto(`${origin}/admin/account`)
    const answered = page.waitForResponse((response) => response.url() === `${origin}/admin/api/login`)

    await signIn(page, ANNA.login, ANNA.password)

    const response = await answered
    expect(response.status()).toBe(204)
    const setCookie = (await response.allHeaders())['set-cookie']!
    expect(setCookie).toMatch(/^elsa-admin-session=[A-Za-z0-9_-]{43}; HttpOnly; Secure; SameSite=Strict; Path=\/admin; Max-Age=1209600$/)
    secrets.add(setCookie.split(';')[0]!.split('=')[1]!)
    await expect(page.getByRole('heading', { name: 'Your name' })).toBeVisible()
    expect(page.url()).toBe(`${origin}/admin/account`)
    const [cookie] = await context.cookies()
    expect(cookie).toMatchObject({ name: 'elsa-admin-session', path: '/admin', httpOnly: true, secure: true, sameSite: 'Strict' })
  })

  test('without JavaScript the page says the editor needs it, and its fields cannot be used', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.goto(`${origin}/admin`)

    // Read through the page: Playwright's own text matching skips a `noscript`'s content,
    // which a browser without script lays out -- as `innerText` shows.
    expect(await page.locator('main').evaluate((main: HTMLElement) => main.innerText)).toContain('The editor needs JavaScript. Switch it on to sign in and edit.')
    await expect(page.getByLabel('Name')).toBeDisabled()
    await context.close()
  })
})

test.describe('with a session', () => {
  test('logout ends the session: the old cookie opens nothing, and /admin is the login page again', async ({ page, context }) => {
    await page.goto(`${origin}/admin`)
    await signIn(page, ANNA.login, ANNA.password)
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
    const [cookie] = await context.cookies()
    secrets.add(cookie!.value)
    const answered = page.waitForResponse((response) => response.url() === `${origin}/admin/api/logout`)

    await page.getByRole('button', { name: 'Log out' }).click()

    const response = await answered
    expect(response.status()).toBe(204)
    expect((await response.allHeaders())['set-cookie']).toBe('elsa-admin-session=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    expect(await context.cookies()).toEqual([])
    // The token itself is dead on the server, not only gone from the browser.
    const replayed = await page.request.get(`${origin}/admin/api/me`, { headers: { Cookie: `elsa-admin-session=${cookie!.value}` } })
    expect(replayed.status()).toBe(401)
  })

  test('the API answers 401 without a session and the caller with one', async ({ page }) => {
    expect((await page.request.get(`${origin}/admin/api/me`)).status()).toBe(401)
    const { status, cookie } = await login(page, origin, CEES.login, CEES.password)
    expect(status).toBe(204)
    const caller = await page.request.get(`${origin}/admin/api/me`, { headers: { Cookie: cookie } })
    expect(await caller.json()).toEqual({ id: expect.stringMatching(/^[0-9a-f]{32}$/), name: 'Cees', login: 'cees', administrator: false })
  })

  test('the accounts page is the 403 page for an account that is not the administrator (24.2)', async ({ page }) => {
    await login(page, origin, CEES.login, CEES.password)

    const answer = await page.goto(`${origin}/admin/accounts`)

    expect(answer?.status()).toBe(403)
    await expect(page.getByRole('heading', { name: 'Not yours to open' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'All decision trees' })).toHaveAttribute('href', '/admin')
    // The chrome bar offers no accounts link to it either.
    await page.goto(`${origin}/admin`)
    await expect(page.getByRole('link', { name: 'Accounts' })).toHaveCount(0)
  })

  test('the account page changes the name, and the password only with the current one', async ({ page, browser }) => {
    await page.goto(`${origin}/admin/account`)
    await signIn(page, CEES.login, CEES.password)
    const nameCard = page.locator('form', { has: page.getByRole('heading', { name: 'Your name' }) })
    const passwordCard = page.locator('form', { has: page.getByRole('heading', { name: 'Change password' }) })

    await nameCard.getByLabel('Your name').fill('Cees van Dam')
    await expect(nameCard.getByText('12 / 80')).toBeVisible()
    await nameCard.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('link', { name: 'Cees van Dam' })).toBeVisible()

    // A second session of the same account, which a password change must end (20.4).
    const other = await browser.newContext()
    const otherPage = await other.newPage()
    const second = await login(otherPage, origin, CEES.login, CEES.password)
    expect(await me(otherPage, origin, second.cookie)).toBe(200)

    await passwordCard.getByLabel('Current password').fill(CEES.password)
    await passwordCard.getByLabel('New password', { exact: true }).fill('cees second password')
    await passwordCard.getByLabel('New password again').fill('cees other password')
    await passwordCard.getByRole('button', { name: 'Save' }).click()
    await expect(passwordCard.getByRole('alert')).toHaveText('The two new passwords differ.')

    await passwordCard.getByLabel('Current password').fill('not the current one')
    await passwordCard.getByLabel('New password again').fill('cees second password')
    await passwordCard.getByRole('button', { name: 'Save' }).click()
    await expect(passwordCard.getByRole('alert')).toHaveText('The current password is wrong.')

    await passwordCard.getByLabel('Current password').fill(CEES.password)
    await passwordCard.getByLabel('New password', { exact: true }).fill('cees second password')
    await passwordCard.getByLabel('New password again').fill('cees second password')
    await passwordCard.getByRole('button', { name: 'Save' }).click()
    await expect(passwordCard.getByLabel('Current password')).toHaveValue('')
    await expect(passwordCard.getByRole('alert')).toHaveCount(0)
    secrets.add('cees second password')

    const [kept] = await page.context().cookies()
    expect(await me(page, origin, `elsa-admin-session=${kept!.value}`)).toBe(200)
    expect(await me(otherPage, origin, second.cookie)).toBe(401)
    expect((await login(otherPage, origin, CEES.login, 'cees second password')).status).toBe(204)
    await other.close()
  })

  test('the accounts page creates an account and deactivates it, which ends its session (25.3)', async ({ page, browser }) => {
    await page.goto(`${origin}/admin/accounts`)
    await signIn(page, 'admin', ADMIN_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
    // The administrator's own row has no actions (25.3).
    const adminRow = page.locator('.admin-row[data-login="admin"]')
    await expect(adminRow).toContainText('Administrator')
    await expect(adminRow.getByRole('button')).toHaveCount(0)

    const sheet = page.locator('details.account-sheet').first()
    await sheet.locator('summary', { hasText: 'New account' }).click()
    await sheet.getByLabel('Display name').fill('Bram')
    await sheet.getByLabel('Name', { exact: true }).fill('bram')
    await sheet.getByLabel('Password', { exact: true }).fill('too short')
    await sheet.getByRole('button', { name: 'Create' }).click()
    await expect(sheet.getByRole('alert')).toHaveText('A password is 12 to 256 characters.')
    await sheet.getByLabel('Name', { exact: true }).fill('anna')
    await sheet.getByLabel('Password', { exact: true }).fill('brams first password')
    await sheet.getByRole('button', { name: 'Create' }).click()
    await expect(sheet.getByRole('alert')).toHaveText('This name is taken.')
    await sheet.getByLabel('Name', { exact: true }).fill('bram')
    await sheet.getByRole('button', { name: 'Create' }).click()
    secrets.add('brams first password')

    const bramRow = page.locator('.admin-row[data-login="bram"]')
    await expect(bramRow).toContainText('Bram')
    await expect(bramRow).toContainText('Active')

    const bram = await browser.newContext()
    const bramPage = await bram.newPage()
    const bramSession = await login(bramPage, origin, 'bram', 'brams first password')
    expect(bramSession.status).toBe(204)

    await bramRow.getByRole('button', { name: 'Deactivate' }).click()
    await expect(page.locator('.admin-row[data-login="bram"]')).toContainText('Deactivated')
    expect(await me(bramPage, origin, bramSession.cookie)).toBe(401)
    expect((await login(bramPage, origin, 'bram', 'brams first password')).status).toBe(401)

    await page.locator('.admin-row[data-login="bram"]').getByRole('button', { name: 'Reactivate' }).click()
    await expect(page.locator('.admin-row[data-login="bram"]')).toContainText('Active')
    expect((await login(bramPage, origin, 'bram', 'brams first password')).status).toBe(204)
    await bram.close()
  })
})

test.describe('CSRF (20.6)', () => {
  test('a form posted from another origin is refused, and sets no cookie', async ({ page, context }) => {
    // The classic JSON forgery: a text/plain form whose one field spells a JSON body. From
    // another origin of the same host, which a browser marks same-site, not same-origin.
    await page.goto(`${otherOrigin}/`)
    await page.setContent(
      `<form method="post" enctype="text/plain" action="${origin}/admin/api/login">` +
        `<input name='{"login":"admin","password":"${ADMIN_PASSWORD}","x":"' value='"}'></form>`,
    )
    const answered = page.waitForResponse((response) => response.url() === `${origin}/admin/api/login`)

    await page.locator('form').evaluate((form: HTMLFormElement) => form.submit())

    const response = await answered
    expect(response.status()).toBe(403)
    expect((await response.allHeaders())['set-cookie']).toBeUndefined()
    expect(await context.cookies()).toEqual([])
  })

  test('a JSON write from another origin is refused, even with a session in the browser', async ({ page }) => {
    const { cookie } = await login(page, origin, 'admin', ADMIN_PASSWORD)
    await page.goto(`${otherOrigin}/`)

    const status = await page.evaluate(async (target) => {
      try {
        const response = await fetch(`${target}/admin/api/accounts`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Mallory', login: 'mallory', password: 'mallorys password' }),
        })
        return response.status
      } catch {
        // No CORS answer: the preflight is refused, and the request never leaves.
        return 0
      }
    }, origin)

    expect([0, 403]).toContain(status)
    const names = (await (await page.request.get(`${origin}/admin/api/accounts`, { headers: { Cookie: cookie } })).json()) as { login: string }[]
    expect(names.map((account) => account.login)).not.toContain('mallory')
  })
})

test('the four pages at 1280 x 640, for the pull request (35.7)', async ({ browser }) => {
  const shoot = async (page: Page, name: string): Promise<void> => {
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
  }
  const visitor = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  await visitor.goto(`${origin}/admin`)
  await signIn(visitor, ANNA.login, 'not annas password')
  await expect(visitor.getByRole('main').getByRole('alert')).toHaveText('Wrong name or password.')
  await shoot(visitor, 'login-refused')

  const anna = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  await login(anna, origin, ANNA.login, ANNA.password)
  await anna.goto(`${origin}/admin/account`)
  await shoot(anna, 'account')
  expect((await anna.goto(`${origin}/admin/accounts?lang=nl`))?.status()).toBe(403)
  await shoot(anna, 'forbidden-nl')

  const admin = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  await login(admin, origin, 'admin', ADMIN_PASSWORD)
  await admin.goto(`${origin}/admin/accounts`)
  await shoot(admin, 'accounts')
  await admin.locator('details.account-sheet summary', { hasText: 'New account' }).click()
  await shoot(admin, 'accounts-new')
})

test('the server logged no password and no session token (20.8)', async () => {
  // Last in the file: every login above has run and written its lines.
  const log = await readFile(LOG, 'utf8')

  expect(log).toContain('logged in')
  const found = [...secrets].filter((secret) => log.includes(secret))
  expect(found, 'secrets in the server log').toEqual([])
  // The names typed at the login field are not in it either: the log speaks of ids.
  expect(log).not.toContain('nobody-by-this-name')
})
