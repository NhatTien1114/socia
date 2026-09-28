import { useState } from 'react'
import type { UserSearchResult } from '@/features/friends/types/friend.types'
import { searchUsers, sendFriendRequest } from '@/features/friends/services/friendApi'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function avatarUrl(name: string, bg = '756FB3') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=128`
}

const AVATAR_COLORS = ['756FB3', '514CB2', '9A95D0', '35A56A', 'E4A84C', '5D8CC9', 'D95C6A']
function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function AddFriendModal({ open, onClose, onSuccess }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSearch() {
    if (!query.trim()) return
    setError('')
    setLoading(true)
    setSearched(true)
    try {
      const data = await searchUsers(query.trim())
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  async function handleSendRequest(user: UserSearchResult) {
    setSendingId(user.id)
    setError('')
    try {
      await sendFriendRequest({ recieverName: user.username })
      setSentIds((prev) => new Set(prev).add(user.id))
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.')
    } finally {
      setSendingId(null)
    }
  }

  function handleClose() {
    onClose()
    setQuery('')
    setResults([])
    setSearched(false)
    setError('')
    setSentIds(new Set())
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) handleClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--color-modal-backdrop)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="flex w-full max-w-[440px] flex-col rounded-2xl shadow-2xl"
        style={{
          backgroundColor: 'var(--color-modal-bg)',
          border: '1px solid var(--color-modal-border)',
          animation: 'slideUp 0.25s ease-out',
          maxHeight: '75vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-modal-border)' }}
        >
          <h3 className="m-0 text-[16px] font-bold" style={{ color: 'var(--color-modal-title)' }}>
            Thêm bạn
          </h3>
          <button
            onClick={handleClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent transition-all duration-200"
            style={{ color: 'var(--color-modal-close)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-modal-close-hover-bg)'
              e.currentTarget.style.color = 'var(--color-modal-close-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-modal-close)'
            }}
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-modal-border)' }}
        >
          <div
            className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-modal-input-bg)',
              borderColor: 'var(--color-modal-input-border)',
            }}
          >
            <svg
              className="size-4 shrink-0"
              style={{ color: 'var(--color-modal-input-icon)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tên hoặc số điện thoại..."
              autoFocus
              className="w-full border-0 bg-transparent text-[13.5px] outline-none"
              style={{
                color: 'var(--color-modal-input-text)',
              }}
            />
          </div>
        </div>

        {/* Results area */}
        <div className="scrollbar-thin flex-1 overflow-y-auto px-2.5 py-2">
          {loading && (
            <div className="flex flex-col items-center py-10">
              <span
                className="inline-block size-6 animate-spin rounded-full border-2"
                style={{
                  borderColor: 'var(--color-modal-spinner-track)',
                  borderTopColor: 'var(--color-modal-spinner)',
                }}
              />
              <p className="mt-3 text-[12px]" style={{ color: 'var(--color-modal-empty-text)' }}>
                Đang tìm kiếm...
              </p>
            </div>
          )}

          {!loading && error && (
            <div
              className="mx-2.5 mt-2 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12px]"
              style={{
                backgroundColor: 'var(--color-modal-error-bg)',
                color: 'var(--color-modal-error-text)',
              }}
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {!loading && searched && results.length === 0 && !error && (
            <div className="flex flex-col items-center py-10">
              <div
                className="mb-3 flex size-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'var(--color-modal-empty-bg)' }}
              >
                <svg className="size-6" style={{ color: 'var(--color-modal-empty-icon)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-modal-empty-text)' }}>
                Không tìm thấy người dùng
              </p>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--color-modal-empty-sub)' }}>
                Thử nhập chính xác tên hoặc số điện thoại
              </p>
            </div>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center py-10">
              <div
                className="mb-3 flex size-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'var(--color-modal-empty-bg)' }}
              >
                <svg className="size-6" style={{ color: 'var(--color-modal-empty-icon)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--color-modal-empty-text)' }}>
                Tìm bạn bè
              </p>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--color-modal-empty-sub)' }}>
                Nhập tên hoặc số điện thoại rồi nhấn Enter
              </p>
            </div>
          )}

          {/* Search results */}
          {!loading && results.length > 0 && (
            <div>
              <p className="px-3 py-2 text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--color-modal-label)' }}>
                Kết quả tìm kiếm
              </p>
              {results.map((user) => {
                const isSent = sentIds.has(user.id)
                const isSending = sendingId === user.id
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-modal-result-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <img
                      src={user.avatar || avatarUrl(user.username, colorFromName(user.username))}
                      alt={user.username}
                      className="size-[44px] rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-[13.5px] font-semibold" style={{ color: 'var(--color-modal-result-name)' }}>
                        {user.username}
                      </p>
                      {user.phone && (
                        <p className="m-0 mt-0.5 truncate text-[11.5px]" style={{ color: 'var(--color-modal-result-sub)' }}>
                          {user.phone}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => !isSent && handleSendRequest(user)}
                      disabled={isSent || isSending}
                      className="flex h-[32px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 text-[12px] font-semibold transition-all duration-200 disabled:cursor-not-allowed"
                      style={
                        isSent
                          ? {
                              borderColor: 'var(--color-modal-sent-border)',
                              backgroundColor: 'var(--color-modal-sent-bg)',
                              color: 'var(--color-modal-sent-text)',
                              cursor: 'default',
                            }
                          : {
                              borderColor: 'var(--color-modal-add-border)',
                              backgroundColor: 'transparent',
                              color: 'var(--color-modal-add-text)',
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!isSent && !isSending) {
                          e.currentTarget.style.backgroundColor = 'var(--color-modal-add-hover-bg)'
                          e.currentTarget.style.borderColor = 'var(--color-modal-add-hover-border)'
                          e.currentTarget.style.color = '#ffffff'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSent && !isSending) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.borderColor = 'var(--color-modal-add-border)'
                          e.currentTarget.style.color = 'var(--color-modal-add-text)'
                        }
                      }}
                    >
                      {isSending ? (
                        <span className="inline-block size-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                      ) : isSent ? (
                        <>
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Đã gửi
                        </>
                      ) : (
                        'Kết bạn'
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div
          className="flex items-center justify-end gap-2.5 px-5 py-3.5"
          style={{ borderTop: '1px solid var(--color-modal-border)' }}
        >
          <button
            onClick={handleClose}
            className="flex h-[36px] cursor-pointer items-center rounded-lg border-0 px-5 text-[13px] font-semibold transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-modal-cancel-bg)',
              color: 'var(--color-modal-cancel-text)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-modal-cancel-hover)'
              e.currentTarget.style.color = 'var(--color-modal-cancel-hover-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-modal-cancel-bg)'
              e.currentTarget.style.color = 'var(--color-modal-cancel-text)'
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="flex h-[36px] cursor-pointer items-center rounded-lg border-0 px-5 text-[13px] font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-modal-search-bg)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-modal-search-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-modal-search-bg)'
            }}
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  )
}
