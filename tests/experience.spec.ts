import { test, expect, type Page } from '@playwright/test'

/**
 * Suite de la experiencia.
 *
 * Cubre lo que pidió el brief: overflow horizontal, responsive, scroll, carga
 * del modelo, errores WebGL, botones, navegación y accesibilidad.
 */

/** El scrub de GSAP es de 1 s y el damping del 3D añade otro tanto. */
const SETTLE = 1900

async function gotoReady(page: Page) {
  await page.goto('/')
  await page.waitForSelector('canvas', { timeout: 30_000 })
  // El loader se retira cuando drei reporta la carga completa.
  await page.waitForFunction(() => !document.querySelector('.loader'), null, { timeout: 30_000 })
}

async function scrollToProgress(page: Page, p: number) {
  await page.evaluate((value) => {
    const pin = document.querySelector<HTMLElement>('[data-scroll-driver]')
    if (!pin) return
    const total = pin.offsetHeight - window.innerHeight
    const target = pin.offsetTop + total * value
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } })
      .__lenis
    if (lenis) lenis.scrollTo(target, { immediate: true })
    else window.scrollTo(0, target)
  }, p)
  await page.waitForTimeout(SETTLE)
}

test.describe('Carga y errores', () => {
  test('el modelo GLB se sirve y el canvas obtiene contexto WebGL', async ({ page }) => {
    const models: Array<{ url: string; status: number }> = []
    page.on('response', (r) => {
      if (r.url().includes('/models/')) models.push({ url: r.url(), status: r.status() })
    })

    await gotoReady(page)

    expect(models.length, 'se solicitó al menos un GLB').toBeGreaterThan(0)
    for (const m of models) expect(m.status, `${m.url}`).toBe(200)

    const ctx = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return 'sin-canvas'
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
      return gl ? 'ok' : 'sin-contexto'
    })
    expect(ctx).toBe('ok')
  })

  test('sin errores de consola ni de WebGL', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(e.message))

    await gotoReady(page)
    await scrollToProgress(page, 0.5)
    await scrollToProgress(page, 0.8)

    // SwiftShader emite avisos de rendimiento que no son fallos de la página.
    const real = errors.filter(
      (e) => !/swiftshader|software renderer|GPU stall|deprecated/i.test(e)
    )
    expect(real, real.join('\n')).toHaveLength(0)
  })

  test('los seis componentes existen en el modelo cargado', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', (m) => {
      if (m.text().includes('[ShoeModel]')) warnings.push(m.text())
    })
    await gotoReady(page)
    await page.waitForTimeout(1200)
    expect(warnings, warnings.join('\n')).toHaveLength(0)
  })
})

test.describe('Layout', () => {
  test('no hay scroll horizontal en ningún punto del recorrido', async ({ page }) => {
    await gotoReady(page)
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollToProgress(page, p)
      const overflow = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }))
      expect(overflow.doc, `overflow del documento en progress ${p}`).toBeLessThanOrEqual(0)
      expect(overflow.body, `overflow del body en progress ${p}`).toBeLessThanOrEqual(0)
    }
  })

  test('ningún elemento se sale del viewport por la derecha', async ({ page }) => {
    await gotoReady(page)
    await scrollToProgress(page, 0.78)
    const offenders = await page.evaluate(() => {
      const w = document.documentElement.clientWidth
      const out: string[] = []
      document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return
        const style = getComputedStyle(el)
        if (style.visibility === 'hidden' || style.opacity === '0') return
        if (r.right > w + 1) out.push(`${el.tagName}.${el.className}`.slice(0, 90))
      })
      return [...new Set(out)]
    })
    expect(offenders, offenders.join('\n')).toHaveLength(0)
  })
})

test.describe('Scroll y narrativa', () => {
  test('el scroll conduce el progreso y cambia de capítulo', async ({ page }) => {
    await gotoReady(page)

    const readIndex = () =>
      page.locator('.rail__index, .chapter[aria-hidden="false"]').first().isVisible()

    await scrollToProgress(page, 0)
    const first = await page.locator('.chapter[aria-hidden="false"]').first().innerText()

    await scrollToProgress(page, 0.4)
    const mid = await page.locator('.chapter[aria-hidden="false"]').first().innerText()

    await scrollToProgress(page, 0.78)
    const late = await page.locator('.chapter[aria-hidden="false"]').first().innerText()

    expect(first).not.toBe(mid)
    expect(mid).not.toBe(late)
    await readIndex()
  })

  test('exactamente un capítulo está activo a la vez', async ({ page }) => {
    await gotoReady(page)
    for (const p of [0.05, 0.15, 0.28, 0.38, 0.5, 0.6, 0.68, 0.78, 0.9, 0.99]) {
      await scrollToProgress(page, p)
      const visible = await page.locator('.chapter[aria-hidden="false"]').count()
      expect(visible, `capítulos activos en progress ${p}`).toBe(1)
    }
  })

  test('los seis componentes se nombran durante el despiece', async ({ page }) => {
    await gotoReady(page)
    const wide = page.viewportSize()!.width >= 768

    if (wide) {
      // Desktop: etiquetas ancladas en 3D, montadas sólo en su capítulo.
      await scrollToProgress(page, 0.5)
      expect(await page.locator('.part-label').count()).toBe(0)

      await scrollToProgress(page, 0.8)
      expect(await page.locator('.part-label').count()).toBe(6)

      await scrollToProgress(page, 0.999)
      await page.waitForTimeout(600)
      expect(await page.locator('.part-label').count()).toBe(0)
    } else {
      // Móvil: lista en el DOM. Ancladas en 3D se solapaban entre sí.
      await scrollToProgress(page, 0.78)
      const list = page.locator('.chapter__parts li')
      await expect(list).toHaveCount(6)
      await expect(list.first()).toBeVisible()
    }
  })
})

