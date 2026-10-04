import { useEffect, useRef, useState } from 'react'
import type { ChatUser } from '../types/chatApi.types'
import { avatarFor } from '../utils/chatView'

type Props = {
  friends: ChatUser[]
  busy: boolean
  loading: boolean
  error: string
  onChoose: (id: string) => void
  onClose: () => void
  onContacts: () => void
}
export function NewChatDialog({ friends, busy, loading, error, onChoose, onClose, onContacts }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [search, setSearch] = useState('')
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  const filtered = friends.filter(friend => friend.username.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="new-chat-title"
      className="fixed inset-0 m-auto max-h-[80dvh] w-[min(420px,90vw)] rounded-3xl border p-5 shadow-2xl backdrop:bg-black/40"
      style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 id="new-chat-title" className="text-lg font-semibold">Tin nhắn mới</h2>
        <button onClick={onClose} aria-label="Đóng" className="rounded-lg px-3 py-1 text-xl">×</button>
      </div>
      <input autoFocus aria-label="Tìm bạn bè" placeholder="Tìm bạn bè…" value={search} onChange={event => setSearch(event.target.value)}
        className="mb-3 w-full rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }} />
      {error && <p role="alert" className="mb-3 text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <p role="status" className="py-4 text-sm">Đang tải bạn bè…</p>}
      <div className="max-h-[45dvh] overflow-y-auto">
        {filtered.map(friend => <button key={friend.id} disabled={busy} onClick={() => onChoose(friend.id)}
          className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:opacity-70 disabled:opacity-40">
          <img src={friend.avatar || avatarFor(friend.username)} alt="" className="size-10 rounded-full object-cover" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{friend.username}</span><span aria-hidden>→</span>
        </button>)}
      </div>
      {!loading && filtered.length === 0 && <p className="py-5 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {search ? 'Không tìm thấy bạn bè phù hợp.' : 'Kết bạn trước để bắt đầu trò chuyện.'}
      </p>}
      {busy && <p role="status" className="py-2 text-sm">Đang mở cuộc trò chuyện…</p>}
      <button onClick={onContacts} className="mt-3 w-full rounded-xl py-2 text-sm font-medium"
        style={{ background: 'var(--color-primary-pale)', color: 'var(--color-primary)' }}>Mở danh bạ</button>
    </dialog>
  )
}
