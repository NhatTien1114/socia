import { useState } from 'react'
import type { Conversation } from '@/features/chat/types/chat.types'
import { ConversationItem } from './ConversationItem'

type Props = {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onAddFriend: () => void
  onNewChat: () => void
  onCreateGroup: () => void
  loading: boolean
}

export function Sidebar({ conversations, activeId, onSelect, onAddFriend, onNewChat, onCreateGroup, loading }: Props) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? conversations.filter((c) => {
        const name = c.isGroup ? c.groupName! : c.participants[0].name
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : conversations

  return (
    <aside
      className="flex h-full min-h-0 w-full shrink-0 flex-col md:w-[260px] lg:w-[300px] xl:w-[320px] 2xl:w-[360px]"
      style={{ borderRight: '1px solid var(--color-sidebar-border)', backgroundColor: 'var(--color-sidebar-bg)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <img className="size-8 object-contain" src="/Socia_Logo.png" alt="Socia" />
          <span className="text-[17px] font-bold tracking-[-0.3px]" style={{ color: 'var(--color-sidebar-logo-text)' }}>Socia</span>
        </div>
        <button
          onClick={onNewChat}
          title="Cuộc trò chuyện mới"
          className="flex size-11 cursor-pointer items-center justify-center rounded-lg border-0 transition"
          style={{ backgroundColor: 'var(--color-sidebar-new-btn-bg)', color: 'var(--color-sidebar-new-btn-text)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-new-btn-hover)'; e.currentTarget.style.color = 'var(--color-sidebar-icon-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-new-btn-bg)'; e.currentTarget.style.color = 'var(--color-sidebar-new-btn-text)' }}
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Search + Add Friend / Create Group icons */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <div
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2 transition"
          style={{ backgroundColor: 'var(--color-sidebar-search-bg)' }}
        >
          <svg className="size-4 shrink-0" style={{ color: 'var(--color-sidebar-search-icon)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Tìm kiếm..."
            aria-label="Tìm cuộc trò chuyện"
            className="min-w-0 w-full border-0 bg-transparent text-[13px] outline-none"
            style={{ color: 'var(--color-sidebar-search-text)', '--tw-placeholder-color': 'var(--color-sidebar-search-placeholder)' } as React.CSSProperties}
          />
        </div>
        {/* Add friend icon */}
        <button
          onClick={onAddFriend}
          title="Thêm bạn"
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent transition-all duration-200"
          style={{ color: 'var(--color-sidebar-icon-text)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-icon-hover-bg)'; e.currentTarget.style.color = 'var(--color-sidebar-icon-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-sidebar-icon-text)' }}
        >
          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </button>

      </div>

      {/* Conversation list */}
      <button onClick={onCreateGroup} className="mx-4 mb-3 rounded-xl border px-3 py-2 text-sm font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}>+ Tạo nhóm chat</button>
      <div className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
        {loading && <p role="status" className="p-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>Đang tải cuộc trò chuyện…</p>}
        {!loading && filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-[13px]" style={{ color: 'var(--color-text-disabled)' }}>{search ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện. Chọn nút viết tin ở trên để nhắn cho bạn bè.'}</p>
        )}
        {filtered.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            active={conv.id === activeId}
            onClick={() => onSelect(conv.id)}
          />
        ))}
      </div>
    </aside>
  )
}
