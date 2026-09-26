/**
 * `POST /admin/api/trees/<t>/images` (docs/specs/application.md 22.6): one picture as
 * `multipart/form-data`. Refused above 5 MiB (413) before more than that is read; the type is
 * read from the bytes (415 for anything but PNG, JPEG, GIF and WebP, SVG included); the name
 * is the server's. Attaching it to a Node is the separate `add-image` operation.
 */
import { json, refuse } from '../../../../../../../admin/authenticated.ts'
import { answered, caller, readCapped } from '../../../../../../../admin/requests.ts'
import { MAX_IMAGE_BYTES } from '../../../../../../../store/images.ts'

export const dynamic = 'force-dynamic'

/** Room for the multipart boundaries and part headers around one file of the limit. */
const MULTIPART_OVERHEAD = 16 * 1024

export async function POST(request: Request, { params }: { params: Promise<{ tree: string }> }): Promise<Response> {
  const who = await caller(request, { upload: true })
  if (who instanceof Response) return who
  const { tree } = await params
  return answered(async () => {
    who.drafts.permitted(who.account, tree, 'upload')
    const body = await readCapped(request, MAX_IMAGE_BYTES + MULTIPART_OVERHEAD)
    if (body === null) return refuse(413, 'too-large')
    let file: File | null = null
    try {
      const form = await new Response(new Blob([body as Uint8Array<ArrayBuffer>]), { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData()
      file = [...form.values()].find((value): value is File => typeof value !== 'string') ?? null
    } catch {
      return refuse(422, 'malformed')
    }
    if (!file) return refuse(422, 'malformed', 'file')
    const bytes = new Uint8Array(await file.arrayBuffer())
    return json(await who.drafts.uploadImage(who.account, tree, bytes, file.name), 201)
  })
}
