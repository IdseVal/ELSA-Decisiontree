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
import { arrived } from '../browser/arrived.ts'
import { openTree, type Tree } from '../../src/tree/loader.ts'
import { imageHref } from '../../src/url.ts'
import { picturesByNode, readEveryCredit } from '../browser/credits.ts'

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
  // An Answer Branch is named by its chrome word and its target's title (application.md
  // 10.3), so the word is checked and the class is what is clicked.
  const answer = page.locator(`.answer--${which}`)
  await expect(answer.locator('.branch-word')).toHaveText(CHROME[lang][which])
  await answer.click()
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
    await arrived(page, pageUrl(visited, lang))
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
    await expect(page.locator('.answer--yes')).toHaveCount(isTerminal ? 0 : 1)
    await expect(page.locator('.answer--no')).toHaveCount(isTerminal ? 0 : 1)
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

  await page.locator('.options').getByRole('link', { name: 'Social scoring' }).click()
  await arrived(page,
    `/${TREE}/start/article-2-exclusions/ai-system-definition/prohibited-practices/social-scoring`,
  )

  // Explanation only: no Answers of its own, and it says so (core document 3.2, 10.9).
  await expect(page.getByRole('link', { name: CHROME.en.yes, exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: CHROME.en.no, exact: true })).toHaveCount(0)
  await expect(page.locator('.hint')).toHaveText(
    'This step only explains. Go back to answer the question.',
  )

  // The way back is the up arrow (#82), to the parent this child explains.
  const back = page.locator('.up-arrow')
  await expect(back).toBeVisible()
  await expect(back).toHaveAccessibleName('Back to: Does your system do a prohibited practice? (1/2)')
  await back.click()
  await arrived(page, `/${TREE}/start/article-2-exclusions/ai-system-definition/prohibited-practices`)
})

