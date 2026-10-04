import type { ChatApi, ChatMessage, ChatRoom, ChatUser } from '../types/chatApi.types.ts'

export type History = {
  items: ChatMessage[]
  nextBefore: string | null
  loading: boolean
  loadingOlder: boolean
  error: string
}
export type ChatState = {
  me: ChatUser | null
  friends: ChatUser[]
  rooms: ChatRoom[]
  histories: Record<string, History>
  latest: Record<string, ChatMessage>
  unread: Record<string, number>
  activeId: string | null
  loading: boolean
  opening: boolean
  error: string
  expired: boolean
  connection: 'connecting' | 'connected' | 'offline'
}

export const emptyHistory = (): History => ({
  items: [], nextBefore: null, loading: false, loadingOlder: false, error: '',
})

// Keep the fractional seconds returned by LocalDateTime, including microseconds.
function timeKey(value: string) {
  const [seconds, fraction = ''] = value.split('.')
  return `${seconds}.${fraction.padEnd(9, '0')}`
}
export function compareMessages(a: ChatMessage, b: ChatMessage) {
  return timeKey(a.createdAt).localeCompare(timeKey(b.createdAt)) || a.id.localeCompare(b.id)
}
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const unique = new Map(current.map(message => [message.id, message]))
  incoming.forEach(message => unique.set(message.id, message))
  return [...unique.values()].sort(compareMessages)
}
export function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}

export class ChatStore {
  private api: ChatApi
  private listeners = new Set<() => void>()
  private run = 0
  private alive = false
  private bootstrapVersion = 0
  private historyVersions = new Map<string, number>()
  private seen = new Set<string>()
  private state: ChatState = {
    me: null, friends: [], rooms: [], histories: {}, latest: {}, unread: {},
    activeId: null, loading: true, opening: false, error: '', expired: false,
    connection: 'connecting',
  }

