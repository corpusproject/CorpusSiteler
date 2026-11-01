import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { mountCorpusNavbar } from '@corpus/ui-core'

mountCorpusNavbar({ title: 'DevTools Suite', activeApp: 'corpus-devtools' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
