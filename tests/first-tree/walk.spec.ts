/**
 * Issue #23: the first Tree walked in the running app, by clicking, in both the languages
 * it provides.
 *
 * Issue #10 authored this Tree but could not meet one of its DONE-WHEN criteria, because
 * the page that shipped then rendered a title and a description and no links at all. That
 * criterion is what this suite executes: every Terminal is reached from the root by
 * clicking the Answers and Options on screen, an Option's explanation-only child offers a
 * visible way back, a Terminal ends the walk, and the eight screenshots #10 owes are taken
 * along the way. The Dutch set is reached by clicking the app's own language switch, which
 * is the point: the #10 Dutch set was taken with an uncommitted `const lang = 'nl'`.
 *
 * The eight screenshots are a record of ONE machine's rendering, not a detector of
 * rendering changes. The app ships no web font on purpose (`--font: ui-sans-serif,
 * system-ui, ...` in `src/app/[lang]/globals.css`), so text metrics, wrapping and the
 * full-page height follow whichever fonts the machine running the browser has, and another
 * machine re-renders every PNG differently. Writing into `docs/screenshots/issue-10/` is
 * therefore opt-in: `ELSA_SHOTS=1 npm run test:first-tree` re-takes the tracked set, and a
 * plain run puts its shots in the gitignored results directory, leaving the repository
 * clean for whoever is only checking that the walk still works.
 *
 * The server serves `trees/ai-act-applicability-agrifood` (see playwright.first-tree.config.ts).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const TREE = 'ai-act-applicability-agrifood'

/** Where the screenshots go: issue #10's tracked directory only when asked for. */
const SHOTS = fileURLToPath(
  process.env.ELSA_SHOTS === '1'
    ? new URL('../../docs/screenshots/issue-10/', import.meta.url)
    : new URL('.results/shots/', import.meta.url),
)

/** The two Answer labels and the language's own name, per language (src/chrome.ts). */
const CHROME = {
  en: { yes: 'Yes', no: 'No', endonym: 'English' },
  nl: { yes: 'Ja', no: 'Nee', endonym: 'Nederlands' },
} as const

type Lang = keyof typeof CHROME

/** One clicked Answer and the Node id it must land on. */
interface Step {
  answer: 'yes' | 'no'
  lands: string
}

/**
 * The click path from the root to each Node this issue names. `high-risk` is in the list
 * although issue #24 stopped it being a Terminal: its walk carries on to `end-of-walk`,
 * which is how this suite shows that the high-risk finding no longer ends the walk.
 */
const WALKS: Record<string, Step[]> = {
  // Issue #44 cut step 1 into the seven "(n/7)" jurisdiction Nodes, a yes on any of which
  // leads to the Article 2 exclusions, step 3 into two Nodes and step 4a into three, so the
  // click paths below are longer than the ones this suite walked when every step was a
  // single Node. Nothing else moved.
  'ai-act-does-not-apply': [
    { answer: 'no', lands: 'jurisdiction-deployer' },
    { answer: 'no', lands: 'jurisdiction-third-country-output' },
    { answer: 'no', lands: 'jurisdiction-importer-distributor' },
    { answer: 'no', lands: 'jurisdiction-product-manufacturer' },
    { answer: 'no', lands: 'jurisdiction-authorised-representative' },
    { answer: 'no', lands: 'jurisdiction-affected-person' },
    { answer: 'no', lands: 'ai-act-does-not-apply' },
  ],
  'not-an-ai-system': [
    { answer: 'yes', lands: 'article-2-exclusions' },
    { answer: 'no', lands: 'ai-system-definition' },
    { answer: 'no', lands: 'not-an-ai-system' },
  ],
  prohibited: [
    { answer: 'yes', lands: 'article-2-exclusions' },
    { answer: 'no', lands: 'ai-system-definition' },
    { answer: 'yes', lands: 'prohibited-practices' },
    { answer: 'yes', lands: 'prohibited' },
  ],
  'high-risk': [
    { answer: 'yes', lands: 'article-2-exclusions' },
    { answer: 'no', lands: 'ai-system-definition' },
    { answer: 'yes', lands: 'prohibited-practices' },
    { answer: 'no', lands: 'prohibited-practices-2' },
    { answer: 'no', lands: 'annex-i-legislation' },
    { answer: 'yes', lands: 'high-risk' },
  ],
  'end-of-walk': [
    { answer: 'yes', lands: 'article-2-exclusions' },
    { answer: 'no', lands: 'ai-system-definition' },
    { answer: 'yes', lands: 'prohibited-practices' },
    { answer: 'no', lands: 'prohibited-practices-2' },
    { answer: 'no', lands: 'annex-i-legislation' },
    { answer: 'no', lands: 'annex-i-legislation-2' },
    { answer: 'no', lands: 'annex-i-legislation-3' },
    { answer: 'no', lands: 'annex-iii-areas' },
    { answer: 'no', lands: 'general-purpose-ai' },
    { answer: 'yes', lands: 'transparency-obligations' },
    { answer: 'yes', lands: 'end-of-walk' },
  ],
}

/** The ids explicitly marked as Terminals in the Tree (`terminal.outcome`). */
const TERMINALS = ['ai-act-does-not-apply', 'not-an-ai-system', 'prohibited', 'end-of-walk']

/** The page for a walk: the path is the Trail, and `lang` is omitted for the default (4.1). */
function pageUrl(visited: string[], lang: Lang): string {
  const url = `/${TREE}/${visited.join('/')}`
  return lang === 'en' ? url : `${url}?lang=${lang}`
}

