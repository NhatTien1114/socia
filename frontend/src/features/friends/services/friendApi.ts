import { apiRequest } from '@/lib/api'
import type { FriendRequest, SendFriendRequestPayload, UserSearchResult } from '../types/friend.types'

export function getMyFriends(): Promise<FriendRequest[]> {
  return apiRequest('/friends')
}
export function getPendingRequests(): Promise<FriendRequest[]> {
  return apiRequest('/friends/pending')
}
export function getSentRequests(): Promise<FriendRequest[]> {
  return apiRequest('/friends/sent')
}
export function sendFriendRequest(payload: SendFriendRequestPayload): Promise<FriendRequest> {
  return apiRequest('/friends/request', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
}
export function respondFriendRequest(requestId: string, accept: boolean): Promise<FriendRequest> {
  return apiRequest(`/friends/${requestId}/respond?accept=${accept}`, { method: 'PUT' })
}
export function cancelFriendRequest(requestId: string): Promise<void> {
  return apiRequest(`/friends/${requestId}`, { method: 'DELETE' })
}
export function searchUsers(query: string): Promise<UserSearchResult[]> {
  return apiRequest(`/users/search?query=${encodeURIComponent(query)}`)
}
