import { useEffect, useRef, useState } from 'react'
import { useDeviceTier } from './hooks/useDeviceTier'
import { usePointerParallax } from './hooks/usePointerParallax'
import { useSmoothScroll, useScrollDriver } from './animations/useLenis'
import { SCROLL_LENGTH_VH } from './config/breakpoints'
import { ShoeScene } from './components/3d/ShoeScene'
import { Fallback } from './components/3d/Fallback'
import { Hero } from './components/sections/Hero'
import { StorySection } from './components/sections/StorySection'
import { TechnologySection } from './components/sections/TechnologySection'
import { DetailsSection } from './components/sections/DetailsSection'
import { CTASection } from './components/sections/CTASection'
import { Nav } from './components/ui/Nav'
import { ScrollProgress } from './components/ui/ScrollProgress'
import { Loader } from './components/ui/Loader'
import './styles/sections.css'

export function App() {
  const device = useDeviceTier()
  const triggerRef = useRef<HTMLDivElement>(null)
  const explodeRef = useRef(0)
  const [sceneActive, setSceneActive] = useState(true)

  /**
   * Con reduced-motion se conserva el producto en 3D pero se retira todo el
   * movimiento: sin pin, sin scrub, sin parallax. El modelo se renderiza en su
   * pose hero y el contenido pasa a ser un documento normal.
   */
  const immersive = device.webgl && !device.reducedMotion
  const scrollLengthVh = device.isDesktop
    ? SCROLL_LENGTH_VH.desktop
    : device.isTablet
      ? SCROLL_LENGTH_VH.tablet
      : SCROLL_LENGTH_VH.mobile

  useSmoothScroll(immersive)
  useScrollDriver(triggerRef, immersive)
  usePointerParallax(device.pointerParallax)

  // Fuera de la sección inmersiva el canvas deja de dibujar por completo.
  useEffect(() => {
    const el = triggerRef.current
    if (!el || !immersive) return
    const io = new IntersectionObserver(
      ([entry]) => setSceneActive(entry.isIntersecting),
      { rootMargin: '10% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [immersive])

  // Una pestaña en segundo plano no debe seguir consumiendo GPU.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setSceneActive(false)
      else if (triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect()
        setSceneActive(r.bottom > 0 && r.top < window.innerHeight)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar a la ficha de producto
      </a>

      <Nav />

      {device.webgl && (
        <>
          <Loader />
          <ShoeScene
            device={device}
            explodeRef={explodeRef}
            active={immersive ? sceneActive : true}
          />
        </>
      )}

      <main id="top">
        {immersive ? (
          <>
            <Hero triggerRef={triggerRef} scrollLengthVh={scrollLengthVh} />
            <ScrollProgress trigger={triggerRef} />
          </>
        ) : (
          <>
            {device.webgl && <div className="static-hero" aria-hidden="true" />}
            <Fallback reason={device.webgl ? 'reduced-motion' : 'no-webgl'} />
          </>
        )}

        <div id="contenido" className="content">
          <StorySection />
          <TechnologySection />
          <DetailsSection />
          <CTASection />
        </div>
      </main>
    </>
  )
}
