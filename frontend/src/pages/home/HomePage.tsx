import { useState } from 'react'
import type { NavTab } from '@/features/chat/types/chat.types'
import { conversations } from '@/features/chat/mocks/mockData'
import { NavBar } from '@/features/chat/components/NavBar'
import { Sidebar } from '@/features/chat/components/Sidebar'
import { ChatArea } from '@/features/chat/components/ChatArea'
import { InfoPanel } from '@/features/chat/components/InfoPanel'
import { EmptyState } from '@/features/chat/components/EmptyState'
import { FriendsPanel } from '@/features/friends/components/FriendsPanel'
import { AddFriendModal } from '@/features/friends/components/AddFriendModal'

export function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>('chat')
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)

  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null

  return (
    <div className="flex h-full">
      {/* NavBar — left icon strip */}
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'contacts' ? (
        /* Contacts: FriendsPanel takes up entire remaining space */
        <FriendsPanel />
      ) : (
        <>
          {/* Sidebar — conversation list */}
          <Sidebar
            conversations={conversations}
            activeId={activeConvId}
            onSelect={(id) => {
              setActiveConvId(id)
              setShowInfo(false)
            }}
            onAddFriend={() => setShowAddFriend(true)}
          />

          {/* Chat area or empty state */}
          {activeConversation ? (
            <ChatArea conversation={activeConversation} onToggleInfo={() => setShowInfo(!showInfo)} />
          ) : (
            <div className="flex min-w-0 flex-1 bg-[#f4f7ff]">
              <EmptyState />
            </div>
          )}

          {/* Info panel */}
          {activeConversation && showInfo && (
            <InfoPanel conversation={activeConversation} onClose={() => setShowInfo(false)} />
          )}
        </>
      )}

      {/* Add Friend Modal — accessible from chat sidebar */}
      <AddFriendModal
        open={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onSuccess={() => {}}
      />
    </div>
  )
}
