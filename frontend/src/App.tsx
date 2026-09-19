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

  useEffect(() => {
    function onNav() {
      setPath(getPath())
    }
    window.addEventListener('popstate', onNav)
    return () => window.removeEventListener('popstate', onNav)
  }, [])

  // Chưa đăng nhập → chỉ cho phép /login và /register
  if (!isAuthenticated()) {
    const isRegister = path === APP_ROUTES.REGISTER
    // Nếu truy cập bất kỳ trang nào khác → redirect về /login
    if (!isRegister && path !== APP_ROUTES.LOGIN) {
      window.location.href = APP_ROUTES.LOGIN
      return null
    }
    return isRegister ? <RegisterPage /> : <LoginPage />
  }

  // Đã đăng nhập → nếu vào /login hoặc /register thì redirect về trang chủ
  if (path === APP_ROUTES.LOGIN || path === APP_ROUTES.REGISTER) {
    window.location.href = APP_ROUTES.HOME
    return null
  }

  // Đã đăng nhập → hiển thị trang chủ
  return <HomePage />
}

export default App
