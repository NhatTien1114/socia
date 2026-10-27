import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:5173' })
for (const key of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'HTMLDialogElement', 'Node', 'Event', 'KeyboardEvent', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0)
globalThis.IS_REACT_ACT_ENVIRONMENT = true
dom.window.HTMLElement.prototype.scrollIntoView = function () {}
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }

const { createElement: h } = await import('react')
const { render, screen, cleanup, fireEvent, waitFor, act, within } = await import('@testing-library/react')
const { default: userEvent } = await import('@testing-library/user-event')
const { MessageInput } = await import('../src/features/chat/components/MessageInput.tsx')
const { MessageList } = await import('../src/features/chat/components/MessageList.tsx')
const { MessageBubble } = await import('../src/features/chat/components/MessageBubble.tsx')
const { NewChatDialog } = await import('../src/features/chat/components/NewChatDialog.tsx')
const { HomePage } = await import('../src/pages/home/HomePage.tsx')
afterEach(cleanup)

test('home lists groups beside direct chats and opens group history, info and composer', async () => {
  const originalFetch = globalThis.fetch
  const originalWebSocket = globalThis.WebSocket
  const me = { id: 'me', username: 'Alice', avatar: null }
  const friend = { id: 'friend', username: 'Bob', avatar: null }
  const group = { id: 'group', conversationType: 'GROUP', name: 'Study group', avatar: '/group.png', participants: [me, friend] }
  const sent = []
  globalThis.WebSocket = class {
    readyState = 0
    close() { this.readyState = 3; this.onclose?.({}) }
  }
  globalThis.fetch = async (url, options = {}) => {
    if (url.endsWith('/auth/csrf')) return Response.json({ token: 'csrf-test', headerName: 'X-XSRF-TOKEN' })
    if (url.endsWith('/auth/session')) return Response.json({ authenticated: true, username: 'Alice', serverTime: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() })
    if (url.endsWith('/bootstrap')) return Response.json({ me, friends: [friend], conversation: [{ id: 'direct', friend }, group] })
    if (options.method === 'POST') {
      sent.push(url)
      return Response.json({ id: 'sent', conversationId: group.id, senderId: me.id, content: JSON.parse(options.body).content, createdAt: '2026-10-18T12:01:00' })
    }
    return Response.json({ items: url.includes('/group/') ? [{ id: 'old', conversationId: group.id, senderId: friend.id, content: 'Group history', createdAt: '2026-10-18T12:00:00' }] : [], nextBefore: null })
  }
  try {
    render(h(HomePage))
    const user = userEvent.setup({ document: dom.window.document })
    await user.click(await screen.findByRole('button', { name: /Study group/ }))
    const chat = screen.getByRole('region', { name: 'Trò chuyện với Study group' })
    await waitFor(() => assert.ok(within(chat).getByText('Group history')))
    assert.equal(within(chat).getByAltText('Study group').getAttribute('src'), '/group.png')
    assert.ok(within(chat).getByText('2 thành viên'))
    assert.ok(screen.getByRole('button', { name: /Bob/ }))
    await user.click(screen.getByTitle('Thông tin'))
    assert.ok(within(screen.getByLabelText('Thông tin cuộc trò chuyện')).getByText('Study group'))
    await user.type(screen.getByRole('textbox', { name: 'Tin nhắn' }), 'Hello group')
    await user.click(screen.getByRole('button', { name: 'Gửi' }))
    await waitFor(() => assert.ok(within(chat).getByText('Hello group')))
    assert.ok(sent[0].endsWith('/conversations/group/messages'))
  } finally {
    cleanup()
    globalThis.fetch = originalFetch
    globalThis.WebSocket = originalWebSocket
  }
})

test('Enter sends once and clears the composer only after success', async () => {
  const calls = []
  let complete
  render(h(MessageInput, { onSend: text => { calls.push(text); return new Promise(resolve => { complete = resolve }) } }))
  const user = userEvent.setup({ document: dom.window.document })
  const input = screen.getByRole('textbox', { name: 'Tin nhắn' })
  await user.type(input, 'Xin chào')
  await user.keyboard('{Enter}{Enter}')
  assert.deepEqual(calls, ['Xin chào'])
  assert.equal(input.value, 'Xin chào')
  assert.equal(input.disabled, true)
  await act(async () => complete())
  await waitFor(() => assert.equal(input.value, ''))
})

