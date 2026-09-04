/**
 * Genera el GLB parametrico de la Nike Shox TL.
 *
 *   node scripts/build-model.mjs
 *
 * Salida: public/models/shoe-raw.glb  (desktop)
 *         public/models/shoe-lite-raw.glb (movil, menos resolucion de barrido)
 *
 * La geometria se construye con three (solo clases de core, sin DOM) y se
 * escribe con @gltf-transform/core, que si funciona en Node sin navegador.
 *
 * Cada componente sale como un Node NOMBRADO en la escena. Ese nombre es el
 * contrato con la app: ShoeExploded busca exactamente estos seis.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Box3, Vector3 } from 'three'
import { Document, NodeIO } from '@gltf-transform/core'
import {
  buildUpperShell, buildCageRibs, buildMidsolePlate, buildPillars,
  buildOutsole, buildInsole, buildTongue, buildLaces,
} from './lib/parts.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Longitud final del modelo en unidades de escena. La app encuadra sobre esto. */
const TARGET_LENGTH = 2.0

const PRESETS = {
  desktop: {
    out: 'public/models/shoe-raw.glb',
    upper: { nx: 72, nt: 36, thickness: 0.03 },
    ribs: { count: 9, radius: 0.024, radial: 6, seg: 20 },
    pillars: { radius: 0.122, segments: 14 },
    laces: { radius: 0.017, radial: 5 },
  },
  lite: {
    out: 'public/models/shoe-lite-raw.glb',
    upper: { nx: 44, nt: 22, thickness: 0.03 },
    ribs: { count: 7, radius: 0.026, radial: 4, seg: 12 },
    pillars: { radius: 0.122, segments: 10 },
    laces: { radius: 0.018, radial: 4 },
  },
}

/* ---- puente three -> gltf-transform ------------------------------------ */

function toPrimitive(doc, buffer, geo, material) {
  const prim = doc.createPrimitive().setMaterial(material).setMode(4)

  const pos = geo.getAttribute('position')
  prim.setAttribute(
    'POSITION',
    doc.createAccessor().setType('VEC3').setArray(Float32Array.from(pos.array)).setBuffer(buffer)
  )

  const nor = geo.getAttribute('normal')
  if (nor) {
    prim.setAttribute(
      'NORMAL',
      doc.createAccessor().setType('VEC3').setArray(Float32Array.from(nor.array)).setBuffer(buffer)
    )
  }

  const uv = geo.getAttribute('uv')
  if (uv) {
    prim.setAttribute(
      'TEXCOORD_0',
      doc.createAccessor().setType('VEC2').setArray(Float32Array.from(uv.array)).setBuffer(buffer)
    )
  }

  const index = geo.getIndex()
  if (index) {
    const count = pos.count
    const Arr = count > 65535 ? Uint32Array : Uint16Array
    prim.setIndices(
      doc.createAccessor().setType('SCALAR').setArray(Arr.from(index.array)).setBuffer(buffer)
    )
  }
  return prim
}

const triCount = (geo) => (geo.getIndex() ? geo.getIndex().count : geo.getAttribute('position').count) / 3

/* ---- construccion ------------------------------------------------------ */

