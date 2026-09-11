/**
 * The interoperability test (docs/specs/application.md section 7): core document section 9,
 * first bullet, as a test. A Tree in one language, or in languages the chrome does not
 * speak, must render every Node without a code change.
 *
 * Every Node of every fixture is rendered in every language the fixture declares, with an
 * empty Trail and with a full one, and the language switch section 7 also names is checked
 * to offer exactly the languages the manifest declares -- no more, and never fewer.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { Disclaimer } from '../src/components/Disclaimer.tsx'
import { endonym, LanguageSwitch } from '../src/components/LanguageSwitch.tsx'
import { Logo } from '../src/components/Logo.tsx'
import { NodeView, text } from '../src/components/NodeView.tsx'
import { DEFAULT_COLOURS, themeStyle } from '../src/theme.ts'
import { openTree, type Tree } from '../src/tree/loader.ts'
import { parseUrl } from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))

// `themed` says which of the two paths of application.md section 7 the fixture covers: a
// Tree that carries a Theme and a Tree that carries none must both render.
const FIXTURES = [
  { name: 'single-language', themed: false, disclaimerIn: { nl: 'Dit is geen juridisch advies' } },
  { name: 'other-languages', themed: true, disclaimerIn: { de: 'This is not legal advice', fr: 'This is not legal advice' } },
  { name: 'german-only', themed: false, disclaimerIn: { de: 'This is not legal advice' } },
] as const

/**
 * The Node ids of a fixture, by walking it from its root through the loader: the Tree
 * interface hands out no list, and in `elsa-tree/2` there are no Node files to list
 * either. V-REACH means the walk reaches every Node.
 */
async function nodeIds(tree: Tree): Promise<string[]> {
  const found: string[] = []
  const queue = [tree.manifest.root]
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    if (found.includes(id)) continue
    const node = await tree.getNode(id)
    if (!node) throw new Error(`${tree.id} links to "${id}", which it does not contain`)
    found.push(id)
    if (node.kind === 'question') queue.push(node.answers.yes, node.answers.no)
    queue.push(...node.options.map((option) => option.target))
  }
  return found
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

/**
 * The languages the switch offers, in the order it offers them: the label of each entry,
 * whether it is a link to another language or the one the page is already in.
 */
function switchLanguages(html: string): string[] {
  return [...html.matchAll(/class="language(?: [^"]*)?"[^>]*>([^<]*)</g)].map((match) => match[1]!)
}

/**
 * A whole page: the chrome, the Node view and the permanent disclaimer, as the route
 * composes them. `theme` is the Tree's own unless a case wants to see it with one part of
 * it, which is how the independence of the three parts (application.md 13.4) is checked
 * against real Theme data rather than against a Theme written in a test.
 */
async function page(tree: Tree, url: string, theme = tree.manifest.theme): Promise<string> {
  const { pathname, searchParams } = new URL(url, 'https://example.org')
  // The `[lang]` segment the rewrite of 4.4 makes of the URL: these languages are all
  // well-formed tags, which it passes through unchanged.
  const address = parseUrl(pathname, searchParams.get('lang') ?? '_', tree)
  if (!address) throw new Error(`${url} is not a page of ${tree.id}`)
  const node = await tree.getNode(address.nodeId)
  if (!node) throw new Error(`${url} names no Node`)
  return renderToStaticMarkup(
    <>
      <header className="page-chrome">
        <Logo theme={theme} title={tree.manifest.title} lang={address.lang} />
        <LanguageSwitch address={address} languages={tree.manifest.languages} />
      </header>
      <main>
        <NodeView
          node={node}
          address={address}
          rootId={tree.manifest.root}
          trailTitles={address.trail.map((id) => tree.getTitle(id)!)}
        />
      </main>
      <Disclaimer lang={address.lang} />
    </>,
  )
}

describe.for(FIXTURES)('a Tree in $name', ({ name, themed, disclaimerIn }) => {
  test('every Node renders in every declared language, with and without a Trail', async () => {
    const dir = path.join(here, 'fixtures', name)
    const tree = await openTree(dir)
    const ids = await nodeIds(tree)

    expect(ids.length).toBeGreaterThan(0)
    expect(tree.manifest.languages).toEqual(Object.keys(disclaimerIn))
    // Both paths of section 7 are covered by these fixtures, and stay covered.
    expect(tree.manifest.theme === undefined, `${name} carries a Theme`).toBe(!themed)

    for (const language of tree.manifest.languages) {
      const query = language === tree.manifest.defaultLanguage ? '' : `?lang=${language}`
      for (const id of ids) {
        // Every other Node of the Tree as a Trail: adjacency is not checked (4.3).
        const trail = ids.filter((other) => other !== id)
        for (const url of [`/${name}/${id}${query}`, `/${name}/${[...trail, id].join('/')}${query}`]) {
          const html = await page(tree, url)
          const where = `${url} in ${language}`

          expect(asRead(html), where).toContain(text(tree.getTitle(id)!, language, `${id}.title`))
          expect(switchLanguages(html), where).toEqual(tree.manifest.languages.map(endonym))
          expect(html, where).toContain(disclaimerIn[language as keyof typeof disclaimerIn])
          expect(html, where).not.toContain('undefined')
          expect(html, where).not.toContain('[object Object]')
          expect(html, where).toContain(`lang="${language}"`)
        }
      }
    }
  })

  test('its Theme, or its absence, becomes a full set of custom properties', async () => {
    const tree = await openTree(path.join(here, 'fixtures', name))
    const { css } = themeStyle(tree.manifest.theme)

    // Never an empty block and never a missing one: a Tree with no Theme is a first-class
    // case, not an error path (application.md 13.4).
    for (const role of Object.keys(DEFAULT_COLOURS)) {
      expect(css, role).toMatch(new RegExp(`--elsa-${role}:#[0-9a-f]{6}`))
    }
    expect(css).toContain('--elsa-font-body:')

    const colours = tree.manifest.theme?.colours
    for (const [role, value] of Object.entries(colours ?? DEFAULT_COLOURS)) {
      expect(css, `${name}: ${role}`).toContain(`--elsa-${role}:${value}`)
    }
  })

  test('every part of a Theme is optional, and the page renders with any one of them', async () => {
    const tree = await openTree(path.join(here, 'fixtures', name))
    const url = `/${name}/${tree.manifest.root}`
    // The parts of a real Theme, taken one at a time. A fixture that carries none stands
    // in the other Trees' Themes here, so both fixtures cover all four shapes.
    const source = tree.manifest.theme ?? (await openTree(path.join(here, '..', 'trees', 'ai-act-example'))).manifest.theme!
    const parts = [
      { what: 'colours only', theme: { colours: source.colours } },
      { what: 'fonts only', theme: { fonts: source.fonts } },
      { what: 'logo only', theme: { logo: source.logo } },
    ]
    // A Theme with no logo, and a Tree with no Theme at all, both show the Tree's title in
    // the logo's place (13.4). The unthemed fixtures render exactly that in the test above.
    const title = text(tree.manifest.title, tree.manifest.defaultLanguage, 'tree.title')

    for (const { what, theme } of parts) {
      const html = await page(tree, url, theme)

      expect(html, what).not.toContain('undefined')
      expect(html, what).not.toContain('[object Object]')
      if (theme.logo) expect(asRead(html), what).toContain(`src="/theme/${theme.logo.light}"`)
      else expect(asRead(html), what).toContain(title)
    }
  })
})
