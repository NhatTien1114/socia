import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@/features/chat/types/chat.types'
import { avatarFor } from '@/features/chat/utils/chatView'
import { accountApi } from '../services/accountApi'
import type { Profile, ProfileInput } from '../services/accountApi'
import type { AccountView } from './AvatarMenu'
import { AccountIcon } from './AccountIcon'

type Props = { initialView: AccountView; me: User | null; onClose: () => void; onSaved: (profile: Profile) => void }
const emptyDraft: ProfileInput = { displayName: '', phone: '', sex: null, birthDate: null }
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.'
const today = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function AccountDialog({ initialView, me, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<AccountView | 'edit'>(initialView)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [draft, setDraft] = useState<ProfileInput>(emptyDraft)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(initialView === 'profile')
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwords, setPasswords] = useState({ old: '', next: '', confirm: '' })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  useEffect(() => {
    if (initialView !== 'profile') return
    const controller = new AbortController()
    accountApi.get(controller.signal).then(data => {
      if (!controller.signal.aborted) { setProfile(data); setLoading(false) }
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(errorMessage(reason)); setLoading(false) }
    })
    return () => controller.abort()
  }, [initialView, attempt])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function edit() {
    if (!profile) return
    setDraft({ displayName: profile.displayName, phone: profile.phone ?? '', sex: profile.sex, birthDate: profile.birthDate })
    setError(''); setSuccess(''); setFile(null); setPreview(''); setView('edit')
  }
  function selectFile(selected?: File) {
    if (!selected) return
    setError('')
    if (!['image/jpeg', 'image/png'].includes(selected.type)) { setError('Vui lòng chọn ảnh JPG hoặc PNG.'); return }
    if (selected.size === 0 || selected.size > 4 * 1024 * 1024) { setError('Ảnh cần có dung lượng từ 1 byte đến 4 MB.'); return }
    setFile(selected); setPreview(URL.createObjectURL(selected))
  }
  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (!draft.displayName.trim()) { setError('Vui lòng nhập tên hiển thị.'); return }
    if (draft.birthDate && (draft.birthDate > today() || draft.birthDate < '1900-01-01')) {
      setError('Ngày sinh không hợp lệ.'); return
    }
    setBusy(true); setError('')
    try {
      const saved = await accountApi.save({ ...draft, displayName: draft.displayName.trim(), phone: draft.phone?.trim() || null }, file)
      setProfile(saved); setFile(null); setPreview(''); setView('profile'); setSuccess('Đã cập nhật hồ sơ của bạn.')
      onSaved(saved)
    } catch (reason) { setError(errorMessage(reason)) }
    finally { setBusy(false) }
  }
  async function savePassword(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(''); setSuccess('')
    if (passwords.next.length < 8 || new TextEncoder().encode(passwords.next).length > 72 || !passwords.next.trim()) {
      setError('Mật khẩu mới cần ít nhất 8 ký tự và tối đa 72 byte.'); return
    }
    if (passwords.next !== passwords.confirm) { setError('Mật khẩu xác nhận chưa khớp.'); return }
    if (passwords.old === passwords.next) { setError('Mật khẩu mới phải khác mật khẩu hiện tại.'); return }
    setBusy(true)
    try {
      await accountApi.changePassword(passwords.old, passwords.next)
      setPasswords({ old: '', next: '', confirm: '' }); setVisible(false)
      setSuccess('Đổi mật khẩu thành công. Hãy dùng mật khẩu mới cho lần đăng nhập tiếp theo.')
    } catch (reason) { setError(errorMessage(reason)) }
    finally { setBusy(false) }
  }
  const name = (view === 'edit' ? draft.displayName : profile?.displayName) || me?.name || 'Tài khoản'
  const title = view === 'password' ? 'Đổi mật khẩu' : view === 'edit' ? 'Cập nhật hồ sơ' : 'Hồ sơ của bạn'
  return <dialog ref={dialog} aria-labelledby="account-title" className="account-dialog" onCancel={event => {
    event.preventDefault(); if (!busy) onClose()
  }}>
    <header className="account-header">
      <span className="account-header-icon"><AccountIcon name={view === 'password' ? 'lock' : 'person'} /></span>
      <h2 id="account-title">{title}</h2>
      <button type="button" className="account-close" aria-label="Đóng" disabled={busy} onClick={onClose}>×</button>
    </header>
    <div className="account-body">
      <div className="account-identity">
        <div className="account-avatar-wrap">
          <img className="account-avatar" src={preview || profile?.avatar || me?.avatar || avatarFor(name)} alt="Ảnh đại diện"
            onError={event => { event.currentTarget.src = avatarFor(name) }} />
          {view === 'edit' && <button type="button" className="account-camera" aria-label="Chọn ảnh đại diện" disabled={busy}
            onClick={() => fileInput.current?.click()}><AccountIcon name="camera" /></button>}
        </div>
        <h3>{name}</h3>
        <p>{view === 'password' ? 'Giữ tài khoản của bạn an toàn' : profile ? `@${profile.username}` : 'Thông tin tài khoản'}</p>
        {view === 'edit' && <><input ref={fileInput} type="file" accept="image/jpeg,image/png" aria-label="Tệp ảnh đại diện" hidden disabled={busy}
          onChange={event => { selectFile(event.target.files?.[0]); event.target.value = '' }} />
          <small>JPG, PNG · Tối đa 4 MB</small>
          {file && <button type="button" className="account-text-button" disabled={busy} onClick={() => { setFile(null); setPreview('') }}>Bỏ ảnh vừa chọn</button>}</>}
      </div>
      {error && <p role="alert" className="account-notice account-error">{error}</p>}
      {success && <p role="status" className="account-notice account-success"><AccountIcon name="check" />{success}</p>}
      {loading && <p role="status" className="account-loading">Đang tải hồ sơ…</p>}
      {!loading && !profile && view === 'profile' && <button className="account-button account-secondary" onClick={() => {
        setError(''); setLoading(true); setAttempt(value => value + 1)
      }}>Tải lại hồ sơ</button>}

      {view === 'profile' && profile && <>
        <div className="account-section-title">Thông tin cá nhân</div>
        <dl className="account-details">
          <div><dt>Tên hiển thị</dt><dd>{profile.displayName}</dd></div>
          <div><dt>Giới tính</dt><dd>{profile.sex === 'MALE' ? 'Nam' : profile.sex === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật'}</dd></div>
          <div><dt>Ngày sinh</dt><dd>{profile.birthDate ? profile.birthDate.split('-').reverse().join('/') : 'Chưa cập nhật'}</dd></div>
          <div><dt>Điện thoại</dt><dd>{profile.phone || 'Chưa cập nhật'}</dd></div>
        </dl>
        <footer className="account-footer"><button type="button" className="account-button account-primary account-full" onClick={edit}>
          <AccountIcon name="edit" />Chỉnh sửa hồ sơ</button></footer>
      </>}

      {view === 'edit' && <form onSubmit={saveProfile}>
        <fieldset disabled={busy} className="account-fields">
          <label>Tên hiển thị<input autoFocus value={draft.displayName} required maxLength={80} autoComplete="name"
            onChange={event => setDraft({ ...draft, displayName: event.target.value })} /></label>
          <div className="account-field-row">
            <label>Giới tính<select value={draft.sex ?? ''} onChange={event => setDraft({ ...draft, sex: (event.target.value || null) as Profile['sex'] })}>
              <option value="">Chưa cập nhật</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option>
            </select></label>
            <label>Ngày sinh<input type="date" min="1900-01-01" max={today()} value={draft.birthDate ?? ''} autoComplete="bday"
              onChange={event => setDraft({ ...draft, birthDate: event.target.value || null })} /></label>
          </div>
          <label>Số điện thoại<input type="tel" autoComplete="tel" placeholder="Ví dụ: 0912345678" maxLength={16} pattern="\+?[0-9]{9,15}"
            title="9–15 chữ số, có thể bắt đầu bằng +" value={draft.phone ?? ''} onChange={event => setDraft({ ...draft, phone: event.target.value })} /></label>
        </fieldset>
        <p className="account-hint">Thay đổi sẽ được lưu khi bạn bấm Cập nhật.</p>
        <footer className="account-footer">
          <button type="button" className="account-button account-secondary" disabled={busy} onClick={() => {
            setView('profile'); setFile(null); setPreview(''); setError('')
          }}>Hủy</button>
          <button type="submit" className="account-button account-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Cập nhật'}</button>
        </footer>
      </form>}

      {view === 'password' && <form onSubmit={savePassword}>
        <fieldset disabled={busy} className="account-fields">
          <label>Mật khẩu hiện tại<input type={visible ? 'text' : 'password'} required autoComplete="current-password" maxLength={72}
            value={passwords.old} onChange={event => setPasswords({ ...passwords, old: event.target.value })} /></label>
          <label>Mật khẩu mới<input type={visible ? 'text' : 'password'} required minLength={8} maxLength={72} autoComplete="new-password" aria-describedby="password-hint"
            value={passwords.next} onChange={event => setPasswords({ ...passwords, next: event.target.value })} /></label>
          <label>Xác nhận mật khẩu mới<input type={visible ? 'text' : 'password'} required minLength={8} maxLength={72} autoComplete="new-password"
            value={passwords.confirm} onChange={event => setPasswords({ ...passwords, confirm: event.target.value })} /></label>
          <label className="account-checkbox"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} />Hiện mật khẩu</label>
        </fieldset>
        <p id="password-hint" className="account-hint">Dùng ít nhất 8 ký tự. Nên kết hợp chữ, số và ký tự đặc biệt.</p>
        <footer className="account-footer">
          <button type="button" className="account-button account-secondary" disabled={busy} onClick={onClose}>Đóng</button>
          <button type="submit" className="account-button account-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu'}</button>
        </footer>
      </form>}
    </div>
  </dialog>
}
