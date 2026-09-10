import { assetResponse, IMAGE_TYPES } from '../../../../assets.ts'
import { servedTree } from '../../../../config.ts'

/**
 * `GET /images/<file>` (docs/specs/application.md 5.3). The loader resolves the name inside
 * the served Tree's own `images/` folder and answers `null` for anything else, so this route
 * can serve no file the Tree does not list.
 *
 * It lives under `[lang]` because every route does (4.4): the rewrite gives every request a
 * language segment, and this one ignores it. The public URL is `/images/<file>` either way.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; file: string }> },
) {
  const { file } = await params
  const tree = await servedTree()
  return assetResponse(tree.imagePath(file), file, IMAGE_TYPES)
}
