import type { Conversation } from '../types/chat.types'

export function InfoPanel({ conversation, onClose }: { conversation: Conversation; onClose: () => void }) {
  const friend = conversation.participants[0]
  return (
    <aside aria-label="Thông tin cuộc trò chuyện" className="absolute inset-y-0 right-0 z-20 w-[min(280px,100%)] border-l p-5 shadow-xl xl:static xl:shrink-0 xl:shadow-none"
      style={{ background: 'var(--color-info-panel-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Thông tin</h3>
        <button onClick={onClose} aria-label="Đóng thông tin" className="rounded-lg px-3 py-1 text-xl">×</button>
      </div>
      <img src={friend.avatar} alt={friend.name} className="mx-auto mt-8 size-20 rounded-full object-cover" />
      <p className="mt-3 break-words text-center font-semibold">{friend.name}</p>
      <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cuộc trò chuyện 1–1</p>
      <div className="mt-8 rounded-xl p-4 text-sm leading-relaxed" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
        Tin nhắn văn bản được lưu trong lịch sử. Bạn có thể nhắn tin khi hai người đang là bạn bè.
      </div>
    </aside>
  )
}
