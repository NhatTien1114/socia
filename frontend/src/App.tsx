import { useState, useEffect } from 'react'
import { APP_ROUTES } from '@/constants/routes'
import { isAuthenticated } from '@/utils/storage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { HomePage } from '@/pages/home/HomePage'

function getPath() {
  return window.location.pathname.toLowerCase()
}

function App() {
  const [path, setPath] = useState(getPath)
  const authenticated = isAuthenticated()
  const isAuthPage = path === APP_ROUTES.LOGIN || path === APP_ROUTES.REGISTER
  const redirect = authenticated && isAuthPage ? APP_ROUTES.HOME
    : !authenticated && !isAuthPage ? APP_ROUTES.LOGIN : null

  useEffect(() => {
    if (redirect) window.location.replace(redirect)
  }, [redirect])

  useEffect(() => {
    function onNav() {
      setPath(getPath())
    }
    window.addEventListener('popstate', onNav)
    return () => window.removeEventListener('popstate', onNav)
  }, [])

  // Chưa đăng nhập → chỉ cho phép /login và /register
  if (redirect) return null
  if (!authenticated) {
    const isRegister = path === APP_ROUTES.REGISTER
    return isRegister ? <RegisterPage /> : <LoginPage />
  }

  // Đã đăng nhập → hiển thị trang chủ
  return <HomePage />
}

export default App
