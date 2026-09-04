import * as THREE from 'three'
import { clamp01, lerp, smoothstep } from './easing'

/**
 * LA COREOGRAFÍA COMPLETA, EN UNA TABLA.
 *
 * Toda la experiencia la conduce un solo número: `progress` ∈ [0,1].
 * GSAP no toca ni un objeto 3D — sólo escribe ese número. La escena lo lee en
 * useFrame y muestrea esta tabla. Consecuencias:
 *
 *   · Cero re-renders de React durante el scroll.
 *   · El scrub es reversible por construcción: no hay estado acumulado.
 *   · Reeditar la película = reordenar este array.
 *
 * Orientación del modelo: la puntera apunta a +X, la cámara mira desde +Z.
 *   rotation.y =  0      → lateral
 *   rotation.y = -PI/2   → frontal (puntera hacia cámara)
 *   rotation.y = -3PI/2  → trasera
 *   rotation.x = +PI/2   → cenital (planta arriba)
 *   rotation.x = -PI/2   → suela
 *
 * La Y decrece de forma monótona a lo largo de toda la timeline: es UNA
 * revolución continua, no idas y venidas. Por eso el slerp nunca elige un
 * atajo inesperado — cada salto entre keyframes es menor que PI.
 */

export interface Keyframe {
  at: number
  rotation: [number, number, number]
  position: [number, number, number]
  scale: number
  /** 0 = ensamblada · 1 = despiece máximo. */
  explode: number
  camera: { pos: [number, number, number]; fov: number }
}

export const TIMELINE_DESKTOP: Keyframe[] = [
  // 01 — Hero. Flotando, 3/4.
  { at: 0.0, rotation: [0.1, 0.58, -0.03], position: [0, 0.04, 0], scale: 0.88, explode: 0,
    camera: { pos: [0, 0.2, 4.5], fov: 30 } },
  // 02 — Lateral puro. La silueta se vuelve un perfil gráfico.
  { at: 0.1, rotation: [0.02, 0.02, 0], position: [0, 0, 0], scale: 1.04, explode: 0,
    camera: { pos: [0, 0.08, 4.15], fov: 29 } },
  // 03 — Frontal. Se lee el ancho de la puntera.
  { at: 0.23, rotation: [0.05, -1.571, 0], position: [0, 0, 0], scale: 1.02, explode: 0,
    camera: { pos: [0, 0.05, 4.0], fov: 30 } },
  // (tránsito por el lateral opuesto)
  { at: 0.33, rotation: [0.04, -2.5, 0], position: [0, 0.01, 0], scale: 1, explode: 0,
    camera: { pos: [0, 0.1, 4.2], fov: 30 } },
  // 04 — Trasera. La torre de columnas, de frente.
  { at: 0.4, rotation: [0.03, -4.712, 0], position: [0, 0, 0], scale: 1.03, explode: 0,
    camera: { pos: [0, 0.06, 4.05], fov: 30 } },
  // 05 — Cenital. Planta, lengüeta y cordaje.
  { at: 0.5, rotation: [1.42, -5.15, 0], position: [0, 0, 0], scale: 1, explode: 0,
    camera: { pos: [0, 0.02, 4.25], fov: 30 } },
  // (medio giro: la zapatilla rueda sobre su eje longitudinal)
  { at: 0.55, rotation: [0.02, -5.35, 0], position: [0, 0, 0], scale: 1, explode: 0,
    camera: { pos: [0, 0.02, 4.3], fov: 30 } },
  // 06 — Suela. Luz rasante sobre las barras de tracción.
  { at: 0.6, rotation: [-1.42, -5.55, 0], position: [0, 0, 0], scale: 1, explode: 0,
    camera: { pos: [0, 0.02, 4.25], fov: 30 } },
  // 07 — 3/4 posterior. Pausa respiratoria antes del despiece.
  { at: 0.68, rotation: [0.12, -6.05, 0.02], position: [0, 0.02, 0], scale: 0.98, explode: 0,
    camera: { pos: [0, 0.15, 4.5], fov: 30 } },
  // 08 — DESPIECE. La cámara retrocede y sube para abarcar la columna de piezas.
  { at: 0.735, rotation: [0.14, -6.2, 0.02], position: [0, -0.05, 0], scale: 0.95, explode: 0.12,
    camera: { pos: [0, 0.35, 5.4], fov: 31 } },
  { at: 0.82, rotation: [0.16, -6.45, 0.02], position: [0, -0.12, 0], scale: 0.92, explode: 1,
    camera: { pos: [0.2, 0.6, 7.3], fov: 32 } },
  // 09 — Hold: el usuario controla el grado de separación.
  { at: 0.865, rotation: [0.16, -6.6, 0.02], position: [0, -0.12, 0], scale: 0.92, explode: 1,
    camera: { pos: [-0.2, 0.6, 7.4], fov: 32 } },
  // 10 — REENSAMBLADO. Vuelve a cerrar.
  { at: 0.94, rotation: [0.13, -6.78, 0.01], position: [0, -0.02, 0], scale: 0.97, explode: 0.08,
    camera: { pos: [0, 0.28, 5.1], fov: 30 } },
  // 11 — Hero final: más cerca y desde algo más abajo. Ángulo heroico.
  { at: 1.0, rotation: [-0.04, -6.88, -0.02], position: [0, 0.02, 0], scale: 1.06, explode: 0,
    camera: { pos: [0, -0.12, 3.85], fov: 28 } },
]

