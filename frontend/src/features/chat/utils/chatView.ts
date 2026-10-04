import type { ChatMessage, ChatUser } from '../types/chatApi.types'
import type { Message, User } from '../types/chat.types'

export function avatarFor(name: string) {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? '?'
  const escaped = initial.replace(/[<>&"']/g, '')
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#756FB3"/><text x="48" y="61" font-size="38" text-anchor="middle" fill="white" font-family="sans-serif">${escaped}</text></svg>`)}`
}
export function toUser(user: ChatUser): User {
  const name = user.displayName || user.username
  return { id: user.id, name, avatar: user.avatar || avatarFor(name), online: false }
}
export function toMessage(message: ChatMessage): Message {
  // LocalDateTime has no timezone: preserve the backend's wall-clock time.
  return {
    id: message.id, senderId: message.senderId, type: 'text', content: message.content,
    date: message.createdAt.slice(0, 10), timestamp: message.createdAt.slice(11, 16),
  }
}
