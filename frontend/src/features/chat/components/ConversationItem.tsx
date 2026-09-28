import type { Conversation } from '@/features/chat/types/chat.types'

type Props = {
  conversation: Conversation
  active: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, active, onClick }: Props) {
  const { participants, isGroup, groupName, lastMessage, lastMessageTime, unread } = conversation
  const displayName = isGroup ? groupName! : participants[0].name
  const isOnline = !isGroup && participants[0].online
  const avatarUrl = isGroup
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName!)}&background=514CB2&color=CACEE8&bold=true&size=128`
    : participants[0].avatar

  return (
    <button
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 px-3 py-2.5 text-left transition-all duration-200"
      style={{
        backgroundColor: active ? 'var(--color-conv-active-bg)' : 'transparent',
        boxShadow: active ? `0 2px 12px var(--color-conv-active-shadow)` : 'none',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--color-conv-hover-bg)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img src={avatarUrl} alt={displayName} className="size-[46px] rounded-full object-cover" />
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 size-3 rounded-full border-2"
            style={{ borderColor: 'var(--color-conv-online-border)', backgroundColor: 'var(--color-success)' }}
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate text-[13.5px] font-semibold"
            style={{ color: active ? 'var(--color-conv-name-active)' : 'var(--color-conv-name)' }}
          >
            {displayName}
          </span>
          <span
            className="shrink-0 text-[11px]"
            style={{ color: unread > 0 ? 'var(--color-conv-time-unread)' : 'var(--color-conv-time)', fontWeight: unread > 0 ? 600 : 400 }}
          >
            {lastMessageTime}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className="m-0 truncate text-[12.5px] leading-snug"
            style={{ color: active ? 'var(--color-conv-preview-active)' : 'var(--color-conv-preview)' }}
          >
            {lastMessage}
          </p>
          {unread > 0 && (
            <span
              className="flex size-[19px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: 'var(--color-conv-unread-bg)' }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
