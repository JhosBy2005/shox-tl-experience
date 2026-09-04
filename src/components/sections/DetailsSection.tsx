const DETAILS = [
  {
    n: '01',
    title: 'Acabado sobre acabado',
    body: 'Charol, mesh y nylon en el mismo negro. La forma no la dibuja el color: la dibuja la luz al chocar contra tres rugosidades distintas.',
  },
  {
    n: '02',
    title: 'Cage termosellado',
    body: 'Nueve nervios de TPU barren en diagonal desde la mediasuela hasta el cuello. Sujetan el pie sin una sola costura en la zona de flexión.',
  },
  {
    n: '03',
    title: 'Cordaje de seis pares',
    body: 'La garganta se estrecha hacia la pala. El ajuste se reparte a lo largo del empeine en vez de concentrarse en el último ojal.',
  },
  {
    n: '04',
    title: 'Plantilla extraíble',
    body: 'Espuma moldeada de 6 mm. Se saca entera para lavarla o para sustituirla por una ortopédica sin perder volumen interior.',
  },
]

export function DetailsSection() {
  return (
    <section className="section section--details" id="detalles">
      <p className="u-mono section__eyebrow">Detalles</p>
      <h2 className="section__title">Cuatro decisiones</h2>
      <ul className="details">
        {DETAILS.map((d) => (
          <li className="details__item" key={d.n}>
            <span className="details__n u-mono">{d.n}</span>
            <h3 className="details__title">{d.title}</h3>
            <p className="details__body">{d.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
