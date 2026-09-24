import { useState, useEffect, useCallback, type JSX } from 'react'
import type { FriendRequest, ContactsMenuTab } from '@/features/friends/types/friend.types'
import {
  getMyFriends,
  getPendingRequests,
  getSentRequests,
  respondFriendRequest,
  cancelFriendRequest,
} from '@/features/friends/services/friendApi'
import { FriendItem } from './FriendItem.tsx'
import { AddFriendModal } from './AddFriendModal.tsx'

export function FriendsPanel() {
  const [menuTab, setMenuTab] = useState<ContactsMenuTab>('friendList')
  const [requestTab, setRequestTab] = useState<'pending' | 'sent'>('pending')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const [friends, setFriends] = useState<FriendRequest[]>([])
  const [pending, setPending] = useState<FriendRequest[]>([])
  const [sent, setSent] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)

  function getCurrentUsername(): string {
    const token = localStorage.getItem('socia_access_token')
    if (!token) return ''
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub ?? ''
    } catch {
      return ''
    }
  }

  const currentUsername = getCurrentUsername()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [f, p, s] = await Promise.all([getMyFriends(), getPendingRequests(), getSentRequests()])
      setFriends(f)
      setPending(p)
      setSent(s)
    } catch (err) {
      console.error('Failed to load friends data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function getOtherName(req: FriendRequest): string {
    return req.sender === currentUsername ? req.receiver : req.sender
  }

  async function handleAccept(id: string) {
    await respondFriendRequest(id, true)
    fetchData()
  }

  async function handleReject(id: string) {
    await respondFriendRequest(id, false)
    fetchData()
  }

  async function handleCancel(id: string) {
    await cancelFriendRequest(id)
    fetchData()
  }

  // Group friends alphabetically
  function groupAlphabetically(list: FriendRequest[]): Record<string, FriendRequest[]> {
    const groups: Record<string, FriendRequest[]> = {}
    list.forEach((req) => {
      const name = getOtherName(req)
      const firstChar = name.charAt(0).toUpperCase()
      // Check if first char is a letter
      const key = /[A-ZÀ-Ỹ]/i.test(firstChar) ? firstChar : '#'
      if (!groups[key]) groups[key] = []
      groups[key].push(req)
    })
    // Sort keys alphabetically
    const sorted: Record<string, FriendRequest[]> = {}
    Object.keys(groups).sort((a, b) => a.localeCompare(b, 'vi')).forEach((key) => {
      sorted[key] = groups[key].sort((a, b) => getOtherName(a).localeCompare(getOtherName(b), 'vi'))
    })
    return sorted
  }

  function filterBySearch(list: FriendRequest[]): FriendRequest[] {
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((r) => getOtherName(r).toLowerCase().includes(q))
  }

  const filteredFriends = filterBySearch(friends)
  const filteredPending = filterBySearch(pending)
  const filteredSent = filterBySearch(sent)
  const groupedFriends = groupAlphabetically(filteredFriends)

  const menuItems: { id: ContactsMenuTab; label: string; icon: JSX.Element; badge?: number }[] = [
    {
      id: 'friendList',
      label: 'Danh sách bạn bè',
      icon: (
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'friendRequests',
      label: 'Lời mời kết bạn',
      badge: pending.length,
      icon: (
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex h-full min-w-0 flex-1">
      {/* Left menu sidebar */}
      <div className="flex h-full w-[250px] shrink-0 flex-col border-r border-[#1a2540] bg-[#0f1729]">
        {/* Header with search + icons */}
        <div className="flex items-center gap-2 border-b border-[#1a2540] px-4 py-3.5">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-[#1a2540] px-2.5 py-1.5">
            <svg className="size-3.5 shrink-0 text-[#546585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Tìm kiếm"
              className="w-full border-0 bg-transparent text-[12px] text-[#d1d9e8] outline-none placeholder:text-[#546585]"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            title="Thêm bạn"
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[#546585] transition-all duration-200 hover:bg-[#1a2540] hover:text-[#60a5fa]"
          >
            <svg className="size-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </button>
          <button
            title="Tạo nhóm"
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[#546585] transition-all duration-200 hover:bg-[#1a2540] hover:text-[#60a5fa]"
          >
            <svg className="size-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>
        </div>

        {/* Menu items */}
        <div className="flex-1 space-y-0.5 px-2 py-2">
          {menuItems.map(({ id, label, icon, badge }) => (
            <button
              key={id}
              onClick={() => setMenuTab(id)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left transition-all duration-200 ${menuTab === id
                  ? 'bg-[#2858cf]/15 text-[#60a5fa]'
                  : 'bg-transparent text-[#94a3b8] hover:bg-[#131f38]'
                }`}
            >
              {icon}
              <span className="flex-1 text-[13px] font-medium">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="flex size-[20px] items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex h-full min-w-0 flex-1 flex-col bg-[#0b1120]">
        {/* Content header */}
        <div className="flex items-center gap-2.5 border-b border-[#1a2540] px-6 py-4">
          <svg className="size-5 text-[#60a5fa]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {menuTab === 'friendList' ? (
              <>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </>
            ) : (
              <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </>
            )}
          </svg>
          <h2 className="m-0 text-[16px] font-bold text-white">
            {menuTab === 'friendList' ? 'Danh sách bạn bè' : 'Lời mời kết bạn'}
          </h2>
        </div>

        {/* Sub-header: count for friends or tabs for requests */}
        {menuTab === 'friendRequests' ? (
          <div className="flex items-center gap-2 border-b border-[#1a2540] px-6 py-2.5">
            <button
              onClick={() => setRequestTab('pending')}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
                requestTab === 'pending'
                  ? 'bg-[#2858cf] text-white shadow-sm shadow-[#2858cf]/25'
                  : 'bg-[#1a2540]/60 text-[#94a3b8] hover:bg-[#1a2540] hover:text-white'
              }`}
            >
              <span>Chờ duyệt</span>
              <span
                className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  requestTab === 'pending'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#1a2540] text-[#94a3b8]'
                }`}
              >
                {pending.length}
              </span>
            </button>

            <button
              onClick={() => setRequestTab('sent')}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
                requestTab === 'sent'
                  ? 'bg-[#2858cf] text-white shadow-sm shadow-[#2858cf]/25'
                  : 'bg-[#1a2540]/60 text-[#94a3b8] hover:bg-[#1a2540] hover:text-white'
              }`}
            >
              <span>Đã gửi</span>
              <span
                className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  requestTab === 'sent'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#1a2540] text-[#94a3b8]'
                }`}
              >
                {sent.length}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 border-b border-[#1a2540] px-6 py-3">
            <span className="text-[13px] font-medium text-[#94a3b8]">
              Bạn bè ({friends.length})
            </span>
          </div>
        )}

        {/* Content */}
        <div className="scrollbar-dark flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="inline-block size-7 animate-spin rounded-full border-2 border-[#2858cf]/20 border-t-[#2858cf]" />
              <p className="mt-3 text-[13px] text-[#546585]">Đang tải...</p>
            </div>
          ) : menuTab === 'friendList' ? (
            /* ─── Friend list grouped alphabetically ─── */
            filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#1a2540]">
                  <svg className="size-8 text-[#546585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p className="text-[14px] font-medium text-[#94a3b8]">Chưa có bạn bè nào</p>
                <p className="mt-1 text-[12px] text-[#546585]">Hãy thêm bạn mới để bắt đầu trò chuyện</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 flex h-[36px] cursor-pointer items-center gap-2 rounded-lg border-0 bg-[#2858cf] px-5 text-[13px] font-semibold text-white transition-all hover:bg-[#3468e0]"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Thêm bạn mới
                </button>
              </div>
            ) : (
              <div className="px-6 py-2">
                {Object.entries(groupedFriends).map(([letter, items]) => (
                  <div key={letter}>
                    <div className="sticky top-0 z-10 bg-[#0b1120] py-2">
                      <span className="text-[13px] font-bold text-[#60a5fa]">{letter}</span>
                    </div>
                    <div className="space-y-0.5">
                      {items.map((req) => (
                        <FriendItem
                          key={req.id}
                          request={req}
                          variant="accepted"
                          displayName={getOtherName(req)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : requestTab === 'pending' ? (
            /* ─── Pending received (Chờ duyệt) ─── */
            <div className="px-6 py-4">
              {filteredPending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#1a2540]">
                    <svg className="size-8 text-[#546585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-medium text-[#94a3b8]">Không có lời mời kết bạn nào cần duyệt</p>
                  <p className="mt-1 text-[12px] text-[#546585]">Khi người khác gửi lời mời kết bạn, yêu cầu sẽ xuất hiện ở đây</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredPending.map((req) => (
                    <FriendItem
                      key={req.id}
                      request={req}
                      variant="pending"
                      displayName={getOtherName(req)}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ─── Sent requests (Đã gửi) ─── */
            <div className="px-6 py-4">
              {filteredSent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#1a2540]">
                    <svg className="size-8 text-[#546585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-medium text-[#94a3b8]">Bạn chưa gửi lời mời kết bạn nào</p>
                  <p className="mt-1 text-[12px] text-[#546585]">Các lời mời bạn gửi cho người khác sẽ xuất hiện ở đây</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredSent.map((req) => (
                    <FriendItem
                      key={req.id}
                      request={req}
                      variant="sent"
                      displayName={getOtherName(req)}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}
