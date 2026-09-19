import { STORAGE_KEYS } from '@/constants/storage'

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
}

export function removeAccessToken(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}
