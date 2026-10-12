/**
 * **[#180]** `woff2FamilyName` (docs/specs/application.md 37.4, 37.6; ADR-171-font-dropdown
 * decisions 4 and 8): the name an uploaded font proposes for the Theme panel's name field.
 *
 * The real files first -- the library's eight and one this repository did not build -- then
 * files built here, each a valid WOFF2 but for the one thing it tests, so a case answers null
 * for that thing and not for a broken header.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync } from 'node:zlib'
import { describe, expect, test } from 'vitest'
import { FONT_LIBRARY } from '../../src/fonts.ts'
import { woff2FamilyName } from '../../src/store/woff2.ts'

const repo = fileURLToPath(new URL('../..', import.meta.url))

describe('real files', () => {
  test('the four library files answer their names, Faustina by name ID 16 where its ID 1 is "Faustina Light"', async () => {
    for (const family of FONT_LIBRARY) {
      for (const face of family.files) {
        const bytes = await readFile(path.join(repo, 'fonts', family.id, face.file))
        expect(woff2FamilyName(bytes), face.file).toBe(family.family)
      }
    }
  })

  test('the first Tree’s Open Sans 600, served by ai4sfs.org, answers its name ID 16 over its ID 1 "Open Sans SemiBold"', async () => {
    const bytes = await readFile(path.join(repo, 'trees', 'ai-act-applicability-agrifood', 'theme', 'open-sans-600.woff2'))
    expect(woff2FamilyName(bytes)).toBe('Open Sans')
  })

  test('a truncated file and a file of zeros answer null', async () => {
    const bytes = await readFile(path.join(repo, 'fonts', 'roboto', 'roboto-normal.woff2'))
    expect(woff2FamilyName(bytes.subarray(0, bytes.length / 2))).toBeNull()
    expect(woff2FamilyName(bytes.subarray(0, 60))).toBeNull()
    expect(woff2FamilyName(new Uint8Array(4096))).toBeNull()
    expect(woff2FamilyName(new Uint8Array(0))).toBeNull()
  })

  test('a header whose totalSfntSize is smaller than its tables answers null: the stream is never unpacked past it', async () => {
    const bytes = Uint8Array.from(await readFile(path.join(repo, 'fonts', 'open-sans', 'open-sans-normal.woff2')))
    new DataView(bytes.buffer).setUint32(16, 1024)
    expect(woff2FamilyName(bytes)).toBeNull()
  })
})

/** One record of a built `name` table: Windows Unicode unless `platform` says otherwise. */
interface NameRecord {
  nameId: number
  text: string
  platform?: number
  encoding?: number
  language?: number
}

/** A `name` table of format 0: Windows records in UTF-16BE, Macintosh ones in single bytes. */
function nameTable(records: NameRecord[]): Uint8Array {
  const strings = records.map(({ text, platform = 3 }) =>
    platform === 3 ? Uint8Array.from([...text].flatMap((c) => [c.charCodeAt(0) >> 8, c.charCodeAt(0) & 0xff])) : Uint8Array.from([...text].map((c) => c.charCodeAt(0))),
  )
  const storage = 6 + records.length * 12
  const table = new Uint8Array(storage + strings.reduce((sum, s) => sum + s.length, 0))
  const view = new DataView(table.buffer)
  view.setUint16(2, records.length)
  view.setUint16(4, storage)
  let offset = 0
  records.forEach(({ nameId, platform = 3, encoding = platform === 3 ? 1 : 0, language = platform === 3 ? 0x0409 : 0 }, i) => {
    const at = 6 + i * 12
    for (const [j, value] of [platform, encoding, language, nameId, strings[i]!.length, offset].entries()) view.setUint16(at + j * 2, value)
    table.set(strings[i]!, storage + offset)
    offset += strings[i]!.length
  })
  return table
}

/** WOFF 2.0's UIntBase128: seven bits a byte, most significant first. */
function base128(value: number): number[] {
  const out = [value & 0x7f]
  for (let rest = value >>> 7; rest > 0; rest >>>= 7) out.unshift(0x80 | (rest & 0x7f))
  return out
}

/**
 * A WOFF2 file holding `tables`, each under an arbitrary tag, in one Brotli stream: untransformed,
 * or with transform version 1 where the third member says so, its transformed length its length.
 */
