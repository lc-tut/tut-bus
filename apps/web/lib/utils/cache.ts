/**
 * SW の bus-timetable-api キャッシュから直接レスポンスを読み取るユーティリティ。
 * API サーバーがダウン/オフラインでも、以前取得したデータを返せる。
 */

const CACHE_NAME = 'bus-timetable-api'

/**
 * 指定パスに一致するキャッシュエントリを返す。
 */
export async function getCachedResponse<T>(pathname: string): Promise<T | null> {
  try {
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
 * date が指定された場合はその日付に完全一致するキャッシュのみ返す。
 * date が省略された場合は x-sw-cached-at ヘッダーで最新のものを返す。
 */
export async function getLatestCachedTimetable<T>(
  groupId: number,
  date?: string
): Promise<T | null> {
  try {
    const cache = await caches.open(CACHE_NAME)
    const keys = await cache.keys()
    const timetableKeys = keys.filter((req) => {
      const url = new URL(req.url)
      const pathMatch =
        url.pathname.includes(`/api/bus-stops/groups/${groupId}/timetable`) ||
        url.pathname.includes(`/api/bus-stops/groups%2F${groupId}%2Ftimetable`)
      if (!pathMatch) return false
      // 日付指定がある場合は完全一致のみ
      if (date) {
        return url.searchParams.get('date') === date
      }
      return true
    })
    if (timetableKeys.length === 0) return null

    let latest: Response | null = null
    let latestTime = 0
    for (const key of timetableKeys) {
      const resp = await cache.match(key)
      if (resp && resp.ok) {
        const cachedAt = resp.headers.get('x-sw-cached-at')
        const time = cachedAt ? new Date(cachedAt).getTime() : 0
        if (!latest || time > latestTime) {
          latest = resp
          latestTime = time
        }
      }
    }
    if (latest) {
      return latest.json() as Promise<T>
    }
  } catch {
    // ignore
  }
  return null
}
