/**
 * How the admin screens talk to the editor's API (docs/specs/application.md 20.6, 22.1): a
 * JSON body sent as `application/json` -- the type layer 2 of the CSRF check wants and no
 * HTML form can send -- from this origin, so the browser marks it `same-origin`.
 */

/** The API's answer: its status and its JSON body, if it had one; null when the request never got one. */
export interface Answer {
  status: number
  body: { error?: string; field?: string | null } | null
}

/** Sends `body` to `url` with `method`; resolves null on a network failure, never rejects. */
export async function send(method: 'POST' | 'PATCH', url: string, body?: unknown): Promise<Answer | null> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
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
    return null
  }
}
