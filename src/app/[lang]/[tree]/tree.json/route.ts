import { CONTENT_LICENCE_URL, datasetResponse } from '../../../../assets.ts'
import { servedTree } from '../../../../config.ts'
import { SCHEMA_HREF } from '../../../../url.ts'

/**
 * `GET /<tree-id>/tree.json` (docs/specs/application.md 15): the served Tree's own file,
 * byte for byte. **The download IS the dataset** -- not a re-serialisation of the
 * in-memory Tree, not a pretty-print -- so that `curl <url> | diff - trees/<id>/tree.json`
 * is empty and a checksum of the download equals one taken from the repository (15.3).
 * What is served has already passed validation: the file was checked at server start (5.4).
 *
 * A Tree id that is not the Tree this deployment serves answers 404, by the row 4.3
 * already gives for a Node page, and nothing is looked up on disk for it.
 *
 * It lives under `[lang]` because every route does (4.4) and ignores the segment: there is
 * one dataset, in no language. `tree.json` holds a dot, so it can be neither a Tree id nor
 * a Node id (tree-format.md 3.1) and this path collides with nothing that resolved before.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string; tree: string }> },
) {
  const { tree: treeId } = await params
  const tree = await servedTree()
  return datasetResponse(
    {
      path: treeId === tree.id ? tree.filePath : null,
      licence: CONTENT_LICENCE_URL,
      describedBy: SCHEMA_HREF,
    },
    request,
  )
}
