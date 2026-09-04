/**
 * Captura un fotograma por capítulo, en desktop y en móvil.
 *
 *   node scripts/capture-storyboard.mjs
 *
 * Sirve para revisar la coreografía sin tener que recorrer 480vh a mano, y
 * para detectar regresiones visuales comparando ejecuciones.
 * Requiere el servidor de desarrollo levantado en :5173.
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'storyboard')
const URL = process.env.URL ?? 'http://localhost:5173/'

/** Punto medio de cada capítulo: el estado que lo representa. */
const FRAMES = [
  ['01-hero', 0.02],
  ['02-lateral', 0.14],
  ['03-frontal', 0.26],
  ['04-columnas', 0.38],
  ['05-cenital', 0.5],
  ['06-suela', 0.6],
  ['07-editorial', 0.68],
  ['08-despiece', 0.79],
  ['09-hold', 0.86],
  ['10-ensamblado', 0.92],
  ['11-cta', 0.995],
]

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, dsf: 1 },
  { name: 'mobile', width: 390, height: 844, dsf: 2 },
]

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})

await mkdir(OUT, { recursive: true })

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
  })
  const page = await ctx.newPage()
  await page.goto(URL)
  await page.waitForSelector('canvas', { timeout: 40_000 })
  await page.waitForFunction(() => !document.querySelector('.loader'), null, { timeout: 40_000 })
  // Un respiro extra: el environment map se cuece en el primer frame útil.
  await page.waitForTimeout(1500)

  for (const [label, p] of FRAMES) {
    await page.evaluate((value) => {
      const pin = document.querySelector('[data-scroll-driver]')
      if (!pin) return
      const total = pin.offsetHeight - window.innerHeight
      const lenis = window.__lenis
      const target = pin.offsetTop + total * value
      if (lenis) lenis.scrollTo(target, { immediate: true })
      else window.scrollTo(0, target)
    }, p)
    // scrub de 1 s + damping de la escena.
    await page.waitForTimeout(2200)
    const file = resolve(OUT, `${vp.name}-${label}.png`)
    await page.screenshot({ path: file })
    console.log(`  ${vp.name}  p=${p.toFixed(3)}  ->  storyboard/${vp.name}-${label}.png`)
  }
  await ctx.close()
}

await browser.close()
console.log(`\n${FRAMES.length * VIEWPORTS.length} fotogramas en ${OUT}`)
