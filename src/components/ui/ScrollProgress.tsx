import { useEffect, useRef, type RefObject } from 'react'
import { scrollState, useChapterStore } from '../../animations/scrollProgress'
import { CHAPTERS } from '../../config/storyboard'
import { scrollToChapter } from '../../animations/useLenis'

interface Props {
  trigger: RefObject<HTMLElement | null>
}

/**
 * Raíl de progreso con marcas de capítulo.
 *
 * También es la NAVEGACIÓN POR TECLADO del pin. Con casi 500vh de recorrido
 * secuestrado, poder saltar de capítulo con las flechas no es un adorno: es
 * la vía de escape. Sin esto, quien no pueda hacer scroll continuo se queda
 * atrapado en la sección.
 */
export function ScrollProgress({ trigger }: Props) {
  const barRef = useRef<HTMLSpanElement>(null)
  const index = useChapterStore((s) => s.index)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const bar = barRef.current
      if (bar) bar.style.transform = `scaleY(${scrollState.progress.toFixed(4)})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      scrollToChapter(index + 1, trigger.current)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollToChapter(index - 1, trigger.current)
    } else if (e.key === 'Home') {
      e.preventDefault()
      scrollToChapter(0, trigger.current)
    } else if (e.key === 'End') {
      e.preventDefault()
      scrollToChapter(CHAPTERS.length - 1, trigger.current)
    }
  }

  return (
    <div
      className="rail"
      role="group"
      aria-label="Progreso y navegación por capítulos"
      onKeyDown={onKeyDown}
    >
      <span className="rail__track" aria-hidden="true">
        <span ref={barRef} className="rail__bar" />
      </span>
      <ol className="rail__marks">
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              className={`rail__mark ${i === index ? 'is-active' : ''}`}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => scrollToChapter(i, trigger.current)}
            >
              <span className="u-sr-only">
                {c.eyebrow || c.title.replace('\n', ' ')}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="rail__index u-mono" aria-live="polite">
        {String(index + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
      </p>
    </div>
  )
}
