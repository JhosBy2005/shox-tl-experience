/**
 * Perfiles parametricos de la horma.
 *
 * Sistema de coordenadas (unidades "de zapatilla", antes de normalizar):
 *   +X = puntera, -X = talon   |   +Y = arriba (suelo en y=0)   |   +-Z = ancho
 *
 * Todo el objeto se describe con curvas 1D muestreadas en t en [0,1],
 * donde t=0 es el extremo del talon y t=1 la punta.
 * Cambiar la silueta = cambiar numeros en estas tablas. Nada mas.
 */

export const X_HEEL = -1.35
export const X_TOE = 1.35
export const LENGTH = X_TOE - X_HEEL

export const xOf = (t) => X_HEEL + t * LENGTH

/** Catmull-Rom 1D sobre puntos [t, valor] ordenados por t. */
export function curve(pts) {
  return (t) => {
    const n = pts.length
    if (t <= pts[0][0]) return pts[0][1]
    if (t >= pts[n - 1][0]) return pts[n - 1][1]
    let i = 0
    while (i < n - 2 && t > pts[i + 1][0]) i++
    const p0 = pts[Math.max(0, i - 1)][1]
    const p1 = pts[i][1]
    const p2 = pts[i + 1][1]
    const p3 = pts[Math.min(n - 1, i + 2)][1]
    const u = (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
    const u2 = u * u
    const u3 = u2 * u
    return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3)
  }
}

/* ---- Huella (planta): suela, mediasuela y plantilla --------------------- */
export const footHalfWidth = curve([
  [0.00, 0.06], [0.02, 0.22], [0.05, 0.32], [0.10, 0.39],
  [0.18, 0.43], [0.32, 0.385], [0.44, 0.355], [0.58, 0.40],
  [0.70, 0.47], [0.80, 0.495], [0.90, 0.455], [0.96, 0.35], [1.00, 0.08],
])

/* ---- Upper: media anchura de la seccion -------------------------------- */
export const upperHalfWidth = curve([
  [0.000, 0.05], [0.012, 0.17], [0.030, 0.27], [0.060, 0.335],
  [0.110, 0.375], [0.180, 0.395], [0.300, 0.360], [0.440, 0.340],
  [0.580, 0.380], [0.700, 0.440], [0.800, 0.462], [0.880, 0.450],
  [0.940, 0.415], [0.975, 0.315], [1.000, 0.05],
])

/**
 * Linea inferior del upper = cara superior de la mediasuela.
 * 0.44 en talon -> 0.315 en antepie. Esa diferencia ES el drop.
 */
export const upperBottom = curve([
  [0.000, 0.505], [0.020, 0.485], [0.050, 0.472], [0.150, 0.442],
  [0.350, 0.405], [0.550, 0.355], [0.750, 0.315], [0.880, 0.315],
  [0.950, 0.335], [1.000, 0.395],
])

/** Apice de la seccion. Donde la boca esta cerrada (pala, puntera) es el techo real. */
export const upperTop = curve([
  [0.000, 0.95], [0.020, 1.16], [0.050, 1.28], [0.100, 1.33],
  [0.180, 1.27], [0.290, 1.13], [0.400, 1.02], [0.520, 0.945],
  [0.640, 0.815], [0.720, 0.755], [0.820, 0.710], [0.910, 0.672],
  [0.960, 0.620], [1.000, 0.52],
])

/**
 * Altura del canto de la boca como fraccion de la seccion:
 * 0 = a ras del suelo de la horma, 1 = seccion cerrada.
 * Controla DIRECTAMENTE lo que se ve: hueco del tobillo, garganta y pala.
 */
export const upperOpenFrac = curve([
  [0.000, 1.00], [0.035, 0.93], [0.080, 0.755], [0.130, 0.715],
  [0.180, 0.755], [0.240, 0.835], [0.310, 0.882], [0.420, 0.897],
  [0.520, 0.902], [0.600, 0.930], [0.665, 0.985], [0.710, 1.00],
  [1.000, 1.00],
])

/** Exponente de la superelipse: seccion cuadrada en talon, redonda en punta. */
export const upperExpo = curve([
  [0.00, 3.1], [0.30, 2.9], [0.65, 2.6], [1.00, 2.3],
])

/**
 * theta maximo derivado de upperOpenFrac. PI = cerrada.
 *
 * Invirtiendo la superelipse:  rimY = bottom + f*(top-bottom)  y
 * rimY = yc - h*sign(cos)*|cos|^(2/n)  =>  cos(thetaMax) = sign(k)*|k|^(n/2)
 * con k = 1 - 2f.  Asi el canto cae donde yo digo, no donde salga.
 */
export function upperOpening(t) {
  const f = Math.min(1, Math.max(0, upperOpenFrac(t)))
  const k = 1 - 2 * f
  if (Math.abs(k) >= 1) return k > 0 ? 0 : Math.PI
  const n = upperExpo(t)
  const c = Math.sign(k) * Math.pow(Math.abs(k), n / 2)
  return Math.acos(Math.min(1, Math.max(-1, c)))
}

/* ---- Stack vertical de la entresuela ----------------------------------- */
/** Cara superior de la suela exterior = base de las columnas. */
export const outsoleTop = curve([
  [0.00, 0.075], [0.20, 0.070], [0.55, 0.060], [0.85, 0.052], [1.00, 0.062],
])
/** Cara inferior de la placa de mediasuela = cabeza de las columnas. */
export const plateBottom = curve([
  [0.00, 0.355], [0.18, 0.345], [0.45, 0.300], [0.72, 0.245], [1.00, 0.250],
])

/** Estaciones de las 12 columnas (6 pares medial/lateral). */
export const PILLAR_STATIONS = [0.100, 0.245, 0.395, 0.545, 0.700, 0.850]

/**
 * Punto de la superficie del upper.
 * theta: 0 = centro inferior, +-PI = centro superior. inset empuja hacia dentro.
 */
export function upperPoint(t, theta, inset = 0) {
  const w = Math.max(0.004, upperHalfWidth(t) - inset)
  const bottom = upperBottom(t)
  const top = upperTop(t)
  const yc = (bottom + top) / 2
  const h = Math.max(0.004, (top - bottom) / 2 - inset)
  const n = upperExpo(t)
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const e = 2 / n
  return [
    xOf(t),
    yc - h * Math.sign(c) * Math.pow(Math.abs(c), e),
    w * Math.sign(s) * Math.pow(Math.abs(s), e),
  ]
}
