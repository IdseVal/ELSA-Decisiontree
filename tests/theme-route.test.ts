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
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const themeDir = path.join(here, '..', 'trees', 'ai-act-example', 'theme')

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
