/**
 * `/admin/api/trees/<t>/images/<file>` (docs/specs/application.md 22.6): `GET` a draft's
 * picture -- attached or only uploaded -- to a logged-in reader with a role on the Tree, with
 * the headers of 5.3 and `no-store`; `DELETE` a picture neither the draft nor the published
 * copy names (409 while one does).
 */
import { ADMIN_HEADERS } from '../../../../../../../../admin/headers.ts'
import { json } from '../../../../../../../../admin/authenticated.ts'
import { answered, caller } from '../../../../../../../../admin/requests.ts'
import { assetResponse, IMAGE_TYPES } from '../../../../../../../../assets.ts'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ tree: string; file: string }> }

export async function GET(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree, file } = await params
  return answered(() => {
    who.drafts.permitted(who.account, tree, 'read')
    const response = assetResponse(who.drafts.draftImagePath(who.account, tree, file), IMAGE_TYPES)
    // A draft is nobody's but its authors': never kept by a cache (20.9).
    for (const [name, value] of Object.entries(ADMIN_HEADERS)) response.headers.set(name, value)
    return response
  })
}

export async function DELETE(request: Request, { params }: Context): Promise<Response> {
  const who = await caller(request)
  if (who instanceof Response) return who
  const { tree, file } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'upload')
    await who.drafts.removeImage(who.account, tree, file)
    return json(undefined, 204)
  })
}
