/**
 * The theme route, `GET /theme/<file>` (docs/specs/application.md 5.5): what it serves,
 * with which `Content-Type`, and the four ways it answers 404 without letting a caller
 * tell them apart.
 *
 * The route handler is called directly rather than over HTTP: what is asserted here is the
 * response it builds, and a browser adds nothing to that. What a browser does add --
 * whether the page actually asks for these files, and from which origin -- is
 * `tests/browser/theme.spec.ts`.
 */
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { IMAGE_TYPES, THEME_TYPES } from '../src/assets.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const trees = path.join(here, '..', 'trees')
const themeDir = path.join(trees, 'ai-act-example', 'theme')
const firstTree = path.join(trees, 'ai-act-applicability-agrifood')

// The served Tree is a run-time setting the route reads through `servedTree()`, so it is
// set before the route module is imported, exactly as a deployment sets it before start.
process.env.ELSA_TREE = 'ai-act-example'
process.env.ELSA_TREES_DIR = path.join(here, '..', 'trees')

let themeRoute: (request: Request, context: { params: Promise<{ lang: string; file: string }> }) => Promise<Response>
let imageRoute: typeof themeRoute

beforeAll(async () => {
  themeRoute = (await import('../src/app/[lang]/theme/[file]/route.ts')).GET
  imageRoute = (await import('../src/app/[lang]/images/[file]/route.ts')).GET
})

/** The route's answer for one requested name, as Next.js hands the segment over. */
function ask(route: () => typeof themeRoute, file: string): Promise<Response> {
  // `_` is the language segment the rewrite of 4.4 always supplies; this route ignores it.
  return route()(new Request(`https://example.org/theme/${file}`), {
    params: Promise.resolve({ lang: '_', file }),
  })
}

describe('a file the Theme names is served', () => {
  test.for([
    ['example-lab-logo.svg', 'image/svg+xml'],
    ['example-lab-logo-white.svg', 'image/svg+xml'],
    ['nova-square-400.woff2', 'font/woff2'],
  ])('%s is sent as %s, with the bytes on disk', async ([file, type]) => {
    const response = await ask(() => themeRoute, file!)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe(type)
    const served = Buffer.from(await response.arrayBuffer())
    expect(served.equals(await readFile(path.join(themeDir, file!)))).toBe(true)
  })

  test('the headers that make a third-party file inert are all there (5.3, 5.5)', async () => {
    const response = await ask(() => themeRoute, 'example-lab-logo.svg')

    expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'; sandbox")
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Content-Disposition')).toBe('inline')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
  })
})

describe('everything else answers 404, and the same 404', () => {
  test.for([
    // Malformed: the grammar of tree-format.md 3.6 admits none of these, and each is
    // refused before anything touches the file system.
    ['a path separator', 'nodes/start.yaml'],
    ['a Windows separator', 'nodes\\start.yaml'],
    ['a traversal', '../tree.yaml'],
    ['a percent-encoded traversal', '..%2Ftree.yaml'],
    ['an uppercase letter', 'Example-Lab-Logo.svg'],
    ['an extension the Theme has no use for', 'example-lab-logo.txt'],
    ['nothing at all', ''],
    // Well-formed, but not this Tree's.
    ['a name that is not in the folder', 'no-such-logo.svg'],
    // In the folder, and deliberately still not served: the format puts a font's licence
    // text beside the fonts and says the loader ignores it (tree-format.md 4.3.2).
    ['a theme file the Theme does not name', 'ofl-nova-square.txt'],
  ])('%s: %j', async ([, file]) => {
    const response = await ask(() => themeRoute, file!)

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('')
  })

  test('a font of another Tree is not reachable through this one', async () => {
    // The first Tree ships open-sans-400.woff2; the served Tree is the example one.
    const response = await ask(() => themeRoute, 'open-sans-400.woff2')

    expect(response.status).toBe(404)
  })
})

