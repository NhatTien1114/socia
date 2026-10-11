export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '/socia/v1').replace(/\/$/, '')
export const SESSION_EXPIRED_EVENT = 'socia:session-expired'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type Csrf = { token: string; headerName: string }
let csrfRequest: Promise<Csrf> | undefined
export function resetCsrf() { csrfRequest = undefined }
export function notifySessionExpired() {
  resetCsrf()
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

async function csrfToken(): Promise<Csrf> {
  if (!csrfRequest) {
    const pending = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
        credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) throw new ApiError('Không lấy được mã bảo vệ yêu cầu. Vui lòng thử lại.', response.status)
      const data = await response.json()
      if (typeof data.token !== 'string' || !data.token || data.headerName !== 'X-XSRF-TOKEN') {
        throw new Error('Máy chủ chưa được cấu hình xác thực bằng cookie.')
      }
      return data as Csrf
    })()
    csrfRequest = pending
    pending.catch(() => { if (csrfRequest === pending) resetCsrf() })
  }
  return csrfRequest
}

type Options = RequestInit & { publicRequest?: boolean }

// The browser owns the HttpOnly authentication cookie. JavaScript never reads it.
export async function apiRequest<T>(path: string, options: Options = {}): Promise<T> {
  const { publicRequest = false, ...init } = options
  const method = (init.method ?? 'GET').toUpperCase()
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  for (let attempt = 0; attempt < 2; attempt++) {
    const headers = new Headers(init.headers)
    if (unsafe) {
      const csrf = await csrfToken()
      headers.set(csrf.headerName, csrf.token)
    }
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init, method, headers, credentials: 'include', cache: 'no-store',
        signal: init.signal ?? AbortSignal.timeout(15000),
      })
    } catch (error) {
      if (init.signal?.aborted) throw error
      throw new Error('Không kết nối được máy chủ hoặc yêu cầu quá thời gian. Vui lòng thử lại.', { cause: error })
    }
    if (response.status === 401 && !publicRequest) notifySessionExpired()
    const data = response.status === 204 ? null : await response.json().catch(() => null)
    // Retry only an explicit CSRF rejection: the server has not executed the operation.
    if (unsafe && attempt === 0 && response.status === 403 && data?.code === 'CSRF_INVALID') {
      resetCsrf()
      continue
    }
    if (!response.ok) throw new ApiError(
      response.status === 401 && !publicRequest ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        : response.status === 413 ? 'Ảnh không được vượt quá 4 MB.'
        : data?.message ?? data?.detail ?? 'Không thể thực hiện yêu cầu.', response.status,
    )
    return data as T
  }
  throw new Error('Không thể xác minh yêu cầu. Vui lòng tải lại trang.')
}
