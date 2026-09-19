export type User = {
  id: string
  name: string
  avatar: string
  online: boolean
  phone?: string
}

export type MessageType = 'text' | 'image' | 'voice' | 'file'

export type Message = {
  id: string
  senderId: string
  type: MessageType
  content: string // text | image URL | voice duration | file name
  fileSize?: string // for file type
  voiceDuration?: number // seconds, for voice type
  timestamp: string // HH:mm
  date: string // YYYY-MM-DD
}

export type Conversation = {
  id: string
  participants: User[]
  isGroup: boolean
  groupName?: string
  groupAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  messages: Message[]
}

export type NavTab = 'chat' | 'contacts' | 'groups' | 'settings'
