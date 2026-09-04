/**
 * Resolución de rutas de `/public`.
 *
 * GitHub Pages sirve los proyectos bajo `/<repo>/`, no en la raíz del dominio.
 * Con rutas absolutas (`/models/shoe.glb`) el GLB devuelve 404 en producción y
 * la escena se queda vacía sin un solo error visible en consola.
 *
 * `import.meta.env.BASE_URL` vale `/` en desarrollo y la subruta en el build,
 * así que el mismo código funciona en los dos sitios.
 */
export const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.startsWith('/') ? path.slice(1) : path}`
