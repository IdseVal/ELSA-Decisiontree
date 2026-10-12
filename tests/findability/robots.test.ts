/**
 * `robots.txt` (docs/specs/application.md 16.1, ADR-118-crawler-access): what the file
 * says, and the two things it must never say -- a `Disallow`, and a sitemap URL that is
 * not absolute.
 *
 * The table of 16.1 is read out of the spec itself rather than copied here: the ADR says
 * the list is data, so the test that keeps the two in step must fail when either moves.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, test } from 'vitest'
import { CRAWLERS, robotsTxt } from '../../src/findability/robots.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const base = new URL('https://elsa.example.org')
let file: string

beforeAll(() => {
  file = robotsTxt(base)
})

describe('what the file allows', () => {
  test('the wildcard block allows everything', () => {
    expect(file).toContain('User-agent: *\nAllow: /\n')
  })

  test('every named agent has a block of its own, and allows everything too', () => {
    for (const agent of CRAWLERS) {
      expect(file, agent).toContain(`User-agent: ${agent}\nAllow: /\n`)
    }
  })

  test('each token appears exactly once', () => {
    // A token pasted twice is a file that says the same thing twice; a token lost in an
    // edit is a file that stopped saying it. Both fail here.
    for (const agent of CRAWLERS) {
      expect(file.split(`User-agent: ${agent}\n`).length - 1, agent).toBe(1)
    }
    expect(file.match(/^User-agent: /gm)).toHaveLength(CRAWLERS.length + 1)
  })

  test('nothing is disallowed, anywhere in the file', () => {
    // Not the image route, not the Trail-carrying addresses: 16.1's first bullet. The file
    // says the same thing three ways, so it cannot be made stricter by a typo.
    expect(file).not.toMatch(/Disallow/i)
  })
})

describe('the tokens are the ones application.md 16.1 names', () => {
  test('the table of 16.1 and the generator hold the same twenty tokens', async () => {
    const spec = await readFile(path.join(here, '..', '..', 'docs', 'specs', 'application.md'), 'utf8')
    const table = spec.slice(spec.indexOf('### 16.1'), spec.indexOf('### 16.2'))
    // The rows are `| Operator | `Token`, `Token` | what each is |`: the second cell holds
    // the tokens in backticks, and nothing else in the section is in a backticked cell.
    const rows = [...table.matchAll(/^\| [^|]+ \| ([^|]+) \| [^|]+ \|$/gm)]
    const tokens = rows.flatMap((row) => [...row[1]!.matchAll(/`([^`]+)`/g)].map((token) => token[1]!))

    expect(tokens).toHaveLength(20)
    expect(CRAWLERS).toEqual(tokens)
  })
})

describe('the Sitemap line', () => {
  test('one line, absolute, at the base the route was given', () => {
    expect(file.match(/^Sitemap: .*$/gm)).toEqual(['Sitemap: https://elsa.example.org/sitemap.xml'])
  })

  test('a deployment that names no base URL advertises the request origin', () => {
    // What `baseUrl()` hands in when ELSA_BASE_URL is unset (16): the origin the request
    // arrived on, port and all.
    expect(robotsTxt(new URL('http://127.0.0.1:3117'))).toContain('Sitemap: http://127.0.0.1:3117/sitemap.xml')
  })

  test('the line is last, after every block', () => {
    const lines = file.trimEnd().split('\n')

    expect(lines[lines.length - 1]).toMatch(/^Sitemap: /)
  })
})
