import { useMemo } from 'react'
import { MQ } from '../config/breakpoints'
import { useMediaQuery } from './useMediaQuery'

export type Tier = 'high' | 'mid' | 'low'

export interface DeviceProfile {
  tier: Tier
  /** Rango de device pixel ratio que se le pasa al <Canvas>. */
  dpr: [number, number]
  /** GLB a cargar. */
  modelUrl: string
  /** Parallax de puntero (sólo con ratón real). */
  pointerParallax: boolean
  reducedMotion: boolean
  isDesktop: boolean
  isTablet: boolean
  webgl: boolean
}

/** Una sola prueba de contexto WebGL, cacheada. Crearlo dos veces es caro. */
let webglSupport: boolean | null = null
function detectWebGL(): boolean {
  if (webglSupport !== null) return webglSupport
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    webglSupport = Boolean(gl)
    // Liberar el contexto: si no, se queda ocupando uno de los ~16 disponibles.
    const lose = (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')
    lose?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}

/**
 * Clasifica el dispositivo ANTES de montar la escena, para no arrancar
 * un pipeline que el aparato no puede sostener y luego degradarlo a la vista.
 */
export function useDeviceTier(): DeviceProfile {
  const isDesktop = useMediaQuery(MQ.desktop)
  const isTablet = useMediaQuery(MQ.tablet)
  const finePointer = useMediaQuery(MQ.finePointer)
  const reducedMotion = useMediaQuery(MQ.reducedMotion)

  return useMemo(() => {
    const webgl = typeof window !== 'undefined' && detectWebGL()
    const cores = navigator.hardwareConcurrency ?? 4
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4

    let tier: Tier = 'mid'
    if (isDesktop && cores >= 8 && memory >= 8) tier = 'high'
    else if (!isTablet && (cores <= 4 || memory <= 4)) tier = 'low'

    if (!webgl) tier = 'low'

    return {
      tier,
      dpr: tier === 'high' ? [1, 2] : tier === 'mid' ? [1, 1.5] : [1, 1],
      modelUrl: tier === 'high' ? '/models/shoe.glb' : '/models/shoe-lite.glb',
      pointerParallax: finePointer && isDesktop && !reducedMotion,
      reducedMotion,
      isDesktop,
      isTablet,
      webgl,
    }
  }, [isDesktop, isTablet, finePointer, reducedMotion])
}
