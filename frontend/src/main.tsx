import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'   // new: the tool that reads the address
import './index.css'
//import App from './App.tsx'
import AppRoutes from './AppRoutes.tsx'            // changed: was `import App from './App.tsx'`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> 
    <AppRoutes />              
    </BrowserRouter> 
  </StrictMode>,
)
