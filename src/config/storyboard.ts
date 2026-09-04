/**
 * Storyboard: el guion de la experiencia en un solo sitio.
 *
 * `from`/`to` son posiciones dentro del progreso 0..1 de la sección de scroll.
 * Los keyframes del modelo (shoeScrollAnimation.ts) están anclados a estos
 * mismos números — cambiar aquí un capítulo mueve texto y 3D a la vez.
 */

export interface Chapter {
  id: string
  from: number
  to: number
  /** Etiqueta mono de capítulo. */
  eyebrow: string
  title: string
  body?: string
  /** Datos técnicos en columna, estilo ficha. */
  specs?: Array<[string, string]>
  /** Cifra grande que cuenta con el scroll. */
  counter?: { to: number; suffix?: string; label: string }
  /** Lista de componentes. En desktop la sustituyen las etiquetas 3D. */
  parts?: boolean
  /**
   * Capa de apilamiento respecto al canvas.
   * 'behind' = tipografía gigante con el producto recortándose encima.
   * Por defecto los capítulos centrados van detrás; 'front' lo fuerza para
   * los que deben leerse enteros aunque el producto esté delante.
   */
  layer?: 'front' | 'behind'
  align: 'left' | 'right' | 'center'
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'hero',
    from: 0.0,
    to: 0.085,
    eyebrow: 'Nike Shox TL',
    title: 'Triple\nBlack',
    body: 'Doce columnas. Cero ruido.',
    align: 'center',
  },
  {
    id: 'silueta',
    from: 0.085,
    to: 0.2,
    eyebrow: 'Cap. 01 — Silueta',
    title: 'Una línea\nque no se\ninterrumpe',
    body: 'El perfil recorre 32 centímetros sin un solo corte. Todo el objeto es negro: lo que dibuja la forma no es el color, es el acabado.',
    align: 'left',
  },
  {
    id: 'anchura',
    from: 0.2,
    to: 0.315,
    eyebrow: 'Cap. 02 — Horma',
    title: 'Frontal',
    specs: [
      ['Peso', '310 g'],
      ['Drop', '10 mm'],
      ['Horma', 'Regular'],
      ['Upper', 'Mesh / TPU'],
    ],
    align: 'right',
  },
  {
    id: 'columnas',
    from: 0.315,
    to: 0.44,
    eyebrow: 'Cap. 03 — Amortiguación',
    title: 'Columnas',
    body: 'Cada columna se comprime y devuelve la energía de forma independiente. No es una espuma que se cansa: es una estructura.',
    counter: { to: 12, label: 'columnas de longitud total' },
    align: 'left',
  },
  {
    id: 'planta',
    from: 0.44,
    to: 0.55,
    eyebrow: 'Cap. 04 — Planta',
    title: 'Desde\narriba',
    body: 'Cordaje de seis pares sobre lengüeta acolchada. La garganta se estrecha hacia la pala para sujetar sin apretar.',
    align: 'right',
  },
  {
    id: 'traccion',
    from: 0.55,
    to: 0.645,
    eyebrow: 'Cap. 05 — Tracción',
    title: 'Suela',
    body: 'Caucho BRS 1000 en quince barras transversales. Agarre en seco y en mojado.',
    align: 'left',
  },
  {
    id: 'editorial',
    from: 0.645,
    to: 0.715,
    eyebrow: '',
    title: 'Nada\nsobra',
    // Centrado pero DELANTE: detras quedaba integramente tapado por la
    // zapatilla y el capitulo se veia sin una sola palabra en pantalla.
    layer: 'front',
    align: 'center',
  },
  {
    id: 'despiece',
    from: 0.715,
    to: 0.85,
    eyebrow: 'Cap. 06 — Construcción',
    title: 'Seis piezas',
    body: 'Sigue bajando para controlar la separación.',
    parts: true,
    align: 'left',
  },
  {
    id: 'ensamblado',
    from: 0.85,
    to: 0.955,
    eyebrow: 'Cap. 07 — Ensamblado',
    title: 'Y una sola\npieza',
    body: 'Todo vuelve a su sitio. Eso es lo que llevas puesto.',
    align: 'right',
  },
  {
    id: 'cta',
    from: 0.955,
    to: 1.0,
    eyebrow: 'Nike Shox TL',
    title: 'Triple\nBlack',
    align: 'center',
  },
]

/** Etiquetas ancladas en 3D durante el despiece. */
export const EXPLODE_LABEL_RANGE = { from: 0.735, to: 0.885 } as const