async function build(name, preset) {
  const upperShell = buildUpperShell(preset.upper)
  const cageRibs = buildCageRibs(preset.ribs)
  const midsolePlate = buildMidsolePlate()
  const pillars = buildPillars(preset.pillars)
  const outsole = buildOutsole()
  const insole = buildInsole()
  const tongue = buildTongue()
  const laces = buildLaces(preset.laces)

  /**
   * Orden = orden de despiece. `explode` es el vector unitario por el que
   * se separa la pieza; la app lo multiplica por el escalar de scroll.
   */
  const parts = [
    { node: 'laces', material: 'nylon', geos: [laces], explode: [0, 1.0, 0], delay: 0.0 },
    { node: 'tongue', material: 'textile', geos: [tongue], explode: [0.1, 0.62, 0], delay: 0.06 },
    { node: 'upper', material: 'textile', geos: [upperShell], accent: { material: 'gloss', geos: [cageRibs] }, explode: [0, 0.44, 0], delay: 0.1 },
    { node: 'insole', material: 'foam', geos: [insole], explode: [0, 0.2, 0], delay: 0.16 },
    { node: 'midsole', material: 'chassis', geos: [midsolePlate], accent: { material: 'gloss', geos: [pillars] }, explode: [0, -0.1, 0], delay: 0.12 },
    { node: 'outsole', material: 'rubber', geos: [outsole], explode: [0, -0.46, 0], delay: 0.2 },
  ]

  // Normalizacion: centrar en el origen y escalar a TARGET_LENGTH de largo.
  const all = new Box3()
  const tmp = new Box3()
  const everyGeo = parts.flatMap((p) => [...p.geos, ...(p.accent ? p.accent.geos : [])])
  for (const g of everyGeo) {
    g.computeBoundingBox()
    all.union(tmp.copy(g.boundingBox))
  }
  const size = all.getSize(new Vector3())
  const center = all.getCenter(new Vector3())
  const scale = TARGET_LENGTH / size.x
  for (const g of everyGeo) {
    g.translate(-center.x, -center.y, -center.z)
    g.scale(scale, scale, scale)
    g.computeBoundingBox()
  }

  /* ---- documento glTF ---- */
  const doc = new Document()
  doc.createBuffer()
  const buffer = doc.getRoot().listBuffers()[0]
  const scene = doc.createScene('ShoxTL')

  const mat = (n, base, rough, metal = 0) =>
    doc.createMaterial(n).setBaseColorFactor([...base, 1]).setRoughnessFactor(rough).setMetallicFactor(metal)

  const materials = {
    // Charol TPU: cage, columnas, placa. La app le anade clearcoat.
    gloss: mat('gloss', [0.035, 0.035, 0.038], 0.13),
    // Mesh tecnico mate del upper.
    textile: mat('textile', [0.055, 0.055, 0.062], 0.88),
    // Nylon semi-mate: cordones, plantilla.
    nylon: mat('nylon', [0.045, 0.045, 0.05], 0.62),
    // Caucho de la suela.
    rubber: mat('rubber', [0.028, 0.028, 0.032], 0.76),
    // Chasis de la mediasuela: satinado, no charol.
    chassis: mat('chassis', [0.03, 0.03, 0.035], 0.86),
    // Espuma de la plantilla: solo visible en el despiece.
    foam: mat('foam', [0.03, 0.03, 0.04], 0.96),
  }

  const report = []
  let totalTris = 0

  for (const part of parts) {
    const mesh = doc.createMesh(part.node)
    let tris = 0
    for (const g of part.geos) {
      mesh.addPrimitive(toPrimitive(doc, buffer, g, materials[part.material]))
      tris += triCount(g)
    }
    if (part.accent) {
      for (const g of part.accent.geos) {
        mesh.addPrimitive(toPrimitive(doc, buffer, g, materials[part.accent.material]))
        tris += triCount(g)
      }
    }

    // Centroide local: la app lo usa como pivote de rotacion en el despiece.
    const box = new Box3()
    const t2 = new Box3()
    for (const g of [...part.geos, ...(part.accent ? part.accent.geos : [])]) box.union(t2.copy(g.boundingBox))
    const c = box.getCenter(new Vector3())

    const node = doc
      .createNode(part.node)
      .setMesh(mesh)
      .setExtras({
        explode: part.explode,
        explodeDelay: part.delay,
        centroid: [c.x, c.y, c.z],
      })
    scene.addChild(node)

    report.push({ parte: part.node, tris: Math.round(tris), prims: mesh.listPrimitives().length })
    totalTris += tris
  }

  const io = new NodeIO()
  const glb = await io.writeBinary(doc)
  const outPath = resolve(ROOT, preset.out)
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, glb)

  console.log(`\n== ${name.toUpperCase()} ==`)
  console.table(report)
  console.log(
    `total: ${Math.round(totalTris).toLocaleString('es')} tris · ` +
      `${report.reduce((a, r) => a + r.prims, 0)} draw calls · ` +
      `${(glb.byteLength / 1024).toFixed(0)} KB sin comprimir -> ${preset.out}`
  )
  console.log(
    `bbox original: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} ` +
      `(ratio largo/alto ${(size.x / size.y).toFixed(2)}) · escala aplicada ${scale.toFixed(4)}`
  )
  return { totalTris, bytes: glb.byteLength }
}

for (const [name, preset] of Object.entries(PRESETS)) {
  await build(name, preset)
}
