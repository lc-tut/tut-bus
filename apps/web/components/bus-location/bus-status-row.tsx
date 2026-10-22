'use client'

import { components } from '@/generated/oas'
import { resolveBusLocationRoute } from '@/lib/bus-location'
import { useBusLocationView } from '@/lib/hooks/use-bus-location-view'
import { useInView } from '@/lib/hooks/use-in-view'
import { cn } from '@/lib/utils'
import { busLocationSelectionAtom } from '@/store'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { FaMapMarkedAlt } from 'react-icons/fa'
import { getStatusText, LiveDot, NextBusSummary } from './parts'

type BusStopGroup = components['schemas']['Models.BusStopGroup']

interface BusStatusRowProps {
  departureGroup: BusStopGroup
  destinationStopId: number | null
  busStopGroups: BusStopGroup[]
}

/**
 * PC の時刻表カードに出す、次に来るバスの表示
 * クリックすると、右側の地図をこのカードの区間に切り替える
 */
export function BusStatusRow({
  departureGroup,
  destinationStopId,
  busStopGroups,
}: BusStatusRowProps) {
  const { ref, inView } = useInView<HTMLButtonElement>()
  const [selection, setSelection] = useAtom(busLocationSelectionAtom)
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
  const nextBus = loaded ? (view?.nextBus ?? null) : null
  const emptyText =
    loaded && !error && count > 0
      ? '接近中のバスは確認されていません'
      : getStatusText(loaded, error, count)

  const isSelected = selection.slug === route.slug && selection.direction === route.direction

  return (
    // スマホではカルーセル上の地図カードに同じ情報があるので出さない（非表示のあいだは取得もしない）
    // どの状態でも1行・同じ高さにして、カードの高さが変わらないようにする
    <button
      ref={ref}
      type="button"
      onClick={() => setSelection({ slug: route.slug, direction: route.direction })}
      aria-pressed={isSelected}
      title="右の地図でこの区間を表示"
      className={cn(
        'hidden sm:flex h-10 w-full items-center gap-2 border-b px-4 text-left transition-colors',
        isSelected ? 'bg-blue-50 dark:bg-blue-900/40' : 'hover:bg-muted/60'
      )}
    >
      {nextBus ? (
        // 更新時刻は右の地図に出しているので、ここでは出さずに距離を優先する
        <NextBusSummary nextBus={nextBus} hasAnyBus />
      ) : (
        <>
          <LiveDot active={false} />
          <span className="min-w-0 flex-1 text-sm font-semibold truncate">{emptyText}</span>
        </>
      )}
      <FaMapMarkedAlt
        className={cn(
          'size-3.5 shrink-0',
          isSelected ? 'text-primary' : 'text-muted-foreground/60'
        )}
        aria-hidden
      />
    </button>
  )
}
