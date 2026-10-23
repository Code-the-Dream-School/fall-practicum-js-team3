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

async function main() {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found');
  }
 
  await startMockApiIfEnabled()
  
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter> 
        <AppRoutes />              
      </BrowserRouter> 
    </StrictMode>,
  )
}

main().catch((error) => {
  console.error('Failed to start the application:', error)
})
