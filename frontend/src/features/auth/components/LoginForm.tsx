import { useState, type FormEvent } from 'react'
import { login } from '@/features/auth/services/authApi'
import { setAccessToken } from '@/utils/storage'
import { APP_ROUTES } from '@/constants/routes'
import { AuthField, LockIcon, UserIcon } from './AuthField'

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setLoading(true)
    setMessage(null)
    try {
      const result = await login({
        username: String(formData.get('username')),
        password: String(formData.get('password')),
      })
      if (!result.authenticated || !result.token) {
        throw new Error('Không thể xác thực tài khoản. Vui lòng thử lại.')
      }
      setAccessToken(result.token)
      setMessage({ type: 'success', text: result.message ?? 'Đăng nhập thành công.' })
      setTimeout(() => {
        window.location.href = APP_ROUTES.HOME
      }, 600)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="grid gap-3.5" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="login-username"
          name="username"
          label="Tên đăng nhập"
          placeholder="Nhập tên đăng nhập"
          autoComplete="username"
          required
          icon={<UserIcon />}
        />
        <AuthField
          id="login-password"
          name="password"
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          required
          password
          icon={<LockIcon />}
        />
        <div className="-mt-0.5 flex items-center justify-between gap-3 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-[#74809a]">
            <input className="accent-[#3565d9]" type="checkbox" name="remember" /> Ghi nhớ đăng nhập
          </label>
          <a className="font-bold text-[#3565d9] no-underline hover:underline" href="#forgot-password">
            Quên mật khẩu?
          </a>
        </div>
        {message && (
          <p
            className={`m-0 rounded-[10px] px-3 py-2.5 text-[13px] leading-snug ${
              message.type === 'error' ? 'bg-[#fff0f2] text-[#b33a4c]' : 'bg-[#eaf9f0] text-[#20774a]'
            }`}
            role="alert"
          >
            {message.text}
          </p>
        )}
        <button
          className="mt-0.5 min-h-11 cursor-pointer rounded-xl border-0 bg-linear-to-r from-[#2858cf] to-[#477cf0] text-sm font-bold text-white shadow-[0_10px_20px_rgba(48,93,211,0.2)] transition hover:-translate-y-px hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
      <p className="mb-0 mt-5 text-center text-[13px] text-[#7e8aa2]">
        Chưa có tài khoản?{' '}
        <a className="font-bold text-[#3565d9] no-underline hover:underline" href={APP_ROUTES.REGISTER}>
          Đăng ký ngay
        </a>
      </p>
    </>
  )
}
