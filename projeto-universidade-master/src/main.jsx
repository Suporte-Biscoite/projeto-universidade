import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// IMPORTAR O PROVIDER (O motor da foto de perfil)
import { ProfileProvider } from './context/ProfileContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* O ProfileProvider deve "abraçar" o App */}
    <ProfileProvider>
      <App />
    </ProfileProvider>
  </StrictMode>,
)