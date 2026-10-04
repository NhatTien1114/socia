import { useEffect, useState, useSyncExternalStore } from 'react'
import { Client } from '@stomp/stompjs'
import { getAccessToken } from '@/utils/storage'
import { chatApi, websocketUrl } from '../services/chatApi'
import { ChatStore } from '../state/chatStore'
import type { ChatMessage } from '../types/chatApi.types'

export function useChat() {
  const [store] = useState(() => new ChatStore(chatApi))
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => {
    store.start()
    let disposed = false
    let expiryTimer: ReturnType<typeof setTimeout> | undefined
    const client = new Client({
      brokerURL: websocketUrl(), reconnectDelay: 3000, connectionTimeout: 10000,
      heartbeatIncoming: 10000, heartbeatOutgoing: 10000,
    })
    client.beforeConnect = async () => {
      if (disposed || store.getSnapshot().expired) { void client.deactivate(); return }
      try {
        const token = getAccessToken()
        if (!token) throw new Error('Missing token')
        const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const { exp } = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')))
        if (typeof exp !== 'number' || exp * 1000 <= Date.now()) throw new Error('Expired token')
        client.connectHeaders = { Authorization: `Bearer ${token}` }
        clearTimeout(expiryTimer)
        expiryTimer = setTimeout(() => {
          if (!disposed) { store.expire(); void client.deactivate() }
        }, Math.min(exp * 1000 - Date.now(), 2_147_483_647))
        store.connection('connecting')
      } catch { store.expire(); void client.deactivate() }
    }
    client.onConnect = () => {
      if (disposed) return
      client.subscribe('/user/queue/messages', frame => {
        if (disposed) return
        try {
          const message = JSON.parse(frame.body) as ChatMessage
          if (typeof message.id === 'string' && typeof message.conversationId === 'string'
              && typeof message.senderId === 'string' && typeof message.content === 'string'
              && typeof message.createdAt === 'string') store.receive(message)
        } catch { /* Recover history through REST on reconnect/focus. */ }
      })
      store.connection('connected')
    }
    client.onWebSocketClose = () => { if (!disposed) store.connection('offline') }
    client.onStompError = () => { if (!disposed) store.connection('offline') }
    const unsubscribe = store.subscribe(() => {
      if (store.getSnapshot().expired) void client.deactivate()
    })
    const recover = () => {
      if (document.visibilityState !== 'visible' || store.getSnapshot().expired) return
      void store.refresh()
      const id = store.getSnapshot().activeId
      if (id) void store.loadHistory(id)
    }
    window.addEventListener('online', recover)
    document.addEventListener('visibilitychange', recover)
    client.activate()
    return () => {
      disposed = true
      clearTimeout(expiryTimer)
      unsubscribe()
      window.removeEventListener('online', recover)
      document.removeEventListener('visibilitychange', recover)
      store.stop()
      void client.deactivate()
    }
  }, [store])
  return { state, store }
}
