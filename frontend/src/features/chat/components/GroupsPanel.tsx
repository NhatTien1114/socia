import { useEffect, useRef, useState } from 'react'
import { chatApi } from '../services/chatApi'
import type { GroupConversation } from '../types/chatApi.types'
import { errorText } from '../state/chatStore'
import { GroupAvatarPicker } from './GroupAvatarPicker'

function GroupCard({ group, meId, onSaved }: { group: GroupConversation; meId?: string; onSaved: (group: GroupConversation) => void }) {
  const [editing, setEditing] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const [error, setError] = useState('')
  async function save() {
    if (!file || saving.current) return
    saving.current = true; setBusy(true); setError('')
    try { onSaved(await chatApi.updateGroupAvatar(group.id, file)); setFile(null); setEditing(false) }
    catch (reason) { setError(errorText(reason)) }
    finally { saving.current = false; setBusy(false) }
  }
  return <article className="rounded-2xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
    <div className="flex items-center gap-3">
      {group.avatar ? <img src={group.avatar} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
        : <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold" style={{ background: 'var(--color-primary-pale)', color: 'var(--color-primary)' }}>{group.name.slice(0, 1).toUpperCase()}</span>}
      <div className="min-w-0"><h2 className="break-words font-semibold">{group.name}</h2><p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{group.memberCount} thành viên{group.createdPersonId === meId ? ' · Bạn tạo nhóm này' : ''}</p></div>
    </div>
    {group.createdPersonId === meId && !editing && <button onClick={() => setEditing(true)} className="mt-3 text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Đổi ảnh nhóm</button>}
    {editing && <div className="mt-4">
      <GroupAvatarPicker file={file} current={group.avatar} disabled={busy} onChange={setFile} />
      {error && <p role="alert" className="mb-2 text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      <div className="flex gap-3"><button disabled={!file || busy} onClick={() => void save()} className="rounded-lg px-4 py-2 text-sm disabled:opacity-40" style={{ background: 'var(--color-primary)', color: '#fff' }}>{busy ? 'Đang lưu…' : 'Lưu ảnh'}</button>
        <button disabled={busy} onClick={() => { setEditing(false); setFile(null); setError('') }} className="px-3 text-sm">Hủy</button></div>
    </div>}
  </article>
}

export function GroupsPanel({ meId, revision, onCreate }: { meId?: string; revision: number; onCreate: () => void }) {
  const [groups, setGroups] = useState<GroupConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [search, setSearch] = useState('')
  useEffect(() => {
    let cancelled = false
    chatApi.groups().then(data => { if (!cancelled) { setGroups(data); setError(''); setLoading(false) } })
      .catch(reason => { if (!cancelled) { setError(errorText(reason)); setLoading(false) } })
    return () => { cancelled = true }
  }, [revision, attempt])
  const filtered = groups.filter(group => group.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  return <section className="min-w-0 flex-1 overflow-y-auto p-5 md:p-8" style={{ color: 'var(--color-text)' }}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-semibold">Nhóm của bạn</h1><p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Các nhóm bạn đã tạo hoặc tham gia.</p></div>
      <button onClick={onCreate} className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: 'var(--color-primary)', color: '#fff' }}>Tạo nhóm chat</button></div>
    <input aria-label="Tìm nhóm" placeholder="Tìm tên nhóm…" value={search} onChange={event => setSearch(event.target.value)} className="mb-5 w-full rounded-xl border px-4 py-3 text-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }} />
    {loading && <p role="status">Đang tải nhóm…</p>}
    {error && <div role="alert" className="mb-4 text-sm" style={{ color: 'var(--color-error)' }}>{error}<button className="ml-3 underline" onClick={() => { setLoading(true); setError(''); setAttempt(value => value + 1) }}>Thử lại</button></div>}
    {!loading && !error && filtered.length === 0 && <p className="py-10 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>{search ? 'Không tìm thấy nhóm phù hợp.' : 'Bạn chưa tham gia nhóm nào. Hãy tạo nhóm cùng bạn bè.'}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(group => <GroupCard key={group.id} group={group} meId={meId} onSaved={saved => setGroups(items => items.map(item => item.id === saved.id ? saved : item))} />)}</div>
    {groups.length > 0 && <p className="mt-5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tính năng gửi tin nhắn trong nhóm chưa được hỗ trợ.</p>}
  </section>
}
