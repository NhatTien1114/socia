import { API_BASE_URL, apiRequest } from '@/lib/api'
import type { ChatApi } from '../types/chatApi.types'

export const chatApi: ChatApi = {
  updateNickname: (groupId, userId, nickname) => apiRequest(`/conversations/groups/${groupId}/members/${userId}/nickname`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname }),
  }),
  presence: () => apiRequest('/presence'),
  markRead: (id, messageIds) => apiRequest(`/conversations/${id}/reads`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageIds }),
  }),
  groups: () => apiRequest('/conversations/groups'),
  createGroup: (request, avatar) => {
    if (!avatar) return apiRequest('/conversations/groups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
    })
    const body = new FormData()
    body.append('group', new Blob([JSON.stringify(request)], { type: 'application/json' }))
    body.append('avatar', avatar)
    return apiRequest('/conversations/groups', { method: 'POST', body, signal: AbortSignal.timeout(90000) })
  },
  updateGroupAvatar: (id, avatar) => {
    const body = new FormData()
    body.append('avatar', avatar)
    return apiRequest(`/conversations/groups/${id}/avatar`, { method: 'PUT', body, signal: AbortSignal.timeout(90000) })
  },
  bootstrap: () => apiRequest('/conversations/bootstrap'),
  open: friendId => apiRequest('/conversations/direct', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ friendId }),
  }),
  history: (id, before, limit = 30) => {
    const query = new URLSearchParams({ limit: String(limit) })
    if (before) query.set('before', before)
    return apiRequest(`/conversations/${id}/messages?${query}`)
  },
  send: (id, content) => apiRequest(`/conversations/${id}/messages`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
  }),
}

export function websocketUrl(endpoint = `${API_BASE_URL}/ws`) {
  const url = new URL(endpoint, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export async function websocketTicket() {
  const result = await apiRequest<{ ticket: string; url: string }>('/auth/ws-ticket', { method: 'POST' })
  if (!result || !/^[A-Za-z0-9_-]{43}$/.test(result.ticket) || typeof result.url !== 'string') {
    throw new Error('Invalid WebSocket ticket response')
  }
  return result
}
