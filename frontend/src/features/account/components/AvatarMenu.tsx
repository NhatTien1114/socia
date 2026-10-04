import { useEffect, useRef, useState } from 'react'
import type { User } from '@/features/chat/types/chat.types'
import { avatarFor } from '@/features/chat/utils/chatView'
import { AccountIcon } from './AccountIcon'

export type AccountView = 'profile' | 'password'

export function AvatarMenu({ me, onSelect }: { me: User | null; onSelect: (view: AccountView) => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  function select(view: AccountView) {
    setOpen(false)
    trigger.current?.focus()
    onSelect(view)
  }
  return <div ref={root} className="relative mb-6" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={event => {
    if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    if (open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const items = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
      const index = items.indexOf(document.activeElement as HTMLButtonElement)
      items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
    }
  }}>
    <button ref={trigger} type="button" disabled={!me} aria-label="Mở menu tài khoản" aria-haspopup="menu" aria-expanded={open}
      aria-controls={open ? 'account-menu' : undefined} className="account-avatar-trigger" onClick={() => setOpen(value => !value)}>
      <img src={me?.avatar || avatarFor(me?.name ?? '?')} alt={me?.name ?? 'Tài khoản'} className="size-10 rounded-full object-cover"
        onError={event => { event.currentTarget.src = avatarFor(me?.name ?? '?') }} />
    </button>
    {open && <div id="account-menu" role="menu" aria-label="Tài khoản" className="account-menu">
      <div className="account-menu-heading"><span className="account-eyebrow">TÀI KHOẢN</span><strong>{me?.name}</strong></div>
      <button role="menuitem" onClick={() => select('profile')}><AccountIcon name="person" /><span>Hồ sơ của bạn</span><span aria-hidden="true">›</span></button>
      <button role="menuitem" onClick={() => select('password')}><AccountIcon name="lock" /><span>Đổi mật khẩu</span><span aria-hidden="true">›</span></button>
    </div>}
  </div>
}
