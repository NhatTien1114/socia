import type { Conversation } from '@/features/chat/types/chat.types'
import { currentUser } from '@/features/chat/mocks/mockData'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

type Props = {
  conversation: Conversation
  onToggleInfo: () => void
}

export function ChatArea({ conversation, onToggleInfo }: Props) {
  // Merge currentUser into participants for MessageList to resolve avatar
  const allParticipants = [currentUser, ...conversation.participants]

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[#f4f7ff]">
      <ChatHeader conversation={conversation} onToggleInfo={onToggleInfo} />
      <MessageList messages={conversation.messages} participants={allParticipants} />
      <MessageInput />
    </div>
  )
}