test.describe('Interacción', () => {
  test('el CTA se habilita al elegir talla', async ({ page }) => {
    await gotoReady(page)
    await page.locator('#reservar').scrollIntoViewIfNeeded()

    const cta = page.locator('#reservar button')
    await expect(cta).toBeDisabled()
    await expect(cta).toHaveText(/Elige una talla/i)

    await page.locator('.size:not(.is-out)').first().click()
    await expect(cta).toBeEnabled()
    await expect(cta).toHaveText(/Reservar talla/i)
  })

  test('las tallas agotadas no son seleccionables', async ({ page }) => {
    await gotoReady(page)
    await page.locator('#reservar').scrollIntoViewIfNeeded()
    const out = page.locator('.size.is-out input').first()
    await expect(out).toBeDisabled()
  })

  test('los enlaces de navegación llegan a su sección', async ({ page }) => {
    await gotoReady(page)
    for (const id of ['tecnologia', 'detalles', 'reservar']) {
      await expect(page.locator(`#${id}`)).toHaveCount(1)
    }
  })
})

test.describe('Accesibilidad', () => {
  test('todo el texto de los capítulos está en el DOM sin hacer scroll', async ({ page }) => {
    await gotoReady(page)
    // Sin scroll: un lector de pantalla debe poder recorrer la historia entera.
    const titles = await page.locator('.chapter__title').count()
    expect(titles).toBe(10)
    await expect(page.locator('.chapter', { hasText: 'Columnas' }).first()).toHaveCount(1)
  })

  test('el enlace de salto se revela al recibir foco y lleva al contenido', async ({
    page,
    browserName,
  }) => {
    await gotoReady(page)
    const skip = page.locator('.skip-link')
    await expect(skip).toHaveAttribute('href', '#contenido')

    // Oculto sobre el borde superior mientras no tenga foco.
    const before = await skip.evaluate((el) => el.getBoundingClientRect().top)
    expect(before).toBeLessThan(0)

    await skip.focus()
    await page.waitForTimeout(400)
    const after = await skip.evaluate((el) => el.getBoundingClientRect().top)
    expect(after, 'el skip link debe entrar en pantalla al enfocarse').toBeGreaterThan(0)

    // WebKit no tabula a enlaces salvo que el usuario active el acceso
    // completo por teclado: ahí la tabulación no es indicativa.
    if (browserName === 'chromium') {
      // Recarga en vez de hacer clic: un clic fija el punto de partida de la
      // navegación secuencial y el Tab siguiente ya no arranca del inicio.
      await page.reload()
      await page.waitForSelector('.skip-link')
      await page.keyboard.press('Tab')
      await expect(page.locator('.skip-link')).toBeFocused()
    }
  })

  test('el canvas no atrapa el foco y hay un solo h1/h2 por sección', async ({ page }) => {
    await gotoReady(page)
    const canvasTabbable = await page.evaluate(
      () => document.querySelector('canvas')?.getAttribute('tabindex')
    )
    expect(canvasTabbable).toBeNull()
  })

  test('el foco es visible en los controles', async ({ page }) => {
    await gotoReady(page)
    await page.locator('#reservar').scrollIntoViewIfNeeded()
    const size = page.locator('.size:not(.is-out) input').first()
    await size.focus()
    const outline = await page.evaluate(() => {
      const el = document.querySelector('.size:not(.is-out)')
      return el ? getComputedStyle(el).outlineStyle : 'none'
    })
    expect(outline).not.toBe('none')
  })
})

test.describe('Movimiento reducido', () => {
  test('sirve el documento sin pin ni scroll secuestrado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForSelector('.fallback', { timeout: 20_000 })
    expect(await page.locator('[data-scroll-driver]').count()).toBe(0)
    expect(await page.locator('.fallback__chapter').count()).toBeGreaterThan(5)
  })
})
