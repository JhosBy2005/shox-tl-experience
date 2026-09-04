import { useEffect, useRef, type RefObject } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { setProgress } from './scrollProgress'
import { CHAPTERS } from '../config/storyboard'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Instancia única, para que la navegación por capítulos pueda pedirle un scrollTo. */
let lenisInstance: Lenis | null = null

/**
 * Cableado Lenis <-> ScrollTrigger.
 *
 * El orden importa y es la fuente habitual de jitter:
 *   1. Lenis avisa a ScrollTrigger en cada scroll.
 *   2. El ticker de GSAP conduce el rAF de Lenis (un solo bucle, no dos).
 *   3. lagSmoothing(0): si no, GSAP "salta" tras un frame lento y desincroniza
 *      la posición scrubbeada de la real.
 */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      // Con reduced-motion no se instala scroll suavizado: el nativo es el correcto.
      return
    }
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      smoothWheel: true,
    })
    lenisInstance = lenis

    // Sólo en dev: permite a Playwright posicionar el scroll de forma exacta
    // y determinista en vez de simular ruedas del ratón.
    if (import.meta.env.DEV) {
      ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    }

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      lenisInstance = null
    }
  }, [enabled])
}

/**
 * El ÚNICO ScrollTrigger de la página.
 *
 * No usa `pin`. El canvas ya es `position: fixed`, así que la zapatilla queda
 * centrada sin secuestrar el scroll ni forzar los reflows que provoca pinnear
 * una sección de 480vh. ScrollTrigger aquí sólo mide y produce un número.
 */
export function useScrollDriver(trigger: RefObject<HTMLElement | null>, enabled: boolean) {
  const value = useRef({ p: 0 })

  useGSAP(
    () => {
      if (!trigger.current) return
      if (!enabled) {
        setProgress(0)
        return
      }
      const obj = value.current
      const tween = gsap.to(obj, {
        p: 1,
        ease: 'none',
        onUpdate: () => setProgress(obj.p),
        scrollTrigger: {
          trigger: trigger.current,
          start: 'top top',
          end: 'bottom bottom',
          // scrub numérico: el valor persigue al scroll con ~1s de retardo.
          // Es lo que convierte un scroll a tirones en un travelling.
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    },
    { dependencies: [enabled], revertOnUpdate: true }
  )

  // Fuentes y modelo cambian la altura del documento después del primer layout.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    if (document.fonts?.ready) document.fonts.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])
}

/**
 * Salto a capítulo. Con un recorrido de 480vh por delante, poder navegar por
 * teclado no es un extra: es la vía de escape del pin.
 */
export function scrollToChapter(index: number, trigger: HTMLElement | null) {
  const chapter = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, index))]
  if (!chapter || !trigger) return
  const start = trigger.offsetTop
  const total = trigger.offsetHeight - window.innerHeight
  // Punto medio del capítulo: aterriza en su estado, no en su frontera.
  const target = start + total * ((chapter.from + chapter.to) / 2)

  if (lenisInstance) lenisInstance.scrollTo(target, { duration: 1.1 })
  else window.scrollTo({ top: target, behavior: 'smooth' })
}
