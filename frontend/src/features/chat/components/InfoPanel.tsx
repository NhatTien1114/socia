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
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName!)}&background=1e3a5f&color=8bb8ff&bold=true&size=256`
    : participants[0].avatar

  return (
    <aside className="scrollbar-thin flex h-full w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[#e8ecf4] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e8ecf4] px-5 py-3.5">
        <h3 className="m-0 text-[15px] font-semibold text-[#1a2540]">Thông tin</h3>
        <button
          onClick={onClose}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[#8490aa] transition hover:bg-[#f0f4ff] hover:text-[#273452]"
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
          <img src={avatarUrl} alt={displayName} className="size-20 rounded-full object-cover shadow-[0_4px_16px_rgba(0,0,0,0.1)]" />
          {isOnline && (
            <span className="absolute bottom-1 right-1 size-3.5 rounded-full border-[2.5px] border-white bg-[#22c55e]" />
          )}
        </div>
        <h4 className="m-0 mt-3 text-[16px] font-semibold text-[#1a2540]">{displayName}</h4>
        <p className={`m-0 mt-0.5 text-[12.5px] ${isOnline ? 'text-[#22c55e]' : 'text-[#8490aa]'}`}>
          {isOnline ? 'Đang hoạt động' : 'Offline'}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-0 border-t border-[#f0f2f7] px-5 py-4">
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
        <div className="border-t border-[#f0f2f7] px-5 py-4">
          <h5 className="m-0 mb-3 text-[12.5px] font-semibold uppercase tracking-wider text-[#8490aa]">Thành viên</h5>
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <div className="relative">
                  <img src={p.avatar} alt={p.name} className="size-8 rounded-full object-cover" />
                  {p.online && <span className="absolute bottom-0 right-0 size-2 rounded-full border-[1.5px] border-white bg-[#22c55e]" />}
                </div>
                <span className="text-[13px] font-medium text-[#273452]">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared media */}
      <div className="border-t border-[#f0f2f7] px-5 py-4">
        <h5 className="m-0 mb-3 text-[12.5px] font-semibold uppercase tracking-wider text-[#8490aa]">Ảnh & Media</h5>
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
      <div className="border-t border-[#f0f2f7] px-5 py-4">
        <h5 className="m-0 mb-3 text-[12.5px] font-semibold uppercase tracking-wider text-[#8490aa]">File đã chia sẻ</h5>
        <SharedFile name="menu-quan-cafe.pdf" size="2.4 MB" />
        <SharedFile name="bao-cao-tien-do.docx" size="1.8 MB" />
      </div>

      {/* Actions */}
      <div className="mt-auto border-t border-[#f0f2f7] p-5">
        <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-[#fef2f2] px-4 py-2.5 text-[13px] font-semibold text-[#ef4444] transition hover:bg-[#fee2e2]">
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
      <p className="m-0 text-[11.5px] font-medium text-[#8490aa]">{label}</p>
      <p className="m-0 mt-0.5 text-[13.5px] font-medium text-[#273452]">{value}</p>
    </div>
  )
}

function SharedFile({ name, size }: { name: string; size: string }) {
  const ext = name.split('.').pop()?.toUpperCase() ?? ''
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-1 py-2 transition hover:bg-[#f8faff]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#2858cf]/8 text-[10px] font-bold text-[#2858cf]">
        {ext}
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[12.5px] font-medium text-[#273452]">{name}</p>
        <p className="m-0 text-[11px] text-[#9ca3af]">{size}</p>
      </div>
      <button className="shrink-0 cursor-pointer border-0 bg-transparent p-1 text-[#9ca3af] transition hover:text-[#2858cf]">
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      </button>
    </div>
  )
}
