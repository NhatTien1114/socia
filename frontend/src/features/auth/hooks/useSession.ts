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
    let disposed = false, version = 0, checking = false, authenticated = false
    let timer: ReturnType<typeof setTimeout> | undefined
    function expire() {
      version++
      authenticated = false
      clearTimeout(timer)
      if (!disposed) setState({ status: 'anonymous', error: '' })
    }
    async function check() {
      if (checking || disposed) return
      checking = true
      const current = version
      try {
        const session = await getSession()
        if (disposed || current !== version) return
        const remaining = session.deadline - Date.now()
        if (remaining <= 0) { expire(); return }
        authenticated = true
        setState({ status: 'authenticated', error: '' })
        clearTimeout(timer)
        timer = setTimeout(expire, Math.min(remaining, 2_147_483_647))
      } catch (error) {
        if (disposed || current !== version) return
        if (error instanceof ApiError && error.status === 401) expire()
        else if (!authenticated) setState({ status: 'error', error: error instanceof Error ? error.message : 'Không kiểm tra được phiên đăng nhập.' })
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
      clearInterval(interval)
      window.removeEventListener(SESSION_EXPIRED_EVENT, expire)
      window.removeEventListener('focus', recheck)
      window.removeEventListener('online', recheck)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [attempt])
  return { ...state, retry: () => setAttempt(value => value + 1) }
}
