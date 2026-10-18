import type { Conversation } from '../types/chat.types'
import { avatarFor } from '../utils/chatView'

export function InfoPanel({ conversation, onClose }: { conversation: Conversation; onClose: () => void }) {
  const friend = conversation.participants[0]
  const name = conversation.isGroup ? conversation.groupName! : friend.name
  const avatar = conversation.isGroup ? conversation.groupAvatar || avatarFor(name) : friend.avatar
  return (
    <aside aria-label="Thông tin cuộc trò chuyện" className="absolute inset-y-0 right-0 z-20 w-full overflow-y-auto border-l p-5 shadow-xl sm:w-[300px] xl:static xl:shrink-0 xl:shadow-none 2xl:w-[340px]"
      style={{ background: 'var(--color-info-panel-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Thông tin</h3>
        <button onClick={onClose} aria-label="Đóng thông tin" className="rounded-lg px-3 py-1 text-xl">×</button>
      </div>
      <img src={avatar} alt={name} className="mx-auto mt-8 size-20 rounded-full object-cover" />
      <p className="mt-3 break-words text-center font-semibold">{name}</p>
      <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>{conversation.isGroup ? `${conversation.participants.length + 1} thành viên` : 'Cuộc trò chuyện 1–1'}</p>
      <div className="mt-8 rounded-xl p-4 text-sm leading-relaxed" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
        {conversation.isGroup ? 'Tin nhắn được chia sẻ với các thành viên trong nhóm và lưu trong lịch sử.' : 'Tin nhắn văn bản được lưu trong lịch sử. Bạn có thể nhắn tin khi hai người đang là bạn bè.'}
      </div>
    </aside>
  )
}
