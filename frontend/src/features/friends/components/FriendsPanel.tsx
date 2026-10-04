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

type Props = {
  onMessage: (username: string) => void
  onFriendsChanged: () => void
  currentUsername: string
}

export function FriendsPanel({ onMessage, onFriendsChanged, currentUsername }: Props) {
  const [menuTab, setMenuTab] = useState<ContactsMenuTab>('friendList')
  const [requestTab, setRequestTab] = useState<'pending' | 'sent'>('pending')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const [friends, setFriends] = useState<FriendRequest[]>([])
  const [pending, setPending] = useState<FriendRequest[]>([])
  const [sent, setSent] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(() => {
    return Promise.all([getMyFriends(), getPendingRequests(), getSentRequests()]).then(([f, p, s]) => {
      setFriends(f)
      setPending(p)
      setSent(s)
      setError('')
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Không thể tải danh bạ.')
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function getOtherName(req: FriendRequest): string {
    return req.sender === currentUsername ? req.receiver : req.sender
  }

  async function handleAccept(id: string) {
    try {
      await respondFriendRequest(id, true)
      onFriendsChanged()
      await fetchData()
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể chấp nhận lời mời.') }
  }

  async function handleReject(id: string) {
    try { await respondFriendRequest(id, false); await fetchData() }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể từ chối lời mời.') }
  }

  async function handleCancel(id: string) {
    try { await cancelFriendRequest(id); await fetchData() }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể hủy lời mời.') }
  }

  // Group friends alphabetically
  function groupAlphabetically(list: FriendRequest[]): Record<string, FriendRequest[]> {
    const groups: Record<string, FriendRequest[]> = {}
    list.forEach((req) => {
      const name = getOtherName(req)
      const firstChar = name.charAt(0).toUpperCase()
      const key = /[A-ZÀ-Ỹ]/i.test(firstChar) ? firstChar : '#'
      if (!groups[key]) groups[key] = []
      groups[key].push(req)
    })
    const sorted: Record<string, FriendRequest[]> = {}
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .forEach((key) => {
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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col md:flex-row">
      {/* Left menu sidebar */}
      <div
        className="flex w-full shrink-0 flex-col md:h-full md:w-[250px]"
        style={{
          backgroundColor: 'var(--color-friends-menu-bg)',
          borderRight: '1px solid var(--color-friends-menu-border)',
        }}
      >
        {/* Header with search + icons */}
        <div
          className="flex items-center gap-2 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--color-friends-menu-border)' }}
        >
          <div
            className="flex flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5"
            style={{ backgroundColor: 'var(--color-sidebar-search-bg)' }}
          >
            <svg
              className="size-3.5 shrink-0"
              style={{ color: 'var(--color-sidebar-search-icon)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Tìm kiếm"
              className="w-full border-0 bg-transparent text-[12px] outline-none"
              style={{
                color: 'var(--color-sidebar-search-text)',
              }}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            title="Thêm bạn"
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent transition-all duration-200"
            style={{ color: 'var(--color-sidebar-icon-text)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-sidebar-icon-hover-bg)'
              e.currentTarget.style.color = 'var(--color-sidebar-icon-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-sidebar-icon-text)'
            }}
          >
            <svg className="size-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </button>
        </div>

        {/* Menu items */}
        <div className="flex-1 space-y-0.5 px-2 py-2">
          {menuItems.map(({ id, label, icon, badge }) => {
            const isActive = menuTab === id
            return (
              <button
                key={id}
                onClick={() => setMenuTab(id)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left transition-all duration-200"
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--color-friends-menu-active-bg)',
                        color: 'var(--color-friends-menu-active-text)',
                        fontWeight: 600,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: 'var(--color-friends-menu-text)',
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--color-friends-menu-hover)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {icon}
                <span className="flex-1 text-[13px]">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span
                    className="flex size-[20px] items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: 'var(--color-friends-badge-bg)' }}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content area */}
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        style={{ backgroundColor: 'var(--color-friends-content-bg)' }}
      >
        {/* Content header */}
        <div
          className="flex items-center gap-2.5 px-6 py-4"
          style={{ borderBottom: '1px solid var(--color-friends-menu-border)' }}
        >
          <svg
            className="size-5"
            style={{ color: 'var(--color-friends-header-icon)' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          <h2 className="m-0 text-[16px] font-bold" style={{ color: 'var(--color-friends-header-text)' }}>
            {menuTab === 'friendList' ? 'Danh sách bạn bè' : 'Lời mời kết bạn'}
          </h2>
        </div>

        {/* Sub-header: count for friends or tabs for requests */}
        {menuTab === 'friendRequests' ? (
          <div
            className="flex items-center gap-2 px-6 py-2.5"
            style={{ borderBottom: '1px solid var(--color-friends-menu-border)' }}
          >
            <button
              onClick={() => setRequestTab('pending')}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all border-0"
              style={
                requestTab === 'pending'
                  ? {
                      backgroundColor: 'var(--color-friends-tab-active-bg)',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px var(--color-friends-tab-active-shadow)',
                    }
                  : {
                      backgroundColor: 'var(--color-friends-tab-bg)',
                      color: 'var(--color-friends-tab-text)',
                    }
              }
            >
              <span>Chờ duyệt</span>
              <span
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                style={{
                  backgroundColor: requestTab === 'pending' ? 'var(--color-friends-tab-badge-active-bg)' : 'var(--color-friends-tab-badge-bg)',
                  color: requestTab === 'pending' ? '#ffffff' : 'var(--color-friends-tab-badge-text)',
                }}
              >
                {pending.length}
              </span>
            </button>

            <button
              onClick={() => setRequestTab('sent')}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all border-0"
              style={
                requestTab === 'sent'
                  ? {
                      backgroundColor: 'var(--color-friends-tab-active-bg)',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px var(--color-friends-tab-active-shadow)',
                    }
                  : {
                      backgroundColor: 'var(--color-friends-tab-bg)',
                      color: 'var(--color-friends-tab-text)',
                    }
              }
            >
              <span>Đã gửi</span>
              <span
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                style={{
                  backgroundColor: requestTab === 'sent' ? 'var(--color-friends-tab-badge-active-bg)' : 'var(--color-friends-tab-badge-bg)',
                  color: requestTab === 'sent' ? '#ffffff' : 'var(--color-friends-tab-badge-text)',
                }}
              >
                {sent.length}
              </span>
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-4 px-6 py-3"
            style={{ borderBottom: '1px solid var(--color-friends-menu-border)' }}
          >
            <span className="text-[13px] font-medium" style={{ color: 'var(--color-friends-count-text)' }}>
              Bạn bè ({friends.length})
            </span>
          </div>
        )}

        {/* Content */}
        {error && <div role="alert" className="flex items-center justify-between gap-2 px-6 py-3 text-sm" style={{ color: 'var(--color-error)' }}>
          <span>{error}</span><button onClick={() => void fetchData()} className="shrink-0 underline">Thử lại</button>
        </div>}
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span
                className="inline-block size-7 animate-spin rounded-full border-2"
                style={{
                  borderColor: 'var(--color-friends-spinner-track)',
                  borderTopColor: 'var(--color-friends-spinner)',
                }}
              />
              <p className="mt-3 text-[13px]" style={{ color: 'var(--color-friends-empty-title)' }}>
                Đang tải...
              </p>
            </div>
          ) : menuTab === 'friendList' ? (
            /* ─── Friend list grouped alphabetically ─── */
            filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div
                  className="mb-4 flex size-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--color-friends-empty-icon-bg)' }}
                >
                  <svg className="size-8" style={{ color: 'var(--color-friends-empty-icon)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p className="text-[14px] font-medium" style={{ color: 'var(--color-friends-empty-title)' }}>
                  Chưa có bạn bè nào
                </p>
                <p className="mt-1 text-[12px]" style={{ color: 'var(--color-friends-empty-text)' }}>
                  Hãy thêm bạn mới để bắt đầu trò chuyện
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 flex h-[36px] cursor-pointer items-center gap-2 rounded-lg border-0 px-5 text-[13px] font-semibold text-white transition-all"
                  style={{ backgroundColor: 'var(--color-friends-add-btn-bg)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-friends-add-btn-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-friends-add-btn-bg)'
                  }}
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
                    <div
                      className="sticky top-0 z-10 py-2"
                      style={{ backgroundColor: 'var(--color-friends-letter-sticky-bg)' }}
                    >
                      <span className="text-[13px] font-bold" style={{ color: 'var(--color-friends-letter)' }}>
                        {letter}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {items.map((req) => (
                        <FriendItem
                          key={req.id}
                          request={req}
                          variant="accepted"
                          onMessage={onMessage}
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
                  <div
                    className="mb-4 flex size-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--color-friends-empty-icon-bg)' }}
                  >
                    <svg className="size-8" style={{ color: 'var(--color-friends-empty-icon)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--color-friends-empty-title)' }}>
                    Không có lời mời kết bạn nào cần duyệt
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: 'var(--color-friends-empty-text)' }}>
                    Khi người khác gửi lời mời kết bạn, yêu cầu sẽ xuất hiện ở đây
                  </p>
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
                  <div
                    className="mb-4 flex size-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--color-friends-empty-icon-bg)' }}
                  >
                    <svg className="size-8" style={{ color: 'var(--color-friends-empty-icon)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--color-friends-empty-title)' }}>
                    Bạn chưa gửi lời mời kết bạn nào
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: 'var(--color-friends-empty-text)' }}>
                    Các lời mời bạn gửi cho người khác sẽ xuất hiện ở đây
                  </p>
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
