import { useState } from 'react'
import { Button } from '../ui/Button'

const SIZES = ['40', '41', '42', '43', '44', '45', '46']
const SOLD_OUT = new Set(['40', '46'])

export function CTASection() {
  const [size, setSize] = useState<string | null>(null)

  return (
    <section className="section section--cta" id="reservar">
      <p className="u-mono section__eyebrow">Disponible</p>
      <h2 className="section__title section__title--big">
        Nike Shox TL
        <br />
        Triple Black
      </h2>

      <fieldset className="sizes">
        <legend className="u-mono sizes__legend">Talla EU</legend>
        <div className="sizes__grid">
          {SIZES.map((s) => {
            const out = SOLD_OUT.has(s)
            return (
              <label key={s} className={`size ${out ? 'is-out' : ''} ${size === s ? 'is-on' : ''}`}>
                <input
                  type="radio"
                  name="talla"
                  value={s}
                  disabled={out}
                  checked={size === s}
                  onChange={() => setSize(s)}
                  className="u-sr-only"
                />
                <span aria-hidden="true">{s}</span>
                <span className="u-sr-only">
                  Talla {s}
                  {out ? ' — agotada' : ''}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="cta__actions">
        <Button variant="solid" disabled={!size}>
          {size ? `Reservar talla ${size} — 189 €` : 'Elige una talla'}
        </Button>
        <p className="u-mono cta__note" aria-live="polite">
          {size ? 'Envío en 24–48 h · Devolución 30 días' : 'Selecciona talla para continuar'}
        </p>
      </div>

      <footer className="footer">
        <p className="u-mono">
          Pieza de estudio · Experiencia de producto en WebGL · Modelo 3D paramétrico generado por
          código
        </p>
      </footer>
    </section>
  )
}
