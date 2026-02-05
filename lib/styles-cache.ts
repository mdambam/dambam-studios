type StylesCacheKey = 'summary' | 'full'

declare global {
  // eslint-disable-next-line no-var
  var __stylesCacheSummary: any[] | null | undefined
  // eslint-disable-next-line no-var
  var __stylesCacheSummaryTs: number | undefined
  // eslint-disable-next-line no-var
  var __stylesCacheFull: any[] | null | undefined
  // eslint-disable-next-line no-var
  var __stylesCacheFullTs: number | undefined
}

const getNow = () => Date.now()

export function getStylesCache(key: StylesCacheKey): { data: any[] | null; ts: number } {
  if (key === 'full') {
    return {
      data: globalThis.__stylesCacheFull ?? null,
      ts: globalThis.__stylesCacheFullTs ?? 0,
    }
  }

  return {
    data: globalThis.__stylesCacheSummary ?? null,
    ts: globalThis.__stylesCacheSummaryTs ?? 0,
  }
}

export function setStylesCache(key: StylesCacheKey, data: any[] | null) {
  const now = getNow()

  if (key === 'full') {
    globalThis.__stylesCacheFull = data
    globalThis.__stylesCacheFullTs = now
    return
  }

  globalThis.__stylesCacheSummary = data
  globalThis.__stylesCacheSummaryTs = now
}

export function invalidateStylesCache() {
  globalThis.__stylesCacheSummary = null
  globalThis.__stylesCacheSummaryTs = 0
  globalThis.__stylesCacheFull = null
  globalThis.__stylesCacheFullTs = 0
}
