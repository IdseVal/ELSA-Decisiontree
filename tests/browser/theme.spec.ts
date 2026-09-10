/**
 * The Theme in a real browser (docs/specs/application.md 13.5, section 7). Three claims
 * that markup alone cannot settle:
 *
 * - **every request a themed page makes is on this origin.** Core document section 7 says
 *   nothing is fetched from a third party at run time; a font a stylesheet asks for is
 *   invisible in the HTML, so this is measured rather than asserted.
 * - **the logo is really on the page**, painted, not merely in the markup.
 * - **changing a colour in a Tree's `tree.yaml` and restarting changes the page**, with no
 *   code change. That is the whole point of hosting the look in the data
 *   (ADR-38-theme-delivery, Consequences), and it is one thing a unit test cannot show.
 *
 * The last one, and the screenshots, need servers this file starts itself: Playwright's own
 * server serves one Tree, and these want three more. Each is the same standalone build a
 * deployment runs, pointed at a copy of a Tree under a temporary folder -- no copy is
 * written inside the repository and every one is removed afterwards.
 *
 * Screenshots go to the gitignored results folder unless `ELSA_SHOTS=1` asks for the
 * tracked set in `docs/screenshots/issue-40/`, which is the convention
 * `tests/first-tree/walk.spec.ts` set: the app renders in whatever fonts and at whatever
 * device pixel ratio the machine has, so a committed PNG records one machine's rendering.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const trees = path.join(repo, 'trees')
const fixtures = path.join(repo, 'tests', 'fixtures')

const SHOTS = process.env.ELSA_SHOTS === '1'
  ? path.join(repo, 'docs', 'screenshots', 'issue-40')
  : path.join(repo, 'tests', 'browser', '.results', 'shots')

/** Ports for the servers this file starts; clear of playwright.config.ts's 3117/3118. */
const FIRST_PORT = Number(process.env.ELSA_TEST_PORT ?? 3117) + 13

const started: ChildProcess[] = []
const temporary: string[] = []

test.afterAll(async () => {
  for (const server of started) server.kill()
  for (const dir of temporary) await rm(dir, { recursive: true, force: true })
})

/** A folder that is removed when the suite ends. */
async function scratch(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'elsa-theme-'))
  temporary.push(dir)
  return dir
}

/**
 * The standalone server, serving `treeId` out of `treesDir`, answering on its own origin.
 * The same command `docs/deployment.md` gives, so what these tests see is what a
 * deployment serves.
 */
async function serve(treesDir: string, treeId: string, port: number): Promise<string> {
  const origin = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, [path.join('.next', 'standalone', 'server.js')], {
    cwd: repo,
    stdio: 'ignore',
    env: {
      ...process.env,
      ELSA_TREE: treeId,
      ELSA_TREES_DIR: treesDir,
      ELSA_BASE_URL: '',
      NEXT_TELEMETRY_DISABLED: '1',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
    },
  })
  started.push(server)

  const deadline = Date.now() + 30_000
  for (;;) {
    try {
      if ((await fetch(origin, { redirect: 'manual' })).status > 0) return origin
    } catch {
      if (Date.now() > deadline) throw new Error(`${treeId} did not start on ${port}`)
      await new Promise((wake) => setTimeout(wake, 250))
    }
  }
}

/** A Tree copied where a test may edit it. */
async function copyTree(from: string, id: string): Promise<{ treesDir: string; dir: string }> {
  const treesDir = await scratch()
  const dir = path.join(treesDir, id)
  await cp(from, dir, { recursive: true })
  return { treesDir, dir }
}

/**
 * A Tree's manifest split from its Nodes. The manifest is the first document of the stream
 * (tree-format.md 4.1), so the split is the first document separator.
 */
function split(stream: string): { manifest: string; nodes: string } {
  const at = stream.indexOf('\n---')
  return { manifest: stream.slice(0, at), nodes: stream.slice(at) }
}

/** A manifest's `theme:` block, which the format puts last in both of this repo's Trees. */
function themeBlock(manifest: string): string {
  const at = manifest.search(/^theme:$/m)
  expect(at, 'the manifest carries a theme block').toBeGreaterThan(-1)
  return manifest.slice(at)
}

/** Every URL the page asked for while `act` ran, in the order it asked. */
async function requests(page: Page, act: () => Promise<unknown>): Promise<string[]> {
  const asked: string[] = []
  const listen = (request: { url: () => string }): void => void asked.push(request.url())
  page.on('request', listen)
  try {
    await act()
    await page.waitForLoadState('networkidle')
  } finally {
    page.off('request', listen)
  }
  return asked
}

/** One custom property as the browser resolved it. */
function property(page: Page, name: string): Promise<string> {
  return page.evaluate(
    (which) => getComputedStyle(document.documentElement).getPropertyValue(which).trim(),
    name,
  )
}

