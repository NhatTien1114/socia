import { useState, type FormEvent } from 'react'
import { register } from '../../services/authApi'
import { AuthField, LockIcon, PhoneIcon, UserIcon } from './AuthField'

export function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const password = String(formData.get('password'))
    if (password !== String(formData.get('confirmPassword'))) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận chưa khớp.' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const result = await register({
        username: String(formData.get('username')),
        password,
        phone: String(formData.get('phone')) || undefined,
        sex: formData.get('sex') === 'FEMALE' ? 'FEMALE' : 'MALE',
      })
      setMessage({ type: 'success', text: `${result.message ?? 'Đăng ký thành công.'} Bạn có thể đăng nhập ngay.` })
      form.reset()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
        <AuthField id="register-username" name="username" label="Tên đăng nhập" placeholder="Chọn tên đăng nhập" autoComplete="username" required icon={<UserIcon />} />
        <AuthField id="register-phone" name="phone" type="tel" label="Số điện thoại" placeholder="Nhập số điện thoại (không bắt buộc)" autoComplete="tel" icon={<PhoneIcon />} />
        <div className="grid gap-1.5">
          <label className="text-[13px] font-semibold text-[#52617d]" htmlFor="register-sex">Giới tính</label>
          <div className="flex min-h-11 items-center gap-2.5 rounded-xl border border-[#e3e8f2] bg-[#fafbfe] px-3.5 focus-within:border-[#3f6ee8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#3f6ee8]/12"><UserIcon /><select className="w-full appearance-none border-0 bg-transparent text-sm text-[#273452] outline-none" id="register-sex" name="sex" defaultValue="MALE"><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></select></div>
        </div>
        <AuthField id="register-password" name="password" label="Mật khẩu" placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" minLength={6} required password icon={<LockIcon />} />
        <AuthField id="register-confirm-password" name="confirmPassword" label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" autoComplete="new-password" required password icon={<LockIcon />} />
        {message && <p className={`m-0 rounded-[10px] px-3 py-2.5 text-[13px] leading-snug ${message.type === 'error' ? 'bg-[#fff0f2] text-[#b33a4c]' : 'bg-[#eaf9f0] text-[#20774a]'}`} role="alert">{message.text}</p>}
        <button className="mt-0.5 min-h-11 cursor-pointer rounded-xl border-0 bg-linear-to-r from-[#2858cf] to-[#477cf0] text-sm font-bold text-white shadow-[0_10px_20px_rgba(48,93,211,0.2)] transition hover:-translate-y-px hover:brightness-105 disabled:cursor-wait disabled:opacity-70" type="submit" disabled={loading}>{loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</button>
      </form>
      <p className="mb-0 mt-5 text-center text-[13px] text-[#7e8aa2]">Đã có tài khoản? <a className="font-bold text-[#3565d9] no-underline hover:underline" href="/login">Đăng nhập</a></p>
    </>
  )
}
