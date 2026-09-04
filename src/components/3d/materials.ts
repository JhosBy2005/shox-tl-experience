import * as THREE from 'three'

/**
 * Materiales de la zapatilla.
 *
 * El GLB solo transporta geometria y nombres; los materiales viven aqui para
 * poder afinar el look sin reconstruir el modelo.
 *
 * En la referencia el objeto es integramente negro: la forma se lee por el
 * CONTRASTE DE ACABADO, no por color. Por eso los baseColor son casi identicos
 * y lo que cambia de verdad es la rugosidad.
 *
 * Leccion que costo encontrar: en las piezas planas y grandes -placa,
 * plantilla, suela- lo que las volvia grises NO era el color ni el mapa de
 * entorno, sino el LOBULO ESPECULAR DE LAS LUCES DIRECTAS. Una superficie
 * amplia orientada hacia la key devuelve un brillo blanco que no depende del
 * baseColor. Se corrige subiendo la rugosidad, no oscureciendo el color.
 */
export type MaterialKey = 'gloss' | 'chassis' | 'textile' | 'nylon' | 'foam' | 'rubber'

export function createMaterials(): Record<MaterialKey, THREE.MeshPhysicalMaterial> {
  return {
    /**
     * TPU charol: cage y columnas. Produce los reflejos duros que dibujan la
     * silueta contra el fondo negro. Superficies pequenas y curvas: aqui el
     * especular estrecho SI interesa.
     */
    gloss: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0a0a0c'),
      roughness: 0.22,
      metalness: 0.0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      envMapIntensity: 0.78,
      reflectivity: 0.32,
    }),
    /**
     * Chasis de la mediasuela: la superficie plana mas grande del objeto.
     * Satinada y sin clearcoat.
     */
    chassis: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#08080a'),
      roughness: 0.86,
      metalness: 0.0,
      clearcoat: 0.0,
      envMapIntensity: 0.12,
    }),
    /** Mesh tecnico mate del upper. Es el fondo sobre el que brilla el cage. */
    textile: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0e0e12'),
      roughness: 0.88,
      metalness: 0.0,
      sheen: 0.35,
      sheenRoughness: 0.9,
      sheenColor: new THREE.Color('#2b2b38'),
      envMapIntensity: 0.75,
    }),
    /**
     * Cordones. Cilindros finos: necesitan algo de brillo para leerse como
     * cordon trenzado y no como alambre negro.
     */
    nylon: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0d0d11'),
      roughness: 0.6,
      metalness: 0.0,
      envMapIntensity: 0.55,
    }),
    /** Espuma de la plantilla. Solo se ve despiezada, y ahi debe seguir negra. */
    foam: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#08080b'),
      roughness: 0.96,
      metalness: 0.0,
      envMapIntensity: 0.08,
    }),
    /** Caucho de la suela: el mas apagado de todos. */
    rubber: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#060608'),
      roughness: 0.95,
      metalness: 0.0,
      envMapIntensity: 0.08,
    }),
  }
}

export function disposeMaterials(mats: Record<MaterialKey, THREE.Material>) {
  Object.values(mats).forEach((m) => m.dispose())
}
