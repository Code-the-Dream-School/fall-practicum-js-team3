/*
  HomeRoute: decides what "/" shows.
  - A visitor (nobody logged in) sees the landing page.
  - A logged-in user sees the editor (App), exactly as before.
  - While a saved login is still being checked it shows "Authenticating...", and if the
    check failed (connection or server problem) it shows nothing, the same as ProtectedRoute.
  ProtectedRoute is not used for "/", because it would send a visitor to /login.
*/
import App from '../../App.tsx'
import LandingPage from '../../pages/LandingPage.tsx'
import { useAuthStore } from '../../hooks/useAuthStore.ts'
import { useShowLanding } from '../../hooks/useShowLanding.ts'

export default function HomeRoute() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const sessionError = useAuthStore((state) => state.sessionError)
  const showLanding = useShowLanding()

  if (showLanding) return <LandingPage />
  if (isLoading) return <p>Authenticating...</p>
  if (sessionError || !user) return null
  return <App />
}

