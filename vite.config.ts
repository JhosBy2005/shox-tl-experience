import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, isPreview }) => ({
  /**
   * GitHub Pages sirve los proyectos bajo `/<repo>/`, no en la raiz.
   * Se aplica en el build y en `vite preview` -para poder verificar en local
   * exactamente lo que sirve Pages- pero no en desarrollo, donde el servidor,
   * los tests y el script de storyboard siguen apuntando a la raiz.
   */
  base: command === 'build' || isPreview ? '/shox-tl-experience/' : '/',
  plugins: [react()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        /**
         * Rolldown (Vite 8) exige funcion, no el objeto de Rollup.
         *
         * three va en su propio chunk para que postprocessing -que es opcional
         * y sólo se carga en desktop de gama alta- no arrastre una copia
         * duplicada del motor. En Windows los ids llegan con barras
         * invertidas: sin normalizar, ninguna regla casaba.
         */
        manualChunks(id: string) {
          // (String.fromCharCode(92) = barra invertida, sin escapes en el fuente)
          const p = id.replaceAll(String.fromCharCode(92), '/')
          if (!p.includes('node_modules')) return undefined
          if (p.includes('node_modules/three/') || p.includes('three-stdlib')) return 'three'
          if (p.includes('@react-three') || p.includes('/maath/')) return 'r3f'
          if (p.includes('/gsap/') || p.includes('@gsap/') || p.includes('/lenis/')) return 'motion'
          if (p.includes('/postprocessing/')) return 'post'
          return undefined
        },
      },
    },
  },
}))
