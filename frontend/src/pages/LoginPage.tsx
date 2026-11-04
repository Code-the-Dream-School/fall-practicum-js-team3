/*
  LoginPage: the screen at the /login address.
  It arranges the heading, the sign-in form and a link to the registration page.
  The form itself (fields, checks, sending the data) is in LoginForm.tsx.
  After a successful registration the user arrives here with a short notice.
*/
import { Link, useLocation } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  const location = useLocation()
  // RegisterForm sends { registered: true } when it moves the user here
  const justRegistered = Boolean(location.state?.registered)

  return (
    <main className='auth-page'>
      <h1>Welcome back</h1>
      {justRegistered && <p role='status'>Account created. Please sign in.</p>}
      <LoginForm />
      <p>
        New here? <Link to='/register'>Create account</Link>
      </p>
    </main>
  )
}