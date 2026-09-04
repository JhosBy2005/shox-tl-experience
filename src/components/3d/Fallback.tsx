import { CHAPTERS } from '../../config/storyboard'

/**
 * Salida sin WebGL / dispositivo de baja potencia / reduced-motion severo.
 *
 * No es una pantalla de error: es la misma historia contada en un documento
 * normal. Todo el texto de los capítulos ya vive en el DOM, así que aquí sólo
 * se recompone en vertical, sin canvas ni scroll secuestrado.
 */
export function Fallback({ reason }: { reason: 'no-webgl' | 'reduced-motion' }) {
  return (
    <div className="fallback">
      <p className="u-mono fallback__note">
        {reason === 'no-webgl'
          ? 'Vista simplificada — este navegador no soporta WebGL'
          : 'Vista simplificada — movimiento reducido activado'}
      </p>
      {CHAPTERS.filter((c) => c.title).map((c) => (
        <section key={c.id} className="fallback__chapter">
          {c.eyebrow && <p className="u-mono">{c.eyebrow}</p>}
          <h2 className="fallback__title">{c.title}</h2>
          {c.body && <p className="fallback__body">{c.body}</p>}
          {c.specs && (
            <dl className="fallback__specs">
              {c.specs.map(([k, v]) => (
                <div key={k}>
                  <dt className="u-mono">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}
    </div>
  )
}
