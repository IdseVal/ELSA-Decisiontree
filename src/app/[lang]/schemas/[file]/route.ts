import path from 'node:path'
import { CODE_LICENCE_URL, datasetResponse } from '../../../../assets.ts'

/**
 * `GET /schemas/elsa-tree-5.json` (docs/specs/application.md 15.1): the format's JSON
 * Schema, the contract `tree.json` names in its `rel="describedby"` header and in its own
 * `$schema` key. The schema is a file of the repository and is code, so it carries the
 * MIT licence where the Tree carries CC BY 4.0 (15.2). **[#179]** And
 * `GET /schemas/elsa-tree-4.json`, the contract of the format before it, which stays served
 * so that a `/4` Tree a third party keeps has its contract to point at (ADR-171-elsa-tree-5).
 *
 * **The route serves the published set, not the folder**, exactly as the theme route
 * serves what the Theme names and not what sits beside it (5.5): a draft or a note left in
 * `schemas/` is never public. The name is matched against that set before anything touches
 * the file system, so no request can name a path.
 *
 * `schemas` is a reserved Tree id from section 15 onwards (4.3), which is what lets this
 * route sit beside `[tree]` under `[lang]`; the segment is ignored, as on every route of
 * 15 and 16.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string; file: string }> },
) {
  const { file } = await params
  // `schemas/` is copied into the standalone folder by scripts/collect-standalone.ts, so
  // the documented run command serves it from that folder alone (15.1). The Tree folders
  // are a run-time setting; the schema is a constant of the build. The two names are spelled
  // out rather than joined from `file`, as in the loader: a `path.join` whose last segment is
  // a variable makes Turbopack trace the whole project into the build.
  const published =
    file === 'elsa-tree-5.json'
      ? path.join(process.cwd(), 'schemas', 'elsa-tree-5.json')
      : file === 'elsa-tree-4.json'
        ? path.join(process.cwd(), 'schemas', 'elsa-tree-4.json')
        : null
  return datasetResponse({ path: published, licence: CODE_LICENCE_URL }, request)
}
