/**
 * The editor's calls to its own API (docs/specs/application.md 22.1, 34.4): the one module
 * under `src/editor/` that calls `fetch` against `/admin/api/`, one function per row of 22.1
 * the editor uses. A JSON body as `application/json` from this origin, which is what the
 * CSRF layer of 20.6 wants and no HTML form can send.
 */
import type { DraftNode, Manifest, Violation } from '../tree/types.ts'

/**
 * **[#139]** `POST .../nodes` (22.1, 30.2 to 30.4): a Node and the Link to it from `from.node`
 * in one write -- an Answer or an Option, the Option's title in the page's language -- or,
 * with `link: 'end'`, `from.node` made a Terminal with `outcome`.
 */
export interface Creation {
  from: { node: string; link: 'yes' | 'no' | 'option' | 'end'; outcome?: string }
  title?: Record<string, string>
}

/**
 * One field or one operation on one Node (22.2); **[#139]** or a creation, or the Node's
 * deletion (30.8), which the editor sends with the other verbs of 22.1 through the same queue.
 */
export type Change = { path: string; value: string } | { op: string; [argument: string]: unknown } | { create: Creation } | { delete: true }

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
  return request('PATCH', `${treeUrl(treeId)}/nodes/${encodeURIComponent(nodeId)}`, change)
}

/** **[#139]** `POST /admin/api/trees/<t>/nodes` (22.1): the 201 carries the new Node, and its parent in `also`. Never rejects. */
export async function postNode(treeId: string, creation: Creation): Promise<Answer> {
  return request('POST', `${treeUrl(treeId)}/nodes`, creation)
}

/** **[#139]** `DELETE /admin/api/trees/<t>/nodes/<n>` (22.1): `node` null, the Nodes that lost a Link in `also`. Never rejects. */
export async function deleteNode(treeId: string, nodeId: string): Promise<Answer> {
  return request('DELETE', `${treeUrl(treeId)}/nodes/${encodeURIComponent(nodeId)}`, {})
}

/** **[#139]** Sends one change of the queue with the verb of 22.1 it takes (29.2: one queue for every write). */
export function sendChange(treeId: string, nodeId: string, change: Change): Promise<Answer> {
  if ('op' in change || 'path' in change) return patchNode(treeId, nodeId, change)
  if ('delete' in change) return deleteNode(treeId, nodeId)
  return postNode(treeId, change.create)
}

/** **[#142]** What the top panel reads of a Tree's entry (22.1): its roles, its state, its to-do list. */
export interface EntryAnswer {
  meta: { creator: string; collaborators: string[]; publishedAt?: string }
  published: boolean
  servable: boolean
  publicCopyCurrent: boolean
  advisory: Violation[]
}

/** **[#142]** One active account of `GET /admin/api/accounts`, for an invitation (21.4). */
export interface AccountAnswer {
  id: string
  name: string
  login: string
}

/**
 * **[#142]** The top panel's calls (33): each answers the status and the parsed body, and
 * never rejects. `GET .../trees/<t>` and `GET /admin/api/accounts` are re-read when the
 * panel opens; the rest are the rows of 22.1 the panel's controls send.
 */
export const panelCalls = {
  entry: (treeId: string) => request('GET', treeUrl(treeId)) as Promise<Typed<EntryAnswer>>,
  accounts: () => request('GET', '/admin/api/accounts') as Promise<Typed<AccountAnswer[]>>,
  publish: (treeId: string, published: boolean) =>
    request('PUT', `${treeUrl(treeId)}/published`, { published }) as Promise<Typed<{ published: boolean; publishedAt: string | null }>>,
  invite: (treeId: string, accountId: string) => request('PUT', `${treeUrl(treeId)}/collaborators/${encodeURIComponent(accountId)}`) as Promise<Typed<EntryAnswer['meta']>>,
  remove: (treeId: string, accountId: string) =>
    request('DELETE', `${treeUrl(treeId)}/collaborators/${encodeURIComponent(accountId)}`) as Promise<Typed<EntryAnswer['meta']>>,
  handOver: (treeId: string, accountId: string) => request('PUT', `${treeUrl(treeId)}/creator`, { accountId }) as Promise<Typed<EntryAnswer['meta']>>,
  deleteTree: (treeId: string) => request('DELETE', treeUrl(treeId)),
  deleteNode,
}

/** An answer whose 2xx body is `T`; any other status's is a `Refusal` or null. */
export interface Typed<T> {
  status: number
  body: T | Refusal | null
}

function treeUrl(treeId: string): string {
  return `/admin/api/trees/${encodeURIComponent(treeId)}`
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
  return `${treeUrl(treeId)}/images`
}

async function request(method: string, url: string, body?: unknown): Promise<Answer> {
  return send(method, url, body === undefined ? undefined : JSON.stringify(body))
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
