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
import { openTree, type Tree } from '../../src/tree/loader.ts'
import { imageHref } from '../../src/url.ts'

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

/**
 * Where issue #45's pictures go, on the same opt-in terms as the set above: `ELSA_SHOTS=1`
 * writes the tracked pair, a plain run leaves the repository alone.
 */
const PICTURE_SHOTS = fileURLToPath(
  process.env.ELSA_SHOTS === '1'
    ? new URL('../../docs/screenshots/issue-45/', import.meta.url)
    : new URL('.results/shots/', import.meta.url),
)

/** The two Nodes issue #45 put a picture on every Option of, and the walk that reaches each. */
const PICTURE_NODES = {
  'annex-i-legislation': WALKS['end-of-walk']!.slice(0, 5),
  'annex-iii-areas': WALKS['end-of-walk']!.slice(0, 8),
} as const

for (const [nodeId, steps] of Object.entries(PICTURE_NODES)) {
  test(`${nodeId} shows its own picture and one per Option, all from this server`, async ({ page, baseURL }) => {
    // Issue #45: the Annex I and Annex III lists are the two the core document (3.3, items
    // 4a and 4b) asks for a picture on every entry of. The count is asserted against the
    // Options actually on screen, so an Option added later without a picture fails here.
    // The requests are recorded over the LAST click only, so what is counted is what this
    // one Node costs a reader, not what the whole walk to it did.
    const visited = await walk(page, steps.slice(0, -1))
    const asked: string[] = []
    page.on('request', (request) => asked.push(request.url()))
    const last = steps[steps.length - 1]!
    await clickAnswer(page, 'en', last.answer)
    visited.push(last.lands)
    await expect(page).toHaveURL(pageUrl(visited, 'en'))

    const options = await page.locator('.option').count()
    expect(options, `${nodeId} shows no Options`).toBeGreaterThan(0)
    await expect(page.locator('.option-image')).toHaveCount(options)
    await expect(page.locator('.images .thumbnail img')).toHaveCount(1)

    // The description is the alternative text (tree-format.md 5.2), in the reader's language.
    for (const image of await page.locator('.option-image, .images img').all()) {
      expect((await image.getAttribute('alt'))?.trim(), 'an Image with no alternative text').toBeTruthy()
    }

    // Core document 7 and 9: nothing is fetched from anywhere but this server, pictures
    // included. The analogue of the #40 check, on the Tree that now carries the pictures.
    const own = new URL(baseURL!).host
    expect(asked.filter((url) => new URL(url).host !== own)).toEqual([])
    expect(asked.filter((url) => new URL(url).pathname.startsWith('/images/')).length).toBe(options + 1)

    await page.screenshot({ path: path.join(PICTURE_SHOTS, `${nodeId}.png`), fullPage: true })
  })
}

/**
 * What a reader can actually SEE of a picture's credit -- the one behaviour issue #45
 * introduced that nothing tested.
 *
 * 23 of the 28 Option pictures and 5 of the 7 Node pictures are CC BY or CC BY-SA, and
 * those licences ask for the attribution to be given where the work is shared. So "the
 * credit is in `tree.yaml`" is not the behaviour that matters to them; "a reader is shown
 * it" is. The owner's answer on PR #54 (2026-09-12) was to merge the pictures now and make
 * the display a release blocker (`docs/deployment.md`), tracked as issue #55.
 *
 * The three tests below therefore assert what is true TODAY, not what the format promises:
 * the Node pictures reach their credit through the enlarged view, every Option picture on
 * screen has a credit in the Tree the server is serving, and no Option credit reaches the
 * page. The last one is a DECLARED FAILING test: Playwright runs it and requires it to
 * fail, so the day #55 puts the credit on the page it reports "expected to fail, but
 * passed" and whoever fixed it is sent back here to replace it. `test.fixme` would have
 * been the quieter marker, but it does not run the body at all and so cannot fail the day
 * the gap closes, which is the whole point of writing it down.
 */
const TREE_DIR = fileURLToPath(new URL('../../trees/ai-act-applicability-agrifood', import.meta.url))

