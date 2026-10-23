/*
  AppRoutes: decides which page to show for each address in the browser.
    /          -> the existing starter page (App)
    /register  -> the registration page
  The /login route will be added here in TEAM3-34.
*/
import { Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import RegisterPage from './pages/RegisterPage.tsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='/register' element={<RegisterPage />} />
    </Routes>
  )
}