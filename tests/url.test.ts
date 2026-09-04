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
  canonicalHref,
  followHref,
  imageHref,
  MAX_PATH_IDS,
  nodeHref,
  parseUrl,
  trailHref,
  type PageAddress,
} from '../src/url.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
let tree: Tree
let dutchTree: Tree

beforeAll(async () => {
  tree = await openTree(path.join(here, '..', 'trees', 'ai-act-example'))
  dutchTree = await openTree(path.join(here, 'fixtures', 'single-language'))
})

/** `parseUrl` on a whole URL, the way a request arrives. */
function parse(url: string, on: Tree = tree): PageAddress | null {
  const { pathname, searchParams } = new URL(url, 'https://example.org')
  return parseUrl(pathname, searchParams, on)
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
})
