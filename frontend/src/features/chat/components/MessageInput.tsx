import { useState, useRef, type KeyboardEvent, type JSX } from 'react'

export function MessageInput() {
  const [text, setText] = useState('')
  const [showActions, setShowActions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    if (!text.trim()) return
    // TODO: Implement send message
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  return (
    <footer className="border-t border-[#e8ecf4] bg-white/80 px-5 py-3 backdrop-blur-sm">
      {/* Attachment popup */}
      {showActions && (
        <div className="mb-3 flex gap-2 animate-in slide-in-from-bottom-2">
          <AttachButton icon={<ImageIcon />} label="Ảnh" color="bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20" />
          <AttachButton icon={<FileIcon />} label="File" color="bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20" />
          <AttachButton icon={<LocationIcon />} label="Vị trí" color="bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20" />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          onClick={() => setShowActions(!showActions)}
          className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 transition-all duration-200 ${
            showActions
              ? 'rotate-45 bg-[#2858cf]/10 text-[#2858cf]'
              : 'bg-transparent text-[#8490aa] hover:bg-[#f0f4ff] hover:text-[#2858cf]'
          }`}
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Text input */}
        <div className="flex min-h-[40px] flex-1 items-end rounded-2xl border border-[#e3e8f2] bg-[#fafbfe] px-3.5 py-2 transition-all duration-200 focus-within:border-[#2858cf]/40 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(40,88,207,0.08)]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            rows={1}
            className="max-h-[120px] w-full resize-none border-0 bg-transparent text-[13.5px] leading-snug text-[#273452] outline-none placeholder:text-[#a9b2c3]"
          />
        </div>

        {/* Emoji */}
        <button className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-[#8490aa] transition-all duration-200 hover:bg-[#f0f4ff] hover:text-[#f59e0b]">
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>

        {/* Mic or Send */}
        {text.trim() ? (
          <button
            onClick={handleSend}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-gradient-to-br from-[#2858cf] to-[#477cf0] text-white shadow-[0_4px_12px_rgba(40,88,207,0.3)] transition-all duration-200 hover:shadow-[0_6px_16px_rgba(40,88,207,0.4)]"
          >
            <svg className="size-[18px] translate-x-px" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        ) : (
          <button className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-[#8490aa] transition-all duration-200 hover:bg-[#f0f4ff] hover:text-[#ef4444]">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}
      </div>
    </footer>
  )
}

// ─── Attach popup buttons ────────────────────────────────────
function AttachButton({ icon, label, color }: { icon: JSX.Element; label: string; color: string }) {
  return (
    <button className={`flex cursor-pointer items-center gap-2 rounded-xl border-0 px-3 py-2 text-[12.5px] font-medium transition-all duration-200 ${color}`}>
      {icon}
      {label}
    </button>
  )
}

function ImageIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
