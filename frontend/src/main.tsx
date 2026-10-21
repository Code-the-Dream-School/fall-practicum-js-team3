import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'   
import './index.css'
import AppRoutes from './AppRoutes.tsx'            


// In development, the fake backend starts first when VITE_USE_MOCKS is 'true'
async function startMockApiIfEnabled() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return
  const { worker } = await import('./mocks/browser.ts')
  await worker.start()
}

startMockApiIfEnabled().then(() => {
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> 
    <AppRoutes />              
    </BrowserRouter> 
  </StrictMode>,
)
})