/**
 * The first Tree's own logo and tab icon are `.png`, and no `.png` reaches the theme route
 * above: the example Tree's Theme is two SVGs and a font. A `png` missing from
 * `THEME_TYPES` would be served as `application/octet-stream`, and `nosniff` then stops the
 * browser painting it -- silently, on the Tree this issue exists to theme, with the whole
 * suite green.
 *
 * The first Tree cannot be opened yet: it is over the format's length limits in 454 places
 * until issue #44 cuts its text, so `openTree` refuses it. Its Theme is finished, and a
 * Theme is independent of the content it dresses, so its `theme:` block and its whole
 * `theme/` folder are served over the example Tree's Nodes -- the same assembly
 * `tests/browser/theme.spec.ts` makes, and the bytes served are the first Tree's own.
 */
describe('the first Tree logo and tab icon are PNG, and arrive as PNG', () => {
  let firstRoute: typeof themeRoute
  let scratch: string

  beforeAll(async () => {
    scratch = await mkdtemp(path.join(tmpdir(), 'elsa-theme-route-'))
    const dir = path.join(scratch, 'ai-act-example')
    await cp(path.join(trees, 'ai-act-example'), dir, { recursive: true })
    await rm(path.join(dir, 'theme'), { recursive: true })
    await cp(path.join(firstTree, 'theme'), path.join(dir, 'theme'), { recursive: true })

    // The manifest is the first document of the stream (tree-format.md 4.1) and `theme:`
    // is last in it in both Trees, so one block swaps for the other by two searches.
    const first = await readFile(path.join(firstTree, 'tree.yaml'), 'utf8')
    const example = await readFile(path.join(dir, 'tree.yaml'), 'utf8')
    const nodesAt = (stream: string): number => stream.indexOf('\n---')
    const themeAt = (stream: string): number => stream.search(/^theme:$/m)
    const theme = first.slice(themeAt(first), nodesAt(first))
    const manifest = example.slice(0, themeAt(example))
    await writeFile(path.join(dir, 'tree.yaml'), manifest + theme + example.slice(nodesAt(example)))

    // A second served Tree needs a second module registry: `config.ts` memoises the Tree it
    // opened, and the route above closed over that one.
    vi.resetModules()
    process.env.ELSA_TREES_DIR = scratch
    firstRoute = (await import('../src/app/[lang]/theme/[file]/route.ts')).GET
  })

  afterAll(async () => {
    process.env.ELSA_TREES_DIR = path.join(here, '..', 'trees')
    await rm(scratch, { recursive: true, force: true })
  })

  test.for([
    ['elsa-lab-logo.png', 'the chrome bar logo'],
    ['favicon.png', 'the tab icon'],
  ])('%s (%s) is sent as image/png, with the first Tree bytes', async ([file]) => {
    const response = await ask(() => firstRoute, file!)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    const served = Buffer.from(await response.arrayBuffer())
    expect(served.equals(await readFile(path.join(firstTree, 'theme', file!)))).toBe(true)
  })

  test('the fonts of the first Tree travel with it', async () => {
    const response = await ask(() => firstRoute, 'open-sans-600.woff2')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('font/woff2')
  })
})

/*
 * The two `.png` cases above are the ones a Tree in this repository exercises; `webp` and
 * `ico` are in the grammar and in no Tree. Rather than invent a fixture for each, the two
 * tables are checked against the grammars they serve: an extension the format admits and
 * the table does not is the same `application/octet-stream` defect, found without a file.
 */
describe('every extension the format admits has a type', () => {
  test.for([
    ['theme files (3.6)', THEME_TYPES, ['svg', 'png', 'webp', 'ico', 'woff2']],
    ['image files (3.5)', IMAGE_TYPES, ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']],
  ] as const)('%s', ([, types, extensions]) => {
    expect(Object.keys(types).sort()).toEqual([...extensions].sort())
    for (const type of Object.values(types)) expect(type).not.toBe('application/octet-stream')
  })
})

describe('the image route answers by the same rule', () => {
  test('an Image of the served Tree is served with its own type', async () => {
    const response = await ask(() => imageRoute, 'eu-map.png')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'; sandbox")
  })

  test('a theme file is not reachable through the image route', async () => {
    expect((await ask(() => imageRoute, 'nova-square-400.woff2')).status).toBe(404)
  })
})
