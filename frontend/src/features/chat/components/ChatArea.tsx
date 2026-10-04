import type { Conversation, User } from '../types/chat.types'
import type { History } from '../state/chatStore'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

type Props = {
  conversation: Conversation
  me: User
  history: History
  disabled: boolean
  onToggleInfo: () => void
  onBack: () => void
  onSend: (text: string) => Promise<void>
  onLoadOlder: () => Promise<void>
  onRetry: () => void
}
export function ChatArea({ conversation, me, history, disabled, onToggleInfo, onBack, onSend, onLoadOlder, onRetry }: Props) {
  return (
    <section aria-label={`Trò chuyện với ${conversation.participants[0].name}`} className="flex min-h-0 min-w-0 flex-1 flex-col"
      style={{ backgroundColor: 'var(--color-chat-bg)' }}>
      <ChatHeader conversation={conversation} onToggleInfo={onToggleInfo} onBack={onBack} />
      {history.error && <div role="alert" className="flex items-center justify-between gap-2 px-4 py-2 text-xs" style={{ color: 'var(--color-error)' }}>
        <span>{history.error}</span><button onClick={onRetry} className="shrink-0 underline">Thử lại</button>
      </div>}
      <MessageList messages={conversation.messages} participants={[me, ...conversation.participants]} currentUserId={me.id}
        loading={history.loading} hasOlder={!!history.nextBefore} loadingOlder={history.loadingOlder} onLoadOlder={onLoadOlder} />
      <MessageInput key={conversation.id} onSend={onSend} disabled={disabled} />
    </section>
  )
}
