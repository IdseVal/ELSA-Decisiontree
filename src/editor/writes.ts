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

async function request(method: string, url: string, body: unknown): Promise<Answer> {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
