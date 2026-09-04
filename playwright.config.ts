import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: {
      // Headless necesita WebGL por software; sin estos flags el canvas
      // no obtiene contexto y la suite mide una página que no es la real.
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
      ],
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // Chromium en emulación móvil: cubre Android, que es donde más duele
      // el presupuesto de GPU.
      name: 'mobile',
      use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' },
    },
    {
      // WebKit es el motor que peor lleva 100vh y el scroll secuestrado.
      // Si la experiencia aguanta aquí, aguanta en cualquier sitio.
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 90_000,
  },
})
