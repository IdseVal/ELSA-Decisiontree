// @vitest-environment jsdom
/**
 * **[#162]** The login form (docs/specs/application.md 20.4, 25.1) after a 204: it asks
 * `/admin/api/me` whether the browser kept the session cookie before it reloads the address.
 * A browser that blocks cookies, or is sent a `Secure` one at a plain-`http://` address, drops
 * it, and the reload would then show the same form again with nothing said; the form says
 * `sessionNotKept` instead.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { LoginForm } from '../../src/editor/LoginForm.tsx'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const words = { login: 'login', password: 'password', signIn: 'signIn', loginFailed: 'loginFailed', loginLocked: 'loginLocked', requestFailed: 'requestFailed', sessionNotKept: 'sessionNotKept' }

let root: Root
let container: HTMLDivElement
let requests: string[]
/** The status `GET /admin/api/me` answers after the login's 204. */
let meStatus: number

beforeEach(() => {
  requests = []
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    requests.push(`${init.method} ${url}`)
    return Promise.resolve(new Response(null, { status: url === '/admin/api/login' ? 204 : meStatus }))
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

/** Types a name and a password and submits the form, then lets its requests answer. */
async function signIn(): Promise<void> {
  act(() => root.render(<LoginForm words={words} />))
  for (const [name, value] of [['login', 'admin'], ['password', 'a long password']]) {
    const input = container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  await act(async () => {
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

const error = (): string => container.querySelector('[role="alert"]')!.textContent!

test('a 204 whose cookie the browser did not keep says sessionNotKept, keeps the name and clears the password', async () => {
  meStatus = 401

  await signIn()

  expect(requests).toEqual(['POST /admin/api/login', 'GET /admin/api/me'])
  expect(error()).toBe('sessionNotKept')
  expect(container.querySelector<HTMLInputElement>('input[name="login"]')!.value).toBe('admin')
  expect(container.querySelector<HTMLInputElement>('input[name="password"]')!.value).toBe('')
  expect(container.querySelector('fieldset')!.disabled).toBe(false)
})

test('a 204 whose cookie the browser kept says nothing and stays busy while the address reloads', async () => {
  meStatus = 200

  await signIn()

  expect(requests).toEqual(['POST /admin/api/login', 'GET /admin/api/me'])
  expect(error()).toBe('')
  expect(container.querySelector('fieldset')!.disabled).toBe(true)
})
