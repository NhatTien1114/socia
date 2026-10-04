import { getAccessToken } from '@/utils/storage'

export type Profile = {
  id: string
  username: string
  displayName: string
  avatar: string | null
  phone: string | null
  sex: 'MALE' | 'FEMALE' | null
  birthDate: string | null
}
export type ProfileInput = Pick<Profile, 'displayName' | 'phone' | 'sex' | 'birthDate'>

const base = (import.meta.env?.VITE_API_BASE_URL ?? '/socia/v1').replace(/\/$/, '')

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  headers.set('Authorization', `Bearer ${token}`)
  const timeout = AbortSignal.timeout(options.method ? 90_000 : 15_000)
  const response = await fetch(`${base}/users${path}`, {
    ...options, headers, signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
  }).catch(() => { throw new Error('Không kết nối được máy chủ hoặc yêu cầu quá thời gian. Vui lòng thử lại.') })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    if (response.status === 413) throw new Error('Ảnh không được vượt quá 4 MB.')
    const error = await response.json().catch(() => null)
    throw new Error(error?.message ?? 'Không thể lưu thay đổi. Vui lòng thử lại.')
  }
  return response.status === 204 ? null : response.json()
}

export const accountApi = {
  get: (signal?: AbortSignal): Promise<Profile> => request('/me', { signal }),
  save: (profile: ProfileInput, avatar: File | null): Promise<Profile> => {
    const body = new FormData()
    body.append('profile', new Blob([JSON.stringify(profile)], { type: 'application/json' }))
    if (avatar) body.append('avatar', avatar)
    return request('/me', { method: 'PUT', body })
  },
  changePassword: (oldPassword: string, newPassword: string): Promise<void> => request('/change-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword, newPassword }),
  }),
}
