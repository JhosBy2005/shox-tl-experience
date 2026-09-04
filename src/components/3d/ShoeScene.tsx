import { Suspense, useRef, useState, type MutableRefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, PerformanceMonitor, AdaptiveDpr, Preload } from '@react-three/drei'
import * as THREE from 'three'
import { Lighting } from './Lighting'
import { ShoeModel } from './ShoeModel'
import { ShoeExploded } from './ShoeExploded'
import { CameraRig } from './CameraRig'
import { TIMELINE_DESKTOP, TIMELINE_MOBILE } from '../../animations/shoeScrollAnimation'
import type { DeviceProfile } from '../../hooks/useDeviceTier'

interface Props {
  device: DeviceProfile
  explodeRef: MutableRefObject<number>
  /** false cuando la sección de scroll ya no está en pantalla: se deja de renderizar. */
  active: boolean
}

export function ShoeScene({ device, explodeRef, active }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const [degraded, setDegraded] = useState(false)

  const timeline = device.isDesktop ? TIMELINE_DESKTOP : TIMELINE_MOBILE
  const dpr: [number, number] = degraded ? [1, 1] : device.dpr

  return (
    <div className="scene" aria-hidden={!active}>
      {/* Viñeta en CSS. Con postprocessing costaba 200 KB gz y una copia
          duplicada de three; el resultado sobre negro es indistinguible. */}
      <span className="scene__vignette" aria-hidden="true" />
      <Canvas
        // Fuera de la sección de scroll no se dibuja ni un frame: el resto de
        // la página cuesta 0% de GPU.
        frameloop={active ? 'always' : 'never'}
        dpr={dpr}
        gl={{
          antialias: device.tier === 'high',
          // Transparente a proposito: el titular gigante vive en una capa CSS
          // por DEBAJO del canvas y tiene que verse recortado por la zapatilla.
          alpha: true,
          powerPreference: 'high-performance',
          // El objeto es negro sobre negro: el tone mapping neutral conserva
          // los negros profundos que ACES levantaría.
          toneMapping: THREE.NeutralToneMapping,
        }}
        camera={{ fov: 30, near: 0.1, far: 60 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <PerspectiveCamera makeDefault fov={30} near={0.1} far={60} position={[0, 0.18, 4.5]} />

        <PerformanceMonitor
          onDecline={() => setDegraded(true)}
          onIncline={() => setDegraded(false)}
          flipflops={3}
        />
        <AdaptiveDpr pixelated={false} />

        <Lighting intensity={device.tier === 'low' ? 1.1 : 1} />

        <Suspense fallback={null}>
          <group ref={groupRef}>
            <ShoeModel url={device.modelUrl} getExplode={() => explodeRef.current} damping={0.1} />
          </group>
          <ShoeExploded explodeRef={explodeRef} compact={!device.isDesktop} />
          <Preload all />
        </Suspense>

        <CameraRig
          groupRef={groupRef}
          explodeRef={explodeRef}
          timeline={timeline}
          pointerParallax={device.pointerParallax}
          instant={device.reducedMotion}
        />
      </Canvas>
    </div>
  )
}
