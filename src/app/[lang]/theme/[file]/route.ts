import { assetResponse, THEME_TYPES } from '../../../../assets.ts'
import { servedTree } from '../../../../config.ts'

/**
 * `GET /theme/<file>` (docs/specs/application.md 5.5): one file of the served Tree's
 * Theme -- a logo, the tab icon, a font.
 *
 * `themePath` answers `null` for a malformed name, for a name the Theme does not
 * reference, and for a missing file alike, so this route serves what the Theme names
 * rather than what the folder holds: an author's licence text, note or draft beside the
 * fonts is never public.
 *
 * It lives under `[lang]` because every route does (4.4): the rewrite gives every request
 * a language segment, and this one ignores it. The public URL is `/theme/<file>` either
 * way, which is why `theme` is a reserved Tree id (4.3).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; file: string }> },
) {
  const { file } = await params
  const tree = await servedTree()
  return assetResponse(tree.themePath(file), THEME_TYPES)
}
