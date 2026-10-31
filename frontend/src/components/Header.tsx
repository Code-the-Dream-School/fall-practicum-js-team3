/*
  Header: the top bar shown on every page.
  - Logged in: the user's name and a 'Log out' button.
  - Logged out: links to sign in or create an account.
  - The saved login could not be checked (no connection or server problem): the reason and a 'Try again' button.
  - While the app is still checking a saved login at startup: nothing on the right side,
    so the links do not flash for a moment before the name appears.
*/
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'

export default function Header() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const sessionError = useAuthStore((state) => state.sessionError)
  const loadUser = useAuthStore((state) => state.loadUser)
  const logout = useAuthStore((state) => state.logout)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className='app-header'>
      <Link to='/'>BlockCAD</Link>
      <nav>
        {user ? (
          <>
            <span>Hello, {user.name}</span>
            <button type='button' onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          !isLoading && (
            sessionError ? (
              <>
                <span role='alert'>{sessionError}</span>{' '}
                <button type='button' onClick={() => loadUser()}>
                  Try again
                </button>
              </>
            ) : (
              <>
                <Link to='/login'>Sign in</Link>{'   '}
                <Link to='/register'>Create account</Link>
              </>
            )
          )
        )}
      </nav>
    </header>
  )
}