test('Shift+Enter inserts a line break without sending', async () => {
  let calls = 0
  render(h(MessageInput, { onSend: async () => { calls++ } }))
  const user = userEvent.setup({ document: dom.window.document })
  const input = screen.getByRole('textbox', { name: 'Tin nhắn' })
  await user.type(input, 'First')
  await user.keyboard('{Shift>}{Enter}{/Shift}')
  await user.type(input, 'Second')
  assert.equal(input.value, 'First\nSecond')
  assert.equal(calls, 0)
})

test('IME composition Enter does not prematurely send a message', async () => {
  let calls = 0
  render(h(MessageInput, { onSend: async () => { calls++ } }))
  const input = screen.getByRole('textbox', { name: 'Tin nhắn' })
  fireEvent.change(input, { target: { value: 'Tiếng Việt' } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', isComposing: true })
  assert.equal(calls, 0)
  assert.equal(input.value, 'Tiếng Việt')
})

test('failed send keeps the draft, shows an error and permits retry', async () => {
  let attempts = 0
  render(h(MessageInput, { onSend: async () => {
    if (++attempts === 1) throw new Error('Mất mạng')
  } }))
  const user = userEvent.setup({ document: dom.window.document })
  const input = screen.getByRole('textbox', { name: 'Tin nhắn' })
  await user.type(input, 'Giữ bản nháp')
  await user.click(screen.getByRole('button', { name: 'Gửi' }))
  assert.match(screen.getByRole('alert').textContent, /Mất mạng/)
  assert.equal(input.value, 'Giữ bản nháp')
  await user.click(screen.getByRole('button', { name: 'Gửi' }))
  await waitFor(() => assert.equal(input.value, ''))
  assert.equal(attempts, 2)
})

test('blank messages and an expired session cannot submit', () => {
  let calls = 0
  const view = render(h(MessageInput, { onSend: async () => { calls++ } }))
  const input = screen.getByRole('textbox', { name: 'Tin nhắn' })
  fireEvent.change(input, { target: { value: '   ' } })
  assert.equal(screen.getByRole('button', { name: 'Gửi' }).disabled, true)
  view.rerender(h(MessageInput, { disabled: true, onSend: async () => { calls++ } }))
  assert.equal(input.disabled, true)
  assert.equal(calls, 0)
  assert.equal(input.maxLength, 2000)
})

test('HTML-looking message content is rendered as text, with newlines preserved', () => {
  const content = '<script>bad()</script>\nSecond line'
  const { container } = render(h(MessageBubble, {
    message: { id: '1', senderId: 'real-id', type: 'text', content, timestamp: '12:30', date: '2026-10-03' },
    isMine: true, showAvatar: true,
  }))
  assert.equal(container.querySelector('script'), null)
  assert.equal(container.querySelector('p').textContent, content)
  assert.ok(container.querySelector('p').classList.contains('whitespace-pre-wrap'))
})

test('message ownership uses the authenticated UUID instead of the mock me identifier', () => {
  const { container } = render(h(MessageList, {
    messages: [{ id: '1', senderId: 'actual-user-uuid', type: 'text', content: 'My message', timestamp: '12:30', date: '2026-10-03' }],
    participants: [], currentUserId: 'actual-user-uuid', loading: false,
    hasOlder: false, loadingOlder: false, onLoadOlder: async () => {},
  }))
  assert.ok(container.querySelector('.flex-row-reverse'))
})

test('new conversation dialog filters friends and opens using their UUID', async () => {
  const chosen = []
  render(h(NewChatDialog, {
    friends: [
      { id: 'bob-uuid', username: 'Bob', avatar: null },
      { id: 'alice-uuid', username: 'Alice', avatar: null },
    ], busy: false, loading: false, error: '', onChoose: id => chosen.push(id),
    onClose: () => {}, onContacts: () => {},
  }))
  const user = userEvent.setup({ document: dom.window.document })
  await user.type(screen.getByRole('textbox', { name: 'Tìm bạn bè' }), 'bob')
  assert.equal(screen.queryByRole('button', { name: /Alice/ }), null)
  await user.click(screen.getByRole('button', { name: /Bob/ }))
  assert.deepEqual(chosen, ['bob-uuid'])
})

test('home integrates bootstrap, friend selection, room creation and REST send without mock conversations', async () => {
  const originalFetch = globalThis.fetch
  const originalWebSocket = globalThis.WebSocket
  const calls = []
  const me = { id: 'alice-real', username: 'Alice', avatar: null }
  const friend = { id: 'bob-real', username: 'Bob', avatar: null }
  const room = { id: 'real-room', friend }
  globalThis.WebSocket = class {
    readyState = 0
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3
    close() { this.readyState = 3; this.onclose?.({}) }
  }
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/csrf')) return Response.json({ token: 'csrf-test', headerName: 'X-XSRF-TOKEN' })
    if (url.endsWith('/auth/session')) return Response.json({ authenticated: true, username: 'Alice', serverTime: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString() })
    calls.push({ url, ...options })
    const data = url.endsWith('/bootstrap') ? { me, friends: [friend], conversation: [] }
      : url.endsWith('/direct') ? room
      : options.method === 'POST' ? {
        id: 'real-message', conversationId: room.id, senderId: me.id,
        content: JSON.parse(options.body).content, createdAt: '2026-10-03T12:00:00',
      } : { items: [], nextBefore: null }
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
  }
  try {
    render(h(HomePage))
    const user = userEvent.setup({ document: dom.window.document })
    await waitFor(() => assert.ok(screen.getByAltText('Alice')))
    await user.click(screen.getByTitle('Cuộc trò chuyện mới'))
    const dialog = screen.getByRole('dialog', { name: 'Tin nhắn mới' })
    await user.click(within(dialog).getByRole('button', { name: /Bob/ }))
    await waitFor(() => assert.ok(screen.getByRole('region', { name: 'Trò chuyện với Bob' })))
    await user.type(screen.getByRole('textbox', { name: 'Tin nhắn' }), 'Tin thật từ giao diện')
    await user.click(screen.getByRole('button', { name: 'Gửi' }))
    const history = screen.getByLabelText('Lịch sử tin nhắn')
    await waitFor(() => assert.equal(within(history).getAllByText('Tin thật từ giao diện').length, 1))
    assert.deepEqual(JSON.parse(calls.find(call => call.url.endsWith('/direct')).body), { friendId: friend.id })
    assert.deepEqual(JSON.parse(calls.find(call => call.url.endsWith('/messages') && call.method === 'POST').body), { content: 'Tin thật từ giao diện' })
    assert.equal(screen.queryByText('Nguyễn Minh Anh'), null)
  } finally {
    cleanup()
    localStorage.clear()
    globalThis.fetch = originalFetch
    globalThis.WebSocket = originalWebSocket
  }
})


test('read receipts display reader avatars once and unread outgoing messages display sent', () => {
  const message = { id: 'm', senderId: 'me', content: 'Hello', type: 'text', timestamp: '10:00', date: '2026-10-27', readByIds: [] }
  const participants = [
    { id: 'bob', name: 'Bob', avatar: '/bob.png', online: true },
    { id: 'carol', name: 'Carol', avatar: '/carol.png', online: false },
  ]
  const view = render(h(MessageBubble, { message, participants, isMine: true, showAvatar: true }))
  assert.equal(view.container.querySelector('[role="group"]'), null)
  view.rerender(h(MessageBubble, { message: { ...message, readByIds: ['bob', 'carol', 'bob', 'me'] }, participants, isMine: true, showAvatar: true }))
  const avatars = view.container.querySelectorAll('[role="group"] img')
  assert.equal(avatars.length, 2)
  assert.equal(avatars[0].getAttribute('src'), '/bob.png')
  assert.match(avatars[0].getAttribute('title'), /Bob/)
  assert.equal(avatars[1].getAttribute('src'), '/carol.png')
  view.rerender(h(MessageBubble, { message: { ...message, readByIds: ['bob'] }, participants, isMine: false, showAvatar: true }))
  assert.equal(view.container.querySelector('[role="group"]'), null)
})

test('visible reads require focus, wait for debounce, batch at 100, and stop on unmount', async () => {
  const originalObserver = globalThis.IntersectionObserver
  const originalRects = dom.window.HTMLElement.prototype.getClientRects
  const originalFocus = document.hasFocus
  let focused = false, callback
  const observed = new Set()
  globalThis.IntersectionObserver = class {
    constructor(fn) { callback = fn }
    observe(el) { observed.add(el) }
    disconnect() { observed.clear() }
  }
  dom.window.HTMLElement.prototype.getClientRects = () => [{ width: 100, height: 100 }]
  document.hasFocus = () => focused
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  const sent = []
  const messages = Array.from({ length: 102 }, (_, i) => ({ id: String(i), senderId: 'bob', content: String(i), type: 'text', timestamp: '10:00', date: '2026-10-27', readByIds: [] }))
  const props = { messages, participants: [], currentUserId: 'me', loading: false, hasOlder: false, loadingOlder: false,
    onLoadOlder: async () => {}, readEnabled: true, onMessagesVisible: async ids => { sent.push(ids) } }
  try {
    const view = render(h(MessageList, props))
    const entries = [...observed].map(target => ({ target, isIntersecting: true, intersectionRatio: 0.1 }))
    callback(entries)
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)) })
    assert.equal(sent.length, 0)
    focused = true
    fireEvent.focus(window)
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)) })
    assert.equal(sent[0].length, 100)
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)) })
    assert.equal(sent[1].length, 2)
    callback(entries)
    view.unmount()
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)) })
    assert.equal(sent.length, 2)
  } finally {
    cleanup()
    globalThis.IntersectionObserver = originalObserver
    dom.window.HTMLElement.prototype.getClientRects = originalRects
    document.hasFocus = originalFocus
  }
})


