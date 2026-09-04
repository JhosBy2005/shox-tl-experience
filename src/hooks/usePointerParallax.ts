import { useEffect } from 'react'
import { scrollState } from '../animations/scrollProgress'

/**
 * Parallax de puntero. Escribe directamente en scrollState — igual que el
 * scroll, no pasa por React.
 *
 * Sólo con ratón real: en táctil el "puntero" es el dedo que está haciendo
 * scroll, y acoplarlo a la rotación produce un temblor constante.
 */
export function usePointerParallax(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      scrollState.pointerX = 0
      scrollState.pointerY = 0
      return
    }
    const onMove = (e: PointerEvent) => {
      scrollState.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      scrollState.pointerY = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onLeave = () => {
      scrollState.pointerX = 0
      scrollState.pointerY = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      scrollState.pointerX = 0
      scrollState.pointerY = 0
    }
  }, [enabled])
}
