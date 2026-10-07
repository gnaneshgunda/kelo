import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Support direct URL entry (e.g. typing /admin or /admin/login in the browser URL bar)
if (window.location.pathname && window.location.pathname !== '/' && !window.location.hash) {
  window.location.replace('/#' + window.location.pathname + window.location.search);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
