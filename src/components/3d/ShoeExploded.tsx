import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { scrollState, useChapterStore } from '../../animations/scrollProgress'
import { CHAPTERS, EXPLODE_LABEL_RANGE } from '../../config/storyboard'
import { PART_LABELS, PART_NAMES, type PartName } from './ShoeModel'
import { clamp01, range } from '../../animations/easing'

/**
 * Etiquetas de componente ancladas en 3D durante el despiece.
 *
 * Van en <Html> y no pintadas en el canvas: así son texto real, seleccionable,
 * leíble por lector de pantalla e indexable. Un rótulo dibujado dentro de la
 * textura sería invisible para todo eso.
 *
 * Ojo: <Html> monta un portal en el DOM y NO lo oculta cuando el Object3D
 * padre tiene visible=false. Por eso el montaje se decide con el índice de
 * capítulo (cambia ~10 veces en toda la página) en lugar de con la escena.
 */

/**
 * Posición de cada etiqueta con el despiece al 100%.
 * La X las saca del ancho de la zapatilla: encima de las piezas eran ilegibles.
 */
const ANCHORS: Record<PartName, [number, number]> = {
  laces: [1.15, 1.06],
  tongue: [1.15, 0.7],
  upper: [1.15, 0.36],
  insole: [1.15, 0.05],
  midsole: [1.15, -0.3],
  outsole: [1.15, -0.78],
}

const LABEL_CHAPTERS = new Set(['despiece', 'ensamblado'])

interface Props {
  explodeRef: React.MutableRefObject<number>
  /** En móvil se muestran menos etiquetas: no caben sin solaparse. */
  compact?: boolean
}

export function ShoeExploded({ explodeRef, compact = false }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const chapterIndex = useChapterStore((s) => s.index)
  const active = LABEL_CHAPTERS.has(CHAPTERS[chapterIndex]?.id ?? '')

  const shown = [...PART_NAMES]

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const e = explodeRef.current
    const fade = explodeOpacity(scrollState.progress)
    g.children.forEach((child, i) => {
      const anchor = ANCHORS[shown[i]]
      if (anchor) child.position.set(anchor[0], anchor[1] * e, 0)
      child.visible = fade > 0.01
    })
    // La opacidad se escribe en el contenedor DOM, no en el Object3D.
    if (g.userData.dom) (g.userData.dom as HTMLElement).style.opacity = fade.toFixed(3)
  })

  // En móvil las etiquetas ancladas en 3D se pisan entre sí; allí la lista de
  // componentes se sirve como texto en el capítulo (ver Hero).
  if (!active || compact) return null

  return (
    <group ref={groupRef}>
      {shown.map((name) => (
        <group key={name}>
          <Html
            position={[0, 0, 0]}
            style={{ pointerEvents: 'none', transform: 'translate(20px, -50%)' }}
            zIndexRange={[8, 4]}
            wrapperClass="part-label-wrap"
          >
            <div className="part-label">
              <span className="part-label__rule" aria-hidden="true" />
              <span className="part-label__name">{PART_LABELS[name].es}</span>
              <span className="part-label__spec">{PART_LABELS[name].spec}</span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}

export const explodeOpacity = (p: number) =>
  clamp01(
    range(p, EXPLODE_LABEL_RANGE.from - 0.03, EXPLODE_LABEL_RANGE.from) *
      (1 - range(p, EXPLODE_LABEL_RANGE.to, EXPLODE_LABEL_RANGE.to + 0.035))
  )
