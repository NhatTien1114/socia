import { useState } from 'react'
import type { Conversation, NavTab } from '@/features/chat/types/chat.types'
import { NavBar } from '@/features/chat/components/NavBar'
import { Sidebar } from '@/features/chat/components/Sidebar'
import { ChatArea } from '@/features/chat/components/ChatArea'
import { InfoPanel } from '@/features/chat/components/InfoPanel'
import { EmptyState } from '@/features/chat/components/EmptyState'
import { NewChatDialog } from '@/features/chat/components/NewChatDialog'
import { FriendsPanel } from '@/features/friends/components/FriendsPanel'
import { AddFriendModal } from '@/features/friends/components/AddFriendModal'
import { SettingsPanel } from '@/features/chat/components/SettingsPanel'
import { useChat } from '@/features/chat/hooks/useChat'
import { compareMessages, emptyHistory } from '@/features/chat/state/chatStore'
import { toMessage, toUser } from '@/features/chat/utils/chatView'
import { removeAccessToken } from '@/utils/storage'

export function HomePage() {
  const { state, store } = useChat()
  const [activeTab, setActiveTab] = useState<NavTab>('chat')
  const [showInfo, setShowInfo] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [localError, setLocalError] = useState('')
  const me = state.me ? toUser(state.me) : null
  const rooms = [...state.rooms].sort((a, b) => {
    const first = state.latest[a.id], second = state.latest[b.id]
    return first && second ? compareMessages(second, first) : first ? -1 : second ? 1 : 0
  })
  const conversations: Conversation[] = rooms.map(room => ({
    id: room.id, participants: [toUser(room.friend)], isGroup: false,
    lastMessage: state.latest[room.id]?.content ?? 'Bắt đầu cuộc trò chuyện',
    lastMessageTime: state.latest[room.id]?.createdAt.slice(11, 16) ?? '',
    unread: state.unread[room.id] ?? 0,
    messages: (state.histories[room.id]?.items ?? []).map(toMessage),
  }))
  const active = conversations.find(room => room.id === state.activeId)

  function navigate(tab: NavTab) {
    setActiveTab(tab)
    setShowInfo(false)
    if (tab !== 'chat') store.select(null)
    if (tab === 'contacts') void store.refresh()
  }
  async function open(friendId: string) {
    setLocalError('')
    if (await store.open(friendId)) {
      setActiveTab('chat'); setShowNewChat(false); setShowInfo(false)
    }
  }
  async function openByName(username: string) {
    await store.refresh()
    const friend = store.getSnapshot().friends.find(item => item.username === username)
    if (friend) await open(friend.id)
    else setLocalError('Không tìm thấy người này trong danh sách bạn bè. Vui lòng tải lại danh bạ.')
  }

  return (
    <div className="flex h-full min-h-0">
      <NavBar me={me} activeTab={activeTab} onTabChange={navigate} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div role="status" aria-live="polite" className="flex min-h-8 shrink-0 items-center gap-2 border-b px-4 py-1 text-[11px]"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
          <span className="size-1.5 rounded-full" style={{ background: state.connection === 'connected' ? 'var(--color-success)' : 'var(--color-warning)' }} />
          {state.expired ? 'Phiên đăng nhập hết hạn' : state.connection === 'connected' ? 'Đã kết nối' : state.connection === 'connecting' ? 'Đang kết nối…' : 'Mất kết nối realtime · Đang kết nối lại…'}
        </div>
        {(state.error || localError) && <div role="alert" className="flex flex-wrap items-center gap-3 px-4 py-2 text-xs"
          style={{ background: 'var(--color-surface)', color: 'var(--color-error)' }}>
          <span className="flex-1">{state.error || localError}</span>
          {state.expired ? <button className="underline" onClick={() => { removeAccessToken(); window.location.href = '/login' }}>Đăng nhập lại</button>
            : <button className="underline" onClick={() => { setLocalError(''); void store.refresh() }}>Thử lại</button>}
        </div>}
        <div className="relative flex min-h-0 flex-1">
          {activeTab === 'contacts' ? <FriendsPanel currentUsername={state.me?.username ?? ''}
            onMessage={name => void openByName(name)} onFriendsChanged={() => void store.refresh()} />
            : activeTab === 'settings' ? <SettingsPanel />
            : activeTab === 'groups' ? <div className="m-auto p-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>Chat nhóm chưa được hỗ trợ. Chọn Tin nhắn để trò chuyện 1–1.</div>
            : <>
              <div className={`${active ? 'hidden md:flex' : 'flex'} min-h-0 w-full md:w-auto`}>
                <Sidebar conversations={conversations} activeId={state.activeId} loading={state.loading}
                  onSelect={id => { store.select(id); setShowInfo(false) }}
                  onAddFriend={() => setShowAddFriend(true)}
                  onNewChat={() => { store.clearError(); void store.refresh(); setShowNewChat(true) }} />
              </div>
              {active && me ? <ChatArea key={active.id} conversation={active} me={me}
                history={state.histories[active.id] ?? emptyHistory()} disabled={state.expired}
                onToggleInfo={() => setShowInfo(value => !value)} onBack={() => store.select(null)}
                onSend={text => store.send(active.id, text)} onLoadOlder={() => store.loadOlder(active.id)}
                onRetry={() => void (state.histories[active.id]?.nextBefore ? store.loadOlder(active.id) : store.loadHistory(active.id))} />
                : <div className="hidden min-w-0 flex-1 md:flex" style={{ background: 'var(--color-chat-bg)' }}><EmptyState /></div>}
              {active && showInfo && <InfoPanel conversation={active} onClose={() => setShowInfo(false)} />}
            </>}
        </div>
      </div>
      {showNewChat && <NewChatDialog friends={state.friends} busy={state.opening} loading={state.loading} error={state.error}
        onChoose={id => void open(id)} onClose={() => setShowNewChat(false)}
        onContacts={() => { setShowNewChat(false); navigate('contacts') }} />}
      <AddFriendModal open={showAddFriend} onClose={() => setShowAddFriend(false)} onSuccess={() => void store.refresh()} />
    </div>
  )
}
