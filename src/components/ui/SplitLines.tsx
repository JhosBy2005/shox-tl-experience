/**
 * Reparte un título en líneas enmascaradas.
 *
 * Cada línea se revela con --reveal, la custom property que el driver del
 * capítulo escribe una vez por frame. El escalonado va en CSS (--i), así que
 * animar N líneas cuesta exactamente una escritura de estilo, no N.
 */
export function SplitLines({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split('\n')
  return (
    <span className={`split ${className}`}>
      {lines.map((line, i) => (
        <span className="split__line" key={i} style={{ '--i': i } as React.CSSProperties}>
          <span className="split__inner">{line}</span>
        </span>
      ))}
    </span>
  )
}
