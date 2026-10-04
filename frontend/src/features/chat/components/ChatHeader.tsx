import type { ReactNode } from 'react'
import type { Conversation } from '@/features/chat/types/chat.types'

type Props = {
  conversation: Conversation
  onToggleInfo: () => void
  onBack: () => void
}

export function ChatHeader({ conversation, onToggleInfo, onBack }: Props) {
  const { participants, isGroup, groupName } = conversation
  const displayName = isGroup ? groupName! : participants[0].name
  const isOnline = !isGroup && participants[0].online
  const avatarUrl = isGroup
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName!)}&background=514CB2&color=CACEE8&bold=true&size=128`
    : participants[0].avatar
  const subtitle = isGroup
    ? `${participants.length + 1} thành viên`
    : isOnline
      ? 'Đang hoạt động'
      : 'Trò chuyện riêng tư'

  return (
    <header
      className="flex items-center gap-3 px-5 py-3 backdrop-blur-sm"
      style={{ borderBottom: '1px solid var(--color-chat-header-border)', backgroundColor: 'var(--color-chat-header-bg)' }}
    >
      <button onClick={onBack} aria-label="Quay lại danh sách" className="rounded-lg p-2 md:hidden" style={{ color: 'var(--color-text)' }}>←</button>
      {/* Avatar */}
      <div className="relative shrink-0">
        <img src={avatarUrl} alt={displayName} className="size-10 rounded-full object-cover" />
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 size-2.5 rounded-full border-2"
            style={{ borderColor: 'var(--color-surface)', backgroundColor: 'var(--color-success)' }}
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h2 className="m-0 truncate text-[15px] font-semibold" style={{ color: 'var(--color-chat-header-name)' }}>{displayName}</h2>
        <p className="m-0 text-[12px]" style={{ color: isOnline ? 'var(--color-success)' : 'var(--color-chat-header-status)' }}>
          {subtitle}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
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
      className="flex size-9 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent transition-all duration-200"
      style={{ color: 'var(--color-chat-header-btn)' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-chat-header-btn-hover-bg)'; e.currentTarget.style.color = 'var(--color-chat-header-btn-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-chat-header-btn)' }}
    >
      {children}
    </button>
  )
}
