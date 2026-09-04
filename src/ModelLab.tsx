import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { asset } from './config/assets'
import { Lighting } from './components/3d/Lighting'
import { ShoeModel } from './components/3d/ShoeModel'
import './styles/global.css'

/**
 * Banco de pruebas del modelo — accesible en /?lab
 *
 * Existe para validar silueta y despiece ANTES de escribir la experiencia de
 * scroll. Si la geometría no convence, se itera aquí sin tocar nada más.
 */

const VIEWS = {
  '3/4': [2.6, 1.5, 3.6],
  lateral: [0, 0.1, 4.6],
  frontal: [4.4, 0.5, 0.0],
  trasera: [-4.4, 0.6, 0.0],
  cenital: [0.2, 4.6, 0.4],
  suela: [0.2, -4.4, 0.6],
  '3/4 post.': [-2.8, 1.3, -3.2],
} as const

type ViewName = keyof typeof VIEWS

function CameraJump({ view }: { view: ViewName }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  useEffect(() => {
    const [x, y, z] = VIEWS[view]
    camera.position.set(x, y, z)
    camera.lookAt(0, 0, 0)
    controls?.target.set(0, 0, 0)
    controls?.update()
  }, [view, camera, controls])
  return null
}

export function ModelLab() {
  const explodeRef = useRef(0)
  const [explode, setExplode] = useState(0)
  const [lite, setLite] = useState(false)
  const [grid, setGrid] = useState(true)
  const [view, setView] = useState<ViewName>('3/4')

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#08080a' }}>
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: false }} style={{ position: 'absolute', inset: 0 }}>
        <color attach="background" args={['#08080a']} />
        <PerspectiveCamera makeDefault fov={32} position={[2.6, 1.5, 3.6]} />
        <Lighting />
        <Suspense fallback={null}>
          <ShoeModel
            key={lite ? 'lite' : 'full'}
            url={lite ? asset('models/shoe-lite.glb') : asset('models/shoe.glb')}
            getExplode={() => explodeRef.current}
            damping={0.08}
          />
        </Suspense>
        {grid && (
          <Grid
            args={[10, 10]}
            position={[0, -0.46, 0]}
            cellSize={0.25}
            cellColor="#1a1a22"
            sectionSize={1}
            sectionColor="#2c2c38"
            fadeDistance={14}
            infiniteGrid
          />
        )}
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} target={[0, 0, 0]} />
        <CameraJump view={view} />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          padding: '16px 18px',
          background: 'rgba(10,10,12,0.9)',
          border: '1px solid #23232b',
          borderRadius: 4,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: '#a8a8b3',
          width: 232,
        }}
      >
        <div style={{ letterSpacing: '0.16em', color: '#f2f2f4', marginBottom: 12 }}>MODEL LAB</div>

        <label style={{ display: 'block', marginBottom: 4 }}>DESPIECE — {(explode * 100).toFixed(0)}%</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={explode}
          onChange={(e) => {
            const v = Number(e.target.value)
            setExplode(v)
            explodeRef.current = v
          }}
          style={{ width: '100%', marginBottom: 14, accentColor: '#e4002b' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {(Object.keys(VIEWS) as ViewName[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '4px 7px',
                fontSize: 10,
                fontFamily: 'inherit',
                border: `1px solid ${view === v ? '#e4002b' : '#2a2a30'}`,
                color: view === v ? '#f2f2f4' : '#6e6e78',
                background: 'transparent',
                borderRadius: 2,
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <label style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={lite} onChange={(e) => setLite(e.target.checked)} /> LITE
          </label>
          <label style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} /> GRID
          </label>
        </div>
      </div>
    </div>
  )
}
