/**
 * SW の bus-timetable-api キャッシュから直接レスポンスを読み取るユーティリティ。
 * API サーバーがダウン/オフラインでも、以前取得したデータを返せる。
 */

export const CACHE_NAME = 'bus-timetable-api'

/**
 * 指定パスに一致するキャッシュエントリを返す。
 */
export async function getCachedResponse<T>(pathname: string): Promise<T | null> {
  try {
    if (!('caches' in window)) {
      return null
    }
    const cache = await caches.open(CACHE_NAME)
    const keys = await cache.keys()
    const match = keys.find((req) => {
      const url = new URL(req.url)
      return url.pathname === pathname || url.pathname.endsWith(pathname)
    })
    if (match) {
      const response = await cache.match(match)
      if (response && response.ok) {
        return response.json() as Promise<T>
      }
    }
  } catch {
    // Cache API が使えない環境では無視
  }
  return null
}

/**
 * 指定グループIDの時刻表キャッシュを返す。
 * date で指定した日付に完全一致するキャッシュのみ返す。
 */
export async function getLatestCachedTimetable<T>(
  groupId: number,
  date: string
): Promise<T | null> {
  try {
    if (!('caches' in window)) return null
    const cache = await caches.open(CACHE_NAME)
    const keys = await cache.keys()
    const timetableKey = keys.find((req) => {
      const url = new URL(req.url)
      const pathMatch =
        url.pathname.includes(`/api/bus-stops/groups/${groupId}/timetable`) ||
        url.pathname.includes(`/api/bus-stops/groups%2F${groupId}%2Ftimetable`)
      return pathMatch && url.searchParams.get('date') === date
    })
    if (!timetableKey) return null

    const resp = await cache.match(timetableKey)
    if (resp && resp.ok) {
      return resp.json() as Promise<T>
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * キャッシュ済み時刻表データにバス便が1つ以上あるか確認する。
 * offline-banner や ~offline ページで共通利用するヘルパー。
 */
export async function hasCachedBusData(): Promise<boolean> {
  try {
    if (!('caches' in window)) return false
    const cache = await caches.open(CACHE_NAME)
    const keys = await cache.keys()
    for (const req of keys) {
      const url = new URL(req.url)
      if (
        !url.pathname.includes('/api/bus-stops/groups/') ||
        !url.pathname.includes('/timetable')
      )
        continue
      const resp = await cache.match(req)
      if (!resp || !resp.ok) continue
      try {
        const data = await resp.clone().json()
        if (data?.segments) {
          let busCount = 0
          for (const seg of data.segments) {
            busCount += seg.segmentType === 'fixed' ? (seg.times?.length ?? 0) : 1
          }
          if (busCount > 0) return true
        }
      } catch {
        continue
      }
    }
  } catch {
    // ignore
  }
  return false
}
