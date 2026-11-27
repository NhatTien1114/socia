import { useEffect, useRef, useState } from 'react'
import { errorText } from '../state/chatStore'
import { ApiError } from '@/lib/api'

type Props = { onSend: (text: string, image?: File) => Promise<void>; disabled?: boolean }

function imageSendError(cause: unknown) {
  if (cause instanceof ApiError) {
    if (cause.status === 502) return 'Dịch vụ tải ảnh lên gặp lỗi. Vui lòng thử lại.'
    if (cause.status === 503) return 'Dịch vụ gửi ảnh hiện chưa sẵn sàng. Vui lòng thử lại sau.'
    if (cause.status >= 500) return `Máy chủ gặp lỗi khi xử lý ảnh (HTTP ${cause.status}).`
  }
  return errorText(cause)
}

function ComposerIcon({ name }: { name: 'image' | 'mic' | 'file' | 'close' }) {
  const paths = {
    image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m4 17 5-5 3 3 4-5 5 6" /></>,
    mic: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 11a7 7 0 0 0 14 0m-7 7v4m-3 0h6" /></>,
    file: <path d="m8 13 7-7a3 3 0 0 1 4.2 4.2l-9 9a5 5 0 0 1-7.1-7.1l9-9m4 5-8 8" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

export function MessageInput({ onSend, disabled = false }: Props) {
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState<{ file: File; preview: string }>()
  const image = attachment?.file
  useEffect(() => {
    if (attachment) return () => URL.revokeObjectURL(attachment.preview)
  }, [attachment])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)
  async function send() {
    if (busy.current || disabled || (!text.trim() && !image)) return
    busy.current = true
    setSending(true)
    setError('')
    try { await onSend(text, image); setText(''); setAttachment(undefined) }
    catch (cause) {
      setError(image ? `Chưa gửi được “${image.name}”. ${imageSendError(cause)}` : errorText(cause))
    }
    finally {
      busy.current = false
      setSending(false)
      requestAnimationFrame(() => input.current?.focus())
    }
  }
  return (
    <form onSubmit={event => { event.preventDefault(); void send() }} className="chat-composer shrink-0 px-3 py-2 sm:px-4 sm:py-3"
      style={{ backgroundColor: 'var(--color-input-bg)', borderTop: '1px solid var(--color-input-border)' }}>
      {error && <p role="alert" className="mb-2 text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {attachment && <div className="mb-2 flex items-center gap-2">
        <img src={attachment.preview} alt="Ảnh chuẩn bị gửi" className="size-16 rounded object-contain" />
        <span className="min-w-0 truncate">{attachment.file.name}</span>
        <button type="button" className="composer-icon" aria-label="Bỏ ảnh" title="Bỏ ảnh" disabled={sending || disabled}
          onClick={() => { setAttachment(undefined); setError('') }}><ComposerIcon name="close" /></button>
      </div>}
      <div className="flex items-center gap-1 sm:gap-2">
        <div role="group" aria-label="Đính kèm" className="flex shrink-0 items-center">
        <label title="Chọn ảnh" className="composer-icon relative focus-within:outline">
          <ComposerIcon name="image" />
          <input type="file" aria-label="Chọn ảnh" accept="image/jpeg,image/png"
            className="absolute inset-0 w-full cursor-pointer opacity-0" disabled={sending || disabled}
            onChange={event => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              if (!file.size || !['image/jpeg', 'image/png'].includes(file.type) || file.size > 4 * 1024 * 1024) {
                const reason = !file.size ? 'Tệp trống (0 byte).'
                  : file.size > 4 * 1024 * 1024 ? 'Dung lượng ảnh vượt giới hạn 4 MB.'
                  : 'Định dạng tệp chưa được hỗ trợ. Hãy chọn ảnh JPG hoặc PNG.'
                setError(`Không thể chọn “${file.name}”. ${reason}`)
                return
              }
              setError('')
              setAttachment({ file, preview: URL.createObjectURL(file) })
            }} />
        </label>
        <button type="button" className="composer-icon" disabled aria-label="Gửi tin nhắn thoại (sắp có)" title="Gửi tin nhắn thoại (sắp có)">
          <ComposerIcon name="mic" />
        </button>
        <button type="button" className="composer-icon" disabled aria-label="Gửi tệp (sắp có)" title="Gửi tệp (sắp có)">
          <ComposerIcon name="file" />
        </button>
        </div>
        <textarea disabled={sending || disabled} ref={input} aria-label="Tin nhắn" placeholder="Nhập tin nhắn..." rows={2} maxLength={2000}
          value={text} onChange={event => setText(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); void send()
            }
          }}
          className="max-h-32 min-w-0 flex-1 resize-y rounded-2xl border px-4 py-2.5 text-sm outline-none disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-input-field-bg)', color: 'var(--color-input-text)', borderColor: 'var(--color-input-field-border)' }} />
        <button type="submit" disabled={sending || disabled || (!text.trim() && !image)}
          className="rounded-xl border-0 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--color-primary)' }}>{sending ? 'Đang gửi…' : 'Gửi'}</button>
      </div>
      <div className="mt-1.5 flex justify-end gap-2 text-[10px] sm:justify-between" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="hidden sm:inline">Enter để gửi · Shift + Enter để xuống dòng</span><span>{text.length}/2000</span>
      </div>
    </form>
  )
}
