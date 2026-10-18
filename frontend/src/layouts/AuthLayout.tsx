import type { ReactNode } from 'react'

type AuthLayoutProps = {
  mode: 'login' | 'register'
  children: ReactNode
}

export function AuthLayout({ mode, children }: AuthLayoutProps) {
  const isLogin = mode === 'login'
  return (
    <main
      className="auth-page grid min-h-dvh place-items-center"
      style={{ backgroundColor: 'var(--color-auth-bg)' }}
    >
      <section
        className="grid min-w-0 w-full max-w-[540px] overflow-hidden rounded-2xl sm:rounded-[28px] lg:max-w-[1160px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        style={{
          backgroundColor: 'var(--color-auth-card-bg)',
          boxShadow: '0 24px 64px var(--color-auth-card-shadow)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex min-w-0 items-center justify-center px-4 py-6 min-[375px]:px-6 sm:px-10 sm:py-8 lg:px-8 lg:py-10 xl:px-14">
          <div className="min-w-0 w-full max-w-[400px]">
            <div
              className="mb-5 flex items-center gap-2.5 text-[19px] font-extrabold tracking-[-0.4px] sm:mb-6"
              style={{ color: 'var(--color-auth-logo-text)' }}
            >
              <img className="size-10 shrink-0 object-contain sm:size-[46px]" src="/Socia_Logo.png" alt="Socia" />
              <span>Socia</span>
            </div>
            <h1
              className="m-0 break-words text-[26px] leading-tight font-bold tracking-[-0.7px] min-[375px]:text-[29px] sm:text-[34px] xl:text-[36px]"
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
          className="relative hidden min-w-0 overflow-hidden lg:block"
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
            <h2 className="m-0 mb-2 text-[25px] leading-[1.2] font-bold xl:text-[29px]">
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
