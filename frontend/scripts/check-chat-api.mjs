// Run only against the isolated local H2 server documented in CHAT_TESTING.md.
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { Client } from '@stomp/stompjs'
import { request as httpRequest } from 'node:http'
import { randomBytes } from 'node:crypto'

const base = process.env.SOCIA_TEST_API_BASE
if (!base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname)) {
  throw new Error('Set SOCIA_TEST_API_BASE to the isolated localhost H2 API before running this test.')
}
const suffix = Date.now().toString(36)
const password = 'LocalChatTest123!'
const clients = []
let checks = 0
function pass(name) { checks++; console.log(`PASS ${name}`) }

async function api(path, token, method = 'GET', body, expected = 200) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
  })
  const data = await response.json().catch(() => null)
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`)
  return data
}
async function account(name) {
  const username = `chat_${name}_${suffix}`
  await api('/auth/register', null, 'POST', { username, password, sex: 'MALE' })
  const login = await api('/auth/login', null, 'POST', { username, password })
  const bootstrap = await api('/conversations/bootstrap', login.token)
  assert.ok(Array.isArray(bootstrap.conversation))
  return { username, token: login.token, id: bootstrap.me.id }
}
async function connect(token, destination = '/user/queue/messages') {
  const url = new URL(`${base}/ws`)
  url.protocol = 'ws:'
  const messages = []
  const errors = []
  const client = new Client({
    brokerURL: url.toString(), connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 0, connectionTimeout: 5000,
  })
  clients.push(client)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WebSocket connect timed out')), 6000)
    client.onConnect = () => {
      clearTimeout(timeout)
      client.subscribe(destination, frame => messages.push(JSON.parse(frame.body)))
      resolve()
    }
    client.onStompError = frame => {
      errors.push(frame.headers.message ?? frame.body)
      clearTimeout(timeout)
      reject(new Error('STOMP authentication rejected'))
    }
    client.onWebSocketError = () => { clearTimeout(timeout); reject(new Error('WebSocket transport failed')) }
    client.activate()
  })
  // A simple broker does not acknowledge subscriptions; allow its inbound channel to process SUBSCRIBE.
  await delay(150)
  return { client, messages, errors }
}
async function eventually(predicate) {
  for (let i = 0; i < 50; i++) { if (predicate()) return; await delay(100) }
  assert.ok(predicate(), 'Timed out waiting for realtime event')
}

function upgradeStatus(origin) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(`${base}/ws`, {
      headers: {
        Origin: origin, Connection: 'Upgrade', Upgrade: 'websocket',
        'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': randomBytes(16).toString('base64'),
      },
    })
    request.setTimeout(5000, () => request.destroy(new Error('Upgrade timeout')))
    request.on('upgrade', (response, socket) => { socket.destroy(); resolve(response.statusCode) })
    request.on('response', response => { response.resume(); resolve(response.statusCode) })
    request.on('error', reject)
    request.end()
  })
}

try {
  assert.equal(await upgradeStatus('http://localhost:5173'), 101)
  assert.equal(await upgradeStatus('http://untrusted.invalid'), 403)
  pass('browser-origin WebSocket handshake and cross-origin rejection')
  const [a, b, outsider] = await Promise.all(['alice', 'bob', 'outsider'].map(account))
  pass('login and bootstrap return real identities and singular conversation field')
  await api('/conversations/bootstrap', null, 'GET', undefined, 401)
  await api('/conversations/direct', a.token, 'POST', { friendId: a.id }, 400)
  await api('/conversations/direct', a.token, 'POST', { friendId: b.id }, 403)
  const invitation = await api('/friends/request', a.token, 'POST', { recieverName: b.username })
  await api('/conversations/direct', a.token, 'POST', { friendId: b.id }, 403)
  await api(`/friends/${invitation.id}/respond?accept=true`, b.token, 'PUT', undefined, 202)
  pass('authentication, self-chat and friendship checks')

  const [roomA, roomB] = await Promise.all([
    api('/conversations/direct', a.token, 'POST', { friendId: b.id }),
    api('/conversations/direct', b.token, 'POST', { friendId: a.id }),
  ])
  assert.equal(roomA.id, roomB.id)
  const id = roomA.id
  const bootstrap = await api('/conversations/bootstrap', a.token)
  assert.equal(bootstrap.conversation.length, 1)
  assert.equal(bootstrap.friends[0].id, b.id)
  pass('concurrent opening creates one shared direct room')

  await api(`/conversations/${id}/messages`, outsider.token, 'GET', undefined, 403)
  await api(`/conversations/${id}/messages`, outsider.token, 'POST', { content: 'intrusion' }, 403)
  pass('outsider cannot read or send into the room')

  const receiver = await connect(b.token)
  const senderSession = await connect(a.token)
  const content = 'Xin chào 👋\nDòng thứ hai <script>không thực thi</script>'
  const sent = await api(`/conversations/${id}/messages`, a.token, 'POST', { content, senderId: outsider.id })
  await eventually(() => receiver.messages.some(message => message.id === sent.id))
  await eventually(() => senderSession.messages.some(message => message.id === sent.id))
  assert.equal(sent.senderId, a.id)
  assert.equal(receiver.messages.find(message => message.id === sent.id).content, content)
  pass('REST send, sender identity, multiline Unicode and realtime delivery to both users')

  await api(`/conversations/${id}/messages`, a.token, 'POST', { content: '  ' }, 400)
  await api(`/conversations/${id}/messages`, a.token, 'POST', { content: 'x'.repeat(2001) }, 400)
  pass('blank and oversized text is rejected')

  for (let i = 0; i < 34; i++) {
    await api(`/conversations/${id}/messages`, a.token, 'POST', { content: `History ${i}` })
  }
  const firstPage = await api(`/conversations/${id}/messages?limit=30`, b.token)
  assert.equal(firstPage.items.length, 30)
  assert.ok(firstPage.nextBefore)
  const older = await api(`/conversations/${id}/messages?before=${firstPage.nextBefore}&limit=30`, b.token)
  assert.equal(older.items.length, 5)
  assert.equal(older.nextBefore, null)
  assert.equal(new Set([...firstPage.items, ...older.items].map(message => message.id)).size, 35)
  assert.equal(older.items[0].id, sent.id)
  pass('cursor pagination returns all 35 persisted messages without overlap')

  await receiver.client.deactivate()
  const offline = await api(`/conversations/${id}/messages`, a.token, 'POST', { content: 'Sent while Bob is offline' })
  const reconnected = await connect(b.token)
  const recovered = await api(`/conversations/${id}/messages`, b.token)
  assert.ok(recovered.items.some(message => message.id === offline.id))
  const afterReconnect = await api(`/conversations/${id}/messages`, a.token, 'POST', { content: 'After reconnect' })
  await eventually(() => reconnected.messages.some(message => message.id === afterReconnect.id))
  pass('offline history recovery and realtime after reconnect')

  const forbiddenSubscription = await connect(outsider.token, '/queue/messages')
  await eventually(() => forbiddenSubscription.errors.length > 0)
  pass('direct subscription to broker queues is denied')

  await assert.rejects(connect('invalid-token'))
  pass('invalid WebSocket authentication is denied')
  console.log(`\n${checks} API/WebSocket checks passed against ${new URL(base).origin}.`)
} finally {
  await Promise.all(clients.map(client => client.deactivate({ force: true })))
}
