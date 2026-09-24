import { useState } from 'react'
import type { UserSearchResult } from '@/features/friends/types/friend.types'
import { searchUsers, sendFriendRequest } from '@/features/friends/services/friendApi'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function avatarUrl(name: string, bg = '2858cf') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=128`
}

const AVATAR_COLORS = ['6366f1', '0891b2', 'db2777', '059669', 'c2410c', '4338ca', 'b91c1c', '7c3aed']
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[10vh] backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="flex w-full max-w-[440px] flex-col rounded-2xl border border-[#1a2540] bg-[#0f1729] shadow-2xl"
        style={{ animation: 'slideUp 0.25s ease-out', maxHeight: '75vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1a2540] px-5 py-4">
          <h3 className="m-0 text-[16px] font-bold text-white">Thêm bạn</h3>
          <button
            onClick={handleClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[#546585] transition-all duration-200 hover:bg-[#1a2540] hover:text-white"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="border-b border-[#1a2540] px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#1a2540] bg-[#0b1120] px-3.5 py-2.5 transition-all duration-200 focus-within:border-[#2858cf]/50 focus-within:ring-1 focus-within:ring-[#2858cf]/20">
            <svg className="size-4 shrink-0 text-[#546585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className="w-full border-0 bg-transparent text-[13.5px] text-[#d1d9e8] outline-none placeholder:text-[#3e4f6e]"
            />
          </div>
        </div>

        {/* Results area */}
        <div className="scrollbar-dark flex-1 overflow-y-auto px-2.5 py-2">
          {loading && (
            <div className="flex flex-col items-center py-10">
              <span className="inline-block size-6 animate-spin rounded-full border-2 border-[#2858cf]/20 border-t-[#2858cf]" />
              <p className="mt-3 text-[12px] text-[#546585]">Đang tìm kiếm...</p>
            </div>
          )}

          {!loading && error && (
            <div className="mx-2.5 mt-2 flex items-center gap-2 rounded-xl bg-[#ef4444]/10 px-3.5 py-2.5 text-[12px] text-[#ef4444]">
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
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#1a2540]">
                <svg className="size-6 text-[#546585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-[13px] font-medium text-[#546585]">Không tìm thấy người dùng</p>
              <p className="mt-1 text-[12px] text-[#3e4f6e]">Thử nhập chính xác tên hoặc số điện thoại</p>
            </div>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center py-10">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#1a2540]">
                <svg className="size-6 text-[#546585]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <p className="text-[13px] font-medium text-[#546585]">Tìm bạn bè</p>
              <p className="mt-1 text-[12px] text-[#3e4f6e]">Nhập tên hoặc số điện thoại rồi nhấn Enter</p>
            </div>
          )}

          {/* Search results */}
          {!loading && results.length > 0 && (
            <div>
              <p className="px-3 py-2 text-[11px] font-semibold tracking-wide text-[#546585] uppercase">
                Kết quả tìm kiếm
              </p>
              {results.map((user) => {
                const isSent = sentIds.has(user.id)
                const isSending = sendingId === user.id
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 hover:bg-[#131f38]"
                  >
                    <img
                      src={user.avatar || avatarUrl(user.username, colorFromName(user.username))}
                      alt={user.username}
                      className="size-[44px] rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-[13.5px] font-semibold text-[#d1d9e8]">
                        {user.username}
                      </p>
                      {user.phone && (
                        <p className="m-0 mt-0.5 truncate text-[11.5px] text-[#546585]">
                          {user.phone}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => !isSent && handleSendRequest(user)}
                      disabled={isSent || isSending}
                      className={`flex h-[32px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 text-[12px] font-semibold transition-all duration-200 ${
                        isSent
                          ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] cursor-default'
                          : 'border-[#2858cf]/40 bg-transparent text-[#60a5fa] hover:bg-[#2858cf] hover:border-[#2858cf] hover:text-white'
                      } disabled:cursor-not-allowed`}
                    >
                      {isSending ? (
                        <span className="inline-block size-3 animate-spin rounded-full border-2 border-[#60a5fa]/30 border-t-[#60a5fa]" />
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
        <div className="flex items-center justify-end gap-2.5 border-t border-[#1a2540] px-5 py-3.5">
          <button
            onClick={handleClose}
            className="flex h-[36px] cursor-pointer items-center rounded-lg border-0 bg-[#1a2540] px-5 text-[13px] font-semibold text-[#94a3b8] transition-all duration-200 hover:bg-[#1e2d4a] hover:text-white"
          >
            Hủy
          </button>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="flex h-[36px] cursor-pointer items-center rounded-lg border-0 bg-[#2858cf] px-5 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[#3468e0] hover:shadow-[0_2px_10px_rgba(40,88,207,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
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
