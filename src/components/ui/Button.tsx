import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'solid' | 'outline'
}

/**
 * El relleno entra desde el borde inferior en hover (220 ms) y el texto se
 * invierte. Con foco de teclado se aplica el mismo estado: quien navega con
 * tabulador ve exactamente la misma señal que quien usa ratón.
 */
export function Button({ children, variant = 'outline', className = '', ...rest }: Props) {
  return (
    <button className={`btn btn--${variant} ${className}`} {...rest}>
      <span className="btn__fill" aria-hidden="true" />
      <span className="btn__label">{children}</span>
    </button>
  )
}
