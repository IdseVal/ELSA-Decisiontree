/**
 * The two rewrites of docs/specs/application.md 4.4, which put `?lang` into the route so
 * that the root layout can set `<html lang>`. Their subject lives in `next.config.ts`, so
 * this reads the rules out of that file: no server and no browser (section 7, ADR-19).
 */
import { describe, expect, test } from 'vitest'
import config from '../next.config.ts'

/** Well-formed language tags (4.1): exactly what may become a `[lang]` segment. */
const WELL_FORMED = ['en', 'nl', 'pt-BR', 'zh-Hans-CN']

/** Values that are not a language tag, including the sentinel `_` the second rule writes. */
const NOT_A_TAG = ['', '_', 'nl2', 'nl-', '<script>', '../../etc/passwd', 'toolongalanguagetag']

/** The two `beforeFiles` rules, in the order 4.4 writes them: the tag rule, then the rest. */
async function beforeFiles() {
  const rewrites = await config.rewrites?.()
  if (!rewrites || Array.isArray(rewrites)) throw new Error('4.4 asks for `beforeFiles` rules')
  const [withTag, withoutTag] = rewrites.beforeFiles ?? []
  if (!withTag || !withoutTag) throw new Error('4.4 asks for exactly two `beforeFiles` rules')
  return { withTag, withoutTag }
}

/** The grammar the pair tests, read from the rule that must state it bare. */
async function languageGrammar(): Promise<string> {
  const grammar = (await beforeFiles()).withoutTag.missing?.[0]?.value
  if (!grammar) throw new Error('the second rule must test the grammar in `missing`')
  return grammar
}

/**
 * Whether the grammar accepts `value` the way Next.js applies it: `matchHas` wraps a
 * `has`/`missing` value in `^...$` (next/dist/shared/lib/router/utils/prepare-destination),
 * which is why `script` passes where `<script>` does not.
 */
function accepts(grammar: string, value: string): boolean {
  return new RegExp(`^${grammar}$`).test(value)
}

/** The regular expression inside a source written as one named path parameter, `/:name(...)`. */
function pathPattern(source: string): string {
  const pattern = /^\/:[a-zA-Z]+\((.*)\)$/.exec(source)?.[1]
  if (!pattern) throw new Error(`a source of one named path parameter is expected: ${source}`)
  return pattern
}

describe('the rewrites that restate ?lang as a route segment', () => {
  test('a well-formed lang leads the path; anything else takes the sentinel', async () => {
    const { withTag, withoutTag } = await beforeFiles()

    expect(withTag).toMatchObject({ destination: '/:lang/:path' })
    expect(withTag.has).toMatchObject([{ type: 'query', key: 'lang' }])
    expect(withoutTag).toMatchObject({ destination: '/_/:path' })
    expect(withoutTag.missing).toMatchObject([{ type: 'query', key: 'lang' }])
  })

  test("the rules take every path but Next.js's own, so the client bundle is served", async () => {
    // The one place this implementation departs from the frozen text of 4.4, which writes
    // `/:path*`: these rules run before the file system, and with no exclusion they send
    // `/_next/static/<chunk>` to the sentinel route, so every stylesheet and client chunk
    // answers 404. Measured on Next.js 16.3.4; the PR of issue #20 asks for the amendment.
    const { withTag, withoutTag } = await beforeFiles()
    expect(withTag.source).toBe(withoutTag.source)
    const path = new RegExp(`^${pathPattern(withTag.source)}$`)

    expect(path.test('ai-act-example/start'), 'a Node page').toBe(true)
    expect(path.test('images/eu-map.png'), 'an image').toBe(true)
    expect(path.test(''), 'the bare root').toBe(true)
    expect(path.test('_next/static/chunk.css'), "Next.js's own").toBe(false)
  })

  test('the grammar accepts exactly the well-formed tags of 4.1', async () => {
    const grammar = await languageGrammar()

    for (const tag of WELL_FORMED) expect(accepts(grammar, tag), tag).toBe(true)
    for (const value of NOT_A_TAG) expect(accepts(grammar, value), value).toBe(false)
  })

  test('the second rule tests the same grammar, so it fires for exactly what the first rejects', async () => {
    const { withTag } = await beforeFiles()

    // The one difference is the named group the destination interpolates as `:lang`.
    expect(withTag.has?.[0]?.value).toBe(`(?<lang>${await languageGrammar()})`)
  })
})
