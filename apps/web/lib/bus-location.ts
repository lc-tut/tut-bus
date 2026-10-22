// 大学が公開しているバス位置情報（イマロケ）の取得まわり
// 公式ドキュメントのない API なので、レスポンスは最低限の項目だけ型を付けて使う

const BUS_LOCATION_API_BASE = 'https://sloc.orgncdn.net/api/v1/public/Kyg1404'
const BUS_LOCATION_RIDER_BASE = 'https://rider.imaroke.com/Kyg1404'

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

interface BusLocationRouteDef {
  slug: 'hachioji' | 'minamino' | 'kaikan'
  // apps/api/data/bus_stops.json の ID
  stationStopId: number
  campusStopId: number
}

const ROUTES: BusLocationRouteDef[] = [
  { slug: 'hachioji', stationStopId: 1, campusStopId: 3 },
  { slug: 'minamino', stationStopId: 2, campusStopId: 5 },
  { slug: 'kaikan', stationStopId: 6, campusStopId: 4 },
]

export interface BusLocationRoute {
  slug: BusLocationRouteDef['slug']
  direction: BusLocationDirection
  // バスが向かっている先のバス停 ID（距離の計算に使う）
  targetStopId: number
}

// 出発地のバス停と行先のバス停から、位置情報の路線と向きを決める
export function resolveBusLocationRoute(
  departureStopIds: number[],
  destinationStopId: number | null
): BusLocationRoute | null {
  if (destinationStopId === null) return null

  for (const route of ROUTES) {
    if (destinationStopId === route.stationStopId) {
      return { slug: route.slug, direction: 'forward', targetStopId: route.stationStopId }
    }
    if (departureStopIds.includes(route.stationStopId)) {
      return { slug: route.slug, direction: 'reverse', targetStopId: route.campusStopId }
    }
  }
  return null
}

export async function fetchBusLocations(
  slug: BusLocationRoute['slug'],
  signal?: AbortSignal
): Promise<BusLocation[]> {
  const res = await fetch(`${BUS_LOCATION_API_BASE}/${slug}/status`, { signal })
  if (!res.ok) throw new Error(`bus location api responded ${res.status}`)
  const data: unknown = await res.json()
  return Array.isArray(data) ? (data as BusLocation[]) : []
}

// 公式の地図ページ（出発地のバス停を選んだ状態で開く）
export function getRiderMapUrl(route: BusLocationRoute): string {
  const stop = route.direction === 'forward' ? 'origin' : 'destination'
  return `${BUS_LOCATION_RIDER_BASE}/${route.slug}/?stop=${stop}`
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
