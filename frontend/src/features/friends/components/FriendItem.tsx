import { useState } from 'react'
import type { FriendRequest } from '@/features/friends/types/friend.types'

type Variant = 'accepted' | 'pending' | 'sent'

type Props = {
  request: FriendRequest
  variant: Variant
  displayName: string
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
  onCancel?: (id: string) => void
  onMessage?: (name: string) => void
}

function avatarUrl(name: string, bg = '756FB3') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=128`
}

const AVATAR_COLORS = ['756FB3', '514CB2', '9A95D0', '35A56A', 'E4A84C', '5D8CC9', 'D95C6A']

function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function FriendItem({ request, variant, displayName, onAccept, onReject, onCancel, onMessage }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const bg = colorFromName(displayName)

  async function handleAction(action: string, fn?: (id: string) => void) {
    if (!fn || loading) return
    setLoading(action)
    try {
      await fn(request.id)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-friends-item-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={avatarUrl(displayName, bg)}
          alt={displayName}
          className="size-[44px] rounded-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[13.5px] font-semibold" style={{ color: 'var(--color-friends-item-name)' }}>
          {displayName}
        </p>
        <p className="m-0 mt-0.5 truncate text-[11.5px]" style={{ color: 'var(--color-friends-item-subtitle)' }}>
          {variant === 'accepted' && 'Bạn bè'}
          {variant === 'pending' && 'Muốn kết bạn với bạn'}
          {variant === 'sent' && 'Đang chờ phản hồi'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {variant === 'accepted' && (
          <button
            onClick={() => onMessage?.(displayName)}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-friends-btn-msg-bg)',
              color: 'var(--color-friends-btn-msg-text)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-friends-btn-msg-hover-bg)'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-friends-btn-msg-bg)'
              e.currentTarget.style.color = 'var(--color-friends-btn-msg-text)'
            }}
            title="Nhắn tin"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </button>
        )}

        {variant === 'pending' && (
          <>
            <button
              onClick={() => handleAction('accept', onAccept)}
              disabled={loading !== null}
              className="flex h-[30px] cursor-pointer items-center gap-1 rounded-lg border-0 px-3 text-[11.5px] font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-friends-btn-accept-bg)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-friends-btn-accept-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-friends-btn-accept-bg)'
              }}
            >
              {loading === 'accept' ? (
                <span className="inline-block size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Chấp nhận
                </>
              )}
            </button>
            <button
              onClick={() => handleAction('reject', onReject)}
              disabled={loading !== null}
              className="flex h-[30px] cursor-pointer items-center gap-1 rounded-lg border-0 px-3 text-[11.5px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-friends-btn-reject-bg)',
                color: 'var(--color-friends-btn-reject-text)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-friends-btn-reject-hover-bg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-friends-btn-reject-bg)'
              }}
            >
              {loading === 'reject' ? (
                <span className="inline-block size-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              ) : (
                <>
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Từ chối
                </>
              )}
            </button>
          </>
        )}

        {variant === 'sent' && (
          <button
            onClick={() => handleAction('cancel', onCancel)}
            disabled={loading !== null}
            className="flex h-[30px] cursor-pointer items-center gap-1 rounded-lg border-0 px-2.5 text-[11.5px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-friends-btn-cancel-bg)',
              color: 'var(--color-friends-btn-cancel-text)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-friends-btn-cancel-hover-bg)'
              e.currentTarget.style.color = 'var(--color-friends-btn-cancel-hover-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-friends-btn-cancel-bg)'
              e.currentTarget.style.color = 'var(--color-friends-btn-cancel-text)'
            }}
          >
            {loading === 'cancel' ? (
              <span className="inline-block size-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            ) : (
              <>
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Hủy
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
