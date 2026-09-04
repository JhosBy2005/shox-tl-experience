import { useSyncExternalStore } from 'react'

const cache = new Map<string, MediaQueryList>()

function getList(query: string) {
  let mql = cache.get(query)
  if (!mql) {
    mql = window.matchMedia(query)
    cache.set(query, mql)
  }
  return mql
}

/**
 * useSyncExternalStore en vez de useState+useEffect: sin flash de valor
 * incorrecto en el primer render y sin re-suscripciones innecesarias.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = getList(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => getList(query).matches,
    () => false
  )
}
