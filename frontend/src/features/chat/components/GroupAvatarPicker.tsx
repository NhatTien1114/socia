import { useEffect, useState } from 'react'

export function GroupAvatarPicker({ file, current, disabled, onChange }: {
  file: File | null; current?: string | null; disabled?: boolean; onChange: (file: File | null) => void
}) {
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(String(reader.result))
    reader.readAsDataURL(file)
    return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort() }
  }, [file])
  const image = file ? preview : current
  return <div className="mb-4 flex items-center gap-4">
    {image ? <img src={image} alt="Ảnh đại diện nhóm" className="size-16 rounded-2xl object-cover" />
      : <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: 'var(--color-primary-pale)', color: 'var(--color-primary)' }}>♧</span>}
    <div className="min-w-0 flex-1">
      <label className="block text-sm font-medium">Ảnh đại diện nhóm
        <input type="file" accept="image/jpeg,image/png" disabled={disabled} className="mt-1 block w-full text-xs" onChange={event => {
          const next = event.target.files?.[0]
          event.target.value = ''
          if (!next) return
          if (!['image/jpeg', 'image/png'].includes(next.type) || next.size === 0 || next.size > 4 * 1024 * 1024) {
            setError('Vui lòng chọn ảnh JPG/PNG từ 1 byte đến 4 MB.'); return
          }
          setError(''); onChange(next)
        }} />
      </label>
      <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>JPG hoặc PNG, tối đa 4 MB.</p>
      {file && <button type="button" disabled={disabled} className="mt-1 text-xs underline" onClick={() => { onChange(null); setError('') }}>Bỏ ảnh đã chọn</button>}
      {error && <p role="alert" className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>}
    </div>
  </div>
}