test('the high-risk finding does not end the walk', async ({ page }) => {
  await walk(page, WALKS['high-risk']!)

  // Issue #24 turned this Node from a Terminal into a step both of whose Answers carry on,
  // because a high-risk system can carry Article 50 obligations at the same time.
  await expect(page.locator('.outcome')).toHaveCount(0)
  await clickAnswer(page, 'en', 'no')
  await arrived(page,
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
    await arrived(page, pageUrl(['start'], lang))
  }
  await expect(page.locator('html')).toHaveAttribute('lang', lang)
  await shot('root-question')

  const toProhibitedPractices = ['start', 'article-2-exclusions', 'ai-system-definition', 'prohibited-practices']
  for (const [index, which] of (['yes', 'no', 'yes'] as const).entries()) {
    await clickAnswer(page, lang, which)
    await arrived(page, pageUrl(toProhibitedPractices.slice(0, index + 2), lang))
  }
  await shot('prohibited-practices')

  await page.locator('.options').getByRole('link', { name: lang === 'en' ? 'Social scoring' : 'Sociale scoring' }).click()
  await arrived(page, pageUrl([...toProhibitedPractices, 'social-scoring'], lang))
  await shot('explanation-child')

  await page.locator('.up-arrow').click()
  await arrived(page, pageUrl(toProhibitedPractices, lang))
  await clickAnswer(page, lang, 'yes')
  await arrived(page, pageUrl([...toProhibitedPractices, 'prohibited'], lang))
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
  test(`${nodeId} shows its own picture, all from this server; each Option's is on its target`, async ({ page, baseURL }) => {
    // Issue #45: the Annex I and Annex III lists are the two the core document (3.3, items
    // 4a and 4b) asks for a picture on every entry of. Since elsa-tree/3 (#79) an entry's
    // picture is its target's first Image, shown on the target's page and checked in
    // "every Annex Option's picture is its target's first Image" below; this page asks for its own.
    // The requests are recorded over the LAST click only, so what is counted is what this
    // one Node costs a reader, not what the whole walk to it did.
    const visited = await walk(page, steps.slice(0, -1))
    const asked: string[] = []
    page.on('request', (request) => asked.push(request.url()))
    const last = steps[steps.length - 1]!
    await clickAnswer(page, 'en', last.answer)
    visited.push(last.lands)
    await arrived(page, pageUrl(visited, 'en'))

    const options = await page.locator('.option').count()
    expect(options, `${nodeId} shows no Options`).toBeGreaterThan(0)
    await expect(page.locator('.option-image')).toHaveCount(0)
    // The Node's own picture is its main image, and it has no other (application.md 10.3, 12.1).
    await expect(page.locator('.bubble .main-image img')).toHaveCount(1)
    await expect(page.locator('.carousel .thumbnail')).toHaveCount(0)

    // The description is the alternative text (tree-format.md 5.2), in the reader's language.
    for (const image of await page.locator('.option-image, .bubble .main-image img').all()) {
      expect((await image.getAttribute('alt'))?.trim(), 'an Image with no alternative text').toBeTruthy()
    }

    // Core document 7 and 9: nothing is fetched from anywhere but this server, pictures
    // included. The analogue of the #40 check, on the Tree that now carries the pictures.
    const own = new URL(baseURL!).host
    expect(asked.filter((url) => new URL(url).host !== own)).toEqual([])
    expect(asked.filter((url) => new URL(url).pathname.startsWith('/images/')).length).toBe(1)

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
 * Since #81 the owner's pictures-only Carousel (#75) shows nothing under a picture: a Node
 * picture's credit is its accessible description and is shown whole in the enlarged view,
 * one keystroke away (application.md 12.2, 12.3; ADR-78-carousel, decision 5). An Option's
 * picture is its target's main image, credited in the target's Overlay (12.1), which #80
 * builds. Since #84 every one of the 71 Nodes carries a main image, the 28 Option pictures
 * among them on their targets, so every credit is read below on its own Node.
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

test("every step Node's picture is its main image, and a click on it shows its credit in the enlarged view", async ({ page }) => {
  for (const nodeId of STEP_NODES) {
    const node = await tree.getNode(nodeId)
    expect(node, `${nodeId} cannot be read`).not.toBeNull()
    expect(node!.images, `${nodeId}: one picture`).toHaveLength(1)
    await page.goto(`/${TREE}/${nodeId}`)

    // One Image: the main image above the title, and no strip (application.md 10.3, 12.1).
    await expect(page.locator('.thumbnail')).toHaveCount(0)
    const image = node!.images[0]!
    await page.locator('.bubble a.main-image').click()
    const enlarged = page.locator('.carousel-sheet .sheet-panel')
    await expect(enlarged).toBeVisible()
    // Author, where it came from and the licence, as `tree.yaml` writes it.
    await expect(enlarged.locator('.credit')).toContainText(image.credit)
    await page.keyboard.press('Escape')
    await expect(enlarged).toBeHidden()
  }
})

test("every Annex Option's picture is its target's first Image, on screen with a credit in the Tree this server is serving", async ({ page }) => {
  // elsa-tree/3 (tree-format.md 5.4): an Option has no Images of its own; the migration of #79
  // moved each Annex Option's picture to its target, where the target's own page shows it as
  // its main image (application.md 10.3).
  let checked = 0
  for (const nodeId of ANNEX_NODES) {
    const node = await tree.getNode(nodeId)
    expect(node, `${nodeId} cannot be read`).not.toBeNull()

    for (const option of node!.options) {
      const image = (await tree.getNode(option.target))!.images[0]
      expect(image, `${option.target} carries no Image`).toBeDefined()
      await page.goto(pageUrl([nodeId, option.target], 'en'))
      await expect(page.locator('.bubble a.main-image'), option.target).toHaveAttribute('href', imageHref(image!.file))
      expect(image!.credit, `${option.target}: ${image!.file} has no licence in its credit`).toMatch(OPEN_LICENCE)
      checked += 1
    }
  }
  // The 20 Annex I entries and the 8 Annex III areas: nothing a reader is shown is missing
  // its attribution in the data, so issue #55 is a display job and not a sourcing one.
  expect(checked, 'Annex Option pictures checked').toBe(28)
})

for (const lang of ['en', 'nl'] as const) {
  test(`every Node picture's credit is its accessible description and whole in the enlarged view, by keyboard, in ${lang}`, async ({ page }) => {
    // Where application.md 12.2 and 12.3 put it since #81, read by `credits.ts` without a click
    // at the guaranteed viewport this config sets.
    const byNode = await picturesByNode(tree, TREE_DIR)
    let read = 0
    for (const [nodeId, images] of byNode) {
      read += await readEveryCredit(page, pageUrl([nodeId], lang), images)
    }
    // 71 since #84: an Image on each of the 71 Nodes, the 28 Option pictures among them on their targets (NOTES.md 6).
    expect(read, 'Node pictures read').toBe(71)
    // Every Image in the Tree is one of them: no Option carries a second picture that no page shows.
    const nodes = await Promise.all([...byNode.keys()].map((id) => tree.getNode(id)))
    expect(nodes.reduce((sum, node) => sum + node!.images.length, 0)).toBe(71)
  })
}

test('the screenshots issue #81 owes of the first Tree: the start Node and its enlarged view, at 1280 x 640', async ({ page }) => {
  // `ELSA_SHOTS=1` writes the tracked set, as above; the viewport is this config's, the guaranteed one.
  const shots = fileURLToPath(
    process.env.ELSA_SHOTS === '1' ? new URL('../../docs/screenshots/issue-81/', import.meta.url) : new URL('.results/shots/', import.meta.url),
  )
  const shot = async (name: string): Promise<void> => {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(shots, `${name}.png`) })
  }

  await page.goto(`/${TREE}/start`)
  await shot('first-tree-start-1280x640')
  await page.locator('.bubble a.main-image').click()
  await expect(page.locator('.carousel-sheet .sheet-panel')).toBeVisible()
  await shot('first-tree-start-enlarged-1280x640')
})
