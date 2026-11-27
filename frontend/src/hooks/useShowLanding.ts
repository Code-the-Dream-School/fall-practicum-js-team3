/*
  useShowLanding: says whether the landing page should be shown at "/".
  The landing page is for visitors only.
  - Shown: nobody is logged in, and either the startup check is finished or there is
    no saved login to wait for (so there is nothing to check).
  - Not shown: a user is logged in, a saved login is still being checked, or the saved
    login could not be checked (connection or server problem). In that last case the
    Header keeps showing the error and the 'Try again' button.
*/
import { useAuthStore } from './useAuthStore.ts'

export function useShowLanding(): boolean {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isLoading = useAuthStore((state) => state.isLoading)
  const sessionError = useAuthStore((state) => state.sessionError)
  return !user && !sessionError && (!isLoading || !token)
}