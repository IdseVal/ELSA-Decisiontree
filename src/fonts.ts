/**
 * **[#180]** The font library and the licence list (docs/specs/application.md 37.1, 37.3,
 * 37.5; ADR-171-font-library, ADR-171-licence-dropdown): the four families the application
 * ships in `fonts/`, and the six licences a font's licence is chosen from.
 *
 * Pure, so the store that copies a family into a Tree and the editor page that offers it read
 * one list. `tests/fonts.test.ts` holds the list and the folder to each other: every file
 * listed is in `fonts/<id>/` with its SHA-256, and every file there is listed.
 */
import type { FontFamily, FontFile } from './tree/types.ts'

/** One licence of the licence dropdown (37.5): its SPDX id, its SPDX name, and what `licence` stores. */
export interface FontLicence {
  id: string
  /** Shown in the dropdown: a proper name, the same in every language. */
  name: string
  /** The name and the address of the licence's text, as tree-format.md 4.3.2 asks. */
  stored: string
}

/** The six licences, in the dropdown's order (ADR-171-licence-dropdown decision 1). */
export const FONT_LICENCES: readonly FontLicence[] = [
  { id: 'OFL-1.1', name: 'SIL Open Font License 1.1', stored: 'SIL Open Font License 1.1 (https://spdx.org/licenses/OFL-1.1.html)' },
  { id: 'Apache-2.0', name: 'Apache License 2.0', stored: 'Apache License 2.0 (https://spdx.org/licenses/Apache-2.0.html)' },
  { id: 'Ubuntu-font-1.0', name: 'Ubuntu Font Licence v1.0', stored: 'Ubuntu Font Licence v1.0 (https://spdx.org/licenses/Ubuntu-font-1.0.html)' },
  { id: 'Bitstream-Vera', name: 'Bitstream Vera Font License', stored: 'Bitstream Vera Font License (https://spdx.org/licenses/Bitstream-Vera.html)' },
  { id: 'MIT', name: 'MIT License', stored: 'MIT License (https://spdx.org/licenses/MIT.html)' },
  { id: 'CC0-1.0', name: 'Creative Commons Zero v1.0 Universal', stored: 'Creative Commons Zero v1.0 Universal (https://spdx.org/licenses/CC0-1.0.html)' },
]

/** One file of a library family, as it lies in `fonts/<id>/`. */
export interface LibraryFile extends FontFile {
  /** The bytes' SHA-256, in hex: the test's check, and the 8 hex of the name its copy gets (22.6). */
  sha256: string
}

/** One family of the library (ADR-171-font-library decision 5). */
export interface LibraryFamily {
  /** Its folder's name in `fonts/`, and what `use-library-font` names it by. */
  id: string
  /** The CSS family name, written into the Theme as `family`. */
  family: string
  /** An id of `FONT_LICENCES`. */
  licence: string
  files: readonly LibraryFile[]
}

/** The four families, in the dropdown's order (ADR-171-font-library decisions 1 and 3). */
export const FONT_LIBRARY: readonly LibraryFamily[] = [
  {
    id: 'open-sans',
    family: 'Open Sans',
    licence: 'OFL-1.1',
    files: [
      { file: 'open-sans-normal.woff2', weight: '400 700', style: 'normal', sha256: 'a01904f4431dc90d3df322c58a7e7f466b55d8b8a0b2e2a899ac6daf0b105689' },
      { file: 'open-sans-italic.woff2', weight: '400 700', style: 'italic', sha256: '44c77ff92035694c70d40b2ef2c0ddc92027987bb6659fcc9fcf1bbe3535ce69' },
    ],
  },
  {
    id: 'roboto',
    family: 'Roboto',
    licence: 'OFL-1.1',
    files: [
      { file: 'roboto-normal.woff2', weight: '400 700', style: 'normal', sha256: '56802c518d2124afc44b35e512d31e7e5c4147e7f86f9a8f2788f3e141980dfc' },
      { file: 'roboto-italic.woff2', weight: '400 700', style: 'italic', sha256: '3b44bb9a4d12169b3af5b7a7ef165de37f80d68826c9c2aa59877ce133c91513' },
    ],
  },
  {
    id: 'atkinson-hyperlegible-next',
    family: 'Atkinson Hyperlegible Next',
    licence: 'OFL-1.1',
    files: [
      { file: 'atkinson-hyperlegible-next-normal.woff2', weight: '400 700', style: 'normal', sha256: '9dc2c98eb9bc3522391fbaeb9dfe994dd50067ff738a568d87acce973c62b11a' },
      { file: 'atkinson-hyperlegible-next-italic.woff2', weight: '400 700', style: 'italic', sha256: 'aa55d8399746875ef8d3ef7a82ccc5d6a68331befc0517f3a42ad4b653fa6509' },
    ],
  },
  {
    id: 'faustina',
    family: 'Faustina',
    licence: 'OFL-1.1',
    files: [
      { file: 'faustina-normal.woff2', weight: '400 700', style: 'normal', sha256: 'a84c008b88322919d47e487af4ad88cff098481940d24b61a553327061d01efa' },
      { file: 'faustina-italic.woff2', weight: '400 700', style: 'italic', sha256: '5ab1ba6428cbbec0c11a6847869aa2a17bbc18fcd7472e7c7024a0c1af8d8d6a' },
    ],
  },
]

/**
 * The name a library file's copy gets in a Tree's `theme/` (37.3): 22.6's server name, the
 * stem, a hyphen and the first 8 hex of the bytes' SHA-256 -- so the same bytes have the same
 * name in every Tree, and no upload can collide with them.
 */
export function copyName(face: LibraryFile): string {
  return `${face.file.replace(/\.woff2$/, '')}-${face.sha256.slice(0, 8)}.woff2`
}

/**
 * The Theme entry `use-library-font` writes for `library` in `role` (37.3): the four keys of
 * tree-format.md 4.3.2, with nothing to say where they came from. The panel compares a
 * role's entry with it to tell a library family from the Tree's own (37.2).
 */
export function libraryEntry(library: LibraryFamily, role: FontFamily['role']): FontFamily {
  return {
    family: library.family,
    role,
    files: library.files.map((face) => ({ file: copyName(face), weight: face.weight, style: face.style })),
    licence: FONT_LICENCES.find((licence) => licence.id === library.licence)!.stored,
  }
}
