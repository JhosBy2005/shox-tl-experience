const SPECS: Array<{ k: string; v: string; note: string }> = [
  { k: 'Columnas', v: '12', note: 'Poliuretano moldeado, longitud total' },
  { k: 'Compresión', v: '4,2 mm', note: 'Recorrido por columna bajo carga' },
  { k: 'Retorno', v: '87 %', note: 'Energía devuelta en el despegue' },
  { k: 'Drop', v: '10 mm', note: '34 mm talón / 24 mm antepié' },
  { k: 'Peso', v: '310 g', note: 'Talla 42, media unidad' },
  { k: 'Suela', v: 'BRS 1000', note: 'Caucho de carbono, 15 barras' },
]

export function TechnologySection() {
  return (
    <section className="section section--tech" id="tecnologia">
      <p className="u-mono section__eyebrow">Tecnología</p>
      <h2 className="section__title">El sistema</h2>
      <dl className="specs">
        {SPECS.map((s) => (
          <div className="specs__row" key={s.k}>
            <dt className="specs__key u-mono">{s.k}</dt>
            <dd className="specs__value">{s.v}</dd>
            <dd className="specs__note">{s.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
