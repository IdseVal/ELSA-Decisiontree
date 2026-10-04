/**
 * The login page, the account page and the accounts page, in a browser (docs/specs/
 * application.md 20, 24.2, 25; ADR-133-login-and-account-pages): the login form at every
 * admin address a visitor asks for, the one error for a wrong address and a wrong password,
 * the lock, the reload to the address asked for, the `<noscript>` sentence, the 403 page,
 * the two cards of the account page and the accounts page's create and deactivate --
 * against a fresh data directory on a server of this file's own. And what only a browser
 * can show: the cookie's flags as the server sent them, logout ending the session, a
 * cross-site form refused, and the server's log holding no password and no token.
 *
 * **[#196]** Every login is by e-mail address (38.10): through the page in `en` and `nl`, the
 * old user names -- `admin` included -- refused with the one line, the lock per address typed,
 * also on an address no account holds; the account page's address line, the accounts page's
 * address column, `noEmail` and `setEmail`; and no address in the server's log (38.8).
 */
import { createHash, randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_ENV, ADMIN_PASSWORD, buildDataDir, login, me } from './admin.ts'
import { BASE_PORT, serveStore, stopServers } from './serve.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const RESULTS = path.join(repo, 'tests', 'browser', '.results')
const PORT = BASE_PORT + 80
/** A second origin on the same host: same-site, cross-origin -- where a forged request would come from. */
const OTHER_PORT = BASE_PORT + 81
const LOG = path.join(RESULTS, 'login-server.log')
/** The screenshots **[#196]**'s pull request asks for: the tracked set under `ELSA_SHOTS=1`, the results folder otherwise. */
const SHOTS = process.env.ELSA_SHOTS === '1' ? path.join(repo, 'docs', 'screenshots', 'issue-196') : path.join(RESULTS, 'shots')

const ANNA = { email: 'anna@example.org', name: 'Anna', password: 'annas first password' }
const CEES = { email: 'cees@example.org', name: 'Cees', password: 'cees first password' }
const LOCKED = { email: 'lotte@example.org', name: 'Lotte', password: 'lottes first password' }
/** **[#196]** An account a converted store left without an address (38.4), holding a session from before. */
const HENK = { email: null, name: 'Henk', password: 'henks first password' }

let origin: string
let otherOrigin: string
/** **[#196]** The token of the session Henk held before the first start of the release (38.4). */
const henkToken = randomBytes(32).toString('base64url')
/** Every password and token this file typed or received: none may reach the server's log. */
const secrets = new Set<string>([ADMIN_PASSWORD, ANNA.password, CEES.password, LOCKED.password, HENK.password, henkToken])
/** **[#196]** Every address this file typed or an account held: none may reach it either (38.8). */
const addresses = new Set<string>([ADMIN_EMAIL, ANNA.email, CEES.email, LOCKED.email])

test.beforeAll(async () => {
  const { mkdir } = await import('node:fs/promises')
  await mkdir(RESULTS, { recursive: true })
  const dir = await buildDataDir({ trees: [{ folder: path.join(repo, 'trees', 'ai-act-example') }], accounts: [ANNA, CEES, LOCKED, HENK] })
  // sessions.json as the release before #196 wrote it for a login of Henk's: the token's hash and his account's id (20.4).
  const henk = (JSON.parse(await readFile(path.join(dir, 'accounts.json'), 'utf8')) as { id: string; name: string }[]).find(({ name }) => name === HENK.name)!
  const now = Date.now()
  const record = {
    tokenHash: createHash('sha256').update(henkToken).digest('base64url'),
    accountId: henk.id,
    createdAt: new Date(now).toISOString(),
    lastSeen: new Date(now).toISOString(),
    expiresAt: new Date(now + 24 * 3600_000).toISOString(),
  }
  await writeFile(path.join(dir, 'sessions.json'), `${JSON.stringify([record], null, 2)}\n`)
  origin = await serveStore(dir, PORT, ADMIN_ENV, LOG)
  otherOrigin = await serveStore(await buildDataDir({ trees: [], accounts: [] }), OTHER_PORT, ADMIN_ENV)
})

