/**
 * The theme and image routes, `GET /<tree-id>/theme/<file>` and `GET /<tree-id>/images/<file>`
 * (docs/specs/application.md 5.3, 5.5, 18.1): what they serve, with which `Content-Type`,
 * and the ways they answer 404 without letting a caller tell them apart -- **[#134]** a
 * hidden or unknown Tree among them (23.1).
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

type Route = (
  request: Request,
  context: { params: Promise<{ lang: string; tree: string; file: string }> },
) => Promise<Response>

let themeRoute: Route
let imageRoute: Route
let seed: string
let data: string

beforeAll(async () => {
  // The store is a run-time setting the routes read through `store()`, so it is named
  // before the route modules are imported, exactly as a deployment sets it before start:
  // both repository Trees, and a copy of the example one under another id, hidden.
  seed = await mkdtemp(path.join(tmpdir(), 'elsa-seed-'))
  data = await mkdtemp(path.join(tmpdir(), 'elsa-data-'))
  await cp(trees, seed, { recursive: true })
  await cp(path.join(trees, 'ai-act-example'), path.join(seed, 'hidden-copy'), { recursive: true })
  // A picture in the published Tree's folder that no Node names: a draft's upload (22.6).
  await writeFile(path.join(seed, 'ai-act-example', 'images', 'draft-upload.png'), await readFile(path.join(trees, 'ai-act-example', 'images', 'eu-map.png')))
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const { openStore } = await import('../src/store/index.ts')
  await openStore(data, { ELSA_ADMIN_PASSWORD: 'test administrator password', ELSA_SEED_DIR: seed })
  await rm(path.join(data, 'trees', 'hidden-copy', 'tree.json'))
  process.env.ELSA_DATA_DIR = data
  themeRoute = (await import('../src/app/[lang]/[tree]/theme/[file]/route.ts')).GET
  imageRoute = (await import('../src/app/[lang]/[tree]/images/[file]/route.ts')).GET
})

afterAll(async () => {
  await rm(seed, { recursive: true, force: true })
  await rm(data, { recursive: true, force: true })
})

/** The route's answer for one requested name of one Tree, as Next.js hands the segments over. */
function ask(route: () => Route, file: string, tree = 'ai-act-example'): Promise<Response> {
  // `_` is the language segment the rewrite of 4.4 always supplies; these routes ignore it.
  return route()(new Request(`https://example.org/${tree}/theme/${file}`), {
    params: Promise.resolve({ lang: '_', tree, file }),
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
    ['a path separator', 'fonts/nova-square-400.woff2'],
    ['a Windows separator', 'fonts\\nova-square-400.woff2'],
    ['a traversal', '../tree.json'],
    ['a percent-encoded traversal', '..%2Ftree.json'],
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
    // The first Tree ships open-sans-400.woff2; it is not the example Tree's.
    const response = await ask(() => themeRoute, 'open-sans-400.woff2')

    expect(response.status).toBe(404)
  })

  test.for([
    ['a hidden Tree', 'hidden-copy'],
    ['an unknown Tree', 'no-such-tree'],
    ['a reserved word', 'admin'],
  ])("%s's files are the 404 of an unknown file, on both routes (23.1)", async ([, tree]) => {
    // The hidden copy holds exactly the example Tree's files: only the store says no.
    for (const [route, file] of [
      [themeRoute, 'example-lab-logo.svg'],
      [imageRoute, 'eu-map.png'],
    ] as const) {
      const response = await ask(() => route, file, tree)

      expect(response.status, `${tree}/${file}`).toBe(404)
      expect(await response.text()).toBe('')
      expect([...response.headers.keys()]).toEqual([...(await ask(() => route, 'no-such-file.png')).headers.keys()])
    }
  })
})

/**
 * The first Tree's own logo and tab icon are `.png`, and no `.png` reaches the theme route
 * above: the example Tree's Theme is two SVGs and a font. A `png` missing from
 * `THEME_TYPES` would be served as `application/octet-stream`, and `nosniff` then stops the
 * browser painting it -- silently, on the Tree this issue exists to theme, with the whole
 * suite green. So the first Tree is served here as itself, from the same store.
 */
describe('the first Tree logo and tab icon are PNG, and arrive as PNG', () => {
  test.for([
    ['elsa-lab-logo.png', 'the chrome bar logo'],
    ['favicon.png', 'the tab icon'],
  ])('%s (%s) is sent as image/png, with the first Tree bytes', async ([file]) => {
    const response = await ask(() => themeRoute, file!, 'ai-act-applicability-agrifood')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    const served = Buffer.from(await response.arrayBuffer())
    expect(served.equals(await readFile(path.join(firstTree, 'theme', file!)))).toBe(true)
  })

  test('the fonts of the first Tree travel with it', async () => {
    const response = await ask(() => themeRoute, 'open-sans-600.woff2', 'ai-act-applicability-agrifood')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('font/woff2')
  })
})

/*
 * The two `.png` cases above are the ones a Tree in this repository exercises; `webp` and
 * `ico` are in the grammar and in no Tree. Rather than invent a fixture for each, each
 * table is pinned to a list transcribed here from the grammar it serves (`tree-format.md`
 * 3.6 and 3.5). That catches an entry leaving a table -- the `application/octet-stream`
 * defect, found without a file. It does not catch the format growing an extension:
 * `THEME_FILE` and `IMAGE_FILE` in `src/tree/validate.ts` are not exported, and the
 * grammars are frozen, so the list is transcribed rather than derived and this comment
 * says so.
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
  test('an Image of a served Tree is served with its own type', async () => {
    const response = await ask(() => imageRoute, 'eu-map.png')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'; sandbox")
  })

  test('a theme file is not reachable through the image route', async () => {
    expect((await ask(() => imageRoute, 'nova-square-400.woff2')).status).toBe(404)
  })

  test('a picture in the folder that no published Node names is not public (18.1, 22.6)', async () => {
    // What a draft's upload looks like to the public route: a real PNG in `images/`.
    expect((await ask(() => imageRoute, 'draft-upload.png')).status).toBe(404)
  })
})