test('a themed page asks nothing of any other host, and shows the logo', async ({ page, baseURL }) => {
  const own = new URL(baseURL!).host

  const asked = await requests(page, async () => {
    await page.goto('/ai-act-example/start')
    await expect(page.getByRole('img', { name: 'Example Lab' })).toBeVisible()
  })

  // Printed so the pull request can paste what was actually recorded, not a claim about it.
  console.log(`requests while loading /ai-act-example/start:\n${asked.map((url) => `  ${url}`).join('\n')}`)

  expect(asked.length).toBeGreaterThan(0)
  expect(asked.filter((url) => new URL(url).host !== own)).toEqual([])
  // The Theme's own files, fetched from the Tree's folder through the theme route (5.5).
  expect(asked.some((url) => url.endsWith('/theme/nova-square-400.woff2'))).toBe(true)
  expect(asked.some((url) => url.endsWith('/theme/example-lab-logo-white.svg'))).toBe(true)
})

test('the logo links out but is never fetched, and the dark variant is the one shown', async ({ page }) => {
  await page.goto('/ai-act-example/start')

  // The example Tree's palette is dark, so 13.1's derivation picks `logo.dark`.
  await expect(page.locator('img.logo')).toHaveAttribute('src', '/theme/example-lab-logo-white.svg')
  await expect(page.locator('a.logo-link')).toHaveAttribute('href', 'https://example.org')
  await expect(page.locator('a.logo-link')).toHaveAttribute('rel', 'noopener noreferrer')
  expect(await property(page, '--elsa-background')).toBe('#161a1d')
})

test('changing a colour in tree.yaml and restarting changes the page, with no code change', async ({ page }) => {
  const { treesDir, dir } = await copyTree(path.join(trees, 'ai-act-example'), 'ai-act-example')
  const file = path.join(dir, 'tree.yaml')
  const before = await readFile(file, 'utf8')
  const changed = before.replace('accent: "#e2604a"', 'accent: "#00c2a8"')
  expect(changed, 'the accent line the Tree is edited at').not.toBe(before)
  await writeFile(file, changed)

  const origin = await serve(treesDir, 'ai-act-example', FIRST_PORT)
  await page.goto(`${origin}/ai-act-example/start`)

  expect(await property(page, '--elsa-accent')).toBe('#00c2a8')
  // The one place the accent is painted whole: the filled Answer (globals.css).
  const painted = await page
    .locator('.answer--yes')
    .evaluate((element) => getComputedStyle(element).backgroundColor)
  expect(painted).toBe('rgb(0, 194, 168)')

  // The same build, unedited: the served bytes of the app are identical in both servers.
  expect(await property(page, '--elsa-danger')).toBe('#ff8a7a')
})

test('the same build, three looks: the AI4SFS Theme, the example Tree, and no Theme at all', async ({ page }) => {
  /*
   * The first Tree cannot be served yet: it is over the format's length limits in 454
   * places until issue #44 cuts it, so `openTree` refuses it and the server exits. Its
   * THEME is finished, though, and a Theme is independent of the content it dresses -- so
   * this serves the first Tree's theme block and its theme/ folder over the example Tree's
   * Nodes. What the screenshot shows is the first Tree's look, file for file and colour for
   * colour; only the words under it belong to another Tree.
   */
  const { treesDir, dir } = await copyTree(path.join(trees, 'ai-act-example'), 'ai-act-example')
  const first = split(await readFile(path.join(trees, 'ai-act-applicability-agrifood', 'tree.yaml'), 'utf8')).manifest
  const example = split(await readFile(path.join(dir, 'tree.yaml'), 'utf8'))
  const manifest = example.manifest.slice(0, example.manifest.search(/^theme:$/m))
  await writeFile(path.join(dir, 'tree.yaml'), `${manifest}${themeBlock(first)}${example.nodes}`)
  await rm(path.join(dir, 'theme'), { recursive: true })
  await cp(path.join(trees, 'ai-act-applicability-agrifood', 'theme'), path.join(dir, 'theme'), { recursive: true })

  const looks = [
    { shot: 'first-tree-theme', origin: await serve(treesDir, 'ai-act-example', FIRST_PORT + 1), url: '/ai-act-example/start' },
    { shot: 'example-tree-theme', origin: '', url: '/ai-act-example/start' },
    { shot: 'no-theme-default', origin: await serve(fixtures, 'single-language', FIRST_PORT + 2), url: '/single-language/start' },
  ]

  for (const { shot, origin, url } of looks) {
    await page.goto(`${origin}${url}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.screenshot({ path: path.join(SHOTS, `${shot}.png`), fullPage: true })
  }

  // The AI4SFS look, as measured by issue #36 and written into the first Tree's manifest.
  await page.goto(`${looks[0]!.origin}${looks[0]!.url}`)
  expect(await property(page, '--elsa-accent')).toBe('#ffc600')
  expect(await property(page, '--elsa-on-accent')).toBe('#2d2e33')
  await expect(page.locator('img.logo')).toHaveAttribute('src', '/theme/elsa-lab-logo.png')
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/theme/favicon.png')

  // A Tree with no Theme is a first-class case: the plain default look, and no theme file.
  const plain = await requests(page, () => page.goto(`${looks[2]!.origin}${looks[2]!.url}`))
  expect(plain.filter((url) => url.includes('/theme/'))).toEqual([])
  expect(await property(page, '--elsa-background')).toBe('#fbfaf6')
  await expect(page.locator('.tree-title')).toHaveText('Is de AI-verordening van toepassing?')
})
