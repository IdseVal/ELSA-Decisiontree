/**
 * The URL scheme of docs/specs/application.md section 4: parsing and building are
 * inverses, every 404 case of 4.3 is one, and the Trail is the path.
 *
 * The Tree comes from the loader, as section 7 requires; nothing here builds one by hand.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'
import { openTree, type Tree } from '../src/tree/loader.ts'
import {
  absolute,
  addressSet,
  canonicalHref,
  SCHEMA_HREF,
  contentLanguage,
  followHref,
  datasetHref,
  imageHref,
  MAX_PATH_IDS,
  nodeHref,
  parseUrl,
  trailHref,
  withLang,
  type PageAddress,
} from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
let tree: Tree
let dutchTree: Tree

beforeAll(async () => {
  tree = await openTree(path.join(here, '..', 'trees', 'ai-act-example'))
  dutchTree = await openTree(path.join(here, 'fixtures', 'single-language'))
})

/**
 * `parseUrl` on a whole public URL, the way a request arrives. The `[lang]` segment is what
 * the rewrite of 4.4 makes of the query: every `lang` here is a well-formed tag, which that
 * rule passes through unchanged, and an absent one becomes the sentinel. What the router
 * accepts as a tag is `routing.test.ts`'s subject; what a segment means is this file's.
 */
function parse(url: string, on: Tree = tree): PageAddress | null {
  const { pathname, searchParams } = new URL(url, 'https://example.org')
  return parseUrl(pathname, searchParams.get('lang') ?? '_', on)
}

describe('reading an address', () => {
  test('the URL of a Node is the page with an empty Trail', () => {
    expect(parse('/ai-act-example/prohibited-practices')).toEqual({
      treeId: 'ai-act-example',
      trail: [],
      nodeId: 'prohibited-practices',
      lang: 'en',
      defaultLang: 'en',
    })
  })

  test('the ids before the last one are the Trail, in the order visited', () => {
    const address = parse('/ai-act-example/start/prohibited-practices/social-scoring')

    expect(address?.trail).toEqual(['start', 'prohibited-practices'])
    expect(address?.nodeId).toBe('social-scoring')
  })

  test('a declared lang is the content language; an undeclared one is ignored', () => {
    expect(parse('/ai-act-example/start?lang=nl')?.lang).toBe('nl')
    expect(parse('/ai-act-example/start?lang=de')?.lang).toBe('en')
    expect(parse('/ai-act-example/start')?.lang).toBe('en')
  })

  test('the default language is the first the Tree declares, whatever it is', () => {
    expect(parse('/single-language/start', dutchTree)).toMatchObject({ lang: 'nl', defaultLang: 'nl' })
  })

  test('other query parameters are ignored', () => {
    expect(parse('/ai-act-example/start?utm_source=mail')?.nodeId).toBe('start')
  })

  test('a Trail is not checked for adjacency: any sequence of Node ids is accepted', () => {
    expect(parse('/ai-act-example/prohibited/covered/start')?.nodeId).toBe('start')
  })

  test(`${MAX_PATH_IDS} ids are accepted and one more is not`, () => {
    const ids = (count: number): string => Array.from({ length: count }, () => 'start').join('/')

    expect(parse(`/ai-act-example/${ids(MAX_PATH_IDS)}`)?.trail).toHaveLength(MAX_PATH_IDS - 1)
    expect(parse(`/ai-act-example/${ids(MAX_PATH_IDS + 1)}`)).toBeNull()
  })
})

describe('the language a segment means', () => {
  // The rule of 4.3, second bullet: `src/url.ts` receives a segment, never a query. It is
  // read twice per page -- by the root layout for `<html lang>` and by the page through
  // `parseUrl` -- and the two may never disagree.
  test('a language the Tree declares is that language', () => {
    expect(contentLanguage(tree, 'nl')).toBe('nl')
    expect(contentLanguage(dutchTree, 'nl')).toBe('nl')
  })

  test('any other segment is the Tree default, the router sentinel included', () => {
    // `_` is how 4.4 spells "no language was asked for"; it needs no branch here, because
    // no Tree declares it and an undeclared language already means the default one.
    for (const segment of ['_', 'de', 'pt-BR', 'NL']) {
      expect(contentLanguage(tree, segment), segment).toBe('en')
      expect(contentLanguage(dutchTree, segment), segment).toBe('nl')
    }
  })

  test('`parseUrl` resolves the segment by that same rule', () => {
    for (const segment of ['nl', 'de', '_']) {
      expect(parseUrl('/ai-act-example/start', segment, tree)?.lang, segment).toBe(
        contentLanguage(tree, segment),
      )
    }
  })
})

