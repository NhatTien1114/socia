import { useState } from 'react'
import type { NavTab } from '@/features/chat/types/chat.types'
import { conversations } from '@/features/chat/mocks/mockData'
import { NavBar } from '@/features/chat/components/NavBar'
import { Sidebar } from '@/features/chat/components/Sidebar'
import { ChatArea } from '@/features/chat/components/ChatArea'
import { InfoPanel } from '@/features/chat/components/InfoPanel'
import { EmptyState } from '@/features/chat/components/EmptyState'

export function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>('chat')
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null

  return (
    <div className="flex h-full">
      {/* NavBar — left icon strip */}
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Sidebar — conversation list */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => {
          setActiveConvId(id)
          // Auto-close info when switching conversation
          setShowInfo(false)
        }}
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
    </div>
  )
}