test.afterAll(async () => {
  await stopServers()
})

/** Signs in through the form on the page that is open, as a creator does. */
async function signIn(page: Page, email: string, password: string): Promise<void> {
  if (email.includes('@')) addresses.add(email.trim().toLowerCase())
  await page.getByLabel(/^(E-mail address|E-mailadres)$/).fill(email)
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
      // **[#196]** An address field, the browser's own check left to the server's one line (38.5).
      const field = page.getByLabel('E-mail address')
      await expect(field).toHaveAttribute('type', 'email')
      await expect(field).toHaveAttribute('autocomplete', 'username')
      await expect(field).toHaveAttribute('autocapitalize', 'none')
      await expect(field).toHaveAttribute('spellcheck', 'false')
      await expect(page.locator('main form')).toHaveAttribute('novalidate', '')
      await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'current-password')
      await expect(page.getByText('Ask your administrator for an account or a new password.')).toBeVisible()
    })
  }

  test('in Dutch with ?lang=nl, and an address logs in through it', async ({ page }) => {
    await page.goto(`${origin}/admin/account?lang=nl`)

    await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
    await expect(page.getByRole('heading', { name: 'Inloggen' })).toBeVisible()
    // **[#196]** In any case, with white space around it: the address the lookup reads (38.1).
    await signIn(page, ' Cees@Example.ORG ', CEES.password)
    await expect(page.getByRole('heading', { name: 'Uw naam' })).toBeVisible()
    expect(page.url()).toBe(`${origin}/admin/account?lang=nl`)
  })

  test('a wrong password and an unknown address say the same thing; the address is kept, the password cleared', async ({ page }) => {
    await page.goto(`${origin}/admin`)
    const error = page.getByRole('main').getByRole('alert')

    await signIn(page, 'nobody@example.org', 'some password here')
    await expect(error).toHaveText('Wrong e-mail address or password.')
    const forUnknown = await error.textContent()
    await expect(page.getByLabel('E-mail address')).toHaveValue('nobody@example.org')
    await expect(page.getByLabel('Password')).toHaveValue('')

    await signIn(page, ANNA.email, 'not annas password')
    await expect(error).toHaveText(forUnknown!)
    await expect(page.getByLabel('E-mail address')).toHaveValue(ANNA.email)
    await expect(page.getByLabel('Password')).toHaveValue('')
  })

  test('**[#196]** the old user names are refused with the same line, the administrator\'s `admin` included', async ({ page }) => {
    await page.goto(`${origin}/admin`)
    const error = page.getByRole('main').getByRole('alert')

    for (const [name, password] of [['admin', ADMIN_PASSWORD], ['anna', ANNA.password]] as const) {
      await signIn(page, name, password)
      await expect(error).toHaveText('Wrong e-mail address or password.')
      // The line is re-set on each answer: wait until this answer's was drawn.
      await expect(page.getByLabel('Password')).toHaveValue('')
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    }
  })

  test('five failures on one address lock it: loginLocked, even for the right password', async ({ page }) => {
    await page.goto(`${origin}/admin`)
    for (let failure = 1; failure <= 5; failure += 1) {
      // **[#196]** Each in another spelling of the one address: the lock is on what the lookup reads (38.7).
      await signIn(page, failure % 2 ? LOCKED.email : ` ${LOCKED.email.toUpperCase()} `, `wrong password ${failure}`)
      await expect(page.getByRole('main').getByRole('alert')).toHaveText('Wrong e-mail address or password.')
      await expect(page.getByLabel('Password')).toHaveValue('')
    }

    await signIn(page, LOCKED.email, LOCKED.password)

    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Too many attempts. Try again in a few minutes.')
  })

  test('**[#196]** five failures on an address no account holds lock it as well, so a lock says nothing of who has an account', async ({ page }) => {
    await page.goto(`${origin}/admin`)
    for (let failure = 1; failure <= 5; failure += 1) {
      await signIn(page, 'no-account-here@example.org', `wrong password ${failure}`)
      await expect(page.getByRole('main').getByRole('alert')).toHaveText('Wrong e-mail address or password.')
      await expect(page.getByLabel('Password')).toHaveValue('')
    }

    await signIn(page, 'no-account-here@example.org', 'wrong password 6')

    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Too many attempts. Try again in a few minutes.')
  })

  test('the right password reloads the address asked for, and behind HTTPS the cookie carries every flag (20.4)', async ({ page, context }) => {
    // **[#162]** What a TLS proxy in front says; the server under test is plain HTTP otherwise.
    await page.route(`${origin}/admin/api/login`, (route) => route.continue({ headers: { ...route.request().headers(), 'x-forwarded-proto': 'https' } }))
    await page.goto(`${origin}/admin/account`)
    const answered = page.waitForResponse((response) => response.url() === `${origin}/admin/api/login`)

    await signIn(page, ANNA.email, ANNA.password)

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

  test('[#162] a login whose cookie the browser drops says why, rather than showing the form again in silence', async ({ page, context }) => {
    // What a browser does when it blocks cookies, or is sent a Secure one at a plain-http address: the 204 arrives, the cookie does not stay.
    await page.route(`${origin}/admin/api/login`, async (route) => {
      const response = await route.fetch()
      // `route.fetch` shares the context's cookie jar, so the cookie it stored is dropped from there too.
      await context.clearCookies()
      const headers = { ...response.headers() }
      delete headers['set-cookie']
      await route.fulfill({ response, headers })
    })
    await page.goto(`${origin}/admin`)

    await signIn(page, CEES.email, CEES.password)

    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Your e-mail address and password are right, but this browser did not keep the session. Allow cookies for this site, or open it at the address it is published at.',
    )
    await expect(page.getByLabel('E-mail address')).toHaveValue(CEES.email)
    await expect(page.getByLabel('Password')).toHaveValue('')
    expect(await context.cookies()).toEqual([])
  })

  test('[#162] over plain HTTP at an address that is not localhost the login keeps a session, without Secure', async ({ playwright }) => {
    // The owner's demo: another machine, plain http. The name resolves to this server, so the
    // page is the same one, at an address a browser keeps no Secure cookie from.
    const browser = await playwright.chromium.launch({ args: ['--host-resolver-rules=MAP elsa-plain.test 127.0.0.1'] })
    try {
      const page = await browser.newPage()
      const plain = origin.replace('127.0.0.1', 'elsa-plain.test')
      await page.goto(`${plain}/admin/account`)
      expect(await page.evaluate(() => window.isSecureContext)).toBe(false)
      const answered = page.waitForResponse((response) => response.url() === `${plain}/admin/api/login`)

      await signIn(page, CEES.email, CEES.password)

      const setCookie = (await (await answered).allHeaders())['set-cookie']!
      expect(setCookie).toMatch(/^elsa-admin-session=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Strict; Path=\/admin; Max-Age=1209600$/)
      secrets.add(setCookie.split(';')[0]!.split('=')[1]!)
      await expect(page.getByRole('heading', { name: 'Your name' })).toBeVisible()
      expect(page.url()).toBe(`${plain}/admin/account`)
      const [cookie] = await page.context().cookies()
      expect(cookie).toMatchObject({ name: 'elsa-admin-session', domain: 'elsa-plain.test', path: '/admin', httpOnly: true, secure: false, sameSite: 'Strict' })
    } finally {
      await browser.close()
    }
  })

  test('without JavaScript the page says the editor needs it, and its fields cannot be used', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.goto(`${origin}/admin`)

    // Read through the page: Playwright's own text matching skips a `noscript`'s content,
    // which a browser without script lays out -- as `innerText` shows.
    expect(await page.locator('main').evaluate((main: HTMLElement) => main.innerText)).toContain('The editor needs JavaScript. Switch it on to sign in and edit.')
    await expect(page.getByLabel('E-mail address')).toBeDisabled()
    await context.close()
  })
})

