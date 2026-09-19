import { useEffect, useRef } from 'react'
import type { Message, User } from '@/features/chat/types/chat.types'
import { formatDate } from '@/utils/date'
import { MessageBubble } from './MessageBubble'

type Props = {
  messages: Message[]
  participants: User[]
}

export function MessageList({ messages, participants }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Group messages by date
  const grouped = groupByDate(messages)

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
      {grouped.map(({ date, messages: dayMessages }) => (
        <div key={date}>
          {/* Date separator */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e3e8f2]" />
            <span className="shrink-0 text-[11px] font-medium text-[#9ca3af]">{formatDate(date)}</span>
            <div className="h-px flex-1 bg-[#e3e8f2]" />
          </div>

          {/* Messages */}
          {dayMessages.map((msg, i) => {
            const isMine = msg.senderId === 'me'
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
