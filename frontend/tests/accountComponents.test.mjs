import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:5173' })
for (const key of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'HTMLDialogElement', 'Node', 'Event', 'KeyboardEvent', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true })
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
globalThis.IS_REACT_ACT_ENVIRONMENT = true
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }

const { createElement: h } = await import('react')
const { render, screen, cleanup, fireEvent, waitFor, act } = await import('@testing-library/react')
const { default: userEvent } = await import('@testing-library/user-event')
const { AvatarMenu } = await import('../src/features/account/components/AvatarMenu.tsx')
const { AccountDialog } = await import('../src/features/account/components/AccountDialog.tsx')
const { accountApi } = await import('../src/features/account/services/accountApi.ts')
const { setAccessToken } = await import('../src/utils/storage.ts')
const originalApi = { ...accountApi }
const originalFetch = globalThis.fetch
const originalCreateURL = URL.createObjectURL
const originalRevokeURL = URL.revokeObjectURL
const profile = { id: 'me', username: 'an123', displayName: 'Nguyễn An', avatar: null, phone: '0912345678', sex: 'FEMALE', birthDate: '2000-08-14' }
const me = { id: 'me', name: 'Nguyễn An', avatar: '', online: false }
const user = () => userEvent.setup({ document: dom.window.document })
function showProfile(extra = {}) {
  accountApi.get = async () => profile
  return render(h(AccountDialog, { initialView: 'profile', me, onClose() {}, onSaved() {}, ...extra }))
}
afterEach(() => {
  cleanup()
  Object.assign(accountApi, originalApi)
  globalThis.fetch = originalFetch
  URL.createObjectURL = originalCreateURL
  URL.revokeObjectURL = originalRevokeURL
  localStorage.clear()
})

test('avatar menu opens both actions, supports arrows and Escape, and dismisses outside', async () => {
  const selected = []
  render(h(AvatarMenu, { me, onSelect: view => selected.push(view) }))
  const actor = user()
  const trigger = screen.getByRole('button', { name: 'Mở menu tài khoản' })
  await actor.click(trigger)
  assert.equal(screen.getAllByRole('menuitem').length, 2)
  assert.equal(document.activeElement.textContent, 'Hồ sơ của bạn›')
  await actor.keyboard('{ArrowDown}{Enter}')
  assert.deepEqual(selected, ['password'])
  assert.equal(screen.queryByRole('menu'), null)
  await actor.click(trigger)
  await actor.click(screen.getByRole('menuitem', { name: /Hồ sơ/ }))
  assert.deepEqual(selected, ['password', 'profile'])
  await actor.click(trigger)
  await actor.keyboard('{Escape}')
  assert.equal(document.activeElement, trigger)
  await actor.click(trigger)
  fireEvent.pointerDown(document.body)
  assert.equal(screen.queryByRole('menu'), null)
})

test('profile edit can be cancelled without saving the draft', async () => {
  let saves = 0
  accountApi.save = async () => { saves++; return profile }
  showProfile()
  const actor = user()
  await actor.click(await screen.findByRole('button', { name: 'Chỉnh sửa hồ sơ' }))
  await actor.clear(screen.getByLabelText('Tên hiển thị'))
  await actor.type(screen.getByLabelText('Tên hiển thị'), 'Bản nháp')
  await actor.click(screen.getByRole('button', { name: 'Hủy' }))
  assert.equal(saves, 0)
  assert.equal(screen.queryByDisplayValue('Bản nháp'), null)
  await actor.click(screen.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }))
  assert.equal(screen.getByLabelText('Tên hiển thị').value, profile.displayName)
})

test('failed save preserves draft; retry updates the profile and parent avatar/name', async () => {
  let calls = 0, received, updated
  accountApi.save = async (input, file) => {
    received = { input, file }
    if (++calls === 1) throw new Error('Mất kết nối')
    return { ...profile, ...input }
  }
  showProfile({ onSaved: value => { updated = value } })
  const actor = user()
  await actor.click(await screen.findByRole('button', { name: 'Chỉnh sửa hồ sơ' }))
  fireEvent.change(screen.getByLabelText('Tên hiển thị'), { target: { value: 'Tên mới' } })
  await actor.click(screen.getByRole('button', { name: 'Cập nhật' }))
  assert.match(screen.getByRole('alert').textContent, /Mất kết nối/)
  assert.equal(screen.getByLabelText('Tên hiển thị').value, 'Tên mới')
  await actor.click(screen.getByRole('button', { name: 'Cập nhật' }))
  await waitFor(() => assert.match(screen.getByRole('status').textContent, /Đã cập nhật/))
  assert.equal(updated.displayName, 'Tên mới')
  assert.equal(received.file, null)
  assert.equal(received.input.username, undefined)
  assert.equal(received.input.password, undefined)
})

