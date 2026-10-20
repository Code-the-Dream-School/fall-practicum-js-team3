/*
  AppRoutes: decides which page to show for each address in the browser.
    /          -> the existing starter page (App)
    /register  -> the registration page
  /login     -> the sign-in page
*/
import { Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/login' element={<LoginPage />} />
    </Routes>
  )
}