/**
 * **[#136]** An upload's type, size and name (docs/specs/application.md 22.6;
 * ADR-132-editor-api decision 7): the type from the first bytes and never the name, SVG
 * refused, and a server-side name that matches tree-format.md 3.5 whatever the client sent.
 */
import { describe, expect, test } from 'vitest'
import { imageName, sniff } from '../../src/store/images.ts'
import { isImageFile } from '../../src/tree/validate.ts'
import { GIF, JPEG, PNG, SVG, TEXT, WEBP } from './pictures.ts'

describe('sniff: the type and the size from the bytes', () => {
  test('PNG, JPEG, GIF and WebP, with their width and height', () => {
    expect(sniff(PNG)).toEqual({ extension: 'png', width: 1, height: 1 })
    expect(sniff(JPEG)).toEqual({ extension: 'jpg', width: 3, height: 2 })
    expect(sniff(GIF)).toEqual({ extension: 'gif', width: 1, height: 1 })
    expect(sniff(WEBP)).toEqual({ extension: 'webp', width: 4, height: 5 })
  })

  test('an SVG, text, nothing and a truncated header are not pictures', () => {
    expect(sniff(SVG)).toBeNull()
    expect(sniff(TEXT)).toBeNull()
    expect(sniff(new Uint8Array())).toBeNull()
    expect(sniff(PNG.subarray(0, 12))).toBeNull()
    expect(sniff(JPEG.subarray(0, 12))).toBeNull()
  })
})

describe('imageName: the server names the file', () => {
  test('a PNG called .jpg is stored as .png: the extension is the bytes’', () => {
    expect(imageName('photo.jpg', PNG, sniff(PNG)!.extension)).toMatch(/^photo-[0-9a-f]{8}\.png$/)
  })

  test.for([
    ['../x.png', /^x-[0-9a-f]{8}\.png$/],
    ['..\\..\\meta.json', /^meta-[0-9a-f]{8}\.png$/],
    ['a%2F..%2Fb.png', /^a-2f-2fb-[0-9a-f]{8}\.png$/],
    ['My Photo (1).PNG', /^my-photo-1-[0-9a-f]{8}\.png$/],
    ['.png', /^image-[0-9a-f]{8}\.png$/],
    ['', /^image-[0-9a-f]{8}\.png$/],
    ['ÉÈ çà.png', /^image-[0-9a-f]{8}\.png$/],
    [`${'a'.repeat(300)}.png`, new RegExp(`^${'a'.repeat(100)}-[0-9a-f]{8}\\.png$`)],
  ] as const)('%s', ([client, expected]) => {
    const name = imageName(client, PNG, 'png')
    expect(name).toMatch(expected)
    expect(isImageFile(name)).toBe(true)
  })

  test('the same bytes get the same name; other bytes another', () => {
    expect(imageName('logo.png', PNG, 'png')).toBe(imageName('logo.png', PNG, 'png'))
    expect(imageName('logo.png', PNG, 'png')).not.toBe(imageName('logo.png', GIF, 'png'))
  })
})