/** The Node a reader meets each step at; each carries one picture (#45, NOTES.md 6). */
const STEP_NODES = [
  'start',
  'ai-system-definition',
  'prohibited-practices',
  'annex-i-legislation',
  'annex-iii-areas',
  'general-purpose-ai',
  'transparency-obligations',
] as const

/** The four Nodes whose Options carry the 28 Annex I and Annex III pictures. */
const ANNEX_NODES = [
  'annex-i-legislation',
  'annex-i-legislation-2',
  'annex-i-legislation-3',
  'annex-iii-areas',
] as const

/** The licences issue #45 sourced under, as `tests/ai-act-tree.test.ts` spells them. */
const OPEN_LICENCE = /CC0 1\.0|CC BY(-SA)? [0-9.]+|public domain/

let tree: Tree

test.beforeAll(async () => {
  // The same Tree folder the server under test is serving (playwright.first-tree.config.ts),
  // read through the loader: what a credit should say comes from the Tree, not from a copy
  // of it in this file that could drift.
  tree = await openTree(TREE_DIR)
})

test("every step Node's picture gives its credit in the enlarged view", async ({ page }) => {
  for (const nodeId of STEP_NODES) {
    const node = await tree.getNode(nodeId)
    expect(node, `${nodeId} cannot be read`).not.toBeNull()
    await page.goto(`/${TREE}/${nodeId}`)

    const thumbnails = page.locator('.thumbnail')
    await expect(thumbnails).toHaveCount(node!.images.length)
    for (const [index, image] of node!.images.entries()) {
      await thumbnails.nth(index).click()
      const enlarged = page.locator('dialog.enlarged')
      await expect(enlarged).toBeVisible()
      // Author, where it came from and the licence, as `tree.yaml` writes it -- after a
      // click, which is the gap issue #55 closes.
      await expect(enlarged.locator('.credit')).toContainText(image.credit)
      await page.keyboard.press('Escape')
      await expect(enlarged).toBeHidden()
    }
  }
})

test('every Option picture on screen has a credit in the Tree this server is serving', async ({ page }) => {
  let checked = 0
  for (const nodeId of ANNEX_NODES) {
    const node = await tree.getNode(nodeId)
    expect(node, `${nodeId} cannot be read`).not.toBeNull()
    await page.goto(`/${TREE}/${nodeId}`)

    const credits = new Map(
      node!.options.flatMap((option) => option.images.map((image) => [imageHref(image.file), image.credit])),
    )
    const shown = await page
      .locator('.option-image')
      .evaluateAll((images) => images.map((image) => new URL((image as HTMLImageElement).src).pathname))
    expect(shown.length, `${nodeId}: pictures on screen`).toBe(credits.size)

    for (const src of shown) {
      const credit = credits.get(src)
      expect(credit, `${nodeId}: ${src} is on screen but is no Option Image of this Node`).toBeDefined()
      expect(credit!, `${nodeId}: ${src} has no licence in its credit`).toMatch(OPEN_LICENCE)
      checked += 1
    }
  }
  // The 20 Annex I entries and the 8 Annex III areas: nothing a reader is shown is missing
  // its attribution in the data, so issue #55 is a display job and not a sourcing one.
  expect(checked, 'Annex Option pictures checked').toBe(28)
})

test.fail(
  'KNOWN GAP, issue #55 (accepted by the owner 2026-09-12): an Option picture shows its credit to a reader',
  async ({ page }) => {
    // Expected to FAIL today: an Option's `<img>` sits inside the link that walks to its
    // explanation, so a click navigates and no code path draws an Option's credit. When
    // #55 (or the Carousel, #43) puts it on the page, Playwright reports "expected to fail,
    // but passed" -- replace this test then with the one #55 asks for, over all 35 pictures.
    const nodeId = 'annex-iii-areas'
    const node = await tree.getNode(nodeId)
    await page.goto(`/${TREE}/${nodeId}`)

    for (const option of node!.options) {
      for (const image of option.images) {
        // `useInnerText`: what a reader can read on the page, not what is in the markup.
        await expect(page.locator('body'), `${nodeId} -> ${image.file}`).toContainText(image.credit, {
          useInnerText: true,
        })
      }
    }
  },
)
