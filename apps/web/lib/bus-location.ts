// 大学が公開しているバス位置情報（イマロケ）の取得まわり
// 公式ドキュメントのない API なので、レスポンスは最低限の項目だけ型を付けて使う

const BUS_LOCATION_API_BASE = 'https://sloc.orgncdn.net/api/v1/public/Kyg1404'

export const isBusLocationEnabled = process.env.NEXT_PUBLIC_BUS_LOCATION_ENABLED === 'true'

// forward: キャンパス → 駅・学生会館 / reverse: 駅・学生会館 → キャンパス
export type BusLocationDirection = 'forward' | 'reverse'

export type BusCongestion = 'low' | 'medium' | 'high'

export interface BusLocation {
  bus_id: string
  name: string
  lat: number
  lon: number
  speed: number
  heading: number
  recorded_at: string
  trip_status: string
  direction: BusLocationDirection
  congestion: BusCongestion | null
  stale: boolean
}

export const congestionLabels: Record<BusCongestion, string> = {
  low: '空席あり',
  medium: '立ち席',
  high: '満員',
}

export type BusLocationSlug = 'hachioji' | 'minamino' | 'kaikan'

export interface BusLocationRouteDef {
  slug: BusLocationSlug
  // apps/api/data/bus_stops.json の ID
  stationStopId: number
  campusStopId: number
}

export const BUS_LOCATION_ROUTES: BusLocationRouteDef[] = [
  { slug: 'hachioji', stationStopId: 1, campusStopId: 3 },
  { slug: 'minamino', stationStopId: 2, campusStopId: 5 },
  { slug: 'kaikan', stationStopId: 6, campusStopId: 4 },
]

export interface BusLocationRoute {
  slug: BusLocationSlug
  direction: BusLocationDirection
  // バスが出発するバス停 ID
  originStopId: number
  // バスが向かっている先のバス停 ID（距離の計算に使う）
  targetStopId: number
}

export function getBusLocationRoute(
  slug: BusLocationSlug,
  direction: BusLocationDirection
): BusLocationRoute {
  const def = BUS_LOCATION_ROUTES.find((route) => route.slug === slug) ?? BUS_LOCATION_ROUTES[0]
  return direction === 'forward'
    ? { slug, direction, originStopId: def.campusStopId, targetStopId: def.stationStopId }
    : { slug, direction, originStopId: def.stationStopId, targetStopId: def.campusStopId }
}

// 出発地のバス停と行先のバス停から、位置情報の路線と向きを決める
export function resolveBusLocationRoute(
  departureStopIds: number[],
  destinationStopId: number | null
): BusLocationRoute | null {
  if (destinationStopId === null) return null

  for (const route of BUS_LOCATION_ROUTES) {
    if (destinationStopId === route.stationStopId) {
      return getBusLocationRoute(route.slug, 'forward')
    }
    if (departureStopIds.includes(route.stationStopId)) {
      return getBusLocationRoute(route.slug, 'reverse')
    }
  }
  return null
}

export async function fetchBusLocations(
  slug: BusLocationSlug,
  signal?: AbortSignal
): Promise<BusLocation[]> {
  const res = await fetch(`${BUS_LOCATION_API_BASE}/${slug}/status`, { signal })
  if (!res.ok) throw new Error(`bus location api responded ${res.status}`)
  const data: unknown = await res.json()
  return Array.isArray(data) ? (data as BusLocation[]) : []
}

// 路線の経路（[経度, 緯度] の配列）
export type BusRoutePath = [number, number][]

interface BusRouteConfig {
  route?: {
    polyline_forward?: { coordinates?: BusRoutePath } | null
    polyline_reverse?: { coordinates?: BusRoutePath } | null
  }
}

// 経路はほぼ変わらないので、路線ごとに1回だけ取得する
const routePathCache = new Map<string, Promise<BusRoutePath | null>>()

export function fetchBusRoutePath(route: BusLocationRoute): Promise<BusRoutePath | null> {
  const key = `${route.slug}:${route.direction}`
  const cached = routePathCache.get(key)
  if (cached) return cached

  const promise = fetch(`${BUS_LOCATION_API_BASE}/${route.slug}/config`)
    .then((res) => (res.ok ? (res.json() as Promise<BusRouteConfig>) : null))
    .then((config) => {
      const polyline =
        route.direction === 'forward'
          ? config?.route?.polyline_forward
          : config?.route?.polyline_reverse
      return polyline?.coordinates?.length ? polyline.coordinates : null
    })
    .catch(() => {
      routePathCache.delete(key)
      return null
    })
  routePathCache.set(key, promise)
  return promise
}

// 2点間の直線距離（メートル）
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
