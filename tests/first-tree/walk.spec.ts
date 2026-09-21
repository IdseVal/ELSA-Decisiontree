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
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { arrived } from '../browser/arrived.ts'
import { BASE_PORT, serve, stopServers } from '../browser/serve.ts'
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

test('an Option opens its explanation-only child in an Overlay over the question, and the cross is the way back (10.9)', async ({ page }) => {
  await walk(page, WALKS.prohibited!.slice(0, 3))
  const question = `/${TREE}/start/article-2-exclusions/ai-system-definition/prohibited-practices`

  const overlay = page.locator('.options .overlay', { has: page.locator('.option-title', { hasText: 'Social scoring' }) })
  await overlay.locator('.sheet-open').click()
  await expect(overlay.locator('.sheet-panel')).toBeVisible()
  // The address is the question's: a disclosure does nothing to the address bar (10.9).
  await expect(page).toHaveURL(question)

  // Explanation only: no Answers of its own in the Overlay; its heading is the child's own address.
  await expect(overlay.locator('.sheet-panel').getByRole('link', { name: CHROME.en.yes, exact: true })).toHaveCount(0)
  await expect(overlay.locator('.sheet-panel').getByRole('link', { name: CHROME.en.no, exact: true })).toHaveCount(0)
  await expect(overlay.locator('h2 a')).toHaveAttribute('href', `${question}/social-scoring`)

  // The way back is the cross, and the focus returns to the button beside the Bubble.
  await overlay.locator('.sheet-close').click()
  await expect(overlay.locator('.sheet-panel')).toBeHidden()
  await expect(overlay.locator('.sheet-open')).toBeFocused()
  await expect(page).toHaveURL(question)

  // The child's own URL renders the question with that Overlay open (core document 10.27).
  await page.goto(`${question}/social-scoring`)
  await expect(page.locator('.overlay[open] h2 a')).toHaveText('Social scoring')
  await expect(page.locator('h1')).toHaveText('Does your system do a prohibited practice? (1/2)')
  // The up arrow is the question's own (#82): with the Overlay open it still leads above the question.
  await expect(page.locator('.up-arrow')).toHaveAttribute('href', `/${TREE}/start/article-2-exclusions/ai-system-definition`)
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

  // The Option opens its Overlay over the question (10.9); Escape closes it and the walk goes on.
  await page.locator('.options .sheet-open', { hasText: lang === 'en' ? 'Social scoring' : 'Sociale scoring' }).click()
  await expect(page.locator('.overlay[open] .sheet-panel')).toBeVisible()
  await shot('explanation-child')

  await page.keyboard.press('Escape')
  await expect(page.locator('.overlay[open]')).toHaveCount(0)
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
  test(`${nodeId} shows its own picture and its Options' targets' on their buttons, all from this server`, async ({ page, baseURL }) => {
    // Issue #45: the Annex I and Annex III lists are the two the core document (3.3, items
    // 4a and 4b) asks for a picture on every entry of. Since elsa-tree/3 (#79) an entry's
    // picture is its target's first Image, checked in "every Annex Option's picture is its
    // target's first Image" below, and since #80 the Option's button shows it (10.3): this
    // page asks for its own and for one per Option.
    // The requests are recorded over the LAST click only, so what is counted is what this
    // one Node costs a reader, not what the whole walk to it did.
    const visited = await walk(page, steps.slice(0, -1))
    const asked: string[] = []
    page.on('request', (request) => asked.push(request.url()))
    const last = steps[steps.length - 1]!
    await clickAnswer(page, 'en', last.answer)
    visited.push(last.lands)
    await arrived(page, pageUrl(visited, 'en'))

    const options = await page.locator('.options > li').count()
    expect(options, `${nodeId} shows no Options`).toBeGreaterThan(0)
    // Each button shows its target's main image (application.md 10.3); the first Tree's targets all carry one.
    await expect(page.locator('img.option-image')).toHaveCount(options)
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
    // Its own main image and one file per Option button, the target's main image; the closed
    // Overlays' strips are lazy and ask for nothing. Nine on `annex-i-legislation`, as
    // ADR-78-fan-out-and-option-picture.md's Consequences count it.
    const pictures = asked.filter((url) => new URL(url).pathname.startsWith('/images/'))
    expect(new Set(pictures).size, 'a picture asked for twice').toBe(pictures.length)
    expect(pictures.length).toBe(1 + options)
    if (nodeId === 'annex-i-legislation') expect(pictures.length).toBe(9)

    await page.screenshot({ path: path.join(PICTURE_SHOTS, `${nodeId}.png`), fullPage: true })
  })
}

/**
 * What a reader can actually SEE of a picture's credit -- the one behaviour issue #45
 * introduced that nothing tested.
 *
 * 23 of the 28 Option pictures and 5 of the 7 Node pictures are CC BY or CC BY-SA, and
 * those licences ask for the attribution to be given where the work is shared. So "the
 * credit is in `tree.json`" is not the behaviour that matters to them; "a reader is shown
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
    // Author, where it came from and the licence, as `tree.json` writes it.
    await expect(enlarged.locator('.credit')).toContainText(image.credit)
    await page.keyboard.press('Escape')
    await expect(enlarged).toBeHidden()
  }
})

test("every Annex Option's picture is its target's first Image, on screen with a credit in the Tree this server is serving", async ({ page }) => {
  // elsa-tree/3 (tree-format.md 5.4): an Option has no Images of its own; the migration of #79
  // moved each Annex Option's picture to its target, whose main image the Option's button and
  // its Overlay show (application.md 10.3, 10.9).
  let checked = 0
  for (const nodeId of ANNEX_NODES) {
    const node = await tree.getNode(nodeId)
    expect(node, `${nodeId} cannot be read`).not.toBeNull()

    await page.goto(pageUrl([nodeId], 'en'))
    const shown = await page
      .locator('img.option-image')
      .evaluateAll((images) => images.map((image) => new URL((image as HTMLImageElement).src).pathname))
    expect(shown.length, `${nodeId}: pictures on screen`).toBe(node!.options.length)

    for (const option of node!.options) {
      const image = (await tree.getNode(option.target))!.images[0]
      expect(image, `${option.target} carries no Image`).toBeDefined()
      // On the Option's button, and in the Overlay the button opens (application.md 10.3, 10.9).
      expect(shown, `${option.target}: not on its Option's button`).toContain(imageHref(image!.file))
      await expect(
        page.locator(`.overlay-interior[data-node="${option.target}"] a.main-image`),
        option.target,
      ).toHaveAttribute('href', imageHref(image!.file))
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

/**
 * Issue #87: the owner's nine display changes of #75 (core document 3.2, the `[#75]`
 * bullets), walked by clicking on the first Tree once #79 to #86 merged, in both languages,
 * at the guaranteed viewport and at 1920 x 1080. One screenshot is taken where each point is
 * best seen, and on each screenshot's page the numbers the specs promise are measured and
 * written to `measurements.md` beside the screenshots: 10.6's no-scroll test with the
 * Overlay or the explainer panel open, the requests of the heaviest Node, the Answer
 * buttons' colours, the fan's geometry and the copied link. What another spec owns -- the
 * label's contrast, the heaviest Node's picture count, the Carousel's missing caption -- is
 * recorded or photographed here, not asserted again.
 *
 * The Carousel (point 5) is photographed on `tests/fixtures/carousel/`, served beside the
 * first Tree: no Node of the first Tree has a second Image, so its strip is empty everywhere
 * (71 Images on 71 Nodes, counted above).
 *
 * `ELSA_SHOTS=1` writes the tracked set to `docs/screenshots/issue-87/`, as above.
 */
const ISSUE_87 = fileURLToPath(
  process.env.ELSA_SHOTS === '1'
    ? new URL('../../docs/screenshots/issue-87/', import.meta.url)
    : new URL('.results/shots/issue-87/', import.meta.url),
)

/** The two viewports of the walk: the guaranteed one (10.4) and a common desktop. */
const VIEWPORTS = [
  [1280, 640],
  [1920, 1080],
] as const

/** Clear of `tests/browser/`'s ports (no-scroll 20-29, carousel 30, chrome-clearance and overlay 40-41, explainer 50). */
const CAROUSEL_PORT = BASE_PORT + 60

/** The words the walk checks on screen, per language (src/chrome.ts, the Tree's explainer). */
const WORDS_87 = {
  en: { sources: 'Legal sources', provider: 'provider' },
  nl: { sources: 'Juridische bronnen', provider: 'aanbieder' },
} as const

/** One page measured by the walk: 10.6's numbers and whatever the point adds. */
interface Measured87 {
  page: string
  lang: Lang
  viewport: string
  doc: string
  body: string
  overflowing: string[]
  notes: string[]
}

const measured87: Measured87[] = []
const requests87: string[] = []

let carouselOrigin: Promise<string | null> | undefined

test.afterAll(async () => {
  await stopServers()
  if (measured87.length === 0) return
  await mkdir(ISSUE_87, { recursive: true })
  const rows = measured87.map(
    (m) => `| ${m.page} | ${m.lang} | ${m.viewport} | ${m.doc} | ${m.body} | ${m.overflowing.length} | ${m.notes.join('; ')} |`,
  )
  await writeFile(
    path.join(ISSUE_87, 'measurements.md'),
    [
      '# Issue #87: what the walk measured',
      '',
      'Written by `tests/first-tree/walk.spec.ts` (the #87 block). Window, document and body are',
      '`width x height` (the document and the body as `scrollWidth x scrollHeight`); "overflowing"',
      'counts the elements other than the Carousel strip whose content is larger than',
      'themselves (application.md 10.6).',
      '',
      '| page | lang | window | document | body | overflowing | also measured |',
      '|---|---|---|---|---|---|---|',
      ...rows,
      '',
      '## Requests on arriving at the heaviest Node, annex-i-legislation, by a click',
      '',
      ...requests87,
      '',
    ].join('\n'),
  )
})

/**
 * 10.6's test on the page as it stands -- a Sheet or a panel left open stays open -- asserted
 * with 10.6's one-pixel tolerance, and the exact sizes recorded for `measurements.md`.
 */
async function noScroll(page: Page, name: string, lang: Lang, notes: string[] = []): Promise<void> {
  await page.evaluate(() => document.fonts.ready)
  const m = await page.evaluate(() => {
    const overflowing: string[] = []
    for (const el of document.querySelectorAll('*')) {
      if (el.matches('[data-carousel-strip]')) continue
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
        overflowing.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`)
      }
    }
    const size = (el: Element) => ({ w: el.scrollWidth, h: el.scrollHeight })
    return {
      inner: { w: window.innerWidth, h: window.innerHeight },
      doc: size(document.documentElement),
      body: size(document.body),
      overflowing,
    }
  })
  const text = (b: { w: number; h: number }): string => `${b.w} x ${b.h}`
  measured87.push({ page: name, lang, viewport: text(m.inner), doc: text(m.doc), body: text(m.body), overflowing: m.overflowing, notes })
  for (const [what, b] of [['document', m.doc], ['body', m.body]] as const) {
    expect(b.h, `${name}: the ${what} is taller than the window`).toBeLessThanOrEqual(m.inner.h + 1)
    expect(b.w, `${name}: the ${what} is wider than the window`).toBeLessThanOrEqual(m.inner.w + 1)
  }
  expect(m.overflowing, `${name}: elements larger inside than out`).toEqual([])
}

/**
 * A viewport-sized screenshot, once the pictures have arrived. The pointer is parked on the
 * disclaimer first, unless `hovering`: left where the last click was, it hovers the Answer
 * button the next page puts under it, whose hover ring then reads as a difference between the two.
 */
async function shot87(page: Page, name: string, lang: Lang, hovering = false): Promise<void> {
  await page.waitForLoadState('networkidle')
  const { width, height } = page.viewportSize()!
  if (!hovering) await page.mouse.move(width / 2, height - 4)
  await page.screenshot({ path: path.join(ISSUE_87, `${name}-${lang}-${width}x${height}.png`) })
}


for (const [width, height] of VIEWPORTS) {
  for (const lang of ['en', 'nl'] as const) {
    test(`issue #87: the owner's nine points of #75, walked by clicking, in ${lang} at ${width} x ${height}`, async ({ page, context }) => {
      test.setTimeout(120_000)
      await page.setViewportSize({ width, height })
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])

      // Points 1, 2, 4, 6 and 7 on the root: the Sources' heading, "provider" hovered, the
      // main image above the title, the two Answer buttons, and no arrow where nothing is above.
      await page.goto(pageUrl(['start'], lang))
      await expect(page.locator('.bubble .sources h2')).toHaveText(WORDS_87[lang].sources)
      await expect(page.locator('.up-arrow')).toHaveCount(0)
      const imageAboveTitle = await page.evaluate(
        () =>
          document.querySelector('.bubble .main-image')!.getBoundingClientRect().bottom <=
          document.querySelector('.bubble h1')!.getBoundingClientRect().top,
      )
      expect(imageAboveTitle, 'the main image sits above the title').toBe(true)

      const answers = await page.locator('.answer').evaluateAll((buttons) =>
        buttons.map((button) => {
          const style = getComputedStyle(button)
          const label = getComputedStyle(button.querySelector('.branch-label')!)
          const box = button.getBoundingClientRect()
          return {
            fill: style.backgroundColor,
            radius: style.borderRadius,
            size: `${box.width} x ${box.height}`,
            ink: label.color,
            font: `${label.fontSize} ${label.fontWeight}`,
          }
        }),
      )
      expect(answers).toHaveLength(2)
      const [yes, no] = answers
      // The same layout, in the logo's green #159a2f (core document 3.2); the label's contrast
      // on it is contrast.spec.ts's.
      expect(no).toEqual(yes)
      expect(yes!.fill).toBe('rgb(21, 154, 47)')
      await noScroll(page, 'start', lang, [
        `Answer buttons ${yes!.size}, radius ${yes!.radius}, fill ${yes!.fill}, label ${yes!.ink} ${yes!.font}`,
      ])
      // Taken before the hover: the open panel lies over the Sources' heading.
      await shot87(page, '1-4-6-start', lang)

      const term = page.locator('.bubble .term', { hasText: WORDS_87[lang].provider }).first()
      await term.hover()
      const panel = page.locator(`[id="${await term.getAttribute('aria-describedby')}"]`)
      await expect(panel).toBeVisible()
      const panelBox = (await panel.boundingBox())!
      await noScroll(page, 'start, "provider" hovered', lang, [
        `explainer panel ${Math.round(panelBox.width)} x ${Math.round(panelBox.height)}`,
      ])
      await shot87(page, '2-start-provider-hovered', lang, true)

      // Point 3, and 4 in the Overlay: an Option opens its target in an Overlay with a cross,
      // and a click outside it closes it.
      await clickAnswer(page, lang, 'yes')
      const toArticle2 = ['start', 'article-2-exclusions']
      await arrived(page, pageUrl(toArticle2, lang))
      const research = page.locator('.options .overlay', { has: page.locator('[data-node="exclusion-research-and-development"]') })
      await research.locator('.sheet-open').click()
      const overlay = research.locator('.sheet-panel')
      await expect(overlay).toBeVisible()
      await expect(overlay.locator('.sheet-close--cross')).toBeVisible()
      await expect(overlay.locator('.main-image img')).toHaveCount(1)
      const overlayBox = (await overlay.boundingBox())!
      await noScroll(page, 'article-2-exclusions, Overlay on the research exclusion', lang, [
        `Overlay panel ${Math.round(overlayBox.width)} x ${Math.round(overlayBox.height)}`,
      ])
      await shot87(page, '3-4-article-2-exclusions-overlay', lang)
      // Outside the panel: the page's left edge at mid-height, which the backdrop covers.
      await page.mouse.click(4, height / 2)
      await expect(page.locator('.overlay[open]')).toHaveCount(0)
      await expect(page).toHaveURL(pageUrl(toArticle2, lang))

      // Point 7: three steps in, no Trail drawn, and the up arrow goes one step back.
      await clickAnswer(page, lang, 'no')
      await arrived(page, pageUrl([...toArticle2, 'ai-system-definition'], lang))
      await clickAnswer(page, lang, 'yes')
      const toProhibited = [...toArticle2, 'ai-system-definition', 'prohibited-practices']
      await arrived(page, pageUrl(toProhibited, lang))
      await expect(page.locator('.trail, .trail-branch')).toHaveCount(0)
      await expect(page.locator('.up-arrow')).toHaveCount(1)
      await noScroll(page, 'prohibited-practices, three steps in', lang)
      await shot87(page, '7-prohibited-practices-up-arrow', lang)
      await page.locator('.up-arrow').click()
      await arrived(page, pageUrl(toProhibited.slice(0, -1), lang))

      // The heaviest Node, annex-i-legislation: what the click that opens it asks for, recorded;
      // the count is asserted by the requests test above.
      await clickAnswer(page, lang, 'yes')
      await arrived(page, pageUrl(toProhibited, lang))
      await clickAnswer(page, lang, 'no')
      await arrived(page, pageUrl([...toProhibited, 'prohibited-practices-2'], lang))
      const asked: string[] = []
      const record = (request: { url(): string; resourceType(): string }): void => {
        asked.push(`${request.resourceType()} ${new URL(request.url()).pathname}${new URL(request.url()).search}`)
      }
      page.on('request', record)
      await clickAnswer(page, lang, 'no')
      const toAnnexI = [...toProhibited, 'prohibited-practices-2', 'annex-i-legislation']
      await arrived(page, pageUrl(toAnnexI, lang))
      await page.waitForLoadState('networkidle')
      page.off('request', record)
      const pictures = asked.filter((line) => line.includes(' /images/'))
      requests87.push(
        `- ${lang}, ${width} x ${height}: ${asked.length} requests, ${pictures.length} of them image files`,
        ...asked.map((line) => `  - \`${line}\``),
      )
      await noScroll(page, 'annex-i-legislation, the heaviest Node', lang, [`${asked.length} requests, ${pictures.length} pictures`])

      // Point 8, and 4 on the buttons: the Annex I step (2/3), its Option buttons fanned out.
      await clickAnswer(page, lang, 'no')
      const toAnnexI2 = [...toAnnexI, 'annex-i-legislation-2']
      await arrived(page, pageUrl(toAnnexI2, lang))
      const buttons = await page.locator('.options .sheet-open').evaluateAll((all) =>
        all.map((button) => {
          const box = button.getBoundingClientRect()
          return {
            x: Math.round(box.x),
            w: Math.round(box.width),
            h: Math.round(box.height),
            font: getComputedStyle(button.querySelector('.option-title')!).fontSize,
          }
        }),
      )
      await expect(page.locator('.options img.option-image')).toHaveCount(buttons.length)
      expect(new Set(buttons.map((b) => b.font))).toEqual(new Set(['16px']))
      await noScroll(page, 'annex-i-legislation-2, the fan', lang, [
        `${buttons.length} Option buttons ${buttons[0]!.w} x ${buttons[0]!.h}, titles at 16px, left edges ${buttons.map((b) => b.x).join(', ')}`,
      ])
      await shot87(page, '8-4-annex-i-legislation-2-fan', lang)

      // Point 9: the copy-link button puts the page's own link on the clipboard.
      await page.locator('.share').click()
      await expect(page.locator('.share-said')).not.toBeEmpty()
      const copied = await page.evaluate(() => navigator.clipboard.readText())
      expect(copied).toBe(page.url())
      await noScroll(page, 'annex-i-legislation-2, after the copy-link click', lang, [`clipboard: ${copied}`])
      await shot87(page, '9-copy-link', lang)

      // Point 5: the Carousel, on the fixture's Node with five Images.
      carouselOrigin ??= serve(fileURLToPath(new URL('../fixtures', import.meta.url)), 'carousel', CAROUSEL_PORT)
      const origin = await carouselOrigin
      expect(origin, 'the Carousel fixture did not start').not.toBeNull()
      await page.goto(`${origin}/carousel/five${lang === 'en' ? '' : '?lang=nl'}`)
      await expect(page.locator('.carousel .thumbnail')).toHaveCount(4)
      // No buttons beside the strip; the closed enlarged view's own controls are not on screen.
      await expect(page.locator('.carousel button:visible')).toHaveCount(0)
      await expect(page.locator('[data-carousel-strip]')).toBeVisible()
      const carousel = await page.evaluate(() => {
        const strip = document.querySelector('[data-carousel-strip]')!.getBoundingClientRect()
        return {
          centre: Math.round(strip.top + strip.height / 2),
          outline: Math.round(document.querySelector('.bubble')!.getBoundingClientRect().bottom),
        }
      })
      expect(Math.abs(carousel.centre - carousel.outline), "the strip on the Bubble's lower edge").toBeLessThanOrEqual(2)
      await noScroll(page, 'carousel fixture, five Images', lang, [`strip centre y ${carousel.centre}, Bubble bottom ${carousel.outline}`])
      await shot87(page, '5-carousel-fixture', lang)
    })
  }
}
