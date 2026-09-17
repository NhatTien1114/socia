const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/socia/v1'

type ApiError = { message?: string }

export type LoginPayload = { username: string; password: string }
export type RegisterPayload = {
  username: string
  password: string
  phone?: string
  sex?: 'MALE' | 'FEMALE'
}

type AuthenticationResponse = { message?: string; token?: string; authenticated?: boolean }

async function request<T>(path: string, body: object): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy.')
  }

  const data = (await response.json().catch(() => ({}))) as T & ApiError
  if (!response.ok) throw new Error(data.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.')
  return data
}

export async function login(payload: LoginPayload) {
  return request<AuthenticationResponse>('/auth/login', payload)
}

export async function register(payload: RegisterPayload) {
  return request<AuthenticationResponse>('/auth/register', payload)
}
