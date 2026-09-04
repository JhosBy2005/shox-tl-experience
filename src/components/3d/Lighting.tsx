import { Environment, Lightformer } from '@react-three/drei'

interface Props {
  /** Sin postprocesado el rim necesita algo más de empuje para separar del fondo. */
  intensity?: number
}

/**
 * Rig de iluminación de estudio.
 *
 * Restricción dura del brief: un objeto negro sobre fondo negro NO EXISTE sin
 * contraluz. El rim no es decoración, es lo que dibuja la silueta. Por eso la
 * luz más fuerte de toda la escena está detrás del producto, no delante.
 *
 * El entorno se construye con Lightformers en vez de cargar un HDRI: no hay
 * fetch externo, pesa cero, y me deja colocar los reflejos exactamente donde
 * quiero — que en un charol negro es literalmente la única forma que se ve.
 */
export function Lighting({ intensity = 1 }: Props) {
  return (
    <>
      {/* frames={1} => se cuece una sola vez y se cachea. */}
      <Environment resolution={256} frames={1}>
        {/* Rim principal: panel grande detrás y arriba. Dibuja el contorno. */}
        <Lightformer
          form="rect"
          intensity={5.4 * intensity}
          position={[0, 3.2, -6]}
          scale={[9, 4.5, 1]}
          color="#ffffff"
        />
        {/* Barras laterales: producen los dos reflejos longitudinales del cage. */}
        <Lightformer
          form="rect"
          intensity={2.3 * intensity}
          position={[-7, 2.2, 1.5]}
          rotation-y={Math.PI / 2}
          scale={[3.4, 0.9, 1]}
          color="#cfd6ff"
        />
        <Lightformer
          form="rect"
          intensity={1.9 * intensity}
          position={[7, 1.6, 1.5]}
          rotation-y={-Math.PI / 2}
          scale={[3.0, 0.7, 1]}
          color="#ffe9d6"
        />
        {/* Cenital suave: da el lomo brillante a las columnas. */}
        <Lightformer
          form="ring"
          intensity={1.25 * intensity}
          position={[0.5, 6, 1]}
          rotation-x={Math.PI / 2}
          scale={3.4}
          color="#ffffff"
        />
        {/* Rebote inferior tenue: evita que la suela se funda con el negro. */}
        <Lightformer
          form="rect"
          intensity={0.9 * intensity}
          position={[0, -3, 2]}
          rotation-x={-Math.PI / 2}
          scale={[8, 5, 1]}
          color="#8a90a8"
        />
      </Environment>

      {/* Key direccional: modela el volumen, no ilumina de forma plana. */}
      <directionalLight position={[4, 6, 3]} intensity={1.15 * intensity} color="#ffffff" />
      {/* Fill frío muy bajo por el lado opuesto. */}
      <directionalLight position={[-5, 2, -2]} intensity={0.55 * intensity} color="#9fb0ff" />
      {/* Rim cálido rasante desde atrás-abajo: separa la suela del fondo. */}
      <spotLight
        position={[-3, -1.5, -5]}
        angle={0.9}
        penumbra={1}
        intensity={9 * intensity}
        color="#ffd9b8"
      />
      <ambientLight intensity={0.12} />
    </>
  )
}
