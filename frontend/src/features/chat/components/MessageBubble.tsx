import type { Message } from '@/features/chat/types/chat.types'

type Props = {
  message: Message
  isMine: boolean
  showAvatar: boolean
  senderAvatar?: string
  senderName?: string
}

export function MessageBubble({ message, isMine, showAvatar, senderAvatar, senderName }: Props) {
  return (
    <div className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {!isMine && showAvatar && senderAvatar && (
          <img src={senderAvatar} alt={senderName ?? ''} className="size-8 rounded-full object-cover" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[65%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isMine && showAvatar && senderName && (
          <span className="mb-1 ml-1 text-[11px] font-medium" style={{ color: 'var(--color-bubble-sender-name)' }}>
            {senderName}
          </span>
        )}

        <div
          className={`overflow-hidden rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
            isMine ? 'rounded-tr-md text-white' : 'rounded-tl-md'
          }`}
          style={
            isMine
              ? {
                  background: 'linear-gradient(135deg, var(--color-bubble-mine-from), var(--color-bubble-mine-to))',
                  boxShadow: '0 2px 8px var(--color-bubble-mine-shadow)',
                  color: '#ffffff',
                }
              : {
                  backgroundColor: 'var(--color-bubble-other-bg)',
                  color: 'var(--color-bubble-other-text)',
                  boxShadow: '0 1px 4px var(--color-bubble-other-shadow)',
                  border: '1px solid var(--color-border)',
                }
          }
        >
          {message.type === 'text' && <p className="m-0">{message.content}</p>}

          {message.type === 'image' && (
            <img
              src={message.content}
              alt="Shared image"
              className="-m-1 block max-h-[240px] w-full rounded-xl object-cover"
            />
          )}

          {message.type === 'voice' && <VoiceMessage duration={message.voiceDuration ?? 0} isMine={isMine} />}

          {message.type === 'file' && <FileAttachment name={message.content} size={message.fileSize ?? ''} isMine={isMine} />}
        </div>

        <span
          className={`mt-1 text-[10.5px] ${isMine ? 'mr-1 text-right' : 'ml-1'}`}
          style={{ color: 'var(--color-bubble-time)' }}
        >
          {message.timestamp}
        </span>
      </div>
    </div>
  )
}

// ─── Voice message ───────────────────────────────────────────
function VoiceMessage({ duration, isMine }: { duration: number; isMine: boolean }) {
  const bars = 28
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <button
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 transition"
        style={
          isMine
            ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }
            : { backgroundColor: 'var(--color-bubble-voice-btn)', color: 'var(--color-bubble-voice-btn-text)' }
        }
      >
        <svg className="size-4 translate-x-px" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
      <div className="flex items-end gap-[2.5px]">
        {Array.from({ length: bars }).map((_, i) => {
          const h = Math.max(6, Math.sin(i * 0.7 + 1) * 14 + Math.random() * 6 + 8)
          return (
            <div
              key={i}
              className="w-[2.5px] rounded-full"
              style={{
                height: `${h}px`,
                backgroundColor: isMine ? 'rgba(255,255,255,0.5)' : 'var(--color-bubble-voice-bar)',
              }}
            />
          )
        })}
      </div>
      <span
        className="ml-1 text-[11px] font-medium tabular-nums"
        style={{ color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--color-bubble-voice-time)' }}
      >
        {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
      </span>
    </div>
  )
}

// ─── File attachment ─────────────────────────────────────────
function FileAttachment({ name, size, isMine }: { name: string; size: string; isMine: boolean }) {
  const ext = name.split('.').pop()?.toUpperCase() ?? 'FILE'
  return (
    <div className="flex items-center gap-3 py-0.5">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold"
        style={
          isMine
            ? { backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }
            : { backgroundColor: 'var(--color-bubble-file-bg)', color: 'var(--color-bubble-file-text)' }
        }
      >
        {ext}
      </div>
      <div className="min-w-0">
        <p
          className="m-0 truncate text-[13px] font-medium"
          style={{ color: isMine ? '#ffffff' : 'var(--color-bubble-other-text)' }}
        >
          {name}
        </p>
        <p
          className="m-0 text-[11px]"
          style={{ color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--color-bubble-time)' }}
        >
          {size}
        </p>
      </div>
      <button
        className="ml-auto shrink-0 cursor-pointer border-0 bg-transparent p-1 transition"
        style={{ color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--color-bubble-file-dl)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = isMine ? '#ffffff' : 'var(--color-bubble-file-dl-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = isMine ? 'rgba(255,255,255,0.6)' : 'var(--color-bubble-file-dl)'
        }}
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      </button>
    </div>
  )
}
