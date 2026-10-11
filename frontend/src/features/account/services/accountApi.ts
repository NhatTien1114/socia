import { apiRequest } from '@/lib/api'

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

export const accountApi = {
  get: (signal?: AbortSignal): Promise<Profile> => apiRequest('/users/me', { signal }),
  save: (profile: ProfileInput, avatar: File | null): Promise<Profile> => {
    const body = new FormData()
    body.append('profile', new Blob([JSON.stringify(profile)], { type: 'application/json' }))
    if (avatar) body.append('avatar', avatar)
    return apiRequest('/users/me', { method: 'PUT', body, signal: AbortSignal.timeout(90000) })
  },
  changePassword: (oldPassword: string, newPassword: string): Promise<void> => apiRequest('/users/change-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword, newPassword }),
  }),
}
