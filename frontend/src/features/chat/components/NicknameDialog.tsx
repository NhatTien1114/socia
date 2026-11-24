import { useEffect, useRef, useState } from 'react'
import { AccountIcon } from '@/features/account/components/AccountIcon'
import type { ChatUser } from '../types/chatApi.types'
import { errorText } from '../state/chatStore'
import { avatarFor } from '../utils/chatView'

type Props = {
  members: ChatUser[]
  onSave: (id: string, nickname: string) => Promise<void>
  onClose: () => void
}

export function NicknameDialog({ members, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  function finishEdit() {
    setEditing(null)
    setError('')
    requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>(`[data-member="${editing}"]`)?.focus())
  }

  async function save() {
    if (!editing || submitting.current) return
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      await onSave(editing, draft.trim())
      finishEdit()
    } catch (reason) {
      setError(errorText(reason))
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return <dialog ref={dialog} aria-labelledby="nickname-title"
    onCancel={event => {
      event.preventDefault()
      if (busy) return
      if (editing) finishEdit()
      else onClose()
    }}
    className="fixed inset-0 m-auto w-[min(520px,94vw)] max-h-[85dvh] overflow-auto rounded-2xl border border-(--color-border) bg-(--color-surface) p-0 text-(--color-text) shadow-2xl backdrop:bg-black/45">
    <header className="sticky top-0 z-10 grid h-16 place-items-center border-b border-(--color-border) bg-(--color-surface)">
      <h2 id="nickname-title" className="text-lg font-semibold">Biệt danh</h2>
      <button type="button" aria-label="Đóng biệt danh" disabled={busy} onClick={onClose}
        className="absolute right-4 grid size-9 place-items-center rounded-full bg-(--color-bg) text-xl">×</button>
    </header>
    <div className="space-y-1 p-3 sm:p-4">
      {members.map(member => {
        const name = member.displayName || member.username
        const selected = editing === member.id
        return <div key={member.id} className="flex min-h-16 items-center gap-3 rounded-xl px-2">
          <img src={member.avatar || avatarFor(name)} alt="" className="size-10 shrink-0 rounded-full object-cover" />
          {selected ? <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={event => { event.preventDefault(); void save() }}>
            <input autoFocus disabled={busy} maxLength={50} aria-label={`Biệt danh của ${name}`} value={draft}
              onChange={event => setDraft(event.target.value)} placeholder={name}
              className="min-w-0 flex-1 rounded-full border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm focus:outline-(--color-primary)" />
            <button type="submit" aria-label="Lưu biệt danh" disabled={busy}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-(--color-friends-menu-active-bg) text-(--color-info-panel-value) hover:bg-(--color-info-panel-close-hover-bg) disabled:opacity-50">
              <AccountIcon name="check" />
            </button>
          </form> : <>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.nickname || name}</p>
              <p className="truncate text-xs text-(--color-text-secondary)">{member.nickname ? name : '@' + member.username}</p></div>
            <button type="button"
              data-member={member.id} aria-label={`Sửa biệt danh của ${name}`} disabled={busy}
              onClick={() => {
                setEditing(member.id); setDraft(member.nickname || ''); setError('')
              }} className="grid size-10 shrink-0 place-items-center rounded-full bg-(--color-info-panel-file-bg) text-(--color-text-secondary) hover:bg-(--color-info-panel-close-hover-bg) hover:text-(--color-info-panel-close-hover) disabled:opacity-50">
              <AccountIcon name="edit" />
            </button>
          </>}
        </div>
      })}
      {busy && <p role="status" className="px-2 text-sm text-(--color-text-secondary)">Đang lưu…</p>}
      {error && <p role="alert" className="px-2 text-sm text-(--color-error)">{error}</p>}
    </div>
  </dialog>
}
