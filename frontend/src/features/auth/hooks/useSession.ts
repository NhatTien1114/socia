import { useEffect, useState } from 'react'
import { ApiError, SESSION_EXPIRED_EVENT } from '@/lib/api'
import { getSession } from '../services/authApi'
import { clearLegacyAccessToken } from '@/utils/storage'

type State = { status: 'checking' | 'authenticated' | 'anonymous' | 'error'; error: string }

export function useSession() {
  const [state, setState] = useState<State>({ status: 'checking', error: '' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    clearLegacyAccessToken()
    let disposed = false, version = 0, checking = false, authenticated = false, failures = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    function expire() {
      version++
      authenticated = false
      clearTimeout(timer)
      clearTimeout(retryTimer)
      if (!disposed) setState({ status: 'anonymous', error: '' })
    }
    async function check() {
      if (checking || disposed) return
      checking = true
      clearTimeout(retryTimer)
      const current = version
      try {
        const session = await getSession({ timeoutMs: 30000 })
        if (disposed || current !== version) return
        const remaining = session.deadline - Date.now()
        if (remaining <= 0) { expire(); return }
        authenticated = true
        failures = 0
        setState({ status: 'authenticated', error: '' })
        clearTimeout(timer)
        timer = setTimeout(expire, Math.min(remaining, 2_147_483_647))
      } catch (error) {
        if (disposed || current !== version) return
        if (error instanceof ApiError && error.status === 401) expire()
        else if (!authenticated) {
          // A sleeping free backend can take a minute to start. Retry only this safe read.
          const temporary = error instanceof ApiError && [0, 502, 503, 504].includes(error.status)
          if (temporary && ++failures < 3) retryTimer = setTimeout(() => { void check() }, 3000)
          else setState({ status: 'error', error: error instanceof Error ? error.message : 'Không kiểm tra được phiên đăng nhập.' })
        }
      } finally { checking = false }
    }
    const recheck = () => { if (document.visibilityState === 'visible') void check() }
    window.addEventListener(SESSION_EXPIRED_EVENT, expire)
    window.addEventListener('focus', recheck)
    window.addEventListener('online', recheck)
    document.addEventListener('visibilitychange', recheck)
    // Detect cookie removal in another tab, in addition to the precise expiry timer.
    const interval = setInterval(recheck, 60000)
    void check()
    return () => {
      disposed = true
      clearTimeout(timer)
      clearTimeout(retryTimer)
      clearInterval(interval)
      window.removeEventListener(SESSION_EXPIRED_EVENT, expire)
      window.removeEventListener('focus', recheck)
      window.removeEventListener('online', recheck)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [attempt])
  return { ...state, retry: () => {
    setState({ status: 'checking', error: '' })
    setAttempt(value => value + 1)
  } }
}
