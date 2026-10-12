/**
 * **[#180]** An uploaded font's own family name (docs/specs/application.md 37.4;
 * ADR-171-font-dropdown decision 8): what the theme upload proposes for the Theme panel's
 * name field, so a creator does not retype what the file already knows.
 *
 * Pure, beside the store's other byte sniffing (22.6). The WOFF2 header and table directory
 * are read (W3C WOFF 2.0, sections 3 to 5), the one Brotli stream that holds every table is
 * decompressed -- never past the header's `totalSfntSize` and never past 64 MiB, so a small
 * upload cannot unpack into a large one -- and the `name` table's records are read. The file is
 * a stranger's: every malformation, in any part, answers null, and the answer is never trusted
 * further than a proposal the creator sees in a field.
 */
import { brotliDecompressSync } from 'node:zlib'
import { refusedInFamily } from '../tree/grammar.ts'

/** The most the table stream is unpacked to, whatever the header claims. */
const MAX_STREAM_BYTES = 64 * 1024 * 1024

/** A table's flags name a known tag by its index in WOFF 2.0's table 5.1; 63 says an arbitrary tag follows. */
const KNOWN_TAGS: Record<number, string> = { 5: 'name', 10: 'glyf', 11: 'loca' }
const ARBITRARY_TAG = 63

/** The typographic family (name ID 16) before the family (name ID 1), as 37.4 orders them. */
const FAMILY_NAME_IDS = [16, 1]
const ENGLISH = 0x0409

/** The longest family name the format takes (tree-format.md 4.3.2, 5.7). */
const MAX_FAMILY = 64

/**
 * The family name the WOFF2 `bytes` state, from the Windows Unicode records of its `name`
 * table: name ID 16, else name ID 1, each in English (`0x0409`) before any other language;
 * trimmed. Null for a malformed file, a font collection, a name in Macintosh records only,
 * and a name that is empty, longer than 64 characters or holds a character 13.3 refuses.
 */
export function woff2FamilyName(bytes: Uint8Array): string | null {
  try {
    const table = nameTable(bytes)
    return table && familyIn(table)
  } catch {
    // A field read past the end, a Brotli stream that does not decode or unpacks past its cap.
    return null
  }
}

/** The decompressed `name` table of a WOFF2 file, or null when it has none it can be read from. */
function nameTable(bytes: Uint8Array): Uint8Array | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (ascii(view, 0) !== 'wOF2') return null
  // A collection holds several fonts and so several names, and its directory follows the tables' own.
  if (ascii(view, 4) === 'ttcf') return null
  const tables = view.getUint16(12)
  const totalSfntSize = view.getUint32(16)
  const compressed = view.getUint32(20)

  // The directory gives no offsets: each table follows the one before it in the stream.
  let at = 48
  let offset = 0
  let name: { offset: number; length: number } | null = null
  for (let i = 0; i < tables; i += 1) {
    const flags = view.getUint8(at)
    at += 1
    let tag = KNOWN_TAGS[flags & 0x3f]
    if ((flags & 0x3f) === ARBITRARY_TAG) {
      tag = ascii(view, at)
      at += 4
    }
    let length: number
    ;[length, at] = base128(view, at)
    // glyf and loca are transformed unless their version says null (3); every other table the other way round.
    const version = flags >> 6
    const transformed = tag === 'glyf' || tag === 'loca' ? version !== 3 : version !== 0
    if (transformed) [length, at] = base128(view, at)
    if (tag === 'name') {
      // A transformed name table is a form no version of the format defines.
      if (transformed) return null
      name = { offset, length }
    }
    offset += length
  }
  if (!name) return null
  const stream = brotliDecompressSync(bytes.subarray(at, at + compressed), { maxOutputLength: Math.min(totalSfntSize, MAX_STREAM_BYTES) })
  if (name.offset + name.length > stream.length) return null
  return stream.subarray(name.offset, name.offset + name.length)
}

/** The family name of a `name` table (37.4's order and rules), or null. */
function familyIn(table: Uint8Array): string | null {
  const view = new DataView(table.buffer, table.byteOffset, table.byteLength)
  const count = view.getUint16(2)
  const storage = view.getUint16(4)
  const records = Array.from({ length: count }, (_, i) => {
    const at = 6 + i * 12
    return {
      platform: view.getUint16(at),
      encoding: view.getUint16(at + 2),
      language: view.getUint16(at + 4),
      nameId: view.getUint16(at + 6),
      length: view.getUint16(at + 8),
      offset: view.getUint16(at + 10),
    }
  })
  for (const nameId of FAMILY_NAME_IDS) {
    // Windows, Unicode BMP (1) or full repertoire (10): UTF-16BE, the one encoding read here.
    const windows = records.filter((record) => record.platform === 3 && (record.encoding === 1 || record.encoding === 10) && record.nameId === nameId)
    const record = windows.find((candidate) => candidate.language === ENGLISH) ?? windows[0]
    if (!record) continue
    const start = storage + record.offset
    if (record.length % 2 !== 0 || start + record.length > table.length) return null
    const family = utf16be(table.subarray(start, start + record.length)).trim()
    const length = [...family].length
    return length >= 1 && length <= MAX_FAMILY && !refusedInFamily(family) ? family : null
  }
  return null
}

/** UTF-16BE as a string; a lone surrogate throws, which the caller answers as null. */
function utf16be(bytes: Uint8Array): string {
  const swapped = Uint8Array.from(bytes, (_, i) => bytes[i ^ 1]!)
  return new TextDecoder('utf-16le', { fatal: true }).decode(swapped)
}

/** Four bytes as a tag. */
function ascii(view: DataView, at: number): string {
  return String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3))
}

/** WOFF 2.0's UIntBase128 at `at` (section 4.1): the value and where the next field starts. */
function base128(view: DataView, at: number): [number, number] {
  let value = 0
  for (let i = 0; i < 5; i += 1) {
    const byte = view.getUint8(at + i)
    // No leading zeros, and nothing past 32 bits.
    if (i === 0 && byte === 0x80) throw new Error('UIntBase128 with a leading zero')
    if (value > 0x1ffffff) throw new Error('UIntBase128 past 32 bits')
    value = value * 128 + (byte & 0x7f)
    if ((byte & 0x80) === 0) return [value, at + i + 1]
  }
  throw new Error('UIntBase128 longer than five bytes')
}
