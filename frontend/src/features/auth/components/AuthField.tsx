import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: ReactNode
  password?: boolean
}

export function AuthField({ label, icon, password = false, type, ...inputProps }: AuthFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="grid gap-1.5">
      <label className="text-[13px] font-semibold" style={{ color: 'var(--color-auth-label)' }} htmlFor={inputProps.id}>
        {label}
      </label>
      <div
        className="flex min-h-11 items-center gap-2.5 rounded-xl border px-3.5 transition"
        style={{
          borderColor: 'var(--color-auth-field-border)',
          backgroundColor: 'var(--color-auth-field-bg)',
        }}
      >
        <span style={{ color: 'var(--color-auth-field-icon)' }}>{icon}</span>
        <input
          className="min-w-0 w-full border-0 bg-transparent text-sm outline-none"
          style={{
            color: 'var(--color-auth-field-text)',
          }}
          type={password ? (visible ? 'text' : 'password') : type}
          {...inputProps}
        />
        {password && (
          <button
            className="grid cursor-pointer place-items-center border-0 bg-transparent p-0 transition-colors"
            style={{ color: 'var(--color-auth-field-icon)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-auth-eye-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-auth-field-icon)'
            }}
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  )
}

export function UserIcon() {
  return (
    <svg className="size-[19px] shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c.7-3.3 3.1-5.1 7-5.1s6.3 1.8 7 5.1" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg className="size-[19px] shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function PhoneIcon() {
  return (
    <svg className="size-[19px] shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8.1 3.8 6.3 5.3c-1 1-1.1 2.4-.5 3.8 2 4.6 5.2 7.8 9.8 9.8 1.4.6 2.8.5 3.8-.5l1.5-1.8-3.2-2.2-1.7 1.3a12.4 12.4 0 0 1-7.7-7.7l1.3-1.7-2.2-3.2Z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="size-[19px]" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 12s3.2-5.5 9.5-5.5S21.5 12 21.5 12s-3.2 5.5-9.5 5.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="size-[19px]" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 3 18 18M10.6 6.7A10.8 10.8 0 0 1 12 6.5c6.3 0 9.5 5.5 9.5 5.5a18.6 18.6 0 0 1-3.3 3.8M6.2 6.2A18.7 18.7 0 0 0 2.5 12s3.2 5.5 9.5 5.5c1 0 1.8-.1 2.6-.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}
