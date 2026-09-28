import type { Conversation } from '@/features/chat/types/chat.types'
import { sharedMedia } from '@/features/chat/mocks/mockData'

type Props = {
  conversation: Conversation
  onClose: () => void
}

export function InfoPanel({ conversation, onClose }: Props) {
  const { participants, isGroup, groupName } = conversation
  const displayName = isGroup ? groupName! : participants[0].name
  const isOnline = !isGroup && participants[0].online
  const phone = !isGroup ? participants[0].phone : undefined
  const avatarUrl = isGroup
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName!)}&background=514CB2&color=CACEE8&bold=true&size=256`
    : participants[0].avatar

  return (
    <aside
      className="scrollbar-thin flex h-full w-[320px] shrink-0 flex-col overflow-y-auto"
      style={{
        backgroundColor: 'var(--color-info-panel-bg)',
        borderLeft: '1px solid var(--color-info-panel-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--color-info-panel-border)' }}
      >
        <h3 className="m-0 text-[15px] font-semibold" style={{ color: 'var(--color-info-panel-title)' }}>
          Thông tin
        </h3>
        <button
          onClick={onClose}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent transition-all"
          style={{ color: 'var(--color-info-panel-close)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-info-panel-close-hover-bg)'
            e.currentTarget.style.color = 'var(--color-info-panel-close-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-info-panel-close)'
          }}
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Profile card */}
      <div className="flex flex-col items-center px-5 pt-6 pb-5">
        <div className="relative">
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-20 rounded-full object-cover shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
          />
          {isOnline && (
            <span
              className="absolute bottom-1 right-1 size-3.5 rounded-full border-[2.5px]"
              style={{
                borderColor: 'var(--color-info-panel-bg)',
                backgroundColor: 'var(--color-success)',
              }}
            />
          )}
        </div>
        <h4 className="m-0 mt-3 text-[16px] font-semibold" style={{ color: 'var(--color-info-panel-name)' }}>
          {displayName}
        </h4>
        <p
          className="m-0 mt-0.5 text-[12.5px]"
          style={{ color: isOnline ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
        >
          {isOnline ? 'Đang hoạt động' : 'Offline'}
        </p>
      </div>

      {/* Details */}
      <div
        className="space-y-0 px-5 py-4"
        style={{ borderTop: '1px solid var(--color-info-panel-section-border)' }}
      >
        {!isGroup && (
          <>
            <InfoRow label="Họ tên" value={displayName} />
            {phone && <InfoRow label="Số điện thoại" value={phone} />}
          </>
        )}
        {isGroup && (
          <>
            <InfoRow label="Tên nhóm" value={displayName} />
            <InfoRow label="Thành viên" value={`${participants.length + 1} người`} />
          </>
        )}
      </div>

      {/* Group members */}
      {isGroup && (
        <div
          className="px-5 py-4"
          style={{ borderTop: '1px solid var(--color-info-panel-section-border)' }}
        >
          <h5
            className="m-0 mb-3 text-[12.5px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-info-panel-section-title)' }}
          >
            Thành viên
          </h5>
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <div className="relative">
                  <img src={p.avatar} alt={p.name} className="size-8 rounded-full object-cover" />
                  {p.online && (
                    <span
                      className="absolute bottom-0 right-0 size-2 rounded-full border-[1.5px]"
                      style={{
                        borderColor: 'var(--color-info-panel-bg)',
                        backgroundColor: 'var(--color-success)',
                      }}
                    />
                  )}
                </div>
                <span
                  className="text-[13px] font-medium"
                  style={{ color: 'var(--color-info-panel-member-name)' }}
                >
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared media */}
      <div
        className="px-5 py-4"
        style={{ borderTop: '1px solid var(--color-info-panel-section-border)' }}
      >
        <h5
          className="m-0 mb-3 text-[12.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-info-panel-section-title)' }}
        >
          Ảnh & Media
        </h5>
        <div className="grid grid-cols-3 gap-1.5">
          {sharedMedia.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Media ${i + 1}`}
              className="aspect-square w-full cursor-pointer rounded-lg object-cover transition hover:brightness-90"
            />
          ))}
        </div>
      </div>

      {/* Shared files */}
      <div
        className="px-5 py-4"
        style={{ borderTop: '1px solid var(--color-info-panel-section-border)' }}
      >
        <h5
          className="m-0 mb-3 text-[12.5px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-info-panel-section-title)' }}
        >
          File đã chia sẻ
        </h5>
        <SharedFile name="menu-quan-cafe.pdf" size="2.4 MB" />
        <SharedFile name="bao-cao-tien-do.docx" size="1.8 MB" />
      </div>

      {/* Actions */}
      <div
        className="mt-auto p-5"
        style={{ borderTop: '1px solid var(--color-info-panel-section-border)' }}
      >
        <button
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 px-4 py-2.5 text-[13px] font-semibold transition"
          style={{
            backgroundColor: 'var(--color-info-panel-block-bg)',
            color: 'var(--color-info-panel-block-text)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-info-panel-block-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-info-panel-block-bg)'
          }}
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          Chặn liên hệ
        </button>
      </div>
    </aside>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2">
      <p className="m-0 text-[11.5px] font-medium" style={{ color: 'var(--color-info-panel-label)' }}>
        {label}
      </p>
      <p className="m-0 mt-0.5 text-[13.5px] font-medium" style={{ color: 'var(--color-info-panel-value)' }}>
        {value}
      </p>
    </div>
  )
}

function SharedFile({ name, size }: { name: string; size: string }) {
  const ext = name.split('.').pop()?.toUpperCase() ?? ''
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-info-panel-file-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
        style={{
          backgroundColor: 'var(--color-info-panel-file-bg)',
          color: 'var(--color-info-panel-file-text)',
        }}
      >
        {ext}
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[12.5px] font-medium" style={{ color: 'var(--color-info-panel-member-name)' }}>
          {name}
        </p>
        <p className="m-0 text-[11px]" style={{ color: 'var(--color-info-panel-file-size)' }}>
          {size}
        </p>
      </div>
      <button
        className="shrink-0 cursor-pointer border-0 bg-transparent p-1 transition"
        style={{ color: 'var(--color-info-panel-file-size)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-info-panel-file-text)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-info-panel-file-size)'
        }}
      >
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      </button>
    </div>
  )
}
