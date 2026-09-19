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
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName!)}&background=1e3a5f&color=8bb8ff&bold=true&size=128`
    : participants[0].avatar

  return (
    <button
      onClick={onClick}
      className={`group flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 px-3 py-2.5 text-left transition-all duration-200 ${
        active
          ? 'bg-[#1a2f52] shadow-[0_2px_12px_rgba(40,88,207,0.15)]'
          : 'bg-transparent hover:bg-[#131f38]'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img src={avatarUrl} alt={displayName} className="size-[46px] rounded-full object-cover" />
        {isOnline && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#0f1729] bg-[#22c55e]" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-[13.5px] font-semibold ${active ? 'text-white' : 'text-[#d1d9e8]'}`}>
            {displayName}
          </span>
          <span className={`shrink-0 text-[11px] ${unread > 0 ? 'font-semibold text-[#60a5fa]' : 'text-[#546585]'}`}>
            {lastMessageTime}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={`m-0 truncate text-[12.5px] leading-snug ${active ? 'text-[#8fa4c8]' : 'text-[#546585]'}`}>
            {lastMessage}
          </p>
          {unread > 0 && (
            <span className="flex size-[19px] shrink-0 items-center justify-center rounded-full bg-[#2858cf] text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