async function clickAnswer(page: Page, lang: Lang, which: 'yes' | 'no'): Promise<void> {
  await page.getByRole('link', { name: CHROME[lang][which], exact: true }).click()
}

/**
 * Walks from the root by clicking Answers only, checking after every click that the browser
 * is where the Tree says it should be. Returns the ids visited, root first.
 */
async function walk(page: Page, steps: Step[], lang: Lang = 'en'): Promise<string[]> {
  await page.goto(pageUrl(['start'], lang))
  const visited = ['start']
  for (const step of steps) {
    await clickAnswer(page, lang, step.answer)
    visited.push(step.lands)
    await expect(page).toHaveURL(pageUrl(visited, lang))
  }
  return visited
}

for (const [target, steps] of Object.entries(WALKS)) {
  test(`${target} is reached from the root by clicking`, async ({ page }) => {
    const visited = await walk(page, steps)
    expect(visited[visited.length - 1]).toBe(target)

    // A Terminal says its outcome and offers no way on; anything else must offer both
    // Answers, or the walk would be stuck at a Node that is not marked as an ending.
    const isTerminal = TERMINALS.includes(target)
    await expect(page.locator('.outcome')).toHaveCount(isTerminal ? 1 : 0)
    await expect(page.getByRole('link', { name: CHROME.en.yes, exact: true })).toHaveCount(isTerminal ? 0 : 1)
    await expect(page.getByRole('link', { name: CHROME.en.no, exact: true })).toHaveCount(isTerminal ? 0 : 1)
  })
}

test('a full Article 2 exclusion ends the walk for a reader the Act reaches', async ({ page }) => {
  // PR #53, the owner's answer: the exclusions are asked after a yes on step 1, so a reader
  // in scope whose system is excluded is not walked on to a high-risk or Article 50 finding.
  await walk(page, [
    { answer: 'yes', lands: 'article-2-exclusions' },
    { answer: 'yes', lands: 'ai-act-does-not-apply' },
  ])
  await expect(page.locator('.outcome')).toHaveCount(1)
})

test('an Option leads to an explanation-only child that offers a visible way back', async ({ page }) => {
  await walk(page, WALKS.prohibited!.slice(0, 3))

  await page.getByRole('link', { name: 'Social scoring' }).click()
  await expect(page).toHaveURL(
    `/${TREE}/start/article-2-exclusions/ai-system-definition/prohibited-practices/social-scoring`,
  )

  // Explanation only: no Answers of its own, and it says so (core document 3.2, 10.9).
  await expect(page.getByRole('link', { name: CHROME.en.yes, exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: CHROME.en.no, exact: true })).toHaveCount(0)
  await expect(page.locator('.hint')).toHaveText(
    'This step only explains. Go back to answer the question.',
  )

  // The way back is the Trail, and its last entry is the parent this child explains.
  const back = page.locator('.trail-entry').last()
  await expect(back).toBeVisible()
  await expect(back).toHaveText('Does your system do a prohibited practice? (1/2)')
  await back.click()
  await expect(page).toHaveURL(`/${TREE}/start/article-2-exclusions/ai-system-definition/prohibited-practices`)
})

test('the high-risk finding does not end the walk', async ({ page }) => {
  await walk(page, WALKS['high-risk']!)

  // Issue #24 turned this Node from a Terminal into a step both of whose Answers carry on,
  // because a high-risk system can carry Article 50 obligations at the same time.
  await expect(page.locator('.outcome')).toHaveCount(0)
  await clickAnswer(page, 'en', 'no')
  await expect(page).toHaveURL(
    `/${TREE}/start/article-2-exclusions/ai-system-definition/prohibited-practices/prohibited-practices-2/` +
      'annex-i-legislation/high-risk/general-purpose-ai',
  )
})

/**
 * Takes the four screenshots issue #10 owes in one language, by clicking through the
 * running app: the root Node, the prohibited-practices Node, the explanation-only child
 * `social-scoring`, and the Terminal `prohibited`.
 */
async function screenshotWalk(page: Page, lang: Lang): Promise<void> {
  const shot = async (name: string): Promise<void> => {
    await page.screenshot({ path: path.join(SHOTS, `${name}-${lang}.png`), fullPage: true })
  }

  await page.goto(pageUrl(['start'], 'en'))
  if (lang !== 'en') {
    // The app's own language mechanism, clicked -- not a source edit and not a typed URL.
    await page.getByRole('link', { name: CHROME[lang].endonym }).click()
    await expect(page).toHaveURL(pageUrl(['start'], lang))
  }
  await expect(page.locator('html')).toHaveAttribute('lang', lang)
  await shot('root-question')

  const toProhibitedPractices = ['start', 'article-2-exclusions', 'ai-system-definition', 'prohibited-practices']
  await clickAnswer(page, lang, 'yes')
  await clickAnswer(page, lang, 'no')
  await clickAnswer(page, lang, 'yes')
  await expect(page).toHaveURL(pageUrl(toProhibitedPractices, lang))
  await shot('prohibited-practices')

  await page.getByRole('link', { name: lang === 'en' ? 'Social scoring' : 'Sociale scoring' }).click()
  await expect(page).toHaveURL(pageUrl([...toProhibitedPractices, 'social-scoring'], lang))
  await shot('explanation-child')

  await page.locator('.trail-entry').last().click()
  await clickAnswer(page, lang, 'yes')
  await expect(page).toHaveURL(pageUrl([...toProhibitedPractices, 'prohibited'], lang))
  await shot('terminal-prohibited')
}

for (const lang of ['en', 'nl'] as const) {
  test(`the screenshots issue #10 owes, taken by clicking, in ${lang}`, async ({ page }) => {
    await screenshotWalk(page, lang)
  })
}
