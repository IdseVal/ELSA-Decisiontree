/**
 * The language switch in a real browser: what a click on it actually changes, whether the
 * choice survives a walk and a shared link, and that keeping it costs the reader nothing on
 * their own machine -- none of which markup alone can show.
 *
 * The server serves `trees/ai-act-example`, which declares `en` and `nl` (playwright.config.ts).
 * A Tree in one language, and one in a language the chrome does not speak, are fixtures the
 * server does not hold: they are checked in `tests/language.test.tsx` and `tests/interop.test.tsx`.
 */
import { expect, test, type Page } from '@playwright/test'

const START = '/ai-act-example/start'
const STEP = '/ai-act-example/start/prohibited-practices'

/** Every text of the step the walk reaches, in both languages: the issue's task 2, as data. */
const BOTH_LANGUAGES = [
  {
    what: 'title',
    en: 'Does your system do any of the prohibited practices?',
    nl: 'Verricht uw systeem een van de verboden praktijken?',
  },
  { what: 'description', en: 'lists practices that are', nl: 'noemt praktijken die zonder meer' },
  { what: 'Option', en: 'Emotion recognition at work', nl: 'Emotieherkenning op het werk' },
  { what: 'Source label', en: 'Article 5 AI Act', nl: 'Artikel 5 AI-verordening' },
  { what: 'Trail entry', en: 'Is your AI system within the reach', nl: 'Valt uw AI-systeem binnen het bereik' },
  { what: 'chrome', en: 'Sources', nl: 'Bronnen' },
]

/** The alt text of the Option's image: an Image description, which is content, not chrome. */
async function optionImageAlt(page: Page): Promise<string | null> {
  return page.locator('.option .branch-image').first().getAttribute('alt')
}

test('switching language changes every text of the Node, and the switch says where you are', async ({
  page,
}) => {
  await page.goto(STEP)
  for (const row of BOTH_LANGUAGES) {
    await expect(page.locator('body'), row.what).toContainText(row.en)
  }
  expect(await optionImageAlt(page)).toBe('A scoreboard ranking people')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.getByRole('link', { name: 'Nederlands' }).click()

  await expect(page).toHaveURL(`${STEP}?lang=nl`)
  // The document follows the switch too: the `[lang]` segment of issue #20 reaches the root
  // layout through the rewrite, so a screen reader is told the page changed language.
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
  for (const row of BOTH_LANGUAGES) {
    await expect(page.locator('body'), row.what).toContainText(row.nl)
    await expect(page.locator('body'), row.what).not.toContainText(row.en)
  }
  expect(await optionImageAlt(page)).toBe('Een scorebord dat mensen rangschikt')

  // The language on screen is named but is not a link: it is where the reader already is.
  await expect(page.locator('.language--current')).toHaveText('Nederlands')
  await expect(page.getByRole('link', { name: 'Nederlands' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'English' })).toHaveCount(1)
})

test('the chosen language survives Answers, Options and the way back', async ({ page }) => {
  await page.goto(START)
  await page.getByRole('link', { name: 'Nederlands' }).click()
  await expect(page).toHaveURL(`${START}?lang=nl`)

  await page.locator('.answer--yes').click()
  await expect(page).toHaveURL(`${STEP}?lang=nl`)

  await page.getByRole('link', { name: 'Sociale scoring' }).click()
  await expect(page).toHaveURL(`${STEP}/social-scoring?lang=nl`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sociale scoring')

  // The way back keeps it too: the Trail entry is the same page in the same language.
  await page.locator('.trail-entry').first().click()
  await expect(page).toHaveURL(`${START}?lang=nl`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Valt uw AI-systeem binnen het bereik van de AI-verordening?',
  )
})

test('the shared link carries the language to whoever opens it', async ({ page, context, browser }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(`${STEP}?lang=nl`)

  await page.getByRole('button', { name: 'Kopieer link' }).click()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toContain('?lang=nl')

  // A fresh context: another browser, another person, nothing carried over.
  const recipient = await browser.newContext()
  const theirPage = await recipient.newPage()
  await theirPage.goto(link)

  await expect(theirPage.getByRole('heading', { level: 1 })).toHaveText(
    'Verricht uw systeem een van de verboden praktijken?',
  )
  await expect(theirPage.locator('.language--current')).toHaveText('Nederlands')
  await recipient.close()
})

test('the language is kept in the URL and nowhere else on the reader machine', async ({
  page,
  context,
}) => {
  await page.goto(START)
  await page.getByRole('link', { name: 'Nederlands' }).click()
  await page.locator('.answer--yes').click()
  await expect(page).toHaveURL(`${STEP}?lang=nl`)

  expect(await context.cookies()).toEqual([])
  expect(
    await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 })

  // And the server sets none either: no response of the walk carries a cookie (section 1).
  const response = await page.request.get(`${STEP}?lang=nl`)
  expect(response.headers()['set-cookie']).toBeUndefined()
})

test('the first visit is the language the Tree declares first, and an undeclared one is ignored', async ({
  page,
}) => {
  await page.goto(START)
  await expect(page.locator('.language--current')).toHaveText('English')

  // application.md 4.1: a language the Tree does not declare is ignored, the default is used,
  // and the status is the one the URL would have had anyway.
  const response = await page.goto(`${START}?lang=de`)
  expect(response?.status()).toBe(200)
  await expect(page.locator('.language--current')).toHaveText('English')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Is your AI system within the reach of the AI Act?',
  )
})

test('the switch is in the HTML the server sends, and is reached by the keyboard', async ({ page }) => {
  const html = await (await page.request.get(STEP)).text()
  expect(html).toContain('class="language-switch"')
  expect(html).toContain('>Nederlands</a>')

  // It is the page chrome above the content, so the tab key reaches it before anything in
  // the walk. Issue #40 put the Tree's logo first in that bar, so the switch is the tab
  // after the logo's link when the Tree has one.
  await page.goto(STEP)
  const logos = await page.locator('.page-chrome a.logo-link').count()
  for (let i = 0; i < logos + 1; i++) await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Nederlands' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(`${STEP}?lang=nl`)
})

test.describe('with JavaScript switched off', () => {
  test.use({ javaScriptEnabled: false })

  test('the switch still works: it is links, not a menu', async ({ page }) => {
    await page.goto(STEP)
    await page.getByRole('link', { name: 'Nederlands' }).click()

    await expect(page).toHaveURL(`${STEP}?lang=nl`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Verricht uw systeem een van de verboden praktijken?',
    )
  })
})
