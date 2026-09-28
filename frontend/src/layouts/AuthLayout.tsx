import type { ReactNode } from 'react'

type AuthLayoutProps = {
  mode: 'login' | 'register'
  children: ReactNode
}

export function AuthLayout({ mode, children }: AuthLayoutProps) {
  const isLogin = mode === 'login'
  return (
    <main
      className="grid min-h-screen place-items-center p-4 sm:p-8"
      style={{ backgroundColor: 'var(--color-auth-bg)' }}
    >
      <section
        className="grid w-full max-w-[1160px] overflow-hidden rounded-[28px] lg:h-[760px] lg:grid-cols-[minmax(390px,0.92fr)_minmax(420px,1.08fr)]"
        style={{
          backgroundColor: 'var(--color-auth-card-bg)',
          boxShadow: '0 24px 64px var(--color-auth-card-shadow)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center justify-center px-6 py-9 sm:px-12 lg:px-16">
          <div className="w-full max-w-[390px]">
            <div
              className="mb-6 flex items-center gap-2.5 text-[19px] font-extrabold tracking-[-0.4px]"
              style={{ color: 'var(--color-auth-logo-text)' }}
            >
              <img className="size-[46px] object-contain flex justify-center items-center" src="/Socia_Logo.png" alt="Socia" />
              <span>Socia</span>
            </div>
            <h1
              className="m-0 text-[29px] leading-[1.18] font-bold tracking-[-1px] sm:text-[36px]"
              style={{ color: 'var(--color-auth-title)' }}
            >
              {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
            </h1>
            <p
              className="mb-6 mt-2.5 text-sm leading-[1.55]"
              style={{ color: 'var(--color-auth-subtitle)' }}
            >
              {isLogin
                ? 'Đăng nhập để tiếp tục kết nối và chia sẻ cùng cộng đồng Socia.'
                : 'Tham gia Socia để kết nối với những người bạn mới.'}
            </p>
            {children}
          </div>
        </div>
        <aside
          className="relative min-h-[420px] overflow-hidden"
          style={{ backgroundColor: 'var(--color-auth-aside-bg)' }}
          aria-label="Socia community"
        >
          <img className="absolute inset-0 z-0 m-auto size-full object-contain" src="/thumbnail.png" alt="Cộng đồng Socia" />
          <div
            className="absolute inset-0 z-10"
            style={{
              background: `linear-gradient(to bottom right, var(--color-auth-aside-overlay-from), var(--color-auth-aside-overlay-via), var(--color-auth-aside-overlay-to))`,
            }}
          />
          <div className="absolute inset-x-[9%] bottom-[9%] z-20 text-white">
            <span className="mb-3 inline-flex rounded-full border border-white/30 bg-white/15 px-2.5 py-1.5 text-xs font-bold">
              Welcome to Socia
            </span>
            <h2 className="m-0 mb-2 text-[29px] leading-[1.2] font-bold">
              {isLogin ? 'Mỗi kết nối đều có ý nghĩa.' : 'Cùng nhau tạo nên những kết nối.'}
            </h2>
            <p className="m-0 max-w-[360px] text-sm leading-[1.55] text-white/80">
              Khám phá, chia sẻ và trò chuyện với cộng đồng của bạn.
            </p>
          </div>
        </aside>
      </section>
    </main>
  )
}
