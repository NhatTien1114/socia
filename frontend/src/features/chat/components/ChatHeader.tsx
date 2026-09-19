import type { ReactNode } from 'react'
import type { Conversation } from '@/features/chat/types/chat.types'

type Props = {
  conversation: Conversation
  onToggleInfo: () => void
}

export function ChatHeader({ conversation, onToggleInfo }: Props) {
  const { participants, isGroup, groupName } = conversation
  const displayName = isGroup ? groupName! : participants[0].name
  const isOnline = !isGroup && participants[0].online
  const avatarUrl = isGroup
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName!)}&background=1e3a5f&color=8bb8ff&bold=true&size=128`
    : participants[0].avatar
  const subtitle = isGroup
    ? `${participants.length + 1} thành viên`
    : isOnline
      ? 'Đang hoạt động'
      : 'Offline'

  return (
    <header className="flex items-center gap-3 border-b border-[#e8ecf4] bg-white/80 px-5 py-3 backdrop-blur-sm">
      {/* Avatar */}
      <div className="relative shrink-0">
        <img src={avatarUrl} alt={displayName} className="size-10 rounded-full object-cover" />
        {isOnline && (
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-[#22c55e]" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h2 className="m-0 truncate text-[15px] font-semibold text-[#1a2540]">{displayName}</h2>
        <p className={`m-0 text-[12px] ${isOnline ? 'text-[#22c55e]' : 'text-[#8490aa]'}`}>
          {subtitle}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <HeaderButton title="Gọi thoại">
          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </HeaderButton>
        <HeaderButton title="Gọi video">
          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </HeaderButton>
        <HeaderButton title="Thông tin" onClick={onToggleInfo}>
          <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </HeaderButton>
      </div>
    </header>
  )
}

function HeaderButton({ children, title, onClick }: { children: ReactNode; title: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-[#7e8aa2] transition-all duration-200 hover:bg-[#f0f4ff] hover:text-[#2858cf]"
    >
      {children}
    </button>
  )
}
