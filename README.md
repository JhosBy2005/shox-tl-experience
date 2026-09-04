# Nike Shox TL — Triple Black

Experiencia de producto en WebGL dirigida por scroll. El modelo 3D es
**paramétrico y se genera por código**: no hay ningún GLB descargado.

```bash
npm install
npm run model     # genera y optimiza los GLB (necesario la primera vez)
npm run dev       # http://localhost:5173
npm run dev       # http://localhost:5173/?lab  -> banco de pruebas del modelo
```

---

## La idea en una frase

Toda la experiencia la conduce **un solo número**: `progress ∈ [0,1]`.
GSAP no toca ni un objeto 3D — sólo escribe ese número. La escena lo lee en
`useFrame` y muestrea una tabla de keyframes.

Consecuencias directas:

- **Cero re-renders de React durante el scroll.** El progreso vive en un objeto
  plano mutable (`scrollState`), no en un store reactivo. Si viviera en estado
  de React, cada frame de scroll re-renderizaría el árbol entero.
- **El scrub es reversible por construcción**: no hay estado acumulado, el
  mismo `progress` siempre produce el mismo fotograma.
- **Reeditar la película = reordenar un array** (`shoeScrollAnimation.ts`).

Sólo el índice de capítulo es reactivo, y cambia ~10 veces en toda la página.

---

## El modelo 3D

`scripts/build-model.mjs` construye la zapatilla con geometría de three
(lathe, tubos y superficies barridas) y la exporta con `@gltf-transform/core`,
que sí funciona en Node sin navegador.

Se eligió esta vía frente a un GLB generado por IA o comprado porque **los seis
componentes tienen que existir como nodos separados** para el despiece, y una
malla fusionada no se puede separar sin un DCC.

| | Desktop | Móvil |
|---|---|---|
| Triángulos | 29 536 | 18 308 |
| Draw calls | 8 | 8 |
| GLB (meshopt) | **188 KB** | **123 KB** |

La silueta entera vive en `scripts/lib/profiles.mjs` como tablas de puntos
Catmull-Rom. Cambiar el talón, el drop o el número de columnas es cambiar
números, no volver a modelar.

```bash
npm run model:build      # geometría -> shoe-raw.glb
npm run model:optimize   # dedup, weld, reorder, quantize, EXT_meshopt
```

Meshopt en vez de Draco: el decoder pesa ~25 KB frente a ~200 KB de WASM.

---

## Arquitectura

```
scripts/
  lib/profiles.mjs        La silueta, en tablas de curvas 1D
  lib/parts.mjs           Constructores de geometría por componente
  build-model.mjs         Ensambla y exporta el GLB (nodos nombrados)
  optimize-model.mjs      Pipeline de compresión
  capture-storyboard.mjs  22 fotogramas del recorrido, desktop y móvil

src/
  animations/
    shoeScrollAnimation.ts   LA COREOGRAFÍA: tabla de keyframes + sampler
    scrollProgress.ts        Estado partido: mutable para 3D, reactivo para UI
    useLenis.ts              Lenis <-> ScrollTrigger, y el único ScrollTrigger
  components/3d/            ShoeScene · ShoeModel · ShoeExploded · CameraRig · Lighting · Fallback
  components/sections/      Hero (el pin) · Story · Technology · Details · CTA
  components/ui/            Nav · ScrollProgress · SplitLines · Button · Loader
  config/                   breakpoints.ts · storyboard.ts (el guion y el copy)
```

### Decisiones que conviene conocer antes de tocar nada

**No se usa `pin` de GSAP.** El canvas ya es `position: fixed`, así que la
zapatilla queda centrada sin secuestrar el scroll ni forzar los reflows que
provoca pinnear una sección de 480vh. ScrollTrigger sólo mide y produce un
número.

**Rotaciones por slerp de cuaterniones, no lerp de Euler.** Con Euler, cruzar
la vista cenital o la suela produce un salto de gimbal. La Y decrece de forma
monótona a lo largo de toda la timeline: es una revolución continua, y cada
salto entre keyframes es menor que π.

**Cuidado con `position: fixed` y los z-index.** `fixed` crea contexto de
apilamiento. Un contenedor fijo alrededor de los capítulos encierra sus
z-index por debajo del canvas y el producto tapa el titular. Las tres capas
—`chapters--behind` (0), `.scene` (1), `chapters--front` (2)— son hermanas
dentro de `#root` a propósito.

