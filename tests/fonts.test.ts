/**
 * **[#180]** The font library and the licence list (docs/specs/application.md 37.1, 37.5,
 * 37.6): `src/fonts.ts` and the `fonts/` folder held to each other, and both to the grammar
 * and the limits of tree-format.md 3.6 and 4.3.2.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import schema from '../schemas/elsa-tree-6.json' with { type: 'json' }
import { copyName, FONT_LIBRARY, FONT_LICENCES, libraryEntry } from '../src/fonts.ts'

const FONTS = fileURLToPath(new URL('../fonts', import.meta.url))

/** Tree-format.md 3.6's font file grammar, as the schema publishes it. */
const fontFile = schema.$defs.fontFileName
const isFontFile = (name: string): boolean => name.length <= fontFile.maxLength && new RegExp(fontFile.pattern).test(name)

const sha256 = async (file: string): Promise<string> => createHash('sha256').update(await readFile(file)).digest('hex')

describe('the library and its folder', () => {
  test('every file of FONT_LIBRARY is in fonts/<id>/ with its SHA-256', async () => {
    for (const family of FONT_LIBRARY) {
      for (const face of family.files) {
        expect(await sha256(path.join(FONTS, family.id, face.file)), `${family.id}/${face.file}`).toBe(face.sha256)
      }
    }
  })

  test('every file in fonts/ is listed, an OFL.txt or the README', async () => {
    const listed = new Set(FONT_LIBRARY.flatMap((family) => family.files.map((face) => `${family.id}/${face.file}`)))
    const found = (await readdir(FONTS, { recursive: true, withFileTypes: true })).filter((entry) => entry.isFile())
    const unlisted = found
      .map((entry) => path.relative(FONTS, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
      .filter((name) => !listed.has(name) && name !== 'README.md' && !/^[a-z0-9-]+\/OFL\.txt$/.test(name))
    expect(unlisted).toEqual([])
    // Every family's licence text is there to be copied beside its files (37.3).
    for (const family of FONT_LIBRARY) expect((await readFile(path.join(FONTS, family.id, 'OFL.txt'), 'utf8')).length).toBeGreaterThan(0)
  })

  test('every file name, and the name of its copy in a Tree, passes 3.6’s font grammar', () => {
    for (const face of FONT_LIBRARY.flatMap((family) => family.files)) {
      expect(isFontFile(face.file), face.file).toBe(true)
      expect(isFontFile(copyName(face)), copyName(face)).toBe(true)
    }
  })

  test('the families are the four of ADR-171-font-library, in its order, each an upright and an italic over 400 to 700', () => {
    expect(FONT_LIBRARY.map((family) => family.family)).toEqual(['Open Sans', 'Roboto', 'Atkinson Hyperlegible Next', 'Faustina'])
    for (const family of FONT_LIBRARY) {
      expect(family.files.map((face) => `${face.style} ${face.weight}`), family.id).toEqual(['normal 400 700', 'italic 400 700'])
    }
  })
})

describe('the licence list', () => {
  test('every licence id of the library is on the list', () => {
    const ids = FONT_LICENCES.map((licence) => licence.id)
    for (const family of FONT_LIBRARY) expect(ids, family.id).toContain(family.licence)
  })

  test('every stored string is at most 200 characters and ends with its SPDX address', () => {
    expect(FONT_LICENCES.map((licence) => licence.id)).toEqual(['OFL-1.1', 'Apache-2.0', 'Ubuntu-font-1.0', 'Bitstream-Vera', 'MIT', 'CC0-1.0'])
    for (const licence of FONT_LICENCES) {
      expect([...licence.stored].length, licence.id).toBeLessThanOrEqual(200)
      expect(licence.stored, licence.id).toBe(`${licence.name} (https://spdx.org/licenses/${licence.id}.html)`)
    }
  })
})

describe('libraryEntry', () => {
  test('is the entry of 37.3: the two copies at 400 700, normal then italic, and the OFL string', () => {
    expect(libraryEntry(FONT_LIBRARY[0]!, 'heading')).toEqual({
      family: 'Open Sans',
      role: 'heading',
      files: [
        { file: 'open-sans-normal-a01904f4.woff2', weight: '400 700', style: 'normal' },
        { file: 'open-sans-italic-44c77ff9.woff2', weight: '400 700', style: 'italic' },
      ],
      licence: 'SIL Open Font License 1.1 (https://spdx.org/licenses/OFL-1.1.html)',
    })
  })
})
