'use client'

import { Badge } from '@/components/ui/badge'
import { components } from '@/generated/oas'
import {
  BusCongestion,
  congestionLabels,
  distanceMeters,
  getRiderMapUrl,
  resolveBusLocationRoute,
} from '@/lib/bus-location'
import { useBusLocations } from '@/lib/hooks/use-bus-locations'
import { cn } from '@/lib/utils'
import { FaBus, FaExternalLinkAlt } from 'react-icons/fa'

interface BusLocationPanelProps {
  departureGroup: components['schemas']['Models.BusStopGroup']
  destinationStopId: number | null
  busStopGroups: components['schemas']['Models.BusStopGroup'][]
}

const congestionClassNames: Record<BusCongestion, string> = {
  low: 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-800 dark:text-green-300',
  medium:
    'bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-300',
  high: 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-800 dark:text-red-300',
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}秒前`
  return `${Math.floor(seconds / 60)}分前`
}

/**
 * 選択中の出発地・行先を走っているバスの現在地を表示する
 */
export function BusLocationPanel({
  departureGroup,
  destinationStopId,
  busStopGroups,
}: BusLocationPanelProps) {
  const route = resolveBusLocationRoute(
    departureGroup.busStops.map((stop) => stop.id),
    destinationStopId
  )
  const { buses, error, loaded, fetchedAt } = useBusLocations(route)

  if (!route) return null

  const targetStop = busStopGroups
    .flatMap((group) => group.busStops)
    .find((stop) => stop.id === route.targetStopId)

  const items = buses
    .map((bus) => ({
      bus,
      distance:
        targetStop?.lat !== undefined && targetStop.lng !== undefined
          ? distanceMeters(bus.lat, bus.lon, targetStop.lat, targetStop.lng)
          : null,
      ageSeconds: fetchedAt
        ? Math.max(0, Math.round((fetchedAt - new Date(bus.recorded_at).getTime()) / 1000))
        : null,
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))

  return (
    <div className="px-4 py-3 border-b border-muted">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          バスの現在地
        </div>
        <a
          href={getRiderMapUrl(route)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          地図で見る
          <FaExternalLinkAlt className="size-2.5" />
        </a>
      </div>

      {!loaded ? (
        <p className="text-xs text-muted-foreground">位置情報を取得中...</p>
      ) : error && items.length === 0 ? (
        <p className="text-xs text-muted-foreground">位置情報を取得できませんでした</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">この方面を走っているバスはありません</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map(({ bus, distance, ageSeconds }) => (
            <li
              key={bus.bus_id}
              className={cn('flex items-center gap-2 text-sm', bus.stale && 'opacity-50')}
            >
              <FaBus className="size-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
              <span className="font-medium">{bus.name}</span>
              {distance !== null && targetStop && (
                <span className="text-xs text-muted-foreground truncate">
                  {targetStop.name}まで約{formatDistance(distance)}
                </span>
              )}
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                {bus.congestion && (
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', congestionClassNames[bus.congestion])}
                  >
                    {congestionLabels[bus.congestion]}
                  </Badge>
                )}
                {ageSeconds !== null && (
                  <span className="text-[10px] text-muted-foreground">
                    {bus.stale ? '位置が古い' : formatAge(ageSeconds)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
