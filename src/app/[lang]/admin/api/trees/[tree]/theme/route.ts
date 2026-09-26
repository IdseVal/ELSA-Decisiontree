/**
 * **[#144]** `POST /admin/api/trees/<t>/theme` (docs/specs/application.md 33.8): one logo or
 * font file as `multipart/form-data`, by the upload rules of 22.6 -- refused above 5 MiB
 * (413), typed by its bytes (415 for anything but PNG, WebP and WOFF2), named by the server.
 * Naming it in the Theme is the separate write of the part (`PATCH .../trees/<t>`).
 */
import { json } from '../../../../../../../admin/authenticated.ts'
import { answered, caller, uploadedFile } from '../../../../../../../admin/requests.ts'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ tree: string }> }): Promise<Response> {
  const who = await caller(request, { upload: true })
  if (who instanceof Response) return who
  const { tree } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'upload')
    const file = await uploadedFile(request)
    if (file instanceof Response) return file
    return json(await who.drafts.uploadThemeFile(who.account, tree, file.bytes, file.name), 201)
  })
}
