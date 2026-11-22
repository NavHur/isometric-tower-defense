import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { preloadKenneyModels } from './scene/assets/useKenneyModel'
import './styles/global.css'

const root = document.querySelector('#root')
if (!root) throw new Error('index.html has no #root element')

preloadKenneyModels()
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
