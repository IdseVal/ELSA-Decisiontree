/**
 * **[#136]** Small pictures of each accepted type, and two that are not pictures, for the
 * upload tests (docs/specs/application.md 22.6). Not a test file.
 */

/** A real 1 x 1 PNG. */
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

/** A real 1 x 1 GIF. */
export const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

/** The start of a JPEG of 3 x 2: an APP0 segment to skip, then the start-of-frame. */
export const JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x02, 0x00, 0x03, 0x03, 0x01, 0x22,
])

/** The start of an extended WebP of 4 x 5. */
export const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x16, 0, 0, 0]),
  Buffer.from('WEBPVP8X'),
  Buffer.from([0x0a, 0, 0, 0, 0, 0, 0, 0, 0x03, 0, 0, 0x04, 0, 0]),
])

/** An SVG: a document that can carry script, refused whatever it is called. */
export const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="1" height="1"/></svg>')

/** Text. */
export const TEXT = Buffer.from('not a picture at all\n')
