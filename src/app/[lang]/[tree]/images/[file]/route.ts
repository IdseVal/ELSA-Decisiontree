import { assetResponse, IMAGE_TYPES } from '../../../../../assets.ts'
import { store } from '../../../../../config.ts'

/**
 * `GET /<tree-id>/images/<file>` (docs/specs/application.md 5.3, 18.1). The Tree is looked
 * up among the served ones first, so a hidden or unknown Tree's picture is the 404 of an
 * unknown file (23.1); the loader then resolves the name inside that Tree's `images/` and
 * answers `null` for anything its published Nodes do not name -- a draft's upload included.
 *
 * It lives under `[lang]` because every route does (4.4): the rewrite gives every request a
 * language segment, and this one ignores it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; tree: string; file: string }> },
) {
  const { tree: treeId, file } = await params
  const tree = (await store()).published(treeId)
  return assetResponse(tree ? tree.imagePath(file) : null, IMAGE_TYPES)
}
