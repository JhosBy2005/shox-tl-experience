import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'

/** /?lab abre el banco de pruebas del modelo sin arrastrar la experiencia entera. */
const isLab = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('lab')

const ModelLab = lazy(() => import('./ModelLab').then((m) => ({ default: m.ModelLab })))
const App = lazy(() => import('./App').then((m) => ({ default: m.App })))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>{isLab ? <ModelLab /> : <App />}</Suspense>
  </StrictMode>
)
