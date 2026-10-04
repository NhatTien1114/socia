import { getAccessToken } from '@/utils/storage'
import type { ChatApi } from '../types/chatApi.types'

export class ChatApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const base = (import.meta.env?.VITE_API_BASE_URL ?? '/socia/v1').replace(/\/$/, '')

async function request<T>(path: string, body?: object): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken() ?? ''}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new Error('Không thể kết nối máy chủ. Kiểm tra mạng rồi thử lại.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ChatApiError(
      response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        : data?.message ?? data?.detail ?? 'Không thể thực hiện yêu cầu.',
      response.status,
    )
  }
  return data as T
}

export const chatApi: ChatApi = {
  bootstrap: () => request('/conversations/bootstrap'),
  open: friendId => request('/conversations/direct', { friendId }),
  history: (id, before, limit = 30) => {
    const query = new URLSearchParams({ limit: String(limit) })
    if (before) query.set('before', before)
    return request(`/conversations/${id}/messages?${query}`)
  },
  send: (id, content) => request(`/conversations/${id}/messages`, { content }),
}

export function websocketUrl() {
  const url = new URL(`${base}/ws`, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}