**Encuadre automático.** `CameraRig` calcula la distancia mínima a la que el
objeto cabe con el fov y el aspect reales, en vez de fiarlo a valores fijos.
El mismo storyboard funciona en 21:9 y en un móvil en vertical, y la cámara se
aleja sola cuando el despiece hace crecer el conjunto.

**Iluminación: el contraluz no es decoración.** Un objeto negro sobre fondo
negro no existe sin rim light. La luz más fuerte de la escena está detrás del
producto. El entorno se construye con `Lightformer`s en vez de cargar un HDRI:
sin fetch externo, y permite colocar los reflejos exactamente donde se quiere.

**Materiales: la rugosidad manda sobre el color.** En las piezas planas y
grandes lo que las vuelve grises no es el color ni el mapa de entorno, sino el
lóbulo especular de las luces directas — un brillo blanco independiente del
baseColor. Se corrige subiendo la rugosidad, no oscureciendo el color.

---

## Responsive

| | Móvil | Tablet | Desktop |
|---|---|---|---|
| Recorrido del pin | 300vh | 380vh | 480vh |
| Timeline | reducida | reducida | completa |
| Vuelta a suela | no | no | sí |
| Etiquetas del despiece | lista en el DOM | lista en el DOM | ancladas en 3D |
| Parallax de puntero | no | no | sí |
| DPR | 1 | 1–1.5 | 1–2 |

En vertical la zapatilla ocupa todo el ancho, así que los capítulos centrados
pasan **delante** del producto; en desktop van detrás, con la zapatilla
recortándose sobre la tipografía.

---

## Rendimiento

Medido sobre el build de producción:

| | gzip |
|---|---|
| `r3f` (three + R3F + drei) | 340 KB |
| `motion` (GSAP + ScrollTrigger + Lenis) | 53 KB |
| App + entrada + CSS | 15 KB |
| **JS inicial** | **≈ 408 KB** |
| Modelo | 188 KB / 123 KB |

- `frameloop` pasa a `never` cuando la sección de scroll sale de pantalla: el
  resto de la página cuesta 0 % de GPU. También se pausa con la pestaña oculta.
- `PerformanceMonitor` degrada el DPR en caliente si el framerate cae.
- El postprocesado **se retiró**: costaba 200 KB gz y duplicaba three en el
  bundle a cambio de un bloom que, sobre negro y con el especular ya contenido,
  no se distinguía. La viñeta se resuelve con un gradiente CSS.
- Delta acotado a 50 ms: al volver de una pestaña en segundo plano, un delta
  enorme daba un salto brusco.

**Pendiente si se quiere bajar más:** los 340 KB son casi todos drei. Sustituir
`<Environment>` por un PMREM propio y `<Html>` por un overlay manual quitaría
buena parte, a costa de más código propio.

---

## Accesibilidad

- **Todo el texto de los diez capítulos está en el DOM en orden de lectura**
  desde el primer render. Un lector de pantalla recorre la historia entera sin
  hacer scroll. Las etiquetas del despiece son `<Html>` con texto real, no
  rótulos pintados en la textura.
- Navegación por capítulos con teclado (flechas, Home, End) sobre el raíl de
  progreso. Con casi 500vh de recorrido secuestrado, es la vía de escape.
- Skip link que salta el pin entero.
- `prefers-reduced-motion`: sin pin, sin scrub, sin parallax. El contenido pasa
  a ser un documento normal y el producto se renderiza en su pose hero.
- Sin WebGL: el mismo documento, con aviso.
- Contraste verificado: texto primario 17:1, secundario 8.6:1. `--fog-400`
  queda en 3.8:1 y **sólo se usa a ≥24 px o como elemento decorativo**.
- Objetivos táctiles de 48 px con separación.

---

## Testing

```bash
npm test                    # los tres proyectos
npm run test:desktop
npm run test:mobile
npm run storyboard          # 22 fotogramas en storyboard/
```

48 tests sobre tres motores — Chrome desktop 1440×900, Chromium en emulación
Pixel 7 y WebKit iPhone 13 — cubriendo carga del GLB, contexto WebGL, errores
de consola, overflow horizontal en cinco puntos del recorrido, elementos fuera
del viewport, ritmo de capítulos, despiece, botones, navegación, foco, skip
link y movimiento reducido.

Headless necesita WebGL por software; los flags están en `playwright.config.ts`.
Sin ellos la suite mediría una página que no es la real.

---

## Nota sobre la marca

Pieza de estudio. Se usa el nombre real del producto a petición del cliente;
no se reproduce el swoosh ni el wordmark oficial. La identidad visual del
modelo son las doce columnas y el cage, no el logotipo.
