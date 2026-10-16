import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLDialogElement', 'Node', 'Event', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true
globalThis.FileReader = dom.window.FileReader
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
const { createElement: h } = await import('react')
const { render, screen, fireEvent, waitFor, cleanup, act } = await import('@testing-library/react')
const { CreateGroupDialog } = await import('../src/features/chat/components/CreateGroupDialog.tsx')
const { GroupsPanel } = await import('../src/features/chat/components/GroupsPanel.tsx')
const { chatApi } = await import('../src/features/chat/services/chatApi.ts')
const { resetCsrf } = await import('../src/lib/api.ts')
const originalFetch = globalThis.fetch
const originalApi = { ...chatApi }
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; Object.assign(chatApi, originalApi); resetCsrf() })
const me = { id: 'me', username: 'me' }
const friends = [{ id: 'a', username: 'alice' }, { id: 'b', username: 'bob' }]
function setupFetch(create) {
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/bootstrap')) return Response.json({ me, friends: [me, ...friends, friends[0]], conversation: [] })
    if (url.endsWith('/csrf')) return Response.json({ token: 'csrf', headerName: 'X-XSRF-TOKEN' })
    assert.equal(url, '/socia/v1/conversations/groups')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'include')
    assert.equal(options.headers.get('X-XSRF-TOKEN'), 'csrf')
    return create(JSON.parse(options.body))
  }
}
async function fill() {
  await screen.findByRole('checkbox', { name: /alice/ })
  fireEvent.change(screen.getByLabelText('Tên nhóm'), { target: { value: '  Java  ' } })
  fireEvent.click(screen.getByRole('checkbox', { name: /alice/ }))
  assert.equal(screen.getByRole('button', { name: 'Tạo nhóm' }).disabled, true)
  fireEvent.change(screen.getByLabelText('Tìm bạn bè'), { target: { value: 'bob' } })
  fireEvent.click(screen.getByRole('checkbox', { name: /bob/ }))
}
test('creates a group with two distinct friends, keeps selection across search and prevents duplicate submission', async () => {
  const calls = []
  let complete
  setupFetch(body => { calls.push(body); return new Promise(resolve => { complete = resolve }) })
  render(h(CreateGroupDialog, { onClose() {} }))
  await screen.findByRole('checkbox', { name: /alice/ })
  assert.equal(screen.getAllByRole('checkbox').length, 2)
  await fill()
  fireEvent.click(screen.getByRole('button', { name: 'Tạo nhóm' }))
  await waitFor(() => assert.equal(calls.length, 1))
  fireEvent.submit(document.querySelector('form'))
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], { name: 'Java', participantId: ['a', 'b'] })
  assert.equal(screen.getByRole('button', { name: 'Đóng' }).disabled, true)
  await act(async () => complete(Response.json({ id: 'group', name: 'Java', conversationType: 'GROUP' }, { status: 201 })))
  assert.match(screen.getByRole('status').textContent, /3 thành viên/)
})
test('server rejection preserves the group name and selected friends for retry', async () => {
  let count = 0
  setupFetch(() => ++count === 1 ? Response.json({ message: 'Không thể thêm thành viên' }, { status: 403 }) : Response.json({ id: 'g', name: 'Java' }))
  render(h(CreateGroupDialog, { onClose() {} }))
  await fill()
  fireEvent.click(screen.getByRole('button', { name: 'Tạo nhóm' }))
  assert.match((await screen.findByRole('alert')).textContent, /Không thể thêm/)
  assert.equal(screen.getByLabelText('Tên nhóm').value, '  Java  ')
  fireEvent.click(screen.getByRole('button', { name: 'Tạo nhóm' }))
  await screen.findByRole('button', { name: 'Hoàn tất' })
  assert.equal(count, 2)
})

test('internal server errors show a generic message instead of database details', async () => {
  setupFetch(() => Response.json({ message: 'SQL insert into conversation; conversation_chk_1 violated' }, { status: 500 }))
  render(h(CreateGroupDialog, { onClose() {} }))
  await fill()
  fireEvent.click(screen.getByRole('button', { name: 'Tạo nhóm' }))
  assert.equal((await screen.findByRole('alert')).textContent, 'Đã có lỗi xảy ra. Vui lòng thử lại sau.')
  assert.equal(document.body.textContent.includes('conversation_chk_1'), false)
})

