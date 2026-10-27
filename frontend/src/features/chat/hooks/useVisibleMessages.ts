import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { Message } from '../types/chat.types'

export function useVisibleMessages(root: RefObject<HTMLDivElement | null>, messages: Message[],
  currentUserId: string, enabled: boolean, onVisible: (ids: string[]) => Promise<void>) {
  const latest = useRef({ messages, enabled, onVisible })
  useLayoutEffect(() => { latest.current = { messages, enabled, onVisible } })
  useEffect(() => {
    const container = root.current
    if (!container || typeof IntersectionObserver === 'undefined') return
    const visible = new Set<string>(), inFlight = new Set<string>(), confirmed = new Set<string>()
    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let retryAfter = 0
    const canRead = () => latest.current.enabled && document.visibilityState === 'visible'
      && document.hasFocus() && container.getClientRects().length > 0
    const schedule = () => {
      if (disposed || timer || !canRead()) return
      timer = setTimeout(flush, Math.max(300, retryAfter - Date.now()))
    }
    const flush = async () => {
      timer = undefined
      if (disposed || !canRead()) return
      const ids = latest.current.messages.filter(message => visible.has(message.id)
        && message.senderId !== currentUserId && !(message.readByIds ?? []).includes(currentUserId)
        && !inFlight.has(message.id) && !confirmed.has(message.id)).slice(0, 100).map(message => message.id)
      if (!ids.length) return
      ids.forEach(id => inFlight.add(id))
      try {
        await latest.current.onVisible(ids)
        ids.forEach(id => confirmed.add(id))
      } catch { retryAfter = Date.now() + 5000 }
      finally {
        ids.forEach(id => inFlight.delete(id))
        schedule()
      }
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.messageId!
        if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(id)
        else visible.delete(id)
      }
      schedule()
    }, { root: container, threshold: 0 })
    const observe = () => container.querySelectorAll('[data-message-id]').forEach(el => observer.observe(el))
    observe()
    const mutations = new MutationObserver(() => { observe(); schedule() })
    mutations.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-read-enabled'] })
    window.addEventListener('focus', schedule)
    window.addEventListener('online', schedule)
    document.addEventListener('visibilitychange', schedule)
    return () => {
      disposed = true
      clearTimeout(timer)
      observer.disconnect()
      mutations.disconnect()
      window.removeEventListener('focus', schedule)
      window.removeEventListener('online', schedule)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [root, currentUserId])
}
