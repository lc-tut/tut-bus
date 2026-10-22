'use client'

import { components } from '@/generated/oas'
import { resolveBusLocationRoute } from '@/lib/bus-location'
import { formatAge } from '@/lib/bus-location-view'
import { useBusLocationView } from '@/lib/hooks/use-bus-location-view'
import { useInView } from '@/lib/hooks/use-in-view'
import { useMemo } from 'react'
import { getStatusText, LiveDot, NextBusSummary } from './parts'

type BusStopGroup = components['schemas']['Models.BusStopGroup']

interface BusStatusRowProps {
  departureGroup: BusStopGroup
  destinationStopId: number | null
  busStopGroups: BusStopGroup[]
}

/**
 * 時刻表カードに出す、運行台数と次に来るバスの1行表示
 */
export function BusStatusRow({
  departureGroup,
  destinationStopId,
  busStopGroups,
}: BusStatusRowProps) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const route = useMemo(
    () =>
      resolveBusLocationRoute(
        departureGroup.busStops.map((stop) => stop.id),
        destinationStopId
      ),
    [departureGroup, destinationStopId]
  )
  const { view, loaded, error } = useBusLocationView(route, busStopGroups, {
    enabled: inView,
    withRoutePath: false,
  })

  if (!route) return null

  const count = view ? view.mapBuses.length : 0

  return (
    <div ref={ref} className="border-b px-4 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <LiveDot active={count > 0} />
          <span className="text-sm font-semibold truncate">
            {getStatusText(loaded, error, count)}
          </span>
        </div>
        {view?.latestAgeSeconds !== null && view?.latestAgeSeconds !== undefined && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatAge(view.latestAgeSeconds)}に更新
          </span>
        )}
      </div>
      {loaded && view && count > 0 && (
        <div className="flex items-center gap-2 min-h-[24px]">
          <NextBusSummary
            nextBus={view.nextBus}
            hasAnyBus={count > 0}
            originName={view.origin?.name ?? departureGroup.name}
          />
        </div>
      )}
    </div>
  )
}
