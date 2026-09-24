import { useState } from 'react'
import type { Conversation } from '@/features/chat/types/chat.types'
import { ConversationItem } from './ConversationItem'

type Props = {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onAddFriend: () => void
}

export function Sidebar({ conversations, activeId, onSelect, onAddFriend }: Props) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? conversations.filter((c) => {
        const name = c.isGroup ? c.groupName! : c.participants[0].name
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : conversations

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-r border-[#1a2540] bg-[#0f1729]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <img className="size-8 object-contain" src="/Socia_Logo.png" alt="Socia" />
          <span className="text-[17px] font-bold tracking-[-0.3px] text-white">Socia</span>
        </div>
        <button
          title="Cuộc trò chuyện mới"
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-[#1a2540] text-[#60a5fa] transition hover:bg-[#1e2d4a] hover:text-white"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Search + Add Friend / Create Group icons */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-[#1a2540] px-3 py-2 transition focus-within:bg-[#1e2d4a] focus-within:ring-1 focus-within:ring-[#2858cf]/40">
          <svg className="size-4 shrink-0 text-[#546585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full border-0 bg-transparent text-[13px] text-[#d1d9e8] outline-none placeholder:text-[#546585]"
          />
        </div>
        {/* Add friend icon */}
        <button
          onClick={onAddFriend}
          title="Thêm bạn"
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[#546585] transition-all duration-200 hover:bg-[#1a2540] hover:text-[#60a5fa]"
        >
          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </button>
        {/* Create group icon */}
        <button
          title="Tạo nhóm"
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[#546585] transition-all duration-200 hover:bg-[#1a2540] hover:text-[#60a5fa]"
        >
          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>
      </div>

      {/* Conversation list */}
      <div className="scrollbar-dark flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-[13px] text-[#546585]">Không tìm thấy cuộc trò chuyện</p>
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
