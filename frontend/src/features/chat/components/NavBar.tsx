import type { JSX } from 'react'
import type { NavTab } from '@/features/chat/types/chat.types'
import { currentUser } from '@/features/chat/mocks/mockData'
import { removeAccessToken } from '@/utils/storage'
import { APP_ROUTES } from '@/constants/routes'

type Props = {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
}

export function NavBar({ activeTab, onTabChange }: Props) {
  function handleLogout() {
    removeAccessToken()
    window.location.href = APP_ROUTES.LOGIN
  }

  const tabs: { id: NavTab; label: string; icon: JSX.Element }[] = [
    { id: 'chat', label: 'Tin nhắn', icon: <ChatIcon /> },
    { id: 'contacts', label: 'Danh bạ', icon: <ContactsIcon /> },
    { id: 'groups', label: 'Nhóm', icon: <GroupsIcon /> },
    { id: 'settings', label: 'Cài đặt', icon: <SettingsIcon /> },
  ]

  return (
    <nav className="flex h-full w-[72px] shrink-0 flex-col items-center bg-[#0b1120] py-5">
      {/* Avatar */}
      <div className="relative mb-6">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="size-10 rounded-full object-cover ring-2 ring-[#2858cf]/40"
        />
        <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#0b1120] bg-[#22c55e]" />
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-1 flex-col items-center gap-1">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            title={label}
            className={`group flex size-11 cursor-pointer items-center justify-center rounded-xl border-0 transition-all duration-200 ${
              activeTab === id
                ? 'bg-[#2858cf] text-white shadow-[0_4px_12px_rgba(40,88,207,0.35)]'
                : 'bg-transparent text-[#546585] hover:bg-[#131f38] hover:text-[#94a3b8]'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Đăng xuất"
        className="flex size-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-[#546585] transition-all duration-200 hover:bg-[#2a1520] hover:text-[#f87171]"
      >
        <LogoutIcon />
      </button>
    </nav>
  )
}

// ─── Icons ───────────────────────────────────────────────────
function ChatIcon() {
  return (
    <svg className="size-[21px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function ContactsIcon() {
  return (
    <svg className="size-[21px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function GroupsIcon() {
  return (
    <svg className="size-[21px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="size-[21px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="size-[21px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
