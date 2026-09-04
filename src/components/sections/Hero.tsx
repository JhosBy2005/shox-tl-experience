import { useEffect, useRef, type RefObject } from 'react'
import { CHAPTERS, type Chapter } from '../../config/storyboard'
import { scrollState } from '../../animations/scrollProgress'
import { clamp01, range } from '../../animations/easing'
import { SplitLines } from '../ui/SplitLines'
import { PART_LABELS, PART_NAMES } from '../3d/ShoeModel'

/** Dos capas de apilamiento respecto al canvas (z-index 1). */
const layerOf = (c: Chapter) => c.layer ?? (c.align === 'center' ? 'behind' : 'front')

const LAYERS = [
  { cls: 'chapters--behind', test: (c: Chapter) => layerOf(c) === 'behind' },
  { cls: 'chapters--front', test: (c: Chapter) => layerOf(c) === 'front' },
] as const

interface Props {
  triggerRef: RefObject<HTMLDivElement | null>
  scrollLengthVh: number
}

/**
 * La sección pinneada: el 100% de la narración de producto.
 *
 * No usa GSAP pin. El canvas ya es fixed y esta capa de texto es sticky, así
 * que la zapatilla queda centrada sin que ScrollTrigger tenga que reescribir
 * el layout —que es lo que en móvil rompe el scroll nativo.
 *
 * TODO el texto está en el DOM en orden de lectura desde el primer render.
 * Un lector de pantalla recorre los diez capítulos aunque no se haga scroll.
 */
export function Hero({ triggerRef, scrollLengthVh }: Props) {
  const chapterRefs = useRef<Array<HTMLElement | null>>([])
  const cueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = scrollState.progress

      for (let i = 0; i < CHAPTERS.length; i++) {
        const el = chapterRefs.current[i]
        if (!el) continue
        const c = CHAPTERS[i]

        // El capítulo saliente termina de irse antes de que entre el
        // siguiente. Ese pequeño silencio entre bloques es intencionado:
        // solapados se leían amontonados, no como un fundido.
        // Los extremos no se funden: el hero debe estar entero en p=0 y el
        // CTA entero en p=1, o la página abre y cierra a media opacidad.
        const enter = c.from <= 0 ? 1 : range(p, c.from + 0.004, c.from + 0.032)
        const exit = c.to >= 1 ? 1 : 1 - range(p, c.to - 0.034, c.to - 0.006)
        const v = clamp01(enter * exit)

        el.style.setProperty('--reveal', v.toFixed(3))
        // visibility (no display) para no invalidar el layout cada frame.
        el.style.visibility = v > 0.004 ? 'visible' : 'hidden'
        el.setAttribute('aria-hidden', v > 0.4 ? 'false' : 'true')

        if (c.counter) {
          const node = el.querySelector<HTMLElement>('[data-counter]')
          if (node) {
            const local = range(p, c.from + 0.012, c.from + (c.to - c.from) * 0.42)
            const next = String(Math.round(local * c.counter.to))
            if (node.textContent !== next) node.textContent = next
          }
        }
      }

      const cue = cueRef.current
      if (cue) cue.style.setProperty('--reveal', (1 - range(p, 0.006, 0.035)).toFixed(3))

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={triggerRef}
      className="pin"
      style={{ height: `${scrollLengthVh}vh` }}
      data-scroll-driver
    >
      {LAYERS.map(({ cls, test }) => (
        <div className={`chapters ${cls}`} key={cls}>
          {CHAPTERS.map((c, i) => (test(c) ? (
              <article
                key={c.id}
                ref={(el) => {
                  chapterRefs.current[i] = el
                }}
                className={`chapter chapter--${c.align}`}
                style={{ visibility: 'hidden' }}
              >
              {c.eyebrow && <p className="chapter__eyebrow u-mono">{c.eyebrow}</p>}

              <h2 className={`chapter__title ${c.id === 'hero' || c.id === 'cta' ? 'chapter__title--display' : ''}`}>
                <SplitLines text={c.title} />
              </h2>

              {c.counter && (
                <p className="chapter__counter">
                  <span data-counter aria-hidden="true">
                    0
                  </span>
                  <span className="u-sr-only">{c.counter.to}</span>
                  <span className="chapter__counter-label u-mono">{c.counter.label}</span>
                </p>
              )}

              {c.body && <p className="chapter__body">{c.body}</p>}

              {c.parts && (
                <ol className="chapter__parts">
                  {PART_NAMES.map((name) => (
                    <li key={name}>
                      <span className="chapter__parts-name">{PART_LABELS[name].es}</span>
                      <span className="chapter__parts-spec u-mono">{PART_LABELS[name].spec}</span>
                    </li>
                  ))}
                </ol>
              )}

              {c.specs && (
                <dl className="chapter__specs">
                  {c.specs.map(([k, v]) => (
                    <div key={k} className="chapter__spec">
                      <dt className="u-mono">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              </article>
          ) : null))}
        </div>
      ))}

      <div ref={cueRef} className="cue" aria-hidden="true">
        <span className="u-mono">Scroll</span>
        <span className="cue__line" />
      </div>
    </div>
  )
}
