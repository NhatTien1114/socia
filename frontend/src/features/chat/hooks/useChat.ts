import { useEffect, useState, useSyncExternalStore } from 'react'
import { Client } from '@stomp/stompjs'
import { ApiError, SESSION_EXPIRED_EVENT, notifySessionExpired } from '@/lib/api'
import { getSession } from '@/features/auth/services/authApi'
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
    const expire = () => {
      if (!disposed) { store.expire(); void client.deactivate() }
    }
    // HTTP handshake sends the HttpOnly cookie automatically. No JWT in STOMP headers.
    client.beforeConnect = async () => {
      if (disposed || store.getSnapshot().expired) { void client.deactivate(); return }
      try {
        const session = await getSession()
        if (disposed || store.getSnapshot().expired) { void client.deactivate(); return }
        const remaining = session.deadline - Date.now()
        if (remaining <= 0) { notifySessionExpired(); return }
        clearTimeout(expiryTimer)
        expiryTimer = setTimeout(() => {
          if (!disposed) notifySessionExpired()
        }, Math.min(remaining, 2_147_483_647))
        store.connection('connecting')
      } catch (error) {
        if (disposed) return
        if (error instanceof ApiError && error.status === 401) expire()
        else store.connection('offline')
        // A network failure alone is not proof that the session expired.
        // The handshake can still proceed; STOMP retries closed connections.
      }
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
    window.addEventListener(SESSION_EXPIRED_EVENT, expire)
    window.addEventListener('online', recover)
    document.addEventListener('visibilitychange', recover)
    client.activate()
    return () => {
      disposed = true
      clearTimeout(expiryTimer)
      unsubscribe()
      window.removeEventListener(SESSION_EXPIRED_EVENT, expire)
      window.removeEventListener('online', recover)
      document.removeEventListener('visibilitychange', recover)
      store.stop()
      void client.deactivate()
    }
  }, [store])
  return { state, store }
}