test.describe('with a session', () => {
  test('logout ends the session: the old cookie opens nothing, and /admin is the login page again', async ({ page, context }) => {
    await page.goto(`${origin}/admin`)
    await signIn(page, ANNA.email, ANNA.password)
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
    const [cookie] = await context.cookies()
    secrets.add(cookie!.value)
    const answered = page.waitForResponse((response) => response.url() === `${origin}/admin/api/logout`)

    await page.getByRole('button', { name: 'Log out' }).click()

    const response = await answered
    expect(response.status()).toBe(204)
    // The server under test is plain HTTP, so the clearing cookie is not Secure either (#162).
    expect((await response.allHeaders())['set-cookie']).toBe('elsa-admin-session=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    expect(await context.cookies()).toEqual([])
    // The token itself is dead on the server, not only gone from the browser.
    const replayed = await page.request.get(`${origin}/admin/api/me`, { headers: { Cookie: `elsa-admin-session=${cookie!.value}` } })
    expect(replayed.status()).toBe(401)
  })

  test('without JavaScript no account form can be submitted, so no password reaches an address (20.8, 24.2)', async ({ browser }) => {
    // What a submit before the script has loaded would also meet: the server's markup.
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)

    for (const address of ['/admin/account', '/admin/accounts']) {
      await page.goto(`${origin}${address}`)
      expect(await page.locator('main').evaluate((main: HTMLElement) => main.innerText), address).toContain('The editor needs JavaScript.')
      const forms = page.locator('form')
      expect(await forms.count(), address).toBeGreaterThan(0)
      for (const form of await forms.all()) {
        // Were a form submitted anyway, the browser's own submit is a POST, never a query string.
        await expect(form).toHaveAttribute('method', 'post')
        await expect(form.locator('fieldset')).toHaveAttribute('disabled', '')
        for (const field of await form.locator('input:not([hidden])').all()) await expect(field).toBeDisabled()
      }
      const submit = page.locator('form button[type="submit"]:visible').first()
      if (await submit.count()) await submit.click({ force: true })
      expect(new URL(page.url()).search, address).toBe('')
    }
    await context.close()
  })

  test('the API answers 401 without a session and the caller with one, its own address included', async ({ page }) => {
    expect((await page.request.get(`${origin}/admin/api/me`)).status()).toBe(401)
    const { status, cookie } = await login(page, origin, CEES.email, CEES.password)
    expect(status).toBe(204)
    const caller = await page.request.get(`${origin}/admin/api/me`, { headers: { Cookie: cookie } })
    expect(await caller.json()).toEqual({ id: expect.stringMatching(/^[0-9a-f]{32}$/), name: 'Cees', email: CEES.email, administrator: false })
  })

  test('the accounts page is the 403 page for an account that is not the administrator (24.2)', async ({ page }) => {
    await login(page, origin, CEES.email, CEES.password)

    const answer = await page.goto(`${origin}/admin/accounts`)

    expect(answer?.status()).toBe(403)
    await expect(page.getByRole('heading', { name: 'Not yours to open' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'All decision trees' })).toHaveAttribute('href', '/admin')
    // The chrome bar offers no accounts link to it either.
    await page.goto(`${origin}/admin`)
    await expect(page.getByRole('link', { name: 'Accounts' })).toHaveCount(0)
  })

  test("**[#196]** the account page says which address the account signs in with, and only the administrator's says no more (38.5)", async ({ browser }) => {
    const anna = await (await browser.newContext()).newPage()
    await login(anna, origin, ANNA.email, ANNA.password)
    await anna.goto(`${origin}/admin/account`)
    const card = anna.locator('form', { has: anna.getByRole('heading', { name: 'Change password' }) })
    const line = card.locator('.account-email')
    await expect(line).toHaveText(`You sign in with ${ANNA.email}.`)
    await expect(line).toHaveAttribute('title', ANNA.email)
    await expect(line).toHaveAttribute('data-clamp', '')
    await expect(card.getByText('Ask your administrator to change it.')).toBeVisible()
    // The password manager files a new password under the address (38.5).
    await expect(card.locator('input[name="username"]')).toHaveValue(ANNA.email)
    // Nowhere on the page can the holder change it.
    await expect(anna.locator('main input[type="email"]')).toHaveCount(0)
    await anna.goto(`${origin}/admin/account?lang=nl`)
    await expect(anna.locator('.account-email')).toHaveText(`U logt in met ${ANNA.email}.`)
    await expect(anna.getByText('Vraag uw beheerder om het te wijzigen.')).toBeVisible()

    const admin = await (await browser.newContext()).newPage()
    await login(admin, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
    await admin.goto(`${origin}/admin/account`)
    const adminCard = admin.locator('form', { has: admin.getByRole('heading', { name: 'Change password' }) })
    await expect(adminCard.locator('.account-email')).toHaveText(`You sign in with ${ADMIN_EMAIL}.`)
    await expect(adminCard.locator('.admin-note')).toHaveText([`You sign in with ${ADMIN_EMAIL}.`, 'Your other sessions end when you change it.'])
    await expect(admin.getByText('Ask your administrator to change it.')).toHaveCount(0)
  })

  test("**[#197]** the name card says the name is shown on the public pages, under the field, on every account's page but the administrator's (39.8)", async ({ browser }) => {
    const anna = await (await browser.newContext()).newPage()
    await login(anna, origin, ANNA.email, ANNA.password)
    const card = anna.locator('form', { has: anna.locator('h1') })
    for (const [lang, words] of [
      ['en', 'Shown on the public pages of the trees you create or collaborate on.'],
      ['nl', "Wordt getoond op de openbare pagina's van de bomen die u maakt of waaraan u meewerkt."],
    ] as const) {
      await anna.goto(`${origin}/admin/account${lang === 'en' ? '' : '?lang=nl'}`)
      const notice = card.locator('.admin-note')
      await expect(notice).toHaveText(words)
      await expect(notice).toBeVisible()
      // Under the field and its counter, above the card's button (25.2).
      const field = (await card.locator('.admin-field-group').boundingBox())!
      const said = (await notice.boundingBox())!
      const button = (await card.locator('button[type="submit"]').boundingBox())!
      expect(said.y, lang).toBeGreaterThanOrEqual(field.y + field.height)
      expect(said.y + said.height, lang).toBeLessThanOrEqual(button.y)
    }

    const admin = await (await browser.newContext()).newPage()
    await login(admin, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
    for (const lang of ['en', 'nl']) {
      await admin.goto(`${origin}/admin/account${lang === 'en' ? '' : '?lang=nl'}`)
      await expect(admin.locator('form', { has: admin.locator('h1') }).locator('input[name="name"]')).toBeVisible()
      await expect(admin.locator('form', { has: admin.locator('h1') }).locator('.admin-note')).toHaveCount(0)
      await expect(admin.getByText(/^(Shown on the public pages|Wordt getoond op de openbare)/)).toHaveCount(0)
    }
  })

  test("**[#196]** an account a converted store left without an address keeps the session it had, and its page says noEmail (38.4)", async ({ page, context }) => {
    await context.addCookies([
      { name: 'elsa-admin-session', value: henkToken, domain: new URL(origin).hostname, path: '/admin', httpOnly: true, secure: true, sameSite: 'Strict' },
    ])

    await page.goto(`${origin}/admin/account`)

    const card = page.locator('form', { has: page.getByRole('heading', { name: 'Change password' }) })
    await expect(card.locator('.account-email')).toHaveText('No e-mail address yet')
    await expect(card.getByText('Ask your administrator to change it.')).toBeVisible()
    await expect(card.locator('input[name="username"]')).toHaveValue('')
    await expect(page.locator('header').getByRole('link', { name: 'Account', exact: true })).toHaveAccessibleDescription(HENK.name)
  })

  test('the account page changes the name, never to another account\'s, and the password only with the current one', async ({ page, browser }) => {
    await page.goto(`${origin}/admin/account`)
    await signIn(page, CEES.email, CEES.password)
    const nameCard = page.locator('form', { has: page.getByRole('heading', { name: 'Your name' }) })
    const passwordCard = page.locator('form', { has: page.getByRole('heading', { name: 'Change password' }) })

    await nameCard.getByLabel('Your name').fill('Cees van Dam')
    await expect(nameCard.getByText('12 / 80')).toBeVisible()
    // **[#196]** One account per name, compared without regard to case and white space (38.6).
    await nameCard.getByLabel('Your name').fill('  anna ')
    await nameCard.getByRole('button', { name: 'Save' }).click()
    await expect(nameCard.getByRole('alert')).toHaveText('Another account has this name.')
    await nameCard.getByLabel('Your name').fill('Cees van Dam')
    await nameCard.getByRole('button', { name: 'Save' }).click()
    // **[#176]** The bar's link says "Account"; the name it shows on hover and to a screen reader is the new one (24.3).
    await expect(page.locator('header').getByRole('link', { name: 'Account', exact: true })).toHaveAccessibleDescription('Cees van Dam')

    // A second session of the same account, which a password change must end (20.4).
    const other = await browser.newContext()
    const otherPage = await other.newPage()
    const second = await login(otherPage, origin, CEES.email, CEES.password)
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
    expect((await login(otherPage, origin, CEES.email, 'cees second password')).status).toBe(204)
    await other.close()
  })

  test('the accounts page creates an account with an address and deactivates it, which ends its session (25.3)', async ({ page, browser }) => {
    await page.goto(`${origin}/admin/accounts`)
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
    // **[#196]** The administrator's own row has one action, setEmail (38.5).
    const adminRow = page.locator(`.admin-row[data-email="${ADMIN_EMAIL}"]`)
    await expect(adminRow).toContainText('Administrator')
    await expect(adminRow.locator('.admin-row-actions summary')).toHaveText(['Set e-mail address'])
    await expect(adminRow.locator('.admin-row-actions > button')).toHaveCount(0)

    const sheet = page.locator('details.account-sheet').first()
    await sheet.locator('summary', { hasText: 'New account' }).click()
    const address = sheet.getByLabel('E-mail address', { exact: true })
    await expect(address).toHaveAttribute('type', 'email')
    await expect(sheet.locator('form')).toHaveAttribute('novalidate', '')
    await sheet.getByLabel('Display name').fill('Bram')
    await address.fill('bram@example.org')
    await sheet.getByLabel('Password', { exact: true }).fill('too short')
    await sheet.getByRole('button', { name: 'Create' }).click()
    await expect(sheet.getByRole('alert')).toHaveText('A password is 12 to 256 characters.')
    await sheet.getByLabel('Password', { exact: true }).fill('brams first password')
    for (const [taken, said] of [
      ['bram', 'Enter an e-mail address, such as name@example.org.'],
      [' ANNA@example.org', 'Another account has this e-mail address.'],
    ] as const) {
      await address.fill(taken)
      await sheet.getByRole('button', { name: 'Create' }).click()
      await expect(sheet.getByRole('alert')).toHaveText(said)
    }
    await address.fill('Bram@Example.org')
    await sheet.getByLabel('Display name').fill('lotte')
    await sheet.getByRole('button', { name: 'Create' }).click()
    await expect(sheet.getByRole('alert')).toHaveText('Another account has this name.')
    await sheet.getByLabel('Display name').fill('Bram')
    await sheet.getByRole('button', { name: 'Create' }).click()
    secrets.add('brams first password')
    addresses.add('bram@example.org')

    // Lower-cased on entry (38.1), shown whole in its title.
    const bramRow = page.locator('.admin-row[data-email="bram@example.org"]')
    await expect(bramRow).toContainText('Bram')
    await expect(bramRow).toContainText('Active')
    await expect(bramRow.locator('.admin-row-email')).toHaveAttribute('title', 'bram@example.org')
    await expect(bramRow.locator('.admin-row-actions summary')).toHaveText(['Set password', 'Set e-mail address'])
    await bramRow.locator('summary', { hasText: 'Set password' }).click()
    await expect(bramRow.getByLabel('Password (Bram)')).toBeVisible()
    await page.keyboard.press('Escape')

    const bram = await browser.newContext()
    const bramPage = await bram.newPage()
    const bramSession = await login(bramPage, origin, 'bram@example.org', 'brams first password')
    expect(bramSession.status).toBe(204)

    await bramRow.getByRole('button', { name: 'Deactivate' }).click()
    await expect(page.locator('.admin-row[data-email="bram@example.org"]')).toContainText('Deactivated')
    expect(await me(bramPage, origin, bramSession.cookie)).toBe(401)
    expect((await login(bramPage, origin, 'bram@example.org', 'brams first password')).status).toBe(401)

    await page.locator('.admin-row[data-email="bram@example.org"]').getByRole('button', { name: 'Reactivate' }).click()
    await expect(page.locator('.admin-row[data-email="bram@example.org"]')).toContainText('Active')
    expect((await login(bramPage, origin, 'bram@example.org', 'brams first password')).status).toBe(204)
    await bram.close()
  })

  test('**[#196]** the accounts page shows every address or noEmail, and setEmail gives one: the way back of a converted account (38.4, 38.5)', async ({ page, browser }) => {
    await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto(`${origin}/admin/accounts`)

    const annaRow = page.locator(`.admin-row[data-email="${ANNA.email}"]`)
    await expect(annaRow.locator('.admin-row-email')).toHaveText(ANNA.email)
    await expect(annaRow.locator('.admin-row-email')).toHaveAttribute('data-clamp', '')
    const henkRow = page.locator('.admin-row', { hasText: HENK.name })
    await expect(henkRow.locator('.admin-row-email')).toHaveText('No e-mail address yet')
    await expect(henkRow.locator('.admin-row-email')).toHaveClass(/admin-row-email--none/)
    await expect(henkRow).not.toHaveAttribute('data-email')

    const sheet = henkRow.locator('details.account-sheet', { has: page.locator('summary', { hasText: 'Set e-mail address' }) })
    await sheet.locator('summary').click()
    const field = sheet.getByLabel(`E-mail address (${HENK.name})`)
    await expect(field).toHaveValue('')
    await expect(field).toHaveAttribute('type', 'email')
    for (const [typed, said] of [
      ['henk', 'Enter an e-mail address, such as name@example.org.'],
      [CEES.email.toUpperCase(), 'Another account has this e-mail address.'],
    ] as const) {
      await field.fill(typed)
      await sheet.getByRole('button', { name: 'Save' }).click()
      await expect(sheet.getByRole('alert')).toHaveText(said)
    }
    await field.fill(' Henk@Example.org ')
    await sheet.getByRole('button', { name: 'Save' }).click()
    addresses.add('henk@example.org')
    await expect(page.locator('.admin-row[data-email="henk@example.org"]')).toContainText(HENK.name)

    // Henk logs in with that address and the password he had (38.4).
    const henk = await (await browser.newContext()).newPage()
    expect((await login(henk, origin, 'henk@example.org', HENK.password)).status).toBe(204)

    // The Sheet holds the current address, and the administrator changes its own the same way.
    const adminRow = page.locator(`.admin-row[data-email="${ADMIN_EMAIL}"]`)
    await adminRow.locator('summary', { hasText: 'Set e-mail address' }).click()
    await expect(adminRow.getByLabel('E-mail address (Administrator)')).toHaveValue(ADMIN_EMAIL)
  })
})

test.describe('CSRF (20.6)', () => {
  test('a form posted from another origin is refused, and sets no cookie', async ({ page, context }) => {
    // The classic JSON forgery: a text/plain form whose one field spells a JSON body. From
    // another origin of the same host, which a browser marks same-site, not same-origin.
    await page.goto(`${otherOrigin}/`)
    await page.setContent(
      `<form method="post" enctype="text/plain" action="${origin}/admin/api/login">` +
        `<input name='{"email":"${ADMIN_EMAIL}","password":"${ADMIN_PASSWORD}","x":"' value='"}'></form>`,
    )
    const answered = page.waitForResponse((response) => response.url() === `${origin}/admin/api/login`)

    await page.locator('form').evaluate((form: HTMLFormElement) => form.submit())

    const response = await answered
    expect(response.status()).toBe(403)
    expect((await response.allHeaders())['set-cookie']).toBeUndefined()
    expect(await context.cookies()).toEqual([])
  })

  test('a JSON write from another origin is refused, even with a session in the browser', async ({ page }) => {
    const { cookie } = await login(page, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto(`${otherOrigin}/`)

    const status = await page.evaluate(async (target) => {
      try {
        const response = await fetch(`${target}/admin/api/accounts`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Mallory', email: 'mallory@example.org', password: 'mallorys password' }),
        })
        return response.status
      } catch {
        // No CORS answer: the preflight is refused, and the request never leaves.
        return 0
      }
    }, origin)

    expect([0, 403]).toContain(status)
    const names = (await (await page.request.get(`${origin}/admin/api/accounts`, { headers: { Cookie: cookie } })).json()) as { name: string }[]
    expect(names.map((account) => account.name)).not.toContain('Mallory')
  })
})

test('the login page, the account page and the accounts page, for the pull request (#196)', async ({ browser }) => {
  const shoot = async (page: Page, name: string): Promise<void> => {
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) })
  }
  // The login page in both languages, at the widest and a phone's width, empty and refused (25.1).
  for (const lang of ['en', 'nl']) {
    for (const [width, height] of [[1280, 640], [360, 640]] as const) {
      const visitor = await (await browser.newContext({ viewport: { width, height } })).newPage()
      await visitor.goto(`${origin}/admin${lang === 'en' ? '' : '?lang=nl'}`)
      await expect(visitor.getByRole('button', { name: /^(Sign in|Inloggen)$/ })).toBeEnabled()
      await shoot(visitor, `login-${lang}-${width}x${height}`)
      await signIn(visitor, 'someone@example.org', 'not the password')
      await expect(visitor.getByRole('main').getByRole('alert')).toHaveText(lang === 'en' ? 'Wrong e-mail address or password.' : 'Verkeerd e-mailadres of wachtwoord.')
      await shoot(visitor, `login-${lang}-${width}x${height}-refused`)
      await visitor.context().close()
    }
  }

  const anna = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  await login(anna, origin, ANNA.email, ANNA.password)
  await anna.goto(`${origin}/admin/account`)
  await shoot(anna, 'account')

  const admin = await (await browser.newContext({ viewport: { width: 1280, height: 640 } })).newPage()
  await login(admin, origin, ADMIN_EMAIL, ADMIN_PASSWORD)
  await admin.goto(`${origin}/admin/account`)
  await shoot(admin, 'account-administrator')
  await admin.goto(`${origin}/admin/accounts`)
  await shoot(admin, 'accounts')
  await admin.locator('details.account-sheet summary', { hasText: 'New account' }).click()
  await shoot(admin, 'accounts-new')
  await admin.keyboard.press('Escape')
  await admin.locator(`.admin-row[data-email="${ANNA.email}"] summary`, { hasText: 'Set e-mail address' }).click()
  await shoot(admin, 'accounts-set-email')
})

test('the server logged no password, no session token and no address (20.8, 38.8)', async () => {
  // Last in the file: every login above has run and written its lines.
  const log = await readFile(LOG, 'utf8')

  expect(log).toContain('logged in')
  expect(log).toContain('login failed for an unknown address')
  expect(log).toMatch(/login locked for 15 minutes for account [0-9a-f]{32}/)
  expect(log).toContain('login locked for 15 minutes for an unknown address')
  const found = [...secrets].filter((secret) => log.includes(secret))
  expect(found, 'secrets in the server log').toEqual([])
  // **[#196]** Nor any address, typed or held, in any case: the log speaks of ids (38.8).
  const lower = log.toLowerCase()
  const named = [...addresses, 'nobody@example.org', 'no-account-here@example.org', 'someone@example.org'].filter((address) => lower.includes(address))
  expect(named, 'addresses in the server log').toEqual([])
  expect(lower).not.toContain('@example.org')
})
