/**
 * `POST /admin/api/trees/<t>/images` (docs/specs/application.md 22.6): one picture as
 * `multipart/form-data`. Refused above 5 MiB (413) before more than that is read; the type is
 * read from the bytes (415 for anything but PNG, JPEG, GIF and WebP, SVG included); the name
 * is the server's. Attaching it to a Node is the separate `add-image` operation.
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
    return json(await who.drafts.uploadImage(who.account, tree, file.bytes, file.name), 201)
  })
}
