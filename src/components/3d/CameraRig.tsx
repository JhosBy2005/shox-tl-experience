import { useRef, type RefObject, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '../../animations/scrollProgress'
import { createShoeState, sampleTimeline, type Keyframe } from '../../animations/shoeScrollAnimation'
import { damp } from '../../animations/easing'

interface Props {
  groupRef: RefObject<THREE.Group | null>
  explodeRef: MutableRefObject<number>
  timeline: Keyframe[]
  pointerParallax: boolean
  /** Con reduced-motion se salta la amortiguación y se aterriza en el estado exacto. */
  instant?: boolean
}

/** Radio de la esfera envolvente del modelo ensamblado (largo normalizado = 2). */
const BASE_RADIUS = 1.16
/** Cuánto crece ese radio con el despiece completo. */
const EXPLODED_GROWTH = 0.92
const DEG2RAD = Math.PI / 180

const _target = new THREE.Vector3()
const _origin = new THREE.Vector3(0, 0, 0)

/**
 * Único punto donde se muestrea la timeline por frame.
 *
 * Aplica el estado a la cámara y al grupo del modelo, y publica el escalar de
 * despiece en un ref que ShoeModel lee. Nada de esto pasa por React.
 */
export function CameraRig({ groupRef, explodeRef, timeline, pointerParallax, instant = false }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const state = useRef(createShoeState())
  const px = useRef(0)
  const py = useRef(0)

  useFrame((_, delta) => {
    // Delta acotado: al volver de una pestaña en segundo plano llega un delta
    // enorme y sin este tope la escena da un salto brusco.
    const dt = Math.min(delta, 0.05)
    const s = sampleTimeline(scrollState.progress, timeline, state.current)

    explodeRef.current = s.explode

    /* ── Encuadre automático ──────────────────────────────────────────────
       En vez de fiar el encuadre a valores fijos, se calcula la distancia
       mínima a la que el objeto cabe con el fov y el aspect REALES. Así el
       mismo storyboard funciona en 21:9 y en un móvil en vertical, y la
       cámara se aleja sola cuando el despiece hace crecer el conjunto.      */
    const aspect = size.width / Math.max(1, size.height)
    const vFov = s.fov * DEG2RAD
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
    const minFov = Math.min(vFov, hFov)
    const radius = BASE_RADIUS + s.explode * EXPLODED_GROWTH
    const needed = radius / Math.sin(minFov / 2)
    const z = Math.max(s.cameraPos.z, needed)

    // Parallax de puntero: rango pequeño y muy amortiguado. Debe percibirse
    // como que la escena respira, no como que la cámara obedece al ratón.
    if (pointerParallax) {
      px.current = damp(px.current, scrollState.pointerX, 0.35, dt)
      py.current = damp(py.current, scrollState.pointerY, 0.35, dt)
    } else {
      px.current = 0
      py.current = 0
    }

    _target.set(s.cameraPos.x + px.current * 0.34, s.cameraPos.y - py.current * 0.2, z)

    if (instant) {
      camera.position.copy(_target)
    } else {
      camera.position.x = damp(camera.position.x, _target.x, 0.14, dt)
      camera.position.y = damp(camera.position.y, _target.y, 0.14, dt)
      camera.position.z = damp(camera.position.z, _target.z, 0.14, dt)
    }
    camera.lookAt(_origin)

    if (Math.abs(camera.fov - s.fov) > 0.01) {
      camera.fov = instant ? s.fov : damp(camera.fov, s.fov, 0.14, dt)
      camera.updateProjectionMatrix()
    }

    const group = groupRef.current
    if (!group) return

    if (instant) {
      group.quaternion.copy(s.quaternion)
      group.position.copy(s.position)
      group.scale.setScalar(s.scale)
      return
    }

    // Slerp amortiguado hacia el objetivo: un scroll a tirones se lee fluido,
    // y al soltar la rueda la zapatilla sigue girando un instante y frena.
    const k = 1 - Math.exp(-dt / 0.11)
    group.quaternion.slerp(s.quaternion, k)
    group.position.x = damp(group.position.x, s.position.x, 0.11, dt)
    group.position.y = damp(group.position.y, s.position.y, 0.11, dt)
    group.position.z = damp(group.position.z, s.position.z, 0.11, dt)
    const sc = damp(group.scale.x, s.scale, 0.11, dt)
    group.scale.setScalar(sc)
  })

  return null
}
