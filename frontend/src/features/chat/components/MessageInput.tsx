import { useRef, useState } from 'react'
import { errorText } from '../state/chatStore'

type Props = { onSend: (text: string) => Promise<void>; disabled?: boolean }

export function MessageInput({ onSend, disabled = false }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)
  async function send() {
    if (busy.current || disabled || !text.trim()) return
    busy.current = true
    setSending(true)
    setError('')
    try { await onSend(text); setText('') }
    catch (cause) { setError(`${errorText(cause)} Nội dung được giữ lại để bạn kiểm tra và gửi lại.`) }
    finally {
      busy.current = false
      setSending(false)
      requestAnimationFrame(() => input.current?.focus())
    }
  }
  return (
    <form onSubmit={event => { event.preventDefault(); void send() }} className="shrink-0 px-4 py-3"
      style={{ backgroundColor: 'var(--color-input-bg)', borderTop: '1px solid var(--color-input-border)' }}>
      {error && <p role="alert" className="mb-2 text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>}
      <div className="flex items-end gap-2">
        <textarea ref={input} aria-label="Tin nhắn" placeholder="Nhập tin nhắn..." rows={2} maxLength={2000}
          value={text} disabled={sending || disabled} onChange={event => setText(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); void send()
            }
          }}
          className="max-h-32 min-w-0 flex-1 resize-y rounded-2xl border px-4 py-2.5 text-sm outline-none disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-input-field-bg)', color: 'var(--color-input-text)', borderColor: 'var(--color-input-field-border)' }} />
        <button type="submit" disabled={sending || disabled || !text.trim()}
          className="rounded-xl border-0 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--color-primary)' }}>{sending ? 'Đang gửi…' : 'Gửi'}</button>
      </div>
      <div className="mt-1.5 flex justify-between text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Enter để gửi · Shift + Enter để xuống dòng</span><span>{text.length}/2000</span>
      </div>
    </form>
  )
}
