import { useTheme } from '@/contexts/ThemeContext'

export function SettingsPanel() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col" style={{ backgroundColor: 'var(--color-settings-bg)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-6 py-4"
        style={{ borderBottom: '1px solid var(--color-settings-border)' }}
      >
        <svg className="size-5" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <h2 className="m-0 text-[16px] font-bold" style={{ color: 'var(--color-settings-title)' }}>Cài đặt</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Appearance section */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ backgroundColor: 'var(--color-settings-card-bg)', border: '1px solid var(--color-settings-border)' }}
        >
          <div className="px-5 pt-4 pb-2">
            <h3 className="m-0 text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
              Giao diện
            </h3>
          </div>

          {/* Theme toggle row */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: isDark ? 'rgba(117, 111, 251, 0.12)' : 'rgba(117, 111, 179, 0.10)' }}
              >
                {isDark ? (
                  <svg className="size-[18px]" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg className="size-[18px]" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </div>
              <div>
                <p className="m-0 text-[13.5px] font-semibold" style={{ color: 'var(--color-settings-value)' }}>
                  Chế độ tối
                </p>
                <p className="m-0 mt-0.5 text-[11.5px]" style={{ color: 'var(--color-settings-label)' }}>
                  {isDark ? 'Đang bật — giao diện tối' : 'Đang tắt — giao diện sáng'}
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              onClick={toggleTheme}
              className="relative flex h-[26px] w-[48px] shrink-0 cursor-pointer items-center rounded-full border-0 p-0 transition-colors duration-300"
              style={{ backgroundColor: isDark ? 'var(--color-settings-toggle-active)' : 'var(--color-settings-toggle-bg)' }}
              role="switch"
              aria-checked={isDark}
              aria-label="Chuyển đổi chế độ sáng/tối"
            >
              <span
                className="absolute size-[20px] rounded-full shadow-sm transition-all duration-300"
                style={{
                  backgroundColor: 'var(--color-settings-toggle-knob)',
                  left: isDark ? '24px' : '4px',
                  boxShadow: isDark ? '0 2px 6px rgba(117, 111, 251, 0.30)' : '0 1px 3px rgba(0,0,0,0.15)',
                }}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px" style={{ backgroundColor: 'var(--color-settings-border)' }} />

          {/* Language (placeholder) */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: isDark ? 'rgba(117, 111, 251, 0.12)' : 'rgba(117, 111, 179, 0.10)' }}
              >
                <svg className="size-[18px]" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <p className="m-0 text-[13.5px] font-semibold" style={{ color: 'var(--color-settings-value)' }}>
                  Ngôn ngữ
                </p>
                <p className="m-0 mt-0.5 text-[11.5px]" style={{ color: 'var(--color-settings-label)' }}>
                  Tiếng Việt
                </p>
              </div>
            </div>
            <svg className="size-4" style={{ color: 'var(--color-settings-label)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        {/* Notifications section */}
        <div
          className="mt-4 overflow-hidden rounded-2xl"
          style={{ backgroundColor: 'var(--color-settings-card-bg)', border: '1px solid var(--color-settings-border)' }}
        >
          <div className="px-5 pt-4 pb-2">
            <h3 className="m-0 text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
              Thông báo
            </h3>
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: isDark ? 'rgba(117, 111, 251, 0.12)' : 'rgba(117, 111, 179, 0.10)' }}
              >
                <svg className="size-[18px]" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <p className="m-0 text-[13.5px] font-semibold" style={{ color: 'var(--color-settings-value)' }}>
                  Thông báo tin nhắn
                </p>
                <p className="m-0 mt-0.5 text-[11.5px]" style={{ color: 'var(--color-settings-label)' }}>
                  Bật thông báo cho tin nhắn mới
                </p>
              </div>
            </div>
            <button
              className="relative flex h-[26px] w-[48px] shrink-0 cursor-pointer items-center rounded-full border-0 p-0 transition-colors duration-300"
              style={{ backgroundColor: 'var(--color-settings-toggle-active)' }}
              role="switch"
              aria-checked={true}
            >
              <span
                className="absolute size-[20px] rounded-full shadow-sm transition-all duration-300"
                style={{
                  backgroundColor: 'var(--color-settings-toggle-knob)',
                  left: '24px',
                  boxShadow: '0 2px 6px rgba(117, 111, 251, 0.30)',
                }}
              />
            </button>
          </div>

          <div className="mx-5 h-px" style={{ backgroundColor: 'var(--color-settings-border)' }} />

          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: isDark ? 'rgba(117, 111, 251, 0.12)' : 'rgba(117, 111, 179, 0.10)' }}
              >
                <svg className="size-[18px]" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94" />
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <p className="m-0 text-[13.5px] font-semibold" style={{ color: 'var(--color-settings-value)' }}>
                  Âm thanh cuộc gọi
                </p>
                <p className="m-0 mt-0.5 text-[11.5px]" style={{ color: 'var(--color-settings-label)' }}>
                  Phát âm thanh khi có cuộc gọi đến
                </p>
              </div>
            </div>
            <button
              className="relative flex h-[26px] w-[48px] shrink-0 cursor-pointer items-center rounded-full border-0 p-0 transition-colors duration-300"
              style={{ backgroundColor: 'var(--color-settings-toggle-active)' }}
              role="switch"
              aria-checked={true}
            >
              <span
                className="absolute size-[20px] rounded-full shadow-sm transition-all duration-300"
                style={{
                  backgroundColor: 'var(--color-settings-toggle-knob)',
                  left: '24px',
                  boxShadow: '0 2px 6px rgba(117, 111, 251, 0.30)',
                }}
              />
            </button>
          </div>
        </div>

        {/* Version info */}
        <p className="mt-6 text-center text-[11px]" style={{ color: 'var(--color-settings-label)' }}>
          Socia v1.0.0 · Phiên bản thử nghiệm
        </p>
      </div>
    </div>
  )
}
