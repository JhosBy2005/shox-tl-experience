/** Breakpoints. Única fuente de verdad — el CSS los repite pero nadie más los inventa. */
export const BP = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const

export type Viewport = keyof typeof BP

export const MQ = {
  tablet: `(min-width: ${BP.tablet}px)`,
  desktop: `(min-width: ${BP.desktop}px)`,
  wide: `(min-width: ${BP.wide}px)`,
  finePointer: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const

/**
 * Longitud del pin por viewport. El brief pide 300–500vh; el móvil se queda
 * en el mínimo porque cada vh extra de pin es scroll secuestrado en táctil.
 */
export const SCROLL_LENGTH_VH = {
  mobile: 300,
  tablet: 380,
  desktop: 480,
} as const
