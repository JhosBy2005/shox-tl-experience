import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'

/**
 * Contador de carga a tamaño de titular.
 *
 * Se desmonta del árbol tras la salida, no sólo se oculta: un overlay a
 * pantalla completa con opacity 0 sigue interceptando el puntero.
 */
export function Loader() {
  const { progress, active } = useProgress()
  const [gone, setGone] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const shown = useRef(performance.now())

  useEffect(() => {
    if (active || progress < 100) return
    // Mínimo en pantalla: si el modelo entra de caché, un flash de 40 ms
    // se percibe como un parpadeo, no como una carga.
    const elapsed = performance.now() - shown.current
    const wait = Math.max(0, 420 - elapsed)
    const t1 = setTimeout(() => setLeaving(true), wait)
    const t2 = setTimeout(() => setGone(true), wait + 700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [active, progress])

  if (gone) return null

  return (
    <div className={`loader ${leaving ? 'is-leaving' : ''}`} role="status" aria-live="polite">
      <span className="loader__count">{String(Math.round(progress)).padStart(3, '0')}</span>
      <span className="u-mono loader__label">Cargando modelo</span>
      <span className="loader__track" aria-hidden="true">
        <span className="loader__bar" style={{ transform: `scaleX(${progress / 100})` }} />
      </span>
    </div>
  )
}
