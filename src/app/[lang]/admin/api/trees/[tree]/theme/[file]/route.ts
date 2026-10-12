/**
 * **[#144]** `GET /admin/api/trees/<t>/theme/<file>` (docs/specs/application.md 24.3, 33.8):
 * one file the **draft's** Theme names -- its logo, a font -- to a logged-in reader with a
 * role on the Tree, with the headers of 5.5 and `no-store`. The editor shows the draft's
 * Theme, and the public `/<tree-id>/theme/<file>` serves only what the published copy names.
 */
import { ADMIN_HEADERS } from '../../../../../../../../admin/headers.ts'
import { answered, caller } from '../../../../../../../../admin/requests.ts'
import { assetResponse, THEME_TYPES } from '../../../../../../../../assets.ts'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ tree: string; file: string }> }): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree, file } = await params
  return answered(() => {
    // `themePath` resolves what the draft's Theme names and nothing else (5.5's two checks).
    const response = assetResponse(who.drafts.draft(who.account, tree).themePath(file), THEME_TYPES)
    // A draft is nobody's but its authors': never kept by a cache (20.9).
    for (const [name, value] of Object.entries(ADMIN_HEADERS)) response.headers.set(name, value)
    return response
  })
}