  constructor(api: ChatApi) { this.api = api }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  private update(patch: Partial<ChatState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach(listener => listener())
  }
  private history(id: string, patch: Partial<History>) {
    this.update({ histories: {
      ...this.state.histories,
      [id]: { ...(this.state.histories[id] ?? emptyHistory()), ...patch },
    } })
  }
  private failed(error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      this.expire()
    }
    return errorText(error)
  }
  start() {
    this.alive = true
    this.run++
    void this.refresh()
  }
  stop() {
    this.alive = false
    this.run++
  }
  expire() {
    this.update({ expired: true, connection: 'offline', error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' })
  }
  clearError = () => this.update({ error: '' })
  connection = (connection: ChatState['connection']) => {
    if (!this.alive) return
    this.update({ connection })
    if (connection === 'connected') {
      void this.refresh()
      if (this.state.activeId) void this.loadHistory(this.state.activeId)
    }
  }
  refresh = async () => {
    if (this.state.expired) return
    const run = this.run
    const version = ++this.bootstrapVersion
    try {
      const data = await this.api.bootstrap()
      if (!this.alive || this.state.expired || run !== this.run || version !== this.bootstrapVersion) return
      // An openDirect response may arrive while bootstrap is still in flight.
      const rooms = [...data.conversation]
      for (const room of this.state.rooms) {
        if (!rooms.some(item => item.id === room.id)) rooms.push(room)
      }
      this.update({ me: data.me, friends: data.friends, rooms, loading: false, error: '' })
      // Bootstrap does not include previews; fetch only one message per room,
      // with bounded concurrency, rather than every conversation's history.
      const queue = [...rooms]
      void Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => {
        let room: ChatRoom | undefined
        while ((room = queue.shift())) {
          if (!this.alive || run !== this.run || version !== this.bootstrapVersion) return
          try {
            const page = await this.api.history(room.id, null, 1)
            if (!this.alive || run !== this.run || version !== this.bootstrapVersion) return
            for (const message of page.items) this.preview(message)
          } catch (error) {
            if (this.alive && run === this.run && version === this.bootstrapVersion) this.failed(error)
          }
        }
      }))
    } catch (error) {
      if (this.alive && run === this.run && version === this.bootstrapVersion) {
        this.update({ loading: false, error: this.failed(error) })
      }
    }
  }
  private preview(message: ChatMessage) {
    const old = this.state.latest[message.conversationId]
    if (!old || compareMessages(old, message) < 0) {
      this.update({ latest: { ...this.state.latest, [message.conversationId]: message } })
    }
  }
  receive = (message: ChatMessage) => {
    if (!this.alive || this.state.expired) return
    const id = message.conversationId
    const duplicate = this.seen.has(message.id)
    this.seen.add(message.id)
    const history = this.state.histories[id]
    if (history) this.history(id, { items: mergeMessages(history.items, [message]) })
    this.preview(message)
    if (!duplicate && message.senderId !== this.state.me?.id && id !== this.state.activeId) {
      this.update({ unread: { ...this.state.unread, [id]: (this.state.unread[id] ?? 0) + 1 } })
    }
    if (!this.state.rooms.some(room => room.id === id)) void this.refresh()
  }
  select = (id: string | null) => {
    this.update({ activeId: id, ...(id ? { unread: { ...this.state.unread, [id]: 0 } } : {}) })
    if (id) void this.loadHistory(id)
  }
  open = async (friendId: string) => {
    if (this.state.opening || this.state.expired) return false
    const run = this.run
    this.update({ opening: true, error: '' })
    try {
      const room = await this.api.open(friendId)
      if (!this.alive || run !== this.run) return false
      if (!this.state.rooms.some(item => item.id === room.id)) {
        this.update({ rooms: [room, ...this.state.rooms] })
      }
      this.select(room.id)
      return true
    } catch (error) {
      if (this.alive && run === this.run) this.update({ error: this.failed(error) })
      return false
    } finally {
      if (this.alive && run === this.run) this.update({ opening: false })
    }
  }
  loadHistory = async (id: string) => {
    const run = this.run
    const version = (this.historyVersions.get(id) ?? 0) + 1
    this.historyVersions.set(id, version)
    // A fresh window avoids silently joining disconnected ranges after reconnect.
    this.history(id, { ...emptyHistory(), loading: true })
    try {
      const page = await this.api.history(id)
      if (!this.alive || run !== this.run || this.historyVersions.get(id) !== version) return
      page.items.forEach(message => this.seen.add(message.id))
      this.history(id, {
        items: mergeMessages(page.items, this.state.histories[id]?.items ?? []),
        nextBefore: page.nextBefore, loading: false,
      })
      page.items.forEach(message => this.preview(message))
    } catch (error) {
      if (this.alive && run === this.run && this.historyVersions.get(id) === version) {
        this.history(id, { loading: false, error: this.failed(error) })
      }
    }
  }
  loadOlder = async (id: string) => {
    const history = this.state.histories[id]
    if (!history?.nextBefore || history.loading || history.loadingOlder) return
    const run = this.run
    const version = this.historyVersions.get(id)
    this.history(id, { loadingOlder: true, error: '' })
    try {
      const page = await this.api.history(id, history.nextBefore)
      if (!this.alive || run !== this.run || version !== this.historyVersions.get(id)) return
      page.items.forEach(message => this.seen.add(message.id))
      this.history(id, {
        items: mergeMessages(this.state.histories[id].items, page.items),
        nextBefore: page.nextBefore, loadingOlder: false,
      })
    } catch (error) {
      if (this.alive && run === this.run && version === this.historyVersions.get(id)) {
        this.history(id, { loadingOlder: false, error: this.failed(error) })
      }
    }
  }
  send = async (id: string, content: string) => {
    const text = content.trim()
    if (!text || text.length > 2000) throw new Error('Tin nhắn phải có từ 1 đến 2000 ký tự.')
    if (this.state.expired) throw new Error('Vui lòng đăng nhập lại để gửi tin nhắn.')
    const run = this.run
    try {
      const message = await this.api.send(id, text)
      if (this.alive && run === this.run) this.receive(message)
    } catch (error) {
      if (this.alive && run === this.run) this.failed(error)
      throw error
    }
  }
}
