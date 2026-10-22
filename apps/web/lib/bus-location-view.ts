import { components } from '@/generated/oas'
import { BusLocation, BusLocationRoute, distanceMeters } from '@/lib/bus-location'

type BusStopGroup = components['schemas']['Models.BusStopGroup']

export interface BusMapStop {
  name: string
  lat: number
  lng: number
  kind: 'departure' | 'destination'
}

export interface BusMapBus extends BusLocation {
  // approaching: 出発地に向かっている / departed: 行先に向かっている
  variant: 'approaching' | 'departed'
}

export interface BusListItem {
  bus: BusMapBus
  // approaching は出発地まで、departed は行先までの直線距離
  distance: number | null
  ageSeconds: number | null
}

export interface BusLocationView {
  stops: BusMapStop[]
  origin: BusMapStop | null
  target: BusMapStop | null
  mapBuses: BusMapBus[]
  approaching: BusListItem[]
  departed: BusListItem[]
  // 出発地に一番近い、これから来るバス
  nextBus: BusListItem | null
  latestAgeSeconds: number | null
}

// 出発地・行先のバス停（名前はグループ名を使う）
export function getRouteStops(route: BusLocationRoute, busStopGroups: BusStopGroup[]) {
  const find = (stopId: number, kind: BusMapStop['kind']): BusMapStop | null => {
    const group = busStopGroups.find((g) => g.busStops.some((s) => s.id === stopId))
    const stop = group?.busStops.find((s) => s.id === stopId)
    return group && stop?.lat !== undefined && stop.lng !== undefined
      ? { name: group.name, lat: stop.lat, lng: stop.lng, kind }
      : null
  }
  const origin = find(route.originStopId, 'departure')
  const target = find(route.targetStopId, 'destination')
  return { origin, target, stops: [origin, target].filter((s): s is BusMapStop => s !== null) }
}

export function buildBusLocationView(
  route: BusLocationRoute,
  buses: BusLocation[],
  stops: { origin: BusMapStop | null; target: BusMapStop | null; stops: BusMapStop[] },
  fetchedAt: number | null
): BusLocationView {
  const { origin, target } = stops

  // 選んだ向きと逆向きに走っているバスは、折り返して出発地から乗れるバス
  const mapBuses: BusMapBus[] = buses.map((bus) => ({
    ...bus,
    variant: bus.direction === route.direction ? 'departed' : 'approaching',
  }))

  const toItem = (bus: BusMapBus): BusListItem => {
    const stop = bus.variant === 'approaching' ? origin : target
    return {
      bus,
      distance: stop ? distanceMeters(bus.lat, bus.lon, stop.lat, stop.lng) : null,
      ageSeconds: fetchedAt
        ? Math.max(0, Math.round((fetchedAt - new Date(bus.recorded_at).getTime()) / 1000))
        : null,
    }
  }
  const byDistance = (a: BusListItem, b: BusListItem) => (a.distance ?? 0) - (b.distance ?? 0)

  const approaching = mapBuses
    .filter((bus) => bus.variant === 'approaching')
    .map(toItem)
    .sort(byDistance)
  const departed = mapBuses
    .filter((bus) => bus.variant === 'departed')
    .map(toItem)
    .sort(byDistance)

  const latestAgeSeconds = [...approaching, ...departed].reduce<number | null>(
    (min, item) => (item.ageSeconds === null ? min : Math.min(min ?? Infinity, item.ageSeconds)),
    null
  )

  return {
    ...stops,
    mapBuses,
    approaching,
    departed,
    nextBus: approaching.find((item) => !item.bus.stale) ?? approaching[0] ?? null,
    latestAgeSeconds,
  }
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}秒前`
  return `${Math.floor(seconds / 60)}分前`
}
