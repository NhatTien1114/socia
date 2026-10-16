import { useEffect, useRef, useState, type FormEvent } from 'react'
import { chatApi } from '../services/chatApi'
import type { ChatUser, GroupConversation } from '../types/chatApi.types'
import { errorText } from '../state/chatStore'
import { avatarFor } from '../utils/chatView'
import { GroupAvatarPicker } from './GroupAvatarPicker'

export function CreateGroupDialog({ onClose, onCreated }: { onClose: () => void; onCreated?: (group: GroupConversation) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const submitting = useRef(false)
  const [friends, setFriends] = useState<ChatUser[]>([])
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<GroupConversation | null>(null)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  useEffect(() => {
    let cancelled = false
    chatApi.bootstrap().then(data => {
      if (!cancelled) {
        setFriends([...new Map(data.friends.filter(friend => friend.id !== data.me.id).map(friend => [friend.id, friend])).values()])
        setLoading(false)
      }
    }).catch(reason => {
      if (!cancelled) { setLoadError(errorText(reason)); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [attempt])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current || loading || loadError || !name.trim() || selected.length < 2) return
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      const group = await chatApi.createGroup({ name: name.trim(), participantId: selected }, avatar)
      setCreated(group)
      onCreated?.(group)
    } catch (reason) { setError(errorText(reason)) }
    finally { submitting.current = false; setBusy(false) }
  }
  const filtered = friends.filter(friend => `${friend.displayName ?? ''} ${friend.username}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  const inputStyle = { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
  return (
    <dialog ref={dialog} aria-labelledby="create-group-title" onCancel={event => { event.preventDefault(); if (!submitting.current) onClose() }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[min(480px,92vw)] overflow-y-auto rounded-3xl border p-5 shadow-2xl backdrop:bg-black/40"
      style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 id="create-group-title" className="text-lg font-semibold">{created ? 'Đã tạo nhóm' : 'Tạo nhóm chat'}</h2>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Đóng" className="rounded-lg px-3 py-1 text-xl disabled:opacity-40">×</button>
      </div>
      {created ? <div>
        <p role="status" className="break-words">Nhóm <strong>{created.name}</strong> đã được tạo thành công với {selected.length + 1} thành viên.</p>
        {created.avatar && <img src={created.avatar} alt="Ảnh đại diện nhóm" className="mt-3 size-20 rounded-2xl object-cover" />}
        <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Bạn là quản trị viên của nhóm. Nhóm đã xuất hiện trong mục Nhóm.</p>
        <button autoFocus onClick={onClose} className="mt-5 w-full rounded-xl py-3 font-medium" style={{ background: 'var(--color-primary)', color: '#fff' }}>Hoàn tất</button>
      </div> : <form onSubmit={event => void submit(event)}>
        <fieldset disabled={busy} className="min-w-0">
          <GroupAvatarPicker file={avatar} disabled={busy} onChange={setAvatar} />
          <label htmlFor="group-name" className="mb-1 block text-sm font-medium">Tên nhóm</label>
          <input autoFocus required maxLength={255} id="group-name" value={name} onChange={event => setName(event.target.value)} placeholder="Ví dụ: Nhóm học Java"
            className="mb-4 w-full rounded-xl border px-3 py-2 text-sm" style={inputStyle} />
          <p id="group-members-hint" className="mb-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Chọn ít nhất 2 bạn bè. Bạn được thêm tự động làm quản trị viên.</p>
          <input aria-label="Tìm bạn bè" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên hoặc tài khoản…"
            className="mb-3 w-full rounded-xl border px-3 py-2 text-sm" style={inputStyle} />
          <p aria-live="polite" className="mb-2 text-sm font-medium">Đã chọn {selected.length} bạn bè</p>
          {loading && <p role="status" className="py-4 text-sm">Đang tải bạn bè…</p>}
          {loadError && <div role="alert" className="py-3 text-sm" style={{ color: 'var(--color-error)' }}>{loadError}
            <button type="button" className="ml-2 underline" onClick={() => { setLoadError(''); setLoading(true); setAttempt(value => value + 1) }}>Tải lại</button>
          </div>}
          {!loading && !loadError && <div className="max-h-[32dvh] overflow-y-auto" role="group" aria-label="Chọn thành viên" aria-describedby="group-members-hint">
            {filtered.map(friend => <label key={friend.id} className="flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-black/5">
              <input type="checkbox" checked={selected.includes(friend.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, friend.id] : ids.filter(id => id !== friend.id))} />
              <img src={friend.avatar || avatarFor(friend.username)} alt="" className="size-10 rounded-full object-cover" />
              <span className="min-w-0"><span className="block truncate text-sm font-medium">{friend.displayName || friend.username}</span><span className="block truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>@{friend.username}</span></span>
            </label>)}
            {filtered.length === 0 && <p className="py-4 text-center text-sm">{friends.length === 0 ? 'Bạn chưa có bạn bè. Hãy kết bạn trong Danh bạ trước khi tạo nhóm.' : 'Không tìm thấy bạn bè phù hợp.'}</p>}
          </div>}
          {!loading && !loadError && friends.length === 1 && <p className="py-2 text-sm">Bạn cần kết bạn với ít nhất một người nữa để tạo nhóm.</p>}
        </fieldset>
        {error && <p role="alert" className="mt-3 text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
        <div className="mt-4 flex gap-3">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border px-5 py-3 text-sm disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}>Hủy</button>
          <button type="submit" disabled={busy || loading || !!loadError || !name.trim() || selected.length < 2} className="flex-1 rounded-xl py-3 text-sm font-semibold disabled:opacity-40" style={{ background: 'var(--color-primary)', color: '#fff' }}>{busy ? 'Đang tạo nhóm…' : 'Tạo nhóm'}</button>
        </div>
      </form>}
    </dialog>
  )
}
