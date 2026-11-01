/*
  AppRoutes: decides which page to show for each address in the browser.
    /          -> the existing starter page (App)
    /register  -> the registration page
  /login     -> the sign-in page
  When the app starts, it also checks whether a saved login (token) is still valid,
  so a user who reloads the page stays logged in.
*/
import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import Header from './components/Header.tsx'
import { useAuthStore } from './hooks/useAuthStore.ts'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'

export default function AppRoutes() {
  const loadUser = useAuthStore((state) => state.loadUser)

  // Runs once at startup. If the page closes first, the request is cancelled
  useEffect(() => {
    const controller = new AbortController()
    loadUser(controller.signal)
    return () => controller.abort()
  }, [loadUser])
  return (
    <>
      <Header />
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/login' element={<LoginPage />} />
    </Routes>
    </>
  )
}