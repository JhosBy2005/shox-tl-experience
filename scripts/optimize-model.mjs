/**
 * Optimiza los GLB crudos para web.
 *
 *   node scripts/optimize-model.mjs
 *
 * shoe-raw.glb      -> shoe.glb
 * shoe-lite-raw.glb -> shoe-lite.glb
 *
 * Pipeline: dedup -> weld -> reorder -> quantize -> EXT_meshopt_compression.
 * Meshopt en vez de Draco: el decoder pesa ~25 KB frente a ~200 KB de WASM y
 * descomprime varias veces mas rapido. Para una malla de 30k tris el mejor
 * ratio de Draco no compensa el peso de su decoder.
 */
import { readFile, writeFile, stat } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions'
import { dedup, weld, prune, reorder, quantize } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const JOBS = [
  ['public/models/shoe-raw.glb', 'public/models/shoe.glb'],
  ['public/models/shoe-lite-raw.glb', 'public/models/shoe-lite.glb'],
]

await MeshoptEncoder.ready
await MeshoptDecoder.ready

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })

const kb = (n) => `${(n / 1024).toFixed(0)} KB`

for (const [src, dst] of JOBS) {
  const srcPath = resolve(ROOT, src)
  const before = (await stat(srcPath)).size
  const doc = await io.readBinary(new Uint8Array(await readFile(srcPath)))

  await doc.transform(
    dedup(),
    weld(),
    prune(),
    reorder({ encoder: MeshoptEncoder }),
    // Cuantizacion: 14 bits de posicion conservan detalle de sobra a esta escala.
    quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })
  )

  doc
    .createExtension(EXTMeshoptCompression)
    .setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })

  const out = await io.writeBinary(doc)
  await writeFile(resolve(ROOT, dst), out)

  const pct = (100 - (out.byteLength / before) * 100).toFixed(0)
  console.log(`${src}  ${kb(before)}  ->  ${dst}  ${kb(out.byteLength)}   (-${pct}%)`)
}
