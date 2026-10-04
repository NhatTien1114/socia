export type ChatUser = { id: string; username: string; avatar: string | null }
export type ChatRoom = { id: string; friend: ChatUser }
export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}
export type MessagePage = { items: ChatMessage[]; nextBefore: string | null }
// BootstrapResponse.java uses the singular property "conversation".
export type ChatBootstrap = { me: ChatUser; friends: ChatUser[]; conversation: ChatRoom[] }
export type ChatApi = {
  bootstrap: () => Promise<ChatBootstrap>
  open: (friendId: string) => Promise<ChatRoom>
  history: (id: string, before?: string | null, limit?: number) => Promise<MessagePage>
  send: (id: string, content: string) => Promise<ChatMessage>
}
