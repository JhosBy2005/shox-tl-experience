import { create } from 'zustand'
import { CHAPTERS } from '../config/storyboard'

/**
 * Estado del scroll, deliberadamente partido en dos.
 *
 * `scrollState` es un objeto plano mutable: la escena 3D lo lee 60 veces por
 * segundo en useFrame SIN suscribirse. Si esto viviera en un store de React,
 * cada frame de scroll dispararía un re-render del árbol entero y la
 * experiencia caería a ~20fps. Es la decisión de rendimiento más importante
 * de todo el proyecto.
 *
 * `useChapterStore` sí es reactivo, pero sólo cambia cuando cambia el índice
 * de capítulo — unas 10 veces en toda la página, no 60 por segundo.
 */

export const scrollState = {
  /** 0..1 sobre toda la sección de scroll. */
  progress: 0,
  /** Velocidad instantánea, para efectos de inercia. */
  velocity: 0,
  /** Desplazamiento del puntero normalizado, -1..1. */
  pointerX: 0,
  pointerY: 0,
}

interface ChapterState {
  index: number
  setIndex: (i: number) => void
}

export const useChapterStore = create<ChapterState>((set) => ({
  index: 0,
  setIndex: (index) => set((s) => (s.index === index ? s : { index })),
}))

export function chapterAt(progress: number): number {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (progress >= CHAPTERS[i].from) return i
  }
  return 0
}

let lastProgress = 0

export function setProgress(p: number) {
  scrollState.velocity = p - lastProgress
  lastProgress = p
  scrollState.progress = p

  const next = chapterAt(p)
  const store = useChapterStore.getState()
  if (store.index !== next) store.setIndex(next)
}

export const getProgress = () => scrollState.progress
