import { useLayoutEffect, useRef } from 'react'
import type { Message, User } from '@/features/chat/types/chat.types'
import { formatDate } from '@/utils/date'
import { MessageBubble } from './MessageBubble'

type Props = {
  messages: Message[]
  participants: User[]
  currentUserId: string
  loading: boolean
  hasOlder: boolean
  loadingOlder: boolean
  onLoadOlder: () => Promise<void>
}

export function MessageList({ messages, participants, currentUserId, loading, hasOlder, loadingOlder, onLoadOlder }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prepend = useRef<{ height: number; top: number } | null>(null)
  const nearBottom = useRef(true)
  const lastId = messages.at(-1)?.id
  useLayoutEffect(() => {
    if (prepend.current && !loadingOlder && containerRef.current) {
      containerRef.current.scrollTop = prepend.current.top + containerRef.current.scrollHeight - prepend.current.height
      prepend.current = null
    } else if (!prepend.current && nearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' })
    }
  }, [lastId, messages.length, loadingOlder])
  async function loadOlder() {
    const el = containerRef.current
    if (el) prepend.current = { height: el.scrollHeight, top: el.scrollTop }
    await onLoadOlder()
  }

  // Group messages by date
  const grouped = groupByDate(messages)

  return (
    <div ref={containerRef} aria-label="Lịch sử tin nhắn" aria-busy={loading}
      onScroll={() => { const el = containerRef.current; if (el) nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100 }}
      className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
      {hasOlder && <button onClick={() => void loadOlder()} disabled={loading || loadingOlder}
        className="mx-auto mb-4 block rounded-full px-4 py-2 text-xs disabled:opacity-50"
        style={{ background: 'var(--color-primary-pale)', color: 'var(--color-primary)' }}>
        {loadingOlder ? 'Đang tải…' : 'Tải tin nhắn cũ hơn'}
      </button>}
      {loading && <p role="status" className="py-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>Đang tải tin nhắn…</p>}
      {!loading && messages.length === 0 && <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>Hãy gửi lời chào đầu tiên 👋</p>}
      {grouped.map(({ date, messages: dayMessages }) => (
        <div key={date}>
          {/* Date separator */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-date-line)' }} />
            <span className="shrink-0 text-[11px] font-medium" style={{ color: 'var(--color-date-text)' }}>
              {formatDate(date)}
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-date-line)' }} />
          </div>

          {/* Messages */}
          {dayMessages.map((msg, i) => {
            const isMine = msg.senderId === currentUserId
            const prev = dayMessages[i - 1]
            const showAvatar = !prev || prev.senderId !== msg.senderId
            const sender = participants.find((p) => p.id === msg.senderId)

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={isMine}
                showAvatar={showAvatar}
                senderAvatar={sender?.avatar}
                senderName={sender?.name}
              />
            )
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

function groupByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = []
  for (const msg of messages) {
    const last = groups[groups.length - 1]
    if (last && last.date === msg.date) {
      last.messages.push(msg)
    } else {
      groups.push({ date: msg.date, messages: [msg] })
    }
  }
  return groups
}