/**
 * Móvil: menos paradas y sin el volteo a suela.
 * En una pantalla de 6" ese giro completo desorienta y obliga a alejar tanto
 * la cámara que la zapatilla queda diminuta. Se sacrifica a propósito.
 */
export const TIMELINE_MOBILE: Keyframe[] = [
  { at: 0.0, rotation: [0.1, 0.55, -0.03], position: [0, 0.02, 0], scale: 1, explode: 0,
    camera: { pos: [0, 0.15, 5.2], fov: 32 } },
  { at: 0.16, rotation: [0.02, 0.02, 0], position: [0, 0, 0], scale: 1.02, explode: 0,
    camera: { pos: [0, 0.06, 4.9], fov: 32 } },
  { at: 0.34, rotation: [0.05, -1.571, 0], position: [0, 0, 0], scale: 1, explode: 0,
    camera: { pos: [0, 0.04, 4.7], fov: 32 } },
  { at: 0.5, rotation: [0.04, -4.712, 0], position: [0, 0, 0], scale: 1.02, explode: 0,
    camera: { pos: [0, 0.05, 4.8], fov: 32 } },
  { at: 0.62, rotation: [1.32, -5.1, 0], position: [0, 0, 0], scale: 0.98, explode: 0,
    camera: { pos: [0, 0.02, 5.0], fov: 32 } },
  // El despiece sube: en vertical la lista de componentes ocupa la mitad
  // inferior y con el modelo centrado se pisaban.
  { at: 0.72, rotation: [0.12, -5.7, 0], position: [0, 0.34, 0], scale: 0.92, explode: 0.1,
    camera: { pos: [0, 0.5, 5.6], fov: 32 } },
  { at: 0.83, rotation: [0.14, -5.95, 0], position: [0, 0.72, 0], scale: 0.8, explode: 0.48,
    camera: { pos: [0, 1.0, 6.6], fov: 34 } },
  { at: 0.87, rotation: [0.14, -6.05, 0], position: [0, 0.72, 0], scale: 0.8, explode: 0.48,
    camera: { pos: [0, 1.0, 6.7], fov: 34 } },
  { at: 0.95, rotation: [0.12, -6.2, 0], position: [0, 0.05, 0], scale: 0.96, explode: 0.06,
    camera: { pos: [0, 0.22, 5.4], fov: 32 } },
  { at: 1.0, rotation: [-0.02, -6.3, -0.01], position: [0, 0.02, 0], scale: 1.02, explode: 0,
    camera: { pos: [0, -0.06, 4.9], fov: 31 } },
]

export interface ShoeState {
  quaternion: THREE.Quaternion
  position: THREE.Vector3
  scale: number
  explode: number
  cameraPos: THREE.Vector3
  fov: number
}

export function createShoeState(): ShoeState {
  return {
    quaternion: new THREE.Quaternion(),
    position: new THREE.Vector3(),
    scale: 1,
    explode: 0,
    cameraPos: new THREE.Vector3(),
    fov: 30,
  }
}

/** Los cuaterniones se precalculan una vez: convertir euler en cada frame es puro desperdicio. */
const quatCache = new WeakMap<Keyframe[], THREE.Quaternion[]>()

function quaternionsFor(kfs: Keyframe[]): THREE.Quaternion[] {
  let cached = quatCache.get(kfs)
  if (!cached) {
    const euler = new THREE.Euler()
    cached = kfs.map((k) => new THREE.Quaternion().setFromEuler(euler.set(...k.rotation, 'XYZ')))
    quatCache.set(kfs, cached)
  }
  return cached
}

// Objetos reutilizados: cero asignaciones por frame, cero presión sobre el GC.
const _qa = new THREE.Quaternion()
const _qb = new THREE.Quaternion()

/**
 * Muestrea la timeline en `p` y escribe el resultado en `out`.
 * Función pura respecto al scroll: el mismo p siempre da el mismo estado.
 */
export function sampleTimeline(p: number, kfs: Keyframe[], out: ShoeState): ShoeState {
  const t = clamp01(p)
  const quats = quaternionsFor(kfs)

  let i = 0
  while (i < kfs.length - 2 && t > kfs[i + 1].at) i++

  const a = kfs[i]
  const b = kfs[i + 1] ?? a
  const span = b.at - a.at
  const raw = span > 0 ? clamp01((t - a.at) / span) : 0
  // Smoothstep en el tramo: quita el pico de aceleración al cruzar keyframes.
  const k = smoothstep(raw)

  // Rotación por slerp de cuaterniones, NO lerp de ángulos de Euler.
  // Con euler, cruzar la vista cenital o la suela produce un salto de gimbal.
  _qa.copy(quats[i])
  _qb.copy(quats[i + 1] ?? quats[i])
  out.quaternion.slerpQuaternions(_qa, _qb, k)

  out.position.set(
    lerp(a.position[0], b.position[0], k),
    lerp(a.position[1], b.position[1], k),
    lerp(a.position[2], b.position[2], k)
  )
  out.scale = lerp(a.scale, b.scale, k)
  out.explode = lerp(a.explode, b.explode, k)
  out.cameraPos.set(
    lerp(a.camera.pos[0], b.camera.pos[0], k),
    lerp(a.camera.pos[1], b.camera.pos[1], k),
    lerp(a.camera.pos[2], b.camera.pos[2], k)
  )
  out.fov = lerp(a.camera.fov, b.camera.fov, k)

  return out
}