describe('an address that is not a page of this Tree', () => {
  // The 404 table of docs/specs/application.md 4.3.
  const cases: Array<{ what: string; url: string }> = [
    { what: 'another Tree id', url: '/other-tree/start' },
    { what: 'no Node id at all', url: '/ai-act-example' },
    { what: 'the bare root', url: '/' },
    { what: 'an id that is not a Node of the Tree', url: '/ai-act-example/no-such-node' },
    { what: 'a malformed id', url: '/ai-act-example/Start' },
    { what: 'an id with a path escape', url: '/ai-act-example/..%2F..%2Fetc%2Fpasswd' },
    { what: 'a Cross-link, reserved for a later format', url: '/ai-act-example/other:start' },
    { what: 'a Trail entry that is not a Node', url: '/ai-act-example/ghost/start' },
    { what: 'the images route, which is not a Tree', url: '/images/eu-map.png' },
  ]

  test.for(cases)('$what answers 404', ({ url }) => {
    expect(parse(url)).toBeNull()
  })
})

describe('building an address', () => {
  test('parsing and building are inverses', () => {
    for (const url of [
      '/ai-act-example/start',
      '/ai-act-example/start/prohibited-practices/social-scoring',
      '/ai-act-example/start?lang=nl',
      '/ai-act-example/start/prohibited-practices?lang=nl',
    ]) {
      expect(nodeHref(parse(url)!)).toBe(url)
    }
  })

  test('following a Link puts the Node just left onto the Trail', () => {
    const address = parse('/ai-act-example/start/prohibited-practices?lang=nl')!

    expect(followHref(address, 'prohibited')).toBe(
      '/ai-act-example/start/prohibited-practices/prohibited?lang=nl',
    )
  })

  test('following a Link past the limit drops the oldest Trail entries', () => {
    const full = Array.from({ length: MAX_PATH_IDS }, () => 'start').join('/')
    const address = parse(`/ai-act-example/${full}`)!

    const ids = followHref(address, 'covered').split('/').slice(2)
    expect(ids).toHaveLength(MAX_PATH_IDS)
    expect(ids[ids.length - 1]).toBe('covered')
  })

  test('a Trail entry links to itself with everything after it discarded', () => {
    const address = parse('/ai-act-example/start/prohibited-practices/social-scoring?lang=nl')!

    expect(trailHref(address, 0)).toBe('/ai-act-example/start?lang=nl')
    expect(trailHref(address, 1)).toBe('/ai-act-example/start/prohibited-practices?lang=nl')
  })

  test('the canonical link is the Node without its Trail, in the same language', () => {
    const address = parse('/ai-act-example/start/prohibited-practices?lang=nl')!

    expect(canonicalHref(address)).toBe('/ai-act-example/prohibited-practices?lang=nl')
    expect(canonicalHref(parse('/ai-act-example/start/covered')!)).toBe('/ai-act-example/covered')
  })

  test('an Image is fetched from the images route', () => {
    expect(imageHref('eu-map.png')).toBe('/images/eu-map.png')
  })

  test('**[#121]** the dataset carries the Tree id, and the schema the format number (15.1)', () => {
    expect(datasetHref('ai-act-example')).toBe('/ai-act-example/tree.json')
    expect(SCHEMA_HREF).toBe('/schemas/elsa-tree-4.json')
  })

  test('**[#121]** the dataset URL is not a page, in any language', () => {
    // `tree.json` holds a dot, so it is neither a Tree id nor a Node id (tree-format.md
    // 3.1): the page route answered 404 for this path before section 15 existed, which is
    // why no URL that resolved then resolves differently now (4.1).
    expect(parse(datasetHref('ai-act-example'))).toBeNull()
    expect(parse(`${datasetHref('ai-act-example')}?lang=nl`)).toBeNull()
  })

  test('the same page in another language keeps its Trail and its Node', () => {
    const address = parse('/ai-act-example/start/prohibited-practices/social-scoring')!

    expect(withLang(address, 'nl')).toBe(
      '/ai-act-example/start/prohibited-practices/social-scoring?lang=nl',
    )
  })

  test('the same page in the default language carries no lang at all', () => {
    const address = parse('/ai-act-example/start/prohibited-practices?lang=nl')!

    expect(withLang(address, 'en')).toBe('/ai-act-example/start/prohibited-practices')
  })

  test('the same page in the language it already shows is the page itself', () => {
    const address = parse('/ai-act-example/start?lang=nl')!

    expect(withLang(address, 'nl')).toBe(nodeHref(address))
  })

  test('the only language of a one-language Tree is its default, so no link carries lang', () => {
    const address = parse('/single-language/start', dutchTree)!

    expect(withLang(address, 'nl')).toBe('/single-language/start')
  })
})

