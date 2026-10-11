import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:5173', pretendToBeVisual: true })
for (const key of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Node', 'Event', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createElement: h } = await import('react')
const { render, screen, cleanup, waitFor, act } = await import('@testing-library/react')
const { apiRequest, ApiError, resetCsrf, SESSION_EXPIRED_EVENT, notifySessionExpired } = await import('../src/lib/api.ts')
const { login, logout } = await import('../src/features/auth/services/authApi.ts')
const { useSession } = await import('../src/features/auth/hooks/useSession.ts')
const { default: App } = await import('../src/App.tsx')
const { ThemeProvider } = await import('../src/contexts/ThemeContext.tsx')
const originalFetch = globalThis.fetch
let expiredEvents = 0
window.addEventListener(SESSION_EXPIRED_EVENT, () => expiredEvents++)
const csrf = () => Response.json({ token: 'masked-csrf', headerName: 'X-XSRF-TOKEN' })
const session = (duration = 60000) => Response.json({
  authenticated: true, username: 'alice',
  serverTime: new Date().toISOString(), expiresAt: new Date(Date.now() + duration).toISOString(),
})
function Probe() {
  const state = useSession()
  return h('p', { role: 'status' }, state.status)
}
afterEach(() => { cleanup(); resetCsrf(); localStorage.clear(); globalThis.fetch = originalFetch; expiredEvents = 0 })

test('login sends cookies and CSRF, verifies session and never stores the JWT', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/csrf')) return csrf()
    if (url.endsWith('/session')) return session()
    return Response.json({ authenticated: true })
  }
  await login({ username: 'alice', password: 'password' })
  assert.deepEqual(calls.map(c => c.url), ['/socia/v1/auth/csrf', '/socia/v1/auth/login', '/socia/v1/auth/session'])
  for (const call of calls) assert.equal(call.options.credentials, 'include')
  assert.equal(calls[1].options.headers.get('X-XSRF-TOKEN'), 'masked-csrf')
  assert.equal(calls[1].options.headers.has('Authorization'), false)
  assert.equal(localStorage.length, 0)
})

test('protected 401 expires session but bad login, forbidden request and network failure do not', async () => {
  globalThis.fetch = async url => url.endsWith('/csrf') ? csrf() : Response.json({ message: 'No' }, { status: 401 })
  await assert.rejects(apiRequest('/auth/login', { method: 'POST', publicRequest: true }), ApiError)
  assert.equal(expiredEvents, 0)
  await assert.rejects(apiRequest('/users/me'), error => error.status === 401)
  assert.equal(expiredEvents, 1)
  expiredEvents = 0
  globalThis.fetch = async () => Response.json({ code: 'FORBIDDEN' }, { status: 403 })
  await assert.rejects(apiRequest('/users/me'), error => error.status === 403)
  globalThis.fetch = async () => { throw new TypeError('offline') }
  await assert.rejects(apiRequest('/users/me'), /Không kết nối/)
  assert.equal(expiredEvents, 0)
})

test('retries a rejected CSRF token once; never retries a normal forbidden write', async () => {
  let csrfCalls = 0, writes = 0
  globalThis.fetch = async url => {
    if (url.endsWith('/csrf')) { csrfCalls++; return csrf() }
    if (++writes === 1) return Response.json({ code: 'CSRF_INVALID' }, { status: 403 })
    return Response.json({ saved: true })
  }
  assert.deepEqual(await apiRequest('/users/me', { method: 'PUT' }), { saved: true })
  assert.equal(csrfCalls, 2)
  assert.equal(writes, 2)
  writes = 0
  globalThis.fetch = async () => { writes++; return Response.json({ code: 'FORBIDDEN' }, { status: 403 }) }
  await assert.rejects(apiRequest('/users/me', { method: 'PUT' }), error => error.status === 403)
  assert.equal(writes, 1)
})

test('logout requests server-side cookie deletion and reports a failed logout', async () => {
  let received
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/csrf')) return csrf()
    received = { url, options }
    return new Response(null, { status: 204 })
  }
  await logout()
  assert.equal(received.url, '/socia/v1/auth/logout')
  assert.equal(received.options.method, 'POST')
  assert.equal(received.options.credentials, 'include')
  globalThis.fetch = async url => url.endsWith('/csrf') ? csrf() : Response.json({}, { status: 500 })
  await assert.rejects(logout(), error => error.status === 500)
})

test('restores session without localStorage and expires while idle', async () => {
  localStorage.setItem('socia_access_token', 'legacy-token')
  globalThis.fetch = async () => session(250)
  render(h(Probe))
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, 'authenticated'))
  assert.equal(localStorage.getItem('socia_access_token'), null)
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, 'anonymous'))
})

test('session check distinguishes missing cookie from unavailable backend', async () => {
  globalThis.fetch = async () => Response.json({}, { status: 401 })
  const view = render(h(Probe))
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, 'anonymous'))
  view.unmount()
  globalThis.fetch = async () => { throw new TypeError('offline') }
  render(h(Probe))
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, 'error'))
})

test('a stale session response cannot authenticate after another request returned 401', async () => {
  let complete
  globalThis.fetch = () => new Promise(resolve => { complete = resolve })
  render(h(Probe))
  await act(async () => { notifySessionExpired(); complete(session()) })
  assert.equal(screen.getByRole('status').textContent, 'anonymous')
})

test('temporary network error during recheck keeps authenticated session', async () => {
  globalThis.fetch = async () => session()
  render(h(Probe))
  await waitFor(() => assert.equal(screen.getByRole('status').textContent, 'authenticated'))
  globalThis.fetch = async () => { throw new TypeError('offline') }
  await act(async () => { window.dispatchEvent(new Event('focus')) })
  assert.equal(screen.getByRole('status').textContent, 'authenticated')
})

test('protected page redirects to login and removes private UI when an idle session expires', async () => {
  const actualWindow = globalThis.window
  const originalWebSocket = globalThis.WebSocket
  const redirects = []
  const location = { pathname: '/', origin: 'http://localhost:5173', replace: path => redirects.push(path) }
  globalThis.window = new Proxy(actualWindow, {
    get(target, name) {
      if (name === 'location') return location
      const value = Reflect.get(target, name)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
  globalThis.WebSocket = class {
    readyState = 0
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3
    close() { this.readyState = 3; this.onclose?.({}) }
  }
  globalThis.fetch = async url => url.endsWith('/session') ? session(500)
    : Response.json({ me: { id: 'me', username: 'Alice', avatar: null }, friends: [], conversation: [] })
  try {
    render(h(ThemeProvider, {}, h(App)))
    await screen.findByAltText('Alice')
    await waitFor(() => assert.deepEqual(redirects, ['/login']))
    assert.equal(screen.queryByAltText('Alice'), null)
  } finally {
    cleanup()
    globalThis.window = actualWindow
    globalThis.WebSocket = originalWebSocket
  }
})
