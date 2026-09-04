import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
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
})
