import { CONTENT_LICENCE_URL, datasetResponse } from '../../../../assets.ts'
import { store } from '../../../../config.ts'
import { SCHEMA_HREF } from '../../../../url.ts'

/**
 * `GET /<tree-id>/tree.json` (docs/specs/application.md 15, 23.6): a served Tree's own
 * file, byte for byte -- **[#134]** its published copy in the store,
 * `$ELSA_DATA_DIR/trees/<id>/tree.json`. **The download IS the dataset** -- not a re-serialisation of the
 * in-memory Tree, not a pretty-print -- so that `curl <url> | diff - <that file>` is empty
 * and a checksum of the download equals one taken from the store (15.3). What is served
 * has already passed validation: the file was checked when the store opened it (18.3).
 *
 * A Tree id that is not a served Tree -- hidden, invalid, unknown -- answers 404, by the
 * row 4.3 already gives for a Node page (23.1), and nothing is looked up on disk for it.
 *
 * It lives under `[lang]` because every route does (4.4) and ignores the segment: there is
 * one dataset per Tree, in no language. `tree.json` holds a dot, so it can be neither a Tree id nor
 * a Node id (tree-format.md 3.1) and this path collides with nothing that resolved before.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string; tree: string }> },
) {
  const { tree: treeId } = await params
  const tree = (await store()).published(treeId)
  return datasetResponse(
    {
      path: tree ? tree.filePath : null,
      licence: CONTENT_LICENCE_URL,
      describedBy: SCHEMA_HREF,
    },
    request,
  )
}
