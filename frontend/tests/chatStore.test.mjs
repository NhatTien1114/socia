import { test } from 'node:test'
import assert from 'node:assert/strict'
import { setImmediate } from 'node:timers/promises'
import { ChatStore, mergeMessages } from '../src/features/chat/state/chatStore.ts'

const me = { id: 'me', username: 'Alice', avatar: null }
const friend = { id: 'friend', username: 'Bob', avatar: null }
const room = { id: 'room', friend }
const msg = (id, overrides = {}) => ({
  id, conversationId: 'room', senderId: 'friend', content: id,
  createdAt: '2026-10-03T12:00:00.123456', ...overrides,
})
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
async function setup(overrides = {}) {
  const api = {
    bootstrap: async () => ({ me, friends: [friend], conversation: [room] }),
    history: async () => ({ items: [], nextBefore: null }),
    open: async () => room,
    send: async (_id, content) => msg('sent', { senderId: me.id, content }),
    ...overrides,
  }
  const store = new ChatStore(api)
  store.start()
  await setImmediate()
  return { store, api }
}

test('reads the actual backend bootstrap contract and current identity', async () => {
  const { store } = await setup()
  assert.equal(store.getSnapshot().me.id, me.id)
  assert.deepEqual(store.getSnapshot().rooms, [room])
  assert.equal(store.getSnapshot().loading, false)
  store.stop()
})

test('REST and realtime echoes produce one message and no self-unread badge', async () => {
  const { store } = await setup()
  store.select(room.id)
  await setImmediate()
  const message = msg('sent', { senderId: me.id, content: 'hello' })
  store.receive(message)
  await store.send(room.id, 'hello')
  store.receive(message)
  assert.equal(store.getSnapshot().histories.room.items.length, 1)
  assert.equal(store.getSnapshot().unread.room, 0)
  store.stop()
})

test('messages arriving during history fetch are preserved and deduplicated', async () => {
  const { store, api } = await setup()
  const request = deferred()
  api.history = () => request.promise
  store.select(room.id)
  store.receive(msg('live'))
  request.resolve({ items: [msg('old'), msg('live')], nextBefore: 'old' })
  await setImmediate()
  assert.deepEqual(store.getSnapshot().histories.room.items.map(m => m.id).sort(), ['live', 'old'])
  store.stop()
})

test('switching rooms keeps late history responses in their own room', async () => {
  const { store, api } = await setup()
  const a = deferred(), b = deferred()
  api.history = id => id === 'a' ? a.promise : b.promise
  store.select('a')
  store.select('b')
  b.resolve({ items: [msg('b1', { conversationId: 'b' })], nextBefore: null })
  a.resolve({ items: [msg('a1', { conversationId: 'a' })], nextBefore: null })
  await setImmediate()
  assert.equal(store.getSnapshot().activeId, 'b')
  assert.equal(store.getSnapshot().histories.b.items[0].id, 'b1')
  store.stop()
})

test('reconnect reload replaces stale ranges and ignores an older pending request', async () => {
  const { store, api } = await setup()
  const first = deferred(), second = deferred()
  let count = 0
  api.history = () => (++count === 1 ? first.promise : second.promise)
  store.select(room.id)
  const fresh = store.loadHistory(room.id)
  second.resolve({ items: [msg('new')], nextBefore: 'new' })
  await fresh
  first.resolve({ items: [msg('stale')], nextBefore: null })
  await setImmediate()
  assert.deepEqual(store.getSnapshot().histories.room.items.map(m => m.id), ['new'])
  assert.equal(store.getSnapshot().histories.room.nextBefore, 'new')
  store.stop()
})

test('older-page failure keeps the cursor and supports retry without duplicate messages', async () => {
  const { store, api } = await setup()
  api.history = async () => ({ items: [msg('new')], nextBefore: 'cursor' })
  await store.loadHistory(room.id)
  api.history = async () => { throw new Error('offline') }
  await store.loadOlder(room.id)
  assert.equal(store.getSnapshot().histories.room.nextBefore, 'cursor')
  assert.equal(store.getSnapshot().histories.room.loadingOlder, false)
  api.history = async (_id, before) => {
    assert.equal(before, 'cursor')
    return { items: [msg('old'), msg('new')], nextBefore: null }
  }
  await store.loadOlder(room.id)
  assert.equal(store.getSnapshot().histories.room.items.length, 2)
  assert.equal(store.getSnapshot().histories.room.nextBefore, null)
  store.stop()
})

test('403 send failure does not insert a phantom message and allows a later retry', async () => {
  const { store, api } = await setup()
  await store.loadHistory(room.id)
  api.send = async () => { throw Object.assign(new Error('not friends'), { status: 403 }) }
  await assert.rejects(store.send(room.id, 'hello'), /not friends/)
  assert.equal(store.getSnapshot().histories.room.items.length, 0)
  assert.equal(store.getSnapshot().expired, false)
  store.stop()
})

test('401 expires the session; blank/oversized messages never reach the API', async () => {
  let calls = 0
  const { store } = await setup({ send: async () => {
    calls++
    throw Object.assign(new Error('expired'), { status: 401 })
  } })
  await assert.rejects(store.send(room.id, '   '))
  await assert.rejects(store.send(room.id, 'x'.repeat(2001)))
  assert.equal(calls, 0)
  await assert.rejects(store.send(room.id, 'hello'))
  assert.equal(store.getSnapshot().expired, true)
  await assert.rejects(store.send(room.id, 'again'))
  assert.equal(calls, 1)
  store.stop()
})

test('opening an existing direct room does not duplicate it; unread clears on selection', async () => {
  const { store } = await setup()
  store.receive(msg('incoming'))
  store.receive(msg('incoming'))
  assert.equal(store.getSnapshot().unread.room, 1)
  await store.open(friend.id)
  assert.equal(store.getSnapshot().rooms.length, 1)
  assert.equal(store.getSnapshot().unread.room, 0)
  store.stop()
})

test('unmount prevents delayed responses from changing state', async () => {
  const { store, api } = await setup()
  const request = deferred()
  api.history = () => request.promise
  const pending = store.loadHistory(room.id)
  store.stop()
  const stopped = store.getSnapshot()
  request.resolve({ items: [msg('late')], nextBefore: null })
  await pending
  assert.equal(store.getSnapshot(), stopped)
})

test('message ordering preserves microseconds and uses id to break exact timestamp ties', () => {
  const result = mergeMessages([], [
    msg('b', { createdAt: '2026-10-03T12:00:00.000002' }),
    msg('z', { createdAt: '2026-10-03T12:00:00' }),
    msg('a', { createdAt: '2026-10-03T12:00:00.000002' }),
  ])
  assert.deepEqual(result.map(m => m.id), ['z', 'a', 'b'])
})

test('a delayed preview authentication error after unmount cannot change the stopped store', async () => {
  const pending = deferred()
  const { store } = await setup({ history: () => pending.promise })
  store.stop()
  const snapshot = store.getSnapshot()
  pending.reject(Object.assign(new Error('expired'), { status: 401 }))
  await setImmediate()
  assert.equal(store.getSnapshot(), snapshot)
})

test('a late bootstrap response cannot clear an expired-session notification', async () => {
  const { store, api } = await setup()
  const pending = deferred()
  api.bootstrap = () => pending.promise
  const refresh = store.refresh()
  store.expire()
  pending.resolve({ me, friends: [friend], conversation: [room] })
  await refresh
  assert.equal(store.getSnapshot().expired, true)
  assert.match(store.getSnapshot().error, /hết hạn/)
  store.stop()
})
