/** Curvas compartidas. Las mismas que los tokens CSS, para que UI y 3D coincidan. */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Interpolación suave entre keyframes: sin tirones al cruzar de uno a otro. */
export const smoothstep = (t: number) => t * t * (3 - 2 * t)

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInCubic = (t: number) => t * t * t
export const easeInOutExpo = (t: number) =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2

/**
 * Amortiguación exponencial independiente del framerate.
 * A 30fps y a 144fps converge igual — con un lerp fijo no.
 */
export const damp = (current: number, target: number, smoothing: number, delta: number) =>
  smoothing <= 0 ? target : current + (target - current) * (1 - Math.exp(-delta / smoothing))

/** Normaliza v dentro de [a,b] a [0,1]. */
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a))