/**
 * The absolute form of a link and a Node's address set (docs/specs/application.md 16.3):
 * the one function the page head, the sitemap and -- with #122 -- the JSON-LD render, so
 * that one page has one string in all three.
 */
describe('the absolute form of a link (16.3)', () => {
  test('a path against a base, with and without a trailing slash', () => {
    for (const base of ['https://elsa.example.org', 'https://elsa.example.org/']) {
      expect(absolute('/ai-act-example/start', new URL(base)), base).toBe('https://elsa.example.org/ai-act-example/start')
    }
  })

  test('the query of a non-default language survives', () => {
    expect(absolute('/ai-act-example/start?lang=nl', new URL('https://elsa.example.org'))).toBe(
      'https://elsa.example.org/ai-act-example/start?lang=nl',
    )
  })

  test('a base that is not ELSA_BASE_URL is the request origin, port and all', () => {
    // What a deployment that names no base URL emits (16): the origin the request arrived
    // on, which a reverse proxy may make anything at all -- including a port.
    expect(absolute('/ai-act-example/start', new URL('http://127.0.0.1:3117'))).toBe(
      'http://127.0.0.1:3117/ai-act-example/start',
    )
  })
})

describe('the address set of a Node (16.3)', () => {
  const base = new URL('https://elsa.example.org')

  test('one canonical URL per declared language; the default one carries no ?lang', () => {
    const { addresses } = addressSet(tree, 'prohibited-practices', base)

    expect(addresses).toEqual([
      { lang: 'en', url: 'https://elsa.example.org/ai-act-example/prohibited-practices' },
      { lang: 'nl', url: 'https://elsa.example.org/ai-act-example/prohibited-practices?lang=nl' },
    ])
  })

  test('an address is the Node itself, whatever Trail led to it', () => {
    // The set of a Node reached through a Trail is the set of the same Node reached
    // without one, which is what the canonical link already says (4.1).
    const address = parse('/ai-act-example/start/prohibited-practices?lang=nl')!

    expect(addressSet(tree, address.nodeId, base).addresses.map((entry) => entry.url)).toEqual([
      'https://elsa.example.org/ai-act-example/prohibited-practices',
      'https://elsa.example.org/ai-act-example/prohibited-practices?lang=nl',
    ])
  })

  test('the alternates include the self-reference and x-default at the default language', () => {
    const { alternates } = addressSet(tree, 'start', base)

    expect(alternates).toEqual([
      { hreflang: 'en', url: 'https://elsa.example.org/ai-act-example/start' },
      { hreflang: 'nl', url: 'https://elsa.example.org/ai-act-example/start?lang=nl' },
      { hreflang: 'x-default', url: 'https://elsa.example.org/ai-act-example/start' },
    ])
  })

  test('the shape is the same for every Node kind', () => {
    // A question Node, an explanation Node and a Terminal: the address set knows nothing
    // about what is on the page, which is why it can be built from an id.
    for (const id of ['start', 'social-scoring', 'prohibited']) {
      const { addresses, alternates } = addressSet(tree, id, base)

      expect(addresses.map((entry) => entry.lang), id).toEqual(['en', 'nl'])
      expect(alternates.map((entry) => entry.hreflang), id).toEqual(['en', 'nl', 'x-default'])
    }
  })

  test('a Tree that declares one language gets no alternates at all', () => {
    const { addresses, alternates } = addressSet(dutchTree, 'start', base)

    expect(addresses).toEqual([{ lang: 'nl', url: 'https://elsa.example.org/single-language/start' }])
    expect(alternates).toEqual([])
  })

  test('every canonical address parses back to the Node it names', () => {
    // Parse and build are inverses here too: an address set entry is a URL of this app.
    for (const { lang, url } of addressSet(tree, 'covered', base).addresses) {
      const parsed = parse(url)

      expect(parsed?.nodeId, url).toBe('covered')
      expect(parsed?.trail, url).toEqual([])
      expect(parsed?.lang, url).toBe(lang)
    }
  })

  test('`schemas` is not a Tree of this deployment, so its addresses answer 404', () => {
    // 4.3 reserves it for the schema route of 15.1; nothing under it is a page.
    expect(parse('/schemas/elsa-tree-4.json')).toBeNull()
    expect(parse('/schemas/start')).toBeNull()
  })
})
