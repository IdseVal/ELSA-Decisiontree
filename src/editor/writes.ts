/**
 * The editor's calls to its own API (docs/specs/application.md 22.1, 34.4): the one module
 * under `src/editor/` that calls `fetch` against `/admin/api/`, one function per row of 22.1
 * the editor uses. A JSON body as `application/json` from this origin, which is what the
 * CSRF layer of 20.6 wants and no HTML form can send.
 */
import type { DraftNode, Manifest, Violation } from '../tree/types.ts'

/** One field or one operation on one Node (22.2). */
export type Change = { path: string; value: string } | { op: string; [argument: string]: unknown }

/** The write response of 22.3, as the browser reads it. */
export interface WriteResponse {
  revision: number
  node: DraftNode | null
  manifest?: Manifest
  violations: Violation[]
  tree: { advisory: number; published: boolean; publicCopyCurrent: boolean }
  also?: WriteResponse[]
}

/** A refusal's body (22.3, `answered`): the code, and the violations where a rule was broken. */
export interface Refusal {
  error?: string
  violations?: Violation[]
}

/**
 * What a request came back with: the status and the parsed body. Status **0** is a request
 * that never got an answer -- the network -- which the queue retries like a 5xx (29.5).
 */
export interface Answer {
  status: number
  body: WriteResponse | Refusal | null
}

/** `PATCH /admin/api/trees/<t>/nodes/<n>` with one change (22.1). Never rejects. */
export async function patchNode(treeId: string, nodeId: string, change: Change): Promise<Answer> {
  return request('PATCH', `/admin/api/trees/${encodeURIComponent(treeId)}/nodes/${encodeURIComponent(nodeId)}`, change)
}

/** What the upload route answers on 201 (22.6): the server's file name and the picture's size. */
export interface Uploaded {
  file: string
  width: number
  height: number
}

/**
 * `POST /admin/api/trees/<t>/images` with one file as `multipart/form-data` (22.6), the one
 * body of the editor that is not JSON; the browser writes the boundary. Never rejects.
 */
export async function uploadImage(treeId: string, file: File): Promise<{ status: number; body: Uploaded | Refusal | null }> {
  const form = new FormData()
  form.append('file', file)
  return (await send('POST', imagesUrl(treeId), form)) as { status: number; body: Uploaded | Refusal | null }
}

/**
 * `DELETE /admin/api/trees/<t>/images/<file>` (22.6): best effort after a cancelled attach or
 * a removed Image, so its answer -- a 409 while the file is named somewhere -- is the caller's
 * to ignore (31.2, 31.4). Never rejects.
 */
export async function deleteImage(treeId: string, file: string): Promise<Answer> {
  return send('DELETE', `${imagesUrl(treeId)}/${encodeURIComponent(file)}`)
}

function imagesUrl(treeId: string): string {
  return `/admin/api/trees/${encodeURIComponent(treeId)}/images`
}

async function request(method: string, url: string, body: unknown): Promise<Answer> {
  return send(method, url, JSON.stringify(body))
}

async function send(method: string, url: string, body?: string | FormData): Promise<Answer> {
  try {
    const response = await fetch(url, {
      method,
      headers: typeof body === 'string' ? { 'Content-Type': 'application/json' } : undefined,
      body,
      credentials: 'same-origin',
    })
    const text = await response.text()
    let parsed: Answer['body'] = null
    try {
      parsed = text ? (JSON.parse(text) as Answer['body']) : null
    } catch {
      parsed = null
    }
    return { status: response.status, body: parsed }
  } catch {
    return { status: 0, body: null }
  }
}
