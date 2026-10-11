import { API_BASE_URL, apiRequest } from '@/lib/api'
import type { ChatApi } from '../types/chatApi.types'

export const chatApi: ChatApi = {
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

export function websocketUrl() {
  const url = new URL(`${API_BASE_URL}/ws`, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}
