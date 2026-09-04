export function Nav() {
  return (
    <header className="nav">
      <a className="nav__brand" href="#top">
        <span className="nav__brand-mark">NIKE</span>
        <span className="nav__brand-model">Shox TL</span>
      </a>
      <nav className="nav__links" aria-label="Secciones">
        <a href="#tecnologia">Tecnología</a>
        <a href="#detalles">Detalles</a>
        <a href="#reservar">Reservar</a>
      </nav>
      <p className="nav__price u-mono" aria-label="Precio">
        189&nbsp;€
      </p>
    </header>
  )
}
