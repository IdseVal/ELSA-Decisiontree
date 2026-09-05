/**
 * The interoperability test (docs/specs/application.md section 7): core document section 9,
 * first bullet, as a test. A Tree in one language, or in languages the chrome does not
 * speak, must render every Node without a code change.
 *
 * Every Node of every fixture is rendered in every language the fixture declares, with an
 * empty Trail and with a full one. The language switch, which section 7 also names, is
 * issue #9; this file will grow that assertion when the switch exists.
 */
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { Disclaimer } from '../src/components/Disclaimer.tsx'
import { NodeView, text } from '../src/components/NodeView.tsx'
import { openTree, type Tree } from '../src/tree/loader.ts'
import { parseUrl } from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))

const FIXTURES = [
  { name: 'single-language', disclaimerIn: { nl: 'Dit is geen juridisch advies' } },
  { name: 'other-languages', disclaimerIn: { de: 'This is not legal advice', fr: 'This is not legal advice' } },
  { name: 'german-only', disclaimerIn: { de: 'This is not legal advice' } },
] as const

/** The Node ids of a fixture, from its file names: the Tree interface hands out no list. */
async function nodeIds(dir: string): Promise<string[]> {
  const files = await readdir(path.join(dir, 'nodes'))
  return files.filter((file) => file.endsWith('.yaml')).map((file) => file.slice(0, -'.yaml'.length))
}

/**
 * The markup with its character escapes undone, so a title holding an apostrophe or an
 * ampersand can be looked for as the reader sees it. That the escaping happens at all is
 * `markdown.test.ts`'s subject, not this file's.
 */
function asRead(html: string): string {
  return html
    .replace(/&(#x27|#39);/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** A whole page: the Node view and the permanent disclaimer, as the route composes them. */
async function page(tree: Tree, url: string): Promise<string> {
  const { pathname, searchParams } = new URL(url, 'https://example.org')
  const address = parseUrl(pathname, searchParams, tree)
  if (!address) throw new Error(`${url} is not a page of ${tree.id}`)
  const node = await tree.getNode(address.nodeId)
  if (!node) throw new Error(`${url} names no Node`)
  return renderToStaticMarkup(
    <>
      <main>
        <NodeView node={node} address={address} rootId={tree.manifest.root} />
      </main>
      <Disclaimer lang={address.lang} />
    </>,
  )
}

describe.for(FIXTURES)('a Tree in $name', ({ name, disclaimerIn }) => {
  test('every Node renders in every declared language, with and without a Trail', async () => {
    const dir = path.join(here, 'fixtures', name)
    const tree = await openTree(dir)
    const ids = await nodeIds(dir)

    expect(ids.length).toBeGreaterThan(0)
    expect(tree.manifest.languages).toEqual(Object.keys(disclaimerIn))

    for (const language of tree.manifest.languages) {
      const query = language === tree.manifest.defaultLanguage ? '' : `?lang=${language}`
      for (const id of ids) {
        // Every other Node of the Tree as a Trail: adjacency is not checked (4.3).
        const trail = ids.filter((other) => other !== id)
        for (const url of [`/${name}/${id}${query}`, `/${name}/${[...trail, id].join('/')}${query}`]) {
          const html = await page(tree, url)
          const where = `${url} in ${language}`

          expect(asRead(html), where).toContain(text(tree.getTitle(id)!, language))
          expect(html, where).toContain(disclaimerIn[language as keyof typeof disclaimerIn])
          expect(html, where).not.toContain('undefined')
          expect(html, where).not.toContain('[object Object]')
          expect(html, where).toContain(`lang="${language}"`)
        }
      }
    }
  })
})
