import { apiRequest, resetCsrf } from '@/lib/api'
import type { AuthenticationResponse, LoginPayload, RegisterPayload } from '../types/auth.types'

export type Session = { authenticated: true; username: string; expiresAt: string; serverTime: string }
export type SessionTiming = Session & { deadline: number }

export async function getSession(): Promise<SessionTiming> {
  const started = Date.now()
  const data = await apiRequest<Session>('/auth/session')
  const remaining = Date.parse(data.expiresAt) - Date.parse(data.serverTime)
  if (data.authenticated !== true || !Number.isFinite(remaining)) {
    throw new Error('Phản hồi phiên đăng nhập không hợp lệ.')
  }
  // Server time tolerates a client clock offset; subtract request time conservatively.
  return { ...data, deadline: started + Math.max(0, remaining) }
}

export async function login(payload: LoginPayload): Promise<AuthenticationResponse> {
  const result = await apiRequest<AuthenticationResponse>('/auth/login', {
    method: 'POST', publicRequest: true, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  resetCsrf()
  // Confirm that the browser actually accepted the cookie.
  await getSession()
  return result
}

export function register(payload: RegisterPayload): Promise<AuthenticationResponse> {
  return apiRequest('/auth/register', {
    method: 'POST', publicRequest: true, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function logout(): Promise<void> {
  await apiRequest('/auth/logout', { method: 'POST' })
  resetCsrf()
}
