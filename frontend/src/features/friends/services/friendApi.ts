import { getAccessToken } from '@/utils/storage'
import type { FriendRequest, SendFriendRequestPayload, UserSearchResult } from '@/features/friends/types/friend.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/socia/v1'

function authHeaders(): HeadersInit {
  const token = getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function authGet<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: authHeaders(),
    })
  } catch {
    throw new Error('Không thể kết nối tới máy chủ.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message ?? 'Đã có lỗi xảy ra.')
  return data as T
}

async function authPost<T>(path: string, body: object): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Không thể kết nối tới máy chủ.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message ?? 'Đã có lỗi xảy ra.')
  return data as T
}

async function authPut<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: authHeaders(),
    })
  } catch {
    throw new Error('Không thể kết nối tới máy chủ.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message ?? 'Đã có lỗi xảy ra.')
  return data as T
}

async function authDelete(path: string): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  } catch {
    throw new Error('Không thể kết nối tới máy chủ.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message ?? 'Đã có lỗi xảy ra.')
  }
}

// ─── Friend Request API ──────────────────────────────────────

export async function getMyFriends(): Promise<FriendRequest[]> {
  return authGet<FriendRequest[]>('/friends')
}

export async function getPendingRequests(): Promise<FriendRequest[]> {
  return authGet<FriendRequest[]>('/friends/pending')
}

export async function getSentRequests(): Promise<FriendRequest[]> {
  return authGet<FriendRequest[]>('/friends/sent')
}

export async function sendFriendRequest(payload: SendFriendRequestPayload): Promise<FriendRequest> {
  return authPost<FriendRequest>('/friends/request', payload)
}

export async function respondFriendRequest(requestId: string, accept: boolean): Promise<FriendRequest> {
  return authPut<FriendRequest>(`/friends/${requestId}/respond?accept=${accept}`)
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  return authDelete(`/friends/${requestId}`)
}

// ─── User Search API ──────────────────────────────────────

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  return authGet<UserSearchResult[]>(`/users/search?query=${encodeURIComponent(query)}`)
}