test('group list loads from server, filters names and refreshes after creation', async () => {
  const group = { id: 'g', name: 'Java', memberCount: 3, createdPersonId: 'me', avatar: null }
  let requests = 0
  chatApi.groups = async () => { requests++; return [group] }
  const view = render(h(GroupsPanel, { meId: 'me', revision: 0, onCreate() {} }))
  await screen.findByRole('heading', { name: 'Java' })
  assert.match(document.body.textContent, /3 thành viên/)
  assert.ok(screen.getByRole('button', { name: 'Đổi ảnh nhóm' }))
  fireEvent.change(screen.getByLabelText('Tìm nhóm'), { target: { value: 'no match' } })
  assert.ok(screen.getByText('Không tìm thấy nhóm phù hợp.'))
  view.rerender(h(GroupsPanel, { meId: 'me', revision: 1, onCreate() {} }))
  await waitFor(() => assert.equal(requests, 2))
})

test('group list failure offers retry and non-creator has no avatar edit control', async () => {
  let attempts = 0
  chatApi.groups = async () => {
    if (++attempts === 1) throw new Error('Offline')
    return [{ id: 'g', name: 'Java', memberCount: 3, createdPersonId: 'other' }]
  }
  render(h(GroupsPanel, { meId: 'me', revision: 0, onCreate() {} }))
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByRole('heading', { name: 'Java' })
  assert.equal(screen.queryByRole('button', { name: 'Đổi ảnh nhóm' }), null)
})

test('avatar upload APIs send multipart with cookies and CSRF', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/csrf')) return Response.json({ token: 'csrf', headerName: 'X-XSRF-TOKEN' })
    calls.push({ url, options })
    return Response.json({ id: 'g', name: 'Java', avatar: 'https://test.ufs.sh/f/avatar' })
  }
  const file = new File(['png'], 'group.png', { type: 'image/png' })
  await chatApi.createGroup({ name: 'Java', participantId: ['a', 'b'] }, file)
  await chatApi.updateGroupAvatar('g', file)
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[1].options.method, 'PUT')
  assert.equal(calls[1].url, '/socia/v1/conversations/groups/g/avatar')
  assert.deepEqual(JSON.parse(await calls[0].options.body.get('group').text()), { name: 'Java', participantId: ['a', 'b'] })
  for (const { options } of calls) {
    assert.equal(options.body.get('avatar').name, 'group.png')
    assert.equal(options.headers.has('Content-Type'), false)
    assert.equal(options.headers.get('X-XSRF-TOKEN'), 'csrf')
    assert.equal(options.credentials, 'include')
  }
})

test('invalid avatar is rejected before uploading', async () => {
  setupFetch(() => { throw new Error('should not submit') })
  render(h(CreateGroupDialog, { onClose() {} }))
  await screen.findByRole('checkbox', { name: /alice/ })
  fireEvent.change(screen.getByLabelText('Ảnh đại diện nhóm'), { target: { files: [new File(['svg'], 'bad.svg', { type: 'image/svg+xml' })] } })
  assert.match(screen.getByRole('alert').textContent, /JPG\/PNG/)
  assert.equal(screen.queryByRole('button', { name: 'Bỏ ảnh đã chọn' }), null)
})

test('selected avatar previews before creation and is passed to the create API', async () => {
  setupFetch(() => { throw new Error('unexpected request') })
  let saved
  chatApi.createGroup = async (request, avatar) => {
    saved = { request, avatar }
    return { id: 'g', name: request.name, avatar: 'https://test.ufs.sh/f/avatar' }
  }
  render(h(CreateGroupDialog, { onClose() {} }))
  await fill()
  const file = new dom.window.File(['png'], 'group.png', { type: 'image/png' })
  fireEvent.change(screen.getByLabelText('Ảnh đại diện nhóm'), { target: { files: [file] } })
  await waitFor(() => assert.match(screen.getByAltText('Ảnh đại diện nhóm').src, /^data:image\/png/))
  assert.equal(saved, undefined)
  fireEvent.click(screen.getByRole('button', { name: 'Tạo nhóm' }))
  await screen.findByRole('button', { name: 'Hoàn tất' })
  assert.equal(saved.avatar, file)
  assert.equal(screen.getByAltText('Ảnh đại diện nhóm').src, 'https://test.ufs.sh/f/avatar')
})
