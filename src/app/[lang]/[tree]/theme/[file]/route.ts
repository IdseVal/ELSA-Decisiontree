import { assetResponse, THEME_TYPES } from '../../../../../assets.ts'
import { store } from '../../../../../config.ts'

/**
 * `GET /<tree-id>/theme/<file>` (docs/specs/application.md 5.5, 18.1): one file of a served
 * Tree's Theme -- a logo, the tab icon, a font. A hidden or unknown Tree's file is the 404 of
 * an unknown one (23.1).
 *
 * `themePath` answers `null` for a malformed name, for a name the Theme does not
 * reference, and for a missing file alike, so this route serves what the Theme names
 * rather than what the folder holds: an author's licence text, note or draft beside the
 * fonts is never public.
 *
 * It lives under `[lang]` because every route does (4.4): the rewrite gives every request
 * a language segment, and this one ignores it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; tree: string; file: string }> },
) {
  const { tree: treeId, file } = await params
  const tree = (await store()).published(treeId)
  return assetResponse(tree ? tree.themePath(file) : null, THEME_TYPES)
}
