import { AuthPage } from './components/auth/AuthPage'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'

function App() {
  const isRegisterPage = window.location.pathname.toLowerCase() === '/register'

  return (
    <AuthPage mode={isRegisterPage ? 'register' : 'login'}>
      {isRegisterPage ? <RegisterForm /> : <LoginForm />}
    </AuthPage>
  )
}

export default App
