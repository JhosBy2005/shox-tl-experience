import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { asset } from '../../config/assets'
import { createMaterials, disposeMaterials, type MaterialKey } from './materials'

/** Contrato con build-model.mjs: estos seis nombres existen como nodos en el GLB. */
export const PART_NAMES = ['laces', 'tongue', 'upper', 'insole', 'midsole', 'outsole'] as const
export type PartName = (typeof PART_NAMES)[number]

export const PART_LABELS: Record<PartName, { es: string; spec: string }> = {
  laces: { es: 'Cordones', spec: 'Poliéster trenzado plano' },
  tongue: { es: 'Lengüeta', spec: 'Mesh acolchado 6 mm' },
  upper: { es: 'Upper + cage', spec: 'Mesh técnico / TPU termosellado' },
  insole: { es: 'Plantilla', spec: 'Espuma moldeada extraíble' },
  midsole: { es: 'Mediasuela', spec: '12 columnas Shox · placa Pebax' },
  outsole: { es: 'Suela exterior', spec: 'Caucho BRS 1000' },
}

interface PartRig {
  name: PartName
  object: THREE.Object3D
  /** Vector de separación leído de los extras del GLB. */
  explode: THREE.Vector3
  /** Retardo relativo: las piezas no se separan a la vez, se escalonan. */
  delay: number
  base: THREE.Vector3
}

interface Props {
  url: string
  /** Getter en vez de prop: el scroll escribe sin provocar re-render de React. */
  getExplode: () => number
  /** Amortiguación del despiece. 0 = instantáneo. */
  damping?: number
}

/**
 * Carga el GLB, mapea los seis componentes y aplica los materiales.
 *
 * Todo el movimiento ocurre en useFrame leyendo getExplode(). React no
 * re-renderiza durante el scroll: es la diferencia entre 60fps y 24.
 */
export function ShoeModel({ url, getExplode, damping = 0.12 }: Props) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)
  const materials = useMemo(() => createMaterials(), [])
  const current = useRef(0)

  /** Clon aislado: useGLTF cachea la escena y dos instancias compartirían nodos. */
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = false
        mesh.receiveShadow = false
        mesh.frustumCulled = false
        const key = (mesh.material as THREE.Material)?.name as MaterialKey
        if (key && key in materials) mesh.material = materials[key]
      }
    })
    return clone
  }, [scene, materials])

  const parts = useMemo<PartRig[]>(() => {
    const found: PartRig[] = []
    for (const name of PART_NAMES) {
      const object = model.getObjectByName(name)
      if (!object) {
        console.warn(`[ShoeModel] falta el nodo "${name}" en ${url}`)
        continue
      }
      const raw = (object.userData?.explode as number[] | undefined) ?? [0, 0, 0]
      found.push({
        name,
        object,
        explode: new THREE.Vector3(raw[0], raw[1], raw[2]),
        delay: (object.userData?.explodeDelay as number | undefined) ?? 0,
        base: object.position.clone(),
      })
    }
    return found
  }, [model, url])

  useLayoutEffect(() => {
    if (parts.length !== PART_NAMES.length) {
      console.warn(`[ShoeModel] ${parts.length}/${PART_NAMES.length} componentes localizados`)
    }
  }, [parts])

  useEffect(() => () => disposeMaterials(materials), [materials])

  useFrame((_, delta) => {
    const target = getExplode()
    // Amortiguación exponencial independiente del framerate.
    const k = damping > 0 ? 1 - Math.exp(-delta / damping) : 1
    current.current += (target - current.current) * k
    const e = current.current

    for (const part of parts) {
      // Cada pieza arranca su separación en un momento distinto y la completa
      // dentro del rango restante: el despiece se lee como una secuencia.
      const local = Math.min(1, Math.max(0, (e - part.delay) / (1 - part.delay)))
      // Ease-out cúbico: sale rápido y frena, como si tuviera masa.
      const eased = 1 - Math.pow(1 - local, 3)
      part.object.position.set(
        part.base.x + part.explode.x * eased,
        part.base.y + part.explode.y * eased,
        part.base.z + part.explode.z * eased
      )
      // Micro-rotación durante la separación: evita que parezca un ascensor.
      part.object.rotation.z = part.explode.y * eased * 0.09
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload(asset('models/shoe.glb'))
