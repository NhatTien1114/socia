import type { ReactNode } from 'react'

type AuthLayoutProps = {
  mode: 'login' | 'register'
  children: ReactNode
}

export function AuthLayout({ mode, children }: AuthLayoutProps) {
  const isLogin = mode === 'login'
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7ff] p-4 sm:p-8">
      <section className="grid w-full max-w-[1160px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_64px_rgba(32,59,138,0.13)] lg:h-[760px] lg:grid-cols-[minmax(390px,0.92fr)_minmax(420px,1.08fr)]">
        <div className="flex items-center justify-center px-6 py-9 sm:px-12 lg:px-16">
          <div className="w-full max-w-[390px]">
            <div className="mb-6 flex items-center gap-2.5 text-[19px] font-extrabold tracking-[-0.4px] text-[#183d93]">
              <img className="size-[46px] object-contain flex justify-center items-center" src="/Socia_Logo.png" alt="Socia" />
              <span>Socia</span>
            </div>
            <h1 className="m-0 text-[29px] leading-[1.18] font-bold tracking-[-1px] text-[#182344] sm:text-[36px]">
              {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
            </h1>
            <p className="mb-6 mt-2.5 text-sm leading-[1.55] text-[#8490aa]">
              {isLogin
                ? 'Đăng nhập để tiếp tục kết nối và chia sẻ cùng cộng đồng Socia.'
                : 'Tham gia Socia để kết nối với những người bạn mới.'}
            </p>
            {children}
          </div>
        </div>
        <aside className="relative min-h-[420px] overflow-hidden bg-[#183d9f]" aria-label="Socia community">
          <img className="absolute inset-0 z-0 m-auto size-full object-contain" src="/thumbnail.png" alt="Cộng đồng Socia" />
          <div className="absolute inset-0 z-10 bg-linear-to-br from-[#1f46b8]/55 via-[#0f2c7b]/10 to-[#211764]/50" />
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