function woff2(tables: [tag: string, data: Uint8Array, transformed?: boolean][]): Uint8Array {
  const directory = tables.flatMap(([tag, data, transformed = false]) => [
    transformed ? 0x7f : 0x3f,
    ...[...tag].map((c) => c.charCodeAt(0)),
    ...base128(data.length),
    ...(transformed ? base128(data.length) : []),
  ])
  const stream = brotliCompressSync(Buffer.concat(tables.map(([, data]) => data)))
  const header = new Uint8Array(48)
  const view = new DataView(header.buffer)
  header.set([0x77, 0x4f, 0x46, 0x32]) // wOF2
  view.setUint32(4, 0x00010000)
  view.setUint32(8, 48 + directory.length + stream.length)
  view.setUint16(12, tables.length)
  view.setUint32(16, 12 + 16 * tables.length + tables.reduce((sum, [, data]) => sum + Math.ceil(data.length / 4) * 4, 0))
  view.setUint32(20, stream.length)
  return Buffer.concat([header, Uint8Array.from(directory), stream])
}

const HEAD = new Uint8Array(54)
const withName = (records: NameRecord[]): Uint8Array => woff2([['head', HEAD], ['name', nameTable(records)]])

describe('built files', () => {
  test('the builder makes a file the reader reads: a family name in a Windows English record', () => {
    expect(woff2FamilyName(withName([{ nameId: 1, text: 'Lab Sans' }]))).toBe('Lab Sans')
  })

  test('a WOFF2 without a name table answers null', () => {
    expect(woff2FamilyName(woff2([['head', HEAD]]))).toBeNull()
  })

  test('a family name in Macintosh records only answers null', () => {
    expect(woff2FamilyName(withName([{ nameId: 1, text: 'Lab Sans', platform: 1 }, { nameId: 16, text: 'Lab Sans', platform: 1 }]))).toBeNull()
  })

  test('name ID 16 before name ID 1, in English before any other language', () => {
    const both = [
      { nameId: 1, text: 'Lab Sans Light' },
      { nameId: 16, text: 'Lab Schreef', language: 0x0413 },
      { nameId: 16, text: 'Lab Serif' },
    ]
    expect(woff2FamilyName(withName(both))).toBe('Lab Serif')
    expect(woff2FamilyName(withName(both.slice(0, 2)))).toBe('Lab Schreef')
  })

  test('trimmed, and only when it is 1 to 64 characters with none of 13.3’s refused characters', () => {
    expect(woff2FamilyName(withName([{ nameId: 1, text: '  Lab Sans  ' }]))).toBe('Lab Sans')
    expect(woff2FamilyName(withName([{ nameId: 1, text: 'x'.repeat(64) }]))).toBe('x'.repeat(64))
    expect(woff2FamilyName(withName([{ nameId: 1, text: 'x'.repeat(65) }]))).toBeNull()
    expect(woff2FamilyName(withName([{ nameId: 1, text: '   ' }]))).toBeNull()
    for (const refused of [';', '{', '}', '<', '\n', '\u0007']) {
      expect(woff2FamilyName(withName([{ nameId: 1, text: `Lab${refused}Sans` }])), JSON.stringify(refused)).toBeNull()
    }
  })

  test('a record pointing past its table, or of an odd length, answers null', () => {
    const table = nameTable([{ nameId: 1, text: 'Lab Sans' }])
    const past = table.slice()
    new DataView(past.buffer).setUint16(6 + 10, 400)
    expect(woff2FamilyName(woff2([['name', past]]))).toBeNull()
    const odd = table.slice()
    new DataView(odd.buffer).setUint16(6 + 8, 15)
    expect(woff2FamilyName(woff2([['name', odd]]))).toBeNull()
  })

  test('a font collection answers null: its fonts have a name each', () => {
    const bytes = withName([{ nameId: 1, text: 'Lab Sans' }])
    new DataView(bytes.buffer, bytes.byteOffset).setUint32(4, 0x74746366) // the flavor 'ttcf'
    expect(woff2FamilyName(bytes)).toBeNull()
  })

  test('a transformed name table answers null: no version of the format defines one', () => {
    const table = nameTable([{ nameId: 1, text: 'Lab Sans' }])
    expect(woff2FamilyName(woff2([['head', HEAD], ['name', table]]))).toBe('Lab Sans')
    expect(woff2FamilyName(woff2([['head', HEAD], ['name', table, true]]))).toBeNull()
  })

  test('a stream that is not Brotli answers null', () => {
    const bytes = withName([{ nameId: 1, text: 'Lab Sans' }])
    const directoryEnd = bytes.length - new DataView(bytes.buffer, bytes.byteOffset).getUint32(20)
    bytes.fill(0xff, directoryEnd)
    expect(woff2FamilyName(bytes)).toBeNull()
  })
})
