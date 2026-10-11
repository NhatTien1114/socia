// Migration cleanup only. Authentication is now owned by an HttpOnly cookie.
export function clearLegacyAccessToken(): void {
  try { localStorage.removeItem('socia_access_token') } catch { /* Storage can be disabled. */ }
}