test('invalid avatar is rejected; selected avatar is previewed and uploaded only on save', async () => {
  const revoked = []
  URL.createObjectURL = () => 'blob:preview'
  URL.revokeObjectURL = url => revoked.push(url)
  let receivedFile
  accountApi.save = async (input, file) => { receivedFile = file; return { ...profile, ...input, avatar: 'https://app.ufs.sh/f/avatar' } }
  showProfile()
  const actor = user()
  await actor.click(await screen.findByRole('button', { name: 'Chỉnh sửa hồ sơ' }))
  const input = screen.getByLabelText('Tệp ảnh đại diện')
  await userEvent.setup({ document: dom.window.document, applyAccept: false }).upload(input,
    new dom.window.File(['<svg/>'], 'bad.svg', { type: 'image/svg+xml' }))
  assert.match(screen.getByRole('alert').textContent, /JPG hoặc PNG/)
  const file = new dom.window.File(['png'], 'photo.png', { type: 'image/png' })
  await actor.upload(input, file)
  assert.equal(screen.getByAltText('Ảnh đại diện').getAttribute('src'), 'blob:preview')
  assert.equal(receivedFile, undefined)
  await actor.click(screen.getByRole('button', { name: 'Cập nhật' }))
  await waitFor(() => assert.equal(receivedFile, file))
  assert.equal(screen.getByAltText('Ảnh đại diện').getAttribute('src'), 'https://app.ufs.sh/f/avatar')
  assert.deepEqual(revoked, ['blob:preview'])
})

test('password confirmation prevents request; successful change clears secret fields', async () => {
  const requests = []
  accountApi.changePassword = async (...values) => { requests.push(values) }
  render(h(AccountDialog, { initialView: 'password', me, onClose() {}, onSaved() {} }))
  const actor = user()
  await actor.type(screen.getByLabelText('Mật khẩu hiện tại'), 'Old12345!')
  await actor.type(screen.getByLabelText('Mật khẩu mới'), 'New12345!')
  await actor.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'Mismatch!')
  await actor.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
  assert.equal(requests.length, 0)
  assert.match(screen.getByRole('alert').textContent, /chưa khớp/)
  await actor.clear(screen.getByLabelText('Xác nhận mật khẩu mới'))
  await actor.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'New12345!')
  await actor.click(screen.getByRole('button', { name: 'Lưu mật khẩu' }))
  assert.deepEqual(requests, [['Old12345!', 'New12345!']])
  await waitFor(() => assert.equal(screen.getByLabelText('Mật khẩu hiện tại').value, ''))
  assert.match(screen.getByRole('status').textContent, /Đổi mật khẩu thành công/)
})

test('loading failure is retryable and cannot display an editable empty profile', async () => {
  let attempts = 0
  accountApi.get = async () => { if (++attempts === 1) throw new Error('Không tải được'); return profile }
  render(h(AccountDialog, { initialView: 'profile', me, onClose() {}, onSaved() {} }))
  await screen.findByRole('alert')
  assert.equal(screen.queryByRole('button', { name: 'Chỉnh sửa hồ sơ' }), null)
  await user().click(screen.getByRole('button', { name: 'Tải lại hồ sơ' }))
  await screen.findByRole('button', { name: 'Chỉnh sửa hồ sơ' })
  assert.equal(attempts, 2)
})

test('saving disables duplicate submissions and prevents Escape from closing the dialog', async () => {
  let resolve, calls = 0, closes = 0
  accountApi.save = () => { calls++; return new Promise(done => { resolve = done }) }
  showProfile({ onClose: () => { closes++ } })
  const actor = user()
  await actor.click(await screen.findByRole('button', { name: 'Chỉnh sửa hồ sơ' }))
  await actor.click(screen.getByRole('button', { name: 'Cập nhật' }))
  assert.equal(screen.getByRole('button', { name: 'Đang lưu…' }).disabled, true)
  assert.equal(screen.getByRole('button', { name: 'Đóng' }).disabled, true)
  fireEvent.submit(screen.getByLabelText('Tên hiển thị').closest('form'))
  fireEvent(screen.getByRole('dialog'), new dom.window.Event('cancel', { cancelable: true }))
  assert.equal(calls, 1)
  assert.equal(closes, 0)
  await act(async () => resolve(profile))
})

test('API sends authenticated multipart profile and JSON passwords, never password query strings', async () => {
  setAccessToken('test-token')
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return url.endsWith('/change-password') ? new Response(null, { status: 204 }) : Response.json(profile)
  }
  const fields = { displayName: 'An', phone: null, sex: null, birthDate: null }
  await accountApi.save(fields, new File(['png'], 'photo.png', { type: 'image/png' }))
  const saved = calls[0]
  assert.equal(saved.options.headers.get('Authorization'), 'Bearer test-token')
  assert.equal(saved.options.headers.has('Content-Type'), false)
  assert.deepEqual(JSON.parse(await saved.options.body.get('profile').text()), fields)
  assert.equal(saved.options.body.get('avatar').name, 'photo.png')
  await accountApi.changePassword('Old12345!', 'New12345!')
  assert.equal(calls[1].url, '/socia/v1/users/change-password')
  assert.deepEqual(JSON.parse(calls[1].options.body), { oldPassword: 'Old12345!', newPassword: 'New12345!' })
})