test('hidden tabs, covered chats and messages outside the viewport are not marked read', async () => {
  const originalObserver = globalThis.IntersectionObserver
  const originalRects = dom.window.HTMLElement.prototype.getClientRects
  const originalFocus = document.hasFocus
  const originalVisibility = Object.getOwnPropertyDescriptor(document, 'visibilityState')
  let callback
  globalThis.IntersectionObserver = class {
    constructor(fn) { callback = fn }
    observe() {}
    disconnect() {}
  }
  dom.window.HTMLElement.prototype.getClientRects = () => [{ width: 100, height: 100 }]
  document.hasFocus = () => true
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
  const sent = []
  const messages = [{ id: 'm', senderId: 'bob', content: 'Hi', type: 'text', timestamp: '10:00', date: '2026-10-27', readByIds: [] }]
  const props = { messages, participants: [], currentUserId: 'me', loading: false, hasOlder: false, loadingOlder: false,
    onLoadOlder: async () => {}, readEnabled: true, onMessagesVisible: async ids => { sent.push(ids) } }
  const pause = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 350)) })
  try {
    const view = render(h(MessageList, props))
    const target = view.container.querySelector('[data-message-id]')
    callback([{ target, isIntersecting: true, intersectionRatio: 0.1 }])
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    await pause()
    assert.equal(sent.length, 0)
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    view.rerender(h(MessageList, { ...props, readEnabled: false }))
    fireEvent.focus(window)
    await pause()
    assert.equal(sent.length, 0)
    view.rerender(h(MessageList, props))
    callback([{ target, isIntersecting: false, intersectionRatio: 0 }])
    fireEvent.focus(window)
    await pause()
    assert.equal(sent.length, 0)
    callback([{ target, isIntersecting: true, intersectionRatio: 0.1 }])
    await pause()
    assert.deepEqual(sent, [['m']])
  } finally {
    cleanup()
    globalThis.IntersectionObserver = originalObserver
    dom.window.HTMLElement.prototype.getClientRects = originalRects
    document.hasFocus = originalFocus
    if (originalVisibility) Object.defineProperty(document, 'visibilityState', originalVisibility)
    else delete document.visibilityState
  }
})
