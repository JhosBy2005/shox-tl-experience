/**
 * Constructores de geometria para cada componente despiezable.
 * Cada funcion devuelve una BufferGeometry de three lista para exportar.
 */
import {
  BufferGeometry, BufferAttribute, Vector2, Vector3,
  LatheGeometry, TubeGeometry, BoxGeometry, CatmullRomCurve3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  xOf, footHalfWidth, upperBottom, upperExpo, upperOpening,
  upperPoint, outsoleTop, plateBottom, PILLAR_STATIONS,
} from './profiles.mjs'

const TAU = Math.PI * 2

/* ------------------------------------------------------------------------
   Superficie barrida generica.
   pointFn(t, theta) -> [x,y,z].  thetaMaxFn(t) -> apertura (PI = cerrada).
   ------------------------------------------------------------------------ */
function sweptSurface(pointFn, thetaMaxFn, nx, nt, flip = false) {
  const pos = new Float32Array((nx + 1) * (nt + 1) * 3)
  const uv = new Float32Array((nx + 1) * (nt + 1) * 2)
  const idx = []
  let p = 0
  let q = 0
  for (let i = 0; i <= nx; i++) {
    const t = i / nx
    const tm = thetaMaxFn(t)
    for (let j = 0; j <= nt; j++) {
      const v = j / nt
      const point = pointFn(t, -tm + 2 * tm * v)
      pos[p++] = point[0]
      pos[p++] = point[1]
      pos[p++] = point[2]
      uv[q++] = t
      uv[q++] = v
    }
  }
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nt; j++) {
      const a = i * (nt + 1) + j
      const b = a + nt + 1
      const c = b + 1
      const d = a + 1
      if (flip) idx.push(a, c, b, a, d, c)
      else idx.push(a, b, c, a, c, d)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Solido cerrado tipo losa que sigue la huella. Reutilizado por suela, placa y plantilla. */
function sweptSolid({ halfWidth, yBottom, yTop, expo = () => 4.5, nx = 56, nt = 22, widthScale = 1 }) {
  const pt = (t, theta) => {
    const w = Math.max(0.004, halfWidth(t) * widthScale)
    const b = yBottom(t)
    const tp = yTop(t)
    const yc = (b + tp) / 2
    const h = Math.max(0.004, (tp - b) / 2)
    const e = 2 / expo(t)
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    return [
      xOf(t),
      yc - h * Math.sign(c) * Math.pow(Math.abs(c), e),
      w * Math.sign(s) * Math.pow(Math.abs(s), e),
    ]
  }
  return sweptSurface(pt, () => Math.PI, nx, nt)
}

/* ---- UPPER ------------------------------------------------------------- */

/** Cascara del upper: superficie exterior + interior + costura del canto de la boca. */
export function buildUpperShell({ nx = 72, nt = 36, thickness = 0.03 } = {}) {
  const outer = sweptSurface((t, th) => upperPoint(t, th, 0), upperOpening, nx, nt)
  const inner = sweptSurface((t, th) => upperPoint(t, th, thickness), upperOpening, nx, nt, true)

  // Costura del canto: solo donde la seccion esta realmente abierta.
  const rims = []
  for (const side of [-1, 1]) {
    const pos = []
    const uv = []
    const idx = []
    const rows = []
    for (let i = 0; i <= nx; i++) {
      const t = i / nx
      if (upperOpening(t) > Math.PI - 0.06) continue
      rows.push(t)
    }
    rows.forEach((t, r) => {
      const th = side * upperOpening(t)
      const o = upperPoint(t, th, 0)
      const n = upperPoint(t, th, thickness)
      pos.push(o[0], o[1], o[2], n[0], n[1], n[2])
      uv.push(t, 0, t, 1)
      if (r > 0) {
        const a = (r - 1) * 2
        const b = a + 1
        const c = a + 2
        const d = a + 3
        if (side > 0) idx.push(a, c, d, a, d, b)
        else idx.push(a, d, c, a, b, d)
      }
    })
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
    g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    rims.push(g)
  }
  return mergeGeometries([outer, inner, ...rims], false)
}

/** Nervios del cage: los tubos brillantes que barren en diagonal. Firma visual del modelo. */
export function buildCageRibs({ count = 9, radius = 0.024, radial = 6, seg = 20 } = {}) {
  const geos = []
  for (let i = 0; i < count; i++) {
    const tBase = 0.285 + (i / (count - 1)) * 0.545
    for (const side of [-1, 1]) {
      const pts = []
      for (let k = 0; k <= 12; k++) {
        const u = k / 12
        const t = Math.min(0.985, Math.max(0.015, tBase - u * 0.105))
        const open = upperOpening(t)
        const thMax = Math.min(open * 0.92, Math.PI * 0.8)
        const th = side * (0.34 + u * (thMax - 0.34))
        pts.push(new Vector3(...upperPoint(t, th, -0.011)))
      }
      const curve = new CatmullRomCurve3(pts, false, 'centripetal', 0.4)
      geos.push(new TubeGeometry(curve, seg, radius, radial, false))
    }
  }
  return mergeGeometries(geos, false)
}

/* ---- MEDIASUELA: placa + 12 columnas ----------------------------------- */

const PILLAR_PROFILE = [
  [0.0, 0.0], [0.92, 0.0], [1.0, 0.045], [1.0, 0.17], [0.845, 0.225],
  [1.0, 0.28], [1.0, 0.42], [0.845, 0.475], [1.0, 0.53], [1.0, 0.67],
  [0.845, 0.725], [1.0, 0.78], [1.0, 0.955], [0.92, 1.0], [0.0, 1.0],
]

export function buildMidsolePlate() {
  return sweptSolid({
    halfWidth: footHalfWidth,
    yBottom: plateBottom,
    yTop: (t) => upperBottom(t) + 0.012,
    expo: () => 5.5,
    widthScale: 1.045,
    nx: 56,
    nt: 22,
  })
}

/** Las 12 columnas Shox. 6 estaciones x 2 lados. */
export function buildPillars({ radius = 0.126, segments = 14 } = {}) {
  const geos = []
  for (const t of PILLAR_STATIONS) {
    const yBase = outsoleTop(t)
    const h = plateBottom(t) - yBase
    const pts = PILLAR_PROFILE.map(([r, y]) => new Vector2(r * radius, y * h))
    const zOff = footHalfWidth(t) * 0.575
    for (const side of [-1, 1]) {
      const g = new LatheGeometry(pts, segments, 0, TAU)
      g.translate(xOf(t), yBase, side * zOff)
      geos.push(g)
    }
  }
  return mergeGeometries(geos, false)
}

/* ---- SUELA EXTERIOR ---------------------------------------------------- */

export function buildOutsole() {
  const slab = sweptSolid({
    halfWidth: footHalfWidth,
    yBottom: () => 0.0,
    yTop: outsoleTop,
    expo: () => 6.0,
    widthScale: 1.02,
    nx: 56,
    nt: 20,
  })
  const lugs = []
  const n = 15
  for (let i = 0; i < n; i++) {
    const t = 0.055 + (i / (n - 1)) * 0.885
    const w = footHalfWidth(t) * 1.9
    const bar = new BoxGeometry(0.075, 0.032, w * 0.92, 1, 1, 1)
    bar.translate(xOf(t), 0.006, 0)
    lugs.push(bar)
  }
  return mergeGeometries([slab, ...lugs], false)
}

/* ---- PLANTILLA --------------------------------------------------------- */

export function buildInsole() {
  return sweptSolid({
    halfWidth: (t) => footHalfWidth(t) * 0.84,
    yBottom: (t) => upperBottom(t) + 0.018,
    yTop: (t) => upperBottom(t) + 0.052,
    expo: () => 5.0,
    nx: 48,
    nt: 18,
  })
}

/* ---- LENGUETA ---------------------------------------------------------- */

const rimAt = (t) => upperPoint(t, upperOpening(t), 0)

export function buildTongue() {
  const T0 = 0.105
  const T1 = 0.615
  const span = T1 - T0
  const pt = (u, theta) => {
    const t = T0 + u * span
    const rim = rimAt(t)
    const taper = Math.min(1, Math.min(u, 1 - u) * 9 + 0.06)
    const w = Math.max(0.006, rim[2] * 0.8 * taper)
    const yc = rim[1] - 0.055
    const h = Math.max(0.006, 0.028 * taper)
    const e = 2 / 3.4
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    return [
      xOf(t),
      yc - h * Math.sign(c) * Math.pow(Math.abs(c), e),
      w * Math.sign(s) * Math.pow(Math.abs(s), e),
    ]
  }
  return sweptSurface(pt, () => Math.PI, 46, 18)
}

/* ---- CORDONES ---------------------------------------------------------- */

const EYELETS = [0.205, 0.275, 0.345, 0.415, 0.485, 0.548]

function eyelet(i, side) {
  const t = EYELETS[i]
  const rim = rimAt(t)
  return new Vector3(rim[0], rim[1] + 0.012, side * (Math.abs(rim[2]) - 0.028))
}

export function buildLaces({ radius = 0.017, radial = 5 } = {}) {
  const geos = []
  const arc = (a, b) => {
    const mid = a.clone().lerp(b, 0.5)
    mid.y += 0.052
    mid.z *= 0.28
    return new CatmullRomCurve3([a, mid, b], false, 'centripetal', 0.5)
  }
  for (const start of [-1, 1]) {
    for (let i = 0; i < EYELETS.length - 1; i++) {
      const s = i % 2 === 0 ? start : -start
      geos.push(new TubeGeometry(arc(eyelet(i, s), eyelet(i + 1, -s)), 14, radius, radial, false))
    }
  }
  for (const side of [-1, 1]) {
    const a = eyelet(0, side)
    const b = new Vector3(a.x - 0.3, a.y + 0.1, side * 0.2)
    const c = new Vector3(a.x - 0.52, a.y - 0.05, side * 0.3)
    geos.push(new TubeGeometry(new CatmullRomCurve3([a, b, c], false, 'centripetal', 0.5), 14, radius, radial, false))
  }
  return mergeGeometries(geos, false)
}

export { upperExpo }
